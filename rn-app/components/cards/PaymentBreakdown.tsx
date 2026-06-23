import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Transaction, PaymentMethodConfig } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface Props {
  expenses: Transaction[];
  paymentMethods: PaymentMethodConfig[];
}

const PM_COLORS: Record<string, string> = {
  credit_card: "#ff6b35",
  upi: "#8b6fff",
  cash: "#2ce88a",
  bank_transfer: "#38bdf8",
  other: "#9898aa",
};

const PM_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  upi: "UPI",
  cash: "Cash",
  bank_transfer: "Transfer",
  other: "Other",
};

export function PaymentBreakdown({ expenses, paymentMethods }: Props) {
  const breakdown = useMemo(() => {
    const map: Record<string, { amount: number; type: string; name: string; emoji: string }> = {};

    for (const tx of expenses) {
      const pmType = tx.paymentMethod || "other";
      const userPm =
        paymentMethods.find((pm) => pm.id === tx.paymentMethodId) ||
        paymentMethods.find((pm) => pm.type === pmType);
      const key = tx.paymentMethodId || pmType;

      if (!map[key]) {
        map[key] = {
          amount: 0,
          type: pmType,
          name: userPm?.name || PM_LABELS[pmType] || "Other",
          emoji: userPm?.emoji || "💳",
        };
      }
      map[key].amount += tx.amount;
    }

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [expenses, paymentMethods]);

  const total = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);

  if (breakdown.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Payment Methods</Text>

      {/* Stacked Bar */}
      <View style={styles.barContainer}>
        {breakdown.map((item, index) => {
          const pct = total > 0 ? (item.amount / total) * 100 : 0;
          return (
            <View
              key={`${item.type}-${index}`}
              style={[
                styles.barSegment,
                {
                  width: `${pct}%`,
                  backgroundColor: PM_COLORS[item.type] || PM_COLORS.other,
                }
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {breakdown.map((item, index) => {
          const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
          const color = PM_COLORS[item.type] || PM_COLORS.other;
          return (
            <View key={`${item.type}-${index}`} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View
                  style={[styles.dot, { backgroundColor: color }]}
                />
                <Text style={styles.legendName} numberOfLines={1}>
                  {item.emoji} {item.name}
                </Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendAmount}>{formatINR(item.amount)}</Text>
                <Text style={styles.legendPct}>{pct}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#18181f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  barContainer: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1e1e28",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 16,
  },
  barSegment: {
    height: "100%",
  },
  legendContainer: {
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    fontSize: 12,
    color: "#9898aa",
    flex: 1,
  },
  legendRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendAmount: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  legendPct: {
    fontSize: 12,
    color: "#5a5a6e",
    width: 32,
    textAlign: "right",
  },
});
