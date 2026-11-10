import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { ThemeMode, useThemeContext } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
      Alert.alert('Agent Name Required', 'Please provide a name or secret identity.');
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
      Alert.alert('Dossier Authorized', 'Your hero profile has been updated and securely persisted.');
      router.back();
    } catch (err) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <WebBackground />

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
              accessibilityLabel="Change avatar"
            >
              {avatarType === 'thor' ? (
                <View style={[styles.avatarEmblemBox, { backgroundColor: '#0C1B2A' }]}>
                  <Ionicons name="flash" size={32} color="#38BDF8" />
                </View>
              ) : avatarType === 'venom' ? (
                <View style={[styles.avatarEmblemBox, { backgroundColor: '#1A0B2E' }]}>
                  <Ionicons name="water" size={32} color="#A855F7" />
                </View>
              ) : (
                <Image
                  source={require('@/assets/images/hero-portrait.jpg')}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera-reverse" size={11} color="#FFFFFF" />
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

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>FULL NAME *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Peter Parker / Blessing"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Codename / Call-Sign */}
              <View style={[styles.fieldGroup, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CODENAME / CALL-SIGN</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  value={callsign}
                  onChangeText={setCallsign}
                  placeholder="e.g. Boss, Spidey, Thunder God, Shadow"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Tactical Bio / Motto */}
              <View style={[styles.fieldGroup, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>TACTICAL MOTTO / BIO</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textArea,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="e.g. Your Day. Your Mission. Focused on discipline and daily conquests."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Email */}
              <View style={[styles.fieldGroup, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>COMMUNICATION EMAIL</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="operative@spideyflow.app"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Date of Birth (Optional) */}
              <View style={[styles.fieldGroup, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>DATE OF BIRTH (OPTIONAL)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
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
              <View style={[styles.fieldGroup, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PREFERRED WAKE-UP TIME</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  value={wakeTime}
                  onChangeText={setWakeTime}
                  placeholder="06:00 AM"
                  placeholderTextColor={colors.textMuted}
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
                  {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => {
                    const isSelected = themeMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.themeBtn,
                          {
                            backgroundColor: isSelected ? colors.primarySubtle : colors.inputBackground,
                            borderColor: isSelected ? colors.primary : colors.borderSubtle,
                          },
                        ]}
                        onPress={() => {
                          playSound('buttonTap');
                          setThemeMode(mode);
                        }}
                      >
                        <Text
                          style={[
                            styles.themeBtnText,
                            { color: isSelected ? colors.primary : colors.textMuted },
                          ]}
                        >
                          {mode.toUpperCase()}
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
          <WebButtonInteraction
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            variant="primary"
            sound="thunderMilestone"
            haptic="success"
          >
            <Text style={styles.saveBtnText}>
              {isSaving ? 'AUTHORIZING...' : 'LOCK IN HERO PROFILE'}
            </Text>
          </WebButtonInteraction>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? 14 : Spacing.md,
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
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
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
