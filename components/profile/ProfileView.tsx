"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Edit2, Trash2, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExpenses } from "@/hooks/useExpenses";
import type { Bank } from "@/lib/types";

function parseRequiredBalance(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const balance = parseFloat(trimmed);
  return Number.isNaN(balance) ? null : balance;
}

export default function ProfileView() {
  const router = useRouter();
  const { state, addBank, updateBank, deleteBank } = useExpenses();
  const [isAdding, setIsAdding] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  const parsedBalance = parseRequiredBalance(bankBalance);
  const canSubmit = Boolean(bankName.trim()) && parsedBalance !== null;

  const handleAddBank = () => {
    if (!bankName.trim() || parsedBalance === null) return;
    addBank({ name: bankName.trim(), balance: parsedBalance });
    setBankName("");
    setBankBalance("");
    setIsAdding(false);
  };

  const handleEditBank = (bank: Bank) => {
    setEditingBank(bank);
    setBankName(bank.name);
    setBankBalance(bank.balance?.toString() || "");
  };

  const handleUpdateBank = () => {
    if (!editingBank || !bankName.trim() || parsedBalance === null) return;
    updateBank(editingBank.id, { name: bankName.trim(), balance: parsedBalance });
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

  return (
    <motion.div className="min-h-screen bg-[#0f0f14] text-white">
      <div className="sticky top-0 z-10 bg-[#0f0f14]/80 backdrop-blur-lg border-b border-white/[0.06]">
        <div className="flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="font-syne text-lg font-bold">Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne text-base font-bold flex items-center gap-2">
              <Banknote size={18} />
              Bank Accounts
            </h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAdding(true)}
              className="w-8 h-8 rounded-full bg-[#6c47ff]/20 flex items-center justify-center text-[#8b6fff]"
            >
              <Plus size={16} />
            </motion.button>
          </div>

          {(isAdding || editingBank) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-[#1e1e28] rounded-xl border border-white/10"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Bank name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#252533] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]"
                />
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  placeholder="Initial balance"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(e.target.value)}
                  className="w-full bg-[#252533] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={editingBank ? handleUpdateBank : handleAddBank}
                    disabled={!canSubmit}
                    className="flex-1 py-2 rounded-lg font-semibold text-white bg-[#6c47ff] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editingBank ? "Update" : "Add"} Bank
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-lg font-semibold text-[#9898aa] bg-white/5"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            {state.banks.map((bank) => (
              <motion.div
                key={bank.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-[#1e1e28] rounded-xl border border-white/[0.06]"
              >
                <div className="flex-1">
                  <div className="font-semibold text-white">{bank.name}</div>
                  {bank.balance !== undefined && (
                    <div className="text-sm text-[#9898aa]">
                      Balance: ₹{bank.balance.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEditBank(bank)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa] hover:text-white"
                  >
                    <Edit2 size={14} />
                  </motion.button>
                  {state.banks.length > 1 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteBank(bank.id)}
                      className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {state.banks.length === 0 && (
            <div className="text-center py-8 text-[#5a5a6e]">
              No bank accounts yet. Add your first bank to get started.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
