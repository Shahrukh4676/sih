// ==============================================================================
// NEXUS AI - Brand & Compliance Layer (Prompt Intelligence Layer)
// ==============================================================================
// Enforces brand voice consistency, detects and strips banned phrases,
// and ensures mandatory compliance disclaimers are present.
// ==============================================================================

export interface BrandRuleCheckResult {
  passed: boolean;
  bannedPhrasesFound: string[];
  missingDisclaimers: string[];
  sanitizedContent: string;
  notes: string[];
}

export class BrandLayer {
  private static DEFAULT_BANNED_PHRASES = [
    "game changer",
    "revolutionary",
    "silver bullet",
    "100% secure",
    "hack-proof",
    "unbreakable",
    "guaranteed 0% risk",
  ];

  /**
   * Generates prompt directives enforcing brand standards.
   */
  public static getBrandDirectives(preferences?: {
    tone?: string;
    bannedPhrases?: string[];
    mandatoryDisclaimers?: string[];
  }): string {
    if (!preferences) return "";

    const banned = Array.from(
      new Set([...this.DEFAULT_BANNED_PHRASES, ...(preferences.bannedPhrases || [])])
    );

    const directives: string[] = [
      "BRAND VOICE & COMPLIANCE DIRECTIVES:",
      preferences.tone ? `- Required Brand Tone: ${preferences.tone}` : "",
      banned.length > 0 ? `- STRICTLY PROHIBITED WORDS/PHRASES: ${banned.join(", ")}` : "",
      preferences.mandatoryDisclaimers?.length
        ? `- MANDATORY LEGAL/COMPLIANCE DISCLAIMER (must be included at bottom): ${preferences.mandatoryDisclaimers.join(" | ")}`
        : "",
    ];

    return directives.filter(Boolean).join("\n");
  }

  /**
   * Validates generated output against brand rules and returns sanitized copy.
   */
  public static evaluateContent(
    content: string,
    preferences?: {
      bannedPhrases?: string[];
      mandatoryDisclaimers?: string[];
    }
  ): BrandRuleCheckResult {
    const banned = Array.from(
      new Set([...this.DEFAULT_BANNED_PHRASES, ...(preferences?.bannedPhrases || [])])
    );

    const lower = content.toLowerCase();
    const bannedFound = banned.filter((phrase) => lower.includes(phrase.toLowerCase()));

    const missingDisclaimers = (preferences?.mandatoryDisclaimers || []).filter(
      (disc) => !content.includes(disc)
    );

    let sanitized = content;
    for (const phrase of bannedFound) {
      const regex = new RegExp(`\\b${phrase}\\b`, "gi");
      sanitized = sanitized.replace(regex, "[Redacted Compliance Term]");
    }

    if (missingDisclaimers.length > 0) {
      sanitized = `${sanitized}\n\n---\n${missingDisclaimers.join("\n")}`;
    }

    const passed = bannedFound.length === 0 && missingDisclaimers.length === 0;

    return {
      passed,
      bannedPhrasesFound: bannedFound,
      missingDisclaimers,
      sanitizedContent: sanitized,
      notes: [
        bannedFound.length > 0 ? `Banned phrases detected: ${bannedFound.join(", ")}` : "No banned phrases.",
        missingDisclaimers.length > 0 ? `Appended ${missingDisclaimers.length} missing disclaimer(s).` : "All disclaimers intact.",
      ],
    };
  }
}
