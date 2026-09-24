// ==============================================================================
// NEXUS AI - Core Enterprise Type Definitions & Data Models
// ==============================================================================

export type UserRole = 'ADMIN' | 'CREATOR' | 'REVIEWER' | 'VIEWER' | 'SUPER_ADMIN' | 'ORG_ADMIN' | 'SECURITY_OFFICER' | 'EDITOR';

export interface BaseResource {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: string; // ISO 8601 or Firestore Timestamp
  updatedAt: string; // ISO 8601 or Firestore Timestamp
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  organizationId: string | null;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  mfaEnabled?: boolean;
  activeSessionsCount?: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  organizationId: string;
  name: string;
  createdBy: string;
  status: 'ACTIVE' | 'ARCHIVED';
  slug?: string;
  tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  allowedDomains?: string[];
  enforceMFA?: boolean;
  defaultApprovalPolicy?: 'STRICT_HUMAN_IN_THE_LOOP' | 'AUTOMATED_HIGH_CONFIDENCE' | 'DUAL_APPROVAL';
  brandVoiceGuidelines?: {
    tone: string;
    targetAudience: string;
    bannedPhrases: string[];
    mandatoryDisclaimers: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export type SourceType = 'DOCUMENT' | 'TEXT' | 'URL' | 'IMAGE' | 'VIDEO' | 'NEWS_ARTICLE' | 'THREAT_ADVISORY' | 'RESEARCH_PAPER';

export type SourceProcessingStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'ANALYZING'
  | 'ANALYZED'
  | 'FAILED';

export interface Source extends BaseResource {
  sourceId?: string;
  title: string;
  type: SourceType;
  rawContent?: string;
  fileUrl?: string;
  fileName?: string;
  originalFileName?: string;
  storagePath?: string;
  extractedText?: string;
  metadata?: Record<string, unknown>;
  processingStatus?: SourceProcessingStatus;
  sourceAnalysis?: any;
  fileSizeBytes?: number;
  mimeType?: string;
  originUrl?: string;
  summary?: string;
  extractedKeyPoints?: string[];
  securityMetadata?: {
    scanPassed: boolean;
    piiDetected: boolean;
    quarantined: boolean;
    hashSha256?: string;
  };
}

export type OutputFormat =
  | 'LINKEDIN_POST'
  | 'X_THREAD'
  | 'EXECUTIVE_SUMMARY'
  | 'CYBERSECURITY_ADVISORY'
  | 'PRESENTATION'
  | 'INFOGRAPHIC_SPEC'
  | 'VIDEO_PACKAGE';

export type ContentStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'GENERATED'
  | 'VALIDATION_FAILED'
  | 'SECURITY_REVIEW'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'REJECTED';

export interface VideoPackageScene {
  sceneNumber: number;
  visualPrompt: string;
  narration: string;
  subtitle: string;
  durationSeconds: number;
}

export interface ContentVersion {
  versionNumber: number;
  title: string;
  body: string;
  content?: string;
  generationConfig?: Record<string, unknown>;
  providerUsed?: string;
  createdBy?: string;
  authorId?: string;
  scenes?: VideoPackageScene[];
  slideOutline?: Array<{ slideNumber: number; title: string; bullets: string[]; speakerNotes: string }>;
  metadata?: {
    wordCount?: number;
    characterCount?: number;
    estimatedReadTimeMinutes?: number;
    tags?: string[];
  };
  createdAt: string;
}

export interface SecurityCheckResult {
  passed: boolean;
  piiClean: boolean;
  detectedPiiEntities: string[];
  promptInjectionSafe: boolean;
  hallucinationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  brandSafetyCompliant: boolean;
  secretLeaksFound: boolean;
  sourceTraceabilityScore: number; // 0 to 1
  checkedAt: string;
  notes?: string;
}

export interface Content extends BaseResource {
  contentId?: string;
  title: string;
  sourceId: string;
  outputFormat: OutputFormat;
  outputType?: OutputFormat;
  content?: string;
  status: ContentStatus;
  version?: number;
  sourceReferences?: string[];
  currentVersion: ContentVersion;
  versionHistory: ContentVersion[];
  targetAudience: string;
  tone: string;
  language: string;
  detailLevel: 'CONCISE' | 'BALANCED' | 'COMPREHENSIVE';
  communicationObjective: string;
  securityCheck: SecurityCheckResult;
  assignedReviewerId?: string;
  approvalId?: string;
  scheduledPublishAt?: string;
  publishedAt?: string;
}

export interface Approval extends BaseResource {
  contentId: string;
  versionNumber: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUESTED_CHANGES';
  reviewerId?: string;
  reviewerName?: string;
  securitySnapshot: SecurityCheckResult;
  comments?: string;
  rejectionReason?: string;
  resolvedAt?: string;
}

export type SocialPlatform = 'LINKEDIN' | 'X_TWITTER' | 'WHATSAPP' | 'SLACK' | 'WEBHOOK_N8N';

export interface SocialConnection extends BaseResource {
  platform: SocialPlatform;
  accountName: string;
  accountId: string;
  avatarUrl?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'RATE_LIMITED';
  tokenExpiresAt?: string;
  scopes: string[];
  lastPublishedAt?: string;
}

export interface PublishingJob extends BaseResource {
  contentId: string;
  platform: SocialPlatform;
  connectionId: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  scheduledFor?: string;
  executedAt?: string;
  publishedUrl?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface AutomationTrigger {
  type: 'SCHEDULE' | 'NEW_SOURCE_UPLOADED' | 'NEWS_TOPIC_ALERT' | 'DIGEST' | 'WEBHOOK' | 'WHATSAPP_MESSAGE';
  config: Record<string, unknown>;
}

export interface AutomationCondition {
  field: string;
  operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'MATCHES_REGEX';
  value: string;
}

export interface AutomationAction {
  actionType: 'GENERATE_TRANSFORMATION' | 'RUN_SECURITY_VALIDATION' | 'SUBMIT_FOR_APPROVAL' | 'NOTIFY_WHATSAPP' | 'TRIGGER_N8N';
  params: Record<string, unknown>;
}

export interface AutomationStats {
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  awaitingApprovalRuns: number;
  avgTrustScore: number;
  avgDurationMs: number;
  last30dSuccessRate: number;
}

export interface AutomationDependency {
  upstreamAutomationId: string;
  dependencyType: 'output_consumed' | 'triggered_by';
  failurePropagation: 'halt' | 'continue_with_warning';
}

export interface AutomationDefinitionVersion {
  id: string;
  automationId: string;
  version: number;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  aiAction: AutomationAction;
  securityCheckRequired: boolean;
  approvalRequired: boolean;
  deliveryTarget: SocialPlatform[];
  createdAt: string;
  createdBy: string;
  changeSummary: string;
}

export interface EvidenceReference {
  sourceDocumentId: string;
  sourcePage?: number;
  sourceParagraph?: number;
  sourceExcerpt: string;
  outputLocation: string;
}

export interface StepResult {
  stepName: 'understand' | 'transform' | 'protect' | 'review' | 'distribute';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  outputSummary: string;
  evidence?: EvidenceReference[];
  flags?: Array<{ type: string; message: string }>;
}

export interface ContentLineageNode {
  id: string;
  type: 'SOURCE' | 'UNDERSTAND' | 'TRANSFORM' | 'SECURITY' | 'APPROVAL' | 'DISTRIBUTION';
  label: string;
  timestamp: string;
  details: string;
  actor?: string;
  trustScore?: number;
  status: 'passed' | 'warning' | 'pending' | 'completed';
}

export interface AutomationHealthData {
  score: number; // 0 - 100
  trend: 'improving' | 'stable' | 'declining';
  factors: {
    runSuccessRate: number;
    avgTrustScore: number;
    approvalRejectionRate: number;
    recency: number;
    securityInterventions: number;
  };
  recommendations: string[];
}

export interface Automation extends BaseResource {
  name: string;
  description: string;
  enabled: boolean;
  version?: number;
  currentDefinitionId?: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  aiAction: AutomationAction;
  securityCheckRequired: boolean;
  approvalRequired: boolean; // Mandatory human in the loop by default
  deliveryTarget: SocialPlatform[];
  executionCount: number;
  lastExecutedAt?: string;
  nextRunAt?: string;
  healthScore?: number; // 0 - 100
  healthTrend?: 'improving' | 'stable' | 'declining';
  stats?: AutomationStats;
  dependencies?: AutomationDependency[];
  templateOriginId?: string | null;
  isTemplate?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  category: 'CYBERSECURITY' | 'AI_TRENDS' | 'ENTERPRISE_TECH' | 'POLICY_REGULATION' | 'MARKET_INTELLIGENCE';
  relevanceScore: number; // 0-100%
  timestamp: string;
  summary: string;
  whyItMatters: string;
  tags: string[];
  isSaved?: boolean;
}

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY_ALERT';

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  severity: AuditSeverity;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  integrityHash: string;
  prevHash?: string;
  sequenceNumber?: number;
  details: Record<string, unknown>;
}

export interface AuditVerificationResult {
  valid: boolean;
  totalLogsChecked: number;
  genesisHash: string;
  latestHash: string;
  brokenIndex?: number;
  brokenLogId?: string;
  compromiseReason?: string;
  verifiedAt: string;
  algorithm: string;
}


export interface SecurityEvent {
  id: string;
  organizationId: string;
  eventType:
    | 'FAILED_LOGIN'
    | 'SUSPICIOUS_IP'
    | 'PII_LEAK_ATTEMPT'
    | 'PROMPT_INJECTION_DETECTED'
    | 'TOKEN_REVOKED'
    | 'APPROVAL_BYPASS_ATTEMPT'
    | 'HONEYTOKEN_EXPOSURE'
    | 'SECURITY_POLICY_BLOCKED'
    | 'OUTPUT_SECURITY_LEAK_BLOCKED'
    | 'SUSPICIOUS_SOURCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  actorId?: string;
  sourceType?: string;
  decision?: string;
  runId?: string;
  automationId?: string;
  detectionVersion?: string;
  policyVersion?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  createdAt?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
}

// ==============================================================================
// Phase 4: Visual Intelligence & Asset Engine Types
// ==============================================================================

export type VisualType =
  | 'SOCIAL_CARD'
  | 'INFOGRAPHIC'
  | 'QUOTE_CARD'
  | 'EXECUTIVE_BRIEF'
  | 'ADVISORY_ALERT';

export type VisualAspectRatio = '1.91:1' | '1:1' | '4:5' | '9:16' | '16:9';

export type VisualAssetStatus =
  | 'GENERATING'
  | 'GENERATED'
  | 'FAILED'
  | 'ARCHIVED';

export type VisualGenerationMethod =
  | 'SVG_TEMPLATE'
  | 'LOCAL_RENDERER'
  | 'AI_IMAGE_MODEL';

export interface GroundedStatistic {
  value: string;
  label: string;
  sourceContext?: string;
}

export interface BrandProfile {
  organizationName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  footerText?: string;
}

export interface VisualBrief {
  visualType: VisualType;
  title: string;
  headline: string;
  subheadline: string;
  keyFacts: string[];
  statistics: GroundedStatistic[];
  visualHierarchy: string[];
  layout: 'MODERN_GRID' | 'HERO_METRIC' | 'SPLIT_CALLOUT' | 'TIMELINE_STACK' | 'ALERT_BANNER';
  iconSuggestions: string[];
  illustrationDescription: string;
  backgroundStyle: 'DARK_CYBER' | 'SLATE_MINIMAL' | 'VIBRANT_GRADIENT' | 'EXECUTIVE_NAVY';
  aspectRatio: VisualAspectRatio;
  width: number;
  height: number;
  accessibilityText: string;
  brand?: BrandProfile;
}

export interface VisualAsset extends BaseResource {
  assetId: string;
  contentId: string;
  sourceId: string;
  version: number;
  assetType: VisualType;
  fileName: string;
  storagePath: string;
  publicUrl?: string;
  svgContent?: string;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: VisualAspectRatio;
  visualBrief: VisualBrief;
  altText: string;
  generationMethod: VisualGenerationMethod;
  status: VisualAssetStatus;
  errorMessage?: string;
}

// ==============================================================================
// Phase 5: Security Intelligence & Content Safety Engine Types
// ==============================================================================

export type SecurityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityDecisionAction = 'ALLOW' | 'REVIEW' | 'BLOCK';

export type SecurityFindingType =
  | 'PROMPT_INJECTION'
  | 'PII'
  | 'SECRET'
  | 'HONEYTOKEN'
  | 'DELIMITER_TAMPERING'
  | 'UNSAFE_INSTRUCTION'
  | 'UNSUPPORTED_CLAIM';

export interface SecurityFinding {
  id: string;
  type: SecurityFindingType;
  severity: SecurityRiskLevel;
  description: string;
  evidence: string; // Strictly masked/redacted before storage
  location?: string;
  recommendedAction: string;
}

export interface SecurityCheckItem {
  name: string;
  status: 'passed' | 'warning' | 'blocked';
  severity: SecurityRiskLevel;
  explanation: string;
}

export interface SecurityReportDetails {
  whatHappened: string;
  sourceType?: string;
  why: string;
  whatNexusDid: string;
  result: string;
}

export interface SecurityDecision {
  decision: SecurityDecisionAction;
  riskLevel: SecurityRiskLevel;
  reasons: string[];
  requiresHumanReview: boolean;
  findings: SecurityFinding[];
  summary: string;
  checkedAt: string;
  confidence?: number;
  detectionVersion?: string;
  policyVersion?: string;
  honeytokenTriggered?: boolean;
  sourceType?: string;
  isSimulation?: boolean;
  checks?: SecurityCheckItem[];
  report?: SecurityReportDetails;
  classifierResult?: {
    detected: boolean;
    category: string;
    severity: string;
    confidence: number;
    recommendedAction: string;
  };
}

export interface SecurityScan extends BaseResource {
  securityScanId: string;
  sourceId?: string;
  contentId?: string;
  scanType: 'SOURCE_SCAN' | 'CONTENT_SCAN';
  status: 'COMPLETED' | 'FAILED';
  riskLevel: SecurityRiskLevel;
  decision: SecurityDecisionAction;
  reasons: string[];
  requiresHumanReview: boolean;
  findings: SecurityFinding[];
  redactedSnippet?: string;
  checkedAt: string;
}

// ==============================================================================
// Phase 6: WhatsApp Command Center Types & Data Models
// ==============================================================================

export type WhatsAppConnectionStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

export interface WhatsAppConnection extends BaseResource {
  phoneNumber: string;
  whatsappUserId?: string;
  linkingCode?: string;
  linkingCodeExpiresAt?: string;
  status: WhatsAppConnectionStatus;
  lastSeenAt?: string;
  verifiedAt?: string;
}

export type WhatsAppConversationState =
  | 'IDLE'
  | 'AWAITING_SOURCE'
  | 'AWAITING_CONFIGURATION'
  | 'GENERATING'
  | 'AWAITING_APPROVAL'
  | 'EDITING'
  | 'COMPLETED'
  | 'CANCELLED';

export type WhatsAppCommandIntent =
  | 'HELP'
  | 'STATUS'
  | 'TRANSFORM'
  | 'GENERATE'
  | 'SUMMARIZE'
  | 'CREATE_ADVISORY'
  | 'CREATE_LINKEDIN'
  | 'CREATE_X_THREAD'
  | 'CREATE_PRESENTATION'
  | 'GENERATE_VISUAL'
  | 'REGENERATE'
  | 'EDIT'
  | 'APPROVE'
  | 'CANCEL'
  | 'RECENT_CONTENT'
  | 'UNKNOWN';

export interface WhatsAppConversation {
  id: string;
  organizationId: string;
  userId: string;
  phoneNumber: string;
  state: WhatsAppConversationState;
  currentSourceId?: string;
  currentContentId?: string;
  currentVersionNumber?: number;
  selectedOutputs?: OutputFormat[];
  configuration?: {
    tone?: string;
    targetAudience?: string;
    length?: 'SHORT' | 'MEDIUM' | 'DETAILED';
    includeVisuals?: boolean;
    customInstructions?: string;
  };
  pendingAction?: string;
  lastMessageId?: string;
  lastUserMessage?: string;
  lastBotReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessageLog {
  id: string;
  conversationId: string;
  organizationId: string;
  userId: string;
  phoneNumber: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'text' | 'button' | 'interactive' | 'image' | 'document';
  content: string;
  wamid?: string;
  intent?: WhatsAppCommandIntent;
  securityDecision?: SecurityDecisionAction;
  timestamp: string;
}

// ==============================================================================
// Phase 7: n8n Workflow Automation & Event Orchestration Types
// ==============================================================================

export type AutomationEventStatus =
  | 'QUEUED'
  | 'TRIGGERED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'DUPLICATE'
  | 'CANCELLED';

export interface AutomationEvent extends BaseResource {
  eventId: string;
  eventType: 'CONTENT_APPROVED';
  resourceType: 'CONTENT';
  resourceId: string; // contentId or ruleId
  versionId: string | number; // e.g. "v1" or 1
  channel: string; // e.g. "linkedin", "twitter", "internal", etc.
  status: AutomationEventStatus;
  workflowName?: string;
  webhookUrl?: string;
  executionId?: string;
  retryCount?: number;
  runType?: 'live' | 'simulation';
  durationMs?: number;
  sourceSnapshot?: Record<string, unknown>;
  stepResults?: StepResult[];
  evidence?: EvidenceReference[];
  idempotencyKey?: string;
  correlationId?: string;
  failureReason?: { code: string; message: string; userAction?: string; retryable: boolean } | null;
  retryHistory?: Array<{ attempt: number; timestamp: string; triggeredBy: string; error?: string }>;
  trustScore?: { score: number; breakdown?: { security: number; grounding: number; compliance: number; governance: number } } | null;
  generatedContent?: string;
  result?: {
    state?: string; // e.g. "READY_FOR_DISTRIBUTION"
    channel?: string;
    [key: string]: unknown;
  };
  error?: string;
  completedAt?: string;
}

// ==============================================================================
// Phase 8: LinkedIn OAuth & Real Member Publishing Data Models
// ==============================================================================

export type LinkedInConnectionStatus =
  | 'CONNECTED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'ERROR'
  | 'NOT_CONNECTED';

export interface LinkedInConnection extends BaseResource {
  linkedinMemberId: string;
  linkedinMemberUrn: string; // urn:li:person:...
  memberName?: string;
  memberEmail?: string;
  memberAvatar?: string;
  scopes: string[];
  accessTokenEncrypted: string;
  expiresAt: string; // ISO string
  status: LinkedInConnectionStatus;
  connectedAt: string;
  lastPublishedAt?: string;
}

export type PublishingStatus =
  | 'NOT_CONNECTED'
  | 'READY'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'TOKEN_EXPIRED'
  | 'BLOCKED';

export interface PublishingRecord extends BaseResource {
  contentId: string;
  versionId: string | number;
  channel: 'linkedin' | 'x' | 'instagram' | 'whatsapp';
  status: PublishingStatus;
  externalPostId?: string;
  publishedUrl?: string;
  error?: string;
  errorCode?: string;
  publishedAt?: string;
  simulated?: boolean;
}

export interface LinkedInOAuthState {
  state: string;
  userId: string;
  organizationId: string;
  returnUrl?: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export type XConnectionStatus =
  | 'CONNECTED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'ERROR'
  | 'NOT_CONNECTED';

export interface XConnection extends BaseResource {
  xUserId: string;
  xUsername: string;
  xName: string;
  xAvatarUrl?: string;
  scopes: string[];
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  expiresAt: string;
  status: XConnectionStatus;
  connectedAt: string;
  lastPublishedAt?: string;
}

export interface XOAuthState {
  state: string;
  userId: string;
  organizationId: string;
  returnUrl?: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export type InstagramConnectionStatus =
  | 'CONNECTED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'ERROR'
  | 'NOT_CONNECTED';

export interface InstagramConnection extends BaseResource {
  instagramUserId: string;
  instagramUsername: string;
  accountType?: string;
  profilePictureUrl?: string;
  accessTokenEncrypted: string;
  expiresAt: string;
  status: InstagramConnectionStatus;
  connectedAt: string;
  lastPublishedAt?: string;
}

export interface InstagramOAuthState {
  state: string;
  userId: string;
  organizationId: string;
  returnUrl?: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

