import { useDatabase } from "@/hooks/useDatabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import LottieView from "lottie-react-native";
import {
    Activity,
    Briefcase,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    Circle,
    Clock,
    FileText,
    LayoutGrid,
    Palette,
    Plus,
    Search,
    ShoppingCart,
    Sparkles,
    Star,
    StickyNote,
    Book,
    Coffee,
    Dumbbell,
    Heart,
    Smile,
    Trash2,
    Trophy,
    User,
    Wallet,
    X,
    Zap,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestNotificationPermissions, scheduleTodoNotification } from "@/utils/notifications";

const TODO_KEY = "@productivity_todos_v5";
const NOTE_COLORS = ["#FEFF9C", "#7AFEC6", "#FF7EB9", "#7AFBFF", "#FFF3B0"];

interface Todo {
  id: string;
  text: string;
  date: string;
  time: string;
  category: "work" | "personal" | "shopping" | "finance";
  starred: boolean;
  completed: boolean;
}

const CATEGORIES = [
  { id: "work", label: "Work", icon: Briefcase, color: "#FF7A00" },
  { id: "personal", label: "Personal", icon: User, color: "#FFFFFF" },
  { id: "shopping", label: "Shopping", icon: ShoppingCart, color: "#888888" },
  { id: "finance", label: "Finance", icon: Wallet, color: "#FF4500" },
];

const HABIT_ICONS: any = {
  Zap,
  Activity,
  Heart,
  Smile,
  Trophy,
  Star,
  Coffee,
  Dumbbell,
  Book,
  Wallet
};

