// js/tabs.js
function calcSingleShopCombo(shop, lowProducts) {
  const items = [];
  for (const p of lowProducts) {
    const price = getPrice(shop.id, p.id);
    if (price === null) return null;
    items.push({ product: p, shop, pricePerUnit: price, quantity: p.orderQuantity, totalCost: price * p.orderQuantity });
  }
  const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
  return { id: 'single-' + shop.id, shops: [shop], items, totalCost, numShops: 1, isRecommended: false };
}

function calcTwoShopCombo(shopA, shopB, lowProducts) {
  const items = [];
  for (const p of lowProducts) {
    const pA = getPrice(shopA.id, p.id);
    const pB = getPrice(shopB.id, p.id);
    if (pA === null && pB === null) return null;
    let chosenShop, chosenPrice;
    if (pA === null)      { chosenShop = shopB; chosenPrice = pB; }
    else if (pB === null) { chosenShop = shopA; chosenPrice = pA; }
    else                  { chosenShop = pA <= pB ? shopA : shopB; chosenPrice = Math.min(pA, pB); }
    items.push({ product: p, shop: chosenShop, pricePerUnit: chosenPrice, quantity: p.orderQuantity, totalCost: chosenPrice * p.orderQuantity });
  }
  // Only count shops actually used
  const usedIds = new Set(items.map(i => i.shop.id));
  if (usedIds.size < 2) return null; // degenerate – same as single shop
  const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
  const shops = SHOPS.filter(s => usedIds.has(s.id));
  return { id: 'two-' + shopA.id + '-' + shopB.id, shops, items, totalCost, numShops: 2, isRecommended: false };
}

function calculateCombinations() {
  const low = getLowStockProducts();
  if (low.length === 0) return { single: [], two: [], hasLow: false };

  // Single shop
  const single = SHOPS
    .map(s => calcSingleShopCombo(s, low))
    .filter(Boolean)
    .sort((a, b) => a.totalCost - b.totalCost)
    .slice(0, 3);

  // Two shop
  const two = [];
  for (let i = 0; i < SHOPS.length; i++) {
    for (let j = i + 1; j < SHOPS.length; j++) {
      const c = calcTwoShopCombo(SHOPS[i], SHOPS[j], low);
      if (c) two.push(c);
    }
  }
  two.sort((a, b) => a.totalCost - b.totalCost);
  const top3Two = two.slice(0, 3);

  // Mark globally cheapest as EMPFOHLEN
  const all = [...top3Two, ...single];
  if (all.length > 0) {
    all.sort((a, b) => a.totalCost - b.totalCost);
    all[0].isRecommended = true;
  }

  return { single, two: top3Two, hasLow: true };
}

// ═══════════════════════════════════════════════════════════════
// RENDER — PRODUKTE
// ═══════════════════════════════════════════════════════════════

const CATEGORY_BG = {
  'Grundzutaten': '#e8f4fd',
  'Käse':         '#fdf5e8',
  'Belag':        '#fde8e8',
  'Gewürze':      '#e8fdf0',
};

