import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDatabase } from "@/hooks/useDatabase";
import { CheckSquare, Sparkles, FileText, Mic, Bell, Wallet } from "lucide-react-native";

const { width } = Dimensions.get("window");
const GAP = 12;
const PADDING = 20;
const COL_WIDTH = (width - PADDING * 2 - GAP) / 2;

const TOOLS = [
  {
    id: "todo",
    title: "To-Do List",
    subtitle: "Plan & manage tasks",
    icon: CheckSquare,
    useTheme: true,
  },
  {
    id: "manifestation",
    title: "Manifestation",
    subtitle: "Speak your dreams",
    icon: Sparkles,
    color: "#A855F7",
    route: "/manifestation",
  },
  {
    id: "notes",
    title: "Sticky Notes",
    subtitle: "Write thoughts",
    icon: FileText,
    color: "#6366F1",
    route: "/notes",
  },
  {
    id: "voice",
    title: "Voice Notes",
    subtitle: "Record memos",
    icon: Mic,
    color: "#10B981",
    route: "/voice-notes",
  },
  {
    id: "reminders",
    title: "Bill Reminder",
    subtitle: "Never miss a bill",
    icon: Bell,
    color: "#F59E0B",
    route: "/(tabs)/reminders",
  },
  {
    id: "income",
    title: "Income & Expense",
    subtitle: "Track money",
    icon: Wallet,
    color: "#059669",
    route: "/(tabs)/history",
  },
];

export default function ToolsScreen() {
  const router = useRouter();
  const { Colors } = useDatabase();

  const firstRow = TOOLS.slice(0, 3);
  const secondRow = TOOLS.slice(3);

  const Card = ({ tool, size }: { tool: typeof TOOLS[0]; size: "large" | "small" }) => {
    const resolvedColor = tool.useTheme ? Colors.primary : (tool.color || Colors.primary);
    const resolvedRoute = tool.useTheme ? "/(tabs)/todo" : (tool.route || "/(tabs)/todo");
    const isLarge = size === "large";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: resolvedColor },
          isLarge ? { width: "100%", padding: 20 } : { width: COL_WIDTH, padding: 18 },
        ]}
        onPress={() => router.push(resolvedRoute as any)}
        activeOpacity={0.85}
      >
        <View style={isLarge ? { flexDirection: "row", alignItems: "center" } : { alignItems: "center" }}>
          <View style={[styles.iconWrap, isLarge && { marginRight: 14 }]}>
            <tool.icon size={isLarge ? 26 : 22} color="#FFF" strokeWidth={2} />
          </View>
          <View style={isLarge ? { flex: 1 } : { alignItems: "center", marginTop: 10 }}>
            <Text style={[styles.toolTitle, { color: "#FFF" }, isLarge && { fontSize: 18 }]}>{tool.title}</Text>
            <Text style={[styles.toolSub, { color: "rgba(255,255,255,0.75)" }]}>{tool.subtitle}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tools</Text>
          <Text style={[styles.headerSub, { color: Colors.primary }]}>Everything you need</Text>
        </View>

        {/* First row: large card + two small */}
        <View style={styles.section}>
          <Card tool={firstRow[0]} size="large" />
          <View style={styles.smallRow}>
            {firstRow.slice(1).map((tool) => (
              <Card key={tool.id} tool={tool} size="small" />
            ))}
          </View>
        </View>

        {/* Second row: two small + large card */}
        <View style={styles.section}>
          <View style={styles.smallRow}>
            {secondRow.slice(0, 2).map((tool) => (
              <Card key={tool.id} tool={tool} size="small" />
            ))}
          </View>
          <Card tool={secondRow[2]} size="large" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { paddingHorizontal: PADDING },

  header: { paddingTop: 8, paddingBottom: 18 },
  headerTitle: { fontSize: 30, fontWeight: "900", color: "#171717", letterSpacing: -0.5 },
  headerSub: { fontSize: 14, marginTop: 2, fontWeight: "600" },

  section: { gap: GAP, marginBottom: GAP },
  smallRow: { flexDirection: "row", gap: GAP },

  card: {
    borderRadius: 20,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  toolTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  toolSub: { fontSize: 12, fontWeight: "600" },
});
