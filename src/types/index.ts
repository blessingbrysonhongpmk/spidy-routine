export type RoutineCategory = 'morning' | 'afternoon' | 'evening' | 'night';

export type TaskPriority = 'high' | 'medium' | 'low';

export type RoutineActivityStatus = 'pending' | 'completed' | 'skipped';

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD (local timezone)
  time?: string; // HH:mm or "7:00 PM"
  priority?: TaskPriority; // 'high' | 'medium' | 'low'
  category?: string;
  completed: boolean;
  reminder_enabled: boolean;
  reminder_time?: string; // e.g. "10 min before", "At due time"
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  name: string;
  icon?: string; // Ionicons icon name e.g. 'barbell-outline'
  category: RoutineCategory;
  repeat_days: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  start_time?: string; // e.g. "6:00 AM"
  end_time?: string; // e.g. "6:45 AM"
  reminder_enabled?: boolean;
  reminder_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  items?: RoutineItem[];
}

export interface RoutineItem {
  id: string;
  routine_id: string;
  title: string;
  duration?: string; // e.g. "10 min"
  scheduled_time?: string; // e.g. "06:00 AM"
  sort_order: number;
  is_active: boolean;
  category?: RoutineCategory;
  // Computed for selected date
  completed?: boolean;
  skipped?: boolean;
  status?: RoutineActivityStatus;
}

export interface RoutineDraftItem {
  id?: string;
  title: string;
  duration?: string;
  scheduled_time?: string;
}

export interface RoutineCompletion {
  id: string;
  routine_item_id: string;
  completed_date: string; // YYYY-MM-DD (local timezone)
  completed_at: string;
  status?: 'completed' | 'skipped';
}

export interface UserProfile {
  uid: string;
  name: string; // Full Name
  email: string;
  callsign?: string; // Display Name / Codename
  heroArchetype?: 'spiderman' | 'thor' | 'venom' | 'custom';
  bio?: string; // Personal introduction
  dob?: string; // Optional Date of Birth
  wakeTime?: string; // Preferred wake-up time (e.g. "06:00 AM")
  dailyTarget?: number; // Target missions per day
  motto?: string; // Tactical motto
  photoURL?: string;
  avatarType?: 'spiderman' | 'thor' | 'venom' | 'custom';
  themePreference?: 'spiderman' | 'thor' | 'venom' | 'dark' | 'light' | 'system';
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  isGuest: boolean;
}

export interface SoundConfig {
  soundEnabled: boolean;
  masterVolume: number; // 0.0 to 1.0
  notificationSoundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
