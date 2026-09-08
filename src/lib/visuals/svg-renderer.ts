// ==============================================================================
// NEXUS AI - Modular SVG Visual Renderer (Phase 4)
// ==============================================================================
// Free, programmatic SVG visual generator.
// Eliminates external image model costs and guarantees crisp typography,
// scalable vector graphics, and 100% deterministic, grounded output.
// ==============================================================================

import { VisualBrief, VisualType } from "@/types";
import { renderSocialCard } from "./templates/social-card.template";
import { renderAdvisoryAlert } from "./templates/advisory-alert.template";
import { renderInfographic } from "./templates/infographic.template";
import { renderQuoteCard } from "./templates/quote-card.template";
import { renderExecutiveBrief } from "./templates/executive-brief.template";

export interface RenderResult {
  svg: string;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: string;
  visualType: VisualType;
  byteLength: number;
  dataUri: string;
}

export class SvgRenderer {
  /**
   * Selects the template according to visualType and returns validated SVG string & metadata
   */
  public static render(brief: VisualBrief): RenderResult {
    if (!brief) {
      throw new Error("Cannot render SVG: VisualBrief is undefined or null.");
    }

    let svgOutput = "";

    switch (brief.visualType) {
      case "ADVISORY_ALERT":
        svgOutput = renderAdvisoryAlert(brief);
        break;
      case "INFOGRAPHIC":
        svgOutput = renderInfographic(brief);
        break;
      case "QUOTE_CARD":
        svgOutput = renderQuoteCard(brief);
        break;
      case "EXECUTIVE_BRIEF":
        svgOutput = renderExecutiveBrief(brief);
        break;
      case "SOCIAL_CARD":
      default:
        svgOutput = renderSocialCard(brief);
        break;
    }

    // SVG Validity assertion
    this.validateSvg(svgOutput);

    const byteLength = Buffer.byteLength(svgOutput, "utf8");
    const base64Data = Buffer.from(svgOutput, "utf8").toString("base64");
    const dataUri = `data:image/svg+xml;base64,${base64Data}`;

    return {
      svg: svgOutput,
      mimeType: "image/svg+xml",
      width: brief.width,
      height: brief.height,
      aspectRatio: brief.aspectRatio,
      visualType: brief.visualType,
      byteLength,
      dataUri
    };
  }

  /**
   * Fast XML and SVG conformance validation
   */
  public static validateSvg(svgString: string): boolean {
    if (!svgString || typeof svgString !== "string") {
      throw new Error("Invalid SVG: Output is empty or not a string.");
    }

    if (!svgString.includes("<svg") || !svgString.includes("</svg>")) {
      throw new Error("Invalid SVG: Missing root <svg> or closing </svg> tag.");
    }

    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      throw new Error("Invalid SVG: Missing required XML namespace xmlns attribute.");
    }

    if (!svgString.includes("viewBox=")) {
      throw new Error("Invalid SVG: Missing viewBox attribute for responsive scaling.");
    }

    return true;
  }
}
