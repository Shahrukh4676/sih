import { NextRequest, NextResponse } from "next/server";
import { createSource, getSourceById, updateSourceAnalysis } from "@/lib/services/sources.service";
import { createContent } from "@/lib/services/content.service";
import { AIService } from "@/lib/ai/ai.service";
import { TransformationOptions, SupportedOutputFormat } from "@/lib/ai/types";
import { SecurityEngine } from "@/lib/security/security-engine";
import { TrustScoreEngine } from "@/lib/ai/intelligence/trust-score";
import { logAuditEvent } from "@/lib/services/audit.service";
import { SecurityService } from "@/lib/services/security.service";

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

    // ─── 0. User Prompt Security Screen (PRD Section 5 & 23) ──────────────────
    const effectivePrompt = String(body.prompt || body.userPrompt || body.customInstructions || "").trim();
    if (effectivePrompt) {
      const promptSecurity = SecurityEngine.scanPrompt(effectivePrompt, {
        organizationId,
        userId,
      });

      if (promptSecurity.decision === "BLOCK") {
        const isHoneytoken = Boolean(promptSecurity.honeytokenTriggered);
        const hasInjection = promptSecurity.findings.some((f) => f.type === "PROMPT_INJECTION");

        await logAuditEvent({
          organizationId,
          userId,
          userEmail: "security-gate@nexus.ai",
          userRole: "CREATOR",
          ipAddress: "127.0.0.1",
          userAgent: "NEXUS-ZeroTrustSecurityPipeline",
          action: isHoneytoken
            ? "HONEYTOKEN_EXPOSURE"
            : hasInjection
            ? "PROMPT_INJECTION_BLOCKED"
            : "SECURITY_POLICY_VIOLATION",
          resourceType: "PROMPT_SCREEN",
          resourceId: `prompt_blocked_${Date.now()}`,
          severity: promptSecurity.riskLevel === "CRITICAL" ? "CRITICAL" : "SECURITY_ALERT",
          details: {
            verdict: "BLOCK",
            sourceType: "PROMPT",
            riskLevel: promptSecurity.riskLevel,
            confidence: promptSecurity.confidence,
            safeSummary: promptSecurity.report?.whatHappened || promptSecurity.summary,
          },
        });

        await SecurityService.recordSecurityEvent({
          organizationId,
          eventType: isHoneytoken
            ? ("HONEYTOKEN_EXPOSURE" as any)
            : hasInjection
            ? ("PROMPT_INJECTION_DETECTED" as any)
            : ("SECURITY_POLICY_BLOCKED" as any),
          severity: promptSecurity.riskLevel,
          description: promptSecurity.report?.whatHappened || promptSecurity.summary,
          actorId: userId,
          sourceType: "PROMPT",
          decision: "BLOCKED",
          detectionVersion: promptSecurity.detectionVersion,
          policyVersion: promptSecurity.policyVersion,
          timestamp: new Date().toISOString(),
          status: "RESOLVED",
        });

        return NextResponse.json(
          {
            error: promptSecurity.report?.whatHappened || "PROMPT INJECTION DETECTED: The request attempted to override trusted instructions and access protected information.",
            decision: "BLOCK",
            sourceType: "PROMPT",
            riskLevel: promptSecurity.riskLevel,
            reasons: promptSecurity.reasons,
            findings: promptSecurity.findings,
            checks: promptSecurity.checks,
            report: {
              whatHappened: "Prompt injection detected.",
              sourceType: "PROMPT",
              why: "The request attempted to override trusted instructions and access protected information.",
              whatNexusDid: "The malicious instruction was prevented from controlling the AI workflow.",
              result: "AI generation blocked. Security event recorded.",
            },
            confidence: promptSecurity.confidence,
            honeytokenTriggered: promptSecurity.honeytokenTriggered,
          },
          { status: 422 }
        );
      }
    }

    // ─── Resolve source ────────────────────────────────────────────────────────
    let source = null;

    if (incomingSourceId) {
      // Try to fetch pre-existing source
      source = await getSourceById(incomingSourceId);
    }

    if (!source) {
      // Create source inline from raw text or URL
      const rawContent = sourceText || sourceUrl || effectivePrompt || "";
      if (!rawContent.trim()) {
        return NextResponse.json(
          { error: "Provide either sourceId, sourceText, sourceUrl, or prompt" },
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
      sourceType: source.type,
    });

    if (sourceSecurityDecision.decision === "BLOCK") {
      const isHoneytoken = Boolean(sourceSecurityDecision.honeytokenTriggered);
      const hasInjection = sourceSecurityDecision.findings.some((f) => f.type === "PROMPT_INJECTION");

      await logAuditEvent({
        organizationId,
        userId,
        userEmail: "security-gate@nexus.ai",
        userRole: "CREATOR",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-ZeroTrustSecurityPipeline",
        action: isHoneytoken
          ? "HONEYTOKEN_EXPOSURE"
          : hasInjection
          ? "PROMPT_INJECTION_BLOCKED"
          : "SECURITY_POLICY_VIOLATION",
        resourceType: "TRANSFORMATION_GATE",
        resourceId: source.id,
        severity: sourceSecurityDecision.riskLevel === "CRITICAL" ? "CRITICAL" : "SECURITY_ALERT",
        details: {
          verdict: "BLOCK",
          sourceType: source.type,
          riskLevel: sourceSecurityDecision.riskLevel,
          confidence: sourceSecurityDecision.confidence,
          safeSummary: sourceSecurityDecision.report?.whatHappened || sourceSecurityDecision.summary,
        },
      });

      await SecurityService.recordSecurityEvent({
        organizationId,
        eventType: isHoneytoken
          ? ("HONEYTOKEN_EXPOSURE" as any)
          : hasInjection
          ? ("PROMPT_INJECTION_DETECTED" as any)
          : ("SECURITY_POLICY_BLOCKED" as any),
        severity: sourceSecurityDecision.riskLevel,
        description: sourceSecurityDecision.report?.whatHappened || sourceSecurityDecision.summary,
        actorId: userId,
        sourceType: source.type,
        decision: "BLOCKED",
        detectionVersion: sourceSecurityDecision.detectionVersion,
        policyVersion: sourceSecurityDecision.policyVersion,
        timestamp: new Date().toISOString(),
        status: "RESOLVED",
      });

      return NextResponse.json(
        {
          error: sourceSecurityDecision.report?.whatHappened || "Security policy blocked this request.",
          decision: "BLOCK",
          sourceType: source.type,
          riskLevel: sourceSecurityDecision.riskLevel,
          reasons: sourceSecurityDecision.reasons,
          findings: sourceSecurityDecision.findings,
          checks: sourceSecurityDecision.checks,
          report: sourceSecurityDecision.report,
          confidence: sourceSecurityDecision.confidence,
          honeytokenTriggered: sourceSecurityDecision.honeytokenTriggered,
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

    // ─── AI Transformation with Safe Context ──────────────────────────────────
    const options: TransformationOptions = {
      outputType: outputType as SupportedOutputFormat,
      targetAudience,
      tone,
      language,
      detailLevel,
      communicationObjective: objective || communicationObjective,
      customInstructions: effectivePrompt || undefined,
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
      await logAuditEvent({
        organizationId,
        userId,
        userEmail: "security-gate@nexus.ai",
        userRole: "CREATOR",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-ZeroTrustSecurityPipeline",
        action: "OUTPUT_SECURITY_LEAK_BLOCKED",
        resourceType: "OUTPUT_VALIDATION",
        resourceId: source.id,
        severity: outputSecurityDecision.riskLevel === "CRITICAL" ? "CRITICAL" : "SECURITY_ALERT",
        details: {
          verdict: "BLOCK",
          riskLevel: outputSecurityDecision.riskLevel,
          confidence: outputSecurityDecision.confidence,
          safeSummary: outputSecurityDecision.report?.whatHappened || outputSecurityDecision.summary,
        },
      });

      return NextResponse.json(
        {
          error: outputSecurityDecision.report?.whatHappened || "Output security policy violation detected.",
          decision: "BLOCK",
          riskLevel: outputSecurityDecision.riskLevel,
          reasons: outputSecurityDecision.reasons,
          findings: outputSecurityDecision.findings,
          checks: outputSecurityDecision.checks,
          report: outputSecurityDecision.report,
          confidence: outputSecurityDecision.confidence,
        },
        { status: 422 }
      );
    }

    const initialStatus =
      sourceSecurityDecision.requiresHumanReview || outputSecurityDecision.requiresHumanReview
        ? ("SECURITY_REVIEW" as const)
        : ("GENERATED" as const);

    // ─── Deterministic Trust Score Engine ────────────────────────────────────
    const allSecurityFindings = [
      ...sourceSecurityDecision.findings,
      ...outputSecurityDecision.findings,
    ];

    const trustScoreResult = TrustScoreEngine.calculateScore({
      outputContent: result.content,
      outputFormat: outputType,
      sourceIntelligence: analysis,
      securityFindings: allSecurityFindings,
      approvalStatus: initialStatus === "SECURITY_REVIEW" ? "SECURITY_REVIEW" : "PENDING",
      brandPreferences,
    });

    const initialStatusFinal =
      trustScoreResult.verdict === "BLOCKED"
        ? ("SECURITY_REVIEW" as const)
        : initialStatus;

    // ─── Persist content ──────────────────────────────────────────────────────
    const contentPayload = {
      organizationId,
      userId,
      sourceId: source.id,
      outputFormat: outputType,
      outputType,
      title: result.title,
      content: result.content,
      status: initialStatusFinal,
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
      trustScore: trustScoreResult.overallScore,
      trustScoreVerdict: trustScoreResult.verdict,
      trustScoreBreakdown: trustScoreResult.breakdown,
      securityCheck: {
        passed: trustScoreResult.verdict !== "BLOCKED",
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
        brandSafetyCompliant: trustScoreResult.breakdown.compliance.bannedPhrasesFound.length === 0,
        secretLeaksFound: outputSecurityDecision.findings.some((f) => f.type === "SECRET"),
        sourceTraceabilityScore: trustScoreResult.breakdown.grounding.score / 100,
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
      title: result.title,
      generatedText: result.content,
      contentId: savedContent?.id,
      id: savedContent?.id,
      trustScore: trustScoreResult,
      result,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error executing transformation";
    console.error("[/api/transform] Unhandled error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
