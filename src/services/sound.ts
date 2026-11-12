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

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

let soundEnabled = true;
let masterVolume = 0.8;
let hapticsEnabled = true;

// Preloaded sound instances for immediate latency-free playback
const loadedSounds: Partial<Record<SoundEffectType, AudioPlayer>> = {};

// ─────────────────────────────────────────────────────────────────────────────
// CORE DSP UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Hard-knee limiter — prevents digital clipping at the output stage */
function limit(x: number, threshold = 0.9): number {
  if (x > threshold) return threshold + (1 - threshold) * Math.tanh((x - threshold) / (1 - threshold));
  if (x < -threshold) return -threshold - (1 - threshold) * Math.tanh((-x - threshold) / (1 - threshold));
  return x;
}

/** Smooth exponential envelope with attack and decay */
function adsr(t: number, attack: number, decay: number, sustain: number, release: number, total: number): number {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - ((t - attack) / decay) * (1 - sustain);
  if (t < total - release) return sustain;
  return sustain * Math.max(0, 1 - (t - (total - release)) / release);
}

/** Bandlimited sawtooth via Fourier partial summation (8 harmonics) */
function bltSaw(phase: number, harmonics = 8): number {
  let out = 0;
  for (let n = 1; n <= harmonics; n++) {
    out += (n % 2 === 0 ? -1 : 1) * Math.sin(n * phase) / n;
  }
  return out * (2 / Math.PI);
}

