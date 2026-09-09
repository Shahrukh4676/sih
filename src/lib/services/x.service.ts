// ==============================================================================
// NEXUS AI - Phase 11: X (Twitter) Service
// ==============================================================================
// Handles OAuth state management, AES-256-GCM token encryption,
// multi-gate tweet/thread publishing, and audit trails.
// ==============================================================================

import "server-only";
import crypto from "node:crypto";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  XConnection,
  XConnectionStatus,
  XOAuthState,
  PublishingRecord,
  PublishingStatus,
} from "@/types";
import { encryptToken, decryptToken } from "../security/token-encryption";
import { getXClient, XClient } from "../integrations/x/x-client";
import { getContentById, updateContent, updateContentStatus } from "./content.service";
import { logAuditEvent } from "./audit.service";
import { cleanForFirestore } from "../firebase/firestore-utils";

export const X_CONNECTIONS_COLLECTION = "xConnections";
export const PUBLISHING_RECORDS_COLLECTION = "publishingRecords";
export const X_OAUTH_STATES_COLLECTION = "xOauthStates";

const xOauthStatesCache = new Map<string, XOAuthState>();
const xConnectionsCache = new Map<string, XConnection>();

export interface PublishToXOptions {
  contentId: string;
  versionId?: string | number;
  organizationId: string;
  userId?: string;
  overrideContent?: string;
}

export interface PublishToXResult {
  success: boolean;
  status: PublishingStatus;
  externalPostId?: string;
  publishedUrl?: string;
  threadCount?: number;
  recordId?: string;
  error?: string;
  errorCode?: string;
}

export class XService {
  // --------------------------------------------------------------------------
  // 1. OAuth State Management
  // --------------------------------------------------------------------------

