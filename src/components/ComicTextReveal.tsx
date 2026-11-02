import React, { useEffect, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ComicTextRevealProps {
  text: string;
  style?: StyleProp<TextStyle>;
  typewriter?: boolean;
  speedMs?: number;
  onComplete?: () => void;
}

/**
 * ComicTextReveal:
 * Comic-inspired dynamic typography animation.
 * Features typewriter character streaming and subtle superhero punch scale.
 */
export const ComicTextReveal: React.FC<ComicTextRevealProps> = ({
  text,
  style,
  typewriter = false,
  speedMs = 40,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState(typewriter ? '' : text);
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSequence(
      withTiming(1.04, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 120, easing: Easing.inOut(Easing.quad) })
    );

    if (typewriter) {
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setDisplayedText(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, speedMs);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(text);
      if (onComplete) onComplete();
    }
  }, [text, typewriter, speedMs, onComplete, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={style}>{displayedText}</Text>
    </Animated.View>
  );
};

