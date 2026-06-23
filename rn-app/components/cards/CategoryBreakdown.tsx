import { View, Text, StyleSheet } from "react-native";
import { CATEGORIES } from "@/lib/categories";
import { formatINR } from "@/lib/utils";

interface CategoryBreakdownProps {
  expenses: any[];
}

export function CategoryBreakdown({ expenses }: CategoryBreakdownProps) {
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
    return acc;
  }, {} as { [key: string]: number });

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  const total = Object.values(categoryTotals).reduce((a, b) => (a as number) + (b as number), 0) as number;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Top Categories</Text>

      {sortedCategories.length === 0 ? (
        <Text style={styles.emptyText}>No expenses yet</Text>
      ) : (
        <View style={styles.list}>
          {sortedCategories.map(([category, amount]) => {
            const percentage = (total as number) > 0 ? ((amount as number) / (total as number)) * 100 : 0;
            const categoryInfo = CATEGORIES.find(
              (c) => c.id === category || c.name.toLowerCase() === category.toLowerCase()
            );

            return (
              <View key={category} style={styles.rowWrapper}>
                <View style={styles.headerRow}>
                  <View style={styles.leftInfo}>
                    <View style={styles.emojiBox}>
                      <Text style={styles.emoji}>{categoryInfo?.emoji || "💳"}</Text>
                    </View>
                    <Text style={styles.catName}>{categoryInfo?.name || category}</Text>
                  </View>
                  <Text style={styles.amountText}>{formatINR(amount as number)}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${percentage}%`, backgroundColor: categoryInfo?.color || "#6c47ff" }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
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
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyText: {
    color: "#5a5a6e",
    textAlign: "center",
    paddingVertical: 16,
  },
  list: {
    gap: 16,
  },
  rowWrapper: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  emojiBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 16,
  },
  catName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  amountText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  track: {
    height: 6,
    backgroundColor: "#1e1e28",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
