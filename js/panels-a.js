// _esc ist ein Alias von escHtml (siehe weiter unten). Beide Namen werden im Code verwendet.
function _esc(str) { return escHtml(str); }
function _safeLocalGet(key, defaultVal) {
  try { const r = localStorage.getItem(key); return r === null ? defaultVal : JSON.parse(r); } catch(_) { return defaultVal; }
}
function _safeLocalSet(key, val) {
  try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch(_) {}
}

// ═══════════════════════════════════════════════════════════════
// i18n — Mehrsprachigkeit (DE / EN / NL / AR)
// ═══════════════════════════════════════════════════════════════
const TRANSLATIONS = {
  de: {
    // Login
    'login.title': 'Pizzeria San Carino', 'login.subtitle': 'Management System',
    'login.pin': 'Schnellanmeldung', 'login.role': 'Oder Rolle wählen',
    'login.enter': 'Anmelden',
    // Navigation
    'nav.einkauf': 'Einkauf', 'nav.lager': 'Lager & Waren', 'nav.betrieb': 'Betrieb',
    'nav.team': 'Team', 'nav.analyse': 'Analyse', 'nav.business': 'Business',
    // Allgemein
    'btn.save': 'Speichern', 'btn.cancel': 'Abbrechen', 'btn.delete': 'Löschen',
    'btn.edit': 'Bearbeiten', 'btn.add': 'Hinzufügen', 'btn.close': 'Schließen',
    'btn.search': 'Suchen', 'btn.print': 'Drucken', 'btn.export': 'Exportieren',
    'btn.import': 'Importieren', 'btn.upload': 'Hochladen', 'btn.download': 'Herunterladen',
    // Panels
    'panel.produkte': 'Produkte', 'panel.einkaufsliste': 'Einkaufsliste',
    'panel.lager': 'Lager', 'panel.dienstplan': 'Dienstplan',
    'panel.mitarbeiter': 'Mitarbeiter', 'panel.kassenbuch': 'Kassenbuch',
    'panel.dashboard': 'Dashboard', 'panel.statistik': 'Statistik',
    // Meldungen
    'msg.saved': 'Gespeichert', 'msg.deleted': 'Gelöscht', 'msg.error': 'Fehler',
    'msg.loading': 'Lädt...', 'msg.nodata': 'Keine Daten', 'msg.confirm': 'Bestätigen',
    // Einstellungen
    'settings.title': 'Einstellungen', 'settings.language': 'Sprache',
    'settings.theme': 'Design', 'settings.password': 'Passwort ändern',
  },
  en: {
    'login.title': 'Pizzeria San Carino', 'login.subtitle': 'Management System',
    'login.pin': 'Quick Login', 'login.role': 'Or select role',
    'login.enter': 'Login',
    'nav.einkauf': 'Shopping', 'nav.lager': 'Stock & Goods', 'nav.betrieb': 'Operations',
    'nav.team': 'Team', 'nav.analyse': 'Analytics', 'nav.business': 'Business',
    'btn.save': 'Save', 'btn.cancel': 'Cancel', 'btn.delete': 'Delete',
    'btn.edit': 'Edit', 'btn.add': 'Add', 'btn.close': 'Close',
    'btn.search': 'Search', 'btn.print': 'Print', 'btn.export': 'Export',
    'btn.import': 'Import', 'btn.upload': 'Upload', 'btn.download': 'Download',
    'panel.produkte': 'Products', 'panel.einkaufsliste': 'Shopping List',
    'panel.lager': 'Stock', 'panel.dienstplan': 'Shift Plan',
    'panel.mitarbeiter': 'Employees', 'panel.kassenbuch': 'Cash Book',
    'panel.dashboard': 'Dashboard', 'panel.statistik': 'Statistics',
    'msg.saved': 'Saved', 'msg.deleted': 'Deleted', 'msg.error': 'Error',
    'msg.loading': 'Loading...', 'msg.nodata': 'No data', 'msg.confirm': 'Confirm',
    'settings.title': 'Settings', 'settings.language': 'Language',
    'settings.theme': 'Theme', 'settings.password': 'Change Password',
  },
  nl: {
    'login.title': 'Pizzeria San Carino', 'login.subtitle': 'Beheersysteem',
    'login.pin': 'Snelle aanmelding', 'login.role': 'Of kies een rol',
    'login.enter': 'Aanmelden',
    'nav.einkauf': 'Inkoop', 'nav.lager': 'Voorraad', 'nav.betrieb': 'Beheer',
    'nav.team': 'Team', 'nav.analyse': 'Analyse', 'nav.business': 'Business',
    'btn.save': 'Opslaan', 'btn.cancel': 'Annuleren', 'btn.delete': 'Verwijderen',
    'btn.edit': 'Bewerken', 'btn.add': 'Toevoegen', 'btn.close': 'Sluiten',
    'btn.search': 'Zoeken', 'btn.print': 'Afdrukken', 'btn.export': 'Exporteren',
    'btn.import': 'Importeren', 'btn.upload': 'Uploaden', 'btn.download': 'Downloaden',
    'panel.produkte': 'Producten', 'panel.einkaufsliste': 'Boodschappenlijst',
    'panel.lager': 'Voorraad', 'panel.dienstplan': 'Rooster',
    'panel.mitarbeiter': 'Medewerkers', 'panel.kassenbuch': 'Kasboek',
    'panel.dashboard': 'Dashboard', 'panel.statistik': 'Statistieken',
    'msg.saved': 'Opgeslagen', 'msg.deleted': 'Verwijderd', 'msg.error': 'Fout',
    'msg.loading': 'Laden...', 'msg.nodata': 'Geen gegevens', 'msg.confirm': 'Bevestigen',
    'settings.title': 'Instellingen', 'settings.language': 'Taal',
    'settings.theme': 'Thema', 'settings.password': 'Wachtwoord wijzigen',
  },
  ar: {
    'login.title': 'بيتزيريا سان كارينو', 'login.subtitle': 'نظام الإدارة',
    'login.pin': 'تسجيل دخول سريع', 'login.role': 'أو اختر دوراً',
    'login.enter': 'دخول',
    'nav.einkauf': 'تسوق', 'nav.lager': 'المخزون', 'nav.betrieb': 'العمليات',
    'nav.team': 'الفريق', 'nav.analyse': 'التحليل', 'nav.business': 'الأعمال',
    'btn.save': 'حفظ', 'btn.cancel': 'إلغاء', 'btn.delete': 'حذف',
    'btn.edit': 'تعديل', 'btn.add': 'إضافة', 'btn.close': 'إغلاق',
    'btn.search': 'بحث', 'btn.print': 'طباعة', 'btn.export': 'تصدير',
    'btn.import': 'استيراد', 'btn.upload': 'رفع', 'btn.download': 'تنزيل',
    'panel.produkte': 'المنتجات', 'panel.einkaufsliste': 'قائمة التسوق',
    'panel.lager': 'المخزون', 'panel.dienstplan': 'جدول العمل',
    'panel.mitarbeiter': 'الموظفون', 'panel.kassenbuch': 'دفتر الصندوق',
    'panel.dashboard': 'لوحة التحكم', 'panel.statistik': 'الإحصائيات',
    'msg.saved': 'تم الحفظ', 'msg.deleted': 'تم الحذف', 'msg.error': 'خطأ',
    'msg.loading': 'جارٍ التحميل...', 'msg.nodata': 'لا توجد بيانات', 'msg.confirm': 'تأكيد',
    'settings.title': 'الإعدادات', 'settings.language': 'اللغة',
    'settings.theme': 'المظهر', 'settings.password': 'تغيير كلمة المرور',
  }
};

// Aktuelle Sprache laden
let _currentLang = localStorage.getItem('psc_lang') || 'de';

// Übersetzungs-Funktion
function t(key) {
  return (TRANSLATIONS[_currentLang] || TRANSLATIONS.de)[key]
      || TRANSLATIONS.de[key]
      || key;
}

// Sprache wechseln
function setLang(lang) {
  _currentLang = lang;
  localStorage.setItem('psc_lang', lang);
  // RTL für Arabisch
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
  // App neu rendern
  const activeTab = document.querySelector('[data-active-tab]')?.dataset.activeTab;
  if (activeTab) switchTab(activeTab);
  _showToast({ de:'🌍 Sprache geändert', en:'🌍 Language changed', nl:'🌍 Taal gewijzigd', ar:'🌍 تم تغيير اللغة' }[lang] || '🌍', 'success');
}

// RTL beim Start setzen
if (_currentLang === 'ar') {
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'ar');
}

// ═══════════════════════════════════════════════════════════════
// Restaurant-Config (White-Label)
// ═══════════════════════════════════════════════════════════════
const PSC_DEFAULTS = {
  name: 'Pizzeria San Carino',
  short_name: 'San Carino',
  adresse: 'Wien, Österreich',
  telefon: '',
  logo: '🍕',
  farbe: '#8B0000',
  farbe_dark: '#4a0000',
};

function getRestaurantConfig() {
  try { return Object.assign({}, PSC_DEFAULTS, JSON.parse(localStorage.getItem('psc_restaurant') || '{}')); }
  catch(_) { return { ...PSC_DEFAULTS }; }
}
function saveRestaurantConfig(cfg) {
  localStorage.setItem('psc_restaurant', JSON.stringify(cfg));
}
function getRConfig(key) { return getRestaurantConfig()[key] || PSC_DEFAULTS[key]; }

// White-Label Farbe als CSS-Variable setzen
function applyRestaurantBranding() {
  const cfg = getRestaurantConfig();
  document.documentElement.style.setProperty('--brand', cfg.farbe);
  document.documentElement.style.setProperty('--brand-dark', cfg.farbe_dark || cfg.farbe);
  // Login-Screen aktualisieren
  const nameEl = document.getElementById('login-restaurant-name');
  if (nameEl) nameEl.textContent = cfg.name;
  const logoEl = document.getElementById('login-logo-emoji');
  if (logoEl) logoEl.textContent = cfg.logo;
  const logoBox = document.getElementById('login-logo-box');
  if (logoBox) logoBox.style.background = `linear-gradient(145deg,${cfg.farbe},${cfg.farbe_dark||cfg.farbe})`;
  // Seiten-Titel
  document.title = cfg.name;
}

// Setup-Wizard — zeigt beim ersten Start
function checkSetupWizard() {
  if (localStorage.getItem('psc_setup_done')) return;
  setTimeout(showSetupWizard, 1200);
}

