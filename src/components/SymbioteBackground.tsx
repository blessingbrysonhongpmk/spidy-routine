import { useThemeContext } from '@/context/ThemeContext';
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

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

  const { width: windowWidth } = useWindowDimensions();
  const SCREEN_WIDTH = Math.max(windowWidth || 380, 320);

  const { isDark, colors, heroTheme } = useThemeContext();
  const isMinimal = variant === 'minimal';
  const bgBase = colors.background;

  // Hero-specific atmospheric intensity tuning
  const isSpideyHero = heroTheme === 'spiderman';
  const isThorHero = heroTheme === 'thor';
  const isVenomHero = heroTheme === 'venom';

  const spideyOpacityMult = isSpideyHero ? 1.35 : isThorHero || isVenomHero ? 0.45 : 1.0;
  const thorOpacityMult = isThorHero ? 1.45 : isSpideyHero || isVenomHero ? 0.45 : 1.0;
  const venomOpacityMult = isVenomHero ? 1.45 : isSpideyHero || isThorHero ? 0.45 : 1.0;

  const spideyColor = isDark ? '#EF4444' : '#DC2626';
  const thorColor = isDark ? '#0EA5E9' : '#0284C7';
  const thorCore = isDark ? '#38BDF8' : '#0284C7';
  const venomColor = isDark ? '#8B5CF6' : '#7C3AED';
  const webStroke = isDark ? '#FFFFFF' : '#64748B';

  return (
    <View style={[styles.container, { backgroundColor: bgBase }]} pointerEvents="none">
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
            <Stop offset="0%" stopColor={spideyColor} stopOpacity={(isDark ? (isMinimal ? 0.08 : 0.22) : 0.10) * spideyOpacityMult} />
            <Stop offset="50%" stopColor={spideyColor} stopOpacity={(isDark ? (isMinimal ? 0.04 : 0.10) : 0.04) * spideyOpacityMult} />
            <Stop offset="100%" stopColor={bgBase} stopOpacity="0" />
          </RadialGradient>

          {/* Thor Electric Blue Atmospheric Light (Top-Right) */}
          <RadialGradient id="thorCornerGlow" cx="100%" cy="5%" r="70%">
            <Stop offset="0%" stopColor={thorColor} stopOpacity={(isDark ? (isMinimal ? 0.09 : 0.24) : 0.12) * thorOpacityMult} />
            <Stop offset="45%" stopColor={thorCore} stopOpacity={(isDark ? (isMinimal ? 0.05 : 0.12) : 0.05) * thorOpacityMult} />
            <Stop offset="100%" stopColor={bgBase} stopOpacity="0" />
          </RadialGradient>

          {/* Venom Deep Purple Organic Tendril Ambient (Bottom and Edges) */}
          <RadialGradient id="venomSymbioteGlow" cx="90%" cy="60%" r="65%">
            <Stop offset="0%" stopColor={venomColor} stopOpacity={(isDark ? (isMinimal ? 0.06 : 0.16) : 0.08) * venomOpacityMult} />
            <Stop offset="50%" stopColor={venomColor} stopOpacity={(isDark ? (isMinimal ? 0.03 : 0.08) : 0.03) * venomOpacityMult} />
            <Stop offset="100%" stopColor={bgBase} stopOpacity="0" />
          </RadialGradient>

          {/* Bottom Left Web Corner Glow */}
          <RadialGradient id="spideyBottomLeftGlow" cx="0%" cy="100%" r="50%">
            <Stop offset="0%" stopColor={spideyColor} stopOpacity={(isDark ? (isMinimal ? 0.05 : 0.14) : 0.06) * spideyOpacityMult} />
            <Stop offset="100%" stopColor={bgBase} stopOpacity="0" />
          </RadialGradient>

          {/* Bottom Obsidian Vignette */}
          <LinearGradient id="venomObsidianDusk" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={bgBase} stopOpacity="0" />
            <Stop offset="65%" stopColor={bgBase} stopOpacity={isDark ? 0.3 : 0.2} />
            <Stop offset="100%" stopColor={bgBase} stopOpacity={isDark ? 0.95 : 0.85} />
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
          <G
            stroke={spideyColor}
            strokeOpacity={((isDark ? (isMinimal ? 0.08 : 0.18) : 0.12) * (isSpideyHero ? 1.25 : 0.6))}
            strokeWidth={isSpideyHero ? '1.2' : '1'}
          >
            {/* Top-Left Web Main Radial Lines */}
            <Path d="M0 0 L210 240" stroke={webStroke} strokeOpacity={isDark ? 0.12 : 0.18} />
            <Path d="M0 0 L270 160" />
            <Path d="M0 0 L310 80" />
            <Path d="M0 0 L120 310" />
            <Path d="M0 0 L50 340" />

            {/* Web Concentric Connectors */}
            <Path d="M35 45 Q 46 36 55 14" stroke={webStroke} strokeOpacity={isDark ? 0.10 : 0.15} />
            <Path d="M70 90 Q 92 72 110 28" />
            <Path d="M110 140 Q 142 110 170 44" stroke={webStroke} strokeOpacity={isDark ? 0.10 : 0.15} />
            <Path d="M150 190 Q 192 148 230 60" />
            <Path d="M190 235 Q 242 185 285 76" stroke={webStroke} strokeOpacity={isDark ? 0.08 : 0.12} />

            {/* Bottom-Left Web Mesh */}
            <Path d="M0 900 L140 760" strokeOpacity={0.12} />
            <Path d="M0 900 L190 820" />
            <Path d="M0 900 L80 730" />
            <Path d="M40 850 Q 55 835 70 860" />
            <Path d="M80 800 Q 110 770 135 815" />
          </G>
        )}

        {/* 3. THOR: Mjolnir Lightning Hammer & Electric Arcs (Top-Right) */}
        {showLightning && (
          <G>
            {/* Ambient Mjolnir Power Glow */}
            <RadialGradient id="mjolnirCoreGlow" cx={`${SCREEN_WIDTH - 65}`} cy="48" r="75" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity={isDark ? 0.35 : 0.20} />
              <Stop offset="50%" stopColor="#0EA5E9" stopOpacity={isDark ? 0.12 : 0.08} />
              <Stop offset="100%" stopColor={bgBase} stopOpacity="0" />
            </RadialGradient>
            <Circle cx={SCREEN_WIDTH - 65} cy={48} r={70} fill="url(#mjolnirCoreGlow)" />

            {/* Mjolnir Hammer Silhouette */}
            <G transform={`translate(${SCREEN_WIDTH - 85}, 20) rotate(22 25 30)`}>
              {/* Hammer Head (Beveled Nordic Stone / Uru Metal) */}
              <Path
                d="M5 16 L12 8 L40 8 L47 16 L47 38 L40 46 L12 46 L5 38 Z"
                fill={isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(226, 232, 240, 0.9)'}
                stroke={thorCore}
                strokeWidth="1.6"
                strokeOpacity={isDark ? 0.8 : 0.6}
              />
              {/* Inner Rune / Triquetra Lightning Glyph */}
              <Path
                d="M26 14 L20 28 L32 28 L23 41"
                stroke={isDark ? '#E0F2FE' : '#0284C7'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Hammer Handle (Leather wrapped grip) */}
              <Path
                d="M24 46 L24 78"
                stroke={isDark ? '#94A3B8' : '#64748B'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Handle Grip Rings */}
              <Path d="M21 54 H27 M21 60 H27 M21 66 H27 M21 72 H27" stroke={thorColor} strokeWidth="1" />
              {/* Pommel Cap & Loop */}
              <Circle cx="24" cy="80" r="2.5" fill={thorCore} />
              <Path d="M24 82 Q 20 89 25 93 Q 29 89 25 83" stroke={thorColor} strokeWidth="1.2" fill="none" />
            </G>

            {/* Lightning Arcs Discharging From Hammer */}
            <Path
              d={`M${SCREEN_WIDTH - 65} 48 L${SCREEN_WIDTH - 95} 85 L${SCREEN_WIDTH - 78} 102 L${SCREEN_WIDTH - 135} 175 L${SCREEN_WIDTH - 115} 195 L${SCREEN_WIDTH - 165} 265`}
              stroke={thorCore}
              strokeWidth="2.2"
              strokeOpacity={isDark ? (isMinimal ? 0.25 : 0.65) : 0.45}
            />
            {/* White-Hot Core Streak */}
            <Path
              d={`M${SCREEN_WIDTH - 65} 48 L${SCREEN_WIDTH - 95} 85 L${SCREEN_WIDTH - 78} 102 L${SCREEN_WIDTH - 135} 175`}
              stroke={isDark ? '#FFFFFF' : '#BAE6FD'}
              strokeWidth="1.1"
              strokeOpacity={isDark ? 0.85 : 0.6}
            />
            {/* Thunder Sparks */}
            <Circle cx={SCREEN_WIDTH - 95} cy={85} r="2.5" fill="#FFFFFF" />
            <Circle cx={SCREEN_WIDTH - 135} cy={175} r="3" fill="#38BDF8" />
            <Circle cx={SCREEN_WIDTH - 165} cy={265} r="2" fill="#38BDF8" />

            {/* Branch 1 */}
            <Path
              d={`M${SCREEN_WIDTH - 95} 85 L${SCREEN_WIDTH - 145} 108 L${SCREEN_WIDTH - 160} 145`}
              stroke={thorColor}
              strokeWidth="1.2"
              strokeOpacity={isDark ? 0.45 : 0.3}
            />
            {/* Branch 2 */}
            <Path
              d={`M${SCREEN_WIDTH - 135} 175 L${SCREEN_WIDTH - 180} 190 L${SCREEN_WIDTH - 200} 230`}
              stroke={thorColor}
              strokeWidth="1.1"
              strokeOpacity={isDark ? 0.4 : 0.25}
            />
          </G>
        )}
      </Svg>

      {/* 4. VENOM: Freaky Alien Symbiote Web & Living Organic Tendrils */}
      {showSymbiote && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedSymbioteStyle]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox={`0 0 ${SCREEN_WIDTH} 900`} fill="none">
            {/* Deep Obsidian Symbiote Edge Silhouette */}
            <Path
              d={`M${SCREEN_WIDTH} 120 Q ${SCREEN_WIDTH - 30} 180 ${SCREEN_WIDTH - 18} 240 T ${SCREEN_WIDTH - 24} 340 T ${SCREEN_WIDTH} 420 Z`}
              fill={isDark ? '#140C22' : '#E2E8F0'}
              opacity={isDark ? (isMinimal ? 0.35 : 0.70) : 0.35}
            />
            <Path
              d={`M0 450 Q 30 520 15 590 T 25 700 T 0 780 Z`}
              fill={isDark ? '#140C22' : '#E2E8F0'}
              opacity={isDark ? (isMinimal ? 0.30 : 0.65) : 0.30}
            />

            {/* FREAKY SYMBIOTE WEB: Organic Alien Silk Network with Droplet Nodes */}
            <G stroke="#A855F7" strokeWidth="1.2" strokeOpacity={isDark ? 0.32 : 0.20}>
              {/* Organic webbing strands linking screen edges */}
              <Path d={`M${SCREEN_WIDTH} 210 Q ${SCREEN_WIDTH - 55} 250 ${SCREEN_WIDTH - 30} 310 Q ${SCREEN_WIDTH - 80} 370 ${SCREEN_WIDTH} 420`} />
              <Path d={`M${SCREEN_WIDTH} 280 Q ${SCREEN_WIDTH - 90} 330 ${SCREEN_WIDTH - 45} 400`} stroke="#C084FC" strokeWidth="0.8" />
              <Path d={`M${SCREEN_WIDTH} 350 Q ${SCREEN_WIDTH - 65} 410 ${SCREEN_WIDTH - 20} 480`} />

              {/* Connecting freaky web cross-filaments */}
              <Path d={`M${SCREEN_WIDTH - 45} 265 Q ${SCREEN_WIDTH - 70} 300 ${SCREEN_WIDTH - 38} 345`} strokeOpacity={0.25} />
              <Path d={`M${SCREEN_WIDTH - 30} 310 Q ${SCREEN_WIDTH - 55} 360 ${SCREEN_WIDTH - 48} 415`} strokeOpacity={0.25} />

              {/* Alien Symbiote Fluid Nodes (Liquid Droplets clinging to webbing) */}
              <Circle cx={SCREEN_WIDTH - 55} cy={250} r="3.5" fill="#A855F7" fillOpacity={isDark ? 0.7 : 0.4} />
              <Circle cx={SCREEN_WIDTH - 30} cy={310} r="4.5" fill="#C084FC" fillOpacity={isDark ? 0.8 : 0.5} />
              <Circle cx={SCREEN_WIDTH - 80} cy={370} r="3.2" fill="#8B5CF6" fillOpacity={isDark ? 0.6 : 0.3} />
              <Circle cx={SCREEN_WIDTH - 45} cy={400} r="4" fill="#A855F7" fillOpacity={isDark ? 0.75 : 0.45} />

              {/* Dripping Symbiote Micro-Tendrils */}
              <Path d={`M${SCREEN_WIDTH - 55} 250 Q ${SCREEN_WIDTH - 58} 268 ${SCREEN_WIDTH - 56} 275`} stroke="#C084FC" strokeWidth="1.5" />
              <Path d={`M${SCREEN_WIDTH - 30} 310 Q ${SCREEN_WIDTH - 33} 335 ${SCREEN_WIDTH - 31} 345`} stroke="#C084FC" strokeWidth="1.8" />
              <Circle cx={SCREEN_WIDTH - 31} cy={346} r="2.2" fill="#E879F9" />

              {/* Left Screen Margin: Freaky Tendril Web */}
              <Path d="M0 510 Q 48 545 28 600 T 52 660 T 0 710" />
              <Path d="M0 570 Q 65 615 22 675" stroke="#C084FC" strokeWidth="0.8" />
              <Circle cx="48" cy="545" r="3" fill="#A855F7" fillOpacity={0.7} />
              <Circle cx="28" cy="600" r="4" fill="#C084FC" fillOpacity={0.8} />
              <Circle cx="52" cy="660" r="3.5" fill="#8B5CF6" fillOpacity={0.7} />
              <Path d="M28 600 Q 25 625 27 635" stroke="#C084FC" strokeWidth="1.5" />
              <Circle cx="27" cy="636" r="2" fill="#E879F9" />
            </G>

            {/* Bottom Symbiote Wave Silhouette */}
            <Path
              d={`M0 820 Q 40 760 90 790 T 170 760 Q 230 730 270 820 T ${SCREEN_WIDTH} 850 V 900 H 0 Z`}
              fill={isDark ? '#8B5CF6' : '#7C3AED'}
              fillOpacity={isDark ? 0.08 : 0.04}
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
    zIndex: -1,
  },
});

