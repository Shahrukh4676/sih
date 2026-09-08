import { NextRequest, NextResponse } from "next/server";
import { getContentById, appendContentVersion } from "@/lib/services/content.service";
import { getSourceById, updateSourceAnalysis } from "@/lib/services/sources.service";
import { AIService } from "@/lib/ai/ai.service";
import { TransformationOptions, SupportedOutputFormat } from "@/lib/ai/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const content = await getContentById(id);
    if (!content) {
      return NextResponse.json({ error: `Content not found: ${id}` }, { status: 404 });
    }

    const source = await getSourceById(content.sourceId);
    if (!source) {
      return NextResponse.json({ error: `Source not found: ${content.sourceId}` }, { status: 404 });
    }

    // Reuse existing structured source intelligence
    let analysis = source.sourceAnalysis;
    if (!analysis) {
      const text = source.extractedText || source.rawContent || "";
      analysis = await AIService.analyzeSource(text);
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

    // Generate new transformed version
    const result = await AIService.transformContent(analysis, options);

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
      return NextResponse.json({ error: "Failed to persist new version." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contentId: id,
      newVersionNumber: updatedContent.version,
      content: updatedContent,
      result
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error regenerating content";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
