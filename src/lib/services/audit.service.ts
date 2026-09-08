// ==============================================================================
// NEXUS AI - Audit & Security Events Service (Immutable Append-Only Ledger)
// ==============================================================================

import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { AuditLog, SecurityEvent } from "@/types";

export const AUDIT_LOGS_COLLECTION = "auditLogs";
export const SECURITY_EVENTS_COLLECTION = "securityEvents";

export async function logAuditEvent(
  entry: Omit<AuditLog, "id" | "timestamp" | "integrityHash">
): Promise<string | null> {
  try {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ref = doc(db, AUDIT_LOGS_COLLECTION, id);
    const nowIso = new Date().toISOString();
    
    // In Phase 2, generate deterministic hex signature for audit verification
    const integrityHash = `sha256:${Date.now().toString(16)}_${Math.random().toString(16).substring(2, 10)}`;

    const payload = {
      ...entry,
      id,
      integrityHash,
      createdAt: serverTimestamp(),
      timestamp: nowIso
    };

    await setDoc(ref, payload);
    return id;
  } catch (error) {
    console.error("[Audit Service] Error appending audit log:", error);
    return null;
  }
}

export async function getAuditLogsByOrg(organizationId: string, maxLimit: number = 50): Promise<AuditLog[]> {
  try {
    const q = query(
      collection(db, AUDIT_LOGS_COLLECTION),
      where("organizationId", "==", organizationId),
      orderBy("timestamp", "desc"),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
  } catch (error) {
    console.error("[Audit Service] Error fetching audit logs:", error);
    return [];
  }
}

export async function getSecurityEventsByOrg(organizationId: string): Promise<SecurityEvent[]> {
  try {
    const q = query(
      collection(db, SECURITY_EVENTS_COLLECTION),
      where("organizationId", "==", organizationId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SecurityEvent));
  } catch (error) {
    console.error("[Audit Service] Error fetching security events:", error);
    return [];
  }
}
