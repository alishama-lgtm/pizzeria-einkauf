// js/angebote.js — Aktionsfinder-Style Prospekte System
// ═══════════════════════════════════════════════════════════════

// ═══ STATE ═══════════════════════════════════════════════════════
const ANGEBOTE_STATE = {
  view: 'prospekte',      // 'prospekte' | 'detail' | 'suche' | 'neu' | 'live'
  selectedProspektId: null,
  searchQuery: '',
  filterStore: '',
  filterCategory: '',
  filterBundesland: '',
  liveStoreId: null,
  liveLoading: false,
  liveError: null,
  liveFilterCat: '',
};

// ═══ LIVE STORES ═════════════════════════════════════════════════
const LIVE_STORES = [
  { id:'lidl',  name:'Lidl',  gradient:'linear-gradient(135deg,#0050AA,#003d8f)', color:'#0050AA', emoji:'🛒' },
  { id:'hofer', name:'Hofer', gradient:'linear-gradient(135deg,#F7941D,#e07a08)', color:'#F7941D', emoji:'🏷️' },
  { id:'billa', name:'Billa', gradient:'linear-gradient(135deg,#ed1c24,#b5121b)', color:'#ed1c24', emoji:'🛍️' },
  { id:'spar',  name:'Spar',  gradient:'linear-gradient(135deg,#007f3e,#005a2c)', color:'#007f3e', emoji:'🌿' },
  { id:'metro', name:'Metro', gradient:'linear-gradient(135deg,#003DA5,#00297a)', color:'#003DA5', emoji:'🏪' },
  { id:'penny', name:'Penny', gradient:'linear-gradient(135deg,#cc0000,#990000)', color:'#cc0000', emoji:'💰' },
  { id:'etsan', name:'Etsan', gradient:'linear-gradient(135deg,#ff6b00,#cc5500)', color:'#ff6b00', emoji:'🥩' },
];

// ═══ PROSPEKTE DATA ══════════════════════════════════════════════
// KW16 = 14.04.–20.04.2026  |  KW17 = 21.04.–27.04.2026
const PROSPEKTE = [

  // ── KW16: Diese Woche (14.04. – 20.04.2026) ──────────────────
  {
    id: 'lidl-kw16',
    store: 'Lidl',
    storeId: 'lidl',
    color: '#0050AA',
    gradient: 'linear-gradient(135deg,#0050AA 0%,#003d8f 100%)',
    emoji: '🛒',
    title: 'Lidl Frische-Woche KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'ld16a', name:'Mozzarella di Bufala 250g',   price:2.79,  normalPrice:3.99,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'ld16b', name:'Pizzamehl Tipo 00 1kg',        price:0.55,  normalPrice:0.79,  unit:'kg',      category:'Grundzutaten', discount:30 },
      { id:'ld16c', name:'Tomatensauce passiert 500ml',  price:0.65,  normalPrice:0.99,  unit:'Dose',    category:'Grundzutaten', discount:34 },
      { id:'ld16d', name:'Frische Hefe',                 price:0.25,  normalPrice:0.39,  unit:'Päck.',   category:'Grundzutaten', discount:36 },
      { id:'ld16e', name:'Salami Milano 200g',           price:5.99,  normalPrice:7.99,  unit:'kg',      category:'Belag',        discount:25 },
      { id:'ld16f', name:'Parmesan gerieben 100g',       price:1.39,  normalPrice:1.99,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'ld16g', name:'Olivenöl nativ extra 500ml',   price:3.29,  normalPrice:4.99,  unit:'Flasche', category:'Grundzutaten', discount:34 },
      { id:'ld16h', name:'Cherry-Tomaten 500g',          price:1.29,  normalPrice:1.79,  unit:'Stk',     category:'Gemüse',       discount:28 },
    ]
  },
  {
    id: 'billa-kw16',
    store: 'Billa',
    storeId: 'billa',
    color: '#ed1c24',
    gradient: 'linear-gradient(135deg,#ed1c24 0%,#b5121b 100%)',
    emoji: '🛍️',
    title: 'Billa Wochenangebote KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'bi16a', name:'Burrata 200g',                price:2.79,  normalPrice:3.99,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'bi16b', name:'Rucola 100g',                 price:0.89,  normalPrice:1.29,  unit:'Bund',    category:'Gemüse',       discount:31 },
      { id:'bi16c', name:'Prosciutto Crudo 100g',       price:1.79,  normalPrice:2.49,  unit:'Stk',     category:'Belag',        discount:28 },
      { id:'bi16d', name:'Mortadella 150g',             price:1.19,  normalPrice:1.79,  unit:'Stk',     category:'Belag',        discount:34 },
      { id:'bi16e', name:'Ricotta 250g',                price:0.99,  normalPrice:1.59,  unit:'Stk',     category:'Käse',         discount:38 },
      { id:'bi16f', name:'Weizenbier 6er-Pack',         price:5.49,  normalPrice:7.99,  unit:'Pack',    category:'Getränke',     discount:31 },
      { id:'bi16g', name:'Frischer Basilikum',          price:0.69,  normalPrice:0.99,  unit:'Bund',    category:'Gewürze',      discount:30 },
    ]
  },
  {
    id: 'metro-kw16',
    store: 'Metro',
    storeId: 'metro',
    color: '#003DA5',
    gradient: 'linear-gradient(135deg,#003DA5 0%,#00297a 100%)',
    emoji: '🏪',
    title: 'Metro Gastro-Deals April',
    subtitle: 'Gültig: 08.04. – 21.04.',
    valid_from: '2026-04-08',
    valid_to: '2026-04-21',
    category: 'Gastronomie',
    bundesland: 'all',
    sponsored: true,
    deals: [
      { id:'me16a', name:'Olivenöl Extra Vergine 3L',    price:3.99,  normalPrice:5.49,  unit:'Liter',   category:'Grundzutaten', discount:27 },
      { id:'me16b', name:'Parmigiano Reggiano 1kg',      price:6.99,  normalPrice:8.99,  unit:'kg',      category:'Käse',         discount:22 },
      { id:'me16c', name:'San Marzano Tomaten 2,5kg',    price:2.99,  normalPrice:4.49,  unit:'Dose',    category:'Grundzutaten', discount:33 },
      { id:'me16d', name:'Pizzamehl Tipo 00 25kg',       price:16.90, normalPrice:24.90, unit:'Sack',    category:'Grundzutaten', discount:32 },
      { id:'me16e', name:'Mozzarella Fior di Latte 1kg', price:4.49,  normalPrice:6.49,  unit:'kg',      category:'Käse',         discount:31 },
      { id:'me16f', name:'Prosciutto Crudo 1kg',         price:13.90, normalPrice:18.90, unit:'kg',      category:'Belag',        discount:26 },
      { id:'me16g', name:'Pizzakarton 33cm 100er',       price:7.90,  normalPrice:11.90, unit:'Pack',    category:'Verpackung',   discount:34 },
      { id:'me16h', name:'Einweghandschuhe L 100er',     price:3.99,  normalPrice:5.99,  unit:'Pack',    category:'Haushalt',     discount:33 },
      { id:'me16i', name:'Basilikum Pesto 500g',         price:3.49,  normalPrice:5.49,  unit:'Glas',    category:'Saucen',       discount:36 },
      { id:'me16j', name:'Frischhaltefolie 300m',        price:11.90, normalPrice:16.90, unit:'Rolle',   category:'Haushalt',     discount:30 },
    ]
  },
  {
    id: 'hofer-kw16',
    store: 'Hofer',
    storeId: 'hofer',
    color: '#F7941D',
    gradient: 'linear-gradient(135deg,#F7941D 0%,#e07a08 100%)',
    emoji: '🏷️',
    title: 'Hofer Aktionswoche KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'ho16a', name:'Mozzarella 125g',             price:1.79,  normalPrice:2.49,  unit:'Stk',     category:'Käse',         discount:28 },
      { id:'ho16b', name:'Weizenmehl 1kg',              price:0.59,  normalPrice:0.89,  unit:'kg',      category:'Grundzutaten', discount:34 },
      { id:'ho16c', name:'Passierte Tomaten 500g',      price:0.69,  normalPrice:0.99,  unit:'Stk',     category:'Grundzutaten', discount:30 },
      { id:'ho16d', name:'Kochsalami 400g',             price:2.49,  normalPrice:3.99,  unit:'Stk',     category:'Belag',        discount:38 },
      { id:'ho16e', name:'Sonnenblumenöl 1L',           price:1.09,  normalPrice:1.79,  unit:'Flasche', category:'Grundzutaten', discount:39 },
      { id:'ho16f', name:'Knoblauch Knolle',            price:0.49,  normalPrice:0.89,  unit:'Stk',     category:'Gewürze',      discount:45 },
    ]
  },
  {
    id: 'spar-kw16',
    store: 'Spar',
    storeId: 'spar',
    color: '#007f3e',
    gradient: 'linear-gradient(135deg,#007f3e 0%,#005a2c 100%)',
    emoji: '🌿',
    title: 'Spar Genuss-Woche KW16',
    subtitle: 'Gültig: 10.04. – 23.04.',
    valid_from: '2026-04-10',
    valid_to: '2026-04-23',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'sp16a', name:'Parmigiano Reggiano 100g',    price:2.29,  normalPrice:3.29,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'sp16b', name:'Olivenöl nativ extra 750ml',  price:4.49,  normalPrice:6.49,  unit:'Flasche', category:'Grundzutaten', discount:31 },
      { id:'sp16c', name:'Burrata 200g',                price:2.69,  normalPrice:3.99,  unit:'Stk',     category:'Käse',         discount:33 },
      { id:'sp16d', name:'Antipasti Mix 200g',          price:2.99,  normalPrice:4.99,  unit:'Glas',    category:'Belag',        discount:40 },
      { id:'sp16e', name:'Focaccia-Brot',               price:1.79,  normalPrice:2.49,  unit:'Stk',     category:'Bäckerei',     discount:28 },
      { id:'sp16f', name:'Pinienkerne 100g',            price:1.99,  normalPrice:2.99,  unit:'Tüte',    category:'Sonstiges',    discount:33 },
      { id:'sp16g', name:'San Pellegrino 6×0,75L',      price:3.99,  normalPrice:5.99,  unit:'Pack',    category:'Getränke',     discount:33 },
    ]
  },
  {
    id: 'penny-kw16',
    store: 'Penny',
    storeId: 'penny',
    color: '#cc0000',
    gradient: 'linear-gradient(135deg,#cc0000 0%,#990000 100%)',
    emoji: '💰',
    title: 'Penny Wochenangebote KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'pe16a', name:'Salami Milano 300g',          price:4.99,  normalPrice:7.49,  unit:'Stk',     category:'Belag',        discount:33 },
      { id:'pe16b', name:'Frische Hefe',                price:0.29,  normalPrice:0.45,  unit:'Päck.',   category:'Grundzutaten', discount:36 },
      { id:'pe16c', name:'Gouda jung 400g',             price:1.99,  normalPrice:3.19,  unit:'Stk',     category:'Käse',         discount:38 },
      { id:'pe16d', name:'Oregano getrocknet 20g',      price:0.49,  normalPrice:0.89,  unit:'Päck.',   category:'Gewürze',      discount:45 },
      { id:'pe16e', name:'Tomatenpüree 200g',           price:0.39,  normalPrice:0.59,  unit:'Dose',    category:'Grundzutaten', discount:34 },
    ]
  },

  // ── KW17: Nächste Woche (21.04. – 27.04.2026) ────────────────
  {
    id: 'lidl-kw17',
    store: 'Lidl',
    storeId: 'lidl',
    color: '#0050AA',
    gradient: 'linear-gradient(135deg,#0050AA 0%,#003d8f 100%)',
    emoji: '🛒',
    title: 'Lidl Vorschau KW17',
    subtitle: 'Ab Montag 21.04.',
    valid_from: '2026-04-21',
    valid_to: '2026-04-27',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'ld17a', name:'Grana Padano 200g',           price:2.99,  normalPrice:4.49,  unit:'Stk',     category:'Käse',         discount:33 },
      { id:'ld17b', name:'Passata di Pomodoro 700ml',   price:0.99,  normalPrice:1.49,  unit:'Flasche', category:'Grundzutaten', discount:34 },
      { id:'ld17c', name:'Pepperoni eingelegt 330g',    price:1.49,  normalPrice:2.29,  unit:'Glas',    category:'Belag',        discount:35 },
      { id:'ld17d', name:'Rucola 100g',                 price:0.79,  normalPrice:1.29,  unit:'Bund',    category:'Gemüse',       discount:39 },
      { id:'ld17e', name:'Oliven schwarz 185g',         price:0.89,  normalPrice:1.49,  unit:'Dose',    category:'Belag',        discount:40 },
    ]
  },
  {
    id: 'billa-kw17',
    store: 'Billa',
    storeId: 'billa',
    color: '#ed1c24',
    gradient: 'linear-gradient(135deg,#ed1c24 0%,#b5121b 100%)',
    emoji: '🛍️',
    title: 'Billa Vorschau KW17',
    subtitle: 'Ab Montag 21.04.',
    valid_from: '2026-04-21',
    valid_to: '2026-04-27',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'bi17a', name:'Scamorza affumicata 200g',   price:2.49,  normalPrice:3.49,  unit:'Stk',     category:'Käse',         discount:29 },
      { id:'bi17b', name:'Speck Alto Adige 100g',      price:2.29,  normalPrice:3.29,  unit:'Stk',     category:'Belag',        discount:30 },
      { id:'bi17c', name:'Kapern in Essig 100g',       price:0.69,  normalPrice:0.99,  unit:'Glas',    category:'Belag',        discount:30 },
      { id:'bi17d', name:'Basilikum Topf',             price:0.99,  normalPrice:1.49,  unit:'Stk',     category:'Gewürze',      discount:34 },
    ]
  },

  // ── Abgelaufen (für Archiv) ───────────────────────────────────
  {
    id: 'metro-april-alt',
    store: 'Metro',
    storeId: 'metro',
    color: '#003DA5',
    gradient: 'linear-gradient(135deg,#003DA5 0%,#00297a 100%)',
    emoji: '🏪',
    title: 'Metro März-Aktion',
    subtitle: 'Gültig: 20.03. – 02.04.',
    valid_from: '2026-03-20',
    valid_to: '2026-04-02',
    category: 'Gastronomie',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'me_alt1', name:'Pizzamehl Tipo 00 25kg',    price:18.90, normalPrice:24.90, unit:'Sack',    category:'Grundzutaten', discount:24 },
      { id:'me_alt2', name:'Pizzakarton 33cm 100er',    price:8.90,  normalPrice:11.90, unit:'Pack',    category:'Verpackung',   discount:25 },
    ]
  },
];

