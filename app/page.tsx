"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExpenses } from "@/hooks/useExpenses";
import { getCurrentMonthPrefix } from "@/lib/utils";
import Onboarding from "@/components/Onboarding";
import TopNav from "@/components/TopNav";
import BalanceCard from "@/components/BalanceCard";
import QuickStats from "@/components/QuickStats";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import SpendFeed from "@/components/SpendFeed";
import BottomNav from "@/components/BottomNav";
import ExpenseDrawer from "@/components/ExpenseDrawer";
import Toast from "@/components/Toast";

export default function HomePage() {
  const { state, hydrated, completeOnboarding, addTransaction, deleteTransaction, clearAll } =
    useExpenses();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const monthPrefix = getCurrentMonthPrefix();
  const monthTxs = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(monthPrefix)),
    [state.transactions, monthPrefix]
  );
  const expenses = useMemo(() => monthTxs.filter((t) => t.type === "expense"), [monthTxs]);
  const income = useMemo(() => monthTxs.filter((t) => t.type === "income"), [monthTxs]);

  const totalSpent = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const balance = state.budget - totalSpent;
  const pct = Math.min(100, Math.round((totalSpent / state.budget) * 100));
  const dayOfMonth = new Date().getDate();
  const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;

  if (!hydrated) return null;

  return (
    <>
      <AnimatePresence>
        {!state.onboarded && (
          <Onboarding onComplete={completeOnboarding} />
        )}
      </AnimatePresence>

      {state.onboarded && (
        <div className="flex flex-col min-h-screen max-w-[480px] mx-auto pb-24">
          <TopNav />

          <main className="flex-1 px-4 space-y-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <BalanceCard
                balance={balance}
                totalSpent={totalSpent}
                budget={state.budget}
                pct={pct}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              <QuickStats totalIncome={totalIncome} dailyAvg={dailyAvg} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <CategoryBreakdown expenses={expenses} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <SpendFeed
                transactions={state.transactions.slice(0, 50)}
                onDelete={(id) => { deleteTransaction(id); showToast("🗑️ Transaction removed"); }}
                onClearAll={() => { clearAll(); showToast("🧹 All transactions cleared"); }}
              />
            </motion.div>
          </main>

          <BottomNav onAddClick={() => setDrawerOpen(true)} />

          {/* FAB */}
          <motion.button
            className="fixed bottom-24 left-1/2 -ml-7 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl font-light glow-accent"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Add expense"
          >
            +
          </motion.button>

          <AnimatePresence>
            {drawerOpen && (
              <ExpenseDrawer
                onClose={() => setDrawerOpen(false)}
                onSubmit={(data) => {
                  addTransaction(data);
                  setDrawerOpen(false);
                  showToast("✅ Expense logged!");
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && <Toast message={toast} />}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
