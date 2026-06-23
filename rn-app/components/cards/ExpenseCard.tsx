import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { formatINR, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

interface ExpenseCardProps {
  expense: Transaction;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const isIncome = expense.type === "income";

  // Try to find the category for emoji, fallback to payment method icon
  const categoryInfo = CATEGORIES.find(c => c.id === expense.category);
  
  const getPaymentMethodIcon = (method?: string) => {
    if (!method) return "zap";
    const icons: { [key: string]: string } = {
      card: "credit-card",
      credit_card: "credit-card",
      upi: "smartphone",
      cash: "dollar-sign",
      bank: "home",
      bank_transfer: "home",
      check: "file-text",
      other: "zap",
    };
    return icons[method] || "zap";
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <View style={styles.iconRow}>
          <View
            style={[
              styles.iconBox,
              isIncome ? styles.iconBoxIncome : styles.iconBoxExpense
            ]}
          >
            {categoryInfo ? (
              <Text style={{ fontSize: 18 }}>{categoryInfo.emoji}</Text>
            ) : (
              <Feather
                name={getPaymentMethodIcon(expense.paymentMethod) as any}
                size={18}
                color={isIncome ? "#10b981" : "#6c47ff"}
              />
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {expense.name}
            </Text>
            <Text style={styles.dateText}>
              {formatDate(expense.date)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text style={[styles.amount, isIncome ? styles.textIncome : styles.textExpense]}>
          {isIncome ? "+" : "-"}{formatINR(expense.amount)}
        </Text>
        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={[styles.actionBtn, styles.actionBtnEdit]}>
              <Feather name="edit-2" size={12} color="#8b6fff" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, styles.actionBtnDelete]}>
              <Feather name="trash-2" size={12} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#18181f",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxExpense: {
    backgroundColor: "rgba(108,71,255,0.1)",
  },
  iconBoxIncome: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  dateText: {
    color: "#9898aa",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  rightContent: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  textIncome: {
    color: "#10b981",
  },
  textExpense: {
    color: "#fff",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnEdit: {
    backgroundColor: "rgba(108,71,255,0.1)",
  },
  actionBtnDelete: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
});
