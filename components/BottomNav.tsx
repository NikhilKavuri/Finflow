"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface Props {
  disabled?: boolean;
  onAddClick: () => void;
}

export default function BottomNav({ disabled = false, onAddClick }: Props) {
  return (
    <nav className="mobile-footer fixed bottom-0 rounded-t-lg left-0 right-0 z-30 mx-auto h-10 w-full max-w-[480px] glass-footer border-t border-white/[0.06] py-1 px-2">
      <motion.button
        className="absolute left-1/2 top-0 -ml-5 -mt-5 z-40 w-12 h-12 rounded-full flex items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-45 shadow-lg"
        style={{
          background: disabled
            ? "linear-gradient(135deg, #343444, #242430)"
            : "linear-gradient(135deg, #6c47ff, #8b6fff)",
        }}
        whileTap={disabled ? undefined : { scale: 0.9 }}
        whileHover={disabled ? undefined : { scale: 1.08 }}
        onClick={onAddClick}
        disabled={disabled}
        aria-label="Add expense"
      >
        <Plus size={20} strokeWidth={2.4} />
      </motion.button>
    </nav>
  );
}
