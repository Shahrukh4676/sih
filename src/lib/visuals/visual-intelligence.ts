// ==============================================================================
// NEXUS AI - Visual Intelligence Service (Phase 4)
// ==============================================================================
// Generates grounded VisualBrief objects from Structured Source Intelligence
// and generated content.
// CRITICAL GROUNDING REQUIREMENT:
// Never fabricates statistics. All numerical data must originate from validated
// source intelligence. If no numbers exist, conceptual layout is selected.
// ==============================================================================

import { StructuredSourceIntelligence } from "@/lib/ai/types";
import {
  VisualBrief,
  VisualType,
  VisualAspectRatio,
  GroundedStatistic,
  BrandProfile
} from "@/types";

export interface VisualIntelligenceInput {
  content: {
    id?: string;
    title: string;
    content: string;
    outputFormat?: string;
    targetAudience?: string;
    tone?: string;
  };
  sourceIntelligence?: StructuredSourceIntelligence | null;
  preferredVisualType?: VisualType;
  brand?: BrandProfile;
  customInstructions?: string;
}

const DEFAULT_BRAND: BrandProfile = {
  organizationName: "NEXUS AI Enterprise",
  primaryColor: "#06B6D4", // Cyan
  secondaryColor: "#3B82F6", // Blue
  accentColor: "#F59E0B", // Amber
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  footerText: "NEXUS AI • Grounded Intelligence & Transformation"
};

export class VisualIntelligenceService {
  /**
   * Generates a structured visual brief strictly grounded in source intelligence
   */
  public static generateBrief(input: VisualIntelligenceInput): VisualBrief {
    const { content, sourceIntelligence, preferredVisualType, brand: userBrand } = input;
    const brand: BrandProfile = { ...DEFAULT_BRAND, ...(userBrand || {}) };

    // 1. Determine visual type based on content format or explicit preference
    const visualType = preferredVisualType || this.inferVisualType(content.outputFormat);

    // 2. Aspect ratio & dimensions
    const { aspectRatio, width, height } = this.getDimensionsForType(visualType);

    // 3. Extract grounded statistics (strict zero-fabrication)
    const statistics = this.extractGroundedStatistics(sourceIntelligence, content.content);

    // 4. Extract key facts & highlights
    const keyFacts = this.extractKeyFacts(sourceIntelligence, content.content);

    // 5. Derive headline and subheadline
    const headline = this.cleanHeadline(content.title || sourceIntelligence?.title || "Executive Brief");
    const subheadline = this.deriveSubheadline(sourceIntelligence, content.content, visualType);

    // 6. Select optimal layout
    const layout = this.selectLayout(visualType, statistics.length);

    // 7. Icon & aesthetic recommendations
    const iconSuggestions = this.selectIcons(visualType, sourceIntelligence?.main_topic || "");
    const backgroundStyle = this.selectBackground(visualType, content.tone);

    // 8. Generate comprehensive accessibility text
    const accessibilityText = this.generateAccessibilityText({
      visualType,
      headline,
      subheadline,
      keyFacts,
      statistics,
      orgName: brand.organizationName
    });

    const illustrationDescription = `Minimalist vector graphic with high-contrast badge, ${
      statistics.length > 0 ? `${statistics.length} verified metrics cards` : "grounded takeaway pillars"
    }, and dark enterprise cybersecurity theme.`;

    return {
      visualType,
      title: content.title || "Intelligence Asset",
      headline,
      subheadline,
      keyFacts,
      statistics,
      visualHierarchy: ["STATUS_BADGE", "PRIMARY_HEADLINE", "KEY_METRICS_OR_PILLARS", "BRAND_FOOTER"],
      layout,
      iconSuggestions,
      illustrationDescription,
      backgroundStyle,
      aspectRatio,
      width,
      height,
      accessibilityText,
      brand
    };
  }

