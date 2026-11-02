import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
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
 * Signature "Today's Mission" card inspired by reference mockup media_1793517437380_64339483.jpg.
 * Features red bullseye target, dynamic task goal with red brush underline, and live count tally.
 */
export const TodayMissionCard: React.FC<TodayMissionCardProps> = ({
  completedTasks,
  totalTasks,
  onPress,
}) => {
  const { playSound, triggerHaptic } = useSound();

  const handlePress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    onPress();
  };

  const targetCount = totalTasks > 0 ? totalTasks : 5;
  const completedCount = completedTasks;

  return (
    <WebButtonInteraction
      style={styles.card}
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
          <Circle cx={18} cy={18} r={16} stroke={SpideyColors.spideyRed} strokeWidth={2} strokeOpacity={0.8} />
          {/* Middle Ring */}
          <Circle cx={18} cy={18} r={10} stroke={SpideyColors.spideyRed} strokeWidth={2} strokeOpacity={0.9} />
          {/* Bullseye Core */}
          <Circle cx={18} cy={18} r={4.5} fill={SpideyColors.spideyRed} />
        </Svg>
      </View>

      {/* Center Mission Details */}
      <View style={styles.detailsCol}>
        <Text style={styles.missionLabel}>Today&apos;s Mission</Text>
        <Text style={styles.missionTitle}>Complete {targetCount} tasks</Text>
        
        {/* Dynamic Stylized Red Brush Underline */}
        <Svg width={120} height={6} viewBox="0 0 120 6" fill="none" style={styles.brushUnderline}>
          <Path
            d="M2 3 Q 30 1 60 4 T 118 2"
            stroke={SpideyColors.spideyRed}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Right Progress Ratio & Chevron */}
      <View style={styles.ratioCol}>
        <View style={styles.ratioRow}>
          <Text style={styles.ratioText}>
            <Text style={styles.ratioCompleted}>{completedCount}</Text>
            <Text style={styles.ratioTotal}> / {targetCount}</Text>
          </Text>
          <Ionicons name="chevron-forward" size={16} color={SpideyColors.textMuted} />
        </View>
      </View>
    </WebButtonInteraction>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: '#0C0E14',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: SpideyColors.spideyRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
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
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  missionTitle: {
    color: SpideyColors.textPrimary,
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
  ratioCompleted: {
    color: SpideyColors.textPrimary,
  },
  ratioTotal: {
    color: SpideyColors.textMuted,
  },
});
