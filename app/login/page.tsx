"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { user, loading, authError, signInWithGoogle, signUpWithEmail, signInWithEmail, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo || "/");
    }
  }, [user, loading, router, redirectTo]);

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setLocalError("");
    clearError();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email.trim()) { setLocalError("Email is required."); return; }
    if (!password.trim()) { setLocalError("Password is required."); return; }
    if (mode === "signup" && !name.trim()) { setLocalError("Name is required."); return; }
    if (password.length < 6) { setLocalError("Password must be at least 6 characters."); return; }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch {
      // Error is set in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLocalError("");
    clearError();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error is set in context
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || authError;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#8b6fff]"
        />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(108,71,255,0.12), transparent 70%)" }} />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(184,255,87,0.06), transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="font-syne text-4xl font-black gradient-text mb-2">FinFlow</h1>
            <p className="text-sm text-[#5a5a6e]">Smart expense tracking, simplified.</p>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="rounded-3xl border border-white/[0.08] bg-[#14141b]/80 backdrop-blur-xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        >
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-[#0f0f16] border border-white/[0.06] mb-6">
            {(["signin", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { if (!submitting) switchMode(); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  mode === m
                    ? "bg-[#6c47ff]/20 text-[#8b6fff] shadow-[0_0_12px_rgba(108,71,255,0.15)]"
                    : "text-[#5a5a6e] hover:text-[#9898aa]"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {displayError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 px-3 py-2.5 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b] overflow-hidden"
              >
                {displayError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {/* Name (signup only) */}
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a6e]" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                      className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]/50 transition-colors disabled:opacity-50"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a6e]" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]/50 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a6e]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]/50 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a5a6e] hover:text-[#9898aa] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={submitting ? undefined : { scale: 0.98 }}
              whileHover={submitting ? undefined : { translateY: -1 }}
              className="w-full py-3.5 rounded-xl font-syne text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google Sign-In */}
          <motion.button
            type="button"
            onClick={handleGoogleAuth}
            disabled={submitting}
            whileTap={submitting ? undefined : { scale: 0.98 }}
            className="w-full py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </motion.button>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#5a5a6e] mt-6">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={switchMode} className="text-[#8b6fff] font-semibold hover:underline">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
