import 'react-native-reanimated';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SystemUI from 'expo-system-ui';
import * as Notifications from 'expo-notifications';
import { DatabaseProvider, useDatabase } from '@/context/DatabaseContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { requestNotificationPermissions, initNotifications } from '@/utils/notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplash from '@/components/AnimatedSplash';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppContent() {
  const { isLoading } = useDatabase();
  const [dbReady, setDbReady] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    async function nativeInit() {
      try {
        await SystemUI.setBackgroundColorAsync('#fcd002').catch(() => {});
        try {
          await requestNotificationPermissions();
          await initNotifications();
        } catch (error) {
          console.warn("Notification init failed:", error);
        }
        try {
          const mobileAds = require('react-native-google-mobile-ads').default;
          await mobileAds().initialize();
        } catch (e) {}
      } catch (error) {
        console.error("Native init error:", error);
      }
    }
    nativeInit();
  }, []);

  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 4500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && minSplashDone) {
      setDbReady(true);
    }
  }, [isLoading, minSplashDone]);

  useEffect(() => {
    const fallback = setTimeout(() => {
      setDbReady(true);
      setAnimDone(true);
    }, 8000);
    return () => clearTimeout(fallback);
  }, []);

  const showSplash = !animDone || !dbReady;

  if (showSplash) {
    return <AnimatedSplash ready={dbReady} onFinish={() => setAnimDone(true)} />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lock" />
        <Stack.Screen name="portfolio" />
        <Stack.Screen name="splash-transition" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
