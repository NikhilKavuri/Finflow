"use client";

import { motion } from "framer-motion";

export default function AppLoading({ message = "Loading FinFlow…" }: { message?: string }) {
  return (
    <motion.div
      className="app-screen flex min-h-[100svh] flex-col items-center justify-center bg-bg px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="font-syne text-4xl font-black gradient-text mb-4">FinFlow</h1>
      <motion.div
        className="h-10 w-10 rounded-full border-2 border-[#6c47ff]/30 border-t-[#8b6fff]"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      />
      <p className="mt-5 text-sm text-[#9898aa]">{message}</p>
    </motion.div>
  );
}
