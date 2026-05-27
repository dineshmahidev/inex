import { AddTransactionModal } from "@/components/AddTransactionModal";
import { useDatabase } from "@/hooks/useDatabase";
import { exportToPDF } from "@/utils/export"; // Added PDF utility
import { endOfMonth, format, isWithinInterval, startOfMonth } from "date-fns";
import {
    ArrowDownCircle,
    ArrowUpCircle, // Added FileText for PDF
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    Plus,
    Search,
    Trash2,
    X
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function HistoryScreen() {
  const {
    transactions,
    categories,
    deleteTransaction,
    updateTransaction,
    addTransaction,
    settings,
    Colors,
    globalMonth,
    setGlobalMonth,
  } = useDatabase();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelectionMode = selectedIds.length > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const deleteSelected = () => {
    Alert.alert(
      "Delete Selected?",
      `Remove ${selectedIds.length} transactions?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            selectedIds.forEach((id) => deleteTransaction(id));
            setSelectedIds([]);
          },
        },
      ],
    );
  };

  // Month-wise filtering + Search + Type
  const filteredTransactions = useMemo(() => {
    const monthStart = startOfMonth(globalMonth);
    const monthEnd = endOfMonth(globalMonth);

    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      const isSameMonth = isWithinInterval(txDate, {
        start: monthStart,
        end: monthEnd,
      });

      const matchesSearch =
        (t.note || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        categories
          .find((c) => c.id === t.categoryId)
          ?.name.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;

      return isSameMonth && matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType, categories, globalMonth]);

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      Alert.alert(
        "Empty Report",
        "No transactions found for the selected month to export.",
      );
      return;
    }
    await exportToPDF(filteredTransactions, categories, settings.currency);
  };

  const changeMonth = (offset: number) => {
    const next = new Date(globalMonth);
    next.setMonth(next.getMonth() + offset);
    setGlobalMonth(next);
  };

  const handleTxPress = (tx: any) => {
    Alert.alert("Options", "Manage this transaction", [
      {
        text: "Edit",
        onPress: () => {
          setEditingTx(tx);
          setIsModalVisible(true);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDelete(tx.id),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Record?", "This action cannot be undone.", [
      { text: "Keep" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTransaction(id);
        },
      },
    ]);
  };

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [filteredTransactions]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: Colors.text }]}>Reports</Text>
          <Text
            style={{
              color: Colors.primary,
              fontSize: 10,
              fontWeight: "bold",
              marginTop: 2,
            }}
          >
            {format(globalMonth, "MMMM yyyy").toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isSelectionMode && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: Colors.card, borderColor: "#f43f5e" },
              ]}
              onPress={deleteSelected}
            >
              <Trash2 color="#f43f5e" size={20} />
            </TouchableOpacity>
          )}
          {isSelectionMode && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: Colors.card, borderColor: Colors.border },
              ]}
              onPress={() => setSelectedIds([])}
            >
              <X color={Colors.text} size={20} />
            </TouchableOpacity>
          )}
          {!isSelectionMode && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: Colors.card, borderColor: Colors.border },
              ]}
              onPress={handleExport}
            >
              <FileText color={Colors.primary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Redesigned Horizontal Totals */}
      <View style={styles.totalsRow}>
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: Colors.card,
              borderColor: Colors.border,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: Colors.border,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#ffffff', letterSpacing: 1 }}>
                INCOME
              </Text>
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.primary + '15',
                borderWidth: 1.5,
                borderColor: Colors.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ArrowDownCircle size={18} color={Colors.primary} />
            </View>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 }}>
            TOTAL EARNINGS
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.text }}>
            {settings.currency}
            {totals.income.toLocaleString()}
          </Text>
        </View>

        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: Colors.card,
              borderColor: Colors.border,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                backgroundColor: Colors.secondary,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: Colors.border,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#ffffff', letterSpacing: 1 }}>
                EXPENSE
              </Text>
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.secondary + '15',
                borderWidth: 1.5,
                borderColor: Colors.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ArrowUpCircle size={18} color={Colors.secondary} />
            </View>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 }}>
            TOTAL SPENDING
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.text }}>
            {settings.currency}
            {totals.expense.toLocaleString()}
          </Text>
        </View>
      </View>
      {/* Month Selector & Filters */}
      <View style={styles.controls}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={styles.arrowBox}
          >
            <ChevronLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthDisplay, { color: Colors.text }]}>
            {format(globalMonth, "MMM yyyy")}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={styles.arrowBox}
          >
            <ChevronRight size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: Colors.card, borderColor: Colors.border },
          ]}
        >
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: Colors.text }]}
            placeholder="Search..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {(["all", "income", "expense"] as const).map((type) => {
            const isActive = filterType === type;
            const activeBg = type === "all" ? "#facc15" : type === "income" ? Colors.primary : Colors.secondary;
            const activeText = "#000000";
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setFilterType(type)}
                style={[
                  styles.typeChip,
                  isActive && { backgroundColor: activeBg },
                  { borderColor: Colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: isActive ? activeText : Colors.textMuted },
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: Colors.textMuted, fontWeight: "bold" }}>
              No records for this month
            </Text>
          </View>
        ) : (
          filteredTransactions.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            const isIncome = t.type === "income";
            const isSelected = selectedIds.includes(t.id);

            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: Colors.card,
                    borderColor: isSelected ? Colors.primary : Colors.border,
                  },
                ]}
                onPress={() =>
                  isSelectionMode ? toggleSelection(t.id) : handleTxPress(t)
                }
                onLongPress={() => toggleSelection(t.id)}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: (cat?.color || Colors.primary) + "15" },
                  ]}
                >
                  {isSelected ? (
                    <CheckCircle2 color={Colors.primary} size={22} />
                  ) : isIncome ? (
                    <ArrowDownCircle color={Colors.primary} size={22} />
                  ) : (
                    <ArrowUpCircle color={Colors.secondary} size={22} />
                  )}
                </View>

                <View style={styles.cardMain}>
                  <Text style={[styles.cardTitle, { color: Colors.text }]}>
                    {t.note || "Untitled"}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                      {cat?.name}
                    </Text>
                    <View style={styles.dot} />
                    <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                      {format(new Date(t.date), "MMM dd")}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text
                    style={[
                      styles.amount,
                      { color: isIncome ? Colors.primary : Colors.secondary },
                    ]}
                  >
                    {isIncome ? "+" : "-"}
                    {settings.currency}
                    {t.amount.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 130 }} />
      </ScrollView>

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={[styles.fabGradient, { backgroundColor: Colors.primary }]}>
          <Plus color="#000" size={32} strokeWidth={3.5} />
        </View>
      </TouchableOpacity>

      <AddTransactionModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingTx(null);
        }}
        onAdd={addTransaction}
        initialData={editingTx}
        onUpdate={updateTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 10,
    marginTop: 20,
  },
  totalsRow: {
    flexDirection: "row",
    gap: 15,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  totalCard: { 
    flex: 1, 
    padding: 15, 
    borderRadius: 16, 
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  totalIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  totalLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  totalValue: { fontSize: 18, fontWeight: "900" },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  headerRight: { flexDirection: "row", gap: 10 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  controls: { paddingHorizontal: 20, gap: 12, marginBottom: 10 },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 5,
  },
  arrowBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#171717',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  monthDisplay: {
    fontSize: 18,
    fontWeight: "800",
    width: 120,
    textAlign: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "600" },
  filterRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  typeText: { fontSize: 11, fontWeight: "BOLD", letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 50 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardMain: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#555" },
  cardRight: { alignItems: "flex-end" },
  amount: { fontSize: 16, fontWeight: "900" },
  empty: { padding: 80, alignItems: "center" },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 24,
    zIndex: 100,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
});
