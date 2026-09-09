// ==============================================================================
// NEXUS AI - POST /api/security/scan/content/[id] (Phase 5)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getContentById, updateContentStatus } from "@/lib/services/content.service";
import { getSourceById } from "@/lib/services/sources.service";
import { SecurityEngine } from "@/lib/security/security-engine";
import { SecurityService } from "@/lib/services/security.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const headerOrg = req.headers.get("x-organization-id");
    const organizationId = headerOrg || body.organizationId || "org_primary";
    const userId = body.userId || "usr_anonymous";

    // 1. Fetch Content
    const content = await getContentById(id);
    if (!content) {
      return NextResponse.json(
        { success: false, error: `Content not found: ${id}` },
        { status: 404 }
      );
    }

    // 2. Tenant isolation check
    if (content.organizationId && organizationId !== "org_primary" && content.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You do not have access to this organization's content." },
        { status: 403 }
      );
    }

    const orgId = content.organizationId || organizationId || "org_primary";
    const contentText = content.currentVersion?.body || content.content || "";

    // 3. Fetch linked source for grounding check
    const source = content.sourceId ? await getSourceById(content.sourceId) : null;
    const sourceIntelligence = source?.sourceAnalysis || null;

    // 4. Validate Generated Output
    const decision = SecurityEngine.validateGeneratedContent(contentText, sourceIntelligence);

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 5. Record SecurityScan Record
    const scanRecord = await SecurityService.recordSecurityScan({
      securityScanId: scanId,
      organizationId: orgId,
      userId,
      contentId: id,
      sourceId: content.sourceId,
      scanType: "CONTENT_SCAN",
      status: "COMPLETED",
      riskLevel: decision.riskLevel,
      decision: decision.decision,
      reasons: decision.reasons,
      requiresHumanReview: decision.requiresHumanReview,
      findings: decision.findings,
      checkedAt: decision.checkedAt
    });

    // 6. Update Content Lifecycle Status if High or Critical
    if (decision.decision === "BLOCK") {
      await updateContentStatus(id, "VALIDATION_FAILED");
      await SecurityService.recordSecurityEvent({
        organizationId: orgId,
        eventType: "PII_LEAK_ATTEMPT",
        severity: "CRITICAL",
        description: `Content quarantined: ${decision.summary}`,
        actorId: userId,
        timestamp: new Date().toISOString(),
        status: "OPEN"
      });
    } else if (decision.decision === "REVIEW") {
      await updateContentStatus(id, "SECURITY_REVIEW");
    }

    return NextResponse.json({
      success: true,
      contentId: id,
      decision: decision.decision,
      riskLevel: decision.riskLevel,
      requiresHumanReview: decision.requiresHumanReview,
      reasons: decision.reasons,
      findingsCount: decision.findings.length,
      findings: decision.findings,
      scanId: scanRecord?.securityScanId || scanId
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error screening content";
    console.error("[Security API] Scan content error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
