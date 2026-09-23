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
    const organizationId = body.organizationId || "org_primary";

    const success = await AutomationsManager.publishAsTemplate(id, organizationId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to publish automation as template" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Automation published to your organization's template gallery.",
    });
  } catch (error: any) {
    console.error("[API Template POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to publish template" },
      { status: 500 }
    );
  }
}
