import { Task } from '@/types';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

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
        name: 'Spidey Flow Mission Reminders',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF1E38',
      });
    }

    return true;
  } catch (error) {
    console.warn('Failed to obtain notification permissions:', error);
    return false;
  }
}

export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  if (!task.reminder_enabled || !task.date) {
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Parse date and time
    const [year, month, day] = task.date.split('-').map(Number);
    let hour = 9;
    let minute = 0;

    if (task.time) {
      const [h, m] = task.time.split(':').map(Number);
      if (!isNaN(h)) hour = h;
      if (!isNaN(m)) minute = m;
    }

    const scheduledDate = new Date(year, month - 1, day, hour, minute, 0);

    // If scheduled in the past, do not schedule
    if (scheduledDate.getTime() <= Date.now()) {
      return null;
    }

    // Cancel any existing notification for this task
    await cancelTaskReminder(task.id);

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: `task_${task.id}`,
      content: {
        title: '⚡ SPIDEY FLOW — MISSION ALERT',
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
    console.warn('Failed to schedule reminder:', error);
    return null;
  }
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`task_${taskId}`);
  } catch {
    // Graceful fallback if not found
  }
}
