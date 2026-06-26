import { useDatabase } from "@/hooks/useDatabase";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Bell, Sparkles, Plus, Check, Share2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  DeviceEventEmitter,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  Animated,
  Modal,
  FlatList,
  Platform,
  Alert,
  Share,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import ViewShot from "react-native-view-shot";
import LottieView from "lottie-react-native";
import MrCookieDrinkLottie from "@/assets/Mr. Cookie_ Drink.json";
import RunningPigeonLottie from "@/assets/running pigeon.json";
import PandaSleepingLottie from "@/assets/Panda sleeping waiting lottie animation.json";
import CartoonToothLottie from "@/assets/Cartoon Tooth Character.json";
import { getUnreadCount } from "@/utils/notificationStore";

const { width } = Dimensions.get("window");

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

const getHabitLottieTheme = (habit: any): "meditation" | "drink" | "running" | "sleeping" | "tooth" | "capsule" | "exercise" | "kids" | "study" | "default" => {
  if (!habit) return "default";
  const name = (habit.name || "").toLowerCase();
  const icon = habit.icon || "";
  
  const meditationKeywords = ["meditation", "peace", "yoga", "calm", "mindful", "zen", "breath", "relax"];
  const meditationEmojis = ["🧘", "🧘‍♂️", "🧘‍♀️", "☮️", "🕊️", "🕉️", "☯️", "✨"];
  
  const drinkKeywords = ["drink", "water", "hydrate", "glass", "beverage", "liquid", "hydrat", "h2o"];
  const drinkEmojis = ["🥛", "🥤", "🫗", "💧", "🍹", "☕", "🍵", "🍺", "🥂", "🍷", "🍸", "🍾"];

  const exerciseKeywords = ["exercise", "workout", "gym", "fitness", "athletics", "train", "lift", "pull up", "push up"];
  const exerciseEmojis = ["💪", "🏋️", "🤸", "🧗"];

  const runningKeywords = ["run", "running", "jog", "jogging", "sprint", "cardio", "pace", "walk", "walking", "step", "steps"];
  const runningEmojis = ["🏃", "🏃‍♂️", "🏃‍♀️", "👟", "🧦", "🚶", "🚶‍♂️", "🚶‍♀️", "🥇", "🥈", "🥉", "🏅", "🏆", "🎽"];

  const sleepingKeywords = ["sleep", "sleeping", "bed", "nap", "rest", "night", "dream", "snore", "slumber", "bedtime", "relax", "pillow", "blanket"];
  const sleepingEmojis = ["😴", "🛌", "💤", "🌙", "🐼", "🛌‍♂️", "🛌‍♀️", "🌃", "🦉", "🥱", "🌜", "🌕"];

  const toothKeywords = ["tooth", "teeth", "brush", "brushing", "dental", "dentist", "floss", "flossing", "mouthwash", "hygiene"];
  const toothEmojis = ["🪥", "🦷", "👄", "🦷", "✨"];
  
  const capsuleKeywords = ["medicine", "pill", "tablet", "capsule", "supplement", "vitamin", "medication", "drug", "prescription"];
  const capsuleEmojis = ["💊", "💉", "🩸", "⚕️"];
  
  const kidsKeywords = ["kid", "child", "baby", "parenting", "play", "school", "son", "daughter"];
  const kidsEmojis = ["👶", "🧒", "👦", "👧", "🍼", "🧸", "🚸", "🎮", "🪁"];

  const studyKeywords = ["study", "studying", "read", "reading", "learn", "learning", "book", "homework", "exam", "school", "college"];
  const studyEmojis = ["📚", "📖", "📝", "✏️", "🎒", "🎓", "🤓", "✍️", "💻"];
  
  const isMeditation = meditationKeywords.some(kw => name.includes(kw)) || meditationEmojis.some(em => icon.includes(em));
  if (isMeditation) return "meditation";
  
  const isDrink = drinkKeywords.some(kw => name.includes(kw)) || drinkEmojis.some(em => icon.includes(em));
  if (isDrink) return "drink";

  const isExercise = exerciseKeywords.some(kw => name.includes(kw)) || exerciseEmojis.some(em => icon.includes(em));
  if (isExercise) return "exercise";

  const isRunning = runningKeywords.some(kw => name.includes(kw)) || runningEmojis.some(em => icon.includes(em));
  if (isRunning) return "running";

  const isSleeping = sleepingKeywords.some(kw => name.includes(kw)) || sleepingEmojis.some(em => icon.includes(em));
  if (isSleeping) return "sleeping";

  const isTooth = toothKeywords.some(kw => name.includes(kw)) || toothEmojis.some(em => icon.includes(em));
  if (isTooth) return "tooth";
  
  const isCapsule = capsuleKeywords.some(kw => name.includes(kw)) || capsuleEmojis.some(em => icon.includes(em));
  if (isCapsule) return "capsule";
  
  const isKids = kidsKeywords.some(kw => name.includes(kw)) || kidsEmojis.some(em => icon.includes(em));
  if (isKids) return "kids";

  const isStudy = studyKeywords.some(kw => name.includes(kw)) || studyEmojis.some(em => icon.includes(em));
  if (isStudy) return "study";
  
  return "default";
};

