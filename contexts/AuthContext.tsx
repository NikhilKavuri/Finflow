"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  auth,
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithGoogle as firebaseSignInWithGoogle,
  signUpWithEmail as firebaseSignUpWithEmail,
  signInWithEmail as firebaseSignInWithEmail,
  changePassword as firebaseChangePassword,
  updateUserProfile as firebaseUpdateUserProfile,
  logOut as firebaseLogOut,
  type User,
} from "@/lib/firebase";

const UID_KEY = "finflow_uid";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authError: null,
  isAuthenticated: false,
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  changePassword: async () => {},
  updateUserProfile: async () => {},
  logOut: async () => {},
  clearError: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function getAuthErrorMessage(error: any): string {
  const code = error?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/popup-blocked":
      return "Pop-up was blocked by the browser. Please allow pop-ups for this site.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/requires-recent-login":
      return "Please sign in again before changing your password.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please contact support.";
    default:
      return error?.message || "An unexpected error occurred. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured()) {
      setAuthError(
        "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* environment variables and redeploy."
      );
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthError(null);
        localStorage.setItem(UID_KEY, firebaseUser.uid);
      } else {
        setUser(null);
        localStorage.removeItem(UID_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await firebaseSignInWithGoogle();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    setAuthError(null);
    try {
      await firebaseSignUpWithEmail(email, password, name);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await firebaseSignInWithEmail(email, password);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setAuthError(null);
    try {
      await firebaseChangePassword(currentPassword, newPassword);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const updateUserProfile = useCallback(async (data: { displayName?: string; photoURL?: string }) => {
    setAuthError(null);
    try {
      await firebaseUpdateUserProfile(data);
      // Force refresh user state
      if (auth?.currentUser) {
        setUser({ ...auth.currentUser } as User);
      }
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const logOut = useCallback(async () => {
    setAuthError(null);
    try {
      await firebaseLogOut();
      localStorage.removeItem(UID_KEY);
      localStorage.removeItem("finflow_state");
      localStorage.removeItem("finflow_migrated");
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: !!user,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        changePassword,
        updateUserProfile,
        logOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
