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
          height: 65 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
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
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && <View style={styles.indicator} />}
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
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && <View style={styles.indicator} />}
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
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && <View style={styles.indicator} />}
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
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && <View style={styles.indicator} />}
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
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && <View style={styles.indicator} />}
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
  indicator: {
    position: "absolute",
    top: -8, // 2px gap above the icon
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#EB6001", // Hardcoded primary for styles or use inline
  },
});
