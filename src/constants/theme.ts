/**
 * SPIDEY FLOW — DESIGN TOKENS SYSTEM
 * Premium, mature superhero-inspired palette blending Spider-Man, Thor, and Venom.
 */

export const SpideyColors = {
  // Deep Venom Charcoal & Obsidian Foundations
  background: '#0B0C0E',         // Near-black warm charcoal canvas
  surface: '#13151A',            // Primary card / list surface
  surfaceHover: '#1A1D24',       // Interactive surface hover/press
  surfaceElevated: '#1F232D',    // Modals, popovers, elevated sheets
  inputBackground: '#0F1116',    // Text input & embedded fields

  // Subtle Structural Borders & Separators
  borderSubtle: '#1C1F28',       // Hairline dividers and quiet boundaries
  borderMuted: '#262B37',        // Normal card borders
  borderFocus: '#384152',        // Focused or active borders

  // Typography
  textPrimary: '#F8FAFC',        // Clean readable white
  textSecondary: '#94A3B8',      // Balanced slate grey for metadata
  textMuted: '#64748B',          // Quiet labels, timestamps
  textDisabled: '#475569',       // Inactive states

  // Spider-Man Accent: Sophisticated Refined Crimson (not garish neon)
  spideyRed: '#EF4444',          // Primary action & energy
  spideyRedHover: '#DC2626',
  spideyRedSubtle: 'rgba(239, 68, 68, 0.12)', // Tinted background
  spideyRedBorder: 'rgba(239, 68, 68, 0.35)',

  // Thor Accent: Tactical Electric Blue & Restrained Gold
  thorBlue: '#0EA5E9',           // Electric blue for focus & upcoming activity
  thorBlueSubtle: 'rgba(14, 165, 233, 0.12)',
  thorBlueBorder: 'rgba(14, 165, 233, 0.35)',
  thorGold: '#F59E0B',           // Metallic gold for milestones
  thorGoldSubtle: 'rgba(245, 158, 11, 0.12)',

  // Venom Accent: Deep Twilight Purple
  venomPurple: '#8B5CF6',        // Subtle purple for evening/night routines
  venomPurpleSubtle: 'rgba(139, 92, 246, 0.12)',
  venomPurpleBorder: 'rgba(139, 92, 246, 0.35)',

  // Status Colors
  success: '#10B981',            // Restrained emerald for completed tasks
  successSubtle: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  danger: '#EF4444',
  divider: '#181A22',
};

export const Colors = {
  dark: {
    background: SpideyColors.background,
    surface: SpideyColors.surface,
    surfaceHover: SpideyColors.surfaceHover,
    surfaceElevated: SpideyColors.surfaceElevated,
    border: SpideyColors.borderSubtle,
    borderMuted: SpideyColors.borderMuted,
    text: SpideyColors.textPrimary,
    textSecondary: SpideyColors.textSecondary,
    textMuted: SpideyColors.textMuted,
    primary: SpideyColors.spideyRed,
    secondary: SpideyColors.thorBlue,
    accent: SpideyColors.thorGold,
    purple: SpideyColors.venomPurple,
    tint: SpideyColors.spideyRed,
    tabIconDefault: '#64748B',
    tabIconSelected: SpideyColors.spideyRed,
    success: SpideyColors.success,
  },
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    surfaceElevated: '#FFFFFF',
    border: '#E2E8F0',
    borderMuted: '#CBD5E1',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    primary: '#DC2626',
    secondary: '#0284C7',
    accent: '#D97706',
    purple: '#7C3AED',
    tint: '#DC2626',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#DC2626',
    success: '#059669',
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const AnimationDurations = {
  instant: 50,
  fast: 120,
  normal: 220,
  relaxed: 350,
  cinematic: 600,
};

export const InteractionStates = {
  pressScale: 0.96,
  tabPressScale: 0.94,
  activeOpacity: 0.85,
  disabledOpacity: 0.45,
};

export type ThemeType = 'dark' | 'light';
