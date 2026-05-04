import React, { RefObject } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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

interface ChatInputProps {
  input: string;
  onChangeText: (text: string) => void;
  pendingImage: string | null;
  onRemovePendingImage: () => void;
  onSend: () => void;
  onCamera: () => void;
  onMic: () => void;
  inputRef: RefObject<TextInput | null>;
  paddingBottom: number;
}

export default function ChatInput({
  input,
  onChangeText,
  pendingImage,
  onRemovePendingImage,
  onSend,
  onCamera,
  onMic,
  inputRef,
  paddingBottom,
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
        <View style={styles.pill}>
          <TextInput
            ref={inputRef}
            style={styles.field}
            value={input}
            onChangeText={onChangeText}
            placeholder="Une question ?"
            placeholderTextColor="rgba(255,255,255,0.6)"
            selectionColor="#5B9E3B"
            returnKeyType="send"
            onSubmitEditing={onSend}
          />
          <View style={styles.icons}>
            {hasSendable ? (
              <TouchableOpacity onPress={onSend} style={styles.sendBtn} activeOpacity={0.8}>
                <Ionicons name="arrow-up" size={20} color="#1C1C1E" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onMic} activeOpacity={0.7}>
                <WaveformBars />
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
    height: 68,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingLeft: 32,
    paddingRight: 24,
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
