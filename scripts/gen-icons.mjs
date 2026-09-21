/**
 * Deterministic PNG icon generator (no image deps).
 * Draws the ViewGrid mark: dark slate tile, light grid, one accent cell.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(size, pixels /* RGBA Uint8Array */) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter none
    pixels
      .subarray(y * size * 4, (y + 1) * size * 4)
      .forEach((v, i) => (raw[y * (size * 4 + 1) + 1 + i] = v));
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function drawIcon(size) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = a;
  };
  // background
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const r = 2 + ((x + y) % 5 === 0 ? 2 : 0);
      set(x, y, r, 18, 36);
    }
  // 3x3-ish grid of cells
  const m = Math.round(size * 0.14); // margin
  const g = Math.max(1, Math.round(size * 0.05)); // gap
  const cell = Math.floor((size - 2 * m - 2 * g) / 3);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x0 = m + col * (cell + g);
      const y0 = m + row * (cell + g);
      const accent = row === 1 && col === 1;
      for (let y = y0; y < y0 + cell; y++)
        for (let x = x0; x < x0 + cell; x++) {
          if (accent) set(x, y, 56, 189, 248);
          else set(x, y, 51, 65, 85);
        }
    }
  }
  return encodePng(size, px);
}

export function generateIcons(outDir) {
  const iconsDir = path.join(outDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });
  const names = {};
  for (const size of [32, 48, 96, 128]) {
    const file = `icons/icon${size}.png`;
    fs.writeFileSync(path.join(outDir, file), drawIcon(size));
    names[String(size)] = file;
  }
  return names;
}

// standalone run: node scripts/gen-icons.mjs [outdir]
if (process.argv[1] && process.argv[1].endsWith('gen-icons.mjs')) {
  const out = process.argv[2] ?? 'dist';
  fs.mkdirSync(out, { recursive: true });
  generateIcons(out);
  console.log('[viewgrid] icons generated →', out);
}