// ═══ API SIMULATION ══════════════════════════════════════════════

function apiGetProspekte(filters) {
  filters = filters || {};
  let result = [...PROSPEKTE];
  if (filters.store)      result = result.filter(p => p.storeId === filters.store || p.store.toLowerCase() === filters.store.toLowerCase());
  if (filters.category)   result = result.filter(p => p.category === filters.category || p.deals.some(d => d.category === filters.category));
  if (filters.bundesland && filters.bundesland !== 'all') result = result.filter(p => p.bundesland === 'all' || p.bundesland === filters.bundesland);
  return result;
}

function apiSearchDeals(q) {
  if (!q || !q.trim()) return [];
  const query = q.toLowerCase().trim();
  const results = [];
  for (const p of PROSPEKTE) {
    for (const d of p.deals) {
      if (
        d.name.toLowerCase().includes(query) ||
        p.store.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query)
      ) {
        results.push({ ...d, prospektId: p.id, store: p.store, storeId: p.storeId, storeColor: p.color, valid_from: p.valid_from, valid_to: p.valid_to });
      }
    }
  }
  return results;
}

// ═══ LEGACY DATA FUNCTIONS (Kompatibilität) ══════════════════════

function getAllDeals() {
  const today = new Date(); today.setHours(0,0,0,0);
  const mon = weekMonday(today);
  const configDeals = DEALS.map((d, i) => {
    const product = PRODUCTS.find(p => p.id === d.productId);
    const shop    = SHOPS.find(s => s.id === d.shopId);
    let validFrom, validTo;
    if (d.validFrom && d.validTo) { validFrom = d.validFrom; validTo = d.validTo; }
    else if (d.week === 'current') {
      validFrom = mon.toISOString().slice(0,10);
      const sun = new Date(mon); sun.setDate(mon.getDate()+6); validTo = sun.toISOString().slice(0,10);
    } else {
      const nm = new Date(mon); nm.setDate(mon.getDate()+7); validFrom = nm.toISOString().slice(0,10);
      const ns = new Date(nm); ns.setDate(nm.getDate()+6); validTo = ns.toISOString().slice(0,10);
    }
    const discount = d.normalPrice ? Math.round((1 - d.pricePerUnit / d.normalPrice) * 100) : 0;
    return { id:'cfg_'+i, shopId:d.shopId, shopName:shop?shop.name:d.shopId, shopColor:shop?shop.color:'#555',
      productId:d.productId, productName:product?product.name:d.productId, category:product?product.category:'Sonstiges',
      price:d.pricePerUnit, normalPrice:d.normalPrice||null, unit:product?product.unit:'Stk', discount, validFrom, validTo, source:'config' };
  });
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  return [...configDeals, ...custom];
}

