// ==============================================================================
// NEXUS AI - POST /api/security/scan/source (Phase 9: Real Security Scanner)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { SecurityEngine } from "@/lib/security/security-engine";
import { SecurityService } from "@/lib/services/security.service";
import { logAuditEvent } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HONEYTOKEN_PATTERN = /AKIA_NEXUS_DEMO_HONEYTOKEN_DO_NOT_USE_7781|HONEYTOKEN|NX-CANARY/i;

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

    // 1. Run deterministic SecurityEngine scan
    const decision = SecurityEngine.scanSource(textToScan, {
      organizationId,
      userId,
      sourceId: `probe_${Date.now()}`,
    });

    const isHoneytoken = HONEYTOKEN_PATTERN.test(textToScan);
    const hasInjection = decision.findings.some((f) => f.type === "PROMPT_INJECTION");

    if (hasInjection) {
      decision.decision = "BLOCK";
      decision.riskLevel = "CRITICAL";
      decision.reasons.push("PROMPT INJECTION BLOCKED: Direct adversarial instruction override detected.");
    }

    if (isHoneytoken) {
      decision.decision = "BLOCK";
      decision.riskLevel = "CRITICAL";
      decision.reasons.push("CRITICAL HONEYTOKEN BREACH: Canary token exposure detected in source payload.");
      decision.findings.push({
        id: `find_${Date.now()}`,
        type: "SECRET",
        severity: "CRITICAL",
        evidence: "Canary Honeytoken: AKIA_NEXUS_DEMO_HONEYTOKEN_DO_NOT_USE_7781",
        description: "Zero-tolerance active decoy honeytoken exposure triggered.",
        location: "Source payload",
        recommendedAction: "Quarantine source and alert security operations center.",
      });

      // 2. Record immutable blockchain audit entry
      await logAuditEvent({
        organizationId,
        userId,
        userEmail: "security-gate@nexus.ai",
        userRole: "SECURITY_OFFICER",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-ZeroTrustScanner",
        action: "HONEYTOKEN_EXPOSURE",
        resourceType: "SECURITY_CANARY",
        resourceId: `honeytoken_${Date.now()}`,
        severity: "CRITICAL",
        details: {
          testCase,
          verdict: "BLOCKED",
          triggeredBy: userId,
          tokenPattern: "AKIA_NEXUS_DEMO_HONEYTOKEN",
        },
      });

      // 3. Record Security Event in database
      await SecurityService.recordSecurityEvent({
        organizationId,
        eventType: "HONEYTOKEN_EXPOSURE" as any,
        severity: "CRITICAL",
        description: "CRITICAL HONEYTOKEN DETECTED: Automated canary credential was accessed or passed into the transformation engine.",
        actorId: userId,
        timestamp: new Date().toISOString(),
        status: "OPEN",
      });
    } else if (decision.riskLevel === "CRITICAL" || decision.riskLevel === "HIGH") {
      await SecurityService.recordSecurityEvent({
        organizationId,
        eventType: decision.findings.some((f) => f.type === "PROMPT_INJECTION")
          ? ("PROMPT_INJECTION_DETECTED" as any)
          : ("PII_LEAK_ATTEMPT" as any),
        severity: decision.riskLevel,
        description: `Source security alert: ${decision.summary}`,
        actorId: userId,
        timestamp: new Date().toISOString(),
        status: "OPEN",
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
      honeytokenTriggered: isHoneytoken,
      scanResult: {
        safe: decision.decision === "ALLOW",
        decision: decision.decision,
        riskLevel: decision.riskLevel,
        threatsDetected: decision.reasons || [],
        riskScore: (decision as any).riskScore ?? 0,
        honeytokenTriggered: isHoneytoken,
        findings: decision.findings,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error executing security screen";
    console.error("[/api/security/scan/source] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
