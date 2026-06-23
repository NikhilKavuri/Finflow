import React, { useRef } from "react";
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Bank } from "@/lib/types";

interface Props {
  banks: Bank[];
  selectedBankId: string;
  onBankChange: (bankId: string) => void;
}

export function BankFilter({ banks, selectedBankId, onBankChange }: Props) {
  const scrollViewRef = useRef<ScrollView>(null);

  const allBanksOptions = [
    { id: "all", name: "All Banks", isAll: true },
    ...banks.map((b) => ({ ...b, isAll: false })),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allBanksOptions.map((bank) => {
          const active = bank.id === selectedBankId;
          const isAll = bank.isAll;

          let btnStyle = [styles.btn];
          let textStyle = [styles.btnText];
          let iconColor = "#6b7280";

          if (active) {
            if (isAll) {
              btnStyle.push(styles.btnActiveAll);
              textStyle.push(styles.textActiveAll);
              iconColor = "#b8ff57";
            } else {
              btnStyle.push(styles.btnActiveBank);
              textStyle.push(styles.textActiveBank);
              iconColor = "#8b6fff";
            }
          }

          return (
            <TouchableOpacity
              key={bank.id}
              onPress={() => onBankChange(bank.id)}
              activeOpacity={0.8}
              style={btnStyle}
            >
              {isAll ? (
                <Feather
                  name="layers"
                  size={12}
                  color={iconColor}
                />
              ) : (
                <Text style={styles.emoji}>🏦</Text>
              )}
              <Text style={textStyle}>
                {bank.name}
              </Text>
              {active && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: isAll ? "#b8ff57" : "#8b6fff" }
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#18181f",
  },
  btnActiveAll: {
    borderColor: "rgba(184,255,87,0.4)",
    backgroundColor: "rgba(184,255,87,0.1)",
  },
  btnActiveBank: {
    borderColor: "rgba(139,111,255,0.4)",
    backgroundColor: "rgba(108,71,255,0.15)",
  },
  btnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9898aa",
  },
  textActiveAll: {
    color: "#b8ff57",
  },
  textActiveBank: {
    color: "#8b6fff",
  },
  emoji: {
    fontSize: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
