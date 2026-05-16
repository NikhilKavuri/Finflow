"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onSubmit: (name: string, emoji: string, members: { name: string; avatar: string }[]) => void;
}

const EMOJI_OPTIONS = ["✈️", "🏖️", "🏔️", "🚗", "🎉", "🏠", "🎓", "🍕", "⛺", "🎪", "🚀", "🌴"];
const AVATAR_OPTIONS = ["😎", "🤩", "😊", "🥳", "🧐", "😈", "🦊", "🐻", "🦁", "🐸", "🌸", "⭐"];

export default function CreateTripDrawer({ onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✈️");
  const [members, setMembers] = useState<{ name: string; avatar: string }[]>([
    { name: "", avatar: "😎" },
    { name: "", avatar: "🤩" },
  ]);
  const [error, setError] = useState("");

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
    setMembers([...members, { name: "", avatar: nextAvatar }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: "name" | "avatar", value: string) => {
    setMembers(members.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Give your trip a name");
      return;
    }
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length < 2) {
      setError("Add at least 2 members");
      return;
    }
    onSubmit(
      name.trim(),
      emoji,
      validMembers.map((m) => ({ name: m.name.trim(), avatar: m.avatar }))
    );
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="keyboard-panel fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne text-lg font-bold text-white">New Trip</h2>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa]"
            >
              <X size={16} />
            </motion.button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          {/* Trip Name */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Trip Name
            </label>
            <input
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
              placeholder="e.g. Goa Trip, Weekend Getaway..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>

          {/* Trip Emoji */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Trip Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((e) => (
                <motion.button
                  key={e}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${
                    emoji === e
                      ? "border-[#6c47ff] bg-[#6c47ff]/15 shadow-[0_0_12px_rgba(108,71,255,0.2)]"
                      : "border-white/[0.06] bg-[#1e1e28] hover:border-white/15"
                  }`}
                >
                  {e}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Members */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase">
                Members ({members.length})
              </label>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={addMember}
                className="w-7 h-7 rounded-full bg-[#6c47ff]/20 flex items-center justify-center text-[#8b6fff]"
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
                    className="flex items-center gap-2"
                  >
                    {/* Avatar picker */}
                    <div className="relative group">
                      <button
                        className="w-10 h-10 rounded-xl bg-[#252533] border border-white/[0.06] flex items-center justify-center text-lg hover:border-[#6c47ff]/40 transition-colors"
                        onClick={() => {
                          const currentIdx = AVATAR_OPTIONS.indexOf(member.avatar);
                          const nextIdx = (currentIdx + 1) % AVATAR_OPTIONS.length;
                          updateMember(index, "avatar", AVATAR_OPTIONS[nextIdx]);
                        }}
                      >
                        {member.avatar}
                      </button>
                    </div>

                    <input
                      className="flex-1 bg-[#1e1e28] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
                      placeholder={`Member ${index + 1} name`}
                      value={member.name}
                      onChange={(e) => {
                        updateMember(index, "name", e.target.value);
                        setError("");
                      }}
                    />

                    {members.length > 2 && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeMember(index)}
                        className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl font-syne text-base font-bold text-white glow-accent transition-all"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
          >
            Create Trip ✈️
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
