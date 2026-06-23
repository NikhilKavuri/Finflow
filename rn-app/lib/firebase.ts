import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
  signOut as firebaseSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithCredential,
  type User,
} from "firebase/auth";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// Complete the auth session on app return
WebBrowser.maybeCompleteAuthSession();

const readEnv = (expoKey: string, nextKey: string) =>
  process.env[expoKey] || process.env[nextKey] || "";

const firebaseConfig = {
  apiKey: readEnv("EXPO_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: readEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("EXPO_PUBLIC_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"),
};

const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID_HERE"
  );
};

if (!isFirebaseConfigured()) {
  throw new Error("Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to rn-app/.env.local.");
}

const appsExist = getApps().length > 0;
const app = appsExist ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = appsExist
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });

// Google Sign-In using expo-auth-session
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

const discovery = AuthSession.useAutoDiscovery
  ? undefined
  : {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    };

export async function signInWithGoogle(): Promise<User> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file."
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "finflow" });

  const authRequest = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: false,
  });

  const result = await authRequest.promptAsync({
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  });

  if (result.type === "success") {
    const { id_token } = result.params;
    const credential = GoogleAuthProvider.credential(id_token);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } else if (result.type === "cancel" || result.type === "dismiss") {
    throw new Error("Google Sign-In was cancelled.");
  } else {
    throw new Error("Google Sign-In failed. Please try again.");
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await firebaseUpdateProfile(result.user, { displayName });
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (!auth.currentUser?.email) {
    throw new Error("No authenticated user found.");
  }

  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await firebaseUpdatePassword(auth.currentUser, newPassword);
}

export async function updateUserProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
  if (!auth.currentUser) throw new Error("No authenticated user found.");
  await firebaseUpdateProfile(auth.currentUser, data);
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export { db, auth, isFirebaseConfigured, onAuthStateChanged };
export type { User };
