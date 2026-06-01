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

function Li({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.liRow}>
      <Text style={styles.liDot}>•</Text>
      <Text style={styles.liText}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Dernière mise à jour : {LAST_UPDATED}</Text>

        <P>
          {APP_NAME} est une application de suivi et de soin des plantes d'intérieur et d'extérieur. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons tes données personnelles.
        </P>

        <Section title="1. Données collectées">
          <P>Nous collectons uniquement les données nécessaires au bon fonctionnement de l'application :</P>
          <Li>Adresse e-mail (si tu crées un compte)</Li>
          <Li>Identifiant anonyme unique (généré automatiquement même sans compte)</Li>
          <Li>Nom d'affichage et photo de profil (optionnels, définis par toi)</Li>
          <Li>Photos des plantes que tu ajoutes à l'application</Li>
          <Li>Informations sur tes plantes (nom, espèce, fréquence d'arrosage, localisation)</Li>
          <Li>Tâches de soin et leur état (effectué / non effectué)</Li>
          <Li>Historique des soins effectués</Li>
        </Section>

        <Section title="2. Utilisation des données">
          <P>Tes données sont utilisées exclusivement pour :</P>
          <Li>Afficher et synchroniser tes plantes, tâches et historique sur ton appareil</Li>
          <Li>Analyser les photos de tes plantes via l'IA pour en identifier l'espèce et l'état de santé</Li>
          <Li>Envoyer des notifications de rappel pour les soins (uniquement si tu les actives)</Li>
          <Li>Sauvegarder tes données de façon sécurisée afin de les restaurer en cas de réinstallation</Li>
          <P>Nous n'utilisons pas tes données à des fins publicitaires, nous ne les vendons pas et nous ne les partageons pas avec des tiers à des fins commerciales.</P>
        </Section>

        <Section title="3. Services tiers">
          <P>L'application utilise les services suivants :</P>
          <Li>
            <Text style={styles.bold}>Supabase</Text> — base de données et stockage des fichiers (hébergé sur AWS en Europe). Politique de confidentialité : supabase.com/privacy
          </Li>
          <Li>
            <Text style={styles.bold}>Anthropic Claude API</Text> — analyse des photos de plantes par intelligence artificielle. Les images envoyées ne sont pas utilisées pour entraîner les modèles. Politique : anthropic.com/privacy
          </Li>
          <Li>
            <Text style={styles.bold}>Google Sign-In</Text> (optionnel) — authentification via ton compte Google. Politique : policies.google.com/privacy
          </Li>
          <Li>
            <Text style={styles.bold}>Apple Sign-In</Text> (optionnel) — authentification via ton identifiant Apple. Politique : apple.com/legal/privacy
          </Li>
          <Li>
            <Text style={styles.bold}>Expo / React Native</Text> — framework d'application mobile. Politique : expo.dev/privacy
          </Li>
        </Section>

        <Section title="4. Stockage et sécurité">
          <P>
            Tes données sont stockées de façon chiffrée sur les serveurs de Supabase (infrastructure AWS, région Europe). Les communications entre l'application et nos serveurs sont chiffrées via HTTPS/TLS. L'accès à tes données est protégé par des règles de sécurité strictes — seul ton compte peut lire et modifier tes propres données.
          </P>
          <P>
            Les photos de profil et photos de plantes sont stockées dans un espace de stockage privé et accessible uniquement via ton identifiant utilisateur.
          </P>
        </Section>

        <Section title="5. Conservation des données">
          <P>
            Tes données sont conservées tant que ton compte est actif. Si tu supprime ton compte ou que tu effaces tes données, toutes tes informations personnelles sont supprimées de nos serveurs dans un délai de 30 jours.
          </P>
          <P>
            Les sessions anonymes (sans compte) sont conservées localement sur ton appareil. Si tu désinstalles l'application sans avoir créé de compte, tes données ne peuvent pas être récupérées.
          </P>
        </Section>

        <Section title="6. Tes droits">
          <P>Conformément au Règlement Général sur la Protection des Données (RGPD), tu disposes des droits suivants :</P>
          <Li><Text style={styles.bold}>Accès</Text> — obtenir une copie de tes données</Li>
          <Li><Text style={styles.bold}>Rectification</Text> — corriger des données inexactes</Li>
          <Li><Text style={styles.bold}>Suppression</Text> — supprimer ton compte et toutes tes données</Li>
          <Li><Text style={styles.bold}>Portabilité</Text> — recevoir tes données dans un format structuré</Li>
          <Li><Text style={styles.bold}>Opposition</Text> — t'opposer à certains traitements</Li>
          <P>Pour exercer ces droits, contacte-nous à : {CONTACT_EMAIL}</P>
        </Section>

        <Section title="7. Notifications">
          <P>
            Les notifications push sont utilisées uniquement pour rappeler les soins à effectuer sur tes plantes. Tu peux les activer ou désactiver à tout moment depuis les réglages de l'application ou les paramètres de ton iPhone. Aucune notification marketing n'est envoyée.
          </P>
        </Section>

        <Section title="8. Enfants">
          <P>
            {APP_NAME} n'est pas destiné aux enfants de moins de 13 ans. Nous ne collectons pas sciemment de données personnelles concernant des mineurs. Si tu penses qu'un enfant nous a fourni des informations personnelles, contacte-nous pour les supprimer.
          </P>
        </Section>

        <Section title="9. Modifications">
          <P>
            Nous pouvons mettre à jour cette politique de confidentialité. En cas de modification significative, tu en seras informé via une notification dans l'application. La date de dernière mise à jour est toujours indiquée en haut de cette page.
          </P>
        </Section>

        <Section title="10. Contact">
          <P>
            Pour toute question relative à cette politique ou à tes données personnelles, contacte-nous à :
          </P>
          <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>
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
  sectionTitle: {
    fontFamily: FontFamily.headerBold, fontSize: 16, color: '#1a1a1a', marginBottom: 10,
  },
  para: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: '#3a3a3a',
    lineHeight: 22, marginBottom: 8,
  },
  liRow: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingLeft: 4 },
  liDot: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.primaryDark, marginTop: 1 },
  liText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: '#3a3a3a', lineHeight: 22, flex: 1 },
  bold: { fontFamily: FontFamily.calendarBold },
  contactEmail: {
    fontFamily: FontFamily.calendarBold, fontSize: 14, color: Colors.primaryDark,
    marginTop: 4, textDecorationLine: 'underline',
  },
});
