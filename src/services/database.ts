import {
  DayOfWeek,
  Routine,
  RoutineActivityStatus,
  RoutineCategory,
  RoutineDraftItem,
  RoutineItem,
  Task,
} from '@/types';
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { getDayOfWeekFromDate, getTodayDateString } from './dateUtils';

const isWeb = Platform.OS === 'web';

// Safe UUID generation across Web, Hermes, Android and Node
function generateUUID(): string {
  try {
    if (Crypto && typeof Crypto.randomUUID === 'function') {
      return Crypto.randomUUID();
    }
  } catch {
    // Ignore and fallback
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==========================================
// WEB STORAGE PERSISTENCE ADAPTER
// (Eliminates ReferenceError: SharedArrayBuffer
// on Web while maintaining 100% data persistence)
// ==========================================
const WEB_TASKS_KEY = 'spideyflow_tasks_v1';
const WEB_ROUTINES_KEY = 'spideyflow_routines_v1';
const WEB_ROUTINE_ITEMS_KEY = 'spideyflow_routine_items_v1';
const WEB_COMPLETIONS_KEY = 'spideyflow_completions_v1';
const WEB_SETTINGS_KEY = 'spideyflow_settings_v1';

function getWebStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function setWebStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[SpidyFlow Web] Could not persist to ${key}:`, err);
  }
}

function initWebStorage(): void {
  const currentSettings = getWebStorage<Record<string, string>>(WEB_SETTINGS_KEY, {});
  const defaults: Record<string, string> = {
    sound_enabled: 'true',
    master_volume: '0.8',
    haptics_enabled: 'true',
    theme_mode: 'dark',
    intro_enabled: 'true',
    intro_sound_enabled: 'true',
    intro_has_launched: 'false',
    reduced_motion: 'false',
  };
  let modified = false;
  for (const [k, v] of Object.entries(defaults)) {
    if (currentSettings[k] === undefined) {
      currentSettings[k] = v;
      modified = true;
    }
  }
  if (modified) {
    setWebStorage(WEB_SETTINGS_KEY, currentSettings);
  }
}

// ==========================================
// NATIVE SQLITE PERSISTENCE
// ==========================================
let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<void> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (isWeb) return null;
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('spidyflow.db');
  }
  return dbInstance;
}

export function initDatabase(): Promise<void> {
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    if (isWeb) {
      initWebStorage();
      return;
    }

    const db = await getDatabase();
    if (!db) return;

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT,
        priority TEXT DEFAULT 'medium',
        completed INTEGER NOT NULL DEFAULT 0,
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        reminder_time TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);

      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        repeat_days TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS routine_items (
        id TEXT PRIMARY KEY,
        routine_id TEXT NOT NULL,
        title TEXT NOT NULL,
        scheduled_time TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_routine_items_routine ON routine_items(routine_id);

      CREATE TABLE IF NOT EXISTS routine_completions (
        id TEXT PRIMARY KEY,
        routine_item_id TEXT NOT NULL,
        completed_date TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        UNIQUE(routine_item_id, completed_date),
        FOREIGN KEY (routine_item_id) REFERENCES routine_items(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_routine_completions_date ON routine_completions(completed_date, routine_item_id);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Ensure default system settings exist (without mocking user data or dummy tasks)
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('sound_enabled', 'true')`);
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('master_volume', '0.8')`);
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('haptics_enabled', 'true')`);
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme_mode', 'dark')`);
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('intro_enabled', 'true')`);
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('intro_sound_enabled', 'true')`);
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('intro_has_launched', 'false')`);
    await db.runAsync(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('reduced_motion', 'false')`);

    // Safe migrations for existing installations (preserves all user data)
    const migrations = [
      `ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';`,
      `ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'General';`,
      `ALTER TABLE routines ADD COLUMN icon TEXT DEFAULT 'flash-outline';`,
      `ALTER TABLE routines ADD COLUMN start_time TEXT DEFAULT '';`,
      `ALTER TABLE routines ADD COLUMN end_time TEXT DEFAULT '';`,
      `ALTER TABLE routines ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE routines ADD COLUMN reminder_time TEXT DEFAULT '';`,
      `ALTER TABLE routines ADD COLUMN updated_at TEXT;`,
      `ALTER TABLE routine_items ADD COLUMN duration TEXT DEFAULT '';`,
      `ALTER TABLE routine_completions ADD COLUMN status TEXT DEFAULT 'completed';`,
    ];

    for (const sql of migrations) {
      try {
        await db.execAsync(sql);
      } catch {
        // Column already exists
      }
    }
  })();

  return dbInitPromise;
}

async function ensureInitialized(): Promise<void> {
  if (!dbInitPromise) {
    await initDatabase();
  } else {
    await dbInitPromise;
  }
}

/**
 * Seed optional structured starter routines with nested sub-activities on demand.
 */
