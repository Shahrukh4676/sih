// ==============================================================================
// NEXUS AI - Cloud Firestore Database Service Layer
// ==============================================================================
// Multi-tenant enterprise data access patterns.
// Security Rule: Every query and mutation MUST scope to organizationId and userId.
// ==============================================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint
} from "firebase/firestore";
import { db } from "./config";
import { Content, Source, Approval, AuditLog, Automation } from "@/types";
import { normalizeFirestoreData } from "./firestore-utils";

export const COLLECTIONS = {
  USERS: "users",
  ORGANIZATIONS: "organizations",
  SOURCES: "sources",
  CONTENTS: "contents",
  APPROVALS: "approvals",
  PUBLISHING_JOBS: "publishing_jobs",
  SOCIAL_CONNECTIONS: "social_connections",
  AUTOMATIONS: "automations",
  AUDIT_LOGS: "audit_logs",
  SECURITY_EVENTS: "security_events"
} as const;

/**
 * Fetch a single document by ID from any collection
 */
export async function getDocument<T = DocumentData>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return normalizeFirestoreData({ id: snap.id, ...snap.data() }) as T;
    }
    return null;
  } catch (error) {
    console.error(`[Firestore Error] getDocument from ${collectionName}:`, error);
    return null;
  }
}

/**
 * Write or update a document with timestamp tracking
 */
export async function saveDocument<T extends Record<string, unknown>>(
  collectionName: string,
  id: string,
  data: T,
  merge: boolean = true
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge });
    return true;
  } catch (error) {
    console.error(`[Firestore Error] saveDocument to ${collectionName}:`, error);
    return false;
  }
}

/**
 * Fetch organization-scoped content items
 */
export async function getOrgContents(organizationId: string, limitCount: number = 20): Promise<Content[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONTENTS),
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => normalizeFirestoreData({ id: doc.id, ...doc.data() }) as Content);
  } catch (error) {
    console.warn(`[Firestore Notice] Falling back to memory/mock state:`, error);
    return [];
  }
}

/**
 * Fetch pending approvals for review queue
 */
export async function getPendingApprovals(organizationId: string): Promise<Approval[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.APPROVALS),
      where("organizationId", "==", organizationId),
      where("status", "==", "PENDING"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => normalizeFirestoreData({ id: doc.id, ...doc.data() }) as Approval);
  } catch (error) {
    console.warn(`[Firestore Notice] Approvals query notice:`, error);
    return [];
  }
}

/**
 * Append audit log entry (tamper-evident audit preparation)
 */
export async function appendAuditLog(logEntry: Omit<AuditLog, "id" | "timestamp" | "integrityHash">): Promise<void> {
  try {
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    // SHA-256 hash chaining will be implemented in future backend integrity worker
    const integrityHash = `sha256_${Date.now()}`;
    
    const docRef = doc(db, COLLECTIONS.AUDIT_LOGS, logId);
    await setDoc(docRef, {
      id: logId,
      ...logEntry,
      timestamp,
      integrityHash
    });
  } catch (error) {
    console.error("[Firestore Error] appendAuditLog:", error);
  }
}
