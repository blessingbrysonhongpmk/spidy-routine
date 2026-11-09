import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
  const colors = useTheme();
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
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>TODAY&apos;S TASKS</Text>
          {pendingCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primarySubtle }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>{pendingCount}</Text>
            </View>
          )}
        </View>

        {/* Filter Pills with Web Pull */}
        <View style={[styles.filterTabs, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isSelected = filter === tab;
            return (
              <WebButtonInteraction
                key={tab}
                style={[
                  styles.filterBtn,
                  isSelected && { backgroundColor: colors.surfaceHover },
                ]}
                onPress={() => setFilter(tab)}
                variant="compact"
                sound="buttonTap"
                haptic="light"
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    {
                      color: isSelected ? colors.primary : colors.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
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
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Ionicons
            name={filter === 'completed' ? 'checkmark-done-circle-outline' : 'checkbox-outline'}
            size={32}
            color={colors.textMuted}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filter === 'completed'
              ? 'No completed tasks yet'
              : filter === 'pending'
                ? 'All tasks accomplished!'
                : 'No independent tasks for today'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            {filter === 'all'
              ? 'Tap "Deploy Objective" below to schedule an objective.'
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radii.pill,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
  },
  filterTabs: {
    flexDirection: 'row',
    borderRadius: Radii.xs,
    padding: 2,
    borderWidth: 1,
  },
  filterBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs - 1,
  },
  filterBtnText: {
    fontSize: 11,
  },
  emptyContainer: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});
