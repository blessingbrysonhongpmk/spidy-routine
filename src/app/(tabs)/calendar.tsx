import { useLightning } from '@/components/LightningEffect';
import { TaskItem } from '@/components/TaskItem';
import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import {
  formatDateHeader,
  getMonthMatrix,
  getMonthName,
  getTodayDateString,
} from '@/services/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CalendarScreen() {
  const router = useRouter();
  const {
    allTasks,
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

  // Tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    return allTasks.filter((t) => t.date === selectedDate);
  }, [allTasks, selectedDate]);

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
    <SafeAreaView style={styles.safeArea}>
      <WebBackground />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>MISSION SCHEDULE</Text>
          <Text style={styles.headerTitle}>Tactical Calendar</Text>
        </View>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => {
            playSound('buttonTap');
            setSelectedDate(todayStr);
            setCurrentYear(new Date().getFullYear());
            setCurrentMonth(new Date().getMonth());
          }}
          activeOpacity={0.75}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Navigation Card */}
        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn}>
              <Ionicons name="chevron-back" size={18} color={SpideyColors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {getMonthName(currentMonth)} {currentYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
              <Ionicons name="chevron-forward" size={18} color={SpideyColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.dayHeadersRow}>
            {dayHeaders.map((dh, idx) => (
              <Text key={idx} style={styles.dayHeaderCell}>
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
                        isToday && styles.todayCell,
                        isSelected && styles.selectedDayCell,
                      ]}
                      onPress={() => handleSelectDate(dayStr)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayNumberText,
                          isToday && styles.todayNumberText,
                          isSelected && styles.selectedNumberText,
                        ]}
                      >
                        {dayNum}
                      </Text>

                      {/* Precision Task Indicator Dot */}
                      {hasTasks ? (
                        <View
                          style={[
                            styles.taskDot,
                            isAllDone ? styles.taskDotCompleted : styles.taskDotPending,
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
            <Text style={styles.agendaDateTitle}>
              {formatDateHeader(selectedDate)}
            </Text>
            <Text style={styles.agendaSubtitle}>
              {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'} scheduled
            </Text>
          </View>

          <WebButtonInteraction
            style={styles.addDirectBtn}
            onPress={handleAddTaskForDate}
            variant="compact"
            sound="buttonTap"
            haptic="medium"
          >
            <Ionicons name="add" size={16} color={SpideyColors.textPrimary} />
            <Text style={styles.addDirectText}>New Task</Text>
          </WebButtonInteraction>
        </View>

        {/* Tasks for the Selected Date */}
        {selectedDateTasks.length === 0 ? (
          <View style={styles.emptyAgenda}>
            <Ionicons name="calendar-outline" size={32} color={SpideyColors.textMuted} />
            <Text style={styles.emptyAgendaTitle}>No missions scheduled for this date</Text>
            <Text style={styles.emptyAgendaSub}>
              Tap &quot;New Task&quot; above to deploy an objective on {formatDateHeader(selectedDate).split('•')[0]}.
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
  todayButton: {
    backgroundColor: SpideyColors.surfaceElevated,
    borderWidth: 1,
    borderColor: SpideyColors.borderMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
  },
  todayButtonText: {
    color: SpideyColors.thorBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.sm,
    backgroundColor: SpideyColors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
  },
  monthTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: SpideyColors.borderSubtle,
    marginBottom: Spacing.xs,
  },
  dayHeaderCell: {
    width: 36,
    textAlign: 'center',
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    marginTop: Spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  emptyDayCell: {
    width: 38,
    height: 44,
  },
  dayCell: {
    width: 38,
    height: 44,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  todayCell: {
    borderWidth: 1,
    borderColor: SpideyColors.thorBlue,
    backgroundColor: SpideyColors.thorBlueSubtle,
  },
  selectedDayCell: {
    backgroundColor: SpideyColors.spideyRed,
  },
  dayNumberText: {
    color: SpideyColors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  todayNumberText: {
    color: SpideyColors.thorBlue,
    fontWeight: '700',
  },
  selectedNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  taskDotPending: {
    backgroundColor: SpideyColors.spideyRed,
  },
  taskDotCompleted: {
    backgroundColor: SpideyColors.success,
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
    color: SpideyColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  agendaSubtitle: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.surfaceElevated,
    borderWidth: 1,
    borderColor: SpideyColors.borderMuted,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
    gap: 4,
  },
  addDirectText: {
    color: SpideyColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyAgenda: {
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyAgendaTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyAgendaSub: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
