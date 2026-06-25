import { formatInputWithCommas, formatWithCommas } from "@/constants/theme";
import { Reminder, useDatabase } from "@/hooks/useDatabase";
import {
  cancelReminderNotification,
  requestNotificationPermissions,
  scheduleMonthlyReminderNotification,
  scheduleReminderNotification,
} from "@/utils/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Eye, Trash2, Check, ChevronLeft, X, Edit2, Calendar, Clock } from "lucide-react-native";

const { width } = Dimensions.get("window");

const BILL_TYPES = [
  { id: "emi",  emoji: "💳", label: "EMI",  color: "#6366F1" },
  { id: "loan", emoji: "🏦", label: "Loan", color: "#F59E0B" },
  { id: "bill", emoji: "📄", label: "Bill", color: "#F472B6" },
];

const ALERT_OPTIONS = [
  { id: "none",          label: "No Alert" },
  { id: "on_day",        label: "On Due Day" },
  { id: "2_days_before", label: "2 Days Before" },
  { id: "both",          label: "Both" },
  { id: "custom",        label: "Custom Date" },
];

const TYPE_COLOR: Record<string, string> = {
  emi:  "#6366F1",
  loan: "#F59E0B",
  bill: "#F472B6",
};
const TYPE_EMOJI: Record<string, string> = {
  emi:  "💳",
  loan: "🏦",
  bill: "📄",
};

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const {
    reminders, addReminder, updateReminder, deleteReminder,
    markReminderPaid, settings, Colors,
  } = useDatabase();

  const TAB_BAR_HEIGHT = 70 + (insets.bottom > 0 ? insets.bottom : 0);
  const currency = settings?.currency || "₹";

  const [tick, setTick] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [detailTab, setDetailTab] = useState<"progress" | "history">("progress");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "emi" | "loan" | "bill">("all");

  // Form state
  const [name, setName]               = useState("");
  const [amount, setAmount]           = useState("");
  const [dueDay, setDueDay]           = useState("");
  const [type, setType]               = useState<"loan" | "emi" | "bill">("emi");
  const [totalMonths, setTotalMonths] = useState("");
  const [paidMonthsInput, setPaidMonthsInput] = useState("");
  const [alertType, setAlertType]     = useState<"on_day" | "2_days_before" | "both" | "none" | "custom">("on_day");
  const [date, setDate]               = useState(new Date(Date.now() + 5 * 60000));
  const [showDate, setShowDate]       = useState(false);
  const [showTime, setShowTime]       = useState(false);

  // Live countdown
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // FAB listener
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("fabPress", () => {
      if (isFocused) openModal();
    });
    return () => sub.remove();
  }, [isFocused]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const pendingReminders = useMemo(() =>
    reminders?.filter(r => r.lastPaidMonth !== currentMonth && !r.isCompleted) || [],
    [reminders, currentMonth]);

  const paidReminders = useMemo(() =>
    reminders?.filter(r => r.lastPaidMonth === currentMonth && !r.isCompleted) || [],
    [reminders, currentMonth]);

  const filteredPending = useMemo(() =>
    filterType === "all" ? pendingReminders : pendingReminders.filter(r => r.type === filterType),
    [pendingReminders, filterType]);

  const filteredPaid = useMemo(() =>
    filterType === "all" ? paidReminders : paidReminders.filter(r => r.type === filterType),
    [paidReminders, filterType]);

  const totalDue = useMemo(() =>
    pendingReminders.reduce((s, r) => s + r.amount, 0), [pendingReminders]);

  const totalPaid = useMemo(() =>
    paidReminders.reduce((s, r) => s + r.amount, 0), [paidReminders]);

  // Most urgent bill
  const mostUrgent = useMemo(() => {
    const active = reminders?.filter(r => !r.isCompleted) || [];
    if (!active.length) return null;
    return [...active].sort((a, b) => {
      const now = new Date();
      const dateA = new Date(now.getFullYear(), now.getMonth(), a.dueDay);
      const dateB = new Date(now.getFullYear(), now.getMonth(), b.dueDay);
      return dateA.getTime() - dateB.getTime();
    }).find(r => r.lastPaidMonth !== currentMonth) || null;
  }, [reminders, currentMonth, tick]);

  const getCountdown = (dueDay: number, isPaid: boolean) => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    
    if (isPaid) {
      // If already paid for this month, the next due date is in the next month
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    } else {
      // If unpaid and the due day has passed in the current month, it's overdue
      const targetThisMonth = new Date(year, month, dueDay, 23, 59, 59);
      if (now.getTime() > targetThisMonth.getTime()) {
        const overdueDiff = now.getTime() - targetThisMonth.getTime();
        const overdueDays = Math.floor(overdueDiff / 86400000);
        if (overdueDays === 0) return "Due today";
        return `Overdue by ${overdueDays}d`;
      }
    }

    const target = new Date(year, month, dueDay, 9, 0, 0);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Due today";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  // Sync selected reminder when database changes
  const activeSelectedReminder = useMemo(() => {
    if (!selectedReminder) return null;
    return reminders?.find(r => r.id === selectedReminder.id) || null;
  }, [reminders, selectedReminder]);

  const openModal = (rem?: Reminder) => {
    if (rem) {
      setEditingId(rem.id);
      setName(rem.name);
      setAmount(formatInputWithCommas(rem.amount.toString()));
      setDueDay(rem.dueDay.toString());
      setType(rem.type);
      setTotalMonths(rem.totalMonths ? rem.totalMonths.toString() : "");
      setPaidMonthsInput(rem.paidMonths ? rem.paidMonths.toString() : "0");
      setAlertType(rem.alertType || "on_day");
      setDate(rem.customDate ? new Date(rem.customDate) : new Date(Date.now() + 5 * 60000));
    } else {
      setEditingId(null);
      setName(""); setAmount(""); setDueDay(""); setTotalMonths(""); setPaidMonthsInput("0");
      setType("emi"); setAlertType("on_day");
      setDate(new Date(Date.now() + 5 * 60000));
    }
    setIsSubmitting(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (isSubmitting || !name || !amount || !dueDay) return;
    setIsSubmitting(true);
    try {
      const parsedAmount     = parseFloat(amount.replace(/,/g, ""));
      const parsedDueDay     = parseInt(dueDay);
      const parsedMonths     = totalMonths ? parseInt(totalMonths) : undefined;
      const parsedPaidMonths = paidMonthsInput ? parseInt(paidMonthsInput) : 0;

      if (editingId) {
        await updateReminder(editingId, {
          name, amount: parsedAmount, dueDay: parsedDueDay,
          type, totalMonths: parsedMonths, paidMonths: parsedPaidMonths, alertType, customDate: date.toISOString(),
        });
        const ok = await requestNotificationPermissions();
        if (ok) {
          if (alertType === "custom") await scheduleReminderNotification(editingId, name, parsedAmount, date);
          else if (alertType !== "none") await scheduleMonthlyReminderNotification(editingId, name, parsedAmount, parsedDueDay, alertType);
          else await cancelReminderNotification(editingId);
        }
      } else {
        const remId = Date.now().toString();
        await addReminder({
          name, amount: parsedAmount, dueDay: parsedDueDay,
          type, totalMonths: parsedMonths, alertType,
          paidMonths: parsedPaidMonths, customDate: date.toISOString(),
        });
        const ok = await requestNotificationPermissions();
        if (ok) {
          if (alertType === "custom") await scheduleReminderNotification(remId, name, parsedAmount, date);
          else if (alertType !== "none") await scheduleMonthlyReminderNotification(remId, name, parsedAmount, parsedDueDay, alertType);
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleCardPress = (rem: Reminder) => {
    setSelectedReminder(rem);
    setDetailTab("progress");
    setShowDetailsModal(true);
  };

  const handleMarkPaidInDetails = async (remId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markReminderPaid(remId);
  };

  const handleDeleteReminder = (remId: string) => {
    Alert.alert("Delete Reminder?", "Are you sure you want to remove this bill reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteReminder(remId);
          setShowDetailsModal(false);
          setSelectedReminder(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const paidPct = (reminders?.length || 0) > 0
    ? Math.round((paidReminders.length / (reminders?.filter(r => !r.isCompleted).length || 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bill Reminders</Text>
          <Text style={styles.headerSub}>
            {paidReminders.length}/{(paidReminders.length + pendingReminders.length)} paid this month
          </Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }]} onPress={() => openModal()}>
          <Bell size={20} color="#FFF" fill="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + 80 }]}>

        {/* ── HERO SUMMARY CARD ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardInner}>
            <View style={styles.heroLeft}>
              <Text style={[styles.heroTitle, { color: Colors.primary }]}>
                {mostUrgent ? `📅 ${getCountdown(mostUrgent.dueDay, false)}` : "🎉 All clear!"}
              </Text>
              {mostUrgent && (
                <Text style={styles.heroName} numberOfLines={1}>{mostUrgent.name}</Text>
              )}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatVal, { color: Colors.primary }]}>{currency}{formatWithCommas(totalDue)}</Text>
                  <Text style={styles.heroStatLabel}>Due</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatVal, { color: "#10B981" }]}>{currency}{formatWithCommas(totalPaid)}</Text>
                  <Text style={styles.heroStatLabel}>Paid</Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={styles.heroBarBg}>
                <View style={[styles.heroBarFill, { width: `${paidPct}%` }]} />
              </View>
              <Text style={styles.heroBarLabel}>{paidPct}% bills paid</Text>
            </View>
            <LottieView
              source={require("@/assets/cycle_rider.json")}
              autoPlay loop
              style={styles.heroLottie}
            />
          </View>
        </View>

        {/* ── FILTER CHIPS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {[{ id: "all", emoji: "📋", label: "All" }, ...BILL_TYPES].map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filterType === f.id && { backgroundColor: Colors.primary }]}
              onPress={() => setFilterType(f.id as any)}
            >
              <Text style={styles.filterEmoji}>{f.emoji}</Text>
              <Text style={[styles.filterText, filterType === f.id && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── PENDING BILLS ── */}
        {filteredPending.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>⏰ Upcoming · {filteredPending.length}</Text>
            {filteredPending.map(rem => (
              <BillCard
                key={rem.id}
                rem={rem}
                currency={currency}
                isPaid={false}
                countdown={getCountdown(rem.dueDay, false)}
                onPress={() => handleCardPress(rem)}
                onMarkPaid={() => markReminderPaid(rem.id)}
                onDelete={() => handleDeleteReminder(rem.id)}
              />
            ))}
          </>
        )}

        {/* ── PAID BILLS ── */}
        {filteredPaid.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>✅ Paid · {filteredPaid.length}</Text>
            {filteredPaid.map(rem => (
              <BillCard
                key={rem.id}
                rem={rem}
                currency={currency}
                isPaid={true}
                countdown={getCountdown(rem.dueDay, true)}
                onPress={() => handleCardPress(rem)}
                onMarkPaid={() => markReminderPaid(rem.id)}
                onDelete={() => handleDeleteReminder(rem.id)}
              />
            ))}
          </>
        )}

        {/* ── EMPTY ── */}
        {filteredPending.length === 0 && filteredPaid.length === 0 && (
          <View style={styles.empty}>
            <LottieView source={require("@/assets/smiley_emoji.json")} autoPlay loop style={styles.emptyLottie} />
            <Text style={styles.emptyTitle}>No bills yet!</Text>
            <Text style={styles.emptySubtitle}>Add your EMIs, loans and bills to track them</Text>
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }]} onPress={() => openModal()}>
              <Text style={styles.emptyBtnText}>+ Add Bill</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + 16, backgroundColor: Colors.primary, shadowColor: Colors.primary }]}
        onPress={() => openModal()}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* ── PREMIUM BILL DETAILS & TENOR FULL SCREEN MODAL ── */}
      <Modal visible={showDetailsModal} transparent={false} animationType="slide">
        {activeSelectedReminder ? (() => {
          const rem = activeSelectedReminder;
          const color = TYPE_COLOR[rem.type] || "#F472B6";
          const isPaid = rem.lastPaidMonth === currentMonth;
          const total = rem.totalMonths || 0;
          const settled = rem.paidMonths || 0;
          const remaining = Math.max(0, total - settled);
          const progressPct = total > 0 ? Math.min(Math.round((settled / total) * 100), 100) : 0;
          const totalAmount = rem.amount * total;
          const paidAmount = rem.amount * settled;
          const remainingAmount = rem.amount * remaining;

          return (
            <SafeAreaView style={styles.fullScreenReport} edges={["top", "bottom"]}>
              {/* Header */}
              <View style={styles.reportHeader}>
                <TouchableOpacity
                  onPress={() => { setShowDetailsModal(false); setSelectedReminder(null); }}
                  style={styles.reportBackBtn}
                >
                  <ChevronLeft size={22} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.reportHeaderTitle}>Bill Report</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowDetailsModal(false);
                    openModal(rem);
                  }}
                  style={styles.reportEditBtn}
                >
                  <Edit2 size={18} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Segmented Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, detailTab === "progress" && [styles.tabButtonActive, { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary }]]}
                  onPress={() => setDetailTab("progress")}
                >
                  <Calendar size={15} color={detailTab === "progress" ? Colors.primary : "#64748B"} />
                  <Text style={[styles.tabButtonText, detailTab === "progress" && { color: Colors.primary }]}>
                    Progress
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, detailTab === "history" && [styles.tabButtonActive, { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary }]]}
                  onPress={() => setDetailTab("history")}
                >
                  <Clock size={15} color={detailTab === "history" ? Colors.primary : "#64748B"} />
                  <Text style={[styles.tabButtonText, detailTab === "history" && { color: Colors.primary }]}>
                    History
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reportScrollContent}>
                {detailTab === "progress" ? (
                  // ── Tab 1: Progress Content ──
                  <View>
                    {/* Header summary inside view */}
                    <View style={styles.detailHeader}>
                      <View style={[styles.detailIconContainer, { backgroundColor: color + "15" }]}>
                        <Text style={styles.detailIcon}>{TYPE_EMOJI[rem.type] || "📄"}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.detailName}>{rem.name}</Text>
                        <View style={[styles.typeBadge, { alignSelf: "flex-start", backgroundColor: color + "18", marginTop: 4 }]}>
                          <Text style={[styles.typeBadgeTxt, { color }]}>{rem.type.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Primary Amount Card */}
                    <View style={styles.detailAmountCard}>
                      <Text style={styles.detailAmountLabel}>Monthly Installment</Text>
                      <Text style={[styles.detailAmountValue, { color }]}>
                        {currency}{formatWithCommas(rem.amount)}
                      </Text>
                      <View style={styles.detailCycleRow}>
                        <Text style={styles.detailCycleText}>📅 Due on the {rem.dueDay}th of every month</Text>
                        {isPaid ? (
                          <View style={styles.paidBadgeContainer}>
                            <Text style={styles.paidBadgeText}>✅ Settled This Month</Text>
                          </View>
                        ) : (
                          <View style={styles.pendingBadgeContainer}>
                            <Text style={styles.pendingBadgeText}>⏰ {getCountdown(rem.dueDay, false)}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Tenor & Dues Analytics */}
                    <Text style={styles.detailsSectionTitle}>📊 Tenor & Dues Summary</Text>
                    
                    {total > 0 ? (
                      <>
                        {/* Metric Cards Row */}
                        <View style={styles.metricsRow}>
                          <View style={styles.metricItemCard}>
                            <Text style={styles.metricItemVal}>{total}</Text>
                            <Text style={styles.metricItemLabel}>Total Dues</Text>
                          </View>
                          <View style={[styles.metricItemCard, { borderColor: "#10B98150" }]}>
                            <Text style={[styles.metricItemVal, { color: "#10B981" }]}>{settled}</Text>
                            <Text style={styles.metricItemLabel}>Settled</Text>
                          </View>
                          <View style={[styles.metricItemCard, { borderColor: "#F59E0B50" }]}>
                            <Text style={[styles.metricItemVal, { color: "#F59E0B" }]}>{remaining}</Text>
                            <Text style={styles.metricItemLabel}>Remaining</Text>
                          </View>
                        </View>

                        {/* Total Value Analytics */}
                        <View style={styles.valueAnalyticsCard}>
                          <View style={styles.valueRow}>
                            <Text style={styles.valueLabel}>Total Loan/EMI Value</Text>
                            <Text style={styles.valueVal}>{currency}{formatWithCommas(totalAmount)}</Text>
                          </View>
                          <View style={styles.valueDivider} />
                          <View style={styles.valueRow}>
                            <Text style={styles.valueLabel}>Total Paid So Far</Text>
                            <Text style={[styles.valueVal, { color: "#10B981" }]}>{currency}{formatWithCommas(paidAmount)}</Text>
                          </View>
                          <View style={styles.valueRow}>
                            <Text style={styles.valueLabel}>Outstanding Balance</Text>
                            <Text style={[styles.valueVal, { color: "#EF4444" }]}>{currency}{formatWithCommas(remainingAmount)}</Text>
                          </View>
                          {/* Progress Bar */}
                          <View style={styles.detailBarBg}>
                            <View style={[styles.detailBarFill, { width: `${progressPct}%`, backgroundColor: color }]} />
                          </View>
                          <Text style={styles.detailBarLabel}>{progressPct}% of your tenor completed</Text>
                        </View>

                        {/* Full Installments Tenor Grid/Timeline */}
                        <Text style={styles.detailsSectionTitle}>🗓 Tenor Installment Grid ({settled}/{total} months)</Text>
                        <View style={styles.tenorGrid}>
                          {Array.from({ length: total }).map((_, index) => {
                            const monthNum = index + 1;
                            const isMonthPaid = monthNum <= settled;
                            const isNextDue = monthNum === settled + 1;
                            
                            let badgeBg = "#F3F4F6";
                            let badgeBorder = "#E5E7EB";
                            let textCol = "#9CA3AF";
                            let statusSymbol = "";

                            if (isMonthPaid) {
                              badgeBg = "#ECFDF5";
                              badgeBorder = "#A7F3D0";
                              textCol = "#059669";
                              statusSymbol = "✓";
                            } else if (isNextDue) {
                              badgeBg = isPaid ? "#F3F4F6" : "#FFFBEB";
                              badgeBorder = isPaid ? "#E5E7EB" : "#FDE68A";
                              textCol = isPaid ? "#6B7280" : "#D97706";
                              statusSymbol = isPaid ? "" : "⏱";
                            }

                            return (
                              <View 
                                key={monthNum} 
                                style={[
                                  styles.tenorGridItem, 
                                  { backgroundColor: badgeBg, borderColor: badgeBorder },
                                  isNextDue && !isPaid && styles.tenorGridItemActive
                                ]}
                              >
                                <Text style={[styles.tenorGridText, { color: textCol }]}>
                                  M{monthNum}
                                </Text>
                                <Text style={[styles.tenorStatusText, { color: textCol }]}>
                                  {statusSymbol || (isMonthPaid ? "Paid" : "Due")}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </>
                    ) : (
                      <View style={styles.emptyTenorCard}>
                        <Text style={styles.emptyTenorTitle}>🔄 Ongoing Monthly Bill</Text>
                        <Text style={styles.emptyTenorDesc}>
                          This reminder is set up as an ongoing recurring bill without a fixed tenor (like subscriptions or utilities).
                        </Text>
                        <View style={styles.valueRow}>
                          <Text style={styles.valueLabel}>Times Settled:</Text>
                          <Text style={[styles.valueVal, { color: "#10B981" }]}>{settled} times</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  // ── Tab 2: History Content ──
                  <View>
                    {/* Header summary inside view */}
                    <View style={styles.detailHeader}>
                      <View style={[styles.detailIconContainer, { backgroundColor: color + "15" }]}>
                        <Text style={styles.detailIcon}>{TYPE_EMOJI[rem.type] || "📄"}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.detailName}>{rem.name}</Text>
                        <View style={[styles.typeBadge, { alignSelf: "flex-start", backgroundColor: color + "18", marginTop: 4 }]}>
                          <Text style={[styles.typeBadgeTxt, { color }]}>{rem.type.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Info summary */}
                    <View style={styles.valueAnalyticsCard}>
                      <Text style={styles.detailsSectionTitle}>🔔 Alert Configuration</Text>
                      <View style={styles.valueRow}>
                        <Text style={styles.valueLabel}>Reminder Type:</Text>
                        <View style={[styles.typeBadge, { backgroundColor: color + "18" }]}>
                          <Text style={[styles.typeBadgeTxt, { color }]}>{rem.type.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.valueDivider} />
                      <View style={styles.valueRow}>
                        <Text style={styles.valueLabel}>Alert Setting:</Text>
                        <Text style={styles.valueVal}>
                          {ALERT_OPTIONS.find(o => o.id === rem.alertType)?.label || "On Due Day"}
                        </Text>
                      </View>
                      {rem.alertType === "custom" && rem.customDate && (
                        <View style={[styles.valueRow, { marginTop: 4 }]}>
                          <Text style={styles.valueLabel}>Scheduled Time:</Text>
                          <Text style={styles.valueVal}>
                            {new Date(rem.customDate).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Payment History Log */}
                    <Text style={styles.detailsSectionTitle}>📜 Payment History Log</Text>
                    {rem.paymentHistory && rem.paymentHistory.length > 0 ? (
                      <View style={styles.historyCard}>
                        {rem.paymentHistory.map((h, i) => (
                          <View key={i} style={styles.historyItem}>
                            <View style={styles.historyLeft}>
                              <Text style={styles.historyDate}>
                                {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Text>
                              <Text style={styles.historyTime}>
                                {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                            <Text style={styles.historyAmount}>{currency}{formatWithCommas(h.amount)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.emptyTenorCard}>
                        <Text style={styles.emptyTenorTitle}>No payment history yet</Text>
                        <Text style={styles.emptyTenorDesc}>
                          Payments will appear here chronologically once they are marked as paid.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              {/* Bottom Actions */}
              <View style={styles.reportActionsContainer}>
                <TouchableOpacity
                  style={[styles.reportActionBtn, styles.reportDeleteBtn]}
                  onPress={() => handleDeleteReminder(rem.id)}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={styles.reportDeleteBtnTxt}>Delete</Text>
                </TouchableOpacity>

                {!isPaid && (
                  <TouchableOpacity
                    style={[styles.reportActionBtn, styles.reportPayBtn, { backgroundColor: color }]}
                    onPress={() => handleMarkPaidInDetails(rem.id)}
                  >
                    <Check size={16} color="#FFF" />
                    <Text style={styles.reportPayBtnTxt}>Mark Paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          );
        })() : null}
      </Modal>

      {/* ── ADD / EDIT MODAL ── */}
      <Modal visible={showModal} transparent={false} animationType="slide">
        <SafeAreaView style={styles.fullScreenContainer} edges={["top", "bottom"]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.fullScreenContent} showsVerticalScrollIndicator={false}>

              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>{editingId ? "✏️ Edit Bill" : "🔔 New Bill Reminder"}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.sheetClose}>
                  <Text style={styles.sheetCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Bill Name */}
              <Text style={styles.formLabel}>📝 Bill Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Home Loan, Netflix, HDFC EMI"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoFocus
              />

              {/* Amount */}
              <Text style={styles.formLabel}>💰 Amount</Text>
              <TextInput
                style={styles.formInput}
                placeholder={`${currency}0.00`}
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={t => setAmount(formatInputWithCommas(t))}
              />

              {/* Bill Type */}
              <Text style={styles.formLabel}>📂 Type</Text>
              <View style={styles.typeRow}>
                {BILL_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeChip, type === t.id && { backgroundColor: t.color + "18", borderColor: t.color, borderWidth: 1.5 }]}
                    onPress={() => setType(t.id as any)}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.typeText, type === t.id && { color: t.color }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Due Day */}
              <Text style={styles.formLabel}>📅 Due Day of Month (1–31)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 5"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={dueDay}
                onChangeText={setDueDay}
              />

              {/* Alerts */}
              <Text style={styles.formLabel}>⏰ Set Reminder Alert</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.alertChip, alertType === "on_day" && { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary }]}
                  onPress={() => setAlertType("on_day")}
                >
                  <Text style={[styles.alertText, alertType === "on_day" && { color: Colors.primary }]}>
                    On Due Day (9 AM)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.alertChip, alertType === "2_days_before" && { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary }]}
                  onPress={() => setAlertType("2_days_before")}
                >
                  <Text style={[styles.alertText, alertType === "2_days_before" && { color: Colors.primary }]}>
                    2 Days Before (9 AM)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.alertChip, alertType === "both" && { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary }]}
                  onPress={() => setAlertType("both")}
                >
                  <Text style={[styles.alertText, alertType === "both" && { color: Colors.primary }]}>
                    Both Alerts
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tenor / Installments Setup */}
              {(type === "emi" || type === "loan") && (
                <>
                  <View style={styles.divider} />
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#1E293B" }}>🗓️ Tenor / Installments</Text>
                    <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600", marginTop: 2 }}>For loans, insurance, EMIs with fixed end dates</Text>
                  </View>

                  <Text style={styles.formLabel}>🔢 Total Installments (Months)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 12, 24, 36"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={totalMonths}
                    onChangeText={setTotalMonths}
                  />

                  <Text style={styles.formLabel}>✅ Already Settled (Months)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 0, 3, 5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={paidMonthsInput}
                    onChangeText={setPaidMonthsInput}
                  />

                  <Text style={styles.formLabel}>📅 First Installment Due Date</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    <TouchableOpacity style={styles.datePill} onPress={() => setShowDate(true)}>
                      <Text style={styles.datePillTxt}>📅 {date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.datePill} onPress={() => setShowTime(true)}>
                      <Text style={styles.datePillTxt}>🕐 {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    </TouchableOpacity>
                  </View>

                  {showDate && (
                    <DateTimePicker value={date} mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(_, d) => { setShowDate(false); if (d) setDate(d); }} />
                  )}
                  {showTime && (
                    <DateTimePicker value={date} mode="time"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(_, d) => { setShowTime(false); if (d) setDate(d); }} />
                  )}
                </>
              )}

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }, (!name || !amount || !dueDay || isSubmitting) && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={!name || !amount || !dueDay || isSubmitting}
              >
                <Text style={styles.saveBtnTxt}>
                  {isSubmitting ? "Saving…" : editingId ? "Update Bill" : "Add Bill Reminder"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Bill Card ───────────────────────────────────────────────────────────────
function BillCard({ rem, currency, isPaid, countdown, onPress, onMarkPaid, onDelete }: {
  rem: Reminder; currency: string; isPaid: boolean;
  countdown: string; onPress: () => void; onMarkPaid: () => void;
  onDelete: () => void;
}) {
  const color = TYPE_COLOR[rem.type] || "#F472B6";
  const isOverdue = !isPaid && (countdown === "Due today" || countdown.includes("Overdue"));
  const progressPct = rem.totalMonths && rem.paidMonths
    ? Math.min(Math.round((rem.paidMonths / rem.totalMonths) * 100), 100) : 0;

  return (
    <TouchableOpacity style={[styles.card, isPaid && styles.cardPaid, isOverdue && styles.cardOverdue]} onPress={onPress} activeOpacity={0.8}>
      {/* Left color bar */}
      <View style={[styles.cardBar, { backgroundColor: isPaid ? "#10B981" : color }]} />

      {/* Main container wrapping top info and bottom actions */}
      <View style={styles.cardMain}>
        {/* Top Info Row */}
        <View style={styles.cardInfoRow}>
          {/* Emoji icon */}
          <View style={[styles.cardIcon, { backgroundColor: isPaid ? "#F0FDF4" : color + "15" }]}>
            <Text style={styles.cardIconText}>{TYPE_EMOJI[rem.type] || "📄"}</Text>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardName, isPaid && styles.cardNamePaid]} numberOfLines={1}>{rem.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: color + "18" }]}>
                <Text style={[styles.typeBadgeTxt, { color }]}>{rem.type.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.cardAmount, { color: isPaid ? "#10B981" : color }]}>
              {currency}{formatWithCommas(rem.amount)}
            </Text>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardDueDay}>📅 {rem.dueDay}th every month</Text>
              {countdown ? (
                <Text style={[
                  styles.cardCountdown,
                  isPaid ? { color: "#10B981" } : isOverdue ? { color: "#EF4444" } : { color: "#F59E0B" }
                ]}>
                  ⏰ {isPaid ? `Next: ${countdown}` : countdown}
                </Text>
              ) : null}
            </View>
            {/* EMI progress bar */}
            {rem.totalMonths && rem.totalMonths > 0 && (
              <View style={styles.emiRow}>
                <View style={styles.emiBarBg}>
                  <View style={[styles.emiBarFill, { width: `${progressPct}%`, backgroundColor: isPaid ? "#10B981" : color }]} />
                </View>
                <Text style={styles.emiText}>{rem.paidMonths || 0}/{rem.totalMonths} mo</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Actions Row */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.cardActionBtn, { borderColor: "#E2E8F0" }]}
            onPress={(e) => { e.stopPropagation(); onPress(); }}
          >
            <Eye size={13} color="#6366F1" />
            <Text style={[styles.cardActionBtnTxt, { color: "#4F46E5" }]}>Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardActionBtn, { borderColor: "#FEE2E2", backgroundColor: "#FEF2F2" }]}
            onPress={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={13} color="#EF4444" />
            <Text style={[styles.cardActionBtnTxt, { color: "#DC2626" }]}>Delete</Text>
          </TouchableOpacity>

          {!isPaid && (
            <TouchableOpacity
              style={[styles.cardActionBtn, { borderColor: color, backgroundColor: color }]}
              onPress={(e) => { e.stopPropagation(); onMarkPaid(); }}
            >
              <Check size={13} color="#FFF" />
              <Text style={[styles.cardActionBtnTxt, { color: "#FFF" }]}>Pay</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  fullScreenContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullScreenContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#171717", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { color: "#FFF", fontSize: 22, lineHeight: 26 },

  scroll: { paddingHorizontal: 20 },

  // Hero card
  heroCard: {
    backgroundColor: "#FFF", borderRadius: 24, padding: 18, marginBottom: 14,
    shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 4,
    overflow: "hidden",
  },
  heroCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroLeft: { flex: 1, paddingRight: 8 },
  heroTitle: { fontSize: 14, fontWeight: "800", color: "#F472B6", marginBottom: 4 },
  heroName: { fontSize: 20, fontWeight: "900", color: "#171717", marginBottom: 12, letterSpacing: -0.5 },
  heroStatsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  heroStat: { alignItems: "flex-start" },
  heroStatVal: { fontSize: 18, fontWeight: "900", color: "#F472B6" },
  heroStatLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  heroStatDivider: { width: 1, height: 30, backgroundColor: "#F3F4F6", marginHorizontal: 16 },
  heroBarBg: { height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  heroBarFill: { height: 8, backgroundColor: "#10B981", borderRadius: 4 },
  heroBarLabel: { fontSize: 12, color: "#9CA3AF" },
  heroLottie: { width: 90, height: 90 },

  // Filters
  filterScroll: { marginBottom: 14, marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#FFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  filterChipActive: {},
  filterEmoji: { fontSize: 15 },
  filterText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },

  // Section labels
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 8 },

  // Bill card
  card: {
    backgroundColor: "#FFF", borderRadius: 18, marginBottom: 10,
    flexDirection: "row", alignItems: "center", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardPaid: { opacity: 0.7 },
  cardOverdue: { borderWidth: 1.5, borderColor: "#FEE2E2" },
  cardBar: { width: 4, alignSelf: "stretch" },
  cardMain: { flex: 1, flexDirection: "column" },
  cardInfoRow: { flexDirection: "row", alignItems: "center" },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", margin: 12,
  },
  cardIconText: { fontSize: 22 },
  cardContent: { flex: 1, paddingVertical: 14, paddingRight: 8 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardName: { flex: 1, fontSize: 15, fontWeight: "800", color: "#171717" },
  cardNamePaid: { textDecorationLine: "line-through", color: "#9CA3AF" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeTxt: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  cardAmount: { fontSize: 18, fontWeight: "900", marginBottom: 6, letterSpacing: -0.5 },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardDueDay: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  cardCountdown: { fontSize: 11, color: "#F59E0B", fontWeight: "700" },
  cardPaidBadge: { fontSize: 11, color: "#10B981", fontWeight: "700" },
  emiRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  emiBarBg: { flex: 1, height: 5, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  emiBarFill: { height: 5, borderRadius: 3 },
  emiText: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  markBtn: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 12,
  },
  markBtnTxt: { fontSize: 12, fontWeight: "800" },

  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#FFF",
  },
  cardActionBtnTxt: {
    fontSize: 12,
    fontWeight: "800",
  },

  // Empty
  empty: { alignItems: "center", paddingTop: 20 },
  emptyLottie: { width: 180, height: 180 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#171717", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 24, paddingHorizontal: 30 },
  emptyBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "800", fontSize: 15 },

  // FAB
  fab: {
    position: "absolute", right: 24, width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  fabText: { fontSize: 28, color: "#FFF", lineHeight: 34 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: "92%", paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  sheetTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#171717" },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  sheetCloseTxt: { fontSize: 14, color: "#6B7280", fontWeight: "700" },

  formLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },
  formInput: {
    backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14,
    fontSize: 15, color: "#171717", fontWeight: "600", marginBottom: 16,
    borderWidth: 1, borderColor: "#E5E7EB",
  },

  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: 14, backgroundColor: "#F9FAFB", borderWidth: 1.5, borderColor: "#F3F4F6",
  },
  typeEmoji: { fontSize: 18 },
  typeText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },

  alertChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    backgroundColor: "#F9FAFB", borderWidth: 1.5, borderColor: "#F3F4F6",
  },
  alertChipActive: {},
  alertText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  alertTextActive: { color: "#6B7280" },

  dateRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  datePill: {
    flex: 1, backgroundColor: "#F9FAFB", borderRadius: 14, paddingVertical: 12,
    alignItems: "center", borderWidth: 1.5, borderColor: "#F3F4F6",
  },
  datePillTxt: { fontSize: 13, fontWeight: "700", color: "#374151" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },

  saveBtn: {
    borderRadius: 20, paddingVertical: 17, alignItems: "center",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    marginTop: 8,
  },
  saveBtnTxt: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  // Full Screen Report Styles
  fullScreenReport: { flex: 1, backgroundColor: "#F8FAFC" },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  reportBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  reportEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  reportHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  tabButtonActive: {},
  tabButtonText: { fontSize: 13, fontWeight: "800", color: "#64748B" },
  tabButtonTextActive: {},
  reportScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  reportActionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  reportActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  reportDeleteBtn: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  reportDeleteBtnTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#EF4444",
  },
  reportPayBtn: {
    borderColor: "transparent",
  },
  reportPayBtnTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
  },

  // Redesigned Detail Screen Specific Styles
  detailHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  detailIconContainer: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  detailIcon: { fontSize: 24 },
  detailName: { fontSize: 22, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  detailAmountCard: { backgroundColor: "#F8FAFC", borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  detailAmountLabel: { fontSize: 12, color: "#64748B", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  detailAmountValue: { fontSize: 32, fontWeight: "900", marginVertical: 6, letterSpacing: -1 },
  detailCycleRow: { marginTop: 4, gap: 6 },
  detailCycleText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  paidBadgeContainer: { backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: "flex-start", marginTop: 4 },
  paidBadgeText: { color: "#059669", fontSize: 11, fontWeight: "800" },
  pendingBadgeContainer: { backgroundColor: "#FFFBEB", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: "flex-start", marginTop: 4 },
  pendingBadgeText: { color: "#D97706", fontSize: 11, fontWeight: "800" },
  detailsSectionTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B", marginTop: 12, marginBottom: 10, letterSpacing: -0.2 },
  emptyTenorCard: { backgroundColor: "#F8FAFC", borderRadius: 20, padding: 16, marginBottom: 16, borderStyle: "dashed", borderWidth: 1.5, borderColor: "#CBD5E1" },
  emptyTenorTitle: { fontSize: 14, fontWeight: "800", color: "#475569", marginBottom: 4 },
  emptyTenorDesc: { fontSize: 12, color: "#64748B", lineHeight: 18, marginBottom: 12 },
  metricsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  metricItemCard: { flex: 1, backgroundColor: "#FFF", borderRadius: 16, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  metricItemVal: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  metricItemLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", marginTop: 2 },
  valueAnalyticsCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  valueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 },
  valueLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  valueVal: { fontSize: 14, color: "#1E293B", fontWeight: "800" },
  valueDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8 },
  detailBarBg: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden", marginTop: 14, marginBottom: 6 },
  detailBarFill: { height: 8, borderRadius: 4 },
  detailBarLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  tenorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  tenorGridItem: { width: (width - 48 - 30) / 5, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tenorGridItemActive: { borderWidth: 1.5, shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 1 },
  tenorGridText: { fontSize: 12, fontWeight: "800" },
  tenorStatusText: { fontSize: 8, fontWeight: "700", marginTop: 1 },
  historyCard: { backgroundColor: "#FFF", borderRadius: 18, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  historyItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  historyLeft: { gap: 2 },
  historyDate: { fontSize: 13, color: "#1E293B", fontWeight: "700" },
  historyTime: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  historyAmount: { fontSize: 14, color: "#10B981", fontWeight: "800" },
  detailActionsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  detailActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  editActionBtn: { backgroundColor: "#FFF", borderColor: "#CBD5E1" },
  editActionTxt: { fontSize: 14, fontWeight: "700", color: "#475569" },
  deleteActionBtn: { backgroundColor: "#FEF2F2", borderColor: "#FEE2E2" },
  deleteActionTxt: { fontSize: 14, fontWeight: "700", color: "#EF4444" },
  detailPayBtn: { paddingVertical: 16, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  detailPayBtnTxt: { color: "#FFF", fontSize: 15, fontWeight: "800" },
});