// ═══ MAIN RENDER ════════════════════════════════════════════════

function renderAngeboteTab() {
  const panel = document.getElementById('panel-angebote');
  if (!panel) { console.error('panel-angebote nicht gefunden!'); return; }
  try {
    _renderAngeboteMain(panel);
  } catch(err) {
    console.error('Angebote Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px"><strong>Fehler:</strong> ' + err.message + '</div>';
  }
}

function _renderAngeboteMain(panel) {
  const v = ANGEBOTE_STATE.view;
  if      (v === 'prospekte') panel.innerHTML = _buildProspekteView();
  else if (v === 'live')      panel.innerHTML = _buildLiveView();
  else if (v === 'detail')    panel.innerHTML = _buildDetailView();
  else if (v === 'suche')     panel.innerHTML = _buildSucheView();
  else if (v === 'neu')       panel.innerHTML = _buildNeuView();
  else                         panel.innerHTML = _buildProspekteView();
}

// ═══ VIEW: PROSPEKTE GRID + SIDEBAR ══════════════════════════════

function _buildProspekteView() {
  const today = new Date(); today.setHours(0,0,0,0);
  const allP = PROSPEKTE;

  // Sidebar data
  const storeMap = {};
  for (const p of allP) {
    if (!storeMap[p.storeId]) storeMap[p.storeId] = { name: p.store, color: p.color, count: 0 };
    storeMap[p.storeId].count++;
  }
  const catMap = {};
  for (const p of allP) {
    for (const d of p.deals) {
      catMap[d.category] = (catMap[d.category] || 0) + 1;
    }
  }
  const bundeslaender = ['Wien','Niederösterreich','Oberösterreich','Steiermark','Tirol','Salzburg','Kärnten','Vorarlberg','Burgenland'];

  // Filter
  const filters = {};
  if (ANGEBOTE_STATE.filterStore)     filters.store     = ANGEBOTE_STATE.filterStore;
  if (ANGEBOTE_STATE.filterCategory)  filters.category  = ANGEBOTE_STATE.filterCategory;
  if (ANGEBOTE_STATE.filterBundesland) filters.bundesland = ANGEBOTE_STATE.filterBundesland;
  const filtered = apiGetProspekte(filters);

  // Split current / next / past
  const currentP = [], nextP = [], pastP = [];
  for (const p of filtered) {
    const from = new Date(p.valid_from); from.setHours(0,0,0,0);
    const to   = new Date(p.valid_to);   to.setHours(23,59,59,999);
    if (to < today)        pastP.push(p);
    else if (from > today) nextP.push(p);
    else                   currentP.push(p);
  }

  const totalDeals = filtered.reduce((s, p) => s + p.deals.length, 0);
  const totalSaving = filtered.reduce((s, p) => {
    return s + p.deals.reduce((ds, d) => ds + (d.normalPrice && d.price ? d.normalPrice - d.price : 0), 0);
  }, 0);

  // ── LIVE STORE BUTTONS ──
  let html = '<div style="margin-bottom:24px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0;text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:7px">';
  html += '<span style="display:inline-block;width:8px;height:8px;background:#2e7d32;border-radius:50%"></span>Live-Prospekte</h2>';
  html += '<span style="font-size:11px;color:#8d6562">Klicken → Wochenangebote laden</span></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">';
  for (var lsi = 0; lsi < LIVE_STORES.length; lsi++) {
    var ls = LIVE_STORES[lsi];
    var cached = _getLiveProspektCache(ls.id);
    var dealCount = (cached && cached.deals) ? cached.deals.length : 0;
    var cacheMin  = cached ? Math.round((Date.now() - cached.timestamp) / 60000) : 0;
    html += '<button onclick="loadLiveProspekt(\'' + ls.id + '\')" ';
    html += 'style="background:#fff;border:2px solid #e8e8ed;border-radius:14px;padding:0;overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;text-align:left" ';
    html += 'onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 20px rgba(0,0,0,.12)\';this.style.borderColor=\'' + ls.color + '\'" ';
    html += 'onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'\';this.style.borderColor=\'#e8e8ed\'">';
    html += '<div style="background:' + ls.gradient + ';padding:10px 10px 8px;position:relative">';
    html += '<div style="font-size:20px;line-height:1;margin-bottom:3px">' + ls.emoji + '</div>';
    html += '<div style="font-size:12px;font-weight:900;color:#fff">' + ls.name + '</div>';
    if (cached) html += '<div style="position:absolute;top:5px;right:5px;background:rgba(255,255,255,.9);border-radius:20px;padding:1px 5px;font-size:9px;font-weight:800;color:#2e7d32">✓ Live</div>';
    html += '</div>';
    html += '<div style="padding:7px 10px">';
    if (cached) {
      html += '<div style="font-size:10px;font-weight:700;color:#2e7d32">' + dealCount + ' Angebote</div>';
      html += '<div style="font-size:9px;color:#8d6562">' + (cacheMin < 60 ? 'vor ' + cacheMin + ' Min.' : 'vor ' + Math.round(cacheMin/60) + ' Std.') + '</div>';
    } else {
      html += '<div style="font-size:10px;font-weight:600;color:#8d6562">Jetzt laden</div>';
      html += '<div style="font-size:9px;color:#c0b8b6">Live-Preise</div>';
    }
    html += '</div></button>';
  }
  html += '</div></div>';

  // ── HEADER ──
  html += '<div style="margin-bottom:28px">';
  html += '<h1 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:26px;font-weight:800;color:#261816;margin:0 0 6px">Angebote in deiner Nähe</h1>';
  html += '<p style="font-size:14px;color:#5a403c;margin:0">' + filtered.length + ' Prospekte · ' + totalDeals + ' Angebote';
  if (totalSaving > 0.01) html += ' · bis zu <strong style="color:#2e7d32">−' + eur(totalSaving) + '</strong> Ersparnis';
  html += '</p></div>';

  // ── SEARCH BAR ──
  const searchVal = escHtml(ANGEBOTE_STATE.searchQuery);
  html += '<div style="position:relative;margin-bottom:24px">';
  html += '<span class="material-symbols-outlined" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:22px;color:#8d6562;pointer-events:none">search</span>';
  html += '<input id="ang-search" type="text" placeholder="Produkt, Geschäft oder Kategorie suchen …" value="' + searchVal + '"';
  html += ' oninput="ANGEBOTE_STATE.searchQuery=this.value;if(this.value){ANGEBOTE_STATE.view=\'suche\';}else{ANGEBOTE_STATE.view=\'prospekte\';}renderAngeboteTab()"';
  html += ' style="width:100%;padding:16px 50px 16px 52px;border:2px solid #e3beb8;border-radius:16px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,.06)"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'" />';
  if (ANGEBOTE_STATE.searchQuery) {
    html += '<button onclick="ANGEBOTE_STATE.searchQuery=\'\';ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;line-height:0"><span class="material-symbols-outlined" style="font-size:20px;color:#8d6562">close</span></button>';
  }
  html += '</div>';

  // ── LAYOUT: GRID + SIDEBAR ──
  html += '<div style="display:flex;gap:24px;align-items:start">';

  // ── MAIN GRID ──
  html += '<div style="flex:1;min-width:0">';

  // Active filter chips
  if (ANGEBOTE_STATE.filterStore || ANGEBOTE_STATE.filterCategory || ANGEBOTE_STATE.filterBundesland) {
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">';
    if (ANGEBOTE_STATE.filterStore) {
      html += '<span style="display:inline-flex;align-items:center;gap:5px;background:#610000;color:#fff;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">';
      html += escHtml(ANGEBOTE_STATE.filterStore);
      html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';renderAngeboteTab()" style="background:none;border:none;cursor:pointer;color:#fff;padding:0;margin:0;line-height:0"><span class="material-symbols-outlined" style="font-size:14px">close</span></button></span>';
    }
    if (ANGEBOTE_STATE.filterCategory) {
      html += '<span style="display:inline-flex;align-items:center;gap:5px;background:#610000;color:#fff;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">';
      html += escHtml(ANGEBOTE_STATE.filterCategory);
      html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'\';renderAngeboteTab()" style="background:none;border:none;cursor:pointer;color:#fff;padding:0;margin:0;line-height:0"><span class="material-symbols-outlined" style="font-size:14px">close</span></button></span>';
    }
    if (ANGEBOTE_STATE.filterBundesland) {
      html += '<span style="display:inline-flex;align-items:center;gap:5px;background:#610000;color:#fff;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">';
      html += escHtml(ANGEBOTE_STATE.filterBundesland);
      html += '<button onclick="ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="background:none;border:none;cursor:pointer;color:#fff;padding:0;margin:0;line-height:0"><span class="material-symbols-outlined" style="font-size:14px">close</span></button></span>';
    }
    html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';ANGEBOTE_STATE.filterCategory=\'\';ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="background:none;border:1px solid #e3beb8;color:#8d6562;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Alle zurücksetzen</button>';
    html += '</div>';
  }

  // ── SECTION: Aktuelle Prospekte ──
  if (currentP.length) {
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
    html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:17px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:10px;height:10px;background:#2e7d32;border-radius:50%"></span>Diese Woche</h2>';
    html += '<span style="font-size:12px;color:#8d6562;font-weight:600">' + currentP.length + ' Prospekte</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:32px">';
    html += currentP.map(p => renderProspektCard(p, today)).join('');
    html += '</div>';
  }

  // ── SECTION: Nächste Woche ──
  if (nextP.length) {
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
    html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:17px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:10px;height:10px;background:#1565c0;border-radius:50%"></span>Nächste Woche</h2>';
    html += '<span style="font-size:12px;color:#8d6562;font-weight:600">' + nextP.length + ' Prospekte</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:32px">';
    html += nextP.map(p => renderProspektCard(p, today)).join('');
    html += '</div>';
  }

  // ── SECTION: Abgelaufen ──
  if (pastP.length) {
    html += '<div style="margin-bottom:14px"><h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:15px;font-weight:700;color:#8d6562;margin:0">Abgelaufen</h2></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:32px;opacity:.55">';
    html += pastP.map(p => renderProspektCard(p, today)).join('');
    html += '</div>';
  }

  if (!filtered.length) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px dashed #e3beb8">';
    html += '<span class="material-symbols-outlined" style="font-size:64px;color:#e3beb8">search_off</span>';
    html += '<p style="color:#8d6562;margin-top:16px;font-size:16px;font-weight:600">Keine Prospekte gefunden</p>';
    html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';ANGEBOTE_STATE.filterCategory=\'\';ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="margin-top:16px;padding:12px 24px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700">Filter zurücksetzen</button>';
    html += '</div>';
  }

  // ── "+ Angebot eintragen" button ──
  html += '<div style="margin-top:8px;padding:20px;background:linear-gradient(135deg,#fff0ee,#fff8f6);border-radius:16px;border:1.5px dashed #e3beb8;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">';
  html += '<div><p style="font-size:14px;font-weight:700;color:#261816;margin:0">Angebot nicht dabei?</p><p style="font-size:12px;color:#8d6562;margin:4px 0 0">Eigenes Angebot eintragen und mit allen teilen</p></div>';
  html += '<button onclick="ANGEBOTE_STATE.view=\'neu\';renderAngeboteTab()" style="padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:flex;align-items:center;gap:7px;white-space:nowrap"><span class="material-symbols-outlined" style="font-size:18px">add_circle</span>Angebot melden</button>';
  html += '</div>';

  html += '</div>'; // end main grid

  // ── SIDEBAR ──
  html += _buildSidebar(storeMap, catMap, bundeslaender);

  html += '</div>'; // end flex layout
  return html;
}

