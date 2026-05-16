"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  auth,
  ensureAnonymousUser,
  isFirebaseConfigured,
  onAuthStateChanged,
  type User,
} from "@/lib/firebase";

const UID_KEY = "finflow_uid";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authError: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

function getAuthErrorMessage(error: any) {
  const code = error?.code;

  if (code === "auth/operation-not-allowed") {
    return "Anonymous sign-in is not enabled for this Firebase project.";
  }

  if (code === "auth/network-request-failed") {
    return "Firebase could not finish anonymous sign-in because the network request failed.";
  }

  return error?.message || "Anonymous sign-in could not be completed.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured()) {
      setAuthError(
        "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* environment variables in Vercel and redeploy."
      );
      setLoading(false);
      return;
    }

    let active = true;
    let startingAnonymousUser = false;

    const saveUser = (firebaseUser: User) => {
      setAuthError(null);
      setUser(firebaseUser);
      localStorage.setItem(UID_KEY, firebaseUser.uid);
      setLoading(false);
    };

    const startAnonymousSession = async () => {
      if (startingAnonymousUser) return;
      startingAnonymousUser = true;

      try {
        const anonymousUser = await ensureAnonymousUser();
        if (active) {
          saveUser(anonymousUser);
        }
      } catch (error) {
        console.warn("Anonymous sign-in failed:", error);
        if (active) {
          localStorage.removeItem(UID_KEY);
          setUser(null);
          setAuthError(getAuthErrorMessage(error));
          setLoading(false);
        }
      } finally {
        startingAnonymousUser = false;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!active) return;

      if (firebaseUser) {
        saveUser(firebaseUser);
      } else {
        startAnonymousSession();
      }
    });

    startAnonymousSession();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}
