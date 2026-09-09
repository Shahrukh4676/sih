import { NextRequest, NextResponse } from "next/server";
import { InstagramService } from "@/lib/services/instagram.service";
import { getInstagramClient } from "@/lib/integrations/instagram/instagram-client";

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

    const stateData = await InstagramService.consumeOAuthState(state);
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
    const client = getInstagramClient();

    const tokenData = await client.exchangeCodeForToken(code);
    const profile = await client.getUserProfile(tokenData.accessToken);

    await InstagramService.saveInstagramConnection({
      organizationId,
      userId,
      instagramUserId: profile.id,
      instagramUsername: profile.username,
      accountType: profile.accountType,
      profilePictureUrl: profile.profilePictureUrl,
      accessToken: tokenData.accessToken,
      expiresInSeconds: tokenData.expiresIn,
    });

    if (isJsonRequested) {
      const jsonRes = NextResponse.json({
        success: true,
        connected: true,
        status: "CONNECTED",
        user: {
          id: profile.id,
          username: profile.username,
          accountType: profile.accountType,
        },
      });
      jsonRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return jsonRes;
    }

    const returnPath = stateData.returnUrl || "/settings?tab=INTEGRATIONS";
    const targetUrl = new URL(returnPath, req.url);
    targetUrl.searchParams.set("tab", "INTEGRATIONS");
    targetUrl.searchParams.set("connected", "instagram");
    targetUrl.searchParams.set("organizationId", organizationId);
    targetUrl.searchParams.set("_t", Date.now().toString());

    const redirectRes = NextResponse.redirect(targetUrl);
    redirectRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return redirectRes;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Instagram Callback] Error processing OAuth callback:", errorObj);
    if (isJsonRequested) {
      return NextResponse.json(
        { success: false, error: errorObj?.message || "Internal callback error" },
        { status: 500 }
      );
    }
    return NextResponse.redirect(
      new URL(`/settings?tab=INTEGRATIONS&error=${encodeURIComponent(errorObj?.message || "OAuth failed")}`, req.url)
    );
  }
}
