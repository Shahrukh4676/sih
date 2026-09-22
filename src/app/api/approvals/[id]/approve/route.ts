import { NextRequest, NextResponse } from "next/server";
import { submitApprovalDecision } from "@/lib/services/approvals.service";
import { getContentById } from "@/lib/services/content.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const reviewerNotes =
      (body.reviewerNotes as string) ||
      (body.comments as string) ||
      "Approved via NEXUS Governance Console";
    const reviewerId =
      (body.reviewerId as string) ||
      req.headers.get("x-user-id") ||
      "usr_admin_governance";
    const reviewerName =
      (body.reviewerName as string) ||
      req.headers.get("x-user-name") ||
      "Governance Officer";
    const reqOrg =
      req.headers.get("x-organization-id") ||
      (body.organizationId as string) ||
      undefined;

    // Resolve contentId: check body first, then fallback to url param
    let contentId = (body.contentId as string) || id;
    let approvalId = id.startsWith("appr_") ? id : `appr_${id}`;

    // Validate content exists
    let content = await getContentById(contentId);
    if (!content && id.startsWith("appr_")) {
      const strippedId = id.replace(/^appr_/, "");
      content = await getContentById(strippedId);
      if (content) {
        contentId = strippedId;
      }
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: `Content not found: ${contentId}` },
        { status: 404 }
      );
    }

    // Tenant isolation check
    if (reqOrg && content.organizationId && content.organizationId !== reqOrg) {
      return NextResponse.json(
        { success: false, error: "Cross-tenant approval decision rejected" },
        { status: 403 }
      );
    }

    const success = await submitApprovalDecision(
      approvalId,
      content.id,
      "APPROVED",
      reviewerId,
      reviewerName,
      reviewerNotes
    );

    return NextResponse.json({
      success,
      status: "APPROVED",
      contentId: content.id,
      approvalId,
      message: "Content successfully approved and queued for internal orchestration.",
    });
  } catch (err: unknown) {
    const errObj = err as Error;
    return NextResponse.json(
      { success: false, error: errObj?.message || "Error submitting approval decision" },
      { status: 500 }
    );
  }
}
