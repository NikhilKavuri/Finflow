"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowLeft, Clock, Users, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSplits } from "@/hooks/useSplits";
import { loadSplitInviteLink, loadSharedSplit } from "@/lib/firestore";
import type { SplitInviteLink, SplitSession } from "@/lib/types";

type InviteState =
  | "loading"
  | "valid"
  | "expired"
  | "not-found"
  | "already-member"
  | "accepted"
  | "declined"
  | "needs-login";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { acceptInviteViaLink, rejectInviteViaLink } = useSplits();

  const token = params.token as string;

  const [inviteState, setInviteState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<SplitInviteLink | null>(null);
  const [split, setSplit] = useState<SplitSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load invite data
  useEffect(() => {
    if (authLoading) return;

    const loadInvite = async () => {
      try {
        const inviteData = await loadSplitInviteLink(token);

        if (!inviteData) {
          setInviteState("not-found");
          return;
        }

        if (inviteData.status === "expired") {
          setInvite(inviteData);
          setInviteState("expired");
          return;
        }

        setInvite(inviteData);

        // If user not logged in, prompt them to login
        if (!user) {
          setInviteState("needs-login");
          return;
        }

        // Load the split to check membership
        const splitData = await loadSharedSplit(inviteData.splitId);
        if (splitData) {
          setSplit(splitData);

          // Check if user is already a member with "accepted" status
          const currentEmail = (user.email || "").trim().toLowerCase();
          const existingMember = splitData.members.find(
            (m) => m.uid === user.uid || (m.email && m.email === currentEmail)
          );

          if (existingMember?.status === "accepted") {
            setInviteState("already-member");
            return;
          }
        }

        setInviteState("valid");
      } catch (error) {
        console.error("Failed to load invite:", error);
        setInviteState("not-found");
      }
    };

    loadInvite();
  }, [token, user, authLoading]);

  const handleAccept = async () => {
    if (!invite || !user) return;

    setIsProcessing(true);
    try {
      await acceptInviteViaLink(token, invite.splitId);
      setInviteState("accepted");
    } catch (error) {
      console.error("Failed to accept invite:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;

    setIsProcessing(true);
    try {
      await rejectInviteViaLink(token, invite.splitId);
      setInviteState("declined");
    } catch (error) {
      console.error("Failed to decline invite:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToLogin = () => {
    router.push(`/login?redirect=/invite/${token}`);
  };

  const handleGoToSplit = () => {
    if (invite) {
      router.push(`/splits/${invite.splitId}`);
    }
  };

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col items-center justify-center min-h-screen px-5 py-8">
      <AnimatePresence mode="wait">
        {/* Loading */}
        {inviteState === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <svg className="animate-spin h-8 w-8 text-[#8b6fff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-[#5a5a6e]">Loading invitation...</span>
          </motion.div>
        )}

        {/* Needs Login */}
        {inviteState === "needs-login" && invite && (
          <motion.div
            key="needs-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#18181f] overflow-hidden">
              {/* Gradient header */}
              <div className="h-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6c47ff]/30 to-[#8b6fff]/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl">{invite.splitEmoji}</span>
                </div>
              </div>

              <div className="px-5 py-5 text-center">
                <h2 className="font-syne text-xl font-bold text-white mb-1">
                  You&apos;re invited!
                </h2>
                <p className="text-sm text-[#9898aa] mb-1">
                  <span className="text-white font-semibold">{invite.creatorName}</span> invited you to
                </p>
                <p className="font-syne text-lg font-bold text-[#8b6fff] mb-4">
                  {invite.splitEmoji} {invite.splitName}
                </p>

                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
                  <div className="flex items-center justify-center gap-2 text-[#5a5a6e]">
                    <LogIn size={14} />
                    <span className="text-xs">Sign in to accept this invitation</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ translateY: -1 }}
                  onClick={handleGoToLogin}
                  className="w-full py-3.5 rounded-xl font-syne text-sm font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6fff] shadow-[0_0_20px_rgba(108,71,255,0.2)] mb-3"
                >
                  Sign In to Join
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/")}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-[#5a5a6e] hover:text-white transition-colors"
                >
                  Go Home
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Valid Invite */}
        {inviteState === "valid" && invite && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#18181f] overflow-hidden">
              {/* Gradient header */}
              <div className="h-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6c47ff]/30 to-[#8b6fff]/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl">{invite.splitEmoji}</span>
                </div>
              </div>

              <div className="px-5 py-5 text-center">
                <h2 className="font-syne text-xl font-bold text-white mb-1">
                  You&apos;re invited!
                </h2>
                <p className="text-sm text-[#9898aa] mb-1">
                  <span className="text-white font-semibold">{invite.creatorName}</span> invited you to
                </p>
                <p className="font-syne text-lg font-bold text-[#8b6fff] mb-2">
                  {invite.splitEmoji} {invite.splitName}
                </p>

                {split && (
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    <Users size={12} className="text-[#5a5a6e]" />
                    <span className="text-[11px] text-[#5a5a6e]">
                      {split.members.length} member{split.members.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Expiry notice */}
                <div className="flex items-center justify-center gap-1.5 mb-5">
                  <Clock size={11} className="text-[#5a5a6e]" />
                  <span className="text-[10px] text-[#5a5a6e]">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDecline}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    Decline
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6fff] shadow-[0_0_20px_rgba(108,71,255,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Check size={16} />
                    )}
                    {isProcessing ? "Joining..." : "Accept"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Accepted */}
        {inviteState === "accepted" && invite && (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-[#2ce88a]/20 bg-[#18181f] overflow-hidden">
              <div className="px-5 py-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-[#2ce88a]/15 border border-[#2ce88a]/30 flex items-center justify-center mx-auto mb-4"
                >
                  <Check size={28} className="text-[#2ce88a]" />
                </motion.div>
                <h2 className="font-syne text-xl font-bold text-white mb-2">
                  You&apos;re in! 🎉
                </h2>
                <p className="text-sm text-[#9898aa] mb-6">
                  You&apos;ve joined <span className="text-white font-semibold">{invite.splitEmoji} {invite.splitName}</span>
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoToSplit}
                  className="w-full py-3.5 rounded-xl font-syne text-sm font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6fff] shadow-[0_0_20px_rgba(108,71,255,0.2)]"
                >
                  Go to Split →
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Declined */}
        {inviteState === "declined" && invite && (
          <motion.div
            key="declined"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#18181f] overflow-hidden">
              <div className="px-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <X size={28} className="text-[#5a5a6e]" />
                </div>
                <h2 className="font-syne text-lg font-bold text-white mb-2">
                  Invitation Declined
                </h2>
                <p className="text-sm text-[#5a5a6e] mb-1">
                  You can still join later using the same link
                </p>
                <p className="text-xs text-[#5a5a6e] mb-6">
                  (before it expires on {new Date(invite.expiresAt).toLocaleDateString()})
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/splits")}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-colors"
                >
                  Go to Splits
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Already Member */}
        {inviteState === "already-member" && invite && (
          <motion.div
            key="already-member"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-[#8b6fff]/20 bg-[#18181f] overflow-hidden">
              <div className="px-5 py-8 text-center">
                <div className="text-4xl mb-4">{invite.splitEmoji}</div>
                <h2 className="font-syne text-lg font-bold text-white mb-2">
                  You&apos;re already in this split!
                </h2>
                <p className="text-sm text-[#5a5a6e] mb-6">
                  You&apos;re a member of <span className="text-white font-semibold">{invite.splitName}</span>
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoToSplit}
                  className="w-full py-3.5 rounded-xl font-syne text-sm font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6fff] shadow-[0_0_20px_rgba(108,71,255,0.2)]"
                >
                  Go to Split →
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Expired */}
        {inviteState === "expired" && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#18181f] overflow-hidden">
              <div className="px-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#ff4f6b]/10 flex items-center justify-center mx-auto mb-4">
                  <Clock size={28} className="text-[#ff4f6b]" />
                </div>
                <h2 className="font-syne text-lg font-bold text-white mb-2">
                  Invite Expired
                </h2>
                <p className="text-sm text-[#5a5a6e] mb-6">
                  This invitation link has expired. Ask the split creator to send you a new one.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/")}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-colors"
                >
                  Go Home
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Not Found */}
        {inviteState === "not-found" && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#18181f] overflow-hidden">
              <div className="px-5 py-8 text-center">
                <div className="text-4xl mb-4">🤔</div>
                <h2 className="font-syne text-lg font-bold text-white mb-2">
                  Invalid Link
                </h2>
                <p className="text-sm text-[#5a5a6e] mb-6">
                  This invitation link is invalid or no longer exists.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/")}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-colors"
                >
                  Go Home
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
