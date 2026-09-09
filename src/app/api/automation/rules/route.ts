import { NextRequest, NextResponse } from "next/server";
import { AutomationsManager } from "@/lib/services/automations.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const organizationId = searchParams.get("organizationId") || "org_primary";

    const rules = await AutomationsManager.getAutomationsByOrg(organizationId);

    return NextResponse.json({
      success: true,
      rules,
      total: rules.length,
    });
  } catch (error: any) {
    console.error("[API Automation Rules GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch automation rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description = "",
      organizationId = "org_primary",
      userId = "usr_admin",
      enabled = true,
      trigger,
      conditions = [],
      aiAction,
      securityCheckRequired = true,
      approvalRequired = true,
      deliveryTarget = ["LINKEDIN"],
    } = body;

    if (!name || !trigger || !aiAction) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, trigger, and aiAction are mandatory" },
        { status: 400 }
      );
    }

    const created = await AutomationsManager.createAutomation({
      name,
      description,
      organizationId,
      userId,
      enabled,
      trigger,
      conditions,
      aiAction,
      securityCheckRequired,
      approvalRequired,
      deliveryTarget,
    });

    if (!created) {
      return NextResponse.json(
        { success: false, error: "Failed to persist automation rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rule: created,
      message: `Automation rule '${created.name}' created successfully`,
    });
  } catch (error: any) {
    console.error("[API Automation Rules POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create automation rule" },
      { status: 500 }
    );
  }
}
