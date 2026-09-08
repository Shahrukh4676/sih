// ==============================================================================
// NEXUS AI - Mock Data (Cleared - Production uses Firestore collections)
// ==============================================================================

import {
  Content,
  Approval,
  NewsItem,
  Automation,
  SocialConnection,
  PublishingJob,
  AuditLog,
  SecurityEvent,
  User,
  Organization
} from "@/types";

export const MOCK_ORGANIZATION: Organization | null = null;
export const MOCK_USER: User | null = null;
export const MOCK_CONTENTS: Content[] = [];
export const MOCK_APPROVALS: Approval[] = [];
export const MOCK_NEWS_ITEMS: NewsItem[] = [];
export const MOCK_SOCIAL_CONNECTIONS: SocialConnection[] = [];
export const MOCK_PUBLISHING_JOBS: PublishingJob[] = [];
export const MOCK_AUTOMATIONS: Automation[] = [];
export const MOCK_AUDIT_LOGS: AuditLog[] = [];
export const MOCK_SECURITY_EVENTS: SecurityEvent[] = [];
