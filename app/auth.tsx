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
  LayoutAnimation,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily } from '@/constants/fonts';
import { Colors } from '@/constants/colors';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
} from '@/lib/auth';

type EmailMode = 'signup' | 'login';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<'apple' | 'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goHome = () => router.replace('/(tabs)' as any);

  const withLoading = async (key: typeof loading, fn: () => Promise<void>) => {
    setLoading(key);
    setError(null);
    try { await fn(); } finally { setLoading(null); }
  };

  const handleApple = () => withLoading('apple', async () => {
    const { error: err } = await signInWithApple();
    if (err) { setError(err); return; }
    // onAuthStateChange in UserContext picks up the session
    const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
    if (session) goHome();
  });

  const handleGoogle = () => withLoading('google', async () => {
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); return; }
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) goHome();
  });

  const handleEmail = () => withLoading('email', async () => {
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed || !password) { setError('Remplis tous les champs.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) { setError('Email invalide.'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (6 min).'); return; }

    const result = emailMode === 'signup'
      ? await signUpWithEmail(emailTrimmed, password)
      : await signInWithEmail(emailTrimmed, password);

    if (result.error) { setError(formatError(result.error.message)); return; }
    goHome();
  });

  const toggleEmailForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEmailExpanded(v => !v);
    setError(null);
  };

const isLoading = loading !== null;

  return (
    <LinearGradient colors={['#FFFFFF', Colors.background]} style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={40} color={Colors.textDark} />
            </View>
            <Text style={styles.appName}>Florus</Text>
            <Text style={styles.tagline}>Bienvenue 🌿</Text>
          </View>

          {/* Social buttons */}
          <View style={styles.socialGroup}>
            {/* Apple — iOS only */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.appleBtn}
                onPress={handleApple}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                {loading === 'apple' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                    <Text style={styles.appleBtnText}>Continuer avec Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {loading === 'google' ? (
                <ActivityIndicator color="#444" />
              ) : (
                <>
                  <GoogleLogo />
                  <Text style={styles.googleBtnText}>Continuer avec Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email — collapsed by default */}
          <TouchableOpacity
            style={styles.emailToggleBtn}
            onPress={toggleEmailForm}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="mail-outline" size={17} color={Colors.textMuted} />
            <Text style={styles.emailToggleText}>Continuer avec email</Text>
            <Ionicons
              name={emailExpanded ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={Colors.textMuted}
            />
          </TouchableOpacity>

          {emailExpanded && (
            <View style={styles.emailForm}>
              {/* Signup / Login toggle */}
              <View style={styles.toggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, emailMode === 'signup' && styles.toggleBtnActive]}
                  onPress={() => { setEmailMode('signup'); setError(null); }}
                >
                  <Text style={[styles.toggleText, emailMode === 'signup' && styles.toggleTextActive]}>
                    Créer un compte
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, emailMode === 'login' && styles.toggleBtnActive]}
                  onPress={() => { setEmailMode('login'); setError(null); }}
                >
                  <Text style={[styles.toggleText, emailMode === 'login' && styles.toggleTextActive]}>
                    Se connecter
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={17} color={Colors.textMuted} style={styles.inputIcon} />
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
                <Ionicons name="lock-closed-outline" size={17} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(null); }}
                  placeholder="Mot de passe"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleEmail}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={14} color="#C62828" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.emailSubmitBtn, loading === 'email' && { opacity: 0.6 }]}
                onPress={handleEmail}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                {loading === 'email' ? (
                  <ActivityIndicator color={Colors.textDark} />
                ) : (
                  <Text style={styles.emailSubmitText}>
                    {emailMode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {error && !emailExpanded && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#C62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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

function GoogleLogo() {
  return (
    <View style={googleStyles.wrap}>
      <Text style={googleStyles.g}>G</Text>
    </View>
  );
}

const googleStyles = StyleSheet.create({
  wrap: {
    width: 20,
    height: 20,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  g: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4285F4',
    lineHeight: 20,
  },
});

function formatError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already exists')) return 'Ce compte existe déjà. Connecte-toi.';
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.';
  if (msg.includes('Password should be')) return 'Mot de passe trop court (6 caractères min).';
  return msg;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 20,
  },

  logoWrap: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  appName: {
    fontFamily: FontFamily.titleDisplay,
    fontSize: 34,
    color: Colors.textDark,
  },
  tagline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.textMuted,
  },

  socialGroup: {
    gap: 12,
  },

  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  appleBtnText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: '#FFFFFF',
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  googleBtnText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: '#1a1a1a',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },

  emailToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  emailToggleText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 15,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },

  emailForm: {
    gap: 10,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.sectionBg,
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  toggleTextActive: {
    fontFamily: FontFamily.calendarBold,
    color: Colors.textDark,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.textDark,
  },
  eyeBtn: { padding: 4 },
  emailSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  emailSubmitText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 16,
    color: Colors.textDark,
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
    fontSize: 11,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 17,
  },
  legalLink: { textDecorationLine: 'underline' },
});
