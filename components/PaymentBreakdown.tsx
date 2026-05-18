"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Transaction, PaymentMethodConfig } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface Props {
  expenses: Transaction[];
  paymentMethods: PaymentMethodConfig[];
}

const PM_COLORS: Record<string, string> = {
  credit_card: "#ff6b35",
  upi: "#8b6fff",
  cash: "#2ce88a",
  bank_transfer: "#38bdf8",
  other: "#9898aa",
};

const PM_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  upi: "UPI",
  cash: "Cash",
  bank_transfer: "Transfer",
  other: "Other",
};

export default function PaymentBreakdown({ expenses, paymentMethods }: Props) {
  const breakdown = useMemo(() => {
    const map: Record<string, { amount: number; type: string; name: string; emoji: string }> = {};

    for (const tx of expenses) {
      const pmType = tx.paymentMethod || "other";
      const userPm =
        paymentMethods.find((pm) => pm.id === tx.paymentMethodId) ||
        paymentMethods.find((pm) => pm.type === pmType);
      const key = tx.paymentMethodId || pmType;

      if (!map[key]) {
        map[key] = {
          amount: 0,
          type: pmType,
          name: userPm?.name || PM_LABELS[pmType] || "Other",
          emoji: userPm?.emoji || "💳",
        };
      }
      map[key].amount += tx.amount;
    }

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [expenses, paymentMethods]);

  const total = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);

  if (breakdown.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mb-4"
    >
      <div className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-4">
        <h3 className="text-[10px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-3">
          Payment Methods
        </h3>

        {/* Stacked Bar */}
        <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden flex mb-3">
          {breakdown.map((item) => {
            const pct = total > 0 ? (item.amount / total) * 100 : 0;
            return (
              <motion.div
                key={item.type}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full"
                style={{ background: PM_COLORS[item.type] || PM_COLORS.other, minWidth: pct > 0 ? "3px" : 0 }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {breakdown.map((item) => {
            const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
            const color = PM_COLORS[item.type] || PM_COLORS.other;
            return (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-xs text-[#9898aa] flex-1 min-w-0 truncate">
                  {item.emoji} {item.name}
                </span>
                <span className="text-xs font-bold text-white">{formatINR(item.amount)}</span>
                <span className="text-[10px] text-[#5a5a6e] w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
