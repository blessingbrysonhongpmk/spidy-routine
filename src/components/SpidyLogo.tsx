import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';

export interface SpidyLogoProps {
  size?: number;
  variant?: 'full' | 'compact' | 'mark' | 'hero';
  style?: ViewStyle;
}

/**
 * SpidyLogo:
 * Completely original, independent software brand identity for SPIDEY FLOW.
 * Combines tensile web geometry with a sharp electric thunder nexus.
 * Modern, recognizable, minimalist and vector-crisp on all backgrounds.
 */
export const SpidyLogo: React.FC<SpidyLogoProps> = ({
  size = 32,
  variant = 'full',
  style,
}) => {
  const markSize = variant === 'hero' ? 64 : variant === 'compact' ? 24 : size;

  // The original geometric crest mark
  const renderMark = () => (
    <Svg width={markSize} height={markSize} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="spidyRedGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#EF4444" />
          <Stop offset="100%" stopColor="#991B1B" />
        </LinearGradient>
        <LinearGradient id="thorBlueGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </LinearGradient>
        <LinearGradient id="coreWhite" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E2E8F0" />
        </LinearGradient>
      </Defs>

      {/* Outer Hexagonal Shield - Web Geometry Facets */}
      {/* Left Red Facet */}
      <Path
        d="M24 3 L7 13 L7 31 L24 45 L24 27 Z"
        fill="url(#spidyRedGrad)"
        fillOpacity="0.88"
      />
      {/* Right Blue Facet */}
      <Path
        d="M24 3 L41 13 L41 31 L24 45 L24 27 Z"
        fill="url(#thorBlueGrad)"
        fillOpacity="0.88"
      />

      {/* Internal Web Geometry Facet Cuts */}
      <Path
        d="M7 13 L24 27 M41 13 L24 27 M7 31 L24 27 M41 31 L24 27"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />

      {/* Core Thunderbolt Energy Glyph (Clean negative space cut with electric fill) */}
      <Polygon
        points="26,8 18,24 24,24 21,38 31,21 24,21"
        fill="url(#coreWhite)"
      />

      {/* Central Nexus Core Node */}
      <Polygon
        points="24,23 26,26 23,26"
        fill="#38BDF8"
      />
    </Svg>
  );

  if (variant === 'mark') {
    return <View style={[styles.markOnly, style]}>{renderMark()}</View>;
  }

  const isHero = variant === 'hero';

  return (
    <View style={[styles.container, isHero && styles.heroContainer, style]}>
      {renderMark()}

      <View style={styles.textContainer}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.brandSpidey, isHero && styles.heroSpidey]}>SPIDEY </Text>
          <Text style={[styles.brandFlow, isHero && styles.heroFlow]}>FLOW</Text>
        </View>
        <Text style={[styles.tagline, isHero && styles.heroTagline]}>
          YOUR DAY. YOUR MISSION.
        </Text>
      </View>
    </View>
  );
};

export interface SpidyAvatarProps {
  size?: number;
  name?: string;
  archetype?: 'spiderman' | 'thor' | 'venom' | 'custom';
  style?: ViewStyle;
}

/**
 * SpidyAvatar:
 * Sophisticated vector-based operative avatar badge.
 * Replaces any personal photos with clean, brand-aligned iconography.
 */
export const SpidyAvatar: React.FC<SpidyAvatarProps> = ({
  size = 40,
  name = 'Agent',
  archetype = 'spiderman',
  style,
}) => {
  const initial = (name.trim().charAt(0) || 'A').toUpperCase();

  const getThemeColors = () => {
    switch (archetype) {
      case 'thor':
        return { border: '#38BDF8', bg: '#081E30', text: '#38BDF8' };
      case 'venom':
        return { border: '#A855F7', bg: '#1C0D30', text: '#C084FC' };
      default:
        return { border: '#EF4444', bg: '#250B12', text: '#F87171' };
    }
  };

  const theme = getThemeColors();

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.border,
          backgroundColor: theme.bg,
        },
        style,
      ]}
    >
      {/* Dual Energy Ring Sheen */}
      <View
        style={[
          styles.avatarGlowRing,
          {
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
            borderColor: archetype === 'thor' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)',
          },
        ]}
      />

      <Text
        style={[
          styles.avatarInitial,
          {
            fontSize: Math.round(size * 0.44),
            color: theme.text,
          },
        ]}
      >
        {initial}
      </Text>

      {/* Operative Online Status Dot */}
      <View
        style={[
          styles.statusDot,
          {
            width: Math.max(6, Math.round(size * 0.2)),
            height: Math.max(6, Math.round(size * 0.2)),
            borderRadius: Math.round(size * 0.1),
            right: 0,
            bottom: 0,
            backgroundColor: '#10B981',
            borderColor: '#0B0F17',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  markOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandSpidey: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  brandFlow: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2,
    marginTop: 2,
  },
  heroSpidey: {
    fontSize: 24,
    letterSpacing: 2.5,
  },
  heroFlow: {
    fontSize: 24,
    letterSpacing: 2.5,
  },
  heroTagline: {
    fontSize: 10.5,
    letterSpacing: 2.8,
    marginTop: 4,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'visible',
  },
  avatarGlowRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  avatarInitial: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});

