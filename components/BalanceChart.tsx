"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import type { BalanceEntry } from "@/hooks/useTrips";
import type { TripSession } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import SettlePaymentModal from "./SettlePaymentModal";

interface Props {
  balances: BalanceEntry[];
  trip: TripSession;
  onSettle?: (from: string, to: string, amount: number) => void;
  interactive?: boolean;
}

export default function BalanceChart({ balances, trip, onSettle, interactive = true }: Props) {
  const [selectedBalance, setSelectedBalance] = useState<BalanceEntry | null>(null);

  if (balances.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-white/[0.06] bg-[#15151d] p-6 text-center"
      >
        <div className="text-2xl mb-2">🎉</div>
        <div className="text-sm font-semibold text-[#b8ff57]">All settled up!</div>
        <div className="text-xs text-[#5a5a6e] mt-1">No pending balances</div>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="px-1 mb-1">
          <h4 className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
            Simplified Settlements
          </h4>
          <p className="text-[10px] text-[#5a5a6e]/70 mt-0.5">
            Minimum transfers needed to settle all debts
          </p>
        </div>
        {balances.map((entry, i) => (
          <motion.button
            key={`${entry.from.id}-${entry.to.id}-${i}`}
            type="button"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            whileTap={interactive ? { scale: 0.98 } : undefined}
            onClick={() => interactive && setSelectedBalance(entry)}
            disabled={!interactive}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1a24] p-3 text-left transition-all hover:border-white/15 disabled:hover:border-white/[0.06]"
          >
            {/* Subtle accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#ff6b35] to-[#ff6b35]/40" />

            <div className="flex items-center gap-3 ml-1">
              {/* From */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#ff6b35]/15 flex items-center justify-center text-sm flex-shrink-0">
                  {entry.from.avatar}
                </div>
                <span className="text-sm font-semibold text-white truncate">
                  {entry.from.name}
                </span>
              </div>

              {/* Arrow + Amount */}
              <div className="flex flex-col items-center flex-shrink-0 px-1">
                <ArrowRight size={14} className="text-[#5a5a6e]" />
                <span className="text-[10px] font-bold text-[#ff6b35] mt-0.5">
                  {formatINR(entry.amount)}
                </span>
              </div>

              {/* To */}
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                <span className="text-sm font-semibold text-white truncate text-right">
                  {entry.to.name}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#2ce88a]/15 flex items-center justify-center text-sm flex-shrink-0">
                  {entry.to.avatar}
                </div>
              </div>

              {/* Settle button */}
              {interactive && onSettle && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSettle(entry.from.id, entry.to.id, entry.amount);
                  }}
                  className="ml-2 w-8 h-8 rounded-full bg-[#2ce88a]/15 flex items-center justify-center text-[#2ce88a] flex-shrink-0 hover:bg-[#2ce88a]/25 transition-colors"
                  title="Mark as settled"
                  type="button"
                >
                  <Check size={14} strokeWidth={2.5} />
                </motion.button>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Settlement Modal */}
      <AnimatePresence>
        {selectedBalance && (
          <SettlePaymentModal
            balance={selectedBalance}
            trip={trip}
            onClose={() => setSelectedBalance(null)}
            onSettle={(amount) => {
              if (onSettle) {
                onSettle(selectedBalance.from.id, selectedBalance.to.id, amount);
              }
              setSelectedBalance(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
