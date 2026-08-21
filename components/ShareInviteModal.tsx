"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Link2, Clock, Share2 } from "lucide-react";
import { createSplitInviteLink } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  splitId: string;
  splitName: string;
  splitEmoji: string;
  onClose: () => void;
}

export default function ShareInviteModal({ splitId, splitName, splitEmoji, onClose }: Props) {
  const { user } = useAuth();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const generateLink = async () => {
      if (!user?.uid) {
        setError("You must be logged in to generate an invite link.");
        setIsGenerating(false);
        return;
      }

      try {
        const token = await createSplitInviteLink(
          splitId,
          user.uid,
          user.displayName || "Someone",
          splitName,
          splitEmoji
        );

        if (token) {
          const baseUrl = window.location.origin;
          setInviteLink(`${baseUrl}/invite/${token}`);
        } else {
          setError("Failed to generate invite link. Please try again.");
        }
      } catch (err) {
        console.error("Failed to create invite link:", err);
        setError("Failed to generate invite link.");
      } finally {
        setIsGenerating(false);
      }
    };

    generateLink();
  }, [splitId, splitName, splitEmoji, user]);

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/60"
        style={{ backdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="w-full max-w-[400px] rounded-2xl border border-white/[0.08] bg-[#18181f] overflow-hidden"
        >
          {/* Header */}
          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#6c47ff]/15 border border-[#6c47ff]/20 flex items-center justify-center">
                  <Share2 size={18} className="text-[#8b6fff]" />
                </div>
                <div>
                  <h3 className="font-syne text-base font-bold text-white">Share Split</h3>
                  <p className="text-[11px] text-[#5a5a6e]">Invite others to join</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa] hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Split info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-2xl">{splitEmoji}</span>
              <div>
                <div className="text-sm font-bold text-white">{splitName}</div>
                <div className="text-[10px] text-[#5a5a6e]">Anyone with the link can join this split</div>
              </div>
            </div>
          </div>

          {/* Link section */}
          <div className="px-5 pb-5">
            {isGenerating ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <svg className="animate-spin h-5 w-5 text-[#8b6fff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-[#5a5a6e]">Generating invite link...</span>
              </div>
            ) : error ? (
              <div className="py-4 px-3 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b] text-center">
                {error}
              </div>
            ) : (
              <>
                {/* Link display */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#1e1e28] border border-white/10 rounded-xl px-3 py-2.5">
                    <Link2 size={14} className="text-[#5a5a6e] flex-shrink-0" />
                    <span className="text-xs text-[#9898aa] truncate">{inviteLink}</span>
                  </div>
                </div>

                {/* Copy button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ translateY: -1 }}
                  onClick={handleCopy}
                  className={`w-full py-3.5 rounded-xl font-syne text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
                    copied
                      ? "bg-[#2ce88a] shadow-[0_0_20px_rgba(44,232,138,0.25)]"
                      : "bg-gradient-to-r from-[#6c47ff] to-[#8b6fff] shadow-[0_0_20px_rgba(108,71,255,0.2)]"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="copied"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={16} />
                        Copied!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Copy Invite Link
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Expiry notice */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Clock size={11} className="text-[#5a5a6e]" />
                  <span className="text-[10px] text-[#5a5a6e]">
                    Link expires in 7 days
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
