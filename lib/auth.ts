import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export async function ensureAnonSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user.id) return session.user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) { console.warn('[Florus] Auth error:', error.message); return null; }
  return data.user?.id ?? null;
}

/**
 * Sign up with email. If the current session is anonymous, upgrades it in-place
 * (userId stays the same, all existing data is preserved). Otherwise creates a
 * fresh account.
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const isAnon = session?.user && !session.user.email;
  if (isAnon) {
    return supabase.auth.updateUser({ email, password });
  }
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'florus://',
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) return { error: error?.message ?? 'Erreur Google' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, 'florus://');
    if (result.type !== 'success') return { error: null }; // user cancelled

    await supabase.auth.exchangeCodeForSession(result.url);
    return { error: null };
  } catch (e) {
    return { error: 'Connexion Google impossible.' };
  }
}

export async function signInWithApple(): Promise<{ error: string | null }> {
  try {
    // Dynamic import — only available on iOS native build
    const AppleAuth = await import('expo-apple-authentication');
    const credential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { error: 'Token Apple manquant.' };

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    return { error: error?.message ?? null };
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return { error: null }; // user cancelled
    return { error: 'Connexion Apple impossible.' };
  }
}

export async function signOut() {
  return supabase.auth.signOut();
}
