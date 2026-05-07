import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconCircleProps {
  size?: number;
  backgroundColor: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  iconSize?: number;
  label?: string;
  style?: ViewStyle;
}

export default function IconCircle({
  size = 34,
  backgroundColor,
  icon,
  iconColor = '#000000',
  iconSize,
  label,
  style,
}: IconCircleProps) {
  const computedIconSize = iconSize ?? Math.round(size * 0.5);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={computedIconSize} color={iconColor} />}
      {label && (
        <Text style={[styles.label, { color: iconColor, fontSize: Math.round(size * 0.38) }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
  },
});