export async function seedHeroStarterProtocols(): Promise<void> {
  await ensureInitialized();
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  await createRoutine(
    'Workout',
    'morning',
    weekdays,
    [
      { title: 'Warm-up', scheduled_time: '6:00 AM', duration: '5 min' },
      { title: 'Running', scheduled_time: '6:05 AM', duration: '20 min' },
      { title: 'Strength exercises', scheduled_time: '6:25 AM', duration: '15 min' },
      { title: 'Stretching', scheduled_time: '6:40 AM', duration: '5 min' },
      { title: 'Cool-down', scheduled_time: '6:45 AM', duration: '5 min' },
    ],
    {
      icon: 'barbell-outline',
      startTime: '6:00 AM',
      endTime: '6:50 AM',
    }
  );

  await createRoutine(
    'Bible Reading',
    'morning',
    allDays,
    [
      { title: 'Morning reading', scheduled_time: '7:15 AM', duration: '10 min' },
      { title: 'Evening reading', scheduled_time: '8:30 PM', duration: '10 min' },
    ],
    {
      icon: 'book-outline',
      startTime: '7:15 AM',
      endTime: '7:35 AM',
    }
  );

  await createRoutine(
    'Study Time',
    'afternoon',
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    [
      { title: 'Deep Study Session', scheduled_time: '2:00 PM', duration: '45 min' },
      { title: 'Quick Review & Notes', scheduled_time: '2:45 PM', duration: '15 min' },
    ],
    {
      icon: 'school-outline',
      startTime: '2:00 PM',
      endTime: '3:00 PM',
    }
  );
}

// ==========================================
// TASK CRUD
// ==========================================

export async function getTasksForDate(date: string): Promise<Task[]> {
  await ensureInitialized();

  if (isWeb) {
    const all = getWebStorage<Task[]>(WEB_TASKS_KEY, []);
    return all
      .filter((t) => t.date === date)
      .map((t) => ({
        ...t,
        category: t.category || 'General',
        priority: t.priority || 'medium',
      }))
      .sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return a.created_at.localeCompare(b.created_at);
      });
  }

  const db = (await getDatabase())!;
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM tasks WHERE date = ? ORDER BY time ASC, created_at ASC',
    [date]
  );
  return rows.map((r) => ({
    ...r,
    priority: r.priority || 'medium',
    category: r.category || 'General',
    completed: r.completed === 1,
    reminder_enabled: r.reminder_enabled === 1,
  }));
}

export async function getAllTasks(): Promise<Task[]> {
  await ensureInitialized();

  if (isWeb) {
    const all = getWebStorage<Task[]>(WEB_TASKS_KEY, []);
    return all
      .map((t) => ({
        ...t,
        category: t.category || 'General',
        priority: t.priority || 'medium',
      }))
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      });
  }

  const db = (await getDatabase())!;
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM tasks ORDER BY date DESC, time ASC'
  );
  return rows.map((r) => ({
    ...r,
    priority: r.priority || 'medium',
    category: r.category || 'General',
    completed: r.completed === 1,
    reminder_enabled: r.reminder_enabled === 1,
  }));
}