function renderProductsTab() {
  const low = getLowStockProducts();
  const categories = [...new Set(PRODUCTS.map(p => p.category))];

  let html = `
    <div style="display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap">
      <div style="flex:1;min-width:120px;background:#fff0ee;border:1px solid #e3beb8;border-radius:16px;padding:16px 20px">
        <div style="font-size:28px;font-weight:800;color:#261816">${PRODUCTS.length}</div>
        <div style="font-size:12px;color:#5a403c;margin-top:4px">Produkte gesamt</div>
      </div>
      <div style="flex:1;min-width:120px;background:${low.length>0?'#ffdad6':'#f0fdf4'};border:1px solid ${low.length>0?'#ffdad4':'#bbf7d0'};border-radius:16px;padding:16px 20px">
        <div style="font-size:28px;font-weight:800;color:${low.length>0?'#93000a':'#0c2000'}">${low.length}</div>
        <div style="font-size:12px;color:${low.length>0?'#ba1a1a':'#386a20'};margin-top:4px">Niedriger Bestand</div>
      </div>
    </div>`;

  for (const cat of categories) {
    const catProducts = PRODUCTS.filter(p => p.category === cat);
    const bg = CATEGORY_BG[cat] || '#fff0ee';
    html += `
      <div style="margin-bottom:28px">
        <h3 style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">${cat}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">`;

    for (const p of catProducts) {
      const stock = stockLevels[p.id];
      const isLow = stock < p.minStock;
      const pct = Math.min(100, (stock / p.minStock) * 100);
      const barColor = isLow ? '#ba1a1a' : '#386a20';
      const fifoWarn = typeof fifoCheckWarning === 'function' ? fifoCheckWarning(p.id) : null;
      html += `
        <div id="pcard-${p.id}"
          style="background:${bg};border:1.5px solid ${isLow?'#ba1a1a44':'transparent'};
            border-radius:16px;overflow:hidden;transition:box-shadow .15s"
          onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'"
          onmouseout="this.style.boxShadow=''">
          <div onclick="editStock('${p.id}')" style="padding:16px;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <span style="font-size:14px;font-weight:600;color:#261816;line-height:1.3">${p.name}</span>
              ${isLow ? '<span class="material-symbols-outlined" style="font-size:18px;color:#ba1a1a;flex-shrink:0">warning</span>' : ''}
            </div>
            <div style="height:6px;background:#e3beb866;border-radius:3px;margin-bottom:10px;overflow:hidden">
              <div class="progress-fill" style="height:100%;width:${pct}%;background:${barColor};border-radius:3px"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#5a403c">
              <span>Min: ${p.minStock} ${p.unit}</span>
              <span id="stock-${p.id}" style="font-weight:700;color:${isLow?'#ba1a1a':'#386a20'}">${stock.toLocaleString('de-DE')} ${p.unit}</span>
            </div>
          </div>
          ${fifoWarn ? `
            <div style="background:#fff8e1;border-top:1px solid #ffe082;padding:7px 14px;
              display:flex;align-items:center;gap:6px;font-size:11px;color:#e65100;font-weight:600">
              <span class="material-symbols-outlined" style="font-size:13px">schedule</span>
              ${fifoWarn}
            </div>` : ''}
          <div style="border-top:1px solid rgba(0,0,0,0.06);padding:7px 10px;
            background:rgba(255,255,255,0.6);display:flex;gap:6px">
            <button onclick="event.stopPropagation();fifoSetEingang('${p.id}')"
              title="Eingang-Datum setzen (FIFO)"
              style="flex:1;min-height:36px;padding:4px 6px;border-radius:7px;
                border:1px solid #e2e2e8;background:#fff;color:#6b7280;
                font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
                display:flex;align-items:center;justify-content:center;gap:3px">
              <span class="material-symbols-outlined" style="font-size:14px">move_to_inbox</span>Eingang
            </button>
            <button onclick="event.stopPropagation();showAbfallModal('${p.id}')"
              title="Abfall erfassen"
              style="flex:1;min-height:36px;padding:4px 6px;border-radius:7px;
                border:1px solid #fecdd3;background:#fff5f5;color:#c62828;
                font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
                display:flex;align-items:center;justify-content:center;gap:3px">
              <span class="material-symbols-outlined" style="font-size:14px">delete_sweep</span>Abfall
            </button>
          </div>
        </div>`;
    }
    html += `</div></div>`;
  }

  if (typeof renderPortionskontrolleSection === 'function') {
    html += renderPortionskontrolleSection();
  }

  document.getElementById('panel-produkte').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — GESCHÄFTE
// ═══════════════════════════════════════════════════════════════

function daysUntilMonday() {
  const day = new Date().getDay(); // 0=Sun,1=Mon,...
  return day === 0 ? 1 : day === 1 ? 7 : 8 - day;
}

function renderShopsTab() {
  const lowIds = new Set(getLowStockProducts().map(p => p.id));

  // ── 1. PREISVERGLEICH TABELLE ────────────────────────────────
  // Per product: find min and max price across all shops
  const priceStats = {};
  for (const p of PRODUCTS) {
    const vals = SHOPS.map(s => getPrice(s.id, p.id)).filter(v => v !== null);
    if (vals.length) priceStats[p.id] = { min: Math.min(...vals), max: Math.max(...vals) };
  }
  const productsWithPrices = PRODUCTS.filter(p => priceStats[p.id]);

  const thCols = SHOPS.map(s =>
    `<th style="padding:8px 14px;font-size:11px;font-weight:700;color:#5a403c;text-align:right;white-space:nowrap;border-bottom:2px solid #e3beb8;min-width:82px">${s.name}</th>`
  ).join('');

  const tRows = productsWithPrices.map(p => {
    const { min, max } = priceStats[p.id];
    const allSame = min === max;
    const cells = SHOPS.map(s => {
      const v = getPrice(s.id, p.id);
      if (v === null) return `<td style="padding:8px 14px;text-align:right;font-size:13px;color:#c9b8b4">—</td>`;
      const isMin = v === min;
      const isMax = !allSame && v === max;
      const style = isMin
        ? 'padding:8px 14px;text-align:right;font-size:13px;font-weight:700;color:#16a34a;'
        : isMax
          ? 'padding:8px 14px;text-align:right;font-size:13px;color:#a89490;text-decoration:line-through;'
          : 'padding:8px 14px;text-align:right;font-size:13px;color:#261816;';
      return `<td style="${style}">${eur(v)}${isMin ? ' <span style="font-size:10px">✓</span>' : ''}</td>`;
    }).join('');

    const rowBg = lowIds.has(p.id) ? 'background:#fff5f5;' : '';
    return `
      <tr style="border-bottom:1px solid #f5f0ee;${rowBg}">
        <td style="padding:8px 14px;white-space:nowrap">
          <div style="display:flex;align-items:center;gap:5px">
            ${lowIds.has(p.id) ? '<span class="material-symbols-outlined" style="font-size:12px;color:#ba1a1a;flex-shrink:0">warning</span>' : ''}
            <span style="font-size:13px;font-weight:600;color:#261816">${p.name}</span>
            <span style="font-size:10px;color:#8e706b">/${p.unit}</span>
          </div>
        </td>
        ${cells}
      </tr>`;
  }).join('');

  const tableSection = `
    <div style="margin-bottom:24px">
      <p style="font-size:11px;font-weight:700;color:#261816;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Preisvergleich</p>
      <div style="overflow-x:auto;border-radius:10px;border:1px solid #e3beb8;background:#fff">
        <table style="width:100%;border-collapse:collapse;min-width:480px">
          <thead><tr style="background:#fafafa">
            <th style="padding:8px 14px;font-size:11px;font-weight:700;color:#5a403c;text-align:left;border-bottom:2px solid #e3beb8;white-space:nowrap">Produkt</th>
            ${thCols}
          </tr></thead>
          <tbody>${tRows}</tbody>
        </table>
        <div style="padding:6px 14px;background:#fafafa;border-top:1px solid #f0ece8;display:flex;gap:14px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#16a34a;font-weight:700">✓ günstigster Preis</span>
          <span style="font-size:10px;color:#a89490;text-decoration:line-through">teuerster Preis</span>
          ${getLowStockProducts().length > 0 ? '<span style="font-size:10px;color:#ba1a1a;margin-left:auto">⚠ Niedriger Bestand</span>' : ''}
        </div>
      </div>
    </div>`;

  // ── 2+3. AKTIONEN ─────────────────────────────────────────────
  function dealCard(deal, badge, badgeColor) {
    const product = PRODUCTS.find(p => p.id === deal.productId);
    const shop    = SHOPS.find(s => s.id === deal.shopId);
    if (!product || !shop) return '';
    const saving  = deal.normalPrice - deal.pricePerUnit;
    const pct     = Math.round((saving / deal.normalPrice) * 100);
    return `
      <div style="background:#fff;border-radius:10px;border:1px solid #e3beb8;padding:11px 13px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:6px">
          <span style="font-size:13px;font-weight:700;color:#261816;flex:1">${product.name}</span>
          <span style="font-size:9px;font-weight:700;color:#fff;background:${badgeColor};padding:2px 6px;border-radius:3px;white-space:nowrap;flex-shrink:0">${badge}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:7px;margin-bottom:4px">
          <span style="font-size:16px;font-weight:800;color:#610000">${eur(deal.pricePerUnit)}</span>
          <span style="font-size:11px;color:#a89490;text-decoration:line-through">${eur(deal.normalPrice)}</span>
          <span style="font-size:11px;font-weight:700;color:#16a34a">−${pct}%</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#8e706b">
          <span style="font-weight:600;color:#5a403c">${shop.name}</span>
          <span>bis ${deal.validTo}</span>
        </div>
      </div>`;
  }

  const curDeals  = DEALS.filter(d => d.week === 'current').sort((a,b) => (b.normalPrice-b.pricePerUnit)-(a.normalPrice-a.pricePerUnit));
  const nextDeals = DEALS.filter(d => d.week === 'next').sort((a,b) => (b.normalPrice-b.pricePerUnit)-(a.normalPrice-a.pricePerUnit));

  const dealsSection = (curDeals.length + nextDeals.length) === 0 ? '' : `
    ${curDeals.length > 0 ? `
    <div style="margin-bottom:20px">
      <p style="font-size:11px;font-weight:700;color:#261816;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">
        <span style="background:#ba1a1a;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;margin-right:6px">DIESE WOCHE</span>Aktuelle Angebote
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px">${curDeals.map(d => dealCard(d,'DIESE WOCHE','#ba1a1a')).join('')}</div>
    </div>` : ''}
    ${nextDeals.length > 0 ? `
    <div style="margin-bottom:20px">
      <p style="font-size:11px;font-weight:700;color:#261816;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">
        <span style="background:#b06020;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;margin-right:6px">AB MONTAG</span>Nächste Woche
        <span style="font-size:11px;font-weight:400;color:#5a403c;text-transform:none;letter-spacing:0;margin-left:6px">· noch ${daysUntilMonday()} Tage warten lohnt sich!</span>
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px">${nextDeals.map(d => dealCard(d,'AB MONTAG','#b06020')).join('')}</div>
    </div>` : ''}`;

  // ── 4. GESCHÄFTE ÜBERSICHT ────────────────────────────────────
  const typeMap = {
    'Großhandel': '🏭 GROSSHANDEL', 'Supermarkt': '🛒 SUPERMARKT',
    'Discounter': '🏷️ DISCOUNTER',  'Türkmarkt':  '🌙 TÜRKMARKT',
  };

  const shopCards = SHOPS.map(shop => {
    const total = PRODUCTS.reduce((s, p) => {
      const v = getPrice(shop.id, p.id); return v ? s + v * p.orderQuantity : s;
    }, 0);
    const cnt = PRODUCTS.filter(p => getPrice(shop.id, p.id) !== null).length;
    const badge = typeMap[shop.type] || ('🏪 ' + shop.type.toUpperCase());
    return `
      <div style="border-radius:10px;border:1px solid #e3beb8;overflow:hidden;background:#fff">
        <div style="background:#8B0000;padding:9px 13px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;font-weight:700;color:#fff">${shop.name}</span>
          <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,.8)">${badge}</span>
        </div>
        <div style="padding:9px 13px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;color:#8e706b">${cnt} Produkte</span>
          <div style="text-align:right">
            <span style="font-size:9px;color:#8e706b;display:block;text-transform:uppercase;letter-spacing:.06em">Gesamteinkauf</span>
            <span style="font-size:16px;font-weight:800;color:#261816">${eur(total)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const shopsSection = `
    <div style="margin-bottom:22px">
      <p style="font-size:11px;font-weight:700;color:#8e706b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Geschäfte Übersicht</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px">${shopCards}</div>
    </div>`;

  document.getElementById('panel-geschaefte').innerHTML = tableSection + dealsSection + shopsSection;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — KOMBIS
// ═══════════════════════════════════════════════════════════════

function renderKombisTab() {
  const low = getLowStockProducts();
  const { single, two, hasLow } = calculateCombinations();

  // ── Mini Dashboard ────────────────────────────────────────────
  const fmOpen = typeof FM_DATA !== 'undefined' ? FM_DATA.filter(x=>x.status==='offen').length : 0;
  const fmDringend = typeof FM_DATA !== 'undefined' ? FM_DATA.filter(x=>x.status==='offen'&&x.prioritaet==='dringend').length : 0;
  const { y, m } = typeof bizCurrentMonth === 'function' ? bizCurrentMonth() : { y: new Date().getFullYear(), m: new Date().getMonth()+1 };
  const monthStr = y + '-' + String(m).padStart(2,'0');
  const kassa = typeof bizGetKassa === 'function' ? bizGetKassa() : [];
  const monthRev = kassa.filter(e => e.date && e.date.startsWith(monthStr)).reduce((s,e)=>s+(e.gesamt||0),0);
  const monthNames = ['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

  // Find most critical product (lowest stock ratio)
  const criticalProduct = PRODUCTS.reduce((worst, p) => {
    const ratio = stockLevels[p.id] / p.minStock;
    if (!worst || ratio < (stockLevels[worst.id] / worst.minStock)) return p;
    return worst;
  }, null);
  const critPct = criticalProduct ? Math.min(100, Math.round((stockLevels[criticalProduct.id] / criticalProduct.minStock) * 100)) : 100;
  const mozzarella = PRODUCTS.find(p => p.id === 'mozzarella');
  const mozzStock = mozzarella ? stockLevels['mozzarella'] : null;
  const mozzPct = mozzarella ? Math.min(100, Math.round((mozzStock / mozzarella.minStock) * 100)) : null;

  const dashHtml = `
    <div class="bento-grid">
      <div class="bento-hero">
        <div style="font-size:11px;font-weight:700;color:#8e706b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Kritischstes Produkt</div>
        ${criticalProduct ? `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <span class="material-symbols-outlined" style="font-size:28px;color:#ba1a1a">warning</span>
            <div>
              <div style="font-size:20px;font-weight:800;color:#261816;font-family:'Plus Jakarta Sans',sans-serif">${criticalProduct.name}</div>
              <div style="font-size:12px;color:#8e706b">${stockLevels[criticalProduct.id].toLocaleString('de-DE')} / ${criticalProduct.minStock} ${criticalProduct.unit}</div>
            </div>
          </div>
          <div style="height:8px;background:#f0e8e6;border-radius:4px;overflow:hidden;margin-bottom:8px">
            <div style="height:100%;width:${critPct}%;background:${critPct < 40 ? '#dc2626' : critPct < 70 ? '#f59e0b' : '#16a34a'};border-radius:4px;transition:width .3s ease"></div>
          </div>
          <div style="font-size:12px;color:${critPct < 40 ? '#dc2626' : '#8e706b'};font-weight:600">${critPct}% vom Minimum</div>
        ` : `<div style="font-size:14px;color:#16a34a;font-weight:600">✅ Alle Bestände OK</div>`}
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid #f0e8e6;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div onclick="switchTab('fehlmaterial')" style="cursor:pointer">
            <div style="font-size:26px;font-weight:800;color:${low.length>0?'#dc2626':'#16a34a'};font-family:'Plus Jakarta Sans',sans-serif">${low.length}</div>
            <div style="font-size:11px;color:#8e706b;font-weight:500">Unter Minimum</div>
            <div style="font-size:11px;font-weight:700;color:${low.length>0?'#dc2626':'#16a34a'};margin-top:3px">${low.length>0?'🔴 Nachbestellen':'✅ Alles OK'}</div>
          </div>
          <div>
            <div style="font-size:26px;font-weight:800;color:#1565c0;font-family:'Plus Jakarta Sans',sans-serif">${PRODUCTS.length}</div>
            <div style="font-size:11px;color:#8e706b;font-weight:500">Produkte gesamt</div>
            <div style="font-size:11px;font-weight:700;color:#2e7d32;margin-top:3px">📦 ${PRODUCTS.length - low.length} im Soll</div>
          </div>
        </div>
      </div>
      <div class="bento-side">
        <div class="bento-small bento-small-yellow" onclick="void(0)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#f59e0b">water_drop</span>
            <span style="font-size:12px;font-weight:700;color:#5a403c">Mozzarella Status</span>
          </div>
          ${mozzarella && mozzPct !== null ? `
            <div style="font-size:22px;font-weight:800;color:${mozzPct<50?'#dc2626':'#f59e0b'};font-family:'Plus Jakarta Sans',sans-serif">${mozzStock} kg</div>
            <div style="height:5px;background:#fef3c7;border-radius:3px;overflow:hidden;margin:8px 0 4px">
              <div style="height:100%;width:${mozzPct}%;background:#f59e0b;border-radius:3px"></div>
            </div>
            <div style="font-size:11px;color:#8e706b">${mozzPct}% vom Min (${mozzarella.minStock} kg)</div>
          ` : `<div style="font-size:13px;color:#8e706b">Nicht gefunden</div>`}
        </div>
        <div class="bento-small bento-small-red" onclick="switchTab('fehlmaterial')" style="cursor:pointer">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#dc2626">error</span>
            <span style="font-size:12px;font-weight:700;color:#5a403c">Kritische Artikel</span>
          </div>
          <div style="font-size:22px;font-weight:800;color:#dc2626;font-family:'Plus Jakarta Sans',sans-serif">${low.length}</div>
          <div style="font-size:11px;color:#8e706b;margin-top:4px">${low.length>0 ? low.slice(0,2).map(p=>p.name).join(', ')+(low.length>2?'…':'') : 'Alle im grünen Bereich'}</div>
        </div>
        <div class="bento-small" style="border-left:4px solid #2e7d32">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#2e7d32">euro</span>
            <span style="font-size:12px;font-weight:700;color:#5a403c">Umsatz ${monthNames[m-1]}</span>
          </div>
          <div style="font-size:20px;font-weight:800;color:${monthRev>0?'#2e7d32':'#9ca3af'};font-family:'Plus Jakarta Sans',sans-serif">${monthRev>0?'€ '+Math.round(monthRev).toLocaleString('de-AT'):'—'}</div>
          <div style="font-size:11px;color:#8e706b;margin-top:4px">${monthRev>0?'aus Kassabuch':'Noch keine Daten'}</div>
        </div>
      </div>
    </div>`;

  if (!hasLow) {
    document.getElementById('panel-kombis').innerHTML = dashHtml + `
      <div style="text-align:center;padding:60px 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined filled" style="font-size:32px;color:#16a34a">check_circle</span>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#261816;margin-bottom:6px">Alle Bestände in Ordnung</h3>
        <p style="font-size:13px;color:#5a403c;max-width:340px;margin:0 auto;line-height:1.6">
          Sobald Produkte unter ihr Minimum fallen, erscheinen hier die günstigsten Einkaufskombinationen.
        </p>
      </div>`;
    return;
  }

  // Warning banner — compact single line
  let html = dashHtml + `
    <div style="background:#ffdad6;border-left:3px solid #ba1a1a;border-radius:6px;padding:8px 12px;margin-bottom:20px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="material-symbols-outlined" style="font-size:15px;color:#ba1a1a;flex-shrink:0">warning</span>
      <span style="font-size:12px;font-weight:700;color:#93000a;flex-shrink:0">${low.length} nachbestellen:</span>
      <span style="font-size:12px;color:#5a403c">${low.map(p => p.name).join(' · ')}</span>
    </div>`;

  // Best combo = first two-shop combo, or first single-shop if none
  const bestCombo = two.length > 0 ? two[0] : (single.length > 0 ? single[0] : null);
  const altCombos = two.length > 0 ? two.slice(1) : [];
  const singleCombos = single;

  // ── Empfohlene Kombination ───────────────────────────────────
  if (bestCombo) {
    html += `
      <div style="margin-bottom:22px">
        <p style="font-size:11px;font-weight:700;color:#610000;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">★ Empfohlene Kombination</p>
        ${renderFeaturedCombo(bestCombo)}
      </div>`;
  }

  // ── Alternative Kombinationen (2-col grid, collapsible) ──────
  if (altCombos.length > 0) {
    html += `
      <div style="margin-bottom:22px">
        <p style="font-size:11px;font-weight:700;color:#8e706b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Alternative Kombinationen (${altCombos.length})</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px">
          ${altCombos.map((c,i) => renderAltCombo(c, i+2)).join('')}
        </div>
      </div>`;
  }

  // ── Einzel-Geschäfte (3-col grid) ───────────────────────────
  if (singleCombos.length > 0) {
    html += `
      <div style="margin-bottom:22px">
        <p style="font-size:11px;font-weight:700;color:#8e706b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Einzel-Geschäfte (${singleCombos.length})</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px">
          ${singleCombos.map((c,i) => renderSingleCombo(c, i+1)).join('')}
        </div>
      </div>`;
  }

  document.getElementById('panel-kombis').innerHTML = html;
}

// ── Empfohlene Kombi: kompakte Karte, 2-spaltige Shop-Ansicht ──
function renderFeaturedCombo(combo) {
  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }
  const shopGroups = Object.values(byShop);

  const shopSections = shopGroups.map(group => {
    const initials = group.shop.name.slice(0,2).toUpperCase();
    const rows = group.items.map(item => `
      <div class="product-row">
        <div class="product-row-check" onclick="this.classList.toggle('checked')"></div>
        <div class="product-row-name">
          <strong>${item.product.name}</strong>
          <span>${item.product.category} · ${item.quantity} ${item.product.unit}</span>
        </div>
        <div class="product-row-price">
          <span class="qty">${eur(item.pricePerUnit)}/${item.product.unit}</span>
          <span class="total">${eur(item.totalCost)}</span>
        </div>
      </div>`).join('');

    return `
      <div style="margin-bottom:16px">
        <div class="shop-header-card">
          <div class="shop-icon-circle" style="background:${group.shop.color}">${initials}</div>
          <span style="font-size:14px;font-weight:700;color:#261816">${group.shop.name}</span>
          <span class="shop-item-badge">${group.items.length} Item${group.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div>${rows}</div>
        <div style="display:flex;justify-content:flex-end;padding:10px 16px;background:#fafafa;border-top:1px solid #f0e8e6">
          <span style="font-size:13px;color:#8e706b;font-weight:600;margin-right:8px">Subtotal ${group.shop.name}:</span>
          <span style="font-size:14px;font-weight:800;color:#610000">${eur(group.subtotal)}</span>
        </div>
      </div>`;
  }).join('');

  // Store combo data for floating bar
  window._featuredComboTotal = combo.totalCost;
  window._featuredComboId = combo.id;

  setTimeout(() => {
    const bar = document.getElementById('floating-checkout-bar');
    if (bar) {
      bar.classList.remove('bar-hidden');
      const totalEl = bar.querySelector('.floating-bar-total strong');
      if (totalEl) totalEl.textContent = eur(combo.totalCost);
    }
  }, 50);

  return `
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(139,0,0,0.08);border:1px solid #f0e8e6;position:relative">
      <span class="empfohlen-badge">★ EMPFOHLEN</span>
      <div style="padding:16px 16px 6px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-right:110px">
          ${combo.shops.map(s => `<span style="background:${s.color};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${s.name}</span>`).join('<span style="color:#c9b8b4;font-size:12px;margin:0 2px">+</span>')}
        </div>
      </div>
      <div style="padding:0 0 4px">${shopSections}</div>
      <div style="padding:14px 16px;border-top:1px solid #f0e8e6;display:flex;justify-content:space-between;align-items:center;background:#fafafa">
        <button onclick="printCombo('${combo.id}')"
          style="padding:8px 16px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:12px;font-weight:600;color:#5a403c;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"
          onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
          <span class="material-symbols-outlined" style="font-size:15px">print</span> Drucken
        </button>
        <div style="display:flex;align-items:baseline;gap:6px">
          <span style="font-size:13px;color:#8e706b;font-weight:600">Gesamt</span>
          <span style="font-size:26px;font-weight:800;color:#610000;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em">${eur(combo.totalCost)}</span>
        </div>
      </div>
    </div>`;
}

// ── Alternative Kombi: kompakt, aufklappbar ────────────────────
function renderAltCombo(combo, rank) {
  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }
  const shopGroups = Object.values(byShop);
  const detailId = 'altd-' + combo.id;

  const detailRows = shopGroups.map(group => {
    const rows = group.items.map(item => `
      <div style="display:flex;justify-content:space-between;align-items:center;height:36px;border-bottom:1px solid #f5f0ee">
        <span style="font-size:12px;font-weight:600;color:#261816;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px">${item.product.name}</span>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <span style="font-size:11px;color:#8e706b">${item.quantity}×</span>
          <span style="font-size:12px;font-weight:700;color:#261816">${eur(item.totalCost)}</span>
        </div>
      </div>`).join('');

    const shopHead = shopGroups.length > 1 ? `
      <div style="display:flex;justify-content:space-between;padding:5px 0 2px;border-bottom:2px solid ${group.shop.color}55">
        <span style="font-size:11px;font-weight:700;color:${group.shop.color}">${group.shop.name}</span>
        <span style="font-size:11px;font-weight:600;color:#5a403c">${eur(group.subtotal)}</span>
      </div>` : '';

    return `<div style="margin-bottom:6px">${shopHead}${rows}</div>`;
  }).join('');

  const shopBadges = combo.shops.map(s =>
    `<span style="background:${s.color};color:#fff;font-size:11px;font-weight:700;padding:1px 7px;border-radius:4px">${s.name}</span>`
  ).join('<span style="color:#8e706b;font-size:11px;margin:0 1px">+</span>');

  return `
    <div class="alt-combo-card" style="border-left:4px solid ${combo.shops[0]?.color || '#8B0000'}">
      <div style="padding:10px 14px;display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none"
           onclick="(function(el){var d=document.getElementById('${detailId}');var open=d.style.display!=='none';d.style.display=open?'none':'block';el.querySelector('.chev').style.transform=open?'rotate(0deg)':'rotate(180deg)';})(this)">
        <span style="font-size:11px;color:#8e706b;font-weight:700;flex-shrink:0">#${rank}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;flex:1;align-items:center">${shopBadges}</div>
        <button onclick="event.stopPropagation();printCombo('${combo.id}')"
          style="padding:4px 9px;border-radius:6px;border:1px solid #e3beb8;background:#fff;font-size:11px;color:#5a403c;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px;flex-shrink:0"
          onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
          <span class="material-symbols-outlined" style="font-size:13px">print</span>
        </button>
        <span style="font-size:16px;font-weight:800;color:#261816;letter-spacing:-.01em;flex-shrink:0">${eur(combo.totalCost)}</span>
        <span class="material-symbols-outlined chev" style="font-size:16px;color:#8e706b;transition:transform .2s;flex-shrink:0">expand_more</span>
      </div>
      <div id="${detailId}" style="display:none;padding:8px 12px 12px;border-top:1px solid #e3beb8;background:#fafafa">
        ${detailRows}
      </div>
    </div>`;
}

// ── Einzel-Geschäft: sehr kompakt, 3-spaltig ──────────────────
function renderSingleCombo(combo, rank) {
  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }
  const group = Object.values(byShop)[0];
  const detailId = 'sngd-' + combo.id;

  const detailRows = group.items.map(item => `
    <div style="display:flex;justify-content:space-between;align-items:center;height:34px;border-bottom:1px solid #f5f0ee">
      <span style="font-size:12px;font-weight:600;color:#261816;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:6px">${item.product.name}</span>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <span style="font-size:11px;color:#8e706b">${item.quantity}×</span>
        <span style="font-size:12px;font-weight:700;color:#261816">${eur(item.totalCost)}</span>
      </div>
    </div>`).join('');

  return `
    <div style="border-radius:10px;border:1px solid #e3beb8;overflow:hidden;background:#fff">
      <div style="padding:8px 10px;border-bottom:2px solid ${combo.shops[0].color};display:flex;align-items:center;gap:6px;cursor:pointer"
           onclick="(function(){var d=document.getElementById('${detailId}');d.style.display=d.style.display!=='none'?'none':'block';})()">
        <span style="font-size:13px;font-weight:700;color:${combo.shops[0].color};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${combo.shops[0].name}</span>
        <button onclick="event.stopPropagation();printCombo('${combo.id}')"
          style="padding:3px 6px;border-radius:5px;border:1px solid #e3beb8;background:#fff;cursor:pointer;display:flex;align-items:center;flex-shrink:0"
          onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
          <span class="material-symbols-outlined" style="font-size:12px;color:#5a403c">print</span>
        </button>
        <span style="font-size:15px;font-weight:800;color:#261816;flex-shrink:0">${eur(combo.totalCost)}</span>
      </div>
      <div id="${detailId}" style="display:none;padding:6px 10px 10px;background:#fafafa">
        ${detailRows}
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

function switchTab(tab) {
  const isBiz = tab === 'business';

  // ── panels ──
  ['produkte','geschaefte','kombis','angebote','einkaufsliste','suche','upload','verlauf','mitarbeiter','fehlmaterial','checkliste','business'].forEach(t => {
    const p = document.getElementById('panel-'+t);
    if (p) p.style.display = t === tab ? 'block' : 'none';
  });

  // ── desktop staff tabs ──
  document.querySelectorAll('#staff-tab-bar [data-nav-tab]').forEach(el => {
    el.classList.toggle('tab-active', el.dataset.navTab === tab);
  });

  // ── close mehr drawer ──
  if (typeof closeMehrDrawer === 'function') closeMehrDrawer();

  // ── mobile staff buttons ──
  document.querySelectorAll('[data-bottom-nav]').forEach(el => {
    el.classList.toggle('mob-active', el.dataset.bottomNav === tab);
  });

  // ── drawer nav items ──
  const drawerTabs = ['geschaefte','upload','verlauf','mitarbeiter','checkliste','business'];
  document.querySelectorAll('[data-drawer-nav]').forEach(el => {
    el.classList.toggle('mob-active', el.dataset.drawerNav === tab);
  });
  const mehrBtn = document.getElementById('mob-mehr-btn');
  if (mehrBtn) mehrBtn.classList.toggle('mob-active', drawerTabs.includes(tab) && tab !== 'business');

  // ── business button states ──
  const bizBtn    = document.getElementById('biz-header-btn');
  const mobBizBtn = document.getElementById('mob-biz-btn');
  if (bizBtn)    bizBtn.classList.toggle('active', isBiz);
  if (mobBizBtn) mobBizBtn.classList.toggle('mob-biz-active', isBiz);

  // ── dark mode / light mode ──
  document.body.classList.toggle('biz-mode', isBiz);
  document.body.style.backgroundColor = isBiz ? '' : '#fff8f6';

  // ── stats dashboard — hidden globally (dashboard is inside Kombis panel) ──
  const statsDash = document.getElementById('stats-dashboard');
  if (statsDash) statsDash.style.display = 'none';

  // ── floating bar — only visible in kombis tab ──
  const floatBar = document.getElementById('floating-checkout-bar');
  if (floatBar) floatBar.classList.add('bar-hidden');

  // ── footer time ──
  const ft = document.getElementById('footer-time');
  if (ft) ft.textContent = new Date().toLocaleTimeString('de-AT', {hour:'2-digit',minute:'2-digit'}) + ' Uhr';

  // ── render content ──
  if (tab === 'produkte')    renderProductsTab();
  if (tab === 'geschaefte')  renderShopsTab();
  if (tab === 'kombis')      renderKombisTab();
  if (tab === 'angebote')       renderAngeboteTab();
  if (tab === 'einkaufsliste')  renderEinkaufslisteTab();
  if (tab === 'suche')          renderSucheTab();
  if (tab === 'upload')      renderUploadTab();
  if (tab === 'verlauf')     renderVerlaufTab();
  if (tab === 'mitarbeiter')   renderMitarbeiterTab();
  if (tab === 'fehlmaterial') renderFehlmaterialTab();
  if (tab === 'checkliste')  renderChecklisteTab();
  if (isBiz) {
    const lockIcon    = document.getElementById('biz-lock-icon');
    const mobLockIcon = document.getElementById('mob-biz-lock');
    if (!bizIsAuth()) {
      renderBizLocked();
      if (lockIcon)    lockIcon.textContent = 'lock';
      if (mobLockIcon) mobLockIcon.textContent = 'lock';
    } else {
      renderBusinessTab();
      if (lockIcon)    lockIcon.textContent = 'lock_open';
      if (mobLockIcon) mobLockIcon.textContent = 'lock_open';
    }
  }
}

function renderSucheTab() {
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  const panel = document.getElementById('panel-suche');

  let inner = `
    <div class="suche-sticky-header">
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="position:relative;flex:1">
          <span class="material-symbols-outlined" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:20px;color:#5a403c;pointer-events:none">search</span>
          <input
            id="suche-input"
            type="text"
            placeholder="z.B. Cola, Mozzarella, Olivenöl …"
            value="${escHtml(SUCHE_STATE.query)}"
            ${SUCHE_STATE.loading ? 'disabled' : ''}
            onkeydown="if(event.key==='Enter') startSearch()"
            style="width:100%;padding:12px 14px 12px 44px;border:2px solid #e3beb8;border-radius:14px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;transition:border-color .15s;${SUCHE_STATE.loading?'opacity:.5;cursor:not-allowed':''}"
            onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"
          />
        </div>
        <button onclick="startSearch()" ${SUCHE_STATE.loading ? 'disabled' : ''}
          class="btn-checkout"
          style="${SUCHE_STATE.loading?'opacity:.6;cursor:not-allowed':''}">
          ${SUCHE_STATE.loading
            ? '<span class="spinner-sm"></span> Suche…'
            : '<span class="material-symbols-outlined" style="font-size:18px">search</span> Suchen'}
        </button>
      </div>
      <div class="filter-chip-row">
        <button class="filter-chip active" onclick="void(0)">🌐 Alle Shops</button>
        <button class="filter-chip" onclick="void(0)">🏪 Hofer</button>
        <button class="filter-chip" onclick="void(0)">🛒 Billa</button>
        <button class="filter-chip" onclick="void(0)">🌿 Spar</button>
        <button class="filter-chip" onclick="void(0)">🔵 Lidl</button>
        <button class="filter-chip" onclick="void(0)">🏭 Metro</button>
        <button class="filter-chip" onclick="void(0)">🥩 Etsan</button>
      </div>
    </div>
    <div class="deals-scroll-row">
      <div class="deal-scroll-card">
        <div style="font-size:10px;font-weight:700;color:#8B0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">marktguru.at</div>
        <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:2px">Live-Angebote</div>
        <div style="font-size:11px;color:#8e706b">Österreichische Händler</div>
      </div>
      <div class="deal-scroll-card">
        <div style="font-size:10px;font-weight:700;color:#8B0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">aktionsfinder.at</div>
        <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:2px">Aktuelle Aktionen</div>
        <div style="font-size:11px;color:#8e706b">Diese + nächste Woche</div>
      </div>
      <div class="deal-scroll-card">
        <div style="font-size:10px;font-weight:700;color:#8B0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">wogibtswas.at</div>
        <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:2px">Preisvergleich</div>
        <div style="font-size:11px;color:#8e706b">Beste Preise finden</div>
      </div>
    </div>`;

  if (!hasKey) {
    inner += `
      <div style="border:2px dashed #e3beb8;border-radius:16px;padding:20px 24px;margin-bottom:24px;background:#fff">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <span class="material-symbols-outlined" style="font-size:24px;color:#5a403c;margin-top:2px">key</span>
          <div>
            <p style="font-size:14px;font-weight:700;color:#261816;margin-bottom:8px">🔑 Bitte API Key einfügen um die Live-Suche zu nutzen</p>
            <p style="font-size:13px;color:#5a403c;line-height:1.7">
              Öffne <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">pizzaria.html</code> in einem Texteditor und trage deinen Anthropic API Key ganz oben ein:<br>
              <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">const ANTHROPIC_API_KEY = "sk-ant-...";</code><br>
              API Key erhältlich unter <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">console.anthropic.com</code> → API Keys.
            </p>
          </div>
        </div>
      </div>`;
  }

  if (SUCHE_STATE.error) {
    inner += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(SUCHE_STATE.error)}</p>
        </div>
      </div>`;
  }

  if (SUCHE_STATE.loading) {
    inner += `
      <div style="text-align:center;padding:64px 20px">
        <div class="spinner"></div>
        <p style="font-size:14px;color:#5a403c">Suche läuft …</p>
        <p id="loading-step-text" style="font-size:12px;color:#8d6562;margin-top:8px;font-style:italic">${escHtml(SUCHE_STATE.loadingStep)}</p>
      </div>`;
  } else if (SUCHE_STATE.results.length > 0) {
    if (SUCHE_STATE.fromCache) {
      inner += `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:10px 16px;margin-bottom:16px;gap:12px">
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#1b5e20">
            <span class="material-symbols-outlined" style="font-size:15px;color:#2e7d32">schedule</span>
            Live-Preise vom <strong>${SUCHE_STATE.cacheDate}</strong> &nbsp;·&nbsp; Cache noch max. 1 Std. gültig
          </div>
          <button onclick="refreshSucheSearch()" style="font-size:11px;font-weight:600;color:#1b5e20;background:#c8e6c9;border:1px solid #81c784;border-radius:8px;padding:4px 12px;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:13px">refresh</span>
            Aktualisieren
          </button>
        </div>`;
    } else if (SUCHE_STATE.results.length > 0) {
      inner += `
        <div style="display:flex;align-items:center;gap:8px;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:10px 16px;margin-bottom:16px;font-size:12px;color:#1b5e20">
          <span class="material-symbols-outlined" style="font-size:15px;color:#2e7d32">travel_explore</span>
          <strong>Live</strong> — Preise direkt von Supermarkt-Websites
        </div>`;
    }
    inner += renderSearchResults();
  } else if (SUCHE_STATE.query && !SUCHE_STATE.error) {
    inner += `
      <div style="text-align:center;padding:64px 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:#ffe9e6;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined" style="font-size:30px;color:#5a403c">search_off</span>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#261816;margin-bottom:8px">Keine Ergebnisse gefunden</h3>
        <p style="font-size:13px;color:#5a403c;max-width:360px;margin:0 auto 20px;line-height:1.6">
          Für <strong>"${escHtml(SUCHE_STATE.query)}"</strong> keine Preise gefunden. Möglicherweise liegt ein Verbindungsproblem vor.
        </p>
        <button onclick="clearAllSucheCache();startSearch()" style="padding:10px 20px;background:#610000;color:#fff;border:none;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:16px">refresh</span>Erneut suchen (Cache geleert)
        </button>
      </div>`;
  } else if (!hasKey) {
    // hint already shown above
  } else {
    inner += `
      <div style="text-align:center;padding:64px 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:#ffe9e6;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined" style="font-size:30px;color:#5a403c">shopping_cart</span>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#261816;margin-bottom:8px">Live-Preise suchen</h3>
        <p style="font-size:13px;color:#5a403c;max-width:360px;margin:0 auto;line-height:1.6">
          Gib ein Produkt ein und klicke auf <strong>Suchen</strong>.<br>
          Claude durchsucht marktguru.at, aktionsfinder.at und wogibtswas.at nach aktuellen und kommenden Angeboten bei österreichischen Händlern.
        </p>
      </div>`;
  }

  inner += renderSucheVerlauf();

  panel.innerHTML = inner;

  if (!SUCHE_STATE.loading) {
    const inp = document.getElementById('suche-input');
    if (inp) inp.focus();
  }
}

function renderSearchResults() {
  const { results, query } = SUCHE_STATE;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <span style="font-size:14px;color:#5a403c">
        <span style="font-weight:700;color:#261816">${results.length} Angebot${results.length !== 1 ? 'e' : ''}</span>
        für „${escHtml(query)}"
      </span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px">`;

  results.forEach((r, idx) => {
    const color = shopColor(r.shop);
    const savings = (r.originalPrice && r.price && r.originalPrice > r.price)
      ? Math.round((1 - r.price / r.originalPrice) * 100)
      : null;

    let validHtml = '';
    if (r.validUntil) {
      const until = new Date(r.validUntil);
      const diffDays = Math.round((until - today) / 86400000);
      let textColor = '#5a403c', label = '';
      if (diffDays < 0) {
        textColor = '#ba1a1a'; label = `Abgelaufen (${fmtDate(r.validUntil)})`;
      } else if (diffDays === 0) {
        textColor = '#e67e22'; label = 'Heute letzter Tag';
      } else if (diffDays <= 3) {
        textColor = '#e67e22'; label = `Noch ${diffDays} Tag${diffDays !== 1 ? 'e' : ''} (bis ${fmtDate(r.validUntil)})`;
      } else {
        label = `Gültig bis ${fmtDate(r.validUntil)}`;
      }
      if (r.validFrom && r.validFrom > new Date().toISOString().slice(0, 10)) {
        label = `Ab ${fmtDate(r.validFrom)} bis ${fmtDate(r.validUntil)}`;
        textColor = '#5a403c';
      }
      validHtml = `<div style="display:flex;align-items:center;gap:4px;font-size:12px;color:${textColor}">
        <span class="material-symbols-outlined" style="font-size:13px">calendar_today</span>
        ${escHtml(label)}
      </div>`;
    }

    const isAdded = SUCHE_STATE.addedIds.has(idx);

    html += `
      <div class="result-card-new">
        <div class="result-card-top">
          <div class="result-card-img">🛒</div>
          <div style="flex:1;min-width:0">
            <span class="result-shop-badge" style="background:${color}">${escHtml(r.shop)}</span>
            <p style="font-size:14px;font-weight:700;color:#261816;margin:0 0 2px;line-height:1.3">${escHtml(r.name)}</p>
            ${r.brand ? `<p style="font-size:11px;color:#8e706b;margin:0 0 6px">${escHtml(r.brand)}</p>` : ''}
            <div style="display:flex;align-items:baseline;gap:7px;flex-wrap:wrap">
              <span style="font-size:22px;font-weight:800;color:#610000;font-family:'Plus Jakarta Sans',sans-serif">${r.price != null ? eur(r.price) : '—'}</span>
              ${r.originalPrice && r.originalPrice > r.price ? `<span style="font-size:12px;color:#8d6562;text-decoration:line-through">${eur(r.originalPrice)}</span>` : ''}
              ${savings ? `<span style="font-size:11px;font-weight:700;background:#ffdad6;color:#610000;padding:2px 8px;border-radius:10px">−${savings}%</span>` : ''}
            </div>
            ${r.unit ? `<p style="font-size:11px;color:#8e706b;margin:2px 0 0">pro ${escHtml(r.unit)}</p>` : ''}
            ${r.source ? `<p style="font-size:10px;color:#8d6562;margin:4px 0 0">via ${escHtml(r.source)}</p>` : ''}
            ${validHtml}
          </div>
        </div>
        <div style="border-top:1px solid #f0e8e6;padding:12px 16px">
          <button
            class="add-btn ${isAdded ? 'added' : ''}"
            onclick="addResultToInventory(${idx}, this)"
            ${isAdded ? 'disabled' : ''}
            style="width:100%;padding:9px;border-radius:12px;border:1.5px solid ${isAdded?'#c7c9f9':'#c0eda6'};background:${isAdded?'#dfe0ff':'#c0eda6'};color:${isAdded?'#0d2ccc':'#0c2000'};font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s">
            ${isAdded
              ? '<span class="material-symbols-outlined" style="font-size:15px">check</span> Hinzugefügt'
              : '<span class="material-symbols-outlined" style="font-size:15px">add</span> Zu Bestand hinzufügen'}
          </button>
        </div>
      </div>`;
  });

  html += '</div>';
  return html;
}

function addResultToInventory(idx, btn) {
  const r = SUCHE_STATE.results[idx];
  if (!r) return;

  // Generate a stable id from the name
  const id = 'search-' + r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + idx;

  // Check if already in PRODUCTS
  const existing = PRODUCTS.find(p => p.id === id);
  if (!existing) {
    const newProduct = {
      id,
      name: r.name + (r.brand ? ` (${r.brand})` : ''),
      category: 'Suche',
      unit: r.unit || 'Stk',
      currentStock: 0,
      minStock: 1,
      orderQuantity: 1,
    };
    PRODUCTS.push(newProduct);
    stockLevels[id] = 0;
    updateHeaderBadge();
  }

  addHistoryEntry({
    produktName: r.name + (r.brand ? ` (${r.brand})` : ''),
    produktId:   id,
    menge:       1,
    einheit:     r.unit  || 'Stk',
    preis:       r.price || null,
    shopName:    r.shop  || null,
    shopId:      null,
    quelle:      'suche',
  });

  SUCHE_STATE.addedIds.add(idx);

  // Update button in-place without full re-render
  btn.classList.add('added', 'adding');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px">check</span> Hinzugefügt';
  btn.classList.remove('adding');
}

// ═══════════════════════════════════════════════════════════════
// SUCHE TAB — Claude API Search
// ═══════════════════════════════════════════════════════════════

function updateLoadingStep(text) {
  SUCHE_STATE.loadingStep = text;
  const el = document.getElementById('loading-step-text');
  if (el) el.textContent = text;
}

// Server-Verfügbarkeit: einmal pro 5 Minuten prüfen
let _serverCheck = { available: null, at: 0 };
async function isLocalServerAvailable() {
  if (Date.now() - _serverCheck.at < 5 * 60 * 1000 && _serverCheck.available !== null) {
    return _serverCheck.available;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch('http://localhost:3001/api/health', { signal: ctrl.signal });
    clearTimeout(t);
    _serverCheck = { available: r.ok, at: Date.now() };
    return r.ok;
  } catch (_) {
    _serverCheck = { available: false, at: Date.now() };
    return false;
  }
}

// Lokalen Preisserver abfragen
async function searchViaLocalServer(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(
      `http://localhost:3001/api/search?q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    if (!resp.ok) throw new Error('Server Fehler ' + resp.status);
    const data = await resp.json();
    if (Array.isArray(data)) return { items: data, notice: null };
    if (data && Array.isArray(data.items)) return data;
    throw new Error('Ungültige Antwort');
  } finally {
    clearTimeout(timer);
  }
}

async function startSearch() {
  const input = document.getElementById('suche-input');
  const query = (input ? input.value : '').trim();
  if (!query) return;

  // Cache überspringen wenn lokaler Server läuft (damit nie alte Claude-Daten gezeigt werden)
  const serverRunning = await isLocalServerAvailable();
  const cached = serverRunning ? null : getSucheCache(query);
  if (cached) {
    SUCHE_STATE.loading = false;
    SUCHE_STATE.error = null;
    SUCHE_STATE.results = cached.results;
    SUCHE_STATE.query = cached.query;
    SUCHE_STATE.addedIds = new Set();
    SUCHE_STATE.fromCache = true;
    SUCHE_STATE.cacheDate = cached.date;
    SUCHE_STATE.loadingStep = '';
    renderSucheTab();
    return;
  }

  SUCHE_STATE.loading = true;
  SUCHE_STATE.error = null;
  SUCHE_STATE.results = [];
  SUCHE_STATE.query = query;
  SUCHE_STATE.addedIds = new Set();
  SUCHE_STATE.fromCache = false;
  SUCHE_STATE.cacheDate = null;
  SUCHE_STATE.loadingStep = 'Verbinde mit Supermärkten …';
  renderSucheTab();

  try {
    let results = [];

    // ── Schritt 1: Lokaler Preisserver (echte Live-Preise) ──
    try {
      updateLoadingStep('Suche bei Spar, Billa, Hofer, Lidl … ');
      const serverResp = await searchViaLocalServer(query);
      results = serverResp.items || [];
      if (serverResp.notice) {
        // Billa/Hofer/Lidl noch nicht geladen — Info merken
        SUCHE_STATE._serverNotice = serverResp.notice;
      } else {
        SUCHE_STATE._serverNotice = null;
      }
      console.log('✅ Lokaler Server:', results.length, 'Ergebnisse');
    } catch (localErr) {
      // Server nicht gestartet → AI als Fallback
      SUCHE_STATE._serverNotice = null;
      const provider = localStorage.getItem('pizzeria_ai_provider') || 'claude';
      const hasGemini = typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY;
      const hasClaude = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
      if (!hasGemini && !hasClaude) throw new Error('Kein API Key und kein lokaler Server. Bitte start-preisserver.bat starten.');
      if (provider === 'gemini' && hasGemini) {
        console.log('ℹ️ Lokaler Server nicht verfügbar, verwende Gemini AI …');
        updateLoadingStep('Suche via Gemini AI …');
        results = await searchViaGeminiAPI(query);
      } else {
        console.log('ℹ️ Lokaler Server nicht verfügbar, verwende Claude AI …');
        updateLoadingStep('Suche via AI (start-preisserver.bat für echte Preise starten) …');
        results = await searchViaClaudeAPI(query);
      }
    }

    SUCHE_STATE.results = results;
    SUCHE_STATE.error = null;
    if (results.length > 0) setSucheCache(query, results);
  } catch (err) {
    SUCHE_STATE.error = err.message || String(err);
    SUCHE_STATE.results = [];
  } finally {
    SUCHE_STATE.loading = false;
    SUCHE_STATE.loadingStep = '';
    renderSucheTab();
  }
}

async function searchViaClaudeAPI(query) {
  const now   = new Date();
  const today = now.toISOString().slice(0, 10);

  // ── Schritt 1: Live-Suche mit erzwungenem web_search Tool ──
  updateLoadingStep('Suche auf aktionsfinder.at & marktguru.at …');

  // Suchquery-Stil statt URL-Navigation (web_search kann keine dynamischen SPAs lesen)
  const webPrompt =
    `Suche nach dem aktuellen Preis von "${query}" bei österreichischen Supermärkten und Discountern. ` +
    `Verwende aktionsfinder.at, marktguru.at und wogibtswas.at als Quellen. ` +
    `Datum heute: ${today}. ` +
    `Wichtig: Gib NUR Preise zurück, die du tatsächlich in den Suchergebnissen gefunden hast. ` +
    `KEINE Schätzungen, KEINE Preise aus deinem Training. ` +
    `Wenn du für einen Shop keinen echten Preis findest, lass ihn weg. ` +
    `Antworte AUSSCHLIESSLICH mit JSON-Array (kein Text davor/danach):\n` +
    `[{"name":"${query} 250ml 4er Pack","brand":"Red Bull","shop":"Penny","price":0.95,` +
    `"originalPrice":1.29,"unit":"Pack","validFrom":"${today}","validUntil":"","source":"aktionsfinder.at"}]`;

  let resp = await fetch('https://api.anthropic.com/v1/messages', {
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
      tool_choice: { type: 'any' },
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: 'Du bist ein Preisvergleichs-Assistent für österreichische Supermärkte. ' +
              'Du MUSST immer zuerst das web_search Tool verwenden, bevor du antwortest. ' +
              'Antworte am Ende NUR mit einem JSON-Array — kein Text, kein Markdown. ' +
              'Wenn du keine echten Preise findest: gib [] zurück.',
      messages: [{ role: 'user', content: webPrompt }],
    }),
  });

  // ── Schritt 2: Fallback ohne tool_choice (bei 400/529) ──
  if (!resp.ok) {
    updateLoadingStep('Alternative Suche läuft …');
    resp = await fetch('https://api.anthropic.com/v1/messages', {
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
        system: 'Antworte NUR mit JSON-Array. Kein Text, kein Markdown. Nur echte gesuchte Preise.',
        messages: [{ role: 'user', content: webPrompt }],
      }),
    });
  }

  if (!resp.ok) {
    let errMsg = 'HTTP ' + resp.status;
    try { const e = await resp.json(); errMsg = e?.error?.message || errMsg; } catch (_) {}
    if (resp.status === 401) throw new Error('Ungültiger API Key (401). Bitte API Key prüfen.');
    if (resp.status === 429) throw new Error('Rate Limit erreicht (429). Kurz warten und erneut versuchen.');
    throw new Error(errMsg);
  }

  const data = await resp.json();
  updateLoadingStep('Preise werden verarbeitet …');

  // ── Schritt 3: JSON aus allen Text-Blöcken extrahieren ──
  const textBlocks = (data.content || []).filter(function(b) { return b.type === 'text'; });
  // Von hinten suchen — letzter Text-Block hat das finale JSON
  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const parsed = parseResultsJSON(textBlocks[i].text);
    if (parsed.length > 0) return parsed;
  }

  // ── Fallback: Kein JSON gefunden — zeige Debug-Info ──
  console.warn('Suche: Kein JSON in Response. stop_reason:', data.stop_reason,
    '| Blöcke:', (data.content||[]).map(function(b){ return b.type; }));
  return [];
}

function parseResultsJSON(text) {
  if (!text || !text.trim()) return [];

  // Try direct parse
  try { return JSON.parse(text.trim()); } catch (_) {}

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {}
  }

  // Find first JSON array
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch (_) {}
  }

  // Empty result if nothing parseable
  return [];
}

// ═══════════════════════════════════════════════════════════════
// SUCHE CACHE
// ═══════════════════════════════════════════════════════════════

function getSucheCache(query) {
  try {
    const all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}');
    const key = query.toLowerCase().trim();
    const entry = all[key];
    if (!entry) return null;
    // Live-Preise: Cache nur 1 Stunde gültig (für aktuelle Angebote)
    const ageHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
    if (ageHours > 1) {
      delete all[key];
      localStorage.setItem('pizzeria_suche_cache', JSON.stringify(all));
      return null;
    }
    return entry;
  } catch (_) { return null; }
}

async function searchViaGeminiAPI(query) {
  const today = new Date().toISOString().slice(0, 10);
  const prompt =
    `Suche nach dem aktuellen Preis von "${query}" bei österreichischen Supermärkten und Discountern. ` +
    `Quellen: aktionsfinder.at, marktguru.at, wogibtswas.at. Datum heute: ${today}. ` +
    `Gib NUR Preise zurück, die du tatsächlich gefunden hast. Keine Schätzungen. ` +
    `Antworte AUSSCHLIESSLICH mit JSON-Array (kein Text davor/danach):\n` +
    `[{"name":"${query} 250ml 4er Pack","brand":"Red Bull","shop":"Penny","price":0.95,` +
    `"originalPrice":1.29,"unit":"Pack","validFrom":"${today}","validUntil":"","source":"aktionsfinder.at"}]`;

  const resp = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 8192 }
      })
    }
  );
  if (!resp.ok) {
    let errMsg = 'Gemini HTTP ' + resp.status;
    try { const e = await resp.json(); errMsg = e?.error?.message || errMsg; } catch(_) {}
    throw new Error(errMsg);
  }
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || '';
  if (!text) throw new Error('Keine Antwort von Gemini erhalten.');
  let arr = [];
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenceMatch ? fenceMatch[1] : text.match(/\[[\s\S]*\]/)?.[0] || '[]';
    arr = JSON.parse(raw);
  } catch(_) {}
  return Array.isArray(arr) ? arr : [];
}

function setSucheCache(query, results) {
  try {
    const all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}');
    const now = new Date();
    all[query.toLowerCase().trim()] = {
      query,
      results,
      timestamp: Date.now(),
      date: now.toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric' }) +
            ' ' + now.toLocaleTimeString('de-AT', { hour:'2-digit', minute:'2-digit' }) + ' Uhr',
    };
    localStorage.setItem('pizzeria_suche_cache', JSON.stringify(all));
  } catch (_) {}
}

function deleteSucheCache(query) {
  try {
    const all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}');
    delete all[query.toLowerCase().trim()];
    localStorage.setItem('pizzeria_suche_cache', JSON.stringify(all));
    if (SUCHE_STATE.fromCache && SUCHE_STATE.query.toLowerCase() === query.toLowerCase()) {
      SUCHE_STATE.results = [];
      SUCHE_STATE.query = '';
      SUCHE_STATE.fromCache = false;
    }
    renderSucheTab();
  } catch (_) {}
}

function clearAllSucheCache() {
  try { localStorage.removeItem('pizzeria_suche_cache'); } catch (_) {}
  SUCHE_STATE.results = [];
  SUCHE_STATE.query = '';
  SUCHE_STATE.fromCache = false;
  renderSucheTab();
}

function loadFromSucheCache(query) {
  const cached = getSucheCache(query);
  if (!cached) return;
  SUCHE_STATE.loading = false;
  SUCHE_STATE.error = null;
  SUCHE_STATE.results = cached.results;
  SUCHE_STATE.query = cached.query;
  SUCHE_STATE.addedIds = new Set();
  SUCHE_STATE.fromCache = true;
  SUCHE_STATE.cacheDate = cached.date;
  renderSucheTab();
}

function refreshSucheSearch() {
  const query = SUCHE_STATE.query;
  if (!query) return;
  deleteSucheCache(query);
  const input = document.getElementById('suche-input');
  if (input) input.value = query;
  startSearch();
}

function renderSucheVerlauf() {
  let all = {};
  try { all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}'); } catch (_) {}
  const entries = Object.values(all).sort((a, b) => b.timestamp - a.timestamp);
  if (entries.length === 0) return '';

  let html = `
    <div style="margin-top:36px;padding-top:24px;border-top:1px solid #e3beb8">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <h3 style="font-size:15px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin:0">
          <span class="material-symbols-outlined" style="font-size:18px;color:#610000">history</span>
          Gespeicherter Verlauf
          <span style="background:#610000;color:#fff;border-radius:20px;padding:2px 8px;font-size:11px;font-weight:700">${entries.length}</span>
        </h3>
        <button onclick="clearAllSucheCache()" style="font-size:11px;color:#5a403c;background:none;border:1px solid #e3beb8;cursor:pointer;display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px">
          <span class="material-symbols-outlined" style="font-size:13px">delete_sweep</span>
          Alle löschen
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">`;

  for (const e of entries) {
    const ageDays = Math.floor((Date.now() - e.timestamp) / (1000 * 60 * 60 * 24));
    const ageText = ageDays === 0 ? 'Heute' : ageDays === 1 ? 'Gestern' : `vor ${ageDays} Tagen`;
    const isActive = SUCHE_STATE.fromCache && SUCHE_STATE.query.toLowerCase() === e.query.toLowerCase();
    const safeQ = e.query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    html += `
      <div onclick="loadFromSucheCache('${safeQ}')"
           style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:${isActive ? '#fff0ee' : '#fff'};border:1px solid ${isActive ? '#b52619' : '#e3beb8'};border-radius:12px;cursor:pointer;transition:background .15s"
           onmouseover="if(!${isActive})this.style.background='#fff8f6'" onmouseout="if(!${isActive})this.style.background='#fff'">
        <span class="material-symbols-outlined" style="font-size:18px;color:${isActive ? '#610000' : '#8d6562'};flex-shrink:0">search</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(e.query)}</div>
          <div style="font-size:11px;color:#8d6562;margin-top:2px">${e.results.length} Ergebnisse · ${ageText} · ${e.date}</div>
        </div>
        ${isActive ? '<span style="font-size:10px;font-weight:700;color:#610000;background:#ffdad6;padding:2px 8px;border-radius:20px;white-space:nowrap;border:1px solid #b52619">Aktiv</span>' : ''}
        <button onclick="event.stopPropagation();deleteSucheCache('${safeQ}')"
                style="background:none;border:none;cursor:pointer;padding:4px;color:#8d6562;flex-shrink:0;border-radius:6px;line-height:0"
                title="Löschen">
          <span class="material-symbols-outlined" style="font-size:16px">close</span>
        </button>
      </div>`;
  }

  html += `</div></div>`;
  return html;
}

// ═══════════════════════════════════════════════════════════════
// PRINT COMBO
// ═══════════════════════════════════════════════════════════════

function printCombo(comboId) {
  const { single, two } = calculateCombinations();
  const combo = [...two, ...single].find(c => c.id === comboId);
  if (!combo) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }

  let shopTables = '';
  for (const group of Object.values(byShop)) {
    const rows = group.items.map((item, ri) => {
      const isLow = stockLevels[item.product.id] < item.product.minStock;
      return `<tr style="background:${isLow ? '#ffdad6' : ri%2===0 ? '#fff' : '#fafafa'}">
        <td style="padding:9px 10px;text-align:center;font-size:18px">☐</td>
        <td style="padding:9px 12px;font-weight:${isLow?'700':'500'};color:${isLow?'#cc0000':'#1a1a1a'}">${item.product.name}${isLow?' ⚠️':''}</td>
        <td style="padding:9px 10px;text-align:center;font-size:13px">${(stockLevels[item.product.id]||0)} ${item.product.unit}</td>
        <td style="padding:9px 10px;text-align:center;font-size:14px;font-weight:700">${item.quantity} ${item.product.unit}</td>
        <td style="padding:9px 10px;text-align:right;font-size:13px">${eur(item.pricePerUnit)}/${item.product.unit}</td>
        <td style="padding:9px 10px;text-align:right;font-size:14px;font-weight:700">${eur(item.totalCost)}</td>
      </tr>`;
    }).join('');

    shopTables += `
      <div style="margin-bottom:28px;page-break-inside:avoid">
        <div style="background:${group.shop.color};color:white;padding:10px 16px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:17px;font-weight:700">${group.shop.name}</span>
          <span style="font-size:12px;opacity:.85">${group.shop.type}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;overflow:hidden">
          <thead>
            <tr style="background:#f5f5f5;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666">
              <th style="padding:7px 10px;width:36px">✓</th>
              <th style="padding:7px 12px;text-align:left">Produkt</th>
              <th style="padding:7px 10px">Bestand</th>
              <th style="padding:7px 10px">Kaufen</th>
              <th style="padding:7px 10px;text-align:right">Preis/E</th>
              <th style="padding:7px 10px;text-align:right">Gesamt</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f0f0f0;font-weight:700;border-top:2px solid #ddd">
              <td colspan="5" style="padding:9px 12px;text-align:right;font-size:13px">Summe ${group.shop.name}:</td>
              <td style="padding:9px 10px;text-align:right;font-size:15px">${eur(group.subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  }

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<title>Einkaufsliste ${dateStr}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color:#1a1a1a; }
  @media print { body{padding:0;max-width:100%} button{display:none!important} @page{margin:12mm} }
  table { page-break-inside: auto; } tr { page-break-inside: avoid; }
</style></head><body>
  <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #610000">
    <span style="font-size:42px">🍕</span>
    <div style="flex:1">
      <h1 style="font-size:22px;font-weight:700;color:#610000;margin:0 0 4px">Pizzeria Einkaufsliste</h1>
      <p style="color:#666;margin:0;font-size:13px">${dateStr}</p>
    </div>
    <div style="text-align:right">
      <div style="font-size:26px;font-weight:700;color:#610000">${eur(combo.totalCost)}</div>
      <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.08em">Gesamt</div>
    </div>
  </div>
  ${shopTables}
  <div style="border-top:2px solid #610000;padding-top:16px;margin-top:16px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="font-size:11px;color:#888;line-height:1.6">
      ⚠️ Metro / Transgourmet: Gewerbeschein mitbringen!<br>
      Erstellt: ${now.toLocaleString('de-DE')}
    </div>
    <div style="font-size:20px;font-weight:700">Gesamt: ${eur(combo.totalCost)}</div>
  </div>
  <div style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="padding:12px 36px;background:#610000;color:white;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer">🖨️ Drucken</button>
  </div>
</body></html>`;

  const win = window.open('', '_blank', 'width=860,height=700');
  if (!win) { alert('Popup blockiert! Bitte Popup-Blocker deaktivieren.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ═══════════════════════════════════════════════════════════════
// VERLAUF — Helpers (Legacy — aktive Version in panels-b.js)
// ═══════════════════════════════════════════════════════════════

function calcWeeklyConsumption() {
  if (HISTORY.length === 0) return [];
  const now = new Date();
  const fourWeeksAgo = new Date(now - 28 * 86400000);
  const twoWeeksAgo  = new Date(now - 14 * 86400000);
  const recent = HISTORY.filter(e => e.menge != null && new Date(e.datum + 'T00:00:00') >= fourWeeksAgo);

  const byProduct = {};
  recent.forEach(e => {
    if (!byProduct[e.produktName]) byProduct[e.produktName] = { name: e.produktName, einheit: e.einheit, entries: [] };
    byProduct[e.produktName].entries.push(e);
  });

  return Object.values(byProduct).map(p => {
    const total = p.entries.reduce((s, e) => s + (e.menge || 0), 0);
    const perWeek = Math.round((total / 4) * 10) / 10;

    const recent2 = p.entries.filter(e => new Date(e.datum + 'T00:00:00') >= twoWeeksAgo);
    const older2  = p.entries.filter(e => new Date(e.datum + 'T00:00:00') <  twoWeeksAgo);
    const rSum = recent2.reduce((s, e) => s + (e.menge || 0), 0) / 2;
    const oSum = older2.reduce( (s, e) => s + (e.menge || 0), 0) / 2;
    let trend = '→';
    if (oSum > 0) { const r = rSum / oSum; if (r > 1.15) trend = '↑'; else if (r < 0.85) trend = '↓'; }

    let prognose = null;
    const prod = PRODUCTS.find(p2 => p2.name === p.name || p2.id === p.entries[0]?.produktId);
    if (prod && perWeek > 0) {
      const daysLeft = (stockLevels[prod.id] || 0) / (perWeek / 7);
      prognose = Math.round(daysLeft);
    }

    return { name: p.name, einheit: p.einheit, perWeek, trend, prognose };
  }).filter(w => w.perWeek > 0).sort((a, b) => b.perWeek - a.perWeek);
}

function calcPriceTrends() {
  const now = new Date();
  const tM = now.getMonth() + 1, tY = now.getFullYear();
  const pM = tM === 1 ? 12 : tM - 1, pY = tM === 1 ? tY - 1 : tY;
  const tKey = `${tY}-${String(tM).padStart(2,'0')}`;
  const pKey = `${pY}-${String(pM).padStart(2,'0')}`;

  const byProduct = {};
  HISTORY.filter(e => e.preis != null && e.preis > 0).forEach(e => {
    if (!byProduct[e.produktName]) byProduct[e.produktName] = { name: e.produktName, all: [], thisM: [], prevM: [] };
    byProduct[e.produktName].all.push(e.preis);
    if (e.datum.startsWith(tKey)) byProduct[e.produktName].thisM.push(e.preis);
    if (e.datum.startsWith(pKey)) byProduct[e.produktName].prevM.push(e.preis);
  });

  const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  return Object.values(byProduct)
    .map(p => ({
      name:       p.name,
      currentAvg: avg(p.thisM),
      lastAvg:    avg(p.prevM),
      minEver:    Math.min(...p.all),
      diff:       (avg(p.thisM) != null && avg(p.prevM) != null) ? avg(p.thisM) - avg(p.prevM) : null,
    }))
    .filter(p => p.currentAvg != null || p.lastAvg != null)
    .sort((a, b) => (b.currentAvg || 0) - (a.currentAvg || 0));
}

function exportMonthAsText() {
  const now = new Date();
  const mKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthName = now.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
  const entries = HISTORY.filter(e => e.datum.startsWith(mKey));
  const total = entries.reduce((s, e) => s + (e.preis != null && e.menge != null ? e.preis * e.menge : 0), 0);

  let text = `🍕 Pizzeria Einkauf — ${monthName}\n`;
  text += `${'═'.repeat(34)}\n`;
  text += `Gesamt: ${total.toLocaleString('de-DE', {style:'currency',currency:'EUR'})}\n\n`;

  const byShop = {};
  entries.forEach(e => {
    const key = e.shopName || 'Kein Geschäft';
    if (!byShop[key]) byShop[key] = [];
    byShop[key].push(e);
  });

  Object.entries(byShop).forEach(([shop, es]) => {
    const shopTotal = es.reduce((s, e) => s + (e.preis != null && e.menge != null ? e.preis * e.menge : 0), 0);
    text += `📦 ${shop}: ${shopTotal.toLocaleString('de-DE',{style:'currency',currency:'EUR'})}\n`;
    es.forEach(e => {
      text += `  • ${e.produktName}: ${e.menge != null ? e.menge : ''}${e.einheit || ''} × ${e.preis != null ? e.preis.toLocaleString('de-DE',{style:'currency',currency:'EUR'}) : '—'}\n`;
    });
    text += '\n';
  });

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => alert('Monatsbericht in Zwischenablage kopiert! ✓')).catch(() => prompt('Text kopieren:', text));
  } else {
    prompt('Text kopieren:', text);
  }
}

// ═══════════════════════════════════════════════════════════════
// VERLAUF TAB — Render
// ═══════════════════════════════════════════════════════════════

function importUMTradeRechnung93722() {
  const items = [
    { n:'Pizzablock EXPORT 5kg',                  m:14.885, e:'kg',    p:4.99  },
    { n:'Salami geschnitten 65cm ca. 1kg',         m:4.100,  e:'kg',    p:6.19  },
    { n:'Gastro Bacon Hochreiter geschnitten 1kg', m:2.994,  e:'kg',    p:8.99  },
    { n:'Goldsteig Mozzarella Stange 45% FIT 1kg', m:2,      e:'Pkg',   p:6.99  },
    { n:'SARAY Cheddar Scheiben 1000g',            m:1,      e:'Pkg',   p:8.99  },
    { n:'BL Kartoffelsalat 10kg Wienerart',        m:1,      e:'Kübel', p:30.59 },
    { n:'Debic Vanillesauce 2L',                   m:1,      e:'Fl.',   p:8.19  },
    { n:'Brajlovic Cevapcici 800g TK',             m:3,      e:'Pkg',   p:9.99  },
    { n:'Döner Kebap Geschnitten 1kg',             m:3,      e:'Pkg',   p:8.99  },
    { n:'Hühnerbrustfilet ca. 1kg TK',            m:10,     e:'kg',    p:6.09  },
    { n:'Giant XL Hamburger Brot 16 Stk TK',       m:2,      e:'Ktn',   p:8.99  },
    { n:'OBA Kombi Böreklik Weiß 40% 4kg',         m:1,      e:'Ktn',   p:17.99 },
    { n:'Aviko Potato Wedges Gewürzt 2,5kg TK',    m:4,      e:'Pkg',   p:4.985 },
    { n:'Aviko Pommes Kebab 9,5mm 2,5kg TK',       m:4,      e:'Pkg',   p:4.735 },
    { n:'Ardo Karfiol/Blumenkohl 2,5kg TK',        m:1,      e:'Pkg',   p:4.24  },
    { n:'Ardo Markerbsen 2,5kg TK',                m:1,      e:'Pkg',   p:4.74  },
    { n:'Develey Hamburger Sauce 875ml',            m:3,      e:'Fl.',   p:4.69  },
    { n:'Adria Artischocken Herzen 2650ml',         m:1,      e:'Dosen', p:8.79  },
    { n:'Mahmood Basmatie Reis 4,5kg',             m:1,      e:'Stk',   p:14.90 },
    { n:'Senna Sauce Tartare Port. 80x25g',        m:1,      e:'Ktn',   p:10.99 },
    { n:'Senna Ketchup Sauce Port. 100x20g',       m:1,      e:'Ktn',   p:8.99  },
    { n:'Senna Mayonnaise 50% Port. 100x15g',      m:1,      e:'Ktn',   p:8.99  },
    { n:'Fuzetea Zitrone 12x0,5L Pet',             m:1,      e:'Tray',  p:6.65  },
    { n:'Fuzetea Pfirsich 12x0,5L Pet',            m:1,      e:'Tray',  p:6.65  },
    { n:'Campino Pizza Sauce 5/1',                 m:3,      e:'Dosen', p:6.49  },
    { n:'Adria Thunfisch in Öl 1705g',             m:6,      e:'Dosen', p:8.59  },
    { n:'Piacelli Gnocchi 1000g',                  m:6,      e:'Pkg',   p:2.49  },
    { n:'Barilla Spaghetti 5kg No.5',              m:3,      e:'Pkg',   p:7.59  },
    { n:'Manner Eierbiskotten 2,4kg Gastro',       m:1,      e:'Ktn',   p:19.99 },
    { n:'Champignon mittel 3kg Frisch',            m:1,      e:'kiste', p:9.19  },
  ];
  for (const it of items) {
    addHistoryEntry({ datum:'2026-03-25', produktName:it.n, menge:it.m, einheit:it.e, preis:it.p, shopName:'UM Trade', shopId:'umtrade', quelle:'rechnung' });
  }
  HISTORY = JSON.parse(localStorage.getItem('pizzeria_history') || '[]');
  renderVerlaufTab();
}

function _renderVerlaufTab_LEGACY() { // ← deaktiviert, aktive Version in panels-b.js
  const panel = document.getElementById('panel-verlauf');
  const now = new Date();
  const todayYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  if (!VERLAUF_FILTER.monat) VERLAUF_FILTER.monat = todayYM;

  if (HISTORY.length === 0) {
    panel.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <span class="material-symbols-outlined" style="font-size:64px;color:#e3beb8;display:block;margin-bottom:16px">bar_chart</span>
        <h3 style="font-size:20px;font-weight:700;color:#261816;margin-bottom:8px">Noch keine Einkaufshistorie</h3>
        <p style="font-size:14px;color:#5a403c;max-width:340px;margin:0 auto;line-height:1.7">
          Sobald du Produkte über Kassenbon, Handliste oder Suche hinzufügst, erscheint hier deine Einkaufshistorie.
        </p>
        <div style="margin-top:28px">
          <button onclick="importUMTradeRechnung93722()"
            style="padding:14px 28px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:20px">upload_file</span>
            UM Trade Rechnung 93722 importieren
          </button>
          <p style="font-size:12px;color:#8d6562;margin-top:10px">Rechnung vom 25.03.2026 · € 676,27 · 30 Positionen</p>
        </div>
      </div>`;
    return;
  }

  // ── Filtered entries ──
  const filtered = HISTORY.filter(e => {
    if (VERLAUF_FILTER.shop    && e.shopName !== VERLAUF_FILTER.shop)                                          return false;
    if (VERLAUF_FILTER.produkt && !e.produktName.toLowerCase().includes(VERLAUF_FILTER.produkt.toLowerCase())) return false;
    if (VERLAUF_FILTER.monat   && !e.datum.startsWith(VERLAUF_FILTER.monat))                                  return false;
    return true;
  });

  // ── Monthly totals ──
  const [mY, mM] = (VERLAUF_FILTER.monat || todayYM).split('-').map(Number);
  const pM = mM === 1 ? 12 : mM - 1, pY = mM === 1 ? mY - 1 : mY;
  const mKey  = `${mY}-${String(mM).padStart(2,'0')}`;
  const pKey  = `${pY}-${String(pM).padStart(2,'0')}`;

  const thisMonthAll = HISTORY.filter(e => e.datum.startsWith(mKey));
  const prevMonthAll = HISTORY.filter(e => e.datum.startsWith(pKey));
  const calcTotal = es => es.reduce((s, e) => s + (e.preis != null && e.menge != null ? e.preis * e.menge : 0), 0);
  const thisTotal = calcTotal(thisMonthAll);
  const prevTotal = calcTotal(prevMonthAll);

  // By-shop bar chart data
  const byShopMap = {};
  thisMonthAll.forEach(e => {
    if (!e.shopName) return;
    if (!byShopMap[e.shopName]) byShopMap[e.shopName] = { name: e.shopName, shopId: e.shopId, total: 0 };
    byShopMap[e.shopName].total += (e.preis != null && e.menge != null ? e.preis * e.menge : 0);
  });
  const shopBars = Object.values(byShopMap).sort((a, b) => b.total - a.total);
  const maxBar = shopBars.length ? shopBars[0].total : 1;

  // Top 3 expensive
  const top3Exp = [...thisMonthAll]
    .filter(e => e.preis != null && e.menge != null)
    .sort((a, b) => (b.preis * b.menge) - (a.preis * a.menge))
    .slice(0, 3);

  // Top 3 deals (below personal average price for that product)
  const avgByProduct = {};
  HISTORY.filter(e => e.preis != null).forEach(e => {
    if (!avgByProduct[e.produktName]) avgByProduct[e.produktName] = [];
    avgByProduct[e.produktName].push(e.preis);
  });
  const top3Deals = [...thisMonthAll]
    .filter(e => e.preis != null && (avgByProduct[e.produktName] || []).length > 1)
    .map(e => {
      const arr = avgByProduct[e.produktName];
      const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
      return { ...e, saving: avg - e.preis };
    })
    .filter(e => e.saving > 0.005)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 3);

  // For filter dropdowns
  const allShops  = [...new Set(HISTORY.map(e => e.shopName).filter(Boolean))];
  const allMonths = [...new Set(HISTORY.map(e => e.datum.slice(0,7)))].sort().reverse();

  let html = '';

  // ─── FILTER ROW ───
  html += `
    <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;align-items:center">
      <select onchange="VERLAUF_FILTER.monat=this.value;renderVerlaufTab()"
        style="padding:9px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer;flex:1;min-width:150px">
        ${allMonths.map(m => {
          const [y,mo] = m.split('-');
          const label = new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString('de-DE', {month:'long', year:'numeric'});
          return `<option value="${m}" ${VERLAUF_FILTER.monat===m?'selected':''}>${label}</option>`;
        }).join('')}
        <option value="" ${!VERLAUF_FILTER.monat?'selected':''}>Alle Monate</option>
      </select>
      <select onchange="VERLAUF_FILTER.shop=this.value;renderVerlaufTab()"
        style="padding:9px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer;flex:1;min-width:130px">
        <option value="">Alle Geschäfte</option>
        ${allShops.map(s => `<option value="${s}" ${VERLAUF_FILTER.shop===s?'selected':''}>${escHtml(s)}</option>`).join('')}
      </select>
      <input type="text" placeholder="Produkt suchen…" value="${escHtml(VERLAUF_FILTER.produkt)}"
        oninput="VERLAUF_FILTER.produkt=this.value;renderVerlaufTab()"
        style="padding:9px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:13px;font-family:inherit;flex:1;min-width:130px;color:#261816">
      <span style="font-size:12px;color:#8d6562;white-space:nowrap">${filtered.length} Einträge</span>
    </div>`;

  // ─── MONATSAUSWERTUNG ───
  html += `
    <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#f8dcd8;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="material-symbols-outlined" style="font-size:22px;color:#610000">calendar_month</span>
          <span style="font-size:16px;font-weight:700;color:#261816">Monatsauswertung</span>
        </div>
        <button onclick="exportMonthAsText()"
          style="padding:8px 16px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:13px;color:#610000;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:16px">content_copy</span> Als Text kopieren
        </button>
      </div>
      <div style="padding:18px 20px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin-bottom:${shopBars.length?'20px':'0'}">
          <div style="background:#fff8f6;border:1px solid #e3beb8;border-radius:14px;padding:14px 16px">
            <div style="font-size:26px;font-weight:800;color:#610000">${eur(thisTotal)}</div>
            <div style="font-size:12px;color:#5a403c;margin-top:3px">Dieser Monat</div>
          </div>
          ${prevTotal > 0 ? `
          <div style="background:#fff0ee;border:1px solid #e3beb8;border-radius:14px;padding:14px 16px">
            <div style="font-size:26px;font-weight:800;color:#5a403c">${eur(prevTotal)}</div>
            <div style="font-size:12px;color:#8d6562;margin-top:3px">Vormonat</div>
          </div>
          <div style="background:${thisTotal > prevTotal ? '#ffdad6' : '#c0eda6'};border:1px solid ${thisTotal > prevTotal ? '#ba1a1a33' : '#386a2033'};border-radius:14px;padding:14px 16px">
            <div style="font-size:22px;font-weight:800;color:${thisTotal > prevTotal ? '#93000a' : '#0c2000'}">${thisTotal > prevTotal ? '+' : ''}${eur(thisTotal - prevTotal)}</div>
            <div style="font-size:12px;color:${thisTotal > prevTotal ? '#ba1a1a' : '#386a20'};margin-top:3px">${thisTotal > prevTotal ? '↑ mehr als Vormonat' : '↓ weniger als Vormonat'}</div>
          </div>` : ''}
        </div>`;

  if (shopBars.length > 0) {
    html += `
        <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px">Ausgaben nach Geschäft</p>
        <div style="display:flex;flex-direction:column;gap:10px">`;
    shopBars.forEach(bar => {
      const shopObj = allImportShops().find(s => s.name === bar.name || s.id === bar.shopId);
      const color = shopObj ? shopObj.color : '#610000';
      const pct = maxBar > 0 ? (bar.total / maxBar * 100) : 0;
      html += `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
              <span style="font-size:13px;font-weight:600;color:#261816">${escHtml(bar.name)}</span>
              <span style="font-size:13px;font-weight:700;color:#610000">${eur(bar.total)}</span>
            </div>
            <div style="height:11px;background:#e3beb855;border-radius:6px;overflow:hidden">
              <div style="height:100%;width:${pct.toFixed(1)}%;background:${color};border-radius:6px"></div>
            </div>
          </div>`;
    });
    html += `</div>`;
  }

  if (top3Exp.length > 0 || top3Deals.length > 0) {
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">`;
    if (top3Exp.length > 0) {
      html += `<div>
        <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">💸 Teuerste Produkte</p>
        ${top3Exp.map((e, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e3beb833">
            <div style="display:flex;align-items:center;gap:8px;overflow:hidden">
              <span style="width:20px;height:20px;border-radius:50%;background:#f8dcd8;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#610000;flex-shrink:0">${i+1}</span>
              <span style="font-size:13px;color:#261816;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(e.produktName)}</span>
            </div>
            <span style="font-size:13px;font-weight:700;color:#610000;white-space:nowrap;margin-left:8px">${eur(e.preis * e.menge)}</span>
          </div>`).join('')}
      </div>`;
    }
    if (top3Deals.length > 0) {
      html += `<div>
        <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">🎯 Beste Deals</p>
        ${top3Deals.map(e => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e3beb833">
            <span style="font-size:13px;color:#261816;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(e.produktName)}</span>
            <span style="font-size:12px;color:#386a20;font-weight:700;white-space:nowrap;margin-left:8px">−${eur(e.saving)}</span>
          </div>`).join('')}
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div></div>`;

  // ─── WOCHENVERBRAUCH ───
  const weeklyStats = calcWeeklyConsumption();
  if (weeklyStats.length > 0) {
    html += `
      <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#f0fdf4;display:flex;align-items:center;gap:10px">
          <span class="material-symbols-outlined" style="font-size:20px;color:#386a20">trending_up</span>
          <span style="font-size:15px;font-weight:700;color:#261816">Verbrauch pro Woche</span>
          <span style="font-size:11px;color:#5a403c">(letzte 4 Wochen)</span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:380px">
            <thead>
              <tr style="background:#f0fdf4">
                <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Produkt</th>
                <th style="padding:9px 14px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Ø / Woche</th>
                <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Trend</th>
                <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Prognose</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyStats.map((w, i) => `
                <tr style="border-bottom:1px solid #e3beb833;background:${i%2===0?'#fff':'#f8fffe'}">
                  <td style="padding:11px 16px;font-size:14px;font-weight:600;color:#261816">${escHtml(w.name)}</td>
                  <td style="padding:11px 14px;text-align:center;font-size:14px;font-weight:700;color:#386a20">${w.perWeek} ${escHtml(w.einheit||'Stk')}</td>
                  <td style="padding:11px 12px;text-align:center;font-size:20px;color:${w.trend==='↑'?'#ba1a1a':w.trend==='↓'?'#386a20':'#5a403c'}" title="${w.trend==='↑'?'steigend':w.trend==='↓'?'sinkend':'stabil'}">${w.trend}</td>
                  <td style="padding:11px 16px;font-size:13px;color:${w.prognose!=null&&w.prognose<=3?'#ba1a1a':w.prognose!=null&&w.prognose<=7?'#ca8a04':'#5a403c'}">
                    ${w.prognose != null ? `Noch ${w.prognose} Tag${w.prognose!==1?'e':''}` : '—'}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ─── PREISVERLAUF ───
  const priceTrends = calcPriceTrends();
  if (priceTrends.length > 0) {
    html += `
      <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#fff8f6">
          <span style="font-size:15px;font-weight:700;color:#261816">Preisvergleich</span>
        </div>
        <div style="padding:12px 18px;display:flex;flex-direction:column;gap:10px">
          ${priceTrends.map(pt => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-radius:12px;background:#fff8f6;border:1px solid #e3beb855;gap:12px">
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:600;color:#261816">${escHtml(pt.name)}</div>
                ${pt.diff != null ? `
                  <div style="font-size:12px;margin-top:3px;color:${pt.diff>0.005?'#ba1a1a':pt.diff<-0.005?'#386a20':'#5a403c'}">
                    ${pt.diff > 0.005 ? `↑ ${eur(pt.diff)} teurer als Vormonat` : pt.diff < -0.005 ? `↓ ${eur(Math.abs(pt.diff))} günstiger als Vormonat` : '→ gleich wie Vormonat'}
                  </div>` : ''}
                <div style="font-size:11px;color:#8d6562;margin-top:2px">Günstigster jemals: ${eur(pt.minEver)}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                ${pt.currentAvg != null ? `<div style="font-size:16px;font-weight:700;color:#261816">${eur(pt.currentAvg)}</div>` : ''}
                ${pt.currentAvg != null && Math.abs(pt.currentAvg - pt.minEver) < 0.01 ? `<div style="font-size:11px;color:#386a20;font-weight:700">⭐ Bester Preis!</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // ─── HISTORY LIST ───
  html += `
    <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#f8dcd8;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;font-weight:700;color:#261816">Alle Einkäufe</span>
        <button onclick="if(confirm('Gesamte Einkaufshistorie löschen?')){HISTORY=[];saveHistory();renderVerlaufTab()}"
          style="padding:5px 12px;border-radius:8px;border:1px solid #e3beb8;background:#fff;font-size:11px;color:#8d6562;cursor:pointer;font-family:inherit">
          Löschen
        </button>
      </div>`;

  if (filtered.length === 0) {
    html += `<div style="padding:32px;text-align:center;color:#8d6562;font-size:13px">Keine Einträge für diesen Filter</div>`;
  } else {
    const shown = filtered.slice(0, 100);
    html += `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:380px">
          <thead>
            <tr style="background:#fff8f6">
              <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Datum</th>
              <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Produkt</th>
              <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Menge</th>
              <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Geschäft</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${shown.map((e, i) => `
              <tr style="border-bottom:1px solid #e3beb833;background:${i%2===0?'#fff':'#fff8f6'}">
                <td style="padding:10px 16px;font-size:12px;color:#8d6562;white-space:nowrap">${fmtDate(e.datum)}</td>
                <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#261816">${escHtml(e.produktName)}</td>
                <td style="padding:10px 12px;text-align:center;font-size:13px;color:#5a403c;white-space:nowrap">${e.menge != null ? e.menge : '—'} ${escHtml(e.einheit||'')}</td>
                <td style="padding:10px 16px;font-size:13px;color:#5a403c">${e.shopName ? escHtml(e.shopName) : '—'}</td>
                <td style="padding:10px 16px;text-align:right;font-size:13px;font-weight:600;color:#610000;white-space:nowrap">${e.preis != null ? eur(e.preis) : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${filtered.length > 100 ? `<div style="padding:12px 20px;text-align:center;font-size:12px;color:#8d6562;border-top:1px solid #e3beb833">Zeige 100 von ${filtered.length} Einträgen</div>` : ''}`;
  }

  html += `</div>`;
  panel.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// MITARBEITER — Daten & Helpers
// ═══════════════════════════════════════════════════════════════

const MA_STATE = { view: 'plan', weekKey: null };
const MA_FARBEN = ['#b52619','#1565c0','#2e7d32','#6a1b9a','#00838f','#e65100','#4a148c','#37474f','#c62828','#0277bd'];

function getMitarbeiter() {
  try { return JSON.parse(localStorage.getItem('pizzeria_mitarbeiter') || '[]'); } catch(_) { return []; }
}
function saveMitarbeiterList(list) {
  try { localStorage.setItem('pizzeria_mitarbeiter', JSON.stringify(list)); } catch(_) {}
}
function getWochenplan() {
  try { return JSON.parse(localStorage.getItem('pizzeria_wochenplan') || '{}'); } catch(_) { return {}; }
}
function saveWochenplan(plan) {
  try { localStorage.setItem('pizzeria_wochenplan', JSON.stringify(plan)); } catch(_) {}
}

function weekMonday(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function weekKeyFromDate(date) {
  return weekMonday(date).toISOString().slice(0, 10);
}
function prevWeekKey(key) {
  const d = new Date(key); d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}
function nextWeekKey(key) {
  const d = new Date(key); d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}
function isoWeekNum(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dn = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dn);
  const ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - ys) / 86400000 + 1) / 7);
}
function shiftHours(von, bis) {
  if (!von || !bis) return 0;
  const [h1, m1] = von.split(':').map(Number);
  const [h2, m2] = bis.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff / 60 : 0;
}

function maHinzufuegen() {
  const nameEl   = document.getElementById('ma-name-inp');
  const rolleEl  = document.getElementById('ma-rolle-inp');
  const stundenEl = document.getElementById('ma-stunden-inp');
  const lohnEl   = document.getElementById('ma-lohn-inp');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const rolle   = rolleEl  ? rolleEl.value  : 'Küche';
  const stunden = stundenEl ? parseFloat(stundenEl.value) || 0 : 0;
  const lohn    = lohnEl   ? parseFloat(lohnEl.value)    || 0 : 0;
  const list = getMitarbeiter();
  list.push({ id: 'ma_' + Date.now(), name, rolle, stunden, lohn, farbe: MA_FARBEN[list.length % MA_FARBEN.length] });
  saveMitarbeiterList(list);
  renderMitarbeiterTab();
}

function maLoeschen(id) {
  if (!confirm('Mitarbeiter wirklich löschen?')) return;
  saveMitarbeiterList(getMitarbeiter().filter(m => m.id !== id));
  renderMitarbeiterTab();
}

function maSetShift(weekKey, maId, day, field, value) {
  const plan = getWochenplan();
  if (!plan[weekKey]) plan[weekKey] = {};
  if (!plan[weekKey][maId]) plan[weekKey][maId] = {};
  if (!plan[weekKey][maId][day]) plan[weekKey][maId][day] = {};
  plan[weekKey][maId][day][field] = value;
  saveWochenplan(plan);
  // Update only the hours display without full re-render (keeps focus)
  const von = plan[weekKey][maId][day].von;
  const bis = plan[weekKey][maId][day].bis;
  const hrs = shiftHours(von, bis);
  const hrsEl = document.getElementById(`hrs_${weekKey.replace(/-/g,'')}_${maId}_${day}`);
  if (hrsEl) {
    hrsEl.style.display = hrs > 0 ? 'block' : 'none';
    hrsEl.textContent = hrs.toFixed(1) + ' Std.';
  }
  // Update summary
  maSummaryUpdate(weekKey);
}

function maClearShift(weekKey, maId, day) {
  const plan = getWochenplan();
  if (plan[weekKey] && plan[weekKey][maId]) delete plan[weekKey][maId][day];
  saveWochenplan(plan);
  renderMitarbeiterTab();
}

function maSummaryUpdate(weekKey) {
  const mitarbeiter = getMitarbeiter();
  const plan = getWochenplan();
  const weekPlan = plan[weekKey] || {};
  for (const ma of mitarbeiter) {
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const s = (weekPlan[ma.id] || {})[d];
      if (s) total += shiftHours(s.von, s.bis);
    }
    const el = document.getElementById(`sum_${ma.id}`);
    if (el) el.textContent = total.toFixed(1) + ' Std.';
  }
}

// ═══════════════════════════════════════════════════════════════
// MITARBEITER TAB — Render
// ═══════════════════════════════════════════════════════════════

function renderMitarbeiterTab() {
  const panel = document.getElementById('panel-mitarbeiter');
  if (!panel) return;

  if (!MA_STATE.weekKey) MA_STATE.weekKey = weekKeyFromDate(new Date());
  const mitarbeiter = getMitarbeiter();
  const weekKey = MA_STATE.weekKey;

  let html = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#610000,#8b0000);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:26px;color:#fff">badge</span>
      </div>
      <div>
        <h2 style="font-size:20px;font-weight:800;color:#261816;margin:0">Personal</h2>
        <p style="font-size:13px;color:#5a403c;margin:0">Mitarbeiter &amp; Wochenplan</p>
      </div>
    </div>

    <div style="display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid #e3beb8">
      <button onclick="MA_STATE.view='plan';renderMitarbeiterTab()"
        style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;
               color:${MA_STATE.view==='plan'?'#610000':'#5a403c'};
               border-bottom:${MA_STATE.view==='plan'?'3px solid #610000':'3px solid transparent'};
               margin-bottom:-2px;font-family:inherit;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">calendar_month</span>Wochenplan
      </button>
      <button onclick="MA_STATE.view='list';renderMitarbeiterTab()"
        style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;
               color:${MA_STATE.view==='list'?'#610000':'#5a403c'};
               border-bottom:${MA_STATE.view==='list'?'3px solid #610000':'3px solid transparent'};
               margin-bottom:-2px;font-family:inherit;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">group</span>Mitarbeiter
        <span style="background:${MA_STATE.view==='list'?'#610000':'#e3beb8'};color:${MA_STATE.view==='list'?'#fff':'#5a403c'};border-radius:20px;padding:1px 7px;font-size:11px">${mitarbeiter.length}</span>
      </button>
    </div>`;

  html += MA_STATE.view === 'list'
    ? renderMAListe(mitarbeiter)
    : renderMAWochenplan(mitarbeiter, weekKey);

  panel.innerHTML = html;
}

function renderMAListe(mitarbeiter) {
  let html = `
    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:18px;padding:24px;margin-bottom:24px">
      <h3 style="font-size:16px;font-weight:800;color:#261816;margin:0 0 18px;display:flex;align-items:center;gap:8px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#610000">person_add</span>
        Neuer Mitarbeiter
      </h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name</label>
          <input id="ma-name-inp" type="text" placeholder="z.B. Ali Shama"
            onkeydown="if(event.key==='Enter')maHinzufuegen()"
            style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Rolle / Abteilung</label>
          <select id="ma-rolle-inp"
            style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box">
            <option>Küche</option>
            <option>Service</option>
            <option>Lieferung</option>
            <option>Theke</option>
            <option>Reinigung</option>
            <option>Sonstiges</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Stundenlohn (€/Std)</label>
            <input id="ma-lohn-inp" type="number" min="0" step="0.5" placeholder="z.B. 12.50"
              style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Soll-Std pro Woche</label>
            <input id="ma-stunden-inp" type="number" min="0" max="60" step="0.5" placeholder="z.B. 40"
              style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
        </div>
        <button onclick="maHinzufuegen()"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          <span class="material-symbols-outlined" style="font-size:20px">person_add</span>Hinzufügen
        </button>
      </div>
    </div>`;

  if (mitarbeiter.length === 0) {
    return html + `
      <div style="text-align:center;padding:48px 20px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
        <span class="material-symbols-outlined" style="font-size:52px;color:#e3beb8">group</span>
        <p style="color:#8d6562;margin-top:12px;font-size:14px">Noch keine Mitarbeiter angelegt</p>
      </div>`;
  }

  const gesamtWoche = mitarbeiter.reduce((s, m) => s + (m.lohn || 0) * (m.stunden || 0), 0);
  const gesamtMonat = gesamtWoche * 4.33;

  if (mitarbeiter.length > 0) {
    html += `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:16px;padding:18px 20px;color:#fff">
          <div style="font-size:11px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Personalkosten / Woche</div>
          <div style="font-size:26px;font-weight:800">${eur(gesamtWoche)}</div>
          <div style="font-size:11px;opacity:.7;margin-top:4px">${mitarbeiter.length} Mitarbeiter</div>
        </div>
        <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:18px 20px">
          <div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Personalkosten / Monat</div>
          <div style="font-size:26px;font-weight:800;color:#261816">${eur(gesamtMonat)}</div>
          <div style="font-size:11px;color:#8d6562;margin-top:4px">× 4,33 Wochen</div>
        </div>
      </div>`;
  }

  html += `<div style="display:flex;flex-direction:column;gap:14px">`;
  for (const ma of mitarbeiter) {
    const wochenlohn = (ma.lohn || 0) * (ma.stunden || 0);
    const monatslohn = wochenlohn * 4.33;
    html += `
      <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:18px;overflow:hidden">
        <div style="display:flex;align-items:center;gap:16px;padding:18px 20px">
          <div style="width:52px;height:52px;border-radius:50%;background:${ma.farbe};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;font-weight:800;color:#fff">
            ${escHtml(ma.name.charAt(0).toUpperCase())}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:17px;font-weight:800;color:#261816">${escHtml(ma.name)}</div>
            <div style="font-size:13px;color:#8d6562;margin-top:3px;display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:50%;background:${ma.farbe};display:inline-block"></span>
              ${escHtml(ma.rolle)}
            </div>
          </div>
          <button onclick="maLoeschen('${ma.id}')"
            style="background:none;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;padding:8px 10px;color:#8d6562;display:flex;align-items:center;line-height:0">
            <span class="material-symbols-outlined" style="font-size:20px">delete</span>
          </button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border-top:1.5px solid #f0e8e6;background:#fdf8f7">
          <div style="padding:14px 16px;text-align:center;border-right:1px solid #f0e8e6">
            <div style="font-size:11px;color:#8d6562;font-weight:600;margin-bottom:4px">€ / Std</div>
            <div style="font-size:18px;font-weight:800;color:#261816">${ma.lohn ? eur(ma.lohn) : '—'}</div>
          </div>
          <div style="padding:14px 16px;text-align:center;border-right:1px solid #f0e8e6">
            <div style="font-size:11px;color:#8d6562;font-weight:600;margin-bottom:4px">Std / Wo</div>
            <div style="font-size:18px;font-weight:800;color:#261816">${ma.stunden || '—'}</div>
          </div>
          <div style="padding:14px 16px;text-align:center;border-right:1px solid #f0e8e6;background:${wochenlohn>0?'#fff8f6':''}">
            <div style="font-size:11px;color:#8d6562;font-weight:600;margin-bottom:4px">Wochenlohn</div>
            <div style="font-size:18px;font-weight:800;color:${wochenlohn>0?'#610000':'#c0b0ae'}">${wochenlohn > 0 ? eur(wochenlohn) : '—'}</div>
          </div>
          <div style="padding:14px 16px;text-align:center;background:${monatslohn>0?'#fff8f6':''}">
            <div style="font-size:11px;color:#8d6562;font-weight:600;margin-bottom:4px">Monatslohn</div>
            <div style="font-size:18px;font-weight:800;color:${monatslohn>0?'#610000':'#c0b0ae'}">${monatslohn > 0 ? eur(monatslohn) : '—'}</div>
          </div>
        </div>
      </div>`;
  }
  return html + `</div>`;
}

function renderMAWochenplan(mitarbeiter, weekKey) {
  const weekStart = new Date(weekKey);
  const weekEnd   = new Date(weekKey); weekEnd.setDate(weekEnd.getDate() + 6);
  const plan      = getWochenplan();
  const weekPlan  = plan[weekKey] || {};
  const kw        = isoWeekNum(weekStart);
  const DAYS_SHORT = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const today     = new Date().toDateString();

  // Week nav
  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:14px 18px">
      <button onclick="MA_STATE.weekKey='${prevWeekKey(weekKey)}';renderMitarbeiterTab()"
        style="padding:8px 12px;background:#f9f4f3;border:1px solid #e3beb8;border-radius:10px;cursor:pointer;line-height:0">
        <span class="material-symbols-outlined" style="font-size:22px;color:#5a403c">chevron_left</span>
      </button>
      <div style="text-align:center">
        <div style="font-size:18px;font-weight:800;color:#261816">KW ${kw}</div>
        <div style="font-size:13px;color:#8d6562">${weekStart.toLocaleDateString('de-AT',{day:'numeric',month:'long'})} – ${weekEnd.toLocaleDateString('de-AT',{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <button onclick="MA_STATE.weekKey='${nextWeekKey(weekKey)}';renderMitarbeiterTab()"
        style="padding:8px 12px;background:#f9f4f3;border:1px solid #e3beb8;border-radius:10px;cursor:pointer;line-height:0">
        <span class="material-symbols-outlined" style="font-size:22px;color:#5a403c">chevron_right</span>
      </button>
    </div>`;

  if (mitarbeiter.length === 0) {
    return html + `
      <div style="text-align:center;padding:56px 20px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
        <span class="material-symbols-outlined" style="font-size:56px;color:#e3beb8">calendar_month</span>
        <p style="color:#8d6562;margin-top:16px;font-size:15px">Zuerst Mitarbeiter anlegen</p>
        <button onclick="MA_STATE.view='list';renderMitarbeiterTab()"
          style="margin-top:14px;padding:12px 24px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700">
          Mitarbeiter anlegen
        </button>
      </div>`;
  }

  // Table: rows = employees, cols = days
  html += `<div style="overflow-x:auto;border-radius:18px;border:1.5px solid #e3beb8;background:#fff">
    <table style="width:100%;border-collapse:collapse;min-width:700px">
      <thead>
        <tr style="background:#f9f4f3">
          <th style="padding:14px 18px;text-align:left;font-size:13px;font-weight:700;color:#5a403c;border-bottom:1.5px solid #e3beb8;min-width:130px">Mitarbeiter</th>`;

  for (let d = 0; d < 7; d++) {
    const dayDate  = new Date(weekStart); dayDate.setDate(weekStart.getDate() + d);
    const isToday  = dayDate.toDateString() === today;
    const dayNum   = dayDate.toLocaleDateString('de-AT', { day:'numeric', month:'numeric' });
    html += `
          <th style="padding:12px 8px;text-align:center;font-size:12px;font-weight:700;border-bottom:1.5px solid #e3beb8;border-left:1px solid #f0e8e6;min-width:110px;background:${isToday?'#fff0ee':''}">
            <div style="color:${isToday?'#610000':'#261816'};font-size:13px;font-weight:800">${DAYS_SHORT[d]}</div>
            <div style="color:${isToday?'#b52619':'#8d6562'};font-size:11px;font-weight:500">${dayNum}</div>
            ${isToday?'<div style="width:6px;height:6px;border-radius:50%;background:#610000;margin:4px auto 0"></div>':''}
          </th>`;
  }

  html += `
          <th style="padding:12px 10px;text-align:center;font-size:12px;font-weight:700;color:#5a403c;border-bottom:1.5px solid #e3beb8;border-left:2px solid #e3beb8;min-width:80px">Gesamt</th>
        </tr>
      </thead>
      <tbody>`;

  let gesamtLohn = 0;

  for (const ma of mitarbeiter) {
    let totalHrs = 0;
    for (let d = 0; d < 7; d++) {
      const s = (weekPlan[ma.id] || {})[d];
      if (s) totalHrs += shiftHours(s.von, s.bis);
    }
    const lohnWoche = (ma.lohn || 0) * totalHrs;
    gesamtLohn += lohnWoche;
    const wk = weekKey.replace(/-/g,'');

    html += `
        <tr style="border-bottom:1px solid #f0e8e6">
          <td style="padding:14px 18px;border-right:1px solid #f0e8e6">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:50%;background:${ma.farbe};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0">
                ${escHtml(ma.name.charAt(0).toUpperCase())}
              </div>
              <div>
                <div style="font-size:14px;font-weight:700;color:#261816;white-space:nowrap">${escHtml(ma.name)}</div>
                <div style="font-size:11px;color:#8d6562">${escHtml(ma.rolle)}</div>
              </div>
            </div>
          </td>`;

    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(weekStart); dayDate.setDate(weekStart.getDate() + d);
      const isToday = dayDate.toDateString() === today;
      const shift   = (weekPlan[ma.id] || {})[d] || {};
      const hasShift = !!(shift.von && shift.bis);
      const hrs     = shiftHours(shift.von, shift.bis);
      const safeId  = `${wk}_${ma.id}_${d}`;

      html += `
          <td style="padding:8px 6px;text-align:center;border-left:1px solid #f0e8e6;background:${isToday?'#fffaf9':''}${hasShift?';background:'+ma.farbe+'0a':''}">
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
              <input type="time" value="${shift.von || ''}"
                onchange="maSetShift('${weekKey}','${ma.id}',${d},'von',this.value)"
                style="width:90px;padding:5px 6px;border:1px solid ${hasShift?ma.farbe:'#e3beb8'};border-radius:7px;font-size:12px;font-family:inherit;background:#fff;color:#261816;text-align:center"/>
              <input type="time" value="${shift.bis || ''}"
                onchange="maSetShift('${weekKey}','${ma.id}',${d},'bis',this.value)"
                style="width:90px;padding:5px 6px;border:1px solid ${hasShift?ma.farbe:'#e3beb8'};border-radius:7px;font-size:12px;font-family:inherit;background:#fff;color:#261816;text-align:center"/>
              <div id="hrs_${safeId}" style="font-size:11px;font-weight:700;color:${ma.farbe};display:${hrs>0?'block':'none'}">${hrs.toFixed(1)} Std</div>
              ${hasShift?`<button onclick="maClearShift('${weekKey}','${ma.id}',${d})" style="background:none;border:none;cursor:pointer;padding:0;color:#c0b0ae;line-height:0;font-size:10px" title="Löschen"><span class="material-symbols-outlined" style="font-size:13px">close</span></button>`:''}
            </div>
          </td>`;
    }

    html += `
          <td style="padding:14px 10px;text-align:center;border-left:2px solid #e3beb8;background:#fdf8f7">
            <div id="sum_${ma.id}" style="font-size:16px;font-weight:800;color:${totalHrs>0?ma.farbe:'#c0b0ae'}">${totalHrs.toFixed(1)}</div>
            <div style="font-size:10px;color:#8d6562">Std</div>
            ${lohnWoche>0?`<div style="font-size:11px;font-weight:700;color:#610000;margin-top:2px">${eur(lohnWoche)}</div>`:''}
          </td>
        </tr>`;
  }

  html += `</tbody></table></div>`;

  // Summary bar
  if (gesamtLohn > 0) {
    html += `
      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:14px;padding:16px 20px;color:#fff;text-align:center">
          <div style="font-size:11px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Lohnkosten KW ${kw}</div>
          <div style="font-size:24px;font-weight:800">${eur(gesamtLohn)}</div>
        </div>
        <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:16px 20px;text-align:center">
          <div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Hochgerechnet / Monat</div>
          <div style="font-size:24px;font-weight:800;color:#261816">${eur(gesamtLohn * 4.33)}</div>
        </div>
      </div>`;
  }

  return html;
}

// ============================================================
// HEUTE-TAB
// ============================================================

function renderHeuteTab() {
  const panel = document.getElementById('panel-heute');
  if (!panel) return;

  // ── Daten laden ──────────────────────────────────────────────
  let dienstplan = {};
  let aufgaben   = [];
  let schichtcheck = {};
  let mitarbeiter  = [];
  try { dienstplan   = JSON.parse(localStorage.getItem('pizzeria_dienstplan')   || '{}'); } catch(_) {}
  try { aufgaben     = JSON.parse(localStorage.getItem('pizzeria_aufgaben')     || '[]'); } catch(_) {}
  try { schichtcheck = JSON.parse(localStorage.getItem('pizzeria_schichtcheck') || '{}'); } catch(_) {}
  try { mitarbeiter  = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter')  || '[]'); } catch(_) {}

  // ── Datum / Woche ────────────────────────────────────────────
  const today    = new Date();
  const weekKey  = weekKeyFromDate(today);             // weekKeyFromDate existiert in tabs.js (Zeile 1928)
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mo…6=So
  const DAYS     = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const dayKey   = DAYS[dayIndex];

  const wochentagDE = today.toLocaleDateString('de-DE', { weekday: 'long' });
  const datumDE     = today.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Dienstplan auslesen ──────────────────────────────────────
  const SCHICHT_ZEITEN = {
    'Früh (08-16)':  { label: 'Frühschicht',  von: '08:00', bis: '16:00', farbe: '#2e7d32', bg: '#f0fdf4', dot: '#22c55e' },
    'Spät (14-22)':  { label: 'Spätschicht',  von: '14:00', bis: '22:00', farbe: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
    'Nacht (20-04)': { label: 'Nachtschicht', von: '20:00', bis: '04:00', farbe: '#1e40af', bg: '#eff6ff', dot: '#3b82f6' },
    'Frei':          { label: 'Frei',          von: null,    bis: null,    farbe: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' },
  };

  // Welche Mitarbeiter haben heute Dienst?
  const wochenplanRaw = {};
  try { Object.assign(wochenplanRaw, JSON.parse(localStorage.getItem('pizzeria_wochenplan') || '{}')); } catch(_) {}
  const weekPlanRaw = wochenplanRaw[weekKey] || {};

  // Dienstplan-Objekt (aus pizzeria_dienstplan, falls vorhanden)
  const tagPlan = (dienstplan[weekKey] || {})[dayKey] || {};

  // Mitarbeiter mit heutiger Schicht aus dem alten Format
  const heutigeTeam = [];
  for (const ma of mitarbeiter) {
    const schichtName = tagPlan[ma.id];
    if (schichtName && schichtName !== 'Frei') {
      heutigeTeam.push({ ma, schichtName, info: SCHICHT_ZEITEN[schichtName] || null });
    }
  }

  // Alternativ: aus Wochenplan (Von/Bis-Format)
  const wochenplanTeam = [];
  for (const ma of mitarbeiter) {
    const shift = (weekPlanRaw[ma.id] || {})[dayIndex];
    if (shift && shift.von && shift.bis) {
      wochenplanTeam.push({ ma, von: shift.von, bis: shift.bis });
    }
  }

  // Eigene Schicht: erste Schicht aus Dienstplan oder Wochenplan
  const ersteSchicht = heutigeTeam[0] || null;
  const ersteWpSchicht = wochenplanTeam[0] || null;

  // ── Aufgaben auswerten ───────────────────────────────────────
  const offeneAufgaben  = aufgaben.filter(a => !a.erledigt);
  const dringendCount   = offeneAufgaben.filter(a => a.prioritaet === 'dringend' || a.dringend).length;
  const normalCount     = offeneAufgaben.filter(a => !a.prioritaet || a.prioritaet === 'normal' || (!a.dringend && a.prioritaet !== 'dringend')).length;
  const top3Aufgaben    = offeneAufgaben.slice(0, 3);

  // ── Schicht-Checkliste auswerten ─────────────────────────────
  const ckOeffnung  = schichtcheck['oeffnung']  || {};
  const ckSchliessung = schichtcheck['schliessung'] || {};
  const ckItems     = schichtcheck['items']     || { oeffnung: [], schliessung: [] };

  // Standard-Checklisten wenn keine Items definiert
  const defaultOeffnung  = ['Kasse öffnen', 'Herd vorheizen', 'Zutaten prüfen', 'Teig vorbereiten', 'Getränke auffüllen', 'Sauberkeit prüfen', 'Beleuchtung', 'Öffnungszeit eintragen'];
  const defaultSchliessung = ['Kasse abrechnen', 'Reste einräumen', 'Herd ausschalten', 'Reinigung', 'Abfall entsorgen', 'Kühlschrank prüfen', 'Türen schließen', 'Schichtübergabe'];

  const oeffItems = (ckItems.oeffnung  && ckItems.oeffnung.length)  ? ckItems.oeffnung  : defaultOeffnung;
  const schlItems = (ckItems.schliessung && ckItems.schliessung.length) ? ckItems.schliessung : defaultSchliessung;

  const oeffTotal = oeffItems.length;
  const schlTotal = schlItems.length;
  const oeffDone  = oeffItems.filter((_, i) => ckOeffnung[i]).length;
  const schlDone  = schlItems.filter((_, i) => ckSchliessung[i]).length;

  const oeffPct = oeffTotal > 0 ? Math.round((oeffDone / oeffTotal) * 100) : 0;
  const schlPct = schlTotal > 0 ? Math.round((schlDone / schlTotal) * 100) : 0;

  function progressStatus(done, total) {
    if (total === 0) return { label: '—', farbe: '#9ca3af', bg: '#f3f4f6' };
    const pct = done / total;
    if (pct === 1)   return { label: '✅ Fertig',      farbe: '#16a34a', bg: '#f0fdf4' };
    if (pct >= 0.5)  return { label: '🟡 In Arbeit',   farbe: '#d97706', bg: '#fffbeb' };
    if (pct > 0)     return { label: '🟠 Begonnen',    farbe: '#ea580c', bg: '#fff7ed' };
    return             { label: '⚪ Noch nicht',     farbe: '#6b7280', bg: '#f9fafb' };
  }

  const oeffStatus = progressStatus(oeffDone, oeffTotal);
  const schlStatus = progressStatus(schlDone, schlTotal);

  function progressBar(done, total, farbe) {
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const filled  = Math.round(pct / 10);
    const empty   = 10 - filled;
    return `<div style="height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden;margin:6px 0">
      <div style="height:100%;width:${pct}%;background:${farbe};border-radius:5px;transition:width .3s"></div>
    </div>`;
  }

  // ── HTML bauen ───────────────────────────────────────────────

  // INBOX async laden und in DOM einfügen (non-blocking)
  if (typeof _renderInboxSection === 'function') {
    _renderInboxSection().then(inboxHtml => {
      const inboxEl = document.getElementById('_heute-inbox-container');
      if (inboxEl && inboxHtml) inboxEl.innerHTML = inboxHtml;
    });
  }

  // HEADER
  let html = `
    <div id="_heute-inbox-container"></div>
    <div style="margin-bottom:24px">
      <h2 style="font-size:22px;font-weight:800;color:#261816;margin:0 0 4px">
        Guten Tag — ${wochentagDE}, ${datumDE}
      </h2>
      <p style="font-size:15px;color:#5a403c;margin:0">Übersicht für heute</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">`;

  // ── KACHEL 1: MEINE SCHICHT HEUTE ───────────────────────────
  let kachel1Html = '';

  if (ersteSchicht) {
    const info = ersteSchicht.info || {};
    const farbe = info.farbe || '#8B0000';
    const bg    = info.bg    || '#fff0ee';
    const dot   = info.dot   || '#8B0000';
    kachel1Html = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="width:14px;height:14px;border-radius:50%;background:${dot};display:inline-block;flex-shrink:0"></span>
        <span style="font-size:20px;font-weight:800;color:${farbe}">${info.label || ersteSchicht.schichtName}</span>
      </div>
      ${info.von ? `<p style="font-size:18px;font-weight:700;color:#261816;margin:0 0 14px">${info.von} – ${info.bis} Uhr</p>` : ''}`;
  } else if (ersteWpSchicht) {
    kachel1Html = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="width:14px;height:14px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0"></span>
        <span style="font-size:20px;font-weight:800;color:#2e7d32">Schicht heute</span>
      </div>
      <p style="font-size:18px;font-weight:700;color:#261816;margin:0 0 14px">${ersteWpSchicht.von} – ${ersteWpSchicht.bis} Uhr</p>`;
  } else {
    kachel1Html = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="width:14px;height:14px;border-radius:50%;background:#9ca3af;display:inline-block;flex-shrink:0"></span>
        <span style="font-size:18px;font-weight:700;color:#6b7280">Kein Schichtplan eingetragen</span>
      </div>
      <p style="font-size:14px;color:#9ca3af;margin:0 0 14px">Dienstplan im Mitarbeiter-Tab pflegen</p>`;
  }

  // Team heute (aus beiden Quellen)
  const teamAnzeige = wochenplanTeam.length > 0 ? wochenplanTeam : heutigeTeam.map(h => ({ ma: h.ma }));
  const teamCount   = teamAnzeige.length;
  kachel1Html += `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-size:14px;color:#5a403c;font-weight:600">Team heute:</span>
      ${teamCount === 0
        ? '<span style="font-size:14px;color:#9ca3af">Noch nicht geplant</span>'
        : teamAnzeige.map(t => `
            <span style="background:${t.ma.farbe || '#8B0000'}22;color:${t.ma.farbe || '#8B0000'};border:1px solid ${t.ma.farbe || '#8B0000'}44;border-radius:20px;padding:4px 12px;font-size:13px;font-weight:600">
              ${escHtml(t.ma.name)}
            </span>`).join('')
      }
    </div>`;

  html += `
    <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e3beb8">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:24px">👤</span>
        <h3 style="font-size:20px;font-weight:800;color:#261816;margin:0">Meine Schicht heute</h3>
      </div>
      ${kachel1Html}
    </div>`;

  // ── KACHEL 2: AUFGABEN ───────────────────────────────────────
  let aufgabenBody = '';

  if (offeneAufgaben.length === 0) {
    aufgabenBody = `
      <div style="text-align:center;padding:16px 0">
        <span style="font-size:32px">✅</span>
        <p style="font-size:15px;font-weight:700;color:#16a34a;margin:8px 0 4px">Alle Aufgaben erledigt!</p>
        <p style="font-size:13px;color:#6b7280;margin:0">Keine offenen Aufgaben vorhanden</p>
      </div>`;
  } else {
    aufgabenBody = `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        ${dringendCount > 0 ? `<span style="background:#fef2f2;border:1px solid #fecaca;border-radius:20px;padding:6px 14px;font-size:14px;font-weight:700;color:#dc2626">🔴 ${dringendCount} dringend</span>` : ''}
        ${normalCount   > 0 ? `<span style="background:#fffbeb;border:1px solid #fde68a;border-radius:20px;padding:6px 14px;font-size:14px;font-weight:700;color:#d97706">🟡 ${normalCount} normal</span>` : ''}
      </div>
      <p style="font-size:13px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px">Top ${Math.min(3, top3Aufgaben.length)} offene Aufgaben:</p>
      <ul style="margin:0 0 16px;padding:0;list-style:none">
        ${top3Aufgaben.map(a => {
          const isDring = a.prioritaet === 'dringend' || a.dringend;
          return `<li style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #f3f4f6">
            <span style="flex-shrink:0;margin-top:1px">${isDring ? '🔴' : '🟡'}</span>
            <span style="font-size:15px;color:#261816;font-weight:600">${escHtml(a.titel || a.name || 'Aufgabe')}${isDring ? ' <span style="font-size:11px;font-weight:700;color:#dc2626;background:#fee2e2;padding:1px 6px;border-radius:4px">DRINGEND</span>' : ''}</span>
          </li>`;
        }).join('')}
      </ul>`;
  }

  html += `
    <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e3beb8">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:24px">📋</span>
        <h3 style="font-size:20px;font-weight:800;color:#261816;margin:0">Aufgaben</h3>
      </div>
      ${aufgabenBody}
      <button onclick="switchTab('aufgaben')"
        style="width:100%;min-height:48px;padding:12px 16px;background:#8B0000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px"
        onmouseover="this.style.background='#6b0000'" onmouseout="this.style.background='#8B0000'">
        <span style="font-size:18px">→</span> Alle Aufgaben anzeigen
      </button>
    </div>`;

  // ── KACHEL 3: SCHICHT-CHECKLISTE ────────────────────────────
  html += `
    <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e3beb8">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:24px">☑️</span>
        <h3 style="font-size:20px;font-weight:800;color:#261816;margin:0">Schicht-Checkliste</h3>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:16px">
        <div style="background:${oeffStatus.bg};border-radius:12px;padding:14px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:16px;font-weight:700;color:#261816">Öffnung</span>
            <span style="font-size:15px;font-weight:700;color:${oeffStatus.farbe}">${oeffStatus.label}</span>
          </div>
          <div style="font-size:14px;color:#5a403c;margin-bottom:6px">${oeffDone} / ${oeffTotal} erledigt</div>
          ${progressBar(oeffDone, oeffTotal, oeffStatus.farbe)}
        </div>

        <div style="background:${schlStatus.bg};border-radius:12px;padding:14px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:16px;font-weight:700;color:#261816">Schließung</span>
            <span style="font-size:15px;font-weight:700;color:${schlStatus.farbe}">${schlStatus.label}</span>
          </div>
          <div style="font-size:14px;color:#5a403c;margin-bottom:6px">${schlDone} / ${schlTotal} erledigt</div>
          ${progressBar(schlDone, schlTotal, schlStatus.farbe)}
        </div>
      </div>

      <button onclick="switchTab('schichtcheck')"
        style="width:100%;min-height:48px;padding:12px 16px;background:#8B0000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px"
        onmouseover="this.style.background='#6b0000'" onmouseout="this.style.background='#8B0000'">
        <span style="font-size:18px">→</span> Zur Checkliste
      </button>
    </div>`;

  html += `</div>`; // Ende des Kachel-Containers

  panel.innerHTML = html;
}

// ============================================================
// BEWERTUNGEN-TAB
// ============================================================

function _bwLoad() {
  try { return JSON.parse(localStorage.getItem('sc_bewertungen') || '[]'); } catch(_) { return []; }
}
function _bwSave(list) {
  try { localStorage.setItem('sc_bewertungen', JSON.stringify(list)); } catch(_) {}
}

function bwSaveBewertung(data) {
  const list = _bwLoad();
  const idx  = list.findIndex(b => b.id === data.id);
  if (idx >= 0) { list[idx] = data; }
  else          { list.unshift(data); }
  _bwSave(list);
  renderBewertungenTab();
}

function bwDeleteBewertung(id) {
  if (!confirm('Bewertung wirklich löschen?')) return;
  _bwSave(_bwLoad().filter(b => b.id !== id));
  renderBewertungenTab();
}

function bwSetAntwort(id, text) {
  const list = _bwLoad();
  const b = list.find(b => b.id === id);
  if (!b) return;
  b.antwort    = text;
  b.beantwortet = true;
  _bwSave(list);
  renderBewertungenTab();
}

function bwCopyVorlage(text) {
  const copy = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        const el = document.getElementById('bw-kopiert-hint');
        if (el) { el.style.display = 'inline'; setTimeout(() => { el.style.display = 'none'; }, 2000); }
      })
      .catch(() => prompt('Text kopieren (Strg+C):', text));
  };
  copy();
}

function bwAddBewertung() {
  const formId = 'bw-neu-form';
  const existing = document.getElementById(formId);
  if (existing) { existing.remove(); return; }

  const panel = document.getElementById('panel-bewertungen');
  if (!panel) return;

  const today = new Date().toISOString().slice(0, 10);
  const formHtml = `
    <div id="${formId}" style="background:#fff8f6;border:2px solid #8B0000;border-radius:16px;padding:20px;margin-bottom:20px">
      <h3 style="font-size:18px;font-weight:800;color:#261816;margin:0 0 16px;display:flex;align-items:center;gap:8px">
        <span style="font-size:22px">⭐</span> Neue Bewertung erfassen
      </h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:13px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Plattform</label>
            <select id="bw-neu-plattform" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:15px;font-family:inherit;background:#fff;color:#261816">
              <option value="google">Google</option>
              <option value="lieferando">Lieferando</option>
              <option value="tripadvisor">TripAdvisor</option>
              <option value="sonstige">Sonstige</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Sterne</label>
            <select id="bw-neu-sterne" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:15px;font-family:inherit;background:#fff;color:#261816">
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:13px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Datum</label>
          <input id="bw-neu-datum" type="date" value="${today}"
            style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:15px;font-family:inherit;color:#261816;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:13px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Bewertungstext</label>
          <textarea id="bw-neu-text" rows="3" placeholder="Bewertungstext des Kunden..."
            style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:15px;font-family:inherit;color:#261816;resize:vertical;box-sizing:border-box"></textarea>
        </div>
        <div style="display:flex;gap:10px;margin-top:4px">
          <button onclick="bwNeuSpeichern()"
            style="flex:1;min-height:48px;padding:12px;background:#8B0000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit">
            Speichern
          </button>
          <button onclick="document.getElementById('${formId}').remove()"
            style="min-height:48px;padding:12px 20px;background:#f3f4f6;color:#374151;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;font-family:inherit">
            Abbrechen
          </button>
        </div>
      </div>
    </div>`;

  panel.insertAdjacentHTML('afterbegin', formHtml);
  const el = document.getElementById('bw-neu-text');
  if (el) el.focus();
}

function bwNeuSpeichern() {
  const plattform = (document.getElementById('bw-neu-plattform') || {}).value || 'sonstige';
  const sterne    = parseInt((document.getElementById('bw-neu-sterne')    || {}).value || '5');
  const datum     = (document.getElementById('bw-neu-datum')     || {}).value || new Date().toISOString().slice(0,10);
  const text      = ((document.getElementById('bw-neu-text')     || {}).value || '').trim();

  bwSaveBewertung({
    id: Date.now(),
    plattform,
    sterne,
    text,
    antwort: '',
    datum,
    beantwortet: false,
  });
}

function bwEditBewertung(id) {
  const list = _bwLoad();
  const b = list.find(x => x.id === id);
  if (!b) return;

  const existingId = 'bw-edit-' + id;
  const existing = document.getElementById(existingId);
  if (existing) { existing.remove(); return; }

  const card = document.getElementById('bw-card-' + id);
  if (!card) return;

  const PLATTFORM_OPTS = ['google','lieferando','tripadvisor','sonstige'];
  const sterneOpts = [5,4,3,2,1].map(s =>
    `<option value="${s}" ${b.sterne === s ? 'selected' : ''}>${'⭐'.repeat(s)} (${s})</option>`
  ).join('');
  const plattOpts = PLATTFORM_OPTS.map(p =>
    `<option value="${p}" ${b.plattform === p ? 'selected' : ''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`
  ).join('');

  const editHtml = `
    <div id="${existingId}" style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:16px;margin-top:12px">
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Plattform</label>
            <select id="bw-edit-plattform-${id}" style="width:100%;padding:10px 12px;border:1px solid #e3beb8;border-radius:8px;font-family:inherit;font-size:14px">${plattOpts}</select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Sterne</label>
            <select id="bw-edit-sterne-${id}" style="width:100%;padding:10px 12px;border:1px solid #e3beb8;border-radius:8px;font-family:inherit;font-size:14px">${sterneOpts}</select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Datum</label>
            <input id="bw-edit-datum-${id}" type="date" value="${b.datum || ''}"
              style="width:100%;padding:10px 12px;border:1px solid #e3beb8;border-radius:8px;font-family:inherit;font-size:14px;box-sizing:border-box"/>
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Bewertungstext</label>
          <textarea id="bw-edit-text-${id}" rows="3"
            style="width:100%;padding:10px 12px;border:1px solid #e3beb8;border-radius:8px;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">${escHtml(b.text || '')}</textarea>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Antwort</label>
          <textarea id="bw-edit-antwort-${id}" rows="3"
            style="width:100%;padding:10px 12px;border:1px solid #e3beb8;border-radius:8px;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">${escHtml(b.antwort || '')}</textarea>
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="bwEditSpeichern(${id})"
            style="flex:1;min-height:44px;padding:10px;background:#8B0000;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">
            Speichern
          </button>
          <button onclick="document.getElementById('${existingId}').remove()"
            style="min-height:44px;padding:10px 16px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit">
            Abbrechen
          </button>
        </div>
      </div>
    </div>`;

  card.insertAdjacentHTML('beforeend', editHtml);
}

function bwEditSpeichern(id) {
  const list = _bwLoad();
  const b = list.find(x => x.id === id);
  if (!b) return;
  b.plattform   = (document.getElementById('bw-edit-plattform-' + id) || {}).value || b.plattform;
  b.sterne      = parseInt((document.getElementById('bw-edit-sterne-' + id)   || {}).value || b.sterne);
  b.datum       = (document.getElementById('bw-edit-datum-' + id)     || {}).value || b.datum;
  b.text        = ((document.getElementById('bw-edit-text-' + id)     || {}).value || '').trim();
  const antwort = ((document.getElementById('bw-edit-antwort-' + id)  || {}).value || '').trim();
  b.antwort     = antwort;
  b.beantwortet = antwort.length > 0;
  _bwSave(list);
  renderBewertungenTab();
}

function renderBewertungenTab() {
  const panel = document.getElementById('panel-bewertungen');
  if (!panel) return;

  const bewertungen = _bwLoad();

  // ── Statistik je Plattform ───────────────────────────────────
  const PLATTFORMEN = ['google', 'lieferando', 'tripadvisor', 'sonstige'];
  const PLATT_LABEL = { google: 'Google', lieferando: 'Lieferando', tripadvisor: 'TripAdvisor', sonstige: 'Sonstige' };
  const PLATT_ICON  = { google: '🔵', lieferando: '🟠', tripadvisor: '🟢', sonstige: '⚪' };

  const stats = {};
  for (const p of PLATTFORMEN) {
    const gruppe = bewertungen.filter(b => b.plattform === p);
    const avg    = gruppe.length ? (gruppe.reduce((s, b) => s + b.sterne, 0) / gruppe.length) : null;
    stats[p]     = { count: gruppe.length, avg };
  }

  // ── Filter-State ─────────────────────────────────────────────
  if (!window._bwFilter) window._bwFilter = 'alle';

  const filteredBw = window._bwFilter === 'alle'
    ? bewertungen
    : window._bwFilter === 'unbeantwortet'
      ? bewertungen.filter(b => !b.beantwortet)
      : bewertungen.filter(b => b.plattform === window._bwFilter);

  // ── HTML aufbauen ────────────────────────────────────────────
  let html = '';

  // HEADER: Plattform-Statistiken
  const plattWithData = PLATTFORMEN.filter(p => stats[p].count > 0);
  if (plattWithData.length > 0) {
    html += `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px">
        ${plattWithData.map(p => `
          <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:14px 16px;text-align:center;cursor:pointer;transition:border-color .15s"
               onclick="window._bwFilter='${p}';renderBewertungenTab()"
               onmouseover="this.style.borderColor='#8B0000'" onmouseout="this.style.borderColor='${window._bwFilter===p?'#8B0000':'#e3beb8'}'">
            <div style="font-size:20px;margin-bottom:4px">${PLATT_ICON[p]}</div>
            <div style="font-size:22px;font-weight:800;color:#261816">
              ${stats[p].avg !== null ? ('⭐ ' + stats[p].avg.toFixed(1)) : '—'}
            </div>
            <div style="font-size:13px;font-weight:700;color:#5a403c;margin-top:2px">${PLATT_LABEL[p]}</div>
            <div style="font-size:12px;color:#8d6562;margin-top:2px">${stats[p].count} Bewertung${stats[p].count !== 1 ? 'en' : ''}</div>
          </div>`).join('')}
      </div>`;
  }

  // AKTIONS-BEREICH
  html += `
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
      <button onclick="bwAddBewertung()"
        style="min-height:48px;padding:12px 20px;background:#8B0000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px"
        onmouseover="this.style.background='#6b0000'" onmouseout="this.style.background='#8B0000'">
        <span style="font-size:20px">+</span> Neue Bewertung erfassen
      </button>
      <select onchange="window._bwFilter=this.value;renderBewertungenTab()"
        style="min-height:48px;padding:12px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
        <option value="alle"         ${window._bwFilter==='alle'?'selected':''}>Alle Plattformen</option>
        <option value="google"       ${window._bwFilter==='google'?'selected':''}>Google</option>
        <option value="lieferando"   ${window._bwFilter==='lieferando'?'selected':''}>Lieferando</option>
        <option value="tripadvisor"  ${window._bwFilter==='tripadvisor'?'selected':''}>TripAdvisor</option>
        <option value="sonstige"     ${window._bwFilter==='sonstige'?'selected':''}>Sonstige</option>
        <option value="unbeantwortet" ${window._bwFilter==='unbeantwortet'?'selected':''}>Unbeantwortet</option>
      </select>
      <span style="font-size:13px;color:#8d6562">${filteredBw.length} Bewertung${filteredBw.length !== 1 ? 'en' : ''}</span>
    </div>`;

  // SCHNELL-ANTWORT VORLAGEN
  const VORLAGEN = [
    { label: '👍 Positiv (5⭐)',  text: 'Vielen Dank für Ihre tolle Bewertung! Es freut uns sehr, dass Ihnen bei uns alles gefallen hat. Wir freuen uns auf Ihren nächsten Besuch! 🍕' },
    { label: '🙂 Gut (4⭐)',      text: 'Herzlichen Dank für Ihre positive Bewertung! Ihr Feedback motiviert uns täglich, unser Bestes zu geben. Bis bald in der Pizzeria San Carino!' },
    { label: '😐 Neutral (3⭐)',  text: 'Danke für Ihr ehrliches Feedback! Wir nehmen Ihre Anmerkungen ernst und arbeiten kontinuierlich daran, unser Angebot zu verbessern. Gerne laden wir Sie ein, uns erneut zu besuchen.' },
    { label: '😟 Kritisch (1-2⭐)', text: 'Wir entschuldigen uns aufrichtig für Ihre schlechte Erfahrung. Ihr Feedback ist uns sehr wichtig. Bitte kontaktieren Sie uns direkt, damit wir das Problem lösen können.' },
    { label: '🛵 Lieferando',     text: 'Vielen Dank für Ihre Bewertung auf Lieferando! Wir sind stets bemüht, Ihnen die beste Pizza pünktlich zu liefern. Wir freuen uns auf Ihre nächste Bestellung!' },
  ];

  html += `
    <div style="background:#fff;border:1px solid #e3beb8;border-radius:16px;padding:16px 18px;margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h3 style="font-size:16px;font-weight:800;color:#261816;margin:0">Schnell-Antwort Vorlagen</h3>
        <span id="bw-kopiert-hint" style="display:none;font-size:12px;font-weight:700;color:#16a34a;background:#f0fdf4;padding:4px 10px;border-radius:8px">✓ Kopiert!</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
        ${VORLAGEN.map(v => `
          <button onclick="bwCopyVorlage(${JSON.stringify(v.text)})"
            style="min-height:48px;padding:10px 12px;background:#fff8f6;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-weight:600;color:#261816;cursor:pointer;font-family:inherit;text-align:left;transition:border-color .15s"
            onmouseover="this.style.borderColor='#8B0000'" onmouseout="this.style.borderColor='#e3beb8'">
            ${escHtml(v.label)}
          </button>`).join('')}
      </div>
    </div>`;

  // BEWERTUNGS-LISTE
  if (bewertungen.length === 0) {
    html += `
      <div style="text-align:center;padding:60px 20px;background:#fff;border-radius:16px;border:1.5px dashed #e3beb8">
        <span style="font-size:48px;display:block;margin-bottom:16px">⭐</span>
        <h3 style="font-size:20px;font-weight:700;color:#261816;margin:0 0 8px">Noch keine Bewertungen erfasst</h3>
        <p style="font-size:15px;color:#5a403c;max-width:360px;margin:0 auto 20px;line-height:1.6">
          Erfasse Google-, Lieferando- oder TripAdvisor-Bewertungen, um den Überblick zu behalten.
        </p>
        <button onclick="bwAddBewertung()"
          style="min-height:48px;padding:12px 24px;background:#8B0000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit">
          + Erste Bewertung erfassen
        </button>
      </div>`;
  } else if (filteredBw.length === 0) {
    html += `
      <div style="text-align:center;padding:40px 20px;background:#fff;border-radius:16px;border:1px solid #e3beb8">
        <p style="font-size:15px;color:#8d6562">Keine Bewertungen für diesen Filter</p>
        <button onclick="window._bwFilter='alle';renderBewertungenTab()"
          style="margin-top:12px;padding:10px 20px;background:#8B0000;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
          Alle anzeigen
        </button>
      </div>`;
  } else {
    html += `<div style="display:flex;flex-direction:column;gap:14px">`;
    for (const b of filteredBw) {
      const sterne   = Math.min(5, Math.max(1, b.sterne || 1));
      const sterneHtml = '⭐'.repeat(sterne) + (5 - sterne > 0 ? '<span style="opacity:.3">' + '⭐'.repeat(5 - sterne) + '</span>' : '');
      const datumStr = b.datum ? fmtDate(b.datum) : '—';
      const plattfarbe = { google: '#4285f4', lieferando: '#ff6000', tripadvisor: '#00af87', sonstige: '#6b7280' };
      const pfarbe = plattfarbe[b.plattform] || '#6b7280';

      html += `
        <div id="bw-card-${b.id}" style="background:#fff;border-radius:16px;border:1px solid #e3beb8;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05)">
          <div style="padding:16px 18px">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <span style="font-size:20px">${sterneHtml}</span>
                <span style="background:${pfarbe}22;color:${pfarbe};border:1px solid ${pfarbe}44;border-radius:20px;padding:3px 10px;font-size:13px;font-weight:700">
                  ${PLATT_LABEL[b.plattform] || b.plattform}
                </span>
                <span style="font-size:13px;color:#8d6562">${datumStr}</span>
              </div>
              <div style="display:flex;gap:8px">
                <button onclick="bwEditBewertung(${b.id})"
                  style="min-height:40px;padding:8px 14px;background:#fff8f6;border:1px solid #e3beb8;border-radius:8px;font-size:13px;font-weight:600;color:#5a403c;cursor:pointer;font-family:inherit"
                  onmouseover="this.style.borderColor='#8B0000'" onmouseout="this.style.borderColor='#e3beb8'">
                  Bearbeiten
                </button>
                <button onclick="bwDeleteBewertung(${b.id})"
                  style="min-height:40px;padding:8px 12px;background:#fff5f5;border:1px solid #fecaca;border-radius:8px;font-size:13px;font-weight:600;color:#dc2626;cursor:pointer;font-family:inherit"
                  onmouseover="this.style.borderColor='#dc2626'" onmouseout="this.style.borderColor='#fecaca'">
                  ✕
                </button>
              </div>
            </div>

            ${b.text ? `
              <p style="font-size:15px;color:#261816;line-height:1.6;margin:0 0 12px;font-style:italic">
                „${escHtml(b.text)}"
              </p>` : ''}

            ${b.beantwortet && b.antwort ? `
              <div style="background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px">
                <p style="font-size:12px;font-weight:700;color:#16a34a;margin:0 0 4px">✅ Unsere Antwort:</p>
                <p style="font-size:14px;color:#374151;margin:0;line-height:1.5">${escHtml(b.antwort)}</p>
              </div>` : `
              <div style="background:#fff8f6;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:8px 14px;margin-bottom:12px">
                <p style="font-size:12px;font-weight:700;color:#d97706;margin:0">⏳ Noch nicht beantwortet</p>
              </div>`}

            ${!b.beantwortet ? `
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <textarea id="bw-antwort-inp-${b.id}" rows="2" placeholder="Antwort eingeben oder Vorlage kopieren..."
                  style="flex:1;min-width:200px;padding:10px 12px;border:1px solid #e3beb8;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical"></textarea>
                <button onclick="bwSetAntwort(${b.id},(document.getElementById('bw-antwort-inp-${b.id}')||{}).value||'')"
                  style="min-height:48px;padding:10px 16px;background:#8B0000;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">
                  Antwort speichern
                </button>
              </div>` : ''}
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  panel.innerHTML = html;
}
