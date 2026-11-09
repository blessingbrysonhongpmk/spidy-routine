import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
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
  const colors = useTheme();
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
          <Text style={[styles.brandSpidey, { color: colors.text }]}>SPIDEY </Text>
          <Text style={[styles.brandFlow, { color: colors.primary }]}>FLOW</Text>
          <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
        </View>

        <View style={styles.topActions}>
          <WebButtonInteraction
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={handleNotificationPress}
            variant="icon"
            sound="buttonTap"
            haptic="light"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={19} color={colors.textSecondary} />
            <View style={[styles.notificationDot, { backgroundColor: colors.primary }]} />
          </WebButtonInteraction>

          <WebButtonInteraction
            style={[styles.avatarButton, { borderColor: colors.primary }]}
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
          <Text style={[styles.greetingText, { color: colors.text }]}>
            Hello, <Text style={{ color: colors.text }}>{displayName}!</Text> 👋
          </Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Let&apos;s make today count.</Text>

          <View style={styles.dateBadgeRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.dateLabel, { color: colors.textMuted }]}>{dateHeader}</Text>
          </View>

          {/* Bold Comic-Brush Motivational Motto */}
          <View style={styles.mottoWrapper}>
            <Text style={[styles.mottoLine1, { color: colors.primary }]}>RISE. TRAIN.</Text>
            <Text style={[styles.mottoLine2, { color: colors.primary }]}>CONQUER.</Text>
          </View>

          {/* Active Streak Badge */}
          {streakDays > 0 && (
            <View
              style={[
                styles.streakBadge,
                {
                  backgroundColor: colors.primarySubtle,
                  borderColor: colors.primaryBorder,
                },
              ]}
            >
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={[styles.streakText, { color: colors.primary }]}>
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
    letterSpacing: 1.2,
  },
  brandFlow: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.2,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
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
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subGreeting: {
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
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  mottoWrapper: {
    marginVertical: 4,
    transform: [{ skewX: '-6deg' }],
  },
  mottoLine1: {
    fontSize: 19,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  mottoLine2: {
    fontSize: 23,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.2,
    marginTop: -2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs,
    gap: 4,
    marginTop: 6,
    borderWidth: 0.8,
  },
  streakFire: {
    fontSize: 11,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
