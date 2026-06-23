import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { AccountCard } from "@/components/cards/AccountCard";
import { Feather } from "@expo/vector-icons";
import type { Bank } from "@/lib/types";

export default function AccountsScreen() {
  const { state, hydrated, addBank, updateBank, deleteBank } = useExpenses();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  // Form input states
  const [bankName, setBankName] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  const handleOpenAddModal = () => {
    setEditingBank(null);
    setBankName("");
    setBankBalance("");
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

    const numBalance = parseFloat(bankBalance);
    if (isNaN(numBalance)) {
      alert("Please enter a valid balance.");
      return;
    }

    if (editingBank) {
      updateBank(editingBank.id, {
        name: trimmedName,
        balance: numBalance,
        initialBalance: numBalance, // Align initial balance as well
      });
    } else {
      addBank({
        name: trimmedName,
        balance: numBalance,
        initialBalance: numBalance,
      });
    }

    setFormOpen(false);
  };

  const handleDeleteBank = (id: string) => {
    Alert.alert("Delete Bank Account", "Are you sure you want to delete this bank account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteBank(id),
      },
    ]);
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
      {/* Header */}
      <View className="px-4 pt-8 pb-4 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold font-syne">Accounts</Text>
        <TouchableOpacity
          onPress={handleOpenAddModal}
          className="w-10 h-10 rounded-full bg-indigo-650 items-center justify-center border border-indigo-500/20 shadow-md"
        >
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Accounts List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {state.banks.length === 0 ? (
          <View className="items-center justify-center py-20 bg-gray-900/40 border border-gray-850 rounded-2xl p-6">
            <Feather name="credit-card" size={40} color="#4b5563" />
            <Text className="text-gray-400 font-bold text-center mt-3">No Bank Accounts Found</Text>
            <Text className="text-gray-600 text-xs text-center mt-1">
              Add bank accounts using the "+" button in the header.
            </Text>
          </View>
        ) : (
          <View className="pb-20">
            {state.banks.map((bank) => (
              <AccountCard
                key={bank.id}
                bank={bank}
                onEdit={() => handleOpenEditModal(bank)}
                onDelete={() => handleDeleteBank(bank.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ────────────────────────────────────────────────────────
          BANK ACCOUNT FORM MODAL (ADD & EDIT)
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={formOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFormOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setFormOpen(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="bg-gray-900 rounded-t-3xl border-t border-gray-800 p-5 max-h-[80%]"
          >
            {/* Notch */}
            <View className="align-self-center items-center mb-4">
              <View className="h-1 w-10 rounded-full bg-gray-700" />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold font-syne">
                {editingBank ? "Edit Account" : "Add Account"}
              </Text>
              <TouchableOpacity
                onPress={() => setFormOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
              >
                <Feather name="x" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4 mb-4" showsVerticalScrollIndicator={false}>
              {/* Account Name */}
              <View>
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Account Name
                </Text>
                <TextInput
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. HDFC Bank, ICICI, Cash"
                  placeholderTextColor="#4b5563"
                  className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm font-semibold"
                />
              </View>

              {/* Balance */}
              <View className="mb-6">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Current Balance (₹)
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={bankBalance}
                  onChangeText={(t) => setBankBalance(t.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  placeholderTextColor="#4b5563"
                  className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm font-semibold"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveBank}
              className="bg-indigo-650 py-4 rounded-xl items-center mb-6"
            >
              <Text className="text-white font-bold text-sm font-syne">Save Account</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
