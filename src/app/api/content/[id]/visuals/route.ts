// ==============================================================================
// NEXUS AI - GET /api/content/[id]/visuals (Phase 4)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getContentById } from "@/lib/services/content.service";
import { VisualsService } from "@/lib/services/visuals.service";

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

    const visuals = await VisualsService.getVisualsByContentId(id);

    return NextResponse.json({
      success: true,
      contentId: id,
      totalVisuals: visuals.length,
      visuals
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving visuals for content";
    console.error("[Content API] GET [id]/visuals error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