function showSetupWizard() {
  const existing = document.getElementById('setup-wizard-modal');
  if (existing) existing.remove();
  const cfg = getRestaurantConfig();
  const modal = document.createElement('div');
  modal.id = 'setup-wizard-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:32px;max-width:480px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:8px">🎉</div>
        <h2 style="font-size:20px;font-weight:800;color:#1a0404;margin:0 0 6px">Willkommen!</h2>
        <p style="font-size:13px;color:#7a6460;margin:0">Richte dein Restaurant ein — dauert nur 1 Minute</p>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:6px">🏪 Restaurantname</label>
        <input id="sw-name" type="text" value="${cfg.name}" placeholder="z.B. Pizzeria Bella Italia"
          style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;color:#261816;box-sizing:border-box;outline:none"
          onfocusin="this.style.borderColor='#8B0000'" onblur="this.style.borderColor='#e3beb8'"/>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:6px">📍 Adresse</label>
        <input id="sw-adresse" type="text" value="${cfg.adresse}" placeholder="z.B. Mariahilfer Str. 1, 1060 Wien"
          style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;color:#261816;box-sizing:border-box;outline:none"
          onfocusin="this.style.borderColor='#8B0000'" onblur="this.style.borderColor='#e3beb8'"/>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:6px">📞 Telefon</label>
        <input id="sw-telefon" type="tel" value="${cfg.telefon}" placeholder="z.B. +43 1 234 5678"
          style="width:100%;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;color:#261816;box-sizing:border-box;outline:none"
          onfocusin="this.style.borderColor='#8B0000'" onblur="this.style.borderColor='#e3beb8'"/>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:6px">🎨 Logo (Emoji)</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${['🍕','🍝','🥗','🍔','🌮','🍜','🍣','🥩','🍗','🥐','🍺','☕'].map(e =>
            `<button onclick="document.getElementById('sw-logo').value='${e}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.background='#f5f5f5');this.style.background='#fde8e8'"
              style="padding:8px;border:1.5px solid #e3beb8;border-radius:8px;font-size:20px;cursor:pointer;background:${cfg.logo===e?'#fde8e8':'#f5f5f5'}">${e}</button>`
          ).join('')}
        </div>
        <input id="sw-logo" type="text" value="${cfg.logo}" placeholder="Emoji eingeben"
          style="width:100%;padding:8px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:20px;margin-top:8px;box-sizing:border-box;outline:none"/>
      </div>

      <div style="margin-bottom:24px">
        <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:6px">🎨 Hauptfarbe</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          ${[['#8B0000','Dunkelrot'],['#1565C0','Blau'],['#2E7D32','Grün'],['#E65100','Orange'],['#6A1B9A','Lila'],['#37474F','Anthrazit']].map(([c,l]) =>
            `<button onclick="document.getElementById('sw-farbe').value='${c}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.outline='none');this.style.outline='3px solid #333'"
              title="${l}" style="width:36px;height:36px;border-radius:50%;border:none;background:${c};cursor:pointer;outline:${cfg.farbe===c?'3px solid #333':'none'}"></button>`
          ).join('')}
        </div>
        <input id="sw-farbe" type="color" value="${cfg.farbe}"
          style="width:100%;height:40px;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;padding:4px"/>
      </div>

      <div style="display:flex;gap:10px">
        <button onclick="swSpeichern()" style="flex:1;padding:14px;border:none;border-radius:14px;background:#8B0000;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit">
          ✅ Einrichtung abschließen
        </button>
      </div>
      <p style="text-align:center;font-size:11px;color:#9e6b62;margin:12px 0 0">Diese Einstellungen können jederzeit in ⚙️ Einstellungen geändert werden</p>
    </div>`;
  document.body.appendChild(modal);
}

function swSpeichern() {
  const cfg = {
    name: document.getElementById('sw-name').value.trim() || PSC_DEFAULTS.name,
    adresse: document.getElementById('sw-adresse').value.trim(),
    telefon: document.getElementById('sw-telefon').value.trim(),
    logo: document.getElementById('sw-logo').value.trim() || '🍕',
    farbe: document.getElementById('sw-farbe').value || '#8B0000',
    farbe_dark: document.getElementById('sw-farbe').value || '#4a0000',
    short_name: (document.getElementById('sw-name').value.trim() || PSC_DEFAULTS.name).split(' ').pop(),
  };
  saveRestaurantConfig(cfg);
  localStorage.setItem('psc_setup_done', '1');
  document.getElementById('setup-wizard-modal')?.remove();
  applyRestaurantBranding();
  _showToast('✅ Restaurant eingerichtet: ' + cfg.name, 'success');
}

// Sync-fähiges localStorage schreiben
const SYNC_KEYS = [
  // Betrieb & Lager
  'pizzeria_lager', 'pizzeria_bestellung', 'pizzeria_fehlmaterial',
  'pizzeria_aufgaben', 'pizzeria_mitarbeiter', 'pizzeria_wochenplan',
  'pizzeria_dienstplan', 'pizzeria_schichtcheck', 'pizzeria_notifications',
  // Kasse & Buchhaltung
  'pizzeria_kassenbuch', 'pizzeria_kassenschnitt', 'pizzeria_tagesberichte',
  'pizzeria_umsatz_einnahmen', 'pizzeria_umsatz_ausgaben',
  'pizzeria_statistik', 'pizzeria_wareneinsatz',
  // Stammdaten
  'pizzeria_produkte', 'pizzeria_lieferanten', 'pizzeria_rezepte',
  'pizzeria_preisalarm_rules', 'pizzeria_custom_deals', 'pizzeria_verlauf',
  // Einstellungen
  'psc_schichtzeiten', 'psc_monatsziel', 'psc_drucker_ip', 'psc_drucker_port',
  'psc_pizza_groessen', 'psc_mindest_defaults', 'psc_personal_alarm_pct',
  'psc_haccp', 'psc_haccp_geraete', 'psc_mhd',
  'biz_fixkosten'
];

function _syncedLocalSet(key, val) {
  const json = typeof val === 'string' ? val : JSON.stringify(val);
  try { localStorage.setItem(key, json); } catch(_) {}
  if (typeof syncManager !== 'undefined' && SYNC_KEYS && SYNC_KEYS.includes(key)) {
    var data;
    if (typeof val === 'string') {
      try { data = JSON.parse(val); } catch(_) { data = val; }
    } else {
      data = val;
    }
    syncManager.send(key, data);
  }
}

// ========== SYNC MANAGER ==========
const syncManager = {
  ws: null,
  connected: false,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  pendingQueue: [],

  init: function() {
    this.connect();
    window.addEventListener('online', () => this.connect());
    window.addEventListener('offline', () => this.updateStatus('offline'));
  },

  connect: async function() {
    if (!location.host) return;
    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      let token = '';
      try {
        const r = await fetch('/api/ws-token');
        if (r.ok) { const d = await r.json(); token = d.token || ''; }
        else { console.warn('[WS] Token-Fetch Status:', r.status); }
      } catch(e) { console.warn('[WS] Token-Fetch fehlgeschlagen:', e.message); }
      const url = protocol + '//' + location.host + '/ws/sync?token=' + token;
      this.ws = new WebSocket(url);
      this.updateStatus('connecting');

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectDelay = 1000;
        this.updateStatus('connected');
        console.log('🔗 Sync verbunden');
        this.ws.send(JSON.stringify({ action: 'sync_request' }));

        if (this.pendingQueue.length > 0) {
          this.ws.send(JSON.stringify({
            action: 'bulk_update',
            updates: this.pendingQueue,
            user: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.username : 'unknown'
          }));
          this.pendingQueue = [];
          try { localStorage.removeItem('pizzeria_sync_queue'); } catch(_) {}
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.action === 'sync_response') {
            let count = 0;
            for (const key of Object.keys(msg.data)) {
              const entry = msg.data[key];
              if (SYNC_KEYS.includes(key) && entry.data !== undefined) {
                const localRaw = localStorage.getItem(key);
                const serverJson = JSON.stringify(entry.data);
                if (localRaw !== serverJson) {
                  localStorage.setItem(key, serverJson);
                  this.refreshUI(key);
                  count++;
                }
              }
            }
            if (count > 0) {
              console.log('📥 ' + count + ' Keys synchronisiert');
              if (typeof _showToast === 'function') _showToast(count + ' Bereiche synchronisiert');
            }
          }

          if (msg.action === 'remote_update') {
            if (SYNC_KEYS.includes(msg.key) && msg.data !== undefined) {
              localStorage.setItem(msg.key, JSON.stringify(msg.data));
              this.refreshUI(msg.key);
              console.log('📥 Remote: ' + msg.key + ' (von ' + (msg.updatedBy || '?') + ')');
            }
          }

          // ── Inbox: neue Datei erkannt ──
          if (msg.type === 'inbox_update' && msg.entry) {
            _inboxOnNewFile(msg.entry);
          }
        } catch (e) {
          console.error('Sync Parse-Fehler:', e);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.updateStatus('offline');
        setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
          this.connect();
        }, this.reconnectDelay);
      };

      this.ws.onerror = () => { this.connected = false; };
    } catch (e) {
      console.error('Sync fehlgeschlagen:', e);
      this.updateStatus('offline');
    }
  },

  send: function(key, data) {
    const msg = {
      action: 'update', key: key, data: data,
      timestamp: Date.now(),
      user: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.username : 'unknown'
    };
    if (this.connected && this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.pendingQueue.push(msg);
      try { localStorage.setItem('pizzeria_sync_queue', JSON.stringify(this.pendingQueue)); } catch(_) {}
    }
  },

  refreshUI: function(key) {
    const map = {
      'pizzeria_lager': 'renderLagerTab',
      'pizzeria_bestellung': 'renderBestellTab',
      'pizzeria_fehlmaterial': 'renderFMTab',
      'pizzeria_aufgaben': 'renderAufgabenListe',
      'pizzeria_mitarbeiter': 'renderPersonalTab',
      'pizzeria_wochenplan': 'renderDienstplanTab',
      'pizzeria_dienstplan': 'renderDienstplanTab',
      'pizzeria_schichtcheck': 'renderChecklistTab',
      'pizzeria_notifications': 'notifUpdateBadge',
      'pizzeria_kassenbuch': 'renderKassenbuchTab',
      'pizzeria_kassenschnitt': 'renderKassenschnittTab',
      'pizzeria_tagesberichte': 'renderBusinessTab',
      'pizzeria_umsatz_einnahmen': 'renderUmsatzTab',
      'pizzeria_umsatz_ausgaben': 'renderUmsatzTab',
      'pizzeria_statistik': 'renderStatistikTab',
      'pizzeria_wareneinsatz': 'renderWareneinsatzTab',
      'pizzeria_produkte': 'renderProdukteTab',
      'pizzeria_lieferanten': 'renderLieferantenTab',
      'pizzeria_rezepte': 'renderSpeisekarteTab',
      'pizzeria_preisalarm_rules': 'renderPreisalarmTab',
      'pizzeria_verlauf': 'renderVerlaufTab'
    };
    const fnName = map[key];
    if (fnName && typeof window[fnName] === 'function') {
      try { window[fnName](); } catch(e) { console.warn('Refresh-Fehler ' + key + ':', e); }
    }
    if (typeof renderDashboardTab === 'function') {
      try { renderDashboardTab(); } catch(_) {}
    }
  },

  updateStatus: function(status) {
    const el = document.getElementById('sync-status');
    if (!el) return;
    const m = {
      connected: { icon: '🟢', text: 'Live' },
      connecting: { icon: '🟡', text: '...' },
      offline: { icon: '🔴', text: 'Offline' }
    };
    const s = m[status] || m.offline;
    el.textContent = s.icon + ' ' + s.text;
  }
};

// Offline-Queue wiederherstellen
try {
  const sq = localStorage.getItem('pizzeria_sync_queue');
  if (sq) syncManager.pendingQueue = JSON.parse(sq);
} catch(_) {}

function _pageHdr(icon, title, sub, actionHtml) {
  return '<div class="page-hdr">' +
    '<div class="page-hdr-icon"><span class="material-symbols-outlined">' + icon + '</span></div>' +
    '<div style="flex:1;min-width:0"><div class="page-hdr-title">' + title + '</div>' +
    (sub ? '<div class="page-hdr-sub">' + sub + '</div>' : '') +
    '</div>' +
    (actionHtml ? '<div class="page-hdr-right">' + actionHtml + '</div>' : '') +
    '</div>';
}
// ═══════════════════════════════════════════════════════════════
// js/config.js
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// API KEY — hier deinen Anthropic API Key eintragen
// ═══════════════════════════════════════════════════════════════
let ANTHROPIC_API_KEY = '';
try { ANTHROPIC_API_KEY = localStorage.getItem('pizzeria_api_key') || ''; } catch(e) { console.warn('API-Key Fehler:', e); }

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const PRODUCTS = [
  // ── Grundzutaten ──────────────────────────────────────────────────────────
  { id: 'mehl',             name: 'Pizzamehl Tipo 00',              category: 'Grundzutaten', unit: 'kg',    currentStock: 1.5, minStock: 5,  orderQuantity: 10 },
  { id: 'tomaten',          name: 'San Marzano Tomaten',            category: 'Grundzutaten', unit: 'Dosen', currentStock: 3,   minStock: 10, orderQuantity: 24 },
  { id: 'olivenoel',        name: 'Olivenöl Extra Vergine',         category: 'Grundzutaten', unit: 'Liter', currentStock: 1.2, minStock: 3,  orderQuantity: 5  },
  { id: 'hefe',             name: 'Frische Hefe',                   category: 'Grundzutaten', unit: 'Päck.', currentStock: 15,  minStock: 10, orderQuantity: 20 },
  { id: 'pizzablock',       name: 'Pizzablock EXPORT 5kg',          category: 'Grundzutaten', unit: 'kg',    currentStock: 0,   minStock: 10, orderQuantity: 15 },
  { id: 'pizza_sauce',      name: 'Campino Pizza Sauce 5/1',        category: 'Grundzutaten', unit: 'Dosen', currentStock: 0,   minStock: 3,  orderQuantity: 6  },
  // ── Käse ──────────────────────────────────────────────────────────────────
  { id: 'mozzarella',       name: 'Mozzarella di Bufala',           category: 'Käse',         unit: 'kg',    currentStock: 0.8, minStock: 4,  orderQuantity: 5  },
  { id: 'mozzarella_stange',name: 'Mozzarella Stange 45% FIT 1kg', category: 'Käse',         unit: 'Pkg',   currentStock: 0,   minStock: 4,  orderQuantity: 6  },
  { id: 'parmesan',         name: 'Parmigiano Reggiano',            category: 'Käse',         unit: 'kg',    currentStock: 0.3, minStock: 1,  orderQuantity: 2  },
  { id: 'cheddar',          name: 'Cheddar in Scheiben 1000g',      category: 'Käse',         unit: 'Pkg',   currentStock: 0,   minStock: 2,  orderQuantity: 3  },
  { id: 'boereklik',        name: 'OBA Kombi Böreklik Weiß 4kg',   category: 'Käse',         unit: 'Ktn',   currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  // ── Belag ─────────────────────────────────────────────────────────────────
  { id: 'salami',           name: 'Salami Milano',                  category: 'Belag',        unit: 'kg',    currentStock: 0.4, minStock: 2,  orderQuantity: 3  },
  { id: 'salami_gesch',     name: 'Salami geschnitten 65cm ca.1kg', category: 'Belag',        unit: 'kg',    currentStock: 0,   minStock: 3,  orderQuantity: 5  },
  { id: 'bacon_gastro',     name: 'Gastro Bacon Hochreiter gesch.', category: 'Belag',        unit: 'kg',    currentStock: 0,   minStock: 2,  orderQuantity: 3  },
  { id: 'peperoni',         name: 'Peperoni',                       category: 'Belag',        unit: 'kg',    currentStock: 0.2, minStock: 1.5,orderQuantity: 2  },
  // ── Fleisch & Fleisch TK ──────────────────────────────────────────────────
  { id: 'doener',           name: 'Döner Kebap geschnitten 1kg',    category: 'Fleisch',      unit: 'Pkg',   currentStock: 0,   minStock: 3,  orderQuantity: 5  },
  { id: 'cevapcici',        name: 'Cevapcici 800g TK',              category: 'Fleisch TK',   unit: 'Pkg',   currentStock: 0,   minStock: 3,  orderQuantity: 6  },
  { id: 'huehnerbrust_tk',  name: 'Hühnerbrustfilet TK ca.1kg',    category: 'Fleisch TK',   unit: 'kg',    currentStock: 0,   minStock: 5,  orderQuantity: 10 },
  // ── Beilagen & Beilagen TK ───────────────────────────────────────────────
  { id: 'kartoffelsalat',   name: 'Kartoffelsalat 10kg Wienerart',  category: 'Beilagen',     unit: 'Kübel', currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  { id: 'potato_wedges',    name: 'Aviko Potato Wedges 2.5kg TK',  category: 'Beilagen TK',  unit: 'Pkg',   currentStock: 0,   minStock: 4,  orderQuantity: 8  },
  { id: 'pommes_kebab',     name: 'Aviko Pommes Kebab 9.5mm 2.5kg',category: 'Beilagen TK',  unit: 'Pkg',   currentStock: 0,   minStock: 4,  orderQuantity: 8  },
  // ── Gemüse & Gemüse TK ───────────────────────────────────────────────────
  { id: 'champignons_fr',   name: 'Champignon mittel 3kg Frisch',   category: 'Gemüse',       unit: 'kiste', currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  { id: 'karfiol_tk',       name: 'Ardo Karfiol/Blumenkohl 2.5kg',  category: 'Gemüse TK',    unit: 'Pkg',   currentStock: 0,   minStock: 1,  orderQuantity: 3  },
  { id: 'erbsen_tk',        name: 'Ardo Markerbsen mittelfein 2.5kg',category:'Gemüse TK',    unit: 'Pkg',   currentStock: 0,   minStock: 1,  orderQuantity: 3  },
  // ── Konserven ─────────────────────────────────────────────────────────────
  { id: 'artischocken',     name: 'Adria Artischocken Herzen 2650ml',category:'Konserven',    unit: 'Dosen', currentStock: 0,   minStock: 2,  orderQuantity: 4  },
  { id: 'thunfisch_dose',   name: 'Adria Thunfisch in Öl 1705g',    category: 'Konserven',    unit: 'Dosen', currentStock: 0,   minStock: 3,  orderQuantity: 6  },
  // ── Saucen & Dips ─────────────────────────────────────────────────────────
  { id: 'hamburger_sauce',  name: 'Develey Hamburger Sauce 875ml',  category: 'Saucen',       unit: 'PFl',   currentStock: 0,   minStock: 3,  orderQuantity: 6  },
  { id: 'tartare_port',     name: 'Senna Tartare Portionen 80x25g', category: 'Saucen',       unit: 'Ktn',   currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  { id: 'ketchup_port',     name: 'Senna Ketchup Portionen 100x20g',category: 'Saucen',      unit: 'Ktn',   currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  { id: 'mayo_port',        name: 'Senna Mayo Portionen 100x15g',   category: 'Saucen',       unit: 'Ktn',   currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  // ── Reis & Nudeln ─────────────────────────────────────────────────────────
  { id: 'basmati_reis',     name: 'Mahmood Basmati Reis 4.5kg',     category: 'Reis & Nudeln',unit: 'Stk',   currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  { id: 'gnocchi',          name: 'Piacelli Gnocchi 1000g',         category: 'Reis & Nudeln',unit: 'Pkg',   currentStock: 0,   minStock: 6,  orderQuantity: 12 },
  { id: 'spaghetti',        name: 'Barilla Spaghetti 5kg No.5',     category: 'Reis & Nudeln',unit: 'Pkg',   currentStock: 0,   minStock: 3,  orderQuantity: 6  },
  // ── Brot ──────────────────────────────────────────────────────────────────
  { id: 'hamburger_brot',   name: 'Giant XL Hamburger Brot 16St TK',category: 'Brot',        unit: 'Ktn',   currentStock: 0,   minStock: 2,  orderQuantity: 4  },
  // ── Getränke ──────────────────────────────────────────────────────────────
  { id: 'fuzetea_zitrone',  name: 'Fuzetea Zitrone 12x0.5L',        category: 'Getränke',     unit: 'Tray',  currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  { id: 'fuzetea_pfirsich', name: 'Fuzetea Pfirsich 12x0.5L',       category: 'Getränke',     unit: 'Tray',  currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  // ── Dessert ───────────────────────────────────────────────────────────────
  { id: 'vanillesauce',     name: 'Debic Vanillesauce 2L',           category: 'Dessert',      unit: 'PFl',   currentStock: 0,   minStock: 2,  orderQuantity: 3  },
  { id: 'eierbiskotten',    name: 'Manner Eierbiskotten 2.4kg',      category: 'Dessert',      unit: 'Ktn',   currentStock: 0,   minStock: 1,  orderQuantity: 2  },
  // ── Gewürze ───────────────────────────────────────────────────────────────
  { id: 'basilikum',        name: 'Frischer Basilikum',              category: 'Gewürze',      unit: 'Bund',  currentStock: 2,   minStock: 5,  orderQuantity: 10 },
  { id: 'salz',             name: 'Meersalz',                        category: 'Gewürze',      unit: 'kg',    currentStock: 3,   minStock: 2,  orderQuantity: 5  },
];

const SHOPS = [
  { id: 'metro',        name: 'Metro',            type: 'Großhandel',      color: '#003DA5' },
  { id: 'billa',        name: 'Billa',            type: 'Supermarkt',      color: '#ed1c24' },
  { id: 'lidl',         name: 'Lidl',             type: 'Discounter',      color: '#0050AA' },
  { id: 'spar',         name: 'Spar',             type: 'Supermarkt',      color: '#007f3e' },
  { id: 'umtrade',      name: 'UM Trade GmbH',    type: 'Großhandel',      color: '#cc0000' },
  { id: 'essamshehata', name: 'Essam Shehata KG', type: 'Direktlieferant', color: '#f57c00' },
];

// pricePerUnit indexed as PRICE_MAP[shopId][productId]
// Wird beim Start aus SQLite geladen + beim Rechnung-Scan befüllt
const PRICE_MAP = {
  // Metro Gastro-Großhandel (Gastro-Einkaufspreise AT, April 2026)
  metro: {
    mehl:             0.89,  // kg  Pizzamehl Tipo 00
    tomaten:          1.59,  // Dose San Marzano 400g
    olivenoel:        4.99,  // L   Extra Vergine
    hefe:             0.45,  // Päck. Frische Hefe 42g
    pizzablock:       5.49,  // kg  Pizzablock EXPORT
    pizza_sauce:      6.99,  // Dose Campino 5/1
    mozzarella:       9.90,  // kg  Mozzarella di Bufala
    mozzarella_stange:7.49,  // Pkg Mozzarella Stange 1kg
    parmesan:        13.90,  // kg  Parmigiano Reggiano
    cheddar:          9.49,  // Pkg Cheddar 1000g
    boereklik:       18.99,  // Ktn Böreklik 4kg
    salami:           7.19,  // kg  Salami Milano
    salami_gesch:     7.19,  // kg  Salami geschnitten
    bacon_gastro:     9.49,  // kg  Bacon Hochreiter
    peperoni:         4.99,  // kg  Peperoni
    doener:           9.49,  // Pkg Döner 1kg
    cevapcici:       10.49,  // Pkg Cevapcici 800g
    huehnerbrust_tk:  6.49,  // kg  Hühnerbrust TK
    kartoffelsalat:  31.99,  // Kübel Kartoffelsalat 10kg
    potato_wedges:    2.19,  // Pkg Potato Wedges 2.5kg
    pommes_kebab:     2.09,  // Pkg Pommes Kebab 2.5kg
    champignons_fr:   9.99,  // kiste Champignon 3kg
    karfiol_tk:       1.79,  // Pkg Karfiol 2.5kg TK
    erbsen_tk:        1.99,  // Pkg Erbsen 2.5kg TK
    artischocken:     9.19,  // Dose Artischocken 2650ml
    thunfisch_dose:   8.99,  // Dose Thunfisch 1705g
    hamburger_sauce:  4.99,  // PFl Hamburger Sauce 875ml
    tartare_port:    11.49,  // Ktn Tartare Portionen
    ketchup_port:     9.49,  // Ktn Ketchup Portionen
    mayo_port:        9.49,  // Ktn Mayo Portionen
    basmati_reis:    15.49,  // Stk Basmati Reis 4.5kg
    gnocchi:          2.69,  // Pkg Gnocchi 1000g
    spaghetti:        7.99,  // Pkg Spaghetti 5kg
    hamburger_brot:   9.49,  // Ktn Hamburger Brot 16St
    fuzetea_zitrone:  6.60,  // Tray 12x0.5L
    fuzetea_pfirsich: 6.60,  // Tray 12x0.5L
    vanillesauce:     8.49,  // PFl Vanillesauce 2L
    eierbiskotten:   20.49,  // Ktn Eierbiskotten 2.4kg
    basilikum:        0.99,  // Bund Frischer Basilikum
  },
  // Billa Supermarkt (Consumer-Preise AT, April 2026)
  billa: {
    mehl:             1.29,  // kg  W480 Tipo 00
    tomaten:          1.99,  // Dose Pelati 400g
    olivenoel:        5.99,  // L   Extra Vergine
    hefe:             0.79,  // Päck. Frische Hefe 42g
    mozzarella:      10.99,  // kg  (2x125g = 1.49 → ~€5.96/kg, aber hier Block)
    parmesan:        15.99,  // kg  Parmesan gerieben
    salami:           9.99,  // kg  Salami aufschnitt
    peperoni:         6.99,  // kg  Peperoni frisch
    champignons_fr:   3.99,  // kiste 500g-Schale (kleinere Packung)
    karfiol_tk:       2.49,  // Pkg TK Blumenkohl 500g
    erbsen_tk:        2.19,  // Pkg TK Erbsen 450g
    thunfisch_dose:   1.89,  // Dose Thunfisch 185g
    gnocchi:          1.99,  // Pkg Gnocchi 500g
    spaghetti:        2.99,  // Pkg Spaghetti 500g
    hamburger_sauce:  3.49,  // PFl 875ml
    basilikum:        1.29,  // Bund Basilikum
  },
  // Lidl Discounter (Aktionspreise AT, April 2026)
  lidl: {
    mehl:             0.79,  // kg  Tipo 00
    tomaten:          1.49,  // Dose Pelati 400g
    olivenoel:        4.49,  // L   Extra Vergine
    hefe:             0.65,  // Päck. Frische Hefe
    mozzarella:       9.49,  // kg  Mozzarella Block
    parmesan:        13.99,  // kg  Parmigiano
    salami:           8.99,  // kg  Salami
    peperoni:         5.49,  // kg  Peperoni
    karfiol_tk:       1.99,  // Pkg TK Karfiol 500g
    erbsen_tk:        1.79,  // Pkg TK Erbsen
    gnocchi:          1.79,  // Pkg Gnocchi 500g
    spaghetti:        2.69,  // Pkg Spaghetti 500g
    hamburger_sauce:  2.99,  // PFl Hamburger Sauce
    basilikum:        0.89,  // Bund Basilikum
  },
  spar:  {},
  // UM Trade GmbH — Rechnung Nr. 93722 vom 25.03.2026 (Preise pro Einheit)
  umtrade: {
    pizzablock:        4.99,  // kg  — ArtNr 6090
    salami_gesch:      6.19,  // kg  — ArtNr 3130
    salami:            6.19,  // kg  — ArtNr 3130 (gleicher Preis wie salami_gesch)
    bacon_gastro:      8.99,  // kg  — ArtNr 5175
    mozzarella_stange: 6.99,  // Pkg — ArtNr 2106
    cheddar:           8.99,  // Pkg — ArtNr 5182
    kartoffelsalat:   30.59,  // Kübel— ArtNr 2269
    vanillesauce:      8.19,  // PFl — ArtNr 3132
    cevapcici:         9.99,  // Pkg — ArtNr 4847
    doener:            8.99,  // Pkg — ArtNr 2516
    huehnerbrust_tk:   6.09,  // kg  — ArtNr 4881
    hamburger_brot:    8.99,  // Ktn — ArtNr 2387
    boereklik:        17.99,  // Ktn — ArtNr 6096
    potato_wedges:     1.99,  // /kg — ArtNr 2306
    pommes_kebab:      1.89,  // /kg — ArtNr 2710
    karfiol_tk:        1.69,  // /kg — ArtNr 2098
    erbsen_tk:         1.89,  // /kg — ArtNr 2129
    hamburger_sauce:   4.69,  // PFl — ArtNr 4706
    artischocken:      8.79,  // Dosen— ArtNr 2822
    basmati_reis:     14.90,  // Stk — ArtNr 6374
    tartare_port:     10.99,  // Ktn — ArtNr 4341
    ketchup_port:      8.99,  // Ktn — ArtNr 4837
    mayo_port:         8.99,  // Ktn — ArtNr 4343
    fuzetea_zitrone:   0.55,  // /PFl— ArtNr 4776
    fuzetea_pfirsich:  0.55,  // /PFl— ArtNr 4775
    pizza_sauce:       6.49,  // Dosen— ArtNr 2906
    thunfisch_dose:    8.59,  // Dosen— ArtNr 2026
    gnocchi:           2.49,  // Pkg — ArtNr 2231
    spaghetti:         7.59,  // Pkg — ArtNr 2256
    eierbiskotten:    19.99,  // Ktn — ArtNr 2056
    champignons_fr:    9.19,  // kiste— ArtNr 3538
  },
};

// Weekly deals — wird automatisch via Angebote-Tab / Upload befüllt
const DEALS = [];

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

// ── Einmalig: Rechnung Nr. 93722 (UM Trade, 25.03.2026) in Historie laden ──
(function() {
  const FLAG = 'invoice_umtrade_93722_imported';
  if (localStorage.getItem(FLAG)) return;
  const items = [
    { produktName:'Pizzablock EXPORT 5kg',          produktId:'pizzablock',       menge:14.885,einheit:'kg',    preis:4.99  },
    { produktName:'Salami geschnitten 65cm ca.1kg', produktId:'salami_gesch',     menge:4.1,   einheit:'kg',    preis:6.19  },
    { produktName:'Gastro Bacon Hochreiter gesch.', produktId:'bacon_gastro',     menge:2.994, einheit:'kg',    preis:8.99  },
    { produktName:'Goldsteig Mozzarella Stange 1kg',produktId:'mozzarella_stange',menge:2,     einheit:'Pkg',   preis:6.99  },
    { produktName:'SARAY Cheddar Scheiben 1000g',   produktId:'cheddar',          menge:1,     einheit:'Pkg',   preis:8.99  },
    { produktName:'BL Kartoffelsalat 10kg Wienerart',produktId:'kartoffelsalat',  menge:1,     einheit:'Kübel', preis:30.59 },
    { produktName:'Debic Vanillesauce 2L',          produktId:'vanillesauce',     menge:1,     einheit:'PFl',   preis:8.19  },
    { produktName:'Brajlovic Cevapcici 800g TK',    produktId:'cevapcici',        menge:3,     einheit:'Pkg',   preis:9.99  },
    { produktName:'Döner Kebap geschnitten 1kg',    produktId:'doener',           menge:3,     einheit:'Pkg',   preis:8.99  },
    { produktName:'Hühnerbrustfilet TK ca.1kg',     produktId:'huehnerbrust_tk',  menge:10,    einheit:'kg',    preis:6.09  },
    { produktName:'Giant XL Hamburger Brot 16St TK',produktId:'hamburger_brot',   menge:2,     einheit:'Ktn',   preis:8.99  },
    { produktName:'OBA Kombi Böreklik Weiß 4kg',   produktId:'boereklik',        menge:1,     einheit:'Ktn',   preis:17.99 },
    { produktName:'Aviko Potato Wedges Gew. 2.5kg', produktId:'potato_wedges',    menge:4,     einheit:'Pkg',   preis:1.99  },
    { produktName:'Aviko Pommes Kebab 9.5mm 2.5kg', produktId:'pommes_kebab',     menge:4,     einheit:'Pkg',   preis:1.89  },
    { produktName:'Ardo Karfiol/Blumenkohl 2.5kg',  produktId:'karfiol_tk',       menge:1,     einheit:'Pkg',   preis:1.69  },
    { produktName:'Ardo Markerbsen mittelfein 2.5kg',produktId:'erbsen_tk',       menge:1,     einheit:'Pkg',   preis:1.89  },
    { produktName:'Develey Hamburger Sauce 875ml',  produktId:'hamburger_sauce',  menge:3,     einheit:'PFl',   preis:4.69  },
    { produktName:'Adria Artischocken Herzen 2650ml',produktId:'artischocken',    menge:1,     einheit:'Dosen', preis:8.79  },
    { produktName:'Mahmood Basmati Reis 4.5kg',     produktId:'basmati_reis',     menge:1,     einheit:'Stk',   preis:14.90 },
    { produktName:'Senna Sauce Tartare 80x25g',     produktId:'tartare_port',     menge:1,     einheit:'Ktn',   preis:10.99 },
    { produktName:'Senna Ketchup Portionen 100x20g',produktId:'ketchup_port',     menge:1,     einheit:'Ktn',   preis:8.99  },
    { produktName:'Senna Mayonnaise 50% 100x15g',   produktId:'mayo_port',        menge:1,     einheit:'Ktn',   preis:8.99  },
    { produktName:'Fuzetea Zitrone 12x0.5L',        produktId:'fuzetea_zitrone',  menge:1,     einheit:'Tray',  preis:0.55  },
    { produktName:'Fuzetea Pfirsich 12x0.5L',       produktId:'fuzetea_pfirsich', menge:1,     einheit:'Tray',  preis:0.55  },
    { produktName:'Campino Pizza Sauce 5/1',         produktId:'pizza_sauce',      menge:3,     einheit:'Dosen', preis:6.49  },
    { produktName:'Adria Thunfisch in Öl 1705g',    produktId:'thunfisch_dose',   menge:6,     einheit:'Dosen', preis:8.59  },
    { produktName:'Piacelli Gnocchi 1000g',          produktId:'gnocchi',          menge:6,     einheit:'Pkg',   preis:2.49  },
    { produktName:'Barilla Spaghetti 5kg No.5',      produktId:'spaghetti',        menge:3,     einheit:'Pkg',   preis:7.59  },
    { produktName:'Manner Eierbiskotten 2.4kg',      produktId:'eierbiskotten',    menge:1,     einheit:'Ktn',   preis:19.99 },
    { produktName:'Champignon mittel 3kg Frisch',    produktId:'champignons_fr',   menge:1,     einheit:'kiste', preis:9.19  },
  ];
  for (const item of items) {
    addHistoryEntry({ ...item, datum:'2026-03-25', shopName:'UM Trade GmbH', shopId:'umtrade', quelle:'rechnung-93722' });
  }
  // Essam Shehata Rechnung 28.03.2026 (Gesamtrechnung als Sammeleintrag)
  addHistoryEntry({ produktName:'Essam Shehata Rechnung 28.03.2026 (Gesamtlieferung)', produktId:null, menge:1, einheit:'Rechnung', preis:1304.19, datum:'2026-03-28', shopName:'Essam Shehata KG', shopId:'essamshehata', quelle:'rechnung-essamshehata' });
  localStorage.setItem(FLAG, '1');
})();

const VERLAUF_FILTER = { shop: '', produkt: '', monat: '' };

const SUCHE_STATE = {
  results: [],
  query: '',
  loading: false,
  error: null,
  loadingStep: '',
  addedIds: [],
  fromCache: false,
  cacheDate: null,
  shopFilter: '',   // '' = Alle; 'hofer'|'billa'|'spar'|'lidl'|'metro'|'etsan'
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


// ═══════════════════════════════════════════════════════════════
// js/utils.js
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function eur(val) {
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function getLowStockProducts() {
  return PRODUCTS.filter(p => stockLevels[p.id] < p.minStock);
}

function getPrice(shopId, productId) {
  return PRICE_MAP[shopId]?.[productId] ?? null;
}

function getLatestPrice(productId) {
  for (let i = 0; i < HISTORY.length; i++) {
    const entry = HISTORY[i];
    if (entry && entry.produktId === productId && entry.preis != null && !isNaN(entry.preis)) {
      return +entry.preis;
    }
  }
  return null;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  if (isNaN(val) || val < 0) { _showToast('Ungültiger Wert', 'error'); return; }
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
      _showToast(product.name + ' automatisch in Fehlmaterial eingetragen', 'warning');
    }
    // Notification bei leerem Lager
    if (val <= 0 && typeof notifAdd === 'function') {
      notifAdd('lager_leer', product.name + ' ist leer!', 'Sofort nachbestellen', 'critical', 'lager');
    } else if (typeof notifAdd === 'function') {
      notifAdd('lager_alarm', product.name + ' unter Mindestbestand!', 'Nur noch ' + val + ' ' + product.unit + ' — Minimum: ' + product.minStock, 'critical', 'lager');
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
  if (!('Notification' in window)) { _showToast('Dein Browser unterstützt keine Benachrichtigungen.', 'warning'); return; }
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
  if (window._notifInterval) clearInterval(window._notifInterval);
  function hourlyCheck() {
    if (new Date().getHours() === 8) checkAndNotify();
  }
  hourlyCheck();
  window._notifInterval = setInterval(hourlyCheck, 3600000);
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

// Checkliste-Erinnerung: wenn Morgen-CL nach 10:00 Uhr noch nicht ausgefüllt
function checkChecklisteReminder() {
  const h = new Date().getHours();
  if (h < 10) return;
  const today = new Date().toISOString().slice(0,10);
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem('pizzeria_cl_history') || '[]'); } catch(_) {}
  const morgenDone = hist.find(e => e.datum === today && e.typ === 'morgen');
  if (!morgenDone && typeof notifAdd === 'function') {
    notifAdd('cl_remind_morgen_' + today, '⏰ Morgen-Checkliste offen!', 'Die Morgen-Checkliste für heute wurde noch nicht ausgefüllt.', 'warning', 'checkliste');
  }
}
setTimeout(checkChecklisteReminder, 3000);

// ========== NOTIFICATION CENTER ==========

// Notifications laden/speichern
function notifLoad() {
  try { return JSON.parse(localStorage.getItem('pizzeria_notifications') || '[]'); } catch(_) { return []; }
}
function notifSave(list) {
  // Max 100, älter als 7 Tage löschen
  var week = Date.now() - 7*24*60*60*1000;
  list = list.filter(function(n) { return n.timestamp > week; }).slice(-100);
  try { _syncedLocalSet('pizzeria_notifications', JSON.stringify(list)); } catch(_) {}
}

// Notification erstellen
function notifAdd(type, title, body, severity, tab) {
  severity = severity || 'info';
  tab = tab || 'dashboard';

  // Benachrichtigungs-Filter prüfen (psc_alarm_filter)
  var _alarmFilter = {};
  try { _alarmFilter = JSON.parse(localStorage.getItem('psc_alarm_filter') || '{}'); } catch(_) {}
  // Tab → Filter-Key Mapping
  var _filterKey = { lager:'lager', personal:'personal', preis:'preis', mhd:'mhd', rechnung:'rechnung', fehlmaterial:'lager' }[tab] || null;
  if (_filterKey && _alarmFilter[_filterKey] === false) return; // stumm gestellt

  var list = notifLoad();

  // Deduplizierung: gleiche Meldung nicht innerhalb 1 Stunde
  var oneHour = 60*60*1000;
  var dup = list.find(function(n) { return n.type === type && n.title === title && (Date.now() - n.timestamp) < oneHour; });
  if (dup) return;

  var notif = {
    id: Date.now() + Math.random(),
    type: type,
    title: title,
    body: body || '',
    severity: severity,
    tab: tab,
    timestamp: Date.now(),
    read: false
  };
  list.push(notif);
  notifSave(list);
  notifUpdateBadge();

  // Browser Notification wenn App im Hintergrund
  if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      var icon = severity === 'critical' ? '🔴' : severity === 'warning' ? '🟡' : 'ℹ️';
      var n = new Notification(icon + ' ' + title, {
        body: body || '',
        tag: type + '_' + title,
        icon: '/icons/icon-192.png',
        data: { tab: tab }
      });
      n.onclick = function() { window.focus(); switchTab(tab); notifMarkRead(notif.id); };
    } catch(_) {}
  }

  return notif;
}

// Als gelesen markieren
function notifMarkRead(id) {
  var list = notifLoad();
  var n = list.find(function(x) { return x.id === id; });
  if (n) { n.read = true; notifSave(list); notifUpdateBadge(); }
}

// Alle gelesen
function notifDismissAll() {
  var list = notifLoad();
  list.forEach(function(n) { n.read = true; });
  notifSave(list);
  notifUpdateBadge();
  notifRenderPanel();
}

// Badge aktualisieren
function notifUpdateBadge() {
  var count = notifLoad().filter(function(n) { return !n.read; }).length;
  var badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = count > 9 ? '9+' : (count || '');
    badge.setAttribute('data-count', count);
  }
}

// Panel öffnen/schließen
function notifTogglePanel() {
  var panel = document.getElementById('notif-panel');
  if (!panel) return;
  var isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
  } else {
    notifRenderPanel();
    panel.classList.add('open');
  }
}

// Panel rendern
function notifRenderPanel() {
  var body = document.getElementById('notif-panel-body');
  if (!body) return;
  var list = notifLoad().sort(function(a,b) { return b.timestamp - a.timestamp; });

  if (list.length === 0) {
    body.innerHTML = '<div class="notif-empty">🔔 Keine Benachrichtigungen</div>';
    return;
  }

  // Gruppierung: Heute, Gestern, Älter
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var yesterday = today - 24*60*60*1000;

  var html = '';
  var lastGroup = '';

  list.forEach(function(n) {
    var group = n.timestamp >= today ? 'Heute' : n.timestamp >= yesterday ? 'Gestern' : 'Älter';
    if (group !== lastGroup) {
      html += '<div class="notif-group-label">' + group + '</div>';
      lastGroup = group;
    }

    var iconMap = {
      critical: '⚠️', warning: '⚡', info: 'ℹ️', success: '✅'
    };
    var icon = iconMap[n.severity] || 'ℹ️';
    var timeStr = _notifTimeAgo(n.timestamp);

    html += '<div class="notif-item ' + (n.read ? '' : 'unread') + '" onclick="notifClickItem(\'' + n.id + '\',\'' + _esc(n.tab || 'dashboard') + '\')">';
    html += '<div class="notif-icon ' + (n.severity || 'info') + '">' + icon + '</div>';
    html += '<div class="notif-content">';
    html += '<div class="notif-title">' + _esc(n.title) + '</div>';
    if (n.body) html += '<div class="notif-body">' + _esc(n.body) + '</div>';
    html += '<div class="notif-time">' + timeStr + '</div>';
    html += '</div></div>';
  });

  body.innerHTML = html;
}

// Klick auf Notification
function notifClickItem(id, tab) {
  notifMarkRead(parseFloat(id));
  notifRenderPanel();
  document.getElementById('notif-panel').classList.remove('open');
  if (tab && typeof switchTab === 'function') switchTab(tab);
}

// Zeitangabe formatieren
function _notifTimeAgo(ts) {
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Gerade eben';
  if (mins < 60) return mins + ' Min.';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' Std.';
  var days = Math.floor(hrs / 24);
  return days + (days === 1 ? ' Tag' : ' Tage');
}

// Panel schließen bei Klick außerhalb
document.addEventListener('click', function(e) {
  var panel = document.getElementById('notif-panel');
  if (!panel || !panel.classList.contains('open')) return;
  var bellBtn = document.getElementById('notif-bell-btn');
  if (panel.contains(e.target) || (bellBtn && bellBtn.contains(e.target))) return;
  panel.classList.remove('open');
});

// Badge beim Seitenstart aktualisieren
notifUpdateBadge();


// ═══════════════════════════════════════════════════════════════
// js/fehlmaterial.js
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// FEHLMATERIAL
// ═══════════════════════════════════════════════════════════════

const FM_KEY = 'pizzeria_fehlmaterial';
let FM_DATA = [];
try { FM_DATA = JSON.parse(localStorage.getItem(FM_KEY) || '[]'); } catch(_) { FM_DATA = []; }

function fmSave() {
  try { _syncedLocalSet(FM_KEY, JSON.stringify(FM_DATA)); } catch(_) {}
}

function fmGenId() {
  return Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function fmAdd(form) {
  const now = new Date();
  FM_DATA.unshift({
    id:             fmGenId(),
    datum:          now.toISOString().slice(0, 10),
    uhrzeit:        now.toLocaleTimeString('de-AT', {hour:'2-digit', minute:'2-digit'}),
    produktName:    form.produktName,
    produktId:      form.produktId || null,
    menge:          form.menge,
    einheit:        form.einheit,
    kategorie:      form.kategorie,
    prioritaet:     form.prioritaet,
    bemerkung:      form.bemerkung,
    eingetragenVon: form.eingetragenVon,
    status:         'offen',
    statusDatum:    null,
    erledigungsDatum: null,
  });
  fmSave();
  fmUpdateBadge();
  // ── Notification ──
  if (typeof notifAdd === 'function') {
    const isDringend = form.prioritaet === 'dringend';
    notifAdd(
      'fehlmaterial_neu_' + form.produktName,
      (isDringend ? '🔴 Dringend: ' : '⚠️ ') + form.produktName + ' fehlt!',
      form.menge + ' ' + form.einheit + (form.bemerkung ? ' — ' + form.bemerkung : '') + (form.eingetragenVon ? ' · ' + form.eingetragenVon : ''),
      isDringend ? 'critical' : 'warning',
      'fehlmaterial'
    );
  }
}

function fmSetStatus(id, newStatus) {
  const e = FM_DATA.find(x => x.id === id);
  if (!e) return;
  e.status = newStatus;
  e.statusDatum = new Date().toISOString().slice(0, 10);
  if (newStatus === 'erledigt') e.erledigungsDatum = new Date().toISOString();
  fmSave();
  fmUpdateBadge();
  // ── Notification ──
  if (typeof notifAdd === 'function') {
    if (newStatus === 'erledigt') {
      notifAdd('fm_erledigt_' + e.produktName, '✅ ' + e.produktName + ' erledigt', 'Fehlmaterial wurde behoben', 'info', 'fehlmaterial');
    } else if (newStatus === 'bestellt') {
      notifAdd('fm_bestellt_' + e.produktName, '📦 ' + e.produktName + ' bestellt', 'Wird geliefert', 'info', 'fehlmaterial');
    }
  }
  renderFehlmaterialTab();
}

function fmDelete(id) {
  FM_DATA = FM_DATA.filter(x => x.id !== id);
  fmSave();
  fmUpdateBadge();
  renderFehlmaterialTab();
}

function toggleMehrDrawer() {
  const drawer  = document.getElementById('mehr-drawer');
  const overlay = document.getElementById('mehr-drawer-overlay');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('drawer-open');
  if (isOpen) {
    drawer.classList.remove('drawer-open');
    if (overlay) overlay.style.display = 'none';
  } else {
    drawer.classList.add('drawer-open');
    if (overlay) overlay.style.display = 'block';
  }
}

function closeMehrDrawer() {
  document.getElementById('mehr-drawer')?.classList.remove('drawer-open');
  const overlay = document.getElementById('mehr-drawer-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ══ NOTION SYNC ══════════════════════════════════════════════════════
async function fmNotionSync() {
  const apiKey = localStorage.getItem('pizzeria_notion_key');
  const dbId   = localStorage.getItem('pizzeria_notion_fm_db') || '5e9e674704d04860a3ea98687a329703';
  if (!apiKey) {
    _showToast('Notion API Key fehlt → Einstellungen ⚙️ öffnen', 'error');
    openSettings();
    return;
  }
  const offene = FM_DATA.filter(x => x.status === 'offen');
  if (!offene.length) { _showToast('Kein offenes Fehlmaterial vorhanden', 'info'); return; }
  _showToast('Sende ' + offene.length + ' Einträge an Notion…', 'info');
  try {
    const resp = await fetch('/api/notion/fehlmaterial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: offene, apiKey, dbId })
    });
    const data = await resp.json();
    if (data.success) {
      _showToast('✅ ' + data.synced + ' Einträge in Notion gespeichert', 'success');
    } else {
      _showToast('Notion Fehler: ' + (data.error || 'Unbekannt'), 'error');
    }
  } catch(e) {
    _showToast('Verbindungsfehler: ' + e.message, 'error');
  }
}

async function syncAufgabenNotion() {
  const apiKey = localStorage.getItem('pizzeria_notion_key');
  if (!apiKey) { _showToast('Notion API Key fehlt → Einstellungen ⚙️', 'error'); return; }
  let aufgaben = []; try { aufgaben = JSON.parse(localStorage.getItem('pizzeria_aufgaben')||'[]'); } catch(e) {}
  if (!aufgaben.length) { _showToast('Keine Aufgaben vorhanden', 'info'); return; }
  _showToast('Synchronisiere Aufgaben nach Notion…', 'info');
  try {
    const parentId = localStorage.getItem('pizzeria_notion_parent_id') || '';
    const resp = await fetch('/api/notion/aufgaben', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ aufgaben, apiKey, parentId }) });
    const data = await resp.json();
    if (data.success) _showToast('✅ Notion aktualisiert: Aufgaben', 'success');
    else _showToast('❌ Notion-Fehler: ' + (data.error||'Unbekannt'), 'error');
  } catch(e) {
    _showToast('Notion MCP nicht verbunden', 'error');
  }
}
async function syncTagesberichtNotion() {
  const apiKey = localStorage.getItem('pizzeria_notion_key');
  if (!apiKey) { _showToast('Notion API Key fehlt → Einstellungen ⚙️', 'error'); return; }
  const today = new Date().toISOString().slice(0,10);
  const datum = new Date().toLocaleDateString('de-AT');
  let einnahmen = 0, ausgaben = 0;
  try {
    const kb = kbGet();
    kb.forEach(e => {
      const d = (e.datum||'').slice(0,10);
      if (d === today) {
        if (e.typ === 'einnahme') einnahmen += parseFloat(e.brutto||0);
        else if (e.typ === 'ausgabe') ausgaben += parseFloat(e.brutto||0);
      }
    });
  } catch(_) {}
  const saldo = einnahmen - ausgaben;
  let fehlAnzahl = 0; try { fehlAnzahl = JSON.parse(localStorage.getItem('pizzeria_fehlmaterial')||'[]').length; } catch(_) {}
  let offAufg = 0; try { offAufg = JSON.parse(localStorage.getItem('pizzeria_aufgaben')||'[]').filter(a => !a.erledigt && a.status !== 'erledigt').length; } catch(_) {}
  const bericht = {
    umsatz: `Einnahmen: €${einnahmen.toFixed(2)} | Ausgaben: €${ausgaben.toFixed(2)} | Saldo: €${saldo.toFixed(2)}`,
    fehlmaterial: fehlAnzahl + ' Positionen',
    checklisten: offAufg + ' offene Aufgaben'
  };
  _showToast('Sende Tagesbericht nach Notion…', 'info');
  try {
    const parentId = localStorage.getItem('pizzeria_notion_parent_id') || '';
    const resp = await fetch('/api/notion/tagesbericht', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ apiKey, parentId, bericht, datum }) });
    const data = await resp.json();
    if (data.success) _showToast('✅ Notion aktualisiert: Tagesbericht ' + datum, 'success');
    else _showToast('❌ Notion-Fehler: ' + (data.error||'Unbekannt'), 'error');
  } catch(e) {
    _showToast('Notion MCP nicht verbunden', 'error');
  }
}

function fmUpdateBadge() {
  const openAll      = FM_DATA.filter(x => x.status === 'offen').length;
  const openDringend = FM_DATA.filter(x => x.status === 'offen' && x.prioritaet === 'dringend').length;
  const badge = document.getElementById('fehl-tab-badge');
  if (badge) {
    if (openAll > 0) {
      badge.style.display    = 'flex';
      badge.textContent      = openAll;
      badge.style.background = openDringend > 0 ? '#e53935' : '#f57f17';
    } else {
      badge.style.display = 'none';
    }
  }
  // Mobile bottom nav badge
  const mobBadge = document.getElementById('fehl-mob-badge');
  if (mobBadge) {
    if (openAll > 0) {
      mobBadge.style.display = 'inline-block';
      mobBadge.textContent   = openAll;
    } else {
      mobBadge.style.display = 'none';
    }
  }
}

let fmCurrentSection = 'eingabe';
let fmSelectedPrio   = 'wichtig';
const fmFilter     = { prioritaet: '', kategorie: '', status: 'offen', person: '' };
const fmHistFilter = { search: '', person: '', kategorie: '' };

function showFmSection(id) {
  fmCurrentSection = id;
  renderFehlmaterialTab();
}

const FM_PRIO = {
  dringend: { label: '🔴 Dringend', color: '#c62828', bg: '#fde8e8', border: '#f5c6c6' },
  wichtig:  { label: '🟡 Wichtig',  color: '#e65100', bg: '#fff8e1', border: '#ffe082' },
  normal:   { label: '🟢 Normal',   color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7' },
};
const FM_STATUS = {
  offen:    { label: 'Offen',    color: '#1565c0', bg: '#e3f2fd', border: '#90caf9' },
  bestellt: { label: 'Bestellt', color: '#e65100', bg: '#fff8e1', border: '#ffe082' },
  erledigt: { label: 'Erledigt', color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7' },
};
const FM_KATEGORIEN = ['Lebensmittel', 'Getränke', 'Verpackung', 'Reinigung', 'Sonstiges'];
const FM_EINHEITEN  = ['kg', 'Stück', 'Liter', 'Packung'];

function fmFormatDatum(iso) {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today)     return 'Heute';
  if (iso === yesterday) return 'Gestern';
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-AT', {day:'2-digit', month:'2-digit', year:'numeric'});
}

// ════ MAIN RENDER ════
function renderFehlmaterialTab() {
  const panel = document.getElementById('panel-fehlmaterial');
  if (!panel) return;

  const openCount    = FM_DATA.filter(x => x.status === 'offen').length;
  const dringendCount = FM_DATA.filter(x => x.status === 'offen' && x.prioritaet === 'dringend').length;

  const sections = [
    { id:'eingabe',    icon:'add_circle',  label:'Eingabe & Liste' },
    { id:'historie',   icon:'history',     label:'Tageshistorie'   },
    { id:'auswertung', icon:'bar_chart',   label:'Auswertung'      },
  ];

  const subNav = '<div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">' +
    sections.map(s =>
      '<button onclick="showFmSection(\'' + s.id + '\')"' +
      ' style="display:flex;align-items:center;gap:8px;padding:11px 20px;border-radius:10px;' +
      'font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .15s;' +
      'background:' + (fmCurrentSection===s.id?'#8B0000':'#fff') + ';' +
      'color:' + (fmCurrentSection===s.id?'#fff':'#6b7280') + ';' +
      'border:1.5px solid ' + (fmCurrentSection===s.id?'#8B0000':'#e8e8ed') + '">' +
      '<span class="material-symbols-outlined" style="font-size:18px">' + s.icon + '</span>' +
      s.label +
      (s.id==='eingabe' && openCount>0
        ? '<span style="background:' + (dringendCount>0?'#e53935':'#f57f17') + ';color:#fff;border-radius:50%;' +
          'width:20px;height:20px;font-size:11px;font-weight:700;' +
          'display:flex;align-items:center;justify-content:center">' + openCount + '</span>'
        : '') +
      '</button>'
    ).join('') +
  '</div>';

  let content = '';
  if (fmCurrentSection === 'eingabe')    content = renderFmEingabe();
  if (fmCurrentSection === 'historie')   content = renderFmHistorie();
  if (fmCurrentSection === 'auswertung') content = renderFmAuswertung();

  const notionBtn = `<button onclick="fmNotionSync()" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:12px;font-weight:700;color:#261816;font-family:inherit;cursor:pointer" title="Offene Einträge in Notion speichern">
    <img src="https://www.notion.so/images/favicon.ico" style="width:14px;height:14px;border-radius:2px" onerror="this.style.display='none'"> Notion
  </button>`;

  panel.innerHTML =
    _pageHdr('assignment_late', 'Fehlmaterial',
      FM_DATA.filter(x=>x.status==='offen').length + ' offen' + (dringendCount>0 ? ' · <span style="color:#c62828;font-weight:700">' + dringendCount + ' dringend</span>' : ''),
      notionBtn) +
    subNav + content;

  fmUpdateBadge();
}

// Build autocomplete list from PRODUCTS + existing FM entries
function fmBuildDatalist() {
  const names = new Set(PRODUCTS.map(p => p.name));
  FM_DATA.forEach(e => { if (e.produktName) names.add(e.produktName); });
  return '<datalist id="fm-produkte-list">' +
    [...names].map(n => '<option value="' + n.replace(/"/g,'&quot;') + '">').join('') +
    '</datalist>';
}

// ════ BEREICH A: EINGABE & LISTE ════
function renderFmEingabe() {
  const fPrio   = fmFilter.prioritaet;
  const fKat    = fmFilter.kategorie;
  const fStat   = fmFilter.status;
  const fPerson = fmFilter.person;
  const savedName = localStorage.getItem('fm_last_person') || '';

  let rows = FM_DATA.filter(e => {
    if (fStat   && e.status     !== fStat)   return false;
    if (fPrio   && e.prioritaet !== fPrio)   return false;
    if (fKat    && e.kategorie  !== fKat)    return false;
    if (fPerson && !(e.eingetragenVon||'').toLowerCase().includes(fPerson.toLowerCase())) return false;
    return true;
  }).slice(0, 200);

  // Dringend & open entries first
  rows.sort((a,b) => {
    const aErled = a.status==='erledigt', bErled = b.status==='erledigt';
    if (aErled && !bErled) return 1;
    if (!aErled && bErled) return -1;
    const aDr = a.prioritaet==='dringend', bDr = b.prioritaet==='dringend';
    if (aDr && !bDr) return -1;
    if (!aDr && bDr) return 1;
    return 0;
  });

  const persons = [...new Set(FM_DATA.map(e=>e.eingetragenVon).filter(Boolean))].sort();

  // Card-based list (mobile-friendly, no table)
  const cardsHtml = rows.length === 0
    ? '<div style="text-align:center;padding:48px 20px;color:#5a6472;font-size:14px">Keine Einträge gefunden</div>'
    : rows.map(e => {
        const prio = FM_PRIO[e.prioritaet] || FM_PRIO.normal;
        const stat = FM_STATUS[e.status]   || FM_STATUS.offen;
        return '<div style="border-left:4px solid '+prio.color+';background:#fff;border-radius:0 12px 12px 0;'+
          'margin-bottom:10px;padding:14px 14px 10px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);'+
          (e.status==='erledigt'?'opacity:0.6;':'')+'">' +

          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">' +
          '<span style="display:inline-flex;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;'+
          'background:'+prio.bg+';color:'+prio.color+';border:1px solid '+prio.border+';white-space:nowrap">'+prio.label+'</span>' +
          '<span style="display:inline-flex;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;'+
          'background:'+stat.bg+';color:'+stat.color+';border:1px solid '+stat.border+';white-space:nowrap">'+stat.label+'</span>' +
          '<span style="margin-left:auto;font-size:12px;color:#6b7280;font-weight:600;white-space:nowrap">'+e.menge+' '+e.einheit+'</span>' +
          '</div>' +

          '<div style="font-size:16px;font-weight:800;color:#1e1e2e;margin-bottom:4px;'+
          (e.status==='erledigt'?'text-decoration:line-through;':'')+'">'+_esc(e.produktName)+'</div>' +
          (e.bemerkung ? '<div style="font-size:12px;color:#5a6472;margin-bottom:4px">'+_esc(e.bemerkung)+'</div>' : '') +

          '<div style="font-size:11px;color:#5a6472;margin-bottom:10px">' +
          _esc(e.eingetragenVon||'—') + ' · ' + _esc(e.datum) + ' ' + _esc(e.uhrzeit) +
          ' · <span style="background:#f0f0f5;color:#6b7280;border-radius:5px;padding:1px 6px">'+_esc(e.kategorie)+'</span>' +
          '</div>' +

          '<div style="display:flex;gap:6px">' +
          (e.status==='offen'
            ? '<button onclick="fmSetStatus(\''+e.id+'\',\'bestellt\')" style="min-height:44px;padding:8px 12px;border-radius:8px;border:none;background:#fff8e1;color:#e65100;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;white-space:nowrap;flex:1"><span class="material-symbols-outlined" style="font-size:15px">shopping_cart</span>📦 Bestellt</button>'
            : '') +
          (e.status!=='erledigt'
            ? '<button onclick="fmSetStatus(\''+e.id+'\',\'erledigt\')" style="min-height:44px;padding:8px 12px;border-radius:8px;border:none;background:#e8f5e9;color:#2e7d32;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;white-space:nowrap;flex:1"><span class="material-symbols-outlined" style="font-size:15px">check_circle</span>✅ Erledigt</button>'
            : '') +
          '<button onclick="_showConfirm(\'Löschen?\',function(){fmDelete(\''+e.id+'\')})" style="min-height:44px;width:44px;border-radius:8px;border:1.5px solid #e8e8ed;background:#fff;color:#5a6472;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>' +
          (e.status!=='erledigt'
            ? '<button onclick="fmSendToN8n(\''+e.id+'\')" style="min-height:44px;padding:8px 12px;border-radius:8px;border:none;background:#e3f2fd;color:#1565c0;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;white-space:nowrap;flex-shrink:0" title="An n8n senden"><span style="font-size:14px">📤</span> n8n</button>'
            : '') +
          '</div></div>';
      }).join('');

  return fmBuildDatalist() + `
    <div class="ws-card" style="margin-bottom:24px">
      <div class="ws-section-header" style="margin-bottom:16px">
        <div class="ws-section-title" style="font-size:17px">
          <span class="material-symbols-outlined">add_circle</span>Neues Fehlmaterial melden
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px">
        <div style="grid-column:1/-1">
          <label class="ws-label">Produktname *</label>
          <input id="fm-produktname" class="ws-input" type="text" list="fm-produkte-list"
            placeholder="z.B. Mozzarella, Pizzateig…" autocomplete="off"
            style="font-size:16px;padding:13px 16px;"
            onkeydown="if(event.key==='Enter')document.getElementById('fm-menge').focus()">
        </div>
        <div>
          <label class="ws-label">Menge *</label>
          <input id="fm-menge" class="ws-input" type="number" min="0.1" step="0.1"
            placeholder="z.B. 5" style="font-size:16px;padding:13px 16px;">
        </div>
        <div>
          <label class="ws-label">Einheit</label>
          <select id="fm-einheit" class="ws-input" style="font-size:15px;padding:13px 16px;">
            ${FM_EINHEITEN.map(e => '<option value="'+e+'">'+e+'</option>').join('')}
          </select>
        </div>
        <div>
          <label class="ws-label">Kategorie</label>
          <select id="fm-kategorie" class="ws-input" style="font-size:15px;padding:13px 16px;">
            ${FM_KATEGORIEN.map(k => '<option value="'+k+'">'+k+'</option>').join('')}
          </select>
        </div>
        <div style="grid-column:1/-1">
          <label class="ws-label">Priorität *</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${['dringend','wichtig','normal'].map(p => {
              const pf = FM_PRIO[p];
              const sel = fmSelectedPrio === p;
              return '<button onclick="fmSelectedPrio=\''+p+'\';renderFehlmaterialTab()" '+
                'style="flex:1;min-width:90px;min-height:54px;border-radius:12px;border:2px solid '+(sel?pf.color:pf.border)+';'+
                'background:'+(sel?pf.bg:'#fff')+';color:'+(sel?pf.color:'#9ca3af')+';font-weight:700;font-size:14px;'+
                'cursor:pointer;font-family:inherit;transition:all .15s;'+
                (sel?'box-shadow:0 0 0 3px '+pf.color+'33;':'')+'">'+ pf.label +'</button>';
            }).join('')}
          </div>
        </div>
        <div>
          <label class="ws-label">Eingetragen von *</label>
          <input id="fm-person" class="ws-input" type="text" value="${savedName}"
            placeholder="Dein Name" style="font-size:15px;padding:13px 16px;">
        </div>
        <div>
          <label class="ws-label">Bemerkung (optional)</label>
          <input id="fm-bemerkung" class="ws-input" type="text"
            placeholder="z.B. für Samstag dringend" style="font-size:15px;padding:13px 16px;">
        </div>
      </div>
      <button onclick="fmSubmitForm()"
        style="min-height:52px;width:100%;border-radius:12px;border:none;background:#8B0000;color:#fff;
          font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:10px;transition:background .15s"
        onmouseover="this.style.background='#6a0000'" onmouseout="this.style.background='#8B0000'">
        <span class="material-symbols-outlined" style="font-size:22px">add_alert</span>
        Fehlmaterial melden
      </button>
    </div>

    <div class="ws-card">
      <div class="ws-section-header" style="margin-bottom:12px">
        <div class="ws-section-title" style="font-size:17px">
          <span class="material-symbols-outlined">list</span>Meldungen
          ${FM_DATA.filter(x=>x.status==='offen').length>0
            ? '<span class="ws-badge ws-badge-red">'+FM_DATA.filter(x=>x.status==='offen').length+' offen</span>'
            : ''}
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
        ${['','offen','bestellt','erledigt'].map(s => {
          const labels = {'':'Alle','offen':'🔵 Offen','bestellt':'📦 Bestellt','erledigt':'✅ Erledigt'};
          const sel = fStat === s;
          return '<button onclick="fmFilter.status=\''+s+'\';renderFehlmaterialTab()" '+
            'style="min-height:36px;padding:6px 16px;border-radius:20px;border:1.5px solid '+(sel?'#8B0000':'#e8e8ed')+';'+
            'background:'+(sel?'#8B0000':'#fff')+';color:'+(sel?'#fff':'#6b7280')+';font-size:13px;font-weight:600;'+
            'cursor:pointer;font-family:inherit;transition:all .15s">'+labels[s]+'</button>';
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <select class="ws-input" style="width:auto;font-size:13px;padding:7px 12px"
          onchange="fmFilter.prioritaet=this.value;renderFehlmaterialTab()">
          <option value=""         ${fPrio===''        ?'selected':''}>Alle Prio.</option>
          <option value="dringend" ${fPrio==='dringend'?'selected':''}>🔴 Dringend</option>
          <option value="wichtig"  ${fPrio==='wichtig' ?'selected':''}>🟡 Wichtig</option>
          <option value="normal"   ${fPrio==='normal'  ?'selected':''}>🟢 Normal</option>
        </select>
        <select class="ws-input" style="width:auto;font-size:13px;padding:7px 12px"
          onchange="fmFilter.kategorie=this.value;renderFehlmaterialTab()">
          <option value="" ${fKat===''?'selected':''}>Alle Kat.</option>
          ${FM_KATEGORIEN.map(k=>'<option value="'+k+'" '+(fKat===k?'selected':'')+'>'+k+'</option>').join('')}
        </select>
        <select class="ws-input" style="width:auto;font-size:13px;padding:7px 12px"
          onchange="fmFilter.person=this.value;renderFehlmaterialTab()">
          <option value="">Alle MA</option>
          ${persons.map(p=>'<option value="'+p+'" '+(fPerson===p?'selected':'')+'>'+p+'</option>').join('')}
        </select>
      </div>
      <div class="fm-cards-grid">${cardsHtml}</div>
    </div>`;
}

function fmSubmitForm() {
  const produktName    = (document.getElementById('fm-produktname')?.value||'').trim();
  const mengeRaw       = document.getElementById('fm-menge')?.value;
  const einheit        = document.getElementById('fm-einheit')?.value    || 'Stück';
  const kategorie      = document.getElementById('fm-kategorie')?.value  || 'Lebensmittel';
  const prioritaet     = fmSelectedPrio || 'wichtig';
  const eingetragenVon = (document.getElementById('fm-person')?.value    || '').trim();
  const bemerkung      = (document.getElementById('fm-bemerkung')?.value || '').trim();

  let hasError = false;
  if (!produktName) { _markField('fm-produktname', true); hasError = true; }
  const menge = parseFloat(mengeRaw);
  if (!mengeRaw || isNaN(menge) || menge <= 0) { _markField('fm-menge', true); hasError = true; }
  if (!eingetragenVon) { _markField('fm-person', true); hasError = true; }
  if (hasError) { _showToast('Bitte alle Pflichtfelder ausfüllen', 'error'); return; }

  const matchProd = PRODUCTS.find(p => p.name.toLowerCase() === produktName.toLowerCase());
  fmAdd({ produktName, produktId: matchProd?.id||null, menge, einheit, kategorie, prioritaet, bemerkung, eingetragenVon });
  _safeLocalSet('fm_last_person', eingetragenVon);
  // Notification auslösen
  if (typeof notifAdd === 'function') notifAdd('fehlmaterial', 'Fehlmaterial: ' + produktName, kategorie ? 'Kategorie: ' + kategorie : '', prioritaet === 'dringend' ? 'critical' : 'warning', 'fehlmaterial');
  n8nHook('fehlmaterial-alert', { artikel: produktName, menge, einheit, prioritaet, person: eingetragenVon, datum: new Date().toISOString() });
  _showToast('Fehlmaterial gemeldet', 'success');
  document.getElementById('fm-produktname').value = '';
  document.getElementById('fm-menge').value        = '';
  document.getElementById('fm-bemerkung').value    = '';
  fmSelectedPrio = 'wichtig';
  renderFehlmaterialTab();
}

// ════ BEREICH B: TAGESHISTORIE ════
function renderFmHistorie() {
  const search  = fmHistFilter.search.toLowerCase();
  const person  = fmHistFilter.person.toLowerCase();
  const kat     = fmHistFilter.kategorie;

  const filtered = FM_DATA.filter(e => {
    if (search && !e.produktName.toLowerCase().includes(search)) return false;
    if (person && !(e.eingetragenVon||'').toLowerCase().includes(person)) return false;
    if (kat    && e.kategorie !== kat) return false;
    return true;
  });

  const persons = [...new Set(FM_DATA.map(e=>e.eingetragenVon).filter(Boolean))].sort();

  const grouped = {};
  filtered.forEach(e => {
    if (!grouped[e.datum]) grouped[e.datum] = [];
    grouped[e.datum].push(e);
  });
  const sortedDates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  const groupsHtml = sortedDates.length === 0
    ? '<div class="ws-card" style="text-align:center;padding:60px 20px;color:#5a6472;font-size:14px">Keine Einträge gefunden</div>'
    : sortedDates.map(date => {
        const entries = grouped[date];
        const dateLabel = fmFormatDatum(date);
        const wochentag = new Date(date+'T12:00:00').toLocaleDateString('de-AT',{weekday:'long'});
        const itemsHtml = entries.map(e => {
          const prio = FM_PRIO[e.prioritaet] || FM_PRIO.normal;
          const stat = FM_STATUS[e.status]   || FM_STATUS.offen;
          return '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;' +
            'border-bottom:1px solid #f0f0f5;flex-wrap:wrap;min-height:52px">' +
            '<span style="display:inline-flex;padding:2px 8px;border-radius:20px;font-size:11px;' +
            'font-weight:700;background:'+prio.bg+';color:'+prio.color+';border:1px solid '+prio.border+';flex-shrink:0;white-space:nowrap">'+prio.label+'</span>' +
            '<div style="flex:1;min-width:100px">' +
            '<span style="font-weight:700;font-size:14px">'+e.produktName+'</span>' +
            '<span style="font-size:13px;color:#6b7280;margin-left:6px">'+e.menge+' '+e.einheit+'</span>' +
            (e.bemerkung?'<span style="font-size:12px;color:#5a6472;margin-left:6px">'+e.bemerkung+'</span>':'') +
            '</div>' +
            '<span style="font-size:11px;color:#5a6472;flex-shrink:0">'+e.kategorie+'</span>' +
            '<span style="font-size:12px;color:#5a6472;flex-shrink:0">'+(e.eingetragenVon||'—')+' · '+e.uhrzeit+'</span>' +
            '<span style="display:inline-flex;padding:2px 8px;border-radius:20px;font-size:11px;' +
            'font-weight:700;background:'+stat.bg+';color:'+stat.color+';border:1px solid '+stat.border+';flex-shrink:0;white-space:nowrap">'+stat.label+'</span>' +
            '</div>';
        }).join('');
        return '<div class="ws-card ws-card-sm" style="margin-bottom:16px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
          '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:16px;font-weight:800;color:#1e1e2e">'+dateLabel+
          '<span style="font-size:13px;font-weight:500;color:#5a6472;margin-left:8px">'+wochentag+'</span></div>' +
          '<span class="ws-badge" style="background:#f0f0f5;color:#6b7280">'+entries.length+' Meldung'+(entries.length!==1?'en':'')+'</span>' +
          '</div>' +
          '<div style="border:1px solid #e8e8ed;border-radius:10px;overflow:hidden">'+itemsHtml+'</div>' +
          '</div>';
      }).join('');

  return `
    <div class="ws-card" style="margin-bottom:20px">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:1;min-width:160px">
          <label class="ws-label">Suche nach Produkt</label>
          <input class="ws-input" type="text" placeholder="Produktname…"
            value="${fmHistFilter.search}"
            oninput="fmHistFilter.search=this.value;renderFehlmaterialTab()">
        </div>
        <div style="min-width:140px">
          <label class="ws-label">Mitarbeiter</label>
          <select class="ws-input" onchange="fmHistFilter.person=this.value;renderFehlmaterialTab()">
            <option value="">Alle</option>
            ${persons.map(p=>'<option value="'+p+'" '+(fmHistFilter.person===p?'selected':'')+'>'+p+'</option>').join('')}
          </select>
        </div>
        <div style="min-width:140px">
          <label class="ws-label">Kategorie</label>
          <select class="ws-input" onchange="fmHistFilter.kategorie=this.value;renderFehlmaterialTab()">
            <option value="">Alle</option>
            ${FM_KATEGORIEN.map(k=>'<option value="'+k+'" '+(kat===k?'selected':'')+'>'+k+'</option>').join('')}
          </select>
        </div>
        <div>
          <span class="ws-badge" style="background:#f0f0f5;color:#6b7280;font-size:13px">${filtered.length} Einträge</span>
        </div>
      </div>
    </div>
    ${groupsHtml}`;
}

// ════ BEREICH C: AUSWERTUNG ════
function renderFmAuswertung() {
  if (FM_DATA.length === 0) {
    return '<div class="ws-card" style="text-align:center;padding:60px 20px">' +
      '<div style="font-size:48px;margin-bottom:12px">📊</div>' +
      '<div style="font-size:16px;font-weight:700;color:#6b7280">Noch keine Daten vorhanden</div>' +
      '</div>';
  }

  // Häufigkeiten
  const freq = {};
  FM_DATA.forEach(e => {
    const key = e.produktName.toLowerCase().trim();
    if (!freq[key]) freq[key] = { name: e.produktName, count: 0, dringend: 0 };
    freq[key].count++;
    if (e.prioritaet === 'dringend') freq[key].dringend++;
  });
  const sorted   = Object.values(freq).sort((a,b) => b.count - a.count);
  const top5     = sorted.slice(0, 5);
  const maxCount = top5[0]?.count || 1;

  const top5Html = top5.map((item, i) => {
    const isCritical = item.count >= 3;
    const barW = Math.round((item.count / maxCount) * 100);
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f5">' +
      '<div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
      'font-size:12px;font-weight:800;background:'+(isCritical?'#fde8e8':'#f0f0f5')+';color:'+(isCritical?'#c62828':'#6b7280')+'">'+(i+1)+'</div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">' +
      '<span style="font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+item.name+'</span>' +
      (isCritical?'<span style="background:#fde8e8;color:#c62828;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700;flex-shrink:0">🔴 Kritisch</span>':'') +
      '</div>' +
      '<div style="background:#f0f0f5;border-radius:4px;height:6px;overflow:hidden">' +
      '<div style="width:'+barW+'%;height:100%;border-radius:4px;background:'+(isCritical?'#c62828':'#8B0000')+';transition:width .3s"></div>' +
      '</div></div>' +
      '<div style="font-size:14px;font-weight:800;flex-shrink:0;color:'+(isCritical?'#c62828':'#1e1e2e')+'">'+item.count+'×</div>' +
      '</div>';
  }).join('');

  // Wochentage
  const dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  const dayFull  = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const dayCounts = [0,0,0,0,0,0,0];
  FM_DATA.forEach(e => { if (e.datum) dayCounts[new Date(e.datum+'T12:00:00').getDay()]++; });
  const maxDay     = Math.max(...dayCounts) || 1;
  const busiestDay = dayCounts.indexOf(Math.max(...dayCounts));
  const dayHtml = dayCounts.map((count, i) => {
    const h = Math.round((count / maxDay) * 64);
    const isMax = count === maxDay && count > 0;
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">' +
      '<div style="font-size:12px;font-weight:700;color:'+(isMax?'#8B0000':'#6b7280')+'">'+(count||'')+'</div>' +
      '<div style="width:100%;max-width:36px;height:64px;display:flex;align-items:flex-end">' +
      '<div style="width:100%;height:'+h+'px;border-radius:4px 4px 0 0;background:'+(isMax?'#8B0000':'#e2e2e8')+';min-height:'+(count>0?4:0)+'px;transition:height .3s"></div>' +
      '</div><div style="font-size:11px;color:#5a6472">'+dayNames[i]+'</div></div>';
  }).join('');

  // Kritische Artikel (3×+)
  const critical = sorted.filter(x => x.count >= 3);

  // Durchschnittliche Erledigungszeit
  const erledigte = FM_DATA.filter(x => x.status === 'erledigt' && x.datum && x.statusDatum);
  let avgDaysHtml = '';
  if (erledigte.length > 0) {
    const avg = erledigte.reduce((s,e) => {
      const d1 = new Date(e.datum); const d2 = new Date(e.statusDatum);
      return s + Math.max(0, (d2.getTime()-d1.getTime()) / 86400000);
    }, 0) / erledigte.length;
    avgDaysHtml = '<div style="padding:14px;border-radius:12px;background:#e3f2fd;text-align:center;margin-top:12px">' +
      '<div style="font-size:24px;font-weight:800;color:#1565c0">' + avg.toFixed(1) + ' Tage</div>' +
      '<div style="font-size:12px;color:#6b7280;margin-top:2px">Ø Zeit bis Erledigung</div>' +
      '<div style="font-size:11px;color:#5a6472;margin-top:2px">aus ' + erledigte.length + ' erledigten Fällen</div>' +
      '</div>';
  }

  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px">' +

    '<div class="ws-card">' +
    '<div class="ws-section-title" style="font-size:16px;margin-bottom:16px"><span class="material-symbols-outlined">trending_up</span>Top 5 Fehlmaterialien</div>' +
    (top5Html || '<div style="color:#5a6472;text-align:center;padding:20px">Keine Daten</div>') +
    '</div>' +

    '<div class="ws-card">' +
    '<div class="ws-section-title" style="font-size:16px;margin-bottom:16px"><span class="material-symbols-outlined">calendar_today</span>Meldungen nach Wochentag</div>' +
    '<div style="display:flex;gap:4px;height:80px;margin-bottom:8px">' + dayHtml + '</div>' +
    (dayCounts[busiestDay]>0 ? '<div style="text-align:center;font-size:13px;color:#6b7280;margin-top:8px">Meiste Meldungen am <strong style="color:#8B0000">'+dayFull[busiestDay]+'</strong> ('+dayCounts[busiestDay]+'×)</div>' : '') +
    '</div>' +

    '<div class="ws-card" style="grid-column:1/-1">' +
    '<div class="ws-section-title" style="font-size:16px;margin-bottom:16px"><span class="material-symbols-outlined" style="color:#c62828">warning</span>Kritische Artikel <span style="font-size:13px;font-weight:500;color:#5a6472">(3× oder öfter)</span></div>' +
    (critical.length===0
      ? '<div style="text-align:center;padding:24px;color:#5a6472;font-size:14px"><span style="font-size:32px">✅</span><br>Keine kritischen Artikel — sehr gut!</div>'
      : '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
        critical.map(item =>
          '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:#fde8e8;border:1.5px solid #f5c6c6">' +
          '<span style="font-size:28px;line-height:1">🔴</span>' +
          '<div><div style="font-weight:800;font-size:14px;color:#c62828">'+item.name+'</div>' +
          '<div style="font-size:12px;color:#e53935;font-weight:600">'+item.count+'× gefehlt</div></div>' +
          '</div>'
        ).join('') + '</div>') +
    '</div>' +

    '<div class="ws-card">' +
    '<div class="ws-section-title" style="font-size:16px;margin-bottom:16px"><span class="material-symbols-outlined">analytics</span>Übersicht</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
    '<div style="padding:14px;border-radius:12px;background:#f0f0f5;text-align:center"><div style="font-size:28px;font-weight:800;color:#1e1e2e">'+FM_DATA.length+'</div><div style="font-size:12px;color:#6b7280;margin-top:2px">Einträge gesamt</div></div>' +
    '<div style="padding:14px;border-radius:12px;background:#fde8e8;text-align:center"><div style="font-size:28px;font-weight:800;color:#c62828">'+FM_DATA.filter(x=>x.status==='offen').length+'</div><div style="font-size:12px;color:#6b7280;margin-top:2px">Noch offen</div></div>' +
    '<div style="padding:14px;border-radius:12px;background:#fff8e1;text-align:center"><div style="font-size:28px;font-weight:800;color:#e65100">'+FM_DATA.filter(x=>x.status==='bestellt').length+'</div><div style="font-size:12px;color:#6b7280;margin-top:2px">Bestellt</div></div>' +
    '<div style="padding:14px;border-radius:12px;background:#e8f5e9;text-align:center"><div style="font-size:28px;font-weight:800;color:#2e7d32">'+FM_DATA.filter(x=>x.status==='erledigt').length+'</div><div style="font-size:12px;color:#6b7280;margin-top:2px">Erledigt</div></div>' +
    '</div>' + avgDaysHtml +
    '</div>' +

    '</div>';
}

// ════ FM: AN N8N SENDEN ════
async function fmSendToN8n(id) {
  const entry = FM_DATA.find(e => e.id === id);
  if (!entry) { _showToast('Eintrag nicht gefunden', 'error'); return; }
  const payload = {
    artikel: entry.produktName,
    menge: entry.menge + ' ' + entry.einheit,
    kategorie: entry.kategorie,
    dringlichkeit: entry.prioritaet === 'dringend' ? 'hoch' : entry.prioritaet === 'wichtig' ? 'mittel' : 'niedrig',
    datum: new Date().toISOString(),
    eingetragen_von: entry.eingetragenVon || '',
    bemerkung: entry.bemerkung || '',
    gesendet_von: 'Pizzeria San Carino App'
  };
  try {
    const resp = await fetch('http://localhost:5678/webhook/fehlmaterial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      _showToast('Erfolgreich an n8n gesendet', 'success');
    } else {
      _showToast('n8n Fehler: ' + resp.status, 'error');
    }
  } catch (err) {
    _showToast('n8n nicht erreichbar — läuft der Server?', 'warning');
  }
}

// ═══════════════════════════════════════════════════════════════
// ABFALL-TRACKING
// ═══════════════════════════════════════════════════════════════

const ABFALL_KEY = 'pizzeria_abfall';
let ABFALL_DATA = [];
try { ABFALL_DATA = JSON.parse(localStorage.getItem(ABFALL_KEY)||'[]'); } catch(_) { ABFALL_DATA=[]; }

function abfallSave() {
  try { localStorage.setItem(ABFALL_KEY, JSON.stringify(ABFALL_DATA)); } catch(_) {}
}

const ABFALL_GRUENDE = ['verdorben','falsche Portion','abgelaufen','beschädigt','Sonstiges'];

function showAbfallModal(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  document.getElementById('abfall-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'abfall-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px';
  const savedName = localStorage.getItem('fm_last_person') || '';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:800;color:#1e1e2e">
          🗑️ Abfall erfassen
        </div>
        <button onclick="document.getElementById('abfall-modal-overlay').remove()"
          style="border:none;background:#f0f0f5;border-radius:8px;width:36px;height:36px;
            cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:#6b7280">✕</button>
      </div>
      <div style="background:#fff0ee;border-radius:12px;padding:12px 16px;margin-bottom:20px;
        border:1px solid #e3beb8">
        <div style="font-weight:700;color:#1e1e2e">${p.name}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px">Aktuell: ${stockLevels[productId]} ${p.unit}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div>
          <label class="ws-label">Menge *</label>
          <input id="ab-menge" class="ws-input" type="number" min="0.01" step="0.01"
            placeholder="z.B. 0.5" style="font-size:16px;padding:12px 14px;">
        </div>
        <div>
          <label class="ws-label">Einheit</label>
          <input class="ws-input" value="${p.unit}" readonly
            style="background:#f8f8fa;padding:12px 14px;color:#6b7280;">
        </div>
      </div>
      <div style="margin-bottom:14px">
        <label class="ws-label">Grund *</label>
        <select id="ab-grund" class="ws-input" style="padding:12px 14px;font-size:15px;">
          ${ABFALL_GRUENDE.map(g=>'<option value="'+g+'">'+g+'</option>').join('')}
        </select>
      </div>
      <div style="margin-bottom:14px">
        <label class="ws-label">Eingetragen von</label>
        <input id="ab-person" class="ws-input" value="${savedName}"
          placeholder="Dein Name" style="padding:12px 14px;font-size:15px;">
      </div>
      <div style="margin-bottom:20px">
        <label class="ws-label">Bemerkung (optional)</label>
        <input id="ab-bemerkung" class="ws-input"
          placeholder="z.B. Lieferung war schlecht" style="padding:12px 14px;font-size:15px;">
      </div>
      <button onclick="abfallSpeichern('${productId}')"
        style="width:100%;min-height:52px;border-radius:12px;border:none;background:#c62828;color:#fff;
          font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;
          display:flex;align-items:center;justify-content:center;gap:8px">
        <span class="material-symbols-outlined" style="font-size:20px">delete_sweep</span>
        Abfall speichern
      </button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  setTimeout(() => document.getElementById('ab-menge')?.focus(), 50);
}

function abfallSpeichern(productId) {
  const p     = PRODUCTS.find(x => x.id === productId);
  const menge = parseFloat(document.getElementById('ab-menge')?.value);
  const grund  = document.getElementById('ab-grund')?.value    || 'Sonstiges';
  const person = (document.getElementById('ab-person')?.value  || '').trim();
  const bemerkung = (document.getElementById('ab-bemerkung')?.value || '').trim();
  if (!menge || isNaN(menge) || menge <= 0) { _showToast('Bitte gültige Menge eingeben', 'error'); return; }
  const now = new Date();
  ABFALL_DATA.unshift({
    id:          Date.now()+'_'+Math.random().toString(36).slice(2,7),
    datum:       now.toISOString().slice(0,10),
    uhrzeit:     now.toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'}),
    produktId:   productId,
    produktName: p ? p.name : productId,
    menge, einheit: p ? p.unit : 'Stk',
    grund, person, bemerkung,
  });
  if (ABFALL_DATA.length > 1000) ABFALL_DATA = ABFALL_DATA.slice(0,1000);
  abfallSave();
  if (person) _safeLocalSet('fm_last_person', person);
  document.getElementById('abfall-modal-overlay')?.remove();
  _showToast('Abfall gespeichert — ' + (p?p.name:productId) + ' ' + menge + ' ' + (p?p.unit:''), 'success');
}

function abfallGetMonthly(monthStr) {
  return ABFALL_DATA.filter(e => e.datum && e.datum.startsWith(monthStr));
}

// ═══════════════════════════════════════════════════════════════
// FIFO WARNUNG
// ═══════════════════════════════════════════════════════════════

const FIFO_KEY = 'pizzeria_fifo';
let FIFO_DATA = {};
try { FIFO_DATA = JSON.parse(localStorage.getItem(FIFO_KEY)||'{}'); } catch(_) { FIFO_DATA={}; }

function fifoSave() {
  try { localStorage.setItem(FIFO_KEY, JSON.stringify(FIFO_DATA)); } catch(_) {}
}

function fifoCheckWarning(productId) {
  const entry = FIFO_DATA[productId];
  if (!entry || !entry.eingang) return null;
  const daysSince = Math.floor((Date.now() - new Date(entry.eingang).getTime()) / 86400000);
  if (daysSince >= 7 && stockLevels[productId] > 0) {
    return 'Eingang vor ' + daysSince + ' Tagen — bitte zuerst verwenden!';
  }
  return null;
}

function fifoSetEingang(productId) {
  const today = new Date().toISOString().slice(0,10);
  const person = localStorage.getItem('fm_last_person') || '';
  FIFO_DATA[productId] = { eingang: today, person };
  fifoSave();
  _showToast('Eingang gesetzt: ' + today, 'success');
  renderProductsTab();
}

// ═══════════════════════════════════════════════════════════════
// PORTIONSKONTROLLE
// ═══════════════════════════════════════════════════════════════

const PORTION_KEY = 'pizzeria_portionen';
const PORTION_DEFAULTS = {
  mozzarella: { gramm: 150, einheit: 'g',  label: 'pro Pizza' },
  mehl:       { gramm: 250, einheit: 'g',  label: 'pro Pizza' },
  tomaten:    { gramm: 80,  einheit: 'g',  label: 'pro Pizza' },
  olivenoel:  { gramm: 10,  einheit: 'ml', label: 'pro Pizza' },
  salami:     { gramm: 40,  einheit: 'g',  label: 'pro Pizza' },
  parmesan:   { gramm: 20,  einheit: 'g',  label: 'pro Pizza' },
  basilikum:  { gramm: 3,   einheit: 'g',  label: 'pro Pizza' },
};
let PORTION_DATA = {};
try {
  const _ps = JSON.parse(localStorage.getItem(PORTION_KEY)||'null');
  PORTION_DATA = _ps || JSON.parse(JSON.stringify(PORTION_DEFAULTS));
} catch(_) { PORTION_DATA = JSON.parse(JSON.stringify(PORTION_DEFAULTS)); }

function portSave() {
  try { localStorage.setItem(PORTION_KEY, JSON.stringify(PORTION_DATA)); } catch(_) {}
}

function portUpdate(productId, val) {
  const gramm = parseFloat(val) || 0;
  if (!PORTION_DATA[productId]) PORTION_DATA[productId] = { gramm: 0, einheit: 'g', label: 'pro Pizza' };
  PORTION_DATA[productId].gramm = gramm;
  portSave();
  portCalc();
}

function portCalc() {
  const count = parseInt(document.getElementById('portion-count')?.value) || 0;
  const result = document.getElementById('portion-result');
  if (!result) return;
  if (!count) { result.innerHTML = ''; return; }
  const items = PRODUCTS.filter(p => PORTION_DATA[p.id] && PORTION_DATA[p.id].gramm > 0).map(p => {
    const por = PORTION_DATA[p.id];
    const divisor = (por.einheit==='g'&&p.unit==='kg') || (por.einheit==='ml'&&p.unit==='Liter') ? 1000 : 1;
    const needed  = (por.gramm * count) / divisor;
    const stock   = stockLevels[p.id];
    const ok      = stock >= needed;
    const display = needed < 1 ? needed.toFixed(3) : needed < 10 ? needed.toFixed(2) : needed.toFixed(1);
    return '<span style="background:'+(ok?'#e8f5e9':'#fde8e8')+';color:'+(ok?'#2e7d32':'#c62828')+';' +
      'border-radius:8px;padding:5px 12px;font-size:13px;font-weight:700;white-space:nowrap">' +
      p.name+': '+display+' '+p.unit+(ok?' ✓':' ⚠️')+'</span>';
  });
  result.innerHTML = items.length === 0 ? '' :
    '<div style="margin-top:8px">' +
    '<div style="font-size:12px;color:#6b7280;margin-bottom:8px;font-weight:600">Bedarf für ' + count + ' Pizzen:</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px">' + items.join('') + '</div></div>';
}

function renderPortionskontrolleSection() {
  const produkteMitPortion = PRODUCTS.filter(p => PORTION_DATA[p.id]);
  if (produkteMitPortion.length === 0) return '';
  const rows = produkteMitPortion.map(p => {
    const por = PORTION_DATA[p.id];
    const divisor = (por.einheit==='g'&&p.unit==='kg') || (por.einheit==='ml'&&p.unit==='Liter') ? 1000 : 1;
    const portInUnit = por.gramm / divisor;
    const stock = stockLevels[p.id];
    const reichtFuer = portInUnit > 0 ? Math.floor(stock / portInUnit) : null;
    const isLow = reichtFuer !== null && reichtFuer < 30;
    return '<tr>' +
      '<td style="font-weight:600;font-size:14px">'+p.name+'</td>' +
      '<td><input type="number" value="'+por.gramm+'" min="1" step="1" ' +
        'onchange="portUpdate(\''+p.id+'\',this.value)" ' +
        'style="width:70px;padding:5px 8px;border-radius:7px;border:1.5px solid #e2e2e8;font-size:13px;font-family:inherit;outline:none;text-align:right">' +
      '</td>' +
      '<td style="font-size:13px;color:#6b7280">'+por.einheit+'</td>' +
      '<td style="font-size:13px">'+stock+' '+p.unit+'</td>' +
      '<td style="font-weight:700;color:'+(isLow?'#c62828':'#2e7d32')+'">' +
        (reichtFuer!==null ? reichtFuer+' Pizzen'+(isLow?' ⚠️':'') : '—') +
      '</td>' +
      '</tr>';
  }).join('');
  return `
    <div class="ws-card" style="margin-top:28px">
      <div class="ws-section-header" style="margin-bottom:16px">
        <div class="ws-section-title" style="font-size:17px">
          <span class="material-symbols-outlined">calculate</span>Portionskontrolle
        </div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:20px;flex-wrap:wrap">
        <div>
          <label class="ws-label">Anzahl Pizzen heute</label>
          <input id="portion-count" class="ws-input" type="number" min="1" placeholder="z.B. 50"
            oninput="portCalc()" style="width:150px;font-size:16px;padding:11px 14px;">
        </div>
        <div id="portion-result" style="flex:1"></div>
      </div>
      <div style="overflow-x:auto" class="hide-scrollbar">
        <table class="ws-table" style="min-width:500px">
          <thead><tr>
            <th>Produkt</th><th>Portion</th><th>Einheit</th>
            <th>Bestand</th><th>Reicht für</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="font-size:12px;color:#5a6472;margin-top:12px">
        💡 Portionsmengen anpassen: direkt in der Tabelle klicken und neue Zahl eingeben
      </div>
    </div>`;
}


// ══════════ CHECKLISTE ══════════
const CL_CONFIG_KEY  = 'pizzeria_cl_config';
const CL_HISTORY_KEY = 'pizzeria_cl_history';

const CL_DEFAULTS = {
  morgen: [
    'Kühlschrank Temperatur prüfen (max. 4°C)',
    'Teig vorbereiten',
    'Öffnungskasse prüfen',
    'Arbeitsflächen reinigen',
    'Zutaten für den Tag kontrollieren',
    'Fehlmaterial prüfen & melden',
  ],
  abend: [
    'Kasse abrechnen & Einnahmen notieren',
    'Kühlschrank aufräumen & Temperatur prüfen',
    'Herd und Ofen ausschalten',
    'Arbeitsflächen und Boden reinigen',
    'Abfall entsorgen',
    'Restbestand überprüfen',
    'Türen und Fenster schließen',
    'Alarmanlage aktivieren',
  ],
};

let CL_CONFIG = null;
try {
  CL_CONFIG = JSON.parse(localStorage.getItem(CL_CONFIG_KEY)||'null');
} catch(_) {}
if (!CL_CONFIG) {
  CL_CONFIG = {
    morgen: CL_DEFAULTS.morgen.map((t,i) => ({id:'m'+i, text:t, active:true})),
    abend:  CL_DEFAULTS.abend.map((t,i)  => ({id:'a'+i, text:t, active:true})),
  };
  try { localStorage.setItem(CL_CONFIG_KEY, JSON.stringify(CL_CONFIG)); } catch(_) {}
}

let CL_HISTORY = [];
try { CL_HISTORY = JSON.parse(localStorage.getItem(CL_HISTORY_KEY)||'[]'); } catch(_) {}

function clSaveHistory() {
  try { localStorage.setItem(CL_HISTORY_KEY, JSON.stringify(CL_HISTORY)); } catch(_) {}
}

let clCurrentView   = 'morgen';
let clCheckedItems  = {};

function renderChecklisteTab() {
  const panel = document.getElementById('panel-checkliste');
  if (!panel) return;
  const today = new Date().toISOString().slice(0,10);
  const todayMorgen = CL_HISTORY.find(h => h.datum===today && h.typ==='morgen');
  const todayAbend  = CL_HISTORY.find(h => h.datum===today && h.typ==='abend');

  const views = [
    {id:'morgen',   icon:'wb_sunny',     label:'Morgen',   done: !!todayMorgen},
    {id:'abend',    icon:'nights_stay',  label:'Abend',    done: !!todayAbend},
    {id:'historie', icon:'history',      label:'Historie', done: false},
  ];
  const subNav = '<div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">' +
    views.map(v =>
      '<button onclick="clCurrentView=\''+v.id+'\';renderChecklisteTab()" ' +
      'style="display:flex;align-items:center;gap:8px;padding:11px 20px;border-radius:10px;' +
      'font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .15s;' +
      'background:'+(clCurrentView===v.id?'#8B0000':'#fff')+';' +
      'color:'+(clCurrentView===v.id?'#fff':'#6b7280')+';' +
      'border:1.5px solid '+(clCurrentView===v.id?'#8B0000':'#e8e8ed')+'">' +
      '<span class="material-symbols-outlined" style="font-size:18px">'+v.icon+'</span>' +
      v.label +
      (v.done ? '<span style="background:'+(clCurrentView===v.id?'rgba(255,255,255,0.3)':'#e8f5e9')+';color:'+(clCurrentView===v.id?'#fff':'#2e7d32')+';border-radius:50%;width:20px;height:20px;font-size:12px;display:flex;align-items:center;justify-content:center">✓</span>' : '') +
      '</button>'
    ).join('') + '</div>';

  let content = '';
  if (clCurrentView === 'morgen' || clCurrentView === 'abend') {
    const alreadyDone = clCurrentView==='morgen' ? todayMorgen : todayAbend;
    content = renderClForm(clCurrentView, alreadyDone);
  }
  if (clCurrentView === 'historie') content = renderClHistorie();

  panel.innerHTML =
    _pageHdr('checklist', 'Tages-Checkliste', 'Morgen- und Abend-Protokoll') +
    subNav + content;
  clUpdateBadge();
}

function renderClForm(typ, alreadyDone) {
  const today = new Date().toISOString().slice(0,10);
  const items = CL_CONFIG[typ].filter(i => i.active);

  if (alreadyDone) {
    const doneItems   = alreadyDone.items || [];
    const checkedCnt  = doneItems.filter(i=>i.checked).length;
    const allOk       = checkedCnt === doneItems.length;
    return '<div class="ws-card" style="border-left:4px solid #2e7d32">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
      '<span style="font-size:40px">'+(typ==='morgen'?'☀️':'🌙')+'</span>' +
      '<div><div style="font-weight:800;font-size:16px;color:#2e7d32">'+(typ==='morgen'?'Morgen':'Abend')+'-Checkliste abgeschlossen!</div>' +
      '<div style="font-size:13px;color:#6b7280">'+alreadyDone.person+' · '+alreadyDone.abgeschlossenUm+' Uhr · ' +
      checkedCnt+'/'+doneItems.length+' Punkte erledigt'+(allOk?' ✅':' ⚠️')+'</div></div>' +
      '</div>' +
      '<div style="display:grid;gap:8px;margin-bottom:16px">' +
      doneItems.map(i =>
        '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;' +
        'background:'+(i.checked?'#e8f5e9':'#fff8e1')+';">' +
        '<span style="font-size:18px">'+(i.checked?'✅':'⬜')+'</span>' +
        '<span style="font-size:14px;color:#1e1e2e;'+(i.checked?'':'opacity:0.6')+'">'+i.text+'</span>' +
        '</div>'
      ).join('') +
      '</div>' +
      '<button onclick="clReset(\''+typ+'\')" ' +
      'style="border:1.5px solid #e8e8ed;background:#fff;color:#6b7280;border-radius:10px;' +
      'padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">' +
      'Nochmal ausfüllen</button></div>';
  }

  const savedName = localStorage.getItem('fm_last_person') || '';
  const checkboxes = items.map(item =>
    '<div id="cl-wrap-'+item.id+'" onclick="clToggle(\''+item.id+'\')" ' +
    'style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;' +
    'background:#fff;border:1.5px solid #e8e8ed;cursor:pointer;min-height:56px;' +
    'transition:all .12s;user-select:none">' +
    '<div id="cl-box-'+item.id+'" style="width:28px;height:28px;border-radius:8px;flex-shrink:0;' +
    'border:2px solid #d1d5db;background:#fff;display:flex;align-items:center;justify-content:center;' +
    'transition:all .12s">' +
    '<span class="material-symbols-outlined filled" id="cl-icon-'+item.id+'" ' +
    'style="font-size:18px;color:#fff;display:none">check</span></div>' +
    '<span style="font-size:15px;color:#1e1e2e" id="cl-txt-'+item.id+'">'+item.text+'</span>' +
    '</div>'
  ).join('');

  return '<div class="ws-card">' +
    '<div class="ws-section-title" style="font-size:17px;margin-bottom:6px">' +
    '<span class="material-symbols-outlined">'+(typ==='morgen'?'wb_sunny':'nights_stay')+'</span>' +
    (typ==='morgen'?'Morgen-Checkliste':'Abend-Checkliste') +
    '<span style="font-size:13px;font-weight:500;color:#5a6472;margin-left:8px">'+today+'</span>' +
    '</div>' +
    '<div style="font-size:13px;color:#5a6472;margin-bottom:20px">Tippe zum Abhaken — am Ende mit Namen abschließen</div>' +
    '<div style="display:grid;gap:8px;margin-bottom:20px" id="cl-list-'+typ+'">' + checkboxes + '</div>' +
    '<div style="border-top:1px solid #e8e8ed;padding-top:16px;display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:180px">' +
    '<label class="ws-label">Name / Unterschrift *</label>' +
    '<input id="cl-person-'+typ+'" class="ws-input" type="text" value="'+savedName+'" ' +
    'placeholder="Dein Name" style="font-size:15px;padding:12px 14px;"></div>' +
    '<button onclick="clAbschliessen(\''+typ+'\')" ' +
    'style="min-height:52px;padding:12px 28px;border-radius:12px;border:none;' +
    'background:#8B0000;color:#fff;font-size:15px;font-weight:800;cursor:pointer;' +
    'font-family:inherit;display:flex;align-items:center;gap:8px">' +
    '<span class="material-symbols-outlined" style="font-size:20px">task_alt</span>Abschließen</button>' +
    '</div></div>';
}

function clToggle(itemId) {
  clCheckedItems[itemId] = !clCheckedItems[itemId];
  const box  = document.getElementById('cl-box-'+itemId);
  const icon = document.getElementById('cl-icon-'+itemId);
  const txt  = document.getElementById('cl-txt-'+itemId);
  const wrap = document.getElementById('cl-wrap-'+itemId);
  if (!box) return;
  if (clCheckedItems[itemId]) {
    box.style.cssText  = 'width:28px;height:28px;border-radius:8px;flex-shrink:0;border:2px solid #2e7d32;background:#2e7d32;display:flex;align-items:center;justify-content:center;transition:all .12s';
    if (icon) icon.style.display = 'block';
    if (txt)  txt.style.textDecoration = 'line-through';
    if (wrap) wrap.style.background = '#f0fdf4';
  } else {
    box.style.cssText  = 'width:28px;height:28px;border-radius:8px;flex-shrink:0;border:2px solid #d1d5db;background:#fff;display:flex;align-items:center;justify-content:center;transition:all .12s';
    if (icon) icon.style.display = 'none';
    if (txt)  txt.style.textDecoration = '';
    if (wrap) wrap.style.background = '#fff';
  }
}

function clAbschliessen(typ) {
  const person = (document.getElementById('cl-person-'+typ)?.value||'').trim();
  if (!person) { _markField('cl-person-'+typ, true); _showToast('Bitte Namen eingeben', 'error'); return; }
  const items = CL_CONFIG[typ].filter(i=>i.active).map(item => ({
    id: item.id, text: item.text, checked: !!clCheckedItems[item.id],
  }));
  const today = new Date().toISOString().slice(0,10);
  const now   = new Date().toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'});
  CL_HISTORY = CL_HISTORY.filter(h => !(h.datum===today && h.typ===typ));
  CL_HISTORY.unshift({
    id:             Date.now()+'_'+Math.random().toString(36).slice(2,6),
    datum:          today, typ, person,
    items,          abgeschlossenUm: now,
    vollstaendig:   items.every(i=>i.checked),
  });
  if (CL_HISTORY.length > 500) CL_HISTORY = CL_HISTORY.slice(0,500);
  clSaveHistory();
  clCheckedItems = {};
  if (person) _safeLocalSet('fm_last_person', person);
  const allChecked = items.every(i => i.checked);
  _showToast((typ==='morgen'?'Morgen':'Abend')+'-Checkliste abgeschlossen' + (allChecked ? ' ✅' : ' ⚠️ Nicht alle Punkte erledigt'), allChecked ? 'success' : 'warning');
  // ── Notification ──
  if (typeof notifAdd === 'function') {
    if (allChecked) {
      notifAdd('checkliste_ok_'+typ+'_'+today, (typ==='morgen'?'☀️ Morgen':'🌙 Abend')+'-Checkliste abgeschlossen', 'Alle Punkte erledigt · ' + person, 'info', 'checkliste');
    } else {
      const offen = items.filter(i => !i.checked).length;
      notifAdd('checkliste_warn_'+typ+'_'+today, (typ==='morgen'?'☀️ Morgen':'🌙 Abend')+'-Checkliste unvollständig', offen + ' Punkt' + (offen!==1?'e':'') + ' nicht erledigt · ' + person, 'warning', 'checkliste');
    }
  }
  renderChecklisteTab();
}

function clReset(typ) {
  const today = new Date().toISOString().slice(0,10);
  CL_HISTORY  = CL_HISTORY.filter(h => !(h.datum===today && h.typ===typ));
  clSaveHistory();
  clCheckedItems = {};
  renderChecklisteTab();
}

function clUpdateBadge() {
  const today      = new Date().toISOString().slice(0,10);
  const doneMorgen = CL_HISTORY.some(h => h.datum===today && h.typ==='morgen');
  const doneAbend  = CL_HISTORY.some(h => h.datum===today && h.typ==='abend');
  const badge = document.getElementById('cl-tab-badge');
  const hour = new Date().getHours();
  let showBadge = false;
  if (badge) {
    // Show badge: green when morning done (after 6am), evening reminder (after 5pm if not done)
    if (hour >= 6 && !doneMorgen) {
      badge.style.display = 'flex'; badge.textContent = '!';
      badge.style.background = '#e65100';
      showBadge = true;
    } else if (hour >= 17 && !doneAbend) {
      badge.style.display = 'flex'; badge.textContent = '!';
      badge.style.background = '#e65100';
      showBadge = true;
    } else if (doneMorgen && doneAbend) {
      badge.style.display = 'flex'; badge.textContent = '✓';
      badge.style.background = '#2e7d32';
      showBadge = true;
    } else {
      badge.style.display = 'none';
    }
  } else {
    if ((hour >= 6 && !doneMorgen) || (hour >= 17 && !doneAbend) || (doneMorgen && doneAbend)) {
      showBadge = true;
    }
  }
  // Also update drawer badge
  const drawerBadge = document.getElementById('cl-drawer-badge');
  if (drawerBadge) drawerBadge.style.display = showBadge ? 'block' : 'none';
}

function renderClHistorie() {
  if (CL_HISTORY.length === 0) {
    return '<div class="ws-card" style="text-align:center;padding:60px 20px">' +
      '<div style="font-size:48px">📋</div>' +
      '<div style="font-size:16px;font-weight:700;color:#6b7280;margin-top:12px">' +
      'Noch keine abgeschlossenen Checklisten</div></div>';
  }
  const grouped = {};
  CL_HISTORY.forEach(h => {
    if (!grouped[h.datum]) grouped[h.datum] = [];
    grouped[h.datum].push(h);
  });
  return Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).slice(0,60).map(date => {
    const entries  = grouped[date];
    const label    = fmFormatDatum(date);
    const wochentag = new Date(date+'T12:00:00').toLocaleDateString('de-AT',{weekday:'long'});
    return '<div class="ws-card ws-card-sm" style="margin-bottom:14px">' +
      '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:15px;font-weight:800;margin-bottom:12px">' +
      label + '<span style="font-size:13px;font-weight:500;color:#5a6472;margin-left:8px">'+wochentag+'</span></div>' +
      '<div style="display:grid;gap:8px">' +
      entries.map(h => {
        const done  = (h.items||[]).filter(i=>i.checked).length;
        const total = (h.items||[]).length;
        const allOk = done === total;
        return '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;' +
          'background:'+(allOk?'#e8f5e9':'#fff8e1')+';border:1px solid '+(allOk?'#a5d6a7':'#ffe082')+'">' +
          '<span style="font-size:22px">'+(h.typ==='morgen'?'☀️':'🌙')+'</span>' +
          '<div style="flex:1">' +
          '<div style="font-weight:700;font-size:14px">'+(h.typ==='morgen'?'Morgen':'Abend')+'-Checkliste ' +
          '<span style="font-weight:500;color:#6b7280">'+h.person+'</span></div>' +
          '<div style="font-size:12px;color:#6b7280;margin-top:2px">'+h.abgeschlossenUm+' Uhr · ' +
          done+'/'+total+' erledigt'+(allOk?'':' · <span style="color:#e65100;font-weight:600">Unvollständig</span>')+'</div></div>' +
          '<span style="font-size:22px">'+(allOk?'✅':'⚠️')+'</span>' +
          '</div>';
      }).join('') + '</div></div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// js/upload.js
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — State
// ═══════════════════════════════════════════════════════════════

const UPLOAD_STATE = {
  fileDataUrl: null,
  mediaType: null,
  fileName: null,
  loading: false,
  error: null,
  results: [],       // parsed items from receipt
  einkaufsDatum: null,
  geschaeft: null,
  addedIndices: new Set(),
};

// Rechnungs-Scanner State (File System Access API)
const RECHNUNG_SCAN = {
  dirHandle: null,   // FileSystemDirectoryHandle
  pdfs: [],          // [{name, handle}]
  lieferant: '',
  loading: false,
  error: null,
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — File Handling
// ═══════════════════════════════════════════════════════════════

function handleFileDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file) handleFileUpload(file);
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (file) handleFileUpload(file);
}

function handleFileUpload(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    UPLOAD_STATE.error = 'Bitte ein Bild (JPG, PNG, WebP) oder PDF hochladen.';
    UPLOAD_STATE.fileDataUrl = null;
    renderUploadTab();
    return;
  }
  UPLOAD_STATE.error = null;
  UPLOAD_STATE.mediaType = file.type;
  UPLOAD_STATE.fileName = file.name;
  UPLOAD_STATE.results = [];
  UPLOAD_STATE.addedIndices = new Set();
  UPLOAD_STATE.einkaufsDatum = null;
  UPLOAD_STATE.geschaeft = null;

  const reader = new FileReader();
  reader.onload = e => {
    UPLOAD_STATE.fileDataUrl = e.target.result;
    renderUploadTab();
  };
  reader.onerror = () => {
    UPLOAD_STATE.error = 'Datei konnte nicht gelesen werden. Bitte erneut versuchen.';
    renderUploadTab();
  };
  try {
    reader.readAsDataURL(file);
  } catch (e) {
    UPLOAD_STATE.error = 'Datei konnte nicht geöffnet werden: ' + e.message;
    renderUploadTab();
  }
}

function resetUpload() {
  UPLOAD_STATE.fileDataUrl = null;
  UPLOAD_STATE.mediaType = null;
  UPLOAD_STATE.fileName = null;
  UPLOAD_STATE.error = null;
  UPLOAD_STATE.results = [];
  UPLOAD_STATE.einkaufsDatum = null;
  UPLOAD_STATE.geschaeft = null;
  UPLOAD_STATE.addedIndices = new Set();
  renderUploadTab();
}

// ─── Rechnungs-Ordner scannen (File System Access API) ───
async function openRechnungenOrdner() {
  if (!window.showDirectoryPicker) {
    RECHNUNG_SCAN.error = 'Dein Browser unterstützt kein direktes Öffnen von Ordnern. Bitte Chrome oder Edge verwenden.';
    renderUploadTab(); return;
  }
  try {
    RECHNUNG_SCAN.loading = true;
    RECHNUNG_SCAN.error = null;
    renderUploadTab();
    const dh = await window.showDirectoryPicker({ mode: 'read' });
    RECHNUNG_SCAN.dirHandle = dh;
    // detect supplier from folder name
    const name = dh.name.toLowerCase();
    if (name.includes('um-trade') || name.includes('um_trade') || name.includes('umtrade')) {
      RECHNUNG_SCAN.lieferant = 'UM Trade';
    } else if (name.includes('metro')) {
      RECHNUNG_SCAN.lieferant = 'Metro';
    } else if (name.includes('etsan')) {
      RECHNUNG_SCAN.lieferant = 'Etsan';
    } else {
      RECHNUNG_SCAN.lieferant = dh.name;
    }
    // collect PDFs
    const pdfs = [];
    for await (const [entryName, handle] of dh.entries()) {
      if (handle.kind === 'file' && entryName.toLowerCase().endsWith('.pdf')) {
        pdfs.push({ name: entryName, handle });
      }
    }
    pdfs.sort((a, b) => b.name.localeCompare(a.name)); // neueste zuerst
    RECHNUNG_SCAN.pdfs = pdfs;
    RECHNUNG_SCAN.loading = false;
    renderUploadTab();
  } catch (e) {
    RECHNUNG_SCAN.loading = false;
    if (e.name !== 'AbortError') {
      RECHNUNG_SCAN.error = 'Ordner konnte nicht geöffnet werden: ' + e.message;
    }
    renderUploadTab();
  }
}

async function ladeRechnungPDF(idx) {
  const entry = RECHNUNG_SCAN.pdfs[idx];
  if (!entry) return;
  try {
    const fileObj = await entry.handle.getFile();
    // inject supplier as filename hint if not already in name
    handleFileUpload(fileObj);
  } catch (e) {
    UPLOAD_STATE.error = 'PDF konnte nicht gelesen werden: ' + e.message;
    renderUploadTab();
  }
}

function closeRechnungenScan() {
  RECHNUNG_SCAN.dirHandle = null;
  RECHNUNG_SCAN.pdfs = [];
  RECHNUNG_SCAN.lieferant = '';
  RECHNUNG_SCAN.error = null;
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — Render
// ═══════════════════════════════════════════════════════════════

function renderUploadTab() {
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  const panel = document.getElementById('panel-upload');

  let inner = _pageHdr('upload_file', 'Upload', 'Kassenbon, Handliste, Rechnung hochladen', '');

  // ─── API key hint ───
  if (!hasKey) {
    inner += `
      <div style="border:2px dashed #e3beb8;border-radius:16px;padding:20px 24px;margin-bottom:24px;background:#fff">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <span class="material-symbols-outlined" style="font-size:24px;color:#5a403c;margin-top:2px">key</span>
          <div>
            <p style="font-size:14px;font-weight:700;color:#261816;margin-bottom:8px">🔑 Bitte API Key einfügen um das Auslesen zu nutzen</p>
            <p style="font-size:13px;color:#5a403c;line-height:1.7">
              Öffne die Einstellungen (⚙️ oben rechts) und trage deinen Anthropic API Key ein.
              Der Key wird sicher im Browser (localStorage) gespeichert.
            </p>
          </div>
        </div>
      </div>`;
  }

  // ─── Error ───
  if (UPLOAD_STATE.error) {
    inner += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(UPLOAD_STATE.error)}</p>
        </div>
      </div>`;
  }

  // ─── iOS detection + Hidden file inputs ───
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);

  inner += `<input id="upload-file-input" type="file" accept="image/*,.pdf"${isIOS ? '' : ' capture="environment"'} style="display:none" onchange="handleFileSelect(this)">`;
  if (isIOS) {
    inner += `<input id="upload-gallery-input" type="file" accept="image/*,.pdf" style="display:none" onchange="handleFileSelect(this)">`;
  }

  // ─── Rechnung scannen Button + PDF-Liste ───
  if (!UPLOAD_STATE.fileDataUrl) {
    if (RECHNUNG_SCAN.dirHandle && RECHNUNG_SCAN.pdfs.length >= 0) {
      // Ordner ist geöffnet — zeige PDF-Liste
      inner += `
        <div style="background:#fff;border:1px solid #e3beb8;border-radius:18px;overflow:hidden;margin-bottom:18px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
          <div style="padding:14px 18px;background:#f8dcd8;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e3beb844">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="material-symbols-outlined" style="font-size:20px;color:#610000">folder_open</span>
              <div>
                <p style="font-size:13px;font-weight:700;color:#261816;margin:0">${escHtml(RECHNUNG_SCAN.lieferant || RECHNUNG_SCAN.dirHandle.name)}</p>
                <p style="font-size:11px;color:#5a403c;margin:2px 0 0">${RECHNUNG_SCAN.pdfs.length} PDF${RECHNUNG_SCAN.pdfs.length !== 1 ? 's' : ''} gefunden</p>
              </div>
            </div>
            <button onclick="closeRechnungenScan()" style="padding:5px 12px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:12px;color:#5a403c;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
              <span class="material-symbols-outlined" style="font-size:14px">close</span> Schließen
            </button>
          </div>
          ${RECHNUNG_SCAN.error ? `<div style="padding:12px 18px;background:#ffdad6;color:#93000a;font-size:12px">${escHtml(RECHNUNG_SCAN.error)}</div>` : ''}
          ${RECHNUNG_SCAN.pdfs.length === 0 ? `
            <div style="padding:28px;text-align:center;color:#8d6562">
              <span class="material-symbols-outlined" style="font-size:36px;margin-bottom:8px;display:block;color:#e3beb8">folder_off</span>
              <p style="font-size:13px">Keine PDFs in diesem Ordner gefunden.</p>
            </div>` : `
            <div style="padding:8px">
              ${RECHNUNG_SCAN.pdfs.map((pdf, i) => `
                <button onclick="ladeRechnungPDF(${i})"
                  style="width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;border:none;background:transparent;border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;transition:background .15s"
                  onmouseover="this.style.background='#fff8f6'" onmouseout="this.style.background='transparent'">
                  <span class="material-symbols-outlined" style="font-size:22px;color:#610000;flex-shrink:0">picture_as_pdf</span>
                  <div style="flex:1;min-width:0">
                    <p style="font-size:13px;font-weight:600;color:#261816;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(pdf.name)}</p>
                    <p style="font-size:11px;color:#5a403c;margin:2px 0 0">Tippen zum Auslesen</p>
                  </div>
                  <span class="material-symbols-outlined" style="font-size:18px;color:#6b4844;flex-shrink:0">chevron_right</span>
                </button>`).join('')}
            </div>`}
        </div>`;
    } else {
      // Noch kein Ordner geöffnet — zeige "Rechnung scannen" Button
      inner += `
        <button onclick="openRechnungenOrdner()"
          ${RECHNUNG_SCAN.loading ? 'disabled' : ''}
          style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;border:2px solid #610000;border-radius:16px;background:#fff;color:#610000;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px;transition:all .2s"
          onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
          ${RECHNUNG_SCAN.loading
            ? `<span class="material-symbols-outlined" style="font-size:22px;animation:spin 1s linear infinite">progress_activity</span> Lade Ordner...`
            : `<span class="material-symbols-outlined" style="font-size:22px">folder_open</span> 📂 Rechnung scannen`}
        </button>
        ${RECHNUNG_SCAN.error ? `<div style="background:#ffdad6;border-radius:12px;padding:11px 14px;margin-bottom:14px;font-size:12px;color:#93000a">${escHtml(RECHNUNG_SCAN.error)}</div>` : ''}
        <div style="text-align:center;color:#8d6562;font-size:12px;margin-bottom:16px;display:flex;align-items:center;gap:8px;justify-content:center">
          <div style="flex:1;height:1px;background:#e3beb8"></div>oder<div style="flex:1;height:1px;background:#e3beb8"></div>
        </div>`;
    }
  }

  if (!UPLOAD_STATE.fileDataUrl) {
    // ─── iOS Hinweis-Banner ───
    if (isIOS) {
      inner += `
        <div style="background:#fff8e1;border:1px solid #ffd54f;border-radius:14px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px">
          <span class="material-symbols-outlined" style="font-size:20px;color:#f57c00;flex-shrink:0;margin-top:1px">info</span>
          <p style="font-size:12px;color:#5d4037;line-height:1.6;margin:0">
            <strong>iPhone/iPad Tipp:</strong> Tippe auf <strong>📷 Kamera</strong> für ein neues Foto,
            oder auf <strong>🖼 Galerie</strong> um ein gespeichertes Bild auszuwählen.
          </p>
        </div>`;
    }

    // ─── Drop zone ───
    inner += `
      <div id="upload-drop-zone"
        style="border:2px dashed #e3beb8;border-radius:20px;padding:56px 24px;text-align:center;cursor:pointer;background:#fff8f6;transition:all .2s"
        onclick="document.getElementById('upload-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='#610000';this.style.background='#fff0ee'"
        ondragleave="this.style.borderColor='#e3beb8';this.style.background='#fff8f6'"
        ondrop="event.preventDefault();this.style.borderColor='#e3beb8';this.style.background='#fff8f6';handleFileDrop(event)">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#610000,#8b0000);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 4px 16px rgba(97,0,0,.3)">
          <span class="material-symbols-outlined" style="font-size:38px;color:#fff">photo_camera</span>
        </div>
        <p style="font-size:17px;font-weight:700;color:#261816;margin-bottom:8px">Kassenbon hochladen</p>
        <p style="font-size:14px;color:#5a403c;margin-bottom:20px">${isIOS ? 'Tippe auf Kamera oder wähle aus der Galerie' : 'Foto oder PDF hierher ziehen — oder tippen zum Auswählen'}</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:20px">
          <span style="background:#fff;border:1px solid #e3beb8;border-radius:20px;padding:5px 14px;font-size:12px;color:#5a403c;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:14px">image</span> JPG / PNG / WebP
          </span>
          <span style="background:#fff;border:1px solid #e3beb8;border-radius:20px;padding:5px 14px;font-size:12px;color:#5a403c;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:14px">picture_as_pdf</span> PDF
          </span>
        </div>
        ${isIOS
          ? `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
               <button onclick="event.stopPropagation();document.getElementById('upload-file-input').click()"
                 style="padding:10px 20px;border-radius:14px;border:none;background:#610000;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit">
                 <span class="material-symbols-outlined" style="font-size:18px">photo_camera</span> 📷 Kamera
               </button>
               <button onclick="event.stopPropagation();document.getElementById('upload-gallery-input').click()"
                 style="padding:10px 20px;border-radius:14px;border:1px solid #610000;background:#fff;color:#610000;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit">
                 <span class="material-symbols-outlined" style="font-size:18px">photo_library</span> 🖼 Galerie
               </button>
             </div>`
          : `<p style="font-size:12px;color:#8d6562">📱 Auf dem Handy: Foto direkt von der Kamera wählen</p>`}
      </div>`;
  } else {
    // ─── File loaded: preview + auslesen ───
    const isImage = UPLOAD_STATE.mediaType && UPLOAD_STATE.mediaType.startsWith('image/');

    inner += `<div style="display:flex;flex-direction:column;gap:18px">`;

    // Preview card
    inner += `
      <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07)">
        <div style="padding:12px 16px;border-bottom:1px solid #e3beb844;display:flex;align-items:center;justify-content:space-between;background:#f8dcd8">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#610000">${isImage ? 'image' : 'picture_as_pdf'}</span>
            <span style="font-size:13px;font-weight:600;color:#261816;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(UPLOAD_STATE.fileName || 'Datei')}</span>
          </div>
          <button onclick="resetUpload()"
            style="padding:5px 12px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:12px;color:#5a403c;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">close</span> Entfernen
          </button>
        </div>
        ${isImage
          ? `<div style="background:#261816;max-height:360px;overflow:hidden;display:flex;align-items:center;justify-content:center">
               <img src="${UPLOAD_STATE.fileDataUrl}" style="max-width:100%;max-height:360px;object-fit:contain;display:block">
             </div>`
          : `<div style="padding:40px;text-align:center;background:#fff0ee">
               <span class="material-symbols-outlined" style="font-size:56px;color:#610000">picture_as_pdf</span>
               <p style="font-size:13px;color:#5a403c;margin-top:10px">PDF bereit zum Auslesen</p>
             </div>`}
      </div>`;

    // Auslesen button (only if not loading and no results yet)
    if (!UPLOAD_STATE.loading && UPLOAD_STATE.results.length === 0) {
      inner += `
        <button onclick="auslesenStart()" ${!hasKey ? 'disabled' : ''}
          style="width:100%;padding:18px;border-radius:16px;border:none;font-size:16px;font-weight:700;font-family:inherit;color:#fff;background:linear-gradient(135deg,#610000,#8b0000);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 16px rgba(97,0,0,.3);${!hasKey?'opacity:.5;cursor:not-allowed':''}">
          <span class="material-symbols-outlined" style="font-size:24px">document_scanner</span>
          Kassenbon auslesen
        </button>`;
    }

    // Loading state
    if (UPLOAD_STATE.loading) {
      inner += `
        <div style="text-align:center;padding:52px 20px;background:#fff;border-radius:18px;border:1px solid #e3beb866;box-shadow:0 2px 8px rgba(0,0,0,.07)">
          <div class="spinner"></div>
          <p style="font-size:15px;font-weight:700;color:#261816;margin-bottom:6px">KI liest Kassenbon aus …</p>
          <p style="font-size:13px;color:#5a403c">Claude analysiert das Bild und erkennt alle Produkte und Preise</p>
        </div>`;
    }

    // Results table
    if (UPLOAD_STATE.results.length > 0) {
      const shopName = UPLOAD_STATE.geschaeft;
      const datum = UPLOAD_STATE.einkaufsDatum ? fmtDate(UPLOAD_STATE.einkaufsDatum) : null;
      const allAdded = UPLOAD_STATE.results.every((_, i) => UPLOAD_STATE.addedIndices.has(i));

      inner += `
        <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07)">
          <!-- Results header -->
          <div style="padding:16px 20px;border-bottom:1px solid #e3beb844;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:#f8dcd8">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <span class="material-symbols-outlined filled" style="font-size:22px;color:#386a20">check_circle</span>
              <span style="font-size:15px;font-weight:700;color:#261816">${UPLOAD_STATE.results.length} Produkte erkannt</span>
              ${shopName ? `<span style="background:${shopColor(shopName)};color:#fff;font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px">${escHtml(shopName)}</span>` : ''}
              ${datum ? `<span style="font-size:12px;color:#5a403c;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:14px">calendar_today</span>${escHtml(datum)}</span>` : ''}
            </div>
            <button onclick="auslesenStart()"
              style="padding:6px 14px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:12px;color:#5a403c;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit">
              <span class="material-symbols-outlined" style="font-size:14px">refresh</span> Erneut auslesen
            </button>
          </div>
          <!-- Table -->
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#fff0ee">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Produkt</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Preis</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Menge</th>
                  <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap"></th>
                </tr>
              </thead>
              <tbody>`;

      UPLOAD_STATE.results.forEach((item, idx) => {
        const isAdded = UPLOAD_STATE.addedIndices.has(idx);
        inner += `
                <tr style="border-bottom:1px solid #e3beb833;background:${isAdded ? '#f0fdf4' : 'transparent'}">
                  <td style="padding:13px 16px">
                    <div style="font-size:14px;font-weight:600;color:#261816">${escHtml(item.name)}</div>
                    ${item.kategorie ? `<div style="font-size:11px;color:#8d6562;margin-top:2px">${escHtml(item.kategorie)}</div>` : ''}
                  </td>
                  <td style="padding:13px 12px;text-align:right;font-size:15px;font-weight:700;color:#610000;white-space:nowrap">
                    ${item.preis != null ? eur(item.preis) : '—'}
                  </td>
                  <td style="padding:13px 12px;text-align:center;font-size:13px;color:#5a403c;white-space:nowrap">
                    ${item.menge != null ? item.menge : '1'}&nbsp;${escHtml(item.einheit || 'Stk')}
                  </td>
                  <td style="padding:13px 16px;text-align:center">
                    <button
                      class="add-btn ${isAdded ? 'added' : ''}"
                      onclick="addReceiptItemToInventory(${idx}, this)"
                      ${isAdded ? 'disabled' : ''}
                      style="padding:7px 14px;border-radius:10px;border:1.5px solid ${isAdded ? '#c7c9f9' : '#c0eda6'};background:${isAdded ? '#dfe0ff' : '#c0eda6'};color:${isAdded ? '#0d2ccc' : '#0c2000'};font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px">
                      ${isAdded
                        ? '<span class="material-symbols-outlined" style="font-size:14px">check</span> Hinzugefügt'
                        : '<span class="material-symbols-outlined" style="font-size:14px">add</span> Hinzufügen'}
                    </button>
                  </td>
                </tr>`;
      });

      inner += `
              </tbody>
            </table>
          </div>
          <!-- Footer -->
          <div style="padding:14px 20px;border-top:1px solid #e3beb844;display:flex;justify-content:flex-end">
            <button onclick="addAllReceiptItems()"
              ${allAdded ? 'disabled' : ''}
              style="padding:10px 20px;border-radius:12px;border:none;background:${allAdded ? '#e3beb8' : 'linear-gradient(135deg,#610000,#8b0000)'};color:${allAdded ? '#5a403c' : '#fff'};font-size:13px;font-weight:700;font-family:inherit;cursor:${allAdded ? 'default' : 'pointer'};display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:16px">playlist_add_check</span>
              ${allAdded ? 'Alle hinzugefügt' : 'Alle hinzufügen'}
            </button>
          </div>
        </div>`;
    }

    inner += `</div>`; // end flex column
  }

  inner += renderHandlistSection();
  inner += renderPricelistSection();

  // ── OCR-Rechnung Sektion ──────────────────────────────────────
  inner += `
  <div style="background:var(--surface);border-radius:16px;border:1px solid var(--border);padding:20px;margin-top:20px" id="ocr-sektion">
    <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px">
      <span class="material-symbols-outlined" style="color:var(--red)">document_scanner</span>Rechnung scannen (KI)
    </div>
    <div id="ocr-dropzone"
      ondragover="event.preventDefault();this.style.borderColor='var(--red)'"
      ondragleave="this.style.borderColor='var(--border)'"
      ondrop="event.preventDefault();this.style.borderColor='var(--border)';const f=event.dataTransfer.files[0];if(f)ocrRechnung(f)"
      style="border:2px dashed var(--border);border-radius:12px;padding:32px 20px;text-align:center;cursor:pointer;transition:border-color .2s;margin-bottom:12px"
      onclick="document.getElementById('ocr-file-input').click()">
      <span class="material-symbols-outlined" style="font-size:36px;color:var(--text-3);display:block;margin-bottom:8px">upload_file</span>
      <div style="font-size:14px;font-weight:600;color:var(--text-2)">Rechnung hier ablegen oder klicken</div>
      <div style="font-size:12px;color:var(--text-3);margin-top:4px">JPG, PNG, WebP · max. 10 MB</div>
    </div>
    <input id="ocr-file-input" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="if(this.files[0])ocrRechnung(this.files[0])">
    <div id="ocr-status"></div>
    <div id="ocr-ergebnis"></div>
  </div>`;

  panel.innerHTML = inner;
}

