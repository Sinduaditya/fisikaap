import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarButton: HapticTab,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
      tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
      name="index"
      options={{
        title: "Home",
        tabBarIcon: ({ color }) => (
        <View style={styles.iconWrap}>
          <IconSymbol size={28} name="house" color={color} />
        </View>
        ),
      }}
      />
      <Tabs.Screen
      name="simulasi"
      options={{
        title: "Simulasi",
        tabBarIcon: ({ color }) => (
        <View style={styles.iconWrap}>
          <IconSymbol size={28} name="atom" color={color} />
        </View>
        ),
      }}
      />
      <Tabs.Screen
      name="profile"
      options={{
        title: "Profil",
        tabBarIcon: ({ focused }) => (
        <View style={styles.iconWrap}>
          <Image 
          source={require("@/assets/icon/profile.png")} 
          style={styles.iconImage}/>
        </View>
        ),
      }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: colors.card,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 5,
  },
  tabItem: {
    paddingVertical: 8,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconImage: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
  },
});