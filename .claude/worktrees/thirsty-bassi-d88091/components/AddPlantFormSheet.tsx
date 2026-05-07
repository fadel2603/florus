import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

type Props = {
  visible: boolean;
  detectedName: string;
  detectedLocation: string;
  photoUri: string | null;
  onClose: () => void;
  onConfirm: (name: string, location: 'Intérieur' | 'Extérieur') => void;
};

const SCREEN_H = Dimensions.get('window').height;
const SLIDE_OUT = 520;
const DISMISS_THRESHOLD = 80;

export default function AddPlantFormSheet({
  visible,
  detectedName,
  detectedLocation,
  photoUri,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SLIDE_OUT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState(detectedName);
  const [location, setLocation] = useState<'Intérieur' | 'Extérieur'>(
    detectedLocation === 'Extérieur' ? 'Extérieur' : 'Intérieur'
  );

  useEffect(() => {
    if (visible) {
      setName(detectedName);
      translateY.setValue(SLIDE_OUT);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SLIDE_OUT, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
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
        style={[styles.sheet, { transform: [{ translateY }], maxHeight: SCREEN_H * 0.88, paddingBottom: insets.bottom + 16 }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />

        <TouchableOpacity style={styles.closeBtn} onPress={dismiss} activeOpacity={0.7}>
          <Ionicons name="close" size={17} color="#1a1a1a" />
        </TouchableOpacity>

        <Text style={styles.title}>Personnaliser</Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Nom de la plante</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex : Mon Monstera"
            placeholderTextColor="#AEAEB2"
          />

          <Text style={styles.label}>Emplacement</Text>
          <View style={styles.toggleRow}>
            {(['Intérieur', 'Extérieur'] as const).map(loc => (
              <TouchableOpacity
                key={loc}
                style={[styles.toggleBtn, location === loc && styles.toggleBtnActive]}
                onPress={() => setLocation(loc)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={loc === 'Intérieur' ? 'home-outline' : 'sunny-outline'}
                  size={15}
                  color={location === loc ? '#FFFFFF' : '#6b6b6b'}
                />
                <Text style={[styles.toggleText, location === loc && styles.toggleTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {photoUri && (
            <>
              <Text style={styles.label}>Photo</Text>
              <View style={styles.photoRow}>
                <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.addPhotoBtn} activeOpacity={0.7}>
                  <Ionicons name="add" size={22} color="#6b6b6b" />
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85} onPress={() => onConfirm(name, location)}>
          <Ionicons name="leaf" size={18} color="#FFFFFF" />
          <Text style={styles.confirmText}>Ajouter à mes plantes</Text>
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
    marginTop: 8,
    marginBottom: 24,
  },
  scroll: { width: '100%' },
  label: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 13,
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: FontFamily.calendarMedium,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleBtnActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  toggleText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
    color: '#6b6b6b',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.calendarBold,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.border,
  },
  addPhotoBtn: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    marginTop: 4,
  },
  confirmText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: Colors.textDark,
  },
});
