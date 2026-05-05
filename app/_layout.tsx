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

      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        // Safety: If database is loaded or we hit an error, hide splash
        if (!isLoading) {
           // Small delay to ensure navigation is ready
           setTimeout(() => {
             SplashScreen.hideAsync().catch(() => {});
             
             // Auto-redirect if onboarded
             if (settings.hasOnboarded) {
                router.replace('/(tabs)');
             }
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
      <Stack screenOptions={{ headerShown: false }} initialRouteName="onboarding">
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="(tabs)" />
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
