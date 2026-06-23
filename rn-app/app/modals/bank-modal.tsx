import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useExpenses } from "@/hooks/useExpenses";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

export default function BankModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, addBank, updateBank, deleteBank } = useExpenses();

  const isEditing = Boolean(id && id !== "new");
  const existingBank = isEditing ? state.banks.find(b => b.id === id) : null;

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    if (existingBank) {
      setName(existingBank.name);
      setBalance(String(existingBank.balance ?? 0));
    }
  }, [existingBank]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const amt = parseFloat(balance);
    const finalBalance = isNaN(amt) ? 0 : amt;

    if (isEditing && id) {
      updateBank(id, {
        name: name.trim(),
        balance: finalBalance,
      });
    } else {
      addBank({
        name: name.trim(),
        balance: finalBalance,
        initialBalance: finalBalance,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    if (id === "default") {
      Alert.alert("Cannot Delete", "The default bank cannot be deleted.");
      return;
    }

    Alert.alert(
      "Delete Bank",
      "Are you sure you want to delete this bank? Transactions linked to this bank will be moved to the default bank.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            deleteBank(id);
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
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? "Edit Bank" : "Add Bank"}</Text>
          {isEditing && id !== "default" && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Feather name="trash-2" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>BANK NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. HDFC Bank, SBI..."
          placeholderTextColor="#5a5a6e"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>CURRENT BALANCE (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#5a5a6e"
          keyboardType="numeric"
          value={balance}
          onChangeText={setBalance}
        />

        <TouchableOpacity onPress={handleSubmit} style={styles.submitWrapper}>
          <LinearGradient
            colors={["#6c47ff", "#8b6fff"]}
            style={styles.submitBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.submitText}>{isEditing ? "Save Changes" : "Add Bank"} ✦</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  header: {
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
    marginTop: 16,
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
