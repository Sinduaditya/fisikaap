import { colors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { isAuthenticated, loading } = useAuth(); // ✅ Hanya perlu ini
  const [destination, setDestination] = useState<string | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!loading) {
      checkOnboardingStatus();
    }
  }, [loading, isAuthenticated]); // ✅ Dependency yang tepat

  const checkOnboardingStatus = async () => {
    try {
      if (isAuthenticated) {
        // ✅ User sudah login, langsung ke tabs
        setDestination("/(tabs)");
      } else {
        // ✅ User belum login, cek onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        if (hasSeenOnboarding === "true") {
          setDestination("/auth/login");
        } else {
          setDestination("/onboarding");
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setDestination("/onboarding");
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // ✅ Show loading while auth context is loading
  if (loading || checkingOnboarding) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ✅ Redirect based on auth state
  if (destination) {
    return <Redirect href={destination as any} />;
  }

  // ✅ Fallback
  return <Redirect href="/onboarding" />;
}