import React, { RefObject, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/fonts';

function WaveformBars() {
  const heights = [10, 22, 15, 28, 18, 24, 12];
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
  bar: { width: 3, borderRadius: 2, backgroundColor: 'rgba(60,60,67,0.35)' },
});

function RecordingMic() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Ionicons name="mic" size={22} color="#FF3B30" />
    </Animated.View>
  );
}

interface ChatInputProps {
  input: string;
  onChangeText: (text: string) => void;
  pendingImage: string | null;
  onRemovePendingImage: () => void;
  onSend: () => void;
  onCamera: () => void;
  onMic: () => void;
  isRecording?: boolean;
  inputRef: RefObject<TextInput | null>;
  paddingBottom: number;
  placeholder?: string;
  /** When true, renders a more prominent "Gemini-style" pill for use as a full screen */
  prominent?: boolean;
  /** When true, renders a liquid glass AI-style pill (modal overlay context) */
  glass?: boolean;
}

export default function ChatInput({
  input,
  onChangeText,
  pendingImage,
  onRemovePendingImage,
  onSend,
  onCamera,
  onMic,
  isRecording = false,
  inputRef,
  paddingBottom,
  placeholder = 'Une question ?',
  prominent = false,
  glass = false,
}: ChatInputProps) {
  const hasSendable = !!input.trim() || !!pendingImage;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[
        styles.outer,
        { paddingBottom },
        prominent && styles.outerProminent,
        glass && styles.outerGlass,
      ]}>
        {pendingImage && (
          <View style={styles.pendingRow}>
            <Image source={{ uri: pendingImage }} style={styles.pendingThumb} />
            <TouchableOpacity onPress={onRemovePendingImage} style={styles.removePending}>
              <Ionicons name="close-circle" size={18} color="rgba(60,60,67,0.6)" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Glass pill wrapper (shadow outside, blur inside) ── */}
        <View style={[glass && styles.pillGlassShadow]}>
          <View style={[
            styles.pill,
            prominent && styles.pillProminent,
            glass && styles.pillGlass,
            isRecording && styles.pillRecording,
          ]}>
            {/* Liquid glass layers */}
            {glass && Platform.OS === 'ios' && (
              <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            )}
            {glass && (
              <LinearGradient
                colors={['rgba(255,255,255,0.72)', 'rgba(240,252,245,0.68)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}

            {/* Left action — camera in prominent mode, + in glass mode */}
            {(prominent || glass) && (
              <TouchableOpacity onPress={onCamera} style={styles.leftBtn} activeOpacity={0.7}>
                <Ionicons name="add" size={24} color="rgba(60,60,67,0.55)" />
              </TouchableOpacity>
            )}

            <TextInput
              ref={inputRef}
              style={[styles.field, (prominent || glass) && styles.fieldProminent]}
              value={input}
              onChangeText={onChangeText}
              placeholder={isRecording ? 'Écoute en cours…' : placeholder}
              placeholderTextColor={
                isRecording
                  ? 'rgba(255,59,48,0.5)'
                  : (prominent || glass)
                    ? 'rgba(60,60,67,0.38)'
                    : 'rgba(255,255,255,0.6)'
              }
              selectionColor="#5B9E3B"
              returnKeyType="send"
              onSubmitEditing={onSend}
              editable={!isRecording}
              multiline={prominent || glass}
            />

            <View style={styles.icons}>
              {hasSendable && !isRecording ? (
                <TouchableOpacity onPress={onSend} style={styles.sendBtn} activeOpacity={0.8}>
                  <Ionicons name="arrow-up" size={18} color="#1C1C1E" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity onPress={onMic} activeOpacity={0.7}>
                    {isRecording ? <RecordingMic /> : (
                      <Ionicons
                        name="mic-outline"
                        size={22}
                        color="rgba(60,60,67,0.50)"
                      />
                    )}
                  </TouchableOpacity>
                  {!prominent && !glass && (
                    <TouchableOpacity onPress={onCamera} activeOpacity={0.7}>
                      <Ionicons name="camera-outline" size={26} color="rgba(60,60,67,0.50)" />
                    </TouchableOpacity>
                  )}
                  {prominent && !isRecording && (
                    <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
                      <WaveformBars />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 14,
  },
  outerProminent: {
    paddingHorizontal: 16,
  },
  outerGlass: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  pendingRow: {
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

  // ── Compact pill (fallback, not used for glass or prominent) ──
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingLeft: 20,
    paddingRight: 16,
  },
  pillRecording: {
    backgroundColor: 'rgba(255,59,48,0.08)',
  },

  // ── Prominent pill (screen mode — Gemini style) ──
  pillProminent: {
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingLeft: 6,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Glass pill (modal mode — iOS 26 Liquid Glass AI) ──
  pillGlassShadow: {
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
  },
  pillGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.82)',
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 8,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.88)' : 'transparent',
  },

  leftBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  field: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: '#1C1C1E',
    paddingTop: 0,
    paddingBottom: 0,
  },
  fieldProminent: {
    fontSize: 16,
    color: '#1C1C1E',
    maxHeight: 100,
  },

  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
