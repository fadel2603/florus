import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily } from '@/constants/fonts';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import GlassButton from '@/components/ui/GlassButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AI_MODEL, SYSTEM_PROMPT } from '@/constants/api';
import { callClaude } from '@/lib/ai';
import * as FileSystem from 'expo-file-system/legacy';

// Lazy load — not available in Expo Go, requires native build
let SpeechModule: any = null;
try {
  SpeechModule = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
} catch {
  // Expo Go: native module not available
}
import AIHero from '@/components/ai/AIHero';
import ChatBubble, { ChatMessage, TypingDots } from '@/components/ai/ChatBubble';
import ChatInput from '@/components/ai/ChatInput';
import AIScanCamera from '@/components/ai/AIScanCamera';

const { height: SCREEN_H } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

const CHAT_KEY = (plantId: string) => `@florus_chat_${plantId}`;
const MAX_HISTORY = 60;

type PlantContext = {
  id?: string;
  name: string;
  species: string;
  image: string;
  waterFrequency?: string;
  location?: 'indoor' | 'outdoor';
};

type Props = {
  visible: boolean;
  onClose: () => void;
  plantContext?: PlantContext;
  onOpenCamera?: (onPhoto: (uri: string) => void) => void;
  onOpenScanCamera?: () => void;
  mode?: 'modal' | 'screen';
};

