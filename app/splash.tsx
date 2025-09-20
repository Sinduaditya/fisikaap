import { colors, fonts } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const seen = await AsyncStorage.getItem("hasSeenOnboarding");
      if (!seen) {
        router.replace("/onboarding");
      } else {
        router.replace("/auth/login");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/icon/profile.png")} style={styles.logo} />
      <Text style={styles.text}>PhysicsPlay</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  logo: { width: 120, height: 120, marginBottom: 20 },
  text: { fontSize: fonts.title, fontWeight: "bold", color: colors.primary },
});
