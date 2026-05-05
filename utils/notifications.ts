import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
  if (date <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Payment Reminder 🅾️',
      body: `It's time to pay ${name} amount of ${amount.toLocaleString()}. Keep your credit score elite!`,
      data: { id },
      sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
    },
    trigger: date,
  });
}

export async function scheduleTodoNotification(id: string, text: string, date: Date) {
  if (date <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Task Reminder ⚡',
      body: `Don't forget: ${text}. Stay in the flow!`,
      data: { id, type: 'todo' },
      sound: Platform.OS === 'ios' ? 'mixkit_bell_notification_933.wav' : 'mixkit_bell_notification_933',
    },
    trigger: date,
  });
}

export async function cancelReminderNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}
