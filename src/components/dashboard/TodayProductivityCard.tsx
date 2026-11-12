import { AnimatedProgress } from '@/components/AnimatedProgress';
import { useSound } from '@/context/SoundContext';
import { TodayMetrics } from '@/services/dashboardAnalytics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TodayProductivityCardProps {
  metrics: TodayMetrics;
  nextObjectiveTitle?: string;
  onNextObjectivePress?: () => void;
  onViewAllTasks?: () => void;
}

export const TodayProductivityCard: React.FC<TodayProductivityCardProps> = ({
  metrics,
  nextObjectiveTitle,
  onNextObjectivePress,
  onViewAllTasks,
}) => {
  const { playSound, triggerHaptic } = useSound();

  const handlePressMetric = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    if (onViewAllTasks) onViewAllTasks();
  };

  const hasOverdue = metrics.overdueTasks.length > 0;

  return (
    <View style={styles.card}>
      {/* 1. Header Banner */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.pulseDot} />
          <Text style={styles.sectionTitle}>{"TODAY'S PRODUCTIVITY"}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePressMetric}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.viewTasksText}>View Tasks →</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Main Telemetry Core: Dial & 4 Metrics */}
      <View style={styles.telemetryCore}>
        {/* Left: Circular HUD Progress Dial */}
        <View style={styles.dialContainer}>
          <AnimatedProgress
            percentage={metrics.overallPercentage}
            size={84}
            strokeWidth={7}
            label="Cleared"
            showIcon={true}
            triggerLightningOnIncrease={true}
          />
        </View>

        {/* Right: Tactical 2x2 Metric Matrix */}
        <View style={styles.metricsGrid}>
          {/* Total Tasks */}
          <TouchableOpacity
            style={styles.metricCell}
            onPress={handlePressMetric}
            activeOpacity={0.8}
          >
            <View style={styles.metricIconWrap}>
              <Ionicons name="list-outline" size={12} color="#94A3B8" />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricValue}>{metrics.totalTasks}</Text>
              <Text style={styles.metricLabel} numberOfLines={1}>TOTAL</Text>
            </View>
          </TouchableOpacity>

          {/* Completed Tasks */}
          <TouchableOpacity
            style={styles.metricCell}
            onPress={handlePressMetric}
            activeOpacity={0.8}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#38BDF8" />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={[styles.metricValue, { color: '#38BDF8' }]}>
                {metrics.completedTasks}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>CLEARED</Text>
            </View>
          </TouchableOpacity>

          {/* Pending Tasks */}
          <TouchableOpacity
            style={styles.metricCell}
            onPress={handlePressMetric}
            activeOpacity={0.8}
          >
            <View style={styles.metricIconWrap}>
              <Ionicons name="hourglass-outline" size={12} color="#CBD5E1" />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricValue}>{metrics.pendingTasks}</Text>
              <Text style={styles.metricLabel} numberOfLines={1}>PENDING</Text>
            </View>
          </TouchableOpacity>

          {/* Overdue Tasks */}
          <TouchableOpacity
            style={[
              styles.metricCell,
              hasOverdue && styles.overdueCellActive,
            ]}
            onPress={handlePressMetric}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.metricIconWrap,
                hasOverdue
                  ? { backgroundColor: 'rgba(239, 68, 68, 0.2)' }
                  : {},
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={12}
                color={hasOverdue ? '#EF4444' : '#64748B'}
              />
            </View>
            <View style={styles.metricTextCol}>
              <Text
                style={[
                  styles.metricValue,
                  hasOverdue ? { color: '#EF4444' } : { color: '#64748B' },
                ]}
              >
                {metrics.overdueTasks.length}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>OVERDUE</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Bottom Next Objective Bar (if available) */}
      {nextObjectiveTitle ? (
        <TouchableOpacity
          style={styles.nextObjectiveRow}
          onPress={onNextObjectivePress}
          activeOpacity={0.85}
        >
          <View style={styles.objectivePulse}>
            <Ionicons name="locate-outline" size={14} color="#EF4444" />
          </View>
          <View style={styles.objectiveTextCol}>
            <Text style={styles.objectiveTag}>NEXT MISSION OBJECTIVE</Text>
            <Text style={styles.objectiveTitle} numberOfLines={1}>
              {nextObjectiveTitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#64748B" />
        </TouchableOpacity>
      ) : null}
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
  cardHeader: {
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
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  viewTasksText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#38BDF8',
  },
  telemetryCore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    flexShrink: 0,
  },
  metricsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricCell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 5,
  },
  metricTextCol: {
    flex: 1,
    minWidth: 0,
  },
  overdueCellActive: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  metricIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 15,
  },
  metricLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  nextObjectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 10,
    gap: 8,
  },
  objectivePulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  objectiveTextCol: {
    flex: 1,
    minWidth: 0,
  },
  objectiveTag: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.6,
  },
  objectiveTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 1,
  },
});
