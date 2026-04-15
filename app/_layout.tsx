import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';
import { DatabaseProvider } from '@/context/DatabaseContext';

export default function RootLayout() {
  useEffect(() => {
    // Initial system UI background
    SystemUI.setBackgroundColorAsync('#000000');
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
