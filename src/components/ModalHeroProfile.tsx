import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/services/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLightning } from './LightningEffect';
import { WebButtonInteraction } from './WebButtonInteraction';

interface ModalHeroProfileProps {
  visible: boolean;
  onClose: () => void;
}

export const ModalHeroProfile: React.FC<ModalHeroProfileProps> = ({ visible, onClose }) => {
  const colors = useTheme();
  const { user, updateProfile } = useAuth();
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();

  const [name, setName] = useState(user?.name || '');
  const [callsign, setCallsign] = useState(user?.callsign || '');
  const [email, setEmail] = useState(user?.email || '');
  const [heroArchetype, setHeroArchetype] = useState<'spiderman' | 'thor' | 'venom'>(
    (user?.heroArchetype as any) || 'spiderman'
  );
  const [dailyTarget, setDailyTarget] = useState<string>(
    user?.dailyTarget ? String(user.dailyTarget) : '5'
  );
  const [motto, setMotto] = useState(user?.motto || 'Your Day. Your Mission.');

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Agent Name Required', 'Please enter your name or secret identity.');
      return;
    }

    try {
      const parsedTarget = parseInt(dailyTarget, 10);
      await updateProfile({
        name: name.trim(),
        callsign: callsign.trim() || 'Boss',
        email: email.trim(),
        heroArchetype,
        dailyTarget: isNaN(parsedTarget) || parsedTarget <= 0 ? 5 : parsedTarget,
        motto: motto.trim(),
      });

      triggerLightning({ intensity: 'epic' });
      playSound('thunderMilestone');
      triggerHaptic('success');
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      showAlert('Error', 'Could not save profile details.');
    }
  };

  const archetypes: { id: 'spiderman' | 'thor' | 'venom'; label: string; icon: string; color: string }[] = [
    { id: 'spiderman', label: 'Spider-Man', icon: 'radio-outline', color: colors.primary },
    { id: 'thor', label: 'Thor', icon: 'flash-outline', color: colors.secondary },
    { id: 'venom', label: 'Venom', icon: 'water-outline', color: colors.purple },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
          {/* Top Bar */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View>
              <Text style={[styles.headerSubtitle, { color: colors.primary }]}>HERO CLEARANCE</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Operative Dossier</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.inputBackground }]}
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Agent Real Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>AGENT IDENTITY / NAME *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Peter Parker / Blessing / Bruce"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Codename / Call-Sign */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>TACTICAL CODENAME / CALL-SIGN</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Boss, Spidey, God of Thunder, Venom"
                placeholderTextColor={colors.textMuted}
                value={callsign}
                onChangeText={setCallsign}
              />
            </View>

            {/* Primary Archetype */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>HERO ARCHETYPE</Text>
              <View style={styles.archetypeRow}>
                {archetypes.map((a) => {
                  const isSelected = heroArchetype === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[
                        styles.archetypeBtn,
                        {
                          backgroundColor: isSelected ? colors.surfaceElevated : colors.inputBackground,
                          borderColor: isSelected ? a.color : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        playSound('buttonTap');
                        setHeroArchetype(a.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={a.icon as any}
                        size={16}
                        color={isSelected ? a.color : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.archetypeText,
                          {
                            color: isSelected ? a.color : colors.textMuted,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Daily Target */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>DAILY MISSION TARGET</Text>
              <View style={styles.targetPresetsRow}>
                {['3', '5', '7', '10'].map((target) => {
                  const isSelected = dailyTarget === target;
                  return (
                    <TouchableOpacity
                      key={target}
                      style={[
                        styles.targetPresetBtn,
                        {
                          backgroundColor: isSelected ? colors.primarySubtle : colors.inputBackground,
                          borderColor: isSelected ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        playSound('buttonTap');
                        setDailyTarget(target);
                      }}
                    >
                      <Text
                        style={[
                          styles.targetPresetText,
                          { color: isSelected ? colors.primary : colors.textMuted },
                        ]}
                      >
                        {target} Missions
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tactical Motto */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>TACTICAL MOTTO</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Your Day. Your Mission."
                placeholderTextColor={colors.textMuted}
                value={motto}
                onChangeText={setMotto}
              />
            </View>

            {/* Email (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>COMMUNICATION EMAIL (OPTIONAL)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                placeholder="operative@spideyflow.app"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Authorize Action */}
            <WebButtonInteraction
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              variant="primary"
              sound="thunderMilestone"
              haptic="success"
            >
              <Text style={styles.saveBtnText}>AUTHORIZE HERO DOSSIER</Text>
            </WebButtonInteraction>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingTop: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 10.5,
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
  archetypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  archetypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  archetypeText: {
    fontSize: 11.5,
  },
  targetPresetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  targetPresetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  targetPresetText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '900',
    letterSpacing: 1,
  },
});

