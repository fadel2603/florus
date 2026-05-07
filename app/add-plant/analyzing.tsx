import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { ANTHROPIC_API_KEY, AI_MODEL, PLANT_ANALYSIS_SYSTEM_PROMPT, AIPlantAnalysis } from '@/constants/api';

const { width: W } = Dimensions.get('window');

const STEPS = [
  "Analyse de l'image en cours...",
  "Identification de l'espèce...",
  "Recherche des caractéristiques...",
  "Génération du profil de soin...",
];

const STEP_DURATION = [1400, 1400, 1400, 800];

async function analyzePhoto(photoUri: string): Promise<AIPlantAnalysis | null> {
  try {
    const blob = await fetch(photoUri).then(r => r.blob());
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1024,
        system: PLANT_ANALYSIS_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Analyze this plant.' },
          ],
        }],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(jsonStr) as AIPlantAnalysis;
  } catch (e) {
    console.warn('[Florus] Plant analysis failed:', e);
    return null;
  }
}

export default function AnalyzingScreen() {
  const { photo } = useLocalSearchParams<{ photo: string }>();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const textOpacity = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Coordination refs — animation and API race each other
  const apiDoneRef = useRef(false);
  const apiResultRef = useRef<AIPlantAnalysis | null>(null);
  const animDoneRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const navigate = (analysis: AIPlantAnalysis | null) => {
      if (!mounted) return;
      router.replace({
        pathname: '/add-plant/result',
        params: { photo, analysis: analysis ? JSON.stringify(analysis) : '' },
      } as any);
    };

    const tryNavigate = () => {
      if (apiDoneRef.current && animDoneRef.current) {
        navigate(apiResultRef.current);
      }
    };

    // Kick off API call immediately, in parallel with animation
    analyzePhoto(photo ?? '').then(result => {
      if (!mounted) return;
      apiResultRef.current = result;
      apiDoneRef.current = true;
      tryNavigate();
    });

    // Continuous spinner
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1800, useNativeDriver: true })
    ).start();

    // Step sequence — last step waits for API if needed
    let currentStep = 0;

    const advance = () => {
      if (!mounted) return;
      if (currentStep >= STEPS.length - 1) {
        animDoneRef.current = true;
        tryNavigate();
        return;
      }
      Animated.sequence([
        Animated.timing(textOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start(() => {
        if (!mounted) return;
        currentStep++;
        setStepIndex(currentStep);
        setTimeout(advance, STEP_DURATION[currentStep]);
      });
    };

    const timer = setTimeout(advance, STEP_DURATION[0]);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {photo && <Image source={{ uri: photo }} style={styles.bg} blurRadius={8} />}
      <View style={styles.bgDim} />

      <View style={styles.center}>
        <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
        <View style={styles.spinnerDot} />
        <Animated.Text style={[styles.stepText, { opacity: textOpacity }]}>
          {STEPS[stepIndex]}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bgDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  spinnerRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderRightColor: 'rgba(181,241,91,0.3)',
  },
  spinnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginBottom: -30,
  },
  stepText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 52,
    letterSpacing: 0.3,
  },
});
