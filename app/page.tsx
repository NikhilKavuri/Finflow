"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExpenses } from "@/hooks/useExpenses";
import { getCurrentMonthPrefix, getDaysInMonth, getPreviousMonthPrefix } from "@/lib/utils";
import Onboarding from "@/components/Onboarding";
import TopNav from "@/components/TopNav";
import BalanceCard from "@/components/BalanceCard";
import QuickStats from "@/components/QuickStats";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import SpendFeed from "@/components/SpendFeed";
import BottomNav from "@/components/BottomNav";
import ExpenseDrawer from "@/components/ExpenseDrawer";
import BudgetDrawer from "@/components/BudgetDrawer";
import Toast from "@/components/Toast";

export default function HomePage() {
  const { state, hydrated, completeOnboarding, addTransaction, deleteTransaction, clearAll, updateBudget } =
    useExpenses();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const currentMonth = getCurrentMonthPrefix();
  const previousMonth = getPreviousMonthPrefix();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const isCurrentMonth = selectedMonth === currentMonth;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const monthTxs = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [state.transactions, selectedMonth]
  );
  const expenses = useMemo(() => monthTxs.filter((t) => t.type === "expense"), [monthTxs]);
  const income = useMemo(() => monthTxs.filter((t) => t.type === "income"), [monthTxs]);

  const totalSpent = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const balance = state.budget - totalSpent;
  const pct = Math.min(100, Math.round((totalSpent / state.budget) * 100));
  const dayCount = isCurrentMonth ? new Date().getDate() : getDaysInMonth(selectedMonth);
  const dailyAvg = dayCount > 0 ? totalSpent / dayCount : 0;

  if (!hydrated) return null;

  return (
    <>
      <AnimatePresence>
        {!state.onboarded && <Onboarding onComplete={completeOnboarding} />}
      </AnimatePresence>

      {state.onboarded && (
        <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
          <TopNav
            currentMonth={currentMonth}
            previousMonth={previousMonth}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />

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
                editable={isCurrentMonth}
                onEditBudget={() => setBudgetOpen(true)}
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
                editable={isCurrentMonth}
                transactions={monthTxs.slice(0, 50)}
                onDelete={(id) => {
                  if (!isCurrentMonth) return;
                  deleteTransaction(id);
                  showToast("Transaction removed");
                }}
                onClearAll={() => {
                  if (!isCurrentMonth) return;
                  clearAll(currentMonth);
                  showToast("All transactions cleared");
                }}
              />
            </motion.div>
          </main>

          <BottomNav disabled={!isCurrentMonth} onAddClick={() => setDrawerOpen(true)} />

          <AnimatePresence>
            {drawerOpen && (
              <ExpenseDrawer
                onClose={() => setDrawerOpen(false)}
                onSubmit={(data) => {
                  addTransaction(data);
                  setDrawerOpen(false);
                  showToast("Expense logged");
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {budgetOpen && (
              <BudgetDrawer
                initialBudget={state.budget}
                onClose={() => setBudgetOpen(false)}
                onSubmit={(budget) => {
                  updateBudget(budget);
                  setBudgetOpen(false);
                  showToast("Budget updated");
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
        </div>
      )}
    </>
  );
}
