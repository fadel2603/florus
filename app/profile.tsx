import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Header bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon profil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + User info ── */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>FG</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Fadel Gueye</Text>
            <Text style={styles.userEmail}>fadel2603@gmail.com</Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>Florus Pro 🌿</Text>
          </View>
        </View>

        {/* ── Settings ── */}
        <Text style={styles.sectionLabel}>Paramètres</Text>

        <View style={styles.settingsCard}>
          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="notifications-outline" size={18} color="#FF9500" />
            </View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: '#E0E0E0', true: Colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Language */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#E8F0FE' }]}>
              <Ionicons name="globe-outline" size={18} color="#007AFF" />
            </View>
            <Text style={styles.settingLabel}>Langue</Text>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>Français</Text>
              <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Dark mode */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#F2F2F7' }]}>
              <Ionicons name="moon-outline" size={18} color="#636366" />
            </View>
            <Text style={styles.settingLabel}>Mode sombre</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E0E0E0', true: Colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>

        {/* ── App info ── */}
        <Text style={styles.sectionLabel}>À propos</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf-outline" size={18} color="#2E7D32" />
            </View>
            <Text style={styles.settingLabel}>Version</Text>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>1.0.0</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: '#F2F2F7' }]}>
              <Ionicons name="document-text-outline" size={18} color="#636366" />
            </View>
            <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: '#F2F2F7' }]}>
              <Ionicons name="shield-outline" size={18} color="#636366" />
            </View>
            <Text style={styles.settingLabel}>Confidentialité</Text>
            <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={18} color="#C62828" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.headerBold,
    fontSize: 18,
    color: '#1a1a1a',
  },

  content: {
    paddingHorizontal: 20,
    gap: 0,
  },

  // ── User card ──
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 26,
    color: Colors.textDark,
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontFamily: FontFamily.headerBold,
    fontSize: 20,
    color: '#1a1a1a',
  },
  userEmail: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: '#6b6b6b',
  },
  proBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  proBadgeText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 13,
    color: '#2E7D32',
  },

  // ── Settings ──
  sectionLabel: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 13,
    color: '#6b6b6b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 15,
    color: '#1a1a1a',
    flex: 1,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValueText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
    color: '#6b6b6b',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F2F2F7',
    marginLeft: 66,
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  logoutText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: '#C62828',
  },
});
