// ==============================================================================
// NEXUS AI - Security Intelligence Service (Phase 5)
// ==============================================================================
// Manages Firestore persistence for securityScans and securityEvents collections.
// ==============================================================================

import { doc, getDoc, setDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { SecurityScan, SecurityEvent } from "@/types";
import { cleanForFirestore } from "../firebase/firestore-utils";

export const SECURITY_SCANS_COLLECTION = "securityScans";
export const SECURITY_EVENTS_COLLECTION = "securityEvents";

const inMemoryScansCache = new Map<string, SecurityScan>();
const inMemoryEventsCache = new Map<string, SecurityEvent>();

export class SecurityService {
  /**
   * Persists a completed SecurityScan in Firestore
   */
  public static async recordSecurityScan(
    scanData: Omit<SecurityScan, "id" | "createdAt" | "updatedAt">
  ): Promise<SecurityScan | null> {
    const id = scanData.securityScanId || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const scanObj: SecurityScan = {
      ...scanData,
      id,
      securityScanId: id,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    inMemoryScansCache.set(id, scanObj);

    try {
      const ref = doc(db, SECURITY_SCANS_COLLECTION, id);
      const payload = cleanForFirestore({
        ...scanData,
        id,
        securityScanId: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(ref, payload);
      return scanObj;
    } catch (error) {
      console.warn("[Security Service] Firestore write notice (cached in memory):", error);
      return scanObj;
    }
  }

  /**
   * Retrieves a SecurityScan by ID
   */
  public static async getSecurityScanById(scanId: string): Promise<SecurityScan | null> {
    if (inMemoryScansCache.has(scanId)) {
      return inMemoryScansCache.get(scanId)!;
    }

    try {
      const ref = doc(db, SECURITY_SCANS_COLLECTION, scanId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const item = { id: snap.id, securityScanId: snap.id, ...snap.data() } as SecurityScan;
        inMemoryScansCache.set(scanId, item);
        return item;
      }
      return null;
    } catch (error) {
      console.warn("[Security Service] Error fetching scan by id:", error);
      return inMemoryScansCache.get(scanId) || null;
    }
  }

  /**
   * Retrieves all security scans for an organization
   */
  public static async getSecurityScansByOrg(organizationId: string): Promise<SecurityScan[]> {
    try {
      const q = query(
        collection(db, SECURITY_SCANS_COLLECTION),
        where("organizationId", "==", organizationId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, securityScanId: d.id, ...d.data() } as SecurityScan));
      if (results.length > 0) return results;
    } catch (error) {
      console.warn("[Security Service] Firestore query notice for org scans:", error);
    }

    return Array.from(inMemoryScansCache.values()).filter(
      (s) => s.organizationId === organizationId
    );
  }

  /**
   * Records a security alert event (prompt injection, blocked credential, unauthorized access)
   */
  public static async recordSecurityEvent(
    eventData: Omit<SecurityEvent, "id">
  ): Promise<SecurityEvent | null> {
    const id = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventObj: SecurityEvent = {
      ...eventData,
      id
    };

    inMemoryEventsCache.set(id, eventObj);

    try {
      const ref = doc(db, SECURITY_EVENTS_COLLECTION, id);
      const payload = cleanForFirestore({
        ...eventData,
        id,
        createdAt: serverTimestamp()
      });
      await setDoc(ref, payload);
      return eventObj;
    } catch (error) {
      console.warn("[Security Service] Firestore write notice for security event:", error);
      return eventObj;
    }
  }
}
