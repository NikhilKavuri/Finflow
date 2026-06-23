import { View } from "react-native";
import { ExpenseCard } from "@/components/cards/ExpenseCard";

interface SpendFeedProps {
  expenses: any[];
  onEdit?: (expenseId: string) => void;
}

export function SpendFeed({ expenses, onEdit }: SpendFeedProps) {
  return (
    <View style={{ gap: 8 }}>
      {expenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={() => onEdit?.(expense.id)}
        />
      ))}
    </View>
  );
}