  private static inferVisualType(outputFormat?: string): VisualType {
    switch (outputFormat) {
      case "CYBERSECURITY_ADVISORY":
        return "ADVISORY_ALERT";
      case "EXECUTIVE_SUMMARY":
        return "EXECUTIVE_BRIEF";
      case "INFOGRAPHIC_SPEC":
        return "INFOGRAPHIC";
      case "LINKEDIN_POST":
      case "X_THREAD":
      default:
        return "SOCIAL_CARD";
    }
  }

  private static getDimensionsForType(type: VisualType): {
    aspectRatio: VisualAspectRatio;
    width: number;
    height: number;
  } {
    switch (type) {
      case "INFOGRAPHIC":
        return { aspectRatio: "4:5", width: 1080, height: 1350 };
      case "QUOTE_CARD":
        return { aspectRatio: "1:1", width: 1080, height: 1080 };
      case "SOCIAL_CARD":
      case "EXECUTIVE_BRIEF":
      case "ADVISORY_ALERT":
      default:
        return { aspectRatio: "1.91:1", width: 1200, height: 628 };
    }
  }

  /**
   * Grounded extraction: only extracts verified statistics from source intelligence or explicit text.
   * NEVER invents random percentages like 35% or 50%.
   */
  private static extractGroundedStatistics(
    source?: StructuredSourceIntelligence | null,
    contentText?: string
  ): GroundedStatistic[] {
    const results: GroundedStatistic[] = [];
    const seen = new Set<string>();

    // 1. Check validated source intelligence statistics array
    if (source?.statistics && Array.isArray(source.statistics)) {
      for (const statStr of source.statistics) {
        const parsed = this.parseStatString(statStr);
        if (parsed && !seen.has(parsed.value)) {
          seen.add(parsed.value);
          results.push(parsed);
        }
      }
    }

    // 2. Scan source key points, claims, and text for verified numeric indicators (CVSS, versions, percentages)
    const textCorpus = [
      ...(source?.key_points || []),
      ...(source?.claims || []),
      ...(source?.risks || []),
      contentText || ""
    ].join(" ");

    // CVSS Score match (e.g. CVSS 9.8)
    const cvssMatch = textCorpus.match(/CVSS\s*(?:v\d(?:\.\d)?)?\s*[:=]?\s*([0-9]\.[0-9])/i);
    if (cvssMatch && !seen.has("CVSS")) {
      seen.add("CVSS");
      results.push({
        value: cvssMatch[1],
        label: "CVSS Severity Rating",
        sourceContext: cvssMatch[0]
      });
    }

    // Percentage match (e.g. 35%, 100%)
    const pctRegex = /(\b\d{1,3}(?:\.\d+)?%)\s+([^.,;\n]{3,35})/gi;
    let match: RegExpExecArray | null;
    while ((match = pctRegex.exec(textCorpus)) !== null && results.length < 3) {
      const val = match[1];
      const lbl = match[2].trim();
      if (!seen.has(val) && lbl.length > 2) {
        seen.add(val);
        results.push({
          value: val,
          label: lbl.slice(0, 30),
          sourceContext: match[0]
        });
      }
    }

    // Version match if security advisory (e.g. v3.4.2)
    const verMatch = textCorpus.match(/(?:patch to|update to|version)\s+(v?[0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    if (verMatch && results.length < 3 && !seen.has("VERSION")) {
      seen.add("VERSION");
      results.push({
        value: verMatch[1],
        label: "Target Patch Version",
        sourceContext: verMatch[0]
      });
    }

    return results.slice(0, 3);
  }

  private static parseStatString(str: string): GroundedStatistic | null {
    if (!str || typeof str !== "string") return null;

    // Ignore raw CVE identifiers as numeric statistics
    if (str.trim().toUpperCase().startsWith("CVE-")) return null;

    // Require an explicit numeric or percentage component
    const numMatch = str.match(/([$€£]?\d+(?:\.\d+)?(?:%|x|k|M|B)?)/i);
    if (!numMatch) return null;

    const value = numMatch[1];
    const label = str.replace(value, "").replace(/^[-:=,\s]+|[-:=,\s]+$/g, "").trim();

    return {
      value,
      label: label.slice(0, 35) || "Verified Metric",
      sourceContext: str
    };
  }

  private static extractKeyFacts(
    source?: StructuredSourceIntelligence | null,
    contentText?: string
  ): string[] {
    const facts: string[] = [];

    if (source?.key_points && source.key_points.length > 0) {
      facts.push(...source.key_points.slice(0, 4));
    } else if (source?.recommendations && source.recommendations.length > 0) {
      facts.push(...source.recommendations.slice(0, 4));
    } else if (contentText) {
      // Extract first 3 sentence bullets
      const lines = contentText
        .split("\n")
        .map((l) => l.replace(/^[-*•\d.]+\s*/, "").trim())
        .filter((l) => l.length > 20 && l.length < 140);
      facts.push(...lines.slice(0, 3));
    }

    if (facts.length === 0) {
      facts.push("Verified source intelligence transformed by NEXUS AI.");
    }

    return facts.map((f) => (f.length > 100 ? `${f.slice(0, 97)}...` : f));
  }

  private static cleanHeadline(raw: string): string {
    return raw
      .replace(/^#+\s*/, "")
      .replace(/^CRITICAL SECURITY ADVISORY:\s*/i, "")
      .replace(/^EXECUTIVE SUMMARY:\s*/i, "")
      .trim()
      .slice(0, 75);
  }

  private static deriveSubheadline(
    source?: StructuredSourceIntelligence | null,
    contentText?: string,
    visualType?: VisualType
  ): string {
    if (visualType === "ADVISORY_ALERT") {
      return "Immediate action and mitigation guidance for security teams";
    }
    if (source?.summary) {
      return source.summary.slice(0, 110);
    }
    if (contentText) {
      const firstSentence = contentText.split(/[.\n]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 15) {
        return firstSentence.slice(0, 110);
      }
    }
    return "Actionable takeaways and verified intelligence breakdown";
  }

  private static selectLayout(
    type: VisualType,
    statCount: number
  ): VisualBrief["layout"] {
    if (type === "ADVISORY_ALERT") return "ALERT_BANNER";
    if (type === "INFOGRAPHIC") return "TIMELINE_STACK";
    if (statCount >= 2) return "HERO_METRIC";
    return "SPLIT_CALLOUT";
  }

  private static selectIcons(type: VisualType, topic: string): string[] {
    const isSecurity = topic.toLowerCase().includes("security") || type === "ADVISORY_ALERT";
    if (isSecurity) {
      return ["shield-alert", "lock", "cpu", "check-circle"];
    }
    return ["bar-chart-2", "trending-up", "layers", "zap"];
  }

  private static selectBackground(
    type: VisualType,
    tone?: string
  ): VisualBrief["backgroundStyle"] {
    if (type === "ADVISORY_ALERT" || tone === "URGENT") return "DARK_CYBER";
    if (type === "EXECUTIVE_BRIEF") return "EXECUTIVE_NAVY";
    if (tone === "EDUCATIONAL" || tone === "PERSUASIVE") return "VIBRANT_GRADIENT";
    return "SLATE_MINIMAL";
  }

  private static generateAccessibilityText(params: {
    visualType: VisualType;
    headline: string;
    subheadline: string;
    keyFacts: string[];
    statistics: GroundedStatistic[];
    orgName: string;
  }): string {
    const statsDesc =
      params.statistics.length > 0
        ? ` Highlights grounded metrics: ${params.statistics
            .map((s) => `${s.value} (${s.label})`)
            .join(", ")}.`
        : "";
    const factsDesc = params.keyFacts.length > 0 ? ` Key points include: ${params.keyFacts.join("; ")}.` : "";

    return `${params.visualType.replace("_", " ")} created by ${params.orgName}: "${params.headline}". ${
      params.subheadline
    }.${statsDesc}${factsDesc}`;
  }
}
