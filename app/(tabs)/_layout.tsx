import { AuthGuard } from "@/components/AuthGuard"; // ✅ Keep only ONE AuthGuard here
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <AuthGuard>
      {/* ✅ Single AuthGuard protects ALL tabs */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarButton: HapticTab,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
        title: "Home",
        tabBarIcon: ({ color }) => (
          <View style={styles.iconWrap}>
            <IconSymbol size={24} name="house" color={color} />
          </View>
        ),
          }}
        />
        <Tabs.Screen
          name="topics"
          options={{
        title: "Topics",
        tabBarIcon: ({ color }) => (
            <View style={styles.iconWrap}>
            <IconSymbol size={24} name="book" color={color} />
            </View>
          ),
          }}
        />
        <Tabs.Screen
          name="achievements"
          options={{
          title: "Achievement",
          href: null, // This hides the tab from being displayed
          tabBarIcon: ({ color }) => (
            <View style={styles.iconWrap}>
            <IconSymbol size={24} name="trophy" color={color} />
            </View>
          ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
          tabBarIcon: ({ color }) => (
          <View style={styles.iconWrap}>
            <IconSymbol size={24} name="person" color={color} />
          </View>
        ),
          }}
        />
      <Tabs.Screen
        name="challenges"
        options={{
        title: "Challenges",
        href: null, // This hides the tab from being displayed
        tabBarIcon: ({ color }) => (
          <View style={styles.iconWrap}>
          <IconSymbol size={24} name="target" color={color} />
          </View>
        ),
        }}
      />
      </Tabs>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    marginRight: 20,
    marginLeft: 20,
    height: 70,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});