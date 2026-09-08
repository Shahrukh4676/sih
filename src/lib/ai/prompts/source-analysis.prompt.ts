// ==============================================================================
// NEXUS AI - Structured Source Analysis Prompt (Phase 3)
// ==============================================================================

import { wrapUntrustedSourceData } from "../prompt-safety";

export function buildSourceAnalysisPrompt(rawSourceText: string, metadata?: Record<string, unknown>): string {
  const wrappedSource = wrapUntrustedSourceData(rawSourceText);

  return [
    "You are the NEXUS AI Core Intelligence Analyst. Your task is to extract comprehensive, grounded, structured intelligence from the provided document data.",
    "",
    "GROUNDING & INTEGRITY DIRECTIVES:",
    "1. You must ONLY extract facts, statistics, claims, entities, and recommendations that are explicitly stated or directly supported by the source document.",
    "2. NEVER fabricate page numbers, citations, external references, statistics, percentages, or quotes.",
    "3. If a particular field has no supporting information in the source, provide an empty array [] or a factual statement indicating that the source does not mention it.",
    "4. Distinguish clearly between factual source claims and potential risks.",
    "5. Output must be strictly valid JSON matching the schema below.",
    "",
    "EXPECTED JSON SCHEMA:",
    "{",
    '  "title": "Clear, informative title for the source document",',
    '  "source_type": "REPORT | ADVISORY | RESEARCH_PAPER | ARTICLE | TEXT | NOTES",',
    '  "summary": "Concise 2-4 sentence executive overview of the core subject",',
    '  "main_topic": "Primary domain or subject area",',
    '  "subtopics": ["Array of specific subtopics covered"],',
    '  "key_points": ["Key factual takeaways extracted directly from source"],',
    '  "entities": ["Organizations, technologies, standards, CVEs, or individuals explicitly named"],',
    '  "statistics": ["Any exact numbers, metrics, or measurements found in the text"],',
    '  "claims": ["Factual assertions made by the source"],',
    '  "risks": ["Vulnerabilities, business hazards, threats, or challenges outlined"],',
    '  "recommendations": ["Actionable remediation or steps suggested in the source"],',
    '  "target_audiences": ["Who needs to know this information"],',
    '  "communication_objectives": ["INFORM | WARN | EDUCATE | SUMMARIZE"],',
    '  "keywords": ["Top relevant tags and keywords"],',
    '  "source_evidence": [',
    "    {",
    '      "claim": "The specific claim or finding",',
    '      "supportingText": "Exact quote or excerpt directly from the source",',
    '      "sourceLocation": "Section, heading, or paragraph if identifiable, else empty string",',
    '      "validationStatus": "VERIFIED_IN_SOURCE"',
    "    }",
    "  ]",
    "}",
    "",
    wrappedSource
  ].join("\n");
}
