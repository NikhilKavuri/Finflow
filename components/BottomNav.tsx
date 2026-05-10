"use client";

import { motion } from "framer-motion";
import { Plus, User } from "lucide-react";

interface Props {
  disabled?: boolean;
  onAddClick: () => void;
  onProfileClick: () => void;
}

export default function BottomNav({ disabled = false, onAddClick, onProfileClick }: Props) {
  return (
    <nav className="mobile-footer fixed bottom-0 rounded-t-lg left-0 right-0 z-30 mx-auto h-10 w-full max-w-[480px] glass-footer border-t border-white/[0.06] py-1 px-2">
      <motion.button
        className="absolute right-3 top-1/2 -mt-5 z-40"
        onClick={onProfileClick}
        aria-label="Profile"
        whileTap={{ scale: 0.85 }}
      >
        <motion.div
          className="relative w-10 h-10 flex items-center justify-center"
          whileHover={{ scale: 1.15, y: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full profile-glow-ring opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Gradient avatar circle */}
          <motion.div
            className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg profile-icon-glow"
            style={{
              background: "linear-gradient(135deg, #6c47ff 0%, #8b6fff 50%, #c147ff 100%)",
            }}
            whileHover={{
              boxShadow: "0 0 24px rgba(108, 71, 255, 0.5), 0 0 48px rgba(139, 111, 255, 0.2)",
            }}
          >
            {/* Rotating border accent */}
            <div className="absolute inset-[-2px] rounded-full profile-ring-rotate opacity-60" />
            
            <User size={18} className="text-white relative z-10" strokeWidth={2.2} />
          </motion.div>
        </motion.div>
      </motion.button>

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
