"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  auth,
  completeGoogleRedirectSignIn,
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithGoogle as firebaseSignIn,
  signOut as firebaseSignOut,
  type User,
} from "@/lib/firebase";

const UID_KEY = "finflow_uid";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  signIn: async () => null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function getAuthErrorMessage(error: any) {
  const code = error?.code;

  if (code === "auth/unauthorized-domain") {
    return "This deployed domain is not authorized in Firebase Authentication.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Google sign-in is not enabled for this Firebase project.";
  }

  if (code === "auth/network-request-failed") {
    return "Firebase could not finish sign-in because the network request failed.";
  }

  return error?.message || "Google sign-in could not be completed. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth || !isFirebaseConfigured()) {
      setAuthError(
        "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* environment variables in Vercel and redeploy."
      );
      setLoading(false);
      return;
    }

    let active = true;

    completeGoogleRedirectSignIn()
      .then((redirectUser) => {
        if (active && redirectUser) {
          setAuthError(null);
          setUser(redirectUser);
          localStorage.setItem(UID_KEY, redirectUser.uid);
        }
      })
      .catch((error) => {
        console.warn("Google redirect sign-in failed:", error);
        if (active) {
          setAuthError(getAuthErrorMessage(error));
          setLoading(false);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthError(null);
        localStorage.setItem(UID_KEY, firebaseUser.uid);
      } else {
        localStorage.removeItem(UID_KEY);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    setAuthError(null);
    const result = await firebaseSignIn();
    // If sign-in successful and there's existing localStorage data,
    // it will be auto-synced on next useExpenses hydration
    if (result) {
      localStorage.setItem(UID_KEY, result.uid);
    }
    return result;
  };

  const signOut = async () => {
    setAuthError(null);
    await firebaseSignOut();
    localStorage.removeItem(UID_KEY);
    // Don't clear localStorage expense data — keep it for offline access
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
