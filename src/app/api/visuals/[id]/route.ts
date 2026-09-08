// ==============================================================================
// NEXUS AI - GET /api/visuals/[id] (Phase 4)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { VisualsService } from "@/lib/services/visuals.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await VisualsService.getVisualAssetById(id);

    if (!asset) {
      return NextResponse.json({ error: `Visual asset not found: ${id}` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      asset
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving visual asset";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
