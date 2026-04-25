'use strict';
import 'dotenv/config';

// ── Globale Fehler-Handler ────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.message);
});
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { createClient as createTursoClient } from '@libsql/client';
import { startWatcher, setBroadcast, getQueue, markDone, deleteEntry, clearProcessed, getFolderInfo } from './server/watcher.js';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const pdfParse = _require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ── SQLite Preishistorie ──────────────────────────────────────────────
const db = new DatabaseSync(path.join(__dirname, 'pizzeria.db'));
// Schema-Migration: alte Tabelle (geschaeft-Schema) auf neues Schema migrieren
const oldSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='preishistorie'").get();
if (oldSchema && oldSchema.sql && oldSchema.sql.includes('geschaeft')) {
  console.log('  DB Migration: altes Schema erkannt → Tabelle wird neu erstellt');
  db.exec('DROP TABLE IF EXISTS preishistorie');
}
db.exec(`
  CREATE TABLE IF NOT EXISTS preishistorie (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    produkt_id  TEXT,
    produkt     TEXT NOT NULL,
    preis       REAL NOT NULL,
    normalpreis REAL,
    shop        TEXT,
    shop_id     TEXT,
    datum       TEXT NOT NULL,
    quelle      TEXT DEFAULT 'kassenbon'
  )
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_ph_produkt ON preishistorie(produkt_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_ph_datum   ON preishistorie(datum)');

db.exec(`
  CREATE TABLE IF NOT EXISTS umsatz_einnahmen (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    datum        TEXT NOT NULL,
    kasse        REAL DEFAULT 0,
    lieferdienst REAL DEFAULT 0,
    notiz        TEXT DEFAULT '',
    created_at   TEXT DEFAULT (date('now'))
  )
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_ue_datum ON umsatz_einnahmen(datum)');
db.exec(`
  CREATE TABLE IF NOT EXISTS app_data (
    key        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS rechnungen (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    dateiname    TEXT NOT NULL,
    dateipfad    TEXT NOT NULL,
    lieferant    TEXT DEFAULT '',
    betrag       REAL DEFAULT 0,
    datum        TEXT DEFAULT '',
    typ          TEXT DEFAULT 'pdf',
    notiz        TEXT DEFAULT '',
    created_at   TEXT DEFAULT (date('now'))
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS mitarbeiter (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    rolle        TEXT DEFAULT 'Küche',
    stunden      REAL DEFAULT 0,
    lohn         REAL DEFAULT 0,
    farbe        TEXT DEFAULT '#8B0000',
    created_at   TEXT DEFAULT (date('now'))
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS kassenbuch (
    id           TEXT PRIMARY KEY,
    datum        TEXT NOT NULL,
    typ          TEXT NOT NULL,
    beschreibung TEXT NOT NULL,
    netto        REAL NOT NULL DEFAULT 0,
    mwst_satz    REAL NOT NULL DEFAULT 0,
    mwst_betrag  REAL NOT NULL DEFAULT 0,
    brutto       REAL NOT NULL DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now'))
  )
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_kb_datum ON kassenbuch(datum)');
db.exec('CREATE INDEX IF NOT EXISTS idx_kb_typ   ON kassenbuch(typ)');
console.log('  SQLite Kassenbuch bereit');

// ── Turso Cloud DB ─────────────────────────────────────────────────────────
const turso = (process.env.TURSO_URL && process.env.TURSO_TOKEN)
  ? createTursoClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN })
  : null;
if (turso) console.log('  ☁️  Turso Cloud verbunden:', process.env.TURSO_URL);
else console.log('  ⚠️  Kein Turso konfiguriert (nur lokal)');

async function tursoInitTables() {
  if (!turso) return;
  await turso.batch([
    { sql: `CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS kassenbuch (id TEXT PRIMARY KEY, datum TEXT NOT NULL, typ TEXT NOT NULL, beschreibung TEXT NOT NULL, netto REAL NOT NULL DEFAULT 0, mwst_satz REAL NOT NULL DEFAULT 0, mwst_betrag REAL NOT NULL DEFAULT 0, brutto REAL NOT NULL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS mitarbeiter (id TEXT PRIMARY KEY, name TEXT NOT NULL, rolle TEXT DEFAULT 'Küche', stunden REAL DEFAULT 0, lohn REAL DEFAULT 0, farbe TEXT DEFAULT '#8B0000', created_at TEXT DEFAULT (date('now')))`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS dokumente (id TEXT PRIMARY KEY, name TEXT NOT NULL, typ TEXT DEFAULT 'sonstige', monat TEXT DEFAULT '', status TEXT DEFAULT 'offen', groesse INTEGER DEFAULT 0, erstellt TEXT DEFAULT (datetime('now')))`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS dokumente_data (id TEXT PRIMARY KEY, data TEXT NOT NULL)`, args: [] },
  ], 'write');
  console.log('  ☁️  Turso: Tabellen OK');
}

async function tursoPushAll() {
  if (!turso) return;
  const adRows = db.prepare('SELECT key, data, updated_at FROM app_data').all();
  for (const r of adRows) {
    await turso.execute({ sql: "INSERT INTO app_data (key,data,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at", args: [r.key, r.data, r.updated_at || new Date().toISOString()] }).catch(e => console.error('[Turso]', e.message));
  }
  const kbRows = db.prepare('SELECT * FROM kassenbuch').all();
  for (const r of kbRows) {
    await turso.execute({ sql: 'INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)', args: [r.id, r.datum, r.typ, r.beschreibung, r.netto, r.mwst_satz, r.mwst_betrag, r.brutto] }).catch(e => console.error('[Turso]', e.message));
  }
  const maRows = db.prepare('SELECT * FROM mitarbeiter').all();
  for (const r of maRows) {
    await turso.execute({ sql: 'INSERT OR REPLACE INTO mitarbeiter (id,name,rolle,stunden,lohn,farbe) VALUES (?,?,?,?,?,?)', args: [r.id, r.name, r.rolle, r.stunden, r.lohn, r.farbe] }).catch(e => console.error('[Turso]', e.message));
  }
  console.log(`  ☁️  Turso Push: ${adRows.length} app_data, ${kbRows.length} kassenbuch, ${maRows.length} mitarbeiter`);
}

async function tursoPull() {
  if (!turso) return;
  const [adRes, kbRes, maRes] = await Promise.all([
    turso.execute('SELECT key, data, updated_at FROM app_data'),
    turso.execute('SELECT * FROM kassenbuch'),
    turso.execute('SELECT * FROM mitarbeiter'),
  ]);
  for (const r of adRes.rows) {
    db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at WHERE excluded.updated_at >= app_data.updated_at")
      .run(String(r.key), String(r.data), String(r.updated_at||''));
  }
  for (const r of kbRes.rows) {
    db.prepare('INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)')
      .run(String(r.id), String(r.datum), String(r.typ), String(r.beschreibung), parseFloat(String(r.netto))||0, parseFloat(String(r.mwst_satz))||0, parseFloat(String(r.mwst_betrag))||0, parseFloat(String(r.brutto))||0);
  }
  for (const r of maRes.rows) {
    db.prepare('INSERT OR REPLACE INTO mitarbeiter (id,name,rolle,stunden,lohn,farbe) VALUES (?,?,?,?,?,?)')
      .run(String(r.id), String(r.name), String(r.rolle)||'Küche', parseFloat(String(r.stunden))||0, parseFloat(String(r.lohn))||0, String(r.farbe)||'#8B0000');
  }
  console.log(`  ☁️  Turso Pull: ${adRes.rows.length} app_data, ${kbRes.rows.length} kassenbuch, ${maRes.rows.length} mitarbeiter`);
}

function tursoWriteAppData(key, data) {
  if (!turso) return;
  const now = new Date().toISOString().replace('T',' ').slice(0,19);
  turso.execute({ sql: "INSERT INTO app_data (key,data,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at", args: [key, data, now] })
    .catch(e => console.error('  Turso app_data:', e.message));
}
function tursoWriteKb(e) {
  if (!turso) return;
  turso.execute({ sql: 'INSERT OR REPLACE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)', args: [e.id, e.datum, e.typ, e.beschreibung, e.netto||0, e.mwst_satz||0, e.mwst_betrag||0, e.brutto||0] })
    .catch(err => console.error('  Turso kb:', err.message));
}
function tursoDeleteKb(id) {
  if (!turso) return;
  turso.execute({ sql: 'DELETE FROM kassenbuch WHERE id=?', args: [id] }).catch(e => console.error('[Turso]', e.message));
}
function tursoWriteMa(ma) {
  if (!turso) return;
  turso.execute({ sql: 'INSERT OR REPLACE INTO mitarbeiter (id,name,rolle,stunden,lohn,farbe) VALUES (?,?,?,?,?,?)', args: [ma.id, ma.name, ma.rolle||'Küche', ma.stunden||0, ma.lohn||0, ma.farbe||'#8B0000'] })
    .catch(e => console.error('  Turso ma:', e.message));
}
function tursoDeleteMa(id) {
  if (!turso) return;
  turso.execute({ sql: 'DELETE FROM mitarbeiter WHERE id=?', args: [id] }).catch(e => console.error('[Turso]', e.message));
}

const phInsert = db.prepare(`
  INSERT INTO preishistorie (produkt_id, produkt, preis, normalpreis, shop, shop_id, datum, quelle)
  VALUES ($produkt_id, $produkt, $preis, $normalpreis, $shop, $shop_id, $datum, $quelle)
`);
console.log('  SQLite Preishistorie bereit →', path.join(__dirname, 'pizzeria.db'));

// Heisse-Preise Cache-Datei (im selben Ordner)
const HP_CACHE_FILE = path.join(__dirname, 'hp-cache.json');
const HP_CACHE_AGE  = 24 * 60 * 60 * 1000; // 24 Stunden

// ── CORS: nur localhost + LAN ─────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / direkt
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)(:\d+)?/.test(origin)) return cb(null, true);
    cb(new Error('CORS nicht erlaubt'));
  }
}));

// ── IP-Whitelist: nur localhost + LAN auf /api ────────────────────────
const requireLocalIP = (req, res, next) => {
  const ip = (req.ip || req.connection?.remoteAddress || '').replace('::ffff:','');
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return next();
  console.warn(`[SECURITY] Zugriff verweigert von IP: ${ip} → ${req.url}`);
  res.status(403).json({ error: 'Kein Zugriff' });
};

// ── Sensible Dateien: .env und .db blockieren ────────────────────────
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (p === '/.env' || p.endsWith('.db')) {
    console.warn(`[SECURITY] Blockiert: ${req.path}`);
    return res.status(403).type('text').send('Kein Zugriff');
  }
  next();
});

// ── users.js: explizite Route, nur localhost/LAN ──────────────────────
app.get('/users.js', requireLocalIP, (req, res) => {
  const usersFile = path.join(__dirname, 'users.js');
  if (fs.existsSync(usersFile)) {
    res.type('application/javascript').sendFile(usersFile);
  } else {
    // Fallback damit App nicht crasht
    res.type('application/javascript').send('const PIZZERIA_USERS = [];');
  }
});

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method} ${req.url}`);
  next();
});

