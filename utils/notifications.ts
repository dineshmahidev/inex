import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function initNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7A00',
      sound: 'mixkit_bell_notification_933', // No extension for Android resource
    });
  }
}

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleReminderNotification(id: string, name: string, amount: number, date: Date) {
  if (date.getTime() <= Date.now() + 1000) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Payment Reminder 🅾️',
      body: `It's time to pay ${name} amount of ${amount.toLocaleString()}. Keep your credit score elite!`,
      data: { id },
      sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: date,
      channelId: 'default',
    },
  });
}

export async function scheduleMonthlyReminderNotification(id: string, name: string, amount: number, dueDay: number, alertType: 'on_day' | '2_days_before' | 'both') {
  // Cancel previous first just in case
  await cancelReminderNotification(id);
  await cancelReminderNotification(id + '_early');

  const schedule = async (dayToTrigger: number, isEarly: boolean) => {
    let safeDay = dayToTrigger;
    if (safeDay <= 0) safeDay = 28 + safeDay; // simple wrap around
    if (safeDay > 31) safeDay = 31;
    
    await Notifications.scheduleNotificationAsync({
      identifier: isEarly ? id + '_early' : id,
      content: {
        title: isEarly ? 'Upcoming Payment 🅾️' : 'Payment Due Today! 🅾️',
        body: isEarly 
          ? `Your payment for ${name} (${amount.toLocaleString()}) is due in 2 days.`
          : `It's time to pay ${name} amount of ${amount.toLocaleString()} today.`,
        data: { id },
        sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        day: safeDay,
        hour: 9,
        minute: 0,
      },
    });
  };

  if (alertType === 'on_day' || alertType === 'both') {
    await schedule(dueDay, false);
  }
  if (alertType === '2_days_before' || alertType === 'both') {
    await schedule(dueDay - 2, true);
  }
}

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
      date: date,
      channelId: 'default',
    },
  });
}

export async function cancelReminderNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.cancelScheduledNotificationAsync(id + '_early');
}
