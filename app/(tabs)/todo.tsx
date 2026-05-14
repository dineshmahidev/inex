import { FlowBannerAd } from "@/components/FlowBannerAd";
import { useDatabase } from "@/hooks/useDatabase";
import {
  cancelReminderNotification,
  requestNotificationPermissions,
  scheduleHabitNotification,
  scheduleTodoNotification,
  scheduleVoiceNoteNotification,
} from "@/utils/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import {
  Activity,
  Bell,
  Book,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  Coffee,
  Dumbbell,
  Edit2,
  FileText,
  Heart,
  LayoutGrid,
  Mic,
  Palette,
  Pause,
  Pin,
  Play,
  Plus,
  Search,
  ShoppingCart,
  Smile,
  Sparkles,
  Star,
  StickyNote,
  StopCircle,
  Trash2,
  Trophy,
  User,
  Wallet,
  X,
  Zap
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
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
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TODO_KEY = "@productivity_todos_v5";
const NOTE_COLORS = ["#FEFF9C", "#7AFEC6", "#FF7EB9", "#7AFBFF", "#FFF3B0"];

const DAILY_QUOTES = [
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. - Aristotle",
  "Motivation is what gets you started. Habit is what keeps you going. - Jim Ryun",
  "You do not rise to the level of your goals. You fall to the level of your systems. - James Clear",
  "Success is the product of daily habits—not once-in-a-lifetime transformations. - James Clear",
  "The chains of habit are too weak to be felt until they are too strong to be broken. - Samuel Johnson",
  "Good habits are worth being fanatical about. - John Irving",
  "Small daily improvements over time lead to stunning results. - Robin Sharma",
  "First forget inspiration. Habit is more dependable. - Octavia Butler",
  "Drop by drop is the water pot filled. - Buddha",
];

interface Todo {
  id: string;
  text: string;
  date: string;
  time: string;
  category: "work" | "personal" | "shopping" | "finance";
  starred: boolean;
  completed: boolean;
  reminderDate?: string;
}

