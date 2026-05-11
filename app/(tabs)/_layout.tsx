import { useDatabase } from "@/hooks/useDatabase";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import {
  BellRing,
  LayoutDashboard,
  LayoutList,
  History,
  Settings,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

export default function TabLayout() {
  const { Colors } = useDatabase();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          height: Platform.OS === "ios" ? 60 + insets.bottom : 65,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && (
                <View
                  style={[styles.topLine, { backgroundColor: Colors.primary }]}
                />
              )}
              <LayoutDashboard
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.7}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && (
                <View
                  style={[styles.topLine, { backgroundColor: Colors.primary }]}
                />
              )}
              <History
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.7}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && (
                <View
                  style={[styles.topLine, { backgroundColor: Colors.primary }]}
                />
              )}
              <BellRing
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.7}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && (
                <View
                  style={[styles.topLine, { backgroundColor: Colors.primary }]}
                />
              )}
              <LayoutList
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.7}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && (
                <View
                  style={[styles.topLine, { backgroundColor: Colors.primary }]}
                />
              )}
              <Settings
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.7}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 44,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20, // Significantly increased space
  },
  topLine: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 4, // Slightly thicker for better visibility
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
