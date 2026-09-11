// ==============================================================================
// NEXUS AI - Firebase Client SDK Initializer
// ==============================================================================
// Enterprise Security Standard:
// - Initializes the Firebase Web SDK cleanly using environment variables.
// - Safe guards against multiple initializations and SSR environments.
// - Client-facing API key is scoped via Firebase Rules and Google Cloud App Check.
// - Offline persistence enabled: Firestore uses IndexedDB cache when unreachable.
// ==============================================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDA5PLiHaCStntIkaiIsxZI4G2yUxP3DXU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sih-5172e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sih-5172e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sih-5172e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1052052906948",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1052052906948:web:560eb7810a870acba1ba91",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YSHGPKWWMM"
};

// Singleton initialization to prevent multiple instances
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);

// Initialize Firestore with offline persistence (IndexedDB cache).
// When the backend is unreachable, reads serve from local cache instead of
// throwing "client is offline" errors. Mutations are queued and synced when
// connectivity resumes.
let db: Firestore;
try {
  if (getApps().length > 1 || typeof window === "undefined") {
    // SSR or already initialised — use plain getFirestore
    db = getFirestore(app);
  } else {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({ forceOwnership: true }),
      }),
    });
  }
} catch {
  // Already initialised with a different config — fall back gracefully
  db = getFirestore(app);
}

const storage: FirebaseStorage = getStorage(app);

// Analytics runs only on client browser
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics, firebaseConfig };
