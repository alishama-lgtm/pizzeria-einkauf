'use strict';
// server/watcher.js — Inbox-Ordner beobachten & alle Dateiformate verarbeiten
// Unterstützt: PDF, JPG, JPEG, PNG, WEBP, XLSX, XLS, CSV, TXT, JSON
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');
const QUEUE_FILE = path.join(ROOT, 'inbox-queue.json');

// xlsx lazy-laden (optional — falls nicht installiert, XLSX deaktiviert)
let XLSX = null;
async function getXLSX() {
  if (XLSX) return XLSX;
  try {
    const mod = await import('xlsx');
    XLSX = mod.default || mod;
    return XLSX;
  } catch (_) {
    return null;
  }
}

// ── Dateitypen ───────────────────────────────────────────────────
const TYPE_GROUPS = {
  bild:  ['.jpg','.jpeg','.png','.webp','.gif','.bmp'],
  pdf:   ['.pdf'],
  excel: ['.xlsx','.xls','.ods'],
  csv:   ['.csv','.tsv','.txt'],
  json:  ['.json'],
};
const ALL_SUPPORTED = Object.values(TYPE_GROUPS).flat();

// ── Ordner-Definitionen ──────────────────────────────────────────
export const INBOX_FOLDERS = [
  {
    id:    'rechnungen',
    path:  path.join(ROOT, 'inbox', 'rechnungen'),
    label: 'Rechnungen',
    icon:  'receipt_long',
    color: '#610000',
    ext:   [...TYPE_GROUPS.pdf, ...TYPE_GROUPS.bild, ...TYPE_GROUPS.excel, ...TYPE_GROUPS.csv],
    hint:  'PDF, JPG, PNG, WEBP, XLSX, XLS, CSV',
  },
  {
    id:    'preise',
    path:  path.join(ROOT, 'inbox', 'preise'),
    label: 'Preislisten',
    icon:  'price_change',
    color: '#1565c0',
    ext:   [...TYPE_GROUPS.excel, ...TYPE_GROUPS.csv, ...TYPE_GROUPS.pdf, ...TYPE_GROUPS.bild],
    hint:  'XLSX, XLS, CSV, PDF, JPG, PNG',
  },
  {
    id:    'lieferanten',
    path:  path.join(ROOT, 'inbox', 'lieferanten'),
    label: 'Lieferanten',
    icon:  'local_shipping',
    color: '#2e7d32',
    ext:   [...TYPE_GROUPS.excel, ...TYPE_GROUPS.csv, ...TYPE_GROUPS.json, ...TYPE_GROUPS.pdf, ...TYPE_GROUPS.bild],
    hint:  'XLSX, XLS, CSV, JSON, PDF, JPG, PNG',
  },
  {
    id:    'lager',
    path:  path.join(ROOT, 'inbox', 'lager'),
    label: 'Lager',
    icon:  'inventory_2',
    color: '#e65100',
    ext:   [...TYPE_GROUPS.excel, ...TYPE_GROUPS.csv, ...TYPE_GROUPS.json, ...TYPE_GROUPS.pdf, ...TYPE_GROUPS.bild],
    hint:  'XLSX, XLS, CSV, JSON, PDF, JPG, PNG',
  },
];

// ── Queue ────────────────────────────────────────────────────────
function loadQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch(_) { return []; }
}
function saveQueue(q) {
  try { fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2), 'utf8'); } catch(_) {}
}

