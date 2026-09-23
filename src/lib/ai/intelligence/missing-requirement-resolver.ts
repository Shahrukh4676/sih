// ==============================================================================
// NEXUS AI - Missing Requirement Resolver (Prompt Intelligence Layer)
// ==============================================================================
// Fills in missing tone, audience, length, or structural directives without
// hallucinating facts or overriding explicit user choices.
// ==============================================================================

import {
  CommunicationObjective,
  ContentTone,
  DetailLevel,
  StructuredSourceIntelligence,
  SupportedOutputFormat,
  TargetAudience,
  TransformationOptions,
} from "../types";
import { IntentEngine } from "./intent-engine";

export class MissingRequirementResolver {
  /**
   * Completes any partial transformation options with intelligent defaults.
   */
  public static resolve(
    intelligence: StructuredSourceIntelligence,
    partialOptions?: Partial<TransformationOptions>
  ): TransformationOptions {
    const rawSummary = `${intelligence.title} ${intelligence.summary} ${intelligence.key_points.join(" ")}`;
    const inferred = IntentEngine.inferIntent(rawSummary);

    const outputType: SupportedOutputFormat =
      partialOptions?.outputType || inferred.recommendedFormat;

    const targetAudience: TargetAudience =
      partialOptions?.targetAudience || inferred.targetAudience;

    const tone: ContentTone =
      partialOptions?.tone || inferred.tone;

    const detailLevel: DetailLevel =
      partialOptions?.detailLevel || inferred.detailLevel;

    const communicationObjective: CommunicationObjective =
      partialOptions?.communicationObjective || inferred.communicationObjective;

    const language: string = partialOptions?.language || "ENGLISH";

    return {
      outputType,
      targetAudience,
      tone,
      language,
      detailLevel,
      communicationObjective,
      brandPreferences: partialOptions?.brandPreferences,
    };
  }
}
