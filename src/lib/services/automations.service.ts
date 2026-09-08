// ==============================================================================
// NEXUS AI - Automations Service
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { Automation } from "@/types";

export const AUTOMATIONS_COLLECTION = "automations";

export async function getAutomationsByOrg(organizationId: string): Promise<Automation[]> {
  try {
    const q = query(
      collection(db, AUTOMATIONS_COLLECTION),
      where("organizationId", "==", organizationId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Automation));
  } catch (error) {
    console.error("[Automations Service] Error fetching automations:", error);
    return [];
  }
}

export async function toggleAutomationEnabled(automationId: string, enabled: boolean): Promise<boolean> {
  try {
    const ref = doc(db, AUTOMATIONS_COLLECTION, automationId);
    await updateDoc(ref, {
      enabled,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("[Automations Service] Error toggling automation:", error);
    return false;
  }
}

export async function createAutomationRule(
  automationData: Omit<Automation, "id" | "createdAt" | "updatedAt">
): Promise<Automation | null> {
  try {
    const id = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ref = doc(db, AUTOMATIONS_COLLECTION, id);
    const nowIso = new Date().toISOString();

    const payload = {
      ...automationData,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, payload);

    return {
      ...automationData,
      id,
      createdAt: nowIso,
      updatedAt: nowIso
    };
  } catch (error) {
    console.error("[Automations Service] Error creating automation:", error);
    return null;
  }
}
