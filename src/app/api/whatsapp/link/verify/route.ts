import { NextRequest, NextResponse } from "next/server";
import { defaultWhatsAppUserLinkService } from "@/lib/whatsapp/whatsapp-user-link";

/**
 * POST /api/whatsapp/link/verify
 * Verifies linking code and binds phone number to organization & user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: "Missing required fields: 'phoneNumber' and 'code'" },
        { status: 400 }
      );
    }

    const result = await defaultWhatsAppUserLinkService.verifyAndLink(phoneNumber, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Verification failed" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        connectionId: result.connection?.id,
        status: result.connection?.status,
        organizationId: result.connection?.organizationId,
        verifiedAt: result.connection?.verifiedAt,
      },
    });
  } catch (error: any) {
    console.error("[WhatsApp Verify API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to verify linking code" },
      { status: 500 }
    );
  }
}
