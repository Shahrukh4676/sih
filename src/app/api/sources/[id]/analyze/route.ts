import { NextRequest, NextResponse } from "next/server";
import { getSourceById, updateSourceAnalysis } from "@/lib/services/sources.service";
import { AIService } from "@/lib/ai/ai.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const forceReanalyze = body.forceReanalyze === true;

    const source = await getSourceById(id);
    if (!source) {
      return NextResponse.json({ success: false, error: `Source not found: ${id}` }, { status: 404 });
    }

    // Cost control check: reuse existing analysis if already analyzed
    if (source.sourceAnalysis && !forceReanalyze) {
      return NextResponse.json({
        success: true,
        sourceId: id,
        analysis: source.sourceAnalysis,
        cached: true
      });
    }

    const textToAnalyze = source.extractedText || source.rawContent || "";
    if (!textToAnalyze.trim()) {
      return NextResponse.json({ success: false, error: "Source has no extractable text." }, { status: 400 });
    }

    const organizationId =
      req.headers.get("x-organization-id") ||
      source.organizationId ||
      "org_primary";

    // Run AI Source Understanding
    const structuredAnalysis = await AIService.analyzeSource(
      textToAnalyze,
      {
        title: source.title,
        type: source.type
      },
      organizationId
    );

    // Cache in Firestore
    await updateSourceAnalysis(id, structuredAnalysis, "ANALYZED");

    return NextResponse.json({
      success: true,
      sourceId: id,
      analysis: structuredAnalysis,
      cached: false
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error analyzing source";
    console.error("[Sources API] Analyze error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
