import { NextRequest, NextResponse } from "next/server";
import { getContentById } from "@/lib/services/content.service";

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
    return NextResponse.json({
      success: true,
      content,
      ...content,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving content";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
