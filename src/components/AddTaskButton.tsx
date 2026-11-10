import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { WebButtonInteraction } from './WebButtonInteraction';

interface AddTaskButtonProps {
  onPress: () => void;
}

/**
 * AddTaskButton:
 * Signature superhero pill action button.
 * Features hairline web patterns, energetic drop glow, and web-pull physics.
 */
export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onPress }) => {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <WebButtonInteraction
        onPress={onPress}
        variant="primary"
        haptic="medium"
        sound="webShoot"
        accessibilityLabel="Add Task"
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        {/* Subtle Internal Web Pattern Texture */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%" fill="none">
            <Path
              d="M0 27 Q 60 5 120 27 T 240 27"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              strokeOpacity="0.18"
            />
            <Path
              d="M30 0 L80 54"
              stroke="#FFFFFF"
              strokeWidth="0.6"
              strokeOpacity="0.14"
            />
            <Path
              d="M260 0 L210 54"
              stroke="#FFFFFF"
              strokeWidth="0.6"
              strokeOpacity="0.14"
            />
          </Svg>
        </View>

        <Ionicons name="add" size={22} color="#FFFFFF" style={styles.plusIcon} />
        <Text style={styles.buttonText}>Add Task</Text>
      </WebButtonInteraction>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  button: {
    height: 52,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  plusIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
