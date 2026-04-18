'use strict';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { startWatcher, setBroadcast, getQueue, markDone, deleteEntry, clearProcessed, getFolderInfo } from './server/watcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = 8080;

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
const phInsert = db.prepare(`
  INSERT INTO preishistorie (produkt_id, produkt, preis, normalpreis, shop, shop_id, datum, quelle)
  VALUES ($produkt_id, $produkt, $preis, $normalpreis, $shop, $shop_id, $datum, $quelle)
`);
console.log('  SQLite Preishistorie bereit →', path.join(__dirname, 'pizzeria.db'));

// Heisse-Preise Cache-Datei (im selben Ordner)
const HP_CACHE_FILE = path.join(__dirname, 'hp-cache.json');
const HP_CACHE_AGE  = 24 * 60 * 60 * 1000; // 24 Stunden

app.use(cors({ origin: '*' }));
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method} ${req.url}`);
  next();
});

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
  'pizzeria_lager', 'pizzeria_bestellung', 'pizzeria_fehlmaterial',
  'pizzeria_aufgaben', 'pizzeria_mitarbeiter', 'pizzeria_wochenplan',
  'pizzeria_dienstplan', 'pizzeria_schichtcheck', 'pizzeria_notifications'
];

const syncStore = new Map();
const syncClients = new Set();

const wss = new WebSocketServer({ noServer: true });

function handleUpgrade(server) {
  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws/sync') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
}

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
            syncStore.set(msg.key, {
              data: msg.data,
              timestamp: msg.timestamp || Date.now(),
              updatedBy: msg.user || 'unknown'
            });
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
    res.json(db.prepare(sql).all(params));
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

// GET /api/umsatz/heute — Tages-Report (Einkauf aus preishistorie + Einnahmen aus DB)
app.get('/api/umsatz/heute', (_req, res) => {
  try {
    const heute = new Date().toISOString().slice(0, 10);
    const einkaufRows = db.prepare(`
      SELECT shop, shop_id, COUNT(*) AS artikel, ROUND(SUM(preis),2) AS gesamt
      FROM preishistorie WHERE datum = ? GROUP BY shop_id ORDER BY gesamt DESC
    `).all([heute]);
    const einkaufTotal = einkaufRows.reduce((s, r) => s + (r.gesamt || 0), 0);
    const einnahmen = db.prepare(`
      SELECT datum, ROUND(SUM(kasse),2) AS kasse, ROUND(SUM(lieferdienst),2) AS lieferdienst,
             ROUND(SUM(kasse)+SUM(lieferdienst),2) AS gesamt
      FROM umsatz_einnahmen WHERE datum = ?
    `).get([heute]);
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
    db.prepare(`
      INSERT INTO umsatz_einnahmen (datum, kasse, lieferdienst, notiz)
      VALUES (?, ?, ?, ?)
    `).run([datum, parseFloat(kasse) || 0, parseFloat(lieferdienst) || 0, notiz]);
    res.json({ ok: true });
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

// Inbox-Watcher mit WebSocket-Broadcast verbinden
setBroadcast((msg) => {
  const payload = JSON.stringify(msg);
  for (const client of syncClients) {
    if (client.readyState === 1) client.send(payload);
  }
});

console.log('\n  Lade Preisdaten ...');
loadHeissePreise().then(() => {
  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    handleUpgrade(httpServer);
    startWatcher();
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
});
