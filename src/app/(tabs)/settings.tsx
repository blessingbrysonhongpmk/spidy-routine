import { ModalHeroProfile } from '@/components/ModalHeroProfile';
import { SpiderEmblem } from '@/components/SpiderEmblem';
import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { useSound } from '@/context/SoundContext';
import { ThemeMode, useThemeContext } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { getAppSetting, setAppSetting } from '@/services/database';
import { SoundEffectType } from '@/services/sound';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
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
  const colors = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const { user, logout, resetProfile } = useAuth();
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
  const { allTasks, routines, clearAllData, loadStarterProtocols, userStats } = useDatabase();

  const [introEnabled, setIntroEnabled] = useState(true);
  const [introSoundEnabled, setIntroSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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

  const handleThemeSelect = async (mode: ThemeMode) => {
    playSound('buttonTap');
    triggerHaptic('light');
    await setThemeMode(mode);
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

  const handleClearAllData = () => {
    Alert.alert(
      'Reset to Clean Slate',
      'Purge all tasks and routines? Your database will be completely fresh and your profile reset to blank.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge & Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await resetProfile();
            Alert.alert('Clean Slate Initialized', 'All missions cleared and profile reset to blank.');
          },
        },
      ]
    );
  };

  const handleLoadStarterPack = () => {
    Alert.alert(
      'Load Hero Starter Pack',
      'Populate your schedule with recommended superhero daily protocols (Morning Patrol, Focus Operations, Evening Recon)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Protocols',
          onPress: async () => {
            await loadStarterProtocols();
            Alert.alert('Loaded', 'Hero Starter Pack added to your routines.');
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
    { type: 'webShoot', label: 'Web-Shoot Snap', hero: 'Spider-Man', color: colors.primary },
    { type: 'electricCrackle', label: 'Electric Crackle', hero: 'Thor', color: colors.secondary },
    { type: 'thunderMilestone', label: 'Thunder Victory', hero: 'Thor', color: colors.accent },
    { type: 'symbioteWhoosh', label: 'Symbiote Whoosh', hero: 'Venom', color: colors.purple },
    { type: 'taskSuccess', label: 'Mission Success', hero: 'Tactical', color: colors.success },
    { type: 'buttonTap', label: 'Precision Click', hero: 'HUD Feedback', color: colors.textMuted },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <WebBackground />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.headerSubtitle, { color: colors.primary }]}>CONFIGURATION</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Audio</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Profile Card with Comic Portrait */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
          <View style={styles.accountRow}>
            <View style={[styles.avatarCircle, { borderColor: colors.primary }]}>
              <Image
                source={require('@/assets/images/hero-portrait.jpg')}
                style={styles.avatarImg}
                contentFit="cover"
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.text }]}>
                {user?.name ? user.name : 'UNREGISTERED OPERATIVE'}
              </Text>
              <Text style={[styles.accountEmail, { color: colors.textMuted }]}>
                {user?.callsign
                  ? `Codename: ${user.callsign} • Target: ${user.dailyTarget || 5}/day`
                  : 'Tap below to configure Hero Dossier'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.clearanceBadge, { backgroundColor: colors.secondarySubtle }]}>
                  <Text style={[styles.clearanceText, { color: colors.secondary }]}>
                    {user?.isGuest ? 'OFFLINE GUEST' : 'AUTHENTICATED'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.editBadge, { backgroundColor: colors.primarySubtle, borderColor: colors.primaryBorder }]}
                  onPress={() => {
                    playSound('buttonTap');
                    triggerHaptic('light');
                    router.push('/profile');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={12} color={colors.primary} />
                  <Text style={[styles.editBadgeText, { color: colors.primary }]}>
                    {user?.name ? 'EDIT PROFILE' : 'SET UP'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
              accessibilityLabel="Sign out"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Operative Clearance & Streak Telemetry */}
          <View style={[styles.operativeStatsRow, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.operativeStatCol}>
              <Text style={[styles.operativeStatLabel, { color: colors.textMuted }]}>OPERATIVE RANK</Text>
              <Text style={[styles.operativeRankTitle, { color: colors.text }]}>
                {userStats?.rankTitle || 'RECRUIT OPERATIVE'}
              </Text>
              <Text style={[styles.operativeRankLevel, { color: colors.textSecondary }]}>
                Clearance Level {userStats?.rankLevel || 1}
              </Text>
            </View>

            <View style={[styles.operativeStatDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.operativeStatCol}>
              <Text style={[styles.operativeStatLabel, { color: colors.textMuted }]}>ACTIVE STREAK</Text>
              <Text style={[styles.operativeStreakVal, { color: colors.primary }]}>
                🔥 {userStats?.streakDays || 1} {userStats?.streakDays === 1 ? 'DAY' : 'DAYS'}
              </Text>
              <Text style={[styles.operativeTotalMissions, { color: colors.textSecondary }]}>
                {userStats?.totalCompletedAll || 0} Objectives Cleared
              </Text>
            </View>
          </View>

          {/* Rank Progress Bar */}
          <View style={styles.rankProgressSection}>
            <View style={styles.rankProgressHeader}>
              <Text style={[styles.rankProgressSub, { color: colors.textSecondary }]}>
                Next Tier: {userStats?.nextRankTitle || 'STREET VIGILANTE'}
              </Text>
              <Text style={[styles.rankProgressPct, { color: colors.secondary }]}>
                {Math.round((userStats?.rankProgress || 0) * 100)}%
              </Text>
            </View>
            <View style={[styles.rankTrack, { backgroundColor: colors.inputBackground }]}>
              <View
                style={[
                  styles.rankFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round((userStats?.rankProgress || 0) * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Section: Visual Theme Mode */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VISUAL THEME</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <View style={styles.themeSelectorRow}>
              {(['dark', 'light', 'system'] as const).map((t) => {
                const isSelected = themeMode === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeOptionBtn,
                      {
                        backgroundColor: isSelected ? colors.primarySubtle : colors.inputBackground,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => handleThemeSelect(t)}
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
                      size={18}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color: isSelected ? colors.primary : colors.textMuted,
                          fontWeight: isSelected ? '800' : '500',
                        },
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

        {/* Section: Cinematic Sound & Haptics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CINEMATIC SOUND & HAPTICS</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            {/* UI Sound Effects Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="volume-high-outline" size={19} color={colors.primary} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>UI Sound Effects</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    Spider-Man web, Thor lightning & ambient audio cues
                  </Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => {
                  playSound('buttonTap');
                  toggleSound(val);
                }}
                trackColor={{ false: colors.borderMuted, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Master Volume Stepper */}
            <View style={[styles.settingRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="speedometer-outline" size={19} color={colors.secondary} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Master Volume</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    {Math.round(masterVolume * 100)}% output volume
                  </Text>
                </View>
              </View>

              <View style={styles.volumeControls}>
                <TouchableOpacity
                  style={[styles.volStepBtn, { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle }]}
                  onPress={() => updateVolume(Math.max(0.2, masterVolume - 0.2))}
                  accessibilityLabel="Decrease volume"
                >
                  <Ionicons name="remove" size={15} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.volStepBtn, { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle }]}
                  onPress={() => updateVolume(Math.min(1.0, masterVolume + 0.2))}
                  accessibilityLabel="Increase volume"
                >
                  <Ionicons name="add" size={15} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Haptic Feedback Toggle */}
            <View style={[styles.settingRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="phone-portrait-outline" size={19} color={colors.accent} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Haptic Feedback</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    Tactile vibration pulses on check and tap
                  </Text>
                </View>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => {
                  triggerHaptic('medium');
                  toggleHaptics(val);
                }}
                trackColor={{ false: colors.borderMuted, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Audio Previews Grid */}
            <View style={[styles.soundPreviewBox, { borderTopColor: colors.borderSubtle }]}>
              <Text style={[styles.previewHeading, { color: colors.textSecondary }]}>AUDIO ASSET PREVIEW</Text>
              <View style={styles.previewsGrid}>
                {soundPreviews.map((s) => (
                  <TouchableOpacity
                    key={s.type}
                    style={[styles.previewBtn, { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle }]}
                    onPress={() => handlePreviewSound(s.type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.previewDot, { backgroundColor: s.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.previewLabel, { color: colors.text }]}>{s.label}</Text>
                      <Text style={[styles.previewHero, { color: s.color }]}>{s.hero}</Text>
                    </View>
                    <Ionicons name="play" size={13} color={colors.text} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Section: Cinematic Intro Experience */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CINEMATIC INTRO EXPERIENCE</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            {/* Cinematic Startup Intro Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="film-outline" size={19} color={colors.primary} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Cinematic Startup Intro</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    Personalized superhero animation on app launch
                  </Text>
                </View>
              </View>
              <Switch
                value={introEnabled}
                onValueChange={handleToggleIntroEnabled}
                trackColor={{ false: colors.borderMuted, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Intro Audio Effects Toggle */}
            <View style={[styles.settingRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="volume-medium-outline" size={19} color={colors.secondary} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Intro Audio Effects</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    Whoosh, web snap, and thunder crackle
                  </Text>
                </View>
              </View>
              <Switch
                value={introSoundEnabled}
                onValueChange={handleToggleIntroSound}
                trackColor={{ false: colors.borderMuted, true: colors.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Reduced Motion Toggle */}
            <View style={[styles.settingRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.settingIconTitle}>
                <Ionicons name="speedometer-outline" size={19} color={colors.accent} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Fast Mode / Reduced Motion</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    Shorten startup sequence for instant access
                  </Text>
                </View>
              </View>
              <Switch
                value={reducedMotion}
                onValueChange={handleToggleReducedMotion}
                trackColor={{ false: colors.borderMuted, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Replay Intro CTA */}
            <WebButtonInteraction
              style={[styles.replayBtn, { backgroundColor: colors.primarySubtle, borderColor: colors.primaryBorder }]}
              onPress={handleReplayIntro}
              variant="subtle"
              sound="buttonTap"
              haptic="medium"
            >
              <Ionicons name="play-circle" size={18} color={colors.primary} />
              <Text style={[styles.replayBtnText, { color: colors.primary }]}>Replay Cinematic Intro</Text>
            </WebButtonInteraction>
          </View>
        </View>

        {/* Section: Database & Storage */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LOCAL SQLITE STORAGE</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Missions in SQLite:</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{allTasks.length} tasks</Text>
            </View>

            <View style={[styles.statRow, styles.borderTop, { borderTopColor: colors.borderSubtle }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Configured Routine Protocols:</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{routines.length} protocols</Text>
            </View>

            <View style={styles.dataActionsCol}>
              <WebButtonInteraction
                style={[styles.resetBtn, { backgroundColor: colors.primarySubtle, borderColor: colors.primaryBorder }]}
                onPress={handleClearAllData}
                variant="subtle"
                sound="deleteAction"
                haptic="medium"
              >
                <Ionicons name="trash-outline" size={15} color={colors.primary} />
                <Text style={[styles.resetBtnText, { color: colors.primary }]}>Purge to Clean Slate (Blank Database)</Text>
              </WebButtonInteraction>

              <WebButtonInteraction
                style={[styles.resetBtn, { backgroundColor: colors.secondarySubtle, borderColor: colors.secondaryBorder, marginTop: 8 }]}
                onPress={handleLoadStarterPack}
                variant="subtle"
                sound="thunderMilestone"
                haptic="medium"
              >
                <Ionicons name="download-outline" size={15} color={colors.secondary} />
                <Text style={[styles.resetBtnText, { color: colors.secondary }]}>Load Superhero Starter Protocols</Text>
              </WebButtonInteraction>
            </View>
          </View>
        </View>

        {/* About App */}
        <View style={styles.aboutBox}>
          <SpiderEmblem size={34} color={colors.textMuted} opacity={0.6} />
          <Text style={[styles.aboutTitle, { color: colors.text }]}>SPIDEY FLOW</Text>
          <Text style={[styles.aboutTagline, { color: colors.primary }]}>YOUR DAY. YOUR MISSION.</Text>
          <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>Version 1.0.0 • Production Build</Text>
          <Text style={[styles.aboutCredits, { color: colors.textSecondary }]}>
            Crafted with precision. Spider-Man agility, Thor lightning, and Venom atmosphere.
          </Text>
        </View>
      </ScrollView>

      {/* Hero Dossier Edit Modal */}
      <ModalHeroProfile
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? 14 : Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSubtitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    elevation: 2,
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
    borderWidth: 1.5,
    marginRight: Spacing.md,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  clearanceBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radii.xs,
  },
  clearanceText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radii.xs,
    borderWidth: 0.8,
  },
  editBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dataActionsCol: {
    marginTop: Spacing.sm,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operativeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  operativeStatCol: {
    flex: 1,
  },
  operativeStatLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  operativeRankTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  operativeRankLevel: {
    fontSize: 11,
    marginTop: 1,
  },
  operativeStatDivider: {
    width: 1,
    height: 34,
    marginHorizontal: 12,
  },
  operativeStreakVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  operativeTotalMissions: {
    fontSize: 11,
    marginTop: 1,
  },
  rankProgressSection: {
    marginTop: 12,
  },
  rankProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rankProgressSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  rankProgressPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  rankTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rankFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  borderTop: {
    borderTopWidth: 1,
    marginTop: Spacing.xs,
    paddingTop: Spacing.md,
  },
  settingIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
    gap: 12,
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  volumeControls: {
    flexDirection: 'row',
    gap: 8,
  },
  volStepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  soundPreviewBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  previewHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  previewsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
    borderWidth: 1,
    width: '48%',
    gap: 6,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewHero: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: 6,
  },
  replayBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  aboutBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: 4,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  aboutTagline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  aboutVersion: {
    fontSize: 11,
    marginTop: 2,
  },
  aboutCredits: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
    lineHeight: 16,
  },
});
