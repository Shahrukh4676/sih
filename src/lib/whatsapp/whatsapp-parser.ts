// ==============================================================================
// NEXUS AI - Conversational Deterministic Command Parser (Phase 6)
// ==============================================================================
// Fast, deterministic natural language command parser. Extracts intent, target
// formats, conversational edits, and inline sources without relying solely on LLMs.
// ==============================================================================

import { OutputFormat, WhatsAppCommandIntent } from "@/types";
import { ParsedWhatsAppCommand } from "./whatsapp-types";

export class WhatsAppParser {
  /**
   * Main entry point: parses raw text or button interaction into structured command
   */
  public parse(
    rawText: string,
    buttonReply?: { id: string; title: string }
  ): ParsedWhatsAppCommand {
    const text = (rawText || "").trim();

    // 1. Check for interactive button replies first
    if (buttonReply) {
      return this.parseButtonReply(buttonReply, text);
    }

    const lower = text.toLowerCase();

    // 2. Check for Approval intents
    if (this.isMatch(lower, [/^(approve|approved|looks good|confirm approval|lgtm|accept)$/i])) {
      return {
        intent: "APPROVE",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: text,
      };
    }

    // 3. Check for Cancellation / Reset intents
    if (this.isMatch(lower, [/^(cancel|abort|stop|reset|clear session|nevermind)$/i])) {
      return {
        intent: "CANCEL",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: text,
      };
    }

    // 4. Check for Regeneration intents
    if (this.isMatch(lower, [/^(regenerate|regenerate it|try again|rerun|re-generate|re-run)$/i])) {
      return {
        intent: "REGENERATE",
        confidence: 0.95,
        requestedOutputs: [],
        rawText: text,
      };
    }

    // 5. Check for Help intents
    if (this.isMatch(lower, [/^(help|\?|commands|how to use|what can you do|menu)$/i])) {
      return {
        intent: "HELP",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: text,
      };
    }

    // 6. Check for Status intents
    if (this.isMatch(lower, [/^(status|check status|health|system status|connection status)$/i])) {
      return {
        intent: "STATUS",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: text,
      };
    }

    // 7. Check for Recent Content intents
    if (this.isMatch(lower, [/^(recent content|latest content|recent posts|my content|history)$/i])) {
      return {
        intent: "RECENT_CONTENT",
        confidence: 0.9,
        requestedOutputs: [],
        rawText: text,
      };
    }

    // 8. Check for Visual Generation intents
    if (this.isMatch(lower, [/^(generate visual|create visual|make visual|create banner|create graphic|generate image)/i])) {
      return {
        intent: "GENERATE_VISUAL",
        confidence: 0.9,
        requestedOutputs: ["INFOGRAPHIC_SPEC"],
        rawText: text,
      };
    }

    // 9. Check for Conversational Edit instructions
    // e.g. "make it more professional", "make it shorter", "add the key statistic", "change tone to urgent"
    if (this.isEditInstruction(lower)) {
      return {
        intent: "EDIT",
        confidence: 0.85,
        requestedOutputs: [],
        editInstruction: text,
        rawText: text,
      };
    }

    // 10. Extract requested multi-formats from text
    const extractedOutputs = this.extractOutputFormats(lower);

    // Check for inline source: e.g. "Turn this into a LinkedIn post: [Source Content Here...]"
    const inlineSource = this.extractInlineSource(text);

    // 11. Specific single-format creation triggers
    if (lower.includes("linkedin") && !lower.includes("+") && !lower.includes(" and ")) {
      return {
        intent: "CREATE_LINKEDIN",
        confidence: 0.9,
        requestedOutputs: ["LINKEDIN_POST"],
        sourceText: inlineSource,
        rawText: text,
      };
    }

    if ((lower.includes("x thread") || lower.includes("twitter thread") || lower.includes("tweet")) && !lower.includes("+") && !lower.includes(" and ")) {
      return {
        intent: "CREATE_X_THREAD",
        confidence: 0.9,
        requestedOutputs: ["X_THREAD"],
        sourceText: inlineSource,
        rawText: text,
      };
    }

    if ((lower.includes("executive summary") || lower.includes("summarize")) && !lower.includes("+") && !lower.includes(" and ")) {
      return {
        intent: "SUMMARIZE",
        confidence: 0.9,
        requestedOutputs: ["EXECUTIVE_SUMMARY"],
        sourceText: inlineSource,
        rawText: text,
      };
    }

    if ((lower.includes("advisory") || lower.includes("threat advisory") || lower.includes("security advisory")) && !lower.includes("+") && !lower.includes(" and ")) {
      return {
        intent: "CREATE_ADVISORY",
        confidence: 0.9,
        requestedOutputs: ["CYBERSECURITY_ADVISORY"],
        sourceText: inlineSource,
        rawText: text,
      };
    }

    if (lower.includes("presentation") || lower.includes("slide deck") || lower.includes("slides")) {
      return {
        intent: "CREATE_PRESENTATION",
        confidence: 0.9,
        requestedOutputs: ["PRESENTATION"],
        sourceText: inlineSource,
        rawText: text,
      };
    }

    // 12. General Transformation / Multi-Output triggers
    if (
      lower.startsWith("turn this into") ||
      lower.startsWith("transform") ||
      lower.startsWith("generate") ||
      lower.startsWith("create") ||
      extractedOutputs.length > 0
    ) {
      return {
        intent: extractedOutputs.length > 0 ? "TRANSFORM" : "GENERATE",
        confidence: 0.85,
        requestedOutputs: extractedOutputs.length > 0 ? extractedOutputs : ["LINKEDIN_POST"],
        sourceText: inlineSource,
        rawText: text,
      };
    }

    // 13. Fallback: If it's a long message (>60 chars) without explicit keywords, treat it as Source Content
    return {
      intent: "UNKNOWN",
      confidence: 0.3,
      requestedOutputs: [],
      sourceText: text.length > 40 ? text : undefined,
      rawText: text,
    };
  }