// ── OCR-FUNKTIONEN ───────────────────────────────────────────────────────────
async function ocrRechnung(file) {
  if (file.size > 10 * 1024 * 1024) { _showToast('Datei zu groß (max 10 MB)', 'error'); return; }
  const status = document.getElementById('ocr-status');
  const ergebnis = document.getElementById('ocr-ergebnis');
  if (status) status.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:12px;color:var(--text-2)"><span class="spinner-sm" style="border-color:rgba(139,0,0,.3);border-top-color:var(--red)"></span> KI liest Rechnung…</div>';
  if (ergebnis) ergebnis.innerHTML = '';
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const resp = await fetch('/api/claude-vision', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ image:base64, mimeType:file.type }) });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({error:resp.statusText}));
      if (err.error?.includes('CLAUDE_API_KEY')) { _showToast('Claude API-Key fehlt — in .env setzen', 'error'); }
      else { _showToast('KI-Fehler: ' + (err.error||resp.statusText), 'warning'); }
      if (status) status.innerHTML = '';
      return;
    }
    const data = await resp.json();
    if (status) status.innerHTML = '';
    window._ocrData = data;
    const pos = data.positionen || [];
    if (!pos.length) { _showToast('KI konnte Rechnung nicht lesen — besseres Foto versuchen', 'warning'); return; }
    if (ergebnis) ergebnis.innerHTML = `
      <div style="margin-top:12px">
        <div style="display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap">
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--text-3);display:block;margin-bottom:3px">SHOP</label>
            <input id="ocr-shop" value="${_esc(data.shop||'')}" style="padding:7px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--text-3);display:block;margin-bottom:3px">DATUM</label>
            <input id="ocr-datum" type="date" value="${_esc(data.datum||new Date().toISOString().slice(0,10))}" style="padding:7px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px">
          <thead><tr style="background:var(--bg)">
            <th style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);width:32px">✓</th>
            <th style="padding:6px 8px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Produkt</th>
            <th style="padding:6px 8px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Menge</th>
            <th style="padding:6px 8px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Einheit</th>
            <th style="padding:6px 8px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Preis €</th>
          </tr></thead>
          <tbody>${pos.map((p,i) => `
            <tr style="border-bottom:1px solid var(--border-2)">
              <td style="padding:6px 8px;text-align:center"><input type="checkbox" id="ocr-cb-${i}" checked style="cursor:pointer"></td>
              <td style="padding:6px 8px"><input id="ocr-p-${i}" value="${_esc(p.produkt||'')}" style="width:100%;padding:4px 6px;border-radius:6px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--bg);color:var(--text)"></td>
              <td style="padding:6px 8px;text-align:right"><input id="ocr-m-${i}" type="number" value="${p.menge||1}" style="width:60px;padding:4px 6px;border-radius:6px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--bg);color:var(--text);text-align:right"></td>
              <td style="padding:6px 8px"><input id="ocr-e-${i}" value="${_esc(p.einheit||'Stk')}" style="width:50px;padding:4px 6px;border-radius:6px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--bg);color:var(--text)"></td>
              <td style="padding:6px 8px;text-align:right"><input id="ocr-pr-${i}" type="number" step="0.01" value="${parseFloat(p.preis_brutto||0).toFixed(2)}" style="width:70px;padding:4px 6px;border-radius:6px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--bg);color:var(--text);text-align:right"></td>
            </tr>`).join('')}
          </tbody>
        </table>
        <button onclick="importOcrPreise(${pos.length})" style="padding:10px 20px;border-radius:10px;border:none;background:var(--red);color:#fff;font-size:14px;font-weight:700;cursor:pointer">✅ Preise importieren</button>
      </div>`;
  } catch(e) {
    if (status) status.innerHTML = '';
    if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) { _showToast('Server nicht aktiv — node server.js starten', 'error'); }
    else { _showToast('KI konnte Rechnung nicht lesen — besseres Foto versuchen', 'warning'); }
  }
}
async function importOcrPreise(count) {
  const shop = document.getElementById('ocr-shop')?.value || '';
  const datum = document.getElementById('ocr-datum')?.value || new Date().toISOString().slice(0,10);
  const positionen = [];
  for (let i = 0; i < count; i++) {
    const cb = document.getElementById('ocr-cb-'+i);
    if (!cb?.checked) continue;
    const produkt = document.getElementById('ocr-p-'+i)?.value?.trim() || '';
    const menge = parseFloat(document.getElementById('ocr-m-'+i)?.value) || 1;
    const einheit = document.getElementById('ocr-e-'+i)?.value?.trim() || 'Stk';
    const preis = parseFloat(document.getElementById('ocr-pr-'+i)?.value) || 0;
    if (produkt) positionen.push({ produkt, menge, einheit, preis_brutto: preis });
  }
  if (!positionen.length) { _showToast('Keine Positionen ausgewählt', 'info'); return; }
  let imported = 0;
  for (const pos of positionen) {
    try {
      await fetch('/api/preisverlauf', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ produkt:pos.produkt, shop, datum, preis:pos.preis_brutto }) });
      imported++;
    } catch(e) {}
    // Auch in localStorage history
    try {
      const hist = JSON.parse(localStorage.getItem('pizzeria_history')||'[]');
      hist.push({ id:Date.now()+Math.random(), datum, name:pos.produkt, shop, preis:pos.preis_brutto, einheit:pos.einheit, menge:pos.menge });
      localStorage.setItem('pizzeria_history', JSON.stringify(hist.slice(-500)));
    } catch(e) {}
  }
  _showToast('✅ ' + imported + ' Preise importiert', 'success');
  const ergebnis = document.getElementById('ocr-ergebnis');
  if (ergebnis) ergebnis.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — Claude API (Receipt Scanning)
