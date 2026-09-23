// ==============================================================================
// NEXUS AI - Intent Engine (Prompt Intelligence Layer)
// ==============================================================================
// Automatically infers communication objective, target audience, format,
// urgency, and thematic focus from raw content or user instructions.
// ==============================================================================

import {
  CommunicationObjective,
  ContentTone,
  DetailLevel,
  SupportedOutputFormat,
  TargetAudience,
} from "../types";

export interface InferredIntent {
  recommendedFormat: SupportedOutputFormat;
  targetAudience: TargetAudience;
  tone: ContentTone;
  communicationObjective: CommunicationObjective;
  detailLevel: DetailLevel;
  urgency: "NORMAL" | "HIGH" | "CRITICAL";
  keyThemes: string[];
  confidence: number;
  reasoning: string;
}

export class IntentEngine {
  /**
   * Analyzes raw text or instructions to infer transformation parameters.
   */
  public static inferIntent(text: string, userHint?: string): InferredIntent {
    const combined = `${text} ${userHint || ""}`.toLowerCase();

    // 1. Urgency & CVE detection
    const isCriticalCve = /cve-\d{4}-\d+|zero-day|0-day|critical vulnerability|active exploit/i.test(combined);
    const isHighRisk = /patch immediately|breach|compromise|ransomware|security incident/i.test(combined);
    const urgency: "NORMAL" | "HIGH" | "CRITICAL" = isCriticalCve
      ? "CRITICAL"
      : isHighRisk
      ? "HIGH"
      : "NORMAL";

    // 2. Format inference
    let recommendedFormat: SupportedOutputFormat = "LINKEDIN_POST";
    let formatConfidence = 0.82;

    if (/slide|deck|presentation|pitch|keynote/i.test(combined)) {
      recommendedFormat = "PRESENTATION";
      formatConfidence = 0.94;
    } else if (isCriticalCve || /advisory|cve|remediation|vulnerability|bulletin/i.test(combined)) {
      recommendedFormat = "CYBERSECURITY_ADVISORY";
      formatConfidence = 0.96;
    } else if (/tweet|thread|x\.com|twitter|280/i.test(combined)) {
      recommendedFormat = "X_THREAD";
      formatConfidence = 0.92;
    } else if (/exec|c-suite|board|summary|briefing|quarterly|roi|strategic/i.test(combined)) {
      recommendedFormat = "EXECUTIVE_SUMMARY";
      formatConfidence = 0.9;
    }

    // 3. Audience inference
    let targetAudience: TargetAudience = "TECHNICAL";
    if (/board|c-suite|ceo|cfo|executive|leadership|director/i.test(combined)) {
      targetAudience = "EXECUTIVES";
    } else if (/ciso|soc|incident response|secops|devsecops|red team/i.test(combined)) {
      targetAudience = "CYBERSECURITY_PROFESSIONALS";
    } else if (/customer|user|client|public|subscriber/i.test(combined)) {
      targetAudience = "CUSTOMERS";
    } else if (/student|academic|researcher|university/i.test(combined)) {
      targetAudience = "STUDENTS";
    } else if (/compliance|fedramp|nist|regulator|government|gdpr/i.test(combined)) {
      targetAudience = "GOVERNMENT";
    }

    // 4. Tone inference
    let tone: ContentTone = "PROFESSIONAL";
    if (urgency === "CRITICAL" || urgency === "HIGH") {
      tone = "URGENT";
    } else if (targetAudience === "CYBERSECURITY_PROFESSIONALS" || /kernel|bpf|cve|syscall/i.test(combined)) {
      tone = "TECHNICAL";
    } else if (/tutorial|guide|learn|how-to/i.test(combined)) {
      tone = "EDUCATIONAL";
    } else if (/pitch|launch|announce|market/i.test(combined)) {
      tone = "PERSUASIVE";
    }

    // 5. Objective inference
    let communicationObjective: CommunicationObjective = "INFORM";
    if (urgency !== "NORMAL") {
      communicationObjective = "WARN";
    } else if (tone === "EDUCATIONAL") {
      communicationObjective = "EDUCATE";
    } else if (tone === "PERSUASIVE") {
      communicationObjective = "PROMOTE";
    } else if (recommendedFormat === "EXECUTIVE_SUMMARY") {
      communicationObjective = "SUMMARIZE";
    }

    // 6. Extract key themes
    const themes: string[] = [];
    if (/security|vulnerability|patch|cve/i.test(combined)) themes.push("Cybersecurity");
    if (/ai|llm|inference|compute|machine learning/i.test(combined)) themes.push("AI & Compute");
    if (/cloud|infrastructure|devops|kubernetes/i.test(combined)) themes.push("Cloud Infrastructure");
    if (/governance|compliance|policy|risk/i.test(combined)) themes.push("Governance & Risk");
    if (/executive|strategy|growth|leadership/i.test(combined)) themes.push("Strategy");
    if (themes.length === 0) themes.push("Enterprise Technology");

    const reasoning = isCriticalCve
      ? "Detected active CVE threat disclosure; prioritized Cybersecurity Advisory format with urgent technical tone."
      : `Classified as ${recommendedFormat} targeting ${targetAudience} with ${tone} tone based on lexical signals.`;

    return {
      recommendedFormat,
      targetAudience,
      tone,
      communicationObjective,
      detailLevel: isCriticalCve ? "DETAILED" : "MEDIUM",
      urgency,
      keyThemes: themes,
      confidence: formatConfidence,
      reasoning,
    };
  }
}
