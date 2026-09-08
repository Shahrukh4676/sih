// ==============================================================================
// NEXUS AI - Firebase Authentication Service Layer
// ==============================================================================
// Secure abstractions for User Sign-up, Sign-in, Sign-out, and Role Verification.
// Note: In Phase 1, these methods connect to Firebase Auth client SDK while
// keeping interfaces ready for Session Cookies & MFA verification.
// ==============================================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "./config";
import { User, UserRole } from "@/types";

export interface AuthSessionState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  role: UserRole;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, pass: string) {
  try {
    const creds = await signInWithEmailAndPassword(auth, email, pass);
    return { user: creds.user, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { user: null, error: err.message };
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, pass: string) {
  try {
    const creds = await createUserWithEmailAndPassword(auth, email, pass);
    // TODO: Create initial user document in Firestore with organizationId and role
    return { user: creds.user, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { user: null, error: err.message };
  }
}

/**
 * Sign in with Google OAuth Provider
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { user: null, error: err.message };
  }
}

/**
 * Sign out current session
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * Listen to auth state transitions
 */
export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
