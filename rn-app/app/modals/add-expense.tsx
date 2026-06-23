import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Alert,
  KeyboardAvoidingView,
  Modal
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useExpenses } from "@/hooks/useExpenses";
import { CATEGORIES } from "@/lib/categories";
import { classifyExpense } from "@/lib/classifier";
import { getTodayISO, formatDate, getDaysInMonth, getCurrentMonthPrefix } from "@/lib/utils";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import InlineCalculator from "@/components/InlineCalculator";

export default function AddExpenseModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, addTransaction, editTransaction, deleteTransaction } = useExpenses();

  const isEditing = Boolean(id && id !== "new");
  const existingTx = isEditing ? state.transactions.find(t => t.id === id) : null;

  const paymentMethods = state.paymentMethods || [];
  const banks = state.banks || [];

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [displayedMonth, setDisplayedMonth] = useState(getTodayISO().slice(0, 7));
  const [type, setType] = useState<"expense" | "income">("expense");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [aiSuggest, setAiSuggest] = useState<any>(null);
  
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(
    paymentMethods[0]?.id || ""
  );
  const [selectedBankId, setSelectedBankId] = useState<string>(
    banks[0]?.id || "default"
  );
  
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);

  useEffect(() => {
    if (existingTx) {
      setName(existingTx.name);
      setAmount(String(existingTx.amount));
      setDate(existingTx.date);
      setDisplayedMonth(existingTx.date.slice(0, 7));
      setType(existingTx.type);
      setSelectedCat(existingTx.category);
      setSelectedPaymentMethodId(existingTx.paymentMethodId || "");
      setSelectedBankId(existingTx.bankId || "default");
    }
  }, [existingTx]);

  // Calendar logic
  const currentMonth = getCurrentMonthPrefix();
  const today = getTodayISO();
  const currentDay = Number(today.slice(8, 10));
  const selectedDay = Number(date.slice(8, 10));
  const daysInDisplayedMonth = getDaysInMonth(displayedMonth);
  const selectableDayCount = displayedMonth === currentMonth ? currentDay : daysInDisplayedMonth;
  const monthDays = useMemo(() => {
    return Array.from({ length: selectableDayCount }, (_, index) => selectableDayCount - index);
  }, [selectableDayCount]);
  const canGoNextMonth = displayedMonth < currentMonth;

  const formatMonthLabel = (monthStr: string) => {
    if (!monthStr) return "";
    const [y, m] = monthStr.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const shiftMonth = (delta: number) => {
    const [year, month] = displayedMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    if (nextMonth > currentMonth) return;
    setDisplayedMonth(nextMonth);

    if (!date.startsWith(nextMonth)) {
      const maxDays = nextMonth === currentMonth ? currentDay : getDaysInMonth(nextMonth);
      const day = Math.min(Number(date.slice(8, 10)) || 1, maxDays);
      setDate(`${nextMonth}-${String(day).padStart(2, "0")}`);
    }
  };

  const selectedBank = banks.find((b) => b.id === selectedBankId) ?? banks[0];
  const selectedPaymentMethod = paymentMethods.find((p) => p.id === selectedPaymentMethodId);

  // Get card billing info
  const getCardStatusMessage = () => {
    if (selectedPaymentMethod?.type !== "credit_card") return null;
    const card = selectedPaymentMethod;
    const cycleStart = card.billingCycleStart ?? 15;
    const payDay = card.paymentDueDay ?? 5;
    const txDay = selectedDay;

    let isReserved = false;
    if (payDay < cycleStart) {
      isReserved = txDay > cycleStart || txDay <= payDay;
    } else {
      isReserved = txDay > cycleStart && txDay <= payDay;
    }

    if (isReserved) {
      return {
        type: "reserved" as const,
        message: `Reserved — after billing cycle (day ${cycleStart}), before pay date (day ${payDay}). This will be deducted from your bank.`,
        color: "#ff6b35",
      };
    }

    return {
      type: "bill" as const,
      message: `Card bill — within billing cycle (starting day ${cycleStart}). Will appear on your card statement, due on day ${payDay}.`,
      color: "#ffb830",
    };
  };

  const cardStatus = getCardStatusMessage();

  const handleNameChange = (text: string) => {
    setName(text);
    if (!isEditing) {
      const cat = classifyExpense(text);
      setAiSuggest(cat);
    }
  };

  const applyAiSuggest = () => {
    if (aiSuggest) {
      setSelectedCat(aiSuggest.id);
      setAiSuggest(null);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const pm = paymentMethods.find((p) => p.id === selectedPaymentMethodId);
    const cat = selectedCat ?? aiSuggest?.id ?? "other";

    const payload = {
      name: name.trim(),
      amount: amt,
      category: cat,
      type,
      date,
      bankId: selectedBankId,
      paymentMethod: pm?.type || "other",
      paymentMethodId: pm?.id,
    };

    if (isEditing && id) {
      editTransaction(id, payload);
    } else {
      addTransaction(payload);
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            deleteTransaction(id);
            router.back();
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{isEditing ? "Edit Expense" : "Log Expense"}</Text>
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Feather name="trash-2" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        <Text style={styles.label}>EVENT / DESCRIPTION</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lunch, groceries..."
          placeholderTextColor="#5a5a6e"
          value={name}
          onChangeText={handleNameChange}
        />

        {aiSuggest && name.length > 2 && !selectedCat && !isEditing && (
          <TouchableOpacity style={styles.aiSuggest} onPress={applyAiSuggest}>
            <Text style={styles.aiText}>🤖 AI suggests: {aiSuggest.emoji} {aiSuggest.name}</Text>
          </TouchableOpacity>
        )}

        {/* Inline Date Picker */}
        <Text style={styles.label}>DATE</Text>
        <View style={styles.datePickerContainer}>
          <View style={styles.dateHeader}>
            <View style={styles.dateHeaderLeft}>
              <View style={styles.dateIconBox}>
                <Feather name="calendar" size={16} color="#8b6fff" />
              </View>
              <View>
                <Text style={styles.dateDisplay}>{formatDate(date)}</Text>
                <Text style={styles.monthDisplay}>{formatMonthLabel(displayedMonth)}</Text>
              </View>
            </View>
            
            <View style={styles.dateControls}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.dateNavBtn}>
                <Feather name="chevron-left" size={16} color="#9898aa" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => shiftMonth(1)} 
                disabled={!canGoNextMonth}
                style={[styles.dateNavBtn, !canGoNextMonth && { opacity: 0.3 }]}
              >
                <Feather name="chevron-right" size={16} color="#9898aa" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setDisplayedMonth(currentMonth);
                  setDate(today);
                }}
                style={styles.dateTodayBtn}
              >
                <Text style={styles.dateTodayText}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
            {monthDays.map((day) => {
              const value = `${displayedMonth}-${String(day).padStart(2, "0")}`;
              const active = day === selectedDay;
              
              // In JS Date, we need to construct it carefully to avoid timezone shifts
              // For a simple weekday string, parsing the ISODate might jump timezones if we aren't careful
              // but standard local format is fine for display
              const dateObj = new Date(displayedMonth.split('-')[0] as any, (displayedMonth.split('-')[1] as any) - 1, day);
              const weekday = dateObj.toLocaleDateString("en-IN", { weekday: "short" });

              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setDate(value)}
                  style={[styles.dayCard, active ? styles.dayCardActive : styles.dayCardInactive]}
                >
                  <Text style={[styles.dayWeekday, active && styles.dayWeekdayActive]}>{weekday}</Text>
                  <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Amount + Calculator */}
        <Text style={styles.label}>AMOUNT (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#5a5a6e"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <InlineCalculator currentValue={amount} onResult={(v) => setAmount(String(v))} />

        {/* Type */}
        <Text style={styles.label}>TYPE</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.typeBtn, type === "expense" ? styles.typeBtnExpense : styles.typeBtnInactive]}
            onPress={() => setType("expense")}
          >
            <Text style={[styles.typeText, type === "expense" && styles.typeTextExpense]}>💸 Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === "income" ? styles.typeBtnIncome : styles.typeBtnInactive]}
            onPress={() => setType("income")}
          >
            <Text style={[styles.typeText, type === "income" && styles.typeTextIncome]}>💰 Income</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        {paymentMethods.length > 0 && (
          <>
            <Text style={styles.label}>PAYMENT METHOD</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {paymentMethods.map((pm) => (
                <TouchableOpacity
                  key={pm.id}
                  style={[styles.pmBtn, selectedPaymentMethodId === pm.id && styles.pmBtnActive]}
                  onPress={() => setSelectedPaymentMethodId(pm.id)}
                >
                  <Text style={styles.pmEmoji}>{pm.emoji}</Text>
                  <Text style={[styles.pmText, selectedPaymentMethodId === pm.id && styles.pmTextActive]}>
                    {pm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Card Status */}
            {cardStatus && (
              <View style={[styles.cardStatus, { borderColor: `${cardStatus.color}33`, backgroundColor: `${cardStatus.color}15` }]}>
                <View style={styles.cardStatusHeader}>
                  <Text style={{ fontSize: 12 }}>{cardStatus.type === "reserved" ? "🔒" : "💳"}</Text>
                  <Text style={[styles.cardStatusTitle, { color: cardStatus.color }]}>
                    {cardStatus.type === "reserved" ? "Reserved from Bank" : "Card Bill"}
                  </Text>
                </View>
                <Text style={styles.cardStatusDesc}>{cardStatus.message}</Text>
              </View>
            )}
          </>
        )}

        {/* Bank Dropdown Replacement */}
        <Text style={styles.label}>BANK ACCOUNT</Text>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setBankDropdownOpen(!bankDropdownOpen)}
          style={[styles.bankDropdown, bankDropdownOpen && styles.bankDropdownOpen]}
        >
          <View style={styles.bankDropdownIcon}><Text>🏦</Text></View>
          <Text style={styles.bankDropdownText}>{selectedBank?.name || "Select Bank"}</Text>
          <Feather name={bankDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#5a5a6e" />
        </TouchableOpacity>

        {/* Category Grid */}
        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catBtn, selectedCat === cat.id && styles.catBtnActive]}
              onPress={() => setSelectedCat(cat.id)}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleSubmit} style={styles.submitWrapper}>
          <LinearGradient
            colors={["#6c47ff", "#8b6fff"]}
            style={styles.submitBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.submitText}>{isEditing ? "Save Changes ✦" : "Add to Feed ✦"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Full screen bank modal wrapper */}
      {bankDropdownOpen && (
        <Modal transparent animationType="fade" visible={bankDropdownOpen} onRequestClose={() => setBankDropdownOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBankDropdownOpen(false)}>
            <View style={styles.modalContent}>
              {banks.map((bank) => {
                const active = bank.id === selectedBankId;
                return (
                  <TouchableOpacity
                    key={bank.id}
                    onPress={() => {
                      setSelectedBankId(bank.id);
                      setBankDropdownOpen(false);
                    }}
                    style={[styles.modalItem, active && styles.modalItemActive]}
                  >
                    <View style={styles.modalItemIcon}><Text>🏦</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemText}>{bank.name}</Text>
                      {bank.balance !== undefined && (
                        <Text style={styles.modalItemSubtext}>₹{bank.balance.toLocaleString()}</Text>
                      )}
                    </View>
                    {active && <Feather name="check" size={16} color="#8b6fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18181f",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#5a5a6e",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 24,
  },
  input: {
    backgroundColor: "#1e1e28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
  },
  aiSuggest: {
    backgroundColor: "rgba(108,71,255,0.1)",
    borderColor: "rgba(108,71,255,0.25)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  aiText: {
    color: "#8b6fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  
  // Custom Date Picker
  datePickerContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#1e1e28",
    padding: 12,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(108,71,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateDisplay: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  monthDisplay: {
    color: "#5a5a6e",
    fontWeight: "bold",
    fontSize: 10,
  },
  dateControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateTodayBtn: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateTodayText: {
    color: "#9898aa",
    fontWeight: "bold",
    fontSize: 12,
  },
  daysScroll: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  dayCard: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  dayCardInactive: {
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#252533",
  },
  dayCardActive: {
    borderColor: "#8b6fff",
    backgroundColor: "rgba(108,71,255,0.2)",
  },
  dayWeekday: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  dayWeekdayActive: {
    color: "rgba(255,255,255,0.8)",
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "900",
  },
  dayNumberActive: {
    color: "#fff",
  },

  row: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  typeBtnInactive: {
    backgroundColor: "#1e1e28",
    borderColor: "rgba(255,255,255,0.1)",
  },
  typeBtnExpense: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  typeBtnIncome: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.4)",
  },
  typeText: {
    fontWeight: "bold",
    color: "#9898aa",
  },
  typeTextExpense: {
    color: "#f87171",
  },
  typeTextIncome: {
    color: "#34d399",
  },
  horizontalScroll: {
    flexDirection: "row",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  pmBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
  },
  pmBtnActive: {
    backgroundColor: "rgba(108,71,255,0.2)",
    borderColor: "#8b6fff",
  },
  pmEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  pmText: {
    color: "#9898aa",
    fontWeight: "bold",
    fontSize: 12,
  },
  pmTextActive: {
    color: "#8b6fff",
  },

  // Card Status
  cardStatus: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardStatusTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  cardStatusDesc: {
    fontSize: 10,
    color: "#9898aa",
    lineHeight: 14,
  },

  // Bank Dropdown
  bankDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
  },
  bankDropdownOpen: {
    borderColor: "rgba(139,111,255,0.6)",
  },
  bankDropdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(108,71,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bankDropdownText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#141419",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 8,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  modalItemActive: {
    backgroundColor: "rgba(108,71,255,0.15)",
  },
  modalItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(108,71,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalItemText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalItemSubtext: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },

  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catBtn: {
    width: "31%",
    backgroundColor: "#1e1e28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  catBtnActive: {
    borderColor: "#6c47ff",
    backgroundColor: "rgba(108,71,255,0.12)",
  },
  catEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  catName: {
    color: "#9898aa",
    fontSize: 10,
    textAlign: "center",
  },
  submitWrapper: {
    marginTop: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  submitBtn: {
    padding: 16,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
