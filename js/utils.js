// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function eur(val) {
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

// ── Globale MwSt / Menge Einstellungen ──────────────────────────
function getGlobalMenge() { return parseFloat(localStorage.getItem('pizzeria_menge') || '1'); }
function isBrutto() { return localStorage.getItem('pizzeria_mwst') === '1'; }
function mwstFaktor() { return isBrutto() ? 1.10 : 1.0; }
function calcGlobalPreis(v) { return v * getGlobalMenge() * mwstFaktor(); }

function getLowStockProducts() {
  return PRODUCTS.filter(p => stockLevels[p.id] < p.minStock);
}

function getPrice(shopId, productId) {
  return PRICE_MAP[shopId]?.[productId] ?? null;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ════ STATS DASHBOARD ════
function renderStatsDashboard() {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  const low = getLowStockProducts();
  const total = PRODUCTS.length;
  const okCount = total - low.length;
  const { y, m } = typeof bizCurrentMonth === 'function' ? bizCurrentMonth() : { y: new Date().getFullYear(), m: new Date().getMonth()+1 };
  const monthStr = y + '-' + String(m).padStart(2,'0');
  const kassa = typeof bizGetKassa === 'function' ? bizGetKassa() : [];
  const monthRev = kassa.filter(e => e.date.startsWith(monthStr)).reduce((s,e) => s+(e.gesamt||0), 0);
  const historyThisMonth = HISTORY.filter(e => e.datum && e.datum.startsWith(monthStr));
  const einkaufMonth = historyThisMonth.reduce((s,e) => s+(e.preis||0), 0);

  const now = new Date();
  const dayName = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][now.getDay()];

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon stat-icon-${low.length>0?'red':'green'}">
        <span class="material-symbols-outlined filled" style="font-size:28px">${low.length>0?'warning':'check_circle'}</span>
      </div>
      <div>
        <div class="stat-num">${low.length}</div>
        <div class="stat-label">Produkte unter Minimum</div>
        <span class="stat-sub ${low.length>0?'stat-sub-red':'stat-sub-green'}">${low.length>0?'Nachbestellen!':'Alle OK'}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon-blue">
        <span class="material-symbols-outlined filled" style="font-size:28px">inventory_2</span>
      </div>
      <div>
        <div class="stat-num">${total}</div>
        <div class="stat-label">Produkte gesamt</div>
        <span class="stat-sub stat-sub-green">${okCount} im grünen Bereich</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon-${monthRev>0?'green':'amber'}">
        <span class="material-symbols-outlined filled" style="font-size:28px">euro</span>
      </div>
      <div>
        <div class="stat-num">${monthRev>0 ? '€\u00A0'+Math.round(monthRev).toLocaleString('de-AT') : '—'}</div>
        <div class="stat-label">Umsatz ${['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][m-1]}</div>
        <span class="stat-sub ${monthRev>0?'stat-sub-green':'stat-sub-amber'}">${monthRev>0?'aus Kassabuch':'Kassabuch leer'}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon-red">
        <span class="material-symbols-outlined filled" style="font-size:28px">shopping_cart</span>
      </div>
      <div>
        <div class="stat-num">${einkaufMonth>0 ? '€\u00A0'+Math.round(einkaufMonth).toLocaleString('de-AT') : '—'}</div>
        <div class="stat-label">Einkauf ${['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][m-1]}</div>
        <span class="stat-sub stat-sub-amber">${HISTORY.length} Einträge gesamt</span>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// STOCK EDITING
// ═══════════════════════════════════════════════════════════════

function editStock(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const current = stockLevels[productId];
  const input = prompt(`Aktuellen Bestand für "${product.name}" eingeben (${product.unit}):`, current);
  if (input === null) return;
  const val = parseFloat(input.replace(',', '.'));
  if (isNaN(val) || val < 0) { alert('Ungültiger Wert'); return; }
  stockLevels[productId] = val;

  // Auto-Fehlmaterial wenn unter Minimum
  if (val < product.minStock && typeof FM_DATA !== 'undefined' && typeof fmSave === 'function') {
    const alreadyOpen = FM_DATA.find(e =>
      e.status === 'offen' &&
      (e.produktId === productId || e.produktName === product.name)
    );
    if (!alreadyOpen) {
      FM_DATA.unshift({
        id: Date.now() + '_auto',
        datum: new Date().toISOString().slice(0, 10),
        uhrzeit: new Date().toLocaleTimeString('de-AT', {hour:'2-digit', minute:'2-digit'}),
        produktName: product.name,
        produktId: productId,
        menge: product.orderQuantity || product.minStock,
        einheit: product.unit,
        kategorie: 'Lebensmittel',
        prioritaet: val <= 0 ? 'dringend' : 'wichtig',
        bemerkung: 'Automatisch (Bestand unter Minimum)',
        eingetragenVon: 'System',
        status: 'offen',
        statusDatum: null,
      });
      fmSave();
      fmUpdateBadge();
      if (typeof fmShowToast === 'function')
        fmShowToast('⚠️ ' + product.name + ' automatisch in Fehlmaterial eingetragen');
    }
  }

  updateHeaderBadge();
  renderProductsTab();
}

// ═══════════════════════════════════════════════════════════════
// HEADER BADGE
// ═══════════════════════════════════════════════════════════════

function updateHeaderBadge() {
  const low = getLowStockProducts();
  const badge = document.getElementById('header-badge');
  const text = document.getElementById('header-badge-text');
  const tabBadge = document.getElementById('kombis-tab-badge');
  if (!badge || !text || !tabBadge) return;

  if (low.length > 0) {
    badge.style.display = 'flex';
    text.textContent = `${low.length} Produkte brauchen Nachbestellung`;
    tabBadge.style.display = 'flex';
    tabBadge.textContent = low.length;
  } else {
    badge.style.display = 'none';
    tabBadge.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

updateHeaderBadge();

function showLowStockPopup() {
  const existing = document.getElementById('low-stock-popup');
  if (existing) { existing.remove(); return; }

  const low = getLowStockProducts();
  const popup = document.createElement('div');
  popup.id = 'low-stock-popup';
  popup.style.cssText = 'position:fixed;top:68px;right:12px;z-index:9999;background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,.22);border:1px solid #e3beb8;width:310px;max-height:82vh;overflow-y:auto;animation:slideDown .2s ease';

  let content = `
    <style>@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}</style>
    <div style="padding:14px 16px;border-bottom:1px solid #e3beb8;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;border-radius:18px 18px 0 0;z-index:1">
      <div style="display:flex;align-items:center;gap:8px">
        <span class="material-symbols-outlined" style="font-size:20px;color:${low.length>0?'#ba1a1a':'#386a20'}">notifications${low.length>0?'_active':''}</span>
        <span style="font-size:14px;font-weight:700;color:#261816">Bestand-Warnung</span>
      </div>
      <button onclick="document.getElementById('low-stock-popup').remove()"
        style="border:none;background:none;cursor:pointer;padding:4px;border-radius:8px;color:#5a403c">
        <span class="material-symbols-outlined" style="font-size:20px">close</span>
      </button>
    </div>`;

  if (low.length === 0) {
    content += `
      <div style="padding:28px 20px;text-align:center">
        <div style="font-size:40px;margin-bottom:10px">✅</div>
        <p style="font-size:15px;font-weight:700;color:#386a20">Alle Bestände OK!</p>
        <p style="font-size:12px;color:#5a403c;margin-top:6px">Kein Produkt unter Minimum</p>
      </div>`;
  } else {
    content += `<div>`;
    low.forEach(p => {
      const stock = stockLevels[p.id];
      const pct = Math.round((stock / p.minStock) * 100);
      content += `
        <div style="padding:12px 16px;border-bottom:1px solid #e3beb822">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
            <span style="font-size:13px;font-weight:600;color:#261816">${p.name}</span>
            <span style="font-size:12px;color:#ba1a1a;font-weight:700;background:#ffdad6;padding:2px 8px;border-radius:8px">${pct}%</span>
          </div>
          <div style="height:5px;background:#e3beb8;border-radius:3px;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;width:${pct}%;background:#ba1a1a;border-radius:3px"></div>
          </div>
          <div style="font-size:11px;color:#5a403c">${stock} ${p.unit} / ${p.minStock} ${p.unit} Minimum</div>
        </div>`;
    });
    content += `</div>`;
  }

  const notifSupported = 'Notification' in window;
  const notifGranted   = notifSupported && Notification.permission === 'granted';
  content += `
    <div style="padding:12px 16px;border-top:1px solid #e3beb8">
      ${notifGranted
        ? `<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#386a20;background:#c0eda6;padding:10px 12px;border-radius:10px">
             <span class="material-symbols-outlined" style="font-size:16px">check_circle</span>
             Tägliche Benachrichtigungen aktiv
           </div>`
        : `<button onclick="requestNotificationPermission()" id="notif-req-btn"
             style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #e3beb8;background:#fff8f6;font-size:12px;color:#610000;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:600">
             <span class="material-symbols-outlined" style="font-size:16px">notifications_active</span>
             ${notifSupported ? 'Täglich um 8:00 Uhr benachrichtigen' : 'Benachrichtigungen nicht verfügbar'}
           </button>`}
    </div>`;

  popup.innerHTML = content;
  document.body.appendChild(popup);

  setTimeout(() => {
    function outsideClick(e) {
      const p = document.getElementById('low-stock-popup');
      if (!p) { document.removeEventListener('click', outsideClick); return; }
      if (!p.contains(e.target) && !e.target.closest('#notif-bell-btn')) {
        p.remove();
        document.removeEventListener('click', outsideClick);
      }
    }
    document.addEventListener('click', outsideClick);
  }, 150);
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) { alert('Dein Browser unterstützt keine Benachrichtigungen.'); return; }
  const btn = document.getElementById('notif-req-btn');
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    if (btn) { btn.style.background = '#c0eda6'; btn.style.color = '#0c2000'; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">check_circle</span> Aktiviert — täglich 8 Uhr'; }
    scheduleNotificationCheck();
    checkAndNotify();
  } else {
    if (btn) { btn.style.background = '#ffdad6'; btn.style.color = '#93000a'; btn.innerHTML = '✗ Erlaubnis verweigert'; }
  }
}

function scheduleNotificationCheck() {
  // Check every hour; fire notification at ~8:00
  function hourlyCheck() {
    if (new Date().getHours() === 8) checkAndNotify();
  }
  hourlyCheck();
  setInterval(hourlyCheck, 3600000);
}

function checkAndNotify() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const low = getLowStockProducts();
  if (low.length === 0) return;
  low.slice(0, 3).forEach(p => {
    try {
      new Notification(`⚠️ Pizzeria: ${p.name} fast leer!`, {
        body: `Nur noch ${stockLevels[p.id]} ${p.unit} — Minimum: ${p.minStock} ${p.unit}`,
        tag:  'pizzeria-low-' + p.id,
      });
    } catch(_) {}
  });
}

// Auto-restore notifications on load if previously granted
if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
  scheduleNotificationCheck();
}
