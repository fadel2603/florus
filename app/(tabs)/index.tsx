import React, { useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import CalendarStrip from '@/components/CalendarStrip';
import PlantPreviewSheet from '@/components/PlantPreviewSheet';
import { useFocusEffect, useRouter } from 'expo-router';
import { TASKS_BY_DAY, Task, PLANTS, TASK_TYPE_META, logHistoryEvent } from '@/constants/data';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TaskGroup from '@/components/ui/TaskGroup';

const SCREEN_W = Dimensions.get('window').width;
const SLIDE_DIST = SCREEN_W * 0.35;
const ANIM_DURATION = 250;

type GroupConfig = {
  type: Task['type'];
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
};

const GROUPS: GroupConfig[] = [
  { type: 'water',   label: 'Arroser',  iconName: 'water', iconColor: '#2196F3', iconBg: Colors.waterIconBg },
  { type: 'observe', label: 'Observer', iconName: 'eye',   iconColor: '#2E7D32', iconBg: '#C8E6C9' },
];

function getTasksForDate(date: Date): Task[] {
  const day = date.getDay();
  return (TASKS_BY_DAY[day] ?? []).map(t => ({ ...t }));
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>(getTasksForDate(today));
  const [headerHeight, setHeaderHeight] = useState(insets.top + 100);

  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const previewPlant = previewTask ? PLANTS.find(p => p.id === previewTask.plantId) ?? null : null;

  useFocusEffect(
    useCallback(() => {
      setTasks(getTasksForDate(selectedDate));
    }, [selectedDate])
  );

  const scrollY      = useRef(new Animated.Value(0)).current;
  const translateX   = useRef(new Animated.Value(0)).current;
  const opacity      = useRef(new Animated.Value(1)).current;
  const todayBtnOpacity = useRef(new Animated.Value(0)).current;

  const toggle = (id: string) =>
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      if (nowDone) {
        const meta = TASK_TYPE_META[t.type] ?? { label: t.type, icon: 'checkmark-circle', color: Colors.primary };
        logHistoryEvent(t.plantId, {
          id: `done_${id}_${Date.now()}`,
          type: 'task_done',
          label: meta.label,
          date: new Date().toISOString(),
          icon: meta.icon,
          color: meta.color,
        });
      }
      return { ...t, done: nowDone };
    }));

  const doneCnt = tasks.filter(t => t.done).length;

  const handleDateChange = (newDate: Date, skipAnim?: boolean) => {
    const isToday = isSameDay(newDate, today);
    Animated.timing(todayBtnOpacity, {
      toValue: isToday ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const direction = newDate > selectedDate ? 1 : -1;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIM_DURATION / 2,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(translateX, {
        toValue: -direction * SLIDE_DIST * 0.4,
        duration: ANIM_DURATION / 2,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ]).start(() => {
      setSelectedDate(newDate);
      setTasks(getTasksForDate(newDate));
      translateX.setValue(direction * SLIDE_DIST);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start();
    });
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const sectionLabel = isSameDay(selectedDate, today)
    ? 'Aujourd\'hui'
    : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + 8 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ── CALENDRIER ── */}
        <View style={styles.calendarCard}>
          <Animated.View style={[styles.todayBtn, { opacity: todayBtnOpacity }]} pointerEvents={isSameDay(selectedDate, today) ? 'none' : 'auto'}>
            <TouchableOpacity onPress={() => handleDateChange(new Date())} activeOpacity={0.7}>
              <Text style={styles.todayBtnText}>Aujourd'hui</Text>
            </TouchableOpacity>
          </Animated.View>
          <CalendarStrip onDateChange={handleDateChange} value={selectedDate} />
        </View>

        {/* ── BLOC TÂCHES ANIMÉ ── */}
        <Animated.View style={{ opacity, transform: [{ translateX }] }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{sectionLabel}</Text>
            {tasks.length > 0 && (
              <Badge label={`${doneCnt}/${tasks.length} fait`} variant="success" />
            )}
          </View>

          {tasks.length > 0 && (
            <ProgressBar
              progress={tasks.length > 0 ? doneCnt / tasks.length : 0}
              style={styles.progressBar}
            />
          )}

          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune tâche ce jour 🌿</Text>
            </View>
          ) : (
            <View style={styles.groups}>
              {GROUPS.map(group => {
                const groupTasks = tasks.filter(t => t.type === group.type);
                if (!groupTasks.length) return null;
                return (
                  <TaskGroup
                    key={group.type}
                    label={group.label}
                    iconName={group.iconName}
                    iconColor={group.iconColor}
                    iconBg={group.iconBg}
                    tasks={groupTasks}
                    onToggle={toggle}
                    onPhotoPress={setPreviewTask}
                  />
                );
              })}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      <PlantPreviewSheet
        plant={previewPlant}
        taskType={previewTask?.type}
        onClose={() => setPreviewTask(null)}
      />

      {/* ── STICKY LIQUID GLASS HEADER ── */}
      <View
        style={styles.stickyHeader}
        onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        {/* Blur fills the full header area */}
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
        {/* Tinted fill to match background hue */}
        <View style={[StyleSheet.absoluteFill, styles.stickyHeaderBg]} pointerEvents="none" />
        {/* Bottom border to separate from content */}
        <View style={[StyleSheet.absoluteFill, styles.stickyHeaderBorder]} pointerEvents="none" />

        <View style={[styles.stickyHeaderContent, { paddingTop: insets.top + 16 }]}>
          <ScreenHeader
            title="Bonjour 👋"
            subtitle="Tes plantes t'attendent"
            titleSize={28}
            style={{ marginBottom: 0 }}
            right={
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => router.push('/profile' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.avatarText}>FG</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },

  // ── Sticky glass header ──
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stickyHeaderBg: {
    backgroundColor: 'rgba(245,247,240,0.55)',
  },
  stickyHeaderBorder: {
    bottom: 0,
    top: undefined,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  stickyHeaderContent: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  // ── Avatar button ──
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 14,
    color: Colors.textDark,
  },

  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  todayBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FontFamily.headerBold,
    fontSize: 20,
    color: Colors.textDark,
  },

  progressBar: {
    marginBottom: 20,
  },

  groups: { gap: 16 },

  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.textMuted,
  },
});
