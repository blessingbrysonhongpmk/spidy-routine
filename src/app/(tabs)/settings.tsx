import { SpiderEmblem } from '@/components/SpiderEmblem';
import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { getAppSetting, setAppSetting } from '@/services/database';
import { SoundEffectType } from '@/services/sound';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    soundEnabled,
    masterVolume,
    hapticsEnabled,
    toggleSound,
    updateVolume,
    toggleHaptics,
    playSound,
    triggerHaptic,
  } = useSound();
  const { allTasks, routines, resetToSampleData, userStats } = useDatabase();

  const [activeTheme, setActiveTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [introEnabled, setIntroEnabled] = useState(true);
  const [introSoundEnabled, setIntroSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    async function loadIntroSettings() {
      const ie = await getAppSetting('intro_enabled', 'true');
      const is = await getAppSetting('intro_sound_enabled', 'true');
      const rm = await getAppSetting('reduced_motion', 'false');
      setIntroEnabled(ie === 'true');
      setIntroSoundEnabled(is === 'true');
      setReducedMotion(rm === 'true');
    }
    loadIntroSettings();
  }, []);

  const handleToggleIntroEnabled = async (val: boolean) => {
    playSound('buttonTap');
    setIntroEnabled(val);
    await setAppSetting('intro_enabled', val ? 'true' : 'false');
  };

  const handleToggleIntroSound = async (val: boolean) => {
    playSound('buttonTap');
    setIntroSoundEnabled(val);
    await setAppSetting('intro_sound_enabled', val ? 'true' : 'false');
  };

  const handleToggleReducedMotion = async (val: boolean) => {
    playSound('buttonTap');
    setReducedMotion(val);
    await setAppSetting('reduced_motion', val ? 'true' : 'false');
  };

  const handleReplayIntro = () => {
    playSound('buttonTap');
    triggerHaptic('medium');
    router.push('/intro');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Disconnect Clearance',
      'Sign out of current account? Local database will remain safely preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            playSound('buttonTap');
            await logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Mission Database',
      'Reset all tasks and routines back to default superhero sample data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            await resetToSampleData();
            Alert.alert('Restored', 'Database has been restored to default mission protocols.');
          },
        },
      ]
    );
  };

  const handlePreviewSound = (sfx: SoundEffectType) => {
    triggerHaptic('light');
    playSound(sfx);
  };

  const soundPreviews: { type: SoundEffectType; label: string; hero: string; color: string }[] = [
    { type: 'webShoot', label: 'Web-Shoot Snap', hero: 'Spider-Man', color: SpideyColors.spideyRed },
    { type: 'electricCrackle', label: 'Electric Crackle', hero: 'Thor', color: SpideyColors.thorBlue },
    { type: 'thunderMilestone', label: 'Thunder Victory', hero: 'Thor', color: SpideyColors.thorGold },
    { type: 'symbioteWhoosh', label: 'Symbiote Whoosh', hero: 'Venom', color: SpideyColors.venomPurple },
    { type: 'taskSuccess', label: 'Mission Success', hero: 'Tactical', color: SpideyColors.success },
    { type: 'buttonTap', label: 'Precision Click', hero: 'HUD Feedback', color: SpideyColors.textMuted },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebBackground />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>CONFIGURATION</Text>
        <Text style={styles.headerTitle}>Settings & Audio</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Profile Card with Comic Portrait */}
        <View style={styles.card}>
          <View style={styles.accountRow}>
            <View style={styles.avatarCircle}>
              <Image
                source={require('@/assets/images/hero-portrait.jpg')}
                style={styles.avatarImg}
                contentFit="cover"
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{user?.name || 'Blessing'}</Text>
              <Text style={styles.accountEmail}>
                {user?.email || 'operative@spideyflow.app'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.clearanceBadge}>
                  <Text style={styles.clearanceText}>
                    {user?.isGuest ? 'OFFLINE GUEST' : 'AUTHENTICATED'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
              accessibilityLabel="Sign out"
            >
              <Ionicons name="log-out-outline" size={19} color={SpideyColors.spideyRed} />
            </TouchableOpacity>
          </View>

          {/* Operative Clearance & Streak Telemetry */}
          <View style={styles.operativeStatsRow}>
            <View style={styles.operativeStatCol}>
              <Text style={styles.operativeStatLabel}>OPERATIVE RANK</Text>
              <Text style={styles.operativeRankTitle}>
                {userStats?.rankTitle || 'RECRUIT OPERATIVE'}
              </Text>
              <Text style={styles.operativeRankLevel}>
                Clearance Level {userStats?.rankLevel || 1}
              </Text>
            </View>

            <View style={styles.operativeStatDivider} />

            <View style={styles.operativeStatCol}>
              <Text style={styles.operativeStatLabel}>ACTIVE STREAK</Text>
              <Text style={styles.operativeStreakVal}>
                🔥 {userStats?.streakDays || 1} {userStats?.streakDays === 1 ? 'DAY' : 'DAYS'}
              </Text>
              <Text style={styles.operativeTotalMissions}>
                {userStats?.totalCompletedAll || 0} Objectives Cleared
              </Text>
            </View>
          </View>

          {/* Rank Progress Bar */}
          <View style={styles.rankProgressSection}>
            <View style={styles.rankProgressHeader}>
              <Text style={styles.rankProgressSub}>Next Tier: {userStats?.nextRankTitle || 'NEXT LEVEL'}</Text>
              <Text style={styles.rankProgressPct}>
                {Math.round((userStats?.rankProgress || 0) * 100)}%
              </Text>
            </View>
            <View style={styles.rankTrack}>
              <View
                style={[
                  styles.rankFill,
                  { width: `${Math.round((userStats?.rankProgress || 0) * 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Section: Cinematic Sound & Haptics (Section 18) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CINEMATIC SOUND & HAPTICS</Text>

          <View style={styles.card}>
            {/* UI Sound Effects Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="volume-high-outline" size={19} color={SpideyColors.spideyRed} />
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>UI Sound Effects</Text>
                  <Text style={styles.settingSub}>Superhero web, lightning & ambient audio cues</Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => {
                  playSound('buttonTap');
                  toggleSound(val);
                }}
                trackColor={{ false: SpideyColors.borderMuted, true: SpideyColors.spideyRed }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Master Volume Stepper */}
            <View style={[styles.settingRow, styles.borderTop]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="speedometer-outline" size={19} color={SpideyColors.thorBlue} />
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Master Volume</Text>
                  <Text style={styles.settingSub}>{Math.round(masterVolume * 100)}% output volume</Text>
                </View>
              </View>

              <View style={styles.volumeControls}>
                <TouchableOpacity
                  style={styles.volStepBtn}
                  onPress={() => updateVolume(Math.max(0.2, masterVolume - 0.2))}
                  accessibilityLabel="Decrease volume"
                >
                  <Ionicons name="remove" size={15} color={SpideyColors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.volStepBtn}
                  onPress={() => updateVolume(Math.min(1.0, masterVolume + 0.2))}
                  accessibilityLabel="Increase volume"
                >
                  <Ionicons name="add" size={15} color={SpideyColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Haptic Feedback Toggle */}
            <View style={[styles.settingRow, styles.borderTop]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="phone-portrait-outline" size={19} color={SpideyColors.thorGold} />
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Haptic Feedback</Text>
                  <Text style={styles.settingSub}>Tactile vibration pulses on check and tap</Text>
                </View>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => {
                  triggerHaptic('medium');
                  toggleHaptics(val);
                }}
                trackColor={{ false: SpideyColors.borderMuted, true: SpideyColors.thorGold }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Audio Previews Grid */}
            <View style={styles.soundPreviewBox}>
              <Text style={styles.previewHeading}>AUDIO ASSET PREVIEW</Text>
              <View style={styles.previewsGrid}>
                {soundPreviews.map((s) => (
                  <TouchableOpacity
                    key={s.type}
                    style={styles.previewBtn}
                    onPress={() => handlePreviewSound(s.type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.previewDot, { backgroundColor: s.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewLabel}>{s.label}</Text>
                      <Text style={[styles.previewHero, { color: s.color }]}>{s.hero}</Text>
                    </View>
                    <Ionicons name="play" size={13} color={SpideyColors.textPrimary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Section: Cinematic Intro Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CINEMATIC INTRO EXPERIENCE</Text>

          <View style={styles.card}>
            {/* Cinematic Startup Intro Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="film-outline" size={19} color={SpideyColors.spideyRed} />
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Cinematic Startup Intro</Text>
                  <Text style={styles.settingSub}>Personalized superhero animation on app launch</Text>
                </View>
              </View>
              <Switch
                value={introEnabled}
                onValueChange={handleToggleIntroEnabled}
                trackColor={{ false: SpideyColors.borderMuted, true: SpideyColors.spideyRed }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Intro Audio Effects Toggle */}
            <View style={[styles.settingRow, styles.borderTop]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="volume-medium-outline" size={19} color={SpideyColors.thorBlue} />
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Intro Audio Effects</Text>
                  <Text style={styles.settingSub}>Whoosh, web snap, and thunder crackle</Text>
                </View>
              </View>
              <Switch
                value={introSoundEnabled}
                onValueChange={handleToggleIntroSound}
                trackColor={{ false: SpideyColors.borderMuted, true: SpideyColors.thorBlue }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Reduced Motion Toggle */}
            <View style={[styles.settingRow, styles.borderTop]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="speedometer-outline" size={19} color={SpideyColors.thorGold} />
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Fast Mode / Reduced Motion</Text>
                  <Text style={styles.settingSub}>Shorten startup sequence for instant access</Text>
                </View>
              </View>
              <Switch
                value={reducedMotion}
                onValueChange={handleToggleReducedMotion}
                trackColor={{ false: SpideyColors.borderMuted, true: SpideyColors.thorGold }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Replay Intro CTA with Web Pull */}
            <WebButtonInteraction
              style={styles.replayBtn}
              onPress={handleReplayIntro}
              variant="subtle"
              sound="buttonTap"
              haptic="medium"
            >
              <Ionicons name="play-circle" size={18} color={SpideyColors.spideyRed} />
              <Text style={styles.replayBtnText}>Replay Cinematic Intro</Text>
            </WebButtonInteraction>
          </View>
        </View>

        {/* Section: Appearance & Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VISUAL THEME</Text>

          <View style={styles.card}>
            <View style={styles.themeSelectorRow}>
              {(['dark', 'light', 'system'] as const).map((t) => {
                const isSelected = activeTheme === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeOptionBtn,
                      isSelected && styles.themeOptionActive,
                    ]}
                    onPress={() => {
                      playSound('buttonTap');
                      setActiveTheme(t);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={
                        t === 'dark'
                          ? 'moon-outline'
                          : t === 'light'
                            ? 'sunny-outline'
                            : 'phone-portrait-outline'
                      }
                      size={16}
                      color={isSelected ? SpideyColors.spideyRed : SpideyColors.textMuted}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        isSelected && styles.themeOptionTextActive,
                      ]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section: Database & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOCAL SQLITE STORAGE</Text>

          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Missions in SQLite:</Text>
              <Text style={styles.statValue}>{allTasks.length} tasks</Text>
            </View>

            <View style={[styles.statRow, styles.borderTop]}>
              <Text style={styles.statLabel}>Configured Routine Protocols:</Text>
              <Text style={styles.statValue}>{routines.length} protocols</Text>
            </View>

            <WebButtonInteraction
              style={styles.resetBtn}
              onPress={handleResetData}
              variant="subtle"
              sound="deleteAction"
              haptic="medium"
            >
              <Ionicons name="refresh-outline" size={15} color={SpideyColors.spideyRed} />
              <Text style={styles.resetBtnText}>Reset to Default Superhero Data</Text>
            </WebButtonInteraction>
          </View>
        </View>

        {/* About App */}
        <View style={styles.aboutBox}>
          <SpiderEmblem size={34} color={SpideyColors.textMuted} opacity={0.6} />
          <Text style={styles.aboutTitle}>SPIDEY FLOW</Text>
          <Text style={styles.aboutTagline}>YOUR DAY. YOUR MISSION.</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0 • Production Build</Text>
          <Text style={styles.aboutCredits}>
            Crafted with precision. Spider-Man action, Thor power, and Venom atmosphere.
          </Text>
        </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: SpideyColors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: SpideyColors.spideyRed,
    marginRight: Spacing.md,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: SpideyColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: SpideyColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  accountEmail: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  clearanceBadge: {
    backgroundColor: SpideyColors.thorBlueSubtle,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radii.xs,
  },
  clearanceText: {
    color: SpideyColors.thorBlue,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: SpideyColors.borderSubtle,
    marginTop: Spacing.xs,
    paddingTop: Spacing.md,
  },
  settingIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextCol: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  volumeControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  volStepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radii.xs,
    backgroundColor: SpideyColors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
  },
  soundPreviewBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: SpideyColors.borderSubtle,
  },
  previewHeading: {
    color: SpideyColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  previewsGrid: {
    gap: 6,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpideyColors.inputBackground,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.md,
  },
  previewLabel: {
    color: SpideyColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  previewHero: {
    fontSize: 10,
    fontWeight: '500',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SpideyColors.inputBackground,
    paddingVertical: 10,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    gap: 6,
  },
  themeOptionActive: {
    borderColor: SpideyColors.spideyRed,
    backgroundColor: SpideyColors.spideyRedSubtle,
  },
  themeOptionText: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: SpideyColors.textPrimary,
    fontWeight: '700',
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SpideyColors.surfaceHover,
    borderRadius: Radii.sm,
    paddingVertical: 11,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: SpideyColors.spideyRedBorder,
    gap: 8,
  },
  replayBtnText: {
    color: SpideyColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statLabel: {
    color: SpideyColors.textMuted,
    fontSize: 13,
  },
  statValue: {
    color: SpideyColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SpideyColors.spideyRedSubtle,
    borderRadius: Radii.sm,
    paddingVertical: 10,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: SpideyColors.spideyRedBorder,
    gap: 6,
  },
  resetBtnText: {
    color: SpideyColors.spideyRed,
    fontSize: 13,
    fontWeight: '700',
  },
  aboutBox: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  aboutTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  aboutTagline: {
    color: SpideyColors.spideyRed,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  aboutVersion: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  aboutCredits: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: 4,
  },
  operativeStatsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  operativeStatCol: {
    flex: 1,
  },
  operativeStatLabel: {
    color: SpideyColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  operativeRankTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  operativeRankLevel: {
    color: SpideyColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  operativeStatDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: Spacing.md,
  },
  operativeStreakVal: {
    color: SpideyColors.spideyRed,
    fontSize: 13,
    fontWeight: '800',
  },
  operativeTotalMissions: {
    color: SpideyColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  rankProgressSection: {
    marginTop: Spacing.md,
  },
  rankProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankProgressSub: {
    color: SpideyColors.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
  },
  rankProgressPct: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  rankTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  rankFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
});
