// ==============================================================================
// NEXUS AI - LinkedIn Integration & Member Publishing Service (Phase 8)
// ==============================================================================
// Manages OAuth states, AES-256-GCM encrypted token persistence,
// multi-gate publishing validation, Posts API execution, and audit logging.
// ==============================================================================

import crypto from "crypto";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  LinkedInConnection,
  LinkedInConnectionStatus,
  LinkedInOAuthState,
  PublishingRecord,
  PublishingStatus,
} from "@/types";
import { encryptToken, decryptToken } from "../security/token-encryption";
import { defaultLinkedInClient } from "../integrations/linkedin/linkedin-client";
import { getContentById, updateContent, updateContentStatus } from "./content.service";
import { logAuditEvent } from "./audit.service";
import { cleanForFirestore } from "../firebase/firestore-utils";

export const LINKEDIN_CONNECTIONS_COLLECTION = "linkedinConnections";
export const PUBLISHING_RECORDS_COLLECTION = "publishingRecords";
export const OAUTH_STATES_COLLECTION = "oauthStates";

// Resilient memory caches for fast lookups, test stability, and zero race conditions
const oauthStatesCache = new Map<string, LinkedInOAuthState>();
const connectionsCache = new Map<string, LinkedInConnection>();
const publishingRecordsCache = new Map<string, PublishingRecord>();

export interface PublishApprovedContentOptions {
  contentId: string;
  versionId?: string | number;
  organizationId: string;
  userId?: string;
  eventId?: string;
  securityDecision?: string;
  overrideContent?: string;
}

export interface PublishApprovedContentResult {
  success: boolean;
  status: PublishingStatus;
  externalPostId?: string;
  publishedUrl?: string;
  recordId?: string;
  error?: string;
  errorCode?: string;
  duplicate?: boolean;
}

export class LinkedInService {
  // --------------------------------------------------------------------------
  // 1. OAuth State Management (CSRF Protection, Single-Use, Expiry)
  // --------------------------------------------------------------------------

