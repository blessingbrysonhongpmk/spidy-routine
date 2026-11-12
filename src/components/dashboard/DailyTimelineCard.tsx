import { RoutineItemRow } from '@/components/RoutineItemRow';
import { TaskItem } from '@/components/TaskItem';
import { useSound } from '@/context/SoundContext';
import { RoutineCategory, RoutineItem, Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DailyTimelineCardProps {
  tasks: Task[];
  overdueTasks: Task[];
  itemsByCategory: Record<RoutineCategory, RoutineItem[]>;
  onToggleTask: (id: string, completed: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleRoutineItem: (id: string, completed: boolean) => void;
  onQuickAdd: () => void;
}

type TimelineFilter = 'all' | 'tasks' | 'routines' | 'overdue';

export const DailyTimelineCard: React.FC<DailyTimelineCardProps> = ({
  tasks,
  overdueTasks,
  itemsByCategory,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onToggleRoutineItem,
  onQuickAdd,
}) => {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const { playSound, triggerHaptic } = useSound();

  const handleFilterChange = (newFilter: TimelineFilter) => {
    playSound('buttonTap');
    triggerHaptic('light');
    setFilter(newFilter);
  };

  const handleQuickAddPress = () => {
    playSound('webShoot');
    triggerHaptic('medium');
    onQuickAdd();
  };

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  const categories: { key: RoutineCategory; label: string; icon: string; color: string }[] = [
    { key: 'morning', label: 'Morning Protocol', icon: 'sunny-outline', color: '#F59E0B' },
    { key: 'afternoon', label: 'Afternoon Operations', icon: 'partly-sunny-outline', color: '#38BDF8' },
    { key: 'evening', label: 'Evening Debrief', icon: 'cloudy-night-outline', color: '#818CF8' },
    { key: 'night', label: 'Night Recon', icon: 'moon-outline', color: '#6366F1' },
  ];

  const totalActivitiesCount =
    tasks.length +
    Object.values(itemsByCategory).reduce((acc, items) => acc + (items?.length || 0), 0);

  return (
    <View style={styles.card}>
      {/* 1. Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={15} color="#38BDF8" />
          <Text style={styles.title} numberOfLines={1}>DAILY MISSION TIMELINE</Text>
        </View>

        <TouchableOpacity
          style={styles.quickAddPill}
          onPress={handleQuickAddPress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={13} color="#FFFFFF" />
          <Text style={styles.quickAddText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Filter Selector Chips (Horizontal Scrollable for Small Viewports) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterScroll}
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'tasks', label: `Tasks (${pendingTasks.length})` },
          { key: 'routines', label: 'Routines' },
          ...(overdueTasks.length > 0
            ? [{ key: 'overdue', label: `⚠️ Overdue (${overdueTasks.length})` }]
            : []),
        ].map((item) => {
          const isSelected = filter === item.key;
          const isOverdueTab = item.key === 'overdue';

          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipActive,
                isOverdueTab && isSelected && styles.filterChipOverdue,
              ]}
              onPress={() => handleFilterChange(item.key as TimelineFilter)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                  isOverdueTab && isSelected && { color: '#EF4444' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Overdue Directives Section (Visible if overdue tab or 'all' with overdues) */}
      {(filter === 'all' || filter === 'overdue') && overdueTasks.length > 0 ? (
        <View style={styles.overdueSection}>
          <View style={styles.overdueHeader}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.overdueTitle}>
              OVERDUE DIRECTIVES ({overdueTasks.length})
            </Text>
          </View>
          <View style={styles.taskList}>
            {overdueTasks.map((t) => (
              <TaskItem
                key={`overdue-${t.id}`}
                task={t}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* 4. Today's Pending Tasks Section */}
      {(filter === 'all' || filter === 'tasks') && (
        <View style={styles.sectionBlock}>
          <View style={styles.subHeader}>
            <Text style={styles.subTitle}>{"TODAY'S TASKS"}</Text>
            <Text style={styles.subCount}>{pendingTasks.length} pending</Text>
          </View>

          {pendingTasks.length > 0 ? (
            <View style={styles.taskList}>
              {pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No pending tasks for today.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 5. Routine Protocols by Time of Day */}
      {(filter === 'all' || filter === 'routines') && (
        <View style={styles.sectionBlock}>
          <View style={styles.subHeader}>
            <Text style={styles.subTitle}>ROUTINE PROTOCOLS</Text>
          </View>

          {categories.map((cat) => {
            const items = itemsByCategory[cat.key] || [];
            if (items.length === 0) return null;

            return (
              <View key={cat.key} style={styles.categoryBlock}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={cat.icon as any} size={13} color={cat.color} />
                  <Text style={[styles.categoryTitle, { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </View>

                <View style={styles.taskList}>
                  {items.map((item) => (
                    <RoutineItemRow
                      key={item.id}
                      item={item}
                      onToggle={onToggleRoutineItem}
                      accentColor={cat.color}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 6. Completed Activities Drawer */}
      {completedTasks.length > 0 && (
        <View style={styles.completedDrawer}>
          <TouchableOpacity
            style={styles.drawerToggle}
            onPress={() => setShowCompleted((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={styles.drawerLeft}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={14}
                color="#38BDF8"
              />
              <Text style={styles.drawerTitle}>
                Completed Directives ({completedTasks.length})
              </Text>
            </View>
            <Ionicons
              name={showCompleted ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#64748B"
            />
          </TouchableOpacity>

          {showCompleted && (
            <View style={[styles.taskList, { marginTop: 8 }]}>
              {completedTasks.map((t) => (
                <TaskItem
                  key={`done-${t.id}`}
                  task={t}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Empty State when no tasks or routines at all */}
      {totalActivitiesCount === 0 && (
        <View style={styles.allEmptyContainer}>
          <Ionicons name="rocket-outline" size={28} color="#64748B" />
          <Text style={styles.allEmptyTitle}>NO ACTIVE DIRECTIVES</Text>
          <Text style={styles.allEmptySub}>
            {"Deploy your first task to activate today's telemetry tracking."}
          </Text>
          <TouchableOpacity
            style={styles.allEmptyBtn}
            onPress={handleQuickAddPress}
            activeOpacity={0.85}
          >
            <Text style={styles.allEmptyBtnText}>+ Deploy First Mission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C121E',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  quickAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    flexShrink: 0,
  },
  quickAddText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  filterScrollView: {
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  filterChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  filterChipOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  filterChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#38BDF8',
  },
  overdueSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 10,
    marginBottom: 12,
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  overdueTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.6,
  },
  sectionBlock: {
    marginBottom: 10,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  subTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  subCount: {
    fontSize: 9,
    color: '#94A3B8',
  },
  categoryBlock: {
    marginTop: 6,
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
    paddingLeft: 2,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  taskList: {
    gap: 6,
  },
  emptyState: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  completedDrawer: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    marginTop: 6,
  },
  drawerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drawerTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  allEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  allEmptyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.8,
  },
  allEmptySub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 15,
  },
  allEmptyBtn: {
    marginTop: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  allEmptyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
