import { Colors, HeroTheme, ThemeColors, ThemeType } from '@/constants/theme';
import { getAppSetting, setAppSetting } from '@/services/database';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeMode = 'spiderman' | 'thor' | 'venom' | 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  themeMode: ThemeMode;
  heroTheme: HeroTheme;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setHeroTheme: (hero: HeroTheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'spiderman',
  themeMode: 'spiderman',
  heroTheme: 'spiderman',
  colors: Colors.spiderman,
  isDark: true,
  setThemeMode: async () => { },
  setHeroTheme: async () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('spiderman');

  useEffect(() => {
    async function loadThemePreference() {
      try {
        const saved = await getAppSetting('theme_mode', 'spiderman');
        const validModes: ThemeMode[] = [
          'spiderman',
          'thor',
          'venom',
          'dark',
          'light',
          'system',
        ];
        if (validModes.includes(saved as ThemeMode)) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch {
        // Fallback to spiderman
      }
    }
    loadThemePreference();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await setAppSetting('theme_mode', mode);
      if (mode === 'spiderman' || mode === 'thor' || mode === 'venom') {
        await setAppSetting('hero_archetype', mode);
      }
    } catch {
      // Safe fallback
    }
  };

  const setHeroTheme = async (hero: HeroTheme) => {
    await setThemeMode(hero);
  };

  const resolvedTheme: ThemeType =
    themeMode === 'system'
      ? systemScheme === 'light'
        ? 'light'
        : 'spiderman'
      : themeMode === 'dark'
        ? 'spiderman'
        : themeMode;

  const isDark = resolvedTheme !== 'light';
  const heroTheme: HeroTheme =
    resolvedTheme === 'thor'
      ? 'thor'
      : resolvedTheme === 'venom'
        ? 'venom'
        : 'spiderman';

  const colors: ThemeColors =
    resolvedTheme === 'thor'
      ? Colors.thor
      : resolvedTheme === 'venom'
        ? Colors.venom
        : resolvedTheme === 'light'
          ? Colors.light
          : Colors.spiderman;

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themeMode,
        heroTheme,
        colors,
        isDark,
        setThemeMode,
        setHeroTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

