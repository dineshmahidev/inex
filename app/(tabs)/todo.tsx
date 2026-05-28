import { FlowBannerAd } from "@/components/FlowBannerAd";
import { useDatabase, Habit } from "@/hooks/useDatabase";
import { interstitialAdManager } from "@/utils/ads";
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
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import {
  Activity,
  Bell,
  Book,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Coffee,
  Download,
  Dumbbell,
  Edit2,
  FileText,
  Heading,
  Heart,
  LayoutGrid,
  List,
  Mic,
  Palette,
  Pause,
  Pin,
  Play,
  Plus,
  Search,
  Share2,
  ShoppingCart,
  Smile,
  Sparkles,
  Star,
  StickyNote,
  StopCircle,
  Target,
  Trash2,
  Trophy,
  User,
  Wallet,
  X,
  Zap
} from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

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
  time?: string;
  category: string;
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

const SwipeToMark = ({
  isDone,
  onToggle,
  color,
}: {
  isDone: boolean;
  onToggle: () => void;
  color: string;
}) => {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const handleWidth = 42;
  const padding = 3;
  const maxDrag = containerWidth ? containerWidth - handleWidth - 2 * padding - 5 : 0;

  const panX = React.useRef(new Animated.Value(0)).current;
  const isDragging = React.useRef(false);

  // Keep state mutable reference to avoid PanResponder closure captures
  const latestState = React.useRef({ isDone, maxDrag, containerWidth });
  React.useEffect(() => {
    latestState.current = { isDone, maxDrag, containerWidth };
  }, [isDone, maxDrag, containerWidth]);

  // Synchronize panX with isDone state when not dragging
  React.useEffect(() => {
    if (containerWidth > 0 && !isDragging.current) {
      Animated.spring(panX, {
        toValue: isDone ? maxDrag : 0,
        useNativeDriver: false,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [isDone, containerWidth, maxDrag]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes, don't steal vertical scrolling
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5 &&
          Math.abs(gestureState.dx) > 10
        );
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        panX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const { maxDrag: latestMax, containerWidth: latestWidth, isDone: latestDone } = latestState.current;
        if (!latestWidth) return;
        let newX = latestDone ? latestMax + gestureState.dx : gestureState.dx;
        // Clamp between 0 and maxDrag
        newX = Math.max(0, Math.min(latestMax, newX));
        panX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        const { maxDrag: latestMax, containerWidth: latestWidth, isDone: latestDone } = latestState.current;
        if (!latestWidth) return;

        const currentVal = latestDone ? latestMax + gestureState.dx : gestureState.dx;

        if (!latestDone) {
          // If not completed and swiped right past 70%
          if (currentVal > latestMax * 0.7) {
            // Success: animate to end and toggle
            Animated.timing(panX, {
              toValue: latestMax,
              duration: 150,
              useNativeDriver: false,
            }).start(() => {
              onToggle();
            });
          } else {
            // Snap back
            Animated.spring(panX, {
              toValue: 0,
              useNativeDriver: false,
              tension: 100,
              friction: 10,
            }).start();
          }
        } else {
          // If completed and swiped left past 70%
          if (currentVal < latestMax * 0.3) {
            // Success: animate to 0 and toggle (unmark)
            Animated.timing(panX, {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }).start(() => {
              onToggle();
            });
          } else {
            // Snap back to completed position
            Animated.spring(panX, {
              toValue: latestMax,
              useNativeDriver: false,
              tension: 100,
              friction: 10,
            }).start();
          }
        }
      },
    })
  ).current;

  // Slide percentage for background track gradient/fill color
  const progressPercent = panX.interpolate({
    inputRange: [0, Math.max(1, maxDrag)],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{
        height: 50,
        backgroundColor: '#ffffff',
        borderWidth: 2.5,
        borderColor: '#000000',
        borderRadius: 25,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 2,
      }}
    >
      {/* Background Active Fill (Smooth dynamic slider fill) */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: progressPercent,
          backgroundColor: color + '30',
        }}
      />

      {/* Guide text inside track */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          pointerEvents: 'none',
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '900',
            color: isDone ? '#111827' : '#4B5563',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {isDone ? '🎉 DONE FOR TODAY (SWIPE LEFT TO UNDO)' : '👉 SWIPE TO MARK DONE'}
        </Text>
      </View>

      {/* Sliding Handle */}
      <Animated.View
        {...panResponder.panHandlers}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        style={{
          width: handleWidth,
          height: handleWidth,
          borderRadius: handleWidth / 2,
          backgroundColor: isDone ? '#000000' : color,
          borderWidth: 2,
          borderColor: '#000000',
          position: 'absolute',
          left: padding,
          transform: [{ translateX: panX }],
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 3,
        }}
      >
        {isDone ? (
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={3.5} />
        ) : (
          <ChevronRight size={20} color="#000000" strokeWidth={3.5} />
        )}
      </Animated.View>
    </View>
  );
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

const getNotePreview = (text: string) => {
  if (!text) return "";
  try {
    if (text.startsWith('{"blocks":')) {
      const parsed = JSON.parse(text);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        return parsed.blocks
          .map((b: any) => {
            if (b.type === 'paragraph') return b.content;
            if (b.type === 'headline') return b.content;
            if (b.type === 'todo') return `[${b.checked ? '✓' : ' '}] ${b.content}`;
            if (b.type === 'bullet') return `• ${b.content}`;
            if (b.type === 'image') return `[🖼️ Image]`;
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }
    }
  } catch (e) { }
  return text;
};

export default function TodoScreen() {
  const shareCardRef = React.useRef<any>(null);
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

  const params = useLocalSearchParams<{ tab?: string }>();
  const { t } = useLanguage();

  const [mainTab, setMainTab] = useState<
    "todos" | "notes" | "habits" | "voice"
  >("todos");

  React.useEffect(() => {
    if (params?.tab && ["todos", "notes", "habits", "voice"].includes(params.tab)) {
      setMainTab(params.tab as any);
    }
  }, [params?.tab]);
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
  const [noteBlocks, setNoteBlocks] = useState<any[]>([
    { id: '1', type: 'paragraph', content: '' }
  ]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isNoteEditing, setIsNoteEditing] = useState(false);

  const addBlock = async (type: 'headline' | 'paragraph' | 'todo' | 'bullet' | 'image') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    if (type === 'image') {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Camera roll access is needed to upload images.");
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!pickerResult.canceled && pickerResult.assets?.[0]?.uri) {
        setNoteBlocks((prev) => [
          ...prev,
          { id, type, content: '', uri: pickerResult.assets[0].uri },
        ]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      setNoteBlocks((prev) => [
        ...prev,
        { id, type, content: '', checked: false },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const updateBlock = (id: string, content: string) => {
    setNoteBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b)),
    );
  };

  const toggleTodoBlock = (id: string) => {
    setNoteBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, checked: !b.checked } : b)),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const removeBlock = (id: string) => {
    setNoteBlocks((prev) => prev.filter((b) => b.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pickImageForBlock = async (id: string) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera roll access is needed to upload images.");
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!pickerResult.canceled && pickerResult.assets?.[0]?.uri) {
      setNoteBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, uri: pickerResult.assets[0].uri } : b)),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Habit Form State
  const [habitSelectedDate, setHabitSelectedDate] = useState<Date>(new Date());
  const [habitSubTab, setHabitSubTab] = useState<string>("All");
  const [habitCalendarDate, setHabitCalendarDate] = useState<Date>(new Date());
  const [progressHabit, setProgressHabit] = useState<any>(null);
  const [isHabitModalVisible, setIsHabitModalVisible] = useState(false);
  const [hName, setHName] = useState("");
  const [hColor, setHColor] = useState("#FF7A00");
  const [hIcon, setHIcon] = useState("🔥");
  const [hChallenge, setHChallenge] = useState("Regular");
  const [hTime, setHTime] = useState("");
  const [showHTime, setShowHTime] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Share Progress Card States
  const [sharingHabit, setSharingHabit] = useState<any>(null);
  const [shareUserName, setShareUserName] = useState("Challenger");

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
    let interval: any;
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

  const exportShareCard = async () => {
    if (!sharingHabit) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Capture the React Native View directly as a pixel-perfect PNG!
      const uri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1.0,
      });

      // Share the PNG image directly using expo-sharing!
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${sharingHabit.name} Progress`,
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Export Failed", "Unable to capture and share progress card image.");
    }
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

    try {
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
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission && todoDate.getTime() > Date.now()) {
          await scheduleTodoNotification(todoId, task, todoDate);
        }
        interstitialAdManager.showAd();
      }

      setTask("");
      setTodoDate(new Date(Date.now() + 5 * 60000));
      setIsStarred(false);
      setEditingTodoId(null);
      setIsModalVisible(false);
    } catch (e) {
      console.error("Failed to save todo", e);
    } finally {
      setIsSubmitting(false);
    }
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
      setNoteColor(note.color || NOTE_COLORS[0]);
      setIsNotePinned(note.pinned || false);
      setIsNoteEditing(false);

      try {
        if (note.text && note.text.startsWith('{"blocks":')) {
          const parsed = JSON.parse(note.text);
          setNoteBlocks(parsed.blocks || []);
          setNoteText("");
        } else {
          setNoteBlocks([{ id: '1', type: 'paragraph', content: note.text || "" }]);
          setNoteText(note.text || "");
        }
      } catch (e) {
        setNoteBlocks([{ id: '1', type: 'paragraph', content: note.text || "" }]);
        setNoteText(note.text || "");
      }
    } else {
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteText("");
      setNoteBlocks([{ id: Date.now().toString(), type: 'paragraph', content: '' }]);
      setNoteColor(NOTE_COLORS[0]);
      setIsNotePinned(false);
      setIsNoteEditing(true);
    }
    setShowColorPicker(false);
    setIsNoteModalVisible(true);
  };

  const handleAddNote = async () => {
    const hasContent = noteBlocks.some(b => (b.content && b.content.trim().length > 0) || b.uri);
    if (isSubmitting || !noteTitle || !hasContent) return;
    setIsSubmitting(true);

    try {
      const serializedText = JSON.stringify({ blocks: noteBlocks });

      if (editingNoteId) {
        await updateNote(editingNoteId, {
          title: noteTitle,
          text: serializedText,
          color: noteColor,
          pinned: isNotePinned,
        });
        interstitialAdManager.showAd();
      } else {
        await addNote({
          title: noteTitle,
          text: serializedText,
          color: noteColor,
          date: new Date().toLocaleDateString(),
          pinned: isNotePinned,
        });
        interstitialAdManager.showAd();
      }

      setNoteTitle("");
      setNoteText("");
      setNoteBlocks([{ id: Date.now().toString(), type: 'paragraph', content: '' }]);
      setEditingNoteId(null);
      setShowColorPicker(false);
      setIsNoteModalVisible(false);
    } catch (e) {
      console.error("Failed to save note", e);
    } finally {
      setIsSubmitting(false);
    }
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

  const changeHabitMonth = (delta: number) => {
    const newDate = new Date(habitCalendarDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setHabitCalendarDate(newDate);
  };

  const handleCreateHabit = async () => {
    if (isSubmitting || !hName) return;
    setIsSubmitting(true);

    try {
      if (editingHabitId) {
        await updateHabit(editingHabitId, {
          name: hName,
          color: hColor,
          icon: hIcon,
          reminderTime: hTime || undefined,
          challenge: hChallenge !== "Regular" ? hChallenge : undefined,
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
          challenge: hChallenge !== "Regular" ? hChallenge : undefined,
        });
        if (hTime) {
          const hasPermission = await requestNotificationPermissions();
          if (hasPermission) {
            await scheduleHabitNotification(id, hName, hTime);
          }
        }
        interstitialAdManager.showAd();
      }

      setHName("");
      setHTime("");
      setEditingHabitId(null);
      setIsHabitModalVisible(false);
    } catch (e) {
      console.error("Failed to save habit", e);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (habitSubTab === "Missed") {
      const dateStr = `${habitSelectedDate.getFullYear()}-${String(habitSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(habitSelectedDate.getDate()).padStart(2, '0')}`;
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      f = f.filter(h => {
        const isLogged = h.logs.includes(dateStr);
        const isPast = habitSelectedDate.getTime() < new Date(todayStr).getTime();
        return !isLogged && isPast;
      });
    } else if (habitSubTab !== "All") {
      f = f.filter(h => h.name === habitSubTab);
    }
    return f;
  }, [habits, searchQuery, habitSubTab, habitSelectedDate]);

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

        // Show Google Mobile Ads Interstitial Ad on new Voice Note entry
        interstitialAdManager.showAd();
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

        <View style={{ flexDirection: "row", gap: 8 }}>
          {mainTab === "todos" && isSelectionMode && (
            <>
              <TouchableOpacity
                style={[styles.litAddBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  if (selectedIds.length === 0) return;
                  Alert.alert("Delete Tasks?", `${selectedIds.length} task(s) will be removed.`, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete All",
                      style: "destructive",
                      onPress: async () => {
                        const updated = todos.filter((t) => !selectedIds.includes(t.id));
                        await saveTodos(updated);
                        selectedIds.forEach(id => cancelReminderNotification(id));
                        setSelectedIds([]);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      },
                    },
                  ]);
                }}
              >
                <Trash2 color="#FFF" size={18} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.litAddBtn, { backgroundColor: Colors.card }]}
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
                style={[styles.litAddBtn, { backgroundColor: Colors.card }]}
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
            {t.todos.toUpperCase()}
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
            {t.habits.toUpperCase()}
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
            {t.notes.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {mainTab === "todos" && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.litSearchBox,
                {
                  backgroundColor: Colors.card,
                  flex: 1,
                },
              ]}
            >
              <Search size={18} color={Colors.primary} strokeWidth={2.5} />
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
                  backgroundColor: Colors.card,
                },
              ]}
              onPress={() =>
                setSelectedTab(selectedTab === "starred" ? "all" : "starred")
              }
            >
              <Star
                size={20}
                color={
                  selectedTab === "starred" ? Colors.primary : Colors.textMuted
                }
                fill={
                  selectedTab === "starred" ? Colors.primary : "transparent"
                }
              />
            </TouchableOpacity>
          </View>

          <View style={styles.tabScroll}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
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
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", shadowColor: "#171717", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <LayoutGrid size={36} color={Colors.textMuted} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: Colors.text }]}>All clear!</Text>
                <Text style={[styles.emptySub, { color: Colors.textMuted }]}>No tasks match your current filter. Add a new task or change the filter.</Text>
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
                const isToday =
                  item.reminderDate &&
                  new Date(item.reminderDate).toDateString() === new Date().toDateString();

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleTodoPress(item)}
                    onLongPress={() => toggleSelection(item.id)}
                    activeOpacity={0.9}
                    style={[
                      styles.litCard,
                      {
                        backgroundColor:
                          isSelectionMode && selectedIds.includes(item.id)
                            ? Colors.primary
                            : Colors.card,
                        opacity: item.completed && !isSelectionMode ? 0.55 : 1,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      {isSelectionMode ? (
                        <View style={styles.litCheckContainer}>
                          <View
                            style={[
                              styles.selectionCircle,
                              {
                                backgroundColor: selectedIds.includes(item.id)
                                  ? "#171717"
                                  : "transparent",
                                borderColor: selectedIds.includes(item.id)
                                  ? "#171717"
                                  : "#d4d4d4",
                              },
                            ]}
                          >
                            {selectedIds.includes(item.id) && (
                              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "900" }}>✓</Text>
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
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <View style={{
                            width: 26, height: 26, borderRadius: 13,
                            backgroundColor: item.completed ? Colors.primary : "transparent",
                            borderWidth: item.completed ? 0 : 2,
                            borderColor: "#d4d4d4",
                            justifyContent: "center", alignItems: "center",
                          }}>
                            {item.completed && (
                              <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "900" }}>✓</Text>
                            )}
                          </View>
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
                            numberOfLines={2}
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
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Star
                              size={15}
                              color={
                                item.starred
                                  ? selectedIds.includes(item.id)
                                    ? "#000"
                                    : "#eab308"
                                  : selectedIds.includes(item.id)
                                    ? "rgba(0,0,0,0.3)"
                                    : "#d4d4d4"
                              }
                              fill={
                                item.starred
                                  ? selectedIds.includes(item.id)
                                    ? "#000"
                                    : "#eab308"
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
                                backgroundColor: catColor + "15",
                              },
                            ]}
                          >
                            <CategoryIcon size={9} color={catColor} />
                            <Text style={[styles.litTagText, { color: catColor }]}>
                              {item.category.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.dot} />
                          <Text style={{
                            color: isOverdue ? "#EF4444" : "#a3a3a3",
                            fontSize: 10, fontWeight: "700",
                          }}>
                            {isOverdue ? "OVERDUE" : isToday ? item.time : item.date || "Today"}
                          </Text>
                        </View>
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
                { backgroundColor: Colors.primary, bottom: 150 },
              ]}
              activeOpacity={0.85}
            >
              <Plus size={28} color="#FFFFFF" strokeWidth={3} />
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
                  <Plus size={20} color="#FFF" />
                  <Text style={{ fontWeight: "bold", color: "#FFF" }}>
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
                        {getNotePreview(note.text)}
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
              { backgroundColor: Colors.primary, bottom: 160 },
            ]}
          >
            <Plus size={28} color="#FFF" strokeWidth={3} />
          </TouchableOpacity>
        </>
      )}

      {mainTab === "habits" && (
        <>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginTop: 15, marginBottom: 10 }}
          >
            {[
              { id: "All", label: "All", emoji: "📋" },
              ...habits.map(h => ({ id: h.name, label: h.name || "Habit", emoji: h.icon || "🔥" })),
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.litTab,
                  {
                    backgroundColor:
                      habitSubTab === tab.id ? Colors.primary : Colors.card,
                    borderColor:
                      habitSubTab === tab.id ? Colors.primary : Colors.border,
                  },
                ]}
                onPress={() => setHabitSubTab(tab.id)}
              >
                <Text
                  style={[
                    styles.litTabText,
                    {
                      color: habitSubTab === tab.id ? "black" : Colors.textMuted,
                    },
                  ]}
                >
                  {tab.emoji} {tab.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 180 }}
          >
            {habitSubTab === "All" ? (
              habits.length === 0 ? (
                <View style={[styles.empty, { marginTop: 60 }]}>
                  <Activity size={80} color={Colors.primary} opacity={0.2} />
                  <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                    No habits created yet.
                  </Text>
                  <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
                    Start tracking your habits to see them here!
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => handleOpenHabitModal()}
                  >
                    <Plus size={20} color="#FFF" />
                    <Text style={{ fontWeight: "bold", color: "#FFF" }}>
                      ADD HABIT
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                habits.map((habit, idx) => {
                  const today = new Date();
                  const todayYear = today.getFullYear();
                  const todayMonthStr = String(today.getMonth() + 1).padStart(2, "0");
                  const daysInMonth = new Date(todayYear, today.getMonth() + 1, 0).getDate();
                  const currentMonthPrefix = `${todayYear}-${todayMonthStr}-`;
                  const completedDays = habit.logs.filter((l) => l.startsWith(currentMonthPrefix)).length;
                  const bgColors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FF7A00", "#34D399", "#F472B6", "#60A5FA"];
                  const bg = bgColors[idx % bgColors.length];
                  const challengeDaysVal = parseChallengeDays(habit.challenge);
                  const isChallenge = challengeDaysVal !== null;
                  const challengeDays = isChallenge ? challengeDaysVal : daysInMonth;
                  const completedCount = isChallenge ? habit.logs.length : completedDays;
                  const pct = daysInMonth > 0 ? Math.min((completedDays / daysInMonth) * 100, 100) : 0;
                  const todayDateStr = `${todayYear}-${todayMonthStr}-${String(today.getDate()).padStart(2, "0")}`;
                  const isDoneToday = habit.logs.includes(todayDateStr);

                  return (
                    <View
                      key={habit.id}
                      style={{
                        backgroundColor: bg,
                        borderWidth: 2.5,
                        borderColor: '#000',
                        padding: 18,
                        width: '100%',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                        marginBottom: 4,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setHabitSubTab(habit.name)}
                        activeOpacity={0.85}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                          <View style={{ width: 44, height: 44, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 24 }}>{habit.icon || "🔥"}</Text>
                          </View>
                          <Text style={{ color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5, flex: 1 }} numberOfLines={2}>{habit.name.toUpperCase()}</Text>
                        </View>
                        <Text style={{ color: '#000', fontSize: 12, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 }}>{completedCount}/{challengeDays} DAYS COMPLETED</Text>
                      </TouchableOpacity>

                      <View style={{ marginTop: 6 }}>
                        <SwipeToMark
                          isDone={isDoneToday}
                          onToggle={() => {
                            toggleHabitDay(habit, todayDateStr);
                            Haptics.notificationAsync(
                              isDoneToday
                                ? Haptics.NotificationFeedbackType.Warning
                                : Haptics.NotificationFeedbackType.Success
                            );
                          }}
                          color={bg}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setSharingHabit(habit);
                          setShareUserName(settings.userName || "Challenger");
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          marginTop: 12,
                          backgroundColor: '#ffffff',
                          borderWidth: 2,
                          borderColor: '#000000',
                          borderRadius: 14,
                          height: 40,
                          shadowColor: '#000000',
                          shadowOffset: { width: 2, height: 2 },
                          shadowOpacity: 1,
                          shadowRadius: 0,
                          elevation: 1,
                        }}
                      >
                        <Share2 size={16} color="#000000" strokeWidth={3} />
                        <Text style={{ color: '#000000', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>SHARE PROGRESS</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )
            ) : (
              filteredHabits.length === 0 ? (
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
                    <Plus size={20} color="#FFF" />
                    <Text style={{ fontWeight: "bold", color: "#FFF" }}>
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

                  const calYear = habitCalendarDate.getFullYear();
                  const calMonth = habitCalendarDate.getMonth();
                  const calMonthStr = String(calMonth + 1).padStart(2, "0");
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();

                  const currentMonthPrefix = `${calYear}-${calMonthStr}-`;
                  const Icon = HABIT_ICONS[habit.icon] || Zap;
                  const challengeDaysVal = parseChallengeDays(habit.challenge);
                  const isChallenge = challengeDaysVal !== null;
                  const challengeDays = isChallenge ? challengeDaysVal : 90;
                  const challengeLabel = isChallenge ? `${challengeDays}-DAY CHALLENGE` : "90-DAY MASTERY";
                  const scoreNumerator = isChallenge ? habit.logs.length : habit.logs.filter((l) => l.startsWith(currentMonthPrefix)).length;
                  const scoreDenominator = isChallenge ? challengeDays : daysInMonth;

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
                            {Icon === Zap && habit.icon && !HABIT_ICONS[habit.icon] ? (
                              <Text style={{ fontSize: 18 }}>{habit.icon}</Text>
                            ) : (
                              <Icon size={18} color={habit.color} />
                            )}
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
                              {habit.challenge && (
                                <Text
                                  style={{
                                    color: Colors.primary,
                                    fontSize: 10,
                                    fontWeight: "900",
                                    letterSpacing: 0.5,
                                    backgroundColor: Colors.primary + "20",
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 8,
                                  }}
                                >
                                  {habit.challenge.toUpperCase()}
                                </Text>
                              )}
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

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, marginTop: 10, paddingHorizontal: 5 }}>
                        <TouchableOpacity onPress={() => changeHabitMonth(-1)}>
                          <ChevronLeft size={20} color={Colors.text} strokeWidth={3} />
                        </TouchableOpacity>
                        <Text style={{ fontWeight: "900", fontSize: 14, color: Colors.text, letterSpacing: 1 }}>
                          {habitCalendarDate.toLocaleString("default", { month: "long" }).toUpperCase()} {calYear}
                        </Text>
                        <TouchableOpacity onPress={() => changeHabitMonth(1)}>
                          <ChevronRight size={20} color={Colors.text} strokeWidth={3} />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: "row", marginBottom: 5 }}>
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                          <Text key={i} style={{ width: "14.285%", textAlign: "center", fontSize: 10, fontWeight: "900", color: Colors.textMuted }}>{d}</Text>
                        ))}
                      </View>

                      <View style={styles.habitGrid}>
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                          <View key={`empty-${i}`} style={styles.habitDay} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentMonthPrefix}${day.toString().padStart(2, "0")}`;
                          const isDone = habit.logs.includes(dateStr);
                          const isToday = day === todayDayNum && calYear === todayYear && calMonth === today.getMonth();
                          const isPast = (calYear < todayYear) || (calYear === todayYear && calMonth < today.getMonth()) || (calYear === todayYear && calMonth === today.getMonth() && day < todayDayNum);
                          const disabled = !isToday;

                          return (
                            <TouchableOpacity
                              key={day}
                              disabled={disabled}
                              style={[
                                styles.habitDay,
                                {
                                  borderColor: "#171717",
                                },
                                isToday &&
                                !isDone && {
                                  backgroundColor: Colors.primary + "30",
                                },
                                isDone && {
                                  backgroundColor: habit.color,
                                  borderColor: "#171717",
                                },
                              ]}
                              onPress={() => toggleHabitDay(habit, dateStr)}
                            >
                              <Text
                                style={[
                                  styles.habitDayText,
                                  {
                                    color: isDone ? "#fff" : isToday ? Colors.primary : Colors.textMuted,
                                  },
                                ]}
                              >
                                {day}{isDone ? " ✓" : ""}
                              </Text>
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
                            {challengeLabel.toUpperCase()}:{" "}
                            <Text style={{ color: habit.color }}>
                              {getHabitStreak(habit.logs)}
                            </Text>{" "}
                            / {challengeDays}
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
                                width: `${Math.min((getHabitStreak(habit.logs) / challengeDays) * 100, 100)}%`,
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
                              {scoreNumerator}
                            </Text>{" "}
                            / {scoreDenominator}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setSharingHabit(habit);
                          setShareUserName(settings.userName || "Challenger");
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          marginTop: 15,
                          backgroundColor: Colors.primary,
                          borderWidth: 2.5,
                          borderColor: '#171717',
                          borderRadius: 18,
                          height: 48,
                          shadowColor: '#171717',
                          shadowOffset: { width: 3, height: 3 },
                          shadowOpacity: 1,
                          shadowRadius: 0,
                          elevation: 2,
                        }}
                      >
                        <Share2 size={18} color="#000000" strokeWidth={3} />
                        <Text style={{ color: '#000000', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>SHARE PROGRESS</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => handleOpenHabitModal()}
            style={[
              styles.mainFab,
              { backgroundColor: Colors.primary, bottom: 160 },
            ]}
          >
            <Plus size={28} color="#FFF" strokeWidth={3} />
          </TouchableOpacity>
        </>
      )}


      <Modal visible={!!progressHabit} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden', backgroundColor: Colors.card }]}>
            <View style={{
              backgroundColor: progressHabit?.color || Colors.primary,
              padding: 20,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderColor: '#171717'
            }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 }}>{progressHabit?.name.toUpperCase()}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', marginTop: 5 }}>MONTHLY PROGRESS</Text>
            </View>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {progressHabit && Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isDone = progressHabit.logs.includes(dateStr);
                  const isToday = day === new Date().getDate();
                  const isPast = day < new Date().getDate();

                  return (
                    <View key={day} style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isDone ? progressHabit.color : (isPast ? Colors.border : 'transparent'),
                      borderWidth: 2,
                      borderColor: isDone ? '#171717' : Colors.border,
                      shadowColor: "#000",
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: isDone ? 1 : 0,
                      shadowRadius: 0,
                    }}>
                      <Text style={{
                        color: isDone ? '#fff' : (isPast ? Colors.textMuted : Colors.text),
                        fontWeight: '900',
                        fontSize: 14
                      }}>{day}</Text>
                    </View>
                  )
                })}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, paddingHorizontal: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: '800' }}>TOTAL</Text>
                  <Text style={{ color: Colors.text, fontSize: 24, fontWeight: '900' }}>
                    {progressHabit?.logs.filter((l: string) => l.startsWith(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)).length || 0}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: '800' }}>STREAK</Text>
                  <Text style={{ color: progressHabit?.color || Colors.primary, fontSize: 24, fontWeight: '900' }}>
                    🔥 {progressHabit ? getHabitStreak(progressHabit.logs) : 0}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setProgressHabit(null)}
                style={{
                  marginTop: 30,
                  backgroundColor: '#171717',
                  paddingVertical: 15,
                  borderRadius: 20,
                  alignItems: 'center',
                  shadowColor: progressHabit?.color || Colors.primary,
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!sharingHabit} animationType="slide" transparent statusBarTranslucent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>

            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '90%', marginBottom: 15 }}>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>SHARE YOUR PROGRESS</Text>
              <TouchableOpacity
                onPress={() => setSharingHabit(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#ef4444',
                  borderWidth: 2,
                  borderColor: '#000000',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <X color="#ffffff" size={16} strokeWidth={3.5} />
              </TouchableOpacity>
            </View>

            {/* View container for 9:16 Card Mockup */}
            <View
              ref={shareCardRef}
              collapsable={false}
              style={{
                width: Dimensions.get('window').width * 0.8,
                aspectRatio: 9 / 16,
                maxHeight: Dimensions.get('window').height * 0.65,
                backgroundColor: '#facc15',
                borderWidth: 3,
                borderColor: '#171717',
                borderRadius: 24,
                padding: 20,
                justifyContent: 'space-between',
                shadowColor: '#000000',
                shadowOffset: { width: 5, height: 5 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 8,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Neubrutalist grid dots overlay */}
              <View style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.1,
                flexDirection: 'row',
                flexWrap: 'wrap',
                padding: 5,
              }} pointerEvents="none">
                {Array.from({ length: 200 }).map((_, i) => (
                  <View key={i} style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#000000', margin: 12 }} />
                ))}
              </View>

              {/* Top Row: Tracksy Logo & Username with Avatars */}
              <View style={{ zIndex: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 3, borderColor: '#171717', paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Image
                    source={require("../../assets/app_logo.png")}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: '#171717',
                    }}
                  />
                  <View style={{
                    backgroundColor: '#171717',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    transform: [{ rotate: '-1.5deg' }],
                    borderWidth: 1.5,
                    borderColor: '#171717',
                    shadowColor: '#000000',
                    shadowOffset: { width: 1, height: 1 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}>
                    <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>TRACKSY</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#171717', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>@{shareUserName.toUpperCase()}</Text>
                  {settings.userImage ? (
                    <Image
                      source={{ uri: settings.userImage }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: '#171717',
                      }}
                    />
                  ) : null}
                </View>
              </View>

              {/* Hero Habit Panel */}
              <View style={{
                zIndex: 5,
                backgroundColor: '#ffffff',
                borderWidth: 3,
                borderColor: '#171717',
                borderRadius: 16,
                padding: 15,
                shadowColor: '#171717',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
                transform: [{ rotate: '1deg' }],
                marginTop: 10,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 38,
                    height: 38,
                    backgroundColor: '#facc15',
                    borderWidth: 2,
                    borderColor: '#171717',
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 20 }}>{sharingHabit?.icon || "🔥"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#171717', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>
                      {sharingHabit?.name.toUpperCase()}
                    </Text>
                    <Text style={{ color: '#a3a3a3', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>
                      DAILY EVOLUTION
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Panel */}
              <View style={{ zIndex: 5, flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {/* Streak Box */}
                <View style={{
                  flex: 1,
                  backgroundColor: '#171717',
                  borderWidth: 2.5,
                  borderColor: '#171717',
                  borderRadius: 16,
                  padding: 12,
                  alignItems: 'center',
                  shadowColor: '#171717',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#facc15' }}>🔥 {getHabitStreak(sharingHabit?.logs || [])}</Text>
                  <Text style={{ color: '#a3a3a3', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 }}>DAY STREAK</Text>
                </View>

                {/* Score Box */}
                <View style={{
                  flex: 1,
                  backgroundColor: '#171717',
                  borderWidth: 2.5,
                  borderColor: '#171717',
                  borderRadius: 16,
                  padding: 12,
                  alignItems: 'center',
                  shadowColor: '#171717',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#facc15' }}>
                    {sharingHabit ? (parseChallengeDays(sharingHabit.challenge) !== null ? sharingHabit.logs.length : sharingHabit.logs.filter((l: string) => l.startsWith(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-`)).length) : 0}
                    <Text style={{ fontSize: 13, color: '#ffffff' }}>/{sharingHabit ? (parseChallengeDays(sharingHabit.challenge) !== null ? parseChallengeDays(sharingHabit.challenge) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) : 30}</Text>
                  </Text>
                  <Text style={{ color: '#a3a3a3', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 }}>COMPLETED</Text>
                </View>
              </View>

              {/* Monthly Bullet Grid Mockup */}
              <View style={{
                zIndex: 5,
                backgroundColor: '#ffffff',
                borderWidth: 3,
                borderColor: '#171717',
                borderRadius: 16,
                padding: 12,
                marginTop: 10,
                flex: 1,
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#171717', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
                  MONTHLY HABIT RADAR
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                  {sharingHabit && Array.from({ length: Math.min(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(), 31) }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isDone = sharingHabit.logs.includes(dateStr);

                    return (
                      <View key={day} style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        backgroundColor: isDone ? sharingHabit.color : '#e5e7eb',
                        borderWidth: 1.5,
                        borderColor: '#171717',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        {isDone ? (
                          <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: '900' }}>✓</Text>
                        ) : (
                          <Text style={{ color: '#9ca3af', fontSize: 7, fontWeight: '700' }}>{day}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Card Footer: Slogan & Signature */}
              <View style={{ zIndex: 5, borderTopWidth: 3, borderStyle: 'dashed', borderColor: '#171717', paddingTop: 10, marginTop: 10, alignItems: 'center' }}>
                <Text style={{ color: '#171717', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }}>
                  BUILD SYSTEMS, NOT GOALS
                </Text>
              </View>

            </View>

            {/* Customizer Name Input */}
            <View style={{ width: '80%', marginTop: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 2.5, borderColor: '#171717', borderRadius: 16, paddingHorizontal: 12, height: 44 }}>
              <Text style={{ color: '#a3a3a3', fontSize: 11, fontWeight: '900', marginRight: 5 }}>NAME:</Text>
              <TextInput
                style={{ flex: 1, color: '#171717', fontWeight: '900', fontSize: 12 }}
                value={shareUserName}
                onChangeText={setShareUserName}
                maxLength={18}
                placeholder="Your Name"
                placeholderTextColor="#a3a3a3"
              />
            </View>

            {/* Share / Export Actions */}
            <View style={{ flexDirection: 'row', width: '80%', gap: 10, marginTop: 15 }}>
              <TouchableOpacity
                onPress={exportShareCard}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: '#34d399',
                  borderWidth: 2.5,
                  borderColor: '#171717',
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  shadowColor: '#171717',
                  shadowOffset: { width: 3, height: 3 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Download size={18} color="#000000" strokeWidth={3} />
                <Text style={{ color: '#000000', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>EXPORT PICTURE</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </View>
      </Modal>

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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={{
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
                  }}
                >
                  <X color="#ffffff" size={18} strokeWidth={3.5} />
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
                  activeOpacity={0.9}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    borderRadius: 24,
                    borderWidth: 2.5,
                    borderColor: "#171717",
                    backgroundColor: isStarred ? "#facc15" : "#ffffff",
                    marginTop: 15,
                    shadowColor: "#171717",
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 0,
                  }}
                  onPress={() => {
                    setIsStarred(!isStarred);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: "#171717",
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: "#171717",
                        shadowColor: "#171717",
                        shadowOffset: { width: 1.5, height: 1.5 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                      }}
                    >
                      <Star
                        size={22}
                        color={isStarred ? "#facc15" : "#ffffff"}
                        fill={isStarred ? "#facc15" : "transparent"}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          color: "#171717",
                          fontWeight: "900",
                          fontSize: 14,
                          letterSpacing: 0.5,
                        }}
                      >
                        MARK AS IMPORTANT
                      </Text>
                      <Text
                        style={{
                          color: isStarred ? "#171717" : Colors.textMuted,
                          fontSize: 11,
                          fontWeight: "700",
                          opacity: isStarred ? 0.8 : 1,
                          marginTop: 2,
                        }}
                      >
                        Prioritize this mission
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      borderWidth: 2.5,
                      borderColor: "#171717",
                      backgroundColor: isStarred ? "#171717" : "#ffffff",
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#171717",
                      shadowOffset: { width: 1.5, height: 1.5 },
                      shadowOpacity: 1,
                      shadowRadius: 0,
                      elevation: 0,
                    }}
                  >
                    {isStarred && (
                      <CheckCircle2 size={16} color="#facc15" strokeWidth={3.5} />
                    )}
                  </View>
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
          {/* Ambient Neubrutalist Decorative Graphics */}
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

          {/* Safe Area Layout Wrapper */}
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <View style={styles.screenHeader}>
              <TouchableOpacity
                onPress={() => setIsNoteModalVisible(false)}
                style={styles.iconBtn}
              >
                <ChevronLeft color="#000" size={28} />
              </TouchableOpacity>
              <Text style={[styles.screenTitle, { color: "#000" }]}>
                {editingNoteId ? (isNoteEditing ? "Edit Note" : noteTitle) : "New Note"}
              </Text>
              {isNoteEditing ? (
                <TouchableOpacity
                  onPress={handleAddNote}
                  style={[styles.screenAction, { backgroundColor: "#000" }]}
                >
                  <Text style={[styles.screenActionText, { color: noteColor || "#FEFF9C" }]}>
                    {editingNoteId ? "UPDATE" : "SAVE"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const blocksText = noteBlocks
                          .map(b => {
                            if (b.type === 'headline') return `# ${b.content}`;
                            if (b.type === 'todo') return `[${b.checked ? '✓' : ' '}] ${b.content}`;
                            if (b.type === 'bullet') return `• ${b.content}`;
                            if (b.type === 'image') return '[Image]';
                            return b.content;
                          })
                          .filter(Boolean)
                          .join('\n\n');
                        const content = `${noteTitle}\n\n${blocksText}`;
                        const fileUri = FileSystem.documentDirectory + `note_${Date.now()}.txt`;
                        await FileSystem.writeAsStringAsync(fileUri, content, {
                          encoding: FileSystem.EncodingType.UTF8,
                        });
                        if (await Sharing.isAvailableAsync()) {
                          await Sharing.shareAsync(fileUri, {
                            dialogTitle: `Share ${noteTitle}`,
                          });
                        }
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch (e) {
                        console.error("Share failed", e);
                      }
                    }}
                    style={[styles.screenAction, { backgroundColor: "#000" }]}
                  >
                    <Share2 size={16} color={noteColor || "#FEFF9C"} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsNoteEditing(true);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.screenAction, { backgroundColor: "#000" }]}
                  >
                    <Text style={[styles.screenActionText, { color: noteColor || "#FEFF9C" }]}>
                      EDIT
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <ScrollView
              contentContainerStyle={[styles.screenBody, { paddingBottom: 60 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Input */}
              {isNoteEditing ? (
                <TextInput
                  style={[styles.screenTitleInput, { color: "#000", paddingHorizontal: 6 }]}
                  placeholder="Note Title"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                />
              ) : (
                <Text style={[styles.screenTitleInput, { color: "#000", paddingHorizontal: 6, paddingVertical: 4 }]}>
                  {noteTitle}
                </Text>
              )}

              <View style={[styles.screenMeta, { paddingHorizontal: 6 }]}>
                <Calendar size={12} color="rgba(0,0,0,0.5)" />
                <Text style={{ color: "rgba(0,0,0,0.5)", fontSize: 12 }}>
                  {new Date().toLocaleDateString()}
                </Text>
                <View style={[styles.dot, { backgroundColor: "rgba(0,0,0,0.2)" }]} />
                <TouchableOpacity
                  onPress={() => {
                    setShowColorPicker(!showColorPicker);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Palette size={14} color="#000" />
                  <Text style={{ color: "#000", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 }}>
                    NOTE STYLE
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Rich Blocks Editor */}
              <View style={styles.blocksEditorContainer}>
                {noteBlocks.map((block) => {
                  if (!isNoteEditing) {
                    if (block.type === 'headline') {
                      return (
                        <View key={block.id} style={styles.blockRow}>
                          <Text style={[styles.blockHeadlineView, { color: "#000" }]}>{block.content}</Text>
                        </View>
                      );
                    }
                    if (block.type === 'todo') {
                      return (
                        <View key={block.id} style={styles.blockRow}>
                          <View style={styles.todoRowContainer}>
                            <View style={[styles.blockCheckbox, block.checked && styles.blockCheckboxChecked]}>
                              {block.checked && <CheckCircle2 size={12} color="#000" strokeWidth={3.5} />}
                            </View>
                            <Text style={[styles.blockTextView, block.checked && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                              {block.content}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                    if (block.type === 'bullet') {
                      return (
                        <View key={block.id} style={styles.blockRow}>
                          <View style={styles.bulletRowContainer}>
                            <Text style={styles.blockBulletDot}>•</Text>
                            <Text style={styles.blockTextView}>{block.content}</Text>
                          </View>
                        </View>
                      );
                    }
                    if (block.type === 'image') {
                      return (
                        <View key={block.id} style={styles.blockRow}>
                          <View style={styles.blockImageWrapper}>
                            {block.uri ? (
                              <View style={styles.blockImageContainer}>
                                <Image source={{ uri: block.uri }} style={styles.blockImage} resizeMode="cover" />
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    }
                    return (
                      <View key={block.id} style={styles.blockRow}>
                        <Text style={styles.blockTextView}>{block.content}</Text>
                      </View>
                    );
                  }

                  if (block.type === 'headline') {
                    return (
                      <View key={block.id} style={styles.blockRow}>
                        <TextInput
                          style={styles.blockHeadlineInput}
                          value={block.content}
                          onChangeText={(text) => updateBlock(block.id, text)}
                          placeholder="HEADING"
                          placeholderTextColor="rgba(0,0,0,0.25)"
                          multiline
                          scrollEnabled={false}
                        />
                        <TouchableOpacity onPress={() => removeBlock(block.id)} style={styles.blockDeleteBtn}>
                          <X size={14} color="rgba(0,0,0,0.4)" />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  if (block.type === 'todo') {
                    return (
                      <View key={block.id} style={styles.blockRow}>
                        <View style={styles.todoRowContainer}>
                          <TouchableOpacity onPress={() => toggleTodoBlock(block.id)}>
                            <View style={[styles.blockCheckbox, block.checked && styles.blockCheckboxChecked]}>
                              {block.checked && <CheckCircle2 size={12} color="#000" strokeWidth={3.5} />}
                            </View>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.blockTextInput, block.checked && { textDecorationLine: 'line-through', opacity: 0.6 }]}
                            value={block.content}
                            onChangeText={(text) => updateBlock(block.id, text)}
                            placeholder="To-do item..."
                            placeholderTextColor="rgba(0,0,0,0.25)"
                            multiline
                            scrollEnabled={false}
                          />
                        </View>
                        <TouchableOpacity onPress={() => removeBlock(block.id)} style={styles.blockDeleteBtn}>
                          <X size={14} color="rgba(0,0,0,0.4)" />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  if (block.type === 'bullet') {
                    return (
                      <View key={block.id} style={styles.blockRow}>
                        <View style={styles.bulletRowContainer}>
                          <Text style={styles.blockBulletDot}>•</Text>
                          <TextInput
                            style={styles.blockTextInput}
                            value={block.content}
                            onChangeText={(text) => updateBlock(block.id, text)}
                            placeholder="List item..."
                            placeholderTextColor="rgba(0,0,0,0.25)"
                            multiline
                            scrollEnabled={false}
                          />
                        </View>
                        <TouchableOpacity onPress={() => removeBlock(block.id)} style={styles.blockDeleteBtn}>
                          <X size={14} color="rgba(0,0,0,0.4)" />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  if (block.type === 'image') {
                    return (
                      <View key={block.id} style={styles.blockRow}>
                        <View style={styles.blockImageWrapper}>
                          {block.uri ? (
                            <View style={styles.blockImageContainer}>
                              <Image source={{ uri: block.uri }} style={styles.blockImage} resizeMode="cover" />
                              <TouchableOpacity onPress={() => pickImageForBlock(block.id)} style={styles.changeImageOverlay}>
                                <Camera size={20} color="#FFF" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={() => pickImageForBlock(block.id)} style={styles.blockImagePlaceholder}>
                              <Camera size={28} color="rgba(0,0,0,0.4)" />
                              <Text style={{ color: "rgba(0,0,0,0.5)", fontSize: 13, fontWeight: "700", marginTop: 6 }}>
                                UPLOAD IMAGE
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TouchableOpacity onPress={() => removeBlock(block.id)} style={styles.blockDeleteBtn}>
                          <X size={14} color="rgba(0,0,0,0.4)" />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return (
                    <View key={block.id} style={styles.blockRow}>
                      <TextInput
                        style={styles.blockTextInput}
                        value={block.content}
                        onChangeText={(text) => updateBlock(block.id, text)}
                        placeholder="Start typing..."
                        placeholderTextColor="rgba(0,0,0,0.25)"
                        multiline
                        scrollEnabled={false}
                      />
                      <TouchableOpacity onPress={() => removeBlock(block.id)} style={styles.blockDeleteBtn}>
                        <X size={14} color="rgba(0,0,0,0.4)" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {isNoteEditing && (
                <>
                  {/* Theme Sticky Style Selector */}
                  {showColorPicker && (
                    <View style={styles.floatingColorPicker}>
                      {NOTE_COLORS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => {
                            setNoteColor(c);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: c },
                            noteColor === c && { borderColor: "#000", borderWidth: 3.5 },
                          ]}
                        />
                      ))}
                    </View>
                  )}

                  {/* Formatting Toolbar */}
                  <View style={styles.noteToolbar}>
                    <TouchableOpacity onPress={() => addBlock('headline')} style={styles.toolbarBtn}>
                      <Heading size={18} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => addBlock('paragraph')} style={styles.toolbarBtn}>
                      <FileText size={18} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => addBlock('todo')} style={styles.toolbarBtn}>
                      <CheckSquare size={18} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => addBlock('bullet')} style={styles.toolbarBtn}>
                      <List size={18} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => addBlock('image')} style={styles.toolbarBtn}>
                      <Camera size={18} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowColorPicker(!showColorPicker);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[styles.toolbarBtn, showColorPicker && { backgroundColor: '#facc15' }]}
                    >
                      <Palette size={18} color="#000" />
                    </TouchableOpacity>
                  </View>

                  {editingNoteId && (
                    <TouchableOpacity
                      style={[styles.deleteNoteBtn, { borderTopColor: "rgba(0,0,0,0.1)", marginBottom: 20 }]}
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
                      <Text style={{ color: "#FF4500", fontWeight: "bold" }}>DELETE NOTE</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.pickerBtn,
                      {
                        backgroundColor: isNotePinned ? "#000" : "transparent",
                        borderColor: "#000",
                        borderWidth: 2,
                        padding: 15,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        marginTop: 10,
                      },
                    ]}
                    onPress={() => setIsNotePinned(!isNotePinned)}
                  >
                    <Star
                      size={18}
                      color={isNotePinned ? "#fcd002" : "#000"}
                      fill={isNotePinned ? "#fcd002" : "transparent"}
                    />
                    <Text style={{ color: isNotePinned ? "#fcd002" : "#000", fontSize: 13, fontWeight: "700" }}>
                      {isNotePinned ? "Pinned to Top" : "Pin to Top"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={{
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
                  }}
                >
                  <X color="#ffffff" size={18} strokeWidth={3.5} />
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
                CHOOSE EMOJI
              </Text>
              <View style={[styles.catGrid, { justifyContent: 'space-between' }]}>
                {[
                  "🔥", "💧", "🏃", "📚", "💰", "🧘", "🥗", "🧠", "🛌", "💪",
                  "🚀", "💻", "🎨", "✍️", "🌿", "🍎", "🚴", "🎸", "🎯", "🏆",
                  "🌟", "💡", "🎮", "📱", "🧹", "🛒", "💊", "🌞", "🎧", "✈️"
                ].map((emoji) => {
                  return (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setHIcon(emoji)}
                      style={[
                        styles.catBtn,
                        { width: '16%', marginBottom: 10, padding: 8 },
                        hIcon === emoji && {
                          backgroundColor: Colors.text + "15",
                          borderColor: Colors.text,
                        },
                        { borderColor: Colors.border },
                      ]}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: Colors.textMuted, marginTop: 10 }]}>
                CHALLENGE DURATION
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                {["Regular", "10 Days", "20 Days", "30 Days", "100 Days"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setHChallenge(type)}
                    style={[
                      styles.pickerBtn,
                      {
                        borderColor: Colors.border,
                        borderWidth: 2,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: hChallenge === type ? Colors.text : "transparent",
                      },
                    ]}
                  >
                    <Text style={{ color: hChallenge === type ? Colors.card : Colors.text, fontWeight: '700' }}>{type.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={{
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
                  }}
                >
                  <X size={18} color="#ffffff" strokeWidth={3.5} />
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
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  mainTabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 4,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  mainTabText: { fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  searchContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  litSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  litSearchInput: { flex: 1, fontSize: 14, fontWeight: "600" },
  tabScroll: { marginBottom: 16 },
  litTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  litTabText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  content: { padding: 16, paddingBottom: 100 },
  litCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  litCheckContainer: { paddingRight: 14 },
  litMain: { flex: 1 },
  litHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  litText: { fontSize: 15, fontWeight: "700", lineHeight: 21, marginRight: 10, letterSpacing: -0.2 },
  litStrike: { textDecorationLine: "line-through", opacity: 0.35 },
  litMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  litTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  litTagText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  litDelete: { paddingLeft: 15 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  empty: { padding: 60, alignItems: "center", justifyContent: "center" },
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
    elevation: 0,
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 10,
    borderWidth: 2.5,
    borderColor: "#171717",
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
    borderWidth: 2.5,
    borderColor: "#171717",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  input: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "#171717",
    fontSize: 18,
    fontWeight: "700",
  },
  modalTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  premiumCard: {
    width: "92%",
    maxHeight: "85%",
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "#171717",
    padding: 24,
    paddingTop: 30,
    overflow: "hidden",
    elevation: 0,
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
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
    borderWidth: 2.5,
    borderColor: "#171717",
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
    borderWidth: 2.5,
    borderColor: "#171717",
  },
  mainActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 64,
    borderRadius: 24,
    marginTop: 10,
    elevation: 0,
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
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
    borderWidth: 2.5,
    borderColor: "#171717",
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
    borderWidth: 2.5,
    borderColor: "#171717",
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
    borderWidth: 2.5,
    borderColor: "#171717",
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
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  screenTitle: { fontSize: 18, fontWeight: "900" },
  screenAction: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  screenActionText: { color: "black", fontWeight: "900", fontSize: 13 },
  screenBody: { paddingHorizontal: 6, paddingTop: 8 },
  screenTitleInput: { fontSize: 32, fontWeight: "900", marginBottom: 15, paddingHorizontal: 6 },
  screenMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 6,
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
    borderWidth: 2.5,
    borderColor: "#171717",
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
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
  habitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#171717"
  },
  habitDay: {
    width: "14.285%",
    height: 40,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#171717",
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
    borderWidth: 2.5,
    borderColor: "#171717",
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
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
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
  },
  starFilterBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  importantToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "#171717",
    marginTop: 10,
  },
  starIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#171717",
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
    borderWidth: 2.5,
    borderColor: "#171717",
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
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
    elevation: 0,
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderWidth: 2.5,
    borderColor: "#171717",
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
    elevation: 0,
    shadowColor: "#171717",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderWidth: 2.5,
    borderColor: "#171717",
  },
  recordingVisual: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 2.5,
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
  blocksEditorContainer: {
    marginTop: 20,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 38,
  },
  blockDeleteBtn: {
    padding: 8,
    marginLeft: 6,
  },
  blockTextInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    paddingLeft: 6,
    color: '#334155',
    paddingTop: 8,
    paddingBottom: 8,
  },
  blockTextView: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    paddingLeft: 6,
    color: '#334155',
    paddingVertical: 8,
  },
  blockHeadlineInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
    paddingLeft: 6,
    color: '#0f172a',
    paddingTop: 8,
    paddingBottom: 8,
  },
  blockHeadlineView: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
    paddingLeft: 6,
    color: '#0f172a',
    paddingVertical: 8,
  },
  todoRowContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },
  blockCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#171717',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  blockCheckboxChecked: {
    backgroundColor: '#FEFF9C',
  },
  bulletRowContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },
  blockBulletDot: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171717',
    marginRight: 12,
  },
  blockImageWrapper: {
    flex: 1,
    paddingLeft: 6,
    height: 180,
    marginVertical: 10,
  },
  blockImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#171717',
    overflow: 'hidden',
    position: 'relative',
  },
  blockImage: {
    width: '100%',
    height: '100%',
  },
  changeImageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  noteToolbar: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#171717',
    padding: 8,
    marginHorizontal: 10,
    marginBottom: 15,
    justifyContent: 'space-around',
    shadowColor: '#171717',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  toolbarBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#171717',
  },
  floatingColorPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#171717',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#171717',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  pickerBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
});
