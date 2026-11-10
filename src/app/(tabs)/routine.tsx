import { useLightning } from '@/components/LightningEffect';
import { RoutineItemRow } from '@/components/RoutineItemRow';
import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate, getTodayDateString } from '@/services/dateUtils';
import { RoutineCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RoutineScreen() {
  const router = useRouter();
  const colors = useTheme();
  const {
    routines,
    itemsByCategory,
    selectedDate,
    toggleRoutineItem,
    removeRoutine,
    progress,
    loadStarterProtocols,
  } = useDatabase();

  const { triggerLightning } = useLightning();
  const [activeTab, setActiveTab] = useState<RoutineCategory>('morning');

  const todayStr = getTodayDateString();

  const categories: { key: RoutineCategory; title: string; color: string; icon: any }[] = [
    { key: 'morning', title: 'Morning', color: colors.primary, icon: 'sunny-outline' },
    { key: 'afternoon', title: 'Afternoon', color: colors.secondary, icon: 'partly-sunny-outline' },
    { key: 'evening', title: 'Evening', color: colors.purple, icon: 'color-filter-outline' },
    { key: 'night', title: 'Night', color: '#A78BFA', icon: 'moon-outline' },
  ];

  const currentItems = itemsByCategory[activeTab] || [];
  const currentCategoryObj = categories.find((c) => c.key === activeTab)!;

  const handleToggle = (itemId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      const remaining = currentItems.filter((i) => !i.completed && i.id !== itemId);
      if (remaining.length === 0) {
        triggerLightning({ intensity: 'epic' });
      } else {
        triggerLightning({ intensity: 'light', playSoundEffect: false });
      }
    }
    toggleRoutineItem(itemId, selectedDate, currentCompleted);
  };

  const handleAddRoutine = () => {
    router.push('/modal-routine');
  };

  const handleDeleteRoutine = (routineId: string, routineName: string) => {
    Alert.alert(
      'Delete Routine Protocol',
      `Are you sure you want to delete "${routineName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeRoutine(routineId),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <WebBackground />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>DAILY PROTOCOLS</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Routine Control</Text>
        </View>

        <WebButtonInteraction
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAddRoutine}
          variant="compact"
          sound="buttonTap"
          haptic="medium"
        >
          <Ionicons name="add" size={17} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Protocol</Text>
        </WebButtonInteraction>
      </View>

      {/* Tracking Date & Status Banner */}
      <View
        style={[
          styles.dateSelectorBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.dateInfoRow}>
          <Text style={[styles.dateIndicatorLabel, { color: colors.textMuted }]}>
            Tracking: <Text style={[styles.dateIndicatorValue, { color: colors.text }]}>{formatShortDate(selectedDate)}</Text>
            {selectedDate === todayStr ? ' (Today)' : ''}
          </Text>
        </View>
        <Text style={[styles.progressIndicator, { color: colors.secondary }]}>
          {progress.completedRoutineItems} of {progress.totalRoutineItems} completed
        </Text>
      </View>

      {/* Time-of-Day Segmented Tabs */}
      <View style={styles.tabBar}>
        {categories.map((c) => {
          const isSelected = activeTab === c.key;
          const items = itemsByCategory[c.key] || [];
          const count = items.length;

          return (
            <WebButtonInteraction
              key={c.key}
              style={[
                styles.tabItem,
                {
                  backgroundColor: isSelected ? colors.surfaceHover : colors.surface,
                  borderColor: isSelected ? c.color : colors.borderSubtle,
                },
              ]}
              onPress={() => {
                setActiveTab(c.key);
              }}
              variant="tab"
              sound="buttonTap"
              haptic="light"
            >
              <Ionicons
                name={c.icon}
                size={16}
                color={isSelected ? c.color : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isSelected ? colors.text : colors.textMuted },
                  isSelected && { fontWeight: '700' },
                ]}
              >
                {c.title}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected ? c.color : colors.inputBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </WebButtonInteraction>
          );
        })}
      </View>

      {/* Routine Activities Scroll */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionHeading, { color: currentCategoryObj.color }]}>
            {currentCategoryObj.title.toUpperCase()} ACTIVITIES
          </Text>
          <Text style={[styles.subHeadingText, { color: colors.textMuted }]}>
            Completions record for {formatShortDate(selectedDate)}
          </Text>
        </View>

        {currentItems.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Ionicons name="shield-outline" size={38} color={colors.textMuted} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Activities Configured</Text>
            <Text style={[styles.emptyStateSub, { color: colors.textMuted }]}>
              Tap &quot;New Protocol&quot; above to schedule your {currentCategoryObj.title.toLowerCase()} routine.
            </Text>
            {routines.length === 0 && (
              <TouchableOpacity
                style={[
                  styles.loadStarterBtn,
                  { backgroundColor: colors.primarySubtle, borderColor: colors.primaryBorder },
                ]}
                onPress={async () => {
                  await loadStarterProtocols();
                  triggerLightning({ intensity: 'medium' });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={14} color={colors.primary} />
                <Text style={[styles.loadStarterText, { color: colors.primary }]}>
                  Load Recommended Hero Protocols
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          currentItems.map((item) => (
            <RoutineItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              accentColor={currentCategoryObj.color}
            />
          ))
        )}

        {/* Existing Routine Protocols in this slot */}
        <View style={[styles.protocolManageSection, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.manageHeader, { color: colors.textMuted }]}>
            CONFIGURED PROTOCOLS IN THIS SLOT
          </Text>
          {routines
            .filter((r) => r.category === activeTab)
            .map((r) => (
              <View
                key={r.id}
                style={[
                  styles.protocolCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.protocolInfo}>
                  <Text style={[styles.protocolName, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.protocolDays, { color: colors.textMuted }]}>
                    Days: {r.repeat_days.join(', ')}
                  </Text>
                </View>
                <View style={styles.protocolActions}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/modal-routine', params: { id: r.id } })}
                    style={styles.actionProtocolBtn}
                    accessibilityLabel="Edit routine"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="create-outline" size={17} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteRoutine(r.id, r.name)}
                    style={styles.actionProtocolBtn}
                    accessibilityLabel="Delete routine"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? 14 : Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSubtitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: Radii.pill,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  dateSelectorBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIndicatorLabel: {
    fontSize: 12,
  },
  dateIndicatorValue: {
    fontWeight: '700',
  },
  progressIndicator: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.xs,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeadingRow: {
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subHeadingText: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyStateSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  loadStarterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.sm,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  loadStarterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  protocolManageSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  manageHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  protocolCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: 14,
    fontWeight: '600',
  },
  protocolDays: {
    fontSize: 11,
    marginTop: 2,
  },
  protocolActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionProtocolBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteProtocolBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
