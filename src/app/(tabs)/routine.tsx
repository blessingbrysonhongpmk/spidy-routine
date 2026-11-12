import { AppScreenShell } from '@/components/AppScreenShell';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import {
  formatShortDate,
  formatTimeDisplay,
  getDayOfWeekFromDate,
  getTodayDateString,
  getWeekDatesForDate,
  timeToMinutes,
  WEEKDAYS_ORDERED,
} from '@/services/dateUtils';
import { confirmAction } from '@/services/platformAlert';
import { DayOfWeek, Routine, RoutineItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ROUTINE_ACCENT_MAP: Record<string, string> = {
  'barbell-outline': '#38BDF8',
  'book-outline': '#A855F7',
  'school-outline': '#10B981',
  'sunny-outline': '#F59E0B',
  'moon-outline': '#818CF8',
  'water-outline': '#0EA5E9',
  'flash-outline': '#EF4444',
  'heart-outline': '#F43F5E',
  'code-slash-outline': '#06B6D4',
  'briefcase-outline': '#F59E0B',
};

export default function RoutineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { playSound, triggerHaptic } = useSound();
  const {
    routines,
    routineDate,
    setRoutineDate,
    toggleRoutineItem,
    updateRoutineItemStatus,
    toggleParentRoutine,
    reorderRoutineActivities,
    duplicateRoutineToDays,
    copyDayRoutines,
    removeRoutine,
    loadStarterProtocols,
  } = useDatabase();

  const todayStr = getTodayDateString();
  const weekDates = useMemo(() => getWeekDatesForDate(todayStr), [todayStr]);
  const todayWeekday = useMemo(() => getDayOfWeekFromDate(todayStr), [todayStr]);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayWeekday);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [reorderRoutineId, setReorderRoutineId] = useState<string | null>(null);

  // Action sheet / modals state
  const [menuRoutine, setMenuRoutine] = useState<(Routine & { items: RoutineItem[] }) | null>(null);
  const [duplicateTargetRoutine, setDuplicateTargetRoutine] = useState<Routine | null>(null);
  const [duplicateSelectedDays, setDuplicateSelectedDays] = useState<DayOfWeek[]>([]);
  const [copyDayModalVisible, setCopyDayModalVisible] = useState(false);
  const [copyTargetDays, setCopyTargetDays] = useState<DayOfWeek[]>([]);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Sync database routineDate with the selected weekday's local date in the current week
  useEffect(() => {
    const match = weekDates.find((w) => w.day === selectedDay);
    if (match && match.date !== routineDate) {
      setRoutineDate(match.date);
    }
  }, [selectedDay, weekDates, routineDate, setRoutineDate]);

  const selectedDateObj = useMemo(
    () => weekDates.find((w) => w.day === selectedDay) || weekDates[0],
    [weekDates, selectedDay]
  );

  const daysWithRoutines = useMemo(() => {
    const set = new Set<DayOfWeek>();
    for (const r of routines) {
      if (r.repeat_days.length === 0) {
        WEEKDAYS_ORDERED.forEach((d) => set.add(d));
      } else {
        r.repeat_days.forEach((d) => set.add(d as DayOfWeek));
      }
    }
    return set;
  }, [routines]);

  const dayRoutines = useMemo(() => {
    return routines
      .filter((r) => r.repeat_days.length === 0 || r.repeat_days.includes(selectedDay))
      .sort((a, b) => {
        const aTime = a.start_time || a.items?.[0]?.scheduled_time || '';
        const bTime = b.start_time || b.items?.[0]?.scheduled_time || '';
        return timeToMinutes(aTime) - timeToMinutes(bTime);
      });
  }, [routines, selectedDay]);

  useEffect(() => {
    if (dayRoutines.length > 0) {
      const anyTouched = dayRoutines.some((r) => expandedIds[r.id] !== undefined);
      if (!anyTouched) {
        const firstIncomplete =
          dayRoutines.find((r) => (r.items || []).some((i) => !i.completed && !i.skipped)) ||
          dayRoutines[0];
        if (firstIncomplete) {
          setExpandedIds((prev) => ({ ...prev, [firstIncomplete.id]: true }));
        }
      }
    }
  }, [dayRoutines, expandedIds]);

  const dayStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    for (const r of dayRoutines) {
      const items = r.items || [];
      total += items.length;
      completed += items.filter((i) => i.completed).length;
    }
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct };
  }, [dayRoutines]);

  const showToast = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => {
      setFeedbackBanner((cur) => (cur === msg ? null : cur));
    }, 2600);
  };

  const toggleExpand = (routineId: string) => {
    playSound('buttonTap');
    triggerHaptic('light');
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedIds((prev) => ({
      ...prev,
      [routineId]: !prev[routineId],
    }));
  };

  const handleToggleSubActivity = (item: RoutineItem) => {
    const activeDate = selectedDateObj.date;
    if (item.skipped) {
      updateRoutineItemStatus(item.id, activeDate, 'pending');
      return;
    }
    toggleRoutineItem(item.id, activeDate, Boolean(item.completed));
  };

  const handleSkipSubActivity = (item: RoutineItem) => {
    const activeDate = selectedDateObj.date;
    updateRoutineItemStatus(
      item.id,
      activeDate,
      item.skipped ? 'pending' : 'skipped'
    );
  };

  const handleMoveSubActivity = async (
    routine: Routine & { items: RoutineItem[] },
    index: number,
    direction: -1 | 1
  ) => {
    const list = [...(routine.items || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    await reorderRoutineActivities(
      routine.id,
      list.map((i) => i.id)
    );
  };

  const handleDeleteRoutineConfirm = (routine: Routine) => {
    setMenuRoutine(null);
    confirmAction({
      title: 'Delete Routine',
      message: `Are you sure you want to remove "${routine.name}"?`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => {
        removeRoutine(routine.id);
        showToast(`Deleted "${routine.name}"`);
      },
    });
  };

  const openDuplicateModal = (routine: Routine) => {
    setMenuRoutine(null);
    setDuplicateTargetRoutine(routine);
    setDuplicateSelectedDays([]);
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTargetRoutine || duplicateSelectedDays.length === 0) return;
    await duplicateRoutineToDays(duplicateTargetRoutine.id, duplicateSelectedDays);
    showToast(`Duplicated "${duplicateTargetRoutine.name}" to ${duplicateSelectedDays.join(', ')}`);
    setDuplicateTargetRoutine(null);
    setDuplicateSelectedDays([]);
  };

  const handleConfirmCopyDay = async () => {
    if (copyTargetDays.length === 0) return;
    const count = await copyDayRoutines(selectedDay, copyTargetDays);
    setCopyDayModalVisible(false);
    setCopyTargetDays([]);
    if (count > 0) {
      showToast(`Copied ${selectedDay}'s routines to ${copyTargetDays.join(', ')}`);
    } else {
      showToast('No routines available to copy.');
    }
  };

  const openAddRoutine = () => {
    playSound('buttonTap');
    triggerHaptic('medium');
    router.push({ pathname: '/modal-routine', params: { defaultDay: selectedDay } });
  };

  const openEditRoutine = (routineId: string) => {
    setMenuRoutine(null);
    router.push({
      pathname: '/modal-routine',
      params: { id: routineId, activeDay: selectedDay },
    });
  };

  return (
    <AppScreenShell topBreathingSpace={8} backgroundProps={{ variant: 'minimal', showLightning: false }}>
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Routine</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {formatShortDate(selectedDateObj.date)}
              {selectedDateObj.isToday ? ' • Today' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.copyDayBtn,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
            onPress={() => {
              playSound('buttonTap');
              setCopyTargetDays([]);
              setCopyDayModalVisible(true);
            }}
            activeOpacity={0.75}
            accessibilityLabel="Copy weekday routine to other days"
          >
            <Ionicons name="copy-outline" size={16} color={colors.text} />
            <Text style={[styles.copyDayText, { color: colors.text }]}>Copy Day</Text>
          </TouchableOpacity>
        </View>

        {/* Mon - Sun Weekday Selector */}
        <View style={styles.weekdayBar}>
          {weekDates.map((wd) => {
            const active = selectedDay === wd.day;
            const hasItems = daysWithRoutines.has(wd.day);

            return (
              <TouchableOpacity
                key={wd.day}
                style={[
                  styles.weekdayPill,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active
                      ? colors.primary
                      : wd.isToday
                        ? colors.secondaryBorder
                        : colors.borderSubtle,
                  },
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  setSelectedDay(wd.day);
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Select ${wd.day}`}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.weekdayText,
                    { color: active ? '#FFFFFF' : wd.isToday ? colors.secondary : colors.textSecondary },
                    active && { fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  {wd.day}
                </Text>
                <View
                  style={[
                    styles.weekdayDot,
                    {
                      backgroundColor: active
                        ? '#FFFFFF'
                        : hasItems
                          ? colors.primary
                          : 'transparent',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Toast */}
        {feedbackBanner ? (
          <View
            style={[
              styles.toastBanner,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.secondaryBorder },
            ]}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.toastText, { color: colors.text }]}>{feedbackBanner}</Text>
          </View>
        ) : null}

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 12) + 76 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Today's / Day's Routine Progress Card */}
          <View
            style={[
              styles.progressCard,
              { backgroundColor: colors.surface, borderColor: colors.borderMuted },
            ]}
          >
            <View style={styles.progressTopRow}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                {selectedDateObj.isToday ? "Today's Routine" : `${selectedDay}'s Routine`}
              </Text>
              <Text style={[styles.progressFraction, { color: colors.text }]}>
                {dayStats.completed} / {dayStats.total}
              </Text>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dayStats.pct}%`,
                    backgroundColor:
                      dayStats.pct === 100 && dayStats.total > 0 ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Expandable Parent Routine Cards */}
          {dayRoutines.length > 0 ? (
            <View style={styles.routineList}>
              {dayRoutines.map((routine) => {
                const items = routine.items || [];
                const doneCount = items.filter((i) => i.completed).length;
                const allComplete =
                  items.length > 0 &&
                  items.every((i) => i.completed || i.skipped) &&
                  doneCount > 0;
                const isExpanded = Boolean(expandedIds[routine.id]);
                const isReordering = reorderRoutineId === routine.id;
                const iconName = routine.icon || 'flash-outline';
                const accent = ROUTINE_ACCENT_MAP[iconName] || colors.secondary;

                const timeLabel = routine.start_time
                  ? routine.end_time
                    ? `${formatTimeDisplay(routine.start_time)} – ${formatTimeDisplay(routine.end_time)}`
                    : formatTimeDisplay(routine.start_time)
                  : '';

                return (
                  <View
                    key={routine.id}
                    style={[
                      styles.routineCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: allComplete
                          ? 'rgba(16, 185, 129, 0.4)'
                          : isExpanded
                            ? 'rgba(56, 189, 248, 0.25)'
                            : colors.borderMuted,
                      },
                    ]}
                  >
                    {/* Parent Routine Header */}
                    <TouchableOpacity
                      style={styles.routineHeaderRow}
                      onPress={() => toggleExpand(routine.id)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.routineIconBox,
                          {
                            backgroundColor: allComplete
                              ? 'rgba(16, 185, 129, 0.14)'
                              : `${accent}20`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={(allComplete ? 'checkmark-done' : iconName) as any}
                          size={20}
                          color={allComplete ? colors.success : accent}
                        />
                      </View>

                      <View style={styles.routineMetaCol}>
                        <Text
                          style={[styles.routineTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {routine.name}
                        </Text>
                        <View style={styles.routineSubMetaRow}>
                          {timeLabel ? (
                            <Text style={[styles.routineTimeText, { color: colors.textMuted }]}>
                              {timeLabel}
                            </Text>
                          ) : null}
                          {routine.reminder_enabled ? (
                            <Ionicons
                              name="notifications"
                              size={11}
                              color={colors.secondary}
                              style={{ marginLeft: timeLabel ? 6 : 0 }}
                            />
                          ) : null}
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.routineCounter,
                          { color: allComplete ? colors.success : colors.textSecondary },
                        ]}
                      >
                        {doneCount} / {items.length}
                      </Text>

                      <TouchableOpacity
                        style={styles.menuDotsBtn}
                        onPress={() => {
                          playSound('buttonTap');
                          setMenuRoutine(routine);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        accessibilityLabel={`Options for ${routine.name}`}
                      >
                        <Ionicons name="ellipsis-vertical" size={17} color={colors.textMuted} />
                      </TouchableOpacity>

                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>

                    {/* Expandable Sub-Activities List */}
                    {isExpanded ? (
                      <View
                        style={[
                          styles.subListWrapper,
                          { borderTopColor: colors.borderSubtle },
                        ]}
                      >
                        {isReordering ? (
                          <View style={styles.reorderBanner}>
                            <Text style={[styles.reorderBannerText, { color: colors.secondary }]}>
                              Tap arrows to reorder activities
                            </Text>
                            <TouchableOpacity onPress={() => setReorderRoutineId(null)}>
                              <Text style={[styles.reorderDoneBtn, { color: colors.primary }]}>
                                Done
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}

                        {items.map((item, idx) => {
                          const isDone = Boolean(item.completed);
                          const isSkipped = Boolean(item.skipped);

                          return (
                            <View key={item.id} style={styles.subItemRow}>
                              {/* 44px Checkbox Touch Area */}
                              <TouchableOpacity
                                style={styles.subCheckTouch}
                                onPress={() => handleToggleSubActivity(item)}
                                activeOpacity={0.7}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: isDone }}
                                accessibilityLabel={`${item.title}`}
                              >
                                <View
                                  style={[
                                    styles.subCheckCircle,
                                    isDone && {
                                      backgroundColor: colors.primary,
                                      borderColor: colors.primary,
                                    },
                                    isSkipped && {
                                      backgroundColor: colors.inputBackground,
                                      borderColor: colors.borderMuted,
                                    },
                                    !isDone &&
                                    !isSkipped && {
                                      borderColor: colors.borderFocus,
                                    },
                                  ]}
                                >
                                  {isDone ? (
                                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                  ) : isSkipped ? (
                                    <Ionicons name="play-skip-forward" size={11} color={colors.textMuted} />
                                  ) : null}
                                </View>
                              </TouchableOpacity>

                              {/* Activity Text */}
                              <TouchableOpacity
                                style={styles.subItemTextCol}
                                onPress={() => handleToggleSubActivity(item)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.subItemTitle,
                                    { color: isDone || isSkipped ? colors.textMuted : colors.text },
                                    (isDone || isSkipped) && styles.strikeText,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.title}
                                </Text>
                                {item.duration || item.scheduled_time || isSkipped ? (
                                  <Text style={[styles.subItemMeta, { color: colors.textMuted }]}>
                                    {[
                                      item.duration,
                                      item.scheduled_time ? formatTimeDisplay(item.scheduled_time) : '',
                                      isSkipped ? 'Skipped' : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </Text>
                                ) : null}
                              </TouchableOpacity>

                              {/* Reorder Arrows OR Skip Pill */}
                              {isReordering ? (
                                <View style={styles.reorderArrows}>
                                  <TouchableOpacity
                                    style={styles.arrowBtn}
                                    onPress={() => handleMoveSubActivity(routine, idx, -1)}
                                    disabled={idx === 0}
                                  >
                                    <Ionicons
                                      name="arrow-up"
                                      size={16}
                                      color={idx === 0 ? colors.textDisabled : colors.text}
                                    />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.arrowBtn}
                                    onPress={() => handleMoveSubActivity(routine, idx, 1)}
                                    disabled={idx === items.length - 1}
                                  >
                                    <Ionicons
                                      name="arrow-down"
                                      size={16}
                                      color={
                                        idx === items.length - 1 ? colors.textDisabled : colors.text
                                      }
                                    />
                                  </TouchableOpacity>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={styles.skipBtn}
                                  onPress={() => handleSkipSubActivity(item)}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  accessibilityLabel={isSkipped ? 'Unskip activity' : 'Skip activity'}
                                >
                                  <Ionicons
                                    name={isSkipped ? 'refresh-outline' : 'play-skip-forward-outline'}
                                    size={15}
                                    color={isSkipped ? colors.secondary : colors.textMuted}
                                  />
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}

                        {/* Inline Add Sub-Activity shortcut */}
                        <TouchableOpacity
                          style={styles.inlineEditSubBtn}
                          onPress={() => openEditRoutine(routine.id)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="add-circle-outline" size={15} color={colors.secondary} />
                          <Text style={[styles.inlineEditSubText, { color: colors.secondary }]}>
                            Add / Edit Sub-Activities
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.borderMuted },
              ]}
            >
              <Ionicons name="calendar-clear-outline" size={34} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No routines for {selectedDay}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Add a new routine for {selectedDay} or load starter templates like Workout and Bible Reading.
              </Text>

              {routines.length === 0 ? (
                <TouchableOpacity
                  style={[
                    styles.starterBtn,
                    { backgroundColor: colors.secondarySubtle, borderColor: colors.secondaryBorder },
                  ]}
                  onPress={loadStarterProtocols}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Load Starter Routines"
                >
                  <Ionicons name="flash-outline" size={16} color={colors.secondary} />
                  <Text style={[styles.starterBtnText, { color: colors.secondary }]}>
                    Load Starter Routines
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* Bottom Sticky "+ Add Routine" CTA */}
        <View style={styles.bottomCtaBar}>
          <TouchableOpacity
            style={[styles.addRoutineBtn, { backgroundColor: colors.primary }]}
            onPress={openAddRoutine}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addRoutineBtnText}>Add Routine</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Routine Options Bottom Sheet Modal */}
      <Modal
        visible={Boolean(menuRoutine)}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuRoutine(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setMenuRoutine(null)}
        >
          <View
            style={[
              styles.sheetCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.borderMuted },
            ]}
          >
            {menuRoutine ? (
              <>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {menuRoutine.name}
                </Text>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => openEditRoutine(menuRoutine.id)}
                >
                  <Ionicons name="create-outline" size={19} color={colors.secondary} />
                  <Text style={[styles.sheetOptionText, { color: colors.text }]}>
                    Edit Routine & Sub-Activities
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    const r = menuRoutine;
                    setMenuRoutine(null);
                    setExpandedIds((prev) => ({ ...prev, [r.id]: true }));
                    setReorderRoutineId(r.id);
                  }}
                >
                  <Ionicons name="swap-vertical-outline" size={19} color={colors.text} />
                  <Text style={[styles.sheetOptionText, { color: colors.text }]}>
                    Reorder Activities
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => openDuplicateModal(menuRoutine)}
                >
                  <Ionicons name="copy-outline" size={19} color="#F59E0B" />
                  <Text style={[styles.sheetOptionText, { color: colors.text }]}>
                    Duplicate to Selected Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    const allDone = (menuRoutine.items || []).every((i) => i.completed);
                    toggleParentRoutine(menuRoutine.id, selectedDateObj.date, !allDone);
                    setMenuRoutine(null);
                  }}
                >
                  <Ionicons name="checkmark-done-outline" size={19} color={colors.success} />
                  <Text style={[styles.sheetOptionText, { color: colors.text }]}>
                    {(menuRoutine.items || []).every((i) => i.completed)
                      ? `Uncheck All for ${selectedDay}`
                      : `Complete All for ${selectedDay}`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => handleDeleteRoutineConfirm(menuRoutine)}
                >
                  <Ionicons name="trash-outline" size={19} color={colors.danger} />
                  <Text style={[styles.sheetOptionText, { color: colors.danger }]}>
                    Delete Routine
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Duplicate Routine to Days Modal */}
      <Modal
        visible={Boolean(duplicateTargetRoutine)}
        transparent
        animationType="fade"
        onRequestClose={() => setDuplicateTargetRoutine(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.dialogCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.borderMuted },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Duplicate &quot;{duplicateTargetRoutine?.name}&quot;
            </Text>
            <Text style={[styles.dialogSub, { color: colors.textMuted }]}>
              Create an independent copy on selected days:
            </Text>

            <View style={styles.dayGrid}>
              {WEEKDAYS_ORDERED.map((d) => {
                const picked = duplicateSelectedDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dayPickCircle,
                      {
                        backgroundColor: picked ? colors.primary : colors.inputBackground,
                        borderColor: picked ? colors.primary : colors.borderMuted,
                      },
                    ]}
                    onPress={() => {
                      setDuplicateSelectedDays((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.dayPickText,
                        { color: picked ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogCancelBtn, { borderColor: colors.borderMuted }]}
                onPress={() => setDuplicateTargetRoutine(null)}
              >
                <Text style={[styles.dialogCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogConfirmBtn,
                  {
                    backgroundColor:
                      duplicateSelectedDays.length > 0 ? colors.primary : colors.borderMuted,
                  },
                ]}
                onPress={handleConfirmDuplicate}
                disabled={duplicateSelectedDays.length === 0}
              >
                <Text style={styles.dialogConfirmText}>Duplicate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Copy Entire Weekday Routine Modal */}
      <Modal
        visible={copyDayModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCopyDayModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.dialogCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.borderMuted },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Copy {selectedDay}&apos;s Routines
            </Text>
            <Text style={[styles.dialogSub, { color: colors.textMuted }]}>
              Copy all {dayRoutines.length} routine(s) from {selectedDay} to selected days so each day stays independently editable:
            </Text>

            <View style={styles.dayGrid}>
              {WEEKDAYS_ORDERED.filter((d) => d !== selectedDay).map((d) => {
                const picked = copyTargetDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dayPickCircle,
                      {
                        backgroundColor: picked ? colors.primary : colors.inputBackground,
                        borderColor: picked ? colors.primary : colors.borderMuted,
                      },
                    ]}
                    onPress={() => {
                      setCopyTargetDays((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.dayPickText,
                        { color: picked ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogCancelBtn, { borderColor: colors.borderMuted }]}
                onPress={() => setCopyDayModalVisible(false)}
              >
                <Text style={[styles.dialogCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogConfirmBtn,
                  {
                    backgroundColor:
                      copyTargetDays.length > 0 && dayRoutines.length > 0
                        ? colors.primary
                        : colors.borderMuted,
                  },
                ]}
                onPress={handleConfirmCopyDay}
                disabled={copyTargetDays.length === 0 || dayRoutines.length === 0}
              >
                <Text style={styles.dialogConfirmText}>Copy Routines</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  copyDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  copyDayText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  weekdayBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 5,
    marginBottom: 12,
  },
  weekdayPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  weekdayText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  weekdayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressFraction: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  routineList: {
    gap: 12,
  },
  routineCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  routineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 64,
    gap: 10,
  },
  routineIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineMetaCol: {
    flex: 1,
    minWidth: 0,
  },
  routineTitle: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  routineSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  routineTimeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  routineCounter: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  menuDotsBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subListWrapper: {
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  reorderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  reorderBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reorderDoneBtn: {
    fontSize: 13,
    fontWeight: '800',
  },
  subItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingVertical: 4,
  },
  subCheckTouch: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subItemTextCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  subItemTitle: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  strikeText: {
    textDecorationLine: 'line-through',
  },
  subItemMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  skipBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineEditSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  inlineEditSubText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  starterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  starterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomCtaBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  addRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addRoutineBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  sheetOptionText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  dialogSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  dayPickCircle: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPickText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
