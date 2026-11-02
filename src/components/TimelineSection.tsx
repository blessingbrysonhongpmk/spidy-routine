import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
import { RoutineCategory, RoutineItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebButtonInteraction } from './WebButtonInteraction';
import { WebCompletionAnimation } from './WebCompletionAnimation';

interface TimelineSectionProps {
  itemsByCategory: Record<RoutineCategory, RoutineItem[]>;
  onToggleItem: (itemId: string, currentCompleted: boolean) => void;
}

/**
 * TimelineSection:
 * Signature Today's Timeline matching mockup media_1793517437380_64339483.jpg.
 * Features vertical connected circuit line, colored node dots, icon badges,
 * item summary previews, and completion badges (e.g. 3/3 ✓).
 * Tapping any row smoothly expands interactive inline checkboxes.
 */
export const TimelineSection: React.FC<TimelineSectionProps> = ({
  itemsByCategory,
  onToggleItem,
}) => {
  const router = useRouter();
  const { playSound, triggerHaptic } = useSound();
  const [expandedCategory, setExpandedCategory] = useState<RoutineCategory | null>(null);

  const categories: {
    key: RoutineCategory;
    title: string;
    defaultSummary: string;
    color: string;
    iconEmoji: string;
    iconBg: string;
  }[] = [
    {
      key: 'morning',
      title: 'Morning',
      defaultSummary: 'Wake up • Workout • Read',
      color: '#EF4444',
      iconEmoji: '☀️',
      iconBg: 'rgba(239, 68, 68, 0.15)',
    },
    {
      key: 'afternoon',
      title: 'Afternoon',
      defaultSummary: 'Study • Work on Projects',
      color: '#0EA5E9',
      iconEmoji: '⛅',
      iconBg: 'rgba(14, 165, 233, 0.15)',
    },
    {
      key: 'evening',
      title: 'Evening',
      defaultSummary: 'Read • Relax',
      color: '#8B5CF6',
      iconEmoji: '🌅',
      iconBg: 'rgba(139, 92, 246, 0.15)',
    },
    {
      key: 'night',
      title: 'Night',
      defaultSummary: 'Wind Down • Sleep',
      color: '#C084FC',
      iconEmoji: '🌙',
      iconBg: 'rgba(192, 132, 252, 0.15)',
    },
  ];

  const handleToggleExpand = (cat: RoutineCategory) => {
    playSound('buttonTap');
    triggerHaptic('light');
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const handleViewAllPress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push('/(tabs)/routine');
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleWithBar}>
          <View style={styles.redBar} />
          <Text style={styles.sectionHeading}>Today&apos;s Timeline</Text>
        </View>

        <WebButtonInteraction
          onPress={handleViewAllPress}
          variant="compact"
          sound="buttonTap"
          haptic="light"
        >
          <View style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={13} color={SpideyColors.textMuted} />
          </View>
        </WebButtonInteraction>
      </View>

      {/* Timeline Card Container */}
      <View style={styles.timelineCard}>
        {/* Left Vertical Circuit Connector Line */}
        <View style={styles.verticalCircuitLine} pointerEvents="none" />

        {categories.map((cat, idx) => {
          const items = itemsByCategory[cat.key] || [];
          const total = items.length;
          const completed = items.filter((i) => i.completed).length;
          const isAllDone = total > 0 && completed === total;
          const isExpanded = expandedCategory === cat.key;
          const isLast = idx === categories.length - 1;

          // Build summary text from actual items or fallback to default
          const summaryText =
            items.length > 0
              ? items.map((i) => i.title).join(' • ')
              : cat.defaultSummary;

          return (
            <View key={cat.key} style={[styles.slotWrapper, !isLast && styles.slotBorder]}>
              {/* Slot Header Row */}
              <TouchableOpacity
                style={styles.slotHeader}
                onPress={() => handleToggleExpand(cat.key)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${cat.title} protocol: ${completed} of ${total} completed. Tap to view activities.`}
              >
                {/* Circuit Node Dot */}
                <View style={[styles.circuitDot, { backgroundColor: cat.color }]} />

                {/* Circular Icon Badge */}
                <View style={[styles.iconBadge, { backgroundColor: cat.iconBg }]}>
                  <Text style={styles.iconEmoji}>{cat.iconEmoji}</Text>
                </View>

                {/* Slot Title & Summary */}
                <View style={styles.slotTitleCol}>
                  <Text style={[styles.slotTitle, { color: cat.color }]}>{cat.title}</Text>
                  <Text style={styles.slotSummary} numberOfLines={1}>
                    {summaryText}
                  </Text>
                </View>

                {/* Right Ratio & Status Check Badge */}
                <View style={styles.slotStatusRow}>
                  <Text style={[styles.slotCounter, isAllDone && styles.slotCounterDone]}>
                    {completed} / {total}
                  </Text>

                  {isAllDone ? (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark" size={14} color="#050608" />
                    </View>
                  ) : (
                    <View style={styles.emptyCircleBadge} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Inline Activities Accordion Expansion */}
              {isExpanded && (
                <View style={styles.activitiesContainer}>
                  {items.length === 0 ? (
                    <Text style={styles.emptySlotText}>No activities configured for this slot.</Text>
                  ) : (
                    items.map((item) => {
                      const isDone = Boolean(item.completed);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.activityRow}
                          onPress={() => onToggleItem(item.id, isDone)}
                          activeOpacity={0.75}
                        >
                          {/* Radial Web Completion Effect */}
                          {isDone && <WebCompletionAnimation size={32} />}

                          {/* Checkbox */}
                          <View
                            style={[
                              styles.checkbox,
                              isDone && {
                                backgroundColor: '#10B981',
                                borderColor: '#10B981',
                              },
                            ]}
                          >
                            {isDone && (
                              <Ionicons
                                name="checkmark"
                                size={12}
                                color="#FFFFFF"
                              />
                            )}
                          </View>

                          {/* Title */}
                          <Text
                            style={[styles.activityTitle, isDone && styles.activityTitleDone]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>

                          {/* Time */}
                          {item.scheduled_time && (
                            <Text
                              style={[styles.activityTime, isDone && styles.activityTimeDone]}
                            >
                              {item.scheduled_time}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleWithBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redBar: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
    backgroundColor: SpideyColors.spideyRed,
  },
  sectionHeading: {
    color: SpideyColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    color: SpideyColors.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  timelineCard: {
    backgroundColor: '#0C0E14',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
    position: 'relative',
  },
  verticalCircuitLine: {
    position: 'absolute',
    left: 20,
    top: 28,
    bottom: 28,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 1,
  },
  slotWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  slotBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  circuitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#0C0E14',
    zIndex: 3,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 16,
  },
  slotTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  slotTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  slotSummary: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  slotStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotCounter: {
    color: SpideyColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  slotCounterDone: {
    color: '#10B981',
  },
  completedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  activitiesContainer: {
    paddingLeft: 54,
    paddingRight: 16,
    paddingBottom: 12,
    paddingTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  emptySlotText: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 10,
    position: 'relative',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    flex: 1,
    color: SpideyColors.textPrimary,
    fontSize: 13.5,
    fontWeight: '600',
  },
  activityTitleDone: {
    color: SpideyColors.textMuted,
    textDecorationLine: 'line-through',
  },
  activityTime: {
    color: SpideyColors.textMuted,
    fontSize: 11.5,
    fontWeight: '500',
  },
  activityTimeDone: {
    opacity: 0.5,
  },
});
