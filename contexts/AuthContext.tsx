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
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        localStorage.setItem(UID_KEY, firebaseUser.uid);
      } else {
        localStorage.removeItem(UID_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const result = await firebaseSignIn();
    // If sign-in successful and there's existing localStorage data,
    // it will be auto-synced on next useExpenses hydration
    if (result) {
      localStorage.setItem(UID_KEY, result.uid);
    }
  };

  const signOut = async () => {
    await firebaseSignOut();
    localStorage.removeItem(UID_KEY);
    // Don't clear localStorage expense data — keep it for offline access
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
