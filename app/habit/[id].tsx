import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDatabase } from "@/hooks/useDatabase";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import MrCookieDrinkLottie from "@/assets/Mr. Cookie_ Drink.json";
import RunningPigeonLottie from "@/assets/running pigeon.json";
import PandaSleepingLottie from "@/assets/Panda sleeping waiting lottie animation.json";
import CartoonToothLottie from "@/assets/Cartoon Tooth Character.json";

const lottieCache: Record<string, any> = {};

const getModifiedCookieDrinkLottie = (habitColorHex: string) => {
  const colorKey = habitColorHex.toLowerCase();
  if (lottieCache[colorKey]) {
    return lottieCache[colorKey];
  }

  let hex = colorKey.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const cloned = JSON.parse(JSON.stringify(MrCookieDrinkLottie));

  const targetBrightRed = [0.936999990426, 0.093999997307, 0.141000007181];
  const targetMediumRed = [0.764999988032, 0.081999999402, 0.090000002992];
  const targetDarkRed = [0.54900004069, 0.097999999102, 0.118000000598];

  const epsilon = 0.05;

  const isColorMatch = (c1: number[], c2: number[]) => {
    if (c1.length < 3 || c2.length < 3) return false;
    return (
      Math.abs(c1[0] - c2[0]) < epsilon &&
      Math.abs(c1[1] - c2[1]) < epsilon &&
      Math.abs(c1[2] - c2[2]) < epsilon
    );
  };

  const traverse = (obj: any) => {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        traverse(obj[i]);
      }
      return;
    }

    if (obj.k && Array.isArray(obj.k)) {
      const k = obj.k;
      if (k.length >= 3 && typeof k[0] === "number") {
        if (isColorMatch(k, targetBrightRed)) {
          obj.k = [r, g, b, k[3] !== undefined ? k[3] : 1];
        } else if (isColorMatch(k, targetMediumRed)) {
          obj.k = [r * 0.82, g * 0.85, b * 0.70, k[3] !== undefined ? k[3] : 1];
        } else if (isColorMatch(k, targetDarkRed)) {
          obj.k = [r * 0.60, g * 0.70, b * 0.55, k[3] !== undefined ? k[3] : 1];
        }
      }
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        traverse(obj[key]);
      }
    }
  };

  traverse(cloned);
  lottieCache[colorKey] = cloned;
  return cloned;
};

const pigeonLottieCache: Record<string, any> = {};

const getModifiedRunningPigeonLottie = (habitColorHex: string) => {
  const colorKey = habitColorHex.toLowerCase();
  if (pigeonLottieCache[colorKey]) {
    return pigeonLottieCache[colorKey];
  }

  let hex = colorKey.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const cloned = JSON.parse(JSON.stringify(RunningPigeonLottie));

  const targetMainBlue = [0.310000011968, 0.419999994016, 0.757000014361];
  const targetHighlightBlue = [0.416000007181, 0.490000017952, 0.808000033509];

  const epsilon = 0.05;

  const isColorMatch = (c1: number[], c2: number[]) => {
    if (c1.length < 3 || c2.length < 3) return false;
    return (
      Math.abs(c1[0] - c2[0]) < epsilon &&
      Math.abs(c1[1] - c2[1]) < epsilon &&
      Math.abs(c1[2] - c2[2]) < epsilon
    );
  };

  const traverse = (obj: any) => {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        traverse(obj[i]);
      }
      return;
    }

    if (obj.k && Array.isArray(obj.k)) {
      const k = obj.k;
      if (k.length >= 3 && typeof k[0] === "number") {
        if (isColorMatch(k, targetMainBlue)) {
          obj.k = [r, g, b, k[3] !== undefined ? k[3] : 1];
        } else if (isColorMatch(k, targetHighlightBlue)) {
          obj.k = [
            Math.min(r * 1.2, 1.0),
            Math.min(g * 1.15, 1.0),
            Math.min(b * 1.1, 1.0),
            k[3] !== undefined ? k[3] : 1
          ];
        }
      }
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        traverse(obj[key]);
      }
    }
  };

  traverse(cloned);
  pigeonLottieCache[colorKey] = cloned;
  return cloned;
};

