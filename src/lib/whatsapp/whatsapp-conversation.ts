// ==============================================================================
// NEXUS AI - WhatsApp Conversation Session Engine (Phase 6)
// ==============================================================================
// Manages multi-turn state machines across WhatsApp interactions:
// IDLE -> AWAITING_SOURCE -> AWAITING_CONFIGURATION -> GENERATING
//      -> AWAITING_APPROVAL -> EDITING -> COMPLETED / CANCELLED
// Persists in Cloud Firestore with in-memory cache for instant state resumption.
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { WhatsAppConversation, WhatsAppConversationState } from "@/types";
import { normalizeFirestoreData } from "../firebase/firestore-utils";

export const WHATSAPP_CONVERSATIONS_COLLECTION = "whatsappConversations";

// In-memory cache for low-latency multi-turn conversations
const conversationsCache = new Map<string, WhatsAppConversation>();

export class WhatsAppConversationManager {
  /**
   * Retrieves active conversation session or creates a clean one in IDLE state
   */
  public async getOrCreateConversation(
    phoneNumber: string,
    organizationId: string,
    userId: string
  ): Promise<WhatsAppConversation> {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, "");
    const convId = `conv_${cleanPhone}`;

    // 1. Check cache
    const cached = conversationsCache.get(convId);
    if (cached && cached.organizationId === organizationId) {
      return cached;
    }

    // 2. Check Firestore
    try {
      const docRef = doc(db, WHATSAPP_CONVERSATIONS_COLLECTION, convId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = normalizeFirestoreData(snap.data()) as WhatsAppConversation;
        conversationsCache.set(convId, data);
        return data;
      }
    } catch (err) {
      console.warn("[WhatsAppConversation] Firestore read warning (using default):", err);
    }

    // 3. Initialize new session
    const nowIso = new Date().toISOString();
    const newConv: WhatsAppConversation = {
      id: convId,
      organizationId,
      userId,
      phoneNumber: cleanPhone,
      state: "IDLE",
      selectedOutputs: ["LINKEDIN_POST"],
      configuration: {
        tone: "Professional & Authoritative",
        length: "MEDIUM",
        includeVisuals: true,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    conversationsCache.set(convId, newConv);

    try {
      const docRef = doc(db, WHATSAPP_CONVERSATIONS_COLLECTION, convId);
      await setDoc(docRef, newConv);
    } catch (err) {
      console.warn("[WhatsAppConversation] Firestore write warning:", err);
    }

    return newConv;
  }

  /**
   * Transitions conversation state and updates associated session context
   */
  public async transitionState(
    convId: string,
    newState: WhatsAppConversationState,
    extraUpdates: Partial<WhatsAppConversation> = {}
  ): Promise<WhatsAppConversation> {
    const existing = conversationsCache.get(convId);
    const nowIso = new Date().toISOString();

    const updated: WhatsAppConversation = {
      ...(existing || {
        id: convId,
        organizationId: extraUpdates.organizationId || "org_default",
        userId: extraUpdates.userId || "usr_default",
        phoneNumber: convId.replace("conv_", ""),
        createdAt: nowIso,
      }),
      ...extraUpdates,
      state: newState,
      updatedAt: nowIso,
    };

    conversationsCache.set(convId, updated);

    try {
      const docRef = doc(db, WHATSAPP_CONVERSATIONS_COLLECTION, convId);
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      console.warn("[WhatsAppConversation] Transition update warning:", err);
    }

    return updated;
  }

  /**
   * Resets session to IDLE state
   */
  public async resetSession(convId: string): Promise<WhatsAppConversation> {
    return this.transitionState(convId, "IDLE", {
      currentSourceId: undefined,
      currentContentId: undefined,
      currentVersionNumber: undefined,
      pendingAction: undefined,
      lastUserMessage: undefined,
      lastBotReply: undefined,
    });
  }

  /**
   * Retrieves conversation by ID
   */
  public async getConversation(convId: string): Promise<WhatsAppConversation | null> {
    if (conversationsCache.has(convId)) {
      return conversationsCache.get(convId)!;
    }

    try {
      const docRef = doc(db, WHATSAPP_CONVERSATIONS_COLLECTION, convId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = normalizeFirestoreData(snap.data()) as WhatsAppConversation;
        conversationsCache.set(convId, data);
        return data;
      }
    } catch (err) {
      console.warn("[WhatsAppConversation] Get conversation warning:", err);
    }

    return null;
  }

  /**
   * List conversations by Organization
   */
  public async listByOrg(organizationId: string): Promise<WhatsAppConversation[]> {
    const list: WhatsAppConversation[] = [];

    for (const c of conversationsCache.values()) {
      if (c.organizationId === organizationId) {
        list.push(c);
      }
    }

    try {
      const q = query(
        collection(db, WHATSAPP_CONVERSATIONS_COLLECTION),
        where("organizationId", "==", organizationId)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = normalizeFirestoreData(d.data()) as WhatsAppConversation;
        if (!list.some((item) => item.id === data.id)) {
          list.push(data);
        }
      });
    } catch (err) {
      console.warn("[WhatsAppConversation] List query warning:", err);
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public clearCache(): void {
    conversationsCache.clear();
  }
}

export const defaultWhatsAppConversationManager = new WhatsAppConversationManager();
