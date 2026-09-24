// ==============================================================================
// NEXUS AI - POST /api/security/scan/source
// ==============================================================================
// Production-grade security scanning endpoint.
// Real layered defense: Normalization, Rule-based, Heuristics, Classifier & Honeytokens.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { SecurityEngine } from "@/lib/security/security-engine";
import { SecurityService } from "@/lib/services/security.service";
import { logAuditEvent } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const headerOrg = req.headers.get("x-organization-id");
    const organizationId = headerOrg || body.organizationId || "org_primary";
    const userId = body.userId || "usr_sec_probe";
    const textToScan = body.text || "";
    const testCase = body.testCase || "DIRECT_PROBE";

    if (!textToScan.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing payload text to screen" },
        { status: 400 }
      );
    }

    // 1. Run deterministic multi-layered SecurityEngine scan
    const decision = SecurityEngine.scanSource(textToScan, {
      organizationId,
      userId,
      sourceId: `probe_${Date.now()}`,
    });

    const isHoneytoken = Boolean(decision.honeytokenTriggered);
    const hasInjection = decision.findings.some((f) => f.type === "PROMPT_INJECTION");
    const isBlocked = decision.decision === "BLOCK";

    // 2. Record Tamper-Evident SHA-256 Audit Trail
    if (isBlocked || isHoneytoken || hasInjection) {
      await logAuditEvent({
        organizationId,
        userId,
        userEmail: "security-gate@nexus.ai",
        userRole: "SECURITY_OFFICER",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-ZeroTrustSecurityPipeline",
        action: isHoneytoken
          ? "HONEYTOKEN_EXPOSURE"
          : hasInjection
          ? "PROMPT_INJECTION_BLOCKED"
          : "SECURITY_POLICY_VIOLATION",
        resourceType: isHoneytoken ? "SECURITY_CANARY" : "CONTENT_INGESTION",
        resourceId: `sec_event_${Date.now()}`,
        severity: decision.riskLevel === "CRITICAL" ? "CRITICAL" : "SECURITY_ALERT",
        details: {
          testCase,
          verdict: decision.decision,
          riskLevel: decision.riskLevel,
          confidence: decision.confidence,
          detectionVersion: decision.detectionVersion,
          policyVersion: decision.policyVersion,
          safeSummary: decision.report?.whatHappened || decision.summary,
        },
      });

      // 3. Record Security Event in database
      await SecurityService.recordSecurityEvent({
        organizationId,
        eventType: isHoneytoken
          ? ("HONEYTOKEN_EXPOSURE" as any)
          : hasInjection
          ? ("PROMPT_INJECTION_DETECTED" as any)
          : ("SECURITY_POLICY_BLOCKED" as any),
        severity: decision.riskLevel,
        description: decision.report?.whatHappened || decision.summary,
        actorId: userId,
        timestamp: new Date().toISOString(),
        status: "RESOLVED",
      });
    }

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      decision: decision.decision,
      riskLevel: decision.riskLevel,
      requiresHumanReview: decision.requiresHumanReview,
      reasons: decision.reasons,
      findingsCount: decision.findings.length,
      findings: decision.findings,
      scanId,
      confidence: decision.confidence,
      detectionVersion: decision.detectionVersion,
      policyVersion: decision.policyVersion,
      honeytokenTriggered: decision.honeytokenTriggered,
      checks: decision.checks,
      report: decision.report,
      summary: decision.summary,
      checkedAt: decision.checkedAt,
      // Backward compatibility for existing settings/test widgets
      scanResult: {
        safe: decision.decision === "ALLOW",
        decision: decision.decision,
        riskLevel: decision.riskLevel,
        threatsDetected: decision.reasons || [],
        riskScore: decision.riskLevel === "CRITICAL" ? 95 : decision.riskLevel === "HIGH" ? 75 : 0,
        honeytokenTriggered: decision.honeytokenTriggered,
        findings: decision.findings,
        checks: decision.checks,
        report: decision.report,
        summary: decision.summary,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error executing security screen";
    console.error("[/api/security/scan/source] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
