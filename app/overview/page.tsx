"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, List, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { getCurrentMonthPrefix, getDaysInMonth, getPreviousMonthPrefix } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

import BankFilter from "@/components/BankFilter";
import BalanceCard from "@/components/BalanceCard";
import QuickStats from "@/components/QuickStats";
import PaymentBreakdown from "@/components/PaymentBreakdown";
import BottomNav from "@/components/BottomNav";
import ExpenseDrawer from "@/components/ExpenseDrawer";
import BudgetDrawer from "@/components/BudgetDrawer";
import PaymentMethodsDrawer from "@/components/PaymentMethodsDrawer";
import ViewExpensesDrawer from "@/components/ViewExpensesDrawer";
import Toast from "@/components/Toast";
import PageLoader, { DashboardSkeleton } from "@/components/PageLoader";

export default function OverviewPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    state,
    hydrated,
    addTransaction,
    editTransaction,
    deleteTransaction,
    clearAll,
    updateBudget,
    updateMonthlyBudget,
    getBudgetForMonth,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = useExpenses();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [viewExpensesOpen, setViewExpensesOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const currentMonth = getCurrentMonthPrefix();
  const previousMonth = getPreviousMonthPrefix();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedBankId, setSelectedBankId] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const isCurrentMonth = selectedMonth === currentMonth;

  // Auth gate: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // Get the effective budget for the selected month
  const effectiveBudget = getBudgetForMonth(selectedMonth);

  const monthTxs = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(selectedMonth) && (selectedBankId === "all" || t.bankId === selectedBankId)),
    [state.transactions, selectedMonth, selectedBankId]
  );
  
  const expenses = useMemo(() => monthTxs.filter((t) => t.type === "expense"), [monthTxs]);
  const income = useMemo(() => monthTxs.filter((t) => t.type === "income"), [monthTxs]);

  const totalSpent = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const balance = effectiveBudget - totalSpent;
  const pct = Math.min(100, Math.round((totalSpent / effectiveBudget) * 100));
  const dayCount = isCurrentMonth ? new Date().getDate() : getDaysInMonth(selectedMonth);
  const dailyAvg = dayCount > 0 ? totalSpent / dayCount : 0;

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDrawerOpen(true);
  };

  // Show loader while auth or data is loading
  if (loading) return <PageLoader message="Signing you in..." />;
  if (!user) return null;
  if (!hydrated) return <DashboardSkeleton />;

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-30 px-4 py-3 glass-nav border-b border-white/[0.06] flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa] hover:text-white"
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div className="text-center flex-1 mx-3">
          <h1 className="font-syne text-base font-bold text-white">Overview</h1>
          <p className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mt-0.5">Budget & Stats</p>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </nav>

      {/* Main Content */}
      <main className="flex-1 space-y-5 px-4 pb-6 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <BankFilter
            banks={state.banks}
            selectedBankId={selectedBankId}
            onBankChange={setSelectedBankId}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <BalanceCard
            balance={balance}
            totalSpent={totalSpent}
            budget={effectiveBudget}
            pct={pct}
            editable={isCurrentMonth}
            onEditBudget={() => setBudgetOpen(true)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <QuickStats totalIncome={totalIncome} dailyAvg={dailyAvg} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <PaymentBreakdown
            expenses={expenses}
            paymentMethods={state.paymentMethods || []}
          />
        </motion.div>

        {/* View All Expenses button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ translateY: -1 }}
            onClick={() => setViewExpensesOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/[0.06] bg-[#1e1e28] hover:bg-[#252533] text-sm font-semibold text-[#9898aa] hover:text-white transition-all mb-2"
          >
            <List size={16} className="text-[#8b6fff]" />
            View All Expenses
          </motion.button>
        </motion.div>
      </main>

      <BottomNav onAddClick={() => setDrawerOpen(true)} />

      {/* Expense Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <ExpenseDrawer
            banks={state.banks}
            paymentMethods={state.paymentMethods || []}
            editingTransaction={editingTransaction}
            onClose={() => {
              setDrawerOpen(false);
              setEditingTransaction(null);
            }}
            onSubmit={(data) => {
              addTransaction(data);
              setDrawerOpen(false);
              setEditingTransaction(null);
              showToast("Expense logged");
            }}
            onEdit={(id, data) => {
              editTransaction(id, data);
              setDrawerOpen(false);
              setEditingTransaction(null);
              showToast("Expense updated");
            }}
          />
        )}
      </AnimatePresence>

      {/* Budget Drawer */}
      <AnimatePresence>
        {budgetOpen && (
          <BudgetDrawer
            initialBudget={effectiveBudget}
            initialBudgetCycleStartDay={state.budgetCycleStartDay}
            onClose={() => setBudgetOpen(false)}
            onSubmit={(budget, budgetCycleStartDay) => {
              updateBudget(budget, budgetCycleStartDay);
              updateMonthlyBudget(selectedMonth, budget);
              setBudgetOpen(false);
              showToast("Budget updated");
            }}
          />
        )}
      </AnimatePresence>

      {/* Payment Methods Drawer */}
      <AnimatePresence>
        {paymentMethodsOpen && (
          <PaymentMethodsDrawer
            paymentMethods={state.paymentMethods || []}
            onClose={() => setPaymentMethodsOpen(false)}
            onAdd={(method) => {
              addPaymentMethod(method);
              showToast("Payment method added");
            }}
            onUpdate={(id, updates) => {
              updatePaymentMethod(id, updates);
              showToast("Payment method updated");
            }}
            onDelete={(id) => {
              deletePaymentMethod(id);
              showToast("Payment method removed");
            }}
          />
        )}
      </AnimatePresence>

      {/* View Expenses Drawer */}
      <AnimatePresence>
        {viewExpensesOpen && (
          <ViewExpensesDrawer
            transactions={monthTxs}
            banks={state.banks}
            editable={isCurrentMonth}
            onClose={() => setViewExpensesOpen(false)}
            onDelete={(id) => {
              deleteTransaction(id);
              showToast("Expense removed");
            }}
            onEdit={isCurrentMonth ? (tx) => {
              setViewExpensesOpen(false);
              handleEditTransaction(tx);
            } : undefined}
            onClearAll={() => {
              clearAll(selectedMonth);
              showToast("All expenses cleared");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
  );
}