// ═══════════════════════════════════════════════════════════════

async function auslesenStart() {
  if (!UPLOAD_STATE.fileDataUrl) return;
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  if (!hasKey) {
    UPLOAD_STATE.error = 'Kein Claude API Key. Bitte in den Einstellungen (⚙️) speichern.';
    renderUploadTab();
    return;
  }
  UPLOAD_STATE.loading = true;
  UPLOAD_STATE.error = null;
  UPLOAD_STATE.results = [];
  UPLOAD_STATE.addedIndices = new Set();
  renderUploadTab();

  try {
    const parsed = await scanReceiptViaClaudeAPI();
    UPLOAD_STATE.results = parsed.items || [];
    UPLOAD_STATE.einkaufsDatum = parsed.datum || null;
    UPLOAD_STATE.geschaeft = parsed.geschaeft || null;
    UPLOAD_STATE.error = null;
  } catch (err) {
    UPLOAD_STATE.error = err.message || String(err);
    UPLOAD_STATE.results = [];
  } finally {
    UPLOAD_STATE.loading = false;
    renderUploadTab();
  }
}

async function scanReceiptViaClaudeAPI() {
  const base64 = UPLOAD_STATE.fileDataUrl.split(',')[1];
  const mediaType = UPLOAD_STATE.mediaType;

  const prompt =
    `Lies diesen Kassenbon / diese Rechnung aus und gib mir alle Produkte als JSON zurück.\n\n` +
    `Antworte NUR mit diesem JSON-Format, ohne Erklärungen, ohne Markdown-Codeblock:\n` +
    `{\n` +
    `  "geschaeft": "Geschäftsname (z.B. Metro, Hofer, Billa, Spar, Lidl, Rewe) oder null",\n` +
    `  "datum": "YYYY-MM-DD oder null",\n` +
    `  "items": [\n` +
    `    {\n` +
    `      "name": "Produktname",\n` +
    `      "preis": 1.99,\n` +
    `      "menge": 1,\n` +
    `      "einheit": "Stk / kg / L / Pack / etc.",\n` +
    `      "kategorie": "Grundzutaten / Käse / Belag / Gewürze / Getränke / Sonstiges"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n\n` +
    `Nur die eigentlichen Produkte/Waren auflisten — keine Summen, Rabatte, Steuern oder Zahlungsinfos.\n` +
    `Falls kein Kassenbon erkennbar oder das Bild unlesbar ist, antworte mit: {"fehler": "Kurze Beschreibung"}`;

  const text = await callVisionAI(prompt, base64, mediaType, 4096);
  return parseReceiptJSON(text);
}