/** Build a minimal 16-bit PCM mono WAV as base64 Data URI */
function buildWav(sampleRate: number, samples: Float32Array): string {
  const numSamples = samples.length;
  const blockAlign = 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new Uint8Array(44 + dataSize);

  // RIFF
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46;
  const totalFileSize = 36 + dataSize;
  buffer[4] = totalFileSize & 0xff; buffer[5] = (totalFileSize >> 8) & 0xff;
  buffer[6] = (totalFileSize >> 16) & 0xff; buffer[7] = (totalFileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45;
  // fmt
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20;
  buffer[16] = 16; buffer[20] = 1; buffer[22] = 1;
  buffer[24] = sampleRate & 0xff; buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff; buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = byteRate & 0xff; buffer[29] = (byteRate >> 8) & 0xff;
  buffer[30] = (byteRate >> 16) & 0xff; buffer[31] = (byteRate >> 24) & 0xff;
  buffer[32] = blockAlign; buffer[34] = 16;
  // data
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61;
  buffer[40] = dataSize & 0xff; buffer[41] = (dataSize >> 8) & 0xff;
  buffer[42] = (dataSize >> 16) & 0xff; buffer[43] = (dataSize >> 24) & 0xff;

  let byteOffset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = limit(samples[i]);
    const intSample = Math.round(clamped < 0 ? clamped * 32768 : clamped * 32767);
    buffer[byteOffset++] = intSample & 0xff;
    buffer[byteOffset++] = (intSample >> 8) & 0xff;
  }

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

function generate(sampleRate: number, durationSec: number, fn: (t: number, sr: number) => number): string {
  const n = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = fn(i / sampleRate, sampleRate);
  return buildWav(sampleRate, samples);
}

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM SOUND DESIGNS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. REAL CINEMA WEB SHOOT ("THWIP!") — Authentic movie web-shooter sound effect.
 * Physics model:
 * - Mechanical nozzle micro-click / valve trigger pop (0-8ms)
 * - Pressurized pneumatic CO2 gas expulsion jet sweeping 5.4kHz -> 1.1kHz
 * - High-speed tensile silk whip whistling through the air with Doppler flutter
 * - Low-end pneumatic air recoil thud
 */
function createWebShootUri(): string {
  return generate(44100, 0.20, (t) => {
    // 1. Mechanical nozzle trigger click (ultra-fast metallic valve release)
    const trigger1 = Math.sin(2 * Math.PI * 4400 * t) * Math.exp(-t * 400) * 0.48;
    const trigger2 = Math.sin(2 * Math.PI * 2750 * t) * Math.exp(-t * 260) * 0.38;

    // 2. High-pressure pneumatic jet expulsion ("THWIP" air blast)
    // Sweeps rapidly from 5.4kHz down to 1.1kHz with sharp resonance
    const blastEnv = Math.exp(-t * 36) * (1 - Math.exp(-t * 420));
    const noise = Math.random() * 2 - 1;
    const blastFreq = 1100 + 4300 * Math.exp(-t * 48);
    const blast = noise * Math.sin(2 * Math.PI * blastFreq * t) * blastEnv * 0.88;

    // 3. Tensile silk whip whistling resonance (high-speed filament cutting air)
    const whipEnv = Math.exp(-t * 22) * (1 - Math.exp(-t * 90));
    const whipFreq = 1600 + 2100 * Math.exp(-t * 34);
    // Subtle whistling flutter
    const flutter = 1 + 0.08 * Math.sin(2 * Math.PI * 85 * t);
    const whipTone1 = Math.sin(2 * Math.PI * (whipFreq * flutter) * t) * whipEnv * 0.45;
    const whipTone2 = Math.sin(2 * Math.PI * (whipFreq * 1.5) * t) * whipEnv * 0.24;

    // 4. Elastic silk tension punch / pneumatic air recoil at base
    const punchEnv = Math.exp(-t * 65);
    const punch = Math.sin(2 * Math.PI * 115 * t) * punchEnv * 0.32;

    return (trigger1 + trigger2 + blast + whipTone1 + whipTone2 + punch) * 0.90;
  });
}

/**
 * 2. ELECTRIC CRACKLE — Navigation / button tap
 * Character: Crisp EDM synth pluck with punchy sub-kick + electric sizzle.
 * Detuned oscillators + pitch-down modulation → premium sound design feel.
 */
function createElectricCrackleUri(): string {
  return generate(44100, 0.14, (t) => {
    // EDM-style pluck: pitch drops fast from 1.8kHz to 160Hz
    const f = 160 + 1640 * Math.exp(-t * 55);
    const phase = 2 * Math.PI * f * t;
    const env = Math.exp(-t * 28);
    const osc1 = bltSaw(phase) * 0.35;
    const osc2 = bltSaw(phase * 1.0063) * 0.28; // slight detune for width
    const osc3 = Math.sin(phase * 0.5) * 0.22; // sub octave warmth
    // Electrical sizzle (filtered noise burst)
    const sizzleEnv = Math.exp(-t * 95);
    const sizzle = (Math.random() * 2 - 1) * sizzleEnv * 0.18;
    return (osc1 + osc2 + osc3 + sizzle) * env * 0.88;
  });
}

/**
 * 3. THUNDER MILESTONE — Thor's Mjolnir lightning strike + divine thunder impact
 * Character: Metallic hammer strike transient + sub-bass explosion + resonant thunder tail.
 */
function createThunderMilestoneUri(): string {
  return generate(44100, 0.90, (t) => {
    // 1. Mjolnir metallic hammer impact transient (first 30ms)
    const hammerClang = (
      Math.sin(2 * Math.PI * 880 * t) * 0.35 +
      Math.sin(2 * Math.PI * 1760 * t) * 0.22 +
      Math.sin(2 * Math.PI * 440 * t) * 0.28
    ) * Math.exp(-t * 45);

    // 2. Ground-shattering sub boom (38Hz - 85Hz kick)
    const subEnv = Math.exp(-t * 6.5);
    const subFreq = 42 + 95 * Math.exp(-t * 18);
    const sub = Math.sin(2 * Math.PI * subFreq * t) * subEnv * 0.68;

    // 3. Electric lightning arc crackle
    const arcEnv = Math.exp(-t * 12);
    const arc = (Math.random() * 2 - 1) * arcEnv * 0.24;

    // 4. Asgardian chord swell (C major / D power chord resonance)
    const harmEnv = adsr(t, 0.03, 0.12, 0.55, 0.35, 0.90);
    const h1 = Math.sin(2 * Math.PI * 523.25 * t) * 0.18;
    const h2 = Math.sin(2 * Math.PI * 659.25 * t) * 0.14;
    const h3 = Math.sin(2 * Math.PI * 784.00 * t) * 0.12;
    const chord = (h1 + h2 + h3) * harmEnv;

    // 5. Rolling thunder tail
    const rumble = (Math.random() * 2 - 1) * 0.14 * Math.exp(-t * 4.5);

    return (hammerClang + sub + arc + chord + rumble) * 0.92;
  });
}

/**
 * 4. FREAKY SYMBIOTE WEB — Venom alien tendril stretch & organic web whoosh
 * Character: Viscous living alien symbiote slither, organic micro-bubble stretch,
 * and deep resonant formant sweep.
 */
function createSymbioteWhooshUri(): string {
  return generate(44100, 0.45, (t) => {
    const dur = 0.45;
    const env = Math.sin((t / dur) * Math.PI);

    // 1. Organic viscous bubble pops (alien liquid tension)
    const bubbleRate = 2 * Math.PI * 35 * t;
    const bubbleMod = 1 + 0.35 * Math.sin(bubbleRate);
    const pop = (Math.random() * 2 - 1) * Math.pow(Math.sin(bubbleRate), 6) * 0.25;

    // 2. Deep symbiote vocalization formant sweep (65Hz -> 240Hz -> 55Hz)
    const growlFreq = t < dur * 0.5
      ? 65 + 320 * (t / (dur * 0.5))
      : 225 + (55 - 225) * ((t - dur * 0.5) / (dur * 0.5));
    const growl = Math.sin(2 * Math.PI * growlFreq * bubbleMod * t) * 0.58;

    // 3. Dark atmospheric air rush
    const noise = (Math.random() * 2 - 1) * 0.35;
    const subTendril = Math.sin(2 * Math.PI * 45 * t) * 0.25;

    return (growl + pop + noise + subTendril) * env * 0.88;
  });
}

/**
 * 5. BUTTON TAP — UI touches
 * Character: Tight, satisfying mechanical click with tuned resonance.
 * Ultra-short (80ms) — instant feedback, never intrusive.
 */
function createButtonTapUri(): string {
  return generate(44100, 0.08, (t) => {
    // Transient click (first 8ms)
    const clickEnv = Math.exp(-t * 320);
    const click = (Math.random() * 2 - 1) * clickEnv * 0.5;
    // Tuned body resonance — D5 pluck
    const bodyFreq = 587.33 * (1 + 1.8 * Math.exp(-t * 180)); // pitch drop
    const bodyEnv = Math.exp(-t * 55);
    const body = Math.sin(2 * Math.PI * bodyFreq * t) * bodyEnv * 0.52;
    // Harmonic overtone
    const ov = Math.sin(2 * Math.PI * bodyFreq * 2.0 * t) * Math.exp(-t * 90) * 0.18;
    return (click + body + ov) * 0.90;
  });
}

/**
 * 6. TASK SUCCESS — Task completed ✓
 * Character: Bright, uplifting two-note chime with long sparkling tail.
 * Ascending interval (perfect fifth) = instant satisfaction.
 */
function createTaskSuccessUri(): string {
  return generate(44100, 0.45, (t) => {
    // Note 1: A5 (onset)
    const n1env = Math.exp(-t * 10);
    const n1 = Math.sin(2 * Math.PI * 880 * t) * n1env * 0.44;
    const n1ov = Math.sin(2 * Math.PI * 1760 * t) * n1env * 0.14; // octave shimmer
    // Note 2: E6 (delayed 90ms — ascending fifth)
    const t2 = Math.max(0, t - 0.09);
    const n2env = Math.exp(-t2 * 9);
    const n2 = Math.sin(2 * Math.PI * 1318.51 * t2) * n2env * 0.40 * (t > 0.09 ? 1 : 0);
    const n2ov = Math.sin(2 * Math.PI * 2637.02 * t2) * n2env * 0.12 * (t > 0.09 ? 1 : 0);
    // Sparkle (high-frequency shimmer, long tail)
    const sparkle = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.06;
    return (n1 + n1ov + n2 + n2ov + sparkle) * 0.88;
  });
}

/**
 * 7. DELETE ACTION — Task deleted / destructive action
 * Character: Downward pitch-smear — feels "gone". Low and definitive.
 */
function createDeleteActionUri(): string {
  return generate(44100, 0.16, (t) => {
    // Descending frequency sweep (200Hz → 60Hz)
    const freq = 60 + 200 * Math.exp(-t * 25);
    const env = Math.exp(-t * 22);
    const tone = bltSaw(2 * Math.PI * freq * t, 5) * 0.42;
    // Muted thud
    const thudEnv = Math.exp(-t * 40);
    const thud = Math.sin(2 * Math.PI * 72 * t) * thudEnv * 0.35;
    return (tone + thud) * env * 0.82;
  });
}

/**
 * 8. STARTUP WHOOSH — Emotional cinematic hero opening
 * Character: Heart-melting heroic orchestral chord swell + deep double heartbeat thump
 * + silk whip whistling resonance + Thor lightning atmosphere.
 */
function createStartupWhooshUri(): string {
  return generate(44100, 0.75, (t) => {
    const dur = 0.75;
    // 1. Heartbeat thump (double pulse: lub-dub at 0ms and 140ms)
    const hb1 = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t * 35) * 0.45;
    const t2 = Math.max(0, t - 0.14);
    const hb2 = Math.sin(2 * Math.PI * 50 * t2) * Math.exp(-t2 * 32) * (t > 0.14 ? 0.40 : 0);

    // 2. Inspiring superhero orchestral chord swell (D minor / F major cinematic pad)
    const padEnv = adsr(t, 0.22, 0.15, 0.75, 0.22, dur);
    const d3 = Math.sin(2 * Math.PI * 146.83 * t) * padEnv * 0.25;
    const a3 = Math.sin(2 * Math.PI * 220.00 * t) * padEnv * 0.22;
    const f4 = Math.sin(2 * Math.PI * 349.23 * t) * padEnv * 0.18;
    const d5 = Math.sin(2 * Math.PI * 587.33 * t) * padEnv * 0.14;

    // 3. Sub-bass swell rising from 42Hz to 95Hz
    const subFreq = 42 + 53 * (t / dur);
    const sub = Math.sin(2 * Math.PI * subFreq * t) * padEnv * 0.40;

    // 4. Subtle silk whip breath & atmospheric cosmic shimmer
    const shimmerEnv = Math.sin((t / dur) * Math.PI);
    const shimmer = (Math.random() * 2 - 1) * shimmerEnv * 0.12;

    return (hb1 + hb2 + d3 + a3 + f4 + d5 + sub + shimmer) * 0.90;
  });
}

