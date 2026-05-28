import { Colors, Currency, formatWithCommas } from "@/constants/theme";
import { TrendingDown, TrendingUp } from "lucide-react-native";
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

import LottieView from "lottie-react-native";

interface BalanceCardProps {
  total: number;
  income: number;
  expense: number;
}

const { width } = Dimensions.get("window");

export function BalanceCard({ total, income, expense }: BalanceCardProps) {
  const cardBg = total >= 0 ? "#22c55e" : "#ef4444";

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      {/* Neubrutalist grid dots background overlay */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {Array.from({ length: 45 }).map((_, i) => (
          <View key={i} style={styles.gridDot} />
        ))}
      </View>

      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Net Portfolio</Text>
          <Text style={styles.balance}>
            {Currency}
            {formatWithCommas(total)}
          </Text>
        </View>
        <View style={styles.lottieHost}>
          <LottieView
            source={
              expense > income
                ? require("@/assets/sad_emoticon.json")
                : require("@/assets/Smiley.json")
            }
            style={styles.piggy}
            autoPlay
            loop
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.stat}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 14 }}>📈</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statVal}>
              +{Currency}
              {formatWithCommas(income)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: "rgba(244, 63, 94, 0.1)" },
            ]}
          >
            <Text style={{ fontSize: 14 }}>📉</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={styles.statVal}>
              -{Currency}
              {formatWithCommas(expense)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    height: 200,
    justifyContent: "space-between",
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  balance: {
    color: "#000000",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 4,
  },
  lottieHost: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -25,
    marginRight: -20,
    position: "absolute",
    right: 15,
    top: 15,
  },
  piggy: {
    width: "100%",
    height: "100%",
  },
  footer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    marginHorizontal: -24,
    marginBottom: -24,
    padding: 20,
    borderBottomLeftRadius: 13, // 16 - 2.5
    borderBottomRightRadius: 13,
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 2.5,
    borderTopColor: '#171717',
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statVal: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  gridOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.12,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  gridDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "#000",
    margin: 14,
  },
});
