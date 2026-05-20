import { supabase } from '../supabase';
import { HistoryEvent } from '@/constants/data';

function toHistoryEvent(row: Record<string, unknown>): HistoryEvent {
  return {
    id: row.id as string,
    type: row.type as HistoryEvent['type'],
    label: row.label as string,
    date: row.date as string,
    icon: row.icon as string,
    color: row.color as string,
  };
}

export async function fetchHistory(userId: string, plantId: string): Promise<HistoryEvent[]> {
  const { data, error } = await supabase
    .from('history_events')
    .select('*')
    .eq('user_id', userId)
    .eq('plant_id', plantId)
    .order('date', { ascending: false });
  if (error) { console.warn('[Florus] fetchHistory:', error.message); return []; }
  return (data ?? []).map(toHistoryEvent);
}

export async function insertHistoryEvent(
  userId: string,
  plantId: string,
  event: Omit<HistoryEvent, 'id'>
): Promise<void> {
  const { error } = await supabase.from('history_events').insert({
    user_id: userId,
    plant_id: plantId,
    type: event.type,
    label: event.label,
    date: event.date,
    icon: event.icon,
    color: event.color,
  });
  if (error) console.warn('[Florus] insertHistoryEvent:', error.message);
}
