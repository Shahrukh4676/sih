import { NextRequest, NextResponse } from "next/server";
import { getContentById, appendContentVersion } from "@/lib/services/content.service";
import { getSourceById, updateSourceAnalysis } from "@/lib/services/sources.service";
import { AIService } from "@/lib/ai/ai.service";
import { TransformationOptions, SupportedOutputFormat } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const content = await getContentById(id);
    if (!content) {
      return NextResponse.json(
        { success: false, error: `Content not found: ${id}` },
        { status: 404 }
      );
    }

    const organizationId =
      req.headers.get("x-organization-id") ||
      content.organizationId ||
      "org_primary";

    const source = await getSourceById(content.sourceId);
    if (!source) {
      return NextResponse.json(
        { success: false, error: `Source not found: ${content.sourceId}` },
        { status: 404 }
      );
    }

    // Reuse existing structured source intelligence
    let analysis = source.sourceAnalysis;
    if (!analysis) {
      const text = source.extractedText || source.rawContent || "";
      analysis = await AIService.analyzeSource(
        text,
        { title: source.title, type: source.type },
        organizationId
      );
      await updateSourceAnalysis(content.sourceId, analysis);
    }

    // Merge previous options with any overrides from request body
    const previousConfig = (content.currentVersion?.generationConfig || {}) as Partial<TransformationOptions>;
    const options: TransformationOptions = {
      outputType: (body.outputType || previousConfig.outputType || content.outputFormat) as SupportedOutputFormat,
      targetAudience: body.targetAudience || previousConfig.targetAudience || content.targetAudience || "TECHNICAL",
      tone: body.tone || previousConfig.tone || content.tone || "PROFESSIONAL",
      language: body.language || previousConfig.language || "ENGLISH",
      detailLevel: body.detailLevel || previousConfig.detailLevel || "MEDIUM",
      communicationObjective: body.communicationObjective || previousConfig.communicationObjective || "INFORM",
      brandPreferences: body.brandPreferences || previousConfig.brandPreferences
    };

    // Generate new transformed version with tenant-isolated AI service
    const result = await AIService.transformContent(analysis, options, organizationId);

    // Append Version N+1 to Firestore (without overwriting previous versions)
    const updatedContent = await appendContentVersion(id, {
      title: result.title,
      body: result.content,
      providerUsed: `${result.providerUsed}:${result.modelUsed}`,
      generationConfig: options as unknown as Record<string, unknown>,
      userId: body.userId || content.userId || "usr_anonymous",
      slideOutline: result.slides ? result.slides.map(s => ({ slideNumber: s.slideNumber, title: s.title, bullets: s.keyPoints, speakerNotes: s.speakerNotes })) : undefined
    });

    if (!updatedContent) {
      return NextResponse.json(
        { success: false, error: "Failed to persist new version." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contentId: id,
      newVersion: updatedContent.version,
      versionHistoryCount: updatedContent.versionHistory?.length || 1,
      content: updatedContent
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error regenerating content version";
    console.error("[Content API] Regenerate error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
