// ==============================================================================
// NEXUS AI - Template Registry (Prompt Intelligence Layer)
// ==============================================================================
// Centralized versioned registry of prompt templates for auditability and compliance.
// ==============================================================================

import { SupportedOutputFormat } from "../types";
import { OUTPUT_TEMPLATES, OutputTemplateDefinition } from "./output-templates";

export interface TemplateMetadata {
  id: string;
  version: string;
  format: string;
  name: string;
  description: string;
  updatedAt: string;
}

export class TemplateRegistry {
  /**
   * Retrieves a template definition for a given output format.
   */
  public static getTemplate(format: SupportedOutputFormat | string): OutputTemplateDefinition {
    const template = OUTPUT_TEMPLATES[format] || OUTPUT_TEMPLATES.LINKEDIN_POST;
    return template;
  }

  /**
   * Lists all available prompt templates in the registry.
   */
  public static listTemplates(): TemplateMetadata[] {
    return Object.entries(OUTPUT_TEMPLATES).map(([key, def]) => ({
      id: key,
      version: def.version,
      format: def.format,
      name: def.name,
      description: def.description,
      updatedAt: "2026-09-20T00:00:00.000Z",
    }));
  }

  /**
   * Returns active template version tag for audit ledgers.
   */
  public static getVersionTag(format: SupportedOutputFormat | string): string {
    const tpl = this.getTemplate(format);
    return tpl.version;
  }
}
