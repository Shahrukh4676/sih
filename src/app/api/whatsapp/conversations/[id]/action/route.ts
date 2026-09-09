import { NextRequest, NextResponse } from "next/server";
import { defaultWhatsAppConversationManager } from "@/lib/whatsapp/whatsapp-conversation";
import { getWhatsAppMessageRouter } from "@/lib/whatsapp/whatsapp-message-router";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/whatsapp/conversations/[id]/action
 * Administrative actions: RESET, CANCEL, or SIMULATE_MESSAGE
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { action, text, buttonReply } = body;

    const conversation = await defaultWhatsAppConversationManager.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    if (action === "RESET" || action === "CANCEL") {
      const reset = await defaultWhatsAppConversationManager.resetSession(id);
      return NextResponse.json({ success: true, data: reset });
    }

    if (action === "SIMULATE_MESSAGE") {
      if (!text && !buttonReply) {
        return NextResponse.json({ success: false, error: "Missing 'text' or 'buttonReply'" }, { status: 400 });
      }

      const simMessage = {
        from: conversation.phoneNumber,
        id: `sim_wamid_${Date.now()}`,
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: buttonReply ? ("interactive" as const) : ("text" as const),
        text: text ? { body: text } : undefined,
        interactive: buttonReply
          ? {
              type: "button_reply" as const,
              button_reply: buttonReply,
            }
          : undefined,
      };

      const router = getWhatsAppMessageRouter();
      const routerResult = await router.handleInboundMessage(simMessage);
      const updatedConv = await defaultWhatsAppConversationManager.getConversation(id);

      return NextResponse.json({
        success: true,
        routerResult,
        conversation: updatedConv,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[WhatsApp Conversation Action API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Action processing failed" },
      { status: 500 }
    );
  }
}
