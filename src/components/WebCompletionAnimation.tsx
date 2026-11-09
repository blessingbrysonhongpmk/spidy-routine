import { useTheme } from '@/hooks/use-theme';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

interface WebCompletionAnimationProps {
  onAnimationEnd?: () => void;
  size?: number;
}

/**
 * WebCompletionAnimation:
 * Legendary Superhero Burst overlay radiating Spider-Man webs, Thor lightning sparks,
 * and Venom symbiote energy when an objective or protocol is marked complete.
 */
export const WebCompletionAnimation: React.FC<WebCompletionAnimationProps> = ({
  onAnimationEnd,
  size = 64,
}) => {
  const colors = useTheme();
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1.45, {
      duration: 380,
      easing: Easing.out(Easing.back(1.6)),
    });

    rotation.value = withTiming(45, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });

    opacity.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    }, () => {
      if (onAnimationEnd) {
        runOnJS(onAnimationEnd)();
      }
    });
  }, [onAnimationEnd, opacity, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const half = size / 2;

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size, marginLeft: -half, marginTop: -half },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        {/* 1. Spider-Man Radial Tensile Web Spokes */}
        <G stroke="#FFFFFF" strokeWidth="1.4" strokeOpacity="0.95">
          <Path d={`M ${half} ${half} L 4 4`} />
          <Path d={`M ${half} ${half} L ${size - 4} 4`} />
          <Path d={`M ${half} ${half} L 4 ${size - 4}`} />
          <Path d={`M ${half} ${half} L ${size - 4} ${size - 4}`} />
          <Path d={`M ${half} ${half} L ${half} 2`} />
          <Path d={`M ${half} ${half} L ${half} ${size - 2}`} />
          <Path d={`M ${half} ${half} L 2 ${half}`} />
          <Path d={`M ${half} ${half} L ${size - 2} ${half}`} />
        </G>

        {/* 2. Spider-Man Crimson Polygonal Web Rings */}
        <G stroke={colors.primary} strokeWidth="1.2" strokeOpacity="0.9">
          <Circle cx={half} cy={half} r={half * 0.4} stroke="#FFFFFF" strokeWidth="0.8" />
          <Circle cx={half} cy={half} r={half * 0.75} />
        </G>

        {/* 3. Thor Electric Blue & Gold Lightning Sparks */}
        <G stroke={colors.secondary} strokeWidth="1.8" strokeLinecap="round">
          <Path d={`M ${half + 5} ${half - 5} L ${half + 14} ${half - 12} L ${half + 18} ${half - 22}`} />
          <Path d={`M ${half - 5} ${half + 5} L ${half - 14} ${half + 12} L ${half - 18} ${half + 22}`} />
        </G>
        <Circle cx={half + 18} cy={half - 22} r={2} fill={colors.accent} />
        <Circle cx={half - 18} cy={half + 22} r={2} fill={colors.accent} />

        {/* 4. Venom Symbiote Violet Droplets */}
        <Circle cx={half - 20} cy={half - 16} r={2.5} fill={colors.purple} fillOpacity={0.85} />
        <Circle cx={half + 20} cy={half + 16} r={2.5} fill={colors.purple} fillOpacity={0.85} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 999,
  },
});