/**
 * 9. LOGO REVEAL — Splash screen chime
 * Character: Pristine three-note crystal chime. G5 → D6 → G6 arpeggio.
 * Clean, airy, premium — no dirt, just clarity.
 */
function createLogoRevealUri(): string {
  return generate(44100, 0.55, (t) => {
    // Note 1: G5 (784 Hz, onset)
    const n1env = Math.exp(-t * 8);
    const n1 = Math.sin(2 * Math.PI * 784.00 * t) * n1env * 0.42;
    const n1sh = Math.sin(2 * Math.PI * 1568.00 * t) * n1env * 0.12;
    // Note 2: D6 (1174.66 Hz, 110ms delay)
    const t2 = Math.max(0, t - 0.11);
    const n2env = Math.exp(-t2 * 7.5) * (t > 0.11 ? 1 : 0);
    const n2 = Math.sin(2 * Math.PI * 1174.66 * t2) * n2env * 0.36;
    // Note 3: G6 (1568 Hz, 240ms delay)
    const t3 = Math.max(0, t - 0.24);
    const n3env = Math.exp(-t3 * 7) * (t > 0.24 ? 1 : 0);
    const n3 = Math.sin(2 * Math.PI * 1568.00 * t3) * n3env * 0.30;
    // Crystal shimmer tail
    const shimmer = (Math.random() * 2 - 1) * Math.exp(-t * 25) * 0.04;
    return (n1 + n1sh + n2 + n3 + shimmer) * 0.90;
  });
}

