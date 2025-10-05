import { Redirect } from 'expo-router';

// ✅ Redirect to topics if accessing /simulation directly
export default function SimulationIndexScreen() {
  return <Redirect href="/(tabs)/topics" />;
}