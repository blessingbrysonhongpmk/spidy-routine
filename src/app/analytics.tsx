import { AppScreenShell } from '@/components/AppScreenShell';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { computeDashboardAnalytics } from '@/services/dashboardAnalytics';
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
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type TimeRange = 'week' | 'month' | 'year';

export default function AnalyticsScreen() {
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

  const [range, setRange] = useState<TimeRange>('week');
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

  // Build SVG path for Weekly/Monthly Progress line chart
  const chartPoints = useMemo(() => {
    if (range === 'week') {
      return analytics.weekly.days.map((d) => ({
        label: d.dayShort.slice(0, 3),
        value: d.totalTasks > 0 ? d.completionRate : d.routinesCompleted > 0 ? 100 : 0,
        count: d.tasksCompleted + d.routinesCompleted,
      }));
    }
    if (range === 'month') {
      return analytics.monthly.weeks.map((w) => ({
        label: w.label,
        value: w.completionRate,
        count: w.completedTasks,
      }));
    }
    // Year overview by quarter/month buckets from real tasks
    const monthLabels = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];
    const currentYear = todayStr.slice(0, 4);
    return monthLabels.map((lbl, idx) => {
      const mStart = idx * 2 + 1;
      const mEnd = mStart + 1;
      const matching = (allTasks || []).filter((t) => {
        if (!t.date.startsWith(currentYear)) return false;
        const m = parseInt(t.date.split('-')[1], 10);
        return m >= mStart && m <= mEnd;
      });
      const done = matching.filter((t) => t.completed).length;
      const pct = matching.length > 0 ? Math.round((done / matching.length) * 100) : 0;
      return { label: lbl, value: pct, count: done };
    });
  }, [range, analytics.weekly.days, analytics.monthly.weeks, allTasks, todayStr]);

  const headlinePercent =
    range === 'week'
      ? analytics.weekly.weeklyAvgRate
      : range === 'month'
        ? analytics.monthly.monthlyCompletionRate
        : allTasks.length > 0
          ? Math.round((allTasks.filter((t) => t.completed).length / allTasks.length) * 100)
          : 0;

  // Build Category Donut segments
  const categoryStats = analytics.categories.categories;
  const totalCatItems = Math.max(
    1,
    categoryStats.reduce((sum, c) => sum + c.total, 0)
  );
  const donutSize = 112;
  const donutStroke = 18;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCirc = 2 * Math.PI * donutRadius;

  let cumulativeOffset = 0;
  const donutSegments = categoryStats
    .filter((c) => c.total > 0)
    .map((c) => {
      const fraction = c.total / totalCatItems;
      const dashLen = Math.max(0, fraction * donutCirc - 2);
      const offset = cumulativeOffset;
      cumulativeOffset += fraction * donutCirc;
      return {
        ...c,
        sharePct: Math.round(fraction * 100),
        dashLen,
        offset,
      };
    });

  // Chart SVG dimensions
  const svgW = 280;
  const svgH = 100;
  const padX = 12;
  const padY = 12;
  const plotW = svgW - padX * 2;
  const plotH = svgH - padY * 2;

  const coords = chartPoints.map((pt, i) => {
    const x =
      chartPoints.length > 1
        ? padX + (i / (chartPoints.length - 1)) * plotW
        : padX + plotW / 2;
    const y = padY + plotH - (Math.min(100, Math.max(0, pt.value)) / 100) * plotH;
    return { x, y, ...pt };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${svgH - padY} L ${coords[0].x.toFixed(1)} ${svgH - padY} Z`
      : '';

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
          <Ionicons name="bar-chart" size={18} color={colors.secondary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
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
          {/* Segment Switcher */}
          <View style={[styles.segmentBar, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            {(['week', 'month', 'year'] as TimeRange[]).map((t) => {
              const active = range === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.segmentBtn,
                    active && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    playSound('buttonTap');
                    triggerHaptic('light');
                    setRange(t);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: active ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Progress Line Chart Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {range === 'week'
                  ? 'Weekly Progress'
                  : range === 'month'
                    ? 'Monthly Progress'
                    : 'Yearly Overview'}
              </Text>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>
                  {analytics.weekly.weeklyTotalCompleted} cleared
                </Text>
              </View>
            </View>

            <View style={styles.headlineRow}>
              <Text style={[styles.bigPercent, { color: colors.text }]}>{headlinePercent}%</Text>
              <Text style={[styles.trendSub, { color: '#10B981' }]}>
                ↑ Avg Completion Rate
              </Text>
            </View>

            {/* Line / Area SVG */}
            <View style={styles.chartContainer}>
              <Svg width="100%" height={115} viewBox={`0 0 ${svgW} ${svgH}`}>
                <Defs>
                  <LinearGradient id="areaFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                    <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
                  </LinearGradient>
                </Defs>
                {areaPath ? <Path d={areaPath} fill="url(#areaFillGrad)" /> : null}
                {linePath ? (
                  <Path
                    d={linePath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                {coords.map((pt, i) => (
                  <Circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={3.5}
                    fill="#10B981"
                    stroke="#0B0C0E"
                    strokeWidth={1.5}
                  />
                ))}
              </Svg>

              <View style={styles.chartLabelsRow}>
                {chartPoints.map((pt, idx) => (
                  <Text key={idx} style={[styles.chartLabel, { color: colors.textMuted }]}>
                    {pt.label}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Category Breakdown Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 14 }]}>
              Category Breakdown
            </Text>

            <View style={styles.breakdownRow}>
              <View style={styles.donutBox}>
                <Svg width={donutSize} height={donutSize}>
                  <Circle
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={donutRadius}
                    stroke={colors.borderSubtle}
                    strokeWidth={donutStroke}
                    fill="none"
                  />
                  {donutSegments.map((seg) => (
                    <Circle
                      key={seg.category}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      stroke={seg.color}
                      strokeWidth={donutStroke}
                      strokeDasharray={`${seg.dashLen} ${donutCirc}`}
                      strokeDashoffset={-seg.offset}
                      transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                      fill="none"
                    />
                  ))}
                </Svg>
              </View>

              <View style={styles.categoryList}>
                {donutSegments.length > 0 ? (
                  donutSegments.slice(0, 5).map((cat) => (
                    <View key={cat.category} style={styles.catItemRow}>
                      <View style={styles.catLeft}>
                        <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                        <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                          {cat.label}
                        </Text>
                      </View>
                      <Text style={[styles.catPct, { color: colors.textSecondary }]}>
                        {cat.sharePct}%
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyNote, { color: colors.textMuted }]}>
                    Create tasks with categories to view distribution.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Streak & Routine Summary Footer */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <View style={styles.streakFooterRow}>
              <View style={styles.streakFooterLeft}>
                <View style={styles.flameCircle}>
                  <Ionicons name="flame" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Current Streak</Text>
                  <Text style={[styles.streakHighlight, { color: '#F59E0B' }]}>
                    {analytics.streak.currentStreak} Days
                  </Text>
                  <Text style={[styles.streakBest, { color: colors.textMuted }]}>
                    Best: {analytics.streak.longestStreak} Days • Adherence: {analytics.routines.weeklyAdherence}%
                  </Text>
                </View>
              </View>

              <Ionicons name="trophy" size={24} color="#F59E0B" />
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
    paddingTop: 14,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  segmentBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  trendBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  bigPercent: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  trendSub: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  chartContainer: {
    marginTop: 4,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 4,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  donutBox: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: {
    flex: 1,
    gap: 8,
  },
  catItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyNote: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  streakFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flameCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakHighlight: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
  },
  streakBest: {
    fontSize: 11.5,
    marginTop: 2,
  },
});

