import { NextRequest, NextResponse } from "next/server";
import { AutomationsManager } from "@/lib/services/automations.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const organizationId =
      req.headers.get("x-organization-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "org_primary";

    const health = await AutomationsManager.calculateHealthScore(id, organizationId);

    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error: any) {
    console.error("[API Health GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to calculate health score" },
      { status: 500 }
    );
  }
}
