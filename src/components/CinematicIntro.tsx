import { SpiderEmblem } from '@/components/SpiderEmblem';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { getAppSetting, setAppSetting } from '@/services/database';
import { playSound, triggerHaptic } from '@/services/sound';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CinematicIntroProps {
  onComplete: () => void;
  isAppReady: boolean;
  initError?: string | null;
  onRetry?: () => void;
}

/**
 * CinematicIntro:
 * Personalized cinematic startup introduction featuring the user's comic-styled portrait.
 * Seamlessly integrates Spider-Man web energy, Thor lightning flashes, and Venom dark atmosphere.
 * Coordinates with real SQLite and auth initialization state.
 */
export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  isAppReady,
  initError,
  onRetry,
}) => {
  const [skipVisible] = useState(true);
  const [greetingText, setGreetingText] = useState('');
  const completedRef = useRef(false);

  // Animation values
  const screenOpacity = useSharedValue(1);
  const portraitOpacity = useSharedValue(0);
  const portraitScale = useSharedValue(0.92);
  const webLinesOpacity = useSharedValue(0);
  const lightningOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const progressBarWidth = useSharedValue(0);
  const rimGlowOpacity = useSharedValue(0);
  const bottomBadgeOpacity = useSharedValue(0);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    screenOpacity.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(onComplete)();
    });
  }, [onComplete, screenOpacity]);

  // Handle manual skip
  const handleSkip = useCallback(() => {
    triggerHaptic('light');
    finishIntro();
  }, [finishIntro]);

  // Typing animation for "HEY, BOSS!"
  const triggerTypingGreeting = useCallback(() => {
    const fullText = 'HEY, BOSS!';
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setGreetingText(fullText.slice(0, currentIdx));
      if (currentIdx >= fullText.length) {
        clearInterval(interval);
      }
    }, 45);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function startIntroSequence() {
      // Check reduced motion
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      const introEnabled = (await getAppSetting('intro_enabled', 'true')) === 'true';
      const introSound = (await getAppSetting('intro_sound_enabled', 'true')) === 'true';
      const hasLaunched = (await getAppSetting('intro_has_launched', 'false')) === 'true';

      if (!isMounted) return;

      // If user disabled intro in settings, complete immediately
      if (!introEnabled) {
        onComplete();
        return;
      }

      // Fast mode for returning users (~1.1s), full cinematic mode for first launch (~2.4s)
      const durationMultiplier = isReduced ? 0.3 : hasLaunched ? 0.5 : 1.0;

      // Mark that intro has launched at least once
      await setAppSetting('intro_has_launched', 'true');

      // Phase 1 (0.0s - 0.3s): Startup sound + Web lines reveal
      if (introSound) {
        playSound('startupWhoosh');
      }

      webLinesOpacity.value = withTiming(1, {
        duration: 350 * durationMultiplier,
        easing: Easing.out(Easing.quad),
      });

      // Phase 2 (0.3s - 0.9s): Portrait reveal + Web-shoot snap sound
      const p2Delay = 300 * durationMultiplier;
      portraitOpacity.value = withDelay(
        p2Delay,
        withTiming(1, { duration: 500 * durationMultiplier, easing: Easing.out(Easing.cubic) })
      );
      portraitScale.value = withDelay(
        p2Delay,
        withTiming(1.0, { duration: 600 * durationMultiplier, easing: Easing.out(Easing.back(1.1)) })
      );
      rimGlowOpacity.value = withDelay(
        p2Delay + 100,
        withTiming(1, { duration: 400 * durationMultiplier })
      );

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        if (introSound) playSound('webShoot');
        triggerHaptic('light');
      }, p2Delay);

      // Phase 3 (0.9s - 1.4s): Thor electric-blue lightning flash + crackle audio
      const p3Delay = 900 * durationMultiplier;
      lightningOpacity.value = withDelay(
        p3Delay,
        withSequence(
          withTiming(0.9, { duration: 80 }),
          withTiming(0.2, { duration: 60 }),
          withTiming(1, { duration: 90 }),
          withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) })
        )
      );

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        if (introSound) playSound('electricCrackle');
        triggerHaptic('medium');
      }, p3Delay);

      // Phase 4 (1.3s - 2.0s): Logo reveal + Greeting + Progress bar
      const p4Delay = 1250 * durationMultiplier;
      logoOpacity.value = withDelay(
        p4Delay,
        withTiming(1, { duration: 400 * durationMultiplier, easing: Easing.out(Easing.quad) })
      );
      taglineOpacity.value = withDelay(
        p4Delay + 150,
        withTiming(1, { duration: 400 * durationMultiplier })
      );
      bottomBadgeOpacity.value = withDelay(
        p4Delay + 250,
        withTiming(1, { duration: 350 * durationMultiplier })
      );

      // Progress bar fill
      progressBarWidth.value = withDelay(
        p4Delay,
        withTiming(1, { duration: 750 * durationMultiplier, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      );

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        if (introSound) playSound('logoReveal');
        triggerTypingGreeting();
      }, p4Delay);

      // Phase 5: Smooth exit into dashboard once ready
      const totalDuration = 2400 * durationMultiplier;
      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        // If app is already ready, transition immediately
        if (isAppReady) {
          finishIntro();
        }
      }, totalDuration);
    }

    startIntroSequence();

    return () => {
      isMounted = false;
    };
  }, [
    finishIntro,
    isAppReady,
    lightningOpacity,
    logoOpacity,
    onComplete,
    portraitOpacity,
    portraitScale,
    progressBarWidth,
    rimGlowOpacity,
    taglineOpacity,
    triggerTypingGreeting,
    webLinesOpacity,
    bottomBadgeOpacity,
  ]);

  // When real initialization completes after animation target
  useEffect(() => {
    if (isAppReady && !completedRef.current && progressBarWidth.value >= 0.9) {
      const timer = setTimeout(() => {
        finishIntro();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAppReady, finishIntro, progressBarWidth.value]);

  // Animated styles
  const screenAnimStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const portraitAnimStyle = useAnimatedStyle(() => ({
    opacity: portraitOpacity.value,
    transform: [{ scale: portraitScale.value }],
  }));

  const webAnimStyle = useAnimatedStyle(() => ({
    opacity: webLinesOpacity.value,
  }));

  const lightningAnimStyle = useAnimatedStyle(() => ({
    opacity: lightningOpacity.value,
  }));

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value * 100}%`,
  }));

  const bottomBadgeAnimStyle = useAnimatedStyle(() => ({
    opacity: bottomBadgeOpacity.value,
  }));

  return (
    <Animated.View style={[styles.fullScreenContainer, screenAnimStyle]}>
      <ExpoStatusBar style="light" />

      {/* Background Hero Portrait Image with full comic artwork */}
      <Animated.View style={[StyleSheet.absoluteFill, portraitAnimStyle]}>
        <Image
          source={require('@/assets/images/hero-portrait.jpg')}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
          priority="high"
        />
      </Animated.View>

      {/* Spider-Man Web Overlay Graphics (Top-Left) */}
      <Animated.View style={[StyleSheet.absoluteFill, webAnimStyle]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`} fill="none">
          <Defs>
            <RadialGradient id="spideyIntroGlow" cx="0%" cy="15%" r="65%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#0B0C0E" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Path d={`M0 0 H${SCREEN_WIDTH * 0.7} V${SCREEN_HEIGHT * 0.4} H0 Z`} fill="url(#spideyIntroGlow)" />
        </Svg>
      </Animated.View>

      {/* Thor Electric Lightning Flash Overlay (Right Side) */}
      <Animated.View style={[StyleSheet.absoluteFill, lightningAnimStyle]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`} fill="none">
          <Defs>
            <RadialGradient id="thorIntroFlash" cx="95%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.45" />
              <Stop offset="50%" stopColor="#38BDF8" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#0B0C0E" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Path d={`M0 0 H${SCREEN_WIDTH} V${SCREEN_HEIGHT} H0 Z`} fill="url(#thorIntroFlash)" />
        </Svg>
      </Animated.View>

      {/* Top Header Row with SPIDEY FLOW Brand & Skip CTA */}
      <View style={styles.topBar}>
        <View style={styles.brandTitleCol}>
          <View style={styles.brandLogoRow}>
            <Text style={styles.brandMini}>SPIDEY FLOW</Text>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.brandSubtitle}>YOUR DAY. YOUR MISSION.</Text>
        </View>

        {skipVisible && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Skip intro and open dashboard"
          >
            <Text style={styles.skipText}>Skip</Text>
            <Ionicons name="chevron-forward" size={13} color={SpideyColors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center Spacer to keep the portrait unobstructed */}
      <View style={styles.centerSpacer} />

      {/* Bottom Content Area: Greeting, Logo, Tagline, and Progress Telemetry */}
      <View style={styles.bottomContentArea}>
        {/* Animated Greeting "HEY, BOSS!" */}
        <Animated.View style={[styles.greetingWrapper, taglineAnimStyle]}>
          <Text style={styles.greetingTitle}>
            {greetingText || 'HEY, BOSS!'}
          </Text>
        </Animated.View>

        {/* Large SPIDEY FLOW Brand Wordmark */}
        <Animated.View style={[styles.logoSection, logoAnimStyle]}>
          <View style={styles.mainTitleRow}>
            <Text style={styles.mainTitleSpidey}>SPIDEY </Text>
            <Text style={styles.mainTitleFlow}>FLOW</Text>
          </View>
          <Text style={styles.missionTagline}>PLAN • FOCUS • CONQUER</Text>
        </Animated.View>

        {/* Initialization Progress Bar & Status */}
        <Animated.View style={[styles.progressSection, taglineAnimStyle]}>
          <Text style={styles.progressStatusText}>
            INITIALIZING YOUR DAILY MISSION...
          </Text>

          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, progressAnimStyle]} />
          </View>

          <Text style={styles.poweringUpText}>POWERING UP...</Text>
        </Animated.View>

        {/* Bottom Laser-etched Spider Insignia */}
        <Animated.View style={[styles.bottomInsigniaBox, bottomBadgeAnimStyle]}>
          <SpiderEmblem size={26} color={SpideyColors.textMuted} opacity={0.5} />
        </Animated.View>

        {/* Initialization Error Fallback */}
        {initError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Notice: {initError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => (onRetry ? onRetry() : finishIntro())}
            >
              <Text style={styles.retryBtnText}>Continue Offline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#07080A',
    zIndex: 9999,
    justifyContent: 'space-between',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 54,
    paddingHorizontal: Spacing.xl,
    zIndex: 20,
  },
  brandTitleCol: {
    flex: 1,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandMini: {
    fontSize: 13,
    fontWeight: '800',
    color: SpideyColors.textPrimary,
    letterSpacing: 1.5,
  },
  brandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SpideyColors.spideyRed,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: SpideyColors.textMuted,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 21, 26, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    gap: 3,
  },
  skipText: {
    color: SpideyColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  centerSpacer: {
    flex: 1,
  },
  bottomContentArea: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'android' ? 24 : 40,
    alignItems: 'center',
    zIndex: 20,
  },
  greetingWrapper: {
    marginBottom: 6,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: SpideyColors.textPrimary,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTitleSpidey: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  mainTitleFlow: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: SpideyColors.spideyRed,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  missionTagline: {
    fontSize: 11,
    fontWeight: '800',
    color: SpideyColors.textSecondary,
    letterSpacing: 2.2,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressSection: {
    width: '100%',
    maxWidth: 290,
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: SpideyColors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  progressBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: SpideyColors.spideyRed,
    borderRadius: Radii.pill,
    shadowColor: SpideyColors.spideyRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  poweringUpText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: SpideyColors.textMuted,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  bottomInsigniaBox: {
    marginTop: 4,
    alignItems: 'center',
  },
  errorBanner: {
    marginTop: 10,
    backgroundColor: 'rgba(19, 21, 26, 0.95)',
    borderWidth: 1,
    borderColor: SpideyColors.spideyRedBorder,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.sm,
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: SpideyColors.textSecondary,
    fontSize: 11,
  },
  retryBtn: {
    backgroundColor: SpideyColors.spideyRed,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.xs,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

