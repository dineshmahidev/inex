import { useDatabase } from "@/hooks/useDatabase";
import {
  cancelReminderNotification,
  requestNotificationPermissions,
  scheduleTodoNotification,
} from "@/utils/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { interstitialAdManager } from "@/utils/ads";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Alert,
  Animated,
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
import { useIsFocused } from "@react-navigation/native";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "all",      emoji: "📋", label: "All" },
  { id: "work",     emoji: "💼", label: "Work",     color: "#6366F1" },
  { id: "personal", emoji: "👤", label: "Personal", color: "#F472B6" },
  { id: "shopping", emoji: "🛒", label: "Shopping", color: "#F59E0B" },
  { id: "health",   emoji: "💪", label: "Health",   color: "#10B981" },
];

const CAT_COLOR: Record<string, string> = {
  work:     "#6366F1",
  personal: "#F472B6",
  shopping: "#F59E0B",
  health:   "#10B981",
};

interface Todo {
  id: string;
  text: string;
  date: string;
  time?: string;
  category: string;
  starred: boolean;
  completed: boolean;
  reminderDate?: string;
}

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { todos, addTodo: addTodoDB, updateTodo, saveTodos, Colors } = useDatabase();

  const TAB_BAR_HEIGHT = 70 + (insets.bottom > 0 ? insets.bottom : 0);

  // ── UI state ──────────────────────────────────────────────────────────
  const [filterCat, setFilterCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [task, setTask]               = useState("");
  const [cat, setCat]                 = useState("personal");
  const [isStarred, setIsStarred]     = useState(false);
  const [dueDate, setDueDate]         = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 60); return d;
  });
  const [showDate, setShowDate]       = useState(false);
  const [showTime, setShowTime]       = useState(false);

  // FAB listener
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("fabPress", () => {
      if (isFocused) openAddModal();
    });
    return () => sub.remove();
  }, [isFocused]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingId(null);
    setTask("");
    setCat("personal");
    setIsStarred(false);
    setDueDate(new Date(Date.now() + 60 * 60000));
    setIsSubmitting(false);
    setShowModal(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingId(todo.id);
    setTask(todo.text);
    setCat(todo.category);
    setIsStarred(todo.starred);
    setDueDate(todo.reminderDate ? new Date(todo.reminderDate) : new Date());
    setIsSubmitting(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (isSubmitting || !task.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateTodo(editingId, {
          text: task,
          date: dueDate.toLocaleDateString(),
          time: dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          category: cat,
          starred: isStarred,
          reminderDate: dueDate.toISOString(),
        });
        const ok = await requestNotificationPermissions();
        if (ok) {
          await cancelReminderNotification(editingId);
          if (dueDate.getTime() > Date.now())
            await scheduleTodoNotification(editingId, task, dueDate);
        }
      } else {
        const id = await addTodoDB({
          text: task,
          date: dueDate.toLocaleDateString(),
          time: dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          category: cat,
          starred: isStarred,
          completed: false,
          reminderDate: dueDate.toISOString(),
        });
        const ok = await requestNotificationPermissions();
        if (ok && dueDate.getTime() > Date.now())
          await scheduleTodoNotification(id, task, dueDate);
        interstitialAdManager.showAd();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    await updateTodo(todo.id, { completed: !todo.completed });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const deleteTodo = (id: string) => {
    Alert.alert("Delete Task?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const updated = todos.filter((t: Todo) => t.id !== id);
          await saveTodos(updated);
          await cancelReminderNotification(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handlePress = (todo: Todo) => {
    Alert.alert("Task Options", todo.text, [
      { text: "✏️ Edit",   onPress: () => openEditModal(todo) },
      { text: "⭐ " + (todo.starred ? "Unstar" : "Star"),
        onPress: () => updateTodo(todo.id, { starred: !todo.starred }) },
      { text: "🗑 Delete", style: "destructive", onPress: () => deleteTodo(todo.id) },
      { text: "Cancel",   style: "cancel" },
    ]);
  };

  // ── Filtering ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...todos] as Todo[];
    if (filterCat === "starred") list = list.filter(t => t.starred);
    else if (filterCat !== "all") list = list.filter(t => t.category === filterCat);
    if (searchQuery) list = list.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [todos, filterCat, searchQuery]);

  const pending   = filtered.filter(t => !t.completed);
  const completed = filtered.filter(t => t.completed);
  const doneCount = todos.filter((t: Todo) => t.completed).length;
  const totalCount = todos.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const isOverdue = (todo: Todo) => {
    if (!todo.reminderDate || todo.completed) return false;
    return new Date(todo.reminderDate).getTime() < Date.now();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSub}>{doneCount}/{totalCount} done today 🎯</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }]} onPress={openAddModal}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* ── PROGRESS CARD ── */}
      <View style={[styles.progressCard, { shadowColor: Colors.primary }]}>
        <View style={styles.progressCardInner}>
          <View style={styles.progressLeft}>
            <Text style={styles.progressPct}>{pct}%</Text>
            <Text style={styles.progressLabel}>completed</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: Colors.primary }]} />
            </View>
            <Text style={styles.progressSub}>{pending.length} tasks remaining</Text>
          </View>
          <LottieView
            source={
              pct === 100
                ? require("@/assets/smiley_emoji.json")
                : require("@/assets/Smiley.json")
            }
            autoPlay
            loop
            style={styles.progressLottie}
          />
        </View>
      </View>

      {/* ── SEARCH ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={{ color: "#9CA3AF", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── CATEGORY CHIPS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
      >
        {[{ id: "all", emoji: "📋", label: "All" }, { id: "starred", emoji: "⭐", label: "Starred" }, ...CATEGORIES.slice(1)].map(c => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.catChip,
              filterCat === c.id && { backgroundColor: Colors.primary }
            ]}
            onPress={() => setFilterCat(c.id)}
          >
            <Text style={styles.catChipEmoji}>{c.emoji}</Text>
            <Text style={[styles.catChipText, filterCat === c.id && styles.catChipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── TODO LIST ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + 80 }]}
      >
        {pending.length === 0 && completed.length === 0 ? (
          <View style={styles.empty}>
            <LottieView
              source={require("@/assets/Smiley.json")}
              autoPlay loop
              style={styles.emptyLottie}
            />
            <Text style={styles.emptyTitle}>All clear! 🎉</Text>
            <Text style={styles.emptySubtitle}>No tasks here. Add one below.</Text>
          </View>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>To Do · {pending.length}</Text>
                {pending.map(todo => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onPress={() => handlePress(todo)}
                    onToggle={() => toggleComplete(todo)}
                    overdue={isOverdue(todo)}
                  />
                ))}
              </>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Done · {completed.length}</Text>
                {completed.map(todo => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onPress={() => handlePress(todo)}
                    onToggle={() => toggleComplete(todo)}
                    overdue={false}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + 16, backgroundColor: Colors.primary, shadowColor: Colors.primary }]}
        onPress={openAddModal}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* ── ADD / EDIT MODAL ── */}
      <Modal visible={showModal} transparent={false} animationType="slide">
        <SafeAreaView style={styles.fullScreenContainer} edges={["top", "bottom"]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.fullScreenContent} showsVerticalScrollIndicator={false}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>{editingId ? "✏️ Edit Task" : "✅ New Task"}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.sheetClose}>
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Task input */}
              <Text style={styles.formLabel}>📝 Task Title</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.taskInputFlat}
                  placeholder="What do you need to do?"
                  placeholderTextColor="#94A3B8"
                  value={task}
                  onChangeText={setTask}
                  multiline
                  autoFocus
                />
              </View>

              {/* Category */}
              <Text style={styles.formLabel}>📂 Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {CATEGORIES.slice(1).map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.formCatChip, cat === c.id && { backgroundColor: (c.color || "#F472B6") + "20", borderColor: c.color || "#F472B6", borderWidth: 1.5 }]}
                      onPress={() => setCat(c.id)}
                    >
                      <Text style={styles.formCatEmoji}>{c.emoji}</Text>
                      <Text style={[styles.formCatText, cat === c.id && { color: c.color || "#F472B6" }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Date / Time */}
              <Text style={styles.formLabel}>⏰ Due Date & Time</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.datePill} onPress={() => setShowDate(true)}>
                  <Text style={styles.datePillText}>📅 {dueDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePill} onPress={() => setShowTime(true)}>
                  <Text style={styles.datePillText}>🕐 {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                </TouchableOpacity>
              </View>

              {showDate && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(_, d) => { setShowDate(false); if (d) setDueDate(d); }}
                />
              )}
              {showTime && (
                <DateTimePicker
                  value={dueDate}
                  mode="time"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(_, d) => { setShowTime(false); if (d) setDueDate(d); }}
                />
              )}

              {/* Star */}
              <TouchableOpacity
                style={[
                  styles.starRow,
                  isStarred && { backgroundColor: "#FFFBEB", borderColor: "#FCD34D", borderWidth: 1.5 }
                ]}
                onPress={() => setIsStarred(!isStarred)}
              >
                <Text style={styles.starEmoji}>{isStarred ? "⭐" : "☆"}</Text>
                <Text style={[styles.starText, isStarred && { color: "#F59E0B" }]}>
                  {isStarred ? "Starred — important task" : "Mark as starred"}
                </Text>
              </TouchableOpacity>

              {/* Save */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: Colors.primary, shadowColor: Colors.primary },
                  (!task.trim() || isSubmitting) && { opacity: 0.5 }
                ]}
                onPress={handleSave}
                disabled={!task.trim() || isSubmitting}
              >
                <Text style={styles.saveBtnText}>
                  {isSubmitting ? "Saving…" : editingId ? "Update Task" : "Add Task"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Todo Card Component ─────────────────────────────────────────────────────
function TodoCard({ todo, onPress, onToggle, overdue }: {
  todo: Todo;
  onPress: () => void;
  onToggle: () => void;
  overdue: boolean;
}) {
  const color = CAT_COLOR[todo.category] || "#F472B6";
  const scale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, todo.completed && styles.cardDone, overdue && styles.cardOverdue]}
        onPress={onPress}
        onLongPress={handleToggle}
        activeOpacity={0.8}
      >
        {/* Left color bar */}
        <View style={[styles.cardBar, { backgroundColor: todo.completed ? "#D1D5DB" : color }]} />

        {/* Check button */}
        <TouchableOpacity style={[styles.checkBtn, todo.completed && { borderColor: "#D1D5DB" }]} onPress={handleToggle}>
          {todo.completed ? (
            <Text style={styles.checkMark}>✓</Text>
          ) : (
            <View style={[styles.checkEmpty, { borderColor: color }]} />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardText, todo.completed && styles.cardTextDone]} numberOfLines={2}>
              {todo.text}
            </Text>
            {todo.starred && <Text style={styles.starIcon}>⭐</Text>}
          </View>
          <View style={styles.cardMeta}>
            <View style={[styles.catTag, { backgroundColor: color + "18" }]}>
              <Text style={[styles.catTagText, { color }]}>
                {CATEGORIES.find(c => c.id === todo.category)?.emoji} {todo.category}
              </Text>
            </View>
            {todo.time && (
              <Text style={[styles.timeText, overdue && styles.timeTextOverdue]}>
                {overdue ? "⚠️ " : "🕐 "}{todo.time}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

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
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  addBtnText: { color: "#FFF", fontSize: 22, lineHeight: 26 },

  // Progress card
  progressCard: {
    marginHorizontal: 20, backgroundColor: "#FFF", borderRadius: 24,
    padding: 18, marginBottom: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 4,
  },
  progressCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressLeft: { flex: 1, paddingRight: 8 },
  progressPct: { fontSize: 36, fontWeight: "900", color: "#171717", letterSpacing: -1 },
  progressLabel: { fontSize: 13, color: "#9CA3AF", fontWeight: "600", marginBottom: 10 },
  progressBarBg: { height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressSub: { fontSize: 12, color: "#9CA3AF" },
  progressLottie: { width: 90, height: 90 },

  // Search
  searchRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFF",
    borderRadius: 16, paddingHorizontal: 14, height: 46, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: "#171717", fontWeight: "500" },

  // Category chips — height shrinks to fit content (no flex/fixed height)
  catScroll: { marginBottom: 12, flexShrink: 0 },
  catScrollContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#FFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  catChipActive: {},
  catChipEmoji: { fontSize: 15 },
  catChipText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  catChipTextActive: { color: "#FFF" },

  // List
  list: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 8, marginTop: 4 },

  // Empty
  empty: { alignItems: "center", paddingTop: 20 },
  emptyLottie: { width: 180, height: 180 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#171717", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF" },

  // Todo Card
  card: {
    backgroundColor: "#FFF", borderRadius: 18, marginBottom: 10,
    flexDirection: "row", alignItems: "center", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardDone: { opacity: 0.65 },
  cardOverdue: { borderWidth: 1.5, borderColor: "#FEE2E2" },
  cardBar: { width: 4, alignSelf: "stretch" },
  checkBtn: { padding: 14 },
  checkMark: { fontSize: 18, color: "#10B981", fontWeight: "900" },
  checkEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  cardContent: { flex: 1, paddingVertical: 14, paddingRight: 14 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  cardText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#171717", lineHeight: 20 },
  cardTextDone: { textDecorationLine: "line-through", color: "#9CA3AF" },
  starIcon: { fontSize: 14 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catTagText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  timeText: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  timeTextOverdue: { color: "#EF4444" },

  // FAB
  fab: {
    position: "absolute", right: 24, width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  fabText: { fontSize: 28, color: "#FFF", lineHeight: 34 },

  // Modal (Now Full Screen)
  fullScreenContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullScreenContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: "92%", paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  sheetTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#171717" },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  sheetCloseText: { fontSize: 14, color: "#6B7280", fontWeight: "700" },

  inputContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },
  taskInputFlat: {
    fontSize: 15,
    color: "#171717",
    fontWeight: "600",
    minHeight: 80,
    textAlignVertical: "top",
  },
  taskInput: {
    backgroundColor: "#F9FAFB", borderRadius: 16, padding: 16,
    fontSize: 16, color: "#171717", minHeight: 90, textAlignVertical: "top",
    fontWeight: "600", marginBottom: 20,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  formLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 10, marginTop: 8 },
  formCatChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
  },
  formCatEmoji: { fontSize: 18 },
  formCatText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },

  dateRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  datePill: {
    flex: 1, backgroundColor: "#F9FAFB", borderRadius: 14, paddingVertical: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB",
  },
  datePillText: { fontSize: 13, fontWeight: "700", color: "#374151" },

  starRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  starRowActive: { backgroundColor: "#FFFBEB", borderWidth: 1.5, borderColor: "#FCD34D" },
  starEmoji: { fontSize: 22 },
  starText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },

  saveBtn: {
    borderRadius: 20, paddingVertical: 17, alignItems: "center",
    justifyContent: "center", flexDirection: "row", gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    marginTop: 24,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
