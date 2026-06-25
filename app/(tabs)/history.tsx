import { AddTransactionModal } from "@/components/AddTransactionModal";
import { formatWithCommas } from "@/constants/theme";
import { useDatabase } from "@/hooks/useDatabase";
import { exportToPDF } from "@/utils/export";
import { endOfMonth, format, isWithinInterval, startOfMonth } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

const EMOJI_MAP: Record<string, string> = {
  "Food & Dining": "🍔",
  "Travel & Cabs": "🚕",
  "Home Bills": "🏠",
  "EMI & Loans": "💳",
  "Salary": "💼",
  "Other Income": "✨",
  "Shopping": "🛍️",
  "Health": "💊",
  "Entertainment": "🎬",
  "Education": "📚",
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const {
    transactions,
    categories,
    deleteTransaction,
    updateTransaction,
    addTransaction,
    settings,
    globalMonth,
    setGlobalMonth,
    Colors,
  } = useDatabase();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const isFocused = useIsFocused();
  const currency = settings?.currency || "₹";

  // Tab bar height (70 + bottom inset) — same as _layout.tsx
  const TAB_BAR_HEIGHT = 70 + (insets.bottom > 0 ? insets.bottom : 0);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("fabPress", () => {
      if (isFocused) setIsModalVisible(true);
    });
    return () => sub.remove();
  }, [isFocused]);

  const changeMonth = (offset: number) => {
    const next = new Date(globalMonth);
    next.setMonth(next.getMonth() + offset);
    setGlobalMonth(next);
  };

  const filteredTransactions = useMemo(() => {
    const monthStart = startOfMonth(globalMonth);
    const monthEnd = endOfMonth(globalMonth);
    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      const isSameMonth = isWithinInterval(txDate, { start: monthStart, end: monthEnd });
      const matchesSearch =
        (t.note || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        categories.find((c) => c.id === t.categoryId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      return isSameMonth && matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType, categories, globalMonth]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const balance = totals.income - totals.expense;

  const handleTxPress = (tx: any) => {
    Alert.alert("Transaction", "What would you like to do?", [
      { text: "✏️ Edit", onPress: () => { setEditingTx(tx); setIsModalVisible(true); } },
      {
        text: "🗑 Delete", style: "destructive", onPress: () => {
          Alert.alert("Delete?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteTransaction(tx.id) },
          ]);
        }
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const grouped = useMemo(() => {
    const map: Record<string, typeof filteredTransactions> = {};
    filteredTransactions.forEach((t) => {
      const key = format(new Date(t.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  const getCatEmoji = (catId: string, isIncome: boolean) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return isIncome ? "💰" : "💸";
    return EMOJI_MAP[cat.name] || (isIncome ? "💰" : "💸");
  };

  const getCatName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || "General";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER: Title + Month Picker inline ─────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Income & Expense</Text>
          <Text style={styles.headerSub}>Track every rupee 💸</Text>
        </View>
        {/* Month picker pills in header */}
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrowBtn}>
            <Text style={[styles.monthArrowTxt, { color: Colors.primary }]}>‹</Text>
          </TouchableOpacity>
          <View style={[styles.monthPill, { backgroundColor: `${Colors.primary}15` }]}>
            <Text style={[styles.monthPillText, { color: Colors.primary }]}>{format(globalMonth, "MMM ''yy")}</Text>
          </View>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrowBtn}>
            <Text style={[styles.monthArrowTxt, { color: Colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BALANCE HERO CARD ────────────────────────────────────── */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceCardInner}>
          {/* Left: numbers */}
          <View style={styles.balanceLeft}>
            {/* Label + Positive/Negative badge */}
            <View style={styles.balanceLabelRow}>
              <Text style={styles.balanceLabelTxt}>Total Balance</Text>
              <View style={[styles.balanceBadge, { backgroundColor: balance >= 0 ? "#DCFCE7" : `${Colors.primary}20` }]}>
                <Text style={[styles.balanceBadgeText, { color: balance >= 0 ? "#10B981" : Colors.primary }]}>
                  {balance >= 0 ? "▲ PROFIT" : "▼ LOSS"}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <Text style={[styles.balanceAmount, { color: balance >= 0 ? "#10B981" : Colors.primary }]}>
              {balance >= 0 ? "+" : ""}{currency}{formatWithCommas(Math.abs(balance))}
            </Text>

            {/* Savings rate */}
            {totals.income > 0 && (
              <View style={styles.savingsRow}>
                <View style={[styles.savingsBar, { backgroundColor: balance >= 0 ? "#DCFCE7" : "#FFF0F6" }]}>
                  <View
                    style={[
                      styles.savingsFill,
                      {
                        width: `${Math.min(Math.abs(balance) / totals.income * 100, 100)}%`,
                        backgroundColor: balance >= 0 ? "#10B981" : Colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.savingsPct, { color: balance >= 0 ? "#10B981" : Colors.primary }]}>
                  {Math.round(Math.abs(balance) / totals.income * 100)}%
                  {balance >= 0 ? " saved" : " over"}
                </Text>
              </View>
            )}

            {/* Income / Expense split row */}
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={[styles.balanceDot, { backgroundColor: "#10B981" }]} />
                <View>
                  <Text style={styles.balanceItemLabel}>Income</Text>
                  <Text style={[styles.balanceItemValue, { color: "#10B981" }]}>
                    +{currency}{formatWithCommas(totals.income)}
                  </Text>
                </View>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <View style={[styles.balanceDot, { backgroundColor: Colors.primary }]} />
                <View>
                  <Text style={styles.balanceItemLabel}>Expense</Text>
                  <Text style={[styles.balanceItemValue, { color: Colors.primary }]}>
                    -{currency}{formatWithCommas(totals.expense)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right: Lottie — smiley when positive, sad when negative */}
          <LottieView
            source={
              balance >= 0
                ? require("@/assets/smiley_emoji.json")
                : require("@/assets/sad_emoticon.json")
            }
            autoPlay
            loop
            style={styles.balanceLottie}
          />
        </View>
      </View>

      {/* ── SEARCH BAR (top of list area) ────────────────────────── */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={{ fontSize: 16, color: "#9CA3AF" }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── FILTER TABS + PDF ICON in same row ───────────────────── */}
      <View style={styles.filterRow}>
        {(["all", "income", "expense"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterType === f && { backgroundColor: Colors.primary }]}
            onPress={() => setFilterType(f)}
          >
            <Text style={[styles.filterText, filterType === f && styles.filterTextActive]}>
              {f === "all" ? "All" : f === "income" ? "📈 Income" : "📉 Expense"}
            </Text>
          </TouchableOpacity>
        ))}
        {/* PDF Export button in same row */}
        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={() => exportToPDF(filteredTransactions, categories, currency)}
        >
          <Text style={styles.pdfIcon}>📄</Text>
        </TouchableOpacity>
      </View>

      {/* ── TRANSACTIONS LIST ─────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: TAB_BAR_HEIGHT + 80 }]}
      >
        {grouped.length === 0 ? (
          /* ── LOTTIE EMPTY STATE ── */
          <View style={styles.empty}>
            <LottieView
              source={
                filterType === "income"
                  ? require("@/assets/smiley_emoji.json")
                  : filterType === "expense"
                  ? require("@/assets/sad_emoticon.json")
                  : require("@/assets/Smiley.json")
              }
              autoPlay
              loop
              style={styles.lottie}
            />
            <Text style={styles.emptyTitle}>
              {filterType === "income"
                ? "No income yet!"
                : filterType === "expense"
                ? "No expenses yet!"
                : "No transactions yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filterType === "income"
                ? "Add your earnings to track income"
                : filterType === "expense"
                ? "Add expenses to keep track"
                : "Tap + below to record your first transaction"}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }]}
              onPress={() => { setEditingTx(null); setIsModalVisible(true); }}
            >
              <Text style={styles.emptyBtnText}>+ Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          grouped.map(([date, txs]) => {
            const dayNet = txs.reduce(
              (s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0
            );
            return (
              <View key={date}>
                {/* Date group header */}
                <View style={styles.dateHeader}>
                  <Text style={styles.dateLabel}>{format(new Date(date), "EEEE, MMM d")}</Text>
                  <Text style={[styles.dateDayTotal, { color: dayNet >= 0 ? "#10B981" : Colors.primary }]}>
                    {dayNet >= 0 ? "+" : ""}{currency}{formatWithCommas(Math.abs(dayNet))}
                  </Text>
                </View>
                {txs.map((t) => {
                  const isIncome = t.type === "income";
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.txCard}
                      onPress={() => handleTxPress(t)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.txIcon, { backgroundColor: isIncome ? "#DCFCE7" : "#FFF0F6" }]}>
                        <Text style={styles.txIconText}>{getCatEmoji(t.categoryId, isIncome)}</Text>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txNote} numberOfLines={1}>{t.note || "Untitled"}</Text>
                        <Text style={styles.txCat}>{getCatName(t.categoryId)}</Text>
                      </View>
                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, { color: isIncome ? "#10B981" : Colors.primary }]}>
                          {isIncome ? "+" : "-"}{currency}{formatWithCommas(t.amount)}
                        </Text>
                        <Text style={styles.txTime}>{format(new Date(t.date), "hh:mm a")}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── FAB — above tab bar ───────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + 16, backgroundColor: Colors.primary, shadowColor: Colors.primary }]}
        onPress={() => { setEditingTx(null); setIsModalVisible(true); }}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <AddTransactionModal
        visible={isModalVisible}
        onClose={() => { setIsModalVisible(false); setEditingTx(null); }}
        onAdd={addTransaction}
        initialData={editingTx}
        onUpdate={updateTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerLeft: {},
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#171717", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2, fontWeight: "500" },

  /* Month picker in header */
  monthPicker: { flexDirection: "row", alignItems: "center", gap: 6 },
  monthArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  monthArrowTxt: { fontSize: 20, color: "#9CA3AF", fontWeight: "700", lineHeight: 24 },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
  },
  monthPillText: { fontSize: 13, fontWeight: "800", color: "#171717" },

  /* Balance card */
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    overflow: "hidden",
  },
  balanceCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceLeft: { flex: 1, paddingRight: 8 },
  balanceLottie: { width: 100, height: 100 },

  /* Label row + badge */
  balanceLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  balanceLabelTxt: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  balanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  balanceBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  balanceAmount: { fontSize: 30, fontWeight: "900", letterSpacing: -1, marginBottom: 10 },

  /* Savings progress bar */
  savingsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  savingsBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  savingsFill: { height: 6, borderRadius: 3 },
  savingsPct: { fontSize: 11, fontWeight: "700", minWidth: 60 },

  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  balanceDot: { width: 8, height: 8, borderRadius: 4 },
  balanceItemLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 1 },
  balanceItemValue: { fontSize: 13, fontWeight: "800" },
  balanceDivider: { width: 1, height: 30, backgroundColor: "#F3F4F6", marginHorizontal: 8 },

  /* Search bar */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: "#171717", fontWeight: "500" },

  /* Filter row + PDF */
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipActive: {},
  filterText: { fontSize: 12, fontWeight: "700", color: "#9CA3AF" },
  filterTextActive: { color: "#FFF" },
  pdfBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pdfIcon: { fontSize: 20 },

  /* List */
  listContent: { paddingHorizontal: 20 },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  dateLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  dateDayTotal: { fontSize: 13, fontWeight: "800" },
  txCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txIconText: { fontSize: 22 },
  txInfo: { flex: 1 },
  txNote: { fontSize: 14, fontWeight: "700", color: "#171717", marginBottom: 3 },
  txCat: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "800" },
  txTime: { fontSize: 10, color: "#D1D5DB", marginTop: 2 },

  /* Lottie empty state */
  empty: { alignItems: "center", paddingTop: 20 },
  lottie: { width: 200, height: 200 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#171717", marginBottom: 6, marginTop: 8 },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "800", fontSize: 15 },

  /* FAB */
  fab: {
    position: "absolute",
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  fabText: { fontSize: 28, color: "#FFF", lineHeight: 34 },
});
