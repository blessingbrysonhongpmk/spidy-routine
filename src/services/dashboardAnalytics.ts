import { Routine, RoutineCategory, RoutineItem, Task } from '@/types';
import { RoutineCompletionRecord, UserStats } from './database';
import { getDayOfWeekFromDate } from './dateUtils';

export interface TodayMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: Task[];
  taskPercentage: number;
  totalRoutines: number;
  completedRoutines: number;
  routinePercentage: number;
  overallPercentage: number;
}

export interface DayGraphPoint {
  date: string;
  dayShort: string;
  tasksCompleted: number;
  tasksCreated: number;
  totalTasks: number;
  routinesCompleted: number;
  completionRate: number;
}

export interface WeeklyGraphData {
  days: DayGraphPoint[];
  weeklyTotalCompleted: number;
  weeklyTotalTasks: number;
  weeklyAvgRate: number;
  peakDayName: string;
}

export interface WeekBlock {
  label: string;
  dateRange: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface MonthlyGraphData {
  weeks: WeekBlock[];
  monthlyTotalCompleted: number;
  monthlyTotalTasks: number;
  monthlyCompletionRate: number;
}

export interface CategoryStat {
  category: string;
  label: string;
  color: string;
  total: number;
  completed: number;
  rate: number;
}

export interface CategoryAnalyticsData {
  categories: CategoryStat[];
  taskVsRoutineRatio: {
    tasksCompleted: number;
    routinesCompleted: number;
    taskPercent: number;
    routinePercent: number;
  };
}

export interface HeatmapCell {
  date: string;
  dayLetter: string;
  count: number;
  intensity: 0 | 1 | 2 | 3;
  isToday: boolean;
}

export interface StreakAndConsistencyData {
  currentStreak: number;
  longestStreak: number;
  weeklyConsistencyRate: number;
  monthlyConsistencyRate: number;
  heatmap: HeatmapCell[];
}

export interface RoutineAnalyticsData {
  todayTotal: number;
  todayCompleted: number;
  todayRate: number;
  remainingRoutines: number;
  weeklyAdherence: number;
  mostConsistentRoutine: {
    name: string;
    completionsCount: number;
  } | null;
}

export interface AchievementMilestone {
  id: string;
  title: string;
  codeName: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  progress: number;
  unlocked: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface ProductivityInsightsData {
  hasData: boolean;
  peakDayInsight: string | null;
  monthlyRateInsight: string | null;
  topRoutineInsight: string | null;
  weeklyMomentumInsight: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: '#38BDF8',
  work: '#EF4444',
  personal: '#A855F7',
  health: '#10B981',
  study: '#F59E0B',
  morning: '#F59E0B',
  afternoon: '#38BDF8',
  evening: '#818CF8',
  night: '#6366F1',
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS COMPUTATION PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

export function computeDashboardAnalytics(params: {
  todayDate: string;
  tasksToday: Task[];
  allTasks: Task[];
  routines: (Routine & { items: RoutineItem[] })[];
  itemsByCategory: Record<RoutineCategory, RoutineItem[]>;
  progress: {
    totalTasks: number;
    completedTasks: number;
    totalRoutineItems: number;
    completedRoutineItems: number;
    percentage: number;
  };
  userStats: UserStats;
  routineCompletions: RoutineCompletionRecord[];
}): {
  today: TodayMetrics;
  weekly: WeeklyGraphData;
  monthly: MonthlyGraphData;
  categories: CategoryAnalyticsData;
  streak: StreakAndConsistencyData;
  routines: RoutineAnalyticsData;
  achievements: AchievementMilestone[];
  insights: ProductivityInsightsData;
} {
  const {
    todayDate,
    tasksToday,
    allTasks,
    routines,
    progress,
    userStats,
    routineCompletions,
  } = params;

  // 1. TODAY'S METRICS
  const todayTasksList = tasksToday || [];
  const completedTasksToday = todayTasksList.filter((t) => t.completed).length;
  const pendingTasksToday = todayTasksList.filter((t) => !t.completed).length;

  // Overdue tasks: any uncompleted task from an earlier date than today
  const overdueTasks = (allTasks || []).filter(
    (t) => !t.completed && t.date < todayDate
  );

  const taskPercentage =
    todayTasksList.length > 0
      ? Math.round((completedTasksToday / todayTasksList.length) * 100)
      : 0;

  const totalRoutinesToday = progress.totalRoutineItems;
  const completedRoutinesToday = progress.completedRoutineItems;
  const routinePercentage =
    totalRoutinesToday > 0
      ? Math.round((completedRoutinesToday / totalRoutinesToday) * 100)
      : 0;

  const todayMetrics: TodayMetrics = {
    totalTasks: todayTasksList.length,
    completedTasks: completedTasksToday,
    pendingTasks: pendingTasksToday,
    overdueTasks,
    taskPercentage,
    totalRoutines: totalRoutinesToday,
    completedRoutines: completedRoutinesToday,
    routinePercentage,
    overallPercentage: progress.percentage,
  };

  // 2. WEEKLY GRAPH (Last 7 Days)
  const [tYear, tMonth, tDay] = todayDate.split('-').map(Number);
  const anchorDate = new Date(tYear, tMonth - 1, tDay);

  const weeklyDays: DayGraphPoint[] = [];
  let weeklyTotalCompleted = 0;
  let weeklyTotalTasks = 0;
  let peakDayName = '';
  let peakCompletions = -1;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - i);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;

    const dayShort = getDayOfWeekFromDate(dateStr);

    const dayTasks = allTasks.filter((t) => t.date === dateStr);
    const completed = dayTasks.filter((t) => t.completed).length;
    const created = allTasks.filter((t) => {
      if (!t.created_at) return t.date === dateStr;
      return t.created_at.startsWith(dateStr) || t.date === dateStr;
    }).length;

    const rCompletions = routineCompletions.filter(
      (rc) => rc.completed_date === dateStr
    ).length;

    const total = dayTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : (rCompletions > 0 ? 100 : 0);

    weeklyTotalCompleted += completed;
    weeklyTotalTasks += total;

    const combinedScore = completed + rCompletions;
    if (combinedScore > peakCompletions) {
      peakCompletions = combinedScore;
      peakDayName = dayShort;
    }

    weeklyDays.push({
      date: dateStr,
      dayShort,
      tasksCompleted: completed,
      tasksCreated: created,
      totalTasks: total,
      routinesCompleted: rCompletions,
      completionRate: rate,
    });
  }

