import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useUser } from '@/context/UserContext';
import { signOut } from '@/lib/auth';
import { updateProfile, uploadAvatar } from '@/lib/db/profile';
import {
  getNotifEnabled,
  setNotifEnabled,
  requestPermissions,
  cancelAllNotifications,
  rescheduleAllTasks,
} from '@/lib/notifications';
import { fetchAllUserTasks } from '@/lib/db/tasks';

function getInitials(displayName: string | null, email: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, userId, email, isAnonymous, displayName, avatarUrl, refreshProfile } = useUser();

  const [notifEnabled, setNotifEnabledState] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // ── Display name editing ──
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  // ── Avatar ──
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(avatarUrl);

  useEffect(() => { if (!uploadingAvatar) setLocalAvatarUrl(avatarUrl); }, [avatarUrl]);
  useEffect(() => { setNameInput(displayName ?? ''); }, [displayName]);
  useEffect(() => { getNotifEnabled().then(setNotifEnabledState); }, []);

  const initials = getInitials(displayName, email);
  const shownName = displayName ?? (email ? email.split('@')[0] : 'Invité');

  const handleSignOut = async () => {
    await signOut();
    await AsyncStorage.removeItem('@florus_guest');
    router.replace('/auth' as any);
  };

  const handleNotifToggle = async (value: boolean) => {
    setNotifEnabledState(value);
    await setNotifEnabled(value);
    if (value) {
      const granted = await requestPermissions();
      if (!granted) { setNotifEnabledState(false); await setNotifEnabled(false); return; }
      if (userId) {
        const tasks = await fetchAllUserTasks(userId);
        await rescheduleAllTasks(tasks);
      }
    } else {
      await cancelAllNotifications();
    }
  };

  // ── Avatar picker ──
  const handleAvatarPress = () => {
    Alert.alert('Photo de profil', undefined, [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const { granted } = await ImagePicker.requestCameraPermissionsAsync();
          if (!granted) return;
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1], base64: true });
          if (!result.canceled && result.assets[0]) doUploadAvatar(result.assets[0].uri, result.assets[0].base64 ?? '');
        },
      },
      {
        text: 'Choisir dans la galerie',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1], base64: true });
          if (!result.canceled && result.assets[0]) doUploadAvatar(result.assets[0].uri, result.assets[0].base64 ?? '');
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const doUploadAvatar = async (uri: string, base64: string) => {
    if (!userId || !base64) return;
    setUploadingAvatar(true);
    setLocalAvatarUrl(uri); // show local preview immediately
    const url = await uploadAvatar(userId, base64);
    if (url) {
      await updateProfile(userId, { avatarUrl: url });
      setLocalAvatarUrl(url);
      refreshProfile(); // fire-and-forget, local state already correct
    } else {
      Alert.alert('Erreur', "Impossible d'envoyer la photo. Vérifie ta connexion.");
    }
    setUploadingAvatar(false);
  };

  // ── Name editing ──
  const startEditName = () => {
    setNameInput(displayName ?? '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const saveName = async () => {
    Keyboard.dismiss();
    const trimmed = nameInput.trim();
    if (!trimmed || !userId) { setEditingName(false); return; }
    setSavingName(true);
    await updateProfile(userId, { displayName: trimmed });
    await refreshProfile();
    setSavingName(false);
    setEditingName(false);
  };

  const cancelEditName = () => {
    setNameInput(displayName ?? '');
    setEditingName(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Header ── */}
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ── User card ── */}
        <View style={styles.userCard}>

          {/* Avatar */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handleAvatarPress} activeOpacity={0.8}>
            {localAvatarUrl ? (
              <Image source={{ uri: localAvatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={13} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          {/* Name */}
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                ref={nameInputRef}
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Ton prénom"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <TouchableOpacity onPress={saveName} style={styles.nameActionBtn} disabled={savingName}>
                {savingName
                  ? <ActivityIndicator size="small" color={Colors.primaryDark} />
                  : <Ionicons name="checkmark" size={20} color={Colors.primaryDark} />
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEditName} style={styles.nameActionBtn}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={startEditName} activeOpacity={0.7}>
              <Text style={styles.userName}>{shownName}</Text>
              <Ionicons name="pencil" size={14} color={Colors.textMuted} style={{ marginLeft: 6, marginTop: 3 }} />
            </TouchableOpacity>
          )}

          <Text style={styles.userEmail}>{email ?? 'Sans compte'}</Text>

          <View style={[styles.proBadge, !isPremium && styles.proBadgeFree]}>
            <Text style={styles.proBadgeText}>{isPremium ? 'Florus Pro 🌿' : 'Gratuit'}</Text>
          </View>
        </View>

        {/* ── Paramètres ── */}
        <Text style={styles.sectionLabel}>Paramètres</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="notifications-outline" size={18} color="#FF9500" />
            </View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notifEnabled}
              onValueChange={handleNotifToggle}
              trackColor={{ false: '#E0E0E0', true: Colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          <View style={styles.rowDivider} />

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

        {/* ── À propos ── */}
        <Text style={styles.sectionLabel}>À propos</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf-outline" size={18} color="#2E7D32" />
            </View>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValueText}>1.0.0</Text>
          </View>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => router.push('/privacy' as any)}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#F2F2F7' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#636366" />
            </View>
            <Text style={styles.settingLabel}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => router.push('/terms' as any)}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#F2F2F7' }]}>
              <Ionicons name="document-text-outline" size={18} color="#636366" />
            </View>
            <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* ── Actions compte ── */}
        {isAnonymous ? (
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.75} onPress={() => router.replace('/auth' as any)}>
            <Ionicons name="person-add-outline" size={18} color={Colors.primaryDark} />
            <Text style={[styles.logoutText, { color: Colors.primaryDark }]}>Créer un compte</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.75} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color="#C62828" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.background,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: FontFamily.headerBold, fontSize: 18, color: '#1a1a1a' },

  content: { paddingHorizontal: 20, gap: 0 },

  // ── User card ──
  userCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontFamily: FontFamily.calendarBold, fontSize: 28, color: Colors.textDark },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },

  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontFamily: FontFamily.headerBold, fontSize: 20, color: '#1a1a1a' },
  nameEditRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
    gap: 4,
  },
  nameInput: {
    fontFamily: FontFamily.headerBold, fontSize: 18, color: '#1a1a1a',
    flex: 1, paddingVertical: 6,
  },
  nameActionBtn: { padding: 4 },

  userEmail: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: '#6b6b6b' },
  proBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  proBadgeFree: { backgroundColor: Colors.sectionBg },
  proBadgeText: { fontFamily: FontFamily.calendarBold, fontSize: 13, color: '#2E7D32' },

  // ── Settings ──
  sectionLabel: {
    fontFamily: FontFamily.calendarBold, fontSize: 13, color: '#6b6b6b',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10, marginTop: 4, paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16, minHeight: 56,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontFamily: FontFamily.calendarMedium, fontSize: 15, color: '#1a1a1a', flex: 1 },
  settingValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValueText: { fontFamily: FontFamily.calendarMedium, fontSize: 14, color: '#6b6b6b' },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F2F2F7', marginLeft: 66 },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: '#FFCDD2',
    backgroundColor: '#FFFFFF', marginBottom: 8,
  },
  logoutText: { fontFamily: FontFamily.calendarBold, fontSize: 16, color: '#C62828' },
});
