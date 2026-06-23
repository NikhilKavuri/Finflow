import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { SplitSession } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { calculateBalances, getSplitTotal } from "@/hooks/useSplits";

interface TripCardProps {
  split: SplitSession;
  onPress?: () => void;
}

export function TripCard({ split, onPress }: TripCardProps) {
  const totalAmount = getSplitTotal(split);
  const pendingDebts = calculateBalances(split);
  const isSettled = pendingDebts.length === 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-3"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="w-10 h-10 rounded-xl bg-[#6c47ff]/10 items-center justify-center">
            <Text className="text-lg">{split.emoji || "✈️"}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold font-syne" numberOfLines={1}>
              {split.name}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5 font-semibold">
              {split.isCollaborative ? "Group Split" : "Local Split"}
            </Text>
          </View>
        </View>

        <View className={`px-2.5 py-1 rounded-full ${isSettled ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
          <Text className={`text-[10px] font-bold ${isSettled ? "text-emerald-500" : "text-yellow-500"}`}>
            {isSettled ? "Settled" : "Active"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-850">
        <View>
          <Text className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Total Spent</Text>
          <Text className="text-white text-base font-bold font-syne mt-0.5">
            {formatINR(totalAmount)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-400 text-xs font-medium">
            {split.members.length} members
          </Text>
          {!isSettled && (
            <View className="mt-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              <Text className="text-red-400 text-[9px] font-bold">
                {pendingDebts.length} Debts Pending
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
