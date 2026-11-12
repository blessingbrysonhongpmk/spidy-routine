import { Radii, Spacing } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import {
  addDaysToDateString,
  formatFullDateLabel,
  formatTimeDisplay,
  getTodayDateString,
} from '@/services/dateUtils';
import { TaskPriority } from '@/types';
import { confirmAction } from '@/services/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';

export default function ModalTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 640;

  const params = useLocalSearchParams<{ id?: string; initialDate?: string }>();
  const { tasks, allTasks, addTask, editTask, removeTask, selectedDate } = useDatabase();
  const { playSound, triggerHaptic } = useSound();

  const isEditing = Boolean(params.id);
  const existingTask = isEditing
    ? allTasks.find((t) => t.id === params.id) || tasks.find((t) => t.id === params.id)
    : null;

  // Primary task title
  const [title, setTitle] = useState(existingTask?.title || '');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [titleError, setTitleError] = useState(false);

  // Scheduling
  const todayStr = getTodayDateString();
  const [date, setDate] = useState<string>(
    existingTask?.date || params.initialDate || selectedDate || todayStr
  );
  const [time, setTime] = useState<string>(existingTask?.time || '');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    existingTask?.reminder_enabled ?? false
  );
  const [reminderTime, setReminderTime] = useState<string>(
    existingTask?.reminder_time || '10 min before'
  );

  // Advanced metadata
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority || 'medium');
  const [category, setCategory] = useState<string>(existingTask?.category || 'General');
  const [description, setDescription] = useState(existingTask?.description || '');

  // UI state
  const [showMoreOptions, setShowMoreOptions] = useState(
    Boolean(
      existingTask?.description ||
        existingTask?.priority === 'high' ||
        existingTask?.reminder_enabled ||
        (existingTask?.category && existingTask.category !== 'General')
    )
  );
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Web keyboard escape listener
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          router.back();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [router]);

  // Date Presets (pure local timezone arithmetic — zero UTC shift)
  const datePresets = useMemo(() => {
    return [
      { label: 'Today', value: todayStr },
      { label: 'Tomorrow', value: addDaysToDateString(todayStr, 1) },
      { label: 'In 3 Days', value: addDaysToDateString(todayStr, 3) },
      { label: 'Next Week', value: addDaysToDateString(todayStr, 7) },
    ];
  }, [todayStr]);

  // Format friendly date display
  const friendlyDate = useMemo(() => {
    if (!date) return 'No Date';
    return formatFullDateLabel(date);
  }, [date]);

  // Friendly time display
  const friendlyTime = useMemo(() => {
    if (!time) return 'Set time';
    return formatTimeDisplay(time);
  }, [time]);

  const handleSave = async () => {
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(true);
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    setTitleError(false);

    try {
      if (isEditing && existingTask) {
        await editTask({
          ...existingTask,
          title: trimmedTitle,
          description: description.trim(),
          date: date || todayStr,
          time: time.trim() || undefined,
          priority,
          category,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? reminderTime : '',
        });
      } else {
        await addTask({
          title: trimmedTitle,
          description: description.trim(),
          date: date || todayStr,
          time: time.trim() || undefined,
          priority,
          category,
          completed: false,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? reminderTime : '',
        });
      }

      setSaveSuccess(true);
      playSound('webShoot');
      triggerHaptic('success');

      setTimeout(() => {
        router.back();
      }, 180);
    } catch (err) {
      console.error('Failed to save task:', err);
      setIsSubmitting(false);
      triggerHaptic('error');
    }
  };

  const handleDeleteTask = () => {
    if (!existingTask) return;
    confirmAction({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${existingTask.title}"?`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await removeTask(existingTask.id);
        router.back();
      },
    });
  };

  const priorityOptions: { key: TaskPriority; label: string; color: string }[] = [
    { key: 'low', label: 'Low', color: '#38BDF8' },
    { key: 'medium', label: 'Medium', color: '#F59E0B' },
    { key: 'high', label: 'High', color: '#EF4444' },
  ];

  const categoryOptions = ['General', 'Work', 'Study', 'Personal', 'Health'];
  const reminderOffsets = ['At due time', '10 min before', '30 min before', '1 hour before'];

  const timePresets = [
    { label: '09:00 AM', value: '09:00' },
    { label: '01:00 PM', value: '13:00' },
    { label: '05:00 PM', value: '17:00' },
    { label: '07:00 PM', value: '19:00' },
  ];

  return (
    <View style={[styles.modalOverlay, { paddingTop: Math.max(insets.top, 24) }, isDesktop && styles.modalOverlayDesktop]}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={() => router.back()}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardView, isDesktop && styles.keyboardViewDesktop]}
      >
        <View style={[styles.dialogCard, isDesktop && styles.dialogCardDesktop]}>
          {/* Top Hairline Dual Energy Accent (Spider Red -> Thor Blue) */}
          <View style={styles.topAccentBar} />

          {/* Geometric Web Line Detail in Top Corner */}
          <View style={styles.cornerWebGeometry} pointerEvents="none">
            <Svg width="72" height="72" fill="none">
              <Line x1="0" y1="0" x2="72" y2="72" stroke="rgba(56, 189, 248, 0.14)" strokeWidth="1" />
              <Line x1="36" y1="0" x2="72" y2="36" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
              <Path d="M 0 44 Q 44 44 44 0" stroke="rgba(239, 68, 68, 0.16)" strokeWidth="0.8" />
            </Svg>
          </View>

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeIcon}>
                <Ionicons name="checkbox-outline" size={17} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isEditing ? 'Edit task' : 'Create a task'}
                </Text>
                <Text style={styles.headerSubtitle}>Make today count.</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close dialog"
            >
              <Ionicons name="close" size={19} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Form Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollBody,
              { paddingBottom: Math.max(insets.bottom + 16, 28) },
            ]}
          >
            {/* Primary Task Title Input */}
            <View style={styles.sectionBlock}>
              <View
                style={[
                  styles.titleInputContainer,
                  isTitleFocused && styles.titleInputFocused,
                  titleError && styles.titleInputError,
                ]}
              >
                <TextInput
                  style={styles.titleInput}
                  placeholder="What do you need to get done?"
                  placeholderTextColor="#64748B"
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    if (titleError && val.trim().length > 0) {
                      setTitleError(false);
                    }
                  }}
                  onFocus={() => setIsTitleFocused(true)}
                  onBlur={() => setIsTitleFocused(false)}
                  autoFocus={!isEditing}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  maxLength={160}
                />
                {title.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setTitle('')}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={17} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
              {titleError && (
                <Text style={styles.errorCaption}>Please enter what needs to get done.</Text>
              )}
            </View>

            {/* Date & Time Scheduling Section */}
            <View style={styles.scheduleRow}>
              {/* Date Chip */}
              <TouchableOpacity
                style={[
                  styles.scheduleChip,
                  activePicker === 'date' && styles.scheduleChipActive,
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  setActivePicker(activePicker === 'date' ? null : 'date');
                }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={activePicker === 'date' ? '#38BDF8' : '#94A3B8'}
                />
                <View style={styles.chipTextContainer}>
                  <Text style={styles.chipLabel}>Date</Text>
                  <Text style={styles.chipValue} numberOfLines={1}>
                    {friendlyDate}
                  </Text>
                </View>
                <Ionicons
                  name={activePicker === 'date' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#64748B"
                />
              </TouchableOpacity>

              {/* Time Chip */}
              <TouchableOpacity
                style={[
                  styles.scheduleChip,
                  activePicker === 'time' && styles.scheduleChipActive,
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  setActivePicker(activePicker === 'time' ? null : 'time');
                }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={time ? '#38BDF8' : '#94A3B8'}
                />
                <View style={styles.chipTextContainer}>
                  <Text style={styles.chipLabel}>Time</Text>
                  <Text
                    style={[
                      styles.chipValue,
                      !time && { color: '#64748B', fontWeight: '500' },
                    ]}
                    numberOfLines={1}
                  >
                    {friendlyTime}
                  </Text>
                </View>
                {time ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      playSound('buttonTap');
                      triggerHaptic('light');
                      setTime('');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={15} color="#94A3B8" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons
                    name={activePicker === 'time' ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#64748B"
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Date Presets Dropdown */}
            {activePicker === 'date' && (
              <View style={styles.pickerDrawer}>
                <Text style={styles.drawerTitle}>Select Due Date</Text>
                <View style={styles.pillWrap}>
                  {datePresets.map((p) => {
                    const isSelected = date === p.value;
                    return (
                      <TouchableOpacity
                        key={p.label}
                        style={[styles.optionPill, isSelected && styles.optionPillActive]}
                        onPress={() => {
                          playSound('buttonTap');
                          triggerHaptic('light');
                          setDate(p.value);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionPillText, isSelected && styles.optionPillTextActive]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quick Time Presets Dropdown */}
            {activePicker === 'time' && (
              <View style={styles.pickerDrawer}>
                <Text style={styles.drawerTitle}>Select Scheduled Time</Text>
                <View style={styles.pillWrap}>
                  {timePresets.map((t) => {
                    const isSelected = time === t.value;
                    return (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.optionPill, isSelected && styles.optionPillActive]}
                        onPress={() => {
                          playSound('buttonTap');
                          triggerHaptic('light');
                          setTime(t.value);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionPillText, isSelected && styles.optionPillTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {time ? (
                    <TouchableOpacity
                      style={[styles.optionPill, styles.clearTimePill]}
                      onPress={() => {
                        playSound('buttonTap');
                        triggerHaptic('light');
                        setTime('');
                        setActivePicker(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearTimeText}>Clear time</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* More Options Expander */}
            <TouchableOpacity
              style={styles.moreOptionsTrigger}
              onPress={() => {
                playSound('buttonTap');
                triggerHaptic('light');
                setShowMoreOptions(!showMoreOptions);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.dividerHairline} />
              <View style={styles.moreOptionsCenter}>
                <Text style={styles.moreOptionsTitle}>
                  {showMoreOptions ? 'Fewer options' : 'More options'}
                </Text>
                <Ionicons
                  name={showMoreOptions ? 'chevron-up' : 'chevron-down'}
                  size={13}
                  color="#94A3B8"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <View style={styles.dividerHairline} />
            </TouchableOpacity>

            {/* Collapsible Advanced Form */}
            {showMoreOptions && (
              <View style={styles.advancedSection}>
                {/* 1. Priority Selector */}
                <View style={styles.advancedField}>
                  <Text style={styles.fieldLabel}>PRIORITY</Text>
                  <View style={styles.priorityGroup}>
                    {priorityOptions.map((opt) => {
                      const isSelected = priority === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[
                            styles.priorityPill,
                            isSelected && {
                              borderColor: opt.color,
                              backgroundColor: `${opt.color}15`,
                            },
                          ]}
                          onPress={() => {
                            playSound('buttonTap');
                            triggerHaptic('light');
                            setPriority(opt.key);
                          }}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              styles.priorityDot,
                              { backgroundColor: opt.color },
                              isSelected && { transform: [{ scale: 1.2 }] },
                            ]}
                          />
                          <Text
                            style={[
                              styles.priorityText,
                              isSelected && { color: '#FFFFFF', fontWeight: '700' },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Category Selector */}
                <View style={styles.advancedField}>
                  <Text style={styles.fieldLabel}>CATEGORY</Text>
                  <View style={styles.pillWrap}>
                    {categoryOptions.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                          onPress={() => {
                            playSound('buttonTap');
                            triggerHaptic('light');
                            setCategory(cat);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.categoryPillText,
                              isSelected && styles.categoryPillTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Description / Notes */}
                <View style={styles.advancedField}>
                  <Text style={styles.fieldLabel}>NOTES & DETAILS</Text>
                  <View style={styles.descriptionContainer}>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="Add supplementary notes, objectives or links..."
                      placeholderTextColor="#64748B"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* 4. Reminder Alert Toggle + Offset Pills */}
                <View style={styles.reminderRow}>
                  <View style={styles.reminderInfo}>
                    <View style={styles.reminderIconBox}>
                      <Ionicons
                        name={reminderEnabled ? 'notifications' : 'notifications-outline'}
                        size={16}
                        color={reminderEnabled ? '#EF4444' : '#94A3B8'}
                      />
                    </View>
                    <View>
                      <Text style={styles.reminderTitle}>Task Reminder</Text>
                      <Text style={styles.reminderSub}>
                        {reminderEnabled ? reminderTime : 'Alert before scheduled time'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.toggleTrack,
                      reminderEnabled && styles.toggleTrackActive,
                    ]}
                    onPress={() => {
                      playSound('buttonTap');
                      triggerHaptic('light');
                      setReminderEnabled(!reminderEnabled);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        reminderEnabled && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {reminderEnabled ? (
                  <View style={[styles.pillWrap, { marginTop: 8 }]}>
                    {reminderOffsets.map((off) => {
                      const isSel = reminderTime === off;
                      return (
                        <TouchableOpacity
                          key={off}
                          style={[styles.categoryPill, isSel && styles.categoryPillActive]}
                          onPress={() => {
                            playSound('buttonTap');
                            setReminderTime(off);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.categoryPillText,
                              isSel && styles.categoryPillTextActive,
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
            )}

            {/* Bottom Actions Row */}
            <View style={styles.footerRow}>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteTask}
                  activeOpacity={0.75}
                  accessibilityLabel="Delete task"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              ) : isDesktop ? (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isDesktop && styles.saveButtonDesktop,
                  (!title.trim() || isSubmitting) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSubmitting || !title.trim()}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                ) : saveSuccess ? (
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                ) : null}
                <Text style={styles.saveButtonText}>
                  {isSubmitting
                    ? 'Saving...'
                    : isEditing
                      ? 'Save Changes →'
                      : 'Create Task →'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5, 7, 12, 0.72)',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  keyboardView: {
    width: '100%',
  },
  keyboardViewDesktop: {
    width: '100%',
    maxWidth: 580,
  },
  dialogCard: {
    backgroundColor: '#0D131F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.16)',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  dialogCardDesktop: {
    borderRadius: 20,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  topAccentBar: {
    height: 2,
    width: '100%',
    backgroundColor: '#38BDF8',
    opacity: 0.8,
  },
  cornerWebGeometry: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 72,
    height: 72,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  titleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2A',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    minHeight: 50,
  },
  titleInputFocused: {
    borderColor: 'rgba(56, 189, 248, 0.7)',
    backgroundColor: '#152033',
  },
  titleInputError: {
    borderColor: '#EF4444',
  },
  titleInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  clearBtn: {
    padding: 4,
  },
  errorCaption: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  scheduleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  scheduleChipActive: {
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  chipTextContainer: {
    flex: 1,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 1,
  },
  pickerDrawer: {
    backgroundColor: '#131B2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 12,
    marginBottom: 14,
  },
  drawerTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#1B2436',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionPillActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  optionPillTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  clearTimePill: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  clearTimeText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  moreOptionsTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerHairline: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  moreOptionsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  moreOptionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  advancedSection: {
    backgroundColor: '#101726',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 16,
    gap: 14,
  },
  advancedField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161F30',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  categoryPillText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  descriptionContainer: {
    backgroundColor: '#161F30',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  descriptionInput: {
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 54,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  reminderSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  deleteButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDesktop: {
    flex: 0,
    minWidth: 140,
    paddingHorizontal: 22,
  },
  saveButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
