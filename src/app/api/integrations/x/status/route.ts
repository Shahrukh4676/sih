import { NextRequest, NextResponse } from "next/server";
import { XService } from "@/lib/services/x.service";

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

    const data = await XService.getXConnection(organizationId, userId);

    if (!data || data.connection.status !== "CONNECTED") {
      const notConnectedRes = NextResponse.json({
        connected: false,
        status: data ? data.connection.status : "NOT_CONNECTED",
      });
      notConnectedRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return notConnectedRes;
    }

    const { connection } = data;
    const connectedRes = NextResponse.json({
      connected: true,
      status: "CONNECTED",
      user: {
        id: connection.xUserId,
        username: connection.xUsername,
        name: connection.xName,
        avatar: connection.xAvatarUrl,
      },
      scopes: connection.scopes,
      connectedAt: connection.connectedAt,
      lastPublishedAt: connection.lastPublishedAt,
      expiresAt: connection.expiresAt,
    });
    connectedRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return connectedRes;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[X Status] Error checking status:", errorObj);
    const errRes = NextResponse.json(
      { connected: false, status: "ERROR", error: errorObj?.message },
      { status: 500 }
    );
    errRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return errRes;
  }
}
