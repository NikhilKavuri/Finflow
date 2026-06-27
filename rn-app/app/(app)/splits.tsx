import React, { useState, useMemo } from "react";
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
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSplits, calculateBalances, getSplitTotal, getMemberSpending } from "@/hooks/useSplits";
import { TripCard } from "@/components/cards/TripCard";
import { Feather } from "@expo/vector-icons";
import { formatINR } from "@/lib/utils";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, { FadeInUp, FadeOutUp, FadeIn, Layout } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import type { SplitSession, SplitMember, SplitExpense } from "@/lib/types";

const ICONS = ["💰", "🍕", "🏠", "🎓", "🤝", "🚗", "🎉", "✈️", "⛺", "🎪", "🛒", "🌴"];

const AVATARS = ["😎", "🦁", "😊", "🥳", "🧐", "😈", "🦊", "🐻"];

export default function SplitsScreen() {
  const insets = useSafeAreaInsets();
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

  // Modals visibility
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Active Context
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"Expenses" | "Balances">("Expenses");

  // Create/Edit Split Form State
  const [splitName, setSplitName] = useState("");
  const [splitEmoji, setSplitEmoji] = useState("💰");
  const [splitMembers, setSplitMembers] = useState<{ name: string; email?: string, avatar: string }[]>([
    { name: "You", email: "", avatar: "😎" },
  ]);

  // Add Member Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Expense State
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseSplitAmong, setExpenseSplitAmong] = useState<string[]>([]);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // Settlement State
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const activeSplit = useMemo(() => {
    return splits.find((s) => s.id === selectedSplitId) || null;
  }, [splits, selectedSplitId]);

  // Create Split Helpers
  const handleOpenCreateModal = () => {
    setSplitName("");
    setSplitEmoji("💰");
    setSplitMembers([{ name: "You", email: "", avatar: "😎" }]);
    setCreateOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!activeSplit) return;
    setSplitName(activeSplit.name);
    setSplitEmoji(activeSplit.emoji || "💰");
    setEditOpen(true);
  };

  const handleAddMemberRow = () => {
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    setSplitMembers([...splitMembers, { name: "", email: "", avatar: randomAvatar }]);
  };

  const handleMemberRowChange = (index: number, key: "name" | "email", val: string) => {
    const next = [...splitMembers];
    next[index] = { ...next[index], [key]: val };
    setSplitMembers(next);
  };

  const handleRemoveMemberRow = (index: number) => {
    setSplitMembers(splitMembers.filter((_, i) => i !== index));
  };

  const handleSaveSplit = async () => {
    const name = splitName.trim();
    if (!name) {
      alert("Please enter a split name.");
      return;
    }

    const validMembers = splitMembers
      .map((m) => ({ name: m.name.trim(), email: m.email?.trim(), avatar: m.avatar }))
      .filter((m) => m.name.length > 0);

    if (validMembers.length < 2) {
      alert("Please add at least one other member to split with.");
      return;
    }

    await createSplit(name, splitEmoji, validMembers);
    setCreateOpen(false);
  };

  const handleUpdateSplit = () => {
    alert("Split details updated!");
    setEditOpen(false);
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

  // Add Member Helper
  const handleAddMemberToActive = async () => {
    if (!activeSplit) return;
    const name = newMemberName.trim();
    if (!name) {
      alert("Please enter a member name.");
      return;
    }

    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    await addMember(activeSplit.id, {
      name,
      email: newMemberEmail.trim() || undefined,
      avatar: randomAvatar,
      status: "accepted",
    });

    setNewMemberName("");
    setNewMemberEmail("");
    setAddMemberOpen(false);
  };

  // Expense Helpers
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

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="git-pull-request" size={24} color="#6c47ff" style={{ transform: [{ rotate: "180deg" }] }} />
              <MaskedView maskElement={<Text style={styles.headerTitleMask}>Splits</Text>}>
                <LinearGradient colors={["#b8ff57", "#b8ff57"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={[styles.headerTitleMask, { opacity: 0 }]}>Splits</Text>
                </LinearGradient>
              </MaskedView>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Feather name="bell" size={20} color="#5a5a6e" />
              <Text style={{ color: "#5a5a6e", fontWeight: "700", fontSize: 12 }}>{splits.length} active</Text>
            </View>
          </View>

          {/* Splits list */}
          <View style={{ paddingHorizontal: 24 }}>
            {splits.length === 0 ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.emptyStateContainer}>
                <View style={styles.emptyIconContainer}>
                  <Text style={{ fontSize: 32 }}>💰</Text>
                </View>
                <Text style={styles.emptyTitle}>No splits yet</Text>
                <Text style={styles.emptyDesc}>
                  Create a split to share expenses with friends. Track who paid what and settle up easily.
                </Text>
                <TouchableOpacity onPress={handleOpenCreateModal} style={styles.createFirstBtn}>
                  <Text style={styles.createFirstBtnText}>Create Your First Split 💰</Text>
                </TouchableOpacity>
              </Animated.View>
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

        {/* Global FAB */}
        {!detailOpen && (
          <TouchableOpacity activeOpacity={0.9} onPress={handleOpenCreateModal} style={styles.fabContainer}>
            <View style={styles.fabGlow} />
            <LinearGradient colors={["#8b6fff", "#6c47ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
              <Feather name="plus" size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      {/* ────────────────────────────────────────────────────────
          1. CREATE SPLIT MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal visible={createOpen} animationType="fade" transparent={true} onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCreateOpen(false)} />
          <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.modalCard}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>New Split</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={16} color="#9898aa" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>SPLIT NAME</Text>
              <TextInput
                value={splitName}
                onChangeText={setSplitName}
                placeholder="e.g. Roommates, Dinner, Road Trip..."
                placeholderTextColor="#5a5a6e"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>ICON</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSplitEmoji(icon)}
                    style={[styles.iconBtn, splitEmoji === icon && styles.iconBtnSelected]}
                  >
                    <Text style={{ fontSize: 18 }}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 12 }}>
                <Text style={styles.inputLabel}>MEMBERS ({splitMembers.length})</Text>
                <TouchableOpacity onPress={handleAddMemberRow} style={styles.addMemberIconBtn}>
                  <Feather name="plus" size={14} color="#8b6fff" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 12, marginBottom: 24 }}>
                {splitMembers.map((member, idx) => (
                  <Animated.View layout={Layout.springify()} key={idx} style={styles.memberInputRow}>
                    <View style={styles.memberAvatarBox}>
                      <Text style={{ fontSize: 18 }}>{member.avatar}</Text>
                    </View>
                    <TextInput
                      value={member.name}
                      onChangeText={(val) => handleMemberRowChange(idx, "name", val)}
                      placeholder={idx === 0 ? "You (Name)" : `Member ${idx + 1} name`}
                      placeholderTextColor="#5a5a6e"
                      style={styles.memberTextInput}
                    />
                    {idx > 0 && (
                      <TouchableOpacity onPress={() => handleRemoveMemberRow(idx)} style={{ padding: 12 }}>
                        <Feather name="x" size={16} color="#5a5a6e" />
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity onPress={handleSaveSplit} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Create Split 💰</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>





      {/* ────────────────────────────────────────────────────────
          4. SPLIT DETAILS OVERLAY MODAL
          ──────────────────────────────────────────────────────── */}
      <Modal visible={detailOpen && activeSplit !== null} animationType="slide" transparent={false} onRequestClose={() => setDetailOpen(false)}>
        {activeSplit && (
          <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.detailsHeader}>
              <TouchableOpacity onPress={() => setDetailOpen(false)} style={styles.backBtn}>
                <Feather name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 20 }}>{activeSplit.emoji}</Text>
                <Text style={styles.detailsHeaderTitle}>{activeSplit.name}</Text>
              </View>
              <TouchableOpacity onPress={handleOpenEditModal} style={styles.backBtn}>
                <Feather name="more-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Member Scroll */}
              <View style={{ marginVertical: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
                  {activeSplit.members.map((m, i) => (
                    <View key={m.id} style={{ alignItems: "center", gap: 8 }}>
                      <View style={styles.memberScrollAvatar}>
                        <Text style={{ fontSize: 24 }}>{m.avatar || "👤"}</Text>
                        {i === 0 && (
                          <View style={styles.crownBadge}>
                            <Text style={{ fontSize: 10 }}>👑</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberScrollName}>{m.name.split(' ')[0]}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Summary Cards */}
              <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 16, marginBottom: 24 }}>
                <View style={[styles.summaryCard, { flex: 1 }]}>
                  <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                  <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
                  <Text style={styles.summaryValue}>{formatINR(getSplitTotal(activeSplit))}</Text>
                </View>
                <View style={[styles.summaryCard, { flex: 1 }]}>
                  <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                  <Text style={styles.summaryLabel}>PER PERSON</Text>
                  <Text style={styles.summaryValuePurple}>
                    {formatINR(activeSplit.members.length > 0 ? getSplitTotal(activeSplit) / activeSplit.members.length : 0)}
                  </Text>
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity onPress={() => setActiveTab("Expenses")} style={[styles.tabBtn, activeTab === "Expenses" && styles.tabBtnActive]}>
                  <Text style={[styles.tabBtnText, activeTab === "Expenses" && styles.tabBtnTextActive]}>Expenses ({activeSplit.expenses.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab("Balances")} style={[styles.tabBtn, activeTab === "Balances" && styles.tabBtnActive]}>
                  <Text style={[styles.tabBtnText, activeTab === "Balances" && styles.tabBtnTextActive]}>Balances ({calculateBalances(activeSplit).length})</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                <View style={styles.searchBar}>
                  <Feather name="search" size={18} color="#5a5a6e" />
                  <TextInput placeholder="Search expenses by name or amount..." placeholderTextColor="#5a5a6e" style={styles.searchInput} />
                </View>
              </View>

              {/* Tab Content */}
              {activeTab === "Expenses" ? (
                <View style={{ paddingHorizontal: 24, paddingBottom: 100 }}>
                  {activeSplit.expenses.map((exp) => {
                    const payer = activeSplit.members.find((m) => m.id === exp.paidBy);
                    const isExpanded = expandedExpenseId === exp.id;
                    const amountPerPerson = exp.amount / exp.splitAmong.length;

                    return (
                      <Animated.View layout={Layout.springify()} key={exp.id} style={styles.expenseItem}>
                        <TouchableOpacity 
                          activeOpacity={0.8} 
                          onPress={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <View>
                            <Text style={styles.expenseTitle}>{exp.description}</Text>
                            <Text style={styles.expenseSub}>Paid by {payer?.name || "Unknown"} · Today</Text>
                          </View>
                          <Text style={styles.expenseAmount}>{formatINR(exp.amount)}</Text>
                        </TouchableOpacity>

                        {isExpanded && (
                          <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.expenseExpandedBlock}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                              <Text style={styles.expenseExpandedLabel}>SPLIT EQUALLY · {exp.splitAmong.length} PEOPLE</Text>
                              <Text style={styles.expenseExpandedAmount}>{formatINR(amountPerPerson)} each</Text>
                            </View>
                            {exp.splitAmong.map(memberId => {
                              const m = activeSplit.members.find(memb => memb.id === memberId);
                              const isSelf = memberId === exp.paidBy;
                              return (
                                <View key={memberId} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Text style={{ fontSize: 16 }}>{m?.avatar || "👤"}</Text>
                                    <Text style={{ color: "#d1d5db", fontSize: 14 }}>{m?.name}</Text>
                                  </View>
                                  <Text style={{ color: isSelf ? "#10b981" : "#ff4f6b", fontSize: 12, fontWeight: "600" }}>
                                    {isSelf ? "self · " : "owes "}{formatINR(amountPerPerson)}
                                  </Text>
                                </View>
                              );
                            })}

                            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                              <TouchableOpacity style={styles.expenseActionBtn}>
                                <Feather name="edit-2" size={14} color="#8b6fff" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => deleteSplitExpense(activeSplit.id, exp.id)} style={styles.expenseActionBtnRed}>
                                <Feather name="trash-2" size={14} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </Animated.View>
                        )}
                      </Animated.View>
                    );
                  })}
                </View>
              ) : (
                <View style={{ paddingHorizontal: 24, paddingBottom: 100 }}>
                  <TouchableOpacity onPress={() => setSettleOpen(true)} style={[styles.primaryBtn, { marginBottom: 24 }]}>
                    <Text style={styles.primaryBtnText}>Settle Debt Quickly</Text>
                  </TouchableOpacity>
                  {calculateBalances(activeSplit).map((b, idx) => (
                    <View key={idx} style={styles.expenseItem}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 14 }}>
                          <Text style={{ fontWeight: "700" }}>{b.from.name}</Text> owes <Text style={{ fontWeight: "700" }}>{b.to.name}</Text>
                        </Text>
                        <Text style={{ color: "#8b6fff", fontSize: 16, fontWeight: "700" }}>{formatINR(b.amount)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Split details FABs */}
            <View style={styles.bottomNavContainer}>
              <TouchableOpacity style={styles.navBtn}>
                <Feather name="home" size={20} color="#5a5a6e" />
                <Text style={styles.navBtnText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn}>
                <Feather name="dollar-sign" size={20} color="#5a5a6e" />
                <Text style={styles.navBtnText}>Expenses</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn}>
                <Feather name="briefcase" size={20} color="#5a5a6e" />
                <Text style={styles.navBtnText}>Accounts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtnActive}>
                <Feather name="git-pull-request" size={20} color="#8b6fff" style={{ transform: [{ rotate: "180deg" }] }} />
                <Text style={styles.navBtnTextActive}>Splits</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAddMemberOpen(true)} style={styles.navBtn}>
                <Feather name="user-plus" size={20} color="#5a5a6e" />
                <Text style={styles.navBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {activeTab === "Expenses" && (
              <TouchableOpacity activeOpacity={0.9} onPress={handleOpenAddExpense} style={[styles.fabContainer, { bottom: 90 }]}>
                <View style={styles.fabGlow} />
                <LinearGradient colors={["#8b6fff", "#6c47ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
                  <Feather name="plus" size={28} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* NESTED MODALS FOR DETAILS VIEW TO WORK ON IOS */}
            <Modal visible={editOpen} animationType="fade" transparent={true} onRequestClose={() => setEditOpen(false)}>
              <View style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEditOpen(false)} />
                <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.modalCard}>
                  <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                  
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Edit Split</Text>
                    <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.closeBtn}>
                      <Feather name="x" size={16} color="#9898aa" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.inputLabel}>SPLIT NAME</Text>
                    <TextInput
                      value={splitName}
                      onChangeText={setSplitName}
                      placeholder="Split Name"
                      placeholderTextColor="#5a5a6e"
                      style={styles.input}
                    />

                    <Text style={styles.inputLabel}>ICON</Text>
                    <View style={styles.iconGrid}>
                      {ICONS.map((icon) => (
                        <TouchableOpacity
                          key={icon}
                          onPress={() => setSplitEmoji(icon)}
                          style={[styles.iconBtn, splitEmoji === icon && styles.iconBtnSelected]}
                        >
                          <Text style={{ fontSize: 18 }}>{icon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                    <TouchableOpacity onPress={() => setEditOpen(false)} style={[styles.secondaryBtn, { flex: 1 }]}>
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleUpdateSplit} style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}>
                      <Text style={styles.primaryBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            </Modal>

            <Modal visible={addMemberOpen} animationType="fade" transparent={true} onRequestClose={() => setAddMemberOpen(false)}>
              <View style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setAddMemberOpen(false)} />
                <Animated.View entering={FadeInUp.duration(300).springify()} style={[styles.modalCard, { maxHeight: 400 }]}>
                  <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                  
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Add Member</Text>
                    <TouchableOpacity onPress={() => setAddMemberOpen(false)} style={styles.closeBtn}>
                      <Feather name="x" size={16} color="#9898aa" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 12, marginBottom: 24 }}>
                    <View style={styles.memberInputRow}>
                      <View style={styles.memberAvatarBox}>
                        <Text style={{ fontSize: 18 }}>😊</Text>
                      </View>
                      <TextInput
                        value={newMemberName}
                        onChangeText={setNewMemberName}
                        placeholder="Member name"
                        placeholderTextColor="#5a5a6e"
                        style={styles.memberTextInput}
                      />
                    </View>
                    <TextInput
                      value={newMemberEmail}
                      onChangeText={setNewMemberEmail}
                      placeholder="Email (optional)"
                      placeholderTextColor="#5a5a6e"
                      style={styles.input}
                    />
                  </View>

                  <TouchableOpacity onPress={handleAddMemberToActive} style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Add Member</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Modal>

            <Modal visible={addExpenseOpen} animationType="fade" transparent={true} onRequestClose={() => setAddExpenseOpen(false)}>
              <View style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setAddExpenseOpen(false)} />
                <Animated.View entering={FadeInUp.duration(300).springify()} style={[styles.modalCard, { maxHeight: '80%' }]}>
                  <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Add Expense</Text>
                    <TouchableOpacity onPress={() => setAddExpenseOpen(false)} style={styles.closeBtn}>
                      <Feather name="x" size={16} color="#9898aa" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <TextInput value={expenseDesc} onChangeText={setExpenseDesc} placeholder="Description" placeholderTextColor="#5a5a6e" style={styles.input} />
                    <TextInput keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} placeholder="Amount" placeholderTextColor="#5a5a6e" style={styles.input} />
                    <TouchableOpacity onPress={handleSaveSplitExpense} style={styles.primaryBtn}>
                      <Text style={styles.primaryBtnText}>Save</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </Animated.View>
              </View>
            </Modal>

            <Modal visible={settleOpen} animationType="fade" transparent={true} onRequestClose={() => setSettleOpen(false)}>
              <View style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSettleOpen(false)} />
                <Animated.View entering={FadeInUp.duration(300).springify()} style={[styles.modalCard, { maxHeight: '80%' }]}>
                  <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Settle Debt</Text>
                    <TouchableOpacity onPress={() => setSettleOpen(false)} style={styles.closeBtn}>
                      <Feather name="x" size={16} color="#9898aa" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <TextInput keyboardType="numeric" value={settleAmount} onChangeText={setSettleAmount} placeholder="Amount to settle" placeholderTextColor="#5a5a6e" style={styles.input} />
                    <TouchableOpacity onPress={handleSaveSettle} style={styles.primaryBtn}>
                      <Text style={styles.primaryBtnText}>Log Settlement</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </Animated.View>
              </View>
            </Modal>
          </View>
        )}
      </Modal>



    </SafeAreaView>
  );
}

function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  headerTitleMask: {
    fontSize: 28,
    fontWeight: "900",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: "rgba(20, 20, 27, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  emptyDesc: {
    color: "#5a5a6e",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  createFirstBtn: {
    backgroundColor: "#8b6fff",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: "#8b6fff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  createFirstBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: "rgba(20, 20, 27, 0.7)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: "#fff",
    fontSize: 14,
    marginBottom: 24,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnSelected: {
    borderColor: "#8b6fff",
    backgroundColor: "rgba(108, 71, 255, 0.15)",
  },
  addMemberIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(108, 71, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 4,
  },
  memberAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  memberTextInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 16,
    height: 44,
  },
  primaryBtn: {
    backgroundColor: "#8b6fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsHeaderTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  memberScrollAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(20, 20, 27, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  crownBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#1a1a24",
    borderRadius: 10,
    padding: 2,
  },
  memberScrollName: {
    color: "#9898aa",
    fontSize: 10,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "rgba(20, 20, 27, 0.4)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  summaryLabel: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryValuePurple: {
    color: "#8b6fff",
    fontSize: 24,
    fontWeight: "900",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(20, 20, 27, 0.8)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  tabBtnActive: {
    backgroundColor: "rgba(108, 71, 255, 0.15)",
    borderColor: "rgba(108, 71, 255, 0.3)",
  },
  tabBtnText: {
    color: "#5a5a6e",
    fontSize: 14,
    fontWeight: "700",
  },
  tabBtnTextActive: {
    color: "#8b6fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 20, 27, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 12,
  },
  expenseItem: {
    backgroundColor: "rgba(20, 20, 27, 0.6)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  expenseTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  expenseSub: {
    color: "#5a5a6e",
    fontSize: 12,
    fontWeight: "500",
  },
  expenseAmount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  expenseExpandedBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  expenseExpandedLabel: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  expenseExpandedAmount: {
    color: "#8b6fff",
    fontSize: 10,
    fontWeight: "800",
  },
  expenseActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(108, 71, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  expenseActionBtnRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: "rgba(10, 10, 15, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navBtn: {
    alignItems: "center",
    gap: 4,
  },
  navBtnActive: {
    alignItems: "center",
    gap: 4,
  },
  navBtnText: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "600",
  },
  navBtnTextActive: {
    color: "#8b6fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
