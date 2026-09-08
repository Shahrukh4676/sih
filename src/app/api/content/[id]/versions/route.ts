import { NextRequest, NextResponse } from "next/server";
import { getContentVersions, getContentById } from "@/lib/services/content.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await getContentById(id);
    if (!content) {
      return NextResponse.json({ error: `Content not found: ${id}` }, { status: 404 });
    }
    const versions = await getContentVersions(id);
    return NextResponse.json({
      success: true,
      contentId: id,
      currentVersion: content.version || 1,
      totalVersions: versions.length,
      versions
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving content versions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
