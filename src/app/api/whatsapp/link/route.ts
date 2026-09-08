import { NextRequest, NextResponse } from "next/server";
import { defaultWhatsAppUserLinkService } from "@/lib/whatsapp/whatsapp-user-link";

/**
 * POST /api/whatsapp/link
 * Generates a short-lived, single-use linking code (e.g. NX-ABC123) for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId = "org_nexus_default", userId = "usr_current" } = body;

    const result = await defaultWhatsAppUserLinkService.createLinkingCode(organizationId, userId);

    return NextResponse.json({
      success: true,
      data: {
        code: result.code,
        expiresAt: result.expiresAt,
        instruction: `Send '${result.code}' to the NEXUS AI WhatsApp Business number to link your account.`,
      },
    });
  } catch (error: any) {
    console.error("[WhatsApp Link API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to generate linking code" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/link
 * Lists linked phone numbers for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId") || "org_nexus_default";

    const connections = await defaultWhatsAppUserLinkService.listConnectionsByOrg(orgId);

    // Sanitize phone numbers for client display
    const sanitized = connections.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      userId: c.userId,
      maskedPhone: c.phoneNumber ? `***-***-${c.phoneNumber.slice(-4)}` : "Pending",
      status: c.status,
      verifiedAt: c.verifiedAt,
      lastSeenAt: c.lastSeenAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: sanitized,
    });
  } catch (error: any) {
    console.error("[WhatsApp Link API GET] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to list connections" },
      { status: 500 }
    );
  }
}
