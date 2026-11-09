import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useLightning } from './LightningEffect';
import { WebButtonInteraction } from './WebButtonInteraction';

export type HeroArchetype = 'spiderman' | 'thor' | 'venom';

interface HeroPowerBarProps {
  onPowerActivated?: (hero: HeroArchetype) => void;
}

/**
 * HeroPowerBar:
 * Legendary interactive superhero power bar blending Spider-Man, Thor, and Venom.
 * Lets the operative unleash signature abilities with authentic audio, haptic, and visual bursts.
 */
export const HeroPowerBar: React.FC<HeroPowerBarProps> = ({ onPowerActivated }) => {
  const colors = useTheme();
  const { user, updateProfile } = useAuth();
  const { playSound, triggerHaptic } = useSound();
  const { triggerLightning } = useLightning();

  const [activeHero, setActiveHero] = useState<HeroArchetype>(
    (user?.heroArchetype as HeroArchetype) || 'spiderman'
  );
  const [comicToast, setComicToast] = useState<string | null>(null);

  const toastScale = useSharedValue(0.5);
  const toastOpacity = useSharedValue(0);

  const triggerToast = (text: string) => {
    setComicToast(text);
    toastScale.value = withSequence(
      withTiming(1.15, { duration: 160, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 120 })
    );
    toastOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 1200 }),
      withTiming(0, { duration: 300 }, () => {
        // finished
      })
    );
  };

  const handleSelectHero = async (hero: HeroArchetype) => {
    setActiveHero(hero);
    if (user) {
      await updateProfile({ heroArchetype: hero });
    }

    if (hero === 'spiderman') {
      playSound('webShoot');
      triggerHaptic('medium');
      triggerToast('🕸️ THWIP! SPIDER-SENSE ACTIVE');
    } else if (hero === 'thor') {
      playSound('electricCrackle');
      triggerLightning({ intensity: 'epic' });
      triggerHaptic('heavy');
      triggerToast('⚡ MJOLNIR! BY ODIN\'S MIGHT');
    } else if (hero === 'venom') {
      playSound('symbioteWhoosh');
      triggerHaptic('heavy');
      triggerToast('🖤 SYMBIOTE RAGE SURGE');
    }

    if (onPowerActivated) {
      onPowerActivated(hero);
    }
  };

  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ scale: toastScale.value }],
  }));

  const heroes: {
    id: HeroArchetype;
    label: string;
    icon: string;
    color: string;
    subtle: string;
    ability: string;
  }[] = [
    {
      id: 'spiderman',
      label: 'SPIDEY',
      icon: 'radio-outline',
      color: colors.primary,
      subtle: colors.primarySubtle,
      ability: 'Web Agility',
    },
    {
      id: 'thor',
      label: 'THOR',
      icon: 'flash-outline',
      color: colors.secondary,
      subtle: colors.secondarySubtle,
      ability: 'God of Thunder',
    },
    {
      id: 'venom',
      label: 'VENOM',
      icon: 'water-outline',
      color: colors.purple,
      subtle: colors.purpleSubtle,
      ability: 'Symbiote Surge',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Comic Toast Float */}
      {comicToast && (
        <Animated.View
          style={[
            styles.comicToastContainer,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderFocus },
            toastAnimStyle,
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.comicToastText, { color: colors.text }]}>{comicToast}</Text>
        </Animated.View>
      )}

      {/* Header bar */}
      <View style={styles.powerHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={[styles.powerLabel, { color: colors.textMuted }]}>LEGENDARY HERO POWER</Text>
        </View>
        <Text style={[styles.activeAbilityText, { color: colors.textSecondary }]}>
          Tap to Unleash
        </Text>
      </View>

      {/* Hero Segmented Buttons */}
      <View style={[styles.buttonsRow, { backgroundColor: colors.inputBackground, borderColor: colors.borderSubtle }]}>
        {heroes.map((h) => {
          const isSelected = activeHero === h.id;
          return (
            <WebButtonInteraction
              key={h.id}
              style={[
                styles.heroBtn,
                isSelected && {
                  backgroundColor: h.subtle,
                  borderColor: h.color,
                  borderWidth: 1,
                },
              ]}
              onPress={() => handleSelectHero(h.id)}
              variant="subtle"
              sound="buttonTap"
              haptic="medium"
            >
              <View style={styles.btnContent}>
                <Ionicons
                  name={h.icon as any}
                  size={14}
                  color={isSelected ? h.color : colors.textMuted}
                  style={styles.btnIcon}
                />
                <Text
                  style={[
                    styles.heroBtnText,
                    { color: isSelected ? h.color : colors.textMuted },
                    isSelected && styles.heroBtnTextActive,
                  ]}
                >
                  {h.label}
                </Text>
              </View>
            </WebButtonInteraction>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  powerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  powerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeAbilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    borderRadius: Radii.sm,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  heroBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnIcon: {
    marginRight: 2,
  },
  heroBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroBtnTextActive: {
    fontWeight: '800',
  },
  comicToastContainer: {
    position: 'absolute',
    top: -38,
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  comicToastText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

