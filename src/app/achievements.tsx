import { AppScreenShell } from '@/components/AppScreenShell';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { AchievementMilestone, computeDashboardAnalytics } from '@/services/dashboardAnalytics';
import { getTodayDateString } from '@/services/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { playSound, triggerHaptic } = useSound();
  const {
    todayTasks,
    allTasks,
    todayRoutines,
    itemsByCategory,
    progress,
    userStats,
    routineCompletions,
  } = useDatabase();

  const [selected, setSelected] = useState<AchievementMilestone | null>(null);
  const todayStr = getTodayDateString();

  const analytics = useMemo(() => {
    return computeDashboardAnalytics({
      todayDate: todayStr,
      tasksToday: todayTasks,
      allTasks: allTasks || [],
      routines: todayRoutines || [],
      itemsByCategory,
      progress,
      userStats,
      routineCompletions: routineCompletions || [],
    });
  }, [
    todayStr,
    todayTasks,
    allTasks,
    todayRoutines,
    itemsByCategory,
    progress,
    userStats,
    routineCompletions,
  ]);

  const unlockedCount = analytics.achievements.filter((a) => a.unlocked).length;
  const nextMilestone = analytics.achievements.find((a) => !a.unlocked);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '#38BDF8';
      case 'gold':
        return '#F59E0B';
      case 'silver':
        return '#CBD5E1';
      default:
        return '#EF4444';
    }
  };

  return (
    <AppScreenShell topBreathingSpace={8} applyBottomInset={true}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          activeOpacity={0.75}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Ionicons name="trophy" size={18} color="#F59E0B" />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Achievements</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 32) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>
          {/* Hero Trophy Showcase */}
          <View style={styles.heroBox}>
            <View style={styles.trophyGlowRing}>
              <Ionicons name="trophy" size={44} color="#F59E0B" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Keep Going!</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              {analytics.streak.currentStreak > 0
                ? `You're on a ${analytics.streak.currentStreak}-day streak! (${unlockedCount}/${analytics.achievements.length} badges)`
                : `${unlockedCount} of ${analytics.achievements.length} milestones unlocked`}
            </Text>
          </View>

          {/* 3-Column Crest Badge Grid */}
          <View style={styles.badgeGrid}>
            {analytics.achievements.map((ach) => {
              const tierColor = getTierColor(ach.tier);
              const isSelected = selected?.id === ach.id;

              return (
                <TouchableOpacity
                  key={ach.id}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected
                        ? colors.secondary
                        : ach.unlocked
                          ? `${tierColor}45`
                          : colors.borderSubtle,
                      opacity: ach.unlocked ? 1 : 0.68,
                    },
                  ]}
                  onPress={() => {
                    playSound(ach.unlocked ? 'thunderMilestone' : 'buttonTap');
                    triggerHaptic('light');
                    setSelected(isSelected ? null : ach);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.crestCircle,
                      {
                        backgroundColor: ach.unlocked ? `${tierColor}20` : colors.inputBackground,
                        borderColor: ach.unlocked ? tierColor : colors.borderMuted,
                      },
                    ]}
                  >
                    <Ionicons
                      name={ach.icon as any}
                      size={22}
                      color={ach.unlocked ? tierColor : colors.textMuted}
                    />
                  </View>

                  <Text
                    style={[styles.badgeName, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {ach.title}
                  </Text>

                  <Text
                    style={[
                      styles.badgeStatus,
                      { color: ach.unlocked ? tierColor : colors.textMuted },
                    ]}
                  >
                    {ach.unlocked ? 'Unlocked' : `${ach.current}/${ach.target}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Detail Banner */}
          {selected ? (
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.secondaryBorder }]}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>{selected.title}</Text>
              <Text style={[styles.detailDesc, { color: colors.textSecondary }]}>
                {selected.description}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(selected.progress * 100)}%`,
                      backgroundColor: selected.unlocked ? '#10B981' : colors.secondary,
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}

          {/* Next Milestone Encouragement Banner */}
          <View style={[styles.footerCard, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <Text style={[styles.footerTitle, { color: colors.text }]}>
              {"You're doing great!"}
            </Text>
            <Text style={[styles.footerSub, { color: colors.textSecondary }]}>
              {nextMilestone
                ? `Next badge: ${nextMilestone.title} (${nextMilestone.current}/${nextMilestone.target})`
                : 'All operational milestones unlocked!'}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle, marginTop: 10 }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${nextMilestone
                        ? Math.max(8, Math.round(nextMilestone.progress * 100))
                        : 100
                      }%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 22,
  },
  trophyGlowRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 13.5,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  badgeCard: {
    width: '31%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  crestCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
  },
  badgeStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  footerSub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

