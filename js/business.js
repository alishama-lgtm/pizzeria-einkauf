// ═══════════════════════════════════════════════════════════════
// BUSINESS TAB — PASSWORD + DATA
// ═══════════════════════════════════════════════════════════════

const BIZ_PW_KEY   = 'biz_pw_hash';
const BIZ_AUTH_KEY = 'biz_auth_session';

function bizHash(s) {
  // simple djb2 hash — not cryptographic but enough for local use
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function bizGetPwHash() {
  return localStorage.getItem(BIZ_PW_KEY) || bizHash('ali2024');
}

function bizIsAuth() {
  return sessionStorage.getItem(BIZ_AUTH_KEY) === '1';
}

function bizSetAuth() {
  sessionStorage.setItem(BIZ_AUTH_KEY, '1');
}

// ── LocalStorage helpers ──
function bizLoad(key, def) {
  try { const v = localStorage.getItem('biz_' + key); return v ? JSON.parse(v) : def; } catch(_) { return def; }
}
function bizSave(key, val) {
  try { localStorage.setItem('biz_' + key, JSON.stringify(val)); } catch(_) {}
}

// ── Kassabuch data ──
// entries: [{date, bar, karte, gesamt, speiseAnteil}]
function bizGetKassa() { return bizLoad('kassa', []); }
function bizSaveKassa(d) { bizSave('kassa', d); }

// ── Kosten data ──
function bizGetFixkosten() {
  return bizLoad('fixkosten', { miete:0, strom:0, versicherung:0, buchhaltung:0, sonstige:0 });
}

function bizGetPersonal() { return bizLoad('personal', []); }
function bizSavePersonal(d) { bizSave('personal', d); }

// ── Pizza-Kalkulation data ──
const BIZ_PIZZA_NAMES = [
  'Margherita','Diavola','Quattro Formaggi','Prosciutto','Vegetariana',
  'Tonno','Bufala','Salami Piccante','Capricciosa','Calzone'
];
function bizGetPizzaCalc() {
  return bizLoad('pizzacalc', BIZ_PIZZA_NAMES.map(n => ({ name:n, preis:12.90, kosten:2.80 })));
}
function bizSavePizzaCalc(d) { bizSave('pizzacalc', d); }

// ── Business settings ──
function bizGetSettings() {
  return bizLoad('settings', { uid:'ATU12345678', speiseAnteil:80 });
}
function bizSaveSettings(d) { bizSave('settings', d); }

// ── Utility ──
function bizEur(n) { return '€\u00A0' + (+n||0).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function bizToday() { return new Date().toISOString().slice(0,10); }
function bizDayName(dateStr) {
  const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  return days[new Date(dateStr).getDay()];
}
function bizMonthName(m) {
  return ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][m-1];
}
function bizCurrentMonth() { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth()+1 }; }

// ── Einkauf-Kosten aus HISTORY ──
function bizGetEinkaufThisWeek() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay()+6)%7)); mon.setHours(0,0,0,0);
  return HISTORY.reduce((s,e) => {
    if (!e.datum || !e.preis) return s;
    const d = new Date(e.datum);
    return d >= mon && d <= now ? s + (e.preis||0) : s;
  }, 0);
}
function bizGetEinkaufThisMonth() {
  const { y, m } = bizCurrentMonth();
  const from = new Date(y, m-1, 1), to = new Date(y, m, 0, 23, 59, 59);
  return HISTORY.reduce((s,e) => {
    if (!e.datum || !e.preis) return s;
    const d = new Date(e.datum);
    return d >= from && d <= to ? s + (e.preis||0) : s;
  }, 0);
}

// ═══════════════════════════════════════════════════════════════
// RENDER BUSINESS TAB
// ═══════════════════════════════════════════════════════════════

function renderBusinessTab() {
  if (!bizIsAuth()) { renderBizLocked(); return; }

  const panel = document.getElementById('panel-business');
  const settings = bizGetSettings();
  const kassa = bizGetKassa();
  const { y, m } = bizCurrentMonth();

  // Monats-Umsatz aus Kassabuch
  const monthKassa = kassa.filter(e => e.date.startsWith(y+'-'+(String(m).padStart(2,'0'))));
  const monthRevenue = monthKassa.reduce((s,e) => s + (e.gesamt||0), 0);

  // Fixkosten
  const fix = bizGetFixkosten();
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0), 0);

  // Personal
  const personal = bizGetPersonal();
  const personalMonth = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);

  // Einkauf
  const einkaufMonth = bizGetEinkaufThisMonth();

  // Gewinn
  const gewinn = monthRevenue - fixSum - personalMonth - einkaufMonth;

  // Break-even täglich
  const tagFix = (fixSum + personalMonth) / 30;
  const today = bizToday();
  const todayEntry = kassa.find(e => e.date === today);
  const todayRevenue = todayEntry ? (todayEntry.gesamt||0) : 0;
  const breakEven = tagFix / (1 - (einkaufMonth / (monthRevenue||1)));
  const breakEvenDay = Math.max(tagFix + (einkaufMonth/30), 80);

  panel.innerHTML = `
<div style="font-family:'Inter',sans-serif">

  <!-- SUB-NAV -->
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:28px;border-bottom:1px solid #e3beb8;padding-bottom:16px;">
    ${[
      ['biz-kassabuch','account_balance','Kassabuch'],
      ['biz-kosten','payments','Kosten & Personal'],
      ['biz-cockpit','donut_large','Gewinn-Cockpit'],
      ['biz-report','summarize','Monatsbericht'],
      ['biz-settings','settings','Einstellungen'],
    ].map(([id,icon,label]) => `
      <button id="btn-${id}" onclick="showBizSection('${id}')"
        style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-weight:600;color:#5a403c;cursor:pointer;font-family:inherit;transition:all .15s"
        onmouseover="this.style.borderColor='#8B0000';this.style.color='#8B0000'"
        onmouseout="if(!this.classList.contains('biz-active')){this.style.borderColor='#e3beb8';this.style.color='#5a403c'}">
        <span class="material-symbols-outlined" style="font-size:16px">${icon}</span>${label}
      </button>`).join('')}
  </div>

  <!-- KASSABUCH -->
  <div id="biz-kassabuch" class="biz-section" style="display:block">${renderBizKassabuch()}</div>

  <!-- KOSTEN -->
  <div id="biz-kosten" class="biz-section" style="display:none">${renderBizKosten()}</div>

  <!-- COCKPIT -->
  <div id="biz-cockpit" class="biz-section" style="display:none">${renderBizCockpit()}</div>

  <!-- BERICHT -->
  <div id="biz-report" class="biz-section" style="display:none">${renderBizReport()}</div>

  <!-- EINSTELLUNGEN -->
  <div id="biz-settings" class="biz-section" style="display:none">${renderBizSettings()}</div>

</div>`;

  // activate first subnav button
  showBizSection('biz-kassabuch');
}

function showBizSection(id) {
  document.querySelectorAll('.biz-section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  document.querySelectorAll('[id^="btn-biz-"]').forEach(b => {
    b.classList.remove('biz-active');
    b.style.background = '#fff'; b.style.borderColor = '#e3beb8'; b.style.color = '#5a403c';
  });
  const btn = document.getElementById('btn-' + id);
  if (btn) {
    btn.classList.add('biz-active');
    btn.style.background = '#8B0000'; btn.style.borderColor = '#8B0000'; btn.style.color = '#fff';
    btn.onmouseover = null; btn.onmouseout = null;
  }
  // Charts neu initialisieren wenn Cockpit-Tab aktiv wird
  if (id === 'biz-cockpit') {
    setTimeout(() => { _bizInitCharts(); }, 80);
  }
}

