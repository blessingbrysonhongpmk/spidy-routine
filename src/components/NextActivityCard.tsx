import { Radii, Spacing, SpideyColors } from '@/constants/theme';
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
 * Signature Thor-inspired high-voltage Action Card from mockup media_1793517437380_64339483.jpg.
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
  const { triggerLightning } = useLightning();

  const handleDonePress = () => {
    triggerLightning({ intensity: 'light', playSoundEffect: false });
    onComplete();
  };

  return (
    <View style={styles.card}>
      {/* Background Electric Lightning Texture */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" fill="none">
          <Path
            d="M20 0 L45 35 L35 48 L70 95"
            stroke="#0EA5E9"
            strokeWidth="0.75"
            strokeOpacity="0.12"
          />
          <Path
            d="M220 0 L250 40 L235 55 L275 100"
            stroke="#38BDF8"
            strokeWidth="0.6"
            strokeOpacity="0.09"
          />
        </Svg>
      </View>

      {/* Left Glowing Lightning Bolt Badge */}
      <View style={styles.boltBadge}>
        <Ionicons name="flash" size={19} color="#38BDF8" />
      </View>

      {/* Center Details */}
      <View style={styles.details}>
        <Text style={styles.tagText}>Next Activity</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color="#94A3B8" />
          <Text style={styles.timeText}>
            {time} • {category}
          </Text>
        </View>
      </View>

      {/* Mjolnir Subtle Watermark (SVG) */}
      <View style={styles.mjolnirWatermark} pointerEvents="none">
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 5 H18 V11 H6 Z M11 11 V20 H13 V11 Z"
            fill="#38BDF8"
            fillOpacity="0.08"
          />
        </Svg>
      </View>

      {/* Done Action Button with Web Pull */}
      <WebButtonInteraction
        style={[styles.doneButton, isCompleted && styles.doneButtonCompleted]}
        onPress={handleDonePress}
        variant="compact"
        sound="electricCrackle"
        haptic="success"
        accessibilityLabel={`Mark ${title} as complete`}
      >
        <Ionicons
          name="checkmark"
          size={16}
          color={isCompleted ? SpideyColors.textMuted : '#FFFFFF'}
        />
        <Text style={[styles.doneButtonText, isCompleted && styles.doneButtonTextCompleted]}>
          Done
        </Text>
      </WebButtonInteraction>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: '#0A0E18',
    borderRadius: Radii.lg,
    borderWidth: 1.2,
    borderColor: 'rgba(14, 165, 233, 0.45)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  boltBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(14, 165, 233, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  tagText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    color: SpideyColors.textPrimary,
    fontSize: 16,
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
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  mjolnirWatermark: {
    position: 'absolute',
    right: 90,
    top: 8,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.2,
    borderColor: '#38BDF8',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    gap: 5,
  },
  doneButtonCompleted: {
    backgroundColor: SpideyColors.surface,
    borderColor: SpideyColors.borderSubtle,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  doneButtonTextCompleted: {
    color: SpideyColors.textMuted,
  },
});
