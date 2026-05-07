import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import Badge from '@/components/ui/Badge';
import IconCircle from '@/components/ui/IconCircle';
import Button from '@/components/ui/Button';

const { width } = Dimensions.get('window');

export default function ScanResultScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Camera preview zone */}
      <View style={styles.cameraZone}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600' }}
          style={styles.preview}
        />
        <View style={styles.frameOverlay}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.scanLabel}>
          <View style={styles.scanDot} />
          <Text style={styles.scanLabelText}>Analyse en cours…</Text>
        </View>
      </View>

      {/* Result card */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <IconCircle
            size={44}
            backgroundColor={Colors.orange + '22'}
            icon="warning"
            iconColor={Colors.orange}
          />
          <View style={styles.resultHeaderText}>
            <Text style={styles.resultTitle}>Anomalie détectée</Text>
            <Text style={styles.resultSubtitle}>Monstera deliciosa</Text>
          </View>
          <Badge label="94%" variant="primary" />
        </View>

        <View style={styles.divider} />

        <Text style={styles.anomalyName}>Oïdium (mildiou blanc)</Text>
        <Text style={styles.anomalyDesc}>
          Champignon détecté sur 3 feuilles. Des taches blanches poudreuses sont visibles. Traitement recommandé dès que possible.
        </Text>

        <View style={styles.affectedRow}>
          <Ionicons name="leaf" size={14} color={Colors.textMuted} />
          <Text style={styles.affectedText}>3 feuilles affectées</Text>
          <Badge label="Modéré" variant="warning" />
        </View>

        <Button
          label="Voir la recommandation IA"
          onPress={() => router.push('/recommendation' as any)}
          variant="primary"
          size="lg"
          icon="sparkles"
          iconRight="chevron-forward"
          style={styles.ctaBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  cameraZone: {
    flex: 1,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  frameOverlay: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    width: '70%',
    height: '50%',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.primary,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 4,
    top: 0,
    left: 0,
  },
  cornerTR: {
    top: 0,
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  cornerBL: {
    top: undefined,
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  cornerBR: {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLabel: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  scanLabelText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 13,
    color: Colors.white,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 32,
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultHeaderText: { flex: 1 },
  resultTitle: {
    fontFamily: FontFamily.headerBold,
    fontSize: 17,
    color: Colors.textDark,
  },
  resultSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  anomalyName: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: Colors.textDark,
  },
  anomalyDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
  },
  affectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  affectedText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  ctaBtn: {
    marginTop: 4,
  },
});
