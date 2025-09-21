import { colors, fonts } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const [userInfo, setUserInfo] = useState({
    name: "Loading...",
    email: "Loading...",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load user data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      const email = await AsyncStorage.getItem("userEmail");
      
      setUserInfo({
        name: name || "User",
        email: email || "user@example.com",
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari akun ini?",
      [
        { 
          text: "Batal", 
          style: "cancel" 
        },
        { 
          text: "Ya, Keluar", 
          style: "destructive",
          onPress: performLogout
        },
      ]
    );
  };

  const performLogout = async () => {
    setLoading(true);
    
    try {
      // Clear all user data from AsyncStorage
      await AsyncStorage.multiRemove([
        "isLoggedIn",
        "userEmail", 
        "userName",
        "userToken"
      ]);

      console.log("AsyncStorage Clear");

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate back to onboarding screen
      router.replace("/onboarding");
      
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Terjadi kesalahan saat logout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      <View style={styles.card}>
        <Image source={require("@/assets/icon/profile.png")} style={styles.avatar} />
        <Text style={styles.name}>{userInfo.name}</Text>
        <Text style={styles.email}>{userInfo.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Student</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📚</Text>
          <Text style={styles.menuText}>Riwayat Pembelajaran</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Progress Belajar</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Pengaturan</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Bantuan & FAQ</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>ℹ️</Text>
          <Text style={styles.menuText}>Tentang Aplikasi</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, loading && styles.logoutButtonDisabled]} 
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={styles.logoutText}>
          {loading ? "Keluar..." : "🚪 Keluar dari Akun"}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PhysicsPlay v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

// Update bagian styles untuk profile.tsx
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  headerTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title, // Baloo2 Bold
    color: colors.primary,
    textAlign: "center",
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 16 
  },
  name: { 
    fontSize: fonts.sizes.subtitle, 
    fontFamily: fonts.subtitle, // Baloo2 SemiBold
    color: colors.primary,
    marginBottom: 4,
  },
  email: { 
    color: colors.muted,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body, // Nunito Regular
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.accent + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.accent,
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.bodySemiBold, // Nunito SemiBold
  },
  menuSection: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  menuText: {
    flex: 1,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body, // Nunito Regular
    color: colors.text,
  },
  menuArrow: {
    fontSize: 18,
    color: colors.muted,
    fontFamily: fonts.body, // Nunito Regular
  },
  debugSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff9500" + "30",
  },
  debugTitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.subtitle, // Baloo2 SemiBold
    color: "#ff9500",
    marginBottom: 12,
    textAlign: "center",
  },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: "#ff4444",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#ff4444",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoutButtonDisabled: {
    backgroundColor: colors.muted,
    elevation: 0,
    shadowOpacity: 0,
  },
  logoutText: {
    color: "#fff",
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyBold, // Nunito Bold
  },
  footer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  footerText: {
    color: colors.muted,
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body, // Nunito Regular
    fontStyle: "italic",
  },
});