import { useLightning } from '@/components/LightningEffect';
import { RoutineItemRow } from '@/components/RoutineItemRow';
import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { formatShortDate, getTodayDateString } from '@/services/dateUtils';
import { RoutineCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RoutineScreen() {
  const router = useRouter();
  const {
    routines,
    itemsByCategory,
    selectedDate,
    toggleRoutineItem,
    removeRoutine,
    progress,
  } = useDatabase();

  const { triggerLightning } = useLightning();
  const [activeTab, setActiveTab] = useState<RoutineCategory>('morning');

  const todayStr = getTodayDateString();

  const categories: { key: RoutineCategory; title: string; color: string; icon: any }[] = [
    { key: 'morning', title: 'Morning', color: SpideyColors.spideyRed, icon: 'sunny-outline' },
    { key: 'afternoon', title: 'Afternoon', color: SpideyColors.thorBlue, icon: 'partly-sunny-outline' },
    { key: 'evening', title: 'Evening', color: SpideyColors.venomPurple, icon: 'color-filter-outline' },
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
    <SafeAreaView style={styles.safeArea}>
      <WebBackground />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>DAILY PROTOCOLS</Text>
          <Text style={styles.headerTitle}>Routine Control</Text>
        </View>

        <WebButtonInteraction
          style={styles.addBtn}
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
      <View style={styles.dateSelectorBar}>
        <View style={styles.dateInfoRow}>
          <Text style={styles.dateIndicatorLabel}>
            Tracking: <Text style={styles.dateIndicatorValue}>{formatShortDate(selectedDate)}</Text>
            {selectedDate === todayStr ? ' (Today)' : ''}
          </Text>
        </View>
        <Text style={styles.progressIndicator}>
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
                isSelected && styles.tabItemActive,
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
                size={15}
                color={isSelected ? c.color : SpideyColors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isSelected && { color: SpideyColors.textPrimary, fontWeight: '700' },
                ]}
              >
                {c.title}
              </Text>
              <View style={[styles.countBadge, isSelected && { backgroundColor: c.color }]}>
                <Text style={[styles.countText, isSelected && { color: SpideyColors.background }]}>
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
          <Text style={styles.sectionHeading}>
            {currentCategoryObj.title.toUpperCase()} ACTIVITIES
          </Text>
          <Text style={styles.subHeadingText}>
            Completions record for {formatShortDate(selectedDate)}
          </Text>
        </View>

        {currentItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={38} color={SpideyColors.textMuted} />
            <Text style={styles.emptyStateTitle}>No Activities Configured</Text>
            <Text style={styles.emptyStateSub}>
              Tap &quot;New Protocol&quot; above to schedule your {currentCategoryObj.title.toLowerCase()} routine.
            </Text>
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
        <View style={styles.protocolManageSection}>
          <Text style={styles.manageHeader}>CONFIGURED PROTOCOLS IN THIS SLOT</Text>
          {routines
            .filter((r) => r.category === activeTab)
            .map((r) => (
              <View key={r.id} style={styles.protocolCard}>
                <View style={styles.protocolInfo}>
                  <Text style={styles.protocolName}>{r.name}</Text>
                  <Text style={styles.protocolDays}>
                    Days: {r.repeat_days.join(', ')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteRoutine(r.id, r.name)}
                  style={styles.deleteProtocolBtn}
                  accessibilityLabel="Delete protocol"
                >
                  <Ionicons name="trash-outline" size={16} color={SpideyColors.textMuted} />
                </TouchableOpacity>
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
    backgroundColor: SpideyColors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.surfaceElevated,
    borderWidth: 1,
    borderColor: SpideyColors.borderMuted,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    gap: 4,
  },
  addBtnText: {
    color: SpideyColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  dateSelectorBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: SpideyColors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: SpideyColors.borderSubtle,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIndicatorLabel: {
    color: SpideyColors.textMuted,
    fontSize: 12,
  },
  dateIndicatorValue: {
    color: SpideyColors.textPrimary,
    fontWeight: '700',
  },
  progressIndicator: {
    color: SpideyColors.thorBlue,
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
    backgroundColor: SpideyColors.surface,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: SpideyColors.surfaceHover,
    borderColor: SpideyColors.borderMuted,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: SpideyColors.textMuted,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.xs,
    backgroundColor: SpideyColors.inputBackground,
  },
  countText: {
    color: SpideyColors.textSecondary,
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
    color: SpideyColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  subHeadingText: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyStateSub: {
    color: SpideyColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  protocolManageSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: SpideyColors.borderSubtle,
  },
  manageHeader: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  protocolCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SpideyColors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    marginBottom: Spacing.sm,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  protocolDays: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteProtocolBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