  const weeklyAvgRate =
    weeklyTotalTasks > 0
      ? Math.round((weeklyTotalCompleted / weeklyTotalTasks) * 100)
      : (weeklyTotalCompleted > 0 ? 100 : 0);

  const weeklyGraphData: WeeklyGraphData = {
    days: weeklyDays,
    weeklyTotalCompleted,
    weeklyTotalTasks,
    weeklyAvgRate,
    peakDayName: peakDayName || 'Today',
  };

  // 3. MONTHLY GRAPH (Current Month grouped by weeks)
  const currentMonthStr = `${tYear}-${String(tMonth).padStart(2, '0')}`;
  const monthTasks = allTasks.filter((t) => t.date.startsWith(currentMonthStr));
  const monthCompleted = monthTasks.filter((t) => t.completed).length;
  const monthRate =
    monthTasks.length > 0
      ? Math.round((monthCompleted / monthTasks.length) * 100)
      : 0;

  // Partition month into 4 distinct blocks: 1-7, 8-14, 15-21, 22-end
  const weekDefinitions = [
    { label: 'W1', start: 1, end: 7, dateRange: '1–7' },
    { label: 'W2', start: 8, end: 14, dateRange: '8–14' },
    { label: 'W3', start: 15, end: 21, dateRange: '15–21' },
    { label: 'W4', start: 22, end: 31, dateRange: '22+' },
  ];

  const monthWeeks: WeekBlock[] = weekDefinitions.map((w) => {
    const tasksInBlock = monthTasks.filter((t) => {
      const dayNum = parseInt(t.date.split('-')[2], 10);
      return dayNum >= w.start && dayNum <= w.end;
    });
    const compInBlock = tasksInBlock.filter((t) => t.completed).length;
    const blockRate =
      tasksInBlock.length > 0
        ? Math.round((compInBlock / tasksInBlock.length) * 100)
        : 0;
    return {
      label: w.label,
      dateRange: w.dateRange,
      totalTasks: tasksInBlock.length,
      completedTasks: compInBlock,
      completionRate: blockRate,
    };
  });

  const monthlyGraphData: MonthlyGraphData = {
    weeks: monthWeeks,
    monthlyTotalCompleted: monthCompleted,
    monthlyTotalTasks: monthTasks.length,
    monthlyCompletionRate: monthRate,
  };

  // 4. CATEGORY BREAKDOWN
  const categoryMap = new Map<string, { total: number; completed: number }>();
  for (const t of allTasks) {
    const cat = (t.category || 'general').toLowerCase();
    const curr = categoryMap.get(cat) || { total: 0, completed: 0 };
    curr.total += 1;
    if (t.completed) curr.completed += 1;
    categoryMap.set(cat, curr);
  }

  // Ensure default categories exist if empty
  if (categoryMap.size === 0) {
    categoryMap.set('general', { total: 0, completed: 0 });
    categoryMap.set('work', { total: 0, completed: 0 });
    categoryMap.set('personal', { total: 0, completed: 0 });
  }

