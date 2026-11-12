import { CinematicIntro } from '@/components/CinematicIntro';
import { LightningProvider } from '@/components/LightningEffect';
import { SpideyColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DatabaseProvider, useDatabase } from '@/context/DatabaseContext';
import { SoundProvider } from '@/context/SoundContext';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StatusBar as RNStatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the native splash screen from auto-hiding before our intro mounts
SplashScreen.preventAutoHideAsync().catch(() => { });

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorBadge}>CRITICAL PROTOCOL</Text>
      <Text style={styles.errorTitle}>SYSTEM RECOVERY REQUIRED</Text>
      <Text style={styles.errorMessage}>{error?.message || 'A runtime error occurred.'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.8}>
        <Text style={styles.retryText}>REBOOT APPLICATION</Text>
      </TouchableOpacity>
    </View>
  );
}

// Track whether intro was already displayed during the current app execution session
let sessionIntroShown = false;

function AppNavigation() {
  const pathname = usePathname();
  const { initialized } = useDatabase();
  const { loading } = useAuth();
  const { isDark, colors } = useThemeContext();
  const [showIntro, setShowIntro] = useState(!sessionIntroShown);

  const isAppReady = initialized && !loading;

  useEffect(() => {
    // Immediately hide the native splash screen as soon as our React tree mounts
    SplashScreen.hideAsync().catch(() => { });

    // Safety fallback: guarantee native splash screen is never stuck
    const fallbackTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { });
    }, 600);

    return () => clearTimeout(fallbackTimer);
  }, []);

  const handleIntroComplete = () => {
    sessionIntroShown = true;
    setShowIntro(false);
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    }
  }, [isDark]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal-task"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal-routine"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="analytics"
          options={{
            presentation: 'modal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="achievements"
          options={{
            presentation: 'modal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            presentation: 'modal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="intro"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
      </Stack>

      {/* Cinematic Startup Overlay */}
      {showIntro && pathname !== '/intro' && (
        <CinematicIntro
          isAppReady={isAppReady}
          onComplete={handleIntroComplete}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SoundProvider>
          <AuthProvider>
            <DatabaseProvider>
              <LightningProvider>
                <AppNavigation />
              </LightningProvider>
            </DatabaseProvider>
          </AuthProvider>
        </SoundProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpideyColors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: SpideyColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: SpideyColors.textPrimary,
    backgroundColor: SpideyColors.spideyRed,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    letterSpacing: 2,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: SpideyColors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: SpideyColors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: SpideyColors.spideyRed,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SpideyColors.thorBlue,
  },
  retryText: {
    color: SpideyColors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
