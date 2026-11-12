import { SpideyColors } from '@/constants/theme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * CircularProgress:
 * Precision-engineered progress ring with clean typography and smooth Reanimated arc.
 * Restrained, high-contrast, and comfortably compact.
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 76,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(100, Math.max(0, percentage)) / 100, {
      duration: 650,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [percentage, progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Refined gradient: Crimson to Thor Electric Blue */}
          <LinearGradient id="premiumProgressGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={SpideyColors.spideyRed} />
            <Stop offset="100%" stopColor={SpideyColors.thorBlue} />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={SpideyColors.borderSubtle}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Progress Arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#premiumProgressGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center Percentage */}
      <View style={styles.centerContent}>
        <Text style={styles.percentageText}>{percentage}%</Text>
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
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    color: SpideyColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