// ── LOCKED SCREEN ──
function renderBizLocked() {
  const panel = document.getElementById('panel-business');
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
      <div style="background:#fff;border-radius:20px;border:1.5px solid #e3beb8;padding:40px 32px;max-width:360px;width:100%;text-align:center;box-shadow:0 4px 20px rgba(97,0,0,0.08)">
        <div style="width:64px;height:64px;background:#fff0ee;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined" style="font-size:32px;color:#8B0000">lock</span>
        </div>
        <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;margin-bottom:6px">💼 Business-Bereich</h2>
        <p style="font-size:13px;color:#5a403c;margin-bottom:24px">Kassabuch, Kosten & Gewinn-Cockpit</p>
        <input type="password" id="biz-pw-input" placeholder="Passwort eingeben"
          onkeydown="if(event.key==='Enter')bizLogin()"
          style="width:100%;padding:12px 16px;border-radius:10px;border:1.5px solid #e3beb8;font-size:15px;font-family:inherit;outline:none;margin-bottom:12px;box-sizing:border-box;text-align:center;letter-spacing:0.1em">
        <button onclick="bizLogin()"
          style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px">
          <span class="material-symbols-outlined" style="font-size:18px">lock_open</span>
          Einloggen
        </button>
        <div id="biz-pw-error" style="color:#ba1a1a;font-size:12px;margin-top:10px;display:none">Falsches Passwort</div>
        <p style="font-size:11px;color:#8d6562;margin-top:20px">Session bleibt aktiv bis Browser geschlossen</p>
      </div>
    </div>`;
  setTimeout(() => document.getElementById('biz-pw-input')?.focus(), 50);
}

function bizLogin() {
  const input = document.getElementById('biz-pw-input');
  const err = document.getElementById('biz-pw-error');
  if (!input) return;
  if (bizHash(input.value) === bizGetPwHash()) {
    bizSetAuth();
    // update lock icon
    const lockIcon = document.getElementById('biz-lock-icon');
    if (lockIcon) lockIcon.textContent = 'lock_open';
    renderBusinessTab();
    showBizSection('biz-kassabuch');
  } else {
    if (err) { err.style.display = 'block'; }
    input.value = ''; input.focus();
  }
}

// ═══════════════════════════════════════════════════════════════
// KASSABUCH
// ═══════════════════════════════════════════════════════════════

function renderBizKassabuch() {
  const kassa = bizGetKassa();
  const today = bizToday();
  const settings = bizGetSettings();
  const todayEntry = kassa.find(e => e.date === today) || { date:today, bar:0, karte:0, gesamt:0, speiseAnteil: settings.speiseAnteil };

  // Last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0,10);
    const entry = kassa.find(e => e.date === ds);
    last7.push({ date: ds, day: bizDayName(ds).slice(0,2), gesamt: entry?.gesamt||0 });
  }
  const maxVal = Math.max(...last7.map(d=>d.gesamt), 1);

  // This week vs last week
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate()-((now.getDay()+6)%7)); weekStart.setHours(0,0,0,0);
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate()-7);
  const thisWeek = kassa.filter(e=>{ const d=new Date(e.date); return d>=weekStart && d<=now; }).reduce((s,e)=>s+(e.gesamt||0),0);
  const lastWeek = kassa.filter(e=>{ const d=new Date(e.date); return d>=lastWeekStart && d<weekStart; }).reduce((s,e)=>s+(e.gesamt||0),0);
  const weekDiff = thisWeek - lastWeek;
  const weekPct = lastWeek > 0 ? Math.round((weekDiff/lastWeek)*100) : 0;

  // Best day
  const bestEntry = [...kassa].sort((a,b)=>(b.gesamt||0)-(a.gesamt||0))[0];

  // MwSt berechnen für today
  const sa = todayEntry.speiseAnteil ?? settings.speiseAnteil;
  const speiseUmsatz = (todayEntry.gesamt||0) * (sa/100);
  const getraenkUmsatz = (todayEntry.gesamt||0) * ((100-sa)/100);
  const mwst10 = speiseUmsatz * (10/110);
  const mwst20 = getraenkUmsatz * (20/120);
  const nettoSpeise = speiseUmsatz - mwst10;
  const nettoGetraenk = getraenkUmsatz - mwst20;

  return `
<h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;margin-bottom:20px;display:flex;align-items:center;gap:8px">
  <span class="material-symbols-outlined" style="color:#8B0000">account_balance</span>Kassabuch
</h2>

<!-- Einnahmen erfassen -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px;margin-bottom:20px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px;display:flex;align-items:center;gap:6px">
    <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">edit_calendar</span>
    Heute erfassen — ${bizDayName(today)}, ${today.split('-').reverse().join('.')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">
    <div>
      <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">💵 Bar-Einnahmen (€)</label>
      <input type="number" id="kassa-bar" value="${todayEntry.bar||''}" min="0" step="0.01" placeholder="0,00"
        oninput="bizUpdateKassaTotal()"
        style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:16px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box">
    </div>
    <div>
      <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">💳 Karten-Einnahmen (€)</label>
      <input type="number" id="kassa-karte" value="${todayEntry.karte||''}" min="0" step="0.01" placeholder="0,00"
        oninput="bizUpdateKassaTotal()"
        style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:16px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box">
    </div>
    <div>
      <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">🍕 Speisen-Anteil (%)</label>
      <input type="number" id="kassa-speise" value="${sa}" min="0" max="100"
        oninput="bizUpdateKassaTotal()"
        style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:16px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box">
    </div>
  </div>
  <!-- Gesamt + MwSt -->
  <div style="background:#fff0ee;border-radius:12px;padding:16px;margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e3beb8">
      <span style="font-size:15px;font-weight:700;color:#261816">Gesamt-Tagesumsatz</span>
      <span id="kassa-gesamt-display" style="font-size:24px;font-weight:800;color:#610000">€&nbsp;0,00</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
      <div>
        <div style="color:#5a403c;margin-bottom:3px">Netto Speisen (10% MwSt)</div>
        <div id="kassa-netto-speise" style="font-weight:700;color:#261816">€ 0,00</div>
        <div id="kassa-mwst10" style="color:#8d6562;font-size:11px">MwSt 10%: € 0,00</div>
      </div>
      <div>
        <div style="color:#5a403c;margin-bottom:3px">Netto Getränke (20% MwSt)</div>
        <div id="kassa-netto-getraenk" style="font-weight:700;color:#261816">€ 0,00</div>
        <div id="kassa-mwst20" style="color:#8d6562;font-size:11px">MwSt 20%: € 0,00</div>
      </div>
    </div>
  </div>
  <button onclick="bizSaveKassaEntry()"
    style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px">
    <span class="material-symbols-outlined" style="font-size:18px">save</span>Eintrag speichern
  </button>
</div>

<!-- 7-Tage Chart -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px;margin-bottom:20px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:6px">
    <span style="display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">bar_chart</span>
      7-Tage Verlauf
    </span>
    <span style="font-size:12px;color:#5a403c">
      Diese Woche: <strong style="color:${weekDiff>=0?'#386a20':'#ba1a1a'}">${weekDiff>=0?'+':''}${bizEur(weekDiff)}</strong>
      (${weekDiff>=0?'▲':'▼'}${Math.abs(weekPct)}% vs. letzte Woche)
    </span>
  </div>
  <div style="display:flex;align-items:flex-end;gap:6px;height:140px;padding-top:10px">
    ${last7.map(d => {
      const pct = maxVal > 0 ? Math.round((d.gesamt/maxVal)*100) : 0;
      const isToday = d.date === today;
      const isBest  = bestEntry && d.date === bestEntry.date && d.gesamt > 0;
      return `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
          ${isBest ? '<span style="font-size:9px;color:#c8860a;font-weight:700">BEST</span>' : '<span style="font-size:9px"></span>'}
          <div style="font-size:9px;color:#5a403c;white-space:nowrap">${d.gesamt>0?bizEur(d.gesamt):''}</div>
          <div style="width:100%;background:${isToday?'linear-gradient(180deg,#610000,#8B0000)':isBest?'#c8860a':'#e3beb8'};border-radius:5px 5px 0 0;height:${Math.max(pct,2)}%;min-height:4px;transition:height .4s;position:relative">
          </div>
          <div style="font-size:11px;font-weight:${isToday?'700':'500'};color:${isToday?'#8B0000':'#5a403c'}">${d.day}</div>
        </div>`;
    }).join('')}
  </div>
</div>

<!-- Verlauf-Tabelle -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;overflow:hidden">
  <div style="padding:16px 20px;border-bottom:1px solid #e3beb8;display:flex;align-items:center;justify-content:space-between">
    <span style="font-weight:700;font-size:14px;color:#261816">Alle Einträge</span>
    <span style="font-size:12px;color:#5a403c">${kassa.length} Einträge</span>
  </div>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#fff8f6">
        <th style="padding:10px 16px;text-align:left;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Datum</th>
        <th style="padding:10px 16px;text-align:left;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Tag</th>
        <th style="padding:10px 16px;text-align:right;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Bar</th>
        <th style="padding:10px 16px;text-align:right;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Karte</th>
        <th style="padding:10px 16px;text-align:right;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Gesamt</th>
        <th style="padding:10px 16px;text-align:center;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Löschen</th>
      </tr></thead>
      <tbody>
        ${kassa.length === 0 ? `<tr><td colspan="6" style="padding:24px;text-align:center;color:#8d6562">Noch keine Einträge</td></tr>` :
          [...kassa].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,60).map((e,i) => {
            const isToday = e.date === today;
            const isBest = bestEntry && e.date === bestEntry.date && e.gesamt > 0;
            return `<tr style="background:${isToday?'#fff0ee':i%2===0?'#fff':'#fffbfa'};${isBest?'outline:2px solid #c8860a;outline-offset:-1px':''}">
              <td style="padding:10px 16px;font-weight:${isToday?'700':'400'};color:${isToday?'#610000':'#261816'}">${e.date.split('-').reverse().join('.')} ${isToday?'<span style="font-size:10px;background:#8B0000;color:#fff;padding:1px 6px;border-radius:8px;margin-left:4px">Heute</span>':''}</td>
              <td style="padding:10px 16px;color:#5a403c">${bizDayName(e.date)}</td>
              <td style="padding:10px 16px;text-align:right;color:#261816">${bizEur(e.bar||0)}</td>
              <td style="padding:10px 16px;text-align:right;color:#261816">${bizEur(e.karte||0)}</td>
              <td style="padding:10px 16px;text-align:right;font-weight:700;color:#610000">${bizEur(e.gesamt||0)}${isBest?'&nbsp;⭐':''}</td>
              <td style="padding:10px 16px;text-align:center">
                <button onclick="bizDeleteKassaEntry('${e.date}')" style="border:none;background:none;cursor:pointer;color:#ba1a1a;font-size:12px;padding:4px 8px;border-radius:6px;background:#ffdad6">✕</button>
              </td>
            </tr>`;
          }).join('')}
      </tbody>
    </table>
  </div>
</div>`;
}

function bizUpdateKassaTotal() {
  const bar = parseFloat(document.getElementById('kassa-bar')?.value)||0;
  const karte = parseFloat(document.getElementById('kassa-karte')?.value)||0;
  const sa = parseFloat(document.getElementById('kassa-speise')?.value)||80;
  const gesamt = bar + karte;
  const speise = gesamt*(sa/100), getraenk = gesamt*((100-sa)/100);
  const mwst10 = speise*(10/110), mwst20 = getraenk*(20/120);
  const setEl = (id,v) => { const el=document.getElementById(id); if(el) el.innerHTML=v; };
  setEl('kassa-gesamt-display', bizEur(gesamt));
  setEl('kassa-netto-speise', bizEur(speise-mwst10));
  setEl('kassa-mwst10', 'MwSt 10%: '+bizEur(mwst10));
  setEl('kassa-netto-getraenk', bizEur(getraenk-mwst20));
  setEl('kassa-mwst20', 'MwSt 20%: '+bizEur(mwst20));
}

function bizSaveKassaEntry() {
  const bar = parseFloat(document.getElementById('kassa-bar')?.value)||0;
  const karte = parseFloat(document.getElementById('kassa-karte')?.value)||0;
  const sa = parseFloat(document.getElementById('kassa-speise')?.value)||80;
  const today = bizToday();
  let kassa = bizGetKassa();
  kassa = kassa.filter(e => e.date !== today);
  kassa.push({ date:today, bar, karte, gesamt:bar+karte, speiseAnteil:sa });
  bizSaveKassa(kassa);
  renderBusinessTab();
  showBizSection('biz-kassabuch');
}

function bizDeleteKassaEntry(date) {
  if (!confirm('Eintrag für '+date.split('-').reverse().join('.')+' löschen?')) return;
  let kassa = bizGetKassa();
  kassa = kassa.filter(e => e.date !== date);
  bizSaveKassa(kassa);
  renderBusinessTab();
  showBizSection('biz-kassabuch');
}

// ═══════════════════════════════════════════════════════════════
// KOSTEN & PERSONAL
// ═══════════════════════════════════════════════════════════════

function renderBizKosten() {
  const fix = bizGetFixkosten();
  const personal = bizGetPersonal();
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const einkaufWeek = bizGetEinkaufThisWeek();
  const einkaufMonth = bizGetEinkaufThisMonth();

  return `
<h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;margin-bottom:20px;display:flex;align-items:center;gap:8px">
  <span class="material-symbols-outlined" style="color:#8B0000">payments</span>Kosten & Personal
</h2>

<!-- Fixkosten -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px;margin-bottom:20px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px;display:flex;align-items:center;gap:6px">
    <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">home</span>
    Fixkosten (monatlich)
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:16px">
    ${[
      ['miete','Miete','home'],
      ['strom','Strom/Gas','bolt'],
      ['versicherung','Versicherung','shield'],
      ['buchhaltung','Buchhaltung','description'],
      ['sonstige','Sonstige','more_horiz'],
    ].map(([key,label,icon]) => `
      <div>
        <label style="font-size:12px;font-weight:600;color:#5a403c;display:flex;align-items:center;gap:4px;margin-bottom:5px">
          <span class="material-symbols-outlined" style="font-size:14px">${icon}</span>${label} (€)
        </label>
        <input type="number" id="fix-${key}" value="${fix[key]||''}" min="0" step="0.01" placeholder="0,00"
          oninput="bizUpdateFixSum()"
          style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid #e3beb8;font-size:14px;font-weight:600;font-family:inherit;outline:none;box-sizing:border-box">
      </div>`).join('')}
  </div>
  <div style="background:#fff0ee;border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <div>
      <div style="font-size:12px;color:#5a403c">Gesamt Fixkosten/Monat</div>
      <div id="fix-sum" style="font-size:20px;font-weight:800;color:#610000">${bizEur(fixSum)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#5a403c">Pro Tag (÷30)</div>
      <div id="fix-day" style="font-size:16px;font-weight:700;color:#8d6562">${bizEur(fixSum/30)}</div>
    </div>
  </div>
  <button onclick="bizSaveFixkosten()"
    style="padding:10px 20px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
    Fixkosten speichern
  </button>
</div>

<!-- Personal -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px;margin-bottom:20px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:6px">
    <span style="display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">badge</span>
      Personal
    </span>
    <button onclick="bizAddPersonal()"
      style="padding:7px 14px;border-radius:9px;border:1.5px solid #8B0000;background:#fff0ee;color:#8B0000;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px">
      <span class="material-symbols-outlined" style="font-size:14px">add</span> Mitarbeiter
    </button>
  </div>
  <div id="personal-list">
    ${personal.length === 0 ? '<p style="color:#8d6562;font-size:13px;text-align:center;padding:20px 0">Noch keine Mitarbeiter eingetragen</p>' :
      personal.map((p,i) => renderPersonalRow(p,i)).join('')}
  </div>
  <div style="background:#fff0ee;border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:12px">
    <div>
      <div style="font-size:12px;color:#5a403c">Personalkosten/Monat (geschätzt)</div>
      <div style="font-size:20px;font-weight:800;color:#610000">${bizEur(personalMonat)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#5a403c">Pro Tag</div>
      <div style="font-size:16px;font-weight:700;color:#8d6562">${bizEur(personalMonat/30)}</div>
    </div>
  </div>
</div>

<!-- Einkaufskosten -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px;display:flex;align-items:center;gap:6px">
    <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">shopping_cart</span>
    Einkaufskosten (aus Verlauf)
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div style="background:#fff0ee;border-radius:10px;padding:14px 16px;text-align:center">
      <div style="font-size:12px;color:#5a403c;margin-bottom:4px">Diese Woche</div>
      <div style="font-size:22px;font-weight:800;color:#610000">${bizEur(einkaufWeek)}</div>
    </div>
    <div style="background:#fff8f6;border-radius:10px;padding:14px 16px;text-align:center">
      <div style="font-size:12px;color:#5a403c;margin-bottom:4px">Dieser Monat</div>
      <div style="font-size:22px;font-weight:800;color:#261816">${bizEur(einkaufMonth)}</div>
    </div>
  </div>
  <p style="font-size:11px;color:#8d6562;margin-top:10px">Automatisch aus dem Verlauf-Tab berechnet</p>
</div>`;
}

function renderPersonalRow(p, i) {
  const wochenlohn = (p.stunden||0) * (p.lohn||0);
  const monatslohn = wochenlohn * 4.33;
  return `
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #e3beb8">
      <input value="${p.name||''}" placeholder="Name"
        oninput="bizPersonalUpdate(${i},'name',this.value)"
        style="padding:8px;border-radius:8px;border:1px solid #e3beb8;font-size:13px;font-family:inherit;outline:none">
      <div>
        <div style="font-size:10px;color:#5a403c;margin-bottom:2px">€/Std</div>
        <input type="number" value="${p.lohn||''}" min="0" step="0.50" placeholder="12,00"
          oninput="bizPersonalUpdate(${i},'lohn',this.value)"
          style="width:100%;padding:8px;border-radius:8px;border:1px solid #e3beb8;font-size:13px;font-family:inherit;outline:none">
      </div>
      <div>
        <div style="font-size:10px;color:#5a403c;margin-bottom:2px">Std/Woche</div>
        <input type="number" value="${p.stunden||''}" min="0" max="60" placeholder="40"
          oninput="bizPersonalUpdate(${i},'stunden',this.value)"
          style="width:100%;padding:8px;border-radius:8px;border:1px solid #e3beb8;font-size:13px;font-family:inherit;outline:none">
      </div>
      <div style="display:flex;gap:4px">
        <button onclick="exportLohnPDF(${JSON.stringify(p).replace(/"/g, '&quot;')})"
          style="border:1.5px solid #8B0000;background:#fff0ee;color:#8B0000;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;white-space:nowrap">PDF</button>
        <button onclick="bizDeletePersonal(${i})"
          style="border:none;background:#ffdad6;color:#ba1a1a;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:13px">✕</button>
      </div>
    </div>
    <div style="font-size:11px;color:#5a403c;padding:4px 0 8px;border-bottom:2px solid #e3beb8">
      Wochenlohn: <strong>${bizEur(wochenlohn)}</strong> · Monatslohn: <strong>${bizEur(monatslohn)}</strong>
    </div>`;
}

function bizUpdateFixSum() {
  const keys = ['miete','strom','versicherung','buchhaltung','sonstige'];
  const sum = keys.reduce((s,k) => s+(parseFloat(document.getElementById('fix-'+k)?.value)||0), 0);
  const setEl=(id,v)=>{const el=document.getElementById(id);if(el)el.innerHTML=v;};
  setEl('fix-sum', bizEur(sum));
  setEl('fix-day', bizEur(sum/30));
}

function bizSaveFixkosten() {
  const keys = ['miete','strom','versicherung','buchhaltung','sonstige'];
  const data = {};
  keys.forEach(k => data[k] = parseFloat(document.getElementById('fix-'+k)?.value)||0);
  bizSave('fixkosten', data);
  bizShowToast('✅ Fixkosten gespeichert');
}

function bizAddPersonal() {
  const p = bizGetPersonal();
  p.push({ name:'', lohn:12, stunden:40 });
  bizSavePersonal(p);
  document.getElementById('personal-list').innerHTML = p.map((pp,i)=>renderPersonalRow(pp,i)).join('');
}

function bizPersonalUpdate(i, field, val) {
  const p = bizGetPersonal();
  if (!p[i]) return;
  p[i][field] = field==='name' ? val : parseFloat(val)||0;
  bizSavePersonal(p);
  // re-render just the list without full tab reload
  document.getElementById('personal-list').innerHTML = p.map((pp,ii)=>renderPersonalRow(pp,ii)).join('');
}

function bizDeletePersonal(i) {
  const p = bizGetPersonal();
  p.splice(i,1);
  bizSavePersonal(p);
  document.getElementById('personal-list').innerHTML = p.length===0
    ? '<p style="color:#8d6562;font-size:13px;text-align:center;padding:20px 0">Noch keine Mitarbeiter eingetragen</p>'
    : p.map((pp,ii)=>renderPersonalRow(pp,ii)).join('');
}

// ═══════════════════════════════════════════════════════════════
// GEWINN-COCKPIT
// ═══════════════════════════════════════════════════════════════

function renderBizCockpit() {
  const pizzaCalc = bizGetPizzaCalc();
  const kassa = bizGetKassa();
  const fix = bizGetFixkosten();
  const personal = bizGetPersonal();
  const settings = bizGetSettings();
  const { y, m } = bizCurrentMonth();

  const monthKassa = kassa.filter(e => e.date.startsWith(y+'-'+String(m).padStart(2,'0')));
  const monthRevenue = monthKassa.reduce((s,e)=>s+(e.gesamt||0),0);
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const einkaufMonth = bizGetEinkaufThisMonth();
  const gewinn = monthRevenue - fixSum - personalMonat - einkaufMonth;
  const gewinnPct = monthRevenue > 0 ? Math.round((gewinn/monthRevenue)*100) : 0;

  // Prev month
  const pm = m===1?12:m-1, py = m===1?y-1:y;
  const prevMonthKassa = kassa.filter(e => e.date.startsWith(py+'-'+String(pm).padStart(2,'0')));
  const prevRevenue = prevMonthKassa.reduce((s,e)=>s+(e.gesamt||0),0);

  // Break-even
  const tagFix = (fixSum+personalMonat)/30;
  const einkaufDay = einkaufMonth/30;
  const breakEvenDay = tagFix + einkaufDay;
  const today = bizToday();
  const todayEntry = kassa.find(e=>e.date===today);
  const todayRev = todayEntry?.gesamt||0;
  const breakPct = Math.min(Math.round((todayRev/Math.max(breakEvenDay,1))*100),100);

  return `
