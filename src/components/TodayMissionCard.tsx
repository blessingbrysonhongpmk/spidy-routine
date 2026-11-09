import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { WebButtonInteraction } from './WebButtonInteraction';

interface TodayMissionCardProps {
  completedTasks: number;
  totalTasks: number;
  onPress: () => void;
}

/**
 * TodayMissionCard:
 * Signature "Today's Mission" card inspired by superhero tactical telemetry.
 * Features crimson bullseye target, dynamic task goal with brush underline, and live count tally.
 */
export const TodayMissionCard: React.FC<TodayMissionCardProps> = ({
  completedTasks,
  totalTasks,
  onPress,
}) => {
  const colors = useTheme();
  const { user } = useAuth();
  const { playSound, triggerHaptic } = useSound();

  const handlePress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    onPress();
  };

  const targetCount = user?.dailyTarget || (totalTasks > 0 ? totalTasks : 5);
  const completedCount = completedTasks;

  return (
    <WebButtonInteraction
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primaryBorder,
        },
      ]}
      onPress={handlePress}
      variant="subtle"
      sound="webShoot"
      haptic="medium"
      accessibilityLabel={`Today's Mission: Complete ${targetCount} tasks. ${completedCount} of ${targetCount} completed.`}
    >
      {/* Left Bullseye Target Icon */}
      <View style={styles.targetWrapper}>
        <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
          {/* Outer Ring */}
          <Circle cx={18} cy={18} r={16} stroke={colors.primary} strokeWidth={2} strokeOpacity={0.8} />
          {/* Middle Ring */}
          <Circle cx={18} cy={18} r={10} stroke={colors.primary} strokeWidth={2} strokeOpacity={0.9} />
          {/* Bullseye Core */}
          <Circle cx={18} cy={18} r={4.5} fill={colors.primary} />
        </Svg>
      </View>

      {/* Center Mission Details */}
      <View style={styles.detailsCol}>
        <Text style={[styles.missionLabel, { color: colors.textMuted }]}>Today&apos;s Mission</Text>
        <Text style={[styles.missionTitle, { color: colors.text }]}>Complete {targetCount} tasks</Text>

        {/* Dynamic Stylized Red Brush Underline */}
        <Svg width={120} height={6} viewBox="0 0 120 6" fill="none" style={styles.brushUnderline}>
          <Path
            d="M2 3 Q 30 1 60 4 T 118 2"
            stroke={colors.primary}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Right Progress Ratio & Chevron */}
      <View style={styles.ratioCol}>
        <View style={styles.ratioRow}>
          <Text style={styles.ratioText}>
            <Text style={[styles.ratioCompleted, { color: colors.text }]}>{completedCount}</Text>
            <Text style={[styles.ratioTotal, { color: colors.textMuted }]}> / {targetCount}</Text>
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </View>
    </WebButtonInteraction>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  targetWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  missionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brushUnderline: {
    marginTop: 2,
  },
  ratioCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratioText: {
    fontSize: 15,
    fontWeight: '800',
  },
  ratioCompleted: {},
  ratioTotal: {},
});
