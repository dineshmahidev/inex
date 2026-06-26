import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import LottieView from "lottie-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  scheduleVoiceNoteNotification,
  cancelReminderNotification,
} from "@/utils/notifications";
import { useDatabase } from "@/hooks/useDatabase";

interface VoiceNote {
  id: string;
  uri: string;
  title: string;
  duration: number; // seconds
  createdAt: string;
  reminderDate?: string;
  reminderNotificationId?: string;
  tamilReminderEnabled?: boolean;
  tamilMessage?: string;
}

const STORAGE_KEY = "@tracksy_voice_notes";

export default function VoiceNotesScreen() {
  const router = useRouter();
  const { Colors } = useDatabase();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reminder Modal state
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
  const [reminderNote, setReminderNote] = useState<VoiceNote | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [tamilEnabled, setTamilEnabled] = useState(false);
  const [tamilMessage, setTamilMessage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadNotes();
      return () => {
        if (soundRef.current) soundRef.current.unloadAsync();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [])
  );

  const loadNotes = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setVoiceNotes(JSON.parse(raw));
    } catch {}
  };

  const saveNotes = async (updated: VoiceNote[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setVoiceNotes(updated);
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Microphone access is needed to record.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (!uri) return;

    const newNote: VoiceNote = {
      id: Date.now().toString(),
      uri,
      title: `Recording ${voiceNotes.length + 1}`,
      duration: recordingSeconds,
      createdAt: new Date().toISOString(),
    };
    await saveNotes([newNote, ...voiceNotes]);
    setRecording(null);
  };

  const playNote = async (note: VoiceNote) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (playingId === note.id) {
        setPlayingId(null);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: note.uri });
      soundRef.current = sound;
      setPlayingId(note.id);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch {
      Alert.alert("Error", "Could not play recording.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Recording", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = voiceNotes.filter((n) => n.id !== id);
          await saveNotes(updated);
          if (playingId === id && soundRef.current) {
            await soundRef.current.unloadAsync();
            setPlayingId(null);
          }
        },
      },
    ]);
  };

  const openReminderModal = (note: VoiceNote) => {
    setReminderNote(note);
    setNoteTitle(note.title);
    setReminderEnabled(!!note.reminderDate);
    setReminderTime(note.reminderDate ? new Date(note.reminderDate) : new Date());
    setTamilEnabled(!!note.tamilReminderEnabled);
    setTamilMessage(note.tamilMessage || "");
    setIsReminderModalVisible(true);
  };

  const handleSaveReminder = async () => {
    if (!reminderNote) return;

    let updatedNotificationId = reminderNote.reminderNotificationId;
    
    // Cancel existing reminder if any
    if (reminderNote.reminderNotificationId) {
      await cancelReminderNotification(reminderNote.reminderNotificationId);
      updatedNotificationId = undefined;
    }

    if (reminderEnabled) {
      const notificationId = 'vn_' + reminderNote.id;
      await scheduleVoiceNoteNotification(
        reminderNote.id,
        noteTitle || reminderNote.title,
        reminderTime,
        tamilEnabled,
        tamilMessage
      );
      updatedNotificationId = notificationId;
    }

    const updatedNotes = voiceNotes.map((n) => {
      if (n.id === reminderNote.id) {
        return {
          ...n,
          title: noteTitle || n.title,
          reminderDate: reminderEnabled ? reminderTime.toISOString() : undefined,
          reminderNotificationId: updatedNotificationId,
          tamilReminderEnabled: reminderEnabled ? tamilEnabled : undefined,
          tamilMessage: reminderEnabled && tamilEnabled ? tamilMessage : undefined,
        };
      }
      return n;
    });

    await saveNotes(updatedNotes);
    setIsReminderModalVisible(false);
    setReminderNote(null);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/tools")} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎙️ Voice Notes</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Recording Button */}
      <View style={styles.recordSection}>
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 3, shadowColor: Colors.primary }, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          {isRecording ? (
            <Text style={styles.recordIcon}>⏹</Text>
          ) : (
            <LottieView
              source={require('@/assets/mic.json')}
              autoPlay
              loop
              style={{ width: 64, height: 64 }}
              colorFilters={[
                {
                  keypath: "**",
                  color: Colors.primary,
                },
              ]}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.recordLabel}>
          {isRecording
            ? `Recording... ${formatDuration(recordingSeconds)}`
            : "Tap to Record"}
        </Text>
        {isRecording && (
          <View style={styles.recordingDot} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {voiceNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎙️</Text>
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptySubtitle}>Tap the button above to start recording</Text>
          </View>
        ) : (
          voiceNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <TouchableOpacity
                style={[styles.playBtn, { backgroundColor: `${Colors.primary}33` }, playingId === note.id && { backgroundColor: Colors.primary }]}
                onPress={() => playNote(note)}
              >
                <Text style={styles.playIcon}>{playingId === note.id ? "⏸" : "▶"}</Text>
              </TouchableOpacity>
              <View style={styles.noteInfo}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteMeta}>
                  {formatDate(note.createdAt)} · {formatDuration(note.duration)}
                </Text>
                {note.reminderDate && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, backgroundColor: `${Colors.primary}12`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start", marginBottom: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.primary }}>
                      🔔 {formatDate(note.reminderDate)} {note.tamilReminderEnabled ? "(தமிழ் நினைவூட்டல்)" : ""}
                    </Text>
                  </View>
                )}
                <View style={styles.waveform}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.wavebar,
                        {
                          height: 4 + Math.random() * 20,
                          backgroundColor: playingId === note.id ? Colors.primary : `${Colors.primary}33`,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={() => openReminderModal(note)} style={{ padding: 8 }}>
                <Text style={{ fontSize: 18 }}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(note.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Voice Note Reminder Modal (Full Screen) ── */}
      <Modal visible={isReminderModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.fullScreenContainer} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.fullScreenContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Row */}
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>🎙️ Voice Note Reminder</Text>
                <TouchableOpacity
                  onPress={() => setIsReminderModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Note Title Rename */}
              <Text style={styles.formLabel}>📝 Rename Voice Note</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.formInputFlat}
                  placeholder="Rename recording..."
                  placeholderTextColor="#94A3B8"
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                />
              </View>

              {/* Reminder Switch */}
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>⏰ Set Reminder Alert</Text>
                  <Text style={styles.switchSubLabel}>Schedule a notification for this note</Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ true: Colors.primary }}
                  thumbColor={reminderEnabled ? "#FFF" : "#F4F4F5"}
                />
              </View>

              {reminderEnabled && (
                <>
                  {/* Date & Time Pickers */}
                  <Text style={styles.formLabel}>📅 Alert Date & Time</Text>
                  <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.datePill} onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.datePillText}>📅 {reminderTime.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.datePill} onPress={() => setShowTimePicker(true)}>
                      <Text style={styles.datePillText}>🕐 {reminderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={reminderTime}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(_, d) => { setShowDatePicker(false); if (d) setReminderTime(d); }}
                    />
                  )}
                  {showTimePicker && (
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(_, d) => { setShowTimePicker(false); if (d) setReminderTime(d); }}
                    />
                  )}

                  {/* Tamil Toggle */}
                  <View style={[styles.switchRow, { marginTop: 16 }]}>
                    <View>
                      <Text style={styles.switchLabel}>தமிழ் நினைவூட்டல் (Tamil Notification)</Text>
                      <Text style={styles.switchSubLabel}>குரல் குறிப்புக்கான தமிழ் நினைவூட்டலை அனுப்பும்</Text>
                    </View>
                    <Switch
                      value={tamilEnabled}
                      onValueChange={setTamilEnabled}
                      trackColor={{ false: "#E2E8F0", true: `${Colors.primary}33` }}
                      thumbColor={tamilEnabled ? Colors.primary : "#94A3B8"}
                    />
                  </View>

                  {/* Tamil message input */}
                  {tamilEnabled && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={styles.formLabel}>தமிழ் செய்தி (Custom Tamil Message)</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.formInputFlat}
                          placeholder="தமிழ் செய்தி எழுதவும்..."
                          placeholderTextColor="#94A3B8"
                          value={tamilMessage}
                          onChangeText={setTamilMessage}
                        />
                      </View>

                      {/* Templates */}
                      <Text style={[styles.formLabel, { fontSize: 11, color: "#6B7280" }]}>விரைவுத் தேர்வுகள் (Templates):</Text>
                      <View style={styles.templateRow}>
                        {[
                          "இதை முக்கியமாகக் கேட்கவும்",
                          "இன்றைய குரல் குறிப்பு நினைவூட்டல்",
                          "சேமித்த குரல் குறிப்பை கேட்கவும்"
                        ].map((temp) => (
                          <TouchableOpacity
                            key={temp}
                            style={[
                              styles.templateChip,
                              tamilMessage === temp && [styles.templateChipActive, { borderColor: Colors.primary, backgroundColor: `${Colors.primary}33` }]
                            ]}
                            onPress={() => setTamilMessage(temp)}
                          >
                            <Text style={[styles.templateText, tamilMessage === temp && [styles.templateTextActive, { color: Colors.primary }]]}>
                              {temp}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }]} onPress={handleSaveReminder}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 32, color: "#171717", lineHeight: 36 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#171717" },

  recordSection: {
    alignItems: "center",
    paddingVertical: 32,
    position: "relative",
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  recordButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EF4444",
    shadowColor: "#EF4444",
  },
  recordIcon: { fontSize: 36 },
  recordLabel: { fontSize: 15, fontWeight: "600", color: "#374151" },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    position: "absolute",
    top: 26,
    right: 120,
  },

  scrollContent: { paddingHorizontal: 20 },
  noteCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { fontSize: 18 },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: 15, fontWeight: "700", color: "#171717", marginBottom: 4 },
  noteMeta: { fontSize: 12, color: "#6B7280", marginBottom: 8 },
  waveform: { flexDirection: "row", alignItems: "center", gap: 2, height: 24 },
  wavebar: { width: 3, borderRadius: 2 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 18 },

  emptyState: { alignItems: "center", marginTop: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#171717", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280" },

  // Reminder Modal (Full Screen)
  fullScreenContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullScreenContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34 },
  sheetTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: "#171717" },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  sheetCloseText: { fontSize: 14, color: "#6B7280", fontWeight: "700" },
  formLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 10, marginTop: 16 },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },
  formInputFlat: {
    fontSize: 15,
    color: "#171717",
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  switchSubLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  dateRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  datePill: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePillText: { fontSize: 13, fontWeight: "700", color: "#374151" },
  templateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  templateChip: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  templateChipActive: {
    backgroundColor: "#FFF0F6",
    borderColor: "#F472B6",
    borderWidth: 1.5,
  },
  templateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
  templateTextActive: {
    color: "#F472B6",
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 10,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
