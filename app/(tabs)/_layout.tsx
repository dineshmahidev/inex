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
import React, { useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedIcon = ({ focused, children }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
};

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
            <AnimatedIcon focused={focused}>
              <LayoutDashboard
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </AnimatedIcon>
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
            <AnimatedIcon focused={focused}>
              <History size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </AnimatedIcon>
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
            <AnimatedIcon focused={focused}>
              <BellRing size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </AnimatedIcon>
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
            <AnimatedIcon focused={focused}>
              <LayoutList
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </AnimatedIcon>
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
            <AnimatedIcon focused={focused}>
              <Settings size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </AnimatedIcon>
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
