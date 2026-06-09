"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Crown, Trash2 } from "lucide-react";
import type { SplitMember } from "@/lib/types";

interface Props {
  member: SplitMember;
  onClose: () => void;
  onSubmit: (name: string, avatar: string) => void;
  canPromote?: boolean;
  onPromote?: () => void;
  onRemove?: () => void;
}

const AVATAR_OPTIONS = ["😎", "🤩", "😊", "🥳", "🧐", "😈", "🦊", "🐻", "🦁", "🐸", "🌸", "⭐"];

export default function EditMemberModal({ member, onClose, onSubmit, canPromote = false, onPromote, onRemove }: Props) {
  const [name, setName] = useState(member.name);
  const [avatar, setAvatar] = useState(member.avatar);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Member name required");
      return;
    }
    onSubmit(name.trim(), avatar);
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-[380px] rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne text-lg font-bold text-white">Edit Member</h3>
            <div className="flex items-center gap-2">
              {onRemove && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onRemove}
                  className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Remove Member"
                >
                  <Trash2 size={15} />
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa]"
              >
                <X size={16} />
              </motion.button>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          {/* Member Name */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Name
            </label>
            <input
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
              placeholder="Member name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>

          {/* Avatar Selection */}
          <div className="mb-6">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-3">
              Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((option) => (
                <motion.button
                  key={option}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAvatar(option)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border transition-all ${
                    avatar === option
                      ? "border-[#6c47ff] bg-[#6c47ff]/20 shadow-[0_0_12px_rgba(108,71,255,0.2)]"
                      : "border-white/[0.06] bg-[#1e1e28] hover:border-white/15"
                  }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Role Badge */}
          {member.role === "admin" && (
            <div className="mb-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2 text-sm text-yellow-500">
              <Crown size={14} />
              <span>Admin</span>
            </div>
          )}

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08]"
            >
              Cancel
            </motion.button>
            {canPromote && member.role !== "admin" && onPromote && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onPromote();
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
              >
                <Crown size={14} />
                Admin
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#6c47ff]"
            >
              Save
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
