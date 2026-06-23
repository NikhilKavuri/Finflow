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
import { useState, useMemo } from "react";
import { useSplits, calculateBalances, getSplitTotal, getMemberSpending } from "@/hooks/useSplits";
import { TripCard } from "@/components/cards/TripCard";
import { Feather } from "@expo/vector-icons";
import { formatINR } from "@/lib/utils";
import type { SplitSession, SplitMember, SplitExpense } from "@/lib/types";

export default function SplitsScreen() {
  const {
    splits,
    hydrated,
    createSplit,
    addSplitExpense,
    deleteSplitExpense,
    addMember,
    settleDebt,
    deleteSplit,
  } = useSplits();

  const [refreshing, setRefreshing] = useState(false);

  // Modals visibility
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  // Active Context
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

  // Create Split Form State
  const [newSplitName, setNewSplitName] = useState("");
  const [newSplitEmoji, setNewSplitEmoji] = useState("✈️");
  const [newSplitMembers, setNewSplitMembers] = useState<{ name: string; email?: string }[]>([
    { name: "You", email: "" },
  ]);

  // Add Member Inline Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Add Split Expense Form State
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseSplitAmong, setExpenseSplitAmong] = useState<string[]>([]);

  // Settle Debt Form State
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const activeSplit = useMemo(() => {
    return splits.find((s) => s.id === selectedSplitId) || null;
  }, [splits, selectedSplitId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  // Create Split Helpers
  const handleOpenCreateModal = () => {
    setNewSplitName("");
    setNewSplitEmoji("✈️");
    setNewSplitMembers([{ name: "You", email: "" }]);
    setCreateOpen(true);
  };

  const handleAddMemberRow = () => {
    setNewSplitMembers([...newSplitMembers, { name: "", email: "" }]);
  };

  const handleMemberRowChange = (index: number, key: "name" | "email", val: string) => {
    const next = [...newSplitMembers];
    next[index][key] = val;
    setNewSplitMembers(next);
  };

  const handleRemoveMemberRow = (index: number) => {
    setNewSplitMembers(newSplitMembers.filter((_, i) => i !== index));
  };

  const handleSaveSplit = async () => {
    const name = newSplitName.trim();
    if (!name) {
      alert("Please enter a split name.");
      return;
    }

    const validMembers = newSplitMembers
      .map((m) => ({ name: m.name.trim(), email: m.email?.trim(), avatar: "👤" }))
      .filter((m) => m.name.length > 0);

    if (validMembers.length < 2) {
      alert("Please add at least one other member to split with.");
      return;
    }

    await createSplit(name, newSplitEmoji, validMembers);
    setCreateOpen(false);
  };

  // Split Expense Helpers
  const handleOpenAddExpense = () => {
    if (!activeSplit) return;
    setExpenseDesc("");
    setExpenseAmount("");
    setExpensePaidBy(activeSplit.members[0]?.id || "");
    setExpenseSplitAmong(activeSplit.members.map((m) => m.id));
    setAddExpenseOpen(true);
  };

  const handleToggleSplitAmong = (memberId: string) => {
    if (expenseSplitAmong.includes(memberId)) {
      setExpenseSplitAmong(expenseSplitAmong.filter((id) => id !== memberId));
    } else {
      setExpenseSplitAmong([...expenseSplitAmong, memberId]);
    }
  };

  const handleSaveSplitExpense = () => {
    if (!activeSplit) return;
    const desc = expenseDesc.trim();
    if (!desc) {
      alert("Please enter a description.");
      return;
    }
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (expenseSplitAmong.length === 0) {
      alert("Please select at least one member to split among.");
      return;
    }

    addSplitExpense(activeSplit.id, {
      description: desc,
      amount: amt,
      paidBy: expensePaidBy,
      splitAmong: expenseSplitAmong,
      date: getTodayISO(),
    });

    setAddExpenseOpen(false);
  };

  // Settlement Helpers
  const handleOpenSettle = (fromId?: string, toId?: string, defaultAmt?: number) => {
    if (!activeSplit) return;
    setSettleFrom(fromId || activeSplit.members[0]?.id || "");
    setSettleTo(toId || activeSplit.members[1]?.id || "");
    setSettleAmount(defaultAmt ? String(defaultAmt) : "");
    setSettleOpen(true);
  };

  const handleSaveSettle = () => {
    if (!activeSplit) return;
    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (settleFrom === settleTo) {
      alert("You cannot settle debt with yourself.");
      return;
    }

    settleDebt(activeSplit.id, settleFrom, settleTo, amt);
    setSettleOpen(false);
  };

  // Add Member Helper
  const handleAddMemberToActive = async () => {
    if (!activeSplit) return;
    const name = newMemberName.trim();
    if (!name) {
      alert("Please enter a member name.");
      return;
    }

    await addMember(activeSplit.id, {
      name,
      email: newMemberEmail.trim() || undefined,
      avatar: "👤",
      status: "accepted",
    });

    setNewMemberName("");
    setNewMemberEmail("");
  };

  const handleDeleteSplit = () => {
    if (!activeSplit) return;
    Alert.alert("Delete Split Group", "Are you sure you want to delete this split group and all its expenses?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDetailOpen(false);
          await deleteSplit(activeSplit.id);
        },
      },
    ]);
  };

  if (!hydrated) {
    return (
      <View style={splitsStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={splitsStyles.container} edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-8 pb-4 flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold font-syne">Splits</Text>
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            className="w-10 h-10 rounded-full bg-indigo-650 items-center justify-center border border-indigo-500/20 shadow-md"
          >
            <Feather name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Splits list */}
        <View className="px-4 pb-20">
          {splits.length === 0 ? (
            <View className="items-center justify-center py-20 bg-gray-900/40 border border-gray-850 rounded-2xl p-6">
              <Feather name="layers" size={40} color="#4b5563" />
              <Text className="text-gray-400 font-bold text-center mt-3">No Splits Yet</Text>
              <Text className="text-gray-600 text-xs text-center mt-1 mb-5">
                Create a split group to divide trip expenses, dinner bills, or rent.
              </Text>
              <TouchableOpacity
                onPress={handleOpenCreateModal}
                className="bg-indigo-650 px-6 py-3 rounded-xl border border-indigo-500/20"
              >
                <Text className="text-white font-bold text-sm">Create Split Group</Text>
              </TouchableOpacity>
            </View>
          ) : (
            splits.map((split) => (
              <TripCard
                key={split.id}
                split={split}
                onPress={() => {
                  setSelectedSplitId(split.id);
                  setDetailOpen(true);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ────────────────────────────────────────────────────────
          1. CREATE SPLIT MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={createOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setCreateOpen(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="bg-gray-900 rounded-t-3xl border-t border-gray-800 p-5 max-h-[92%]"
          >
            {/* Notch */}
            <View className="align-self-center items-center mb-4">
              <View className="h-1 w-10 rounded-full bg-gray-700" />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold font-syne">Create Split Group</Text>
              <TouchableOpacity
                onPress={() => setCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
              >
                <Feather name="x" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4 mb-4" showsVerticalScrollIndicator={false}>
              {/* Group Name */}
              <View className="mb-2">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Group Name
                </Text>
                <TextInput
                  value={newSplitName}
                  onChangeText={setNewSplitName}
                  placeholder="e.g. Goa Trip, Flatmates, Dinner"
                  placeholderTextColor="#4b5563"
                  className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm font-semibold"
                />
              </View>

              {/* Emoji */}
              <View className="mb-2">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Group Emoji
                </Text>
                <TextInput
                  value={newSplitEmoji}
                  onChangeText={setNewSplitEmoji}
                  placeholder="✈️"
                  placeholderTextColor="#4b5563"
                  className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm font-semibold"
                />
              </View>

              {/* Members Inputs List */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    Group Members
                  </Text>
                  <TouchableOpacity onPress={handleAddMemberRow} className="flex-row items-center gap-1">
                    <Feather name="plus-circle" size={12} color="#8b6fff" />
                    <Text className="text-[#8b6fff] text-xs font-bold">Add Member</Text>
                  </TouchableOpacity>
                </View>

                {newSplitMembers.map((member, idx) => (
                  <View key={idx} className="flex-row gap-2 mb-2">
                    <TextInput
                      value={member.name}
                      onChangeText={(val) => handleMemberRowChange(idx, "name", val)}
                      placeholder={idx === 0 ? "You (Name)" : "Name"}
                      placeholderTextColor="#4b5563"
                      className="flex-2 bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                    <TextInput
                      value={member.email}
                      onChangeText={(val) => handleMemberRowChange(idx, "email", val)}
                      placeholder="Email (for collaborative split)"
                      placeholderTextColor="#4b5563"
                      className="flex-3 bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                    {idx > 0 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMemberRow(idx)}
                        className="w-10 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center"
                      >
                        <Feather name="trash-2" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveSplit}
              className="bg-indigo-650 py-4 rounded-xl items-center mb-6"
            >
              <Text className="text-white font-bold text-sm font-syne">Create Split Group</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────
          2. SPLIT DETAILS OVERLAY MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={detailOpen && activeSplit !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetailOpen(false)}
      >
        {activeSplit && (
          <View className="flex-1 bg-gray-950 pt-8">
            {/* Header */}
            <View className="px-4 py-3 border-b border-gray-900 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setDetailOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-900 items-center justify-center border border-gray-800"
              >
                <Feather name="arrow-left" size={18} color="#9ca3af" />
              </TouchableOpacity>
              <View className="items-center flex-1 mx-4">
                <Text className="text-white font-bold text-base font-syne" numberOfLines={1}>
                  {activeSplit.emoji} {activeSplit.name}
                </Text>
                <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                  Split Details
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDeleteSplit}
                className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
              >
                <Feather name="trash-2" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
              {/* Total Spend Summary Card */}
              <View className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  Group Total Spend
                </Text>
                <Text className="text-white text-3xl font-black font-syne mt-1">
                  {formatINR(getSplitTotal(activeSplit))}
                </Text>
              </View>

              {/* Members Spending */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Members & Contributions
                </Text>
                <View className="gap-2.5">
                  {activeSplit.members.map((m) => {
                    const spending = getMemberSpending(activeSplit)[m.id] || 0;
                    return (
                      <View
                        key={m.id}
                        className="bg-gray-900/60 border border-gray-850 rounded-xl p-3 flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center gap-2">
                          <View className="w-8 h-8 rounded-full bg-indigo-500/15 items-center justify-center">
                            <Text className="text-sm">{m.avatar || "👤"}</Text>
                          </View>
                          <Text className="text-white font-semibold text-sm">{m.name}</Text>
                        </View>
                        <Text className="text-white font-bold text-sm">
                          Paid: {formatINR(spending)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Settle Debt Calculations */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Pending Settlements
                </Text>
                {calculateBalances(activeSplit).length === 0 ? (
                  <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 items-center">
                    <Text className="text-emerald-500 font-bold text-xs">🎉 All Debts Settled!</Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {calculateBalances(activeSplit).map((b, idx) => (
                      <View
                        key={idx}
                        className="bg-gray-900 border border-gray-850 rounded-xl p-3 flex-row items-center justify-between"
                      >
                        <View className="flex-1 min-w-0 pr-3">
                          <Text className="text-gray-300 text-xs font-semibold leading-relaxed">
                            <Text className="text-white font-bold">{b.from.name}</Text> owes{" "}
                            <Text className="text-white font-bold">{b.to.name}</Text>
                          </Text>
                          <Text className="text-indigo-400 font-bold text-sm mt-0.5">
                            {formatINR(b.amount)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleOpenSettle(b.from.id, b.to.id, b.amount)}
                          className="bg-indigo-650 px-3.5 py-1.5 rounded-lg border border-indigo-500/20"
                        >
                          <Text className="text-white text-[11px] font-bold">Settle</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Add Member Inline */}
              <View className="bg-gray-900 border border-gray-850 rounded-2xl p-4 mb-6">
                <Text className="text-white font-bold text-sm mb-3">Add Group Member</Text>
                <View className="gap-2.5">
                  <TextInput
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                    placeholder="Member Name"
                    placeholderTextColor="#4b5563"
                    className="bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold"
                  />
                  <TextInput
                    value={newMemberEmail}
                    onChangeText={setNewMemberEmail}
                    placeholder="Email (Optional)"
                    placeholderTextColor="#4b5563"
                    className="bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold"
                  />
                  <TouchableOpacity
                    onPress={handleAddMemberToActive}
                    className="bg-[#6c47ff]/10 border border-[#6c47ff]/20 rounded-xl py-2.5 items-center flex-row justify-center gap-1.5"
                  >
                    <Feather name="plus-circle" size={14} color="#8b6fff" />
                    <Text className="text-[#8b6fff] font-bold text-xs">Add Member</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expenses List */}
              <View className="mb-10">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                    Split Expenses List
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenAddExpense}
                    className="flex-row items-center gap-1"
                  >
                    <Feather name="plus" size={13} color="#8b6fff" />
                    <Text className="text-[#8b6fff] text-xs font-bold">Add Expense</Text>
                  </TouchableOpacity>
                </View>

                {activeSplit.expenses.length === 0 ? (
                  <Text className="text-gray-500 text-center py-4">No expenses recorded yet.</Text>
                ) : (
                  <View className="gap-2.5">
                    {activeSplit.expenses.map((e) => {
                      const payer = activeSplit.members.find((m) => m.id === e.paidBy);
                      return (
                        <View
                          key={e.id}
                          className="bg-gray-900 border border-gray-850 rounded-xl p-4 flex-row items-center justify-between"
                        >
                          <View className="flex-1 pr-3">
                            <Text className="text-white font-bold text-sm">{e.description}</Text>
                            <Text className="text-gray-400 text-[10px] mt-1 font-semibold">
                              Paid by {payer?.name || "Unknown"}
                            </Text>
                          </View>
                          <View className="items-end gap-2">
                            <Text className="text-white font-bold text-sm">{formatINR(e.amount)}</Text>
                            <TouchableOpacity
                              onPress={() => deleteSplitExpense(activeSplit.id, e.id)}
                              className="p-1"
                            >
                              <Feather name="trash-2" size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Quick Actions Footer Panel */}
            <View className="px-4 py-3 bg-gray-900 border-t border-gray-850 flex-row gap-2">
              <TouchableOpacity
                onPress={handleOpenAddExpense}
                className="flex-1 bg-[#6c47ff] py-3.5 rounded-xl items-center flex-row justify-center gap-2"
              >
                <Feather name="plus-circle" size={16} color="white" />
                <Text className="text-white font-bold text-xs font-syne">Add Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleOpenSettle()}
                className="flex-1 bg-emerald-650 py-3.5 rounded-xl items-center flex-row justify-center gap-2 border border-emerald-500/20"
              >
                <Feather name="check-circle" size={16} color="white" />
                <Text className="text-white font-bold text-xs font-syne">Settle Debt</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* ────────────────────────────────────────────────────────
          3. ADD SPLIT EXPENSE SUB-MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={addExpenseOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddExpenseOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setAddExpenseOpen(false)}
          />
          {activeSplit && (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="bg-gray-900 rounded-t-3xl border-t border-gray-800 p-5 max-h-[85%]"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-base font-bold font-syne">Add Split Expense</Text>
                <TouchableOpacity onPress={() => setAddExpenseOpen(false)}>
                  <Feather name="x" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <ScrollView className="space-y-4 mb-4" showsVerticalScrollIndicator={false}>
                {/* Description */}
                <View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Expense Description
                  </Text>
                  <TextInput
                    value={expenseDesc}
                    onChangeText={setExpenseDesc}
                    placeholder="e.g. Goa Cab, Dinner bill"
                    placeholderTextColor="#4b5563"
                    className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs font-semibold"
                  />
                </View>

                {/* Amount */}
                <View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Amount (₹)
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={expenseAmount}
                    onChangeText={(t) => setExpenseAmount(t.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    placeholderTextColor="#4b5563"
                    className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs font-semibold"
                  />
                </View>

                {/* Paid By */}
                <View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Paid By
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {activeSplit.members.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setExpensePaidBy(m.id)}
                        className={`px-3 py-2 rounded-xl border ${
                          expensePaidBy === m.id
                            ? "border-[#8b6fff] bg-[#6c47ff]/20"
                            : "border-gray-800 bg-gray-950"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            expensePaidBy === m.id ? "text-[#8b6fff]" : "text-gray-400"
                          }`}
                        >
                          {m.avatar || "👤"} {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Split Among checkboxes */}
                <View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Split Among
                  </Text>
                  <View className="gap-2">
                    {activeSplit.members.map((m) => {
                      const selected = expenseSplitAmong.includes(m.id);
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => handleToggleSplitAmong(m.id)}
                          className={`flex-row items-center justify-between px-3 py-2.5 rounded-xl border ${
                            selected
                              ? "border-[#8b6fff]/40 bg-[#6c47ff]/10"
                              : "border-gray-850 bg-gray-950"
                          }`}
                        >
                          <Text className="text-gray-300 text-xs font-bold">{m.name}</Text>
                          <Feather
                            name={selected ? "check-square" : "square"}
                            size={16}
                            color={selected ? "#8b6fff" : "#4b5563"}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveSplitExpense}
                className="bg-[#6c47ff] py-4 rounded-xl items-center mb-6"
              >
                <Text className="text-white font-bold text-xs font-syne">Save Expense</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────
          4. SETTLE DEBT SUB-MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal
        visible={settleOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettleOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setSettleOpen(false)}
          />
          {activeSplit && (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="bg-gray-900 rounded-t-3xl border-t border-gray-800 p-5 max-h-[80%]"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-base font-bold font-syne">Log Debt Settlement</Text>
                <TouchableOpacity onPress={() => setSettleOpen(false)}>
                  <Feather name="x" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <ScrollView className="space-y-4 mb-4" showsVerticalScrollIndicator={false}>
                {/* Payer (From) */}
                <View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Who Paid (From)
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {activeSplit.members.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setSettleFrom(m.id)}
                        className={`px-3 py-2 rounded-xl border ${
                          settleFrom === m.id
                            ? "border-[#8b6fff] bg-[#6c47ff]/20"
                            : "border-gray-800 bg-gray-950"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            settleFrom === m.id ? "text-[#8b6fff]" : "text-gray-400"
                          }`}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Payee (To) */}
                <View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Who Received (To)
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {activeSplit.members.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setSettleTo(m.id)}
                        className={`px-3 py-2 rounded-xl border ${
                          settleTo === m.id
                            ? "border-[#8b6fff] bg-[#6c47ff]/20"
                            : "border-gray-800 bg-gray-950"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            settleTo === m.id ? "text-[#8b6fff]" : "text-gray-400"
                          }`}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Amount */}
                <View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Settlement Amount (₹)
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={settleAmount}
                    onChangeText={(t) => setSettleAmount(t.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    placeholderTextColor="#4b5563"
                    className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs font-semibold"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveSettle}
                className="bg-emerald-650 py-4 rounded-xl items-center mb-6"
              >
                <Text className="text-white font-bold text-xs font-syne">Log Settlement</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}


// Quick helper to fetch date
function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const splitsStyles = StyleSheet.create({
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
