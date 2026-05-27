"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Wallet, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, getCurrentMonthPrefix, parseBankBalance, sanitizeBankBalanceInput } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import PageLoader from "@/components/PageLoader";
import ViewExpensesDrawer from "@/components/ViewExpensesDrawer";
import Toast from "@/components/Toast";
import type { Bank } from "@/lib/types";

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const { state, hydrated, addBank, updateBank, deleteBank, deleteTransaction, clearAll } = useExpenses();
  const [isAdding, setIsAdding] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [viewBankExpenses, setViewBankExpenses] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const parsedBalance = parseBankBalance(bankBalance);

  const currentMonth = getCurrentMonthPrefix();

  // Calculate per-bank stats
  const bankStats = useMemo(() => {
    const stats: Record<string, { expenses: number; income: number; txCount: number }> = {};
    state.banks.forEach((b) => {
      stats[b.id] = { expenses: 0, income: 0, txCount: 0 };
    });
    state.transactions
      .filter((t) => t.date.startsWith(currentMonth))
      .forEach((tx) => {
        if (stats[tx.bankId]) {
          stats[tx.bankId].txCount++;
          if (tx.type === "expense") stats[tx.bankId].expenses += tx.amount;
          else stats[tx.bankId].income += tx.amount;
        }
      });
    return stats;
  }, [state.transactions, state.banks, currentMonth]);

  // Total balance
  const totalBalance = useMemo(
    () => state.banks.reduce((sum, b) => sum + (b.balance ?? 0), 0),
    [state.banks]
  );

  const totalInitial = useMemo(
    () => state.banks.reduce((sum, b) => sum + (b.initialBalance ?? b.balance ?? 0), 0),
    [state.banks]
  );

  const handleAddBank = () => {
    if (!bankName.trim()) return;
    if (parsedBalance === null) return;
    addBank({ name: bankName.trim(), balance: parsedBalance });
    setBankName("");
    setBankBalance("");
    setIsAdding(false);
  };

  const handleEditBank = (bank: Bank) => {
    setEditingBank(bank);
    setBankName(bank.name);
    setBankBalance((bank.initialBalance ?? bank.balance ?? 0).toString());
  };

  const handleUpdateBank = () => {
    if (!editingBank || !bankName.trim()) return;
    if (parsedBalance === null) return;
    const newInitialBalance = parsedBalance;
    const oldInitialBalance = editingBank.initialBalance ?? editingBank.balance ?? 0;
    const diff = newInitialBalance - oldInitialBalance;
    const currentBalance = (editingBank.balance ?? 0) + diff;
    updateBank(editingBank.id, {
      name: bankName.trim(),
      balance: currentBalance,
      initialBalance: newInitialBalance,
    });
    setEditingBank(null);
    setBankName("");
    setBankBalance("");
  };

  const handleDeleteBank = (id: string) => {
    if (state.banks.length <= 1) return;
    deleteBank(id);
  };

  const cancelEdit = () => {
    setEditingBank(null);
    setIsAdding(false);
    setBankName("");
    setBankBalance("");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  if (authLoading || !hydrated) {
    return <PageLoader message="Loading accounts..." />;
  }

  if (!user) return null;

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-30 px-5 py-4 glass-nav border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-[#8b6fff]" />
            <span className="font-syne text-xl font-black gradient-text">Accounts</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsAdding(true)}
            className="w-8 h-8 rounded-full bg-[#6c47ff]/20 flex items-center justify-center text-[#8b6fff]"
          >
            <Plus size={16} />
          </motion.button>
        </div>
      </nav>

      <main className="flex-1 px-4 pt-4 space-y-4">
        {/* Total Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-6 relative overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, #1a1030 0%, #0d1525 50%, #0f1a10 100%)",
            borderColor: "rgba(108,71,255,0.2)",
          }}
        >
          {/* Glow blobs */}
          <div className="absolute -top-14 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(108,71,255,0.18),transparent 70%)" }} />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(184,255,87,0.07),transparent 70%)" }} />

          <div className="relative z-10">
            <div className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-1">
              Total Balance
            </div>
            <div className="font-syne text-4xl font-black text-white leading-none mb-2">
              {formatINR(totalBalance)}
            </div>
            <div className="flex items-center gap-4 text-xs text-[#9898aa]">
              <span className="flex items-center gap-1">
                <ArrowUpDown size={12} className="text-[#8b6fff]" />
                {state.banks.length} {state.banks.length === 1 ? "account" : "accounts"}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={12} className="text-[#2ce88a]" />
                Initial: {formatINR(totalInitial)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {(isAdding || editingBank) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-[#1e1e28] rounded-2xl border border-white/10 space-y-3">
                <h3 className="font-syne text-sm font-bold text-white">
                  {editingBank ? "Edit Account" : "Add Account"}
                </h3>
                <input
                  type="text"
                  placeholder="Account name (e.g., SBI, HDFC)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#252533] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="^\d+(\.\d{0,2})?$"
                  placeholder="Initial balance (₹)"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(sanitizeBankBalanceInput(e.target.value))}
                  className="w-full bg-[#252533] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={editingBank ? handleUpdateBank : handleAddBank}
                    disabled={!bankName.trim() || parsedBalance === null}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#6c47ff] transition-colors"
                  >
                    {editingBank ? "Update" : "Add Account"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelEdit}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm text-[#9898aa] bg-white/5"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bank Cards */}
        <div className="space-y-3">
          {state.banks.map((bank, i) => {
            const stats = bankStats[bank.id] || { expenses: 0, income: 0, txCount: 0 };
            const initialBal = bank.initialBalance ?? bank.balance ?? 0;
            const currentBal = bank.balance ?? 0;
            const diff = currentBal - initialBal;

            return (
              <motion.div
                key={bank.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onClick={() => setViewBankExpenses(bank.id)}
                className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] hover:bg-[#252533] p-4 relative overflow-hidden cursor-pointer transition-colors"
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{
                    background: currentBal >= 0
                      ? "linear-gradient(90deg, #6c47ff, #8b6fff, transparent)"
                      : "linear-gradient(90deg, #ff4f6b, #ff6b35, transparent)",
                  }}
                />

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#6c47ff]/15 flex items-center justify-center text-lg flex-shrink-0">
                      🏦
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{bank.name}</h3>

                      {/* Current Balance */}
                      <div className="font-syne text-xl font-black text-white mt-1">
                        {formatINR(currentBal, 2)}
                      </div>

                      {/* Initial Balance - highlighted */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8b6fff]/10 border border-[#8b6fff]/20">
                          <span className="text-[9px] font-semibold text-[#8b6fff] uppercase tracking-wider">Initial</span>
                          <span className="text-[11px] font-bold text-[#8b6fff]">{formatINR(initialBal, 2)}</span>
                        </div>
                        {diff !== 0 && (
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${diff > 0 ? "text-[#2ce88a]" : "text-[#ff4f6b]"}`}>
                            {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {diff > 0 ? "+" : ""}{formatINR(diff, 2)}
                          </span>
                        )}
                      </div>

                      {/* Month stats */}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[#5a5a6e]">
                        {stats.txCount > 0 && (
                          <>
                            <span>{stats.txCount} expenses</span>
                            {stats.expenses > 0 && <span className="text-[#ff4f6b]">-{formatINR(stats.expenses)}</span>}
                            {stats.income > 0 && <span className="text-[#2ce88a]">+{formatINR(stats.income)}</span>}
                          </>
                        )}
                        {stats.txCount === 0 && <span>No expenses this month</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleEditBank(bank); }}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa] hover:text-white transition-colors"
                    >
                      <Edit2 size={13} />
                    </motion.button>
                    {state.banks.length > 1 && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteBank(bank.id); }}
                        className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {state.banks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏦</div>
            <p className="font-syne text-sm font-bold text-white">No accounts yet</p>
            <p className="text-xs text-[#5a5a6e] mt-1">Add your first bank account to get started</p>
          </div>
        )}
      </main>

      <BottomNav onAddClick={() => setIsAdding(true)} />

      <AnimatePresence>
        {viewBankExpenses && (
          <ViewExpensesDrawer
            transactions={state.transactions.filter((t) => t.bankId === viewBankExpenses && t.date.startsWith(currentMonth))}
            banks={state.banks}
            editable={true}
            onClose={() => setViewBankExpenses(null)}
            onDelete={(id) => {
              deleteTransaction(id);
              showToast("Expense removed");
            }}
            onClearAll={() => {
              // Clearing a bank's transactions would need custom logic, but for simplicity we don't allow clear all on the bank view
              // Actually, clearAll clears by month prefix, so we can just hide the clear all button if filtered by bank
              showToast("Cannot clear all from this view");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
  );
}
