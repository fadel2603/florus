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
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/fonts';

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
      <Ionicons name="mic" size={24} color="#FF3B30" />
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
}: ChatInputProps) {
  const hasSendable = !!input.trim() || !!pendingImage;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.outer, { paddingBottom }]}>
        {pendingImage && (
          <View style={styles.pendingRow}>
            <Image source={{ uri: pendingImage }} style={styles.pendingThumb} />
            <TouchableOpacity onPress={onRemovePendingImage} style={styles.removePending}>
              <Ionicons name="close-circle" size={18} color="rgba(60,60,67,0.6)" />
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.pill, isRecording && styles.pillRecording]}>
          <TextInput
            ref={inputRef}
            style={styles.field}
            value={input}
            onChangeText={onChangeText}
            placeholder={isRecording ? 'Écoute en cours…' : placeholder}
            placeholderTextColor={isRecording ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.6)'}
            selectionColor="#5B9E3B"
            returnKeyType="send"
            onSubmitEditing={onSend}
            editable={!isRecording}
          />
          <View style={styles.icons}>
            {hasSendable && !isRecording ? (
              <TouchableOpacity onPress={onSend} style={styles.sendBtn} activeOpacity={0.8}>
                <Ionicons name="arrow-up" size={20} color="#1C1C1E" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onMic} activeOpacity={0.7}>
                {isRecording ? <RecordingMic /> : <WaveformBars />}
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onCamera} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={30} color="rgba(60,60,67,0.50)" />
            </TouchableOpacity>
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingLeft: 32,
    paddingRight: 24,
  },
  pillRecording: {
    backgroundColor: 'rgba(255,59,48,0.08)',
  },
  field: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: '#1C1C1E',
    paddingTop: 0,
    paddingBottom: 0,
  },
  icons: {
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
