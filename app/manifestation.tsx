import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Dimensions,
  Animated,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDatabase } from "@/hooks/useDatabase";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
const STORAGE_KEY = "@tracksy_manifestations";

const isImageUri = (str?: string | null) => {
  if (!str) return false;
  return str.startsWith("http") || str.startsWith("file://") || str.startsWith("content://") || str.includes("/");
};

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
  const { settings, Colors } = useDatabase();

  const userName = settings?.userName || "Manifestor";
  const userImage = settings?.userImage;
  const userInitials = userName.charAt(0).toUpperCase();

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
  const slideUpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadManifestations();
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
    Animated.spring(slideUpAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
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
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const textManifestations = manifestations.filter((m) => m.type === "text");
  const voiceManifestations = manifestations.filter((m) => m.type === "voice");

  const primary = Colors.primary;
  const primaryLight = `${primary}18`;
  const primaryMid = `${primary}30`;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>✨ Manifestation</Text>
          <Text style={[styles.headerSub, { color: primary }]}>Speak your dreams into reality</Text>
        </View>
        <View style={[styles.avatarContainer, { borderColor: primary }]}>
          {isImageUri(userImage) ? (
            <Image source={{ uri: userImage! }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: primary }]}>
              <Text style={styles.avatarInitials}>{userInitials}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── INSIGHT BANNER ── */}
        <Animated.View style={[styles.insightCard, { backgroundColor: primaryLight, borderColor: primaryMid }, { opacity: insightAnim }]}>
          <Text style={styles.insightEmoji}>{INSIGHTS[insightIndex].icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightLabel, { color: primary }]}>Daily Wisdom</Text>
            <Text style={styles.insightQuote}>{INSIGHTS[insightIndex].quote}</Text>
          </View>
        </Animated.View>

        {/* ── ACTION BUTTONS ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: primary, shadowColor: primary }]}
            onPress={() => setShowWriteModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="pencil" size={26} color="#FFF" />
            </View>
            <Text style={styles.actionTitle}>Write</Text>
            <Text style={styles.actionSub}>Text affirmation</Text>
            <Text style={styles.actionCount}>{textManifestations.length} saved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#1E293B", shadowColor: "#1E293B" }]}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="mic" size={26} color="#FFF" />
            </View>
            <Text style={styles.actionTitle}>Speak</Text>
            <Text style={styles.actionSub}>Voice manifestation</Text>
            <Text style={styles.actionCount}>{voiceManifestations.length} recorded</Text>
          </TouchableOpacity>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: primaryMid }]}>
            <Text style={[styles.statNum, { color: primary }]}>{manifestations.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: primaryMid }]}>
            <Text style={[styles.statNum, { color: primary }]}>{textManifestations.length}</Text>
            <Text style={styles.statLabel}>Written</Text>
          </View>
          <View style={[styles.statCard, { borderColor: primaryMid }]}>
            <Text style={[styles.statNum, { color: primary }]}>{voiceManifestations.length}</Text>
            <Text style={styles.statLabel}>Spoken</Text>
          </View>
        </View>

        {/* ── RECENT MANIFESTATIONS ── */}
        {manifestations.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={styles.sectionTitle}>Your Manifestations</Text>
            {manifestations.map((m) => (
              <View key={m.id} style={[styles.manifestCard, { borderLeftColor: primary }]}>
                <View style={styles.manifestCardHeader}>
                  <View style={[styles.manifestTypePill, { backgroundColor: m.type === "text" ? primaryLight : "#1E293B18" }]}>
                    <Text style={{ fontSize: 12 }}>{m.type === "text" ? "✍️" : "🎙️"}</Text>
                    <Text style={[styles.manifestTypeText, { color: m.type === "text" ? primary : "#1E293B" }]}>
                      {m.type === "text" ? "Written" : "Spoken"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.manifestDate}>{formatDate(m.createdAt)} · {formatTime(m.createdAt)}</Text>
                    <TouchableOpacity onPress={() => handleDelete(m.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>

                {m.type === "text" ? (
                  <Text style={styles.manifestText}>{m.content}</Text>
                ) : (
                  <View style={styles.audioRow}>
                    <TouchableOpacity
                      style={[styles.playBtn, { backgroundColor: playingId === m.id ? primary : primaryLight }]}
                      onPress={() => playVoice(m)}
                    >
                      <Ionicons
                        name={playingId === m.id ? "pause" : "play"}
                        size={18}
                        color={playingId === m.id ? "#FFF" : primary}
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
                              backgroundColor: playingId === m.id ? primary : `${primary}40`,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.durationText}>{formatDuration(m.duration || 0)}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {manifestations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌌</Text>
            <Text style={styles.emptyTitle}>Begin your journey</Text>
            <Text style={styles.emptySubtitle}>Write or speak your first manifestation above to start attracting what you desire.</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── WRITE MODAL (Full Screen) ── */}
      <Modal visible={showWriteModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.fullModal} edges={["top", "bottom"]}>
          <View style={styles.fullModalHeader}>
            <TouchableOpacity onPress={() => setShowWriteModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.fullModalTitle}>✍️ Write Affirmation</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.writeBanner, { backgroundColor: primaryLight }]}>
            <Text style={styles.writeBannerEmoji}>💫</Text>
            <Text style={[styles.writeBannerText, { color: primary }]}>
              Write in present tense — "I am", "I have", "I attract"
            </Text>
          </View>

          <View style={styles.writeInputContainer}>
            <TextInput
              style={styles.writeInput}
              placeholder={'I am so grateful now that...\nI attract abundance because...\nI have everything I need...'}
              placeholderTextColor="#94A3B8"
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
              style={[styles.submitBtn, { backgroundColor: primary, shadowColor: primary }, !textInput.trim() && { opacity: 0.5 }]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>Release to Universe</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── VOICE MODAL (Full Screen) ── */}
      <Modal visible={showVoiceModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.fullModal, { backgroundColor: "#0F172A" }]} edges={["top", "bottom"]}>
          <View style={[styles.fullModalHeader, { borderBottomColor: "#1E293B" }]}>
            <TouchableOpacity
              onPress={() => { if (isRecording) stopRecording(); else setShowVoiceModal(false); }}
              style={[styles.closeBtn, { backgroundColor: "#1E293B" }]}
            >
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
            <Text style={[styles.fullModalTitle, { color: "#F1F5F9" }]}>🎙️ Speak Manifestation</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.voiceBody}>
            {/* Universe visual */}
            <View style={styles.universeRing}>
              <Animated.View style={[
                styles.outerPulse,
                { borderColor: isRecording ? "#EF4444" : primary, transform: [{ scale: isRecording ? pulseAnim : new Animated.Value(1) }] }
              ]} />
              <TouchableOpacity
                style={[styles.micButton, { backgroundColor: isRecording ? "#EF4444" : primary, shadowColor: isRecording ? "#EF4444" : primary }]}
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
                <Text style={[styles.liveText, { color: "#EF4444" }]}>LIVE • UNIVERSE IS LISTENING</Text>
              </View>
            )}

            {!isRecording && voiceManifestations.length > 0 && (
              <View style={styles.voiceRecentContainer}>
                <Text style={styles.voiceRecentTitle}>Recent Recordings</Text>
                {voiceManifestations.slice(0, 3).map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.voiceRecentItem}
                    onPress={() => playVoice(m)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.smallPlayBtn, { backgroundColor: playingId === m.id ? primary : "#1E293B" }]}>
                      <Ionicons name={playingId === m.id ? "pause" : "play"} size={14} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.voiceRecentDate}>{formatDate(m.createdAt)}</Text>
                      <Text style={styles.voiceRecentDur}>{formatDuration(m.duration || 0)}</Text>
                    </View>
                    <View style={styles.miniWave}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <View key={i} style={[styles.miniBar, { height: 4 + Math.abs(Math.sin(i)) * 10, backgroundColor: `${primary}60` }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {!isRecording && (
            <TouchableOpacity
              style={[styles.doneBtn, { borderColor: primary }]}
              onPress={() => setShowVoiceModal(false)}
            >
              <Text style={[styles.doneBtnText, { color: primary }]}>Done</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: "600", marginTop: 1 },
  avatarContainer: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, overflow: "hidden" },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 14, fontWeight: "800", color: "#FFF" },

  scroll: { paddingHorizontal: 20, paddingTop: 18 },

  insightCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 20, padding: 16, marginBottom: 20,
    borderWidth: 1,
  },
  insightEmoji: { fontSize: 28 },
  insightLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  insightQuote: { fontSize: 13, color: "#334155", fontWeight: "600", lineHeight: 18 },

  actionRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  actionCard: {
    flex: 1, borderRadius: 24, padding: 20,
    alignItems: "flex-start",
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  actionIconBg: { marginBottom: 12 },
  actionTitle: { fontSize: 22, fontWeight: "900", color: "#FFF", marginBottom: 2 },
  actionSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  actionCount: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 12, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: "#FFF", borderRadius: 16, padding: 14,
    alignItems: "center", borderWidth: 1.5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statNum: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600", marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 12, letterSpacing: -0.2 },

  manifestCard: {
    backgroundColor: "#FFF", borderRadius: 18, padding: 16, marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  manifestCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  manifestTypePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  manifestTypeText: { fontSize: 11, fontWeight: "700" },
  manifestDate: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  deleteBtn: { padding: 4 },
  manifestText: { fontSize: 14, color: "#334155", lineHeight: 20, fontWeight: "600" },

  audioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  waveRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2 },
  waveBar: { width: 3, borderRadius: 2 },
  durationText: { fontSize: 11, color: "#64748B", fontWeight: "700" },

  emptyState: { alignItems: "center", paddingTop: 40, paddingBottom: 20 },
  emptyEmoji: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  // ── WRITE MODAL ──
  fullModal: { flex: 1, backgroundColor: "#FFF" },
  fullModalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },
  fullModalTitle: { fontSize: 17, fontWeight: "900", color: "#1E293B" },

  writeBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginTop: 16, marginBottom: 12,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  writeBannerEmoji: { fontSize: 18 },
  writeBannerText: { fontSize: 12, fontWeight: "700", flex: 1 },

  writeInputContainer: {
    flex: 1, marginHorizontal: 20, backgroundColor: "#F8FAFC",
    borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0",
    padding: 16, marginBottom: 16,
  },
  writeInput: {
    flex: 1, fontSize: 16, color: "#1E293B", fontWeight: "600",
    lineHeight: 26, textAlignVertical: "top",
  },
  charCount: { fontSize: 11, color: "#CBD5E1", textAlign: "right", marginTop: 8 },

  writeActions: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
  },
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
    position: "absolute",
    width: 140, height: 140, borderRadius: 70,
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
  liveText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

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
    borderWidth: 1.5, backgroundColor: "transparent",
  },
  doneBtnText: { fontSize: 15, fontWeight: "800" },
});
