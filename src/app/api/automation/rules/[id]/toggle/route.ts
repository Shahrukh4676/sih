import { NextRequest, NextResponse } from "next/server";
import { AutomationsManager } from "@/lib/services/automations.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "'enabled' boolean is required in request body" },
        { status: 400 }
      );
    }

    const success = await AutomationsManager.toggleEnabled(id, enabled);
    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to toggle rule state" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      enabled,
      message: `Rule ${enabled ? "enabled" : "disabled"} successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to toggle rule" },
      { status: 500 }
    );
  }
}
