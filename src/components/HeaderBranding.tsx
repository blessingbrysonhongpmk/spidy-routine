import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedProgress } from './AnimatedProgress';
import { SpidyAvatar, SpidyLogo } from './SpidyLogo';
import { WebButtonInteraction } from './WebButtonInteraction';

interface HeaderBrandingProps {
  dateHeader: string;
  percentage?: number;
  streakDays?: number;
  nextActivityTitle?: string;
  onNextActivityPress?: () => void;
  onProgressPress?: () => void;
  activeTab?: 'today' | 'routine' | 'tasks';
}

/**
 * HeaderBranding:
 * World-class SPIDEY FLOW header and dashboard command module.
 * Independent brand identity with vector SpidyLogo and SpidyAvatar (no personal photos).
 * Compact greeting, live telemetry, and instant mission switcher.
 */
export const HeaderBranding: React.FC<HeaderBrandingProps> = ({
  dateHeader,
  percentage = 0,
  streakDays = 1,
  nextActivityTitle = 'Complete 3 tasks',
  onNextActivityPress,
  onProgressPress,
  activeTab = 'today',
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { playSound, triggerHaptic } = useSound();
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuPress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push('/(tabs)/settings');
  };

  const handleProfilePress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push('/profile');
  };

  const handleTabSwitch = (tab: 'today' | 'routine' | 'tasks') => {
    playSound('buttonTap');
    triggerHaptic('light');
    if (tab === 'today') router.push('/(tabs)');
    if (tab === 'routine') router.push('/(tabs)/routine');
    if (tab === 'tasks') router.push('/(tabs)/tasks');
  };

  const isUnregistered = !user?.name;
  const displayName = isUnregistered ? 'Agent' : user.name;

  return (
    <View style={styles.container}>
      {/* 1. Top Bar: Menu Button, Original SpidyLogo Wordmark, Vector SpidyAvatar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={handleMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Open settings"
        >
          <Ionicons name="menu" size={22} color="#E2E8F0" />
        </TouchableOpacity>

        {/* Original Vector SpidyLogo */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.8}
        >
          <SpidyLogo variant="full" size={26} />
        </TouchableOpacity>

        {/* Vector Operative Avatar Badge (No personal photo) */}
        <TouchableOpacity
          onPress={handleProfilePress}
          activeOpacity={0.8}
          accessibilityLabel="Open profile"
        >
          <SpidyAvatar
            size={36}
            name={displayName}
            archetype={user?.heroArchetype || 'spiderman'}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Compact Command Greeting Row */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingLeft}>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8}>
            <Text style={styles.greetingName}>
              Hello, <Text style={{ color: '#FFFFFF' }}>{displayName}</Text>
            </Text>
            <Text style={styles.subGreeting}>
              {user?.motto || "Let's make today count."}
            </Text>
          </TouchableOpacity>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
            <Text style={styles.dateText}>{dateHeader}</Text>
            {liveTime ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Ionicons name="time-outline" size={13} color="#38BDF8" />
                <Text style={styles.timeText}>{liveTime}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Streak Telemetry Badge */}
        <View style={styles.streakBadge}>
          <Text style={styles.streakFlame}>⚡</Text>
          <View>
            <Text style={styles.streakCount}>{streakDays} DAY</Text>
            <Text style={styles.streakLabel}>STREAK</Text>
          </View>
        </View>
      </View>

      {/* 3. Telemetry HUD Row: Circular Progress & Next Activity */}
      <View style={styles.telemetryRow}>
        {/* Left: Circular Telemetry Dial */}
        <TouchableOpacity
          style={styles.progressCard}
          onPress={onProgressPress}
          activeOpacity={0.8}
        >
          <AnimatedProgress
            percentage={percentage}
            size={96}
            strokeWidth={7}
            label="Today's Progress"
            showIcon={true}
            triggerLightningOnIncrease={true}
          />
        </TouchableOpacity>

        {/* Right: Next Activity Command Tile */}
        <View style={styles.rightCardsCol}>
          {/* Motivation Status Pill */}
          <View style={styles.statusTile}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {percentage >= 100
                ? 'All objectives cleared! Exceptional.'
                : percentage >= 50
                  ? 'Strong momentum. Keep pushing.'
                  : 'Mission active. Ready for deployment.'}
            </Text>
          </View>

          {/* Next Activity Action Card */}
          <TouchableOpacity
            style={styles.nextActivityCard}
            onPress={onNextActivityPress}
            activeOpacity={0.8}
          >
            <View style={styles.targetIconBox}>
              <Ionicons name="radio-button-on" size={16} color="#EF4444" />
            </View>
            <View style={styles.nextActivityTextBox}>
              <Text style={styles.nextActivityLabel}>NEXT OBJECTIVE</Text>
              <Text style={styles.nextActivityTitle} numberOfLines={1}>
                {nextActivityTitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Segmented Switcher: [ Today ] [ Routine ] [ Tasks ] */}
      <View style={styles.segmentedNav}>
        {[
          { key: 'today', label: 'Today', icon: 'calendar-outline' },
          { key: 'routine', label: 'Routine', icon: 'sync-outline' },
          { key: 'tasks', label: 'Tasks', icon: 'checkbox-outline' },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <WebButtonInteraction
              key={tab.key}
              style={[
                styles.navPill,
                isSelected && styles.navPillActive,
              ]}
              onPress={() => handleTabSwitch(tab.key as any)}
              variant="compact"
              sound="buttonTap"
              haptic="light"
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isSelected ? '#EF4444' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.navPillText,
                  isSelected && styles.navPillTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </WebButtonInteraction>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C121D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: Spacing.md,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  subGreeting: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dotSeparator: {
    color: '#475569',
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  streakFlame: {
    fontSize: 14,
  },
  streakCount: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#38BDF8',
  },
  streakLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  telemetryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  progressCard: {
    backgroundColor: '#0C121D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 116,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  rightCardsCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  statusTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1624',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    flex: 1,
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
    lineHeight: 15,
  },
  nextActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1624',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  targetIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextActivityTextBox: {
    flex: 1,
  },
  nextActivityLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.6,
  },
  nextActivityTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 1,
  },
  segmentedNav: {
    flexDirection: 'row',
    backgroundColor: '#090E17',
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.sm,
  },
  navPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  navPillActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  navPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
