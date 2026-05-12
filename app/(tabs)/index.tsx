import { AddTransactionModal } from "@/components/AddTransactionModal";
import { BalanceCard } from "@/components/BalanceCard";
import { SecurityLock } from "@/components/SecurityLock";
import { useAI } from "@/hooks/useAI";
import { useDatabase } from "@/hooks/useDatabase";
import { useRouter } from "expo-router";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Sparkles,
    Target,
    Trash2,
    Zap,
    TrendingUp,
    User,
    Ghost,
    Smile,
    Star
} from "lucide-react-native";
import React, { useMemo, useState, useEffect } from "react";
import { initNotifications } from "@/utils/notifications";
import * as Haptics from 'expo-haptics';
import {
    Alert,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image // Added Image
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter();
  const {
    transactions,
    categories,
    reminders,
    settings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    habits,
    Colors,
    globalMonth,
    setGlobalMonth,
  } = useDatabase();
  const { insights } = useAI(transactions, categories);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(settings.isLocked);

  useEffect(() => {
    initNotifications();
  }, []);

  const currentMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { month: "long" }).format(globalMonth);
  }, [globalMonth]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === globalMonth.getMonth() &&
        d.getFullYear() === globalMonth.getFullYear()
      );
    });
  }, [transactions, globalMonth]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { balance: income - expense, income, expense };
  }, [filteredTransactions]);

  const pieData = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        data[t.categoryId] = (data[t.categoryId] || 0) + t.amount;
      });
    return Object.keys(data).map((id) => {
      const cat = categories.find((c) => c.id === id);
      return {
        value: data[id],
        color: cat?.color || Colors.accent,
        text: cat?.name || "Other",
      };
    });
  }, [filteredTransactions, categories, Colors.accent]);

  const totalMonthlyLogs = useMemo(() => {
    const prefix = new Date().toISOString().slice(0, 8);
    return (habits || []).reduce((acc, h) => acc + (h.logs || []).filter(l => l.startsWith(prefix)).length, 0);
  }, [habits]);

  const productivityLevel = useMemo(() => {
    if (totalMonthlyLogs < 10) return { stage: 'Seedling', icon: '🌱', msg: 'Started' };
    if (totalMonthlyLogs < 30) return { stage: 'Sprouter', icon: '🌿', msg: 'Flowering' };
    if (totalMonthlyLogs < 60) return { stage: 'Grower', icon: '🌳', msg: 'Flourishing' };
    if (totalMonthlyLogs < 100) return { stage: 'Master', icon: '🏆', msg: 'Exceptional' };
    return { stage: 'Legend', icon: '👑', msg: 'Elite' };
  }, [totalMonthlyLogs]);

  const handleTxPress = (tx: any) => {
    Alert.alert(
      "Options",
      "Manage this transaction",
      [
        { text: "Edit", onPress: () => { setEditingTx(tx); setIsModalVisible(true); } },
        { text: "Delete", style: "destructive", onPress: () => confirmDelete(tx.id) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete Record?",
      "This action cannot be undone.",
      [
        { text: "Keep" },
        { text: "Delete", style: "destructive", onPress: () => {
            deleteTransaction(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }}
      ]
    );
  };

  const renderAvatar = () => {
    const GUEST_ICONS = [User, Ghost, Smile, Star, Zap];
    const GUEST_COLORS = ["#EB6001", "#22C55E", "#3B82F6", "#A855F7", "#F59E0B"];
    
    const hash = (settings.userName || "Guest").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const IconComponent = GUEST_ICONS[hash % GUEST_ICONS.length];
    const bgColor = GUEST_COLORS[hash % GUEST_COLORS.length];

    if (settings.userImage && settings.userImage.trim() !== "") {
      return (
        <View style={[styles.avatar, { borderColor: Colors.border }]}>
          <Image 
            source={{ uri: settings.userImage }} 
            style={{ width: '100%', height: '100%', borderRadius: 20 }} 
          />
        </View>
      );
    }

    return (
      <View style={[styles.avatar, { backgroundColor: bgColor + '25', borderColor: bgColor + '40' }]}>
        <IconComponent size={22} color={bgColor} strokeWidth={2.5} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <StatusBar
        barStyle={settings.theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Brand & Profile Header */}
      <View style={styles.brandHeader}>
          <View style={styles.brandLeft}>
              <View>
                  <Text style={[styles.brandName, { color: Colors.text }]}>Tracksy</Text>
                  <Text style={[styles.brandElite, { color: Colors.primary }]}>YOUR PRODUCTIVITY APP</Text>
              </View>
          </View>
          <TouchableOpacity style={styles.profileContainer} onPress={() => router.push('/settings')}>
             {renderAvatar()}
             <Text style={[styles.greetingName, { color: Colors.text }]} numberOfLines={1}>
                {settings.userName || "Guest"}
             </Text>
          </TouchableOpacity>
      </View>



      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BalanceCard
          total={stats.balance}
          income={stats.income}
          expense={stats.expense}
        />

      {/* Navigation Sub-Header */}
      <View style={[styles.navBar, { borderBottomColor: Colors.border, borderBottomWidth: 0, marginBottom: 15, paddingHorizontal: 0 }]}>
        <TouchableOpacity
          style={[
            styles.navBtn,
            { backgroundColor: Colors.card, borderColor: Colors.border },
          ]}
          onPress={() => {
            const newDate = new Date(globalMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            setGlobalMonth(newDate);
          }}
        >
          <ChevronLeft color={Colors.text} size={20} />
        </TouchableOpacity>
        <View style={styles.monthBox}>
          <Text style={[styles.monthText, { color: Colors.text }]}>
            {currentMonthLabel}
          </Text>
          <Text style={[styles.yearText, { color: Colors.primary }]}>
            {globalMonth.getFullYear()}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.navBtn,
            { backgroundColor: Colors.card, borderColor: Colors.border },
          ]}
          onPress={() => {
            const newDate = new Date(globalMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            setGlobalMonth(newDate);
          }}
        >
          <ChevronRight color={Colors.text} size={20} />
        </TouchableOpacity>
      </View>

        {/* Productivity Hub Quick Access */}
        <TouchableOpacity 
            style={[styles.prodBrief, { backgroundColor: Colors.card, borderColor: Colors.primary + '20' }]}
            onPress={() => router.push('/todo')}
        >
            <View style={styles.prodLeft}>
                <View style={[styles.prodIconBox, { backgroundColor: Colors.primary + '15' }]}>
                    <Text style={{ fontSize: 24 }}>{productivityLevel.icon}</Text>
                </View>
                <View>
                    <Text style={[styles.prodStatus, { color: Colors.text }]}>{productivityLevel.stage.toUpperCase()}</Text>
                    <Text style={[styles.prodSub, { color: Colors.textMuted }]}>EVOLUTION STAGE • {productivityLevel.msg}</Text>
                </View>
            </View>
            <View style={styles.prodRight}>
                <Text style={[styles.prodScore, { color: Colors.primary }]}>{totalMonthlyLogs}</Text>
                <Text style={{ color: Colors.textMuted, fontSize: 8, fontWeight: '900' }}>TICKS</Text>
            </View>
        </TouchableOpacity>

        {/* AI Financial Strategy Card */}
        <TouchableOpacity 
          style={[styles.aiContainer, { backgroundColor: Colors.card, borderColor: Colors.primary + '30' }]}
          onPress={() => router.push('/chat')}
        >
          <View style={[styles.aiGlow, { backgroundColor: Colors.primary }]} />
          <View style={styles.aiContent}>
            <View style={styles.aiHeader}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={[styles.aiTitle, { color: Colors.primary }]}>MY FINANCE STRATEGY</Text>
            </View>
            <Text style={[styles.aiBody, { color: Colors.text }]}>
              {insights[0] || "No strategy available yet. Record your first transaction to allow the AI to analyze your habits."}
            </Text>
            <View style={styles.aiFooter}>
                <Text style={[styles.askText, { color: Colors.primary }]}>ASK AI FOR ADVICE</Text>
                <TrendingUp size={14} color={Colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Visual Analytics Grid */}
        <View style={styles.gridRow}>
          <View style={[styles.gridItem, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
            <View style={[styles.gridIcon, { backgroundColor: Colors.background }]}><Zap size={18} color={Colors.accent} /></View>
            <Text style={[styles.gridLabel, { color: Colors.textMuted }]}>Savings Rate</Text>
            <Text style={[styles.gridVal, { color: Colors.text }]}>{stats.income > 0 ? ((stats.balance / stats.income) * 100).toFixed(0) : 0}%</Text>
          </View>
          <View style={[styles.gridItem, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
            <View style={[styles.gridIcon, { backgroundColor: Colors.background }]}><Target size={18} color={Colors.primary} /></View>
            <Text style={[styles.gridLabel, { color: Colors.textMuted }]}>Reminders</Text>
            <Text style={[styles.gridVal, { color: Colors.text }]}>{reminders.filter(r => !r.lastPaidMonth).length} Bills</Text>
          </View>
        </View>

        {/* Dynamic Chart */}
        {pieData.length > 0 && (
          <View style={[styles.chartGlass, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
            <PieChart
              data={pieData}
              donut
              radius={70}
              innerRadius={55}
              innerCircleColor={Colors.card}
              centerLabelComponent={() => (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: Colors.primary, fontWeight: "bold", fontSize: 16 }}>{pieData.length}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 8 }}>CATS</Text>
                </View>
              )}
            />
            <View style={styles.chartLegend}>
              {pieData.slice(0, 3).map((it, i) => (
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: it.color }]} />
                  <Text style={[styles.legendText, { color: Colors.textMuted }]} numberOfLines={1}>{it.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Feed */}
        <View style={styles.feedHeader}>
          <Text style={[styles.sectionHeading, { color: Colors.text }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '900' }}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Zap size={40} color={Colors.border} />
            <Text style={{ color: Colors.textMuted, marginTop: 10 }}>No records this month</Text>
          </View>
        ) : (
          filteredTransactions.slice(0, 3).map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            return (
              <TouchableOpacity 
                key={t.id} 
                style={[styles.txCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}
                onPress={() => handleTxPress(t)}
              >
                <View style={[styles.txIndicator, { backgroundColor: t.type === 'income' ? Colors.primary : Colors.secondary }]} />
                <View style={styles.txMain}>
                  <Text style={[styles.txTitle, { color: Colors.text }]}>{t.note || "Untitled"}</Text>
                  <Text style={[styles.txMeta, { color: Colors.textMuted }]}>{cat?.name} • {new Date(t.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: t.type === "income" ? Colors.primary : "#EF4444" }]}>
                    {t.type === "income" ? "+" : "-"}{settings.currency}{t.amount.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Premium Redesigned FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.fabOuter}>
            <View style={[styles.fabInner, { backgroundColor: Colors.primary }]}>
              <Plus color="#000" size={28} strokeWidth={3} />
            </View>
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
  brandHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10,
    marginBottom: 5
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandName: { 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: -1.5, 
    fontStyle: 'italic'
  },
  brandElite: { 
    fontSize: 9, 
    fontWeight: '800', 
    letterSpacing: 2.5, 
    marginTop: -2 
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 80,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden'
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingName: { 
    fontSize: 10, 
    fontWeight: '700',
    textAlign: 'center'
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 70,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  monthBox: { alignItems: "center" },
  monthText: { fontSize: 18, fontWeight: "800", textTransform: "uppercase" },
  yearText: { fontSize: 10, fontWeight: "bold" },
  scrollContent: { padding: 20, paddingBottom: 130 },
  aiContainer: {
    marginVertical: 10,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
  },
  aiGlow: { position: "absolute", top: 0, left: 0, width: 100, height: 4 },
  aiContent: { padding: 20 },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  aiTitle: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  aiBody: { fontSize: 14, lineHeight: 22, fontWeight: "500" },
  gridRow: { flexDirection: "row", gap: 15, marginVertical: 15 },
  gridItem: { flex: 1, borderRadius: 28, padding: 20, borderWidth: 1 },
  gridIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridLabel: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
  gridVal: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  chartGlass: {
    borderRadius: 32,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 20,
  },
  chartLegend: { flex: 1, marginLeft: 20, gap: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: "600" },
  feedHeader: { marginTop: 10, marginBottom: 15 },
  sectionHeading: { fontSize: 16, fontWeight: "800" },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
  },
  txIndicator: { width: 4, height: 30, borderRadius: 2, marginRight: 15 },
  txMain: { flex: 1 },
  txTitle: { fontSize: 16, fontWeight: "700" },
  txMeta: { fontSize: 11, marginTop: 4, fontWeight: "600" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 16, fontWeight: "900" },
  fab: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    zIndex: 100,
  },
  fabOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  aiFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  askText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  prodBrief: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 15,
    marginBottom: 5
  },
  prodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prodIconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  prodStatus: { fontSize: 15, fontWeight: '900', letterSpacing: -0.5 },
  prodSub: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5, marginTop: 2 },
  prodRight: { alignItems: 'flex-end' },
  prodScore: { fontSize: 22, fontWeight: '900' },
});
