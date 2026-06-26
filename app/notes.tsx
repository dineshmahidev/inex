import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useDatabase } from "@/hooks/useDatabase";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - 32 - CARD_MARGIN) / 2;

interface Note {
  id: string;
  title: string;
  body: string;
  color: string;
  createdAt: string;
}

const NOTE_COLORS = [
  "#FFF9C4", "#FCE4EC", "#E8F5E9", "#E3F2FD",
  "#F3E5F5", "#FFF3E0", "#E0F7FA", "#F1F8E9",
];

const ROTATIONS = ["-3deg", "2deg", "-1deg", "4deg", "-2deg", "3deg", "-4deg", "1deg"];

const STORAGE_KEY = "@tracksy_notes";

export default function NotesScreen() {
  const router = useRouter();
  const { Colors } = useDatabase();
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  useFocusEffect(
    React.useCallback(() => {
      loadNotes();
    }, [])
  );

  const loadNotes = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  };

  const saveNotes = async (updated: Note[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNotes(updated);
  };

  const openNew = () => {
    setEditNote(null);
    setTitle("");
    setBody("");
    setSelectedColor(NOTE_COLORS[0]);
    setModalVisible(true);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setTitle(note.title);
    setBody(note.body);
    setSelectedColor(note.color);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() && !body.trim()) return;
    let updated: Note[];
    if (editNote) {
      updated = notes.map((n) =>
        n.id === editNote.id ? { ...n, title, body, color: selectedColor } : n
      );
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title,
        body,
        color: selectedColor,
        createdAt: new Date().toISOString(),
      };
      updated = [newNote, ...notes];
    }
    await saveNotes(updated);
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Note", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = notes.filter((n) => n.id !== id);
          await saveNotes(updated);
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/tools")} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📌 Sticky Notes</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary }]} onPress={openNew}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📌</Text>
            <Text style={styles.emptyTitle}>No sticky notes yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to pin your first note</Text>
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: Colors.primary }]} onPress={openNew}>
              <Text style={styles.emptyButtonText}>Pin a Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {notes.map((note, idx) => {
              const rotation = ROTATIONS[idx % ROTATIONS.length];
              return (
                <TouchableOpacity
                  key={note.id}
                  style={[
                    styles.noteCard,
                    { backgroundColor: note.color, transform: [{ rotate: rotation as any }] },
                  ]}
                  onPress={() => openEdit(note)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.pinIcon}>📌</Text>
                  {!!note.title && (
                    <Text style={styles.noteTitle} numberOfLines={2}>
                      {note.title}
                    </Text>
                  )}
                  {!!note.body && (
                    <Text style={styles.noteBody} numberOfLines={5}>
                      {note.body}
                    </Text>
                  )}
                  <View style={styles.noteFooter}>
                    <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                    <TouchableOpacity onPress={() => handleDelete(note.id)}>
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.fullScreenContainer, { backgroundColor: selectedColor }]} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.fullScreenContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>
                  {editNote ? "✏️ Edit Note" : "📌 New Sticky"}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.sheetClose}>
                  <Text style={styles.sheetCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Color picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                {NOTE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      selectedColor === c && styles.colorDotSelected,
                    ]}
                  />
                ))}
              </ScrollView>

              <TextInput
                style={styles.titleInput}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              <TextInput
                style={styles.bodyInput}
                placeholder="Write your note..."
                placeholderTextColor="#9CA3AF"
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
              />

              {/* Save Button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnTxt}>
                  {editNote ? "Save Changes" : "Pin It"}
                </Text>
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
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { fontSize: 20, color: "#FFF", lineHeight: 24 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  noteCard: {
    width: CARD_WIDTH,
    borderRadius: 4,
    padding: 14,
    paddingTop: 20,
    minHeight: 150,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  pinIcon: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    fontSize: 18,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 17,
    flex: 1,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  noteDate: { fontSize: 10, color: "#8B7355" },
  deleteIcon: { fontSize: 14 },

  emptyState: { alignItems: "center", marginTop: 100 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#171717", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  emptyButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
  },
  emptyButtonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Modal
  fullScreenContainer: { flex: 1 },
  fullScreenContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34, flexGrow: 1 },
  sheetTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#171717" },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" },
  sheetCloseTxt: { fontSize: 14, color: "#475569", fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#171717",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 16,
  },
  saveBtnTxt: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  colorRow: { marginBottom: 16 },
  colorDot: { width: 28, height: 28, borderRadius: 14, marginRight: 10 },
  colorDotSelected: { borderWidth: 3, borderColor: "#374151" },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 12,
    paddingVertical: 4,
  },
  bodyInput: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    flex: 1,
    minHeight: 200,
  },
});
