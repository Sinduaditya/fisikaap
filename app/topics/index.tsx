import { Redirect } from 'expo-router';

// ✅ Redirect ke tab topics untuk menghindari konflik routing
export default function TopicsIndex() {
  return <Redirect href="/(tabs)/topics" />;
}