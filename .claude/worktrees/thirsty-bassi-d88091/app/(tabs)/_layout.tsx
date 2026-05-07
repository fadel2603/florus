import { Tabs } from 'expo-router';
import LiquidGlassTabBar from '@/components/LiquidGlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plants" />
      <Tabs.Screen name="scanner" />
    </Tabs>
  );
}
