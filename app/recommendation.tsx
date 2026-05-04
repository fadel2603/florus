import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StepCard from '@/components/ui/StepCard';

const STEPS = [
  {
    step: 1,
    title: 'Isoler la plante',
    desc: 'Éloigne le Monstera des autres plantes pour éviter la propagation du champignon.',
    icon: 'shield-checkmark',
  },
  {
    step: 2,
    title: 'Retirer les feuilles atteintes',
    desc: 'Coupe les 3 feuilles présentant des taches blanches avec des ciseaux désinfectés.',
    icon: 'cut',
  },
  {
    step: 3,
    title: 'Appliquer du bicarbonate',
    desc: 'Pulvérise un mélange d\'1 c.à.s. de bicarbonate de soude dans 1L d\'eau sur toutes les feuilles.',
    icon: 'flask',
  },
  {
    step: 4,
    title: 'Traitement fongicide',
    desc: 'Si les symptômes persistent après 7 jours, applique un fongicide à base de soufre.',
    icon: 'medical',
  },
  {
    step: 5,
    title: 'Prévention',
    desc: 'Améliore la circulation d\'air autour de la plante et évite d\'arroser le feuillage.',
    icon: 'sunny',
  },
];

export default function RecommendationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.handle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Badge label="Recommandation IA" variant="primary" icon="sparkles" />
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.textDark} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Traitement Oïdium</Text>
        <Text style={styles.subtitle}>
          Plan de traitement personnalisé pour ton Monstera deliciosa
        </Text>

        {/* Urgency */}
        <View style={styles.urgencyCard}>
          <Ionicons name="time" size={18} color={Colors.orange} />
          <Text style={styles.urgencyText}>Traitement à commencer dans les 48h</Text>
        </View>

        {/* Steps */}
        <Text style={styles.stepsTitle}>Plan de traitement</Text>
        {STEPS.map(item => (
          <StepCard
            key={item.step}
            step={item.step}
            icon={item.icon as any}
            title={item.title}
            desc={item.desc}
          />
        ))}

        {/* CTA */}
        <Button
          label="Marquer comme lu"
          onPress={() => router.back()}
          variant="primary"
          size="lg"
          icon="checkmark-circle"
          style={styles.doneBtn}
        />

        <Text style={styles.disclaimer}>
          Recommandations générées par IA. Consultez un botaniste en cas de doute.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.headerBold,
    fontSize: 26,
    color: Colors.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.orange + '18',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.orange,
  },
  urgencyText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 14,
    color: Colors.textDark,
  },
  stepsTitle: {
    fontFamily: FontFamily.headerBold,
    fontSize: 17,
    color: Colors.textDark,
    marginBottom: 12,
  },
  doneBtn: {
    marginTop: 12,
    marginBottom: 8,
  },
  disclaimer: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
