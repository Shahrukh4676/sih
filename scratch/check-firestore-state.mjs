import { doc, getDoc, getDocs, collection, query, limit } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDA5PLiHaCStntIkaiIsxZI4G2yUxP3DXU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sih-5172e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sih-5172e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sih-5172e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1052052906948",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1052052906948:web:560eb7810a870acba1ba91",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YSHGPKWWMM"
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log("Checking Firestore collections in project:", firebaseConfig.projectId);

  // 1. Check organizations
  try {
    const orgSnap = await getDoc(doc(db, "organizations", "org_primary"));
    console.log("org_primary exists:", orgSnap.exists());
    if (orgSnap.exists()) {
      console.log("org_primary data:", orgSnap.data());
    } else {
      console.log("WARNING: org_primary does NOT exist in Firestore!");
    }
  } catch (err) {
    console.error("Error reading org_primary:", err.message);
  }

  // 2. Query any organizations
  try {
    const orgsQuery = query(collection(db, "organizations"), limit(5));
    const orgsSnap = await getDocs(orgsQuery);
    console.log("Total organizations found in sample:", orgsSnap.size);
    orgsSnap.forEach(d => console.log("  Org ID:", d.id, d.data().name));
  } catch (err) {
    console.error("Error listing organizations:", err.message);
  }

  // 3. Query sample users
  try {
    const usersQuery = query(collection(db, "users"), limit(5));
    const usersSnap = await getDocs(usersQuery);
    console.log("Total users found in sample:", usersSnap.size);
    usersSnap.forEach(d => console.log("  User ID:", d.id, d.data().email, "org:", d.data().organizationId));
  } catch (err) {
    console.error("Error listing users:", err.message);
  }

  process.exit(0);
}

check().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