export async function createTask(
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'>
): Promise<Task> {
  await ensureInitialized();
  const id = generateUUID();
  const now = new Date().toISOString();

  const newTask: Task = {
    id,
    title: task.title,
    description: task.description || '',
    date: task.date,
    time: task.time || '',
    priority: task.priority || 'medium',
    category: task.category || 'General',
    completed: !!task.completed,
    reminder_enabled: !!task.reminder_enabled,
    reminder_time: task.reminder_time || '',
    created_at: now,
    updated_at: now,
  };

  if (isWeb) {
    const all = getWebStorage<Task[]>(WEB_TASKS_KEY, []);
    all.push(newTask);
    setWebStorage(WEB_TASKS_KEY, all);
    return newTask;
  }

  const db = (await getDatabase())!;
  await db.runAsync(
    `INSERT INTO tasks (id, title, description, date, time, priority, category, completed, reminder_enabled, reminder_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      newTask.title,
      newTask.description || '',
      newTask.date,
      newTask.time || '',
      newTask.priority || 'medium',
      newTask.category || 'General',
      newTask.completed ? 1 : 0,
      newTask.reminder_enabled ? 1 : 0,
      newTask.reminder_time || '',
      now,
      now,
    ]
  );

  return newTask;
}

export async function updateTask(task: Task): Promise<void> {
  await ensureInitialized();
  const now = new Date().toISOString();

  if (isWeb) {
    const all = getWebStorage<Task[]>(WEB_TASKS_KEY, []);
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      all[idx] = {
        ...task,
        priority: task.priority || 'medium',
        category: task.category || 'General',
        updated_at: now,
      };
      setWebStorage(WEB_TASKS_KEY, all);
    }
    return;
  }

  const db = (await getDatabase())!;
  await db.runAsync(
    `UPDATE tasks
     SET title = ?, description = ?, date = ?, time = ?, priority = ?, category = ?, completed = ?, reminder_enabled = ?, reminder_time = ?, updated_at = ?
     WHERE id = ?`,
    [
      task.title,
      task.description || '',
      task.date,
      task.time || '',
      task.priority || 'medium',
      task.category || 'General',
      task.completed ? 1 : 0,
      task.reminder_enabled ? 1 : 0,
      task.reminder_time || '',
      now,
      task.id,
    ]
  );
}

export async function deleteTask(id: string): Promise<void> {
  await ensureInitialized();

  if (isWeb) {
    const all = getWebStorage<Task[]>(WEB_TASKS_KEY, []);
    setWebStorage(
      WEB_TASKS_KEY,
      all.filter((t) => t.id !== id)
    );
    return;
  }

  const db = (await getDatabase())!;
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function toggleTaskComplete(id: string, completed: boolean): Promise<void> {
  await ensureInitialized();
  const now = new Date().toISOString();

  if (isWeb) {
    const all = getWebStorage<Task[]>(WEB_TASKS_KEY, []);
    const target = all.find((t) => t.id === id);
    if (target) {
      target.completed = completed;
      target.updated_at = now;
      setWebStorage(WEB_TASKS_KEY, all);
    }
    return;
  }

  const db = (await getDatabase())!;
  await db.runAsync(
    'UPDATE tasks SET completed = ?, updated_at = ? WHERE id = ?',
    [completed ? 1 : 0, now, id]
  );
}

// ==========================================
// ROUTINE & ITEMS
// ==========================================

export interface RoutineOptions {
  icon?: string;
  startTime?: string;
  endTime?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
}

function parseRepeatDays(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
  }
  return [];
}

function isRoutineScheduledForWeekday(repeatDays: string[], weekday: DayOfWeek): boolean {
  if (!repeatDays || repeatDays.length === 0) return true;
  return repeatDays.includes(weekday);
}

export async function getRoutinesWithItems(date: string): Promise<{
  routines: (Routine & { items: RoutineItem[] })[];
  itemsByCategory: Record<RoutineCategory, RoutineItem[]>;
}> {
  await ensureInitialized();

  const weekday = getDayOfWeekFromDate(date);
  const itemsByCategory: Record<RoutineCategory, RoutineItem[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  };

  if (isWeb) {
    const rawRoutines = getWebStorage<any[]>(WEB_ROUTINES_KEY, []);
    const rawItems = getWebStorage<any[]>(WEB_ROUTINE_ITEMS_KEY, []);
    const completions = getWebStorage<any[]>(WEB_COMPLETIONS_KEY, []);

    const completionStatusMap = new Map<string, 'completed' | 'skipped'>();
    for (const c of completions) {
      if (c.completed_date === date) {
        completionStatusMap.set(
          c.routine_item_id,
          c.status === 'skipped' ? 'skipped' : 'completed'
        );
      }
    }

    const activeRoutines = rawRoutines.filter(
      (r) => r.is_active !== false && r.is_active !== 0
    );
    const routinesMap = new Map<string, any>(activeRoutines.map((r) => [r.id, r]));

    const activeItems = rawItems
      .filter(
        (item) =>
          item.is_active !== false &&
          item.is_active !== 0 &&
          routinesMap.has(item.routine_id)
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const itemsByRoutine = new Map<string, RoutineItem[]>();

    for (const item of activeItems) {
      const routine = routinesMap.get(item.routine_id);
      const repeatDays = parseRepeatDays(routine?.repeat_days);
      const cat = (routine?.category || 'morning') as RoutineCategory;
      const compStatus = completionStatusMap.get(item.id);
      const status: RoutineActivityStatus = compStatus || 'pending';

      const mapped: RoutineItem = {
        id: item.id,
        routine_id: item.routine_id,
        title: item.title,
        duration: item.duration || '',
        scheduled_time: item.scheduled_time || '',
        sort_order: item.sort_order ?? 0,
        is_active: true,
        category: cat,
        completed: status === 'completed',
        skipped: status === 'skipped',
        status,
      };

      const existingList = itemsByRoutine.get(item.routine_id) || [];
      existingList.push(mapped);
      itemsByRoutine.set(item.routine_id, existingList);

      if (isRoutineScheduledForWeekday(repeatDays, weekday) && itemsByCategory[cat]) {
        itemsByCategory[cat].push(mapped);
      }
    }

    const routines: (Routine & { items: RoutineItem[] })[] = activeRoutines.map((r) => {
      const repeatDays = parseRepeatDays(r.repeat_days);
      return {
        ...r,
        icon: r.icon || 'flash-outline',
        category: (r.category || 'morning') as RoutineCategory,
        start_time: r.start_time || '',
        end_time: r.end_time || '',
        reminder_enabled: Boolean(r.reminder_enabled),
        reminder_time: r.reminder_time || '',
        is_active: true,
        repeat_days: repeatDays,
        items: itemsByRoutine.get(r.id) || [],
      };
    });

    return { routines, itemsByCategory };
  }

  const db = (await getDatabase())!;
  const routinesRaw = await db.getAllAsync<any>(
    'SELECT * FROM routines WHERE is_active = 1 ORDER BY start_time ASC, created_at ASC'
  );

  const itemsRaw = await db.getAllAsync<any>(
    `SELECT ri.*, r.category, r.repeat_days,
      rc.status as completion_status,
      CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END as has_record
     FROM routine_items ri
     JOIN routines r ON ri.routine_id = r.id
     LEFT JOIN routine_completions rc
       ON ri.id = rc.routine_item_id AND rc.completed_date = ?
     WHERE ri.is_active = 1 AND r.is_active = 1
     ORDER BY ri.sort_order ASC, ri.scheduled_time ASC`,
    [date]
  );

  const itemsByRoutine = new Map<string, RoutineItem[]>();

  for (const item of itemsRaw) {
    const repeatDays = parseRepeatDays(item.repeat_days);
    const cat = (item.category || 'morning') as RoutineCategory;
    let status: RoutineActivityStatus = 'pending';
    if (item.has_record === 1) {
      status = item.completion_status === 'skipped' ? 'skipped' : 'completed';
    }

    const mapped: RoutineItem = {
      id: item.id,
      routine_id: item.routine_id,
      title: item.title,
      duration: item.duration || '',
      scheduled_time: item.scheduled_time || '',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active === 1,
      category: cat,
      completed: status === 'completed',
      skipped: status === 'skipped',
      status,
    };

    const existingList = itemsByRoutine.get(item.routine_id) || [];
    existingList.push(mapped);
    itemsByRoutine.set(item.routine_id, existingList);

    if (isRoutineScheduledForWeekday(repeatDays, weekday) && itemsByCategory[cat]) {
      itemsByCategory[cat].push(mapped);
    }
  }

  const routines: (Routine & { items: RoutineItem[] })[] = routinesRaw.map((r) => {
    const repeatDays = parseRepeatDays(r.repeat_days);
    return {
      ...r,
      icon: r.icon || 'flash-outline',
      category: (r.category || 'morning') as RoutineCategory,
      start_time: r.start_time || '',
      end_time: r.end_time || '',
      reminder_enabled: r.reminder_enabled === 1,
      reminder_time: r.reminder_time || '',
      is_active: r.is_active === 1,
      repeat_days: repeatDays,
      items: itemsByRoutine.get(r.id) || [],
    };
  });

  return { routines, itemsByCategory };
}

export async function createRoutine(
  name: string,
  category: RoutineCategory,
  repeatDays: string[],
  items: RoutineDraftItem[],
  options?: RoutineOptions
): Promise<string> {
  await ensureInitialized();
  const routineId = generateUUID();
  const now = new Date().toISOString();

  const effectiveItems: RoutineDraftItem[] =
    items && items.length > 0
      ? items
      : [{ title: name, scheduled_time: options?.startTime || '' }];

  const icon = options?.icon || 'flash-outline';
  const startTime = options?.startTime || '';
  const endTime = options?.endTime || '';
  const reminderEnabled = Boolean(options?.reminderEnabled);
  const reminderTime = options?.reminderTime || '';

  if (isWeb) {
    const routines = getWebStorage<any[]>(WEB_ROUTINES_KEY, []);
    routines.push({
      id: routineId,
      name,
      icon,
      category,
      repeat_days: JSON.stringify(repeatDays),
      start_time: startTime,
      end_time: endTime,
      reminder_enabled: reminderEnabled ? 1 : 0,
      reminder_time: reminderTime,
      is_active: 1,
      created_at: now,
      updated_at: now,
    });
    setWebStorage(WEB_ROUTINES_KEY, routines);

    const routineItems = getWebStorage<any[]>(WEB_ROUTINE_ITEMS_KEY, []);
    for (let i = 0; i < effectiveItems.length; i++) {
      routineItems.push({
        id: generateUUID(),
        routine_id: routineId,
        title: effectiveItems[i].title,
        duration: effectiveItems[i].duration || '',
        scheduled_time: effectiveItems[i].scheduled_time || '',
        sort_order: i,
        is_active: 1,
      });
    }
    setWebStorage(WEB_ROUTINE_ITEMS_KEY, routineItems);
    return routineId;
  }

  const db = (await getDatabase())!;
  await db.runAsync(
    `INSERT INTO routines (id, name, icon, category, repeat_days, start_time, end_time, reminder_enabled, reminder_time, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      routineId,
      name,
      icon,
      category,
      JSON.stringify(repeatDays),
      startTime,
      endTime,
      reminderEnabled ? 1 : 0,
      reminderTime,
      now,
      now,
    ]
  );

  for (let i = 0; i < effectiveItems.length; i++) {
    await db.runAsync(
      `INSERT INTO routine_items (id, routine_id, title, duration, scheduled_time, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        generateUUID(),
        routineId,
        effectiveItems[i].title,
        effectiveItems[i].duration || '',
        effectiveItems[i].scheduled_time || '',
        i,
      ]
    );
  }

  return routineId;
}

export async function updateRoutine(
  routineId: string,
  name: string,
  category: RoutineCategory,
  repeatDays: string[],
  items: RoutineDraftItem[],
  options?: RoutineOptions
): Promise<void> {
  await ensureInitialized();
  const now = new Date().toISOString();

  const effectiveItems: RoutineDraftItem[] =
    items && items.length > 0
      ? items
      : [{ title: name, scheduled_time: options?.startTime || '' }];

  if (isWeb) {
    const routines = getWebStorage<any[]>(WEB_ROUTINES_KEY, []);
    const rIdx = routines.findIndex((r) => r.id === routineId);
    if (rIdx !== -1) {
      routines[rIdx] = {
        ...routines[rIdx],
        name,
        category,
        repeat_days: JSON.stringify(repeatDays),
        icon: options?.icon ?? routines[rIdx].icon ?? 'flash-outline',
        start_time: options?.startTime ?? routines[rIdx].start_time ?? '',
        end_time: options?.endTime ?? routines[rIdx].end_time ?? '',
        reminder_enabled:
          options?.reminderEnabled !== undefined
            ? options.reminderEnabled
              ? 1
              : 0
            : routines[rIdx].reminder_enabled ?? 0,
        reminder_time: options?.reminderTime ?? routines[rIdx].reminder_time ?? '',
        updated_at: now,
      };
      setWebStorage(WEB_ROUTINES_KEY, routines);
    }

    const routineItems = getWebStorage<any[]>(WEB_ROUTINE_ITEMS_KEY, []);
    const incomingIds = new Set(effectiveItems.filter((i) => i.id).map((i) => i.id));

    // Preserve historical records by soft-deactivating removed items rather than deleting completions
    for (const existing of routineItems) {
      if (existing.routine_id === routineId && !incomingIds.has(existing.id)) {
        existing.is_active = 0;
      }
    }

    for (let i = 0; i < effectiveItems.length; i++) {
      const item = effectiveItems[i];
      if (item.id) {
        const match = routineItems.find(
          (ri) => ri.id === item.id && ri.routine_id === routineId
        );
        if (match) {
          match.title = item.title;
          match.duration = item.duration || '';
          match.scheduled_time = item.scheduled_time || '';
          match.sort_order = i;
          match.is_active = 1;
          continue;
        }
      }
      routineItems.push({
        id: item.id || generateUUID(),
        routine_id: routineId,
        title: item.title,
        duration: item.duration || '',
        scheduled_time: item.scheduled_time || '',
        sort_order: i,
        is_active: 1,
      });
    }
    setWebStorage(WEB_ROUTINE_ITEMS_KEY, routineItems);
    return;
  }

  const db = (await getDatabase())!;
  const existingRoutineRow = await db.getFirstAsync<any>(
    'SELECT * FROM routines WHERE id = ?',
    [routineId]
  );

  await db.runAsync(
    `UPDATE routines
     SET name = ?, icon = ?, category = ?, repeat_days = ?, start_time = ?, end_time = ?, reminder_enabled = ?, reminder_time = ?, updated_at = ?
     WHERE id = ?`,
    [
      name,
      options?.icon ?? existingRoutineRow?.icon ?? 'flash-outline',
      category,
      JSON.stringify(repeatDays),
      options?.startTime ?? existingRoutineRow?.start_time ?? '',
      options?.endTime ?? existingRoutineRow?.end_time ?? '',
      options?.reminderEnabled !== undefined
        ? options.reminderEnabled
          ? 1
          : 0
        : existingRoutineRow?.reminder_enabled ?? 0,
      options?.reminderTime ?? existingRoutineRow?.reminder_time ?? '',
      now,
      routineId,
    ]
  );

  // Soft-disable removed items so historical routine_completions are never wiped on edit
  await db.runAsync(
    'UPDATE routine_items SET is_active = 0 WHERE routine_id = ?',
    [routineId]
  );

  for (let i = 0; i < effectiveItems.length; i++) {
    const item = effectiveItems[i];
    if (item.id) {
      const res = await db.runAsync(
        `UPDATE routine_items
         SET title = ?, duration = ?, scheduled_time = ?, sort_order = ?, is_active = 1
         WHERE id = ? AND routine_id = ?`,
        [item.title, item.duration || '', item.scheduled_time || '', i, item.id, routineId]
      );
      if ((res?.changes ?? 0) > 0) {
        continue;
      }
    }

    await db.runAsync(
      `INSERT INTO routine_items (id, routine_id, title, duration, scheduled_time, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        item.id || generateUUID(),
        routineId,
        item.title,
        item.duration || '',
        item.scheduled_time || '',
        i,
      ]
    );
  }
}