function parseReceiptJSON(text) {
  if (!text || !text.trim()) throw new Error('Leere Antwort von Claude.');
  let parsed;
  try { parsed = JSON.parse(text.trim()); } catch (_) {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { parsed = JSON.parse(fenceMatch[1].trim()); } catch (_2) {} }
    if (!parsed) {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) { try { parsed = JSON.parse(objMatch[0]); } catch (_3) {} }
    }
  }
  if (!parsed) throw new Error('Antwort konnte nicht verarbeitet werden. Bitte ein deutlicheres Foto machen.');
  if (parsed.fehler) throw new Error(parsed.fehler);
  if (!Array.isArray(parsed.items)) throw new Error('Keine Produkte erkannt. Bitte ein deutlicheres Foto machen.');
  return parsed;
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — Add to Inventory / Price DB
// ═══════════════════════════════════════════════════════════════

function addReceiptItemToInventory(idx, btn) {
  const item = UPLOAD_STATE.results[idx];
  if (!item) return;

  // Resolve shop ID from detected shop name
  let foundShopId = null;
  if (UPLOAD_STATE.geschaeft) {
    const key = UPLOAD_STATE.geschaeft.toLowerCase();
    for (const s of SHOPS) {
      if (key.includes(s.id) || s.name.toLowerCase().includes(key) || key.includes(s.name.toLowerCase())) {
        foundShopId = s.id;
        break;
      }
    }
  }

  // Try to match an existing product by name
  const nameLower = item.name.toLowerCase();
  const matched = PRODUCTS.find(p =>
    p.name.toLowerCase() === nameLower ||
    p.name.toLowerCase().includes(nameLower.split(' ')[0]) ||
    nameLower.includes(p.name.toLowerCase().split(' ')[0])
  );

  if (matched) {
    // Update price in PRICE_MAP
    if (foundShopId && item.preis != null) {
      if (!PRICE_MAP[foundShopId]) PRICE_MAP[foundShopId] = {};
      PRICE_MAP[foundShopId][matched.id] = item.preis;
    }
  } else {
    // Add new product to PRODUCTS
    const id = 'receipt-' + item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + idx;
    PRODUCTS.push({
      id,
      name: item.name,
      category: item.kategorie || 'Sonstiges',
      unit: item.einheit || 'Stk',
      currentStock: typeof item.menge === 'number' ? item.menge : 0,
      minStock: 1,
      orderQuantity: typeof item.menge === 'number' ? Math.max(1, item.menge) : 1,
    });
    stockLevels[id] = typeof item.menge === 'number' ? item.menge : 0;
    if (foundShopId && item.preis != null) {
      if (!PRICE_MAP[foundShopId]) PRICE_MAP[foundShopId] = {};
      PRICE_MAP[foundShopId][id] = item.preis;
    }
    updateHeaderBadge();
  }

  addHistoryEntry({
    produktName: item.name,
    produktId:   matched ? matched.id : ('receipt-' + item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30) + '-' + idx),
    menge:       item.menge  ?? null,
    einheit:     item.einheit || 'Stk',
    preis:       item.preis   ?? null,
    shopName:    UPLOAD_STATE.geschaeft || null,
    shopId:      foundShopId  || null,
    quelle:      'kassenbon',
    datum:       UPLOAD_STATE.einkaufsDatum || null,
  });

  // Preis in SQLite Preishistorie speichern (Server läuft lokal)
  if (item.preis != null) {
    fetch('/api/preisverlauf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produkt_id:  matched ? matched.id : null,
        produkt:     item.name,
        preis:       item.preis,
        shop:        UPLOAD_STATE.geschaeft || null,
        shop_id:     foundShopId || null,
        datum:       UPLOAD_STATE.einkaufsDatum || new Date().toISOString().slice(0,10),
        quelle:      'kassenbon',
      })
    }).catch(() => {}); // Server evtl. nicht gestartet — kein Fehler zeigen
  }

  UPLOAD_STATE.addedIndices.add(idx);
  btn.classList.add('added');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Hinzugefügt';
  btn.style.background = '#dfe0ff';
  btn.style.color = '#0d2ccc';
  btn.style.borderColor = '#c7c9f9';
  btn.style.cursor = 'default';
}

