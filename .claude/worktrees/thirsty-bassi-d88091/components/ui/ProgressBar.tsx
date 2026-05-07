import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0–1
  style?: ViewStyle;
}

export default function ProgressBar({ progress, style }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 5,
    backgroundColor: Colors.white,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
});