export default function TracksyHomeScreen() {
  const router = useRouter();
  const { habits, settings, updateHabit, Colors } = useDatabase();
  const isFocused = useIsFocused();
  const today = new Date().toISOString().slice(0, 10);

  // Notification badge count
  const [unreadCount, setUnreadCount] = useState(0);
  const [showViewAll, setShowViewAll] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getUnreadCount().then(setUnreadCount);
    }, [])
  );

  // Celebration States
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationHabit, setCelebrationHabit] = useState<any>(null);
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [celebrationScale] = useState(new Animated.Value(0));
  const [celebrationOpacity] = useState(new Animated.Value(0));

  const viewShotRef = useRef<any>(null);

  const captureAndShare = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        const fileName = `Tracksy_Habit_Complete_${Date.now()}.png`;
        const destUri = FileSystem.documentDirectory + fileName;
        await FileSystem.moveAsync({ from: uri, to: destUri });
        const inviteText = `I just completed my habit on Tracksy! 🔥\nJoin me and track your goals: https://play.google.com/store/apps/details?id=com.dineshmahidev.tracksy`;
        
        if (Platform.OS === "ios") {
          await Share.share({ message: inviteText, url: destUri });
        } else {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(destUri, { dialogTitle: "Share your habit" });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Pulsing animation for the center fire icon
  const fireScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (celebrationVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fireScale, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      fireScale.setValue(1);
    }
  }, [celebrationVisible]);

  // Sunday to Saturday week dates for the celebration streak card
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
  }, [celebrationVisible]);

  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const showCelebration = (habit: any, newCount: number) => {
    setCelebrationHabit(habit);
    setCelebrationCount(newCount);
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
      setCelebrationHabit(null);
    });
  };

  const bestStreak = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    const allLogs = new Set<string>();
    habits.forEach(h => {
      if (h.logs) h.logs.forEach(l => allLogs.add(l));
    });
    const sortedDates = Array.from(allLogs).sort();
    
    if (sortedDates.length === 0) return 0;

    let current = 1;
    let best = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        current++;
        best = Math.max(best, current);
      } else if (diffDays > 1) {
        current = 1;
      }
    }
    return best;
  }, [habits]);

  const currentStreak = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    const allLogs = new Set<string>();
    habits.forEach(h => {
      if (h.logs) h.logs.forEach(l => allLogs.add(l));
    });
    
    let current = 0;
    let checkDate = new Date(today);

    // If today is not in logs, check yesterday
    if (!allLogs.has(today)) {
        const yesterday = new Date(checkDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (!allLogs.has(yStr)) {
            return 0; // Streak broken
        } else {
            checkDate = yesterday;
        }
    }

    while (allLogs.has(checkDate.toISOString().slice(0, 10))) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return current;
  }, [habits, today]);

  const toggleHabitDay = async (habit: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let updatedLogs = [...(habit.logs || [])];
    const todayCount = updatedLogs.filter((d) => d === today).length;
    const goal = habit.goal || 1;

    if (todayCount >= goal) {
      updatedLogs = updatedLogs.filter((d) => d !== today);
    } else {
      updatedLogs.push(today);
      const newCount = todayCount + 1;
      if (newCount === goal) {
        showCelebration(habit, newCount);
      }
    }
    await updateHabit(habit.id, { logs: updatedLogs });
  };

  const CircularProgress = ({ value, maxValue, size, strokeWidth, color }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(value / maxValue, 1);
    const strokeDashoffset = circumference - progress * circumference;
    // Dynamic light track color
    const trackColor = `${color}25`;

    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          <Circle stroke={trackColor} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
          <Circle
            stroke={color}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={{ position: "absolute", alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#666", fontWeight: "600", marginBottom: -2 }}>Current Streak</Text>
          <Text style={{ fontSize: 32, fontWeight: "900", color: "#171717", letterSpacing: -1 }}>{value}</Text>
          <Text style={{ fontSize: 12, color: "#666", marginTop: -4 }}>days</Text>
        </View>
      </View>
    );
  };

  // Custom Slide to Complete Slider component
  const SlideToComplete = ({ habit, onComplete, isDone, color }: any) => {
    const trackWidth = width - 48 - 32; // Screen width - Screen Padding (48) - Card Padding (32)
    const thumbWidth = 38;
    const maxSlide = trackWidth - thumbWidth - 4; // 2px margin on each side
    const slideX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          if (isDone) return;
          let newX = gestureState.dx;
          if (newX < 0) newX = 0;
          if (newX > maxSlide) newX = maxSlide;
          slideX.setValue(newX);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (isDone) return;
          if (gestureState.dx >= maxSlide * 0.85) {
            // Success slide
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Animated.timing(slideX, {
              toValue: maxSlide,
              duration: 120,
              useNativeDriver: false,
            }).start(() => {
              onComplete();
              slideX.setValue(0);
            });
          } else {
            // Reset position
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        },
      })
    ).current;

    if (isDone) {
      return (
        <TouchableOpacity
          style={[styles.sliderTrackCompleted, { backgroundColor: color }]}
          onPress={onComplete}
          activeOpacity={0.85}
        >
          <Text style={styles.sliderCompletedText}>✓ Completed Today! (Tap to Reset)</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.sliderTrack}>
        {/* Animated fill track following the thumb */}
        <Animated.View
          style={[
            styles.sliderFillTrack,
            {
              width: Animated.add(slideX, thumbWidth),
              backgroundColor: color,
              opacity: 0.35,
            },
          ]}
        />
        
        <Text style={styles.sliderPlaceholderText}>Slide to Check ➔</Text>

        {/* Right side check mark indicator target */}
        <View style={styles.sliderRightIndicator}>
          <Text style={styles.sliderRightIndicatorText}>✓</Text>
        </View>

        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: slideX }],
              backgroundColor: color,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.sliderThumbIcon}>🔥</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>Tracksy</Text>
          <Sparkles size={24} color={Colors.primary} fill={Colors.primary} />
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>{currentStreak} 🔥</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/notification-center" as any)}
            style={styles.bellBtn}
            activeOpacity={0.75}
          >
            <Bell size={22} color="#171717" />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: Colors.primary }]}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroLeft}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                <Text style={styles.speechBold}>Hey! {settings?.userName || "Kiro"} ⭐️</Text>{"\n"}
                Small stops today,{"\n"}Stronger you tomorrow!
              </Text>
              <View style={styles.speechTail} />
            </View>
            <LottieView
              source={getModifiedCookieDrinkLottie(Colors.primary)}
              autoPlay
              loop
              style={{ width: 180, height: 180, alignSelf: "center", marginTop: 4 }}
            />
          </View>
          <View style={styles.heroRight}>
            <CircularProgress value={currentStreak} maxValue={30} size={110} strokeWidth={12} color={Colors.primary} />
            <Text style={styles.bestStreakText}>Best: {bestStreak} days 👍</Text>
          </View>
        </View>

        {/* Week Day Strip */}
        {(() => {
          const nowDate = new Date();
          const day = nowDate.getDay();
          const mondayOffset = day === 0 ? -6 : 1 - day;
          const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(nowDate);
            d.setDate(nowDate.getDate() + mondayOffset + i);
            return d.toISOString().slice(0, 10);
          });
          const labels = ["M", "T", "W", "T", "F", "S", "S"];
          return (
            <View style={styles.weekStrip}>
              {weekDates.map((dateStr, i) => {
                const done = habits?.some(h => (h.logs || []).includes(dateStr));
                const isToday = dateStr === today;
                return (
                  <View key={i} style={styles.weekDayCol}>
                    <Text style={[styles.weekDayLabel, isToday && { color: Colors.primary }]}>{labels[i]}</Text>
                    <View style={[styles.weekDayDot, done && { backgroundColor: Colors.primary }, isToday && !done && { borderColor: Colors.primary, borderWidth: 2 }]}>
                      {done && <Text style={styles.weekDayCheck}>✓</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Habits</Text>
          <TouchableOpacity onPress={() => setShowViewAll(true)}>
            <Text style={[styles.editButton, { color: Colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.habitList}>
          {habits && habits.length > 0 ? (
            habits.map((habit) => {
              const habitLogs = habit.logs || [];
              const todayCount = habitLogs.filter((l) => l === today).length;
              const goal = habit.goal || 1;
              const isDone = todayCount >= goal;
              return (
                <View key={habit.id} style={styles.habitCard}>
                  {/* Habit info row */}
                  <TouchableOpacity 
                    style={styles.habitCardTop}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/habit/${habit.id}` as any)}
                  >
                    <View style={styles.habitIconContainer}>
                      <Text style={styles.habitIcon}>{habit.icon || "✨"}</Text>
                    </View>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      {habit.reminderTime ? <Text style={styles.habitReminder}>🔔 {habit.reminderTime}</Text> : null}
                      <Text style={styles.habitProgressText}>
                        {todayCount} / {goal} {habit.goalUnit || "done"}
                      </Text>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${Math.min((todayCount / goal) * 100, 100)}%`, backgroundColor: habit.color || "#F472B6" }]} />
                      </View>
                    </View>
                    {(() => {
                      const theme = getHabitLottieTheme(habit);
                      if (theme === "meditation") {
                        return (
                          <LottieView
                            source={require("@/assets/Meditating Monkey.json")}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "drink") {
                        const habitColor = habit.color || "#F472B6";
                        return (
                          <LottieView
                            source={getModifiedCookieDrinkLottie(habitColor)}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "running") {
                        const habitColor = habit.color || "#F472B6";
                        return (
                          <LottieView
                            source={getModifiedRunningPigeonLottie(habitColor)}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "sleeping") {
                        return (
                          <LottieView
                            source={require("@/assets/Panda sleeping waiting lottie animation.json")}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "tooth") {
                        return (
                          <LottieView
                            source={require("@/assets/Cartoon Tooth Character.json")}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "capsule") {
                        return (
                          <LottieView
                            source={require("@/assets/Capsule.json")}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "exercise") {
                        return (
                          <LottieView
                            source={require("@/assets/Exercising pull ups.json")}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "kids") {
                        return (
                          <LottieView
                            source={require("@/assets/Kids.json")}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      if (theme === "study") {
                        return (
                          <LottieView
                            source={require("@/assets/reading book.json")}
                            autoPlay
                            loop
                            style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                          />
                        );
                      }
                      // Show default lottie on home screen habit cards if no specific theme matches
                      return (
                        <LottieView
                          source={require("@/assets/Goal Achieved.json")}
                          autoPlay
                          loop
                          style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }}
                        />
                      );
                    })()}
                  </TouchableOpacity>

                  {/* Slide to check mark component */}
                  <View style={styles.habitCardBottom}>
                    <SlideToComplete
                      habit={habit}
                      isDone={isDone}
                      onComplete={() => toggleHabitDay(habit)}
                      color={habit.color || "#F472B6"}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No habits yet. Add one below!</Text>
          )}
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>

      {/* Full-screen Celebration Overlay */}
      {celebrationVisible && celebrationHabit && (() => {
        const goal = celebrationHabit.goal || 1;
        const goalUnit = celebrationHabit.goalUnit || "times";
        const habitLogs = celebrationHabit.logs || [];
        const baseCount = habitLogs.filter((l: any) => l === today).length;
        const todayCount = Math.max(baseCount, celebrationCount);
        const progressRatio = Math.min(todayCount / goal, 1);

        return (
          <Modal
          visible={celebrationVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={hideCelebration}
        >
          <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
              <Animated.View style={[styles.celebrationContainer, { opacity: celebrationOpacity, paddingBottom: 20, backgroundColor: "#FFFFFF" }]}>
              <SafeAreaView style={styles.celebrationSafeArea} edges={["top"]}>
                {/* Top Section: Habit Complete with Habit Name */}
                <View style={[styles.celebrationTopSection, { marginTop: 10 }]}>
                  <Text style={styles.celebrationTitle}>Habit Completed!</Text>
                  <Text style={styles.celebrationHabitName}>
                    {celebrationHabit.icon} {celebrationHabit.name}
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
                      backgroundColor: celebrationHabit.color || "#F472B6",
                      shadowColor: celebrationHabit.color || "#F472B6",
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.26,
                      shadowRadius: 18,
                      elevation: 5,
                    }}
                  />
                  {(() => {
                    const theme = getHabitLottieTheme(celebrationHabit);
                    if (theme === "meditation") {
                      return (
                        /* Meditating Monkey (Peaceful, no fire background) */
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
                        /* Mr. Cookie Drink (Cute, no fire background, unmatched different color) */
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
                        /* Running Pigeon (Cute, no fire background, unmatched different color) */
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
                        /* Sleeping Panda (Cute, no fire background) */
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
                        /* Cartoon Tooth (Cute, no fire background, unmatched different color) */
                        <LottieView
                          source={require("@/assets/Cartoon Tooth Character.json")}
                          autoPlay
                          loop
                          style={{ width: 210, height: 210 }}
                        />
                      );
                    }
                    if (theme === "capsule") {
                      return (
                        /* Capsule (No fire background) */
                        <LottieView
                          source={require("@/assets/Capsule.json")}
                          autoPlay
                          loop
                          style={{ width: 210, height: 210 }}
                        />
                      );
                    }
                    if (theme === "exercise") {
                      return (
                        /* Exercise (No fire background) */
                        <LottieView
                          source={require("@/assets/Exercising pull ups.json")}
                          autoPlay
                          loop
                          style={{ width: 210, height: 210 }}
                        />
                      );
                    }
                    if (theme === "kids") {
                      return (
                        <LottieView
                          source={require("@/assets/Kids.json")}
                          autoPlay
                          loop
                          style={{ width: 210, height: 210 }}
                        />
                      );
                    }
                    if (theme === "study") {
                      return (
                        <LottieView
                          source={require("@/assets/reading book.json")}
                          autoPlay
                          loop
                          style={{ width: 210, height: 210 }}
                        />
                      );
                    }
                    // Default Goal Achieved with Fire Background
                    return (
                      <>
                        {/* Background Fire Streak Lottie */}
                        <LottieView
                          source={require("@/assets/Fire Streak Orange.json")}
                          autoPlay
                          loop
                          style={styles.celebrationHeroBackground}
                        />

                        {/* Foreground Goal Achieved Lottie */}
                        <LottieView
                          source={require("@/assets/Goal Achieved.json")}
                          autoPlay
                          loop
                          style={{ width: 210, height: 210 }}
                        />
                      </>
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
                    {/* Progress fraction text */}
                    <Text style={styles.streakProgressFraction}>
                      {todayCount}<Text style={{ fontSize: 13, color: "#9CA3AF", fontWeight: "600" }}>/{goal} {goalUnit}</Text>
                    </Text>

                    {/* Horizontal progress bar */}
                    <View style={styles.streakProgressBarContainer}>
                      <View 
                        style={[
                          styles.streakProgressBarFill, 
                          { 
                            width: `${progressRatio * 100}%`, 
                            backgroundColor: celebrationHabit.color || "#F472B6" 
                          }
                        ]} 
                      />
                    </View>

                    {/* Weekday strip (Sun - Sat) with pink/grey checkmarks */}
                    <View style={styles.streakWeekRow}>
                      {sunToSatDates.map((dateStr, index) => {
                        const done = habitLogs.includes(dateStr);
                        return (
                          <View key={index} style={styles.streakWeekDayCol}>
                            <View 
                              style={[
                                styles.streakWeekDayDot, 
                                done && { backgroundColor: celebrationHabit.color || "#F472B6" }
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

                {/* Instant Photo Branding Footer */}
                <View style={{ alignItems: "center", marginTop: 40, marginBottom: 10 }}>
                  <Image source={require("@/assets/splash_logo.png")} style={{ width: 120, height: 36, resizeMode: "contain" }} />
                  <Text style={{ fontSize: 13, color: "#9CA3AF", fontWeight: "600", marginTop: 8 }}>Achieved by {settings.userName || "You"}</Text>
                </View>
              </SafeAreaView>
            </Animated.View>
          </ViewShot>

          {/* Share Button Top Right (Outside ViewShot) */}
          <TouchableOpacity 
            style={{ position: "absolute", top: 60, right: 20, zIndex: 50, width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: "#F3F4F6" }}
            onPress={captureAndShare}
          >
            <Share2 color={celebrationHabit.color || "#F472B6"} size={20} />
          </TouchableOpacity>

          {/* Bottom Section: Action Buttons (Outside ViewShot) */}
          <SafeAreaView edges={["bottom"]} style={{ width: "100%", paddingHorizontal: 24, paddingVertical: 20, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderColor: "#F3F4F6" }}>
            <TouchableOpacity 
              style={[styles.celebrationButton, { backgroundColor: celebrationHabit.color || "#F472B6" }]} 
              onPress={hideCelebration}
              activeOpacity={0.8}
            >
              <Text style={styles.celebrationButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </SafeAreaView>
          </View>
        </Modal>
        );
      })()}
    </SafeAreaView>

    {/* ── VIEW ALL HABITS MODAL ── */}
    <Modal visible={showViewAll} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top", "bottom"]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 24, paddingTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#171717' }}>
            All Habits
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => { setShowViewAll(false); router.push("/add-habit" as any); }} 
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 18, color: '#FFF', fontWeight: '700', lineHeight: 20 }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowViewAll(false)} 
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={habits || []}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, gap: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text style={{ fontSize: 40 }}>✨</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#475569", marginTop: 12 }}>No habits yet</Text>
              <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Tap + to add your first habit</Text>
            </View>
          }
          renderItem={({ item: habit }) => {
            const todayCount = (habit.logs || []).filter((l: string) => l === today).length;
            const goal = habit.goal || 1;
            const isDone = todayCount >= goal;
            return (
              <View style={styles.habitCard}>
                <TouchableOpacity 
                  style={styles.habitCardTop}
                  activeOpacity={0.7}
                  onPress={() => { setShowViewAll(false); router.push(`/habit/${habit.id}` as any); }}
                >
                  <View style={styles.habitIconContainer}>
                    <Text style={styles.habitIcon}>{habit.icon || "✨"}</Text>
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    {habit.reminderTime ? <Text style={styles.habitReminder}>🔔 {habit.reminderTime}</Text> : null}
                    <Text style={styles.habitProgressText}>
                      {todayCount} / {goal} {habit.goalUnit || "done"}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarFill, { width: `${Math.min((todayCount / goal) * 100, 100)}%`, backgroundColor: habit.color || "#F472B6" }]} />
                    </View>
                  </View>
                  {(() => {
                    const theme = getHabitLottieTheme(habit);
                    if (theme === "meditation") {
                      return <LottieView source={require("@/assets/Meditating Monkey.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "drink") {
                      const habitColor = habit.color || "#F472B6";
                      return <LottieView source={getModifiedCookieDrinkLottie(habitColor)} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "running") {
                      const habitColor = habit.color || "#F472B6";
                      return <LottieView source={getModifiedRunningPigeonLottie(habitColor)} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "sleeping") {
                      return <LottieView source={require("@/assets/Panda sleeping waiting lottie animation.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "tooth") {
                      return <LottieView source={require("@/assets/Cartoon Tooth Character.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "capsule") {
                      return <LottieView source={require("@/assets/Capsule.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "exercise") {
                      return <LottieView source={require("@/assets/Exercising pull ups.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "kids") {
                      return <LottieView source={require("@/assets/Kids.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    if (theme === "study") {
                      return <LottieView source={require("@/assets/reading book.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                    }
                    return <LottieView source={require("@/assets/Goal Achieved.json")} autoPlay loop style={{ width: 44, height: 44, marginLeft: 8, alignSelf: "center" }} />;
                  })()}
                </TouchableOpacity>

                <View style={styles.habitCardBottom}>
                  <SlideToComplete
                    habit={habit}
                    isDone={isDone}
                    onComplete={() => toggleHabitDay(habit)}
                    color={habit.color || "#F472B6"}
                  />
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  logoText: { fontSize: 26, fontWeight: "900", color: "#171717", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  streakBadge: { backgroundColor: "#FFF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  streakBadgeText: { fontSize: 14, fontWeight: "700", color: "#171717" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  heroSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 30, minHeight: 240 },
  heroLeft: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  speechBubble: { backgroundColor: "#FFF", padding: 12, borderRadius: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, maxWidth: 160 },
  speechText: { fontSize: 12, color: "#4B5563", lineHeight: 16 },
  speechBold: { fontWeight: "700", color: "#171717", fontSize: 13 },
  speechTail: { position: "absolute", bottom: -8, right: 40, width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#FFF" },
  dragonImage: { width: 140, height: 160 },
  heroRight: { alignItems: "center", justifyContent: "center", width: 140 },
  bestStreakText: { marginTop: 12, fontSize: 12, fontWeight: "600", color: "#6B7280" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#171717" },
  editButton: { fontSize: 14, fontWeight: "600", color: "#F472B6" },
  habitList: { gap: 16 },
  
  // Custom Slidable Cards
  habitCard: { backgroundColor: "#FFF", borderRadius: 24, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  habitCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  habitCardBottom: { width: "100%", marginTop: 4 },
  
  habitIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", marginRight: 16 },
  habitIcon: { fontSize: 20 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 15, fontWeight: "700", color: "#171717", marginBottom: 4 },
  habitReminder: { fontSize: 11, color: "#6B7280", fontWeight: "700", marginBottom: 2 },
  habitProgressText: { fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: "500" },
  progressBarContainer: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  
  // Slide Track Styling
  sliderTrack: { height: 42, backgroundColor: "#F1F5F9", borderRadius: 21, justifyContent: "center", paddingHorizontal: 3, position: "relative", borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  sliderFillTrack: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 21,
  },
  sliderPlaceholderText: { position: "absolute", alignSelf: "center", fontSize: 12, fontWeight: "800", color: "#94A3B8" },
  sliderRightIndicator: {
    position: "absolute",
    right: 12,
    alignSelf: "center",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderRightIndicatorText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
  },
  sliderThumb: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  sliderThumbIcon: { fontSize: 14 },
  
  // Completed slider bar
  sliderTrackCompleted: { height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", shadowColor: "#10B981", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
  sliderCompletedText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  
  addHabitButton: { backgroundColor: "#F472B6", borderRadius: 24, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, shadowColor: "#F472B6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  addHabitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#9CA3AF", marginTop: 20, fontStyle: "italic" },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  weekDayCol: { alignItems: "center", gap: 8 },
  weekDayLabel: { fontSize: 12, fontWeight: "700", color: "#9CA3AF" },
  weekDayDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayCheck: { fontSize: 13, color: "#FFF", fontWeight: "900" },

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
  celebrationSparkles: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  sparkleEmoji: { position: "absolute", top: 80, left: 40, fontSize: 28, opacity: 0.8 },
  sparkleEmoji2: { position: "absolute", top: 120, right: 40, fontSize: 28, opacity: 0.8 },
  sparkleEmoji3: { position: "absolute", bottom: 180, left: 50, fontSize: 28, opacity: 0.8 },
  sparkleEmoji4: { position: "absolute", bottom: 220, right: 50, fontSize: 28, opacity: 0.8 },
  
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

  // STREAK CARD STYLE (MATCHES USER IMAGE)
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
  streakFireEmoji: {
    fontSize: 22,
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
  celebrationHeroForeground: {
    width: 280,
    height: 280,
  },

  // Notification Bell Styles
  bellBtn: { position: "relative", padding: 4 },
  bellBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FAFAFA",
  },
  bellBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "900" },

  // View All Modal Styles
  viewAllHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
  },
  viewAllBack: { padding: 4 },
  viewAllTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B", letterSpacing: -0.4 },
  viewAllAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  viewAllCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  viewAllIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  viewAllHabitName: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 6 },
  viewAllProgressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewAllBarBg: { flex: 1, height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  viewAllBarFill: { height: "100%", borderRadius: 3 },
  viewAllCount: { fontSize: 12, fontWeight: "700" },
  viewAllBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  viewAllCheckBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5 },
  viewAllCheckTxt: { fontSize: 12, fontWeight: "800" },
});
