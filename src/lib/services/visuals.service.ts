// ==============================================================================
// NEXUS AI - Visual Assets Service (Phase 4)
// ==============================================================================
// Manages Firestore metadata for visual assets.
// Supports multi-version regeneration (V1, V2, V3) without overwriting.
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { VisualAsset, VisualAssetStatus } from "@/types";
import { cleanForFirestore } from "../firebase/firestore-utils";

export const VISUAL_ASSETS_COLLECTION = "visualAssets";

const inMemoryVisualAssetsCache = new Map<string, VisualAsset>();

export class VisualsService {
  /**
   * Persists a newly generated visual asset
   */
  public static async createVisualAsset(
    assetData: Omit<VisualAsset, "id" | "createdAt" | "updatedAt">
  ): Promise<VisualAsset | null> {
    const id = assetData.assetId || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const assetObj: VisualAsset = {
      ...assetData,
      id,
      assetId: id,
      version: assetData.version || 1,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    inMemoryVisualAssetsCache.set(id, assetObj);

    try {
      const ref = doc(db, VISUAL_ASSETS_COLLECTION, id);
      const payload = cleanForFirestore({
        ...assetData,
        id,
        assetId: id,
        version: assetData.version || 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(ref, payload);
      return assetObj;
    } catch (error) {
      console.warn("[Visuals Service] Firestore write notice (cached in memory):", error);
      return assetObj;
    }
  }

  /**
   * Retrieves a visual asset by ID
   */
  public static async getVisualAssetById(assetId: string): Promise<VisualAsset | null> {
    if (inMemoryVisualAssetsCache.has(assetId)) {
      return inMemoryVisualAssetsCache.get(assetId)!;
    }

    try {
      const ref = doc(db, VISUAL_ASSETS_COLLECTION, assetId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const item = { id: snap.id, assetId: snap.id, ...snap.data() } as VisualAsset;
        inMemoryVisualAssetsCache.set(assetId, item);
        return item;
      }
      return null;
    } catch (error) {
      console.warn("[Visuals Service] Error fetching visual asset by id:", error);
      return inMemoryVisualAssetsCache.get(assetId) || null;
    }
  }

  /**
   * Retrieves all visual versions associated with a content ID
   */
  public static async getVisualsByContentId(contentId: string): Promise<VisualAsset[]> {
    try {
      const q = query(
        collection(db, VISUAL_ASSETS_COLLECTION),
        where("contentId", "==", contentId),
        orderBy("version", "desc")
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, assetId: d.id, ...d.data() } as VisualAsset));
      if (results.length > 0) return results;
    } catch (error) {
      console.warn("[Visuals Service] Firestore query notice for content visuals:", error);
    }

    // Return from memory cache filtered by contentId, sorted by version desc
    return Array.from(inMemoryVisualAssetsCache.values())
      .filter((a) => a.contentId === contentId)
      .sort((a, b) => (b.version || 1) - (a.version || 1));
  }

  /**
   * Updates status of a visual asset
   */
  public static async updateStatus(
    assetId: string,
    status: VisualAssetStatus,
    errorMessage?: string
  ): Promise<boolean> {
    const existing = inMemoryVisualAssetsCache.get(assetId);
    if (existing) {
      existing.status = status;
      if (errorMessage) existing.errorMessage = errorMessage;
      existing.updatedAt = new Date().toISOString();
    }

    try {
      const ref = doc(db, VISUAL_ASSETS_COLLECTION, assetId);
      await updateDoc(ref, cleanForFirestore({
        status,
        errorMessage,
        updatedAt: serverTimestamp()
      }));
      return true;
    } catch (error) {
      console.warn("[Visuals Service] Firestore update notice:", error);
      return true;
    }
  }

  /**
   * Retrieves all visual assets for an organization
   */
  public static async getVisualsByOrg(organizationId: string): Promise<VisualAsset[]> {
    try {
      const q = query(
        collection(db, VISUAL_ASSETS_COLLECTION),
        where("organizationId", "==", organizationId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, assetId: d.id, ...d.data() } as VisualAsset));
      if (results.length > 0) return results;
    } catch (error) {
      console.warn("[Visuals Service] Firestore query notice for org visuals:", error);
    }

    return Array.from(inMemoryVisualAssetsCache.values()).filter(
      (a) => a.organizationId === organizationId
    );
  }
}
