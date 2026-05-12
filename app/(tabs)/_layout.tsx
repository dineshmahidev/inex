import { useDatabase } from "@/hooks/useDatabase";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import {
    BellRing,
    History,
    LayoutDashboard,
    LayoutList,
    Settings,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
          height: 65 + insets.bottom,
          elevation: 15,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          paddingTop: 10,
        },
        tabBarIconStyle: {
          width: 32,
          height: 32,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard
              size={26}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
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
            <History size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
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
            <BellRing size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
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
            <LayoutList
              size={26}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
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
            <Settings size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
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

const styles = StyleSheet.create({});
