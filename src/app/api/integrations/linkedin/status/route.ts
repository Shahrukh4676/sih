import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";

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
      return NextResponse.json({
        connected: false,
        status: connection ? connection.status : "NOT_CONNECTED",
      });
    }

    return NextResponse.json({
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
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[LinkedIn Status] Error checking status:", errorObj);
    return NextResponse.json(
      { connected: false, status: "ERROR", error: errorObj?.message },
      { status: 500 }
    );
  }
}