// ═══ SIDEBAR ════════════════════════════════════════════════════

function _buildSidebar(storeMap, catMap, bundeslaender) {
  let html = '<div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:16px;position:sticky;top:80px">';

  // ── Händler ──
  html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:18px">';
  html += '<h3 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Händler</h3>';
  // "Alle" option
  const storeAllBg = !ANGEBOTE_STATE.filterStore ? '#610000' : 'transparent';
  const storeAllColor = !ANGEBOTE_STATE.filterStore ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:' + storeAllBg + ';color:' + storeAllColor + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;margin-bottom:4px">';
  html += '<span>Alle Händler</span><span style="font-size:11px;opacity:.7">' + PROSPEKTE.length + '</span></button>';
  for (const [sid, sdata] of Object.entries(storeMap)) {
    const isActive = ANGEBOTE_STATE.filterStore === sdata.name;
    const bg = isActive ? '#610000' : 'transparent';
    const col = isActive ? '#fff' : '#261816';
    const dotBg = isActive ? 'rgba(255,255,255,.7)' : sdata.color;
    html += '<button onclick="ANGEBOTE_STATE.filterStore=\'' + escHtml(sdata.name) + '\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;gap:8px;padding:8px 10px;background:' + bg + ';color:' + col + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;margin-bottom:2px;text-align:left">';
    html += '<span style="width:8px;height:8px;border-radius:50%;background:' + dotBg + ';flex-shrink:0;display:inline-block"></span>';
    html += '<span style="flex:1">' + escHtml(sdata.name) + '</span>';
    html += '<span style="font-size:11px;opacity:.7">' + sdata.count + '</span></button>';
  }
  html += '</div>';

  // ── Kategorien ──
  html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:18px">';
  html += '<h3 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Kategorien</h3>';
  const catAllBg = !ANGEBOTE_STATE.filterCategory ? '#610000' : 'transparent';
  const catAllColor = !ANGEBOTE_STATE.filterCategory ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + catAllBg + ';color:' + catAllColor + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:4px">Alle</button>';
  const sortedCats = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  for (const [cat, cnt] of sortedCats) {
    const isActive = ANGEBOTE_STATE.filterCategory === cat;
    const bg2 = isActive ? '#610000' : 'transparent';
    const col2 = isActive ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'' + escHtml(cat) + '\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + bg2 + ';color:' + col2 + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:2px;text-align:left">';
    html += '<span>' + escHtml(cat) + '</span><span style="font-size:11px;opacity:.7">' + cnt + '</span></button>';
  }
  html += '</div>';

  // ── Bundesland ──
  html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:18px">';
  html += '<h3 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Bundesland</h3>';
  const blAllBg = !ANGEBOTE_STATE.filterBundesland ? '#610000' : 'transparent';
  const blAllCol = !ANGEBOTE_STATE.filterBundesland ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + blAllBg + ';color:' + blAllCol + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:4px">Österreich gesamt</button>';
  for (const bl of bundeslaender) {
    const isActive = ANGEBOTE_STATE.filterBundesland === bl;
    const blBg = isActive ? '#610000' : 'transparent';
    const blCol = isActive ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.filterBundesland=\'' + escHtml(bl) + '\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + blBg + ';color:' + blCol + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:2px;text-align:left">';
    html += '<span>' + escHtml(bl) + '</span></button>';
  }
  html += '</div>';

  html += '</div>'; // end sidebar
  return html;
}

// ═══ PROSPEKT CARD ═══════════════════════════════════════════════

