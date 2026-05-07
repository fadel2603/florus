import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function buildWeekDays(anchor: Date) {
  const days = [];
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

type Props = { onDateChange?: (date: Date) => void; value?: Date };

export default function CalendarStrip({ onDateChange, value }: Props) {
  const [selected, setSelected] = useState(value ?? new Date());
  const today = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  React.useEffect(() => {
    if (value && !isSameDay(value, selected)) {
      setSelected(value);
    }
  }, [value]);

  const days = buildWeekDays(selected);

  const handleSelect = (d: Date) => {
    setSelected(d);
    onDateChange?.(d);
  };

  return (
    <View>
      {/* "Avr 2026" — petit, gris, Urbanist Medium */}
      <Text style={styles.month}>
        {MONTHS_FR[selected.getMonth()]} {selected.getFullYear()}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {days.map((d, i) => {
          const active = isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(d)}
              style={[styles.dayCell, active && styles.dayCellActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, active && styles.dayNameActive]}>
                {DAYS_FR[d.getDay()]}
              </Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                {d.getDate()}
              </Text>
              {/* Today indicator: barre verte sous le numéro */}
              {isToday && !active
                ? <View style={styles.todayBar} />
                : <View style={styles.todayBarPlaceholder} />
              }
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  month: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  strip: {
    gap: 4,
  },
  dayCell: {
    width: 44,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  dayCellActive: {
    backgroundColor: Colors.primary, // #B5F15B
  },
  dayName: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  dayNameActive: {
    color: Colors.white,               // texte blanc sur pill vert
    fontFamily: FontFamily.calendarBold,
  },
  dayNum: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 20,
    color: Colors.textSecondary,
  },
  dayNumActive: {
    color: Colors.white,               // texte blanc sur pill vert
  },
  // Barre verte sous le numéro du jour actuel
  todayBar: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  todayBarPlaceholder: {
    width: 18,
    height: 3,
    marginTop: 2,
  },
});
