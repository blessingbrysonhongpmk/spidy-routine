import {
  createRoutine,
  createTask,
  deleteRoutine,
  deleteTask,
  getAllTasks,
  getDailyProgress,
  getRoutinesWithItems,
  getTasksForDate,
  getUserStats,
  initDatabase,
  resetDatabase,
  toggleRoutineItemCompletion,
  toggleTaskComplete,
  updateTask,
  UserStats,
} from '@/services/database';
import { getTodayDateString } from '@/services/dateUtils';
import { cancelTaskReminder, scheduleTaskReminder } from '@/services/notifications';
import { Routine, RoutineCategory, RoutineItem, Task } from '@/types';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSound } from './SoundContext';

interface DailyProgressStats {
  totalTasks: number;
  completedTasks: number;
  totalRoutineItems: number;
  completedRoutineItems: number;
  percentage: number;
}

interface DatabaseContextType {
  initialized: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  tasks: Task[];
  allTasks: Task[];
  routines: (Routine & { items: RoutineItem[] })[];
  itemsByCategory: Record<RoutineCategory, RoutineItem[]>;
  progress: DailyProgressStats;
  userStats: UserStats;
  refreshData: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  editTask: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  toggleTask: (id: string, currentCompleted: boolean) => Promise<void>;
  toggleRoutineItem: (itemId: string, date: string, currentCompleted: boolean) => Promise<void>;
  addRoutine: (
    name: string,
    category: RoutineCategory,
    repeatDays: string[],
    items: { title: string; scheduled_time?: string }[]
  ) => Promise<string>;
  removeRoutine: (id: string) => Promise<void>;
  resetToSampleData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({} as DatabaseContextType);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<(Routine & { items: RoutineItem[] })[]>([]);
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
    totalCompletedTasks: 0,
    totalCompletedRoutines: 0,
    totalCompletedAll: 0,
    rankTitle: 'RECRUIT OPERATIVE',
    rankLevel: 1,
    rankProgress: 0,
    nextRankTitle: 'STREET VIGILANTE',
  });

  const { playSound, triggerHaptic } = useSound();

  const loadData = useCallback(async (date: string) => {
    try {
      const [dateTasks, allTaskList, routineData, progressData, statsData] = await Promise.all([
        getTasksForDate(date),
        getAllTasks(),
        getRoutinesWithItems(date),
        getDailyProgress(date),
        getUserStats(),
      ]);

      setTasks(dateTasks);
      setAllTasks(allTaskList);
      setRoutines(routineData.routines);
      setItemsByCategory(routineData.itemsByCategory);
      setProgress(progressData);
      setUserStats(statsData);
    } catch (err) {
      console.error('Error loading database data:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    initDatabase()
      .then(() => {
        if (mounted) {
          setInitialized(true);
        }
      })
      .catch((err) => {
        console.error('Database initialization error:', err);
        if (mounted) {
          setInitialized(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialized) {
      loadData(selectedDate);
    }
  }, [initialized, selectedDate, loadData]);

  const refreshData = async () => {
    await loadData(selectedDate);
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
    await loadData(selectedDate);
    return created;
  };

  const handleEditTask = async (task: Task) => {
    await updateTask(task);
    if (task.reminder_enabled) {
      await scheduleTaskReminder(task);
    } else {
      await cancelTaskReminder(task.id);
    }
    playSound('buttonTap');
    triggerHaptic('light');
    await loadData(selectedDate);
  };

  const handleRemoveTask = async (id: string) => {
    await cancelTaskReminder(id);
    await deleteTask(id);
    playSound('deleteAction');
    triggerHaptic('medium');
    await loadData(selectedDate);
  };

  const handleToggleTask = async (id: string, currentCompleted: boolean) => {
    const newStatus = !currentCompleted;
    await toggleTaskComplete(id, newStatus);

    if (newStatus) {
      // Spider-Man web-shoot & Thor electric spark!
      playSound('webShoot');
      triggerHaptic('success');
      // If completing all tasks or reaching milestone, trigger thunder
      if (progress.percentage + 15 >= 100) {
        setTimeout(() => playSound('thunderMilestone'), 200);
      }
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }

    await loadData(selectedDate);
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

    await loadData(selectedDate);
  };

  const handleAddRoutine = async (
    name: string,
    category: RoutineCategory,
    repeatDays: string[],
    items: { title: string; scheduled_time?: string }[]
  ): Promise<string> => {
    const id = await createRoutine(name, category, repeatDays, items);
    playSound('buttonTap');
    triggerHaptic('medium');
    await loadData(selectedDate);
    return id;
  };

  const handleRemoveRoutine = async (id: string) => {
    await deleteRoutine(id);
    playSound('deleteAction');
    triggerHaptic('medium');
    await loadData(selectedDate);
  };

  const handleResetToSampleData = async () => {
    await resetDatabase();
    playSound('symbioteWhoosh');
    triggerHaptic('heavy');
    await loadData(selectedDate);
  };

  return (
    <DatabaseContext.Provider
      value={{
        initialized,
        selectedDate,
        setSelectedDate,
        tasks,
        allTasks,
        routines,
        itemsByCategory,
        progress,
        userStats,
        refreshData,
        addTask: handleAddTask,
        editTask: handleEditTask,
        removeTask: handleRemoveTask,
        toggleTask: handleToggleTask,
        toggleRoutineItem: handleToggleRoutineItem,
        addRoutine: handleAddRoutine,
        removeRoutine: handleRemoveRoutine,
        resetToSampleData: handleResetToSampleData,
      }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
