import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "expo-router";
import { auth } from "@/lib/firebase";
import { useExpenses } from "@/hooks/useExpenses";
import { BalanceCard } from "@/components/cards/BalanceCard";
import { QuickStats } from "@/components/cards/QuickStats";
import { CategoryBreakdown } from "@/components/cards/CategoryBreakdown";
import { SpendFeed } from "@/components/SpendFeed";
import { PaymentPlanCard } from "@/components/cards/PaymentPlanCard";
import { PaymentBreakdown } from "@/components/cards/PaymentBreakdown";
import { BankFilter } from "@/components/BankFilter";
import { Feather } from "@expo/vector-icons";
import {
  getCurrentMonthPrefix,
  getPreviousMonthPrefix,
  formatMonthLabel,
  getDaysInMonth,
  formatINR,
} from "@/lib/utils";
import type { PaymentMethod, PaymentMethodConfig } from "@/lib/types";
import { LinearGradient } from "expo-linear-gradient";

const BUDGET_PRESETS = [40000, 80000, 120000, 200000];

const METHOD_TYPES: { type: PaymentMethod; label: string; emoji: string; icon: string }[] = [
  { type: "credit_card", label: "Credit Card", emoji: "💳", icon: "credit-card" },
  { type: "upi", label: "UPI", emoji: "📱", icon: "smartphone" },
  { type: "cash", label: "Cash", emoji: "💵", icon: "dollar-sign" },
  { type: "bank_transfer", label: "Transfer", emoji: "🏦", icon: "home" },
  { type: "other", label: "Other", emoji: "💼", icon: "briefcase" },
];