<h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;margin-bottom:20px;display:flex;align-items:center;gap:8px">
  <span class="material-symbols-outlined" style="color:#8B0000">donut_large</span>Gewinn-Cockpit
</h2>

<!-- Monatsübersicht -->
<div style="background:linear-gradient(135deg,#2a0000,#610000);border-radius:18px;padding:28px;margin-bottom:20px;color:#fff">
  <div style="font-size:13px;color:rgba(255,255,255,.7);margin-bottom:8px">${bizMonthName(m)} ${y} — Monats-Übersicht</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px">
    <div><div style="font-size:11px;color:rgba(255,255,255,.6)">Gesamtumsatz</div><div style="font-size:22px;font-weight:800">${bizEur(monthRevenue)}</div></div>
    <div><div style="font-size:11px;color:rgba(255,255,255,.6)">Warenkosten</div><div style="font-size:22px;font-weight:800">−${bizEur(einkaufMonth)}</div></div>
    <div><div style="font-size:11px;color:rgba(255,255,255,.6)">Personalkosten</div><div style="font-size:22px;font-weight:800">−${bizEur(personalMonat)}</div></div>
    <div><div style="font-size:11px;color:rgba(255,255,255,.6)">Fixkosten</div><div style="font-size:22px;font-weight:800">−${bizEur(fixSum)}</div></div>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:13px;color:rgba(255,255,255,.7)">GEWINN VOR STEUER</div>
      <div style="font-size:40px;font-weight:800;color:${gewinn>=0?'#a5f7a0':'#ff9a9a'}">${bizEur(gewinn)}</div>
      <div style="font-size:14px;color:rgba(255,255,255,.7)">Marge: ${gewinnPct}%</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:rgba(255,255,255,.6)">Vormonat (${bizMonthName(pm)})</div>
      <div style="font-size:20px;font-weight:700;color:rgba(255,255,255,.8)">${bizEur(prevRevenue)}</div>
      ${prevRevenue > 0 ? `<div style="font-size:13px;color:${monthRevenue>=prevRevenue?'#a5f7a0':'#ff9a9a'}">${monthRevenue>=prevRevenue?'▲':'▼'} ${bizEur(Math.abs(monthRevenue-prevRevenue))} (${Math.abs(Math.round(((monthRevenue-prevRevenue)/prevRevenue)*100))}%)</div>` : ''}
    </div>
  </div>
