import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily } from '@/constants/fonts';
import { Colors } from '@/constants/colors';
import { signUpWithEmail, signInWithEmail } from '@/lib/auth';

type Mode = 'signup' | 'login';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const emailTrimmed = email.trim().toLowerCase();

    if (!emailTrimmed || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError('Adresse email invalide.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'signup'
        ? await signUpWithEmail(emailTrimmed, password)
        : await signInWithEmail(emailTrimmed, password);

      if (result.error) {
        setError(formatError(result.error.message));
        return;
      }
      router.replace('/(tabs)' as any);
    } catch (e) {
      setError('Une erreur est survenue. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async () => {
    await AsyncStorage.setItem('@florus_guest', 'true');
    router.replace('/(tabs)' as any);
  };

  return (
    <LinearGradient colors={['#FFFFFF', Colors.background]} style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={36} color={Colors.textDark} />
            </View>
            <Text style={styles.appName}>Florus</Text>
            <Text style={styles.tagline}>Prends soin de tes plantes</Text>
          </View>

          {/* Mode toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
              onPress={() => { setMode('signup'); setError(null); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => { setMode('login'); setError(null); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={v => { setEmail(v); setError(null); }}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.inputPassword]}
                value={password}
                onChangeText={v => { setPassword(v); setError(null); }}
                placeholder="Mot de passe"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#C62828" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textDark} />
              ) : (
                <Text style={styles.ctaText}>
                  {mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Guest */}
          <TouchableOpacity onPress={continueAsGuest} activeOpacity={0.7} style={styles.guestBtn}>
            <Text style={styles.guestText}>Continuer sans compte</Text>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            En continuant, tu acceptes nos{' '}
            <Text style={styles.legalLink}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={styles.legalLink}>Politique de confidentialité</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function formatError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return 'Ce compte existe déjà. Connecte-toi.';
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Confirme ton email avant de te connecter.';
  }
  if (msg.includes('Password should be')) {
    return 'Le mot de passe doit faire au moins 6 caractères.';
  }
  return msg;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 24,
  },

  logoWrap: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: FontFamily.titleDisplay,
    fontSize: 32,
    color: Colors.textDark,
  },
  tagline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.textMuted,
  },

  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.sectionBg,
    borderRadius: 14,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  toggleTextActive: {
    fontFamily: FontFamily.calendarBold,
    color: Colors.textDark,
  },

  form: {
    gap: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.textDark,
  },
  inputPassword: {
    paddingRight: 8,
  },
  eyeBtn: {
    padding: 4,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#C62828',
    flex: 1,
  },

  ctaBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: Colors.textDark,
  },

  guestBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  guestText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },

  legalText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});