// ── Datei verarbeiten ────────────────────────────────────────────
async function processFile(folderDef, filename) {
  const ext = path.extname(filename).toLowerCase();
  if (!folderDef.ext.includes(ext)) return null;
  if (filename.startsWith('HIER-') || filename.endsWith('.md')) return null;

  const fullPath = path.join(folderDef.path, filename);
  if (!fs.existsSync(fullPath)) return null;

  const stat  = fs.statSync(fullPath);
  const entry = {
    id:       Date.now() + '_' + Math.random().toString(36).slice(2,7),
    folder:   folderDef.id,
    label:    folderDef.label,
    icon:     folderDef.icon,
    color:    folderDef.color,
    filename,
    path:     fullPath,
    ext,
    fileType: getFileTypeName(ext),
    size:     stat.size,
    sizeHuman: formatBytes(stat.size),
    added:    new Date().toISOString(),
    status:   'pending',
    data:     null,
    error:    null,
  };

  try {
    // ── XLSX / XLS ───────────────────────────────────────────────
    if (TYPE_GROUPS.excel.includes(ext)) {
      const xls = await getXLSX();
      if (xls) {
        const wb   = xls.readFile(fullPath);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json  = xls.utils.sheet_to_json(sheet, { defval: '' });
        // Spaltennamen normalisieren
        const rows = json.map(row => {
          const out = {};
          for (const [k, v] of Object.entries(row)) out[k.trim().toLowerCase()] = String(v).trim();
          return out;
        });
        entry.data = { rows, count: rows.length, type: folderDef.id, source: filename, sheet: wb.SheetNames[0] };
      } else {
        entry.data    = null;
        entry.status  = 'error';
        entry.error   = 'xlsx-Paket nicht installiert — npm install ausführen';
      }
    }

    // ── CSV / TXT / TSV ──────────────────────────────────────────
    else if (TYPE_GROUPS.csv.includes(ext)) {
      const raw  = fs.readFileSync(fullPath, 'utf8');
      entry.data = parseCsv(folderDef.id, raw, filename);
    }

    // ── JSON ─────────────────────────────────────────────────────
    else if (TYPE_GROUPS.json.includes(ext)) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      entry.data = { rows, count: rows.length, type: folderDef.id, source: filename };
    }

    // ── PDF / Bild ───────────────────────────────────────────────
    else if (TYPE_GROUPS.pdf.includes(ext) || TYPE_GROUPS.bild.includes(ext)) {
      entry.data = parseFilename(filename, folderDef.id);
    }

  } catch (e) {
    entry.status = 'error';
    entry.error  = e.message;
    console.error(`  [Inbox] Fehler beim Verarbeiten: ${filename}:`, e.message);
  }

  return entry;
}

// ── CSV Parser ───────────────────────────────────────────────────
function parseCsv(folderId, raw, filename) {
  // BOM entfernen
  const cleaned = raw.replace(/^\uFEFF/, '');
  const lines   = cleaned.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) return { rows: [], count: 0, type: folderId, source: filename };

  // Trennzeichen erkennen: ; oder , oder Tab
  const firstLine = lines[0];
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const heads = firstLine.split(sep).map(h => h.trim().replace(/^"|"$/g,'').toLowerCase());
  const rows  = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (cols.length < 2) continue;
    const row = {};
    heads.forEach((h, idx) => { row[h] = (cols[idx] || '').trim(); });
    rows.push(row);
  }

  return { rows, count: rows.length, type: folderId, source: filename };
}

// CSV-Zeile korrekt aufteilen (berücksichtigt Anführungszeichen)
function splitCsvLine(line, sep) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === sep && !inQ) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// ── Dateiname parsen ─────────────────────────────────────────────
// Erkannte Formate:
//   2026-04-14_Metro_245.50.pdf
//   14.04.2026_UM-Trade_312.00.jpg
//   Metro_Rechnung_April.pdf      (kein Datum → heute)
function parseFilename(filename, folderId) {
  const name  = path.basename(filename, path.extname(filename));
  const parts = name.split(/[_\-\s\.]+/).filter(Boolean);

  // Datum suchen
  let datum = null;
  for (const p of parts) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) { datum = p; break; }
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(p)) {
      const [d,m,y] = p.split('.');
      datum = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
      break;
    }
    if (/^\d{8}$/.test(p)) {
      datum = `${p.slice(0,4)}-${p.slice(4,6)}-${p.slice(6,8)}`;
      break;
    }
  }
  if (!datum) datum = new Date().toISOString().slice(0,10);

  // Betrag suchen (letzter nummerischer Teil mit Dezimalstelle oder >10)
  let betrag = null;
  for (let i = parts.length - 1; i >= 0; i--) {
    const n = parseFloat(parts[i].replace(',','.'));
    if (!isNaN(n) && n > 0 && (parts[i].includes('.') || parts[i].includes(',') || n > 10)) {
      betrag = Math.round(n * 100) / 100;
      break;
    }
  }

  // Lieferant = Teile ohne Datum und ohne Betrag
  const skipTokens = new Set([
    datum, datum.replace(/-/g,''),
    betrag != null ? betrag.toString() : null,
    betrag != null ? betrag.toFixed(2) : null,
    'pdf','jpg','jpeg','png','webp','xlsx','xls','csv',
    'rechnung','rechnungen','invoice','beleg','lieferung',
  ].filter(Boolean).map(s => s.toLowerCase()));

  const lieferantParts = parts.filter(p => {
    const pl = p.toLowerCase();
    if (skipTokens.has(pl)) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return false;
    if (/^\d{8}$/.test(p)) return false;
    if (/^\d+([.,]\d+)?$/.test(p)) return false;
    return true;
  });

  const lieferant = lieferantParts.join(' ').trim() || 'Unbekannt';

  return { datum, lieferant, betrag, typ: folderId, dateiname: filename };
}

