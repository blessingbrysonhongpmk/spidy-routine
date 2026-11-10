import { Radii, Spacing } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLightning } from './LightningEffect';
import { TensileWebFilament } from './TensileWebFilament';
import { WebCompletionAnimation } from './WebCompletionAnimation';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

/**
 * TaskItem:
 * Refined, clean task row with comfortable 44pt+ touch targets.
 * Spider-Man web-shoot interaction on checkmark toggle with Thor electric response.
 */
export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const colors = useTheme();
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();
  const [showBurst, setShowBurst] = useState(false);

  const handleToggle = () => {
    if (!task.completed) {
      setShowBurst(true);
      playSound('taskSuccess');
      triggerLightning({ intensity: 'light' });
      triggerHaptic('success');
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }
    onToggle(task.id, task.completed);
  };

  const handleEdit = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    onEdit(task);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to remove "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            playSound('deleteAction');
            triggerHaptic('medium');
            onDelete(task.id);
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: task.completed ? colors.inputBackground : colors.surface,
          borderColor: task.completed ? colors.borderSubtle : colors.borderMuted,
        },
        task.completed && styles.containerCompleted,
      ]}
    >
      {/* 44pt Checkbox Touch Target with Web Burst */}
      <TouchableOpacity
        style={styles.checkboxTouchTarget}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
      >
        {showBurst && (
          <>
            <TensileWebFilament onComplete={() => setShowBurst(false)} size={68} />
            <WebCompletionAnimation size={58} />
          </>
        )}
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.borderMuted },
            task.completed && {
              backgroundColor: colors.success,
              borderColor: colors.success,
            },
          ]}
        >
          {task.completed && (
            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      {/* Task Content */}
      <TouchableOpacity
        style={styles.details}
        onPress={handleEdit}
        activeOpacity={0.75}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text },
            task.completed && [styles.titleCompleted, { color: colors.textMuted }],
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          {/* Priority Indicator Pill */}
          {task.priority && task.priority !== 'medium' ? (
            <View
              style={[
                styles.priorityBadge,
                task.priority === 'high'
                  ? { backgroundColor: colors.primarySubtle, borderColor: colors.primaryBorder }
                  : { backgroundColor: colors.secondarySubtle, borderColor: colors.secondaryBorder },
              ]}
            >
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: task.priority === 'high' ? colors.primary : colors.secondary },
                ]}
              />
              <Text
                style={[
                  styles.priorityText,
                  { color: task.priority === 'high' ? colors.primary : colors.secondary },
                ]}
              >
                {task.priority.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {task.time ? (
            <View style={[styles.timeBadge, { backgroundColor: colors.inputBackground }]}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.textSecondary}
                style={styles.timeIcon}
              />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{task.time}</Text>
            </View>
          ) : null}

          {task.reminder_enabled ? (
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications-outline" size={12} color={colors.primary} />
            </View>
          ) : null}

          {task.description ? (
            <Text style={[styles.descriptionText, { color: colors.textMuted }]} numberOfLines={1}>
              {task.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleEdit}
          accessibilityLabel="Edit task"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleDelete}
          accessibilityLabel="Delete task"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerCompleted: {
    opacity: 0.72,
  },
  checkboxTouchTarget: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: Spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.xs,
    borderWidth: 0.8,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  priorityText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radii.xs,
  },
  timeIcon: {
    marginRight: 3,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  reminderBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 12,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
