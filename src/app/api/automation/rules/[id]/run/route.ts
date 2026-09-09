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
      userId = "usr_admin",
      contentId,
      channel,
      ...otherContext
    } = body;

    const result = await AutomationsManager.executeRule(id, {
      organizationId,
      userId,
      contentId,
      channel,
      ...otherContext,
    });

    if (!result.executed) {
      return NextResponse.json(
        { success: false, reason: result.reason },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      actionResult: result.actionResult,
      automationEvent: result.automationEvent,
      message: "Automation rule executed successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Execution error" },
      { status: 500 }
    );
  }
}
