import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { FontFamily } from '@/constants/fonts';
import { ANTHROPIC_API_KEY, AI_MODEL, SYSTEM_PROMPT } from '@/constants/api';

const { height: SCREEN_H } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

type Props = { visible: boolean; onClose: () => void };

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  imageUri?: string;
};

// ── Waveform icon ──────────────────────────────────────────────────────────────
function WaveformBars() {
  const heights = [14, 30, 20, 36, 24];
  return (
    <View style={waveStyles.row}>
      {heights.map((h, i) => (
        <View key={i} style={[waveStyles.bar, { height: h }]} />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { width: 3.5, borderRadius: 2, backgroundColor: 'rgba(60,60,67,0.45)' },
});

// ── Typing dots ────────────────────────────────────────────────────────────────
function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(450 - i * 150),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={dotStyles.bubble}>
      <View style={dotStyles.row}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[dotStyles.dot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const dotStyles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30,30,30,0.75)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
});

export default function AISheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
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
        else Animated.spring(translateY, {
          toValue: 0, useNativeDriver: true, damping: 26, stiffness: 220,
        }).start();
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

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingImage(null);
    setLoading(true);
    scrollToBottom();

    try {
      const contentParts: any[] = [];

      if (userMsg.imageUri) {
        // Fetch the image as base64
        const response = await fetch(userMsg.imageUri);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        });
      }

      if (text) {
        contentParts.push({ type: 'text', text });
      } else if (userMsg.imageUri) {
        contentParts.push({ type: 'text', text: "Qu'est-ce que c'est ?" });
      }

      const apiMessages = [{ role: 'user', content: contentParts }];

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
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await res.json();
      const aiText = data?.content?.[0]?.text ?? "Désolé, je n'ai pas pu répondre.";

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: aiText,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "Erreur de connexion. Réessaie.",
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri);
      setTimeout(() => textInputRef.current?.focus(), 200);
    }
  };

  const handleMic = () => {
    textInputRef.current?.focus();
  };

  const hasMessages = messages.length > 0 || loading;

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>

        {/* Frosted glass background */}
        <BlurView
          intensity={88}
          tint="systemUltraThinMaterialLight"
          style={StyleSheet.absoluteFill}
        />

        {/* Green radial glow — LinearGradient from bottom, offset left */}
        <LinearGradient
          colors={['transparent', 'rgba(90,180,20,0.22)', 'rgba(90,180,20,0.60)']}
          locations={[0, 0.42, 1]}
          start={{ x: 0.35, y: 0 }}
          end={{ x: 0.35, y: 1 }}
          style={styles.greenGlow}
          pointerEvents="none"
        />

        {/* Drag handle */}
        <View
          {...panResponder.panHandlers}
          style={[styles.dragZone, { paddingTop: insets.top + 6 }]}
        >
          <View style={styles.handle} />
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          onPress={dismiss}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color="rgba(60,60,67,0.7)" />
        </TouchableOpacity>

        {/* Hero (hidden when messages exist) */}
        {!hasMessages && (
          <View style={styles.heroArea}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>Bonjour Fadel</Text>
              <Svg width={311} height={105}>
                <Defs>
                  <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#000000" />
                    <Stop offset="100%" stopColor="#8F8F8F" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText fill="url(#heroGrad)" fontSize="39" fontFamily="Gabarito" fontWeight="500" textAnchor="middle" x="155" y="44">
                  Comment puis-je
                </SvgText>
                <SvgText fill="url(#heroGrad)" fontSize="39" fontFamily="Gabarito" fontWeight="500" textAnchor="middle" x="155" y="96">
                  t'aider ?
                </SvgText>
              </Svg>
            </View>
          </View>
        )}

        {/* Chat messages */}
        {hasMessages && (
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(msg => (
              <View key={msg.id} style={msg.role === 'user' ? styles.userRow : styles.aiRow}>
                {msg.role === 'assistant' && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color="#B5F15B" />
                  </View>
                )}
                <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                  {msg.imageUri && (
                    <Image source={{ uri: msg.imageUri }} style={styles.photoThumb} />
                  )}
                  {msg.text && (
                    <Text style={msg.role === 'user' ? styles.userText : styles.aiText}>
                      {msg.text}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            {loading && <TypingDots />}
          </ScrollView>
        )}

        {/* Input bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.inputOuter, { paddingBottom: insets.bottom + 16 }]}>
            {/* Pending image preview */}
            {pendingImage && (
              <View style={styles.pendingImageRow}>
                <Image source={{ uri: pendingImage }} style={styles.pendingThumb} />
                <TouchableOpacity onPress={() => setPendingImage(null)} style={styles.removePending}>
                  <Ionicons name="close-circle" size={18} color="rgba(60,60,67,0.6)" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputPill}>
              <TextInput
                ref={textInputRef}
                style={styles.inputField}
                value={input}
                onChangeText={setInput}
                placeholder="Une question ?"
                placeholderTextColor="rgba(255,255,255,0.6)"
                selectionColor="#5B9E3B"
                returnKeyType="send"
                onSubmitEditing={handleSend}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              <View style={styles.inputIcons}>
                {input.trim() || pendingImage ? (
                  <TouchableOpacity onPress={handleSend} style={styles.sendBtn} activeOpacity={0.8}>
                    <Ionicons name="arrow-up" size={20} color="#1C1C1E" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleMic} activeOpacity={0.7}>
                    <WaveformBars />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleCamera} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={30} color="rgba(60,60,67,0.50)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

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
    width: 36, height: 5, borderRadius: 100,
    backgroundColor: 'rgba(60,60,67,0.18)',
  },

  closeBtn: {
    position: 'absolute',
    left: 18,
    width: 38, height: 38, borderRadius: 19,
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

  heroArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 36,
  },
  greetingBlock: {
    alignItems: 'center',
    gap: 7,
  },
  greeting: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 19,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
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

  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(30,30,30,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
  },
  userBubble: {
    backgroundColor: '#B5F15B',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(30,30,30,0.75)',
    borderBottomLeftRadius: 4,
  },
  userText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 21,
  },
  aiText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  photoThumb: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },

  inputOuter: {
    paddingHorizontal: 14,
  },
  pendingImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  pendingThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  removePending: {
    marginLeft: 6,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingLeft: 32,
    paddingRight: 24,
  },
  inputField: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: '#1C1C1E',
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#B5F15B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
