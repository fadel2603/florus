import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor="#8DC93A"
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger
        name="index"
        options={{
          title: 'Accueil',
          icon: { sf: 'house' },
          selectedIcon: { sf: 'house.fill' },
        }}
      />
      <NativeTabs.Trigger
        name="plants"
        options={{
          title: 'Plantes',
          icon: { sf: 'leaf' },
          selectedIcon: { sf: 'leaf.fill' },
        }}
      />
      <NativeTabs.Trigger
        name="scanner"
        role="search"
        options={{
          title: 'IA',
          icon: { sf: 'sparkles' },
          selectedIcon: { sf: 'sparkles' },
        }}
      />
    </NativeTabs>
  );
}
