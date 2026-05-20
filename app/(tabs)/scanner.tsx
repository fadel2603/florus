import React from 'react';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AISheet from '@/components/AISheet';

export default function ScannerScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  return <AISheet mode="screen" visible onClose={() => {}} tabBarHeight={tabBarHeight} />;
}
