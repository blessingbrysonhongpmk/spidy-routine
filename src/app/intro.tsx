import React from 'react';
import { useRouter } from 'expo-router';
import { CinematicIntro } from '@/components/CinematicIntro';
import { useDatabase } from '@/context/DatabaseContext';
import { useAuth } from '@/context/AuthContext';

export default function IntroModalScreen() {
  const router = useRouter();
  const { initialized } = useDatabase();
  const { loading } = useAuth();

  const isAppReady = initialized && !loading;

  return (
    <CinematicIntro
      isAppReady={isAppReady}
      onComplete={() => router.back()}
    />
  );
}

