import { supabase } from '../supabase';

export type Profile = {
  id: string;
  plan: 'free' | 'premium';
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, plan')
    .eq('id', userId)
    .single();
  if (error) { console.warn('[Florus] fetchProfile:', error.message); return null; }
  return data as Profile;
}
