export type RoutineCategory = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (e.g. "14:30")
  completed: boolean;
  reminder_enabled: boolean;
  reminder_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  name: string;
  category: RoutineCategory;
  repeat_days: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  is_active: boolean;
  created_at: string;
  items?: RoutineItem[];
}

export interface RoutineItem {
  id: string;
  routine_id: string;
  title: string;
  scheduled_time?: string; // e.g. "05:00 AM"
  sort_order: number;
  is_active: boolean;
  category?: RoutineCategory;
  // Computed for selected date
  completed?: boolean;
}

export interface RoutineCompletion {
  id: string;
  routine_item_id: string;
  completed_date: string; // YYYY-MM-DD
  completed_at: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  isGuest: boolean;
}

export interface SoundConfig {
  soundEnabled: boolean;
  masterVolume: number; // 0.0 to 1.0
  notificationSoundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
