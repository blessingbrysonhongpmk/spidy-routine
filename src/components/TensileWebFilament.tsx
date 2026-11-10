import { useTheme } from '@/hooks/use-theme';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface TensileWebFilamentProps {
  onComplete?: () => void;
  size?: number;
}

/**
 * TensileWebFilament:
 * Signature Spider-Man interactive web strike.
 * When a task or activity is marked complete, a tensile web thread emerges from the interaction point,
 * connects elastically to anchor points, stretches under tensile tension, twangs, and snaps away cleanly.
 */
export const TensileWebFilament: React.FC<TensileWebFilamentProps> = ({
  onComplete,
  size = 72,
}) => {
  const colors = useTheme();

  const webStretch = useSharedValue(0.1);
  const webOpacity = useSharedValue(1);
  const webSag = useSharedValue(12);

  useEffect(() => {
    // 1. Rapid tensile web-shoot stretch
    webStretch.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });

    // 2. Elastic tensile snap and vibration
    webSag.value = withSequence(
      withTiming(-8, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(4, { duration: 70, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 60, easing: Easing.linear })
    );

    // 3. Fast dissipation
    webOpacity.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) }, () => {
        if (onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, [onComplete, webOpacity, webSag, webStretch]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: webOpacity.value,
    transform: [{ scale: webStretch.value }],
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
        {/* Tensile Web Strands Connecting to 4 Cardinal Anchors */}
        <Line x1={half} y1={half} x2={half} y2={4} stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
        <Line x1={half} y1={half} x2={size - 4} y2={half} stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
        <Line x1={half} y1={half} x2={half} y2={size - 4} stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
        <Line x1={half} y1={half} x2={4} y2={half} stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />

        {/* Diagonal Elastic Anchor Strands */}
        <Line x1={half} y1={half} x2={10} y2={10} stroke={colors.primary} strokeWidth="1.2" strokeOpacity="0.85" />
        <Line x1={half} y1={half} x2={size - 10} y2={10} stroke={colors.primary} strokeWidth="1.2" strokeOpacity="0.85" />
        <Line x1={half} y1={half} x2={size - 10} y2={size - 10} stroke={colors.primary} strokeWidth="1.2" strokeOpacity="0.85" />
        <Line x1={half} y1={half} x2={10} y2={size - 10} stroke={colors.primary} strokeWidth="1.2" strokeOpacity="0.85" />

        {/* Dynamic Curved Tensile Web Filament Bridge */}
        <Path
          d={`M 14 ${half} Q ${half} ${half + 8} ${size - 14} ${half}`}
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeOpacity="0.95"
          fill="none"
        />
        <Path
          d={`M ${half} 14 Q ${half + 8} ${half} ${half} ${size - 14}`}
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeOpacity="0.95"
          fill="none"
        />

        {/* Core Attachment Nodes */}
        <Circle cx={half} cy={half} r={3.5} fill="#FFFFFF" />
        <Circle cx={half} cy={half} r={6} stroke={colors.primary} strokeWidth="1.2" strokeOpacity="0.8" />
        <Circle cx={half} cy={4} r={2} fill={colors.primary} />
        <Circle cx={size - 4} cy={half} r={2} fill={colors.primary} />
        <Circle cx={half} cy={size - 4} r={2} fill={colors.primary} />
        <Circle cx={4} cy={half} r={2} fill={colors.primary} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 9999,
  },
});

