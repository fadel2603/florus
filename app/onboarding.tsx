import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily } from '@/constants/fonts';
import { Colors } from '@/constants/colors';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'leaf' as const,
    iconColor: '#2E7D32',
    iconBg: '#C8E6C9',
    gradientColors: ['#F5F7F0', '#E8F5E9'] as [string, string],
    title: 'Bienvenue sur\nFlorus',
    subtitle: 'L\'application qui prend soin de tes plantes avec toi, au quotidien.',
  },
  {
    icon: 'notifications' as const,
    iconColor: '#E65100',
    iconBg: '#FFE0B2',
    gradientColors: ['#F5F7F0', '#FFF3E0'] as [string, string],
    title: 'Rappels\nintelligents',
    subtitle: 'L\'IA analyse ta plante en photo et programme automatiquement les bons rappels — arrosage, fertilisation, taille…',
  },
  {
    icon: 'sparkles' as const,
    iconColor: '#1565C0',
    iconBg: '#BBDEFB',
    gradientColors: ['#F5F7F0', '#E3F2FD'] as [string, string],
    title: 'Ton assistant\nbotanique',
    subtitle: 'Pose toutes tes questions, identifie une plante inconnue, reçois des conseils personnalisés.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem('@florus_onboarded', 'true');
    router.replace('/(tabs)/plants' as any);
    // Small delay so the tab is ready before pushing
    setTimeout(() => router.push('/add-plant/camera' as any), 300);
  };

  const skip = async () => {
    await AsyncStorage.setItem('@florus_onboarded', 'true');
    router.replace('/(tabs)' as any);
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setCurrentIndex(next);
    } else {
      finish();
    }
  };

  const onScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setCurrentIndex(idx);
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <LinearGradient
      colors={slide.gradientColors}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Skip */}
      <View style={styles.topBar}>
        <View />
        <TouchableOpacity onPress={skip} activeOpacity={0.7} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            {/* Illustration */}
            <View style={styles.illustrationWrap}>
              <View style={[styles.iconCircleLarge, { backgroundColor: s.iconBg }]}>
                <View style={[styles.iconCircleSmall, { backgroundColor: s.iconBg }]}>
                  <Ionicons name={s.icon} size={72} color={s.iconColor} />
                </View>
              </View>
            </View>

            {/* Text */}
            <View style={styles.textWrap}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.subtitle}>{s.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isLast ? 'Ajouter ma première plante' : 'Continuer'}
          </Text>
          <Ionicons
            name={isLast ? 'add-circle' : 'arrow-forward'}
            size={20}
            color={Colors.textDark}
          />
        </TouchableOpacity>

        {isLast && (
          <TouchableOpacity onPress={skip} activeOpacity={0.7} style={styles.laterBtn}>
            <Text style={styles.laterText}>Explorer d'abord l'app</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 15,
    color: Colors.textMuted,
  },

  scrollView: {
    flex: 1,
  },
  slide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 40,
  },

  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLarge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },
  iconCircleSmall: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.999, // reset parent opacity
    position: 'absolute',
  },

  textWrap: {
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontFamily: FontFamily.titleDisplay,
    fontSize: 38,
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  bottom: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primaryDark,
  },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    height: 56,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 17,
    color: Colors.textDark,
  },

  laterBtn: {
    paddingVertical: 4,
  },
  laterText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
