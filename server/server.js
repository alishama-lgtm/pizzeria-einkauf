'use strict';
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3001;

// Heisse-Preise Cache-Datei (täglich aktualisiert)
const HP_CACHE_FILE = path.join(__dirname, 'hp-cache.json');
const HP_CACHE_AGE  = 24 * 60 * 60 * 1000; // 24 Stunden

app.use(cors({ origin: '*' }));
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method} ${req.url}`);
  next();
});

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
// SPAR Austria — FactFinder API (keyword search, sofort verfügbar)
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
// Täglich gecacht, im Hintergrund geladen
// ════════════════════════════════════════════════════════════════════
let hpData    = null;   // geladene Daten (Array)
let hpLoading = false;  // wird gerade geladen?
let hpReady   = false;  // Daten bereit?
let hpError   = null;

// Nur Lebensmittelgeschäfte (Drogerien wie DM/Bipa raus)
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
    // Cache prüfen
    if (fs.existsSync(HP_CACHE_FILE)) {
      const stat = fs.statSync(HP_CACHE_FILE);
      if (Date.now() - stat.mtimeMs < HP_CACHE_AGE) {
        console.log('  Lade heisse-preise Daten aus Cache …');
        const raw = fs.readFileSync(HP_CACHE_FILE, 'utf8');
        hpData  = JSON.parse(raw);
        hpReady = true;
        console.log(`  ✅ Heisse-Preise: ${hpData.length} Produkte geladen (aus Cache)`);
        hpLoading = false;
        return;
      }
    }

    // Neu herunterladen
    console.log('  Lade heisse-preise.io Daten (einmalig, ~200MB) …');
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
    console.log(`  ✅ Heisse-Preise: ${hpData.length} Produkte geladen (frisch)`);

  } catch (e) {
    hpError = e.message;
    console.error('  ❌ Heisse-Preise Fehler:', e.message);
    // Falls Cache existiert (auch wenn veraltet), trotzdem nutzen
    if (fs.existsSync(HP_CACHE_FILE)) {
      try {
        hpData  = JSON.parse(fs.readFileSync(HP_CACHE_FILE, 'utf8'));
        hpReady = true;
        console.log(`  ⚠️  Nutze alten Cache (${hpData.length} Produkte)`);
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

  // Shops bei denen 90%+ unavailable sind → trotzdem anzeigen (Hofer, Mpreis etc.)
  // "unavailable" bedeutet dort nur "nicht diese Woche im Katalog", Preise sind trotzdem gültig
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
    // Nur filtern wenn Shop normale Verfügbarkeit hat (< 90% unavailable)
    const rate = hpData._unavailRate[p.store] || 0;
    if (p.unavailable && rate < 0.9) return false;
    const n = (p.name || '').toLowerCase();
    return words.every(w => n.includes(w));
  });

  // Deduplizieren: pro Shop+Name nur den günstigsten Preis
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

  console.log(`\n🔍 Suche: "${q}"`);

  // SPAR direkt (immer live), andere aus heisse-preise Cache
  const [sparRes, hpRes] = await Promise.allSettled([
    searchSpar(q),
    Promise.resolve(searchHeissePreise(q)),
  ]);

  const spar = sparRes.value || [];
  const hp   = hpRes.value  || [];

  console.log(`  Spar: ${spar.length}  |  heisse-preise: ${hp.length}`);

  // Heisse-preise Spar-Einträge entfernen falls Spar direkt funktioniert
  const hpFiltered = spar.length > 0
    ? hp.filter(r => !['Spar', 'Interspar'].includes(r.shop))
    : hp;

  const all = [...spar, ...hpFiltered]
    .filter(r => r.price !== null && r.price > 0)
    .sort((a, b) => (a.price || 999) - (b.price || 999));

  console.log(`  ✅ Gesamt: ${all.length} Ergebnisse\n`);

  // Hinweis wenn heisse-preise noch lädt
  if (!hpReady) {
    res.json({ items: all, notice: 'Billa/Hofer/Lidl-Daten werden noch geladen …' });
  } else {
    res.json(all);
  }
});

// Status endpoint für Frontend
app.get('/api/status', (_req, res) => {
  res.json({ hpReady, hpLoading, hpItems: hpData?.length || 0 });
});

// ════════════════════════════════════════════════════════════════════
// Start — erst Daten laden, dann Port öffnen
// ════════════════════════════════════════════════════════════════════
console.log('\n  Lade Preisdaten …');
loadHeissePreise().then(() => {
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   🍕 Pizzeria Preisserver BEREIT                     ║');
    console.log(`║   Port: ${PORT}  →  http://localhost:${PORT}/api/search?q=...  ║`);
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log('  Alle Shops verfügbar: Spar, Billa, Hofer, Mpreis ✅');
    console.log('  Dieses Fenster offen lassen!\n');
  });
});
