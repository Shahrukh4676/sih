import { NextRequest, NextResponse } from "next/server";
import { AutomationService } from "@/lib/services/automation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let orgId = "org_nexus_default";
    let userId = "user_admin";

    try {
      const body = await req.json();
      if (body.organizationId) orgId = body.organizationId;
      if (body.userId) userId = body.userId;
    } catch {
      // Body is optional
    }

    const result = await AutomationService.retryAutomationEvent(id, orgId, userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Retry failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, execution: result.event });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to retry execution" },
      { status: 500 }
    );
  }
}
