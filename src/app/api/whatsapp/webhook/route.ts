import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppMessageRouter } from "@/lib/whatsapp/whatsapp-message-router";
import { WhatsAppService } from "@/lib/services/whatsapp.service";
import { MetaWebhookPayload } from "@/lib/whatsapp/whatsapp-types";
import { getSecret } from "@/lib/server-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Meta Webhook Verification Handshake
 * Meta Cloud API verifies ownership via challenge token
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const configuredToken = getSecret("WHATSAPP_VERIFY_TOKEN");

  if (mode === "subscribe" && token === configuredToken) {
    console.log("[WhatsApp Webhook] Verification handshake successful.");
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[WhatsApp Webhook] Verification handshake rejected. Token mismatch or invalid mode.");
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Incoming WhatsApp Event Receiver
 * Receives messages, button replies, and delivery updates
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Check Meta signature if configured
    const signature = req.headers.get("x-hub-signature-256");
    const isSignatureValid = WhatsAppService.validateWebhookSignature(rawBody, signature);
    if (!isSignatureValid) {
      console.warn("[WhatsApp Webhook] Invalid X-Hub-Signature-256 rejected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: MetaWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!payload || payload.object !== "whatsapp_business_account") {
      // Return 200 to acknowledge Meta delivery
      return NextResponse.json({ success: true, ignored: true });
    }

    const entries = payload.entry || [];
    let processedCount = 0;
    const results = [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value || value.messaging_product !== "whatsapp") continue;

        const messages = value.messages || [];
        for (const msg of messages) {
          const router = getWhatsAppMessageRouter();
          const result = await router.handleInboundMessage(msg);
          results.push(result);
          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      results,
    });
  } catch (error: any) {
    console.error("[WhatsApp Webhook POST] Error:", error.message);
    // Still return 200 to Meta to prevent retry storms, while logging error
    return NextResponse.json({ success: false, error: "Internal processing error" }, { status: 200 });
  }
}
