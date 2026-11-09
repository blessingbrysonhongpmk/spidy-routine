import { Radii, Spacing } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
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
 * Signature Today's Timeline with interconnected circuit lines, category hero nodes,
 * item previews, and smooth accordion activity lists.
 */
export const TimelineSection: React.FC<TimelineSectionProps> = ({
  itemsByCategory,
  onToggleItem,
}) => {
  const router = useRouter();
  const colors = useTheme();
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
        color: colors.primary,
        iconEmoji: '☀️',
        iconBg: colors.primarySubtle,
      },
      {
        key: 'afternoon',
        title: 'Afternoon',
        defaultSummary: 'Study • Work on Projects',
        color: colors.secondary,
        iconEmoji: '⛅',
        iconBg: colors.secondarySubtle,
      },
      {
        key: 'evening',
        title: 'Evening',
        defaultSummary: 'Read • Relax',
        color: colors.purple,
        iconEmoji: '🌅',
        iconBg: colors.purpleSubtle,
      },
      {
        key: 'night',
        title: 'Night',
        defaultSummary: 'Wind Down • Sleep',
        color: '#A78BFA',
        iconEmoji: '🌙',
        iconBg: 'rgba(167, 139, 250, 0.12)',
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
          <View style={[styles.redBar, { backgroundColor: colors.primary }]} />
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Today&apos;s Timeline</Text>
        </View>

        <WebButtonInteraction
          onPress={handleViewAllPress}
          variant="compact"
          sound="buttonTap"
          haptic="light"
        >
          <View style={styles.viewAllRow}>
            <Text style={[styles.viewAllText, { color: colors.textMuted }]}>View All</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.textMuted} />
          </View>
        </WebButtonInteraction>
      </View>

      {/* Timeline Card Container */}
      <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
        {/* Left Vertical Circuit Connector Line */}
        <View style={[styles.verticalCircuitLine, { backgroundColor: colors.borderSubtle }]} pointerEvents="none" />

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
            <View
              key={cat.key}
              style={[
                styles.slotWrapper,
                !isLast && [styles.slotBorder, { borderBottomColor: colors.borderSubtle }],
              ]}
            >
              {/* Slot Header Row */}
              <TouchableOpacity
                style={styles.slotHeader}
                onPress={() => handleToggleExpand(cat.key)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${cat.title} protocol: ${completed} of ${total} completed. Tap to view activities.`}
              >
                {/* Circuit Node Dot */}
                <View
                  style={[
                    styles.circuitDot,
                    { backgroundColor: cat.color, borderColor: colors.surface },
                  ]}
                />

                {/* Circular Icon Badge */}
                <View style={[styles.iconBadge, { backgroundColor: cat.iconBg }]}>
                  <Text style={styles.iconEmoji}>{cat.iconEmoji}</Text>
                </View>

                {/* Slot Title & Summary */}
                <View style={styles.slotTitleCol}>
                  <Text style={[styles.slotTitle, { color: cat.color }]}>{cat.title}</Text>
                  <Text style={[styles.slotSummary, { color: colors.textSecondary }]} numberOfLines={1}>
                    {summaryText}
                  </Text>
                </View>

                {/* Right Ratio & Status Check Badge */}
                <View style={styles.slotStatusRow}>
                  <Text
                    style={[
                      styles.slotCounter,
                      { color: colors.textMuted },
                      isAllDone && { color: colors.success },
                    ]}
                  >
                    {completed} / {total}
                  </Text>

                  {isAllDone ? (
                    <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={[styles.emptyCircleBadge, { borderColor: colors.borderMuted }]} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Inline Activities Accordion Expansion */}
              {isExpanded && (
                <View style={[styles.activitiesContainer, { backgroundColor: colors.inputBackground }]}>
                  {items.length === 0 ? (
                    <Text style={[styles.emptySlotText, { color: colors.textMuted }]}>
                      No activities configured for this slot.
                    </Text>
                  ) : (
                    items.map((item) => {
                      const isDone = Boolean(item.completed);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.activityRow}
                          onPress={() => {
                            if (!isDone) {
                              playSound('taskSuccess');
                              triggerHaptic('success');
                            } else {
                              playSound('buttonTap');
                              triggerHaptic('light');
                            }
                            onToggleItem(item.id, isDone);
                          }}
                          activeOpacity={0.75}
                        >
                          {/* Radial Web Completion Effect */}
                          {isDone && <WebCompletionAnimation size={32} />}

                          {/* Checkbox */}
                          <View
                            style={[
                              styles.checkbox,
                              { borderColor: isDone ? colors.success : colors.borderMuted },
                              isDone && {
                                backgroundColor: colors.success,
                                borderColor: colors.success,
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
                            style={[
                              styles.activityTitle,
                              { color: colors.text },
                              isDone && [styles.activityTitleDone, { color: colors.textMuted }],
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>

                          {/* Time */}
                          {item.scheduled_time && (
                            <Text
                              style={[
                                styles.activityTime,
                                { color: colors.textMuted },
                                isDone && { color: colors.textDisabled },
                              ]}
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
  },
  sectionHeading: {
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
    fontSize: 12.5,
    fontWeight: '600',
  },
  timelineCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
  },
  verticalCircuitLine: {
    position: 'absolute',
    left: 20,
    top: 28,
    bottom: 28,
    width: 2,
    zIndex: 1,
  },
  slotWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  slotBorder: {
    borderBottomWidth: 1,
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
    fontSize: 12,
    fontWeight: '500',
  },
  slotStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotCounter: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  activitiesContainer: {
    paddingLeft: 46,
    paddingRight: 16,
    paddingVertical: 10,
    gap: 8,
  },
  emptySlotText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  activityTitleDone: {
    textDecorationLine: 'line-through',
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 8,
  },
});
