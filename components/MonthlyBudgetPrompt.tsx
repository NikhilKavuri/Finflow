"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, X } from "lucide-react";
import { formatINR } from "@/lib/utils";

const PRESETS = [40000, 60000, 80000, 100000, 120000, 150000];

interface Props {
  currentMonth: string;
  previousBudget: number;
  budgetCycleStartDay: number;
  onSubmit: (budget: number) => void;
  onDismiss: () => void;
}

function formatMonthName(monthPrefix: string): string {
  const [year, month] = monthPrefix.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function MonthlyBudgetPrompt({
  currentMonth,
  previousBudget,
  budgetCycleStartDay,
  onSubmit,
  onDismiss,
}: Props) {
  const [budget, setBudget] = useState(String(previousBudget));
  const numericBudget = Number(budget);
  const previewBudget = Number.isFinite(numericBudget) && numericBudget > 0 ? numericBudget : 0;
  const [error, setError] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;

    const syncViewportHeight = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const offset = window.innerHeight - (window.visualViewport?.height ?? window.innerHeight);
      root.style.setProperty("--visual-viewport-height", `${vh}px`);
      root.style.setProperty("--keyboard-offset", `${Math.max(0, offset)}px`);
    };

    syncViewportHeight();
    document.body.style.overflow = "hidden";
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    window.visualViewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);

    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty("--visual-viewport-height");
      root.style.removeProperty("--keyboard-offset");
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      window.visualViewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
    };
  }, []);

  const handleSave = () => {
    if (!Number.isFinite(numericBudget) || numericBudget < 1000) {
      setError("Enter a budget of at least ₹1,000.");
      return;
    }
    onSubmit(Math.round(numericBudget));
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      />

      {/* Drawer */}
      <motion.div
        className="keyboard-panel fixed left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%", bottom: "var(--keyboard-offset, 0)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-syne text-lg font-bold text-white">New Budget Cycle! 🎉</h2>
              <p className="text-xs font-semibold text-[#5a5a6e] mt-0.5">
                Set your budget for {formatMonthName(currentMonth)}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#9898aa]"
              aria-label="Dismiss"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Salary day info */}
          <div className="mb-4 rounded-xl border border-[#b8ff57]/20 bg-[#b8ff57]/5 px-3 py-2.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#b8ff57]/15 text-[#b8ff57]">
              <CalendarDays size={17} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#b8ff57]">Salary Day {budgetCycleStartDay}</div>
              <div className="text-[10px] text-[#5a5a6e] mt-0.5">
                Last month's budget: {formatINR(previousBudget)}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[#ff4f6b]/20 bg-[#ff4f6b]/10 px-3 py-2 text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          {/* Preview */}
          <div className="mb-4 rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-4">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
              This Month's Budget
            </div>
            <div className="font-syne text-4xl font-black text-white">{formatINR(previewBudget)}</div>
          </div>

          {/* Amount input */}
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

          {/* Presets */}
          <div className="mb-6 flex flex-wrap gap-2">
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

          {/* Save button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleSave}
            className="w-full rounded-2xl py-4 font-syne text-base font-bold text-white glow-accent"
            style={{ background: "linear-gradient(135deg,#6c47ff,#8b6fff)" }}
          >
            Set Budget ✦
          </motion.button>

          {/* Use same */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onSubmit(previousBudget)}
            className="mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-[#5a5a6e] border border-white/[0.06] bg-[#1e1e28] hover:text-white transition-colors"
          >
            Use same as last month ({formatINR(previousBudget)})
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
