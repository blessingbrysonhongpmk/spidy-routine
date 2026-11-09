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
    background: '#0B0C0E',         // Near-black warm charcoal canvas
    surface: '#13151A',            // Primary card / list surface
    surfaceHover: '#1A1D24',       // Interactive surface hover/press
    surfaceElevated: '#1F232D',    // Modals, popovers, elevated sheets
    inputBackground: '#0F1116',    // Text input & embedded fields
    border: '#1C1F28',             // Hairline dividers and quiet boundaries
    borderSubtle: '#1C1F28',       // Hairline dividers
    borderMuted: '#262B37',        // Normal card borders
    borderFocus: '#384152',        // Focused or active borders
    text: '#F8FAFC',               // Clean readable white
    textSecondary: '#94A3B8',      // Balanced slate grey for metadata
    textMuted: '#64748B',          // Quiet labels, timestamps
    textDisabled: '#475569',       // Inactive states
    primary: '#EF4444',            // Spider-Man Crimson
    primaryHover: '#DC2626',
    primarySubtle: 'rgba(239, 68, 68, 0.12)',
    primaryBorder: 'rgba(239, 68, 68, 0.35)',
    secondary: '#0EA5E9',          // Thor Tactical Electric Blue
    secondarySubtle: 'rgba(14, 165, 233, 0.12)',
    secondaryBorder: 'rgba(14, 165, 233, 0.35)',
    accent: '#F59E0B',             // Thor Gold for milestones
    accentSubtle: 'rgba(245, 158, 11, 0.12)',
    purple: '#8B5CF6',             // Venom Twilight Purple
    purpleSubtle: 'rgba(139, 92, 246, 0.12)',
    purpleBorder: 'rgba(139, 92, 246, 0.35)',
    tint: '#EF4444',
    tabBarBackground: 'rgba(14, 16, 22, 0.94)',
    tabBarBorder: 'rgba(239, 68, 68, 0.22)',
    tabIconDefault: '#64748B',
    tabIconSelected: '#EF4444',
    success: '#10B981',
    successSubtle: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    danger: '#EF4444',
    divider: '#181A22',
  },
  light: {
    background: '#F6F8FB',         // Crisp clean aerodynamic base
    surface: '#FFFFFF',            // Pure white card
    surfaceHover: '#F1F5F9',       // Subtle hover
    surfaceElevated: '#FFFFFF',    // Pure white sheet
    inputBackground: '#F8FAFC',    // Soft input backdrop
    border: '#E2E8F0',             // Crisp hairline border
    borderSubtle: '#E2E8F0',       // Hairline dividers
    borderMuted: '#CBD5E1',        // Normal card border
    borderFocus: '#94A3B8',        // Active border
    text: '#0F172A',               // Obsidian slate text
    textSecondary: '#475569',      // Tactical secondary slate
    textMuted: '#64748B',          // Muted labels
    textDisabled: '#94A3B8',       // Disabled text
    primary: '#DC2626',            // Spider-Man Bold Crimson
    primaryHover: '#B91C1C',
    primarySubtle: 'rgba(220, 38, 38, 0.08)',
    primaryBorder: 'rgba(220, 38, 38, 0.25)',
    secondary: '#0284C7',          // Thor Electric Cobalt
    secondarySubtle: 'rgba(2, 132, 199, 0.08)',
    secondaryBorder: 'rgba(2, 132, 199, 0.25)',
    accent: '#D97706',             // Thor Warm Gold
    accentSubtle: 'rgba(217, 119, 6, 0.08)',
    purple: '#7C3AED',             // Venom Vibrant Violet
    purpleSubtle: 'rgba(124, 58, 237, 0.08)',
    purpleBorder: 'rgba(124, 58, 237, 0.25)',
    tint: '#DC2626',
    tabBarBackground: 'rgba(255, 255, 255, 0.96)',
    tabBarBorder: 'rgba(226, 232, 240, 0.9)',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#DC2626',
    success: '#059669',
    successSubtle: 'rgba(5, 150, 105, 0.08)',
    warning: '#D97706',
    danger: '#DC2626',
    divider: '#E2E8F0',
  },
};

export type ThemeColors = typeof Colors.dark;

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
