import { AddTransactionModal } from "@/components/AddTransactionModal";
import { BalanceCard } from "@/components/BalanceCard";
import { formatWithCommas } from "@/constants/theme";
import { useAI } from "@/hooks/useAI";
import { useDatabase } from "@/hooks/useDatabase";
import { initNotifications } from "@/utils/notifications";
import { checkForUpdates, openStoreLink, UpdateInfo } from "@/utils/updates";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Ghost,
  Plus,
  Smile,
  Sparkles,
  Star,
  Target,
  User,
  Zap
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";

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
  const { t, language } = useLanguage();
  const { insights } = useAI(transactions, categories, language);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(settings.isLocked);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    initNotifications();
    
    async function checkUpdates() {
      const update = await checkForUpdates();
      if (update && update.hasUpdate) {
        setUpdateInfo(update);
      }
    }
    checkUpdates();
  }, []);

  const currentMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
      globalMonth,
    );
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
    return (habits || []).reduce(
      (acc, h) =>
        acc + (h.logs || []).filter((l) => l.startsWith(prefix)).length,
      0,
    );
  }, [habits]);

  const averageTicks = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    return parseFloat((totalMonthlyLogs / habits.length).toFixed(1));
  }, [totalMonthlyLogs, habits]);

  const productivityLevel = useMemo(() => {
    if (averageTicks < 5)
      return { stage: t.seedling, icon: "🌱", msg: t.started };
    if (averageTicks < 12)
      return { stage: t.sprouter, icon: "🌿", msg: t.flowering };
    if (averageTicks < 20)
      return { stage: t.grower, icon: "🌳", msg: t.flourishing };
    if (averageTicks < 26)
      return { stage: t.master, icon: "🏆", msg: t.exceptional };
    return { stage: t.legend, icon: "👑", msg: t.elite };
  }, [averageTicks, t]);

  const handleTxPress = (tx: any) => {
    Alert.alert(t.options, t.manageTransaction, [
      {
        text: t.edit,
        onPress: () => {
          setEditingTx(tx);
          setIsModalVisible(true);
        },
      },
      {
        text: t.delete,
        style: "destructive",
        onPress: () => confirmDelete(tx.id),
      },
      { text: t.cancel, style: "cancel" },
    ]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t.deleteRecord, t.cannotUndo, [
      { text: t.keep },
      {
        text: t.delete,
        style: "destructive",
        onPress: () => {
          deleteTransaction(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const renderAvatar = () => {
    const GUEST_ICONS = [User, Ghost, Smile, Star, Zap];
    const GUEST_COLORS = [
      "#EB6001",
      "#22C55E",
      "#3B82F6",
      "#A855F7",
      "#F59E0B",
    ];

    const hash = (settings.userName || "Guest")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const IconComponent = GUEST_ICONS[hash % GUEST_ICONS.length];
    const bgColor = GUEST_COLORS[hash % GUEST_COLORS.length];

    if (settings.userImage && settings.userImage.trim() !== "") {
      return (
        <View style={[styles.avatar, { borderColor: Colors.border }]}>
          <Image
            source={{ uri: settings.userImage }}
            style={{ width: "100%", height: "100%", borderRadius: 20 }}
          />
        </View>
      );
    }

    return (
      <View
        style={[
          styles.avatar,
          { backgroundColor: bgColor + "25", borderColor: bgColor + "40" },
        ]}
      >
        <IconComponent size={22} color={bgColor} strokeWidth={2.5} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: Colors.text }]}>{t.appName}</Text>
          <View style={styles.scoreRow}>
            <Sparkles size={12} color={Colors.primary} />
            <Text style={[styles.brandElite, { color: Colors.primary }]}>
              {t.eliteProductivity}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => router.push("/settings")}
        >
          {renderAvatar()}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
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

          <View style={{ alignItems: "center" }}>
            <Text
              style={{ color: Colors.text, fontSize: 18, fontWeight: "800" }}
            >
              {currentMonthLabel}
            </Text>
            <Text
              style={{ color: Colors.primary, fontSize: 12, fontWeight: "600" }}
            >
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

        {/* Dynamic Net Portfolio Balance Card (Clickable to detailed analysis screen) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/portfolio");
          }}
        >
          <BalanceCard
            total={stats.balance}
            income={stats.income}
            expense={stats.expense}
          />
        </TouchableOpacity>

        {/* Productivity Hub Quick Access */}
        <TouchableOpacity
          style={[
            styles.prodBrief,
            {
              backgroundColor: Colors.card,
              borderColor: Colors.primary + "20",
            },
          ]}
          onPress={() => router.push("/todo?tab=habits")}
        >
          {/* Neubrutalist grid dots background overlay */}
          <View style={styles.gridOverlay} pointerEvents="none">
            {Array.from({ length: 25 }).map((_, i) => (
              <View key={i} style={styles.gridDot} />
            ))}
          </View>
          <View style={styles.prodLeft}>
            <View
              style={[
                styles.prodIconBox,
                { backgroundColor: Colors.primary + "15" },
              ]}
            >
              <Text style={{ fontSize: 24 }}>{productivityLevel.icon}</Text>
            </View>
            <View>
              <Text style={[styles.prodStatus, { color: Colors.text }]}>
                {productivityLevel.stage.toUpperCase()}
              </Text>
              <Text style={[styles.prodSub, { color: Colors.textMuted }]}>
                {t.evolutionStage} • {productivityLevel.msg}
              </Text>
            </View>
          </View>
          <View style={styles.prodRight}>
            <Text style={[styles.prodScore, { color: Colors.primary }]}>
              {averageTicks % 1 === 0 ? averageTicks.toFixed(0) : averageTicks.toFixed(1)}
            </Text>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: 8,
                fontWeight: "900",
              }}
            >
              {t.avgTicks}
            </Text>
          </View>
        </TouchableOpacity>

        {/* AI Financial Insights & Chat Container */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.aiContainer, { backgroundColor: Colors.card }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/chat");
          }}
        >
          {/* Neubrutalist grid dots background overlay */}
          <View style={styles.gridOverlay} pointerEvents="none">
            {Array.from({ length: 30 }).map((_, i) => (
              <View key={i} style={styles.gridDot} />
            ))}
          </View>
          <View style={[styles.aiGlow, { backgroundColor: Colors.primary }]} />
          <View style={styles.aiContent}>
            <View style={styles.aiHeader}>
              <View style={{ backgroundColor: '#171717', width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
              </View>
              <Text style={[styles.aiTitle, { color: Colors.text }]}>
                {t.aiAdvisor}
              </Text>
            </View>
            <Text style={[styles.aiBody, { color: Colors.text }]}>
              {insights}
            </Text>
            <View style={[styles.aiFooter, { borderTopColor: Colors.text + "15" }]}>
              <Text style={[styles.askText, { color: Colors.primary }]}>
                {t.askAdvice.toUpperCase()}
              </Text>
              <ChevronRight color={Colors.primary} size={16} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Visual Analytics Grid */}
        <View style={styles.gridRow}>
          <View
            style={[
              styles.gridItem,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            {/* Neubrutalist grid dots background overlay */}
            <View style={styles.gridOverlay} pointerEvents="none">
              {Array.from({ length: 15 }).map((_, i) => (
                <View key={i} style={styles.gridDot} />
              ))}
            </View>
            <View
              style={[styles.gridIcon, { backgroundColor: Colors.background }]}
            >
              <Text style={{ fontSize: 18 }}>📈</Text>
            </View>
            <Text style={[styles.gridLabel, { color: Colors.textMuted }]}>
              {t.savingsRate}
            </Text>
            <Text style={[styles.gridVal, { color: Colors.text }]}>
              {stats.income > 0
                ? ((stats.balance / stats.income) * 100).toFixed(0)
                : 0}
              %
            </Text>
          </View>
          <View
            style={[
              styles.gridItem,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            {/* Neubrutalist grid dots background overlay */}
            <View style={styles.gridOverlay} pointerEvents="none">
              {Array.from({ length: 15 }).map((_, i) => (
                <View key={i} style={styles.gridDot} />
              ))}
            </View>
            <View
              style={[styles.gridIcon, { backgroundColor: Colors.background }]}
            >
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </View>
            <Text style={[styles.gridLabel, { color: Colors.textMuted }]}>
              {t.reminders}
            </Text>
            <Text style={[styles.gridVal, { color: Colors.text }]}>
              {reminders.filter((r) => !r.lastPaidMonth).length} {t.bills}
            </Text>
          </View>
        </View>

        {/* Dynamic Chart */}
        {pieData.length > 0 && (
          <View
            style={[
              styles.chartGlass,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            {/* Neubrutalist grid dots background overlay */}
            <View style={styles.gridOverlay} pointerEvents="none">
              {Array.from({ length: 30 }).map((_, i) => (
                <View key={i} style={styles.gridDot} />
              ))}
            </View>
            <PieChart
              data={pieData}
              donut
              radius={70}
              innerRadius={55}
              innerCircleColor={Colors.card}
              centerLabelComponent={() => (
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: Colors.primary,
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {pieData.length}
                  </Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 8 }}>
                    CATS
                  </Text>
                </View>
              )}
            />
            <View style={styles.chartLegend}>
              {pieData.slice(0, 3).map((it, i) => (
                <View key={i} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: it.color }]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      { color: Colors.textMuted, flex: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {it.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Feed */}
        <View style={styles.feedHeader}>
          <Text style={[styles.sectionHeading, { color: Colors.text }]}>
            {t.recentTransactions}
          </Text>
          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text
              style={{ color: Colors.primary, fontSize: 12, fontWeight: "900" }}
            >
              {t.viewAll}
            </Text>
          </TouchableOpacity>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Zap size={40} color={Colors.border} />
            <Text style={{ color: Colors.textMuted, marginTop: 10 }}>
              {t.noRecords}
            </Text>
          </View>
        ) : (
          filteredTransactions.slice(0, 3).map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            return (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.txCard,
                  { backgroundColor: Colors.card, borderColor: Colors.border },
                ]}
                onPress={() => handleTxPress(tx)}
              >
                <View
                  style={[
                    styles.txIndicator,
                    {
                      backgroundColor:
                        tx.type === "income" ? Colors.primary : Colors.secondary,
                    },
                  ]}
                />
                <View style={styles.txMain}>
                  <Text style={[styles.txTitle, { color: Colors.text }]}>
                    {tx.note || t.untitled}
                  </Text>
                  <Text style={[styles.txMeta, { color: Colors.textMuted }]}>
                    {cat?.name} • {new Date(tx.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color: tx.type === "income" ? Colors.primary : "#EF4444",
                      },
                    ]}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {settings.currency}
                    {formatWithCommas(tx.amount)}
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
        <View style={[styles.fabInner, { backgroundColor: Colors.primary }]}>
          <Plus color="#FFF" size={28} strokeWidth={3} />
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

      {/* Neubrutalist In-App Update Modal */}
      {updateInfo && (
        <Modal
          visible={!!updateInfo}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            if (!updateInfo.isForceUpdate) {
              setUpdateInfo(null);
            }
          }}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}>
            <View style={{
              width: "100%",
              backgroundColor: Colors.card,
              borderWidth: 3,
              borderColor: "#171717",
              borderRadius: 24,
              padding: 24,
              shadowColor: "#171717",
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 5,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Grid dots texture overlay */}
              <View style={styles.gridOverlay} pointerEvents="none">
                {Array.from({ length: 25 }).map((_, i) => (
                  <View key={i} style={styles.gridDot} />
                ))}
              </View>

              {/* Title Section */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#facc15", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#171717" }}>
                  <Text style={{ fontSize: 18 }}>🚀</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: "900", color: Colors.text, letterSpacing: -0.5 }}>
                  NEW UPDATE AVAILABLE!
                </Text>
              </View>

              {/* Body Text */}
              <Text style={{ fontSize: 14, fontWeight: "600", lineHeight: 22, color: Colors.text, marginBottom: 20 }}>
                {"A fresh, highly optimized version of Tracksy (" + updateInfo.latestVersion + ") is ready. Upgrade now to get elite performance boosts, smoother animations, and gorgeous UI enhancements!"}
              </Text>

              {/* Buttons Row */}
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: Colors.primary,
                    borderWidth: 2.5,
                    borderColor: "#171717",
                    borderRadius: 16,
                    height: 52,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#171717",
                    shadowOffset: { width: 3, height: 3 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 3,
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    openStoreLink(updateInfo.storeUrl);
                  }}
                >
                  <Text style={{ color: "#000", fontWeight: "900", fontSize: 14, letterSpacing: 0.5 }}>
                    UPDATE NOW
                  </Text>
                </TouchableOpacity>

                {!updateInfo.isForceUpdate && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "transparent",
                      borderWidth: 2.5,
                      borderColor: "#171717",
                      borderRadius: 16,
                      height: 52,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setUpdateInfo(null);
                    }}
                  >
                    <Text style={{ color: Colors.text, fontWeight: "900", fontSize: 14, letterSpacing: 0.5 }}>
                      LATER
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  brandElite: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  profileContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  greetingName: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
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
  scrollContent: { padding: 20, paddingBottom: 180 },
  aiContainer: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
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
  gridItem: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    position: "relative",
    overflow: "hidden",
  },
  gridIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2.5,
    borderColor: '#171717',
  },
  gridLabel: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
  gridVal: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  chartGlass: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
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
  txIndicator: { width: 4, height: 30, borderRadius: 2, marginRight: 15 },
  txMain: { flex: 1 },
  txTitle: { fontSize: 16, fontWeight: "700" },
  txMeta: { fontSize: 11, marginTop: 4, fontWeight: "600" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 16, fontWeight: "900" },
  fab: {
    position: "absolute",
    bottom: 160,
    right: 24,
    zIndex: 100,
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 0,
  },
  aiFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  askText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  prodBrief: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    marginTop: 15,
    marginBottom: 5,
    position: "relative",
    overflow: "hidden",
  },
  prodLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  prodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: '#171717',
  },
  prodStatus: { fontSize: 15, fontWeight: "900", letterSpacing: -0.5 },
  prodSub: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  prodRight: { alignItems: "flex-end" },
  prodScore: { fontSize: 22, fontWeight: "900" },
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
