import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsapp.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId") || "org_nexus_default";

    const status = await WhatsAppService.getStatus(orgId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error("[WhatsApp Status API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve WhatsApp status" },
      { status: 500 }
    );
  }
}
