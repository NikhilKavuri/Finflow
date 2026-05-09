"use client";

import { motion } from "framer-motion";

export default function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto h-20 w-full max-w-[480px] glass-nav border-t border-white/[0.06]">
      <motion.button
        className="absolute left-1/2 top-1/2 -ml-7 -mt-7 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl font-light glow-accent"
        style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.08 }}
        onClick={onAddClick}
        aria-label="Add expense"
      >
        +
      </motion.button>
    </nav>
  );
}
