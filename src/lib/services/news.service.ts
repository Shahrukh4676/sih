// ==============================================================================
// NEXUS AI - News Service
// ==============================================================================

import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { NewsItem } from "@/types";
import { MOCK_NEWS_ITEMS } from "../mock-data";

export const NEWS_COLLECTION = "newsItems";

export async function getNewsFeed(limitCount: number = 20): Promise<NewsItem[]> {
  try {
    const q = query(
      collection(db, NEWS_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem));
    }
    // Fallback to initial intelligence feed
    return MOCK_NEWS_ITEMS;
  } catch (error) {
    console.warn("[News Service] Firestore empty or notice, falling back to intelligence cache:", error);
    return MOCK_NEWS_ITEMS;
  }
}

export async function seedInitialNews(items: NewsItem[]): Promise<void> {
  try {
    for (const item of items) {
      const ref = doc(db, NEWS_COLLECTION, item.id);
      await setDoc(ref, item, { merge: true });
    }
  } catch (error) {
    console.error("[News Service] Error seeding news:", error);
  }
}
