import { NextRequest, NextResponse } from "next/server";
import { AutomationService } from "@/lib/services/automation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organizationId || "org_primary";
    const reason = body.reason || "Execution cancelled by user";

    const result = await AutomationService.cancelAutomationEvent(id, organizationId, reason);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to cancel execution" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      event: result.event,
      message: "Automation run cancelled. Partial outputs preserved.",
    });
  } catch (error: any) {
    console.error("[API Cancel POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Cancel failed" },
      { status: 500 }
    );
  }
}
