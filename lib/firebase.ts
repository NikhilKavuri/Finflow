import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
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

async function requireAuth() {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* environment variables in Vercel and redeploy.",
    );
  }
  await ensureAuthPersistence();
  return auth;
}

export async function ensureAnonymousUser(): Promise<User> {
  const firebaseAuth = await requireAuth();
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;

  const result = await signInAnonymously(firebaseAuth);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const firebaseAuth = await requireAuth();
  if (firebaseAuth.currentUser?.isAnonymous) {
    await signOut(firebaseAuth);
  }
  const result = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const firebaseAuth = await requireAuth();
  if (firebaseAuth.currentUser?.isAnonymous) {
    await signOut(firebaseAuth);
  }
  const result = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  const firebaseAuth = await requireAuth();
  if (firebaseAuth.currentUser?.isAnonymous) {
    await signOut(firebaseAuth);
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(firebaseAuth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  const firebaseAuth = await requireAuth();
  await signOut(firebaseAuth);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase. Enable it in the Firebase Console.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return (error as Error)?.message || "Authentication failed. Please try again.";
  }
}
