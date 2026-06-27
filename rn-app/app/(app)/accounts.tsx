import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useExpenses } from "@/hooks/useExpenses";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { formatINR } from "@/lib/utils";
import type { Bank } from "@/lib/types";

export default function AccountsScreen() {
  const router = useRouter();
  const { state, hydrated, addBank, updateBank, deleteBank } = useExpenses();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  const [bankName, setBankName] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  const totalBalance = useMemo(
    () => state.banks.reduce((sum, b) => sum + (b.balance ?? 0), 0),
    [state.banks]
  );
  
  const initialTotal = useMemo(
    () => state.banks.reduce((sum, b) => sum + (b.initialBalance ?? 0), 0),
    [state.banks]
  );

  const handleOpenAddModal = () => {
    setEditingBank(null);
    setBankName("");
    setBankBalance("0");
    setFormOpen(true);
  };

  const handleOpenEditModal = (bank: Bank) => {
    setEditingBank(bank);
    setBankName(bank.name);
    setBankBalance(String(bank.balance ?? 0));
    setFormOpen(true);
  };

  const handleSaveBank = () => {
    const trimmedName = bankName.trim();
    if (!trimmedName) {
      alert("Please enter a bank name.");
      return;
    }

    const numBalance = parseFloat(bankBalance || "0");
    if (isNaN(numBalance)) {
      alert("Please enter a valid balance.");
      return;
    }

    if (editingBank) {
      updateBank(editingBank.id, {
        name: trimmedName,
        balance: numBalance,
        initialBalance: editingBank.initialBalance ?? numBalance, // keep old initial if editing
      });
    } else {
      addBank({
        name: trimmedName,
        balance: numBalance,
        initialBalance: numBalance,
      });
    }

    setFormOpen(false);
    setEditingBank(null);
  };

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b6fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="pocket" size={24} color="#8b6fff" />
              <MaskedView
                maskElement={
                  <Text style={styles.headerTitleMask}>Accounts</Text>
                }
              >
                <LinearGradient
                  colors={["#b8ff57", "#b8ff57"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.headerTitleMask, { opacity: 0 }]}>
                    Accounts
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>
            <TouchableOpacity onPress={handleOpenAddModal} style={styles.addBtn}>
              <Feather name="plus" size={18} color="#8b6fff" />
            </TouchableOpacity>
          </View>

          {/* TOTAL BALANCE CARD */}
          <Animated.View layout={Layout.springify()} style={styles.totalBalanceCardContainer}>
            <LinearGradient
              colors={["#1c1c28", "#12121a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.totalBalanceGradient}
            >
              <View style={styles.glowOrbTopRight} />
              
              <Text style={styles.totalBalanceLabel}>TOTAL BALANCE</Text>
              <Text style={styles.totalBalanceAmount}>
                {formatINR(totalBalance)}
              </Text>

              <View style={styles.totalBalanceStats}>
                <View style={styles.statItem}>
                  <Feather name="repeat" size={12} color="#8b6fff" />
                  <Text style={styles.statText}>
                    {state.banks.length} account{state.banks.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="trending-up" size={12} color="#b8ff57" />
                  <Text style={styles.statText}>Initial: {formatINR(initialTotal)}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* INLINE FORM (ADD/EDIT) */}
          {formOpen && (
            <Animated.View
              entering={FadeInUp.duration(400).springify()}
              exiting={FadeOutUp.duration(300)}
              layout={Layout.springify()}
              style={styles.formCard}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.formTitle}>
                {editingBank ? "Edit Account" : "Add Account"}
              </Text>
              
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                placeholder="Account name (e.g., SBI, HDFC)"
                placeholderTextColor="#5a5a6e"
                style={styles.input}
              />
              
              <TextInput
                keyboardType="numeric"
                value={bankBalance}
                onChangeText={(text) => setBankBalance(text.replace(/[^0-9.-]/g, ""))}
                placeholder="Initial balance (₹)"
                placeholderTextColor="#5a5a6e"
                style={styles.input}
              />

              <View style={styles.formActions}>
                <TouchableOpacity onPress={handleSaveBank} style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>
                    {editingBank ? "Update" : "Add Account"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setFormOpen(false);
                    setEditingBank(null);
                  }}
                  style={styles.btnSecondary}
                >
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* BANK CARDS LIST */}
          {state.banks.map((bank, index) => {
            const expensesForBank = state.transactions.filter(
              (t) => t.bankId === bank.id && t.type === "expense"
            );
            const expensesCount = expensesForBank.length;
            const expensesSum = expensesForBank.reduce((sum, t) => sum + t.amount, 0);
            const diff = (bank.balance ?? 0) - (bank.initialBalance ?? 0);
            
            // Add gradient border to top if it's the first card
            const isFirst = index === 0;

            return (
              <Animated.View 
                key={bank.id} 
                layout={Layout.springify()}
                style={[styles.bankCard, isFirst && styles.bankCardFirst]}
              >
                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                {isFirst && (
                  <View style={styles.bankCardBorderTop} />
                )}
                <View style={styles.bankCardHeader}>
                  <View style={styles.bankInfoRow}>
                    <View style={styles.bankIconContainer}>
                      <Text style={{ fontSize: 18 }}>🏦</Text>
                    </View>
                    <View>
                      <Text style={styles.bankName}>{bank.name}</Text>
                      <Text style={styles.bankBalance}>
                        {formatINR(bank.balance ?? 0)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenEditModal(bank)}
                    style={styles.editBtn}
                  >
                    <Feather name="edit-2" size={14} color="#5a5a6e" />
                  </TouchableOpacity>
                </View>

                <View style={styles.bankStatsRow}>
                  <View style={styles.badgeInitial}>
                    <Text style={styles.badgeInitialText}>
                      INITIAL {formatINR(bank.initialBalance ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.diffRow}>
                    <Feather name="trending-down" size={12} color="#ff4f6b" />
                    <Text style={styles.diffText}>
                      {diff < 0 ? "-" : ""}{formatINR(Math.abs(diff))}
                    </Text>
                  </View>
                </View>

                <View style={styles.bankExpensesRow}>
                  <Text style={styles.expensesCountText}>{expensesCount} expenses</Text>
                  <Text style={styles.expensesSumText}>-{formatINR(expensesSum)}</Text>
                </View>
              </Animated.View>
            );
          })}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* FAB to Add Expense */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/modals/add-expense")}
        style={styles.fabContainer}
      >
        <View style={styles.fabGlow} />
        <LinearGradient
          colors={["#6c47ff", "#8b6fff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Feather name="plus" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 32,
  },
  headerTitleMask: {
    fontSize: 26,
    fontWeight: "900",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a24",
    alignItems: "center",
    justifyContent: "center",
  },
  totalBalanceCardContainer: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  totalBalanceGradient: {
    padding: 24,
    position: "relative",
  },
  glowOrbTopRight: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(108, 71, 255, 0.15)",
  },
  totalBalanceLabel: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  totalBalanceAmount: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "900",
    marginBottom: 16,
  },
  totalBalanceStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: "#9898aa",
    fontSize: 12,
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "rgba(20, 20, 27, 0.4)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 24,
    overflow: "hidden",
  },
  formTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 12,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: "#6c47ff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: "#2a2a36",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: "#9898aa",
    fontWeight: "600",
    fontSize: 14,
  },
  bankCard: {
    backgroundColor: "rgba(20, 20, 27, 0.4)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  bankCardFirst: {
    borderColor: "transparent",
  },
  bankCardBorderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#ff6b4f", // Mockup shows orange-red gradient on top border for Default Bank
  },
  bankCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(108, 71, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  bankName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  bankBalance: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a24",
    alignItems: "center",
    justifyContent: "center",
  },
  bankStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
    marginLeft: 60,
  },
  badgeInitial: {
    backgroundColor: "rgba(108, 71, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeInitialText: {
    color: "#8b6fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  diffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  diffText: {
    color: "#ff4f6b",
    fontSize: 12,
    fontWeight: "700",
  },
  bankExpensesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
    marginLeft: 60,
  },
  expensesCountText: {
    color: "#5a5a6e",
    fontSize: 12,
    fontWeight: "500",
  },
  expensesSumText: {
    color: "#ff4f6b",
    fontSize: 12,
    fontWeight: "500",
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fabGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(108, 71, 255, 0.3)",
    transform: [{ scale: 1.2 }],
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6c47ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
});
