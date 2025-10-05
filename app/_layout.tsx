import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from "react";
import { AuthProvider } from '../contexts/AuthContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      console.log("✅ Fonts loaded:", fontsLoaded);
      if (fontError) console.error("❌ Font error:", fontError);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* ✅ Main entry point */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* ✅ Onboarding & Auth */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        
        {/* ✅ Main app tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* ✅ Modal screens */}
        <Stack.Screen 
          name="modal" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        
        {/* ✅ Simulation routes (FIXED) */}
        <Stack.Screen 
          name="simulation/index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="simulation/[slug]" 
          options={{ 
            headerShown: false,
            title: 'Simulation'
          }} 
        />
        <Stack.Screen 
          name="simulation/question/[id]" 
          options={{ 
            headerShown: false,
            title: 'Question Detail'
          }} 
        />
        
        {/* ✅ Topics routes (FIXED) */}
        <Stack.Screen 
          name="topics/index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="topics/[slug]" 
          options={{ 
            headerShown: false,
            title: 'Topic Detail'
          }} 
        />
        
      </Stack>
    </AuthProvider>
  );
}