// Note: This file is for CLIENT-SIDE Firebase initialization only.
// Do not import this file in server components or API routes.
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let isInitialized = false;

export async function initFirebase() {
  if (isInitialized) {
    return { app: appInstance, auth: authInstance, db: dbInstance };
  }

  if (typeof window === "undefined" || !firebaseConfig.projectId) {
    console.warn("Firebase config is missing or running on server. Services will not be initialized.");
    isInitialized = true;
    return { app: null, auth: null, db: null };
  }

  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");
    
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    
    // Lazy load firestore
    const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } = await import("firebase/firestore");
    
    // Suppress noisy offline errors that trigger Next.js error overlay
    setLogLevel("silent");
    
    try {
      dbInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      // If already initialized
      const { getFirestore } = await import("firebase/firestore");
      dbInstance = getFirestore(appInstance);
    }

    isInitialized = true;
    return { app: appInstance, auth: authInstance, db: dbInstance };
  } catch (error) {
    console.error("Failed to initialize Firebase", error);
    isInitialized = true;
    return { app: null, auth: null, db: null };
  }
}