/**
 * 10. MISSION COMPLETE — All daily tasks done / major achievement
 * Character: Triumphant superhero fanfare. Full major chord + bass punch.
 * 700ms epic buildup. The reward sound you WANT to hear.
 */
function createMissionCompleteUri(): string {
  return generate(44100, 0.75, (t) => {
    const dur = 0.75;
    // Bass foundation (deep, punchy)
    const bassFreq = 65 + 60 * Math.exp(-t * 15);
    const bassEnv = adsr(t, 0.01, 0.08, 0.5, 0.25, dur);
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * bassEnv * 0.55;
    // C major chord: C5, E5, G5, C6 — staggered onset
    const env = adsr(t, 0.03, 0.12, 0.65, 0.20, dur);
    const c5 = Math.sin(2 * Math.PI * 523.25 * t) * env * 0.30;
    const e5 = Math.sin(2 * Math.PI * 659.25 * t) * env * 0.26 * (t > 0.03 ? 1 : 0);
    const g5 = Math.sin(2 * Math.PI * 784.00 * t) * env * 0.22 * (t > 0.06 ? 1 : 0);
    const c6 = Math.sin(2 * Math.PI * 1046.5 * t) * env * 0.18 * (t > 0.09 ? 1 : 0);
    // Electric shimmer (high harmonic presence)
    const shimmerEnv = Math.exp(-t * 6);
    const shimmer = Math.sin(2 * Math.PI * 3136 * t) * shimmerEnv * 0.07;
    // Thunder transient at onset
    const thunEnv = Math.exp(-t * 30);
    const thun = (Math.random() * 2 - 1) * thunEnv * 0.15;
    return (bass + c5 + e5 + g5 + c6 + shimmer + thun) * 0.87;
  });
}

