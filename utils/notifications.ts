import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7A00',
    });
  }

  return true;
}

export async function scheduleReminderNotification(id: string, name: string, amount: number, date: Date) {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Payment Reminder 🅾️',
      body: `It's time to pay ${name} amount of ${amount.toLocaleString()}. Keep your credit score elite!`,
      data: { id },
      sound: true,
    },
    trigger: date,
  });
}

export async function cancelReminderNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}
