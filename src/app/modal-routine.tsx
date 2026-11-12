import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_ORDERED } from '@/services/dateUtils';
import { DayOfWeek, RoutineCategory, RoutineDraftItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICON_CHOICES = [
  'barbell-outline',
  'book-outline',
  'school-outline',
  'sunny-outline',
  'flash-outline',
  'water-outline',
  'heart-outline',
  'code-slash-outline',
  'briefcase-outline',
  'moon-outline',
];

const START_TIME_PRESETS = ['6:00 AM', '7:00 AM', '8:00 AM', '12:00 PM', '5:00 PM', '8:00 PM'];
const DURATION_PRESETS = ['5 min', '10 min', '15 min', '30 min', '45 min'];
const REMINDER_OFFSETS = ['At start time', '10 min before', '15 min before', '30 min before'];

export default function ModalRoutineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 640;

  const params = useLocalSearchParams<{
    id?: string;
    defaultDay?: DayOfWeek;
    activeDay?: DayOfWeek;
  }>();
  const { routines, addRoutine, editRoutine } = useDatabase();
  const { playSound, triggerHaptic } = useSound();

  const isEditing = Boolean(params.id);
  const existingRoutine = isEditing ? routines.find((r) => r.id === params.id) : null;

  const [name, setName] = useState(existingRoutine?.name || '');
  const [nameError, setNameError] = useState(false);
  const [icon, setIcon] = useState(existingRoutine?.icon || 'barbell-outline');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [startTime, setStartTime] = useState(existingRoutine?.start_time || '6:00 AM');
  const [endTime, setEndTime] = useState(existingRoutine?.end_time || '6:45 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>(
    existingRoutine?.repeat_days && existingRoutine.repeat_days.length > 0
      ? (existingRoutine.repeat_days as DayOfWeek[])
      : params.defaultDay
        ? [params.defaultDay]
        : ['Mon']
  );

  // Filter out implicit placeholder item if user originally created a quick routine with 0 sub-activities
  const initialSubItems: RoutineDraftItem[] =
    existingRoutine?.items && existingRoutine.items.length > 0
      ? existingRoutine.items.map((i) => ({
          id: i.id,
          title: i.title,
          duration: i.duration || '',
          scheduled_time: i.scheduled_time || '',
        }))
      : [];

  const [subActivities, setSubActivities] = useState<RoutineDraftItem[]>(initialSubItems);
  const [expandedSubIdx, setExpandedSubIdx] = useState<number | null>(null);

  // Progressive disclosure fields
  const [showMoreOptions, setShowMoreOptions] = useState(
    Boolean(existingRoutine?.reminder_enabled)
  );
  const [category, setCategory] = useState<RoutineCategory>(
    existingRoutine?.category || 'morning'
  );
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    Boolean(existingRoutine?.reminder_enabled)
  );
  const [reminderTime, setReminderTime] = useState<string>(
    existingRoutine?.reminder_time || '10 min before'
  );

  // When editing a shared multi-day routine from a specific day, allow detaching that day independently
  const activeDay = params.activeDay;
  const canEditSingleDayOnly =
    Boolean(
      isEditing &&
        existingRoutine &&
        activeDay &&
        existingRoutine.repeat_days.length > 1 &&
        existingRoutine.repeat_days.includes(activeDay)
    );
  const [applyOnlyToActiveDay, setApplyOnlyToActiveDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') router.back();
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [router]);

  const toggleDay = (day: DayOfWeek) => {
    playSound('buttonTap');
    triggerHaptic('light');
    if (repeatDays.includes(day)) {
      if (repeatDays.length === 1) return;
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const applyDayPreset = (preset: 'daily' | 'weekdays' | 'weekend') => {
    playSound('buttonTap');
    if (preset === 'daily') setRepeatDays([...WEEKDAYS_ORDERED]);
    else if (preset === 'weekdays') setRepeatDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    else setRepeatDays(['Sat', 'Sun']);
  };

  const handleAddSubActivity = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    const nextIdx = subActivities.length;
    setSubActivities([
      ...subActivities,
      { title: '', duration: '10 min', scheduled_time: '' },
    ]);
    setExpandedSubIdx(nextIdx);
  };

  const handleUpdateSub = (
    idx: number,
    field: 'title' | 'duration' | 'scheduled_time',
    val: string
  ) => {
    setSubActivities((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleMoveSub = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= subActivities.length) return;
    playSound('buttonTap');
    setSubActivities((prev) => {
      const copy = [...prev];
      const tmp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = tmp;
      return copy;
    });
  };

  const handleRemoveSub = (idx: number) => {
    playSound('deleteAction');
    setSubActivities((prev) => prev.filter((_, i) => i !== idx));
    if (expandedSubIdx === idx) setExpandedSubIdx(null);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      triggerHaptic('error');
      return;
    }

    setIsSaving(true);
    const cleanItems = subActivities
      .filter((s) => s.title.trim().length > 0)
      .map((s) => ({
        ...s,
        title: s.title.trim(),
      }));

    try {
      if (isEditing && existingRoutine) {
        if (applyOnlyToActiveDay && activeDay) {
          // Detach activeDay from original shared template & save independent clone for activeDay
          const remainingDays = existingRoutine.repeat_days.filter((d) => d !== activeDay);
          if (remainingDays.length > 0) {
            await editRoutine(
              existingRoutine.id,
              existingRoutine.name,
              existingRoutine.category,
              remainingDays,
              (existingRoutine.items || []).map((i) => ({
                id: i.id,
                title: i.title,
                duration: i.duration,
                scheduled_time: i.scheduled_time,
              })),
              {
                icon: existingRoutine.icon,
                startTime: existingRoutine.start_time,
                endTime: existingRoutine.end_time,
                reminderEnabled: existingRoutine.reminder_enabled,
                reminderTime: existingRoutine.reminder_time,
              }
            );
          }
          await addRoutine(
            trimmed,
            category,
            [activeDay],
            cleanItems.map(({ title, duration, scheduled_time }) => ({
              title,
              duration,
              scheduled_time,
            })),
            {
              icon,
              startTime: startTime.trim(),
              endTime: endTime.trim(),
              reminderEnabled,
              reminderTime,
            }
          );
        } else {
          await editRoutine(existingRoutine.id, trimmed, category, repeatDays, cleanItems, {
            icon,
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            reminderEnabled,
            reminderTime,
          });
        }
      } else {
        await addRoutine(trimmed, category, repeatDays, cleanItems, {
          icon,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          reminderEnabled,
          reminderTime,
        });
      }

      playSound('webShoot');
      triggerHaptic('success');
      router.back();
    } catch (err) {
      console.error('Failed to save routine:', err);
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 24) }, isDesktop && styles.overlayDesktop]}>
      <TouchableWithoutFeedback onPress={() => router.back()}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardWrap, isDesktop && styles.keyboardWrapDesktop]}
      >
        <View
          style={[
            styles.card,
            isDesktop && styles.cardDesktop,
            { backgroundColor: colors.surface, borderColor: colors.secondaryBorder },
          ]}
        >
          {/* Top Close Row + Hero Icon Badge */}
          <View style={styles.topSection}>
            <View style={{ width: 36 }} />
            <TouchableOpacity
              style={[
                styles.heroIconBadge,
                { backgroundColor: colors.secondarySubtle, borderColor: colors.secondaryBorder },
              ]}
              onPress={() => {
                playSound('buttonTap');
                setShowIconPicker((v) => !v);
              }}
              activeOpacity={0.8}
              accessibilityLabel="Select routine icon"
            >
              <Ionicons name={icon as any} size={26} color={colors.secondary} />
              <View style={[styles.editBadgeDot, { backgroundColor: colors.surface }]}>
                <Ionicons name="pencil" size={10} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.closeBtn, { backgroundColor: colors.inputBackground }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={19} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {isEditing ? 'Edit Routine' : 'Add Routine'}
          </Text>
          <Text style={[styles.modalSub, { color: colors.textMuted }]}>
            Plan your perfect day.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollBody,
              { paddingBottom: Math.max(insets.bottom + 16, 28) },
            ]}
          >
            {/* Optional Icon Picker Drawer */}
            {showIconPicker ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconRow}
              >
                {ICON_CHOICES.map((ic) => {
                  const selected = icon === ic;
                  return (
                    <TouchableOpacity
                      key={ic}
                      style={[
                        styles.iconChoice,
                        {
                          backgroundColor: selected
                            ? colors.secondarySubtle
                            : colors.inputBackground,
                          borderColor: selected ? colors.secondary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        playSound('buttonTap');
                        setIcon(ic);
                        setShowIconPicker(false);
                      }}
                    >
                      <Ionicons
                        name={ic as any}
                        size={20}
                        color={selected ? colors.secondary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Routine Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Routine name
              </Text>
              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: nameError ? colors.danger : colors.borderMuted,
                  },
                ]}
              >
                <Ionicons name={icon as any} size={17} color={colors.secondary} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g. Workout"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (nameError && t.trim()) setNameError(false);
                  }}
                  autoFocus={!isEditing}
                />
              </View>
              {nameError ? (
                <Text style={[styles.errorHint, { color: colors.danger }]}>
                  Please enter a routine name
                </Text>
              ) : null}
            </View>

            {/* Time Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Time</Text>
              <TouchableOpacity
                style={[
                  styles.timePillRow,
                  { backgroundColor: colors.inputBackground, borderColor: colors.borderMuted },
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  setShowTimePicker((v) => !v);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.timeDisplayText, { color: colors.text }]}>
                  {startTime} – {endTime}
                </Text>
                <Ionicons
                  name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {showTimePicker ? (
                <View
                  style={[
                    styles.timeDrawer,
                    { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.timeInputPair}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.miniLabel, { color: colors.textMuted }]}>Start Time</Text>
                      <TextInput
                        style={[
                          styles.miniInput,
                          { color: colors.text, borderColor: colors.borderMuted },
                        ]}
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="6:00 AM"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.miniLabel, { color: colors.textMuted }]}>End Time</Text>
                      <TextInput
                        style={[
                          styles.miniInput,
                          { color: colors.text, borderColor: colors.borderMuted },
                        ]}
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="6:45 AM"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.presetsWrap}>
                    {START_TIME_PRESETS.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor:
                              startTime === p ? colors.secondarySubtle : colors.surface,
                            borderColor:
                              startTime === p ? colors.secondary : colors.borderSubtle,
                          },
                        ]}
                        onPress={() => setStartTime(p)}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            { color: startTime === p ? colors.secondary : colors.textSecondary },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>

            {/* Repeat On (M T W T F S S) */}
            <View style={styles.fieldGroup}>
              <View style={styles.repeatHeaderRow}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Repeat on
                </Text>
                <View style={styles.dayPresetsRow}>
                  <TouchableOpacity onPress={() => applyDayPreset('weekdays')}>
                    <Text style={[styles.dayPresetLink, { color: colors.secondary }]}>Weekdays</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => applyDayPreset('daily')}>
                    <Text style={[styles.dayPresetLink, { color: colors.secondary }]}>Every day</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.daysCircleRow}>
                {WEEKDAYS_ORDERED.map((d) => {
                  const selected = repeatDays.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dayCircleBtn,
                        {
                          backgroundColor: selected ? colors.primary : colors.inputBackground,
                          borderColor: selected ? colors.primary : colors.borderMuted,
                        },
                      ]}
                      onPress={() => toggleDay(d)}
                      activeOpacity={0.8}
                      accessibilityLabel={d}
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.dayCircleText,
                          { color: selected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {d.slice(0, 1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Single-Day Detach Option when editing multi-day routine */}
            {canEditSingleDayOnly ? (
              <View
                style={[
                  styles.singleDayBanner,
                  { backgroundColor: colors.inputBackground, borderColor: colors.borderMuted },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.singleDayTitle, { color: colors.text }]}>
                    Edit only for {activeDay}
                  </Text>
                  <Text style={[styles.singleDaySub, { color: colors.textMuted }]}>
                    Keep other scheduled days unchanged
                  </Text>
                </View>
                <Switch
                  value={applyOnlyToActiveDay}
                  onValueChange={setApplyOnlyToActiveDay}
                  trackColor={{ false: colors.borderMuted, true: colors.secondary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ) : null}

            {/* Sub-Activities Section */}
            <View style={styles.fieldGroup}>
              <View style={styles.repeatHeaderRow}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Sub-Activities ({subActivities.length})
                </Text>
                <Text style={[styles.optionalTag, { color: colors.textMuted }]}>
                  Optional
                </Text>
              </View>

              {subActivities.map((sub, idx) => (
                <View
                  key={sub.id || `sub-${idx}`}
                  style={[
                    styles.subDraftCard,
                    { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.subDraftTop}>
                    <TextInput
                      style={[styles.subNameInput, { color: colors.text }]}
                      placeholder={`Activity #${idx + 1} (e.g. Warm-up)`}
                      placeholderTextColor={colors.textMuted}
                      value={sub.title}
                      onChangeText={(val) => handleUpdateSub(idx, 'title', val)}
                    />
                    <TouchableOpacity
                      style={styles.subActionIcon}
                      onPress={() => handleMoveSub(idx, -1)}
                      disabled={idx === 0}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={15}
                        color={idx === 0 ? colors.textDisabled : colors.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.subActionIcon}
                      onPress={() => handleMoveSub(idx, 1)}
                      disabled={idx === subActivities.length - 1}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={15}
                        color={
                          idx === subActivities.length - 1
                            ? colors.textDisabled
                            : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.subActionIcon}
                      onPress={() => handleRemoveSub(idx)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Optional Duration / Start time toggle */}
                  <View style={styles.subMetaRow}>
                    <TextInput
                      style={[
                        styles.subSmallInput,
                        { color: colors.text, borderColor: colors.borderSubtle },
                      ]}
                      placeholder="Duration (e.g. 10 min)"
                      placeholderTextColor={colors.textMuted}
                      value={sub.duration || ''}
                      onChangeText={(val) => handleUpdateSub(idx, 'duration', val)}
                    />
                    <TextInput
                      style={[
                        styles.subSmallInput,
                        { color: colors.text, borderColor: colors.borderSubtle },
                      ]}
                      placeholder="Time (optional)"
                      placeholderTextColor={colors.textMuted}
                      value={sub.scheduled_time || ''}
                      onChangeText={(val) => handleUpdateSub(idx, 'scheduled_time', val)}
                    />
                  </View>

                  {expandedSubIdx === idx ? (
                    <View style={styles.durQuickRow}>
                      {DURATION_PRESETS.map((dp) => (
                        <TouchableOpacity
                          key={dp}
                          style={[styles.durQuickPill, { borderColor: colors.borderSubtle }]}
                          onPress={() => handleUpdateSub(idx, 'duration', dp)}
                        >
                          <Text style={[styles.durQuickText, { color: colors.textSecondary }]}>
                            {dp}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.addSubRowBtn,
                  { backgroundColor: colors.inputBackground, borderColor: colors.borderMuted },
                ]}
                onPress={handleAddSubActivity}
                activeOpacity={0.8}
              >
                <View style={styles.addSubLeft}>
                  <Ionicons name="add" size={18} color={colors.secondary} />
                  <Text style={[styles.addSubText, { color: colors.text }]}>Add Activity</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Progressive Disclosure: More Options */}
            <TouchableOpacity
              style={styles.moreOptionsBtn}
              onPress={() => {
                playSound('buttonTap');
                setShowMoreOptions((v) => !v);
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.moreOptionsText, { color: colors.textSecondary }]}>
                More options
              </Text>
              <Ionicons
                name={showMoreOptions ? 'chevron-up' : 'chevron-down'}
                size={15}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showMoreOptions ? (
              <View
                style={[
                  styles.moreOptionsPanel,
                  { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle },
                ]}
              >
                {/* Category */}
                <Text style={[styles.miniLabel, { color: colors.textMuted, marginBottom: 6 }]}>
                  Time of Day Category
                </Text>
                <View style={styles.catChipRow}>
                  {(['morning', 'afternoon', 'evening', 'night'] as RoutineCategory[]).map(
                    (cat) => {
                      const active = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.catChip,
                            {
                              backgroundColor: active ? colors.secondarySubtle : colors.surface,
                              borderColor: active ? colors.secondary : colors.borderSubtle,
                            },
                          ]}
                          onPress={() => setCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              { color: active ? colors.secondary : colors.textSecondary },
                            ]}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* Reminders */}
                <View style={[styles.reminderToggleRow, { borderTopColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reminderLabel, { color: colors.text }]}>
                      Routine Reminder
                    </Text>
                    <Text style={[styles.reminderHint, { color: colors.textMuted }]}>
                      Notify on scheduled weekdays
                    </Text>
                  </View>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={setReminderEnabled}
                    trackColor={{ false: colors.borderMuted, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {reminderEnabled ? (
                  <View style={styles.presetsWrap}>
                    {REMINDER_OFFSETS.map((off) => {
                      const active = reminderTime === off;
                      return (
                        <TouchableOpacity
                          key={off}
                          style={[
                            styles.presetChip,
                            {
                              backgroundColor: active ? colors.primarySubtle : colors.surface,
                              borderColor: active ? colors.primary : colors.borderSubtle,
                            },
                          ]}
                          onPress={() => setReminderTime(off)}
                        >
                          <Text
                            style={[
                              styles.presetChipText,
                              { color: active ? colors.primary : colors.textSecondary },
                            ]}
                          >
                            {off}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : 'Save Routine →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  keyboardWrap: {
    width: '100%',
  },
  keyboardWrapDesktop: {
    maxWidth: 520,
  },
  card: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  cardDesktop: {
    borderRadius: 22,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  heroIconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  editBadgeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  iconChoice: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  errorHint: {
    fontSize: 11.5,
    marginTop: 4,
    fontWeight: '600',
  },
  timePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  timeDisplayText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
  },
  timeDrawer: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  timeInputPair: {
    flexDirection: 'row',
    gap: 10,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  miniInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13.5,
    fontWeight: '600',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  repeatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayPresetsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dayPresetLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  singleDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
  },
  singleDayTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  singleDaySub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  optionalTag: {
    fontSize: 11.5,
  },
  subDraftCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  subDraftTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subNameInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  subActionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subSmallInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 12.5,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  durQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  durQuickPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  durQuickText: {
    fontSize: 11,
  },
  addSubRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  addSubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addSubText: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreOptionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  moreOptionsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  moreOptionsPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
  },
  catChipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reminderToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    marginBottom: 8,
  },
  reminderLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  reminderHint: {
    fontSize: 11.5,
    marginTop: 1,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});
