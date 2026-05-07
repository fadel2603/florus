import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import AISheet from '@/components/AISheet';

type Route = {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconFocused: React.ComponentProps<typeof Ionicons>['name'];
};

const NAV_ROUTES: Route[] = [
  { name: 'index',  label: 'Accueil', icon: 'home-outline', iconFocused: 'home' },
  { name: 'plants', label: 'Plantes', icon: 'leaf-outline',  iconFocused: 'leaf' },
];

const PILL_W     = 180;
const PILL_H     = 60;
const AI_SIZE    = 60;
const TAB_W      = PILL_W / NAV_ROUTES.length; // 90 px per slot
const IND_W      = TAB_W - 8;  // 82 px
const IND_H      = PILL_H - 8; // 52 px

export default function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets    = useSafeAreaInsets();
  const active    = state.routes[state.index]?.name ?? 'index';
  const [aiOpen, setAiOpen] = useState(false);

  // ── Mount: slide up + fade in ──────────────────────────────────────────
  const mountY   = useRef(new Animated.Value(28)).current;
  const mountOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mountY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
        mass: 0.9,
      }),
      Animated.timing(mountOp, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Indicator: slides between tabs ────────────────────────────────────
  const initIdx    = Math.max(0, NAV_ROUTES.findIndex(r => r.name === active));
  const indAnim    = useRef(new Animated.Value(initIdx)).current;

  useEffect(() => {
    const idx = NAV_ROUTES.findIndex(r => r.name === active);
    if (idx < 0) return;
    Animated.spring(indAnim, {
      toValue: idx,
      useNativeDriver: true,
      damping: 24,
      stiffness: 400,
      mass: 0.65,
    }).start();
  }, [active]);

  const indTranslateX = indAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [4, TAB_W + 4],
  });

  // ── AI button: bounce on press ────────────────────────────────────────
  const aiScale = useRef(new Animated.Value(1)).current;

  const pressAI = () => {
    Animated.sequence([
      Animated.spring(aiScale, {
        toValue: 0.86,
        useNativeDriver: true,
        damping: 14,
        stiffness: 500,
        mass: 0.5,
      }),
      Animated.spring(aiScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 280,
        mass: 0.7,
      }),
    ]).start();
    setAiOpen(true);
  };

  const go = (name: string) => navigation.navigate(name);

  return (
    <>
      <Animated.View
        style={[
          styles.root,
          { bottom: insets.bottom + 12 },
          { transform: [{ translateY: mountY }], opacity: mountOp },
        ]}
        pointerEvents="box-none"
      >
        {/* ── LEFT: Tab group pill ─────────────────────────────────────── */}
        {/* Outer: shadow only */}
        <View style={styles.pillShadow}>
          {/* Inner: overflow:hidden for BlurView */}
          <View style={styles.pillClip}>
            <BlurView
              intensity={90}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            {/* Frost tint */}
            <View style={[StyleSheet.absoluteFill, styles.pillFrost]} />

            {/* Sliding indicator */}
            <Animated.View
              style={[
                styles.indicator,
                { transform: [{ translateX: indTranslateX }] },
              ]}
              pointerEvents="none"
            />

            {/* Tab rows */}
            <View style={styles.pillRow}>
              {NAV_ROUTES.map(route => {
                const focused = active === route.name;
                return (
                  <TouchableOpacity
                    key={route.name}
                    onPress={() => go(route.name)}
                    activeOpacity={0.85}
                    style={styles.tabTouch}
                  >
                    <Ionicons
                      name={focused ? route.iconFocused : route.icon}
                      size={21}
                      color={focused ? '#ffffff' : '#7a7a7a'}
                    />
                    <Text
                      style={
                        focused ? styles.labelFocused : styles.labelDefault
                      }
                    >
                      {route.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── RIGHT: Isolated AI glass bubble ──────────────────────────── */}
        {/* Outer: shadow only */}
        <View style={styles.aiShadow}>
          {/* Inner: overflow:hidden for BlurView + bounce scale */}
          <Animated.View
            style={[styles.aiClip, { transform: [{ scale: aiScale }] }]}
          >
            <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(90,158,32,0.14)', 'rgba(181,241,91,0.28)']}
              start={{ x: 0.15, y: 1 }}
              end={{ x: 0.85, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
              onPress={pressAI}
              activeOpacity={1}
              style={styles.aiTouch}
            >
              <Sparkles
                size={23}
                color={Colors.textDark}
                strokeWidth={1.75}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      <AISheet visible={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },

  /* ── Tab pill ── */
  pillShadow: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: 100,
    // Shadow-only (no overflow) — iOS Liquid Glass rule
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 12,
  },
  pillClip: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  pillFrost: {
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255,255,255,0.20)'
        : 'rgba(255,255,255,0.94)',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: PILL_W,
    height: PILL_H,
    paddingHorizontal: 4,
  },
  tabTouch: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  labelFocused: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 10,
    color: '#ffffff',
  },
  labelDefault: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 10,
    color: '#9a9a9a',
  },

  /* ── Sliding indicator ── */
  indicator: {
    position: 'absolute',
    top: 4,
    left: 0,
    width: IND_W,
    height: IND_H,
    borderRadius: 100,
    backgroundColor: 'rgba(15,22,8,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 0,
  },

  /* ── AI glass bubble ── */
  aiShadow: {
    width: AI_SIZE,
    height: AI_SIZE,
    borderRadius: AI_SIZE / 2,
    shadowColor: '#3A7A00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  aiClip: {
    width: AI_SIZE,
    height: AI_SIZE,
    borderRadius: AI_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  aiTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