function renderProspektCard(p, today) {
  today = today || (function(){ const d=new Date(); d.setHours(0,0,0,0); return d; })();
  const from = new Date(p.valid_from); from.setHours(0,0,0,0);
  const to   = new Date(p.valid_to);   to.setHours(23,59,59,999);
  const isExpired = to < today;
  const isNext    = from > today;

  const fromStr = from.toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit' });
  const toStr   = to.toLocaleDateString('de-AT',   { day:'2-digit', month:'2-digit' });

  const daysLeft = Math.ceil((to - today) / 86400000);
  const urgentColor = (!isExpired && !isNext && daysLeft <= 2) ? '#e65100' : '';

  const topDiscount = p.deals.reduce((max, d) => d.discount > max ? d.discount : max, 0);
  const totalSave   = p.deals.reduce((s, d) => s + (d.normalPrice && d.price ? d.normalPrice - d.price : 0), 0);

  let html = '<div onclick="openProspekt(\'' + p.id + '\')" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 16px rgba(0,0,0,.09);border:1px solid #e8e8ed;cursor:pointer;transition:transform .15s,box-shadow .15s" onmouseenter="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 28px rgba(0,0,0,.14)\'" onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'0 3px 16px rgba(0,0,0,.09)\'">';

  // ── Card Cover ──
  html += '<div style="background:' + p.gradient + ';height:130px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px">';

  // Badges top-left/right
  if (p.sponsored) {
    html += '<span style="position:absolute;top:10px;left:10px;background:rgba(255,255,255,.22);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;backdrop-filter:blur(4px)">Gesponsert</span>';
  }
  if (topDiscount > 0) {
    html += '<span style="position:absolute;top:10px;right:10px;background:#fff;color:#2e7d32;font-size:12px;font-weight:800;padding:3px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.15)">−' + topDiscount + '%</span>';
  }
  if (!isExpired && !isNext && daysLeft <= 2) {
    html += '<span style="position:absolute;bottom:10px;left:10px;background:#e65100;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">Nur noch ' + daysLeft + ' Tag' + (daysLeft===1?'':'e') + '!</span>';
  }
  if (isNext) {
    html += '<span style="position:absolute;bottom:10px;left:10px;background:rgba(255,255,255,.2);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">Bald verfügbar</span>';
  }

  // Store emoji + name
  html += '<span style="font-size:32px;line-height:1">' + p.emoji + '</span>';
  html += '<span style="font-size:18px;font-weight:900;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.25);letter-spacing:-.02em">' + escHtml(p.store) + '</span>';

  html += '</div>';

  // ── Card Body ──
  html += '<div style="padding:14px 16px">';
  html += '<p style="font-size:13px;font-weight:700;color:#261816;margin:0 0 4px;line-height:1.3">' + escHtml(p.title) + '</p>';

  // Validity
  const validColor = urgentColor || '#8d6562';
  html += '<p style="font-size:11px;color:' + validColor + ';margin:0 0 10px;display:flex;align-items:center;gap:4px">';
  html += '<span class="material-symbols-outlined" style="font-size:12px">calendar_today</span>';
  html += fromStr + ' – ' + toStr + '</p>';

  // Deal count + savings
  html += '<div style="display:flex;align-items:center;justify-content:space-between">';
  html += '<span style="font-size:12px;background:#f0f0f5;color:#5a403c;border-radius:20px;padding:3px 10px;font-weight:600">' + p.deals.length + ' Angebote</span>';
  if (totalSave > 0.01) {
    html += '<span style="font-size:12px;color:#2e7d32;font-weight:700">bis −' + eur(totalSave) + '</span>';
  }
  html += '</div>';
  html += '</div>';

  html += '</div>';
  return html;
}

// ═══ VIEW: PROSPEKT DETAIL ════════════════════════════════════════

