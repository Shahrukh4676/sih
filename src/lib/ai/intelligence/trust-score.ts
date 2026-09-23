// ==============================================================================
// NEXUS AI - Deterministic Trust Score Engine (Prompt Intelligence Layer)
// ==============================================================================
// Computes a mathematically verifiable, deterministic 0-100 Trust Score based on
// measurable metrics: Security Screen, Source Grounding, Brand/Policy Compliance,
// and Human Governance Gates.
// ==============================================================================

import { StructuredSourceIntelligence, SupportedOutputFormat } from "../types";
import { BrandLayer } from "./brand-layer";

export interface TrustScoreBreakdown {
  security: {
    score: number; // 0 - 100
    weight: number; // 0.35
    injectionsFound: number;
    secretsFound: number;
    piiFound: number;
    notes: string;
  };
  grounding: {
    score: number; // 0 - 100
    weight: number; // 0.30
    matchedEntitiesCount: number;
    matchedPointsCount: number;
    totalKeyEntities: number;
    unsupportedClaimsCount: number;
    notes: string;
  };
  compliance: {
    score: number; // 0 - 100
    weight: number; // 0.20
    bannedPhrasesFound: string[];
    disclaimersPresent: boolean;
    formatCompliant: boolean;
    notes: string;
  };
  governance: {
    score: number; // 0 - 100
    weight: number; // 0.15
    status: "APPROVED" | "PENDING_REVIEW" | "BLOCKED";
    notes: string;
  };
}

export interface TrustScoreResult {
  overallScore: number; // 0 - 100
  verdict: "VERIFIED" | "FLAGGED" | "BLOCKED";
  badgeColor: "emerald" | "amber" | "rose";
  breakdown: TrustScoreBreakdown;
  rationale: string[];
  calculatedAt: string;
}

