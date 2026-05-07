import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Modal,
  Dimensions,
} from 'react-native';

const SCREEN_H = Dimensions.get('window').height;
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '@/constants/fonts';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
};

const SLIDE_OUT = SCREEN_H * 0.6;
const DISMISS_THRESHOLD = 60;

export default function AddPlantSheet({ visible, onClose, onCamera, onGallery }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SLIDE_OUT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SLIDE_OUT);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SLIDE_OUT, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismiss} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 16 }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />

        <TouchableOpacity style={styles.closeBtn} onPress={dismiss} activeOpacity={0.7}>
          <Ionicons name="close" size={17} color="#1a1a1a" />
        </TouchableOpacity>

        <Text style={styles.title}>Ajouter une plante</Text>

        <TouchableOpacity
          style={styles.optionCell}
          activeOpacity={0.75}
          onPress={() => { dismiss(); setTimeout(onCamera, 280); }}
        >
          <View style={[styles.optionIconWrap, styles.iconCamera]}>
            <Ionicons name="camera" size={22} color="#007AFF" />
          </View>
          <View style={styles.optionTexts}>
            <Text style={styles.optionLabel}>Prendre une photo</Text>
            <Text style={styles.optionDesc}>Photographiez votre plante pour l'identifier</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.optionCell}
          activeOpacity={0.75}
          onPress={() => { dismiss(); setTimeout(onGallery, 280); }}
        >
          <View style={[styles.optionIconWrap, styles.iconGallery]}>
            <Ionicons name="images" size={22} color="#FF9500" />
          </View>
          <View style={styles.optionTexts}>
            <Text style={styles.optionLabel}>Choisir dans la galerie</Text>
            <Text style={styles.optionDesc}>Utilisez une photo existante de votre galerie</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: SCREEN_H * 0.5,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.headerBold,
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  optionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCamera: {
    backgroundColor: '#E8F0FE',
    shadowColor: '#007AFF',
  },
  iconGallery: {
    backgroundColor: '#FFF3E0',
    shadowColor: '#FF9500',
  },
  optionTexts: {
    flex: 1,
    gap: 3,
  },
  optionLabel: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 15,
    color: '#1a1a1a',
  },
  optionDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#6b6b6b',
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EBEBEB',
    marginLeft: 62,
  },
});
