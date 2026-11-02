import { useLightning } from '@/components/LightningEffect';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { DayOfWeek, RoutineCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function ModalRoutineScreen() {
  const router = useRouter();
  const { addRoutine } = useDatabase();
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<RoutineCategory>('morning');
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ]);
  const [items, setItems] = useState<{ title: string; scheduled_time: string }[]>([
    { title: '', scheduled_time: '06:00 AM' },
  ]);

  const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: DayOfWeek) => {
    playSound('buttonTap');
    triggerHaptic('light');
    if (repeatDays.includes(day)) {
      if (repeatDays.length === 1) return; // Keep at least 1 day
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const handleAddItem = () => {
    playSound('buttonTap');
    setItems([...items, { title: '', scheduled_time: '07:00 AM' }]);
  };

  const handleRemoveItem = (index: number) => {
    playSound('deleteAction');
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'title' | 'scheduled_time', value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Protocol Name Required', 'Please enter a name for this routine protocol.');
      return;
    }

    const validItems = items.filter((i) => i.title.trim().length > 0);
    if (validItems.length === 0) {
      Alert.alert('Activities Required', 'Please add at least one activity to this routine.');
      return;
    }

    try {
      await addRoutine(name.trim(), category, repeatDays, validItems);
      triggerLightning({ intensity: 'medium' });
      triggerHaptic('success');
      router.back();
    } catch (err) {
      console.error('Failed to create routine:', err);
      Alert.alert('Error', 'Could not create routine protocol.');
    }
  };

  const categories: { key: RoutineCategory; label: string; color: string }[] = [
    { key: 'morning', label: 'Morning', color: SpideyColors.spideyRed },
    { key: 'afternoon', label: 'Afternoon', color: SpideyColors.thorBlue },
    { key: 'evening', label: 'Evening', color: SpideyColors.venomPurple },
    { key: 'night', label: 'Night', color: '#A78BFA' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <View style={styles.modalSheet}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Ionicons name="close" size={22} color={SpideyColors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NEW ROUTINE PROTOCOL</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          {/* Routine Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PROTOCOL NAME *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Suit Up, Core Training, Mind Reset"
              placeholderTextColor={SpideyColors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TIME OF DAY</Text>
            <View style={styles.categoryRow}>
              {categories.map((c) => {
                const isSelected = category === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.categoryBtn,
                      isSelected && { borderColor: c.color, backgroundColor: SpideyColors.surfaceElevated },
                    ]}
                    onPress={() => {
                      playSound('buttonTap');
                      setCategory(c.key);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryBtnText,
                        isSelected && { color: c.color, fontWeight: '700' },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Repeat Days */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REPEAT DAYS</Text>
            <View style={styles.daysRow}>
              {days.map((day) => {
                const active = repeatDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCircle, active && styles.dayCircleActive]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Activities List */}
          <View style={styles.inputGroup}>
            <View style={styles.activitiesHeader}>
              <Text style={styles.inputLabel}>ACTIVITIES</Text>
              <TouchableOpacity onPress={handleAddItem} style={styles.addActivityBtn}>
                <Ionicons name="add" size={16} color={SpideyColors.spideyRed} />
                <Text style={styles.addActivityText}>Add Step</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => (
              <View key={idx} style={styles.activityItemRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                  placeholder={`Activity #${idx + 1}`}
                  placeholderTextColor={SpideyColors.textMuted}
                  value={item.title}
                  onChangeText={(val) => handleItemChange(idx, 'title', val)}
                />
                <TextInput
                  style={[styles.textInput, { width: 95 }]}
                  placeholder="06:00 AM"
                  placeholderTextColor={SpideyColors.textMuted}
                  value={item.scheduled_time}
                  onChangeText={(val) => handleItemChange(idx, 'scheduled_time', val)}
                />
                {items.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(idx)}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash-outline" size={17} color={SpideyColors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>

          {/* Submit Action Button with Web Pull */}
          <WebButtonInteraction
            style={styles.saveBtn}
            onPress={handleSave}
            variant="primary"
            sound="buttonTap"
            haptic="medium"
          >
            <Text style={styles.saveBtnText}>INITIALIZE PROTOCOL</Text>
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
  inputLabel: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
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
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    alignItems: 'center',
    backgroundColor: SpideyColors.inputBackground,
  },
  categoryBtnText: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: Radii.sm,
    backgroundColor: SpideyColors.inputBackground,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: SpideyColors.spideyRed,
    borderColor: SpideyColors.spideyRed,
  },
  dayText: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  addActivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addActivityText: {
    color: SpideyColors.spideyRed,
    fontSize: 12,
    fontWeight: '600',
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  trashBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: SpideyColors.thorBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
