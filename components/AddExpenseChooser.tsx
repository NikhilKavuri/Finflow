"use client";

import { motion } from "framer-motion";
import { X, Receipt, Layers } from "lucide-react";

interface Props {
  onClose: () => void;
  onSelectIndividual: () => void;
  onSelectCategory: () => void;
}

export default function AddExpenseChooser({ onClose, onSelectIndividual, onSelectCategory }: Props) {
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
        className="fixed left-1/2 bottom-0 z-50 w-full max-w-[480px] -translate-x-1/2 rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-2 pb-4">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-syne text-lg font-bold text-white">Add Expense</h2>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#9898aa]"
          >
            <X size={16} />
          </motion.button>
        </div>

        <p className="mb-4 text-sm text-[#9898aa]">
          Choose how you want to log this spend.
        </p>

        <div className="flex flex-col gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onSelectIndividual}
            className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-4 text-left transition-colors hover:border-[#8b6fff]/30 hover:bg-[#252533]"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#6c47ff]/15 text-[#8b6fff]">
              <Receipt size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-syne text-base font-bold text-white">Individual expense</div>
              <p className="mt-1 text-xs leading-relaxed text-[#5a5a6e]">
                A single payment — lunch, fuel, subscription, and more.
              </p>
            </div>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onSelectCategory}
            className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-4 text-left transition-colors hover:border-[#8b6fff]/30 hover:bg-[#252533]"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#ffb830]/15 text-[#ffb830]">
              <Layers size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-syne text-base font-bold text-white">Category expense</div>
              <p className="mt-1 text-xs leading-relaxed text-[#5a5a6e]">
                Group related spends — trip, event, or project — with sub-expenses inside.
              </p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
