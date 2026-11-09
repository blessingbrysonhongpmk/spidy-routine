import { Colors, ThemeColors } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';

export function useTheme(): ThemeColors {
  try {
    const context = useThemeContext();
    if (context && context.colors) {
      return context.colors;
    }
  } catch {
    // If used outside ThemeProvider
  }
  return Colors.dark;
}

export { useThemeContext };
