// ==============================================================================
// NEXUS AI - Content & Versioning Service (Phase 3 Updates)
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { Content, ContentStatus, ContentVersion } from "@/types";
import { cleanForFirestore, normalizeFirestoreData } from "../firebase/firestore-utils";

export const CONTENT_COLLECTION = "content";

const inMemoryContentCache = new Map<string, Content>();

export async function createContent(
  contentData: Omit<Content, "id" | "createdAt" | "updatedAt">
): Promise<Content | null> {
  const id = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const version1: ContentVersion = {
    versionNumber: 1,
    title: contentData.title,
    body: contentData.currentVersion.body,
    content: contentData.currentVersion.body,
    generationConfig: contentData.currentVersion.generationConfig,
    providerUsed: contentData.currentVersion.providerUsed,
    createdBy: contentData.userId,
    authorId: contentData.userId,
    scenes: contentData.currentVersion.scenes,
    slideOutline: contentData.currentVersion.slideOutline,
    metadata: contentData.currentVersion.metadata,
    createdAt: nowIso
  };

  const contentObj: Content = {
    ...contentData,
    id,
    contentId: id,
    version: 1,
    currentVersion: version1,
    versionHistory: [version1],
    createdAt: nowIso,
    updatedAt: nowIso
  };

  inMemoryContentCache.set(id, contentObj);

  try {
    const ref = doc(db, CONTENT_COLLECTION, id);
    const payload = cleanForFirestore({
      ...contentData,
      id,
      contentId: id,
      version: 1,
      currentVersion: version1,
      versionHistory: [version1],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await setDoc(ref, payload);
    return contentObj;
  } catch (error) {
    console.warn("[Content Service] Firestore write notice (retaining in-memory content):", error);
    return contentObj;
  }
}

export async function getContentById(contentId: string): Promise<Content | null> {
  if (inMemoryContentCache.has(contentId)) {
    return inMemoryContentCache.get(contentId)!;
  }

  try {
    const ref = doc(db, CONTENT_COLLECTION, contentId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const item = normalizeFirestoreData({ id: snap.id, contentId: snap.id, ...snap.data() }) as Content;
      inMemoryContentCache.set(contentId, item);
      return item;
    }
    return null;
  } catch (error) {
    console.warn("[Content Service] Error fetching content by id:", error);
    return inMemoryContentCache.get(contentId) || null;
  }
}

export async function getContentVersions(contentId: string): Promise<ContentVersion[]> {
  const content = await getContentById(contentId);
  return content?.versionHistory || (content?.currentVersion ? [content.currentVersion] : []);
}

/**
 * Appends a new immutable version upon regeneration (does NOT overwrite prior versions)
 */
export async function appendContentVersion(
  contentId: string,
  newVersionPayload: {
    title: string;
    body: string;
    providerUsed: string;
    generationConfig?: Record<string, unknown>;
    userId: string;
    slideOutline?: any[];
  }
): Promise<Content | null> {
  const existing = await getContentById(contentId);
  if (!existing) {
    throw new Error(`Content with ID ${contentId} not found.`);
  }

  const currentHistory = existing.versionHistory && existing.versionHistory.length > 0
    ? existing.versionHistory
    : [existing.currentVersion];
  const newVersionNumber = (existing.version || currentHistory.length) + 1;
  const nowIso = new Date().toISOString();

  const newVersion: ContentVersion = {
    versionNumber: newVersionNumber,
    title: newVersionPayload.title,
    body: newVersionPayload.body,
    content: newVersionPayload.body,
    providerUsed: newVersionPayload.providerUsed,
    generationConfig: newVersionPayload.generationConfig,
    createdBy: newVersionPayload.userId,
    authorId: newVersionPayload.userId,
    slideOutline: newVersionPayload.slideOutline,
    createdAt: nowIso
  };

  const updatedHistory = [...currentHistory, newVersion];

  const updatedContent: Content = {
    ...existing,
    title: newVersionPayload.title,
    content: newVersionPayload.body,
    currentVersion: newVersion,
    versionHistory: updatedHistory,
    version: newVersionNumber,
    status: "GENERATED",
    updatedAt: nowIso
  };

  inMemoryContentCache.set(contentId, updatedContent);

  try {
    const ref = doc(db, CONTENT_COLLECTION, contentId);
    await updateDoc(ref, cleanForFirestore({
      title: newVersionPayload.title,
      content: newVersionPayload.body,
      currentVersion: newVersion,
      versionHistory: updatedHistory,
      version: newVersionNumber,
      status: "GENERATED",
      updatedAt: serverTimestamp()
    }));
    return updatedContent;
  } catch (error) {
    console.warn("[Content Service] Firestore update notice (cached in memory):", error);
    return updatedContent;
  }
}

export async function getContentByOrg(
  organizationId: string,
  statusFilter?: string
): Promise<Content[]> {
  const filterByStatus = (items: Content[]): Content[] => {
    if (!statusFilter || statusFilter === "ALL") return items;
    const allowed = statusFilter.split(",").map((s) => s.trim().toUpperCase());
    return items.filter((item) => allowed.includes(item.status.toUpperCase()));
  };

  const sortByDateDesc = (items: Content[]): Content[] => {
    return items.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  };

  try {
    const q = query(
      collection(db, CONTENT_COLLECTION),
      where("organizationId", "==", organizationId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map(
      (d) => normalizeFirestoreData({ id: d.id, contentId: d.id, ...d.data() }) as Content
    );
    if (results.length > 0) {
      const sorted = sortByDateDesc(results);
      return filterByStatus(sorted);
    }
  } catch (error) {
    console.warn("[Content Service] Firestore query notice:", error);
  }

  const cached = Array.from(inMemoryContentCache.values()).filter(
    (c) => c.organizationId === organizationId
  );
  return filterByStatus(sortByDateDesc(cached));
}

export async function updateContentStatus(
  contentId: string,
  status: ContentStatus
): Promise<boolean> {
  const existing = inMemoryContentCache.get(contentId);
  if (existing) {
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
  }

  try {
    const ref = doc(db, CONTENT_COLLECTION, contentId);
    await setDoc(
      ref,
      cleanForFirestore({
        status,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn("[Content Service] Firestore status update notice:", error);
    return true;
  }
}

export async function updateContent(
  contentId: string,
  updates: Partial<Content> & Record<string, unknown>
): Promise<Content | null> {
  const existing = inMemoryContentCache.get(contentId);
  const nowIso = new Date().toISOString();
  let updatedObj: Content | null = null;
  if (existing) {
    updatedObj = {
      ...existing,
      ...updates,
      updatedAt: nowIso,
    } as Content;
    inMemoryContentCache.set(contentId, updatedObj);
  }

  try {
    const ref = doc(db, CONTENT_COLLECTION, contentId);
    await updateDoc(ref, cleanForFirestore({
      ...updates,
      updatedAt: serverTimestamp()
    }));
    return updatedObj;
  } catch (error) {
    console.warn("[Content Service] Firestore content update notice:", error);
    return updatedObj;
  }
}
