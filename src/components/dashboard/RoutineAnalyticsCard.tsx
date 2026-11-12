import { RoutineAnalyticsData } from '@/services/dashboardAnalytics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RoutineAnalyticsCardProps {
  data: RoutineAnalyticsData;
}

export const RoutineAnalyticsCard: React.FC<RoutineAnalyticsCardProps> = ({
  data,
}) => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      {/* 1. Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sync-outline" size={14} color="#38BDF8" />
          <Text style={styles.title} numberOfLines={1}>ROUTINE & PROTOCOL ANALYTICS</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/routine')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.viewRoutineLink}>Manage →</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Progress Bar: Today's Routine Completion */}
      <View style={styles.progressContainer}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>{"TODAY'S PROTOCOL CLEARANCE"}</Text>
          <Text style={styles.progressPercent}>{data.todayRate}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(0, data.todayRate))}%` },
            ]}
          />
        </View>
      </View>

      {/* 3. 3-Tile Routine Metrics */}
      <View style={styles.metricsRow}>
        {/* Completed Today */}
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel} numberOfLines={1}>CLEARED</Text>
          <Text style={[styles.metricVal, { color: '#38BDF8' }]} numberOfLines={1}>
            {data.todayCompleted}
          </Text>
          <Text style={styles.metricSub} numberOfLines={1}>Protocols</Text>
        </View>

        {/* Remaining Today */}
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel} numberOfLines={1}>PENDING</Text>
          <Text style={styles.metricVal} numberOfLines={1}>{data.remainingRoutines}</Text>
          <Text style={styles.metricSub} numberOfLines={1}>To Go</Text>
        </View>

        {/* 7-Day Routine Consistency */}
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel} numberOfLines={1}>7D ADHERENCE</Text>
          <Text style={[styles.metricVal, { color: '#10B981' }]} numberOfLines={1}>
            {data.weeklyAdherence}%
          </Text>
          <Text style={styles.metricSub} numberOfLines={1}>Discipline</Text>
        </View>
      </View>

      {/* 4. Most Consistent Routine Highlight */}
      {data.mostConsistentRoutine ? (
        <View style={styles.topRoutineCard}>
          <View style={styles.starIconBox}>
            <Ionicons name="ribbon-outline" size={14} color="#F59E0B" />
          </View>
          <View style={styles.topRoutineTextCol}>
            <Text style={styles.topRoutineTag} numberOfLines={1}>HIGHEST DISCIPLINE PROTOCOL</Text>
            <Text style={styles.topRoutineName} numberOfLines={1}>
              {data.mostConsistentRoutine.name}
            </Text>
          </View>
          <View style={styles.topRoutineBadge}>
            <Text style={styles.topRoutineBadgeText} numberOfLines={1}>
              {data.mostConsistentRoutine.completionsCount} clears
            </Text>
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
  viewRoutineLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
    flexShrink: 0,
  },
  progressContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 10,
    gap: 6,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38BDF8',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  metricTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F8FAFC',
    marginVertical: 2,
  },
  metricSub: {
    fontSize: 7.5,
    color: '#94A3B8',
  },
  topRoutineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  starIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRoutineTextCol: {
    flex: 1,
  },
  topRoutineTag: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.6,
  },
  topRoutineName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 1,
  },
  topRoutineBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topRoutineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
});
