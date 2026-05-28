"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash2, Layers } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryById } from "@/lib/categories";
import type { SubExpense, Transaction, Bank, PaymentMethodConfig } from "@/lib/types";
import { computeGroupAmount, createSubExpenseId } from "@/lib/transactions";
import { formatINR, formatDate } from "@/lib/utils";
import ExpenseDrawer from "./ExpenseDrawer";

interface Props {
  banks: Bank[];
  paymentMethods: PaymentMethodConfig[];
  editingGroup?: Transaction | null;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, "id">) => void;
  onEdit?: (id: string, data: Partial<Omit<Transaction, "id">>) => void;
}

export default function CategoryGroupDrawer({
  banks,
  paymentMethods,
  editingGroup,
  onClose,
  onSubmit,
  onEdit,
}: Props) {
  const isEditing = !!editingGroup;

  const [groupName, setGroupName] = useState(editingGroup?.name || "");
  const [selectedCat, setSelectedCat] = useState<string | null>(editingGroup?.category || null);
  const [subExpenses, setSubExpenses] = useState<SubExpense[]>(editingGroup?.subExpenses || []);
  const [error, setError] = useState("");
  const [subDrawerOpen, setSubDrawerOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubExpense | null>(null);

  const total = computeGroupAmount(subExpenses);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSaveGroup = () => {
    if (!groupName.trim()) {
      setError("Enter a name for this category group.");
      return;
    }
    if (subExpenses.length === 0) {
      setError("Add at least one sub-expense.");
      return;
    }
    const cat = selectedCat ?? "other";
    const primaryBank = subExpenses[0]?.bankId || banks[0]?.id || "default";
    const groupData: Omit<Transaction, "id"> = {
      name: groupName.trim(),
      amount: total,
      category: cat,
      type: "expense",
      date: subExpenses.reduce((latest, s) => (s.date > latest ? s.date : latest), subExpenses[0].date),
      bankId: primaryBank,
      isGroup: true,
      subExpenses,
    };

    if (isEditing && editingGroup && onEdit) {
      onEdit(editingGroup.id, groupData);
    } else {
      onSubmit(groupData);
    }
  };

  const handleSubSubmit = (data: Omit<Transaction, "id">) => {
    const sub: SubExpense = {
      id: editingSub?.id || createSubExpenseId(),
      name: data.name,
      amount: data.amount,
      category: data.category,
      type: data.type,
      date: data.date,
      bankId: data.bankId,
      paymentMethod: data.paymentMethod,
      paymentMethodId: data.paymentMethodId,
    };

    if (editingSub) {
      setSubExpenses((prev) => prev.map((s) => (s.id === editingSub.id ? sub : s)));
    } else {
      setSubExpenses((prev) => [...prev, sub]);
    }
    setSubDrawerOpen(false);
    setEditingSub(null);
    setError("");
  };

  const subToTransaction = (sub: SubExpense): Transaction => ({
    ...sub,
    id: sub.id,
  });

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
        className="fixed left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%", bottom: 0, maxHeight: "92vh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb830]/15 text-[#ffb830]">
                <Layers size={18} />
              </div>
              <h2 className="font-syne text-lg font-bold text-white">
                {isEditing ? "Edit Category Group" : "Category Expense"}
              </h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#9898aa]"
            >
              <X size={16} />
            </motion.button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[#ff4f6b]/20 bg-[#ff4f6b]/10 px-3 py-2 text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
              Group name
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-[#1e1e28] px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none transition-colors focus:border-[#8b6fff]"
              placeholder="e.g. Weekend trip, Wedding, Home renovation..."
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
              Category
            </label>
            <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all ${
                    selectedCat === cat.id
                      ? "border-[#6c47ff] bg-[#6c47ff]/12"
                      : "border-white/[0.06] bg-[#1e1e28] hover:border-white/15"
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-[9px] leading-tight text-[#9898aa]">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
              Sub-expenses ({subExpenses.length})
            </label>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingSub(null);
                setSubDrawerOpen(true);
              }}
              className="flex items-center gap-1 rounded-full border border-[#8b6fff]/30 bg-[#6c47ff]/15 px-3 py-1.5 text-xs font-bold text-[#8b6fff]"
            >
              <Plus size={14} />
              Add item
            </motion.button>
          </div>

          {subExpenses.length === 0 ? (
            <div className="mb-5 rounded-2xl border border-dashed border-white/10 bg-[#1e1e28]/50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-[#9898aa]">No items yet</p>
              <p className="mt-1 text-xs text-[#5a5a6e]">
                Tap &quot;Add item&quot; to log each spend in this group.
              </p>
            </div>
          ) : (
            <div className="mb-5 flex flex-col gap-2">
              {subExpenses.map((sub) => {
                const cat = getCategoryById(sub.category);
                const bank = banks.find((b) => b.id === sub.bankId);
                return (
                  <motion.div
                    key={sub.id}
                    layout
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#1e1e28] px-3.5 py-3"
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base"
                      style={{ background: cat.color + "18" }}
                    >
                      {cat.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{sub.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#5a5a6e]">
                        <span>{formatDate(sub.date)}</span>
                        <span>·</span>
                        <span>{bank?.name || "Bank"}</span>
                      </div>
                    </div>
                    <div
                      className={`font-syne text-sm font-black ${
                        sub.type === "income" ? "text-[#2ce88a]" : "text-[#ff4f6b]"
                      }`}
                    >
                      {sub.type === "income" ? "+" : "-"}
                      {formatINR(sub.amount)}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSub(sub);
                          setSubDrawerOpen(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8b6fff]"
                        style={{ background: "rgba(108,71,255,0.08)" }}
                        aria-label="Edit sub-expense"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSubExpenses((prev) => prev.filter((s) => s.id !== sub.id));
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#ff4f6b]"
                        style={{ background: "rgba(255,79,107,0.08)" }}
                        aria-label="Remove sub-expense"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {subExpenses.length > 0 && (
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#ffb830]/20 bg-[#ffb830]/8 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#ffb830]/80">
                Group total
              </span>
              <span className="font-syne text-lg font-black text-white">{formatINR(total)}</span>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveGroup}
            className="w-full rounded-2xl py-4 font-syne text-base font-bold text-white glow-accent"
            style={{ background: "linear-gradient(135deg, #ffb830, #ff9f1c)" }}
          >
            {isEditing ? "Save Group ✦" : "Create Category Group ✦"}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {subDrawerOpen && (
          <ExpenseDrawer
            variant="sub"
            drawerTitle={editingSub ? "Edit Sub-Expense" : "Add Sub-Expense"}
            defaultCategory={selectedCat ?? editingSub?.category ?? undefined}
            banks={banks}
            paymentMethods={paymentMethods}
            editingTransaction={editingSub ? subToTransaction(editingSub) : null}
            onClose={() => {
              setSubDrawerOpen(false);
              setEditingSub(null);
            }}
            onSubmit={handleSubSubmit}
            onEdit={
              editingSub
                ? (_, data) => {
                    handleSubSubmit({ ...subToTransaction(editingSub), ...data } as Omit<Transaction, "id">);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}
