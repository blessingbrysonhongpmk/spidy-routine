import { useLightning } from '@/components/LightningEffect';
import { SpiderEmblem } from '@/components/SpiderEmblem';
import { TaskItem } from '@/components/TaskItem';
import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { getTodayDateString } from '@/services/dateUtils';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type TaskFilter = 'all' | 'today' | 'critical' | 'upcoming' | 'completed';

export default function TasksScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { allTasks, toggleTask, removeTask, refreshData } = useDatabase();
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = getTodayDateString();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddTask = () => {
    playSound('buttonTap');
    triggerHaptic('medium');
    router.push('/modal-task');
  };

  const handleEditTask = (task: Task) => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push({
      pathname: '/modal-task',
      params: { id: task.id },
    });
  };

  const handleToggle = (taskId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      triggerLightning({ intensity: 'medium' });
    }
    toggleTask(taskId, currentCompleted);
  };

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    let result = [...allTasks];

    // Filter tab
    if (activeFilter === 'today') {
      result = result.filter((t) => t.date === todayStr);
    } else if (activeFilter === 'critical') {
      result = result.filter((t) => t.priority === 'high' && !t.completed);
    } else if (activeFilter === 'upcoming') {
      result = result.filter((t) => t.date > todayStr && !t.completed);
    } else if (activeFilter === 'completed') {
      result = result.filter((t) => t.completed);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort: uncompleted first, then by date
    return result.sort((a, b) => {
      if (a.completed === b.completed) {
        return a.date.localeCompare(b.date);
      }
      return a.completed ? 1 : -1;
    });
  }, [allTasks, activeFilter, searchQuery, todayStr]);

  const totalCount = allTasks.length;
  const completedCount = allTasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <WebBackground />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>MISSION OBJECTIVES</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Task Command</Text>
        </View>

        <WebButtonInteraction
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAddTask}
          variant="compact"
          sound="buttonTap"
          haptic="medium"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Task</Text>
        </WebButtonInteraction>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Tactical Metrics Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ACTIVE</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>COMPLETED</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: colors.secondary }]}>{completionRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>EFFICIENCY</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search missions, targets, notes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {(
            [
              { key: 'all', label: 'All Tasks' },
              { key: 'today', label: 'Due Today' },
              { key: 'critical', label: 'Critical ⚡' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
            ] as const
          ).map((filter) => {
            const isSelected = activeFilter === filter.key;
            return (
              <WebButtonInteraction
                key={filter.key}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  setActiveFilter(filter.key);
                }}
                variant="compact"
                sound="none"
                haptic="none"
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primarySubtle : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.borderMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {filter.label}
                </Text>
              </WebButtonInteraction>
            );
          })}
        </ScrollView>

        {/* Task List */}
        <View style={styles.taskListContainer}>
          {filteredTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
              <SpiderEmblem size={42} color={colors.textMuted} opacity={0.35} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery
                  ? 'No matching mission objectives'
                  : activeFilter === 'completed'
                    ? 'No completed tasks yet'
                    : activeFilter === 'today'
                      ? 'No missions due today'
                      : 'All objectives clear'}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with different keywords.'
                  : 'Tap below to deploy a new objective into the field.'}
              </Text>
              <WebButtonInteraction
                style={[styles.emptyActionBtn, { backgroundColor: colors.primarySubtle, borderColor: colors.primaryBorder }]}
                onPress={handleAddTask}
                variant="compact"
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.emptyActionText, { color: colors.primary }]}>Create Objective</Text>
              </WebButtonInteraction>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEditTask}
                onDelete={removeTask}
              />
            ))
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  taskListContainer: {
    gap: 10,
  },
  emptyCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    borderWidth: 1,
    gap: 6,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

