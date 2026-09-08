import { NextRequest, NextResponse } from "next/server";
import { AutomationService } from "@/lib/services/automation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") || "org_nexus_default";
    const limitParam = Number(req.nextUrl.searchParams.get("limit")) || 50;
    const events = await AutomationService.getAutomationEventsByOrg(orgId, limitParam);

    return NextResponse.json({
      success: true,
      executions: events,
      total: events.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to retrieve executions" },
      { status: 500 }
    );
  }
}
