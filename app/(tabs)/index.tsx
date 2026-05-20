import React, { useRef, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Task, Plant, TASK_TYPE_META } from '@/constants/data';
import { fetchTasksByDay, toggleTask, fetchTaskDays } from '@/lib/db/tasks';
import { fetchPlants } from '@/lib/db/plants';
import { insertHistoryEvent } from '@/lib/db/history';
import { useUser } from '@/context/UserContext';
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
  { type: 'water',        label: 'Arroser',    iconName: 'water',          iconColor: '#2196F3', iconBg: Colors.waterIconBg },
  { type: 'observe',      label: 'Observer',   iconName: 'eye',            iconColor: '#2E7D32', iconBg: '#C8E6C9' },
  { type: 'fertilize',    label: 'Fertiliser', iconName: 'flask',          iconColor: '#FF9500', iconBg: '#FFF3E0' },
  { type: 'repot',        label: 'Rempoter',   iconName: 'leaf',           iconColor: '#795548', iconBg: '#EFEBE9' },
  { type: 'treat',        label: 'Traiter',    iconName: 'medkit',         iconColor: '#C62828', iconBg: '#FFEBEE' },
  { type: 'rotate',       label: 'Tourner',    iconName: 'refresh-circle', iconColor: '#F9A825', iconBg: '#FFF8E1' },
  { type: 'clean_leaves', label: 'Nettoyer',   iconName: 'sparkles',       iconColor: '#66BB6A', iconBg: '#E8F5E9' },
  { type: 'mist',         label: 'Brumiser',   iconName: 'water-outline',  iconColor: '#4FC3F7', iconBg: '#E1F5FE' },
  { type: 'trim',         label: 'Tailler',    iconName: 'cut',            iconColor: '#9C27B0', iconBg: '#F3E5F5' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useUser();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [taskDays, setTaskDays] = useState<Set<number>>(new Set());
  const [headerHeight, setHeaderHeight] = useState(insets.top + 100);

  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const previewPlant = previewTask ? plants.find(p => p.id === previewTask.plantId) ?? null : null;

  useEffect(() => {
    AsyncStorage.getItem('@florus_onboarded').then(val => {
      if (val !== 'true') router.replace('/onboarding' as any);
    });
  }, []);

  const loadData = useCallback(async (date: Date) => {
    if (!userId) return;
    const dateStr = date.toISOString().slice(0, 10);
    const [fetchedTasks, fetchedPlants, fetchedTaskDays] = await Promise.all([
      fetchTasksByDay(userId, date.getDay(), dateStr),
      fetchPlants(userId),
      fetchTaskDays(userId),
    ]);
    setTasks(fetchedTasks);
    setPlants(fetchedPlants);
    setTaskDays(fetchedTaskDays);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData(selectedDate);
    }, [loadData, selectedDate])
  );

  const scrollY  = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;

  const toggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !userId) return;
    const nowDone = !task.done;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: nowDone } : t));

    await toggleTask(id, userId, nowDone);

    if (nowDone) {
      const meta = TASK_TYPE_META[task.type] ?? { label: task.type, icon: 'checkmark-circle', color: Colors.primary };
      await insertHistoryEvent(userId, task.plantId, {
        type: 'task_done',
        label: meta.label,
        date: new Date().toISOString(),
        icon: meta.icon,
        color: meta.color,
      });
    }
  };

  const doneCnt = tasks.filter(t => t.done).length;

  const handleDateChange = (newDate: Date, skipAnim?: boolean) => {
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
      if (userId) fetchTasksByDay(userId, newDate.getDay(), newDate.toISOString().slice(0, 10)).then(setTasks);
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
          <CalendarStrip onDateChange={handleDateChange} value={selectedDate} taskDays={taskDays} />
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
                    plants={plants}
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

      <LinearGradient
        colors={['rgba(245,247,240,0.3)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />
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
  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 35,
    zIndex: 10,
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
