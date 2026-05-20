import { supabase } from '../supabase';
import { Plant } from '@/constants/data';

type DbPlant = {
  id: string;
  name: string;
  species: string;
  image: string;
  care_status: string | null;
  water_frequency: string;
  last_watered: string;
  health: 'good' | 'warning' | 'critical';
  light_needs: 'low' | 'medium' | 'high' | null;
  location: 'indoor' | 'outdoor' | null;
  health_note: string | null;
  issues: string[];
};

function toPlant(row: DbPlant): Plant {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    image: row.image,
    careStatus: row.care_status ?? undefined,
    waterFrequency: row.water_frequency,
    lastWatered: row.last_watered,
    health: row.health,
    lightNeeds: row.light_needs ?? undefined,
    location: row.location ?? undefined,
    healthNote: row.health_note ?? undefined,
    issues: row.issues ?? [],
  };
}

export async function fetchPlants(userId: string): Promise<Plant[]> {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[Florus] fetchPlants:', error.message); return []; }
  return (data ?? []).map(toPlant);
}

export async function fetchPlantById(userId: string, plantId: string): Promise<Plant | null> {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', plantId)
    .single();
  if (error) { console.warn('[Florus] fetchPlantById:', error.message); return null; }
  return data ? toPlant(data as DbPlant) : null;
}

export async function insertPlant(userId: string, plant: Omit<Plant, 'id'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('plants')
    .insert({
      user_id: userId,
      name: plant.name,
      species: plant.species,
      image: plant.image,
      care_status: plant.careStatus ?? null,
      water_frequency: plant.waterFrequency,
      last_watered: plant.lastWatered,
      health: plant.health,
      light_needs: plant.lightNeeds ?? null,
      location: plant.location ?? null,
      health_note: plant.healthNote ?? null,
      issues: plant.issues ?? [],
    })
    .select('id')
    .single();
  if (error) { console.warn('[Florus] insertPlant:', error.message); return null; }
  return (data as { id: string })?.id ?? null;
}

export async function updatePlantDb(userId: string, plantId: string, updates: Partial<Plant>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.species !== undefined) dbUpdates.species = updates.species;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.careStatus !== undefined) dbUpdates.care_status = updates.careStatus;
  if (updates.waterFrequency !== undefined) dbUpdates.water_frequency = updates.waterFrequency;
  if (updates.lastWatered !== undefined) dbUpdates.last_watered = updates.lastWatered;
  if (updates.health !== undefined) dbUpdates.health = updates.health;
  if (updates.lightNeeds !== undefined) dbUpdates.light_needs = updates.lightNeeds;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.healthNote !== undefined) dbUpdates.health_note = updates.healthNote;
  if (updates.issues !== undefined) dbUpdates.issues = updates.issues;

  const { error } = await supabase
    .from('plants')
    .update(dbUpdates)
    .eq('user_id', userId)
    .eq('id', plantId);
  if (error) console.warn('[Florus] updatePlant:', error.message);
}

export async function deletePlant(userId: string, plantId: string): Promise<void> {
  const { error } = await supabase
    .from('plants')
    .delete()
    .eq('user_id', userId)
    .eq('id', plantId);
  if (error) console.warn('[Florus] deletePlant:', error.message);
}
