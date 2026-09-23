import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";
import { getLinkedInClient } from "@/lib/integrations/linkedin/linkedin-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const userId =
      req.headers.get("x-user-id") ||
      searchParams.get("userId") ||
      undefined;

    const connection = await LinkedInService.getLinkedInConnection(organizationId, userId);
    const client = getLinkedInClient();
    const isSimulated = client.isSimulationMode();
    const isConfigured = client.isConfigured();

    let isSimulatedToken = false;
    if (connection?.accessTokenEncrypted) {
      try {
        const { decryptToken } = await import("@/lib/security/token-encryption");
        const dec = decryptToken(connection.accessTokenEncrypted);
        isSimulatedToken = dec.startsWith("sim_token_");
      } catch {
        // Ignored in status route
      }
    }

    if (!connection || connection.status !== "CONNECTED") {
      const notConnectedRes = NextResponse.json({
        connected: false,
        configured: isConfigured,
        mode: isSimulated ? "simulation" : "live",
        status: connection ? connection.status : "NOT_CONNECTED",
        simulated: isSimulated,
        isSimulatedToken,
      });
      notConnectedRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      notConnectedRes.headers.set("Pragma", "no-cache");
      notConnectedRes.headers.set("Expires", "0");
      return notConnectedRes;
    }

    const connectedRes = NextResponse.json({
      connected: true,
      configured: isConfigured,
      mode: isSimulated ? "simulation" : "live",
      status: "CONNECTED",
      simulated: isSimulated,
      isSimulatedToken,
      member: {
        id: connection.linkedinMemberId,
        urn: connection.linkedinMemberUrn,
        name: connection.memberName,
        email: connection.memberEmail,
        avatar: connection.memberAvatar,
      },
      scopes: connection.scopes,
      connectedAt: connection.connectedAt,
      lastPublishedAt: connection.lastPublishedAt,
      expiresAt: connection.expiresAt,
    });
    connectedRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    connectedRes.headers.set("Pragma", "no-cache");
    connectedRes.headers.set("Expires", "0");
    return connectedRes;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[LinkedIn Status] Error checking status:", errorObj);
    const errRes = NextResponse.json(
      { connected: false, status: "ERROR", error: errorObj?.message },
      { status: 500 }
    );
    errRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return errRes;
  }
}
