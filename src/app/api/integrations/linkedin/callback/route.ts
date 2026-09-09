import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";
import { getLinkedInClient } from "@/lib/integrations/linkedin/linkedin-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const isJsonRequested =
    searchParams.get("format") === "json" ||
    req.headers.get("accept")?.includes("application/json");

  try {
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (errorParam) {
      const msg = errorDesc || errorParam;
      if (isJsonRequested) {
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
      return NextResponse.redirect(
        new URL(`/settings?tab=INTEGRATIONS&error=${encodeURIComponent(msg)}`, req.url)
      );
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      const msg = "Missing required parameters: code or state";
      if (isJsonRequested) {
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
      return NextResponse.redirect(
        new URL(`/settings?tab=INTEGRATIONS&error=${encodeURIComponent(msg)}`, req.url)
      );
    }

    // 1. Validate & consume single-use state
    const stateData = await LinkedInService.consumeOAuthState(state);
    if (!stateData) {
      const msg = "Invalid, expired, or already consumed OAuth state";
      if (isJsonRequested) {
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
      return NextResponse.redirect(
        new URL(`/settings?tab=INTEGRATIONS&error=${encodeURIComponent(msg)}`, req.url)
      );
    }

    const { userId, organizationId } = stateData;
    const client = getLinkedInClient();

    // 2. Exchange authorization code for token
    const tokenData = await client.exchangeCodeForToken(code);

    // 3. Fetch authenticated member profile from OpenID Connect userinfo
    const profile = await client.getMemberProfile(tokenData.accessToken);

    // 4. Save encrypted connection
    await LinkedInService.saveLinkedInConnection({
      organizationId,
      userId,
      memberId: profile.id,
      memberUrn: profile.urn,
      memberName: profile.name,
      memberEmail: profile.email,
      memberAvatar: profile.picture,
      scopes: tokenData.scope.split(" ").filter(Boolean),
      accessToken: tokenData.accessToken,
      expiresInSeconds: tokenData.expiresIn,
    });

    if (isJsonRequested) {
      const jsonRes = NextResponse.json({
        success: true,
        connected: true,
        status: "CONNECTED",
        member: {
          id: profile.id,
          name: profile.name,
          urn: profile.urn,
          email: profile.email,
        },
      });
      jsonRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return jsonRes;
    }

    const returnPath = stateData.returnUrl || "/settings?tab=INTEGRATIONS";
    const targetUrl = new URL(returnPath, req.url);
    targetUrl.searchParams.set("tab", "INTEGRATIONS");
    targetUrl.searchParams.set("connected", "true");
    targetUrl.searchParams.set("organizationId", organizationId);
    targetUrl.searchParams.set("_t", Date.now().toString());

    const redirectRes = NextResponse.redirect(targetUrl);
    redirectRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    redirectRes.headers.set("Pragma", "no-cache");
    redirectRes.headers.set("Expires", "0");
    return redirectRes;
  } catch (err: unknown) {
    const errorObj = err as Error;
    // Log with credentials/tokens redacted
    const safeErrorMsg = (errorObj?.message || "Unknown error")
      .replace(/client_secret=[^&\s]+/gi, "client_secret=[REDACTED]")
      .replace(/code=[^&\s]+/gi, "code=[REDACTED]")
      .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, "Bearer [REDACTED]");

    console.error("[LinkedIn Callback] Error processing callback:", safeErrorMsg);

    if (isJsonRequested) {
      const jsonErr = NextResponse.json(
        { success: false, error: safeErrorMsg },
        { status: 500 }
      );
      jsonErr.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return jsonErr;
    }

    const errUrl = new URL("/settings?tab=INTEGRATIONS", req.url);
    errUrl.searchParams.set("error", safeErrorMsg);
    errUrl.searchParams.set("_t", Date.now().toString());
    const errRedirect = NextResponse.redirect(errUrl);
    errRedirect.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return errRedirect;
  }
}