  const categories: CategoryStat[] = Array.from(categoryMap.entries()).map(
    ([cat, val]) => ({
      category: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      color: CATEGORY_COLORS[cat] || '#38BDF8',
      total: val.total,
      completed: val.completed,
      rate: val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0,
    })
  );

  const totalAllTasksCompleted = userStats.totalCompletedTasks;
  const totalAllRoutinesCompleted = userStats.totalCompletedRoutines;
  const totalBoth = totalAllTasksCompleted + totalAllRoutinesCompleted;
  const taskPercent =
    totalBoth > 0 ? Math.round((totalAllTasksCompleted / totalBoth) * 100) : 50;
  const routinePercent = totalBoth > 0 ? 100 - taskPercent : 50;

  const categoryAnalyticsData: CategoryAnalyticsData = {
    categories,
    taskVsRoutineRatio: {
      tasksCompleted: totalAllTasksCompleted,
      routinesCompleted: totalAllRoutinesCompleted,
      taskPercent,
      routinePercent,
    },
  };

  // 5. STREAK & CONSISTENCY (Heatmap for last 21 days)
  const activeDateSet = new Set<string>(userStats.activeDates || []);

  // Also include any tasks completed in loaded memory
  allTasks.forEach((t) => {
    if (t.completed) activeDateSet.add(t.date);
  });
  routineCompletions.forEach((rc) => {
    activeDateSet.add(rc.completed_date);
  });

  // Calculate weekly consistency (how many of last 7 days had completions)
  let activeInWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (activeDateSet.has(dStr)) activeInWeek++;
  }
  const weeklyConsistencyRate = Math.round((activeInWeek / 7) * 100);

