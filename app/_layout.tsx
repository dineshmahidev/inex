import 'react-native-reanimated';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { DatabaseProvider, useDatabase } from '@/context/DatabaseContext';
import { requestNotificationPermissions, initNotifications } from '@/utils/notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppContent() {
  const { isLoading, settings } = useDatabase();
  const router = useRouter();

  // 1. Native Initialization (Runs once)
  useEffect(() => {
    async function nativeInit() {
      try {
        // System UI background
        await SystemUI.setBackgroundColorAsync('#000000').catch(() => {});
        
        // Notifications
        try {
          await requestNotificationPermissions();
          await initNotifications();
        } catch (error) {
          console.warn("Notification init failed:", error);
        }

        // AdMob
        try {
          const mobileAds = require('react-native-google-mobile-ads').default;
          await mobileAds().initialize();
        } catch (e) {
          // Fallback handled
        }
      } catch (error) {
        console.error("Native init error:", error);
      }
    }
    nativeInit();
  }, []);

  // 2. Splash Screen Hiding (Watches isLoading)
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // 3. Global Absolute Fallback
  useEffect(() => {
    const fallback = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 7000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lock" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
