import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
      // Very basic eval since Function is restricted in Hermes/React Native in some contexts
      // A simple regex-based parser or basic JS eval if available.
      // Since RN usually supports basic eval for arithmetic:
      const result = eval(mathStr) as number;
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

  const buttons: (string | { label: string; value: string })[] = [
    "7", "8", "9", { label: "÷", value: "÷" },
    "4", "5", "6", { label: "×", value: "×" },
    "1", "2", "3", { label: "−", value: "-" },
    ".", "0", { label: "⌫", value: "backspace" }, { label: "+", value: "+" },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen((v) => !v)}
        style={[styles.toggleBtn, open ? styles.toggleBtnActive : styles.toggleBtnInactive]}
      >
        <Feather name="cpu" size={14} color={open ? "#8b6fff" : "#5a5a6e"} />
        <Text style={[styles.toggleText, open ? styles.toggleTextActive : styles.toggleTextInactive]}>
          Calculator
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.calcPanel}>
          <View style={styles.display}>
            <Text style={styles.displayText} numberOfLines={1}>
              {display || "0"}
            </Text>
          </View>

          <View style={styles.grid}>
            {buttons.map((btn, i) => {
              const isObj = typeof btn === "object";
              const label = isObj ? btn.label : btn;
              const value = isObj ? btn.value : btn;
              const isOperator = ["+", "-", "×", "÷"].includes(value);
              const isBackspace = value === "backspace";

              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isBackspace) handleBackspace();
                    else if (isOperator) handleOperator(value as Op);
                    else handleNumber(value);
                  }}
                  style={[
                    styles.calcBtn,
                    isOperator && styles.calcBtnOp,
                    isBackspace && styles.calcBtnDel,
                    !isOperator && !isBackspace && styles.calcBtnNum,
                  ]}
                >
                  <Text
                    style={[
                      styles.calcBtnText,
                      isOperator && styles.calcBtnTextOp,
                      isBackspace && styles.calcBtnTextDel,
                      !isOperator && !isBackspace && styles.calcBtnTextNum,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.bottomRow}>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={evaluate} style={styles.applyWrapper}>
              <LinearGradient
                colors={["#6c47ff", "#8b6fff"]}
                style={styles.applyBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.applyText}>= Apply</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleBtnInactive: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#1e1e28",
  },
  toggleBtnActive: {
    borderColor: "rgba(139,111,255,0.4)",
    backgroundColor: "rgba(108,71,255,0.15)",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  toggleTextInactive: {
    color: "#5a5a6e",
  },
  toggleTextActive: {
    color: "#8b6fff",
  },
  calcPanel: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#141419",
    padding: 12,
  },
  display: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#1e1e28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  displayText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  calcBtn: {
    width: "23%",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  calcBtnNum: {
    backgroundColor: "#252533",
    borderColor: "rgba(255,255,255,0.06)",
  },
  calcBtnOp: {
    backgroundColor: "rgba(108,71,255,0.2)",
    borderColor: "rgba(108,71,255,0.3)",
  },
  calcBtnDel: {
    backgroundColor: "rgba(255,79,107,0.1)",
    borderColor: "rgba(255,79,107,0.2)",
  },
  calcBtnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  calcBtnTextNum: {
    color: "#fff",
  },
  calcBtnTextOp: {
    color: "#8b6fff",
  },
  calcBtnTextDel: {
    color: "#ff4f6b",
  },
  bottomRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  clearBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1e1e28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    color: "#9898aa",
    fontSize: 12,
    fontWeight: "bold",
  },
  applyWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  applyBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  applyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
