import { supabase } from '../supabase';

export type PlantPhoto = {
  id: string;
  plantId: string;
  url: string;
  storagePath: string;
  createdAt: string;
};

export async function fetchPlantPhotos(plantId: string): Promise<PlantPhoto[]> {
  const { data, error } = await supabase
    .from('plant_photos')
    .select('*')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[Florus] fetchPlantPhotos:', error.message); return []; }
  return (data ?? []).map(row => ({
    id: row.id,
    plantId: row.plant_id,
    url: row.url,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }));
}

export async function uploadPlantPhoto(
  userId: string,
  plantId: string,
  uri: string,
): Promise<PlantPhoto | null> {
  const path = `${userId}/${plantId}/${Date.now()}.jpg`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('plant-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) {
    console.warn('[Florus] uploadPlantPhoto storage:', uploadError.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('plant-photos')
    .getPublicUrl(path);

  const { data, error: dbError } = await supabase
    .from('plant_photos')
    .insert({ user_id: userId, plant_id: plantId, url: publicUrl, storage_path: path })
    .select('*')
    .single();

  if (dbError) {
    console.warn('[Florus] uploadPlantPhoto db:', dbError.message);
    await supabase.storage.from('plant-photos').remove([path]);
    return null;
  }

  return {
    id: data.id,
    plantId: data.plant_id,
    url: data.url,
    storagePath: data.storage_path,
    createdAt: data.created_at,
  };
}

export async function deletePlantPhoto(photoId: string, storagePath: string): Promise<void> {
  await supabase.storage.from('plant-photos').remove([storagePath]);
  const { error } = await supabase.from('plant_photos').delete().eq('id', photoId);
  if (error) console.warn('[Florus] deletePlantPhoto:', error.message);
}
