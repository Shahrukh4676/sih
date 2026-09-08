import { NextRequest, NextResponse } from "next/server";
import { defaultN8nClient } from "@/lib/automation/n8n-client";
import { AutomationService } from "@/lib/services/automation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") || "org_nexus_default";
    const events = await AutomationService.getAutomationEventsByOrg(orgId, 100);

    const counts = {
      total: events.length,
      completed: events.filter((e) => e.status === "COMPLETED").length,
      running: events.filter((e) => ["TRIGGERED", "RUNNING"].includes(e.status)).length,
      failed: events.filter((e) => e.status === "FAILED").length,
    };

    return NextResponse.json({
      success: true,
      workflow: {
        id: defaultN8nClient.getWorkflowId(),
        name: defaultN8nClient.getWorkflowName(),
        cloudBaseUrl: defaultN8nClient.getBaseUrl(),
        webhookUrl: defaultN8nClient.getWebhookUrl(),
        isConfigured: defaultN8nClient.isConfigured(),
        isSimulationMode: defaultN8nClient.isSimulationMode(),
      },
      stats: counts,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to retrieve automation status" },
      { status: 500 }
    );
  }
}
