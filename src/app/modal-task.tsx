import { useLightning } from '@/components/LightningEffect';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { getTodayDateString } from '@/services/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ModalTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; initialDate?: string }>();
  const { tasks, allTasks, addTask, editTask, selectedDate } = useDatabase();
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();

  const isEditing = Boolean(params.id);
  const existingTask = isEditing
    ? allTasks.find((t) => t.id === params.id) || tasks.find((t) => t.id === params.id)
    : null;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [date, setDate] = useState(
    existingTask?.date || params.initialDate || selectedDate || getTodayDateString()
  );
  const [time, setTime] = useState(existingTask?.time || '10:00');
  const [reminderEnabled, setReminderEnabled] = useState(
    existingTask?.reminder_enabled ?? true
  );

  const todayStr = getTodayDateString();

  const handleQuickDate = (targetDate: string) => {
    playSound('buttonTap');
    setDate(targetDate);
  };

  const handleQuickTime = (presetTime: string) => {
    playSound('buttonTap');
    setTime(presetTime);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Mission Objective Required', 'Please enter a task title for this mission.');
      return;
    }

    try {
      if (isEditing && existingTask) {
        await editTask({
          ...existingTask,
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          reminder_enabled: reminderEnabled,
        });
      } else {
        await addTask({
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          completed: false,
          reminder_enabled: reminderEnabled,
        });
      }

      triggerLightning({ intensity: 'medium' });
      triggerHaptic('success');
      router.back();
    } catch (err) {
      console.error('Failed to save task:', err);
      Alert.alert('Error', 'Could not save mission task. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <View style={styles.modalSheet}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelBtn}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={SpideyColors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'EDIT MISSION' : 'NEW MISSION TASK'}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MISSION TITLE *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Strength Training Session / Review Protocol"
              placeholderTextColor={SpideyColors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus={!isEditing}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TACTICAL BRIEFING (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add checklist details or operational notes..."
              placeholderTextColor={SpideyColors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Date & Quick Presets */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>SCHEDULED DATE (YYYY-MM-DD)</Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[styles.presetBtn, date === todayStr && styles.presetBtnActive]}
                  onPress={() => handleQuickDate(todayStr)}
                >
                  <Text style={[styles.presetBtnText, date === todayStr && styles.presetBtnTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="2026-11-02"
              placeholderTextColor={SpideyColors.textMuted}
            />
          </View>

          {/* Time & Quick Presets */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>TIME (HH:MM)</Text>
              <View style={styles.presetsRow}>
                {['09:00', '14:00', '18:00'].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetBtn, time === preset && styles.presetBtnActive]}
                    onPress={() => handleQuickTime(preset)}
                  >
                    <Text style={[styles.presetBtnText, time === preset && styles.presetBtnTextActive]}>
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={styles.textInput}
              value={time}
              onChangeText={setTime}
              placeholder="10:00"
              placeholderTextColor={SpideyColors.textMuted}
            />
          </View>

          {/* Reminder Toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setReminderEnabled(!reminderEnabled)}
            activeOpacity={0.8}
          >
            <View style={styles.toggleLeft}>
              <Ionicons
                name="notifications-outline"
                size={19}
                color={reminderEnabled ? SpideyColors.spideyRed : SpideyColors.textMuted}
              />
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleTitle}>Mission Alert Reminder</Text>
                <Text style={styles.toggleSub}>Receive a notification when it&apos;s time</Text>
              </View>
            </View>

            <View
              style={[
                styles.switchTrack,
                reminderEnabled && styles.switchTrackActive,
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  reminderEnabled && styles.switchThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Save Action Button with Web Pull */}
          <WebButtonInteraction
            style={styles.saveBtn}
            onPress={handleSave}
            variant="primary"
            sound="buttonTap"
            haptic="medium"
          >
            <Text style={styles.saveBtnText}>
              {isEditing ? 'UPDATE MISSION' : 'LOCK IN MISSION'}
            </Text>
          </WebButtonInteraction>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: SpideyColors.background,
  },
  modalSheet: {
    flex: 1,
    backgroundColor: SpideyColors.surface,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: SpideyColors.borderSubtle,
  },
  cancelBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  formScroll: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  presetBtn: {
    backgroundColor: SpideyColors.inputBackground,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radii.xs,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
  },
  presetBtnActive: {
    borderColor: SpideyColors.spideyRed,
    backgroundColor: SpideyColors.spideyRedSubtle,
  },
  presetBtnText: {
    color: SpideyColors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  presetBtnTextActive: {
    color: SpideyColors.spideyRed,
  },
  textInput: {
    backgroundColor: SpideyColors.inputBackground,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    color: SpideyColors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: 14,
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpideyColors.inputBackground,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleTextCol: {
    marginLeft: Spacing.md,
  },
  toggleTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSub: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: SpideyColors.borderMuted,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: SpideyColors.spideyRed,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  saveBtn: {
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: SpideyColors.spideyRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
