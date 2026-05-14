import { Colors, Currency } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
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
  return (
    <LinearGradient
      colors={Colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Net Portfolio</Text>
          <Text style={styles.balance}>
            {Currency}
            {total.toLocaleString()}
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
              {income.toLocaleString()}
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
              {expense.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

// Added touchable opacity mock for look

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 32,
    padding: 24,
    height: 200,
    justifyContent: "space-between",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    justifyContent: "space-between",
    alignItems: "center",
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
});
