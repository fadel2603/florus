import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

interface StepCardProps {
  step: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  desc: string;
}

export default function StepCard({ step, icon, title, desc }: StepCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{step}</Text>
      </View>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 11,
    color: Colors.textDark,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 3,
  },
  desc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
});
