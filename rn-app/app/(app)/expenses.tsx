import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseCard } from "@/components/cards/ExpenseCard";
import { Feather } from "@expo/vector-icons";
import { CATEGORIES } from "@/lib/categories";
import { formatDate, formatINR } from "@/lib/utils";

export default function ExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, hydrated, deleteTransaction, clearCategory, clearAll, refresh } = useExpenses();

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Filtered transactions computation
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((tx) => {
      const matchesSearch = tx.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategoryFilter
        ? tx.category === selectedCategoryFilter
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [state.transactions, search, selectedCategoryFilter]);

  const totalSpent = useMemo(() => 
    filteredTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
  [filteredTransactions]);

  const totalIncome = useMemo(() => 
    filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
  [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: typeof filteredTransactions } = {};
    for (const tx of filteredTransactions) {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    }
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0])) // descending
      .map(([date, txs]) => ({ date, txs }));
  }, [filteredTransactions]);

  const handleOpenEditModal = (txId: string) => {
    router.push({ pathname: "/modals/add-expense", params: { id: txId } });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTransaction(id),
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert("Clear Data", "Are you sure you want to delete these transactions?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All",
        style: "destructive",
        onPress: () => {
          if (selectedCategoryFilter) {
            clearCategory(selectedCategoryFilter);
          } else if (search) {
             Alert.alert("Error", "Cannot bulk delete by text search yet.");
          } else {
            clearAll();
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]} edges={[]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <View style={styles.headerIcon}>
            <Feather name="file-text" size={20} color="#fff" />
          </View>
          <Text style={styles.titleText}>Expenses</Text>
        </View>
        <View style={styles.totalPill}>
          <Text style={styles.totalPillText}>✨ {state.transactions.length} total</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6b7280" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor="#6b7280"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.summaryCardSpent]}>
          <Text style={styles.summaryLabelSpent}>TOTAL SPENT</Text>
          <Text style={styles.summaryAmountSpent}>{formatINR(totalSpent)}</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardIncome]}>
          <Text style={styles.summaryLabelIncome}>TOTAL INCOME</Text>
          <Text style={styles.summaryAmountIncome}>{formatINR(totalIncome)}</Text>
        </View>
      </View>

      {/* Horizontal Category Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategoryFilter(null)}
            style={[
              styles.filterBtn,
              !selectedCategoryFilter ? styles.filterBtnActive : styles.filterBtnInactive
            ]}
          >
            <Text
              style={[
                styles.filterText,
                !selectedCategoryFilter ? styles.filterTextActive : styles.filterTextInactive
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategoryFilter(cat.id)}
              style={[
                styles.filterBtn,
                selectedCategoryFilter === cat.id ? styles.filterBtnActive : styles.filterBtnInactive
              ]}
            >
              <Text style={styles.filterEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.filterText,
                  selectedCategoryFilter === cat.id ? styles.filterTextActive : styles.filterTextInactive
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <ScrollView 
        style={styles.flex1} 
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6c47ff"
          />
        }
      >
        {groupedTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Feather name="inbox" size={32} color="#5a5a6e" />
            </View>
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptyDesc}>
              Add new transactions using the center "+" button in the tab bar.
            </Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 40 }}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>HISTORY</Text>
              <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {groupedTransactions.map((group) => (
              <View key={group.date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{formatDate(group.date).toUpperCase()}</Text>
                <View style={{ gap: 10 }}>
                  {group.txs.map((tx) => (
                    <ExpenseCard
                      key={tx.id}
                      expense={tx}
                      onEdit={() => handleOpenEditModal(tx.id)}
                      onDelete={() => handleDelete(tx.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  flex1: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(108,71,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(108,71,255,0.3)",
  },
  titleText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  totalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  totalPillText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  summaryCardSpent: {
    backgroundColor: "rgba(239,68,68,0.05)",
    borderColor: "rgba(239,68,68,0.2)",
  },
  summaryCardIncome: {
    backgroundColor: "rgba(16,185,129,0.05)",
    borderColor: "rgba(16,185,129,0.2)",
  },
  summaryLabelSpent: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryLabelIncome: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryAmountSpent: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
  },
  summaryAmountIncome: {
    color: "#10b981",
    fontSize: 18,
    fontWeight: "bold",
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnActive: {
    borderColor: "rgba(108,71,255,0.4)",
    backgroundColor: "rgba(108,71,255,0.15)",
  },
  filterBtnInactive: {
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#18181f",
  },
  filterEmoji: {
    fontSize: 12,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  filterTextActive: {
    color: "#8b6fff",
  },
  filterTextInactive: {
    color: "#9898aa",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  clearBtnText: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "bold",
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    color: "#9898aa",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#18181f",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginTop: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyDesc: {
    color: "#5a5a6e",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 40,
  },
});
