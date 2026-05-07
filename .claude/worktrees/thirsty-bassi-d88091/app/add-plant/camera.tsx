import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');
const FRAME_SIZE = W * 0.75;
const CORNER = 28;
const CORNER_W = 3;

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.permCenter]}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.6)" />
        <Text style={styles.permText}>Accès à la caméra requis</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        router.replace({ pathname: '/add-plant/analyzing', params: { photo: photo.uri } } as any);
      }
    } catch (e) {
      console.warn('Camera error', e);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Dim overlay outside frame */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.overlayRow, { height: (H - FRAME_SIZE) / 2 }]}>
          <View style={styles.overlayFull} />
        </View>
        <View style={[styles.overlayRow, { height: FRAME_SIZE }]}>
          <View style={[styles.overlaySide, { width: (W - FRAME_SIZE) / 2 }]} />
          <View style={styles.frameHole} />
          <View style={[styles.overlaySide, { width: (W - FRAME_SIZE) / 2 }]} />
        </View>
        <View style={[styles.overlayRow, { height: (H - FRAME_SIZE) / 2 }]}>
          <View style={styles.overlayFull} />
        </View>
      </View>

      {/* Animated corner frame */}
      <Animated.View
        style={[styles.frame, { transform: [{ scale: pulse }] }]}
        pointerEvents="none"
      >
        {/* Top-left */}
        <View style={[styles.corner, styles.cornerTL]} />
        {/* Top-right */}
        <View style={[styles.corner, styles.cornerTR]} />
        {/* Bottom-left */}
        <View style={[styles.corner, styles.cornerBL]} />
        {/* Bottom-right */}
        <View style={[styles.corner, styles.cornerBR]} />
      </Animated.View>

      {/* Hint text */}
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>Centrez votre plante dans le cadre</Text>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={22} color="white" />
      </TouchableOpacity>

      {/* Shutter */}
      <View style={[styles.shutterWrap, { bottom: insets.bottom + 32 }]}>
        <TouchableOpacity style={styles.shutter} onPress={takePicture} activeOpacity={0.8}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  permCenter: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  permText: { color: 'white', fontFamily: FontFamily.calendarMedium, fontSize: 16 },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  permBtnText: { fontFamily: FontFamily.calendarBold, fontSize: 14, color: Colors.textDark },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayRow: { flexDirection: 'row' },
  overlayFull: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlaySide: { backgroundColor: 'rgba(0,0,0,0.55)' },
  frameHole: { width: FRAME_SIZE, height: FRAME_SIZE },

  frame: {
    position: 'absolute',
    top: (H - FRAME_SIZE) / 2,
    left: (W - FRAME_SIZE) / 2,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: Colors.primary,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_W, borderRightWidth: CORNER_W,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W,
    borderBottomRightRadius: 8,
  },

  hint: {
    position: 'absolute',
    top: (H - FRAME_SIZE) / 2 - 44,
    left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
  },

  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shutterWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.white,
  },
});
