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
    const eventId = req.nextUrl.searchParams.get("eventId") || undefined;

    const lineage = await AutomationsManager.getLineage(id, eventId);

    return NextResponse.json({
      success: true,
      lineage,
    });
  } catch (error: any) {
    console.error("[API Lineage GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve content lineage" },
      { status: 500 }
    );
  }
}
