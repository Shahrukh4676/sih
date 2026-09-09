import { NextRequest, NextResponse } from "next/server";
import {
  getOrgAISettings,
  saveOrgAISettings,
  detectLocalOllama,
  resolveAIProviderForOrg,
} from "@/lib/services/ai-providers.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const settings = await getOrgAISettings(organizationId);
    const ollamaStatus = await detectLocalOllama(settings.ollamaBaseUrl);
    const { provider } = await resolveAIProviderForOrg(organizationId);
    const activeHealth = await provider.healthCheck();

    const res = NextResponse.json({
      success: true,
      settings: {
        organizationId: settings.organizationId,
        provider: settings.provider,
        geminiModel: settings.geminiModel,
        byokConfigured: settings.byokConfigured,
        byokKeyMasked: settings.byokKeyMasked,
        ollamaBaseUrl: settings.ollamaBaseUrl,
        ollamaModel: settings.ollamaModel,
        updatedAt: settings.updatedAt,
      },
      ollamaStatus,
      activeHealth,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[AI Providers API] Error getting settings:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to retrieve AI settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const organizationId =
      body.organizationId ||
      req.headers.get("x-organization-id") ||
      "org_primary";

    const updated = await saveOrgAISettings({
      organizationId,
      provider: body.provider,
      byokApiKey: body.byokApiKey,
      geminiModel: body.geminiModel,
      ollamaBaseUrl: body.ollamaBaseUrl,
      ollamaModel: body.ollamaModel,
    });

    const res = NextResponse.json({
      success: true,
      settings: {
        organizationId: updated.organizationId,
        provider: updated.provider,
        geminiModel: updated.geminiModel,
        byokConfigured: updated.byokConfigured,
        byokKeyMasked: updated.byokKeyMasked,
        ollamaBaseUrl: updated.ollamaBaseUrl,
        ollamaModel: updated.ollamaModel,
        updatedAt: updated.updatedAt,
      },
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[AI Providers API] Error saving settings:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to save AI settings" },
      { status: 500 }
    );
  }
}