function openProspekt(id) {
  ANGEBOTE_STATE.selectedProspektId = id;
  ANGEBOTE_STATE.view = 'detail';
  renderAngeboteTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToProspekte() {
  ANGEBOTE_STATE.view = 'prospekte';
  ANGEBOTE_STATE.selectedProspektId = null;
  renderAngeboteTab();
}

function _buildDetailView() {
  const p = PROSPEKTE.find(pr => pr.id === ANGEBOTE_STATE.selectedProspektId);
  if (!p) return '<div style="padding:20px"><button onclick="backToProspekte()">← Zurück</button></div>';

  const today = new Date(); today.setHours(0,0,0,0);
  const from = new Date(p.valid_from); from.setHours(0,0,0,0);
  const to   = new Date(p.valid_to);   to.setHours(23,59,59,999);
  const fromStr = from.toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric' });
  const toStr   = to.toLocaleDateString('de-AT',   { day:'2-digit', month:'2-digit', year:'numeric' });
  const isExpired = to < today;

  const filterCat = ANGEBOTE_STATE.filterCategory;
  const allCats   = [...new Set(p.deals.map(d => d.category))].sort();
  const displayed = filterCat ? p.deals.filter(d => d.category === filterCat) : p.deals;
  const sorted    = [...displayed].sort((a,b) => (b.discount||0) - (a.discount||0));
  const totalSave = displayed.reduce((s,d) => s + (d.normalPrice&&d.price ? d.normalPrice-d.price : 0), 0);

  let html = '';

  // ── Hero Header ──
  html += '<div style="background:' + p.gradient + ';border-radius:20px;padding:28px 28px 24px;margin-bottom:24px;position:relative;overflow:hidden">';

  // Back button
  html += '<button onclick="backToProspekte()" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:7px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;margin-bottom:20px;backdrop-filter:blur(4px)">';
  html += '<span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück zu Prospekten</button>';

  // Decorative bg element
  html += '<div style="position:absolute;right:-30px;top:-30px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.08)"></div>';

  html += '<div style="display:flex;align-items:center;gap:16px;position:relative">';
  html += '<div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:32px;backdrop-filter:blur(4px)">' + p.emoji + '</div>';
  html += '<div>';
  html += '<h1 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:24px;font-weight:900;color:#fff;margin:0 0 4px;text-shadow:0 1px 4px rgba(0,0,0,.2)">' + escHtml(p.title) + '</h1>';
  html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
  html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:15px">calendar_today</span>' + fromStr + ' – ' + toStr + '</span>';
  html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:15px">local_offer</span>' + p.deals.length + ' Angebote</span>';
  if (isExpired) html += '<span style="background:rgba(0,0,0,.3);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">Abgelaufen</span>';
  if (p.sponsored) html += '<span style="background:rgba(255,255,255,.25);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">Gesponsert</span>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  // ── Savings Banner ──
  if (totalSave > 0.01) {
    html += '<div style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:14px;padding:14px 22px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">';
    html += '<div><div style="font-size:12px;color:rgba(255,255,255,.85);font-weight:600;margin-bottom:2px">' + displayed.length + ' Angebote — mögliche Gesamtersparnis</div>';
    html += '<div style="font-size:28px;font-weight:900;color:#fff">−' + eur(totalSave) + '</div></div>';
    html += '<span class="material-symbols-outlined" style="font-size:48px;color:rgba(255,255,255,.2)">savings</span>';
    html += '</div>';
  }

  // ── Category Filter ──
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">';
  const catAllBg = !filterCat ? '#610000' : '#f0f0f5';
  const catAllCol = !filterCat ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'\';renderAngeboteTab()" style="padding:7px 16px;background:' + catAllBg + ';color:' + catAllCol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">Alle</button>';
  for (const cat of allCats) {
    const isAct = filterCat === cat;
    const cbg = isAct ? '#610000' : '#f0f0f5';
    const ccol = isAct ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'' + escHtml(cat) + '\';renderAngeboteTab()" style="padding:7px 16px;background:' + cbg + ';color:' + ccol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">' + escHtml(cat) + '</button>';
  }
  html += '</div>';

  // ── Deals Grid ──
  if (!sorted.length) {
    html += '<div style="text-align:center;padding:40px;color:#8d6562">Keine Angebote in dieser Kategorie.</div>';
  } else {
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">';
    html += sorted.map(d => _renderDetailDealCard(d, p)).join('');
    html += '</div>';
  }

  return html;
}

function _renderDetailDealCard(d, p) {
  const discount = d.discount || 0;
  const savings  = (d.normalPrice && d.price) ? d.normalPrice - d.price : 0;
  const safeName = escHtml(d.name);
  const safeId   = escHtml(d.id);
  const safePStore = escHtml(p.store).replace(/'/g,"\\'");
  const safePStoreId = escHtml(p.storeId);
  const safeUnit = escHtml(d.unit);

  let html = '<div style="background:#fff;border-radius:14px;border:1px solid #e8e8ed;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">';

  // Color top bar
  html += '<div style="height:6px;background:' + p.gradient + '"></div>';

  html += '<div style="padding:16px">';
  // Badges row
  if (discount > 0 || d.category) {
    html += '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">';
    if (discount > 0) html += '<span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:800;padding:3px 9px;border-radius:20px">−' + discount + '%</span>';
    if (d.category)   html += '<span style="background:#f0f0f5;color:#5a403c;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px">' + escHtml(d.category) + '</span>';
    html += '</div>';
  }

  html += '<p style="font-size:14px;font-weight:700;color:#261816;margin:0 0 12px;line-height:1.35">' + safeName + '</p>';

  // Price
  html += '<div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px">';
  html += '<div style="font-size:28px;font-weight:900;color:#610000;line-height:1">' + eur(d.price) + '</div>';
  if (d.normalPrice) {
    html += '<div style="padding-bottom:2px">';
    html += '<div style="font-size:12px;text-decoration:line-through;color:#8d6562">' + eur(d.normalPrice) + '</div>';
    if (savings > 0.01) html += '<div style="font-size:11px;font-weight:700;color:#2e7d32">−' + eur(savings) + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // Unit
  html += '<div style="font-size:11px;color:#8d6562;margin-bottom:12px">pro ' + safeUnit + '</div>';

  // Merken button
  html += '<button onclick="angebotMerken(\'' + safeId + '\',\'' + safeName.replace(/'/g,"\\'") + '\',' + d.price + ',\'' + safePStore + '\',\'' + safePStoreId + '\',\'' + safeUnit + '\',1)"';
  html += ' style="width:100%;padding:9px;background:#fff0ee;color:#610000;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px">';
  html += '<span class="material-symbols-outlined" style="font-size:15px">bookmark_add</span>Merken</button>';

  html += '</div>';
  html += '</div>';
  return html;
}

// ═══ VIEW: SUCHE ═════════════════════════════════════════════════

function _buildSucheView() {
  const q = ANGEBOTE_STATE.searchQuery;
  const results = apiSearchDeals(q);

  let html = '';

  // Header + search bar
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  html += '<button onclick="ANGEBOTE_STATE.view=\'prospekte\';ANGEBOTE_STATE.searchQuery=\'\';renderAngeboteTab()" style="display:flex;align-items:center;gap:6px;background:#f0f0f5;color:#261816;border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700"><span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück</button>';
  html += '<div style="flex:1;position:relative">';
  html += '<span class="material-symbols-outlined" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:20px;color:#8d6562;pointer-events:none">search</span>';
  html += '<input id="ang-search" type="text" value="' + escHtml(q) + '" placeholder="Produkt, Geschäft oder Kategorie …"';
  html += ' oninput="ANGEBOTE_STATE.searchQuery=this.value;if(!this.value){ANGEBOTE_STATE.view=\'prospekte\';}renderAngeboteTab()"';
  html += ' style="width:100%;padding:12px 42px 12px 46px;border:2px solid #610000;border-radius:14px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' autofocus />';
  if (q) {
    html += '<button onclick="ANGEBOTE_STATE.searchQuery=\'\';ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;line-height:0"><span class="material-symbols-outlined" style="font-size:18px;color:#8d6562">close</span></button>';
  }
  html += '</div></div>';

  if (!results.length) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px dashed #e3beb8">';
    html += '<span class="material-symbols-outlined" style="font-size:64px;color:#e3beb8">search_off</span>';
    html += '<p style="color:#8d6562;margin-top:16px;font-size:16px;font-weight:600">Kein Angebot für <em>"' + escHtml(q) + '"</em></p>';
    html += '<p style="color:#8d6562;font-size:13px;margin-top:6px">Tipp: Eigenes Angebot eintragen</p>';
    html += '<button onclick="ANGEBOTE_STATE.view=\'neu\';ANGEBOTE_STATE.searchQuery=\'\';renderAngeboteTab()" style="margin-top:16px;padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px">add</span>Angebot melden</button>';
    html += '</div>';
    return html;
  }

  // Sort by discount desc
  const sorted = [...results].sort((a,b) => (b.discount||0)-(a.discount||0));

  // Group by store
  const byStore = {};
  for (const d of sorted) {
    if (!byStore[d.store]) byStore[d.store] = [];
    byStore[d.store].push(d);
  }

  html += '<p style="font-size:13px;color:#8d6562;margin-bottom:18px"><strong>' + results.length + '</strong> Angebote für <em>"' + escHtml(q) + '"</em></p>';

  for (const [store, deals] of Object.entries(byStore)) {
    const storeData = PROSPEKTE.find(p => p.store === store);
    const storeColor = storeData ? storeData.color : '#610000';
    const storeGrad  = storeData ? storeData.gradient : 'linear-gradient(135deg,#610000,#8b0000)';

    html += '<div style="margin-bottom:24px">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 16px;background:' + storeGrad + ';border-radius:12px">';
    html += '<span style="font-size:14px;font-weight:800;color:#fff">' + escHtml(store) + '</span>';
    html += '<span style="font-size:12px;color:rgba(255,255,255,.8);margin-left:4px">' + deals.length + ' Treffer</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
    for (const d of deals) {
      // Find parent prospekt for this deal
      const parentP = PROSPEKTE.find(pr => pr.storeId === d.storeId && pr.id === d.prospektId);
      if (parentP) {
        html += _renderDetailDealCard(d, parentP);
      } else {
        // Fallback: render with store color
        const mockP = { store: d.store, storeId: d.storeId, color: storeColor, gradient: storeGrad };
        html += _renderDetailDealCard(d, mockP);
      }
    }
    html += '</div></div>';
  }

  return html;
}

// ═══ VIEW: NEU EINTRAGEN ═════════════════════════════════════════

function _buildNeuView() {
  const today = new Date().toISOString().slice(0,10);
  const nextSun = new Date(); nextSun.setDate(nextSun.getDate() + (7 - nextSun.getDay() || 7));
  const nextSunStr = nextSun.toISOString().slice(0,10);

  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}

  let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">';
  html += '<button onclick="ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="display:flex;align-items:center;gap:6px;background:#f0f0f5;color:#261816;border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700"><span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück</button>';
  html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:18px;font-weight:800;color:#261816;margin:0">Angebot melden</h2>';
  html += '</div>';

  const gridCols = customs.length ? '1fr 1fr' : '1fr';
  html += '<div style="display:grid;grid-template-columns:' + gridCols + ';gap:20px;align-items:start">';

  // ── Form ──
  html += '<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:18px;padding:28px">';
  html += '<h3 style="font-size:16px;font-weight:800;color:#261816;margin:0 0 20px;display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:20px;color:#610000">add_circle</span>Neues Angebot eintragen</h3>';
  html += '<div style="display:flex;flex-direction:column;gap:14px">';

  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Produkt *</label>';
  html += '<input id="nd-produkt" type="text" placeholder="z.B. Mozzarella 250g" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'"/></div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Angebotspreis (€) *</label>';
  html += '<input id="nd-preis" type="number" min="0" step="0.01" placeholder="2.99" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'"/></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Normalpreis (€)</label>';
  html += '<input id="nd-normal" type="number" min="0" step="0.01" placeholder="3.99" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'"/></div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Gültig von</label>';
  html += '<input id="nd-von" type="date" value="' + today + '" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"/></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Gültig bis</label>';
  html += '<input id="nd-bis" type="date" value="' + nextSunStr + '" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"/></div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Geschäft</label>';
  html += '<select id="nd-shop" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += SHOPS.map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');
  html += '<option value="sonstiges">Sonstiges</option></select></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie</label>';
  html += '<select id="nd-kat" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += '<option>Grundzutaten</option><option>Käse</option><option>Belag</option><option>Gewürze</option><option>Tiefkühl</option><option>Getränke</option><option>Sonstiges</option>';
  html += '</select></div>';
  html += '</div>';

  html += '<button onclick="angebotSpeichern()" style="width:100%;padding:14px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px"><span class="material-symbols-outlined" style="font-size:20px">save</span>Angebot speichern</button>';

  html += '</div></div>'; // end form inner + card

  // ── Saved customs ──
  if (customs.length) {
    html += '<div>';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
    html += '<h4 style="font-size:14px;font-weight:700;color:#261816;margin:0">Eigene Deals (' + customs.length + ')</h4>';
    html += '<button onclick="if(confirm(\'Alle eigenen Deals löschen?\')){localStorage.removeItem(\'pizzeria_custom_deals\');renderAngeboteTab()}" style="font-size:11px;color:#8d6562;background:none;border:1px solid #e3beb8;border-radius:8px;padding:4px 10px;cursor:pointer;font-family:inherit">Alle löschen</button>';
    html += '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    for (const d of customs) {
      html += '<div style="background:#fff;border:1px solid #e3beb8;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px">';
      html += '<div style="width:8px;height:8px;border-radius:50%;background:' + (d.shopColor||'#610000') + ';flex-shrink:0"></div>';
      html += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(d.productName) + '</div>';
      html += '<div style="font-size:11px;color:#8d6562">' + escHtml(d.shopName) + ' · ' + eur(d.price) + (d.normalPrice ? ' statt ' + eur(d.normalPrice) : '') + '</div></div>';
      html += '<button onclick="angebotLoeschen(\'' + d.id + '\')" style="background:none;border:none;cursor:pointer;padding:4px;color:#8d6562;line-height:0;flex-shrink:0"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>';
      html += '</div>';
    }
    html += '</div></div>';
  }

  html += '</div>'; // end outer grid
  return html;
}

// ═══ ACTIONS ════════════════════════════════════════════════════

