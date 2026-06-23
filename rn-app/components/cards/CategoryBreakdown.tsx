import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, { useAnimatedStyle, withSpring, withTiming, FadeInDown, FadeOutUp } from "react-native-reanimated";
import { CATEGORIES } from "@/lib/categories";
import { formatINR } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedView = Animated.createAnimatedComponent(View);

interface CategoryBreakdownProps {
  expenses: Transaction[];
  onCategorySelect?: (id: string) => void;
}

const CHART_SIZE = 220;
const CENTER = CHART_SIZE / 2;
const RADIUS = 95;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeWedge(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (Math.abs(endAngle - startAngle) >= 359.9) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

const AnimatedWedge = ({ 
  arc, 
  hoveredId, 
  setHoveredId, 
  onCategorySelect 
}: { 
  arc: any; 
  hoveredId: string | null; 
  setHoveredId: (id: string | null) => void; 
  onCategorySelect?: (id: string) => void; 
}) => {
  const isActive = hoveredId === arc.id;
  const style = useAnimatedStyle(() => {
    return {
      opacity: withTiming(hoveredId && !isActive ? 0.3 : 1, { duration: 200 }),
      transform: [
        { translateX: CENTER },
        { translateY: CENTER },
        { scale: withSpring(isActive ? 1.08 : 1, { damping: 20, stiffness: 300 }) },
        { translateX: -CENTER },
        { translateY: -CENTER },
      ],
    };
  }, [isActive, hoveredId]);

  return (
    <AnimatedPath
      d={arc.path}
      fill={arc.cat.color}
      stroke="#121218"
      strokeWidth={3}
      strokeLinejoin="round"
      style={style}
      onPressIn={() => setHoveredId(arc.id)}
      onPressOut={() => setHoveredId(null)}
      onPress={() => onCategorySelect?.(arc.id)}
    />
  );
};

export function CategoryBreakdown({ expenses, onCategorySelect }: CategoryBreakdownProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([id, amount]) => ({ 
        id, 
        amount, 
        cat: CATEGORIES.find(c => c.id === id) || { id, name: id, emoji: "💳", color: "#6c47ff" }
      }));
  }, [expenses]);

  const totalAmount = catData.reduce((sum, item) => sum + item.amount, 0) || 1;

  const arcs = useMemo(() => {
    let currentAngle = 0;
    return catData.map(({ id, amount, cat }) => {
      const pct = amount / totalAmount;
      const sweep = pct * 360;
      
      const arc = {
        id,
        amount,
        cat,
        pct,
        startAngle: currentAngle,
        endAngle: currentAngle + sweep,
        path: describeWedge(CENTER, CENTER, RADIUS, currentAngle, currentAngle + sweep),
      };
      currentAngle += sweep;
      return arc;
    });
  }, [catData, totalAmount]);

  const activeItem = hoveredId ? catData.find((c) => c.id === hoveredId) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.subtitle}>Tap a category to view its spend feed.</Text>
      </View>

      {catData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>Add your first expense to see breakdown</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {/* Active Info Card */}
          <View style={styles.activeInfoWrapper}>
            {activeItem ? (
              <AnimatedView
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(200)}
                style={[
                  styles.activeCard,
                  { 
                    backgroundColor: activeItem.cat.color + "15",
                    borderColor: activeItem.cat.color + "30"
                  }
                ]}
              >
                <Text style={styles.activeEmoji}>{activeItem.cat.emoji}</Text>
                <View>
                  <Text style={styles.activeName}>{activeItem.cat.name}</Text>
                  <View style={styles.activeAmountRow}>
                    <Text style={[styles.activeAmount, { color: activeItem.cat.color }]}>
                      {formatINR(activeItem.amount)}
                    </Text>
                    <View style={[styles.activePctBadge, { backgroundColor: activeItem.cat.color + "40" }]}>
                      <Text style={styles.activePctText}>
                        {Math.round((activeItem.amount / totalAmount) * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </AnimatedView>
            ) : (
              <AnimatedView
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(200)}
                style={[styles.activeCard, styles.totalCard]}
              >
                <View style={styles.totalIconBox}>
                  <Text style={styles.totalEmoji}>💸</Text>
                </View>
                <View>
                  <Text style={styles.totalLabel}>TOTAL SPENT</Text>
                  <Text style={styles.totalAmount}>{formatINR(totalAmount)}</Text>
                </View>
              </AnimatedView>
            )}
          </View>

          {/* SVG Pie Chart */}
          <View style={styles.chartWrapper}>
            <View style={styles.chartOuterRing} />
            <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
              {arcs.map((arc) => (
                <AnimatedWedge
                  key={arc.id}
                  arc={arc}
                  hoveredId={hoveredId}
                  setHoveredId={setHoveredId}
                  onCategorySelect={onCategorySelect}
                />
              ))}
            </Svg>
          </View>

          {/* Legend Grid */}
          <View style={styles.legendGrid}>
            {catData.map(({ id, amount, cat }) => {
              const isActive = hoveredId === id;
              return (
                <TouchableOpacity
                  key={id}
                  activeOpacity={0.8}
                  onPressIn={() => setHoveredId(id)}
                  onPressOut={() => setHoveredId(null)}
                  onPress={() => onCategorySelect?.(id)}
                  style={[
                    styles.legendBtn,
                    isActive ? styles.legendBtnActive : styles.legendBtnInactive
                  ]}
                >
                  <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                  <View style={styles.legendTextCol}>
                    <View style={styles.legendTitleRow}>
                      <Text style={styles.legendEmoji}>{cat.emoji}</Text>
                      <Text style={styles.legendName} numberOfLines={1}>{cat.name}</Text>
                    </View>
                  </View>
                  <Text style={[styles.legendPct, { color: cat.color }]}>
                    {Math.round((amount / totalAmount) * 100)}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  subtitle: {
    color: "#8b6fff",
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptySubtitle: {
    color: "#5a5a6e",
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#18181f",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  activeInfoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    height: 72, 
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    position: "absolute",
  },
  totalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  activeEmoji: {
    fontSize: 28,
  },
  activeName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  activeAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  activeAmount: {
    fontSize: 18,
    fontWeight: "900",
  },
  activePctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePctText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "bold",
  },
  totalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6c47ff",
    alignItems: "center",
    justifyContent: "center",
  },
  totalEmoji: {
    fontSize: 20,
  },
  totalLabel: {
    color: "#5a5a6e",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  totalAmount: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    height: CHART_SIZE,
  },
  chartOuterRing: {
    position: "absolute",
    width: CHART_SIZE * 1.05,
    height: CHART_SIZE * 1.05,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    width: "48%", 
  },
  legendBtnInactive: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  legendBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendTextCol: {
    flex: 1,
  },
  legendTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendName: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  legendPct: {
    fontSize: 11,
    fontWeight: "bold",
  },
});

