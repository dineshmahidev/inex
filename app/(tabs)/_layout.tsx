import { useDatabase } from "@/hooks/useDatabase";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import {
  Home,
  TrendingUp,
  Wrench,
  User,
  Plus,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32;
// 5 positions: Home, Progress, [Center Placeholder], Tools, Profile
const TAB_COUNT = 5;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;

const TABS = [
  { name: "index",    label: "Home",     Icon: Home },
  { name: "progress", label: "Progress", Icon: TrendingUp },
  { name: "placeholder", label: "",      Icon: null }, // Center Placeholder for FAB
  { name: "tools",    label: "Tools",    Icon: Wrench },
  { name: "profile",  label: "Profile",  Icon: User },
];

// ─── Individual Tab Item ──────────────────────────────────────────────────────
function TabItem({
  tab,
  index,
  activeIndex,
  Colors,
  onPress,
}: {
  tab: typeof TABS[0];
  index: number;
  activeIndex: number;
  Colors: any;
  onPress: () => void;
}) {
  const focused = activeIndex === index;
  const scale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const labelTranslateY = useRef(new Animated.Value(focused ? 0 : 6)).current;
  const bgScale = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const glowOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }),
      Animated.spring(labelOpacity, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.spring(labelTranslateY, {
        toValue: focused ? 0 : 6,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.spring(bgScale, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }),
      Animated.timing(glowOpacity, {
        toValue: focused ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const { Icon } = tab;
  
  if (!Icon) {
    return <View style={styles.tabItem} pointerEvents="none" />;
  }

  const iconColor = focused ? Colors.primary : "#94A3B8";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.tabItem}
    >


      {/* Icon */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon
          size={20}
          color={iconColor}
          strokeWidth={focused ? 2.5 : 1.8}
        />
      </Animated.View>

      {/* Label */}
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: Colors.primary,
            opacity: labelOpacity,
            transform: [{ translateY: labelTranslateY }],
          },
        ]}
      >
        {tab.label}
      </Animated.Text>

      {/* Active dot */}
      {focused && (
        <View
          style={[styles.activeDot, { backgroundColor: Colors.primary }]}
        />
      )}
    </TouchableOpacity>
  );
}



// ─── Center FAB Button ────────────────────────────────────────────────────────
function FabButton({ Colors, insets, router }: { Colors: any; insets: any; router: any }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/add-habit");
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.fabWrapper, { bottom: insets.bottom + 18 }]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.fab, { backgroundColor: Colors.primary, borderColor: "#FFF" }]}
      >
        <Plus color="#FFF" size={26} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({
  state,
  navigation,
  Colors,
  insets,
}: {
  state: any;
  navigation: any;
  Colors: any;
  insets: any;
}) {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, []);

  // Map state route index to visual tab index (skipping the middle placeholder)
  const indexMap = [0, 1, 3, 4];
  const activeTabBarIndex = indexMap[state.index];

  return (
    <Animated.View
      style={[
        styles.tabBarOuter,
        {
          bottom: insets.bottom + 12,
          backgroundColor: Colors.card || "#FFF",
          borderColor: "rgba(243, 244, 246, 0.8)",
          transform: [{ translateY }],
        },
      ]}
    >


      {TABS.map((tab, index) => {
        if (tab.name === "placeholder") {
          return <View key="placeholder" style={styles.tabItem} pointerEvents="none" />;
        }

        const routeIndex = index < 2 ? index : index - 1;

        return (
          <TabItem
            key={tab.name}
            tab={tab}
            index={index}
            activeIndex={activeTabBarIndex}
            Colors={Colors}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: "tabPress",
                target: state.routes[routeIndex]?.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(state.routes[routeIndex]?.name);
              }
            }}
          />
        );
      })}
    </Animated.View>
  );
}

// ─── Layout Root ──────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { Colors, settings, updateSettings } = useDatabase();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <CustomTabBar {...props} Colors={Colors} insets={insets} />
        )}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="progress" />
        <Tabs.Screen name="tools" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <FabButton Colors={Colors} insets={insets} router={router} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },

  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    gap: 2,
  },
  glowRing: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  activeDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  fabWrapper: {
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  fabGlow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#F472B6",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    borderWidth: 2,
  },
});
