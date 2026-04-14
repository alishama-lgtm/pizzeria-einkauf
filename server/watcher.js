'use strict';
// server/watcher.js — Inbox-Ordner beobachten & Dateien verarbeiten
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');
const QUEUE_FILE = path.join(ROOT, 'inbox-queue.json');

// ── Ordner-Definitionen ──────────────────────────────────────────
const INBOX_FOLDERS = [
  { id: 'rechnungen', path: path.join(ROOT, 'inbox', 'rechnungen'), label: 'Rechnungen',  icon: 'receipt_long',  ext: ['.pdf','.jpg','.jpeg','.png'] },
  { id: 'preise',     path: path.join(ROOT, 'inbox', 'preise'),     label: 'Preislisten', icon: 'price_change',  ext: ['.csv','.txt'] },
  { id: 'lieferanten',path: path.join(ROOT, 'inbox', 'lieferanten'),label: 'Lieferanten', icon: 'local_shipping',ext: ['.csv','.txt','.json'] },
  { id: 'lager',      path: path.join(ROOT, 'inbox', 'lager'),      label: 'Lager',       icon: 'inventory_2',   ext: ['.csv','.txt'] },
];

// ── Queue (persistente Liste unverarbeiteter Dateien) ────────────
function loadQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch(_) { return []; }
}
function saveQueue(q) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2), 'utf8');
}

// ── Neue Datei verarbeiten ───────────────────────────────────────
function processFile(folder, filename) {
  const ext  = path.extname(filename).toLowerCase();
  const def  = INBOX_FOLDERS.find(f => f.id === folder.id);
  if (!def || !def.ext.includes(ext)) return null;
  if (filename.startsWith('HIER-') || filename.endsWith('.md')) return null;

  const fullPath = path.join(folder.path, filename);
  if (!fs.existsSync(fullPath)) return null;

  const stat = fs.statSync(fullPath);
  const entry = {
    id:       Date.now() + '_' + Math.random().toString(36).slice(2,7),
    folder:   folder.id,
    label:    def.label,
    icon:     def.icon,
    filename,
    path:     fullPath,
    ext,
    size:     stat.size,
    added:    new Date().toISOString(),
    status:   'pending',   // pending | processed | error
    data:     null,
  };

  // ── CSV parsen (Preise / Lieferanten / Lager) ─────────────────
  if (ext === '.csv' || ext === '.txt') {
    try {
      const raw  = fs.readFileSync(fullPath, 'utf8');
      entry.data = parseCsv(folder.id, raw, filename);
    } catch(e) {
      entry.status = 'error';
      entry.error  = e.message;
    }
  }

  // ── PDF / Bild: Metadaten aus Dateiname ──────────────────────
  if (['.pdf','.jpg','.jpeg','.png'].includes(ext)) {
    entry.data = parseFilename(filename);
  }

  return entry;
}

// ── CSV Parser ───────────────────────────────────────────────────
function parseCsv(folderId, raw, filename) {
  const lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) return { rows: [], count: 0 };

  const sep   = lines[0].includes(';') ? ';' : ',';
  const heads = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const rows  = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g,''));
    if (cols.length < 2) continue;
    const row = {};
    heads.forEach((h, idx) => { row[h] = cols[idx] || ''; });
    rows.push(row);
  }

  return { rows, count: rows.length, type: folderId, source: filename };
}

// ── Dateiname-Parser für PDFs/Bilder ────────────────────────────
// Format: YYYY-MM-DD_Lieferant_Betrag.pdf
function parseFilename(filename) {
  const name  = path.basename(filename, path.extname(filename));
  const parts = name.split(/[_\-\s]+/);

  // Datum suchen
  let datum = null;
  for (const p of parts) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) { datum = p; break; }
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(p)) {
      const [d,m,y] = p.split('.');
      datum = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
      break;
    }
  }
  if (!datum) datum = new Date().toISOString().slice(0,10);

  // Betrag suchen (letzter nummerischer Teil)
  let betrag = null;
  for (let i = parts.length - 1; i >= 0; i--) {
    const n = parseFloat(parts[i].replace(',','.'));
    if (!isNaN(n) && n > 0) { betrag = n; break; }
  }

  // Lieferant = alles was kein Datum und kein Betrag ist
  const datumParts = new Set([datum, datum.replace(/-/g,''), betrag?.toString()]);
  const lieferant = parts
    .filter(p => !datumParts.has(p) && !/^\d{4}-\d{2}-\d{2}$/.test(p) && isNaN(parseFloat(p.replace(',','.'))))
    .join(' ').trim() || 'Unbekannt';

  return { datum, lieferant, betrag, typ: 'rechnung', dateiname: filename };
}

// ── Watcher starten ──────────────────────────────────────────────
let broadcastFn = null;

export function setBroadcast(fn) {
  broadcastFn = fn;
}

export function startWatcher() {
  // Sicherstellen dass alle Ordner existieren
  for (const f of INBOX_FOLDERS) {
    if (!fs.existsSync(f.path)) {
      fs.mkdirSync(f.path, { recursive: true });
      console.log(`  [Inbox] Ordner erstellt: inbox/${f.id}/`);
    }
  }

  console.log('  [Inbox] Ordner-Watcher gestartet:');
  INBOX_FOLDERS.forEach(f => console.log(`    → inbox/${f.id}/`));

  for (const folder of INBOX_FOLDERS) {
    fs.watch(folder.path, { persistent: false }, (eventType, filename) => {
      if (!filename || eventType !== 'rename') return;
      // kurz warten damit Datei vollständig geschrieben ist
      setTimeout(() => {
        const entry = processFile(folder, filename);
        if (!entry) return;

        const queue = loadQueue();
        // Duplikat-Check (gleicher Dateiname in letzten 60 Sek.)
        const dup = queue.find(e => e.folder === folder.id && e.filename === filename &&
          Date.now() - new Date(e.added).getTime() < 60000);
        if (dup) return;

        queue.push(entry);
        saveQueue(queue);

        console.log(`  [Inbox] Neue Datei: ${folder.id}/${filename} → ${entry.status}`);

        // WebSocket-Benachrichtigung an App
        if (broadcastFn) {
          broadcastFn({ type: 'inbox_update', entry: {
            id: entry.id, folder: entry.folder, label: entry.label,
            icon: entry.icon, filename: entry.filename, status: entry.status,
            data: entry.data, added: entry.added,
          }});
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
  const q = loadQueue().filter(x => x.id !== id);
  saveQueue(q);
}

export function clearProcessed() {
  const q = loadQueue().filter(e => e.status !== 'processed');
  saveQueue(q);
  return q.length;
}
