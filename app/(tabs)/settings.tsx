import { useDatabase } from "@/hooks/useDatabase";
import { useLanguage } from "@/context/LanguageContext";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { checkForUpdates, openStoreLink, CURRENT_VERSION } from "@/utils/updates";
import {
  Camera,
  ChevronRight,
  Smile,
  Sparkles,
  Star,
  Target,
  Zap
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

export default function SettingsScreen() {
  const router = useRouter();
  const {
    settings,
    setSettings,
    clearAllData,
    exportData,
    importData,
    refresh,
    Colors,
  } = useDatabase();
  const { t, language, setLanguage, languages } = useLanguage();
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(settings.userName);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);

  // PIN Setup State
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [setupPin, setSetupPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [pinError, setPinError] = useState(false);



  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSettings({ ...settings, userImage: result.assets[0].uri });
    }
  };

  const handleSaveName = () => {
    setSettings({ ...settings, userName: userName });
    setIsEditingName(false);
  };

  const handleExport = async () => {
    try {
      await exportData();
    } catch (e) {
      Alert.alert("Export Failed", "Could not create backup.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });
      if (!result.canceled) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        await importData(content);
        Alert.alert(
          "Success",
          "Data imported successfully! The UI will refresh.",
          [{ text: "OK", onPress: () => refresh() }],
        );
      }
    } catch (e) {
      Alert.alert("Import Failed", "The file might be corrupted or invalid.");
    }
  };

  const handleCheckUpdates = async () => {
    try {
      const update = await checkForUpdates();
      if (update && update.hasUpdate) {
        Alert.alert(
          "Update Available! 🚀",
          `A new version of Tracksy (${update.latestVersion}) is available. Open the store to update now?`,
          [
            { text: "Later", style: "cancel" },
            { 
              text: "Update Now", 
              onPress: () => openStoreLink(update.storeUrl) 
            }
          ]
        );
      } else {
        Alert.alert(
          "Up to Date! 🚀",
          "You are running the latest version of Tracksy. All features are fully up to date."
        );
      }
    } catch (e) {
      Alert.alert("Update Check Failed", "Could not check for updates. Please try again.");
    }
  };

  const renderAvatar = (size: number = 120, borderRadius: number = 60) => {
    const GUEST_ICONS = ["👤", "👻", "😀", "⭐", "⚡"];
    const GUEST_COLORS = [
      "#EB6001",
      "#22C55E",
      "#3B82F6",
      "#A855F7",
      "#F59E0B",
    ];

    const hash = (settings.userName || "Guest")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const emoji = GUEST_ICONS[hash % GUEST_ICONS.length];
    const bgColor = GUEST_COLORS[hash % GUEST_COLORS.length];

    if (settings.userImage && settings.userImage.trim() !== "") {
      return (
        <Image
          source={{ uri: settings.userImage }}
          style={{ width: size, height: size, borderRadius }}
        />
      );
    }

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor + "25",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: bgColor + "40",
        }}
      >
        <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>{t.settings}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={styles.imageContainer}
          >
            {renderAvatar()}
            <View
              style={[styles.cameraIcon, { backgroundColor: Colors.primary }]}
            >
              <Camera size={14} color="#000" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            {isEditingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[
                    styles.nameInput,
                    { color: Colors.text, borderBottomColor: Colors.primary },
                  ]}
                  value={userName}
                  onChangeText={setUserName}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleSaveName}
                  style={styles.saveBtn}
                >
                  <Text style={{ color: Colors.primary, fontWeight: "bold" }}>
                    SAVE
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={styles.nameRow}
              >
                <Text style={[styles.profileName, { color: Colors.text }]}>
                  {settings.userName || "Guest"}
                </Text>
                <View
                  style={[
                    styles.editBadge,
                    { backgroundColor: Colors.primary + "20" },
                  ]}
                >
                  <Text style={{ fontSize: 12 }}>✏️</Text>
                </View>
              </TouchableOpacity>
            )}
            <Text
              style={{ color: Colors.textMuted, fontSize: 12, marginTop: 4 }}
            >
              {t.eliteMember}
            </Text>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>
            {t.preferences}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: Colors.primary + "15" },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>🔒</Text>
                </View>
                <Text style={[styles.settingLabel, { color: Colors.text }]}>
                  {t.dataLock}
                </Text>
              </View>
              <Switch
                value={settings.isLocked}
                onValueChange={(v) => {
                  if (v) {
                    setSetupStep(1);
                    setSetupPin("");
                    setConfirmPin("");
                    setPinError(false);
                    setIsPinModalVisible(true);
                  } else {
                    setSettings({ ...settings, isLocked: false, pin: null });
                  }
                }}
                trackColor={{ false: "#333", true: Colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>
            {t.portability}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            <TouchableOpacity style={styles.settingItem} onPress={handleExport}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconBox, { backgroundColor: "#10B98115" }]}
                >
                  <Text style={{ fontSize: 18 }}>📤</Text>
                </View>
                <Text style={[styles.settingLabel, { color: Colors.text }]}>
                  {t.exportBackup}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: Colors.border }]}
            />

            <TouchableOpacity style={styles.settingItem} onPress={handleImport}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconBox, { backgroundColor: "#3B82F615" }]}
                >
                  <Text style={{ fontSize: 18 }}>📥</Text>
                </View>
                <Text style={[styles.settingLabel, { color: Colors.text }]}>
                  {t.importJson}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: Colors.border }]}
            />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                Alert.alert(t.resetApp, t.wipeData, [
                  { text: t.cancel },
                  {
                    text: t.wipeAll,
                    style: "destructive",
                    onPress: clearAllData,
                  },
                ]);
              }}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconBox, { backgroundColor: "#EF444415" }]}
                >
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                </View>
                <Text style={[styles.settingLabel, { color: Colors.text }]}>
                  {t.factoryReset}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>
            {t.security}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: Colors.card, borderColor: Colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("/privacy")}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: Colors.primary + "15" },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>🛡️</Text>
                </View>
                <Text style={[styles.settingLabel, { color: Colors.text }]}>
                  {t.privacyPolicy}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: Colors.border }]}
            />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleCheckUpdates}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: Colors.primary + "15" },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>🔄</Text>
                </View>
                <Text style={[styles.settingLabel, { color: Colors.text }]}>
                  {t.checkUpdates}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: Colors.text }]}>
            TRACKSY PRO
          </Text>
          <Text style={[styles.footerInfo, { color: Colors.textMuted }]}>
            {"V " + CURRENT_VERSION + " • SECURE & OFFLINE"}
          </Text>
        </View>
      </ScrollView>

      {/* ───────────────────────── Language Picker Modal ─────────────────────── */}
      <Modal
        visible={isLangModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLangModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 28,
        }}>
          <View style={{
            width: '100%',
            backgroundColor: Colors.card,
            borderWidth: 3,
            borderColor: '#171717',
            borderRadius: 24,
            padding: 24,
            shadowColor: '#171717',
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 5,
          }}>
            {/* Modal Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#171717' }}>
                <Text style={{ fontSize: 18 }}>🌐</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 }}>
                {t.selectLanguage}
              </Text>
            </View>

            {/* Language Options */}
            {languages.map((lang, idx) => {
              const isActive = lang.code === language;
              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.8}
                  onPress={async () => {
                    await setLanguage(lang.code);
                    setIsLangModalVisible(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 2.5,
                    borderColor: isActive ? Colors.primary : '#171717',
                    backgroundColor: isActive ? Colors.primary + '18' : 'transparent',
                    marginBottom: idx < languages.length - 1 ? 10 : 0,
                  }}
                >
                  <Text style={{ fontSize: 26 }}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.text, fontWeight: '900', fontSize: 16 }}>
                      {lang.nativeLabel}
                    </Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                      {lang.label}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#171717' }}>
                      <Text style={{ color: '#000', fontSize: 12, fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Close */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsLangModalVisible(false)}
              style={{
                marginTop: 16,
                height: 48,
                borderRadius: 16,
                borderWidth: 2.5,
                borderColor: '#171717',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.text, fontWeight: '900', fontSize: 14 }}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal visible={isPinModalVisible} animationType="slide" transparent>
        <View
          style={[
            styles.pinModalContainer,
            { backgroundColor: Colors.background },
          ]}
        >
          <SafeAreaView
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <View style={styles.pinHeader}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: Colors.primary + "15",
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    marginBottom: 20,
                  },
                ]}
              >
                <Text style={{ fontSize: 32 }}>🔒</Text>
              </View>
              <Text style={[styles.title, { color: Colors.text }]}>
                {setupStep === 1 ? t.setNewPin : t.confirmPin}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: pinError ? "#ef4444" : Colors.textMuted },
                ]}
              >
                {pinError
                  ? t.pinsNoMatch
                  : setupStep === 1
                    ? t.enter4Digit
                    : t.reenterPin}
              </Text>
            </View>

            <View style={styles.dotsContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i <
                          (setupStep === 1 ? setupPin.length : confirmPin.length)
                          ? Colors.primary
                          : "transparent",
                      borderColor: pinError ? "#ef4444" : Colors.primary,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.pad}>
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"],
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.row}>
                  {row.map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={styles.key}
                      onPress={() => {
                        if (setupStep === 1) {
                          if (setupPin.length < 4) {
                            const np = setupPin + num;
                            setSetupPin(np);
                            if (np.length === 4) {
                              setTimeout(() => setSetupStep(2), 200);
                            }
                          }
                        } else {
                          if (confirmPin.length < 4) {
                            const np = confirmPin + num;
                            setConfirmPin(np);
                            setPinError(false);
                            if (np.length === 4) {
                              if (np === setupPin) {
                                setSettings({
                                  ...settings,
                                  isLocked: true,
                                  pin: np,
                                });
                                setIsPinModalVisible(false);
                              } else {
                                setPinError(true);
                                setTimeout(() => setConfirmPin(""), 500);
                              }
                            }
                          }
                        }
                      }}
                    >
                      <Text style={[styles.keyText, { color: Colors.text }]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.key}
                  onPress={() => {
                    setIsPinModalVisible(false);
                  }}
                >
                  <Text style={{ color: Colors.textMuted, fontSize: 16 }}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.key}
                  onPress={() => {
                    if (setupStep === 1 && setupPin.length < 4) {
                      setSetupPin(setupPin + "0");
                      if (setupPin.length + 1 === 4)
                        setTimeout(() => setSetupStep(2), 200);
                    } else if (setupStep === 2 && confirmPin.length < 4) {
                      const np = confirmPin + "0";
                      setConfirmPin(np);
                      if (np.length === 4) {
                        if (np === setupPin) {
                          setSettings({ ...settings, isLocked: true, pin: np });
                          setIsPinModalVisible(false);
                        } else {
                          setPinError(true);
                          setTimeout(() => setConfirmPin(""), 500);
                        }
                      }
                    }
                  }}
                >
                  <Text style={[styles.keyText, { color: Colors.text }]}>
                    0
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.key}
                  onPress={() => {
                    if (setupStep === 1) setSetupPin(setupPin.slice(0, -1));
                    else setConfirmPin(confirmPin.slice(0, -1));
                  }}
                >
                  <Text style={{ fontSize: 24, color: Colors.textMuted }}>⌫</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 10, marginTop: 20 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  profileHeader: { alignItems: "center", padding: 30, gap: 15 },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: "relative",
  },
  profilePic: { width: 120, height: 120, borderRadius: 60 },
  placeholderPic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: -10,
    right: -10,
    width: 36,
    height: 36,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#171717",
  },
  nameContainer: { alignItems: "center" },
  profileName: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  editBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  editRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: {
    fontSize: 22,
    fontWeight: "900",
    borderBottomWidth: 2,
    minWidth: 140,
    textAlign: "center",
  },
  saveBtn: { padding: 5 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#171717',
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden"
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: '#171717',
  },
  settingLabel: { fontSize: 16, fontWeight: "700" },
  divider: { height: 1, marginHorizontal: 16 },
  footer: { alignItems: "center", padding: 40, gap: 4 },
  versionText: { fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  footerInfo: { fontSize: 9, fontWeight: "bold", letterSpacing: 2 },

  pinModalContainer: { flex: 1 },
  pinHeader: { alignItems: "center", marginBottom: 40 },
  subtitle: { fontSize: 14, marginTop: 5 },
  dotsContainer: { flexDirection: "row", gap: 20, marginBottom: 50 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pad: { width: width * 0.8, maxWidth: 300 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: { fontSize: 28, fontWeight: "500" },
});
