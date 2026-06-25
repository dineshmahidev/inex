import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Plus, Bell, Minus, Check, Clock, ChevronDown } from "lucide-react-native";
import { useDatabase } from "@/hooks/useDatabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  scheduleHabitNotification,
  cancelReminderNotification,
} from "@/utils/notifications";

export default function AddHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { habits, addHabit, updateHabit, Colors } = useDatabase();

  const editingHabit = id ? habits.find((h) => h.id === id) : null;

  const [habitName, setHabitName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("💧");
  const [goal, setGoal] = useState(8);
  const [goalUnit, setGoalUnit] = useState("times");
  const [selectedColor, setSelectedColor] = useState(Colors?.primary || "#F472B6");
  const [challengeDays, setChallengeDays] = useState<number | "Custom">(30);
  const [customDays, setCustomDays] = useState("");

  const [isEnteringCustomEmoji, setIsEnteringCustomEmoji] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");

  // Dropdown states for Daily Target Goal
  const [unitOption, setUnitOption] = useState("times"); // "times" | "glass" | "hours" | "minutes" | "Other"
  const [customUnit, setCustomUnit] = useState("");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  // Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // State for manual target goal input focus
  const [isGoalInputFocused, setIsGoalInputFocused] = useState(false);

  const icons = ["💧", "🏋️", "🏃", "🧘", "🌙", "📚", "🍎", "💊", "💸", "🎨", "🎵", "✍️", "💻", "🪴", "🥑", "🦷", "🪥"];
  const colors = ["#F472B6", "#FB923C", "#FBBF24", "#34D399", "#2DD4BF", "#60A5FA", "#A78BFA"];

  // Populate form if editing
  useEffect(() => {
    if (editingHabit) {
      setHabitName(editingHabit.name || "");
      setSelectedIcon(editingHabit.icon || "💧");
      setGoal(editingHabit.goal || 8);
      setSelectedColor(editingHabit.color || "#F472B6");

      if (editingHabit.challenge) {
        const match = editingHabit.challenge.match(/^(\d+) Days$/);
        if (match) {
          const days = parseInt(match[1]);
          if ([10, 30, 90, 100].includes(days)) {
            setChallengeDays(days);
          } else {
            setChallengeDays("Custom");
            setCustomDays(String(days));
          }
        }
      }

      // Populate goal unit dropdown states
      const unit = editingHabit.goalUnit || "times";
      if (["times", "glass", "hours", "minutes"].includes(unit)) {
        setUnitOption(unit);
        setGoalUnit(unit);
      } else {
        setUnitOption("Other");
        setGoalUnit(unit);
        setCustomUnit(unit);
      }

      // Populate reminder time
      if (editingHabit.reminderTime) {
        const [h, m] = editingHabit.reminderTime.split(":");
        const d = new Date();
        d.setHours(parseInt(h, 10));
        d.setMinutes(parseInt(m, 10));
        setReminderTime(d);
        setReminderEnabled(true);
      } else {
        setReminderEnabled(false);
        const d = new Date();
        d.setHours(8, 0, 0); // Default to 8:00 AM
        setReminderTime(d);
      }
    } else {
      const d = new Date();
      d.setHours(8, 0, 0); // Default to 8:00 AM
      setReminderTime(d);
    }
  }, [editingHabit]);

  const formatTime12h = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
  };

  const handleSave = async () => {
    if (!habitName.trim()) return;

    let reminderTimeString: string | undefined = undefined;
    if (reminderEnabled) {
      const h = reminderTime.getHours().toString().padStart(2, "0");
      const m = reminderTime.getMinutes().toString().padStart(2, "0");
      reminderTimeString = `${h}:${m}`;
    }

    const finalGoalUnit = unitOption === "Other" ? (customUnit.trim() || "times") : unitOption;

    const habitData = {
      name: habitName,
      icon: selectedIcon,
      color: selectedColor,
      goal: goal,
      goalUnit: finalGoalUnit,
      challenge: challengeDays === "Custom" ? `${customDays || 30} Days` : `${challengeDays} Days`,
      reminderTime: reminderTimeString,
    };

    if (editingHabit) {
      await updateHabit(editingHabit.id, habitData);
      if (reminderEnabled && reminderTimeString) {
        await scheduleHabitNotification(editingHabit.id, habitName, reminderTimeString, goal, finalGoalUnit);
      } else {
        await cancelReminderNotification(editingHabit.id);
      }
    } else {
      const newId = await addHabit(habitData);
      if (reminderEnabled && reminderTimeString) {
        await scheduleHabitNotification(newId, habitName, reminderTimeString, goal, finalGoalUnit);
      }
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Row / Header replacement */}
        <View style={styles.sheetTitleRow}>
          <Text style={styles.sheetTitle}>{editingHabit ? "✏️ Edit Habit" : "🎯 New Habit"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.sheetClose}>
            <Text style={styles.sheetCloseTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Habit Name */}
        <Text style={styles.label}>📝 Habit Name</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Drink Water, Cardio, Read"
            placeholderTextColor="#94A3B8"
            value={habitName}
            onChangeText={setHabitName}
          />
        </View>

        {/* Icon Picker */}
        <Text style={styles.label}>🎨 Icon Picker</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.iconScrollContent}
          style={styles.iconScrollView}
        >
          {icons.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconButton,
                selectedIcon === icon && {
                  backgroundColor: selectedColor + "15",
                  borderColor: selectedColor,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}

          {isEnteringCustomEmoji ? (
            <View style={styles.customEmojiInputContainer}>
              <TextInput
                style={styles.customEmojiInput}
                autoFocus
                maxLength={2}
                value={customEmoji}
                onChangeText={(text) => {
                  setCustomEmoji(text);
                  if (text.length > 0) {
                    setSelectedIcon(text);
                  }
                }}
                onBlur={() => setIsEnteringCustomEmoji(false)}
              />
            </View>
          ) : (
            <TouchableOpacity style={styles.iconButtonOutline} onPress={() => setIsEnteringCustomEmoji(true)}>
              <Plus size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Goal Selector */}
        <View style={styles.row}>
          <Text style={styles.labelInline}>🎯 Daily Target Goal</Text>
          <View style={styles.goalControls}>
            <TouchableOpacity style={styles.goalBtn} onPress={() => setGoal(Math.max(1, goal - 1))}>
              <Minus size={16} color={selectedColor} />
            </TouchableOpacity>
            
            <TextInput
              style={[
                styles.goalInput,
                isGoalInputFocused && {
                  borderColor: selectedColor,
                  backgroundColor: "#FFFFFF",
                  shadowColor: selectedColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              keyboardType="numeric"
              value={goal === 0 ? "" : String(goal)}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              onFocus={() => setIsGoalInputFocused(true)}
              onBlur={() => {
                setIsGoalInputFocused(false);
                if (goal === 0) {
                  setGoal(1);
                }
              }}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "");
                if (cleaned === "") {
                  setGoal(0);
                } else {
                  const val = parseInt(cleaned, 10);
                  setGoal(isNaN(val) ? 1 : val);
                }
              }}
              selectTextOnFocus
            />

            <TouchableOpacity style={styles.goalBtn} onPress={() => setGoal(goal + 1)}>
              <Plus size={16} color={selectedColor} />
            </TouchableOpacity>
            
            {/* Premium Dropdown Picker */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[styles.dropdownButton, { borderColor: selectedColor + "30" }]}
                onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownButtonText}>
                  {unitOption === "Other" && customUnit ? customUnit : unitOption}
                </Text>
                <ChevronDown size={14} color="#64748B" />
              </TouchableOpacity>

              {showUnitDropdown && (
                <View style={styles.dropdownMenu}>
                  {["times", "glass", "hours", "minutes", "Other"].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownItem,
                        unitOption === opt && { backgroundColor: selectedColor + "15" },
                      ]}
                      onPress={() => {
                        setUnitOption(opt);
                        setShowUnitDropdown(false);
                        if (opt !== "Other") {
                          setGoalUnit(opt);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          unitOption === opt && { color: selectedColor, fontWeight: "800" },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Custom Unit Input (Only if 'Other' is selected in the dropdown) */}
        {unitOption === "Other" && (
          <View style={[styles.inputContainer, { marginTop: 12 }]}>
            <TextInput
              style={styles.input}
              placeholder="Enter custom unit (e.g., cups, miles)"
              placeholderTextColor="#94A3B8"
              value={customUnit}
              onChangeText={setCustomUnit}
            />
          </View>
        )}

        {/* Color Selection */}
        <Text style={styles.label}>🎨 Brand Color Accent</Text>
        <View style={styles.colorRow}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && {
                  borderWidth: 2.5,
                  borderColor: "#1E293B",
                },
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && <Check size={14} color="#FFF" strokeWidth={3} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Challenge Days Selection */}
        <Text style={styles.label}>🗓 Challenge Duration</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.challengeScrollContent}
          style={styles.challengeScrollView}
        >
          {[10, 30, 90, 100].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.challengePill,
                challengeDays === days && {
                  borderColor: selectedColor,
                  backgroundColor: selectedColor + "10",
                },
              ]}
              onPress={() => setChallengeDays(days)}
            >
              <Text
                style={[
                  styles.challengePillText,
                  challengeDays === days && { color: selectedColor, fontWeight: "800" },
                ]}
              >
                {days} Days
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.challengePill,
              challengeDays === "Custom" && {
                borderColor: selectedColor,
                backgroundColor: selectedColor + "10",
              },
            ]}
            onPress={() => setChallengeDays("Custom")}
          >
            <Text
              style={[
                styles.challengePillText,
                challengeDays === "Custom" && { color: selectedColor, fontWeight: "800" },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {challengeDays === "Custom" && (
          <View style={[styles.inputContainer, { marginTop: 12 }]}>
            <TextInput
              style={styles.input}
              placeholder="Enter custom days (e.g., 21)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={customDays}
              onChangeText={setCustomDays}
            />
          </View>
        )}

        {/* Fully Functional Daily Reminder */}
        <View style={styles.divider} />
        
        <View style={styles.reminderToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelInline}>🔔 Daily Reminders</Text>
            <Text style={styles.reminderSubLabel}>Get notified to complete your habit</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: "#E5E7EB", true: selectedColor + "80" }}
            thumbColor={reminderEnabled ? selectedColor : "#F4F3F4"}
          />
        </View>

        {reminderEnabled && (
          <View style={styles.timePickerContainer}>
            <TouchableOpacity
              style={[styles.pickerBtn, { borderColor: selectedColor, backgroundColor: selectedColor + "08" }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={16} color={selectedColor} />
              <Text style={[styles.pickerText, { color: selectedColor }]}>
                {formatTime12h(reminderTime)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                setReminderTime(selectedDate);
              }
            }}
          />
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: selectedColor, shadowColor: selectedColor }]}
          onPress={handleSave}
        >
          <Check size={18} color="#FFF" strokeWidth={3.5} />
          <Text style={styles.saveButtonText}>{editingHabit ? "Save Changes" : "Create Habit"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  sheetTitleRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 24 
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: "#171717" },
  sheetClose: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: "#F3F4F6", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  sheetCloseTxt: { fontSize: 14, color: "#6B7280", fontWeight: "700" },

  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8, marginTop: 16 },
  labelInline: { fontSize: 13, fontWeight: "700", color: "#374151" },

  inputContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },
  input: { fontSize: 15, color: "#171717", fontWeight: "600" },

  iconScrollView: { marginHorizontal: -24 },
  iconScrollContent: { paddingHorizontal: 24, gap: 10, paddingBottom: 4 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconButtonOutline: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 22 },

  customEmojiInputContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  customEmojiInput: { fontSize: 22, textAlign: "center", width: 40, height: 40 },

  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginTop: 16,
    marginBottom: 16,
    zIndex: 10,
    position: "relative" 
  },

  goalControls: { flexDirection: "row", alignItems: "center" },
  goalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  goalInput: {
    fontSize: 15,
    fontWeight: "700",
    color: "#171717",
    marginHorizontal: 8,
    textAlign: "center",
    minWidth: 44,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 4,
    paddingVertical: 0,
  },

  // Dropdown glass styles
  dropdownContainer: {
    marginLeft: 8,
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    minWidth: 96,
    justifyContent: "space-between",
  },
  dropdownButtonText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  dropdownMenu: {
    position: "absolute",
    top: 36,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 110,
    zIndex: 2000,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  colorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 16 },
  colorButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  challengeScrollView: { marginHorizontal: -24, marginBottom: 16 },
  challengeScrollContent: { paddingHorizontal: 24, gap: 8, paddingBottom: 4 },
  challengePill: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
  },
  challengePillText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  reminderToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reminderSubLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600", marginTop: 2 },
  timePickerContainer: { marginTop: 12, alignItems: "flex-start" },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pickerText: { fontSize: 13, fontWeight: "700" },

  saveButton: {
    borderRadius: 20,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});

