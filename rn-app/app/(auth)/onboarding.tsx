import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Feather } from "@expo/vector-icons";

const SALARY_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function OnboardingScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [name, setName] = useState("");
  const [budgetCycleStartDay, setBudgetCycleStartDay] = useState(1);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    if (!name || !monthlyBudget) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (user) {
        // Update profile
        await updateProfile(user, { displayName: name });

        // Create user document
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          email: user.email,
          name,
          budgetCycleStartDay: parseInt(budgetCycleStartDay.toString()),
          billingCycleStart: 15,
          paymentDueDay: 5,
          monthlyBudget: parseFloat(monthlyBudget),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        router.replace("/(app)/home");
      }
    } catch (err: any) {
      setError(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={onboardingStyles.container}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={onboardingStyles.container}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-between px-6 py-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-white text-3xl font-bold">Let's Get Started</Text>
            <Text className="text-gray-400 text-center mt-2">
              Set up your financial profile
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 w-full">
            {/* Name Input */}
            <View>
              <Text className="text-gray-300 text-sm font-semibold mb-2">
                Full Name
              </Text>
              <TextInput
                placeholder="John Doe"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
                editable={!loading}
                className="bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-800"
              />
            </View>

            {/* Salary Day Input */}
            <View>
              <Text className="text-gray-300 text-sm font-semibold mb-2">
                Salary Day (Budget Cycle Start)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {SALARY_DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setBudgetCycleStartDay(day)}
                    className={`w-12 h-12 rounded-lg border-2 items-center justify-center ${
                      budgetCycleStartDay === day
                        ? "border-indigo-600 bg-indigo-600/20"
                        : "border-gray-800 bg-gray-900"
                    }`}
                  >
                    <Text className={budgetCycleStartDay === day ? "text-indigo-400 font-bold" : "text-gray-400"}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Monthly Budget */}
            <View>
              <Text className="text-gray-300 text-sm font-semibold mb-2">
                Monthly Budget (₹)
              </Text>
              <TextInput
                placeholder="50000"
                placeholderTextColor="#6b7280"
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
                editable={!loading}
                keyboardType="decimal-pad"
                className="bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-800"
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Complete Button */}
            <TouchableOpacity
              onPress={handleComplete}
              disabled={loading}
              className="bg-indigo-600 py-3 rounded-lg items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Get Started
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-xs text-center">
            You can change these settings later in your profile
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
});
