import {
  clearAllDataAndReset,
  copyDayRoutinesToDays,
  createRoutine,
  createTask,
  deleteRoutine,
  deleteTask,
  duplicateRoutine,
  getAllRoutineCompletions,
  getAllTasks,
  getDailyProgress,
  getRoutinesWithItems,
  getTasksForDate,
  getUserStats,
  initDatabase,
  reorderRoutineItems,
  resetDatabase,
  RoutineCompletionRecord,
  RoutineOptions,
  seedHeroStarterProtocols,
  setRoutineItemStatus,
  toggleParentRoutineComplete,
  toggleRoutineItemCompletion,
  toggleTaskComplete,
  updateRoutine,
  updateTask,
  UserStats,
} from '@/services/database';
import { getTodayDateString } from '@/services/dateUtils';
import {
  cancelRoutineReminder,
  cancelTaskReminder,
  scheduleRoutineReminder,
  scheduleTaskReminder,
} from '@/services/notifications';
import {
  DayOfWeek,
  Routine,
  RoutineActivityStatus,
  RoutineCategory,
  RoutineDraftItem,
  RoutineItem,
  Task,
} from '@/types';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSound } from './SoundContext';

export interface DailyProgressStats {
  totalTasks: number;
  completedTasks: number;
  totalRoutineItems: number;
  completedRoutineItems: number;
  percentage: number;
}