// ── DB-Viewer (Admin) ─────────────────────────────────────────────
app.get('/db-viewer', (_req, res) => {
  const tables = {
    kassenbuch: db.prepare('SELECT * FROM kassenbuch ORDER BY datum DESC LIMIT 200').all(),
    mitarbeiter: db.prepare('SELECT * FROM mitarbeiter ORDER BY name').all(),
    app_data: db.prepare('SELECT key, length(data) as bytes, updated_at FROM app_data ORDER BY updated_at DESC').all(),
  };

  // PDF-Ordner scannen
  const pdfFolders = [
    { key: 'lohnabrechnungen', label: '👔 Lohnabrechnungen', tab: 'Buchhaltung-Tab', path: path.join(__dirname, 'datenbank', 'lohnabrechnungen') },
    { key: 'rechnungen',       label: '🧾 Rechnungen',        tab: 'Rechnungen-Tab', path: path.join(__dirname, 'inbox', 'rechnungen') },
    { key: 'db_rechnungen',    label: '📁 Rechnungen (DB)',    tab: 'Rechnungen-Tab', path: path.join(__dirname, 'datenbank', 'rechnungen') },
  ];
  const folderScans = pdfFolders.map(f => {
    let files = [];
    try { files = fs.readdirSync(f.path).filter(n => /\.(pdf|jpg|jpeg|png|xlsx|csv)$/i.test(n)); } catch(_) {}
    return { ...f, files };
  });

  const tursoStatus = turso ? `✅ Turso verbunden: ${process.env.TURSO_URL}` : '❌ Turso nicht konfiguriert';
  const kbEin = tables.kassenbuch.filter(r=>r.typ==='einnahme').reduce((s,r)=>s+parseFloat(r.brutto||0),0);
  const kbAus = tables.kassenbuch.filter(r=>r.typ==='ausgabe').reduce((s,r)=>s+parseFloat(r.brutto||0),0);

  const tbl = (arr, cols, rowFn) => arr.length === 0
    ? '<p style="color:#8d6562;font-size:12px;padding:8px">— Keine Einträge —</p>'
    : `<div style="overflow-x:auto"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${arr.map(rowFn).join('')}</tbody></table></div>`;

  const kbRows = tbl(tables.kassenbuch,
    ['Datum','Typ','Beschreibung','Netto €','MwSt','Brutto €'],
    r => `<tr><td>${r.datum||''}</td><td><span class="badge ${r.typ}">${r.typ==='einnahme'?'+ Einnahme':'− Ausgabe'}</span></td><td>${r.beschreibung||''}</td><td class="num">${parseFloat(r.netto||0).toFixed(2).replace('.',',')}</td><td class="num">${r.mwst_satz||0}%</td><td class="num"><strong>${parseFloat(r.brutto||0).toFixed(2).replace('.',',')}</strong></td></tr>`);

  const maRows = tbl(tables.mitarbeiter,
    ['Name','Rolle','Std/Wo','Lohn €/h'],
    r => `<tr><td><strong>${r.name}</strong></td><td>${r.rolle||'—'}</td><td class="num">${r.stunden||0}</td><td class="num">${parseFloat(r.lohn||0).toFixed(2).replace('.',',')}</td></tr>`);

  const adRows = tbl(tables.app_data,
    ['Key','Größe','Geändert'],
    r => `<tr><td><code>${r.key}</code></td><td class="num">${r.bytes} B</td><td>${r.updated_at||'—'}</td></tr>`);

  const folderHtml = folderScans.map(f => `
    <div class="folder-card">
      <div class="folder-head">
        <span class="folder-title">${f.label}</span>
        <span class="folder-tab">→ ${f.tab}</span>
        <span class="count">${f.files.length} Dateien</span>
      </div>
      <div class="folder-path"><code>${f.path}</code></div>
      ${f.files.length > 0
        ? `<ul class="file-list">${f.files.map(fn=>`<li>📄 ${fn}</li>`).join('')}</ul>`
        : '<p class="empty">Noch keine Dateien</p>'}
    </div>`).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DB Viewer — Pizzeria San Carino</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f5f0ef;color:#261816;padding:16px;max-width:1200px;margin:0 auto}
h1{color:#8B0000;margin-bottom:4px;font-size:20px}
.meta{font-size:12px;color:#8d6562;margin-bottom:16px}
.turso{font-size:12px;padding:8px 14px;border-radius:8px;background:#e8f5e9;color:#1b5e20;margin-bottom:16px;font-weight:600}
.section{background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866}
.section h2{font-size:13px;font-weight:800;color:#261816;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.count{font-size:11px;background:#f3ebe9;color:#8B0000;padding:2px 8px;border-radius:10px;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:12px}
thead tr{background:#f9f4f3}
th{padding:7px 10px;text-align:left;font-size:11px;color:#8d6562;font-weight:700;border-bottom:2px solid #e3beb8;white-space:nowrap}
td{padding:7px 10px;border-bottom:1px solid #f0e8e6;vertical-align:middle}
tr:hover td{background:#fdf8f7}
.num{text-align:right;font-family:monospace;font-size:11px}
.badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
.badge.einnahme{background:#e8f5e9;color:#2e7d32}
.badge.ausgabe{background:#ffebee;color:#c62828}
code{font-size:10px;background:#f3ebe9;padding:1px 5px;border-radius:4px;color:#610000;word-break:break-all}
.totals{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:2px solid #e3beb8}
.total-item{font-size:13px;font-weight:800}
.nav{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.nav a{padding:6px 14px;background:#8B0000;color:#fff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700}
.nav a.sec{background:#fff;color:#8B0000;border:1.5px solid #e3beb8}
/* Ordner */
.how-to{background:#fffde7;border:1.5px solid #f9a825;border-radius:12px;padding:14px;margin-bottom:16px;font-size:12px}
.how-to h3{color:#e65100;font-size:13px;margin-bottom:8px}
.how-to ol{padding-left:18px;line-height:1.9}
.how-to strong{color:#261816}
.folder-card{background:#f9f4f3;border-radius:10px;padding:12px;margin-bottom:10px;border:1px solid #e3beb8}
.folder-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.folder-title{font-weight:700;font-size:13px}
.folder-tab{font-size:11px;color:#1565c0;background:#e3f2fd;padding:2px 8px;border-radius:10px}
.folder-path{font-size:10px;color:#8d6562;margin-bottom:6px}
.file-list{list-style:none;font-size:12px;display:flex;flex-wrap:wrap;gap:6px}
.file-list li{background:#fff;border:1px solid #e3beb8;border-radius:6px;padding:3px 8px}
.empty{font-size:11px;color:#8d6562;font-style:italic}
@media(max-width:600px){table{font-size:11px}td,th{padding:5px 6px}}
</style></head><body>
<h1>🗄️ Datenbank — Pizzeria San Carino</h1>
<p class="meta">Ali Shama KG · Stand: ${new Date().toLocaleString('de-AT')}</p>
<div class="turso">${tursoStatus}</div>

<div class="nav">
  <a href="#pdfs">📂 PDF-Ordner</a>
  <a href="#kassenbuch">💰 Kassenbuch</a>
  <a href="#mitarbeiter">👤 Mitarbeiter</a>
  <a href="#app_data">📦 App-Daten</a>
  <a href="/" class="sec">← App</a>
  <a href="/db-viewer" class="sec">🔄 Neu laden</a>
</div>

<!-- WIE PDFS EINLEGEN -->
<div class="how-to" id="pdfs">
  <h3>📂 PDFs manuell einlegen — so geht's:</h3>
  <ol>
    <li><strong>Steuerberater-Dokumente</strong> (Lohnzettel, ÖGK, UVA, Finanzamt...):<br>
    → App öffnen → <strong>Buchhaltung-Tab</strong> → PDF rein ziehen → Kategorie wählen → Hochladen</li>
    <li><strong>Lieferanten-Rechnungen</strong> (Metro, Billa, Etsan...):<br>
    → PDF in Ordner kopieren: <code>inbox\\rechnungen\\</code> → App erkennt es automatisch</li>
    <li><strong>Lohnabrechnungen vom Steuerberater</strong>:<br>
    → PDF in Ordner kopieren: <code>datenbank\\lohnabrechnungen\\</code></li>
  </ol>
</div>

<!-- ORDNER-ÜBERSICHT -->
<div class="section">
  <h2>📂 PDF-Ordner <span class="count">${folderScans.reduce((s,f)=>s+f.files.length,0)} Dateien gesamt</span></h2>
  ${folderHtml}
</div>

<!-- KASSENBUCH -->
<div class="section" id="kassenbuch">
  <h2>💰 Kassenbuch <span class="count">${tables.kassenbuch.length} Einträge</span></h2>
  ${kbRows}
  <div class="totals">
    <span class="total-item" style="color:#2e7d32">+ Einnahmen: € ${kbEin.toFixed(2).replace('.',',')}</span>
    <span class="total-item" style="color:#c62828">− Ausgaben: € ${kbAus.toFixed(2).replace('.',',')}</span>
    <span class="total-item" style="color:${kbEin-kbAus>=0?'#2e7d32':'#c62828'}">= Saldo: € ${(kbEin-kbAus).toFixed(2).replace('.',',')}</span>
  </div>
</div>

<!-- MITARBEITER -->
<div class="section" id="mitarbeiter">
  <h2>👤 Mitarbeiter <span class="count">${tables.mitarbeiter.length} Personen</span></h2>
  ${maRows}
</div>

<!-- APP-DATEN -->
<div class="section" id="app_data">
  <h2>📦 App-Daten (alle gespeicherten Bereiche) <span class="count">${tables.app_data.length} Keys</span></h2>
  ${adRows}
</div>
</body></html>`);
});


// ── Rate-Limiting: max 200 Requests / 15 Min pro IP ───────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen — bitte warte kurz' }
});
app.use('/api', limiter);

// ── API-Routen: nur localhost + LAN ───────────────────────────────────
app.use('/api', requireLocalIP);
app.use('/db-viewer', requireLocalIP);

// Statische Dateien ausliefern (index.html, js/, css/, sw.js etc.)
app.use(express.static(__dirname, { index: 'index.html' }));

// ── HTTP Client ───────────────────────────────────────────────────
const http = axios.create({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
    'Accept-Language': 'de-AT,de;q=0.9',
  }
});

function toNum(v) {
  const n = parseFloat(String(v || '').replace(',', '.'));
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

function makeItem(name, brand, shop, price, originalPrice, unit, source) {
  return {
    name:          String(name || '').trim(),
    brand:         String(brand || '').trim(),
    shop,
    price:         toNum(price),
    originalPrice: toNum(originalPrice) || null,
    unit:          String(unit || 'Stk').trim(),
    source,
    validFrom:     new Date().toISOString().slice(0, 10),
    validUntil:    '',
  };
}

// ════════════════════════════════════════════════════════════════════
// SPAR Austria — FactFinder API
// ════════════════════════════════════════════════════════════════════
async function searchSpar(q) {
  try {
    const { data } = await http.get(
      'https://search-spar.spar-ics.com/fact-finder/rest/v4/search/products_lmos_at',
      { params: { query: q, q, page: 1, hitsPerPage: 30 } }
    );

    return (data.hits || []).flatMap(hit => {
      const mv   = hit.masterValues || {};
      const name = [mv['title'], mv['short-description-2'], mv['short-description-3']]
                     .filter(Boolean).join(' ').trim();
      const price = toNum(mv['price'] ?? mv['best-price']);
      const orig  = toNum(mv['regular-price']);
      const brand = Array.isArray(mv['brand']) ? mv['brand'][0] : (mv['brand'] || '');
      const unit  = mv['short-description-3'] || mv['price-per-unit'] || 'Stk';

      if (!name || !price) return [];
      const originalPrice = (orig && orig > price) ? orig : null;
      return [makeItem(name, brand, 'Spar', price, originalPrice, unit, 'interspar.at')];
    });
  } catch (e) {
    console.error('  Spar Fehler:', e.message);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════
// Heisse-Preise.io — Billa, Hofer, Lidl, Interspar, Etsan, Penny
// ════════════════════════════════════════════════════════════════════
let hpData    = null;
let hpLoading = false;
let hpReady   = false;
let hpError   = null;

const STORE_DISPLAY = {
  billa:        'Billa',
  'billa plus': 'Billa Plus',
  interspar:    'Interspar',
  spar:         'Spar',
  hofer:        'Hofer',
  penny:        'Penny',
  etsan:        'Etsan',
  mpreis:       'Mpreis',
  unimarkt:     'Unimarkt',
};

async function loadHeissePreise() {
  if (hpLoading) return;
  hpLoading = true;
  hpError   = null;

  try {
    if (fs.existsSync(HP_CACHE_FILE)) {
      const stat = fs.statSync(HP_CACHE_FILE);
      if (Date.now() - stat.mtimeMs < HP_CACHE_AGE) {
        console.log('  Lade heisse-preise Daten aus Cache ...');
        const raw = fs.readFileSync(HP_CACHE_FILE, 'utf8');
        hpData  = JSON.parse(raw);
        hpReady = true;
        console.log(`  Heisse-Preise: ${hpData.length} Produkte geladen (aus Cache)`);
        hpLoading = false;
        return;
      }
    }

    console.log('  Lade heisse-preise.io Daten (einmalig, ~200MB) ...');
    console.log('  Dies dauert 1-2 Minuten, SPAR funktioniert bereits jetzt.');

    const { data } = await axios.get('https://heisse-preise.io/data/latest-canonical.json', {
      timeout: 120000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      responseType: 'text',
      maxContentLength: 300 * 1024 * 1024,
    });

    fs.writeFileSync(HP_CACHE_FILE, data);
    hpData  = JSON.parse(data);
    hpReady = true;
    console.log(`  Heisse-Preise: ${hpData.length} Produkte geladen (frisch)`);

  } catch (e) {
    hpError = e.message;
    console.error('  Heisse-Preise Fehler:', e.message);
    if (fs.existsSync(HP_CACHE_FILE)) {
      try {
        hpData  = JSON.parse(fs.readFileSync(HP_CACHE_FILE, 'utf8'));
        hpReady = true;
        console.log(`  Nutze alten Cache (${hpData.length} Produkte)`);
      } catch (_) {}
    }
  } finally {
    hpLoading = false;
  }
}

function searchHeissePreise(q) {
  if (!hpReady || !hpData) return [];

  const qLower = q.toLowerCase().trim();
  const words  = qLower.split(/\s+/).filter(Boolean);

  if (!hpData._unavailRate) {
    const rates = {};
    hpData.forEach(p => {
      if (!rates[p.store]) rates[p.store] = { t: 0, u: 0 };
      rates[p.store].t++;
      if (p.unavailable) rates[p.store].u++;
    });
    hpData._unavailRate = {};
    for (const [s, v] of Object.entries(rates)) hpData._unavailRate[s] = v.u / v.t;
  }

  const matched = hpData.filter(p => {
    if (!p.price || p.price <= 0) return false;
    if (!STORE_DISPLAY[p.store]) return false;
    const rate = hpData._unavailRate[p.store] || 0;
    if (p.unavailable && rate < 0.9) return false;
    const n = (p.name || '').toLowerCase();
    return words.every(w => n.includes(w));
  });

  const seen = new Map();
  for (const p of matched) {
    const key = p.store + '|' + (p.name || '').trim().toLowerCase();
    const existing = seen.get(key);
    if (!existing || p.price < existing.price) {
      seen.set(key, p);
    }
  }

  return Array.from(seen.values()).slice(0, 100).map(p => {
    const shop  = STORE_DISPLAY[p.store] || p.store;
    const name  = p.name || '';
    const price = p.price;
    const unit  = formatUnit(p.unit, p.quantity);

    let originalPrice = null;
    if (Array.isArray(p.priceHistory) && p.priceHistory.length >= 2) {
      const prev = p.priceHistory[p.priceHistory.length - 2]?.price;
      if (prev && prev > price) originalPrice = prev;
    }
    return makeItem(name, '', shop, price, originalPrice, unit, 'heisse-preise.io');
  });
}

function formatUnit(unit, quantity) {
  if (!unit) return 'Stk';
  const unitMap = { stk: 'Stk', l: 'l', ml: 'ml', kg: 'kg', g: 'g', cl: 'cl' };
  const u = unitMap[unit.toLowerCase()] || unit;
  return quantity ? `${quantity}${u}` : u;
}

// ════════════════════════════════════════════════════════════════════
// Routes
// ════════════════════════════════════════════════════════════════════
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    hpReady,
    hpLoading,
    hpItems:   hpData ? hpData.length : 0,
    hpError:   hpError || null,
    time:      new Date().toISOString(),
  });
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  console.log(`\n  Suche: "${q}"`);

  const [sparRes, hpRes] = await Promise.allSettled([
    searchSpar(q),
    Promise.resolve(searchHeissePreise(q)),
  ]);

  const spar = sparRes.value || [];
  const hp   = hpRes.value  || [];

  console.log(`  Spar: ${spar.length}  |  heisse-preise: ${hp.length}`);

  const hpFiltered = spar.length > 0
    ? hp.filter(r => !['Spar', 'Interspar'].includes(r.shop))
    : hp;

  const all = [...spar, ...hpFiltered]
    .filter(r => r.price !== null && r.price > 0)
    .sort((a, b) => (a.price || 999) - (b.price || 999));

  console.log(`  Gesamt: ${all.length} Ergebnisse\n`);

  if (!hpReady) {
    res.json({ items: all, notice: 'Billa/Hofer/Lidl-Daten werden noch geladen ...' });
  } else {
    res.json(all);
  }
});

app.get('/api/status', (_req, res) => {
  res.json({ hpReady, hpLoading, hpItems: hpData?.length || 0 });
});

// ════════════════════════════════════════════════════════════════════
// WebSocket Sync — Keys & Store
// ════════════════════════════════════════════════════════════════════
const SYNC_KEYS = [
  // Betrieb & Lager
  'pizzeria_lager', 'pizzeria_bestellung', 'pizzeria_fehlmaterial',
  'pizzeria_aufgaben', 'pizzeria_mitarbeiter', 'pizzeria_wochenplan',
  'pizzeria_dienstplan', 'pizzeria_schichtcheck', 'pizzeria_notifications',
  // Kasse & Buchhaltung
  'pizzeria_kassenbuch', 'pizzeria_kassenschnitt', 'pizzeria_tagesberichte',
  'pizzeria_umsatz_einnahmen', 'pizzeria_umsatz_ausgaben',
  'pizzeria_statistik', 'pizzeria_wareneinsatz',
  // Stammdaten
  'pizzeria_produkte', 'pizzeria_lieferanten', 'pizzeria_rezepte',
  'pizzeria_preisalarm_rules', 'pizzeria_custom_deals', 'pizzeria_verlauf',
  // Einstellungen
  'psc_schichtzeiten', 'psc_monatsziel', 'psc_drucker_ip', 'psc_drucker_port',
  'psc_pizza_groessen', 'psc_mindest_defaults', 'psc_personal_alarm_pct',
  'psc_haccp', 'psc_haccp_geraete', 'psc_mhd',
  'biz_fixkosten'
];

const syncStore = new Map();
const syncClients = new Set();

function broadcast(msg) {
  const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
  for (const c of syncClients) { if (c.readyState === 1) c.send(payload); }
}

const wss = new WebSocketServer({ noServer: true });

// ── WS-Token: einmalig beim Start generiert ───────────────────────────
const WS_TOKEN = crypto.randomBytes(24).toString('hex');

function handleUpgrade(server) {
  server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/ws/sync')) {
      // Token aus Query-String prüfen
      const urlObj = new URL(request.url, 'http://localhost');
      const token = urlObj.searchParams.get('token');
      if (token !== WS_TOKEN) {
        console.warn('[WS] Verbindung abgelehnt — ungültiger Token');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
}

// WS-Token API (nur localhost/LAN — requireLocalIP greift via /api)
app.get('/api/ws-token', (_req, res) => res.json({ token: WS_TOKEN }));

wss.on('connection', (ws, request) => {
  syncClients.add(ws);
  console.log('🔗 Sync-Client verbunden (' + syncClients.size + ' aktiv)');

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.action) {
        case 'sync_request': {
          const allData = {};
          for (const [key, val] of syncStore) {
            allData[key] = val;
          }
          ws.send(JSON.stringify({ action: 'sync_response', data: allData }));
          break;
        }

        case 'update':
          if (SYNC_KEYS.includes(msg.key)) {
            const dataStr = typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data);
            syncStore.set(msg.key, {
              data: msg.data,
              timestamp: msg.timestamp || Date.now(),
              updatedBy: msg.user || 'unknown'
            });
            // SQLite + Turso persistieren
            try { db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(msg.key, dataStr); } catch(e) { console.error('[App]', e.message); }
            tursoWriteAppData(msg.key, dataStr);
            const broadcast = JSON.stringify({
              action: 'remote_update',
              key: msg.key,
              data: msg.data,
              timestamp: msg.timestamp || Date.now(),
              updatedBy: msg.user || 'unknown'
            });
            for (const client of syncClients) {
              if (client !== ws && client.readyState === 1) {
                client.send(broadcast);
              }
            }
          }
          break;

        case 'bulk_update':
          if (Array.isArray(msg.updates)) {
            msg.updates.forEach(u => {
              if (SYNC_KEYS.includes(u.key)) {
                const existing = syncStore.get(u.key);
                if (!existing || u.timestamp > existing.timestamp) {
                  syncStore.set(u.key, {
                    data: u.data,
                    timestamp: u.timestamp,
                    updatedBy: u.user || 'unknown'
                  });
                  // SQLite + Turso persistieren
                  const dStr = typeof u.data === 'string' ? u.data : JSON.stringify(u.data);
                  try { db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(u.key, dStr); } catch(e) { console.error('[App]', e.message); }
                  tursoWriteAppData(u.key, dStr);
                }
              }
            });
            const fullState = {};
            for (const [key, val] of syncStore) {
              fullState[key] = val;
            }
            for (const client of syncClients) {
              if (client !== ws && client.readyState === 1) {
                client.send(JSON.stringify({ action: 'sync_response', data: fullState }));
              }
            }
          }
          break;
      }
    } catch (e) {
      console.error('WS Parse-Fehler:', e.message);
    }
  });

  ws.on('close', () => {
    syncClients.delete(ws);
    console.log('🔌 Sync-Client getrennt (' + syncClients.size + ' aktiv)');
  });

  ws.on('error', (err) => {
    console.error('WS Fehler:', err.message);
    syncClients.delete(ws);
  });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// ════════════════════════════════════════════════════════════════════
// Sync REST-API (Fallback)
// ════════════════════════════════════════════════════════════════════
app.use(express.json({ limit: '1mb' }));

app.get('/api/sync', (req, res) => {
  const data = {};
  for (const [key, val] of syncStore) {
    data[key] = val;
  }
  res.json(data);
});

app.get('/api/sync/:key', (req, res) => {
  const entry = syncStore.get(req.params.key);
  if (entry) {
    res.json(entry);
  } else {
    res.status(404).json({ error: 'Key nicht gefunden' });
  }
});

app.put('/api/sync/:key', (req, res) => {
  const key = req.params.key;
  if (!SYNC_KEYS.includes(key)) {
    return res.status(400).json({ error: 'Key nicht synchronisierbar' });
  }
  syncStore.set(key, {
    data: req.body.data,
    timestamp: Date.now(),
    updatedBy: req.body.user || 'unknown'
  });
  const broadcast = JSON.stringify({
    action: 'remote_update',
    key: key,
    data: req.body.data,
    timestamp: Date.now()
  });
  for (const client of syncClients) {
    if (client.readyState === 1) {
      client.send(broadcast);
    }
  }
  res.json({ success: true });
});

// Browser localStorage → SQLite + Turso (einmaliger Bulk-Push)
app.post('/api/turso/bulk', express.json({ limit: '10mb' }), (req, res) => {
  const entries = req.body; // { key: dataString|object, ... }
  if (!entries || typeof entries !== 'object') return res.status(400).json({ error: 'Ungültiges Format' });
  let saved = 0;
  for (const [key, value] of Object.entries(entries)) {
    if (!SYNC_KEYS.includes(key)) continue;
    const dataStr = typeof value === 'string' ? value : JSON.stringify(value);
    const ts = Date.now();
    syncStore.set(key, { data: value, timestamp: ts, updatedBy: 'browser-push' });
    try { db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(key, dataStr); } catch(e) { console.error('[App]', e.message); }
    tursoWriteAppData(key, dataStr);
    saved++;
  }
  console.log(`  ☁️  Browser-Push: ${saved} Keys gespeichert`);
  res.json({ ok: true, saved });
});

// Turso-Status prüfen
app.get('/api/turso/status', async (_req, res) => {
  if (!turso) return res.json({ connected: false });
  try {
    await turso.execute('SELECT 1 as ok');
    res.json({ connected: true, url: process.env.TURSO_URL });
  } catch(e) { res.json({ connected: false, error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════
// PDF / Dokumente API — Server-seitiger Dateispeicher
// ════════════════════════════════════════════════════════════════════
const PDF_DIR = path.join(__dirname, 'datenbank', 'buchhaltung');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

// Tabelle anlegen
db.exec(`CREATE TABLE IF NOT EXISTS dokumente (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  typ TEXT DEFAULT 'sonstige',
  monat TEXT DEFAULT '',
  status TEXT DEFAULT 'offen',
  pfad TEXT NOT NULL,
  groesse INTEGER DEFAULT 0,
  erstellt TEXT DEFAULT (datetime('now'))
)`);

// Liste aller Dokumente (Turso + lokale kombiniert)
app.get('/api/pdf', async (_req, res) => {
  try {
    if (turso) {
      const r = await turso.execute('SELECT id,name,typ,monat,status,groesse,erstellt FROM dokumente ORDER BY erstellt DESC');
      const tursoIds = new Set(r.rows.map(x => x.id));
      // Lokale Einträge die noch nicht in Turso sind, auch mitzählen
      const lokale = db.prepare('SELECT id,name,typ,monat,status,groesse,erstellt FROM dokumente ORDER BY erstellt DESC').all()
        .filter(d => !tursoIds.has(d.id));
      const alle = [...r.rows, ...lokale].sort((a, b) => (b.erstellt||'') > (a.erstellt||'') ? 1 : -1);
      return res.json(alle);
    }
    const docs = db.prepare('SELECT * FROM dokumente ORDER BY erstellt DESC').all();
    res.json(docs);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Lohnzettel-PDF parsen → Array von { name, brutto, netto, bv_beitrag, monat }
function parseLohnzettelPDF(text) {
  const ergebnisse = [];
  const blocks = text.split(/(?=Lohn \/ Gehaltsabrechnung)/);
  const monatMap = { 'Jänner':'01','Januar':'01','Februar':'02','März':'03','April':'04','Mai':'05','Juni':'06',
    'Juli':'07','August':'08','September':'09','Oktober':'10','November':'11','Dezember':'12' };
  for (const block of blocks) {
    if (!block.includes('Ali Shama KG')) continue;
    const nameM   = block.match(/Person:\d+[^)]*\)\s*([^\n]+)/);
    const bruttoM = block.match(/Brutto\s+([\d.,]+)/);
    const nettoM  = block.match(/Auszahlung\s+([\d.,]+)/);
    const bvM     = block.match(/BV Beitrag\s+([\d.,]+)/);
    const monatM  = block.match(/Abrechnung\s+(\w+)\s+(\d{4})/);
    if (!nameM || !bruttoM) continue;
    const monatStr = monatM ? `${monatM[2]}-${(monatMap[monatM[1]] || '??')}` : null;
    ergebnisse.push({
      name:       nameM[1].trim(),
      brutto:     parseFloat(bruttoM[1].replace(/\./g,'').replace(',','.')),
      netto:      nettoM  ? parseFloat(nettoM[1].replace(/\./g,'').replace(',','.')) : null,
      bv_beitrag: bvM     ? parseFloat(bvM[1].replace(/\./g,'').replace(',','.'))   : 0,
      monat:      monatStr,
    });
  }
  return ergebnisse;
}

// Parsed Lohnzettel-Einträge in psc_lohnabrechnungen speichern (SQLite + Turso + broadcast)
async function speichereLohnzettel(eintraege) {
  if (!eintraege.length) return;
  const row = db.prepare("SELECT data FROM app_data WHERE key='psc_lohnabrechnungen'").get();
  const existing = row ? JSON.parse(row.data) : { abrechnungen: [] };
  // Alte Einträge desselben Monats ersetzen
  const monate = [...new Set(eintraege.map(e => e.monat))];
  const alt = (existing.abrechnungen || []).filter(a => !monate.includes(a.monat));
  const merged = { abrechnungen: [...alt, ...eintraege] };
  const json = JSON.stringify(merged);
  db.prepare("INSERT OR REPLACE INTO app_data (key, data, updated_at) VALUES ('psc_lohnabrechnungen', ?, datetime('now'))").run(json);
  if (turso) await turso.execute({ sql: "INSERT OR REPLACE INTO app_data (key, data, updated_at) VALUES ('psc_lohnabrechnungen', ?, datetime('now'))", args: [json] });
  const lzMsg = JSON.stringify({ type: 'sync', key: 'psc_lohnabrechnungen', value: json });
  for (const c of syncClients) { if (c.readyState === 1) c.send(lzMsg); }
  console.log(`  📋 Lohnzettel gespeichert: ${eintraege.length} MA, Monat(e): ${monate.join(', ')}`);
}

// Datei hochladen (base64 JSON) — nur Turso Cloud, kein lokales Dateisystem
app.post('/api/pdf/upload', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { id, name, data, typ, monat } = req.body;
    if (!id || !name || !data) return res.status(400).json({ error: 'id, name, data erforderlich' });
    const base64 = data.replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(base64, 'base64');

    // ── MIME / Magic-Bytes Prüfung ────────────────────────────────────
    const ext = name.split('.').pop().toLowerCase();
    const allowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'xlsx', 'csv'];
    if (!allowedExt.includes(ext)) return res.status(400).json({ error: 'Dateityp nicht erlaubt' });
    if (ext === 'pdf' && buf.slice(0, 4).toString() !== '%PDF') {
      return res.status(400).json({ error: 'Ungültige PDF-Datei' });
    }
    if ((ext === 'jpg' || ext === 'jpeg') && !(buf[0] === 0xFF && buf[1] === 0xD8)) {
      return res.status(400).json({ error: 'Ungültige JPG-Datei' });
    }
    if (ext === 'png' && buf.slice(0, 4).toString('hex') !== '89504e47') {
      return res.status(400).json({ error: 'Ungültige PNG-Datei' });
    }

    if (turso) {
      // Nur in Turso Cloud speichern
      await turso.batch([
        { sql: `INSERT OR REPLACE INTO dokumente (id,name,typ,monat,status,groesse) VALUES (?,?,?,?,?,?)`,
          args: [id, name, typ||'sonstige', monat||'', 'offen', buf.length] },
        { sql: `INSERT OR REPLACE INTO dokumente_data (id,data) VALUES (?,?)`,
          args: [id, base64] },
      ], 'write');
      console.log(`  ☁️  PDF → Turso: ${name} (${(buf.length/1024).toFixed(1)} KB)`);
    } else {
      // Fallback: lokal speichern (nur wenn kein Turso konfiguriert)
      const safeName = name.replace(/[^a-zA-Z0-9._\-äöüÄÖÜß ]/g, '_');
      const filePath = path.join(PDF_DIR, id + '_' + safeName);
      fs.writeFileSync(filePath, buf);
      db.prepare(`INSERT OR REPLACE INTO dokumente (id,name,typ,monat,status,pfad,groesse) VALUES (?,?,?,?,?,?,?)`)
        .run(id, name, typ||'sonstige', monat||'', 'offen', filePath, buf.length);
      console.log(`  📄 PDF lokal gespeichert: ${name} (${(buf.length/1024).toFixed(1)} KB)`);
    }

    // Lokale SQLite-Kopie der Metadaten (pfad='cloud' → kein lokales File)
    try { db.prepare(`INSERT OR REPLACE INTO dokumente (id,name,typ,monat,status,pfad,groesse) VALUES (?,?,?,?,?,?,?)`)
      .run(id, name, typ||'sonstige', monat||'', 'offen', turso ? 'cloud' : '', buf.length); } catch(e) { console.error('[App]', e.message); }

    // Lohnzettel automatisch parsen
    const nl = name.toLowerCase();
    if (typ === 'lohnzettel' || nl.includes('abrechnungsbelege') || nl.includes('lohnzettel')) {
      try {
        const pdfData = await pdfParse(buf);
        const eintraege = parseLohnzettelPDF(pdfData.text);
        if (eintraege.length) await speichereLohnzettel(eintraege);
      } catch(pe) { console.log('  ⚠️  Lohnzettel-Parse Fehler:', pe.message); }
    }

    res.json({ ok: true, id, name, groesse: buf.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Hilfsfunktion: PDF-Buffer aus Turso oder lokalem Dateisystem laden
async function ladePdfBuffer(id) {
  if (turso) {
    const r = await turso.execute({ sql: 'SELECT data FROM dokumente_data WHERE id=?', args: [id] });
    if (r.rows[0]?.data) return Buffer.from(r.rows[0].data, 'base64');
  }
  const doc = db.prepare('SELECT pfad FROM dokumente WHERE id=?').get(id);
  if (doc?.pfad && doc.pfad !== 'cloud' && fs.existsSync(doc.pfad)) return fs.readFileSync(doc.pfad);
  return null;
}

// Hilfsfunktion: Dokument-Metadaten laden (Turso bevorzugt)
async function ladeDokMeta(id) {
  if (turso) {
    const r = await turso.execute({ sql: 'SELECT * FROM dokumente WHERE id=?', args: [id] });
    if (r.rows[0]) return r.rows[0];
  }
  return db.prepare('SELECT * FROM dokumente WHERE id=?').get(id) || null;
}

// Datei herunterladen
app.get('/api/pdf/:id', async (req, res) => {
  try {
    const doc = await ladeDokMeta(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Nicht gefunden' });
    const buf = await ladePdfBuffer(req.params.id);
    if (!buf) return res.status(404).json({ error: 'Datei nicht gefunden' });
    const ext = path.extname(doc.name).toLowerCase();
    const mime = ext === '.pdf' ? 'application/pdf' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.name)}"`);
    res.send(buf);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Dokument im Browser anzeigen (inline)
app.get('/api/pdf/:id/view', async (req, res) => {
  try {
    const doc = await ladeDokMeta(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Nicht gefunden' });
    const buf = await ladePdfBuffer(req.params.id);
    if (!buf) return res.status(404).json({ error: 'Datei nicht gefunden' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.name)}"`);
    res.send(buf);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Status ändern
app.put('/api/pdf/:id/status', express.json(), (req, res) => {
  try {
    db.prepare('UPDATE dokumente SET status=? WHERE id=?').run(req.body.status, req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Dokument löschen
app.delete('/api/pdf/:id', async (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM dokumente WHERE id=?').get(req.params.id);
    if (doc) {
      if (doc.pfad && doc.pfad !== 'cloud') {
        try { if (fs.existsSync(doc.pfad)) fs.unlinkSync(doc.pfad); } catch(e) { console.error('[App]', e.message); }
      }
      db.prepare('DELETE FROM dokumente WHERE id=?').run(req.params.id);
    }
    if (turso) {
      await turso.batch([
        { sql: 'DELETE FROM dokumente WHERE id=?', args: [req.params.id] },
        { sql: 'DELETE FROM dokumente_data WHERE id=?', args: [req.params.id] },
      ], 'write').catch(e => console.error('[Turso]', e.message));
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════
// PDF → JSON Konvertierung (pdf-parse + Claude API)
// ════════════════════════════════════════════════════════════════════

const PDF_JSON_PROMPT = `Du bist ein österreichischer Buchhaltungs-Experte für die Pizzeria San Carino (Ali Shama KG, Wien).
Analysiere den folgenden PDF-Text und gib strukturiertes JSON zurück.

Erkenne automatisch den Dokumenttyp und verwende das passende Format:

LOHNABRECHNUNG / ABRECHNUNGSBELEGE:
{"typ":"lohnabrechnung","firma":"","monat":"YYYY-MM","mitarbeiter":[{"ma_nr":0,"name":"Nachname, Vorname","beruf":"","sv_nr":"","eintritt":"DD.MM.YYYY","austritt":"","brutto":0.00,"monatslohn":0.00,"sonderzahlung":0.00,"sv_lfd":0.00,"sv_sz":0.00,"lst_lfd":0.00,"lst_sz":0.00,"abzuege":0.00,"netto":0.00,"auszahlung":0.00,"bv_beitrag":0.00}]}

ZAHLUNGSJOURNAL:
{"typ":"zahlungsjournal","monat":"YYYY-MM","eintraege":[{"datum":"DD.MM.YYYY","empfaenger":"","iban":"","betrag":0.00,"verwendungszweck":""}],"gesamt":0.00}

RECHNUNG:
{"typ":"rechnung","datum":"YYYY-MM-DD","lieferant":"","rechnungsnr":"","positionen":[{"artikel":"","menge":0,"einheit":"","preis_einzel":0.00,"preis_gesamt":0.00}],"zwischensumme":0.00,"mwst":0.00,"gesamt":0.00}

SONSTIGES:
{"typ":"sonstiges","datum":"","betreff":"","zusammenfassung":"","daten":{}}

Antworte NUR mit validem JSON ohne Markdown-Blöcke oder Erklärungen.`;

// PDF → JSON konvertieren (per Dokument-ID)
app.post('/api/pdf/:id/zu-json', async (req, res) => {
  try {
    const doc = await ladeDokMeta(req.params.id);
    if (!doc) return res.status(404).json({ error: 'PDF nicht gefunden' });

    // Text aus PDF extrahieren (Turso oder lokales File)
    const pdfBuf = await ladePdfBuffer(req.params.id);
    if (!pdfBuf) return res.status(404).json({ error: 'PDF-Daten nicht gefunden' });
    const pdfData = await pdfParse(pdfBuf);
    const pdfText = pdfData.text;

    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    let jsonData;

    if (apiKey && !apiKey.includes('BITTE')) {
      // Mit Claude strukturieren
      const resp = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: PDF_JSON_PROMPT,
        messages: [{ role: 'user', content: 'PDF-Text:\n\n' + pdfText.slice(0, 20000) }]
      }, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } });

      const raw = (resp.data.content?.[0]?.text || '').trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim();
      jsonData = JSON.parse(raw);
    } else {
      // Fallback: Text als JSON (kein API-Key)
      jsonData = { typ: doc.typ || 'sonstiges', name: doc.name, text: pdfText, seiten: pdfData.numpages, hinweis: 'Claude API Key fehlt — nur Rohtext' };
    }

    // Metadaten anhängen
    jsonData._meta = { dok_id: doc.id, dok_name: doc.name, seiten: pdfData.numpages, konvertiert: new Date().toISOString() };

    // In app_data speichern (lokal + Turso)
    const key = 'pdf_json_' + doc.id;
    const dataStr = JSON.stringify(jsonData);
    db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(key, dataStr);
    tursoWriteAppData(key, dataStr);

    console.log(`  🔄 PDF→JSON: ${doc.name} (${pdfData.numpages} Seiten → ${dataStr.length} Zeichen JSON)`);
    res.json({ ok: true, key, data: jsonData });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// JSON für ein Dokument abrufen
app.get('/api/pdf/:id/json', (req, res) => {
  try {
    const key = 'pdf_json_' + req.params.id;
    const row = db.prepare('SELECT data FROM app_data WHERE key=?').get(key);
    if (!row) return res.status(404).json({ error: 'Noch nicht konvertiert' });
    res.json(JSON.parse(row.data));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// JSON für ein Dokument aktualisieren (editierbar in App)
app.put('/api/pdf/:id/json', express.json({ limit: '5mb' }), (req, res) => {
  try {
    const key = 'pdf_json_' + req.params.id;
    const dataStr = JSON.stringify(req.body);
    db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(key, dataStr);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Monat aus Dateiname/Betreff extrahieren ───────────────────────────────────
const MONAT_NAMEN = {
  jan:1, jän:1, feb:2, mär:3, mar:3, apr:4, mai:5, may:5,
  jun:6, jul:7, aug:8, sep:9, okt:10, oct:10, nov:11, dez:12, dec:12,
  januar:1, jänner:1, februar:2, maerz:3, märz:3, april:4,
  juni:6, juli:7, august:8, september:9, oktober:10, november:11, dezember:12
};

function extrahiereMonat(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  // Format: "Juli 2025", "Oktober 2025"
  for (const [name, num] of Object.entries(MONAT_NAMEN)) {
    const re = new RegExp(name + '[\\s._-]*(\\d{4})', 'i');
    const m = t.match(re);
    if (m) return m[1] + '-' + String(num).padStart(2,'0');
  }
  // Format: "_M.YYYY" oder "_MM.YYYY" (z.B. Rechnung_383201310.1_12.2025.pdf)
  const us = t.match(/_(0?[1-9]|1[0-2])\.(20\d{2})/);
  if (us) return us[2] + '-' + String(parseInt(us[1])).padStart(2,'0');
  // Format: "MM.YYYY" oder "MM/YYYY"
  const mj = t.match(/\b(0?[1-9]|1[0-2])[.\\/](20\d{2})\b/);
  if (mj) return mj[2] + '-' + String(parseInt(mj[1])).padStart(2,'0');
  // Format: "YYYY-MM" bereits korrekt
  const ym = t.match(/\b(20\d{2})[-_](0?[1-9]|1[0-2])\b/);
  if (ym) return ym[1] + '-' + String(parseInt(ym[2])).padStart(2,'0');
  return null;
}

// Alle Dokumente: Monat aus Dateiname korrigieren
app.post('/api/pdf/korrigiere-monate', async (req, res) => {
  if (!turso) return res.status(503).json({ error: 'Kein Turso' });
  const r = await turso.execute('SELECT id, name, monat, typ FROM dokumente');
  let korrigiert = 0;
  const updates = [];
  for (const doc of r.rows) {
    const neuerMonat = extrahiereMonat(doc.name);
    // Auch Typ aus Dateiname ableiten
    const n = (doc.name||'').toLowerCase();
    let neuerTyp = doc.typ;
    if (n.includes('lohnzettel') || n.includes('abrechnungsbelege') || n.includes('abrechnung')) neuerTyp = 'lohnzettel';
    else if (n.includes('dienstnehmerzahlung') || n.includes('zahlungsjournal')) neuerTyp = 'zahlungsjournal';
    else if (n.includes('meldebestätigung') || n.includes('meldebest')) neuerTyp = 'ogk';
    else if (n.includes('dienstvertrag') || n.includes('verdienstnachweis')) neuerTyp = 'sonstige';
    else if (n.includes('rechnung') || n.includes('rg_') || n.includes('re-') || n.includes('rechnungnr')) neuerTyp = 'rechnung';
    const monatGeaendert = neuerMonat && neuerMonat !== doc.monat;
    const typGeaendert = neuerTyp !== doc.typ;
    if (monatGeaendert || typGeaendert) {
      updates.push({ sql: 'UPDATE dokumente SET monat=?, typ=? WHERE id=?',
        args: [neuerMonat || doc.monat, neuerTyp, doc.id] });
      korrigiert++;
    }
  }
  if (updates.length > 0) {
    for (const u of updates) await turso.execute(u).catch(e => console.error('[Turso]', e.message));
  }
  // Auch lokale SQLite aktualisieren
  for (const doc of r.rows) {
    const nm = extrahiereMonat(doc.name);
    if (nm) try { db.prepare('UPDATE dokumente SET monat=? WHERE id=?').run(nm, doc.id); } catch(e) { console.error('[App]', e.message); }
  }
  console.log(`  ☁️  Monate korrigiert: ${korrigiert}/${r.rows.length} Dokumente`);
  res.json({ ok: true, gesamt: r.rows.length, korrigiert });
});

// Status eines Dokuments + Monat + Typ ändern
app.put('/api/pdf/:id/metadaten', express.json(), async (req, res) => {
  try {
    const { monat, typ, status } = req.body;
    const id = req.params.id;
    db.prepare('UPDATE dokumente SET monat=COALESCE(?,monat), typ=COALESCE(?,typ), status=COALESCE(?,status) WHERE id=?').run(monat||null, typ||null, status||null, id);
    if (turso) await turso.execute({ sql: 'UPDATE dokumente SET monat=COALESCE(?,monat), typ=COALESCE(?,typ), status=COALESCE(?,status) WHERE id=?', args: [monat||null, typ||null, status||null, id] }).catch(e => console.error('[Turso]', e.message));
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Lieferanten-Definitionen
const LIEFERANTEN_MUSTER = {
  umtrade: { label: 'UM Trade (Lebensmittel)',        fn: n => n.toLowerCase().startsWith('rechnungnr'), mwst: 10, kategorie: 'einkauf' },
  edenred: { label: 'Edenred (Essensgutscheine)',     fn: n => n.includes('rg_10045') || /^re-\d/i.test(n), mwst: 20, kategorie: 'sonstiges' },
  a1:      { label: 'A1 (Telefon & Internet)',        fn: n => n.includes('rechnung_383201310'), mwst: 20, kategorie: 'betriebskosten' },
  svs:     { label: 'SVS (Sozialversicherung)',       fn: n => /^sg7/i.test(n), mwst: 0, kategorie: 'lohn' },
};

// Produkte aus UM Trade PDF-Text extrahieren
function extrahiereUmTradeProdukte(text) {
  const zeilen = text.split('\n').map(z => z.trim()).filter(z => z.length > 3);
  const produkte = [];
  // UM Trade Format: Zeilen die Preismuster enthalten (z.B. "1,99", "12,50" etc.)
  const preisRe = /(\d{1,3}[,.]\d{2})\s*(?:€|EUR)?$/;
  const mengeRe = /^(\d{1,4}[,.]\d{0,3})\s*(kg|g|stk|st|stück|l|liter|krt|karton|pak|paket|fla|dose|bund)?/i;
  for (let i = 0; i < zeilen.length; i++) {
    const z = zeilen[i];
    const pmatch = z.match(preisRe);
    if (!pmatch) continue;
    const preis = parseFloat(pmatch[1].replace(',','.'));
    if (preis < 0.5 || preis > 9999) continue;
    // Beschreibung = aktuelle Zeile ohne Preis, oder vorherige Zeile
    let bezeichnung = z.replace(preisRe,'').trim();
    if (bezeichnung.length < 3 && i > 0) bezeichnung = zeilen[i-1];
    // Menge suchen
    let menge = null, einheit = null;
    const mmatch = bezeichnung.match(mengeRe);
    if (mmatch) { menge = parseFloat(mmatch[1].replace(',','.')); einheit = mmatch[2] || 'Stk'; bezeichnung = bezeichnung.replace(mengeRe,'').trim(); }
    if (bezeichnung.length < 2) continue;
    produkte.push({ bezeichnung: bezeichnung.slice(0, 60), preis, menge, einheit });
  }
  return produkte;
}

// Rechnungsdatum aus PDF-Text extrahieren (DD.MM.YYYY)
function extrahiereDatum(text) {
  const muster = [
    /(?:rechnungsdatum|datum|ausgestellt am|lieferdatum|belegdatum)[:\s]*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4})/i,
    /(\d{1,2}\.\d{1,2}\.\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ];
  for (const re of muster) {
    const m = text.match(re);
    if (m) {
      let d = m[1].trim();
      // ISO → DD.MM.YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const p = d.split('-');
        d = p[2] + '.' + p[1] + '.' + p[0];
      }
      return d;
    }
  }
  return null;
}

// Gesamtbetrag aus PDF-Text extrahieren
function extrahiereBetrag(text) {
  const muster = [
    /(?:rechnungsbetrag|gesamtbetrag|zu zahlen|endbetrag|gesamt|total)[:\s]*(?:eur\s*)?(\d{1,7}[,.]\d{2})/i,
    /(?:eur|€)\s*(\d{1,7}[,.]\d{2})\s*$/im,
    /(\d{1,7},\d{2})\s*(?:€|eur)/i,
  ];
  for (const re of muster) {
    const m = text.match(re);
    if (m) {
      const val = parseFloat(m[1].replace(/\./g,'').replace(',','.'));
      if (val > 0 && val < 500000) return val;
    }
  }
  return null;
}

// Auto-Analyse: neue Rechnung von umgroup.at → Produkte extrahieren + in Preisliste
app.post('/api/pdf/:id/auto-analyse', express.json(), async (req, res) => {
  try {
    const id = req.params.id;
    const buf = await ladePdfBuffer(id);
    if (!buf) return res.status(404).json({ error: 'PDF nicht gefunden' });
    const parsed = await pdfParse(buf);
    const text = parsed.text;
    const betrag = extrahiereBetrag(text);
    let produkte = [];

    // Claude API verwenden wenn verfügbar → bessere Produktnamen
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (apiKey && !apiKey.includes('BITTE')) {
      try {
        const resp = await axios.post('https://api.anthropic.com/v1/messages', {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [{ role: 'user', content: `Extrahiere alle Produkte aus dieser UM Trade Rechnung als JSON-Array.
Format: [{"bezeichnung":"Produktname","menge":1,"einheit":"kg","preis":12.50}]
Nur JSON, keine Erklärung.

PDF-Text:
${text.slice(0, 8000)}` }]
        }, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } });
        const raw = (resp.data.content?.[0]?.text || '').trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim();
        const extracted = JSON.parse(raw);
        if (Array.isArray(extracted)) produkte = extracted;
      } catch(e) {
        console.log('  Claude Analyse Fallback auf Regex:', e.message);
        produkte = extrahiereUmTradeProdukte(text);
      }
    } else {
      produkte = extrahiereUmTradeProdukte(text);
    }

    // Bestehende Preise laden
    let preislisteRaw = db.prepare("SELECT data FROM app_data WHERE key='pizzeria_preise'").get();
    let preisliste = preislisteRaw ? JSON.parse(preislisteRaw.data) : [];

    // Neue Artikel finden (die noch nicht in der Preisliste sind)
    const neueArtikel = [];
    for (const p of produkte) {
      const bez = p.bezeichnung.toLowerCase();
      const existiert = preisliste.some(e => {
        const name = (e.name || e.bezeichnung || '').toLowerCase();
        return name.includes(bez.slice(0,8)) || bez.includes(name.slice(0,8));
      });
      if (!existiert && p.bezeichnung.length > 3) {
        neueArtikel.push(p);
        // Zur Preisliste hinzufügen
        preisliste.push({
          id: 'ut_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
          name: p.bezeichnung,
          preis: p.preis,
          einheit: p.einheit || 'Stk',
          geschaeft: 'UM Trade',
          datum: new Date().toISOString().slice(0,10)
        });
      }
    }

    // Preisliste speichern
    if (neueArtikel.length > 0) {
      const dataStr = JSON.stringify(preisliste);
      db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run('pizzeria_preise', dataStr);
      tursoWriteAppData('pizzeria_preise', dataStr);
      console.log(`  🆕 Auto-Analyse: ${neueArtikel.length} neue UM Trade Artikel gefunden`);
      // WebSocket Broadcast
      const msg = JSON.stringify({ type: 'neue_artikel', lieferant: 'UM Trade', anzahl: neueArtikel.length, artikel: neueArtikel.slice(0,5) });
      if (typeof setBroadcast === 'function') setBroadcast({ type: 'neue_artikel', lieferant: 'UM Trade', anzahl: neueArtikel.length });
    }

    res.json({ ok: true, produkte: produkte.length, neueArtikel: neueArtikel.length, betrag, artikel: neueArtikel });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Lieferanten-Einkaufsübersicht
app.post('/api/pdf/lieferant-analyse', express.json(), async (req, res) => {
  const { lieferant } = req.body || {};
  const def = LIEFERANTEN_MUSTER[lieferant];
  if (!def) return res.json({ ok: false, error: 'Unbekannter Lieferant' });

  let allDocs = [];
  if (turso) {
    const r = await turso.execute('SELECT id,name,monat,typ,groesse,erstellt,status FROM dokumente');
    allDocs = r.rows;
  } else {
    allDocs = db.prepare('SELECT id,name,monat,typ,groesse,erstellt,status FROM dokumente').all();
  }
  const docs = allDocs.filter(d => def.fn((d.name||'').toLowerCase()));

  const ergebnis = [];
  for (const doc of docs) {
    const eintrag = { id: doc.id, name: doc.name, monat: doc.monat||'—', typ: doc.typ||'sonstige', erstellt: doc.erstellt||null, status: doc.status||'offen', betrag: null, datum: null };
    try {
      const buf = await ladePdfBuffer(doc.id);
      if (buf) {
        const parsed = await pdfParse(buf);
        eintrag.betrag = extrahiereBetrag(parsed.text);
        eintrag.datum = extrahiereDatum(parsed.text);
      }
    } catch(e) { console.error('[App]', e.message); }
    ergebnis.push(eintrag);
  }
  // Sortierung: neueste zuerst (nach monat)
  ergebnis.sort((a,b) => (b.monat||'').localeCompare(a.monat||''));
  const gesamt = ergebnis.reduce((s,e) => s + (e.betrag||0), 0);
  res.json({ ok: true, label: def.label, dokumente: ergebnis, gesamt });
});

// Alle Lieferanten-Stats (Anzahl Docs pro Lieferant)
app.get('/api/pdf/lieferanten', async (_req, res) => {
  let allDocs = [];
  if (turso) {
    const r = await turso.execute('SELECT name FROM dokumente');
    allDocs = r.rows;
  } else {
    allDocs = db.prepare('SELECT name FROM dokumente').all();
  }
  const stats = {};
  for (const [key, def] of Object.entries(LIEFERANTEN_MUSTER)) {
    const count = allDocs.filter(d => def.fn((d.name||'').toLowerCase())).length;
    if (count > 0) stats[key] = { label: def.label, count };
  }
  res.json(stats);
});

// Smart Scan: PDF-Text lesen und Monat/Typ automatisch erkennen
app.post('/api/pdf/smart-scan', async (req, res) => {
  try {
    let docs = [];
    if (turso) {
      const r = await turso.execute("SELECT id,name,monat,typ FROM dokumente");
      docs = r.rows;
    } else {
      docs = db.prepare("SELECT id,name,monat,typ FROM dokumente").all();
    }
    // Nur Dokumente ohne korrekten Monat (= aktueller Monat als Fallback)
    const heute = new Date();
    const aktuellMonat = heute.getFullYear() + '-' + String(heute.getMonth()+1).padStart(2,'0');
    const zuKorrigieren = docs.filter(d => !d.monat || d.monat === aktuellMonat);

    res.json({ ok: true, gesamt: zuKorrigieren.length, nachricht: `${zuKorrigieren.length} PDFs werden im Hintergrund gescannt` });

    let korrigiert = 0;
    for (const doc of zuKorrigieren) {
      try {
        const pdfBuf = await ladePdfBuffer(doc.id);
        if (!pdfBuf) continue;
        const pdfData = await pdfParse(pdfBuf);
        const text = pdfData.text || '';

        // Monat aus PDF-Text extrahieren
        const neuerMonat = extrahiereMonat(text);

        // Typ aus PDF-Text ableiten
        const tl = text.toLowerCase();
        let neuerTyp = doc.typ;
        if (!neuerTyp || neuerTyp === 'rechnung') {
          if (tl.includes('lohnzettel') || tl.includes('abrechnungsbeleg') || tl.includes('gesamtlohn') || tl.includes('bruttolohn')) neuerTyp = 'lohnzettel';
          else if (tl.includes('zahlungsjournal') || tl.includes('dienstnehmerzahlung')) neuerTyp = 'zahlungsjournal';
          else if (tl.includes('meldebestätigung') || tl.includes('anmeldung') && tl.includes('ögk')) neuerTyp = 'ogk';
          else if (tl.includes('dienstvertrag') || tl.includes('beschäftigungsausmaß')) neuerTyp = 'sonstige';
          else if (tl.includes('finanzamt') || tl.includes('umsatzsteuervoranmeldung')) neuerTyp = 'finanzamt';
        }

        if (neuerMonat && neuerMonat !== doc.monat || neuerTyp !== doc.typ) {
          const nm = neuerMonat || doc.monat;
          db.prepare('UPDATE dokumente SET monat=?, typ=? WHERE id=?').run(nm, neuerTyp, doc.id);
          if (turso) await turso.execute({ sql: 'UPDATE dokumente SET monat=?, typ=? WHERE id=?', args: [nm, neuerTyp, doc.id] }).catch(e => console.error('[Turso]', e.message));
          korrigiert++;
          console.log(`  📋 Smart Scan: ${doc.name} → ${nm} [${neuerTyp}]`);
        }
        // Lohnzettel automatisch parsen
        if (neuerTyp === 'lohnzettel') {
          const eintraege = parseLohnzettelPDF(text);
          if (eintraege.length) await speichereLohnzettel(eintraege);
        }
      } catch(e) { console.error('[App]', e.message); }
    }
    console.log(`  ✅ Smart Scan fertig: ${korrigiert}/${zuKorrigieren.length} Dokumente korrigiert`);
  } catch(e) { console.error('Smart Scan Fehler:', e.message); }
});

// Alle PDFs auf einmal konvertieren (Turso + lokale Docs)
let _pdfBulkRunning = false;
app.post('/api/pdf/alle-zu-json', async (req, res) => {
  if (_pdfBulkRunning) return res.json({ ok: false, nachricht: 'Konvertierung läuft bereits — bitte warten' });
  _pdfBulkRunning = true;
  try {
    let docs = [];
    if (turso) {
      const r = await turso.execute("SELECT id,name,typ FROM dokumente");
      docs = r.rows;
    } else {
      docs = db.prepare("SELECT id,name,typ,pfad FROM dokumente WHERE pfad LIKE '%.pdf'").all();
    }
    res.json({ ok: true, gesamt: docs.length, nachricht: `${docs.length} PDFs werden im Hintergrund konvertiert` });

    // Max 3 PDFs gleichzeitig verarbeiten
    const BATCH = 3;
    for (let i = 0; i < docs.length; i += BATCH) {
      const batch = docs.slice(i, i + BATCH);
      await Promise.all(batch.map(async doc => {
        try {
          const key = 'pdf_json_' + doc.id;
          const already = db.prepare('SELECT key FROM app_data WHERE key=?').get(key);
          if (already) return;
          const pdfBuf = await ladePdfBuffer(doc.id);
          if (!pdfBuf) return;
          const pdfData = await pdfParse(pdfBuf);
          const jsonData = { typ: doc.typ||'sonstiges', name: doc.name, text: pdfData.text, seiten: pdfData.numpages, _meta: { dok_id: doc.id, konvertiert: new Date().toISOString() } };
          const dataStr = JSON.stringify(jsonData);
          db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(key, dataStr);
          tursoWriteAppData(key, dataStr);
          console.log(`  🔄 Bulk PDF→JSON: ${doc.name}`);
        } catch(e) { console.error('[PDF Bulk]', e.message); }
      }));
    }
  } catch(e) { if (!res.headersSent) res.status(500).json({ error: e.message }); }
  finally { _pdfBulkRunning = false; }
});

// ════════════════════════════════════════════════════════════════════
// Inbox API — Ordner-Watcher Endpunkte
// ════════════════════════════════════════════════════════════════════

// Ordner-Info (welche Formate werden unterstützt)
app.get('/api/inbox/folders', (_req, res) => {
  res.json(getFolderInfo());
});

// Alle ausstehenden Einträge (oder gefiltert nach Ordner)
app.get('/api/inbox', (req, res) => {
  const folder = req.query.folder || null;
  const q      = getQueue(folder);
  const pending = q.filter(e => e.status === 'pending');
  res.json({ total: q.length, pending: pending.length, items: q.slice(-100) });
});

// Eintrag als verarbeitet markieren
app.post('/api/inbox/done/:id', (req, res) => {
  const ok = markDone(req.params.id);
  res.json({ ok });
});

// Eintrag löschen
app.delete('/api/inbox/:id', (req, res) => {
  deleteEntry(req.params.id);
  res.json({ ok: true });
});

// Alle verarbeiteten löschen
app.post('/api/inbox/clear-processed', (_req, res) => {
  const remaining = clearProcessed();
  res.json({ ok: true, remaining });
});

// ════════════════════════════════════════════════════════════════════
// Preishistorie API
// ════════════════════════════════════════════════════════════════════

// GET /api/preisverlauf?produkt=mehl&shop=metro&limit=100
app.get('/api/preisverlauf', (req, res) => {
  try {
    let sql = 'SELECT * FROM preishistorie WHERE 1=1';
    const params = [];
    if (req.query.produkt_id) { sql += ' AND produkt_id = ?'; params.push(req.query.produkt_id); }
    if (req.query.produkt)    { sql += ' AND produkt LIKE ?'; params.push('%' + req.query.produkt + '%'); }
    if (req.query.shop_id)    { sql += ' AND shop_id = ?';    params.push(req.query.shop_id); }
    if (req.query.von)        { sql += ' AND datum >= ?';     params.push(req.query.von); }
    if (req.query.bis)        { sql += ' AND datum <= ?';     params.push(req.query.bis); }
    sql += ' ORDER BY datum DESC LIMIT ?';
    params.push(parseInt(req.query.limit) || 200);
    res.json(db.prepare(sql).all(...params));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/preisverlauf/stats?produkt_id=mehl
app.get('/api/preisverlauf/stats', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT produkt_id, produkt, shop, shop_id,
             MIN(preis) AS min_preis, MAX(preis) AS max_preis,
             ROUND(AVG(preis),2) AS avg_preis, COUNT(*) AS anzahl,
             MAX(datum) AS letztes_datum
      FROM preishistorie
      WHERE ($pid IS NULL OR produkt_id = $pid)
      GROUP BY produkt_id, shop_id
      ORDER BY produkt, shop
    `).all({ $pid: req.query.produkt_id || null });
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/preisverlauf  body: { produkt, preis, shop, ... } oder Array
app.post('/api/preisverlauf', express.json(), (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const heute = new Date().toISOString().slice(0, 10);
    db.exec('BEGIN');
    try {
      for (const it of items) {
        if (!it.produkt || it.preis == null) continue;
        phInsert.run({
          $produkt_id:  it.produkt_id  || null,
          $produkt:     it.produkt,
          $preis:       parseFloat(it.preis),
          $normalpreis: it.normalpreis != null ? parseFloat(it.normalpreis) : null,
          $shop:        it.shop        || null,
          $shop_id:     it.shop_id     || null,
          $datum:       it.datum       || heute,
          $quelle:      it.quelle      || 'manuell',
        });
      }
      db.exec('COMMIT');
    } catch(txErr) { db.exec('ROLLBACK'); throw txErr; }
    res.json({ ok: true, gespeichert: items.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════
// NOTION INTEGRATION
// ════════════════════════════════════════════════════════════════════

// POST /api/notion/fehlmaterial — Fehlmaterial-Einträge in Notion speichern
app.post('/api/notion/fehlmaterial', express.json(), async (req, res) => {
  try {
    const { entries, apiKey, dbId } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'Notion API Key fehlt' });
    if (!dbId)   return res.status(400).json({ error: 'Notion Datenbank-ID fehlt' });
    if (!entries || !entries.length) return res.status(400).json({ error: 'Keine Einträge' });

    const results = [];
    for (const e of entries) {
      const dring = e.dringend ? '🔴 Dringend' : (e.prioritaet === 'mittel' ? '🟡 Mittel' : '🟢 Normal');
      const body = {
        parent: { database_id: dbId },
        properties: {
          'Artikel':          { title: [{ text: { content: e.produktName || e.name || 'Unbekannt' } }] },
          'Menge':            { rich_text: [{ text: { content: String(e.menge || '') + (e.einheit ? ' ' + e.einheit : '') } }] },
          'Kategorie':        { select: { name: e.kategorie || 'Sonstiges' } },
          'Dringlichkeit':    { select: { name: dring } },
          'Status':           { select: { name: 'Offen' } },
          'Eingetragen von':  { rich_text: [{ text: { content: e.eingetragen || 'App' } }] },
          'Bemerkung':        { rich_text: [{ text: { content: e.bemerkung || '' } }] },
          'Datum':            { date: { start: (e.datum || new Date().toISOString().slice(0, 10)) } },
          'Quelle':           { rich_text: [{ text: { content: 'Pizzeria San Carino App' } }] }
        }
      };
      const resp = await axios.post('https://api.notion.com/v1/pages', body, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });
      results.push({ id: resp.data.id, name: e.produktName || e.name });
    }
    res.json({ success: true, synced: results.length, entries: results });
  } catch(e) {
    const msg = e.response?.data?.message || e.message;
    res.status(500).json({ error: msg });
  }
});

// POST /api/notion/tagesbericht — Tagesbericht als Notion-Seite speichern
app.post('/api/notion/tagesbericht', express.json(), async (req, res) => {
  try {
    const { apiKey, parentId, bericht } = req.body;
    if (!apiKey || !parentId) return res.status(400).json({ error: 'API Key oder Parent-ID fehlt' });
    const heute = new Date().toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric' });
    const body = {
      parent: { page_id: parentId },
      properties: { title: [{ text: { content: `📊 Tagesbericht ${heute}` } }] },
      children: [
        { object:'block', type:'heading_2', heading_2:{ rich_text:[{ text:{ content:'💰 Umsatz' } }] } },
        { object:'block', type:'paragraph', paragraph:{ rich_text:[{ text:{ content: bericht.umsatz || '—' } }] } },
        { object:'block', type:'heading_2', heading_2:{ rich_text:[{ text:{ content:'📋 Fehlmaterial' } }] } },
        { object:'block', type:'paragraph', paragraph:{ rich_text:[{ text:{ content: bericht.fehlmaterial || 'Kein Fehlmaterial' } }] } },
        { object:'block', type:'heading_2', heading_2:{ rich_text:[{ text:{ content:'✅ Checklisten' } }] } },
        { object:'block', type:'paragraph', paragraph:{ rich_text:[{ text:{ content: bericht.checklisten || '—' } }] } }
      ]
    };
    const resp = await axios.post('https://api.notion.com/v1/pages', body, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' }
    });
    res.json({ success: true, url: resp.data.url });
  } catch(e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

// POST /api/notion/aufgaben — Aufgaben-Liste als Notion-Seite (upsert)
app.post('/api/notion/aufgaben', express.json(), async (req, res) => {
  try {
    const { aufgaben, apiKey, parentId } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'Notion API Key fehlt' });
    const title = 'Aufgaben — Pizzeria San Carino';
    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
    // Search for existing page
    const searchResp = await axios.post('https://api.notion.com/v1/search', { query: title, filter: { value: 'page', property: 'object' } }, { headers });
    const existing = searchResp.data.results?.[0];
    const blocks = (aufgaben||[]).map(a => ({
      object: 'block', type: 'to_do',
      to_do: { rich_text: [{ type: 'text', text: { content: (a.titel||a.text||'Aufgabe') + (a.faellig ? ' — fällig: ' + a.faellig : '') + (a.mitarbeiter && a.mitarbeiter !== 'alle' ? ' (' + a.mitarbeiter + ')' : '') } }], checked: a.status === 'erledigt' || !!a.erledigt }
    }));
    if (!blocks.length) blocks.push({ object:'block', type:'paragraph', paragraph:{ rich_text:[{ type:'text', text:{ content:'Keine offenen Aufgaben.' } }] } });
    let pageId;
    if (existing) {
      // Clear and replace children
      const childResp = await axios.get(`https://api.notion.com/v1/blocks/${existing.id}/children`, { headers });
      for (const block of (childResp.data.results||[])) {
        await axios.delete(`https://api.notion.com/v1/blocks/${block.id}`, { headers }).catch(() => {});
      }
      await axios.patch(`https://api.notion.com/v1/blocks/${existing.id}/children`, { children: blocks }, { headers });
      pageId = existing.id;
    } else {
      const parent = parentId ? { page_id: parentId } : { workspace: true };
      const createResp = await axios.post('https://api.notion.com/v1/pages', { parent, properties: { title: [{ type:'text', text:{ content: title } }] }, children: blocks }, { headers });
      pageId = createResp.data.id;
    }
    res.json({ success: true, page_id: pageId });
  } catch(e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

// POST /api/notion/schichtzeiten — Öffnungszeiten in Notion speichern/updaten
app.post('/api/notion/schichtzeiten', express.json(), async (req, res) => {
  try {
    const { schichtzeiten, text } = req.body;
    const apiKey = process.env.NOTION_API_KEY;
    const parentId = process.env.NOTION_PARENT_PAGE_ID;
    if (!apiKey) return res.status(400).json({ error: 'NOTION_API_KEY fehlt in .env' });
    const title = 'Öffnungszeiten — Pizzeria San Carino';
    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
    const dayNames = {Mo:'Montag',Di:'Dienstag',Mi:'Mittwoch',Do:'Donnerstag',Fr:'Freitag',Sa:'Samstag',So:'Sonntag'};
    const blocks = [
      { object:'block', type:'heading_2', heading_2:{ rich_text:[{ type:'text', text:{ content:'Wöchentliche Öffnungszeiten' } }] } },
      ...Object.entries(schichtzeiten||{}).map(([d, cfg]) => ({
        object:'block', type:'paragraph',
        paragraph:{ rich_text:[{ type:'text', text:{ content: (dayNames[d]||d) + ': ' + (cfg.ruhetag ? '🔴 Ruhetag' : '🟢 ' + (cfg.von||'11:00') + ' – ' + (cfg.bis||'23:00') + ' Uhr') } }] }
      })),
      { object:'block', type:'paragraph', paragraph:{ rich_text:[{ type:'text', text:{ content:'Zuletzt aktualisiert: ' + new Date().toLocaleDateString('de-AT') } }] } }
    ];
    const searchResp = await axios.post('https://api.notion.com/v1/search', { query: title, filter: { value:'page', property:'object' } }, { headers });
    const existing = searchResp.data.results?.[0];
    if (existing) {
      const childResp = await axios.get(`https://api.notion.com/v1/blocks/${existing.id}/children`, { headers });
      for (const block of (childResp.data.results||[])) {
        await axios.delete(`https://api.notion.com/v1/blocks/${block.id}`, { headers }).catch(() => {});
      }
      await axios.patch(`https://api.notion.com/v1/blocks/${existing.id}/children`, { children: blocks }, { headers });
      res.json({ success: true, page_id: existing.id, action: 'updated' });
    } else {
      const parent = parentId ? { page_id: parentId } : { workspace: true };
      const createResp = await axios.post('https://api.notion.com/v1/pages', { parent, properties: { title: [{ type:'text', text:{ content: title } }] }, children: blocks }, { headers });
      res.json({ success: true, page_id: createResp.data.id, action: 'created' });
    }
  } catch(e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

// POST /api/gmail/draft — Gmail Entwurf (benötigt Gmail OAuth — fällt auf mailto zurück)
app.post('/api/gmail/draft', express.json(), async (_req, res) => {
  res.status(503).json({ error: 'Gmail API nicht konfiguriert — bitte mailto-Fallback nutzen' });
});

// GET /api/google-bewertungen?place_id=... — Google Reviews via Places API
app.get('/api/google-bewertungen', async (req, res) => {
  const placeId = req.query.place_id;
  if (!placeId) return res.status(400).json({ error: 'place_id Parameter fehlt' });
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY fehlt in .env' });
  try {
    const resp = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'reviews,rating,user_ratings_total,name',
        key: apiKey,
        language: 'de'
      }
    });
    if (resp.data.status !== 'OK') {
      return res.status(400).json({ error: resp.data.status + ': ' + (resp.data.error_message || 'Ungültige Place ID oder API Key') });
    }
    const result = resp.data.result || {};
    const reviews = (result.reviews || []).map(r => ({
      autor: r.author_name || '',
      datum: new Date(r.time * 1000).toISOString().slice(0, 10),
      sterne: r.rating || 0,
      text: r.text || '',
      titel: '',
      plattform: 'google',
      geantwortet: !!(r.owner_response?.text),
      antwortText: r.owner_response?.text || ''
    }));
    res.json({ reviews, rating: result.rating || 0, total: result.user_ratings_total || 0, name: result.name || '' });
  } catch (e) {
    res.status(500).json({ error: e.response?.data?.error_message || e.message });
  }
});

// POST /api/claude-vision — OCR Rechnung via Anthropic API
app.post('/api/claude-vision', express.json({ limit: '15mb' }), async (req, res) => {
  const { image, mimeType } = req.body;
  if (!image) return res.status(400).json({ error: 'Kein Bild übermittelt' });
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CLAUDE_API_KEY fehlt in .env' });
  try {
    const resp = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: 'Du analysierst eine Restaurantrechnung. Extrahiere alle Artikel mit Preis, Menge und Shop-Name. Antworte NUR mit validem JSON ohne Markdown: {"shop":"","datum":"YYYY-MM-DD","positionen":[{"produkt":"","menge":1,"einheit":"kg","preis_brutto":0.00}]}',
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: image } },
        { type: 'text', text: 'Analysiere diese Rechnung und gib das JSON zurück.' }
      ]}]
    }, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
    });
    const text = (resp.data.content?.[0]?.text || '').trim();
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch(e) {
    const msg = e.response?.data?.error?.message || e.message;
    res.status(500).json({ error: msg });
  }
});

// ── Universeller App-Datenspeicher (localStorage Backup) ─────────────────────
app.get('/api/data/:key', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM app_data WHERE key=?').get(req.params.key);
    res.json(row ? JSON.parse(row.data) : null);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/data/:key', express.json(), (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at")
      .run(req.params.key, data);
    tursoWriteAppData(req.params.key, data);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/data', (_req, res) => {
  try {
    const rows = db.prepare('SELECT key, data, updated_at FROM app_data ORDER BY updated_at DESC').all();
    const result = {};
    rows.forEach(r => { result[r.key] = JSON.parse(r.data); });
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

function wsBroadcastRechnung(dateiname) {
  if (typeof syncClients === 'undefined') return;
  const msg = JSON.stringify({ type:'neue_rechnung', dateiname });
  for (const c of syncClients) { if (c.readyState === 1) c.send(msg); }
}

// ── Rechnungen Ordner beobachten ─────────────────────────────────────────────
const DATENBANK_DIR  = path.join(__dirname, 'datenbank');
const RECHNUNGEN_DIR = path.join(DATENBANK_DIR, 'rechnungen');
if (!fs.existsSync(RECHNUNGEN_DIR)) fs.mkdirSync(RECHNUNGEN_DIR, { recursive: true });
if (!fs.existsSync(path.join(DATENBANK_DIR,'mitarbeiter'))) fs.mkdirSync(path.join(DATENBANK_DIR,'mitarbeiter'), { recursive: true });

const GENERISCHE_WORTE = new Set([
  'rechnung', 'rechnungnr', 'invoice', 'whatsapp', 'image', 'img',
  'foto', 'photo', 'scan', 'dokument', 'document', 'file', 'datei', 'neu', 'new'
]);

function rechnungFromFile(dateiname) {
  const ext = path.extname(dateiname).toLowerCase().replace('.','');
  const ohneExt = path.basename(dateiname, path.extname(dateiname));
  // Datum aus Dateiname raten
  const datumMatch = ohneExt.match(/(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4}|\d{8})/);
  let datum = new Date().toISOString().slice(0,10);
  if (datumMatch) {
    const d = datumMatch[1].replace(/\./g,'-');
    datum = d.length === 8 ? d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8) : d;
  }
  // Lieferant: erstes Wort das kein generisches Wort und keine Zahl ist
  const teile = ohneExt.split(/[_\-\s]+/);
  const lieferant = teile.find(t => t.length > 1 && !GENERISCHE_WORTE.has(t.toLowerCase()) && !/^\d+$/.test(t)) || '';
  return { dateiname, lieferant, datum, typ: ext };
}

fs.watch(RECHNUNGEN_DIR, (event, filename) => {
  if (!filename) return;
  if (filename.endsWith('.json') || filename.endsWith('.md')) return;
  const filepath = path.join(RECHNUNGEN_DIR, filename);
  if (!fs.existsSync(filepath)) return;
  const stat = fs.statSync(filepath);
  if (!stat.isFile()) return;
  // Prüfen ob schon in DB
  const exists = db.prepare('SELECT id FROM rechnungen WHERE dateiname=?').get(filename);
  if (exists) return;
  const info = rechnungFromFile(filename);
  db.prepare('INSERT INTO rechnungen (dateiname,dateipfad,lieferant,datum,typ) VALUES (?,?,?,?,?)')
    .run(filename, filepath, info.lieferant, info.datum, info.typ);
  // JSON-Spiegel in datenbank/rechnungen/
  const jsonPath = path.join(DATENBANK_DIR,'rechnungen', filename.replace(/\.[^.]+$/,'')+'.json');
  fs.writeFileSync(jsonPath, JSON.stringify({dateiname:filename,lieferant:info.lieferant,datum:info.datum,typ:info.typ,pfad:filepath}, null, 2));
  console.log('  Neue Rechnung erkannt:', filename);
  wsBroadcastRechnung(filename);
});

// Beim Start: bestehende Dateien einlesen die noch nicht in DB sind
fs.readdirSync(RECHNUNGEN_DIR).forEach(filename => {
  if (filename.endsWith('.json') || filename.endsWith('.md')) return;
  const filepath = path.join(RECHNUNGEN_DIR, filename);
  if (!fs.statSync(filepath).isFile()) return;
  const exists = db.prepare('SELECT id FROM rechnungen WHERE dateiname=?').get(filename);
  if (exists) return;
  const info = rechnungFromFile(filename);
  db.prepare('INSERT INTO rechnungen (dateiname,dateipfad,lieferant,datum,typ) VALUES (?,?,?,?,?)')
    .run(filename, filepath, info.lieferant, info.datum, info.typ);
  const jsonPath = path.join(DATENBANK_DIR,'rechnungen', filename.replace(/\.[^.]+$/,'')+'.json');
  fs.writeFileSync(jsonPath, JSON.stringify({dateiname:filename,lieferant:info.lieferant,datum:info.datum,typ:info.typ,pfad:filepath}, null, 2));
});

// ── Rechnungen API ────────────────────────────────────────────────────────────
app.get('/api/rechnungen', (_req, res) => {
  try { res.json(db.prepare('SELECT * FROM rechnungen ORDER BY created_at DESC').all()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
app.patch('/api/rechnungen/:id', express.json(), (req, res) => {
  try {
    const { lieferant='', betrag=0, datum='', notiz='' } = req.body || {};
    db.prepare('UPDATE rechnungen SET lieferant=?,betrag=?,datum=?,notiz=? WHERE id=?')
      .run(lieferant, parseFloat(betrag)||0, datum, notiz, req.params.id);
    // Spiegel aktualisieren
    const r = db.prepare('SELECT * FROM rechnungen WHERE id=?').get(req.params.id);
    if (r) {
      const jsonPath = path.join(DATENBANK_DIR,'rechnungen', r.dateiname.replace(/\.[^.]+$/,'')+'.json');
      fs.writeFileSync(jsonPath, JSON.stringify(r, null, 2));
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/rechnungen/:id', (req, res) => {
  try {
    const r = db.prepare('SELECT * FROM rechnungen WHERE id=?').get(req.params.id);
    db.prepare('DELETE FROM rechnungen WHERE id=?').run(req.params.id);
    if (r) {
      const jsonPath = path.join(DATENBANK_DIR,'rechnungen', r.dateiname.replace(/\.[^.]+$/,'')+'.json');
      if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Mitarbeiter API ──────────────────────────────────────────────────────────
app.get('/api/mitarbeiter', (_req, res) => {
  try { res.json(db.prepare('SELECT * FROM mitarbeiter ORDER BY name').all()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/mitarbeiter', express.json(), (req, res) => {
  try {
    const { id, name, rolle='Küche', stunden=0, lohn=0, farbe='#8B0000' } = req.body || {};
    if (!id || !name) return res.status(400).json({ error: 'id und name erforderlich' });
    db.prepare(`INSERT OR REPLACE INTO mitarbeiter (id,name,rolle,stunden,lohn,farbe) VALUES (?,?,?,?,?,?)`)
      .run(id, name, rolle, parseFloat(stunden)||0, parseFloat(lohn)||0, farbe);
    tursoWriteMa({id, name, rolle, stunden: parseFloat(stunden)||0, lohn: parseFloat(lohn)||0, farbe});
    // Spiegel in datenbank/mitarbeiter/
    const jsonPath = path.join(DATENBANK_DIR,'mitarbeiter', id+'.json');
    fs.writeFileSync(jsonPath, JSON.stringify({id,name,rolle,stunden,lohn,farbe,gespeichert:new Date().toISOString()}, null, 2));
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
// Lohnzettel → Mitarbeiter-DB sync (Gehalt + Stunden automatisch)
app.post('/api/mitarbeiter/sync-lohnzettel', (_req, res) => {
  try {
    const lohnRaw = db.prepare("SELECT data FROM app_data WHERE key='psc_lohnabrechnungen'").get();
    if (!lohnRaw) return res.status(404).json({ error: 'Keine Lohnabrechnungsdaten vorhanden. Bitte zuerst PDF hochladen.' });
    const lohnData = JSON.parse(lohnRaw.data);
    const pdfMa = (lohnData && lohnData.abrechnungen) ? lohnData.abrechnungen : [];
    if (!pdfMa.length) return res.status(404).json({ error: 'Keine Mitarbeiterdaten in Lohnabrechnung' });

    const dbMa = db.prepare('SELECT * FROM mitarbeiter').all();
    const MA_FARBEN = ['#8B0000','#c62828','#ad1457','#6a1b9a','#283593','#1565c0','#00695c','#2e7d32','#e65100','#4e342e'];

    function nameWords(s) { return (s||'').toLowerCase().split(/\s+/).filter(w => w.length >= 3); }
    function findMatch(pdfName, dbList) {
      const pdfWords = nameWords(pdfName);
      for (const dbE of dbList) {
        const dbWords = nameWords(dbE.name);
        for (const pw of pdfWords) { for (const dw of dbWords) { if (pw.startsWith(dw) || dw.startsWith(pw)) return dbE; } }
      }
      return null;
    }
    // Stunden/Lohn schätzen aus Monatslohn
    function schätzeStundenLohn(ma) {
      const monat = ma.monatslohn || 0;
      const vollzeit = 173; // 40 Std/Wo × 4,33 Wo/Mo
      let stunden, lohn;
      if (monat >= 1300) { stunden = 40; lohn = +(monat / vollzeit).toFixed(2); }
      else if (monat >= 700) { stunden = Math.round(monat / 4.33 / 13.5); lohn = 13.5; }
      else if (monat > 0) { stunden = Math.max(8, Math.round(monat / 4.33 / 13.5)); lohn = 13.5; }
      else { stunden = 0; lohn = 0; }
      return { stunden, lohn };
    }
    function berufToRolle(beruf) {
      const b = (beruf||'').toLowerCase();
      if (b.includes('fahrer') || b.includes('liefer')) return 'Lieferung';
      if (b.includes('küche') || b.includes('koch') || b.includes('köchin')) return 'Küche';
      if (b.includes('service') || b.includes('kellner')) return 'Service';
      if (b.includes('reinigung') || b.includes('reiniger')) return 'Reinigung';
      return 'Küche';
    }

    let aktualisiert = 0, hinzugefuegt = 0;
    const results = [];

    for (const pdfE of pdfMa) {
      const match = findMatch(pdfE.name, dbMa);
      const { stunden, lohn } = schätzeStundenLohn(pdfE);
      if (match) {
        db.prepare('UPDATE mitarbeiter SET lohn=?, stunden=? WHERE id=?').run(lohn, stunden, match.id);
        tursoWriteMa({ ...match, lohn, stunden });
        aktualisiert++;
        results.push({ aktion: 'aktualisiert', db_name: match.name, pdf_name: pdfE.name, lohn, stunden });
      } else {
        // Neu anlegen
        const id = 'ma_lohn_' + pdfE.ma_nr + '_' + Date.now();
        const rolle = berufToRolle(pdfE.beruf);
        const farbe = MA_FARBEN[(dbMa.length + hinzugefuegt) % MA_FARBEN.length];
        db.prepare('INSERT OR REPLACE INTO mitarbeiter (id,name,rolle,stunden,lohn,farbe) VALUES (?,?,?,?,?,?)').run(id, pdfE.name, rolle, stunden, lohn, farbe);
        tursoWriteMa({ id, name: pdfE.name, rolle, stunden, lohn, farbe });
        hinzugefuegt++;
        results.push({ aktion: 'neu', pdf_name: pdfE.name, lohn, stunden, rolle });
      }
    }
    // Aktuelle Liste für App-Broadcast
    const alleMA = db.prepare('SELECT * FROM mitarbeiter ORDER BY name').all();
    res.json({ ok: true, aktualisiert, hinzugefuegt, gesamt: alleMA.length, details: results });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Abgleich: DB-Mitarbeiter vs. PDF-Lohnabrechnungen
app.get('/api/mitarbeiter/abgleich', (_req, res) => {
  try {
    const dbMa = db.prepare('SELECT * FROM mitarbeiter ORDER BY name').all();
    const lohnRaw = db.prepare("SELECT data FROM app_data WHERE key='psc_lohnabrechnungen'").get();
    const lohnData = lohnRaw ? JSON.parse(lohnRaw.data) : null;
    const pdfMa = (lohnData && lohnData.abrechnungen) ? lohnData.abrechnungen : [];
    const monat = (lohnData && lohnData.zahlungsjournal) ? (lohnData.zahlungsjournal.monat||'') : '';

    function nameWords(s) { return (s||'').toLowerCase().split(/\s+/).filter(w => w.length >= 3); }
    function findMatch(pdfName, dbList) {
      const pdfWords = nameWords(pdfName);
      for (const dbEntry of dbList) {
        const dbWords = nameWords(dbEntry.name);
        for (const pw of pdfWords) {
          for (const dw of dbWords) {
            if (pw.startsWith(dw) || dw.startsWith(pw)) return dbEntry;
          }
        }
      }
      return null;
    }

    const matched = pdfMa.map(pdfE => ({ ...pdfE, dbMatch: findMatch(pdfE.name, dbMa) || null }));
    const fehlende = matched.filter(m => !m.dbMatch);

    res.json({ dbCount: dbMa.length, pdfCount: pdfMa.length, monat, pdfMitarbeiter: matched, fehlende });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/mitarbeiter/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM mitarbeiter WHERE id = ?').run(req.params.id);
    tursoDeleteMa(req.params.id);
    const jsonPath = path.join(DATENBANK_DIR,'mitarbeiter', req.params.id+'.json');
    if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Datenbank-Ordner Import-Watcher ──────────────────────────────────────────
// JSON/PDF in datenbank/<ordner>/ ablegen → erscheint automatisch in der App

function wsBroadcast(msg) {
  const payload = JSON.stringify(msg);
  for (const c of syncClients) { if (c.readyState === 1) c.send(payload); }
}

// Mitarbeiter kommen NUR aus der mitarbeiter-Tabelle (SQLite/Turso)
// JSON-Ordner-Import deaktiviert — eine einzige Datenquelle

// Andere Ordner: JSON → app_data + WebSocket broadcast
const ORDNER_KEY_MAP = {
  lager:        'pizzeria_lager',
  aufgaben:     'pizzeria_aufgaben',
  dienstplan:   'pizzeria_dienstplan',
  bestellungen: 'pizzeria_bestellung',
  fehlmaterial: 'pizzeria_fehlmaterial',
  kassabuch:    'pizzeria_kassabuch',
  lieferanten:  'pizzeria_lieferanten',
  inbox:        'pizzeria_inbox',
  umsatz:       'pizzeria_umsatz',
};

const _importDebouncers = new Map();
for (const [ordner, syncKey] of Object.entries(ORDNER_KEY_MAP)) {
  const ordnerPath = path.join(DATENBANK_DIR, ordner);
  if (!fs.existsSync(ordnerPath)) continue;
  fs.watch(ordnerPath, (event, filename) => {
    if (!filename || !filename.endsWith('.json') || filename === 'INFO.md') return;
    const debKey = ordner + '/' + filename;
    clearTimeout(_importDebouncers.get(debKey));
    _importDebouncers.set(debKey, setTimeout(() => {
      _importDebouncers.delete(debKey);
      const filepath = path.join(ordnerPath, filename);
      if (!fs.existsSync(filepath)) return;
      try {
        const neueDaten = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const existing = db.prepare('SELECT data FROM app_data WHERE key=?').get(syncKey);
        let arr = existing ? JSON.parse(existing.data) : [];
        if (!Array.isArray(arr)) arr = [];
        // Array = alles ersetzen, Objekt = anhängen
        const merged = Array.isArray(neueDaten) ? neueDaten : [...arr, neueDaten];
        const mergedJson = JSON.stringify(merged);
        db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at")
          .run(syncKey, mergedJson);
        tursoWriteAppData(syncKey, mergedJson);
        syncStore.set(syncKey, { data: merged, timestamp: Date.now(), updatedBy: 'import' });
        wsBroadcast({ action: 'remote_update', key: syncKey, data: merged, timestamp: Date.now(), updatedBy: 'import' });
        console.log(`  [Import] ${ordner}/${filename} → ${syncKey} (${Array.isArray(neueDaten) ? neueDaten.length + ' Einträge' : '1 Eintrag'})`);
      } catch(e) { console.error(`  [Import] Fehler ${ordner}/${filename}:`, e.message); }
    }, 600));
  });
}
console.log('  [Import] Datenbank-Ordner-Watcher aktiv');

// GET /api/umsatz/alle — Alle Kassabuch-Einträge aus DB
app.get('/api/umsatz/alle', (_req, res) => {
  try { res.json(db.prepare('SELECT * FROM umsatz_einnahmen ORDER BY datum DESC').all()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/umsatz/heute — Tages-Report (Einkauf aus preishistorie + Einnahmen aus DB)
app.get('/api/umsatz/heute', (_req, res) => {
  try {
    const heute = new Date().toISOString().slice(0, 10);
    const einkaufRows = db.prepare(`
      SELECT shop, shop_id, COUNT(*) AS artikel, ROUND(SUM(preis),2) AS gesamt
      FROM preishistorie WHERE datum = ? GROUP BY shop_id ORDER BY gesamt DESC
    `).all(heute);
    const einkaufTotal = einkaufRows.reduce((s, r) => s + (r.gesamt || 0), 0);
    const einnahmen = db.prepare(`
      SELECT datum, ROUND(SUM(kasse),2) AS kasse, ROUND(SUM(lieferdienst),2) AS lieferdienst,
             ROUND(SUM(kasse)+SUM(lieferdienst),2) AS gesamt
      FROM umsatz_einnahmen WHERE datum = ?
    `).get(heute);
    res.json({
      datum: heute,
      gesamt: Math.round(einkaufTotal * 100) / 100,
      shops: einkaufRows,
      einnahmen: einnahmen || { kasse: 0, lieferdienst: 0, gesamt: 0 }
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/umsatz/heute — Einnahme in DB speichern
app.post('/api/umsatz/heute', express.json(), (req, res) => {
  try {
    const { datum, kasse = 0, lieferdienst = 0, notiz = '' } = req.body || {};
    if (!datum) return res.status(400).json({ error: 'datum fehlt' });
    db.prepare(`DELETE FROM umsatz_einnahmen WHERE datum = ?`).run(datum);
    db.prepare(`
      INSERT INTO umsatz_einnahmen (datum, kasse, lieferdienst, notiz)
      VALUES (?, ?, ?, ?)
    `).run(datum, parseFloat(kasse) || 0, parseFloat(lieferdienst) || 0, notiz);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════
// n8n Webhook
// ════════════════════════════════════════════════════════════════════
app.post('/api/webhook/n8n', express.json(), (req, res) => {
  try {
    const { typ, daten } = req.body || {};
    if (!typ) return res.status(400).json({ error: 'typ fehlt' });

    if (typ === 'preisupdate' && Array.isArray(daten)) {
      const stmt = db.prepare(`
        INSERT INTO preishistorie (produkt, shop, preis, datum, quelle)
        VALUES (?, ?, ?, ?, 'n8n')
      `);
      let count = 0;
      for (const p of daten) {
        if (p.produkt && p.shop && p.preis) {
          stmt.run(p.produkt, p.shop, parseFloat(p.preis), p.datum || new Date().toISOString().slice(0,10));
          count++;
        }
      }
      return res.json({ ok: true, typ, importiert: count });
    }

    if (typ === 'kassenbuch' && Array.isArray(daten)) {
      const ins = db.prepare(`INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto)
        VALUES (?,?,?,?,?,?,?,?)`);
      let count = 0;
      for (const e of daten) {
        if (!e.typ || !e.beschreibung) continue;
        ins.run(
          e.id || Date.now().toString(36) + Math.random().toString(36).slice(2,5),
          e.datum || new Date().toISOString(),
          e.typ, e.beschreibung,
          parseFloat(e.netto) || 0,
          parseFloat(e.mwst_satz) || 0,
          parseFloat(e.mwst_betrag) || 0,
          parseFloat(e.brutto) || 0
        );
        count++;
      }
      return res.json({ ok: true, typ, importiert: count });
    }

    // Generischer Fallback: Daten in app_data speichern
    const key = 'n8n_' + typ;
    db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at")
      .run(key, JSON.stringify(daten));
    res.json({ ok: true, typ, gespeichert: key });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════
// Start
// ════════════════════════════════════════════════════════════════════
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// ── Drucker API (ESC/POS über TCP) ────────────────────────────────────────────
import net from 'net';

function escposSend(ip, port, data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = setTimeout(() => { client.destroy(); reject(new Error('Timeout (5s)')); }, 5000);
    client.connect(port, ip, () => {
      client.write(data, () => {
        clearTimeout(timeout);
        client.end();
        resolve();
      });
    });
    client.on('error', err => { clearTimeout(timeout); reject(err); });
  });
}

function escposTestPage(storeName) {
  const ESC = 0x1B, GS = 0x1D;
  const INIT    = Buffer.from([ESC, 0x40]);
  const BOLD_ON = Buffer.from([ESC, 0x45, 0x01]);
  const BOLD_OFF= Buffer.from([ESC, 0x45, 0x00]);
  const CENTER  = Buffer.from([ESC, 0x61, 0x01]);
  const LEFT    = Buffer.from([ESC, 0x61, 0x00]);
  const CUT     = Buffer.from([GS, 0x56, 0x00]);
  const now = new Date().toLocaleString('de-AT');
  const line = '--------------------------------\n';
  return Buffer.concat([
    INIT, CENTER, BOLD_ON,
    Buffer.from(storeName + '\n', 'utf8'),
    BOLD_OFF,
    Buffer.from('Testdruck\n', 'utf8'),
    Buffer.from(line, 'utf8'),
    LEFT,
    Buffer.from(now + '\n', 'utf8'),
    Buffer.from('Drucker OK\n\n\n', 'utf8'),
    CUT
  ]);
}

app.post('/api/printer/test', express.json(), async (req, res) => {
  const { ip, port = 9100 } = req.body || {};
  if (!ip) return res.status(400).json({ error: 'IP fehlt' });
  try {
    await escposSend(ip, parseInt(port), escposTestPage('Pizzeria San Carino'));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/printer/bon', express.json(), async (req, res) => {
  const { ip, port = 9100, lines = [] } = req.body || {};
  if (!ip) return res.status(400).json({ error: 'IP fehlt' });
  try {
    const ESC = 0x1B, GS = 0x1D;
    const INIT  = Buffer.from([ESC, 0x40]);
    const CUT   = Buffer.from([GS, 0x56, 0x00]);
    const parts = [INIT];
    for (const ln of lines) {
      parts.push(Buffer.from(String(ln) + '\n', 'utf8'));
    }
    parts.push(Buffer.from('\n\n'), CUT);
    await escposSend(ip, parseInt(port), Buffer.concat(parts));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Kassenbuch API ────────────────────────────────────────────────────────────
app.get('/api/kassenbuch', (req, res) => {
  try {
    const { von, bis } = req.query;
    let sql = 'SELECT * FROM kassenbuch';
    const params = [];
    if (von && bis) { sql += ' WHERE datum >= ? AND datum <= ?'; params.push(von, bis + 'T23:59:59'); }
    else if (von)   { sql += ' WHERE datum >= ?'; params.push(von); }
    sql += ' ORDER BY datum DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/kassenbuch', express.json(), (req, res) => {
  try {
    const e = req.body;
    if (!e || !e.typ || !e.beschreibung) return res.status(400).json({ error: 'Fehlende Felder' });
    const id = e.id || Date.now().toString(36) + Math.random().toString(36).slice(2,5);
    const kbEntry = {
      id, datum: e.datum || new Date().toISOString(), typ: e.typ, beschreibung: e.beschreibung,
      netto: parseFloat(e.netto)||0, mwst_satz: parseFloat(e.mwst_satz)||0,
      mwst_betrag: parseFloat(e.mwst_betrag)||0, brutto: parseFloat(e.brutto)||0
    };
    db.prepare(`INSERT OR REPLACE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)`)
      .run(kbEntry.id, kbEntry.datum, kbEntry.typ, kbEntry.beschreibung, kbEntry.netto, kbEntry.mwst_satz, kbEntry.mwst_betrag, kbEntry.brutto);
    tursoWriteKb(kbEntry);
    res.json({ ok: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/kassenbuch/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM kassenbuch WHERE id = ?').run(req.params.id);
    tursoDeleteKb(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/kassenbuch/migrate', express.json({ limit: '10mb' }), (req, res) => {
  try {
    const list = req.body;
    if (!Array.isArray(list)) return res.status(400).json({ error: 'Array erwartet' });
    const ins = db.prepare(`INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto)
      VALUES (?,?,?,?,?,?,?,?)`);
    let count = 0;
    for (const e of list) {
      if (!e.typ || !e.beschreibung) continue;
      ins.run(
        e.id || Date.now().toString(36) + Math.random().toString(36).slice(2,5),
        e.datum || new Date().toISOString(),
        e.typ, e.beschreibung,
        parseFloat(e.netto) || 0,
        parseFloat(e.mwst_satz) || 0,
        parseFloat(e.mwst_betrag) || 0,
        parseFloat(e.brutto) || 0
      );
      count++;
    }
    console.log(`  Kassenbuch Migration: ${count} Einträge importiert`);
    res.json({ ok: true, count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Z-Bon Import (Kassen-PDF → Kassenbuch-Einträge) ──────────────────────────
app.post('/api/kassenbuch/import-zbon', express.json({ limit: '20mb' }), async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'data (base64) fehlt' });
    const buf = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const pdf = await pdfParse(buf);
    const text = pdf.text;

    // Zeitraum parsen
    const zeitraumM = text.match(/von\s+(\d{2}\.\d{2}\.\d{4})\s+bis\s+(\d{2}\.\d{2}\.\d{4})/);
    const von = zeitraumM ? zeitraumM[1].split('.').reverse().join('-') : null;
    const bis = zeitraumM ? zeitraumM[2].split('.').reverse().join('-') : null;
    const datumLabel = zeitraumM ? `${zeitraumM[1]}–${zeitraumM[2]}` : 'unbekannt';
    const buchDatum = bis || new Date().toISOString().slice(0,10);

    function parseEur(s) { return s ? parseFloat(s.replace(/\s/g,'').replace(',','.')) : 0; }

    // MwSt-Aufschlüsselung — Format: "10 % USt.1451,9014518,98"
    const m10 = text.match(/10\s*%\s*USt\.(\d[\d\s]*,\d{2})(\d[\d\s]*,\d{2})/);
    const m20 = text.match(/20\s*%\s*USt\.(\d[\d\s]*,\d{2})(\d[\d\s]*,\d{2})/);
    const ust10   = parseEur(m10?.[1]);
    const netto10 = parseEur(m10?.[2]);
    const ust20   = parseEur(m20?.[1]);
    const netto20 = parseEur(m20?.[2]);
    const brutto10 = Math.round((netto10 + ust10) * 100) / 100;
    const brutto20 = Math.round((netto20 + ust20) * 100) / 100;

    // Zahlungsarten — Format: "Bar9 626,76"
    const barM    = text.match(/\nBar(\d[\d\s]*,\d{2})/);
    const karteM  = text.match(/EC-Karte(\d[\d\s]*,\d{2})/);
    const onlineM = text.match(/Onlinebezahlung(\d[\d\s]*,\d{2})/);
    const bar    = parseEur(barM?.[1]);
    const karte  = parseEur(karteM?.[1]);
    const online = parseEur(onlineM?.[1]);

    // Foodora / Lieferando — Format: "Foodora60,71 %3 597,45"
    const foodM  = text.match(/Foodora[\d.,\s]+%(\d[\d\s]*,\d{2})/);
    const liefM  = text.match(/Lieferando[\d.,\s]+%(\d[\d\s]*,\d{2})/);
    const foodora    = parseEur(foodM?.[1]);
    const lieferando = parseEur(liefM?.[1]);

    const gesamt = Math.round((brutto10 + brutto20) * 100) / 100;

    const eintraege = [];
    const mkId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

    if (netto10 > 0) eintraege.push({
      id: mkId(), datum: buchDatum, typ: 'einnahme',
      beschreibung: `Speisen 10% MwSt — Kasse ${datumLabel}`,
      netto: netto10, mwst_satz: 10, mwst_betrag: ust10, brutto: brutto10
    });
    if (netto20 > 0) eintraege.push({
      id: mkId(), datum: buchDatum, typ: 'einnahme',
      beschreibung: `Getränke 20% MwSt — Kasse ${datumLabel}`,
      netto: netto20, mwst_satz: 20, mwst_betrag: ust20, brutto: brutto20
    });

    const ins = db.prepare(`INSERT OR IGNORE INTO kassenbuch
      (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto)
      VALUES (?,?,?,?,?,?,?,?)`);

    for (const e of eintraege) {
      ins.run(e.id, e.datum, e.typ, e.beschreibung, e.netto, e.mwst_satz, e.mwst_betrag, e.brutto);
      tursoWriteKb(e);
    }

    // app_data sync
    const allKb = db.prepare('SELECT * FROM kassenbuch ORDER BY datum DESC').all();
    const kbJson = JSON.stringify(allKb);
    db.prepare("INSERT OR REPLACE INTO app_data (key,data,updated_at) VALUES ('pizzeria_kassenbuch',?,datetime('now'))").run(kbJson);
    tursoWriteAppData('pizzeria_kassenbuch', kbJson);
    const zbonMsg = JSON.stringify({ type: 'sync', key: 'pizzeria_kassenbuch', value: kbJson });
    for (const c of syncClients) { if (c.readyState === 1) c.send(zbonMsg); }

    console.log(`  💰 Z-Bon importiert: ${datumLabel} → ${eintraege.length} Einträge, Gesamt €${gesamt}`);
    res.json({ ok: true, eintraege, gesamt, von, bis, bar, karte, online, foodora, lieferando });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Rechnungen → Kassenbuch Auto-Import ───────────────────────────────────────
app.post('/api/kassenbuch/import-rechnungen', async (_req, res) => {
  try {
    const imported = [], skipped = [];
    const existingKb = db.prepare('SELECT beschreibung FROM kassenbuch').all().map(r => r.beschreibung);

    for (const [key, def] of Object.entries(LIEFERANTEN_MUSTER)) {
      let allDocs = [];
      if (turso) {
        const r = await turso.execute('SELECT id,name,monat,typ FROM dokumente');
        allDocs = r.rows;
      } else {
        allDocs = db.prepare('SELECT id,name,monat,typ FROM dokumente').all();
      }
      const docs = allDocs.filter(d => def.fn((d.name||'').toLowerCase()) && (d.typ||'rechnung') === 'rechnung');

      for (const doc of docs) {
        const desc = def.label + ' — ' + doc.name;
        if (existingKb.some(b => b.includes(doc.name))) { skipped.push(doc.name); continue; }
        let betrag = null, datum = null;
        try {
          const buf = await ladePdfBuffer(doc.id);
          if (buf) { const p = await pdfParse(buf); betrag = extrahiereBetrag(p.text); datum = extrahiereDatum(p.text); }
        } catch(e) { console.error('[App]', e.message); }
        if (!betrag || betrag <= 0) { skipped.push(doc.name + ' (kein Betrag)'); continue; }

        // Datum bestimmen
        let datumStr = datum ? datum.split('.').reverse().join('-') : (doc.monat ? doc.monat + '-01' : new Date().toISOString().slice(0,10));
        if (datumStr.length < 8) datumStr = new Date().toISOString().slice(0,10);

        const mwstSatz = def.mwst ?? 10;
        const netto = mwstSatz > 0 ? parseFloat((betrag / (1 + mwstSatz/100)).toFixed(2)) : betrag;
        const mwst  = parseFloat((betrag - netto).toFixed(2));
        const id = 'kb_imp_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
        db.prepare('INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)')
          .run(id, datumStr, 'ausgabe', desc, netto, mwstSatz, mwst, betrag);
        if (turso) {
          await turso.execute({ sql: 'INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)', args: [id, datumStr, 'ausgabe', desc, netto, 10, mwst, betrag] }).catch(e => console.error('[Turso]', e.message));
        }
        imported.push({ name: doc.name, betrag, datum: datumStr, lieferant: def.label });
      }
    }

    const total = imported.reduce((s,e) => s + e.betrag, 0);
    broadcast({ type: 'sync', key: 'pizzeria_kassenbuch_update' });
    res.json({ ok: true, imported: imported.length, skipped: skipped.length, total, eintraege: imported });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── Lohn-PDFs → Kassenbuch ────────────────────────────────────────────────────
app.post('/api/kassenbuch/import-lohn-pdfs', async (_req, res) => {
  try {
    const imported = [], skipped = [];
    const existingKb = db.prepare('SELECT beschreibung FROM kassenbuch').all().map(r => r.beschreibung);
    let allDocs = [];
    if (turso) {
      const r = await turso.execute("SELECT id,name,monat,typ FROM dokumente WHERE typ IN ('zahlungsjournal','lohnzettel')");
      allDocs = r.rows;
    } else {
      allDocs = db.prepare("SELECT id,name,monat,typ FROM dokumente WHERE typ IN ('zahlungsjournal','lohnzettel')").all();
    }
    // Nur Lohn-relevante Docs (Abrechnungsbelege, Dienstnehmerzahlungen, Zahlungsjournal)
    const lohnDocs = allDocs.filter(d => {
      const n = (d.name||'').toLowerCase();
      return n.includes('abrechnungsbeleg') || n.includes('dienstnehmerzahlung') || n.includes('zahlungsjournal');
    });

    for (const doc of lohnDocs) {
      const desc = 'Lohnzahlung ' + (doc.monat||'?') + ' — ' + doc.name;
      if (existingKb.some(b => b.includes(doc.name) || (doc.monat && b.includes('Lohnzahlung '+doc.monat)))) {
        skipped.push(doc.name + ' (bereits vorhanden)'); continue;
      }
      let betrag = null;
      try {
        const buf = await ladePdfBuffer(doc.id);
        if (buf) {
          const p = await pdfParse(buf);
          // Suche nach Gesamtbetrag in Zahlungsjournal-Format
          const text = p.text;
          const muster = [
            /(?:gesamt|summe|total|auszahlung)[:\s]*(?:eur\s*)?(\d{1,7}[,.]\d{2})/i,
            /(\d{1,7},\d{2})\s*(?:€|eur)/i,
          ];
          for (const re of muster) {
            const m = text.match(re);
            if (m) { const v = parseFloat(m[1].replace('.','').replace(',','.')); if (v > 100 && v < 200000) { betrag = v; break; } }
          }
        }
      } catch(e) { console.error('[App]', e.message); }
      if (!betrag) { skipped.push(doc.name + ' (kein Betrag gefunden)'); continue; }

      const datumStr = doc.monat ? doc.monat + '-28' : new Date().toISOString().slice(0,10);
      const id = 'kb_lohn_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
      db.prepare('INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, datumStr, 'ausgabe', desc, betrag, 0, 0, betrag);
      if (turso) await turso.execute({ sql: 'INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)', args: [id, datumStr, 'ausgabe', desc, betrag, 0, 0, betrag] }).catch(e => console.error('[Turso]', e.message));
      imported.push({ name: doc.name, betrag, monat: doc.monat });
    }
    broadcast({ type: 'sync', key: 'pizzeria_kassenbuch_update' });
    const total = imported.reduce((s,e)=>s+e.betrag,0);
    res.json({ ok: true, imported: imported.length, skipped: skipped.length, total, eintraege: imported, skippedList: skipped });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Fixkosten → Kassenbuch monatlich generieren ───────────────────────────────
app.post('/api/kassenbuch/import-fixkosten', express.json(), async (req, res) => {
  try {
    const { fixkosten, monate } = req.body || {};
    if (!fixkosten || !monate || !monate.length) return res.json({ ok: false, error: 'Keine Daten' });
    const kategorien = [
      { key: 'miete',        label: 'Miete',        mwst: 20 },
      { key: 'strom',        label: 'Strom',        mwst: 20 },
      { key: 'versicherung', label: 'Versicherung', mwst: 0  },
      { key: 'buchhaltung',  label: 'Buchhaltung (Steuerberater)', mwst: 20 },
      { key: 'sonstige',     label: 'Sonstige Fixkosten', mwst: 20 },
    ];
    const existingKb = db.prepare('SELECT beschreibung FROM kassenbuch').all().map(r => r.beschreibung);
    const imported = [], skipped = [];

    for (const monat of monate) {
      for (const kat of kategorien) {
        const betrag = parseFloat(fixkosten[kat.key] || 0);
        if (!betrag) continue;
        const desc = kat.label + ' ' + monat;
        if (existingKb.some(b => b === desc)) { skipped.push(desc); continue; }
        const netto = kat.mwst > 0 ? parseFloat((betrag / (1 + kat.mwst/100)).toFixed(2)) : betrag;
        const mwstBetrag = parseFloat((betrag - netto).toFixed(2));
        const datumStr = monat + '-01';
        const id = 'kb_fix_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
        db.prepare('INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)')
          .run(id, datumStr, 'ausgabe', desc, netto, kat.mwst, mwstBetrag, betrag);
        if (turso) await turso.execute({ sql: 'INSERT OR IGNORE INTO kassenbuch (id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto) VALUES (?,?,?,?,?,?,?,?)', args: [id, datumStr, 'ausgabe', desc, netto, kat.mwst, mwstBetrag, betrag] }).catch(e => console.error('[Turso]', e.message));
        imported.push({ desc, betrag, monat });
      }
    }
    broadcast({ type: 'sync', key: 'pizzeria_kassenbuch_update' });
    res.json({ ok: true, imported: imported.length, skipped: skipped.length, total: imported.reduce((s,e)=>s+e.betrag,0) });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── MwSt-Auswertung ────────────────────────────────────────────────────────────
app.get('/api/kassenbuch/mwst-auswertung', (req, res) => {
  try {
    const { jahr } = req.query;
    const list = db.prepare('SELECT * FROM kassenbuch').all();
    const byMonat = {};
    list.forEach(e => {
      const m = (e.datum||'').slice(0,7);
      if (jahr && !m.startsWith(jahr)) return;
      if (!byMonat[m]) byMonat[m] = { einnahmen: 0, ausgaben: 0, ust10: 0, ust20: 0, vorsteuer10: 0, vorsteuer20: 0 };
      const brutto = parseFloat(e.brutto||0);
      const mwst = parseFloat(e.mwst_betrag||0);
      if (e.typ === 'einnahme') {
        byMonat[m].einnahmen += brutto;
        if (e.mwst_satz == 10) byMonat[m].ust10 += mwst;
        if (e.mwst_satz == 20) byMonat[m].ust20 += mwst;
      } else {
        byMonat[m].ausgaben += brutto;
        if (e.mwst_satz == 10) byMonat[m].vorsteuer10 += mwst;
        if (e.mwst_satz == 20) byMonat[m].vorsteuer20 += mwst;
      }
    });
    const monate = Object.entries(byMonat).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,v]) => ({
      monat: m, ...v,
      zahllast: parseFloat(((v.ust10+v.ust20) - (v.vorsteuer10+v.vorsteuer20)).toFixed(2)),
      saldo: parseFloat((v.einnahmen - v.ausgaben).toFixed(2))
    }));
    res.json({ ok: true, monate });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Backup API ────────────────────────────────────────────────────────────────
const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

app.post('/api/backup', express.json({ limit: '10mb' }), (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Keine Daten' });
    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${stamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify({ _created: now.toISOString(), ...data }, null, 2), 'utf8');
    // Alte Backups löschen (nur letzte 10 behalten)
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-') && f.endsWith('.json')).sort();
    if (files.length > 10) files.slice(0, files.length - 10).forEach(f => { try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch(_) {} });
    console.log(`  Backup gespeichert: ${filename}`);
    res.json({ ok: true, file: filename, created: now.toISOString() });
  } catch (err) {
    console.error('Backup Fehler:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backup/list', (_req, res) => {
  try {
    const files = fs.existsSync(BACKUP_DIR)
      ? fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-') && f.endsWith('.json')).sort().reverse()
      : [];
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── E-Mail Backfill: historische Emails per IMAP laden ──────────────────────
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

app.post('/api/email-sync/backfill', express.json(), async (req, res) => {
  const { von, bis, stichwort } = req.body || {};
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASS;
  if (!emailUser || !emailPass) return res.status(503).json({ error: '.env: EMAIL_USER oder EMAIL_APP_PASS fehlt' });

  res.json({ ok: true, nachricht: `Suche gestartet (${von} – ${bis}, "${stichwort || 'alle'}") — Ergebnis im Server-Log` });

  const client = new ImapFlow({
    host: 'imap.gmail.com', port: 993, secure: true,
    auth: { user: emailUser, pass: emailPass },
    logger: false, tls: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`  📬 Backfill: verbunden als ${emailUser}`);
    await client.mailboxOpen('INBOX');

    // IMAP-Suche: Datum + optionales Stichwort (Betreff)
    const kriterien = {};
    if (von) kriterien.since = new Date(von);
    if (bis) kriterien.before = new Date(bis);
    // Alle E-Mails (gelesen + ungelesen)

    const uids = await client.search(kriterien);
    console.log(`  📩 Backfill: ${uids.length} E-Mails im Zeitraum gefunden`);

    let verarbeitet = 0;
    const stichwortLower = (stichwort || '').toLowerCase();

    for (const uid of uids) {
      try {
        const msg = await client.fetchOne(uid, { source: true }, { uid: true });
        const mail = await simpleParser(msg.source);
        const betreff = (mail.subject || '').toLowerCase();
        const absender = (mail.from?.text || '').toLowerCase();

        // Stichwort-Filter
        if (stichwortLower && !betreff.includes(stichwortLower) && !absender.includes(stichwortLower)) continue;

        // PDF-Anhänge suchen
        const pdfs = (mail.attachments || []).filter(a =>
          a.contentType === 'application/pdf' || (a.filename || '').toLowerCase().endsWith('.pdf')
        );
        if (!pdfs.length) continue;

        console.log(`  📄 Backfill: "${mail.subject}" von ${mail.from?.text} — ${pdfs.length} PDF(s)`);

        // Typ aus Betreff/Absender ableiten
        const typText = (betreff + ' ' + absender);
        let typ = 'rechnung';
        if (typText.includes('lohn') || typText.includes('abrechnung')) typ = 'lohnzettel';
        else if (typText.includes('ogk') || typText.includes('sozialversicherung')) typ = 'ogk';
        else if (typText.includes('finanzamt') || typText.includes('steuer')) typ = 'finanzamt';

        // Monat aus E-Mail-Datum
        const datum = mail.date || new Date();
        const monat = datum.getFullYear() + '-' + String(datum.getMonth()+1).padStart(2,'0');

        for (const anhang of pdfs) {
          const dateiname = anhang.filename || 'backfill_' + Date.now() + '.pdf';
          const b64 = anhang.content.toString('base64');
          const id = 'email_bf_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);

          // In lokale DB + Turso speichern
          try {
            db.prepare('INSERT OR IGNORE INTO dokumente (id,name,typ,monat,status,groesse,erstellt) VALUES (?,?,?,?,?,?,datetime("now"))')
              .run(id, dateiname, typ, monat, 'offen', anhang.content.length);
            db.prepare("INSERT OR IGNORE INTO dokumente_data (id,data) VALUES (?,?)").run(id, b64);
            if (turso) {
              await turso.execute({ sql: 'INSERT OR IGNORE INTO dokumente (id,name,typ,monat,status,groesse,erstellt) VALUES (?,?,?,?,?,?,datetime("now"))', args: [id, dateiname, typ, monat, 'offen', anhang.content.length] }).catch(e => console.error('[Turso]', e.message));
              await turso.execute({ sql: 'INSERT OR IGNORE INTO dokumente_data (id,data) VALUES (?,?)', args: [id, b64] }).catch(e => console.error('[Turso]', e.message));
            }
            console.log(`  ✅ Backfill gespeichert: ${dateiname} (${monat}, ${typ})`);
            verarbeitet++;
            // Lohnzettel automatisch parsen
            if (typ === 'lohnzettel') {
              try {
                const pdfData = await pdfParse(anhang.content);
                const eintraege = parseLohnzettelPDF(pdfData.text);
                if (eintraege.length) await speichereLohnzettel(eintraege);
              } catch(e) { console.error('[App]', e.message); }
            }
          } catch(e2) { console.error(`  ❌ Backfill Speicher-Fehler: ${e2.message}`); }
        }
      } catch(e) { console.error('[App]', e.message); }
    }
    console.log(`  ✅ Backfill fertig: ${verarbeitet} PDFs importiert`);
    await client.logout();
  } catch(e) {
    console.error('  ❌ Backfill IMAP Fehler:', e.message);
    try { await client.logout(); } catch(_) {}
  }
});

// Beim Start: app_data in syncStore laden (verhindert Datenverlust bei Neustart)
try {
  const rows = db.prepare('SELECT key, data FROM app_data').all();
  for (const row of rows) {
    if (SYNC_KEYS.includes(row.key)) {
      try {
        syncStore.set(row.key, {
          data: JSON.parse(row.data),
          timestamp: Date.now(),
          updatedBy: 'server-start'
        });
      } catch(e) { console.error('[App]', e.message); }
    }
  }
  if (rows.length > 0) console.log(`  syncStore: ${rows.length} Keys aus DB geladen`);
} catch(e) { console.error('  syncStore Startup-Laden Fehler:', e.message); }

// Inbox-Watcher mit WebSocket-Broadcast verbinden
setBroadcast((msg) => {
  const payload = JSON.stringify(msg);
  for (const client of syncClients) {
    if (client.readyState === 1) client.send(payload);
  }
});

// Lokale PDFs einmalig zu Turso Cloud migrieren
async function migriereLocalPdfsZuTurso() {
  if (!turso) return;
  const docs = db.prepare("SELECT * FROM dokumente WHERE pfad != 'cloud' AND pfad != '' AND pfad IS NOT NULL").all()
    .filter(d => d.pfad && fs.existsSync(d.pfad));
  if (docs.length === 0) return;
  console.log(`  ☁️  Migriere ${docs.length} lokale PDFs zu Turso ...`);
  let ok = 0;
  for (const doc of docs) {
    try {
      const buf = fs.readFileSync(doc.pfad);
      const base64 = buf.toString('base64');
      await turso.batch([
        { sql: `INSERT OR REPLACE INTO dokumente (id,name,typ,monat,status,groesse) VALUES (?,?,?,?,?,?)`,
          args: [doc.id, doc.name, doc.typ||'sonstige', doc.monat||'', doc.status||'offen', doc.groesse||buf.length] },
        { sql: `INSERT OR IGNORE INTO dokumente_data (id,data) VALUES (?,?)`,
          args: [doc.id, base64] },
      ], 'write');
      db.prepare("UPDATE dokumente SET pfad='cloud' WHERE id=?").run(doc.id);
      ok++;
    } catch(e) { console.error(`  ❌ Migration ${doc.name}: ${e.message}`); }
  }
  console.log(`  ☁️  Migration: ${ok}/${docs.length} PDFs in Turso Cloud`);
}

// ── DB Admin API (nur für interne Nutzung) ────────────────────────────────

// node:sqlite gibt manchmal Uint8Array zurück statt String → korrekt dekodieren
function dbFixRow(row) {
  const fixed = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Uint8Array) {
      fixed[k] = new TextDecoder('utf-8').decode(v);
    } else if (typeof v === 'string') {
      // Versuche latin1→utf8 Konvertierung falls nötig (◆ Fix)
      try {
        const bytes = Buffer.from(v, 'binary');
        const decoded = bytes.toString('utf8');
        fixed[k] = decoded.includes('�') ? v : decoded;
      } catch(_) { fixed[k] = v; }
    } else {
      fixed[k] = v;
    }
  }
  return fixed;
}

// Alle Keys im syncStore anzeigen
app.get('/api/admin/store', (_req, res) => {
  const result = [];
  for (const [key, val] of syncStore) {
    const data = val.data;
    const isArray = Array.isArray(data);
    const count = isArray ? data.length : (data && typeof data === 'object' ? Object.keys(data).length : 1);
    result.push({ key, type: isArray ? 'array' : typeof data, count, updated: val.timestamp });
  }
  result.sort((a, b) => a.key.localeCompare(b.key));
  res.json({ ok: true, keys: result });
});

// Inhalt eines Keys abrufen
app.get('/api/admin/store/:key', (req, res) => {
  const entry = syncStore.get(req.params.key);
  if (!entry) {
    // Fallback: direkt aus DB lesen
    const row = db.prepare('SELECT data, updated_at FROM app_data WHERE key=?').get(req.params.key);
    if (!row) return res.status(404).json({ ok: false, error: 'Key nicht gefunden' });
    return res.json({ ok: true, key: req.params.key, data: JSON.parse(row.data), updated: row.updated_at });
  }
  res.json({ ok: true, key: req.params.key, data: entry.data, updated: entry.timestamp });
});

// Key vollständig aktualisieren
app.post('/api/admin/store/:key', express.json({ limit: '10mb' }), (req, res) => {
  const key = req.params.key;
  const data = req.body.data;
  const dataStr = JSON.stringify(data);
  syncStore.set(key, { data, timestamp: Date.now(), updatedBy: 'db-admin' });
  db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(key, dataStr);
  tursoWriteAppData(key, dataStr);
  res.json({ ok: true, key });
});

// Einzelnes Item aus Array-Key löschen (nach Index oder id-Feld)
app.delete('/api/admin/store/:key/item/:id', (req, res) => {
  const key = req.params.key;
  const itemId = req.params.id;
  const entry = syncStore.get(key);
  if (!entry || !Array.isArray(entry.data)) return res.status(404).json({ ok: false, error: 'Key nicht gefunden oder kein Array' });
  const vorher = entry.data.length;
  const neu = entry.data.filter(item => String(item.id || item.ID || '') !== itemId);
  if (neu.length === vorher) return res.status(404).json({ ok: false, error: 'Item nicht gefunden' });
  const dataStr = JSON.stringify(neu);
  syncStore.set(key, { data: neu, timestamp: Date.now(), updatedBy: 'db-admin' });
  db.prepare("INSERT INTO app_data (key,data,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(key, dataStr);
  tursoWriteAppData(key, dataStr);
  res.json({ ok: true, geloescht: vorher - neu.length, verbleibend: neu.length });
});

// Alle Tabellen-Übersicht (Kassenbuch, Mitarbeiter, Dokumente)
app.get('/api/admin/tables', async (_req, res) => {
  try {
    const kb = db.prepare('SELECT COUNT(*) as n FROM kassenbuch').get();
    const ma = db.prepare('SELECT COUNT(*) as n FROM mitarbeiter').get();
    const dok = db.prepare('SELECT COUNT(*) as n FROM dokumente').get();
    const ad = db.prepare('SELECT COUNT(*) as n FROM app_data').get();
    res.json({ ok: true, tabellen: [
      { name: 'kassenbuch', zeilen: kb.n, beschreibung: 'Einnahmen & Ausgaben' },
      { name: 'mitarbeiter', zeilen: ma.n, beschreibung: 'Mitarbeiterdaten' },
      { name: 'dokumente', zeilen: dok.n, beschreibung: 'PDF-Metadaten' },
      { name: 'app_data', zeilen: ad.n, beschreibung: 'App-Einstellungen & Listen' },
    ]});
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Tabelle mit Paginierung abrufen
app.get('/api/admin/table/:name', (req, res) => {
  const erlaubt = ['kassenbuch','mitarbeiter','dokumente','app_data'];
  const name = req.params.name;
  if (!erlaubt.includes(name)) return res.status(403).json({ ok: false, error: 'Nicht erlaubt' });
  const limit = Math.min(parseInt(req.query.limit || '50'), 200);
  const offset = parseInt(req.query.offset || '0');
  try {
    const raw = db.prepare(`SELECT * FROM ${name} LIMIT ? OFFSET ?`).all(limit, offset);
    const rows = raw.map(dbFixRow);
    const total = db.prepare(`SELECT COUNT(*) as n FROM ${name}`).get();
    res.json({ ok: true, tabelle: name, rows, total: total.n, limit, offset });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

(async () => {
  if (turso) {
    try {
      await tursoInitTables();
      // Prüfen ob Turso leer → ersten Push
      const countRes = await turso.execute('SELECT COUNT(*) as n FROM app_data');
      const n = Number(countRes.rows[0]?.n) || 0;
      if (n === 0) {
        console.log('  ☁️  Turso leer → Push lokale Daten ...');
        await tursoPushAll();
      }
      await tursoPull();
      // syncStore mit Turso-Daten aktualisieren
      try {
        const tRows = db.prepare('SELECT key, data FROM app_data').all();
        tRows.forEach(r => { if (SYNC_KEYS.includes(r.key)) { try { syncStore.set(r.key, { data: JSON.parse(r.data), timestamp: Date.now(), updatedBy: 'turso' }); } catch(_){} } });
        if (tRows.length > 0) console.log(`  ☁️  syncStore: ${tRows.length} Keys aus Turso`);
      } catch(e) { console.error('[App]', e.message); }
      // Lokale PDFs im Hintergrund zu Turso migrieren (einmalig)
      setTimeout(() => migriereLocalPdfsZuTurso(), 5000);
    } catch(e) { console.error('  Turso Fehler (Server startet trotzdem):', e.message); }
  }
  // ── Globaler Error-Handler (keine Stack-Traces an Client) ────────────
  app.use((err, req, res, _next) => {
    console.error(`[API Error] ${req.method} ${req.url}:`, err.message || err);
    if (res.headersSent) return;
    res.status(err.status || 500).json({ error: 'Interner Fehler' });
  });

  // Server startet sofort — Heisse-Preise lädt danach im Hintergrund
  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    handleUpgrade(httpServer);
    startWatcher();
    // Heisse-Preise im Hintergrund laden (blockiert App-Start nicht mehr)
    console.log('\n  Heisse-Preise lädt im Hintergrund (dauert 1-2 Min)...');
    loadHeissePreise().catch(e => console.error('  Heisse-Preise Fehler:', e.message));
    const ip = getLocalIP();
    console.log('\n' + '='.repeat(56));
    console.log('   Pizzeria San Carino — Server BEREIT');
    console.log('='.repeat(56));
    console.log(`   Dieses Geraet:  http://localhost:${PORT}`);
    console.log(`   WLAN (Handy):   http://${ip}:${PORT}`);
    console.log('='.repeat(56));
    console.log('   App + Preissuche in einem Server');
    console.log('   Dieses Fenster offen lassen!\n');

    // HTTPS für PWA auf Mobilgeräten im LAN
    const certPath = path.join(__dirname, 'cert.pem');
    const keyPath = path.join(__dirname, 'key.pem');

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      };
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(8443, '0.0.0.0', () => {
        handleUpgrade(httpsServer);
        console.log('🔒 HTTPS Server: https://0.0.0.0:8443');
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
          for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
              console.log(`📱 PWA installieren: https://${net.address}:8443`);
            }
          }
        }
      });
    } else {
      console.log('⚠️  Kein HTTPS-Zertifikat gefunden.');
      console.log('   Für PWA auf Mobilgeräten:');
      console.log('   1. choco install mkcert (als Admin)');
      console.log('   2. mkcert -install');
      console.log('   3. mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 DEINE-LAN-IP');
      console.log('   4. Server neu starten');
    }
  });
})();