export default function AISheet({ visible, onClose, plantContext, onOpenCamera, onOpenScanCamera, mode = 'modal' }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [scanCamVisible, setScanCamVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Load persisted chat history when plant changes
  useEffect(() => {
    if (!plantContext?.id) { setMessages([]); return; }
    AsyncStorage.getItem(CHAT_KEY(plantContext.id)).then(raw => {
      setMessages(raw ? (JSON.parse(raw) as ChatMessage[]) : []);
    }).catch(() => setMessages([]));
  }, [plantContext?.id]);

  // Persist messages after each exchange (plant chats only)
  useEffect(() => {
    if (!plantContext?.id || messages.length === 0) return;
    AsyncStorage.setItem(CHAT_KEY(plantContext.id), JSON.stringify(messages.slice(-MAX_HISTORY)));
  }, [messages, plantContext?.id]);

  // ── Voice recognition events ──
  useEffect(() => {
    if (!SpeechModule) return;
    const subs = [
      SpeechModule.addListener('result', (e: any) => {
        const transcript = e.results?.[0]?.transcript ?? '';
        if (transcript) setInput(transcript);
      }),
      SpeechModule.addListener('end', () => setIsRecording(false)),
      SpeechModule.addListener('error', () => setIsRecording(false)),
    ];
    return () => subs.forEach((s: any) => s?.remove?.());
  }, []);

  useEffect(() => {
    if (mode === 'screen') return;
    if (visible) {
      translateY.setValue(SCREEN_H);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 28,
        stiffness: 200,
        mass: 1,
      }).start();
    }
  }, [visible, mode]);

  const stopRecording = () => {
    if (isRecording) {
      SpeechModule?.stop();
      setIsRecording(false);
    }
  };

  const dismiss = (onComplete?: () => void) => {
    stopRecording();
    Animated.timing(translateY, {
      toValue: SCREEN_H,
      duration: 320,
      useNativeDriver: true,
    }).start(() => {
      setInput('');
      setPendingImage(null);
      onClose();
      onComplete?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.5) dismiss();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 26, stiffness: 220 }).start();
      },
    })
  ).current;

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !pendingImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text || undefined,
      imageUri: pendingImage || undefined,
    };

    const historySnapshot = messages;

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingImage(null);
    setLoading(true);
    scrollToBottom();

    try {
      const priorMessages = historySnapshot.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: [
          {
            type: 'text' as const,
            text: msg.role === 'user' && msg.imageUri && !msg.text
              ? '(image partagée)'
              : (msg.text ?? ''),
          },
        ],
      }));

      const currentContent: Array<
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
        | { type: 'text'; text: string }
      > = [];

      if (userMsg.imageUri) {
        const base64 = await FileSystem.readAsStringAsync(userMsg.imageUri, { encoding: 'base64' });
        currentContent.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        });
      }

      currentContent.push({
        type: 'text',
        text: text || (userMsg.imageUri ? "What is this plant?" : ''),
      });

      const data = await callClaude({
        model: AI_MODEL,
        max_tokens: 1024,
        system: plantContext
          ? `${SYSTEM_PROMPT}\n\nContexte: L'utilisateur consulte sa plante "${plantContext.name}" (${plantContext.species})${plantContext.location ? `, emplacement ${plantContext.location === 'outdoor' ? 'extérieur' : 'intérieur'}` : ''}${plantContext.waterFrequency ? `, arrosage : ${plantContext.waterFrequency}` : ''}. Réponds de façon ciblée sur cette plante.`
          : SYSTEM_PROMPT,
        messages: [
          ...priorMessages,
          { role: 'user', content: currentContent },
        ],
      });

      const aiText = data?.content?.[0]?.text ?? "Désolé, je n'ai pas pu répondre.";
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: aiText },
      ]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Erreur de connexion.';
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: `⚠️ ${detail}` },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleMic = async () => {
    if (!SpeechModule) {
      Alert.alert(
        'Reconnaissance vocale',
        'Cette fonctionnalité nécessite un build natif. Lance "npx expo run:ios" une fois pour l\'activer.',
      );
      return;
    }
    if (isRecording) {
      SpeechModule.stop();
      setIsRecording(false);
      return;
    }
    const { granted } = await SpeechModule.requestPermissionsAsync();
    if (!granted) return;
    setInput('');
    setIsRecording(true);
    SpeechModule.start({ lang: 'fr-FR', interimResults: true, maxAlternatives: 1 });
  };

  const handleCamera = () => {
    if (onOpenScanCamera) {
      dismiss(onOpenScanCamera);
    } else {
      setScanCamVisible(true);
    }
  };

  const hasMessages = messages.length > 0 || loading;

  const chatContent = (
    <>
      <View style={styles.contentArea}>
        {plantContext && (
          <TouchableOpacity
            style={styles.plantBannerWrap}
            onPress={Keyboard.dismiss}
            activeOpacity={1}
          >
            <View style={styles.plantBanner}>
              <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, styles.plantBannerFill]} />
              <Image source={{ uri: plantContext.image }} style={styles.plantThumb} />
              <View style={styles.plantBannerText}>
                <Text style={styles.plantBannerName}>{plantContext.name}</Text>
                <Text style={styles.plantBannerSpecies}>{plantContext.species}</Text>
                {(plantContext.waterFrequency || plantContext.location) && (
                  <Text style={styles.plantBannerMeta}>
                    {plantContext.location === 'outdoor' ? '🌿 Extérieur' : '🏠 Intérieur'}
                    {plantContext.waterFrequency ? `  ·  💧 ${plantContext.waterFrequency}` : ''}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {!hasMessages && !plantContext && <AIHero />}

        {hasMessages && (
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onScrollBeginDrag={Keyboard.dismiss}
          >
            {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
            {loading && <TypingDots />}
          </ScrollView>
        )}
      </View>

      <ChatInput
        input={input}
        onChangeText={setInput}
        pendingImage={pendingImage}
        onRemovePendingImage={() => setPendingImage(null)}
        onSend={handleSend}
        onCamera={handleCamera}
        onMic={handleMic}
        isRecording={isRecording}
        inputRef={textInputRef}
        paddingBottom={
          mode === 'screen'
            ? (keyboardVisible ? insets.bottom + 8 : insets.bottom + 49 + 8)
            : insets.bottom + 16
        }
        placeholder={plantContext ? `Une question sur ${plantContext.name} ?` : 'Une question ?'}
        prominent={mode === 'screen'}
        glass={mode === 'modal'}
      />

      <AIScanCamera
        visible={scanCamVisible}
        onClose={() => setScanCamVisible(false)}
        onPhoto={(uri) => {
          setScanCamVisible(false);
          setPendingImage(uri);
          setTimeout(() => textInputRef.current?.focus(), 200);
        }}
      />
    </>
  );

  // ── Screen mode ──
  if (mode === 'screen') {
    return (
      <View style={styles.screenRoot}>
        <Image source={require('../assets/ai-bg.jpg')} style={styles.aiBg} resizeMode="cover" />
        {chatContent}
      </View>
    );
  }

  // ── Modal mode : iOS 26 Liquid Glass ──
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => dismiss()} statusBarTranslucent>
      <View style={[StyleSheet.absoluteFill, styles.modalScrim]} pointerEvents="none" />

      <Animated.View style={[StyleSheet.absoluteFill, styles.modalRoot, { transform: [{ translateY }] }]}>

        <BlurView intensity={68} tint="systemUltraThinMaterialLight" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.modalBgFill]} />

        <View {...panResponder.panHandlers} style={[styles.dragZone, { paddingTop: insets.top + 6 }]}>
          <View style={styles.handle} />
        </View>

        <GlassButton
          size={38}
          onPress={() => dismiss()}
          style={{ position: 'absolute', top: insets.top + 8, left: 18, zIndex: 20 }}
        >
          <Ionicons name="close" size={16} color="rgba(60,60,67,0.75)" />
        </GlassButton>

        {chatContent}

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, overflow: 'hidden' },

  modalScrim: { backgroundColor: 'rgba(0,0,0,0.18)' },
  modalRoot: { overflow: 'hidden', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  modalBgFill: { backgroundColor: 'rgba(255,255,255,0.18)' },

  aiBg: { ...StyleSheet.absoluteFillObject },

  dragZone: { alignItems: 'center', paddingBottom: 12 },
  handle: { width: 36, height: 5, borderRadius: 100, backgroundColor: 'rgba(60,60,67,0.22)' },

  contentArea: { flex: 1 },
  chatScroll: { flex: 1, marginTop: 8 },
  chatScrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

  plantBannerWrap: { marginHorizontal: 16, marginTop: 52, marginBottom: 4 },
  plantBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.80)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10,
  },
  plantBannerFill: { backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 18 },
  plantThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.08)' },
  plantBannerText: { flex: 1, gap: 2 },
  plantBannerName: { fontFamily: FontFamily.headerBold, fontSize: 16, color: '#1a1a1a' },
  plantBannerSpecies: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(0,0,0,0.45)', fontStyle: 'italic' },
  plantBannerMeta: { fontFamily: FontFamily.calendarMedium, fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 3 },
});
