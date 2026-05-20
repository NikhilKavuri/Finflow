"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CreditCard, Settings2, TrendingDown, Wallet } from "lucide-react";
import type { PaymentMethodConfig, Transaction } from "@/lib/types";
import { getPaymentPlan } from "@/lib/payment-planning";
import { formatINR } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  paymentMethods: PaymentMethodConfig[];
  budget: number;
  budgetCycleStartDay: number;
  selectedMonth: string;
  onEditBudget: () => void;
  onManagePaymentMethods: () => void;
}

function formatShortDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function PaymentPlanCard({
  transactions,
  paymentMethods,
  budget,
  budgetCycleStartDay,
  selectedMonth,
  onEditBudget,
  onManagePaymentMethods,
}: Props) {
  const plan = useMemo(
    () =>
      getPaymentPlan({
        transactions,
        paymentMethods,
        budget,
        budgetCycleStartDay,
        selectedMonth,
      }),
    [transactions, paymentMethods, budget, budgetCycleStartDay, selectedMonth]
  );

  const pct = budget > 0 ? Math.min(100, Math.round((plan.totalPlannedSpend / budget) * 100)) : 0;
  const overBudget = plan.budgetLeft < 0;
  const incomeGap = plan.income > 0 ? plan.income - plan.totalPlannedSpend : null;
  const visibleBills = plan.cardBills.filter((bill) => bill.amount > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mb-4 rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-4"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-[#b8ff57]" />
            <h3 className="font-syne text-[15px] font-bold text-white">Budget Window</h3>
          </div>
          <button
            type="button"
            onClick={onEditBudget}
            className="mt-1 flex items-center gap-1.5 text-left text-[11px] font-semibold text-[#8b6fff] transition-colors hover:text-white"
          >
            <CalendarDays size={12} />
            {formatShortDate(plan.window.start)} - {formatShortDate(plan.window.end)}
            <span className="text-[#5a5a6e]">Day {budgetCycleStartDay}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onManagePaymentMethods}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#9898aa] transition-colors hover:text-white"
          aria-label="Manage payment methods"
        >
          <Settings2 size={15} />
        </button>
      </div>

      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className={`font-syne text-3xl font-black leading-none ${overBudget ? "text-[#ff4f6b]" : "text-white"}`}>
            {overBudget ? "-" : ""}{formatINR(Math.abs(plan.budgetLeft))}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#5a5a6e]">
            {overBudget ? "deficit against budget" : "left after spends and card reserve"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white">{formatINR(plan.totalPlannedSpend)}</div>
          <div className="text-[11px] font-semibold text-[#5a5a6e]">of {formatINR(budget)}</div>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: overBudget
              ? "linear-gradient(90deg,#ff4f6b,#ff6b35)"
              : "linear-gradient(90deg,#6c47ff,#b8ff57)",
          }}
        />
      </div>

      <div className="space-y-2 border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-[#9898aa]">
            <Wallet size={13} className="text-[#8b6fff]" />
            Direct payments
          </span>
          <span className="font-bold text-white">{formatINR(plan.directSpend)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-[#9898aa]">
            <CreditCard size={13} className="text-[#ffb830]" />
            Card bills due
          </span>
          <span className="font-bold text-white">{formatINR(plan.cardDueTotal)}</span>
        </div>
        {plan.reservedCardSpend > 0 && (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-[#9898aa]">
              <CreditCard size={13} className="text-[#ff6b35]" />
              🔒 Reserved (deducted)
            </span>
            <span className="font-bold text-[#ff6b35]">{formatINR(plan.reservedCardSpend)}</span>
          </div>
        )}
        {plan.cardFutureTotal > 0 && (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-[#9898aa]">
              <CreditCard size={13} className="text-[#8b6fff]" />
              Reserved card swipes
            </span>
            <span className="font-bold text-white">{formatINR(plan.cardFutureTotal)}</span>
          </div>
        )}
        {incomeGap !== null && (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-[#9898aa]">
              <TrendingDown size={13} className={incomeGap < 0 ? "text-[#ff4f6b]" : "text-[#2ce88a]"} />
              Income cover
            </span>
            <span className={`font-bold ${incomeGap < 0 ? "text-[#ff4f6b]" : "text-[#2ce88a]"}`}>
              {incomeGap < 0 ? "-" : "+"}{formatINR(Math.abs(incomeGap))}
            </span>
          </div>
        )}
      </div>

      {visibleBills.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
          {visibleBills.map((bill) => (
            <div key={`${bill.paymentMethodId}-${bill.dueDate}`} className="flex items-center gap-3 text-xs">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#ffb830]/10 text-sm">
                {bill.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-white">{bill.name}</div>
                <div className="truncate text-[10px] font-semibold text-[#5a5a6e]">
                  Due {formatShortDate(bill.dueDate)} - {formatShortDate(bill.cycleStart)}-{formatShortDate(bill.cycleEnd)}
                </div>
              </div>
              <div className="font-bold text-white">{formatINR(bill.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
