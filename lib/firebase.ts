import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
  signOut as firebaseSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
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

// ── Google Sign-In ──────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error("Firebase is not configured.");
  await ensureAuthPersistence();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// ── Email/Password Sign Up ──────────────────────────────────
export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
  if (!auth) throw new Error("Firebase is not configured.");
  await ensureAuthPersistence();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await firebaseUpdateProfile(result.user, { displayName });
  return result.user;
}

// ── Email/Password Sign In ──────────────────────────────────
export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error("Firebase is not configured.");
  await ensureAuthPersistence();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// ── Change Password ─────────────────────────────────────────
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (!auth || !auth.currentUser || !auth.currentUser.email) {
    throw new Error("No authenticated user found.");
  }
  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await firebaseUpdatePassword(auth.currentUser, newPassword);
}

// ── Update Profile ──────────────────────────────────────────
export async function updateUserProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
  if (!auth || !auth.currentUser) throw new Error("No authenticated user found.");
  await firebaseUpdateProfile(auth.currentUser, data);
}

// ── Sign Out ────────────────────────────────────────────────
export async function logOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export { db, auth, isFirebaseConfigured, onAuthStateChanged };
export type { User };