  // Calculate monthly consistency (days in current month up to today)
  let activeInMonth = 0;
  const daysInMonthToDate = tDay;
  for (let day = 1; day <= tDay; day++) {
    const dStr = `${tYear}-${String(tMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (activeDateSet.has(dStr)) activeInMonth++;
  }
  const monthlyConsistencyRate =
    daysInMonthToDate > 0
      ? Math.round((activeInMonth / daysInMonthToDate) * 100)
      : 0;

  // 21-day heatmap (3 weeks of 7 days)
  const heatmap: HeatmapCell[] = [];
  for (let i = 20; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];

    const dayTaskCount = allTasks.filter((t) => t.date === dateStr && t.completed).length;
    const dayRoutineCount = routineCompletions.filter((rc) => rc.completed_date === dateStr).length;
    const totalCount = dayTaskCount + dayRoutineCount;

    let intensity: 0 | 1 | 2 | 3 = 0;
    if (totalCount >= 5) intensity = 3;
    else if (totalCount >= 3) intensity = 2;
    else if (totalCount >= 1) intensity = 1;

    heatmap.push({
      date: dateStr,
      dayLetter,
      count: totalCount,
      intensity,
      isToday: dateStr === todayDate,
    });
  }

  const streakData: StreakAndConsistencyData = {
    currentStreak: userStats.streakDays,
    longestStreak: userStats.longestStreak || userStats.streakDays,
    weeklyConsistencyRate,
    monthlyConsistencyRate,
    heatmap,
  };

  // 6. ROUTINE ANALYTICS
  // Most consistent routine: group routineCompletions by routine_name
  const routineAdherenceMap = new Map<string, number>();
  for (const rc of routineCompletions) {
    const name = rc.routine_name || 'Standard Protocol';
    routineAdherenceMap.set(name, (routineAdherenceMap.get(name) || 0) + 1);
  }

  let topRoutineName = '';
  let topRoutineCount = 0;
  for (const [rName, count] of routineAdherenceMap.entries()) {
    if (count > topRoutineCount) {
      topRoutineCount = count;
      topRoutineName = rName;
    }
  }

  // Fallback to first routine name if no completions yet
  if (!topRoutineName && routines.length > 0) {
    topRoutineName = routines[0].name;
  }

  const routineAnalyticsData: RoutineAnalyticsData = {
    todayTotal: totalRoutinesToday,
    todayCompleted: completedRoutinesToday,
    todayRate: routinePercentage,
    remainingRoutines: Math.max(0, totalRoutinesToday - completedRoutinesToday),
    weeklyAdherence: weeklyConsistencyRate,
    mostConsistentRoutine: topRoutineName
      ? { name: topRoutineName, completionsCount: topRoutineCount }
      : null,
  };

  // 7. ACHIEVEMENTS MILESTONES (Real data evaluation)
  const currentStreak = userStats.streakDays;
  const longestStreak = userStats.longestStreak || currentStreak;
  const completedTasksCount = userStats.totalCompletedTasks;
  const completedRoutinesCount = userStats.totalCompletedRoutines;
  const flawlessToday = progress.percentage === 100 && progress.totalTasks >= 3;

  const achievements: AchievementMilestone[] = [
    {
      id: 'first_mission',
      title: 'First Blood',
      codeName: 'INITIATIVE',
      description: 'Clear your first completed mission.',
      icon: 'flash',
      target: 1,
      current: Math.min(1, completedTasksCount),
      progress: Math.min(1, completedTasksCount / 1),
      unlocked: completedTasksCount >= 1,
      tier: 'bronze',
    },
    {
      id: 'streak_3',
      title: 'Tactical Rhythm',
      codeName: 'VELOCITY',
      description: 'Maintain a 3-day active streak.',
      icon: 'flame',
      target: 3,
      current: Math.min(3, longestStreak),
      progress: Math.min(1, longestStreak / 3),
      unlocked: longestStreak >= 3,
      tier: 'bronze',
    },
    {
      id: 'streak_7',
      title: 'Web-Slinger Focus',
      codeName: 'DISCIPLINE',
      description: 'Sustain operational momentum for 7 consecutive days.',
      icon: 'git-network',
      target: 7,
      current: Math.min(7, longestStreak),
      progress: Math.min(1, longestStreak / 7),
      unlocked: longestStreak >= 7,
      tier: 'silver',
    },
    {
      id: 'streak_14',
      title: 'Avenger Discipline',
      codeName: 'RESILIENCE',
      description: '14-day unbreakable mission streak.',
      icon: 'shield-checkmark',
      target: 14,
      current: Math.min(14, longestStreak),
      progress: Math.min(1, longestStreak / 14),
      unlocked: longestStreak >= 14,
      tier: 'silver',
    },
    {
      id: 'streak_30',
      title: 'God of Thunder',
      codeName: 'UNSTOPPABLE',
      description: '30-day legendary operational mastery.',
      icon: 'thunderstorm',
      target: 30,
      current: Math.min(30, longestStreak),
      progress: Math.min(1, longestStreak / 30),
      unlocked: longestStreak >= 30,
      tier: 'gold',
    },
    {
      id: 'centurion',
      title: 'Centurion Operative',
      codeName: 'CENTURION',
      description: 'Execute and clear 100 total completed missions.',
      icon: 'trophy',
      target: 100,
      current: Math.min(100, completedTasksCount),
      progress: Math.min(1, completedTasksCount / 100),
      unlocked: completedTasksCount >= 100,
      tier: 'platinum',
    },
    {
      id: 'flawless',
      title: 'Flawless Protocol',
      codeName: 'PERFECTION',
      description: 'Clear 100% of daily objectives (min 3 tasks).',
      icon: 'ribbon',
      target: 1,
      current: flawlessToday ? 1 : 0,
      progress: flawlessToday ? 1 : 0,
      unlocked: flawlessToday,
      tier: 'gold',
    },
    {
      id: 'routine_master',
      title: 'Protocol Sovereign',
      codeName: 'SYNCHRONY',
      description: 'Execute 20 routine checkpoint completions.',
      icon: 'sync',
      target: 20,
      current: Math.min(20, completedRoutinesCount),
      progress: Math.min(1, completedRoutinesCount / 20),
      unlocked: completedRoutinesCount >= 20,
      tier: 'silver',
    },
  ];

  // 8. PRODUCTIVITY INSIGHTS
  const hasData = allTasks.length > 0 || userStats.totalCompletedAll > 0;
  let peakDayInsight: string | null = null;
  let monthlyRateInsight: string | null = null;
  let topRoutineInsight: string | null = null;
  let weeklyMomentumInsight: string | null = null;

  if (hasData) {
    if (peakCompletions > 0 && peakDayName) {
      peakDayInsight = `${peakDayName} was your peak momentum day (${peakCompletions} cleared).`;
    }

    if (monthTasks.length > 0) {
      monthlyRateInsight = `Month-to-date completion rate is ${monthRate}% across ${monthTasks.length} missions.`;
    }

    if (topRoutineName && topRoutineCount > 0) {
      topRoutineInsight = `"${topRoutineName}" is your most consistent routine (${topRoutineCount} cleared).`;
    }

    if (weeklyTotalCompleted > 0) {
      weeklyMomentumInsight = `${weeklyTotalCompleted} missions completed this week with ${weeklyAvgRate}% average efficiency.`;
    }
  }

  const insights: ProductivityInsightsData = {
    hasData,
    peakDayInsight,
    monthlyRateInsight,
    topRoutineInsight,
    weeklyMomentumInsight,
  };

  return {
    today: todayMetrics,
    weekly: weeklyGraphData,
    monthly: monthlyGraphData,
    categories: categoryAnalyticsData,
    streak: streakData,
    routines: routineAnalyticsData,
    achievements,
    insights,
  };
}
