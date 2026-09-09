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
    const rule = await AutomationsManager.getAutomationById(id);
    if (!rule) {
      return NextResponse.json({ success: false, error: "Automation rule not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch rule" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updates = await req.json();

    const updated = await AutomationsManager.updateAutomation(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Rule not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      rule: updated,
      message: "Automation rule updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = req.nextUrl;
    const organizationId = searchParams.get("organizationId") || "org_primary";

    const deleted = await AutomationsManager.deleteAutomation(id, organizationId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Rule not found or unauthorized to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Automation rule deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete rule" },
      { status: 500 }
    );
  }
}
