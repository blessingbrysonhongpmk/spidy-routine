import { useSound } from '@/context/SoundContext';
import { HapticType, SoundEffectType } from '@/services/sound';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export interface SpidyButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'electric' | 'subtle' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  sound?: SoundEffectType | 'none';
  haptic?: HapticType | 'none';
  accessibilityLabel?: string;
}

/**
 * SpidyButton:
 * Premium interactive button designed specifically for SPIDEY FLOW.
 * Avoids generic oversized neon buttons in favor of proportionate,
 * tactile, engineered hardware controls with electric energy accents.
 */
export const SpidyButton: React.FC<SpidyButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  sound = 'buttonTap',
  haptic,
  accessibilityLabel,
}) => {
  const { playSound, triggerHaptic } = useSound();
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    if (disabled || loading) return;
    if (sound !== 'none') {
      playSound(sound);
    }
    if (haptic && haptic !== 'none') {
      triggerHaptic(haptic);
    } else if (haptic !== 'none') {
      triggerHaptic(variant === 'primary' ? 'medium' : 'light');
    }
    onPress();
  };

  const getVariantStyles = (pressed: boolean) => {
    switch (variant) {
      case 'electric':
        return {
          container: [
            styles.electricBase,
            isHovered && styles.electricHover,
            pressed && styles.electricPressed,
          ],
          text: styles.electricText,
          iconColor: '#38BDF8',
        };
      case 'subtle':
        return {
          container: [
            styles.subtleBase,
            isHovered && styles.subtleHover,
            pressed && styles.subtlePressed,
          ],
          text: styles.subtleText,
          iconColor: '#94A3B8',
        };
      case 'ghost':
        return {
          container: [
            styles.ghostBase,
            isHovered && styles.ghostHover,
            pressed && styles.ghostPressed,
          ],
          text: styles.ghostText,
          iconColor: '#94A3B8',
        };
      case 'danger':
        return {
          container: [
            styles.dangerBase,
            isHovered && styles.dangerHover,
            pressed && styles.dangerPressed,
          ],
          text: styles.dangerText,
          iconColor: '#EF4444',
        };
      default: // primary
        return {
          container: [
            styles.primaryBase,
            isHovered && styles.primaryHover,
            pressed && styles.primaryPressed,
          ],
          text: styles.primaryText,
          iconColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: styles.sizeSm,
          text: styles.textSm,
          iconSize: 15,
        };
      case 'lg':
        return {
          container: styles.sizeLg,
          text: styles.textLg,
          iconSize: 19,
        };
      default:
        return {
          container: styles.sizeMd,
          text: styles.textMd,
          iconSize: 17,
        };
    }
  };

  const sz = getSizeStyles();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => {
        const v = getVariantStyles(pressed);
        return [
          styles.base,
          sz.container,
          v.container,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const v = getVariantStyles(pressed);
        return (
          <View style={styles.contentRow}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={v.iconColor}
                style={styles.spinner}
              />
            ) : icon ? (
              <Ionicons
                name={icon}
                size={sz.iconSize}
                color={v.iconColor}
                style={styles.leftIcon}
              />
            ) : null}

            <Text style={[styles.baseText, sz.text, v.text, textStyle]}>
              {title}
            </Text>

            {!loading && rightIcon ? (
              <Ionicons
                name={rightIcon}
                size={sz.iconSize}
                color={v.iconColor}
                style={styles.rightIcon}
              />
            ) : null}
          </View>
        );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  baseText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  spinner: {
    marginRight: 4,
  },
  leftIcon: {
    marginRight: 2,
  },
  rightIcon: {
    marginLeft: 2,
  },

  // Sizes
  sizeSm: {
    height: 32,
    paddingHorizontal: 12,
  },
  sizeMd: {
    height: 42,
    paddingHorizontal: 18,
  },
  sizeLg: {
    height: 48,
    paddingHorizontal: 22,
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 13.5,
  },
  textLg: {
    fontSize: 15,
  },

  // Primary Variant (Controlled Red Accent)
  primaryBase: {
    backgroundColor: '#DC2626',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryHover: {
    backgroundColor: '#EF4444',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  primaryPressed: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 0.98 }],
  },
  primaryText: {
    color: '#FFFFFF',
  },

  // Electric Variant (Thor Cyan/Blue Energy)
  electricBase: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.38)',
  },
  electricHover: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    borderColor: '#38BDF8',
  },
  electricPressed: {
    backgroundColor: 'rgba(56, 189, 248, 0.32)',
    transform: [{ scale: 0.98 }],
  },
  electricText: {
    color: '#38BDF8',
  },

  // Subtle Variant (Obsidian graphite with clean border)
  subtleBase: {
    backgroundColor: '#111827',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  subtleHover: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  subtlePressed: {
    backgroundColor: '#0F172A',
    transform: [{ scale: 0.98 }],
  },
  subtleText: {
    color: '#E2E8F0',
  },

  // Ghost Variant
  ghostBase: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  ghostHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  ghostPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ scale: 0.98 }],
  },
  ghostText: {
    color: '#94A3B8',
  },

  // Danger Variant
  dangerBase: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerHover: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
  },
  dangerPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    transform: [{ scale: 0.98 }],
  },
  dangerText: {
    color: '#EF4444',
  },

  disabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
});