  /**
   * Maps interactive buttons to intents
   */
  private parseButtonReply(
    button: { id: string; title: string },
    rawText: string
  ): ParsedWhatsAppCommand {
    const btnId = button.id.toLowerCase();

    if (btnId === "btn_approve" || btnId.includes("approve")) {
      return {
        intent: "APPROVE",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    if (btnId === "btn_regenerate" || btnId.includes("regenerate")) {
      return {
        intent: "REGENERATE",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    if (btnId === "btn_edit" || btnId.includes("edit")) {
      return {
        intent: "EDIT",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    if (btnId === "btn_cancel" || btnId.includes("cancel")) {
      return {
        intent: "CANCEL",
        confidence: 1.0,
        requestedOutputs: [],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    if (btnId.includes("linkedin")) {
      return {
        intent: "CREATE_LINKEDIN",
        confidence: 1.0,
        requestedOutputs: ["LINKEDIN_POST"],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    if (btnId.includes("x_thread") || btnId.includes("twitter")) {
      return {
        intent: "CREATE_X_THREAD",
        confidence: 1.0,
        requestedOutputs: ["X_THREAD"],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    if (btnId.includes("summary")) {
      return {
        intent: "SUMMARIZE",
        confidence: 1.0,
        requestedOutputs: ["EXECUTIVE_SUMMARY"],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    if (btnId.includes("advisory")) {
      return {
        intent: "CREATE_ADVISORY",
        confidence: 1.0,
        requestedOutputs: ["CYBERSECURITY_ADVISORY"],
        rawText: button.title,
        isButtonAction: true,
        buttonActionId: button.id,
      };
    }

    return {
      intent: "UNKNOWN",
      confidence: 0.5,
      requestedOutputs: [],
      rawText: button.title,
      isButtonAction: true,
      buttonActionId: button.id,
    };
  }

  /**
   * Deterministic extraction of multiple target formats
   * e.g., "Create LinkedIn + X + executive summary"
   */
  public extractOutputFormats(text: string): OutputFormat[] {
    const lower = text.toLowerCase();
    const formats = new Set<OutputFormat>();

    if (lower.includes("linkedin")) {
      formats.add("LINKEDIN_POST");
    }
    if (lower.includes("x thread") || lower.includes("x post") || lower.includes("twitter") || /\bx\b/.test(lower)) {
      formats.add("X_THREAD");
    }
    if (lower.includes("summary") || lower.includes("executive summary") || lower.includes("brief")) {
      formats.add("EXECUTIVE_SUMMARY");
    }
    if (lower.includes("advisory") || lower.includes("threat advisory") || lower.includes("security advisory")) {
      formats.add("CYBERSECURITY_ADVISORY");
    }
    if (lower.includes("presentation") || lower.includes("slide") || lower.includes("deck")) {
      formats.add("PRESENTATION");
    }
    if (lower.includes("visual") || lower.includes("infographic") || lower.includes("banner")) {
      formats.add("INFOGRAPHIC_SPEC");
    }

    return Array.from(formats);
  }

  /**
   * Detects conversational edit patterns
   */
  private isEditInstruction(text: string): boolean {
    const editPrefixes = [
      "make it",
      "change it",
      "make the",
      "add the",
      "add a",
      "use a",
      "tone:",
      "more technical",
      "more professional",
      "shorter",
      "longer",
      "expand",
      "condense",
      "rewrite with",
      "include",
      "remove",
    ];

    return editPrefixes.some((prefix) => text.startsWith(prefix));
  }

  /**
   * Extracts inline content if the user submitted command and source together
   * e.g. "Turn this into a LinkedIn post:\n\nCybersecurity teams are..."
   */
  private extractInlineSource(text: string): string | undefined {
    // Check for colon separator: "Turn this into a LinkedIn post: <source>"
    const colonSplit = text.split(/:\s*\n?/);
    if (colonSplit.length >= 2 && colonSplit[1].trim().length > 30) {
      return colonSplit.slice(1).join(":").trim();
    }

    // Check for double newline separator
    const paragraphSplit = text.split(/\n\s*\n/);
    if (paragraphSplit.length >= 2 && paragraphSplit[1].trim().length > 30) {
      return paragraphSplit.slice(1).join("\n\n").trim();
    }

    return undefined;
  }

  private isMatch(text: string, patterns: RegExp[]): boolean {
    return patterns.some((p) => p.test(text.trim()));
  }
}

export const defaultWhatsAppParser = new WhatsAppParser();
