import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { getAppSetting } from './database';

export type SoundEffectType =
  | 'webShoot'
  | 'electricCrackle'
  | 'thunderMilestone'
  | 'symbioteWhoosh'
  | 'buttonTap'
  | 'taskSuccess'
  | 'missionComplete'
  | 'reminderAlert'
  | 'successConfirm'
  | 'deleteAction'
  | 'startupWhoosh'
  | 'logoReveal';

let soundEnabled = true;
let masterVolume = 0.8;
let hapticsEnabled = true;

// Preloaded sound instances for immediate latency-free playback
const loadedSounds: Partial<Record<SoundEffectType, AudioPlayer>> = {};

// Helper: build a minimal 16-bit PCM mono WAV file as a base64 Data URI
function generateWavDataUri(
  sampleRate: number,
  generator: (t: number, totalSamples: number) => number,
  durationSec: number
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = 2; // 16-bit mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new Uint8Array(44 + dataSize);

  // RIFF header
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
  const totalFileSize = 36 + dataSize;
  buffer[4] = totalFileSize & 0xff;
  buffer[5] = (totalFileSize >> 8) & 0xff;
  buffer[6] = (totalFileSize >> 16) & 0xff;
  buffer[7] = (totalFileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

  // fmt chunk
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // "fmt "
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // SubChunk1Size (16 for PCM)
  buffer[20] = 1; buffer[21] = 0; // AudioFormat (1 = PCM)
  buffer[22] = 1; buffer[23] = 0; // NumChannels (1 = Mono)
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = byteRate & 0xff;
  buffer[29] = (byteRate >> 8) & 0xff;
  buffer[30] = (byteRate >> 16) & 0xff;
  buffer[31] = (byteRate >> 24) & 0xff;
  buffer[32] = blockAlign; buffer[33] = 0; // BlockAlign
  buffer[34] = 16; buffer[35] = 0; // BitsPerSample (16)

  // data chunk
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // "data"
  buffer[40] = dataSize & 0xff;
  buffer[41] = (dataSize >> 8) & 0xff;
  buffer[42] = (dataSize >> 16) & 0xff;
  buffer[43] = (dataSize >> 24) & 0xff;

  // Synthesize audio samples
  let byteOffset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = generator(t, numSamples);
    // Clamp to -1.0 .. 1.0
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
    buffer[byteOffset++] = intSample & 0xff;
    buffer[byteOffset++] = (intSample >> 8) & 0xff;
  }

  // Convert Uint8Array to base64
  const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = buffer.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = buffer[i];
    const b1 = i + 1 < len ? buffer[i + 1] : 0;
    const b2 = i + 2 < len ? buffer[i + 2] : 0;
    base64 += b64chars[b0 >> 2];
    base64 += b64chars[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += i + 1 < len ? b64chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    base64 += i + 2 < len ? b64chars[b2 & 63] : '=';
  }

  return `data:audio/wav;base64,${base64}`;
}

// 1. Spider-Man Web Shoot: sharp snap + high resonant sweep + quick decay
function createWebShootUri(): string {
  return generateWavDataUri(22050, (t) => {
    const envelope = Math.exp(-t * 28);
    const freq = 1600 - t * 1800; // Frequency drop
    const noise = (Math.random() * 2 - 1) * 0.45;
    const tone = Math.sin(2 * Math.PI * Math.max(100, freq) * t) * 0.55;
    return (tone + noise) * envelope;
  }, 0.16);
}

// 2. Thor Electric Crackle: metallic electric sizzle & lightning spark
function createElectricCrackleUri(): string {
  return generateWavDataUri(22050, (t) => {
    const envelope = Math.exp(-t * 18);
    const spark = (Math.random() > 0.82 ? 1 : 0) * (Math.random() * 2 - 1);
    const highSine = Math.sin(2 * Math.PI * 2400 * t) * 0.3;
    const sub = Math.sin(2 * Math.PI * 180 * t) * 0.4;
    return (spark * 0.7 + highSine + sub) * envelope;
  }, 0.22);
}

// 3. Thor Thunder / Milestone: deep power chord + triumphant resonant decay
function createThunderMilestoneUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.exp(-t * 5);
    const bass = Math.sin(2 * Math.PI * 85 * t) * 0.6;
    const harmonic1 = Math.sin(2 * Math.PI * 170 * t) * 0.3;
    const harmonic2 = Math.sin(2 * Math.PI * 510 * t) * 0.2;
    const crackle = (Math.random() * 2 - 1) * 0.15 * Math.exp(-t * 15);
    return (bass + harmonic1 + harmonic2 + crackle) * env;
  }, 0.6);
}

// 4. Venom Symbiote Whoosh: dark low-pass filtered sweep
function createSymbioteWhooshUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.sin((t / 0.35) * Math.PI); // Smooth rise and fall
    const noise = (Math.random() * 2 - 1) * 0.4;
    const lowGrowl = Math.sin(2 * Math.PI * (120 - t * 80) * t) * 0.6;
    return (noise + lowGrowl) * env;
  }, 0.35);
}

// 5. Button Tap: clean micro-click
function createButtonTapUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.exp(-t * 80);
    return Math.sin(2 * Math.PI * 1200 * t) * env;
  }, 0.05);
}

