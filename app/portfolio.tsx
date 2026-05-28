import { useDatabase } from "@/context/DatabaseContext";
import { formatWithCommas } from "@/constants/theme";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  X,
  Target,
  Zap,
  ShieldAlert,
  Activity,
  Award,
  Smile,
  Sparkles,
  Star
} from "lucide-react-native";
import React, { useMemo } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, categories, settings, Colors } = useDatabase();

  // Compute stats across all history
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    const balance = income - expense;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;
    return { balance, income, expense, savingsRate };
  }, [transactions]);

  // Financial Freedom Index (Emergency Runway in Months)
  // Calculate average monthly expenses (default to 1 if no transactions to prevent Division by Zero)
  const emergencyRunway = useMemo(() => {
    if (transactions.length === 0) return 0;
    
    // Group expenses by year-month
    const monthlyExpenses: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const monthKey = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
        monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + t.amount;
      });

    const months = Object.keys(monthlyExpenses);
    const totalExpense = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0);
    const averageExpense = months.length > 0 ? totalExpense / months.length : 0;

    if (averageExpense <= 0) return stats.balance > 0 ? 99 : 0;
    
    const monthsCovered = stats.balance / averageExpense;
    return parseFloat(Math.max(0, monthsCovered).toFixed(1));
  }, [transactions, stats.balance]);

  const runwayProgress = Math.min((emergencyRunway / 6) * 100, 100); // Progress towards standard 6-month safety net target

  // Define dynamic colors based on net portfolio balance
  const themeColor = stats.balance >= 0 ? "#22c55e" : "#ef4444";
  const bgTint = stats.balance >= 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>

      {/* Premium Neubrutalist Screen Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View>
          <Text style={[styles.title, { color: Colors.text }]}>Portfolio Detail</Text>
          <Text style={[styles.subTitle, { color: Colors.textMuted }]}>
            HISTORICAL AUDIT & ANALYSIS
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <X color="#ffffff" size={20} strokeWidth={3.5} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Net Portfolio Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: '#FFFFFF' }]}>
          <View style={[styles.heroAccentBar, { backgroundColor: themeColor }]} />

          <View style={styles.heroInner}>
            <View style={styles.heroTop}>
              <View>
                <Text style={[styles.heroLabel, { color: Colors.textMuted }]}>NET PORTFOLIO VALUE</Text>
                <Text style={[styles.heroAmount, { color: Colors.text }]}>
                  {settings.currency}
                  {formatWithCommas(stats.balance)}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: themeColor + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: themeColor }]} />
                <Text style={[styles.statusBadgeText, { color: themeColor }]}>
                  {stats.balance >= 0 ? "PROFIT" : "LOSS"}
                </Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroFooter}>
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatLabel, { color: Colors.textMuted }]}>Income</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={14} color="#22c55e" strokeWidth={2.5} />
                    <Text style={[styles.heroStatVal, { color: Colors.text }]}>
                      {settings.currency}{formatWithCommas(stats.income)}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatLabel, { color: Colors.textMuted }]}>Expenses</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <TrendingDown size={14} color="#ef4444" strokeWidth={2.5} />
                    <Text style={[styles.heroStatVal, { color: Colors.text }]}>
                      {settings.currency}{formatWithCommas(stats.expense)}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatLabel, { color: Colors.textMuted }]}>Savings</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Award size={14} color="#eab308" strokeWidth={2.5} />
                    <Text style={[styles.heroStatVal, { color: Colors.text }]}>
                      {Math.max(0, stats.savingsRate).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Emergency Runway Gauge */}
        <View style={[styles.bentoCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
          <View style={styles.bentoHeader}>
            <View style={[styles.iconBox, { backgroundColor: bgTint }]}>
              <Target size={20} color={themeColor} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={[styles.bentoTitle, { color: Colors.text }]}>Emergency Fund Runway</Text>
              <Text style={[styles.bentoMeta, { color: Colors.textMuted }]}>
                FINANCIAL FREEDOM INDEX (FFI)
              </Text>
            </View>
          </View>

          <View style={styles.runwayBigRow}>
            <Text style={[styles.runwayVal, { color: Colors.text }]}>{emergencyRunway}</Text>
            <View style={{ gap: 2 }}>
              <Text style={[styles.runwayUnit, { color: Colors.text }]}>MONTHS</Text>
              <Text style={[styles.runwayTarget, { color: Colors.textMuted }]}>OF AVERAGE LIVING COST COVERED</Text>
            </View>
          </View>

          {/* Progress Bar towards 6-month safety buffer */}
          <View style={[styles.progressBarBg, { backgroundColor: Colors.background, borderColor: Colors.border }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${runwayProgress}%`, 
                  backgroundColor: themeColor,
                  borderRightWidth: runwayProgress > 0 ? 2 : 0,
                  borderColor: '#171717'
                }
              ]} 
            />
          </View>

          <View style={styles.runwayFooter}>
            <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: "700" }}>
              TARGET: 6.0 MONTH EMERGENCY NET
            </Text>
            <Text style={{ color: themeColor, fontSize: 11, fontWeight: "900" }}>
              {runwayProgress.toFixed(0)}% REACHED
            </Text>
          </View>
        </View>

        {/* Bento Breakdown: Earnings vs Spending Bento grid */}
        <View style={styles.bentoGrid}>
          {/* Income Bento Card */}
          <View style={[styles.gridBento, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.gridLabelText, { color: Colors.textMuted }]}>TOTAL INCOME</Text>
              <TrendingUp size={16} color="#22c55e" strokeWidth={3} />
            </View>
            <Text style={[styles.gridAmount, { color: Colors.text, marginTop: 8 }]}>
              {settings.currency}{formatWithCommas(stats.income)}
            </Text>
            <View style={[styles.miniTrendBar, { backgroundColor: "rgba(34, 197, 94, 0.15)", marginTop: 15 }]}>
              <View style={{ height: "100%", width: "100%", backgroundColor: "#22c55e", borderRadius: 4 }} />
            </View>
          </View>

          {/* Expense Bento Card */}
          <View style={[styles.gridBento, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.gridLabelText, { color: Colors.textMuted }]}>TOTAL SPENT</Text>
              <TrendingDown size={16} color="#ef4444" strokeWidth={3} />
            </View>
            <Text style={[styles.gridAmount, { color: Colors.text, marginTop: 8 }]}>
              {settings.currency}{formatWithCommas(stats.expense)}
            </Text>
            <View style={[styles.miniTrendBar, { backgroundColor: "rgba(239, 68, 68, 0.15)", marginTop: 15 }]}>
              <View 
                style={{ 
                  height: "100%", 
                  width: `${stats.income > 0 ? Math.min((stats.expense / stats.income) * 100, 100) : 100}%`, 
                  backgroundColor: "#ef4444", 
                  borderRadius: 4 
                }} 
              />
            </View>
          </View>
        </View>

        {/* Savings Efficiency Bento */}
        <View style={[styles.bentoCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
          <View style={styles.bentoHeader}>
            <View style={[styles.iconBox, { backgroundColor: "rgba(250, 204, 21, 0.15)" }]}>
              <Award size={20} color="#facc15" strokeWidth={2.5} />
            </View>
            <View>
              <Text style={[styles.bentoTitle, { color: Colors.text }]}>Savings Efficiency</Text>
              <Text style={[styles.bentoMeta, { color: Colors.textMuted }]}>
                PERCENTAGE OF EARNINGS SAVED
              </Text>
            </View>
          </View>

          <View style={styles.runwayBigRow}>
            <Text style={[styles.runwayVal, { color: Colors.text }]}>
              {Math.max(0, stats.savingsRate).toFixed(0)}%
            </Text>
            <View style={{ gap: 2 }}>
              <Text style={[styles.runwayUnit, { color: Colors.text }]}>SAVINGS RATE</Text>
              <Text style={[styles.runwayTarget, { color: Colors.textMuted }]}>RETAINED IN CURRENT HISTORY</Text>
            </View>
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: Colors.background, borderColor: Colors.border }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.max(0, Math.min(stats.savingsRate, 100))}%`, 
                  backgroundColor: "#facc15",
                  borderRightWidth: stats.savingsRate > 0 ? 2 : 0,
                  borderColor: '#171717'
                }
              ]} 
            />
          </View>

          <View style={styles.runwayFooter}>
            <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: "700" }}>
              TARGET SAVINGS: 30%+ FOR ELITE WEALTH
            </Text>
            <Text style={{ color: stats.savingsRate >= 30 ? "#22c55e" : "#facc15", fontSize: 11, fontWeight: "900" }}>
              {stats.savingsRate >= 30 ? "EXCELLENT" : "ADVISABLE"}
            </Text>
          </View>
        </View>

        {/* AI Portfolio Strategic Verdict */}
        <View style={[styles.verdictCard, { backgroundColor: "#171717" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Zap size={22} color="#facc15" strokeWidth={3} />
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 }}>
              PORTFOLIO HEALTH VERDICT
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 22, fontWeight: "600" }}>
            {stats.balance >= 0 
              ? `Congratulations! With a net reserve of ${settings.currency}${formatWithCommas(stats.balance)}, your financial runway of ${emergencyRunway} months puts you in the ${emergencyRunway >= 6 ? "Safe Buffer zone" : "Growing Buffer zone"}. Enforcing a solid 30% savings rate will continue accelerating your compounding speed.` 
              : "Warning: Spending exceeds revenue reserves. Consider checking your highest expense categories under visual analytics, lowering discretionary transactions, and establishing a baseline emergency cash cushion."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ef4444",
    borderWidth: 2.5,
    borderColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#171717",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 20,
  },
  heroCard: {
    width: "100%",
    borderRadius: 24,
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: "hidden",
  },
  heroAccentBar: {
    height: 4,
    width: "100%",
  },
  heroInner: {
    padding: 24,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: 18,
  },
  heroFooter: {},
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroStatLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroStatVal: {
    fontSize: 13,
    fontWeight: "900",
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e5e5e5",
  },
  bentoCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 2.5,
    padding: 20,
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  bentoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#171717",
  },
  bentoTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  bentoMeta: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 2,
  },
  runwayBigRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  runwayVal: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  runwayUnit: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  runwayTarget: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  progressBarBg: {
    width: "100%",
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  runwayFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  bentoGrid: {
    flexDirection: "row",
    gap: 15,
  },
  gridBento: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2.5,
    padding: 18,
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  gridLabelText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  gridAmount: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  miniTrendBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#171717",
    overflow: "hidden",
  },
  verdictCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 2.5,
    borderColor: "#171717",
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
});
