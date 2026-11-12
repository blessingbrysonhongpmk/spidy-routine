import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import {
  Platform,
  StatusBar as RNStatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebBackground, WebBackgroundProps } from './WebBackground';

export interface AppScreenShellProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundProps?: WebBackgroundProps;
  showBackground?: boolean;
  /**
   * Additional breathing room below the system status bar in logical pixels.
   * Default: 8
   */
  topBreathingSpace?: number;
  /**
   * Whether to apply bottom safe area inset.
   * Tab screens leave this false (CustomTabBar handles bottom inset).
   * Standalone screens (profile, auth, analytics, achievements) set this to true.
   * Default: false
   */
  applyBottomInset?: boolean;
}

/**
 * AppScreenShell:
 * Application-shell-level mobile safe area controller.
 * - Protects top headers from the Android status bar, notch, and punch-hole camera cutouts.
 * - Dynamically computes safe insets with guaranteed fallbacks for Android/iOS/Web.
 * - Keeps the superhero web background edge-to-edge behind the translucent status bar.
 * - Protects bottom navigation from gesture navigation bars and 3-button system bars.
 * - Prevents individual screens from adding duplicate top insets or arbitrary hardcoded offsets.
 */
export const AppScreenShell: React.FC<AppScreenShellProps> = ({
  children,
  style,
  contentStyle,
  backgroundProps = { variant: 'minimal', showLightning: false },
  showBackground = true,
  topBreathingSpace = 8,
  applyBottomInset = false,
}) => {
  const insets = useSafeAreaInsets();
  const colors = useTheme();

  // Dynamic top status bar inset:
  // - insets.top from react-native-safe-area-context dynamically accounts for notches/cutouts/islands.
  // - On Android, fallback to RNStatusBar.currentHeight (or 24dp) if insets haven't mounted yet.
  const rawTop = insets?.top ?? 0;
  const topInset = Math.max(
    rawTop,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0
  );

  const rawBottom = insets?.bottom ?? 0;
  const bottomInset = applyBottomInset ? Math.max(rawBottom, Platform.OS === 'android' ? 12 : 16) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {showBackground ? <WebBackground {...backgroundProps} /> : null}
      <View
        style={[
          styles.contentWrapper,
          {
            paddingTop: topInset + topBreathingSpace,
            paddingBottom: bottomInset,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
  },
});
