// Icon-Generator für Pizzeria San Carino PWA
// Verwendet nur Node.js built-in (zlib) — kein npm install nötig
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// CRC32-Tabelle für PNG
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length);
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([lb, tb, data, cb]);
}

function makePNG(size, pixels) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  // Filterbyte (0 = None) + RGB rows
  const rowBytes = size * 3;
  const raw = Buffer.alloc((rowBytes + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (rowBytes + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const pi = (y * size + x) * 3;
      const ri = y * (rowBytes + 1) + 1 + x * 3;
      raw[ri] = pixels[pi]; raw[ri+1] = pixels[pi+1]; raw[ri+2] = pixels[pi+2];
    }
  }

  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 3);
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.28;

  // Hintergrundfarbe: Weiß (#fff8f6)
  const BG  = [255, 248, 246];
  // Primärfarbe: Dunkelrot (#8B0000)
  const RED = [139, 0, 0];
  // Hellrot für inneren Kreis
  const LR  = [180, 30, 30];
  // Weiß
  const WH  = [255, 255, 255];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > outerR) {
        // Außen: App-Hintergrund
        pixels[i] = BG[0]; pixels[i+1] = BG[1]; pixels[i+2] = BG[2];
      } else if (dist > innerR) {
        // Äußerer Ring: Dunkelrot
        pixels[i] = RED[0]; pixels[i+1] = RED[1]; pixels[i+2] = RED[2];
      } else {
        // Innerer Kreis: Hellrot
        pixels[i] = LR[0]; pixels[i+1] = LR[1]; pixels[i+2] = LR[2];
      }

      // Weißes "SC" – grobe Pixel-Buchstaben
      const rel = size / 192;
      // S — links oben im inneren Kreis
      const sx = Math.round(cx - 12 * rel), sy = Math.round(cy - 8 * rel);
      if (
        // S oben waagerecht
        (y >= sy && y < sy + Math.ceil(2*rel) && x >= sx && x < sx + Math.ceil(10*rel)) ||
        // S mitte waagerecht
        (y >= sy + Math.ceil(6*rel) && y < sy + Math.ceil(8*rel) && x >= sx && x < sx + Math.ceil(10*rel)) ||
        // S unten waagerecht
        (y >= sy + Math.ceil(13*rel) && y < sy + Math.ceil(15*rel) && x >= sx && x < sx + Math.ceil(10*rel)) ||
        // S links oben senkrecht
        (y >= sy && y < sy + Math.ceil(8*rel) && x >= sx && x < sx + Math.ceil(2*rel)) ||
        // S rechts unten senkrecht
        (y >= sy + Math.ceil(7*rel) && y < sy + Math.ceil(15*rel) && x >= sx + Math.ceil(8*rel) && x < sx + Math.ceil(10*rel))
      ) {
        if (dist < innerR) { pixels[i] = WH[0]; pixels[i+1] = WH[1]; pixels[i+2] = WH[2]; }
      }

      // C — rechts oben
      const cx2 = Math.round(cx + 2 * rel), cy2 = Math.round(cy - 8 * rel);
      if (
        (y >= cy2 && y < cy2 + Math.ceil(2*rel) && x >= cx2 && x < cx2 + Math.ceil(10*rel)) ||
        (y >= cy2 + Math.ceil(13*rel) && y < cy2 + Math.ceil(15*rel) && x >= cx2 && x < cx2 + Math.ceil(10*rel)) ||
        (y >= cy2 && y < cy2 + Math.ceil(15*rel) && x >= cx2 && x < cx2 + Math.ceil(2*rel))
      ) {
        if (dist < innerR) { pixels[i] = WH[0]; pixels[i+1] = WH[1]; pixels[i+2] = WH[2]; }
      }
    }
  }
  return pixels;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
for (const size of sizes) {
  const pixels = drawIcon(size);
  const buf    = makePNG(size, pixels);
  const name   = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  fs.writeFileSync(path.join(iconsDir, name), buf);
  console.log(`✓ icons/${name} (${size}x${size})`);
}

// favicon.png (32x32)
const favPixels = drawIcon(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.png'), makePNG(32, favPixels));
console.log('✓ icons/favicon.png (32x32)');

console.log('\nAlle Icons erstellt!');