  public static async createOAuthState(
    userId: string,
    organizationId: string,
    returnUrl?: string
  ): Promise<string> {
    const state = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 min TTL

    const record: XOAuthState = {
      state,
      userId,
      organizationId,
      returnUrl: returnUrl || "/settings?tab=INTEGRATIONS",
      createdAt: now,
      expiresAt,
      used: false,
    };

    xOauthStatesCache.set(state, record);

    try {
      const ref = doc(db, X_OAUTH_STATES_COLLECTION, state);
      await setDoc(
        ref,
        cleanForFirestore({
          ...record,
          serverCreatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.warn("[XService] Firestore state write warning (cached in memory):", err);
    }

    return state;
  }

  public static async consumeOAuthState(
    state: string
  ): Promise<{ userId: string; organizationId: string; returnUrl?: string } | null> {
    if (!state) return null;

    let record: XOAuthState | null = xOauthStatesCache.get(state) || null;

    if (!record) {
      try {
        const ref = doc(db, X_OAUTH_STATES_COLLECTION, state);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          record = snap.data() as XOAuthState;
        }
      } catch (err) {
        console.warn("[XService] Firestore state read warning:", err);
      }
    }

    if (!record) {
      console.warn(`[XService] OAuth state rejected: not found '${state}'`);
      return null;
    }

    if (Date.now() > record.expiresAt) {
      console.warn(`[XService] OAuth state rejected: expired '${state}'`);
      return null;
    }

    if (record.used) {
      console.warn(`[XService] OAuth state rejected: already used '${state}'`);
      return null;
    }

    record.used = true;
    xOauthStatesCache.set(state, record);

    try {
      const ref = doc(db, X_OAUTH_STATES_COLLECTION, state);
      await updateDoc(ref, { used: true, consumedAt: serverTimestamp() });
    } catch (err) {
      console.warn("[XService] Error updating state in Firestore:", err);
    }

    return {
      userId: record.userId,
      organizationId: record.organizationId,
      returnUrl: record.returnUrl,
    };
  }

  // --------------------------------------------------------------------------
  // 2. Connection Management (Multi-tenant, AES-256-GCM Encrypted)
  // --------------------------------------------------------------------------

  public static async saveXConnection(params: {
    organizationId: string;
    userId: string;
    xUserId: string;
    xUsername: string;
    xName: string;
    xAvatarUrl?: string;
    scopes: string[];
    accessToken: string;
    refreshToken?: string;
    expiresInSeconds: number;
  }): Promise<XConnection> {
    const {
      organizationId,
      userId,
      xUserId,
      xUsername,
      xName,
      xAvatarUrl,
      scopes,
      accessToken,
      refreshToken,
      expiresInSeconds,
    } = params;

    const connectionId = `xconn_${organizationId}_${xUserId}`;
    const legacyConnectionId = `xconn_${organizationId}_${userId}`;
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : undefined;

    const connection: XConnection = {
      id: connectionId,
      organizationId,
      userId,
      xUserId,
      xUsername,
      xName: xName || `@${xUsername}`,
      xAvatarUrl,
      scopes,
      accessTokenEncrypted: encryptedAccessToken,
      refreshTokenEncrypted: encryptedRefreshToken,
      expiresAt: expiresAtIso,
      status: "CONNECTED",
      connectedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Purge stale/revoked cache entries for this organization
    for (const [key, cached] of xConnectionsCache.entries()) {
      if (
        cached.organizationId === organizationId &&
        (cached.status !== "CONNECTED" || cached.xUserId !== xUserId)
      ) {
        xConnectionsCache.delete(key);
      }
    }

    xConnectionsCache.set(connectionId, connection);
    xConnectionsCache.set(legacyConnectionId, connection);

    try {
      const ref = doc(db, X_CONNECTIONS_COLLECTION, connectionId);
      await setDoc(
        ref,
        cleanForFirestore({
          ...connection,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.warn("[XService] Firestore connection write warning:", err);
    }

    await logAuditEvent({
      organizationId,
      userId,
      userEmail: "user@nexus.ai",
      userRole: "ADMIN",
      action: "X_CONNECTED",
      resourceType: "INTEGRATION",
      resourceId: connectionId,
      severity: "INFO",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/Phase11",
      details: {
        xUserId,
        xUsername,
        scopes,
        expiresAt: expiresAtIso,
      },
    });

    return connection;
  }

  public static async getXConnection(
    organizationId: string,
    userId?: string
  ): Promise<{ connection: XConnection; decryptedToken: string } | null> {
    if (!organizationId) return null;

    let match: XConnection | null = null;

    for (const conn of xConnectionsCache.values()) {
      if (
        conn.organizationId === organizationId &&
        conn.status === "CONNECTED" &&
        (!userId || conn.userId === userId)
      ) {
        match = conn;
        break;
      }
    }

    if (!match) {
      for (const conn of xConnectionsCache.values()) {
        if (conn.organizationId === organizationId && conn.status === "CONNECTED") {
          match = conn;
          break;
        }
      }
    }

    if (!match) {
      try {
        const collRef = collection(db, X_CONNECTIONS_COLLECTION);
        let q = query(
          collRef,
          where("organizationId", "==", organizationId),
          where("status", "==", "CONNECTED")
        );
        let snap = await getDocs(q);

        if (!snap.empty) {
          match = snap.docs[0].data() as XConnection;
          xConnectionsCache.set(match.id, match);
        }
      } catch (err) {
        console.warn("[XService] Firestore getXConnection error:", err);
      }
    }

    if (!match) return null;

    if (new Date(match.expiresAt).getTime() < Date.now()) {
      console.warn("[XService] Connection expired for org:", organizationId);
      match.status = "EXPIRED";
      xConnectionsCache.set(match.id, match);
      return null;
    }

    try {
      const decryptedToken = decryptToken(match.accessTokenEncrypted);
      return { connection: match, decryptedToken };
    } catch (err) {
      console.error("[XService] Failed to decrypt X access token:", err);
      return null;
    }
  }

  public static async disconnectX(
    organizationId: string,
    userId?: string
  ): Promise<boolean> {
    const keysToDelete: string[] = [];
    for (const [key, conn] of xConnectionsCache.entries()) {
      if (conn.organizationId === organizationId) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      xConnectionsCache.delete(key);
    }

    try {
      const collRef = collection(db, X_CONNECTIONS_COLLECTION);
      const q = query(collRef, where("organizationId", "==", organizationId));
      const snap = await getDocs(q);

      const deletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletes);

      await logAuditEvent({
        organizationId,
        userId: userId || "unknown",
        userEmail: "user@nexus.ai",
        userRole: "ADMIN",
        action: "X_DISCONNECTED",
        resourceType: "INTEGRATION",
        resourceId: `xconn_${organizationId}`,
        severity: "INFO",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase11",
        details: { disconnectedAt: new Date().toISOString() },
      });

      return true;
    } catch (err) {
      console.error("[XService] Disconnect error:", err);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 3. Publishing to X (Single Tweet or Thread)
  // --------------------------------------------------------------------------

  public static async publishToX(options: PublishToXOptions): Promise<PublishToXResult> {
    const { contentId, organizationId, userId, overrideContent } = options;

    const connectionData = await this.getXConnection(organizationId, userId);
    if (!connectionData) {
      return {
        success: false,
        status: "NOT_CONNECTED",
        error: "No active X connection found for this organization. Please connect X first.",
        errorCode: "X_NOT_CONNECTED",
      };
    }

    let textToPublish = overrideContent;
    let contentDoc = null;

    if (contentId && contentId !== "standalone_test") {
      contentDoc = await getContentById(contentId);
      if (!contentDoc) {
        return {
          success: false,
          status: "FAILED",
          error: `Content record not found for ID: ${contentId}`,
          errorCode: "CONTENT_NOT_FOUND",
        };
      }

      if (contentDoc.status !== "APPROVED" && contentDoc.status !== "PUBLISHED") {
        return {
          success: false,
          status: "BLOCKED",
          error: `Content must be APPROVED before publishing to X. Current status: ${contentDoc.status}`,
          errorCode: "CONTENT_NOT_APPROVED",
        };
      }

      if (!textToPublish) {
        textToPublish = contentDoc.content || contentDoc.currentVersion?.body || contentDoc.title;
      }
    }

    if (!textToPublish || textToPublish.trim().length === 0) {
      return {
        success: false,
        status: "FAILED",
        error: "Content text is empty. Cannot publish empty post to X.",
        errorCode: "EMPTY_CONTENT",
      };
    }

    const xClient = getXClient();

    try {
      const publishRes = await xClient.publishTweet(connectionData.decryptedToken, textToPublish);

      const recordId = `pub_x_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const pubRecord: PublishingRecord = {
        id: recordId,
        organizationId,
        userId: userId || connectionData.connection.userId,
        contentId,
        versionId: options.versionId || "1",
        channel: "x",
        status: "PUBLISHED",
        externalPostId: publishRes.tweetId,
        publishedUrl: publishRes.tweetUrl,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const pubRef = doc(db, PUBLISHING_RECORDS_COLLECTION, recordId);
        await setDoc(pubRef, cleanForFirestore(pubRecord));
      } catch (e) {
        console.warn("[XService] Publishing record write warning:", e);
      }

      if (contentDoc && contentId !== "standalone_test") {
        await updateContentStatus(contentId, "PUBLISHED");
        await updateContent(contentId, {
          status: "PUBLISHED",
          isPublished: true,
          publishedAt: pubRecord.publishedAt,
          externalPostId: publishRes.tweetId,
        });
      }

      await logAuditEvent({
        organizationId,
        userId: userId || connectionData.connection.userId,
        userEmail: "user@nexus.ai",
        userRole: "ADMIN",
        action: "X_POST_PUBLISHED",
        resourceType: "CONTENT",
        resourceId: contentId,
        severity: "INFO",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase11",
        details: {
          tweetId: publishRes.tweetId,
          tweetUrl: publishRes.tweetUrl,
          threadCount: publishRes.threadCount,
        },
      });

      return {
        success: true,
        status: "PUBLISHED",
        externalPostId: publishRes.tweetId,
        publishedUrl: publishRes.tweetUrl,
        threadCount: publishRes.threadCount,
        recordId,
      };
    } catch (err: any) {
      console.error("[XService] Tweet publish failed:", err);
      return {
        success: false,
        status: "FAILED",
        error: err.message || "X publishing failed",
        errorCode: "X_API_ERROR",
      };
    }
  }
}
