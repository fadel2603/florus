export type Plant = {
  id: string;
  name: string;
  species: string;
  image: string;
  careStatus?: string;
  waterFrequency: string;
  lastWatered: string;
  health: 'good' | 'warning' | 'critical';
  lightNeeds?: 'low' | 'medium' | 'high';
  location?: 'indoor' | 'outdoor';
  healthNote?: string;
  issues?: string[];
};

export type Task = {
  id: string;
  plantId: string;
  plantName: string;
  type: 'water' | 'observe' | 'fertilize' | 'repot' | 'treat' | 'rotate' | 'clean_leaves' | 'mist' | 'trim';
  done: boolean;
  time?: string;
};

export type HistoryEvent = {
  id: string;
  type: 'added' | 'task_done' | 'analysis';
  label: string;
  date: string;
  icon: string;
  color: string;
};

export const TASK_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  water:        { label: 'Arrosage effectué',        icon: 'water',          color: '#4FC3F7' },
  observe:      { label: 'Observation effectuée',    icon: 'eye',            color: '#81C784' },
  fertilize:    { label: 'Fertilisation effectuée',  icon: 'flask',          color: '#FFB74D' },
  repot:        { label: 'Rempotage effectué',        icon: 'leaf',           color: '#A5D6A7' },
  treat:        { label: 'Traitement effectué',       icon: 'medkit',         color: '#EF9A9A' },
  rotate:       { label: 'Rotation effectuée',        icon: 'refresh-circle', color: '#F9A825' },
  clean_leaves: { label: 'Feuilles nettoyées',        icon: 'sparkles',       color: '#B2DFDB' },
  mist:         { label: 'Brumisation effectuée',     icon: 'water-outline',  color: '#81D4FA' },
  trim:         { label: 'Taille effectuée',          icon: 'cut',            color: '#CE93D8' },
};
