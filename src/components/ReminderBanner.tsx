import { Radii, Spacing } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ReminderBannerProps {
  task: Task;
  onPress: (task: Task) => void;
  onDismiss?: () => void;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({ task, onPress }) => {
  const { playSound, triggerHaptic } = useSound();

  const handlePress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    onPress(task);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.banner,
          {
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Reminder: ${task.title}`}
      >
        <View style={styles.bellIconBox}>
          <Ionicons name="notifications" size={16} color="#EF4444" />
        </View>

        <View style={styles.textBox}>
          <Text style={styles.bannerHeader}>IMPORTANT REMINDER</Text>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {task.title}
          </Text>
        </View>

        {task.time ? (
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color="#EF4444" />
            <Text style={styles.timeText}>{task.time}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  bellIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  bannerHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
});
