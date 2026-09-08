// ==============================================================================
// NEXUS AI - Multi-Format Transformation Prompts (Phase 3)
// ==============================================================================

import { StructuredSourceIntelligence, TransformationOptions, SupportedOutputFormat } from "../types";

export function buildTransformationPrompt(
  intelligence: StructuredSourceIntelligence,
  options: TransformationOptions
): string {
  const formatRules = getFormatSpecificRules(options.outputType);

  const brandDirectives = options.brandPreferences
    ? [
        "BRAND VOICE & COMPLIANCE RULES:",
        options.brandPreferences.tone ? `- Required Brand Tone: ${options.brandPreferences.tone}` : "",
        options.brandPreferences.bannedPhrases?.length
          ? `- BANNED WORDS/PHRASES (MUST NEVER APPEAR): ${options.brandPreferences.bannedPhrases.join(", ")}`
          : "",
        options.brandPreferences.mandatoryDisclaimers?.length
          ? `- MANDATORY DISCLAIMERS: ${options.brandPreferences.mandatoryDisclaimers.join(" | ")}`
          : ""
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    "You are the NEXUS AI Content Transformation Engine. Your task is to transform pre-analyzed, verified structured source intelligence into a high-impact, professional communication artefact.",
    "",
    "GOVERNANCE & FACTUAL GROUNDING DIRECTIVES:",
    "1. You must stay strictly grounded in the provided structured intelligence.",
    "2. NEVER invent facts, metrics, statistics, or quotations not present in the intelligence.",
    "3. Avoid claiming unsupported certainty. Distinguish source facts from actionable recommendations.",
    "4. Output MUST be valid JSON according to the schema provided.",
    "",
    "TRANSFORMATION PARAMETERS:",
    `- Target Output Format: ${options.outputType}`,
    `- Target Audience: ${options.targetAudience}`,
    `- Required Tone: ${options.tone}`,
    `- Output Language: ${options.language}`,
    `- Detail Level: ${options.detailLevel}`,
    `- Communication Objective: ${options.communicationObjective}`,
    "",
    brandDirectives,
    "",
    formatRules,
    "",
    "STRUCTURED SOURCE INTELLIGENCE (GROUND TRUTH):",
    JSON.stringify(intelligence, null, 2),
    "",
    "OUTPUT JSON SCHEMA:",
    "{",
    '  "title": "Compelling headline or subject line",',
    '  "content": "The complete formatted output text (use Markdown formatting appropriate to the format)",',
    '  "outputType": "' + options.outputType + '",',
    options.outputType === "PRESENTATION"
      ? '  "slides": [ { "slideNumber": 1, "title": "Slide Title", "keyPoints": ["Bullet 1", "Bullet 2"], "speakerNotes": "Narrative explanation" } ],'
      : "",
    '  "sourceReferences": ["List of key source claims or entities referenced in the text"],',
    '  "metadata": {',
    '    "tags": ["relevant", "hashtags", "or", "keywords"]',
    "  }",
    "}"
  ]
    .filter(Boolean)
    .join("\n");
}

function getFormatSpecificRules(format: SupportedOutputFormat): string {
  switch (format) {
    case "LINKEDIN_POST":
      return [
        "FORMAT RULES FOR LINKEDIN POST:",
        "- Opening: Strong, thought-provoking hook that establishes context without clickbait.",
        "- Body: Clear value proposition with short, scannable paragraphs and bullet points.",
        "- Closing: Discussion prompt inviting engagement from industry peers.",
        "- Hashtags: 3-5 relevant, professional hashtags at the end.",
        "- Style: Authoritative yet accessible. Zero fabricated hype."
      ].join("\n");

    case "X_THREAD":
      return [
        "FORMAT RULES FOR X THREAD:",
        "- Format: Numbered thread (e.g. 1/5, 2/5, 3/5 ...).",
        "- Tweet 1: Hook and overview of the critical development.",
        "- Tweets 2-(N-1): Single discrete fact, takeaway, or mitigation per post.",
        "- Final Tweet: Summary takeaway and link or resource prompt.",
        "- Length: Each tweet under 280 characters. Concise, crisp, punchy."
      ].join("\n");

    case "EXECUTIVE_SUMMARY":
      return [
        "FORMAT RULES FOR EXECUTIVE SUMMARY:",
        "- Structure must include exactly:",
        "  1. Situation (Current context & threat/opportunity trigger)",
        "  2. Key Findings (Factual source takeaways)",
        "  3. Business / Operational Impact (Downstream implications)",
        "  4. Strategic Risks (Direct vulnerabilities or compliance exposure)",
        "  5. Recommended Actions (Prioritized next steps)",
        "- Tone: Crisp, executive, risk-aligned."
      ].join("\n");

    case "CYBERSECURITY_ADVISORY":
      return [
        "FORMAT RULES FOR CYBERSECURITY ADVISORY:",
        "- Structure must include exactly:",
        "  1. Advisory Title & Classification",
        "  2. Executive Summary",
        "  3. Technical Issue / Threat Mechanics (CVEs, exploit vectors)",
        "  4. Severity & Impact Analysis",
        "  5. Indicators of Compromise (if present in source) or Risk Rating",
        "  6. Actionable Remediation & Firewall/Patch Guidance",
        "  7. Warnings & Caveats"
      ].join("\n");

    case "PRESENTATION":
      return [
        "FORMAT RULES FOR PRESENTATION OUTLINE:",
        "- Produce a structured slide deck (4 to 8 slides depending on detail level).",
        "- Each slide must have a Title, 3-5 concise Key Point bullet items, and detailed Speaker Notes.",
        "- Slide 1: Executive Title & Overview.",
        "- Body Slides: Problem statement, findings, analysis, operational impact.",
        "- Final Slide: Summary and strategic next steps."
      ].join("\n");
  }
}