export default function OverviewScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const {
    state,
    hydrated,
    updateBudget,
    updateMonthlyBudget,
    getBudgetForMonth,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = useExpenses();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("all");

  const currentMonth = getCurrentMonthPrefix();
  const previousMonth = getPreviousMonthPrefix();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const effectiveBudget = getBudgetForMonth(selectedMonth);

  // Modals visibility
  const [detailOpen, setDetailOpen] = useState(false);
  // Auto-open budget if 0 on current month
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);

  // Budget Modal state
  const [tempBudget, setTempBudget] = useState("");
  const [tempSalaryDay, setTempSalaryDay] = useState("");

  // Payment Method Modal state
  const [methodFormOpen, setMethodFormOpen] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState("");
  const [methodType, setMethodType] = useState<PaymentMethod>("credit_card");
  const [billingCycleStart, setBillingCycleStart] = useState("15");
  const [paymentDueDay, setPaymentDueDay] = useState("5");

  const isCurrentMonth = selectedMonth === currentMonth;

  useEffect(() => {
    if (hydrated && isCurrentMonth && effectiveBudget === 0) {
      setTempBudget("");
      setTempSalaryDay("1");
      setBudgetOpen(true);
    }
  }, [hydrated, isCurrentMonth, effectiveBudget]);

  // Calculations

  const monthTxs = useMemo(() => {
    return state.transactions.filter(
      (t) =>
        t.date.startsWith(selectedMonth) &&
        (selectedBankId === "all" || t.bankId === selectedBankId)
    );
  }, [state.transactions, selectedMonth, selectedBankId]);

  const expenses = useMemo(() => monthTxs.filter((t) => t.type === "expense"), [monthTxs]);
  const income = useMemo(() => monthTxs.filter((t) => t.type === "income"), [monthTxs]);

  const totalSpent = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const balanceLeft = effectiveBudget - totalSpent;
  const pct = useMemo(() => {
    return effectiveBudget > 0 ? Math.min(100, Math.round((totalSpent / effectiveBudget) * 100)) : 0;
  }, [totalSpent, effectiveBudget]);

  const dayCount = isCurrentMonth ? new Date().getDate() : getDaysInMonth(selectedMonth);
  const dailyAvg = dayCount > 0 ? totalSpent / dayCount : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const handleOpenBudgetModal = () => {
    setTempBudget(String(effectiveBudget));
    setTempSalaryDay(String(state.budgetCycleStartDay));
    setBudgetOpen(true);
  };

  const handleSaveBudget = () => {
    const numBudget = Number(tempBudget);
    const numSalaryDay = Number(tempSalaryDay);

    if (isNaN(numBudget) || numBudget < 1000) {
      alert("Please enter a valid budget of at least 1000.");
      return;
    }
    if (isNaN(numSalaryDay) || numSalaryDay < 1 || numSalaryDay > 28) {
      alert("Please enter a valid salary day between 1 and 28.");
      return;
    }

    updateBudget(Math.round(numBudget), Math.round(numSalaryDay));
    updateMonthlyBudget(selectedMonth, Math.round(numBudget));
    setBudgetOpen(false);
  };

  const handleOpenPaymentMethods = () => {
    setPaymentMethodsOpen(true);
    setMethodFormOpen(false);
    setEditingMethodId(null);
  };

  const handleSavePaymentMethod = () => {
    const trimmed = methodName.trim();
    if (!trimmed) {
      alert("Please enter a name.");
      return;
    }

    const matchedOption = METHOD_TYPES.find((m) => m.type === methodType) || METHOD_TYPES[4];
    const payload: Omit<PaymentMethodConfig, "id"> = {
      name: trimmed,
      type: methodType,
      emoji: matchedOption.emoji,
      billingCycleStart: methodType === "credit_card" ? Number(billingCycleStart) : undefined,
      paymentDueDay: methodType === "credit_card" ? Number(paymentDueDay) : undefined,
    };

    if (editingMethodId) {
      updatePaymentMethod(editingMethodId, payload);
    } else {
      addPaymentMethod(payload);
    }

    setMethodName("");
    setMethodType("credit_card");
    setBillingCycleStart("15");
    setPaymentDueDay("5");
    setMethodFormOpen(false);
    setEditingMethodId(null);
  };

  const handleStartEditMethod = (pm: PaymentMethodConfig) => {
    setEditingMethodId(pm.id);
    setMethodName(pm.name);
    setMethodType(pm.type);
    setBillingCycleStart(String(pm.billingCycleStart ?? 15));
    setPaymentDueDay(String(pm.paymentDueDay ?? 5));
    setMethodFormOpen(true);
  };

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  const handleOpenAddModal = () => {
    router.push("/modals/add-expense");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6c47ff"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.displayName || "Finflow User"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={handleOpenAddModal} style={styles.plusBtn}>
              <Feather name="plus" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bellBtn}>
              <Feather name="bell" size={18} color="#9898aa" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Selector Buttons */}
        <View style={styles.monthSelectorRow}>
          <TouchableOpacity
            onPress={() => setSelectedMonth(currentMonth)}
            style={[styles.monthBtn, selectedMonth === currentMonth ? styles.monthBtnActive : styles.monthBtnInactive]}
          >
            <Text style={[styles.monthText, selectedMonth === currentMonth ? styles.monthTextActive : styles.monthTextInactive]}>
              {formatMonthLabel(currentMonth)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedMonth(previousMonth)}
            style={[styles.monthBtn, selectedMonth === previousMonth ? styles.monthBtnActive : styles.monthBtnInactive]}
          >
            <Text style={[styles.monthText, selectedMonth === previousMonth ? styles.monthTextActive : styles.monthTextInactive]}>
              {formatMonthLabel(previousMonth)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentPadding}>
          {/* Payment Planning Card */}
          <PaymentPlanCard
            transactions={state.transactions}
            paymentMethods={state.paymentMethods || []}
            budget={effectiveBudget}
            budgetCycleStartDay={state.budgetCycleStartDay}
            selectedMonth={selectedMonth}
            onEditBudget={handleOpenBudgetModal}
            onManagePaymentMethods={handleOpenPaymentMethods}
            onClick={() => setDetailOpen(true)}
          />

          {/* Category Breakdown */}
          <CategoryBreakdown expenses={expenses} />

          {/* Recent Spending activity */}
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {expenses.length === 0 ? (
              <Text style={styles.emptyText}>No expenses recorded this month.</Text>
            ) : (
              <SpendFeed expenses={expenses.slice(0, 5)} />
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* DETAILED BUDGET OVERLAY MODAL */}
      <Modal visible={detailOpen} animationType="slide" transparent={false} onRequestClose={() => setDetailOpen(false)}>
        <View style={styles.modalFull}>
          <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0a0a0f" }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailOpen(false)} style={styles.backBtn}>
                <Feather name="arrow-left" size={18} color="#9ca3af" />
              </TouchableOpacity>
              <View style={{ alignItems: "center" }}>
                <Text style={styles.modalTitle}>Overview</Text>
                <Text style={styles.modalSubtitle}>BUDGET & STATS</Text>
              </View>
              <View style={{ width: 40, height: 40 }} />
            </View>
          </SafeAreaView>

          <ScrollView style={styles.flex1} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
            <BankFilter
              banks={state.banks}
              selectedBankId={selectedBankId}
              onBankChange={setSelectedBankId}
            />
            <BalanceCard
              balance={balanceLeft}
              totalSpent={totalSpent}
              budget={effectiveBudget}
              pct={pct}
              editable={isCurrentMonth}
              onEditBudget={() => {
                setDetailOpen(false);
                handleOpenBudgetModal();
              }}
            />
            <QuickStats totalIncome={totalIncome} dailyAvg={dailyAvg} />
            <PaymentBreakdown expenses={expenses} paymentMethods={state.paymentMethods || []} />

            <View style={{ marginBottom: 40, marginTop: 16 }}>
              <Text style={styles.sectionTitle}>Filtered Transactions</Text>
              {monthTxs.length === 0 ? (
                <Text style={styles.emptyText}>No transactions found.</Text>
              ) : (
                <SpendFeed expenses={monthTxs} />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* BUDGET EDITING MODAL */}
      <Modal visible={budgetOpen} animationType="fade" transparent={true} onRequestClose={() => setBudgetOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setBudgetOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Monthly Budget</Text>
                <Text style={styles.sheetSubtitle}>Adjust your spending limits</Text>
              </View>
              <TouchableOpacity onPress={() => setBudgetOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>NEW BUDGET</Text>
              <Text style={styles.previewAmount}>{formatINR(Number(tempBudget) || 0)}</Text>
            </View>

            <Text style={styles.inputLabel}>BUDGET AMOUNT</Text>
            <TextInput
              keyboardType="numeric"
              value={tempBudget}
              onChangeText={(text) => setTempBudget(text.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 80000"
              placeholderTextColor="#5a5a6e"
              style={styles.textInput}
            />

            <View style={styles.presetRow}>
              {BUDGET_PRESETS.map((preset) => {
                const active = Number(tempBudget) === preset;
                return (
                  <TouchableOpacity key={preset} onPress={() => setTempBudget(String(preset))} style={[styles.presetBtn, active ? styles.presetBtnActive : styles.presetBtnInactive]}>
                    <Text style={active ? styles.presetTextActive : styles.presetTextInactive}>{formatINR(preset)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>SALARY / BUDGET CYCLE DAY</Text>
            <View style={styles.cycleRow}>
              <View style={styles.flex1}>
                <Text style={styles.cycleTitle}>Day {Number(tempSalaryDay) || 1}</Text>
                <Text style={styles.cycleDesc}>Budget cycle runs from this day to the day before it next month.</Text>
              </View>
              <TextInput
                keyboardType="numeric"
                maxLength={2}
                value={tempSalaryDay}
                onChangeText={(text) => setTempSalaryDay(text.replace(/[^0-9]/g, ""))}
                style={styles.cycleInput}
              />
            </View>

            <TouchableOpacity onPress={handleSaveBudget} style={styles.saveBtnWrapper}>
              <LinearGradient colors={["#6c47ff", "#8b6fff"]} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.saveBtnText}>Save Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* PAYMENT METHODS MODAL */}
      <Modal visible={paymentMethodsOpen} animationType="slide" transparent={false} onRequestClose={() => setPaymentMethodsOpen(false)}>
        <View style={styles.modalFull}>
          <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0a0a0f" }}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Payment Methods</Text>
                <Text style={styles.modalSubtitle}>CARDS, UPI & BILLING</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity onPress={() => {
                  setEditingMethodId(null); setMethodName(""); setMethodType("credit_card"); setBillingCycleStart("15"); setPaymentDueDay("5"); setMethodFormOpen(true);
                }} style={styles.iconBtnPrimary}>
                  <Feather name="plus" size={18} color="#8b6fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPaymentMethodsOpen(false)} style={styles.iconBtnSecondary}>
                  <Feather name="x" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.flex1} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
            {methodFormOpen && (
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>{editingMethodId ? "Edit Method" : "Add Method"}</Text>
                  <TouchableOpacity onPress={() => setMethodFormOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                </View>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput value={methodName} onChangeText={setMethodName} placeholder="e.g. HDFC Card" placeholderTextColor="#5a5a6e" style={styles.textInput} />
                <Text style={styles.inputLabel}>METHOD TYPE</Text>
                <View style={styles.typeGrid}>
                  {METHOD_TYPES.map((opt) => {
                    const active = methodType === opt.type;
                    return (
                      <TouchableOpacity key={opt.type} onPress={() => setMethodType(opt.type)} style={[styles.typeBtn, active ? styles.typeBtnActive : styles.typeBtnInactive]}>
                        <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                        <Text style={active ? styles.typeTextActive : styles.typeTextInactive}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {methodType === "credit_card" && (
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                    <View style={styles.flex1}>
                      <Text style={styles.inputLabel}>CYCLE START DAY</Text>
                      <TextInput keyboardType="numeric" maxLength={2} value={billingCycleStart} onChangeText={(t) => setBillingCycleStart(t.replace(/[^0-9]/g, ""))} style={[styles.textInput, { textAlign: "center" }]} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.inputLabel}>PAYMENT DUE DAY</Text>
                      <TextInput keyboardType="numeric" maxLength={2} value={paymentDueDay} onChangeText={(t) => setPaymentDueDay(t.replace(/[^0-9]/g, ""))} style={[styles.textInput, { textAlign: "center" }]} />
                    </View>
                  </View>
                )}
                <TouchableOpacity onPress={handleSavePaymentMethod} style={styles.saveMethodBtn}>
                  <Feather name="check" size={16} color="white" />
                  <Text style={styles.saveBtnText}>Save Payment Method</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ gap: 8, marginBottom: 40 }}>
              {state.paymentMethods.map((pm) => (
                <View key={pm.id} style={styles.pmCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <View style={styles.pmEmojiBox}><Text style={{ fontSize: 18 }}>{pm.emoji}</Text></View>
                    <View style={styles.flex1}>
                      <Text style={styles.pmName}>{pm.name}</Text>
                      <Text style={styles.pmType}>{pm.type === "credit_card" ? "Credit Card" : pm.type.toUpperCase()}</Text>
                      {pm.type === "credit_card" && (
                        <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                          <View style={styles.pmBadgeYellow}><Text style={styles.pmBadgeTextYellow}>Cycle {pm.billingCycleStart}</Text></View>
                          <View style={styles.pmBadgeGreen}><Text style={styles.pmBadgeTextGreen}>Due {pm.paymentDueDay}</Text></View>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <TouchableOpacity onPress={() => handleStartEditMethod(pm)} style={styles.iconBtnSecondary}><Feather name="edit-2" size={14} color="#9ca3af" /></TouchableOpacity>
                    {state.paymentMethods.length > 1 && (
                      <TouchableOpacity onPress={() => deletePaymentMethod(pm.id)} style={styles.iconBtnDanger}><Feather name="trash-2" size={14} color="#ef4444" /></TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: "#0a0a0f", justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  flex1: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  welcomeText: { color: "#9898aa", fontSize: 14, fontWeight: "500" },
  userName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#18181f", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  plusBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6c47ff", alignItems: "center", justifyContent: "center", shadowColor: "#6c47ff", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  monthSelectorRow: { paddingHorizontal: 20, marginBottom: 16, flexDirection: "row", gap: 8 },
  monthBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  monthBtnActive: { borderColor: "rgba(108,71,255,0.4)", backgroundColor: "rgba(108,71,255,0.15)" },
  monthBtnInactive: { borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#18181f" },
  monthText: { fontSize: 12, fontWeight: "bold" },
  monthTextActive: { color: "#8b6fff" },
  monthTextInactive: { color: "#9898aa" },
  contentPadding: { paddingHorizontal: 20, gap: 16, paddingTop: 16 },
  sectionMargin: { marginBottom: 24 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  emptyText: { color: "#5a5a6e", textAlign: "center", paddingVertical: 16 },
  
  modalFull: { flex: 1, backgroundColor: "#0a0a0f" },
  modalHeader: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#18181f", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  modalTitle: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalSubtitle: { color: "#5a5a6e", fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  bottomSheet: { backgroundColor: "#18181f", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  sheetSubtitle: { fontSize: 12, color: "#9898aa" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  previewBox: { marginBottom: 16, backgroundColor: "#1e1e28", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  previewLabel: { color: "#5a5a6e", fontSize: 10, fontWeight: "bold", letterSpacing: 1, marginBottom: 4 },
  previewAmount: { color: "#fff", fontSize: 32, fontWeight: "900" },
  inputLabel: { color: "#5a5a6e", fontSize: 10, fontWeight: "bold", letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  textInput: { backgroundColor: "#1e1e28", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  presetBtnActive: { borderColor: "#8b6fff", backgroundColor: "rgba(108,71,255,0.2)" },
  presetBtnInactive: { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "#1e1e28" },
  presetTextActive: { fontSize: 12, fontWeight: "bold", color: "#8b6fff" },
  presetTextInactive: { fontSize: 12, fontWeight: "bold", color: "#9898aa" },
  cycleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24, backgroundColor: "#1e1e28", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16 },
  cycleTitle: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cycleDesc: { fontSize: 10, color: "#9898aa", marginTop: 2 },
  cycleInput: { width: 64, height: 44, backgroundColor: "#18181f", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: "bold", textAlign: "center", borderRadius: 12, fontSize: 16 },
  saveBtnWrapper: { borderRadius: 12, overflow: "hidden" },
  saveBtn: { paddingVertical: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  
  iconBtnPrimary: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(108,71,255,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(108,71,255,0.2)" },
  iconBtnSecondary: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  iconBtnDanger: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" },
  
  formCard: { backgroundColor: "#18181f", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, marginBottom: 16 },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  formTitle: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cancelText: { color: "#9898aa", fontSize: 12, fontWeight: "600" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  typeBtnActive: { borderColor: "#8b6fff", backgroundColor: "rgba(108,71,255,0.2)" },
  typeBtnInactive: { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "#1e1e28" },
  typeEmoji: { fontSize: 12 },
  typeTextActive: { fontSize: 12, fontWeight: "bold", color: "#8b6fff" },
  typeTextInactive: { fontSize: 12, fontWeight: "bold", color: "#9898aa" },
  saveMethodBtn: { backgroundColor: "#6c47ff", borderRadius: 12, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 12 },
  
  pmCard: { backgroundColor: "#18181f", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pmEmojiBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(108,71,255,0.1)", alignItems: "center", justifyContent: "center" },
  pmName: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  pmType: { color: "#9898aa", fontSize: 12, marginTop: 2 },
  pmBadgeYellow: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(234,179,8,0.1)", borderWidth: 1, borderColor: "rgba(234,179,8,0.2)" },
  pmBadgeTextYellow: { color: "#eab308", fontSize: 10, fontWeight: "bold" },
  pmBadgeGreen: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" },
  pmBadgeTextGreen: { color: "#10b981", fontSize: 10, fontWeight: "bold" }
});
