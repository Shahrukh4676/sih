import { NextRequest, NextResponse } from "next/server";
import { submitApprovalDecision } from "@/lib/services/approvals.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: approvalId } = await params;
    const body = await req.json();
    const { contentId, status, reviewerId, reviewerName, comments } = body;

    if (!contentId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: contentId, status" },
        { status: 400 }
      );
    }

    const success = await submitApprovalDecision(
      approvalId,
      contentId,
      status,
      reviewerId || "reviewer_user",
      reviewerName || "Reviewer",
      comments
    );

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Error submitting approval decision" },
      { status: 500 }
    );
  }
}
