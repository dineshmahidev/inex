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

  useEffect(() => {
    async function initialize() {
      try {
        // Initial system UI background
        await SystemUI.setBackgroundColorAsync('#000000');
        
        // Request notification permissions and init
        try {
          await requestNotificationPermissions();
          await initNotifications();
        } catch (error) {
          console.warn("Notification init failed:", error);
        }

        // Initialize Google Mobile Ads
        try {
          const mobileAds = require('react-native-google-mobile-ads').default;
          await mobileAds().initialize();
        } catch (e) {
          // Ignore if native module isn't built
        }

      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        // Safety: If database is loaded or we hit an error, hide splash
        if (!isLoading) {
           setTimeout(() => {
             SplashScreen.hideAsync().catch(() => {});
           }, 500);
        }
      }
    }

    initialize();

    // Absolute fallback: hide splash after 7 seconds no matter what
    const fallbackTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 7000);

    return () => clearTimeout(fallbackTimer);
  }, [isLoading, settings.hasOnboarded]);

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
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
