// js/angebote.js
// ═══════════════════════════════════════════════════════════════
// ANGEBOTE — State
// ═══════════════════════════════════════════════════════════════

const ANGEBOTE_STATE = {
  view: 'woche',       // 'suche' | 'woche' | 'naechste' | 'empfehlung' | 'neu'
  searchQuery: '',
  filterShop: '',
  filterCategory: '',
};

// ═══════════════════════════════════════════════════════════════
// DEAL DATA — normalisiert
// ═══════════════════════════════════════════════════════════════

function getAllDeals() {
  const today = new Date(); today.setHours(0,0,0,0);
  const mon   = weekMonday(today);

  // Config DEALS → normalisiert
  const configDeals = DEALS.map((d, i) => {
    const product = PRODUCTS.find(p => p.id === d.productId);
    const shop    = SHOPS.find(s => s.id === d.shopId);
    let validFrom, validTo;
    if (d.validFrom && d.validTo) {
      validFrom = d.validFrom;
      validTo   = d.validTo;
    } else if (d.week === 'current') {
      validFrom = mon.toISOString().slice(0,10);
      const sun = new Date(mon); sun.setDate(mon.getDate()+6);
      validTo = sun.toISOString().slice(0,10);
    } else {
      const nm = new Date(mon); nm.setDate(mon.getDate()+7);
      validFrom = nm.toISOString().slice(0,10);
      const ns = new Date(nm); ns.setDate(nm.getDate()+6);
      validTo = ns.toISOString().slice(0,10);
    }
    const discount = d.normalPrice ? Math.round((1 - d.pricePerUnit / d.normalPrice) * 100) : 0;
    return {
      id:          'cfg_' + i,
      shopId:      d.shopId,
      shopName:    shop ? shop.name : d.shopId,
      shopColor:   shop ? shop.color : '#555',
      productId:   d.productId,
      productName: product ? product.name : d.productId,
      category:    product ? product.category : 'Sonstiges',
      price:       d.pricePerUnit,
      normalPrice: d.normalPrice || null,
      unit:        product ? product.unit : 'Stk',
      discount,
      validFrom,
      validTo,
      source: 'config',
    };
  });

  // Custom deals (user-added)
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}

  return [...configDeals, ...custom];
}

function getDealsForSearch(q) {
  if (!q || !q.trim()) return [];
  const query = q.toLowerCase().trim();
  return getAllDeals().filter(d =>
    d.productName.toLowerCase().includes(query) ||
    d.shopName.toLowerCase().includes(query)    ||
    (d.category && d.category.toLowerCase().includes(query))
  );
}

function getDealsForWeek(which) {
  const today = new Date(); today.setHours(0,0,0,0);
  const mon   = weekMonday(today);
  let rStart, rEnd;
  if (which === 'current') {
    rStart = mon;
    rEnd   = new Date(mon); rEnd.setDate(mon.getDate()+6);
  } else {
    rStart = new Date(mon); rStart.setDate(mon.getDate()+7);
    rEnd   = new Date(rStart); rEnd.setDate(rStart.getDate()+6);
  }
  return getAllDeals().filter(d => {
    if (!d.validFrom || !d.validTo) return false;
    const from = new Date(d.validFrom);
    const to   = new Date(d.validTo);
    return from <= rEnd && to >= rStart;
  });
}

function getDealRecommendations() {
  // Count products from HISTORY
  const counts = {};
  for (const h of HISTORY) {
    const k = h.produktName.toLowerCase();
    counts[k] = (counts[k] || 0) + 1;
  }
  const top = Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,15)
    .map(([n]) => n);

  const all = [...getDealsForWeek('current'), ...getDealsForWeek('next')];
  return all.filter(d =>
    top.some(p =>
      d.productName.toLowerCase().includes(p.split(' ')[0]) ||
      p.includes(d.productName.toLowerCase().split(' ')[0])
    )
  );
}

// ═══════════════════════════════════════════════════════════════
// RENDER — Main Tab
// ═══════════════════════════════════════════════════════════════

