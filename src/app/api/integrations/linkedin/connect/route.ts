import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";
import { getLinkedInClient } from "@/lib/integrations/linkedin/linkedin-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const client = getLinkedInClient();
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

    // Generate secure CSRF single-use state
    const state = await LinkedInService.createOAuthState(userId, organizationId);
    const authUrl = client.getAuthorizationUrl(state, customRedirectUri);

    // Support JSON response for API/testing clients
    const isJsonRequested =
      searchParams.get("format") === "json" ||
      req.headers.get("accept")?.includes("application/json");

    if (isJsonRequested) {
      return NextResponse.json({
        success: true,
        url: authUrl,
        state,
        redirectUri: customRedirectUri || client.getRedirectUri(),
      });
    }

    return NextResponse.redirect(authUrl, { status: 302 });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[LinkedIn Connect] Error initiating OAuth:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to initiate LinkedIn OAuth" },
      { status: 500 }
    );
  }
}
