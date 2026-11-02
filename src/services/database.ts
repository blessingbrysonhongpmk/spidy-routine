import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Routine, RoutineCategory, RoutineItem, Task } from '@/types';
import { getTodayDateString } from './dateUtils';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('spideyflow.db');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT,
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

  // Seed default data if routines table is empty
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM routines'
  );

  if (!countRow || countRow.count === 0) {
    await seedDefaultData(db);
  }
}

async function seedDefaultData(db: SQLite.SQLiteDatabase): Promise<void> {
  const allDays = JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const now = new Date().toISOString();
  const today = getTodayDateString();

  // 1. Morning Routine
  const morningId = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO routines (id, name, category, repeat_days, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [morningId, 'Suit Up', 'morning', allDays, now]
  );

  const morningItems = [
    { title: 'Wake up', time: '05:00 AM' },
    { title: 'Workout', time: '05:15 AM' },
    { title: 'Meditation', time: '05:50 AM' },
    { title: 'Bible Reading', time: '06:05 AM' },
    { title: 'Get Ready', time: '06:30 AM' },
    { title: 'College Departure', time: '07:20 AM' },
  ];

  for (let i = 0; i < morningItems.length; i++) {
    const item = morningItems[i];
    await db.runAsync(
      `INSERT INTO routine_items (id, routine_id, title, scheduled_time, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [Crypto.randomUUID(), morningId, item.title, item.time, i]
    );
  }

  // 2. Afternoon Routine
  const afternoonId = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO routines (id, name, category, repeat_days, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [afternoonId, 'Mission Mode', 'afternoon', allDays, now]
  );

  const afternoonItems = [
    { title: 'Deep Work & Projects', time: '02:00 PM' },
    { title: 'Nutrition Fuel', time: '01:00 PM' },
  ];

  for (let i = 0; i < afternoonItems.length; i++) {
    const item = afternoonItems[i];
    await db.runAsync(
      `INSERT INTO routine_items (id, routine_id, title, scheduled_time, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [Crypto.randomUUID(), afternoonId, item.title, item.time, i]
    );
  }

  // 3. Evening Routine
  const eveningId = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO routines (id, name, category, repeat_days, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [eveningId, 'Recharge & Sharpen', 'evening', allDays, now]
  );

  const eveningItems = [
    { title: 'Physical Training / Run', time: '06:00 PM' },
    { title: 'Read & Skill Sharpening', time: '07:30 PM' },
    { title: 'Dinner & Relax', time: '08:30 PM' },
  ];

  for (let i = 0; i < eveningItems.length; i++) {
    const item = eveningItems[i];
    await db.runAsync(
      `INSERT INTO routine_items (id, routine_id, title, scheduled_time, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [Crypto.randomUUID(), eveningId, item.title, item.time, i]
    );
  }

  // 4. Night Routine
  const nightId = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO routines (id, name, category, repeat_days, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [nightId, 'Reset & Defend', 'night', allDays, now]
  );

  const nightItems = [
    { title: "Review Tomorrow's Mission", time: '10:00 PM' },
    { title: 'Wind Down & Sleep', time: '10:30 PM' },
  ];

  for (let i = 0; i < nightItems.length; i++) {
    const item = nightItems[i];
    await db.runAsync(
      `INSERT INTO routine_items (id, routine_id, title, scheduled_time, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [Crypto.randomUUID(), nightId, item.title, item.time, i]
    );
  }

  // Seed sample tasks for today matching the visual layout
  const sampleTasks = [
    {
      title: 'Complete 5 tasks',
      description: "Today's Primary Mission",
      time: '09:00',
      completed: 0,
    },
    {
      title: 'Review System Architecture',
      description: 'Prepare documentation and QA test suites',
      time: '11:30',
      completed: 1,
    },
    {
      title: 'Workout & Core Training',
      description: 'Strength training routine',
      time: '17:00',
      completed: 1,
    },
    {
      title: 'Meditation & Breathwork',
      description: 'Thor focus protocol',
      time: '10:00',
      completed: 1,
    },
    {
      title: 'Push Production Release',
      description: 'Ship SPIDEY FLOW mobile package',
      time: '19:00',
      completed: 0,
    },
  ];

  for (const t of sampleTasks) {
    await db.runAsync(
      `INSERT INTO tasks (id, title, description, date, time, completed, reminder_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [Crypto.randomUUID(), t.title, t.description, today, t.time, t.completed, now, now]
    );
  }

  // Set default settings
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('sound_enabled', 'true')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('master_volume', '0.8')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('haptics_enabled', 'true')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('theme', 'dark')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('user_name', 'Blessing')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('intro_enabled', 'true')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('intro_sound_enabled', 'true')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('intro_has_launched', 'false')`);
  await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('reduced_motion', 'false')`);
}

// ==========================================
// TASK CRUD
// ==========================================

export async function getTasksForDate(date: string): Promise<Task[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM tasks WHERE date = ? ORDER BY time ASC, created_at ASC',
    [date]
  );
  return rows.map((r) => ({
    ...r,
    completed: r.completed === 1,
    reminder_enabled: r.reminder_enabled === 1,
  }));
}

export async function getAllTasks(): Promise<Task[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM tasks ORDER BY date DESC, time ASC'
  );
  return rows.map((r) => ({
    ...r,
    completed: r.completed === 1,
    reminder_enabled: r.reminder_enabled === 1,
  }));
}

export async function createTask(
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'>
): Promise<Task> {
  const db = getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO tasks (id, title, description, date, time, completed, reminder_enabled, reminder_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      task.title,
      task.description || '',
      task.date,
      task.time || '',
      task.completed ? 1 : 0,
      task.reminder_enabled ? 1 : 0,
      task.reminder_time || '',
      now,
      now,
    ]
  );

  return {
    id,
    ...task,
    created_at: now,
    updated_at: now,
  };
}

export async function updateTask(task: Task): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE tasks
     SET title = ?, description = ?, date = ?, time = ?, completed = ?, reminder_enabled = ?, reminder_time = ?, updated_at = ?
     WHERE id = ?`,
    [
      task.title,
      task.description || '',
      task.date,
      task.time || '',
      task.completed ? 1 : 0,
      task.reminder_enabled ? 1 : 0,
      task.reminder_time || '',
      now,
      task.id,
    ]
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function toggleTaskComplete(id: string, completed: boolean): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE tasks SET completed = ?, updated_at = ? WHERE id = ?',
    [completed ? 1 : 0, now, id]
  );
}

// ==========================================
// ROUTINE & ITEMS
// ==========================================

export async function getRoutinesWithItems(date: string): Promise<{
  routines: (Routine & { items: RoutineItem[] })[];
  itemsByCategory: Record<RoutineCategory, RoutineItem[]>;
}> {
  const db = getDatabase();
  const routinesRaw = await db.getAllAsync<any>(
    'SELECT * FROM routines WHERE is_active = 1 ORDER BY category ASC'
  );

  const itemsRaw = await db.getAllAsync<any>(
    `SELECT ri.*, r.category,
      CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END as is_completed
     FROM routine_items ri
     JOIN routines r ON ri.routine_id = r.id
     LEFT JOIN routine_completions rc
       ON ri.id = rc.routine_item_id AND rc.completed_date = ?
     WHERE ri.is_active = 1 AND r.is_active = 1
     ORDER BY ri.sort_order ASC, ri.scheduled_time ASC`,
    [date]
  );

  const itemsByCategory: Record<RoutineCategory, RoutineItem[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  };

  for (const item of itemsRaw) {
    const mapped: RoutineItem = {
      id: item.id,
      routine_id: item.routine_id,
      title: item.title,
      scheduled_time: item.scheduled_time,
      sort_order: item.sort_order,
      is_active: item.is_active === 1,
      category: item.category as RoutineCategory,
      completed: item.is_completed === 1,
    };
    if (itemsByCategory[mapped.category!]) {
      itemsByCategory[mapped.category!].push(mapped);
    }
  }

  const routines = routinesRaw.map((r) => {
    let repeatDays: string[] = [];
    try {
      repeatDays = JSON.parse(r.repeat_days);
    } catch {
      repeatDays = r.repeat_days ? r.repeat_days.split(',') : [];
    }
    const cat = r.category as RoutineCategory;
    return {
      ...r,
      is_active: r.is_active === 1,
      repeat_days: repeatDays,
      items: itemsByCategory[cat] || [],
    };
  });

  return { routines, itemsByCategory };
}

export async function createRoutine(
  name: string,
  category: RoutineCategory,
  repeatDays: string[],
  items: { title: string; scheduled_time?: string }[]
): Promise<string> {
  const db = getDatabase();
  const routineId = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO routines (id, name, category, repeat_days, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [routineId, name, category, JSON.stringify(repeatDays), now]
  );

  for (let i = 0; i < items.length; i++) {
    await db.runAsync(
      `INSERT INTO routine_items (id, routine_id, title, scheduled_time, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [Crypto.randomUUID(), routineId, items[i].title, items[i].scheduled_time || '', i]
    );
  }

  return routineId;
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM routine_completions WHERE routine_item_id IN (SELECT id FROM routine_items WHERE routine_id = ?)', [routineId]);
  await db.runAsync('DELETE FROM routine_items WHERE routine_id = ?', [routineId]);
  await db.runAsync('DELETE FROM routines WHERE id = ?', [routineId]);
}

export async function toggleRoutineItemCompletion(
  routineItemId: string,
  date: string,
  completed: boolean
): Promise<void> {
  const db = getDatabase();
  if (completed) {
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO routine_completions (id, routine_item_id, completed_date, completed_at)
       VALUES (?, ?, ?, ?)`,
      [id, routineItemId, date, now]
    );
  } else {
    await db.runAsync(
      'DELETE FROM routine_completions WHERE routine_item_id = ? AND completed_date = ?',
      [routineItemId, date]
    );
  }
}

export async function getDailyProgress(date: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  totalRoutineItems: number;
  completedRoutineItems: number;
  percentage: number;
}> {
  const db = getDatabase();

  const taskStats = await db.getFirstAsync<{ total: number; completed: number }>(
    `SELECT COUNT(*) as total,
            COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
     FROM tasks WHERE date = ?`,
    [date]
  );

  const routineStats = await db.getFirstAsync<{ total: number; completed: number }>(
    `SELECT COUNT(DISTINCT ri.id) as total,
            COUNT(DISTINCT rc.id) as completed
     FROM routine_items ri
     JOIN routines r ON ri.routine_id = r.id
     LEFT JOIN routine_completions rc
       ON ri.id = rc.routine_item_id AND rc.completed_date = ?
     WHERE ri.is_active = 1 AND r.is_active = 1`,
    [date]
  );

  const totalTasks = taskStats?.total || 0;
  const completedTasks = taskStats?.completed || 0;
  const totalRoutineItems = routineStats?.total || 0;
  const completedRoutineItems = routineStats?.completed || 0;

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
  totalCompletedTasks: number;
  totalCompletedRoutines: number;
  totalCompletedAll: number;
  rankTitle: string;
  rankLevel: number;
  rankProgress: number; // 0 to 1
  nextRankTitle: string;
}

export async function getUserStats(): Promise<UserStats> {
  const db = getDatabase();

  const taskStats = await db.getFirstAsync<{ completed: number }>(
    `SELECT COUNT(*) as completed FROM tasks WHERE completed = 1`
  );

  const routineStats = await db.getFirstAsync<{ completed: number }>(
    `SELECT COUNT(*) as completed FROM routine_completions`
  );

  const totalCompletedTasks = taskStats?.completed || 0;
  const totalCompletedRoutines = routineStats?.completed || 0;
  const totalCompletedAll = totalCompletedTasks + totalCompletedRoutines;

  // Streak Calculation
  const taskDates = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM tasks WHERE completed = 1`
  );
  const routineDates = await db.getAllAsync<{ completed_date: string }>(
    `SELECT DISTINCT completed_date FROM routine_completions`
  );

  const activeDates = new Set<string>();
  taskDates.forEach((r) => activeDates.add(r.date));
  routineDates.forEach((r) => activeDates.add(r.completed_date));

  let streak = 0;
  const today = new Date();

  // Check if today is active
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const todayStr = formatDate(today);

  let checkDate = new Date(today);
  if (!activeDates.has(todayStr)) {
    // If user hasn't completed anything today yet, check starting from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (activeDates.has(formatDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

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
    totalCompletedTasks,
    totalCompletedRoutines,
    totalCompletedAll,
    rankTitle,
    rankLevel,
    rankProgress: Math.min(1.0, Math.max(0.0, rankProgress)),
    nextRankTitle,
  };
}

export async function getAppSetting(key: string, defaultValue: string = ''): Promise<string> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  return row ? row.value : defaultValue;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function resetDatabase(): Promise<void> {
  const db = getDatabase();
  await db.execAsync(`
    DELETE FROM routine_completions;
    DELETE FROM routine_items;
    DELETE FROM routines;
    DELETE FROM tasks;
    DELETE FROM app_settings;
  `);
  await seedDefaultData(db);
}
