"use client";

import { motion } from "framer-motion";
import { X, Receipt, Layers } from "lucide-react";
import { useMobileDrawerViewport } from "@/hooks/useMobileDrawerViewport";

interface Props {
  onClose: () => void;
  onSelectIndividual: () => void;
  onSelectCategory: () => void;
}

export default function AddExpenseChooser({ onClose, onSelectIndividual, onSelectCategory }: Props) {
  useMobileDrawerViewport(true);

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
        className="mobile-sheet-compact fixed left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%", bottom: "var(--keyboard-offset, 0)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-syne text-base font-bold text-white sm:text-lg">Add Expense</h2>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-[#9898aa]"
            >
              <X size={16} />
            </motion.button>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-[#9898aa] sm:text-sm">
            Choose how you want to log this spend.
          </p>

          <div className="flex flex-col gap-2.5 sm:gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onSelectIndividual}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-3.5 text-left transition-colors active:bg-[#252533] sm:gap-4 sm:p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#6c47ff]/15 text-[#8b6fff] sm:h-11 sm:w-11">
                <Receipt size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-syne text-sm font-bold text-white sm:text-base">Individual expense</div>
                <p className="mt-0.5 text-[11px] leading-snug text-[#5a5a6e] sm:text-xs">
                  One payment — lunch, fuel, subscription, etc.
                </p>
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onSelectCategory}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-3.5 text-left transition-colors active:bg-[#252533] sm:gap-4 sm:p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#ffb830]/15 text-[#ffb830] sm:h-11 sm:w-11">
                <Layers size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-syne text-sm font-bold text-white sm:text-base">Category expense</div>
                <p className="mt-0.5 text-[11px] leading-snug text-[#5a5a6e] sm:text-xs">
                  Group related spends — trip, event, or project.
                </p>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
