import { ProductivityInsightsData } from '@/services/dashboardAnalytics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProductivityInsightsCardProps {
  insights: ProductivityInsightsData;
}

export const ProductivityInsightsCard: React.FC<ProductivityInsightsCardProps> = ({
  insights,
}) => {
  const insightItems: { icon: string; title: string; text: string; color: string }[] = [];

  if (insights.peakDayInsight) {
    insightItems.push({
      icon: 'trending-up',
      title: 'PEAK VELOCITY DAY',
      text: insights.peakDayInsight,
      color: '#38BDF8',
    });
  }

  if (insights.monthlyRateInsight) {
    insightItems.push({
      icon: 'pie-chart',
      title: 'MONTHLY COMPLETION EFFICIENCY',
      text: insights.monthlyRateInsight,
      color: '#10B981',
    });
  }

  if (insights.topRoutineInsight) {
    insightItems.push({
      icon: 'sync',
      title: 'DISCIPLINE BENCHMARK',
      text: insights.topRoutineInsight,
      color: '#F59E0B',
    });
  }

  if (insights.weeklyMomentumInsight) {
    insightItems.push({
      icon: 'speedometer',
      title: 'WEEKLY MOMENTUM',
      text: insights.weeklyMomentumInsight,
      color: '#EF4444',
    });
  }

  return (
    <View style={styles.card}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb-outline" size={14} color="#38BDF8" />
          <Text style={styles.title} numberOfLines={1}>OPERATIVE INTELLIGENCE</Text>
        </View>
        <View style={styles.verifiedTag}>
          <Ionicons name="shield-checkmark" size={10} color="#38BDF8" />
          <Text style={styles.verifiedText}>DATA-VERIFIED</Text>
        </View>
      </View>

      {/* 2. Insight Items or Empty State */}
      {insightItems.length > 0 ? (
        <View style={styles.list}>
          {insightItems.map((item, index) => (
            <View key={index} style={styles.insightRow}>
              <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={14} color={item.color} />
              </View>
              <View style={styles.textCol}>
                <Text style={[styles.insightTitle, { color: item.color }]}>
                  {item.title}
                </Text>
                <Text style={styles.insightBody}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="hardware-chip-outline" size={24} color="#64748B" />
          <Text style={styles.emptyTitle}>CALIBRATING TELEMETRY</Text>
          <Text style={styles.emptyText}>
            Clear at least 2 mission directives or routines to unlock authentic operational insights.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C121E',
    marginHorizontal: 12,
    marginBottom: 20,
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
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    flexShrink: 0,
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.4,
  },
  list: {
    gap: 10,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 10,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textCol: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  insightBody: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#E2E8F0',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.8,
  },
  emptyText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 15,
  },
});

