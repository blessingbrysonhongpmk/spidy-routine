import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLightning } from './LightningEffect';
import { WebButtonInteraction } from './WebButtonInteraction';

interface NextActivityCardProps {
  title: string;
  time?: string;
  category?: string;
  onComplete: () => void;
  isCompleted?: boolean;
}

/**
 * NextActivityCard:
 * Signature Thor-inspired high-voltage Action Card.
 * Features electric-blue lightning glow, ⚡ bolt badge, Mjolnir subtle watermark,
 * and web-pull [✓ Done] action button.
 */
export const NextActivityCard: React.FC<NextActivityCardProps> = ({
  title,
  time = '10:00 AM',
  category = 'Focus Mode',
  onComplete,
  isCompleted = false,
}) => {
  const colors = useTheme();
  const { triggerLightning } = useLightning();

  const handleDonePress = () => {
    triggerLightning({ intensity: 'light', playSoundEffect: false });
    onComplete();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.secondaryBorder,
        },
      ]}
    >
      {/* Background Electric Lightning Texture */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" fill="none">
          <Path
            d="M20 0 L45 35 L35 48 L70 95"
            stroke={colors.secondary}
            strokeWidth="0.75"
            strokeOpacity="0.12"
          />
          <Path
            d="M220 0 L250 40 L235 55 L275 100"
            stroke={colors.secondary}
            strokeWidth="0.6"
            strokeOpacity="0.09"
          />
        </Svg>
      </View>

      {/* Left Glowing Lightning Bolt Badge */}
      <View
        style={[
          styles.boltBadge,
          {
            backgroundColor: colors.secondarySubtle,
            borderColor: colors.secondaryBorder,
          },
        ]}
      >
        <Ionicons name="flash" size={19} color={colors.secondary} />
      </View>

      {/* Center Details */}
      <View style={styles.details}>
        <Text style={[styles.tagText, { color: colors.secondary }]}>Next Activity</Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {time} • {category}
          </Text>
        </View>
      </View>

      {/* Mjolnir Subtle Watermark (SVG) */}
      <View style={styles.mjolnirWatermark} pointerEvents="none">
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 5 H18 V11 H6 Z M11 11 V20 H13 V11 Z"
            fill={colors.secondary}
            fillOpacity="0.08"
          />
        </Svg>
      </View>

      {/* Done Action Button with Web Pull */}
      <WebButtonInteraction
        style={[
          styles.doneButton,
          { backgroundColor: isCompleted ? colors.borderSubtle : colors.secondary },
        ]}
        onPress={handleDonePress}
        variant="compact"
        sound="electricCrackle"
        haptic="success"
        accessibilityLabel={`Mark ${title} as complete`}
      >
        <Ionicons
          name="checkmark"
          size={16}
          color={isCompleted ? colors.textMuted : '#FFFFFF'}
        />
        <Text
          style={[
            styles.doneText,
            { color: isCompleted ? colors.textMuted : '#FFFFFF' },
          ]}
        >
          {isCompleted ? 'Done' : 'Done'}
        </Text>
      </WebButtonInteraction>
    </View>
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
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
  },
  boltBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  mjolnirWatermark: {
    position: 'absolute',
    right: 76,
    top: 8,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: Radii.pill,
    gap: 4,
    marginLeft: 8,
  },
  doneText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
