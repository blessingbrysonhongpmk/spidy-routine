import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLightning } from './LightningEffect';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface AnimatedProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showIcon?: boolean;
  label?: string;
  triggerLightningOnIncrease?: boolean;
}

/**
 * AnimatedProgress:
 * Superhero mission telemetry ring.
 * Features dual Spidey-crimson & Thor-blue gradient, subtle web spokes, and contextual lightning flashes.
 */
export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  percentage,
  size = 72,
  strokeWidth = 6,
  showIcon = true,
  label,
  triggerLightningOnIncrease = true,
}) => {
  const colors = useTheme();
  const { triggerLightning } = useLightning();
  const prevPercentageRef = useRef(percentage);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.min(100, Math.max(0, percentage));
    progress.value = withTiming(clamped / 100, {
      duration: 650,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    // If progress increased significantly or hit 100%, trigger lightning
    if (triggerLightningOnIncrease && clamped > prevPercentageRef.current) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );

      if (clamped >= 100) {
        triggerLightning({ intensity: 'epic' });
      } else if (clamped - prevPercentageRef.current >= 20) {
        triggerLightning({ intensity: 'light' });
      }
    }

    prevPercentageRef.current = clamped;
  }, [percentage, progress, glowOpacity, triggerLightning, triggerLightningOnIncrease]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return { strokeDashoffset };
  });

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="heroProgressGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="75%" stopColor={colors.secondary} />
            <Stop offset="100%" stopColor="#38BDF8" />
          </LinearGradient>
        </Defs>

        {/* Hairline Web Accent Spokes */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.borderSubtle}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Progress Arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#heroProgressGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Electric Flash Halo on Progress Jump */}
      <Animated.View
        style={[
          styles.glowHalo,
          { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 },
          animatedGlowStyle,
        ]}
        pointerEvents="none"
      />

      {/* Center Percentage Display */}
      <View style={styles.centerContent}>
        <Text
          style={[
            styles.percentageText,
            { color: colors.text },
            size >= 95 && styles.largePercentageText,
          ]}
        >
          {percentage}%
        </Text>
        {label ? <Text style={[styles.labelText, { color: colors.textMuted }]}>{label}</Text> : null}
        {showIcon && (
          <Ionicons
            name="flash"
            size={size >= 95 ? 12 : 9}
            color={colors.accent}
            style={styles.boltIcon}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowHalo: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  largePercentageText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  boltIcon: {
    marginTop: 2,
  },
});