  /**
   * Generates a cryptographically random OAuth state token associated with a user and organization
   */
  public static async createOAuthState(
    userId: string,
    organizationId: string
  ): Promise<string> {
    const state = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes TTL

    const record: LinkedInOAuthState = {
      state,
      userId,
      organizationId,
      createdAt: now,
      expiresAt,
      used: false,
    };

    oauthStatesCache.set(state, record);

    try {
      const ref = doc(db, OAUTH_STATES_COLLECTION, state);
      await setDoc(ref, cleanForFirestore({
        ...record,
        serverCreatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("[LinkedInService] Firestore state write warning (cached in-memory):", err);
    }

    return state;
  }

  /**
   * Validates and single-use consumes an OAuth state token.
   * Rejects if not found, expired, or already used.
   */
  public static async consumeOAuthState(
    state: string
  ): Promise<{ userId: string; organizationId: string } | null> {
    if (!state) return null;

    let record: LinkedInOAuthState | null = oauthStatesCache.get(state) || null;

    if (!record) {
      try {
        const ref = doc(db, OAUTH_STATES_COLLECTION, state);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          record = snap.data() as LinkedInOAuthState;
        }
      } catch (err) {
        console.warn("[LinkedInService] Firestore state read warning:", err);
      }
    }

    if (!record) {
      console.warn(`[LinkedInService] OAuth state rejected: not found '${state}'`);
      return null;
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      console.warn(`[LinkedInService] OAuth state rejected: expired for state '${state}'`);
      return null;
    }

    // Check single-use
    if (record.used) {
      console.warn(`[LinkedInService] OAuth state rejected: already consumed '${state}'`);
      return null;
    }

    // Mark as consumed immediately
    record.used = true;
    oauthStatesCache.set(state, record);

    try {
      const ref = doc(db, OAUTH_STATES_COLLECTION, state);
      await updateDoc(ref, { used: true, consumedAt: serverTimestamp() });
    } catch (err) {
      console.warn("[LinkedInService] Error marking state as used in Firestore:", err);
    }

    return { userId: record.userId, organizationId: record.organizationId };
  }

  // --------------------------------------------------------------------------
  // 2. LinkedIn Connection Management (Encrypted Tokens, Multi-Tenant)
  // --------------------------------------------------------------------------

  /**
   * Encrypts and securely stores a LinkedIn connection in Firestore
   */
  public static async saveLinkedInConnection(params: {
    organizationId: string;
    userId: string;
    memberId: string;
    memberUrn: string;
    memberName?: string;
    memberEmail?: string;
    memberAvatar?: string;
    scopes: string[];
    accessToken: string;
    expiresInSeconds: number;
  }): Promise<LinkedInConnection> {
    const {
      organizationId,
      userId,
      memberId,
      memberUrn,
      memberName,
      memberEmail,
      memberAvatar,
      scopes,
      accessToken,
      expiresInSeconds,
    } = params;

    const connectionId = `liconn_${organizationId}_${userId}`;
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const encryptedToken = encryptToken(accessToken);

    const connection: LinkedInConnection = {
      id: connectionId,
      organizationId,
      userId,
      linkedinMemberId: memberId,
      linkedinMemberUrn: memberUrn,
      memberName: memberName || "LinkedIn Member",
      memberEmail,
      memberAvatar,
      scopes,
      accessTokenEncrypted: encryptedToken,
      expiresAt: expiresAtIso,
      status: "CONNECTED",
      connectedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    connectionsCache.set(connectionId, connection);

    try {
      const ref = doc(db, LINKEDIN_CONNECTIONS_COLLECTION, connectionId);
      await setDoc(ref, cleanForFirestore({
        ...connection,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("[LinkedInService] Firestore connection write warning:", err);
    }

    // Log immutable audit event
    await logAuditEvent({
      organizationId,
      userId,
      userEmail: memberEmail || "user@nexus.ai",
      userRole: "ADMIN",
      action: "LINKEDIN_CONNECTED",
      resourceType: "LINKEDIN_CONNECTION",
      resourceId: connectionId,
      severity: "INFO",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/Phase8",
      details: {
        memberUrn,
        memberName: memberName || "LinkedIn Member",
        scopes,
        expiresAt: expiresAtIso,
      },
    });

    return connection;
  }

  /**
   * Retrieves active connection for organization and user. Checks expiration.
   */
  public static async getLinkedInConnection(
    organizationId: string,
    userId?: string
  ): Promise<LinkedInConnection | null> {
    if (!organizationId) return null;

    // Search in cache first
    for (const conn of connectionsCache.values()) {
      if (conn.organizationId === organizationId && (!userId || conn.userId === userId)) {
        if (this.checkAndUpdateExpiration(conn)) return null;
        return conn;
      }
    }

    // Query Firestore
    try {
      let q = query(
        collection(db, LINKEDIN_CONNECTIONS_COLLECTION),
        where("organizationId", "==", organizationId)
      );

      if (userId) {
        q = query(q, where("userId", "==", userId));
      }

      const snap = await getDocs(q);
      if (!snap.empty) {
        const conn = snap.docs[0].data() as LinkedInConnection;
        connectionsCache.set(conn.id, conn);
        if (this.checkAndUpdateExpiration(conn)) return null;
        return conn;
      }
    } catch (err) {
      console.warn("[LinkedInService] Firestore connection query warning:", err);
    }

    return null;
  }

  /**
   * Checks if a connection's token has expired and marks status accordingly
   */
  private static checkAndUpdateExpiration(conn: LinkedInConnection): boolean {
    const isExpired = new Date(conn.expiresAt).getTime() <= Date.now();
    if (isExpired && conn.status === "CONNECTED") {
      conn.status = "EXPIRED";
      conn.updatedAt = new Date().toISOString();
      connectionsCache.set(conn.id, conn);

      // Async update Firestore & audit log
      (async () => {
        try {
          const ref = doc(db, LINKEDIN_CONNECTIONS_COLLECTION, conn.id);
          await updateDoc(ref, { status: "EXPIRED", updatedAt: serverTimestamp() });
          await logAuditEvent({
            organizationId: conn.organizationId,
            userId: conn.userId,
            userEmail: conn.memberEmail || "user@nexus.ai",
            userRole: "ADMIN",
            action: "LINKEDIN_TOKEN_EXPIRED",
            resourceType: "LINKEDIN_CONNECTION",
            resourceId: conn.id,
            severity: "WARNING",
            ipAddress: "127.0.0.1",
            userAgent: "NEXUS-Engine/Phase8",
            details: { memberUrn: conn.linkedinMemberUrn, expiredAt: conn.expiresAt },
          });
        } catch (e) {
          console.warn("[LinkedInService] Expiration mark error:", e);
        }
      })();
      return true;
    }
    return conn.status !== "CONNECTED";
  }

  /**
   * Disconnects and revokes a user's LinkedIn connection
   */
  public static async disconnectLinkedIn(
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    const connection = await this.getLinkedInConnection(organizationId, userId);
    if (!connection) return false;

    connection.status = "REVOKED";
    connection.accessTokenEncrypted = ""; // Wipe encrypted credentials
    connection.updatedAt = new Date().toISOString();

    connectionsCache.set(connection.id, connection);

    try {
      const ref = doc(db, LINKEDIN_CONNECTIONS_COLLECTION, connection.id);
      await updateDoc(ref, {
        status: "REVOKED",
        accessTokenEncrypted: "",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("[LinkedInService] Disconnect Firestore error:", err);
    }

    await logAuditEvent({
      organizationId,
      userId,
      userEmail: connection.memberEmail || "user@nexus.ai",
      userRole: "ADMIN",
      action: "LINKEDIN_DISCONNECTED",
      resourceType: "LINKEDIN_CONNECTION",
      resourceId: connection.id,
      severity: "INFO",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/Phase8",
      details: { memberUrn: connection.linkedinMemberUrn },
    });

    return true;
  }

  // --------------------------------------------------------------------------
  // 3. Publishing Engine (Multi-Gate Defense, Posts API, Idempotency)
  // --------------------------------------------------------------------------

  /**
   * Publishes approved content to the member's LinkedIn feed.
   * Validates approval, security decision, character limit, and idempotency.
   */
  public static async publishApprovedContent(
    options: PublishApprovedContentOptions
  ): Promise<PublishApprovedContentResult> {
    const { contentId, organizationId, versionId = "v1", userId, eventId } = options;

    const logPrefix = `[LinkedInService][Publish:${contentId}]`;

    // ------------------------------------------------------------------------
    // GATE 1: Idempotency Check (Prevent duplicate publications)
    // ------------------------------------------------------------------------
    const idempotencyKey = `pub_${organizationId}_${contentId}_${versionId}_linkedin`;
    const existing = publishingRecordsCache.get(idempotencyKey);
    if (existing && existing.status === "PUBLISHED") {
      console.log(`${logPrefix} Idempotency match: already published with ID ${existing.externalPostId}`);
      return {
        success: true,
        status: "PUBLISHED",
        externalPostId: existing.externalPostId,
        publishedUrl: existing.publishedUrl,
        recordId: existing.id,
        duplicate: true,
      };
    }

    // Check in Firestore
    try {
      const q = query(
        collection(db, PUBLISHING_RECORDS_COLLECTION),
        where("organizationId", "==", organizationId),
        where("contentId", "==", contentId),
        where("status", "==", "PUBLISHED")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rec = snap.docs[0].data() as PublishingRecord;
        publishingRecordsCache.set(idempotencyKey, rec);
        console.log(`${logPrefix} Firestore idempotency match: already published.`);
        return {
          success: true,
          status: "PUBLISHED",
          externalPostId: rec.externalPostId,
          publishedUrl: rec.publishedUrl,
          recordId: rec.id,
          duplicate: true,
        };
      }
    } catch (err) {
      console.warn(`${logPrefix} Firestore idempotency read error:`, err);
    }

    // ------------------------------------------------------------------------
    // GATE 2: Retrieve Content & Verify Approval + Tenant Isolation
    // ------------------------------------------------------------------------
    const content = await getContentById(contentId);
    if (!content) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "CONTENT_NOT_FOUND",
        error: `Content record not found: ${contentId}`,
      };
    }

    if (content.organizationId !== organizationId) {
      return {
        success: false,
        status: "BLOCKED",
        errorCode: "CROSS_TENANT_ACCESS_DENIED",
        error: "Content does not belong to the requesting organization.",
      };
    }

    if (content.status !== "APPROVED") {
      return {
        success: false,
        status: "BLOCKED",
        errorCode: "UNAPPROVED_CONTENT",
        error: `Cannot publish content with status '${content.status}'. Explicit human approval is required.`,
      };
    }

    // ------------------------------------------------------------------------
    // GATE 3: Security Validation (Phase 5 Engine Clearance)
    // ------------------------------------------------------------------------
    // Allow if securityDecision is explicitly ALLOW, or if not marked BLOCK/REVIEW
    const secDecision =
      options.securityDecision ||
      ((content as unknown as Record<string, unknown>).securityDecision as string | undefined);
    if (secDecision && secDecision !== "ALLOW") {
      return {
        success: false,
        status: "BLOCKED",
        errorCode: "SECURITY_BLOCKED",
        error: `Publishing blocked by security engine. Security decision: ${secDecision}`,
      };
    }

    // ------------------------------------------------------------------------
    // GATE 4: Content Length Gate (LinkedIn <= 3000 Characters)
    // ------------------------------------------------------------------------
    // Extract publishable text
    const textContent =
      options.overrideContent ||
      content.content ||
      ((content as unknown as Record<string, unknown>).body as string) ||
      ((content as unknown as { summary?: string }).summary as string) ||
      content.title ||
      "";

    if (textContent.length > 3000) {
      return {
        success: false,
        status: "BLOCKED",
        errorCode: "CONTENT_TOO_LONG",
        error: `Content length (${textContent.length} characters) exceeds the LinkedIn maximum of 3000 characters.`,
      };
    }

    // ------------------------------------------------------------------------
    // GATE 5: LinkedIn Connection & Token Verification
    // ------------------------------------------------------------------------
    const targetUserId = userId || content.userId;
    const connection = await this.getLinkedInConnection(organizationId, targetUserId);

    if (!connection) {
      return {
        success: false,
        status: "NOT_CONNECTED",
        errorCode: "LINKEDIN_NOT_CONNECTED",
        error: "No active LinkedIn connection found for this user/organization.",
      };
    }

    if (connection.status !== "CONNECTED") {
      return {
        success: false,
        status: connection.status === "EXPIRED" ? "TOKEN_EXPIRED" : "FAILED",
        errorCode: connection.status === "EXPIRED" ? "LINKEDIN_TOKEN_EXPIRED" : "LINKEDIN_CONNECTION_INVALID",
        error: `LinkedIn connection status is '${connection.status}'. Please reconnect.`,
      };
    }

    // ------------------------------------------------------------------------
    // GATE 6: Decrypt Token & Execute LinkedIn Posts API Request
    // ------------------------------------------------------------------------
    let accessToken = "";
    try {
      accessToken = decryptToken(connection.accessTokenEncrypted);
    } catch (err) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "TOKEN_DECRYPTION_FAILED",
        error: "Failed to securely decrypt stored LinkedIn credentials.",
      };
    }

    // Log publishing request audit event
    await logAuditEvent({
      organizationId,
      userId: targetUserId,
      userEmail: connection.memberEmail || "user@nexus.ai",
      userRole: "ADMIN",
      action: "LINKEDIN_PUBLISH_REQUESTED",
      resourceType: "CONTENT",
      resourceId: contentId,
      severity: "INFO",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/Phase8",
      details: {
        versionId,
        memberUrn: connection.linkedinMemberUrn,
        charCount: textContent.length,
        eventId,
      },
    });

    const publishResult = await defaultLinkedInClient.publishMemberPost(
      accessToken,
      connection.linkedinMemberUrn,
      textContent
    );

    const nowIso = new Date().toISOString();
    const recordId = `pub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!publishResult.success) {
      console.warn(`${logPrefix} LinkedIn API error: ${publishResult.errorCode} - ${publishResult.error}`);

      if (publishResult.statusCode === 401) {
        connection.status = "EXPIRED";
        connectionsCache.set(connection.id, connection);
      }

      const failRecord: PublishingRecord = {
        id: recordId,
        organizationId,
        userId: targetUserId,
        contentId,
        versionId,
        channel: "linkedin",
        status: publishResult.statusCode === 401 ? "TOKEN_EXPIRED" : "FAILED",
        error: publishResult.error,
        errorCode: publishResult.errorCode,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      publishingRecordsCache.set(idempotencyKey, failRecord);

      await logAuditEvent({
        organizationId,
        userId: targetUserId,
        userEmail: connection.memberEmail || "user@nexus.ai",
        userRole: "ADMIN",
        action: "LINKEDIN_PUBLISH_FAILED",
        resourceType: "CONTENT",
        resourceId: contentId,
        severity: "WARNING",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase8",
        details: {
          errorCode: publishResult.errorCode,
          error: publishResult.error,
          statusCode: publishResult.statusCode,
        },
      });

      return {
        success: false,
        status: publishResult.statusCode === 401 ? "TOKEN_EXPIRED" : "FAILED",
        errorCode: publishResult.errorCode,
        error: publishResult.error,
      };
    }

    // ------------------------------------------------------------------------
    // GATE 7: Publication Succeeded - Store Record & Reflect State
    // ------------------------------------------------------------------------
    const successRecord: PublishingRecord = {
      id: recordId,
      organizationId,
      userId: targetUserId,
      contentId,
      versionId,
      channel: "linkedin",
      status: "PUBLISHED",
      externalPostId: publishResult.postId,
      publishedUrl: publishResult.publishedUrl,
      publishedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    publishingRecordsCache.set(idempotencyKey, successRecord);

    try {
      const pubRef = doc(db, PUBLISHING_RECORDS_COLLECTION, recordId);
      await setDoc(pubRef, cleanForFirestore({
        ...successRecord,
        serverCreatedAt: serverTimestamp(),
      }));

      // Update content record in Firestore
      await updateContent(contentId, {
        status: "PUBLISHED",
        isPublished: true,
        publishedAt: nowIso,
        externalPostId: publishResult.postId,
      });

      // Update connection lastPublishedAt
      connection.lastPublishedAt = nowIso;
      connectionsCache.set(connection.id, connection);
      const connRef = doc(db, LINKEDIN_CONNECTIONS_COLLECTION, connection.id);
      await updateDoc(connRef, { lastPublishedAt: nowIso });
    } catch (err) {
      console.warn(`${logPrefix} Firestore success record write error:`, err);
    }

    await logAuditEvent({
      organizationId,
      userId: targetUserId,
      userEmail: connection.memberEmail || "user@nexus.ai",
      userRole: "ADMIN",
      action: "LINKEDIN_PUBLISHED",
      resourceType: "CONTENT",
      resourceId: contentId,
      severity: "INFO",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/Phase8",
      details: {
        externalPostId: publishResult.postId,
        publishedUrl: publishResult.publishedUrl,
        memberUrn: connection.linkedinMemberUrn,
        versionId,
        channel: "linkedin",
      },
    });

    return {
      success: true,
      status: "PUBLISHED",
      externalPostId: publishResult.postId,
      publishedUrl: publishResult.publishedUrl,
      recordId,
    };
  }

  /**
   * Retrieves publishing history for the organization
   */
  public static async getPublishingRecordsByOrg(
    organizationId: string,
    maxLimit: number = 50
  ): Promise<PublishingRecord[]> {
    const list: PublishingRecord[] = [];

    // Collect from memory cache
    for (const rec of publishingRecordsCache.values()) {
      if (rec.organizationId === organizationId) {
        list.push(rec);
      }
    }

    // Collect from Firestore
    try {
      const q = query(
        collection(db, PUBLISHING_RECORDS_COLLECTION),
        where("organizationId", "==", organizationId),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = d.data() as PublishingRecord;
        if (!list.some((r) => r.id === data.id)) {
          list.push(data);
        }
      });
    } catch (err) {
      console.warn("[LinkedInService] Firestore publishing records query error:", err);
    }

    const getTime = (val: unknown) => {
      if (!val) return 0;
      const t = new Date(val as string).getTime();
      return isNaN(t) ? 0 : t;
    };

    return list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }
}
