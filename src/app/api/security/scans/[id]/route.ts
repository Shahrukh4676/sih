// ==============================================================================
// NEXUS AI - GET /api/security/scans/[id] (Phase 5)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { SecurityService } from "@/lib/services/security.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scan = await SecurityService.getSecurityScanById(id);

    if (!scan) {
      return NextResponse.json({ error: `Security scan not found: ${id}` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scan
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving security scan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
