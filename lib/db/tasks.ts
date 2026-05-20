import { supabase } from '../supabase';
import { Task } from '@/constants/data';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr + 'T00:00:00');
  const to = new Date(toDateStr + 'T00:00:00');
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function toTask(row: Record<string, unknown>, dateStr: string): Task | null {
  const recurring = row.recurring as boolean;
  const recurringDays = row.recurring_days as number | null;
  const lastDoneDate = row.last_done_date as string | null;

  if (lastDoneDate && lastDoneDate !== dateStr) {
    // One-time tasks (treat, observe) disappear permanently after being done once
    if (!recurring) return null;

    // Recurring tasks with intervals ≥ 7 days only show once the interval has elapsed.
    // This prevents e.g. a yearly repot from appearing every week, or a monthly
    // fertilize from appearing every week.
    if (recurringDays && recurringDays >= 7) {
      if (daysBetween(lastDoneDate, dateStr) < recurringDays) return null;
    }
  }

  return {
    id: row.id as string,
    plantId: row.plant_id as string,
    plantName: row.plant_name as string,
    type: row.type as Task['type'],
    done: lastDoneDate === dateStr,
    time: (row.time as string | null) ?? undefined,
  };
}

export async function fetchTasksByDay(userId: string, dayOfWeek: number, dateStr: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .order('created_at', { ascending: true });
  if (error) { console.warn('[Florus] fetchTasksByDay:', error.message); return []; }
  return (data ?? []).map(row => toTask(row, dateStr)).filter((t): t is Task => t !== null);
}

export async function toggleTask(taskId: string, userId: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ last_done_date: done ? todayStr() : null })
    .eq('id', taskId)
    .eq('user_id', userId);
  if (error) console.warn('[Florus] toggleTask:', error.message);
}

export async function insertTasks(
  userId: string,
  tasks: Array<{
    plantId: string;
    plantName: string;
    type: Task['type'];
    dayOfWeek: number;
    time?: string;
    recurring?: boolean;
    recurringDays?: number;
    initialLastDoneDate?: string;
  }>
): Promise<void> {
  const rows = tasks.map(t => ({
    user_id: userId,
    plant_id: t.plantId,
    plant_name: t.plantName,
    type: t.type,
    day_of_week: t.dayOfWeek,
    time: t.time ?? null,
    recurring: t.recurring ?? false,
    recurring_days: t.recurringDays ?? null,
    last_done_date: t.initialLastDoneDate ?? null,
  }));
  const { error } = await supabase.from('tasks').insert(rows);
  if (error) console.warn('[Florus] insertTasks:', error.message);
}

export async function fetchTaskDays(userId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('tasks')
    .select('day_of_week')
    .eq('user_id', userId);
  if (error) { console.warn('[Florus] fetchTaskDays:', error.message); return new Set(); }
  return new Set((data ?? []).map((r: Record<string, unknown>) => r.day_of_week as number));
}

export async function deletePlantTasks(userId: string, plantId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .eq('plant_id', plantId);
  if (error) console.warn('[Florus] deletePlantTasks:', error.message);
}