export async function reorderRoutineItems(
  routineId: string,
  orderedItemIds: string[]
): Promise<void> {
  await ensureInitialized();

  if (isWeb) {
    const routineItems = getWebStorage<any[]>(WEB_ROUTINE_ITEMS_KEY, []);
    orderedItemIds.forEach((itemId, index) => {
      const found = routineItems.find(
        (ri) => ri.id === itemId && ri.routine_id === routineId
      );
      if (found) {
        found.sort_order = index;
      }
    });
    setWebStorage(WEB_ROUTINE_ITEMS_KEY, routineItems);
    return;
  }

  const db = (await getDatabase())!;
  for (let i = 0; i < orderedItemIds.length; i++) {
    await db.runAsync(
      'UPDATE routine_items SET sort_order = ? WHERE id = ? AND routine_id = ?',
      [i, orderedItemIds[i], routineId]
    );
  }
}

export async function duplicateRoutine(
  routineId: string,
  targetDays: DayOfWeek[],
  overrideName?: string
): Promise<string> {
  await ensureInitialized();
  const { routines } = await getRoutinesWithItems(getTodayDateString());
  const source = routines.find((r) => r.id === routineId);
  if (!source) {
    throw new Error('Source routine not found');
  }

  const draftItems: RoutineDraftItem[] = (source.items || []).map((item) => ({
    title: item.title,
    duration: item.duration,
    scheduled_time: item.scheduled_time,
  }));

  return createRoutine(
    overrideName || source.name,
    source.category,
    targetDays,
    draftItems,
    {
      icon: source.icon,
      startTime: source.start_time,
      endTime: source.end_time,
      reminderEnabled: source.reminder_enabled,
      reminderTime: source.reminder_time,
    }
  );
}

