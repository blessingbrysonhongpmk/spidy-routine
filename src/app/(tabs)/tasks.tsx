import { WebBackground } from '@/components/WebBackground';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import {
  formatFullDateLabel,
  formatTimeDisplay,
  getTodayDateString,
  timeToMinutes,
} from '@/services/dateUtils';
import { confirmAction } from '@/services/platformAlert';
import { Task, TaskPriority } from '@/types';
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
  View,
} from 'react-native';

type PrimaryTab = 'today' | 'upcoming' | 'completed';
type PriorityFilter = 'all' | TaskPriority;

export default function TasksScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { playSound, triggerHaptic } = useSound();
  const { allTasks, toggleTask, editTask, removeTask, refreshData } = useDatabase();

  const [activeTab, setActiveTab] = useState<PrimaryTab>('today');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [undoBanner, setUndoBanner] = useState<{
    message: string;
    onUndo: () => void;
  } | null>(null);

  const todayStr = getTodayDateString();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const triggerUndo = (message: string, onUndo: () => void) => {
    setUndoBanner({ message, onUndo });
    setTimeout(() => {
      setUndoBanner((cur) => (cur?.message === message ? null : cur));
    }, 3500);
  };

  // Extract distinct categories present in tasks + defaults
  const availableCategories = useMemo(() => {
    const set = new Set<string>(['All', 'Work', 'Health', 'Study', 'Personal', 'General']);
    allTasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [allTasks]);

  const applySubFilters = (list: Task[]) => {
    return list.filter((t) => {
      if (priorityFilter !== 'all' && (t.priority || 'medium') !== priorityFilter) {
        return false;
      }
      if (
        categoryFilter !== 'all' &&
        (t.category || 'General').toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  };

  const todayPendingList = useMemo(() => {
    const raw = allTasks.filter((t) => t.date === todayStr && !t.completed);
    return applySubFilters(raw).sort(
      (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, todayStr, priorityFilter, categoryFilter, searchQuery]);

  const overdueList = useMemo(() => {
    const raw = allTasks.filter((t) => t.date < todayStr && !t.completed);
    return applySubFilters(raw).sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, todayStr, priorityFilter, categoryFilter, searchQuery]);

  const upcomingList = useMemo(() => {
    const raw = allTasks.filter((t) => t.date > todayStr && !t.completed);
    return applySubFilters(raw).sort(
      (a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.time) - timeToMinutes(b.time)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, todayStr, priorityFilter, categoryFilter, searchQuery]);

  const completedList = useMemo(() => {
    const raw = allTasks.filter((t) => t.completed);
    return applySubFilters(raw).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, priorityFilter, categoryFilter, searchQuery]);

  const handleToggle = async (task: Task) => {
    const wasCompleted = task.completed;
    await toggleTask(task.id, wasCompleted);
    if (!wasCompleted) {
      triggerUndo(`Completed "${task.title}"`, () => {
        toggleTask(task.id, true);
      });
    }
  };

  const handleRescheduleToToday = async (task: Task) => {
    playSound('buttonTap');
    triggerHaptic('medium');
    await editTask({ ...task, date: todayStr });
  };

  const handleMoveAllOverdueToToday = async () => {
    playSound('webShoot');
    triggerHaptic('success');
    for (const t of overdueList) {
      await editTask({ ...t, date: todayStr });
    }
  };

  const handleDeleteTask = (task: Task) => {
    confirmAction({
      title: 'Delete Task',
      message: `Remove "${task.title}"?`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => removeTask(task.id),
    });
  };

  const getPriorityStyle = (priority?: TaskPriority) => {
    switch (priority) {
      case 'high':
        return { label: 'High', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
      case 'low':
        return { label: 'Low', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
      default:
        return { label: 'Medium', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
    }
  };

  const renderTaskRow = (task: Task, showDateLabel: boolean) => {
    const prio = getPriorityStyle(task.priority);
    const timeDisp = task.time ? formatTimeDisplay(task.time) : '';
    const dateDisp = showDateLabel ? formatFullDateLabel(task.date) : '';
    const subMeta = [dateDisp, timeDisp].filter(Boolean).join(' • ');

    return (
      <View
        key={task.id}
        style={[
          styles.taskCard,
          {
            backgroundColor: colors.surface,
            borderColor: task.completed ? colors.borderSubtle : colors.borderMuted,
            opacity: task.completed ? 0.72 : 1,
          },
        ]}
      >
        {/* 44px Quick Complete Circle Checkbox */}
        <TouchableOpacity
          style={styles.checkTouchArea}
          onPress={() => handleToggle(task)}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.completed }}
          accessibilityLabel={`Toggle ${task.title}`}
        >
          <View
            style={[
              styles.checkCircle,
              {
                borderColor: task.completed ? colors.primary : colors.borderFocus,
                backgroundColor: task.completed ? colors.primary : 'transparent',
              },
            ]}
          >
            {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
          </View>
        </TouchableOpacity>

        {/* Task Content (Tap to Edit) */}
        <TouchableOpacity
          style={styles.taskInfoCol}
          onPress={() => router.push({ pathname: '/modal-task', params: { id: task.id } })}
          onLongPress={() => handleDeleteTask(task)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.taskTitle,
              { color: colors.text },
              task.completed && [styles.strikeTitle, { color: colors.textMuted }],
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>

          <View style={styles.taskSubRow}>
            {subMeta ? (
              <Text style={[styles.taskMetaText, { color: colors.textMuted }]} numberOfLines={1}>
                {subMeta}
              </Text>
            ) : null}
            {task.reminder_enabled ? (
              <Ionicons
                name="notifications"
                size={11}
                color={colors.secondary}
                style={{ marginLeft: subMeta ? 6 : 0 }}
              />
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Priority Badge */}
        <TouchableOpacity
          style={[styles.prioPill, { backgroundColor: prio.bg }]}
          onPress={() => {
            // Quick cycle priority with 1 tap!
            const order: TaskPriority[] = ['low', 'medium', 'high'];
            const next = order[(order.indexOf(task.priority || 'medium') + 1) % 3];
            playSound('buttonTap');
            triggerHaptic('light');
            editTask({ ...task, priority: next });
          }}
          accessibilityLabel={`Change priority from ${prio.label}`}
        >
          <Text style={[styles.prioText, { color: prio.color }]}>{prio.label}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const activeList =
    activeTab === 'today'
      ? todayPendingList
      : activeTab === 'upcoming'
        ? upcomingList
        : completedList;

  const visibleOverdue = showAllOverdue ? overdueList : overdueList.slice(0, 2);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <WebBackground variant="minimal" showLightning={false} />

      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.iconActionBtn,
                {
                  backgroundColor: searchOpen ? colors.secondarySubtle : colors.surface,
                  borderColor: searchOpen ? colors.secondaryBorder : colors.borderSubtle,
                },
              ]}
              onPress={() => {
                playSound('buttonTap');
                setSearchOpen((v) => !v);
              }}
              accessibilityLabel="Search tasks"
            >
              <Ionicons
                name="search"
                size={19}
                color={searchOpen ? colors.secondary : colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconActionBtn,
                {
                  backgroundColor:
                    filterOpen || priorityFilter !== 'all' || categoryFilter !== 'all'
                      ? colors.primarySubtle
                      : colors.surface,
                  borderColor:
                    filterOpen || priorityFilter !== 'all' || categoryFilter !== 'all'
                      ? colors.primaryBorder
                      : colors.borderSubtle,
                },
              ]}
              onPress={() => {
                playSound('buttonTap');
                setFilterOpen((v) => !v);
              }}
              accessibilityLabel="Filter by priority or category"
            >
              <Ionicons
                name="filter"
                size={19}
                color={
                  filterOpen || priorityFilter !== 'all' || categoryFilter !== 'all'
                    ? colors.primary
                    : colors.text
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Segment Tabs (Today | Upcoming | Completed) */}
        <View style={styles.tabsBar}>
          {(
            [
              { key: 'today', label: 'Today' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
            ] as { key: PrimaryTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.borderSubtle,
                  },
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  setActiveTab(tab.key);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                    active && { fontWeight: '700' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Input Drawer */}
        {searchOpen ? (
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
          >
            <Ionicons name="search-outline" size={17} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search tasks..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Priority & Category Filter Drawer */}
        {filterOpen ? (
          <View
            style={[
              styles.filterDrawer,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}
            >
              {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map((p) => {
                const active = priorityFilter === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.subChip,
                      {
                        backgroundColor: active ? colors.primarySubtle : colors.inputBackground,
                        borderColor: active ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setPriorityFilter(p)}
                  >
                    <Text
                      style={[
                        styles.subChipText,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}
            >
              {availableCategories.map((cat) => {
                const key = cat.toLowerCase();
                const active = categoryFilter === key;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.subChip,
                      {
                        backgroundColor: active ? colors.secondarySubtle : colors.inputBackground,
                        borderColor: active ? colors.secondary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setCategoryFilter(key)}
                  >
                    <Text
                      style={[
                        styles.subChipText,
                        { color: active ? colors.secondary : colors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Undo Toast */}
        {undoBanner ? (
          <View
            style={[
              styles.undoBanner,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.borderMuted },
            ]}
          >
            <Text style={[styles.undoText, { color: colors.text }]} numberOfLines={1}>
              {undoBanner.message}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const cb = undoBanner.onUndo;
                setUndoBanner(null);
                cb();
              }}
            >
              <Text style={[styles.undoAction, { color: colors.secondary }]}>UNDO</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Tasks List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {activeList.length > 0 ? (
            <View style={styles.listGap}>
              {activeList.map((task) => renderTaskRow(task, activeTab !== 'today'))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
              ]}
            >
              <Ionicons
                name={activeTab === 'completed' ? 'checkmark-done-circle-outline' : 'checkbox-outline'}
                size={34}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'today'
                  ? 'No tasks scheduled today'
                  : activeTab === 'upcoming'
                    ? 'No upcoming tasks'
                    : 'No completed tasks yet'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Tap the + button below to add a task quickly.
              </Text>
            </View>
          )}

          {/* Overdue Section (Shown cleanly on Today tab whenever overdue tasks exist) */}
          {activeTab === 'today' && overdueList.length > 0 ? (
            <View style={styles.overdueBlock}>
              <View style={styles.overdueHeader}>
                <View style={styles.overdueHeaderLeft}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.overdueHeading, { color: colors.text }]}>
                    Overdue ({overdueList.length})
                  </Text>
                </View>

                <View style={styles.overdueActions}>
                  <TouchableOpacity onPress={handleMoveAllOverdueToToday}>
                    <Text style={[styles.moveTodayLink, { color: colors.secondary }]}>
                      Move to Today
                    </Text>
                  </TouchableOpacity>
                  {overdueList.length > 2 ? (
                    <TouchableOpacity onPress={() => setShowAllOverdue((v) => !v)}>
                      <Text style={[styles.viewAllOverdue, { color: colors.primary }]}>
                        {showAllOverdue ? 'Show less' : 'View all →'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={styles.listGap}>
                {visibleOverdue.map((task) => (
                  <View
                    key={task.id}
                    style={[
                      styles.overdueCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: 'rgba(239, 68, 68, 0.45)',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.checkTouchArea}
                      onPress={() => handleToggle(task)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: false }}
                    >
                      <View
                        style={[
                          styles.overdueIconCircle,
                          { backgroundColor: 'rgba(239, 68, 68, 0.16)' },
                        ]}
                      >
                        <Ionicons name="time" size={16} color={colors.danger} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.taskInfoCol}
                      onPress={() =>
                        router.push({ pathname: '/modal-task', params: { id: task.id } })
                      }
                    >
                      <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={[styles.overdueMetaText, { color: colors.danger }]}>
                        {formatFullDateLabel(task.date)}
                        {task.time ? ` • ${formatTimeDisplay(task.time)}` : ''}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.reschedulePill, { backgroundColor: colors.inputBackground }]}
                      onPress={() => handleRescheduleToToday(task)}
                    >
                      <Text style={[styles.rescheduleText, { color: colors.secondary }]}>
                        Today
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom-Right Floating Add Task Button (+) */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            playSound('buttonTap');
            triggerHaptic('medium');
            router.push('/modal-task');
          }}
          activeOpacity={0.85}
          accessibilityLabel="Add Task"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  tabPill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  filterDrawer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  undoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  undoText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  undoAction: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 92,
  },
  listGap: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingRight: 12,
    minHeight: 62,
  },
  checkTouchArea: {
    width: 48,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfoCol: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingRight: 8,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  strikeTitle: {
    textDecorationLine: 'line-through',
  },
  taskSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  taskMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  prioPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  prioText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  overdueBlock: {
    marginTop: 22,
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  overdueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overdueHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  overdueActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moveTodayLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllOverdue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  overdueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingRight: 12,
    minHeight: 62,
  },
  overdueIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueMetaText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  reschedulePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rescheduleText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
});
