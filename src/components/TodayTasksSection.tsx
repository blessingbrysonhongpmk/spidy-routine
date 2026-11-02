import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TaskItem } from './TaskItem';
import { WebButtonInteraction } from './WebButtonInteraction';

interface TodayTasksSectionProps {
  tasks: Task[];
  onToggleTask: (id: string, currentCompleted: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: () => void;
}

/**
 * TodayTasksSection:
 * Independent tasks module for the dashboard.
 * Filter tabs: All, Pending, Completed, with compact TaskItem rows and zero clutter.
 */
export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <View style={styles.container}>
      {/* Header and Filter Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.sectionHeading}>TODAY&apos;S TASKS</Text>
          {pendingCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{pendingCount}</Text>
            </View>
          )}
        </View>

        {/* Filter Pills with Web Pull */}
        <View style={styles.filterTabs}>
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isSelected = filter === tab;
            return (
              <WebButtonInteraction
                key={tab}
                style={[styles.filterBtn, isSelected && styles.filterBtnActive]}
                onPress={() => setFilter(tab)}
                variant="compact"
                sound="buttonTap"
                haptic="light"
              >
                <Text
                  style={[styles.filterBtnText, isSelected && styles.filterBtnTextActive]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </WebButtonInteraction>
            );
          })}
        </View>
      </View>

      {/* Task Rows List */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={filter === 'completed' ? 'checkmark-done-circle-outline' : 'checkbox-outline'}
            size={32}
            color={SpideyColors.textMuted}
          />
          <Text style={styles.emptyTitle}>
            {filter === 'completed'
              ? 'No completed tasks yet'
              : filter === 'pending'
                ? 'All tasks accomplished!'
                : 'No independent tasks for today'}
          </Text>
          <Text style={styles.emptySub}>
            {filter === 'all'
              ? 'Tap "+ New Task" below to schedule an objective.'
              : 'Keep up the momentum.'}
          </Text>
        </View>
      ) : (
        filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: SpideyColors.spideyRedSubtle,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radii.pill,
  },
  countText: {
    color: SpideyColors.spideyRed,
    fontSize: 10,
    fontWeight: '800',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.xs,
    padding: 2,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
  },
  filterBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs - 1,
  },
  filterBtnActive: {
    backgroundColor: SpideyColors.surfaceElevated,
  },
  filterBtnText: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: SpideyColors.textPrimary,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptySub: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});

