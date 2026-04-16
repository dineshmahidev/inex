import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { requestNotificationPermissions } from '@/utils/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Initial system UI background
    SystemUI.setBackgroundColorAsync('#000000');
    
    // Request notification permissions
    requestNotificationPermissions();
  }, []);

  return (
    <DatabaseProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="onboarding">
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </DatabaseProvider>
  );
}
