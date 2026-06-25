import AsyncStorage from "@react-native-async-storage/async-storage";

const STORE_KEY = "@tracksy_notification_inbox";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: "reminder" | "habit" | "todo" | "voice" | "general";
  /** id of the related entity — used for deep-link navigation */
  entityId?: string;
  /** ISO timestamp when the notification was received */
  receivedAt: string;
  read: boolean;
};

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveNotification(n: Omit<AppNotification, "id" | "receivedAt" | "read">): Promise<AppNotification> {
  const existing = await getNotifications();
  const newN: AppNotification = {
    ...n,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    receivedAt: new Date().toISOString(),
    read: false,
  };
  // Keep max 100 notifications, newest first
  const updated = [newN, ...existing].slice(0, 100);
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(updated));
  return newN;
}

export async function markAllRead(): Promise<void> {
  const existing = await getNotifications();
  const updated = existing.map((n) => ({ ...n, read: true }));
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(updated));
}

export async function markOneRead(id: string): Promise<void> {
  const existing = await getNotifications();
  const updated = existing.map((n) => (n.id === id ? { ...n, read: true } : n));
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(updated));
}

export async function clearAllNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORE_KEY);
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter((n) => !n.read).length;
}
