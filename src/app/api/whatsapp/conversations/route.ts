import { NextRequest, NextResponse } from "next/server";
import { defaultWhatsAppConversationManager } from "@/lib/whatsapp/whatsapp-conversation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/whatsapp/conversations
 * Lists active conversations for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const conversations = await defaultWhatsAppConversationManager.listByOrg(orgId);

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error("[WhatsApp Conversations API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}
