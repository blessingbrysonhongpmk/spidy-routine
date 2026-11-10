import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { formatShortDate, getTodayDateString } from '@/services/dateUtils';
import { TaskPriority } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function ModalTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; initialDate?: string }>();
  const { tasks, allTasks, addTask, editTask, selectedDate } = useDatabase();
  const { playSound, triggerHaptic } = useSound();

  const isEditing = Boolean(params.id);
  const existingTask = isEditing
    ? allTasks.find((t) => t.id === params.id) || tasks.find((t) => t.id === params.id)
    : null;

  // Primary input - the only required field
  const [title, setTitle] = useState(existingTask?.title || '');

  // Smart defaults
  const todayStr = getTodayDateString();
  const [date, setDate] = useState<string>(
    existingTask?.date || params.initialDate || selectedDate || todayStr
  );
  const [time, setTime] = useState<string>(existingTask?.time || '');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    existingTask?.reminder_enabled ?? false
  );

  // Advanced options (collapsed by default)
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority || 'medium');
  const [category, setCategory] = useState<string>('General');
  const [description, setDescription] = useState(existingTask?.description || '');

  // UI state
  const [showMoreOptions, setShowMoreOptions] = useState(
    Boolean(existingTask?.description || existingTask?.priority === 'high')
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDescriptionInput, setShowDescriptionInput] = useState(Boolean(existingTask?.description));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const datePresets = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return [
      { label: 'Today', value: todayStr },
      { label: 'Tomorrow', value: tomorrow.toISOString().split('T')[0] },
      { label: 'In 3 Days', value: in3Days.toISOString().split('T')[0] },
      { label: 'Next Week', value: nextWeek.toISOString().split('T')[0] },
    ];
  }, [todayStr]);

  // Computed Date label matching design (e.g. "Today", "Mon, Nov 10")
  const dateInfo = useMemo(() => {
    if (!date) return { title: 'No Date', subtitle: 'Optional' };
    if (date === todayStr) {
      return { title: 'Today', subtitle: formatShortDate(date) };
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (date === tomorrowStr) {
      return { title: 'Tomorrow', subtitle: formatShortDate(date) };
    }
    return { title: formatShortDate(date), subtitle: date };
  }, [date, todayStr]);

  const handleQuickDateSelect = (selectedDateStr: string) => {
    playSound('buttonTap');
    triggerHaptic('light');
    setDate(selectedDateStr);
    setShowDatePicker(false);
  };

  const handleQuickTimeSelect = (selectedTimeStr: string) => {
    playSound('buttonTap');
    triggerHaptic('light');
    setTime(selectedTimeStr);
    setShowTimePicker(false);
  };

  const handleTogglePriority = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    const order: TaskPriority[] = ['medium', 'high', 'low'];
    const nextIdx = (order.indexOf(priority) + 1) % order.length;
    setPriority(order[nextIdx]);
  };

  const handleToggleCategory = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    const categories = ['General', 'Work', 'Health', 'Personal'];
    const nextIdx = (categories.indexOf(category) + 1) % categories.length;
    setCategory(categories[nextIdx]);
  };

  const handleToggleReminder = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    setReminderEnabled(!reminderEnabled);
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Task Title Required', 'Please enter what needs to get done.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && existingTask) {
        await editTask({
          ...existingTask,
          title: trimmedTitle,
          description: description.trim(),
          date: date || todayStr,
          time: time.trim() || undefined,
          priority,
          reminder_enabled: reminderEnabled,
        });
      } else {
        await addTask({
          title: trimmedTitle,
          description: description.trim(),
          date: date || todayStr,
          time: time.trim() || undefined,
          priority,
          completed: false,
          reminder_enabled: reminderEnabled,
        });
      }

      playSound('taskSuccess');
      triggerHaptic('success');
      router.back();
    } catch (err) {
      console.error('Failed to save task:', err);
      Alert.alert('Error', 'Could not save task. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'low':
        return '#38BDF8';
      default:
        return '#F59E0B';
    }
  };

  return (
    <View style={styles.modalOverlay}>
      {/* Tap backdrop to dismiss */}
      <TouchableWithoutFeedback onPress={() => router.back()}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <View style={[styles.bottomSheet, { backgroundColor: '#0B0F17' }]}>
          {/* Subtle Spiderweb Watermark Texture */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%" fill="none" opacity={0.1}>
              <Path
                d="M 200 0 L 200 300 M 0 150 L 400 150 M 50 0 L 350 300 M 350 0 L 50 300"
                stroke="#38BDF8"
                strokeWidth="0.8"
              />
              <Path
                d="M 120 70 Q 200 100 280 70 Q 250 150 280 230 Q 200 200 120 230 Q 150 150 120 70 Z"
                stroke="#EF4444"
                strokeWidth="0.6"
              />
            </Svg>
          </View>

          {/* Sheet Header: (✓) Add Task and Close (✕) */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.sheetHeaderTitle}>
                {isEditing ? 'Edit Task' : 'Add Task'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Main Prompt */}
            <Text style={styles.promptHeading}>What needs to get done?</Text>

            {/* Title Input Field with ⚡ Icon */}
            <View style={styles.inputContainer}>
              <Ionicons name="flash" size={17} color="#F59E0B" style={styles.flashIcon} />
              <TextInput
                style={styles.mainInput}
                placeholder="e.g. Complete project assignment"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
                autoFocus={!isEditing}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            {/* Smart Date & Time Row */}
            <View style={styles.dateTimeRow}>
              {/* Date Card */}
              <TouchableOpacity
                style={[
                  styles.selectorCard,
                  showDatePicker && styles.selectorCardActive,
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  setShowDatePicker(!showDatePicker);
                  setShowTimePicker(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.calendarIconBox}>
                  <Ionicons name="calendar" size={17} color="#38BDF8" />
                </View>
                <View style={styles.selectorTextBox}>
                  <Text style={styles.selectorTitle}>{dateInfo.title}</Text>
                  <Text style={styles.selectorSub}>{dateInfo.subtitle}</Text>
                </View>
                <Ionicons
                  name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* Time Card */}
              <TouchableOpacity
                style={[
                  styles.selectorCard,
                  showTimePicker && styles.selectorCardActive,
                ]}
                onPress={() => {
                  playSound('buttonTap');
                  triggerHaptic('light');
                  setShowTimePicker(!showTimePicker);
                  setShowDatePicker(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.timeIconBox}>
                  <Ionicons name="time" size={17} color="#38BDF8" />
                </View>
                <View style={styles.selectorTextBox}>
                  <Text style={styles.selectorTitle}>{time || 'Add time'}</Text>
                  <Text style={styles.selectorSub}>{time ? 'Set' : 'Optional'}</Text>
                </View>
                <Ionicons
                  name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* Quick Date Presets Dropdown */}
            {showDatePicker && (
              <View style={styles.presetsBox}>
                <Text style={styles.presetsHeader}>Select Due Date</Text>
                <View style={styles.presetsRow}>
                  {datePresets.map((p) => (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.presetChip,
                        date === p.value && styles.presetChipActive,
                      ]}
                      onPress={() => handleQuickDateSelect(p.value)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          date === p.value && styles.presetChipTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Time Presets Dropdown */}
            {showTimePicker && (
              <View style={styles.presetsBox}>
                <Text style={styles.presetsHeader}>Select Time</Text>
                <View style={styles.presetsRow}>
                  {[
                    { label: 'None', value: '' },
                    { label: '09:00 AM', value: '09:00' },
                    { label: '01:00 PM', value: '13:00' },
                    { label: '05:00 PM', value: '17:00' },
                    { label: '08:00 PM', value: '20:00' },
                  ].map((p) => (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.presetChip,
                        time === p.value && styles.presetChipActive,
                      ]}
                      onPress={() => handleQuickTimeSelect(p.value)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          time === p.value && styles.presetChipTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Expandable "More options" Divider */}
            <TouchableOpacity
              style={styles.moreOptionsDivider}
              onPress={() => {
                playSound('buttonTap');
                triggerHaptic('light');
                setShowMoreOptions(!showMoreOptions);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.dividerLine} />
              <View style={styles.moreOptionsPill}>
                <Text style={styles.moreOptionsText}>More options</Text>
                <Ionicons
                  name={showMoreOptions ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#94A3B8"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <View style={styles.dividerLine} />
            </TouchableOpacity>

            {/* 4 Quick Tiles for More Options */}
            {showMoreOptions && (
              <View style={styles.optionsTilesRow}>
                {/* 1. Description Tile */}
                <TouchableOpacity
                  style={[
                    styles.optionTile,
                    (showDescriptionInput || description.length > 0) && styles.optionTileActive,
                  ]}
                  onPress={() => {
                    playSound('buttonTap');
                    triggerHaptic('light');
                    setShowDescriptionInput(!showDescriptionInput);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={20} color="#38BDF8" />
                  <Text style={styles.optionTileLabel}>Description</Text>
                  <Text style={styles.optionTileSub}>
                    {description ? 'Added' : 'Optional'}
                  </Text>
                </TouchableOpacity>

                {/* 2. Priority Tile */}
                <TouchableOpacity
                  style={styles.optionTile}
                  onPress={handleTogglePriority}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flag" size={20} color={getPriorityColor()} />
                  <Text style={styles.optionTileLabel}>Priority</Text>
                  <Text style={[styles.optionTileSub, { color: getPriorityColor(), fontWeight: '700' }]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>

                {/* 3. Category Tile */}
                <TouchableOpacity
                  style={styles.optionTile}
                  onPress={handleToggleCategory}
                  activeOpacity={0.7}
                >
                  <Ionicons name="grid-outline" size={20} color="#38BDF8" />
                  <Text style={styles.optionTileLabel}>Category</Text>
                  <Text style={[styles.optionTileSub, { color: '#38BDF8', fontWeight: '700' }]}>
                    {category}
                  </Text>
                </TouchableOpacity>

                {/* 4. Reminder Tile */}
                <TouchableOpacity
                  style={[styles.optionTile, reminderEnabled && styles.optionTileActive]}
                  onPress={handleToggleReminder}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={reminderEnabled ? 'notifications' : 'notifications-outline'}
                    size={20}
                    color={reminderEnabled ? '#EF4444' : '#94A3B8'}
                  />
                  <Text style={styles.optionTileLabel}>Reminder</Text>
                  <Text
                    style={[
                      styles.optionTileSub,
                      { color: reminderEnabled ? '#EF4444' : '#94A3B8', fontWeight: '700' },
                    ]}
                  >
                    {reminderEnabled ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Description Multi-line Input (when active) */}
            {showMoreOptions && showDescriptionInput && (
              <View style={styles.descriptionBox}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Add notes, checklists or subtasks..."
                  placeholderTextColor="#64748B"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {/* Save Task Action Button */}
            <WebButtonInteraction
              style={[
                styles.saveTaskBtn,
                isSubmitting && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              variant="primary"
              sound="webShoot"
              haptic="medium"
              disabled={isSubmitting}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveTaskBtnText}>
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </Text>
            </WebButtonInteraction>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetWrapper: {
    width: '100%',
  },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 38 : Spacing.xl,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  sheetHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  promptHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121824',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    height: 54,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  flashIcon: {
    marginRight: 8,
  },
  mainInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  selectorCard: {
    flex: 1,
    height: 60,
    backgroundColor: '#151D2A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  selectorCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  calendarIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTextBox: {
    flex: 1,
  },
  selectorTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  selectorSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  presetsBox: {
    backgroundColor: '#151D2A',
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  presetChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  moreOptionsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  moreOptionsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  moreOptionsText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '600',
  },
  optionsTilesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  optionTile: {
    flex: 1,
    backgroundColor: '#151D2A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 3,
  },
  optionTileActive: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  optionTileLabel: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
    marginTop: 2,
  },
  optionTileSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  descriptionBox: {
    backgroundColor: '#151D2A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  descriptionInput: {
    color: '#FFFFFF',
    fontSize: 13.5,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveTaskBtn: {
    height: 52,
    borderRadius: Radii.pill,
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
  saveTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
