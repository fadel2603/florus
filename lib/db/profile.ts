import { supabase } from '../supabase';

export type Profile = {
  id: string;
  plan: 'free' | 'premium';
  displayName: string | null;
  avatarUrl: string | null;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, plan, display_name, avatar_url')
    .eq('id', userId)
    .single();
  if (error) { console.warn('[Florus] fetchProfile:', error.message); return null; }
  return {
    id: data.id,
    plan: data.plan,
    displayName: data.display_name ?? null,
    avatarUrl: data.avatar_url ?? null,
  };
}

export async function updateProfile(
  userId: string,
  updates: { displayName?: string; avatarUrl?: string },
): Promise<void> {
  const patch: Record<string, string> = {};
  if (updates.displayName !== undefined) patch.display_name = updates.displayName;
  if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) console.warn('[Florus] updateProfile:', error.message);
}

export async function uploadAvatar(userId: string, base64: string): Promise<string | null> {
  try {
    const path = `${userId}/avatar.jpg`;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.warn('[Florus] uploadAvatar:', error.message); return null; }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  } catch (e) {
    console.warn('[Florus] uploadAvatar exception:', e);
    return null;
  }
}
