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
    const versions = await AutomationsManager.getVersions(id);

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error: any) {
    console.error("[API Versions GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve version history" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { targetVersion } = body;

    if (typeof targetVersion !== "number") {
      return NextResponse.json(
        { success: false, error: "targetVersion number is required" },
        { status: 400 }
      );
    }

    const updated = await AutomationsManager.rollbackVersion(id, targetVersion);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Version ${targetVersion} not found or rollback failed` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rule: updated,
      message: `Rolled back automation to definition v${targetVersion}`,
    });
  } catch (error: any) {
    console.error("[API Versions Rollback POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Rollback failed" },
      { status: 500 }
    );
  }
}
