import { SpideyColors } from '@/constants/theme';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SymbioteBackgroundProps {
  /** Optional variant: 'default' | 'dense' | 'minimal' */
  variant?: 'default' | 'dense' | 'minimal';
  /** Show Spidey corner webs (default true) */
  showWebs?: boolean;
  /** Show Thor electric trails (default true) */
  showLightning?: boolean;
  /** Show Venom symbiote flowing tendrils (default true) */
  showSymbiote?: boolean;
}

/**
 * SymbioteBackground:
 * Signature global superhero backdrop uniting Spider-Man, Thor, and Venom.
 * - Spider-Man: Hairline corner web geometry & crimson flare
 * - Thor: Electric-blue corner aura & faint lightning trails
 * - Venom: Deep obsidian base, subtle purple symbiote tendrils & organic curved edges
 * 
 * 100% non-blocking (pointerEvents="none") and optimized for Android performance.
 */
export const SymbioteBackground: React.FC<SymbioteBackgroundProps> = ({
  variant = 'default',
  showWebs = true,
  showLightning = true,
  showSymbiote = true,
}) => {
  // Gentle ambient breathing values for organic symbiote tendrils & Thor aura
  const symbiotePulse = useSharedValue(0.7);
  const thorEnergyPulse = useSharedValue(0.5);

  useEffect(() => {
    // Subtle, low-frequency 6-second breathing cycle
    symbiotePulse.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.65, { duration: 3200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    thorEnergyPulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 2800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [symbiotePulse, thorEnergyPulse]);

  const animatedSymbioteStyle = useAnimatedStyle(() => ({
    opacity: symbiotePulse.value,
  }));

  const animatedThorStyle = useAnimatedStyle(() => ({
    opacity: thorEnergyPulse.value,
  }));

  const isMinimal = variant === 'minimal';

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCREEN_WIDTH} 900`}
        fill="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Spider-Man Crimson Flare (Top-Left) */}
          <RadialGradient id="spideyCornerGlow" cx="0%" cy="0%" r="65%">
            <Stop offset="0%" stopColor="#EF4444" stopOpacity={isMinimal ? 0.08 : 0.22} />
            <Stop offset="50%" stopColor="#DC2626" stopOpacity={isMinimal ? 0.04 : 0.10} />
            <Stop offset="100%" stopColor="#07080A" stopOpacity="0" />
          </RadialGradient>

          {/* Thor Electric Blue Atmospheric Light (Top-Right) */}
          <RadialGradient id="thorCornerGlow" cx="100%" cy="5%" r="70%">
            <Stop offset="0%" stopColor="#0EA5E9" stopOpacity={isMinimal ? 0.09 : 0.24} />
            <Stop offset="45%" stopColor="#38BDF8" stopOpacity={isMinimal ? 0.05 : 0.12} />
            <Stop offset="100%" stopColor="#07080A" stopOpacity="0" />
          </RadialGradient>

          {/* Venom Deep Purple Organic Tendril Ambient (Bottom and Edges) */}
          <RadialGradient id="venomSymbioteGlow" cx="90%" cy="60%" r="65%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity={isMinimal ? 0.06 : 0.16} />
            <Stop offset="50%" stopColor="#5B21B6" stopOpacity={isMinimal ? 0.03 : 0.08} />
            <Stop offset="100%" stopColor="#07080A" stopOpacity="0" />
          </RadialGradient>

          {/* Bottom Left Web Corner Glow */}
          <RadialGradient id="spideyBottomLeftGlow" cx="0%" cy="100%" r="50%">
            <Stop offset="0%" stopColor="#EF4444" stopOpacity={isMinimal ? 0.05 : 0.14} />
            <Stop offset="100%" stopColor="#07080A" stopOpacity="0" />
          </RadialGradient>

          {/* Bottom Obsidian Vignette */}
          <LinearGradient id="venomObsidianDusk" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0B0C0E" stopOpacity="0" />
            <Stop offset="65%" stopColor="#0B0C0E" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#050507" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* 1. Base Dark Surface & Gradients */}
        <Path d={`M0 0 H${SCREEN_WIDTH * 0.75} V380 H0 Z`} fill="url(#spideyCornerGlow)" />
        <Path d={`M${SCREEN_WIDTH * 0.25} 0 H${SCREEN_WIDTH} V420 H${SCREEN_WIDTH * 0.25} Z`} fill="url(#thorCornerGlow)" />
        <Path d={`M${SCREEN_WIDTH * 0.4} 300 H${SCREEN_WIDTH} V900 H${SCREEN_WIDTH * 0.4} Z`} fill="url(#venomSymbioteGlow)" />
        <Path d="M0 600 H250 V900 H0 Z" fill="url(#spideyBottomLeftGlow)" />
        <Path d={`M0 0 H${SCREEN_WIDTH} V900 H0 Z`} fill="url(#venomObsidianDusk)" />

        {/* 2. SPIDER-MAN: Precision Hairline Corner Web Geometry */}
        {showWebs && (
          <G stroke="#EF4444" strokeOpacity={isMinimal ? 0.08 : 0.18} strokeWidth="1">
            {/* Top-Left Web Main Radial Lines */}
            <Path d="M0 0 L210 240" stroke="#FFFFFF" strokeOpacity={0.12} />
            <Path d="M0 0 L270 160" />
            <Path d="M0 0 L310 80" />
            <Path d="M0 0 L120 310" />
            <Path d="M0 0 L50 340" />

            {/* Web Concentric Connectors */}
            <Path d="M35 45 Q 46 36 55 14" stroke="#FFFFFF" strokeOpacity={0.10} />
            <Path d="M70 90 Q 92 72 110 28" />
            <Path d="M110 140 Q 142 110 170 44" stroke="#FFFFFF" strokeOpacity={0.10} />
            <Path d="M150 190 Q 192 148 230 60" />
            <Path d="M190 235 Q 242 185 285 76" stroke="#FFFFFF" strokeOpacity={0.08} />

            {/* Bottom-Left Web Mesh */}
            <Path d="M0 900 L140 760" strokeOpacity={0.12} />
            <Path d="M0 900 L190 820" />
            <Path d="M0 900 L80 730" />
            <Path d="M40 850 Q 55 835 70 860" />
            <Path d="M80 800 Q 110 770 135 815" />
          </G>
        )}

        {/* 3. THOR: Electric Hairline Streaks (Top-Right) */}
        {showLightning && (
          <G>
            {/* Primary Blue Lightning Branch */}
            <Path
              d={`M${SCREEN_WIDTH - 20} 0 L${SCREEN_WIDTH - 65} 55 L${SCREEN_WIDTH - 48} 72 L${SCREEN_WIDTH - 110} 145 L${SCREEN_WIDTH - 92} 162 L${SCREEN_WIDTH - 145} 230`}
              stroke="#38BDF8"
              strokeWidth="1.6"
              strokeOpacity={isMinimal ? 0.15 : 0.35}
            />
            {/* White-Hot Core Streak */}
            <Path
              d={`M${SCREEN_WIDTH - 20} 0 L${SCREEN_WIDTH - 65} 55 L${SCREEN_WIDTH - 48} 72 L${SCREEN_WIDTH - 110} 145`}
              stroke="#E0F2FE"
              strokeWidth="0.8"
              strokeOpacity={isMinimal ? 0.2 : 0.5}
            />
            {/* Fork 1 */}
            <Path
              d={`M${SCREEN_WIDTH - 65} 55 L${SCREEN_WIDTH - 105} 75 L${SCREEN_WIDTH - 120} 110`}
              stroke="#0EA5E9"
              strokeWidth="1.1"
              strokeOpacity={0.25}
            />
            {/* Fork 2 */}
            <Path
              d={`M${SCREEN_WIDTH - 110} 145 L${SCREEN_WIDTH - 150} 160 L${SCREEN_WIDTH - 170} 195`}
              stroke="#0EA5E9"
              strokeWidth="1.0"
              strokeOpacity={0.25}
            />
          </G>
        )}
      </Svg>

      {/* 4. VENOM: Organic Symbiote Tendril Silhouette (Animated Breathing Overlay) */}
      {showSymbiote && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedSymbioteStyle]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox={`0 0 ${SCREEN_WIDTH} 900`} fill="none">
            {/* Smooth organic Bezier curves framing bottom edges (Symbiote tendril silhouette) */}
            <Path
              d={`M0 820 Q 40 760 90 790 T 170 760 Q 230 730 270 820 T ${SCREEN_WIDTH} 850 V 900 H 0 Z`}
              fill="#8B5CF6"
              fillOpacity="0.05"
            />
            {/* Fine organic flowing hair-tendrils along the right screen margin */}
            <Path
              d={`M${SCREEN_WIDTH} 250 Q ${SCREEN_WIDTH - 40} 300 ${SCREEN_WIDTH - 20} 360 T ${SCREEN_WIDTH - 35} 430 T ${SCREEN_WIDTH} 490`}
              stroke="#A855F7"
              strokeWidth="1.2"
              strokeOpacity="0.12"
              fill="none"
            />
            <Path
              d={`M${SCREEN_WIDTH} 520 Q ${SCREEN_WIDTH - 50} 580 ${SCREEN_WIDTH - 25} 640 T ${SCREEN_WIDTH - 45} 720 T ${SCREEN_WIDTH} 790`}
              stroke="#C084FC"
              strokeWidth="1.0"
              strokeOpacity="0.10"
              fill="none"
            />
            {/* Left subtle tendril */}
            <Path
              d="M0 650 Q 30 685 15 725 T 40 775 T 0 815"
              stroke="#8B5CF6"
              strokeWidth="1.0"
              strokeOpacity="0.10"
              fill="none"
            />
          </Svg>
        </Animated.View>
      )}

      {/* 5. THOR: Ambient Energy Pulse Layer */}
      {showLightning && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedThorStyle]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox={`0 0 ${SCREEN_WIDTH} 900`} fill="none">
            <Path
              d={`M${SCREEN_WIDTH - 70} 0 Q ${SCREEN_WIDTH - 40} 80 ${SCREEN_WIDTH - 90} 140`}
              stroke="#38BDF8"
              strokeWidth="0.5"
              strokeOpacity="0.08"
              fill="none"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SpideyColors.background,
    zIndex: -1,
  },
});

