// ═══════════════════════════════════════════════════════════════
// Desktop "Mehr" Dropdown
// ═══════════════════════════════════════════════════════════════
const MEHR_DD_TABS = ['upload','verlauf','mitarbeiter','fehlmaterial','checkliste','produkte','geschaefte'];

function toggleMehrDD(e) {
  e.stopPropagation();
  const menu = document.getElementById('mehr-dd-menu');
  const chevron = document.getElementById('mehr-dd-chevron');
  const open = menu.classList.toggle('open');
  if (chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
  if (open) {
    setTimeout(() => document.addEventListener('click', _closeMehrDDOutside), 0);
  }
}
function _closeMehrDDOutside(e) {
  if (!document.getElementById('mehr-dd-wrapper')?.contains(e.target)) {
    closeMehrDD();
    document.removeEventListener('click', _closeMehrDDOutside);
  }
}
function closeMehrDD() {
  document.getElementById('mehr-dd-menu')?.classList.remove('open');
  const chevron = document.getElementById('mehr-dd-chevron');
  if (chevron) chevron.style.transform = '';
}

function _updateMehrDDActive() {
  const btn = document.getElementById('mehr-dd-btn');
  if (!btn) return;
  const anyActive = MEHR_DD_TABS.some(t =>
    document.querySelector('[data-nav-tab="' + t + '"]')?.classList.contains('tab-active')
  );
  btn.classList.toggle('dd-child-active', anyActive);
}

function _updateMobMehrActive() {
  const drawerTabs = ['angebote','suche','upload','verlauf','mitarbeiter','kombis','einkaufsliste','fehlmaterial','bestellung','schichtcheck','wareneinsatz','preisalarm','business'];
  const btn = document.getElementById('mob-mehr-btn');
  if (!btn) return;
  const anyActive = drawerTabs.some(t =>
    document.querySelector('[data-bottom-nav="' + t + '"]')?.classList.contains('mob-active') ||
    document.querySelector('[data-drawer-nav="' + t + '"]')?.classList.contains('mob-active')
  );
  btn.classList.toggle('mob-active', anyActive);
}

// ═══════════════════════════════════════════════════════════════
// LOGIN SYSTEM — 2-Schritt PIN Login
// ═══════════════════════════════════════════════════════════════
const USERS = PIZZERIA_USERS;

// Rollen-Buttons dynamisch generieren
(function buildRoleButtons() {
  const container = document.getElementById('login-role-buttons');
  if (!container) return;
  const roleDescriptions = {
    admin:    'Vollzugriff auf alle Bereiche',
    manager:  'Einkauf, Business & Reports',
    employee: 'Einkaufsliste & Produkte',
    kitchen:  'Speisekarte & Fehlmaterial'
  };
  PIZZERIA_USERS.forEach(u => {
    const parts = u.label.split(' ');
    const icon = parts[0];
    const name = parts.slice(1).join(' ');
    const desc = roleDescriptions[u.role] || u.role;
    const btn = document.createElement('button');
    btn.className = 'login-role-btn';
    btn.innerHTML = `
      <span class="role-icon">${icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;color:#1a0404">${name}</div>
        <div class="role-desc">${desc}</div>
      </div>
      <span style="font-size:16px;color:#d4b0ac">›</span>`;
    btn.onclick = () => selectRole(u.username);
    container.appendChild(btn);
  });
})();

// === Tastatur-Login: Code/Passwort direkt eingeben ===
function loginByCode(inputValue) {
  const code = inputValue.trim();
  if (!code) return;

  // Suche User: erst per PIN, dann per Passwort
  let foundUser = PIZZERIA_USERS.find(u => u.pin === code);
  if (!foundUser) foundUser = PIZZERIA_USERS.find(u => u.password === code);

  if (!foundUser) {
    const errEl = document.getElementById('login-code-error');
    const inp = document.getElementById('login-code-input');
    errEl.style.display = 'block';
    inp.style.borderColor = '#ba1a1a';
    inp.value = '';
    setTimeout(() => { errEl.style.display = 'none'; inp.style.borderColor = '#e3beb8'; }, 2500);
    return;
  }

  // Erfolg: direkt einloggen
  currentUser = foundUser;
  _pinUser = foundUser;
  try { sessionStorage.setItem('pizzeria_user', JSON.stringify(foundUser)); } catch(_) {}
  showApp();
}

// Event-Listener
(function initKeyboardLogin() {
  const inp = document.getElementById('login-code-input');
  if (!inp) return;

  inp.addEventListener('keydown', function(e) {
    document.getElementById('login-code-error').style.display = 'none';
    inp.style.borderColor = '#e3beb8';
    if (e.key === 'Enter') { e.preventDefault(); loginByCode(inp.value); }
  });

  // Autofokus nur auf Desktop (kein Touch)
  if (!('ontouchstart' in window)) {
    setTimeout(() => inp.focus(), 200);
  }
})();

let _pinUser   = null;   // ausgewählter User-Eintrag
let _pinBuffer = [];     // eingegebene Ziffern

function selectRole(username) {
  _pinUser   = PIZZERIA_USERS.find(u => u.username === username);
  _pinBuffer = [];
  if (!_pinUser) return;
  document.getElementById('pin-role-label').textContent = _pinUser.label;
  _pinUpdateDots();
  document.getElementById('login-error').style.display = 'none';
  document.getElementById('login-step1').style.display = 'none';
  document.getElementById('login-step2').style.display = 'block';
}

function pinGoBack() {
  _pinBuffer = [];
  _pinUpdateDots();
  document.getElementById('login-step1').style.display = 'block';
  document.getElementById('login-step2').style.display = 'none';
  document.getElementById('login-error').style.display = 'none';
}

function pinDigit(d) {
  if (_pinBuffer.length >= 4) return;
  _pinBuffer.push(String(d));
  _pinUpdateDots();
  if (_pinBuffer.length === 4) setTimeout(pinConfirm, 120);
}

function pinDelete() {
  if (_pinBuffer.length > 0) { _pinBuffer.pop(); _pinUpdateDots(); }
}

function _pinUpdateDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById('pin-dot-' + i);
    if (!dot) continue;
    dot.style.background    = i < _pinBuffer.length ? '#8B0000' : '#fff';
    dot.style.borderColor   = i < _pinBuffer.length ? '#8B0000' : '#e3beb8';
  }
}

function pinConfirm() {
  const entered = _pinBuffer.join('');
  const expectedPin = _pinUser ? _pinUser.pin : null;
  if (!expectedPin || entered !== expectedPin) {
    // Shake + Fehler
    _pinBuffer = [];
    _pinUpdateDots();
    const err = document.getElementById('login-error');
    err.style.display = 'block';
    // Schritt 1 bleibt ausgeblendet, Fehler im Schritt-2-Bereich anzeigen
    // (Error-div ist im Step1, kurz einblenden)
    return;
  }
  // Erfolg
  currentUser = _pinUser;
  const remember = document.getElementById('login-remember').checked;
  try {
    if (remember) {
      localStorage.setItem('pizzeria_session', JSON.stringify({ username: _pinUser.username, ts: Date.now() }));
    } else {
      localStorage.removeItem('pizzeria_session');
    }
    sessionStorage.setItem('pizzeria_user', JSON.stringify(_pinUser));
  } catch(_) {}
  showApp();
}

// Persistenter Login: beim Laden prüfen
function checkPersistentLogin() {
  try {
    const saved = localStorage.getItem('pizzeria_session');
    if (!saved) return false;
    const { username, ts } = JSON.parse(saved);
    // Max. 7 Tage gültig
    if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem('pizzeria_session');
      return false;
    }
    const user = PIZZERIA_USERS.find(u => u.username === username);
    if (!user) return false;
    currentUser = user;
    return true;
  } catch(_) { return false; }
}

// Alte quickLogin-Funktion bleibt als Fallback
function doLogin() {}  // wird nicht mehr aufgerufen
function quickLogin(u) {
  selectRole(u);
  // PIN auto-confirm mit gespeichertem Pin (für Tests)
  const user = PIZZERIA_USERS.find(x => x.username === u);
  if (user && user.pin) {
    _pinBuffer = user.pin.split('');
    _pinUpdateDots();
    setTimeout(pinConfirm, 200);
  }
}
function toggleLoginPw() {}  // nicht mehr benötigt

const ROLE_TABS = {
  admin:    ['heute','dashboard','kombis','angebote','einkaufsliste','suche','upload','verlauf','mitarbeiter','fehlmaterial','checkliste','produkte','geschaefte','lieferanten','speisekarte','business','dienstplan','aufgaben','schichtcheck','bestellung','lager','wareneinsatz','preisalarm','standardmaterial','statistik','tagesangebote','umsatz','gewinn','buchhaltung','konkurrenz','bewertungen','haccp','mhd','kassenschnitt','urlaub','trinkgeld'],
  manager:  ['heute','dashboard','kombis','angebote','einkaufsliste','suche','upload','verlauf','fehlmaterial','checkliste','lieferanten','speisekarte','dienstplan','aufgaben','schichtcheck','bestellung','lager','wareneinsatz','preisalarm','standardmaterial','statistik','tagesangebote','umsatz','gewinn','buchhaltung','konkurrenz','bewertungen','haccp','mhd','kassenschnitt','urlaub','trinkgeld'],
  employee: ['heute','dashboard','fehlmaterial','checkliste','speisekarte','aufgaben','schichtcheck','bestellung','haccp','mhd','urlaub'],
  kitchen:  ['heute','fehlmaterial','checkliste','speisekarte','schichtcheck','bestellung','lager','haccp','mhd'],
  fahrer:   ['heute','checkliste','schichtcheck','urlaub'],
  service:  ['heute','fehlmaterial','checkliste','speisekarte','schichtcheck','aufgaben','urlaub'],
  reinigung:['heute','checkliste','schichtcheck','urlaub'],
};

const ROLE_COLORS = {
  admin:    'background:#fff0ee;color:#8B0000;border-color:#e3beb8',
  manager:  'background:#fff3e0;color:#e65100;border-color:#ffcc80',
  employee: 'background:#e3f2fd;color:#0d47a1;border-color:#90caf9',
  kitchen:  'background:#e8f5e9;color:#1b5e20;border-color:#a5d6a7',
  fahrer:   'background:#f3e5f5;color:#4a148c;border-color:#ce93d8',
  service:  'background:#e0f7fa;color:#006064;border-color:#80deea',
  reinigung:'background:#fafafa;color:#37474f;border-color:#b0bec5',
};

let currentUser = null;

// doLogin + quickLogin werden jetzt durch PIN-System ersetzt (siehe oben)

function doLogout() {
  currentUser = null;
  _pinBuffer = [];
  _pinUser   = null;
  try { sessionStorage.removeItem('pizzeria_user'); } catch(_) {}
  try { localStorage.removeItem('pizzeria_session'); } catch(_) {}
  // Schritt 1 wieder anzeigen
  document.getElementById('login-step1').style.display = 'block';
  document.getElementById('login-step2').style.display = 'none';
  document.getElementById('login-error').style.display = 'none';
  document.getElementById('login-remember').checked = false;
  document.getElementById('login-screen').classList.remove('hide');
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('settings-btn').style.display = 'none';
  document.getElementById('role-badge').style.display = 'none';
  // Tastatur-Login zurücksetzen
  const codeInp = document.getElementById('login-code-input');
  if (codeInp) { codeInp.value = ''; }
  const codeErr = document.getElementById('login-code-error');
  if (codeErr) codeErr.style.display = 'none';
  // Fokus auf Desktop
  if (!('ontouchstart' in window)) {
    setTimeout(() => { const ci = document.getElementById('login-code-input'); if (ci) ci.focus(); }, 200);
  }
}

function showApp() {
  document.getElementById('login-screen').classList.add('hide');

  // Sync starten
  if (typeof syncManager !== 'undefined' && !syncManager.connected) {
    syncManager.init();
  }

  // Role badge
  const rb = document.getElementById('role-badge');
  rb.textContent = currentUser.label;
  rb.style.cssText = 'display:inline-flex;align-items:center;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;border:1.5px solid;' + (ROLE_COLORS[currentUser.role] || '');

  // Logout + Settings button
  document.getElementById('logout-btn').style.display = 'flex';
  document.getElementById('settings-btn').style.display = 'flex';
  // DB Browser nur für Admin
  var dbBtn = document.getElementById('db-browser-btn');
  if (dbBtn) dbBtn.style.display = (currentUser.role === 'admin') ? 'flex' : 'none';

  // Tabs je nach Rolle anzeigen/verstecken
  const allowed = ROLE_TABS[currentUser.role] || [];
  document.querySelectorAll('#staff-tab-bar [data-nav-tab]').forEach(b => {
    b.style.display = allowed.includes(b.dataset.navTab) ? '' : 'none';
  });
  document.querySelectorAll('[data-bottom-nav]').forEach(b => {
    b.style.display = allowed.includes(b.dataset.bottomNav) ? '' : 'none';
  });
  document.querySelectorAll('[data-drawer-nav]').forEach(b => {
    b.style.display = allowed.includes(b.dataset.drawerNav) ? '' : 'none';
  });

  // Leere Nav-Gruppen ausblenden
  document.querySelectorAll('.nav-group').forEach(grp => {
    const items = grp.querySelectorAll('[data-nav-tab]');
    const anyVisible = Array.from(items).some(b => b.style.display !== 'none');
    grp.style.display = anyVisible ? '' : 'none';
  });

  // Business-Button nur fuer Admin
  const bizBtn = document.getElementById('biz-header-btn');
  if (bizBtn) bizBtn.style.display = currentUser.role === 'admin' ? '' : 'none';
  const einkaufBtn = document.getElementById('einkauf-log-btn');
  if (einkaufBtn) einkaufBtn.style.display = 'flex';

  // App initialisieren
  const unlocked = bizIsAuth();
  const li1 = document.getElementById('biz-lock-icon');
  const li2 = document.getElementById('mob-biz-lock');
  if (li1) li1.textContent = unlocked ? 'lock_open' : 'lock';
  if (li2) li2.textContent = unlocked ? 'lock_open' : 'lock';

  fmUpdateBadge();
  clUpdateBadge();
  elUpdateBadge();
  aufgUpdateBadge();

  // switchTab wrappen damit Mehr-Buttons aktualisiert werden
  const _orig = window.switchTab;
  window.switchTab = function(tab) {
    closeMehrDD();
    _orig(tab);
    _updateMehrDDActive();
    _updateMobMehrActive();
  };

  // Kassenbuch migrieren + aus Server laden, dann ersten Tab öffnen
  const _openStartTab = () => {
    const savedTab = localStorage.getItem('psc_last_tab');
    const startTab = (savedTab && allowed.includes(savedTab))
      ? savedTab
      : (allowed.includes('dashboard') ? 'dashboard' : (allowed[0] || 'kombis'));
    switchTab(startTab);
    renderStatsDashboard();
  };
  if (typeof kbMigrateIfNeeded === 'function') {
    kbMigrateIfNeeded().then(() => kbSync()).catch(() => {}).finally(_openStartTab);
  } else {
    _openStartTab();
  }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════
function renderDashboardTab() {
  const panel = document.getElementById('panel-dashboard');
  if (!panel) return;

  // Live-Uhr: alten Interval aufräumen
  if (window._dashboardClockInterval) {
    clearInterval(window._dashboardClockInterval);
    window._dashboardClockInterval = null;
  }

  try {
    const now = new Date();
    const today = now.toISOString().slice(0,10);
    const hour = now.getHours();
    const isAdminOrManager = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');

    // Begrüßung
    const userName = currentUser ? (currentUser.name || currentUser.username || 'Ali') : 'Ali';
    const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    const weekday = now.toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    const timeStr = now.toLocaleTimeString('de-AT', {hour:'2-digit', minute:'2-digit'});

    // Fehlmaterial
    let fmOpen = 0;
    try {
      const fm = (typeof FM_DATA !== 'undefined') ? FM_DATA : JSON.parse(localStorage.getItem('pizzeria_fehlmaterial')||'[]');
      fmOpen = fm.filter(e => e.status === 'offen').length;
    } catch(_) {}

    // Lager kritisch
    let lagerKritisch = 0;
    let lagerKritischArtikel = [];
    try {
      const lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]');
      lagerKritischArtikel = lager.filter(a => a.menge <= a.mindest);
      lagerKritisch = lagerKritischArtikel.length;
    } catch(_) {}

    // Preisalarm
    let preisAlarm = 0;
    try {
      const pa = JSON.parse(localStorage.getItem('pizzeria_preisalarm_rules')||'[]');
      preisAlarm = pa.filter(e => e.aktiv && e._ausgeloest).length;
    } catch(_) {}

    // Aufgaben
    let aufgabenHeute = [], aufgabenOffen = [];
    try {
      const alle = JSON.parse(localStorage.getItem('pizzeria_aufgaben')||'[]');
      aufgabenHeute = alle.filter(a => a.status !== 'erledigt' && !a.erledigt && a.faellig === today);
      const prio = {hoch:0, mittel:1, niedrig:2};
      aufgabenOffen = alle.filter(a => a.status !== 'erledigt' && !a.erledigt)
        .sort((a,b) => (prio[a.prioritaet]||1) - (prio[b.prioritaet]||1))
        .slice(0, 5);
    } catch(_) {}

    // Schicht-Check Öffnung
    const OEFFNUNG = ['Kasse öffnen & Kassenstand prüfen','Kühlschrank & Temperaturen kontrollieren','Mise en place vorbereiten','Küche reinigen & desinfizieren','Tagesbestellung prüfen','Mitarbeiter einweisen','Musik & Beleuchtung einstellen','Hygiene-Check durchführen'];
    let checks = {};
    try {
      checks = JSON.parse(localStorage.getItem('pizzeria_schichtcheck')||'{}');
      if (checks.datum !== today) checks = {datum:today, oeffnung:{}, schliessung:{}};
    } catch(_) {}
    const oeffnungChecks = checks.oeffnung || {};
    const oCount = Object.keys(oeffnungChecks).filter(k => !k.endsWith('_z')).length;

    // Umsatz (nur Admin/Manager)
    let umsatzHeute = 0, umsatzMonat = 0, umsatzZiel = 0;
    if (isAdminOrManager) {
      try {
        const einnahmen = JSON.parse(localStorage.getItem('pizzeria_umsatz_einnahmen')||'[]');
        const monatPfx = today.slice(0,7);
        einnahmen.forEach(e => {
          const sum = (e.kasse||0) + (e.lieferdienst||0);
          if (e.datum === today) umsatzHeute += sum;
          if (e.datum && e.datum.startsWith(monatPfx)) umsatzMonat += sum;
        });
        umsatzZiel = parseFloat(localStorage.getItem('pizzeria_umsatz_ziel')||'0') || 0;
      } catch(_) {}
    }

    // MHD-Warnungen
    let mhdAbgelaufen = 0, mhdBald = 0;
    try {
      const mhdDaten = JSON.parse(localStorage.getItem('psc_mhd') || '[]');
      const heuteD = new Date(); heuteD.setHours(0,0,0,0);
      mhdDaten.forEach(p => {
        const dt = new Date(p.mhd); dt.setHours(0,0,0,0);
        const diff = Math.round((dt - heuteD) / 86400000);
        if (diff < 0) mhdAbgelaufen++;
        else if (diff <= 3) mhdBald++;
      });
    } catch(_) {}

    // Kassenschnitt heute
    let kassenschnittHeute = null;
    try {
      const ks = JSON.parse(localStorage.getItem('psc_kassenschnitt') || '[]');
      kassenschnittHeute = ks.find(e => e.datum === today) || null;
    } catch(_) {}

    // Kassenbuch KPIs
    let kbEinH=0, kbAusH=0, kbEinM=0, kbAusM=0;
    try {
      const kbAll = kbGet();
      const thisMonth = today.slice(0,7);
      kbAll.forEach(e => {
        const d=(e.datum||'').slice(0,10), m=(e.datum||'').slice(0,7);
        const v=parseFloat(e.brutto||0);
        if(d===today){ if(e.typ==='einnahme') kbEinH+=v; else kbAusH+=v; }
        if(m===thisMonth){ if(e.typ==='einnahme') kbEinM+=v; else kbAusM+=v; }
      });
    } catch(_) {}

    // Helper
    const fmt2 = n => n.toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2});
    const bar = (pct, color) => `<div style="height:8px;border-radius:4px;background:#f0e4e1;overflow:hidden"><div class="progress-fill" style="height:100%;border-radius:4px;background:${color};width:${Math.min(100,pct)}%"></div></div>`;
    const barColor = pct => pct >= 80 ? '#2e7d32' : pct >= 50 ? '#f9a825' : '#c62828';

    // ── BEREICH 1: Header ──
    let html = `
    <div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:16px;padding:20px 24px;margin-bottom:20px;color:#fff">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="font-size:22px;font-weight:800;color:#fff;margin:0 0 4px">${greeting}, ${_esc(userName)}! 👋</h2>
          <p style="font-size:14px;color:rgba(255,255,255,.8);margin:0">${weekday}</p>
        </div>
        <div id="dashboard-clock" style="font-size:28px;font-weight:900;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-1px">${timeStr}</div>
      </div>
    </div>`;

    // ── BEREICH 2: Alerts (nur wenn vorhanden) ──
    const alerts = [];
    // Personalkosten-Alarm
    if (isAdminOrManager && umsatzMonat > 0) {
      try {
        const personal = bizGetPersonal ? bizGetPersonal() : [];
        const personalMonatVal = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
        const alarmGrenze = parseFloat(localStorage.getItem('psc_personal_alarm_pct')||'35')||35;
        const personalPct = Math.round((personalMonatVal / umsatzMonat) * 100);
        if (personalPct > alarmGrenze) alerts.push({icon:'🔴', text:`Personalkosten <strong>${personalPct}%</strong> des Umsatzes — Grenze: ${alarmGrenze}%`, tab:'business'});
      } catch(_) {}
    }
    if (fmOpen > 0)            alerts.push({icon:'🔴', text:`Fehlmaterial offen: <strong>${fmOpen} Artikel</strong>`,                      tab:'fehlmaterial'});
    if (lagerKritisch > 0)     alerts.push({icon:'🔴', text:`${lagerKritisch} Artikel brauchen Nachbestellung`, tab:'lager', expandable:true, artikelListe:lagerKritischArtikel});
    if (preisAlarm > 0)        alerts.push({icon:'🔴', text:`Preisalarm: <strong>${preisAlarm} Produkte</strong> über Zielpreis`,             tab:'preisalarm'});
    if (aufgabenHeute.length)  alerts.push({icon:'🟡', text:`Aufgaben fällig heute: <strong>${aufgabenHeute.length} Aufgaben</strong>`,       tab:'aufgaben', expandable:true, artikelListe:aufgabenHeute, nameField:'titel'});
    if (mhdAbgelaufen > 0)     alerts.push({icon:'🔴', text:`MHD: <strong>${mhdAbgelaufen} Produkte abgelaufen</strong> — sofort entfernen!`, tab:'mhd'});
    if (mhdBald > 0)           alerts.push({icon:'🟡', text:`MHD: <strong>${mhdBald} Produkte</strong> laufen in ≤3 Tagen ab`,                tab:'mhd'});

    if (alerts.length > 0) {
      html += `<div style="background:#ffebee;border:1.5px solid #ef9a9a;border-radius:16px;padding:16px 20px;margin-bottom:20px">
        <div style="font-size:13px;font-weight:800;color:#c62828;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">⚠️ Kritische Meldungen</div>
        <div style="display:flex;flex-direction:column;gap:8px">`;
      for (const a of alerts) {
        if (a.expandable) {
          const vis = a.artikelListe.slice(0, 8);
          const rest = a.artikelListe.length - 8;
          const liItems = vis.map(x => {
            const label = x[a.nameField||'name'] || x.name || x.titel || '—';
            const detail = a.nameField === 'titel'
              ? (x.prioritaet ? ` — ${x.prioritaet}` : '')
              : ` — ${x.menge||''} ${x.einheit||''}`;
            return `<li style="padding:3px 0;font-size:12px;color:#5a403c"><strong>${_esc(label)}</strong>${detail}</li>`;
          }).join('');
          const moreLink = rest > 0 ? `<li style="padding:3px 0"><span onclick="switchTab('${a.tab}')" style="color:#c62828;cursor:pointer;font-size:12px;font-weight:700">... und ${rest} weitere → Zum Tab</span></li>` : '';
          const detId = `dash-det-${a.tab}`;
          html += `<div style="padding:8px 12px;border-radius:10px;background:#fff;border:1px solid #ef9a9a">
            <div onclick="var d=document.getElementById('${detId}');d.style.display=d.style.display==='none'?'block':'none'" style="display:flex;align-items:center;gap:10px;cursor:pointer">
              <span style="font-size:15px">${a.icon}</span>
              <span style="font-size:13px;color:#c62828;flex:1"><strong>${a.text.replace(/<[^>]*>/g,'')}</strong> ▼</span>
            </div>
            <div id="${detId}" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid #fecdd3">
              <ul style="margin:0;padding:0 0 0 16px;list-style:disc">${liItems}${moreLink}</ul>
            </div>
          </div>`;
        } else {
          html += `<div onclick="switchTab('${a.tab}')" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 12px;border-radius:10px;background:#fff;border:1px solid #ef9a9a">
            <span style="font-size:15px">${a.icon}</span>
            <span style="font-size:13px;color:#c62828;flex:1">${a.text}</span>
            <span class="material-symbols-outlined" style="font-size:16px;color:#c62828">arrow_forward</span>
          </div>`;
        }
      }
      html += `</div></div>`;
    }

    // Notification Permission Hinweis
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      html += '<div style="background:#e3f2fd;border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;cursor:pointer" onclick="requestNotificationPermission();this.style.display=\'none\'">';
      html += '<span style="font-size:22px">🔔</span>';
      html += '<div><div style="font-weight:600;font-size:13px;color:#1565c0">Benachrichtigungen aktivieren</div>';
      html += '<div style="font-size:12px;color:#5a7fa0;margin-top:2px">Erhalte Alarme bei leerem Lager, neuen Aufgaben etc.</div></div>';
      html += '</div>';
    }

    // ── BEREICHE 3 & 4: 2-Spalten-Grid ──
    html += `<div class="dashboard-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">`;

    // BEREICH 3: Öffnungs-Checkliste
    const pctO = Math.round(oCount / OEFFNUNG.length * 100);
    const oColor = barColor(pctO);
    html += `<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <h3 style="font-size:14px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:18px;color:#610000">checklist</span>Morgen-Check
        </h3>
        <span style="font-size:12px;font-weight:700;color:${oColor}">${oCount}/${OEFFNUNG.length}</span>
      </div>
      ${bar(pctO, oColor)}
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">`;
    for (let i = 0; i < OEFFNUNG.length; i++) {
      const done = !!oeffnungChecks[i];
      html += `<div onclick="dashboardSchichtToggle('oeffnung',${i})" style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;background:${done?'#e8f5e9':'#fff8f6'};border:1px solid ${done?'#a5d6a7':'#e3beb8'};cursor:pointer">
        <div style="width:17px;height:17px;border-radius:5px;border:2px solid ${done?'#2e7d32':'#ccc'};background:${done?'#2e7d32':'#fff'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${done?'<span style="color:#fff;font-size:10px;font-weight:700">✓</span>':''}</div>
        <span style="font-size:12px;font-weight:600;color:${done?'#1b5e20':'#261816'};text-decoration:${done?'line-through':'none'};flex:1;line-height:1.3">${OEFFNUNG[i]}</span>
      </div>`;
    }
    html += `</div>
      <button onclick="switchTab('schichtcheck')" style="margin-top:12px;width:100%;padding:8px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:12px;font-weight:700;color:#610000;cursor:pointer">Alle anzeigen →</button>
    </div>`;

    // BEREICH 4: Offene Aufgaben
    const prioColor = {hoch:'#c62828', mittel:'#e65100', niedrig:'#2e7d32'};
    const prioLabel = {hoch:'HOCH', mittel:'MITTEL', niedrig:'NIEDRIG'};
    const prioBg    = {hoch:'#ffebee', mittel:'#fff3e0', niedrig:'#e8f5e9'};
    html += `<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h3 style="font-size:14px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:18px;color:#610000">task_alt</span>Offene Aufgaben
        </h3>
        <span style="font-size:12px;font-weight:700;color:#8d6562">${aufgabenOffen.length} offen</span>
      </div>`;
    if (aufgabenOffen.length === 0) {
      html += `<div style="text-align:center;padding:24px 16px;color:#6b6b6b;font-size:13px">✅ Alle Aufgaben erledigt!</div>`;
    } else {
      html += `<div style="display:flex;flex-direction:column;gap:6px">`;
      for (const a of aufgabenOffen) {
        const pc = prioColor[a.prioritaet]||'#610000';
        const pb = prioBg[a.prioritaet]||'#fff0ee';
        const pl = prioLabel[a.prioritaet]||'?';
        html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:#fff8f6;border:1px solid #e3beb8">
          <input type="checkbox" onchange="dashboardAufgabeToggle(${a.id})" style="width:16px;height:16px;cursor:pointer;accent-color:#8B0000;flex-shrink:0">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.titel}</div>
            ${a.faellig?`<div style="font-size:10px;color:#8d6562;margin-top:1px">${a.faellig}</div>`:''}
          </div>
          <span style="font-size:10px;font-weight:700;color:${pc};background:${pb};padding:2px 6px;border-radius:6px;white-space:nowrap">${pl}</span>
        </div>`;
      }
      html += `</div>`;
    }
    html += `<button onclick="switchTab('aufgaben')" style="margin-top:12px;width:100%;padding:8px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:12px;font-weight:700;color:#610000;cursor:pointer">Alle Aufgaben →</button>
    </div>`;

    html += `</div>`; // Ende 2-Spalten-Grid

    // ── BEREICH 5: Umsatz-Ziele (nur Admin/Manager) ──
    if (isAdminOrManager) {
      const tagesziel  = parseFloat(localStorage.getItem('psc_tagesziel')||'0') || 0;
      const monatsziel = parseFloat(localStorage.getItem('psc_monatsziel') || localStorage.getItem('pizzeria_umsatz_ziel')||'0') || 0;
      // Kassenbuch als primäre Quelle, Umsatz-Einnahmen als Fallback
      const einnahmenH = kbEinH > 0 ? kbEinH : umsatzHeute;
      const einnahmenM = kbEinM > 0 ? kbEinM : umsatzMonat;
      const pctT = tagesziel  > 0 ? Math.min(100, Math.round(einnahmenH / tagesziel  * 100)) : 0;
      const pctM = monatsziel > 0 ? Math.min(100, Math.round(einnahmenM / monatsziel * 100)) : 0;
      const tColor = barColor(pctT);
      const mColor = barColor(pctM);
      const progressBar = (pct, color, label, ist, ziel) => `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
            <span style="font-size:12px;font-weight:700;color:#5a403c">${label}</span>
            <span style="font-size:12px;font-weight:800;color:${color}">${pct}%</span>
          </div>
          <div style="height:12px;border-radius:6px;background:#f0e4e1;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;border-radius:6px;background:${color};width:${pct}%;transition:width .5s ease"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#8d6562">
            <span><strong style="color:#261816">${fmt2(ist)} €</strong> erreicht</span>
            <span>Ziel: <strong>${fmt2(ziel)} €</strong></span>
          </div>
        </div>`;
      html += `<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:20px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 style="font-size:14px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:6px">
            <span style="font-size:18px">🎯</span> Umsatz-Ziele
          </h3>
          <button onclick="switchTab('umsatz')" style="padding:6px 12px;border-radius:8px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:12px;font-weight:700;color:#610000;cursor:pointer">+ Eintragen</button>
        </div>
        ${tagesziel > 0
          ? progressBar(pctT, tColor, '📅 Tagesziel', einnahmenH, tagesziel)
          : `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fff8f6;border-radius:10px;margin-bottom:12px">
              <span style="font-size:13px;color:#5a403c">Heute</span>
              <span style="font-size:20px;font-weight:900;color:#261816">${fmt2(einnahmenH)} €</span>
             </div>`}
        ${monatsziel > 0
          ? progressBar(pctM, mColor, '📆 Monatsziel', einnahmenM, monatsziel)
          : `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fff8f6;border-radius:10px">
              <span style="font-size:13px;color:#5a403c">Dieser Monat</span>
              <span style="font-size:20px;font-weight:900;color:#261816">${fmt2(einnahmenM)} €</span>
             </div>`}
        ${(() => {
          let fk = {miete:0,strom:0,versicherung:0,buchhaltung:0,sonstige:0};
          try { const v=localStorage.getItem('biz_fixkosten'); if(v) fk=JSON.parse(v); } catch(_) {}
          const fkSum = Object.values(fk).reduce((s,v)=>s+(parseFloat(v)||0),0);
          const fkTag = fkSum/30;
          if (fkSum > 0) {
            const gewinnH = einnahmenH - fkTag;
            const gewinnColor = gewinnH >= 0 ? '#2e7d32' : '#c62828';
            return `<div style="border-top:1px solid #f0e4e1;margin-top:4px;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:12px;color:#8d6562">🏠 Fixkosten heute (${fmt2(fkTag)} €) abgezogen</span>
              <span style="font-size:14px;font-weight:800;color:${gewinnColor}">${gewinnH >= 0 ? '+' : ''}${fmt2(gewinnH)} €</span>
            </div>`;
          }
          return '';
        })()}
        ${(tagesziel === 0 || monatsziel === 0) ? `<div style="font-size:11px;color:#8d6562;text-align:center;margin-top:8px;cursor:pointer" onclick="openSettings()">⚙️ Ziele in Einstellungen setzen</div>` : ''}
      </div>`;
    }

    // ── BEREICH 5b: MHD + Kassenschnitt Karten ──
    if (mhdAbgelaufen > 0 || mhdBald > 0 || kassenschnittHeute !== null || isAdminOrManager) {
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">`;

      // MHD-Karte
      const mhdStatus = mhdAbgelaufen > 0 ? {bg:'#ffebee',bc:'#ef9a9a',clr:'#c62828',icon:'🔴',text:`${mhdAbgelaufen} abgelaufen!`} :
                        mhdBald > 0        ? {bg:'#fff8e1',bc:'#ffe082',clr:'#f57f17',icon:'🟡',text:`${mhdBald} laufen bald ab`} :
                                             {bg:'#e8f5e9',bc:'#a5d6a7',clr:'#2e7d32',icon:'🟢',text:'Alles OK'};
      html += `<div style="background:${mhdStatus.bg};border:1.5px solid ${mhdStatus.bc};border-radius:16px;padding:18px;cursor:pointer" onclick="switchTab('mhd')">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:20px">${mhdStatus.icon}</span>
          <h3 style="font-size:14px;font-weight:800;color:#261816;margin:0">MHD-Tracker</h3>
        </div>
        <div style="font-size:22px;font-weight:900;color:${mhdStatus.clr};margin-bottom:4px">${mhdStatus.text}</div>
        <div style="font-size:11px;color:#6b6b6b">→ MHD-Tracker öffnen</div>
      </div>`;

      // Kassenschnitt-Karte
      const ksStatus = kassenschnittHeute
        ? (() => { const d=kassenschnittHeute.ist-kassenschnittHeute.soll; return { bg: d<-1?'#ffebee':d>1?'#e8f5e9':'#f8f4f4', bc: d<-1?'#ef9a9a':d>1?'#a5d6a7':'#e3beb8', clr: d<-1?'#c62828':d>1?'#2e7d32':'#261816', text:(d>=0?'+':'')+d.toFixed(2).replace('.',',')+' €', sub:'Kassenschnitt heute ✓' }; })()
        : {bg:'#fff8e1',bc:'#ffe082',clr:'#e65100',text:'Noch offen',sub:'Kassenschnitt eintragen!'};
      html += `<div style="background:${ksStatus.bg};border:1.5px solid ${ksStatus.bc};border-radius:16px;padding:18px;cursor:pointer" onclick="switchTab('kassenschnitt')">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:20px">💵</span>
          <h3 style="font-size:14px;font-weight:800;color:#261816;margin:0">Kassenschnitt</h3>
        </div>
        <div style="font-size:22px;font-weight:900;color:${ksStatus.clr};margin-bottom:4px">${ksStatus.text}</div>
        <div style="font-size:11px;color:#6b6b6b">${ksStatus.sub}</div>
      </div>`;

      html += `</div>`;
    }

    // ── BEREICH 5c: Kassenbuch-KPIs ──
    if (isAdminOrManager && (kbEinH > 0 || kbAusH > 0 || kbEinM > 0 || kbAusM > 0)) {
      const kbSaldoH = kbEinH - kbAusH;
      html += `<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:20px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <h3 style="font-size:14px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#610000">receipt_long</span>Kassenbuch Heute
          </h3>
          <button onclick="switchTab('buchhaltung')" style="padding:5px 10px;border-radius:8px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:11px;font-weight:700;color:#610000;cursor:pointer">Öffnen →</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">
          <div style="background:#e8f5e9;border-radius:12px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:700;color:#2e7d32;text-transform:uppercase;margin-bottom:4px">Einnahmen</div><div style="font-size:18px;font-weight:900;color:#1b5e20">${fmt2(kbEinH)} €</div></div>
          <div style="background:#ffebee;border-radius:12px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:700;color:#c62828;text-transform:uppercase;margin-bottom:4px">Ausgaben</div><div style="font-size:18px;font-weight:900;color:#b71c1c">${fmt2(kbAusH)} €</div></div>
          <div style="background:${kbSaldoH>=0?'#e8f5e9':'#ffebee'};border-radius:12px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:700;color:${kbSaldoH>=0?'#2e7d32':'#c62828'};text-transform:uppercase;margin-bottom:4px">Saldo</div><div style="font-size:18px;font-weight:900;color:${kbSaldoH>=0?'#1b5e20':'#b71c1c'}">${fmt2(kbSaldoH)} €</div></div>
          <div style="background:#e3f2fd;border-radius:12px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:700;color:#1565c0;text-transform:uppercase;margin-bottom:4px">Monat Ein.</div><div style="font-size:18px;font-weight:900;color:#0d47a1">${fmt2(kbEinM)} €</div></div>
        </div>
      </div>`;
    }

    // ── BEREICH 6: Schnellzugriff ──
    const quickLinks = [
      {icon:'🛒', label:'Einkauf',    tab:'einkaufsliste'},
      {icon:'📦', label:'Lager',      tab:'lager'},
      {icon:'👥', label:'Dienstplan', tab:'dienstplan'},
      {icon:'✅', label:'Aufgaben',   tab:'aufgaben'},
      {icon:'📋', label:'Checkliste', tab:'schichtcheck'},
      {icon:'💰', label:'Umsatz',     tab:'umsatz'},
    ];
    html += `<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:20px">
      <h3 style="font-size:14px;font-weight:800;color:#261816;margin:0 0 14px;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:18px;color:#610000">grid_view</span>Schnellzugriff
      </h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">`;
    for (const q of quickLinks) {
      html += `<button onclick="switchTab('${q.tab}')" style="padding:14px 8px;border-radius:12px;border:1.5px solid #e3beb8;background:#fff8f6;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px">
        <span style="font-size:22px">${q.icon}</span>
        <span style="font-size:11px;font-weight:700;color:#261816">${q.label}</span>
      </button>`;
    }
    html += `</div></div>`;

    panel.innerHTML = html;

    // Live-Uhr starten
    window._dashboardClockInterval = setInterval(() => {
      const el = document.getElementById('dashboard-clock');
      if (el) el.textContent = new Date().toLocaleTimeString('de-AT', {hour:'2-digit', minute:'2-digit'});
    }, 30000);

  } catch(err) {
    console.error('Dashboard Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px"><strong>Fehler:</strong> ' + _esc(err.message) + '</div>';
  }
}

function dashboardSchichtToggle(typ, index) {
  const today = new Date().toISOString().slice(0,10);
  let checks = {};
  try { checks = JSON.parse(localStorage.getItem('pizzeria_schichtcheck')||'{}'); } catch(e) {}
  if (!checks[typ]) checks[typ] = {};
  if (checks[typ][index]) { delete checks[typ][index]; delete checks[typ][index+'_z']; }
  else { checks[typ][index]=true; checks[typ][index+'_z']=new Date().toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'}); }
  _syncedLocalSet('pizzeria_schichtcheck', checks);
  renderDashboardTab();
}

function dashboardAufgabeToggle(id) {
  let aufgaben = [];
  try { aufgaben = JSON.parse(localStorage.getItem('pizzeria_aufgaben')||'[]'); } catch(e) {}
  const a = aufgaben.find(x => x.id === id);
  if (a) { a.erledigt = !a.erledigt; a.status = a.erledigt ? 'erledigt' : 'offen'; }
  _safeLocalSet('pizzeria_aufgaben', aufgaben);
  renderDashboardTab();
}

// ═══════════════════════════════════════════════════════════════
// SPEISEKARTE TAB
// ═══════════════════════════════════════════════════════════════
const SK_KEY = 'pizzeria_speisekarte';
const SK_VER_KEY = 'pizzeria_sk_ver';
const SK_VERSION = 2;
const SK_KATEGORIEN = [
  {id:'Vorspeisen',    label:'Vorspeisen',    farbe:'#00838f', bg:'#e0f7fa'},
  {id:'Suppen',        label:'Suppen',        farbe:'#f9a825', bg:'#fffde7'},
  {id:'Salate',        label:'Salate',        farbe:'#2e7d32', bg:'#e8f5e9'},
  {id:'Pizza',         label:'Pizza (AG)',    farbe:'#b52619', bg:'#ffdad6'},
  {id:'Pizza Spezial', label:'Pizza Spezial', farbe:'#c62828', bg:'#ffebee'},
  {id:'Pizzakugeln',   label:'Pizzakugeln',   farbe:'#d32f2f', bg:'#ffcdd2'},
  {id:'American Pizza',label:'American Pizza',farbe:'#1a237e', bg:'#e8eaf6'},
  {id:'Pasta',         label:'Pasta',         farbe:'#e65100', bg:'#fff3e0'},
  {id:'Al Forno',      label:'Al Forno',      farbe:'#f57c00', bg:'#fbe9e7'},
  {id:'Risotto',       label:'Risotto',       farbe:'#bf360c', bg:'#fbe9e7'},
  {id:'Fleisch',       label:'Fleisch/Carne', farbe:'#5d4037', bg:'#efebe9'},
  {id:'Fisch',         label:'Fisch',         farbe:'#1565c0', bg:'#e3f2fd'},
  {id:'Burger',        label:'Burger',        farbe:'#4e342e', bg:'#d7ccc8'},
  {id:'Nachspeisen',   label:'Nachspeisen',   farbe:'#ad1457', bg:'#fce4ec'},
  {id:'Getränke',      label:'Getränke',      farbe:'#6a1b9a', bg:'#f3e5f5'},
];
let SK_FILTER = '';
let SK_SEARCH = '';

function skCatInfo(katId) { return SK_KATEGORIEN.find(k=>k.id===katId)||{farbe:'#610000',bg:'#fff0ee',label:katId}; }
function skLoad() {
  try {
    const ver = parseInt(localStorage.getItem(SK_VER_KEY)||'0');
    if (ver < SK_VERSION) { const d=_skDefault(); skSave(d); return d; }
    const data = JSON.parse(localStorage.getItem(SK_KEY)||'null')||_skDefault();
    return data.map(function(i){ return i.kalk ? i : Object.assign({},i,{kalk:{wareneinsatz:0,personal:0,verpackung:0,zutaten:[]}}); });
  } catch(_) { return _skDefault(); }
}
function skSave(d) { try { localStorage.setItem(SK_KEY,JSON.stringify(d)); localStorage.setItem(SK_VER_KEY,String(SK_VERSION)); } catch(_) {} }
function _skDefault() {
  return [
    // VORSPEISEN
    {id:'v10', nr:'10',  kat:'Vorspeisen',name:'Fritto Misto Gemüse',      preis:10.90,beschr:'Gemischtes gebackenes Gemüse',         aktiv:true},
    {id:'v11', nr:'11',  kat:'Vorspeisen',name:'Gebackene Champignons',    preis:10.90,beschr:'Mit Knoblauch und Kräutern',           aktiv:true},
    {id:'v13', nr:'13',  kat:'Vorspeisen',name:'Zucchini & Artischocken',  preis:10.90,beschr:'Gebacken',                             aktiv:true},
    {id:'v14', nr:'14',  kat:'Vorspeisen',name:'Shrimpscocktail',          preis:10.90,beschr:'Mit Cocktailsauce',                    aktiv:true},
    {id:'v18', nr:'18',  kat:'Vorspeisen',name:'Karfiol oder Broccoli',    preis:10.90,beschr:'Gebacken',                             aktiv:true},
    {id:'v133',nr:'133', kat:'Vorspeisen',name:'Mozzarella & Prosciutto',  preis:13.90,beschr:'Büffelmozzarella mit Schinken',        aktiv:true},
    {id:'v134',nr:'134', kat:'Vorspeisen',name:'Käseplatte',               preis:12.90,beschr:'ab 12.90 – 25.90€',                   aktiv:true},
    // SUPPEN
    {id:'s1',  nr:'1',   kat:'Suppen',name:'Frittatensuppe',      preis:4.90, beschr:'Klassische Rindssuppe',          aktiv:true},
    {id:'s2',  nr:'2',   kat:'Suppen',name:'Knoblauchsuppe',      preis:4.90, beschr:'Cremig mit Croutons',             aktiv:true},
    {id:'s3',  nr:'3',   kat:'Suppen',name:'Minestrone',          preis:4.90, beschr:'Italienische Gemüsesuppe',        aktiv:true},
    {id:'s4',  nr:'4',   kat:'Suppen',name:'Minestrone Gemüse',  preis:4.90, beschr:'Vegetarisch',                     aktiv:true},
    {id:'s5',  nr:'5',   kat:'Suppen',name:'Broccolisuppe',       preis:4.90, beschr:'Cremig',                          aktiv:true},
    {id:'s6',  nr:'6',   kat:'Suppen',name:'Meeresfrüchtesuppe',  preis:4.90, beschr:'Garnelen und Muscheln',           aktiv:true},
    {id:'s7',  nr:'7',   kat:'Suppen',name:'Broccoligratin',      preis:4.90, beschr:'Überbacken',                      aktiv:true},
    {id:'s17', nr:'17',  kat:'Suppen',name:'Melanzane al Forno',  preis:11.90,beschr:'Überbackene Auberginen',          aktiv:true},
    // SALATE
    {id:'sa19',nr:'19',  kat:'Salate',name:'Gemischter Salat klein',  preis:5.20, beschr:'Saisonal',              aktiv:true},
    {id:'sa20',nr:'20',  kat:'Salate',name:'Gemischter Salat groß',   preis:10.50,beschr:'Saisonal',              aktiv:true},
    {id:'sa21',nr:'21',  kat:'Salate',name:'Schafskäsesalat',         preis:11.90,beschr:'Mit Feta',              aktiv:true},
    {id:'sa22',nr:'22',  kat:'Salate',name:'Schinkensalat',           preis:11.90,beschr:'Mit Schinken',          aktiv:true},
    {id:'sa23',nr:'23',  kat:'Salate',name:'Gasthaussalat',           preis:11.90,beschr:'Hausrezept',             aktiv:true},
    {id:'sa24',nr:'24',  kat:'Salate',name:'Ei Knoblauch Salat',      preis:11.90,beschr:'Mit Ei und Knoblauch',  aktiv:true},
    {id:'sa25',nr:'25',  kat:'Salate',name:'Schnittlauch Salat',      preis:11.90,beschr:'Mit Schnittlauch',      aktiv:true},
    {id:'sa26',nr:'26',  kat:'Salate',name:'Bachhendt Salat',         preis:11.90,beschr:'Mit gebackenem Huhn',   aktiv:true},
    {id:'sa27',nr:'27',  kat:'Salate',name:'Shrimps Salat',           preis:11.90,beschr:'Mit Garnelen',          aktiv:true},
    {id:'sa28',nr:'28',  kat:'Salate',name:'Salat Frutti di Mare',    preis:11.90,beschr:'Mit Meeresfrüchten',    aktiv:true},
    // PIZZA (AG)
    {id:'p101',nr:'101',kat:'Pizza',name:'Marinara',         preise:[9.50,16.90,23.90], beschr:'Tomatensauce, Knoblauch, Oregano',                        aktiv:true},
    {id:'p102',nr:'102',kat:'Pizza',name:'Margherita',       preise:[9.50,16.90,23.90], beschr:'Tomatensauce, Mozzarella, Basilikum',                     aktiv:true},
    {id:'p103',nr:'103',kat:'Pizza',name:'Funghi',           preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Champignons',                  aktiv:true},
    {id:'p104',nr:'104',kat:'Pizza',name:'Carciofi',         preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Artischocken',                 aktiv:true},
    {id:'p105',nr:'105',kat:'Pizza',name:'Salami',           preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Salami',                       aktiv:true},
    {id:'p106',nr:'106',kat:'Pizza',name:'Ros Kas',          preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Rosé, Käse',                   aktiv:true},
    {id:'p107',nr:'107',kat:'Pizza',name:'Salami Sardellen', preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Salami, Sardellen',            aktiv:true},
    {id:'p108',nr:'108',kat:'Pizza',name:'Hawaii',           preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Schinken, Ananas',             aktiv:true},
    {id:'p109',nr:'109',kat:'Pizza',name:'Di Carne',         preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Hackfleisch',                  aktiv:true},
    {id:'p110',nr:'110',kat:'Pizza',name:'Toscana',          preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Speck, Zwiebeln',              aktiv:true},
    {id:'p111',nr:'111',kat:'Pizza',name:'Contadino',        preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Gemüse',                       aktiv:true},
    {id:'p112',nr:'112',kat:'Pizza',name:'Diavolo',          preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, Salami, Peperoni scharf',      aktiv:true},
    {id:'p113',nr:'113',kat:'Pizza',name:'Primavera',        preise:[10.90,17.90,24.90],beschr:'Tomatensauce, Mozzarella, frisches Gemüse',              aktiv:true},
    {id:'p114',nr:'114',kat:'Pizza',name:'Provinciale',      preise:[11.50,18.50,24.90],beschr:'Tomatensauce, Mozzarella, Kräuter, Oliven',              aktiv:true},
    {id:'p115',nr:'115',kat:'Pizza',name:'Quattro Stagioni', preise:[11.50,18.50,24.90],beschr:'Schinken, Champignons, Artischocken',                    aktiv:true},
    {id:'p116',nr:'116',kat:'Pizza',name:'Spinaci',          preise:[11.50,18.50,24.90],beschr:'Tomatensauce, Mozzarella, Spinat',                       aktiv:true},
    {id:'p117',nr:'117',kat:'Pizza',name:'Tonno',            preise:[11.50,18.50,24.90],beschr:'Tomatensauce, Mozzarella, Thunfisch, Zwiebeln',          aktiv:true},
    {id:'p118',nr:'118',kat:'Pizza',name:'Al Capone',        preise:[11.50,18.50,24.90],beschr:'Tomatensauce, Mozzarella, Salami, Peperoni, Zwiebeln',   aktiv:true},
    {id:'p119',nr:'119',kat:'Pizza',name:'Capricciosa',      preise:[12.50,19.50,25.90],beschr:'Tomatensauce, Mozzarella, Schinken, Champignons, Oliven',aktiv:true},
    {id:'p120',nr:'120',kat:'Pizza',name:'Valentino',        preise:[12.50,19.50,25.90],beschr:'Tomatensauce, Mozzarella, Schinken, Champignons',        aktiv:true},
    {id:'p121',nr:'121',kat:'Pizza',name:'Rusticana',        preise:[12.50,19.50,25.90],beschr:'Tomatensauce, Mozzarella, Speck, Zwiebeln, Ei',          aktiv:true},
    {id:'p122',nr:'122',kat:'Pizza',name:'Rustica',          preise:[12.50,19.50,25.90],beschr:'Tomatensauce, Mozzarella, Speck, Rucola, Parmesan',      aktiv:true},
    // PIZZA SPEZIAL
    {id:'ps125',nr:'125',kat:'Pizza Spezial',name:'San Carlo',       preise:[11.50,18.50,25.90],beschr:'Hausspezialität',             aktiv:true},
    {id:'ps126',nr:'126',kat:'Pizza Spezial',name:'Pizza Mozzarella',preise:[11.50,18.50,25.90],beschr:'Extra viel Mozzarella',       aktiv:true},
    {id:'ps127',nr:'127',kat:'Pizza Spezial',name:'Cardinale',       preise:[11.50,18.50,25.90],beschr:'Hausspezialität',             aktiv:true},
    {id:'ps128',nr:'128',kat:'Pizza Spezial',name:'Frutti di Mare',  preise:[12.90,19.90,25.90],beschr:'Mit Meeresfrüchten',          aktiv:true},
    {id:'ps129',nr:'129',kat:'Pizza Spezial',name:'Mexican',         preise:[12.90,19.90,25.90],beschr:'Scharf, mit Jalapeños',       aktiv:true},
    {id:'ps130',nr:'130',kat:'Pizza Spezial',name:'Symi/Naxo',       preise:[12.90,19.90,25.90],beschr:'Griechische Spezialität',     aktiv:true},
    {id:'ps131',nr:'131',kat:'Pizza Spezial',name:'Pizzabäger',      preise:[12.90,19.90,25.90],beschr:'Auch als Calzone erhältlich', aktiv:true},
    // PIZZAKUGELN
    {id:'pk1', nr:'P1', kat:'Pizzakugeln',name:'Margherita',                 preis:12.90,beschr:'Mozzarella, Tomatensauce',          aktiv:true},
    {id:'pk2', nr:'P2', kat:'Pizzakugeln',name:'Greco',                      preis:12.90,beschr:'Griechisch',                         aktiv:true},
    {id:'pk3', nr:'P3', kat:'Pizzakugeln',name:'Funghi',                     preis:12.90,beschr:'Champignons',                        aktiv:true},
    {id:'pk4', nr:'P4', kat:'Pizzakugeln',name:'Prosciutto',                 preis:12.90,beschr:'Schinken',                           aktiv:true},
    {id:'pk5', nr:'P5', kat:'Pizzakugeln',name:'Prosciutto e Funghi e Mais', preis:12.90,beschr:'Schinken, Champignons, Mais',         aktiv:true},
    {id:'pk6', nr:'P6', kat:'Pizzakugeln',name:'Prosciutto e Mais',          preis:12.90,beschr:'Schinken, Mais',                     aktiv:true},
    {id:'pk7', nr:'P7', kat:'Pizzakugeln',name:'Salami',                     preis:12.90,beschr:'Salami',                             aktiv:true},
    {id:'pk8', nr:'P8', kat:'Pizzakugeln',name:'Carbonara',                  preis:12.90,beschr:'Speck, Ei, Creme',                   aktiv:true},
    {id:'pk9', nr:'P9', kat:'Pizzakugeln',name:'Quattro Stagioni',           preis:12.90,beschr:'Vier Jahreszeiten',                  aktiv:true},
    {id:'pk10',nr:'P10',kat:'Pizzakugeln',name:'Tonno',                      preis:12.90,beschr:'Thunfisch',                          aktiv:true},
    {id:'pk11',nr:'P11',kat:'Pizzakugeln',name:'Tonno Verde',                preis:12.90,beschr:'Thunfisch, Spinat',                  aktiv:true},
    {id:'pk12',nr:'P12',kat:'Pizzakugeln',name:'Hawaii',                     preis:12.90,beschr:'Schinken, Ananas',                   aktiv:true},
    {id:'pk13',nr:'P13',kat:'Pizzakugeln',name:'Baconetta',                  preis:12.90,beschr:'Bacon, Ei',                          aktiv:true},
    {id:'pk14',nr:'P14',kat:'Pizzakugeln',name:'Diavola',                    preis:12.90,beschr:'Scharf, Peperoni',                   aktiv:true},
    {id:'pk15',nr:'P15',kat:'Pizzakugeln',name:'Capricciosa',                preis:12.90,beschr:'Schinken, Champignons, Oliven',      aktiv:true},
    // AMERICAN PIZZA
    {id:'ap1', nr:'A1', kat:'American Pizza',name:'Chicago',       preis:17.90,beschr:'Salami, Mozzarella, Tomatensauce',              aktiv:true},
    {id:'ap2', nr:'A2', kat:'American Pizza',name:'San Francisco', preis:17.90,beschr:'Schinken, Champignons, Mozzarella',               aktiv:true},
    {id:'ap3', nr:'A3', kat:'American Pizza',name:'Manhattan',     preis:17.90,beschr:'Salami, Peperoni, Zwiebeln, Mozzarella',          aktiv:true},
    {id:'ap4', nr:'A4', kat:'American Pizza',name:'San Diego',     preis:17.90,beschr:'Thunfisch, Zwiebeln, Kapern, Mozzarella',         aktiv:true},
    {id:'ap5', nr:'A5', kat:'American Pizza',name:'Alaska',        preis:17.90,beschr:'Lachs, Kapern, Dill, Mozzarella',                 aktiv:true},
    {id:'ap6', nr:'A6', kat:'American Pizza',name:'Nivada',        preis:17.90,beschr:'Speck, Ei, Zwiebeln, Mozzarella',                 aktiv:true},
    {id:'ap7', nr:'A7', kat:'American Pizza',name:'Florida',       preis:17.90,beschr:'Garnelen, Knoblauch, Petersilie, Mozzarella',     aktiv:true},
    {id:'ap8', nr:'A8', kat:'American Pizza',name:'Dallas',        preis:17.90,beschr:'Hackfleisch, Jalapeños, Zwiebeln, Mozzarella',    aktiv:true},
    {id:'ap9', nr:'A9', kat:'American Pizza',name:'Texas',         preis:17.90,beschr:'Hackfleisch, BBQ-Sauce, Zwiebeln, Mozzarella',    aktiv:true},
    {id:'ap10',nr:'A10',kat:'American Pizza',name:'New York',      preis:17.90,beschr:'Salami, Oliven, Paprika, Mozzarella',             aktiv:true},
    {id:'ap11',nr:'A11',kat:'American Pizza',name:'Las Vegas',     preis:17.90,beschr:'Schinken, Ananas, Mais, Mozzarella',              aktiv:true},
    // PASTA
    {id:'pa31',nr:'31', kat:'Pasta',name:'Maccheroni',           preis:10.90,beschr:'Tomaten-Hackfleischsauce',   aktiv:true},
    {id:'pa32',nr:'32', kat:'Pasta',name:'Carbonara',            preis:10.90,beschr:'Speck, Ei, Parmesan, Sahne', aktiv:true},
    {id:'pa33',nr:'33', kat:'Pasta',name:'Bolognese',            preis:10.90,beschr:'Klassische Fleischsauce',    aktiv:true},
    {id:'pa34',nr:'34', kat:'Pasta',name:'Frutti di Mare',       preis:11.90,beschr:'Meeresfrüchte, Tomaten',     aktiv:true},
    {id:'pa35',nr:'35', kat:'Pasta',name:'San Camillo',          preis:10.90,beschr:'Hausspezialität',             aktiv:true},
    {id:'pa36',nr:'36', kat:'Pasta',name:'Al Pesto',             preis:10.90,beschr:'Basilikum-Pesto',             aktiv:true},
    {id:'pa37',nr:'37', kat:'Pasta',name:'Al Pomodoro',          preis:10.90,beschr:'Tomatensauce, Basilikum',    aktiv:true},
    {id:'pa38',nr:'38', kat:'Pasta',name:'Arrabiata',            preis:10.90,beschr:'Scharfe Tomatensauce',        aktiv:true},
    {id:'pa39',nr:'39', kat:'Pasta',name:'Contadina',            preis:10.90,beschr:'Bauernsauce, Gemüse',         aktiv:true},
    {id:'pa40',nr:'40', kat:'Pasta',name:'Quattro Formaggi',     preis:11.90,beschr:'Vier Käsesorten',             aktiv:true},
    {id:'pa41',nr:'41', kat:'Pasta',name:'Pomodoro Rustico',     preis:10.90,beschr:'Rustikale Tomatensauce',      aktiv:true},
    {id:'pa42',nr:'42', kat:'Pasta',name:'Al Arrabiata',         preis:10.90,beschr:'Scharf',                      aktiv:true},
    {id:'pa43',nr:'43', kat:'Pasta',name:'Boscaiola Speck',      preis:11.90,beschr:'Waldpilze, Speck, Sahne',    aktiv:true},
    {id:'pa44',nr:'44', kat:'Pasta',name:'Boscaiola Fleisch',    preis:11.90,beschr:'Waldpilze, Fleisch, Sahne',  aktiv:true},
    {id:'pa45',nr:'45', kat:'Pasta',name:'Primavera',            preis:10.90,beschr:'Frühlingssauce, Gemüse',      aktiv:true},
    {id:'pa46',nr:'46', kat:'Pasta',name:'Alla Crema',           preis:10.90,beschr:'Cremesauce',                  aktiv:true},
    {id:'pa52',nr:'52', kat:'Pasta',name:'Alla Crema Schinken',  preis:11.90,beschr:'Cremesauce mit Schinken',    aktiv:true},
    {id:'pa53',nr:'53', kat:'Pasta',name:'Emiliana Cherry',      preis:11.90,beschr:'Kirschtomaten, Basilikum',   aktiv:true},
    {id:'pa61',nr:'61', kat:'Pasta',name:'Gorgonzola',           preis:11.90,beschr:'Gorgonzolasauce',             aktiv:true},
    {id:'pa62',nr:'62', kat:'Pasta',name:'Alla Romana Gnocchi',  preis:11.90,beschr:'Gnocchi, Römersauce',         aktiv:true},
    {id:'pa63',nr:'63', kat:'Pasta',name:'Spinaci Gnocchi',      preis:11.90,beschr:'Gnocchi, Spinat',             aktiv:true},
    {id:'pa72',nr:'72g',kat:'Pasta',name:'Gnocchi alla Panna',   preis:11.90,beschr:'Gnocchi, Sahnesauce',         aktiv:true},
    {id:'pa47',nr:'47', kat:'Pasta',name:'Tortellini Bolognese', preis:11.90,beschr:'Gefüllte Nudeln, Fleischsauce', aktiv:true},
    {id:'pa48',nr:'48', kat:'Pasta',name:'Tagliatelle Funghi',   preis:11.90,beschr:'Bandnudeln, Waldpilze, Sahne',  aktiv:true},
    // AL FORNO
    {id:'af71',nr:'71',kat:'Al Forno',name:'Lasagne Verde',        preis:11.90,beschr:'Grüne Lasagne, Béchamel',      aktiv:true},
    {id:'af72',nr:'72',kat:'Al Forno',name:'Nudeln al Forno',      preis:11.90,beschr:'Überbackene Nudeln',            aktiv:true},
    {id:'af73',nr:'73',kat:'Al Forno',name:'Crespelle Fiorentina', preis:11.90,beschr:'Pfannkuchen, Spinat, überbacken',aktiv:true},
    {id:'af81',nr:'81',kat:'Al Forno',name:'Crespelle Prosciutto', preis:11.90,beschr:'Pfannkuchen, Schinken',         aktiv:true},
    {id:'af82',nr:'82',kat:'Al Forno',name:'Crespelle Boscaiola',  preis:11.90,beschr:'Pfannkuchen, Waldpilze',        aktiv:true},
    // RISOTTO
    {id:'ri171',nr:'171',kat:'Risotto',name:'Risotto Marinara',           preis:11.90,beschr:'Mit Meeresfrüchten',      aktiv:true},
    {id:'ri172',nr:'172',kat:'Risotto',name:'Risotto Panna e Prosciutto', preis:11.90,beschr:'Sahne und Schinken',      aktiv:true},
    // FLEISCH
    {id:'c197', nr:'197', kat:'Fleisch',name:'Cevapcici',                       preis:12.90,beschr:'Balkan-Hackfleisch, Pommes',           aktiv:true},
    {id:'c198', nr:'198', kat:'Fleisch',name:'Pariser Schnitzel',               preis:13.50,beschr:'Paniert, Pommes',                       aktiv:true},
    {id:'c199', nr:'199', kat:'Fleisch',name:'Natur Schnitzel',                 preis:13.50,beschr:'Natur, Pommes',                          aktiv:true},
    {id:'c200', nr:'200', kat:'Fleisch',name:'Wiener Schnitzel',                preis:13.90,beschr:'Klassiker, Pommes',                     aktiv:true},
    {id:'c201', nr:'201', kat:'Fleisch',name:'Schweinskotelette',               preis:13.90,beschr:'Gegrillt mit Beilage',                  aktiv:true},
    {id:'c202', nr:'202', kat:'Fleisch',name:'Pollo Diavolo',                   preis:14.90,beschr:'Scharfes Hühnchen',                     aktiv:true},
    {id:'c203', nr:'203', kat:'Fleisch',name:'Hühne Spieß',                     preis:13.50,beschr:'Gegrillt',                               aktiv:true},
    {id:'c203a',nr:'203a',kat:'Fleisch',name:'Hühnerbrust gebacken',            preis:13.90,beschr:'Paniert',                                aktiv:true},
    {id:'c204', nr:'204', kat:'Fleisch',name:'Puten/Hühnerbrust gegrillt',      preis:15.90,beschr:'Gegrillt',                               aktiv:true},
    {id:'c204a',nr:'204a',kat:'Fleisch',name:'Puten Piccata',                   preis:14.90,beschr:'In Zitronensauce',                      aktiv:true},
    {id:'c205', nr:'205', kat:'Fleisch',name:'Spezzatino',                      preis:14.90,beschr:'Italienischer Fleischeintopf',          aktiv:true},
    {id:'c206', nr:'206', kat:'Fleisch',name:'Cordon Bleu',                     preis:14.90,beschr:'Mit Schinken und Käse gefüllt',         aktiv:true},
    {id:'c207', nr:'207', kat:'Fleisch',name:'Spareribs',                       preis:19.90,beschr:'Gegrillte Rippchen',                    aktiv:true},
    {id:'c207a',nr:'207a',kat:'Fleisch',name:'Spareribs Mexicana',              preis:19.90,beschr:'Mit mexikanischer Sauce',              aktiv:true},
    {id:'c207b',nr:'207b',kat:'Fleisch',name:'Spareribs American',              preis:19.90,beschr:'Mit BBQ Sauce',                        aktiv:true},
    {id:'c208', nr:'208', kat:'Fleisch',name:'Lammkotelett gegrillt',           preis:18.90,beschr:'Gegrillt',                               aktiv:true},
    {id:'c208a',nr:'208a',kat:'Fleisch',name:'Lammkotelett Siciliana',          preis:18.90,beschr:'Sizilianisch',                           aktiv:true},
    {id:'c209', nr:'209', kat:'Fleisch',name:'Schweinslungenbraten gebacken',   preis:15.90,beschr:'Paniert',                                aktiv:true},
    {id:'c210', nr:'210', kat:'Fleisch',name:'Schweinslungenbraten gebraten',   preis:15.90,beschr:'Gebraten',                               aktiv:true},
    {id:'c210a',nr:'210a',kat:'Fleisch',name:'Schweinslungenbraten mit Gnocchi',preis:15.90,beschr:'Mit Gnocchi',                           aktiv:true},
    {id:'c211', nr:'211', kat:'Fleisch',name:'Pute San Carino al Gorgonzola',   preis:14.90,beschr:'Hausspezialität',                       aktiv:true},
    {id:'c212', nr:'212', kat:'Fleisch',name:'Grillplatte für 2 Personen',      preis:41.90,beschr:'Gemischte Grillplatte',                 aktiv:true},
    {id:'c213', nr:'213', kat:'Fleisch',name:'Grillteller',                     preis:23.90,beschr:'Gemischter Grillteller',                aktiv:true},
    {id:'c214', nr:'214', kat:'Fleisch',name:'Chicken Wings',                   preis:12.90,beschr:'Knusprige Hühnerflügel',               aktiv:true},
    {id:'c215', nr:'215', kat:'Fleisch',name:'Cordon Bleu Hawaii',              preis:14.90,beschr:'Mit Ananas und Käse',                  aktiv:true},
    {id:'c216', nr:'216', kat:'Fleisch',name:'WOK Pfanne',                      preis:14.90,beschr:'Asiatisch',                             aktiv:true},
    {id:'c217', nr:'217', kat:'Fleisch',name:'Chicken Nuggets',                 preis:12.90,beschr:'Mit Pommes',                            aktiv:true},
    {id:'c219', nr:'219', kat:'Fleisch',name:'Bauern Cordon Bleu',              preis:14.90,beschr:'Bäuerliche Art',                       aktiv:true},
    {id:'c220', nr:'220', kat:'Fleisch',name:'Bauern Schnitzel',                preis:14.90,beschr:'Bäuerliche Art',                       aktiv:true},
    {id:'c221', nr:'221', kat:'Fleisch',name:'Halbes Huhn gegrillt',            preis:12.90,beschr:'Gegrillt',                               aktiv:true},
    {id:'c222', nr:'222', kat:'Fleisch',name:'Kebapteller',                     preis:13.90,beschr:'Mit Pommes und Salat',                  aktiv:true},
    {id:'c218', nr:'218', kat:'Fleisch',name:'Puten Cordon Bleu',               preis:14.90,beschr:'Mit Schinken und Käse gefüllt',         aktiv:true},
    // FISCH
    {id:'f149',nr:'149',kat:'Fisch',name:'Scholle',                   preis:13.90,beschr:'Gebacken',                      aktiv:true},
    {id:'f151',nr:'151',kat:'Fisch',name:'Calamari gebacken',         preis:13.90,beschr:'Tintenfischringe gebacken',      aktiv:true},
    {id:'f152',nr:'152',kat:'Fisch',name:'Calamari gegrillt',         preis:13.90,beschr:'Tintenfischringe gegrillt',      aktiv:true},
    {id:'f153',nr:'153',kat:'Fisch',name:'Zanderfilet',               preis:13.90,beschr:'13.90 – 15.90€',                aktiv:true},
    {id:'f154',nr:'154',kat:'Fisch',name:'Scampi gebacken',           preis:13.90,beschr:'13.90 – 15.90€',                aktiv:true},
    {id:'f155',nr:'155',kat:'Fisch',name:'Fischplatte gebacken',      preis:15.90,beschr:'Gemischte Fischplatte',          aktiv:true},
    {id:'f156',nr:'156',kat:'Fisch',name:'Fischplatte groß',          preis:19.90,beschr:'Große gemischte Fischplatte',   aktiv:true},
    {id:'f157',nr:'157',kat:'Fisch',name:'Scampi in Bierteig',        preis:19.90,beschr:'In Bierteig ausgebacken',       aktiv:true},
    {id:'f158',nr:'158',kat:'Fisch',name:'Fischfilet für 4 Personen', preis:21.90,beschr:'Großes Fischfilet',             aktiv:true},
    {id:'f159',nr:'159',kat:'Fisch',name:'Scampi scharf',             preis:21.90,beschr:'Scharf',                         aktiv:true},
    {id:'f160',nr:'160',kat:'Fisch',name:'Scampi in Bierteig groß',   preis:21.90,beschr:'Große Portion',                 aktiv:true},
    // BURGER
    {id:'b1', nr:'B1', kat:'Burger',name:'Star Burger',    preis:12.90,beschr:'100% Rindfleisch, Pommes', aktiv:true},
    {id:'b2', nr:'B2', kat:'Burger',name:'Cheese Burger',  preis:12.90,beschr:'Mit Cheddar',               aktiv:true},
    {id:'b3', nr:'B3', kat:'Burger',name:'Chicken Burger', preis:12.90,beschr:'Mit Hühnchen',              aktiv:true},
    {id:'b4', nr:'B4', kat:'Burger',name:'Mexican Burger', preis:12.90,beschr:'Scharf, Jalapeños',         aktiv:true},
    {id:'b8', nr:'B8', kat:'Burger',name:'Chicago Burger', preis:13.90,beschr:'Mit Bacon',                  aktiv:true},
    {id:'b9', nr:'B9', kat:'Burger',name:'Salsa Burger',   preis:12.90,beschr:'Mit Salsasauce',            aktiv:true},
    {id:'b10',nr:'B10',kat:'Burger',name:'Hawaii Burger',  preis:13.90,beschr:'Mit Ananas',                 aktiv:true},
    {id:'b11',nr:'B11',kat:'Burger',name:'Haus Burger',    preis:11.90,beschr:'Klassischer Hausburger',     aktiv:true},
    {id:'b12',nr:'B12',kat:'Burger',name:'Kebapburger',    preis:12.90,beschr:'Mit Kebap-Fleisch',         aktiv:true},
    // NACHSPEISEN
    {id:'d250',nr:'250',kat:'Nachspeisen',name:'Tiramisu',             preis:5.90,beschr:'Klassisches Hausrezept',  aktiv:true},
    {id:'d251',nr:'251',kat:'Nachspeisen',name:'Schoko-Banane',        preis:5.90,beschr:'Mit Schokolade',          aktiv:true},
    {id:'d252',nr:'252',kat:'Nachspeisen',name:'Mohr im Hemd',         preis:5.90,beschr:'Schokoladenkuchen warm',  aktiv:true},
    {id:'d253',nr:'253',kat:'Nachspeisen',name:'Bananasplit',          preis:6.50,beschr:'Mit Eis und Sahne',       aktiv:true},
    {id:'d254',nr:'254',kat:'Nachspeisen',name:'Nalspatatschnitzen',   preis:6.50,beschr:'',                        aktiv:true},
    {id:'d255',nr:'255',kat:'Nachspeisen',name:'Eispalatschinken',     preis:6.50,beschr:'Palatschinken mit Eis',   aktiv:true},
    {id:'d256',nr:'256',kat:'Nachspeisen',name:'Topfenpalatschinken',  preis:6.90,beschr:'Mit Topfen',              aktiv:true},
    {id:'d257',nr:'257',kat:'Nachspeisen',name:'Eisbecher',            preis:6.90,beschr:'Gemischter Eisbecher',    aktiv:true},
    {id:'d258',nr:'258',kat:'Nachspeisen',name:'Mantilernes Knödel',   preis:6.90,beschr:'Süße Knödel',             aktiv:true},
    {id:'d259',nr:'259',kat:'Nachspeisen',name:'Gebackene Champignons',preis:6.90,beschr:'Als Nachspeise',         aktiv:true},
    // GETRÄNKE
    {id:'g1', nr:'–',kat:'Getränke',name:'Red Bull 0,25l',             preis:3.90,beschr:'Energy Drink',           aktiv:true},
    {id:'g2', nr:'–',kat:'Getränke',name:'Mineral 0,25l',              preis:1.50,beschr:'0,50l: 2.40€',           aktiv:true},
    {id:'g3', nr:'–',kat:'Getränke',name:'Cola/Fanta/Almdudler 0,25l', preis:2.40,beschr:'0,50l: 3.30€',           aktiv:true},
    {id:'g4', nr:'–',kat:'Getränke',name:'Cola Light/Fanta 0,50l',     preis:3.30,beschr:'',                        aktiv:true},
    {id:'g5', nr:'–',kat:'Getränke',name:'Bier Flasche 0,50l',         preis:3.90,beschr:'',                        aktiv:true},
    {id:'g6', nr:'–',kat:'Getränke',name:'Bier Dose 0,50l',            preis:3.90,beschr:'',                        aktiv:true},
    {id:'g7', nr:'–',kat:'Getränke',name:'Bier AG 0,50l',              preis:4.90,beschr:'Vom Fass',                aktiv:true},
    {id:'g8', nr:'–',kat:'Getränke',name:'Weißwein 0,25l',             preis:3.90,beschr:'0,75l: 12.90€',          aktiv:true},
    {id:'g9', nr:'–',kat:'Getränke',name:'Rotwein 0,25l',              preis:3.90,beschr:'0,75l: 12.90€',          aktiv:true},
    {id:'g14',nr:'–',kat:'Getränke',name:'Orangensaft / Apfelsaft',    preis:2.90,beschr:'0,25l frisch',            aktiv:true},
    {id:'g10',nr:'–',kat:'Getränke',name:'Lambrusco 0,75l',            preis:14.90,beschr:'Prickelnd',              aktiv:true},
    {id:'g11',nr:'–',kat:'Getränke',name:'Frascati 0,75l',             preis:14.90,beschr:'Weißwein',               aktiv:true},
    {id:'g12',nr:'–',kat:'Getränke',name:'Chianti 0,75l',              preis:14.90,beschr:'Rotwein',                aktiv:true},
    {id:'g13',nr:'–',kat:'Getränke',name:'Valpolicella 0,75l',         preis:14.90,beschr:'Rotwein',                aktiv:true},
  ];
}
function skGenId() { return 'sk' + Date.now(); }

function skPreisAnzeige(item) {
  if (item.preise && Array.isArray(item.preise) && item.preise.length) {
    return item.preise.map(p => eur(p)).join(' / ');
  }
  return eur(item.preis || 0);
}

function skAmpel(marge) {
  if (marge >= 65) return '🟢';
  if (marge >= 45) return '🟡';
  return '🔴';
}
function skGetVK(item) { return item.preis || (item.preise && item.preise[0]) || 0; }
function skKalkMarge(item) {
  const k = item.kalk || {};
  const vk = skGetVK(item);
  const kosten = (k.wareneinsatz||0) + (k.personal||0) + (k.verpackung||0);
  if (kosten === 0) return null;
  return vk > 0 ? ((vk - kosten) / vk * 100) : 0;
}
function skOptimierung(item) {
  const marge = skKalkMarge(item);
  if (marge === null || marge >= 65) return '';
  const k = item.kalk || {};
  const kosten = (k.wareneinsatz||0) + (k.personal||0) + (k.verpackung||0);
  const vk = skGetVK(item);
  const vkZiel = kosten / 0.35;
  const diff = Math.ceil((vkZiel - vk) * 10) / 10;
  return diff > 0 ? 'Preis um \u20AC\u00A0' + diff.toFixed(2) + ' erh\u00F6hen \u2192 65% Marge' : '';
}
function skKalkZeile(item) {
  const marge = skKalkMarge(item);
  if (marge === null) return '<div style="font-size:11px;color:#b0a09d;margin-top:4px">Kalkulation nicht eingetragen</div>';
  const k = item.kalk || {};
  const vk = skGetVK(item);
  const kosten = (k.wareneinsatz||0) + (k.personal||0) + (k.verpackung||0);
  const opt = skOptimierung(item);
  return '<div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap">'
    + '<span style="font-size:14px">' + skAmpel(marge) + '</span>'
    + '<span style="font-size:12px;font-weight:700;color:' + (marge>=65?'#2e7d32':marge>=45?'#e65100':'#b52619') + '">' + marge.toFixed(1) + '% Marge</span>'
    + '<span style="font-size:11px;color:#8d6562">VK ' + eur(vk) + ' \u2212 Kosten ' + eur(kosten) + ' (WE ' + eur(k.wareneinsatz||0) + ' + P ' + eur(k.personal||0) + ' + Vp ' + eur(k.verpackung||0) + ')</span>'
    + (opt ? '<div style="font-size:11px;color:#e65100;font-weight:600;width:100%">\u26A0 ' + opt + '</div>' : '')
    + '</div>';
}

function renderSpeisekarteTab() {
  const panel = document.getElementById('panel-speisekarte');
  if (!panel) return;
  try {
    const menu = skLoad();
    const q = (SK_SEARCH||'').toLowerCase();
    let filtered = SK_FILTER ? menu.filter(i => i.kat === SK_FILTER) : menu;
    if (q) filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.beschr||'').toLowerCase().includes(q) ||
      (i.nr||'').toLowerCase().includes(q)
    );
    const catCounts = {};
    for (const i of menu) catCounts[i.kat] = (catCounts[i.kat]||0) + 1;

    let html = `
    ${_pageHdr('menu_book', 'Speisekarte', menu.filter(i=>i.aktiv).length + ' aktive Gerichte · ' + menu.length + ' gesamt',
      '<div style="display:flex;gap:8px"><button onclick="speisekartePdfExport()" style="padding:7px 12px;border-radius:8px;border:1.5px solid #e3beb8;background:#fff;color:#610000;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:14px">picture_as_pdf</span>PDF</button><button onclick="skNeuesGericht()" class="ws-btn ws-btn-primary ws-btn-sm"><span class="material-symbols-outlined">add</span>Neu</button></div>')}
    <div id="sk-form-area"></div>
    <div style="margin-bottom:14px">
      <input type="text" placeholder="Suchen (Name, Nr., Zutaten)…" oninput="SK_SEARCH=this.value;renderSpeisekarteTab()"
        value="${escHtml(SK_SEARCH)}"
        style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">
      <button onclick="SK_FILTER='';SK_SEARCH='';renderSpeisekarteTab()" style="padding:6px 13px;border-radius:20px;border:1.5px solid ${SK_FILTER===''?'#610000':'#e3beb8'};background:${SK_FILTER===''?'#610000':'#fff'};color:${SK_FILTER===''?'#fff':'#5a403c'};font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Alle (${menu.length})</button>`;
    for (const kat of SK_KATEGORIEN) {
      if (!catCounts[kat.id]) continue;
      const active = SK_FILTER === kat.id;
      html += `<button onclick="SK_FILTER='${kat.id}';renderSpeisekarteTab()" style="padding:6px 13px;border-radius:20px;border:1.5px solid ${active?kat.farbe:'#e3beb8'};background:${active?kat.farbe:'#fff'};color:${active?'#fff':'#5a403c'};font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${kat.label} (${catCounts[kat.id]})</button>`;
    }
    html += `</div>`;

    // Kalkulations-Zusammenfassung
    const kalkItems = menu.filter(i => i.aktiv && i.kalk && ((i.kalk.wareneinsatz||0)+(i.kalk.personal||0)+(i.kalk.verpackung||0)) > 0);
    const kalkCount = kalkItems.length;
    const aktivCount = menu.filter(i => i.aktiv).length;
    if (kalkCount > 0) {
      const margen = kalkItems.map(i => skKalkMarge(i)).filter(m => m !== null);
      const avgMarge = margen.length ? (margen.reduce((a,b)=>a+b,0)/margen.length) : 0;
      const rot = margen.filter(m => m < 45).length;
      const gelb = margen.filter(m => m >= 45 && m < 65).length;
      const gruen = margen.filter(m => m >= 65).length;
      html += `<div style="background:linear-gradient(135deg,#fff8f6,#fff);border:1.5px solid #f0d8d4;border-radius:14px;padding:14px 18px;margin-bottom:18px;display:flex;gap:20px;flex-wrap:wrap;align-items:center">
        <div style="font-size:12px;font-weight:800;color:#610000">\uD83D\uDCCA Kalkulation</div>
        <div style="font-size:12px;color:#5a403c"><strong>${kalkCount}</strong> von ${aktivCount} kalkuliert</div>
        <div style="font-size:12px;color:#5a403c">\u00D8 Marge: <strong style="color:${avgMarge>=65?'#2e7d32':avgMarge>=45?'#e65100':'#b52619'}">${avgMarge.toFixed(1)}%</strong></div>
        <div style="font-size:12px">\uD83D\uDFE2 ${gruen} &nbsp;\uD83D\uDFE1 ${gelb} &nbsp;\uD83D\uDD34 ${rot}</div>
      </div>`;
    }

    if (filtered.length === 0) {
      html += `<div style="text-align:center;padding:40px;color:#8d6562;font-size:14px">Keine Gerichte gefunden.</div>`;
    } else {
      for (const kat of SK_KATEGORIEN) {
        const items = filtered.filter(i => i.kat === kat.id);
        if (!items.length) continue;
        html += `<div style="margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:4px;height:20px;border-radius:2px;background:${kat.farbe}"></div>
            <h3 style="font-size:13px;font-weight:800;color:${kat.farbe};text-transform:uppercase;letter-spacing:.08em;margin:0">${kat.label}</h3>
            <span style="font-size:11px;color:#8d6562;font-weight:600">${items.length} Gerichte</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:7px">`;
        for (const item of items) {
          const nr = item.nr ? `<span style="font-size:11px;font-weight:700;color:${kat.farbe};background:${kat.bg};border-radius:6px;padding:1px 7px;margin-right:4px">#${item.nr}</span>` : '';
          html += `<div style="background:#fff;border:1.5px solid ${item.aktiv?kat.bg:'#f0d8d4'};border-left:3px solid ${item.aktiv?kat.farbe:'#ccc'};border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;opacity:${item.aktiv?1:0.55}">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap">
                ${nr}
                <span style="font-size:14px;font-weight:800;color:#261816">${escHtml(item.name)}</span>
                ${!item.aktiv?'<span style="font-size:10px;font-weight:700;color:#8d6562;background:#f3ebe9;border-radius:6px;padding:1px 6px">inaktiv</span>':''}
              </div>
              ${item.beschr?`<div style="font-size:12px;color:#8d6562;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(item.beschr)}</div>`:''}
              ${skKalkZeile(item)}
            </div>
            <div style="font-size:15px;font-weight:900;color:${kat.farbe};white-space:nowrap;text-align:right">${skPreisAnzeige(item)}</div>
            <div style="display:flex;gap:5px">
              <button onclick="skToggleAktiv('${item.id}')" title="${item.aktiv?'Deaktivieren':'Aktivieren'}" style="background:${item.aktiv?'#e8f5e9':'#f3ebe9'};border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0">
                <span class="material-symbols-outlined" style="font-size:16px;color:${item.aktiv?'#2e7d32':'#8d6562'}">${item.aktiv?'visibility':'visibility_off'}</span>
              </button>
              <button onclick="skBearbeiten('${item.id}')" style="background:#fff0ee;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0">
                <span class="material-symbols-outlined" style="font-size:16px;color:#610000">edit</span>
              </button>
              <button onclick="skLoeschen('${item.id}')" style="background:#fff0ee;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0">
                <span class="material-symbols-outlined" style="font-size:16px;color:#b52619">delete</span>
              </button>
            </div>
          </div>`;
        }
        html += `</div></div>`;
      }
    }
    html += renderRezepteSektion();
    panel.innerHTML = html;
  } catch(err) {
    console.error('Speisekarte Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px"><strong>Fehler:</strong> ' + _esc(err.message) + '</div>';
  }
}

function renderRezepteSektion() {
  var rezepte = []; try { rezepte = JSON.parse(localStorage.getItem('pizzeria_rezepte')||'[]'); } catch(_) {}
  var lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(_) {}
  var lagerNamen = lager.map(function(l){ return l.name.toLowerCase(); });
  function ampelRezept(r) {
    if (!r.zutaten || r.zutaten.length === 0) return 'grau';
    var fehlend = 0, teilw = 0;
    r.zutaten.forEach(function(z) {
      var l = lager.find(function(x){ return x.name.toLowerCase()===z.produkt.toLowerCase(); });
      if (!l || l.menge <= 0) fehlend++;
      else if (l.menge < l.mindest) teilw++;
    });
    if (fehlend > 0) return 'rot';
    if (teilw > 0) return 'gelb';
    return 'gruen';
  }
  var lagerAutocomplete = lager.map(function(l){ return escHtml(l.name); }).join('|');
  var html = '<div style="margin-top:32px;border-top:2px solid #e3beb8;padding-top:24px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px">'
    +'<div><h3 style="font-size:18px;font-weight:800;color:#261816;margin:0">📖 Rezept-Manager</h3>'
    +'<p style="font-size:12px;color:#5a403c;margin:3px 0 0">Rezepte mit Zutaten-Ampel und Lagerabgleich</p></div>'
    +'<button onclick="rezeptFormToggle()" style="padding:9px 16px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:13px;font-weight:700;cursor:pointer">+ Neues Rezept</button>'
    +'</div>';
  html += '<div id="rezept-form-area" style="margin-bottom:16px"></div>';
  if (rezepte.length === 0) {
    html += '<div style="text-align:center;padding:32px;color:#8d6562;background:#fff8f6;border-radius:12px;font-size:14px">Noch keine Rezepte. Klicke "+ Neues Rezept" um zu beginnen.</div>';
  } else {
    html += '<div style="display:grid;gap:12px">';
    rezepte.forEach(function(r) {
      var amp = ampelRezept(r);
      var ampCol = amp==='gruen'?'#2e7d32':amp==='gelb'?'#f57f17':amp==='rot'?'#c62828':'#9ca3af';
      var ampEmoji = amp==='gruen'?'🟢':amp==='gelb'?'🟡':amp==='rot'?'🔴':'⚪';
      var fehlendZutaten = (r.zutaten||[]).filter(function(z){
        var l = lager.find(function(x){ return x.name.toLowerCase()===z.produkt.toLowerCase(); });
        return !l || l.menge <= 0;
      }).map(function(z){ return z.produkt; });
      html += '<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:16px">'
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">'
        +'<div style="flex:1">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
        +'<span style="font-size:18px">'+ampEmoji+'</span>'
        +'<span style="font-size:16px;font-weight:800;color:#261816">'+escHtml(r.name)+'</span>'
        +'<span style="background:#f3f4f6;color:#5a403c;font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px">'+escHtml(r.kategorie||'')+'</span>'
        +'</div>'
        +'<div style="font-size:12px;color:#5a403c;margin-bottom:6px">'+((r.zutaten||[]).length)+' Zutaten · '+((r.portionen||1))+' Portionen</div>'
        +(fehlendZutaten.length > 0 ? '<div style="font-size:11px;color:#c62828;margin-bottom:6px">Fehlt: '+fehlendZutaten.map(escHtml).join(', ')+'</div>' : '')
        +'</div>'
        +'<div style="display:flex;gap:6px;flex-shrink:0">'
        +(fehlendZutaten.length > 0 ? '<button onclick="rezeptFehlmaterialPush(\''+r.id+'\')" style="padding:5px 10px;border-radius:8px;border:1px solid #fecaca;background:#fef2f2;color:#c62828;font-size:11px;font-weight:700;cursor:pointer">→ Fehlmaterial</button>' : '')
        +'<button onclick="rezeptLoeschen(\''+r.id+'\')" style="padding:5px 8px;border-radius:8px;border:1px solid #e3beb8;background:#f9fafb;color:#374151;font-size:11px;cursor:pointer">🗑️</button>'
        +'</div>'
        +'</div>'
        +(r.notizen ? '<div style="font-size:12px;color:#5a403c;margin-top:6px;padding-top:6px;border-top:1px solid #f3f4f6;font-style:italic">'+escHtml(r.notizen)+'</div>' : '')
        +'</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function rezeptFormToggle() {
  var area = document.getElementById('rezept-form-area');
  if (!area) return;
  if (area.innerHTML.trim()) { area.innerHTML = ''; return; }
  area.innerHTML = '<div style="background:#fff8f6;border:1.5px solid #e3beb8;border-radius:14px;padding:20px;margin-bottom:4px">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:10px;margin-bottom:14px">'
    +'<input id="rez-name" type="text" placeholder="Rezeptname *" style="padding:10px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box">'
    +'<select id="rez-kat" style="padding:10px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff;color:#261816">'
    +'<option>Pizza</option><option>Pasta</option><option>Salat</option><option>Dessert</option><option>Sonstiges</option></select>'
    +'<input id="rez-portionen" type="number" min="1" value="4" placeholder="Port." style="padding:10px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;background:#fff;box-sizing:border-box">'
    +'</div>'
    +'<div style="font-size:12px;font-weight:700;color:#5a403c;margin-bottom:8px">Zutaten</div>'
    +'<div id="rez-zutaten-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px"></div>'
    +'<div style="display:grid;grid-template-columns:1fr 80px 80px auto;gap:8px;margin-bottom:14px">'
    +'<input id="rez-z-produkt" type="text" placeholder="Produkt (aus Lager)" list="rez-lager-list" style="padding:9px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff;box-sizing:border-box">'
    +'<datalist id="rez-lager-list"></datalist>'
    +'<input id="rez-z-menge" type="number" step="0.01" min="0" placeholder="Menge" style="padding:9px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff;box-sizing:border-box">'
    +'<input id="rez-z-einheit" type="text" placeholder="Einheit" style="padding:9px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff;box-sizing:border-box">'
    +'<button onclick="rezeptZutatAdd()" style="padding:9px 14px;border-radius:10px;border:none;background:#610000;color:#fff;font-size:13px;font-weight:700;cursor:pointer">+</button>'
    +'</div>'
    +'<textarea id="rez-notizen" rows="2" placeholder="Notizen (optional)" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff;resize:vertical;box-sizing:border-box;margin-bottom:12px"></textarea>'
    +'<div style="display:flex;gap:10px">'
    +'<button onclick="rezeptSpeichern()" style="flex:1;padding:12px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:14px;font-weight:700;cursor:pointer">Speichern</button>'
    +'<button onclick="document.getElementById(\'rezept-form-area\').innerHTML=\'\'" style="padding:12px 20px;border-radius:10px;border:1px solid #d1d5db;background:#f9fafb;color:#374151;font-size:14px;font-weight:700;cursor:pointer">Abbrechen</button>'
    +'</div>'
    +'</div>';
  var lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(_) {}
  var dl = document.getElementById('rez-lager-list');
  if (dl) lager.forEach(function(l){ var opt=document.createElement('option'); opt.value=l.name; dl.appendChild(opt); });
  window._rezZutaten = [];
}

function rezeptZutatAdd() {
  var prod = (document.getElementById('rez-z-produkt')?.value||'').trim();
  var menge = parseFloat(document.getElementById('rez-z-menge')?.value||0);
  var einheit = (document.getElementById('rez-z-einheit')?.value||'').trim()||'Stk';
  if (!prod) { _showToast('Bitte Produkt eingeben','error'); return; }
  if (!window._rezZutaten) window._rezZutaten = [];
  window._rezZutaten.push({produkt:prod, menge:menge, einheit:einheit});
  var area = document.getElementById('rez-zutaten-list');
  if (area) {
    var idx = window._rezZutaten.length-1;
    var el = document.createElement('div');
    el.style.cssText = 'display:flex;align-items:center;gap:8px;background:#f9fafb;border-radius:8px;padding:6px 10px';
    el.innerHTML = '<span style="flex:1;font-size:13px;color:#261816">'+escHtml(prod)+'</span><span style="font-size:12px;color:#5a403c">'+menge+' '+escHtml(einheit)+'</span><button onclick="window._rezZutaten.splice('+idx+',1);this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:14px;color:#c62828">✕</button>';
    area.appendChild(el);
  }
  document.getElementById('rez-z-produkt').value='';
  document.getElementById('rez-z-menge').value='';
  document.getElementById('rez-z-einheit').value='';
}

function rezeptSpeichern() {
  var name = (document.getElementById('rez-name')?.value||'').trim();
  if (!name) { _showToast('Bitte Rezeptname eingeben','error'); return; }
  var kat = document.getElementById('rez-kat')?.value||'Sonstiges';
  var portionen = parseInt(document.getElementById('rez-portionen')?.value||4)||4;
  var notizen = (document.getElementById('rez-notizen')?.value||'').trim();
  var liste = []; try { liste = JSON.parse(localStorage.getItem('pizzeria_rezepte')||'[]'); } catch(_) {}
  liste.push({id:Date.now().toString(36), name:name, kategorie:kat, portionen:portionen, zutaten:window._rezZutaten||[], notizen:notizen, erstellt:new Date().toISOString()});
  _safeLocalSet('pizzeria_rezepte', JSON.stringify(liste));
  window._rezZutaten = [];
  _showToast('Rezept gespeichert ✓','success');
  renderSpeisekarteTab();
}

function rezeptLoeschen(id) {
  _showConfirm('Rezept wirklich löschen?', function() {
    var liste = []; try { liste = JSON.parse(localStorage.getItem('pizzeria_rezepte')||'[]'); } catch(_) {}
    _safeLocalSet('pizzeria_rezepte', JSON.stringify(liste.filter(function(r){ return r.id!==id; })));
    _showToast('Rezept gelöscht','info');
    renderSpeisekarteTab();
  }, {okLabel:'Löschen'});
}

function rezeptFehlmaterialPush(id) {
  var liste = []; try { liste = JSON.parse(localStorage.getItem('pizzeria_rezepte')||'[]'); } catch(_) {}
  var r = liste.find(function(x){ return x.id===id; });
  if (!r) return;
  var lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(_) {}
  var fehlmat = []; try { fehlmat = JSON.parse(localStorage.getItem('pizzeria_fehlmaterial')||'[]'); } catch(_) {}
  var added = 0;
  (r.zutaten||[]).forEach(function(z) {
    var l = lager.find(function(x){ return x.name.toLowerCase()===z.produkt.toLowerCase(); });
    if (!l || l.menge <= 0) {
      if (!fehlmat.find(function(f){ return (f.name||f.artikel||'').toLowerCase()===z.produkt.toLowerCase(); })) {
        fehlmat.push({id:Date.now().toString(36)+added, name:z.produkt, artikel:z.produkt, menge:z.menge||1, einheit:z.einheit||'Stk', datum:new Date().toISOString().slice(0,10), notiz:'Rezept: '+r.name});
        added++;
      }
    }
  });
  _safeLocalSet('pizzeria_fehlmaterial', JSON.stringify(fehlmat));
  _showToast(added+' Artikel zu Fehlmaterial hinzugefügt','success');
}

function skNeuesGericht() { _skShowForm(null); }
function skBearbeiten(id) { _skShowForm(id); }
function skGroesseChange(sz) {
  if (!sz) return;
  let pz = {S:{vk:10.5,teig:1.2},M:{vk:12.9,teig:1.8},L:{vk:14.9,teig:2.3},XL:{vk:17.9,teig:3.0}};
  try { const v = localStorage.getItem('psc_pizza_groessen'); if (v) pz = JSON.parse(v); } catch(_) {}
  const entry = pz[sz];
  if (!entry) return;
  const preis = document.getElementById('sk-f-preis');
  const we = document.getElementById('sk-f-we');
  if (preis && !preis.value) preis.value = entry.vk || '';
  if (we && !we.value) we.value = entry.teig || '';
  _skKalkPreview();
}
function speisekartePdfExport() {
  if (!window.jspdf?.jsPDF) { _showToast('jsPDF nicht geladen', 'error'); return; }
  const menu = skLoad().filter(i => i.aktiv);
  if (!menu.length) { _showToast('Keine aktiven Gerichte', 'info'); return; }
  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(18); doc.setTextColor(97,0,0);
  doc.text('Pizzeria San Carino', 105, 18, {align:'center'});
  doc.setFontSize(11); doc.setTextColor(90,64,60);
  doc.text('Speisekarte — Stand: ' + new Date().toLocaleDateString('de-AT'), 105, 26, {align:'center'});
  doc.setDrawColor(225,190,184); doc.line(14, 30, 196, 30);
  let y = 36;
  const kats = [...new Set(menu.map(i=>i.kat))];
  kats.forEach(kat => {
    const items = menu.filter(i=>i.kat===kat);
    if (!items.length) return;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(13); doc.setTextColor(97,0,0); doc.setFont(undefined,'bold');
    doc.text(kat, 14, y); y += 6;
    doc.setFontSize(10); doc.setTextColor(38,24,22); doc.setFont(undefined,'normal');
    items.forEach(item => {
      if (y > 270) { doc.addPage(); y = 20; }
      const preis = item.preis ? parseFloat(item.preis).toFixed(2).replace('.',',') + ' €' : '';
      doc.text((item.nr?item.nr+' ':'') + item.name, 16, y);
      if (preis) doc.text(preis, 196, y, {align:'right'});
      y += 5;
      if (item.beschr) {
        doc.setTextColor(90,64,60); doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(item.beschr, 160);
        doc.text(lines, 18, y); y += lines.length * 4 + 1;
        doc.setTextColor(38,24,22); doc.setFontSize(10);
      }
    });
    y += 4;
  });
  doc.save('speisekarte-san-carino-' + new Date().toISOString().slice(0,10) + '.pdf');
  _showToast('Speisekarte PDF gespeichert', 'success');
}

function _skShowForm(id) {
  const menu = skLoad();
  const item = id ? menu.find(i => i.id === id) : null;
  const area = document.getElementById('sk-form-area');
  if (!area) return;
  area.innerHTML = `
    <div style="background:#fff;border:2px solid #610000;border-radius:18px;padding:20px;margin-bottom:20px">
      <h3 style="font-size:15px;font-weight:800;color:#610000;margin:0 0 16px">${item?'Gericht bearbeiten':'Neues Gericht'}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie</label>
          <select id="sk-f-kat" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">
            ${SK_KATEGORIEN.map(k=>`<option value="${k.id}"${item&&item.kat===k.id?' selected':''}>${k.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Größe (optional)</label>
          <select id="sk-f-groesse" onchange="skGroesseChange(this.value)"
            style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">
            <option value="">— keine Größe —</option>
            ${['S','M','L','XL'].map(sz=>{
              let pz={S:{vk:10.5},M:{vk:12.9},L:{vk:14.9},XL:{vk:17.9}};
              try{const v=localStorage.getItem('psc_pizza_groessen');if(v)pz=JSON.parse(v);}catch(_){}
              return `<option value="${sz}"${item&&item.groesse===sz?' selected':''}>${sz} — ${(pz[sz]?.vk||0).toFixed(2).replace('.',',')} €</option>`;
            }).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Preis (€)</label>
          <input id="sk-f-preis" type="number" step="0.1" min="0" value="${item?(item.preis||(item.preise&&item.preise[0])||''):''}" placeholder="0.00"
            style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name</label>
        <input id="sk-f-name" type="text" value="${item?escHtml(item.name):''}" placeholder="z.B. Margherita"
          style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Beschreibung</label>
        <input id="sk-f-beschr" type="text" value="${item?escHtml(item.beschr||''):''}" placeholder="Zutaten, Hinweise..."
          style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
      </div>
      <div style="border-top:1.5px solid #f0d8d4;margin-top:16px;padding-top:16px">
        <div style="font-size:12px;font-weight:800;color:#610000;margin-bottom:12px">📊 Kalkulation pro Portion</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
          <div>
            <label style="font-size:11px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Wareneinsatz (€)</label>
            <input id="sk-f-we" type="number" step="0.1" min="0" value="${item&&item.kalk?item.kalk.wareneinsatz||'':''}" placeholder="0.00"
              oninput="_skKalkPreview()"
              style="width:100%;padding:10px 12px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Personal (€)</label>
            <input id="sk-f-personal" type="number" step="0.1" min="0" value="${item&&item.kalk?item.kalk.personal||'':''}" placeholder="0.00"
              oninput="_skKalkPreview()"
              style="width:100%;padding:10px 12px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Verpackung (€)</label>
            <input id="sk-f-vp" type="number" step="0.1" min="0" value="${item&&item.kalk?item.kalk.verpackung||'':''}" placeholder="0.00"
              oninput="_skKalkPreview()"
              style="width:100%;padding:10px 12px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
          </div>
        </div>
        <div id="sk-kalk-preview" style="background:#f9f5f4;border-radius:10px;padding:10px 14px;font-size:12px;color:#5a403c"></div>
        <div style="margin-top:12px">
          <div style="font-size:11px;font-weight:700;color:#5a403c;margin-bottom:6px">Zutaten (optional)</div>
          <div id="sk-zutaten-list">${(item&&item.kalk&&item.kalk.zutaten||[]).map(function(z,idx){
            return '<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center" data-zutat="'+idx+'">'
              +'<input class="sk-z-name" type="text" value="'+escHtml(z.name||'')+'" placeholder="Zutat" style="flex:2;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box"/>'
              +'<input class="sk-z-menge" type="text" value="'+escHtml(z.menge||'')+'" placeholder="Menge" style="flex:1;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box"/>'
              +'<input class="sk-z-kosten" type="number" step="0.01" value="'+(z.kosten||'')+'" placeholder="€" oninput="_skKalkPreview()" style="flex:1;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box"/>'
              +'<button onclick="this.parentElement.remove();_skKalkPreview()" style="background:#ffdad6;border:none;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:14px;line-height:1">✕</button>'
              +'</div>';
          }).join('')}</div>
          <button onclick="_skAddZutat()" style="background:#f3ebe9;border:1.5px solid #e3beb8;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;color:#610000;cursor:pointer;font-family:inherit">+ Zutat</button>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button onclick="_skSpeichern('${id||''}')" style="flex:1;background:#610000;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Speichern</button>
        <button onclick="document.getElementById('sk-form-area').innerHTML=''" style="padding:13px 20px;background:#f3ebe9;color:#5a403c;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Abbrechen</button>
      </div>
    </div>`;
  area.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function _skReadZutaten() {
  var list = [];
  var rows = document.querySelectorAll('#sk-zutaten-list [data-zutat]');
  rows.forEach(function(row) {
    var n = row.querySelector('.sk-z-name'); var m = row.querySelector('.sk-z-menge'); var k = row.querySelector('.sk-z-kosten');
    if (n && (n.value.trim() || (k && parseFloat(k.value)))) {
      list.push({ name: n.value.trim(), menge: m ? m.value.trim() : '', kosten: k ? (parseFloat(k.value)||0) : 0 });
    }
  });
  return list;
}
function _skAddZutat() {
  var container = document.getElementById('sk-zutaten-list');
  if (!container) return;
  var idx = container.children.length;
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;align-items:center';
  div.setAttribute('data-zutat', idx);
  div.innerHTML = '<input class="sk-z-name" type="text" placeholder="Zutat" style="flex:2;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box"/>'
    +'<input class="sk-z-menge" type="text" placeholder="Menge" style="flex:1;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box"/>'
    +'<input class="sk-z-kosten" type="number" step="0.01" placeholder="\u20AC" oninput="_skKalkPreview()" style="flex:1;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box"/>'
    +'<button onclick="this.parentElement.remove();_skKalkPreview()" style="background:#ffdad6;border:none;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:14px;line-height:1">\u2715</button>';
  container.appendChild(div);
}
function _skKalkPreview() {
  var prev = document.getElementById('sk-kalk-preview');
  if (!prev) return;
  var vk = parseFloat(document.getElementById('sk-f-preis')?.value) || 0;
  var we = parseFloat(document.getElementById('sk-f-we')?.value) || 0;
  var pe = parseFloat(document.getElementById('sk-f-personal')?.value) || 0;
  var vp = parseFloat(document.getElementById('sk-f-vp')?.value) || 0;
  var zutatenKosten = 0;
  document.querySelectorAll('#sk-zutaten-list .sk-z-kosten').forEach(function(el){ zutatenKosten += parseFloat(el.value)||0; });
  var gesamt = we + pe + vp;
  if (zutatenKosten > 0 && we === 0) gesamt = zutatenKosten + pe + vp;
  if (vk <= 0 || gesamt <= 0) { prev.innerHTML = '<span style="color:#b0a09d">VK-Preis und Kosten eingeben f\u00FCr Vorschau</span>'; return; }
  var marge = (vk - gesamt) / vk * 100;
  var farbe = marge >= 65 ? '#2e7d32' : marge >= 45 ? '#e65100' : '#b52619';
  prev.innerHTML = skAmpel(marge) + ' <strong style="color:'+farbe+'">' + marge.toFixed(1) + '% Marge</strong>'
    + ' &middot; VK ' + eur(vk) + ' \u2212 Kosten ' + eur(gesamt) + ' = <strong>' + eur(vk - gesamt) + ' Gewinn</strong>'
    + (marge < 65 ? '<br><span style="color:#e65100;font-weight:600">\u26A0 ' + (function(){ var z=gesamt/0.35; var d=Math.ceil((z-vk)*10)/10; return d>0?'Preis um \u20AC\u00A0'+d.toFixed(2)+' erh\u00F6hen \u2192 65% Marge':''; })() + '</span>' : '');
}
function _skSpeichern(id) {
  const name  = document.getElementById('sk-f-name')?.value.trim();
  const preis = parseFloat(document.getElementById('sk-f-preis')?.value);
  const kat   = document.getElementById('sk-f-kat')?.value;
  const beschr= document.getElementById('sk-f-beschr')?.value.trim();
  const we      = parseFloat(document.getElementById('sk-f-we')?.value) || 0;
  const personal= parseFloat(document.getElementById('sk-f-personal')?.value) || 0;
  const vp      = parseFloat(document.getElementById('sk-f-vp')?.value) || 0;
  const zutaten = _skReadZutaten();
  const kalk    = { wareneinsatz: we, personal: personal, verpackung: vp, zutaten: zutaten };
  const groesse = document.getElementById('sk-f-groesse')?.value || '';
  if (!name) { _markField('sk-f-name', true); _showToast('Bitte Namen eingeben', 'error'); return; }
  if (isNaN(preis) || preis < 0) { _markField('sk-f-preis', true); _showToast('Bitte gültigen Preis eingeben', 'error'); return; }
  let menu = skLoad();
  if (id) {
    menu = menu.map(i => i.id === id ? { ...i, name, preis, kat, beschr, kalk, groesse } : i);
  } else {
    menu.push({ id: skGenId(), kat, name, preis, beschr, kalk, groesse, aktiv: true });
  }
  skSave(menu);
  _showToast('Gericht gespeichert', 'success');
  renderSpeisekarteTab();
}

function skToggleAktiv(id) {
  skSave(skLoad().map(i => i.id === id ? { ...i, aktiv: !i.aktiv } : i));
  renderSpeisekarteTab();
}

function skLoeschen(id) {
  _showConfirm('Gericht wirklich löschen?', function() {
    skSave(skLoad().filter(i => i.id !== id));
    renderSpeisekarteTab();
  });
}

// ═══════════════════════════════════════════════════════════════
// STANDARDMATERIAL TAB
// ═══════════════════════════════════════════════════════════════
const SM_KEY = 'sc_standardmaterial';
const SM_KATEGORIEN = ['Verpackung','Rohstoffe & Zutaten','Reinigung','Büro & Sonstiges','Pizza & Küche'];
const SM_KAT_FARBEN = {
  'Verpackung':         {farbe:'#c0392b', bg:'#fdecea'},
  'Rohstoffe & Zutaten':{farbe:'#e65100', bg:'#fff3e0'},
  'Reinigung':          {farbe:'#1565c0', bg:'#e3f2fd'},
  'Büro & Sonstiges':   {farbe:'#6a1b9a', bg:'#f3e5f5'},
  'Pizza & Küche':      {farbe:'#b52619', bg:'#ffdad6'}
};
let SM_FILTER = '';
let SM_SEARCH = '';

function smLoad() {
  try { return JSON.parse(localStorage.getItem(SM_KEY)||'null')||_smDefault(); }
  catch(_) { return _smDefault(); }
}
function smSave(d) { try { localStorage.setItem(SM_KEY, JSON.stringify(d)); } catch(_) {} }
function smGenId() { return 'sm' + Date.now() + Math.random().toString(36).slice(2,6); }

function _smDefault() {
  var d = [
    {id:smGenId(),name:'Pizzakarton 33cm',     kategorie:'Verpackung',         einheit:'Stück',   mindestbestand:200},
    {id:smGenId(),name:'Pizzakarton 40cm',     kategorie:'Verpackung',         einheit:'Stück',   mindestbestand:100},
    {id:smGenId(),name:'Alufolie',             kategorie:'Verpackung',         einheit:'Rolle',   mindestbestand:5},
    {id:smGenId(),name:'Papiertüten groß',     kategorie:'Verpackung',         einheit:'Stück',   mindestbestand:100},
    {id:smGenId(),name:'Pizzamehl',            kategorie:'Rohstoffe & Zutaten',einheit:'kg',      mindestbestand:25},
    {id:smGenId(),name:'Tomatensauce',         kategorie:'Rohstoffe & Zutaten',einheit:'Dose',    mindestbestand:20},
    {id:smGenId(),name:'Mozzarella',           kategorie:'Rohstoffe & Zutaten',einheit:'kg',      mindestbestand:10},
    {id:smGenId(),name:'Olivenöl',             kategorie:'Rohstoffe & Zutaten',einheit:'Liter',   mindestbestand:5},
    {id:smGenId(),name:'Handschuhe',           kategorie:'Reinigung',          einheit:'Karton',  mindestbestand:2},
    {id:smGenId(),name:'Spülmittel',           kategorie:'Reinigung',          einheit:'Flasche', mindestbestand:3},
    {id:smGenId(),name:'Müllsäcke',            kategorie:'Reinigung',          einheit:'Rolle',   mindestbestand:4},
    {id:smGenId(),name:'Kassenrolle',          kategorie:'Büro & Sonstiges',   einheit:'Stück',   mindestbestand:10},
    {id:smGenId(),name:'Kugelschreiber',       kategorie:'Büro & Sonstiges',   einheit:'Stück',   mindestbestand:5},
    {id:smGenId(),name:'Backpapier',           kategorie:'Pizza & Küche',      einheit:'Rolle',   mindestbestand:3},
    {id:smGenId(),name:'Teigschaber',          kategorie:'Pizza & Küche',      einheit:'Stück',   mindestbestand:2},
  ];
  smSave(d);
  return d;
}

function renderStandardmaterialTab() {
  var panel = document.getElementById('panel-standardmaterial');
  if (!panel) return;
  try {
    var list = smLoad();
    var q = (SM_SEARCH||'').toLowerCase();
    var filtered = SM_FILTER ? list.filter(function(i){ return i.kategorie === SM_FILTER; }) : list;
    if (q) filtered = filtered.filter(function(i){ return i.name.toLowerCase().includes(q); });

    // Zähler pro Kategorie
    var catCounts = {};
    for (var i = 0; i < list.length; i++) catCounts[list[i].kategorie] = (catCounts[list[i].kategorie]||0) + 1;

    var html = _pageHdr('checklist_rtl', 'Standardmaterial', list.length + ' Materialien in ' + SM_KATEGORIEN.filter(function(k){ return catCounts[k]; }).length + ' Kategorien',
      '<button onclick="smExportJSON()" class="ws-btn ws-btn-sm" style="margin-right:8px" title="JSON Export"><span class="material-symbols-outlined">download</span>Export</button>'
      + '<button onclick="smNeuesMaterial()" class="ws-btn ws-btn-primary ws-btn-sm"><span class="material-symbols-outlined">add</span>Neu</button>');

    // Formular-Bereich
    html += '<div id="sm-form-area"></div>';

    // Suchfeld
    html += '<div style="margin-bottom:14px">'
      + '<input type="text" placeholder="Material suchen…" oninput="SM_SEARCH=this.value;renderStandardmaterialTab()"'
      + ' value="' + escHtml(SM_SEARCH) + '"'
      + ' style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>'
      + '</div>';

    // Kategorie-Filter
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">';
    html += '<button onclick="SM_FILTER=\'\';renderStandardmaterialTab()" style="padding:6px 13px;border-radius:20px;border:1.5px solid ' + (SM_FILTER===''?'#610000':'#e3beb8') + ';background:' + (SM_FILTER===''?'#610000':'#fff') + ';color:' + (SM_FILTER===''?'#fff':'#5a403c') + ';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Alle (' + list.length + ')</button>';
    for (var ki = 0; ki < SM_KATEGORIEN.length; ki++) {
      var kat = SM_KATEGORIEN[ki];
      if (!catCounts[kat]) continue;
      var aktiv = SM_FILTER === kat;
      var kf = SM_KAT_FARBEN[kat] || {farbe:'#610000',bg:'#fff0ee'};
      html += '<button onclick="SM_FILTER=\'' + kat.replace(/'/g,"\\'") + '\';renderStandardmaterialTab()" style="padding:6px 13px;border-radius:20px;border:1.5px solid ' + (aktiv?kf.farbe:'#e3beb8') + ';background:' + (aktiv?kf.farbe:'#fff') + ';color:' + (aktiv?'#fff':'#5a403c') + ';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">' + kat + ' (' + catCounts[kat] + ')</button>';
    }
    html += '</div>';

    // Materialien nach Kategorie
    if (filtered.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:#8d6562;font-size:14px">Keine Materialien gefunden.</div>';
    } else {
      for (var ci = 0; ci < SM_KATEGORIEN.length; ci++) {
        var cat = SM_KATEGORIEN[ci];
        var items = filtered.filter(function(m){ return m.kategorie === cat; });
        if (!items.length) continue;
        var cf = SM_KAT_FARBEN[cat] || {farbe:'#610000',bg:'#fff0ee'};
        html += '<div style="margin-bottom:24px">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
        html += '<div style="width:4px;height:20px;border-radius:2px;background:' + cf.farbe + '"></div>';
        html += '<h3 style="font-size:13px;font-weight:800;color:' + cf.farbe + ';text-transform:uppercase;letter-spacing:.08em;margin:0">' + cat + '</h3>';
        html += '<span style="font-size:11px;color:#8d6562;font-weight:600">' + items.length + ' Materialien</span>';
        html += '</div>';
        html += '<div style="display:flex;flex-direction:column;gap:7px">';
        for (var mi = 0; mi < items.length; mi++) {
          var m = items[mi];
          html += '<div style="background:#fff;border:1.5px solid ' + cf.bg + ';border-left:3px solid ' + cf.farbe + ';border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px">';
          html += '<div style="flex:1;min-width:0">';
          html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
          html += '<span style="font-size:14px;font-weight:800;color:#261816">' + escHtml(m.name) + '</span>';
          html += '<span style="font-size:11px;font-weight:600;color:' + cf.farbe + ';background:' + cf.bg + ';border-radius:6px;padding:1px 8px">' + escHtml(m.einheit) + '</span>';
          if (m.mindestbestand) {
            html += '<span style="font-size:11px;color:#8d6562">Min: ' + m.mindestbestand + ' ' + escHtml(m.einheit) + '</span>';
          }
          html += '</div></div>';
          html += '<div style="display:flex;gap:5px">';
          html += '<button onclick="smBearbeiten(\'' + m.id + '\')" style="background:#fff0ee;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0"><span class="material-symbols-outlined" style="font-size:16px;color:#610000">edit</span></button>';
          html += '<button onclick="smLoeschen(\'' + m.id + '\')" style="background:#fff0ee;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0"><span class="material-symbols-outlined" style="font-size:16px;color:#b52619">delete</span></button>';
          html += '</div></div>';
        }
        html += '</div></div>';
      }
    }
    panel.innerHTML = html;
  } catch(err) {
    console.error('Standardmaterial Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px"><strong>Fehler:</strong> ' + _esc(err.message) + '</div>';
  }
}

function smNeuesMaterial() { _smShowForm(null); }
function smBearbeiten(id) { _smShowForm(id); }

function _smShowForm(id) {
  var list = smLoad();
  var item = id ? list.find(function(i){ return i.id === id; }) : null;
  var area = document.getElementById('sm-form-area');
  if (!area) return;
  area.innerHTML = '<div style="background:#fff;border:2px solid #610000;border-radius:18px;padding:20px;margin-bottom:20px">'
    + '<h3 style="font-size:15px;font-weight:800;color:#610000;margin:0 0 16px">' + (item ? 'Material bearbeiten' : 'Neues Material') + '</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
    + '<div>'
    + '<label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name *</label>'
    + '<input id="sm-f-name" type="text" value="' + (item ? escHtml(item.name) : '') + '" placeholder="z.B. Pizzakarton 33cm"'
    + ' style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>'
    + '</div>'
    + '<div>'
    + '<label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie *</label>'
    + '<select id="sm-f-kat" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">'
    + SM_KATEGORIEN.map(function(k){ return '<option value="' + k + '"' + (item && item.kategorie === k ? ' selected' : '') + '>' + k + '</option>'; }).join('')
    + '</select>'
    + '</div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
    + '<div>'
    + '<label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Einheit *</label>'
    + '<input id="sm-f-einheit" type="text" value="' + (item ? escHtml(item.einheit) : '') + '" placeholder="Stück, kg, Rolle…"'
    + ' style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>'
    + '</div>'
    + '<div>'
    + '<label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Mindestbestand</label>'
    + '<input id="sm-f-min" type="number" min="0" value="' + (item && item.mindestbestand ? item.mindestbestand : '') + '" placeholder="optional"'
    + ' style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>'
    + '</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px">'
    + '<button onclick="_smSpeichern(\'' + (id||'') + '\')" style="flex:1;background:#610000;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Speichern</button>'
    + '<button onclick="document.getElementById(\'sm-form-area\').innerHTML=\'\'" style="padding:13px 20px;background:#f3ebe9;color:#5a403c;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Abbrechen</button>'
    + '</div>'
    + '</div>';
  area.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function _smSpeichern(id) {
  var name = (document.getElementById('sm-f-name')?.value||'').trim();
  var kat = (document.getElementById('sm-f-kat')?.value||'').trim();
  var einheit = (document.getElementById('sm-f-einheit')?.value||'').trim();
  var min = parseInt(document.getElementById('sm-f-min')?.value) || 0;
  if (!name) { _markField('sm-f-name', true); _showToast('Bitte Namen eingeben', 'error'); return; }
  if (!einheit) { _markField('sm-f-einheit', true); _showToast('Bitte Einheit eingeben', 'error'); return; }
  var list = smLoad();
  if (id) {
    list = list.map(function(i){ return i.id === id ? { id:i.id, name:name, kategorie:kat, einheit:einheit, mindestbestand:min } : i; });
  } else {
    list.push({ id: smGenId(), name:name, kategorie:kat, einheit:einheit, mindestbestand:min });
  }
  smSave(list);
  _showToast('Material gespeichert', 'success');
  renderStandardmaterialTab();
}

function smLoeschen(id) {
  _showConfirm('Material wirklich löschen?', function() {
    smSave(smLoad().filter(function(i){ return i.id !== id; }));
    _showToast('Material gelöscht', 'success');
    renderStandardmaterialTab();
  });
}

function smExportJSON() {
  var list = smLoad();
  var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'standardmaterial_' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  _showToast('JSON exportiert', 'success');
}

// ═══════════════════════════════════════════════════════════════
// LIEFERANTEN TAB
// ═══════════════════════════════════════════════════════════════
const LF_KEY = 'pizzeria_lieferanten';
const LF_TYPEN = ['Großhandel','Supermarkt','Discounter','Direktlieferant','Sonstiges'];
const LF_KATEGORIEN = ['Lebensmittel','Getränke','Verpackung','Reinigung','Sonstiges'];

function lfLoad() {
  try { return JSON.parse(localStorage.getItem(LF_KEY) || 'null') || _lfDefault(); } catch(_) { return _lfDefault(); }
}
function lfSave(d) { try { localStorage.setItem(LF_KEY, JSON.stringify(d)); } catch(_) {} }
function _lfDefault() {
  return [
    { id:'lf-metro',        name:'Metro',            typ:'Großhandel',     kat:'Lebensmittel', tel:'0800 201 2000',  email:'info@metro.at',          notiz:'Mo–Sa 6–22 Uhr. Kundenkarte erforderlich.',                                                                                               bewertung:5, farbe:'#003DA5' },
    { id:'lf-billa',        name:'Billa',            typ:'Supermarkt',     kat:'Lebensmittel', tel:'0800 202 0101',  email:'kundenservice@billa.at', notiz:'Lieferservice ab 35 €.',                                                                                                                    bewertung:4, farbe:'#ed1c24' },
    { id:'lf-lidl',         name:'Lidl',             typ:'Discounter',     kat:'Lebensmittel', tel:'',               email:'',                      notiz:'Günstig für Grundzutaten.',                                                                                                                 bewertung:4, farbe:'#0050AA' },
    { id:'lf-spar',         name:'Spar',             typ:'Supermarkt',     kat:'Lebensmittel', tel:'0810 507 260',   email:'',                      notiz:'Filiale 5 min entfernt.',                                                                                                                   bewertung:3, farbe:'#007f3e' },
    { id:'lf-umtrade',      name:'UM Trade GmbH',    typ:'Großhandel',     kat:'Lebensmittel', tel:'+43 1 615 09 23',email:'office@umgroup.at',      notiz:'Südrandstraße 17, 1230 Wien. UID: ATU80370037. IBAN: AT27 2020 5010 0010 5971. KundenNr: 219220. Web: umgroup.at. Letzte Rechnung: Nr. 93722 vom 25.03.2026 — €676,27.', bewertung:5, farbe:'#cc0000' },
    { id:'lf-essamshehata', name:'Essam Shehata KG', typ:'Direktlieferant',kat:'Lebensmittel', tel:'',               email:'',                      notiz:'1120 Wien, Vivenotgasse 42. UID: ATU60941600. Letzte Rechnung: 28.03.2026 — ca. €1.304.',                                                    bewertung:4, farbe:'#f57c00' },
  ];
}
function lfGenId() { return 'lf' + Date.now(); }

function renderLieferantenTab() {
  const panel = document.getElementById('panel-lieferanten');
  if (!panel) return;
  if (!window._bestellPositionen) window._bestellPositionen = [];
  try {
    const list = lfLoad();
    let html = `
    ${_pageHdr('local_shipping', 'Lieferanten', list.length + ' gespeichert',
      '<button onclick="lfNeu()" class="ws-btn ws-btn-primary ws-btn-sm"><span class="material-symbols-outlined">add</span>Neu</button>')}
    <div id="lf-form-area"></div>
    <div style="display:flex;flex-direction:column;gap:12px">`;

    if (!list.length) html += `<div style="text-align:center;padding:40px;color:#8d6562;font-size:14px">Noch keine Lieferanten angelegt.</div>`;

    for (const lf of list) {
      const stars = '★'.repeat(lf.bewertung||0) + '☆'.repeat(5-(lf.bewertung||0));
      html += `<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:18px 20px">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <div style="width:44px;height:44px;border-radius:12px;background:${lf.farbe||'#610000'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span class="material-symbols-outlined" style="font-size:22px;color:#fff">store</span>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
              <span style="font-size:16px;font-weight:800;color:#261816">${escHtml(lf.name)}</span>
              <span style="font-size:11px;background:#f3ebe9;color:#5a403c;border-radius:6px;padding:2px 8px;font-weight:700">${escHtml(lf.typ||'')}</span>
              <span style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:2px 8px;font-weight:700">${escHtml(lf.kat||'')}</span>
            </div>
            <div style="color:#c9a227;font-size:13px;margin-bottom:6px">${stars}</div>
            ${lf.tel?`<div style="font-size:12px;color:#5a403c;margin-bottom:3px;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">phone</span><span style="color:#5a403c;font-weight:600">${escHtml(lf.tel)}</span></div>`:''}
            ${lf.mobil?`<div style="font-size:12px;color:#5a403c;margin-bottom:3px;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">smartphone</span><span style="color:#5a403c;font-weight:600">${escHtml(lf.mobil)}</span></div>`:''}
            ${lf.email?`<div style="font-size:12px;color:#5a403c;margin-bottom:3px;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">mail</span><span style="color:#5a403c;font-weight:600">${escHtml(lf.email)}</span></div>`:''}
            ${lf.notiz?`<div style="font-size:12px;color:#8d6562;margin-top:6px;font-style:italic">${escHtml(lf.notiz)}</div>`:''}
            ${(lf.tel||lf.mobil)?`<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
              ${lf.tel?`<a href="tel:${escHtml(lf.tel)}" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#2e7d32;color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;font-family:inherit"><span class="material-symbols-outlined" style="font-size:16px">call</span>Anrufen</a>`:''}
              ${(lf.mobil||lf.tel)?`<a href="${lfWaUrl(lf.mobil||lf.tel)}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#25D366;color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;font-family:inherit">💬 WhatsApp</a>`:''}
            </div>`:''}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button onclick="lfBearbeiten('${lf.id}')" style="background:#fff0ee;border:none;border-radius:8px;padding:7px;cursor:pointer;line-height:0">
              <span class="material-symbols-outlined" style="font-size:16px;color:#610000">edit</span>
            </button>
            <button onclick="lfLoeschen('${lf.id}')" style="background:#fff0ee;border:none;border-radius:8px;padding:7px;cursor:pointer;line-height:0">
              <span class="material-symbols-outlined" style="font-size:16px;color:#b52619">delete</span>
            </button>
          </div>
        </div>
      </div>`;
    }
    html += `</div>`;
    // ── Bestellungs-Sektion ──────────────────────────────────────
    const lager = (function(){ try { return JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e){ return []; } })();
    const liefOptionen = list.map(lf => `<option value="${escHtml(lf.id||lf.name)}" data-email="${escHtml(lf.email||'')}">${escHtml(lf.name)}</option>`).join('');
    html += `
    <div style="background:var(--surface);border-radius:16px;border:1px solid var(--border);padding:20px;margin-top:20px">
      <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px">
        <span class="material-symbols-outlined" style="color:var(--red)">local_shipping</span>Neue Bestellung
      </div>
      <div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">LIEFERANT</div>
          <select id="bestell-lieferant" style="width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
            <option value="">— bitte wählen —</option>${liefOptionen}
          </select>
        </div>
        <button onclick="bestellLagerVorschlag()" style="padding:9px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text-2);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">📦 Lager-Vorschlag</button>
        <button onclick="sendBestellungEmail()" style="padding:9px 18px;border-radius:10px;border:none;background:var(--red);color:#fff;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">📧 Email senden</button>
        <button onclick="sendWhatsappBestellung()" style="padding:9px 18px;border-radius:10px;border:none;background:#25D366;color:#fff;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">💬 Per WhatsApp</button>
      </div>
      <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:12px;flex-wrap:wrap">
        <input id="bestell-produkt" placeholder="Produkt..." style="flex:2;min-width:120px;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
        <input id="bestell-menge" type="number" min="0" step="0.1" placeholder="Menge" style="width:78px;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
        <select id="bestell-einheit" style="padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
          <option>kg</option><option>Stk</option><option>L</option><option>Pkg</option>
        </select>
        <button onclick="bestellAddPos()" style="padding:8px 18px;border-radius:8px;border:none;background:var(--red);color:#fff;font-size:13px;font-weight:700;cursor:pointer">+</button>
      </div>
      <div id="bestell-positionen-liste" style="margin-bottom:14px"></div>
      <details style="border-top:1px solid var(--border);padding-top:12px">
        <summary style="cursor:pointer;font-size:13px;font-weight:700;color:var(--text-2)">📋 Letzte 10 Bestellungen</summary>
        <div id="bestell-verlauf-liste" style="margin-top:8px"></div>
      </details>
    </div>`;
    panel.innerHTML = html;
    bestellRenderPos();
    const vl = document.getElementById('bestell-verlauf-liste');
    if (vl) vl.innerHTML = renderBestellVerlauf();
  } catch(err) {
    console.error('Lieferanten Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px"><strong>Fehler:</strong> ' + _esc(err.message) + '</div>';
  }
}

function lfNeu() { _lfShowForm(null); }
function lfBearbeiten(id) { _lfShowForm(id); }
function lfWaUrl(tel) {
  let n = (tel||'').replace(/[\s\-\(\)\.]/g,'');
  if (n.startsWith('+')) n = n.slice(1);
  else if (n.startsWith('00')) n = n.slice(2);
  else if (n.startsWith('0')) n = '43' + n.slice(1);
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent('Hallo, Pizzeria San Carino Wien — ');
}

// ── BESTELLUNGS-FUNKTIONEN ───────────────────────────────────────────────────
function bestellRenderPos() {
  const c = document.getElementById('bestell-positionen-liste');
  if (!c) return;
  if (!window._bestellPositionen || !window._bestellPositionen.length) {
    c.innerHTML = '<div style="color:var(--text-3);font-size:13px;text-align:center;padding:10px 0">Noch keine Positionen — füge Produkte hinzu</div>';
    return;
  }
  c.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:var(--bg)">
      <th style="padding:6px 8px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Produkt</th>
      <th style="padding:6px 8px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Menge</th>
      <th style="padding:6px 8px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Einheit</th>
      <th style="padding:6px 8px;border-bottom:1px solid var(--border)"></th>
    </tr></thead>
    <tbody>${window._bestellPositionen.map((p,i) =>
      `<tr style="border-bottom:1px solid var(--border-2)">
        <td style="padding:6px 8px;color:var(--text)">${_esc(p.produkt)}</td>
        <td style="padding:6px 8px;text-align:right;color:var(--text)">${p.menge}</td>
        <td style="padding:6px 8px;color:var(--text-2)">${_esc(p.einheit)}</td>
        <td style="padding:6px 8px;text-align:right"><button onclick="bestellRemovePos(${i})" style="padding:2px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--red);font-size:12px;cursor:pointer">✕</button></td>
      </tr>`
    ).join('')}</tbody>
  </table>`;
}
function bestellAddPos() {
  const produkt = (document.getElementById('bestell-produkt')?.value||'').trim();
  const menge = parseFloat(document.getElementById('bestell-menge')?.value);
  const einheit = document.getElementById('bestell-einheit')?.value || 'Stk';
  if (!produkt) { _showToast('Bitte Produkt eingeben', 'error'); return; }
  if (!menge || menge <= 0) { _showToast('Bitte Menge eingeben', 'error'); return; }
  if (!window._bestellPositionen) window._bestellPositionen = [];
  window._bestellPositionen.push({ produkt, menge, einheit });
  document.getElementById('bestell-produkt').value = '';
  document.getElementById('bestell-menge').value = '';
  bestellRenderPos();
}
function bestellRemovePos(idx) {
  if (!window._bestellPositionen) return;
  window._bestellPositionen.splice(idx, 1);
  bestellRenderPos();
}
function bestellLagerVorschlag() {
  let lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}
  const mangel = lager.filter(a => a.menge != null && a.mindest != null && parseFloat(a.menge) <= parseFloat(a.mindest));
  if (!mangel.length) { _showToast('Kein Lager unter Mindestbestand', 'info'); return; }
  if (!window._bestellPositionen) window._bestellPositionen = [];
  mangel.forEach(a => {
    const bedarf = parseFloat(a.mindest) * 2 - parseFloat(a.menge);
    window._bestellPositionen.push({ produkt: a.name||a.produkt||'Unbekannt', menge: Math.max(1, Math.round(bedarf * 10) / 10), einheit: a.einheit||'Stk' });
  });
  bestellRenderPos();
  _showToast(mangel.length + ' Lager-Positionen vorgeschlagen', 'success');
}
function renderBestellVerlauf() {
  let b = []; try { b = JSON.parse(localStorage.getItem('pizzeria_bestellungen')||'[]'); } catch(e) {}
  if (!b.length) return '<div style="color:var(--text-3);font-size:13px;padding:8px 0">Noch keine Bestellungen.</div>';
  return b.slice().reverse().slice(0,10).map(o =>
    `<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-2);font-size:13px">
      <span style="color:var(--text-3);flex-shrink:0">${o.datum}</span>
      <span style="font-weight:600;color:var(--text);flex:1">${_esc(o.lieferant_name)}</span>
      <span style="color:var(--text-2)">${(o.positionen||[]).length} Pos.</span>
      <span style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;background:${o.status==='gesendet'?'#e8f5e9':'#fff8e1'};color:${o.status==='gesendet'?'#2e7d32':'#e65100'}">${o.status}</span>
    </div>`
  ).join('');
}
async function sendBestellungEmail() {
  if (!window._bestellPositionen || !window._bestellPositionen.length) { _showToast('Bitte mindestens eine Position hinzufügen', 'error'); return; }
  const sel = document.getElementById('bestell-lieferant');
  let lieferanten = []; try { lieferanten = JSON.parse(localStorage.getItem('pizzeria_lieferanten')||'[]'); } catch(e) {}
  const lf = lieferanten.find(l => (l.id||l.name) === sel?.value);
  if (!lf) { _showToast('Bitte Lieferant wählen', 'error'); return; }
  if (!lf.email) { _showToast('Dieser Lieferant hat keine Email-Adresse', 'error'); return; }
  const datum = new Date().toLocaleDateString('de-AT', {day:'2-digit',month:'2-digit',year:'numeric'});
  const betreff = 'Bestellung vom ' + datum + ' — Pizzeria San Carino';
  const tRows = window._bestellPositionen.map(p => `<tr><td style="padding:6px 12px;border:1px solid #ddd">${_esc(p.produkt)}</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:right">${p.menge}</td><td style="padding:6px 12px;border:1px solid #ddd">${_esc(p.einheit)}</td></tr>`).join('');
  const htmlBody = `<p>Sehr geehrte Damen und Herren,</p><p>hiermit bestellen wir folgende Artikel:</p><table style="border-collapse:collapse"><thead><tr><th style="padding:6px 12px;border:1px solid #ddd;background:#f5f5f5">Artikel</th><th style="padding:6px 12px;border:1px solid #ddd;background:#f5f5f5">Menge</th><th style="padding:6px 12px;border:1px solid #ddd;background:#f5f5f5">Einheit</th></tr></thead><tbody>${tRows}</tbody></table><p>Mit freundlichen Grüßen,<br>Ali Shama<br>Pizzeria San Carino</p>`;
  const eintrag = { id:Date.now(), datum, lieferant_name:lf.name, lieferant_email:lf.email, positionen:[...window._bestellPositionen], status:'entwurf' };
  let bestellungen = []; try { bestellungen = JSON.parse(localStorage.getItem('pizzeria_bestellungen')||'[]'); } catch(e) {}
  bestellungen.push(eintrag);
  localStorage.setItem('pizzeria_bestellungen', JSON.stringify(bestellungen));
  let gmailOk = false;
  try {
    const resp = await fetch('/api/gmail/draft', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:lf.email, subject:betreff, body:htmlBody }) });
    const data = await resp.json();
    if (resp.ok && data.success) { gmailOk = true; eintrag.status = 'gesendet'; localStorage.setItem('pizzeria_bestellungen', JSON.stringify(bestellungen)); _showToast('📧 Gmail-Entwurf erstellt — bitte in Gmail senden!', 'success'); }
  } catch(e) {}
  if (!gmailOk) {
    const txtBody = 'Sehr geehrte Damen und Herren,\n\nhiermit bestellen wir:\n\n' + window._bestellPositionen.map(p => p.produkt+': '+p.menge+' '+p.einheit).join('\n') + '\n\nMit freundlichen Grüßen,\nAli Shama\nPizzeria San Carino';
    window.open(`mailto:${encodeURIComponent(lf.email)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(txtBody)}`, '_blank');
    _showToast('📧 Email-Programm geöffnet', 'info');
  }
  window._bestellPositionen = [];
  bestellRenderPos();
  const vl = document.getElementById('bestell-verlauf-liste');
  if (vl) vl.innerHTML = renderBestellVerlauf();
}

function _lfShowForm(id) {
  const list = lfLoad();
  const lf = id ? list.find(i => i.id === id) : null;
  const area = document.getElementById('lf-form-area');
  if (!area) return;
  area.innerHTML = `
    <div style="background:#fff;border:2px solid #610000;border-radius:18px;padding:20px;margin-bottom:20px">
      <h3 style="font-size:15px;font-weight:800;color:#610000;margin:0 0 16px">${lf?'Lieferant bearbeiten':'Neuer Lieferant'}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name *</label>
          <input id="lf-f-name" type="text" value="${lf?escHtml(lf.name):''}" placeholder="z.B. Metro"
            style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Typ</label>
          <select id="lf-f-typ" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">
            ${LF_TYPEN.map(t=>`<option${lf&&lf.typ===t?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie</label>
          <select id="lf-f-kat" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">
            ${LF_KATEGORIEN.map(k=>`<option${lf&&lf.kat===k?' selected':''}>${k}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Bewertung</label>
          <select id="lf-f-bew" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">
            ${[5,4,3,2,1].map(n=>`<option value="${n}"${lf&&lf.bewertung===n?' selected':''}>${'★'.repeat(n)} (${n})</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Telefon (Büro/Zentrale)</label>
          <input id="lf-f-tel" type="tel" value="${lf?escHtml(lf.tel||''):''}" placeholder="+43 1 ..."
            style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">📱 Mobil / WhatsApp</label>
          <input id="lf-f-mobil" type="tel" value="${lf?escHtml(lf.mobil||''):''}" placeholder="+43 660 ..."
            style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">E-Mail</label>
          <input id="lf-f-email" type="email" value="${lf?escHtml(lf.email||''):''}" placeholder="info@..."
            style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Notiz</label>
        <input id="lf-f-notiz" type="text" value="${lf?escHtml(lf.notiz||''):''}" placeholder="Öffnungszeiten, Mindestbestellung..."
          style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="_lfSpeichern('${id||''}')" style="flex:1;background:#610000;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Speichern</button>
        <button onclick="document.getElementById('lf-form-area').innerHTML=''" style="padding:13px 20px;background:#f3ebe9;color:#5a403c;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Abbrechen</button>
      </div>
    </div>`;
  area.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function _lfSpeichern(id) {
  const name = document.getElementById('lf-f-name')?.value.trim();
  if (!name) { _markField('lf-f-name', true); _showToast('Bitte Namen eingeben', 'error'); return; }
  const entry = {
    id:        id || lfGenId(),
    name,
    typ:       document.getElementById('lf-f-typ')?.value,
    kat:       document.getElementById('lf-f-kat')?.value,
    bewertung: parseInt(document.getElementById('lf-f-bew')?.value||'3'),
    tel:       document.getElementById('lf-f-tel')?.value.trim(),
    email:     document.getElementById('lf-f-email')?.value.trim(),
    notiz:     document.getElementById('lf-f-notiz')?.value.trim(),
    mobil:     document.getElementById('lf-f-mobil')?.value.trim(),
    farbe:     '#610000',
  };
  let list = lfLoad();
  list = id ? list.map(i => i.id === id ? entry : i) : [...list, entry];
  lfSave(list);
  renderLieferantenTab();
}

function lfLoeschen(id) {
  _showConfirm('Lieferant wirklich löschen?', function() {
    lfSave(lfLoad().filter(i => i.id !== id));
    renderLieferantenTab();
  });
}

function sendWhatsappBestellung() {
  const lfId = document.getElementById('bestell-lieferant')?.value;
  if (!lfId) { _showToast('Bitte zuerst einen Lieferanten wählen', 'warning'); return; }
  const positionen = window._bestellPositionen || [];
  if (!positionen.length) { _showToast('Bitte zuerst Positionen hinzufügen', 'warning'); return; }
  const lf = lfLoad().find(function(l){ return l.id === lfId; });
  if (!lf) { _showToast('Lieferant nicht gefunden', 'error'); return; }
  const tel = (lf.tel || '').replace(/\D/g, '');
  if (!tel) { _showToast('Bitte Telefonnummer beim Lieferanten eintragen', 'error'); return; }
  const datum = new Date().toLocaleDateString('de-AT', {day:'2-digit', month:'2-digit', year:'numeric'});
  const posText = positionen.map(function(p){ return '• ' + p.produkt + ' — ' + p.menge + ' ' + p.einheit; }).join('\n');
  const text = 'Hallo ' + lf.name + ',\n\nBestellung vom ' + datum + ':\n\n' + posText + '\n\nMit freundlichen Grüßen\nPizzeria San Carino\nAli Shama';
  const url = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
  _showToast('WhatsApp wird geöffnet…', 'success');
}

// ═══════════════════════════════════════════════════════════════
// DOMContentLoaded — Session wiederherstellen oder Login zeigen
// ═══════════════════════════════════════════════════════════════
// Tablet-Sidebar Push-Effekt — global, läuft immer
(function() {
  const tsSidebar = document.getElementById('tablet-sidebar');
  if (tsSidebar) {
    tsSidebar.addEventListener('mouseenter', () => {
      document.body.classList.add('ts-open');
    });
    tsSidebar.addEventListener('mouseleave', () => {
      if (!tsSidebar.classList.contains('ts-expanded')) {
        document.body.classList.remove('ts-open');
      }
    });
  }
})();

// Preise beim Start aus SQLite laden (live mit Datenbank)
async function loadPricesFromDB() {
  try {
    const resp = await fetch('/api/preisverlauf?limit=2000');
    if (!resp.ok) return;
    const rows = await resp.json();
    rows.forEach(r => {
      if (!r.shop_id || r.preis == null) return;
      const sid = r.shop_id.toLowerCase();
      if (!PRICE_MAP[sid]) PRICE_MAP[sid] = {};
      // Produkt-ID matchen oder Name als Key verwenden
      const pid = r.produkt_id || r.produkt.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30);
      // Letzten (neuesten) Preis nehmen — rows sind DESC nach datum
      if (PRICE_MAP[sid][pid] == null) PRICE_MAP[sid][pid] = r.preis;
    });
    console.log('✅ Preise aus DB geladen:', rows.length, 'Einträge');
  } catch(_) {
    // Server nicht aktiv — Banner im Geschäfte-Panel anzeigen
    var gp = document.getElementById('panel-geschaefte');
    if (gp && !gp.querySelector('#server-offline-banner')) {
      var banner = document.createElement('div');
      banner.id = 'server-offline-banner';
      banner.innerHTML = '<div style="background:#fff8e1;border:1.5px solid #f9a825;border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:10px"><span style="font-size:20px">\u26a0\ufe0f</span><div><div style="font-size:14px;font-weight:700;color:#e65100">Server nicht erreichbar</div><div style="font-size:12px;color:#7a5c00;margin-top:2px">Bitte <code>node server.js</code> starten \u2014 Port 8080</div></div></div>';
      gp.prepend(banner);
    }
  }
}

// ── DB ↔ localStorage Sync ────────────────────────────────────────────────────
const DB_SYNC_KEYS = new Set([
  'pizzeria_mitarbeiter','pizzeria_wochenplan','pizzeria_lager','pizzeria_lieferanten',
  'pizzeria_aufgaben','pizzeria_fehlmaterial','pizzeria_einkaufsliste',
  'pizzeria_bestellungen','pizzeria_umsatz_einnahmen','pizzeria_umsatz_ausgaben',
  'pizzeria_umsatz_ziel','pizzeria_kassa','pizzeria_fixkosten','pizzeria_personal',
  'pizzeria_dienstplan','pizzeria_wareneinsatz','pizzeria_preisalarm','pizzeria_history',
  'pizzeria_lieferanten','pizzeria_konkurrenz','pizzeria_bewertungen','pizzeria_speisekarte'
]);

// localStorage.setItem automatisch mit DB synchronisieren
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  _origSetItem(key, value);
  if (DB_SYNC_KEYS.has(key)) {
    try {
      const parsed = JSON.parse(value);
      fetch('/api/data/' + key, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(parsed) }).catch(()=>{});
    } catch(_) {}
  }
};

function dbSave(key, value) {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch(_) {}
}

function dbSyncAll(cb) {
  fetch('/api/data').then(r => r.ok ? r.json() : Promise.reject()).then(all => {
    DB_SYNC_KEYS.forEach(key => {
      if (all[key] !== undefined && all[key] !== null) {
        const current = localStorage.getItem(key);
        if (!current || current === '[]' || current === '{}') {
          localStorage.setItem(key, JSON.stringify(all[key]));
        }
      }
    });
    if (cb) cb();
  }).catch(() => { if (cb) cb(); });
}

document.addEventListener('DOMContentLoaded', () => {
  // Theme als erstes laden — vor allem anderen
  loadSavedTheme();
  // Restaurant-Branding anwenden (Name, Logo, Farbe)
  applyRestaurantBranding();
  // Setup-Wizard beim ersten Start
  checkSetupWizard();
  // Server-Status Badge starten
  _startServerStatusLoop();
  // Preise aus SQLite laden (im Hintergrund, blockiert Login nicht)
  loadPricesFromDB();
  // 1. Persistenter Login (localStorage, "Angemeldet bleiben")
  if (checkPersistentLogin()) { dbSyncAll(); showApp(); return; }
  // 2. Session wiederherstellen (sessionStorage, Tab noch offen)
  try {
    const saved = sessionStorage.getItem('pizzeria_user');
    if (saved) {
      const u = JSON.parse(saved);
      const found = PIZZERIA_USERS.find(x => x.username === u.username);
      if (found) { currentUser = found; dbSyncAll(); showApp(); return; }
    }
  } catch(_) {}
  // 3. Login-Screen anzeigen (default)
  // Auto-Backup prüfen (nach 2s damit Login nicht blockiert wird)
  setTimeout(appAutoBackupCheck, 2000);
  // Kassenbuch: Migration + initialer Sync
  setTimeout(async () => { await kbMigrateIfNeeded(); await kbSync(); }, 1500);
});

// ═══════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════
/* ══════════ THEME SYSTEM ══════════ */
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark' || theme === 'dark-red' || theme === 'glass') {
    html.setAttribute('data-theme', theme);
  } else {
    html.removeAttribute('data-theme');
  }
  _safeLocalSet('pizzeria_theme', theme);
  // Update theme picker buttons if settings modal is open
  const btns = document.querySelectorAll('.theme-pick-btn');
  btns.forEach(b => {
    const active = b.dataset.theme === theme || (theme === 'classic' && !b.dataset.theme);
    b.style.outline = active ? '3px solid #610000' : 'none';
    b.style.transform = active ? 'scale(1.05)' : 'scale(1)';
  });
}
function loadSavedTheme() {
  const t = localStorage.getItem('pizzeria_theme') || 'classic';
  applyTheme(t);
}

function openSettings() {
  const existing = document.getElementById('settings-modal');
  if (existing) { existing.remove(); return; }
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY.length > 10;
  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <h2 style="font-size:18px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined" style="font-size:20px;color:#610000">settings</span>Einstellungen
        </h2>
        <button onclick="document.getElementById('settings-modal').remove()" style="background:#f3ebe9;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0">
          <span class="material-symbols-outlined" style="font-size:18px;color:#5a403c">close</span>
        </button>
      </div>

      <div style="margin-bottom:20px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:6px">
          Anthropic API Key
          <span style="font-weight:400;color:${hasKey?'#2e7d32':'#b52619'}">${hasKey?' (gespeichert ✓)':' (nicht gesetzt)'}</span>
        </label>
        <input id="settings-api-key" type="password" placeholder="sk-ant-api03-..."
          value="${hasKey ? '••••••••••••••••••••••••••••••' : ''}"
          onfocus="if(this.value.startsWith('•'))this.value=''"
          style="width:100%;padding:12px 16px;border:1.5px solid ${hasKey?'#a5d6a7':'#e3beb8'};border-radius:12px;font-size:14px;font-family:monospace;color:#261816;background:#fff;box-sizing:border-box;outline:none"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='${hasKey?'#a5d6a7':'#e3beb8'}'"/>
        <p style="font-size:11px;color:#8d6562;margin:6px 0 0">Wird nur lokal in deinem Browser gespeichert (localStorage). Nie auf GitHub.</p>
      </div>

      <div style="background:#fff8f6;border:1px solid #e3beb8;border-radius:12px;padding:14px;margin-bottom:20px;font-size:12px;color:#5a403c">
        <strong>Wozu brauche ich den Key?</strong><br>
        Für die Preissuche (Tab "Suche") und Rechnung-Scan (Tab "Upload"). Ohne Key funktionieren alle anderen Tabs normal.
        <br><br>Key erstellen: <strong>console.anthropic.com → API Keys</strong>
      </div>

      <!-- N8N Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">🔗</span> N8N-Workflows
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <span style="font-size:12px;color:#5a403c" id="n8n-toggle-label">${localStorage.getItem('pizzeria_n8n_enabled')==='1'?'Aktiv':'Inaktiv'}</span>
            <div onclick="(function(){const on=localStorage.getItem('pizzeria_n8n_enabled')==='1'; localStorage.setItem('pizzeria_n8n_enabled',on?'0':'1'); document.getElementById('n8n-toggle-label').textContent=on?'Inaktiv':'Aktiv'; document.getElementById('n8n-toggle-btn').style.background=on?'#ccc':'#610000'; document.getElementById('n8n-toggle-thumb').style.transform=on?'translateX(0)':'translateX(20px)';})()"
              id="n8n-toggle-btn"
              style="width:44px;height:24px;border-radius:12px;background:${localStorage.getItem('pizzeria_n8n_enabled')==='1'?'#610000':'#ccc'};position:relative;cursor:pointer;transition:background .2s">
              <div id="n8n-toggle-thumb" style="position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;transform:${localStorage.getItem('pizzeria_n8n_enabled')==='1'?'translateX(20px)':'translateX(0)'}"></div>
            </div>
          </label>
        </div>
        <input id="settings-n8n-url" type="text" placeholder="http://localhost:5678"
          value="${localStorage.getItem('pizzeria_n8n_url')||''}"
          style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:13px;font-family:monospace;color:#261816;background:#fff;box-sizing:border-box;outline:none"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        <p style="font-size:11px;color:#8d6562;margin:5px 0 0">Webhook-URL des N8N-Servers (z.B. http://localhost:5678)</p>
      </div>

      <!-- Restaurant-Einrichtung -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:18px">🏪</span> Restaurant
        </label>
        <div style="font-size:13px;color:#5a403c;margin-bottom:10px">
          <strong>${getRConfig('name')}</strong> · ${getRConfig('adresse')}
        </div>
        <button onclick="document.getElementById('settings-modal').remove();showSetupWizard()"
          style="padding:9px 18px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:13px;font-weight:700;color:#610000;cursor:pointer;font-family:inherit">
          ✏️ Restaurant bearbeiten
        </button>
      </div>

      <!-- Sprache / Language -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:18px">🌍</span> ${t('settings.language')}
        </label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[['de','🇩🇪 Deutsch'],['en','🇬🇧 English'],['nl','🇳🇱 Nederlands'],['ar','🇸🇦 العربية']].map(([code, label]) =>
            `<button onclick="setLang('${code}');document.getElementById('settings-modal').remove();openSettings()"
              style="padding:8px 16px;border-radius:10px;border:2px solid ${_currentLang===code?'#610000':'#e3beb8'};background:${_currentLang===code?'#610000':'#fff'};color:${_currentLang===code?'#fff':'#5a403c'};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              ${label}
            </button>`
          ).join('')}
        </div>
      </div>

      <!-- Gemini Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">🤖</span> AI Anbieter
          </label>
          <div style="display:flex;gap:6px">
            <button id="ai-btn-claude"
              onclick="(function(){localStorage.setItem('pizzeria_ai_provider','claude');document.getElementById('ai-btn-claude').style.background='#610000';document.getElementById('ai-btn-claude').style.color='#fff';document.getElementById('ai-btn-gemini').style.background='#f3ebe9';document.getElementById('ai-btn-gemini').style.color='#5a403c';})()"
              style="padding:6px 14px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:${(localStorage.getItem('pizzeria_ai_provider')||'claude')==='claude'?'#610000':'#f3ebe9'};color:${(localStorage.getItem('pizzeria_ai_provider')||'claude')==='claude'?'#fff':'#5a403c'}">
              Claude
            </button>
            <button id="ai-btn-gemini"
              onclick="(function(){localStorage.setItem('pizzeria_ai_provider','gemini');document.getElementById('ai-btn-gemini').style.background='#1a73e8';document.getElementById('ai-btn-gemini').style.color='#fff';document.getElementById('ai-btn-claude').style.background='#f3ebe9';document.getElementById('ai-btn-claude').style.color='#5a403c';})()"
              style="padding:6px 14px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:${localStorage.getItem('pizzeria_ai_provider')==='gemini'?'#1a73e8':'#f3ebe9'};color:${localStorage.getItem('pizzeria_ai_provider')==='gemini'?'#fff':'#5a403c'}">
              Gemini
            </button>
          </div>
        </div>
        <input id="settings-gemini-key" type="password" placeholder="AIza..."
          value="${localStorage.getItem('pizzeria_gemini_key') ? '••••••••••••••••••••••••••••••' : ''}"
          onfocus="if(this.value.startsWith('•'))this.value=''"
          style="width:100%;padding:10px 14px;border:1.5px solid ${localStorage.getItem('pizzeria_gemini_key')?'#a5d6a7':'#e3beb8'};border-radius:12px;font-size:13px;font-family:monospace;color:#261816;background:#fff;box-sizing:border-box;outline:none"
          onfocusin="this.style.borderColor='#1a73e8'" onblur="this.style.borderColor='${localStorage.getItem('pizzeria_gemini_key')?'#a5d6a7':'#e3beb8'}'"/>
        <p style="font-size:11px;color:#8d6562;margin:5px 0 0">Google Gemini API Key — <strong>aistudio.google.com</strong> → Get API Key (kostenlos)</p>
      </div>

      <!-- Notion Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <img src="https://www.notion.so/images/favicon.ico" style="width:16px;height:16px;border-radius:3px" onerror="this.style.display='none'"> Notion Integration
        </label>
        <input id="settings-notion-key" type="password" placeholder="secret_xxxxxxxxxxxx"
          value="${localStorage.getItem('pizzeria_notion_key') ? '••••••••••••••••••••••••' : ''}"
          onfocus="if(this.value.startsWith('•'))this.value=''"
          style="width:100%;padding:10px 14px;border:1.5px solid ${localStorage.getItem('pizzeria_notion_key')?'#a5d6a7':'#e3beb8'};border-radius:12px;font-size:13px;font-family:monospace;color:#261816;background:#fff;box-sizing:border-box;outline:none;margin-bottom:8px"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='${localStorage.getItem('pizzeria_notion_key')?'#a5d6a7':'#e3beb8'}'"/>
        <p style="font-size:11px;color:#8d6562;margin:0 0 10px">Notion Integration Token — <strong>notion.so/my-integrations</strong> → New Integration → Internal Integration Secret</p>
        <input id="notion-page-input" type="text" placeholder="Notion Parent Page ID (optional)"
          value="${localStorage.getItem('pizzeria_notion_parent_id')||''}"
          style="width:100%;padding:10px 14px;border:1.5px solid ${localStorage.getItem('pizzeria_notion_parent_id')?'#a5d6a7':'#e3beb8'};border-radius:12px;font-size:13px;font-family:monospace;color:#261816;background:#fff;box-sizing:border-box;outline:none;margin-bottom:6px"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='${localStorage.getItem('pizzeria_notion_parent_id')?'#a5d6a7':'#e3beb8'}'"/>
        <p style="font-size:11px;color:#8d6562;margin:0">Parent Page ID: 32-stellige ID aus der Notion-Seiten-URL (für Aufgaben- und Tagesbericht-Sync)</p>
      </div>

      <!-- Theme Picker -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🎨</span> Design-Stil
        </label>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
          <button class="theme-pick-btn" data-theme="classic" onclick="applyTheme('classic')"
            style="border:none;border-radius:14px;padding:14px 8px;cursor:pointer;font-family:inherit;transition:all .2s;outline:${(localStorage.getItem('pizzeria_theme')||'classic')==='classic'?'3px solid #610000':'none'};transform:${(localStorage.getItem('pizzeria_theme')||'classic')==='classic'?'scale(1.05)':'scale(1)'};background:linear-gradient(135deg,#fff8f6,#ffe8e3)">
            <div style="font-size:22px;margin-bottom:6px">☀️</div>
            <div style="font-size:12px;font-weight:700;color:#610000">Classic</div>
            <div style="font-size:10px;color:#7a6460;margin-top:2px">Rot &amp; Creme</div>
          </button>
          <button class="theme-pick-btn" data-theme="dark" onclick="applyTheme('dark')"
            style="border:none;border-radius:14px;padding:14px 8px;cursor:pointer;font-family:inherit;transition:all .2s;outline:${localStorage.getItem('pizzeria_theme')==='dark'?'3px solid #610000':'none'};transform:${localStorage.getItem('pizzeria_theme')==='dark'?'scale(1.05)':'scale(1)'};background:linear-gradient(135deg,#1a1a2e,#0f0f1a)">
            <div style="font-size:22px;margin-bottom:6px">🌙</div>
            <div style="font-size:12px;font-weight:700;color:#e05555">Dark Navy</div>
            <div style="font-size:10px;color:#6868aa;margin-top:2px">Dunkel &amp; Blau</div>
          </button>
          <button class="theme-pick-btn" data-theme="dark-red" onclick="applyTheme('dark-red')"
            style="border:none;border-radius:14px;padding:14px 8px;cursor:pointer;font-family:inherit;transition:all .2s;outline:${localStorage.getItem('pizzeria_theme')==='dark-red'?'3px solid #610000':'none'};transform:${localStorage.getItem('pizzeria_theme')==='dark-red'?'scale(1.05)':'scale(1)'};background:linear-gradient(135deg,#1e0c0c,#110808)">
            <div style="font-size:22px;margin-bottom:6px">🔥</div>
            <div style="font-size:12px;font-weight:700;color:#ff4444">Dark Red</div>
            <div style="font-size:10px;color:#886060;margin-top:2px">Dunkel &amp; Rot</div>
          </button>
          <button class="theme-pick-btn" data-theme="glass" onclick="applyTheme('glass')"
            style="border:none;border-radius:14px;padding:14px 8px;cursor:pointer;font-family:inherit;transition:all .2s;outline:${localStorage.getItem('pizzeria_theme')==='glass'?'3px solid #e05555':'none'};transform:${localStorage.getItem('pizzeria_theme')==='glass'?'scale(1.05)':'scale(1)'};background:linear-gradient(135deg,#0a0b0d,#1a1020);border:1px solid rgba(255,255,255,0.08)">
            <div style="font-size:22px;margin-bottom:6px">💎</div>
            <div style="font-size:12px;font-weight:700;color:#e5e7eb">Glass</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px">Stitch &amp; Dark</div>
          </button>
        </div>
        <p style="font-size:11px;color:#8d6562;margin:8px 0 0">Design-Stil wird sofort angewendet und gespeichert.</p>
      </div>

      <!-- Google Bewertungen Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:18px">⭐</span> Google Bewertungen
        </label>
        <input id="settings-google-place-id" type="text" placeholder="Google Place ID (z.B. ChIJ...)"
          value="${localStorage.getItem('psc_google_place_id')||''}"
          style="width:100%;padding:10px 14px;border:1.5px solid ${localStorage.getItem('psc_google_place_id')?'#a5d6a7':'#e3beb8'};border-radius:12px;font-size:13px;font-family:monospace;color:#261816;background:#fff;box-sizing:border-box;outline:none;margin-bottom:6px"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='${localStorage.getItem('psc_google_place_id')?'#a5d6a7':'#e3beb8'}'"/>
        <p style="font-size:11px;color:#8d6562;margin:0 0 6px">Google Place ID deiner Pizzeria — findest du auf <strong>developers.google.com/maps/documentation/javascript/examples/places-placeid-finder</strong></p>
        <p style="font-size:11px;color:#8d6562;margin:0">Google API Key (<code>GOOGLE_PLACES_API_KEY</code>) muss in der <strong>.env</strong> Datei gesetzt sein.</p>
      </div>

      <!-- Umsatz-Ziele Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🎯</span> Umsatz-Ziele
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:11px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Tagesziel (€)</label>
            <input type="number" id="settings-tagesziel" min="0" step="50"
              value="${localStorage.getItem('psc_tagesziel')||''}"
              placeholder="z.B. 800"
              style="width:100%;padding:10px 12px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;color:#261816;background:#fff;box-sizing:border-box;outline:none"
              onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:#5a403c;display:block;margin-bottom:4px">Monatsziel (€)</label>
            <input type="number" id="settings-monatsziel" min="0" step="500"
              value="${localStorage.getItem('psc_monatsziel') || localStorage.getItem('pizzeria_umsatz_ziel') || ''}"
              placeholder="z.B. 20000"
              style="width:100%;padding:10px 12px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;color:#261816;background:#fff;box-sizing:border-box;outline:none"
              onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'">
          </div>
        </div>
        <p style="font-size:11px;color:#8d6562;margin:8px 0 0">Wird als Fortschrittsbalken im Dashboard angezeigt.</p>
      </div>

      <!-- Fixkosten Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🏠</span> Fixkosten (monatlich)
        </label>
        ${(() => {
          let fix = {miete:0,strom:0,versicherung:0,buchhaltung:0,sonstige:0};
          try { const v=localStorage.getItem('biz_fixkosten'); if(v) fix=JSON.parse(v); } catch(_) {}
          return [
            ['miete','Miete / Pacht','home'],
            ['strom','Strom & Gas','bolt'],
            ['versicherung','Versicherung','shield'],
            ['buchhaltung','Buchhaltung','description'],
            ['sonstige','Sonstiges','more_horiz']
          ].map(([key,label,icon]) => `
            <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f5ede8">
              <span class="material-symbols-outlined" style="font-size:16px;color:#8B0000;flex-shrink:0">${icon}</span>
              <span style="font-size:12px;font-weight:600;color:#5a403c;flex:1">${label}</span>
              <input type="number" id="fk-${key}" value="${fix[key]||''}" min="0" step="10" placeholder="0"
                onchange="settingsFixkostenUpdate()"
                style="width:90px;padding:6px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-weight:700;color:#261816;text-align:right;font-family:inherit;outline:none"
                onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'">
              <span style="font-size:12px;color:#8d6562;flex-shrink:0">€/Monat</span>
            </div>`).join('')
          + `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 0">
              <span style="font-size:12px;font-weight:700;color:#5a403c">Gesamt / Monat</span>
              <span id="fk-sum" style="font-size:16px;font-weight:900;color:#610000">${
                ['miete','strom','versicherung','buchhaltung','sonstige'].reduce((s,k)=>s+(parseFloat(fix[k])||0),0).toFixed(2).replace('.',',')
              } €</span>
            </div>
            <div style="display:flex;justify-content:flex-end">
              <span style="font-size:11px;color:#8d6562">= <span id="fk-day">${
                (['miete','strom','versicherung','buchhaltung','sonstige'].reduce((s,k)=>s+(parseFloat(fix[k])||0),0)/30).toFixed(2).replace('.',',')
              } €/Tag</span></span>
            </div>`;
        })()}
        <p style="font-size:11px;color:#8d6562;margin:8px 0 0">Wird auch im Business-Tab und Dashboard verwendet.</p>
      </div>

      <!-- Schichtzeiten Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🕐</span> Öffnungszeiten pro Wochentag
        </label>
        ${(() => {
          const SZ_DEFAULT = {Mo:{von:'11:00',bis:'23:00',ruhetag:false},Di:{von:'11:00',bis:'23:00',ruhetag:false},Mi:{von:'11:00',bis:'23:00',ruhetag:false},Do:{von:'11:00',bis:'23:00',ruhetag:false},Fr:{von:'11:00',bis:'23:00',ruhetag:false},Sa:{von:'11:00',bis:'23:00',ruhetag:false},So:{von:'11:00',bis:'23:00',ruhetag:false}};
          let sz = SZ_DEFAULT;
          try { sz = JSON.parse(localStorage.getItem('psc_schichtzeiten')||'null') || SZ_DEFAULT; } catch(_) {}
          const days = ['Mo','Di','Mi','Do','Fr','Sa','So'];
          const dayNames = {Mo:'Montag',Di:'Dienstag',Mi:'Mittwoch',Do:'Donnerstag',Fr:'Freitag',Sa:'Samstag',So:'Sonntag'};
          return days.map(d => {
            const cfg = sz[d] || {von:'11:00',bis:'23:00',ruhetag:false};
            return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f5ede8">
              <span style="font-size:12px;font-weight:700;color:#5a403c;width:28px;flex-shrink:0">${d}</span>
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;flex-shrink:0">
                <input type="checkbox" id="sz-rh-${d}" ${cfg.ruhetag?'checked':''} onchange="(function(el){var row=document.getElementById('sz-row-${d}');if(row)row.style.opacity=el.checked?'0.3':'1';row.querySelectorAll('input[type=time]').forEach(function(i){i.disabled=el.checked;});})(this)" style="accent-color:#610000;width:14px;height:14px">
                <span style="font-size:11px;color:#8d6562">Ruhetag</span>
              </label>
              <div id="sz-row-${d}" style="display:flex;align-items:center;gap:6px;flex:1;opacity:${cfg.ruhetag?'0.3':'1'}">
                <input type="time" id="sz-von-${d}" value="${cfg.von||'11:00'}" ${cfg.ruhetag?'disabled':''} style="padding:5px 8px;border:1.5px solid #e3beb8;border-radius:8px;font-size:12px;color:#261816;background:#fff;font-family:inherit;width:90px" onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'">
                <span style="font-size:11px;color:#8d6562">–</span>
                <input type="time" id="sz-bis-${d}" value="${cfg.bis||'23:00'}" ${cfg.ruhetag?'disabled':''} style="padding:5px 8px;border:1.5px solid #e3beb8;border-radius:8px;font-size:12px;color:#261816;background:#fff;font-family:inherit;width:90px" onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'">
                <span style="font-size:11px;color:#9e6b62">Uhr</span>
              </div>
            </div>`;
          }).join('');
        })()}
        <p style="font-size:11px;color:#8d6562;margin:8px 0 0">Wird im Dienstplan und HACCP angezeigt. AT-Feiertage werden automatisch markiert.</p>
      </div>

      <!-- Externer Zugriff (Cloudflare Tunnel) -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">🌐</span> Externer Zugriff
          </label>
          <button onclick="showCloudflareTunnelInfo()" style="padding:6px 14px;border-radius:8px;border:1.5px solid #e3beb8;background:#fff;color:#610000;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Anleitung anzeigen</button>
        </div>
        <p style="font-size:11px;color:#8d6562;margin:0">Mit Cloudflare Tunnel ist die App von überall via HTTPS erreichbar — kein Router nötig.</p>
      </div>

      <!-- Auto-Backup Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        ${(() => {
          const lastBak = localStorage.getItem('psc_last_backup');
          const autoOn  = localStorage.getItem('psc_auto_backup') === '1';
          const lastStr = lastBak ? new Date(lastBak).toLocaleString('de-AT') : '— noch nie —';
          return `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">☁️</span> Auto-Backup (täglich)
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <span id="bak-toggle-label" style="font-size:12px;color:#5a403c">${autoOn?'Aktiv':'Inaktiv'}</span>
              <div onclick="(function(){const on=localStorage.getItem('psc_auto_backup')==='1';localStorage.setItem('psc_auto_backup',on?'0':'1');document.getElementById('bak-toggle-label').textContent=on?'Inaktiv':'Aktiv';document.getElementById('bak-toggle-btn').style.background=on?'#ccc':'#2e7d32';document.getElementById('bak-toggle-thumb').style.transform=on?'translateX(0)':'translateX(20px)';})()"
                id="bak-toggle-btn"
                style="width:44px;height:24px;border-radius:12px;background:${autoOn?'#2e7d32':'#ccc'};position:relative;cursor:pointer;transition:background .2s">
                <div id="bak-toggle-thumb" style="position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;transform:${autoOn?'translateX(20px)':'translateX(0)'}"></div>
              </div>
            </label>
          </div>
          <div style="font-size:12px;color:#8d6562;margin-bottom:10px">Zuletzt gesichert: <strong>${lastStr}</strong></div>
          <div id="bak-status" style="font-size:12px;margin-bottom:8px;display:none"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button onclick="appBackupNow()" style="padding:9px 18px;background:#2e7d32;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 Jetzt sichern</button>
            <button onclick="appBackupDownload()" style="padding:9px 18px;background:#1565c0;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">⬇️ Herunterladen</button>
          </div>`;
        })()}
      </div>

      <!-- Turso Cloud Sync Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:18px">☁️</span> Turso Cloud-Sync
        </label>
        <p style="font-size:12px;color:#8d6562;margin:0 0 10px">Alle Daten (Lager, Kasse, Mitarbeiter, ...) in Turso hochladen — dann auf jedem Gerät verfügbar.</p>
        <div id="turso-push-status" style="font-size:12px;margin-bottom:8px;display:none"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="tursoCloudPush()" style="padding:9px 18px;background:#0d47a1;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">⬆️ Jetzt zu Cloud pushen</button>
          <button onclick="tursoCheckStatus()" style="padding:9px 18px;background:#f3ebe9;color:#610000;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🔍 Status prüfen</button>
        </div>
      </div>

      <!-- Drucker Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🖨️</span> Bondrucker-Einstellungen
        </label>
        <div style="display:grid;grid-template-columns:1fr auto;gap:10px;margin-bottom:10px;align-items:end">
          <div>
            <div style="font-size:11px;font-weight:700;color:#5a403c;margin-bottom:4px">IP-Adresse</div>
            <input id="s-drucker-ip" type="text" placeholder="192.168.1.100"
              value="${localStorage.getItem('psc_drucker_ip')||''}"
              style="width:100%;padding:9px 12px;border:1.5px solid #e3beb8;border-radius:9px;font-size:13px;font-family:monospace;color:#261816;background:#fff;box-sizing:border-box;outline:none"
              onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#5a403c;margin-bottom:4px">Port</div>
            <input id="s-drucker-port" type="number" placeholder="9100" value="${localStorage.getItem('psc_drucker_port')||'9100'}"
              style="width:75px;padding:9px 10px;border:1.5px solid #e3beb8;border-radius:9px;font-size:13px;font-family:monospace;color:#261816;background:#fff;text-align:center;outline:none"
              onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
        </div>
        <div id="drucker-test-status" style="font-size:12px;margin-bottom:8px;display:none"></div>
        <div style="display:flex;gap:8px">
          <button onclick="druckerTest()" style="padding:8px 16px;background:#f3ebe9;color:#610000;border:1.5px solid #e3beb8;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🖨️ Test drucken</button>
        </div>
        <p style="font-size:11px;color:#8d6562;margin:6px 0 0">ESC/POS Drucker im lokalen Netzwerk (z.B. Epson TM-T20, Star TSP). Standard-Port: 9100.</p>
      </div>

      <!-- Mindestbestand Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">📦</span> Mindestbestand — Standardwerte pro Kategorie
        </label>
        ${(() => {
          const KATS = ['Grundzutaten','Käse','Belag','Fleisch & Fisch','Getränke','Reinigung','Verpackung','Sonstiges'];
          let mb = {}; try { const v=localStorage.getItem('psc_mindest_defaults'); if(v) mb=JSON.parse(v); } catch(_) {}
          return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">
            ${KATS.map(k => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid #e3beb8;border-radius:8px;background:#fff8f6">
              <span style="font-size:12px;color:#5a403c">${k}</span>
              <input type="number" id="mb-${k.replace(/[^a-z0-9]/gi,'_')}" min="0" step="1"
                value="${mb[k]!==undefined?mb[k]:5}"
                style="width:55px;padding:4px 8px;border:1.5px solid #e3beb8;border-radius:6px;font-size:13px;font-weight:700;text-align:center;font-family:inherit;outline:none"
                onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
            </div>`).join('')}
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:10px">
            <button onclick="lagerMindestDefaults()" style="padding:7px 16px;background:#610000;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Auf alle Lagerartikel anwenden</button>
          </div>
          <p style="font-size:11px;color:#8d6562;margin:6px 0 0">Standard-Alarm-Grenze bei neuen Artikeln. "Anwenden" setzt Grenzen bei bestehenden Artikeln ohne individuelle Werte.</p>`;
        })()}
      </div>

      <!-- Pizza-Größen Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🍕</span> Pizza-Größen & Basis-Preise
        </label>
        ${(() => {
          let pz = {S:{vk:10.5,teig:1.2},M:{vk:12.9,teig:1.8},L:{vk:14.9,teig:2.3},XL:{vk:17.9,teig:3.0}};
          try { const v=localStorage.getItem('psc_pizza_groessen'); if(v) pz=JSON.parse(v); } catch(_) {}
          return `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#fff8f6">
              <th style="padding:8px 10px;text-align:left;color:#5a403c;font-weight:700;border-bottom:1.5px solid #e3beb8">Größe</th>
              <th style="padding:8px 10px;text-align:right;color:#5a403c;font-weight:700;border-bottom:1.5px solid #e3beb8">VK-Preis (€)</th>
              <th style="padding:8px 10px;text-align:right;color:#5a403c;font-weight:700;border-bottom:1.5px solid #e3beb8">Teig/Mat. (€)</th>
              <th style="padding:8px 10px;text-align:right;color:#5a403c;font-weight:700;border-bottom:1.5px solid #e3beb8">Rohertrag</th>
            </tr></thead>
            <tbody>${['S','M','L','XL'].map(sz => {
              const rohe = (pz[sz]?.vk||0) - (pz[sz]?.teig||0);
              const marge = pz[sz]?.vk > 0 ? Math.round((rohe/(pz[sz]?.vk||1))*100) : 0;
              return `<tr style="border-bottom:1px solid #f0e4e1">
                <td style="padding:8px 10px;font-weight:800;color:#610000;font-size:15px">${sz}</td>
                <td style="padding:8px 10px;text-align:right"><input type="number" id="pz-vk-${sz}" value="${pz[sz]?.vk||''}" min="0" step="0.10" style="width:75px;padding:5px 8px;border:1.5px solid #e3beb8;border-radius:7px;font-size:13px;font-weight:700;text-align:right;font-family:inherit;outline:none" oninput="settingsPizzaGroessenUpdate()" onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/></td>
                <td style="padding:8px 10px;text-align:right"><input type="number" id="pz-teig-${sz}" value="${pz[sz]?.teig||''}" min="0" step="0.10" style="width:75px;padding:5px 8px;border:1.5px solid #e3beb8;border-radius:7px;font-size:13px;text-align:right;font-family:inherit;outline:none" oninput="settingsPizzaGroessenUpdate()" onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/></td>
                <td id="pz-marge-${sz}" style="padding:8px 10px;text-align:right;font-weight:700;color:${marge>=65?'#2e7d32':marge>=45?'#e65100':'#b52619'}">${marge}%</td>
              </tr>`;
            }).join('')}</tbody>
          </table></div>
          <p style="font-size:11px;color:#8d6562;margin:6px 0 0">Im Speisekarte-Tab → Neues Gericht → Größe auswählen übernimmt VK automatisch.</p>`;
        })()}
      </div>

      <!-- Personalkosten-Alarm Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">👥</span> Personalkosten-Alarm
        </label>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:180px">
            <label style="font-size:12px;color:#5a403c;white-space:nowrap">Alarm wenn Lohn über</label>
            <input type="number" id="s-personal-alarm-pct" min="1" max="100" step="1"
              value="${parseFloat(localStorage.getItem('psc_personal_alarm_pct')||'35')||35}"
              style="width:65px;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:14px;font-weight:700;color:#261816;text-align:center;font-family:inherit;outline:none"
              onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
            <label style="font-size:12px;color:#5a403c">% des Umsatzes</label>
          </div>
        </div>
        <p style="font-size:11px;color:#8d6562;margin:6px 0 0">Wird im Dashboard als rote Warnung angezeigt wenn die Grenze überschritten wird.</p>
      </div>

      <!-- Benachrichtigungs-Filter Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🔔</span> Benachrichtigungs-Filter
        </label>
        ${(function(){
          var filter = {};
          try { filter = JSON.parse(localStorage.getItem('psc_alarm_filter')||'{}'); } catch(e) {}
          var alarme = [
            { id:'lager',     label:'Lager-Alarm',           icon:'📦', desc:'Wenn Bestand unter Minimum fällt' },
            { id:'personal',  label:'Personalkosten-Alarm',  icon:'👥', desc:'Wenn Lohnkosten-Grenze überschritten' },
            { id:'preis',     label:'Preis-Alarm',           icon:'💰', desc:'Wenn günstigere Preise gefunden werden' },
            { id:'mhd',       label:'MHD-Alarm',             icon:'📅', desc:'Wenn Ablaufdatum in 3 Tagen' },
            { id:'rechnung',  label:'Neue Rechnungen',       icon:'📄', desc:'Bei neuen E-Mail-PDFs' },
          ];
          return alarme.map(function(a){
            var aktiv = filter[a.id] !== false;
            return '<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:#f8f4f4;border-radius:8px;margin-bottom:6px;cursor:pointer">' +
              '<input type="checkbox" id="alarm-' + a.id + '" ' + (aktiv?'checked':'') + ' style="width:16px;height:16px;accent-color:#610000">' +
              '<span style="font-size:15px">' + a.icon + '</span>' +
              '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:#261816">' + a.label + '</div>' +
              '<div style="font-size:10px;color:#8d6562">' + a.desc + '</div></div></label>';
          }).join('');
        })()}
        <p style="font-size:11px;color:#8d6562;margin:6px 0 0">Deaktivierte Alarme werden beim Speichern ausgeblendet.</p>
      </div>

      <!-- Trinkgeld-Regeln % Abteilung -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">💰</span> Trinkgeld-Regeln (% pro Abteilung)
        </label>
        ${(function(){
          var regeln = { kueche:30, service:40, lieferung:30 };
          try { var s = localStorage.getItem('psc_trinkgeld_regeln'); if(s) regeln = JSON.parse(s); } catch(e) {}
          var abt = [
            { id:'kueche',    label:'👨‍🍳 Küche',    key:'kueche' },
            { id:'service',   label:'🍽️ Service',   key:'service' },
            { id:'lieferung', label:'🚗 Lieferung', key:'lieferung' },
          ];
          return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
            abt.map(function(a){
              return '<div style="background:#f8f4f4;border-radius:8px;padding:10px;text-align:center">' +
                '<div style="font-size:12px;font-weight:600;color:#261816;margin-bottom:6px">' + a.label + '</div>' +
                '<div style="display:flex;align-items:center;gap:4px;justify-content:center">' +
                '<input type="number" id="tg-regel-' + a.id + '" min="0" max="100" value="' + (regeln[a.key]||0) + '" ' +
                'style="width:55px;padding:6px;border:1.5px solid #e3beb8;border-radius:6px;font-size:15px;font-weight:700;text-align:center;font-family:inherit">' +
                '<span style="font-size:13px;color:#5a403c">%</span></div></div>';
            }).join('') + '</div>' +
            '<p style="font-size:11px;color:#8d6562;margin:8px 0 0">Summe sollte 100% ergeben. Wird im Trinkgeld-Tab für automatische Aufteilung verwendet.</p>';
        })()}
      </div>

      <!-- Schließtage Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:18px">🔒</span> Schließtage (geschlossen)
        </label>
        <p style="font-size:11px;color:#8d6562;margin:0 0 12px">Diese Tage werden im Dienstplan als "Geschlossen" markiert (nicht klickbar). Format: TT.MM. — gilt jedes Jahr.</p>
        <div id="schliesstage-liste" style="margin-bottom:10px">
          ${(function(){
            var tage = ['24.12','31.12'];
            try { var s = localStorage.getItem('psc_schliesstage'); if(s) tage = JSON.parse(s); } catch(e) {}
            if (!tage.length) return '<div style="font-size:12px;color:#8d6562;font-style:italic">Keine Schließtage konfiguriert.</div>';
            return tage.map(function(t,i){
              return '<div id="slt-' + i + '" style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f5f5f5;border-radius:8px;margin-bottom:5px">' +
                '<span style="font-size:18px">🔒</span>' +
                '<span style="flex:1;font-size:13px;font-weight:700;color:#261816">' + t + ' (jedes Jahr)</span>' +
                '<button onclick="schliestagEntfernen(' + i + ')" style="background:#fce4ec;color:#c62828;border:none;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">✕ Entfernen</button>' +
                '</div>';
            }).join('');
          })()}
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="text" id="slt-neu-input" placeholder="z.B. 01.01 oder 15.08"
            maxlength="5"
            style="padding:8px 12px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;color:#261816;width:130px;outline:none"
            onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"
            onkeydown="if(event.key==='Enter')schliestagHinzufuegen()">
          <button onclick="schliestagHinzufuegen()" style="padding:8px 16px;background:#610000;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">+ Hinzufügen</button>
        </div>
        <p style="font-size:10px;color:#8d6562;margin:6px 0 0">Beispiele: 24.12 = Heiligabend, 31.12 = Silvester, 01.01 = Neujahr</p>
      </div>

      <!-- Passwort ändern Sektion -->
      <div style="border-top:1px solid #e3beb8;padding-top:18px;margin-bottom:20px">
        <label style="font-size:13px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">🔑</span> Business-Passwort ändern
        </label>
        <input type="password" id="s-pw-current" placeholder="Aktuelles Passwort"
          style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box;outline:none;margin-bottom:8px"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        <input type="password" id="s-pw-new" placeholder="Neues Passwort (mind. 4 Zeichen)"
          style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box;outline:none;margin-bottom:8px"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        <input type="password" id="s-pw-confirm" placeholder="Neues Passwort bestätigen"
          style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box;outline:none;margin-bottom:8px"
          onfocusin="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        <div id="s-pw-msg" style="font-size:12px;margin-bottom:6px;display:none"></div>
        <button onclick="settingsChangePw()"
          style="padding:9px 20px;background:#610000;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          Passwort ändern
        </button>
      </div>

      <div style="display:flex;gap:10px">
        <button onclick="saveApiKey()" style="flex:1;background:#610000;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Speichern</button>
        ${hasKey?`<button onclick="clearApiKey()" style="padding:13px 16px;background:#ffdad6;color:#93000a;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Löschen</button>`:''}
        <button onclick="document.getElementById('settings-modal').remove()" style="padding:13px 20px;background:#f3ebe9;color:#5a403c;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Abbrechen</button>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('settings-api-key')?.focus(), 50);
}

// ── Schließtage ──
function _schliestageLaden() {
  try { return JSON.parse(localStorage.getItem('psc_schliesstage') || '["24.12","31.12"]'); } catch(e) { return ['24.12','31.12']; }
}
function _schliesstageSpeichern(tage) {
  localStorage.setItem('psc_schliesstage', JSON.stringify(tage));
}
function _schliessTageRefresh() {
  const tage = _schliestageLaden();
  const el = document.getElementById('schliesstage-liste');
  if (!el) return;
  if (!tage.length) { el.innerHTML = '<div style="font-size:12px;color:#8d6562;font-style:italic">Keine Schließtage konfiguriert.</div>'; return; }
  el.innerHTML = tage.map((t,i) =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f5f5f5;border-radius:8px;margin-bottom:5px">
      <span style="font-size:18px">🔒</span>
      <span style="flex:1;font-size:13px;font-weight:700;color:#261816">${_esc(t)} (jedes Jahr)</span>
      <button onclick="schliestagEntfernen(${i})" style="background:#fce4ec;color:#c62828;border:none;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">✕ Entfernen</button>
    </div>`
  ).join('');
}
function schliestagHinzufuegen() {
  const inp = document.getElementById('slt-neu-input');
  if (!inp) return;
  let val = inp.value.trim().replace(/[^0-9.]/g,'');
  // Format normalisieren: 01.01 oder 1.1 → 01.01
  const parts = val.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) { _showToast('Format: TT.MM (z.B. 24.12)', 'error'); return; }
  const tag = parts[0].padStart(2,'0'), mon = parts[1].padStart(2,'0');
  if (+mon < 1 || +mon > 12 || +tag < 1 || +tag > 31) { _showToast('Ungültiges Datum', 'error'); return; }
  const key = `${tag}.${mon}`;
  const tage = _schliestageLaden();
  if (tage.includes(key)) { _showToast('Bereits vorhanden', 'info'); return; }
  tage.push(key);
  tage.sort();
  _schliesstageSpeichern(tage);
  _schliessTageRefresh();
  inp.value = '';
  _showToast(`${key} als Schließtag gespeichert`, 'success');
}
function schliestagEntfernen(idx) {
  const tage = _schliestageLaden();
  tage.splice(idx, 1);
  _schliesstageSpeichern(tage);
  _schliessTageRefresh();
  _showToast('Schließtag entfernt', 'success');
}

function saveApiKey() {
  // API Key — optional, nur speichern wenn neu eingegeben
  const val = document.getElementById('settings-api-key')?.value.trim();
  if (val && !val.startsWith('•')) {
    if (!val.startsWith('sk-ant-')) { _showToast('Ungültiges API-Key Format. Muss mit "sk-ant-" beginnen.', 'error'); return; }
    _safeLocalSet('pizzeria_api_key', val);
    ANTHROPIC_API_KEY = val;
  }
  const n8nUrl = document.getElementById('settings-n8n-url')?.value.trim();
  if (n8nUrl) _safeLocalSet('pizzeria_n8n_url', n8nUrl);
  const geminiVal = document.getElementById('settings-gemini-key')?.value.trim();
  if (geminiVal && !geminiVal.startsWith('•')) { _safeLocalSet('pizzeria_gemini_key', geminiVal); GEMINI_API_KEY = geminiVal; }
  const notionVal = document.getElementById('settings-notion-key')?.value.trim();
  if (notionVal && !notionVal.startsWith('•')) { _safeLocalSet('pizzeria_notion_key', notionVal); }
  const notionPageVal = document.getElementById('notion-page-input')?.value.trim();
  if (notionPageVal) _safeLocalSet('pizzeria_notion_parent_id', notionPageVal);
  const googlePlaceId = document.getElementById('settings-google-place-id')?.value.trim();
  if (googlePlaceId) _safeLocalSet('psc_google_place_id', googlePlaceId);
  // Fixkosten speichern
  const fkKeys = ['miete','strom','versicherung','buchhaltung','sonstige'];
  const fkData = {};
  let fkHasVal = false;
  fkKeys.forEach(function(k) {
    const v = parseFloat(document.getElementById('fk-'+k)?.value || '0') || 0;
    fkData[k] = v;
    if (v > 0) fkHasVal = true;
  });
  if (fkHasVal) {
    try { localStorage.setItem('biz_fixkosten', JSON.stringify(fkData)); } catch(_) {}
  }
  // Umsatz-Ziele speichern
  const tagesziel = parseFloat(document.getElementById('settings-tagesziel')?.value || '0');
  const monatsziel = parseFloat(document.getElementById('settings-monatsziel')?.value || '0');
  if (tagesziel > 0) _safeLocalSet('psc_tagesziel', String(tagesziel));
  if (monatsziel > 0) { _safeLocalSet('psc_monatsziel', String(monatsziel)); _safeLocalSet('pizzeria_umsatz_ziel', String(monatsziel)); }
  // Drucker-Einstellungen speichern
  const druckerIp = (document.getElementById('s-drucker-ip')?.value||'').trim();
  const druckerPort = (document.getElementById('s-drucker-port')?.value||'9100').trim();
  if (druckerIp) { _safeLocalSet('psc_drucker_ip', druckerIp); _safeLocalSet('psc_drucker_port', druckerPort || '9100'); }
  // Mindestbestand-Defaults speichern
  const MBKATS = ['Grundzutaten','Käse','Belag','Fleisch & Fisch','Getränke','Reinigung','Verpackung','Sonstiges'];
  const mbData = {}; let mbHasVal = false;
  MBKATS.forEach(k => {
    const id = 'mb-' + k.replace(/[^a-z0-9]/gi,'_');
    const v = parseFloat(document.getElementById(id)?.value||'0');
    if (!isNaN(v) && v >= 0) { mbData[k] = v; mbHasVal = true; }
  });
  if (mbHasVal) { try { localStorage.setItem('psc_mindest_defaults', JSON.stringify(mbData)); } catch(_) {} }
  // Pizza-Größen speichern
  const pzSizes = ['S','M','L','XL'];
  const pzData = {}; let pzHasVal = false;
  pzSizes.forEach(sz => {
    const vk   = parseFloat(document.getElementById('pz-vk-'+sz)?.value||'0')||0;
    const teig = parseFloat(document.getElementById('pz-teig-'+sz)?.value||'0')||0;
    pzData[sz] = {vk, teig};
    if (vk > 0) pzHasVal = true;
  });
  if (pzHasVal) { try { localStorage.setItem('psc_pizza_groessen', JSON.stringify(pzData)); } catch(_) {} }
  // Personalkosten-Alarm speichern
  const palPct = parseFloat(document.getElementById('s-personal-alarm-pct')?.value || '35');
  if (palPct > 0) _safeLocalSet('psc_personal_alarm_pct', String(palPct));
  // Benachrichtigungs-Filter speichern
  var alarmIds = ['lager','personal','preis','mhd','rechnung'];
  var alarmFilter = {};
  alarmIds.forEach(function(id) { alarmFilter[id] = document.getElementById('alarm-'+id)?.checked !== false; });
  try { localStorage.setItem('psc_alarm_filter', JSON.stringify(alarmFilter)); } catch(_) {}
  // Trinkgeld-Regeln speichern
  var tgRegeln = {};
  ['kueche','service','lieferung'].forEach(function(a) {
    var v = parseInt(document.getElementById('tg-regel-'+a)?.value || '0');
    tgRegeln[a] = isNaN(v) ? 0 : v;
  });
  try { localStorage.setItem('psc_trinkgeld_regeln', JSON.stringify(tgRegeln)); } catch(_) {}
  // Schichtzeiten speichern
  const szDays = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const szData = {};
  szDays.forEach(function(d) {
    szData[d] = {
      ruhetag: document.getElementById('sz-rh-'+d)?.checked || false,
      von:     document.getElementById('sz-von-'+d)?.value || '11:00',
      bis:     document.getElementById('sz-bis-'+d)?.value || '23:00'
    };
  });
  _safeLocalSet('psc_schichtzeiten', JSON.stringify(szData));
  document.getElementById('settings-modal')?.remove();
  const btn = document.getElementById('settings-btn');
  if (btn) btn.title = 'Einstellungen (API Key gesetzt ✓)';
  _showToast('Einstellungen gespeichert ✓', 'success');
  // Schichtzeiten zu Notion syncen
  schichtzeitenNotionSync(szData);
}
async function druckerTest() {
  const statusEl = document.getElementById('drucker-test-status');
  const ip   = (document.getElementById('s-drucker-ip')?.value || localStorage.getItem('psc_drucker_ip') || '').trim();
  const port = parseInt(document.getElementById('s-drucker-port')?.value || localStorage.getItem('psc_drucker_port') || '9100');
  if (!ip) { if (statusEl) { statusEl.textContent = '❌ Bitte IP-Adresse eingeben'; statusEl.style.color='#ba1a1a'; statusEl.style.display='block'; } return; }
  if (statusEl) { statusEl.textContent = '⏳ Verbinde mit ' + ip + ':' + port + '…'; statusEl.style.color='#5a403c'; statusEl.style.display='block'; }
  try {
    const r = await fetch('/api/printer/test', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ip,port}) });
    const j = await r.json();
    if (j.ok) {
      if (statusEl) { statusEl.textContent = '✅ Testdruck gesendet an ' + ip + ':' + port; statusEl.style.color='#386a20'; }
      _showToast('Testdruck gesendet ✓', 'success');
    } else {
      if (statusEl) { statusEl.textContent = '❌ ' + (j.error||'Druckfehler'); statusEl.style.color='#ba1a1a'; }
      _showToast('Druckfehler: ' + (j.error||'unbekannt'), 'error');
    }
  } catch(err) {
    if (statusEl) { statusEl.textContent = '❌ Server-Fehler: ' + err.message; statusEl.style.color='#ba1a1a'; }
  }
}
async function druckerSendBon(lines) {
  const ip   = localStorage.getItem('psc_drucker_ip') || '';
  const port = parseInt(localStorage.getItem('psc_drucker_port') || '9100');
  if (!ip) { _showToast('Drucker-IP nicht konfiguriert — Einstellungen ⚙️', 'error'); return false; }
  try {
    const r = await fetch('/api/printer/bon', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ip,port,lines}) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error||'Druckfehler');
    return true;
  } catch(err) {
    _showToast('Druckfehler: ' + err.message, 'error');
    return false;
  }
}
function lagerMindestDefaults() {
  const KATS = ['Grundzutaten','Käse','Belag','Fleisch & Fisch','Getränke','Reinigung','Verpackung','Sonstiges'];
  let mb = {}; try { const v=localStorage.getItem('psc_mindest_defaults'); if(v) mb=JSON.parse(v); } catch(_) {}
  // Erst speichern (aus Form lesen falls gerade offen)
  KATS.forEach(k => {
    const id = 'mb-' + k.replace(/[^a-z0-9]/gi,'_');
    const el = document.getElementById(id);
    if (el) { const v=parseFloat(el.value); if(!isNaN(v)&&v>=0) mb[k]=v; }
  });
  if (Object.keys(mb).length) { try { localStorage.setItem('psc_mindest_defaults', JSON.stringify(mb)); } catch(_) {} }
  // Auf Lagerartikel anwenden (nur wenn kein individueller Wert gesetzt, d.h. == 5 (default) oder 0)
  let lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(_) {}
  let updated = 0;
  lager = lager.map(a => {
    const def = mb[a.kategorie];
    if (def !== undefined && (a.mindest === 5 || a.mindest === 0 || a.mindest === undefined)) {
      updated++;
      return { ...a, mindest: def };
    }
    return a;
  });
  try { localStorage.setItem('pizzeria_lager', JSON.stringify(lager)); } catch(_) {}
  _showToast(updated + ' Lagerartikel aktualisiert', 'success');
  if (typeof renderLagerTab === 'function') renderLagerTab();
}
function settingsPizzaGroessenUpdate() {
  ['S','M','L','XL'].forEach(sz => {
    const vk   = parseFloat(document.getElementById('pz-vk-'+sz)?.value||'0')||0;
    const teig = parseFloat(document.getElementById('pz-teig-'+sz)?.value||'0')||0;
    const marge = vk > 0 ? Math.round(((vk-teig)/vk)*100) : 0;
    const el = document.getElementById('pz-marge-'+sz);
    if (el) { el.textContent = marge + '%'; el.style.color = marge>=65?'#2e7d32':marge>=45?'#e65100':'#b52619'; }
  });
}
function settingsFixkostenUpdate() {
  const keys = ['miete','strom','versicherung','buchhaltung','sonstige'];
  const sum = keys.reduce((s,k) => s + (parseFloat(document.getElementById('fk-'+k)?.value||'0')||0), 0);
  const sumEl = document.getElementById('fk-sum');
  const dayEl = document.getElementById('fk-day');
  if (sumEl) sumEl.textContent = sum.toFixed(2).replace('.',',') + ' €';
  if (dayEl) dayEl.textContent = (sum/30).toFixed(2).replace('.',',') + ' €/Tag';
}
function appBackupCollect() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) try { data[k] = JSON.parse(localStorage.getItem(k)); } catch(_) { data[k] = localStorage.getItem(k); }
  }
  return data;
}
async function appBackupNow(silent) {
  const statusEl = document.getElementById('bak-status');
  if (statusEl) { statusEl.textContent = '⏳ Sichern...'; statusEl.style.color='#5a403c'; statusEl.style.display='block'; }
  try {
    const data = appBackupCollect();
    const r = await fetch('/api/backup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error||'Fehler');
    localStorage.setItem('psc_last_backup', j.created);
    if (!silent) {
      if (statusEl) { statusEl.textContent = '✅ Gesichert: ' + new Date(j.created).toLocaleString('de-AT'); statusEl.style.color='#386a20'; }
      _showToast('Backup gespeichert ✓', 'success');
    }
  } catch(err) {
    if (!silent) {
      if (statusEl) { statusEl.textContent = '❌ ' + err.message; statusEl.style.color='#ba1a1a'; }
      _showToast('Backup fehlgeschlagen', 'error');
    }
  }
}
function appBackupDownload() {
  const data = appBackupCollect();
  const stamp = new Date().toISOString().slice(0,10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pizzeria-backup-' + stamp + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  _showToast('Backup heruntergeladen ✓', 'success');
}
function appAutoBackupCheck() {
  if (localStorage.getItem('psc_auto_backup') !== '1') return;
  const last = localStorage.getItem('psc_last_backup');
  if (last && (Date.now() - new Date(last).getTime()) < 86400000) return;
  appBackupNow(true);
}

async function tursoCloudPush() {
  const btn = document.querySelector('[onclick="tursoCloudPush()"]');
  const statusEl = document.getElementById('turso-push-status');
  const show = (t, ok) => { if (statusEl) { statusEl.textContent = t; statusEl.style.color = ok ? '#386a20' : '#ba1a1a'; statusEl.style.display = 'block'; } };
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Wird hochgeladen...'; }
  try {
    const payload = {};
    for (const key of SYNC_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        try { payload[key] = JSON.parse(val); } catch(_) { payload[key] = val; }
      }
    }
    const res = await fetch('/api/turso/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      show('✓ ' + data.saved + ' Datenbereiche zu Turso hochgeladen', true);
      _showToast(data.saved + ' Bereiche in Cloud gespeichert ✓', 'success');
    } else {
      show('Fehler: ' + (data.error || 'Unbekannt'), false);
    }
  } catch(e) {
    show('Verbindungsfehler: ' + e.message, false);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⬆️ Jetzt zu Cloud pushen'; }
  }
}

async function tursoCheckStatus() {
  const statusEl = document.getElementById('turso-push-status');
  const show = (t, ok) => { if (statusEl) { statusEl.textContent = t; statusEl.style.color = ok ? '#386a20' : '#ba1a1a'; statusEl.style.display = 'block'; } };
  try {
    const res = await fetch('/api/turso/status');
    const data = await res.json();
    if (data.connected) {
      show('✓ Turso verbunden: ' + data.url, true);
    } else {
      show('✗ Turso nicht verbunden' + (data.error ? ': ' + data.error : ''), false);
    }
  } catch(e) {
    show('Fehler: ' + e.message, false);
  }
}
function settingsChangePw() {
  const cur = (document.getElementById('s-pw-current')?.value||'').trim();
  const nw  = (document.getElementById('s-pw-new')?.value||'').trim();
  const cnf = (document.getElementById('s-pw-confirm')?.value||'').trim();
  const msg = document.getElementById('s-pw-msg');
  const show = (t, ok) => { if (msg) { msg.textContent = t; msg.style.color = ok ? '#386a20' : '#ba1a1a'; msg.style.display = 'block'; } };
  if (!nw || !cnf) { show('Alle Felder ausfüllen', false); return; }
  const _bph2 = bizGetPwHash();
  if (_bph2 && (!cur || bizHash(cur) !== _bph2)) { show('Aktuelles Passwort falsch', false); return; }
  if (nw.length < 4) { show('Neues Passwort mind. 4 Zeichen', false); return; }
  if (nw !== cnf) { show('Passwörter stimmen nicht überein', false); return; }
  _safeLocalSet(BIZ_PW_KEY, bizHash(nw));
  show('✅ Passwort geändert!', true);
  ['s-pw-current','s-pw-new','s-pw-confirm'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}
async function schichtzeitenNotionSync(szData) {
  try {
    const notionKey = localStorage.getItem('pizzeria_notion_key');
    if (!notionKey) return;
    const dayNames = {Mo:'Montag',Di:'Dienstag',Mi:'Mittwoch',Do:'Donnerstag',Fr:'Freitag',Sa:'Samstag',So:'Sonntag'};
    const lines = Object.entries(szData).map(([d, cfg]) =>
      `${dayNames[d]}: ${cfg.ruhetag ? '🔴 Ruhetag' : '🟢 ' + (cfg.von||'11:00') + ' – ' + (cfg.bis||'23:00') + ' Uhr'}`
    ).join('\n');
    await fetch('/api/notion/schichtzeiten', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ schichtzeiten: szData, text: lines })
    });
  } catch(_) {}
}

function clearApiKey() {
  _showConfirm('API Key wirklich löschen?', function() {
    localStorage.removeItem('pizzeria_api_key');
    ANTHROPIC_API_KEY = '';
    document.getElementById('settings-modal')?.remove();
    _showToast('API Key gelöscht', 'info');
  }, { okLabel: 'Löschen' });
}

function showCloudflareTunnelInfo() {
  var existing = document.getElementById('cf-tunnel-modal');
  if (existing) { existing.remove(); return; }
  document.getElementById('settings-modal')?.remove();
  var html = '<div id="cf-tunnel-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px" onclick="if(event.target===this)this.remove()">'
    +'<div style="background:#fff;border-radius:20px;padding:28px;max-width:500px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.2)">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">'
    +'<h2 style="font-size:18px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:8px"><span style="font-size:22px">🌐</span>Externer Zugriff — Cloudflare Tunnel</h2>'
    +'<button onclick="document.getElementById(\'cf-tunnel-modal\').remove()" style="background:#f3ebe9;border:none;border-radius:8px;padding:6px;cursor:pointer;font-size:16px">✕</button>'
    +'</div>'
    +'<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;margin-bottom:16px;font-size:13px;color:#1e40af">'
    +'<strong>Was ist das?</strong> Ein Cloudflare Tunnel macht deine lokale App über das Internet erreichbar — ohne Router-Konfiguration, mit HTTPS.'
    +'</div>'
    +'<div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:10px">Schnell-Test (kein Konto nötig):</div>'
    +'<div style="background:#1e1e2e;border-radius:10px;padding:12px 16px;font-family:monospace;font-size:13px;color:#a5f3fc;margin-bottom:16px;user-select:all">cloudflared tunnel --url http://localhost:8080</div>'
    +'<div style="font-size:12px;color:#5a403c;margin-bottom:16px">→ Gibt eine temporäre HTTPS-URL aus. Kein Login nötig. URL ist ~24h gültig.</div>'
    +'<div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:10px">Installation:</div>'
    +'<div style="background:#1e1e2e;border-radius:10px;padding:12px 16px;font-family:monospace;font-size:13px;color:#a5f3fc;margin-bottom:16px;user-select:all">winget install Cloudflare.cloudflared</div>'
    +'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px;margin-bottom:20px;font-size:12px;color:#991b1b">'
    +'⚠️ <strong>Sicherheit:</strong> Tunnel macht die App öffentlich. Business-Passwort vorher ändern falls fremde Personen Zugriff haben könnten.'
    +'</div>'
    +'<div style="display:flex;gap:10px">'
    +'<button onclick="document.getElementById(\'cf-tunnel-modal\').remove()" style="flex:1;padding:12px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:14px;font-weight:700;cursor:pointer">Verstanden</button>'
    +'</div>'
    +'</div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — DIENSTPLAN
// ═══════════════════════════════════════════════════════════════
// Österreichische Feiertage (fixes Datum + beweglich 2025–2028)
const AT_FEIERTAGE = {
  // 2025
  '2025-01-01':'Neujahr','2025-01-06':'Heilige Drei Könige',
  '2025-04-21':'Ostermontag','2025-05-01':'Staatsfeiertag',
  '2025-05-29':'Christi Himmelfahrt','2025-06-09':'Pfingstmontag',
  '2025-06-19':'Fronleichnam','2025-08-15':'Mariä Himmelfahrt',
  '2025-10-26':'Nationalfeiertag','2025-11-01':'Allerheiligen',
  '2025-12-08':'Mariä Empfängnis','2025-12-25':'Weihnachten','2025-12-26':'Stefanitag',
  // 2026
  '2026-01-01':'Neujahr','2026-01-06':'Heilige Drei Könige',
  '2026-04-06':'Ostermontag','2026-05-01':'Staatsfeiertag',
  '2026-05-14':'Christi Himmelfahrt','2026-05-25':'Pfingstmontag',
  '2026-06-04':'Fronleichnam','2026-08-15':'Mariä Himmelfahrt',
  '2026-10-26':'Nationalfeiertag','2026-11-01':'Allerheiligen',
  '2026-12-08':'Mariä Empfängnis','2026-12-25':'Weihnachten','2026-12-26':'Stefanitag',
  // 2027
  '2027-01-01':'Neujahr','2027-01-06':'Heilige Drei Könige',
  '2027-03-29':'Ostermontag','2027-05-01':'Staatsfeiertag',
  '2027-05-06':'Christi Himmelfahrt','2027-05-17':'Pfingstmontag',
  '2027-05-27':'Fronleichnam','2027-08-15':'Mariä Himmelfahrt',
  '2027-10-26':'Nationalfeiertag','2027-11-01':'Allerheiligen',
  '2027-12-08':'Mariä Empfängnis','2027-12-25':'Weihnachten','2027-12-26':'Stefanitag',
  // 2028
  '2028-01-01':'Neujahr','2028-01-06':'Heilige Drei Könige',
  '2028-04-17':'Ostermontag','2028-05-01':'Staatsfeiertag',
  '2028-05-25':'Christi Himmelfahrt','2028-06-05':'Pfingstmontag',
  '2028-06-15':'Fronleichnam','2028-08-15':'Mariä Himmelfahrt',
  '2028-10-26':'Nationalfeiertag','2028-11-01':'Allerheiligen',
  '2028-12-08':'Mariä Empfängnis','2028-12-25':'Weihnachten','2028-12-26':'Stefanitag',
};
function getSchichtForDay(dateObj) {
  let sz = null;
  try { sz = JSON.parse(localStorage.getItem('psc_schichtzeiten')||'null'); } catch(_) {}
  const dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  const dayKey = dayNames[dateObj.getDay()];
  const cfg = sz && sz[dayKey];
  if (!cfg) return { label: '11:00 – 23:00', ruhetag: false };
  if (cfg.ruhetag) return { label: 'Ruhetag', ruhetag: true };
  return { label: (cfg.von||'11:00') + ' – ' + (cfg.bis||'23:00'), ruhetag: false };
}
function renderDienstplanTab() {
  const p = document.getElementById('panel-dienstplan');
  const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];

  // Mitarbeiter aus localStorage laden
  let mitarbeiter = [];
  try { mitarbeiter = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter') || '[]'); } catch(e) {}

  // Nach Abteilung gruppieren
  const ABTEILUNG_ORDER = ['Küche','Lieferung','Service','Pizza','Reinigung'];
  const ABTEILUNG_ICONS = { 'Küche':'👨‍🍳', 'Lieferung':'🚗', 'Service':'🍽️', 'Pizza':'🍕', 'Reinigung':'🧹' };
  const ABTEILUNG_COLORS = { 'Küche':'#e65100', 'Lieferung':'#1565c0', 'Service':'#2e7d32', 'Pizza':'#8B0000', 'Reinigung':'#4a148c' };

  // Alle vorhandenen Abteilungen ermitteln
  const gruppen = {};
  for (const ma of mitarbeiter) {
    const rolle = ma.rolle || 'Sonstige';
    if (!gruppen[rolle]) gruppen[rolle] = [];
    gruppen[rolle].push(ma);
  }
  const rollenSorted = [...new Set([...ABTEILUNG_ORDER, ...Object.keys(gruppen)])].filter(r => gruppen[r]);

  let plan = {};
  try { plan = JSON.parse(localStorage.getItem('pizzeria_dienstplan') || '{}'); } catch(e) {}

  const offset = parseInt(p.dataset.weekOffset || '0');
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0,0,0,0);

  // Schichtzeit für heute berechnen (monday ist jetzt definiert)
  const SCHICHT = (() => {
    const todaySchicht = getSchichtForDay(monday);
    return todaySchicht.ruhetag ? 'Ruhetag' : todaySchicht.label + ' Uhr';
  })();

  // Timezone-sicheres ISO-Datum (kein UTC-Versatz)
  const toLocalISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const weekKey = toLocalISO(monday);
  if (!plan[weekKey]) plan[weekKey] = {};

  const weekDates = DAYS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate()+i); return d; });
  const fmt = d => d.toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'});
  const kw = (() => {
    const d = new Date(Date.UTC(monday.getFullYear(),monday.getMonth(),monday.getDate()));
    const dn = d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-dn);
    return Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7);
  })();

  const dayHeaders = `<th style="padding:8px;font-size:13px;font-weight:700;color:#8B0000;border:1px solid #e3beb8;text-align:left;background:#fff8f6;min-width:120px">Mitarbeiter</th>`
    + DAYS.map((day,i) => {
      const dateObj   = weekDates[i];
      const isToday   = dateObj.toDateString() === new Date().toDateString();
      const isoDate   = toLocalISO(dateObj);
      const feiertag  = AT_FEIERTAGE[isoDate] || null;
      const schicht   = getSchichtForDay(dateObj);
      const bgColor   = feiertag ? '#fff8e1' : schicht.ruhetag ? '#f5f5f5' : isToday ? '#fff0ee' : '#fff8f6';
      const textColor = feiertag ? '#b45309' : schicht.ruhetag ? '#9e9e9e' : isToday ? '#8B0000' : '#261816';
      return `<th style="padding:8px 4px;font-size:12px;font-weight:700;border:1px solid #e3beb8;text-align:center;background:${bgColor};min-width:90px">
        <div style="color:${textColor}">${day}</div>
        <div style="font-weight:400;color:#9e6b62;font-size:11px">${fmt(dateObj)}</div>
        ${feiertag ? `<div style="font-size:9px;color:#b45309;font-weight:700;margin-top:2px">🎉 ${feiertag}</div>` : ''}
        ${schicht.ruhetag ? `<div style="font-size:9px;color:#9e9e9e;font-weight:600;margin-top:2px">Ruhetag</div>` : `<div style="font-size:9px;color:#9e6b62;margin-top:2px">🕐 ${schicht.label}</div>`}
      </th>`;
    }).join('');

  // Abteilungs-Sektionen bauen
  let sektionen = '';
  if (!mitarbeiter.length) {
    sektionen = `<div style="text-align:center;padding:40px;color:#9e6b62;font-size:15px">⚠️ Keine Mitarbeiter eingetragen.<br>Bitte zuerst Mitarbeiter im Team-Tab hinzufügen.</div>`;
  } else {
    for (const rolle of rollenSorted) {
      const group = gruppen[rolle];
      if (!group || !group.length) continue;
      const icon = ABTEILUNG_ICONS[rolle] || '👤';
      const color = ABTEILUNG_COLORS[rolle] || '#8B0000';

      const maRows = group.map(ma => {
        const cells = DAYS.map((day, di) => {
          const key = ma.id || ma.name;
          const isoDate = toLocalISO(weekDates[di]);
          const feiertag = AT_FEIERTAGE[isoDate] || null;
          // Konfigurierbare Schließtage → automatisch geschlossen (nicht klickbar)
          const mmdd = isoDate.slice(5); // z.B. "12-24"
          const schliessTage = (() => { try { return JSON.parse(localStorage.getItem('psc_schliesstage') || '["24.12","31.12"]'); } catch(e) { return ['24.12','31.12']; } })();
          // psc_schliesstage Format: "24.12" → umrechnen in "12-24"
          const schliessMatcher = schliessTage.map(t => { const p=t.split('.'); return p[1]+'-'+p[0]; });
          if (schliessMatcher.includes(mmdd)) {
            return `<td style="padding:5px;border:1px solid #e3beb8;text-align:center;background:#f5f5f5">
              <div style="width:100%;padding:7px 4px;border-radius:8px;font-size:11px;font-weight:700;color:#757575;background:#eeeeee;text-align:center">
                🔒 Geschlossen
              </div>
            </td>`;
          }
          const val = (plan[weekKey][key]||{})[day] || '';
          const arbeitet = val === 'arbeitet';
          const frei = val === 'frei';
          // Feiertag → leichter gelber Hintergrund, aber trotzdem klickbar
          const tdBg = feiertag ? 'background:#fffbeb' : '';
          return `<td style="padding:5px;border:1px solid #e3beb8;text-align:center;${tdBg}">
            <button onclick="dienstplanToggle('${weekKey}','${key}','${day}')"
              style="width:100%;padding:7px 4px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;
              background:${arbeitet?'#e8f5e9':frei?'#fce4ec':feiertag?'#fef3c7':'#f5f5f5'};
              color:${arbeitet?'#2e7d32':frei?'#c62828':feiertag?'#92400e':'#9e9e9e'}">
              ${arbeitet?'✅ Arbeitet':frei?'❌ Frei':feiertag?'🎉 — —':'— —'}
            </button>
          </td>`;
        }).join('');
        return `<tr>
          <td style="padding:8px 12px;font-weight:600;font-size:13px;border:1px solid #e3beb8;background:#fafafa;white-space:nowrap">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${ma.farbe||color};margin-right:6px"></span>
            ${_esc(ma.name)}
          </td>${cells}
        </tr>`;
      }).join('');

      sektionen += `
        <div style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:10px 14px;background:${color};border-radius:12px">
            <span style="font-size:20px">${icon}</span>
            <span style="font-size:16px;font-weight:800;color:#fff">${rolle}</span>
            <span style="font-size:12px;color:rgba(255,255,255,0.85);margin-left:auto">🕐 ${SCHICHT}</span>
          </div>
          <div style="overflow-x:auto;border-radius:10px;border:1px solid #e3beb8">
            <table style="border-collapse:collapse;width:100%;min-width:600px">
              <thead><tr>${dayHeaders}</tr></thead>
              <tbody>${maRows}</tbody>
            </table>
          </div>
        </div>`;
    }
  }

  p.innerHTML = `
    ${_pageHdr('calendar_month', 'Dienstplan', 'KW ' + kw + ' — ' + fmt(weekDates[0]) + ' bis ' + fmt(weekDates[6]))}
    <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #e3beb8;box-shadow:0 2px 8px rgba(0,0,0,.06)">

      <!-- Navigation -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap">
        <button onclick="dienstplanWoche(-1)" style="padding:9px 16px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:13px;font-weight:600;color:#5a403c;cursor:pointer">← Vorwoche</button>
        <span style="font-weight:700;font-size:15px;color:#261816;flex:1;text-align:center">KW ${kw} — ${fmt(weekDates[0])} bis ${fmt(weekDates[6])}</span>
        <button onclick="dienstplanWoche(1)" style="padding:9px 16px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:13px;font-weight:600;color:#5a403c;cursor:pointer">Nächste Woche →</button>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
        <button onclick="dienstplanHeute()" style="padding:9px 16px;border-radius:10px;border:none;background:#8B0000;font-size:13px;font-weight:600;color:#fff;cursor:pointer">📅 Heute</button>
        <div style="position:relative;display:inline-block">
          <button onclick="dienstplanPdfMenuToggle()" id="dp-pdf-btn" style="padding:9px 16px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-weight:600;color:#610000;cursor:pointer">📄 PDF ▾</button>
          <div id="dp-pdf-menu" style="display:none;position:absolute;top:calc(100% + 6px);left:0;background:#fff;border:1.5px solid #e3beb8;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:999;min-width:200px;padding:8px 0">
            <div style="padding:6px 14px 4px;font-size:10px;font-weight:700;color:#9e6b62;text-transform:uppercase;letter-spacing:.5px">PDF erstellen</div>
            <button onclick="dienstplanPdfExport();dienstplanPdfMenuClose()" style="display:block;width:100%;text-align:left;padding:9px 16px;border:none;background:none;font-size:13px;font-weight:700;color:#261816;cursor:pointer;font-family:inherit">📋 Alle Abteilungen</button>
            <div style="height:1px;background:#f0e8e6;margin:4px 0"></div>
            <div id="dp-pdf-rollen-list"></div>
          </div>
        </div>
        <button onclick="window.print()" style="padding:9px 16px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-weight:600;color:#610000;cursor:pointer">🖨️ Drucken</button>
        <button onclick="dienstplanIcsExport()" style="padding:9px 16px;border-radius:10px;border:1.5px solid #4285f4;background:#fff;font-size:13px;font-weight:600;color:#4285f4;cursor:pointer" title="Als .ics exportieren — importierbar in Google Calendar, Apple Calendar, Outlook">📅 Kalender .ics</button>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <input type="month" id="abr-monat" value="${new Date().toISOString().slice(0,7)}" style="padding:7px 10px;border-radius:8px;border:1.5px solid #e3beb8;font-size:12px;font-family:inherit">
          <button onclick="personalAbrechnungPdf()" style="padding:9px 14px;border-radius:8px;border:none;background:#610000;color:#fff;font-size:12px;font-weight:700;cursor:pointer">💰 Abrechnung PDF</button>
        </div>
      </div>

      <!-- Info-Box -->
      <div style="background:#fff8f6;border-radius:10px;border:1.5px solid #e3beb8;padding:10px 14px;margin-bottom:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-size:18px">🕐</span>
        <span style="font-size:14px;font-weight:700;color:#261816">Tagesschicht: <strong style="color:#8B0000">${SCHICHT} Uhr</strong></span>
        <span style="font-size:12px;color:#9e6b62">— Klicke auf einen Tag um Anwesenheit zu setzen</span>
      </div>

      <!-- Abteilungs-Sektionen -->
      ${sektionen}
    </div>`;
}
function dienstplanSet(weekKey, ma, day, schicht) {
  let plan = {};
  try { plan = JSON.parse(localStorage.getItem('pizzeria_dienstplan')||'{}'); } catch(e) {}
  if (!plan[weekKey]) plan[weekKey] = {};
  if (!plan[weekKey][ma]) plan[weekKey][ma] = {};
  if (schicht) plan[weekKey][ma][day] = schicht; else delete plan[weekKey][ma][day];
  localStorage.setItem('pizzeria_dienstplan', JSON.stringify(plan));
  _showToast('Dienstplan gespeichert', 'success');
}
function dienstplanToggle(weekKey, maId, day) {
  let plan = {};
  try { plan = JSON.parse(localStorage.getItem('pizzeria_dienstplan')||'{}'); } catch(e) {}
  if (!plan[weekKey]) plan[weekKey] = {};
  if (!plan[weekKey][maId]) plan[weekKey][maId] = {};
  const curr = plan[weekKey][maId][day] || '';
  const next = curr === '' ? 'arbeitet' : curr === 'arbeitet' ? 'frei' : '';
  if (next) plan[weekKey][maId][day] = next;
  else delete plan[weekKey][maId][day];
  localStorage.setItem('pizzeria_dienstplan', JSON.stringify(plan));
  renderDienstplanTab();
}
function dienstplanWoche(dir) {
  const p = document.getElementById('panel-dienstplan');
  p.dataset.weekOffset = String(parseInt(p.dataset.weekOffset||'0') + dir);
  renderDienstplanTab();
}

function dienstplanIcsExport() {
  const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const p = document.getElementById('panel-dienstplan');
  const offset = parseInt(p.dataset.weekOffset || '0');
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0,0,0,0);
  const toLocalISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const weekKey = toLocalISO(monday);
  const weekDates = DAYS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate()+i); return d; });

  let mitarbeiter = [];
  try { mitarbeiter = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter') || '[]'); } catch(e) {}
  let plan = {};
  try { plan = JSON.parse(localStorage.getItem('pizzeria_dienstplan') || '{}'); } catch(e) {}

  const icsDateStr = d => {
    const y = d.getFullYear();
    const mo = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}${mo}${day}`;
  };

  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pizzeria San Carino//Dienstplan//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  let count = 0;
  for (const ma of mitarbeiter) {
    const key = ma.id || ma.name;
    for (let i = 0; i < DAYS.length; i++) {
      const day = DAYS[i];
      const val = (plan[weekKey]?.[key] || {})[day] || '';
      if (val !== 'arbeitet') continue;
      const schicht = getSchichtForDay(weekDates[i]);
      const [vonH, vonM] = (schicht.von || '11:00').split(':').map(Number);
      const [bisH, bisM] = (schicht.bis || '23:00').split(':').map(Number);
      const dateStr = icsDateStr(weekDates[i]);
      const uid = `dp-${weekKey}-${key}-${day}@sancarino`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${icsDateStr(new Date())}T000000Z`,
        `DTSTART;TZID=Europe/Vienna:${dateStr}T${String(vonH).padStart(2,'0')}${String(vonM).padStart(2,'0')}00`,
        `DTEND;TZID=Europe/Vienna:${dateStr}T${String(bisH).padStart(2,'0')}${String(bisM).padStart(2,'0')}00`,
        `SUMMARY:${ma.name} — Schicht`,
        `DESCRIPTION:Pizzeria San Carino\\nMitarbeiter: ${ma.name}\\nAbteilung: ${ma.rolle||''}`,
        'END:VEVENT'
      );
      count++;
    }
  }
  lines.push('END:VCALENDAR');

  if (count === 0) { _showToast('Keine Schichten für diese Woche eingetragen', 'info'); return; }

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dienstplan-kw${weekKey}.ics`;
  a.click();
  _showToast(`✅ ${count} Schichten exportiert — .ics öffnen zum Importieren`, 'success');
}
function dienstplanHeute() {
  const p = document.getElementById('panel-dienstplan');
  p.dataset.weekOffset = '0';
  renderDienstplanTab();
}
function dienstplanPdfExport() {
  if (!window.jspdf?.jsPDF) { _showToast('jsPDF nicht geladen', 'error'); return; }
  const p = document.getElementById('panel-dienstplan');
  const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  let plan = {}; try { plan = JSON.parse(localStorage.getItem('pizzeria_dienstplan')||'{}'); } catch(_) {}
  let mitarbeiter = []; try { mitarbeiter = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter')||'[]'); } catch(_) {}
  const offset = parseInt(p.dataset.weekOffset||'0');
  const now = new Date(); const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay()+6)%7) + offset*7); monday.setHours(0,0,0,0);
  const weekKey = monday.toISOString().slice(0,10);
  const weekDates = DAYS.map((_,i) => { const d=new Date(monday); d.setDate(monday.getDate()+i); return d.toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'}); });
  const kw = (() => { const d=new Date(Date.UTC(monday.getFullYear(),monday.getMonth(),monday.getDate())); const dn=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-dn); return Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7); })();
  const doc = new window.jspdf.jsPDF({orientation:'landscape'});
  // Titel
  doc.setFontSize(16); doc.setFont(undefined,'bold');
  doc.text('Dienstplan KW ' + kw + ' — ' + weekDates[0] + ' bis ' + weekDates[6] + '.', 14, 16);
  doc.setFontSize(9); doc.setFont(undefined,'normal');
  doc.text('Pizzeria San Carino — Export: ' + new Date().toLocaleDateString('de-AT'), 14, 22);
  // Tabellen-Kopf: Mitarbeiter | Mo 20.04 | Di 21.04 | ...
  const head = [['Mitarbeiter','Abteilung',...DAYS.map((d,i)=>d+' '+weekDates[i])]];
  // Zeilen: nach Abteilung gruppiert
  const rollenOrder = ['Küche','Pizza','Service','Lieferung','Fahrer','Reinigung'];
  const gruppen = {};
  mitarbeiter.forEach(ma => {
    const r = ma.rolle || 'Sonstige';
    if (!gruppen[r]) gruppen[r] = [];
    gruppen[r].push(ma);
  });
  const body = [];
  const rollenInDaten = [...new Set(mitarbeiter.map(m=>m.rolle||'Sonstige'))].sort((a,b)=>{
    const ia = rollenOrder.indexOf(a); const ib = rollenOrder.indexOf(b);
    return (ia===-1?99:ia) - (ib===-1?99:ib);
  });
  rollenInDaten.forEach(rolle => {
    (gruppen[rolle]||[]).forEach(ma => {
      const key = ma.id || ma.name;
      const dayPlan = (plan[weekKey]||{})[key] || {};
      const row = [ma.name, rolle, ...DAYS.map(day => {
        const v = dayPlan[day] || '';
        return v === 'arbeitet' ? '✓' : v === 'frei' ? '✗' : '—';
      })];
      body.push(row);
    });
  });
  if (!body.length) { body.push(['Keine Mitarbeiter eingetragen','','','','','','','','']); }
  if (doc.autoTable) {
    doc.autoTable({
      head, body, startY: 28,
      styles: { fontSize: 9, cellPadding: 4, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 }, 1: { halign: 'left', cellWidth: 28 } },
      headStyles: { fillColor: [97, 0, 0], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 248, 246] },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index >= 2) {
          const v = data.cell.raw;
          if (v === '✓') { data.cell.styles.textColor = [30, 120, 30]; data.cell.styles.fontStyle = 'bold'; }
          else if (v === '✗') { data.cell.styles.textColor = [180, 30, 30]; }
          else { data.cell.styles.textColor = [180, 180, 180]; }
        }
      }
    });
  }
  doc.save('dienstplan-kw'+kw+'-'+weekKey+'.pdf');
  _showToast('PDF gespeichert', 'success');
}

function dienstplanPdfMenuToggle() {
  const menu = document.getElementById('dp-pdf-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  if (isOpen) { menu.style.display = 'none'; return; }
  // Rollen-Buttons dynamisch befüllen
  let mitarbeiter = []; try { mitarbeiter = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter')||'[]'); } catch(_) {}
  const rollenOrder = ['Küche','Pizza','Service','Lieferung','Fahrer','Reinigung'];
  const rollen = [...new Set(mitarbeiter.map(m=>m.rolle||'Sonstige'))].sort((a,b)=>{
    const ia=rollenOrder.indexOf(a),ib=rollenOrder.indexOf(b);
    return (ia===-1?99:ia)-(ib===-1?99:ib);
  });
  const icons = {'Küche':'🍕','Pizza':'🍕','Service':'🍽️','Lieferung':'🚗','Fahrer':'🚗','Reinigung':'🧹'};
  const list = document.getElementById('dp-pdf-rollen-list');
  if (list) list.innerHTML = rollen.map(r =>
    `<button onclick="dienstplanPdfExportRolle('${r}');dienstplanPdfMenuClose()" style="display:block;width:100%;text-align:left;padding:9px 16px;border:none;background:none;font-size:13px;color:#261816;cursor:pointer;font-family:inherit">${icons[r]||'👤'} ${r}</button>`
  ).join('');
  menu.style.display = 'block';
  setTimeout(() => document.addEventListener('click', dienstplanPdfMenuOutside, {once:true}), 10);
}
function dienstplanPdfMenuOutside(e) {
  const menu = document.getElementById('dp-pdf-menu');
  const btn = document.getElementById('dp-pdf-btn');
  if (menu && !menu.contains(e.target) && e.target !== btn) menu.style.display = 'none';
}
function dienstplanPdfMenuClose() {
  const menu = document.getElementById('dp-pdf-menu');
  if (menu) menu.style.display = 'none';
}
function dienstplanPdfExportRolle(rolle) {
  if (!window.jspdf?.jsPDF) { _showToast('jsPDF nicht geladen', 'error'); return; }
  const p = document.getElementById('panel-dienstplan');
  const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  let plan = {}; try { plan = JSON.parse(localStorage.getItem('pizzeria_dienstplan')||'{}'); } catch(_) {}
  let mitarbeiter = []; try { mitarbeiter = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter')||'[]'); } catch(_) {}
  const offset = parseInt(p.dataset.weekOffset||'0');
  const now = new Date(); const monday = new Date(now);
  monday.setDate(now.getDate()-((now.getDay()+6)%7)+offset*7); monday.setHours(0,0,0,0);
  const weekKey = monday.toISOString().slice(0,10);
  const weekDates = DAYS.map((_,i)=>{ const d=new Date(monday); d.setDate(monday.getDate()+i); return d.toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'}); });
  const kw = (()=>{ const d=new Date(Date.UTC(monday.getFullYear(),monday.getMonth(),monday.getDate())); const dn=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-dn); return Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7); })();
  const gruppe = mitarbeiter.filter(m=>(m.rolle||'Sonstige')===rolle);
  if (!gruppe.length) { _showToast('Keine Mitarbeiter in: '+rolle, 'error'); return; }
  const doc = new window.jspdf.jsPDF({orientation:'landscape'});
  const icons = {'Küche':'Küche','Pizza':'Pizza','Service':'Service','Lieferung':'Lieferung','Fahrer':'Fahrer','Reinigung':'Reinigung'};
  doc.setFontSize(16); doc.setFont(undefined,'bold');
  doc.text('Dienstplan — ' + rolle + ' — KW ' + kw, 14, 16);
  doc.setFontSize(9); doc.setFont(undefined,'normal');
  doc.text(weekDates[0] + ' bis ' + weekDates[6] + ' | Pizzeria San Carino | Export: ' + new Date().toLocaleDateString('de-AT'), 14, 22);
  const head = [['Mitarbeiter', ...DAYS.map((d,i)=>d+' '+weekDates[i])]];
  const body = gruppe.map(ma => {
    const key = ma.id||ma.name;
    const dayPlan = (plan[weekKey]||{})[key]||{};
    return [ma.name, ...DAYS.map(day=>{ const v=dayPlan[day]||''; return v==='arbeitet'?'✓':v==='frei'?'✗':'—'; })];
  });
  if (doc.autoTable) {
    doc.autoTable({
      head, body, startY: 28,
      styles: { fontSize: 10, cellPadding: 5, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 45 } },
      headStyles: { fillColor: [97, 0, 0], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 248, 246] },
      didParseCell: function(data) {
        if (data.section==='body' && data.column.index>=1) {
          const v=data.cell.raw;
          if (v==='✓') { data.cell.styles.textColor=[30,120,30]; data.cell.styles.fontStyle='bold'; }
          else if (v==='✗') { data.cell.styles.textColor=[180,30,30]; }
          else { data.cell.styles.textColor=[180,180,180]; }
        }
      }
    });
  }
  doc.save('dienstplan-'+rolle.toLowerCase()+'-kw'+kw+'-'+weekKey+'.pdf');
  _showToast('PDF für '+rolle+' gespeichert', 'success');
}

function personalAbrechnungPdf() {
  if (!window.jspdf?.jsPDF) { _showToast('jsPDF nicht geladen', 'error'); return; }
  var monat = document.getElementById('abr-monat')?.value || new Date().toISOString().slice(0,7);
  var monatParts = monat.split('-');
  var monatLabel = ['','Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][parseInt(monatParts[1])] + ' ' + monatParts[0];

  var plan = {}; try { plan = JSON.parse(localStorage.getItem('pizzeria_dienstplan')||'{}'); } catch(_) {}
  var mitarbeiter = []; try { mitarbeiter = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter')||'[]'); } catch(_) {}

  // Stundenmapping
  var STUNDEN = {'Früh (08-16)':8,'Spät (14-22)':8,'Nacht (20-04)':8,'Frei':0,'':0};
  var DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  var fmt = function(n){return parseFloat(n||0).toFixed(2).replace('.',',') + ' €';};

  // Alle KWs des Monats sammeln
  var kwKeys = Object.keys(plan).filter(function(wk){
    var d = new Date(wk); return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1) === monat || (() => {
      for(var i=0;i<7;i++){var dd=new Date(d);dd.setDate(d.getDate()+i);var m2=dd.getFullYear()+'-'+(dd.getMonth()+1<10?'0':'')+(dd.getMonth()+1);if(m2===monat)return true;}return false;
    })();
  });

  if (!mitarbeiter.length) { _showToast('Keine Mitarbeiter eingetragen', 'warning'); return; }

  var doc = new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});

  // Deckblatt
  doc.setFillColor(139,0,0); doc.rect(0,0,210,297,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(24); doc.setFont(undefined,'bold');
  doc.text('Pizzeria San Carino', 105, 110, {align:'center'});
  doc.setFontSize(18); doc.text('Personal-Abrechnung', 105, 127, {align:'center'});
  doc.setFontSize(16); doc.text(monatLabel, 105, 143, {align:'center'});
  doc.setFontSize(10); doc.setFont(undefined,'normal');
  doc.text('Erstellt: ' + new Date().toLocaleDateString('de-AT'), 105, 158, {align:'center'});

  var gesamtUebersicht = [];

  mitarbeiter.forEach(function(ma) {
    doc.addPage();
    doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(139,0,0);
    doc.text(ma.name + (ma.rolle?' — '+ma.rolle:''), 14, 18);
    doc.setDrawColor(225,190,184); doc.line(14,22,196,22);

    var stundenGesamt = 0;
    var tableRows = [];

    kwKeys.forEach(function(wk) {
      var weekPlan = (plan[wk]||{});
      // Finde MA-Key (entweder ma.id oder ma.name lowercase oder Rolle)
      var maKeys = Object.keys(weekPlan);
      var maKey = maKeys.find(function(k){ return k === ma.id || k === (ma.name||'').toLowerCase().replace(/\s/g,'') || k === (ma.rolle||'').toLowerCase(); }) || null;
      var dayData = maKey ? (weekPlan[maKey]||{}) : {};
      var row = [wk];
      var rowStunden = 0;
      DAYS.forEach(function(d){
        var s = dayData[d]||'';
        var h = STUNDEN[s]||0;
        rowStunden += h;
        row.push(s ? s.split(' ')[0] : '—');
      });
      row.push(rowStunden + ' h');
      stundenGesamt += rowStunden;
      tableRows.push(row);
    });

    if (!tableRows.length) tableRows.push([monat,'—','—','—','—','—','—','—','0 h']);

    var stundenlohn = parseFloat(ma.lohn||ma.stundenlohn||12);
    var lohnGesamt = stundenGesamt * stundenlohn;

    if (doc.autoTable) {
      doc.autoTable({
        head:[['KW','Mo','Di','Mi','Do','Fr','Sa','So','Stunden']],
        body: tableRows,
        startY:26, styles:{fontSize:8,cellPadding:3},
        headStyles:{fillColor:[139,0,0],textColor:255,fontStyle:'bold'},
        alternateRowStyles:{fillColor:[255,248,246]}
      });
    }
    var y = (doc.lastAutoTable?.finalY||80) + 10;
    doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.setTextColor(38,24,22);
    doc.text('Gesamt: ' + stundenGesamt + ' Stunden × ' + stundenlohn.toFixed(2).replace('.',',') + ' €/h = ' + fmt(lohnGesamt), 14, y);
    y += 16;
    doc.setDrawColor(150,150,150); doc.line(14,y,90,y); doc.line(110,y,196,y);
    doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(90,64,60);
    doc.text('Datum / Unterschrift Mitarbeiter', 14, y+6);
    doc.text('Datum / Unterschrift Betrieb', 110, y+6);

    gesamtUebersicht.push([ma.name, stundenGesamt+' h', stundenlohn.toFixed(2).replace('.',',')+' €', fmt(lohnGesamt)]);
  });

  // Letzte Seite: Gesamtübersicht
  doc.addPage();
  doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(139,0,0);
  doc.text('Gesamtübersicht — ' + monatLabel, 14, 18);
  doc.setDrawColor(225,190,184); doc.line(14,22,196,22);
  var gesamtLohn = gesamtUebersicht.reduce(function(s,r){ return s+parseFloat(r[3].replace(',','.').replace(' €',''));},0);
  if (doc.autoTable) {
    doc.autoTable({
      head:[['Mitarbeiter','Stunden','€/h','Lohn gesamt']],
      body: gesamtUebersicht,
      foot:[['GESAMT','','',fmt(gesamtLohn)]],
      startY:26, styles:{fontSize:9,cellPadding:4},
      headStyles:{fillColor:[139,0,0],textColor:255,fontStyle:'bold'},
      footStyles:{fillColor:[240,228,226],fontStyle:'bold'}
    });
  }
  doc.save('personal_abrechnung_' + monat + '.pdf');
  _showToast('Personal-Abrechnung ' + monatLabel + ' gespeichert ✓', 'success');
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — AUFGABEN
// ═══════════════════════════════════════════════════════════════
const AUF_KEY = 'pizzeria_aufgaben';

const AUF_STATUS = {
  offen:     { label:'Offen',     icon:'🔵', bg:'#e3f2fd', color:'#0d47a1', border:'#90caf9' },
  in_arbeit: { label:'In Arbeit', icon:'🟡', bg:'#fff3e0', color:'#e65100', border:'#ffcc80' },
  erledigt:  { label:'Erledigt',  icon:'✅', bg:'#e8f5e9', color:'#2e7d32', border:'#a5d6a7' },
};

const AUF_PRIO = {
  hoch:    { label:'Hoch',    color:'#c62828', bg:'#ffebee', border:'#ef9a9a' },
  mittel:  { label:'Mittel',  color:'#e65100', bg:'#fff3e0', border:'#ffcc80' },
  niedrig: { label:'Niedrig', color:'#2e7d32', bg:'#e8f5e9', border:'#a5d6a7' },
};

const AUF_KATEGORIEN = ['Küche','Service','Reinigung','Einkauf','Verwaltung','Sonstiges'];

const AUF_MA_LABELS = {
  alle:       'Alle Mitarbeiter',
  admin:      'Admin',
  manager:    'Manager',
  kueche:     'Küche',
  pizza:      'Pizza',
  fahrer:     'Fahrer',
  reinigung:  'Reinigung',
  service:    'Service',
};

let aufgabenSelectedPrio = 'mittel';
const aufgabenFilterState = { status:'offen', prioritaet:'', kategorie:'', mitarbeiter:'' };

function aufgabenMigriere() {
  let aufgaben = [];
  try { aufgaben = JSON.parse(localStorage.getItem(AUF_KEY)||'[]'); } catch(e) {}
  let changed = false;
  aufgaben.forEach(a => {
    if (typeof a.status === 'undefined')        { a.status = a.erledigt ? 'erledigt' : 'offen'; changed = true; }
    if (typeof a.kategorie === 'undefined')     { a.kategorie = 'Sonstiges'; changed = true; }
    if (typeof a.notiz === 'undefined')         { a.notiz = ''; changed = true; }
    if (typeof a.zugewiesen_von === 'undefined'){ a.zugewiesen_von = ''; changed = true; }
  });
  if (changed) try { _syncedLocalSet(AUF_KEY, JSON.stringify(aufgaben)); } catch(e) {}
  return aufgaben;
}

function _aufDashRefresh() {
  const dp = document.getElementById('panel-dashboard');
  if (dp && dp.style.display !== 'none') renderDashboardTab();
  aufgUpdateBadge();
}

function renderAufgabenTab() {
  const panel = document.getElementById('panel-aufgaben');
  if (!panel) return;

  const aufgaben = aufgabenMigriere();
  const isAdminOrManager = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
  const today = new Date().toISOString().slice(0,10);

  // Rollen-Filterung
  let sichtbar = aufgaben;
  if (!isAdminOrManager && currentUser) {
    const me = currentUser.username || currentUser.name || '';
    sichtbar = aufgaben.filter(a => a.mitarbeiter === 'alle' || a.mitarbeiter === me || a.zugewiesen_von === me);
  }

  // Filter anwenden
  const fs = aufgabenFilterState;
  let filtered = sichtbar.filter(a => {
    if (fs.status     && a.status     !== fs.status)     return false;
    if (fs.prioritaet && a.prioritaet !== fs.prioritaet) return false;
    if (fs.kategorie  && a.kategorie  !== fs.kategorie)  return false;
    if (fs.mitarbeiter && a.mitarbeiter !== fs.mitarbeiter) return false;
    return true;
  });

  // Sortierung: erledigt ans Ende, dann nach Priorität
  const prioOrd = {hoch:0, mittel:1, niedrig:2};
  filtered.sort((a,b) => {
    const ae = a.status === 'erledigt' ? 1 : 0;
    const be = b.status === 'erledigt' ? 1 : 0;
    if (ae !== be) return ae - be;
    return (prioOrd[a.prioritaet]||1) - (prioOrd[b.prioritaet]||1);
  });

  const offenCount = sichtbar.filter(a => a.status !== 'erledigt').length;

  // Status-Pill-Buttons
  const statusPills = [
    {val:'',         label:'Alle'},
    {val:'offen',    label:'🔵 Offen'},
    {val:'in_arbeit',label:'🟡 In Arbeit'},
    {val:'erledigt', label:'✅ Erledigt'},
  ].map(s => `<button onclick="aufgabenSetFilter('status','${s.val}')" style="padding:6px 14px;border-radius:20px;border:1.5px solid ${fs.status===s.val?'#8B0000':'#e3beb8'};background:${fs.status===s.val?'#8B0000':'#fff8f6'};color:${fs.status===s.val?'#fff':'#261816'};font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${s.label}</button>`).join('');

  // Karten HTML
  const kartenHtml = filtered.length === 0
    ? `<div style="text-align:center;padding:48px 20px;color:#6b6b6b">
        <div style="font-size:40px;margin-bottom:12px">🎉</div>
        <div style="font-size:16px;font-weight:700;color:#261816;margin-bottom:6px">Keine Aufgaben gefunden</div>
        <div style="font-size:13px">${fs.status==='offen'?'Alles erledigt! Super gemacht.':'Kein Eintrag passt zu diesem Filter.'}</div>
       </div>`
    : filtered.map(a => {
        const st    = AUF_STATUS[a.status] || AUF_STATUS.offen;
        const pr    = AUF_PRIO[a.prioritaet] || AUF_PRIO.mittel;
        const ueberfaellig = a.faellig && a.faellig < today && a.status !== 'erledigt';
        const maLabel = AUF_MA_LABELS[a.mitarbeiter] || a.mitarbeiter || '—';

        const statusBtns = a.status === 'offen'
          ? `<button onclick="aufgabeStatusChange(${a.id},'in_arbeit')" style="padding:5px 12px;border-radius:8px;border:1.5px solid #ffcc80;background:#fff3e0;color:#e65100;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🟡 In Arbeit</button>`
          : a.status === 'in_arbeit'
          ? `<button onclick="aufgabeStatusChange(${a.id},'erledigt')" style="padding:5px 12px;border-radius:8px;border:1.5px solid #a5d6a7;background:#e8f5e9;color:#2e7d32;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">✅ Erledigt</button>`
          : `<button onclick="aufgabeStatusChange(${a.id},'offen')" style="padding:5px 12px;border-radius:8px;border:1.5px solid #90caf9;background:#e3f2fd;color:#0d47a1;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🔄 Wieder öffnen</button>`;

        return `<div style="display:flex;border-left:4px solid ${ueberfaellig?'#c62828':pr.color};background:#fff;border-radius:0 12px 12px 0;margin-bottom:10px;box-shadow:0 1px 6px rgba(0,0,0,.06);${ueberfaellig?'outline:2px solid #ef9a9a;outline-offset:-1px':''}">
          <div style="flex:1;padding:14px 14px 10px 16px;min-width:0">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;align-items:center">
              <span style="font-size:11px;font-weight:700;color:${pr.color};background:${pr.bg};border:1px solid ${pr.border};padding:2px 8px;border-radius:10px">${pr.label}</span>
              <span style="font-size:11px;font-weight:700;color:${st.color};background:${st.bg};border:1px solid ${st.border};padding:2px 8px;border-radius:10px">${st.icon} ${st.label}</span>
              ${ueberfaellig?'<span style="font-size:11px;font-weight:700;color:#c62828;background:#ffebee;border:1px solid #ef9a9a;padding:2px 8px;border-radius:10px">⚠️ Überfällig</span>':''}
            </div>
            <div style="font-size:16px;font-weight:800;color:#261816;margin-bottom:6px;${a.status==='erledigt'?'text-decoration:line-through;color:#6b6b6b':''}">${_esc(a.titel)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:#5a403c;margin-bottom:${a.notiz?'6px':'0'}">
              <span>👤 ${maLabel}</span>
              ${a.faellig?`<span style="color:${ueberfaellig?'#c62828':'#5a403c'}">📅 ${a.faellig}</span>`:''}
              <span style="background:#f3ebe9;padding:1px 7px;border-radius:6px;font-weight:600">${_esc(a.kategorie||'Sonstiges')}</span>
            </div>
            ${a.notiz?`<div style="font-size:12px;color:#8d6562;font-style:italic;margin-top:4px">${_esc(a.notiz)}</div>`:''}
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
              ${statusBtns}
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;padding:10px 10px 10px 0">
            <button onclick="aufgabeDelete(${a.id})" title="Löschen" style="width:36px;height:36px;border-radius:8px;border:1.5px solid #e3beb8;background:#fff8f6;color:#c62828;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">🗑️</button>
          </div>
        </div>`;
      }).join('');

  // Prio-Button-Gruppe für Formular
  const prioBtns = ['hoch','mittel','niedrig'].map(p => {
    const pr = AUF_PRIO[p];
    const active = aufgabenSelectedPrio === p;
    return `<button type="button" onclick="aufgabenSetPrio('${p}')" style="flex:1;padding:8px 4px;border-radius:8px;border:1.5px solid ${active?pr.color:pr.border};background:${active?pr.bg:'#fff'};color:${active?pr.color:'#5a403c'};font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s">${pr.label}</button>`;
  }).join('');

  const notionAufgBtn = `<button onclick="syncAufgabenNotion()" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;font-weight:700;color:var(--text);font-family:inherit;cursor:pointer">
    <img src="https://www.notion.so/images/favicon.ico" style="width:14px;height:14px;border-radius:2px" onerror="this.style.display='none'"> 🔄 Nach Notion
  </button>`;
  panel.innerHTML = `
  ${_pageHdr('task_alt', 'Aufgaben', offenCount + ' offen', notionAufgBtn)}

  <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:20px;margin-bottom:20px">
    <div style="font-size:14px;font-weight:800;color:#261816;margin-bottom:14px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#610000">add_circle</span>Neue Aufgabe erstellen
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:14px">
      <div style="grid-column:1/-1">
        <label style="display:block;font-size:11px;font-weight:700;color:#5a403c;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Titel *</label>
        <input id="auf-titel" type="text" placeholder="Aufgabe beschreiben..." style="width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;color:#261816;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#8B0000'" onblur="this.style.borderColor='#e3beb8'">
      </div>
      <div>
        <label style="display:block;font-size:11px;font-weight:700;color:#5a403c;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Kategorie</label>
        <select id="auf-kat" style="width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;color:#261816;background:#fff;cursor:pointer;outline:none">
          ${AUF_KATEGORIEN.map(k=>`<option value="${k}">${k}</option>`).join('')}
        </select>
      </div>
      <div>
        <label style="display:block;font-size:11px;font-weight:700;color:#5a403c;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Zugewiesen an</label>
        <select id="auf-ma" style="width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;color:#261816;background:#fff;cursor:pointer;outline:none">
          ${Object.entries(AUF_MA_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
        </select>
      </div>
      <div>
        <label style="display:block;font-size:11px;font-weight:700;color:#5a403c;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Priorität *</label>
        <div style="display:flex;gap:6px">${prioBtns}</div>
      </div>
      <div>
        <label style="display:block;font-size:11px;font-weight:700;color:#5a403c;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Fällig bis</label>
        <input id="auf-datum" type="date" style="width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;color:#261816;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#8B0000'" onblur="this.style.borderColor='#e3beb8'">
      </div>
      <div style="grid-column:1/-1">
        <label style="display:block;font-size:11px;font-weight:700;color:#5a403c;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Notiz (optional)</label>
        <input id="auf-notiz" type="text" placeholder="Zusätzliche Informationen..." style="width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;color:#261816;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#8B0000'" onblur="this.style.borderColor='#e3beb8'">
      </div>
    </div>
    <button onclick="aufgabeAdd()" style="width:100%;min-height:48px;padding:12px;border-radius:12px;border:none;background:#8B0000;color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer">Aufgabe erstellen</button>
  </div>

  <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:20px">
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
      ${statusPills}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px">
      <select onchange="aufgabenSetFilter('prioritaet',this.value)" style="padding:7px 12px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-family:inherit;cursor:pointer;color:#261816">
        <option value="">Alle Prioritäten</option>
        ${Object.entries(AUF_PRIO).map(([v,p])=>`<option value="${v}" ${fs.prioritaet===v?'selected':''}>${p.label}</option>`).join('')}
      </select>
      <select onchange="aufgabenSetFilter('kategorie',this.value)" style="padding:7px 12px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-family:inherit;cursor:pointer;color:#261816">
        <option value="">Alle Kategorien</option>
        ${AUF_KATEGORIEN.map(k=>`<option value="${k}" ${fs.kategorie===k?'selected':''}>${k}</option>`).join('')}
      </select>
      ${isAdminOrManager?`<select onchange="aufgabenSetFilter('mitarbeiter',this.value)" style="padding:7px 12px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-family:inherit;cursor:pointer;color:#261816">
        <option value="">Alle Mitarbeiter</option>
        ${Object.entries(AUF_MA_LABELS).filter(([v])=>v!=='alle').map(([v,l])=>`<option value="${v}" ${fs.mitarbeiter===v?'selected':''}>${l}</option>`).join('')}
      </select>`:''}
    </div>
    ${kartenHtml}
  </div>`;
}

function aufgabeAdd() {
  const titel = (document.getElementById('auf-titel')?.value||'').trim();
  if (!titel) { _markField('auf-titel', true); _showToast('Bitte Titel eingeben', 'error'); return; }
  const aufgaben = aufgabenMigriere();
  aufgaben.push({
    id: Date.now(),
    titel,
    kategorie: document.getElementById('auf-kat')?.value || 'Sonstiges',
    mitarbeiter: document.getElementById('auf-ma')?.value || 'alle',
    prioritaet: aufgabenSelectedPrio,
    faellig: document.getElementById('auf-datum')?.value || '',
    notiz: document.getElementById('auf-notiz')?.value || '',
    status: 'offen',
    erledigt: false,
    erstellt: new Date().toISOString(),
    zugewiesen_von: currentUser?.username || '',
  });
  try { _syncedLocalSet(AUF_KEY, JSON.stringify(aufgaben)); } catch(e) {}
  aufgabenSelectedPrio = 'mittel';
  _showToast('Aufgabe erstellt', 'success');
  // Notification auslösen
  if (typeof notifAdd === 'function') notifAdd('aufgabe_neu', 'Neue Aufgabe: ' + titel, '', 'info', 'aufgaben');
  renderAufgabenTab();
  _aufDashRefresh();
}

function aufgabeStatusChange(id, neuerStatus) {
  const aufgaben = aufgabenMigriere();
  const a = aufgaben.find(x => x.id === id);
  if (a) { a.status = neuerStatus; a.erledigt = (neuerStatus === 'erledigt'); }
  try { _syncedLocalSet(AUF_KEY, JSON.stringify(aufgaben)); } catch(e) {}
  renderAufgabenTab();
  _aufDashRefresh();
}

function aufgabeDelete(id) {
  let aufgaben = [];
  try { aufgaben = JSON.parse(localStorage.getItem(AUF_KEY)||'[]'); } catch(e) {}
  try { _syncedLocalSet(AUF_KEY, JSON.stringify(aufgaben.filter(x => x.id !== id))); } catch(e) {}
  _showToast('Aufgabe gelöscht', 'info');
  renderAufgabenTab();
  _aufDashRefresh();
}

function aufgabenSetFilter(type, val) {
  aufgabenFilterState[type] = val;
  renderAufgabenTab();
}

function aufgabenSetPrio(p) {
  aufgabenSelectedPrio = p;
  renderAufgabenTab();
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — SCHICHT-CHECKLISTE
// ═══════════════════════════════════════════════════════════════
function renderSchichtCheckTab() {
  const p = document.getElementById('panel-schichtcheck');
  const OEFFNUNG = ['Kasse öffnen & Kassenstand prüfen','Kühlschrank & Temperaturen kontrollieren','Mise en place vorbereiten','Küche reinigen & desinfizieren','Tagesbestellung prüfen','Mitarbeiter einweisen','Musik & Beleuchtung einstellen','Hygiene-Check durchführen'];
  const SCHLIESSUNG = ['Kasse abrechnen & Kassenstand notieren','Kühlschrank & Tiefkühler kontrollieren','Küche reinigen & desinfizieren','Müll entsorgen','Restbestände inventarisieren','Alarmanlage aktivieren','Türen & Fenster kontrollieren','Strom & Gas abschalten'];

  const today = new Date().toISOString().slice(0,10);
  let checks = {};
  try { checks = JSON.parse(localStorage.getItem('pizzeria_schichtcheck')||'{}'); } catch(e) {}
  if (checks.datum !== today) { checks = {datum:today, oeffnung:{}, schliessung:{}}; _syncedLocalSet('pizzeria_schichtcheck', JSON.stringify(checks)); }

  const renderListe = (liste, typ) => liste.map((item,i) => {
    const done = !!(checks[typ]||{})[i];
    const zeit = (checks[typ]||{})[i+'_z']||'';
    return `<div onclick="schichtCheckToggle('${typ}',${i})" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;background:${done?'#e8f5e9':'#fff8f6'};border:1.5px solid ${done?'#a5d6a7':'#e3beb8'};margin-bottom:8px;cursor:pointer;transition:all .2s">
      <div style="width:22px;height:22px;border-radius:6px;border:2px solid ${done?'#2e7d32':'#e3beb8'};background:${done?'#2e7d32':'#fff'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${done?'<span style="color:#fff;font-size:13px;font-weight:700">✓</span>':''}</div>
      <span style="flex:1;font-size:13px;font-weight:600;color:${done?'#1b5e20':'#261816'};text-decoration:${done?'line-through':'none'}">${item}</span>
      ${zeit?`<span style="font-size:11px;color:#6b6b6b;white-space:nowrap">${zeit}</span>`:''}
    </div>`;
  }).join('');

  const oCount = Object.keys(checks.oeffnung||{}).filter(k=>!k.endsWith('_z')).length;
  const sCount = Object.keys(checks.schliessung||{}).filter(k=>!k.endsWith('_z')).length;

  const progress = (done, total, color) => `
    <div style="height:6px;border-radius:4px;background:#f0e4e1;margin-bottom:16px">
      <div style="height:100%;border-radius:4px;background:${color};width:${Math.round(done/total*100)}%;transition:width .3s"></div>
    </div>`;

  p.innerHTML = `
    ${_pageHdr('playlist_add_check', 'Schicht-Checkliste', today + ' — Wird täglich zurückgesetzt')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #e3beb8">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div><div style="font-size:16px;font-weight:800;color:#261816">🌅 Öffnung</div><div style="font-size:12px;color:#5a403c;margin-top:2px">${oCount}/${OEFFNUNG.length} erledigt</div></div>
          <div style="width:38px;height:38px;border-radius:50%;background:${oCount===OEFFNUNG.length?'#2e7d32':'#f0e4e1'};display:flex;align-items:center;justify-content:center;font-size:16px">${oCount===OEFFNUNG.length?'✅':'⏳'}</div>
        </div>
        ${progress(oCount, OEFFNUNG.length, '#2e7d32')}
        ${renderListe(OEFFNUNG,'oeffnung')}
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #e3beb8">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div><div style="font-size:16px;font-weight:800;color:#261816">🌙 Schließung</div><div style="font-size:12px;color:#5a403c;margin-top:2px">${sCount}/${SCHLIESSUNG.length} erledigt</div></div>
          <div style="width:38px;height:38px;border-radius:50%;background:${sCount===SCHLIESSUNG.length?'#1a1a2e':'#f0e4e1'};display:flex;align-items:center;justify-content:center;font-size:16px">${sCount===SCHLIESSUNG.length?'✅':'⏳'}</div>
        </div>
        ${progress(sCount, SCHLIESSUNG.length, '#1a1a2e')}
        ${renderListe(SCHLIESSUNG,'schliessung')}
      </div>
    </div>`;
}
function schichtCheckToggle(typ, index) {
  let checks = {};
  try { checks = JSON.parse(localStorage.getItem('pizzeria_schichtcheck')||'{}'); } catch(e) {}
  if (!checks[typ]) checks[typ] = {};
  if (checks[typ][index]) { delete checks[typ][index]; delete checks[typ][index+'_z']; }
  else { checks[typ][index]=true; checks[typ][index+'_z']=new Date().toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'}); }
  _syncedLocalSet('pizzeria_schichtcheck', checks);
  renderSchichtCheckTab();
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — BESTELLLISTE
// ═══════════════════════════════════════════════════════════════
function renderBestellungTab() {
  const p = document.getElementById('panel-bestellung');
  let artikel = [];
  try { artikel = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}

  const KATS = ['Küche','Bar','Reinigung','Sonstiges'];
  const KAT_STYLE = { 'Küche':'#fff3e0;#e65100', 'Bar':'#e3f2fd;#0d47a1', 'Reinigung':'#e8f5e9;#2e7d32', 'Sonstiges':'#f3e5f5;#6a1b9a' };

  const filterKat = p.dataset.filterKat||'';
  const filterStatus = p.dataset.filterStatus2||'';

  const visible = artikel.filter(a => {
    if (filterKat && a.kategorie !== filterKat) return false;
    if (filterStatus==='offen' && a.erledigt) return false;
    if (filterStatus==='erledigt' && !a.erledigt) return false;
    return true;
  });

  const offenCount = artikel.filter(a=>!a.erledigt).length;
  const dringlichCount = artikel.filter(a=>a.dringlich&&!a.erledigt).length;

  const rows = visible.length ? visible.map(a => {
    const ks = (KAT_STYLE[a.kategorie]||KAT_STYLE['Sonstiges']).split(';');
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:1.5px solid ${a.dringlich&&!a.erledigt?'#ef9a9a':a.erledigt?'#e0e0e0':'#e3beb8'};background:${a.dringlich&&!a.erledigt?'#ffebee':a.erledigt?'#fafafa':'#fff8f6'};margin-bottom:8px;opacity:${a.erledigt?'.6':'1'}">
      <input type="checkbox" ${a.erledigt?'checked':''} onchange="bestellungToggle(${a.id})" style="width:18px;height:18px;cursor:pointer;accent-color:#8B0000">
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px;color:${a.erledigt?'#9e9e9e':'#261816'};text-decoration:${a.erledigt?'line-through':'none'}">${_esc(a.name)}${a.dringlich&&!a.erledigt?' <span style="color:#c62828;font-size:11px;font-weight:700">🔴 DRINGEND</span>':''}</div>
        <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
          <span style="font-size:11px;font-weight:600;color:#5a403c">${a.menge} ${_esc(a.einheit)}</span>
          <span style="font-size:11px;padding:1px 7px;border-radius:6px;background:${ks[0]};color:${ks[1]};font-weight:600">${a.kategorie}</span>
        </div>
      </div>
      <button onclick="bestellungDringlich(${a.id})" title="Dringend" style="padding:5px 8px;border-radius:8px;border:1px solid ${a.dringlich?'#ef9a9a':'#e3beb8'};background:${a.dringlich?'#ffebee':'#fff8f6'};font-size:12px;cursor:pointer">${a.dringlich?'🔴':'⚪'}</button>
      <button onclick="bestellungDelete(${a.id})" style="padding:5px 8px;border-radius:8px;border:1px solid #e3beb8;background:#fff8f6;color:#8B0000;font-size:12px;cursor:pointer">🗑️</button>
    </div>`;
  }).join('') : `<div style="text-align:center;padding:40px;color:#6b6b6b;font-size:14px">Keine Artikel gefunden</div>`;

  const EINHEITEN = ['kg','g','L','ml','Stück','Packung','Flasche','Karton'];
  p.innerHTML = `
    ${_pageHdr('shopping_cart_checkout', 'Bestellliste', offenCount + ' zu bestellen' + (dringlichCount ? ' · <span style="color:#c62828;font-weight:700">' + dringlichCount + ' dringend</span>' : ''))}
    <div style="display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start">
      <div>
        <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
          <select onchange="bestellungFilter('kat',this.value)" style="padding:8px 12px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-family:inherit;cursor:pointer">
            <option value="">📦 Alle Kategorien</option>
            ${KATS.map(k=>`<option value="${k}" ${filterKat===k?'selected':''}>${k}</option>`).join('')}
          </select>
          <select onchange="bestellungFilter('status',this.value)" style="padding:8px 12px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-family:inherit;cursor:pointer">
            <option value="" ${filterStatus===''?'selected':''}>📋 Alle</option>
            <option value="offen" ${filterStatus==='offen'?'selected':''}>🔴 Offen</option>
            <option value="erledigt" ${filterStatus==='erledigt'?'selected':''}>✅ Gekauft</option>
          </select>
          <button onclick="bestellungErledigtLoeschen()" style="padding:8px 14px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;font-size:13px;font-weight:600;color:#5a403c;cursor:pointer;margin-left:auto">🗑️ Erledigte löschen</button>
        </div>
        ${rows}
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #e3beb8;position:sticky;top:20px">
        <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px">➕ Artikel hinzufügen</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <input id="best-name" placeholder="Artikelname..." style="padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff8f6">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input id="best-menge" type="number" placeholder="Menge" min="1" value="1" style="padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff8f6">
            <select id="best-einheit" style="padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff8f6">
              ${EINHEITEN.map(e=>`<option>${e}</option>`).join('')}
            </select>
          </div>
          <select id="best-kat" style="padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff8f6">
            ${KATS.map(k=>`<option>${k}</option>`).join('')}
          </select>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#c62828;cursor:pointer">
            <input id="best-dringend" type="checkbox" style="width:16px;height:16px;accent-color:#c62828"> 🔴 Dringend markieren
          </label>
          <button onclick="bestellungHinzufuegen()" style="padding:12px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer">Hinzufügen</button>
        </div>
      </div>
    </div>`;
}
function bestellungHinzufuegen() {
  const name = document.getElementById('best-name')?.value.trim();
  if (!name) { _markField('best-name', true); _showToast('Bitte Artikelname eingeben', 'error'); return; }
  let artikel = [];
  try { artikel = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}
  artikel.unshift({ id:Date.now(), name, menge:document.getElementById('best-menge')?.value||'1', einheit:document.getElementById('best-einheit')?.value||'Stück', kategorie:document.getElementById('best-kat')?.value||'Küche', dringlich:document.getElementById('best-dringend')?.checked||false, erledigt:false });
  _syncedLocalSet('pizzeria_bestellung', JSON.stringify(artikel));
  _showToast('Artikel hinzugefügt', 'success'); renderBestellungTab();
}
function bestellungToggle(id) {
  let a = []; try { a = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}
  const x = a.find(i=>i.id===id); if(x) x.erledigt=!x.erledigt;
  _syncedLocalSet('pizzeria_bestellung', JSON.stringify(a));
  if (x && x.erledigt) n8nHook('bestellung-done', { id: x.id, artikel: x.name, erledigt: true });
  renderBestellungTab();
}
function bestellungDringlich(id) {
  let a = []; try { a = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}
  const x = a.find(i=>i.id===id); if(x) x.dringlich=!x.dringlich;
  _syncedLocalSet('pizzeria_bestellung', JSON.stringify(a)); renderBestellungTab();
}
function bestellungDelete(id) {
  let a = []; try { a = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}
  _syncedLocalSet('pizzeria_bestellung', JSON.stringify(a.filter(i=>i.id!==id)));
  _showToast('Artikel gelöscht', 'info'); renderBestellungTab();
}
function bestellungErledigtLoeschen() {
  let a = []; try { a = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}
  _syncedLocalSet('pizzeria_bestellung', JSON.stringify(a.filter(i=>!i.erledigt)));
  _showToast('Erledigte gelöscht', 'info'); renderBestellungTab();
}
function bestellungFilter(type, val) {
  const p = document.getElementById('panel-bestellung');
  if(type==='kat') p.dataset.filterKat=val; else p.dataset.filterStatus2=val;
  renderBestellungTab();
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — LAGERBESTAND
// ═══════════════════════════════════════════════════════════════
function renderLagerTab() {
  var p = document.getElementById('panel-lager');
  var lager = [];
  try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}

  var KATS = ['Grundzutaten','Käse','Belag','Fleisch & Fisch','Getränke','Küche','Bar','Reinigung','Verpackung','Sonstiges'];
  var KAT_STYLE = {
    'Grundzutaten':'#b52619;#ffdad6', 'Käse':'#e65100;#fff3e0', 'Belag':'#2e7d32;#e8f5e9',
    'Fleisch & Fisch':'#5d4037;#efebe9', 'Getränke':'#6a1b9a;#f3e5f5',
    'Küche':'#e65100;#fff3e0', 'Bar':'#0d47a1;#e3f2fd', 'Reinigung':'#2e7d32;#e8f5e9',
    'Verpackung':'#6a1b9a;#f3e5f5', 'Sonstiges':'#616161;#f5f5f5'
  };
  var filterKat = p.dataset.filterKat||'';
  var filterAmpel = p.dataset.filterAmpel||'';
  var searchQ = (p.dataset.searchQ||'').toLowerCase();

  var ampel = function(a) {
    if (a.menge <= 0) return 'rot';
    if (a.menge <= a.mindest) return 'rot';
    if (a.menge <= a.mindest * 1.5) return 'gelb';
    return 'gruen';
  };

  var visible = lager.filter(function(a) {
    if (filterKat && a.kategorie !== filterKat) return false;
    if (filterAmpel && ampel(a) !== filterAmpel) return false;
    if (searchQ && !a.name.toLowerCase().includes(searchQ)) return false;
    return true;
  });

  var rotCount = lager.filter(function(a){ return ampel(a)==='rot'; }).length;
  var gelbCount = lager.filter(function(a){ return ampel(a)==='gelb'; }).length;
  var gruenCount = lager.length - rotCount - gelbCount;

  // ── Status-Dashboard ──
  var html = _pageHdr('warehouse', 'Lagerbestand', lager.length + ' Artikel verwaltet',
    (rotCount ? '<button onclick="lagerAlleRotBestellen()" class="ws-btn ws-btn-sm" style="background:#ffebee;color:#c62828;border:1.5px solid #ef9a9a;margin-right:4px"><span class="material-symbols-outlined">shopping_cart</span>Kritische bestellen</button>' : '')
    + '<input type="file" id="lager-csv-input" accept=".csv" style="display:none" onchange="lagerCsvImport(this.files[0])">'
    + '<button onclick="lagerCsvVorlageDownload()" class="ws-btn ws-btn-sm" style="margin-right:4px">📄 Vorlage</button>'
    + '<button onclick="document.getElementById(\'lager-csv-input\').click()" class="ws-btn ws-btn-sm" style="margin-right:4px">📥 CSV importieren</button>'
    + '<button onclick="lagerFormToggle()" class="ws-btn ws-btn-primary ws-btn-sm"><span class="material-symbols-outlined">add</span>Neu</button>');

  html += '<div id="lag-form-area"></div>';

  // 3 Status-Karten
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">';
  html += '<div onclick="lagerFilter(\'ampel\',\'rot\')" style="cursor:pointer;background:linear-gradient(135deg,#ffebee,#fff);border:1.5px solid ' + (filterAmpel==='rot'?'#c62828':'#ef9a9a') + ';border-radius:14px;padding:16px;text-align:center;transition:all .2s">';
  html += '<div style="font-size:28px;font-weight:900;color:#c62828">' + rotCount + '</div>';
  html += '<div style="font-size:11px;font-weight:700;color:#c62828;text-transform:uppercase;letter-spacing:.05em">Kritisch</div>';
  html += '<div style="height:4px;border-radius:2px;background:#fce4ec;margin-top:8px"><div style="height:100%;border-radius:2px;background:#c62828;width:' + (lager.length ? Math.round(rotCount/lager.length*100) : 0) + '%;transition:width .3s"></div></div>';
  html += '</div>';
  html += '<div onclick="lagerFilter(\'ampel\',\'gelb\')" style="cursor:pointer;background:linear-gradient(135deg,#fff8e1,#fff);border:1.5px solid ' + (filterAmpel==='gelb'?'#f57f17':'#ffe082') + ';border-radius:14px;padding:16px;text-align:center;transition:all .2s">';
  html += '<div style="font-size:28px;font-weight:900;color:#f57f17">' + gelbCount + '</div>';
  html += '<div style="font-size:11px;font-weight:700;color:#f57f17;text-transform:uppercase;letter-spacing:.05em">Niedrig</div>';
  html += '<div style="height:4px;border-radius:2px;background:#fff3e0;margin-top:8px"><div style="height:100%;border-radius:2px;background:#f57f17;width:' + (lager.length ? Math.round(gelbCount/lager.length*100) : 0) + '%;transition:width .3s"></div></div>';
  html += '</div>';
  html += '<div onclick="lagerFilter(\'ampel\',\'gruen\')" style="cursor:pointer;background:linear-gradient(135deg,#e8f5e9,#fff);border:1.5px solid ' + (filterAmpel==='gruen'?'#2e7d32':'#a5d6a7') + ';border-radius:14px;padding:16px;text-align:center;transition:all .2s">';
  html += '<div style="font-size:28px;font-weight:900;color:#2e7d32">' + gruenCount + '</div>';
  html += '<div style="font-size:11px;font-weight:700;color:#2e7d32;text-transform:uppercase;letter-spacing:.05em">OK</div>';
  html += '<div style="height:4px;border-radius:2px;background:#e8f5e9;margin-top:8px"><div style="height:100%;border-radius:2px;background:#2e7d32;width:' + (lager.length ? Math.round(gruenCount/lager.length*100) : 0) + '%;transition:width .3s"></div></div>';
  html += '</div></div>';

  // ── Suche + Filter ──
  html += '<div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;align-items:center">';
  html += '<div style="flex:1;min-width:200px"><input type="text" placeholder="Artikel suchen…" value="' + escHtml(p.dataset.searchQ||'') + '" oninput="var p=document.getElementById(\'panel-lager\');p.dataset.searchQ=this.value;renderLagerTab()" style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>';
  html += '<select onchange="lagerFilter(\'kat\',this.value)" style="padding:10px 14px;border-radius:12px;border:1.5px solid #e3beb8;background:#fff;font-size:13px;font-family:inherit;cursor:pointer">';
  html += '<option value="">Alle Kategorien</option>';
  for (var ki = 0; ki < KATS.length; ki++) {
    var hasItems = lager.some(function(a){ return a.kategorie === KATS[ki]; });
    if (!hasItems) continue;
    html += '<option value="' + KATS[ki] + '"' + (filterKat===KATS[ki]?' selected':'') + '>' + KATS[ki] + '</option>';
  }
  html += '</select>';
  if (filterKat || filterAmpel || searchQ) {
    html += '<button onclick="var p=document.getElementById(\'panel-lager\');p.dataset.filterKat=\'\';p.dataset.filterAmpel=\'\';p.dataset.searchQ=\'\';renderLagerTab()" style="padding:8px 14px;border-radius:12px;border:1.5px solid #e3beb8;background:#fff0ee;color:#610000;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">✕ Filter zurücksetzen</button>';
  }
  html += '</div>';

  // ── Artikel nach Kategorie gruppiert ──
  if (visible.length === 0) {
    html += '<div style="text-align:center;padding:40px;color:#8d6562;font-size:14px">Keine Artikel gefunden.</div>';
  } else {
    // Kategorien sammeln die Artikel haben
    var usedKats = [];
    for (var ui = 0; ui < KATS.length; ui++) {
      if (visible.some(function(a){ return a.kategorie === KATS[ui]; })) usedKats.push(KATS[ui]);
    }
    // Artikel ohne bekannte Kategorie
    var otherItems = visible.filter(function(a){ return KATS.indexOf(a.kategorie) === -1; });
    if (otherItems.length) usedKats.push('_andere');

    for (var ci = 0; ci < usedKats.length; ci++) {
      var cat = usedKats[ci];
      var catLabel = cat === '_andere' ? 'Sonstiges' : cat;
      var items = cat === '_andere' ? otherItems : visible.filter(function(a){ return a.kategorie === cat; });
      var cs = (KAT_STYLE[cat]||KAT_STYLE['Sonstiges']).split(';');
      var catFarbe = cs[0], catBg = cs[1];

      // Kategorie-Überschrift
      html += '<div style="margin-bottom:20px">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
      html += '<div style="width:4px;height:20px;border-radius:2px;background:' + catFarbe + '"></div>';
      html += '<h3 style="font-size:13px;font-weight:800;color:' + catFarbe + ';text-transform:uppercase;letter-spacing:.08em;margin:0">' + catLabel + '</h3>';
      html += '<span style="font-size:11px;color:#8d6562;font-weight:600">' + items.length + ' Artikel</span>';
      html += '</div>';

      // Tabelle
      html += '<div style="background:#fff;border:1.5px solid #f0e4e1;border-radius:14px;overflow:hidden">';
      for (var mi = 0; mi < items.length; mi++) {
        var a = items[mi];
        var am = ampel(a);
        var pct = a.mindest > 0 ? Math.min(Math.round(a.menge / a.mindest * 100), 200) : 100;
        var barW = Math.min(pct, 100);
        var barClr = am === 'rot' ? '#c62828' : am === 'gelb' ? '#f57f17' : '#2e7d32';
        var barBg = am === 'rot' ? '#ffcdd2' : am === 'gelb' ? '#ffe082' : '#c8e6c9';
        var amIcon = am === 'rot' ? '🔴' : am === 'gelb' ? '🟡' : '🟢';
        var mengeClr = am === 'rot' ? '#c62828' : am === 'gelb' ? '#e65100' : '#2e7d32';

        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;' + (mi < items.length-1 ? 'border-bottom:1px solid #f5efed;' : '') + '">';
        // Ampel
        html += '<span style="font-size:14px;flex-shrink:0">' + amIcon + '</span>';
        // Name + Fortschrittsbalken
        html += '<div style="flex:1;min-width:0">';
        html += '<div style="font-weight:700;font-size:13px;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(a.name) + '</div>';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-top:3px">';
        html += '<div style="flex:1;height:5px;border-radius:3px;background:' + barBg + ';max-width:120px"><div style="height:100%;border-radius:3px;background:' + barClr + ';width:' + barW + '%;transition:width .3s"></div></div>';
        html += '<span style="font-size:11px;color:#6b6b6b;flex-shrink:0">Min: ' + a.mindest + '</span>';
        html += '</div></div>';
        // Bestand
        html += '<div style="text-align:right;min-width:70px;flex-shrink:0">';
        html += '<span style="font-size:14px;font-weight:800;color:' + mengeClr + '">' + a.menge + '</span>';
        html += '<span style="font-size:11px;color:#8d6562;margin-left:3px">' + _esc(a.einheit) + '</span>';
        html += '</div>';
        // Eingang/Abfluss Buttons
        html += '<div style="display:flex;align-items:center;gap:4px;flex-shrink:0">';
        html += '<button onclick="lagerEingabe(' + a.id + ')" title="Menge eingeben" style="padding:5px 8px;border-radius:8px;border:1.5px solid #a5d6a7;background:#e8f5e9;color:#2e7d32;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">+ Eingang</button>';
        html += '<button onclick="lagerAnpassen(' + a.id + ',-1)" title="−1" style="width:28px;height:28px;border-radius:8px;border:1.5px solid #ef9a9a;background:#ffebee;color:#c62828;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>';
        html += '<button onclick="lagerBearbeiten(' + a.id + ')" title="Bearbeiten" style="width:28px;height:28px;border-radius:8px;border:1px solid #e3beb8;background:#fff8f6;color:#610000;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined" style="font-size:15px">edit</span></button>';
        html += '<button onclick="lagerDelete(' + a.id + ')" title="Löschen" style="width:28px;height:28px;border-radius:8px;border:1px solid #e3beb8;background:#fff8f6;color:#b52619;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined" style="font-size:15px">delete</span></button>';
        html += '</div></div>';
      }
      html += '</div></div>';
    }
  }

  p.innerHTML = html;
}

// Formular zum Hinzufügen (toggle)
function lagerFormToggle() {
  var area = document.getElementById('lag-form-area');
  if (!area) return;
  if (area.innerHTML.trim()) { area.innerHTML = ''; return; }
  var KATS = ['Grundzutaten','Käse','Belag','Fleisch & Fisch','Getränke','Küche','Bar','Reinigung','Verpackung','Sonstiges'];
  var EINHEITEN = ['kg','g','L','ml','Stück','Packung','Päck.','Dose','Dosen','Flasche','Karton','Ktn','Pkg','Beutel','Rolle'];
  area.innerHTML = '<div style="background:#fff;border:2px solid #610000;border-radius:18px;padding:20px;margin-bottom:20px">'
    + '<h3 style="font-size:15px;font-weight:800;color:#610000;margin:0 0 16px">Neuer Lagerartikel</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name *</label>'
    + '<input id="lag-name" type="text" placeholder="z.B. Pizzamehl Tipo 00" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie *</label>'
    + '<select id="lag-kat" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">'
    + KATS.map(function(k){ return '<option>' + k + '</option>'; }).join('') + '</select></div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Bestand</label>'
    + '<input id="lag-menge" type="number" min="0" value="0" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Einheit *</label>'
    + '<select id="lag-einheit" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">'
    + EINHEITEN.map(function(e){ return '<option>' + e + '</option>'; }).join('') + '</select></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Mindestbestand</label>'
    + '<input id="lag-mindest" type="number" min="0" value="5" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px">'
    + '<button onclick="lagerHinzufuegen()" style="flex:1;background:#610000;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Hinzufügen</button>'
    + '<button onclick="document.getElementById(\'lag-form-area\').innerHTML=\'\'" style="padding:13px 20px;background:#f3ebe9;color:#5a403c;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Abbrechen</button>'
    + '</div></div>';
  area.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// Eingang mit Mengen-Dialog
function lagerEingabe(id) {
  var menge = prompt('Eingang — wie viel hinzufügen?');
  if (menge === null) return;
  var n = parseFloat(menge);
  if (isNaN(n) || n <= 0) { _showToast('Bitte gültige Menge eingeben', 'error'); return; }
  lagerAnpassen(id, n);
}

// Bearbeiten
function lagerBearbeiten(id) {
  var lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}
  var a = lager.find(function(x){ return x.id === id; });
  if (!a) return;
  var KATS = ['Grundzutaten','Käse','Belag','Fleisch & Fisch','Getränke','Küche','Bar','Reinigung','Verpackung','Sonstiges'];
  var EINHEITEN = ['kg','g','L','ml','Stück','Packung','Päck.','Dose','Dosen','Flasche','Karton','Ktn','Pkg','Beutel','Rolle'];
  var area = document.getElementById('lag-form-area');
  if (!area) return;
  area.innerHTML = '<div style="background:#fff;border:2px solid #610000;border-radius:18px;padding:20px;margin-bottom:20px">'
    + '<h3 style="font-size:15px;font-weight:800;color:#610000;margin:0 0 16px">Artikel bearbeiten</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name *</label>'
    + '<input id="lag-edit-name" type="text" value="' + escHtml(a.name) + '" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie *</label>'
    + '<select id="lag-edit-kat" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">'
    + KATS.map(function(k){ return '<option' + (a.kategorie===k?' selected':'') + '>' + k + '</option>'; }).join('') + '</select></div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Bestand</label>'
    + '<input id="lag-edit-menge" type="number" min="0" value="' + a.menge + '" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Einheit *</label>'
    + '<select id="lag-edit-einheit" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">'
    + EINHEITEN.map(function(e){ return '<option' + (a.einheit===e?' selected':'') + '>' + e + '</option>'; }).join('') + '</select></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Mindestbestand</label>'
    + '<input id="lag-edit-mindest" type="number" min="0" value="' + a.mindest + '" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px">'
    + '<button onclick="lagerSpeichern(' + id + ')" style="flex:1;background:#610000;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Speichern</button>'
    + '<button onclick="document.getElementById(\'lag-form-area\').innerHTML=\'\'" style="padding:13px 20px;background:#f3ebe9;color:#5a403c;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Abbrechen</button>'
    + '</div></div>';
  area.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function lagerSpeichern(id) {
  var name = (document.getElementById('lag-edit-name')?.value||'').trim();
  if (!name) { _markField('lag-edit-name', true); _showToast('Bitte Namen eingeben', 'error'); return; }
  var lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}
  lager = lager.map(function(a) {
    if (a.id !== id) return a;
    return { id:a.id, name:name, kategorie:document.getElementById('lag-edit-kat')?.value||a.kategorie, menge:parseFloat(document.getElementById('lag-edit-menge')?.value)||0, einheit:document.getElementById('lag-edit-einheit')?.value||a.einheit, mindest:parseFloat(document.getElementById('lag-edit-mindest')?.value)||0 };
  });
  _syncedLocalSet('pizzeria_lager', JSON.stringify(lager));
  const gespeichert = lager.find(a => a.id === id);
  if (gespeichert && gespeichert.menge <= gespeichert.mindest) {
    n8nHook('lager-low', { artikel: gespeichert.name, menge: gespeichert.menge, mindestmenge: gespeichert.mindest });
  }
  _showToast('Artikel gespeichert', 'success');
  renderLagerTab();
}
function lagerHinzufuegen() {
  const name = document.getElementById('lag-name')?.value.trim();
  if (!name) { _markField('lag-name', true); _showToast('Bitte Artikelname eingeben', 'error'); return; }
  let lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}
  lager.push({ id:Date.now(), name, kategorie:document.getElementById('lag-kat')?.value||'Küche', menge:parseFloat(document.getElementById('lag-menge')?.value)||0, einheit:document.getElementById('lag-einheit')?.value||'Stück', mindest:parseFloat(document.getElementById('lag-mindest')?.value)||5 });
  _syncedLocalSet('pizzeria_lager', JSON.stringify(lager));
  _showToast('Artikel hinzugefügt', 'success'); renderLagerTab();
}
function lagerAnpassen(id, delta) {
  let lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}
  const a = lager.find(x=>x.id===id);
  if (a) { a.menge = Math.max(0, a.menge + delta); _syncedLocalSet('pizzeria_lager', JSON.stringify(lager)); lagerCheckAlarm(a); renderLagerTab(); }
}
function lagerDelete(id) {
  let lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}
  _syncedLocalSet('pizzeria_lager', JSON.stringify(lager.filter(x=>x.id!==id)));
  _showToast('Artikel gelöscht', 'info'); renderLagerTab();
}
function lagerFilter(type, val) {
  const p = document.getElementById('panel-lager');
  if(type==='kat') p.dataset.filterKat=val; else p.dataset.filterAmpel=val;
  renderLagerTab();
}
function lagerCheckAlarm(a) {
  if (a.menge <= a.mindest) {
    let best = []; try { best = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}
    if (!best.find(x=>x.name===a.name&&!x.erledigt)) {
      best.unshift({ id:Date.now(), name:a.name, menge:a.mindest*2, einheit:a.einheit, kategorie:a.kategorie||'Küche', dringlich:a.menge<=0, erledigt:false });
      _syncedLocalSet('pizzeria_bestellung', JSON.stringify(best));
      _showToast(a.name+' → Bestellliste hinzugefügt!', 'warning');
    }
    // Notification auslösen
    if (typeof notifAdd === 'function') {
      if (a.menge <= 0) {
        notifAdd('lager_leer', a.name + ' ist leer!', 'Sofort nachbestellen', 'critical', 'lager');
      } else {
        notifAdd('lager_alarm', a.name + ' unter Mindestbestand!', 'Nur noch ' + a.menge + ' ' + a.einheit + ' — Minimum: ' + a.mindest, 'critical', 'lager');
      }
    }
  }
}
function lagerAlleRotBestellen() {
  let lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(e) {}
  let best = []; try { best = JSON.parse(localStorage.getItem('pizzeria_bestellung')||'[]'); } catch(e) {}
  let added = 0;
  lager.filter(a=>a.menge<=a.mindest).forEach(a=>{
    if (!best.find(x=>x.name===a.name&&!x.erledigt)) {
      best.unshift({ id:Date.now()+added, name:a.name, menge:a.mindest*2, einheit:a.einheit, kategorie:a.kategorie||'Küche', dringlich:a.menge<=0, erledigt:false });
      added++;
    }
  });
  _syncedLocalSet('pizzeria_bestellung', JSON.stringify(best));
  _showToast(added+' Artikel zur Bestellliste hinzugefügt', 'success');
}

function lagerCsvVorlageDownload() {
  var rows = ['Produkt;Menge;Einheit;Mindestbestand;Kategorie',
    'Mehl (Typ 00);25;kg;5;Grundzutaten',
    'Tomatensauce;12;Dose;3;Grundzutaten',
    'Mozzarella;8;kg;2;Käse',
    'Olivenöl;4;Liter;1;Küche',
    'Salami;3;kg;1;Belag'];
  var blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8'});
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lager_vorlage.csv'; a.click();
}

function lagerCsvImport(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var csvText = e.target.result;
    var lines = csvText.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
    if (lines.length < 2) { _showToast('CSV leer oder kein Header', 'error'); return; }
    var sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
    var headers = lines[0].split(sep).map(function(h){ return h.trim().toLowerCase().replace(/"/g,''); });
    var colIdx = function(names) {
      for (var i=0;i<names.length;i++) { var idx=headers.indexOf(names[i]); if(idx>=0) return idx; } return -1;
    };
    var iName = colIdx(['produkt','name','artikel']);
    var iMenge = colIdx(['menge','bestand','anzahl','stock']);
    var iEinheit = colIdx(['einheit','unit']);
    var iMin = colIdx(['mindestbestand','mindest','min','minimum']);
    var iKat = colIdx(['kategorie','category','kat']);
    if (iName < 0) { _showToast('Spalte "Produkt" oder "Name" nicht gefunden', 'error'); return; }
    var lager = []; try { lager = JSON.parse(localStorage.getItem('pizzeria_lager')||'[]'); } catch(_) {}
    var preview = [];
    for (var li=1; li<lines.length; li++) {
      var cols = lines[li].split(sep).map(function(c){ return c.trim().replace(/^"|"$/g,''); });
      var pName = iName>=0 ? cols[iName]||'' : '';
      if (!pName) continue;
      var menge = iMenge>=0 ? parseFloat(cols[iMenge])||0 : 0;
      if (isNaN(menge)) continue;
      var einheit = iEinheit>=0 ? cols[iEinheit]||'Stk' : 'Stk';
      var mindest = iMin>=0 ? parseFloat(cols[iMin])||0 : 0;
      var kat = iKat>=0 ? cols[iKat]||'Sonstiges' : 'Sonstiges';
      var existing = lager.find(function(x){ return x.name.toLowerCase()===pName.toLowerCase(); });
      preview.push({ pName: pName, menge: menge, einheit: einheit, mindest: mindest, kat: kat, isUpdate: !!existing });
    }
    if (preview.length === 0) { _showToast('Keine gültigen Zeilen gefunden', 'error'); return; }
    var tableRows = preview.map(function(r) {
      return '<tr style="border-bottom:1px solid #f3f4f6">'
        +'<td style="padding:6px 10px;font-size:13px;color:#261816">'+escHtml(r.pName)+'</td>'
        +'<td style="padding:6px 10px;font-size:13px;text-align:right">'+r.menge+'</td>'
        +'<td style="padding:6px 10px;font-size:13px">'+escHtml(r.einheit)+'</td>'
        +'<td style="padding:6px 10px;font-size:13px;text-align:right">'+r.mindest+'</td>'
        +'<td style="padding:6px 10px;text-align:center"><span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:'+(r.isUpdate?'#e3f2fd':'#e8f5e9')+';color:'+(r.isUpdate?'#0d47a1':'#1b5e20')+'">'+(r.isUpdate?'Update':'Neu')+'</span></td>'
        +'</tr>';
    }).join('');
    var modalHtml = '<div id="lager-csv-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">'
      +'<div style="background:#fff;border-radius:20px;padding:24px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.2)">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
      +'<h3 style="font-size:18px;font-weight:800;color:#261816;margin:0">📥 CSV Vorschau — '+preview.length+' Artikel</h3>'
      +'<button onclick="document.getElementById(\'lager-csv-modal\').remove()" style="background:#f3ebe9;border:none;border-radius:8px;padding:6px;cursor:pointer;font-size:16px">✕</button>'
      +'</div>'
      +'<table style="width:100%;border-collapse:collapse;margin-bottom:18px">'
      +'<thead><tr style="background:#f8f9fa"><th style="padding:7px 10px;text-align:left;font-size:11px;font-weight:700;color:#5a403c">Produkt</th><th style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:#5a403c">Menge</th><th style="padding:7px 10px;font-size:11px;font-weight:700;color:#5a403c">Einheit</th><th style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:#5a403c">Mindest</th><th style="padding:7px 10px;font-size:11px;font-weight:700;color:#5a403c">Status</th></tr></thead>'
      +'<tbody>'+tableRows+'</tbody></table>'
      +'<div style="display:flex;gap:10px">'
      +'<button onclick="(function(){'+
        'var prev='+JSON.stringify(preview)+';'+
        'var lager=[];try{lager=JSON.parse(localStorage.getItem(\'pizzeria_lager\')||\'[]\');}catch(_){}'+
        'var neu=0,upd=0;'+
        'prev.forEach(function(r){'+
          'var ex=lager.find(function(x){return x.name.toLowerCase()===r.pName.toLowerCase();});'+
          'if(ex){ex.menge=r.menge;ex.mindest=r.mindest;ex.einheit=r.einheit;upd++;}'+
          'else{lager.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:r.pName,menge:r.menge,einheit:r.einheit,mindest:r.mindest,kategorie:r.kat});neu++;}'+
        '});'+
        '_syncedLocalSet(\'pizzeria_lager\',JSON.stringify(lager));'+
        'document.getElementById(\'lager-csv-modal\').remove();'+
        '_showToast(neu+\' Produkte importiert, \'+upd+\' aktualisiert\',\'success\');'+
        'renderLagerTab();'+
        'var inp=document.getElementById(\'lager-csv-input\');if(inp)inp.value=\'\';'+
      '})()" style="flex:1;padding:13px;border-radius:12px;border:none;background:#8B0000;color:#fff;font-size:14px;font-weight:700;cursor:pointer">✅ Importieren</button>'
      +'<button onclick="document.getElementById(\'lager-csv-modal\').remove()" style="padding:13px 20px;border-radius:12px;border:1px solid #d1d5db;background:#f9fafb;color:#374151;font-size:14px;font-weight:700;cursor:pointer">Abbrechen</button>'
      +'</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  };
  reader.readAsText(file, 'UTF-8');
}

// ═══════════════════════════════════════════════════════════════
// KONKURRENZ-MONITOR TAB
// ═══════════════════════════════════════════════════════════════
var KK_KEY = 'sc_konkurrenz';

function kkLoad() {
  try { return JSON.parse(localStorage.getItem(KK_KEY)||'null')||_kkDefault(); }
  catch(_) { return _kkDefault(); }
}
function kkSave(d) { try { localStorage.setItem(KK_KEY, JSON.stringify(d)); } catch(_) {} }
function kkGenId() { return 'kk' + Date.now() + Math.random().toString(36).slice(2,5); }

function _kkDefault() {
  var d = [
    { id:kkGenId(), name:'Pizza Mann', adresse:'Favoritenstraße 12, 1100 Wien', bewertung:3.8, preisniveau:'Mittel',
      preise:{margherita:8.90,diavola:10.90,salami:9.90,hawaii:10.50,quattro:11.90},
      staerken:'Schnelle Lieferung, günstig', schwaechen:'Qualität schwankt, kleine Portionen', notizen:'Hauptkonkurrent im Liefergebiet' },
    { id:kkGenId(), name:'Domino\'s Pizza', adresse:'Reumannplatz 3, 1100 Wien', bewertung:3.5, preisniveau:'Günstig',
      preise:{margherita:7.99,diavola:10.99,salami:9.49,hawaii:10.49,quattro:11.99},
      staerken:'Markenbekanntheit, Aktionen', schwaechen:'Industriequalität, kein echter Holzofen', notizen:'Aggressives Marketing, 2-für-1 Aktionen' },
    { id:kkGenId(), name:'Ristorante Bella Napoli', adresse:'Quellenstraße 28, 1100 Wien', bewertung:4.5, preisniveau:'Gehoben',
      preise:{margherita:11.50,diavola:13.90,salami:12.90,hawaii:0,quattro:14.90},
      staerken:'Authentisch italienisch, Holzofen, Top-Bewertung', schwaechen:'Teuer, lange Wartezeit, keine Lieferung', notizen:'Premium-Segment, andere Zielgruppe' },
  ];
  kkSave(d);
  return d;
}

var KK_EIGENE_PREISE = {margherita:9.50,diavola:12.90,salami:10.90,hawaii:11.50,quattro:13.90};
var KK_PIZZA_LABELS = {margherita:'Margherita',diavola:'Diavola',salami:'Salami',hawaii:'Hawaii',quattro:'Quattro Stagioni'};

function renderKonkurrenzTab() {
  var panel = document.getElementById('panel-konkurrenz');
  if (!panel) return;
  try {
    var list = kkLoad();

    var html = _pageHdr('storefront', 'Konkurrenz-Monitor', list.length + ' Mitbewerber erfasst',
      '<button onclick="kkNeu()" class="ws-btn ws-btn-primary ws-btn-sm"><span class="material-symbols-outlined">add</span>Neu</button>');

    html += '<div id="kk-form-area"></div>';

    // ── Überblick-Karten ──
    var avgBew = list.length ? (list.reduce(function(s,k){ return s+k.bewertung; },0)/list.length).toFixed(1) : '–';
    var guenstiger = 0, teurer = 0;
    list.forEach(function(k){
      var keys = Object.keys(k.preise||{});
      var diff = 0, cnt = 0;
      keys.forEach(function(p){
        if (k.preise[p] > 0 && KK_EIGENE_PREISE[p]) { diff += KK_EIGENE_PREISE[p] - k.preise[p]; cnt++; }
      });
      if (cnt > 0) { if (diff/cnt > 0) teurer++; else guenstiger++; }
    });

    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">';
    html += '<div style="background:linear-gradient(135deg,#fff8f6,#fff);border:1.5px solid #f0d8d4;border-radius:14px;padding:16px;text-align:center">';
    html += '<div style="font-size:28px;font-weight:900;color:#610000">' + list.length + '</div>';
    html += '<div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Konkurrenten</div></div>';
    html += '<div style="background:linear-gradient(135deg,#fff8e1,#fff);border:1.5px solid #ffe082;border-radius:14px;padding:16px;text-align:center">';
    html += '<div style="font-size:28px;font-weight:900;color:#f57f17">⭐ ' + avgBew + '</div>';
    html += '<div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">\u00D8 Bewertung</div></div>';
    html += '<div style="background:linear-gradient(135deg,#e8f5e9,#fff);border:1.5px solid #a5d6a7;border-radius:14px;padding:16px;text-align:center">';
    html += '<div style="font-size:28px;font-weight:900;color:#2e7d32">' + guenstiger + ' / ' + teurer + '</div>';
    html += '<div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Günstiger / Teurer</div></div>';
    html += '</div>';

    // ── Preisvergleich-Tabelle ──
    html += '<div style="background:#fff;border:1.5px solid #f0d8d4;border-radius:14px;overflow:hidden;margin-bottom:24px">';
    html += '<div style="padding:14px 18px;background:linear-gradient(135deg,#fff8f6,#fff);border-bottom:1.5px solid #f0d8d4;font-size:13px;font-weight:800;color:#610000">📊 Preisvergleich — Top Pizzen</div>';
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
    html += '<thead><tr style="background:#faf6f5"><th style="padding:10px 14px;text-align:left;font-weight:700;color:#5a403c;border-bottom:1px solid #f0e4e1">Pizza</th>';
    html += '<th style="padding:10px 14px;text-align:right;font-weight:800;color:#610000;border-bottom:1px solid #f0e4e1">San Carino</th>';
    list.forEach(function(k){
      html += '<th style="padding:10px 14px;text-align:right;font-weight:600;color:#5a403c;border-bottom:1px solid #f0e4e1">' + escHtml(k.name) + '</th>';
    });
    html += '</tr></thead><tbody>';
    var pizzaKeys = Object.keys(KK_PIZZA_LABELS);
    pizzaKeys.forEach(function(pk){
      html += '<tr>';
      html += '<td style="padding:8px 14px;font-weight:600;color:#261816;border-bottom:1px solid #f5efed">' + KK_PIZZA_LABELS[pk] + '</td>';
      html += '<td style="padding:8px 14px;text-align:right;font-weight:800;color:#610000;border-bottom:1px solid #f5efed">' + eur(KK_EIGENE_PREISE[pk]) + '</td>';
      list.forEach(function(k){
        var kp = (k.preise||{})[pk] || 0;
        if (kp <= 0) { html += '<td style="padding:8px 14px;text-align:right;color:#888;border-bottom:1px solid #f5efed">–</td>'; return; }
        var diff = KK_EIGENE_PREISE[pk] - kp;
        var clr = diff > 0 ? '#c62828' : diff < 0 ? '#2e7d32' : '#5a403c';
        var arrow = diff > 0 ? '\u2191' : diff < 0 ? '\u2193' : '';
        html += '<td style="padding:8px 14px;text-align:right;border-bottom:1px solid #f5efed">';
        html += '<span style="font-weight:600">' + eur(kp) + '</span>';
        if (diff !== 0) html += ' <span style="font-size:11px;font-weight:700;color:' + clr + '">' + arrow + Math.abs(diff).toFixed(2) + '</span>';
        html += '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    // ── Konkurrenten-Karten ──
    if (list.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:#8d6562;font-size:14px">Keine Konkurrenten erfasst.</div>';
    } else {
      for (var i = 0; i < list.length; i++) {
        var k = list[i];
        var sterne = '';
        for (var s = 1; s <= 5; s++) sterne += s <= Math.round(k.bewertung) ? '⭐' : '☆';
        var niveauClr = k.preisniveau === 'Günstig' ? '#2e7d32' : k.preisniveau === 'Gehoben' ? '#c62828' : '#e65100';

        html += '<div style="background:#fff;border:1.5px solid #f0d8d4;border-radius:14px;padding:18px;margin-bottom:14px">';
        html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">';
        // Links: Name, Adresse, Bewertung
        html += '<div style="flex:1;min-width:200px">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
        html += '<span style="font-size:16px;font-weight:900;color:#261816">' + escHtml(k.name) + '</span>';
        html += '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;color:' + niveauClr + ';background:' + (k.preisniveau==='Günstig'?'#e8f5e9':k.preisniveau==='Gehoben'?'#ffebee':'#fff3e0') + '">' + escHtml(k.preisniveau) + '</span>';
        html += '</div>';
        html += '<div style="font-size:12px;color:#8d6562;margin-bottom:6px">' + escHtml(k.adresse||'') + '</div>';
        html += '<div style="font-size:13px">' + sterne + ' <span style="font-weight:700;color:#f57f17">' + k.bewertung.toFixed(1) + '</span></div>';
        html += '</div>';
        // Rechts: Buttons
        html += '<div style="display:flex;gap:5px;flex-shrink:0">';
        html += '<button onclick="kkBearbeiten(\'' + k.id + '\')" style="background:#fff0ee;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0"><span class="material-symbols-outlined" style="font-size:16px;color:#610000">edit</span></button>';
        html += '<button onclick="kkLoeschen(\'' + k.id + '\')" style="background:#fff0ee;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0"><span class="material-symbols-outlined" style="font-size:16px;color:#b52619">delete</span></button>';
        html += '</div></div>';

        // Stärken / Schwächen
        if (k.staerken || k.schwaechen) {
          html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">';
          if (k.staerken) {
            html += '<div style="background:#e8f5e9;border-radius:10px;padding:10px 12px">';
            html += '<div style="font-size:11px;font-weight:700;color:#2e7d32;margin-bottom:4px">STÄRKEN</div>';
            html += '<div style="font-size:12px;color:#1b5e20">' + escHtml(k.staerken) + '</div></div>';
          }
          if (k.schwaechen) {
            html += '<div style="background:#ffebee;border-radius:10px;padding:10px 12px">';
            html += '<div style="font-size:11px;font-weight:700;color:#c62828;margin-bottom:4px">SCHWÄCHEN</div>';
            html += '<div style="font-size:12px;color:#b71c1c">' + escHtml(k.schwaechen) + '</div></div>';
          }
          html += '</div>';
        }
        // Notizen
        if (k.notizen) {
          html += '<div style="margin-top:10px;padding:8px 12px;background:#f9f5f4;border-radius:8px;font-size:12px;color:#5a403c">';
          html += '<span style="font-weight:700;color:#610000">Notiz:</span> ' + escHtml(k.notizen) + '</div>';
        }
        html += '</div>';
      }
    }

    panel.innerHTML = html;
  } catch(err) {
    console.error('Konkurrenz Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px"><strong>Fehler:</strong> ' + _esc(err.message) + '</div>';
  }
}

function kkNeu() { _kkShowForm(null); }
function kkBearbeiten(id) { _kkShowForm(id); }

function _kkShowForm(id) {
  var list = kkLoad();
  var item = id ? list.find(function(i){ return i.id === id; }) : null;
  var area = document.getElementById('kk-form-area');
  if (!area) return;
  var preise = item ? (item.preise||{}) : {};
  area.innerHTML = '<div style="background:#fff;border:2px solid #610000;border-radius:18px;padding:20px;margin-bottom:20px">'
    + '<h3 style="font-size:15px;font-weight:800;color:#610000;margin:0 0 16px">' + (item ? 'Konkurrent bearbeiten' : 'Neuer Konkurrent') + '</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name *</label>'
    + '<input id="kk-f-name" type="text" value="' + escHtml(item?item.name:'') + '" placeholder="z.B. Pizza Mann" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Adresse</label>'
    + '<input id="kk-f-adresse" type="text" value="' + escHtml(item?item.adresse:'') + '" placeholder="Straße, PLZ Ort" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Google-Bewertung (1–5)</label>'
    + '<input id="kk-f-bew" type="number" min="1" max="5" step="0.1" value="' + (item?item.bewertung:'') + '" placeholder="4.2" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Preisniveau</label>'
    + '<select id="kk-f-niveau" style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff">'
    + '<option' + (item&&item.preisniveau==='Günstig'?' selected':'') + '>Günstig</option>'
    + '<option' + (!item||item.preisniveau==='Mittel'?' selected':'') + '>Mittel</option>'
    + '<option' + (item&&item.preisniveau==='Gehoben'?' selected':'') + '>Gehoben</option>'
    + '</select></div>'
    + '</div>'
    + '<div style="border-top:1.5px solid #f0d8d4;padding-top:14px;margin-bottom:12px">'
    + '<div style="font-size:12px;font-weight:800;color:#610000;margin-bottom:10px">Preisvergleich (€)</div>'
    + '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">'
    + Object.keys(KK_PIZZA_LABELS).map(function(pk){
      return '<div><label style="font-size:11px;font-weight:600;color:#5a403c;display:block;margin-bottom:3px">' + KK_PIZZA_LABELS[pk] + '</label>'
        + '<input id="kk-f-p-' + pk + '" type="number" step="0.1" min="0" value="' + (preise[pk]||'') + '" placeholder="0.00" style="width:100%;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box"/></div>';
    }).join('')
    + '</div></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Stärken</label>'
    + '<textarea id="kk-f-staerken" rows="2" placeholder="Was machen die gut?" style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box;resize:vertical">' + escHtml(item?item.staerken||'':'') + '</textarea></div>'
    + '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Schwächen</label>'
    + '<textarea id="kk-f-schwaechen" rows="2" placeholder="Was machen die schlecht?" style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box;resize:vertical">' + escHtml(item?item.schwaechen||'':'') + '</textarea></div>'
    + '</div>'
    + '<div style="margin-bottom:16px"><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Notizen</label>'
    + '<textarea id="kk-f-notizen" rows="2" placeholder="Sonstige Beobachtungen…" style="width:100%;padding:10px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;box-sizing:border-box;resize:vertical">' + escHtml(item?item.notizen||'':'') + '</textarea></div>'
    + '<div style="display:flex;gap:10px">'
    + '<button onclick="_kkSpeichern(\'' + (id||'') + '\')" style="flex:1;background:#610000;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Speichern</button>'
    + '<button onclick="document.getElementById(\'kk-form-area\').innerHTML=\'\'" style="padding:13px 20px;background:#f3ebe9;color:#5a403c;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Abbrechen</button>'
    + '</div></div>';
  area.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function _kkSpeichern(id) {
  var name = (document.getElementById('kk-f-name')?.value||'').trim();
  if (!name) { _markField('kk-f-name', true); _showToast('Bitte Namen eingeben', 'error'); return; }
  var adresse = (document.getElementById('kk-f-adresse')?.value||'').trim();
  var bewertung = parseFloat(document.getElementById('kk-f-bew')?.value) || 0;
  var preisniveau = document.getElementById('kk-f-niveau')?.value || 'Mittel';
  var staerken = (document.getElementById('kk-f-staerken')?.value||'').trim();
  var schwaechen = (document.getElementById('kk-f-schwaechen')?.value||'').trim();
  var notizen = (document.getElementById('kk-f-notizen')?.value||'').trim();
  var preise = {};
  Object.keys(KK_PIZZA_LABELS).forEach(function(pk){
    preise[pk] = parseFloat(document.getElementById('kk-f-p-' + pk)?.value) || 0;
  });
  var list = kkLoad();
  if (id) {
    list = list.map(function(i){ return i.id === id ? { id:i.id, name:name, adresse:adresse, bewertung:bewertung, preisniveau:preisniveau, preise:preise, staerken:staerken, schwaechen:schwaechen, notizen:notizen } : i; });
  } else {
    list.push({ id:kkGenId(), name:name, adresse:adresse, bewertung:bewertung, preisniveau:preisniveau, preise:preise, staerken:staerken, schwaechen:schwaechen, notizen:notizen });
  }
  kkSave(list);
  _showToast('Konkurrent gespeichert', 'success');
  renderKonkurrenzTab();
}

function kkLoeschen(id) {
  _showConfirm('Konkurrent wirklich löschen?', function() {
    kkSave(kkLoad().filter(function(i){ return i.id !== id; }));
    _showToast('Konkurrent gelöscht', 'success');
    renderKonkurrenzTab();
  });
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — BEWERTUNGS-MANAGER
// ═══════════════════════════════════════════════════════════════
var BW_KEY = 'sc_bewertungen';
var BW_ANTWORT_TEMPLATES = [
  { l:'⭐ Positiv',      t:'Vielen herzlichen Dank für Ihre wunderbare Bewertung! Es freut uns sehr, dass Sie bei uns einen schönen Abend verbracht haben. Wir freuen uns auf Ihren nächsten Besuch in der Pizzeria San Carino!' },
  { l:'👍 Neutral',      t:'Vielen Dank für Ihr Feedback! Wir nehmen Ihre Anmerkungen gerne entgegen und arbeiten kontinuierlich daran, unser Angebot weiter zu verbessern. Wir freuen uns auf ein baldiges Wiedersehen!' },
  { l:'🙏 Negativ',      t:'Vielen Dank für Ihr ehrliches Feedback. Es tut uns sehr leid, dass wir Ihre Erwartungen diesmal nicht erfüllen konnten. Wir nehmen Ihre Kritik sehr ernst und werden uns verbessern. Gerne laden wir Sie zu einem nächsten Besuch ein.' },
  { l:'😔 Entschuldig.', t:'Wir möchten uns aufrichtig für die unangenehme Erfahrung entschuldigen. Das entspricht nicht unserem Standard. Bitte kontaktieren Sie uns direkt unter unserer Rufnummer — wir möchten das gerne wiedergutmachen.' },
  { l:'✉️ Standard',     t:'Herzlichen Dank für Ihre Bewertung! Ihr Feedback ist uns sehr wichtig. Wir freuen uns auf Ihren nächsten Besuch in der Pizzeria San Carino!' }
];
function bwTemplateInsert(idx) {
  var ta = document.getElementById('bw-f-antwortText');
  var cb = document.getElementById('bw-f-geantwortet');
  if (ta && BW_ANTWORT_TEMPLATES[idx]) {
    ta.value = BW_ANTWORT_TEMPLATES[idx].t;
    if (cb) cb.checked = true;
  }
}
var BW_PLATTFORMEN = [
  { id:'google',      label:'Google',      icon:'🔵' },
  { id:'tripadvisor', label:'TripAdvisor', icon:'🟢' },
  { id:'facebook',    label:'Facebook',    icon:'🔷' },
  { id:'instagram',   label:'Instagram',   icon:'🟣' },
  { id:'sonstige',    label:'Sonstige',    icon:'⚪' }
];
var bwFilter = { plattform:'', nurUnbeantwortet:false };

function bwLoad() {
  try { return JSON.parse(localStorage.getItem(BW_KEY) || '[]'); } catch(_) { return []; }
}
function bwSave(list) {
  try { localStorage.setItem(BW_KEY, JSON.stringify(list)); } catch(_) {}
}
function bwGenId() { return 'bw-' + Date.now() + '-' + Math.random().toString(36).slice(2,7); }
function bwPlattformLabel(id) {
  var p = BW_PLATTFORMEN.find(function(x){ return x.id === id; });
  return p ? (p.icon + ' ' + p.label) : id;
}
function bwStars(n) {
  var s = '';
  for (var i=1; i<=5; i++) s += (i<=n ? '★' : '☆');
  return s;
}

function renderBewertungenTab() {
  var panel = document.getElementById('panel-bewertungen');
  if (!panel) return;
  try {
    var list = bwLoad();

    // Filter anwenden
    var filtered = list.slice();
    if (bwFilter.plattform) filtered = filtered.filter(function(b){ return b.plattform === bwFilter.plattform; });
    if (bwFilter.nurUnbeantwortet) filtered = filtered.filter(function(b){ return !b.geantwortet; });
    // Sortierung: Datum DESC
    filtered.sort(function(a,b){ return (b.datum||'').localeCompare(a.datum||''); });

    // Statistiken
    var total = list.length;
    var avg = total ? (list.reduce(function(s,b){ return s + (b.sterne||0); },0)/total).toFixed(1) : '–';
    var unbeantwortet = list.filter(function(b){ return !b.geantwortet; }).length;
    var verteilung = [0,0,0,0,0]; // idx 0 = 1⭐
    list.forEach(function(b){ if (b.sterne>=1 && b.sterne<=5) verteilung[b.sterne-1]++; });

    // Trend: letzte 30 Tage
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    var cutoffStr = cutoff.toISOString().slice(0,10);
    var last30 = list.filter(function(b){ return (b.datum||'') >= cutoffStr; });
    var avg30 = last30.length ? (last30.reduce(function(s,b){ return s + (b.sterne||0); },0)/last30.length).toFixed(1) : '–';

    var googlePlaceId = localStorage.getItem('psc_google_place_id') || '';
    var headerBtns = '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    headerBtns += '<button onclick="bwGoogleSync()" class="ws-btn ws-btn-sm" style="display:flex;align-items:center;gap:5px" title="' + (googlePlaceId ? 'Google Bewertungen laden' : 'Zuerst Place ID in Einstellungen setzen') + '">';
    headerBtns += '<span style="font-size:15px">⭐</span>Google laden</button>';
    headerBtns += '<button onclick="bwNeu()" class="ws-btn ws-btn-primary ws-btn-sm"><span class="material-symbols-outlined">add</span>Neu</button>';
    headerBtns += '</div>';
    var html = _pageHdr('reviews', 'Bewertungs-Manager', total + ' Bewertungen · Ø ' + avg + ' ⭐', headerBtns);

    html += '<div id="bw-form-area"></div>';

    // ── Überblick-Karten ──
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px">';
    html += '<div style="background:linear-gradient(135deg,#fff8f6,#fff);border:1.5px solid #f0d8d4;border-radius:14px;padding:16px;text-align:center">';
    html += '<div style="font-size:28px;font-weight:900;color:#610000">' + total + '</div>';
    html += '<div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Gesamt</div></div>';
    html += '<div style="background:linear-gradient(135deg,#fff8e1,#fff);border:1.5px solid #ffe082;border-radius:14px;padding:16px;text-align:center">';
    html += '<div style="font-size:28px;font-weight:900;color:#f57f17">⭐ ' + avg + '</div>';
    html += '<div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Durchschnitt</div></div>';
    html += '<div style="background:linear-gradient(135deg,#e8f5e9,#fff);border:1.5px solid #a5d6a7;border-radius:14px;padding:16px;text-align:center">';
    html += '<div style="font-size:28px;font-weight:900;color:#2e7d32">⭐ ' + avg30 + '</div>';
    html += '<div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Letzte 30 Tage</div></div>';
    html += '<div style="background:linear-gradient(135deg,' + (unbeantwortet>0?'#fde8e8,#fff':'#e8f5e9,#fff') + ');border:1.5px solid ' + (unbeantwortet>0?'#f5c6c6':'#a5d6a7') + ';border-radius:14px;padding:16px;text-align:center">';
    html += '<div style="font-size:28px;font-weight:900;color:' + (unbeantwortet>0?'#c62828':'#2e7d32') + '">' + unbeantwortet + '</div>';
    html += '<div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Unbeantwortet</div></div>';
    html += '</div>';

    // ── Bewertungs-Ziel ──
    var bwZiel = parseFloat(localStorage.getItem('psc_bewertungsziel') || '4.5');
    var avgNum = parseFloat(avg) || 0;
    var zielPct = Math.min(100, avgNum > 0 ? Math.round((avgNum / bwZiel) * 100) : 0);
    var zielFarbe = avgNum >= bwZiel ? '#2e7d32' : avgNum >= bwZiel - 0.3 ? '#f57f17' : '#c62828';
    var zielStatus = avgNum >= bwZiel ? '✅ Ziel erreicht!' : (avgNum > 0 ? ('Noch ' + (bwZiel - avgNum).toFixed(1) + ' ⭐ zum Ziel') : 'Noch keine Bewertungen');
    html += '<div style="background:#fff;border:1.5px solid #e8f0fe;border-radius:14px;padding:16px 18px;margin-bottom:20px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:800;color:#1565c0">🎯 Bewertungs-Ziel</div>';
    html += '<div style="display:flex;align-items:center;gap:8px">';
    html += '<span style="font-size:12px;color:' + zielFarbe + ';font-weight:700">' + zielStatus + '</span>';
    html += '<button onclick="bwZielSetzen()" style="padding:5px 12px;border-radius:8px;border:1.5px solid #9fc3f8;background:#e8f0fe;color:#1565c0;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Ziel ändern</button>';
    html += '</div></div>';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">';
    html += '<div style="font-size:26px;font-weight:900;color:' + zielFarbe + '">' + (avgNum > 0 ? avg : '–') + '</div>';
    html += '<div style="flex:1;height:14px;background:#f0f0f0;border-radius:20px;overflow:hidden">';
    html += '<div style="height:100%;width:' + zielPct + '%;background:' + zielFarbe + ';border-radius:20px;transition:width 0.5s"></div>';
    html += '</div>';
    html += '<div style="font-size:26px;font-weight:900;color:#1565c0">Ziel: ' + bwZiel.toFixed(1) + ' ⭐</div>';
    html += '</div>';
    html += '<div style="font-size:11px;color:#8d6562">' + zielPct + '% des Ziels erreicht · Ziel: ' + bwZiel.toFixed(1) + ' ⭐ Durchschnitt</div>';
    html += '</div>';

    // ── Google Reviews Aktions-Banner ──
    if (googlePlaceId) {
      var reviewUrl = 'https://search.google.com/local/reviews?placeid=' + encodeURIComponent(googlePlaceId);
      var writeUrl  = 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(googlePlaceId);
      html += '<div id="bw-google-banner" style="background:linear-gradient(135deg,#e8f0fe,#fff);border:1.5px solid #9fc3f8;border-radius:14px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">';
      html += '<div style="display:flex;align-items:center;gap:10px">';
      html += '<span style="font-size:22px">🔵</span>';
      html += '<div><div style="font-size:13px;font-weight:700;color:#1a237e">Google Bewertungen verbunden</div>';
      html += '<div style="font-size:11px;color:#5c6bc0">Place ID: ' + escHtml(googlePlaceId.slice(0,20)) + (googlePlaceId.length>20?'…':'') + '</div></div>';
      html += '</div>';
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
      html += '<button onclick="bwGoogleSync()" id="bw-google-sync-btn" class="ws-btn ws-btn-sm" style="background:#1a73e8;color:#fff;border-color:#1a73e8"><span class="material-symbols-outlined" style="font-size:15px">sync</span>Jetzt laden</button>';
      html += '<a href="' + escHtml(reviewUrl) + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1.5px solid #9fc3f8;background:#fff;color:#1a73e8;font-size:12px;font-weight:700;text-decoration:none">📋 Alle anzeigen</a>';
      html += '<a href="' + escHtml(writeUrl) + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1.5px solid #9fc3f8;background:#fff;color:#1a73e8;font-size:12px;font-weight:700;text-decoration:none">✏️ Bewertung schreiben</a>';
      html += '</div>';
      html += '</div>';
    } else {
      html += '<div style="background:#fff8f0;border:1.5px dashed #ffe082;border-radius:14px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#7a6460">';
      html += '⭐ <strong>Google-Sync verfügbar:</strong> Google Place ID in ⚙️ Einstellungen eintragen um Bewertungen automatisch zu laden.';
      html += '</div>';
    }

    // ── Sterne-Verteilung ──
    if (total > 0) {
      html += '<div style="background:#fff;border:1.5px solid #f0d8d4;border-radius:14px;padding:16px 18px;margin-bottom:20px">';
      html += '<div style="font-size:13px;font-weight:800;color:#610000;margin-bottom:12px">📊 Sterne-Verteilung</div>';
      for (var s=5; s>=1; s--) {
        var cnt = verteilung[s-1];
        var pct = total ? Math.round(cnt/total*100) : 0;
        var color = s>=4 ? '#2e7d32' : (s===3 ? '#f57f17' : '#c62828');
        html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px">';
        html += '<div style="width:40px;color:#f57f17;font-weight:700">' + s + ' ⭐</div>';
        html += '<div style="flex:1;height:14px;background:#f5efed;border-radius:7px;overflow:hidden">';
        html += '<div style="width:' + pct + '%;height:100%;background:' + color + '"></div></div>';
        html += '<div style="width:60px;text-align:right;color:#5a403c;font-weight:600">' + cnt + ' (' + pct + '%)</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    // ── Filter ──
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">';
    html += '<select class="ws-input" style="width:auto;font-size:13px;padding:7px 12px" onchange="bwFilter.plattform=this.value;renderBewertungenTab()">';
    html += '<option value="">Alle Plattformen</option>';
    BW_PLATTFORMEN.forEach(function(p){
      html += '<option value="' + p.id + '"' + (bwFilter.plattform===p.id?' selected':'') + '>' + p.icon + ' ' + p.label + '</option>';
    });
    html += '</select>';
    html += '<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#5a403c;cursor:pointer">';
    html += '<input type="checkbox"' + (bwFilter.nurUnbeantwortet?' checked':'') + ' onchange="bwFilter.nurUnbeantwortet=this.checked;renderBewertungenTab()">';
    html += 'Nur unbeantwortete</label>';
    html += '<div style="flex:1"></div>';
    html += '<div style="font-size:12px;color:#7a6460">' + filtered.length + ' angezeigt</div>';
    html += '</div>';

    // ── Liste ──
    if (filtered.length === 0) {
      html += '<div style="text-align:center;padding:40px 20px;background:#fff;border:1.5px dashed #e3beb8;border-radius:14px">';
      html += '<span class="material-symbols-outlined" style="font-size:48px;color:#d4b5b0">reviews</span>';
      html += '<div style="margin-top:8px;font-size:14px;color:#7a6460">' + (total===0 ? 'Noch keine Bewertungen erfasst' : 'Keine Bewertungen passen zum Filter') + '</div>';
      if (total===0) html += '<button onclick="bwNeu()" class="ws-btn ws-btn-primary ws-btn-sm" style="margin-top:12px"><span class="material-symbols-outlined">add</span>Erste Bewertung</button>';
      html += '</div>';
    } else {
      html += '<div style="display:grid;gap:12px">';
      filtered.forEach(function(b){
        var starColor = b.sterne>=4 ? '#2e7d32' : (b.sterne===3 ? '#f57f17' : '#c62828');
        var borderColor = b.sterne>=4 ? '#a5d6a7' : (b.sterne===3 ? '#ffe082' : '#f5c6c6');
        var bgColor = b.sterne>=4 ? '#f1f8f2' : (b.sterne===3 ? '#fffdf5' : '#fdf5f5');
        html += '<div style="background:' + bgColor + ';border:1.5px solid ' + borderColor + ';border-radius:14px;padding:14px 16px">';
        html += '<div style="display:flex;align-items:start;gap:12px;flex-wrap:wrap">';
        html += '<div style="flex:1;min-width:200px">';
        html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap">';
        html += '<div style="font-size:18px;color:' + starColor + ';letter-spacing:2px">' + bwStars(b.sterne||0) + '</div>';
        html += '<div style="font-size:12px;color:#7a6460">' + bwPlattformLabel(b.plattform) + '</div>';
        html += '<div style="font-size:12px;color:#7a6460">· ' + (b.datum||'') + '</div>';
        if (b.geantwortet) {
          html += '<span style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:700">✓ BEANTWORTET</span>';
        } else {
          html += '<span style="background:#fde8e8;color:#c62828;border:1px solid #f5c6c6;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:700">OFFEN</span>';
        }
        html += '</div>';
        if (b.autor) html += '<div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:4px">' + escHtml(b.autor) + '</div>';
        if (b.titel) html += '<div style="font-size:13px;font-weight:600;color:#5a403c;margin-bottom:4px">' + escHtml(b.titel) + '</div>';
        if (b.text)  html += '<div style="font-size:13px;color:#5a403c;line-height:1.5;white-space:pre-wrap">' + escHtml(b.text) + '</div>';
        if (b.antwortText) {
          html += '<div style="margin-top:10px;padding:10px 12px;background:#fff;border-left:3px solid #610000;border-radius:6px">';
          html += '<div style="font-size:11px;font-weight:700;color:#610000;text-transform:uppercase;margin-bottom:4px">↪ Unsere Antwort</div>';
          html += '<div style="font-size:12px;color:#5a403c;line-height:1.5;white-space:pre-wrap">' + escHtml(b.antwortText) + '</div>';
          html += '</div>';
        }
        html += '</div>';
        html += '<div style="display:flex;flex-direction:column;gap:6px">';
        html += '<button onclick="bwEdit(\'' + b.id + '\')" class="ws-btn ws-btn-sm" title="Bearbeiten"><span class="material-symbols-outlined" style="font-size:16px">edit</span></button>';
        html += '<button onclick="bwToggleAntwort(\'' + b.id + '\')" class="ws-btn ws-btn-sm" title="Antwort-Status">' + (b.geantwortet ? '↺' : '✓') + '</button>';
        html += '<button onclick="bwLoeschen(\'' + b.id + '\')" class="ws-btn ws-btn-sm" style="color:#c62828" title="Löschen"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    panel.innerHTML = html;
  } catch(e) {
    console.error('renderBewertungenTab error:', e);
    panel.innerHTML = '<div style="padding:20px;color:#c62828">Fehler beim Laden: ' + escHtml(String(e.message||e)) + '</div>';
  }
}

