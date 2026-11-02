import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedProgress } from './AnimatedProgress';
import { WebButtonInteraction } from './WebButtonInteraction';

interface HeaderBrandingProps {
  dateHeader: string;
  percentage?: number;
  streakDays?: number;
  onProgressPress?: () => void;
}

/**
 * HeaderBranding:
 * Signature superhero mission dashboard hero section.
 * Aligned 100% with reference mockup media_1793517437380_64339483.jpg.
 * Features stylized comic SPIDEY FLOW branding, personal greeting, dynamic red brush
 * "RISE. TRAIN. CONQUER." motto, streak tracker, and dual-arc progress ring.
 */
export const HeaderBranding: React.FC<HeaderBrandingProps> = ({
  dateHeader,
  percentage,
  streakDays = 1,
  onProgressPress,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { playSound, triggerHaptic } = useSound();

  const handleNotificationPress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push('/(tabs)/settings');
  };

  const handleProfilePress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push('/(tabs)/settings');
  };

  const displayName = user?.name || 'Blessing';

  return (
    <View style={styles.container}>
      {/* Top Application Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandSpidey}>SPIDEY </Text>
          <Text style={styles.brandFlow}>FLOW</Text>
          <View style={styles.brandDot} />
        </View>

        <View style={styles.topActions}>
          <WebButtonInteraction
            style={styles.iconButton}
            onPress={handleNotificationPress}
            variant="icon"
            sound="buttonTap"
            haptic="light"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={19} color={SpideyColors.textSecondary} />
            <View style={styles.notificationDot} />
          </WebButtonInteraction>

          <WebButtonInteraction
            style={styles.avatarButton}
            onPress={handleProfilePress}
            variant="icon"
            sound="buttonTap"
            haptic="light"
            accessibilityLabel="User profile"
          >
            <Image
              source={require('@/assets/images/hero-portrait.jpg')}
              style={styles.avatarImg}
              contentFit="cover"
            />
          </WebButtonInteraction>
        </View>
      </View>

      {/* Hero Greeting and Circular Telemetry Grid */}
      <View style={styles.heroRow}>
        {/* Left Column: Greeting, Subtitle, Date, and Comic Brush Motto */}
        <View style={styles.heroLeftCol}>
          <Text style={styles.greetingText}>
            Hello, <Text style={styles.greetingName}>{displayName}!</Text> 👋
          </Text>
          <Text style={styles.subGreeting}>Let&apos;s make today count.</Text>

          <View style={styles.dateBadgeRow}>
            <Ionicons name="calendar-outline" size={12} color={SpideyColors.textMuted} />
            <Text style={styles.dateLabel}>{dateHeader}</Text>
          </View>

          {/* Bold Comic-Brush Motivational Motto */}
          <View style={styles.mottoWrapper}>
            <Text style={styles.mottoLine1}>RISE. TRAIN.</Text>
            <Text style={styles.mottoLine2}>CONQUER.</Text>
          </View>

          {/* Active Streak Badge */}
          {streakDays > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakText}>
                {streakDays} {streakDays === 1 ? 'DAY' : 'DAYS'} STREAK
              </Text>
            </View>
          )}
        </View>

        {/* Right Column: Glowing Circular Progress Telemetry */}
        {percentage !== undefined && (
          <TouchableOpacity
            style={styles.heroRightCol}
            onPress={onProgressPress}
            activeOpacity={onProgressPress ? 0.8 : 1}
          >
            <AnimatedProgress
              percentage={percentage}
              size={106}
              strokeWidth={6.5}
              label="Today's Progress"
              showIcon={true}
              triggerLightningOnIncrease={true}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandSpidey: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  brandFlow: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: SpideyColors.spideyRed,
    letterSpacing: 1.2,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: SpideyColors.spideyRed,
    marginLeft: 4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: SpideyColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SpideyColors.spideyRed,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: SpideyColors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: SpideyColors.spideyRed,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  heroLeftCol: {
    flex: 1.15,
    paddingRight: Spacing.sm,
  },
  heroRightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Spacing.xs,
  },
  greetingText: {
    color: SpideyColors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  greetingName: {
    color: SpideyColors.textPrimary,
  },
  subGreeting: {
    color: SpideyColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 6,
  },
  dateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  dateLabel: {
    color: SpideyColors.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  mottoWrapper: {
    marginVertical: 4,
    transform: [{ skewX: '-6deg' }],
  },
  mottoLine1: {
    color: SpideyColors.spideyRed,
    fontSize: 19,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  mottoLine2: {
    color: SpideyColors.spideyRed,
    fontSize: 23,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.2,
    marginTop: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs,
    gap: 4,
    marginTop: 6,
    borderWidth: 0.8,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  streakFire: {
    fontSize: 11,
  },
  streakText: {
    color: SpideyColors.spideyRed,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
