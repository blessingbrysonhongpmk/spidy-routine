import { SpideyColors } from '@/constants/theme';
import { getAppSetting, setAppSetting } from '@/services/database';
import { playSound, triggerHaptic } from '@/services/sound';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
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
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
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
 * High-craftsmanship personalized cinematic startup experience.
 * Features the user's comic-book hero poster artwork edge-to-edge,
 * layered with dynamic Thor electric-blue lightning flashes,
 * an active laser progress bar fill, symbiote atmospheric pulse,
 * audio/haptic cues, and an instant Skip button.
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

  const completedRef = useRef(false);

  // Animation Shared Values
  const screenOpacity = useSharedValue(1);
  const lightningOpacity = useSharedValue(0);
  const webGlintOpacity = useSharedValue(0);
  const progressBarWidth = useSharedValue(0);
  const symbiotePulse = useSharedValue(0.7);

  // Safe dismiss helper with Reanimated fade-out
  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    screenOpacity.value = withTiming(
      0,
      { duration: 340, easing: Easing.out(Easing.cubic) },
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

  useEffect(() => {
    let isMounted = true;

    // 1. Symbiote organic breathing pulse
    symbiotePulse.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.65, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 2. Spider web specular glint
    webGlintOpacity.value = withDelay(
      200,
      withSequence(
        withTiming(0.8, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.quad) })
      )
    );

    // 3. Thor electric-blue lightning streak flash
    lightningOpacity.value = withDelay(
      420,
      withSequence(
        withTiming(1.0, { duration: 70 }),
        withTiming(0.2, { duration: 40 }),
        withTiming(0.9, { duration: 80 }),
        withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) })
      )
    );

    // 4. Active Progress Bar fills smoothly from 0% to 100%
    progressBarWidth.value = withDelay(
      250,
      withTiming(1, {
        duration: 1550,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    );

    // 5. Sound & Haptic FX
    try {
      playSound('startupWhoosh');

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        playSound('electricCrackle');
        triggerHaptic('medium');
      }, 420);

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        playSound('webShoot');
        triggerHaptic('light');
      }, 900);
    } catch {
      // Audio engine gracefully non-blocking
    }

    // 6. Decoupled Settings Check
    (async () => {
      try {
        const introEnabled = (await getAppSetting('intro_enabled', 'true')) === 'true';
        if (!introEnabled && isMounted) {
          finishIntro();
          return;
        }
        await setAppSetting('intro_has_launched', 'true');
      } catch {
        // Safe fallback
      }
    })();

    // 7. Auto-dismiss when animation finishes (~2.2s)
    const autoDismissTimer = setTimeout(() => {
      if (!isMounted || completedRef.current) return;
      finishIntro();
    }, 2250);

    // 8. Hard safety timeout (Guarantees user is never trapped)
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
    progressBarWidth,
    symbiotePulse,
    webGlintOpacity,
  ]);

  // When app initialization is ready and progress bar has completed
  useEffect(() => {
    if (isAppReady && !completedRef.current && progressBarWidth.value >= 0.98) {
      const exitTimer = setTimeout(() => {
        finishIntro();
      }, 200);
      return () => clearTimeout(exitTimer);
    }
  }, [isAppReady, finishIntro, progressBarWidth.value]);

  // Animated Styles
  const screenAnimStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const lightningAnimStyle = useAnimatedStyle(() => ({
    opacity: lightningOpacity.value,
  }));

  const webAnimStyle = useAnimatedStyle(() => ({
    opacity: webGlintOpacity.value,
  }));

  const symbioteAnimStyle = useAnimatedStyle(() => ({
    opacity: symbiotePulse.value,
  }));

  const progressFillAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progressBarWidth.value * 100))}%`,
  }));

  // Target coordinates for progress bar overlay matching poster layout
  // Progress bar in 472x1024 poster sits at ~83.6% of screen height
  const progressTopOffset = Math.round(screenHeight * 0.834);
  const progressTrackWidth = Math.min(Math.round(screenWidth * 0.73), 320);

  return (
    <Animated.View style={[styles.fullScreenContainer, screenAnimStyle]}>
      <ExpoStatusBar style="light" />

      {/* 1. Full-Screen Personalized Comic Hero Poster Background */}
      <Image
        source={require('@/assets/images/hero-portrait.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        priority="high"
        transition={200}
      />

      {/* 2. Top Bar Subtle Dark Gradient (Ensures Skip button legibility on all notches) */}
      <View style={styles.topVignette} pointerEvents="none">
        <Svg width="100%" height={100} fill="none">
          <Defs>
            <LinearGradient id="topVignetteGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#000000" stopOpacity="0.65" />
              <Stop offset="60%" stopColor="#000000" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={`M0 0 H${screenWidth} V100 H0 Z`} fill="url(#topVignetteGrad)" />
        </Svg>
      </View>

      {/* 3. Spider-Man Corner Web Specular Pulse (Top Left) */}
      <Animated.View style={[styles.webCornerOverlay, webAnimStyle]} pointerEvents="none">
        <Svg width={180} height={180} viewBox="0 0 180 180" fill="none">
          <Defs>
            <RadialGradient id="webCrimsonGlow" cx="0%" cy="0%" r="90%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
              <Stop offset="50%" stopColor="#EF4444" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Path d="M0 0 H180 V180 H0 Z" fill="url(#webCrimsonGlow)" />
        </Svg>
      </Animated.View>

      {/* 4. Thor Electric-Blue Lightning Arc Overlay (Upper Right) */}
      <Animated.View style={[styles.lightningOverlay, lightningAnimStyle]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 240 320" fill="none">
          <Path
            d="M210 15 L165 75 L180 92 L120 165 L140 180 L80 255"
            stroke="#38BDF8"
            strokeWidth="3.2"
            strokeOpacity="0.95"
          />
          <Path
            d="M210 15 L165 75 L180 92 L120 165 L140 180 L80 255"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="1"
          />
          <Path
            d="M165 75 L130 95 L115 130"
            stroke="#0EA5E9"
            strokeWidth="1.6"
            strokeOpacity="0.75"
          />
          <Path
            d="M120 165 L155 190 L145 220"
            stroke="#38BDF8"
            strokeWidth="1.4"
            strokeOpacity="0.7"
          />
          <Circle cx="120" cy="165" r="4.5" fill="#E0F2FE" />
          <Circle cx="80" cy="255" r="3.5" fill="#38BDF8" />
        </Svg>
      </Animated.View>

      {/* 5. Venom Symbiote Atmospheric Energy Breath (Bottom Edges) */}
      <Animated.View style={[styles.symbioteBottomOverlay, symbioteAnimStyle]} pointerEvents="none">
        <Svg width="100%" height={160} viewBox={`0 0 ${screenWidth} 160`} fill="none">
          <Defs>
            <RadialGradient id="venomPurpleGlowLeft" cx="0%" cy="100%" r="85%">
              <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.32" />
              <Stop offset="60%" stopColor="#4C1D95" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#0B0C0E" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="venomPurpleGlowRight" cx="100%" cy="100%" r="85%">
              <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <Stop offset="60%" stopColor="#581C87" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#0B0C0E" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Path d={`M0 0 H${screenWidth * 0.55} V160 H0 Z`} fill="url(#venomPurpleGlowLeft)" />
          <Path d={`M${screenWidth * 0.45} 0 H${screenWidth} V160 H${screenWidth * 0.45} Z`} fill="url(#venomPurpleGlowRight)" />
        </Svg>
      </Animated.View>

      {/* 6. Active Laser Progress Bar Overlay (Precision aligned with printed bar) */}
      <View
        style={[
          styles.progressOverlayContainer,
          {
            top: progressTopOffset,
            width: progressTrackWidth,
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.activeProgressTrack}>
          <Animated.View style={[styles.activeProgressFill, progressFillAnimStyle]}>
            {/* Bright Laser Spark Head */}
            <View style={styles.activeLaserHead} />
          </Animated.View>
        </View>
      </View>

      {/* 7. Immediate Skip Button (Top Right) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Skip intro and open dashboard"
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 8. Fallback Error Notice if offline initialization fails */}
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
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 10,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 48,
    right: 18,
    zIndex: 30,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 12, 14, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  webCornerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 180,
    zIndex: 5,
  },
  lightningOverlay: {
    position: 'absolute',
    top: '8%',
    right: '2%',
    width: '52%',
    height: '42%',
    zIndex: 6,
  },
  symbioteBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 5,
  },
  progressOverlayContainer: {
    position: 'absolute',
    alignSelf: 'center',
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  activeProgressTrack: {
    width: '100%',
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  activeProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.88)',
    borderRadius: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    position: 'relative',
  },
  activeLaserHead: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(19, 21, 26, 0.95)',
    borderWidth: 1,
    borderColor: SpideyColors.spideyRedBorder,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
    zIndex: 40,
  },
  errorText: {
    color: SpideyColors.textSecondary,
    fontSize: 10.5,
  },
  retryBtn: {
    backgroundColor: SpideyColors.spideyRed,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
});
