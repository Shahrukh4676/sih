// ==============================================================================
// NEXUS AI - Context Engine (Prompt Intelligence Layer)
// ==============================================================================
// Merges source text/PDF/URL with brand rules, org preferences, and user context
// into an authoritative, structured context package.
// ==============================================================================

import { StructuredSourceIntelligence, TransformationOptions } from "../types";

export interface OrganizationContext {
  organizationId: string;
  name?: string;
  industry?: string;
  brandVoice?: {
    tone?: string;
    bannedPhrases?: string[];
    mandatoryDisclaimers?: string[];
    preferredTerms?: Record<string, string>;
  };
}

export interface UserContext {
  userId: string;
  role?: string;
  department?: string;
}

export interface TransformationContextPackage {
  sourceIntelligence: StructuredSourceIntelligence;
  organization: OrganizationContext;
  user: UserContext;
  resolvedOptions: TransformationOptions;
  assembledAt: string;
}

export class ContextEngine {
  /**
   * Builds a unified, verified context package for downstream transformation.
   */
  public static buildContextPackage(
    sourceIntelligence: StructuredSourceIntelligence,
    options: TransformationOptions,
    org?: Partial<OrganizationContext>,
    user?: Partial<UserContext>
  ): TransformationContextPackage {
    const resolvedOrg: OrganizationContext = {
      organizationId: org?.organizationId || "org_default",
      name: org?.name || "Enterprise Operations",
      industry: org?.industry || "Technology & Cybersecurity",
      brandVoice: {
        tone: org?.brandVoice?.tone || options.brandPreferences?.tone,
        bannedPhrases: [
          ...(org?.brandVoice?.bannedPhrases || []),
          ...(options.brandPreferences?.bannedPhrases || []),
        ],
        mandatoryDisclaimers: [
          ...(org?.brandVoice?.mandatoryDisclaimers || []),
          ...(options.brandPreferences?.mandatoryDisclaimers || []),
        ],
        preferredTerms: org?.brandVoice?.preferredTerms || {},
      },
    };

    const resolvedUser: UserContext = {
      userId: user?.userId || "user_anonymous",
      role: user?.role || "analyst",
      department: user?.department || "Security & Communications",
    };

    // Merge brand directives into options
    const mergedOptions: TransformationOptions = {
      ...options,
      brandPreferences: {
        tone: resolvedOrg.brandVoice?.tone || options.tone,
        bannedPhrases: resolvedOrg.brandVoice?.bannedPhrases,
        mandatoryDisclaimers: resolvedOrg.brandVoice?.mandatoryDisclaimers,
      },
    };

    return {
      sourceIntelligence,
      organization: resolvedOrg,
      user: resolvedUser,
      resolvedOptions: mergedOptions,
      assembledAt: new Date().toISOString(),
    };
  }
}
