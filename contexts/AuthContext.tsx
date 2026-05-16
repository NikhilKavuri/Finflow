"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  auth,
  ensureAnonymousUser,
  getAuthErrorMessage,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isLoginRoute = pathname === "/login";

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

    const authTimeout = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 8000);

    const saveUser = (firebaseUser: User) => {
      setAuthError(null);
      setUser(firebaseUser);
      localStorage.setItem(UID_KEY, firebaseUser.uid);
      setLoading(false);
    };

    const startAnonymousSession = async () => {
      if (isLoginRoute || startingAnonymousUser) return;
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
      } else if (!isLoginRoute) {
        startAnonymousSession();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    if (!isLoginRoute) {
      startAnonymousSession();
    } else if (auth.currentUser) {
      saveUser(auth.currentUser);
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
      window.clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [isLoginRoute]);

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}
