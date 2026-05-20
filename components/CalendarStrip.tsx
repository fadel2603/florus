import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

const DAYS_FR  = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ── Geometry ──────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
// screen paddingHorizontal:20 + card padding:16 on each side
const CONTAINER_W = SCREEN_W - (20 + 16) * 2;
const CELL_GAP    = 4;
const CELL_W      = (CONTAINER_W - CELL_GAP * 6) / 7;

// ── Week data (built once at startup) ─────────────────────────────────────────
const WEEKS_BEFORE   = 12;   // ~3 months back
const WEEKS_AFTER    = 52;   // 1 year forward
const TODAY_WEEK_IDX = WEEKS_BEFORE;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Monday-first (European)
  const diff = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - diff);
  return d;
}

function buildWeeks(): Date[][] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const thisWeekStart = getWeekStart(base);
  return Array.from({ length: WEEKS_BEFORE + 1 + WEEKS_AFTER }, (_, w) => {
    const weekStart = new Date(thisWeekStart);
    weekStart.setDate(thisWeekStart.getDate() + (w - WEEKS_BEFORE) * 7);
    return Array.from({ length: 7 }, (__, d) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      return day;
    });
  });
}

const ALL_WEEKS = buildWeeks();

// ── Helpers ───────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return (
    a.getDate()     === b.getDate()  &&
    a.getMonth()    === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function dateToWeekIndex(date: Date): number {
  const ws   = getWeekStart(date);
  const base = ALL_WEEKS[TODAY_WEEK_IDX][0];
  const diff = Math.round((ws.getTime() - base.getTime()) / (7 * 86400000));
  return Math.max(0, Math.min(ALL_WEEKS.length - 1, TODAY_WEEK_IDX + diff));
}

// ── Component ─────────────────────────────────────────────────────────────────
type Props = { onDateChange?: (date: Date) => void; value?: Date; taskDays?: Set<number> };

export default function CalendarStrip({ onDateChange, value, taskDays }: Props) {
  const listRef = useRef<FlatList>(null);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const [selected, setSelected] = useState<Date>(value ?? todayDate);
  const [weekIdx,  setWeekIdx]  = useState(dateToWeekIndex(value ?? todayDate));

  const scrollToWeek = (idx: number, animated: boolean) => {
    listRef.current?.scrollToOffset({ offset: idx * CONTAINER_W, animated });
  };

  // Initial scroll (no animation)
  useEffect(() => {
    setTimeout(() => scrollToWeek(weekIdx, false), 50);
  }, []);

  // External value change (e.g. parent resets to today)
  useEffect(() => {
    if (!value || isSameDay(value, selected)) return;
    const idx = dateToWeekIndex(value);
    setSelected(value);
    setWeekIdx(idx);
    scrollToWeek(idx, true);
  }, [value]);

  const handleSelect = (d: Date) => {
    const idx = dateToWeekIndex(d);
    setSelected(d);
    setWeekIdx(idx);
    onDateChange?.(d);
  };

  const goToToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setSelected(now);
    setWeekIdx(TODAY_WEEK_IDX);
    scrollToWeek(TODAY_WEEK_IDX, true);
    onDateChange?.(now);
  };

  // Month label follows the visible week (updated on swipe end)
  const firstDayOfWeek = ALL_WEEKS[weekIdx]?.[0] ?? selected;
  const monthLabel = `${MONTHS_FR[firstDayOfWeek.getMonth()]} ${firstDayOfWeek.getFullYear()}`;
  const isOnToday  = isSameDay(selected, todayDate);

  const renderWeek = ({ item: week }: { item: Date[] }) => (
    <View style={styles.week}>
      {week.map((d, i) => {
        const active   = isSameDay(d, selected);
        const isToday_ = isSameDay(d, todayDate);
        const hasTask  = taskDays?.has(d.getDay()) ?? false;

        let indicator: React.ReactElement;
        if (active) {
          // jour sélectionné : point blanc discret si tâche, sinon vide
          indicator = hasTask
            ? <View style={styles.taskDotActive} />
            : <View style={styles.indicatorPlaceholder} />;
        } else if (isToday_) {
          // aujourd'hui non sélectionné : barre verte (priorité sur le point)
          indicator = <View style={styles.todayBar} />;
        } else if (hasTask) {
          // autre jour avec tâches : petit point gris
          indicator = <View style={styles.taskDot} />;
        } else {
          indicator = <View style={styles.indicatorPlaceholder} />;
        }

        return (
          <TouchableOpacity
            key={i}
            style={[styles.dayCell, active && styles.dayCellActive]}
            onPress={() => handleSelect(d)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayName, active && styles.dayNameActive]}>
              {DAYS_FR[d.getDay()]}
            </Text>
            <Text style={[styles.dayNum, active && styles.dayNumActive]}>
              {d.getDate()}
            </Text>
            {indicator}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View>
      {/* Header: mois à gauche, "Aujourd'hui" à droite si on n'y est pas */}
      <View style={styles.header}>
        <Text style={styles.month}>{monthLabel}</Text>
        {!isOnToday && (
          <TouchableOpacity onPress={goToToday} style={styles.todayBtn} activeOpacity={0.7}>
            <Text style={styles.todayBtnText}>Aujourd'hui</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={ALL_WEEKS}
        renderItem={renderWeek}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: CONTAINER_W,
          offset: CONTAINER_W * index,
          index,
        })}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / CONTAINER_W);
          setWeekIdx(idx);
        }}
        extraData={selected}
        decelerationRate="fast"
        initialNumToRender={3}
        windowSize={3}
        style={{ width: CONTAINER_W }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  month: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  todayBtn: {
    backgroundColor: '#E8F5E0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayBtnText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 12,
    color: Colors.textDark,
  },

  week: {
    width: CONTAINER_W,
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  dayCell: {
    width: CELL_W,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  dayCellActive: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  dayNameActive: {
    color: Colors.white,
    fontFamily: FontFamily.calendarBold,
  },
  dayNum: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 20,
    color: Colors.textSecondary,
  },
  dayNumActive: {
    color: Colors.white,
  },
  todayBar: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.textMuted,
    marginTop: 3,
    opacity: 0.55,
  },
  taskDotActive: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.white,
    marginTop: 3,
    opacity: 0.7,
  },
  indicatorPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 3,
  },
});
