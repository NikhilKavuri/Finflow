"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  Check,
  CreditCard,
  Edit2,
  Landmark,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { PaymentMethod, PaymentMethodConfig } from "@/lib/types";

interface Props {
  paymentMethods: PaymentMethodConfig[];
  onClose: () => void;
  onAdd: (method: Omit<PaymentMethodConfig, "id">) => void;
  onUpdate: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  onDelete: (id: string) => void;
}

interface MethodTypeOption {
  type: PaymentMethod;
  label: string;
  emoji: string;
  icon: LucideIcon;
}

const METHOD_TYPES: MethodTypeOption[] = [
  { type: "credit_card", label: "Credit Card", emoji: "💳", icon: CreditCard },
  { type: "upi", label: "UPI", emoji: "📱", icon: Smartphone },
  { type: "cash", label: "Cash", emoji: "💵", icon: Banknote },
  { type: "bank_transfer", label: "Transfer", emoji: "🏦", icon: Landmark },
  { type: "other", label: "Other", emoji: "💼", icon: Wallet },
];

function clampDay(value: string, fallback: number): number {
  const day = Number(value);
  if (!Number.isFinite(day)) return fallback;
  return Math.min(28, Math.max(1, Math.round(day)));
}

function getTypeOption(type: PaymentMethod): MethodTypeOption {
  return METHOD_TYPES.find((option) => option.type === type) ?? METHOD_TYPES[METHOD_TYPES.length - 1];
}

export default function PaymentMethodsDrawer({
  paymentMethods,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(paymentMethods.length === 0);
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentMethod>("credit_card");
  const [billingCycleStart, setBillingCycleStart] = useState("15");
  const [paymentDueDay, setPaymentDueDay] = useState("5");
  const [error, setError] = useState("");

  const editingMethod = useMemo(
    () => paymentMethods.find((method) => method.id === editingId) ?? null,
    [editingId, paymentMethods]
  );

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;

    const syncViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--visual-viewport-height", `${height}px`);
    };

    syncViewportHeight();
    document.body.style.overflow = "hidden";
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    window.visualViewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);

    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty("--visual-viewport-height");
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      window.visualViewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormOpen(false);
    setName("");
    setType("credit_card");
    setBillingCycleStart("15");
    setPaymentDueDay("5");
    setError("");
  };

  const startAdd = () => {
    setEditingId(null);
    setFormOpen(true);
    setName("");
    setType("credit_card");
    setBillingCycleStart("15");
    setPaymentDueDay("5");
    setError("");
  };

  const startEdit = (method: PaymentMethodConfig) => {
    setEditingId(method.id);
    setFormOpen(true);
    setName(method.name);
    setType(method.type);
    setBillingCycleStart(String(method.billingCycleStart ?? 15));
    setPaymentDueDay(String(method.paymentDueDay ?? 5));
    setError("");
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a payment method name.");
      return;
    }

    const option = getTypeOption(type);
    const payload: Omit<PaymentMethodConfig, "id"> = {
      name: trimmedName,
      type,
      emoji: option.emoji,
      billingCycleStart: type === "credit_card" ? clampDay(billingCycleStart, 15) : undefined,
      paymentDueDay: type === "credit_card" ? clampDay(paymentDueDay, 5) : undefined,
    };

    if (editingMethod) {
      onUpdate(editingMethod.id, payload);
    } else {
      onAdd(payload);
    }

    resetForm();
  };

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
        className="keyboard-panel fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-syne text-lg font-bold text-white">Payment Methods</h2>
              <p className="text-xs font-semibold text-[#5a5a6e]">Cards, UPI, cash, and due dates</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={startAdd}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6c47ff]/20 text-[#8b6fff]"
                aria-label="Add payment method"
              >
                <Plus size={16} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#9898aa]"
                aria-label="Close"
              >
                <X size={16} />
              </motion.button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[#ff4f6b]/20 bg-[#ff4f6b]/10 px-3 py-2 text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          <AnimatePresence initial={false}>
            {formOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-syne text-sm font-bold text-white">
                      {editingMethod ? "Edit Method" : "Add Method"}
                    </h3>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs font-bold text-[#5a5a6e] transition-colors hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    className="mb-4 w-full rounded-xl border border-white/10 bg-[#252533] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#5a5a6e] focus:border-[#8b6fff]"
                    placeholder="HDFC Credit Card"
                  />

                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
                    Type
                  </label>
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {METHOD_TYPES.map((option) => {
                      const Icon = option.icon;
                      const active = type === option.type;

                      return (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => {
                            setType(option.type);
                            setError("");
                          }}
                          className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold transition-colors ${
                            active
                              ? "border-[#8b6fff] bg-[#6c47ff]/20 text-[#8b6fff]"
                              : "border-white/10 bg-[#252533] text-[#9898aa]"
                          }`}
                        >
                          <Icon size={15} />
                          <span className="min-w-0 truncate">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {type === "credit_card" && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
                          Cycle Start
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={28}
                          value={billingCycleStart}
                          onChange={(event) => {
                            setBillingCycleStart(event.target.value);
                            setError("");
                          }}
                          className="w-full rounded-xl border border-white/10 bg-[#252533] px-3 py-3 text-center text-sm font-bold text-white outline-none transition-colors focus:border-[#8b6fff]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
                          Pay Day
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={28}
                          value={paymentDueDay}
                          onChange={(event) => {
                            setPaymentDueDay(event.target.value);
                            setError("");
                          }}
                          className="w-full rounded-xl border border-white/10 bg-[#252533] px-3 py-3 text-center text-sm font-bold text-white outline-none transition-colors focus:border-[#8b6fff]"
                        />
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6c47ff] py-3 font-syne text-sm font-bold text-white"
                  >
                    <Check size={16} />
                    Save Method
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {paymentMethods.map((method) => {
              const option = getTypeOption(method.type);
              const Icon = option.icon;

              return (
                <div
                  key={method.id}
                  className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#6c47ff]/15 text-[#8b6fff]">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">{method.name}</div>
                      <div className="mt-0.5 text-[11px] font-semibold text-[#5a5a6e]">
                        {option.label}
                      </div>
                      {method.type === "credit_card" && (
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#ffb830]/20 bg-[#ffb830]/10 px-2 py-1 text-[#ffb830]">
                            <CalendarDays size={11} />
                            Cycle {method.billingCycleStart ?? 15}
                          </span>
                          <span className="rounded-full border border-[#2ce88a]/20 bg-[#2ce88a]/10 px-2 py-1 text-[#2ce88a]">
                            Pay {method.paymentDueDay ?? 5}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => startEdit(method)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#9898aa] transition-colors hover:text-white"
                        aria-label={`Edit ${method.name}`}
                      >
                        <Edit2 size={13} />
                      </motion.button>
                      {paymentMethods.length > 1 && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (editingId === method.id) resetForm();
                            onDelete(method.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff4f6b]/10 text-[#ff4f6b] transition-colors hover:text-[#ff758a]"
                          aria-label={`Delete ${method.name}`}
                        >
                          <Trash2 size={13} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}
