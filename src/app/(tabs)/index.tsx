import { AddTaskButton } from '@/components/AddTaskButton';
import { HeaderBranding } from '@/components/HeaderBranding';
import { TimelineSection } from '@/components/TimelineSection';
import { TodayTasksSection } from '@/components/TodayTasksSection';
import { WebBackground } from '@/components/WebBackground';
import { useDatabase } from '@/context/DatabaseContext';
import { useTheme } from '@/hooks/use-theme';
import { formatDateHeader, getTodayDateString } from '@/services/dateUtils';
import { Task } from '@/types';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet
} from 'react-native';

export default function TodayDashboardScreen() {
  const router = useRouter();
  const colors = useTheme();
  const {
    tasks,
    itemsByCategory,
    progress,
    userStats,
    refreshData,
    toggleRoutineItem,
    toggleTask,
    removeTask,
    selectedDate,
  } = useDatabase();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const todayStr = getTodayDateString();
  const dateHeader = useMemo(() => formatDateHeader(todayStr), [todayStr]);

  // Find the next upcoming uncompleted routine activity
  const nextActivity = useMemo(() => {
    const categories = ['morning', 'afternoon', 'evening', 'night'] as const;
    for (const cat of categories) {
      const items = itemsByCategory[cat] || [];
      const pending = items.find((i) => !i.completed);
      if (pending) {
        return {
          id: pending.id,
          title: pending.title,
          time: pending.scheduled_time || '10:00 AM',
          category: cat.charAt(0).toUpperCase() + cat.slice(1) + ' Protocol',
          isCompleted: false,
        };
      }
    }
    // Fallback when all routines are completed
    return {
      id: 'default',
      title: 'All daily protocols completed',
      time: 'Focus Mode',
      category: 'Mission Accomplished',
      isCompleted: true,
    };
  }, [itemsByCategory]);

  const handleNextActivityComplete = () => {
    if (nextActivity.id !== 'default') {
      toggleRoutineItem(nextActivity.id, selectedDate, false);
    }
  };

  const handleToggleRoutineItem = (itemId: string, currentCompleted: boolean) => {
    toggleRoutineItem(itemId, selectedDate, currentCompleted);
  };

  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    toggleTask(taskId, currentCompleted);
  };

  const handleEditTask = (task: Task) => {
    router.push({
      pathname: '/modal-task',
      params: { id: task.id },
    });
  };

  const handleAddTaskPress = () => {
    router.push('/modal-task');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <WebBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Hero Header matching target UI design */}
        <HeaderBranding
          dateHeader={dateHeader}
          percentage={progress.percentage}
          streakDays={userStats?.streakDays || 1}
          nextActivityTitle={nextActivity.title}
          onNextActivityPress={handleNextActivityComplete}
          onProgressPress={() => router.push('/(tabs)/calendar')}
          activeTab="today"
        />

        {/* 2. Primary Quick Add Action */}
        <AddTaskButton onPress={handleAddTaskPress} />

        {/* 3. Today's Tasks: Pending, Completed, Filter chips with one-tap toggle */}
        <TodayTasksSection
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onEditTask={handleEditTask}
          onDeleteTask={removeTask}
          onAddTask={handleAddTaskPress}
        />

        {/* 4. Daily Routine Timeline (Morning, Afternoon, Evening, Night) */}
        <TimelineSection
          itemsByCategory={itemsByCategory}
          onToggleItem={handleToggleRoutineItem}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
});
