import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";

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

    if (!connection || connection.status !== "CONNECTED") {
      const notConnectedRes = NextResponse.json({
        connected: false,
        status: connection ? connection.status : "NOT_CONNECTED",
      });
      notConnectedRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      notConnectedRes.headers.set("Pragma", "no-cache");
      notConnectedRes.headers.set("Expires", "0");
      return notConnectedRes;
    }

    const connectedRes = NextResponse.json({
      connected: true,
      status: "CONNECTED",
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
