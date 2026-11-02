import { SpideyColors } from '@/constants/theme';
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
 * Dynamic Spider-Man web burst overlay that radiates outward when a task or routine item is checked.
 */
export const WebCompletionAnimation: React.FC<WebCompletionAnimationProps> = ({
  onAnimationEnd,
  size = 54,
}) => {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1.35, {
      duration: 320,
      easing: Easing.out(Easing.back(1.4)),
    });

    opacity.value = withTiming(0, {
      duration: 340,
      easing: Easing.out(Easing.quad),
    }, () => {
      if (onAnimationEnd) {
        runOnJS(onAnimationEnd)();
      }
    });
  }, [onAnimationEnd, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
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
        {/* Radial Web Spokes */}
        <G stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.85">
          <Path d={`M ${half} ${half} L 4 4`} />
          <Path d={`M ${half} ${half} L ${size - 4} 4`} />
          <Path d={`M ${half} ${half} L 4 ${size - 4}`} />
          <Path d={`M ${half} ${half} L ${size - 4} ${size - 4}`} />
          <Path d={`M ${half} ${half} L ${half} 2`} />
          <Path d={`M ${half} ${half} L ${half} ${size - 2}`} />
          <Path d={`M ${half} ${half} L 2 ${half}`} />
          <Path d={`M ${half} ${half} L ${size - 2} ${half}`} />
        </G>

        {/* Concentric Polygonal Web Arcs */}
        <G stroke={SpideyColors.spideyRed} strokeWidth="1" strokeOpacity="0.9">
          <Circle cx={half} cy={half} r={half * 0.45} stroke="#FFFFFF" strokeWidth="0.8" />
          <Circle cx={half} cy={half} r={half * 0.8} />
        </G>
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

