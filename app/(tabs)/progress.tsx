import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase, Habit } from "@/hooks/useDatabase";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.dineshmahidev.tracksy";

const isImageUri = (str?: string | null) => {
  if (!str) return false;
  return str.startsWith("http") || str.startsWith("file://") || str.startsWith("content://") || str.includes("/");
};

// Helper to get all dates in a month
const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export default function ProgressScreen() {
  const router = useRouter();
  const { habits, updateHabit, settings, Colors } = useDatabase();
  const [activeTab, setActiveTab] = useState<"Overview" | "Calendar" | "Stats">("Overview");
  
  // Share Ref for image capture
  const shareViewRef = useRef<View>(null);
  const shareMonthlyViewRef = useRef<View>(null);

  // Share monthly progress as captured Image
  const shareMonthlyProgressAsImage = async () => {
    if (!currentHabit) return;
    if (!shareMonthlyViewRef.current) {
      Alert.alert("Error", "Monthly share view is not fully loaded. Please try again.");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(shareMonthlyViewRef.current, {
        format: "png",
        quality: 0.95,
      });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Share my monthly progress for ${currentHabit.name}!`,
          mimeType: "image/png",
        });
      } else {
        Alert.alert("Sharing Unavailable", "Sharing is not supported on this device.");
      }
    } catch (error) {
      console.error("Error capturing/sharing monthly image:", error);
      Alert.alert("Error", "Could not generate shareable monthly progress image.");
    }
  };

  // Calendar States
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // User details
  const userName = settings?.userName || "User";
  const userImage = settings?.userImage;
  const userInitials = userName.charAt(0).toUpperCase();

  // Active habit for calendar
  const currentHabit = useMemo(() => {
    if (!habits || habits.length === 0) return null;
    if (selectedHabitId) {
      return habits.find(h => h.id === selectedHabitId) || habits[0];
    }
    return habits[0];
  }, [habits, selectedHabitId]);

  // Set default selected habit if not set
  React.useEffect(() => {
    if (habits && habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits, selectedHabitId]);

  // This week Mon-Sun
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const curr = new Date(today);
    const day = curr.getDay(); // 0=Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + mondayOffset + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  // Completion this week
  const weekCompletion = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    let done = 0;
    let total = 0;
    weekDates.forEach((dateStr) => {
      habits.forEach((h) => {
        total++;
        if ((h.logs || []).includes(dateStr)) done++;
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [habits, weekDates]);

  // Per-habit stats this week
  const habitStats = useMemo(() => {
    return (habits || []).map((h) => {
      const weekLogs = weekDates.filter((d) => (h.logs || []).includes(d)).length;
      const pct = Math.round((weekLogs / 7) * 100);
      return { ...h, weekLogs, pct };
    });
  }, [habits, weekDates]);

  // Week label e.g. "May 13 – May 19"
  const weekLabel = useMemo(() => {
    const fmt = (d: string) => {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    return `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  }, [weekDates]);

  // Which week-days have any habit done
  const weekDayDone = useMemo(() =>
    weekDates.map((d) => habits?.some((h) => (h.logs || []).includes(d)) ?? false),
    [habits, weekDates]
  );

  // Toggle habit log for a specific date (used in Calendar tab)
  const toggleDateLog = async (habit: Habit, dateStr: string) => {
    if (dateStr !== todayStr) {
      Alert.alert("Today Only", "You can only log or toggle completions for today's date!");
      return;
    }

    const currentLogs = [...(habit.logs || [])];
    const index = currentLogs.indexOf(dateStr);
    
    if (index > -1) {
      // Remove log (canser/cross/untick)
      currentLogs.splice(index, 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      // Add log (tik/check)
      currentLogs.push(dateStr);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await updateHabit(habit.id, { logs: currentLogs });
    } catch (e) {
      console.error("Error toggling habit date:", e);
    }
  };

  // Streak calculations
  const getStreakData = (logs: string[]) => {
    if (!logs || logs.length === 0) return { current: 0, best: 0 };
    
    // Sort logs chronologically
    const sortedLogs = [...logs].sort();
    
    let best = 0;
    let current = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Helper to calculate difference in days
    const diffInDays = (d1: Date, d2: Date) => {
      const ms = d1.getTime() - d2.getTime();
      return Math.round(ms / (1000 * 60 * 60 * 24));
    };

    sortedLogs.forEach((dateStr) => {
      const logDate = new Date(dateStr);
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diff = diffInDays(logDate, lastDate);
        if (diff === 1) {
          tempStreak += 1;
        } else if (diff > 1) {
          if (tempStreak > best) best = tempStreak;
          tempStreak = 1;
        }
      }
      lastDate = logDate;
    });

    if (tempStreak > best) best = tempStreak;

    // Calculate current streak relative to today
    const todayDate = new Date(todayStr);
    if (lastDate) {
      const diffFromToday = diffInDays(todayDate, lastDate);
      if (diffFromToday <= 1) {
        current = tempStreak;
      } else {
        current = 0;
      }
    }

    return { current, best };
  };

  // Today's stats helper
  const todayStats = useMemo(() => {
    if (!habits || habits.length === 0) return { rate: 0, completed: 0, total: 0 };
    const completed = habits.filter(h => (h.logs || []).includes(todayStr)).length;
    return {
      completed,
      total: habits.length,
      rate: Math.round((completed / habits.length) * 100)
    };
  }, [habits, todayStr]);

  // Share menu selector
  const handleSharePress = () => {
    if (!habits || habits.length === 0) {
      Alert.alert("No habits!", "Add habits first to share progress.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "📤 Share Progress",
      "Choose how you would like to share today's habit check-in:",
      [
        { text: "🖼 Share as Image Card", onPress: shareProgressAsImage },
        { text: "📄 Share as Text Report", onPress: shareProgressAsText },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Share today's checklist as Text
  const shareProgressAsText = async () => {
    let shareText = `🌟 *My Tracksy Daily Habit Check-in* 🌟\n📅 Date: ${today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

    habits.forEach((h) => {
      const logs = h.logs || [];
      const todayCount = logs.filter((l) => l === todayStr).length;
      const goal = h.goal || 1;
      const isDone = todayCount >= goal;
      if (isDone) {
        shareText += `✅ *${h.icon || "✨"} ${h.name}* — ${todayCount}/${goal} Done!\n`;
      } else if (todayCount > 0) {
        shareText += `⏳ *${h.icon || "✨"} ${h.name}* — ${todayCount}/${goal} In Progress\n`;
      } else {
        shareText += `❌ *${h.icon || "✨"} ${h.name}* — ${todayCount}/${goal} Missed\n`;
      }
    });

    shareText += `\n🔥 *Today's Score: ${todayStats.rate}%* (${todayStats.completed}/${todayStats.total} habits completed)\n`;
    shareText += `\n📥 Download Tracksy: ${PLAY_STORE_URL}`;

    try {
      await Share.share({
        message: shareText,
        title: "Tracksy Daily Habit Progress",
      });
    } catch (error) {
      console.error("Error sharing text progress:", error);
    }
  };

  // Share today's checklist as captured Image
  const shareProgressAsImage = async () => {
    if (!shareViewRef.current) {
      Alert.alert("Error", "Share view is not fully loaded. Please try again.");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(shareViewRef.current, {
        format: "png",
        quality: 0.95,
      });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: "Share my Tracksy progress today!",
          mimeType: "image/png",
        });
      } else {
        Alert.alert("Sharing Unavailable", "Sharing is not supported on this device.");
      }
    } catch (error) {
      console.error("Error capturing/sharing image:", error);
      Alert.alert("Error", "Could not generate shareable progress image.");
    }
  };

  // Calendar render helper
  const renderCalendarTab = () => {
    if (!habits || habits.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No habits found. Create habits in the Habits tab to view calendar tracking.</Text>
        </View>
      );
    }

    if (!currentHabit) return null;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const days = getDaysInMonth(year, month);
    const monthName = calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" });

    // Determine leading empty spots in calendar (Monday aligned as index 0)
    const firstDayIndex = (days[0].getDay() + 6) % 7; 

    return (
      <View style={styles.tabContent}>
        {/* Habit selector chips */}
        <Text style={styles.sectionTitle}>Select Habit to Track</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitSelectScroll} contentContainerStyle={styles.habitSelectContent}>
          {habits.map((h) => (
            <TouchableOpacity
              key={h.id}
              style={[
                styles.habitSelectChip,
                selectedHabitId === h.id && { backgroundColor: h.color + "15", borderColor: h.color, borderWidth: 1.5 }
              ]}
              onPress={() => {
                setSelectedHabitId(h.id);
                Haptics.selectionAsync();
              }}
            >
              <Text style={styles.habitSelectEmoji}>{h.icon || "✨"}</Text>
              <Text style={[styles.habitSelectText, selectedHabitId === h.id && { color: h.color, fontWeight: "800" }]}>
                {h.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Month Navigator Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => {
              setCalendarDate(new Date(year, month - 1, 1));
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.monthNavTxt}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => {
              setCalendarDate(new Date(year, month + 1, 1));
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.monthNavTxt}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {/* Weekday labels */}
          <View style={styles.weekdayRow}>
            {DAYS.map(d => (
              <Text key={d} style={styles.weekdayLabel}>{d}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Leading empty spots */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
            ))}

            {/* Calendar days */}
            {days.map((dateObj) => {
              const dateStr = dateObj.toISOString().slice(0, 10);
              const isLogged = (currentHabit.logs || []).includes(dateStr);
              const isDateToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isDateToday && styles.dayCellToday,
                  ]}
                  onPress={() => toggleDateLog(currentHabit, dateStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayCellText,
                    isDateToday && { color: Colors.primary, fontWeight: "900" },
                  ]}>
                    {dateObj.getDate()}
                  </Text>
                  <View style={[
                    styles.statusIndicator,
                    isLogged ? { backgroundColor: currentHabit.color || "#10B981" } : styles.statusIndicatorMissed
                  ]}>
                    <Text style={[styles.indicatorText, !isLogged && { color: "#94A3B8" }]}>{isLogged ? "✓" : "✕"}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <Text style={styles.calendarCaption}>💡 Tap any calendar day to toggle completion (✓ Done / ✕ Missed)</Text>
      </View>
    );
  };

  // Stats / Streaks render helper
  const renderStatsTab = () => {
    if (!habits || habits.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📈</Text>
          <Text style={styles.emptyText}>No stats available. Create habits to start tracking metrics.</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>🏆 Streaks & Logs</Text>
        {habits.map((h) => {
          const { current, best } = getStreakData(h.logs || []);
          const totalCompletions = (h.logs || []).length;
          const color = h.color || Colors.primary;

          return (
            <View key={h.id} style={styles.statsCard}>
              <View style={styles.statsCardHeader}>
                <View style={[styles.habitIconWrap, { backgroundColor: color + "15" }]}>
                  <Text style={styles.habitEmoji}>{h.icon || "✨"}</Text>
                </View>
                <Text style={styles.statsHabitName}>{h.name}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>🔥 {current}d</Text>
                  <Text style={styles.statLbl}>Current Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>🏆 {best}d</Text>
                  <Text style={styles.statLbl}>Best Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>📈 {totalCompletions}</Text>
                  <Text style={styles.statLbl}>Total Done</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Dynamic Profile Header (White Theme & User Profile) */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          {isImageUri(userImage) ? (
            <Image source={{ uri: userImage || undefined }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: "#F1F5F9" }]}>
              <Text style={{ fontSize: 22 }}>{userImage || "🐉"}</Text>
            </View>
          )}
          <View style={styles.profileMeta}>
            <Text style={styles.profileWelcome}>Hello,</Text>
            <Text style={styles.profileName}>{userName}</Text>
          </View>
        </View>

      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {(["Overview", "Calendar", "Stats"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab(tab);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: Colors.primary }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "Overview" && (
          <>
            {/* This Week Banner */}
            <View style={styles.weekBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.weekTitle}>This Week</Text>
                <Text style={styles.weekRange}>{weekLabel}</Text>
              </View>
              <View style={styles.completionBox}>
                <Text style={[styles.completionPct, { color: Colors.primary }]}>{weekCompletion}%</Text>
                <Text style={styles.completionLabel}>Completion</Text>
              </View>
            </View>

            {/* Day Strip */}
            <View style={styles.dayStrip}>
              {DAYS.map((d, i) => (
                <View key={i} style={styles.dayCol}>
                  <Text style={styles.dayLabel}>{d[0]}</Text>
                  <View style={[styles.dayDot, weekDayDone[i] && { backgroundColor: Colors.primary }]}>
                    {weekDayDone[i] && <Text style={styles.dayCheck}>✓</Text>}
                  </View>
                </View>
              ))}
            </View>



            {/* Habit Performance */}
            <Text style={styles.sectionTitle}>Habit Performance</Text>

            {habitStats.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>No habits yet. Add some to track progress!</Text>
              </View>
            ) : (
              habitStats.map((h) => (
                <TouchableOpacity key={h.id} style={styles.habitRow} activeOpacity={0.7} onPress={() => router.push(`/habit/${h.id}`)}>
                  <View style={styles.habitRowLeft}>
                    <View style={[styles.habitIconWrap, { backgroundColor: (h.color || Colors.primary) + "15" }]}>
                      <Text style={styles.habitEmoji}>{h.icon || "✨"}</Text>
                    </View>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitName}>{h.name}</Text>
                      {h.reminderTime ? <Text style={styles.habitReminder}>🔔 {h.reminderTime}</Text> : null}
                      <Text style={styles.habitSub}>
                        {h.weekLogs} / 7 days
                      </Text>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${h.pct}%`,
                              backgroundColor: h.color || Colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.pctText, { color: h.color || Colors.primary }]}>
                    {h.pct}%
                  </Text>
                </TouchableOpacity>
              ))
            )}

          </>
        )}

        {activeTab === "Calendar" && renderCalendarTab()}

        {activeTab === "Stats" && renderStatsTab()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Premium Share Cards (Rendered in White Theme, always mounted, hidden off-screen) */}
      <View style={styles.hiddenShareContainer} pointerEvents="none">
        <View ref={shareViewRef} style={styles.shareCardImage}>
          <LinearGradient
            colors={["#FFFFFF", "#F8FAFC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shareGradient}
          >
            {/* Top Share Card Branding */}
            <View style={styles.shareBrandingRow}>
              <LinearGradient
                colors={Colors.gradient || ["#F472B6", "#EC4899"]}
                style={[styles.shareLogoCircle, { shadowColor: Colors.primary }]}
              >
                <Text style={styles.shareLogoTick}>✓</Text>
              </LinearGradient>
              <View style={styles.shareBrandingMeta}>
                <Text style={[styles.shareAppName, { color: "#1E293B" }]}>Tracksy</Text>
                <Text style={styles.shareAppSubtitle}>Habit Tracker</Text>
              </View>
            </View>

            {/* Share Card User Profile Row */}
            <View style={styles.shareUserRow}>
              {isImageUri(userImage) ? (
                <Image source={{ uri: userImage || undefined }} style={styles.shareUserAvatar} />
              ) : (
                <View style={[styles.shareUserAvatarPlaceholder, { backgroundColor: "#F1F5F9" }]}>
                  <Text style={{ fontSize: 18 }}>{userImage || "🐉"}</Text>
                </View>
              )}
              <View style={styles.shareUserMeta}>
                <Text style={styles.shareUserNameText}>{userName}'s Daily Track</Text>
                <Text style={styles.shareUserSubtitle}>Today's Achievements</Text>
              </View>
            </View>

            {/* App UI Phone Mockup Card (White Theme) */}
            <View style={[styles.phoneMockup, { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }]}>
              {/* Phone Status Bar Notch */}
              <View style={styles.phoneStatusRow}>
                <Text style={[styles.phoneTimeText, { color: "#64748B" }]}>09:41</Text>
                <View style={[styles.phoneNotch, { backgroundColor: "#E2E8F0" }]} />
                <View style={styles.phoneIconsRow}>
                  <Text style={[styles.phoneIconSmall, { color: "#64748B" }]}>📶</Text>
                  <Text style={[styles.phoneIconSmall, { color: "#64748B" }]}>🔋</Text>
                </View>
              </View>

              {/* Phone UI Contents */}
              <View style={styles.phoneBody}>
                <Text style={[styles.phoneHeaderDate, { color: Colors.primary }]}>
                  {today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </Text>
                <Text style={[styles.phoneTitleText, { color: "#1E293B" }]}>Daily Checklist</Text>

                {/* Glowing Progress Circle */}
                <View style={styles.phoneProgressContainer}>
                  <LinearGradient
                    colors={[`${Colors.primary}12`, `${Colors.primary}08`]}
                    style={[styles.phoneProgressCircle, { borderColor: Colors.primary }]}
                  >
                    <Text style={[styles.phoneProgressVal, { color: Colors.primary }]}>{todayStats.rate}%</Text>
                    <Text style={[styles.phoneProgressLbl, { color: "#64748B" }]}>Completed</Text>
                  </LinearGradient>
                </View>

                {/* Habits List in Phone UI */}
                <View style={styles.phoneHabitsList}>
                  {habits.slice(0, 3).map((h) => {
                    const logs = h.logs || [];
                    const todayCount = logs.filter((l) => l === todayStr).length;
                    const goal = h.goal || 1;
                    const isDone = todayCount >= goal;
                    return (
                      <View key={h.id} style={[styles.phoneHabitRow, { backgroundColor: "#F8FAFC", borderColor: "#F1F5F9", flexDirection: "row", alignItems: "center" }]}>
                        <Text style={styles.phoneHabitEmoji}>{h.icon || "✨"}</Text>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[styles.phoneHabitName, { color: "#1E293B", marginBottom: 2 }, isDone && styles.phoneHabitNameDone]} numberOfLines={1}>
                            {h.name}
                          </Text>
                          {/* Small progress bar */}
                          <View style={{ height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, overflow: "hidden", width: "80%" }}>
                            <View style={{ height: "100%", width: `${Math.min((todayCount / goal) * 100, 100)}%`, backgroundColor: h.color || Colors.primary }} />
                          </View>
                        </View>
                        <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: isDone ? (h.color || Colors.primary) : "#64748B" }}>
                            {todayCount}/{goal}
                          </Text>
                        </View>
                        <View style={[styles.phoneStatusBox, isDone ? { backgroundColor: h.color || Colors.primary } : { backgroundColor: "#CBD5E1" }]}>
                          <Text style={styles.phoneStatusCheck}>{isDone ? "✓" : todayCount > 0 ? "⏳" : "✕"}</Text>
                        </View>
                      </View>
                    );
                  })}
                  {habits.length === 0 && (
                    <Text style={[styles.phoneEmptyText, { color: "#64748B" }]}>No habits tracked today</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Play Store & Download Badge */}
            <View style={styles.shareFooterBlock}>
              <View style={[styles.playStoreBadge, { borderColor: "#E2E8F0" }]}>
                {/* Stylized Google Play Colored Triangle Icon */}
                <View style={styles.playLogoContainer}>
                  <View style={styles.playTriangleTop} />
                  <View style={styles.playTriangleRight} />
                  <View style={styles.playTriangleBottom} />
                  <View style={styles.playTriangleLeft} />
                </View>
                <View style={styles.playBadgeTextColumn}>
                  <Text style={styles.playBadgeSmallTxt}>GET IT ON</Text>
                  <Text style={styles.playBadgeLargeTxt}>Google Play</Text>
                </View>
              </View>
              <Text style={[styles.playStoreLinkText, { color: "#64748B" }]}>{PLAY_STORE_URL}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Premium Hidden Shareable Monthly Card */}
        {currentHabit && (() => {
          const year = calendarDate.getFullYear();
          const month = calendarDate.getMonth();
          const days = getDaysInMonth(year, month);
          const monthName = calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" });
          const firstDayIndex = (days[0].getDay() + 6) % 7; 
          const habitLogs = currentHabit.logs || [];
          const monthLogs = days.filter(d => habitLogs.includes(d.toISOString().slice(0, 10))).length;
          const completionRate = Math.round((monthLogs / days.length) * 100);

          return (
            <View ref={shareMonthlyViewRef} style={styles.shareCardImage}>
              <LinearGradient
                colors={["#FFFFFF", "#F8FAFC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareGradient}
              >
                {/* Top Branding Row */}
                <View style={styles.shareBrandingRow}>
                  <LinearGradient
                    colors={Colors.gradient || ["#F472B6", "#EC4899"]}
                    style={[styles.shareLogoCircle, { shadowColor: Colors.primary }]}
                  >
                    <Text style={styles.shareLogoTick}>✓</Text>
                  </LinearGradient>
                  <View style={styles.shareBrandingMeta}>
                    <Text style={[styles.shareAppName, { color: "#1E293B" }]}>Tracksy</Text>
                    <Text style={styles.shareAppSubtitle}>Habit Tracker</Text>
                  </View>
                </View>

                {/* User & Habit Details Row */}
                <View style={styles.shareUserRow}>
                  {isImageUri(userImage) ? (
                    <Image source={{ uri: userImage || undefined }} style={styles.shareUserAvatar} />
                  ) : (
                    <View style={[styles.shareUserAvatarPlaceholder, { backgroundColor: `${Colors.primary}15` }]}>
                      {userImage && !isImageUri(userImage) ? (
                        <Text style={{ fontSize: 18 }}>{userImage}</Text>
                      ) : (
                        <Text style={{ color: Colors.primary, fontWeight: "900", fontSize: 14 }}>{userInitials}</Text>
                      )}
                    </View>
                  )}
                  <View style={styles.shareUserMeta}>
                    <Text style={styles.shareUserNameText}>{userName}'s Monthly Track</Text>
                    <Text style={styles.shareUserSubtitle}>
                      {currentHabit.icon} {currentHabit.name} — {monthName}
                    </Text>
                  </View>
                </View>

                {/* Phone/UI Mockup Calendar (White Theme) */}
                <View style={styles.phoneCalendarMockup}>
                  {/* Title & Stats */}
                  <View style={styles.phoneCalendarStatsRow}>
                    <Text style={styles.phoneCalendarTitle}>{monthName}</Text>
                    <View style={[styles.phoneCalendarBadge, { backgroundColor: `${Colors.primary}15` }]}>
                      <Text style={[styles.phoneCalendarBadgeText, { color: Colors.primary }]}>{completionRate}% Done</Text>
                    </View>
                  </View>

                  {/* Calendar weekday labels */}
                  <View style={styles.phoneWeekdayRow}>
                    {DAYS.map(d => (
                      <Text key={d} style={styles.phoneWeekdayLabel}>{d[0]}</Text>
                    ))}
                  </View>

                  {/* Calendar Grid of days */}
                  <View style={styles.phoneDaysGrid}>
                    {Array.from({ length: firstDayIndex }).map((_, idx) => (
                      <View key={`empty-${idx}`} style={styles.phoneDayCellEmpty} />
                    ))}

                    {days.map((dateObj) => {
                      const dateStr = dateObj.toISOString().slice(0, 10);
                      const isLogged = habitLogs.includes(dateStr);
                      return (
                        <View key={dateStr} style={styles.phoneDayCell}>
                          <Text style={styles.phoneDayCellText}>{dateObj.getDate()}</Text>
                          <View style={[
                            styles.phoneStatusIndicator,
                            isLogged ? { backgroundColor: currentHabit.color || "#10B981" } : { backgroundColor: "#F1F5F9" }
                          ]}>
                            <Text style={[styles.phoneIndicatorText, !isLogged && { color: "#94A3B8" }]}>{isLogged ? "✓" : "✕"}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Play Store & Download Badge */}
                <View style={styles.shareFooterBlock}>
                  <View style={[styles.playStoreBadge, { borderColor: "#E2E8F0" }]}>
                    <View style={styles.playLogoContainer}>
                      <View style={styles.playTriangleTop} />
                      <View style={styles.playTriangleRight} />
                      <View style={styles.playTriangleBottom} />
                      <View style={styles.playTriangleLeft} />
                    </View>
                    <View style={styles.playBadgeTextColumn}>
                      <Text style={styles.playBadgeSmallTxt}>GET IT ON</Text>
                      <Text style={styles.playBadgeLargeTxt}>Google Play</Text>
                    </View>
                  </View>
                  <Text style={[styles.playStoreLinkText, { color: "#64748B" }]}>{PLAY_STORE_URL}</Text>
                </View>
              </LinearGradient>
            </View>
          );
        })()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Crisp Premium White Theme Base Style
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileImage: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#F1F5F9" },
  profileImagePlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  profileInitials: { fontSize: 18, color: "#FFF", fontWeight: "900" },
  profileMeta: { justifyContent: "center" },
  profileWelcome: { fontSize: 11, color: "#94A3B8", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  profileName: { fontSize: 16, fontWeight: "900", color: "#1E293B", letterSpacing: -0.3 },
  shareHeaderBtn: { backgroundColor: "#F472B615", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  shareHeaderTxt: { color: "#F472B6", fontSize: 13, fontWeight: "800" },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 24,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 4,
    marginVertical: 16,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  tabBtnActive: { backgroundColor: "#FFF", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#F472B6" },

  scrollContent: { paddingHorizontal: 20 },

  weekBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  weekTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  weekRange: { fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: "600" },
  completionBox: { alignItems: "flex-end" },
  completionPct: { fontSize: 28, fontWeight: "900", color: "#F472B6" },
  completionLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "700" },

  dayStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  dayCol: { alignItems: "center", gap: 8 },
  dayLabel: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotDone: { backgroundColor: "#F472B6" },
  dayCheck: { fontSize: 14, color: "#FFF", fontWeight: "800" },

  shareCardCTA: {
    backgroundColor: "#FFF0F6",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFDEEB",
  },
  shareCTATitle: { fontSize: 14, fontWeight: "800", color: "#C1185B", marginBottom: 2 },
  shareCTADesc: { fontSize: 11, color: "#E91E63", opacity: 0.8, lineHeight: 15 },
  shareCTAButton: { backgroundColor: "#E91E63", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  shareCTAButtonTxt: { color: "#FFF", fontSize: 12, fontWeight: "800" },

  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 12, marginTop: 4 },

  habitRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  habitRowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  habitIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  habitEmoji: { fontSize: 20 },
  habitMeta: { flex: 1 },
  habitName: { fontSize: 14, fontWeight: "800", color: "#1E293B", marginBottom: 2 },
  habitReminder: { fontSize: 11, color: "#64748B", fontWeight: "700", marginBottom: 2 },
  habitSub: { fontSize: 12, color: "#64748B", marginBottom: 8, fontWeight: "600" },
  barBg: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  pctText: { fontSize: 14, fontWeight: "900", marginLeft: 12 },

  emptyBox: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20, fontWeight: "600" },

  // Calendar specific styles
  tabContent: { paddingBottom: 20 },
  habitSelectScroll: { marginBottom: 18, marginHorizontal: -20 },
  habitSelectContent: { paddingHorizontal: 20, gap: 8 },
  habitSelectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  habitSelectEmoji: { fontSize: 16 },
  habitSelectText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  monthTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B", letterSpacing: -0.3 },
  monthNavBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  monthNavTxt: { fontSize: 12, color: "#64748B" },
  calendarCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 14,
  },
  weekdayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  weekdayLabel: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "800", color: "#94A3B8" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  dayCell: { width: "14%", height: 56, alignItems: "center", justifyContent: "center", marginVertical: 4, gap: 4 },
  dayCellEmpty: { width: "14%", height: 56 },
  dayCellToday: { backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  dayCellText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  dayCellTextToday: { color: "#F472B6", fontWeight: "900" },
  statusIndicator: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statusIndicatorMissed: { backgroundColor: "#F1F5F9" },
  indicatorText: { fontSize: 11, color: "#FFF", fontWeight: "800" },
  calendarCaption: { fontSize: 11, color: "#64748B", fontWeight: "600", textAlign: "center", marginTop: 4 },

  // Stats tab specific styles
  statsCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 12,
  },
  statsCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  statsHabitName: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statBox: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  statLbl: { fontSize: 10, color: "#64748B", fontWeight: "700", marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: "#F1F5F9" },

  // Premium Hidden Shareable Card Styles
  hiddenShareContainer: { position: "absolute", left: -9999, top: -9999, opacity: 0 },
  shareCardImage: { width: 380, height: 660, borderRadius: 32, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0" },
  shareGradient: { flex: 1, padding: 24, justifyContent: "space-between", alignItems: "center" },
  
  // Branding
  shareBrandingRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", paddingHorizontal: 4 },
  shareLogoCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", shadowColor: "#F472B6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  shareLogoTick: { fontSize: 18, color: "#FFF", fontWeight: "900" },
  shareBrandingMeta: { justifyContent: "center" },
  shareAppName: { fontSize: 18, fontWeight: "900", color: "#FFF", letterSpacing: -0.5 },
  shareAppSubtitle: { fontSize: 10, color: "#94A3B8", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  // Share Card User Row
  shareUserRow: { flexDirection: "row", alignItems: "center", width: "100%", gap: 12, paddingHorizontal: 4, marginTop: 12 },
  shareUserAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: "#E2E8F0" },
  shareUserAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  shareUserMeta: { justifyContent: "center" },
  shareUserNameText: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  shareUserSubtitle: { fontSize: 10, color: "#64748B", fontWeight: "600" },

  // Phone Mockup Layout representing the App UI
  phoneMockup: { width: "100%", height: 320, backgroundColor: "#0F172A", borderRadius: 28, borderWidth: 6, borderColor: "#334155", padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8, marginTop: 14, marginBottom: 14 },
  phoneStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, marginBottom: 10 },
  phoneTimeText: { fontSize: 10, color: "#94A3B8", fontWeight: "700" },
  phoneNotch: { width: 50, height: 12, backgroundColor: "#334155", borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  phoneIconsRow: { flexDirection: "row", gap: 4 },
  phoneIconSmall: { fontSize: 8 },
  phoneBody: { flex: 1 },
  phoneHeaderDate: { fontSize: 10, color: "#F472B6", fontWeight: "800", textTransform: "uppercase" },
  phoneTitleText: { fontSize: 18, fontWeight: "900", color: "#FFF", marginTop: 2, marginBottom: 10 },
  phoneProgressContainer: { alignItems: "center", marginVertical: 10 },
  phoneProgressCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#F472B6" },
  phoneProgressVal: { fontSize: 24, fontWeight: "900", color: "#FFF" },
  phoneProgressLbl: { fontSize: 9, color: "#94A3B8", fontWeight: "700" },
  phoneHabitsList: { gap: 8, marginTop: 6 },
  phoneHabitRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#334155" },
  phoneHabitEmoji: { fontSize: 14, marginRight: 8 },
  phoneHabitName: { flex: 1, fontSize: 12, fontWeight: "700", color: "#FFF" },
  phoneHabitNameDone: { textDecorationLine: "line-through", color: "#94A3B8", opacity: 0.7 },
  phoneStatusBox: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  phoneStatusDone: { backgroundColor: "#10B981" },
  phoneStatusPending: { backgroundColor: "#334155" },
  phoneStatusCheck: { fontSize: 9, color: "#FFF", fontWeight: "800" },
  phoneEmptyText: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 10 },

  // Play Store Footer
  shareFooterBlock: { alignItems: "center", width: "100%", gap: 6 },
  playStoreBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#000", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: "#334155", gap: 8 },
  playLogoContainer: { width: 20, height: 20, position: "relative" },
  playTriangleTop: { position: "absolute", top: 0, left: 2, width: 0, height: 0, borderStyle: "solid", borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 10, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#00E676" },
  playTriangleRight: { position: "absolute", top: 2, left: 4, width: 0, height: 0, borderStyle: "solid", borderLeftWidth: 10, borderTopWidth: 8, borderBottomWidth: 8, borderLeftColor: "#FFC107", borderTopColor: "transparent", borderBottomColor: "transparent" },
  playTriangleBottom: { position: "absolute", bottom: 0, left: 2, width: 0, height: 0, borderStyle: "solid", borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#FF3D00" },
  playTriangleLeft: { position: "absolute", top: 2, left: 0, width: 0, height: 0, borderStyle: "solid", borderRightWidth: 10, borderTopWidth: 8, borderBottomWidth: 8, borderRightColor: "#00B0FF", borderTopColor: "transparent", borderBottomColor: "transparent" },
  playBadgeTextColumn: { justifyContent: "center" },
  playBadgeSmallTxt: { fontSize: 6, color: "#FFF", fontWeight: "600", letterSpacing: 0.5 },
  playBadgeLargeTxt: { fontSize: 12, color: "#FFF", fontWeight: "900", marginTop: -1 },
  playStoreLinkText: { fontSize: 9, color: "#94A3B8", fontWeight: "600", marginTop: 4, textAlign: "center" },

  // Monthly Progress Sharing styles
  shareMonthBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  shareMonthBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  phoneCalendarMockup: {
    width: "100%",
    height: 330,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 10,
    marginBottom: 10,
  },
  phoneCalendarStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  phoneCalendarTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
  },
  phoneCalendarBadge: {
    backgroundColor: "#FFF0F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  phoneCalendarBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F472B6",
  },
  phoneWeekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  phoneWeekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
  },
  phoneDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  phoneDayCell: {
    width: "14%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  phoneDayCellEmpty: {
    width: "14%",
    height: 40,
  },
  phoneDayCellText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
  },
  phoneStatusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneIndicatorText: {
    fontSize: 8,
    color: "#FFF",
    fontWeight: "900",
  },
});
