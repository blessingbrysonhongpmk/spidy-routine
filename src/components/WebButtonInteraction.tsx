import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { SpideyColors } from '@/constants/theme';
import { playSound, triggerHaptic, SoundEffectType } from '@/services/sound';

export type WebButtonVariant = 'primary' | 'subtle' | 'tab' | 'compact' | 'icon';

export interface WebButtonInteractionProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  variant?: WebButtonVariant;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
  activeOpacity?: number;
  haptic?: 'light' | 'medium' | 'success' | 'none';
  sound?: SoundEffectType | 'none';
}

/**
 * WebButtonInteraction:
 * Signature Spider-Man interactive component.
 * Features immediate touch response with tensile web shooting & spring pull physics.
 */
export const WebButtonInteraction: React.FC<WebButtonInteractionProps> = ({
  children,
  onPress,
  onLongPress,
  variant = 'primary',
  style,
  containerStyle,
  disabled = false,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityLabel,
  activeOpacity = 0.85,
  haptic = 'light',
  sound = 'buttonTap',
}) => {
  const [isWebShooting, setIsWebShooting] = useState(false);

  // Reanimated physics values
  const buttonScale = useSharedValue(1);
  const webProgress = useSharedValue(0);
  const webOpacity = useSharedValue(0);

  const triggerWebPull = useCallback(() => {
    setIsWebShooting(true);

    // 1. Instant spring dip & pull physics
    const dipScale = variant === 'compact' ? 0.98 : variant === 'primary' ? 0.96 : 0.97;
    buttonScale.value = withSequence(
      withTiming(dipScale, { duration: 60 }),
      withSpring(1, { damping: 14, stiffness: 360 })
    );

    // 2. High-speed tensile web thread shooting & dissolving
    webOpacity.value = withSequence(
      withTiming(0.9, { duration: 40 }),
      withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) }, () => {
        runOnJS(setIsWebShooting)(false);
      })
    );

    webProgress.value = withSequence(
      withTiming(1, { duration: 50, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 140 })
    );
  }, [buttonScale, variant, webOpacity, webProgress]);

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;

    // Trigger audio & haptic feedback immediately
    if (sound !== 'none') {
      playSound(sound);
    }
    if (haptic !== 'none') {
      triggerHaptic(haptic);
    }

    // Trigger visual web pull physics (non-blocking)
    triggerWebPull();

    // Execute requested user action immediately
    if (onPress) {
      onPress(e);
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedWebStyle = useAnimatedStyle(() => ({
    opacity: webOpacity.value,
  }));

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={[style, animatedButtonStyle]}>
          {children}

          {/* Tensile Web Filament Layer */}
          {isWebShooting && (
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.webOverlay, animatedWebStyle]}
              pointerEvents="none"
            >
              <Svg width="100%" height="100%" fill="none">
                {/* Thin web strand shooting in from top-right towards button center */}
                <Line
                  x1="100%"
                  y1="0%"
                  x2="50%"
                  y2="50%"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeOpacity="0.8"
                  strokeLinecap="round"
                />
                <Line
                  x1="100%"
                  y1="0%"
                  x2="50%"
                  y2="50%"
                  stroke={SpideyColors.spideyRed}
                  strokeWidth="2.5"
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                />
                {/* Web cross-filament barb */}
                <Line
                  x1="75%"
                  y1="22%"
                  x2="80%"
                  y2="30%"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                  strokeOpacity="0.7"
                />
              </Svg>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  webOverlay: {
    zIndex: 10,
    overflow: 'visible',
  },
});

