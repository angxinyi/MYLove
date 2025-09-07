import { Tabs } from "expo-router";
import React from "react";
import { Image, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
// import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: styles.activeColor.color,
        tabBarInactiveTintColor: styles.inactiveColor.color,
        tabBarLabelStyle: styles.tabLabelStyle,
        headerShown: false,
        tabBarButton: HapticTab,

        // tabBarBackground: TabBarBackground,
        // tabBarStyle: Platform.select({
        //   ios: {
        //     position: "absolute", // Transparent background on iOS
        //   },
        //   default: {},
        // }),
        tabBarStyle: styles.tabBarStyle,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      {/* Avatar */}
      <Tabs.Screen
        name="avatar"
        options={{
          title: "Avatar",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/heart.png")}
              style={{
                width: 28,
                height: 28,
                tintColor: color === "#000000" ? "#ec699c" : color,
              }}
            />
          ),
        }}
      />

      {/* Chat */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/chat.png")}
              style={{
                width: 28,
                height: 28,
                tintColor: color === "#000000" ? "#ec699c" : color,
              }}
            />
          ),
        }}
      />

      {/* Game */}
      <Tabs.Screen
        name="game-menu"
        options={{
          title: "Game",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/game.png")}
              style={{
                width: 28,
                height: 28,
                tintColor: color === "#000000" ? "#ec699c" : color,
              }}
            />
          ),
        }}
      />

      {/* Store */}
      <Tabs.Screen
        name="store"
        options={{
          title: "Store",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/store.png")}
              style={{
                width: 26,
                height: 26,
                tintColor: color === "#000000" ? "#ec699c" : color,
              }}
            />
          ),
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="setting"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/setting.png")}
              style={{
                width: 26,
                height: 26,
                tintColor: color === "#000000" ? "#ec699c" : color,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = {
  tabBarBackground: {
    backgroundColor: "#efb9aa",
    height: 90,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarStyle: {
    backgroundColor: "#ffacbeff",
    height: 90,
    borderTopWidth: 1,
    elevation: 0,
  },
  activeColor: {
    color: "#ff3963ff",
  },
  inactiveColor: {
    color: "#d84464b8",
  },
  tabLabelStyle: {
    fontSize: 14,
    fontWeight: "500",
  },
};
