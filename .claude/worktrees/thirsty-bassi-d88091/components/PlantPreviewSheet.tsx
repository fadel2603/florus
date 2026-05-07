import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { Plant } from '@/constants/data';

type Props = {
  plant: Plant | null;
  taskType?: string;
  onClose: () => void;
};

const SLIDE_OUT = 480;
const DISMISS_THRESHOLD = 80;

export default function PlantPreviewSheet({ plant, taskType, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SLIDE_OUT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const visible = !!plant;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SLIDE_OUT);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  if (!plant) return null;

  const nextCare = taskType === 'water' ? 'Arrosage dans 2 jours' : 'Observation dans 3 jours';
  const careIconName = taskType === 'water' ? 'water' : 'eye';
  const careIconColor = taskType === 'water' ? '#007AFF' : '#34C759';
  const careIconBg = taskType === 'water' ? '#E8F0FE' : '#E9F7EF';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
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

        <View style={styles.photoWrap}>
          {plant.image ? (
            <Image source={{ uri: plant.image }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoFallback]}>
              <Ionicons name="leaf" size={32} color="#AEAEB2" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{plant.name}</Text>
          <Text style={styles.species}>{plant.species}</Text>
          <Text style={styles.meta}>Ajoutée il y a 2 mois · Intérieur</Text>
        </View>

        <View style={styles.nextCareRow}>
          <View style={[styles.nextCareIcon, { backgroundColor: careIconBg }]}>
            <Ionicons name={careIconName as any} size={16} color={careIconColor} />
          </View>
          <Text style={styles.nextCareText}>{nextCare}</Text>
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => {
            dismiss();
            setTimeout(() => router.push(`/plant/${plant.id}` as any), 280);
          }}
        >
          <Text style={styles.ctaText}>Voir la fiche complète</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textDark} />
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
    marginBottom: 16,
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
  photoWrap: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  photo: {
    width: '100%',
    height: 160,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    width: '100%',
    marginBottom: 16,
  },
  name: {
    fontFamily: FontFamily.headerBold,
    fontSize: 20,
    color: '#1a1a1a',
  },
  species: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: '#6b6b6b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  meta: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#6b6b6b',
    marginTop: 4,
  },
  nextCareRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  nextCareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCareText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 15,
    color: '#1a1a1a',
  },
  cta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
  },
  ctaText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: Colors.textDark,
  },
});
