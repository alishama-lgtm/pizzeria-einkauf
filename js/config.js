// ═══════════════════════════════════════════════════════════════
// API KEYS
// ═══════════════════════════════════════════════════════════════
const ANTHROPIC_API_KEY ="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";

let GEMINI_API_KEY = '';
try { GEMINI_API_KEY = localStorage.getItem('pizzeria_gemini_key') || ''; } catch(e) {}

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const PRODUCTS = [
  { id: 'mehl',       name: 'Pizzamehl Tipo 00',       category: 'Grundzutaten', unit: 'kg',      currentStock: 1.5,  minStock: 5,   orderQuantity: 10 },
  { id: 'tomaten',    name: 'San Marzano Tomaten',      category: 'Grundzutaten', unit: 'Dosen',   currentStock: 3,    minStock: 10,  orderQuantity: 24 },
  { id: 'mozzarella', name: 'Mozzarella di Bufala',     category: 'Käse',         unit: 'kg',      currentStock: 0.8,  minStock: 4,   orderQuantity: 5  },
  { id: 'olivenoel',  name: 'Olivenöl Extra Vergine',   category: 'Grundzutaten', unit: 'Liter',   currentStock: 1.2,  minStock: 3,   orderQuantity: 5  },
  { id: 'salami',     name: 'Salami Milano',            category: 'Belag',        unit: 'kg',      currentStock: 0.4,  minStock: 2,   orderQuantity: 3  },
  { id: 'parmesan',   name: 'Parmigiano Reggiano',      category: 'Käse',         unit: 'kg',      currentStock: 0.3,  minStock: 1,   orderQuantity: 2  },
  { id: 'basilikum',  name: 'Frischer Basilikum',       category: 'Gewürze',      unit: 'Bund',    currentStock: 2,    minStock: 5,   orderQuantity: 10 },
  { id: 'hefe',       name: 'Frische Hefe',             category: 'Grundzutaten', unit: 'Päckchen',currentStock: 15,   minStock: 10,  orderQuantity: 20 },
  { id: 'salz',       name: 'Meersalz',                 category: 'Gewürze',      unit: 'kg',      currentStock: 3,    minStock: 2,   orderQuantity: 5  },
  { id: 'peperoni',   name: 'Peperoni',                 category: 'Belag',        unit: 'kg',      currentStock: 0.2,  minStock: 1.5, orderQuantity: 2  },
];

const SHOPS = [
  { id: 'metro', name: 'Metro',  type: 'Großhandel', color: '#003DA5' },
  { id: 'billa', name: 'Billa',  type: 'Supermarkt', color: '#ed1c24' },
  { id: 'lidl',  name: 'Lidl',   type: 'Discounter', color: '#0050AA' },
  { id: 'spar',  name: 'Spar',   type: 'Supermarkt', color: '#007f3e' },
];

// pricePerUnit indexed as PRICE_MAP[shopId][productId]
const PRICE_MAP = {
  metro: { mehl:0.89, tomaten:0.99, mozzarella:4.99, olivenoel:5.49, salami:7.99, parmesan:8.99, basilikum:0.69, hefe:0.39, salz:0.49, peperoni:5.99 },
  billa: { mehl:1.19, tomaten:1.39, mozzarella:4.49, olivenoel:5.99, salami:8.49, parmesan:10.99,basilikum:0.89, hefe:0.45, salz:0.59, peperoni:6.49 },
  lidl:  { mehl:0.79, tomaten:0.89, mozzarella:3.99, olivenoel:4.49, salami:6.49, parmesan:7.99, basilikum:0.59, hefe:0.29, salz:0.39, peperoni:4.99 },
  spar:  { mehl:1.09, tomaten:1.29, mozzarella:4.29, olivenoel:5.49, salami:7.99, parmesan:9.99, basilikum:0.79, hefe:0.39, salz:0.55, peperoni:5.99 },
};

// Weekly deals — populated here or via Upload tab
// week: 'current' = diese Woche, 'next' = ab Montag
const DEALS = [
  { shopId: 'lidl',  productId: 'mozzarella', pricePerUnit: 2.99, normalPrice: 3.99, validTo: '29.03.', week: 'current' },
  { shopId: 'metro', productId: 'olivenoel',  pricePerUnit: 4.29, normalPrice: 5.49, validTo: '29.03.', week: 'current' },
  { shopId: 'billa', productId: 'salami',     pricePerUnit: 6.49, normalPrice: 8.49, validTo: '30.03.', week: 'current' },
  { shopId: 'spar',  productId: 'parmesan',   pricePerUnit: 7.49, normalPrice: 9.99, validTo: '06.04.', week: 'next'    },
  { shopId: 'lidl',  productId: 'mehl',       pricePerUnit: 0.59, normalPrice: 0.79, validTo: '06.04.', week: 'next'    },
];

// Mutable stock levels
const stockLevels = {};
PRODUCTS.forEach(p => stockLevels[p.id] = p.currentStock);

// ═══════════════════════════════════════════════════════════════
// HISTORY (LocalStorage)
// ═══════════════════════════════════════════════════════════════

let HISTORY = [];
try { HISTORY = JSON.parse(localStorage.getItem('pizzeria_history') || '[]'); } catch(_) { HISTORY = []; }

function saveHistory() {
  try { localStorage.setItem('pizzeria_history', JSON.stringify(HISTORY)); } catch(_) {}
}

function addHistoryEntry(entry) {
  const e = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2,7),
    datum:       entry.datum       || new Date().toISOString().slice(0,10),
    produktName: entry.produktName || '',
    produktId:   entry.produktId   || null,
    menge:       entry.menge       != null ? Number(entry.menge)  : null,
    einheit:     entry.einheit     || 'Stk',
    preis:       entry.preis       != null ? Number(entry.preis)  : null,
    shopName:    entry.shopName    || null,
    shopId:      entry.shopId      || null,
    quelle:      entry.quelle      || 'manuell',
  };
  HISTORY.unshift(e);
  if (HISTORY.length > 2000) HISTORY = HISTORY.slice(0, 2000);
  saveHistory();
}

const VERLAUF_FILTER = { shop: '', produkt: '', monat: '' };

const SUCHE_STATE = {
  results: [],
  query: '',
  loading: false,
  error: null,
  loadingStep: '',
  addedIds: new Set(),
  fromCache: false,
  cacheDate: null,
};

// Such-Cache: Ergebnisse werden 7 Tage gespeichert
const SUCHE_CACHE_DAYS = 7;

// Shop color map for Austrian retailers
const AT_SHOP_COLORS = {
  'billa':     '#ed1c24',
  'interspar': '#007f3e',
  'spar':      '#007f3e',
  'hofer':     '#F7941D',
  'lidl':      '#0050aa',
  'metro':     '#003da5',
  'etsan':     '#ff6b00',
  'penny':     '#cc0000',
  'mpreis':    '#e30613',
  'unimarkt':  '#e30613',
  'merkur':    '#004899',
};

function shopColor(shopName) {
  const key = shopName.toLowerCase().trim();
  for (const [k, v] of Object.entries(AT_SHOP_COLORS)) {
    if (key.includes(k)) return v;
  }
  return '#555';
}
