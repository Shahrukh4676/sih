// ==============================================================================
// NEXUS AI - Phase 11: Instagram Service
// ==============================================================================
// Handles OAuth state management, AES-256-GCM token encryption,
// multi-gate Instagram Graph API publishing, and audit trails.
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
  InstagramConnection,
  InstagramConnectionStatus,
  InstagramOAuthState,
  PublishingRecord,
  PublishingStatus,
} from "@/types";
import { encryptToken, decryptToken } from "../security/token-encryption";
import { getInstagramClient, InstagramClient } from "../integrations/instagram/instagram-client";
import { getContentById, updateContent, updateContentStatus } from "./content.service";
import { logAuditEvent } from "./audit.service";
import { cleanForFirestore } from "../firebase/firestore-utils";

export const INSTAGRAM_CONNECTIONS_COLLECTION = "instagramConnections";
export const PUBLISHING_RECORDS_COLLECTION = "publishingRecords";
export const INSTAGRAM_OAUTH_STATES_COLLECTION = "instagramOauthStates";

const igOauthStatesCache = new Map<string, InstagramOAuthState>();
const igConnectionsCache = new Map<string, InstagramConnection>();

export interface PublishToInstagramOptions {
  contentId: string;
  versionId?: string | number;
  organizationId: string;
  userId?: string;
  overrideCaption?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface PublishToInstagramResult {
  success: boolean;
  status: PublishingStatus;
  externalPostId?: string;
  publishedUrl?: string;
  recordId?: string;
  error?: string;
  errorCode?: string;
}

export class InstagramService {
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

    const record: InstagramOAuthState = {
      state,
      userId,
      organizationId,
      returnUrl: returnUrl || "/settings?tab=INTEGRATIONS",
      createdAt: now,
      expiresAt,
      used: false,
    };

    igOauthStatesCache.set(state, record);

