// ==============================================================================
// NEXUS AI - Publishing Service
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { PublishingJob, SocialConnection } from "@/types";
import { normalizeFirestoreData } from "../firebase/firestore-utils";

export const PUBLISHING_JOBS_COLLECTION = "publishingJobs";
export const SOCIAL_CONNECTIONS_COLLECTION = "socialConnections";

export async function getSocialConnectionsByOrg(organizationId: string): Promise<SocialConnection[]> {
  try {
    const q = query(
      collection(db, SOCIAL_CONNECTIONS_COLLECTION),
      where("organizationId", "==", organizationId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => normalizeFirestoreData({ id: d.id, ...d.data() }) as SocialConnection);
  } catch (error) {
    console.error("[Publishing Service] Error fetching connections:", error);
    return [];
  }
}

export async function getPublishingJobsByOrg(organizationId: string): Promise<PublishingJob[]> {
  try {
    const q = query(
      collection(db, PUBLISHING_JOBS_COLLECTION),
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => normalizeFirestoreData({ id: d.id, ...d.data() }) as PublishingJob);
  } catch (error) {
    console.error("[Publishing Service] Error fetching publishing jobs:", error);
    return [];
  }
}

export async function createPublishingJob(
  jobData: Omit<PublishingJob, "id" | "createdAt" | "updatedAt">
): Promise<PublishingJob | null> {
  try {
    const id = `pub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ref = doc(db, PUBLISHING_JOBS_COLLECTION, id);
    const nowIso = new Date().toISOString();

    const payload = {
      ...jobData,
      id,
      retryCount: 0,
      maxRetries: 3,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, payload);

    return {
      ...jobData,
      id,
      retryCount: 0,
      maxRetries: 3,
      createdAt: nowIso,
      updatedAt: nowIso
    };
  } catch (error) {
    console.error("[Publishing Service] Error creating publishing job:", error);
    return null;
  }
}
