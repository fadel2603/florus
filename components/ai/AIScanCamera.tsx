import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '@/constants/fonts';

const { width: W, height: H } = Dimensions.get('window');
const FRAME_SIZE = W * 0.78;
const CORNER = 28;
const CORNER_W = 3;

type Props = {
  visible: boolean;
  onClose: () => void;
  onPhoto: (uri: string) => void;
};

export default function AIScanCamera({ visible, onClose, onPhoto }: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) onPhoto(photo.uri);
    } catch {
      // silently ignore
    }
  };

  const renderContent = () => {
    if (!permission) return <View style={styles.root} />;

    if (!permission.granted) {
      return (
        <View style={[styles.root, styles.permCenter]}>
          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.6)" />
          <Text style={styles.permText}>Accès à la caméra requis</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Autoriser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + 10 }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      );
    }

    const sideW = (W - FRAME_SIZE) / 2;
    const topH = (H - FRAME_SIZE) / 2 - 40;

    return (
      <View style={styles.root}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Dim overlay */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={[styles.overlayBlock, { height: topH, width: W }]} />
          <View style={{ flexDirection: 'row', height: FRAME_SIZE }}>
            <View style={[styles.overlayBlock, { width: sideW }]} />
            <View style={{ width: FRAME_SIZE }} />
            <View style={[styles.overlayBlock, { width: sideW }]} />
          </View>
          <View style={[styles.overlayBlock, { flex: 1, width: W }]} />
        </View>

        {/* Animated corner frame */}
        <Animated.View
          style={[
            styles.frame,
            {
              width: FRAME_SIZE,
              height: FRAME_SIZE,
              top: topH,
              left: sideW,
              transform: [{ scale: pulse }],
            },
          ]}
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

        {/* AI scan label */}
        <View style={[styles.labelWrap, { top: topH - 72 }]} pointerEvents="none">
          <Text style={styles.labelTitle}>Prenez votre plante en photo</Text>
          <Text style={styles.labelSub}>L'IA va l'analyser immédiatement ✨</Text>
        </View>

        {/* Shutter */}
        <View style={[styles.shutterWrap, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity onPress={takePicture} activeOpacity={0.85} style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>

        {/* Close */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 10 }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {renderContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  permCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#B5F15B',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  permBtnText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 15,
    color: '#123601',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBlock: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  frame: {
    position: 'absolute',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: 6,
  },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  labelTitle: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  labelSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  shutterWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  closeBtn: {
    position: 'absolute',
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
