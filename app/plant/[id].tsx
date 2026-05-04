import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
  TextInput,
  Animated,
  PanResponder,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import {
  PLANTS,
  HISTORY_EVENTS,
  Plant,
  Task,
  updatePlant,
  removePlant,
  logHistoryEvent,
  addTasksForDay,
} from '@/constants/data';
import { ANTHROPIC_API_KEY, AI_MODEL } from '@/constants/api';
import Button from '@/components/ui/Button';
import TimelineItem from '@/components/ui/TimelineItem';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanDiagnosis = {
  diagnosis: 'healthy' | 'warning' | 'critical';
  summary: string;
  issues: string[];
  recommendations: string[];
  urgentTask: { type: string; title: string; daysFromNow: number } | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1545241047-6083a3684587?w=200',
  'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=200',
  'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=200',
];

const SCAN_STEPS = [
  'Analyse en cours...',
  'Examen de la feuille...',
  'Détection des anomalies...',
  'Génération du diagnostic...',
];
const SCAN_STEP_DURATION = [1200, 1400, 1400, 800];

const DIAG_CONFIG = {
  healthy: { label: 'En bonne santé',    color: '#2E7D32', bg: '#E8F5E9',        icon: 'checkmark-circle' as const },
  warning: { label: 'Attention requise', color: Colors.orange, bg: Colors.orangeBg, icon: 'warning' as const },
  critical: { label: 'Soins urgents',    color: '#C62828', bg: '#FFEBEE',        icon: 'alert-circle' as const },
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = 360;
const EDIT_SHEET_H = 380;
const SCAN_SHEET_INIT_Y = SCREEN_H * 0.95;
const DISMISS_THRESHOLD = 80;

const CAM_FRAME_SIZE = SCREEN_W * 0.75;
const CAM_CORNER = 28;
const CAM_CORNER_W = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHistoryDate(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) { const w = Math.floor(diffDays / 7); return `Il y a ${w} semaine${w > 1 ? 's' : ''}`; }
  if (diffDays < 365) { const m = Math.floor(diffDays / 30); return `Il y a ${m} mois`; }
  const y = Math.floor(diffDays / 365);
  return `Il y a ${y} an${y > 1 ? 's' : ''}`;
}

