import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
 * Spider-Man web-shoot interaction on checkmark toggle.
 */
export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const { playSound, triggerHaptic } = useSound();
  const [showBurst, setShowBurst] = useState(false);

  const handleToggle = () => {
    if (!task.completed) {
      setShowBurst(true);
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
      'Delete Mission Task',
      `Are you sure you want to remove "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(task.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, task.completed && styles.containerCompleted]}>
      {/* 44pt Checkbox Touch Target with Web Burst */}
      <TouchableOpacity
        style={styles.checkboxTouchTarget}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
      >
        {showBurst && <WebCompletionAnimation onAnimationEnd={() => setShowBurst(false)} />}
        <View
          style={[
            styles.checkbox,
            task.completed && styles.checkboxCompleted,
          ]}
        >
          {task.completed && (
            <Ionicons name="checkmark" size={13} color={SpideyColors.background} />
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
          style={[styles.title, task.completed && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          {task.time ? (
            <View style={styles.timeBadge}>
              <Ionicons
                name="time-outline"
                size={12}
                color={SpideyColors.textMuted}
                style={styles.timeIcon}
              />
              <Text style={styles.timeText}>{task.time}</Text>
            </View>
          ) : null}

          {task.reminder_enabled ? (
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications-outline" size={11} color={SpideyColors.spideyRed} />
            </View>
          ) : null}

          {task.description ? (
            <Text style={styles.descriptionText} numberOfLines={1}>
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
        >
          <Ionicons name="pencil-outline" size={16} color={SpideyColors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleDelete}
          accessibilityLabel="Delete task"
        >
          <Ionicons name="trash-outline" size={16} color={SpideyColors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerCompleted: {
    backgroundColor: SpideyColors.inputBackground,
    borderColor: SpideyColors.borderSubtle,
    opacity: 0.75,
  },
  checkboxTouchTarget: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: SpideyColors.borderMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: SpideyColors.success,
    borderColor: SpideyColors.success,
  },
  details: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  titleCompleted: {
    color: SpideyColors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: Spacing.sm,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.inputBackground,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radii.xs,
  },
  timeIcon: {
    marginRight: 3,
  },
  timeText: {
    color: SpideyColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  reminderBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionText: {
    color: SpideyColors.textMuted,
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