export async function copyDayRoutinesToDays(
  sourceDay: DayOfWeek,
  targetDays: DayOfWeek[]
): Promise<number> {
  await ensureInitialized();
  const { routines } = await getRoutinesWithItems(getTodayDateString());
  const sourceRoutines = routines.filter((r) => r.repeat_days.includes(sourceDay));
  if (sourceRoutines.length === 0 || targetDays.length === 0) return 0;

  let copiedCount = 0;
  // Create independent template clones per target day so each day remains independently editable
  for (const targetDay of targetDays) {
    if (targetDay === sourceDay) continue;
    for (const r of sourceRoutines) {
      const draftItems: RoutineDraftItem[] = (r.items || []).map((item) => ({
        title: item.title,
        duration: item.duration,
        scheduled_time: item.scheduled_time,
      }));
      await createRoutine(r.name, r.category, [targetDay], draftItems, {
        icon: r.icon,
        startTime: r.start_time,
        endTime: r.end_time,
        reminderEnabled: r.reminder_enabled,
        reminderTime: r.reminder_time,
      });
      copiedCount++;
    }
  }
  return copiedCount;
}

export async function deleteRoutine(routineId: string): Promise<void> {
  await ensureInitialized();

  if (isWeb) {
    const routines = getWebStorage<any[]>(WEB_ROUTINES_KEY, []);
    setWebStorage(
      WEB_ROUTINES_KEY,
      routines.filter((r) => r.id !== routineId)
    );

    const routineItems = getWebStorage<any[]>(WEB_ROUTINE_ITEMS_KEY, []);
    const oldItemIds = new Set(routineItems.filter((i) => i.routine_id === routineId).map((i) => i.id));
    setWebStorage(
      WEB_ROUTINE_ITEMS_KEY,
      routineItems.filter((i) => i.routine_id !== routineId)
    );

    const completions = getWebStorage<any[]>(WEB_COMPLETIONS_KEY, []);
    setWebStorage(
      WEB_COMPLETIONS_KEY,
      completions.filter((c) => !oldItemIds.has(c.routine_item_id))
    );
    return;
  }

  const db = (await getDatabase())!;
  await db.runAsync('DELETE FROM routine_completions WHERE routine_item_id IN (SELECT id FROM routine_items WHERE routine_id = ?)', [routineId]);
  await db.runAsync('DELETE FROM routine_items WHERE routine_id = ?', [routineId]);
  await db.runAsync('DELETE FROM routines WHERE id = ?', [routineId]);
}

