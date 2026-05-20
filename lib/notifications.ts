import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_ENABLED_KEY = '@florus_notif_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const TASK_LABEL: Record<string, string> = {
  water: '💧 Il est temps d\'arroser',
  fertilize: '🌱 Fertilisation',
  repot: '🪴 Rempotage prévu',
  treat: '🔬 Traitement à effectuer',
  observe: '👁 Observation de la plante',
  rotate: '🔄 Tourner la plante',
  clean_leaves: '🧹 Nettoyer les feuilles',
  mist: '💦 Brumisation',
  trim: '✂️ Taille',
};

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotifEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
  return val !== 'false';
}

export async function setNotifEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function scheduleTaskNotification(task: {
  id: string;
  plantName: string;
  type: string;
  dayOfWeek: number;
  time?: string | null;
  recurringDays?: number | null;
  daysFromNow?: number;
}): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(task.id).catch(() => {});

  const enabled = await getNotifEnabled();
  if (!enabled) return;

  const granted = await requestPermissions();
  if (!granted) return;

  const body = TASK_LABEL[task.type] ?? task.type;
  const [hour, minute] = task.time ? task.time.split(':').map(Number) : [9, 0];

  // Long-interval tasks (> 2 weeks): schedule just the next occurrence
  if (task.recurringDays && task.recurringDays > 14) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + (task.daysFromNow ?? 0));
    date.setHours(hour, minute, 0, 0);
    if (date > new Date()) {
      await Notifications.scheduleNotificationAsync({
        identifier: task.id,
        content: { title: task.plantName, body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
    }
    return;
  }

  // Weekly repeating trigger for tasks recurring ≤ 2 weeks
  // Expo CalendarTrigger weekday: 1=Sun, 2=Mon, ..., 7=Sat
  const weekday = ((task.dayOfWeek + 1) % 8 || 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  await Notifications.scheduleNotificationAsync({
    identifier: task.id,
    content: { title: task.plantName, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday,
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelTaskNotifications(taskIds: string[]): Promise<void> {
  await Promise.all(
    taskIds.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAllTasks(
  tasks: Array<{
    id: string;
    plantName: string;
    type: string;
    dayOfWeek: number;
    time?: string | null;
    recurringDays?: number | null;
  }>
): Promise<void> {
  await Promise.all(tasks.map(t => scheduleTaskNotification(t)));
}