function renderAngeboteTab() {
  const panel = document.getElementById('panel-angebote');
  if (!panel) { console.error('panel-angebote nicht gefunden!'); return; }
  try {
    _renderAngeboteTabInner(panel);
  } catch(err) {
    console.error('Angebote Fehler:', err);
    panel.innerHTML = `<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px">
      <strong>Fehler:</strong> ${err.message}</div>`;
  }
}
function _renderAngeboteTabInner(panel) {

  const currentDeals = getDealsForWeek('current');
  const nextDeals    = getDealsForWeek('next');
  const recs         = getDealRecommendations();

  const tabs = [
    { key:'woche',      label:'Diese Woche',    icon:'calendar_today', count: currentDeals.length },
    { key:'naechste',   label:'Nächste Woche',  icon:'event',          count: nextDeals.length    },
    { key:'empfehlung', label:'Empfehlungen',   icon:'thumb_up',       count: recs.length         },
    { key:'neu',        label:'+ Deal',          icon:'add_circle',     count: 0                   },
  ];

  let html = `
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#610000,#8b0000);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:26px;color:#fff">local_offer</span>
      </div>
      <div>
        <h2 style="font-size:20px;font-weight:800;color:#261816;margin:0">Angebote</h2>
        <p style="font-size:13px;color:#5a403c;margin:0">${currentDeals.length} aktuelle · ${nextDeals.length} nächste Woche${recs.length?` · ${recs.length} Empfehlungen`:''}</p>
      </div>
    </div>

    <!-- Suchfeld -->
    <div style="position:relative;margin-bottom:20px">
      <span class="material-symbols-outlined" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:20px;color:#8d6562;pointer-events:none">search</span>
      <input id="angebote-search" type="text" placeholder="Produkt oder Geschäft suchen …"
        value="${escHtml(ANGEBOTE_STATE.searchQuery)}"
        oninput="ANGEBOTE_STATE.searchQuery=this.value;ANGEBOTE_STATE.view=this.value?'suche':'woche';renderAngeboteTab()"
        style="width:100%;padding:14px 44px 14px 46px;border:1.5px solid #e3beb8;border-radius:14px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
        onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
      ${ANGEBOTE_STATE.searchQuery ? `
      <button onclick="ANGEBOTE_STATE.searchQuery='';ANGEBOTE_STATE.view='woche';renderAngeboteTab()"
        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;line-height:0">
        <span class="material-symbols-outlined" style="font-size:18px;color:#8d6562">close</span>
      </button>` : ''}
    </div>`;

  // Sub-Tabs (nur wenn nicht Suche aktiv)
  if (ANGEBOTE_STATE.view !== 'suche') {
    html += `
    <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid #e3beb8;overflow-x:auto" class="hide-scrollbar">
      ${tabs.map(t => `
      <button onclick="ANGEBOTE_STATE.view='${t.key}';renderAngeboteTab()"
        style="padding:10px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap;font-family:inherit;display:flex;align-items:center;gap:5px;
               color:${ANGEBOTE_STATE.view===t.key?'#610000':'#5a403c'};
               border-bottom:${ANGEBOTE_STATE.view===t.key?'3px solid #610000':'3px solid transparent'};
               margin-bottom:-2px">
        <span class="material-symbols-outlined" style="font-size:15px">${t.icon}</span>
        ${t.label}
        ${t.count>0?`<span style="background:${ANGEBOTE_STATE.view===t.key?'#610000':'#e3beb8'};color:${ANGEBOTE_STATE.view===t.key?'#fff':'#5a403c'};border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700">${t.count}</span>`:''}
      </button>`).join('')}
    </div>`;
  }

  if      (ANGEBOTE_STATE.view === 'suche')      html += renderAngeboteSuche();
  else if (ANGEBOTE_STATE.view === 'woche')      html += renderAngeboteWocheInner(currentDeals, 'current');
  else if (ANGEBOTE_STATE.view === 'naechste')   html += renderAngeboteWocheInner(nextDeals, 'next');
  else if (ANGEBOTE_STATE.view === 'empfehlung') html += renderAngeboteEmpfehlungen(recs);
  else if (ANGEBOTE_STATE.view === 'neu')        html += renderAngeboteNeuForm();

  panel.innerHTML = html;

  const inp = document.getElementById('angebote-search');
  if (inp && ANGEBOTE_STATE.view === 'suche') inp.focus();
} // end _renderAngeboteTabInner

