import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

function getAuthDomain() {
  if (typeof window === "undefined") {
    return firebaseAuthDomain;
  }

  const { host, hostname } = window.location;
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0";

  return isLocalhost ? firebaseAuthDomain : host;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID_HERE"
  );
};

// Initialize Firebase only if configured
const app = isFirebaseConfigured()
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
let persistencePromise: Promise<void> | null = null;

function ensureAuthPersistence() {
  if (!auth) return Promise.resolve();

  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch((error) => {
      persistencePromise = null;
      throw error;
    });
  }

  return persistencePromise;
}

export { db, auth, isFirebaseConfigured, onAuthStateChanged };
export type { User };

// Google Sign-In with fallback to redirect
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* environment variables in Vercel and redeploy.",
    );
  }

  // On non-localhost, redirect is more reliable than popup
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  try {
    await ensureAuthPersistence();

    if (isLocalhost) {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } else {
      await signInWithRedirect(auth, googleProvider);
      return null; // will complete via completeGoogleRedirectSignIn
    }
  } catch (error: any) {
    if (
      error?.code === "auth/popup-blocked" ||
      error?.code === "auth/cancelled-popup-request"
    ) {
      await ensureAuthPersistence();
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    if (error?.code === "auth/popup-closed-by-user") {
      return null;
    }
    throw error;
  }
}

export async function completeGoogleRedirectSignIn(): Promise<User | null> {
  if (!auth) return null;

  await ensureAuthPersistence();
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.warn("Sign-out failed:", error);
  }
}
