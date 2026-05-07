import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassButtonProps {
  size?: number;
  onPress?: () => void;
  activeOpacity?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

// iOS 26 Liquid Glass button — BlurView with very light translucent fill.
// Outer wrapper carries the shadow (must not have overflow:hidden so shadow renders).
// Inner TouchableOpacity clips the blur to the border radius.
export default function GlassButton({
  size = 44,
  onPress,
  activeOpacity = 0.75,
  children,
  style,
}: GlassButtonProps) {
  const r = size / 2;
  return (
    <View style={[styles.shadow, { width: size, height: size, borderRadius: r }, style]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[styles.clip, { borderRadius: r }]}
      >
        {Platform.OS === 'ios' && (
          <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
        )}
        {/* Very light tint — lets the blur be the dominant surface */}
        <View style={[StyleSheet.absoluteFill, styles.fill]} />
        {children}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(255,255,255,0.18)'
      : 'rgba(255,255,255,0.93)',
  },
});
