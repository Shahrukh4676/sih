// ==============================================================================
// NEXUS AI - AI Engine & Provider Abstraction Types (Phase 3)
// ==============================================================================

export type TargetAudience =
  | 'GENERAL'
  | 'TECHNICAL'
  | 'EXECUTIVES'
  | 'CUSTOMERS'
  | 'GOVERNMENT'
  | 'STUDENTS'
  | 'CYBERSECURITY_PROFESSIONALS';

export type ContentTone =
  | 'PROFESSIONAL'
  | 'TECHNICAL'
  | 'CONVERSATIONAL'
  | 'EDUCATIONAL'
  | 'PERSUASIVE'
  | 'URGENT'
  | 'NEUTRAL';

export type DetailLevel = 'SHORT' | 'MEDIUM' | 'DETAILED';

export type CommunicationObjective =
  | 'INFORM'
  | 'EDUCATE'
  | 'WARN'
  | 'PROMOTE'
  | 'ENGAGE'
  | 'SUMMARIZE';

export type SupportedOutputFormat =
  | 'LINKEDIN_POST'
  | 'X_THREAD'
  | 'EXECUTIVE_SUMMARY'
  | 'CYBERSECURITY_ADVISORY'
  | 'PRESENTATION';

export interface SourceEvidence {
  claim: string;
  supportingText: string;
  sourceLocation?: string;
  validationStatus?: string;
}

/**
 * Structured Source Intelligence Schema:
 * Every raw input (document, TXT, PDF, DOCX) is analyzed ONCE into this schema.
 * Transformations consume this structured intelligence rather than re-evaluating raw text.
 */
export interface StructuredSourceIntelligence {
  title: string;
  source_type: string;
  summary: string;
  main_topic: string;
  subtopics: string[];
  key_points: string[];
  entities: string[];
  statistics: string[];
  claims: string[];
  risks: string[];
  recommendations: string[];
  target_audiences: string[];
  communication_objectives: string[];
  keywords: string[];
  source_evidence: SourceEvidence[];
  analyzedAt?: string;
  providerUsed?: string;
}

export interface PresentationSlide {
  slideNumber: number;
  title: string;
  keyPoints: string[];
  speakerNotes: string;
}

export interface TransformationOptions {
  outputType: SupportedOutputFormat;
  targetAudience: TargetAudience;
  tone: ContentTone;
  language: string;
  detailLevel: DetailLevel;
  communicationObjective: CommunicationObjective;
  brandPreferences?: {
    tone?: string;
    bannedPhrases?: string[];
    mandatoryDisclaimers?: string[];
  };
}

export interface TransformationResult {
  title: string;
  content: string;
  outputType: SupportedOutputFormat;
  slides?: PresentationSlide[];
  sourceReferences: string[];
  metadata: {
    wordCount: number;
    characterCount: number;
    estimatedReadTimeMinutes: number;
    tags: string[];
  };
  providerUsed: string;
  modelUsed: string;
}

export interface ProviderHealth {
  provider: string;
  available: boolean;
  model: string;
  error?: string;
}

export interface AIProvider {
  name: string;
  analyzeSource(text: string, metadata?: Record<string, unknown>): Promise<StructuredSourceIntelligence>;
  transformContent(
    sourceAnalysis: StructuredSourceIntelligence,
    options: TransformationOptions
  ): Promise<TransformationResult>;
  healthCheck(): Promise<ProviderHealth>;
}
