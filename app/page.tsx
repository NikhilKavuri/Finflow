"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { getCategoryById } from "@/lib/categories";
import { getCurrentMonthPrefix, getDaysInMonth, getPreviousMonthPrefix } from "@/lib/utils";
import Onboarding from "@/components/Onboarding";
import TopNav from "@/components/TopNav";
import BankFilter from "@/components/BankFilter";
import BalanceCard from "@/components/BalanceCard";
import QuickStats from "@/components/QuickStats";
import PaymentPlanCard from "@/components/PaymentPlanCard";
import PaymentBreakdown from "@/components/PaymentBreakdown";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import SpendFeed from "@/components/SpendFeed";
import BottomNav from "@/components/BottomNav";
import ExpenseDrawer from "@/components/ExpenseDrawer";
import BudgetDrawer from "@/components/BudgetDrawer";
import PaymentMethodsDrawer from "@/components/PaymentMethodsDrawer";
import ViewExpensesDrawer from "@/components/ViewExpensesDrawer";
import Toast from "@/components/Toast";
import PageLoader, { DashboardSkeleton } from "@/components/PageLoader";
import { List } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    state,
    hydrated,
    completeOnboarding,
    addTransaction,
    deleteTransaction,
    clearAll,
    clearCategory,
    updateBudget,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = useExpenses();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [viewExpensesOpen, setViewExpensesOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const currentMonth = getCurrentMonthPrefix();
  const previousMonth = getPreviousMonthPrefix();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
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

  // Initialize bank if not in list (skip for "all")
  useEffect(() => {
    if (selectedBankId !== "all" && !state.banks.find((b) => b.id === selectedBankId)) {
      setSelectedBankId("all");
    }
  }, [state.banks, selectedBankId]);

  const monthTxs = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(selectedMonth) && (selectedBankId === "all" || t.bankId === selectedBankId)),
    [state.transactions, selectedMonth, selectedBankId]
  );
  const expenses = useMemo(() => monthTxs.filter((t) => t.type === "expense"), [monthTxs]);
  const income = useMemo(() => monthTxs.filter((t) => t.type === "income"), [monthTxs]);
  const selectedCategory = selectedCategoryId ? getCategoryById(selectedCategoryId) : null;
  const categoryTxs = useMemo(
    () =>
      selectedCategoryId
        ? monthTxs.filter((t) => t.category === selectedCategoryId && t.type === "expense")
        : [],
    [monthTxs, selectedCategoryId]
  );
  const filteredCategoryTxs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return categoryTxs;
    return categoryTxs.filter((t) => t.name.toLowerCase().includes(query));
  }, [categoryTxs, searchTerm]);

  const totalSpent = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const balance = state.budget - totalSpent;
  const pct = Math.min(100, Math.round((totalSpent / state.budget) * 100));
  const dayCount = isCurrentMonth ? new Date().getDate() : getDaysInMonth(selectedMonth);
  const dailyAvg = dayCount > 0 ? totalSpent / dayCount : 0;

  // Show loader while auth or data is loading
  if (loading) return <PageLoader message="Signing you in..." />;
  if (!user) return null;
  if (!hydrated) return <DashboardSkeleton />;

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

          <BankFilter
            banks={state.banks}
            selectedBankId={selectedBankId}
            onBankChange={setSelectedBankId}
          />

          <main className="flex-1 space-y-5 px-4 pb-6 pt-2">
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

            <PaymentPlanCard
              transactions={state.transactions}
              paymentMethods={state.paymentMethods || []}
              budget={state.budget}
              budgetCycleStartDay={state.budgetCycleStartDay}
              selectedMonth={selectedMonth}
              onEditBudget={() => setBudgetOpen(true)}
              onManagePaymentMethods={() => setPaymentMethodsOpen(true)}
            />

            <PaymentBreakdown
              expenses={expenses}
              paymentMethods={state.paymentMethods || []}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <CategoryBreakdown
                expenses={expenses}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={(id) => {
                  setSelectedCategoryId((current) => (current === id ? null : id));
                  setSearchTerm("");
                }}
              />
            </motion.div>

            {/* View All Expenses button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ translateY: -1 }}
                onClick={() => setViewExpensesOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/[0.06] bg-[#1e1e28] hover:bg-[#252533] text-sm font-semibold text-[#9898aa] hover:text-white transition-all mb-4"
              >
                <List size={16} className="text-[#8b6fff]" />
                View All Expenses
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <AnimatePresence initial={false} mode="wait">
                {selectedCategory ? (
                  <motion.div
                    key="category-feed"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <SpendFeed
                      title={`${selectedCategory.name} feed`}
                      editable={isCurrentMonth}
                      searchable
                      searchPlaceholder={`Search in ${selectedCategory.name}`}
                      transactions={filteredCategoryTxs}
                      banks={state.banks}
                      onDelete={(id) => {
                        if (!isCurrentMonth) return;
                        deleteTransaction(id);
                        showToast("Expense removed");
                      }}
                      onClearAll={() => {
                        if (!isCurrentMonth || !selectedCategoryId) return;
                        clearCategory(selectedCategoryId, currentMonth);
                        showToast("Category expenses cleared");
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="feed-placeholder"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-3xl border border-white/[0.06] bg-[#15151d] px-4 py-7 text-center text-sm text-[#9a9aa8]">
                      Tap a category above to view its spend feed.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </main>

          <BottomNav disabled={!isCurrentMonth} onAddClick={() => setDrawerOpen(true)} />

          <AnimatePresence>
            {drawerOpen && (
              <ExpenseDrawer
                banks={state.banks}
                paymentMethods={state.paymentMethods || []}
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
                initialBudgetCycleStartDay={state.budgetCycleStartDay}
                onClose={() => setBudgetOpen(false)}
                onSubmit={(budget, budgetCycleStartDay) => {
                  updateBudget(budget, budgetCycleStartDay);
                  setBudgetOpen(false);
                  showToast("Budget updated");
                }}
              />
            )}
          </AnimatePresence>

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
                onClearAll={() => {
                  clearAll(selectedMonth);
                  showToast("All expenses cleared");
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
