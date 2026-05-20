import { supabase } from './supabase';

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
    // Upgrade anonymous → email account (preserves all data)
    return supabase.auth.updateUser({ email, password });
  }
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
