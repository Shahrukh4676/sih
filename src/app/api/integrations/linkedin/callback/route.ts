import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";
import { defaultLinkedInClient } from "@/lib/integrations/linkedin/linkedin-client";

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

    // 2. Exchange authorization code for token
    const tokenData = await defaultLinkedInClient.exchangeCodeForToken(code);

    // 3. Fetch authenticated member profile from OpenID Connect userinfo
    const profile = await defaultLinkedInClient.getMemberProfile(tokenData.accessToken);

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
      return NextResponse.json({
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
    }

    return NextResponse.redirect(
      new URL("/settings?tab=INTEGRATIONS&connected=true", req.url)
    );
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[LinkedIn Callback] Error processing callback:", errorObj);

    if (isJsonRequested) {
      return NextResponse.json(
        { success: false, error: errorObj?.message || "Internal server error during LinkedIn OAuth" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL(`/settings?tab=INTEGRATIONS&error=${encodeURIComponent(errorObj?.message || "OAuth Failed")}`, req.url)
    );
  }
}
