import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useExpenses } from "@/hooks/useExpenses";
import { Feather } from "@expo/vector-icons";
import { formatINR } from "@/lib/utils";
import type { PaymentMethod, PaymentMethodConfig } from "@/lib/types";

const BUDGET_PRESETS = [40000, 80000, 120000, 200000];

const METHOD_TYPES: { type: PaymentMethod; label: string; emoji: string }[] = [
  { type: "credit_card", label: "Credit Card", emoji: "💳" },
  { type: "upi", label: "UPI", emoji: "📱" },
  { type: "cash", label: "Cash", emoji: "💵" },
  { type: "bank_transfer", label: "Transfer", emoji: "🏦" },
  { type: "other", label: "Other", emoji: "💼" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const {
    state,
    hydrated,
    updateBudget,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = useExpenses();

  const [loading, setLoading] = useState(false);

  // Modals visibility
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [budgetEditOpen, setBudgetEditOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);

  // Form states
  const [tempDisplayName, setTempDisplayName] = useState(user?.displayName || "");
  const [tempBudget, setTempBudget] = useState("");
  const [tempSalaryDay, setTempSalaryDay] = useState("");

  // Payment Method Form State
  const [methodFormOpen, setMethodFormOpen] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState("");
  const [methodType, setMethodType] = useState<PaymentMethod>("credit_card");
  const [billingCycleStart, setBillingCycleStart] = useState("15");
  const [paymentDueDay, setPaymentDueDay] = useState("5");

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await signOut(auth);
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmed = tempDisplayName.trim();
    if (!trimmed) {
      alert("Name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user, { displayName: trimmed });
      setProfileEditOpen(false);
    } catch {
      alert("Failed to update profile name.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBudgetModal = () => {
    setTempBudget(String(state.budget));
    setTempSalaryDay(String(state.budgetCycleStartDay));
    setBudgetEditOpen(true);
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
    setBudgetEditOpen(false);
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

    // Reset Form
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
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
    <ScrollView className="flex-1 bg-gray-950" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="px-4 pt-8 pb-4">
        <Text className="text-white text-2xl font-bold font-syne">Profile</Text>
      </View>

      {/* User Card */}
      <View className="mx-4 p-4 bg-gray-900 rounded-2xl border border-gray-800 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4 flex-1">
          <View className="w-14 h-14 rounded-full bg-indigo-600 items-center justify-center border border-indigo-500/25">
            <Text className="text-white text-xl font-bold font-syne">
              {user?.displayName?.[0]?.toUpperCase() || "U"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold font-syne" numberOfLines={1}>
              {user?.displayName || "Finflow User"}
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setTempDisplayName(user?.displayName || "");
            setProfileEditOpen(true);
          }}
          className="w-8 h-8 rounded-full bg-gray-850 border border-gray-850 items-center justify-center"
        >
          <Feather name="edit-2" size={13} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Budget Settings List */}
      <View className="mx-4 mt-6 gap-3">
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          Budget Settings
        </Text>

        <TouchableOpacity
          onPress={handleOpenBudgetModal}
          className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              Budget Start / Salary Day
            </Text>
            <Text className="text-white font-bold text-sm mt-1">
              Day {state.budgetCycleStartDay}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#4b5563" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenBudgetModal}
          className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              Monthly Limit
            </Text>
            <Text className="text-white font-bold text-sm mt-1">{formatINR(state.budget)}</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#4b5563" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPaymentMethodsOpen(true)}
          className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              Payment Methods
            </Text>
            <Text className="text-white font-bold text-sm mt-1">
              {state.paymentMethods.length} Methods configured
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Support Settings */}
      <View className="mx-4 mt-6 gap-2">
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
          Preferences
        </Text>

        <View className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Feather name="help-circle" size={16} color="#9ca3af" />
            <Text className="text-white font-semibold text-xs">Help & Support</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#4b5563" />
        </View>

        <View className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Feather name="shield" size={16} color="#9ca3af" />
            <Text className="text-white font-semibold text-xs">Privacy Policy</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#4b5563" />
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={loading}
        className="mx-4 mt-8 mb-12 bg-red-500/10 border border-red-500/20 rounded-xl p-4 items-center"
      >
        {loading ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text className="text-red-400 font-bold text-sm">Sign Out</Text>
        )}
      </TouchableOpacity>

      <View className="h-10" />

      {/* ────────────────────────────────────────────────────────
          1. PROFILE EDIT MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={profileEditOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setProfileEditOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setProfileEditOpen(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="bg-gray-900 rounded-t-3xl border-t border-gray-800 p-5"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-bold font-syne">Edit Name</Text>
              <TouchableOpacity onPress={() => setProfileEditOpen(false)}>
                <Feather name="x" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                Display Name
              </Text>
              <TextInput
                value={tempDisplayName}
                onChangeText={setTempDisplayName}
                placeholder="Name"
                placeholderTextColor="#4b5563"
                className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm font-semibold"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              className="bg-indigo-650 py-3.5 rounded-xl items-center mb-6"
            >
              <Text className="text-white font-bold text-xs font-syne">Save Changes</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────
          2. BUDGET EDIT MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={budgetEditOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setBudgetEditOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setBudgetEditOpen(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="bg-gray-900 rounded-t-3xl border-t border-gray-800 p-5 max-h-[85%]"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-bold font-syne">Monthly Budget</Text>
              <TouchableOpacity onPress={() => setBudgetEditOpen(false)}>
                <Feather name="x" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4 mb-4" showsVerticalScrollIndicator={false}>
              {/* Preview */}
              <View className="mb-2 bg-gray-950 rounded-2xl p-4 border border-gray-800">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Budget Limit
                </Text>
                <Text className="text-white text-2xl font-black font-syne">
                  {formatINR(Number(tempBudget) || 0)}
                </Text>
              </View>

              {/* Amount input */}
              <View>
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Budget Amount
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={tempBudget}
                  onChangeText={(t) => setTempBudget(t.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 80000"
                  placeholderTextColor="#4b5563"
                  className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs font-semibold"
                />
              </View>

              {/* Presets */}
              <View className="flex-row flex-wrap gap-2 mb-2">
                {BUDGET_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => setTempBudget(String(preset))}
                    className={`px-4 py-2.5 rounded-full border ${
                      Number(tempBudget) === preset
                        ? "border-[#8b6fff] bg-[#6c47ff]/20"
                        : "border-gray-800 bg-gray-950"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        Number(tempBudget) === preset ? "text-[#8b6fff]" : "text-gray-400"
                      }`}
                    >
                      {formatINR(preset)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Salary Day */}
              <View>
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Salary Day (1 - 28)
                </Text>
                <TextInput
                  keyboardType="numeric"
                  maxLength={2}
                  value={tempSalaryDay}
                  onChangeText={(t) => setTempSalaryDay(t.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 5"
                  placeholderTextColor="#4b5563"
                  className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs font-semibold"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveBudget}
              className="bg-indigo-650 py-3.5 rounded-xl items-center mb-6"
            >
              <Text className="text-white font-bold text-xs font-syne">Save Settings</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────
          3. PAYMENT METHODS MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={paymentMethodsOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPaymentMethodsOpen(false)}
      >
        <View className="flex-1 bg-gray-950 pt-8">
          {/* Header */}
          <View className="px-4 py-3 border-b border-gray-900 flex-row items-center justify-between">
            <View>
              <Text className="text-white font-bold text-base font-syne">Payment Methods</Text>
              <Text className="text-gray-500 text-[9px] uppercase font-bold tracking-widest mt-0.5">
                Cards, UPI & Billing cycles
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setEditingMethodId(null);
                  setMethodName("");
                  setMethodType("credit_card");
                  setBillingCycleStart("15");
                  setPaymentDueDay("5");
                  setMethodFormOpen(true);
                }}
                className="w-9 h-9 rounded-full bg-indigo-500/10 items-center justify-center border border-indigo-500/20"
              >
                <Feather name="plus" size={18} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentMethodsOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-900 items-center justify-center border border-gray-800"
              >
                <Feather name="x" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            {/* Inline Form */}
            {methodFormOpen && (
              <View className="bg-gray-900 border border-gray-850 rounded-2xl p-4 mb-4 gap-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white font-bold text-xs font-syne">
                    {editingMethodId ? "Edit Method" : "Add Method"}
                  </Text>
                  <TouchableOpacity onPress={() => setMethodFormOpen(false)}>
                    <Text className="text-xs text-gray-405 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                </View>

                {/* Name */}
                <View>
                  <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Name
                  </Text>
                  <TextInput
                    value={methodName}
                    onChangeText={setMethodName}
                    placeholder="e.g. HDFC Credit Card"
                    placeholderTextColor="#4b5563"
                    className="bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs"
                  />
                </View>

                {/* Types Grid */}
                <View>
                  <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-2">
                    Method Type
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {METHOD_TYPES.map((opt) => (
                      <TouchableOpacity
                        key={opt.type}
                        onPress={() => setMethodType(opt.type)}
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                          methodType === opt.type
                            ? "border-[#8b6fff] bg-[#6c47ff]/20"
                            : "border-gray-800 bg-gray-950"
                        }`}
                      >
                        <Text className="text-xs">{opt.emoji}</Text>
                        <Text
                          className={`text-xs font-bold ${
                            methodType === opt.type ? "text-[#8b6fff]" : "text-gray-400"
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Billing fields for CC */}
                {methodType === "credit_card" && (
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">
                        Cycle Start Day
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        maxLength={2}
                        value={billingCycleStart}
                        onChangeText={(t) => setBillingCycleStart(t.replace(/[^0-9]/g, ""))}
                        className="bg-gray-950 border border-gray-800 text-white font-bold text-center rounded-xl py-1.5"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">
                        Payment Due Day
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        maxLength={2}
                        value={paymentDueDay}
                        onChangeText={(t) => setPaymentDueDay(t.replace(/[^0-9]/g, ""))}
                        className="bg-gray-950 border border-gray-800 text-white font-bold text-center rounded-xl py-1.5"
                      />
                    </View>
                  </View>
                )}

                {/* Save method */}
                <TouchableOpacity
                  onPress={handleSavePaymentMethod}
                  className="bg-indigo-600 rounded-xl py-3 items-center flex-row justify-center gap-2 mt-1"
                >
                  <Feather name="check" size={14} color="white" />
                  <Text className="text-white font-bold text-xs">Save Payment Method</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* List */}
            <View className="gap-2 mb-10">
              {state.paymentMethods.map((pm) => (
                <View
                  key={pm.id}
                  className="bg-gray-900 border border-gray-850 rounded-2xl p-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center">
                      <Text className="text-base">{pm.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-sm" numberOfLines={1}>
                        {pm.name}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {pm.type === "credit_card" ? "Credit Card" : pm.type.toUpperCase()}
                      </Text>
                      {pm.type === "credit_card" && (
                        <View className="flex-row gap-1.5 mt-1.5">
                          <View className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">
                            <Text className="text-yellow-500 text-[9px] font-bold">
                              Cycle {pm.billingCycleStart}
                            </Text>
                          </View>
                          <View className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <Text className="text-emerald-500 text-[9px] font-bold">
                              Pay Due {pm.paymentDueDay}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleStartEditMethod(pm)}
                      className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
                    >
                      <Feather name="edit-2" size={12} color="#9ca3af" />
                    </TouchableOpacity>
                    {state.paymentMethods.length > 1 && (
                      <TouchableOpacity
                        onPress={() => deletePaymentMethod(pm.id)}
                        className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center"
                      >
                        <Feather name="trash-2" size={12} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#030712",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
});
