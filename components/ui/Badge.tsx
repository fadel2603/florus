import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'neutral' | 'count';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
}

const VARIANTS: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primary,        text: Colors.textDark },
  success: { bg: Colors.primary + '30', text: Colors.textDark },
  warning: { bg: Colors.orange + '22',  text: Colors.orange   },
  neutral: { bg: Colors.background,     text: Colors.textDark },
  count:   { bg: Colors.background,     text: Colors.textSecondary },
};

export default function Badge({ label, variant = 'neutral', icon, style }: BadgeProps) {
  const { bg, text } = VARIANTS[variant];
  const isCount = variant === 'count';

  return (
    <View style={[styles.base, isCount && styles.countBase, { backgroundColor: bg }, style]}>
      {icon && !isCount && <Ionicons name={icon} size={13} color={text} />}
      <Text style={[styles.label, { color: text }, isCount && styles.countLabel]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  countBase: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 12,
  },
  countLabel: {
    fontFamily: FontFamily.calendarBold,
    textAlign: 'center',
  },
});
