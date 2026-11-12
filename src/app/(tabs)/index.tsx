import { AppScreenShell } from '@/components/AppScreenShell';
import { SpidyAvatar, SpidyLogo } from '@/components/SpidyLogo';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { computeDashboardAnalytics } from '@/services/dashboardAnalytics';
import {
  formatDateHeader,
  formatFullDateLabel,
  formatTimeDisplay,
  getTodayDateString,
  timeToMinutes,
} from '@/services/dateUtils';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { user } = useAuth();
  const { playSound, triggerHaptic } = useSound();
  const {
    todayTasks,
    allTasks,
    todayRoutines,
    itemsByCategory,
    progress,
    userStats,
    routineCompletions,
    refreshData,
    toggleTask,
    error,
  } = useDatabase();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const todayStr = getTodayDateString();
  const dateHeader = useMemo(() => formatDateHeader(todayStr), [todayStr]);
  const displayName = user?.callsign || (user?.name ? user.name.split(' ')[0] : 'Boss');

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

  // Prioritize upcoming/important pending tasks for today & overdue for 1-tap completion
  const upcomingImportantTasks = useMemo(() => {
    const overdue = analytics.today.overdueTasks.map((t) => ({ ...t, _isOverdue: true }));
    const todayPending = todayTasks
      .filter((t) => !t.completed)
      .sort((a, b) => {
        const prioWeight = (p?: string) => (p === 'high' ? 0 : p === 'medium' ? 1 : 2);
        const pwDiff = prioWeight(a.priority) - prioWeight(b.priority);
        if (pwDiff !== 0) return pwDiff;
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      })
      .map((t) => ({ ...t, _isOverdue: false }));

    const upcomingFuture = (allTasks || [])
      .filter((t) => !t.completed && t.date > todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.time) - timeToMinutes(b.time))
      .map((t) => ({ ...t, _isOverdue: false }));

    return [...overdue, ...todayPending, ...upcomingFuture].slice(0, 2);
  }, [analytics.today.overdueTasks, todayTasks, allTasks, todayStr]);

  // Progress ring math
  const ringSize = 90;
  const ringStroke = 9;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const pct = Math.min(100, Math.max(0, analytics.today.overallPercentage));
  const strokeDashoffset = ringCircumference * (1 - pct / 100);

  // Max value in weekly bar chart
  const maxWeeklyVal = Math.max(
    1,
    ...analytics.weekly.days.map((d) => Math.max(d.tasksCompleted + d.routinesCompleted, d.totalTasks, 1))
  );

  const handleQuickCompleteTask = (task: Task) => {
    playSound('taskSuccess');
    triggerHaptic('success');
    toggleTask(task.id, task.completed);
  };

  const handleAddTask = () => {
    playSound('buttonTap');
    triggerHaptic('medium');
    router.push('/modal-task');
  };

  const routineTotal = analytics.today.totalRoutines;
  const routineDone = analytics.today.completedRoutines;
  const routinePct = routineTotal > 0 ? Math.min(100, Math.round((routineDone / routineTotal) * 100)) : 0;

  return (
    <AppScreenShell topBreathingSpace={8} backgroundProps={{ variant: 'minimal', showLightning: false }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 76 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.secondary]}
          />
        }
      >
        <View style={styles.responsiveWrapper}>
          {/* Top Brand & Profile Bar */}
          <View style={styles.topBrandBar}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
              accessibilityLabel="Spidey Flow Home"
            >
              <SpidyLogo variant="full" size={24} />
            </TouchableOpacity>

            <View style={styles.topActionsRow}>
              <TouchableOpacity
                style={styles.profileAvatarBtn}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  router.push('/profile');
                }}
                activeOpacity={0.75}
                accessibilityLabel="Operative Profile"
              >
                <SpidyAvatar
                  size={34}
                  name={displayName}
                  archetype={user?.heroArchetype || 'spiderman'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.settingsIconBtn,
                  { backgroundColor: colors.surface, borderColor: colors.borderMuted },
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  router.push('/(tabs)/settings');
                }}
                activeOpacity={0.75}
                accessibilityLabel="Settings and Profile"
              >
                <Ionicons name="settings-outline" size={19} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 1. Greeting & Current Date */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greetingText, { color: colors.text }]} numberOfLines={1}>
                Hello, {displayName}! 👋
              </Text>
              <Text style={[styles.subGreetingText, { color: colors.textSecondary }]} numberOfLines={1}>
                {"Let's make today count."}
              </Text>
              <Text style={[styles.dateText, { color: colors.textMuted }]} numberOfLines={1}>
                {dateHeader}
              </Text>
            </View>
          </View>

          {/* Error Recovery Notice (Non-destructive) */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.textSecondary }]} numberOfLines={2}>
                {error}
              </Text>
              <TouchableOpacity onPress={onRefresh} style={styles.errorRetry}>
                <Text style={[styles.errorRetryText, { color: colors.danger }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* 2. Current Streak Pill Banner */}
          <TouchableOpacity
            style={[
              styles.streakCard,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
            onPress={() => {
              playSound('buttonTap');
              router.push('/achievements');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.streakLeft}>
              <View style={styles.streakFlameBadge}>
                <Ionicons name="flame" size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.streakTitle, { color: colors.text }]}>
                  {analytics.streak.currentStreak} Day Streak
                </Text>
                <Text style={[styles.streakSub, { color: colors.textMuted }]}>
                  Best: {analytics.streak.longestStreak} days
                </Text>
              </View>
            </View>

            <View style={[styles.viewPillBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.viewPillText, { color: colors.textSecondary }]}>View →</Text>
            </View>
          </TouchableOpacity>

          {/* 3. Today's Productivity Ring Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
          >
            <View style={styles.productivityRow}>
              <View style={styles.ringWrapper}>
                <Svg width={ringSize} height={ringSize}>
                  <Defs>
                    <LinearGradient id="todayProgressGrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor="#10B981" />
                      <Stop offset="100%" stopColor="#38BDF8" />
                    </LinearGradient>
                  </Defs>
                  <Circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    stroke={colors.borderSubtle}
                    strokeWidth={ringStroke}
                    fill="none"
                  />
                  <Circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    stroke="url(#todayProgressGrad)"
                    strokeWidth={ringStroke}
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    fill="none"
                  />
                </Svg>
                <View style={styles.ringCenterText}>
                  <Text style={[styles.ringPercent, { color: colors.text }]}>{pct}%</Text>
                  <Text style={[styles.ringLabel, { color: colors.textMuted }]}>Today</Text>
                </View>
              </View>

              <View style={styles.statsColumn}>
                <View style={styles.statItemRow}>
                  <View style={[styles.statDot, { backgroundColor: '#38BDF8' }]} />
                  <Text style={[styles.statNum, { color: colors.text }]}>
                    {analytics.today.totalTasks}
                  </Text>
                  <Text style={[styles.statName, { color: colors.textSecondary }]}>Total</Text>
                </View>

                <View style={styles.statItemRow}>
                  <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.statNum, { color: colors.text }]}>
                    {analytics.today.completedTasks}
                  </Text>
                  <Text style={[styles.statName, { color: colors.textSecondary }]}>Done</Text>
                </View>

                <View style={styles.statItemRow}>
                  <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.statNum, { color: colors.text }]}>
                    {analytics.today.pendingTasks}
                  </Text>
                  <Text style={[styles.statName, { color: colors.textSecondary }]}>Pending</Text>
                </View>

                <TouchableOpacity
                  style={styles.statItemRow}
                  onPress={() => router.push('/(tabs)/tasks')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.statNum, { color: colors.text }]}>
                    {analytics.today.overdueTasks.length}
                  </Text>
                  <Text style={[styles.statName, { color: colors.textSecondary }]}>Overdue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 4. Compact Weekly Productivity Graph ("This Week") */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>This Week</Text>
              <TouchableOpacity
                onPress={() => {
                  playSound('buttonTap');
                  router.push('/analytics');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.linkAction, { color: colors.secondary }]}>
                  View Analytics →
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.miniChartRow}>
              {analytics.weekly.days.map((day, idx) => {
                const activityCount = day.tasksCompleted + day.routinesCompleted;
                const barPct = Math.max(12, Math.round((activityCount / maxWeeklyVal) * 100));
                const isTodayBar = day.date === todayStr;

                return (
                  <View key={day.date} style={styles.miniBarCol}>
                    <View style={styles.miniBarTrack}>
                      <View
                        style={[
                          styles.miniBarFill,
                          {
                            height: `${activityCount > 0 ? barPct : 10}%`,
                            backgroundColor: isTodayBar
                              ? colors.secondary
                              : activityCount > 0
                                ? 'rgba(56, 189, 248, 0.55)'
                                : colors.borderSubtle,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.miniBarDay,
                        { color: isTodayBar ? colors.text : colors.textMuted },
                        idx === analytics.weekly.days.length - 1 && { fontWeight: '700' },
                      ]}
                    >
                      {day.dayShort.slice(0, 3)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 5. Today's Routine Progress Bar */}
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
            onPress={() => {
              playSound('buttonTap');
              router.push('/(tabs)/routine');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.routineBarTop}>
              <View style={styles.routineBarLeft}>
                <View style={styles.routineIconCircle}>
                  <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {"Today's Routine"}
                </Text>
              </View>

              <View style={styles.routineBarRight}>
                <Text style={[styles.routineRatioText, { color: colors.text }]}>
                  {routineDone} / {routineTotal}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </View>

            <View style={[styles.routineTrack, { backgroundColor: colors.borderSubtle }]}>
              <View
                style={[
                  styles.routineFill,
                  {
                    width: `${routinePct}%`,
                    backgroundColor: routinePct === 100 && routineTotal > 0 ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* 6. Upcoming / Important Pending Tasks */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Upcoming Tasks</Text>
              <TouchableOpacity
                onPress={() => {
                  playSound('buttonTap');
                  router.push('/(tabs)/tasks');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.linkAction, { color: colors.secondary }]}>See all →</Text>
              </TouchableOpacity>
            </View>

            {upcomingImportantTasks.length > 0 ? (
              <View style={styles.taskPreviewList}>
                {upcomingImportantTasks.map((task) => {
                  const timeLabel = task.time ? ` • ${formatTimeDisplay(task.time)}` : '';
                  const dateLabel = task._isOverdue
                    ? 'Overdue'
                    : formatFullDateLabel(task.date);

                  return (
                    <View
                      key={task.id}
                      style={[
                        styles.taskPreviewRow,
                        { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.taskPreviewMain}
                        onPress={() =>
                          router.push({ pathname: '/modal-task', params: { id: task.id } })
                        }
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.taskDotIcon,
                            {
                              backgroundColor: task._isOverdue
                                ? 'rgba(239, 68, 68, 0.16)'
                                : task.priority === 'high'
                                  ? 'rgba(239, 68, 68, 0.14)'
                                  : 'rgba(14, 165, 233, 0.14)',
                            },
                          ]}
                        >
                          <Ionicons
                            name={task._isOverdue ? 'alert-circle' : 'flash'}
                            size={15}
                            color={
                              task._isOverdue || task.priority === 'high'
                                ? colors.primary
                                : colors.secondary
                            }
                          />
                        </View>

                        <View style={styles.taskPreviewTextCol}>
                          <Text
                            style={[styles.taskPreviewTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {task.title}
                          </Text>
                          <Text
                            style={[
                              styles.taskPreviewMeta,
                              { color: task._isOverdue ? colors.danger : colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {dateLabel}
                            {timeLabel}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickCheckBtn}
                        onPress={() => handleQuickCompleteTask(task)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: task.completed }}
                        accessibilityLabel={`Complete ${task.title}`}
                      >
                        <View
                          style={[
                            styles.quickCheckCircle,
                            { borderColor: colors.borderFocus },
                          ]}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={[styles.emptyPreviewText, { color: colors.textMuted }]}>
                  All caught up! No pending tasks right now.
                </Text>
              </View>
            )}
          </View>

          {/* 7. Quick Add CTA (Thumb-Reach Bottom Section) */}
          <View style={styles.quickAddSection}>
            <Text style={[styles.quickAddHeading, { color: colors.text }]}>
              Quick <Text style={{ color: '#F59E0B' }}>Add</Text>
            </Text>

            <TouchableOpacity
              style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddTask}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.quickAddBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  topBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 8,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatarBtn: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  greetingText: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subGreetingText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  errorRetry: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  errorRetryText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 10,
    minHeight: 52,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFlameBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  streakSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  viewPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    marginBottom: 10,
  },
  productivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ringWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  ringLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  statsColumn: {
    flex: 1,
    gap: 6,
  },
  statItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statNum: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 24,
  },
  statName: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  linkAction: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  miniChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    gap: 6,
  },
  miniBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  miniBarTrack: {
    width: '65%',
    maxWidth: 18,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  miniBarFill: {
    width: '100%',
    borderRadius: 5,
    minHeight: 5,
  },
  miniBarDay: {
    fontSize: 10,
    marginTop: 5,
  },
  routineBarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  routineBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routineIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routineRatioText: {
    fontSize: 14,
    fontWeight: '800',
  },
  routineTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  routineFill: {
    height: '100%',
    borderRadius: 4,
  },
  taskPreviewList: {
    gap: 8,
  },
  taskPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 4,
    minHeight: 54,
  },
  taskPreviewMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  taskDotIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskPreviewTextCol: {
    flex: 1,
    minWidth: 0,
  },
  taskPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskPreviewMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  quickCheckBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1.8,
  },
  emptyPreview: {
    paddingVertical: 10,
  },
  emptyPreviewText: {
    fontSize: 13,
  },
  quickAddSection: {
    marginTop: 4,
    gap: 8,
  },
  quickAddHeading: {
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 2,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
