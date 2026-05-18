"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/utils";

const PRESETS = [40000, 80000, 120000, 200000];

export default function Onboarding({ onComplete }: { onComplete: (budget: number) => void }) {
  const [budget, setBudget] = useState(80000);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-12"
      >
        <h1 className="font-syne text-5xl font-black gradient-text mb-3">FinFlow</h1>
        <p className="text-[#9898aa] text-base">Your personalized Expense Tracker</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm bg-[#1e1e28] border border-white/10 rounded-3xl p-7"
      >
        <h2 className="font-syne text-xl font-bold text-white mb-1">Set Monthly Budget</h2>
        <p className="text-[#9898aa] text-sm mb-7">How much do you want to spend this month?</p>

        <div className="font-syne text-5xl font-black gradient-text text-center mb-5">
          {formatINR(budget)}
        </div>

        <input
          type="range"
          min={20000}
          max={300000}
          step={5000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full mb-4"
        />

        <div className="flex gap-2 flex-wrap mb-7">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setBudget(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150
                ${budget === p
                  ? "bg-[#6c47ff]/20 border-[#8b6fff] text-[#8b6fff]"
                  : "bg-[#252533] border-white/10 text-[#9898aa] hover:border-white/20"
                }`}
            >
              {p >= 100000 ? `₹${p / 100000}L` : `₹${p / 1000}K`}
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ translateY: -2 }}
          onClick={() => onComplete(budget)}
          className="w-full py-4 rounded-2xl font-syne text-lg font-bold text-white glow-accent transition-all"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
        >
          Let&apos;s Track It 🚀
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
