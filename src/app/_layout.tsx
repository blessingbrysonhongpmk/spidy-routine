import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SpideyColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DatabaseProvider, useDatabase } from '@/context/DatabaseContext';
import { SoundProvider } from '@/context/SoundContext';
import { LightningProvider } from '@/components/LightningEffect';
import { CinematicIntro } from '@/components/CinematicIntro';

// Prevent the native splash screen from auto-hiding before our intro mounts
SplashScreen.preventAutoHideAsync().catch(() => {});

// Track whether intro was already displayed during the current app execution session
let sessionIntroShown = false;

function AppNavigation() {
  const { initialized } = useDatabase();
  const { loading } = useAuth();
  const [showIntro, setShowIntro] = useState(!sessionIntroShown);

  const isAppReady = initialized && !loading;

  useEffect(() => {
    // Hide the native splash screen as soon as our React tree mounts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleIntroComplete = () => {
    sessionIntroShown = true;
    setShowIntro(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: SpideyColors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal-task"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal-routine"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
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
      {showIntro && (
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
    <SoundProvider>
      <AuthProvider>
        <DatabaseProvider>
          <LightningProvider>
            <AppNavigation />
          </LightningProvider>
        </DatabaseProvider>
      </AuthProvider>
    </SoundProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpideyColors.background,
  },
});
