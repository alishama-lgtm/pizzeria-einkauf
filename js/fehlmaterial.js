// ═══════════════════════════════════════════════════════════════
// FEHLMATERIAL
// ═══════════════════════════════════════════════════════════════

const FM_KEY = 'pizzeria_fehlmaterial';
let FM_DATA = [];
try { FM_DATA = JSON.parse(localStorage.getItem(FM_KEY) || '[]'); } catch(_) { FM_DATA = []; }

function fmSave() {
  try { localStorage.setItem(FM_KEY, JSON.stringify(FM_DATA)); } catch(_) {}
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
}

function fmSetStatus(id, newStatus) {
  const e = FM_DATA.find(x => x.id === id);
  if (!e) return;
  e.status = newStatus;
  e.statusDatum = new Date().toISOString().slice(0, 10);
  if (newStatus === 'erledigt') e.erledigungsDatum = new Date().toISOString();
  fmSave();
  fmUpdateBadge();
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

  panel.innerHTML =
    '<div class="ws-section-header" style="margin-bottom:20px">' +
    '<div class="ws-section-title">' +
    '<span class="material-symbols-outlined">assignment_late</span>Fehlmaterial' +
    (dringendCount>0 ? '<span class="ws-badge ws-badge-red">' + dringendCount + ' dringend</span>' : '') +
    '</div></div>' +
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
    ? '<div style="text-align:center;padding:48px 20px;color:#9ca3af;font-size:14px">Keine Einträge gefunden</div>'
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
          (e.status==='erledigt'?'text-decoration:line-through;':'')+'">' + e.produktName + '</div>' +
          (e.bemerkung ? '<div style="font-size:12px;color:#9ca3af;margin-bottom:4px">'+e.bemerkung+'</div>' : '') +

          '<div style="font-size:11px;color:#9ca3af;margin-bottom:10px">' +
          (e.eingetragenVon||'—') + ' · ' + e.datum + ' ' + e.uhrzeit +
          ' · <span style="background:#f0f0f5;color:#6b7280;border-radius:5px;padding:1px 6px">'+e.kategorie+'</span>' +
          '</div>' +

          '<div style="display:flex;gap:6px">' +
          (e.status==='offen'
            ? '<button onclick="fmSetStatus(\''+e.id+'\',\'bestellt\')" style="min-height:44px;padding:8px 12px;border-radius:8px;border:none;background:#fff8e1;color:#e65100;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;white-space:nowrap;flex:1"><span class="material-symbols-outlined" style="font-size:15px">shopping_cart</span>📦 Bestellt</button>'
            : '') +
          (e.status!=='erledigt'
            ? '<button onclick="fmSetStatus(\''+e.id+'\',\'erledigt\')" style="min-height:44px;padding:8px 12px;border-radius:8px;border:none;background:#e8f5e9;color:#2e7d32;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;white-space:nowrap;flex:1"><span class="material-symbols-outlined" style="font-size:15px">check_circle</span>✅ Erledigt</button>'
            : '') +
          '<button onclick="if(confirm(\'Löschen?\'))fmDelete(\''+e.id+'\')" style="min-height:44px;width:44px;border-radius:8px;border:1.5px solid #e8e8ed;background:#fff;color:#9ca3af;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>' +
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

  if (!produktName) { fmShowToast('❌ Bitte Produktname eingeben!'); document.getElementById('fm-produktname')?.focus(); return; }
  const menge = parseFloat(mengeRaw);
  if (!mengeRaw || isNaN(menge) || menge <= 0) { fmShowToast('❌ Bitte gültige Menge eingeben!'); document.getElementById('fm-menge')?.focus(); return; }
  if (!eingetragenVon) { fmShowToast('❌ Bitte Namen eingeben!'); document.getElementById('fm-person')?.focus(); return; }

  const matchProd = PRODUCTS.find(p => p.name.toLowerCase() === produktName.toLowerCase());
  fmAdd({ produktName, produktId: matchProd?.id||null, menge, einheit, kategorie, prioritaet, bemerkung, eingetragenVon });
  localStorage.setItem('fm_last_person', eingetragenVon);
  fmShowToast('✅ Fehlmaterial gemeldet!');
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
    ? '<div class="ws-card" style="text-align:center;padding:60px 20px;color:#9ca3af;font-size:14px">Keine Einträge gefunden</div>'
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
            (e.bemerkung?'<span style="font-size:12px;color:#9ca3af;margin-left:6px">'+e.bemerkung+'</span>':'') +
            '</div>' +
            '<span style="font-size:11px;color:#9ca3af;flex-shrink:0">'+e.kategorie+'</span>' +
            '<span style="font-size:12px;color:#9ca3af;flex-shrink:0">'+(e.eingetragenVon||'—')+' · '+e.uhrzeit+'</span>' +
            '<span style="display:inline-flex;padding:2px 8px;border-radius:20px;font-size:11px;' +
            'font-weight:700;background:'+stat.bg+';color:'+stat.color+';border:1px solid '+stat.border+';flex-shrink:0;white-space:nowrap">'+stat.label+'</span>' +
            '</div>';
        }).join('');
        return '<div class="ws-card ws-card-sm" style="margin-bottom:16px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
          '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:16px;font-weight:800;color:#1e1e2e">'+dateLabel+
          '<span style="font-size:13px;font-weight:500;color:#9ca3af;margin-left:8px">'+wochentag+'</span></div>' +
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
      '</div><div style="font-size:11px;color:#9ca3af">'+dayNames[i]+'</div></div>';
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
      '<div style="font-size:11px;color:#9ca3af;margin-top:2px">aus ' + erledigte.length + ' erledigten Fällen</div>' +
      '</div>';
  }

  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px">' +

    '<div class="ws-card">' +
    '<div class="ws-section-title" style="font-size:16px;margin-bottom:16px"><span class="material-symbols-outlined">trending_up</span>Top 5 Fehlmaterialien</div>' +
    (top5Html || '<div style="color:#9ca3af;text-align:center;padding:20px">Keine Daten</div>') +
    '</div>' +

    '<div class="ws-card">' +
    '<div class="ws-section-title" style="font-size:16px;margin-bottom:16px"><span class="material-symbols-outlined">calendar_today</span>Meldungen nach Wochentag</div>' +
    '<div style="display:flex;gap:4px;height:80px;margin-bottom:8px">' + dayHtml + '</div>' +
    (dayCounts[busiestDay]>0 ? '<div style="text-align:center;font-size:13px;color:#6b7280;margin-top:8px">Meiste Meldungen am <strong style="color:#8B0000">'+dayFull[busiestDay]+'</strong> ('+dayCounts[busiestDay]+'×)</div>' : '') +
    '</div>' +

    '<div class="ws-card" style="grid-column:1/-1">' +
    '<div class="ws-section-title" style="font-size:16px;margin-bottom:16px"><span class="material-symbols-outlined" style="color:#c62828">warning</span>Kritische Artikel <span style="font-size:13px;font-weight:500;color:#9ca3af">(3× oder öfter)</span></div>' +
    (critical.length===0
      ? '<div style="text-align:center;padding:24px;color:#9ca3af;font-size:14px"><span style="font-size:32px">✅</span><br>Keine kritischen Artikel — sehr gut!</div>'
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

// ════ FM TOAST ════
function fmShowToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:96px;left:50%;transform:translateX(-50%);background:#1e1e2e;color:#fff;padding:12px 24px;border-radius:12px;font-size:15px;font-weight:700;z-index:9999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.25)';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
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
  if (!menge || isNaN(menge) || menge <= 0) { fmShowToast('❌ Bitte gültige Menge eingeben'); return; }
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
  if (person) localStorage.setItem('fm_last_person', person);
  document.getElementById('abfall-modal-overlay')?.remove();
  fmShowToast('✅ Abfall gespeichert — ' + (p?p.name:productId) + ' ' + menge + ' ' + (p?p.unit:''));
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
  fmShowToast('📦 Eingang gesetzt: ' + today);
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
      <div style="font-size:12px;color:#9ca3af;margin-top:12px">
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
    '<div class="ws-section-header" style="margin-bottom:20px">' +
    '<div class="ws-section-title"><span class="material-symbols-outlined">checklist</span>Tages-Checkliste</div>' +
    '</div>' + subNav + content;
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
    '<span style="font-size:13px;font-weight:500;color:#9ca3af;margin-left:8px">'+today+'</span>' +
    '</div>' +
    '<div style="font-size:13px;color:#9ca3af;margin-bottom:20px">Tippe zum Abhaken — am Ende mit Namen abschließen</div>' +
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
  if (!person) { fmShowToast('❌ Bitte Namen eingeben'); return; }
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
  if (person) localStorage.setItem('fm_last_person', person);
  fmShowToast('✅ '+(typ==='morgen'?'Morgen':'Abend')+'-Checkliste abgeschlossen!');
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
      label + '<span style="font-size:13px;font-weight:500;color:#9ca3af;margin-left:8px">'+wochentag+'</span></div>' +
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