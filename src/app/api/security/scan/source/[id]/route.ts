// ==============================================================================
// NEXUS AI - POST /api/security/scan/source/[id] (Phase 5)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getSourceById } from "@/lib/services/sources.service";
import { SecurityEngine } from "@/lib/security/security-engine";
import { SecurityService } from "@/lib/services/security.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organizationId || "org_default";
    const userId = body.userId || "usr_anonymous";

    // 1. Fetch Source
    const source = await getSourceById(id);
    if (!source) {
      return NextResponse.json({ error: `Source not found: ${id}` }, { status: 404 });
    }

    // 2. Tenant isolation check
    if (source.organizationId && organizationId !== "org_default" && source.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have access to this organization's source." },
        { status: 403 }
      );
    }

    const orgId = source.organizationId || organizationId;
    const textToScan = source.extractedText || source.rawContent || "";

    // 3. Execute Security Screening
    const decision = SecurityEngine.scanSource(textToScan, {
      organizationId: orgId,
      userId,
      sourceId: id
    });

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 4. Record SecurityScan Record
    const scanRecord = await SecurityService.recordSecurityScan({
      securityScanId: scanId,
      organizationId: orgId,
      userId,
      sourceId: id,
      scanType: "SOURCE_SCAN",
      status: "COMPLETED",
      riskLevel: decision.riskLevel,
      decision: decision.decision,
      reasons: decision.reasons,
      requiresHumanReview: decision.requiresHumanReview,
      findings: decision.findings,
      checkedAt: decision.checkedAt
    });

    // 5. Log Security Event if High or Critical
    if (decision.riskLevel === "CRITICAL" || decision.riskLevel === "HIGH") {
      await SecurityService.recordSecurityEvent({
        organizationId: orgId,
        eventType: decision.findings.some((f) => f.type === "PROMPT_INJECTION")
          ? "PROMPT_INJECTION_DETECTED"
          : "PII_LEAK_ATTEMPT",
        severity: decision.riskLevel,
        description: `Source security alert: ${decision.summary}`,
        actorId: userId,
        timestamp: new Date().toISOString(),
        status: "OPEN"
      });
    }

    return NextResponse.json({
      success: true,
      sourceId: id,
      decision: decision.decision,
      riskLevel: decision.riskLevel,
      requiresHumanReview: decision.requiresHumanReview,
      reasons: decision.reasons,
      findingsCount: decision.findings.length,
      findings: decision.findings,
      scanId: scanRecord?.securityScanId || scanId
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error screening source";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
