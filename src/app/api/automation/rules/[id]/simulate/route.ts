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
    const body = await req.json().catch(() => ({}));
    const {
      organizationId = "org_primary",
      userId = "usr_creator",
      sourceTitle,
      sampleContent,
    } = body;

    const result = await AutomationsManager.executeSimulation(id, {
      organizationId,
      userId,
      sourceTitle,
      sampleContent,
    });

    return NextResponse.json({
      success: true,
      simulated: true,
      event: result.event,
      message: "Dry-run simulation executed successfully without external publishing.",
    });
  } catch (error: any) {
    console.error("[API Simulation POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Simulation error" },
      { status: 500 }
    );
  }
}
