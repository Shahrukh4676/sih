import { NextRequest, NextResponse } from "next/server";
import { testProviderConnection } from "@/lib/services/ai-providers.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await testProviderConnection({
      provider: body.provider,
      byokApiKey: body.byokApiKey,
      geminiModel: body.geminiModel,
      ollamaBaseUrl: body.ollamaBaseUrl,
      ollamaModel: body.ollamaModel,
      organizationId: body.organizationId,
    });

    const res = NextResponse.json({
      success: true,
      result,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[AI Test API] Error testing provider:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to test AI provider connection" },
      { status: 500 }
    );
  }
}
