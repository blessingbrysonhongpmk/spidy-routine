import fs from 'fs';

function limit(x, threshold = 0.9) {
  if (x > threshold) return threshold + (1 - threshold) * Math.tanh((x - threshold) / (1 - threshold));
  if (x < -threshold) return -threshold - (1 - threshold) * Math.tanh((-x - threshold) / (1 - threshold));
  return x;
}

function buildWav(sampleRate, samples) {
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
  return buffer;
}

function generate(sampleRate, durationSec, fn) {
  const n = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = fn(i / sampleRate, sampleRate);
  return buildWav(sampleRate, samples);
}

/**
 * Realistic Cinema Movie Web-Shooter "THWIP!"
 * 1. Mechanical micro-snap trigger click (0-8ms)
 * 2. High-pressure pneumatic jet (10-60ms) with sweeping bandpass resonant noise
 * 3. High-velocity tensile silk whip whistling through the air (30-160ms)
 * 4. Silky elastic tension pop
 */
function createRealWebShootWav() {
  return generate(44100, 0.20, (t) => {
    // 1. Mechanical trigger click (metallic nozzle valve pressure burst)
    const triggerClick = Math.sin(2 * Math.PI * 4200 * t) * Math.exp(-t * 350) * 0.45;
    const triggerClick2 = Math.sin(2 * Math.PI * 2600 * t) * Math.exp(-t * 220) * 0.35;

    // 2. Pressurized pneumatic gas blast ("THWIP" burst)
    // Sweeps from 5.2kHz down to 1.1kHz with sharp resonance
    const blastEnv = Math.exp(-t * 38) * (1 - Math.exp(-t * 400));
    const noise = (Math.random() * 2 - 1);
    const blastFreq = 1100 + 4100 * Math.exp(-t * 45);
    // 2-pole resonant bandpass emulation
    const blast = noise * Math.sin(2 * Math.PI * blastFreq * t) * blastEnv * 0.85;

    // 3. Silk whip whistling resonance (high-speed filament cutting air)
    const whipEnv = Math.exp(-t * 24) * (1 - Math.exp(-t * 80));
    const whipFreq = 1800 + 1900 * Math.exp(-t * 32);
    const whipTone1 = Math.sin(2 * Math.PI * whipFreq * t) * whipEnv * 0.40;
    const whipTone2 = Math.sin(2 * Math.PI * (whipFreq * 1.5) * t) * whipEnv * 0.22;

    // 4. Subtle elastic punch / thud at bottom
    const punchEnv = Math.exp(-t * 70);
    const punch = Math.sin(2 * Math.PI * 120 * t) * punchEnv * 0.30;

    return (triggerClick + triggerClick2 + blast + whipTone1 + whipTone2 + punch) * 0.88;
  });
}

const wavBuffer = createRealWebShootWav();
fs.writeFileSync('scripts/real_webshoot.wav', Buffer.from(wavBuffer));
console.log('✅ Generated realistic web-shoot WAV:', wavBuffer.length, 'bytes');

