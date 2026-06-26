import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useDatabase } from "@/hooks/useDatabase";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");
const STORAGE_KEY = "@tracksy_manifestations";

interface Manifestation {
  id: string;
  type: "text" | "voice";
  content?: string;
  uri?: string;
  duration?: number;
  createdAt: string;
}

const INSIGHTS = [
  { quote: "What you speak and write is what you attract into your life.", icon: "✨" },
  { quote: "Write in the present tense, as if it is already yours.", icon: "📝" },
  { quote: "Speak with full conviction. Let the universe hear your power.", icon: "🎙️" },
  { quote: "Gratitude accelerates the manifestation of your dreams.", icon: "🙏" },
];

export default function ManifestationScreen() {
  const router = useRouter();
  const { Colors } = useDatabase();
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [textInput, setTextInput] = useState("");

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insightAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadManifestations();
    }, [])
  );

  useEffect(() => {
    const insightTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(insightAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(insightAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setInsightIndex((prev) => (prev + 1) % INSIGHTS.length), 300);
    }, 6000);
    return () => {
      clearInterval(insightTimer);
      if (soundRef.current) soundRef.current.unloadAsync();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const loadManifestations = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setManifestations(JSON.parse(raw));
    } catch (err) {}
  };

  const saveManifestations = async (updated: Manifestation[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setManifestations(updated);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newM: Manifestation = {
      id: Date.now().toString(),
      type: "text",
      content: textInput.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveManifestations([newM, ...manifestations]);
    setTextInput("");
    setShowWriteModal(false);
    Alert.alert("🌌 Manifested!", "Your affirmation has been released to the universe!");
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "We need microphone access.");
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) return;
      const newM: Manifestation = {
        id: Date.now().toString(),
        type: "voice",
        uri,
        duration: recordingSeconds,
        createdAt: new Date().toISOString(),
      };
      await saveManifestations([newM, ...manifestations]);
      setShowVoiceModal(false);
      Alert.alert("🎙️ Spoken into Reality!", "Your voice manifestation has been saved!");
    } catch (err) {}
  };

  const playVoice = async (manifest: Manifestation) => {
    if (!manifest.uri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (playingId === manifest.id) { setPlayingId(null); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { sound } = await Audio.Sound.createAsync({ uri: manifest.uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(manifest.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlayingId(null);
      });
    } catch (err) {}
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Manifestation?", "This cannot be undone.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          const updated = manifestations.filter((m) => m.id !== id);
          await saveManifestations(updated);
          if (playingId === id && soundRef.current) {
            await soundRef.current.unloadAsync();
            setPlayingId(null);
          }
        },
      },
    ]);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const textCount = manifestations.filter((m) => m.type === "text").length;
  const voiceCount = manifestations.filter((m) => m.type === "voice").length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar backgroundColor="#FAFAFA" barStyle="dark-content" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/tools")} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✨ Manifestation</Text>
        <TouchableOpacity style={[styles.addBtn]} onPress={() => setShowWriteModal(true)}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── INSIGHT BANNER ── */}
        <Animated.View style={[styles.insightCard, { opacity: insightAnim }]}>
          <Text style={styles.insightEmoji}>{INSIGHTS[insightIndex].icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightLabel, { color: Colors.primary }]}>Daily Wisdom</Text>
            <Text style={styles.insightQuote}>{INSIGHTS[insightIndex].quote}</Text>
          </View>
        </Animated.View>

        {/* ── ACTION CARDS ── */}
        <View style={styles.actionGroupCard}>
          <LottieView
            source={require("@/assets/Goal Achieved.json")}
            autoPlay
            loop
            style={styles.actionLottie}
          />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors.primary }]}
              onPress={() => setShowWriteModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>✍️</Text>
              <Text style={styles.actionTitle}>Write</Text>
              <Text style={styles.actionSub}>Text affirmation</Text>
              <Text style={styles.actionCount}>{textCount} saved</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors.primary }]}
              onPress={() => setShowVoiceModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>🎙️</Text>
              <Text style={styles.actionTitle}>Speak</Text>
              <Text style={styles.actionSub}>Voice manifestation</Text>
              <Text style={styles.actionCount}>{voiceCount} recorded</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── MANIFESTATIONS ── */}
        {manifestations.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Your Manifestations</Text>
            {manifestations.map((m) => (
              <View key={m.id} style={styles.manifestCard}>
                <View style={styles.manifestCardHeader}>
                  <View style={styles.manifestTypePill}>
                    <Text style={{ fontSize: 11 }}>{m.type === "text" ? "✍️" : "🎙️"}</Text>
                    <Text style={styles.manifestTypeText}>{m.type === "text" ? "Written" : "Spoken"}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(m.id)}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </TouchableOpacity>
                </View>

                {m.type === "text" ? (
                  <Text style={styles.manifestText}>{m.content}</Text>
                ) : (
                  <View style={styles.audioRow}>
                    <TouchableOpacity
                      style={[styles.playBtn, playingId === m.id && styles.playBtnActive]}
                      onPress={() => playVoice(m)}
                    >
                      <Ionicons
                        name={playingId === m.id ? "pause" : "play"}
                        size={16}
                        color={playingId === m.id ? "#FFF" : "#1E293B"}
                      />
                    </TouchableOpacity>
                    <View style={styles.waveRow}>
                      {Array.from({ length: 20 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.waveBar,
                            {
                              height: 4 + Math.abs(Math.sin(i * 0.8)) * 14,
                              backgroundColor: playingId === m.id ? "#1E293B" : "#CBD5E1",
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.durationText}>{formatDuration(m.duration || 0)}</Text>
                  </View>
                )}
                <Text style={styles.manifestDate}>{formatDate(m.createdAt)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌌</Text>
            <Text style={styles.emptyTitle}>Begin your journey</Text>
            <Text style={styles.emptySubtitle}>Write or speak your first manifestation above to start attracting what you desire.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── WRITE MODAL ── */}
      <Modal visible={showWriteModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.fullModal} edges={["top", "bottom"]}>
          <View style={styles.fullModalHeader}>
            <TouchableOpacity onPress={() => setShowWriteModal(false)} style={styles.sheetClose}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.fullModalTitle}>✍️ Write Affirmation</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.writeBanner}>
            <Text style={styles.writeBannerEmoji}>💫</Text>
            <Text style={[styles.writeBannerText, { color: Colors.primary }]}>
              Write in present tense — "I am", "I have", "I attract"
            </Text>
          </View>

          <View style={styles.writeInputContainer}>
            <TextInput
              style={styles.writeInput}
              placeholder={'I am so grateful now that...\nI attract abundance because...'}
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              value={textInput}
              onChangeText={setTextInput}
              maxLength={600}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{textInput.length}/600</Text>
          </View>

          <View style={styles.writeActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWriteModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: Colors.primary, shadowColor: Colors.primary }, !textInput.trim() && { opacity: 0.5 }]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>Release to Universe</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── VOICE MODAL ── */}
      <Modal visible={showVoiceModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.fullModal, { backgroundColor: "#0F172A" }]} edges={["top", "bottom"]}>
          <View style={[styles.fullModalHeader, { borderBottomColor: "#1E293B" }]}>
            <TouchableOpacity
              onPress={() => { if (isRecording) stopRecording(); else setShowVoiceModal(false); }}
              style={[styles.sheetClose, { backgroundColor: "#1E293B" }]}
            >
              <Text style={[styles.sheetCloseText, { color: "#94A3B8" }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.fullModalTitle, { color: "#F1F5F9" }]}>🎙️ Speak Manifestation</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.voiceBody}>
            <View style={styles.universeRing}>
              <Animated.View style={[
                styles.outerPulse,
                { borderColor: isRecording ? "#EF4444" : Colors.primary, transform: [{ scale: isRecording ? pulseAnim : new Animated.Value(1) }] }
              ]} />
              <TouchableOpacity
                style={[styles.micButton, { backgroundColor: isRecording ? "#EF4444" : Colors.primary }]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.85}
              >
                <Ionicons name={isRecording ? "stop" : "mic"} size={44} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.voiceInstruction}>
              {isRecording
                ? `🔴 Recording... ${formatDuration(recordingSeconds)}`
                : "Tap the mic to speak your manifestation"}
            </Text>

            {isRecording && (
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>LIVE • UNIVERSE IS LISTENING</Text>
              </View>
            )}

            {!isRecording && voiceCount > 0 && (
              <View style={styles.voiceRecentContainer}>
                <Text style={styles.voiceRecentTitle}>Recent Recordings</Text>
                {manifestations.filter(m => m.type === "voice").slice(0, 3).map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.voiceRecentItem}
                    onPress={() => playVoice(m)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.smallPlayBtn, { backgroundColor: playingId === m.id ? Colors.primary : "#1E293B" }]}>
                      <Ionicons name={playingId === m.id ? "pause" : "play"} size={14} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.voiceRecentDate}>{formatDate(m.createdAt)}</Text>
                      <Text style={styles.voiceRecentDur}>{formatDuration(m.duration || 0)}</Text>
                    </View>
                    <View style={styles.miniWave}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <View key={i} style={[styles.miniBar, { height: 4 + Math.abs(Math.sin(i)) * 10, backgroundColor: Colors.primary + "60" }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {!isRecording && (
            <TouchableOpacity
              style={[styles.doneBtn, { borderColor: Colors.primary }]}
              onPress={() => setShowVoiceModal(false)}
            >
              <Text style={[styles.doneBtnText, { color: Colors.primary }]}>Done</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  // ── HEADER ──
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
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },
  addBtnText: { fontSize: 20, color: "#171717", lineHeight: 24 },

  // ── SCROLL ──
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  // ── INSIGHT ──
  insightCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  insightEmoji: { fontSize: 28 },
  insightLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  insightQuote: { fontSize: 13, color: "#374151", fontWeight: "600", lineHeight: 18 },

  // ── ACTION GROUP CARD ──
  actionGroupCard: {
    backgroundColor: "#FFF", borderRadius: 24, padding: 20, marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  actionLottie: { width: 100, height: 100, marginBottom: 16 },
  actionRow: { flexDirection: "row", gap: 12, width: "100%" },
  actionCard: {
    flex: 1, borderRadius: 18, padding: 16, alignItems: "center",
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 18, fontWeight: "900", color: "#FFF", marginBottom: 2 },
  actionSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  actionCount: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 8, fontWeight: "700" },

  // ── SECTION ──
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#171717", marginBottom: 12 },

  // ── MANIFESTATION CARD ──
  manifestCard: {
    backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  manifestCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  manifestTypePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  manifestTypeText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  deleteIcon: { fontSize: 14 },
  manifestText: { fontSize: 14, color: "#374151", lineHeight: 20, fontWeight: "600" },
  manifestDate: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", marginTop: 8 },

  // ── AUDIO ROW ──
  audioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  playBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  playBtnActive: { backgroundColor: "#1E293B" },
  waveRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2 },
  waveBar: { width: 3, borderRadius: 2 },
  durationText: { fontSize: 11, color: "#64748B", fontWeight: "700" },

  // ── EMPTY STATE ──
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#171717", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  // ── WRITE MODAL ──
  fullModal: { flex: 1, backgroundColor: "#FFF" },
  fullModalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  sheetCloseText: { fontSize: 14, color: "#6B7280", fontWeight: "700" },
  fullModalTitle: { fontSize: 17, fontWeight: "900", color: "#171717" },

  writeBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginTop: 16, marginBottom: 12,
    backgroundColor: "#EEF2FF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  writeBannerEmoji: { fontSize: 18 },
  writeBannerText: { fontSize: 12, fontWeight: "700", flex: 1 },

  writeInputContainer: {
    flex: 1, marginHorizontal: 20, backgroundColor: "#F9FAFB",
    borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB",
    padding: 16, marginBottom: 16,
  },
  writeInput: {
    flex: 1, fontSize: 16, color: "#171717", fontWeight: "600",
    lineHeight: 26, textAlignVertical: "top",
  },
  charCount: { fontSize: 11, color: "#CBD5E1", textAlign: "right", marginTop: 8 },

  writeActions: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#64748B" },
  submitBtn: {
    flex: 2, paddingVertical: 16, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnText: { fontSize: 15, fontWeight: "800", color: "#FFF" },

  // ── VOICE MODAL ──
  voiceBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  universeRing: { alignItems: "center", justifyContent: "center", marginBottom: 32 },
  outerPulse: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, opacity: 0.4,
  },
  micButton: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
  },
  voiceInstruction: {
    fontSize: 16, color: "#94A3B8", fontWeight: "600",
    textAlign: "center", marginBottom: 16,
  },
  liveRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1E293B", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    marginBottom: 24,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },

  voiceRecentContainer: { width: "100%", marginTop: 16 },
  voiceRecentTitle: { fontSize: 13, fontWeight: "800", color: "#475569", marginBottom: 10 },
  voiceRecentItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#1E293B", borderRadius: 16, padding: 14, marginBottom: 8,
  },
  smallPlayBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  voiceRecentDate: { fontSize: 12, color: "#94A3B8", fontWeight: "700" },
  voiceRecentDur: { fontSize: 10, color: "#64748B", fontWeight: "600", marginTop: 1 },
  miniWave: { flexDirection: "row", alignItems: "center", gap: 2 },
  miniBar: { width: 3, borderRadius: 2 },

  doneBtn: {
    marginHorizontal: 24, marginBottom: 16, paddingVertical: 16,
    borderRadius: 18, alignItems: "center",
    borderWidth: 1.5,
  },
  doneBtnText: { fontSize: 15, fontWeight: "800" },
});