/**
 * 11. REMINDER ALERT — Scheduled notification
 * Character: Tactical dual-ping — crisp, clear, not annoying.
 * Two distinct tones 150ms apart. Pleasant but attention-getting.
 */
function createReminderAlertUri(): string {
  return generate(44100, 0.50, (t) => {
    // Ping 1 — B5 (987.77 Hz)
    const p1env = Math.exp(-t * 20) * (t < 0.14 ? 1 : 0);
    const p1 = Math.sin(2 * Math.PI * 987.77 * t) * p1env * 0.52;
    const p1sh = Math.sin(2 * Math.PI * 1975.54 * t) * p1env * 0.14;
    // Ping 2 — E6 (1318.51 Hz) — 160ms later, slightly lower volume
    const t2 = Math.max(0, t - 0.16);
    const p2env = Math.exp(-t2 * 18) * (t > 0.16 ? 1 : 0);
    const p2 = Math.sin(2 * Math.PI * 1318.51 * t2) * p2env * 0.44;
    const p2sh = Math.sin(2 * Math.PI * 2637.02 * t2) * p2env * 0.11;
    return (p1 + p1sh + p2 + p2sh) * 0.88;
  });
}

/**
 * 12. SUCCESS CONFIRM — Form save / settings applied
 * Character: Warm, brief affirmation — E5 + G#5 major third.
 * Soft attack, smooth release. Quiet confidence.
 */
function createSuccessConfirmUri(): string {
  return generate(44100, 0.35, (t) => {
    const env = adsr(t, 0.012, 0.08, 0.6, 0.18, 0.35);
    const fund = Math.sin(2 * Math.PI * 659.25 * t) * env * 0.46; // E5
    const third = Math.sin(2 * Math.PI * 830.61 * t) * env * 0.32; // G#5
    const octave = Math.sin(2 * Math.PI * 1318.51 * t) * env * 0.14; // E6
    const sparkle = (Math.random() * 2 - 1) * Math.exp(-t * 35) * 0.05;
    return (fund + third + octave + sparkle) * 0.85;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE API
// ─────────────────────────────────────────────────────────────────────────────

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

    // Preload all effects into memory — zero-latency playback
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
      try { await player.seekTo(0); } catch { /* non-blocking */ }
      player.play();
    }
  } catch (error) {
    console.warn(`Sound playback error for ${type}:`, error);
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (!hapticsEnabled) return;
  try {
    switch (type) {
      case 'light':   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium':  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'heavy':   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
      case 'error':   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    }
  } catch { /* graceful fallback on devices without haptic engines */ }
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function setSoundVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume));
  for (const player of Object.values(loadedSounds)) {
    if (player) {
      try { player.volume = masterVolume; } catch { /* non-fatal */ }
    }
  }
}

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function getSoundState() {
  return { soundEnabled, masterVolume, hapticsEnabled };
}
