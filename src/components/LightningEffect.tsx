import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { playSound, triggerHaptic } from '@/services/sound';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LightningOptions {
  /** 'light' (subtle streak) | 'medium' (standard branch) | 'epic' (milestone thunder) */
  intensity?: 'light' | 'medium' | 'epic';
  /** Optional origin X coordinate */
  x?: number;
  /** Optional origin Y coordinate */
  y?: number;
  /** Whether to play electric sound (default true) */
  playSoundEffect?: boolean;
}

export interface LightningEffectRef {
  trigger: (options?: LightningOptions) => void;
}

interface LightningContextType {
  triggerLightning: (options?: LightningOptions) => void;
}

const LightningContext = createContext<LightningContextType>({
  triggerLightning: () => {},
});

export const useLightning = () => useContext(LightningContext);

/**
 * Generates an organic zig-zag lightning bolt path with branching forks.
 */
function generateLightningBolt(startX: number, startY: number, endX: number, endY: number): string {
  let path = `M ${startX} ${startY}`;
  const segments = 6;
  const dx = (endX - startX) / segments;
  const dy = (endY - startY) / segments;

  for (let i = 1; i <= segments; i++) {
    const jitterX = (Math.random() - 0.5) * 45;
    const jitterY = (Math.random() - 0.5) * 20;
    const targetX = startX + dx * i + (i < segments ? jitterX : 0);
    const targetY = startY + dy * i + (i < segments ? jitterY : 0);

    path += ` L ${targetX.toFixed(1)} ${targetY.toFixed(1)}`;
  }

  // Branch off a small fork at mid-bolt
  const midX = startX + dx * 3;
  const midY = startY + dy * 3;
  path += ` M ${midX.toFixed(1)} ${midY.toFixed(1)} L ${(midX + 30).toFixed(1)} ${(midY + 40).toFixed(1)} L ${(midX + 50).toFixed(1)} ${(midY + 70).toFixed(1)}`;

  return path;
}

