import { NextRequest, NextResponse } from "next/server";
import { InstagramService } from "@/lib/services/instagram.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      // Handled via headers
    }

    const organizationId =
      (body.organizationId as string) ||
      req.headers.get("x-organization-id") ||
      "org_primary";

    const userId =
      (body.userId as string) ||
      req.headers.get("x-user-id") ||
      "usr_admin_default";

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: organizationId" },
        { status: 400 }
      );
    }

    const success = await InstagramService.disconnectInstagram(organizationId, userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "No active Instagram connection found to disconnect" },
        { status: 404 }
      );
    }

    const res = NextResponse.json({
      success: true,
      status: "DISCONNECTED",
      message: "Instagram connection successfully revoked and stored tokens purged.",
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Instagram Disconnect] Error disconnecting:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Internal error during disconnect" },
      { status: 500 }
    );
  }
}
