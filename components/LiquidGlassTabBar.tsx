import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
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

const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 28,
  elevation: 14,
} as const;

const PILL_W  = 180;
const PILL_H  = 60;
const AI_SIZE = 60;
const RADIUS  = 100;
const BORDER  = 'rgba(255,255,255,0.80)';

export default function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const active = state.routes[state.index]?.name;
  const go = (name: string) => navigation.navigate(name);
  const [aiOpen, setAiOpen] = useState(false);

  // Breathing glow (shadow scale via opacity of a glow ring)
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.85, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <>
      <View
        style={[styles.root, { bottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        {/* ── PILL GAUCHE ── */}
        <View style={[styles.pillShadow, SHADOW]}>
          <View style={styles.pillClip}>
            <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.glassFill]} />
            <View style={styles.pillInner}>
              {NAV_ROUTES.map(route => {
                const focused = active === route.name;
                return (
                  <TouchableOpacity
                    key={route.name}
                    onPress={() => go(route.name)}
                    activeOpacity={0.7}
                    style={styles.tabTouch}
                  >
                    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
                      <Ionicons
                        name={focused ? route.iconFocused : route.icon}
                        size={22}
                        color={focused ? '#000000' : '#999999'}
                      />
                      <Text style={focused ? styles.labelActive : styles.labelInactive}>
                        {route.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── BOUTON IA ── */}
        <View style={styles.aiWrapper}>
          {/* Breathing glow ring */}
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />

          <TouchableOpacity
            onPress={() => setAiOpen(true)}
            activeOpacity={0.85}
            style={styles.aiBtn}
          >
            <LinearGradient
              colors={['#C8F576', '#7DDE4A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Sparkles size={24} color={Colors.textDark} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

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

  /* Pill gauche */
  pillShadow: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: RADIUS,
  },
  pillClip: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  glassFill: {
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(255,255,255,0.28)'
      : 'rgba(255,255,255,0.96)',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: PILL_W,
    height: PILL_H,
    padding: 4,
  },
  tabTouch: { flex: 1, height: '100%' },
  tabItem: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    gap: 3,
  },
  tabItemActive: { backgroundColor: Colors.primary },
  labelActive: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 10,
    color: '#000000',
  },
  labelInactive: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 10,
    color: '#999999',
  },

  /* Bouton IA */
  aiWrapper: {
    width: AI_SIZE,
    height: AI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: AI_SIZE + 16,
    height: AI_SIZE + 16,
    borderRadius: (AI_SIZE + 16) / 2,
    backgroundColor: 'rgba(181,241,91,0.5)',
    // Soft glow via shadow
    shadowColor: '#B5F15B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 0,
  },
  aiBtn: {
    width: AI_SIZE,
    height: AI_SIZE,
    borderRadius: AI_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#7DDE4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