function angebotMerken(id, name, preis, shopName, shopId, einheit, menge) {
  addHistoryEntry({ produktName: name, preis, shopName, shopId, einheit, menge, quelle: 'angebot' });
  HISTORY = JSON.parse(localStorage.getItem('pizzeria_history') || '[]');
  // Auch zur Einkaufsliste hinzufügen
  if (typeof elAddItem === 'function') {
    const shopObj = SHOPS.find(s => s.id === shopId);
    elAddItem({
      name, menge: menge || 1, einheit, preis,
      shop: shopName, shopId,
      shopColor: shopObj ? shopObj.color : '#8d6562',
      source: 'angebot',
    });
    if (typeof elUpdateBadge === 'function') elUpdateBadge();
  }
  const btns = document.querySelectorAll('button[onclick*="' + id + '"]');
  btns.forEach(b => {
    b.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Gemerkt!';
    b.style.color = '#2e7d32';
    b.style.background = '#f0fdf4';
    b.style.borderColor = '#bbf7d0';
    b.disabled = true;
  });
}

function angebotSpeichern() {
  const produkt = document.getElementById('nd-produkt')?.value.trim();
  const preis   = parseFloat(document.getElementById('nd-preis')?.value);
  const normal  = parseFloat(document.getElementById('nd-normal')?.value) || null;
  const von     = document.getElementById('nd-von')?.value;
  const bis     = document.getElementById('nd-bis')?.value;
  const shopId  = document.getElementById('nd-shop')?.value;
  const kat     = document.getElementById('nd-kat')?.value;

  if (!produkt || isNaN(preis) || preis <= 0) { alert('Bitte Produktname und Preis eingeben.'); return; }
  const shopObj  = SHOPS.find(s => s.id === shopId);
  const discount = normal ? Math.round((1 - preis/normal)*100) : 0;
  const deal = {
    id: 'custom_' + Date.now(), shopId, shopName: shopObj ? shopObj.name : 'Sonstiges',
    shopColor: shopObj ? shopObj.color : '#555', productName: produkt, category: kat,
    price: preis, normalPrice: normal, unit: 'Stk', discount, validFrom: von||null, validTo: bis||null, source: 'custom',
  };
  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  customs.unshift(deal);
  localStorage.setItem('pizzeria_custom_deals', JSON.stringify(customs));
  ANGEBOTE_STATE.view = 'prospekte';
  renderAngeboteTab();
}

function angebotLoeschen(id) {
  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  customs = customs.filter(d => d.id !== id);
  localStorage.setItem('pizzeria_custom_deals', JSON.stringify(customs));
  renderAngeboteTab();
}

// Legacy renderDealCard (kept for any remaining external calls)
function renderDealCard(deal, isRecommended) {
  isRecommended = isRecommended || false;
  const p = PROSPEKTE.find(pr => pr.storeId === (deal.shopId||''));
  if (p) return _renderDetailDealCard(deal, p);
  const mockP = { store: deal.shopName||'', storeId: deal.shopId||'', color: deal.shopColor||'#610000', gradient: 'linear-gradient(135deg,' + (deal.shopColor||'#610000') + ',' + (deal.shopColor||'#610000') + ')' };
  return _renderDetailDealCard(deal, mockP);
}

// ═══════════════════════════════════════════════════════════════
// LIVE PROSPEKT — Cache
// ═══════════════════════════════════════════════════════════════

function _getLiveProspektCache(storeId) {
  try {
    var entry = JSON.parse(localStorage.getItem('pizzeria_live_' + storeId) || 'null');
    if (!entry) return null;
    // 12 Stunden Cache
    if ((Date.now() - entry.timestamp) > 12 * 60 * 60 * 1000) {
      localStorage.removeItem('pizzeria_live_' + storeId);
      return null;
    }
    return entry;
  } catch(_) { return null; }
}

function _setLiveProspektCache(storeId, data) {
  try {
    data.timestamp = Date.now();
    localStorage.setItem('pizzeria_live_' + storeId, JSON.stringify(data));
  } catch(_) {}
}

function clearLiveProspektCache(storeId) {
  localStorage.removeItem('pizzeria_live_' + storeId);
}

// ═══════════════════════════════════════════════════════════════
// LIVE PROSPEKT — Laden via Claude Web Search
// ═══════════════════════════════════════════════════════════════

