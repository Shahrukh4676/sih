import { NextRequest, NextResponse } from "next/server";
import { getContentByOrg } from "@/lib/services/content.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const statusFilter = searchParams.get("status") || undefined;

    const contents = await getContentByOrg(organizationId, statusFilter);

    return NextResponse.json({
      success: true,
      contents,
      count: contents.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving contents";
    console.error("[Content API] Error retrieving contents:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
