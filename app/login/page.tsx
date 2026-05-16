"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ensureAnonymousUser,
  getAuthErrorMessage,
  isFirebaseConfigured,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase";
import AppLoading from "@/components/AppLoading";

type AuthMode = "signin" | "signup";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#252533] px-11 py-3 text-sm text-white placeholder:text-[#5a5a6e] focus:border-[#8b6fff]/50 focus:outline-none transition-colors";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (loading) return;
    if (user && !user.isAnonymous) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firebaseReady) return;

    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.replace("/");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!firebaseReady) return;

    setError(null);
    setSubmitting(true);

    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestContinue = async () => {
    if (!firebaseReady) {
      router.replace("/");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await ensureAnonymousUser();
      router.replace("/");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppLoading message="Checking your session…" />;
  }

  if (user && !user.isAnonymous) {
    return <AppLoading message="Taking you to FinFlow…" />;
  }

  return (
    <motion.div
      className="app-screen flex min-h-[100svh] flex-col items-center justify-center bg-bg px-6 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-10 text-center"
      >
        <h1 className="font-syne mb-3 text-5xl font-black gradient-text">FinFlow</h1>
        <p className="text-base text-[#9898aa]">Premium expense tracking for the Hyderabad dev lifestyle</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1e1e28] p-7"
      >
        <div className="mb-6 flex rounded-2xl border border-white/[0.08] bg-[#15151d] p-1">
          {(["signin", "signup"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setError(null);
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                mode === tab
                  ? "bg-[#6c47ff]/20 text-[#8b6fff] shadow-[0_0_16px_rgba(108,71,255,0.12)]"
                  : "text-[#9898aa] hover:text-white"
              }`}
            >
              {tab === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </motion.div>

        <h2 className="font-syne mb-1 text-xl font-bold text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mb-6 text-sm text-[#9898aa]">
          {mode === "signin"
            ? "Sign in to sync expenses across devices."
            : "Start tracking with a secure cloud-backed profile."}
        </p>

        {!firebaseReady && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
            Firebase is not configured. You can still continue locally without cloud sync.
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a6e]" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              disabled={!firebaseReady || submitting}
              className={inputClassName}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a6e]" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              disabled={!firebaseReady || submitting}
              className={`${inputClassName} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a6e] hover:text-[#9898aa]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </motion.div>

          <motion.button
            type="submit"
            disabled={!firebaseReady || submitting}
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -2 }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-syne text-lg font-bold text-white glow-accent transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </motion.button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[#5a5a6e]">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <motion.button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={!firebaseReady || submitting}
          whileTap={{ scale: 0.97 }}
          className="mb-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#252533] py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#EA4335"
              d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.9 3.8 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.5H12z"
            />
            <path
              fill="#34A853"
              d="M4.5 14.5l1-.7-2.3-1.8C2.4 13.9 2 14.9 2 16c0 1.1.4 2.1 1.1 2.9l2.4-1.9-.1-.5z"
            />
            <path
              fill="#4A90E2"
              d="M2 8c0 1.1.4 2.1 1.1 2.9l2.4-1.9C4.4 8.1 4 7.1 4 6c0-1.1.4-2.1 1.1-2.9L2.7 4.2C2.1 5 1.7 6 1.7 7.1 1.7 7.4 1.8 7.7 2 8z"
            />
            <path
              fill="#FBBC05"
              d="M12 21.2c2.6 0 4.8-.9 6.4-2.4l-2.5-2.4c-.7.5-1.7.9-3.9.9-3.1 0-5.6-2.5-5.6-5.6 0-1 .3-2 .8-2.8l-6.3 4.9C4.9 19.4 8.2 21.2 12 21.2z"
            />
          </svg>
          Continue with Google
        </motion.button>

        <motion.button
          type="button"
          onClick={handleGuestContinue}
          disabled={submitting}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#b8ff57]/25 bg-[#b8ff57]/10 py-3.5 text-sm font-semibold text-[#b8ff57] transition-colors hover:border-[#b8ff57]/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles size={16} />
          Continue without account
        </motion.button>

        <p className="mt-6 text-center text-xs leading-relaxed text-[#5a5a6e]">
          By continuing, your data syncs securely when Firebase is configured.
        </p>
      </motion.div>

      <Link
        href="/"
        className="mt-8 text-sm font-semibold text-[#8b6fff] transition-colors hover:text-[#a78fff]"
      >
        ← Back to app
      </Link>
    </motion.div>
  );
}
