import { SpiderEmblem } from '@/components/SpiderEmblem';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { getAppSetting, setAppSetting } from '@/services/database';
import { playSound, triggerHaptic } from '@/services/sound';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface CinematicIntroProps {
  onComplete: () => void;
  isAppReady?: boolean;
  initError?: string | null;
  onRetry?: () => void;
}

/**
 * CinematicIntro:
 * High-craftsmanship personalized startup introduction featuring the user's comic portrait.
 * Rebuilt from the ground up for 100% reliability, centered responsive visual composition,
 * zero black-screen lockups, instant skip responsiveness, and fluid superhero animations.
 */
export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  isAppReady = true,
  initError,
  onRetry,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const screenWidth = windowWidth || 380;
  const screenHeight = windowHeight || 800;

  // Responsive sizing: Portrait container occupies 42% - 46% of screen height
  const portraitHeight = Math.min(Math.round(screenHeight * 0.44), 380);
  const portraitWidth = Math.min(Math.round(screenWidth * 0.82), 340);

  const [greetingText, setGreetingText] = useState('HEY, BOSS!');
  const completedRef = useRef(false);

  // Animation Shared Values — Initialized with safe start values
  const screenOpacity = useSharedValue(1);
  const portraitOpacity = useSharedValue(0);
  const portraitScale = useSharedValue(0.9);
  const webLinesOpacity = useSharedValue(0);
  const lightningOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const progressBarWidth = useSharedValue(0);
  const symbiotePulse = useSharedValue(0.7);

  // Dismiss helper with Reanimated fade-out
  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    screenOpacity.value = withTiming(
      0,
      { duration: 320, easing: Easing.out(Easing.cubic) },
      () => {
        runOnJS(onComplete)();
      }
    );
  }, [onComplete, screenOpacity]);

  // Immediate Skip handling
  const handleSkip = useCallback(() => {
    triggerHaptic('light');
    finishIntro();
  }, [finishIntro]);

  // Typewriter text animation for "HEY, BOSS!"
  const startTypewriterGreeting = useCallback(() => {
    const fullText = 'HEY, BOSS!';
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setGreetingText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(interval);
      }
    }, 45);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Symbiote organic breathing pulse loop
    symbiotePulse.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.65, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 2. Main Visual Animation Pipeline (Kicks off IMMEDIATELY on frame 0 — ZERO blocking awaits)
    portraitOpacity.value = withTiming(1, {
      duration: 450,
      easing: Easing.out(Easing.quad),
    });

    portraitScale.value = withSpring(1.0, {
      damping: 14,
      stiffness: 120,
    });

    webLinesOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    // Thor electric-blue lightning streak flash
    lightningOpacity.value = withDelay(
      450,
      withSequence(
        withTiming(1.0, { duration: 80 }),
        withTiming(0.2, { duration: 50 }),
        withTiming(0.9, { duration: 70 }),
        withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) })
      )
    );

    // SPIDEY FLOW Logo & Tagline reveal
    logoOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    taglineOpacity.value = withDelay(
      450,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    // Progress bar fills smoothly from 0% to 100%
    progressBarWidth.value = withDelay(
      350,
      withTiming(1, {
        duration: 1400,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    );

    // Sound effect & typewriter audio triggers (non-blocking)
    try {
      playSound('startupWhoosh');
      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        playSound('webShoot');
        triggerHaptic('light');
      }, 350);

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        playSound('electricCrackle');
        startTypewriterGreeting();
      }, 550);
    } catch {
      // Audio engine gracefully non-blocking
    }

    // 3. Background Settings Check (Completely decoupled from visual rendering)
    (async () => {
      try {
        const introEnabled = (await getAppSetting('intro_enabled', 'true')) === 'true';
        if (!introEnabled && isMounted) {
          finishIntro();
          return;
        }
        await setAppSetting('intro_has_launched', 'true');
      } catch {
        // Safe fallback — never crashes the UI
      }
    })();

    // 4. Automatic Transition: Smooth exit once animation finishes
    const autoDismissTimer = setTimeout(() => {
      if (!isMounted || completedRef.current) return;
      finishIntro();
    }, 2200);

    // 5. Hard safety fallback timer: Guarantees user is NEVER trapped on splash screen
    const hardFallbackTimer = setTimeout(() => {
      if (!isMounted || completedRef.current) return;
      finishIntro();
    }, 3200);

    return () => {
      isMounted = false;
      clearTimeout(autoDismissTimer);
      clearTimeout(hardFallbackTimer);
    };
  }, [
    finishIntro,
    lightningOpacity,
    logoOpacity,
    portraitOpacity,
    portraitScale,
    progressBarWidth,
    startTypewriterGreeting,
    symbiotePulse,
    taglineOpacity,
    webLinesOpacity,
  ]);

  // When real app initialization completes while progress is full
  useEffect(() => {
    if (isAppReady && !completedRef.current && progressBarWidth.value >= 0.95) {
      const exitTimer = setTimeout(() => {
        finishIntro();
      }, 250);
      return () => clearTimeout(exitTimer);
    }
  }, [isAppReady, finishIntro, progressBarWidth.value]);

  // Animated Styles
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
    width: `${Math.min(100, Math.max(0, progressBarWidth.value * 100))}%`,
  }));

  const symbioteAnimStyle = useAnimatedStyle(() => ({
    opacity: symbiotePulse.value,
  }));

  return (
    <Animated.View style={[styles.fullScreenContainer, screenAnimStyle]}>
      <ExpoStatusBar style="light" />

      {/* Atmospheric Venom & Thor Radial Dusk Backdrop */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${screenWidth} ${screenHeight}`} fill="none">
          <Defs>
            <RadialGradient id="introDuskGlow" cx="50%" cy="40%" r="70%">
              <Stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.35" />
              <Stop offset="50%" stopColor="#0F172A" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#07080A" stopOpacity="1" />
            </RadialGradient>

            <RadialGradient id="topWebCrimson" cx="10%" cy="10%" r="55%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="#07080A" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="topLightningCyan" cx="90%" cy="15%" r="55%">
              <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#07080A" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Path d={`M0 0 H${screenWidth} V${screenHeight} H0 Z`} fill="url(#introDuskGlow)" />
          <Path d={`M0 0 H${screenWidth * 0.7} V${screenHeight * 0.4} H0 Z`} fill="url(#topWebCrimson)" />
          <Path d={`M${screenWidth * 0.3} 0 H${screenWidth} V${screenHeight * 0.4} H${screenWidth * 0.3} Z`} fill="url(#topLightningCyan)" />
        </Svg>
      </View>

      {/* Living Venom Symbiote Tendril Silhouette (Pulsing around edges) */}
      <Animated.View style={[StyleSheet.absoluteFill, symbioteAnimStyle]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${screenWidth} ${screenHeight}`} fill="none">
          <Path
            d={`M0 ${screenHeight * 0.75} Q 40 ${screenHeight * 0.7} 20 ${screenHeight * 0.85} T 50 ${screenHeight * 0.92} T 0 ${screenHeight}`}
            stroke="#8B5CF6"
            strokeWidth="1.2"
            strokeOpacity="0.2"
            fill="none"
          />
          <Path
            d={`M${screenWidth} ${screenHeight * 0.7} Q ${screenWidth - 40} ${screenHeight * 0.75} ${screenWidth - 15} ${screenHeight * 0.82} T ${screenWidth - 35} ${screenHeight * 0.9} T ${screenWidth} ${screenHeight}`}
            stroke="#C084FC"
            strokeWidth="1.2"
            strokeOpacity="0.18"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* =========================================================================
          1. TOP BAR: Small SPIDEY FLOW Branding & Immediate Skip Button
          ========================================================================= */}
      <View style={styles.topBar}>
        <View style={styles.brandTitleCol}>
          <View style={styles.brandLogoRow}>
            <Text style={styles.brandSpideyMini}>SPIDEY </Text>
            <Text style={styles.brandFlowMini}>FLOW</Text>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.brandTaglineMini}>YOUR DAY. YOUR MISSION.</Text>
        </View>

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
      </View>

      {/* =========================================================================
          2. CENTRE: Comic Portrait Frame (40–50% Height) with Webs & Lightning
          ========================================================================= */}
      <View style={styles.centerContainer}>
        <View style={[styles.portraitBox, { width: portraitWidth, height: portraitHeight }]}>
          {/* Spider-Man Corner Web Graphics (Behind & Framing the Portrait) */}
          <Animated.View style={[StyleSheet.absoluteFill, webAnimStyle]} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 340 380" fill="none">
              <Path d="M0 0 L110 110" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.4" />
              <Path d="M0 0 L150 70" stroke="#EF4444" strokeWidth="1.0" strokeOpacity="0.35" />
              <Path d="M0 0 L70 150" stroke="#EF4444" strokeWidth="1.0" strokeOpacity="0.35" />
              <Path d="M30 40 Q 40 30 50 12" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.25" />
              <Path d="M60 80 Q 80 60 100 24" stroke="#EF4444" strokeWidth="0.9" strokeOpacity="0.35" />
              <Path d="M90 120 Q 120 90 150 36" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.25" />
            </Svg>
          </Animated.View>

          {/* Thor Branching Lightning Streak (Top-Right of Portrait) */}
          <Animated.View style={[StyleSheet.absoluteFill, lightningAnimStyle]} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 340 380" fill="none">
              <Path
                d="M330 10 L280 60 L295 75 L240 140 L255 155 L200 220"
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeOpacity="0.85"
              />
              <Path
                d="M330 10 L280 60 L295 75 L240 140"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeOpacity="0.9"
              />
              <Path
                d="M280 60 L250 80 L235 110"
                stroke="#0EA5E9"
                strokeWidth="1.2"
                strokeOpacity="0.6"
              />
              <Circle cx="240" cy="140" r="3" fill="#E0F2FE" />
              <Circle cx="200" cy="220" r="2.5" fill="#38BDF8" />
            </Svg>
          </Animated.View>

          {/* Freaky Comic Portrait Artwork */}
          <Animated.View style={[styles.portraitCard, portraitAnimStyle]}>
            <Image
              source={require('@/assets/images/hero-portrait.jpg')}
              style={styles.portraitImg}
              contentFit="cover"
              priority="high"
              transition={200}
            />

            {/* Subtle Comic Halftone & Rim Glow Frame */}
            <View style={styles.portraitRimBorder} pointerEvents="none" />
          </Animated.View>
        </View>
      </View>

      {/* =========================================================================
          3. BELOW PORTRAIT: SPIDEY FLOW Logo, "HEY, BOSS!", & Mission Motto
          ========================================================================= */}
      <View style={styles.bottomSection}>
        {/* Animated Greeting "HEY, BOSS!" */}
        <Animated.View style={[styles.greetingRow, taglineAnimStyle]}>
          <Text style={styles.greetingTitle}>{greetingText}</Text>
        </Animated.View>

        {/* Large SPIDEY FLOW Comic Brand Logo */}
        <Animated.View style={[styles.mainBrandLogo, logoAnimStyle]}>
          <View style={styles.brandTitleRow}>
            <Text style={styles.spideyWord}>SPIDEY </Text>
            <Text style={styles.flowWord}>FLOW</Text>
          </View>
          <Text style={styles.missionTagline}>YOUR DAY. YOUR MISSION.</Text>
        </Animated.View>

        {/* =========================================================================
            4. BOTTOM: Loading Progress Telemetry & Status Indicator
            ========================================================================= */}
        <Animated.View style={[styles.progressBlock, taglineAnimStyle]}>
          <Text style={styles.statusLabel}>INITIALIZING YOUR DAILY MISSION...</Text>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressAnimStyle]} />
          </View>

          <View style={styles.poweringUpRow}>
            <Ionicons name="flash" size={11} color={SpideyColors.thorGold} style={styles.powerIcon} />
            <Text style={styles.poweringUpText}>POWERING UP...</Text>
          </View>
        </Animated.View>

        {/* Centered Laser-Etched Spider Emblem Insignia */}
        <View style={styles.emblemContainer}>
          <SpiderEmblem size={24} color={SpideyColors.textMuted} opacity={0.4} />
        </View>

        {/* Fallback Error Banner if Offline / Init Notice */}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 52,
    paddingHorizontal: Spacing.xl,
    zIndex: 30,
  },
  brandTitleCol: {
    flex: 1,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandSpideyMini: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  brandFlowMini: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: SpideyColors.spideyRed,
    letterSpacing: 1.2,
  },
  brandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SpideyColors.spideyRed,
    marginLeft: 3,
  },
  brandTaglineMini: {
    fontSize: 9.5,
    fontWeight: '700',
    color: SpideyColors.textMuted,
    letterSpacing: 1.1,
    marginTop: 2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    gap: 4,
  },
  skipText: {
    color: SpideyColors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  portraitBox: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  portraitCard: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F1117',
    borderWidth: 1.8,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    shadowColor: SpideyColors.spideyRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  portraitImg: {
    width: '100%',
    height: '100%',
  },
  portraitRimBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'android' ? 24 : 38,
    zIndex: 30,
  },
  greetingRow: {
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  mainBrandLogo: {
    alignItems: 'center',
    marginBottom: 14,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spideyWord: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  flowWord: {
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
    fontSize: 10.5,
    fontWeight: '800',
    color: SpideyColors.textSecondary,
    letterSpacing: 2,
    marginTop: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressBlock: {
    width: '100%',
    maxWidth: 270,
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: SpideyColors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: SpideyColors.spideyRed,
    borderRadius: Radii.pill,
    shadowColor: SpideyColors.spideyRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  poweringUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  powerIcon: {
    marginTop: 1,
  },
  poweringUpText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: SpideyColors.textMuted,
    letterSpacing: 1.5,
  },
  emblemContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  errorBanner: {
    marginTop: 8,
    backgroundColor: 'rgba(19, 21, 26, 0.95)',
    borderWidth: 1,
    borderColor: SpideyColors.spideyRedBorder,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    color: SpideyColors.textSecondary,
    fontSize: 10.5,
  },
  retryBtn: {
    backgroundColor: SpideyColors.spideyRed,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
});