// 6. Task Success: bright harmonic ping
function createTaskSuccessUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.exp(-t * 12);
    const note1 = Math.sin(2 * Math.PI * 880 * t) * 0.5;
    const note2 = Math.sin(2 * Math.PI * 1320 * t) * 0.4;
    return (note1 + note2) * env;
  }, 0.25);
}

// 7. Delete Action: muted quick low sweep
function createDeleteActionUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.exp(-t * 30);
    const lowTone = Math.sin(2 * Math.PI * 180 * (1 - t * 4) * t);
    return lowTone * env;
  }, 0.12);
}

// 8. Cinematic Startup Whoosh: low-frequency swell + atmospheric rise
function createStartupWhooshUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.sin((t / 0.5) * Math.PI);
    const sub = Math.sin(2 * Math.PI * (60 + t * 90) * t) * 0.7;
    const noise = (Math.random() * 2 - 1) * 0.25 * t;
    return (sub + noise) * env;
  }, 0.5);
}

// 9. Logo Reveal: clean futuristic dual-harmonic chime
function createLogoRevealUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.exp(-t * 9);
    const fundamental = Math.sin(2 * Math.PI * 784 * t) * 0.5; // G5
    const overtone = Math.sin(2 * Math.PI * 1175 * t) * 0.35; // D6
    const shimmer = Math.sin(2 * Math.PI * 1568 * t) * 0.2; // G6
    return (fundamental + overtone + shimmer) * env;
  }, 0.38);
}

// 10. Mission Complete: Triumphant superhero brass-like ascending chord
function createMissionCompleteUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.exp(-t * 4);
    const n1 = Math.sin(2 * Math.PI * 523.25 * t) * 0.35; // C5
    const n2 = Math.sin(2 * Math.PI * 659.25 * t) * 0.30; // E5
    const n3 = Math.sin(2 * Math.PI * 783.99 * t) * 0.25; // G5
    const n4 = Math.sin(2 * Math.PI * 1046.50 * t) * 0.20; // C6
    return (n1 + n2 + n3 + n4) * env;
  }, 0.55);
}

// 11. Reminder Alert: tactical dual-ping radar notification
function createReminderAlertUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env1 = t < 0.12 ? Math.exp(-t * 22) : 0;
    const t2 = t - 0.12;
    const env2 = t >= 0.12 ? Math.exp(-t2 * 20) : 0;
    const p1 = Math.sin(2 * Math.PI * 987.77 * t) * env1; // B5
    const p2 = Math.sin(2 * Math.PI * 1318.51 * t) * env2; // E6
    return (p1 + p2) * 0.6;
  }, 0.32);
}

// 12. Success Confirmation: warm resonant affirmation
function createSuccessConfirmUri(): string {
  return generateWavDataUri(22050, (t) => {
    const env = Math.exp(-t * 8);
    const fundamental = Math.sin(2 * Math.PI * 659.25 * t) * 0.5; // E5
    const third = Math.sin(2 * Math.PI * 830.61 * t) * 0.35; // G#5
    return (fundamental + third) * env;
  }, 0.3);
}

export async function initSoundService(): Promise<void> {
  try {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
    } catch (modeErr) {
      console.warn('Audio mode initialization warning:', modeErr);
    }

    const sEnabled = await getAppSetting('sound_enabled', 'true');
    const sVol = await getAppSetting('master_volume', '0.8');
    const hEnabled = await getAppSetting('haptics_enabled', 'true');

    soundEnabled = sEnabled === 'true';
    masterVolume = parseFloat(sVol) || 0.8;
    hapticsEnabled = hEnabled === 'true';

    // Preload audio effects into memory
    const uris: Record<SoundEffectType, () => string> = {
      webShoot: createWebShootUri,
      electricCrackle: createElectricCrackleUri,
      thunderMilestone: createThunderMilestoneUri,
      symbioteWhoosh: createSymbioteWhooshUri,
      buttonTap: createButtonTapUri,
      taskSuccess: createTaskSuccessUri,
      missionComplete: createMissionCompleteUri,
      reminderAlert: createReminderAlertUri,
      successConfirm: createSuccessConfirmUri,
      deleteAction: createDeleteActionUri,
      startupWhoosh: createStartupWhooshUri,
      logoReveal: createLogoRevealUri,
    };

    for (const [key, fn] of Object.entries(uris)) {
      try {
        const uri = fn();
        const player = createAudioPlayer({ uri });
        player.volume = masterVolume;
        loadedSounds[key as SoundEffectType] = player;
      } catch (err) {
        console.warn(`Could not preload SFX ${key}:`, err);
      }
    }
  } catch (e) {
    console.warn('Audio system initialization warning:', e);
  }
}

export async function playSound(type: SoundEffectType): Promise<void> {
  if (!soundEnabled) return;
  try {
    const player = loadedSounds[type];
    if (player) {
      player.volume = masterVolume;
      try {
        await player.seekTo(0);
      } catch {
        // Non-blocking seek fallback
      }
      player.play();
    }
  } catch (error) {
    // Non-fatal, keep app moving smoothly
    console.warn(`Sound playback error for ${type}:`, error);
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (!hapticsEnabled) return;
  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Fallback gracefully on devices without haptic engines
  }
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function setSoundVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume));
  for (const player of Object.values(loadedSounds)) {
    if (player) {
      try {
        player.volume = masterVolume;
      } catch {
        // Non-fatal
      }
    }
  }
}

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function getSoundState() {
  return { soundEnabled, masterVolume, hapticsEnabled };
}