async function loadLiveProspekt(storeId) {
  var store = LIVE_STORES.find(function(s){ return s.id === storeId; });
  if (!store) return;

  // Cache prüfen
  var cached = _getLiveProspektCache(storeId);
  if (cached) {
    ANGEBOTE_STATE.liveStoreId   = storeId;
    ANGEBOTE_STATE.liveLoading   = false;
    ANGEBOTE_STATE.liveError     = null;
    ANGEBOTE_STATE.liveFilterCat = '';
    ANGEBOTE_STATE.view = 'live';
    renderAngeboteTab();
    return;
  }

  // Laden starten
  ANGEBOTE_STATE.liveStoreId   = storeId;
  ANGEBOTE_STATE.liveLoading   = true;
  ANGEBOTE_STATE.liveError     = null;
  ANGEBOTE_STATE.liveFilterCat = '';
  ANGEBOTE_STATE.view = 'live';
  renderAngeboteTab();

  try {
    var hasKey = typeof ANTHROPIC_API_KEY !== 'undefined' && ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
    if (!hasKey) throw new Error('Kein API Key konfiguriert.');

    var today = new Date().toISOString().slice(0,10);
    var storeSlug = store.name.toLowerCase().replace(/\s+/g, '-');
    var prompt =
      'Öffne https://www.aktionsfinder.at/haendler/' + storeSlug + ' ' +
      'und https://www.marktguru.at/de-at/search?q=' + encodeURIComponent(store.name) + ' ' +
      'und lese den aktuellen Wochenprospekt von ' + store.name + ' Österreich (Stand: ' + today + ') aus. ' +
      'Gib NUR die Preise und Angebote zurück, die du auf diesen Websites DIREKT siehst — KEINE Schätzungen. ' +
      'Liste alle Produkte aus dem aktuellen Prospekt auf, mit Angebotspreis, Normalpreis und Kategorie. ' +
      'Antworte NUR mit diesem JSON-Objekt ohne Markdown oder Erklärungen:\n' +
      '{"validFrom":"' + today + '","validTo":"","deals":[' +
      '{"name":"Produktname mit Menge","price":0.99,"normalPrice":1.49,"unit":"Stk","category":"Grundzutaten","discount":34}' +
      ']}\n' +
      'Gib alle Angebote aus dem aktuellen Prospekt zurück, mindestens 8, maximal 40.';

    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'Antworte IMMER nur mit einem JSON-Objekt. Kein Text davor oder danach, kein Markdown.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    // Fallback ohne Web Search
    if (!resp.ok) {
      resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          system: 'Antworte IMMER nur mit einem JSON-Objekt. Kein Text davor oder danach.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    }

    if (!resp.ok) {
      var e = {}; try { e = await resp.json(); } catch(_) {}
      throw new Error(e.error ? e.error.message : 'HTTP ' + resp.status);
    }

    var data = await resp.json();
    var textBlocks = (data.content || []).filter(function(b){ return b.type === 'text'; });

    var prospektData = null;
    for (var ti = textBlocks.length - 1; ti >= 0; ti--) {
      prospektData = _parseProspektJSON(textBlocks[ti].text);
      if (prospektData && prospektData.deals && prospektData.deals.length > 0) break;
    }

    if (!prospektData || !prospektData.deals || !prospektData.deals.length) {
      throw new Error('Kein Prospekt gefunden. Bitte erneut versuchen.');
    }

    // Deals mit IDs und discount versehen
    prospektData.deals = prospektData.deals.map(function(d, i) {
      d.id = storeId + '_live_' + i;
      if (!d.discount && d.normalPrice && d.price) {
        d.discount = Math.round((1 - d.price / d.normalPrice) * 100);
      }
      return d;
    });

    _setLiveProspektCache(storeId, prospektData);
    ANGEBOTE_STATE.liveLoading = false;

  } catch(err) {
    ANGEBOTE_STATE.liveLoading = false;
    ANGEBOTE_STATE.liveError = err.message || String(err);
  }

  renderAngeboteTab();
}

function _parseProspektJSON(text) {
  if (!text || !text.trim()) return null;
  // Direkt parsen
  try { var r = JSON.parse(text.trim()); if (r && r.deals) return r; } catch(_) {}
  // Code fence
  var fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { var r2 = JSON.parse(fence[1].trim()); if (r2 && r2.deals) return r2; } catch(_) {} }
  // JSON-Objekt extrahieren
  var obj = text.match(/\{[\s\S]*"deals"[\s\S]*\}/);
  if (obj) { try { var r3 = JSON.parse(obj[0]); if (r3 && r3.deals) return r3; } catch(_) {} }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// LIVE PROSPEKT — View
// ═══════════════════════════════════════════════════════════════

function _buildLiveView() {
  var storeId = ANGEBOTE_STATE.liveStoreId;
  var store   = LIVE_STORES.find(function(s){ return s.id === storeId; }) || { name: storeId, gradient: 'linear-gradient(135deg,#610000,#8b0000)', color:'#610000', emoji:'🏪' };
  var cached  = _getLiveProspektCache(storeId);
  var loading = ANGEBOTE_STATE.liveLoading;
  var error   = ANGEBOTE_STATE.liveError;

  var html = '';

  // ── Hero Header ──
  html += '<div style="background:' + store.gradient + ';border-radius:20px;padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  html += '<div style="position:absolute;right:-20px;top:-20px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.07)"></div>';

  // Zurück Button
  html += '<button onclick="ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:7px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;margin-bottom:18px;backdrop-filter:blur(4px)">';
  html += '<span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück</button>';

  html += '<div style="display:flex;align-items:center;gap:16px;position:relative">';
  html += '<div style="font-size:40px;line-height:1;width:60px;height:60px;background:rgba(255,255,255,.18);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + store.emoji + '</div>';
  html += '<div>';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
  html += '<span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:26px;font-weight:900;color:#fff">' + store.name + '</span>';
  html += '<span style="background:rgba(255,255,255,.25);color:#fff;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px">Live-Prospekt</span>';
  html += '</div>';

  if (loading) {
    html += '<div style="font-size:13px;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:8px">';
    html += '<span class="spinner-sm"></span>Suche auf aktionsfinder.at &amp; marktguru.at nach ' + store.name + '-Angeboten …</div>';
  } else if (cached) {
    var loadedAt = cached.timestamp ? new Date(cached.timestamp).toLocaleString('de-AT', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
    var validStr = '';
    if (cached.validFrom && cached.validTo) {
      var vf = new Date(cached.validFrom).toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'});
      var vt = new Date(cached.validTo).toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'});
      validStr = vf + ' – ' + vt;
    }
    html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
    if (validStr) html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">calendar_today</span>Gültig: ' + validStr + '</span>';
    html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">local_offer</span>' + cached.deals.length + ' Angebote</span>';
    html += '</div>';
    html += '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:4px">Geladen: ' + loadedAt + ' &nbsp;·&nbsp; Cache 12 Std.</div>';
  } else if (error) {
    html += '<div style="font-size:13px;color:rgba(255,200,200,.9)">' + escHtml(error) + '</div>';
  }

  html += '</div></div>';

  // Refresh + Cache leeren Button
  if (!loading) {
    html += '<div style="position:absolute;top:16px;right:16px;display:flex;gap:8px">';
    html += '<button onclick="clearLiveProspektCache(\'' + storeId + '\');loadLiveProspekt(\'' + storeId + '\')" ';
    html += 'style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px;backdrop-filter:blur(4px)">';
    html += '<span class="material-symbols-outlined" style="font-size:14px">refresh</span>Aktualisieren</button>';
    html += '</div>';
  }

  html += '</div>';

  // ── Loading State ──
  if (loading) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px solid ' + store.color + '22">';
    html += '<div class="spinner"></div>';
    html += '<p style="font-size:15px;font-weight:700;color:#261816;margin:0 0 6px">Prospekt wird geladen …</p>';
    html += '<p style="font-size:13px;color:#8d6562;margin:0">Claude durchsucht ' + store.name.toLowerCase() + '.at nach den Wochenangeboten</p>';
    html += '</div>';
    return html;
  }

  // ── Error State ──
  if (error && !cached) {
    html += '<div style="text-align:center;padding:48px 20px;background:#fff3cd;border-radius:16px;border:1.5px solid #ffc107">';
    html += '<span class="material-symbols-outlined" style="font-size:48px;color:#e65100">error_outline</span>';
    html += '<p style="font-size:15px;font-weight:700;color:#261816;margin:12px 0 6px">Prospekt konnte nicht geladen werden</p>';
    html += '<p style="font-size:13px;color:#5a403c;margin:0 0 16px">' + escHtml(error) + '</p>';
    html += '<button onclick="loadLiveProspekt(\'' + storeId + '\')" style="padding:10px 22px;background:' + store.color + ';color:#fff;border:none;border-radius:10px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700">Erneut versuchen</button>';
    html += '</div>';
    return html;
  }

  if (!cached) return html;

  var deals = cached.deals;

  // ── Savings Banner ──
  var totalSave = deals.reduce(function(s,d){ return s + (d.normalPrice&&d.price ? d.normalPrice-d.price : 0); }, 0);
  if (totalSave > 0.01) {
    html += '<div style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:14px;padding:14px 22px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">';
    html += '<div><div style="font-size:12px;color:rgba(255,255,255,.85);font-weight:600;margin-bottom:2px">' + deals.length + ' Angebote — Mögliche Gesamtersparnis</div>';
    html += '<div style="font-size:28px;font-weight:900;color:#fff">−' + eur(totalSave) + '</div></div>';
    html += '<span class="material-symbols-outlined" style="font-size:48px;color:rgba(255,255,255,.2)">savings</span>';
    html += '</div>';
  }

  // ── Kategorie Filter ──
  var allCats = [];
  var catSeen = {};
  for (var ci = 0; ci < deals.length; ci++) {
    if (deals[ci].category && !catSeen[deals[ci].category]) {
      allCats.push(deals[ci].category);
      catSeen[deals[ci].category] = true;
    }
  }
  var fcat = ANGEBOTE_STATE.liveFilterCat;
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">';
  var allBg = !fcat ? store.color : '#f0f0f5';
  var allCol = !fcat ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.liveFilterCat=\'\';renderAngeboteTab()" style="padding:7px 16px;background:' + allBg + ';color:' + allCol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">Alle (' + deals.length + ')</button>';
  for (var cfi = 0; cfi < allCats.length; cfi++) {
    var cat = allCats[cfi];
    var catDeals = deals.filter(function(d){ return d.category === cat; }).length;
    var isAct = fcat === cat;
    var cbg = isAct ? store.color : '#f0f0f5';
    var ccol = isAct ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.liveFilterCat=\'' + escHtml(cat) + '\';renderAngeboteTab()" style="padding:7px 16px;background:' + cbg + ';color:' + ccol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">' + escHtml(cat) + ' (' + catDeals + ')</button>';
  }
  html += '</div>';

  // ── Deal Grid ──
  var displayed = fcat ? deals.filter(function(d){ return d.category === fcat; }) : deals;
  var sorted = displayed.slice().sort(function(a,b){ return (b.discount||0)-(a.discount||0); });

  var mockP = { store: store.name, storeId: storeId, color: store.color, gradient: store.gradient };
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px">';
  for (var di = 0; di < sorted.length; di++) {
    html += _renderDetailDealCard(sorted[di], mockP);
  }
  html += '</div>';

  // Alle zur Einkaufsliste Button
  if (displayed.length > 0) {
    html += '<div style="margin-top:20px;text-align:center">';
    html += '<button onclick="(function(){';
    html += 'var deals=_getLiveProspektCache(\'' + storeId + '\');';
    html += 'if(!deals||!deals.deals)return;';
    html += 'var d=deals.deals.filter(function(x){return !ANGEBOTE_STATE.liveFilterCat||x.category===ANGEBOTE_STATE.liveFilterCat;});';
    html += 'd.forEach(function(x){if(typeof elAddItem===\'function\')elAddItem({name:x.name,menge:1,einheit:x.unit||\'Stk\',preis:x.price,shop:\'' + store.name + '\',shopId:\'' + storeId + '\',shopColor:\'' + store.color + '\',source:\'angebot\'});});';
    html += 'if(typeof elUpdateBadge===\'function\')elUpdateBadge();';
    html += 'alert(d.length+\' Artikel zur Einkaufsliste hinzugefügt!\');';
    html += '})()" style="padding:12px 28px;background:' + store.color + ';color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:8px">';
    html += '<span class="material-symbols-outlined" style="font-size:18px">add_shopping_cart</span>Alle zur Einkaufsliste</button>';
    html += '</div>';
  }

  return html;
}
