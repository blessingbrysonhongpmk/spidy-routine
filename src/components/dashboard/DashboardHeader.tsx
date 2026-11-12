import { SpidyAvatar, SpidyLogo } from '@/components/SpidyLogo';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DashboardHeaderProps {
  dateHeader: string;
  streakDays: number;
  onAddTaskPress: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dateHeader,
  streakDays,
  onAddTaskPress,
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

  const handleQuickAdd = () => {
    playSound('webShoot');
    triggerHaptic('medium');
    onAddTaskPress();
  };

  const displayName = user?.name || 'Operative';
  const displayMotto = user?.motto || "Your Day. Your Mission.";

  return (
    <View style={styles.container}>
      {/* 1. Top System Bar */}
      <View style={styles.systemBar}>
        <TouchableOpacity
          style={styles.systemBtn}
          onPress={handleMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Open settings"
        >
          <Ionicons name="menu-outline" size={20} color="#E2E8F0" />
        </TouchableOpacity>

        {/* Central Spidy Logo */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.85}
        >
          <SpidyLogo variant="full" size={24} />
        </TouchableOpacity>

        {/* Action Tray: Quick Add Button & Vector Avatar */}
        <View style={styles.actionTray}>
          <TouchableOpacity
            style={styles.quickAddBtn}
            onPress={handleQuickAdd}
            activeOpacity={0.8}
            accessibilityLabel="Create task"
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleProfilePress}
            activeOpacity={0.8}
            accessibilityLabel="Open operative profile"
          >
            <SpidyAvatar
              size={34}
              name={displayName}
              archetype={user?.heroArchetype || 'spiderman'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Personalized Greeting & Live Telemetry Tile */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingLeft}>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.85}>
            <View style={styles.greetingNameRow}>
              <Text style={styles.greetingText}>
                Hello, <Text style={styles.nameHighlight}>{displayName}</Text>
              </Text>
              <Text style={styles.waveHand}>👋</Text>
            </View>
            <Text style={styles.mottoText} numberOfLines={1}>
              {displayMotto}
            </Text>
          </TouchableOpacity>

          <View style={styles.telemetryRow}>
            <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
            <Text style={styles.dateLabel}>{dateHeader}</Text>
            {liveTime ? (
              <>
                <Text style={styles.dotDivider}>•</Text>
                <Ionicons name="time-outline" size={12} color="#38BDF8" />
                <Text style={styles.timeLabel}>{liveTime}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Streak Counter Chip */}
        <View style={styles.streakBadge}>
          <View style={styles.streakGlowContainer}>
            <Text style={styles.streakFlame}>⚡</Text>
          </View>
          <View style={styles.streakMeta}>
            <Text style={styles.streakNumber}>{streakDays}</Text>
            <Text style={styles.streakSubtext}>STREAK</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  systemBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  systemBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionTray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C121E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  greetingLeft: {
    flex: 1,
    minWidth: 0,
  },
  greetingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  nameHighlight: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  waveHand: {
    fontSize: 13,
  },
  mottoText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  dateLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dotDivider: {
    color: '#475569',
    fontSize: 9,
  },
  timeLabel: {
    fontSize: 10.5,
    color: '#38BDF8',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
    flexShrink: 0,
  },
  streakGlowContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakFlame: {
    fontSize: 12,
  },
  streakMeta: {
    alignItems: 'flex-start',
  },
  streakNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F87171',
    lineHeight: 15,
  },
  streakSubtext: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
});

