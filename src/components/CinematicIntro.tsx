import { SpideyColors } from '@/constants/theme';
import { getAppSetting, setAppSetting } from '@/services/database';
import { playSound, triggerHaptic } from '@/services/sound';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const posterSource = require('../../assets/images/loading-poster.jpg');

/**
 * CinematicIntro:
 * High-craftsmanship personalized cinematic startup and loading experience.
 * Features the superhero Bryvolt poster artwork edge-to-edge,
 * layered with dynamic Thor electric-blue lightning flashes,
 * pulsing Spider-Man crimson web glints, an active laser progress bar fill,
 * real-time percentage counter (0% -> 100%), dynamic mission telemetry cycling,
 * audio/haptic cues, and an instant Skip button.
 */
export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  isAppReady = true,
  initError,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const completedRef = useRef(false);
  const [minBarComplete, setMinBarComplete] = useState(false);
  const [percent, setPercent] = useState(0);
  const [statusText, setStatusText] = useState('A boy with a dream. A city waiting for a hero...');

  // Animation Shared Values
  const screenOpacity = useSharedValue(1);
  const lightningOpacity = useSharedValue(0);
  const webGlintOpacity = useSharedValue(0);
  const progressBarWidth = useSharedValue(0);
  const laserSparkPulse = useSharedValue(1);
  const heartbeatPulse = useSharedValue(1);
  const emberPulse = useSharedValue(0.4);

  const fallbackDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safe dismiss helper with Reanimated fade-out + web/timeout guarantee
  const completeOnce = useCallback(() => {
    if (fallbackDismissRef.current) {
      clearTimeout(fallbackDismissRef.current);
      fallbackDismissRef.current = null;
    }
    onComplete();
  }, [onComplete]);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    fallbackDismissRef.current = setTimeout(() => {
      completeOnce();
    }, 380);

    screenOpacity.value = withTiming(
      0,
      { duration: 320, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(completeOnce)();
        }
      }
    );
  }, [completeOnce, screenOpacity]);

  // Immediate Skip handling
  const handleSkip = useCallback(() => {
    triggerHaptic('light');
    playSound('buttonTap');
    finishIntro();
  }, [finishIntro]);

  useEffect(() => {
    let isMounted = true;

    // 1. Spider web specular glint
    webGlintOpacity.value = withDelay(
      150,
      withSequence(
        withTiming(0.85, { duration: 320, easing: Easing.out(Easing.quad) }),
        withTiming(0.35, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.7, { duration: 400, easing: Easing.inOut(Easing.quad) })
      )
    );

    // 2. Thor electric-blue lightning streak flashes (Initial strike + second surge)
    lightningOpacity.value = withDelay(
      380,
      withSequence(
        withTiming(1.0, { duration: 60 }),
        withTiming(0.15, { duration: 35 }),
        withTiming(0.95, { duration: 75 }),
        withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) }),
        withDelay(
          550,
          withSequence(
            withTiming(0.85, { duration: 50 }),
            withTiming(0.1, { duration: 30 }),
            withTiming(0.7, { duration: 60 }),
            withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) })
          )
        )
      )
    );

    // 3. Laser spark pulse at leading edge of progress bar
    laserSparkPulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 250, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.9, { duration: 250, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 4. Hero heart-pulse (emblem rhythm that melts the heart)
    heartbeatPulse.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 90, easing: Easing.in(Easing.quad) }),
        withTiming(1.12, { duration: 130, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 680, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 5. Ambient glowing stardust/embers drifting upward
    emberPulse.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 6. Smooth Progress Bar fill (0 -> 1 over ~1800ms)
    progressBarWidth.value = withDelay(
      200,
      withTiming(1, {
        duration: 1750,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    );

    // 7. Emotional Procedural Sound & Haptic FX Sequence
    try {
      playSound('startupWhoosh');

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        playSound('webShoot');
        triggerHaptic('medium');
      }, 550);

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        playSound('electricCrackle');
        triggerHaptic('light');
      }, 1050);

      setTimeout(() => {
        if (!isMounted || completedRef.current) return;
        playSound('thunderMilestone');
        triggerHaptic('success');
      }, 1850);
    } catch {
      // Audio engine gracefully non-blocking
    }

    // 8. Inspiring Heart-Melting Heroic Journey Subtitles
    const startTime = Date.now();
    const duration = 1800;
    const progressInterval = setInterval(() => {
      if (!isMounted || completedRef.current) return;
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(1, Math.max(0, elapsed / duration));
      // Ease out progress curve
      const easedProgress = Math.min(100, Math.round((1 - Math.pow(1 - rawProgress, 2.2)) * 100));

      setPercent(easedProgress);

      if (easedProgress < 22) {
        setStatusText('Initializing Your Mission...');
      } else if (easedProgress < 46) {
        setStatusText('A boy with a dream. A city waiting for a hero...');
      } else if (easedProgress < 70) {
        setStatusText('Master the webs. Command the thunder...');
      } else if (easedProgress < 92) {
        setStatusText('Every sunrise is your mission. Stand tall.');
      } else {
        setStatusText('Welcome home, Boss. Your legacy begins.');
      }

      if (easedProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 35);

    // 7. Check if user disabled intro in settings
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

    // Mark progress bar ready at ~1.85s
    const barReadyTimer = setTimeout(() => {
      if (isMounted) setMinBarComplete(true);
    }, 1880);

    // Auto-dismiss when complete (~2.2s)
    const autoDismissTimer = setTimeout(() => {
      if (!isMounted || completedRef.current) return;
      finishIntro();
    }, 2250);

    // Hard fallback timeout (Guarantees user is never stuck)
    const hardFallbackTimer = setTimeout(() => {
      if (!isMounted || completedRef.current) return;
      finishIntro();
    }, 3400);

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
      clearTimeout(barReadyTimer);
      clearTimeout(autoDismissTimer);
      clearTimeout(hardFallbackTimer);
    };
  }, [
    emberPulse,
    finishIntro,
    heartbeatPulse,
    laserSparkPulse,
    lightningOpacity,
    progressBarWidth,
    webGlintOpacity,
  ]);

  // When app initialization is ready and progress bar animation has finished
  useEffect(() => {
    if (isAppReady && minBarComplete && !completedRef.current) {
      const exitTimer = setTimeout(() => {
        finishIntro();
      }, 200);
      return () => clearTimeout(exitTimer);
    }
  }, [isAppReady, minBarComplete, finishIntro]);

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

  const progressFillAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progressBarWidth.value * 100))}%`,
  }));

  const laserHeadAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: laserSparkPulse.value }],
  }));

  const heartbeatAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartbeatPulse.value }],
    opacity: heartbeatPulse.value > 1.05 ? 0.75 : 0.35,
  }));

  const emberAnimStyle = useAnimatedStyle(() => ({
    opacity: emberPulse.value,
  }));

  return (
    <Animated.View style={[styles.fullScreenContainer, screenAnimStyle]}>
      <ExpoStatusBar style="light" />

      {/* Centered Mobile Phone Viewport Frame */}
      <View style={styles.phoneFrame}>
        {/* 1. Superhero Bryvolt Poster Edge-to-Edge Artwork */}
        <Image
          source={posterSource}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Hero Heartbeat & Life Force Pulse Layer (Over young hero's chest/emblem) */}
        <Animated.View style={[styles.heroHeartbeatContainer, heartbeatAnimStyle]} pointerEvents="none">
          <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
            <Defs>
              <RadialGradient id="heroHeartGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.75" />
                <Stop offset="40%" stopColor="#EF4444" stopOpacity="0.25" />
                <Stop offset="80%" stopColor="#38BDF8" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#070A0F" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="60" cy="60" r="55" fill="url(#heroHeartGlow)" />
          </Svg>
        </Animated.View>

        {/* Ambient Rising Stardust & Superhero Embers */}
        <Animated.View style={[StyleSheet.absoluteFill, emberAnimStyle]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 400 700" fill="none">
            <Circle cx="85" cy="520" r="1.8" fill="#FDE047" opacity="0.8" />
            <Circle cx="120" cy="460" r="2.2" fill="#EF4444" opacity="0.7" />
            <Circle cx="170" cy="490" r="1.5" fill="#38BDF8" opacity="0.8" />
            <Circle cx="230" cy="440" r="2.5" fill="#FFFFFF" opacity="0.9" />
            <Circle cx="290" cy="510" r="1.6" fill="#C084FC" opacity="0.7" />
            <Circle cx="330" cy="470" r="2.0" fill="#38BDF8" opacity="0.85" />
            <Circle cx="140" cy="380" r="1.4" fill="#F59E0B" opacity="0.75" />
            <Circle cx="260" cy="360" r="2.0" fill="#EF4444" opacity="0.8" />
          </Svg>
        </Animated.View>

        {/* 2. Top Bar with Safe Inset: Skip button */}
        <View
          style={[
            styles.topBar,
            {
              top:
                Math.max(
                  insets?.top ?? 0,
                  Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24
                ) + 12,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.75}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Skip intro and open dashboard"
          >
            <Ionicons name="play-skip-forward" size={11} color="#FFFFFF" />
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Spider-Man Corner Web Specular Pulse (Top Left) */}
        <Animated.View style={[styles.webCornerOverlay, webAnimStyle]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <Defs>
              <RadialGradient id="webCrimsonGlow" cx="0%" cy="0%" r="85%">
                <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
                <Stop offset="60%" stopColor="#EF4444" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Path d="M0 0 H200 V200 H0 Z" fill="url(#webCrimsonGlow)" />
          </Svg>
        </Animated.View>

        {/* 4. Thor Electric-Blue Lightning Arc Overlay (Flashes over Venom's storm clouds) */}
        <Animated.View style={[styles.lightningOverlay, lightningAnimStyle]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 260 340" fill="none">
            <Path
              d="M240 10 L180 80 L195 98 L130 175 L155 190 L90 270"
              stroke="#38BDF8"
              strokeWidth="3.6"
              strokeOpacity="0.95"
            />
            <Path
              d="M240 10 L180 80 L195 98 L130 175 L155 190 L90 270"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeOpacity="1"
            />
            <Path
              d="M180 80 L140 105 L125 140"
              stroke="#0EA5E9"
              strokeWidth="1.8"
              strokeOpacity="0.8"
            />
            <Path
              d="M130 175 L170 200 L160 235"
              stroke="#38BDF8"
              strokeWidth="1.6"
              strokeOpacity="0.8"
            />
            <Circle cx="130" cy="175" r="5" fill="#E0F2FE" />
            <Circle cx="90" cy="270" r="4" fill="#38BDF8" />
          </Svg>
        </Animated.View>

        {/* 5. Dynamic Mission Status Pill */}
        <View style={styles.statusContainer} pointerEvents="none">
          <View style={styles.statusPill}>
            <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">
              {statusText}
            </Text>
          </View>
        </View>

        {/* 6. Active Laser Glowing Progress Bar with Real-time Percentage Counter */}
        <View style={styles.progressContainer} pointerEvents="none">
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressFillAnimStyle]}>
              <Animated.View style={[styles.laserSpark, laserHeadAnimStyle]} />
            </Animated.View>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentageText}>{percent}%</Text>
          </View>
        </View>

        {/* 7. Fallback Error Notice if offline initialization fails */}
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
    backgroundColor: '#070A0F',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    height: '100%',
    maxHeight: '100%',
    aspectRatio: 576 / 1024,
    maxWidth: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#070A0F',
    borderRadius: Platform.OS === 'web' ? 16 : 0,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.9,
    shadowRadius: 32,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroHeartbeatContainer: {
    position: 'absolute',
    top: '36%',
    left: '48%',
    marginLeft: -60,
    marginTop: -60,
    zIndex: 4,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 36,
    left: 20,
    zIndex: 30,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 12, 16, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 4,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  webCornerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 200,
    height: 200,
    zIndex: 5,
  },
  lightningOverlay: {
    position: 'absolute',
    top: '6%',
    right: '0%',
    width: '56%',
    height: '46%',
    zIndex: 6,
  },
  statusContainer: {
    position: 'absolute',
    top: '80.0%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  statusPill: {
    backgroundColor: 'rgba(7, 10, 15, 0.72)',
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    maxWidth: '88%',
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressContainer: {
    position: 'absolute',
    top: '83.6%',
    left: '15.5%',
    right: '12%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    zIndex: 26,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.9)',
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 5,
    position: 'relative',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  laserSpark: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  percentBadge: {
    backgroundColor: 'rgba(7, 10, 15, 0.72)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
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
