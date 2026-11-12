import { AppScreenShell } from '@/components/AppScreenShell';
import { SpidyButton } from '@/components/SpidyButton';
import { SpidyInput } from '@/components/SpidyInput';
import { SpidyAvatar } from '@/components/SpidyLogo';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { useThemeContext } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/services/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { user, updateProfile } = useAuth();
  const { themeMode, setThemeMode } = useThemeContext();
  const { soundEnabled, toggleSound, hapticsEnabled, toggleHaptics, playSound, triggerHaptic } =
    useSound();

  const [name, setName] = useState(user?.name || '');
  const [callsign, setCallsign] = useState(user?.callsign || '');
  const [bio, setBio] = useState(user?.bio || user?.motto || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [wakeTime, setWakeTime] = useState(user?.wakeTime || '06:00 AM');
  const [dailyTarget, setDailyTarget] = useState<string>(
    user?.dailyTarget ? String(user.dailyTarget) : '5'
  );
  const [heroArchetype, setHeroArchetype] = useState<'spiderman' | 'thor' | 'venom' | 'custom'>(
    user?.heroArchetype || 'spiderman'
  );
  const [avatarType, setAvatarType] = useState<'spiderman' | 'thor' | 'venom' | 'custom'>(
    user?.avatarType || 'spiderman'
  );

  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Agent Name Required', 'Please provide a name or secret identity.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedTarget = parseInt(dailyTarget, 10);
      await updateProfile({
        name: name.trim(),
        callsign: callsign.trim() || 'Boss',
        bio: bio.trim(),
        email: email.trim(),
        dob: dob.trim(),
        wakeTime: wakeTime.trim(),
        dailyTarget: isNaN(parsedTarget) || parsedTarget <= 0 ? 5 : parsedTarget,
        heroArchetype,
        avatarType,
        themePreference: themeMode,
        soundEnabled,
        notificationsEnabled: notifications,
      });

      playSound('successConfirm');
      triggerHaptic('success');
      showAlert('Dossier Authorized', 'Your hero profile has been updated and securely persisted.');
      router.back();
    } catch (err) {
      console.error('Failed to update profile:', err);
      showAlert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.back();
  };

  const archetypes: { id: 'spiderman' | 'thor' | 'venom'; label: string; icon: any; color: string }[] =
    [
      { id: 'spiderman', label: 'Spider-Man', icon: 'radio-outline', color: colors.primary },
      { id: 'thor', label: 'Thor', icon: 'flash-outline', color: colors.secondary },
      { id: 'venom', label: 'Venom', icon: 'water-outline', color: colors.purple },
    ];

  return (
    <AppScreenShell topBreathingSpace={8} applyBottomInset={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>HERO CLEARANCE</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Operative Profile</Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveHeaderBtn, { backgroundColor: colors.primarySubtle }]}
            disabled={isSaving}
          >
            <Text style={[styles.saveHeaderText, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar and Portrait Selector */}
          <View style={[styles.avatarCard, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <TouchableOpacity
              style={[
                styles.avatarCircle,
                {
                  borderColor:
                    avatarType === 'thor'
                      ? '#38BDF8'
                      : avatarType === 'venom'
                        ? '#A855F7'
                        : colors.primary,
                },
              ]}
              onPress={() => {
                playSound('buttonTap');
                triggerHaptic('light');
                const nextType =
                  avatarType === 'spiderman'
                    ? 'thor'
                    : avatarType === 'thor'
                      ? 'venom'
                      : 'spiderman';
                setAvatarType(nextType);
                setHeroArchetype(nextType);
              }}
              activeOpacity={0.8}
              accessibilityLabel="Change avatar archetype"
            >
              <SpidyAvatar
                size={76}
                name={name || 'Agent'}
                archetype={heroArchetype}
              />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="sparkles" size={11} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.avatarDetails}>
              <Text style={[styles.avatarName, { color: colors.text }]}>
                {name || 'Unregistered Operative'}
              </Text>
              <Text style={[styles.avatarCallsign, { color: colors.primary }]}>
                {callsign ? `[CODENAME: ${callsign.toUpperCase()}]` : '[NO CALLSIGN SET]'}
              </Text>
              <Text style={[styles.avatarRank, { color: colors.textSecondary }]}>
                Primary Archetype: {heroArchetype.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Section: Identity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OPERATIVE IDENTITY</Text>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted, padding: 14, gap: 14 }]}>
              {/* Full Name */}
              <SpidyInput
                label="FULL NAME *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Peter Parker / Blessing"
                leftIcon="person-outline"
                showClearButton
              />

              {/* Codename / Call-Sign */}
              <SpidyInput
                label="CODENAME / CALL-SIGN"
                value={callsign}
                onChangeText={setCallsign}
                placeholder="e.g. Boss, Spidey, Thunder God"
                leftIcon="shield-outline"
                showClearButton
              />

              {/* Tactical Bio / Motto */}
              <SpidyInput
                label="TACTICAL MOTTO / BIO"
                value={bio}
                onChangeText={setBio}
                placeholder="e.g. Your Day. Your Mission. Focused on daily conquests."
                leftIcon="document-text-outline"
                multiline
                numberOfLines={2}
              />

              {/* Email */}
              <SpidyInput
                label="COMMUNICATION EMAIL"
                value={email}
                onChangeText={setEmail}
                placeholder="operative@spideyflow.app"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                showClearButton
              />

              {/* Date of Birth (Optional) */}
              <SpidyInput
                label="DATE OF BIRTH (OPTIONAL)"
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                leftIcon="calendar-outline"
                showClearButton
              />
            </View>
          </View>

          {/* Section: Hero System & Archetype */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HERO POWER SYSTEM</Text>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
              <View style={styles.archetypesRow}>
                {archetypes.map((a) => {
                  const isSelected = heroArchetype === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[
                        styles.archetypeCard,
                        {
                          backgroundColor: isSelected ? colors.surfaceElevated : colors.inputBackground,
                          borderColor: isSelected ? a.color : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        playSound('buttonTap');
                        triggerHaptic('medium');
                        setHeroArchetype(a.id);
                        setAvatarType(a.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={a.icon} size={20} color={isSelected ? a.color : colors.textMuted} />
                      <Text
                        style={[
                          styles.archetypeTitle,
                          { color: isSelected ? a.color : colors.textMuted },
                          isSelected && { fontWeight: '800' },
                        ]}
                      >
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section: Operational Goals & Schedule */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MISSION PARAMETERS</Text>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
              {/* Daily Target */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>DAILY MISSION TARGET</Text>
                <View style={styles.targetsRow}>
                  {['3', '5', '7', '10'].map((target) => {
                    const isSelected = dailyTarget === target;
                    return (
                      <TouchableOpacity
                        key={target}
                        style={[
                          styles.targetBtn,
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
                            styles.targetBtnText,
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

              {/* Wake-Up Time */}
              <View style={[styles.fieldGroup, styles.borderTop, { borderTopColor: colors.borderSubtle, paddingTop: 12 }]}>
                <SpidyInput
                  label="PREFERRED WAKE-UP TIME"
                  value={wakeTime}
                  onChangeText={setWakeTime}
                  placeholder="06:00 AM"
                  leftIcon="time-outline"
                />
              </View>
            </View>
          </View>

          {/* Section: System Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INTERFACE & SENSORY</Text>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
              {/* Theme Preference */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>THEME PREFERENCE</Text>
                <View style={styles.themeSelectorRow}>
                  {[
                    { id: 'spiderman' as const, label: 'Spidey', icon: 'radio-outline' as const, color: '#EF4444' },
                    { id: 'thor' as const, label: 'Thor', icon: 'flash-outline' as const, color: '#0EA5E9' },
                    { id: 'venom' as const, label: 'Venom', icon: 'water-outline' as const, color: '#A855F7' },
                    { id: 'light' as const, label: 'Light', icon: 'sunny-outline' as const, color: '#F59E0B' },
                    { id: 'system' as const, label: 'Auto', icon: 'phone-portrait-outline' as const, color: colors.textSecondary },
                  ].map((item) => {
                    const isSelected =
                      themeMode === item.id || (item.id === 'spiderman' && themeMode === 'dark');
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.themeBtn,
                          {
                            backgroundColor: isSelected ? `${item.color}22` : colors.inputBackground,
                            borderColor: isSelected ? item.color : colors.borderSubtle,
                          },
                        ]}
                        onPress={() => {
                          if (item.id === 'spiderman') {
                            playSound('webShoot');
                          } else if (item.id === 'thor') {
                            playSound('thunderMilestone');
                          } else if (item.id === 'venom') {
                            playSound('symbioteWhoosh');
                          } else {
                            playSound('buttonTap');
                          }
                          triggerHaptic('light');
                          setThemeMode(item.id);
                        }}
                      >
                        <Ionicons
                          name={item.icon}
                          size={13}
                          color={isSelected ? item.color : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.themeBtnText,
                            {
                              color: isSelected ? item.color : colors.textMuted,
                              fontWeight: isSelected ? '800' : '500',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Sound Engine Toggle */}
              <View style={[styles.toggleRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>Audio Sound Engine</Text>
                  <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Superhero tactile procedural audio</Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{ false: colors.borderMuted, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Haptics Engine Toggle */}
              <View style={[styles.toggleRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>Vibration & Haptics</Text>
                  <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Tensile feedback on task completions</Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={toggleHaptics}
                  trackColor={{ false: colors.borderMuted, true: colors.secondary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Notifications Toggle */}
              <View style={[styles.toggleRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>Mission Reminders</Text>
                  <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Scheduled alerts and wake protocols</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.borderMuted, true: colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Submit Action Button */}
          <View style={{ marginTop: 24, marginBottom: 40 }}>
            <SpidyButton
              title={isSaving ? 'AUTHORIZING...' : 'LOCK IN HERO PROFILE'}
              onPress={handleSave}
              variant="primary"
              size="lg"
              icon="shield-checkmark"
              sound="thunderMilestone"
              haptic="success"
              loading={isSaving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 4,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  saveHeaderBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  saveHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 2,
    marginRight: Spacing.md,
    position: 'relative',
  },
  avatarEmblemBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarDetails: {
    flex: 1,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '800',
  },
  avatarCallsign: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  avatarRank: {
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  card: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  fieldGroup: {
    paddingVertical: Spacing.xs,
  },
  borderTop: {
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    borderRadius: Radii.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  archetypesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  archetypeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: 6,
  },
  archetypeTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  targetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  targetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  targetBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: 4,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  saveBtn: {
    height: 48,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
