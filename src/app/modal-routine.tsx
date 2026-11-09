import { useLightning } from '@/components/LightningEffect';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing } from '@/constants/theme';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
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
  const colors = useTheme();
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

  const categories: { key: RoutineCategory; label: string; color: string; bg: string }[] = [
    { key: 'morning', label: 'Morning', color: colors.primary, bg: colors.primarySubtle },
    { key: 'afternoon', label: 'Afternoon', color: colors.secondary, bg: colors.secondarySubtle },
    { key: 'evening', label: 'Evening', color: colors.purple, bg: colors.purpleSubtle },
    { key: 'night', label: 'Night', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
    >
      <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
        {/* Header Bar */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelBtn}
            accessibilityLabel="Close"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>NEW ROUTINE PROTOCOL</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          {/* Routine Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>PROTOCOL NAME *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.borderSubtle,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Suit Up, Core Training, Mind Reset"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>TIME OF DAY</Text>
            <View style={styles.categoryRow}>
              {categories.map((c) => {
                const isSelected = category === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.categoryBtn,
                      {
                        backgroundColor: isSelected ? c.bg : colors.inputBackground,
                        borderColor: isSelected ? c.color : colors.borderSubtle,
                      },
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
                        {
                          color: isSelected ? c.color : colors.textMuted,
                          fontWeight: isSelected ? '700' : '600',
                        },
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
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>REPEAT DAYS</Text>
            <View style={styles.daysRow}>
              {days.map((day) => {
                const active = repeatDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor: active ? colors.primary : colors.inputBackground,
                        borderColor: active ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: active ? '#FFFFFF' : colors.textMuted,
                          fontWeight: active ? '700' : '600',
                        },
                      ]}
                    >
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
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>ACTIVITIES</Text>
              <TouchableOpacity onPress={handleAddItem} style={styles.addActivityBtn}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addActivityText, { color: colors.primary }]}>Add Step</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => (
              <View key={idx} style={styles.activityItemRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      flex: 1,
                      marginRight: 8,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  placeholder={`Activity #${idx + 1}`}
                  placeholderTextColor={colors.textMuted}
                  value={item.title}
                  onChangeText={(val) => handleItemChange(idx, 'title', val)}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      width: 95,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  placeholder="06:00 AM"
                  placeholderTextColor={colors.textMuted}
                  value={item.scheduled_time}
                  onChangeText={(val) => handleItemChange(idx, 'scheduled_time', val)}
                />
                {items.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(idx)}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>

          {/* Submit Action Button with Web Pull */}
          <WebButtonInteraction
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
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
  },
  modalSheet: {
    flex: 1,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  cancelBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderRadius: Radii.sm,
    borderWidth: 1,
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
    alignItems: 'center',
  },
  categoryBtnText: {
    fontSize: 12,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: Radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
