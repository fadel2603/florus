import React, { ReactNode } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  titleOpacity?: Animated.Value | Animated.AnimatedInterpolation<number>;
  titleSize?: number;
  subtitleSize?: number;
  right?: ReactNode;
  style?: ViewStyle;
}

export default function ScreenHeader({
  title,
  subtitle,
  titleOpacity,
  titleSize = 32,
  subtitleSize = 14,
  right,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>
        <Animated.Text
          style={[styles.title, { fontSize: titleSize, opacity: titleOpacity ?? 1 }]}
        >
          {title}
        </Animated.Text>
        {subtitle && <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  left: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.titleDisplay,
    color: Colors.textDark,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
