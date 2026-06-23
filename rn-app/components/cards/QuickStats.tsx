import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatINR } from "@/lib/utils";

interface Props {
  totalIncome: number;
  dailyAvg: number;
}

export function QuickStats({ totalIncome, dailyAvg }: Props) {
  return (
    <View style={styles.container}>
      {/* Income Card */}
      <View style={styles.card}>
        <View style={[styles.topBorder, { backgroundColor: "#10b981" }]} />
        <View style={[styles.iconBox, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
          <Text style={styles.emoji}>💰</Text>
        </View>
        <Text style={styles.amountText}>{formatINR(totalIncome)}</Text>
        <Text style={styles.labelText}>This Month Income</Text>
      </View>

      {/* Daily Average Card */}
      <View style={styles.card}>
        <View style={[styles.topBorder, { backgroundColor: "#ef4444" }]} />
        <View style={[styles.iconBox, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
          <Text style={styles.emoji}>📉</Text>
        </View>
        <Text style={styles.amountText}>
          {formatINR(dailyAvg)}
          <Text style={styles.suffixText}>/day</Text>
        </Text>
        <Text style={styles.labelText}>Daily Avg Spend</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#18181f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
  },
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emoji: {
    fontSize: 16,
  },
  amountText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  suffixText: {
    color: "#9898aa",
    fontSize: 12,
    fontWeight: "normal",
  },
  labelText: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
});
