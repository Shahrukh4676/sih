import { NextRequest, NextResponse } from "next/server";
import { getN8nClient } from "@/lib/automation/n8n-client";
import { AutomationService } from "@/lib/services/automation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const n8nClient = getN8nClient();
    const orgId =
      req.headers.get("x-organization-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "org_primary";
    const events = await AutomationService.getAutomationEventsByOrg(orgId, 100);

    const counts = {
      total: events.length,
      completed: events.filter((e) => e.status === "COMPLETED").length,
      running: events.filter((e) => ["TRIGGERED", "RUNNING"].includes(e.status)).length,
      failed: events.filter((e) => e.status === "FAILED").length,
    };

    return NextResponse.json({
      success: true,
      engine: "n8n-enterprise-orchestrator",
      workflow: {
        id: n8nClient.getWorkflowId(),
        name: n8nClient.getWorkflowName(),
        cloudBaseUrl: n8nClient.getBaseUrl(),
        webhookUrl: n8nClient.getWebhookUrl(),
        isConfigured: n8nClient.isConfigured(),
        isSimulationMode: n8nClient.isSimulationMode(),
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
