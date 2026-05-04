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
} from 'react-native';
import { FontFamily } from '@/constants/fonts';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ANTHROPIC_API_KEY, AI_MODEL, SYSTEM_PROMPT } from '@/constants/api';
import AIHero from '@/components/ai/AIHero';
import ChatBubble, { ChatMessage, TypingDots } from '@/components/ai/ChatBubble';
import ChatInput from '@/components/ai/ChatInput';

const { height: SCREEN_H } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

type PlantContext = {
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
};

export default function AISheet({ visible, onClose, plantContext, onOpenCamera }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
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
  }, [visible]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_H,
      duration: 320,
      useNativeDriver: true,
    }).start(() => {
      setInput('');
      setMessages([]);
      setPendingImage(null);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
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

    // Capture history BEFORE the state update (setMessages is async)
    const historySnapshot = messages;

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingImage(null);
    setLoading(true);
    scrollToBottom();

    try {
      // ── Build prior conversation for multi-turn context ──
      // Images from previous turns can't be re-encoded cheaply, so they're
      // represented as a text note — the current turn sends the real image.
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

      // ── Build current message content ──
      const currentContent: Array<
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
        | { type: 'text'; text: string }
      > = [];

      if (userMsg.imageUri) {
        const blob = await fetch(userMsg.imageUri).then(r => r.blob());
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        currentContent.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        });
      }

      currentContent.push({
        type: 'text',
        text: text || (userMsg.imageUri ? "What is this plant?" : ''),
      });

      // ── API call ──
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
          system: plantContext
            ? `${SYSTEM_PROMPT}\n\nContexte: L'utilisateur consulte sa plante "${plantContext.name}" (${plantContext.species})${plantContext.location ? `, emplacement ${plantContext.location === 'outdoor' ? 'extérieur' : 'intérieur'}` : ''}${plantContext.waterFrequency ? `, arrosage : ${plantContext.waterFrequency}` : ''}. Réponds de façon ciblée sur cette plante.`
            : SYSTEM_PROMPT,
          messages: [
            ...priorMessages,
            { role: 'user', content: currentContent },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Erreur ${res.status}`);
      }

      const data = await res.json();
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

  const handleCamera = async () => {
    if (onOpenCamera) {
      onOpenCamera((uri: string) => {
        setPendingImage(uri);
        setTimeout(() => textInputRef.current?.focus(), 200);
      });
    } else {
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        setPendingImage(result.assets[0].uri);
        setTimeout(() => textInputRef.current?.focus(), 200);
      }
    }
  };

  const hasMessages = messages.length > 0 || loading;
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>

        <BlurView intensity={88} tint="systemUltraThinMaterialLight" style={StyleSheet.absoluteFill} />

        <LinearGradient
          colors={['transparent', 'rgba(90,180,20,0.22)', 'rgba(90,180,20,0.60)']}
          locations={[0, 0.42, 1]}
          start={{ x: 0.35, y: 0 }}
          end={{ x: 0.35, y: 1 }}
          style={styles.greenGlow}
          pointerEvents="none"
        />

        <View {...panResponder.panHandlers} style={[styles.dragZone, { paddingTop: insets.top + 6 }]}>
          <View style={styles.handle} />
        </View>

        <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 8 }]} onPress={dismiss} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color="rgba(60,60,67,0.7)" />
        </TouchableOpacity>

        <View style={styles.contentArea}>
          {plantContext && (
            <View style={styles.plantBannerWrap}>
              <View style={styles.plantBanner}>
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
            </View>
          )}

          {!hasMessages && !plantContext && <AIHero />}

          {hasMessages && (
            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
          onMic={() => textInputRef.current?.focus()}
          inputRef={textInputRef}
          paddingBottom={insets.bottom + 16}
          placeholder={plantContext ? `Une question sur ${plantContext.name} ?` : 'Une question ?'}
        />

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  greenGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.58,
  },
  dragZone: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: 'rgba(60,60,67,0.18)',
  },
  closeBtn: {
    position: 'absolute',
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  contentArea: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
    marginTop: 8,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },

  plantBannerWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  plantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.90)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  plantThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  plantBannerText: {
    flex: 1,
    gap: 2,
  },
  plantBannerName: {
    fontFamily: FontFamily.headerBold,
    fontSize: 16,
    color: '#1a1a1a',
  },
  plantBannerSpecies: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    fontStyle: 'italic',
  },
  plantBannerMeta: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 11,
    color: 'rgba(0,0,0,0.38)',
    marginTop: 3,
  },
});