// ── Hilfsfunktionen ──────────────────────────────────────────────
function getFileTypeName(ext) {
  if (TYPE_GROUPS.pdf.includes(ext))   return 'PDF';
  if (TYPE_GROUPS.bild.includes(ext))  return 'Bild';
  if (TYPE_GROUPS.excel.includes(ext)) return 'Excel';
  if (TYPE_GROUPS.csv.includes(ext))   return 'CSV';
  if (TYPE_GROUPS.json.includes(ext))  return 'JSON';
  return ext.replace('.','').toUpperCase();
}

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Watcher ──────────────────────────────────────────────────────
let broadcastFn = null;
export function setBroadcast(fn) { broadcastFn = fn; }

export function startWatcher() {
  for (const f of INBOX_FOLDERS) {
    if (!fs.existsSync(f.path)) {
      fs.mkdirSync(f.path, { recursive: true });
    }
  }

  console.log('  [Inbox] Ordner-Watcher aktiv:');
  INBOX_FOLDERS.forEach(f => console.log(`    → inbox/${f.id}/  (${f.hint})`));

  for (const folder of INBOX_FOLDERS) {
    fs.watch(folder.path, { persistent: false }, (eventType, filename) => {
      if (!filename || eventType !== 'rename') return;
      setTimeout(async () => {
        const entry = await processFile(folder, filename);
        if (!entry) return;

        const queue = loadQueue();
        const dup = queue.find(e =>
          e.folder === folder.id && e.filename === filename &&
          Date.now() - new Date(e.added).getTime() < 60000
        );
        if (dup) return;

        queue.push(entry);
        saveQueue(queue);

        const icon = entry.status === 'error' ? '⚠' : '✓';
        console.log(`  [Inbox] ${icon} ${folder.id}/${filename} (${entry.fileType}, ${entry.sizeHuman})`);

        if (broadcastFn) {
          broadcastFn({
            type: 'inbox_update',
            entry: {
              id: entry.id, folder: entry.folder, label: entry.label,
              icon: entry.icon, color: entry.color, filename: entry.filename,
              fileType: entry.fileType, sizeHuman: entry.sizeHuman,
              status: entry.status, data: entry.data, added: entry.added,
              error: entry.error,
            },
          });
        }
      }, 800);
    });
  }
}

// ── Queue API ────────────────────────────────────────────────────
export function getQueue(folder) {
  const q = loadQueue();
  return folder ? q.filter(e => e.folder === folder) : q;
}

export function markDone(id) {
  const q = loadQueue();
  const e = q.find(x => x.id === id);
  if (e) { e.status = 'processed'; e.processedAt = new Date().toISOString(); }
  saveQueue(q);
  return !!e;
}

export function deleteEntry(id) {
  saveQueue(loadQueue().filter(x => x.id !== id));
}

export function clearProcessed() {
  const q = loadQueue().filter(e => e.status !== 'processed');
  saveQueue(q);
  return q.length;
}

// Alle Ordner-Infos für die App
export function getFolderInfo() {
  return INBOX_FOLDERS.map(f => ({
    id: f.id, label: f.label, icon: f.icon, color: f.color, hint: f.hint,
  }));
}
