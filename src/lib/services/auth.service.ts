// ==============================================================================
// NEXUS AI - Authentication Service (Phase 2 Production Foundation)
// ==============================================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase/config";

export interface AuthResult {
  user: FirebaseUser | null;
  error: string | null;
}

/**
 * Sign up with email & password and set displayName
 */
export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<AuthResult> {
  try {
    const creds = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && creds.user) {
      await updateProfile(creds.user, { displayName });
    }
    return { user: creds.user, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return { user: null, error: mapAuthError(err.code, err.message) };
  }
}

/**
 * Sign in with email & password
 */
export async function signInWithEmail(email: string, pass: string): Promise<AuthResult> {
  try {
    const creds = await signInWithEmailAndPassword(auth, email, pass);
    return { user: creds.user, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return { user: null, error: mapAuthError(err.code, err.message) };
  }
}

/**
 * Google OAuth sign in
 */
export async function signInWithGoogleOAuth(): Promise<AuthResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return { user: null, error: mapAuthError(err.code, err.message) };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return { success: false, error: mapAuthError(err.code, err.message) };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<{ success: boolean; error: string | null }> {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * Listen to auth state transitions
 */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
function mapAuthError(code?: string, fallbackMsg?: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in.";
    case "auth/invalid-email":
      return "The email address format is invalid.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials.";
    case "auth/weak-password":
      return "Password should be at least 6 characters with letters and numbers.";
    case "auth/too-many-requests":
      return "Access temporarily blocked due to multiple failed attempts. Reset your password or try again later.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    default:
      return fallbackMsg || "Authentication failed. Please try again.";
  }
}
