import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { RoutineItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebCompletionAnimation } from './WebCompletionAnimation';

interface RoutineItemRowProps {
  item: RoutineItem;
  onToggle: (id: string, completed: boolean) => void;
  accentColor?: string;
  onDelete?: (id: string) => void;
}

/**
 * RoutineItemRow:
 * Clean, distraction-free routine row.
 * Handles date-isolated completion toggling with clear visual states and web completion animation.
 */
export const RoutineItemRow: React.FC<RoutineItemRowProps> = ({
  item,
  onToggle,
  accentColor = SpideyColors.spideyRed,
  onDelete,
}) => {
  const isDone = Boolean(item.completed);
  const [showBurst, setShowBurst] = useState(false);

  const handleToggle = () => {
    if (!isDone) {
      setShowBurst(true);
    }
    onToggle(item.id, isDone);
  };

  return (
    <View style={[styles.container, isDone && styles.containerDone]}>
      {/* 44pt Checkbox Touch Target with Web Burst */}
      <TouchableOpacity
        style={styles.checkboxTouchTarget}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
        accessibilityLabel={`Mark ${item.title} as ${isDone ? 'incomplete' : 'complete'}`}
      >
        {showBurst && <WebCompletionAnimation onAnimationEnd={() => setShowBurst(false)} />}
        <View
          style={[
            styles.checkbox,
            { borderColor: isDone ? SpideyColors.success : SpideyColors.borderMuted },
            isDone && { backgroundColor: SpideyColors.success },
          ]}
        >
          {isDone && (
            <Ionicons name="checkmark" size={12} color={SpideyColors.background} />
          )}
        </View>
      </TouchableOpacity>

      {/* Routine Item Title */}
      <View style={styles.content}>
        <Text
          style={[styles.title, isDone && styles.titleDone]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </View>

      {/* Scheduled Time Pill */}
      {item.scheduled_time ? (
        <View style={styles.timeBadge}>
          <Ionicons
            name="time-outline"
            size={11}
            color={isDone ? SpideyColors.textDisabled : SpideyColors.textMuted}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.timeText, isDone && styles.timeTextDone]}>
            {item.scheduled_time}
          </Text>
        </View>
      ) : null}

      {/* Optional Delete Button */}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item.id)}
          accessibilityLabel="Delete routine item"
        >
          <Ionicons name="trash-outline" size={15} color={SpideyColors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  containerDone: {
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
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  titleDone: {
    color: SpideyColors.textMuted,
    textDecorationLine: 'line-through',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.inputBackground,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radii.xs,
    marginLeft: Spacing.sm,
  },
  timeText: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  timeTextDone: {
    color: SpideyColors.textDisabled,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
});
