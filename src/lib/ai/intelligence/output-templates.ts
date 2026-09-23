// ==============================================================================
// NEXUS AI - Output Specific Prompt Templates (Prompt Intelligence Layer)
// ==============================================================================
// Specialized, structured transformation prompt templates for each target channel.
// ==============================================================================

import { SupportedOutputFormat } from "../types";

export interface OutputTemplateDefinition {
  format: SupportedOutputFormat;
  version: string;
  name: string;
  description: string;
  systemRules: string;
  jsonSchemaRequirements: string;
}

export const OUTPUT_TEMPLATES: Record<SupportedOutputFormat | string, OutputTemplateDefinition> = {
  LINKEDIN_POST: {
    format: "LINKEDIN_POST",
    version: "tpl_linkedin_v2.2",
    name: "LinkedIn Executive Post",
    description: "Executive hook, scannable value, discussion prompt, 3-5 tags",
    systemRules: [
      "FORMAT RULES FOR LINKEDIN POST:",
      "- Hook: High-impact opening sentence (max 140 chars) stating the core breakthrough or risk without clickbait.",
      "- Body: Crisp analysis broken into short 1-2 sentence paragraphs or clear bullet points.",
      "- Value Proposition: Direct operational relevance to industry leaders.",
      "- Discussion Prompt: Thoughtful closing question inviting professional commentary.",
      "- Hashtags: 3 to 5 targeted professional hashtags at the very bottom.",
      "- Length: 150 - 300 words total. Clean Markdown formatting.",
    ].join("\n"),
    jsonSchemaRequirements: [
      '  "title": "Engaging Headline",',
      '  "content": "Full formatted LinkedIn post text with line breaks and hashtags",',
      '  "sourceReferences": ["Key facts or sources cited"]',
    ].join("\n"),
  },

  X_THREAD: {
    format: "X_THREAD",
    version: "tpl_xthread_v2.2",
    name: "X Thread (280c)",
    description: "Numbered thread (1/N), concise standalone posts, closing CTA",
    systemRules: [
      "FORMAT RULES FOR X THREAD:",
      "- Thread Structure: Exactly 4 to 7 numbered posts separated by '\\n\\n---\\n\\n'.",
      "- Format Prefix: Begin each tweet with '1/N', '2/N', etc.",
      "- Length Constraint: EACH individual tweet MUST be <= 280 characters.",
      "- Tweet 1: Powerful hook framing the critical development.",
      "- Tweets 2-(N-1): Single actionable takeaway, statistic, or risk per tweet.",
      "- Final Tweet: Summary conclusion with link / resource placeholder.",
    ].join("\n"),
    jsonSchemaRequirements: [
      '  "title": "Thread Title",',
      '  "content": "1/N Tweet text\\n\\n---\\n\\n2/N Tweet text...",',
      '  "sourceReferences": ["Source references"]',
    ].join("\n"),
  },

  EXECUTIVE_SUMMARY: {
    format: "EXECUTIVE_SUMMARY",
    version: "tpl_exec_v2.2",
    name: "Executive Briefing Summary",
    description: "Situation, Findings, Business Impact, Strategic Risks, Actions",
    systemRules: [
      "FORMAT RULES FOR EXECUTIVE SUMMARY:",
      "Structure must adhere to the 5 standard executive sections:",
      "1. Situation: Current operational environment and context.",
      "2. Key Findings: Grounded takeaways directly from the source.",
      "3. Operational & Business Impact: Downstream consequences to revenue, uptime, or trust.",
      "4. Strategic Risks: Compliance, liability, and organizational exposure.",
      "5. Recommended Actions: Prioritized, numbered strategic next steps.",
      "- Tone: Highly objective, risk-aware, concise executive prose.",
    ].join("\n"),
    jsonSchemaRequirements: [
      '  "title": "Executive Summary Title",',
      '  "content": "Markdown formatted executive summary with headers",',
      '  "sourceReferences": ["Source citations"]',
    ].join("\n"),
  },

  CYBERSECURITY_ADVISORY: {
    format: "CYBERSECURITY_ADVISORY",
    version: "tpl_advisory_v2.2",
    name: "Cybersecurity Vulnerability Bulletin",
    description: "Technical threat mechanics, CVEs, IoCs, risk score, mitigation",
    systemRules: [
      "FORMAT RULES FOR CYBERSECURITY ADVISORY:",
      "Structure must include:",
      "1. Title & Classification (e.g. CRITICAL / HIGH).",
      "2. Executive Overview.",
      "3. Technical Threat Mechanics (Affected components, CVE IDs, exploit conditions).",
      "4. Severity & CVSS/Impact Assessment.",
      "5. Indicators of Compromise (IoCs) or Detection Telemetry.",
      "6. Remediation & Patching Procedure (Command line commands or configuration changes).",
      "7. Zero-Trust Mitigation Workarounds.",
    ].join("\n"),
    jsonSchemaRequirements: [
      '  "title": "Security Advisory Title",',
      '  "content": "Markdown formatted technical bulletin",',
      '  "sourceReferences": ["CVE references or vendor disclosures"]',
    ].join("\n"),
  },

  PRESENTATION: {
    format: "PRESENTATION",
    version: "tpl_slides_v2.2",
    name: "Presentation Deck Outline",
    description: "4-8 slides with title, 3-5 bullets, and detailed speaker notes",
    systemRules: [
      "FORMAT RULES FOR PRESENTATION OUTLINE:",
      "- Generate a structured deck of 4 to 8 slides.",
      "- Each slide must contain:",
      "  * Slide Number & Title",
      "  * 3 to 5 concise Key Points (bullet points)",
      "  * Detailed Speaker Notes providing narrative script for presenter.",
      "- Slide 1: Executive Title & Agenda.",
      "- Body Slides: Problem statement, architectural findings, and impact.",
      "- Final Slide: Strategic Recommendations and Call to Action.",
    ].join("\n"),
    jsonSchemaRequirements: [
      '  "title": "Presentation Deck Title",',
      '  "content": "Overall deck narrative summary",',
      '  "slides": [',
      '    { "slideNumber": 1, "title": "Slide Title", "keyPoints": ["Bullet 1", "Bullet 2"], "speakerNotes": "Narrative explanation" }',
      '  ],',
      '  "sourceReferences": ["Source citations"]',
    ].join("\n"),
  },

  INFOGRAPHIC_SPEC: {
    format: "INFOGRAPHIC_SPEC" as any,
    version: "tpl_infographic_v2.2",
    name: "Infographic Visual Layout Spec",
    description: "Visual hierarchy, statistical callouts, section flow, diagram recommendations",
    systemRules: [
      "FORMAT RULES FOR INFOGRAPHIC SPEC:",
      "- Outline a visual flow for designers or generative visual engines.",
      "- Define Header / Hook banner with primary stat callout.",
      "- 3-4 distinct panels with visual icon suggestions, color tokens, and data charts.",
      "- Footer banner with authoritative citations and organization seal.",
    ].join("\n"),
    jsonSchemaRequirements: [
      '  "title": "Infographic Title",',
      '  "content": "Structured visual layout specification in Markdown",',
      '  "sourceReferences": ["Data sources"]',
    ].join("\n"),
  },

  VIDEO_PACKAGE: {
    format: "VIDEO_PACKAGE" as any,
    version: "tpl_video_v2.2",
    name: "Short-Form Video Production Package",
    description: "0-5s Hook, voiceover script, visual shot list, B-roll suggestions, CTA",
    systemRules: [
      "FORMAT RULES FOR VIDEO PACKAGE:",
      "- 60-90 second technical breakdown video script.",
      "- Hook (0-5s): Punchy statement with on-screen text directive.",
      "- Section 1 (Problem): Visuals and voiceover explaining the threat or development.",
      "- Section 2 (Solution): Step-by-step remediation or takeaway.",
      "- Outro (CTA): Direct closing call to action with channel branding.",
    ].join("\n"),
    jsonSchemaRequirements: [
      '  "title": "Video Package Title",',
      '  "content": "Full video script with timestamps, audio cues, and visual cues",',
      '  "sourceReferences": ["Source citations"]',
    ].join("\n"),
  },
};
