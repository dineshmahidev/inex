import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useDatabase } from "@/hooks/useDatabase";
import {
  AppNotification,
  getNotifications,
  markAllRead,
  markOneRead,
  clearAllNotifications,
} from "@/utils/notificationStore";

const TYPE_META: Record<
  AppNotification["type"],
  { icon: string; label: string; route: string | null }
> = {
  reminder:  { icon: "🔔", label: "Bill Reminder",   route: "/(tabs)/reminders" },
  habit:     { icon: "✨", label: "Habit Alert",      route: "/(tabs)/habits" },
  todo:      { icon: "✅", label: "Task Reminder",    route: "/(tabs)/todo" },
  voice:     { icon: "🎙️", label: "Voice Note",       route: "/voice-notes" },
  general:   { icon: "📢", label: "Notification",     route: null },
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationCenterScreen() {
  const router = useRouter();
  const { Colors } = useDatabase();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleTap = async (n: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markOneRead(n.id);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    const meta = TYPE_META[n.type];
    if (n.type === 'habit' && n.entityId) {
      router.push(`/habit/${n.entityId}` as any);
    } else if (meta.route) {
      router.push(meta.route as any);
    }
  };

  const handleMarkAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClear = () => {
    Alert.alert("Clear All", "Remove all notifications from your inbox?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await clearAllNotifications();
          setNotifications([]);
        },
      },
    ]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item, index }: { item: AppNotification; index: number }) => {
    const meta = TYPE_META[item.type] || TYPE_META.general;
    return (
      <TouchableOpacity
        style={[
          styles.card,
          !item.read && { borderLeftColor: Colors.primary, borderLeftWidth: 3 },
        ]}
        onPress={() => handleTap(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.read ? "#F1F5F9" : `${Colors.primary}18` }]}>
          <Text style={styles.iconEmoji}>{meta.icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={[styles.typePill, { backgroundColor: item.read ? "#F1F5F9" : `${Colors.primary}18` }]}>
              <Text style={[styles.typePillText, { color: item.read ? "#94A3B8" : Colors.primary }]}>
                {meta.label}
              </Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />}
          </View>
          <Text style={[styles.cardTitle, item.read && styles.cardTitleRead]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={11} color="#94A3B8" />
            <Text style={styles.cardTime}>{timeAgo(item.receivedAt)}</Text>
            {meta.route && (
              <View style={[styles.goChip, { backgroundColor: `${Colors.primary}15` }]}>
                <Text style={[styles.goChipText, { color: Colors.primary }]}>Open →</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={[styles.headerSub, { color: Colors.primary }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerBtn}>
              <Ionicons name="checkmark-done-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.accentBar, { backgroundColor: Colors.primary }]} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              Your notification inbox is empty.{"\n"}Reminders and alerts will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B", letterSpacing: -0.4 },
  headerSub: { fontSize: 12, fontWeight: "700", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 6 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center", justifyContent: "center",
  },

  accentBar: { height: 3, marginBottom: 0 },

  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  separator: { height: 8 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 22 },

  cardContent: { flex: 1 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },

  typePill: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  typePillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },

  cardTitle: { fontSize: 14, fontWeight: "800", color: "#1E293B", marginBottom: 3 },
  cardTitleRead: { color: "#94A3B8" },
  cardBody: { fontSize: 12, color: "#64748B", lineHeight: 17, marginBottom: 8 },

  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardTime: { fontSize: 11, color: "#94A3B8", fontWeight: "600", flex: 1 },
  goChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  goChipText: { fontSize: 10, fontWeight: "800" },

  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 20 },
});