</div>

<!-- Break-Even heute -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px;margin-bottom:20px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:12px;display:flex;align-items:center;gap:6px">
    <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">flag</span>
    Break-Even heute
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">
    <span style="color:#5a403c">Heute nötig (Kosten): <strong>${bizEur(breakEvenDay)}</strong></span>
    <span style="color:${todayRev>=breakEvenDay?'#386a20':'#ba1a1a'};font-weight:700">Heute: ${bizEur(todayRev)} (${breakPct}%)</span>
  </div>
  <div style="height:14px;background:#e3beb8;border-radius:8px;overflow:hidden;margin-bottom:8px">
    <div style="height:100%;width:${breakPct}%;background:${breakPct>=100?'linear-gradient(90deg,#2e7d32,#4caf50)':'linear-gradient(90deg,#610000,#8B0000)'};border-radius:8px;transition:width .5s"></div>
  </div>
  <p style="font-size:12px;color:${todayRev>=breakEvenDay?'#386a20':'#ba1a1a'};font-weight:600">
    ${todayRev>=breakEvenDay ? '🎉 Tagesziel erreicht! Ab jetzt ist alles Gewinn.' : `Noch ${bizEur(Math.max(breakEvenDay-todayRev,0))} bis zum Gewinn-Bereich.`}
  </p>