const CATEGORIES = [
  { id: "work", label: "Work", icon: Briefcase, emoji: "💼", color: "#EF4444" },
  { id: "personal", label: "Personal", icon: User, emoji: "👤", color: "#F87171" },
  { id: "shopping", label: "Shopping", icon: ShoppingCart, emoji: "🛒", color: "#DC2626" },
  { id: "finance", label: "Finance", icon: Wallet, emoji: "💰", color: "#991B1B" },
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
  Wallet,
};

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const {
    Colors,
    settings,
    notes,
    addNote,
    updateNote,
    deleteNote,
    todos,
    addTodo: addTodoToDb,
    updateTodo,
    saveTodos,
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    voiceNotes,
    addVoiceNote,
    updateVoiceNote,
    deleteVoiceNote,
  } = useDatabase();

  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 0).getTime()) /
        1000 /
        60 /
        60 /
        24,
    );
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  }, []);

  const [mainTab, setMainTab] = useState<
    "todos" | "notes" | "habits" | "voice"
  >("todos");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "starred" | "work" | "personal"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Todo Form State
  const [task, setTask] = useState("");
  const [todoDate, setTodoDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5); // Default to 5 mins in future
    return d;
  });
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
  const [isNotePinned, setIsNotePinned] = useState(false);

  // Habit Form State
  const [isHabitModalVisible, setIsHabitModalVisible] = useState(false);
  const [hName, setHName] = useState("");
  const [hColor, setHColor] = useState("#FF7A00");
  const [hIcon, setHIcon] = useState("Zap");
  const [hTime, setHTime] = useState("");
  const [showHTime, setShowHTime] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Voice Note State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vnTitle, setVnTitle] = useState("");
  const [vnDate, setVnDate] = useState(new Date());
  const [showVnDate, setShowVnDate] = useState(false);
  const [showVnTime, setShowVnTime] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [editingVnId, setEditingVnId] = useState<string | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelectionMode = selectedIds.length > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteSelected = () => {
    Alert.alert(
      "Delete Selected?",
      `Remove ${selectedIds.length} tasks and their reminders?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = todos.filter((t) => !selectedIds.includes(t.id));
            await saveTodos(updated);
            for (const id of selectedIds) {
              await cancelReminderNotification(id);
            }
            setSelectedIds([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const addTodo = async () => {
    if (isSubmitting || !task) return;
    setIsSubmitting(true);

    if (editingTodoId) {
      await updateTodo(editingTodoId, {
        text: task,
        date: todoDate.toLocaleDateString(),
        time: todoDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        category: cat,
        starred: isStarred,
        reminderDate: todoDate.toISOString(),
      });
      // Reschedule notification
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await cancelReminderNotification(editingTodoId);
        if (todoDate.getTime() > Date.now()) {
          await scheduleTodoNotification(editingTodoId, task, todoDate);
        }
      }
    } else {
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
        reminderDate: todoDate.toISOString(),
      };
      const todoId = await addTodoToDb(item);

      // Schedule notification
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission && todoDate.getTime() > Date.now()) {
        await scheduleTodoNotification(todoId, task, todoDate);
      }
    }

    setTask("");
    setTodoDate(new Date(Date.now() + 5 * 60000));
    setIsStarred(false);
    setEditingTodoId(null);
    setIsSubmitting(false);
    setIsModalVisible(false);
  };

  const handleTodoPress = (todo: Todo) => {
    if (isSelectionMode) {
      toggleSelection(todo.id);
      return;
    }
    Alert.alert("Manage Task", todo.text, [
      {
        text: "Edit",
        onPress: () => {
          setEditingTodoId(todo.id);
          setTask(todo.text);
          setCat(todo.category as any);
          setIsStarred(todo.starred);
          if (todo.reminderDate) {
            setTodoDate(new Date(todo.reminderDate));
          }
          setIsSubmitting(false);
          setIsModalVisible(true);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDeleteTodo(todo.id),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const confirmDeleteTodo = (id: string) => {
    Alert.alert("Delete Task?", "This task and its reminder will be removed.", [
      { text: "Keep" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = todos.filter((t) => t.id !== id);
          await saveTodos(updated);
          await cancelReminderNotification(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleOpenNote = (note?: any) => {
    if (note) {
      setEditingNoteId(note.id);
      setNoteTitle(note.title);
      setNoteText(note.text);
      setNoteColor(note.color || NOTE_COLORS[0]);
      setIsNotePinned(note.pinned || false);
    } else {
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteText("");
      setNoteColor(NOTE_COLORS[0]);
      setIsNotePinned(false);
    }
    setIsNoteModalVisible(true);
  };

  const handleAddNote = async () => {
    if (isSubmitting || !noteTitle || !noteText) return;
    setIsSubmitting(true);

    if (editingNoteId) {
      await updateNote(editingNoteId, {
        title: noteTitle,
        text: noteText,
        color: noteColor,
        pinned: isNotePinned,
      });
    } else {
      await addNote({
        title: noteTitle,
        text: noteText,
        color: noteColor,
        date: new Date().toLocaleDateString(),
        pinned: isNotePinned,
      });
    }

    setNoteTitle("");
    setNoteText("");
    setEditingNoteId(null);
    setIsSubmitting(false);
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
    if (isSubmitting || !hName) return;
    setIsSubmitting(true);

    if (editingHabitId) {
      await updateHabit(editingHabitId, {
        name: hName,
        color: hColor,
        icon: hIcon,
        reminderTime: hTime || undefined,
      });
      await cancelReminderNotification(editingHabitId);
      if (hTime) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleHabitNotification(editingHabitId, hName, hTime);
        }
      }
    } else {
      const id = await addHabit({
        name: hName,
        color: hColor,
        icon: hIcon,
        reminderTime: hTime || undefined,
      });
      if (hTime) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleHabitNotification(id, hName, hTime);
        }
      }
    }

    setHName("");
    setHTime("");
    setEditingHabitId(null);
    setIsSubmitting(false);
    setIsHabitModalVisible(false);
  };

  const handleOpenHabitModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabitId(habit.id);
      setHName(habit.name);
      setHColor(habit.color);
      setHIcon(habit.icon);
      setHTime(habit.reminderTime || "");
    } else {
      setEditingHabitId(null);
      setHName("");
      setHColor("#FF7A00");
      setHIcon("Zap");
      setHTime("");
    }
    setIsSubmitting(false);
    setIsHabitModalVisible(true);
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

  const filteredNotes = useMemo(() => {
    let f = notes;
    if (searchQuery) {
      f = f.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return f.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes, searchQuery]);

  const filteredHabits = useMemo(() => {
    let f = habits;
    if (searchQuery) {
      f = f.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return f;
  }, [habits, searchQuery]);

  const getHabitStreak = (logs: string[]) => {
    if (!logs || logs.length === 0) return 0;
    const sorted = [...logs].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
    let streak = 0;
    let current = new Date();
    const formatLocal = (d: Date) =>
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    if (!sorted.includes(formatLocal(current))) {
      current.setDate(current.getDate() - 1);
    }
    for (const d of sorted) {
      if (d === formatLocal(current)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

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
        segments: [0, 60] as [number, number],
      };
    if (score < 30)
      return {
        stage: "Sprouter",
        icon: "🌿",
        msg: "Consistency is building up!",
        segments: [60, 100] as [number, number],
      };
    if (score < 60)
      return {
        stage: "Bloomer",
        icon: "🌳",
        msg: "You are mastering your system.",
        segments: [100, 150] as [number, number],
      };
    return {
      stage: "Master",
      icon: "👑",
      msg: "Elite habit formation.",
      segments: [150, 200] as [number, number],
    };
  };

  const level = getProductivityLevel(totalMonthlyLogs);

  // --- VOICE RECORDING HELPERS ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        setRecording(recording);
        setIsRecording(true);
        setRecordingDuration(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert(
        "Permission Error",
        "Microphone access is required to record voice notes.",
      );
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();
      setRecordedUri(uri || null);
      setRecording(null);
      if (uri) {
        setIsSubmitting(false);
        setIsVoiceModalVisible(true);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const playVoiceNote = async (uri: string, id: string) => {
    try {
      if (sound && isPlayingId === id) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
        } else if (status.isLoaded) {
          await sound.playAsync();
        }
        return;
      }

      if (sound) {
        await sound.unloadAsync();
        setPlaybackPosition(0);
        setPlaybackDuration(0);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );

      setSound(newSound);
      setIsPlayingId(id);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis || 0);
          setPlaybackDuration(status.durationMillis || 0);

          if (status.didJustFinish) {
            setIsPlayingId(null);
            setPlaybackPosition(0);
          }
        }
      });
    } catch (err) {
      console.error("Playback error", err);
      Alert.alert("Playback Error", "Could not play this voice note.");
    }
  };

  const handleEditVoiceNote = (vn: any) => {
    setEditingVnId(vn.id);
    setVnTitle(vn.title);
    setVnDate(vn.reminderDate ? new Date(vn.reminderDate) : new Date());
    setRecordedUri(vn.uri);
    setRecordingDuration(vn.duration || 0);
    setIsVoiceModalVisible(true);
  };

  const handleSaveVoiceNote = async () => {
    if (isSubmitting || !recordedUri) return;
    setIsSubmitting(true);

    try {
      if (editingVnId) {
        await updateVoiceNote(editingVnId, {
          title: vnTitle || "Voice Note",
          date: vnDate.toLocaleDateString(),
          time: vnDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          reminderDate: vnDate.toISOString(),
        });
        
        await cancelReminderNotification(editingVnId);
        if (vnDate.getTime() > Date.now()) {
          await scheduleVoiceNoteNotification(
            editingVnId,
            vnTitle || "Voice Note",
            vnDate,
          );
        }
      } else {
        const fileName = `voice_${Date.now()}.m4a`;
        const permanentUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.moveAsync({
          from: recordedUri,
          to: permanentUri,
        });

        const vnId = await addVoiceNote({
          title: vnTitle || "Voice Note",
          uri: permanentUri,
          date: vnDate.toLocaleDateString(),
          time: vnDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          reminderDate: vnDate.toISOString(),
          duration: recordingDuration,
        });

        if (vnDate.getTime() > Date.now()) {
          await scheduleVoiceNoteNotification(
            vnId,
            vnTitle || "Voice Note",
            vnDate,
          );
        }
      }

      setIsVoiceModalVisible(false);
      setVnTitle("");
      setRecordedUri(null);
      setEditingVnId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to save voice note:", error);
      Alert.alert("Save Failed", "Could not persist the audio mission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteVoice = (id: string, uri?: string) => {
    Alert.alert("Delete Note", "Remove this voice mission forever?", [
      { text: "Keep" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteVoiceNote(id);
          if (uri) {
            try {
              // Ensure we delete the actual file
              await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (err) {
              console.warn("Failed to delete audio file:", err);
            }
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

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
            {mainTab === "todos" && isSelectionMode
              ? `${selectedIds.length} Selected`
              : mainTab === "todos"
                ? "Focus"
                : "Notes"}
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

        <View style={{ flexDirection: "row", gap: 10 }}>
          {mainTab === "todos" && isSelectionMode && (
            <>
              <TouchableOpacity
                style={[
                  styles.litAddBtn,
                  {
                    backgroundColor: Colors.card,
                    borderWidth: 1,
                    borderColor: Colors.primary,
                  },
                ]}
                onPress={() => {
                  if (selectedIds.length === filteredTodos.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(filteredTodos.map((t) => t.id));
                  }
                  Haptics.selectionAsync();
                }}
              >
                <CheckCircle2 color={Colors.primary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.litAddBtn,
                  {
                    backgroundColor: Colors.card,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  },
                ]}
                onPress={() => setSelectedIds([])}
              >
                <X color={Colors.text} size={20} />
              </TouchableOpacity>
            </>
          )}
        </View>
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

      {mainTab === "todos" && (
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.searchContainer,
              { flexDirection: "row", alignItems: "center", gap: 10 },
            ]}
          >
            <View
              style={[
                styles.litSearchBox,
                {
                  backgroundColor: Colors.card,
                  borderColor: Colors.border,
                  flex: 1,
                },
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
            <TouchableOpacity
              style={[
                styles.starFilterBtn,
                {
                  backgroundColor:
                    selectedTab === "starred" ? Colors.primary : Colors.card,
                  borderColor: Colors.border,
                },
              ]}
              onPress={() =>
                setSelectedTab(selectedTab === "starred" ? "all" : "starred")
              }
            >
              <Star
                size={22}
                color={
                  selectedTab === "starred" ? Colors.background : Colors.primary
                }
                fill={
                  selectedTab === "starred" ? Colors.background : "transparent"
                }
              />
            </TouchableOpacity>
          </View>

          <View style={styles.tabScroll}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {[
                { id: "all", label: "All", emoji: "📋" },
                { id: "starred", label: "Starred", emoji: "⭐" },
                ...CATEGORIES,
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.litTab,
                    {
                      backgroundColor:
                        selectedTab === tab.id ? Colors.primary : Colors.card,
                      borderColor:
                        selectedTab === tab.id ? Colors.primary : Colors.border,
                    },
                  ]}
                  onPress={() => setSelectedTab(tab.id as any)}
                >
                  <Text
                    style={[
                      styles.litTabText,
                      {
                        color: selectedTab === tab.id ? "black" : Colors.textMuted,
                      },
                    ]}
                  >
                    {tab.emoji} {tab.label.toUpperCase()}
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
                const isOverdue =
                  item.reminderDate &&
                  new Date(item.reminderDate).getTime() < Date.now() &&
                  !item.completed;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleTodoPress(item)}
                    onLongPress={() => toggleSelection(item.id)}
                    style={[
                      styles.litCard,
                      {
                        backgroundColor:
                          isSelectionMode && selectedIds.includes(item.id)
                            ? Colors.primary
                            : Colors.card,
                        borderColor: selectedIds.includes(item.id)
                          ? Colors.primary
                          : item.completed
                            ? Colors.border
                            : Colors.primary + "30",
                        borderWidth: selectedIds.includes(item.id) ? 2 : 1,
                        opacity: item.completed && !isSelectionMode ? 0.5 : 1,
                        overflow: "hidden",
                      },
                    ]}
                  >
                    {isSelectionMode ? (
                      <View style={styles.litCheckContainer}>
                        <View
                          style={[
                            styles.selectionCircle,
                            {
                              backgroundColor: selectedIds.includes(item.id)
                                ? "#000"
                                : "transparent",
                              borderColor: selectedIds.includes(item.id)
                                ? "#000"
                                : Colors.border,
                            },
                          ]}
                        >
                          {selectedIds.includes(item.id) && (
                            <CheckCircle2 color={Colors.primary} size={18} />
                          )}
                        </View>
                      </View>
                    ) : (
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
                    )}
                    <View style={styles.litMain}>
                      <View style={styles.litHeaderRow}>
                        <Text
                          style={[
                            styles.litText,
                            {
                              color: selectedIds.includes(item.id)
                                ? "#000"
                                : Colors.text,
                            },
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
                              item.starred
                                ? selectedIds.includes(item.id)
                                  ? "#000"
                                  : Colors.primary
                                : selectedIds.includes(item.id)
                                  ? "rgba(0,0,0,0.4)"
                                  : Colors.textMuted
                            }
                            fill={
                              item.starred
                                ? selectedIds.includes(item.id)
                                  ? "#000"
                                  : Colors.primary
                                : "transparent"
                            }
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.litMeta}>
                        <View
                          style={[
                            styles.litTag,
                            {
                              backgroundColor: selectedIds.includes(item.id)
                                ? "rgba(0,0,0,0.1)"
                                : catColor + "20",
                            },
                          ]}
                        >
                          <CategoryIcon
                            size={10}
                            color={
                              selectedIds.includes(item.id) ? "#000" : catColor
                            }
                          />
                          <Text
                            style={[
                              styles.litTagText,
                              {
                                color: selectedIds.includes(item.id)
                                  ? "#000"
                                  : catColor,
                              },
                            ]}
                          >
                            {item.category.toUpperCase()}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: selectedIds.includes(item.id)
                                ? "rgba(0,0,0,0.3)"
                                : "rgba(255,255,255,0.2)",
                            },
                          ]}
                        />
                        <Text
                          style={{
                            color: isOverdue
                              ? "#EF4444"
                              : selectedIds.includes(item.id)
                                ? "#000"
                                : Colors.textMuted,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {isOverdue
                            ? "OVERDUE"
                            : item.time || item.date || "Today"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {!isSelectionMode && (
            <TouchableOpacity
              onPress={() => {
                setIsSubmitting(false);
                setIsModalVisible(true);
              }}
              style={[
                styles.mainFab,
                { backgroundColor: Colors.primary, bottom: 20 + insets.bottom },
              ]}
            >
              <Plus size={32} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {mainTab === "notes" && (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotes.length === 0 ? (
              <View style={[styles.empty, { marginTop: 60 }]}>
                <StickyNote size={80} color={Colors.primary} opacity={0.2} />
                <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                  {searchQuery
                    ? "No notes found matching search."
                    : "Your thoughts, organized."}
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
                {filteredNotes.map((note, index) => {
                  const rotation = index % 2 === 0 ? "1.5deg" : "-1.5deg";
                  return (
                    <TouchableOpacity
                      key={note.id}
                      style={[
                        styles.noteCard,
                        {
                          backgroundColor: note.color || "#FEFF9C",
                          transform: [
                            { rotate: note.pinned ? "0deg" : rotation },
                          ],
                        },
                      ]}
                      onPress={() => handleOpenNote(note)}
                      onLongPress={() =>
                        Alert.alert("Delete Note", "Are you sure?", [
                          { text: "No" },
                          {
                            text: "Delete",
                            onPress: () => deleteNote(note.id),
                          },
                        ])
                      }
                    >
                      {/* Push Pin Visual */}
                      <View style={styles.pushPinContainer}>
                        <View
                          style={[
                            styles.pushPinHead,
                            {
                              backgroundColor: note.pinned
                                ? "#EF4444"
                                : "#94A3B8",
                            },
                          ]}
                        >
                          <View style={styles.pushPinShine} />
                        </View>
                        <View style={styles.pushPinNeedle} />
                      </View>

                      <View style={styles.noteCardHeader}>
                        <Text
                          style={[styles.noteTitle, { color: "#1E293B" }]}
                          numberOfLines={1}
                        >
                          {note.title}
                        </Text>
                        {note.pinned && (
                          <Pin size={12} color="#EF4444" fill="#EF4444" />
                        )}
                      </View>

                      <Text
                        style={[styles.noteText, { color: "rgba(0,0,0,0.7)" }]}
                        numberOfLines={5}
                      >
                        {note.text}
                      </Text>

                      <Text
                        style={[styles.noteDate, { color: "rgba(0,0,0,0.4)" }]}
                      >
                        {note.date}
                      </Text>

                      {/* Corner Fold Effect Overlay */}
                      <View
                        style={[
                          styles.cornerFold,
                          {
                            borderBottomColor: "rgba(0,0,0,0.05)",
                            borderLeftColor: "rgba(0,0,0,0.05)",
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.cornerFoldInner,
                          { backgroundColor: "rgba(0,0,0,0.1)" },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ marginTop: 40, marginBottom: 20 }}>
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 24,
                  fontWeight: "900",
                  letterSpacing: -1,
                }}
              >
                Voice Library
              </Text>
              <Text
                style={{
                  color: Colors.textMuted,
                  fontSize: 13,
                  fontWeight: "600",
                  marginTop: 4,
                }}
              >
                Your auditory missions and reminders
              </Text>
            </View>

            {voiceNotes.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  {
                    marginTop: 20,
                    backgroundColor: Colors.card,
                    borderRadius: 24,
                    padding: 30,
                  },
                ]}
              >
                <Mic size={50} color={Colors.primary} opacity={0.2} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: Colors.text, fontSize: 18 },
                  ]}
                >
                  No Voice Notes
                </Text>
                <Text
                  style={[
                    styles.emptySub,
                    { color: Colors.textMuted, fontSize: 12 },
                  ]}
                >
                  Record a voice note to set a reminder.
                </Text>
              </View>
            ) : (
              voiceNotes.map((vn) => {
                const isPlaying = isPlayingId === vn.id;
                const progress =
                  isPlaying && playbackDuration > 0
                    ? playbackPosition / playbackDuration
                    : 0;

                return (
                  <View
                    key={vn.id}
                    style={[
                      styles.voiceCard,
                      {
                        backgroundColor: Colors.card,
                        borderColor: Colors.border,
                        overflow: "hidden",
                      },
                    ]}
                  >
                    {/* Playback Progress Overlay */}
                    {isPlaying && (
                      <View
                        style={[
                          styles.progressBackground,
                          {
                            width: `${progress * 100}%`,
                            backgroundColor: Colors.primary + "15",
                          },
                        ]}
                      />
                    )}

                    <View style={styles.voiceCardLeft}>
                      <TouchableOpacity
                        style={[
                          styles.playBtn,
                          { backgroundColor: Colors.primary },
                        ]}
                        onPress={() => playVoiceNote(vn.uri, vn.id)}
                      >
                        {isPlaying ? (
                          <Pause size={20} color="#000" />
                        ) : (
                          <Play
                            size={20}
                            color="#000"
                            style={{ marginLeft: 3 }}
                          />
                        )}
                      </TouchableOpacity>
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text
                          style={{
                            color: Colors.text,
                            fontSize: 16,
                            fontWeight: "800",
                          }}
                          numberOfLines={1}
                        >
                          {vn.title}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 4,
                          }}
                        >
                          <Clock size={12} color={Colors.textMuted} />
                          <Text
                            style={{
                              color: Colors.textMuted,
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            {vn.date} •{" "}
                            {isPlaying
                              ? `${formatTime(Math.floor(playbackPosition / 1000))} / ${formatTime(Math.floor(playbackDuration / 1000))}`
                              : vn.time}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                      <TouchableOpacity
                        onPress={() => handleEditVoiceNote(vn)}
                      >
                        <Edit2 size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteVoice(vn.id, vn.uri)}
                      >
                        <Trash2 size={18} color="#EF4444" opacity={0.8} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
            <View
              style={[
                styles.recordControls,
                {
                  position: "relative",
                  marginTop: 40,
                  paddingBottom: 20 + insets.bottom,
                },
              ]}
            >
              <View
                style={[
                  styles.recordingVisual,
                  isRecording && {
                    borderColor: "#EF4444",
                    backgroundColor: "#EF444410",
                  },
                ]}
              >
                {isRecording ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View style={styles.pulseDot} />
                    <Text
                      style={{
                        color: "#EF4444",
                        fontWeight: "900",
                        fontSize: 16,
                      }}
                    >
                      {formatTime(recordingDuration)}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    READY TO CAPTURE
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onLongPress={startRecording}
                onPressOut={stopRecording}
                activeOpacity={0.7}
                style={[
                  styles.recordBtn,
                  { backgroundColor: Colors.primary },
                  isRecording && {
                    backgroundColor: "#EF4444",
                    transform: [{ scale: 1.2 }],
                  },
                ]}
              >
                {isRecording ? (
                  <StopCircle size={36} color="#fff" />
                ) : (
                  <Mic size={36} color="#fff" />
                )}
              </TouchableOpacity>

              <Text
                style={{
                  color: Colors.text,
                  marginTop: 15,
                  fontWeight: "900",
                  fontSize: 12,
                  letterSpacing: 1,
                }}
              >
                HOLD BUTTON TO RECORD
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={() => handleOpenNote()}
            style={[
              styles.mainFab,
              { backgroundColor: Colors.primary, bottom: 20 + insets.bottom },
            ]}
          >
            <Plus size={32} color="#000" />
          </TouchableOpacity>
        </>
      )}

      {mainTab === "habits" && (
        <>
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
                source={require("@/assets/tomato_plant.json")}
                style={styles.levelLottie}
                autoPlay
                loop
                initialSegment={level.segments}
              />
            </View>

            <View
              style={{
                marginBottom: 20,
                backgroundColor: Colors.card,
                padding: 18,
                borderRadius: 16,
                borderLeftWidth: 4,
                borderLeftColor: Colors.primary,
              }}
            >
              <Text
                style={{
                  color: Colors.textMuted,
                  fontStyle: "italic",
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                "{dailyQuote.split(" - ")[0]}"
              </Text>
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 11,
                  fontWeight: "900",
                  marginTop: 10,
                  textAlign: "right",
                  letterSpacing: 0.5,
                }}
              >
                — {dailyQuote.split(" - ")[1].toUpperCase()}
              </Text>
            </View>

            {filteredHabits.length === 0 ? (
              <View style={[styles.empty, { marginTop: 60 }]}>
                <Activity size={80} color={Colors.primary} opacity={0.2} />
                <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                  {searchQuery
                    ? "No habits found matching search."
                    : "Master Your Routine."}
                </Text>
                <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
                  Small daily wins lead to big financial freedom. Start a habit
                  today.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => handleOpenHabitModal()}
                >
                  <Plus size={20} color="#000" />
                  <Text style={{ fontWeight: "bold", color: "#000" }}>
                    ADD HABIT
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredHabits.map((habit) => {
                const today = new Date();
                const todayYear = today.getFullYear();
                const todayMonthStr = String(today.getMonth() + 1).padStart(
                  2,
                  "0",
                );
                const todayDayNum = today.getDate();
                const daysInMonth = new Date(
                  todayYear,
                  today.getMonth() + 1,
                  0,
                ).getDate();
                const currentMonthPrefix = `${todayYear}-${todayMonthStr}-`;
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
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              marginTop: 2,
                            }}
                          >
                            <Text
                              style={{
                                color: Colors.textMuted,
                                fontSize: 10,
                                fontWeight: "800",
                                letterSpacing: 0.5,
                              }}
                            >
                              🔥 {getHabitStreak(habit.logs)} DAY STREAK
                            </Text>
                            {habit.reminderTime && (
                              <>
                                <View
                                  style={{
                                    width: 3,
                                    height: 3,
                                    borderRadius: 1.5,
                                    backgroundColor: Colors.textMuted,
                                    opacity: 0.5,
                                  }}
                                />
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <Bell size={10} color={Colors.primary} />
                                  <Text
                                    style={{
                                      color: Colors.primary,
                                      fontSize: 10,
                                      fontWeight: "900",
                                    }}
                                  >
                                    {habit.reminderTime}
                                  </Text>
                                </View>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 15,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => handleOpenHabitModal(habit)}
                        >
                          <Edit2 size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={async () => {
                            Alert.alert(
                              "Delete Habit",
                              "Remove this habit and its daily reminders?",
                              [
                                { text: "Keep" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: async () => {
                                    deleteHabit(habit.id);
                                    await cancelReminderNotification(habit.id);
                                    Haptics.notificationAsync(
                                      Haptics.NotificationFeedbackType.Warning,
                                    );
                                  },
                                },
                              ],
                            );
                          }}
                        >
                          <Trash2 size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.habitGrid}>
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${currentMonthPrefix}${day.toString().padStart(2, "0")}`;
                        const isDone = habit.logs.includes(dateStr);
                        const isToday = day === todayDayNum;
                        const isPast = day < todayDayNum;
                        const disabled = !isToday;

                        return (
                          <TouchableOpacity
                            key={day}
                            disabled={disabled}
                            style={[
                              styles.habitDay,
                              {
                                borderColor: isToday
                                  ? Colors.primary
                                  : Colors.border,
                              },
                              isToday &&
                                !isDone && {
                                  backgroundColor: Colors.primary + "15",
                                },
                              isDone && {
                                backgroundColor: habit.color,
                                borderColor: habit.color,
                              },
                            ]}
                            onPress={() => toggleHabitDay(habit, dateStr)}
                          >
                            {isDone ? (
                              <Text style={{ fontSize: 10 }}>😊</Text>
                            ) : isPast ? (
                              <Text style={{ fontSize: 10 }}>😵</Text>
                            ) : (
                              <Text
                                style={[
                                  styles.habitDayText,
                                  {
                                    color: isToday
                                      ? Colors.primary
                                      : Colors.textMuted,
                                  },
                                ]}
                              >
                                {day}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View
                      style={[
                        styles.habitFooter,
                        { flexDirection: "row", alignItems: "center" },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.habitStat,
                            { color: Colors.textMuted, marginBottom: 6 },
                          ]}
                        >
                          90-DAY MASTERY:{" "}
                          <Text style={{ color: habit.color }}>
                            {getHabitStreak(habit.logs)}
                          </Text>{" "}
                          / 90
                        </Text>
                        <View
                          style={{
                            width: "100%",
                            height: 6,
                            backgroundColor: Colors.border,
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              width: `${Math.min((getHabitStreak(habit.logs) / 90) * 100, 100)}%`,
                              height: "100%",
                              backgroundColor: habit.color,
                            }}
                          />
                        </View>
                      </View>
                      <View style={{ marginLeft: 20, alignItems: "flex-end" }}>
                        <Text
                          style={[
                            styles.habitStat,
                            { color: Colors.textMuted },
                          ]}
                        >
                          SCORE:{" "}
                          <Text style={{ color: habit.color, fontSize: 12 }}>
                            {
                              habit.logs.filter((l) =>
                                l.startsWith(currentMonthPrefix),
                              ).length
                            }
                          </Text>{" "}
                          / {daysInMonth}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => handleOpenHabitModal()}
            style={[
              styles.mainFab,
              { backgroundColor: Colors.primary, bottom: 20 + insets.bottom },
            ]}
          >
            <Plus size={32} color="#000" />
          </TouchableOpacity>
        </>
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[
              styles.modalContent,
              { backgroundColor: Colors.card, borderColor: Colors.border, width: "100%", height: "100%" },
            ]}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text
                    style={{
                      color: Colors.text,
                      fontSize: 24,
                      fontWeight: "900",
                      letterSpacing: -0.5,
                    }}
                  >
                    {editingTodoId ? "Edit Task" : "New Task"}
                  </Text>
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    Plan your next daily mission
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setIsModalVisible(false);
                    setEditingTodoId(null);
                    setTask("");
                  }}
                  style={[
                    styles.iconBtn,
                    { backgroundColor: Colors.background },
                  ]}
                >
                  <X color={Colors.text} size={20} />
                </TouchableOpacity>
              </View>

              <FlowBannerAd />

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.background,
                    color: Colors.text,
                    borderColor: Colors.border,
                    fontSize: 18,
                    padding: 20,
                    borderRadius: 20,
                    marginTop: 20,
                  },
                ]}
                placeholder="What needs to be done?"
                placeholderTextColor={Colors.textMuted}
                value={task}
                onChangeText={setTask}
                multiline
              />

              <View style={[styles.modalSubRow, { marginTop: 20 }]}>
                <TouchableOpacity
                  style={[
                    styles.modalInputBtn,
                    {
                      backgroundColor: Colors.background,
                      borderColor: Colors.border,
                      flex: 1,
                      height: 50,
                    },
                  ]}
                  onPress={() => setShowDate(true)}
                >
                  <Calendar size={16} color={Colors.primary} />
                  <Text
                    style={{
                      color: Colors.text,
                      fontSize: 13,
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
                      flex: 1,
                      height: 50,
                    },
                  ]}
                  onPress={() => setShowTime(true)}
                >
                  <Clock size={16} color={Colors.primary} />
                  <Text
                    style={{
                      color: Colors.text,
                      fontSize: 13,
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
                  display={Platform.OS === "android" ? "calendar" : "default"}
                  onChange={(event, d) => {
                    if (Platform.OS === "android") {
                      setShowDate(false);
                    }
                    if (event.type === "set" && d) {
                      const next = new Date(todoDate);
                      next.setFullYear(d.getFullYear());
                      next.setMonth(d.getMonth());
                      next.setDate(d.getDate());
                      setTodoDate(next);
                    }
                    if (Platform.OS === "ios") {
                      setShowDate(false);
                    }
                  }}
                />
              )}
              {showTime && (
                <DateTimePicker
                  value={todoDate}
                  mode="time"
                  display={Platform.OS === "android" ? "clock" : "default"}
                  is24Hour={false}
                  onChange={(event, d) => {
                    if (Platform.OS === "android") {
                      setShowTime(false);
                    }
                    if (event.type === "set" && d) {
                      const next = new Date(todoDate);
                      next.setHours(d.getHours());
                      next.setMinutes(d.getMinutes());
                      setTodoDate(next);
                    }
                    if (Platform.OS === "ios") {
                      setShowTime(false);
                    }
                  }}
                />
              )}

              <Text
                style={[
                  styles.label,
                  { color: Colors.textMuted, marginTop: 25 },
                ]}
              >
                ASSIGN CATEGORY
              </Text>
              <View style={[styles.catGrid, { marginBottom: 10 }]}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.catBtn,
                      cat === c.id && {
                        backgroundColor: c.color + "20",
                        borderColor: c.color,
                      },
                      { borderColor: Colors.border, flex: 1, height: 60 },
                    ]}
                    onPress={() => setCat(c.id as any)}
                  >
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                    <Text
                      style={{
                        color: cat === c.id ? c.color : Colors.textMuted,
                        fontSize: 11,
                        fontWeight: "900",
                        marginTop: 4,
                      }}
                    >
                      {c.label.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: 15 }}>
                <TouchableOpacity
                  style={[
                    styles.importantToggle,
                    {
                      backgroundColor: isStarred
                        ? Colors.primary + "15"
                        : Colors.background,
                      borderColor: isStarred ? Colors.primary : Colors.border,
                    },
                  ]}
                  onPress={() => setIsStarred(!isStarred)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={[
                        styles.starIconBox,
                        {
                          backgroundColor: isStarred
                            ? Colors.primary
                            : Colors.border,
                        },
                      ]}
                    >
                      <Star
                        size={18}
                        color={isStarred ? Colors.background : Colors.textMuted}
                        fill={isStarred ? Colors.background : "transparent"}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          color: Colors.text,
                          fontWeight: "900",
                          fontSize: 14,
                        }}
                      >
                        MARK AS IMPORTANT
                      </Text>
                      <Text
                        style={{
                          color: Colors.textMuted,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        Prioritize this mission
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.checkDot,
                      {
                        borderColor: isStarred ? Colors.primary : Colors.border,
                        backgroundColor: isStarred
                          ? Colors.primary
                          : "transparent",
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: Colors.primary, marginTop: 30 },
                ]}
                onPress={addTodo}
              >
                <Text
                  style={{
                    color: Colors.background,
                    fontSize: 18,
                    fontWeight: "900",
                  }}
                >
                  {editingTodoId ? "UPDATE MISSION" : "DEPLOY MISSION"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
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

            <FlowBannerAd />

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

              <View style={{ marginTop: 20 }}>
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    {
                      backgroundColor: isNotePinned
                        ? "rgba(0,0,0,0.8)"
                        : "transparent",
                      borderColor: "rgba(0,0,0,0.8)",
                      borderWidth: 2,
                      padding: 15,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    },
                  ]}
                  onPress={() => setIsNotePinned(!isNotePinned)}
                >
                  <Star
                    size={18}
                    color={isNotePinned ? "#FEFF9C" : "#000"}
                    fill={isNotePinned ? "#FEFF9C" : "transparent"}
                  />
                  <Text
                    style={{
                      color: isNotePinned ? "#FEFF9C" : "#000",
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {isNotePinned ? "Pinned to Top" : "Pin to Top"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Habit Modal */}
      <Modal visible={isHabitModalVisible} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[
              styles.modalContent,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 24,
                    fontWeight: "900",
                  }}
                >
                  {editingHabitId ? "Edit Habit" : "New Habit"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsHabitModalVisible(false);
                    setEditingHabitId(null);
                    setHName("");
                    setHTime("");
                  }}
                >
                  <X color={Colors.text} size={24} />
                </TouchableOpacity>
              </View>

              <FlowBannerAd />

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
                {Object.keys(HABIT_ICONS).map((iconName) => {
                  const Icon = HABIT_ICONS[iconName];
                  return (
                    <TouchableOpacity
                      key={iconName}
                      onPress={() => setHIcon(iconName)}
                      style={[
                        styles.catBtn,
                        hIcon === iconName && {
                          backgroundColor: hColor + "15",
                          borderColor: hColor,
                        },
                        { borderColor: Colors.border },
                      ]}
                    >
                      <Icon
                        size={20}
                        color={hIcon === iconName ? hColor : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: Colors.textMuted }]}>
                DAILY REMINDER
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  {
                    borderColor: Colors.border,
                    borderWidth: 1,
                    padding: 15,
                    borderRadius: 12,
                    marginTop: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  },
                ]}
                onPress={() => setShowHTime(true)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <Bell
                    size={20}
                    color={hTime ? Colors.primary : Colors.textMuted}
                  />
                  <Text
                    style={{
                      color: hTime ? Colors.text : Colors.textMuted,
                      fontWeight: "700",
                    }}
                  >
                    {hTime ? `Reminder: ${hTime}` : "No Daily Reminder"}
                  </Text>
                </View>
                {hTime && (
                  <TouchableOpacity onPress={() => setHTime("")}>
                    <X size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {showHTime && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === "android" ? "clock" : "default"}
                  onChange={(event, d) => {
                    if (Platform.OS === "android") {
                      setShowHTime(false);
                    }
                    if (event.type === "set" && d) {
                      const hours = d.getHours().toString().padStart(2, "0");
                      const minutes = d
                        .getMinutes()
                        .toString()
                        .padStart(2, "0");
                      setHTime(`${hours}:${minutes}`);
                    }
                    if (Platform.OS === "ios") {
                      setShowHTime(false);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: Colors.primary, marginTop: 30 },
                ]}
                onPress={handleCreateHabit}
              >
                <Text
                  style={{
                    color: Colors.background,
                    fontSize: 18,
                    fontWeight: "900",
                  }}
                >
                  {editingHabitId ? "Update Evolution" : "Start Evolution"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={isVoiceModalVisible} animationType="fade" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%", alignItems: "center" }}
          >
            <View
              style={[
                styles.premiumCard,
                { backgroundColor: Colors.card, borderColor: Colors.border },
              ]}
            >
              {/* Decorative Accent */}
              <View
                style={[
                  styles.cardTopAccent,
                  { backgroundColor: Colors.primary },
                ]}
              />

              <View style={styles.modalHeader}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: Colors.primary + "20" },
                    ]}
                  >
                    <Mic size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { color: Colors.text }]}>
                      Mission Captured
                    </Text>
                    <Text
                      style={{
                        color: Colors.textMuted,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Review and schedule your recording
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setIsVoiceModalVisible(false);
                    setEditingVnId(null);
                    setVnTitle("");
                    if (!editingVnId) setRecordedUri(null);
                  }}
                  style={styles.closeBtn}
                >
                  <X size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <FlowBannerAd />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={styles.previewSection}>
                  <View
                    style={[
                      styles.durationBadge,
                      {
                        position: "relative",
                        bottom: 0,
                        marginBottom: 12,
                        backgroundColor: Colors.primary + "20",
                        borderColor: Colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.durationText, { color: Colors.primary }]}
                    >
                      {isPlayingId === "preview"
                        ? `${formatTime(Math.floor(playbackPosition / 1000))} / ${formatTime(Math.floor(playbackDuration / 1000))}`
                        : formatTime(recordingDuration)}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: "80%",
                      height: 4,
                      backgroundColor: Colors.border,
                      borderRadius: 2,
                      marginBottom: 20,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width:
                          isPlayingId === "preview" && playbackDuration > 0
                            ? `${(playbackPosition / playbackDuration) * 100}%`
                            : "0%",
                        height: "100%",
                        backgroundColor: Colors.primary,
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      recordedUri && playVoiceNote(recordedUri, "preview")
                    }
                    style={[
                      styles.playBtnLarge,
                      { backgroundColor: Colors.primary },
                    ]}
                    activeOpacity={0.8}
                  >
                    {isPlayingId === "preview" ? (
                      <Pause size={32} color="#000" fill="#000" />
                    ) : (
                      <Play size={32} color="#000" fill="#000" />
                    )}
                  </TouchableOpacity>
                  <Text
                    style={{
                      color: Colors.text,
                      marginTop: 15,
                      fontWeight: "800",
                      fontSize: 13,
                    }}
                  >
                    AUDITORY MISSION PREVIEW
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.inputLabel, { color: Colors.textMuted }]}
                  >
                    MISSION TITLE
                  </Text>
                  <TextInput
                    style={[
                      styles.premiumInput,
                      {
                        backgroundColor: Colors.background,
                        color: Colors.text,
                        borderColor: Colors.border,
                      },
                    ]}
                    placeholder="Give your mission a name..."
                    placeholderTextColor={Colors.textMuted + "80"}
                    value={vnTitle}
                    onChangeText={setVnTitle}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.inputLabel, { color: Colors.textMuted }]}
                  >
                    REMINDER SCHEDULE
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setShowVnDate(true)}
                      style={[
                        styles.premiumPicker,
                        {
                          backgroundColor: Colors.background,
                          borderColor: Colors.border,
                        },
                      ]}
                    >
                      <Calendar size={18} color={Colors.primary} />
                      <Text
                        style={{
                          color: Colors.text,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {vnDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowVnTime(true)}
                      style={[
                        styles.premiumPicker,
                        {
                          backgroundColor: Colors.background,
                          borderColor: Colors.border,
                        },
                      ]}
                    >
                      <Clock size={18} color={Colors.primary} />
                      <Text
                        style={{
                          color: Colors.text,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {vnDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.mainActionBtn,
                    { backgroundColor: Colors.primary },
                  ]}
                  onPress={handleSaveVoiceNote}
                  activeOpacity={0.9}
                >
                  <CheckCircle2 size={22} color="#000" />
                  <Text style={styles.mainActionText}>SAVE VOICE MISSION</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsVoiceModalVisible(false);
                    setEditingVnId(null);
                    setVnTitle("");
                    if (!editingVnId) setRecordedUri(null);
                  }}
                >
                  <Text style={{ color: Colors.textMuted, fontWeight: "700" }}>
                    DISCARD RECORDING
                  </Text>
                </TouchableOpacity>

              {showVnDate && (
                <DateTimePicker
                  value={vnDate}
                  mode="date"
                  display={Platform.OS === "android" ? "default" : "default"}
                  onChange={(event, d) => {
                    if (Platform.OS === "android") {
                      setShowVnDate(false);
                    }
                    if (event.type === "set" && d) {
                      const next = new Date(vnDate);
                      next.setFullYear(d.getFullYear());
                      next.setMonth(d.getMonth());
                      next.setDate(d.getDate());
                      setVnDate(next);
                    }
                    if (Platform.OS === "ios") {
                      setShowVnDate(false);
                    }
                  }}
                />
              )}
              {showVnTime && (
                <DateTimePicker
                  value={vnDate}
                  mode="time"
                  display={Platform.OS === "android" ? "clock" : "default"}
                  is24Hour={false}
                  onChange={(event, d) => {
                    if (Platform.OS === "android") {
                      setShowVnTime(false);
                    }
                    if (event.type === "set" && d) {
                      const next = new Date(vnDate);
                      next.setHours(d.getHours());
                      next.setMinutes(d.getMinutes());
                      setVnDate(next);
                    }
                    if (Platform.OS === "ios") {
                      setShowVnTime(false);
                    }
                  }}
                />
              )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
    padding: 2,
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
  content: { padding: 20, paddingBottom: 100 },
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
    width: (Dimensions.get("window").width - 65) / 2,
    padding: 16,
    paddingTop: 24,
    borderRadius: 2,
    minHeight: 180,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10,
    overflow: "visible",
  },
  pushPinContainer: {
    position: "absolute",
    top: -10,
    left: "50%",
    marginLeft: -6,
    alignItems: "center",
    zIndex: 10,
  },
  pushPinHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  pushPinShine: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.5)",
    position: "absolute",
    top: 2,
    left: 3,
  },
  pushPinNeedle: {
    width: 1.5,
    height: 10,
    backgroundColor: "#64748B",
    marginTop: -2,
  },
  cornerFold: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderRightWidth: 25,
    borderTopWidth: 25,
    borderRightColor: "transparent",
    borderTopColor: "transparent",
  },
  cornerFoldInner: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 25,
    height: 25,
    borderTopLeftRadius: 10,
  },
  noteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noteTitle: { fontSize: 15, fontWeight: "900", flex: 1, letterSpacing: -0.3 },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 2,
    flex: 1,
  },
  noteDate: {
    fontSize: 9,
    fontWeight: "800",
    marginTop: 10,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
  modalTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  premiumCard: {
    width: "92%",
    maxHeight: "85%",
    borderRadius: 32,
    borderWidth: 1.5,
    padding: 24,
    paddingTop: 30,
    overflow: "hidden",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  cardTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewSection: {
    alignItems: "center",
    marginVertical: 30,
  },
  durationBadge: {
    position: "absolute",
    bottom: -10,
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  durationText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },
  formGroup: {
    marginBottom: 20,
  },
  premiumInput: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    fontSize: 16,
    fontWeight: "700",
  },
  premiumPicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  mainActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 64,
    borderRadius: 24,
    marginTop: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mainActionText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    alignItems: "center",
    padding: 15,
    marginTop: 5,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1.5,
    opacity: 0.6,
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
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  adPlaceholder: {
    height: 60,
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 5,
    opacity: 0.6,
  },
  adLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
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
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  mainFab: {
    position: "absolute",
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  batchBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  batchBtnText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#000",
  },
  selectedAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  selectionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  starFilterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  importantToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    marginTop: 10,
  },
  starIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 12,
  },
  voiceCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtnLarge: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  recordControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  recordBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  recordingVisual: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "transparent",
    marginBottom: 15,
    alignItems: "center",
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  progressBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: -1,
  },
});
