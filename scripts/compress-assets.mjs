/**
 * PNG Compression Script — SPIDEY FLOW
 * Re-compresses PNG files using maximum zlib deflate level.
 * Recalculates CRC32 for each modified chunk.
 * Run: node scripts/compress-assets.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

// CRC32 table (IEEE 802.3 polynomial)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeCrc(typeBuf, dataBuf) {
  const combined = Buffer.concat([typeBuf, dataBuf]);
  const crc = crc32(combined);
  const out = Buffer.alloc(4);
  out.writeUInt32BE(crc);
  return out;
}

import { deflateSync, inflateSync } from 'zlib';

function optimizePNG(path) {
  const data = readFileSync(path);

  // Verify PNG signature
  const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (data[i] !== SIG[i]) {
      console.log(`  SKIP: ${path} (not a valid PNG)`);
      return;
    }
  }

  let pos = 8;
  const idatParts = [];
  const otherChunks = []; // {type, data}

  while (pos < data.length - 4) {
    const length = data.readUInt32BE(pos);
    const type = data.slice(pos + 4, pos + 8).toString('ascii');
    const chunkData = data.slice(pos + 8, pos + 8 + length);
    pos += 12 + length;

    if (type === 'IDAT') {
      idatParts.push(chunkData);
    } else if (type !== 'IEND') {
      otherChunks.push({ type, data: chunkData });
    }
  }

  if (idatParts.length === 0) {
    console.log(`  SKIP: ${path} (no IDAT found)`);
    return;
  }

  // Inflate then re-deflate at max compression
  const rawDeflated = Buffer.concat(idatParts);
  const rawPixels = inflateSync(rawDeflated);
  const recompressed = deflateSync(rawPixels, { level: 9 });

  // Build output PNG
  const parts = [Buffer.from(SIG)];

  for (const chunk of otherChunks) {
    const typeBuf = Buffer.from(chunk.type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(chunk.data.length);
    const crcBuf = writeCrc(typeBuf, chunk.data);
    parts.push(lenBuf, typeBuf, chunk.data, crcBuf);
  }

  // Single merged IDAT chunk
  const idatType = Buffer.from('IDAT', 'ascii');
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(recompressed.length);
  const idatCrc = writeCrc(idatType, recompressed);
  parts.push(idatLen, idatType, recompressed, idatCrc);

  // IEND
  parts.push(Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]));

  const output = Buffer.concat(parts);
  writeFileSync(path, output);

  const before = data.length;
  const after = output.length;
  const saving = Math.round((1 - after / before) * 100);
  console.log(`  ${path}: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB (${saving > 0 ? '-' + saving : '+' + Math.abs(saving)}%)`);
}

console.log('\n🗜️  PNG Asset Compression — SPIDEY FLOW\n');

const targets = [
  'assets/images/icon.png',
  'assets/images/logo-glow.png',
  'assets/images/android-icon-foreground.png',
  'assets/images/tutorial-web.png',
  'assets/images/android-icon-background.png',
  'assets/images/splash-icon.png',
];

for (const target of targets) {
  try {
    optimizePNG(target);
  } catch (err) {
    console.log(`  ERROR ${target}: ${err.message}`);
  }
}

console.log('\n✅ Done.\n');
