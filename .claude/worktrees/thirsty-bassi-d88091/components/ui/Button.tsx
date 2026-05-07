import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

type ButtonVariant = 'primary' | 'secondary' | 'text';
type ButtonSize = 'lg' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconRight?: React.ComponentProps<typeof Ionicons>['name'];
  fullWidth?: boolean;
  style?: ViewStyle;
  activeOpacity?: number;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  fullWidth = false,
  style,
  activeOpacity = 0.82,
}: ButtonProps) {
  const isText = variant === 'text';
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        !isText && (size === 'lg' ? styles.lg : styles.sm),
        isPrimary && !isText && styles.primaryBg,
        variant === 'secondary' && styles.secondaryBg,
        isText && styles.textVariant,
        !isText && fullWidth && styles.fullWidth,
        iconRight ? styles.spaceBetween : styles.centered,
        style,
      ]}
      onPress={onPress}
      activeOpacity={activeOpacity}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={size === 'lg' ? 18 : 16}
          color={isText ? Colors.textMuted : Colors.textDark}
        />
      )}
      <Text
        style={[
          styles.label,
          size === 'sm' && styles.labelSm,
          isText && styles.textLabel,
          iconRight && styles.labelFlex,
        ]}
      >
        {label}
      </Text>
      {iconRight && (
        <Ionicons
          name={iconRight}
          size={size === 'lg' ? 16 : 14}
          color={isText ? Colors.textMuted : Colors.textDark}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lg: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 20,
  },
  sm: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBg: {
    backgroundColor: Colors.primary,
  },
  secondaryBg: {
    backgroundColor: Colors.cardBg,
  },
  textVariant: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    height: undefined,
  },
  fullWidth: {
    width: '100%',
  },
  centered: {
    justifyContent: 'center',
  },
  spaceBetween: {
    justifyContent: 'flex-start',
  },
  label: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: Colors.textDark,
  },
  labelSm: {
    fontSize: 13,
  },
  textLabel: {
    color: Colors.textMuted,
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
  },
  labelFlex: {
    flex: 1,
  },
});
