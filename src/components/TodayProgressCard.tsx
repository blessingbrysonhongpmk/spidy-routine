import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpideyColors, Spacing, Radii } from '@/constants/theme';
import { AnimatedProgress } from './AnimatedProgress';
import { useSound } from '@/context/SoundContext';

interface TodayProgressCardProps {
  completedTasks: number;
  totalTasks: number;
  completedRoutineItems: number;
  totalRoutineItems: number;
  percentage: number;
  onPress?: () => void;
}

/**
 * TodayProgressCard:
 * Unified, executive status card.
 * Combines circular progress telemetry with clear task and routine metric tallies.
 */
export const TodayProgressCard: React.FC<TodayProgressCardProps> = ({
  completedTasks,
  totalTasks,
  completedRoutineItems,
  totalRoutineItems,
  percentage,
  onPress,
}) => {
  const { playSound, triggerHaptic } = useSound();

  const handlePress = () => {
    if (onPress) {
      playSound('buttonTap');
      triggerHaptic('light');
      onPress();
    }
  };

  const totalAll = totalTasks + totalRoutineItems;
  const completedAll = completedTasks + completedRoutineItems;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={onPress ? 0.85 : 1}
    >
      {/* Precision Circular Progress Ring with Contextual Lightning */}
      <View style={styles.ringWrapper}>
        <AnimatedProgress percentage={percentage} size={70} strokeWidth={5.5} />
      </View>

      {/* Metric Breakdown */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Daily Mission Progress</Text>
          {percentage >= 100 && (
            <View style={styles.achievedBadge}>
              <Ionicons name="flash" size={11} color={SpideyColors.thorGold} />
              <Text style={styles.achievedText}>CONQUERED</Text>
            </View>
          )}
        </View>

        <Text style={styles.metricText}>
          {completedAll} of {Math.max(1, totalAll)} objectives completed
        </Text>

        {/* Subtle Dual Micro-Pills: Tasks & Routine */}
        <View style={styles.breakdownRow}>
          <View style={styles.microPill}>
            <View style={[styles.microDot, { backgroundColor: SpideyColors.spideyRed }]} />
            <Text style={styles.microPillText}>
              Tasks: {completedTasks}/{totalTasks}
            </Text>
          </View>

          <View style={styles.microPill}>
            <View style={[styles.microDot, { backgroundColor: SpideyColors.thorBlue }]} />
            <Text style={styles.microPillText}>
              Routine: {completedRoutineItems}/{totalRoutineItems}
            </Text>
          </View>
        </View>
      </View>

      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={SpideyColors.textMuted}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringWrapper: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    color: SpideyColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.thorGoldSubtle,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: Radii.xs,
    gap: 2,
  },
  achievedText: {
    color: SpideyColors.thorGold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricText: {
    color: SpideyColors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  microPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.inputBackground,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs,
    gap: 5,
  },
  microDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  microPillText: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});

