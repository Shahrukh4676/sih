import { NextRequest, NextResponse } from "next/server";
import { InstagramService } from "@/lib/services/instagram.service";
import { getInstagramClient } from "@/lib/integrations/instagram/instagram-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const client = getInstagramClient();
    const searchParams = req.nextUrl.searchParams;
    const userId =
      req.headers.get("x-user-id") ||
      searchParams.get("userId") ||
      "usr_admin_default";

    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const customRedirectUri = searchParams.get("redirect_uri") || undefined;
    const returnUrl =
      searchParams.get("returnUrl") ||
      searchParams.get("redirect") ||
      "/settings?tab=INTEGRATIONS";

    const state = await InstagramService.createOAuthState(userId, organizationId, returnUrl);
    const authUrl = client.getAuthorizationUrl(state, customRedirectUri);

    const isJsonRequested =
      searchParams.get("format") === "json" ||
      req.headers.get("accept")?.includes("application/json");

    if (isJsonRequested) {
      const jsonRes = NextResponse.json({
        success: true,
        url: authUrl,
        authUrl,
        state,
        redirectUri: customRedirectUri || client.getRedirectUri(),
      });
      jsonRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return jsonRes;
    }

    const redirectRes = NextResponse.redirect(authUrl, { status: 302 });
    redirectRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return redirectRes;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Instagram Connect] Error initiating OAuth:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to initiate Instagram OAuth" },
      { status: 500 }
    );
  }
}
