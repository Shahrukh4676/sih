import { NextRequest, NextResponse } from "next/server";
import { defaultWhatsAppConversationManager } from "@/lib/whatsapp/whatsapp-conversation";

/**
 * GET /api/whatsapp/conversations/[id]
 * Retrieves conversation details by ID
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversation = await defaultWhatsAppConversationManager.getConversation(id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error("[WhatsApp Conversation Detail API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve conversation" },
      { status: 500 }
    );
  }
}
