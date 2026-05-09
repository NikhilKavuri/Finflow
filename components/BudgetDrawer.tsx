"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { formatINR } from "@/lib/utils";

const PRESETS = [40000, 80000, 120000, 200000];

interface Props {
  initialBudget: number;
  onClose: () => void;
  onSubmit: (budget: number) => void;
}

export default function BudgetDrawer({ initialBudget, onClose, onSubmit }: Props) {
  const [budget, setBudget] = useState(String(initialBudget));
  const [error, setError] = useState("");
  const numericBudget = Number(budget);
  const previewBudget = Number.isFinite(numericBudget) && numericBudget > 0 ? numericBudget : 0;

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;

    const syncViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--visual-viewport-height", `${height}px`);
    };

    syncViewportHeight();
    document.body.style.overflow = "hidden";
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    window.visualViewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);

    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty("--visual-viewport-height");
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      window.visualViewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
    };
  }, []);

  const handleSave = () => {
    if (!Number.isFinite(numericBudget) || numericBudget < 1000) {
      setError("Enter a budget of at least 1000.");
      return;
    }

    onSubmit(Math.round(numericBudget));
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

      <motion.div
        className="keyboard-panel fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-syne text-lg font-bold text-white">Monthly Budget</h2>
              <p className="text-xs font-semibold text-[#5a5a6e]">Adjust your current spending limit</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#9898aa]"
              aria-label="Close"
            >
              <X size={16} />
            </motion.button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[#ff4f6b]/20 bg-[#ff4f6b]/10 px-3 py-2 text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-4">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
              New Budget
            </div>
            <div className="font-syne text-4xl font-black text-white">{formatINR(previewBudget)}</div>
          </div>

          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
            Amount
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1000}
            step={1000}
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setError("");
            }}
            className="mb-4 w-full rounded-xl border border-white/10 bg-[#1e1e28] px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-[#5a5a6e] focus:border-[#8b6fff]"
            placeholder="Enter monthly budget"
          />

          <input
            type="range"
            min={10000}
            max={300000}
            step={5000}
            value={Math.min(300000, Math.max(10000, previewBudget || 10000))}
            onChange={(e) => {
              setBudget(e.target.value);
              setError("");
            }}
            className="mb-4 w-full"
          />

          <div className="mb-7 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setBudget(String(preset));
                  setError("");
                }}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                  previewBudget === preset
                    ? "border-[#8b6fff] bg-[#6c47ff]/20 text-[#8b6fff]"
                    : "border-white/10 bg-[#252533] text-[#9898aa] hover:border-white/20"
                }`}
              >
                {formatINR(preset)}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleSave}
            className="w-full rounded-2xl py-4 font-syne text-base font-bold text-white glow-accent"
            style={{ background: "linear-gradient(135deg,#6c47ff,#8b6fff)" }}
          >
            Save Budget
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
