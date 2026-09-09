import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      // Body may be empty if passed via headers
    }

    const organizationId =
      (body.organizationId as string) ||
      req.headers.get("x-organization-id") ||
      "org_primary";

    const userId =
      (body.userId as string) ||
      req.headers.get("x-user-id") ||
      "usr_admin_default";

    if (!organizationId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: organizationId, userId" },
        { status: 400 }
      );
    }

    const success = await LinkedInService.disconnectLinkedIn(organizationId, userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "No active LinkedIn connection found to disconnect" },
        { status: 404 }
      );
    }

    const res = NextResponse.json({
      success: true,
      status: "DISCONNECTED",
      message: "LinkedIn connection successfully revoked and stored tokens purged.",
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[LinkedIn Disconnect] Error revoking connection:", errorObj);
    const errRes = NextResponse.json(
      { success: false, error: errorObj?.message || "Internal error during disconnect" },
      { status: 500 }
    );
    errRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return errRes;
  }
}