export default function TodoScreen() {
  const {
    Colors,
    settings,
    notes,
    addNote,
    updateNote,
    deleteNote,
    todos,
    addTodo: addTodoToDb,
    saveTodos,
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
  } = useDatabase();
  const [mainTab, setMainTab] = useState<"todos" | "notes" | "habits">("todos");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "starred" | "work" | "personal"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Todo Form State
  const [task, setTask] = useState("");
  const [todoDate, setTodoDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [cat, setCat] = useState<"work" | "personal" | "shopping" | "finance">(
    "personal",
  );
  const [isStarred, setIsStarred] = useState(false);

  // Note Form State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);

  // Habit Form State
  const [isHabitModalVisible, setIsHabitModalVisible] = useState(false);
  const [hName, setHName] = useState("");
  const [hColor, setHColor] = useState("#FF7A00");
  const [hIcon, setHIcon] = useState("Zap");

  const addTodo = async () => {
    if (!task) return;
    const item: Omit<Todo, "id"> = {
      text: task,
      date: todoDate.toLocaleDateString(),
      time: todoDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      category: cat,
      starred: isStarred,
      completed: false,
    };
    const todoId = await addTodoToDb(item);
    
    // Schedule Notification
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
        await scheduleTodoNotification(todoId, task, todoDate);
    }

    setTask("");
    setTodoDate(new Date());
    setIsStarred(false);
    setIsModalVisible(false);
  };

  const handleOpenNote = (note?: any) => {
    if (note) {
      setEditingNoteId(note.id);
      setNoteTitle(note.title);
      setNoteText(note.text);
      setNoteColor(note.color || NOTE_COLORS[0]);
    } else {
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteText("");
      setNoteColor(NOTE_COLORS[0]);
    }
    setIsNoteModalVisible(true);
  };

  const handleAddNote = async () => {
    if (!noteTitle || !noteText) return;

    if (editingNoteId) {
      await updateNote(editingNoteId, {
        title: noteTitle,
        text: noteText,
        color: noteColor,
      });
    } else {
      await addNote({
        title: noteTitle,
        text: noteText,
        color: noteColor,
        date: new Date().toLocaleDateString(),
      });
    }

    setNoteTitle("");
    setNoteText("");
    setEditingNoteId(null);
    setIsNoteModalVisible(false);
  };

  const toggleHabitDay = async (habit: any, date: string) => {
    let updatedLogs = [...habit.logs];
    if (updatedLogs.includes(date)) {
      updatedLogs = updatedLogs.filter((d) => d !== date);
    } else {
      updatedLogs.push(date);
    }
    await updateHabit(habit.id, { logs: updatedLogs });
  };

  const handleCreateHabit = async () => {
    if (!hName) return;
    await addHabit({ name: hName, color: hColor, icon: hIcon });
    setHName("");
    setIsHabitModalVisible(false);
  };

  const filteredTodos = useMemo(() => {
    let filtered = todos;
    if (selectedTab === "starred") filtered = filtered.filter((t) => t.starred);
    else if (selectedTab !== "all")
      filtered = filtered.filter((t) => t.category === selectedTab);

    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return filtered;
  }, [todos, selectedTab, searchQuery]);

  const totalMonthlyLogs = useMemo(() => {
    const prefix = new Date().toISOString().slice(0, 8);
    return habits.reduce(
      (acc, h) => acc + h.logs.filter((l) => l.startsWith(prefix)).length,
      0,
    );
  }, [habits]);

  const getProductivityLevel = (score: number) => {
    if (score < 10)
      return {
        stage: "Seedling",
        icon: "🌱",
        msg: "Just starting the journey.",
        segments: [0, 60] as [number, number]
      };
    if (score < 30)
      return {
        stage: "Sprouter",
        icon: "🌿",
        msg: "Consistency is building up!",
        segments: [60, 100] as [number, number]
      };
    if (score < 60)
      return {
        stage: "Grower",
        icon: "🌳",
        msg: "You are blooming beautifully.",
        segments: [100, 140] as [number, number]
      };
    if (score < 100)
      return { 
        stage: "Master", 
        icon: "🏆", 
        msg: "A productivity powerhouse!",
        segments: [140, 180] as [number, number]
      };
    return { 
        stage: "Legend", 
        icon: "👑", 
        msg: "Unstoppable discipline.",
        segments: [0, 210] as [number, number]
    };
  };

  const level = getProductivityLevel(totalMonthlyLogs);

  const productivityScore = useMemo(() => {
    if (todos.length === 0) return 0;
    return Math.round(
      (todos.filter((t) => t.completed).length / todos.length) * 100,
    );
  }, [todos]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: Colors.text }]}>
            {mainTab === "todos" ? "Focus" : "Notes"}
          </Text>
          <View style={styles.scoreRow}>
            {mainTab === "todos" ? (
              <>
                <Trophy size={12} color={Colors.primary} />
                <Text
                  style={{
                    color: Colors.primary,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  {productivityScore}% PROD. SCORE
                </Text>
              </>
            ) : (
              <>
                <StickyNote size={12} color={Colors.primary} />
                <Text
                  style={{
                    color: Colors.primary,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  {notes?.length || 0} SAVED NOTES
                </Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.litAddBtn,
            { backgroundColor: Colors.primary, shadowColor: Colors.primary },
          ]}
          onPress={() => {
            if (mainTab === "todos") setIsModalVisible(true);
            else if (mainTab === "notes") handleOpenNote();
            else setIsHabitModalVisible(true);
          }}
        >
          <Plus color="#000" size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          onPress={() => setMainTab("todos")}
          style={[
            styles.mainTabBtn,
            mainTab === "todos" && {
              backgroundColor: Colors.card,
              borderColor: Colors.primary,
            },
          ]}
        >
          <CheckCircle2
            size={18}
            color={mainTab === "todos" ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.mainTabText,
              { color: mainTab === "todos" ? Colors.text : Colors.textMuted },
            ]}
          >
            TODOS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMainTab("habits")}
          style={[
            styles.mainTabBtn,
            mainTab === "habits" && {
              backgroundColor: Colors.card,
              borderColor: Colors.primary,
            },
          ]}
        >
          <Activity
            size={18}
            color={mainTab === "habits" ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.mainTabText,
              { color: mainTab === "habits" ? Colors.text : Colors.textMuted },
            ]}
          >
            HABITS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMainTab("notes")}
          style={[
            styles.mainTabBtn,
            mainTab === "notes" && {
              backgroundColor: Colors.card,
              borderColor: Colors.primary,
            },
          ]}
        >
          <FileText
            size={18}
            color={mainTab === "notes" ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.mainTabText,
              { color: mainTab === "notes" ? Colors.text : Colors.textMuted },
            ]}
          >
            NOTES
          </Text>
        </TouchableOpacity>
      </View>

      {mainTab === "todos" ? (
        <View style={{ flex: 1 }}>
          {/* Search and Tabs code... */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.litSearchBox,
                { backgroundColor: Colors.card, borderColor: Colors.border },
              ]}
            >
              <Search size={20} color={Colors.primary} />
              <TextInput
                style={[styles.litSearchInput, { color: Colors.text }]}
                placeholder="Search your daily missions..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <View style={styles.tabScroll}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {[
                "all",
                "starred",
                "work",
                "personal",
                "shopping",
                "finance",
              ].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.litTab,
                    {
                      backgroundColor:
                        selectedTab === tab ? Colors.primary : Colors.card,
                      borderColor:
                        selectedTab === tab ? Colors.primary : Colors.border,
                    },
                  ]}
                  onPress={() => setSelectedTab(tab as any)}
                >
                  <Text
                    style={[
                      styles.litTabText,
                      {
                        color: selectedTab === tab ? "black" : Colors.textMuted,
                      },
                    ]}
                  >
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {filteredTodos.length === 0 ? (
              <View style={styles.empty}>
                <LayoutGrid size={50} color={Colors.textMuted} opacity={0.3} />
                <Text
                  style={{
                    color: Colors.textMuted,
                    marginTop: 15,
                    fontWeight: "bold",
                  }}
                >
                  No matches found
                </Text>
              </View>
            ) : (
              filteredTodos.map((item) => {
                const CategoryIcon =
                  CATEGORIES.find((c) => c.id === item.category)?.icon || User;
                const catColor =
                  CATEGORIES.find((c) => c.id === item.category)?.color ||
                  Colors.primary;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.litCard,
                      {
                        backgroundColor: Colors.card,
                        borderColor: item.completed
                          ? Colors.border
                          : Colors.primary + "30",
                        opacity: item.completed ? 0.5 : 1,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.litCheckContainer}
                      onPress={() =>
                        saveTodos(
                          todos.map((t) =>
                            t.id === item.id
                              ? { ...t, completed: !t.completed }
                              : t,
                          ),
                        )
                      }
                    >
                      {item.completed ? (
                        <CheckCircle2 color={Colors.primary} size={28} />
                      ) : (
                        <Circle color={Colors.textMuted} size={28} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.litMain}>
                      <View style={styles.litHeaderRow}>
                        <Text
                          style={[
                            styles.litText,
                            { color: Colors.text },
                            item.completed && styles.litStrike,
                          ]}
                        >
                          {item.text}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            saveTodos(
                              todos.map((t) =>
                                t.id === item.id
                                  ? { ...t, starred: !t.starred }
                                  : t,
                              ),
                            )
                          }
                        >
                          <Star
                            size={16}
                            color={
                              item.starred ? Colors.primary : Colors.textMuted
                            }
                            fill={item.starred ? Colors.primary : "transparent"}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.litMeta}>
                        <View
                          style={[
                            styles.litTag,
                            { backgroundColor: catColor + "20" },
                          ]}
                        >
                          <CategoryIcon size={10} color={catColor} />
                          <Text
                            style={[styles.litTagText, { color: catColor }]}
                          >
                            {item.category.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.dot} />
                        <Text
                          style={{
                            color: Colors.textMuted,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {item.time || item.date || "Today"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        saveTodos(todos.filter((t) => t.id !== item.id))
                      }
                      style={styles.litDelete}
                    >
                      <Trash2 size={16} color={Colors.secondary} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : mainTab === "notes" ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {notes.length === 0 ? (
            <View style={[styles.empty, { marginTop: 60 }]}>
              <StickyNote size={80} color={Colors.primary} opacity={0.2} />
              <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                Your thoughts, organized.
              </Text>
              <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
                Capture ideas, reminders, and financial tips in your private
                notes space.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: Colors.primary }]}
                onPress={() => handleOpenNote()}
              >
                <Plus size={20} color="#000" />
                <Text style={{ fontWeight: "bold", color: "#000" }}>
                  START WRITING
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.notesGrid}>
              {notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  style={[
                    styles.noteCard,
                    { backgroundColor: note.color || "#FEFF9C" },
                  ]}
                  onPress={() => handleOpenNote(note)}
                  onLongPress={() =>
                    Alert.alert("Delete Note", "Are you sure?", [
                      { text: "No" },
                      { text: "Delete", onPress: () => deleteNote(note.id) },
                    ])
                  }
                >
                  {/* Decorative Faded Elements */}
                  <View style={styles.cardDecor}>
                    <StickyNote
                      size={120}
                      color="#000"
                      opacity={0.05}
                      style={styles.decorIcon}
                    />
                  </View>

                  <View style={styles.noteCardHeader}>
                    <Text
                      style={[styles.noteTitle, { color: "#000" }]}
                      numberOfLines={1}
                    >
                      {note.title}
                    </Text>
                    <TouchableOpacity onPress={() => deleteNote(note.id)}>
                      <Trash2 size={14} color="rgba(0,0,0,0.5)" />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[styles.noteText, { color: "rgba(0,0,0,0.7)" }]}
                    numberOfLines={4}
                  >
                    {note.text}
                  </Text>
                  <Text style={[styles.noteDate, { color: "rgba(0,0,0,0.4)" }]}>
                    {note.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.levelCard,
              {
                backgroundColor: Colors.card,
                borderColor: Colors.primary + "30",
              },
            ]}
          >
            <View style={styles.levelInfo}>
              <Text style={[styles.levelSub, { color: Colors.primary }]}>
                YOUR STATUS: {level.icon}
              </Text>
              <Text style={[styles.levelTitle, { color: Colors.text }]}>
                {level.stage.toUpperCase()}
              </Text>
              <Text style={[styles.levelMsg, { color: Colors.textMuted }]}>
                {level.msg}
              </Text>

              <View style={styles.levelProgressRow}>
                <Zap size={10} color={Colors.primary} fill={Colors.primary} />
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  {totalMonthlyLogs} MONTHLY TICKS
                </Text>
              </View>
            </View>
            <LottieView
              source={require("@/assets/Tomato plant.json")}
              style={styles.levelLottie}
              autoPlay
              loop
              initialSegment={level.segments}
            />
          </View>

          {habits.length === 0 ? (
            <View style={[styles.empty, { marginTop: 60 }]}>
              <Activity size={80} color={Colors.primary} opacity={0.2} />
              <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                Master Your Routine.
              </Text>
              <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
                Small daily wins lead to big financial freedom. Start a habit
                today.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: Colors.primary }]}
                onPress={() => setIsHabitModalVisible(true)}
              >
                <Plus size={20} color="#000" />
                <Text style={{ fontWeight: "bold", color: "#000" }}>
                  ADD HABIT
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            habits.map((habit) => {
              const daysInMonth = new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                0,
              ).getDate();
              const currentMonthPrefix = new Date().toISOString().slice(0, 8); // "YYYY-MM-"
              const Icon = HABIT_ICONS[habit.icon] || Zap;

              return (
                <View
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: Colors.card,
                      borderColor: Colors.border,
                    },
                  ]}
                >
                  <View style={styles.habitHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={[
                          styles.habitIconBox,
                          { backgroundColor: habit.color + "20" },
                        ]}
                      >
                        <Icon size={18} color={habit.color} />
                      </View>
                      <View>
                        <Text
                          style={[styles.habitName, { color: Colors.text }]}
                        >
                          {habit.name}
                        </Text>
                        <Text
                          style={{
                            color: Colors.textMuted,
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          MONTHLY PROGRESS
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => deleteHabit(habit.id)}>
                      <Trash2 size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.habitGrid}>
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentMonthPrefix}${day.toString().padStart(2, "0")}`;
                      const isDone = habit.logs.includes(dateStr);

                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.habitDay,
                            { borderColor: Colors.border },
                            isDone && {
                              backgroundColor: habit.color,
                              borderColor: habit.color,
                            },
                          ]}
                          onPress={() => toggleHabitDay(habit, dateStr)}
                        >
                          {isDone ? (
                            <CheckCircle2 size={10} color="#000" />
                          ) : (
                            <Text
                              style={[
                                styles.habitDayText,
                                { color: Colors.textMuted },
                              ]}
                            >
                              {day}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.habitFooter}>
                    <Text
                      style={[styles.habitStat, { color: Colors.textMuted }]}
                    >
                      SCORE:{" "}
                      <Text style={{ color: habit.color }}>
                        {
                          habit.logs.filter((l) =>
                            l.startsWith(currentMonthPrefix),
                          ).length
                        }
                      </Text>{" "}
                      DAYS THIS MONTH
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Todo Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={{ color: Colors.text, fontSize: 24, fontWeight: "900" }}
              >
                New Task
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors.background,
                  color: Colors.text,
                  borderColor: Colors.border,
                },
              ]}
              placeholder="Focus on..."
              placeholderTextColor={Colors.textMuted}
              value={task}
              onChangeText={setTask}
            />

            <View style={styles.modalSubRow}>
              <TouchableOpacity
                style={[
                  styles.modalInputBtn,
                  {
                    backgroundColor: Colors.background,
                    borderColor: Colors.border,
                  },
                ]}
                onPress={() => setShowDate(true)}
              >
                <Calendar size={14} color={Colors.primary} />
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {todoDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalInputBtn,
                  {
                    backgroundColor: Colors.background,
                    borderColor: Colors.border,
                  },
                ]}
                onPress={() => setShowTime(true)}
              >
                <Clock size={14} color={Colors.primary} />
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {todoDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDate && (
              <DateTimePicker
                value={todoDate}
                mode="date"
                onChange={(e, d) => {
                  setShowDate(false);
                  if (d) setTodoDate(d);
                }}
              />
            )}
            {showTime && (
              <DateTimePicker
                value={todoDate}
                mode="time"
                onChange={(e, d) => {
                  setShowTime(false);
                  if (d) setTodoDate(d);
                }}
              />
            )}

            <Text style={[styles.label, { color: Colors.textMuted }]}>
              CATEGORY
            </Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catBtn,
                    cat === c.id && {
                      backgroundColor: c.color + "15",
                      borderColor: c.color,
                    },
                    { borderColor: Colors.border },
                  ]}
                  onPress={() => setCat(c.id as any)}
                >
                  <c.icon
                    size={20}
                    color={cat === c.id ? c.color : Colors.textMuted}
                  />
                  <Text
                    style={{
                      color: cat === c.id ? c.color : Colors.textMuted,
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => setIsStarred(!isStarred)}
            >
              <Star
                size={20}
                color={isStarred ? Colors.primary : Colors.textMuted}
                fill={isStarred ? Colors.primary : "transparent"}
              />
              <Text
                style={{ color: Colors.text, fontWeight: "bold", fontSize: 15 }}
              >
                Star as Important
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Colors.primary }]}
              onPress={addTodo}
            >
              <Text style={{ color: "black", fontWeight: "900", fontSize: 18 }}>
                Confirm Task
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Note Screen (Modal) */}
      <Modal
        visible={isNoteModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <View
          style={[
            styles.screenContainer,
            { backgroundColor: noteColor || "#FEFF9C" },
          ]}
        >
          {/* Artistic Background Spread (Moved to root of Modal content for visibility) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Watermarks around the screen */}
            <StickyNote
              size={300}
              color="#000"
              opacity={0.08}
              style={{
                position: "absolute",
                top: -100,
                right: -100,
                transform: [{ rotate: "15deg" }],
              }}
            />
            <FileText
              size={250}
              color="#000"
              opacity={0.06}
              style={{
                position: "absolute",
                top: 300,
                left: -100,
                transform: [{ rotate: "-25deg" }],
              }}
            />
            <Palette
              size={200}
              color="#000"
              opacity={0.08}
              style={{
                position: "absolute",
                top: 700,
                right: -50,
                transform: [{ rotate: "45deg" }],
              }}
            />
            <Sparkles
              size={180}
              color="#000"
              opacity={0.08}
              style={{ position: "absolute", bottom: -50, left: 20 }}
            />
            <Trophy
              size={150}
              color="#000"
              opacity={0.06}
              style={{
                position: "absolute",
                bottom: 150,
                right: -30,
                transform: [{ rotate: "-15deg" }],
              }}
            />

            {/* Grid Pattern Dots for Paper Texture */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                opacity: 0.15,
                flexDirection: "row",
                flexWrap: "wrap",
                padding: 10,
              }}
            >
              {Array.from({ length: 600 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 1.5,
                    height: 1.5,
                    borderRadius: 1,
                    backgroundColor: "#000",
                    margin: 15,
                  }}
                />
              ))}
            </View>
          </View>

          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.screenHeader}>
              <TouchableOpacity
                onPress={() => setIsNoteModalVisible(false)}
                style={styles.iconBtn}
              >
                <ChevronLeft color="#000" size={28} />
              </TouchableOpacity>
              <Text style={[styles.screenTitle, { color: "#000" }]}>
                {editingNoteId ? "Edit Note" : "New Note"}
              </Text>
              <TouchableOpacity
                onPress={handleAddNote}
                style={[styles.screenAction, { backgroundColor: "#000" }]}
              >
                <Text
                  style={[
                    styles.screenActionText,
                    { color: noteColor || "#FEFF9C" },
                  ]}
                >
                  {editingNoteId ? "UPDATE" : "SAVE"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.screenBody}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[styles.screenTitleInput, { color: "#000" }]}
                placeholder="Title"
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={noteTitle}
                onChangeText={setNoteTitle}
              />

              <View style={styles.screenMeta}>
                <Calendar size={12} color="rgba(0,0,0,0.5)" />
                <Text style={{ color: "rgba(0,0,0,0.5)", fontSize: 12 }}>
                  {new Date().toLocaleDateString()}
                </Text>
                <View
                  style={[styles.dot, { backgroundColor: "rgba(0,0,0,0.2)" }]}
                />
                <Palette size={12} color="#000" />
                <Text
                  style={{ color: "#000", fontSize: 12, fontWeight: "bold" }}
                >
                  STYLE THEME
                </Text>
              </View>

              <TextInput
                style={[styles.screenNoteArea, { color: "rgba(0,0,0,0.8)" }]}
                placeholder="Start typing your note..."
                placeholderTextColor="rgba(0,0,0,0.3)"
                multiline
                value={noteText}
                onChangeText={setNoteText}
              />

              <Text
                style={[styles.screenColorLabel, { color: "rgba(0,0,0,0.4)" }]}
              >
                CHOOSE STICKY STYLE
              </Text>
              <View style={styles.colorPicker}>
                {NOTE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setNoteColor(c)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      noteColor === c && {
                        borderColor: "#000",
                        borderWidth: 3,
                      },
                    ]}
                  />
                ))}
              </View>

              {editingNoteId && (
                <TouchableOpacity
                  style={[
                    styles.deleteNoteBtn,
                    { borderTopColor: "rgba(0,0,0,0.1)" },
                  ]}
                  onPress={() => {
                    Alert.alert("Delete", "Delete this note?", [
                      { text: "Cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          deleteNote(editingNoteId);
                          setIsNoteModalVisible(false);
                        },
                      },
                    ]);
                  }}
                >
                  <Trash2 size={20} color="#FF4500" />
                  <Text style={{ color: "#FF4500", fontWeight: "bold" }}>
                    DELETE NOTE
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Habit Modal */}
      <Modal visible={isHabitModalVisible} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={{ color: Colors.text, fontSize: 24, fontWeight: "900" }}
              >
                New Habit
              </Text>
              <TouchableOpacity onPress={() => setIsHabitModalVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors.background,
                  color: Colors.text,
                  borderColor: Colors.border,
                },
              ]}
              placeholder="E.g. Daily Exercise, Save 100..."
              placeholderTextColor={Colors.textMuted}
              value={hName}
              onChangeText={setHName}
            />

            <Text style={[styles.label, { color: Colors.textMuted }]}>
              PICK COLOR
            </Text>
            <View style={styles.catGrid}>
              {[
                "#FF7A00",
                "#10B981",
                "#3B82F6",
                "#8B5CF6",
                "#F43F5E",
                "#EAB308",
              ].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    hColor === c && {
                      borderWidth: 3,
                      borderColor: Colors.text,
                    },
                  ]}
                  onPress={() => setHColor(c)}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: Colors.textMuted }]}>
              CHOOSE ICON
            </Text>
            <View style={styles.catGrid}>
                {Object.keys(HABIT_ICONS).map(iconName => {
                    const Icon = HABIT_ICONS[iconName];
                    return (
                        <TouchableOpacity 
                            key={iconName}
                            onPress={() => setHIcon(iconName)}
                            style={[
                                styles.catBtn, 
                                hIcon === iconName && { backgroundColor: hColor + '15', borderColor: hColor },
                                { borderColor: Colors.border }
                            ]}
                        >
                            <Icon size={20} color={hIcon === iconName ? hColor : Colors.textMuted} />
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Colors.primary }]}
              onPress={handleCreateHabit}
            >
              <Text style={{ color: "black", fontWeight: "900", fontSize: 18 }}>
                Start Habit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  title: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  litAddBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  mainTabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 6,
    borderRadius: 18,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  mainTabText: { fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  litSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  litSearchInput: { flex: 1, fontSize: 15, fontWeight: "700" },
  tabScroll: { marginBottom: 15 },
  litTab: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
  },
  litTabText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  content: { padding: 20 },
  litCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 32,
    marginBottom: 15,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  litCheckContainer: { paddingRight: 15 },
  litMain: { flex: 1 },
  litHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  litText: { fontSize: 16, fontWeight: "800", lineHeight: 22, marginRight: 10 },
  litStrike: { textDecorationLine: "line-through", opacity: 0.4 },
  litMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  litTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  litTagText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  litDelete: { paddingLeft: 15 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  empty: { padding: 40, alignItems: "center" },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 20,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 30,
  },
  notesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  noteCard: {
    width: (Dimensions.get("window").width - 55) / 2,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 180,
    overflow: "hidden",
  },
  cardDecor: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    overflow: "hidden",
  },
  decorIcon: {
    position: "absolute",
    bottom: -20,
    right: -20,
    transform: [{ rotate: "-15deg" }],
  },
  noteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  noteTitle: { fontSize: 18, fontWeight: "900", flex: 1, marginRight: 10 },
  noteText: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  noteDate: {
    fontSize: 10,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.4)",
    marginTop: "auto",
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  input: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  modalInputBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 25,
    marginBottom: 12,
    letterSpacing: 2,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catBtn: {
    flex: 1,
    minWidth: 70,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 25,
  },
  saveBtn: {
    height: 68,
    borderRadius: 24,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  noteTitleInput: {
    fontSize: 24,
    fontWeight: "900",
    borderBottomWidth: 1,
    paddingBottom: 15,
    marginBottom: 20,
  },
  noteArea: {
    fontSize: 16,
    lineHeight: 24,
    height: 200,
    textAlignVertical: "top",
  },
  colorPicker: { flexDirection: "row", gap: 10, marginTop: 20 },
  colorCircle: { width: 44, height: 44, borderRadius: 22 },

  // New Screen Styles
  screenContainer: { flex: 1 },
  screenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  screenTitle: { fontSize: 18, fontWeight: "900" },
  screenAction: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  screenActionText: { color: "black", fontWeight: "900", fontSize: 13 },
  screenBody: { padding: 25 },
  screenTitleInput: { fontSize: 32, fontWeight: "900", marginBottom: 15 },
  screenMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 30,
  },
  screenNoteArea: {
    fontSize: 18,
    lineHeight: 28,
    minHeight: 300,
    textAlignVertical: "top",
  },
  screenColorLabel: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 40,
    letterSpacing: 1.5,
    color: "#666",
  },
  deleteNoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 60,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  // Habit Tracking Styles
  habitCard: {
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 15,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  habitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  habitName: { fontSize: 18, fontWeight: "900" },
  habitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  habitDay: {
    width: (Dimensions.get("window").width - 100) / 7,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  habitDayText: { fontSize: 10, fontWeight: "900" },
  habitFooter: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 10,
  },
  habitStat: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },

  // Evolution Card Styles
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 25,
    overflow: "hidden",
  },
  levelInfo: { flex: 1, gap: 4 },
  levelSub: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  levelTitle: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  levelMsg: { fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 4 },
  levelLottie: {
    width: 180,
    height: 180,
    position: "absolute",
    right: -20,
    bottom: -20,
  },
  levelProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
});