export async function setRoutineItemStatus(
  routineItemId: string,
  date: string,
  status: RoutineActivityStatus
): Promise<void> {
  await ensureInitialized();

  if (isWeb) {
    let completions = getWebStorage<any[]>(WEB_COMPLETIONS_KEY, []);
    completions = completions.filter(
      (c) => !(c.routine_item_id === routineItemId && c.completed_date === date)
    );
    if (status === 'completed' || status === 'skipped') {
      completions.push({
        id: generateUUID(),
        routine_item_id: routineItemId,
        completed_date: date,
        completed_at: new Date().toISOString(),
        status,
      });
    }
    setWebStorage(WEB_COMPLETIONS_KEY, completions);
    return;
  }

  const db = (await getDatabase())!;
  if (status === 'completed' || status === 'skipped') {
    const id = generateUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO routine_completions (id, routine_item_id, completed_date, completed_at, status)
       VALUES (?, ?, ?, ?, ?)`,
      [id, routineItemId, date, now, status]
    );
  } else {
    await db.runAsync(
      'DELETE FROM routine_completions WHERE routine_item_id = ? AND completed_date = ?',
      [routineItemId, date]
    );
  }
}

export async function toggleRoutineItemCompletion(
  routineItemId: string,
  date: string,
  completed: boolean
): Promise<void> {
  await setRoutineItemStatus(routineItemId, date, completed ? 'completed' : 'pending');
}

export async function toggleParentRoutineComplete(
  routineId: string,
  date: string,
  completed: boolean
): Promise<void> {
  const { routines } = await getRoutinesWithItems(date);
  const target = routines.find((r) => r.id === routineId);
  if (!target || !target.items) return;

  for (const item of target.items) {
    await setRoutineItemStatus(item.id, date, completed ? 'completed' : 'pending');
  }
}

export async function getDailyProgress(date: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  totalRoutineItems: number;
  completedRoutineItems: number;
  percentage: number;
}> {
  await ensureInitialized();
  const weekday = getDayOfWeekFromDate(date);

  if (isWeb) {
    const tasks = getWebStorage<Task[]>(WEB_TASKS_KEY, []).filter((t) => t.date === date);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;

    const rawRoutines = getWebStorage<any[]>(WEB_ROUTINES_KEY, []);
    const activeScheduledRoutineIds = new Set(
      rawRoutines
        .filter((r) => {
          if (r.is_active === false || r.is_active === 0) return false;
          const days = parseRepeatDays(r.repeat_days);
          return isRoutineScheduledForWeekday(days, weekday);
        })
        .map((r) => r.id)
    );

    const rawItems = getWebStorage<any[]>(WEB_ROUTINE_ITEMS_KEY, []);
    const activeItems = rawItems.filter(
      (i) =>
        i.is_active !== false &&
        i.is_active !== 0 &&
        activeScheduledRoutineIds.has(i.routine_id)
    );
    const totalRoutineItems = activeItems.length;

    const completions = getWebStorage<any[]>(WEB_COMPLETIONS_KEY, []).filter(
      (c) => c.completed_date === date && c.status !== 'skipped'
    );
    const activeItemIds = new Set(activeItems.map((i) => i.id));
    const completedRoutineItems = completions.filter((c) => activeItemIds.has(c.routine_item_id)).length;

    const totalAll = totalTasks + totalRoutineItems;
    const completedAll = completedTasks + completedRoutineItems;
    const percentage = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      totalRoutineItems,
      completedRoutineItems,
      percentage,
    };
  }

  const db = (await getDatabase())!;

  const taskStats = await db.getFirstAsync<{ total: number; completed: number }>(
    `SELECT COUNT(*) as total,
            COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
     FROM tasks WHERE date = ?`,
    [date]
  );

  // Evaluate weekday filter cleanly in JS so repeat_days format variants stay 100% consistent
  const { routines } = await getRoutinesWithItems(date);
  const scheduledRoutines = routines.filter((r) =>
    isRoutineScheduledForWeekday(r.repeat_days, weekday)
  );
  const scheduledItems = scheduledRoutines.flatMap((r) => r.items || []);
  const totalRoutineItems = scheduledItems.length;
  const completedRoutineItems = scheduledItems.filter((i) => i.completed).length;

  const totalTasks = taskStats?.total || 0;
  const completedTasks = taskStats?.completed || 0;

  const totalAll = totalTasks + totalRoutineItems;
  const completedAll = completedTasks + completedRoutineItems;
  const percentage = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    totalRoutineItems,
    completedRoutineItems,
    percentage,
  };
}

// ==========================================
// APP SETTINGS & USER STATS
// ==========================================

export interface UserStats {
  streakDays: number;
  longestStreak: number;
  totalCompletedTasks: number;
  totalCompletedRoutines: number;
  totalCompletedAll: number;
  rankTitle: string;
  rankLevel: number;
  rankProgress: number; // 0 to 1
  nextRankTitle: string;
  activeDates: string[];
}

export interface RoutineCompletionRecord {
  id: string;
  routine_item_id: string;
  completed_date: string;
  routine_id?: string;
  routine_name?: string;
}

export async function getAllRoutineCompletions(): Promise<RoutineCompletionRecord[]> {
  await ensureInitialized();
  if (isWeb) {
    const completions = getWebStorage<any[]>(WEB_COMPLETIONS_KEY, []).filter(
      (c) => c.status !== 'skipped'
    );
    const items = getWebStorage<any[]>(WEB_ROUTINE_ITEMS_KEY, []);
    const routines = getWebStorage<any[]>(WEB_ROUTINES_KEY, []);
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const routineMap = new Map(routines.map((r) => [r.id, r]));

    return completions.map((c) => {
      const item = itemMap.get(c.routine_item_id);
      const routine = item ? routineMap.get(item.routine_id) : undefined;
      return {
        id: c.id,
        routine_item_id: c.routine_item_id,
        completed_date: c.completed_date,
        routine_id: routine?.id,
        routine_name: routine?.name,
      };
    });
  }

  const db = (await getDatabase())!;
  const rows = await db.getAllAsync<any>(`
    SELECT rc.id, rc.routine_item_id, rc.completed_date, ri.routine_id, r.name as routine_name
    FROM routine_completions rc
    JOIN routine_items ri ON rc.routine_item_id = ri.id
    JOIN routines r ON ri.routine_id = r.id
    WHERE COALESCE(rc.status, 'completed') != 'skipped'
    ORDER BY rc.completed_date DESC
  `);
  return rows || [];
}

export async function getUserStats(): Promise<UserStats> {
  await ensureInitialized();

  let totalCompletedTasks = 0;
  let totalCompletedRoutines = 0;
  const activeDates = new Set<string>();

  if (isWeb) {
    const tasks = getWebStorage<Task[]>(WEB_TASKS_KEY, []);
    tasks.forEach((t) => {
      if (t.completed) {
        totalCompletedTasks++;
        activeDates.add(t.date);
      }
    });

    const completions = getWebStorage<any[]>(WEB_COMPLETIONS_KEY, []).filter(
      (c) => c.status !== 'skipped'
    );
    totalCompletedRoutines = completions.length;
    completions.forEach((c) => activeDates.add(c.completed_date));
  } else {
    const db = (await getDatabase())!;

    const taskStats = await db.getFirstAsync<{ completed: number }>(
      `SELECT COUNT(*) as completed FROM tasks WHERE completed = 1`
    );

    const routineStats = await db.getFirstAsync<{ completed: number }>(
      `SELECT COUNT(*) as completed FROM routine_completions WHERE COALESCE(status, 'completed') != 'skipped'`
    );

    totalCompletedTasks = taskStats?.completed || 0;
    totalCompletedRoutines = routineStats?.completed || 0;

    const taskDates = await db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT date FROM tasks WHERE completed = 1`
    );
    const routineDates = await db.getAllAsync<{ completed_date: string }>(
      `SELECT DISTINCT completed_date FROM routine_completions WHERE COALESCE(status, 'completed') != 'skipped'`
    );

    taskDates.forEach((r) => activeDates.add(r.date));
    routineDates.forEach((r) => activeDates.add(r.completed_date));
  }

  const totalCompletedAll = totalCompletedTasks + totalCompletedRoutines;

  // Local-timezone streak and longest streak calculation
  const todayStr = getTodayDateString();
  const dateParts = todayStr.split('-').map(Number);
  const todayLocal = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  let streak = 0;
  let checkDate = new Date(todayLocal);
  if (!activeDates.has(todayStr)) {
    // If user hasn't completed anything today yet, check starting from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (activeDates.has(formatLocalDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate historical longest streak
  const sortedDates = Array.from(activeDates).sort();
  let maxStreak = 0;
  let currentChain = 0;
  let prevDate: Date | null = null;

  for (const dateItem of sortedDates) {
    const p = dateItem.split('-').map(Number);
    const curDate = new Date(p[0], p[1] - 1, p[2]);
    if (!prevDate) {
      currentChain = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentChain++;
      } else if (diffDays > 1) {
        currentChain = 1;
      }
    }
    prevDate = curDate;
    if (currentChain > maxStreak) {
      maxStreak = currentChain;
    }
  }
  const longestStreak = Math.max(maxStreak, streak);

  // Operative Rank Tiers
  let rankTitle = 'RECRUIT OPERATIVE';
  let rankLevel = 1;
  let nextRankTitle = 'STREET VIGILANTE';
  let rankProgress = 0;

  if (totalCompletedAll >= 60) {
    rankTitle = 'THOR GOD-TIER OPERATIVE';
    rankLevel = 5;
    nextRankTitle = 'MAX CLEARANCE';
    rankProgress = 1.0;
  } else if (totalCompletedAll >= 30) {
    rankTitle = 'AVENGER AGENT';
    rankLevel = 4;
    nextRankTitle = 'THOR GOD-TIER OPERATIVE';
    rankProgress = (totalCompletedAll - 30) / 30;
  } else if (totalCompletedAll >= 15) {
    rankTitle = 'NEIGHBORHOOD HERO';
    rankLevel = 3;
    nextRankTitle = 'AVENGER AGENT';
    rankProgress = (totalCompletedAll - 15) / 15;
  } else if (totalCompletedAll >= 5) {
    rankTitle = 'STREET VIGILANTE';
    rankLevel = 2;
    nextRankTitle = 'NEIGHBORHOOD HERO';
    rankProgress = (totalCompletedAll - 5) / 10;
  } else {
    rankTitle = 'RECRUIT OPERATIVE';
    rankLevel = 1;
    nextRankTitle = 'STREET VIGILANTE';
    rankProgress = totalCompletedAll / 5;
  }

  return {
    streakDays: streak,
    longestStreak,
    totalCompletedTasks,
    totalCompletedRoutines,
    totalCompletedAll,
    rankTitle,
    rankLevel,
    rankProgress: Math.min(1.0, Math.max(0.0, rankProgress)),
    nextRankTitle,
    activeDates: Array.from(activeDates),
  };
}

