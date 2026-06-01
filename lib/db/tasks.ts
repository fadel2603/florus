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
  const specificDate = row.specific_date as string | null;
  const lastDoneDate = row.last_done_date as string | null;

  // ── Specific-date one-time task (chat suggestions) ──
  if (specificDate) {
    if (lastDoneDate) return null;          // already done → disappear
    if (dateStr < specificDate) return null; // not yet due
    // Due today or overdue — show until done
    return {
      id: row.id as string,
      plantId: row.plant_id as string,
      plantName: row.plant_name as string,
      type: row.type as Task['type'],
      done: false,
      time: (row.time as string | null) ?? undefined,
    };
  }

  // ── Recurring / day-of-week task ──
  const recurring    = row.recurring as boolean;
  const recurringDays = row.recurring_days as number | null;

  if (lastDoneDate && lastDoneDate !== dateStr) {
    if (!recurring) return null;
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
  // Two separate queries:
  // 1. Recurring/day-of-week tasks for this day of week (no specific_date)
  // 2. Specific-date one-time tasks due today or overdue (not yet done)
  const [recurringRes, specificRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .is('specific_date', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .not('specific_date', 'is', null)
      .is('last_done_date', null)
      .lte('specific_date', dateStr)
      .order('created_at', { ascending: true }),
  ]);

  if (recurringRes.error) console.warn('[Florus] fetchTasksByDay recurring:', recurringRes.error.message);
  if (specificRes.error)  console.warn('[Florus] fetchTasksByDay specific:',  specificRes.error.message);

  const allRows = [...(recurringRes.data ?? []), ...(specificRes.data ?? [])];
  return allRows.map(row => toTask(row, dateStr)).filter((t): t is Task => t !== null);
}

export async function toggleTask(taskId: string, userId: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ last_done_date: done ? todayStr() : null })
    .eq('id', taskId)
    .eq('user_id', userId);
  if (error) console.warn('[Florus] toggleTask:', error.message);
}

export type InsertedTask = {
  id: string;
  plantName: string;
  type: Task['type'];
  dayOfWeek: number;
  time: string | null;
  recurringDays: number | null;
};

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
    daysFromNow?: number;
    specificDate?: string; // one-time task on an exact date (overrides day_of_week logic)
  }>
): Promise<InsertedTask[]> {
  const rows = tasks.map(t => ({
    user_id: userId,
    plant_id: t.plantId,
    plant_name: t.plantName,
    type: t.type,
    day_of_week: t.dayOfWeek,
    specific_date: t.specificDate ?? null,
    time: t.time ?? null,
    recurring: t.specificDate ? false : (t.recurring ?? false),
    recurring_days: t.specificDate ? null : (t.recurringDays ?? null),
    last_done_date: t.specificDate ? null : (t.initialLastDoneDate ?? null),
  }));
  const { data, error } = await supabase.from('tasks').insert(rows).select('id, plant_name, type, day_of_week, time, recurring_days');
  if (error) { console.warn('[Florus] insertTasks:', error.message); return []; }
  return (data ?? []).map((r: Record<string, unknown>, i) => ({
    id: r.id as string,
    plantName: r.plant_name as string,
    type: r.type as Task['type'],
    dayOfWeek: r.day_of_week as number,
    time: r.time as string | null,
    recurringDays: r.recurring_days as number | null,
    daysFromNow: tasks[i]?.daysFromNow,
  }));
}

export async function fetchAllUserTasks(userId: string): Promise<InsertedTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, plant_name, type, day_of_week, time, recurring_days')
    .eq('user_id', userId);
  if (error) { console.warn('[Florus] fetchAllUserTasks:', error.message); return []; }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    plantName: r.plant_name as string,
    type: r.type as Task['type'],
    dayOfWeek: r.day_of_week as number,
    time: r.time as string | null,
    recurringDays: r.recurring_days as number | null,
  }));
}

export async function fetchTaskDays(userId: string): Promise<Set<string>> {
  const [recurringRes, specificRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('day_of_week, recurring, recurring_days, last_done_date')
      .eq('user_id', userId)
      .is('specific_date', null),
    supabase
      .from('tasks')
      .select('specific_date')
      .eq('user_id', userId)
      .not('specific_date', 'is', null)
      .is('last_done_date', null),
  ]);

  if (recurringRes.error) console.warn('[Florus] fetchTaskDays recurring:', recurringRes.error.message);
  if (specificRes.error)  console.warn('[Florus] fetchTaskDays specific:',  specificRes.error.message);

  const result = new Set<string>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Recurring tasks — compute actual due dates across the calendar range
  const START = -12 * 7;
  const END   =  52 * 7;

  for (const row of recurringRes.data ?? []) {
    const dow          = row.day_of_week as number;
    const recurring    = row.recurring as boolean;
    const recurringDays = row.recurring_days as number | null;
    const lastDoneDate = row.last_done_date as string | null;

    for (let offset = START; offset <= END; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      if (d.getDay() !== dow) continue;

      const dateStr = d.toISOString().slice(0, 10);
      let due = true;

      if (lastDoneDate && lastDoneDate !== dateStr) {
        if (!recurring) {
          due = false;
        } else if (recurringDays && recurringDays >= 7) {
          if (daysBetween(lastDoneDate, dateStr) < recurringDays) due = false;
        }
      }

      if (due) result.add(dateStr);
    }
  }

  // Specific-date tasks — add their exact dates directly
  for (const row of specificRes.data ?? []) {
    const d = row.specific_date as string | null;
    if (d) result.add(d);
  }

  return result;
}

export async function deletePlantTasks(userId: string, plantId: string): Promise<string[]> {
  const { data } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('plant_id', plantId);
  const ids = (data ?? []).map((r: Record<string, unknown>) => r.id as string);
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .eq('plant_id', plantId);
  if (error) console.warn('[Florus] deletePlantTasks:', error.message);
  return ids;
}
