import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { formatINR } from "@/lib/utils";
import type { Bank } from "@/lib/types";

interface AccountCardProps {
  bank: Bank;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AccountCard({ bank, onEdit, onDelete }: AccountCardProps) {
  return (
    <View className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-3 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center border border-indigo-500/20">
            <Text className="text-lg">🏦</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold font-syne" numberOfLines={1}>
              {bank.name}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5 font-semibold">
              Bank Account
            </Text>
          </View>
        </View>

        <View className="pt-2 border-t border-gray-850 mt-2">
          <Text className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
            Current Balance
          </Text>
          <Text className="text-white text-lg font-bold font-syne mt-0.5">
            {formatINR(bank.balance ?? 0)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        {onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
          >
            <Feather name="edit-2" size={13} color="#9ca3af" />
          </TouchableOpacity>
        )}
        {onDelete && bank.id !== "default" && (
          <TouchableOpacity
            onPress={onDelete}
            className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center"
          >
            <Feather name="trash-2" size={13} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
