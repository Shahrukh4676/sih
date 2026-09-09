import { NextRequest, NextResponse } from "next/server";
import { NewsService } from "@/lib/services/news.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const item = await NewsService.getNewsById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: "News item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch news detail" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const isSaved = await NewsService.toggleSave(id);
    return NextResponse.json({ success: true, isSaved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to toggle saved status" },
      { status: 500 }
    );
  }
}
