import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppClient } from "@/lib/whatsapp/whatsapp-client";
import { defaultWhatsAppUserLinkService } from "@/lib/whatsapp/whatsapp-user-link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, text, type = "text", buttons } = body;

    if (!to || !text) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: 'to' and 'text'" },
        { status: 400 }
      );
    }

    // Verify recipient is linked
    const connection = await defaultWhatsAppUserLinkService.getConnectionByPhoneNumber(to);
    if (!connection || connection.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Recipient phone number is not linked or active in NEXUS AI" },
        { status: 403 }
      );
    }

    const client = getWhatsAppClient();
    let sendResult;
    if (type === "button" && Array.isArray(buttons) && buttons.length > 0) {
      sendResult = await client.sendButtonMessage(to, text, buttons);
    } else {
      sendResult = await client.sendTextMessage(to, text);
    }

    return NextResponse.json({
      success: true,
      data: sendResult,
    });
  } catch (error: any) {
    console.error("[WhatsApp Send API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}
