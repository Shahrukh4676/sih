import { NextRequest, NextResponse } from "next/server";
import { AutomationService } from "@/lib/services/automation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
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
      engine: "nexus-internal-orchestrator",
      status: "ACTIVE",
      pipeline: [
        "Human Approval",
        "Security Clearance",
        "Idempotency Gate",
        "LinkedIn Posts API 202608",
      ],
      workflow: {
        id: "nexus-native-flow",
        name: "NEXUS Native Orchestrator",
        mode: "in-process",
        isConfigured: true,
        channel: "linkedin",
      },
      stats: counts,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errObj = err as Error;
    return NextResponse.json(
      { success: false, error: errObj?.message || "Failed to retrieve automation status" },
      { status: 500 }
    );
  }
}
