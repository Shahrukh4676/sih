// ==============================================================================
// NEXUS AI - Users Service (Phase 2)
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { User } from "@/types";

export const USERS_COLLECTION = "users";

/**
 * Retrieve user profile from Firestore by UID
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        uid: snap.id,
        email: data.email || "",
        displayName: data.displayName || "",
        photoURL: data.photoURL || undefined,
        organizationId: data.organizationId || null,
        role: data.role || "VIEWER",
        status: data.status || "ACTIVE",
        mfaEnabled: data.mfaEnabled ?? false,
        activeSessionsCount: data.activeSessionsCount ?? 1,
        lastLoginAt: data.lastLoginAt ? (data.lastLoginAt.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt) : new Date().toISOString(),
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : new Date().toISOString()
      };
    }
    return null;
  } catch (error) {
    console.error("[Users Service] Error fetching profile:", error);
    return null;
  }
}

/**
 * Initialize user document on signup
 */
export async function createUserProfile(user: {
  uid: string;
  email: string;
  displayName: string;
  organizationId?: string | null;
  role?: User["role"];
}): Promise<User | null> {
  try {
    const ref = doc(db, USERS_COLLECTION, user.uid);
    const nowIso = new Date().toISOString();
    const payload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      organizationId: user.organizationId || null,
      role: user.role || "ADMIN",
      status: "ACTIVE",
      mfaEnabled: false,
      activeSessionsCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, payload, { merge: true });

    return {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      organizationId: user.organizationId || null,
      role: user.role || "ADMIN",
      status: "ACTIVE",
      mfaEnabled: false,
      activeSessionsCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso
    };
  } catch (error) {
    console.error("[Users Service] Error creating profile:", error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid: string, data: Partial<User>): Promise<boolean> {
  try {
    const ref = doc(db, USERS_COLLECTION, uid);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("[Users Service] Error updating profile:", error);
    return false;
  }
}

/**
 * Fetch all users in an organization
 */
export async function getOrganizationUsers(organizationId: string): Promise<User[]> {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("organizationId", "==", organizationId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        uid: docSnap.id,
        email: data.email || "",
        displayName: data.displayName || "",
        organizationId: data.organizationId || null,
        role: data.role || "VIEWER",
        status: data.status || "ACTIVE",
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : "",
        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : ""
      };
    });
  } catch (error) {
    console.error("[Users Service] Error fetching organization users:", error);
    return [];
  }
}
