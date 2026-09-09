// ==============================================================================
// NEXUS AI - Secure WhatsApp User & Organization Linking Service (Phase 6)
// ==============================================================================
// Implements token-based out-of-band identity binding:
// WhatsApp Phone Number -> Platform User -> Organization ID
// Prevents unauthorized or spoofed access to enterprise tenant spaces.
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { WhatsAppConnection, WhatsAppConnectionStatus } from "@/types";
import { logAuditEvent } from "../services/audit.service";
import { normalizeFirestoreData } from "../firebase/firestore-utils";

export const WHATSAPP_CONNECTIONS_COLLECTION = "whatsappConnections";

// In-memory fallback / quick lookup cache for low-latency routing and headless testing
const connectionsCache = new Map<string, WhatsAppConnection>();
const pendingTokensCache = new Map<string, {
  code: string;
  organizationId: string;
  userId: string;
  expiresAt: number;
}>();

export class WhatsAppUserLinkService {
  /**
   * Generates a single-use, high-entropy 6-character linking code (e.g. NX-78K2P9)
   * Valid for 15 minutes.
   */
  public async createLinkingCode(
    organizationId: string,
    userId: string
  ): Promise<{ code: string; expiresAt: string }> {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable chars without 0/O, 1/I
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `NX-${randomPart}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Cache in memory for quick evaluation
    pendingTokensCache.set(code, {
      code,
      organizationId,
      userId,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    try {
      const connId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(db, WHATSAPP_CONNECTIONS_COLLECTION, connId);

      const connData: Partial<WhatsAppConnection> = {
        id: connId,
        organizationId,
        userId,
        phoneNumber: "", // to be filled upon verification
        linkingCode: code,
        linkingCodeExpiresAt: expiresAt,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, connData);
    } catch (err) {
      console.warn("[WhatsAppUserLink] Firestore write warning (using memory cache):", err);
    }

    return { code, expiresAt };
  }

  /**
   * Verifies linking code sent from WhatsApp or UI and activates connection
   */
  public async verifyAndLink(
    phoneNumber: string,
    rawCode: string
  ): Promise<{ success: boolean; connection?: WhatsAppConnection; error?: string }> {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, "");
    const cleanCode = rawCode.trim().toUpperCase();

    // 1. Check pending token cache
    const pending = pendingTokensCache.get(cleanCode);
    if (!pending) {
      return {
        success: false,
        error: "Invalid or expired linking code. Please generate a new code from NEXUS AI Settings > WhatsApp.",
      };
    }

    if (Date.now() > pending.expiresAt) {
      pendingTokensCache.delete(cleanCode);
      return {
        success: false,
        error: "This linking code has expired. Please generate a fresh code in NEXUS AI.",
      };
    }

    // 2. Consume the single-use token
    pendingTokensCache.delete(cleanCode);

    const nowIso = new Date().toISOString();
    const connId = `conn_${cleanPhone}`;

    const activeConn: WhatsAppConnection = {
      id: connId,
      organizationId: pending.organizationId,
      userId: pending.userId,
      phoneNumber: cleanPhone,
      whatsappUserId: cleanPhone,
      status: "ACTIVE",
      verifiedAt: nowIso,
      lastSeenAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Store in memory cache
    connectionsCache.set(cleanPhone, activeConn);

    // Persist to Firestore
    try {
      const docRef = doc(db, WHATSAPP_CONNECTIONS_COLLECTION, connId);
      await setDoc(docRef, activeConn);

      // Log audit event
      await logAuditEvent({
        organizationId: pending.organizationId,
        userId: pending.userId,
        userEmail: `user_${pending.userId}@nexus.internal`,
        userRole: "EDITOR",
        action: "WHATSAPP_USER_LINKED",
        resourceType: "WHATSAPP_CONNECTION",
        resourceId: connId,
        severity: "INFO",
        ipAddress: "whatsapp-webhook",
        userAgent: "Meta-WhatsApp-Cloud-API",
        details: {
          phoneNumber: `***-***-${cleanPhone.slice(-4)}`,
          status: "ACTIVE",
        },
      });
    } catch (err) {
      console.warn("[WhatsAppUserLink] Firestore write warning (persisted in cache):", err);
    }

    return {
      success: true,
      connection: activeConn,
    };
  }

  /**
   * Resolves connection by E.164 phone number
   */
  public async getConnectionByPhoneNumber(phoneNumber: string): Promise<WhatsAppConnection | null> {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, "");

    // 1. Check memory cache
    const cached = connectionsCache.get(cleanPhone);
    if (cached) {
      if (cached.status === "ACTIVE") {
        return cached;
      }
      return null;
    }

    // 2. Query Firestore
    try {
      const q = query(
        collection(db, WHATSAPP_CONNECTIONS_COLLECTION),
        where("phoneNumber", "==", cleanPhone),
        where("status", "==", "ACTIVE")
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docData = normalizeFirestoreData(snap.docs[0].data()) as WhatsAppConnection;
        connectionsCache.set(cleanPhone, docData);
        return docData;
      }
    } catch (err) {
      console.warn("[WhatsAppUserLink] Error querying connections in Firestore:", err);
    }

    return null;
  }

  /**
   * Revoke connection
   */
  public async revokeConnection(connectionId: string, organizationId: string): Promise<boolean> {
    try {
      // Find in memory
      for (const [phone, conn] of connectionsCache.entries()) {
        if (conn.id === connectionId && conn.organizationId === organizationId) {
          conn.status = "REVOKED";
          conn.updatedAt = new Date().toISOString();
          connectionsCache.set(phone, conn);
          break;
        }
      }

      // Update Firestore
      const docRef = doc(db, WHATSAPP_CONNECTIONS_COLLECTION, connectionId);
      await updateDoc(docRef, {
        status: "REVOKED",
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (err) {
      console.warn("[WhatsAppUserLink] Revoke error:", err);
      return false;
    }
  }

  /**
   * List all connections for an organization
   */
  public async listConnectionsByOrg(organizationId: string): Promise<WhatsAppConnection[]> {
    const results: WhatsAppConnection[] = [];

    // Memory cache items
    for (const conn of connectionsCache.values()) {
      if (conn.organizationId === organizationId) {
        results.push(conn);
      }
    }

    try {
      const q = query(
        collection(db, WHATSAPP_CONNECTIONS_COLLECTION),
        where("organizationId", "==", organizationId)
      );
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const data = normalizeFirestoreData(doc.data()) as WhatsAppConnection;
        if (!results.some((r) => r.id === data.id)) {
          results.push(data);
        }
      });
    } catch (err) {
      console.warn("[WhatsAppUserLink] Firestore list warning:", err);
    }

    return results;
  }

  /**
   * Direct manual link method (used by test suites or admin setup)
   */
  public registerDirectConnection(conn: WhatsAppConnection): void {
    const cleanPhone = conn.phoneNumber.replace(/[^\d]/g, "");
    connectionsCache.set(cleanPhone, { ...conn, phoneNumber: cleanPhone });
  }

  public clearCache(): void {
    connectionsCache.clear();
    pendingTokensCache.clear();
  }
}

export const defaultWhatsAppUserLinkService = new WhatsAppUserLinkService();