const getHabitLottieTheme = (habit: any): "meditation" | "drink" | "running" | "sleeping" | "tooth" | "default" => {
  if (!habit) return "default";
  const name = (habit.name || "").toLowerCase();
  const icon = habit.icon || "";
  
  const meditationKeywords = ["meditation", "peace", "yoga", "calm", "mindful", "zen", "breath", "relax"];
  const meditationEmojis = ["🧘", "🧘‍♂️", "🧘‍♀️", "☮️", "🕊️", "🕉️", "☯️", "✨"];
  
  const drinkKeywords = ["drink", "water", "hydrate", "glass", "beverage", "liquid", "hydrat", "h2o"];
  const drinkEmojis = ["🥛", "🥤", "🫗", "💧", "🍹", "☕", "🍵", "🍺", "🥂", "🍷", "🍸", "🍾"];

  const runningKeywords = ["run", "running", "jog", "jogging", "sprint", "cardio", "pace", "walk", "walking", "step", "steps", "exercise", "workout", "gym", "fitness", "athletics"];
  const runningEmojis = ["🏃", "🏃‍♂️", "🏃‍♀️", "👟", "🧦", "🚶", "🚶‍♂️", "🚶‍♀️", "🥇", "🥈", "🥉", "🏅", "🏆", "🎽"];

  const sleepingKeywords = ["sleep", "sleeping", "bed", "nap", "rest", "night", "dream", "snore", "slumber", "bedtime", "relax", "pillow", "blanket"];
  const sleepingEmojis = ["😴", "🛌", "💤", "🌙", "🐼", "🛌‍♂️", "🛌‍♀️", "🌃", "🦉", "🥱", "🌜", "🌕"];

  const toothKeywords = ["tooth", "teeth", "brush", "brushing", "dental", "dentist", "floss", "flossing", "mouthwash", "hygiene"];
  const toothEmojis = ["🪥", "🦷", "👄", "🦷", "✨"];
  
  const isMeditation = meditationKeywords.some(kw => name.includes(kw)) || meditationEmojis.some(em => icon.includes(em));
  if (isMeditation) return "meditation";
  
  const isDrink = drinkKeywords.some(kw => name.includes(kw)) || drinkEmojis.some(em => icon.includes(em));
  if (isDrink) return "drink";

  const isRunning = runningKeywords.some(kw => name.includes(kw)) || runningEmojis.some(em => icon.includes(em));
  if (isRunning) return "running";

  const isSleeping = sleepingKeywords.some(kw => name.includes(kw)) || sleepingEmojis.some(em => icon.includes(em));
  if (isSleeping) return "sleeping";

  const isTooth = toothKeywords.some(kw => name.includes(kw)) || toothEmojis.some(em => icon.includes(em));
  if (isTooth) return "tooth";
  
  return "default";
};

const getHabitLottieSource = (theme: string, habitColor: string) => {
  switch (theme) {
    case "meditation":
      return require("@/assets/Meditating Monkey.json");
    case "drink":
      return getModifiedCookieDrinkLottie(habitColor);
    case "running":
      return getModifiedRunningPigeonLottie(habitColor);
    case "sleeping":
      return require("@/assets/Panda sleeping waiting lottie animation.json");
    case "tooth":
      return require("@/assets/Cartoon Tooth Character.json");
    default:
      return require("@/assets/Super hero.json");
  }
};

