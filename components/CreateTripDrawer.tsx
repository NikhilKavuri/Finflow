"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onClose: () => void;
  onSubmit: (
    name: string,
    emoji: string,
    members: { name: string; avatar: string; email?: string }[]
  ) => void | Promise<void>;
  /** Called after successful creation with splitId so parent can show the share modal */
  onCreated?: (splitId: string) => void;
}

const EMOJI_OPTIONS = ["💰", "🍕", "🏠", "🎓", "🤝", "🚗", "🎉", "✈️", "⛺", "🎪", "🛒", "🌴"];
const AVATAR_OPTIONS = ["😎", "🤩", "😊", "🥳", "🧐", "😈", "🦊", "🐻", "🦁", "🐸", "🌸", "⭐"];

type MemberInputMode = "email" | "name";

interface MemberInput {
  name: string;
  avatar: string;
  email: string;
  mode: MemberInputMode;
}

export default function CreateTripDrawer({ onClose, onSubmit, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💰");
  const [members, setMembers] = useState<MemberInput[]>([
    { name: user?.displayName || "You", avatar: "😎", email: user?.email || "", mode: "email" },
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMembers((prev) => {
      const next = [...prev];
      next[0] = {
        ...next[0],
        name: user?.displayName || "You",
        email: user?.email || "",
      };
      return next;
    });
  }, [user?.displayName, user?.email]);

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    const syncViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--visual-viewport-height", `${height}px`);
    };
    syncViewportHeight();
    document.body.style.overflow = "hidden";
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);
    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty("--visual-viewport-height");
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
    };
  }, []);

  const addMember = () => {
    const nextAvatar = AVATAR_OPTIONS[members.length % AVATAR_OPTIONS.length];
    setMembers([...members, { name: "", avatar: nextAvatar, email: "", mode: "email" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1 || index === 0) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof MemberInput, value: string) => {
    if (index === 0 && field !== "avatar") return;
    setMembers(members.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const toggleMemberMode = (index: number) => {
    if (index === 0) return;
    setMembers(members.map((m, i) => {
      if (i !== index) return m;
      const newMode: MemberInputMode = m.mode === "email" ? "name" : "email";
      return { ...m, mode: newMode, name: newMode === "name" ? m.name : "", email: newMode === "email" ? m.email : "" };
    }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Give your split a name");
      return;
    }

    const validMembers = members.filter((m, index) => {
      if (index === 0) return true;
      if (m.mode === "email") return m.email?.trim();
      return m.name?.trim();
    });

    if (validMembers.length < 1) {
      setError("Add at least 1 member");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(
        name.trim(),
        emoji,
        validMembers.map((m, index) => ({
          name: index === 0 ? m.name.trim() || "You" : (m.mode === "name" ? m.name.trim() : ""),
          avatar: m.avatar,
          email: m.mode === "email" ? m.email?.trim() || undefined : undefined,
        }))
      );
    } catch (err) {
      console.error("Failed to create split:", err);
      setError("Failed to create split. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isSubmitting ? undefined : onClose}
      />

      <motion.div
        className="keyboard-panel fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne text-lg font-bold text-white">New Split</h2>
            <motion.button
              whileTap={isSubmitting ? undefined : { scale: 0.88 }}
              onClick={isSubmitting ? undefined : onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa] disabled:opacity-50"
            >
              <X size={16} />
            </motion.button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Split Name
            </label>
            <input
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Roommates, Dinner, Road Trip..."
              value={name}
              disabled={isSubmitting}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((option) => (
                <motion.button
                  key={option}
                  whileTap={isSubmitting ? undefined : { scale: 0.9 }}
                  onClick={isSubmitting ? undefined : () => setEmoji(option)}
                  disabled={isSubmitting}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${
                    emoji === option
                      ? "border-[#6c47ff] bg-[#6c47ff]/15 shadow-[0_0_12px_rgba(108,71,255,0.2)]"
                      : "border-white/[0.06] bg-[#1e1e28] hover:border-white/15"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase">
                Members ({members.length})
              </label>
              <motion.button
                whileTap={isSubmitting ? undefined : { scale: 0.9 }}
                onClick={isSubmitting ? undefined : addMember}
                disabled={isSubmitting}
                className="w-7 h-7 rounded-full bg-[#6c47ff]/20 flex items-center justify-center text-[#8b6fff] disabled:opacity-50"
              >
                <Plus size={14} />
              </motion.button>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {members.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <button
                          className="w-10 h-10 rounded-xl bg-[#252533] border border-white/[0.06] flex items-center justify-center text-lg hover:border-[#6c47ff]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmitting}
                          onClick={() => {
                            const currentIdx = AVATAR_OPTIONS.indexOf(member.avatar);
                            const nextIdx = (currentIdx + 1) % AVATAR_OPTIONS.length;
                            updateMember(index, "avatar", AVATAR_OPTIONS[nextIdx]);
                          }}
                        >
                          {member.avatar}
                        </button>
                      </div>

                      {index === 0 ? (
                        /* Creator row — always shows name, locked */
                        <input
                          className="flex-1 min-w-0 bg-[#1e1e28] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          placeholder="You"
                          type="text"
                          value={member.name}
                          disabled
                        />
                      ) : (
                        <>
                          {/* Mode toggle button */}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => !isSubmitting && toggleMemberMode(index)}
                            disabled={isSubmitting}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border ${
                              member.mode === "email"
                                ? "bg-[#6c47ff]/15 border-[#6c47ff]/30 text-[#8b6fff]"
                                : "bg-[#2ce88a]/15 border-[#2ce88a]/30 text-[#2ce88a]"
                            } disabled:opacity-50`}
                            title={member.mode === "email" ? "Switch to name" : "Switch to email"}
                          >
                            {member.mode === "email" ? <Mail size={14} /> : <User size={14} />}
                          </motion.button>

                          {/* Input field based on mode */}
                          <input
                            className="flex-1 min-w-0 bg-[#1e1e28] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            placeholder={member.mode === "email" ? `Member ${index + 1} email` : `Member ${index + 1} name`}
                            type={member.mode === "email" ? "email" : "text"}
                            value={member.mode === "email" ? member.email : member.name}
                            disabled={isSubmitting}
                            onChange={(e) => {
                              if (member.mode === "email") {
                                updateMember(index, "email", e.target.value);
                              } else {
                                updateMember(index, "name", e.target.value);
                              }
                              setError("");
                            }}
                          />
                        </>
                      )}

                      {members.length > 1 && index > 0 && (
                        <motion.button
                          whileTap={isSubmitting ? undefined : { scale: 0.9 }}
                          onClick={isSubmitting ? undefined : () => removeMember(index)}
                          disabled={isSubmitting}
                          className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </motion.button>
                      )}
                    </div>

                    {/* Mode hint text for non-creator members */}
                    {index > 0 && (
                      <div className="pl-12 text-[10px] text-[#5a5a6e]">
                        {member.mode === "email"
                          ? "Will be linked to their account if registered"
                          : "Add by name — share via invite link later"}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <motion.button
            whileTap={isSubmitting ? undefined : { scale: 0.97 }}
            whileHover={isSubmitting ? undefined : { translateY: -1 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-syne text-base font-bold text-white glow-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Split...
              </>
            ) : (
              "Create Split 💰"
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
