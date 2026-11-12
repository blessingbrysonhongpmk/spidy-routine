import { DayOfWeek, Routine, Task } from '@/types';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import {
  parseLocalDate,
  parseReminderOffsetMinutes,
  parseTimeToHoursMinutes,
} from './dateUtils';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('spideyflow-reminders', {
        name: 'Spidey Flow Reminders',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EF4444',
      });
    }

    return true;
  } catch (error) {
    console.warn('Failed to obtain notification permissions:', error);
    return false;
  }
}

export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  if (Platform.OS === 'web' || !task.reminder_enabled || !task.date) {
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const baseDate = parseLocalDate(task.date);
    const parsedTime = parseTimeToHoursMinutes(task.time);
    const hour = parsedTime ? parsedTime.hours : 9;
    const minute = parsedTime ? parsedTime.minutes : 0;

    const scheduledDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hour,
      minute,
      0
    );

    const offsetMins = parseReminderOffsetMinutes(task.reminder_time);
    if (offsetMins > 0) {
      scheduledDate.setMinutes(scheduledDate.getMinutes() - offsetMins);
    }

    // If scheduled in the past, do not schedule
    if (scheduledDate.getTime() <= Date.now()) {
      return null;
    }

    // Cancel any existing notification for this task
    await cancelTaskReminder(task.id);

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: `task_${task.id}`,
      content: {
        title: 'Spidy Flow — Task Reminder',
        body: task.title + (task.description ? ` • ${task.description}` : ''),
        data: { taskId: task.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
        channelId: Platform.OS === 'android' ? 'spideyflow-reminders' : undefined,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule task reminder:', error);
    return null;
  }
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`task_${taskId}`);
  } catch {
    // Graceful fallback if not found
  }
}

const WEEKDAY_NUMBER_MAP: Record<DayOfWeek, number> = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

export async function scheduleRoutineReminder(routine: Routine): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelRoutineReminder(routine.id);

  if (!routine.reminder_enabled || !routine.is_active || !routine.repeat_days?.length) {
    return;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const firstTime = routine.start_time || routine.items?.[0]?.scheduled_time || '07:00 AM';
    const parsed = parseTimeToHoursMinutes(firstTime) || { hours: 7, minutes: 0 };
    const offsetMins = parseReminderOffsetMinutes(routine.reminder_time);

    let totalMins = parsed.hours * 60 + parsed.minutes - offsetMins;
    let dayShift = 0;
    if (totalMins < 0) {
      totalMins += 24 * 60;
      dayShift = -1;
    }
    const triggerHour = Math.floor(totalMins / 60) % 24;
    const triggerMinute = totalMins % 60;

    for (const dayStr of routine.repeat_days) {
      const baseWeekday = WEEKDAY_NUMBER_MAP[dayStr as DayOfWeek];
      if (!baseWeekday) continue;
      // Adjust weekday 1..7 if subtracting reminder offset crossed midnight
      const adjustedWeekday = ((baseWeekday - 1 + dayShift + 7) % 7) + 1;

      await Notifications.scheduleNotificationAsync({
        identifier: `routine_${routine.id}_${dayStr}`,
        content: {
          title: `Routine: ${routine.name}`,
          body: `Scheduled for ${firstTime}${routine.items?.length ? ` • ${routine.items.length} activities` : ''}`,
          data: { routineId: routine.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: adjustedWeekday,
          hour: triggerHour,
          minute: triggerMinute,
          channelId: Platform.OS === 'android' ? 'spideyflow-reminders' : undefined,
        },
      });
    }
  } catch (error) {
    console.warn('Failed to schedule routine reminder:', error);
  }
}

export async function cancelRoutineReminder(routineId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const day of days) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`routine_${routineId}_${day}`);
    } catch {
      // Ignore if absent
    }
  }
}