</div>

<!-- Charts -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:20px">

  <!-- Chart A: Umsatz letzte 7 Tage -->
  <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:20px">
    <div style="font-weight:700;font-size:14px;color:#261816;margin-bottom:12px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px;color:#8B0000">bar_chart</span>
      Umsatz letzte 7 Tage
    </div>
    <canvas id="bizChartUmsatz" height="200" style="width:100%;max-height:220px"></canvas>
  </div>

  <!-- Chart B: Kostenaufschlüsselung -->
  <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:20px">
    <div style="font-weight:700;font-size:14px;color:#261816;margin-bottom:12px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px;color:#8B0000">donut_large</span>
      Kostenaufschlüsselung
    </div>
    <canvas id="bizChartKosten" height="200" style="width:100%;max-height:220px"></canvas>
  </div>

  <!-- Chart C: Mitarbeiter Stunden/Woche -->
  <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:20px">
    <div style="font-weight:700;font-size:14px;color:#261816;margin-bottom:12px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px;color:#8B0000">badge</span>
      Mitarbeiter Std/Woche
    </div>
    <canvas id="bizChartPersonal" height="200" style="width:100%;max-height:220px"></canvas>
  </div>

</div>

<!-- Pizza-Kalkulation -->
<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;overflow:hidden;margin-bottom:8px">
  <div style="padding:16px 20px;border-bottom:1px solid #e3beb8;display:flex;align-items:center;justify-content:space-between">
    <span style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;color:#261816">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">local_pizza</span>Gewinn pro Pizza
    </span>
    <button onclick="bizSavePizzaCalcBtn()"
      style="padding:7px 14px;border-radius:9px;border:none;background:#8B0000;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
      Speichern
    </button>
  </div>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#fff8f6">
        <th style="padding:10px 14px;text-align:left;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Pizza</th>
        <th style="padding:10px 14px;text-align:right;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Preis (€)</th>
        <th style="padding:10px 14px;text-align:right;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Kosten (€)</th>
        <th style="padding:10px 14px;text-align:right;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Rohgewinn</th>
        <th style="padding:10px 14px;text-align:center;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Marge</th>
        <th style="padding:10px 14px;text-align:left;font-weight:600;color:#5a403c;border-bottom:1px solid #e3beb8">Ampel</th>
      </tr></thead>
      <tbody id="pizza-calc-tbody">
        ${pizzaCalc.map((p,i) => {
          const rg = (p.preis||0)-(p.kosten||0);
          const marge = p.preis>0 ? Math.round((rg/p.preis)*100) : 0;
          const ampel = marge>=60?'🟢':marge>=40?'🟡':'🔴';
          const tip = marge>=60?'':'<span style="font-size:10px;color:#c8860a"> ← mehr bewerben!</span>';
          return `<tr style="background:${i%2===0?'#fff':'#fffbfa'}">
            <td style="padding:9px 14px;font-weight:600;color:#261816">${p.name}</td>
            <td style="padding:9px 14px;text-align:right">
              <input type="number" value="${p.preis}" step="0.10" min="0"
                onchange="bizPizzaCalcChange(${i},'preis',this.value)"
                style="width:72px;padding:4px 6px;border-radius:6px;border:1px solid #e3beb8;font-size:12px;text-align:right;font-family:inherit;outline:none">
            </td>
            <td style="padding:9px 14px;text-align:right">
              <input type="number" value="${p.kosten}" step="0.10" min="0"
                onchange="bizPizzaCalcChange(${i},'kosten',this.value)"
                style="width:72px;padding:4px 6px;border-radius:6px;border:1px solid #e3beb8;font-size:12px;text-align:right;font-family:inherit;outline:none">
            </td>
            <td style="padding:9px 14px;text-align:right;font-weight:700;color:#610000">${bizEur(rg)}</td>
            <td style="padding:9px 14px;text-align:center;font-weight:700;color:${marge>=60?'#386a20':marge>=40?'#c8860a':'#ba1a1a'}">${marge}%</td>
            <td style="padding:9px 14px">${ampel}${tip}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
</div>`;

  // Charts nach DOM-Bereitschaft initialisieren
  setTimeout(() => {
    _bizInitCharts();
  }, 50);
}

// ── Chart-Initialisierung ──
function _bizInitCharts() {
  if (typeof Chart === 'undefined') return;

  // ── Chart A: Umsatz letzte 7 Tage (Bar) ──
  const kassa = bizGetKassa();
  const last7Labels = [];
  const last7Data = [];
  const dayShort = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0,10);
    const entry = kassa.find(e => e.date === ds);
    last7Labels.push(dayShort[d.getDay()]);
    last7Data.push(entry ? (entry.gesamt||0) : 0);
  }
  if (window._bizChart_Umsatz) window._bizChart_Umsatz.destroy();
  const ctxU = document.getElementById('bizChartUmsatz');
  if (ctxU) {
    window._bizChart_Umsatz = new Chart(ctxU, {
      type: 'bar',
      data: {
        labels: last7Labels,
        datasets: [{
          label: 'Umsatz (€)',
          data: last7Data,
          backgroundColor: '#8B0000',
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => '€ ' + ctx.parsed.y.toFixed(2)
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 11 },
              callback: v => '€' + v
            },
            grid: { color: '#f0e0dc' }
          }
        }
      }
    });
  }

  // ── Chart B: Kostenaufschlüsselung (Doughnut) ──
  const fix = bizGetFixkosten();
  const kostenLabels = ['Miete','Strom','Versicherung','Buchhaltung','Sonstiges'];
  const kostenKeys   = ['miete','strom','versicherung','buchhaltung','sonstige'];
  const kostenData   = kostenKeys.map(k => +(fix[k]||0));
  const kostenColors = ['#8B0000','#c0392b','#e07b6a','#c8860a','#5a403c'];
  if (window._bizChart_Kosten) window._bizChart_Kosten.destroy();
  const ctxK = document.getElementById('bizChartKosten');
  if (ctxK) {
    const hasKosten = kostenData.some(v => v > 0);
    window._bizChart_Kosten = new Chart(ctxK, {
      type: 'doughnut',
      data: {
        labels: kostenLabels,
        datasets: [{
          data: hasKosten ? kostenData : [1],
          backgroundColor: hasKosten ? kostenColors : ['#e3beb8'],
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: ctx => hasKosten ? (ctx.label + ': € ' + ctx.parsed.toFixed(2)) : 'Keine Daten'
            }
          }
        }
      }
    });
    if (!hasKosten) {
      const noDataNote = document.createElement('p');
      noDataNote.style.cssText = 'text-align:center;font-size:11px;color:#8d6562;margin-top:8px';
      noDataNote.textContent = 'Noch keine Fixkosten eingetragen';
      ctxK.parentNode.appendChild(noDataNote);
    }
  }

  // ── Chart C: Mitarbeiter Stunden/Woche (Horizontal Bar) ──
  const personal = bizGetPersonal();
  const maNames = personal.length > 0 ? personal.map(p => p.name||'(ohne Name)') : ['Kein Personal'];
  const maStunden = personal.length > 0 ? personal.map(p => +(p.stunden||0)) : [0];
  if (window._bizChart_Personal) window._bizChart_Personal.destroy();
  const ctxP = document.getElementById('bizChartPersonal');
  if (ctxP) {
    window._bizChart_Personal = new Chart(ctxP, {
      type: 'bar',
      data: {
        labels: maNames,
        datasets: [{
          label: 'Std/Woche',
          data: maStunden,
          backgroundColor: '#610000',
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ctx.parsed.x + ' Std/Woche'
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { font: { size: 11 }, callback: v => v + 'h' },
            grid: { color: '#f0e0dc' }
          },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }
}

function bizPizzaCalcChange(i, field, val) {
  const d = bizGetPizzaCalc();
  d[i][field] = parseFloat(val)||0;
  bizSavePizzaCalc(d);
  // re-render just the tbody
  const tbody = document.getElementById('pizza-calc-tbody');
  if (!tbody) return;
  const pizzaCalc = d;
  tbody.innerHTML = pizzaCalc.map((p,idx) => {
    const rg=(p.preis||0)-(p.kosten||0);
    const marge=p.preis>0?Math.round((rg/p.preis)*100):0;
    const ampel=marge>=60?'🟢':marge>=40?'🟡':'🔴';
    const tip=marge>=60?'':'<span style="font-size:10px;color:#c8860a"> ← mehr bewerben!</span>';
    return `<tr style="background:${idx%2===0?'#fff':'#fffbfa'}">
      <td style="padding:9px 14px;font-weight:600;color:#261816">${p.name}</td>
      <td style="padding:9px 14px;text-align:right">
        <input type="number" value="${p.preis}" step="0.10" min="0" onchange="bizPizzaCalcChange(${idx},'preis',this.value)" style="width:72px;padding:4px 6px;border-radius:6px;border:1px solid #e3beb8;font-size:12px;text-align:right;font-family:inherit;outline:none">
      </td>
      <td style="padding:9px 14px;text-align:right">
        <input type="number" value="${p.kosten}" step="0.10" min="0" onchange="bizPizzaCalcChange(${idx},'kosten',this.value)" style="width:72px;padding:4px 6px;border-radius:6px;border:1px solid #e3beb8;font-size:12px;text-align:right;font-family:inherit;outline:none">
      </td>
      <td style="padding:9px 14px;text-align:right;font-weight:700;color:#610000">${bizEur(rg)}</td>
      <td style="padding:9px 14px;text-align:center;font-weight:700;color:${marge>=60?'#386a20':marge>=40?'#c8860a':'#ba1a1a'}">${marge}%</td>
      <td style="padding:9px 14px">${ampel}${tip}</td>
    </tr>`;
  }).join('');
}

function bizSavePizzaCalcBtn() { bizShowToast('✅ Pizza-Kalkulation gespeichert'); }

// ═══════════════════════════════════════════════════════════════
// MONATSBERICHT
// ═══════════════════════════════════════════════════════════════

function renderBizReport() {
  const { y, m } = bizCurrentMonth();
  const settings = bizGetSettings();
  const kassa = bizGetKassa();
  const fix = bizGetFixkosten();
  const personal = bizGetPersonal();

  const monthStr = y+'-'+String(m).padStart(2,'0');
  const monthKassa = kassa.filter(e=>e.date.startsWith(monthStr)).sort((a,b)=>a.date.localeCompare(b.date));
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const einkaufMonth = bizGetEinkaufThisMonth();

  let totalBrutto=0, totalMwst10=0, totalMwst20=0, totalNetto=0;
  const rows = monthKassa.map(e => {
    const sa = e.speiseAnteil??settings.speiseAnteil;
    const speise = (e.gesamt||0)*(sa/100);
    const getraenk = (e.gesamt||0)*((100-sa)/100);
    const m10 = speise*(10/110), m20 = getraenk*(20/120);
    const netto = (e.gesamt||0)-m10-m20;
    totalBrutto+=e.gesamt||0; totalMwst10+=m10; totalMwst20+=m20; totalNetto+=netto;
    return { ...e, m10, m20, netto };
  });

  const gewinn = totalNetto - einkaufMonth - personalMonat - fixSum;

  // Wochenweise summieren
  const weekSums = {};
  rows.forEach(r => {
    const d=new Date(r.date); const w=Math.ceil(d.getDate()/7);
    if (!weekSums[w]) weekSums[w]={brutto:0,m10:0,m20:0,netto:0};
    weekSums[w].brutto+=r.netto+r.m10+r.m20;
    weekSums[w].m10+=r.m10; weekSums[w].m20+=r.m20; weekSums[w].netto+=r.netto;
  });

  return `
<div id="biz-report-printable">
<style>
  @media print {
    body > *:not(#panel-business) { display:none!important; }
    header,nav { display:none!important; }
    #panel-business { display:block!important; padding:0; }
    .biz-section:not(#biz-report) { display:none!important; }
    .no-print { display:none!important; }
    #biz-report { padding:0; }
    table { page-break-inside:auto; }
    tr { page-break-inside:avoid; }
  }
</style>

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
  <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;display:flex;align-items:center;gap:8px">
    <span class="material-symbols-outlined" style="color:#8B0000">summarize</span>Monatsbericht
  </h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap" class="no-print">
    <button onclick="window.print()"
      style="padding:10px 18px;border-radius:10px;border:none;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">print</span> Drucken / PDF
    </button>
    <button onclick="bizCopyReport()"
      style="padding:10px 18px;border-radius:10px;border:1.5px solid #8B0000;background:#fff0ee;color:#8B0000;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">content_copy</span> Als Text kopieren
    </button>
    <button onclick="bizExportData()"
      style="padding:10px 18px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;color:#5a403c;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">download</span> Daten exportieren
    </button>
  </div>
</div>

<!-- Kopfzeile -->
<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:20px 24px;margin-bottom:20px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div>
      <div style="font-size:20px;font-weight:800;color:#8B0000;font-family:'Plus Jakarta Sans',sans-serif">Ali Shama KG</div>
      <div style="font-size:14px;color:#5a403c">Pizzeria Wien</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:16px;font-weight:700;color:#261816">${bizMonthName(m)} ${y}</div>
      <div style="font-size:12px;color:#5a403c">UID: ${settings.uid}</div>
    </div>
  </div>
</div>

<!-- Einnahmen-Tabelle -->
<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;overflow:hidden;margin-bottom:20px">
  <div style="padding:14px 20px;background:#fff0ee;border-bottom:1px solid #e3beb8;font-weight:700;font-size:14px;color:#8B0000">
    EINNAHMEN — ${bizMonthName(m)} ${y}
  </div>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#fff8f6">
        <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e3beb8;color:#5a403c">Datum</th>
        <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e3beb8;color:#5a403c">Tag</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">Brutto</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">Netto</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">MwSt 10%</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">MwSt 20%</th>
      </tr></thead>
      <tbody>
        ${rows.length===0 ? '<tr><td colspan="6" style="padding:20px;text-align:center;color:#8d6562">Keine Einträge für diesen Monat</td></tr>' :
          rows.map((r,i)=>{
            const showWeek = i===0 || Math.ceil(new Date(rows[i-1].date).getDate()/7) !== Math.ceil(new Date(r.date).getDate()/7);
            const wn = Math.ceil(new Date(r.date).getDate()/7);
            const ws = weekSums[wn];
            let out = '';
            if (showWeek && i>0) out += `<tr style="background:#fff8f6"><td colspan="2" style="padding:6px 12px;font-size:11px;font-weight:700;color:#8B0000">Woche ${wn-1} Summe</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.brutto||0)}</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.netto||0)}</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.m10||0)}</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.m20||0)}</td></tr>`;
            out += `<tr style="background:${i%2===0?'#fff':'#fffbfa'}">
              <td style="padding:7px 12px;color:#261816">${r.date.split('-').reverse().join('.')}</td>
              <td style="padding:7px 12px;color:#5a403c">${bizDayName(r.date)}</td>
              <td style="padding:7px 12px;text-align:right;font-weight:600">${bizEur(r.gesamt||0)}</td>
              <td style="padding:7px 12px;text-align:right">${bizEur(r.netto)}</td>
              <td style="padding:7px 12px;text-align:right">${bizEur(r.m10)}</td>
              <td style="padding:7px 12px;text-align:right">${bizEur(r.m20)}</td>
            </tr>`;
            return out;
          }).join('')}
        <tr style="background:#fff0ee;font-weight:700">
          <td colspan="2" style="padding:10px 12px;color:#8B0000">GESAMT</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalBrutto)}</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalNetto)}</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalMwst10)}</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalMwst20)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Ausgaben-Tabelle -->
<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;overflow:hidden;margin-bottom:20px">
  <div style="padding:14px 20px;background:#fff8f6;border-bottom:1px solid #e3beb8;font-weight:700;font-size:14px;color:#261816">
    AUSGABEN — ${bizMonthName(m)} ${y}
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <tbody>
      <tr style="border-bottom:1px solid #e3beb8"><td style="padding:10px 16px;color:#5a403c">Wareneinkauf</td><td style="padding:10px 16px;text-align:right;font-weight:600">${bizEur(einkaufMonth)}</td></tr>
      <tr style="border-bottom:1px solid #e3beb8"><td style="padding:10px 16px;color:#5a403c">Personalkosten</td><td style="padding:10px 16px;text-align:right;font-weight:600">${bizEur(personalMonat)}</td></tr>
      <tr style="border-bottom:1px solid #e3beb8"><td style="padding:10px 16px;color:#5a403c">Fixkosten (Miete, Strom, etc.)</td><td style="padding:10px 16px;text-align:right;font-weight:600">${bizEur(fixSum)}</td></tr>
      <tr style="background:#fff0ee;font-weight:700"><td style="padding:10px 16px;color:#8B0000">GESAMT AUSGABEN</td><td style="padding:10px 16px;text-align:right;color:#8B0000">${bizEur(einkaufMonth+personalMonat+fixSum)}</td></tr>
    </tbody>
  </table>
</div>

<!-- Zusammenfassung -->
<div style="background:#fff;border:2px solid #8B0000;border-radius:14px;padding:24px">
  <div style="font-weight:800;font-size:16px;color:#8B0000;margin-bottom:16px">ZUSAMMENFASSUNG</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:16px">
    <div style="padding:10px;background:#fff8f6;border-radius:8px">
      <div style="color:#5a403c">Umsatz Netto gesamt</div><div style="font-weight:700;font-size:16px">${bizEur(totalNetto)}</div>
    </div>
    <div style="padding:10px;background:#fff8f6;border-radius:8px">
      <div style="color:#5a403c">Umsatz Brutto gesamt</div><div style="font-weight:700;font-size:16px">${bizEur(totalBrutto)}</div>
    </div>
    <div style="padding:10px;background:#fff0ee;border-radius:8px">
      <div style="color:#5a403c">MwSt 10% (ans Finanzamt)</div><div style="font-weight:700;font-size:16px;color:#c8860a">${bizEur(totalMwst10)}</div>
    </div>
    <div style="padding:10px;background:#fff0ee;border-radius:8px">
      <div style="color:#5a403c">MwSt 20% (ans Finanzamt)</div><div style="font-weight:700;font-size:16px;color:#c8860a">${bizEur(totalMwst20)}</div>
    </div>
    <div style="padding:10px;background:#fff8f6;border-radius:8px">
      <div style="color:#5a403c">Gesamtkosten</div><div style="font-weight:700;font-size:16px">${bizEur(einkaufMonth+personalMonat+fixSum)}</div>
    </div>
  </div>
  <div style="background:${gewinn>=0?'#e8f5e9':'#ffdad6'};border-radius:10px;padding:16px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:13px;color:${gewinn>=0?'#1b5e20':'#93000a'};font-weight:600">GEWINN VOR STEUER</div>
      <div style="font-size:32px;font-weight:800;color:${gewinn>=0?'#2e7d32':'#ba1a1a'}">${bizEur(gewinn)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;color:#5a403c">Gewinnmarge</div>
      <div style="font-size:24px;font-weight:800;color:${gewinn>=0?'#2e7d32':'#ba1a1a'}">${totalBrutto>0?Math.round((gewinn/totalBrutto)*100):0}%</div>
    </div>
  </div>
</div>
</div>`;
}