    try {
      const ref = doc(db, INSTAGRAM_OAUTH_STATES_COLLECTION, state);
      await setDoc(
        ref,
        cleanForFirestore({
          ...record,
          serverCreatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.warn("[InstagramService] Firestore state write warning (cached in memory):", err);
    }

    return state;
  }

  public static async consumeOAuthState(
    state: string
  ): Promise<{ userId: string; organizationId: string; returnUrl?: string } | null> {
    if (!state) return null;

    let record: InstagramOAuthState | null = igOauthStatesCache.get(state) || null;

    if (!record) {
      try {
        const ref = doc(db, INSTAGRAM_OAUTH_STATES_COLLECTION, state);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          record = snap.data() as InstagramOAuthState;
        }
      } catch (err) {
        console.warn("[InstagramService] Firestore state read warning:", err);
      }
    }

    if (!record) {
      console.warn(`[InstagramService] OAuth state rejected: not found '${state}'`);
      return null;
    }

    if (Date.now() > record.expiresAt) {
      console.warn(`[InstagramService] OAuth state rejected: expired '${state}'`);
      return null;
    }

    if (record.used) {
      console.warn(`[InstagramService] OAuth state rejected: already used '${state}'`);
      return null;
    }

    record.used = true;
    igOauthStatesCache.set(state, record);

    try {
      const ref = doc(db, INSTAGRAM_OAUTH_STATES_COLLECTION, state);
      await updateDoc(ref, { used: true, consumedAt: serverTimestamp() });
    } catch (err) {
      console.warn("[InstagramService] Error updating state in Firestore:", err);
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

  public static async saveInstagramConnection(params: {
    organizationId: string;
    userId: string;
    instagramUserId: string;
    instagramUsername: string;
    accountType?: string;
    profilePictureUrl?: string;
    accessToken: string;
    expiresInSeconds: number;
  }): Promise<InstagramConnection> {
    const {
      organizationId,
      userId,
      instagramUserId,
      instagramUsername,
      accountType,
      profilePictureUrl,
      accessToken,
      expiresInSeconds,
    } = params;

    const connectionId = `igconn_${organizationId}_${instagramUserId}`;
    const legacyConnectionId = `igconn_${organizationId}_${userId}`;
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const encryptedAccessToken = encryptToken(accessToken);

    const connection: InstagramConnection = {
      id: connectionId,
      organizationId,
      userId,
      instagramUserId,
      instagramUsername,
      accountType: accountType || "BUSINESS",
      profilePictureUrl,
      accessTokenEncrypted: encryptedAccessToken,
      expiresAt: expiresAtIso,
      status: "CONNECTED",
      connectedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Purge stale/revoked cache entries for this organization
    for (const [key, cached] of igConnectionsCache.entries()) {
      if (
        cached.organizationId === organizationId &&
        (cached.status !== "CONNECTED" || cached.instagramUserId !== instagramUserId)
      ) {
        igConnectionsCache.delete(key);
      }
    }

    igConnectionsCache.set(connectionId, connection);
    igConnectionsCache.set(legacyConnectionId, connection);

    try {
      const ref = doc(db, INSTAGRAM_CONNECTIONS_COLLECTION, connectionId);
      await setDoc(
        ref,
        cleanForFirestore({
          ...connection,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.warn("[InstagramService] Firestore connection write warning:", err);
    }

    await logAuditEvent({
      organizationId,
      userId,
      userEmail: "user@nexus.ai",
      userRole: "ADMIN",
      action: "INSTAGRAM_CONNECTED",
      resourceType: "INTEGRATION",
      resourceId: connectionId,
      severity: "INFO",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/Phase11",
      details: {
        instagramUserId,
        instagramUsername,
        accountType,
        expiresAt: expiresAtIso,
      },
    });

    return connection;
  }

  public static async getInstagramConnection(
    organizationId: string,
    userId?: string
  ): Promise<{ connection: InstagramConnection; decryptedToken: string } | null> {
    if (!organizationId) return null;

    let match: InstagramConnection | null = null;

    for (const conn of igConnectionsCache.values()) {
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
      for (const conn of igConnectionsCache.values()) {
        if (conn.organizationId === organizationId && conn.status === "CONNECTED") {
          match = conn;
          break;
        }
      }
    }

    if (!match) {
      try {
        const collRef = collection(db, INSTAGRAM_CONNECTIONS_COLLECTION);
        let q = query(
          collRef,
          where("organizationId", "==", organizationId),
          where("status", "==", "CONNECTED")
        );
        let snap = await getDocs(q);

        if (!snap.empty) {
          match = snap.docs[0].data() as InstagramConnection;
          igConnectionsCache.set(match.id, match);
        }
      } catch (err) {
        console.warn("[InstagramService] Firestore getInstagramConnection error:", err);
      }
    }

    if (!match) return null;

    if (new Date(match.expiresAt).getTime() < Date.now()) {
      console.warn("[InstagramService] Connection expired for org:", organizationId);
      match.status = "EXPIRED";
      igConnectionsCache.set(match.id, match);
      return null;
    }

    try {
      const decryptedToken = decryptToken(match.accessTokenEncrypted);
      return { connection: match, decryptedToken };
    } catch (err) {
      console.error("[InstagramService] Failed to decrypt Instagram access token:", err);
      return null;
    }
  }

  public static async disconnectInstagram(
    organizationId: string,
    userId?: string
  ): Promise<boolean> {
    const keysToDelete: string[] = [];
    for (const [key, conn] of igConnectionsCache.entries()) {
      if (conn.organizationId === organizationId) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      igConnectionsCache.delete(key);
    }

    try {
      const collRef = collection(db, INSTAGRAM_CONNECTIONS_COLLECTION);
      const q = query(collRef, where("organizationId", "==", organizationId));
      const snap = await getDocs(q);

      const deletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletes);

      await logAuditEvent({
        organizationId,
        userId: userId || "unknown",
        userEmail: "user@nexus.ai",
        userRole: "ADMIN",
        action: "INSTAGRAM_DISCONNECTED",
        resourceType: "INTEGRATION",
        resourceId: `igconn_${organizationId}`,
        severity: "INFO",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase11",
        details: { disconnectedAt: new Date().toISOString() },
      });

      return true;
    } catch (err) {
      console.error("[InstagramService] Disconnect error:", err);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 3. Publishing to Instagram
  // --------------------------------------------------------------------------

  public static async publishToInstagram(
    options: PublishToInstagramOptions
  ): Promise<PublishToInstagramResult> {
    const { contentId, organizationId, userId, overrideCaption, imageUrl, tags } = options;

    const connectionData = await this.getInstagramConnection(organizationId, userId);
    if (!connectionData) {
      return {
        success: false,
        status: "NOT_CONNECTED",
        error: "No active Instagram connection found for this organization. Please connect Instagram first.",
        errorCode: "INSTAGRAM_NOT_CONNECTED",
      };
    }

    let captionToPublish = overrideCaption;
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
          error: `Content must be APPROVED before publishing to Instagram. Current status: ${contentDoc.status}`,
          errorCode: "CONTENT_NOT_APPROVED",
        };
      }

      if (!captionToPublish) {
        captionToPublish = contentDoc.content || contentDoc.currentVersion?.body || contentDoc.title;
      }
    }

    if (!captionToPublish || captionToPublish.trim().length === 0) {
      return {
        success: false,
        status: "FAILED",
        error: "Content text is empty. Cannot publish empty post to Instagram.",
        errorCode: "EMPTY_CONTENT",
      };
    }

    const igClient = getInstagramClient();

    try {
      const publishRes = await igClient.publishPost(connectionData.decryptedToken, {
        caption: captionToPublish,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
        tags: tags || ["NexusAI", "Intelligence"],
      });

      const recordId = `pub_ig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const pubRecord: PublishingRecord = {
        id: recordId,
        organizationId,
        userId: userId || connectionData.connection.userId,
        contentId,
        versionId: options.versionId || "1",
        channel: "instagram",
        status: "PUBLISHED",
        externalPostId: publishRes.mediaId,
        publishedUrl: publishRes.mediaUrl,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const pubRef = doc(db, PUBLISHING_RECORDS_COLLECTION, recordId);
        await setDoc(pubRef, cleanForFirestore(pubRecord));
      } catch (e) {
        console.warn("[InstagramService] Publishing record write warning:", e);
      }

      if (contentDoc && contentId !== "standalone_test") {
        await updateContentStatus(contentId, "PUBLISHED");
        await updateContent(contentId, {
          status: "PUBLISHED",
          isPublished: true,
          publishedAt: pubRecord.publishedAt,
          externalPostId: publishRes.mediaId,
        });
      }

      await logAuditEvent({
        organizationId,
        userId: userId || connectionData.connection.userId,
        userEmail: "user@nexus.ai",
        userRole: "ADMIN",
        action: "INSTAGRAM_POST_PUBLISHED",
        resourceType: "CONTENT",
        resourceId: contentId,
        severity: "INFO",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase11",
        details: {
          mediaId: publishRes.mediaId,
          mediaUrl: publishRes.mediaUrl,
        },
      });

      return {
        success: true,
        status: "PUBLISHED",
        externalPostId: publishRes.mediaId,
        publishedUrl: publishRes.mediaUrl,
        recordId,
      };
    } catch (err: any) {
      console.error("[InstagramService] Instagram publish failed:", err);
      return {
        success: false,
        status: "FAILED",
        error: err.message || "Instagram publishing failed",
        errorCode: "INSTAGRAM_API_ERROR",
      };
    }
  }
}
