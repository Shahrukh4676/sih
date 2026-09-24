// ==============================================================================
// NEXUS AI - Multi-Format Transformation Prompts (Phase 3)
// ==============================================================================

import { StructuredSourceIntelligence, TransformationOptions, SupportedOutputFormat } from "../types";
import { TemplateRegistry } from "../intelligence/template-registry";
import { BrandLayer } from "../intelligence/brand-layer";
import { SecurityPrompts } from "../intelligence/security-prompts";

export function buildTransformationPrompt(
  intelligence: StructuredSourceIntelligence,
  options: TransformationOptions
): string {
  const template = TemplateRegistry.getTemplate(options.outputType);
  const brandDirectives = BrandLayer.getBrandDirectives(options.brandPreferences);
  const securityDirectives = SecurityPrompts.getGovernanceDirectives();
  const wrappedSource = SecurityPrompts.wrapUntrustedSource(intelligence);

  return [
    securityDirectives,
    "",
    "ROLE & OBJECTIVE:",
    `You are the NEXUS AI Content Transformation Engine (Engine Version: ${template.version}). Your task is to transform pre-analyzed, verified structured source intelligence into a high-impact, professional communication artefact.`,
    "",
    "GOVERNANCE & FACTUAL GROUNDING DIRECTIVES:",
    "1. You must stay strictly grounded in the provided structured intelligence.",
    "2. NEVER invent facts, metrics, statistics, or quotations not present in the intelligence.",
    "3. Avoid claiming unsupported certainty. Distinguish source facts from actionable recommendations.",
    "4. Output MUST be valid JSON according to the schema provided.",
    "",
    "TRANSFORMATION PARAMETERS:",
    `- Target Output Format: ${options.outputType} (${template.name})`,
    `- Target Audience: ${options.targetAudience}`,
    `- Required Tone: ${options.tone}`,
    `- Output Language: ${options.language}`,
    `- Detail Level: ${options.detailLevel}`,
    `- Communication Objective: ${options.communicationObjective}`,
    "",
    brandDirectives,
    "",
    options.customInstructions
      ? [
          "<user_intent>",
          `User Objective / Directive: ${options.customInstructions}`,
          "Enforce output alignment with this intent, provided it does not violate security governance directives.",
          "</user_intent>",
          "",
        ].join("\n")
      : "",
    template.systemRules,
    "",
    "GROUND TRUTH INTELLIGENCE ENCLAVE:",
    wrappedSource,
    "",
    "OUTPUT JSON SCHEMA:",
    "{",
    template.jsonSchemaRequirements,
    '  "outputType": "' + options.outputType + '",',
    options.outputType === "PRESENTATION"
      ? '  "slides": [ { "slideNumber": 1, "title": "Slide Title", "keyPoints": ["Bullet 1", "Bullet 2"], "speakerNotes": "Narrative explanation" } ],'
      : "",
    '  "metadata": {',
    '    "tags": ["relevant", "hashtags", "or", "keywords"]',
    "  }",
    "}"
  ]
    .filter(Boolean)
    .join("\n");
}