function addAllReceiptItems() {
  UPLOAD_STATE.results.forEach((_, idx) => {
    if (!UPLOAD_STATE.addedIndices.has(idx)) {
      const btn = document.querySelector(`#panel-upload .add-btn[onclick="addReceiptItemToInventory(${idx}, this)"]`);
      if (btn && !btn.disabled) addReceiptItemToInventory(idx, btn);
    }
  });
  // Re-render to update "Alle hinzufügen" button state
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Extra shops (beyond built-in SHOPS array)
// ═══════════════════════════════════════════════════════════════

const IMPORT_SHOPS_EXTRA = [
  { id: 'transgourmet', name: 'Transgourmet', type: 'Großhandel', color: '#00529B' },
  { id: 'hofer',        name: 'Hofer',        type: 'Discounter', color: '#e63946' },
  { id: 'billa',        name: 'Billa',        type: 'Supermarkt', color: '#ed1c24' },
  { id: 'spar',         name: 'Spar',         type: 'Supermarkt', color: '#007f3e' },
  { id: 'etsan',        name: 'Etsan',        type: 'Großhandel', color: '#ff6b00' },
  { id: 'penny',        name: 'Penny',        type: 'Discounter', color: '#cc0000' },
];

function allImportShops() {
  return [...SHOPS, ...IMPORT_SHOPS_EXTRA].filter((s, i, a) => a.findIndex(x => x.id === s.id) === i);
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — State
// ═══════════════════════════════════════════════════════════════

const HANDLIST_STATE = {
  fileDataUrl: null,
  mediaType: null,
  fileName: null,
  loading: false,
  error: null,
  items: [],  // [{name, menge, einheit, status, suggestion, matchedProductId}]
  appliedIndices: new Set(),
};

// ═══════════════════════════════════════════════════════════════
// HANDLIST — File Handling
// ═══════════════════════════════════════════════════════════════

function handleHandlistDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file) handleHandlistFile(file);
}

function handleHandlistSelect(input) {
  const file = input.files[0];
  if (file) handleHandlistFile(file);
}

function handleHandlistFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    HANDLIST_STATE.error = 'Bitte ein Bild (JPG, PNG, WebP) oder PDF hochladen.';
    HANDLIST_STATE.fileDataUrl = null;
    renderUploadTab();
    return;
  }
  HANDLIST_STATE.error = null;
  HANDLIST_STATE.mediaType = file.type;
  HANDLIST_STATE.fileName = file.name;
  HANDLIST_STATE.items = [];
  HANDLIST_STATE.appliedIndices = new Set();

  const reader = new FileReader();
  reader.onload = e => { HANDLIST_STATE.fileDataUrl = e.target.result; renderUploadTab(); };
  reader.readAsDataURL(file);
}

