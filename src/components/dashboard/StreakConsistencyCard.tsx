import { useSound } from '@/context/SoundContext';
import { StreakAndConsistencyData } from '@/services/dashboardAnalytics';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StreakConsistencyCardProps {
  data: StreakAndConsistencyData;
}

export const StreakConsistencyCard: React.FC<StreakConsistencyCardProps> = ({
  data,
}) => {
  const { playSound, triggerHaptic } = useSound();
  const [showInfo, setShowInfo] = useState(false);

  const toggleInfo = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    setShowInfo((prev) => !prev);
  };

  const getIntensityColor = (intensity: number, isToday: boolean) => {
    if (intensity === 3) return '#38BDF8';
    if (intensity === 2) return '#0284C7';
    if (intensity === 1) return '#0369A1';
    return isToday ? 'rgba(56, 189, 248, 0.18)' : '#1E293B';
  };

  // Split the 21 days into 3 clean 7-day rows to prevent wrapping on phone screens
  const heatmapRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < data.heatmap.length; i += 7) {
      rows.push(data.heatmap.slice(i, i + 7));
    }
    return rows;
  }, [data.heatmap]);

  return (
    <View style={styles.card}>
      {/* 1. Card Title & Info Toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.flameIcon}>⚡</Text>
          <Text style={styles.title}>CONSISTENCY & STREAKS</Text>
        </View>

        <TouchableOpacity
          onPress={toggleInfo}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.infoBtn}
          accessibilityLabel="Streak rules information"
        >
          <Ionicons
            name={showInfo ? 'close-circle-outline' : 'information-circle-outline'}
            size={16}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      {/* Streak Rules Accordion */}
      {showInfo ? (
        <View style={styles.rulesBanner}>
          <Text style={styles.rulesTitle}>OPERATIVE STREAK PROTOCOL</Text>
          <Text style={styles.rulesText}>
            • A streak day is earned by clearing at least 1 mission or routine protocol before local midnight.
          </Text>
          <Text style={styles.rulesText}>
            • Streaks are computed in your local timezone and persist offline.
          </Text>
          <Text style={styles.rulesText}>
            • No automated or fabricated historical data is ever recorded.
          </Text>
        </View>
      ) : null}

      {/* 2. Top Stats: 2x2 Responsive Matrix for Mobile Phones */}
      <View style={styles.statsGrid}>
        {/* Current Streak */}
        <View style={[styles.statTile, styles.statTileActive]}>
          <Text style={styles.statLabel}>CURRENT STREAK</Text>
          <View style={styles.statValRow}>
            <Text style={styles.statValueActive}>{data.currentStreak}</Text>
            <Text style={styles.statUnit}>DAYS</Text>
          </View>
          <Text style={styles.statSub} numberOfLines={1}>Active Consistency</Text>
        </View>

        {/* Longest Streak */}
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>ALL-TIME RECORD</Text>
          <View style={styles.statValRow}>
            <Text style={styles.statValue}>{data.longestStreak}</Text>
            <Text style={styles.statUnit}>DAYS</Text>
          </View>
          <Text style={styles.statSub} numberOfLines={1}>Best Continuous</Text>
        </View>

        {/* Weekly Consistency */}
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>7-DAY ADHERENCE</Text>
          <View style={styles.statValRow}>
            <Text style={[styles.statValue, { color: '#38BDF8' }]}>
              {data.weeklyConsistencyRate}%
            </Text>
          </View>
          <Text style={styles.statSub} numberOfLines={1}>Past Week</Text>
        </View>

        {/* Monthly Consistency */}
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>30-DAY VELOCITY</Text>
          <View style={styles.statValRow}>
            <Text style={styles.statValue}>{data.monthlyConsistencyRate}%</Text>
          </View>
          <Text style={styles.statSub} numberOfLines={1}>Month Adherence</Text>
        </View>
      </View>

      {/* 3. 21-Day Activity Heatmap Matrix */}
      <View style={styles.heatmapSection}>
        <View style={styles.heatmapHeader}>
          <Text style={styles.heatmapTitle}>21-DAY ACTIVITY MATRIX</Text>
          <View style={styles.legend}>
            <Text style={styles.legendLabel}>Less</Text>
            <View style={[styles.legendBox, { backgroundColor: '#1E293B' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#0369A1' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#0284C7' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#38BDF8' }]} />
            <Text style={styles.legendLabel}>More</Text>
          </View>
        </View>

        {/* Heatmap Grid: 3 explicit rows of 7 cells */}
        <View style={styles.heatmapContainer}>
          {heatmapRows.map((row, rIdx) => (
            <View key={`row-${rIdx}`} style={styles.heatmapWeekRow}>
              {row.map((cell) => {
                const bg = getIntensityColor(cell.intensity, cell.isToday);
                return (
                  <View
                    key={cell.date}
                    style={[
                      styles.heatCell,
                      { backgroundColor: bg },
                      cell.isToday && styles.todayCellHighlight,
                    ]}
                  >
                    <Text style={styles.heatCellDay}>{cell.dayLetter}</Text>
                    {cell.count > 0 ? (
                      <Text style={styles.heatCellCount}>{cell.count}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C121E',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flameIcon: {
    fontSize: 13,
  },
  title: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  infoBtn: {
    padding: 2,
  },
  rulesBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 9,
    padding: 9,
    marginBottom: 10,
    gap: 4,
  },
  rulesTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  rulesText: {
    fontSize: 10.5,
    color: '#CBD5E1',
    lineHeight: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  statTile: {
    width: '48.5%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  statTileActive: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  statLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginVertical: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  statValueActive: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F87171',
    lineHeight: 18,
  },
  statUnit: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  statSub: {
    fontSize: 8,
    color: '#94A3B8',
  },
  heatmapSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 8,
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heatmapTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendLabel: {
    fontSize: 7.5,
    color: '#64748B',
    marginHorizontal: 1,
  },
  legendBox: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  heatmapContainer: {
    gap: 4,
  },
  heatmapWeekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heatCell: {
    flex: 1,
    height: 28,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  todayCellHighlight: {
    borderColor: '#38BDF8',
  },
  heatCellDay: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  heatCellCount: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
});
