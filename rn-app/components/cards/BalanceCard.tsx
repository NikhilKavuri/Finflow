import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { formatINR } from "@/lib/utils";

interface Props {
  balance: number;
  totalSpent: number;
  budget: number;
  pct: number;
  editable?: boolean;
  onEditBudget: () => void;
  onClick?: () => void;
}

export function BalanceCard({
  balance,
  totalSpent,
  budget,
  pct,
  editable = true,
  onEditBudget,
  onClick,
}: Props) {
  const CardWrapper = onClick ? TouchableOpacity : View;

  return (
    <CardWrapper
      onPress={onClick}
      activeOpacity={onClick ? 0.9 : 1}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.flex1}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Balance Left</Text>
            {editable && (
              <TouchableOpacity
                onPress={onEditBudget}
                style={styles.editBtn}
              >
                <Feather name="edit-2" size={10} color="#9898aa" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.balanceText}>
            {formatINR(balance)}
          </Text>
          <Text style={styles.subtext}>
            of {formatINR(budget)} budget
          </Text>
        </View>

        <View style={styles.ring}>
          <Text style={styles.pctText}>{pct}%</Text>
          <Text style={styles.spentLabel}>spent</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#6c47ff",
            }
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {formatINR(totalSpent)} spent
        </Text>
        <Text style={styles.footerText}>
          {formatINR(budget)} budget
        </Text>
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#18181f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  titleText: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  editBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#1e1e28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  balanceText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
  },
  subtext: {
    color: "#9898aa",
    fontSize: 12,
    marginTop: 4,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: "#1e1e28",
    backgroundColor: "#141419",
    alignItems: "center",
    justifyContent: "center",
  },
  pctText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  spentLabel: {
    color: "#5a5a6e",
    fontSize: 8,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#1e1e28",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footerText: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "600",
  },
});