function resetHandlist() {
  HANDLIST_STATE.fileDataUrl = null;
  HANDLIST_STATE.mediaType = null;
  HANDLIST_STATE.fileName = null;
  HANDLIST_STATE.error = null;
  HANDLIST_STATE.items = [];
  HANDLIST_STATE.appliedIndices = new Set();
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Classify items against PRODUCTS
// ═══════════════════════════════════════════════════════════════

function classifyHandlistItem(name) {
  const n = name.toLowerCase().trim();
  // 1. Exact match → high confidence
  const exact = PRODUCTS.find(p => p.name.toLowerCase() === n);
  if (exact) return { status: 'matched', matchedProductId: exact.id, suggestion: exact.name };

  // 2. Containment match → high confidence
  const contain = PRODUCTS.find(p => {
    const pn = p.name.toLowerCase();
    return pn.includes(n) || n.includes(pn);
  });
  if (contain) return { status: 'matched', matchedProductId: contain.id, suggestion: contain.name };

  // 3. Word overlap → medium confidence (similar / suggestion)
  const words = n.split(/\s+/).filter(w => w.length > 3);
  if (words.length > 0) {
    for (const p of PRODUCTS) {
      const pWords = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const overlap = words.filter(w => pWords.some(pw => pw.includes(w) || w.includes(pw)));
      if (overlap.length >= Math.ceil(Math.min(words.length, pWords.length) * 0.5)) {
        return { status: 'similar', matchedProductId: p.id, suggestion: p.name };
      }
    }
  }

  return { status: 'new', matchedProductId: null, suggestion: null };
}

function enrichHandlistItems(rawItems) {
  return rawItems.map(item => ({ ...item, ...classifyHandlistItem(item.name || '') }));
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Apply to Inventory
// ═══════════════════════════════════════════════════════════════

function applyHandlistItem(idx, btn) {
  const item = HANDLIST_STATE.items[idx];
  if (!item) return;

  if (item.matchedProductId) {
    const prod = PRODUCTS.find(p => p.id === item.matchedProductId);
    if (prod && item.menge != null) prod.orderQuantity = Number(item.menge) || prod.orderQuantity;
  } else {
    const id = 'hand-' + item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + idx;
    if (!PRODUCTS.find(p => p.id === id)) {
      PRODUCTS.push({
        id, name: item.name, category: 'Sonstiges',
        unit: item.einheit || 'Stk', currentStock: 0,
        minStock: Number(item.menge) || 1, orderQuantity: Number(item.menge) || 1,
      });
      stockLevels[id] = 0;
    }
    item.matchedProductId = id;
    item.status = 'matched';
  }

  addHistoryEntry({
    produktName: item.name,
    produktId:   item.matchedProductId,
    menge:       item.menge   ?? null,
    einheit:     item.einheit || 'Stk',
    preis:       null,
    shopName:    null,
    shopId:      null,
    quelle:      'handliste',
  });

  HANDLIST_STATE.appliedIndices.add(idx);
  updateHeaderBadge();

  if (btn) {
    btn.disabled = true;
    btn.style.background = '#dfe0ff';
    btn.style.borderColor = '#c7c9f9';
    btn.style.color = '#0d2ccc';
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Übernommen';
    const row = btn.closest('tr');
    if (row) row.style.background = '#f0fdf4';
  }
}

function applyAllHandlistItems() {
  HANDLIST_STATE.items.forEach((_, idx) => {
    if (!HANDLIST_STATE.appliedIndices.has(idx)) applyHandlistItem(idx, null);
  });
  updateHeaderBadge();
  renderUploadTab();
}

function applySelectedHandlistItems() {
  const table = document.getElementById('handlist-results-table');
  if (!table) return;
  let anyApplied = false;
  table.querySelectorAll('input[type="checkbox"][data-idx]').forEach(cb => {
    if (cb.checked) {
      const idx = parseInt(cb.dataset.idx);
      if (!HANDLIST_STATE.appliedIndices.has(idx)) { applyHandlistItem(idx, null); anyApplied = true; }
    }
  });
  if (anyApplied) { updateHeaderBadge(); renderUploadTab(); }
}

function discardHandlist() { resetHandlist(); }

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Edit item in-place
// ═══════════════════════════════════════════════════════════════

function startEditHandlistItem(idx) {
  const item = HANDLIST_STATE.items[idx];
  const nameCell = document.getElementById('handlist-name-' + idx);
  if (!item || !nameCell) return;
  nameCell.innerHTML = `
    <div style="display:flex;gap:4px;align-items:center" onclick="event.stopPropagation()">
      <input id="hl-edit-${idx}" value="${escHtml(item.name)}"
        style="padding:4px 8px;border:1.5px solid #a16207;border-radius:8px;font-size:13px;font-family:inherit;color:#261816;min-width:120px;flex:1"
        onkeydown="if(event.key==='Enter')commitEditHandlistItem(${idx});if(event.key==='Escape')renderUploadTab()" />
      <button onclick="commitEditHandlistItem(${idx})"
        style="padding:4px 10px;border-radius:8px;border:none;background:#a16207;color:#fff;font-size:12px;font-family:inherit;cursor:pointer">✓</button>
      <button onclick="renderUploadTab()"
        style="padding:4px 8px;border-radius:8px;border:1px solid #e3beb8;background:#fff;font-size:12px;font-family:inherit;cursor:pointer;color:#5a403c">✗</button>
    </div>`;
  const inp = document.getElementById('hl-edit-' + idx);
  if (inp) { inp.focus(); inp.select(); }
}

function commitEditHandlistItem(idx) {
  const inp = document.getElementById('hl-edit-' + idx);
  if (!inp) return;
  const newName = inp.value.trim();
  if (!newName) return;
  const item = HANDLIST_STATE.items[idx];
  if (!item) return;
  item.name = newName;
  const cls = classifyHandlistItem(newName);
  item.status = cls.status; item.matchedProductId = cls.matchedProductId; item.suggestion = cls.suggestion;
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Claude API
// ═══════════════════════════════════════════════════════════════

async function erkennungStart() {
  if (!HANDLIST_STATE.fileDataUrl) return;
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  if (!hasKey) {
    HANDLIST_STATE.error = 'Kein Claude API Key. Bitte in den Einstellungen (⚙️) speichern.';
    renderUploadTab(); return;
  }
  HANDLIST_STATE.loading = true;
  HANDLIST_STATE.error = null;
  HANDLIST_STATE.items = [];
  HANDLIST_STATE.appliedIndices = new Set();
  renderUploadTab();

  try {
    const rawItems = await scanHandlistViaClaudeAPI();
    if (!rawItems.length) throw new Error('Keine Produkte erkannt. Bitte ein deutlicheres Foto machen.');
    HANDLIST_STATE.items = enrichHandlistItems(rawItems);
    HANDLIST_STATE.error = null;
  } catch (err) {
    HANDLIST_STATE.error = err.message || String(err);
    HANDLIST_STATE.items = [];
  } finally {
    HANDLIST_STATE.loading = false;
    renderUploadTab();
  }
}

async function scanHandlistViaClaudeAPI() {
  const base64 = HANDLIST_STATE.fileDataUrl.split(',')[1];
  const mediaType = HANDLIST_STATE.mediaType;

  const prompt =
    `Das ist eine handgeschriebene Einkaufsliste einer Pizzeria in Wien.\n` +
    `Erkenne alle Produkte und Mengen. Antworte NUR mit einem JSON-Array, ohne Markdown:\n` +
    `[{"name": "Produktname", "menge": 2, "einheit": "kg"}]\n\n` +
    `Typische Produkte: Mehl, Mozzarella, Tomaten, Salami, Öl, Gewürze, Hefe, Oregano,\n` +
    `Basilikum, Oliven, Kapern, Prosciutto, Rucola, Thunfisch, Sardellen, Parmesan, Ricotta.\n\n` +
    `Regeln:\n` +
    `- Mengen als Zahlen (z.B. 2, nicht "zwei")\n` +
    `- Einheit: kg / g / L / ml / Stk / Pkg / Dose / Flasche\n` +
    `- Falls Schrift unleserlich: {"fehler": "Unleserlich — bitte deutlicheres Foto"}\n` +
    `- Falls kein Text erkennbar: {"fehler": "Kein Text im Bild erkannt"}`;

  const text = await callVisionAI(prompt, base64, mediaType, 2048);
  return parseHandlistJSON(text);
}

function parseHandlistJSON(text) {
  if (!text || !text.trim()) throw new Error('Leere Antwort von Claude.');
  let parsed;
  try { parsed = JSON.parse(text.trim()); } catch (_) {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { parsed = JSON.parse(fenceMatch[1].trim()); } catch (_2) {} }
    if (!parsed) {
      const arrMatch = text.match(/\[[\s\S]*\]/);
      if (arrMatch) { try { parsed = JSON.parse(arrMatch[0]); } catch (_3) {} }
      if (!parsed) {
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) { try { parsed = JSON.parse(objMatch[0]); } catch (_4) {} }
      }
    }
  }
  if (!parsed) throw new Error('Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.');
  if (!Array.isArray(parsed) && parsed.fehler) throw new Error(parsed.fehler);
  if (!Array.isArray(parsed)) throw new Error('Unerwartetes Format. Bitte erneut versuchen.');
  return parsed.filter(item => item && item.name);
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Render Section
// ═══════════════════════════════════════════════════════════════

function renderHandlistSection() {
  const STATUS_CFG = {
    matched: { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#16a34a', label: 'Im System ✓' },
    similar: { bg: '#fefce8', border: '#fde047', text: '#854d0e', dot: '#ca8a04', label: 'Ähnlich gefunden' },
    new:     { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#ea580c', label: 'Neu anlegen'     },
  };

  let html = `
    <div style="margin:40px 0 32px;display:flex;align-items:center;gap:14px">
      <div style="flex:1;height:1px;background:#e3beb8"></div>
      <span style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">oder</span>
      <div style="flex:1;height:1px;background:#e3beb8"></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="width:44px;height:44px;border-radius:14px;background:#fef9c3;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:24px;color:#854d0e">edit_note</span>
      </div>
      <div>
        <h2 style="font-size:16px;font-weight:700;color:#261816;margin-bottom:2px">✍️ Handliste erkennen</h2>
        <p style="font-size:12px;color:#5a403c">Foto einer handgeschriebenen Einkaufsliste → digitale Einkaufsliste</p>
      </div>
    </div>`;

  if (HANDLIST_STATE.error) {
    html += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(HANDLIST_STATE.error)}</p>
          <p style="font-size:11px;color:#93000a;margin-top:6px">Tipp: Besseres Licht, Liste flach hinlegen, ganzes Blatt im Bild.</p>
        </div>
      </div>`;
  }

  html += `<input id="handlist-file-input" type="file" accept="image/jpeg,image/png,image/webp,.pdf" capture="environment" style="display:none" onchange="handleHandlistSelect(this)">`;

  if (!HANDLIST_STATE.fileDataUrl) {
    // ─── Drop zone ───
    html += `
      <div id="handlist-drop-zone"
        style="border:2px dashed #fde047;border-radius:20px;padding:52px 24px;text-align:center;cursor:pointer;background:#fefce8;transition:all .2s"
        onclick="document.getElementById('handlist-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='#854d0e';this.style.background='#fef08a55'"
        ondragleave="this.style.borderColor='#fde047';this.style.background='#fefce8'"
        ondrop="event.preventDefault();this.style.borderColor='#fde047';this.style.background='#fefce8';handleHandlistDrop(event)">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#854d0e,#a16207);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 4px 16px rgba(133,77,14,.3)">
          <span class="material-symbols-outlined" style="font-size:38px;color:#fff">edit_note</span>
        </div>
        <p style="font-size:17px;font-weight:700;color:#261816;margin-bottom:8px">Handliste fotografieren</p>
        <p style="font-size:14px;color:#5a403c;margin-bottom:20px">Foto oder PDF hierher ziehen — oder tippen zum Auswählen</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          <span style="background:#fff;border:1px solid #fde047;border-radius:20px;padding:5px 14px;font-size:12px;color:#854d0e;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:14px">image</span> JPG / PNG / WebP
          </span>
          <span style="background:#fff;border:1px solid #fde047;border-radius:20px;padding:5px 14px;font-size:12px;color:#854d0e;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:14px">picture_as_pdf</span> PDF
          </span>
        </div>
        <p style="font-size:12px;color:#8d6562;margin-top:16px">📱 Auf dem Handy öffnet direkt die Kamera</p>
      </div>

      <div style="margin-top:14px;background:#fff;border:1px solid #fde04755;border-radius:14px;padding:14px 18px">
        <p style="font-size:12px;font-weight:700;color:#854d0e;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:16px">lightbulb</span> Tipps für ein gutes Foto
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[['wb_sunny','Gutes Licht verwenden'],['straighten','Liste flach hinlegen'],
             ['draw','Deutlich schreiben hilft'],['crop_free','Ganzes Blatt im Bild']].map(([ic,tip]) =>
            `<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:#5a403c">
               <span class="material-symbols-outlined" style="font-size:15px;color:#a16207">${ic}</span>${tip}
             </div>`).join('')}
        </div>
      </div>`;

  } else if (HANDLIST_STATE.loading) {
    html += `
      <div style="text-align:center;padding:52px 20px;background:#fefce8;border-radius:18px;border:2px dashed #fde047">
        <div class="spinner" style="border-color:#fde04744;border-top-color:#854d0e"></div>
        <p style="font-size:15px;font-weight:700;color:#261816;margin-bottom:6px">Lese Handschrift …</p>
        <p style="font-size:13px;color:#5a403c">Claude analysiert deine handgeschriebene Liste</p>
      </div>`;

  } else if (HANDLIST_STATE.items.length === 0) {
    // ─── Image preview + Erkennen button ───
    html += `
      <div style="background:#fff;border:1px solid #fde04766;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(133,77,14,.1)">
        <div style="padding:12px 16px;border-bottom:1px solid #fde04744;display:flex;align-items:center;justify-content:space-between;background:#fef9c3">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#854d0e">${HANDLIST_STATE.mediaType === 'application/pdf' ? 'picture_as_pdf' : 'image'}</span>
            <span style="font-size:13px;font-weight:600;color:#261816;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(HANDLIST_STATE.fileName || 'Datei')}</span>
          </div>
          <button onclick="resetHandlist()"
            style="padding:5px 12px;border-radius:10px;border:1px solid #fde047;background:#fff;font-size:12px;color:#854d0e;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">close</span> Entfernen
          </button>
        </div>
        ${HANDLIST_STATE.mediaType === 'application/pdf'
          ? `<div style="padding:40px;text-align:center;background:#fefce8">
               <span class="material-symbols-outlined" style="font-size:56px;color:#854d0e">picture_as_pdf</span>
               <p style="font-size:13px;color:#5a403c;margin-top:10px">PDF bereit zum Auslesen</p>
             </div>`
          : `<div style="background:#1c1200;max-height:380px;overflow:hidden;display:flex;align-items:center;justify-content:center">
               <img src="${HANDLIST_STATE.fileDataUrl}" style="max-width:100%;max-height:380px;object-fit:contain;display:block">
             </div>`}
      </div>
      <button onclick="erkennungStart()"
        style="width:100%;margin-top:16px;padding:18px;border-radius:16px;border:none;font-size:16px;font-weight:700;font-family:inherit;color:#fff;background:linear-gradient(135deg,#854d0e,#a16207);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 16px rgba(133,77,14,.35)">
        <span class="material-symbols-outlined" style="font-size:24px">manage_search</span>
        Handschrift erkennen
      </button>`;

  } else {
    // ─── Results table ───
    const allApplied = HANDLIST_STATE.items.every((_, i) => HANDLIST_STATE.appliedIndices.has(i));
    const counts = { matched: 0, similar: 0, new: 0 };
    HANDLIST_STATE.items.forEach(it => { if (counts[it.status] !== undefined) counts[it.status]++; });

    html += `
      <div style="background:#fff;border:1px solid #fde04766;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(133,77,14,.1)">

        <!-- Header bar -->
        <div style="padding:16px 20px;border-bottom:1px solid #fde04744;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:#fef9c3">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="material-symbols-outlined" style="font-size:22px;color:#854d0e">edit_note</span>
            <span style="font-size:15px;font-weight:700;color:#261816">${HANDLIST_STATE.items.length} Produkte erkannt</span>
            ${counts.matched > 0 ? `<span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;border:1px solid #86efac">${counts.matched} im System</span>` : ''}
            ${counts.similar > 0 ? `<span style="background:#fefce8;color:#854d0e;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;border:1px solid #fde047">${counts.similar} ähnlich</span>` : ''}
            ${counts.new     > 0 ? `<span style="background:#fff7ed;color:#9a3412;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;border:1px solid #fed7aa">${counts.new} neu</span>` : ''}
          </div>
          <button onclick="erkennungStart()"
            style="padding:6px 14px;border-radius:10px;border:1px solid #fde047;background:#fff;font-size:12px;color:#854d0e;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">refresh</span> Neu erkennen
          </button>
        </div>

        <!-- Legend -->
        <div style="padding:9px 20px;border-bottom:1px solid #fde04733;background:#fffdf0;display:flex;gap:18px;flex-wrap:wrap">
          ${Object.values(STATUS_CFG).map(c => `
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:${c.text}">
              <span style="width:8px;height:8px;border-radius:50%;background:${c.dot};flex-shrink:0;display:inline-block"></span>${c.label}
            </div>`).join('')}
        </div>

        <!-- Table -->
        <div style="overflow-x:auto">
          <table id="handlist-results-table" style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#fffdf0">
                <th style="padding:9px 14px;width:36px">
                  <input type="checkbox" id="handlist-check-all"
                    onchange="document.querySelectorAll('#handlist-results-table input[data-idx]').forEach(cb=>cb.checked=this.checked)"
                    style="cursor:pointer;accent-color:#854d0e;width:15px;height:15px">
                </th>
                <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Produkt</th>
                <th style="padding:9px 14px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Menge</th>
                <th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Einheit</th>
                <th style="padding:9px 16px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Aktion</th>
              </tr>
            </thead>
            <tbody>`;

    HANDLIST_STATE.items.forEach((item, idx) => {
      const isApplied = HANDLIST_STATE.appliedIndices.has(idx);
      const sc = STATUS_CFG[item.status] || STATUS_CFG.new;
      const rowBg = isApplied ? '#f0fdf4' : sc.bg;
      html += `
              <tr style="border-bottom:1px solid #fde04722;background:${rowBg}">
                <td style="padding:11px 14px;text-align:center">
                  <input type="checkbox" data-idx="${idx}" style="cursor:pointer;accent-color:#854d0e;width:15px;height:15px" ${isApplied ? 'checked disabled' : ''}>
                </td>
                <td style="padding:11px 16px">
                  <div style="display:flex;align-items:flex-start;gap:8px">
                    <span style="width:9px;height:9px;border-radius:50%;background:${sc.dot};flex-shrink:0;margin-top:4px;display:inline-block"></span>
                    <div style="flex:1;min-width:0">
                      <div id="handlist-name-${idx}" style="font-size:14px;font-weight:600;color:#261816">${escHtml(item.name)}</div>
                      ${item.status === 'similar' && item.suggestion
                        ? `<div style="font-size:11px;color:#854d0e;margin-top:3px;display:flex;align-items:center;gap:4px">
                             <span class="material-symbols-outlined" style="font-size:12px">help</span>
                             Meinst du: <strong style="margin-left:2px">${escHtml(item.suggestion)}</strong>?
                           </div>`
                        : item.status === 'matched' && item.suggestion && item.suggestion !== item.name
                        ? `<div style="font-size:11px;color:#16a34a;margin-top:2px">→ ${escHtml(item.suggestion)}</div>`
                        : item.status === 'new'
                        ? `<div style="font-size:11px;color:#ea580c;margin-top:2px">Wird neu angelegt</div>`
                        : ''}
                    </div>
                    ${!isApplied ? `<button onclick="startEditHandlistItem(${idx})" title="Name bearbeiten"
                      style="padding:3px 4px;border:none;background:transparent;cursor:pointer;color:#8d6562;flex-shrink:0">
                      <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                    </button>` : ''}
                  </div>
                </td>
                <td style="padding:11px 14px;text-align:center;font-size:14px;font-weight:700;color:#261816;white-space:nowrap">
                  ${item.menge != null ? item.menge : '—'}
                </td>
                <td style="padding:11px 14px;font-size:13px;color:#5a403c;white-space:nowrap">
                  ${escHtml(item.einheit || 'Stk')}
                </td>
                <td style="padding:11px 16px;text-align:center">
                  <button onclick="applyHandlistItem(${idx}, this)" ${isApplied ? 'disabled' : ''}
                    style="padding:7px 14px;border-radius:10px;border:1.5px solid ${isApplied ? '#c7c9f9' : sc.border};background:${isApplied ? '#dfe0ff' : sc.bg};color:${isApplied ? '#0d2ccc' : sc.text};font-size:12px;font-weight:600;font-family:inherit;cursor:${isApplied ? 'default' : 'pointer'};white-space:nowrap;display:inline-flex;align-items:center;gap:4px">
                    ${isApplied
                      ? '<span class="material-symbols-outlined" style="font-size:14px">check</span> Übernommen'
                      : '<span class="material-symbols-outlined" style="font-size:14px">add</span> Übernehmen'}
                  </button>
                </td>
              </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>

        <!-- Footer actions -->
        <div style="padding:14px 20px;border-top:1px solid #fde04744;display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;background:#fffdf0">
          <button onclick="discardHandlist()"
            style="padding:10px 18px;border-radius:12px;border:1px solid #e3beb8;background:#fff;font-size:13px;color:#5a403c;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span> Verwerfen
          </button>
          <button onclick="applySelectedHandlistItems()"
            style="padding:10px 18px;border-radius:12px;border:1.5px solid #fde047;background:#fefce8;font-size:13px;font-weight:600;color:#854d0e;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">checklist</span> Auswahl übernehmen
          </button>
          <button onclick="applyAllHandlistItems()" ${allApplied ? 'disabled' : ''}
            style="padding:10px 20px;border-radius:12px;border:none;font-size:13px;font-weight:700;font-family:inherit;cursor:${allApplied ? 'default' : 'pointer'};display:flex;align-items:center;gap:6px;background:${allApplied ? '#e3beb8' : 'linear-gradient(135deg,#854d0e,#a16207)'};color:${allApplied ? '#5a403c' : '#fff'}">
            <span class="material-symbols-outlined" style="font-size:16px">playlist_add_check</span>
            ${allApplied ? 'Alle übernommen' : '✓ Alle übernehmen'}
          </button>
        </div>
      </div>`;
  }

  return html;
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — State
// ═══════════════════════════════════════════════════════════════

const PRICELIST_STATE = {
  rawData: null,       // Array<Array> — first row = headers
  headers: [],
  fileName: null,
  colName: null,       // column index for product name
  colPreis: null,      // column index for price
  colEinheit: null,    // column index for unit (optional)
  selectedShop: '',
  selectedShopName: '',
  importResult: null,  // { imported, newProducts, unmatched, unknownNames }
  importDate: null,
  error: null,
};

// ═══════════════════════════════════════════════════════════════
// PRICELIST — File Handling
// ═══════════════════════════════════════════════════════════════

function handlePricelistDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file) handlePricelistFile(file);
}

function handlePricelistSelect(input) {
  const file = input.files[0];
  if (file) handlePricelistFile(file);
}

function handlePricelistFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
    PRICELIST_STATE.error = 'Bitte eine Excel (.xlsx, .xls) oder CSV (.csv) Datei hochladen.';
    renderUploadTab();
    return;
  }
  PRICELIST_STATE.error = null;
  PRICELIST_STATE.fileName = file.name;
  PRICELIST_STATE.rawData = null;
  PRICELIST_STATE.importResult = null;
  PRICELIST_STATE.colName = null;
  PRICELIST_STATE.colPreis = null;
  PRICELIST_STATE.colEinheit = null;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      if (typeof XLSX === 'undefined') throw new Error('SheetJS nicht geladen. Bitte Seite neu laden.');
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rows || rows.length < 2) {
        PRICELIST_STATE.error = 'Datei enthält keine Daten oder ist leer.';
        renderUploadTab();
        return;
      }
      const headerRow = rows[0].map(h => String(h ?? '').trim());
      PRICELIST_STATE.headers = headerRow;
      PRICELIST_STATE.rawData = rows;
      const det = autoDetectColumns(headerRow);
      PRICELIST_STATE.colName   = det.colName;
      PRICELIST_STATE.colPreis  = det.colPreis;
      PRICELIST_STATE.colEinheit = det.colEinheit;
    } catch (err) {
      PRICELIST_STATE.error = 'Datei konnte nicht gelesen werden: ' + (err.message || String(err));
    }
    renderUploadTab();
  };
  reader.onerror = () => { PRICELIST_STATE.error = 'Fehler beim Lesen der Datei.'; renderUploadTab(); };
  reader.readAsArrayBuffer(file);
}

function autoDetectColumns(headers) {
  const nameKw  = ['name','bezeichnung','artikel','produkt','description','item','ware','text','title'];
  const priceKw = ['preis','price','ek','netto','brutto','betrag','eur','€','cost','vk','einkauf'];
  const unitKw  = ['einheit','unit','mengeneinheit','me','vpe','gebinde'];
  let colName = null, colPreis = null, colEinheit = null;
  headers.forEach((h, i) => {
    const hl = h.toLowerCase();
    if (colName    === null && nameKw.some(k  => hl.includes(k)))  colName    = i;
    if (colPreis   === null && priceKw.some(k => hl.includes(k)))  colPreis   = i;
    if (colEinheit === null && unitKw.some(k  => hl.includes(k)))  colEinheit = i;
  });
  if (colName  === null) colName  = 0;
  if (colPreis === null) colPreis = Math.min(1, headers.length - 1);
  return { colName, colPreis, colEinheit };
}

function resetPricelist() {
  Object.assign(PRICELIST_STATE, {
    rawData: null, headers: [], fileName: null,
    colName: null, colPreis: null, colEinheit: null,
    selectedShop: '', selectedShopName: '',
    importResult: null, importDate: null, error: null,
  });
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Product Name Matching
// ═══════════════════════════════════════════════════════════════

function matchProductByName(name) {
  const n = name.toLowerCase().trim();
  let p = PRODUCTS.find(p => p.name.toLowerCase() === n);
  if (p) return p;
  p = PRODUCTS.find(p => n.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(n));
  if (p) return p;
  const words = n.split(/[\s,\-\/]+/).filter(w => w.length > 3);
  for (const word of words) {
    p = PRODUCTS.find(pr => pr.name.toLowerCase().includes(word) || pr.id.includes(word));
    if (p) return p;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Import
// ═══════════════════════════════════════════════════════════════

function importPrices() {
  if (!PRICELIST_STATE.rawData) return;

  // Read current DOM values before validation (user may not have triggered onchange)
  const nameEl    = document.getElementById('pl-col-name');
  const preisEl   = document.getElementById('pl-col-preis');
  const einheitEl = document.getElementById('pl-col-einheit');
  const shopEl    = document.getElementById('pl-shop');
  if (nameEl)    PRICELIST_STATE.colName    = nameEl.value    === '0' ? null : parseInt(nameEl.value)    - 1;
  if (preisEl)   PRICELIST_STATE.colPreis   = preisEl.value   === '0' ? null : parseInt(preisEl.value)   - 1;
  if (einheitEl) PRICELIST_STATE.colEinheit = einheitEl.value === '0' ? null : parseInt(einheitEl.value) - 1;
  if (shopEl)    PRICELIST_STATE.selectedShop = shopEl.value;

  if (PRICELIST_STATE.colName  === null) { PRICELIST_STATE.error = 'Bitte die Produktname-Spalte zuordnen.'; renderUploadTab(); return; }
  if (PRICELIST_STATE.colPreis === null) { PRICELIST_STATE.error = 'Bitte die Preis-Spalte zuordnen.';       renderUploadTab(); return; }
  if (!PRICELIST_STATE.selectedShop)    { PRICELIST_STATE.error = 'Bitte einen Händler auswählen.';          renderUploadTab(); return; }

  const shopId = PRICELIST_STATE.selectedShop;

  // Add shop to SHOPS if new (makes it visible in Geschäfte + Kombis tabs)
  if (!SHOPS.find(s => s.id === shopId)) {
    const extra = IMPORT_SHOPS_EXTRA.find(s => s.id === shopId);
    if (extra) SHOPS.push({ ...extra });
  }
  if (!PRICE_MAP[shopId]) PRICE_MAP[shopId] = {};

  const rows = PRICELIST_STATE.rawData.slice(1);
  let imported = 0, newProducts = 0;
  const unknownNames = [];

  for (const row of rows) {
    const rawName  = row[PRICELIST_STATE.colName];
    const rawPreis = row[PRICELIST_STATE.colPreis];
    const rawUnit  = PRICELIST_STATE.colEinheit !== null ? row[PRICELIST_STATE.colEinheit] : null;

    if (rawName == null || String(rawName).trim() === '') continue;
    const name = String(rawName).trim();
    const preis = parseFloat(String(rawPreis ?? '').replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (!name || isNaN(preis) || preis <= 0) continue;

    const matched = matchProductByName(name);
    if (matched) {
      PRICE_MAP[shopId][matched.id] = preis;
      imported++;
    } else {
      // Create new product entry
      const existing = PRODUCTS.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        PRICE_MAP[shopId][existing.id] = preis;
        imported++;
      } else {
        const id = 'import-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28) + '-' + (Date.now() % 10000);
        PRODUCTS.push({
          id, name,
          category: 'Sonstiges',
          unit: rawUnit ? String(rawUnit).trim() : 'Stk',
          currentStock: 0, minStock: 1, orderQuantity: 1,
        });
        stockLevels[id] = 0;
        PRICE_MAP[shopId][id] = preis;
        imported++;
        newProducts++;
        unknownNames.push(name);
      }
    }
  }

  const shopObj = allImportShops().find(s => s.id === shopId);
  PRICELIST_STATE.selectedShopName = shopObj ? shopObj.name : shopId;
  PRICELIST_STATE.importResult = { imported, newProducts, unmatched: unknownNames.length, unknownNames };
  PRICELIST_STATE.importDate = new Date().toISOString().slice(0, 10);
  PRICELIST_STATE.error = null;
  updateHeaderBadge();
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Render Section
// ═══════════════════════════════════════════════════════════════

function renderPricelistSection() {
  const shops = allImportShops();
  let html = `
    <div style="margin:40px 0 32px;display:flex;align-items:center;gap:14px">
      <div style="flex:1;height:1px;background:#e3beb8"></div>
      <span style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">oder</span>
      <div style="flex:1;height:1px;background:#e3beb8"></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="width:44px;height:44px;border-radius:14px;background:#e8f4fd;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:24px;color:#003DA5">table_chart</span>
      </div>
      <div>
        <h2 style="font-size:16px;font-weight:700;color:#261816;margin-bottom:2px">📊 Preisliste importieren</h2>
        <p style="font-size:12px;color:#5a403c">Excel oder CSV vom Großhändler direkt in die Preisdatenbank laden</p>
      </div>
    </div>`;

  if (PRICELIST_STATE.error) {
    html += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(PRICELIST_STATE.error)}</p>
        </div>
      </div>`;
  }

  html += `<input id="pricelist-file-input" type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="handlePricelistSelect(this)">`;

  if (!PRICELIST_STATE.rawData) {
    html += `
      <div id="pricelist-drop-zone"
        style="border:2px dashed #bee3f8;border-radius:18px;padding:44px 24px;text-align:center;cursor:pointer;background:#f0f7ff;transition:all .2s"
        onclick="document.getElementById('pricelist-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='#003DA5';this.style.background='#e8f4fd'"
        ondragleave="this.style.borderColor='#bee3f8';this.style.background='#f0f7ff'"
        ondrop="event.preventDefault();this.style.borderColor='#bee3f8';this.style.background='#f0f7ff';handlePricelistDrop(event)">
        <div style="width:72px;height:72px;border-radius:50%;background:#e8f4fd;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;border:2px solid #bee3f8">
          <span class="material-symbols-outlined" style="font-size:34px;color:#003DA5">upload_file</span>
        </div>
        <p style="font-size:15px;font-weight:700;color:#261816;margin-bottom:8px">Excel oder CSV hochladen</p>
        <p style="font-size:13px;color:#5a403c;margin-bottom:18px">Preisliste vom Großhändler hierher ziehen oder klicken</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          <span style="background:#fff;border:1px solid #bee3f8;border-radius:20px;padding:5px 14px;font-size:12px;color:#003DA5;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:13px">table_chart</span> .xlsx / .xls
          </span>
          <span style="background:#fff;border:1px solid #bee3f8;border-radius:20px;padding:5px 14px;font-size:12px;color:#003DA5;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:13px">description</span> .csv
          </span>
        </div>
      </div>`;

  } else if (PRICELIST_STATE.importResult) {
    const r = PRICELIST_STATE.importResult;
    html += `
      <div style="background:#c0eda6;border:1px solid #386a2033;border-radius:16px;padding:18px 20px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span class="material-symbols-outlined filled" style="font-size:26px;color:#386a20">check_circle</span>
          <span style="font-size:16px;font-weight:700;color:#0c2000">Import erfolgreich!</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:14px">
          <div style="background:#fff;border-radius:12px;padding:12px 14px">
            <div style="font-size:26px;font-weight:800;color:#386a20">${r.imported}</div>
            <div style="font-size:11px;color:#5a403c;margin-top:2px">Preise importiert</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 14px">
            <div style="font-size:26px;font-weight:800;color:${r.newProducts > 0 ? '#610000' : '#386a20'}">${r.newProducts}</div>
            <div style="font-size:11px;color:#5a403c;margin-top:2px">Neue Produkte</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 14px">
            <div style="font-size:26px;font-weight:800;color:#5a403c">${r.unmatched}</div>
            <div style="font-size:11px;color:#5a403c;margin-top:2px">Nicht zugeordnet</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#0c2000;flex-wrap:wrap">
          <span class="material-symbols-outlined" style="font-size:15px">schedule</span>
          Zuletzt importiert:&nbsp;<strong>${PRICELIST_STATE.importDate ? fmtDate(PRICELIST_STATE.importDate) : 'heute'}</strong>
          &nbsp;·&nbsp; Händler:&nbsp;<strong>${escHtml(PRICELIST_STATE.selectedShopName)}</strong>
          &nbsp;·&nbsp;
          <span style="color:#386a20">Preise ab sofort im Kombis Tab sichtbar ✓</span>
        </div>
      </div>`;

    if (r.unknownNames && r.unknownNames.length > 0) {
      const shown = r.unknownNames.slice(0, 20);
      html += `
        <div style="background:#fff;border:1px solid #e3beb8;border-radius:14px;padding:14px 18px;margin-bottom:16px">
          <p style="font-size:13px;font-weight:600;color:#261816;margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px;color:#5a403c">help_outline</span>
            Als neue Produkte angelegt (${r.unknownNames.length}):
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${shown.map(n => `<span style="background:#f8dcd8;border:1px solid #e3beb8;border-radius:8px;padding:3px 10px;font-size:12px;color:#5a403c">${escHtml(n)}</span>`).join('')}
            ${r.unknownNames.length > 20 ? `<span style="font-size:12px;color:#8d6562;align-self:center">+${r.unknownNames.length - 20} weitere</span>` : ''}
          </div>
        </div>`;
    }

    html += `
      <button onclick="resetPricelist()"
        style="padding:10px 20px;border-radius:12px;border:1px solid #bee3f8;background:#fff;font-size:13px;color:#003DA5;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">upload_file</span> Neue Datei importieren
      </button>`;

  } else {
    // ── Column mapping + shop selection ──
    const headers   = PRICELIST_STATE.headers;
    const preview   = PRICELIST_STATE.rawData.slice(1, 6);
    const dataCount = PRICELIST_STATE.rawData.length - 1;
    const opts      = ['(nicht verwenden)', ...headers.map((h, i) => `Sp. ${i+1}${h ? ': '+h : ''}`)];
    const nameIdx   = PRICELIST_STATE.colName    !== null ? PRICELIST_STATE.colName    + 1 : 0;
    const preisIdx  = PRICELIST_STATE.colPreis   !== null ? PRICELIST_STATE.colPreis   + 1 : 0;
    const unitIdx   = PRICELIST_STATE.colEinheit !== null ? PRICELIST_STATE.colEinheit + 1 : 0;

    html += `
      <div style="background:#fff;border:1px solid #bee3f866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,61,165,.08)">

        <!-- File bar -->
        <div style="padding:12px 18px;border-bottom:1px solid #bee3f844;display:flex;align-items:center;justify-content:space-between;background:#e8f4fd">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#003DA5">table_chart</span>
            <span style="font-size:13px;font-weight:600;color:#261816;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(PRICELIST_STATE.fileName || '')}</span>
            <span style="font-size:11px;color:#003DA5;background:rgba(0,61,165,.1);padding:2px 9px;border-radius:10px;white-space:nowrap">${dataCount} Zeilen</span>
          </div>
          <button onclick="resetPricelist()"
            style="padding:5px 12px;border-radius:10px;border:1px solid #bee3f8;background:#fff;font-size:12px;color:#003DA5;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">close</span> Entfernen
          </button>
        </div>

        <!-- Preview table -->
        <div style="padding:16px 18px;border-bottom:1px solid #e3beb844">
          <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">
            Vorschau — erste ${Math.min(5, preview.length)} Datenzeilen
          </p>
          <div style="overflow-x:auto;border-radius:10px;border:1px solid #bee3f8">
            <table style="width:100%;border-collapse:collapse;min-width:300px">
              <thead>
                <tr style="background:#e8f4fd">
                  ${headers.map(h => `<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#003DA5;white-space:nowrap;border-right:1px solid #bee3f844;max-width:150px;overflow:hidden;text-overflow:ellipsis">${escHtml(String(h||''))}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${preview.map((row, ri) => `
                  <tr style="border-top:1px solid #e3beb833;background:${ri%2===0?'#fff':'#f8fbff'}">
                    ${headers.map((_,ci) => `<td style="padding:7px 12px;font-size:12px;color:#261816;border-right:1px solid #e3beb822;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(String(row[ci]??''))}</td>`).join('')}
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Column mapping -->
        <div style="padding:16px 18px;border-bottom:1px solid #e3beb844;background:#f8fbff">
          <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px">Spalten zuordnen</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:12px">
            <div>
              <label style="font-size:12px;font-weight:600;color:#261816;display:block;margin-bottom:5px">
                Produktname <span style="color:#ba1a1a">*</span>
              </label>
              <select id="pl-col-name" onchange="PRICELIST_STATE.colName=this.value==='0'?null:parseInt(this.value)-1"
                style="width:100%;padding:9px 12px;border:1.5px solid #bee3f8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
                ${opts.map((o,i) => `<option value="${i}" ${i===nameIdx?'selected':''}>${escHtml(o)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#261816;display:block;margin-bottom:5px">
                Preis (€) <span style="color:#ba1a1a">*</span>
              </label>
              <select id="pl-col-preis" onchange="PRICELIST_STATE.colPreis=this.value==='0'?null:parseInt(this.value)-1"
                style="width:100%;padding:9px 12px;border:1.5px solid #bee3f8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
                ${opts.map((o,i) => `<option value="${i}" ${i===preisIdx?'selected':''}>${escHtml(o)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#261816;display:block;margin-bottom:5px">Einheit (optional)</label>
              <select id="pl-col-einheit" onchange="PRICELIST_STATE.colEinheit=this.value==='0'?null:parseInt(this.value)-1"
                style="width:100%;padding:9px 12px;border:1.5px solid #bee3f8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
                ${opts.map((o,i) => `<option value="${i}" ${i===unitIdx?'selected':''}>${escHtml(o)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Shop selection -->
        <div style="padding:16px 18px;border-bottom:1px solid #e3beb844">
          <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">
            Händler <span style="color:#ba1a1a">*</span>
          </p>
          <select id="pl-shop" onchange="PRICELIST_STATE.selectedShop=this.value"
            style="width:100%;max-width:340px;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
            <option value="">— Händler auswählen —</option>
            ${shops.map(s => `<option value="${s.id}" ${PRICELIST_STATE.selectedShop===s.id?'selected':''}>${escHtml(s.name)}</option>`).join('')}
          </select>
        </div>

        <!-- Import button -->
        <div style="padding:18px">
          <button onclick="importPrices()"
            style="width:100%;padding:16px;border-radius:14px;border:none;font-size:15px;font-weight:700;font-family:inherit;color:#fff;background:linear-gradient(135deg,#003DA5,#0050AA);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 12px rgba(0,61,165,.3)">
            <span class="material-symbols-outlined" style="font-size:22px">download_done</span>
            Preise importieren
          </button>
        </div>
      </div>`;
  }

  return html;
}


// ═══════════════════════════════════════════════════════════════
// js/business.js
// ═══════════════════════════════════════════════════════════════
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
  return localStorage.getItem(BIZ_PW_KEY) || null;
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

function bizGetPersonal() {
  return bizLoad('personal', []);
}
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
function bizToday() { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
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
      ['biz-rollen','manage_accounts','Rollen'],
    ].map(([id,icon,label]) => `
      <button id="btn-${id}" onclick="showBizSection('${id}')" class="ws-btn ws-btn-secondary ws-btn-sm"
        style="display:flex;align-items:center;gap:6px;transition:all .15s">
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

  <!-- ROLLEN & BERECHTIGUNGEN -->
  <div id="biz-rollen" class="biz-section" style="display:none">${renderBizRollen()}</div>

</div>`;

  // activate first subnav button
  showBizSection('biz-kassabuch');
}

function showBizSection(id) {
  document.querySelectorAll('.biz-section').forEach(s => s.style.display = 'none');
  // Monatsbericht immer frisch rendern wenn geöffnet
  if (id === 'biz-report') {
    const el = document.getElementById('biz-report');
    if (el) el.innerHTML = renderBizReport();
    setTimeout(refreshBizReport, 50);
  }
  document.getElementById(id).style.display = 'block';
  document.querySelectorAll('[id^="btn-biz-"]').forEach(b => {
    b.classList.remove('biz-active','ws-btn-primary');
    b.classList.add('ws-btn-secondary');
  });
  const btn = document.getElementById('btn-' + id);
  if (btn) {
    btn.classList.add('biz-active','ws-btn-primary');
    btn.classList.remove('ws-btn-secondary');
  }
}

// Lieferanten-Rechnungen aus Turso laden und im Bericht anzeigen
async function refreshBizReport() {
  try {
    const { y, m } = bizCurrentMonth();
    const monthStr = y + '-' + String(m).padStart(2,'0');
    const prevM = m === 1 ? 12 : m-1;
    const prevY = m === 1 ? y-1 : y;
    const prevMonthStr = prevY + '-' + String(prevM).padStart(2,'0');

    const res = await fetch('/api/pdf');
    if (!res.ok) return;
    const docs = await res.json();

    // Rechnungen dieses Monats (von E-Mail-Sync)
    const thisMontRech = docs.filter(d => d.monat === monthStr && d.typ === 'rechnung');
    const prevMonRech = docs.filter(d => d.monat === prevMonthStr && d.typ === 'rechnung');

    const elTotal = document.getElementById('biz-rechnung-total');
    const elInfo = document.getElementById('biz-rechnung-info');
    const elGesamtAus = document.getElementById('biz-gesamt-aus');
    const elZusKosten = document.getElementById('biz-zusammenfassung-kosten');

    if (elTotal) {
      if (thisMontRech.length > 0) {
        elTotal.textContent = thisMontRech.length + ' Rechnung' + (thisMontRech.length > 1 ? 'en' : '') + ' vorhanden';
        elTotal.style.color = '#2e7d32';
        if (elInfo) elInfo.textContent = '→ Buchhaltung-Tab für Details';
      } else {
        elTotal.textContent = 'Noch keine Rechnungen diesen Monat';
        elTotal.style.color = '#e65100';
        if (elInfo && prevMonRech.length > 0) elInfo.textContent = '(' + prevMonRech.length + ' im Vormonat)';
      }
    }

    // Personalkosten aus echten Mitarbeitern berechnen und anzeigen
    const personal = bizGetPersonal();
    const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
    const personalEl = document.querySelector('#biz-report tr td:contains');

    // Hinweis: Personalkosten-Quelle anzeigen
    if (personal.length > 0 && elInfo) {
      const src = bizLoad('personal', []).length > 0 ? 'Biz-Einstellungen' : 'Mitarbeiter-DB';
      elInfo.textContent = src + ' · ' + personal.length + ' MA';
    }

  } catch(_) {}
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
        <button onclick="bizLogin()" class="ws-btn ws-btn-primary" style="width:100%;justify-content:center;gap:8px">
          <span class="material-symbols-outlined" style="font-size:18px">lock_open</span>
          Einloggen
        </button>
        <div id="biz-pw-error" style="color:#ba1a1a;font-size:12px;margin-top:10px;display:none">Falsches Passwort</div>
        <p style="font-size:11px;color:#8d6562;margin-top:20px">Session bleibt aktiv bis Browser geschlossen</p>
        <button onclick="switchTab('kombis')"
          style="margin-top:14px;width:100%;padding:9px;border-radius:10px;border:1.5px solid #e3beb8;background:transparent;color:#5a403c;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>
          Zurück zur App
        </button>
      </div>
    </div>`;
  setTimeout(() => document.getElementById('biz-pw-input')?.focus(), 50);
}

function bizLogin() {
  const input = document.getElementById('biz-pw-input');
  const err = document.getElementById('biz-pw-error');
  if (!input) return;
  const storedHash = bizGetPwHash();
  if (!storedHash) {
    // kein Passwort gesetzt → eingegebenes Passwort als neues setzen
    if (!input.value || input.value.length < 4) {
      if (err) { err.textContent = 'Bitte mind. 4 Zeichen als erstes Passwort eingeben.'; err.style.display = 'block'; }
      return;
    }
    _safeLocalSet(BIZ_PW_KEY, bizHash(input.value));
    bizSetAuth();
    const lockIcon = document.getElementById('biz-lock-icon');
    if (lockIcon) lockIcon.textContent = 'lock_open';
    renderBusinessTab();
    showBizSection('biz-kassabuch');
    return;
  }
  if (bizHash(input.value) === storedHash) {
    bizSetAuth();
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

function _syncKassaFromDB(cb) {
  fetch('/api/umsatz/alle').then(r => r.ok ? r.json() : Promise.reject()).then(rows => {
    const existing = bizGetKassa();
    rows.forEach(row => {
      if (!existing.find(e => e.date === row.datum)) {
        existing.push({ date: row.datum, bar: row.kasse||0, karte: row.lieferdienst||0, gesamt: (row.kasse||0)+(row.lieferdienst||0), speiseAnteil: 80 });
      }
    });
    bizSaveKassa(existing);
    if (cb) cb();
  }).catch(() => { if (cb) cb(); });
}

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

  // Break-even Tagesziel für Heute-Block
  const _fix = bizGetFixkosten();
  const _fixSum = Object.values(_fix).reduce((s,v)=>s+(+v||0),0);
  const _personal = bizGetPersonal();
  const _personalM = _personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const _tagesziel = Math.max(Math.round((_fixSum+_personalM)/30 + bizGetEinkaufThisMonth()/30), 80);
  const _todayRev  = todayEntry.gesamt || 0;
  const _zielPct   = Math.min(Math.round((_todayRev / _tagesziel) * 100), 100);
  const _zielOk    = _todayRev >= _tagesziel;

  return `
<!-- ═══ HEUTE-BLOCK ═══ -->
<div style="background:linear-gradient(135deg,#610000,#8B0000);border-radius:20px;padding:22px 24px;margin-bottom:20px;color:#fff;position:relative;overflow:hidden">
  <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">
    ${bizDayName(today)}, ${today.split('-').reverse().join('.')}
  </div>
  <div id="kassa-heute-gesamt" style="font-size:46px;font-weight:800;line-height:1.1;margin-bottom:10px;font-family:'Plus Jakarta Sans',sans-serif">
    ${bizEur(_todayRev)}
  </div>
  <div style="display:flex;gap:16px;font-size:13px;opacity:.9;margin-bottom:14px;flex-wrap:wrap">
    <span id="kassa-heute-bar">💵 Bar: ${bizEur(todayEntry.bar||0)}</span>
    <span id="kassa-heute-karte">💳 Karte: ${bizEur(todayEntry.karte||0)}</span>
  </div>
  <div style="background:rgba(255,255,255,.2);border-radius:8px;height:8px;margin-bottom:8px">
    <div id="kassa-heute-bar-pct" style="background:${_zielOk?'#69f0ae':'#fff'};border-radius:8px;height:8px;width:${_zielPct}%;transition:width .5s;max-width:100%"></div>
  </div>
  <div style="font-size:12px;opacity:.75">
    <span id="kassa-heute-ziel">Tagesziel: ${bizEur(_tagesziel)} · ${_zielPct}% erreicht${_zielOk?' ✅':''}</span>
  </div>
</div>

<!-- ═══ EINNAHMEN ERFASSEN ═══ -->
<div class="ws-card" style="margin-bottom:20px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px;display:flex;align-items:center;gap:6px">
    <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">edit_calendar</span>
    Heute erfassen
  </div>

  <!-- Bar -->
  <div style="margin-bottom:14px">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:6px">💵 Bar-Einnahmen (€)</label>
    <input type="number" id="kassa-bar" value="${todayEntry.bar||''}" min="0" step="0.01" placeholder="0,00"
      inputmode="decimal" oninput="bizUpdateKassaTotal()"
      style="width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:18px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box">
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      ${[50,100,200,500].map(a=>`<button onclick="bizAddToBar(${a})" class="kassa-schnell-btn">+${a}</button>`).join('')}
      <button onclick="bizResetField('kassa-bar')" class="kassa-schnell-btn" style="background:#ffeaea;border-color:#f5c2c2;color:#8B0000">✕ Reset</button>
    </div>
  </div>

  <!-- Karte -->
  <div style="margin-bottom:14px">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:6px">💳 Karten-Einnahmen (€)</label>
    <input type="number" id="kassa-karte" value="${todayEntry.karte||''}" min="0" step="0.01" placeholder="0,00"
      inputmode="decimal" oninput="bizUpdateKassaTotal()"
      style="width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:18px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box">
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      ${[50,100,200,500].map(a=>`<button onclick="bizAddToKarte(${a})" class="kassa-schnell-btn">+${a}</button>`).join('')}
      <button onclick="bizResetField('kassa-karte')" class="kassa-schnell-btn" style="background:#ffeaea;border-color:#f5c2c2;color:#8B0000">✕ Reset</button>
    </div>
  </div>

  <!-- Speisen-Anteil -->
  <div style="margin-bottom:16px">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:6px">🍕 Speisen-Anteil (%)</label>
    <input type="number" id="kassa-speise" value="${sa}" min="0" max="100"
      inputmode="numeric" oninput="bizUpdateKassaTotal()"
      style="width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #e3beb8;font-size:18px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box">
  </div>

  <!-- Gesamt + MwSt -->
  <div style="background:#fff0ee;border-radius:12px;padding:16px;margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e3beb8">
      <span style="font-size:15px;font-weight:700;color:#261816">Gesamt</span>
      <span id="kassa-gesamt-display" style="font-size:26px;font-weight:800;color:#610000">${bizEur(_todayRev)}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
      <div>
        <div style="color:#5a403c;margin-bottom:3px">Netto Speisen (10%)</div>
        <div id="kassa-netto-speise" style="font-weight:700;color:#261816">€ 0,00</div>
        <div id="kassa-mwst10" style="color:#8d6562;font-size:11px">MwSt 10%: € 0,00</div>
      </div>
      <div>
        <div style="color:#5a403c;margin-bottom:3px">Netto Getränke (20%)</div>
        <div id="kassa-netto-getraenk" style="font-weight:700;color:#261816">€ 0,00</div>
        <div id="kassa-mwst20" style="color:#8d6562;font-size:11px">MwSt 20%: € 0,00</div>
      </div>
    </div>
  </div>
  <button onclick="bizSaveKassaEntry()" class="ws-btn ws-btn-primary" style="width:100%;justify-content:center;gap:8px;font-size:15px;padding:14px">
    <span class="material-symbols-outlined" style="font-size:18px">save</span>Heute speichern
  </button>
</div>

<!-- 7-Tage Chart -->
<div class="ws-card" style="margin-bottom:20px">
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
<div class="ws-card" style="padding:0;overflow:hidden">
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
  // Heute-Block live updaten
  setEl('kassa-heute-gesamt', bizEur(gesamt));
  setEl('kassa-heute-bar', '💵 Bar: '+bizEur(bar));
  setEl('kassa-heute-karte', '💳 Karte: '+bizEur(karte));
  const fix = bizGetFixkosten(), personal = bizGetPersonal();
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalM = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const tagesziel = Math.max(Math.round((fixSum+personalM)/30 + bizGetEinkaufThisMonth()/30), 80);
  const pct = Math.min(Math.round((gesamt/tagesziel)*100),100);
  const ok = gesamt >= tagesziel;
  const pctBar = document.getElementById('kassa-heute-bar-pct');
  if (pctBar) { pctBar.style.width=pct+'%'; pctBar.style.background=ok?'#69f0ae':'#fff'; }
  setEl('kassa-heute-ziel', `Tagesziel: ${bizEur(tagesziel)} · ${pct}% erreicht${ok?' ✅':''}`);
}

function bizAddToBar(amount) {
  const inp = document.getElementById('kassa-bar');
  if (!inp) return;
  inp.value = ((parseFloat(inp.value)||0) + amount).toFixed(2);
  bizUpdateKassaTotal();
}

function bizAddToKarte(amount) {
  const inp = document.getElementById('kassa-karte');
  if (!inp) return;
  inp.value = ((parseFloat(inp.value)||0) + amount).toFixed(2);
  bizUpdateKassaTotal();
}

function bizResetField(id) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.value = '';
  bizUpdateKassaTotal();
}

function bizSaveKassaEntry() {
  const bar = parseFloat(document.getElementById('kassa-bar')?.value)||0;
  const karte = parseFloat(document.getElementById('kassa-karte')?.value)||0;
  const sa = parseFloat(document.getElementById('kassa-speise')?.value)||80;
  // Zahlvalidierung
  if (isNaN(bar) || bar < 0 || bar > 99999) return notifAdd('kassa','Ungültiger Betrag','Bar-Betrag muss zwischen 0 und 99.999 € liegen','warning','dashboard');
  if (isNaN(karte) || karte < 0 || karte > 99999) return notifAdd('kassa','Ungültiger Betrag','Karten-Betrag muss zwischen 0 und 99.999 € liegen','warning','dashboard');
  if (sa < 0 || sa > 100) return notifAdd('kassa','Ungültiger Wert','Speise-Anteil muss zwischen 0 und 100 % liegen','warning','dashboard');
  if (bar === 0 && karte === 0) return notifAdd('kassa','Leerer Eintrag','Bitte mindestens einen Betrag eingeben','warning','dashboard');
  const today = bizToday();
  let kassa = bizGetKassa();
  kassa = kassa.filter(e => e.date !== today);
  kassa.push({ date:today, bar, karte, gesamt:bar+karte, speiseAnteil:sa });
  bizSaveKassa(kassa);
  renderBusinessTab();
  showBizSection('biz-kassabuch');
  // Auch in DB speichern (fire-and-forget)
  fetch('/api/umsatz/heute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datum: today, kasse: bar, lieferdienst: karte })
  }).catch(function() {});
}

function bizDeleteKassaEntry(date) {
  _showConfirm('Eintrag für '+date.split('-').reverse().join('.')+' löschen?', function() {
    let kassa = bizGetKassa();
    kassa = kassa.filter(e => e.date !== date);
    bizSaveKassa(kassa);
    renderBusinessTab();
    showBizSection('biz-kassabuch');
  });
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
<div class="ws-card" style="margin-bottom:20px">
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
<div class="ws-card" style="margin-bottom:20px">
  <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:6px">
    <span style="display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">badge</span>
      Personal
    </span>
    <div style="display:flex;gap:6px">
      <button onclick="bizSyncPersonalFromDB()"
        style="padding:7px 14px;border-radius:9px;border:1.5px solid #2e7d32;background:#e8f5e9;color:#2e7d32;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px"
        title="Alle Mitarbeiter aus der Datenbank übernehmen">
        <span class="material-symbols-outlined" style="font-size:14px">sync</span> Aus DB laden
      </button>
      <button onclick="bizAddPersonal()"
        style="padding:7px 14px;border-radius:9px;border:1.5px solid #8B0000;background:#fff0ee;color:#8B0000;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px">
        <span class="material-symbols-outlined" style="font-size:14px">add</span> Manuell
      </button>
    </div>
  </div>
  <div id="personal-list">
    ${personal.length === 0 ? '<p style="color:#8d6562;font-size:13px;text-align:center;padding:20px 0">Keine Mitarbeiter — „Aus DB laden" klicken</p>' :
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
<div class="ws-card">
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
      <input value="${escHtml(p.name||'')}" placeholder="Name"
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
      <button onclick="bizDeletePersonal(${i})"
        style="border:none;background:#ffdad6;color:#ba1a1a;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:13px">✕</button>
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
  const p = bizLoad('personal', []);
  p.splice(i,1);
  bizSavePersonal(p);
  document.getElementById('personal-list').innerHTML = p.length===0
    ? '<p style="color:#8d6562;font-size:13px;text-align:center;padding:20px 0">Keine Mitarbeiter — „Aus DB laden" klicken</p>'
    : p.map((pp,ii)=>renderPersonalRow(pp,ii)).join('');
}

function bizSyncPersonalFromDB() {
  try {
    const ma = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter') || '[]');
    const aktiv = ma.filter(m => parseFloat(m.lohn) > 0 || parseFloat(m.stunden) > 0);
    if (aktiv.length === 0) { _showToast('Keine Mitarbeiter in der Datenbank', 'info'); return; }
    const personal = aktiv.map(m => ({ name: m.name||'MA', lohn: parseFloat(m.lohn)||0, stunden: parseFloat(m.stunden)||40 }));
    bizSavePersonal(personal);
    document.getElementById('personal-list').innerHTML = personal.map((pp,i)=>renderPersonalRow(pp,i)).join('');
    const total = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
    _showToast(aktiv.length + ' Mitarbeiter übernommen — Personalkosten: ' + bizEur(total) + '/Monat', 'success');
  } catch(e) { _showToast('Fehler: ' + e.message, 'error'); }
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
<div class="ws-card" style="margin-bottom:20px">
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

<!-- Pizza-Kalkulation -->
<div class="ws-card" style="padding:0;overflow:hidden;margin-bottom:8px">
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
      <td style="padding:9px 14px;font-weight:600;color:#261816">${escHtml(p.name)}</td>
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

function bizSavePizzaCalcBtn() {
  const d = bizGetPizzaCalc();
  d.forEach((p, i) => {
    const preis = parseFloat(document.querySelector(`#pizza-calc-tbody tr:nth-child(${i+1}) input[onchange*="preis"]`)?.value);
    const kosten = parseFloat(document.querySelector(`#pizza-calc-tbody tr:nth-child(${i+1}) input[onchange*="kosten"]`)?.value);
    if (!isNaN(preis)) p.preis = preis;
    if (!isNaN(kosten)) p.kosten = kosten;
  });
  bizSavePizzaCalc(d);
  bizShowToast('✅ Pizza-Kalkulation gespeichert');
}

// ═══════════════════════════════════════════════════════════════
// MONATSBERICHT
// ═══════════════════════════════════════════════════════════════