export interface DatabaseContextType {
  initialized: boolean;
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  routineDate: string;
  setRoutineDate: (date: string) => void;
  tasks: Task[];
  todayTasks: Task[];
  allTasks: Task[];
  routines: (Routine & { items: RoutineItem[] })[];
  todayRoutines: (Routine & { items: RoutineItem[] })[];
  itemsByCategory: Record<RoutineCategory, RoutineItem[]>;
  progress: DailyProgressStats;
  userStats: UserStats;
  routineCompletions: RoutineCompletionRecord[];
  refreshData: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  editTask: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  toggleTask: (id: string, currentCompleted: boolean) => Promise<void>;
  toggleRoutineItem: (itemId: string, date: string, currentCompleted: boolean) => Promise<void>;
  updateRoutineItemStatus: (
    itemId: string,
    date: string,
    status: RoutineActivityStatus
  ) => Promise<void>;
  toggleParentRoutine: (routineId: string, date: string, completed: boolean) => Promise<void>;
  reorderRoutineActivities: (routineId: string, orderedItemIds: string[]) => Promise<void>;
  addRoutine: (
    name: string,
    category: RoutineCategory,
    repeatDays: string[],
    items: RoutineDraftItem[],
    options?: RoutineOptions
  ) => Promise<string>;
  editRoutine: (
    id: string,
    name: string,
    category: RoutineCategory,
    repeatDays: string[],
    items: RoutineDraftItem[],
    options?: RoutineOptions
  ) => Promise<void>;
  duplicateRoutineToDays: (
    routineId: string,
    targetDays: DayOfWeek[],
    overrideName?: string
  ) => Promise<string>;
  copyDayRoutines: (sourceDay: DayOfWeek, targetDays: DayOfWeek[]) => Promise<number>;
  removeRoutine: (id: string) => Promise<void>;
  resetToSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  loadStarterProtocols: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({} as DatabaseContextType);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [routineDate, setRoutineDate] = useState<string>(getTodayDateString());
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<(Routine & { items: RoutineItem[] })[]>([]);
  const [todayRoutines, setTodayRoutines] = useState<(Routine & { items: RoutineItem[] })[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<RoutineCategory, RoutineItem[]>>({
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  });
  const [progress, setProgress] = useState<DailyProgressStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalRoutineItems: 0,
    completedRoutineItems: 0,
    percentage: 0,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    streakDays: 0,
    longestStreak: 0,
    totalCompletedTasks: 0,
    totalCompletedRoutines: 0,
    totalCompletedAll: 0,
    rankTitle: 'RECRUIT OPERATIVE',
    rankLevel: 1,
    rankProgress: 0,
    nextRankTitle: 'STREET VIGILANTE',
    activeDates: [],
  });
  const [routineCompletions, setRoutineCompletions] = useState<RoutineCompletionRecord[]>([]);

  const { playSound, triggerHaptic } = useSound();

  const loadData = useCallback(async (rDate: string) => {
    setIsLoading(true);
    try {
      const todayStr = getTodayDateString();
      const [
        todayTaskList,
        allTaskList,
        todayRoutineData,
        selectedRoutineData,
        progressData,
        statsData,
        completionsList,
      ] = await Promise.all([
        getTasksForDate(todayStr),
        getAllTasks(),
        getRoutinesWithItems(todayStr),
        rDate === todayStr ? getRoutinesWithItems(todayStr) : getRoutinesWithItems(rDate),
        getDailyProgress(todayStr),
        getUserStats(),
        getAllRoutineCompletions(),
      ]);

      setTodayTasks(todayTaskList);
      setAllTasks(allTaskList);
      setTodayRoutines(todayRoutineData.routines);
      setRoutines(selectedRoutineData.routines);
      setItemsByCategory(todayRoutineData.itemsByCategory);
      setProgress(progressData);
      setUserStats(statsData);
      setRoutineCompletions(completionsList);
      setError(null);
    } catch (err: any) {
      console.error('Error loading database data:', err);
      setError(err?.message || 'Error loading database records.');
      // Never wipe existing state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    initDatabase()
      .then(() => {
        if (mounted) {
          setInitialized(true);
          setError(null);
        }
      })
      .catch((err: any) => {
        console.error('Database initialization error:', err);
        if (mounted) {
          setError(err?.message || 'Database initialization error.');
          setInitialized(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialized) {
      loadData(routineDate);
    }
  }, [initialized, routineDate, loadData]);

  const refreshData = async () => {
    try {
      await initDatabase();
      await loadData(routineDate);
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError(err?.message || 'Error refreshing data.');
    }
  };

  const handleAddTask = async (
    taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Task> => {
    const created = await createTask(taskData);
    if (created.reminder_enabled) {
      await scheduleTaskReminder(created);
    }
    playSound('buttonTap');
    triggerHaptic('medium');
    await loadData(routineDate);
    return created;
  };

  const handleEditTask = async (task: Task) => {
    await updateTask(task);
    if (task.reminder_enabled && !task.completed) {
      await scheduleTaskReminder(task);
    } else {
      await cancelTaskReminder(task.id);
    }
    playSound('buttonTap');
    triggerHaptic('light');
    await loadData(routineDate);
  };

  const handleRemoveTask = async (id: string) => {
    await cancelTaskReminder(id);
    await deleteTask(id);
    playSound('deleteAction');
    triggerHaptic('medium');
    await loadData(routineDate);
  };

  const handleToggleTask = async (id: string, currentCompleted: boolean) => {
    const newStatus = !currentCompleted;
    await toggleTaskComplete(id, newStatus);
    if (newStatus) {
      await cancelTaskReminder(id);
      playSound('webShoot');
      triggerHaptic('success');
      if (progress.percentage + 15 >= 100) {
        setTimeout(() => playSound('thunderMilestone'), 200);
      }
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }

    await loadData(routineDate);
  };

  const handleToggleRoutineItem = async (
    itemId: string,
    date: string,
    currentCompleted: boolean
  ) => {
    const newStatus = !currentCompleted;
    await toggleRoutineItemCompletion(itemId, date, newStatus);

    if (newStatus) {
      playSound('electricCrackle');
      triggerHaptic('medium');
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }

    await loadData(routineDate);
  };

  const handleUpdateRoutineItemStatus = async (
    itemId: string,
    date: string,
    status: RoutineActivityStatus
  ) => {
    await setRoutineItemStatus(itemId, date, status);
    if (status === 'completed') {
      playSound('electricCrackle');
      triggerHaptic('medium');
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }
    await loadData(routineDate);
  };

  const handleToggleParentRoutine = async (
    routineId: string,
    date: string,
    completed: boolean
  ) => {
    await toggleParentRoutineComplete(routineId, date, completed);
    if (completed) {
      playSound('thunderMilestone');
      triggerHaptic('success');
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }
    await loadData(routineDate);
  };

  const handleReorderRoutineActivities = async (
    routineId: string,
    orderedItemIds: string[]
  ) => {
    await reorderRoutineItems(routineId, orderedItemIds);
    playSound('buttonTap');
    triggerHaptic('light');
    await loadData(routineDate);
  };

  const handleAddRoutine = async (
    name: string,
    category: RoutineCategory,
    repeatDays: string[],
    items: RoutineDraftItem[],
    options?: RoutineOptions
  ): Promise<string> => {
    const id = await createRoutine(name, category, repeatDays, items, options);
    if (options?.reminderEnabled) {
      const updated = await getRoutinesWithItems(routineDate);
      const createdRoutine = updated.routines.find((r) => r.id === id);
      if (createdRoutine) {
        await scheduleRoutineReminder(createdRoutine);
      }
    }
    playSound('buttonTap');
    triggerHaptic('medium');
    await loadData(routineDate);
    return id;
  };

  const handleEditRoutine = async (
    id: string,
    name: string,
    category: RoutineCategory,
    repeatDays: string[],
    items: RoutineDraftItem[],
    options?: RoutineOptions
  ) => {
    await updateRoutine(id, name, category, repeatDays, items, options);
    const updated = await getRoutinesWithItems(routineDate);
    const editedRoutine = updated.routines.find((r) => r.id === id);
    if (editedRoutine) {
      if (editedRoutine.reminder_enabled) {
        await scheduleRoutineReminder(editedRoutine);
      } else {
        await cancelRoutineReminder(id);
      }
    }
    playSound('buttonTap');
    triggerHaptic('medium');
    await loadData(routineDate);
  };

  const handleDuplicateRoutineToDays = async (
    routineId: string,
    targetDays: DayOfWeek[],
    overrideName?: string
  ): Promise<string> => {
    const newId = await duplicateRoutine(routineId, targetDays, overrideName);
    playSound('buttonTap');
    triggerHaptic('success');
    await loadData(routineDate);
    return newId;
  };

  const handleCopyDayRoutines = async (
    sourceDay: DayOfWeek,
    targetDays: DayOfWeek[]
  ): Promise<number> => {
    const count = await copyDayRoutinesToDays(sourceDay, targetDays);
    playSound('webShoot');
    triggerHaptic('success');
    await loadData(routineDate);
    return count;
  };

  const handleRemoveRoutine = async (id: string) => {
    await cancelRoutineReminder(id);
    await deleteRoutine(id);
    playSound('deleteAction');
    triggerHaptic('medium');
    await loadData(routineDate);
  };

  const handleResetToSampleData = async () => {
    await resetDatabase();
    playSound('symbioteWhoosh');
    triggerHaptic('heavy');
    await loadData(routineDate);
  };

  const handleClearAllData = async () => {
    await clearAllDataAndReset();
    playSound('deleteAction');
    triggerHaptic('heavy');
    await loadData(routineDate);
  };

  const handleLoadStarterProtocols = async () => {
    await seedHeroStarterProtocols();
    playSound('thunderMilestone');
    triggerHaptic('success');
    await loadData(routineDate);
  };

  return (
    <DatabaseContext.Provider
      value={{
        initialized,
        isLoading,
        error,
        selectedDate,
        setSelectedDate,
        routineDate,
        setRoutineDate,
        tasks: todayTasks,
        todayTasks,
        allTasks,
        routines,
        todayRoutines,
        itemsByCategory,
        progress,
        userStats,
        routineCompletions,
        refreshData,
        addTask: handleAddTask,
        editTask: handleEditTask,
        removeTask: handleRemoveTask,
        toggleTask: handleToggleTask,
        toggleRoutineItem: handleToggleRoutineItem,
        updateRoutineItemStatus: handleUpdateRoutineItemStatus,
        toggleParentRoutine: handleToggleParentRoutine,
        reorderRoutineActivities: handleReorderRoutineActivities,
        addRoutine: handleAddRoutine,
        editRoutine: handleEditRoutine,
        duplicateRoutineToDays: handleDuplicateRoutineToDays,
        copyDayRoutines: handleCopyDayRoutines,
        removeRoutine: handleRemoveRoutine,
        resetToSampleData: handleResetToSampleData,
        clearAllData: handleClearAllData,
        loadStarterProtocols: handleLoadStarterProtocols,
      }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
