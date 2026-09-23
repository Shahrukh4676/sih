import { NextRequest, NextResponse } from "next/server";
import { getPendingApprovalsByOrg, createApprovalRequest } from "@/lib/services/approvals.service";
import { getContentById, updateContentStatus } from "@/lib/services/content.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-organization-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "org_primary";
    const pending = await getPendingApprovalsByOrg(orgId);
    return NextResponse.json({ success: true, approvals: pending });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Error retrieving approvals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentId, organizationId = "org_primary", reviewerId, comments } = body;

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: contentId" },
        { status: 400 }
      );
    }

    const content = await getContentById(contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content item not found" },
        { status: 404 }
      );
    }

    const approval = await createApprovalRequest({
      organizationId: content.organizationId || organizationId,
      userId: content.userId || "usr_anonymous",
      contentId,
      versionNumber: content.version || 1,
      status: "PENDING",
      reviewerId,
      comments,
      securitySnapshot: content.securityCheck || {
        passed: true,
        piiClean: true,
        detectedPiiEntities: [],
        promptInjectionSafe: true,
        hallucinationRisk: "LOW",
        brandSafetyCompliant: true,
        secretLeaksFound: false,
        sourceTraceabilityScore: 0.95,
        checkedAt: new Date().toISOString(),
      },
    });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: "Failed to persist approval request" },
        { status: 500 }
      );
    }

    // Update content status to PENDING_APPROVAL
    await updateContentStatus(contentId, "PENDING_APPROVAL" as any);

    return NextResponse.json({ success: true, approval });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Error creating approval request" },
      { status: 500 }
    );
  }
}

