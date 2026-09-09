import { NextRequest, NextResponse } from "next/server";
import { getContentById } from "@/lib/services/content.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await getContentById(id);
    if (!content) {
      return NextResponse.json(
        { success: false, error: `Content not found: ${id}` },
        { status: 404 }
      );
    }

    const reqOrg =
      req.headers.get("x-organization-id") ||
      req.nextUrl.searchParams.get("organizationId");

    if (reqOrg && content.organizationId && content.organizationId !== reqOrg) {
      return NextResponse.json(
        { success: false, error: "Cross-tenant content access forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
      ...content,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving content";
    console.error("[Content API] GET [id] error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
