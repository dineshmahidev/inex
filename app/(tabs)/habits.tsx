import { useDatabase, Habit } from "@/hooks/useDatabase";
import {
  cancelReminderNotification,
  requestNotificationPermissions,
  scheduleHabitNotification,
} from "@/utils/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useIsFocused } from "@react-navigation/native";
import {
  Activity,
  Bell,
  Book,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Download,
  Dumbbell,
  Edit2,
  Heart,
  Plus,
  Share2,
  Smile,
  Star,
  Target,
  Trash2,
  Trophy,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { interstitialAdManager } from "@/utils/ads";

const HABIT_ICONS: any = {
  Zap, Activity, Heart, Smile, Trophy, Star, Coffee, Dumbbell, Book, Wallet,
};

const parseChallengeDays = (challenge?: string) => {
  if (!challenge) return null;
  const cleaned = String(challenge).trim();
  if (cleaned.toLowerCase() === "regular" || cleaned === "") return null;
  const match = cleaned.match(/\d+/);
  if (match) {
    const val = parseInt(match[0], 10);
    return isNaN(val) || val <= 0 ? null : val;
  }
  return null;
};

const getHabitStreak = (logs: string[]) => {
  if (!logs || logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let current = new Date();
  const fmt = (d: Date) =>
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  if (!sorted.includes(fmt(current))) current.setDate(current.getDate() - 1);
  for (const d of sorted) {
    if (d === fmt(current)) { streak++; current.setDate(current.getDate() - 1); }
    else break;
  }
  return streak;
};

// ─── SwipeToMark ──────────────────────────────────────────────────────────────
const SwipeToMark = ({ isDone, onToggle, color }: { isDone: boolean; onToggle: () => void; color: string }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const handleWidth = 42;
  const padding = 3;
  const maxDrag = containerWidth ? containerWidth - handleWidth - 2 * padding - 5 : 0;
  const panX = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const latestState = useRef({ isDone, maxDrag, containerWidth });
  React.useEffect(() => { latestState.current = { isDone, maxDrag, containerWidth }; }, [isDone, maxDrag, containerWidth]);
  React.useEffect(() => {
    if (containerWidth > 0 && !isDragging.current) {
      Animated.spring(panX, { toValue: isDone ? maxDrag : 0, useNativeDriver: false, tension: 80, friction: 8 }).start();
    }
  }, [isDone, containerWidth, maxDrag]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 10,
    onPanResponderGrant: () => { isDragging.current = true; panX.stopAnimation(); },
    onPanResponderMove: (_, g) => {
      const { maxDrag: m, containerWidth: w, isDone: d } = latestState.current;
      if (!w) return;
      panX.setValue(Math.max(0, Math.min(m, d ? m + g.dx : g.dx)));
    },
    onPanResponderRelease: (_, g) => {
      isDragging.current = false;
      const { maxDrag: m, containerWidth: w, isDone: d } = latestState.current;
      if (!w) return;
      const cur = d ? m + g.dx : g.dx;
      if (!d) {
        if (cur > m * 0.7) Animated.timing(panX, { toValue: m, duration: 150, useNativeDriver: false }).start(() => onToggle());
        else Animated.spring(panX, { toValue: 0, useNativeDriver: false, tension: 100, friction: 10 }).start();
      } else {
        if (cur < m * 0.3) Animated.timing(panX, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => onToggle());
        else Animated.spring(panX, { toValue: m, useNativeDriver: false, tension: 100, friction: 10 }).start();
      }
    },
  })).current;

  const progressPercent = panX.interpolate({ inputRange: [0, Math.max(1, maxDrag)], outputRange: ["0%", "100%"] });

  return (
    <View onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      style={{ height: 50, backgroundColor: "#fff", borderWidth: 2.5, borderColor: "#000", borderRadius: 25, justifyContent: "center", overflow: "hidden", width: "100%" }}>
      <Animated.View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: progressPercent, backgroundColor: color + "30" }} />
      <View style={{ position: "absolute", left: 0, right: 0, alignItems: "center" }} pointerEvents="none">
        <Text style={{ fontSize: 11, fontWeight: "900", color: isDone ? "#111827" : "#4B5563", letterSpacing: 1.5 }}>
          {isDone ? "🎉 DONE! (SWIPE LEFT TO UNDO)" : "👉 SWIPE TO MARK DONE"}
        </Text>
      </View>
      <Animated.View {...panResponder.panHandlers} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        style={{ width: handleWidth, height: handleWidth, borderRadius: handleWidth / 2, backgroundColor: isDone ? "#000" : color, borderWidth: 2, borderColor: "#000", position: "absolute", left: padding, transform: [{ translateX: panX }], justifyContent: "center", alignItems: "center" }}>
        {isDone ? <ChevronLeft size={20} color="#FFF" strokeWidth={3.5} /> : <ChevronRight size={20} color="#000" strokeWidth={3.5} />}
      </Animated.View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const shareCardRef = useRef<any>(null);

  const {
    Colors, settings, habits,
    addHabit, updateHabit, deleteHabit,
  } = useDatabase();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [habitSubTab, setHabitSubTab] = useState("All");
  const [habitCalendarDate, setHabitCalendarDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const [isHabitModalVisible, setIsHabitModalVisible] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [hName, setHName] = useState("");
  const [hColor, setHColor] = useState("#FF7A00");
  const [hIcon, setHIcon] = useState("🔥");
  const [hChallenge, setHChallenge] = useState("Regular");
  const [hTime, setHTime] = useState("");
  const [showHTime, setShowHTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sharingHabit, setSharingHabit] = useState<any>(null);
  const [shareUserName, setShareUserName] = useState("Challenger");

  // ─── FAB listener ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener("fabPress", () => {
      if (isFocused) handleOpenHabitModal();
    });
    return () => sub.remove();
  }, [isFocused]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenHabitModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabitId(habit.id);
      setHName(habit.name);
      setHColor(habit.color);
      setHIcon(habit.icon);
      setHChallenge(habit.challenge || "Regular");
      setHTime(habit.reminderTime || "");
    } else {
      setEditingHabitId(null);
      setHName("");
      setHColor("#FF7A00");
      setHIcon("🔥");
      setHChallenge("Regular");
      setHTime("");
    }
    setIsSubmitting(false);
    setIsHabitModalVisible(true);
  };

  const handleCreateHabit = async () => {
    if (isSubmitting || !hName) return;
    setIsSubmitting(true);
    try {
      if (editingHabitId) {
        await updateHabit(editingHabitId, { name: hName, color: hColor, icon: hIcon, reminderTime: hTime || undefined, challenge: hChallenge !== "Regular" ? hChallenge : undefined });
        await cancelReminderNotification(editingHabitId);
        if (hTime) {
          const ok = await requestNotificationPermissions();
          if (ok) await scheduleHabitNotification(editingHabitId, hName, hTime);
        }
      } else {
        const id = await addHabit({ name: hName, color: hColor, icon: hIcon, reminderTime: hTime || undefined, challenge: hChallenge !== "Regular" ? hChallenge : undefined });
        if (hTime) {
          const ok = await requestNotificationPermissions();
          if (ok) await scheduleHabitNotification(id, hName, hTime);
        }
        interstitialAdManager.showAd();
      }
      setHName(""); setHTime(""); setEditingHabitId(null); setIsHabitModalVisible(false);
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  const toggleHabitDay = async (habit: any, date: string) => {
    let logs = [...habit.logs];
    logs = logs.includes(date) ? logs.filter(d => d !== date) : [...logs, date];
    await updateHabit(habit.id, { logs });
  };

  const changeHabitMonth = (delta: number) => {
    const d = new Date(habitCalendarDate);
    d.setMonth(d.getMonth() + delta);
    setHabitCalendarDate(d);
  };

  const exportShareCard = async () => {
    if (!sharingHabit) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const uri = await captureRef(shareCardRef, { format: "png", quality: 1.0 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: `Share ${sharingHabit.name} Progress` });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (e) { Alert.alert("Export Failed", "Unable to capture and share progress card."); }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────
  const filteredHabits = useMemo(() => {
    let f = habits;
    if (searchQuery) f = f.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (habitSubTab !== "All") f = f.filter(h => h.name === habitSubTab);
    return f;
  }, [habits, searchQuery, habitSubTab]);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonthStr = String(today.getMonth() + 1).padStart(2, "0");
  const todayDateStr = `${todayYear}-${todayMonthStr}-${String(today.getDate()).padStart(2, "0")}`;

  const calYear = habitCalendarDate.getFullYear();
  const calMonth = habitCalendarDate.getMonth();
  const calMonthStr = String(calMonth + 1).padStart(2, "0");
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfCalMonth = new Date(calYear, calMonth, 1).getDay();

  const bgColors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FF7A00", "#34D399", "#F472B6", "#60A5FA"];
  const ICON_EMOJIS = ["🔥", "💪", "🧘", "📖", "💧", "🏃", "🥗", "😴", "🎯", "💡", "🦷", "🪥"];
  const CHALLENGE_OPTIONS = ["Regular", "7 Days", "21 Days", "30 Days", "66 Days", "90 Days", "100 Days"];
  const COLOR_OPTIONS = ["#FF7A00", "#EF4444", "#A855F7", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: Colors.text }]}>Habits</Text>
          <Text style={[styles.subtitle, { color: Colors.textMuted }]}>
            {habits.length} habit{habits.length !== 1 ? "s" : ""} · {habits.filter(h => h.logs.includes(todayDateStr)).length} done today
          </Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: Colors.primary + "20", borderColor: Colors.primary }]}>
          <Text style={[styles.streakText, { color: Colors.primary }]}>🔥 {Math.max(...habits.map(h => getHabitStreak(h.logs)), 0)}</Text>
          <Text style={[styles.streakLabel, { color: Colors.textMuted }]}>BEST STREAK</Text>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={[styles.searchBar, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
        <Target size={16} color={Colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: Colors.text }]}
          placeholder="Search habits..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ── Sub Tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {[{ id: "All", label: "All 📋" }, ...habits.map(h => ({ id: h.name, label: `${h.icon || "🔥"} ${h.name}` }))].map(tab => (
          <TouchableOpacity key={tab.id}
            style={[styles.pill, { backgroundColor: habitSubTab === tab.id ? Colors.primary : Colors.card, borderColor: habitSubTab === tab.id ? Colors.primary : Colors.border }]}
            onPress={() => { setHabitSubTab(tab.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
            <Text style={[styles.pillText, { color: habitSubTab === tab.id ? "#000" : Colors.textMuted }]}>{tab.label.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Content ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 180, gap: 16, paddingTop: 8 }}>
        {habitSubTab === "All" ? (
          habits.length === 0 ? (
            <View style={styles.empty}>
              <Activity size={72} color={Colors.primary} opacity={0.2} />
              <Text style={[styles.emptyTitle, { color: Colors.text }]}>No Habits Yet</Text>
              <Text style={[styles.emptySub, { color: Colors.textMuted }]}>Tap the + button to start building powerful daily routines.</Text>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: Colors.primary }]} onPress={() => handleOpenHabitModal()}>
                <Plus size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>ADD FIRST HABIT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            habits.map((habit, idx) => {
              const bg = bgColors[idx % bgColors.length];
              const daysInMonth = new Date(todayYear, today.getMonth() + 1, 0).getDate();
              const challengeDaysVal = parseChallengeDays(habit.challenge);
              const isChallenge = challengeDaysVal !== null;
              const challengeDays = isChallenge ? challengeDaysVal! : daysInMonth;
              const prefix = `${todayYear}-${todayMonthStr}-`;
              const completedDays = habit.logs.filter(l => l.startsWith(prefix)).length;
              const completedCount = isChallenge ? habit.logs.length : completedDays;
              const isDoneToday = habit.logs.includes(todayDateStr);

              return (
                <View key={habit.id} style={[styles.overviewCard, { backgroundColor: bg }]}>
                  <TouchableOpacity onPress={() => setHabitSubTab(habit.name)} activeOpacity={0.85}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <View style={styles.iconBox}>
                        <Text style={{ fontSize: 22 }}>{habit.icon || "🔥"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.overviewName}>{habit.name.toUpperCase()}</Text>
                        <Text style={styles.overviewCount}>{completedCount} / {challengeDays} DAYS</Text>
                      </View>
                      <View style={[styles.streakPill, { backgroundColor: "#00000020" }]}>
                        <Text style={styles.streakPillText}>🔥 {getHabitStreak(habit.logs)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <SwipeToMark isDone={isDoneToday}
                    onToggle={() => { toggleHabitDay(habit, todayDateStr); Haptics.notificationAsync(isDoneToday ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success); }}
                    color={bg} />

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    <TouchableOpacity onPress={() => handleOpenHabitModal(habit)} style={[styles.cardBtn, { backgroundColor: "#ffffff40" }]}>
                      <Edit2 size={14} color="#000" strokeWidth={2.5} />
                      <Text style={styles.cardBtnText}>EDIT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSharingHabit(habit); setShareUserName(settings.userName || "Challenger"); }} style={[styles.cardBtn, { backgroundColor: "#ffffff40" }]}>
                      <Share2 size={14} color="#000" strokeWidth={2.5} />
                      <Text style={styles.cardBtnText}>SHARE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert("Delete Habit", "Remove this habit?", [{ text: "Keep" }, { text: "Delete", style: "destructive", onPress: async () => { deleteHabit(habit.id); await cancelReminderNotification(habit.id); } }])}
                      style={[styles.cardBtn, { backgroundColor: "#ef444440", flex: 0.5 }]}>
                      <Trash2 size={14} color="#ef4444" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        ) : (
          filteredHabits.length === 0 ? (
            <View style={styles.empty}>
              <Activity size={72} color={Colors.primary} opacity={0.2} />
              <Text style={[styles.emptyTitle, { color: Colors.text }]}>No matching habits</Text>
            </View>
          ) : (
            filteredHabits.map(habit => {
              const Icon = HABIT_ICONS[habit.icon] || Zap;
              const challengeDaysVal = parseChallengeDays(habit.challenge);
              const isChallenge = challengeDaysVal !== null;
              const challengeDays = isChallenge ? challengeDaysVal! : 90;
              const scoreNum = isChallenge ? habit.logs.length : habit.logs.filter(l => l.startsWith(`${calYear}-${calMonthStr}-`)).length;
              const scoreDen = isChallenge ? challengeDays : daysInCalMonth;

              return (
                <View key={habit.id} style={[styles.detailCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                  {/* Header */}
                  <View style={styles.detailHeader}>
                    <View style={[styles.detailIconBox, { backgroundColor: habit.color + "20" }]}>
                      {Icon === Zap && habit.icon && !HABIT_ICONS[habit.icon]
                        ? <Text style={{ fontSize: 18 }}>{habit.icon}</Text>
                        : <Icon size={18} color={habit.color} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailName, { color: Colors.text }]}>{habit.name}</Text>
                      <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: "800" }}>
                        🔥 {getHabitStreak(habit.logs)} DAY STREAK
                        {habit.challenge ? `  ·  ${habit.challenge.toUpperCase()}` : ""}
                        {habit.reminderTime ? `  🔔 ${habit.reminderTime}` : ""}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <TouchableOpacity onPress={() => handleOpenHabitModal(habit)}><Edit2 size={16} color={Colors.textMuted} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => Alert.alert("Delete Habit", "Remove?", [{ text: "Keep" }, { text: "Delete", style: "destructive", onPress: async () => { deleteHabit(habit.id); await cancelReminderNotification(habit.id); } }])}>
                        <Trash2 size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Month Navigator */}
                  <View style={styles.monthNav}>
                    <TouchableOpacity onPress={() => changeHabitMonth(-1)}><ChevronLeft size={20} color={Colors.text} strokeWidth={3} /></TouchableOpacity>
                    <Text style={[styles.monthLabel, { color: Colors.text }]}>
                      {habitCalendarDate.toLocaleString("default", { month: "long" }).toUpperCase()} {calYear}
                    </Text>
                    <TouchableOpacity onPress={() => changeHabitMonth(1)}><ChevronRight size={20} color={Colors.text} strokeWidth={3} /></TouchableOpacity>
                  </View>

                  {/* Day labels */}
                  <View style={{ flexDirection: "row", marginBottom: 4 }}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <Text key={i} style={{ width: "14.285%", textAlign: "center", fontSize: 10, fontWeight: "900", color: Colors.textMuted }}>{d}</Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calGrid}>
                    {Array.from({ length: firstDayOfCalMonth }).map((_, i) => <View key={`e-${i}`} style={styles.calDay} />)}
                    {Array.from({ length: daysInCalMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${calYear}-${calMonthStr}-${String(day).padStart(2, "0")}`;
                      const isDone = habit.logs.includes(dateStr);
                      const isToday = day === today.getDate() && calYear === todayYear && calMonth === today.getMonth();
                      return (
                        <TouchableOpacity key={day} disabled={!isToday}
                          onPress={() => toggleHabitDay(habit, dateStr)}
                          style={[styles.calDay, isToday && !isDone && { backgroundColor: Colors.primary + "30" }, isDone && { backgroundColor: habit.color }]}>
                          <Text style={[styles.calDayText, { color: isDone ? "#fff" : isToday ? Colors.primary : Colors.textMuted }]}>
                            {day}{isDone ? " ✓" : ""}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: "800", marginBottom: 5 }}>
                        {isChallenge ? `${challengeDays}-DAY CHALLENGE` : "90-DAY MASTERY"}: <Text style={{ color: habit.color }}>{getHabitStreak(habit.logs)}</Text> / {challengeDays}
                      </Text>
                      <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" }}>
                        <View style={{ width: `${Math.min((getHabitStreak(habit.logs) / challengeDays) * 100, 100)}%`, height: "100%", backgroundColor: habit.color }} />
                      </View>
                    </View>
                    <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: "800", marginLeft: 15 }}>
                      SCORE: <Text style={{ color: habit.color }}>{scoreNum}</Text> / {scoreDen}
                    </Text>
                  </View>


                </View>
              );
            })
          )
        )}
      </ScrollView>

      {/* ── Add/Edit Habit Modal ── */}
      <Modal visible={isHabitModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.fullScreenContainer} edges={["top", "bottom"]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.fullScreenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: Colors.text }]}>{editingHabitId ? "Edit Habit" : "New Habit"}</Text>
                <TouchableOpacity onPress={() => setIsHabitModalVisible(false)} style={styles.closeBtn}>
                  <X size={16} color={Colors.textMuted} strokeWidth={3} />
                </TouchableOpacity>
              </View>

              {/* Name */}
              <Text style={[styles.fieldLabel, { color: Colors.textMuted }]}>HABIT NAME</Text>
              <TextInput
                style={[styles.nameInput, { backgroundColor: Colors.background, color: Colors.text, borderColor: Colors.border }]}
                placeholder="Habit name..."
                placeholderTextColor={Colors.textMuted}
                value={hName}
                onChangeText={setHName}
              />

              {/* Emoji Picker */}
              <Text style={[styles.fieldLabel, { color: Colors.textMuted }]}>ICON</Text>
              <View style={styles.emojiRow}>
                {ICON_EMOJIS.map(e => (
                  <TouchableOpacity key={e} onPress={() => setHIcon(e)}
                    style={[styles.emojiBtn, { borderColor: hIcon === e ? Colors.primary : Colors.border, backgroundColor: hIcon === e ? Colors.primary + "20" : Colors.background }]}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Picker */}
              <Text style={[styles.fieldLabel, { color: Colors.textMuted }]}>COLOR</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setHColor(c)}
                    style={[styles.colorDot, { backgroundColor: c, borderWidth: hColor === c ? 3 : 1.5, borderColor: hColor === c ? "#000" : "transparent" }]} />
                ))}
              </View>

              {/* Challenge */}
              <Text style={[styles.fieldLabel, { color: Colors.textMuted }]}>CHALLENGE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {CHALLENGE_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt} onPress={() => setHChallenge(opt)}
                    style={[styles.pill, { backgroundColor: hChallenge === opt ? Colors.primary : Colors.background, borderColor: hChallenge === opt ? Colors.primary : Colors.border }]}>
                    <Text style={[styles.pillText, { color: hChallenge === opt ? "#000" : Colors.textMuted }]}>{opt.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Reminder */}
              <Text style={[styles.fieldLabel, { color: Colors.textMuted, marginTop: 16 }]}>DAILY REMINDER</Text>
              <TouchableOpacity onPress={() => setShowHTime(true)}
                style={[styles.reminderBtn, { backgroundColor: Colors.background, borderColor: Colors.border }]}>
                <Bell size={16} color={Colors.primary} />
                <Text style={{ color: Colors.text, fontWeight: "700", fontSize: 14 }}>{hTime || "Set reminder time"}</Text>
              </TouchableOpacity>
              {showHTime && (
                <DateTimePicker value={hTime ? new Date(`2000-01-01T${hTime}`) : new Date()} mode="time" display={Platform.OS === "android" ? "clock" : "default"} is24Hour={false}
                  onChange={(e, d) => {
                    if (Platform.OS === "android") setShowHTime(false);
                    if (e.type === "set" && d) setHTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
                    if (Platform.OS === "ios") setShowHTime(false);
                  }} />
              )}
              {hTime ? (
                <TouchableOpacity onPress={() => setHTime("")} style={{ marginTop: 6, alignSelf: "flex-start" }}>
                  <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "700" }}>✕ Clear reminder</Text>
                </TouchableOpacity>
              ) : null}

              {/* Save */}
              <TouchableOpacity onPress={handleCreateHabit} disabled={isSubmitting || !hName}
                style={[styles.saveBtn, { backgroundColor: hName ? Colors.primary : Colors.border, marginTop: 24 }]}>
                <Text style={styles.saveBtnText}>{isSubmitting ? "SAVING..." : editingHabitId ? "UPDATE HABIT" : "CREATE HABIT"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Share Modal ── */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullScreenContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullScreenContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  streakBadge: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, alignItems: "center" },
  streakText: { fontSize: 20, fontWeight: "900" },
  streakLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5, marginTop: 2 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginVertical: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600" },
  tabScroll: { maxHeight: 46, marginBottom: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  pillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  empty: { marginTop: 60, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  emptySub: { fontSize: 13, fontWeight: "600", textAlign: "center", paddingHorizontal: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  overviewCard: { borderRadius: 20, padding: 18, borderWidth: 2.5, borderColor: "#000", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  iconBox: { width: 44, height: 44, backgroundColor: "#fff", borderWidth: 2, borderColor: "#000", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  overviewName: { color: "#000", fontWeight: "900", fontSize: 15, letterSpacing: 0.3 },
  overviewCount: { color: "#00000080", fontSize: 11, fontWeight: "800", marginTop: 2 },
  streakPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  streakPillText: { color: "#000", fontWeight: "900", fontSize: 13 },
  cardBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 36, borderRadius: 12, borderWidth: 2, borderColor: "#00000030" },
  cardBtnText: { color: "#000", fontWeight: "900", fontSize: 10, letterSpacing: 0.5 },
  detailCard: { borderRadius: 24, padding: 18, borderWidth: 1 },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  detailIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  detailName: { fontSize: 16, fontWeight: "800" },
  monthNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  monthLabel: { fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calDay: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  calDayText: { fontSize: 10, fontWeight: "700" },
  progressRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 16, borderWidth: 2.5, marginTop: 14, shadowColor: "#171717", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  shareBtnText: { color: "#000", fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 40 : 24, maxHeight: "92%" },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  nameInput: { fontSize: 15, fontWeight: "600", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  emojiBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  colorRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  reminderBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  saveBtn: { 
    height: 50, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 24,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
