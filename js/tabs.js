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
  ['produkte','geschaefte','kombis','suche','upload','verlauf','mitarbeiter','fehlmaterial','checkliste','business'].forEach(t => {
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
  if (tab === 'suche')       renderSucheTab();
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
    inner += renderSearchResults();
  } else if (SUCHE_STATE.query && !SUCHE_STATE.error) {
    inner += `
      <div style="text-align:center;padding:64px 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:#ffe9e6;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined" style="font-size:30px;color:#5a403c">search_off</span>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#261816;margin-bottom:8px">Keine Angebote gefunden</h3>
        <p style="font-size:13px;color:#5a403c;max-width:340px;margin:0 auto;line-height:1.6">
          Für <strong>"${escHtml(SUCHE_STATE.query)}"</strong> wurden keine aktuellen oder kommenden Angebote bei österreichischen Händlern gefunden.
        </p>
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

async function startSearch() {
  const input = document.getElementById('suche-input');
  const query = (input ? input.value : '').trim();
  if (!query) return;

  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  if (!hasKey) {
    SUCHE_STATE.error = 'Kein API Key konfiguriert. Bitte ANTHROPIC_API_KEY am Anfang der Datei eintragen.';
    renderSucheTab();
    return;
  }

  SUCHE_STATE.loading = true;
  SUCHE_STATE.error = null;
  SUCHE_STATE.results = [];
  SUCHE_STATE.query = query;
  SUCHE_STATE.addedIds = new Set();
  SUCHE_STATE.loadingStep = 'Verbinde mit Claude …';
  renderSucheTab();

  try {
    const results = await searchViaClaudeAPI(query);
    SUCHE_STATE.results = results;
    SUCHE_STATE.error = null;
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
  const today = new Date().toISOString().slice(0, 10);

  const userPrompt =
    `Heute ist ${today}. Suche auf marktguru.at, aktionsfinder.at und wogibtswas.at ` +
    `nach aktuellen UND kommenden Angeboten für "${query}" bei österreichischen Händlern ` +
    `(Hofer, Billa, Billa Plus, Spar, Interspar, Eurospar, Lidl, Metro, Etsan, Penny, Merkur). ` +
    `Gib ALLE gefundenen Angebote zurück. ` +
    `Antworte NUR mit einem JSON-Array in exakt diesem Format, ohne Erklärungen, ohne Markdown:\n` +
    `[\n` +
    `  {\n` +
    `    "name": "Produktname",\n` +
    `    "brand": "Marke oder null",\n` +
    `    "shop": "Geschäftsname",\n` +
    `    "price": 1.99,\n` +
    `    "originalPrice": 2.49,\n` +
    `    "unit": "kg / L / Stk / etc.",\n` +
    `    "validFrom": "YYYY-MM-DD oder null",\n` +
    `    "validUntil": "YYYY-MM-DD oder null",\n` +
    `    "source": "marktguru.at / aktionsfinder.at / wogibtswas.at"\n` +
    `  }\n` +
    `]\n` +
    `Wenn keine Angebote gefunden werden, gib [] zurück.`;

  let messages = [{ role: 'user', content: userPrompt }];
  let maxContinuations = 6;

  while (maxContinuations-- > 0) {
    updateLoadingStep('Claude durchsucht österreichische Angebots-Websites …');

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        thinking: { type: 'adaptive' },
        tools: [
          { type: 'web_search_20260209', name: 'web_search' },
          { type: 'web_fetch_20260209',  name: 'web_fetch'  },
        ],
        messages,
      }),
    });

    if (!resp.ok) {
      let errMsg = `HTTP ${resp.status}`;
      try {
        const errData = await resp.json();
        errMsg = errData?.error?.message || errMsg;
      } catch (_) {}
      if (resp.status === 401) throw new Error('Ungültiger API Key (401). Bitte API Key prüfen.');
      if (resp.status === 429) throw new Error('Rate Limit erreicht (429). Kurz warten und erneut versuchen.');
      throw new Error(errMsg);
    }

    const data = await resp.json();

    if (data.stop_reason === 'end_turn') {
      updateLoadingStep('Angebote werden verarbeitet …');
      const textBlock = data.content.find(b => b.type === 'text');
      const rawText = textBlock ? textBlock.text : '';
      return parseResultsJSON(rawText);
    }

    if (data.stop_reason === 'pause_turn') {
      // Server-side web search hit iteration limit → re-send to continue
      updateLoadingStep('Weitere Seiten werden durchsucht …');
      messages = [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: data.content },
      ];
      continue;
    }

    // Any other stop reason — try to extract text anyway
    const textBlock = data.content && data.content.find(b => b.type === 'text');
    if (textBlock) return parseResultsJSON(textBlock.text);
    throw new Error(`Unerwarteter Stop-Grund: ${data.stop_reason}`);
  }

  throw new Error('Suche hat zu lange gedauert (max. Iterationen erreicht).');
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
// VERLAUF — Helpers
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

function renderVerlaufTab() {
  const panel = document.getElementById('panel-verlauf');
  const now = new Date();
  const todayYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  if (!VERLAUF_FILTER.monat) VERLAUF_FILTER.monat = todayYM;

  if (HISTORY.length === 0) {
    panel.innerHTML = `
      <div style="text-align:center;padding:80px 20px">
        <span class="material-symbols-outlined" style="font-size:64px;color:#e3beb8;display:block;margin-bottom:16px">bar_chart</span>
        <h3 style="font-size:20px;font-weight:700;color:#261816;margin-bottom:8px">Noch keine Einkaufshistorie</h3>
        <p style="font-size:14px;color:#5a403c;max-width:340px;margin:0 auto;line-height:1.7">
          Sobald du Produkte über Kassenbon, Handliste oder Suche hinzufügst, erscheint hier deine Einkaufshistorie mit Auswertungen.
        </p>
        <div style="margin-top:24px;padding:16px 20px;background:#fff8f6;border-radius:14px;border:1px solid #e3beb8;display:inline-block;text-align:left;font-size:13px;color:#5a403c;line-height:2">
          📸 Kassenbon scannen → Upload Tab<br>
          ✍️ Handliste erkennen → Upload Tab<br>
          🔍 Angebote suchen → Suche Tab
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
// MITARBEITER TAB — Render
// ═══════════════════════════════════════════════════════════════

function renderMitarbeiterTab() {
  const low = getLowStockProducts();
  const dateLabel = new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' });

  let html = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">
      <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#610000,#8b0000);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:28px;color:#fff">badge</span>
      </div>
      <div>
        <h2 style="font-size:20px;font-weight:800;color:#261816;margin-bottom:3px">Mitarbeiter-Einkaufsliste</h2>
        <p style="font-size:14px;color:#5a403c">${dateLabel}</p>
      </div>
    </div>`;

  if (low.length === 0) {
    html += `
      <div style="text-align:center;padding:64px 20px;background:#c0eda6;border-radius:20px;border:2px solid #86efac">
        <div style="font-size:56px;margin-bottom:16px">✅</div>
        <h3 style="font-size:24px;font-weight:800;color:#0c2000;margin-bottom:8px">Alles in Ordnung!</h3>
        <p style="font-size:16px;color:#386a20;font-weight:500">Heute muss nichts eingekauft werden.</p>
      </div>`;
  } else {
    // Group by cheapest shop
    const shopGroups = {};
    for (const prod of low) {
      let bestShop = null, bestPrice = Infinity;
      for (const shop of SHOPS) {
        const price = getPrice(shop.id, prod.id);
        if (price !== null && price < bestPrice) { bestPrice = price; bestShop = shop; }
      }
      const key = bestShop ? bestShop.id : 'other';
      if (!shopGroups[key]) shopGroups[key] = { shop: bestShop, items: [] };
      shopGroups[key].items.push({ product: prod, price: bestPrice < Infinity ? bestPrice : null });
    }

    for (const group of Object.values(shopGroups)) {
      const shopColor = group.shop ? group.shop.color : '#5a403c';
      const shopTotal = group.items.reduce((s, it) => s + (it.price != null ? it.price * it.product.orderQuantity : 0), 0);
      html += `
        <div style="margin-bottom:20px;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1)">
          <div style="background:${shopColor};padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:22px;font-weight:800;color:#fff">${group.shop ? group.shop.name : 'Sonstiges'}</div>
              ${group.shop ? `<div style="font-size:13px;color:rgba(255,255,255,.8)">${group.shop.type}</div>` : ''}
            </div>
            ${shopTotal > 0 ? `<div style="text-align:right"><div style="font-size:18px;font-weight:700;color:#fff">${eur(shopTotal)}</div><div style="font-size:10px;color:rgba(255,255,255,.7)">geschätzt</div></div>` : ''}
          </div>
          <div style="background:#fff">`;

      group.items.forEach(({ product: p, price }) => {
        html += `
            <div style="display:flex;align-items:center;padding:18px 20px;border-bottom:2px solid #ffe9e6;gap:14px">
              <span style="font-size:26px;color:#d0c0b8;flex-shrink:0">☐</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:20px;font-weight:700;color:#261816;line-height:1.2">${p.name}</div>
                <div style="font-size:15px;color:#5a403c;margin-top:5px">
                  Kaufen: <strong style="color:#610000;font-size:20px">${p.orderQuantity} ${p.unit}</strong>
                </div>
              </div>
              ${price != null ? `
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:20px;font-weight:700;color:#261816">${eur(price * p.orderQuantity)}</div>
                <div style="font-size:12px;color:#8d6562">${eur(price)}/${p.unit}</div>
              </div>` : ''}
            </div>`;
      });

      html += `</div></div>`;
    }
  }

  html += `
    <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
      <button onclick="window.print()"
        style="padding:14px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:10px">
        <span class="material-symbols-outlined" style="font-size:22px">print</span> Liste drucken
      </button>
      <button onclick="switchTab('kombis')"
        style="padding:14px 24px;border-radius:14px;border:1px solid #e3beb8;background:#fff;font-size:14px;font-weight:600;color:#5a403c;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px">
        <span class="material-symbols-outlined" style="font-size:20px">lightbulb</span> Kombis anzeigen
      </button>
    </div>`;

  document.getElementById('panel-mitarbeiter').innerHTML = html;
}

