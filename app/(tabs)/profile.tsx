import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Dimensions,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "@/hooks/useDatabase";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

const isImageUri = (str?: string | null) => {
  if (!str) return false;
  return str.startsWith("http") || str.startsWith("file://") || str.startsWith("content://") || str.includes("/");
};

import { Edit2, Shield, DollarSign, Database, Trash2, Check, Award, Flame, Calendar, Activity, Shirt, Camera } from "lucide-react-native";

const { width } = Dimensions.get("window");

const AVATARS = [
  { icon: "🐉", color: "#FCE7F3" }, // Cute Pink Dragon (App Mascot)
  { icon: "🐱", color: "#FEF3C7" }, // Kitty
  { icon: "🦊", color: "#FFEDD5" }, // Fox
  { icon: "🐼", color: "#F3F4F6" }, // Panda
  { icon: "🚀", color: "#DBEAFE" }, // Astronaut
];

export default function ProfileScreen() {
  const { habits, settings, setSettings, clearAllData, exportData, importData, Colors } = useDatabase();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(settings?.userName || "Kiro");
  const [selectedAvatar, setSelectedAvatar] = useState(settings?.userImage || "🐉");

  // Theme Selection States
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const THEME_COLORS = ["#F472B6", "#FB923C", "#FBBF24", "#34D399", "#2DD4BF", "#60A5FA", "#A78BFA"];

  const handleSelectThemeColor = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSettings({
      ...settings,
      themeColor: color,
    });
  };

  const pickImageFromGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "We need media library access to let you pick a profile image!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedAvatar(uri);
        if (!isEditingName) {
          setSettings({
            ...settings,
            userImage: uri,
          });
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not pick image from gallery.");
    }
  };

  // Sync state with loaded settings
  useEffect(() => {
    if (settings) {
      setNameInput(settings.userName || "Kiro");
      setSelectedAvatar(settings.userImage || "🐉");
    }
  }, [settings]);

  // Calculate Streak
  const currentStreak = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    const allLogs = new Set<string>();
    habits.forEach(h => {
      if (h.logs) h.logs.forEach(l => allLogs.add(l));
    });
    
    let current = 0;
    const today = new Date().toISOString().slice(0, 10);
    let checkDate = new Date(today);

    if (!allLogs.has(today)) {
        const yesterday = new Date(checkDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (!allLogs.has(yStr)) return 0;
        checkDate = yesterday;
    }

    while (allLogs.has(checkDate.toISOString().slice(0, 10))) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return current;
  }, [habits]);

  // Calculate Total logs across all habits
  const totalLogs = useMemo(() => {
    if (!habits) return 0;
    return habits.reduce((acc, h) => acc + (h.logs || []).length, 0);
  }, [habits]);

  const handleSaveProfile = () => {
    if (!nameInput.trim()) {
      Alert.alert("Name Required", "Please enter a username.");
      return;
    }
    setSettings({
      ...settings,
      userName: nameInput,
      userImage: selectedAvatar,
    });
    setIsEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleToggleLock = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings({
      ...settings,
      isLocked: value,
      pin: value ? "1234" : null, // Default PIN if enabled
    });
    if (value) {
      Alert.alert("Lock Enabled", "App Lock is now active. Default PIN is 1234. You can edit this in lock settings.");
    }
  };

  const handleSelectCurrency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Preferred Currency",
      "Select your preferred currency symbol:",
      [
        { text: "₹ (INR)", onPress: () => changeCurrency("₹") },
        { text: "$ (USD)", onPress: () => changeCurrency("$") },
        { text: "€ (EUR)", onPress: () => changeCurrency("€") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const changeCurrency = (symbol: string) => {
    setSettings({ ...settings, currency: symbol });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await exportData();
    } catch (e) {
      Alert.alert("Export Failed", "Unable to export data backup.");
    }
  };

  const handleImport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Import Data", "This will merge your backup data into the current database. Proceed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Import", onPress: async () => {
        // Trigger generic import sequence
        Alert.alert("Coming Soon", "Data import can be triggered by sharing a Tracksy backup JSON file into the app.");
      }},
    ]);
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Factory Reset",
      "Are you absolutely sure? This will delete all habits, streaks, settings, and transaction records. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset Everything", style: "destructive", onPress: async () => {
          await clearAllData();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Data Cleared", "All data has been successfully reset.");
        }},
      ]
    );
  };

  const currentAvatarBg = AVATARS.find(a => a.icon === selectedAvatar)?.color || "#FCE7F3";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity 
          style={styles.headerRightBtn} 
          onPress={() => setIsThemeModalVisible(true)}
          activeOpacity={0.7}
        >
          <Shirt size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.userCard, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
          {/* Avatar display with glowing background ring */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={pickImageFromGallery}
            style={[styles.avatarContainer, { shadowColor: isImageUri(selectedAvatar) ? Colors.primary : currentAvatarBg }]}
          >
            <View style={[styles.avatarCircle, { backgroundColor: isImageUri(selectedAvatar) ? "#FFF" : currentAvatarBg, overflow: "hidden" }]}>
              {isImageUri(selectedAvatar) ? (
                <Image source={{ uri: selectedAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{selectedAvatar}</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Edit Profile Name & Avatar block */}
          {isEditingName ? (
            <View style={styles.editSection}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                maxLength={15}
                placeholder="Enter Username"
                autoFocus
              />
              {/* Avatar Picker Row */}
              <Text style={styles.avatarPickerLabel}>Choose Avatar</Text>
              <View style={styles.avatarPickerRow}>
                {AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.icon}
                    style={[
                      styles.avatarPickerItem,
                      { backgroundColor: avatar.color },
                      selectedAvatar === avatar.icon && [styles.avatarPickerItemActive, { borderColor: Colors.primary, shadowColor: Colors.primary }],
                    ]}
                    onPress={() => setSelectedAvatar(avatar.icon)}
                  >
                    <Text style={styles.avatarPickerText}>{avatar.icon}</Text>
                  </TouchableOpacity>
                ))}
                {/* Gallery Picker Option */}
                <TouchableOpacity
                  style={[
                    styles.avatarPickerItem,
                    { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0", borderWidth: 1 },
                    isImageUri(selectedAvatar) && [styles.avatarPickerItemActive, { borderColor: Colors.primary, shadowColor: Colors.primary }],
                  ]}
                  onPress={pickImageFromGallery}
                  activeOpacity={0.75}
                >
                  <Camera size={20} color="#475569" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.saveProfileBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }]} onPress={handleSaveProfile}>
                <Check size={16} color="#FFF" strokeWidth={3} />
                <Text style={styles.saveProfileBtnText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileInfoSection}>
              <Text style={[styles.userNameText, { color: "#FFF" }]}>{settings?.userName || "Kiro"}</Text>
              <TouchableOpacity style={[styles.editNameBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]} onPress={() => setIsEditingName(true)}>
                <Edit2 size={16} color="#FFF" />
                <Text style={[styles.editNameBtnText, { color: "#FFF" }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionLabel}>Overview Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconCircle}>
              <Activity size={26} color={Colors.primary} />
            </View>
            <Text style={styles.statVal}>{habits?.length || 0}</Text>
            <Text style={styles.statSub}>Total Habits</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconCircle}>
              <Flame size={26} color="#F59E0B" />
            </View>
            <Text style={styles.statVal}>{currentStreak}</Text>
            <Text style={styles.statSub}>Active Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconCircle}>
              <Award size={26} color="#10B981" />
            </View>
            <Text style={styles.statVal}>{totalLogs}</Text>
            <Text style={styles.statSub}>Check-ins</Text>
          </View>
        </View>

        {/* Settings Group */}
        <Text style={styles.sectionLabel}>App Settings</Text>
        <View style={styles.settingsGroup}>
          {/* Lock Pin Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconBg}>
                <Shield size={22} color="#475569" />
              </View>
              <Text style={styles.settingsText}>Passcode Lock (PIN)</Text>
            </View>
            <Switch
              value={settings?.isLocked || false}
              onValueChange={handleToggleLock}
              trackColor={{ false: "#E2E8F0", true: `${Colors.primary}33` }}
              thumbColor={settings?.isLocked ? Colors.primary : "#94A3B8"}
            />
          </View>

          {/* Preferred Currency */}
          <TouchableOpacity style={styles.settingsRow} onPress={handleSelectCurrency}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconBg}>
                <DollarSign size={22} color="#475569" />
              </View>
              <Text style={styles.settingsText}>Preferred Currency</Text>
            </View>
            <Text style={styles.settingsValue}>{settings?.currency || "₹"}</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management Group */}
        <Text style={styles.sectionLabel}>Data & Safety</Text>
        <View style={styles.settingsGroup}>
          {/* Backup */}
          <TouchableOpacity style={styles.settingsRow} onPress={handleExport}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconBg}>
                <Database size={22} color="#3B82F6" />
              </View>
              <Text style={styles.settingsText}>Backup Database (Export)</Text>
            </View>
          </TouchableOpacity>

          {/* Import */}
          <TouchableOpacity style={styles.settingsRow} onPress={handleImport}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconBg}>
                <Database size={22} color="#3B82F6" style={{ transform: [{ rotate: "180deg" }] }} />
              </View>
              <Text style={styles.settingsText}>Restore Database (Import)</Text>
            </View>
          </TouchableOpacity>

          {/* Reset */}
          <TouchableOpacity style={styles.settingsRow} onPress={handleReset}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconBg}>
                <Trash2 size={22} color="#EF4444" />
              </View>
              <Text style={[styles.settingsText, { color: "#EF4444", fontWeight: "700" }]}>Factory Reset (Wipe All)</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* App Theme Selection Modal */}
      {isThemeModalVisible && (
        <Modal
          visible={isThemeModalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setIsThemeModalVisible(false)}
        >
          <SafeAreaView style={styles.themeModalContainer} edges={["top", "bottom"]}>
            <View style={styles.themeModalContent}>
              {/* Sheet Header */}
              <View style={styles.themeModalHeader}>
                <Text style={styles.themeModalTitle}>🎨 App Theme Color</Text>
                <TouchableOpacity 
                  onPress={() => setIsThemeModalVisible(false)} 
                  style={styles.themeModalClose}
                >
                  <Text style={styles.themeModalCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.themeModalDesc}>
                Personalize your Tracksy experience. Select your preferred color accent below to apply it across the tab bar, buttons, and visual highlights.
              </Text>

              {/* Color Grid */}
              <View style={styles.themeColorGrid}>
                {THEME_COLORS.map((color) => {
                  const isActive = (settings?.themeColor || "#F472B6") === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.themeColorButton,
                        { backgroundColor: color },
                        isActive && styles.themeColorButtonActive,
                      ]}
                      onPress={() => handleSelectThemeColor(color)}
                      activeOpacity={0.8}
                    >
                      {isActive && <Check size={18} color="#FFF" strokeWidth={3.5} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Preview Box */}
              <View style={styles.themePreviewContainer}>
                <Text style={styles.themePreviewLabel}>Theme Preview</Text>
                <View style={[styles.themePreviewCard, { borderColor: settings?.themeColor || "#F472B6" }]}>
                  {/* Mock Tab Bar Preview */}
                  <View style={styles.mockTabBar}>
                    <View style={styles.mockTabItem}>
                      <Text style={{ fontSize: 16, color: settings?.themeColor || "#F472B6" }}>🏠</Text>
                      <Text style={[styles.mockTabText, { color: settings?.themeColor || "#F472B6" }]}>Home</Text>
                    </View>
                    <View style={styles.mockTabItem}>
                      <Text style={{ fontSize: 16, color: "#94A3B8" }}>📈</Text>
                      <Text style={[styles.mockTabText, { color: "#94A3B8" }]}>Progress</Text>
                    </View>
                    <View style={[styles.mockTabItemCenter, { backgroundColor: settings?.themeColor || "#F472B6" }]}>
                      <Text style={{ fontSize: 18, color: "#FFF", fontWeight: "900" }}>+</Text>
                    </View>
                    <View style={styles.mockTabItem}>
                      <Text style={{ fontSize: 16, color: "#94A3B8" }}>🛠️</Text>
                      <Text style={[styles.mockTabText, { color: "#94A3B8" }]}>Tools</Text>
                    </View>
                    <View style={styles.mockTabItem}>
                      <Text style={{ fontSize: 16, color: "#94A3B8" }}>👤</Text>
                      <Text style={[styles.mockTabText, { color: "#94A3B8" }]}>Profile</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                style={[styles.themeApplyBtn, { backgroundColor: settings?.themeColor || "#F472B6", shadowColor: settings?.themeColor || "#F472B6" }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setIsThemeModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.themeApplyBtnText}>Apply Theme Accent</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#171717", letterSpacing: -0.5 },
  headerRightBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  
  // User Card Layout
  userCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(243, 244, 246, 0.8)",
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  avatarText: { fontSize: 44 },
  
  profileInfoSection: { alignItems: "center" },
  userNameText: { fontSize: 22, fontWeight: "900", color: "#171717", marginBottom: 6 },
  editNameBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editNameBtnText: { fontSize: 12, fontWeight: "700" },
  
  // Edit Profile Form Layout
  editSection: { width: "100%", alignItems: "center" },
  nameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#171717",
    textAlign: "center",
    backgroundColor: "#FAFAFA",
    marginBottom: 16,
  },
  avatarPickerLabel: { fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  avatarPickerRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  avatarPickerItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarPickerItemActive: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarPickerText: { fontSize: 22 },
  saveProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveProfileBtnText: { fontSize: 14, fontWeight: "800", color: "#FFF" },
  
  // Section Labels
  sectionLabel: { fontSize: 13, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, marginTop: 4 },
  
  // Stats Grid
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(243, 244, 246, 0.8)",
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statVal: { fontSize: 22, fontWeight: "900", color: "#171717", marginBottom: 2 },
  statSub: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  
  // Settings Groups
  settingsGroup: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(243, 244, 246, 0.8)",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA",
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  settingsValue: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },

  // Theme Modal Styling
  themeModalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  themeModalContent: { paddingHorizontal: 24, paddingTop: 20, flex: 1 },
  themeModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  themeModalTitle: { fontSize: 20, fontWeight: "800", color: "#171717" },
  themeModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  themeModalCloseTxt: { fontSize: 14, color: "#6B7280", fontWeight: "700" },
  themeModalDesc: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginBottom: 24 },
  themeColorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 32 },
  themeColorButton: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  themeColorButtonActive: { borderWidth: 3, borderColor: "#1E293B" },
  themePreviewContainer: { flex: 1, justifyContent: "center", marginBottom: 40 },
  themePreviewLabel: { fontSize: 12, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, textAlign: "center" },
  themePreviewCard: { borderWidth: 2.5, borderRadius: 24, padding: 16, backgroundColor: "#FAFAFA", alignItems: "center", justifyContent: "center", height: 120 },
  mockTabBar: { flexDirection: "row", width: "100%", height: 60, backgroundColor: "#FFF", borderRadius: 30, alignItems: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  mockTabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  mockTabItemCenter: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginHorizontal: 4 },
  mockTabText: { fontSize: 8, fontWeight: "800", marginTop: 2, textTransform: "uppercase" },
  themeApplyBtn: { borderRadius: 20, paddingVertical: 17, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5, marginBottom: 20 },
  themeApplyBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
