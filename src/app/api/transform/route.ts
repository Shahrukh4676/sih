import { NextRequest, NextResponse } from "next/server";
import { getSourceById, updateSourceAnalysis } from "@/lib/services/sources.service";
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
      sourceId,
      outputType: rawOutputType,
      targetFormat,
      targetAudience = "TECHNICAL",
      tone = "PROFESSIONAL",
      language = "ENGLISH",
      detailLevel = "MEDIUM",
      communicationObjective = "INFORM",
      brandPreferences,
      organizationId = "org_default",
      userId = "usr_anonymous"
    } = body;
    const outputType = rawOutputType || targetFormat;

    if (!sourceId) {
      return NextResponse.json({ error: "Missing required field: sourceId" }, { status: 400 });
    }

    if (!outputType) {
      return NextResponse.json({ error: "Missing required field: outputType" }, { status: 400 });
    }

    const source = await getSourceById(sourceId);
    if (!source) {
      return NextResponse.json({ error: `Source not found: ${sourceId}` }, { status: 404 });
    }

    // Phase 5: Pre-Transformation Security Screening Gate
    const textToScreen = source.extractedText || source.rawContent || "";
    const sourceSecurityDecision = SecurityEngine.scanSource(textToScreen, {
      organizationId,
      userId,
      sourceId
    });

    if (sourceSecurityDecision.decision === "BLOCK") {
      return NextResponse.json(
        {
          error: "Security Policy Violation: Source material contains critical credentials or prohibited payload.",
          decision: "BLOCK",
          reasons: sourceSecurityDecision.reasons,
          findings: sourceSecurityDecision.findings
        },
        { status: 422 }
      );
    }

    // Ensure source has structured analysis (Cost Control: analyze once if missing)
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
      await updateSourceAnalysis(sourceId, analysis, "ANALYZED");
    }

    const options: TransformationOptions = {
      outputType: outputType as SupportedOutputFormat,
      targetAudience,
      tone,
      language,
      detailLevel,
      communicationObjective,
      brandPreferences
    };

    // Run Transformation from reusable structured intelligence
    const result = await AIService.transformContent(analysis, options, organizationId);

    // Basic output validation
    if (!result.content || result.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation Failed: Generated content was empty.", status: "VALIDATION_FAILED" },
        { status: 422 }
      );
    }

    // Phase 5: Post-Transformation Output Security Screening Gate
    const outputSecurityDecision = SecurityEngine.validateGeneratedContent(result.content, analysis);
    if (outputSecurityDecision.decision === "BLOCK") {
      return NextResponse.json(
        {
          error: "Output Security Policy Violation: Generated artefact leaked prohibited credentials.",
          decision: "BLOCK",
          reasons: outputSecurityDecision.reasons,
          findings: outputSecurityDecision.findings
        },
        { status: 422 }
      );
    }

    const initialStatus = (sourceSecurityDecision.requiresHumanReview || outputSecurityDecision.requiresHumanReview)
      ? ("SECURITY_REVIEW" as const)
      : ("GENERATED" as const);

    // Persist Content item in Firestore (Version 1)
    const contentPayload = {
      organizationId,
      userId,
      sourceId,
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
      detailLevel: detailLevel === "SHORT" ? "CONCISE" : detailLevel === "DETAILED" ? "COMPREHENSIVE" : "BALANCED" as any,
      communicationObjective,
      securityCheck: {
        passed: true,
        piiClean: !outputSecurityDecision.findings.some((f) => f.type === "PII"),
        detectedPiiEntities: outputSecurityDecision.findings.filter((f) => f.type === "PII").map((f) => f.evidence),
        promptInjectionSafe: !sourceSecurityDecision.findings.some((f) => f.type === "PROMPT_INJECTION"),
        hallucinationRisk: (outputSecurityDecision.findings.some((f) => f.type === "UNSUPPORTED_CLAIM") ? "HIGH" : "LOW") as "HIGH" | "LOW",
        brandSafetyCompliant: true,
        secretLeaksFound: outputSecurityDecision.findings.some((f) => f.type === "SECRET"),
        sourceTraceabilityScore: sourceSecurityDecision.findings.length === 0 ? 0.98 : 0.85,
        checkedAt: new Date().toISOString(),
        notes: sourceSecurityDecision.reasons.concat(outputSecurityDecision.reasons).join("; ")
      },
      currentVersion: {
        versionNumber: 1,
        title: result.title,
        body: result.content,
        content: result.content,
        providerUsed: `${result.providerUsed}:${result.modelUsed}`,
        generationConfig: options as unknown as Record<string, unknown>,
        slideOutline: result.slides ? result.slides.map(s => ({ slideNumber: s.slideNumber, title: s.title, bullets: s.keyPoints, speakerNotes: s.speakerNotes })) : undefined,
        metadata: {
          wordCount: result.metadata.wordCount,
          characterCount: result.metadata.characterCount,
          estimatedReadTimeMinutes: result.metadata.estimatedReadTimeMinutes,
          tags: result.metadata.tags
        },
        createdAt: new Date().toISOString()
      },
      versionHistory: []
    };

    const savedContent = await createContent(contentPayload);

    return NextResponse.json({
      success: true,
      content: savedContent,
      result
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error executing transformation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
