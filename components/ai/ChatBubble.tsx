import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { FontFamily } from '@/constants/fonts';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  imageUri?: string;
};

export function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

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
            style={[
              dotStyles.dot,
              {
                opacity: dot,
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
              },
            ]}
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

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.aiRow]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#B5F15B" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {message.imageUri && (
          <Image source={{ uri: message.imageUri }} style={styles.photoThumb} />
        )}
        {message.text && (
          isUser
            ? <Text style={styles.userText}>{message.text}</Text>
            : <Markdown style={markdownStyles}>{message.text}</Markdown>
        )}
      </View>
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  heading1: {
    fontFamily: FontFamily.nameSemiBold,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 26,
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    fontFamily: FontFamily.nameSemiBold,
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 24,
    marginTop: 6,
    marginBottom: 4,
  },
  heading3: {
    fontFamily: FontFamily.nameSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 2,
  },
  strong: {
    fontFamily: FontFamily.nameSemiBold,
    color: '#FFFFFF',
  },
  em: {
    fontStyle: 'italic',
    color: '#FFFFFF',
  },
  bullet_list: {
    marginVertical: 2,
  },
  ordered_list: {
    marginVertical: 2,
  },
  list_item: {
    marginVertical: 1,
  },
  bullet_list_icon: {
    color: '#B5F15B',
    marginTop: 5,
  },
  ordered_list_icon: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: '#B5F15B',
    lineHeight: 21,
  },
  code_inline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#B5F15B',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  fence: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  code_block: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#B5F15B',
  },
  paragraph: {
    marginVertical: 2,
  },
  hr: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 1,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderLeftColor: '#B5F15B',
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 4,
  },
  link: {
    color: '#B5F15B',
    textDecorationLine: 'underline',
  },
});

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
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
});
