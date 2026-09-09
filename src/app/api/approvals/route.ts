import { NextRequest, NextResponse } from "next/server";
import { getPendingApprovalsByOrg } from "@/lib/services/approvals.service";

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
