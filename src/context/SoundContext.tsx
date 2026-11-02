import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  initSoundService,
  playSound as playSoundEffect,
  triggerHaptic as triggerHapticEffect,
  setSoundEnabled as setServiceSoundEnabled,
  setSoundVolume as setServiceSoundVolume,
  setHapticsEnabled as setServiceHapticsEnabled,
  SoundEffectType,
  getSoundState,
} from '@/services/sound';
import { setAppSetting } from '@/services/database';

interface SoundContextType {
  soundEnabled: boolean;
  masterVolume: number;
  hapticsEnabled: boolean;
  toggleSound: (enabled: boolean) => Promise<void>;
  updateVolume: (volume: number) => Promise<void>;
  toggleHaptics: (enabled: boolean) => Promise<void>;
  playSound: (type: SoundEffectType) => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

const SoundContext = createContext<SoundContextType>({} as SoundContextType);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [masterVolume, setMasterVolumeState] = useState(0.8);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);

  useEffect(() => {
    initSoundService().then(() => {
      const state = getSoundState();
      setSoundEnabledState(state.soundEnabled);
      setMasterVolumeState(state.masterVolume);
      setHapticsEnabledState(state.hapticsEnabled);
    });
  }, []);

  const toggleSound = async (enabled: boolean) => {
    setSoundEnabledState(enabled);
    setServiceSoundEnabled(enabled);
    await setAppSetting('sound_enabled', enabled ? 'true' : 'false');
  };

  const updateVolume = async (volume: number) => {
    setMasterVolumeState(volume);
    setServiceSoundVolume(volume);
    await setAppSetting('master_volume', volume.toString());
  };

  const toggleHaptics = async (enabled: boolean) => {
    setHapticsEnabledState(enabled);
    setServiceHapticsEnabled(enabled);
    await setAppSetting('haptics_enabled', enabled ? 'true' : 'false');
  };

  const playSound = (type: SoundEffectType) => {
    playSoundEffect(type);
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    triggerHapticEffect(type);
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        masterVolume,
        hapticsEnabled,
        toggleSound,
        updateVolume,
        toggleHaptics,
        playSound,
        triggerHaptic,
      }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
