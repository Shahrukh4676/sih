import { NextRequest, NextResponse } from "next/server";
import { createSource, getSourceById, updateSourceAnalysis } from "@/lib/services/sources.service";
import { createContent } from "@/lib/services/content.service";
import { AIService } from "@/lib/ai/ai.service";
import { TransformationOptions, SupportedOutputFormat } from "@/lib/ai/types";
import { SecurityEngine } from "@/lib/security/security-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      // Accept either a pre-existing sourceId OR raw source text/url
      sourceId: incomingSourceId,
      sourceText,
      sourceUrl,
      // Output format — support both field names for backwards compat
      outputType: rawOutputType,
      targetFormat,
      outputFormat,
      // Transform config
      targetAudience = "TECHNICAL",
      tone = "PROFESSIONAL",
      language = "ENGLISH",
      detailLevel = "MEDIUM",
      communicationObjective = "INFORM",
      objective,
      brandPreferences,
      organizationId = "org_default",
      userId = "usr_anonymous",
    } = body;

    // Normalise format field — any of the three names works
    const outputType = rawOutputType || targetFormat || outputFormat;

    if (!outputType) {
      return NextResponse.json(
        { error: "Missing required field: outputType / outputFormat / targetFormat" },
        { status: 400 }
      );
    }

    // ─── Resolve source ────────────────────────────────────────────────────────
    let source = null;

    if (incomingSourceId) {
      // Try to fetch pre-existing source
      source = await getSourceById(incomingSourceId);
    }

    if (!source) {
      // Create source inline from raw text or URL
      const rawContent = sourceText || sourceUrl || "";
      if (!rawContent.trim()) {
        return NextResponse.json(
          { error: "Provide either sourceId, sourceText, or sourceUrl" },
          { status: 400 }
        );
      }

      source = await createSource({
        organizationId,
        userId,
        type: sourceUrl && !sourceText ? "URL" : "TEXT",
        title: `Inline Transform — ${new Date().toISOString()}`,
        rawContent,
        extractedText: rawContent,
        processingStatus: "EXTRACTED",
        originUrl: sourceUrl,
      });

      if (!source) {
        return NextResponse.json(
          { error: "Failed to initialise source document" },
          { status: 500 }
        );
      }
    }

    // ─── Pre-transform security gate ──────────────────────────────────────────
    const textToScreen = source.extractedText || source.rawContent || "";
    const sourceSecurityDecision = SecurityEngine.scanSource(textToScreen, {
      organizationId,
      userId,
      sourceId: source.id,
    });

    if (sourceSecurityDecision.decision === "BLOCK") {
      return NextResponse.json(
        {
          error:
            "Security Policy Violation: Source material contains critical credentials or prohibited payload.",
          decision: "BLOCK",
          reasons: sourceSecurityDecision.reasons,
          findings: sourceSecurityDecision.findings,
        },
        { status: 422 }
      );
    }

    // ─── Semantic analysis (cached on source) ─────────────────────────────────
    let analysis = source.sourceAnalysis;
    if (!analysis) {
      analysis = await AIService.analyzeSource(
        textToScreen,
        {
          title: source.title,
          type: source.type,
          organizationId,
        },
        organizationId
      );
      await updateSourceAnalysis(source.id, analysis, "ANALYZED");
    }

    // ─── AI Transformation ────────────────────────────────────────────────────
    const options: TransformationOptions = {
      outputType: outputType as SupportedOutputFormat,
      targetAudience,
      tone,
      language,
      detailLevel,
      communicationObjective: objective || communicationObjective,
      brandPreferences,
    };

    const result = await AIService.transformContent(analysis, options, organizationId);

    if (!result.content || result.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation Failed: Generated content was empty.", status: "VALIDATION_FAILED" },
        { status: 422 }
      );
    }

    // ─── Post-transform output security gate ──────────────────────────────────
    const outputSecurityDecision = SecurityEngine.validateGeneratedContent(
      result.content,
      analysis
    );
    if (outputSecurityDecision.decision === "BLOCK") {
      return NextResponse.json(
        {
          error:
            "Output Security Policy Violation: Generated artefact leaked prohibited credentials.",
          decision: "BLOCK",
          reasons: outputSecurityDecision.reasons,
          findings: outputSecurityDecision.findings,
        },
        { status: 422 }
      );
    }

    const initialStatus =
      sourceSecurityDecision.requiresHumanReview || outputSecurityDecision.requiresHumanReview
        ? ("SECURITY_REVIEW" as const)
        : ("GENERATED" as const);

    // ─── Persist content ──────────────────────────────────────────────────────
    const contentPayload = {
      organizationId,
      userId,
      sourceId: source.id,
      outputFormat: outputType,
      outputType,
      title: result.title,
      content: result.content,
      status: initialStatus,
      version: 1,
      sourceReferences: result.sourceReferences,
      targetAudience,
      tone,
      language,
      detailLevel:
        detailLevel === "SHORT"
          ? "CONCISE"
          : detailLevel === "DETAILED"
            ? "COMPREHENSIVE"
            : ("BALANCED" as any),
      communicationObjective: objective || communicationObjective,
      securityCheck: {
        passed: true,
        piiClean: !outputSecurityDecision.findings.some((f) => f.type === "PII"),
        detectedPiiEntities: outputSecurityDecision.findings
          .filter((f) => f.type === "PII")
          .map((f) => f.evidence),
        promptInjectionSafe: !sourceSecurityDecision.findings.some(
          (f) => f.type === "PROMPT_INJECTION"
        ),
        hallucinationRisk: (
          outputSecurityDecision.findings.some((f) => f.type === "UNSUPPORTED_CLAIM")
            ? "HIGH"
            : "LOW"
        ) as "HIGH" | "LOW",
        brandSafetyCompliant: true,
        secretLeaksFound: outputSecurityDecision.findings.some((f) => f.type === "SECRET"),
        sourceTraceabilityScore:
          sourceSecurityDecision.findings.length === 0 ? 0.98 : 0.85,
        checkedAt: new Date().toISOString(),
        notes: sourceSecurityDecision.reasons
          .concat(outputSecurityDecision.reasons)
          .join("; "),
      },
      currentVersion: {
        versionNumber: 1,
        title: result.title,
        body: result.content,
        content: result.content,
        providerUsed: `${result.providerUsed}:${result.modelUsed}`,
        generationConfig: options as unknown as Record<string, unknown>,
        slideOutline: result.slides
          ? result.slides.map((s) => ({
              slideNumber: s.slideNumber,
              title: s.title,
              bullets: s.keyPoints,
              speakerNotes: s.speakerNotes,
            }))
          : undefined,
        metadata: {
          wordCount: result.metadata.wordCount,
          characterCount: result.metadata.characterCount,
          estimatedReadTimeMinutes: result.metadata.estimatedReadTimeMinutes,
          tags: result.metadata.tags,
        },
        createdAt: new Date().toISOString(),
      },
      versionHistory: [],
    };

    const savedContent = await createContent(contentPayload);

    return NextResponse.json({
      success: true,
      content: savedContent,
      // Convenience top-level fields the create page reads directly
      title: result.title,
      // The generated text — create page reads data.content as string
      generatedText: result.content,
      contentId: savedContent?.id,
      id: savedContent?.id,
      result,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error executing transformation";
    console.error("[/api/transform] Unhandled error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