export async function getAppSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    await ensureInitialized();
    if (isWeb) {
      const settings = getWebStorage<Record<string, string>>(WEB_SETTINGS_KEY, {});
      return settings[key] !== undefined ? settings[key] : defaultValue;
    }
    const db = (await getDatabase())!;
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      [key]
    );
    return row?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  try {
    await ensureInitialized();
    if (isWeb) {
      const settings = getWebStorage<Record<string, string>>(WEB_SETTINGS_KEY, {});
      settings[key] = value;
      setWebStorage(WEB_SETTINGS_KEY, settings);
      return;
    }
    const db = (await getDatabase())!;
    await db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  } catch (err) {
    console.warn(`Failed to set app setting ${key}:`, err);
  }
}

export async function clearAllDataAndReset(): Promise<void> {
  await ensureInitialized();
  if (isWeb) {
    setWebStorage(WEB_TASKS_KEY, []);
    setWebStorage(WEB_ROUTINES_KEY, []);
    setWebStorage(WEB_ROUTINE_ITEMS_KEY, []);
    setWebStorage(WEB_COMPLETIONS_KEY, []);
    const settings = getWebStorage<Record<string, string>>(WEB_SETTINGS_KEY, {});
    delete settings['user_profile'];
    delete settings['user_name'];
    delete settings['user_callsign'];
    delete settings['hero_archetype'];
    setWebStorage(WEB_SETTINGS_KEY, settings);
    return;
  }

  const db = (await getDatabase())!;
  await db.execAsync(`
    DELETE FROM routine_completions;
    DELETE FROM routine_items;
    DELETE FROM routines;
    DELETE FROM tasks;
    DELETE FROM app_settings WHERE key IN ('user_profile', 'user_name', 'user_callsign', 'hero_archetype');
  `);
}

export async function resetDatabase(): Promise<void> {
  await clearAllDataAndReset();
}