async function photoToBase64(uri: string): Promise<string> {
  const blob = await fetch(uri).then(r => r.blob());
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const comma = res.indexOf(',');
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function runScanAnalysis(
  photoUri: string,
  plantName: string,
  species: string,
): Promise<ScanDiagnosis | null> {
  try {
    const base64 = await photoToBase64(photoUri);
    const systemPrompt =
      `You are Planta, an expert botanist. Analyze this plant photo in the context of: ${plantName} (${species}). ` +
      `Look for diseases, pests, watering issues, light problems, nutrient deficiencies. ` +
      `Respond ONLY with valid JSON, no markdown, no code fences:\n` +
      `{"diagnosis":"healthy|warning|critical","summary":"one sentence in French","issues":["issue in French"],"recommendations":["action in French"],"urgentTask":{"type":"water|observe|treat|fertilize","title":"title in French","daysFromNow":2}}\n` +
      `Set urgentTask to null if diagnosis is healthy.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL, max_tokens: 512, system: systemPrompt,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: `Analyze this photo of my ${plantName}.` },
        ]}],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(match ? match[1].trim() : text.trim()) as ScanDiagnosis;
  } catch (e) {
    console.warn('[Planta] Scan failed:', e);
    return null;
  }
}

async function askPlantQuestion(
  photoUri: string,
  plantName: string,
  species: string,
  diagnosis: ScanDiagnosis | null,
  question: string,
): Promise<string> {
  const base64 = await photoToBase64(photoUri);
  const ctx = diagnosis
    ? `Diagnostic: ${diagnosis.summary}. Problèmes: ${diagnosis.issues.join(', ') || 'aucun'}.`
    : '';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL, max_tokens: 400,
      system: `Tu es Planta, expert botaniste. Cette photo montre un(e) ${plantName} (${species}). ${ctx} Réponds à la question de façon concise en français.`,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
        { type: 'text', text: question },
      ]}],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text ?? '';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [plant, setPlant] = useState<Plant>(() => PLANTS.find(p => p.id === id) ?? PLANTS[0]);
  const [history, setHistory] = useState(() => HISTORY_EVENTS[plant.id] ?? []);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  // ── Edit sheet ──
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState<'Intérieur' | 'Extérieur'>('Intérieur');
  const editTranslateY = useRef(new Animated.Value(EDIT_SHEET_H)).current;
  const editBackdropOpacity = useRef(new Animated.Value(0)).current;

  const editPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dy > 0) editTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.5) dismissEdit();
        else Animated.spring(editTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }).start();
      },
    })
  ).current;

  // ── Camera ──
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const camPulse = useRef(new Animated.Value(1)).current;

  // ── Scanner ──
  const [scanPhotoUri, setScanPhotoUri] = useState<string | null>(null);
  const [scanAnalyzing, setScanAnalyzing] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanDiagnosis, setScanDiagnosis] = useState<ScanDiagnosis | null>(null);
  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [applyDone, setApplyDone] = useState(false);

  // ── Question ──
  const [questionText, setQuestionText] = useState('');
  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const scanScrollRef = useRef<ScrollView>(null);

  const scanTextOpacity = useRef(new Animated.Value(1)).current;
  const scanSpinAnim = useRef(new Animated.Value(0)).current;
  const scanPulseAnim = useRef(new Animated.Value(0)).current;
  const scanResultTranslateY = useRef(new Animated.Value(SCAN_SHEET_INIT_Y)).current;
  const scanResultBackdropOpacity = useRef(new Animated.Value(0)).current;

  const scanApiDoneRef = useRef(false);
  const scanAnimDoneRef = useRef(false);
  const scanDiagRef = useRef<ScanDiagnosis | null>(null);

  const scanResultPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dy > 0) scanResultTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.5) dismissScanResult();
        else Animated.spring(scanResultTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }).start();
      },
    })
  ).current;

  // ── useFocusEffect ──
  useFocusEffect(
    useCallback(() => {
      const fresh = PLANTS.find(p => p.id === id);
      if (fresh) setPlant({ ...fresh });
      setHistory([...(HISTORY_EVENTS[id ?? ''] ?? [])]);
    }, [id])
  );

  // ── Camera pulse ──
  useEffect(() => {
    if (!cameraVisible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(camPulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(camPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [cameraVisible]);

  // ── Edit sheet init ──
  useEffect(() => {
    if (!editVisible) return;
    setEditName(plant.name);
    setEditLocation(plant.location === 'outdoor' ? 'Extérieur' : 'Intérieur');
    editTranslateY.setValue(EDIT_SHEET_H);
    Animated.parallel([
      Animated.spring(editTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
      Animated.timing(editBackdropOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [editVisible]);

  // ── Scan analyzing: animation + API in parallel ──
  useEffect(() => {
    if (!scanAnalyzing || !scanPhotoUri) return;
    let mounted = true;

    scanTextOpacity.setValue(1);
    scanSpinAnim.setValue(0);
    scanPulseAnim.setValue(0);
    scanApiDoneRef.current = false;
    scanAnimDoneRef.current = false;
    scanDiagRef.current = null;

    const finish = () => {
      if (!scanApiDoneRef.current || !scanAnimDoneRef.current || !mounted) return;
      setScanDiagnosis(scanDiagRef.current);
      setScanAnalyzing(false);
      setScanResultVisible(true);
    };

    runScanAnalysis(scanPhotoUri, plant.name, plant.species).then(result => {
      if (!mounted) return;
      scanDiagRef.current = result;
      scanApiDoneRef.current = true;
      finish();
    });

    Animated.loop(
      Animated.timing(scanSpinAnim, { toValue: 1, duration: 1600, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(scanPulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    let currentStep = 0;
    const advance = () => {
      if (!mounted) return;
      if (currentStep >= SCAN_STEPS.length - 1) {
        scanAnimDoneRef.current = true;
        finish();
        return;
      }
      Animated.sequence([
        Animated.timing(scanTextOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(scanTextOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        if (!mounted) return;
        currentStep++;
        setScanStepIndex(currentStep);
        setTimeout(advance, SCAN_STEP_DURATION[currentStep]);
      });
    };
    const timer = setTimeout(advance, SCAN_STEP_DURATION[0]);

    return () => { mounted = false; clearTimeout(timer); };
  }, [scanAnalyzing, scanPhotoUri]);

  // ── Result sheet: animate in ──
  useEffect(() => {
    if (!scanResultVisible) return;
    scanResultTranslateY.setValue(SCAN_SHEET_INIT_Y);
    Animated.parallel([
      Animated.spring(scanResultTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
      Animated.timing(scanResultBackdropOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [scanResultVisible]);

  // ── Auto-log scan to history when diagnosis arrives ──
  useEffect(() => {
    if (!scanDiagnosis) return;
    const cfg = DIAG_CONFIG[scanDiagnosis.diagnosis] ?? DIAG_CONFIG.warning;
    const n = scanDiagnosis.issues.length;
    const label = n > 0
      ? `Analyse IA · ${cfg.label} · ${n} problème${n > 1 ? 's' : ''} détecté${n > 1 ? 's' : ''}`
      : `Analyse IA · ${cfg.label}`;
    logHistoryEvent(plant.id, {
      id: `scan_auto_${plant.id}_${Date.now()}`,
      type: 'analysis',
      label,
      date: new Date().toISOString(),
      icon: 'scan-outline',
      color: cfg.color,
    });
    setHistory([...(HISTORY_EVENTS[plant.id] ?? [])]);
  }, [scanDiagnosis]);

  // ── Scroll to end when keyboard shows inside result sheet ──
  useEffect(() => {
    if (!scanResultVisible) return;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scanScrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return () => sub.remove();
  }, [scanResultVisible]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const dismissEdit = () => {
    Animated.parallel([
      Animated.timing(editTranslateY, { toValue: EDIT_SHEET_H, duration: 260, useNativeDriver: true }),
      Animated.timing(editBackdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setEditVisible(false));
  };

  const handleSave = () => {
    updatePlant(plant.id, {
      name: editName,
      location: editLocation === 'Extérieur' ? 'outdoor' : 'indoor',
    });
    setPlant(prev => ({ ...prev, name: editName, location: editLocation === 'Extérieur' ? 'outdoor' : 'indoor' }));
    dismissEdit();
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la plante',
      `Supprimer "${plant.name}" et toutes ses tâches ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => { removePlant(plant.id); router.replace('/(tabs)/plants' as any); } },
      ]
    );
  };

  const handleScan = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setCameraVisible(true);
  };

  const handleCameraShutter = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setCameraVisible(false);
        setScanStepIndex(0);
        setApplyDone(false);
        setConfirmStep(false);
        setQuestionText('');
        setQuestionAnswer(null);
        setScanDiagnosis(null);
        setScanPhotoUri(photo.uri);
        setScanAnalyzing(true);
      }
    } catch (e) {
      console.warn('Camera error', e);
    }
  };

  const dismissScanResult = () => {
    Animated.parallel([
      Animated.timing(scanResultTranslateY, { toValue: SCAN_SHEET_INIT_Y, duration: 280, useNativeDriver: true }),
      Animated.timing(scanResultBackdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setScanResultVisible(false);
      setScanDiagnosis(null);
      setScanPhotoUri(null);
      setApplyDone(false);
      setConfirmStep(false);
      setQuestionText('');
      setQuestionAnswer(null);
      setQuestionLoading(false);
    });
  };

  const handleApplyRecommendations = () => {
    if (!scanDiagnosis || applyDone) return;
    if (scanDiagnosis.urgentTask) {
      const targetDow = (new Date().getDay() + (scanDiagnosis.urgentTask.daysFromNow ?? 0)) % 7;
      addTasksForDay(targetDow, [{
        id: `scan_${plant.id}_${Date.now()}`,
        plantId: plant.id,
        plantName: plant.name,
        type: (scanDiagnosis.urgentTask.type as Task['type']) ?? 'observe',
        done: false,
      }]);
    }
    setApplyDone(true);
    setConfirmStep(false);
    dismissScanResult();
  };

  const handleSendQuestion = async () => {
    if (!questionText.trim() || !scanPhotoUri || questionLoading) return;
    setQuestionLoading(true);
    setQuestionAnswer(null);
    try {
      const answer = await askPlantQuestion(scanPhotoUri, plant.name, plant.species, scanDiagnosis, questionText.trim());
      setQuestionAnswer(answer);
    } catch {
      setQuestionAnswer("Désolé, je n'ai pas pu répondre. Vérifiez votre connexion.");
    } finally {
      setQuestionLoading(false);
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const scanSpin = scanSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const diagCfg = scanDiagnosis ? (DIAG_CONFIG[scanDiagnosis.diagnosis] ?? DIAG_CONFIG.warning) : null;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── STICKY NAV BUTTONS (outside ScrollView — always visible) ── */}
      <View style={[styles.stickyNav, { top: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.heroBtnShadow}>
          <View style={styles.heroBtnGlass}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.heroBtnTint]} />
            <TouchableOpacity style={styles.heroBtnTouch} onPress={() => router.back()} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={22} color={Colors.textDark} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.heroBtnShadow}>
          <View style={styles.heroBtnGlass}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.heroBtnTint]} />
            <TouchableOpacity style={styles.heroBtnTouch} onPress={() => setEditVisible(true)} activeOpacity={0.85}>
              <Ionicons name="pencil" size={17} color={Colors.textDark} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* ── HERO ── */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: plant.image }} style={styles.hero} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.38)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.5 }} end={{ x: 0, y: 1 }} />
          <LinearGradient colors={['rgba(0,0,0,0.38)', 'transparent']} style={styles.heroGradientTop} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

          {plant.careStatus && (
            <View style={[styles.badge, { top: insets.top + 10 }]}>
              <Text style={styles.badgeText}>{plant.careStatus}</Text>
            </View>
          )}
        </View>

        {/* ── BODY ── */}
        <View style={styles.body}>
          <View style={styles.infoRow}>
            <View style={styles.infoMain}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.species}>{plant.species}</Text>
              <Text style={styles.meta}>
                {plant.location === 'outdoor' ? 'Extérieur' : 'Intérieur'} ·{' '}
                <Text style={styles.metaPhotos} onPress={() => setGalleryOpen(true)}>3 📸</Text>
              </Text>
            </View>
            <Button label="Scanner" onPress={handleScan} variant="primary" size="sm" icon="scan" />
          </View>

          {/* Glass stat cards */}
          <View style={styles.statsRow}>
            <View style={styles.glassOuter}>
              <View style={styles.glassInner}>
                {Platform.OS === 'ios' && <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />}
                <View style={[StyleSheet.absoluteFill, styles.glassFill]} />
                <Ionicons name="water" size={22} color="#4FC3F7" />
                <Text style={styles.statValue}>{plant.waterFrequency}</Text>
                <Text style={styles.statLabel}>Arrosage</Text>
              </View>
            </View>
            <View style={styles.glassOuter}>
              <View style={styles.glassInner}>
                {Platform.OS === 'ios' && <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />}
                <View style={[StyleSheet.absoluteFill, styles.glassFill]} />
                <Ionicons name="time" size={22} color={Colors.orange} />
                <Text style={styles.statValue}>{plant.lastWatered}</Text>
                <Text style={styles.statLabel}>Dernier soin</Text>
              </View>
            </View>
          </View>

          {/* Glass timeline */}
          <Text style={styles.timelineTitle}>Historique des soins</Text>
          <View style={styles.timelineGlassOuter}>
            <View style={styles.timelineGlassInner}>
              {Platform.OS === 'ios' && <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />}
              <View style={[StyleSheet.absoluteFill, styles.glassFill]} />
              {history.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="leaf-outline" size={28} color={Colors.textMuted} />
                  <Text style={styles.emptyHistoryText}>Aucun historique pour le moment</Text>
                </View>
              ) : (
                history.map((event, i) => (
                  <TimelineItem
                    key={event.id}
                    icon={event.icon as any}
                    iconColor={event.color}
                    action={event.label}
                    date={formatHistoryDate(event.date)}
                    isLast={i === history.length - 1}
                  />
                ))
              )}
            </View>
          </View>
        </View>
        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── GALLERY MODAL ── */}
      <Modal visible={galleryOpen} transparent animationType="slide" onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.galleryModal}>
          <View style={styles.galleryModalHeader}>
            <Text style={styles.galleryModalTitle}>Mes photos</Text>
            <TouchableOpacity onPress={() => setGalleryOpen(false)} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={Colors.textDark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.galleryGrid}>
            {MOCK_PHOTOS.map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => setFullscreenPhoto(uri)} activeOpacity={0.85}>
                <Image source={{ uri }} style={styles.galleryGridThumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── FULLSCREEN PHOTO ── */}
      <Modal visible={!!fullscreenPhoto} transparent animationType="fade" onRequestClose={() => setFullscreenPhoto(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFullscreenPhoto(null)}>
          {fullscreenPhoto && <Image source={{ uri: fullscreenPhoto }} style={styles.fullscreenImg} resizeMode="contain" />}
          <TouchableOpacity
            style={{ position: 'absolute', top: insets.top + 8, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setFullscreenPhoto(null)}
          >
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── IN-APP CAMERA ── */}
      <Modal visible={cameraVisible} animationType="slide" statusBarTranslucent onRequestClose={() => setCameraVisible(false)}>
        <View style={styles.camRoot}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

          {cameraPermission?.granted ? (
            <>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

              {/* Dim overlay outside frame */}
              <View style={styles.camOverlay} pointerEvents="none">
                <View style={[styles.camOverlayRow, { height: (SCREEN_H - CAM_FRAME_SIZE) / 2 }]}>
                  <View style={styles.camOverlayFull} />
                </View>
                <View style={[styles.camOverlayRow, { height: CAM_FRAME_SIZE }]}>
                  <View style={[styles.camOverlaySide, { width: (SCREEN_W - CAM_FRAME_SIZE) / 2 }]} />
                  <View style={styles.camFrameHole} />
                  <View style={[styles.camOverlaySide, { width: (SCREEN_W - CAM_FRAME_SIZE) / 2 }]} />
                </View>
                <View style={[styles.camOverlayRow, { height: (SCREEN_H - CAM_FRAME_SIZE) / 2 }]}>
                  <View style={styles.camOverlayFull} />
                </View>
              </View>

              {/* Animated corner frame */}
              <Animated.View style={[styles.camFrame, { transform: [{ scale: camPulse }] }]} pointerEvents="none">
                <View style={[styles.camCorner, styles.camCornerTL]} />
                <View style={[styles.camCorner, styles.camCornerTR]} />
                <View style={[styles.camCorner, styles.camCornerBL]} />
                <View style={[styles.camCorner, styles.camCornerBR]} />
              </Animated.View>

              {/* Hint */}
              <View style={styles.camHint} pointerEvents="none">
                <Text style={styles.camHintText}>Centrez votre plante dans le cadre</Text>
              </View>

              {/* Shutter */}
              <View style={[styles.shutterWrap, { bottom: insets.bottom + 32 }]}>
                <TouchableOpacity style={styles.shutter} onPress={handleCameraShutter} activeOpacity={0.8}>
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.camPermCenter}>
              <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.6)" />
              <Text style={styles.camPermText}>Accès à la caméra requis</Text>
              <TouchableOpacity style={styles.camPermBtn} onPress={requestCameraPermission}>
                <Text style={styles.camPermBtnText}>Autoriser</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[styles.camCloseBtn, { top: insets.top + 12 }]} onPress={() => setCameraVisible(false)}>
            <Ionicons name="close" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── SCAN: ANALYZING OVERLAY ── */}
      <Modal visible={scanAnalyzing} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.scanOverlay}>
          {scanPhotoUri && <Image source={{ uri: scanPhotoUri }} style={styles.scanBg} blurRadius={10} />}
          <View style={styles.scanDim} />
          <View style={styles.scanCenter}>
            <Animated.View style={[styles.scanPulseRing, {
              opacity: scanPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
              transform: [{ scale: scanPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
            }]} />
            <Animated.View style={[styles.scanSpinnerRing, { transform: [{ rotate: scanSpin }] }]} />
            <View style={styles.scanIconCenter}>
              <Ionicons name="sparkles" size={22} color={Colors.primary} />
            </View>
            <Animated.Text style={[styles.scanStepText, { opacity: scanTextOpacity }]}>
              {SCAN_STEPS[scanStepIndex]}
            </Animated.Text>
            <Text style={styles.scanSubLabel}>{plant.name} · {plant.species}</Text>
          </View>
        </View>
      </Modal>

      {/* ── SCAN: RESULT SHEET ── */}
      {scanResultVisible && (
        <Modal visible transparent animationType="none" onRequestClose={dismissScanResult} statusBarTranslucent>
          <Animated.View style={[styles.backdrop, { opacity: scanResultBackdropOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismissScanResult} activeOpacity={1} />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.scanSheetKAV}
            pointerEvents="box-none"
          >
          <Animated.View
            style={[styles.scanSheet, { transform: [{ translateY: scanResultTranslateY }], paddingBottom: Math.max(insets.bottom, 16) }]}
            {...scanResultPanResponder.panHandlers}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.scanSheetHeader}>
              <TouchableOpacity onPress={dismissScanResult} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={17} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.scanSheetTitle}>Diagnostic Planta</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView
              ref={scanScrollRef}
              style={styles.scanSheetScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scanSheetContent}
              keyboardShouldPersistTaps="handled"
            >
              {scanDiagnosis == null ? (
                <View style={styles.scanErrorState}>
                  <Ionicons name="alert-circle-outline" size={36} color={Colors.orange} />
                  <Text style={styles.scanErrorText}>Analyse indisponible. Vérifiez votre connexion et réessayez.</Text>
                </View>
              ) : (
                <>
                  {/* Scanned photo + health badge overlay */}
                  <View style={styles.diagPhotoContainer}>
                    {scanPhotoUri && (
                      <Image source={{ uri: scanPhotoUri }} style={styles.diagPhoto} resizeMode="cover" />
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.40)']}
                      style={styles.diagPhotoGradient}
                      pointerEvents="none"
                    />
                    <View style={[styles.diagBadgeOverlay, { backgroundColor: diagCfg!.bg }]}>
                      <Ionicons name={diagCfg!.icon} size={13} color={diagCfg!.color} />
                      <Text style={[styles.diagBadgeLabel, { color: diagCfg!.color }]}>{diagCfg!.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.diagSummary}>{scanDiagnosis.summary}</Text>

                  {scanDiagnosis.issues.length > 0 && (
                    <View style={[styles.diagSection, { backgroundColor: Colors.orangeBg }]}>
                      <Text style={[styles.diagSectionTitle, { color: '#7a3500' }]}>Problèmes détectés</Text>
                      {scanDiagnosis.issues.map((issue, i) => (
                        <View key={i} style={styles.diagRow}>
                          <Ionicons name="warning-outline" size={14} color="#a04400" />
                          <Text style={styles.diagIssueText}>{issue}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {scanDiagnosis.recommendations.length > 0 && (
                    <View style={[styles.diagSection, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={[styles.diagSectionTitle, { color: '#1a4d1a' }]}>Recommandations</Text>
                      {scanDiagnosis.recommendations.map((rec, i) => (
                        <View key={i} style={styles.diagRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#1a4d1a" />
                          <Text style={styles.diagRecText}>{rec}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {scanDiagnosis.urgentTask && (
                    <View style={styles.urgentNotice}>
                      <Ionicons name="flash" size={14} color={Colors.orange} />
                      <Text style={styles.urgentNoticeText}>
                        Tâche suggérée : "{scanDiagnosis.urgentTask.title}"
                        {scanDiagnosis.urgentTask.daysFromNow === 0 ? " pour aujourd'hui" :
                         scanDiagnosis.urgentTask.daysFromNow === 1 ? " pour demain" :
                         ` dans ${scanDiagnosis.urgentTask.daysFromNow} jours`}
                      </Text>
                    </View>
                  )}

                  {/* ── Question section ── */}
                  <View style={styles.questionSection}>
                    <Text style={styles.questionTitle}>Poser une question sur cette photo</Text>
                    <View style={styles.questionInputRow}>
                      <TextInput
                        style={styles.questionInput}
                        value={questionText}
                        onChangeText={setQuestionText}
                        placeholder="Ex: Pourquoi les feuilles jaunissent ?"
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        textAlignVertical="top"
                        editable={!questionLoading}
                      />
                      <TouchableOpacity
                        style={[styles.questionSendBtn, (!questionText.trim() || questionLoading) && styles.questionSendBtnDisabled]}
                        onPress={handleSendQuestion}
                        activeOpacity={0.8}
                        disabled={!questionText.trim() || questionLoading}
                      >
                        {questionLoading
                          ? <ActivityIndicator size="small" color={Colors.textDark} />
                          : <Ionicons name="arrow-up" size={16} color={Colors.textDark} />
                        }
                      </TouchableOpacity>
                    </View>
                    {questionAnswer && (
                      <View style={styles.questionAnswerBubble}>
                        <Ionicons name="sparkles" size={12} color={Colors.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.questionAnswerText}>{questionAnswer}</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Action area */}
            {scanDiagnosis ? (
              confirmStep ? (
                <View style={styles.confirmCard}>
                  <View style={styles.confirmHeader}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.orange} />
                    <Text style={styles.confirmText}>Ajouter les tâches à votre planning ?</Text>
                  </View>
                  <View style={styles.confirmBtns}>
                    <TouchableOpacity style={styles.confirmApplyBtn} onPress={handleApplyRecommendations} activeOpacity={0.85}>
                      <Ionicons name="checkmark" size={15} color={Colors.textDark} />
                      <Text style={styles.confirmApplyText}>Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmStep(false)} activeOpacity={0.7}>
                      <Text style={styles.confirmCancelText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => setConfirmStep(true)} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.textDark} />
                    <Text style={styles.applyBtnText}>Appliquer les recommandations</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.textBtn} onPress={dismissScanResult} activeOpacity={0.7}>
                    <Text style={styles.textBtnLabel}>Ignorer</Text>
                  </TouchableOpacity>
                </>
              )
            ) : (
              <TouchableOpacity style={styles.textBtn} onPress={dismissScanResult} activeOpacity={0.7}>
                <Text style={styles.textBtnLabel}>Fermer</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ── EDIT BOTTOM SHEET ── */}
      {editVisible && (
        <Modal visible transparent animationType="none" onRequestClose={dismissEdit}>
          <Animated.View style={[styles.backdrop, { opacity: editBackdropOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismissEdit} activeOpacity={1} />
          </Animated.View>
          <Animated.View style={[styles.editSheet, { transform: [{ translateY: editTranslateY }], paddingBottom: Math.max(insets.bottom, 16) }]} {...editPanResponder.panHandlers}>
            <View style={styles.sheetHandle} />
            <View style={styles.editHeader}>
              <TouchableOpacity onPress={dismissEdit} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={17} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.editTitle}>Modifier la plante</Text>
              <View style={{ width: 36 }} />
            </View>
            <Text style={styles.editLabel}>Nom</Text>
            <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} placeholder="Nom de la plante" placeholderTextColor="#AEAEB2" autoCorrect={false} />
            <Text style={styles.editLabel}>Emplacement</Text>
            <View style={styles.toggleRow}>
              {(['Intérieur', 'Extérieur'] as const).map(loc => (
                <TouchableOpacity key={loc} style={[styles.toggleBtn, editLocation === loc && styles.toggleBtnActive]} onPress={() => setEditLocation(loc)} activeOpacity={0.75}>
                  <Ionicons name={loc === 'Intérieur' ? 'home-outline' : 'sunny-outline'} size={15} color={editLocation === loc ? '#FFFFFF' : '#6b6b6b'} />
                  <Text style={[styles.toggleText, editLocation === loc && styles.toggleTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.75}>
              <Ionicons name="trash-outline" size={16} color="#C62828" />
              <Text style={styles.deleteBtnText}>Supprimer la plante</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },

  heroWrapper: { height: HERO_H, position: 'relative' },
  hero: { width: '100%', height: HERO_H, backgroundColor: Colors.border },
  heroGradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  stickyNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  heroBtnShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBtnGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  heroBtnTint: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 22,
  },
  heroBtnTouch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { position: 'absolute', right: 16, backgroundColor: Colors.orange, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: FontFamily.labelMedium, color: Colors.white },

  body: { padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  infoMain: { flex: 1 },
  plantName: { fontFamily: FontFamily.titleDisplay, fontSize: 28, color: Colors.textDark },
  species: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  meta: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.textMuted, marginTop: 5 },
  metaPhotos: { color: Colors.textDark, fontFamily: FontFamily.calendarBold },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  glassOuter: { flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 3 },
  glassInner: {
    flex: 1, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)',
    padding: 16, alignItems: 'center', gap: 5,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.92)' : 'transparent',
    minHeight: 100,
  },
  glassFill: { backgroundColor: 'rgba(255,255,255,0.60)', borderRadius: 20 },
  statValue: { fontFamily: FontFamily.calendarBold, fontSize: 13, color: Colors.textDark, textAlign: 'center' },
  statLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  timelineTitle: { fontFamily: FontFamily.headerBold, fontSize: 18, color: Colors.textDark, marginBottom: 14 },
  timelineGlassOuter: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 3 },
  timelineGlassInner: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)',
    padding: 16,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.92)' : 'transparent',
  },
  emptyHistory: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyHistoryText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  galleryModal: { flex: 1, backgroundColor: Colors.background, marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  galleryModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  galleryModalTitle: { fontFamily: FontFamily.headerBold, fontSize: 20, color: Colors.textDark },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 16 },
  galleryGridThumb: { width: (SCREEN_W - 48) / 3, height: (SCREEN_W - 48) / 3, borderRadius: 12, backgroundColor: Colors.border },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  fullscreenImg: { width: SCREEN_W, height: SCREEN_H },

  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  // ── In-app camera ──
  camRoot: { flex: 1, backgroundColor: '#000' },
  camOverlay: { ...StyleSheet.absoluteFillObject },
  camOverlayRow: { flexDirection: 'row' },
  camOverlayFull: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  camOverlaySide: { backgroundColor: 'rgba(0,0,0,0.55)' },
  camFrameHole: { width: CAM_FRAME_SIZE, height: CAM_FRAME_SIZE },
  camFrame: {
    position: 'absolute',
    top: (SCREEN_H - CAM_FRAME_SIZE) / 2,
    left: (SCREEN_W - CAM_FRAME_SIZE) / 2,
    width: CAM_FRAME_SIZE,
    height: CAM_FRAME_SIZE,
  },
  camCorner: { position: 'absolute', width: CAM_CORNER, height: CAM_CORNER, borderColor: Colors.primary },
  camCornerTL: { top: 0, left: 0, borderTopWidth: CAM_CORNER_W, borderLeftWidth: CAM_CORNER_W, borderTopLeftRadius: 8 },
  camCornerTR: { top: 0, right: 0, borderTopWidth: CAM_CORNER_W, borderRightWidth: CAM_CORNER_W, borderTopRightRadius: 8 },
  camCornerBL: { bottom: 0, left: 0, borderBottomWidth: CAM_CORNER_W, borderLeftWidth: CAM_CORNER_W, borderBottomLeftRadius: 8 },
  camCornerBR: { bottom: 0, right: 0, borderBottomWidth: CAM_CORNER_W, borderRightWidth: CAM_CORNER_W, borderBottomRightRadius: 8 },
  camHint: {
    position: 'absolute',
    top: (SCREEN_H - CAM_FRAME_SIZE) / 2 - 44,
    left: 0, right: 0,
    alignItems: 'center',
  },
  camHintText: { color: 'rgba(255,255,255,0.8)', fontFamily: FontFamily.calendarMedium, fontSize: 14 },
  camCloseBtn: {
    position: 'absolute', left: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  camPermCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  camPermText: { color: 'white', fontFamily: FontFamily.calendarMedium, fontSize: 16 },
  camPermBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  camPermBtnText: { fontFamily: FontFamily.calendarBold, fontSize: 14, color: Colors.textDark },
  shutterWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.white },

  // ── Scan: analyzing overlay ──
  scanOverlay: { flex: 1, backgroundColor: '#000' },
  scanBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  scanDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  scanCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  scanPulseRing: { position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: Colors.primary },
  scanSpinnerRing: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    borderWidth: 2.5, borderColor: 'transparent',
    borderTopColor: Colors.primary, borderRightColor: 'rgba(181,241,91,0.35)',
  },
  scanIconCenter: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(181,241,91,0.15)', alignItems: 'center', justifyContent: 'center' },
  scanStepText: { fontFamily: FontFamily.calendarMedium, fontSize: 15, color: 'rgba(255,255,255,0.88)', marginTop: 40, letterSpacing: 0.3 },
  scanSubLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.72)', fontStyle: 'italic' },

  // ── Scan: result sheet ──
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  scanSheetKAV: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scanSheet: {
    flex: 1,
    maxHeight: SCREEN_H * 0.88,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: 12, marginBottom: 14 },
  scanSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  scanSheetTitle: { fontFamily: FontFamily.headerBold, fontSize: 18, color: '#1a1a1a', textAlign: 'center', flex: 1 },
  sheetCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  scanSheetScroll: { width: '100%', flex: 1 },
  scanSheetContent: { gap: 24, paddingBottom: 24 },

  diagPhotoContainer: {
    width: '100%', height: 180,
    borderRadius: 16, overflow: 'hidden',
  },
  diagPhoto: { width: '100%', height: '100%' },
  diagPhotoGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  diagBadgeOverlay: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  diagBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  diagBadgeLabel: { fontFamily: FontFamily.calendarBold, fontSize: 12 },
  diagSummary: { fontFamily: FontFamily.calendarMedium, fontSize: 14, color: '#1a1a1a', lineHeight: 21 },
  diagSection: { borderRadius: 14, padding: 14, gap: 8 },
  diagSectionTitle: { fontFamily: FontFamily.calendarBold, fontSize: 13, marginBottom: 2 },
  diagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  diagIssueText: { fontFamily: FontFamily.calendarMedium, fontSize: 13, color: '#7a3500', flex: 1, lineHeight: 19 },
  diagRecText: { fontFamily: FontFamily.calendarMedium, fontSize: 13, color: '#123601', flex: 1, lineHeight: 19 },
  urgentNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: Colors.orangeBg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  urgentNoticeText: { fontFamily: FontFamily.calendarMedium, fontSize: 13, color: '#7a3500', flex: 1, lineHeight: 18 },

  // Question section
  questionSection: { gap: 12, paddingTop: 4 },
  questionTitle: { fontFamily: FontFamily.calendarBold, fontSize: 13, color: Colors.textDark },
  questionInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  questionInput: {
    flex: 1,
    minHeight: 80,
    maxHeight: 140,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: FontFamily.calendarMedium, fontSize: 14, color: '#1a1a1a',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)',
  },
  questionSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  questionSendBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.08)' },
  questionAnswerBubble: {
    backgroundColor: 'rgba(181,241,91,0.12)',
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(181,241,91,0.3)',
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
  },
  questionAnswerText: { fontFamily: FontFamily.calendarMedium, fontSize: 13, color: '#233527', flex: 1, lineHeight: 19 },

  // Action buttons
  applyBtn: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12, marginBottom: 4,
  },
  applyBtnText: { fontFamily: FontFamily.calendarBold, fontSize: 16, color: Colors.textDark },
  textBtn: { height: 56, alignItems: 'center', justifyContent: 'center', width: '100%' },
  textBtnLabel: { fontFamily: FontFamily.calendarMedium, fontSize: 16, color: '#1a1a1a' },

  // Confirm card
  confirmCard: {
    width: '100%', marginTop: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EBEBEB',
    gap: 12,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmText: { fontFamily: FontFamily.calendarMedium, fontSize: 14, color: '#1a1a1a', flex: 1 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  confirmApplyBtn: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  confirmApplyText: { fontFamily: FontFamily.calendarBold, fontSize: 14, color: Colors.textDark },
  confirmCancelBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  confirmCancelText: { fontFamily: FontFamily.calendarMedium, fontSize: 14, color: '#1a1a1a' },

  scanErrorState: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  scanErrorText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: '#4a4a4a', textAlign: 'center', lineHeight: 22 },

  // Edit sheet
  saveBtn: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12, marginBottom: 4,
  },
  saveBtnText: { fontFamily: FontFamily.calendarBold, fontSize: 16, color: Colors.textDark },
  divider: { width: '100%', height: 1, backgroundColor: '#EBEBEB', marginBottom: 8 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 48, width: '100%' },
  deleteBtnText: { fontFamily: FontFamily.calendarMedium, fontSize: 15, color: '#C62828' },
  editSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  editTitle: { fontFamily: FontFamily.headerBold, fontSize: 18, color: '#1a1a1a', textAlign: 'center', flex: 1 },
  editLabel: { fontFamily: FontFamily.calendarBold, fontSize: 13, color: '#1a1a1a', marginBottom: 8, alignSelf: 'flex-start' },
  editInput: {
    width: '100%', height: 52,
    backgroundColor: '#F9F9F9',
    borderRadius: 14, paddingHorizontal: 16,
    fontFamily: FontFamily.calendarMedium, fontSize: 15, color: '#1a1a1a',
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 24,
  },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 24, width: '100%' },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 48, borderRadius: 14,
    backgroundColor: '#F9F9F9',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  toggleBtnActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  toggleText: { fontFamily: FontFamily.calendarMedium, fontSize: 14, color: '#6b6b6b' },
  toggleTextActive: { color: '#FFFFFF', fontFamily: FontFamily.calendarBold },
});