function bizCopyReport() {
  const { y, m } = bizCurrentMonth();
  const kassa = bizGetKassa();
  const fix = bizGetFixkosten();
  const personal = bizGetPersonal();
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const einkaufMonth = bizGetEinkaufThisMonth();
  const monthStr = y+'-'+String(m).padStart(2,'0');
  const monthKassa = kassa.filter(e=>e.date.startsWith(monthStr));
  const umsatz = monthKassa.reduce((s,e)=>s+(e.gesamt||0),0);
  const settings = bizGetSettings();
  const gewinn = umsatz - fixSum - personalMonat - einkaufMonth;

  const text = `Ali Shama KG Pizzeria Wien
Monatsbericht ${bizMonthName(m)} ${y}
UID: ${settings.uid}

EINNAHMEN:
Gesamtumsatz Brutto: ${bizEur(umsatz)}

AUSGABEN:
Wareneinkauf: ${bizEur(einkaufMonth)}
Personal: ${bizEur(personalMonat)}
Fixkosten: ${bizEur(fixSum)}
Gesamt Ausgaben: ${bizEur(einkaufMonth+personalMonat+fixSum)}

GEWINN VOR STEUER: ${bizEur(gewinn)}`;

  navigator.clipboard?.writeText(text).then(() => bizShowToast('✅ Bericht in Zwischenablage kopiert!'))
    .catch(() => { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); bizShowToast('✅ Kopiert!'); });
}