const { width } = Dimensions.get("window");
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const BAR_MAX_HEIGHT = 52;

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { habits, deleteHabit, updateHabit } = useDatabase();

  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Text style={styles.errorText}>Habit not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const habitColor = habit.color || "#F472B6";
  const goal = habit.goal || 1;
  const goalUnit = habit.goalUnit || "times";

  // Today's count — stored as repeated entries of todayStr
  const todayLogs = (habit.logs || []).filter((l) => l === todayStr);
  const todayCount = todayLogs.length;

  // Celebration States
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const showCelebration = () => {
    setCelebrationVisible(true);
    Animated.parallel([
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(celebrationScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  };

  const hideCelebration = () => {
    Animated.parallel([
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationScale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCelebrationVisible(false);
    });
  };

  const incrementToday = () => {
    const updated = [...(habit.logs || []), todayStr];
    const newCount = updated.filter((l) => l === todayStr).length;
    
    if (newCount === goal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showCelebration();
    }
    
    updateHabit(habit.id, { logs: updated });
  };

  const decrementToday = () => {
    const logs = [...(habit.logs || [])];
    const idx = logs.lastIndexOf(todayStr);
    if (idx !== -1) {
      logs.splice(idx, 1);
      updateHabit(habit.id, { logs });
    }
  };

  // This week Mon–Sun
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const sunToSatDates = useMemo(() => {
    const dates: string[] = [];
    const now = new Date();
    const currentDay = now.getDay();
    const sunOffset = -currentDay;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + sunOffset + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const currentStreak = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    const allLogs = new Set<string>();
    habits.forEach(h => {
      if (h.logs) h.logs.forEach(l => allLogs.add(l));
    });
    
    let current = 0;
    let checkDate = new Date(today);

    if (!allLogs.has(todayStr)) {
        const yesterday = new Date(checkDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (!allLogs.has(yStr)) {
            return 0;
        } else {
            checkDate = yesterday;
        }
    }

    while (allLogs.has(checkDate.toISOString().slice(0, 10))) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return current;
  }, [habits, todayStr]);

  // Count per day this week
  const weekCounts = useMemo(() =>
    weekDates.map((d) => (habit.logs || []).filter((l) => l === d).length),
    [habit.logs, weekDates]
  );
  const weekTotal = weekCounts.reduce((a, b) => a + b, 0);
  const weekAvg = Math.round(weekTotal / 7);
  const weekCompletion = Math.round((weekDates.filter((d, i) => weekCounts[i] >= goal).length / 7) * 100);
  const maxBar = Math.max(...weekCounts, 1);

  // History last 7 log-days
  const historyEntries = useMemo(() => {
    const unique = Array.from(new Set((habit.logs || []))).sort().reverse();
    return unique.slice(0, 10).map((d) => {
      const count = (habit.logs || []).filter((l) => l === d).length;
      return { date: d, count };
    });
  }, [habit.logs]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const isToday = iso === todayStr;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = iso === yesterday.toISOString().slice(0, 10);
    if (isToday) return "Today, " + d.toLocaleDateString("en-US", { day: "numeric", month: "long" });
    if (isYesterday) return "Yesterday, " + d.toLocaleDateString("en-US", { day: "numeric", month: "long" });
    return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  };

  const handleDelete = () => {
    Alert.alert("Delete Habit", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteHabit(habit.id); router.back(); } },
    ]);
  };

  const handleMenuPress = () => {
    Alert.alert(
      "Habit Options",
      "What would you like to do?",
      [
        {
          text: "Edit Habit",
          onPress: () => router.push(`/add-habit?id=${habit.id}` as any),
        },
        {
          text: "Delete Habit",
          style: "destructive",
          onPress: handleDelete,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      const todayCount = (habit.logs || []).filter(l => l === todayStr).length;
      const goal = habit.goal || 1;
      const totalCount = (habit.logs || []).length;
      const progressText = todayCount >= goal 
        ? `fully completed (${todayCount}/${goal} times)` 
        : `reached ${todayCount}/${goal} times`;
      await Share.share({ 
        message: `I've ${progressText} of my "${habit.icon} ${habit.name}" habit today (Total: ${totalCount} times tracked) on Tracksy+! 🔥` 
      });
    } catch {}
  };

  // Dynamic helper to match keyword to large thematic emoji
  const getLargeHabitEmoji = (name: string, defaultIcon: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("water") || lowerName.includes("drink") || lowerName.includes("hydrat") || lowerName.includes("glass")) return "🥛";
    if (lowerName.includes("coffee") || lowerName.includes("tea") || lowerName.includes("milk")) return "☕";
    if (lowerName.includes("run") || lowerName.includes("jog") || lowerName.includes("cardio")) return "🏃";
    if (lowerName.includes("walk") || lowerName.includes("step")) return "🚶";
    if (lowerName.includes("gym") || lowerName.includes("workout") || lowerName.includes("fit") || lowerName.includes("train") || lowerName.includes("lift") || lowerName.includes("weight") || lowerName.includes("exercis")) return "💪";
    if (lowerName.includes("read") || lowerName.includes("book") || lowerName.includes("novel")) return "📖";
    if (lowerName.includes("study") || lowerName.includes("learn") || lowerName.includes("course") || lowerName.includes("class")) return "📚";
    if (lowerName.includes("write") || lowerName.includes("journal") || lowerName.includes("diary")) return "✍️";
    if (lowerName.includes("sleep") || lowerName.includes("bed") || lowerName.includes("nap") || lowerName.includes("rest")) return "😴";
    if (lowerName.includes("meditat") || lowerName.includes("yoga") || lowerName.includes("breathe") || lowerName.includes("calm") || lowerName.includes("zen") || lowerName.includes("mindful")) return "🧘";
    if (lowerName.includes("code") || lowerName.includes("program") || lowerName.includes("develop") || lowerName.includes("tech") || lowerName.includes("comput")) return "💻";
    if (lowerName.includes("work") || lowerName.includes("job") || lowerName.includes("office") || lowerName.includes("task")) return "💼";
    if (lowerName.includes("eat") || lowerName.includes("food") || lowerName.includes("diet") || lowerName.includes("meal") || lowerName.includes("fruit") || lowerName.includes("apple") || lowerName.includes("salad")) return "🍎";
    if (lowerName.includes("money") || lowerName.includes("save") || lowerName.includes("budget") || lowerName.includes("finance") || lowerName.includes("invest")) return "💰";
    if (lowerName.includes("music") || lowerName.includes("play") || lowerName.includes("sing") || lowerName.includes("guitar") || lowerName.includes("piano") || lowerName.includes("song")) return "🎵";
    if (lowerName.includes("art") || lowerName.includes("paint") || lowerName.includes("draw") || lowerName.includes("sketch")) return "🎨";
    if (lowerName.includes("clean") || lowerName.includes("tidy") || lowerName.includes("wash") || lowerName.includes("sweep") || lowerName.includes("house") || lowerName.includes("chore")) return "🧹";
    if (lowerName.includes("smoke") || lowerName.includes("quit") || lowerName.includes("cigarette")) return "🚭";
    if (lowerName.includes("heart") || lowerName.includes("love") || lowerName.includes("date") || lowerName.includes("friend") || lowerName.includes("family") || lowerName.includes("call") || lowerName.includes("parent")) return "❤️";
    
    return defaultIcon || "🎯";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Habit Detail</Text>
        <TouchableOpacity onPress={handleMenuPress} style={styles.navBtn}>
          <Text style={styles.navMore}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: habitColor, flexDirection: "column", alignItems: "center", paddingVertical: 28 }]}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Text style={[styles.heroEmoji, { fontSize: 32 }]}>{habit.icon || "✨"}</Text>
            <Text style={[styles.heroName, { textAlign: "center" }]}>{habit.name}</Text>
            <Text style={styles.heroSub}>Daily To get</Text>
            <Text style={styles.heroGoal}>{goal} {goalUnit}</Text>
          </View>
          <View style={styles.heroRight}>
            {(() => {
              const theme = getHabitLottieTheme(habit);
              if (theme === "meditation") {
                return (
                  <LottieView
                    source={require("@/assets/Meditating Monkey.json")}
                    autoPlay
                    loop
                    style={{ width: 252, height: 252 }}
                  />
                );
              }
              if (theme === "drink") {
                return (
                  <LottieView
                    source={require("@/assets/Mr. Cookie_ Drink.json")}
                    autoPlay
                    loop
                    style={{ width: 252, height: 252 }}
                  />
                );
              }
              if (theme === "running") {
                return (
                  <LottieView
                    source={require("@/assets/running pigeon.json")}
                    autoPlay
                    loop
                    style={{ width: 252, height: 252 }}
                  />
                );
              }
              if (theme === "sleeping") {
                return (
                  <LottieView
                    source={require("@/assets/Panda sleeping waiting lottie animation.json")}
                    autoPlay
                    loop
                    style={{ width: 252, height: 252 }}
                  />
                );
              }
              if (theme === "tooth") {
                return (
                  <LottieView
                    source={require("@/assets/Cartoon Tooth Character.json")}
                    autoPlay
                    loop
                    style={{ width: 252, height: 252 }}
                  />
                );
              }
              return (
                <View style={{ width: 252, height: 252, alignItems: "center", justifyContent: "center" }}>
                  <LottieView
                    source={require("@/assets/Super hero.json")}
                    autoPlay
                    loop
                    style={{ width: 220, height: 220 }}
                  />
                </View>
              );
            })()}
          </View>
        </View>

        {/* Today Counter */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.counterBtn} onPress={decrementToday}>
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.counterCenter}>
              <Text style={styles.counterValue}>{todayCount}</Text>
              <Text style={styles.counterUnit}>/ {goal} {goalUnit}</Text>
            </View>
            <TouchableOpacity style={[styles.counterBtn, styles.counterBtnAdd, { backgroundColor: habitColor }]} onPress={incrementToday}>
              <Text style={[styles.counterBtnText, { color: "#FFF" }]}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* Premium Progress Bar in Today Container */}
          <View style={{ height: 10, backgroundColor: "#F3F4F6", borderRadius: 5, overflow: "hidden", marginTop: 16, marginBottom: 16 }}>
            <View style={{ height: "100%", width: `${Math.min((todayCount / goal) * 100, 100)}%`, backgroundColor: habitColor, borderRadius: 5 }} />
          </View>

          {/* Premium customized visual icons using Lottie animations */}
          <View style={[styles.iconRow, { justifyContent: "center", gap: 10, flexWrap: "wrap", marginVertical: 12 }]}>
            {Array.from({ length: Math.min(goal, 12) }).map((_, i) => {
              const isCompletedIncrement = i < todayCount;
              const theme = getHabitLottieTheme(habit);
              const lottieSource = getHabitLottieSource(theme, habitColor);
              
              return (
                <View 
                  key={i} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    alignItems: "center", 
                    justifyContent: "center",
                    opacity: isCompletedIncrement ? 1 : 0.28,
                  }}
                >
                  <LottieView
                    source={lottieSource}
                    autoPlay={isCompletedIncrement}
                    loop={isCompletedIncrement}
                    style={{ width: 40, height: 40 }}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* This Week */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>This Week</Text>
          <View style={styles.weekStats}>
            <View>
              <Text style={styles.weekStatValue}>{weekAvg} / {goal}</Text>
              <Text style={styles.weekStatSub}>Avg per day</Text>
            </View>
            <View>
              <Text style={[styles.weekStatValue, { color: habitColor }]}>{weekCompletion}%</Text>
              <Text style={styles.weekStatSub}>Completion</Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.barChart}>
            {weekCounts.map((count, i) => {
              const barH = maxBar > 0 ? Math.max((count / maxBar) * BAR_MAX_HEIGHT, count > 0 ? 8 : 4) : 4;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: barH, backgroundColor: count > 0 ? habitColor : "#F3F4F6" }]} />
                  <Text style={styles.barDay}>{DAY_LABELS[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* History */}
        <View style={styles.historyHeader}>
          <Text style={styles.cardLabel}>History</Text>
          <Text style={[styles.viewAll, { color: habitColor }]}>View All</Text>
        </View>

        {historyEntries.length === 0 ? (
          <Text style={styles.emptyHistory}>No history yet. Start tracking today!</Text>
        ) : (
          historyEntries.map((entry, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
              <Text style={[styles.historyCount, { color: habitColor }]}>{entry.count} {goalUnit}</Text>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Full-screen Celebration Overlay */}
      {celebrationVisible && (
        <Modal
          visible={celebrationVisible}
          transparent={true}
          animationType="none"
          onRequestClose={hideCelebration}
        >
          <Animated.View style={[styles.celebrationContainer, { opacity: celebrationOpacity }]}>
            <SafeAreaView style={styles.celebrationSafeArea} edges={["top", "bottom"]}>
              {/* Top Section: Habit Complete with Habit Name */}
              <View style={[styles.celebrationTopSection, { marginTop: 10 }]}>
                <Text style={styles.celebrationTitle}>Habit Completed!</Text>
                <Text style={styles.celebrationHabitName}>
                  {habit.icon} {habit.name}
                </Text>
              </View>

              {/* Celebration Illustration Container with Fire Background */}
              <View style={styles.celebrationHeroContainer}>
                {/* Background Solid Color Squared Box */}
                <View
                  style={{
                    position: "absolute",
                    width: 250,
                    height: 250,
                    borderRadius: 24,
                    backgroundColor: habitColor,
                    shadowColor: habitColor,
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.26,
                    shadowRadius: 18,
                    elevation: 5,
                  }}
                />
                {(() => {
                  const theme = getHabitLottieTheme(habit);
                  if (theme === "meditation") {
                    return (
                      <LottieView
                        source={require("@/assets/Meditating Monkey.json")}
                        autoPlay
                        loop
                        style={{ width: 210, height: 210 }}
                      />
                    );
                  }
                  if (theme === "drink") {
                    return (
                      <LottieView
                        source={require("@/assets/Mr. Cookie_ Drink.json")}
                        autoPlay
                        loop
                        style={{ width: 210, height: 210 }}
                      />
                    );
                  }
                  if (theme === "running") {
                    return (
                      <LottieView
                        source={require("@/assets/running pigeon.json")}
                        autoPlay
                        loop
                        style={{ width: 210, height: 210 }}
                      />
                    );
                  }
                  if (theme === "sleeping") {
                    return (
                      <LottieView
                        source={require("@/assets/Panda sleeping waiting lottie animation.json")}
                        autoPlay
                        loop
                        style={{ width: 210, height: 210 }}
                      />
                    );
                  }
                  if (theme === "tooth") {
                    return (
                      <LottieView
                        source={require("@/assets/Cartoon Tooth Character.json")}
                        autoPlay
                        loop
                        style={{ width: 210, height: 210 }}
                      />
                    );
                  }
                  // Default Superhero
                  return (
                    <LottieView
                      source={require("@/assets/Super hero.json")}
                      autoPlay
                      loop
                      style={{ width: 210, height: 210 }}
                    />
                  );
                })()}
              </View>

              {/* Center Section: Beautiful Streak Card (Matches user image) */}
              <Animated.View 
                style={[
                  styles.streakCard, 
                  { 
                    transform: [{ scale: celebrationScale }],
                  }
                ]}
              >
                {/* Left Column of the Streak Card */}
                <View style={styles.streakLeftCol}>
                  <View style={styles.streakFireCircle}>
                    <LottieView
                      source={require("@/assets/Fire Streak Orange.json")}
                      autoPlay
                      loop
                      style={{ width: 44, height: 44 }}
                    />
                  </View>
                  <Text style={styles.streakDayCount}>{currentStreak} days</Text>
                  <Text style={styles.streakSubLabel}>Days Streak</Text>
                </View>

                {/* Right Column of the Streak Card */}
                <View style={styles.streakRightCol}>
                  <Text style={styles.streakProgressFraction}>
                    {todayCount}<Text style={{ fontSize: 13, color: "#9CA3AF", fontWeight: "600" }}>/{goal} {goalUnit}</Text>
                  </Text>

                  {/* Horizontal progress bar */}
                  <View style={styles.streakProgressBarContainer}>
                    <View 
                      style={[
                        styles.streakProgressBarFill, 
                        { 
                          width: `${Math.min((todayCount / goal) * 100, 100)}%`, 
                          backgroundColor: habitColor 
                        }
                      ]} 
                    />
                  </View>

                  {/* Weekday strip (Sun - Sat) with pink/grey checkmarks */}
                  <View style={styles.streakWeekRow}>
                    {sunToSatDates.map((dateStr, index) => {
                      const done = (habit.logs || []).includes(dateStr);
                      return (
                        <View key={index} style={styles.streakWeekDayCol}>
                          <View 
                            style={[
                              styles.streakWeekDayDot, 
                              done && { backgroundColor: habitColor }
                            ]}
                          >
                            <Text style={[styles.streakWeekDayCheck, done && { color: "#FFF" }]}>
                              ✓
                            </Text>
                          </View>
                          <Text style={styles.streakWeekDayLabel}>{weekLabels[index]}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>

              {/* Bottom Section: Action Buttons */}
              <View style={styles.celebrationBottomSection}>
                <TouchableOpacity 
                  style={[styles.celebrationButton, { backgroundColor: habitColor }]} 
                  onPress={hideCelebration}
                >
                  <Text style={styles.celebrationButtonText}>Awesome!</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  errorText: { fontSize: 18, color: "#EF4444", textAlign: "center", marginTop: 40 },
  backButton: { marginTop: 20, alignSelf: "center", padding: 12, backgroundColor: "#E5E7EB", borderRadius: 8 },
  backText: { fontWeight: "600" },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navArrow: { fontSize: 32, color: "#171717", lineHeight: 36 },
  navTitle: { fontSize: 17, fontWeight: "800", color: "#171717" },
  navMore: { fontSize: 24, color: "#171717" },

  scroll: { paddingHorizontal: 20 },

  heroCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  heroEmoji: { fontSize: 28, marginBottom: 8 },
  heroName: { fontSize: 22, fontWeight: "900", color: "#FFF", marginBottom: 8 },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  heroGoal: { fontSize: 20, fontWeight: "800", color: "#FFF" },
  heroRight: { alignItems: "center" },
  heroLargeIconBg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  heroGlassIcon: { fontSize: 46 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLabel: { fontSize: 16, fontWeight: "800", color: "#171717", marginBottom: 16 },

  counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnAdd: {},
  counterBtnText: { fontSize: 24, color: "#374151", lineHeight: 28 },
  counterCenter: { alignItems: "center" },
  counterValue: { fontSize: 36, fontWeight: "900", color: "#171717" },
  counterUnit: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },

  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  unitIcon: { fontSize: 22 },
  unitIconDone: {},

  weekStats: { flexDirection: "row", gap: 40, marginBottom: 20 },
  weekStatValue: { fontSize: 20, fontWeight: "900", color: "#171717" },
  weekStatSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  barChart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: BAR_MAX_HEIGHT + 24 },
  barCol: { alignItems: "center", flex: 1 },
  bar: { width: 14, borderRadius: 7, marginBottom: 8 },
  barDay: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },

  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  viewAll: { fontSize: 13, fontWeight: "700" },
  historyRow: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  historyDate: { fontSize: 13, color: "#374151", fontWeight: "500" },
  historyCount: { fontSize: 13, fontWeight: "700" },
  emptyHistory: { textAlign: "center", color: "#9CA3AF", fontSize: 13, paddingVertical: 20 },

  celebrationContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    width: "100%",
    height: "100%",
  },
  celebrationSafeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
    width: "100%",
  },
  celebrationTopSection: {
    alignItems: "center",
    marginTop: 20,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#171717",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  celebrationHabitName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4B5563",
  },
  streakCard: {
    width: width - 32,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
  },
  streakLeftCol: {
    width: 110,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  streakFireCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF0F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#F472B6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  streakDayCount: {
    fontSize: 15,
    fontWeight: "900",
    color: "#171717",
    textAlign: "center",
    marginBottom: 2,
  },
  streakSubLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "center",
  },
  streakRightCol: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  streakProgressFraction: {
    fontSize: 24,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: -0.5,
  },
  streakProgressBarContainer: {
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 10,
  },
  streakProgressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  streakWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  streakWeekDayCol: {
    alignItems: "center",
  },
  streakWeekDayDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  streakWeekDayCheck: {
    fontSize: 8,
    color: "transparent",
    fontWeight: "900",
  },
  streakWeekDayLabel: {
    fontSize: 8,
    color: "#9CA3AF",
    fontWeight: "700",
  },
  celebrationBottomSection: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  celebrationButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  celebrationButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  celebrationHeroContainer: {
    width: 280,
    height: 280,
    alignSelf: "center",
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  celebrationHeroBackground: {
    position: "absolute",
    width: 360,
    height: 360,
    zIndex: -1,
  },
});