// ═══════════════════════════════════════════════════════════════
// RENDER — Suche
// ═══════════════════════════════════════════════════════════════

function renderAngeboteSuche() {
  const results = getDealsForSearch(ANGEBOTE_STATE.searchQuery);
  if (!results.length) return `
    <div style="text-align:center;padding:56px 20px">
      <span class="material-symbols-outlined" style="font-size:56px;color:#e3beb8">search_off</span>
      <p style="color:#8d6562;margin-top:14px;font-size:15px">Kein Angebot für <strong>"${escHtml(ANGEBOTE_STATE.searchQuery)}"</strong></p>
      <p style="color:#8d6562;font-size:13px;margin-top:6px">Tipp: Deal selbst eintragen</p>
      <button onclick="ANGEBOTE_STATE.view='neu';ANGEBOTE_STATE.searchQuery='';renderAngeboteTab()"
        style="margin-top:14px;padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">add</span>Deal eintragen
      </button>
    </div>`;

  // Sortierung: Rabatt absteigend
  const sorted = [...results].sort((a,b) => (b.discount||0)-(a.discount||0));
  return `
    <p style="font-size:13px;color:#8d6562;margin-bottom:14px">${results.length} Angebot${results.length!==1?'e':''} gefunden</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
      ${sorted.map(d => renderDealCard(d)).join('')}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — Woche
// ═══════════════════════════════════════════════════════════════

function renderAngeboteWocheInner(deals, which) {
  if (!deals.length) return `
    <div style="text-align:center;padding:56px 20px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
      <span class="material-symbols-outlined" style="font-size:56px;color:#e3beb8">local_offer</span>
      <p style="color:#8d6562;margin-top:14px;font-size:14px">Keine Angebote ${which==='current'?'diese Woche':'nächste Woche'}</p>
      <button onclick="ANGEBOTE_STATE.view='neu';renderAngeboteTab()"
        style="margin-top:14px;padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">add</span>Deal hinzufügen
      </button>
    </div>`;

  // Filter
  const shops = [...new Set(deals.map(d => d.shopName))].sort();
  const cats  = [...new Set(deals.map(d => d.category).filter(Boolean))].sort();
  const fShop = ANGEBOTE_STATE.filterShop;
  const fCat  = ANGEBOTE_STATE.filterCategory;
  const filtered = deals.filter(d =>
    (!fShop || d.shopName === fShop) && (!fCat || d.category === fCat)
  );
  const totalSavings = filtered.reduce((s,d) => s + (d.normalPrice&&d.price ? d.normalPrice-d.price : 0), 0);

  let html = `
    <!-- Filter -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <select onchange="ANGEBOTE_STATE.filterShop=this.value;renderAngeboteTab()"
        style="flex:1;min-width:130px;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;outline:none">
        <option value="">Alle Geschäfte</option>
        ${shops.map(s=>`<option value="${escHtml(s)}" ${fShop===s?'selected':''}>${escHtml(s)}</option>`).join('')}
      </select>
      <select onchange="ANGEBOTE_STATE.filterCategory=this.value;renderAngeboteTab()"
        style="flex:1;min-width:130px;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;outline:none">
        <option value="">Alle Kategorien</option>
        ${cats.map(c=>`<option value="${escHtml(c)}" ${fCat===c?'selected':''}>${escHtml(c)}</option>`).join('')}
      </select>
    </div>`;

  // Ersparnis-Banner
  if (totalSavings > 0.01) {
    html += `
    <div style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:14px;padding:14px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div style="color:#fff">
        <div style="font-size:12px;opacity:.85;font-weight:600;margin-bottom:2px">${filtered.length} Angebote — mögliche Ersparnis</div>
        <div style="font-size:26px;font-weight:800">− ${eur(totalSavings)}</div>
      </div>
      <span class="material-symbols-outlined" style="font-size:40px;color:rgba(255,255,255,.3)">savings</span>
    </div>`;
  }

  // Cards
  const sorted = [...filtered].sort((a,b) => (b.discount||0)-(a.discount||0));
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">`;
  html += sorted.map(d => renderDealCard(d)).join('');
  html += `</div>`;
  return html;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — Empfehlungen
// ═══════════════════════════════════════════════════════════════

function renderAngeboteEmpfehlungen(recs) {
  if (!HISTORY.length) return `
    <div style="text-align:center;padding:56px 20px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
      <span class="material-symbols-outlined" style="font-size:56px;color:#e3beb8">thumb_up</span>
      <p style="color:#8d6562;margin-top:14px;font-size:14px">Noch keine Einkaufshistorie vorhanden.</p>
      <p style="color:#8d6562;font-size:13px;margin-top:4px">Erfasse Einkäufe im Verlauf-Tab — dann erscheinen hier passende Empfehlungen.</p>
    </div>`;

  if (!recs.length) return `
    <div style="text-align:center;padding:56px 20px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
      <span class="material-symbols-outlined" style="font-size:56px;color:#e3beb8">thumb_up</span>
      <p style="color:#8d6562;margin-top:14px;font-size:14px">Keine passenden Angebote für deine häufig gekauften Produkte.</p>
    </div>`;

  return `
    <div style="background:#fff0ee;border:1px solid #e3beb8;border-radius:14px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#610000">auto_awesome</span>
      <span style="font-size:13px;color:#5a403c">Basierend auf deinen Einkäufen — ${recs.length} passende Angebot${recs.length!==1?'e':''}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
      ${recs.map(d => renderDealCard(d, true)).join('')}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — Deal Karte
// ═══════════════════════════════════════════════════════════════

function renderDealCard(deal, isRecommended = false) {
  const discount  = deal.discount || (deal.normalPrice && deal.price ? Math.round((1 - deal.price/deal.normalPrice)*100) : 0);
  const savings   = (deal.normalPrice && deal.price) ? deal.normalPrice - deal.price : 0;
  const today     = new Date(); today.setHours(0,0,0,0);
  const validTo   = deal.validTo ? new Date(deal.validTo) : null;
  const daysLeft  = validTo ? Math.ceil((validTo - today) / 86400000) : null;
  const expiring  = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0;
  const expired   = daysLeft !== null && daysLeft < 0;
  const fromStr   = deal.validFrom ? new Date(deal.validFrom).toLocaleDateString('de-AT',{day:'numeric',month:'short'}) : '';
  const toStr     = deal.validTo   ? new Date(deal.validTo).toLocaleDateString('de-AT',{day:'numeric',month:'short'})   : '';
  const safeId    = (deal.id||'').replace(/['"]/g,'');
  const safeName  = escHtml(deal.productName||'');
  const safeShop  = escHtml(deal.shopName||'');
  const safeShopId= escHtml(deal.shopId||'');
  const safeUnit  = escHtml(deal.unit||'Stk');

  return `
  <div style="background:#fff;border:1.5px solid ${expiring?'#e65100':'#e3beb8'};border-radius:16px;overflow:hidden;transition:box-shadow .15s;${expired?'opacity:.55':''}">
    <!-- Shop-Header -->
    <div style="background:${deal.shopColor||'#610000'};padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px">
      <div style="display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:14px;color:rgba(255,255,255,.8)">store</span>
        <span style="font-size:13px;font-weight:800;color:#fff">${safeShop}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        ${isRecommended?'<span style="font-size:10px;font-weight:700;background:rgba(255,255,255,.2);color:#fff;padding:2px 8px;border-radius:20px">Empfohlen</span>':''}
        ${discount>0?`<span style="font-size:12px;font-weight:800;background:#fff;color:#2e7d32;padding:2px 9px;border-radius:20px">−${discount}%</span>`:''}
        ${expiring?'<span style="font-size:10px;font-weight:800;background:#e65100;color:#fff;padding:2px 8px;border-radius:20px">Läuft ab!</span>':''}
      </div>
    </div>
    <!-- Inhalt -->
    <div style="padding:16px">
      <div style="font-size:15px;font-weight:700;color:#261816;margin-bottom:12px;line-height:1.35">${safeName}</div>
      <!-- Preis -->
      <div style="display:flex;align-items:flex-end;gap:12px;margin-bottom:12px">
        <div style="font-size:30px;font-weight:800;color:#610000;line-height:1">${eur(deal.price)}</div>
        ${deal.normalPrice?`
        <div style="margin-bottom:3px">
          <div style="font-size:13px;text-decoration:line-through;color:#8d6562;font-weight:500">${eur(deal.normalPrice)}</div>
          ${savings>0.01?`<div style="font-size:11px;font-weight:700;color:#2e7d32">du sparst ${eur(savings)}</div>`:''}
        </div>`:''}
      </div>
      <!-- Kategorie -->
      ${deal.category?`<div style="display:inline-block;background:#f8f4f3;border-radius:20px;padding:3px 10px;font-size:11px;color:#5a403c;font-weight:600;margin-bottom:12px">${escHtml(deal.category)}</div>`:''}
      <!-- Footer -->
      <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f0e8e6;padding-top:10px;gap:8px;flex-wrap:wrap">
        <div style="font-size:11px;color:${expired?'#ba1a1a':expiring?'#e65100':'#8d6562'};display:flex;align-items:center;gap:4px">
          <span class="material-symbols-outlined" style="font-size:13px">calendar_today</span>
          ${fromStr&&toStr?`${fromStr} – ${toStr}`:toStr?`bis ${toStr}`:''}
          ${expired?' · Abgelaufen':''}
        </div>
        ${!expired?`
        <button onclick="angebotMerken('${safeId}','${safeName.replace(/'/g,"\\'")}',${deal.price},'${safeShop.replace(/'/g,"\\'")}','${safeShopId}','${safeUnit}',1)"
          style="font-size:11px;font-weight:700;color:#610000;background:#fff0ee;border:1px solid #e3beb8;border-radius:8px;padding:5px 12px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;white-space:nowrap">
          <span class="material-symbols-outlined" style="font-size:13px">bookmark_add</span>Merken
        </button>`:''}
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — Neuer Deal Form
// ═══════════════════════════════════════════════════════════════

function renderAngeboteNeuForm() {
  const today = new Date().toISOString().slice(0,10);
  const nextSun = new Date(); nextSun.setDate(nextSun.getDate() + (7 - nextSun.getDay()));
  const nextSunStr = nextSun.toISOString().slice(0,10);

  // Saved custom deals
  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}

  const gridCols = customs.length ? '1fr 1fr' : '1fr';
  return `
  <div style="display:grid;grid-template-columns:${gridCols};gap:20px;align-items:start">
    <!-- Form -->
    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:18px;padding:24px">
      <h3 style="font-size:16px;font-weight:800;color:#261816;margin:0 0 18px;display:flex;align-items:center;gap:8px">
        <span class="material-symbols-outlined" style="font-size:18px;color:#610000">add_circle</span>
        Neues Angebot eintragen
      </h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Produkt *</label>
          <input id="nd-produkt" type="text" placeholder="z.B. Mozzarella 250g"
            style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Angebotspreis (€) *</label>
            <input id="nd-preis" type="number" min="0" step="0.01" placeholder="2.99"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Normalpreis (€)</label>
            <input id="nd-normal" type="number" min="0" step="0.01" placeholder="3.99"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Gültig von</label>
            <input id="nd-von" type="date" value="${today}"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Gültig bis</label>
            <input id="nd-bis" type="date" value="${nextSunStr}"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"/>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Geschäft</label>
            <select id="nd-shop"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none">
              ${SHOPS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie</label>
            <select id="nd-kat"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none">
              <option>Grundzutaten</option><option>Käse</option><option>Belag</option>
              <option>Gewürze</option><option>Tiefkühl</option><option>Getränke</option><option>Sonstiges</option>
            </select>
          </div>
        </div>
        <button onclick="angebotSpeichern()"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          <span class="material-symbols-outlined" style="font-size:20px">save</span>Angebot speichern
        </button>
      </div>
    </div>

    ${customs.length ? `
    <!-- Gespeicherte eigene Deals -->
    <div>
      <h4 style="font-size:14px;font-weight:700;color:#261816;margin:0 0 12px;display:flex;align-items:center;justify-content:space-between">
        <span>Eigene Deals (${customs.length})</span>
        <button onclick="if(confirm('Alle eigenen Deals löschen?')){localStorage.removeItem('pizzeria_custom_deals');renderAngeboteTab()}"
          style="font-size:11px;color:#8d6562;background:none;border:1px solid #e3beb8;border-radius:8px;padding:4px 8px;cursor:pointer;font-family:inherit">Alle löschen</button>
      </h4>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${customs.map(d => `
        <div style="background:#fff;border:1px solid #e3beb8;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px">
          <div style="width:8px;height:8px;border-radius:50%;background:${d.shopColor||'#610000'};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(d.productName)}</div>
            <div style="font-size:11px;color:#8d6562">${escHtml(d.shopName)} · ${eur(d.price)}${d.normalPrice?` statt ${eur(d.normalPrice)}`:''}</div>
          </div>
          <button onclick="angebotLoeschen('${d.id}')"
            style="background:none;border:none;cursor:pointer;padding:4px;color:#8d6562;line-height:0;flex-shrink:0">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
          </button>
        </div>`).join('')}
      </div>
    </div>` : ''}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════

function angebotMerken(id, name, preis, shopName, shopId, einheit, menge) {
  addHistoryEntry({ produktName: name, preis, shopName, shopId, einheit, menge, quelle: 'angebot' });
  HISTORY = JSON.parse(localStorage.getItem('pizzeria_history') || '[]');
  // Button-Feedback ohne re-render
  const btns = document.querySelectorAll(`button[onclick*="${id}"]`);
  btns.forEach(b => {
    b.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px">check</span> Gemerkt';
    b.style.color = '#2e7d32';
    b.style.background = '#f0fdf4';
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

  if (!produkt || isNaN(preis) || preis <= 0) {
    alert('Bitte Produktname und Preis eingeben.'); return;
  }
  const shopObj  = SHOPS.find(s => s.id === shopId);
  const discount = normal ? Math.round((1 - preis/normal)*100) : 0;
  const deal = {
    id: 'custom_' + Date.now(),
    shopId,
    shopName:    shopObj ? shopObj.name : 'Sonstiges',
    shopColor:   shopObj ? shopObj.color : '#555',
    productName: produkt,
    category:    kat,
    price:       preis,
    normalPrice: normal,
    unit:        'Stk',
    discount,
    validFrom:   von || null,
    validTo:     bis || null,
    source:      'custom',
  };

  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  customs.unshift(deal);
  localStorage.setItem('pizzeria_custom_deals', JSON.stringify(customs));

  ANGEBOTE_STATE.view = 'woche';
  ANGEBOTE_STATE.filterShop = '';
  ANGEBOTE_STATE.filterCategory = '';
  renderAngeboteTab();
}

function angebotLoeschen(id) {
  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  customs = customs.filter(d => d.id !== id);
  localStorage.setItem('pizzeria_custom_deals', JSON.stringify(customs));
  renderAngeboteTab();
}
