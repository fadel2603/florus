import { supabase } from './supabase';

export async function ensureAnonSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user.id) return session.user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) { console.warn('[Florus] Auth error:', error.message); return null; }
  return data.user?.id ?? null;
}
