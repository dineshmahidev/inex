import 'react-native-reanimated';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import * as SystemUI from 'expo-system-ui';
import * as Notifications from 'expo-notifications';
import { DatabaseProvider, useDatabase } from '@/context/DatabaseContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { requestNotificationPermissions, initNotifications } from '@/utils/notifications';
import { saveNotification } from '@/utils/notificationStore';
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

/** Determines the app route to navigate to based on notification data */
function resolveRoute(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  const type = data.type as string | undefined;
  if (type === 'reminder')  return '/(tabs)/reminders';
  if (type === 'habit') {
    return data.id ? `/habit/${data.id}` : '/(tabs)/index';
  }
  if (type === 'todo')      return '/(tabs)/todo';
  if (type === 'voice')     return '/voice-notes';
  return null;
}

function AppContent() {
  const { isLoading, Colors } = useDatabase();
  const router = useRouter();
  const [dbReady, setDbReady]       = useState(false);
  const [animDone, setAnimDone]     = useState(false);
  const [minSplashDone, setMinSplashDone] = useState(false);

  // ── Capture notifications received while app is open ────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(async (n) => {
      const type = (n.request.content.data?.type as AppNotifType) || 'general';
      await saveNotification({
        title:    n.request.content.title  || 'Notification',
        body:     n.request.content.body   || '',
        type,
        entityId: n.request.content.data?.id as string | undefined,
      });
    });
    return () => sub.remove();
  }, []);

  // ── Navigate when user taps a notification ───────────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      const type = (data?.type as AppNotifType) || 'general';

      // Save to inbox first
      await saveNotification({
        title:    response.notification.request.content.title || 'Notification',
        body:     response.notification.request.content.body  || '',
        type,
        entityId: data?.id as string | undefined,
      });

      // Deep-link to the relevant screen
      const route = resolveRoute(data);
      if (route) {
        // Small delay to let the app fully mount
        setTimeout(() => {
          try { router.push(route as any); } catch {}
        }, 500);
      }
    });
    return () => sub.remove();
  }, [router]);

  // ── Startup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function nativeInit() {
      try {
        try {
          await requestNotificationPermissions();
          await initNotifications();
        } catch (error) {
          console.warn('Notification init failed:', error);
        }
        try {
          const mobileAds = require('react-native-google-mobile-ads').default;
          await mobileAds().initialize();
        } catch (e) {}
      } catch (error) {
        console.error('Native init error:', error);
      }
    }
    nativeInit();
  }, []);

  useEffect(() => {
    if (Colors?.background) {
      SystemUI.setBackgroundColorAsync(Colors.background).catch(() => {});
    }
  }, [Colors?.background]);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && minSplashDone) setDbReady(true);
  }, [isLoading, minSplashDone]);

  useEffect(() => {
    const fallback = setTimeout(() => { setDbReady(true); setAnimDone(true); }, 8000);
    return () => clearTimeout(fallback);
  }, []);

  const showSplash = !animDone || !dbReady;
  if (showSplash) {
    return <AnimatedSplash ready={dbReady} onFinish={() => setAnimDone(true)} color={Colors.primary} />;
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
        <Stack.Screen name="notes" options={{ presentation: 'modal' }} />
        <Stack.Screen name="voice-notes" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-habit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="manifestation" />
        <Stack.Screen name="notification-center" />
      </Stack>
      <StatusBar backgroundColor="transparent" style="dark" translucent={true} />
    </ThemeProvider>
  );
}

type AppNotifType = 'reminder' | 'habit' | 'todo' | 'voice' | 'general';

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
