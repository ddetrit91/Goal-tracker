// client/generate-pwa-icons.cjs
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}
const crcTable = makeCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const typeAndData = Buffer.concat([typeBuf, data]);
  const crc = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowStride = width * 4;
  const scanlines = Buffer.alloc((1 + rowStride) * height);
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (1 + rowStride);
    scanlines[scanlineOffset] = 0; // Filter None
    rgbaBuffer.copy(scanlines, scanlineOffset + 1, y * rowStride, (y + 1) * rowStride);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Distance to rounded rectangle (for squircle corner smoothing)
function roundedRectDistance(x, y, w, h, r) {
  const dx = Math.max(Math.abs(x - w / 2) - (w / 2 - r), 0);
  const dy = Math.max(Math.abs(y - h / 2) - (h / 2 - r), 0);
  return Math.sqrt(dx * dx + dy * dy) - r;
}

// Clamp & smoothstep
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function renderGoalTrackerIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const cornerRadius = size * 0.22;

  // Target ring radii and stroke widths
  const r1 = size * 0.305;
  const w1 = size * 0.055;
  const r2 = size * 0.18;
  const w2 = size * 0.052;
  const r3 = size * 0.072; // bullseye solid center

  // Gradient colors: Indigo #4f46e5 to Purple #9333ea
  const c1 = [79, 70, 229];
  const c2 = [147, 51, 234];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Squircle mask with anti-aliasing
      const dRect = roundedRectDistance(x + 0.5, y + 0.5, size, size, cornerRadius);
      const alphaCorner = 1 - smoothstep(-0.5, 0.5, dRect);

      if (alphaCorner <= 0) {
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      // Linear gradient calculation
      const t = (x + y) / (2 * size);
      let r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
      let g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
      let b = Math.round(c1[2] + (c2[2] - c1[2]) * t);

      // Distance from center
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Subtle shadow (shifted down by size * 0.02)
      const sdy = y + 0.5 - (cy + size * 0.02);
      const sdist = Math.sqrt(dx * dx + sdy * sdy);
      let shadowAlpha = 0;
      
      const sd1 = Math.abs(sdist - r1) - w1 / 2;
      const sd2 = Math.abs(sdist - r2) - w2 / 2;
      const sd3 = sdist - r3;

      if (sd1 < 2) shadowAlpha = Math.max(shadowAlpha, 1 - smoothstep(-2, 2, sd1));
      if (sd2 < 2) shadowAlpha = Math.max(shadowAlpha, 1 - smoothstep(-2, 2, sd2));
      if (sd3 < 2) shadowAlpha = Math.max(shadowAlpha, 1 - smoothstep(-2, 2, sd3));
      
      // Apply shadow darkening
      if (shadowAlpha > 0) {
        const factor = 1 - shadowAlpha * 0.22;
        r = Math.round(r * factor);
        g = Math.round(g * factor);
        b = Math.round(b * factor);
      }

      // Target rings alpha
      const d1 = Math.abs(dist - r1) - w1 / 2;
      const d2 = Math.abs(dist - r2) - w2 / 2;
      const d3 = dist - r3;

      let whiteAlpha = 0;
      if (d1 < 1) whiteAlpha = Math.max(whiteAlpha, 1 - smoothstep(-0.8, 0.8, d1));
      if (d2 < 1) whiteAlpha = Math.max(whiteAlpha, 1 - smoothstep(-0.8, 0.8, d2));
      if (d3 < 1) whiteAlpha = Math.max(whiteAlpha, 1 - smoothstep(-0.8, 0.8, d3));

      // Blend white target onto gradient
      if (whiteAlpha > 0) {
        r = Math.round(r * (1 - whiteAlpha) + 255 * whiteAlpha);
        g = Math.round(g * (1 - whiteAlpha) + 255 * whiteAlpha);
        b = Math.round(b * (1 - whiteAlpha) + 255 * whiteAlpha);
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = Math.round(alphaCorner * 255);
    }
  }

  return encodePNG(size, size, buf);
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate apple-touch-icon (180x180), icon-192 (192x192), icon-512 (512x512)
const sizes = [
  { size: 180, filename: 'apple-touch-icon.png' },
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' }
];

for (const { size, filename } of sizes) {
  const filePath = path.join(publicDir, filename);
  const png = renderGoalTrackerIcon(size);
  fs.writeFileSync(filePath, png);
  console.log(`✅ Generated ${filename} (${size}x${size}, ${png.length} bytes)`);
}
