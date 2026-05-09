"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface Props {
  disabled?: boolean;
  onAddClick: () => void;
}

export default function BottomNav({ disabled = false, onAddClick }: Props) {
  return (
    <nav className="mobile-footer fixed bottom-0 left-0 right-0 z-30 mx-auto h-20 w-full max-w-[480px] glass-nav border-t border-white/[0.06]">
      <motion.button
        className="absolute left-1/2 top-1/2 -ml-7 -mt-7 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white glow-accent disabled:cursor-not-allowed disabled:opacity-45"
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
        <Plus size={28} strokeWidth={2.4} />
      </motion.button>
    </nav>
  );
}
