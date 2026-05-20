"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Delete, Equal } from "lucide-react";

interface Props {
  onResult: (value: number) => void;
  currentValue?: string;
}

type Op = "+" | "-" | "×" | "÷";

export default function InlineCalculator({ onResult, currentValue }: Props) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState(currentValue || "");
  const [expression, setExpression] = useState<string[]>([]);
  const [currentNum, setCurrentNum] = useState(currentValue || "");
  const [lastOp, setLastOp] = useState<Op | null>(null);

  const handleNumber = useCallback((num: string) => {
    if (num === "." && currentNum.includes(".")) return;
    const next = currentNum + num;
    setCurrentNum(next);
    setDisplay([...expression, next].join(" "));
  }, [currentNum, expression]);

  const handleOperator = useCallback((op: Op) => {
    if (!currentNum && expression.length === 0) return;
    if (currentNum) {
      setExpression((prev) => [...prev, currentNum, op]);
      setDisplay([...expression, currentNum, op].join(" "));
      setCurrentNum("");
    } else if (expression.length > 0) {
      // Replace last operator
      const newExp = [...expression];
      newExp[newExp.length - 1] = op;
      setExpression(newExp);
      setDisplay(newExp.join(" "));
    }
  }, [currentNum, expression]);

  const evaluate = useCallback(() => {
    const parts = currentNum ? [...expression, currentNum] : [...expression];
    if (parts.length === 0) return;

    // Build a math expression string
    const mathStr = parts
      .map((p) => (p === "×" ? "*" : p === "÷" ? "/" : p))
      .join(" ");

    try {
      // Safe eval using Function constructor
      const result = new Function(`"use strict"; return (${mathStr})`)() as number;
      if (!Number.isFinite(result)) return;
      const rounded = Math.round(result * 100) / 100;
      onResult(rounded);
      setDisplay(String(rounded));
      setCurrentNum(String(rounded));
      setExpression([]);
    } catch {
      // Invalid expression — ignore
    }
  }, [expression, currentNum, onResult]);

  const handleClear = useCallback(() => {
    setDisplay("");
    setExpression([]);
    setCurrentNum("");
    setLastOp(null);
  }, []);

  const handleBackspace = useCallback(() => {
    if (currentNum.length > 0) {
      const next = currentNum.slice(0, -1);
      setCurrentNum(next);
      setDisplay([...expression, next].join(" "));
    } else if (expression.length > 0) {
      const newExp = expression.slice(0, -1);
      setExpression(newExp);
      if (newExp.length > 0) {
        const lastItem = newExp[newExp.length - 1];
        if (!["+", "-", "×", "÷"].includes(lastItem)) {
          setCurrentNum(lastItem);
          setExpression(newExp.slice(0, -1));
        }
      }
      setDisplay(newExp.join(" "));
    }
  }, [currentNum, expression]);

  const buttons: (string | { label: string; value: string; span?: number; accent?: boolean })[] = [
    "7", "8", "9", { label: "÷", value: "÷" },
    "4", "5", "6", { label: "×", value: "×" },
    "1", "2", "3", { label: "−", value: "-" },
    ".", "0", { label: "⌫", value: "backspace" }, { label: "+", value: "+" },
  ];

  return (
    <div className="mt-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          open
            ? "border-[#8b6fff]/40 bg-[#6c47ff]/15 text-[#8b6fff]"
            : "border-white/10 bg-[#1e1e28] text-[#5a5a6e] hover:text-[#9898aa]"
        }`}
      >
        <Calculator size={13} />
        Calculator
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-2xl border border-white/[0.08] bg-[#141419] p-3">
              {/* Display */}
              <div className="mb-2 rounded-xl bg-[#1e1e28] border border-white/[0.06] px-3 py-2.5 min-h-[40px] flex items-center">
                <span className="text-sm text-white font-mono flex-1 truncate">
                  {display || "0"}
                </span>
              </div>

              {/* Buttons Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {buttons.map((btn, i) => {
                  const isObj = typeof btn === "object";
                  const label = isObj ? btn.label : btn;
                  const value = isObj ? btn.value : btn;
                  const isOperator = ["+", "-", "×", "÷"].includes(value);
                  const isBackspace = value === "backspace";

                  return (
                    <motion.button
                      key={i}
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (isBackspace) handleBackspace();
                        else if (isOperator) handleOperator(value as Op);
                        else handleNumber(value);
                      }}
                      className={`h-10 rounded-xl text-sm font-bold transition-all ${
                        isOperator
                          ? "bg-[#6c47ff]/20 text-[#8b6fff] border border-[#6c47ff]/30 hover:bg-[#6c47ff]/30"
                          : isBackspace
                          ? "bg-[#ff4f6b]/10 text-[#ff4f6b] border border-[#ff4f6b]/20 hover:bg-[#ff4f6b]/20"
                          : "bg-[#252533] text-white border border-white/[0.06] hover:bg-[#2f2f40]"
                      }`}
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom row: Clear and Equals */}
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClear}
                  className="h-10 rounded-xl text-xs font-bold bg-[#1e1e28] border border-white/[0.06] text-[#9898aa] hover:text-white transition-all"
                >
                  Clear
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={evaluate}
                  className="h-10 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
                >
                  = Apply
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
