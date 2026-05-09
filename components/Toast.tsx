"use client";

import { motion } from "framer-motion";

export default function Toast({ message }: { message: string }) {
  return (
    <motion.div
      className="fixed top-20 left-1/2 z-[100] bg-[#252533] border border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-2xl whitespace-nowrap"
      style={{ x: "-50%" }}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {message}
    </motion.div>
  );
}
