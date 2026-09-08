import { NextRequest, NextResponse } from "next/server";
import { AutomationService } from "@/lib/services/automation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await AutomationService.getAutomationEventById(id);
    if (!event) {
      return NextResponse.json({ error: `Execution not found: ${id}` }, { status: 404 });
    }

    return NextResponse.json({ success: true, execution: event, ...event });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to retrieve execution" },
      { status: 500 }
    );
  }
}
