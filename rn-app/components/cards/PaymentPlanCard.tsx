import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { PaymentMethodConfig, Transaction } from "@/lib/types";
import { getPaymentPlan } from "@/lib/payment-planning";
import { formatINR } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  paymentMethods: PaymentMethodConfig[];
  budget: number;
  budgetCycleStartDay: number;
  selectedMonth: string;
  onEditBudget: () => void;
  onManagePaymentMethods: () => void;
  onClick?: () => void;
}

function formatShortDate(date: string): string {
  const dt = new Date(`${date}T00:00:00`);
  return dt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function PaymentPlanCard({
  transactions,
  paymentMethods,
  budget,
  budgetCycleStartDay,
  selectedMonth,
  onEditBudget,
  onManagePaymentMethods,
  onClick,
}: Props) {
  const plan = useMemo(
    () =>
      getPaymentPlan({
        transactions,
        paymentMethods,
        budget,
        budgetCycleStartDay,
        selectedMonth,
      }),
    [transactions, paymentMethods, budget, budgetCycleStartDay, selectedMonth]
  );

  const pct = budget > 0 ? Math.min(100, Math.round((plan.totalPlannedSpend / budget) * 100)) : 0;
  const overBudget = plan.budgetLeft < 0;
  const incomeGap = plan.income > 0 ? plan.income - plan.totalPlannedSpend : null;
  const visibleBills = plan.cardBills.filter((bill) => bill.amount > 0);

  const CardWrapper = onClick ? TouchableOpacity : View;

  return (
    <CardWrapper
      onPress={onClick}
      activeOpacity={onClick ? 0.95 : 1}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.flex1}>
          <View style={styles.titleRow}>
            <Feather name="folder" size={16} color="#b8ff57" />
            <Text style={styles.titleText}>Budget Window</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEditBudget();
            }}
            style={styles.calendarRow}
          >
            <Feather name="calendar" size={12} color="#8b6fff" />
            <Text style={styles.calendarText}>
              {formatShortDate(plan.window.start)} - {formatShortDate(plan.window.end)}
            </Text>
            <Text style={styles.dayText}>Day {budgetCycleStartDay}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onManagePaymentMethods();
          }}
          style={styles.settingsBtn}
        >
          <Feather name="sliders" size={15} color="#9898aa" />
        </TouchableOpacity>
      </View>

      {/* Spend Info */}
      <View style={styles.spendInfo}>
        <View style={styles.flex1}>
          <Text style={[styles.mainAmount, overBudget ? styles.textRed : styles.textWhite]}>
            {overBudget ? "-" : ""}{formatINR(Math.abs(plan.budgetLeft))}
          </Text>
          <Text style={styles.subtext}>
            {overBudget ? "deficit against budget" : "left after spends and card reserve"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.totalSpentText}>{formatINR(plan.totalPlannedSpend)}</Text>
          <Text style={styles.subtext}>of {formatINR(budget)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: overBudget ? "#ef4444" : "#6c47ff" }
          ]}
        />
      </View>

      {/* Spends Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailTitle}>
            <Feather name="credit-card" size={13} color="#8b6fff" />
            <Text style={styles.detailLabel}>Direct payments</Text>
          </View>
          <Text style={styles.detailValue}>{formatINR(plan.directSpend)}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailTitle}>
            <Feather name="credit-card" size={13} color="#f59e0b" />
            <Text style={styles.detailLabel}>Card bills due</Text>
          </View>
          <Text style={styles.detailValue}>{formatINR(plan.cardDueTotal)}</Text>
        </View>

        {plan.reservedCardSpend > 0 && (
          <View style={styles.detailRow}>
            <View style={styles.detailTitle}>
              <Feather name="lock" size={13} color="#f97316" />
              <Text style={[styles.detailLabel, { color: "#f97316" }]}>🔒 Reserved (deducted)</Text>
            </View>
            <Text style={[styles.detailValue, { color: "#f97316" }]}>{formatINR(plan.reservedCardSpend)}</Text>
          </View>
        )}

        {plan.cardFutureTotal > 0 && (
          <View style={styles.detailRow}>
            <View style={styles.detailTitle}>
              <Feather name="credit-card" size={13} color="#8b6fff" />
              <Text style={styles.detailLabel}>Reserved card swipes</Text>
            </View>
            <Text style={styles.detailValue}>{formatINR(plan.cardFutureTotal)}</Text>
          </View>
        )}

        {incomeGap !== null && (
          <View style={styles.detailRow}>
            <View style={styles.detailTitle}>
              <Feather name={incomeGap < 0 ? "trending-down" : "trending-up"} size={13} color={incomeGap < 0 ? "#ef4444" : "#10b981"} />
              <Text style={styles.detailLabel}>Income cover</Text>
            </View>
            <Text style={[styles.detailValue, { color: incomeGap < 0 ? "#ef4444" : "#10b981" }]}>
              {incomeGap < 0 ? "-" : "+"}{formatINR(Math.abs(incomeGap))}
            </Text>
          </View>
        )}
      </View>

      {/* Credit Card Bills breakdown */}
      {visibleBills.length > 0 && (
        <View style={styles.billsContainer}>
          {visibleBills.map((bill, index) => (
            <View key={`${bill.paymentMethodId}-${bill.dueDate}-${index}`} style={styles.billRow}>
              <View style={styles.billEmojiBox}>
                <Text style={styles.billEmoji}>{bill.emoji}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.billName}>{bill.name}</Text>
                <Text style={styles.billDates}>
                  Due {formatShortDate(bill.dueDate)} - {formatShortDate(bill.cycleStart)}-{formatShortDate(bill.cycleEnd)}
                </Text>
              </View>
              <Text style={styles.billAmount}>{formatINR(bill.amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: "#18181f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  calendarRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calendarText: {
    color: "#8b6fff",
    fontSize: 12,
    fontWeight: "600",
  },
  dayText: {
    color: "#9898aa",
    fontSize: 12,
    fontWeight: "600",
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  spendInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  mainAmount: {
    fontSize: 32,
    fontWeight: "900",
  },
  textWhite: { color: "#fff" },
  textRed: { color: "#ef4444" },
  subtext: {
    color: "#9898aa",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  totalSpentText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#1e1e28",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    color: "#9898aa",
    fontSize: 12,
  },
  detailValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  billsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
    gap: 8,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  billEmojiBox: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(234,179,8,0.1)",
  },
  billEmoji: {
    fontSize: 16,
  },
  billName: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 12,
  },
  billDates: {
    color: "#9898aa",
    fontSize: 10,
    fontWeight: "600",
  },
  billAmount: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 12,
  },
});
