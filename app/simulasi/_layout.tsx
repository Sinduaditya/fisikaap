import { AuthGuard } from '@/components/AuthGuard';
import { Stack } from 'expo-router';
import React from 'react';

export default function SimulationLayout() {
  return (
    <AuthGuard>
      {/* ✅ Single AuthGuard for entire simulation section */}
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="[slug]" />
        <Stack.Screen name="question/[id]" />
      </Stack>
    </AuthGuard>
  );
}