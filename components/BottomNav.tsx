"use client";

import { motion } from "framer-motion";
import { Plus, Home, Plane } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Props {
  disabled?: boolean;
  onAddClick: () => void;
}

export default function BottomNav({ disabled = false, onAddClick }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isTrips = pathname?.startsWith("/trips");

  return (
    <nav className="mobile-footer fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-[480px] glass-footer border-t border-white/[0.06]">
      <div className="relative flex items-center justify-around h-14 px-4">
        {/* Home Tab */}
        <Link href="/" className="flex-1 flex justify-center">
          <motion.div
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative">
              <Home
                size={20}
                strokeWidth={isHome ? 2.4 : 1.8}
                className={isHome ? "text-[#8b6fff]" : "text-[#5a5a6e]"}
              />
              {isHome && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute -inset-2 rounded-full bg-[#6c47ff]/15 -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] font-semibold ${
                isHome ? "text-[#8b6fff]" : "text-[#5a5a6e]"
              }`}
            >
              Home
            </span>
          </motion.div>
        </Link>

        {/* Center Add Button */}
        <div className="flex justify-center" style={{ flex: "0 0 auto" }}>
          <motion.button
            className="relative -mt-7 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-45 shadow-lg"
            style={{
              background: disabled
                ? "linear-gradient(135deg, #343444, #242430)"
                : "linear-gradient(135deg, #6c47ff, #8b6fff)",
            }}
            whileTap={disabled ? undefined : { scale: 0.9 }}
            whileHover={disabled ? undefined : { scale: 1.08 }}
            onClick={onAddClick}
            disabled={disabled}
            aria-label={isTrips ? "Add trip" : "Add expense"}
          >
            {!disabled && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #6c47ff, #8b6fff)",
                  filter: "blur(12px)",
                  opacity: 0.4,
                }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <Plus size={22} strokeWidth={2.4} className="relative z-10" />
          </motion.button>
        </div>

        {/* Trips Tab */}
        <Link href="/trips" className="flex-1 flex justify-center">
          <motion.div
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative">
              <Plane
                size={20}
                strokeWidth={isTrips ? 2.4 : 1.8}
                className={isTrips ? "text-[#8b6fff]" : "text-[#5a5a6e]"}
              />
              {isTrips && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute -inset-2 rounded-full bg-[#6c47ff]/15 -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] font-semibold ${
                isTrips ? "text-[#8b6fff]" : "text-[#5a5a6e]"
              }`}
            >
              Trips
            </span>
          </motion.div>
        </Link>
      </div>
    </nav>
  );
}
