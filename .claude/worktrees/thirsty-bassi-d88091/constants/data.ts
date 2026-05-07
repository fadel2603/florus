export type Plant = {
  id: string;
  name: string;
  species: string;
  image: string;
  careStatus?: string;
  waterFrequency: string;
  lastWatered: string;
  health: 'good' | 'warning' | 'critical';
  // AI analysis fields
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
  date: string; // ISO string
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

export const PLANTS: Plant[] = [
  {
    id: '1',
    name: 'Monstera',
    species: 'Monstera deliciosa',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600',
    careStatus: 'Soin en cours',
    waterFrequency: 'Tous les 7 jours',
    lastWatered: 'Il y a 5 jours',
    health: 'warning',
  },
  {
    id: '2',
    name: 'Pothos',
    species: 'Epipremnum aureum',
    image: 'https://images.unsplash.com/photo-1591958911259-bee2173bdccc?w=600',
    waterFrequency: 'Tous les 5 jours',
    lastWatered: 'Il y a 2 jours',
    health: 'good',
  },
  {
    id: '3',
    name: 'Ficus',
    species: 'Ficus lyrata',
    image: 'https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=600',
    waterFrequency: 'Tous les 10 jours',
    lastWatered: 'Il y a 1 jour',
    health: 'good',
  },
  {
    id: '4',
    name: 'Cactus',
    species: 'Cereus peruvianus',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600',
    careStatus: 'Soin en cours',
    waterFrequency: 'Tous les 14 jours',
    lastWatered: 'Il y a 12 jours',
    health: 'critical',
  },
];

export const TODAY_TASKS: Task[] = [
  { id: 't1', plantId: '1', plantName: 'Monstera', type: 'water', done: false, time: '08:00' },
  { id: 't2', plantId: '4', plantName: 'Cactus', type: 'water', done: false, time: '08:00' },
  { id: 't3', plantId: '2', plantName: 'Pothos', type: 'observe', done: true, time: '12:00' },
  { id: 't4', plantId: '3', plantName: 'Ficus', type: 'observe', done: false, time: '12:00' },
];

// Runtime mutation helpers — mutate arrays in-place so all importers see updates immediately
export function addPlant(plant: Plant): void {
  PLANTS.push(plant);
}

export function addTasksForDay(day: number, tasks: Task[]): void {
  if (!TASKS_BY_DAY[day]) TASKS_BY_DAY[day] = [];
  TASKS_BY_DAY[day].push(...tasks);
}

export function logHistoryEvent(plantId: string, event: HistoryEvent): void {
  if (!HISTORY_EVENTS[plantId]) HISTORY_EVENTS[plantId] = [];
  HISTORY_EVENTS[plantId].unshift(event); // newest first
}

export function updatePlant(plantId: string, updates: Partial<Plant>): void {
  const p = PLANTS.find(pl => pl.id === plantId);
  if (p) Object.assign(p, updates);
}

export function removePlant(plantId: string): void {
  const idx = PLANTS.findIndex(p => p.id === plantId);
  if (idx >= 0) PLANTS.splice(idx, 1);
  Object.keys(TASKS_BY_DAY).forEach(key => {
    TASKS_BY_DAY[Number(key)] = TASKS_BY_DAY[Number(key)].filter(t => t.plantId !== plantId);
  });
  delete HISTORY_EVENTS[plantId];
}

// Pre-populated history for mock plants (most recent first)
const D = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

export const HISTORY_EVENTS: Record<string, HistoryEvent[]> = {
  '1': [
    { id: 'h1_1', type: 'task_done', label: 'Arrosage effectué',                    date: D(0),   icon: 'water',        color: '#4FC3F7' },
    { id: 'h1_2', type: 'task_done', label: 'Observation : feuilles jaunissantes',  date: D(3),   icon: 'eye',          color: '#81C784' },
    { id: 'h1_3', type: 'task_done', label: 'Arrosage effectué',                    date: D(7),   icon: 'water',        color: '#4FC3F7' },
    { id: 'h1_4', type: 'task_done', label: 'Fertilisation effectuée',              date: D(10),  icon: 'flask',        color: '#FFB74D' },
    { id: 'h1_5', type: 'task_done', label: 'Arrosage effectué',                    date: D(14),  icon: 'water',        color: '#4FC3F7' },
    { id: 'h1_6', type: 'added',     label: 'Plante ajoutée',                       date: D(60),  icon: 'leaf-outline', color: '#B5F15B' },
  ],
  '2': [
    { id: 'h2_1', type: 'task_done', label: 'Arrosage effectué',                         date: D(2),  icon: 'water',        color: '#4FC3F7' },
    { id: 'h2_2', type: 'task_done', label: 'Observation : plante en bonne santé',       date: D(5),  icon: 'eye',          color: '#81C784' },
    { id: 'h2_3', type: 'task_done', label: 'Arrosage effectué',                         date: D(7),  icon: 'water',        color: '#4FC3F7' },
    { id: 'h2_4', type: 'added',     label: 'Plante ajoutée',                            date: D(90), icon: 'leaf-outline', color: '#B5F15B' },
  ],
  '3': [
    { id: 'h3_1', type: 'task_done', label: 'Arrosage effectué',   date: D(1),  icon: 'water',        color: '#4FC3F7' },
    { id: 'h3_2', type: 'task_done', label: 'Feuilles nettoyées',  date: D(4),  icon: 'sparkles',     color: '#B2DFDB' },
    { id: 'h3_3', type: 'added',     label: 'Plante ajoutée',      date: D(30), icon: 'leaf-outline', color: '#B5F15B' },
  ],
  '4': [
    { id: 'h4_1', type: 'task_done', label: 'Arrosage effectué',                               date: D(12),  icon: 'water',           color: '#4FC3F7' },
    { id: 'h4_2', type: 'task_done', label: 'Traitement effectué : cochenilles',               date: D(15),  icon: 'medkit',          color: '#EF9A9A' },
    { id: 'h4_3', type: 'analysis',  label: 'Analyse IA : Soins urgents · cochenilles',        date: D(20),  icon: 'sparkles-outline', color: '#9C27B0' },
    { id: 'h4_4', type: 'added',     label: 'Plante ajoutée',                                  date: D(120), icon: 'leaf-outline',     color: '#B5F15B' },
  ],
};

// Tasks indexed by day of week (0=Sun, 1=Mon, ..., 6=Sat)
export const TASKS_BY_DAY: Record<number, Task[]> = {
  0: [ // Dimanche
    { id: 'd0t1', plantId: '1', plantName: 'Monstera', type: 'water', done: false, time: '08:00' },
    { id: 'd0t2', plantId: '4', plantName: 'Cactus', type: 'water', done: false, time: '08:00' },
    { id: 'd0t3', plantId: '2', plantName: 'Pothos', type: 'observe', done: false, time: '12:00' },
    { id: 'd0t4', plantId: '3', plantName: 'Ficus', type: 'observe', done: false, time: '12:00' },
  ],
  1: [ // Lundi
    { id: 'd1t1', plantId: '2', plantName: 'Pothos', type: 'water', done: false, time: '09:00' },
    { id: 'd1t2', plantId: '3', plantName: 'Ficus', type: 'water', done: false, time: '09:00' },
  ],
  2: [ // Mardi
    { id: 'd2t1', plantId: '1', plantName: 'Monstera', type: 'observe', done: false, time: '10:00' },
    { id: 'd2t2', plantId: '4', plantName: 'Cactus', type: 'observe', done: false, time: '10:00' },
    { id: 'd2t3', plantId: '2', plantName: 'Pothos', type: 'observe', done: false, time: '14:00' },
  ],
  3: [ // Mercredi
    { id: 'd3t1', plantId: '1', plantName: 'Monstera', type: 'water', done: false, time: '08:00' },
    { id: 'd3t2', plantId: '2', plantName: 'Pothos', type: 'water', done: false, time: '08:00' },
    { id: 'd3t3', plantId: '3', plantName: 'Ficus', type: 'observe', done: false, time: '12:00' },
    { id: 'd3t4', plantId: '4', plantName: 'Cactus', type: 'water', done: false, time: '16:00' },
  ],
  4: [ // Jeudi
    { id: 'd4t1', plantId: '3', plantName: 'Ficus', type: 'water', done: false, time: '08:00' },
    { id: 'd4t2', plantId: '1', plantName: 'Monstera', type: 'observe', done: false, time: '11:00' },
  ],
  5: [ // Vendredi
    { id: 'd5t1', plantId: '4', plantName: 'Cactus', type: 'water', done: false, time: '09:00' },
    { id: 'd5t2', plantId: '2', plantName: 'Pothos', type: 'water', done: false, time: '09:00' },
    { id: 'd5t3', plantId: '1', plantName: 'Monstera', type: 'water', done: false, time: '09:00' },
    { id: 'd5t4', plantId: '3', plantName: 'Ficus', type: 'observe', done: false, time: '15:00' },
  ],
  6: [ // Samedi
    { id: 'd6t1', plantId: '2', plantName: 'Pothos', type: 'observe', done: false, time: '10:00' },
    { id: 'd6t2', plantId: '1', plantName: 'Monstera', type: 'observe', done: false, time: '10:00' },
  ],
};
