import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseCard } from "@/components/cards/ExpenseCard";
import { Feather } from "@expo/vector-icons";
import { CATEGORIES } from "@/lib/categories";

export default function ExpensesScreen() {
  const router = useRouter();
  const { state, hydrated, deleteTransaction } = useExpenses();

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

  const handleOpenAddModal = () => {
    router.push("/modals/add-expense");
  };

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

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Expenses</Text>
        <TouchableOpacity
          onPress={handleOpenAddModal}
          style={styles.addBtn}
        >
          <Feather name="plus" size={20} color="#b8ff57" />
        </TouchableOpacity>
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
      <ScrollView style={styles.flex1} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Feather name="inbox" size={32} color="#5a5a6e" />
            </View>
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptyDesc}>
              Add new transactions using the "+" button in the header.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, paddingBottom: 40 }}>
            {filteredTransactions.map((tx) => (
              <ExpenseCard
                key={tx.id}
                expense={tx}
                onEdit={() => handleOpenEditModal(tx.id)}
                onDelete={() => handleDelete(tx.id)}
              />
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
    paddingTop: 32,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(184,255,87,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(184,255,87,0.2)",
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
