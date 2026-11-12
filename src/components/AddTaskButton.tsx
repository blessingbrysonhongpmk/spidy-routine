import { Radii, Spacing } from '@/constants/theme';
import { useSound } from '@/context/SoundContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

interface AddTaskButtonProps {
  onPress: () => void;
}

/**
 * AddTaskButton:
 * Redesigned creation bar with balanced proportions,
 * tactile micro-interactions, subtle web-geometry corners,
 * and electric energy accents. Avoids oversized neon-red blocks.
 */
export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onPress }) => {
  const { playSound, triggerHaptic } = useSound();
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    playSound('webShoot');
    triggerHaptic('medium');
    onPress();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        accessibilityLabel="Add new task"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          isHovered && styles.cardHover,
          pressed && styles.cardPressed,
        ]}
      >
        {/* Subtle Web Geometry Corner Filament */}
        <View style={styles.cornerWeb} pointerEvents="none">
          <Svg width="40" height="40" fill="none">
            <Line x1="40" y1="0" x2="0" y2="40" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
            <Path d="M40 20 Q 20 20 20 40" stroke="rgba(239, 68, 68, 0.18)" strokeWidth="0.8" />
          </Svg>
        </View>

        {/* Plus Action Icon Badge */}
        <View style={[styles.iconBox, isHovered && styles.iconBoxHover]}>
          <Ionicons name="add" size={19} color="#38BDF8" />
        </View>

        {/* Action Title & Subtitle */}
        <View style={styles.textBox}>
          <Text style={styles.titleText}>Deploy new task</Text>
          <Text style={styles.subText}>Tap to set schedule, priority & protocol</Text>
        </View>

        {/* Refined Quick Add Pill */}
        <View style={styles.quickPill}>
          <Text style={styles.quickPillText}>+ NEW</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  card: {
    height: 52,
    backgroundColor: '#0F1624',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHover: {
    borderColor: 'rgba(56, 189, 248, 0.55)',
    backgroundColor: '#131B2C',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: '#0B111C',
  },
  cornerWeb: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 40,
    height: 40,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxHover: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    borderColor: '#38BDF8',
  },
  textBox: {
    flex: 1,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  subText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  quickPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  quickPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
});