function bizExportData() {
  const data = {
    kassabuch: bizGetKassa(),
    fixkosten: bizGetFixkosten(),
    personal: bizGetPersonal(),
    pizzaCalc: bizGetPizzaCalc(),
    settings: bizGetSettings(),
    exportDatum: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`pizzeria-export-${bizToday()}.json`; a.click();
  URL.revokeObjectURL(url);
  bizShowToast('💾 Export gestartet');
}

// ═══════════════════════════════════════════════════════════════
// EINSTELLUNGEN
// ═══════════════════════════════════════════════════════════════

function renderBizSettings() {
  const settings = bizGetSettings();
  return `
<h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;margin-bottom:20px;display:flex;align-items:center;gap:8px">
  <span class="material-symbols-outlined" style="color:#8B0000">settings</span>Einstellungen
</h2>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px">

  <!-- Firmen-Daten -->
  <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px">
    <div style="font-weight:700;font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">business</span>
      Firmendaten
    </div>
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">UID-Nummer</label>
    <input id="settings-uid" value="${settings.uid}" placeholder="ATU12345678"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:12px;box-sizing:border-box">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Standard Speisen-Anteil (%)</label>
    <input id="settings-speise" type="number" value="${settings.speiseAnteil}" min="0" max="100"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:16px;box-sizing:border-box">
    <button onclick="bizSaveSettings_()"
      style="width:100%;padding:10px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      Einstellungen speichern
    </button>
  </div>

  <!-- Passwort ändern -->
  <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px">
    <div style="font-weight:700;font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">lock</span>
      Passwort ändern
    </div>
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Aktuelles Passwort</label>
    <input type="password" id="pw-current" placeholder="••••••••"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:10px;box-sizing:border-box">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Neues Passwort</label>
    <input type="password" id="pw-new" placeholder="••••••••"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:10px;box-sizing:border-box">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Neues Passwort wiederholen</label>
    <input type="password" id="pw-confirm" placeholder="••••••••"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:14px;box-sizing:border-box">
    <div id="pw-change-msg" style="font-size:12px;margin-bottom:8px;display:none"></div>
    <button onclick="bizChangePw()"
      style="width:100%;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      Passwort ändern
    </button>
  </div>

  <!-- Daten-Management -->
  <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:24px">
    <div style="font-weight:700;font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">storage</span>
      Daten
    </div>
    <button onclick="bizExportData()"
      style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;color:#5a403c;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">download</span> Alle Daten exportieren (JSON)
    </button>
    <button onclick="bizLogout()"
      style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;color:#8d6562;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">logout</span> Ausloggen
    </button>
    <button onclick="if(confirm('⚠️ Wirklich alle Business-Daten löschen? Dies kann nicht rückgängig gemacht werden!'))bizClearAll()"
      style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;background:#ffdad6;color:#ba1a1a;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">delete_forever</span> Alle Daten löschen
    </button>
  </div>

</div>`;
}

function bizSaveSettings_() {
  const uid = document.getElementById('settings-uid')?.value||'';
  const speiseAnteil = parseInt(document.getElementById('settings-speise')?.value)||80;
  bizSave('settings', { uid, speiseAnteil });
  bizShowToast('✅ Einstellungen gespeichert');
}

function bizChangePw() {
  const cur = document.getElementById('pw-current')?.value||'';
  const nw  = document.getElementById('pw-new')?.value||'';
  const cnf = document.getElementById('pw-confirm')?.value||'';
  const msg = document.getElementById('pw-change-msg');
  const show=(t,ok)=>{ if(msg){msg.textContent=t;msg.style.color=ok?'#386a20':'#ba1a1a';msg.style.display='block';} };
  if (bizHash(cur) !== bizGetPwHash()) { show('Aktuelles Passwort falsch', false); return; }
  if (nw.length < 4) { show('Neues Passwort muss mind. 4 Zeichen haben', false); return; }
  if (nw !== cnf) { show('Passwörter stimmen nicht überein', false); return; }
  localStorage.setItem(BIZ_PW_KEY, bizHash(nw));
  show('✅ Passwort erfolgreich geändert!', true);
  ['pw-current','pw-new','pw-confirm'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
}

function bizLogout() {
  sessionStorage.removeItem(BIZ_AUTH_KEY);
  const lockIcon = document.getElementById('biz-lock-icon');
  if (lockIcon) lockIcon.textContent = 'lock';
  renderBizLocked();
}

function bizClearAll() {
  ['kassa','fixkosten','personal','pizzacalc','settings'].forEach(k => localStorage.removeItem('biz_'+k));
  bizShowToast('🗑️ Alle Business-Daten gelöscht');
  renderBusinessTab();
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS TOAST
// ═══════════════════════════════════════════════════════════════

function bizShowToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:96px;left:50%;transform:translateX(-50%);background:#261816;color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.2);animation:fadeToast .3s ease';
  t.textContent = msg;
  const style = document.createElement('style');
  style.textContent = '@keyframes fadeToast{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ═══════════════════════════════════════════════════════════════
// LOHNABRECHNUNG PDF EXPORT
// ═══════════════════════════════════════════════════════════════

function exportLohnPDF(ma) {
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    bizShowToast('⚠️ PDF-Bibliothek nicht geladen');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const stunden  = +(ma.stunden||0);
  const lohn     = +(ma.lohn||0);
  const wochen   = 4.33;
  const monatsgehalt = stunden * lohn * wochen;

  const heute    = new Date();
  const monatNamen = ['Jänner','Februar','März','April','Mai','Juni',
                      'Juli','August','September','Oktober','November','Dezember'];
  const monatStr = monatNamen[heute.getMonth()] + ' ' + heute.getFullYear();
  const datumStr = heute.toLocaleDateString('de-AT');

  // Dateiname
  const nameSafe  = (ma.name||'mitarbeiter').replace(/\s+/g,'_').toLowerCase();
  const monatFile = monatNamen[heute.getMonth()].toLowerCase() + '_' + heute.getFullYear();
  const filename  = `lohnabrechnung_${nameSafe}_${monatFile}.pdf`;

  // ── Hintergrund-Header ──
  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, 210, 42, 'F');

  // Firmenname
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Pizzeria San Carino', 20, 18);

  // Untertitel
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Lohnabrechnung', 20, 27);

  // Monat rechts oben
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(monatStr, 190, 18, { align: 'right' });

  // ── Mitarbeiter-Block ──
  doc.setTextColor(38, 24, 22);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Mitarbeiter', 20, 58);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Name:', 20, 68);
  doc.setFont('helvetica', 'bold');
  doc.text(ma.name || '—', 70, 68);

  doc.setFont('helvetica', 'normal');
  doc.text('Rolle:', 20, 76);
  doc.setFont('helvetica', 'bold');
  doc.text(ma.rolle || '—', 70, 76);

  // ── Trennlinie ──
  doc.setDrawColor(227, 190, 184);
  doc.setLineWidth(0.5);
  doc.line(20, 84, 190, 84);

  // ── Abrechnungs-Tabelle ──
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(38, 24, 22);
  doc.text('Abrechnung', 20, 94);

  const tableTop = 100;
  const rowH = 10;
  const col1 = 20, col2 = 120, col3 = 190;

  // Tabellen-Header
  doc.setFillColor(255, 240, 238);
  doc.rect(col1, tableTop - 2, 170, rowH, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(90, 64, 60);
  doc.text('Position', col1 + 2, tableTop + 5);
  doc.text('Wert', col3 - 2, tableTop + 5, { align: 'right' });

  const rows = [
    ['Stunden pro Woche',       stunden.toFixed(0) + ' Std'],
    ['Stundenlohn',             '€ ' + lohn.toFixed(2)],
    ['Wochen pro Monat (Ø)',    wochen.toFixed(2)],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(38, 24, 22);
  rows.forEach((row, idx) => {
    const y = tableTop + rowH + (idx * rowH) + 2;
    if (idx % 2 === 1) {
      doc.setFillColor(255, 248, 246);
      doc.rect(col1, y - 6, 170, rowH, 'F');
    }
    doc.setFontSize(10);
    doc.text(row[0], col1 + 2, y);
    doc.text(row[1], col3 - 2, y, { align: 'right' });
  });

  // Bruttogehalt-Zeile (hervorgehoben)
  const bruttoY = tableTop + rowH + (rows.length * rowH) + 4;
  doc.setFillColor(139, 0, 0);
  doc.rect(col1, bruttoY - 6, 170, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bruttogehalt (Monat)', col1 + 2, bruttoY + 1);
  doc.text('€ ' + monatsgehalt.toFixed(2), col3 - 2, bruttoY + 1, { align: 'right' });

  // ── Hinweis ──
  doc.setTextColor(141, 101, 98);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Diese Abrechnung ist ein interner Kostenvoranschlag. Brutto vor Abzügen.', 20, bruttoY + 18);

  // ── Footer ──
  doc.setDrawColor(227, 190, 184);
  doc.line(20, 270, 190, 270);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 64, 60);
  doc.text('Erstellt am ' + datumStr + ' | Pizzeria San Carino', 20, 276);
  doc.text('Seite 1', 190, 276, { align: 'right' });

  doc.save(filename);
  bizShowToast('✅ PDF gespeichert: ' + filename);
}
