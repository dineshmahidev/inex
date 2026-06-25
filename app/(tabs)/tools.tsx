import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDatabase } from "@/hooks/useDatabase";
import { CheckSquare, Sparkles, FileText, Mic, Bell, Wallet } from "lucide-react-native";

const TOOLS = [
  {
    id: "todo",
    title: "To-Do List",
    subtitle: "Plan and manage your tasks",
    icon: CheckSquare,
    useTheme: true, // uses dynamic Colors.primary
  },
  {
    id: "manifestation",
    title: "Daily Manifestation",
    subtitle: "Speak or write your dreams into reality",
    icon: Sparkles,
    color: "#A855F7",
    bgColor: "#FAF5FF",
    route: "/manifestation",
  },
  {
    id: "notes",
    title: "Notes",
    subtitle: "Write and organise your thoughts",
    icon: FileText,
    color: "#6366F1",
    bgColor: "#EEF2FF",
    route: "/notes",
  },
  {
    id: "voice",
    title: "Voice Notes",
    subtitle: "Record and replay voice memos",
    icon: Mic,
    color: "#10B981",
    bgColor: "#F0FDF4",
    route: "/voice-notes",
  },
  {
    id: "reminders",
    title: "Bill Reminder",
    subtitle: "Never miss a bill or payment",
    icon: Bell,
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    route: "/(tabs)/reminders",
  },
  {
    id: "income",
    title: "Income & Expense",
    subtitle: "Track all your money movements",
    icon: Wallet,
    color: "#059669",
    bgColor: "#ECFDF5",
    route: "/(tabs)/history",
  },
];

export default function ToolsScreen() {
  const router = useRouter();
  const { Colors } = useDatabase();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Tools</Text>
        <Text style={[styles.logoSub, { color: Colors.primary }]}>Everything you need 🛠️</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {TOOLS.map((tool) => {
          const resolvedColor = tool.useTheme ? Colors.primary : (tool.color || Colors.primary);
          const resolvedBg = tool.useTheme
            ? `${Colors.primary}15`
            : (tool.bgColor || `${Colors.primary}15`);
          const resolvedRoute = tool.useTheme ? "/(tabs)/todo" : (tool.route || "/(tabs)/todo");

          return (
            <TouchableOpacity
              key={tool.id}
              style={[styles.card, { shadowColor: resolvedColor }]}
              onPress={() => router.push(resolvedRoute as any)}
              activeOpacity={0.75}
            >
              {/* Left: icon circle */}
              <View style={styles.iconCircle}>
                <tool.icon size={32} color={resolvedColor} strokeWidth={2} />
              </View>

              {/* Middle: text */}
              <View style={styles.textBlock}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
              </View>

              {/* Right: coloured arrow pill */}
              <View style={[styles.arrowPill, { backgroundColor: resolvedBg }]}>
                <Text style={[styles.arrowText, { color: resolvedColor }]}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textBlock: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 4,
  },
  toolSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  arrowPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 26,
  },
});
