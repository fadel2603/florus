import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

const LAST_UPDATED = '31 mai 2026';
const APP_NAME = 'Florus';
const CONTACT_EMAIL = 'contact@florus.app';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.para}>{children}</Text>;
}

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Dernière mise à jour : {LAST_UPDATED}</Text>

        <P>
          En téléchargeant ou en utilisant {APP_NAME}, tu acceptes les présentes conditions d'utilisation. Si tu n'acceptes pas ces conditions, n'utilise pas l'application.
        </P>

        <Section title="1. Description du service">
          <P>
            {APP_NAME} est une application mobile de suivi des soins des plantes. Elle permet d'identifier des plantes, de planifier des tâches de soin, de consulter un assistant IA botanique et de conserver un historique des soins effectués.
          </P>
        </Section>

        <Section title="2. Compte utilisateur">
          <P>
            Tu peux utiliser {APP_NAME} sans compte via un accès invité. La création d'un compte (email, Google ou Apple) est nécessaire pour synchroniser tes données entre appareils et les conserver en cas de réinstallation.
          </P>
          <P>
            Tu es responsable de la confidentialité de tes identifiants et de toute activité effectuée sous ton compte. Signale tout accès non autorisé à {CONTACT_EMAIL}.
          </P>
        </Section>

        <Section title="3. Utilisation acceptable">
          <P>Tu t'engages à utiliser {APP_NAME} uniquement à des fins personnelles et légales. Il est interdit de :</P>
          <P>— Tenter d'accéder aux données d'autres utilisateurs</P>
          <P>— Utiliser l'application à des fins commerciales sans autorisation écrite</P>
          <P>— Contourner les mesures de sécurité de l'application</P>
          <P>— Publier du contenu illégal, offensant ou trompeur</P>
        </Section>

        <Section title="4. Assistant IA">
          <P>
            L'assistant IA de {APP_NAME} est fourni à titre informatif uniquement. Les conseils botaniques générés par l'intelligence artificielle ne remplacent pas l'avis d'un professionnel horticole. {APP_NAME} ne saurait être tenu responsable des dommages causés aux plantes suite à l'application de ces conseils.
          </P>
        </Section>

        <Section title="5. Contenu utilisateur">
          <P>
            Tu conserves la propriété des photos et informations que tu ajoutes dans l'application. En les téléchargeant, tu accordes à {APP_NAME} une licence limitée, non exclusive et non transférable pour les stocker et les afficher dans l'application dans le seul but de te fournir le service.
          </P>
        </Section>

        <Section title="6. Propriété intellectuelle">
          <P>
            L'application {APP_NAME}, son design, son code source, ses icônes et ses textes sont la propriété exclusive de ses créateurs et sont protégés par les lois relatives au droit d'auteur. Toute reproduction non autorisée est interdite.
          </P>
        </Section>

        <Section title="7. Disponibilité du service">
          <P>
            Nous nous efforçons d'assurer la disponibilité de {APP_NAME} en permanence, mais nous ne garantissons pas un accès ininterrompu. Des interruptions peuvent survenir pour des raisons de maintenance ou des événements indépendants de notre volonté.
          </P>
        </Section>

        <Section title="8. Limitation de responsabilité">
          <P>
            Dans les limites permises par la loi applicable, {APP_NAME} ne peut être tenu responsable des dommages indirects, consécutifs ou accessoires découlant de l'utilisation ou de l'impossibilité d'utiliser l'application.
          </P>
        </Section>

        <Section title="9. Résiliation">
          <P>
            Tu peux cesser d'utiliser l'application et supprimer ton compte à tout moment. Nous nous réservons le droit de suspendre ou de supprimer un compte en cas de violation des présentes conditions.
          </P>
        </Section>

        <Section title="10. Modifications">
          <P>
            Nous pouvons modifier ces conditions à tout moment. Les modifications importantes seront notifiées dans l'application. La poursuite de l'utilisation de {APP_NAME} après notification vaut acceptation des nouvelles conditions.
          </P>
        </Section>

        <Section title="11. Droit applicable">
          <P>
            Les présentes conditions sont régies par le droit français. Tout litige sera soumis à la compétence des tribunaux français.
          </P>
        </Section>

        <Section title="12. Contact">
          <P>Pour toute question : {CONTACT_EMAIL}</P>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: FontFamily.headerBold, fontSize: 17, color: '#1a1a1a' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  updated: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.textMuted,
    marginBottom: 20, textAlign: 'center',
  },
  section: { marginTop: 28 },
  sectionTitle: { fontFamily: FontFamily.headerBold, fontSize: 16, color: '#1a1a1a', marginBottom: 10 },
  para: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: '#3a3a3a',
    lineHeight: 22, marginBottom: 6,
  },
});
