"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import type { BalanceEntry } from "@/hooks/useTrips";
import type { TripSession } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";

interface Props {
  balance: BalanceEntry;
  trip: TripSession;
  onClose: () => void;
  onSettle: (amount: number) => void;
}

export default function SettlePaymentModal({ balance, trip, onClose, onSettle }: Props) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  const paymentHistory = trip.settlements
    .filter((s) => s.from === balance.from.id && s.to === balance.to.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSettle = () => {
    if (!amount.trim()) {
      setError("Enter an amount");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amt > balance.amount) {
      setError(`Can't pay more than ₹${balance.amount.toLocaleString()}`);
      return;
    }
    onSettle(amt);
  };

  const remaining = balance.amount - (amount ? parseFloat(amount) : 0);

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

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-[420px] max-h-[80vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne text-lg font-bold text-white">Settle Payment</h3>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa]"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Balance Overview */}
          <div className="mb-6 rounded-xl border border-white/[0.06] bg-[#1a1a24] p-4">
            <div className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-3">
              Balance Overview
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#ff6b35]/15 flex items-center justify-center text-lg">
                {balance.from.avatar}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{balance.from.name}</div>
                <div className="text-[11px] text-[#5a5a6e]">owes</div>
              </div>
            </div>

            <div className="text-center mb-3">
              <div className="font-syne text-2xl font-bold text-[#ff6b35] mb-1">
                {formatINR(balance.amount)}
              </div>
              <div className="text-[10px] text-[#5a5a6e]">to</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2ce88a]/15 flex items-center justify-center text-lg">
                {balance.to.avatar}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{balance.to.name}</div>
                <div className="text-[11px] text-[#5a5a6e]">receives</div>
              </div>
            </div>
          </div>

          {/* Payment Input */}
          <div className="mb-6">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Amount to Pay
            </label>
            <input
              type="number"
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
              placeholder="0.00"
              min={0}
              max={balance.amount}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
            />
            {error && (
              <div className="mt-2 px-3 py-2 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b]">
                {error}
              </div>
            )}
          </div>

          {/* Remaining */}
          {amount && (
            <div className="mb-6 rounded-xl border border-white/[0.06] bg-[#15151d] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#9898aa]">Amount to Pay</span>
                <span className="text-sm font-bold text-white">{formatINR(parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9898aa]">Remaining Balance</span>
                <span className={`text-sm font-bold ${remaining >= 0 ? "text-[#2ce88a]" : "text-[#ff4f6b]"}`}>
                  {formatINR(remaining)}
                </span>
              </div>
            </div>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="mb-6">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2 hover:text-[#9898aa] transition-colors"
              >
                Payment History
                <motion.div
                  animate={{ rotate: showHistory ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-white/[0.06] bg-[#15151d] p-3 space-y-2"
                  >
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{formatINR(payment.amount)}</span>
                          <span className="text-[#5a5a6e]">paid</span>
                        </div>
                        <span className="text-[10px] text-[#5a5a6e]">{formatDate(payment.date)}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08]"
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSettle}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#6c47ff] disabled:opacity-50"
            >
              Pay {amount ? formatINR(parseFloat(amount)) : ""}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
