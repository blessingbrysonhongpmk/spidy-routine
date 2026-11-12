import { useLightning } from '@/components/LightningEffect';
import { TaskItem } from '@/components/TaskItem';
import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import {
  formatDateHeader,
  formatTimeDisplay,
  getDayOfWeekFromDate,
  getMonthMatrix,
  getMonthName,
  getTodayDateString,
} from '@/services/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CalendarScreen() {
  const router = useRouter();
  const colors = useTheme();
  const {
    allTasks,
    routines,
    selectedDate,
    setSelectedDate,
    toggleTask,
    removeTask,
  } = useDatabase();
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();

  const todayStr = getTodayDateString();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const monthMatrix = useMemo(
    () => getMonthMatrix(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Group tasks by date for calendar dot indicators
  const tasksByDateMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    for (const t of allTasks) {
      if (!map[t.date]) {
        map[t.date] = { total: 0, completed: 0 };
      }
      map[t.date].total += 1;
      if (t.completed) {
        map[t.date].completed += 1;
      }
    }
    return map;
  }, [allTasks]);

  // Tasks & weekday routines for the selected date
  const selectedDateTasks = useMemo(() => {
    return allTasks.filter((t) => t.date === selectedDate);
  }, [allTasks, selectedDate]);

  const selectedDateWeekday = useMemo(
    () => getDayOfWeekFromDate(selectedDate),
    [selectedDate]
  );

  const selectedDateRoutines = useMemo(() => {
    return (routines || []).filter(
      (r) => r.repeat_days.length === 0 || r.repeat_days.includes(selectedDateWeekday)
    );
  }, [routines, selectedDateWeekday]);

  const handlePrevMonth = () => {
    playSound('buttonTap');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    playSound('buttonTap');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    playSound('buttonTap');
    triggerHaptic('light');
    triggerLightning({ intensity: 'light', playSoundEffect: false });
    setSelectedDate(dateStr);
  };

  const handleAddTaskForDate = () => {
    router.push({
      pathname: '/modal-task',
      params: { initialDate: selectedDate },
    });
  };

  const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <WebBackground variant="minimal" showLightning={false} />

      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>SCHEDULE</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[
                styles.analyticsQuickBtn,
                { backgroundColor: colors.surface, borderColor: colors.borderMuted },
              ]}
              onPress={() => {
                playSound('buttonTap');
                router.push('/analytics');
              }}
              activeOpacity={0.75}
              accessibilityLabel="View Analytics"
            >
              <Ionicons name="bar-chart-outline" size={16} color={colors.secondary} />
              <Text style={[styles.todayButtonText, { color: colors.secondary }]}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.todayButton, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}
              onPress={() => {
                playSound('buttonTap');
                setSelectedDate(todayStr);
                setCurrentYear(new Date().getFullYear());
                setCurrentMonth(new Date().getMonth());
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.todayButtonText, { color: colors.text }]}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 28 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Month Navigation Card */}
          <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={[styles.navArrowBtn, { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {getMonthName(currentMonth)} {currentYear}
              </Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={[styles.navArrowBtn, { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Day of Week Headers */}
            <View style={[styles.dayHeadersRow, { borderBottomColor: colors.borderSubtle }]}>
              {dayHeaders.map((dh, idx) => (
                <Text key={idx} style={[styles.dayHeaderCell, { color: colors.textMuted }]}>
                  {dh}
                </Text>
              ))}
            </View>

            {/* Calendar Grid Matrix */}
            <View style={styles.gridContainer}>
              {monthMatrix.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekRow}>
                  {week.map((dayStr, dIdx) => {
                    if (!dayStr) {
                      return <View key={dIdx} style={styles.emptyDayCell} />;
                    }

                    const dayNum = parseInt(dayStr.split('-')[2], 10);
                    const isSelected = dayStr === selectedDate;
                    const isToday = dayStr === todayStr;
                    const taskStats = tasksByDateMap[dayStr];
                    const hasTasks = Boolean(taskStats && taskStats.total > 0);
                    const isAllDone = hasTasks && taskStats.total === taskStats.completed;

                    return (
                      <TouchableOpacity
                        key={dIdx}
                        style={[
                          styles.dayCell,
                          isToday && [
                            styles.todayCell,
                            {
                              borderColor: colors.secondary,
                              backgroundColor: colors.secondarySubtle,
                            },
                          ],
                          isSelected && [
                            styles.selectedDayCell,
                            { backgroundColor: colors.primary },
                          ],
                        ]}
                        onPress={() => handleSelectDate(dayStr)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayNumberText,
                            { color: colors.text },
                            isToday && { color: colors.secondary, fontWeight: '700' },
                            isSelected && { color: '#FFFFFF', fontWeight: '800' },
                          ]}
                        >
                          {dayNum}
                        </Text>

                        {/* Precision Task Indicator Dot */}
                        {hasTasks ? (
                          <View
                            style={[
                              styles.taskDot,
                              {
                                backgroundColor: isAllDone ? colors.success : colors.primary,
                              },
                            ]}
                          />
                        ) : (
                          <View style={styles.dotSpacer} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Selected Date Agenda Section */}
          <View style={styles.agendaHeaderRow}>
            <View>
              <Text style={[styles.agendaDateTitle, { color: colors.text }]}>
                {formatDateHeader(selectedDate)}
              </Text>
              <Text style={[styles.agendaSubtitle, { color: colors.textMuted }]}>
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'} scheduled
              </Text>
            </View>

            <WebButtonInteraction
              style={[styles.addDirectBtn, { backgroundColor: colors.primarySubtle, borderColor: colors.primaryBorder }]}
              onPress={handleAddTaskForDate}
              variant="compact"
              sound="buttonTap"
              haptic="medium"
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addDirectText, { color: colors.primary }]}>New Task</Text>
            </WebButtonInteraction>
          </View>

          {/* Tasks for the Selected Date */}
          {selectedDateTasks.length === 0 ? (
            <View style={[styles.emptyAgenda, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyAgendaTitle, { color: colors.text }]}>No tasks scheduled for this date</Text>
              <Text style={[styles.emptyAgendaSub, { color: colors.textMuted }]}>
                Tap &quot;New Task&quot; above to schedule a task on {formatDateHeader(selectedDate).split('•')[0]}.
              </Text>
            </View>
          ) : (
            selectedDateTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={(id, comp) => toggleTask(id, comp)}
                onEdit={(t) => router.push({ pathname: '/modal-task', params: { id: t.id } })}
                onDelete={(id) => removeTask(id)}
              />
            ))
          )}

          {/* Recurring Routines Scheduled for Selected Weekday */}
          {selectedDateRoutines.length > 0 ? (
            <View style={styles.routinePreviewSection}>
              <View style={styles.agendaHeaderRow}>
                <Text style={[styles.agendaDateTitle, { color: colors.text }]}>
                  {selectedDateWeekday} Routines ({selectedDateRoutines.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/routine')}>
                  <Text style={[styles.todayButtonText, { color: colors.secondary }]}>
                    Open Routine →
                  </Text>
                </TouchableOpacity>
              </View>
              {selectedDateRoutines.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.routineMiniRow,
                    { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                  ]}
                  onPress={() => router.push('/(tabs)/routine')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={(r.icon || 'flash-outline') as any}
                    size={18}
                    color={colors.secondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.routineMiniTitle, { color: colors.text }]} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={[styles.routineMiniMeta, { color: colors.textMuted }]}>
                      {r.start_time ? `${formatTimeDisplay(r.start_time)} • ` : ''}
                      {r.items?.length || 0} activities
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>
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
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'android' ? 14 : Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyticsQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
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
  todayButton: {
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 28,
  },
  calendarCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    elevation: 2,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    marginBottom: Spacing.xs,
  },
  dayHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    marginTop: Spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 2,
  },
  emptyDayCell: {
    flex: 1,
    height: 44,
  },
  dayCell: {
    flex: 1,
    height: 44,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  routinePreviewSection: {
    marginTop: 18,
  },
  routineMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 10,
  },
  routineMiniTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  routineMiniMeta: {
    fontSize: 11.5,
    marginTop: 1,
  },
  todayCell: {
    borderWidth: 1,
  },
  selectedDayCell: {},
  dayNumberText: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  dotSpacer: {
    height: 4,
    marginTop: 3,
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  agendaDateTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  agendaSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radii.pill,
    gap: 4,
  },
  addDirectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyAgenda: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyAgendaTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyAgendaSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
});
