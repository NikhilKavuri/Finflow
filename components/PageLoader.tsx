"use client";

import { motion } from "framer-motion";

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ message, fullScreen = true }: Props) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated gradient ring spinner */}
      <div className="relative w-12 h-12">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent, #6c47ff, #8b6fff, transparent)",
            mask: "radial-gradient(circle, transparent 60%, black 62%)",
            WebkitMask: "radial-gradient(circle, transparent 60%, black 62%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 180deg, transparent, #b8ff57, #6c47ff, transparent)",
            mask: "radial-gradient(circle, transparent 60%, black 62%)",
            WebkitMask: "radial-gradient(circle, transparent 60%, black 62%)",
            opacity: 0.5,
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Brand */}
      <div className="text-center">
        <h2 className="font-syne text-lg font-bold gradient-text">FinFlow</h2>
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-[#5a5a6e] mt-1"
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {content}
    </div>
  );
}

/** Skeleton shimmer block */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`bg-[#1e1e28] rounded-xl overflow-hidden relative ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
          animation: "shimmer 2s infinite",
        }}
      />
    </motion.div>
  );
}

/** Dashboard skeleton loader */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 pt-20 space-y-4">
      <SkeletonBlock className="h-40 rounded-3xl" />
      <div className="grid grid-cols-2 gap-2.5">
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
      </div>
      <SkeletonBlock className="h-64 rounded-2xl" />
    </div>
  );
}
