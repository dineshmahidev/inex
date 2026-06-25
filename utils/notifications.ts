import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Foreground handler — show banner even when app is open ───────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Android channel init ─────────────────────────────────────────────────────
export async function initNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Tracksy Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7A00',
      sound: 'mixkit_bell_notification_933',
      // Keep the notification alive even after device restart
      enableVibrate: true,
      showBadge: true,
    });

    // Separate channel for habit daily alerts
    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      sound: 'mixkit_bell_notification_933',
      enableVibrate: true,
    });
  }
}

// ── Permission request ───────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

// ── One-time scheduled reminder (custom date) ────────────────────────────────
export async function scheduleReminderNotification(id: string, name: string, amount: number, date: Date) {
  if (date.getTime() <= Date.now() + 1000) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Payment Reminder 🔔',
      body: `Time to pay ${name} — ${amount.toLocaleString()}. Stay on top of your bills!`,
      data: { id },
      sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: 'default',
    },
  });
}

// ── Monthly recurring reminder ───────────────────────────────────────────────
// Uses DAILY trigger on Android (fires every day at 9 AM, app checks in notification body)
// Uses CALENDAR trigger on iOS for true monthly repeat
export async function scheduleMonthlyReminderNotification(
  id: string,
  name: string,
  amount: number,
  dueDay: number,
  alertType: 'on_day' | '2_days_before' | 'both'
) {
  // Cancel previous notifications for this id
  await cancelReminderNotification(id);

  const safeDay = (day: number) => Math.max(1, Math.min(28, day));

  /** Returns the next date matching `day` at 09:00 */
  const nextOccurrence = (day: number): Date => {
    const d = safeDay(day);
    const now = new Date();
    let target = new Date(now.getFullYear(), now.getMonth(), d, 9, 0, 0, 0);
    // If already passed this month, move to next month
    if (target.getTime() <= now.getTime()) {
      target = new Date(now.getFullYear(), now.getMonth() + 1, d, 9, 0, 0, 0);
    }
    return target;
  };

  const schedule = async (day: number, isEarly: boolean) => {
    const notifId = isEarly ? `${id}_early` : id;
    const label   = isEarly ? 'Upcoming Payment 🔔' : 'Payment Due Today! 🔔';
    const body    = isEarly
      ? `Your ${name} payment (${amount.toLocaleString()}) is due in 2 days.`
      : `Pay ${name} — ${amount.toLocaleString()} today. Don't miss it!`;

    if (Platform.OS === 'ios') {
      // iOS: CALENDAR trigger fires monthly at exact day/time, survives app kill
      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: {
          title: label,
          body,
          data: { id, type: 'reminder' },
          sound: 'mixkit_bell_notification_933.wav',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          day: safeDay(day),
          hour: 9,
          minute: 0,
          repeats: true,
        } as any,
      });
    } else {
      // Android: DAILY trigger at 09:00, survives app restart via RECEIVE_BOOT_COMPLETED
      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: {
          title: label,
          body,
          data: { id, type: 'reminder', dueDay: safeDay(day) },
          sound: 'mixkit_bell_notification_933',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
          channelId: 'default',
        } as any,
      });
    }
  };

  if (alertType === 'on_day' || alertType === 'both') {
    await schedule(dueDay, false);
  }
  if (alertType === '2_days_before' || alertType === 'both') {
    await schedule(dueDay - 2, true);
  }
}

// ── To-do reminder (one-time) ────────────────────────────────────────────────
export async function scheduleTodoNotification(id: string, text: string, date: Date) {
  if (date.getTime() <= Date.now() + 1000) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Task Reminder ⚡',
      body: `Don't forget: ${text}. Stay on track!`,
      data: { id, type: 'todo' },
      sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: 'default',
    },
  });
}

// ── Voice note reminder (one-time) ───────────────────────────────────────────
export async function scheduleVoiceNoteNotification(
  id: string,
  title: string,
  date: Date,
  tamilEnabled?: boolean,
  tamilMessage?: string
) {
  if (date.getTime() <= Date.now() + 1000) return;

  const notificationTitle = tamilEnabled ? '🎙️ குரல் குறிப்பு நினைவூட்டல்' : 'Voice Note Reminder 🎙️';
  const defaultBody = tamilEnabled
    ? `உங்கள் குரல் குறிப்பைக் கேட்க வேண்டிய நேரம்: ${title || 'பெயரிடப்படாத குறிப்பு'}`
    : `Listen to: ${title || 'Untitled Note'}`;
  const notificationBody = tamilEnabled && tamilMessage && tamilMessage.trim() ? tamilMessage : defaultBody;

  await Notifications.scheduleNotificationAsync({
    identifier: 'vn_' + id,
    content: {
      title: notificationTitle,
      body: notificationBody,
      data: { id, type: 'voice' },
      sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: 'default',
    },
  });
}

// ── Habit daily notification ─────────────────────────────────────────────────
const HABIT_QUOTES = [
  'We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle',
  'Motivation is what gets you started. Habit is what keeps you going. — Jim Ryun',
  'Success is the product of daily habits—not once-in-a-lifetime transformations. — James Clear',
  'The chains of habit are too weak to be felt until they are too strong to be broken.',
  'Small daily improvements over time lead to stunning results. — Robin Sharma',
  'First forget inspiration. Habit is more dependable. — Octavia Butler',
  'Success is buried in your daily routine.',
  'Your future is found in your daily habits.',
];

export async function scheduleHabitNotification(
  id: string,
  name: string,
  time: string,
  goal?: number,
  goalUnit?: string
) {
  const [hour, minute] = time.split(':').map(Number);
  
  // Choose a random quote, or if a goal is provided, use a goal-focused message
  let bodyText = HABIT_QUOTES[Math.floor(Math.random() * HABIT_QUOTES.length)];
  if (goal && goal > 1 && goalUnit) {
    bodyText = `Your goal today is ${goal} ${goalUnit}. You've got this!`;
  } else if (goalUnit && goalUnit !== 'times') {
    bodyText = `Your goal today is ${goal} ${goalUnit}. You've got this!`;
  }

  // Cancel any existing reminder for this habit
  await Notifications.cancelScheduledNotificationAsync('habit_' + id);

  await Notifications.scheduleNotificationAsync({
    identifier: 'habit_' + id,
    content: {
      title: `Habit Time: ${name} ✨`,
      body: bodyText,
      data: { id, type: 'habit' },
      sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
    },
    trigger: {
      // DAILY trigger works on both iOS and Android and survives app restarts
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'habits' : undefined,
    } as any,
  });
}

// ── Cancel helper ────────────────────────────────────────────────────────────
export async function cancelReminderNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.cancelScheduledNotificationAsync(id + '_early');
  await Notifications.cancelScheduledNotificationAsync('habit_' + id);
  await Notifications.cancelScheduledNotificationAsync('vn_' + id);
}
