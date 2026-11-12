import { useSound } from '@/context/SoundContext';
import {
  CategoryAnalyticsData,
  MonthlyGraphData,
  WeeklyGraphData,
} from '@/services/dashboardAnalytics';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProductivityGraphsCardProps {
  weeklyData: WeeklyGraphData;
  monthlyData: MonthlyGraphData;
  categoryData: CategoryAnalyticsData;
}

type TabType = 'weekly' | 'monthly' | 'categories';

export const ProductivityGraphsCard: React.FC<ProductivityGraphsCardProps> = ({
  weeklyData,
  monthlyData,
  categoryData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const { playSound, triggerHaptic } = useSound();

  const handleTabChange = (tab: TabType) => {
    playSound('buttonTap');
    triggerHaptic('light');
    setActiveTab(tab);
  };

  // Find max value in weekly to scale bars nicely
  const maxWeeklyTasks = Math.max(
    1,
    ...weeklyData.days.map((d) => Math.max(d.totalTasks, d.tasksCreated, d.tasksCompleted, 1))
  );

  return (
    <View style={styles.card}>
      {/* 1. Card Header & Switcher */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="bar-chart-outline" size={14} color="#38BDF8" />
          <Text style={styles.title}>PRODUCTIVITY ANALYTICS</Text>
        </View>

        {/* Tab Switcher Pills */}
        <View style={styles.tabBar}>
          {(['weekly', 'monthly', 'categories'] as TabType[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    isSelected && styles.tabBtnTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Content based on Active Tab */}
      {activeTab === 'weekly' ? (
        <View style={styles.chartContainer}>
          {/* Subheader summary stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} numberOfLines={1}>{weeklyData.weeklyTotalCompleted}</Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>CLEARED THIS WEEK</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#38BDF8' }]} numberOfLines={1}>
                {weeklyData.weeklyAvgRate}%
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>AVG EFFICIENCY</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#F87171' }]} numberOfLines={1}>
                {weeklyData.peakDayName}
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>PEAK VELOCITY</Text>
            </View>
          </View>

          {/* 7-Day Vertical Bar Chart */}
          <View style={styles.barChartWrapper}>
            {weeklyData.days.map((day) => {
              const compHeightPct = Math.round((day.tasksCompleted / maxWeeklyTasks) * 100);
              const totalHeightPct = Math.round((day.totalTasks / maxWeeklyTasks) * 100);

              return (
                <View key={day.date} style={styles.barCol}>
                  {/* Rate tag */}
                  <Text style={styles.barRateTag}>
                    {day.totalTasks > 0 ? `${day.completionRate}%` : '—'}
                  </Text>

                  {/* Bar pillar */}
                  <View style={styles.barTrack}>
                    {/* Background bar for total */}
                    <View
                      style={[
                        styles.barFillTotal,
                        { height: `${Math.max(12, totalHeightPct)}%` },
                      ]}
                    >
                      {/* Foreground bar for completed */}
                      <View
                        style={[
                          styles.barFillCompleted,
                          { height: `${compHeightPct}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Day label */}
                  <Text style={styles.barDayLabel}>{day.dayShort}</Text>
                  <Text style={styles.barCountLabel}>
                    {day.tasksCompleted}/{day.totalTasks}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendEntry}>
              <View style={[styles.legendIndicator, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendEntry}>
              <View style={[styles.legendIndicator, { backgroundColor: '#334155' }]} />
              <Text style={styles.legendText}>Total Scheduled</Text>
            </View>
          </View>
        </View>
      ) : null}

      {activeTab === 'monthly' ? (
        <View style={styles.chartContainer}>
          {/* Monthly overview banner */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} numberOfLines={1}>{monthlyData.monthlyTotalCompleted}</Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>MONTH CLEARED</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#38BDF8' }]} numberOfLines={1}>
                {monthlyData.monthlyCompletionRate}%
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>EFFICIENCY</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} numberOfLines={1}>{monthlyData.monthlyTotalTasks}</Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>TOTAL MISSIONS</Text>
            </View>
          </View>

          {/* 4 Weekly Breakdown Progress Bars */}
          <View style={styles.monthlyList}>
            {monthlyData.weeks.map((block) => (
              <View key={block.label} style={styles.monthBlockRow}>
                <View style={styles.monthBlockMeta}>
                  <Text style={styles.monthBlockLabel}>{block.label}</Text>
                  <Text style={styles.monthBlockRange}>Days {block.dateRange}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.monthProgressBarTrack}>
                  <View
                    style={[
                      styles.monthProgressBarFill,
                      { width: `${block.completionRate}%` },
                    ]}
                  />
                </View>

                <View style={styles.monthBlockRight}>
                  <Text style={styles.monthBlockRate}>{block.completionRate}%</Text>
                  <Text style={styles.monthBlockCount}>
                    {block.completedTasks}/{block.totalTasks}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeTab === 'categories' ? (
        <View style={styles.chartContainer}>
          {/* Ratio Split: Tasks vs Routines */}
          <View style={styles.ratioSection}>
            <View style={styles.ratioMetaRow}>
              <Text style={styles.ratioTitle} numberOfLines={1}>MISSION VS ROUTINE SPLIT</Text>
              <Text style={styles.ratioPercent}>
                {categoryData.taskVsRoutineRatio.taskPercent}% /{' '}
                {categoryData.taskVsRoutineRatio.routinePercent}%
              </Text>
            </View>
            <View style={styles.ratioBarTrack}>
              <View
                style={[
                  styles.ratioBarTasks,
                  { width: `${categoryData.taskVsRoutineRatio.taskPercent}%` },
                ]}
              />
              <View
                style={[
                  styles.ratioBarRoutines,
                  { width: `${categoryData.taskVsRoutineRatio.routinePercent}%` },
                ]}
              />
            </View>
            <View style={styles.ratioLegendRow}>
              <View style={styles.ratioLegendItem}>
                <View style={[styles.ratioDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.ratioLegendLabel}>
                  Tasks ({categoryData.taskVsRoutineRatio.tasksCompleted})
                </Text>
              </View>
              <View style={styles.ratioLegendItem}>
                <View style={[styles.ratioDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={styles.ratioLegendLabel}>
                  Routines ({categoryData.taskVsRoutineRatio.routinesCompleted})
                </Text>
              </View>
            </View>
          </View>

          {/* Categories Bars */}
          <View style={styles.categoriesList}>
            {categoryData.categories.map((cat) => (
              <View key={cat.category} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </View>
                  <Text style={styles.catMeta}>
                    {cat.completed}/{cat.total} ({cat.rate}%)
                  </Text>
                </View>
                <View style={styles.catTrack}>
                  <View
                    style={[
                      styles.catFill,
                      { width: `${cat.rate}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
  cardHeader: {
    gap: 8,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#38BDF8',
  },
  chartContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  summaryLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  barChartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 16,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  barRateTag: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  barTrack: {
    width: 12,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillTotal: {
    width: '100%',
    backgroundColor: '#334155',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillCompleted: {
    width: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 6,
  },
  barDayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 6,
  },
  barCountLabel: {
    fontSize: 7.5,
    color: '#64748B',
    marginTop: 1,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
  },
  legendEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  monthlyList: {
    gap: 10,
    paddingVertical: 4,
  },
  monthBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthBlockMeta: {
    width: 54,
  },
  monthBlockLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  monthBlockRange: {
    fontSize: 8,
    color: '#64748B',
  },
  monthProgressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  monthProgressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  monthBlockRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  monthBlockRate: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  monthBlockCount: {
    fontSize: 8,
    color: '#64748B',
  },
  ratioSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 6,
  },
  ratioMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioTitle: {
    flex: 1,
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  ratioPercent: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#F8FAFC',
    marginLeft: 6,
  },
  ratioBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  ratioBarTasks: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  ratioBarRoutines: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  ratioLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  ratioLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ratioLegendLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  categoriesList: {
    gap: 8,
    paddingTop: 4,
  },
  catRow: {
    gap: 4,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  catMeta: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  catTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 3,
  },
});

