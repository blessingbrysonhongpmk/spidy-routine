import { useLightning } from '@/components/LightningEffect';
import { useSound } from '@/context/SoundContext';
import { AchievementMilestone } from '@/services/dashboardAnalytics';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AchievementsCardProps {
  achievements: AchievementMilestone[];
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({
  achievements,
}) => {
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleAchievementPress = (ach: AchievementMilestone) => {
    if (ach.unlocked) {
      playSound('thunderMilestone');
      triggerLightning({ intensity: 'light' });
      triggerHaptic('success');
    } else {
      playSound('buttonTap');
      triggerHaptic('light');
    }
    setSelectedId((prev) => (prev === ach.id ? null : ach.id));
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '#38BDF8';
      case 'gold':
        return '#F59E0B';
      case 'silver':
        return '#CBD5E1';
      case 'bronze':
      default:
        return '#CD7F32';
    }
  };

  return (
    <View style={styles.card}>
      {/* 1. Header with Unlock Count Badge */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy-outline" size={14} color="#F59E0B" />
          <Text style={styles.title} numberOfLines={1}>OPERATIVE MILESTONES</Text>
        </View>

        <View style={styles.unlockedBadge}>
          <Text style={styles.unlockedCount} numberOfLines={1}>
            {unlockedCount}/{achievements.length} UNLOCKED
          </Text>
        </View>
      </View>

      {/* 2. Achievements Grid (2 columns) */}
      <View style={styles.grid}>
        {achievements.map((ach) => {
          const tierColor = getTierColor(ach.tier);
          const isSelected = selectedId === ach.id;

          return (
            <TouchableOpacity
              key={ach.id}
              style={[
                styles.badgeTile,
                ach.unlocked ? styles.badgeUnlocked : styles.badgeLocked,
                isSelected && styles.badgeSelected,
              ]}
              onPress={() => handleAchievementPress(ach)}
              activeOpacity={0.8}
            >
              <View style={styles.tileTopRow}>
                {/* Vector Symbol */}
                <View
                  style={[
                    styles.iconBox,
                    ach.unlocked
                      ? {
                          backgroundColor: `${tierColor}20`,
                          borderColor: `${tierColor}50`,
                        }
                      : styles.iconBoxLocked,
                  ]}
                >
                  <Ionicons
                    name={ach.icon as any}
                    size={16}
                    color={ach.unlocked ? tierColor : '#475569'}
                  />
                </View>

                {/* Tier indicator pill */}
                <View
                  style={[
                    styles.tierPill,
                    ach.unlocked
                      ? { backgroundColor: `${tierColor}25` }
                      : { backgroundColor: '#1E293B' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierText,
                      ach.unlocked ? { color: tierColor } : { color: '#64748B' },
                    ]}
                  >
                    {ach.unlocked ? 'CLEARED' : 'LOCKED'}
                  </Text>
                </View>
              </View>

              {/* Title & CodeName */}
              <Text
                style={[
                  styles.badgeTitle,
                  ach.unlocked ? { color: '#F8FAFC' } : { color: '#64748B' },
                ]}
                numberOfLines={1}
              >
                {ach.title}
              </Text>

              <Text style={styles.badgeCodeName} numberOfLines={1}>{ach.codeName}</Text>

              {/* Mini Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(ach.progress * 100)}%`,
                      backgroundColor: ach.unlocked ? tierColor : '#334155',
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressLabel} numberOfLines={1}>
                {ach.unlocked
                  ? 'Objective Completed'
                  : `${ach.current}/${ach.target} Progress`}
              </Text>

              {/* Expanded Description on Tap */}
              {isSelected ? (
                <View style={styles.expandedDescBox}>
                  <Text style={styles.expandedDescText}>{ach.description}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C121E',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  unlockedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    flexShrink: 0,
  },
  unlockedCount: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#F59E0B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeTile: {
    width: '48%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 9,
  },
  badgeUnlocked: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgeLocked: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.75,
  },
  badgeSelected: {
    borderColor: '#38BDF8',
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLocked: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tierPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  badgeCodeName: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginTop: 1,
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
  },
  expandedDescBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  expandedDescText: {
    fontSize: 9.5,
    color: '#CBD5E1',
    lineHeight: 13,
  },
});