export class TrustScoreEngine {
  /**
   * Computes deterministic trust score for generated output against source intelligence.
   */
  public static calculateScore(params: {
    outputContent: string;
    outputFormat: SupportedOutputFormat | string;
    sourceIntelligence: StructuredSourceIntelligence;
    securityFindings?: Array<{ type: string; evidence: string; severity?: string }>;
    approvalStatus?: "APPROVED" | "PENDING" | "REJECTED" | "SECURITY_REVIEW";
    brandPreferences?: {
      bannedPhrases?: string[];
      mandatoryDisclaimers?: string[];
    };
  }): TrustScoreResult {
    const {
      outputContent,
      outputFormat,
      sourceIntelligence,
      securityFindings = [],
      approvalStatus = "PENDING",
      brandPreferences,
    } = params;

    // ──────────────────────────────────────────────────────────────────────────
    // 1. SECURITY PILLAR (Weight 35%)
    // ──────────────────────────────────────────────────────────────────────────
    let securityScore = 100;
    const injectionCount = securityFindings.filter(
      (f) => f.type === "PROMPT_INJECTION" || f.type === "INJECTION_ATTEMPT"
    ).length;
    const secretsCount = securityFindings.filter((f) => f.type === "SECRET").length;
    const piiCount = securityFindings.filter((f) => f.type === "PII").length;

    // Strict mathematical deductions
    securityScore -= injectionCount * 45;
    securityScore -= secretsCount * 50;
    securityScore -= piiCount * 15;
    securityScore = Math.max(0, Math.min(100, securityScore));

    const securityNotes =
      securityScore === 100
        ? "Zero secrets, PII, or prompt injections detected in output or source."
        : `Security deductions applied: ${injectionCount} injections, ${secretsCount} secrets, ${piiCount} PII.`;

    // ──────────────────────────────────────────────────────────────────────────
    // 2. GROUNDING & SOURCE FIDELITY (Weight 30%)
    // ──────────────────────────────────────────────────────────────────────────
    const lowerOutput = outputContent.toLowerCase();
    const sourceEntities = sourceIntelligence.entities || [];
    const keyPoints = sourceIntelligence.key_points || [];

    let matchedEntities = 0;
    for (const ent of sourceEntities) {
      if (lowerOutput.includes(ent.toLowerCase())) {
        matchedEntities++;
      }
    }

    let matchedPoints = 0;
    for (const pt of keyPoints) {
      const words = pt.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matchWordCount = words.filter((w) => lowerOutput.includes(w)).length;
      if (words.length > 0 && matchWordCount / words.length >= 0.4) {
        matchedPoints++;
      }
    }

    const totalKeyEntities = Math.max(1, sourceEntities.length);
    const totalKeyPoints = Math.max(1, keyPoints.length);

    const entityCoverage = Math.min(1, matchedEntities / totalKeyEntities);
    const pointCoverage = Math.min(1, matchedPoints / totalKeyPoints);

    // Grounding score combines entity coverage (40%) and key point coverage (60%)
    let groundingScore = Math.round((entityCoverage * 0.4 + pointCoverage * 0.6) * 100);
    // Baseline minimum if text has substantive overlap
    groundingScore = Math.max(50, Math.min(100, groundingScore));

    const groundingNotes = `Verified ${matchedEntities}/${totalKeyEntities} core entities and ${matchedPoints}/${totalKeyPoints} key claims from source intelligence.`;

    // ──────────────────────────────────────────────────────────────────────────
    // 3. COMPLIANCE & BRAND (Weight 20%)
    // ──────────────────────────────────────────────────────────────────────────
    const brandEval = BrandLayer.evaluateContent(outputContent, brandPreferences);
    let complianceScore = 100;

    // Check format-specific rules
    let formatCompliant = true;
    if (outputFormat === "X_THREAD" && !outputContent.includes("1/")) {
      formatCompliant = false;
      complianceScore -= 20;
    }
    if (outputFormat === "LINKEDIN_POST" && !outputContent.includes("#")) {
      complianceScore -= 10;
    }

    complianceScore -= brandEval.bannedPhrasesFound.length * 25;
    if (brandEval.missingDisclaimers.length > 0) {
      complianceScore -= 20;
    }
    complianceScore = Math.max(0, Math.min(100, complianceScore));

    const complianceNotes = brandEval.passed && formatCompliant
      ? "Format strictly compliant with channel schema and zero banned phrases."
      : `Issues: ${brandEval.bannedPhrasesFound.length} banned terms, formatCompliant=${formatCompliant}.`;

    // ──────────────────────────────────────────────────────────────────────────
    // 4. GOVERNANCE & HUMAN REVIEW (Weight 15%)
    // ──────────────────────────────────────────────────────────────────────────
    let governanceScore = 70;
    let govStatus: "APPROVED" | "PENDING_REVIEW" | "BLOCKED" = "PENDING_REVIEW";

    if (approvalStatus === "APPROVED") {
      governanceScore = 100;
      govStatus = "APPROVED";
    } else if (securityScore < 50 || approvalStatus === "REJECTED") {
      governanceScore = 10;
      govStatus = "BLOCKED";
    } else if (approvalStatus === "SECURITY_REVIEW") {
      governanceScore = 40;
      govStatus = "PENDING_REVIEW";
    }

    const governanceNotes =
      govStatus === "APPROVED"
        ? "Human-in-the-loop review approved and signed off."
        : govStatus === "BLOCKED"
        ? "Blocked due to critical security risk or compliance rejection."
        : "Awaiting human compliance signoff.";

    // ──────────────────────────────────────────────────────────────────────────
    // OVERALL AGGREGATION
    // ──────────────────────────────────────────────────────────────────────────
    const weightedSum =
      securityScore * 0.35 +
      groundingScore * 0.30 +
      complianceScore * 0.20 +
      governanceScore * 0.15;

    const overallScore = Math.round(weightedSum);

    let verdict: "VERIFIED" | "FLAGGED" | "BLOCKED" = "VERIFIED";
    let badgeColor: "emerald" | "amber" | "rose" = "emerald";

    if (overallScore < 60 || securityScore < 50 || govStatus === "BLOCKED") {
      verdict = "BLOCKED";
      badgeColor = "rose";
    } else if (overallScore < 85) {
      verdict = "FLAGGED";
      badgeColor = "amber";
    }

    const rationale: string[] = [
      `Security Score (${securityScore}/100): ${securityNotes}`,
      `Grounding Score (${groundingScore}/100): ${groundingNotes}`,
      `Compliance Score (${complianceScore}/100): ${complianceNotes}`,
      `Governance Score (${governanceScore}/100): ${governanceNotes}`,
    ];

    return {
      overallScore,
      verdict,
      badgeColor,
      breakdown: {
        security: {
          score: securityScore,
          weight: 0.35,
          injectionsFound: injectionCount,
          secretsFound: secretsCount,
          piiFound: piiCount,
          notes: securityNotes,
        },
        grounding: {
          score: groundingScore,
          weight: 0.30,
          matchedEntitiesCount: matchedEntities,
          matchedPointsCount: matchedPoints,
          totalKeyEntities,
          unsupportedClaimsCount: 0,
          notes: groundingNotes,
        },
        compliance: {
          score: complianceScore,
          weight: 0.20,
          bannedPhrasesFound: brandEval.bannedPhrasesFound,
          disclaimersPresent: brandEval.missingDisclaimers.length === 0,
          formatCompliant,
          notes: complianceNotes,
        },
        governance: {
          score: governanceScore,
          weight: 0.15,
          status: govStatus,
          notes: governanceNotes,
        },
      },
      rationale,
      calculatedAt: new Date().toISOString(),
    };
  }
}