export const LightningOverlay = forwardRef<LightningEffectRef, { onTrigger?: () => void }>(
  (props, ref) => {
    const flashOpacity = useSharedValue(0);
    const boltOpacity = useSharedValue(0);
    const particlesOpacity = useSharedValue(0);

    const [boltPath1, setBoltPath1] = useState('');
    const [boltPath2, setBoltPath2] = useState('');
    const [active, setActive] = useState(false);

    const trigger = useCallback(
      async (options: LightningOptions = {}) => {
        const {
          intensity = 'medium',
          x = SCREEN_WIDTH * (0.4 + Math.random() * 0.4),
          y = 0,
          playSoundEffect = true,
        } = options;

        const isReduced = await AccessibilityInfo.isReduceMotionEnabled();

        // Audio & Haptic orchestration
        if (playSoundEffect) {
          if (intensity === 'epic') {
            playSound('thunderMilestone');
            triggerHaptic('heavy');
          } else {
            playSound('electricCrackle');
            triggerHaptic(intensity === 'light' ? 'light' : 'medium');
          }
        }

        // Generate procedural branching paths
        const bolt1 = generateLightningBolt(x, y, x - 30 + Math.random() * 60, SCREEN_HEIGHT * 0.65);
        const bolt2 = intensity === 'epic'
          ? generateLightningBolt(x + 40, y + 20, x + 80, SCREEN_HEIGHT * 0.8)
          : '';

        setBoltPath1(bolt1);
        setBoltPath2(bolt2);
        setActive(true);

        if (isReduced) {
          // Soft minimal fade for reduced motion
          flashOpacity.value = withSequence(
            withTiming(0.15, { duration: 80 }),
            withTiming(0, { duration: 180 }, () => {
              runOnJS(setActive)(false);
            })
          );
          return;
        }

        const maxFlash = intensity === 'epic' ? 0.38 : intensity === 'light' ? 0.16 : 0.26;

        // Double flash effect mimicking real lightning discharge
        flashOpacity.value = withSequence(
          withTiming(maxFlash, { duration: 60 }),
          withTiming(0.08, { duration: 50 }),
          withTiming(maxFlash * 0.9, { duration: 70 }),
          withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }, () => {
            runOnJS(setActive)(false);
          })
        );

        // Razor-sharp bolt discharge
        boltOpacity.value = withSequence(
          withTiming(1, { duration: 50 }),
          withTiming(0.4, { duration: 40 }),
          withTiming(1, { duration: 60 }),
          withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) })
        );

        // Electric particles dispersion
        particlesOpacity.value = withSequence(
          withTiming(1, { duration: 70 }),
          withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) })
        );
      },
      [boltOpacity, flashOpacity, particlesOpacity]
    );

    useImperativeHandle(ref, () => ({ trigger }), [trigger]);

    const animatedFlashStyle = useAnimatedStyle(() => ({
      opacity: flashOpacity.value,
    }));

    const animatedBoltStyle = useAnimatedStyle(() => ({
      opacity: boltOpacity.value,
    }));

    const animatedParticlesStyle = useAnimatedStyle(() => ({
      opacity: particlesOpacity.value,
    }));

    if (!active) return null;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Full-screen ambient atmospheric blue reflection */}
        <Animated.View style={[styles.flashScreen, animatedFlashStyle]} />

        {/* Branching Electric Lightning Bolts */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedBoltStyle]}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`} fill="none">
            <Defs>
              <RadialGradient id="electricCore" cx="50%" cy="40%" r="60%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <Stop offset="30%" stopColor="#38BDF8" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Faint Outer Electric Aura */}
            {boltPath1 ? (
              <Path
                d={boltPath1}
                stroke="#0EA5E9"
                strokeWidth={7}
                strokeOpacity={0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Secondary Branch if epic */}
            {boltPath2 ? (
              <Path
                d={boltPath2}
                stroke="#38BDF8"
                strokeWidth={5}
                strokeOpacity={0.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Core Razor-White Filament */}
            {boltPath1 ? (
              <Path
                d={boltPath1}
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {boltPath2 ? (
              <Path
                d={boltPath2}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </Animated.View>

        {/* Subtle Dispersing Electric Sparks */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedParticlesStyle]}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`} fill="none">
            <Circle cx={SCREEN_WIDTH * 0.45} cy={SCREEN_HEIGHT * 0.3} r={2.5} fill="#38BDF8" />
            <Circle cx={SCREEN_WIDTH * 0.52} cy={SCREEN_HEIGHT * 0.35} r={1.8} fill="#FFFFFF" />
            <Circle cx={SCREEN_WIDTH * 0.38} cy={SCREEN_HEIGHT * 0.42} r={2.2} fill="#0EA5E9" />
            <Circle cx={SCREEN_WIDTH * 0.58} cy={SCREEN_HEIGHT * 0.48} r={1.5} fill="#FFFFFF" />
            <Circle cx={SCREEN_WIDTH * 0.48} cy={SCREEN_HEIGHT * 0.55} r={2} fill="#38BDF8" />
          </Svg>
        </Animated.View>
      </View>
    );
  }
);

LightningOverlay.displayName = 'LightningOverlay';

/**
 * Global Lightning Provider:
 * Mounts the lightning layer once at application root and provides the `useLightning()` hook.
 */
export const LightningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const overlayRef = useRef<LightningEffectRef>(null);

  const triggerLightning = useCallback((options?: LightningOptions) => {
    overlayRef.current?.trigger(options);
  }, []);

  return (
    <LightningContext.Provider value={{ triggerLightning }}>
      {children}
      <LightningOverlay ref={overlayRef} />
    </LightningContext.Provider>
  );
};

const styles = StyleSheet.create({
  flashScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
    zIndex: 9998,
  },
});

