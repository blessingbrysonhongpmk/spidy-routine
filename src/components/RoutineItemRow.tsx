import { Radii, Spacing } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
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
  accentColor,
  onDelete,
}) => {
  const colors = useTheme();
  const { playSound, triggerHaptic } = useSound();
  const isDone = Boolean(item.completed);
  const [showBurst, setShowBurst] = useState(false);

  const activeAccent = accentColor || colors.primary;

  const handleToggle = () => {
    if (!isDone) {
      setShowBurst(true);
      playSound('taskSuccess');
      triggerHaptic('success');
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }
    onToggle(item.id, isDone);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDone ? colors.inputBackground : colors.surface,
          borderColor: isDone ? colors.borderSubtle : colors.borderMuted,
        },
        isDone && styles.containerDone,
      ]}
    >
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
            { borderColor: isDone ? colors.success : colors.borderMuted },
            isDone && { backgroundColor: colors.success },
          ]}
        >
          {isDone && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>

      {/* Routine Item Title */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            isDone && [styles.titleDone, { color: colors.textMuted }],
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </View>

      {/* Scheduled Time Pill */}
      {item.scheduled_time ? (
        <View
          style={[
            styles.timeBadge,
            {
              backgroundColor: colors.inputBackground,
              borderColor: isDone ? colors.borderSubtle : activeAccent + '40',
              borderWidth: 1,
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={11}
            color={isDone ? colors.textDisabled : activeAccent}
            style={{ marginRight: 3 }}
          />
          <Text
            style={[
              styles.timeText,
              { color: isDone ? colors.textDisabled : colors.textSecondary },
            ]}
          >
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
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      )}
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
  containerDone: {
    opacity: 0.72,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radii.xs,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});
