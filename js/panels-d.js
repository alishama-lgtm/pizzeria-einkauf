function bwNeu() { bwFormular(null); }

// ═══════════════════════════════════════════════════════════════
// DB BROWSER — Admin-only Datenbank-Editor
// ═══════════════════════════════════════════════════════════════

var _dbCurrentKey = null;
var _dbCurrentData = null;

async function dbBrowserOpen() {
  document.getElementById('db-browser-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'db-browser-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:stretch;justify-content:flex-end';
  modal.innerHTML = `
    <div style="width:min(820px,100%);background:#fff;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,.3)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#1565c0;color:#fff;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="material-symbols-outlined">database</span>
          <div>
            <div style="font-size:15px;font-weight:800">DB Browser</div>
            <div style="font-size:11px;opacity:.8">Pizzeria San Carino — Datenbank</div>
          </div>
        </div>
        <button onclick="document.getElementById('db-browser-modal').remove()" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:7px;cursor:pointer;line-height:0;color:#fff">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div style="display:flex;flex:1;overflow:hidden">
        <!-- Sidebar: Key-Liste -->
        <div id="db-key-list" style="width:220px;flex-shrink:0;border-right:1px solid #e0e0e0;overflow-y:auto;background:#f8f9fa">
          <div style="padding:10px 14px;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e0e0e0">Datenbank-Keys</div>
          <div id="db-key-items" style="padding:6px 0">
            <div style="padding:20px;text-align:center;color:#999;font-size:12px">Lade...</div>
          </div>
        </div>
        <!-- Content: Tabelle -->
        <div id="db-content" style="flex:1;overflow-y:auto;padding:0">
          <div style="padding:40px;text-align:center;color:#999">
            <span class="material-symbols-outlined" style="font-size:48px;display:block;margin-bottom:12px">touch_app</span>
            <div style="font-size:14px">Key aus der Liste wählen</div>
          </div>
        </div>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  await dbBrowserLoadKeys();
}

async function dbBrowserLoadKeys() {
  const r = await fetch('/api/admin/store');
  const d = await r.json();
  const container = document.getElementById('db-key-items');
  if (!container) return;

  // Auch Tabellen laden
  const tr = await fetch('/api/admin/tables');
  const td = await tr.json();

  var html = '';
  // SQLite Tabellen
  html += '<div style="padding:4px 14px;font-size:10px;font-weight:700;color:#1565c0;text-transform:uppercase;margin-top:4px">SQLite Tabellen</div>';
  (td.tabellen||[]).forEach(function(t) {
    html += '<div onclick="dbBrowserLoadTable(\'' + t.name + '\')" style="padding:8px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:12px;border-left:3px solid transparent" onmouseover="this.style.background=\'#e8f0fe\'" onmouseout="this.style.background=\'transparent\'">' +
      '<span style="font-weight:600;color:#333">' + t.name + '</span>' +
      '<span style="font-size:10px;color:#666;background:#e0e0e0;padding:1px 6px;border-radius:10px">' + t.zeilen + '</span></div>';
  });

  // syncStore Keys
  html += '<div style="padding:4px 14px;font-size:10px;font-weight:700;color:#1565c0;text-transform:uppercase;margin-top:8px">App-Daten (syncStore)</div>';
  (d.keys||[]).forEach(function(k) {
    html += '<div onclick="dbBrowserLoadKey(\'' + k.key + '\')" style="padding:7px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:11px;border-left:3px solid transparent" onmouseover="this.style.background=\'#e8f0fe\'" onmouseout="this.style.background=\'transparent\'">' +
      '<span style="color:#333;word-break:break-all">' + k.key + '</span>' +
      '<span style="font-size:10px;color:#666;background:#e0e0e0;padding:1px 5px;border-radius:10px;flex-shrink:0;margin-left:4px">' + k.count + '</span></div>';
  });
  container.innerHTML = html;
}

async function dbBrowserLoadKey(key) {
  _dbCurrentKey = key;
  const content = document.getElementById('db-content');
  if (!content) return;
  content.innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:12px">Lade...</div>';

  // Aktiven Key markieren
  document.querySelectorAll('#db-key-items div[onclick]').forEach(function(el) {
    el.style.background = 'transparent';
    el.style.borderLeftColor = 'transparent';
    el.style.fontWeight = '';
  });
  event?.target?.closest('[onclick]')?.style && (function(el){ el.style.background='#e8f0fe'; el.style.borderLeftColor='#1565c0'; })(event.target.closest('[onclick]'));

  const r = await fetch('/api/admin/store/' + encodeURIComponent(key));
  const d = await r.json();
  if (!d.ok) { content.innerHTML = '<div style="padding:20px;color:#c62828">' + (d.error||'Fehler') + '</div>'; return; }
  _dbCurrentData = d.data;

  var html = '<div style="padding:14px 20px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;background:#f8f9fa;flex-shrink:0">';
  html += '<div><div style="font-size:14px;font-weight:800;color:#1565c0">' + key + '</div>';
  html += '<div style="font-size:11px;color:#666">' + (Array.isArray(d.data) ? d.data.length + ' Einträge' : typeof d.data) + '</div></div>';
  html += '<div style="display:flex;gap:6px">';
  html += '<button onclick="dbBrowserExport(\'' + key + '\')" style="padding:6px 12px;background:#e8f0fe;color:#1565c0;border:1px solid #9fc3f8;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">⬇ Export</button>';
  html += '<button onclick="dbBrowserClearKey(\'' + key + '\')" style="padding:6px 12px;background:#fde8e8;color:#c62828;border:1px solid #f5c6c6;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🗑 Leeren</button>';
  html += '</div></div>';

  if (Array.isArray(d.data) && d.data.length > 0) {
    // Array als Tabelle
    var cols = Object.keys(d.data[0] || {}).slice(0, 8);
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<thead><tr style="background:#f0f4ff;position:sticky;top:0">';
    html += '<th style="padding:8px 10px;text-align:left;font-size:10px;color:#666;white-space:nowrap">#</th>';
    cols.forEach(function(c){ html += '<th style="padding:8px 10px;text-align:left;font-size:10px;color:#666;white-space:nowrap">' + c.toUpperCase() + '</th>'; });
    html += '<th style="padding:8px 10px;width:60px"></th></tr></thead><tbody>';
    d.data.slice(0, 100).forEach(function(row, i) {
      html += '<tr style="border-bottom:1px solid #f0f0f0" onmouseover="this.style.background=\'#f8f9fa\'" onmouseout="this.style.background=\'transparent\'">';
      html += '<td style="padding:7px 10px;color:#999;font-size:10px">' + (i+1) + '</td>';
      cols.forEach(function(c) {
        var v = row[c];
        var disp = v === null || v === undefined ? '<span style="color:#ccc">—</span>' : String(v).slice(0,60) + (String(v).length>60?'…':'');
        html += '<td style="padding:7px 10px;color:#333;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _esc(disp) + '</td>';
      });
      var itemId = row.id || row.ID || i;
      html += '<td style="padding:7px 10px">' +
        '<button onclick="dbBrowserEditItem(\'' + key + '\',' + i + ')" style="padding:3px 8px;background:#e8f0fe;color:#1565c0;border:none;border-radius:5px;font-size:10px;cursor:pointer;font-family:inherit;margin-right:3px">✏️</button>' +
        '<button onclick="dbBrowserDeleteItem(\'' + key + '\',\'' + _esc(String(itemId)) + '\')" style="padding:3px 8px;background:#fde8e8;color:#c62828;border:none;border-radius:5px;font-size:10px;cursor:pointer;font-family:inherit">🗑</button>' +
        '</td></tr>';
    });
    if (d.data.length > 100) html += '<tr><td colspan="' + (cols.length+2) + '" style="padding:10px;text-align:center;color:#666;font-size:11px">... ' + (d.data.length-100) + ' weitere Einträge (Export für alle)</td></tr>';
    html += '</tbody></table></div>';
  } else if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) {
    // Objekt als Key-Value Liste
    html += '<div style="padding:12px">';
    Object.entries(d.data).forEach(function([k, v]) {
      html += '<div style="display:flex;gap:10px;padding:8px 10px;border-bottom:1px solid #f0f0f0;align-items:flex-start">';
      html += '<div style="font-size:12px;font-weight:700;color:#1565c0;min-width:160px;flex-shrink:0">' + _esc(k) + '</div>';
      html += '<div style="font-size:12px;color:#333;word-break:break-all">' + _esc(String(v).slice(0,200)) + '</div></div>';
    });
    html += '</div>';
  } else {
    html += '<div style="padding:20px;font-size:13px;color:#333">' + _esc(JSON.stringify(d.data, null, 2).slice(0, 2000)) + '</div>';
  }

  content.innerHTML = html;
}

async function dbBrowserLoadTable(tableName) {
  _dbCurrentKey = null;
  const content = document.getElementById('db-content');
  if (!content) return;
  content.innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:12px">Lade...</div>';

  const r = await fetch('/api/admin/table/' + tableName + '?limit=100');
  const d = await r.json();
  if (!d.ok) { content.innerHTML = '<div style="padding:20px;color:#c62828">' + (d.error||'Fehler') + '</div>'; return; }

  var html = '<div style="padding:14px 20px;border-bottom:1px solid #e0e0e0;background:#f8f9fa;display:flex;align-items:center;justify-content:space-between">';
  html += '<div><div style="font-size:14px;font-weight:800;color:#333">' + tableName + '</div>';
  html += '<div style="font-size:11px;color:#666">' + d.total + ' Zeilen gesamt</div></div></div>';

  if (d.rows.length > 0) {
    var cols = Object.keys(d.rows[0]).slice(0, 10);
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<thead><tr style="background:#f5f5f5">';
    cols.forEach(function(c){ html += '<th style="padding:8px 10px;text-align:left;font-size:10px;color:#666;white-space:nowrap">' + c.toUpperCase() + '</th>'; });
    html += '</tr></thead><tbody>';
    d.rows.forEach(function(row, i) {
      html += '<tr style="border-bottom:1px solid #f0f0f0" onmouseover="this.style.background=\'#f8f9fa\'" onmouseout="this.style.background=\'transparent\'">';
      cols.forEach(function(c) {
        var v = row[c] === null ? '<span style="color:#ccc">NULL</span>' : _esc(String(row[c]).slice(0,80));
        html += '<td style="padding:7px 10px;color:#333;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + v + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else {
    html += '<div style="padding:40px;text-align:center;color:#999">Keine Einträge</div>';
  }
  content.innerHTML = html;
}

function dbBrowserExport(key) {
  var data = _dbCurrentData;
  if (!data) return;
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = key + '_export_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
}

async function dbBrowserDeleteItem(key, itemId) {
  if (!confirm('Eintrag "' + itemId + '" wirklich löschen?')) return;
  const r = await fetch('/api/admin/store/' + encodeURIComponent(key) + '/item/' + encodeURIComponent(itemId), { method: 'DELETE' });
  const d = await r.json();
  if (d.ok) { _showToast('Gelöscht ✓ (' + d.verbleibend + ' verbleibend)', 'success'); dbBrowserLoadKey(key); }
  else _showToast('Fehler: ' + (d.error||'?'), 'error');
}

async function dbBrowserClearKey(key) {
  if (!confirm('Alle Daten aus "' + key + '" löschen? Dies kann nicht rückgängig gemacht werden!')) return;
  const r = await fetch('/api/admin/store/' + encodeURIComponent(key), { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ data: [] }) });
  const d = await r.json();
  if (d.ok) { _showToast(key + ' geleert ✓', 'success'); dbBrowserLoadKey(key); }
  else _showToast('Fehler: ' + (d.error||'?'), 'error');
}

function dbBrowserEditItem(key, index) {
  if (!_dbCurrentData || !Array.isArray(_dbCurrentData)) return;
  var item = _dbCurrentData[index];
  var jsonStr = JSON.stringify(item, null, 2);
  var neu = prompt('Eintrag bearbeiten (JSON):', jsonStr);
  if (!neu) return;
  try {
    var parsed = JSON.parse(neu);
    var newData = [..._dbCurrentData];
    newData[index] = parsed;
    fetch('/api/admin/store/' + encodeURIComponent(key), {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ data: newData })
    }).then(function(r){ return r.json(); }).then(function(d){
      if (d.ok) { _showToast('Gespeichert ✓', 'success'); dbBrowserLoadKey(key); }
      else _showToast('Fehler', 'error');
    });
  } catch(e) { _showToast('Ungültiges JSON', 'error'); }
}

function bwZielSetzen() {
  var aktuell = localStorage.getItem('psc_bewertungsziel') || '4.5';
  var neu = prompt('Bewertungs-Ziel setzen (1.0 – 5.0):', aktuell);
  if (!neu) return;
  var val = parseFloat(neu.replace(',','.'));
  if (isNaN(val) || val < 1 || val > 5) { _showToast('Ungültiger Wert — bitte 1.0 bis 5.0', 'error'); return; }
  localStorage.setItem('psc_bewertungsziel', val.toFixed(1));
  _showToast('Ziel gesetzt: ' + val.toFixed(1) + ' ⭐', 'success');
  renderBewertungenTab();
}
function bwEdit(id) {
  var item = bwLoad().find(function(i){ return i.id === id; });
  if (item) bwFormular(item);
}

function bwFormular(item) {
  var area = document.getElementById('bw-form-area');
  if (!area) return;
  var isEdit = !!item;
  var b = item || { id:'', datum:new Date().toISOString().slice(0,10), plattform:'google', sterne:5, autor:'', titel:'', text:'', geantwortet:false, antwortText:'' };

  var html = '<div style="background:#fff;border:1.5px solid #f0d8d4;border-radius:14px;padding:18px;margin-bottom:20px">';
  html += '<div style="font-size:14px;font-weight:800;color:#610000;margin-bottom:14px">' + (isEdit ? '✏️ Bewertung bearbeiten' : '➕ Neue Bewertung') + '</div>';
  html += '<input type="hidden" id="bw-f-id" value="' + escHtml(b.id) + '">';

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:12px">';
  html += '<div><label style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Datum</label>';
  html += '<input type="date" id="bw-f-datum" class="ws-input" value="' + escHtml(b.datum) + '"></div>';
  html += '<div><label style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Plattform</label>';
  html += '<select id="bw-f-plattform" class="ws-input">';
  BW_PLATTFORMEN.forEach(function(p){
    html += '<option value="' + p.id + '"' + (b.plattform===p.id?' selected':'') + '>' + p.icon + ' ' + p.label + '</option>';
  });
  html += '</select></div>';
  html += '<div><label style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Sterne</label>';
  html += '<select id="bw-f-sterne" class="ws-input">';
  for (var s=5; s>=1; s--) html += '<option value="' + s + '"' + (b.sterne===s?' selected':'') + '>' + bwStars(s) + ' (' + s + ')</option>';
  html += '</select></div>';
  html += '<div><label style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Autor / Gast</label>';
  html += '<input type="text" id="bw-f-autor" class="ws-input" placeholder="z.B. Maria K." value="' + escHtml(b.autor||'') + '"></div>';
  html += '</div>';

  html += '<div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Titel (optional)</label>';
  html += '<input type="text" id="bw-f-titel" class="ws-input" placeholder="z.B. Beste Pizza der Stadt!" value="' + escHtml(b.titel||'') + '"></div>';

  html += '<div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Bewertungs-Text</label>';
  html += '<textarea id="bw-f-text" class="ws-input" rows="3" placeholder="Was der Gast geschrieben hat...">' + escHtml(b.text||'') + '</textarea></div>';

  html += '<div style="margin-bottom:12px;padding:12px;background:#faf6f5;border-radius:10px">';
  html += '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#5a403c;cursor:pointer;margin-bottom:8px">';
  html += '<input type="checkbox" id="bw-f-geantwortet"' + (b.geantwortet?' checked':'') + '> Beantwortet</label>';
  html += '<label style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase">Unsere Antwort (optional)</label>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0">';
  BW_ANTWORT_TEMPLATES.forEach(function(t, i) {
    html += '<button type="button" onclick="bwTemplateInsert(' + i + ')" style="padding:3px 9px;border-radius:8px;border:1px solid #e3beb8;background:#fff8f6;color:#610000;font-size:11px;font-weight:600;cursor:pointer">' + t.l + '</button>';
  });
  html += '</div>';
  html += '<textarea id="bw-f-antwortText" class="ws-input" rows="2" placeholder="Was wir zurück geschrieben haben...">' + escHtml(b.antwortText||'') + '</textarea>';
  html += '</div>';

  html += '<div style="display:flex;gap:10px;justify-content:flex-end">';
  html += '<button onclick="bwAbbrechen()" class="ws-btn ws-btn-sm">Abbrechen</button>';
  html += '<button onclick="bwSpeichern()" class="ws-btn ws-btn-primary ws-btn-sm"><span class="material-symbols-outlined">save</span>Speichern</button>';
  html += '</div>';
  html += '</div>';

  area.innerHTML = html;
  area.scrollIntoView({ behavior:'smooth', block:'start' });
}

function bwAbbrechen() {
  var area = document.getElementById('bw-form-area');
  if (area) area.innerHTML = '';
}

function bwSpeichern() {
  var id          = document.getElementById('bw-f-id')?.value || '';
  var datum       = (document.getElementById('bw-f-datum')?.value || '').trim();
  var plattform   = document.getElementById('bw-f-plattform')?.value || 'google';
  var sterne      = parseInt(document.getElementById('bw-f-sterne')?.value || '5', 10);
  var autor       = (document.getElementById('bw-f-autor')?.value || '').trim();
  var titel       = (document.getElementById('bw-f-titel')?.value || '').trim();
  var text        = (document.getElementById('bw-f-text')?.value || '').trim();
  var geantwortet = !!document.getElementById('bw-f-geantwortet')?.checked;
  var antwortText = (document.getElementById('bw-f-antwortText')?.value || '').trim();

  if (!datum) { _showToast('Datum fehlt', 'error'); return; }
  if (!sterne || sterne<1 || sterne>5) { _showToast('Ungültige Sterne-Anzahl', 'error'); return; }

  var list = bwLoad();
  var entry = { id:id, datum:datum, plattform:plattform, sterne:sterne, autor:autor, titel:titel, text:text, geantwortet:geantwortet, antwortText:antwortText };
  if (id) {
    list = list.map(function(i){ return i.id === id ? Object.assign({}, i, entry) : i; });
  } else {
    entry.id = bwGenId();
    list.push(entry);
  }
  bwSave(list);
  _showToast('Bewertung gespeichert', 'success');
  bwAbbrechen();
  renderBewertungenTab();
}

function bwToggleAntwort(id) {
  var list = bwLoad();
  list = list.map(function(i){ return i.id === id ? Object.assign({}, i, { geantwortet: !i.geantwortet }) : i; });
  bwSave(list);
  renderBewertungenTab();
}

function bwLoeschen(id) {
  _showConfirm('Bewertung wirklich löschen?', function() {
    bwSave(bwLoad().filter(function(i){ return i.id !== id; }));
    _showToast('Bewertung gelöscht', 'success');
    renderBewertungenTab();
  });
}

// Google Bewertungen laden und importieren
async function bwGoogleSync() {
  var placeId = localStorage.getItem('psc_google_place_id') || '';
  if (!placeId) {
    _showToast('Google Place ID fehlt → ⚙️ Einstellungen öffnen', 'error');
    openSettings();
    return;
  }
  var btn = document.getElementById('bw-google-sync-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;animation:spin 1s linear infinite">sync</span>Lädt…'; }
  try {
    var resp = await fetch('/api/google-bewertungen?place_id=' + encodeURIComponent(placeId));
    var data = await resp.json();
    if (!resp.ok) {
      _showToast('Google Fehler: ' + (data.error || resp.status), 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px">sync</span>Jetzt laden'; }
      return;
    }
    var list = bwLoad();
    // Duplikat-Erkennung: gleicher Autor + Datum + Sterne (Google hat keine stabilen IDs)
    var neu = 0, doppelt = 0;
    (data.reviews || []).forEach(function(r) {
      var exists = list.some(function(b) {
        return b.plattform === 'google' && b.autor === r.autor && b.datum === r.datum && b.sterne === r.sterne;
      });
      if (exists) { doppelt++; return; }
      r.id = bwGenId();
      list.push(r);
      neu++;
    });
    bwSave(list);
    var msg = neu + ' neue Bewertung' + (neu !== 1 ? 'en' : '') + ' importiert';
    if (doppelt > 0) msg += ' (' + doppelt + ' bereits vorhanden)';
    _showToast(msg, neu > 0 ? 'success' : 'info');
    renderBewertungenTab();
  } catch(e) {
    _showToast('Verbindungsfehler: ' + (e.message || 'Unbekannt'), 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px">sync</span>Jetzt laden'; }
  }
}

// ═══════════════════════════════════════════════════════════════
// HACCP-PROTOKOLL
// ═══════════════════════════════════════════════════════════════

// Standard-Kühlstellen (immer vorhanden)
const HACCP_DEFAULT_GERAETE = [
  { id:'kuehl1', name:'Kühlschrank 1 (Küche)',   soll:'1°C – 4°C',   min:1,  max:4  },
  { id:'kuehl2', name:'Kühlschrank 2 (Getränke)', soll:'4°C – 8°C',   min:4,  max:8  },
  { id:'tiefk',  name:'Tiefkühler',               soll:'-18°C – -15°C', min:-20, max:-15 },
  { id:'prep',   name:'Vorbereitungszone',         soll:'max. 7°C',    min:-5,  max:7  },
];

function haccpGetGeraete() {
  let extra = [];
  try { extra = JSON.parse(localStorage.getItem('psc_haccp_geraete') || '[]'); } catch(e) {}
  return [...HACCP_DEFAULT_GERAETE, ...extra];
}

function haccpGeraetHinzufuegen() {
  const name = document.getElementById('haccp-neu-name').value.trim();
  const typ  = document.getElementById('haccp-neu-typ').value;
  const min  = parseFloat(document.getElementById('haccp-neu-min').value);
  const max  = parseFloat(document.getElementById('haccp-neu-max').value);
  if (!name) { alert('Bitte einen Namen eingeben.'); return; }
  if (isNaN(min) || isNaN(max)) { alert('Bitte Temperaturbereich eingeben.'); return; }
  let extra = [];
  try { extra = JSON.parse(localStorage.getItem('psc_haccp_geraete') || '[]'); } catch(e) {}
  const id = 'custom_' + Date.now();
  const soll = min < 0 ? `${min}°C – ${max}°C` : `${min}°C – ${max}°C`;
  extra.push({ id, name, soll, min, max, typ });
  localStorage.setItem('psc_haccp_geraete', JSON.stringify(extra));
  renderHaccpTab();
}

function haccpGeraetLoeschen(id) {
  if (!confirm('Gerät wirklich entfernen?')) return;
  let extra = [];
  try { extra = JSON.parse(localStorage.getItem('psc_haccp_geraete') || '[]'); } catch(e) {}
  extra = extra.filter(g => g.id !== id);
  localStorage.setItem('psc_haccp_geraete', JSON.stringify(extra));
  renderHaccpTab();
}

function renderHaccpTab() {
  const panel = document.getElementById('panel-haccp');
  if (!panel) return;

  const heute = new Date().toLocaleDateString('de-AT');
  const heuteKey = new Date().toISOString().slice(0,10);

  let protokolle = [];
  try { protokolle = JSON.parse(localStorage.getItem('psc_haccp') || '[]'); } catch(e) {}

  const heuteProts = protokolle.filter(p => p.datum === heuteKey);

  // Kuehlstellen-Konfiguration (Standard + benutzerdefinierte)
  const KUEHLSTELLEN = haccpGetGeraete();
  let extraGeraete = [];
  try { extraGeraete = JSON.parse(localStorage.getItem('psc_haccp_geraete') || '[]'); } catch(e) {}

  const ampel = (temp, min, max) => {
    if (temp === '' || temp === null) return { farbe:'#9e9e9e', icon:'⬜', ok:false };
    const t = parseFloat(temp);
    if (isNaN(t)) return { farbe:'#9e9e9e', icon:'⬜', ok:false };
    if (t >= min && t <= max) return { farbe:'#2e7d32', icon:'🟢', ok:true };
    if (t >= min - 2 && t <= max + 2) return { farbe:'#f57f17', icon:'🟡', ok:false };
    return { farbe:'#c62828', icon:'🔴', ok:false };
  };

  const hygCheckliste = [
    'Hände gewaschen & desinfiziert',
    'Arbeitsflächen gereinigt',
    'Schneidbretter getrennt (roh/gekocht)',
    'Abfälle entsorgt',
    'Kühlkette eingehalten',
    'Verfallsdaten geprüft',
  ];

  // Letzter Eintrag heute
  const letzter = heuteProts.length > 0 ? heuteProts[heuteProts.length - 1] : null;

  // Alle letzten 7 Tage
  const vor7 = new Date(); vor7.setDate(vor7.getDate() - 7);
  const letzte7 = protokolle.filter(p => new Date(p.datum) >= vor7).reverse();

  panel.innerHTML = `
    <div style="padding:16px;max-width:900px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <span style="font-size:28px">🌡️</span>
        <div>
          <h2 style="font-size:22px;font-weight:800;color:#8B0000;margin:0">HACCP-Protokoll</h2>
          <div style="font-size:13px;color:#6b6b6b">Österreich – Lebensmittelhygiene Pflichtdokumentation</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:13px;font-weight:700;color:#261816">${heute}</div>
          <div style="font-size:12px;color:#6b6b6b">Heute: ${heuteProts.length} Einträge</div>
        </div>
      </div>

      <!-- Neuer Eintrag -->
      <div style="background:#fff;border-radius:16px;border:2px solid #e3beb8;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 style="font-size:16px;font-weight:700;color:#8B0000;margin:0 0 16px">Neuer Eintrag — ${heute}</h3>

        <!-- Uhrzeit + Mitarbeiter -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div>
            <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:4px">Uhrzeit</label>
            <input type="time" id="haccp-zeit" value="${new Date().toTimeString().slice(0,5)}"
              style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:4px">Mitarbeiter</label>
            <input type="text" id="haccp-ma" placeholder="Name eingeben"
              style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box">
          </div>
        </div>

        <!-- Temperaturen -->
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:8px">Temperaturen (°C)</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
            ${KUEHLSTELLEN.map(k => `
              <div style="background:#fff8f6;border-radius:10px;border:1.5px solid #f5ddd8;padding:12px">
                <div style="font-size:12px;font-weight:700;color:#261816;margin-bottom:4px">${k.name}</div>
                <div style="font-size:11px;color:#9e6b62;margin-bottom:6px">Soll: ${k.soll}</div>
                <input type="number" id="haccp-temp-${k.id}" step="0.1" placeholder="z.B. 3"
                  style="width:100%;padding:8px;border-radius:6px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Hygiene Checkliste -->
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:8px">Hygiene-Checkliste</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px">
            ${hygCheckliste.map((p,i) => `
              <label style="display:flex;align-items:center;gap:8px;background:#fff8f6;border-radius:8px;padding:8px 10px;cursor:pointer;border:1.5px solid #f5ddd8">
                <input type="checkbox" id="haccp-hyg-${i}" style="width:16px;height:16px;accent-color:#8B0000">
                <span style="font-size:13px;color:#261816">${p}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Bemerkung -->
        <div style="margin-bottom:16px">
          <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:4px">Bemerkungen (optional)</label>
          <textarea id="haccp-bemerkung" rows="2" placeholder="z.B. Kühlschrank 1 läuft unruhig..."
            style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;resize:none;box-sizing:border-box"></textarea>
        </div>

        <button onclick="haccpSpeichern()" style="background:#8B0000;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:15px;font-weight:700;cursor:pointer;width:100%">
          ✅ Eintrag speichern
        </button>
      </div>

      <!-- Kühlgerät hinzufügen -->
      <div style="background:#fff;border-radius:16px;border:2px dashed #e3beb8;padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;font-weight:700;color:#8B0000;margin:0 0 14px">🔧 Kühlgerät hinzufügen / verwalten</h3>
        <div style="display:grid;grid-template-columns:2fr 1fr 80px 80px auto;gap:10px;align-items:end;flex-wrap:wrap">
          <div>
            <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:4px">Name</label>
            <input type="text" id="haccp-neu-name" placeholder="z.B. Kühlschrank 3 (Lager)"
              style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #e3beb8;font-size:13px;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:4px">Typ</label>
            <select id="haccp-neu-typ" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #e3beb8;font-size:13px;box-sizing:border-box">
              <option value="kuehlschrank">🧊 Kühlschrank</option>
              <option value="tiefkuehler">❄️ Tiefkühler</option>
              <option value="zone">🌡️ Zone</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:4px">Min °C</label>
            <input type="number" id="haccp-neu-min" placeholder="-20" step="0.5"
              style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #e3beb8;font-size:13px;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:4px">Max °C</label>
            <input type="number" id="haccp-neu-max" placeholder="4" step="0.5"
              style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #e3beb8;font-size:13px;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:transparent;display:block;margin-bottom:4px">-</label>
            <button onclick="haccpGeraetHinzufuegen()" style="background:#8B0000;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">+ Hinzufügen</button>
          </div>
        </div>

        ${extraGeraete.length > 0 ? `
        <div style="margin-top:14px">
          <div style="font-size:12px;font-weight:600;color:#5a403c;margin-bottom:8px">Eigene Geräte:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${extraGeraete.map(g => `
              <div style="background:#fff8f6;border-radius:8px;border:1.5px solid #e3beb8;padding:7px 12px;display:flex;align-items:center;gap:8px;font-size:13px">
                <span style="font-weight:700;color:#261816">${_esc(g.name)}</span>
                <span style="color:#9e6b62">${g.soll}</span>
                <button onclick="haccpGeraetLoeschen('${g.id}')" style="background:none;border:none;color:#c62828;cursor:pointer;font-size:14px;padding:0;line-height:1">✕</button>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      </div>

      <!-- Heutige Eintraege -->
      ${heuteProts.length > 0 ? `
      <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;font-weight:700;color:#261816;margin:0 0 14px">Heute — ${heuteProts.length} Einträge</h3>
        ${heuteProts.map((p,idx) => {
          const kOk = KUEHLSTELLEN.every(k => {
            const t = p.temps && p.temps[k.id];
            return t !== undefined && t !== '' && ampel(t, k.min, k.max).ok;
          });
          return `
          <div style="border-radius:10px;border:1.5px solid ${kOk?'#a5d6a7':'#ef9a9a'};background:${kOk?'#f1f8e9':'#fff8f6'};padding:12px;margin-bottom:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-weight:700;font-size:14px;color:#261816">${p.zeit} Uhr — ${_esc(p.mitarbeiter||'–')}</span>
              <span style="font-size:18px">${kOk?'✅':'⚠️'}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px">
              ${KUEHLSTELLEN.map(k => {
                const t = p.temps && p.temps[k.id] !== undefined ? p.temps[k.id] : '–';
                const a = t !== '–' ? ampel(t, k.min, k.max) : { icon:'⬜', farbe:'#9e9e9e' };
                return `<span style="font-size:12px;background:#fff;border-radius:6px;padding:4px 8px;border:1px solid #e3beb8">
                  ${a.icon} ${k.name.split(' ')[0]}: <strong>${t !== '' ? t+'°C' : '–'}</strong>
                </span>`;
              }).join('')}
            </div>
            ${p.bemerkung ? `<div style="font-size:12px;color:#5a403c;font-style:italic">"${_esc(p.bemerkung)}"</div>` : ''}
            <button onclick="haccpLoeschen(${protokolle.indexOf(p)})" style="margin-top:6px;padding:3px 10px;border-radius:6px;border:1px solid #e3beb8;background:#fff;color:#8B0000;font-size:11px;cursor:pointer">Löschen</button>
          </div>`;
        }).join('')}
      </div>` : `
      <div style="background:#fff8f6;border-radius:12px;border:1.5px dashed #e3beb8;padding:24px;text-align:center;margin-bottom:20px">
        <div style="font-size:32px;margin-bottom:8px">📋</div>
        <div style="color:#6b6b6b;font-size:14px">Heute noch kein Eintrag. Bitte jetzt ausfüllen!</div>
      </div>`}

      <!-- Letzte 7 Tage -->
      ${letzte7.filter(p=>p.datum!==heuteKey).length > 0 ? `
      <div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:20px">
        <h3 style="font-size:15px;font-weight:700;color:#261816;margin:0 0 14px">Letzte 7 Tage</h3>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#fff8f6">
                <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e3beb8;color:#5a403c">Datum</th>
                <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e3beb8;color:#5a403c">Zeit</th>
                <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e3beb8;color:#5a403c">Mitarbeiter</th>
                ${KUEHLSTELLEN.map(k=>`<th style="padding:8px 10px;text-align:center;border-bottom:2px solid #e3beb8;color:#5a403c">${k.name.split(' ')[0]}</th>`).join('')}
                <th style="padding:8px 10px;text-align:center;border-bottom:2px solid #e3beb8;color:#5a403c">Status</th>
              </tr>
            </thead>
            <tbody>
              ${letzte7.filter(p=>p.datum!==heuteKey).map(p => {
                const allOk = KUEHLSTELLEN.every(k => {
                  const t = p.temps && p.temps[k.id];
                  return t !== undefined && t !== '' && ampel(t, k.min, k.max).ok;
                });
                return `<tr style="border-bottom:1px solid #f5ddd8">
                  <td style="padding:7px 10px;color:#261816">${new Date(p.datum).toLocaleDateString('de-AT')}</td>
                  <td style="padding:7px 10px;color:#261816">${p.zeit}</td>
                  <td style="padding:7px 10px;color:#261816">${_esc(p.mitarbeiter||'–')}</td>
                  ${KUEHLSTELLEN.map(k=>{
                    const t = p.temps&&p.temps[k.id]!==undefined?p.temps[k.id]:'–';
                    const a = t!=='–'?ampel(t,k.min,k.max):{icon:'⬜'};
                    return `<td style="padding:7px 10px;text-align:center">${a.icon} ${t!==''?t+'°':'-'}</td>`;
                  }).join('')}
                  <td style="padding:7px 10px;text-align:center;font-size:16px">${allOk?'✅':'⚠️'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}
    </div>
  `;
}

function haccpSpeichern() {
  const zeit = document.getElementById('haccp-zeit').value;
  const ma   = document.getElementById('haccp-ma').value.trim();
  const bem  = document.getElementById('haccp-bemerkung').value.trim();
  if (!ma) { alert('Bitte Mitarbeiter-Name eingeben.'); return; }

  const KUEHLSTELLEN = haccpGetGeraete().map(k => k.id);
  const temps = {};
  KUEHLSTELLEN.forEach(k => {
    const el = document.getElementById('haccp-temp-' + k);
    temps[k] = el ? el.value : '';
  });

  const hygiene = [];
  for (let i = 0; i < 6; i++) {
    const cb = document.getElementById('haccp-hyg-' + i);
    if (cb && cb.checked) hygiene.push(i);
  }

  let protokolle = [];
  try { protokolle = JSON.parse(localStorage.getItem('psc_haccp') || '[]'); } catch(e) {}

  protokolle.push({
    datum: new Date().toISOString().slice(0,10),
    zeit,
    mitarbeiter: ma,
    temps,
    hygiene,
    bemerkung: bem,
    ts: Date.now()
  });

  localStorage.setItem('psc_haccp', JSON.stringify(protokolle));
  renderHaccpTab();
}

function haccpLoeschen(idx) {
  if (!confirm('Diesen Eintrag wirklich löschen?')) return;
  let protokolle = [];
  try { protokolle = JSON.parse(localStorage.getItem('psc_haccp') || '[]'); } catch(e) {}
  protokolle.splice(idx, 1);
  localStorage.setItem('psc_haccp', JSON.stringify(protokolle));
  renderHaccpTab();
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — WARENEINSATZ
// ═══════════════════════════════════════════════════════════════
function renderWareneinsatzTab() {
  const p = document.getElementById('panel-wareneinsatz');
  let gerichte = []; try { gerichte = JSON.parse(localStorage.getItem('pizzeria_wareneinsatz')||'[]'); } catch(e) {}

  const marge = g => g.verkaufspreis > 0 ? Math.round((1 - g.kosten/g.verkaufspreis)*100) : 0;
  const margeAmpel = m => m >= 60 ? {bg:'#e8f5e9',clr:'#1b5e20',bc:'#a5d6a7',icon:'🟢'} : m >= 40 ? {bg:'#fff8e1',clr:'#f57f17',bc:'#ffe082',icon:'🟡'} : {bg:'#ffebee',clr:'#c62828',bc:'#ef9a9a',icon:'🔴'};

  const sorted = [...gerichte].sort((a,b)=>marge(b)-marge(a));

  const rows = sorted.length ? sorted.map(g => {
    const m = marge(g);
    const st = margeAmpel(m);
    const zutatenHtml = g.zutaten.map((z,i) =>
      `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span style="font-size:12px;color:#5a403c;flex:1">${_esc(z.name)}</span>
        <span style="font-size:12px;color:#6b6b6b">${z.menge} ${_esc(z.einheit)}</span>
        <span style="font-size:12px;font-weight:600;color:#261816">${(z.menge*z.preis).toFixed(2)} €</span>
        <button onclick="weZutatDelete(${g.id},${i})" style="padding:1px 5px;border-radius:4px;border:1px solid #e3beb8;background:#fff;color:#8B0000;font-size:11px;cursor:pointer">✕</button>
      </div>`).join('');
    return `<div style="background:#fff;border-radius:14px;border:1.5px solid ${st.bc};padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
        <div>
          <div style="font-weight:800;font-size:15px;color:#261816">${st.icon} ${_esc(g.name)}</div>
          <div style="font-size:12px;color:#5a403c;margin-top:2px">Wareneinsatz: <b>${g.kosten.toFixed(2)} €</b> | Verkauf: <b>${g.verkaufspreis.toFixed(2)} €</b></div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:800;color:${st.clr}">${m}%</div>
          <div style="font-size:11px;color:#6b6b6b">Marge</div>
        </div>
      </div>
      <div style="height:6px;border-radius:4px;background:#f0e4e1;margin-bottom:12px">
        <div style="height:100%;border-radius:4px;background:${st.clr};width:${Math.min(m,100)}%;transition:width .3s"></div>
      </div>
      <div style="margin-bottom:8px;padding:10px;background:#f8f8f8;border-radius:8px">
        <div style="font-size:11px;font-weight:700;color:#6b6b6b;margin-bottom:6px">ZUTATEN</div>
        ${zutatenHtml || '<div style="font-size:12px;color:#6b6b6b">Noch keine Zutaten</div>'}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <input id="wez-name-${g.id}" placeholder="Zutat" style="flex:2;min-width:80px;padding:6px 8px;border-radius:8px;border:1px solid #e3beb8;font-size:12px;font-family:inherit;background:#fff8f6">
        <input id="wez-menge-${g.id}" type="number" placeholder="Menge" min="0" step="0.01" style="flex:1;min-width:50px;padding:6px 8px;border-radius:8px;border:1px solid #e3beb8;font-size:12px;font-family:inherit;background:#fff8f6">
        <input id="wez-preis-${g.id}" type="number" placeholder="€/Einh." min="0" step="0.01" style="flex:1;min-width:60px;padding:6px 8px;border-radius:8px;border:1px solid #e3beb8;font-size:12px;font-family:inherit;background:#fff8f6">
        <button onclick="weZutatAdd(${g.id})" style="padding:6px 10px;border-radius:8px;border:none;background:#8B0000;color:#fff;font-size:12px;font-weight:700;cursor:pointer">+ Zutat</button>
        <button onclick="weGericht(${g.id},'delete')" style="padding:6px 10px;border-radius:8px;border:1px solid #e3beb8;background:#fff8f6;color:#8B0000;font-size:12px;cursor:pointer">🗑️</button>
      </div>
    </div>`;
  }).join('') : `<div style="text-align:center;padding:40px;color:#6b6b6b;font-size:14px">Noch keine Gerichte — füge dein erstes Gericht hinzu</div>`;

  const besteMarge = sorted.length ? marge(sorted[0]) : 0;
  const avgMarge = gerichte.length ? Math.round(gerichte.reduce((s,g)=>s+marge(g),0)/gerichte.length) : 0;

  p.innerHTML = `
    ${_pageHdr('calculate', 'Wareneinsatz', gerichte.length + ' Gerichte · Ø Marge: <strong>' + avgMarge + '%</strong>' + (sorted.length ? ' · Beste: <strong>' + _esc(sorted[0].name) + ' (' + besteMarge + '%)</strong>' : ''))}
    <div style="display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start">
      <div>${rows}</div>
      <div style="position:sticky;top:20px">
        <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #e3beb8;margin-bottom:16px">
          <div style="font-weight:700;font-size:15px;color:#261816;margin-bottom:14px">➕ Neues Gericht</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <input id="we-name" placeholder="Gerichtname..." style="padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff8f6">
            <input id="we-vk" type="number" placeholder="Verkaufspreis €" min="0" step="0.01" style="padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff8f6">
            <button onclick="weGerichtAdd()" style="padding:12px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer">Gericht anlegen</button>
          </div>
        </div>
        <div style="background:#fff;border-radius:16px;padding:16px;border:1px solid #e3beb8">
          <div style="font-size:12px;font-weight:700;color:#5a403c;margin-bottom:8px">MARGEN-AMPEL</div>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12px">
            <span>🟢 <b>≥ 60%</b> — sehr profitabel</span>
            <span>🟡 <b>40–59%</b> — akzeptabel</span>
            <span>🔴 <b>&lt; 40%</b> — überprüfen!</span>
          </div>
        </div>
      </div>
    </div>`;
}
function weGerichtAdd() {
  const name = document.getElementById('we-name')?.value.trim();
  if (!name) { _markField('we-name', true); _showToast('Bitte Gerichtname eingeben', 'error'); return; }
  let gerichte = []; try { gerichte = JSON.parse(localStorage.getItem('pizzeria_wareneinsatz')||'[]'); } catch(e) {}
  gerichte.push({ id:Date.now(), name, verkaufspreis:parseFloat(document.getElementById('we-vk')?.value)||0, kosten:0, zutaten:[] });
  localStorage.setItem('pizzeria_wareneinsatz', JSON.stringify(gerichte));
  _showToast('Gericht angelegt', 'success'); renderWareneinsatzTab();
}
function weZutatAdd(id) {
  const n = document.getElementById('wez-name-'+id)?.value.trim();
  if (!n) { _markField('wez-name-'+id, true); _showToast('Bitte Zutatname eingeben', 'error'); return; }
  let gerichte = []; try { gerichte = JSON.parse(localStorage.getItem('pizzeria_wareneinsatz')||'[]'); } catch(e) {}
  const g = gerichte.find(x=>x.id===id);
  if (g) {
    const menge = parseFloat(document.getElementById('wez-menge-'+id)?.value)||0;
    const preis = parseFloat(document.getElementById('wez-preis-'+id)?.value)||0;
    g.zutaten.push({ name:n, menge, einheit:'Stück', preis });
    g.kosten = g.zutaten.reduce((s,z)=>s+z.menge*z.preis, 0);
    localStorage.setItem('pizzeria_wareneinsatz', JSON.stringify(gerichte));
    _showToast('Zutat hinzugefügt', 'success'); renderWareneinsatzTab();
  }
}
function weZutatDelete(gId, zIdx) {
  let gerichte = []; try { gerichte = JSON.parse(localStorage.getItem('pizzeria_wareneinsatz')||'[]'); } catch(e) {}
  const g = gerichte.find(x=>x.id===gId);
  if (g) { g.zutaten.splice(zIdx,1); g.kosten=g.zutaten.reduce((s,z)=>s+z.menge*z.preis,0); localStorage.setItem('pizzeria_wareneinsatz', JSON.stringify(gerichte)); renderWareneinsatzTab(); }
}
function weGericht(id, action) {
  if (action==='delete') {
    let gerichte = []; try { gerichte = JSON.parse(localStorage.getItem('pizzeria_wareneinsatz')||'[]'); } catch(e) {}
    localStorage.setItem('pizzeria_wareneinsatz', JSON.stringify(gerichte.filter(x=>x.id!==id)));
    _showToast('Gericht gelöscht', 'info'); renderWareneinsatzTab();
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — PREISALARM
// ═══════════════════════════════════════════════════════════════
function renderPreisalarmTab() {
  const p = document.getElementById('panel-preisalarm');
  let regeln = []; try { regeln = JSON.parse(localStorage.getItem('pizzeria_preisalarm_rules')||'[]'); } catch(e) {}
  let log = []; try { log = JSON.parse(localStorage.getItem('pizzeria_preisalarm_log')||'[]'); } catch(e) {}

  const ausgeloest = regeln.filter(r => r.aktiv && r._ausgeloest).length;
  const typLabel = {unter:'Unter', ueber:'Über', aend:'Änderung'};
  const shopLabel = {alle:'Alle', metro:'Metro', billa:'Billa', lidl:'Lidl', spar:'Spar'};

  function paAmpel(r) {
    if (!r.aktiv) return '⚫';
    if (r._ausgeloest) return '🔴';
    if (r._letzterPreis == null) return '🟢';
    const s = r.schwelle, pr = r._letzterPreis;
    if (r.typ === 'unter') return (pr - s) / s < 0.1 ? '🟡' : '🟢';
    if (r.typ === 'ueber') return (s - pr) / s < 0.1 ? '🟡' : '🟢';
    if (r.typ === 'aend' && r._basisPreis) {
      const pct = Math.abs(pr - r._basisPreis) / r._basisPreis * 100;
      return pct > r.schwelle * 0.8 ? '🟡' : '🟢';
    }
    return '🟢';
  }
  function paDiff(r) {
    if (r._letzterPreis == null) return '—';
    const pr = r._letzterPreis, s = r.schwelle;
    if (r.typ === 'unter' || r.typ === 'ueber') {
      const pct = ((pr - s) / s * 100).toFixed(1);
      return (pct > 0 ? '+' : '') + pct + '%';
    }
    if (!r._basisPreis) return '—';
    const pct = ((pr - r._basisPreis) / r._basisPreis * 100).toFixed(1);
    return (pct > 0 ? '+' : '') + pct + '%';
  }
  const schwelleLabel = r => r.typ === 'aend' ? r.schwelle + '%' : parseFloat(r.schwelle).toFixed(2) + ' €';

  const tabelleHtml = regeln.length ? `
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:var(--bg)">
        <th style="padding:8px 10px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Produkt</th>
        <th style="padding:8px 10px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Shop</th>
        <th style="padding:8px 10px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Typ</th>
        <th style="padding:8px 10px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Schwelle</th>
        <th style="padding:8px 10px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Letzter Preis</th>
        <th style="padding:8px 10px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Diff</th>
        <th style="padding:8px 10px;text-align:center;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Ampel</th>
        <th style="padding:8px 10px;text-align:center;color:var(--text-3);font-weight:700;border-bottom:2px solid var(--border)">Ein/Aus</th>
        <th style="padding:8px 10px;border-bottom:2px solid var(--border)"></th>
      </tr></thead>
      <tbody>
        ${regeln.map(r => {
          const amp = paAmpel(r);
          const isRed = amp === '🔴';
          return `<tr class="${isRed?'pa-pulse-row':''}" style="background:${isRed?'rgba(239,68,68,0.12)':'transparent'};border-bottom:1px solid var(--border-2)">
            <td style="padding:8px 10px;font-weight:600;color:var(--text)">${_esc(r.produkt)}</td>
            <td style="padding:8px 10px;color:var(--text-2)">${shopLabel[r.shop]||r.shop}</td>
            <td style="padding:8px 10px;color:var(--text-2)">${typLabel[r.typ]||r.typ}</td>
            <td style="padding:8px 10px;text-align:right;font-weight:700;color:var(--text)">${schwelleLabel(r)}</td>
            <td style="padding:8px 10px;text-align:right;color:var(--text)">${r._letzterPreis != null ? parseFloat(r._letzterPreis).toFixed(2)+' €' : '—'}</td>
            <td style="padding:8px 10px;text-align:right;color:${isRed?'#e53935':'var(--text-2)'}">${paDiff(r)}</td>
            <td style="padding:8px 10px;text-align:center;font-size:16px">${amp}</td>
            <td style="padding:8px 10px;text-align:center">
              <button onclick="preisalarmToggle(${r.id})" style="padding:3px 10px;border-radius:6px;border:1px solid var(--border);background:${r.aktiv?'var(--red)':'var(--bg)'};color:${r.aktiv?'#fff':'var(--text-3)'};font-size:11px;font-weight:700;cursor:pointer">${r.aktiv?'AN':'AUS'}</button>
            </td>
            <td style="padding:8px 10px;text-align:center">
              <button onclick="preisalarmDelete(${r.id})" style="padding:3px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--red);font-size:12px;cursor:pointer">🗑️</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>` : `<div style="text-align:center;padding:40px;color:var(--text-3);font-size:14px">Noch keine Preisalarme angelegt</div>`;

  const logHtml = log.length ? log.slice().reverse().slice(0,20).map(l =>
    `<tr style="border-bottom:1px solid var(--border-2)">
      <td style="padding:6px 10px;color:var(--text-3);font-size:12px">${l.datum}</td>
      <td style="padding:6px 10px;color:var(--text);font-size:12px;font-weight:600">${_esc(l.produkt)}</td>
      <td style="padding:6px 10px;color:var(--text-2);font-size:12px">${shopLabel[l.shop]||l.shop}</td>
      <td style="padding:6px 10px;color:var(--text-2);font-size:12px">${typLabel[l.typ]||l.typ}</td>
      <td style="padding:6px 10px;text-align:right;color:var(--text);font-size:12px">${parseFloat(l.schwelle).toFixed(2)}</td>
      <td style="padding:6px 10px;text-align:right;font-weight:700;color:var(--text);font-size:12px">${parseFloat(l.ist_preis).toFixed(2)} €</td>
      <td style="padding:6px 10px;text-align:right;color:#e53935;font-size:12px;font-weight:700">${l.diff_pct != null ? parseFloat(l.diff_pct).toFixed(1)+'%' : '—'}</td>
    </tr>`
  ).join('') : `<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--text-3)">Noch keine Alarme ausgelöst</td></tr>`;

  // Interval starten (alle 30 min)
  clearInterval(window._preisalarmInterval);
  window._preisalarmInterval = setInterval(checkPreisalarme, 30*60*1000);

  p.innerHTML = `
    ${_pageHdr('notifications_active', 'Preisalarm', regeln.length + ' Alarm-Regeln · ' + (ausgeloest?'<span style="color:#e53935;font-weight:700">'+ausgeloest+' ausgelöst</span>':'Alles OK ✓'), '<button onclick="checkPreisalarme()" style="padding:8px 14px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);font-size:12px;font-weight:600;cursor:pointer">🔄 Jetzt prüfen</button>')}

    <div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:20px">
      <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:14px">➕ Neuer Preisalarm</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:2;min-width:140px">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">PRODUKT</div>
          <input id="pa-produkt" placeholder="Produktname..." style="width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text);box-sizing:border-box">
        </div>
        <div style="flex:1;min-width:110px">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">SHOP</div>
          <select id="pa-shop" style="width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
            <option value="alle">Alle</option>
            <option value="metro">Metro</option>
            <option value="billa">Billa</option>
            <option value="lidl">Lidl</option>
            <option value="spar">Spar</option>
          </select>
        </div>
        <div style="flex:1;min-width:150px">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">TYP</div>
          <select id="pa-typ" style="width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text)">
            <option value="unter">Unter (Schnäppchen)</option>
            <option value="ueber">Über (zu teuer)</option>
            <option value="aend">Änderung > X%</option>
          </select>
        </div>
        <div style="flex:1;min-width:120px">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">SCHWELLE (€ oder %)</div>
          <input id="pa-schwelle" type="number" step="0.01" min="0" placeholder="z.B. 2.50 oder 5" style="width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--bg);color:var(--text);box-sizing:border-box">
        </div>
        <button onclick="preisalarmAdd()" style="padding:9px 20px;border-radius:10px;border:none;background:var(--red);color:#fff;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;flex-shrink:0">Hinzufügen</button>
      </div>
    </div>

    <div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:20px">
      ${tabelleHtml}
    </div>

    <details style="background:var(--surface);border-radius:16px;border:1px solid var(--border)">
      <summary style="padding:16px 20px;font-weight:700;font-size:14px;color:var(--text);cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px">
        <span class="material-symbols-outlined" style="font-size:18px;color:var(--text-3)">history</span>
        Letzte 20 ausgelöste Alarme (${log.length} gesamt)
      </summary>
      <div style="padding:0 20px 20px;overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:var(--bg)">
            <th style="padding:8px 10px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Datum</th>
            <th style="padding:8px 10px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Produkt</th>
            <th style="padding:8px 10px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Shop</th>
            <th style="padding:8px 10px;text-align:left;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Typ</th>
            <th style="padding:8px 10px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Schwelle</th>
            <th style="padding:8px 10px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Ist-Preis</th>
            <th style="padding:8px 10px;text-align:right;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border)">Diff%</th>
          </tr></thead>
          <tbody>${logHtml}</tbody>
        </table>
      </div>
    </details>`;

  // Initial-Check beim Tab-Öffnen (nur wenn nicht kürzlich gelaufen)
  if (!window._preisalarmLastCheck || Date.now() - window._preisalarmLastCheck > 5*60*1000) {
    setTimeout(checkPreisalarme, 400);
  }
}
function preisalarmAdd() {
  const produkt = (document.getElementById('pa-produkt')?.value||'').trim();
  const shop = document.getElementById('pa-shop')?.value || 'alle';
  const typ = document.getElementById('pa-typ')?.value || 'ueber';
  const schwelle = parseFloat(document.getElementById('pa-schwelle')?.value);
  if (!produkt) { _markField('pa-produkt', true); _showToast('Bitte Produktname eingeben', 'error'); return; }
  if (isNaN(schwelle) || schwelle < 0) { _markField('pa-schwelle', true); _showToast('Bitte gültige Schwelle eingeben', 'error'); return; }
  let regeln = []; try { regeln = JSON.parse(localStorage.getItem('pizzeria_preisalarm_rules')||'[]'); } catch(e) {}
  regeln.push({ id:Date.now(), produkt, shop, typ, schwelle, aktiv:true, erstellt:new Date().toLocaleDateString('de-AT') });
  localStorage.setItem('pizzeria_preisalarm_rules', JSON.stringify(regeln));
  _showToast('Preisalarm angelegt', 'success');
  renderPreisalarmTab();
}
function preisalarmToggle(id) {
  let regeln = []; try { regeln = JSON.parse(localStorage.getItem('pizzeria_preisalarm_rules')||'[]'); } catch(e) {}
  const r = regeln.find(x => x.id === id);
  if (!r) return;
  r.aktiv = !r.aktiv;
  localStorage.setItem('pizzeria_preisalarm_rules', JSON.stringify(regeln));
  _showToast(r.aktiv ? 'Alarm aktiviert' : 'Alarm deaktiviert', 'info');
  renderPreisalarmTab();
}
function preisalarmDelete(id) {
  if (!confirm('Preisalarm wirklich löschen?')) return;
  let regeln = []; try { regeln = JSON.parse(localStorage.getItem('pizzeria_preisalarm_rules')||'[]'); } catch(e) {}
  localStorage.setItem('pizzeria_preisalarm_rules', JSON.stringify(regeln.filter(x => x.id !== id)));
  _showToast('Alarm gelöscht', 'info');
  renderPreisalarmTab();
}
async function checkPreisalarme() {
  window._preisalarmLastCheck = Date.now();
  let regeln = []; try { regeln = JSON.parse(localStorage.getItem('pizzeria_preisalarm_rules')||'[]'); } catch(e) {}
  let log = []; try { log = JSON.parse(localStorage.getItem('pizzeria_preisalarm_log')||'[]'); } catch(e) {}
  const aktive = regeln.filter(r => r.aktiv);
  if (!aktive.length) return;

  // Preisdaten holen
  let preisRows = [];
  try {
    const resp = await fetch('/api/preisverlauf?limit=200');
    if (resp.ok) preisRows = await resp.json();
  } catch(_) {
    try {
      const hist = JSON.parse(localStorage.getItem('pizzeria_history')||'[]');
      preisRows = hist.map(e => ({ produkt:e.name||e.produkt||'', shop_id:e.shop||e.lieferant||'', preis:e.preis||0, datum:e.datum||'' }));
    } catch(_) {}
  }

  let geaendert = false;
  aktive.forEach(regel => {
    const suchProdukt = (regel.produkt||'').toLowerCase();
    const suchShop = regel.shop === 'alle' ? null : regel.shop;
    const treffer = preisRows.filter(r => {
      const nameMatch = (r.produkt||r.name||'').toLowerCase().includes(suchProdukt) || suchProdukt.includes(((r.produkt||r.name||'').toLowerCase()).slice(0,6));
      const shopMatch = !suchShop || (r.shop_id||r.shop||'').toLowerCase().includes(suchShop);
      return nameMatch && (nameMatch && shopMatch);
    });
    if (!treffer.length) return;
    const istPreis = parseFloat(treffer[0].preis);
    if (isNaN(istPreis) || istPreis <= 0) return;

    const ro = regeln.find(r => r.id === regel.id);
    if (!ro) return;
    if (!ro._basisPreis) ro._basisPreis = istPreis;
    ro._letzterPreis = istPreis;
    ro._letztePruefung = new Date().toLocaleDateString('de-AT');
    geaendert = true;

    let ausgeloest = false, diff_pct = null;
    if (regel.typ === 'unter') {
      ausgeloest = istPreis < regel.schwelle;
      diff_pct = regel.schwelle > 0 ? (istPreis - regel.schwelle) / regel.schwelle * 100 : 0;
    } else if (regel.typ === 'ueber') {
      ausgeloest = istPreis > regel.schwelle;
      diff_pct = regel.schwelle > 0 ? (istPreis - regel.schwelle) / regel.schwelle * 100 : 0;
    } else if (regel.typ === 'aend') {
      diff_pct = ro._basisPreis > 0 ? Math.abs(istPreis - ro._basisPreis) / ro._basisPreis * 100 : 0;
      ausgeloest = diff_pct > regel.schwelle;
    }
    ro._ausgeloest = ausgeloest;

    if (ausgeloest) {
      const shopText = regel.shop === 'alle' ? 'alle Shops' : (regel.shop.charAt(0).toUpperCase()+regel.shop.slice(1));
      _showToast('🔔 Preisalarm: '+regel.produkt+' ('+shopText+') — '+istPreis.toFixed(2)+'€', 'warning');
      if (typeof notifAdd === 'function') notifAdd('pa_'+regel.id+'_'+Date.now(), '🔔 Preisalarm: '+regel.produkt, shopText+' · '+istPreis.toFixed(2)+'€', 'warning', 'preisalarm');
      log.push({ id:Date.now()+Math.random(), datum:new Date().toLocaleDateString('de-AT'), produkt:regel.produkt, shop:regel.shop, typ:regel.typ, schwelle:regel.schwelle, ist_preis:istPreis, diff_pct, regel_id:regel.id });
    }
  });

  if (log.length > 100) log = log.slice(-100);
  if (geaendert) localStorage.setItem('pizzeria_preisalarm_rules', JSON.stringify(regeln));
  if (log.length) localStorage.setItem('pizzeria_preisalarm_log', JSON.stringify(log));

  // Tab neu rendern wenn gerade offen
  const panel = document.getElementById('panel-preisalarm');
  if (panel && panel.style.display !== 'none') renderPreisalarmTab();
}

// ===== PHASE 4: STATISTIK, TAGESANGEBOTE, UMSATZ =====

function renderStatistikTab() {
  var panel = document.getElementById('panel-statistik');
  var viewMode = panel.dataset.view || 'woche';
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_statistik') || '[]'); } catch(ex) {}

  var now = new Date();
  var today = now.toISOString().slice(0, 10);
  var dayOfWeek = now.getDay();
  var diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  var monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  var firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  var filtered = data.filter(function(e) {
    var d = new Date(e.datum);
    if (viewMode === 'tag') return e.datum === today;
    if (viewMode === 'woche') return d >= monday;
    if (viewMode === 'monat') return d >= firstOfMonth;
    return true;
  });

  var gesamtUmsatz = filtered.reduce(function(s, e) { return s + (parseFloat(e.preis) * parseInt(e.anzahl) || 0); }, 0);
  var gesamtGerichte = filtered.reduce(function(s, e) { return s + (parseInt(e.anzahl) || 0); }, 0);

  var lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);
  var lastSunday = new Date(monday);
  lastSunday.setDate(monday.getDate() - 1);
  lastSunday.setHours(23, 59, 59, 999);
  var dieseWocheUmsatz = data.filter(function(e) { var d = new Date(e.datum); return d >= monday; })
    .reduce(function(s, e) { return s + (parseFloat(e.preis) * parseInt(e.anzahl) || 0); }, 0);
  var letzteWocheUmsatz = data.filter(function(e) { var d = new Date(e.datum); return d >= lastMonday && d <= lastSunday; })
    .reduce(function(s, e) { return s + (parseFloat(e.preis) * parseInt(e.anzahl) || 0); }, 0);
  var wochenVergleich = letzteWocheUmsatz > 0 ? ((dieseWocheUmsatz - letzteWocheUmsatz) / letzteWocheUmsatz * 100).toFixed(1) : null;

  var gerichtMap = {};
  filtered.forEach(function(e) {
    if (!gerichtMap[e.gericht]) gerichtMap[e.gericht] = 0;
    gerichtMap[e.gericht] += parseInt(e.anzahl) || 0;
  });
  var topGerichte = Object.keys(gerichtMap).map(function(k) { return { name: k, anzahl: gerichtMap[k] }; })
    .sort(function(a, b) { return b.anzahl - a.anzahl; }).slice(0, 10);
  var maxAnzahl = topGerichte.length > 0 ? topGerichte[0].anzahl : 1;

  var tageMap = {};
  filtered.forEach(function(e) {
    if (!tageMap[e.datum]) tageMap[e.datum] = 0;
    tageMap[e.datum] += parseFloat(e.preis) * parseInt(e.anzahl) || 0;
  });
  var days = Object.keys(tageMap).sort();

  var btnStyle = 'padding:7px 18px;border-radius:8px;border:1.5px solid #e3beb8;cursor:pointer;font-size:14px;font-weight:600;';
  var activeStyle = btnStyle + 'background:#8B0000;color:#fff;';
  var inactiveStyle = btnStyle + 'background:#fff;color:#8B0000;';

  var topGerichteHtml = topGerichte.length === 0 ? '<p style="color:#5a403c;font-size:14px;">Keine Daten</p>' :
    topGerichte.map(function(g) {
      var pct = Math.round(g.anzahl / maxAnzahl * 100);
      return '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:13px;color:#261816;margin-bottom:3px;"><span>' + _esc(g.name) + '</span><span>' + g.anzahl + ' Stk.</span></div><div style="background:#f3e5e0;border-radius:6px;height:14px;"><div style="background:#8B0000;width:' + pct + '%;height:14px;border-radius:6px;transition:width 0.4s;"></div></div></div>';
    }).join('');

  var tageHtml = '';
  if (days.length > 0) {
    var tageRows = days.map(function(d) {
      return '<tr><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;">' + d + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;">€' + tageMap[d].toFixed(2) + '</td></tr>';
    }).join('');
    tageHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;"><h3 style="margin:0 0 12px 0;color:#8B0000;font-size:16px;">Umsatz pro Tag</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="text-align:left;padding:6px 10px;color:#5a403c;font-size:13px;">Datum</th><th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Umsatz</th></tr></thead><tbody>' + tageRows + '</tbody></table></div></div>';
  }

  var letzteEintraege = data.slice().reverse().slice(0, 50);
  var eintraegeRows = letzteEintraege.length === 0 ? '<tr><td colspan="5" style="padding:12px;text-align:center;color:#5a403c;">Keine Eintr&auml;ge</td></tr>' :
    letzteEintraege.map(function(e) {
      return '<tr><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;">' + e.datum + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;">' + _esc(e.gericht) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;">' + e.anzahl + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;">€' + parseFloat(e.preis).toFixed(2) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:center;"><button onclick="statistikDelete(\'' + e.id + '\')" style="background:none;border:none;cursor:pointer;font-size:16px;">&#x1F5D1;&#xFE0F;</button></td></tr>';
    }).join('');

  var wochenVergleichHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">' +
    '<div style="background:#e8f5e9;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:12px;color:#1b5e20;font-weight:600;">DIESE WOCHE</div><div style="font-size:22px;font-weight:700;color:#1b5e20;">&euro;' + dieseWocheUmsatz.toFixed(2) + '</div></div>' +
    '<div style="background:#fff3e0;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:12px;color:#e65100;font-weight:600;">LETZTE WOCHE</div><div style="font-size:22px;font-weight:700;color:#e65100;">&euro;' + letzteWocheUmsatz.toFixed(2) + '</div></div>' +
    '</div>';

  var wochenKpiColor = wochenVergleich === null ? '#5a403c' : (parseFloat(wochenVergleich) >= 0 ? '#1b5e20' : '#c62828');
  var wochenKpiText = wochenVergleich === null ? 'Keine Vorwoche' : (parseFloat(wochenVergleich) >= 0 ? '+' + wochenVergleich + '%' : wochenVergleich + '%');

  panel.innerHTML =
    '<div style="padding:16px;max-width:900px;margin:0 auto">' +
    _pageHdr('bar_chart', 'Verkaufsstatistik', gesamtGerichte + ' Gerichte · € ' + gesamtUmsatz.toFixed(2) + ' Umsatz') +
    '<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">' +
      '<button onclick="document.getElementById(\'panel-statistik\').dataset.view=\'tag\';renderStatistikTab();" style="' + (viewMode === 'tag' ? activeStyle : inactiveStyle) + '">Heute</button>' +
      '<button onclick="document.getElementById(\'panel-statistik\').dataset.view=\'woche\';renderStatistikTab();" style="' + (viewMode === 'woche' ? activeStyle : inactiveStyle) + '">Diese Woche</button>' +
      '<button onclick="document.getElementById(\'panel-statistik\').dataset.view=\'monat\';renderStatistikTab();" style="' + (viewMode === 'monat' ? activeStyle : inactiveStyle) + '">Dieser Monat</button>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;">' +
      '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:18px;text-align:center;">' +
        '<div style="font-size:12px;color:#5a403c;font-weight:600;letter-spacing:1px;">GESAMTUMSATZ</div>' +
        '<div style="font-size:26px;font-weight:700;color:#8B0000;margin-top:6px;">&euro;' + gesamtUmsatz.toFixed(2) + '</div>' +
      '</div>' +
      '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:18px;text-align:center;">' +
        '<div style="font-size:12px;color:#5a403c;font-weight:600;letter-spacing:1px;">VERKAUFTE GERICHTE</div>' +
        '<div style="font-size:26px;font-weight:700;color:#8B0000;margin-top:6px;">' + gesamtGerichte + '</div>' +
      '</div>' +
      '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:18px;text-align:center;">' +
        '<div style="font-size:12px;color:#5a403c;font-weight:600;letter-spacing:1px;">WOCHENVERGLEICH</div>' +
        '<div style="font-size:26px;font-weight:700;color:' + wochenKpiColor + ';margin-top:6px;">' + wochenKpiText + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">Top 10 Gerichte</h3>' +
      topGerichteHtml +
    '</div>' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 12px 0;color:#8B0000;font-size:16px;">Wochenvergleich</h3>' +
      wochenVergleichHtml +
    '</div>' +
    tageHtml +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<h3 style="margin:0;color:#8B0000;font-size:16px;">&#128200; Umsatz-Verlauf</h3>' +
      '</div>' +
      (days.length === 0
        ? '<p style="color:#777;font-size:13px;margin:0">Noch keine Daten — Einträge hinzufügen oder Demo laden.</p>'
        : '<canvas id="stat-chart" style="max-height:220px"></canvas>') +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">' +
      '<button onclick="statistikDemoLaden()" style="padding:9px 18px;background:#fff8f6;color:#8B0000;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">&#127381; Demo-Daten laden</button>' +
      '<button onclick="statistikCsvExport()" style="padding:9px 18px;background:#fff8f6;color:#1b5e20;border:1.5px solid #c8e6c9;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">&#128190; CSV Export</button>' +
    '</div>' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">Eintrag hinzuf&uuml;gen</h3>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;">' +
        '<div style="flex:1;min-width:120px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Datum</label><input type="date" id="stat-datum" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div style="flex:1;min-width:120px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Gericht</label><input type="text" id="stat-gericht" placeholder="Pizzaname..." style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div style="flex:1;min-width:120px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Anzahl</label><input type="number" id="stat-anzahl" min="1" placeholder="1" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div style="flex:1;min-width:120px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Preis (&euro;)</label><input type="number" id="stat-preis" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<button onclick="statistikAdd()" style="flex:0 0 auto;padding:8px 20px;background:#8B0000;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;white-space:nowrap;">+ Hinzuf&uuml;gen</button>' +
      '</div>' +
    '</div>' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 12px 0;color:#8B0000;font-size:16px;">Alle Eintr&auml;ge (letzte 50)</h3>' +
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr>' +
          '<th style="text-align:left;padding:6px 10px;color:#5a403c;font-size:13px;">Datum</th>' +
          '<th style="text-align:left;padding:6px 10px;color:#5a403c;font-size:13px;">Gericht</th>' +
          '<th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Anzahl</th>' +
          '<th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Preis</th>' +
          '<th style="padding:6px 10px;"></th>' +
        '</tr></thead>' +
        '<tbody>' + eintraegeRows + '</tbody>' +
      '</table>' +
      '</div>' +
    '</div>' +
    '<div id="preisverlauf-section" style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;">' +
      '<h3 style="margin:0 0 6px 0;color:#8B0000;font-size:16px;">&#128200; Einkaufspreise Verlauf</h3>' +
      '<p style="font-size:12px;color:#8d6562;margin:0 0 14px">Wird aus gescannten Rechnungen automatisch bef\xFCllt (braucht <strong>node server.js</strong>)</p>' +
      '<div style="color:#777;font-size:13px">Lade...</div>' +
    '</div>' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-top:18px;">' +
      '<h3 style="margin:0 0 6px 0;color:#1b5e20;font-size:16px;">&#128722; Einkaufsausgaben (letzte 30 Tage)</h3>' +
      '<p style="font-size:12px;color:#8d6562;margin:0 0 14px">Aus Einkaufs-Verlauf (Eintr\xE4ge mit Preis)</p>' +
      '<canvas id="einkauf-history-chart" style="max-height:220px"></canvas>' +
    '</div>' +
    '</div>';
  loadPreisverlaufSection();

  // Umsatz-Verlauf Chart (Verkaufsstatistik)
  if (days.length > 0) {
    if (window._chartStatistik) window._chartStatistik.destroy();
    var ctx = document.getElementById('stat-chart');
    if (ctx && window.Chart) {
      window._chartStatistik = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{ label: 'Umsatz \u20AC', data: days.map(function(d) { return parseFloat(tageMap[d].toFixed(2)); }),
            borderColor: '#8B0000', backgroundColor: 'rgba(139,0,0,0.08)',
            tension: 0.3, fill: true, pointRadius: 4, pointBackgroundColor: '#8B0000' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '\u20AC' + v; } } } } }
      });
    }
  }

  // Einkaufsausgaben-Chart aus pizzeria_history (letzte 30 Tage)
  (function() {
    var histData = [];
    try { histData = JSON.parse(localStorage.getItem('pizzeria_history') || '[]'); } catch(ex) {}

    // Letzten 30 Tage als Datum-Labels aufbauen
    var histMap = {};
    var nowH = new Date();
    var d30Labels = [];
    for (var hi = 29; hi >= 0; hi--) {
      var hd = new Date(nowH);
      hd.setDate(nowH.getDate() - hi);
      var hds = hd.toISOString().slice(0, 10);
      d30Labels.push(hds);
      histMap[hds] = 0;
    }

    // Reale Daten summieren
    var hasRealData = false;
    histData.forEach(function(e) {
      if (e.datum && e.preis != null && histMap[e.datum] !== undefined) {
        histMap[e.datum] += parseFloat(e.preis) || 0;
        hasRealData = true;
      }
    });

    // Fallback: Demo-Daten wenn keine echten vorhanden
    var chartValues;
    if (!hasRealData) {
      chartValues = d30Labels.map(function() { return Math.round(Math.random() * 80 + 20); });
    } else {
      chartValues = d30Labels.map(function(dl) { return parseFloat((histMap[dl] || 0).toFixed(2)); });
    }

    var ctxH = document.getElementById('einkauf-history-chart');
    if (ctxH && window.Chart) {
      if (window._chartEinkaufHistory) window._chartEinkaufHistory.destroy();
      window._chartEinkaufHistory = new window.Chart(ctxH, {
        type: 'line',
        data: {
          labels: d30Labels.map(function(dl) { return dl.slice(5); }),
          datasets: [{ label: 'Einkauf \u20AC', data: chartValues,
            borderColor: '#1b5e20', backgroundColor: 'rgba(27,94,32,0.08)',
            tension: 0.3, fill: true, pointRadius: 3, pointBackgroundColor: '#1b5e20' }]
        },
        options: { responsive: true, plugins: { legend: { display: false },
          tooltip: { callbacks: { footer: !hasRealData ? function() { return 'Demo-Daten'; } : undefined } } },
          scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '\u20AC' + v; } } } } }
      });
    }
  })();
}

async function loadPreisverlaufSection() {
  const el = document.getElementById('preisverlauf-section');
  if (!el) return;
  try {
    const [statsResp, recentResp] = await Promise.all([
      fetch('/api/preisverlauf/stats'),
      fetch('/api/preisverlauf?limit=20'),
    ]);
    if (!statsResp.ok) throw new Error('Server nicht erreichbar');
    const stats  = await statsResp.json();
    const recent = await recentResp.json();

    if (!stats.length) {
      el.innerHTML =
        '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">&#128200; Einkaufspreise Verlauf</h3>' +
        '<p style="color:#777;font-size:13px;margin:0">Noch keine Daten — Rechnungen scannen um Preise zu speichern.</p>';
      return;
    }

    const statsRows = stats.map(r =>
      `<tr style="border-bottom:1px solid #f3ebe9">
        <td style="padding:6px 10px;font-size:13px;font-weight:600">${r.produkt}</td>
        <td style="padding:6px 10px;font-size:12px;color:#5a403c">${r.shop||'—'}</td>
        <td style="padding:6px 10px;font-size:13px;text-align:right;color:#2e7d32">€${r.min_preis.toFixed(2)}</td>
        <td style="padding:6px 10px;font-size:13px;text-align:right;color:#5a403c">€${r.avg_preis.toFixed(2)}</td>
        <td style="padding:6px 10px;font-size:13px;text-align:right;color:#b52619">€${r.max_preis.toFixed(2)}</td>
        <td style="padding:6px 10px;font-size:11px;color:#8d6562;text-align:right">${r.anzahl}×</td>
      </tr>`
    ).join('');

    const recentRows = recent.map(r =>
      `<tr style="border-bottom:1px solid #f3ebe9">
        <td style="padding:5px 10px;font-size:12px">${r.datum}</td>
        <td style="padding:5px 10px;font-size:12px;font-weight:600">${r.produkt}</td>
        <td style="padding:5px 10px;font-size:12px;color:#5a403c">${r.shop||'—'}</td>
        <td style="padding:5px 10px;font-size:13px;text-align:right;font-weight:700;color:#8B0000">€${parseFloat(r.preis).toFixed(2)}</td>
      </tr>`
    ).join('');

    const uniqueProducts = [];
    const seenProducts = new Set();
    stats.forEach(r => {
      const produkt = (r.produkt || '').trim();
      if (!produkt || seenProducts.has(produkt)) return;
      seenProducts.add(produkt);
      uniqueProducts.push(produkt);
    });
    const optionsHtml = uniqueProducts.map(p => `<option value="${_esc(p)}">${_esc(p)}</option>`).join('');

    el.innerHTML =
      '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">&#128200; Einkaufspreise Verlauf</h3>' +
      '<div style="overflow-x:auto;margin-bottom:18px">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<thead><tr style="background:#fff8f6">' +
            '<th style="text-align:left;padding:7px 10px;font-size:12px;color:#5a403c">Produkt</th>' +
            '<th style="text-align:left;padding:7px 10px;font-size:12px;color:#5a403c">Shop</th>' +
            '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#2e7d32">Min</th>' +
            '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#5a403c">Ø Avg</th>' +
            '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#b52619">Max</th>' +
            '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#8d6562">Einträge</th>' +
          '</tr></thead>' +
          '<tbody>' + statsRows + '</tbody>' +
        '</table>' +
      '</div>' +
      '<h4 style="margin:0 0 10px;color:#5a403c;font-size:14px;">Letzte 20 Einträge</h4>' +
      '<div style="overflow-x:auto">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<thead><tr style="background:#fff8f6">' +
            '<th style="text-align:left;padding:5px 10px;font-size:11px;color:#8d6562">Datum</th>' +
            '<th style="text-align:left;padding:5px 10px;font-size:11px;color:#8d6562">Produkt</th>' +
            '<th style="text-align:left;padding:5px 10px;font-size:11px;color:#8d6562">Shop</th>' +
            '<th style="text-align:right;padding:5px 10px;font-size:11px;color:#8d6562">Preis</th>' +
          '</tr></thead>' +
          '<tbody>' + recentRows + '</tbody>' +
        '</table>' +
      '</div>' +
      '<div style="margin-top:18px;background:#fff;border:1.5px solid #e3beb8;border-radius:12px;padding:14px">' +
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:12px">' +
          '<label for="preisverlauf-chart-select" style="font-size:12px;font-weight:700;color:#5a403c">Produkt wählen für Chart</label>' +
          '<select id="preisverlauf-chart-select" onchange="loadPreisverlaufChart(this.value)" style="min-width:240px;max-width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #e3beb8;font-size:13px;color:#261816;background:#fff;font-family:inherit">' +
            optionsHtml +
          '</select>' +
        '</div>' +
        '<div id="preisverlauf-chart-wrap" style="position:relative">' +
          '<canvas id="preisverlauf-chart-canvas" style="width:100%;height:260px"></canvas>' +
        '</div>' +
      '</div>';

    if (uniqueProducts.length > 0) {
      const selectEl = document.getElementById('preisverlauf-chart-select');
      if (selectEl) selectEl.value = uniqueProducts[0];
      loadPreisverlaufChart(uniqueProducts[0]);
    }
  } catch(_) {
    // Offline-Fallback: zeige Daten aus pizzeria_history localStorage
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('pizzeria_history') || '[]'); } catch(e) {}
    if (!hist.length) {
      el.innerHTML = '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">&#128200; Einkaufspreise Verlauf</h3>' +
        '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:20px">📴</span><div><div style="font-size:13px;font-weight:700;color:#e65100">Server offline</div>' +
        '<div style="font-size:12px;color:#7a5c00;margin-top:2px">Noch keine lokalen Einkaufsdaten vorhanden. Starte <code>node server.js</code> für Preishistorie.</div></div></div>';
      return;
    }
    // Produkte aus localStorage gruppieren
    const prodMap = {};
    hist.forEach(e => {
      const k = (e.produktName||'').trim();
      if (!k || !e.preis) return;
      if (!prodMap[k]) prodMap[k] = { min: e.preis, max: e.preis, sum: 0, cnt: 0, shop: e.shopName||'—', zuletzt: e.datum };
      prodMap[k].min = Math.min(prodMap[k].min, e.preis);
      prodMap[k].max = Math.max(prodMap[k].max, e.preis);
      prodMap[k].sum += parseFloat(e.preis); prodMap[k].cnt++;
      if (!prodMap[k].zuletzt || e.datum > prodMap[k].zuletzt) { prodMap[k].zuletzt = e.datum; prodMap[k].shop = e.shopName||'—'; }
    });
    const rows = Object.entries(prodMap).sort((a,b)=>b[1].cnt-a[1].cnt).slice(0,20).map(([name, d]) =>
      `<tr style="border-bottom:1px solid #f3ebe9">
        <td style="padding:6px 10px;font-size:13px;font-weight:600">${_esc(name)}</td>
        <td style="padding:6px 10px;font-size:12px;color:#5a403c">${_esc(d.shop)}</td>
        <td style="padding:6px 10px;font-size:13px;text-align:right;color:#2e7d32">€${d.min.toFixed(2)}</td>
        <td style="padding:6px 10px;font-size:13px;text-align:right;color:#5a403c">€${(d.sum/d.cnt).toFixed(2)}</td>
        <td style="padding:6px 10px;font-size:13px;text-align:right;color:#b52619">€${d.max.toFixed(2)}</td>
        <td style="padding:6px 10px;font-size:11px;color:#8d6562;text-align:right">${d.cnt}×</td>
      </tr>`).join('');
    el.innerHTML = '<h3 style="margin:0 0 8px 0;color:#8B0000;font-size:16px;">&#128200; Einkaufspreise Verlauf</h3>' +
      '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:#e65100">📴 Server offline — lokale Daten aus Einkaufsverlauf ('+hist.length+' Einträge)</div>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">' +
      '<thead><tr style="background:#fff8f6"><th style="text-align:left;padding:7px 10px;font-size:12px;color:#5a403c">Produkt</th>' +
      '<th style="text-align:left;padding:7px 10px;font-size:12px;color:#5a403c">Shop</th>' +
      '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#2e7d32">Min</th>' +
      '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#5a403c">Ø Avg</th>' +
      '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#b52619">Max</th>' +
      '<th style="text-align:right;padding:7px 10px;font-size:12px;color:#8d6562">Käufe</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
  }
}

async function loadPreisverlaufChart(produkt) {
  const wrap = document.getElementById('preisverlauf-chart-wrap');
  const canvas = document.getElementById('preisverlauf-chart-canvas');
  if (!wrap || !canvas || !produkt) return;

  if (window._chartPreisverlaufShop) {
    window._chartPreisverlaufShop.destroy();
    window._chartPreisverlaufShop = null;
  }

  try {
    const resp = await fetch('/api/preisverlauf?produkt=' + encodeURIComponent(produkt) + '&limit=500');
    if (!resp.ok) throw new Error('Serverfehler');
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      wrap.innerHTML = '<div style="height:260px;display:flex;align-items:center;justify-content:center;color:#7a6460;font-size:13px">Keine Preisdaten für dieses Produkt vorhanden.</div>';
      return;
    }

    wrap.innerHTML = '<canvas id="preisverlauf-chart-canvas" style="width:100%;height:260px"></canvas>';
    const canvasNew = document.getElementById('preisverlauf-chart-canvas');
    if (!canvasNew || !window.Chart) return;

    const labels = Array.from(new Set(rows.map(r => r.datum).filter(Boolean))).sort();
    const byShop = {};
    rows.forEach(r => {
      const shop = (r.shop || 'Andere').trim() || 'Andere';
      if (!byShop[shop]) byShop[shop] = [];
      byShop[shop].push({ datum: r.datum, preis: parseFloat(r.preis) });
    });
    Object.keys(byShop).forEach(shop => byShop[shop].sort((a, b) => a.datum.localeCompare(b.datum)));

    const colorMap = { 'Metro': '#1565c0', 'Billa': '#8B0000', 'Lidl': '#f57f17', 'Spar': '#2e7d32', 'Andere': '#6b7280' };

    const datasets = Object.keys(byShop).sort().map(shop => {
      const m = {};
      byShop[shop].forEach(p => { m[p.datum] = isNaN(p.preis) ? null : p.preis; });
      return {
        label: shop,
        data: labels.map(d => m[d] != null ? m[d] : null),
        borderColor: colorMap[shop] || colorMap.Andere,
        backgroundColor: colorMap[shop] || colorMap.Andere,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        borderWidth: 2,
        spanGaps: false
      };
    });

    window._chartPreisverlaufShop = new window.Chart(canvasNew, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': €' + Number(context.parsed.y || 0).toFixed(2);
              }
            }
          }
        },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
          y: {
            min: 0,
            ticks: { stepSize: 0.5, callback: function(v) { return '€' + Number(v).toFixed(2); } }
          }
        }
      }
    });
  } catch(_) {
    wrap.innerHTML = '<div style="height:260px;display:flex;align-items:center;justify-content:center;color:#b52619;font-size:13px">Server nicht erreichbar — Preisverlauf-Chart konnte nicht geladen werden.</div>';
  }
}

function statistikAdd() {
  var datum = document.getElementById('stat-datum').value;
  var gericht = document.getElementById('stat-gericht').value.trim();
  var anzahl = parseInt(document.getElementById('stat-anzahl').value);
  var preis = parseFloat(document.getElementById('stat-preis').value);
  if (!datum) { _markField('stat-datum', true); _showToast('Bitte Datum angeben', 'error'); return; }
  if (!gericht) { _markField('stat-gericht', true); _showToast('Bitte Gericht angeben', 'error'); return; }
  if (!anzahl || anzahl < 1) { _markField('stat-anzahl', true); _showToast('Bitte gültige Anzahl angeben', 'error'); return; }
  if (isNaN(preis) || preis < 0) { _markField('stat-preis', true); _showToast('Bitte gültigen Preis angeben', 'error'); return; }
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_statistik') || '[]'); } catch(ex) {}
  data.push({ id: Date.now().toString(), datum: datum, gericht: gericht, anzahl: anzahl, preis: preis });
  localStorage.setItem('pizzeria_statistik', JSON.stringify(data));
  document.getElementById('stat-gericht').value = '';
  document.getElementById('stat-anzahl').value = '';
  document.getElementById('stat-preis').value = '';
  _showToast('Eintrag gespeichert', 'success');
  renderStatistikTab();
}

function statistikDelete(id) {
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_statistik') || '[]'); } catch(ex) {}
  data = data.filter(function(e) { return e.id !== id; });
  localStorage.setItem('pizzeria_statistik', JSON.stringify(data));
  _showToast('Gelöscht', 'info');
  renderStatistikTab();
}

function statistikDemoLaden() {
  var gerichte = ['Margherita','Salami','Diavola','Quattro Formaggi','Prosciutto','Vegetariana','Tonno','Funghi'];
  var data = [];
  var heute = new Date();
  for (var i = 27; i >= 0; i--) {
    var d = new Date(heute); d.setDate(heute.getDate() - i);
    var datum = d.toISOString().slice(0,10);
    var eintraege = 3 + Math.floor(Math.random() * 5);
    for (var j = 0; j < eintraege; j++) {
      data.push({ id: Date.now() + '_' + i + '_' + j, datum: datum,
        gericht: gerichte[Math.floor(Math.random() * gerichte.length)],
        anzahl: 1 + Math.floor(Math.random() * 6),
        preis: (8 + Math.floor(Math.random() * 8)) + '.00' });
    }
  }
  localStorage.setItem('pizzeria_statistik', JSON.stringify(data));
  _showToast('Demo-Daten geladen (28 Tage)', 'success');
  renderStatistikTab();
}

function statistikCsvExport() {
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_statistik') || '[]'); } catch(ex) {}
  if (!data.length) { _showToast('Keine Daten zum Exportieren', 'warning'); return; }
  var csv = 'Datum,Gericht,Anzahl,Preis,Gesamt\n' + data.map(function(e) {
    return [e.datum, '"'+e.gericht+'"', e.anzahl, e.preis, (parseFloat(e.preis)*parseInt(e.anzahl)).toFixed(2)].join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'statistik_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  _showToast('CSV exportiert', 'success');
}

function renderTagesangeboteTab() {
  var panel = document.getElementById('panel-tagesangebote');
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_tagesangebote') || '[]'); } catch(ex) {}
  var today = new Date().toISOString().slice(0, 10);

  var aktive = data.filter(function(a) { return a.von <= today && a.bis >= today; });
  var zukuenftige = data.filter(function(a) { return a.von > today; });
  var abgelaufene = data.filter(function(a) { return a.bis < today; }).slice(-10).reverse();

  var bannerHtml = '';
  if (aktive.length > 0) {
    var gerichtNamen = aktive.map(function(a) { return _esc(a.gericht); }).join(', ');
    bannerHtml = '<div style="background:#e8f5e9;border:1.5px solid #a5d6a7;border-radius:12px;padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;gap:12px;">' +
      '<span style="font-size:22px;">&#x1F7E2;</span>' +
      '<div><div style="font-weight:700;color:#1b5e20;font-size:15px;">' + aktive.length + ' aktives Angebot' + (aktive.length > 1 ? 'e' : '') + '</div>' +
      '<div style="color:#2e7d32;font-size:13px;">' + gerichtNamen + '</div></div></div>';
  }

  var aktiveHtml = '';
  if (aktive.length === 0) {
    aktiveHtml = '<p style="color:#5a403c;font-size:14px;">Keine aktiven Angebote.</p>';
  } else {
    aktiveHtml = aktive.map(function(a) {
      var rabatt = Math.round((1 - parseFloat(a.preis) / parseFloat(a.original)) * 100);
      var diffMs = new Date(a.bis + 'T23:59:59') - new Date();
      var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      var marge = parseFloat(a.preis) - parseFloat(a.original);
      var margeHtml = ' &nbsp;|&nbsp; <span style="font-weight:700;color:' + (marge >= 0 ? '#1b5e20' : '#c62828') + '">Marge: ' + (marge >= 0 ? '+' : '') + marge.toFixed(2) + '€</span>';
      var margeWarnung = rabatt > 40 ? '<div style="background:#ffebee;border-radius:7px;padding:6px 10px;margin-top:8px;color:#c62828;font-size:13px;font-weight:600;">&#x26A0;&#xFE0F; Rabatt &uuml;ber 40% &mdash; Marge pr&uuml;fen!</div>' : '';
      var diffH = Math.floor(diffMs / (1000 * 60 * 60));
      var countdown = diffDays <= 0
        ? (diffH <= 0 ? '&#x23F0; L&auml;uft heute ab!' : '&#x23F0; Noch ' + diffH + ' Std. heute')
        : ('Noch ' + diffDays + ' Tag' + (diffDays > 1 ? 'e' : ''));
      return '<div style="background:#fff;border-radius:14px;border:1.5px solid #a5d6a7;padding:16px 20px;margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
        '<div>' +
        '<div style="font-size:16px;font-weight:700;color:#261816;">' + _esc(a.gericht) + '</div>' +
        '<div style="margin-top:6px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
        '<span style="text-decoration:line-through;color:#5a403c;font-size:14px;">&euro;' + parseFloat(a.original).toFixed(2) + '</span>' +
        '<span style="font-size:20px;font-weight:700;color:#8B0000;">&euro;' + parseFloat(a.preis).toFixed(2) + '</span>' +
        '<span style="background:#e8f5e9;color:#1b5e20;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700;">-' + rabatt + '%</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#5a403c;margin-top:6px;">' + countdown + ' &nbsp;|&nbsp; ' + a.von + ' &ndash; ' + a.bis + margeHtml + '</div>' +
        margeWarnung +
        '</div>' +
        '<button onclick="angebotDelete(\'' + a.id + '\')" style="background:none;border:none;cursor:pointer;font-size:18px;">&#x1F5D1;&#xFE0F;</button>' +
        '</div></div>';
    }).join('');
  }

  var zukuenftigeHtml = '';
  if (zukuenftige.length > 0) {
    zukuenftigeHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 12px 0;color:#8B0000;font-size:16px;">K&uuml;nftige Angebote</h3>' +
      zukuenftige.map(function(a) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f3e5e0;">' +
          '<span style="color:#261816;font-weight:600;">' + _esc(a.gericht) + '</span>' +
          '<span style="color:#5a403c;font-size:13px;">ab ' + a.von + '</span>' +
          '<button onclick="angebotDelete(\'' + a.id + '\')" style="background:none;border:none;cursor:pointer;font-size:16px;">&#x1F5D1;&#xFE0F;</button>' +
          '</div>';
      }).join('') +
    '</div>';
  }

  var abgelaufeneHtml = '';
  if (abgelaufene.length > 0) {
    abgelaufeneHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;opacity:0.7;">' +
      '<h3 style="margin:0 0 12px 0;color:#5a403c;font-size:16px;">Abgelaufene Angebote (letzte 10)</h3>' +
      abgelaufene.map(function(a) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f3e5e0;">' +
          '<span style="color:#5a403c;">' + _esc(a.gericht) + '</span>' +
          '<span style="color:#5a403c;font-size:13px;">&euro;' + parseFloat(a.preis).toFixed(2) + ' &nbsp;|&nbsp; bis ' + a.bis + '</span>' +
          '<button onclick="angebotDelete(\'' + a.id + '\')" style="background:none;border:none;cursor:pointer;font-size:16px;">&#x1F5D1;&#xFE0F;</button>' +
          '</div>';
      }).join('') +
    '</div>';
  }

  panel.innerHTML =
    '<div style="padding:16px;max-width:900px;margin:0 auto">' +
    _pageHdr('local_offer', 'Tagesangebote', aktive.length + ' aktiv · ' + zukuenftige.length + ' geplant') +
    bannerHtml +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">Neues Angebot</h3>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:10px;">' +
        '<div style="flex:1;min-width:130px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Gericht</label><input type="text" id="angebot-gericht" placeholder="Pizzaname..." style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div style="flex:1;min-width:130px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Originalpreis &euro;</label><input type="number" id="angebot-original" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div style="flex:1;min-width:130px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Angebotspreis &euro;</label><input type="number" id="angebot-preis" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div style="flex:1;min-width:130px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Von</label><input type="date" id="angebot-von" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div style="flex:1;min-width:130px;"><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Bis</label><input type="date" id="angebot-bis" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<button onclick="angebotAdd()" style="flex:0 0 auto;padding:8px 20px;background:#8B0000;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">+ Angebot speichern</button>' +
      '</div>' +
    '</div>' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">Aktive Angebote</h3>' +
      aktiveHtml +
    '</div>' +
    zukuenftigeHtml +
    abgelaufeneHtml +
    '</div>';

  clearInterval(window._tagesangeboteTimer);
  window._tagesangeboteTimer = setInterval(function() {
    if (document.getElementById('panel-tagesangebote')?.style.display !== 'none') renderTagesangeboteTab();
    else clearInterval(window._tagesangeboteTimer);
  }, 60000);
}

function angebotAdd() {
  var gericht = document.getElementById('angebot-gericht').value.trim();
  var original = parseFloat(document.getElementById('angebot-original').value);
  var preis = parseFloat(document.getElementById('angebot-preis').value);
  var von = document.getElementById('angebot-von').value;
  var bis = document.getElementById('angebot-bis').value;
  if (!gericht) { _markField('angebot-gericht', true); _showToast('Bitte Gericht angeben', 'error'); return; }
  if (isNaN(original) || original <= 0) { _markField('angebot-original', true); _showToast('Bitte g\u00fcltigen Originalpreis angeben', 'error'); return; }
  if (isNaN(preis) || preis <= 0) { _markField('angebot-preis', true); _showToast('Bitte g\u00fcltigen Angebotspreis angeben', 'error'); return; }
  if (preis >= original) { _markField('angebot-preis', true); _showToast('Angebotspreis muss kleiner als Originalpreis sein', 'error'); return; }
  if (!von) { _markField('angebot-von', true); _showToast('Bitte Von-Datum angeben', 'error'); return; }
  if (!bis) { _markField('angebot-bis', true); _showToast('Bitte Bis-Datum angeben', 'error'); return; }
  if (bis < von) { _markField('angebot-bis', true); _showToast('Bis-Datum muss nach Von-Datum liegen', 'error'); return; }
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_tagesangebote') || '[]'); } catch(ex) {}
  data.push({ id: Date.now().toString(), gericht: gericht, original: original, preis: preis, von: von, bis: bis });
  localStorage.setItem('pizzeria_tagesangebote', JSON.stringify(data));
  document.getElementById('angebot-gericht').value = '';
  document.getElementById('angebot-original').value = '';
  document.getElementById('angebot-preis').value = '';
  document.getElementById('angebot-von').value = '';
  document.getElementById('angebot-bis').value = '';
  _showToast('Angebot gespeichert \u2713', 'success');
  renderTagesangeboteTab();
}

function angebotDelete(id) {
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_tagesangebote') || '[]'); } catch(ex) {}
  data = data.filter(function(a) { return a.id !== id; });
  localStorage.setItem('pizzeria_tagesangebote', JSON.stringify(data));
  _showToast('Angebot gel\u00f6scht', 'info');
  renderTagesangeboteTab();
}

function renderUmsatzTab() {
  var panel = document.getElementById('panel-umsatz');
  var einnahmen = [];
  var ausgaben = [];
  var ziel = 0;
  try { einnahmen = JSON.parse(localStorage.getItem('pizzeria_umsatz_einnahmen') || '[]'); } catch(ex) {}
  try { ausgaben = JSON.parse(localStorage.getItem('pizzeria_umsatz_ausgaben') || '[]'); } catch(ex) {}
  try { ziel = parseFloat(localStorage.getItem('pizzeria_umsatz_ziel') || '0') || 0; } catch(ex) {}

  // DB-Stand laden und im Banner anzeigen (asynchron, nicht blockierend)
  var dbBannerId = 'umsatz-db-banner';
  var dbBannerHtml = '<div id="' + dbBannerId + '" style="background:#e3f2fd;border:1.5px solid #90caf9;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#1565c0">&#128197; Lade heutigen DB-Umsatz...</div>';
  (function() {
    fetch('/api/umsatz/heute')
      .then(function(r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function(d) {
        var el = document.getElementById(dbBannerId);
        if (!el) return;
        var shopList = (d.shops || []).map(function(s) { return s.shop + ': &euro;' + (s.gesamt || 0).toFixed(2); }).join(' &nbsp;|&nbsp; ');
        el.innerHTML = '&#128202; <strong>Heutiger DB-Einkaufsstand (' + (d.datum || '') + '):</strong> Gesamt &euro;' + (d.gesamt || 0).toFixed(2) + (shopList ? ' &nbsp;&mdash;&nbsp; ' + shopList : '');
        el.style.background = '#e8f5e9';
        el.style.borderColor = '#a5d6a7';
        el.style.color = '#1b5e20';
      })
      .catch(function() {
        var el = document.getElementById(dbBannerId);
        if (el) { el.innerHTML = '&#127381; DB-Stand nicht verf&uuml;gbar &mdash; <span style="font-size:12px">Server starten: <code>node server.js</code></span>'; el.style.background = '#fff8e1'; el.style.borderColor = '#f9a825'; el.style.color = '#e65100'; }
      });
  })();

  var now = new Date();
  var firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  var monatEin = einnahmen.filter(function(e) { return new Date(e.datum) >= firstOfMonth; });
  var monatAus = ausgaben.filter(function(e) { return new Date(e.datum) >= firstOfMonth; });
  var monatGesamtEin = monatEin.reduce(function(s, e) {
    var kasse = parseFloat(e.kasse)||0;
    // Neue Einträge: lieferando + wolt + mjam; Alte: lieferdienst
    var plattform = (e.lieferando||e.wolt||e.mjam) ?
      (parseFloat(e.lieferando)||0) + (parseFloat(e.wolt)||0) + (parseFloat(e.mjam)||0) :
      (parseFloat(e.lieferdienst)||0);
    return s + kasse + plattform;
  }, 0);
  var monatGesamtAus = monatAus.reduce(function(s, e) { return s + (parseFloat(e.betrag) || 0); }, 0);
  var monatGewinn = monatGesamtEin - monatGesamtAus;

  var zielPct = ziel > 0 ? Math.min(Math.round(monatGesamtEin / ziel * 100), 100) : 0;
  var zielBarColor = zielPct >= 100 ? '#1b5e20' : (zielPct >= 70 ? '#f57f17' : '#c62828');
  var zielBarBg = zielPct >= 100 ? '#e8f5e9' : (zielPct >= 70 ? '#fffde7' : '#ffebee');

  var zielHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
    '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">&#x1F3AF; Monatsziel</h3>' +
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">' +
    '<input type="number" id="umsatz-ziel" value="' + (ziel > 0 ? ziel : '') + '" placeholder="Ziel in &euro;" min="0" step="0.01" style="padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;width:180px;">' +
    '<button onclick="umsatzSetZiel()" style="padding:8px 18px;background:#8B0000;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">Setzen</button>' +
    '</div>' +
    (ziel > 0 ?
      '<div style="background:#f3e5e0;border-radius:8px;height:18px;margin-bottom:8px;"><div style="background:' + zielBarColor + ';width:' + zielPct + '%;height:18px;border-radius:8px;transition:width 0.4s;"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:' + zielBarColor + ';font-weight:600;">&euro;' + monatGesamtEin.toFixed(2) + ' von &euro;' + ziel.toFixed(2) + '</span><span style="background:' + zielBarBg + ';color:' + zielBarColor + ';border-radius:12px;padding:2px 10px;font-weight:700;">' + zielPct + '%</span></div>'
      : '<div style="color:#5a403c;font-size:13px;">Kein Ziel gesetzt.</div>') +
    '</div>';

  var gewinnColor = monatGewinn >= 0 ? '#1b5e20' : '#c62828';
  var gewinnBg = monatGewinn >= 0 ? '#e8f5e9' : '#ffebee';

  var kpiHtml = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;">' +
    '<div style="background:#e8f5e9;border-radius:14px;border:1.5px solid #a5d6a7;padding:18px;text-align:center;">' +
      '<div style="font-size:12px;color:#1b5e20;font-weight:600;letter-spacing:1px;">EINNAHMEN</div>' +
      '<div style="font-size:26px;font-weight:700;color:#1b5e20;margin-top:6px;">&euro;' + monatGesamtEin.toFixed(2) + '</div>' +
    '</div>' +
    '<div style="background:#ffebee;border-radius:14px;border:1.5px solid #ef9a9a;padding:18px;text-align:center;">' +
      '<div style="font-size:12px;color:#c62828;font-weight:600;letter-spacing:1px;">AUSGABEN</div>' +
      '<div style="font-size:26px;font-weight:700;color:#c62828;margin-top:6px;">&euro;' + monatGesamtAus.toFixed(2) + '</div>' +
    '</div>' +
    '<div style="background:' + gewinnBg + ';border-radius:14px;border:1.5px solid #e3beb8;padding:18px;text-align:center;">' +
      '<div style="font-size:12px;color:' + gewinnColor + ';font-weight:600;letter-spacing:1px;">GEWINN / VERLUST</div>' +
      '<div style="font-size:26px;font-weight:700;color:' + gewinnColor + ';margin-top:6px;">' + (monatGewinn >= 0 ? '+' : '') + '&euro;' + monatGewinn.toFixed(2) + '</div>' +
    '</div>' +
  '</div>';

  var formHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;">' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;">' +
      '<h3 style="margin:0 0 14px 0;color:#1b5e20;font-size:15px;">Einnahme eintragen</h3>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Datum</label><input type="date" id="ein-datum" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">💵 Kasse &euro;</label><input type="number" id="ein-kasse" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;"><img src="https://cdn.worldvectorlogo.com/logos/lieferando.svg" style="width:14px;height:14px;vertical-align:middle;margin-right:4px" onerror="this.style.display=\'none\'">Lieferando &euro;</label><input type="number" id="ein-lieferando" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #ff6200;font-size:14px;box-sizing:border-box;"></div>' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">🟦 Wolt &euro;</label><input type="number" id="ein-wolt" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #009de0;font-size:14px;box-sizing:border-box;"></div>' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">🟠 Mjam &euro;</label><input type="number" id="ein-mjam" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #f5820a;font-size:14px;box-sizing:border-box;"></div>' +
        '<button onclick="umsatzAddEinnahme()" style="padding:9px;background:#1b5e20;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">+ Einnahme speichern</button>' +
      '</div>' +
    '</div>' +
    '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;">' +
      '<h3 style="margin:0 0 14px 0;color:#c62828;font-size:15px;">Ausgabe eintragen</h3>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Datum</label><input type="date" id="aus-datum" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Kategorie</label><select id="aus-kategorie" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"><option value="Einkauf">Einkauf</option><option value="Personal">Personal</option><option value="Miete">Miete</option><option value="Strom/Gas">Strom/Gas</option><option value="Versicherung">Versicherung</option><option value="Buchhaltung">Buchhaltung</option><option value="Lieferando Provision">🟠 Lieferando Provision</option><option value="Wolt Provision">🟦 Wolt Provision</option><option value="Mjam Provision">🟠 Mjam Provision</option><option value="Sonstiges">Sonstiges</option></select></div>' +
        '<div><label style="font-size:12px;color:#5a403c;font-weight:600;display:block;margin-bottom:4px;">Betrag &euro;</label><input type="number" id="aus-betrag" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e3beb8;font-size:14px;box-sizing:border-box;"></div>' +
        '<button onclick="umsatzAddAusgabe()" style="padding:9px;background:#c62828;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">+ Ausgabe speichern</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  var wocheRows = '';
  var wi;
  for (wi = 6; wi >= 0; wi--) {
    var wd = new Date(now);
    wd.setDate(now.getDate() - wi);
    var wds = wd.toISOString().slice(0, 10);
    var tagDaten = einnahmen.filter(function(e) { return e.datum === wds; });
    var tagKasse = tagDaten.reduce(function(s,e){return s+(parseFloat(e.kasse)||0);},0);
    var tagLieferando = tagDaten.reduce(function(s,e){return s+(parseFloat(e.lieferando)||0);},0);
    var tagWolt = tagDaten.reduce(function(s,e){return s+(parseFloat(e.wolt)||0);},0);
    var tagMjam = tagDaten.reduce(function(s,e){return s+(parseFloat(e.mjam)||0);},0);
    // Rückwärtskomp: alte Einträge haben nur lieferdienst ohne lieferando/wolt/mjam
    var tagLieferSonstige = tagDaten.filter(function(e){return !e.lieferando&&!e.wolt&&!e.mjam;}).reduce(function(s,e){return s+(parseFloat(e.lieferdienst)||0);},0);
    var tagEin = tagKasse + tagLieferando + tagWolt + tagMjam + tagLieferSonstige;
    var tagAus = ausgaben.filter(function(e) { return e.datum === wds; }).reduce(function(s, e) { return s + (parseFloat(e.betrag) || 0); }, 0);
    var tagGewinn = tagEin - tagAus;
    var gColor = tagGewinn >= 0 ? '#1b5e20' : '#c62828';
    wocheRows += '<tr>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;">' + wds + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;color:#1b5e20;">&euro;' + tagEin.toFixed(2) + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;color:#c62828;">&euro;' + tagAus.toFixed(2) + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;color:' + gColor + ';font-weight:600;">' + (tagGewinn >= 0 ? '+' : '') + '&euro;' + tagGewinn.toFixed(2) + '</td>' +
    '</tr>';
  }
  var wocheHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
    '<h3 style="margin:0 0 12px 0;color:#8B0000;font-size:16px;">Woche&uuml;bersicht (letzte 7 Tage)</h3>' +
    '<div style="overflow-x:auto">' +
    '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr>' +
        '<th style="text-align:left;padding:6px 10px;color:#5a403c;font-size:13px;">Datum</th>' +
        '<th style="text-align:right;padding:6px 10px;color:#1b5e20;font-size:13px;">Einnahmen</th>' +
        '<th style="text-align:right;padding:6px 10px;color:#c62828;font-size:13px;">Ausgaben</th>' +
        '<th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Gewinn/Verlust</th>' +
      '</tr></thead>' +
      '<tbody>' + wocheRows + '</tbody>' +
    '</table>' +
    '</div></div>';

  var einnahmenTabelleHtml = '';
  if (einnahmen.length > 0) {
    var letzteEin = einnahmen.slice().reverse().slice(0, 20);
    einnahmenTabelleHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 12px 0;color:#8B0000;font-size:16px;">Letzte 20 Einnahmen</h3>' +
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr>' +
          '<th style="text-align:left;padding:6px 10px;color:#5a403c;font-size:13px;">Datum</th>' +
          '<th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Kasse</th>' +
          '<th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Lieferdienst</th>' +
          '<th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Gesamt</th>' +
          '<th style="padding:6px 10px;"></th>' +
        '</tr></thead>' +
        '<tbody>' +
        letzteEin.map(function(e) {
          var ges = (parseFloat(e.kasse) || 0) + (parseFloat(e.lieferdienst) || 0);
          return '<tr><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;">' + e.datum + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;">&euro;' + (parseFloat(e.kasse) || 0).toFixed(2) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;">&euro;' + (parseFloat(e.lieferdienst) || 0).toFixed(2) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;font-weight:600;color:#1b5e20;">&euro;' + ges.toFixed(2) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:center;"><button onclick="umsatzDeleteEinnahme(\'' + e.id + '\')" style="background:none;border:none;cursor:pointer;font-size:16px;">&#x1F5D1;&#xFE0F;</button></td></tr>';
        }).join('') +
        '</tbody></table>' +
        '</div></div>';
  } else {
    einnahmenTabelleHtml = '<p style="color:#9b8b87;font-style:italic;padding:8px 0;">Noch keine Einnahmen eingetragen.</p>';
  }

  var ausgabenTabelleHtml = '';
  if (ausgaben.length > 0) {
    var letzteAus = ausgaben.slice().reverse().slice(0, 20);
    ausgabenTabelleHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
      '<h3 style="margin:0 0 12px 0;color:#8B0000;font-size:16px;">Letzte 20 Ausgaben</h3>' +
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr>' +
          '<th style="text-align:left;padding:6px 10px;color:#5a403c;font-size:13px;">Datum</th>' +
          '<th style="text-align:left;padding:6px 10px;color:#5a403c;font-size:13px;">Kategorie</th>' +
          '<th style="text-align:right;padding:6px 10px;color:#5a403c;font-size:13px;">Betrag</th>' +
          '<th style="padding:6px 10px;"></th>' +
        '</tr></thead>' +
        '<tbody>' +
        letzteAus.map(function(e) {
          return '<tr><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;">' + _esc(e.datum) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;">' + _esc(e.kategorie) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:right;color:#c62828;font-weight:600;">&euro;' + parseFloat(e.betrag).toFixed(2) + '</td><td style="padding:6px 10px;border-bottom:1px solid #f3e5e0;text-align:center;"><button onclick="umsatzDeleteAusgabe(\'' + e.id + '\')" style="background:none;border:none;cursor:pointer;font-size:16px;">&#x1F5D1;&#xFE0F;</button></td></tr>';
        }).join('') +
        '</tbody></table>' +
        '</div></div>';
  } else {
    ausgabenTabelleHtml = '<p style="color:#9b8b87;font-style:italic;padding:8px 0;">Noch keine Ausgaben eingetragen.</p>';
  }

  // Plattform-Daten für Chart (aktueller Monat)
  var chartKasse = 0, chartLD = 0, chartWolt = 0, chartMjam = 0, chartAlt = 0;
  monatEin.forEach(function(e) {
    chartKasse += parseFloat(e.kasse)||0;
    if (e.lieferando||e.wolt||e.mjam) {
      chartLD   += parseFloat(e.lieferando)||0;
      chartWolt += parseFloat(e.wolt)||0;
      chartMjam += parseFloat(e.mjam)||0;
    } else {
      chartAlt += parseFloat(e.lieferdienst)||0;
    }
  });
  var chartPlatformHtml = '<div style="background:#fff;border-radius:14px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:18px;">' +
    '<h3 style="margin:0 0 14px 0;color:#8B0000;font-size:16px;">&#x1F4CA; Plattform-Vergleich — ' + new Date().toLocaleDateString('de-AT', {month:'long',year:'numeric'}) + '</h3>' +
    '<canvas id="umsatz-platform-chart" height="120"></canvas>' +
    '</div>';

  panel.innerHTML = '<div style="padding:16px;max-width:900px;margin:0 auto">' +
    _pageHdr('payments', 'Umsatz-Dashboard', new Date().toLocaleDateString('de-AT', {month:'long', year:'numeric'})) +
    dbBannerHtml + zielHtml + kpiHtml + chartPlatformHtml + formHtml + wocheHtml + einnahmenTabelleHtml + ausgabenTabelleHtml +
    '</div>';

  // Chart.js Balkendiagramm initialisieren
  (function() {
    var ctx = document.getElementById('umsatz-platform-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (window._umsatzPlatformChart) { try { window._umsatzPlatformChart.destroy(); } catch(_) {} }
    var ldLabel = chartAlt > 0 && chartLD === 0 ? 'Lieferdienst (alt)' : 'Lieferando';
    var ldVal   = chartLD > 0 ? chartLD : chartAlt;
    window._umsatzPlatformChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['💵 Kasse', '🟠 ' + ldLabel, '🟦 Wolt', '🟠 Mjam'],
        datasets: [{
          label: 'Umsatz ' + new Date().toLocaleDateString('de-AT', {month:'long',year:'numeric'}),
          data: [chartKasse, ldVal, chartWolt, chartMjam],
          backgroundColor: ['#2e7d32','#ff6200','#009de0','#f5820a'],
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(ctx) { return '€' + ctx.raw.toFixed(2); } } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: function(v) { return '€' + v; } } }
        }
      }
    });
  })();
}

function umsatzAddEinnahme() {
  var datum = document.getElementById('ein-datum').value;
  var kasse = parseFloat(document.getElementById('ein-kasse').value) || 0;
  var ld = document.getElementById('ein-lieferando'); var lieferando = ld ? (parseFloat(ld.value)||0) : 0;
  var we = document.getElementById('ein-wolt');      var wolt = we ? (parseFloat(we.value)||0) : 0;
  var mj = document.getElementById('ein-mjam');      var mjam = mj ? (parseFloat(mj.value)||0) : 0;
  var total = kasse + lieferando + wolt + mjam;
  if (!datum) { _markField('ein-datum', true); _showToast('Bitte Datum angeben', 'error'); return; }
  if (total <= 0) { _markField('ein-kasse', true); _showToast('Bitte mindestens einen Betrag angeben', 'error'); return; }
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_umsatz_einnahmen') || '[]'); } catch(ex) {}
  data.push({ id: Date.now().toString(), datum: datum, kasse: kasse,
    lieferando: lieferando, wolt: wolt, mjam: mjam,
    lieferdienst: lieferando + wolt + mjam });
  localStorage.setItem('pizzeria_umsatz_einnahmen', JSON.stringify(data));
  ['ein-kasse','ein-lieferando','ein-wolt','ein-mjam'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  _showToast('Einnahme gespeichert ✓', 'success');
  renderUmsatzTab();
  fetch('/api/umsatz/heute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datum: datum, kasse: kasse, lieferando: lieferando, wolt: wolt, mjam: mjam,
      lieferdienst: lieferando + wolt + mjam })
  }).catch(function() {});
}

function umsatzAddAusgabe() {
  var datum = document.getElementById('aus-datum').value;
  var kategorie = document.getElementById('aus-kategorie').value;
  var betrag = parseFloat(document.getElementById('aus-betrag').value);
  if (!datum) { _markField('aus-datum', true); _showToast('Bitte Datum angeben', 'error'); return; }
  if (isNaN(betrag) || betrag <= 0) { _markField('aus-betrag', true); _showToast('Bitte g\u00fcltigen Betrag angeben', 'error'); return; }
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_umsatz_ausgaben') || '[]'); } catch(ex) {}
  data.push({ id: Date.now().toString(), datum: datum, kategorie: kategorie, betrag: betrag });
  localStorage.setItem('pizzeria_umsatz_ausgaben', JSON.stringify(data));
  document.getElementById('aus-betrag').value = '';
  _showToast('Ausgabe gespeichert \u2713', 'success');
  renderUmsatzTab();
}

function umsatzDeleteEinnahme(id) {
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_umsatz_einnahmen') || '[]'); } catch(ex) {}
  data = data.filter(function(e) { return e.id !== id; });
  localStorage.setItem('pizzeria_umsatz_einnahmen', JSON.stringify(data));
  _showToast('Gel\u00f6scht', 'info');
  renderUmsatzTab();
}

function umsatzDeleteAusgabe(id) {
  var data = [];
  try { data = JSON.parse(localStorage.getItem('pizzeria_umsatz_ausgaben') || '[]'); } catch(ex) {}
  data = data.filter(function(e) { return e.id !== id; });
  localStorage.setItem('pizzeria_umsatz_ausgaben', JSON.stringify(data));
  _showToast('Gel\u00f6scht', 'info');
  renderUmsatzTab();
}

function umsatzSetZiel() {
  var val = parseFloat(document.getElementById('umsatz-ziel').value);
  if (isNaN(val) || val <= 0) { _markField('umsatz-ziel', true); _showToast('Bitte g\u00fcltiges Ziel angeben', 'error'); return; }
  _safeLocalSet('pizzeria_umsatz_ziel', val.toString());
  _showToast('Monatsziel gesetzt \u2713', 'success');
  renderUmsatzTab();
}

// ═══════════════════════════════════════════════════════════════
// GEWINN-DASHBOARD
// ═══════════════════════════════════════════════════════════════
function renderGewinnTab() {
  var panel = document.getElementById('panel-gewinn');
  if (!panel) return;

  // ── Datenbasis ──
  var kassa      = bizGetKassa();
  var fixkosten  = bizGetFixkosten();
  var personal   = bizGetPersonal();
  var pizzaCalc  = bizGetPizzaCalc();
  var today      = bizToday();

  // Fixkosten pro Tag
  var fixSum = (fixkosten.miete||0) + (fixkosten.strom||0) +
               (fixkosten.versicherung||0) + (fixkosten.buchhaltung||0) +
               (fixkosten.sonstige||0);
  var fixPerDay = fixSum / 30;

  // Personalkosten pro Tag (Monatsgehalt / 26 Arbeitstage)
  var personalMonth = personal.reduce(function(s,p){ return s + (p.stunden||0)*(p.lohn||0); }, 0);
  var personalPerDay = personalMonth / 26;

  // Einkauf pro Tag (Monat / Tag des Monats)
  var einkaufMonth = bizGetEinkaufThisMonth();
  var dayOfMonth = new Date().getDate();
  var einkaufPerDay = dayOfMonth > 0 ? einkaufMonth / dayOfMonth : 0;

  // Gesamtkosten pro Tag
  var kostenPerDay = fixPerDay + personalPerDay + einkaufPerDay;

  // Tages-Kassabuch-Eintrag
  var todayEntry = kassa.find(function(e){ return e.date === today; }) || { gesamt: 0, bar: 0, karte: 0 };
  var todayRev = todayEntry.gesamt || 0;
  var todayGewinn = todayRev - kostenPerDay;

  // Vergleiche
  var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  var yesterdayStr = yesterday.toISOString().slice(0,10);
  var yEntry = kassa.find(function(e){ return e.date === yesterdayStr; });
  var yGewinn = yEntry ? (yEntry.gesamt - kostenPerDay) : null;

  var lastWeekDate = new Date(); lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  var lastWeekStr = lastWeekDate.toISOString().slice(0,10);
  var lwEntry = kassa.find(function(e){ return e.date === lastWeekStr; });
  var lwGewinn = lwEntry ? (lwEntry.gesamt - kostenPerDay) : null;

  // Monatsdurchschnitt
  var { y, m } = bizCurrentMonth();
  var monthEntries = kassa.filter(function(e){
    return e.date && e.date.startsWith(y + '-' + String(m).padStart(2,'0'));
  });
  var avgRev = monthEntries.length > 0
    ? monthEntries.reduce(function(s,e){ return s + (e.gesamt||0); }, 0) / monthEntries.length
    : 0;
  var avgGewinn = avgRev - kostenPerDay;

  // ── 7-Tage Daten ──
  var last7 = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = d.toISOString().slice(0,10);
    var e = kassa.find(function(x){ return x.date === ds; });
    var dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    last7.push({
      label: i === 0 ? 'Heute' : dayNames[d.getDay()],
      rev:   e ? (e.gesamt||0) : 0,
      cost:  kostenPerDay,
      profit: e ? ((e.gesamt||0) - kostenPerDay) : null
    });
  }
  var maxVal = last7.reduce(function(mx, d){ return Math.max(mx, d.rev, d.cost); }, 1);

  // ── Break-Even ──
  var breakEvenPct = kostenPerDay > 0 ? Math.min(100, Math.round(todayRev / kostenPerDay * 100)) : 0;
  var breakEvenLeft = Math.max(0, kostenPerDay - todayRev);

  // ── Top 5 Margen-Killer ──
  var killers = pizzaCalc.slice()
    .filter(function(p){ return p.preis > 0; })
    .map(function(p){
      var marge = ((p.preis - p.kosten) / p.preis * 100);
      return { name: p.name, preis: p.preis, kosten: p.kosten, marge: marge };
    })
    .sort(function(a,b){ return a.marge - b.marge; })
    .slice(0, 5);

  // ── Helper ──
  function eur(n) { return '€\u00A0' + (+n||0).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function cmpBadge(val, ref) {
    if (ref === null) return '';
    var diff = val - ref;
    var cls  = diff >= 0 ? 'gewinn-compare-up' : 'gewinn-compare-down';
    var arrow = diff >= 0 ? '▲' : '▼';
    return '<span class="gewinn-compare-badge ' + cls + '">' + arrow + ' ' + eur(Math.abs(diff)) + '</span>';
  }
  function ampel(marge) {
    if (marge >= 65) return '<span style="color:#4caf50;font-size:18px">🟢</span>';
    if (marge >= 45) return '<span style="color:#ff9800;font-size:18px">🟡</span>';
    return '<span style="color:#ef5350;font-size:18px">🔴</span>';
  }

  // ── HTML aufbauen ──
  var isNeg = todayGewinn < 0;
  var html = _pageHdr('trending_up', 'Gewinn-Dashboard', 'Tägliche P&L — Pizzeria San Carino',
    '<button onclick="renderGewinnTab()" style="padding:7px 14px;border-radius:8px;border:1.5px solid #e3beb8;background:#fff;font-size:12px;font-weight:700;color:#610000;cursor:pointer;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">refresh</span>Aktualisieren</button>');

  // Hero: Tagesgewinn
  html += '<div class="gewinn-hero' + (isNeg ? ' negative' : '') + '">';
  html += '<div style="font-size:13px;font-weight:600;opacity:.75;margin-bottom:6px;letter-spacing:.5px">TAGESGEWINN ' + today.split('-').reverse().join('.') + '</div>';
  html += '<div class="gewinn-big-num">' + (isNeg ? '' : '+') + eur(todayGewinn) + '</div>';
  html += '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">';
  html += '<span style="font-size:12px;opacity:.7">vs. gestern: </span>' + cmpBadge(todayGewinn, yGewinn);
  html += '<span style="font-size:12px;opacity:.7;margin-left:8px">vs. Vorwoche: </span>' + cmpBadge(todayGewinn, lwGewinn);
  html += '<span style="font-size:12px;opacity:.7;margin-left:8px">Ø Monat: </span><span class="gewinn-compare-badge" style="background:rgba(255,255,255,.15);color:#fff">' + eur(avgGewinn) + '</span>';
  html += '</div></div>';

  // Grid: 3 Kacheln
  html += '<div class="gewinn-grid">';

  // Einnahmen heute
  html += '<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866">';
  html += '<div style="font-size:11px;font-weight:700;color:#8d6562;letter-spacing:.5px;margin-bottom:8px">EINNAHMEN HEUTE</div>';
  html += '<div style="font-size:28px;font-weight:800;color:#1b5e20">' + eur(todayRev) + '</div>';
  html += '<div style="margin-top:10px;display:flex;gap:12px">';
  html += '<div style="font-size:12px;color:#5a403c">💵 Bar: <strong>' + eur(todayEntry.bar||0) + '</strong></div>';
  html += '<div style="font-size:12px;color:#5a403c">💳 Karte: <strong>' + eur(todayEntry.karte||0) + '</strong></div>';
  html += '</div></div>';

  // Kosten heute
  html += '<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866">';
  html += '<div style="font-size:11px;font-weight:700;color:#8d6562;letter-spacing:.5px;margin-bottom:8px">KOSTEN HEUTE (ANTEILIG)</div>';
  html += '<div style="font-size:28px;font-weight:800;color:#c62828">' + eur(kostenPerDay) + '</div>';
  html += '<div style="margin-top:10px;display:flex;flex-direction:column;gap:4px">';
  html += '<div style="font-size:11px;color:#5a403c;display:flex;justify-content:space-between"><span>Fixkosten/Tag</span><strong>' + eur(fixPerDay) + '</strong></div>';
  html += '<div style="font-size:11px;color:#5a403c;display:flex;justify-content:space-between"><span>Personal/Tag</span><strong>' + eur(personalPerDay) + '</strong></div>';
  html += '<div style="font-size:11px;color:#5a403c;display:flex;justify-content:space-between"><span>Einkauf/Tag (Ø)</span><strong>' + eur(einkaufPerDay) + '</strong></div>';
  html += '</div></div>';

  // Break-Even
  html += '<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866">';
  html += '<div style="font-size:11px;font-weight:700;color:#8d6562;letter-spacing:.5px;margin-bottom:8px">BREAK-EVEN STATUS</div>';
  if (breakEvenLeft > 0) {
    html += '<div style="font-size:14px;font-weight:700;color:#e65100;margin-bottom:12px">Noch <strong>' + eur(breakEvenLeft) + '</strong> bis Kostendeckung</div>';
  } else {
    html += '<div style="font-size:14px;font-weight:700;color:#1b5e20;margin-bottom:12px">✅ Kosten gedeckt — Gewinnzone!</div>';
  }
  html += '<div class="gewinn-breakeven-bar"><div class="gewinn-breakeven-fill" style="width:' + breakEvenPct + '%;background:' + (breakEvenPct >= 100 ? 'linear-gradient(90deg,#4caf50,#2e7d32)' : breakEvenPct >= 60 ? 'linear-gradient(90deg,#ff9800,#f57c00)' : 'linear-gradient(90deg,#ef5350,#c62828)') + '"></div></div>';
  html += '<div style="text-align:right;font-size:11px;font-weight:700;color:#5a403c;margin-top:5px">' + breakEvenPct + '%</div>';
  html += '</div>';

  html += '</div>'; // end grid

  // Wochen-Trend
  html += '<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866;margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:16px">📊 7-Tage Trend — Einnahmen vs. Kosten</div>';
  html += '<div class="gewinn-bar-chart">';
  last7.forEach(function(d) {
    var hRev  = d.rev  > 0 ? Math.max(8,  Math.round(d.rev  / maxVal * 140)) : 4;
    var hCost = Math.max(8, Math.round(d.cost / maxVal * 140));
    html += '<div class="gewinn-bar-group">';
    html += '<div style="display:flex;align-items:flex-end;gap:2px;height:140px">';
    html += '<div class="gewinn-bar gewinn-bar-green" style="height:' + hRev  + 'px;flex:1" title="Einnahmen: ' + eur(d.rev) + '"></div>';
    html += '<div class="gewinn-bar gewinn-bar-red"   style="height:' + hCost + 'px;flex:1" title="Kosten: '    + eur(d.cost) + '"></div>';
    html += '</div>';
    html += '<div class="gewinn-bar-label" style="margin-top:4px;text-align:center">' + d.label + '</div>';
    if (d.profit !== null) {
      var pColor = d.profit >= 0 ? '#1b5e20' : '#c62828';
      html += '<div style="font-size:9px;font-weight:700;color:' + pColor + ';text-align:center">' + (d.profit >= 0 ? '+' : '') + Math.round(d.profit) + '€</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:16px;margin-top:10px">';
  html += '<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#5a403c"><div style="width:12px;height:12px;border-radius:3px;background:#4caf50"></div>Einnahmen</div>';
  html += '<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#5a403c"><div style="width:12px;height:12px;border-radius:3px;background:#ef5350"></div>Kosten (anteilig)</div>';
  html += '</div></div>';

  // Top 5 Margen-Killer
  html += '<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866">';
  html += '<div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:4px">🔪 Top 5 Margen-Killer</div>';
  html += '<div style="font-size:11px;color:#8d6562;margin-bottom:14px">Gerichte mit der schlechtesten Marge — prüfe Preis oder Rezept</div>';

  if (killers.length === 0) {
    html += '<div style="color:#8d6562;font-size:13px;text-align:center;padding:20px">Keine Kalkulations-Daten — bitte erst im Business-Tab Pizza-Kalkulator befüllen.</div>';
  } else {
    killers.forEach(function(k, i) {
      var margeRounded = Math.round(k.marge);
      var suggestion = k.marge < 45
        ? 'Preis um <strong>' + eur(k.kosten / 0.55 - k.preis) + '</strong> erhöhen für 45% Marge'
        : 'Beobachten';
      html += '<div class="gewinn-killer-row">';
      html += '<div style="width:22px;height:22px;border-radius:50%;background:#f8dcd8;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#8B0000;flex-shrink:0">' + (i+1) + '</div>';
      html += ampel(k.marge);
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:13px;font-weight:700;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(k.name) + '</div>';
      html += '<div style="font-size:11px;color:#8d6562">' + suggestion + '</div>';
      html += '</div>';
      html += '<div style="text-align:right;flex-shrink:0">';
      html += '<div style="font-size:14px;font-weight:800;color:' + (k.marge >= 65 ? '#1b5e20' : k.marge >= 45 ? '#e65100' : '#c62828') + '">' + margeRounded + '%</div>';
      html += '<div style="font-size:10px;color:#8d6562">VK: ' + eur(k.preis) + '</div>';
      html += '</div></div>';
    });
  }
  html += '</div>';

  panel.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// BUCHHALTUNG — IndexedDB + Tab
// ═══════════════════════════════════════════════════════════════

// ── IndexedDB Helper ──
// PDF-Speicher: Server-Filesystem (nicht mehr IndexedDB)
function _savePdfToDB(id, file, typ, monat) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      fetch('/api/pdf/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, name: file.name, data: e.target.result, typ: typ || 'sonstige', monat: monat || '' })
      }).then(function(r) { return r.json(); })
        .then(function(d) { d.ok ? resolve(d) : reject(new Error(d.error)); })
        .catch(reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function _getPdfFromDB(id) {
  return fetch('/api/pdf/' + id)
    .then(function(r) { return r.ok ? r.blob() : null; });
}
function _deletePdfFromDB(id) {
  return fetch('/api/pdf/' + id, { method: 'DELETE' })
    .then(function(r) { return r.json(); });
}
function _pdfViewUrl(id) { return '/api/pdf/' + id + '/view'; }
function _pdfDownloadUrl(id) { return '/api/pdf/' + id; }

// ── Daten-Helper ──
var BUCH_TYPEN = [
  { id: 'lohnzettel',       label: '👔 Lohnzettel',          icon: 'badge' },
  { id: 'zahlungsjournal',  label: '📋 Zahlungsjournal',     icon: 'payments' },
  { id: 'ogk',              label: '🏥 ÖGK Bescheid',        icon: 'health_and_safety' },
  { id: 'finanzamt',        label: '🏛️ Finanzamt',           icon: 'account_balance' },
  { id: 'lohnsteuer',       label: '📊 Lohnsteuer (L16)',    icon: 'account_balance' },
  { id: 'uva',              label: '🧾 UVA',                 icon: 'receipt_long' },
  { id: 'jahresabschluss',  label: '📅 Jahresabschluss',     icon: 'summarize' },
  { id: 'miete',            label: '🏠 Miete/Pacht',         icon: 'home' },
  { id: 'versicherung',     label: '🛡️ Versicherung',        icon: 'shield' },
  { id: 'rechnung',         label: '🧾 Lieferanten-Rechnung',icon: 'receipt' },
  { id: 'sva',              label: '💼 SVA',                  icon: 'work' },
  { id: 'sonstige',         label: '📄 Sonstige',             icon: 'description' }
];
var BUCH_STATUS = [
  { id: 'offen',    label: 'Offen',    color: '#e65100', bg: '#fff3e0' },
  { id: 'geprueft', label: 'Geprüft',  color: '#1565c0', bg: '#e3f2fd' },
  { id: 'gesendet', label: 'Gesendet', color: '#1b5e20', bg: '#e8f5e9' }
];

function buchLoad() {
  try { return JSON.parse(localStorage.getItem('buch_docs') || '[]'); } catch(_) { return []; }
}
function buchSave(docs) {
  localStorage.setItem('buch_docs', JSON.stringify(docs));
}

function buchAddDoc(file, typ, monat) {
  var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  var doc = {
    id: id, name: file.name, typ: typ, monat: monat,
    status: 'offen', uploadDate: new Date().toISOString().slice(0, 10),
    size: file.size
  };
  var btn = document.querySelector('[onclick="buchUploadHandler()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Wird hochgeladen...'; }
  _savePdfToDB(id, file, typ, monat).then(function() {
    var docs = buchLoad();
    docs.unshift(doc);
    buchSave(docs);
    _showToast(file.name + ' hochgeladen ✓', 'success');
    renderBuchhaltungTab();
  }).catch(function(e) {
    _showToast('Upload-Fehler: ' + e.message, 'error');
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">upload</span>Hochladen'; }
  });
}

function buchDeleteDoc(id) {
  _showConfirm('Dokument wirklich löschen?', function() {
    buchSave(buchLoad().filter(function(d) { return d.id !== id; }));
    _deletePdfFromDB(id).then(function() {
      _showToast('Gelöscht', 'info');
      renderBuchhaltungTab();
    });
  });
}

function buchSetStatus(id, status) {
  var docs = buchLoad();
  var doc = docs.find(function(d) { return d.id === d; });
  if (doc) { doc.status = status; buchSave(docs); }
  fetch('/api/pdf/' + id + '/status', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status}) });
  renderBuchhaltungTab();
}

async function buchSetMetadaten(id, monat, typ) {
  const body = {};
  if (monat) body.monat = monat;
  if (typ) body.typ = typ;
  const r = await fetch('/api/pdf/' + id + '/metadaten', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if (r.ok) { _showToast('Gespeichert', 'success'); renderBuchhaltungTab(); }
  else _showToast('Fehler beim Speichern', 'error');
}

async function buchKorrigiereMonate() {
  _showToast('Monate werden korrigiert…', 'info');
  const r = await fetch('/api/pdf/korrigiere-monate', { method: 'POST' });
  const d = await r.json();
  if (d.ok) { _showToast('✓ ' + d.korrigiert + ' von ' + d.gesamt + ' Dokumente korrigiert', 'success'); renderBuchhaltungTab(); }
  else _showToast('Fehler', 'error');
}

async function buchLieferantAnalyse(key, label) {
  const el = document.getElementById('buch-lieferant-ergebnis');
  if (!el) return;
  el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px"><span class="material-symbols-outlined" style="font-size:28px;display:block;margin-bottom:8px;animation:spin 1s linear infinite">progress_activity</span>Lade PDFs und extrahiere Beträge…</div>';

  const r = await fetch('/api/pdf/lieferant-analyse', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ lieferant: key })
  });
  const d = await r.json();
  if (!d.ok) { el.innerHTML = '<div style="color:#c62828;padding:12px">Fehler: ' + (d.error||'?') + '</div>'; return; }

  var MONAT_NAMEN = ['','Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  function formatDatum(monat) {
    if (!monat || monat === '—') return '—';
    var p = monat.split('-');
    if (p.length === 2) {
      var mn = parseInt(p[1]);
      return (MONAT_NAMEN[mn] || p[1]) + ' ' + p[0];
    }
    return monat;
  }

  var KATEGORIE_STYLE = {
    rechnung:      { label: 'Rechnung',      bg: '#e3f2fd', color: '#1565c0' },
    lohnzettel:    { label: 'Lohnzettel',    bg: '#f3e5f5', color: '#6a1b9a' },
    ogk:           { label: 'ÖGK',           bg: '#e8f5e9', color: '#2e7d32' },
    finanzamt:     { label: 'Finanzamt',     bg: '#fff3e0', color: '#e65100' },
    zahlungsjournal:{ label: 'Zahlungsjournal', bg: '#fce4ec', color: '#880e4f' },
    sonstige:      { label: 'Sonstige',      bg: '#f5f5f5', color: '#616161' },
  };
  function kategorieBadge(typ) {
    var k = KATEGORIE_STYLE[typ] || KATEGORIE_STYLE.sonstige;
    return '<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:' + k.bg + ';color:' + k.color + '">' + k.label + '</span>';
  }

  // Gruppiere nach Kategorie
  var gruppen = {};
  d.dokumente.forEach(function(doc) {
    var typ = doc.typ || 'sonstige';
    if (!gruppen[typ]) gruppen[typ] = [];
    gruppen[typ].push(doc);
  });

  var gesamt = d.gesamt || 0;
  var html2 = '<div style="background:var(--surface);border-radius:16px;border:1px solid var(--border);overflow:hidden;margin-bottom:8px">';

  // Header
  html2 += '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
  html2 += '<div>';
  html2 += '<div style="font-size:15px;font-weight:800;color:var(--text)">🏪 ' + label + '</div>';
  html2 += '<div style="font-size:11px;color:var(--text-3);margin-top:3px">' + d.dokumente.length + ' Dokumente · neueste zuerst</div>';
  html2 += '</div>';
  html2 += '<div style="text-align:right">';
  html2 += '<div style="font-size:20px;font-weight:800;color:#c62828">€ ' + gesamt.toFixed(2).replace('.',',') + '</div>';
  html2 += '<div style="font-size:10px;color:var(--text-3)">Gesamtbetrag</div>';
  html2 += '</div>';
  html2 += '</div>';

  if (d.dokumente.length === 0) {
    html2 += '<div style="padding:28px;text-align:center;color:var(--text-3);font-size:13px">Keine Dokumente gefunden</div>';
  } else {
    // Tabelle nach Kategorie gruppiert
    var reihenfolge = ['rechnung','lohnzettel','ogk','finanzamt','zahlungsjournal','sonstige'];
    reihenfolge.forEach(function(typ) {
      if (!gruppen[typ] || gruppen[typ].length === 0) return;
      var k = KATEGORIE_STYLE[typ] || KATEGORIE_STYLE.sonstige;
      var gruppenSumme = gruppen[typ].reduce(function(s,e){ return s + (e.betrag||0); }, 0);

      // Gruppen-Header
      html2 += '<div style="padding:8px 20px;background:' + k.bg + ';border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">';
      html2 += '<span style="font-size:12px;font-weight:800;color:' + k.color + '">' + k.label + ' (' + gruppen[typ].length + ')</span>';
      if (gruppenSumme > 0) html2 += '<span style="font-size:12px;font-weight:700;color:' + k.color + '">€ ' + gruppenSumme.toFixed(2).replace('.',',') + '</span>';
      html2 += '</div>';

      // Tabellenzeilen
      html2 += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
      html2 += '<thead><tr style="background:var(--bg)">';
      ['Datum','Dateiname','Betrag',''].forEach(function(h){ html2+='<th style="padding:7px 14px;text-align:left;font-size:10px;font-weight:700;color:var(--text-3);white-space:nowrap">'+h+'</th>'; });
      html2 += '</tr></thead><tbody>';

      gruppen[typ].forEach(function(doc, i) {
        var datum = doc.datum || formatDatum(doc.monat);
        var betrag = doc.betrag ? '<span style="color:#2e7d32;font-weight:700">€ '+doc.betrag.toFixed(2).replace('.',',')+'</span>' : '<span style="color:var(--text-3)">—</span>';
        html2 += '<tr style="border-bottom:1px solid var(--border);background:'+(i%2===0?'var(--surface)':'var(--bg)')+'">';
        html2 += '<td style="padding:8px 14px;font-size:13px;font-weight:600;color:var(--text);white-space:nowrap">' + datum + '</td>';
        html2 += '<td style="padding:8px 14px;font-size:12px;color:var(--text-2);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+_esc(doc.name)+'">' + _esc(doc.name) + '</td>';
        html2 += '<td style="padding:8px 14px;font-size:13px;white-space:nowrap">'+betrag+'</td>';
        html2 += '<td style="padding:8px 14px"><a href="/api/pdf/'+doc.id+'/view" target="_blank" style="font-size:11px;color:#1565c0;text-decoration:none;font-weight:700;white-space:nowrap">📄 Öffnen</a></td>';
        html2 += '</tr>';
      });
      html2 += '</tbody></table></div>';
    });

    // Gesamt-Footer
    html2 += '<div style="padding:12px 20px;background:var(--bg);border-top:2px solid var(--border);display:flex;align-items:center;justify-content:space-between">';
    html2 += '<span style="font-size:13px;font-weight:800;color:var(--text)">GESAMT (' + d.dokumente.length + ' Dokumente)</span>';
    html2 += '<span style="font-size:16px;font-weight:800;color:#c62828">€ ' + gesamt.toFixed(2).replace('.',',') + '</span>';
    html2 += '</div>';
  }
  html2 += '</div>';
  el.innerHTML = html2;
}

async function buchEmailBackfill() {
  const von = document.getElementById('bf-von')?.value;
  const bis = document.getElementById('bf-bis')?.value;
  const stichwort = document.getElementById('bf-stichwort')?.value || '';
  if (!von || !bis) return _showToast('Bitte Von- und Bis-Datum eingeben', 'error');
  _showToast('📥 E-Mail Import gestartet — ' + (stichwort ? '"' + stichwort + '"' : 'alle PDFs') + ' von ' + von + ' bis ' + bis, 'info');
  const r = await fetch('/api/email-sync/backfill', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ von, bis, stichwort })
  });
  const d = await r.json();
  if (d.ok) {
    _showToast('✓ Import läuft im Hintergrund. In 2 Min. Seite neu laden.', 'success');
    setTimeout(function() { renderBuchhaltungTab(); }, 120000);
  } else _showToast('Fehler: ' + (d.error || 'Unbekannt'), 'error');
}

async function buchSmartScan() {
  _showToast('📋 Smart Scan gestartet — lese PDF-Texte…', 'info');
  const r = await fetch('/api/pdf/smart-scan', { method: 'POST' });
  const d = await r.json();
  if (d.ok) {
    _showToast('✓ ' + d.gesamt + ' PDFs werden gescannt — Seite in 10s neu laden', 'info');
    setTimeout(function() { renderBuchhaltungTab(); }, 10000);
  } else _showToast('Fehler beim Smart Scan', 'error');
}

function buchToggleEdit(id) {
  var row = document.getElementById('buch-edit-' + id);
  if (row) row.style.display = row.style.display === 'none' ? 'flex' : 'none';
}

function buchDownload(id, name) {
  var a = document.createElement('a');
  a.href = _pdfDownloadUrl(id);
  a.download = name;
  a.click();
}

function buchView(id) {
  window.open(_pdfViewUrl(id), '_blank');
}

async function buchPdfZuJson(id, name) {
  _showToast('PDF wird konvertiert…', 'info');
  try {
    const r = await fetch('/api/pdf/' + id + '/zu-json', { method: 'POST' });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    _showToast('✓ JSON gespeichert: ' + name, 'success');
    // JSON-Viewer öffnen
    _buchZeigeJsonViewer(id, name, d.data);
  } catch(e) { _showToast('Fehler: ' + e.message, 'error'); }
}

function _buchZeigeJsonViewer(id, name, data) {
  const existing = document.getElementById('buch-json-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'buch-json-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  const jsonStr = JSON.stringify(data, null, 2);
  modal.innerHTML = `
    <div style="background:#1e1e2e;border-radius:18px;width:100%;max-width:760px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.5)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #333;flex-shrink:0">
        <div style="font-size:14px;font-weight:700;color:#cdd6f4;display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined" style="font-size:18px;color:#cba6f7">data_object</span>${name} — JSON
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="_buchSpeichereJson('${id}')" style="padding:7px 14px;background:#89b4fa;color:#1e1e2e;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px">
            <span class="material-symbols-outlined" style="font-size:14px">save</span>Speichern
          </button>
          <button onclick="document.getElementById('buch-json-modal').remove()" style="padding:7px;background:#313244;border:none;border-radius:8px;cursor:pointer;line-height:0">
            <span class="material-symbols-outlined" style="font-size:18px;color:#cdd6f4">close</span>
          </button>
        </div>
      </div>
      <textarea id="buch-json-editor" style="flex:1;background:#181825;color:#cdd6f4;border:none;padding:16px;font-family:monospace;font-size:13px;resize:none;outline:none;overflow-y:auto;min-height:400px">${jsonStr.replace(/</g,'&lt;')}</textarea>
      <div style="padding:10px 16px;background:#181825;border-top:1px solid #333;font-size:11px;color:#6c7086;flex-shrink:0">
        Dok-ID: ${id} · Bearbeitbar · Strg+S zum Speichern
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  const ta = modal.querySelector('#buch-json-editor');
  ta.addEventListener('keydown', e => { if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); _buchSpeichereJson(id); } });
}

async function _buchSpeichereJson(id) {
  const ta = document.getElementById('buch-json-editor');
  if (!ta) return;
  try {
    const parsed = JSON.parse(ta.value);
    const r = await fetch('/api/pdf/' + id + '/json', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(parsed) });
    const d = await r.json();
    if (d.ok) _showToast('JSON gespeichert ✓', 'success');
    else _showToast('Fehler beim Speichern', 'error');
  } catch(e) { _showToast('Ungültiges JSON: ' + e.message, 'error'); }
}

async function buchSyncLohnzettel() {
  _showToast('Lohndaten werden übernommen…', 'info');
  try {
    const r = await fetch('/api/mitarbeiter/sync-lohnzettel', { method: 'POST' });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    _showToast('✓ ' + d.aktualisiert + ' aktualisiert, ' + d.hinzugefuegt + ' neu hinzugefügt', 'success');
    // Mitarbeiter-Liste in localStorage aktualisieren
    const maR = await fetch('/api/mitarbeiter');
    if (maR.ok) { const ma = await maR.json(); localStorage.setItem('pizzeria_mitarbeiter', JSON.stringify(ma)); }
  } catch(e) { _showToast('Fehler: ' + e.message, 'error'); }
}

function buchUploadHandler() {
  var input = document.getElementById('buch-file-input');
  var typ = document.getElementById('buch-typ-select').value;
  var monat = document.getElementById('buch-monat-input').value;
  if (!input.files.length) { _showToast('Bitte Datei wählen', 'error'); return; }
  if (!typ) { _showToast('Bitte Typ auswählen', 'error'); return; }
  if (!monat) { _showToast('Bitte Monat angeben', 'error'); return; }
  buchAddDoc(input.files[0], typ, monat);
  input.value = '';
}

function buchDropHandler(e) {
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') { _showToast('Nur PDF-Dateien', 'error'); return; }
  document.getElementById('buch-file-input').files = e.dataTransfer.files;
  document.getElementById('buch-drop-zone').style.borderColor = '#e3beb8';
  document.getElementById('buch-drop-zone').style.background = '#fff8f6';
  _showToast(file.name + ' ausgewählt', 'info');
}

// ── Monatsabschluss PDF ──
function monatsabschlussPdf() {
  if (!window.jspdf?.jsPDF) { _showToast('jsPDF nicht geladen', 'error'); return; }
  var monat = document.getElementById('kb-abschluss-monat')?.value || new Date().toISOString().slice(0,7);
  var list = []; try { list = kbGet(); } catch(_) {}
  var filtered = list.filter(function(e){ return (e.datum||'').slice(0,7) === monat; });
  if (!filtered.length) { _showToast('Keine Buchungen für ' + monat, 'warning'); return; }

  var einnahmen = filtered.filter(function(e){return e.typ==='einnahme';});
  var ausgaben  = filtered.filter(function(e){return e.typ==='ausgabe';});
  var sumEin = einnahmen.reduce(function(s,e){return s+parseFloat(e.brutto||0);},0);
  var sumAus = ausgaben.reduce(function(s,e){return s+parseFloat(e.brutto||0);},0);
  var saldo = sumEin - sumAus;
  var mwst10Ein = einnahmen.filter(function(e){return e.mwst_satz==10;}).reduce(function(s,e){return s+parseFloat(e.mwst_betrag||0);},0);
  var mwst20Ein = einnahmen.filter(function(e){return e.mwst_satz==20;}).reduce(function(s,e){return s+parseFloat(e.mwst_betrag||0);},0);
  var mwst10Aus = ausgaben.filter(function(e){return e.mwst_satz==10;}).reduce(function(s,e){return s+parseFloat(e.mwst_betrag||0);},0);
  var mwst20Aus = ausgaben.filter(function(e){return e.mwst_satz==20;}).reduce(function(s,e){return s+parseFloat(e.mwst_betrag||0);},0);

  var monatParts = monat.split('-');
  var monatLabel = ['','Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][parseInt(monatParts[1])] + ' ' + monatParts[0];
  var fmt = function(n){return parseFloat(n||0).toFixed(2).replace('.',',') + ' €';};

  var doc = new window.jspdf.jsPDF({orientation:'portrait', unit:'mm', format:'a4'});

  // ── Seite 1: Deckblatt ──
  doc.setFillColor(139,0,0); doc.rect(0,0,210,297,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(28); doc.setFont(undefined,'bold');
  doc.text('Pizzeria San Carino', 105, 100, {align:'center'});
  doc.setFontSize(22);
  doc.text('Monatsabschluss', 105, 118, {align:'center'});
  doc.setFontSize(20);
  doc.text(monatLabel, 105, 135, {align:'center'});
  doc.setFontSize(11); doc.setFont(undefined,'normal');
  doc.text('Erstellt am: ' + new Date().toLocaleDateString('de-AT'), 105, 152, {align:'center'});
  doc.setFontSize(10); doc.setTextColor(255,220,220);
  doc.text('Ali Shama KG — Wien', 105, 165, {align:'center'});

  // ── Seite 2: Übersicht ──
  doc.addPage();
  doc.setTextColor(38,24,22); doc.setFillColor(255,248,246);
  doc.setFontSize(16); doc.setFont(undefined,'bold'); doc.setTextColor(139,0,0);
  doc.text('Übersicht — ' + monatLabel, 14, 20);
  doc.setDrawColor(225,190,184); doc.line(14,24,196,24);

  var boxes = [
    {label:'Einnahmen gesamt', val:fmt(sumEin), clr:[46,125,50]},
    {label:'Ausgaben gesamt',  val:fmt(sumAus), clr:[198,40,40]},
    {label:'Saldo (Gewinn/Verlust)', val:fmt(saldo), clr: saldo>=0?[46,125,50]:[198,40,40]},
    {label:'MwSt 10% Einnahmen', val:fmt(mwst10Ein), clr:[13,71,161]},
    {label:'MwSt 20% Einnahmen', val:fmt(mwst20Ein), clr:[13,71,161]},
    {label:'MwSt 10% Ausgaben',  val:fmt(mwst10Aus), clr:[106,27,154]},
  ];
  var bx = 14, by = 32, bw = 86, bh = 24, gap = 8;
  boxes.forEach(function(b, i) {
    var col = i%2, row = Math.floor(i/2);
    var x = bx + col*(bw+gap), y = by + row*(bh+gap);
    doc.setFillColor(248,244,244); doc.roundedRect(x, y, bw, bh, 3, 3, 'F');
    doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(90,64,60);
    doc.text(b.label, x+4, y+8);
    doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(b.clr[0],b.clr[1],b.clr[2]);
    doc.text(b.val, x+4, y+19);
  });

  // ── Seite 3: Einnahmen-Tabelle ──
  doc.addPage();
  doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(139,0,0);
  doc.text('Einnahmen — ' + monatLabel, 14, 18);
  doc.setDrawColor(225,190,184); doc.line(14,22,196,22);
  if (doc.autoTable) {
    doc.autoTable({
      head: [['Datum','Beschreibung','Netto','MwSt%','MwSt €','Brutto']],
      body: einnahmen.map(function(e){ return [(e.datum||'').slice(0,10), String(e.beschreibung||'').slice(0,35), fmt(e.netto), (e.mwst_satz||0)+'%', fmt(e.mwst_betrag), fmt(e.brutto)]; }),
      foot: [['','SUMME','','','',fmt(sumEin)]],
      startY: 26, styles:{fontSize:8,cellPadding:3},
      headStyles:{fillColor:[139,0,0],textColor:255,fontStyle:'bold'},
      footStyles:{fillColor:[240,228,226],fontStyle:'bold',textColor:[38,24,22]},
      columnStyles:{0:{cellWidth:24},1:{cellWidth:70},2:{cellWidth:22},3:{cellWidth:14},4:{cellWidth:22},5:{cellWidth:26}}
    });
  }

  // ── Seite 4: Ausgaben-Tabelle ──
  doc.addPage();
  doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(139,0,0);
  doc.text('Ausgaben — ' + monatLabel, 14, 18);
  doc.setDrawColor(225,190,184); doc.line(14,22,196,22);
  if (doc.autoTable) {
    doc.autoTable({
      head: [['Datum','Beschreibung','Netto','MwSt%','MwSt €','Brutto']],
      body: ausgaben.length ? ausgaben.map(function(e){ return [(e.datum||'').slice(0,10), String(e.beschreibung||'').slice(0,35), fmt(e.netto), (e.mwst_satz||0)+'%', fmt(e.mwst_betrag), fmt(e.brutto)]; }) : [['—','Keine Ausgaben','','','','']],
      foot: [['','SUMME','','','',fmt(sumAus)]],
      startY: 26, styles:{fontSize:8,cellPadding:3},
      headStyles:{fillColor:[139,0,0],textColor:255,fontStyle:'bold'},
      footStyles:{fillColor:[240,228,226],fontStyle:'bold',textColor:[38,24,22]},
      columnStyles:{0:{cellWidth:24},1:{cellWidth:70},2:{cellWidth:22},3:{cellWidth:14},4:{cellWidth:22},5:{cellWidth:26}}
    });
  }

  // ── Seite 5: Steuerberater-Hinweis + Unterschrift ──
  doc.addPage();
  doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(139,0,0);
  doc.text('Steuerberater-Hinweis', 14, 20);
  doc.setDrawColor(225,190,184); doc.line(14,24,196,24);
  doc.setFontSize(10); doc.setFont(undefined,'normal'); doc.setTextColor(38,24,22);
  var hinweise = [
    'Alle Beträge in EUR (€), Österreich.',
    'MwSt 10% gilt für Speisen und Getränke (alkoholfrei) gemäß § 10 UStG AT.',
    'MwSt 20% gilt für alkoholische Getränke und sonstige Leistungen gemäß § 22 UStG AT.',
    'Dieses Dokument wurde automatisch aus dem Kassenbuch der Pizzeria San Carino erstellt.',
    'Bitte mit den Originalbelegen (Rechnungen, Kassenbons) abgleichen.',
  ];
  var hy = 34;
  hinweise.forEach(function(h){ doc.text('• ' + h, 16, hy); hy += 8; });

  doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.setTextColor(38,24,22);
  doc.text('Unterschriften', 14, hy + 10);
  doc.setDrawColor(150,150,150);
  doc.line(14, hy+30, 90, hy+30); doc.line(110, hy+30, 196, hy+30);
  doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(90,64,60);
  doc.text('Datum / Unterschrift Betrieb', 14, hy+36);
  doc.text('Datum / Unterschrift Steuerberater', 110, hy+36);

  doc.save('monatsabschluss_' + monat + '.pdf');
  _showToast('Monatsabschluss ' + monatLabel + ' gespeichert ✓', 'success');
}

// ── Kassenbuch-Hilfsfunktionen ──
function kbMwstUpdate() {
  var netto = parseFloat(document.getElementById('kb-netto')?.value||0)||0;
  var satz  = parseFloat(document.getElementById('kb-mwst')?.value||0)||0;
  var brutto = netto * (1 + satz/100);
  var el = document.getElementById('kb-brutto');
  if (el) el.value = brutto.toFixed(2).replace('.',',') + ' €';
}
// ── Kassenbuch Server-Cache ──────────────────────────────────────────────────
window._KB = [];
async function kbSync() {
  try {
    const r = await fetch('/api/kassenbuch');
    if (r.ok) {
      window._KB = await r.json();
      // localStorage aktuell halten als Fallback
      try { localStorage.setItem('pizzeria_kassenbuch', JSON.stringify(window._KB)); } catch(_) {}
    }
  } catch(_) {
    // Offline-Fallback: aus localStorage laden
    try { window._KB = kbGet(); } catch(_) {}
  }
}
function kbGet() {
  if (window._KB && window._KB.length > 0) return window._KB;
  try { return JSON.parse(localStorage.getItem('pizzeria_kassenbuch')||'[]'); } catch(_) { return []; }
}
async function kbMigrateIfNeeded() {
  if (localStorage.getItem('psc_kb_migrated')) return;
  const local = [];
  try { const v = localStorage.getItem('pizzeria_kassenbuch'); if (v) local.push(...JSON.parse(v)); } catch(_) {}
  if (!local.length) { localStorage.setItem('psc_kb_migrated','1'); return; }
  try {
    const r = await fetch('/api/kassenbuch/migrate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(local) });
    const j = await r.json();
    if (j.ok) {
      localStorage.setItem('psc_kb_migrated','1');
      console.log('Kassenbuch migriert:', j.count, 'Einträge');
      await kbSync();
    }
  } catch(_) {}
}
async function kassenbuchAdd() {
  var datum = (document.getElementById('kb-datum')?.value || '').trim();
  var typ   = document.getElementById('kb-typ')?.value;
  var desc  = document.getElementById('kb-desc')?.value.trim();
  var netto = parseFloat(document.getElementById('kb-netto')?.value||0)||0;
  var satz  = parseFloat(document.getElementById('kb-mwst')?.value||0)||0;
  // Datum-Validierung: YYYY-MM-DD Format erzwingen
  if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) { _showToast('Datum im Format YYYY-MM-DD eingeben', 'error'); return; }
  if (!desc) { _showToast('Bitte Beschreibung eingeben', 'error'); return; }
  if (netto <= 0) { _showToast('Bitte Netto-Betrag eingeben', 'error'); return; }
  // Betrag-Validierung: max 999.999 €, keine negativen Werte
  if (netto > 999999) { _showToast('Betrag darf max. 999.999 € sein', 'error'); return; }
  var brutto = netto * (1 + satz/100);
  var entry = { id: Date.now().toString(36), datum: datum + 'T12:00:00.000Z', typ, beschreibung: desc, netto: netto.toFixed(2), mwst_satz: satz, mwst_betrag: (brutto-netto).toFixed(2), brutto: brutto.toFixed(2) };
  try {
    await fetch('/api/kassenbuch', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) });
  } catch(_) {}
  await kbSync();
  _showToast((typ==='einnahme'?'Einnahme':'Ausgabe')+' gespeichert ✓', 'success');
  renderBuchhaltungTab();
}
async function zbonImport(input) {
  var files = Array.from(input.files || []);
  if (!files.length) return;
  var result = document.getElementById('zbon-result');
  var totalGesamt = 0, totalEintraege = 0, errors = [], ok = [];

  for (var fi = 0; fi < files.length; fi++) {
    var file = files[fi];
    if (result) result.innerHTML = '<div style="margin-top:12px;color:#a5d6a7;font-size:12px">⏳ ' + (fi+1) + '/' + files.length + ' — ' + _esc(file.name) + '</div>';
    try {
      var b64 = await new Promise(function(res) {
        var r = new FileReader();
        r.onload = function(e) { res(e.target.result); };
        r.readAsDataURL(file);
      });
      var resp = await fetch('/api/kassenbuch/import-zbon', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ data: b64, name: file.name })
      });
      var d = await resp.json();
      if (!d.ok) { errors.push(file.name + ': ' + (d.error||'Fehler')); continue; }
      totalGesamt += d.gesamt || 0;
      totalEintraege += (d.eintraege||[]).length;
      ok.push({ name: file.name, gesamt: d.gesamt });
    } catch(e) { errors.push(file.name + ': ' + e.message); }
  }

  await kbSync();
  var html = '<div style="margin-top:14px;background:#1b4d1b;border-radius:12px;padding:14px 16px">';
  html += '<div style="font-size:12px;font-weight:700;color:#81c784;margin-bottom:10px">✅ ' + ok.length + ' Z-Bons importiert · ' + totalEintraege + ' Kassenbuch-Einträge · Gesamt: €' + totalGesamt.toFixed(2).replace('.',',') + '</div>';
  if (ok.length) {
    html += '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px">';
    ok.forEach(function(o){ html += '<div style="font-size:11px;color:#a5d6a7">✓ ' + _esc(o.name) + ' — €' + (o.gesamt||0).toFixed(2).replace('.',',') + '</div>'; });
    html += '</div>';
  }
  if (errors.length) {
    html += '<div style="margin-top:6px">';
    errors.forEach(function(e){ html += '<div style="font-size:11px;color:#ef9a9a">⚠ ' + _esc(e) + '</div>'; });
    html += '</div>';
  }
  html += '</div>';
  if (result) result.innerHTML = html;
  renderBuchhaltungTab();
  input.value = '';
}

async function lohnPdfsImport() {
  var result = document.getElementById('lohn-import-result');
  if (result) result.innerHTML = '<div style="margin-top:12px;color:#ce93d8;font-size:12px">⏳ Wird importiert…</div>';
  try {
    var resp = await fetch('/api/kassenbuch/import-lohn-pdfs', { method: 'POST' });
    var d = await resp.json();
    if (!d.ok) throw new Error(d.error);
    await kbSync();
    var html = '<div style="margin-top:14px;background:#1a0d2e;border-radius:12px;padding:14px 16px">';
    html += '<div style="font-size:12px;font-weight:700;color:#ce93d8;margin-bottom:6px">✅ ' + d.imported + ' importiert · ' + d.skipped + ' übersprungen · Gesamt: €' + (d.total||0).toFixed(2).replace('.',',') + '</div>';
    (d.eintraege||[]).forEach(function(e){ html += '<div style="font-size:11px;color:#e1bee7">✓ ' + _esc(e.monat||'?') + ' — €' + (e.betrag||0).toFixed(2).replace('.',',') + '</div>'; });
    (d.skippedList||[]).slice(0,3).forEach(function(s){ html += '<div style="font-size:10px;color:#9575cd">↷ ' + _esc(s) + '</div>'; });
    html += '</div>';
    if (result) result.innerHTML = html;
    renderBuchhaltungTab();
  } catch(e) {
    if (result) result.innerHTML = '<div style="margin-top:12px;color:#ef9a9a;font-size:12px">❌ ' + _esc(e.message) + '</div>';
  }
}

async function fixkostenImport() {
  var result = document.getElementById('fixkosten-import-result');
  if (result) result.innerHTML = '<div style="margin-top:12px;color:#ffe082;font-size:12px">⏳ Wird generiert…</div>';
  try {
    var fix = {}; try { fix = JSON.parse(localStorage.getItem('biz_fixkosten')||'{}'); } catch(_) {}
    var monate = [];
    for (var y = 2025; y <= 2026; y++) {
      for (var mo = 1; mo <= 12; mo++) {
        var m = y+'-'+(mo<10?'0':'')+mo;
        if (m >= '2025-07' && m <= new Date().toISOString().slice(0,7)) monate.push(m);
      }
    }
    var resp = await fetch('/api/kassenbuch/import-fixkosten', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ fixkosten: fix, monate: monate })
    });
    var d = await resp.json();
    if (!d.ok) throw new Error(d.error);
    await kbSync();
    var html = '<div style="margin-top:14px;background:#1a1500;border-radius:12px;padding:14px 16px">';
    html += '<div style="font-size:12px;font-weight:700;color:#ffe082">✅ ' + d.imported + ' Einträge generiert · ' + d.skipped + ' bereits vorhanden · Gesamt: €' + (d.total||0).toFixed(2).replace('.',',') + '</div>';
    html += '</div>';
    if (result) result.innerHTML = html;
    renderBuchhaltungTab();
  } catch(e) {
    if (result) result.innerHTML = '<div style="margin-top:12px;color:#ef9a9a;font-size:12px">❌ ' + _esc(e.message) + '</div>';
  }
}

async function rechnungenImport() {
  var result = document.getElementById('rechnung-import-result');
  if (result) result.innerHTML = '<div style="margin-top:12px;color:#90caf9;font-size:12px">⏳ Wird importiert…</div>';
  try {
    var resp = await fetch('/api/kassenbuch/import-rechnungen', { method: 'POST' });
    var d = await resp.json();
    if (!d.ok) throw new Error(d.error);
    await kbSync();
    var html = '<div style="margin-top:14px;background:#0d2a4a;border-radius:12px;padding:14px 16px">';
    html += '<div style="font-size:12px;font-weight:700;color:#64b5f6;margin-bottom:8px">✅ ' + d.imported + ' Einträge importiert, ' + d.skipped + ' übersprungen</div>';
    html += '<div style="font-size:13px;font-weight:800;color:#fff">Gesamt: €' + (d.total||0).toFixed(2).replace('.',',') + '</div>';
    html += '</div>';
    if (result) result.innerHTML = html;
    renderBuchhaltungTab();
  } catch(e) {
    if (result) result.innerHTML = '<div style="margin-top:12px;color:#ef9a9a;font-size:12px">❌ ' + _esc(e.message) + '</div>';
  }
}

function kassenbuchLoeschen(id) {
  _showConfirm('Eintrag wirklich löschen?', async function() {
    try { await fetch('/api/kassenbuch/' + id, { method:'DELETE' }); } catch(_) {}
    await kbSync();
    renderBuchhaltungTab();
  });
}
function kassenbuchCsvExport() {
  var list = []; try { list = kbGet(); } catch(_) {}
  if (!list.length) { _showToast('Keine Einträge', 'info'); return; }
  var rows = ['Datum;Typ;Beschreibung;Netto;MwSt%;MwSt-Betrag;Brutto'];
  list.forEach(function(e) {
    rows.push([(e.datum||'').slice(0,10), e.typ, '"'+String(e.beschreibung||'').replace(/"/g,'""')+'"', parseFloat(e.netto||0).toFixed(2), e.mwst_satz||0, parseFloat(e.mwst_betrag||0).toFixed(2), parseFloat(e.brutto||0).toFixed(2)].join(';'));
  });
  var blob = new Blob(['﻿'+rows.join('\n')], {type:'text/csv;charset=utf-8'});
  var a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='kassenbuch_'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
}
function kassenbuchPdfExport() {
  var list = []; try { list = kbGet(); } catch(_) {}
  if (!list.length) { _showToast('Keine Einträge', 'info'); return; }
  if (!window.jspdf?.jsPDF) { _showToast('jsPDF nicht geladen', 'error'); return; }
  var doc = new window.jspdf.jsPDF();
  doc.setFontSize(16); doc.text('Kassenbuch — Pizzeria San Carino', 14, 18);
  doc.setFontSize(10); doc.text('Exportiert: ' + new Date().toLocaleDateString('de-AT'), 14, 26);
  var rows = list.map(function(e) { return [(e.datum||'').slice(0,10), e.typ==='einnahme'?'Einnahme':'Ausgabe', String(e.beschreibung||'').slice(0,30), parseFloat(e.netto||0).toFixed(2)+' €', (e.mwst_satz||0)+'%', parseFloat(e.brutto||0).toFixed(2)+' €']; });
  if (doc.autoTable) {
    doc.autoTable({ head:[['Datum','Typ','Beschreibung','Netto','MwSt','Brutto']], body:rows, startY:32, styles:{fontSize:8}, headStyles:{fillColor:[97,0,0]} });
  }
  doc.save('kassenbuch_'+new Date().toISOString().slice(0,10)+'.pdf');
}

// ── Render ──
async function renderBuchhaltungTab() {
  var panel = document.getElementById('panel-buchhaltung');
  if (!panel) return;
  await kbSync();

  // ── Kassenbuch-Daten ──
  var kbAll = kbGet();
  var today = new Date().toISOString().slice(0,10);
  var thisMonth = today.slice(0,7);
  var kbToday = kbAll.filter(function(e){return (e.datum||'').slice(0,10)===today;});
  var kbMonth  = kbAll.filter(function(e){return (e.datum||'').slice(0,7)===thisMonth;});
  var einH = kbToday.filter(function(e){return e.typ==='einnahme';}).reduce(function(s,e){return s+parseFloat(e.brutto||0);},0);
  var ausH = kbToday.filter(function(e){return e.typ==='ausgabe'; }).reduce(function(s,e){return s+parseFloat(e.brutto||0);},0);
  var einM = kbMonth.filter(function(e){return e.typ==='einnahme';}).reduce(function(s,e){return s+parseFloat(e.brutto||0);},0);
  var ausM = kbMonth.filter(function(e){return e.typ==='ausgabe'; }).reduce(function(s,e){return s+parseFloat(e.brutto||0);},0);
  var saldoH = einH - ausH;

  var docs = buchLoad();
  var filterTyp = panel.dataset.filterTyp || '';
  var filterStatus = panel.dataset.filterStatus || '';
  var filterMonat = panel.dataset.filterMonat || '';

  var filtered = docs.filter(function(d) {
    if (filterTyp && d.typ !== filterTyp) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterMonat && d.monat !== filterMonat) return false;
    return true;
  });

  var currentMonth = new Date().toISOString().slice(0, 7);

  var html = _pageHdr('account_balance', 'Buchhaltung', 'Kassenbuch & Steuerberater-Dokumente',
    '<button onclick="renderBuchhaltungTab()" style="padding:7px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;font-weight:700;color:var(--red);cursor:pointer;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">refresh</span>Aktualisieren</button>');

  // ── Kassenbuch-Kacheln ──
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px">';
  [{i:'💰',l:'Einnahmen heute',v:'€'+einH.toFixed(2).replace('.',','),c:'#2e7d32'},{i:'📤',l:'Ausgaben heute',v:'€'+ausH.toFixed(2).replace('.',','),c:'#c62828'},{i:'⚖️',l:'Saldo heute',v:'€'+saldoH.toFixed(2).replace('.',','),c:saldoH>=0?'#2e7d32':'#c62828'},{i:'📈',l:'Einnahmen Monat',v:'€'+einM.toFixed(2).replace('.',','),c:'#1565c0'},{i:'📉',l:'Ausgaben Monat',v:'€'+ausM.toFixed(2).replace('.',','),c:'#7b1fa2'}].forEach(function(k){
    html += '<div style="background:var(--surface);border-radius:14px;padding:16px;border:1px solid var(--border);text-align:center"><div style="font-size:20px;margin-bottom:4px">'+k.i+'</div><div style="font-size:11px;color:var(--text-3);margin-bottom:4px">'+k.l+'</div><div style="font-size:17px;font-weight:800;color:'+k.c+'">'+k.v+'</div></div>';
  });
  html += '</div>';

  // ── Z-Bon Import ──
  html += '<div style="background:linear-gradient(135deg,#1a3a1a,#2e5c2e);border-radius:16px;padding:20px;border:1px solid #4caf5044;margin-bottom:16px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">';
  html += '<div><div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px">🖨️ Z-Bon importieren</div>';
  html += '<div style="font-size:11px;color:#a5d6a7">Kassensystem-PDF hochladen → automatisch in Kassenbuch mit MwSt-Aufteilung</div></div>';
  html += '<div style="display:flex;gap:10px;align-items:center">';
  html += '<input id="zbon-file-input" type="file" accept=".pdf" multiple style="display:none" onchange="zbonImport(this)">';
  html += '<button onclick="document.getElementById(\'zbon-file-input\').click()" style="padding:10px 20px;border-radius:10px;border:none;background:#4caf50;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px">upload_file</span>Z-Bons wählen (mehrere möglich)</button>';
  html += '</div></div>';
  html += '<div id="zbon-result" style="margin-top:0"></div>';
  html += '</div>';

  // ── Rechnungen Auto-Import ──
  html += '<div style="background:linear-gradient(135deg,#1a2a3a,#1e3a5c);border-radius:16px;padding:20px;border:1px solid #42a5f544;margin-bottom:16px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">';
  html += '<div><div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px">📄 Betriebsausgaben aus PDFs importieren</div>';
  html += '<div style="font-size:11px;color:#90caf9">UM Trade (Einkauf) · A1 (Telefon) · Edenred (Gutscheine) · SVS → Kassenbuch</div></div>';
  html += '<button onclick="rechnungenImport()" style="padding:10px 20px;border-radius:10px;border:none;background:#1976d2;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px">sync</span>Jetzt importieren</button>';
  html += '</div>';
  html += '<div id="rechnung-import-result" style="margin-top:0"></div>';
  html += '</div>';

  // ── Lohn-PDFs Import ──
  html += '<div style="background:linear-gradient(135deg,#2a1a3a,#3a1e5c);border-radius:16px;padding:20px;border:1px solid #ce93d844;margin-bottom:16px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">';
  html += '<div><div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px">👥 Lohn-PDFs importieren</div>';
  html += '<div style="font-size:11px;color:#ce93d8">Abrechnungsbelege & Zahlungsjournale → Lohnausgaben ins Kassenbuch</div></div>';
  html += '<button onclick="lohnPdfsImport()" style="padding:10px 20px;border-radius:10px;border:none;background:#7b1fa2;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px">sync</span>Jetzt importieren</button>';
  html += '</div>';
  html += '<div id="lohn-import-result" style="margin-top:0"></div>';
  html += '</div>';

  // ── Fixkosten monatlich generieren ──
  (function() {
    var fix = {}; try { fix = JSON.parse(localStorage.getItem('biz_fixkosten')||'{}'); } catch(_) {}
    var fixTotal = (parseFloat(fix.miete||0)+parseFloat(fix.strom||0)+parseFloat(fix.versicherung||0)+parseFloat(fix.buchhaltung||0)+parseFloat(fix.sonstige||0));
    var monate = [];
    for (var y = 2025; y <= 2026; y++) {
      for (var mo = 1; mo <= 12; mo++) {
        var m = y+'-'+(mo<10?'0':'')+mo;
        if (m >= '2025-07' && m <= new Date().toISOString().slice(0,7)) monate.push(m);
      }
    }
    html += '<div style="background:linear-gradient(135deg,#2a2a1a,#3a3a1e);border-radius:16px;padding:20px;border:1px solid #f9a82544;margin-bottom:16px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">';
    html += '<div><div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px">🏠 Fixkosten monatlich eintragen</div>';
    if (fixTotal > 0) {
      html += '<div style="font-size:11px;color:#ffe082">€'+fixTotal.toFixed(2).replace('.',',') + '/Monat — ' + monate.length + ' Monate (Jul 2025 – heute)</div></div>';
      html += '<button onclick="fixkostenImport()" style="padding:10px 20px;border-radius:10px;border:none;background:#f57f17;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px">autorenew</span>Für alle Monate generieren</button>';
    } else {
      html += '<div style="font-size:11px;color:#ffe082">Noch keine Fixkosten in Einstellungen gesetzt</div></div>';
      html += '<button onclick="switchTab(\'einstellungen\')" style="padding:10px 20px;border-radius:10px;border:none;background:#f57f17;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">⚙️ Einstellungen öffnen</button>';
    }
    html += '</div>';
    html += '<div id="fixkosten-import-result" style="margin-top:0"></div>';
    html += '</div>';
  })();

  // ── Kassenbuch-Formular ──
  html += '<div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px">➕ Eintrag manuell erfassen</div>';
  var kbHeute = new Date().toISOString().slice(0,10);
  html += '<div style="display:grid;grid-template-columns:160px 1fr 2fr;gap:10px;margin-bottom:10px">';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--text-3);margin-bottom:4px">Datum</div><input id="kb-datum" type="date" value="'+kbHeute+'" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box"></div>';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--text-3);margin-bottom:4px">Typ</div><select id="kb-typ" onchange="kbMwstUpdate()" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text)"><option value="einnahme">Einnahme</option><option value="ausgabe">Ausgabe</option></select></div>';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--text-3);margin-bottom:4px">Beschreibung</div><input id="kb-desc" type="text" placeholder="z.B. Tageseinnahme" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box"></div>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end">';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--text-3);margin-bottom:4px">Netto (€)</div><input id="kb-netto" type="number" step="0.01" min="0" placeholder="0.00" oninput="kbMwstUpdate()" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box"></div>';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--text-3);margin-bottom:4px">MwSt</div><select id="kb-mwst" onchange="kbMwstUpdate()" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text)"><option value="10">10% (Speisen)</option><option value="20">20% (Getränke)</option><option value="0">0%</option></select></div>';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--text-3);margin-bottom:4px">Brutto (€)</div><input id="kb-brutto" type="text" readonly placeholder="0,00 €" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:monospace;background:var(--bg);color:var(--text);box-sizing:border-box"></div>';
  html += '<button onclick="kassenbuchAdd()" style="padding:10px 18px;border-radius:10px;border:none;background:#610000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">Speichern</button>';
  html += '</div></div>';

  // ── Kassenbuch-Chart (letzte 14 Tage) ──
  if (kbAll.length > 0) {
    var chartDays = [];
    for (var ci = 13; ci >= 0; ci--) {
      var cd = new Date(); cd.setDate(cd.getDate()-ci);
      chartDays.push(cd.toISOString().slice(0,10));
    }
    var chartEin = chartDays.map(function(d){ return kbAll.filter(function(e){return e.typ==='einnahme'&&(e.datum||'').slice(0,10)===d;}).reduce(function(s,e){return s+parseFloat(e.brutto||0);},0); });
    var chartAus = chartDays.map(function(d){ return kbAll.filter(function(e){return e.typ==='ausgabe'&&(e.datum||'').slice(0,10)===d;}).reduce(function(s,e){return s+parseFloat(e.brutto||0);},0); });
    var chartLabels = chartDays.map(function(d){ var p=d.split('-'); return p[2]+'.'+p[1]; });
    html += '<div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:16px">';
    html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px">📊 Letzte 14 Tage</div>';
    html += '<canvas id="kb-chart" style="max-height:200px"></canvas>';
    html += '</div>';

    // Jahresübersicht letzte 12 Monate
    var jahresEin = [], jahresAus = [], jahresLabels = [];
    var jNow = new Date();
    var jMonthNames = ['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    for (var ji = 11; ji >= 0; ji--) {
      var jm = new Date(jNow.getFullYear(), jNow.getMonth() - ji, 1);
      var jmStr = jm.getFullYear() + '-' + String(jm.getMonth()+1).padStart(2,'0');
      jahresLabels.push(jMonthNames[jm.getMonth()] + ' ' + String(jm.getFullYear()).slice(2));
      jahresEin.push(kbAll.filter(function(e){ return e.typ==='einnahme' && (e.datum||'').slice(0,7)===jmStr; }).reduce(function(s,e){ return s+parseFloat(e.brutto||0); }, 0));
      jahresAus.push(kbAll.filter(function(e){ return e.typ==='ausgabe'  && (e.datum||'').slice(0,7)===jmStr; }).reduce(function(s,e){ return s+parseFloat(e.brutto||0); }, 0));
    }
    var jahresSaldo = jahresEin.map(function(v,i){ return parseFloat((v - jahresAus[i]).toFixed(2)); });
    var jahresGesEin = jahresEin.reduce(function(s,v){ return s+v; }, 0);
    var jahresGesAus = jahresAus.reduce(function(s,v){ return s+v; }, 0);
    html += '<div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:16px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">';
    html += '<div style="font-size:13px;font-weight:700;color:var(--text)">📅 Jahresübersicht — letzte 12 Monate</div>';
    html += '<div style="display:flex;gap:12px;font-size:11px">';
    html += '<span style="color:#2e7d32;font-weight:700">Ein: €' + jahresGesEin.toFixed(2).replace('.',',') + '</span>';
    html += '<span style="color:#c62828;font-weight:700">Aus: €' + jahresGesAus.toFixed(2).replace('.',',') + '</span>';
    html += '<span style="color:' + (jahresGesEin-jahresGesAus>=0?'#1565c0':'#c62828') + ';font-weight:700">Saldo: €' + (jahresGesEin-jahresGesAus).toFixed(2).replace('.',',') + '</span>';
    html += '</div></div>';
    html += '<canvas id="kb-jahres-chart" style="max-height:220px"></canvas>';
    html += '</div>';
  }

  // ── Kassenbuch-Tabelle ──
  var kbRecent = kbAll.slice().reverse().slice(0,30);
  html += '<div style="background:var(--surface);border-radius:16px;border:1px solid var(--border);overflow:hidden;margin-bottom:16px">';
  html += '<div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between"><span style="font-size:13px;font-weight:700;color:var(--text)">📋 Letzte Einträge</span><div style="display:flex;gap:8px"><button onclick="kassenbuchCsvExport()" style="padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);font-size:11px;font-weight:600;cursor:pointer">📥 CSV</button><button onclick="kassenbuchPdfExport()" style="padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);font-size:11px;font-weight:600;cursor:pointer">🖨️ PDF</button></div></div>';
  if (!kbRecent.length) {
    html += '<div style="padding:30px;text-align:center;color:var(--text-3);font-size:13px">Noch keine Einträge — oben ersten Eintrag erfassen</div>';
  } else {
    html += '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:var(--bg)">';
    ['Datum','Typ','Beschreibung','Netto','MwSt','Brutto',''].forEach(function(h){html+='<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--text-3)">'+h+'</th>';});
    html += '</tr></thead><tbody>';
    kbRecent.forEach(function(e){
      var isEin = e.typ==='einnahme';
      html += '<tr style="border-bottom:1px solid var(--border)">';
      html += '<td style="padding:8px 10px;font-size:12px;color:var(--text-2)">'+(e.datum||'').slice(0,10)+'</td>';
      html += '<td style="padding:8px 10px;font-size:12px;font-weight:700;color:'+(isEin?'#2e7d32':'#c62828')+'">'+(isEin?'+ Einnahme':'− Ausgabe')+'</td>';
      html += '<td style="padding:8px 10px;font-size:12px;color:var(--text)">'+_esc(e.beschreibung||'')+'</td>';
      html += '<td style="padding:8px 10px;font-size:12px;color:var(--text-2);text-align:right">'+parseFloat(e.netto||0).toFixed(2).replace('.',',')+'</td>';
      html += '<td style="padding:8px 10px;font-size:12px;color:var(--text-3);text-align:right">'+(e.mwst_satz||0)+'%</td>';
      html += '<td style="padding:8px 10px;font-size:12px;font-weight:700;color:var(--text);text-align:right">'+parseFloat(e.brutto||0).toFixed(2).replace('.',',')+' €</td>';
      html += '<td style="padding:8px 10px;text-align:right"><button onclick="kassenbuchLoeschen(\''+e.id+'\')" style="padding:3px 7px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text-3);font-size:11px;cursor:pointer">✕</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  // ── MwSt-Auswertung ──
  (function() {
    var byM = {};
    kbAll.forEach(function(e) {
      var m = (e.datum||'').slice(0,7); if (!m) return;
      if (!byM[m]) byM[m] = {ein:0,aus:0,ust10:0,ust20:0,vs10:0,vs20:0};
      var br = parseFloat(e.brutto||0), mw = parseFloat(e.mwst_betrag||0), ms = parseFloat(e.mwst_satz||0);
      if (e.typ==='einnahme') { byM[m].ein+=br; if(ms==10) byM[m].ust10+=mw; if(ms==20) byM[m].ust20+=mw; }
      else { byM[m].aus+=br; if(ms==10) byM[m].vs10+=mw; if(ms==20) byM[m].vs20+=mw; }
    });
    var rows = Object.entries(byM).sort((a,b)=>a[0].localeCompare(b[0]));
    if (rows.length) {
      html += '<div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:16px;overflow-x:auto">';
      html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px">🧾 MwSt-Auswertung pro Monat</div>';
      html += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<thead><tr style="border-bottom:2px solid var(--border)">';
      ['Monat','Einnahmen','Ausgaben','Saldo','USt 10%','USt 20%','Vorsteuer','Zahllast'].forEach(function(h){
        html += '<th style="padding:6px 8px;text-align:right;color:var(--text-3);font-weight:600;white-space:nowrap">'+h+'</th>';
      });
      html += '</tr></thead><tbody>';
      var totals = {ein:0,aus:0,ust10:0,ust20:0,vs:0,zl:0};
      rows.forEach(function(r) {
        var m=r[0],v=r[1];
        var saldo=v.ein-v.aus, vs=v.vs10+v.vs20, zl=(v.ust10+v.ust20)-vs;
        totals.ein+=v.ein; totals.aus+=v.aus; totals.ust10+=v.ust10; totals.ust20+=v.ust20; totals.vs+=vs; totals.zl+=zl;
        var sc=saldo>=0?'#2e7d32':'#c62828', zc=zl>=0?'#c62828':'#2e7d32';
        html += '<tr style="border-bottom:1px solid var(--border)">';
        html += '<td style="padding:6px 8px;font-weight:700;color:var(--text);white-space:nowrap">'+m+'</td>';
        html += '<td style="padding:6px 8px;text-align:right;color:#2e7d32">€'+v.ein.toFixed(2).replace('.',',')+'</td>';
        html += '<td style="padding:6px 8px;text-align:right;color:#c62828">€'+v.aus.toFixed(2).replace('.',',')+'</td>';
        html += '<td style="padding:6px 8px;text-align:right;font-weight:700;color:'+sc+'">€'+saldo.toFixed(2).replace('.',',')+'</td>';
        html += '<td style="padding:6px 8px;text-align:right">€'+v.ust10.toFixed(2).replace('.',',')+'</td>';
        html += '<td style="padding:6px 8px;text-align:right">€'+v.ust20.toFixed(2).replace('.',',')+'</td>';
        html += '<td style="padding:6px 8px;text-align:right;color:#1565c0">€'+vs.toFixed(2).replace('.',',')+'</td>';
        html += '<td style="padding:6px 8px;text-align:right;font-weight:700;color:'+zc+'">€'+zl.toFixed(2).replace('.',',')+'</td>';
        html += '</tr>';
      });
      html += '<tr style="border-top:2px solid var(--border);font-weight:800;background:var(--bg)">';
      html += '<td style="padding:8px;color:var(--text)">Gesamt</td>';
      html += '<td style="padding:8px;text-align:right;color:#2e7d32">€'+totals.ein.toFixed(2).replace('.',',')+'</td>';
      html += '<td style="padding:8px;text-align:right;color:#c62828">€'+totals.aus.toFixed(2).replace('.',',')+'</td>';
      var tSaldo=totals.ein-totals.aus;
      html += '<td style="padding:8px;text-align:right;font-weight:800;color:'+(tSaldo>=0?'#2e7d32':'#c62828')+'">€'+tSaldo.toFixed(2).replace('.',',')+'</td>';
      html += '<td style="padding:8px;text-align:right">€'+totals.ust10.toFixed(2).replace('.',',')+'</td>';
      html += '<td style="padding:8px;text-align:right">€'+totals.ust20.toFixed(2).replace('.',',')+'</td>';
      html += '<td style="padding:8px;text-align:right;color:#1565c0">€'+totals.vs.toFixed(2).replace('.',',')+'</td>';
      html += '<td style="padding:8px;text-align:right;font-weight:800;color:'+(totals.zl>=0?'#c62828':'#2e7d32')+'">€'+totals.zl.toFixed(2).replace('.',',')+'</td>';
      html += '</tr></tbody></table></div>';
    }
  })();

  // ── Monatsabschluss PDF ──
  html += '<div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px">📊 Monatsabschluss für Steuerberater</div>';
  html += '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--text-3);margin-bottom:4px">Monat wählen</div>';
  html += '<input type="month" id="kb-abschluss-monat" value="' + new Date().toISOString().slice(0,7) + '" style="padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text)"></div>';
  html += '<button onclick="monatsabschlussPdf()" style="padding:10px 20px;border-radius:10px;border:none;background:#610000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:18px;white-space:nowrap">📊 Monatsabschluss PDF erstellen</button>';
  html += '</div></div>';

  // ── Lieferanten-Einkaufsübersicht ──
  html += '<div id="buch-lieferant-section" style="margin-bottom:16px">';
  html += '<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:10px;padding-top:4px">🏪 Einkaufsübersicht pro Lieferant</div>';
  html += '<div id="buch-lieferant-btns" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
  var lieferanten = [
    {key:'umtrade', label:'UM Trade (Mustafa)', farbe:'#1565c0'},
    {key:'edenred', label:'Edenred', farbe:'#e65100'},
    {key:'a1', label:'A1 Mobilfunk', farbe:'#c62828'},
    {key:'svs', label:'SVS', farbe:'#6a1b9a'},
  ];
  lieferanten.forEach(function(l) {
    html += '<button onclick="buchLieferantAnalyse(\''+l.key+'\',\''+l.label+'\')" style="padding:7px 14px;border-radius:10px;border:2px solid '+l.farbe+'33;background:'+l.farbe+'11;color:'+l.farbe+';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">store</span>'+l.label+'</button>';
  });
  html += '</div>';
  html += '<div id="buch-lieferant-ergebnis"></div>';
  html += '</div>';

  // ── E-Mail Backfill ──
  html += '<div style="background:var(--surface);border-radius:16px;padding:18px 20px;border:1px solid var(--border);margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px">📥 E-Mail Import — alte Rechnungen nachladen</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end;flex-wrap:wrap">';
  html += '<div><div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:3px">Von</div><input type="date" id="bf-von" value="2026-01-01" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box"></div>';
  html += '<div><div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:3px">Bis</div><input type="date" id="bf-bis" value="2026-02-01" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box"></div>';
  html += '<div><div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:3px">Stichwort (z.B. "mustafa")</div><input type="text" id="bf-stichwort" placeholder="leer = alle" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box"></div>';
  html += '<button onclick="buchEmailBackfill()" style="padding:9px 16px;border-radius:8px;border:none;background:#1565c0;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">download</span>Nachladen</button>';
  html += '</div>';
  html += '<p style="font-size:11px;color:var(--text-3);margin-top:10px;margin-bottom:0">Lädt PDFs direkt aus Gmail (IMAP). Dauert 1–2 Minuten — Seite danach neu laden.</p>';
  html += '</div>';

  // ── Steuerberater-Dokumente ──
  html += '<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:12px;padding-top:8px">📁 Steuerberater-Dokumente</div>';

  // ── Upload-Bereich ──
  html += '<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866;margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:14px">📤 Dokument hochladen</div>';
  html += '<input id="buch-file-input" type="file" accept=".pdf" style="display:none">';
  html += '<div id="buch-drop-zone" onclick="document.getElementById(\'buch-file-input\').click()" ondragover="event.preventDefault();this.style.borderColor=\'#610000\';this.style.background=\'#fff0ee\'" ondragleave="this.style.borderColor=\'#e3beb8\';this.style.background=\'#fff8f6\'" ondrop="buchDropHandler(event)" style="border:2px dashed #e3beb8;border-radius:14px;padding:28px;text-align:center;cursor:pointer;background:#fff8f6;margin-bottom:14px">';
  html += '<span class="material-symbols-outlined" style="font-size:36px;color:#610000">cloud_upload</span>';
  html += '<p style="font-size:13px;font-weight:600;color:#261816;margin-top:8px">PDF hierher ziehen oder tippen</p>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end">';
  html += '<div><div style="font-size:11px;font-weight:600;color:#8d6562;margin-bottom:4px">Kategorie</div>';
  html += '<select id="buch-typ-select" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff;color:#261816;appearance:none;background-image:url(\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22><path d=%22M2 4l4 4 4-4%22 fill=%22none%22 stroke=%22%238d6562%22 stroke-width=%221.5%22/></svg>\');background-repeat:no-repeat;background-position:right 10px center">';
  html += '<option value="">— Wählen —</option>';
  BUCH_TYPEN.forEach(function(t) { html += '<option value="' + t.id + '">' + t.label + '</option>'; });
  html += '</select></div>';
  html += '<div><div style="font-size:11px;font-weight:600;color:#8d6562;margin-bottom:4px">Monat</div>';
  html += '<input id="buch-monat-input" type="month" value="' + currentMonth + '" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;font-size:13px;font-family:inherit;background:#fff;color:#261816"></div>';
  html += '<button onclick="buchUploadHandler()" style="padding:10px 18px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;display:flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px">upload</span>Hochladen</button>';
  html += '</div></div>';

  // ── Filter ──
  html += '<div style="background:#fff;border-radius:16px;padding:16px 20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866;margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">';
  html += '<span style="font-size:12px;font-weight:700;color:#8d6562">Filter:</span>';
  html += '<select onchange="document.getElementById(\'panel-buchhaltung\').dataset.filterTyp=this.value;renderBuchhaltungTab()" style="padding:6px 10px;border-radius:8px;border:1px solid #e3beb8;font-size:12px;font-family:inherit;background:#fff">';
  html += '<option value=""' + (!filterTyp ? ' selected' : '') + '>Alle Typen</option>';
  BUCH_TYPEN.forEach(function(t) { html += '<option value="' + t.id + '"' + (filterTyp === t.id ? ' selected' : '') + '>' + t.label + '</option>'; });
  html += '</select>';
  html += '<select onchange="document.getElementById(\'panel-buchhaltung\').dataset.filterStatus=this.value;renderBuchhaltungTab()" style="padding:6px 10px;border-radius:8px;border:1px solid #e3beb8;font-size:12px;font-family:inherit;background:#fff">';
  html += '<option value=""' + (!filterStatus ? ' selected' : '') + '>Alle Status</option>';
  BUCH_STATUS.forEach(function(s) { html += '<option value="' + s.id + '"' + (filterStatus === s.id ? ' selected' : '') + '>' + s.label + '</option>'; });
  html += '</select>';
  html += '<input type="month" value="' + filterMonat + '" onchange="document.getElementById(\'panel-buchhaltung\').dataset.filterMonat=this.value;renderBuchhaltungTab()" style="padding:6px 10px;border-radius:8px;border:1px solid #e3beb8;font-size:12px;font-family:inherit;background:#fff">';
  if (filterTyp || filterStatus || filterMonat) {
    html += '<button onclick="var p=document.getElementById(\'panel-buchhaltung\');p.dataset.filterTyp=\'\';p.dataset.filterStatus=\'\';p.dataset.filterMonat=\'\';renderBuchhaltungTab()" style="padding:5px 10px;border-radius:8px;border:1px solid #e3beb8;background:#fff;font-size:11px;color:#8B0000;cursor:pointer;font-family:inherit">✕ Reset</button>';
  }
  html += '<span style="margin-left:auto;font-size:11px;color:#8d6562">' + filtered.length + ' von ' + docs.length + ' Dokumente</span>';
  html += '</div>';

  // ── Monats-Ordner ──
  var monate = {};
  docs.forEach(function(d) { if (!monate[d.monat]) monate[d.monat] = []; monate[d.monat].push(d); });
  var sortedMonths = Object.keys(monate).sort().reverse().slice(0, 6);

  if (sortedMonths.length > 0) {
    html += '<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e3beb866;margin-bottom:16px">';
    html += '<div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:14px">📁 Monats-Ordner</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">';
    sortedMonths.forEach(function(m) {
      var mDocs = monate[m];
      var hasTyp = {};
      mDocs.forEach(function(d) { hasTyp[d.typ] = true; });
      var complete = BUCH_TYPEN.filter(function(t) { return t.id !== 'sonstige'; }).every(function(t) { return hasTyp[t.id]; });
      var parts = m.split('-');
      var label = ['', 'Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][parseInt(parts[1])] + ' ' + parts[0];
      html += '<div style="border:1.5px solid ' + (complete ? '#4caf50' : '#e3beb8') + ';border-radius:12px;padding:14px;cursor:pointer" onclick="document.getElementById(\'panel-buchhaltung\').dataset.filterMonat=\'' + m + '\';renderBuchhaltungTab()">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
      html += '<span style="font-size:14px;font-weight:700;color:#261816">' + label + '</span>';
      html += '<span style="font-size:18px">' + (complete ? '✅' : '⚠️') + '</span>';
      html += '</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
      BUCH_TYPEN.filter(function(t) { return t.id !== 'sonstige'; }).forEach(function(t) {
        var has = hasTyp[t.id];
        html += '<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:' + (has ? '#e8f5e9' : '#fce4ec') + ';color:' + (has ? '#1b5e20' : '#c62828') + '">' + (has ? '✓' : '✕') + ' ' + t.label + '</span>';
      });
      html += '</div>';
      html += '<div style="font-size:10px;color:#8d6562;margin-top:6px">' + mDocs.length + ' Dokument' + (mDocs.length !== 1 ? 'e' : '') + '</div>';
      html += '</div>';
    });
    html += '</div></div>';
  }

  // ── Dokumente-Tabelle ──
  // ── Dokumente vom Server laden ──
  var serverDocs = [];
  try {
    var sdRes = await fetch('/api/pdf');
    if (sdRes.ok) serverDocs = await sdRes.json();
  } catch(_) {}

  html += '<div style="background:var(--surface);border-radius:16px;border:1px solid var(--border);overflow:hidden;margin-bottom:16px">';
  html += '<div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
  html += '<span style="font-size:13px;font-weight:800;color:var(--text)">📄 Dokumente in der Datenbank</span>';
  html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button onclick="buchKorrigiereMonate()" style="padding:5px 10px;border-radius:8px;border:1px solid #e3beb8;background:#fff8f6;font-size:11px;font-weight:700;color:#610000;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:13px">auto_fix_high</span>Monate korrigieren</button><button onclick="buchSmartScan()" style="padding:5px 10px;border-radius:8px;border:1px solid #c3e6cb;background:#f0fff4;font-size:11px;font-weight:700;color:#155724;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:13px">document_scanner</span>Smart Scan</button><span style="font-size:11px;color:var(--text-3)">' + serverDocs.length + ' Dateien</span></div>';
  html += '</div>';

  if (serverDocs.length === 0) {
    html += '<div style="padding:36px;text-align:center;color:var(--text-3)">';
    html += '<span class="material-symbols-outlined" style="font-size:44px;display:block;margin-bottom:8px;opacity:.4">folder_off</span>';
    html += '<p style="font-size:13px;font-weight:600">Noch keine Dokumente</p>';
    html += '<p style="font-size:12px;margin-top:4px">Lade oben dein erstes PDF hoch</p>';
    html += '</div>';
  } else {
    serverDocs.forEach(function(d) {
      var typObj = BUCH_TYPEN.find(function(t) { return t.id === d.typ; }) || { label: d.typ, icon: 'description' };
      var statObj = BUCH_STATUS.find(function(s) { return s.id === d.status; }) || BUCH_STATUS[0];
      var parts = (d.monat || '').split('-');
      var monatLbl = parts.length === 2 ? (['','Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][parseInt(parts[1])] + ' ' + parts[0]) : (d.monat || '—');
      var sizeKB = d.groesse ? (d.groesse > 1024*1024 ? (d.groesse/1024/1024).toFixed(1)+' MB' : Math.round(d.groesse/1024)+' KB') : '';

      html += '<div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
      html += '<span class="material-symbols-outlined" style="font-size:24px;color:#610000;flex-shrink:0">' + typObj.icon + '</span>';
      html += '<div style="flex:1;min-width:160px">';
      html += '<div style="font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + _esc(d.name) + '">' + _esc(d.name) + '</div>';
      html += '<div style="font-size:11px;color:var(--text-3);margin-top:2px">' + typObj.label + ' · ' + monatLbl + (sizeKB ? ' · ' + sizeKB : '') + '</div>';
      html += '</div>';
      html += '<select onchange="buchSetStatus(\'' + d.id + '\',this.value)" style="padding:4px 8px;border-radius:8px;border:1px solid ' + statObj.color + '55;background:' + statObj.bg + ';color:' + statObj.color + ';font-size:11px;font-weight:700;font-family:inherit;cursor:pointer">';
      BUCH_STATUS.forEach(function(s) { html += '<option value="' + s.id + '"' + (d.status === s.id ? ' selected' : '') + '>' + s.label + '</option>'; });
      html += '</select>';
      html += '<a href="/api/pdf/' + d.id + '/view" target="_blank" style="padding:6px 10px;border-radius:8px;border:1px solid #e3beb8;background:var(--surface);cursor:pointer;text-decoration:none;font-size:11px;font-weight:700;color:#1565c0;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:14px">visibility</span>Anzeigen</a>';
      html += '<a href="/api/pdf/' + d.id + '" download="' + _esc(d.name) + '" style="padding:6px 10px;border-radius:8px;border:1px solid #e3beb8;background:var(--surface);cursor:pointer;text-decoration:none;font-size:11px;font-weight:700;color:#2e7d32;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:14px">download</span>Herunterladen</a>';
      html += '<button onclick="buchPdfZuJson(\'' + d.id + '\',\'' + _esc(d.name) + '\')" style="padding:6px 10px;border-radius:8px;border:1px solid #e3beb8;background:var(--surface);cursor:pointer;font-size:11px;font-weight:700;color:#7b1fa2;display:flex;align-items:center;gap:4px;font-family:inherit" title="Als JSON speichern"><span class="material-symbols-outlined" style="font-size:14px">data_object</span>→ JSON</button>';
      html += '<button onclick="buchToggleEdit(\'' + d.id + '\')" style="padding:6px;border-radius:8px;border:1px solid #e3beb8;background:var(--surface);cursor:pointer" title="Bearbeiten"><span class="material-symbols-outlined" style="font-size:14px;color:#5a6472">edit</span></button>';
      html += '<button onclick="buchDeleteDoc(\'' + d.id + '\')" style="padding:6px;border-radius:8px;border:1px solid #e3beb8;background:var(--surface);cursor:pointer" title="Löschen"><span class="material-symbols-outlined" style="font-size:14px;color:#5a6472">delete</span></button>';
      html += '</div>';
      html += '<div id="buch-edit-' + d.id + '" style="display:none;padding:10px 20px 14px;border-bottom:1px solid var(--border);background:var(--bg);gap:10px;flex-wrap:wrap;align-items:flex-end">';
      html += '<div style="font-size:11px;font-weight:700;color:var(--text-3);align-self:center">✏️ Bearbeiten:</div>';
      html += '<div><div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:3px">Monat</div><input type="month" id="buch-edit-monat-' + d.id + '" value="' + (d.monat||'') + '" style="padding:6px 8px;border-radius:7px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--surface);color:var(--text)"></div>';
      html += '<div><div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:3px">Kategorie</div><select id="buch-edit-typ-' + d.id + '" style="padding:6px 8px;border-radius:7px;border:1px solid var(--border);font-size:12px;font-family:inherit;background:var(--surface);color:var(--text)">';
      BUCH_TYPEN.forEach(function(t) { html += '<option value="' + t.id + '"' + (d.typ === t.id ? ' selected' : '') + '>' + t.label + '</option>'; });
      html += '</select></div>';
      html += '<button onclick="buchSetMetadaten(\'' + d.id + '\',document.getElementById(\'buch-edit-monat-' + d.id + '\').value,document.getElementById(\'buch-edit-typ-' + d.id + '\').value)" style="padding:7px 14px;border-radius:8px;border:none;background:#610000;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Speichern</button>';
      html += '<button onclick="buchToggleEdit(\'' + d.id + '\')" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-size:12px;color:var(--text-3);cursor:pointer;font-family:inherit">Abbrechen</button>';
      html += '</div>';
    });
  }
  html += '</div>';

  // ── Lohnabrechnungen vom Steuerberater ──
  try {
    var lohnRes = await fetch('/api/data/psc_lohnabrechnungen');
    var lohnData = lohnRes.ok ? await lohnRes.json() : null;
    if (lohnData && lohnData.abrechnungen && lohnData.abrechnungen.length > 0) {
      var zj = lohnData.zahlungsjournal || {};
      var monatLabel = zj.monat ? (['','Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][parseInt(zj.monat.split('-')[1])] + ' ' + zj.monat.split('-')[0]) : '';
      html += '<div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border);margin-bottom:16px">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
      html += '<div style="font-size:14px;font-weight:800;color:var(--text)">👔 Lohnabrechnung ' + monatLabel + '</div>';
      html += '<span style="font-size:11px;color:var(--text-3);background:var(--bg);padding:4px 10px;border-radius:20px;border:1px solid var(--border)">Steuerberater-Daten</span>';
      html += '</div>';
      // Zusammenfassung Kacheln
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px">';
      var kacheln = [
        {l:'Mitarbeiter', v: zj.anzahl_mitarbeiter || lohnData.abrechnungen.length, suf:'', c:'#1565c0'},
        {l:'Auszahlung', v: (zj.summe_mitarbeiter||0).toLocaleString('de-AT',{minimumFractionDigits:2}), suf:' €', c:'#c62828'},
        {l:'ÖGK + FA + Stadt', v: (zj.summe_koerperschaften||0).toLocaleString('de-AT',{minimumFractionDigits:2}), suf:' €', c:'#e65100'},
        {l:'Gesamt', v: (zj.gesamt||0).toLocaleString('de-AT',{minimumFractionDigits:2}), suf:' €', c:'#2e7d32'}
      ];
      kacheln.forEach(function(k) {
        html += '<div style="background:var(--bg);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border)">';
        html += '<div style="font-size:11px;color:var(--text-3);margin-bottom:4px">' + k.l + '</div>';
        html += '<div style="font-size:15px;font-weight:800;color:' + k.c + '">' + k.v + k.suf + '</div>';
        html += '</div>';
      });
      html += '</div>';
      // Abgaben-Detail
      if (zj.finanzamt_detail) {
        html += '<div style="background:var(--bg);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--text-3);display:flex;gap:16px;flex-wrap:wrap">';
        html += '<span>ÖGK Wien: <strong style="color:var(--text)">€ ' + (zj.ogk_wien||0).toLocaleString('de-AT',{minimumFractionDigits:2}) + '</strong></span>';
        html += '<span>LSt: <strong style="color:var(--text)">€ ' + (zj.finanzamt_detail.L||0).toFixed(2).replace('.',',') + '</strong></span>';
        html += '<span>DB: <strong style="color:var(--text)">€ ' + (zj.finanzamt_detail.DB||0).toFixed(2).replace('.',',') + '</strong></span>';
        html += '<span>DZ: <strong style="color:var(--text)">€ ' + (zj.finanzamt_detail.DZ||0).toFixed(2).replace('.',',') + '</strong></span>';
        html += '<span>KommSt: <strong style="color:var(--text)">€ ' + (zj.kommst||0).toLocaleString('de-AT',{minimumFractionDigits:2}) + '</strong></span>';
        html += '<span>DGA: <strong style="color:var(--text)">€ ' + (zj.dga||0).toFixed(2).replace('.',',') + '</strong></span>';
        html += '</div>';
      }
      // Mitarbeiter-Tabelle
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<thead><tr style="background:var(--bg)">';
      ['Name','Beruf','Brutto','SV','Netto','Auszahlung','BV-Beitrag'].forEach(function(h){
        html += '<th style="padding:8px 10px;text-align:' + (h==='Name'||h==='Beruf'?'left':'right') + ';font-size:11px;color:var(--text-3);font-weight:700;white-space:nowrap;border-bottom:1px solid var(--border)">' + h + '</th>';
      });
      html += '</tr></thead><tbody>';
      lohnData.abrechnungen.forEach(function(ma, i) {
        var sv = Math.abs(ma.sv_lfd||0) + Math.abs(ma.sv_sz||0) + Math.abs(ma.lst_lfd||0);
        html += '<tr style="border-bottom:1px solid var(--border);background:' + (i%2===0?'var(--surface)':'var(--bg)') + '">';
        html += '<td style="padding:8px 10px;font-weight:700;color:var(--text)">' + ma.name + '</td>';
        html += '<td style="padding:8px 10px;color:var(--text-3)">' + (ma.beruf||'—') + '</td>';
        html += '<td style="padding:8px 10px;text-align:right;color:var(--text)">€ ' + ma.brutto.toFixed(2).replace('.',',') + '</td>';
        html += '<td style="padding:8px 10px;text-align:right;color:#c62828">- € ' + sv.toFixed(2).replace('.',',') + '</td>';
        html += '<td style="padding:8px 10px;text-align:right;font-weight:700;color:var(--text)">€ ' + ma.netto.toFixed(2).replace('.',',') + '</td>';
        html += '<td style="padding:8px 10px;text-align:right;color:#2e7d32;font-weight:700">€ ' + ma.auszahlung.toFixed(2).replace('.',',') + '</td>';
        html += '<td style="padding:8px 10px;text-align:right;color:var(--text-3)">€ ' + (ma.bv_beitrag||0).toFixed(2).replace('.',',') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      html += '</div>';
    }
  } catch(_) {}

  panel.innerHTML = html;

  // Chart rendern nach DOM-Update
  if (kbAll.length > 0 && typeof Chart !== 'undefined') {
    var ctx = document.getElementById('kb-chart');
    if (ctx) {
      if (window._kbChart) window._kbChart.destroy();
      window._kbChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [
            { label: 'Einnahmen', data: chartEin, backgroundColor: 'rgba(46,125,50,0.7)', borderRadius: 4 },
            { label: 'Ausgaben',  data: chartAus, backgroundColor: 'rgba(198,40,40,0.7)', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { beginAtZero: true, ticks: { callback: function(v){ return v.toFixed(0)+' €'; }, font: { size: 10 } } }
          }
        }
      });
    }
    var ctxJ = document.getElementById('kb-jahres-chart');
    if (ctxJ && typeof jahresLabels !== 'undefined' && jahresLabels.length) {
      if (window._kbJahresChart) window._kbJahresChart.destroy();
      window._kbJahresChart = new Chart(ctxJ, {
        type: 'bar',
        data: {
          labels: jahresLabels,
          datasets: [
            { label: 'Einnahmen', data: jahresEin, backgroundColor: 'rgba(46,125,50,0.65)', borderRadius: 4 },
            { label: 'Ausgaben',  data: jahresAus, backgroundColor: 'rgba(198,40,40,0.65)', borderRadius: 4 },
            { label: 'Saldo',     data: jahresSaldo, type: 'line', borderColor: '#1565c0', backgroundColor: 'rgba(21,101,192,0.1)', borderWidth: 2, pointRadius: 3, tension: 0.3, yAxisID: 'y' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { beginAtZero: true, ticks: { callback: function(v){ return '€'+v.toFixed(0); }, font: { size: 10 } } }
          }
        }
      });
    }
  }
}

var _confirmCallback = null;
function _showConfirm(msg, onOk, opts) {
  opts = opts || {};
  document.getElementById('_confirm-msg').textContent = msg;
  document.getElementById('_confirm-icon').textContent = opts.icon || '⚠️';
  document.getElementById('_confirm-ok').textContent   = opts.okLabel || 'Löschen';
  document.getElementById('_confirm-ok').style.background = opts.danger === false ? '#1b5e20' : '#8B0000';
  document.getElementById('_confirm-cancel').textContent  = opts.cancelLabel || 'Abbrechen';
  _confirmCallback = onOk;
  document.getElementById('_confirm-overlay').classList.add('active');
}
function _confirmResolve(ok) {
  document.getElementById('_confirm-overlay').classList.remove('active');
  if (ok && typeof _confirmCallback === 'function') _confirmCallback();
  _confirmCallback = null;
}
// Overlay-Klick schließt Dialog
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('_confirm-overlay').addEventListener('click', function(e) {
    if (e.target === this) _confirmResolve(false);
  });
});

function _markField(id, isError) {
  var el = document.getElementById(id);
  if (!el) return;
  if (isError) {
    el.classList.add('field-error');
    function clearErr() {
      el.classList.remove('field-error');
      el.removeEventListener('input', clearErr);
      el.removeEventListener('change', clearErr);
    }
    el.addEventListener('input', clearErr);
    el.addEventListener('change', clearErr);
  } else {
    el.classList.remove('field-error');
  }
}

// ═══════════════════════════════════════════════════════════════
// INBOX — Ordner-Watcher Benachrichtigungen
// ═══════════════════════════════════════════════════════════════

const _INBOX_FOLDER_LABELS = {
  rechnungen:  { label: 'Rechnung',   icon: 'receipt_long',   color: '#610000' },
  preise:      { label: 'Preisliste', icon: 'price_change',   color: '#1565c0' },
  lieferanten: { label: 'Lieferant',  icon: 'local_shipping', color: '#2e7d32' },
  lager:       { label: 'Lager',      icon: 'inventory_2',    color: '#e65100' },
};

// Wird aufgerufen wenn server.js eine neue Datei meldet (via WebSocket)
function _inboxOnNewFile(entry) {
  const def = _INBOX_FOLDER_LABELS[entry.folder] || { label: entry.folder, icon: 'folder', color: '#555' };
  _showToast('📥 Neue ' + def.label + ': ' + entry.filename, 'info');

  // Badge auf Heute-Tab aktualisieren
  _inboxUpdateBadge();

  // Wenn Heute-Tab gerade aktiv → sofort neu rendern
  if (typeof renderHeuteTab === 'function') {
    const panel = document.getElementById('panel-heute');
    if (panel && panel.style.display !== 'none') renderHeuteTab();
  }
}

// Badge (rote Zahl) auf Heute-Tab setzen
async function _inboxUpdateBadge() {
  try {
    const r = await fetch('/api/inbox');
    if (!r.ok) return;
    const data = await r.json();
    const count = data.pending || 0;
    // Badge auf alle Heute-Buttons setzen
    document.querySelectorAll('[data-nav-tab="heute"],[data-drawer-nav="heute"]').forEach(btn => {
      let badge = btn.querySelector('._inbox-badge');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = '_inbox-badge';
          badge.style.cssText = 'position:absolute;top:2px;right:2px;background:#ba1a1a;color:#fff;font-size:9px;font-weight:800;border-radius:20px;padding:1px 5px;min-width:14px;text-align:center;line-height:1.4;pointer-events:none';
          btn.style.position = 'relative';
          btn.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : count;
      } else if (badge) {
        badge.remove();
      }
    });
  } catch(_) {}
}

// Inbox-Sektion im Heute-Tab rendern
async function _renderInboxSection() {
  let html = '';
  try {
    const r = await fetch('/api/inbox');
    if (!r.ok) return '';
    const data = await r.json();
    const pending = (data.items || []).filter(e => e.status === 'pending');
    if (!pending.length) return '';

    html += '<div style="background:#fff;border-radius:16px;border:2px solid #ffd54f;margin-bottom:20px;overflow:hidden">';
    html += '<div style="background:linear-gradient(135deg,#fff8e1,#fff3cd);padding:14px 18px;display:flex;align-items:center;justify-content:space-between">';
    html += '<div style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:20px;color:#f0a500">move_to_inbox</span>';
    html += '<span style="font-weight:800;font-size:14px;color:#5d4037">Inbox</span>';
    html += '<span style="background:#ba1a1a;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:20px">' + pending.length + ' neu</span></div>';
    html += '<button onclick="_inboxClearAll()" style="background:none;border:1px solid #e0b800;color:#8d6e63;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">Alle erledigt</button>';
    html += '</div>';
    html += '<div style="padding:12px 18px;display:flex;flex-direction:column;gap:8px">';

    for (const e of pending) {
      const def = _INBOX_FOLDER_LABELS[e.folder] || { label: e.folder, icon: 'folder', color: '#555' };
      const d = e.data;
      html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fffbf0;border-radius:12px;border:1px solid #f0e0a0">';
      html += '<span class="material-symbols-outlined" style="font-size:22px;color:' + def.color + ';flex-shrink:0">' + def.icon + '</span>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:13px;font-weight:700;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(e.filename) + '</div>';
      html += '<div style="font-size:11px;color:#8d6562;margin-top:2px">';
      if (e.folder === 'rechnungen' && d) {
        html += (d.datum || '') + (d.lieferant ? ' · ' + _esc(d.lieferant) : '') + (d.betrag ? ' · € ' + d.betrag.toFixed(2) : '');
      } else if (d && d.count) {
        html += def.label + ' · ' + d.count + ' Einträge';
      } else {
        html += def.label + ' · ' + new Date(e.added).toLocaleString('de-AT');
      }
      html += '</div></div>';
      html += '<div style="display:flex;gap:6px;flex-shrink:0">';
      if (e.folder === 'rechnungen') {
        html += '<button onclick="_inboxAddRechnung(\'' + _esc(e.id) + '\')" style="padding:6px 12px;background:#610000;color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">+ Verlauf</button>';
      } else if (e.folder === 'preise') {
        html += '<button onclick="_inboxImportPreise(\'' + _esc(e.id) + '\')" style="padding:6px 12px;background:#1565c0;color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Importieren</button>';
      } else if (e.folder === 'lager') {
        html += '<button onclick="_inboxImportLager(\'' + _esc(e.id) + '\')" style="padding:6px 12px;background:#e65100;color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Importieren</button>';
      } else if (e.folder === 'lieferanten') {
        html += '<button onclick="_inboxImportLieferanten(\'' + _esc(e.id) + '\')" style="padding:6px 12px;background:#2e7d32;color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Importieren</button>';
      }
      html += '<button onclick="_inboxDone(\'' + _esc(e.id) + '\')" style="padding:6px 10px;background:#f0f0f5;color:#8d6562;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">✓</button>';
      html += '</div></div>';
    }

    html += '</div></div>';
  } catch(_) {
    return '';
  }
  return html;
}

async function _inboxDone(id) {
  await fetch('/api/inbox/done/' + id, { method: 'POST' });
  _inboxUpdateBadge();
  if (typeof renderHeuteTab === 'function') renderHeuteTab();
}

async function _inboxClearAll() {
  const r = await fetch('/api/inbox');
  const data = await r.json();
  const pending = (data.items || []).filter(e => e.status === 'pending');
  for (const e of pending) await fetch('/api/inbox/done/' + e.id, { method: 'POST' });
  _inboxUpdateBadge();
  if (typeof renderHeuteTab === 'function') renderHeuteTab();
  _showToast('✓ Inbox geleert', 'success');
}

// Rechnung aus Inbox in den Verlauf-Tab übernehmen
async function _inboxAddRechnung(id) {
  try {
    const r = await fetch('/api/inbox');
    const data = await r.json();
    const entry = (data.items || []).find(e => e.id === id);
    if (!entry || !entry.data) { _showToast('Fehler: Eintrag nicht gefunden', 'error'); return; }
    const d = entry.data;

    // In localStorage-Verlauf speichern
    const verlauf = JSON.parse(localStorage.getItem('pizzeria_verlauf') || '[]');
    verlauf.unshift({
      id: 'inbox_' + Date.now(),
      datum: d.datum || new Date().toISOString().slice(0,10),
      lieferant: d.lieferant || 'Unbekannt',
      betrag: d.betrag || 0,
      datei: entry.filename,
      quelle: 'inbox',
      artikel: [],
    });
    localStorage.setItem('pizzeria_verlauf', JSON.stringify(verlauf));

    await _inboxDone(id);
    _showToast('✅ Rechnung in Verlauf übernommen', 'success');
  } catch(e) {
    _showToast('Fehler beim Übernehmen: ' + e.message, 'error');
  }
}

// Preisliste importieren → Produkte aktualisieren
async function _inboxImportPreise(id) {
  try {
    const r = await fetch('/api/inbox');
    const data = await r.json();
    const entry = (data.items || []).find(e => e.id === id);
    if (!entry || !entry.data || !entry.data.rows) { _showToast('Kein CSV gefunden', 'error'); return; }

    const rows = entry.data.rows;
    const produkte = JSON.parse(localStorage.getItem('pizzeria_produkte') || '[]');
    let updated = 0, added = 0;

    for (const row of rows) {
      const name  = row.produkt || row.name || row.artikel || '';
      const preis = parseFloat((row.preis || row.price || '0').replace(',','.'));
      const shop  = row.shop || row.geschaeft || '';
      if (!name || !preis) continue;

      const existing = produkte.find(p => p.name && p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.preis = preis;
        existing.shop  = shop || existing.shop;
        existing.aktualisiert = new Date().toISOString().slice(0,10);
        updated++;
      } else {
        produkte.push({ id: 'inbox_' + Date.now() + '_' + added, name, preis, einheit: row.einheit || row.unit || 'Stk', shop, kategorie: row.kategorie || 'Sonstiges', aktualisiert: new Date().toISOString().slice(0,10) });
        added++;
      }
    }
    localStorage.setItem('pizzeria_produkte', JSON.stringify(produkte));
    await _inboxDone(id);
    _showToast('✅ ' + updated + ' aktualisiert, ' + added + ' neu hinzugefügt', 'success');
  } catch(e) {
    _showToast('Fehler: ' + e.message, 'error');
  }
}

// Lager importieren → Lagerbestand aktualisieren
async function _inboxImportLager(id) {
  try {
    const r = await fetch('/api/inbox');
    const data = await r.json();
    const entry = (data.items || []).find(e => e.id === id);
    if (!entry || !entry.data || !entry.data.rows) { _showToast('Kein CSV gefunden', 'error'); return; }

    const rows = entry.data.rows;
    const lager = JSON.parse(localStorage.getItem('pizzeria_lager') || '[]');
    let updated = 0, added = 0;

    for (const row of rows) {
      const artikel = row.artikel || row.name || row.produkt || '';
      const menge   = parseFloat((row.menge || row.quantity || '0').replace(',','.'));
      if (!artikel) continue;

      const existing = lager.find(l => l.artikel && l.artikel.toLowerCase() === artikel.toLowerCase());
      if (existing) {
        existing.menge = menge;
        existing.einheit = row.einheit || row.unit || existing.einheit || 'Stk';
        existing.mindestmenge = parseFloat(row.mindestmenge || existing.mindestmenge || 0);
        updated++;
      } else {
        lager.push({ id: 'inbox_' + Date.now() + '_' + added, artikel, menge, einheit: row.einheit || 'Stk', mindestmenge: parseFloat(row.mindestmenge || 0), kategorie: row.kategorie || 'Sonstiges' });
        added++;
      }
    }
    localStorage.setItem('pizzeria_lager', JSON.stringify(lager));
    await _inboxDone(id);
    _showToast('✅ Lager: ' + updated + ' aktualisiert, ' + added + ' neu', 'success');
  } catch(e) {
    _showToast('Fehler: ' + e.message, 'error');
  }
}

// Lieferanten aus Inbox importieren → pizzeria_lieferanten localStorage
async function _inboxImportLieferanten(id) {
  try {
    const r = await fetch('/api/inbox');
    const data = await r.json();
    const entry = (data.items || []).find(e => e.id === id);
    if (!entry || !entry.data || !entry.data.rows) { _showToast('Kein CSV gefunden', 'error'); return; }
    const rows = entry.data.rows;
    const liste = lfLoad();
    let updated = 0, added = 0;
    for (const row of rows) {
      const name = (row.name || row.lieferant || '').trim();
      if (!name) continue;
      const existing = liste.find(l => l.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        if (row.tel)       existing.tel       = row.tel;
        if (row.email)     existing.email     = row.email;
        if (row.notiz)     existing.notiz     = row.notiz;
        if (row.typ)       existing.typ       = row.typ;
        if (row.kat)       existing.kat       = row.kat;
        if (row.bewertung) existing.bewertung = parseInt(row.bewertung) || existing.bewertung;
        if (row.farbe)     existing.farbe     = row.farbe;
        updated++;
      } else {
        liste.push({
          id: 'lf' + Date.now() + '_' + added,
          name,
          typ:       row.typ       || 'Sonstiges',
          kat:       row.kat       || 'Lebensmittel',
          tel:       row.tel       || '',
          email:     row.email     || '',
          notiz:     row.notiz     || '',
          bewertung: parseInt(row.bewertung) || 3,
          farbe:     row.farbe     || '#610000',
        });
        added++;
      }
    }
    lfSave(liste);
    await _inboxDone(id);
    _showToast('✅ ' + updated + ' aktualisiert, ' + added + ' neu hinzugefügt', 'success');
    if (typeof renderLieferantenTab === 'function') renderLieferantenTab();
  } catch(e) {
    _showToast('Fehler: ' + e.message, 'error');
  }
}

// Badge beim App-Start laden
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(_inboxUpdateBadge, 2000);
});

// ═══════════════════════════════════════════════════════════════
// GEMINI AI HELPER
// ═══════════════════════════════════════════════════════════════
async function callGeminiVision(prompt, base64, mediaType, maxTokens) {
  const parts = [];
  if (base64) parts.push({ inline_data: { mime_type: mediaType, data: base64 } });
  parts.push({ text: prompt });
  const resp = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: maxTokens || 4096 }
      })
    }
  );
  if (!resp.ok) {
    let errMsg = 'Gemini HTTP ' + resp.status;
    try { const e = await resp.json(); errMsg = e?.error?.message || errMsg; } catch(_) {}
    if (resp.status === 400) throw new Error('Gemini: Ungültiger Key oder Anfrage (400). Key prüfen.');
    if (resp.status === 429) throw new Error('Gemini: Rate Limit erreicht (429). Kurz warten.');
    throw new Error(errMsg);
  }
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Keine Antwort von Gemini erhalten.');
  return text;
}

async function callVisionAI(prompt, base64, mediaType, maxTokens) {
  const provider = localStorage.getItem('pizzeria_ai_provider') || 'claude';
  if (provider === 'gemini' && GEMINI_API_KEY) {
    return callGeminiVision(prompt, base64, mediaType, maxTokens);
  }
  // Claude Fallback
  const isPdf = mediaType === 'application/pdf';
  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64 } };
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens || 4096, messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }] }),
  });
  if (!resp.ok) {
    let errMsg = 'HTTP ' + resp.status;
    try { const e = await resp.json(); errMsg = e?.error?.message || errMsg; } catch(_) {}
    if (resp.status === 401) throw new Error('Ungültiger API Key (401). Bitte API Key prüfen.');
    if (resp.status === 429) throw new Error('Rate Limit (429). Kurz warten.');
    throw new Error(errMsg);
  }
  const data = await resp.json();
  const tb = data.content.find(b => b.type === 'text');
  if (!tb) throw new Error('Keine Antwort von Claude erhalten.');
  return tb.text;
}

// ═══════════════════════════════════════════════════════════════
// N8N WEBHOOK HELPER
// ═══════════════════════════════════════════════════════════════
async function n8nHook(name, data) {
  if (localStorage.getItem('pizzeria_n8n_enabled') !== '1') return;
  const url = localStorage.getItem('pizzeria_n8n_url') || 'http://localhost:5678';
  try {
    await fetch(url + '/webhook/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    });
  } catch(_) {}
}

// ═══════════════════════════════════════════════════════════════
// EINKAUF LOGGEN MODAL
// ═══════════════════════════════════════════════════════════════
function einkaufLoggModal() {
  document.getElementById('einkauf-log-overlay')?.remove();
  const shops = [
    { id: 'metro',    name: 'Metro',    color: '#003DA5' },
    { id: 'billa',    name: 'Billa',    color: '#ed1c24' },
    { id: 'lidl',     name: 'Lidl',     color: '#0050AA' },
    { id: 'spar',     name: 'Spar',     color: '#007f3e' },
    { id: 'etsan',    name: 'Etsan',    color: '#e65100' },
    { id: 'umtrade',  name: 'UM Trade', color: '#6a1b9a' },
  ];
  const shopBtns = shops.map(s =>
    `<button onclick="einkaufLoggShop('${s.id}')" id="el-shop-${s.id}"
      style="flex:1;padding:14px 8px;border-radius:12px;border:2px solid ${s.color};background:#fff;color:${s.color};font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s">
      ${escHtml(s.name)}
    </button>`
  ).join('');

  const ov = document.createElement('div');
  ov.id = 'einkauf-log-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';
  ov.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h2 style="margin:0;font-size:18px;font-weight:800;color:#261816;display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined" style="color:#610000;font-size:20px">add_shopping_cart</span>Einkauf loggen
        </h2>
        <button onclick="einkaufLoggClose()" style="background:#f3ebe9;border:none;border-radius:8px;padding:6px;cursor:pointer;line-height:0">
          <span class="material-symbols-outlined" style="font-size:18px;color:#5a403c">close</span>
        </button>
      </div>

      <p style="font-size:12px;font-weight:700;color:#5a403c;margin:0 0 10px;letter-spacing:.5px">SHOP</p>
      <div style="display:flex;gap:10px;margin-bottom:20px">${shopBtns}</div>
      <input type="hidden" id="el-shop-val" value="">

      <p style="font-size:12px;font-weight:700;color:#5a403c;margin:0 0 10px;letter-spacing:.5px">ARTIKEL</p>
      <div id="el-zeilen"></div>
      <button onclick="einkaufLoggZeile()" style="width:100%;padding:9px;border:1.5px dashed #e3beb8;border-radius:10px;background:#fff8f6;color:#610000;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:18px">
        + Zeile hinzufügen
      </button>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff8f6;border-radius:12px;margin-bottom:16px">
        <span style="font-size:14px;font-weight:700;color:#5a403c">Gesamtsumme</span>
        <span id="el-gesamt" style="font-size:22px;font-weight:800;color:#610000">€ 0.00</span>
      </div>

      <button onclick="einkaufLoggSave()" style="width:100%;padding:14px;background:#610000;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit">
        💾 Speichern
      </button>
    </div>`;
  ov.addEventListener('click', e => { if (e.target === ov) einkaufLoggClose(); });
  document.body.appendChild(ov);
  _elZeileIdx = 0;
  einkaufLoggZeile();
  einkaufLoggZeile();
}

function einkaufLoggClose() {
  document.getElementById('einkauf-log-overlay')?.remove();
}

function einkaufLoggShop(id) {
  document.getElementById('el-shop-val').value = id;
  const colors = { metro: '#003DA5', billa: '#ed1c24', lidl: '#0050AA', spar: '#007f3e', etsan: '#e65100', umtrade: '#6a1b9a' };
  ['metro', 'billa', 'lidl', 'spar', 'etsan', 'umtrade'].forEach(s => {
    const btn = document.getElementById('el-shop-' + s);
    if (!btn) return;
    if (s === id) { btn.style.background = colors[s]; btn.style.color = '#fff'; }
    else          { btn.style.background = '#fff';    btn.style.color = colors[s]; }
  });
}

let _elZeileIdx = 0;
function einkaufLoggZeile() {
  const idx = _elZeileIdx++;
  const container = document.getElementById('el-zeilen');
  if (!container) return;
  const row = document.createElement('div');
  row.id = 'el-row-' + idx;
  row.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;align-items:center';
  row.innerHTML =
    `<input type="text" placeholder="Produkt..." id="el-n-${idx}" oninput="einkaufLoggGesamt()"
      style="flex:2;padding:8px 10px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit">` +
    `<input type="number" placeholder="Menge" id="el-m-${idx}" min="0" step="0.01" oninput="einkaufLoggGesamt()"
      style="flex:1;padding:8px 6px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit">` +
    `<select id="el-e-${idx}" style="padding:8px 4px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit">
      <option>kg</option><option>Stk</option><option>L</option><option>Pkg</option>
    </select>` +
    `<input type="number" placeholder="€ Preis" id="el-p-${idx}" min="0" step="0.01" oninput="einkaufLoggGesamt()"
      style="flex:1;padding:8px 6px;border:1.5px solid #e3beb8;border-radius:8px;font-size:13px;font-family:inherit">` +
    `<button onclick="document.getElementById('el-row-${idx}').remove();einkaufLoggGesamt()"
      style="background:none;border:none;cursor:pointer;color:#b52619;font-size:18px;line-height:1;padding:4px">✕</button>`;
  container.appendChild(row);
}

function einkaufLoggGesamt() {
  let sum = 0;
  document.querySelectorAll('[id^="el-p-"]').forEach(inp => { sum += parseFloat(inp.value) || 0; });
  const el = document.getElementById('el-gesamt');
  if (el) el.textContent = '€ ' + sum.toFixed(2);
}

function einkaufLoggSave() {
  const shopId   = document.getElementById('el-shop-val')?.value;
  const shopObj  = { metro: 'Metro', billa: 'Billa', lidl: 'Lidl', spar: 'Spar', etsan: 'Etsan', umtrade: 'UM Trade' };
  const shopName = shopObj[shopId] || shopId || 'Unbekannt';
  const heute    = new Date().toISOString().slice(0, 10);
  const rows     = document.querySelectorAll('[id^="el-row-"]');
  const artikel  = [];

  rows.forEach(row => {
    const idx     = row.id.replace('el-row-', '');
    const name    = (document.getElementById('el-n-' + idx)?.value || '').trim();
    const menge   = parseFloat(document.getElementById('el-m-' + idx)?.value) || null;
    const einheit = document.getElementById('el-e-' + idx)?.value || 'Stk';
    const preis   = parseFloat(document.getElementById('el-p-' + idx)?.value);
    if (!name) return;
    artikel.push({ name, menge, einheit, preis: isNaN(preis) ? null : preis });
  });

  if (!shopId)         { _showToast('Bitte Shop auswählen', 'error'); return; }
  if (!artikel.length) { _showToast('Bitte mindestens einen Artikel eingeben', 'error'); return; }

  artikel.forEach(a => {
    addHistoryEntry({
      produktName: a.name, menge: a.menge, einheit: a.einheit, preis: a.preis,
      shopName, shopId, quelle: 'einkauf-log', datum: heute,
    });
    if (a.preis != null) {
      fetch('/api/preisverlauf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produkt: a.name, preis: a.preis, shop: shopName, shop_id: shopId, datum: heute, quelle: 'einkauf-log' })
      }).catch(() => {});
    }
  });

  einkaufLoggClose();
  _showToast(artikel.length + ' Artikel von ' + escHtml(shopName) + ' gespeichert', 'success');
  if (typeof renderVerlaufTab === 'function') renderVerlaufTab();
}

// ═══════════════════════════════════════════════════════════════
// URLAUBSKALENDER
// ═══════════════════════════════════════════════════════════════
function renderUrlaubTab() {
  const panel = document.getElementById('panel-urlaub');
  if (!panel) return;
  const mitarbeiter = getMitarbeiter();
  let eintraege = [];
  try { eintraege = JSON.parse(localStorage.getItem('psc_urlaub') || '[]'); } catch(e) {}

  const heute = new Date().toISOString().slice(0,10);
  const aktiv  = eintraege.filter(e => e.bis >= heute).sort((a,b) => a.von.localeCompare(b.von));
  const archiv = eintraege.filter(e => e.bis < heute).sort((a,b) => b.von.localeCompare(a.von)).slice(0,20);

  const fmtD = d => { const [y,m,t] = d.split('-'); return `${t}.${m}.${y}`; };
  const tage = (von, bis) => { const d1=new Date(von), d2=new Date(bis); return Math.round((d2-d1)/86400000)+1; };
  const maFarbe = id => { const m = mitarbeiter.find(x=>x.id===id); return m ? m.farbe : '#8B0000'; };
  const maName  = id => { const m = mitarbeiter.find(x=>x.id===id); return m ? m.name : id; };

  const statusAmpel = e => {
    if (e.bis < heute) return { bg:'#f5f5f5', clr:'#9e9e9e', label:'Abgeschlossen' };
    if (e.von <= heute) return { bg:'#e3f2fd', clr:'#1565c0', label:'Läuft gerade' };
    const diffTage = Math.round((new Date(e.von)-new Date(heute))/86400000);
    if (diffTage <= 7) return { bg:'#fff8e1', clr:'#f57f17', label:`In ${diffTage} Tag${diffTage===1?'':'en'}` };
    return { bg:'#e8f5e9', clr:'#2e7d32', label:`In ${diffTage} Tagen` };
  };

  const maOptionen = mitarbeiter.length
    ? mitarbeiter.map(m => `<option value="${m.id}">${_esc(m.name)}</option>`).join('')
    : '<option value="">Keine Mitarbeiter</option>';

  const renderKarte = (e, idx) => {
    const st = statusAmpel(e);
    const farbe = maFarbe(e.maId);
    const t = tage(e.von, e.bis);
    return `<div style="background:${st.bg};border:2px solid ${farbe}33;border-left:4px solid ${farbe};border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;border-radius:50%;background:${farbe};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;flex-shrink:0">${_esc(maName(e.maId)).charAt(0)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:15px;color:#261816">${_esc(maName(e.maId))}</div>
        <div style="font-size:13px;color:#5a403c;margin-top:2px">📅 ${fmtD(e.von)} – ${fmtD(e.bis)} <span style="color:#6b6b6b">(${t} Tag${t===1?'':'e'})</span></div>
        ${e.notiz ? `<div style="font-size:12px;color:#6b6b6b;margin-top:3px">💬 ${_esc(e.notiz)}</div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <span style="background:${st.bg};color:${st.clr};border:1px solid ${st.clr}44;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">${st.label}</span>
        <br><button onclick="urlaubLoeschen(${idx})" style="margin-top:6px;padding:3px 10px;border-radius:6px;border:1px solid #e3beb8;background:#fff;color:#8B0000;font-size:11px;cursor:pointer">Löschen</button>
      </div>
    </div>`;
  };

  const aktivHtml  = aktiv.length  ? aktiv.map((e,i) => renderKarte(e, eintraege.indexOf(e))).join('') : '<div style="text-align:center;padding:20px;color:#9e9e9e;font-size:13px">Kein Urlaub geplant</div>';
  const archivHtml = archiv.length ? archiv.map((e,i) => renderKarte(e, eintraege.indexOf(e))).join('') : '';

  panel.innerHTML = `
  <div style="max-width:700px;margin:0 auto;padding:16px">
    <div style="font-size:22px;font-weight:800;color:#261816;margin-bottom:16px">🏖️ Urlaubskalender</div>

    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:18px;margin-bottom:18px">
      <div style="font-weight:700;color:#261816;margin-bottom:14px;font-size:15px">Urlaub eintragen</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <div style="font-size:12px;color:#5a403c;font-weight:600;margin-bottom:4px">Mitarbeiter *</div>
          <select id="url-ma" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
            <option value="">— wählen —</option>${maOptionen}
          </select>
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;font-weight:600;margin-bottom:4px">Art</div>
          <select id="url-art" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
            <option>Urlaub</option><option>Krankenstand</option><option>Zeitausgleich</option><option>Sonderurlaub</option><option>Karenz</option>
          </select>
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;font-weight:600;margin-bottom:4px">Von *</div>
          <input id="url-von" type="date" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;font-weight:600;margin-bottom:4px">Bis *</div>
          <input id="url-bis" type="date" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
        </div>
      </div>
      <input id="url-notiz" type="text" placeholder="Notiz (optional)" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px;margin-bottom:10px">
      <button onclick="urlaubSpeichern()" style="background:#8B0000;color:#fff;border:none;border-radius:10px;padding:11px 28px;font-size:15px;font-weight:700;cursor:pointer;width:100%">+ Urlaub speichern</button>
    </div>

    <!-- Jahres-Kalender Toggle -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="font-weight:700;color:#261816;font-size:15px">Jahresübersicht ${new Date().getFullYear()}</div>
      <button onclick="urlaubKalenderToggle()" id="url-kal-btn" style="padding:6px 14px;border-radius:8px;border:1.5px solid #8B0000;background:#fff;color:#8B0000;font-size:12px;font-weight:700;cursor:pointer">📅 Kalender anzeigen</button>
    </div>
    <div id="url-jahreskal" style="display:none;margin-bottom:18px">${_buildUrlaubJahreskalender(eintraege, mitarbeiter)}</div>

    <div style="font-weight:700;color:#261816;margin-bottom:10px;font-size:15px">Aktuell & geplant (${aktiv.length})</div>
    <div id="urlaub-aktiv">${aktivHtml}</div>

    ${archiv.length ? `<details style="margin-top:16px"><summary style="cursor:pointer;font-size:13px;color:#5a403c;font-weight:600;padding:8px 0">Archiv (${archiv.length})</summary><div style="margin-top:10px">${archivHtml}</div></details>` : ''}
  </div>`;
}

function urlaubKalenderToggle() {
  const kal = document.getElementById('url-jahreskal');
  const btn = document.getElementById('url-kal-btn');
  if (!kal) return;
  const visible = kal.style.display !== 'none';
  kal.style.display = visible ? 'none' : 'block';
  if (btn) btn.textContent = visible ? '📅 Kalender anzeigen' : '📅 Kalender ausblenden';
}

function _buildUrlaubJahreskalender(eintraege, mitarbeiter) {
  const MONATE = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const TAGS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const today = new Date();
  const year = today.getFullYear();

  // Urlaubs-Tage Index: ISO-Datum → [{farbe, name}]
  const urlaubIndex = {};
  eintraege.forEach(e => {
    const farbe = (mitarbeiter.find(m=>m.id===e.maId)||{}).farbe || '#8B0000';
    const name  = (mitarbeiter.find(m=>m.id===e.maId)||{}).name || e.maId;
    const von = new Date(e.von), bis = new Date(e.bis);
    for (let d = new Date(von); d <= bis; d.setDate(d.getDate()+1)) {
      const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!urlaubIndex[iso]) urlaubIndex[iso] = [];
      urlaubIndex[iso].push({ farbe, name });
    }
  });

  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">';
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDay  = new Date(year, m+1, 0);
    // Wochentag des 1. (Mo=0)
    const startWd = (firstDay.getDay() + 6) % 7;
    html += `<div style="background:#fff;border:1px solid #e3beb8;border-radius:12px;padding:10px;font-size:11px">`;
    html += `<div style="font-weight:800;color:#8B0000;margin-bottom:6px;font-size:12px">${MONATE[m]} ${year}</div>`;
    html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;text-align:center">`;
    TAGS.forEach(t => { html += `<div style="color:#9e6b62;font-weight:700;padding:2px 0">${t[0]}</div>`; });
    // leere Tage am Anfang
    for (let i = 0; i < startWd; i++) html += '<div></div>';
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const iso = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = iso === today.toISOString().slice(0,10);
      const ue = urlaubIndex[iso] || [];
      const bg = ue.length > 0 ? ue[0].farbe : isToday ? '#8B0000' : 'transparent';
      const clr = (ue.length > 0 || isToday) ? '#fff' : '#261816';
      const title = ue.map(u=>u.name).join(', ');
      html += `<div title="${title}" style="width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;background:${bg};color:${clr};font-weight:${isToday?'800':'400'};font-size:10px;cursor:${ue.length?'pointer':'default'}">${d}</div>`;
    }
    html += '</div></div>';
  }
  // Legende
  const names = [...new Set(eintraege.map(e=>e.maId))];
  if (names.length) {
    html += '<div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;padding:6px 0">';
    names.forEach(id => {
      const m = mitarbeiter.find(x=>x.id===id);
      if (!m) return;
      html += `<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#261816"><span style="width:12px;height:12px;border-radius:3px;background:${m.farbe||'#8B0000'};display:inline-block"></span>${_esc(m.name)}</span>`;
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function urlaubSpeichern() {
  const maId = document.getElementById('url-ma')?.value || '';
  const von  = document.getElementById('url-von')?.value || '';
  const bis  = document.getElementById('url-bis')?.value || '';
  if (!maId || !von || !bis) { _showToast('Mitarbeiter, Von und Bis sind Pflicht', 'error'); return; }
  if (bis < von) { _showToast('Bis-Datum muss nach Von-Datum sein', 'error'); return; }
  let eintraege = [];
  try { eintraege = JSON.parse(localStorage.getItem('psc_urlaub') || '[]'); } catch(e) {}
  eintraege.push({
    maId, von, bis,
    art:   document.getElementById('url-art')?.value  || 'Urlaub',
    notiz: (document.getElementById('url-notiz')?.value || '').trim(),
    id: Date.now()
  });
  localStorage.setItem('psc_urlaub', JSON.stringify(eintraege));
  _showToast('Urlaub gespeichert ✓', 'success');
  renderUrlaubTab();
}

function urlaubLoeschen(idx) {
  let eintraege = [];
  try { eintraege = JSON.parse(localStorage.getItem('psc_urlaub') || '[]'); } catch(e) {}
  eintraege.splice(idx, 1);
  localStorage.setItem('psc_urlaub', JSON.stringify(eintraege));
  renderUrlaubTab();
}

// ═══════════════════════════════════════════════════════════════
// TRINKGELD-SPLIT
// ═══════════════════════════════════════════════════════════════
function renderTrinkgeldTab() {
  const panel = document.getElementById('panel-trinkgeld');
  if (!panel) return;
  const mitarbeiter = getMitarbeiter();
  let history = [];
  try { history = JSON.parse(localStorage.getItem('psc_trinkgeld') || '[]'); } catch(e) {}

  const heute = new Date().toISOString().slice(0,10);
  const fmtD = d => { const [y,m,t] = d.split('-'); return `${t}.${m}.${y}`; };

  const maCheckboxen = mitarbeiter.length
    ? mitarbeiter.map(m => `
      <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8f4f4;border-radius:8px;cursor:pointer;margin-bottom:6px">
        <input type="checkbox" class="tg-ma-cb" value="${m.id}" style="width:18px;height:18px;accent-color:#8B0000">
        <span style="width:32px;height:32px;border-radius:50%;background:${m.farbe};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;flex-shrink:0">${_esc(m.name).charAt(0)}</span>
        <span style="font-weight:600;color:#261816;flex:1">${_esc(m.name)}</span>
        <span style="font-size:12px;color:#6b6b6b">${m.rolle||''}</span>
        <input type="number" class="tg-stunden" data-ma="${m.id}" value="${m.stunden||8}" min="0" max="24" step="0.5"
          style="width:60px;border:1.5px solid #e3beb8;border-radius:6px;padding:4px 6px;font-size:13px;text-align:center" title="Stunden heute">
      </label>`).join('')
    : '<div style="color:#9e9e9e;font-size:13px;text-align:center;padding:20px">Keine Mitarbeiter angelegt</div>';

  const histRows = [...history].reverse().slice(0,30).map(h => {
    const total = h.splits.reduce((s,x)=>s+x.betrag,0);
    return `<div style="background:#f8f4f4;border-radius:10px;padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:700;color:#261816">${fmtD(h.datum)}</span>
        <span style="font-weight:800;color:#8B0000;font-size:15px">${total.toFixed(2).replace('.',',')} € gesamt</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${h.splits.map(s=>`<span style="background:#fff;border:1px solid #e3beb8;border-radius:20px;padding:3px 10px;font-size:12px;color:#261816"><b>${_esc(s.name)}</b>: ${s.betrag.toFixed(2).replace('.',',')} €</span>`).join('')}
      </div>
      ${h.notiz ? `<div style="font-size:11px;color:#6b6b6b;margin-top:6px">💬 ${_esc(h.notiz)}</div>` : ''}
    </div>`;
  }).join('');

  panel.innerHTML = `
  <div style="max-width:680px;margin:0 auto;padding:16px">
    <div style="font-size:22px;font-weight:800;color:#261816;margin-bottom:16px">💰 Trinkgeld-Split</div>

    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:18px;margin-bottom:18px">
      <div style="font-weight:700;color:#261816;margin-bottom:14px;font-size:15px">Heute aufteilen — ${fmtD(heute)}</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div>
          <div style="font-size:12px;color:#5a403c;font-weight:600;margin-bottom:4px">Gesamt-Trinkgeld €</div>
          <input id="tg-betrag" type="number" step="0.01" placeholder="0,00" oninput="tgVorschau()"
            style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:10px;font-size:18px;font-weight:700;color:#8B0000">
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;font-weight:600;margin-bottom:4px">Aufteilung</div>
          <select id="tg-modus" onchange="tgVorschau()" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:10px;font-size:14px">
            <option value="gleich">Gleich aufteilen</option>
            <option value="stunden">Nach Stunden</option>
            <option value="abteilung">Nach Abteilung %</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom:14px">
        <div style="font-size:12px;color:#5a403c;font-weight:600;margin-bottom:8px">Mitarbeiter auswählen + Stunden (für Stunden-Modus):</div>
        <div id="tg-ma-liste">${maCheckboxen}</div>
      </div>

      <div id="tg-vorschau" style="background:#f8f4f4;border-radius:10px;padding:12px;margin-bottom:12px;min-height:44px;font-size:13px;color:#6b6b6b">
        Betrag eingeben und Mitarbeiter wählen…
      </div>

      <input id="tg-notiz" type="text" placeholder="Notiz (optional)" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px;margin-bottom:10px">
      <button onclick="tgSpeichern()" style="background:#8B0000;color:#fff;border:none;border-radius:10px;padding:11px 28px;font-size:15px;font-weight:700;cursor:pointer;width:100%">Split speichern</button>
    </div>

    <div style="font-weight:700;color:#261816;margin-bottom:10px;font-size:15px">Letzte Einträge</div>
    ${history.length ? `<div>${histRows}</div>` : '<div style="text-align:center;padding:20px;color:#9e9e9e;font-size:13px">Noch keine Einträge</div>'}
  </div>`;
}

function tgGetAuswahl() {
  const checked = [...document.querySelectorAll('.tg-ma-cb:checked')];
  return checked.map(cb => {
    const std = parseFloat(document.querySelector(`.tg-stunden[data-ma="${cb.value}"]`)?.value || 8) || 8;
    const ma  = getMitarbeiter().find(m=>m.id===cb.value);
    return { id: cb.value, name: ma?.name||cb.value, stunden: std };
  });
}

function tgVorschau() {
  const betrag = parseFloat(document.getElementById('tg-betrag')?.value||0)||0;
  const modus  = document.getElementById('tg-modus')?.value || 'gleich';
  const auswahl = tgGetAuswahl();
  const prev = document.getElementById('tg-vorschau');
  if (!prev) return;
  if (!betrag || !auswahl.length) { prev.innerHTML = '<span style="color:#9e9e9e">Betrag eingeben und Mitarbeiter wählen…</span>'; return; }
  const splits = tgBerechnen(betrag, modus, auswahl);
  prev.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
    splits.map(s=>`<span style="background:#fff;border:1.5px solid #8B0000;border-radius:20px;padding:5px 12px;font-size:13px;font-weight:700;color:#8B0000">${_esc(s.name)}: ${s.betrag.toFixed(2).replace('.',',')} €</span>`).join('') +
    '</div>';
}

function tgBerechnen(betrag, modus, auswahl) {
  if (!auswahl.length) return [];
  if (modus === 'gleich') {
    const pro = betrag / auswahl.length;
    return auswahl.map(m => ({ ...m, betrag: Math.round(pro*100)/100 }));
  }
  if (modus === 'abteilung') {
    // % pro Abteilung aus Einstellungen
    var regeln = { kueche:30, service:40, lieferung:30 };
    try { var s = localStorage.getItem('psc_trinkgeld_regeln'); if(s) regeln = JSON.parse(s); } catch(e) {}
    var mitarbeiter = getMitarbeiter();
    var abtMap = { 'Küche':'kueche','Lieferung':'lieferung','Service':'service','Fahrer':'lieferung','Reinigung':'service' };
    // Betrag pro Abteilung berechnen
    var abtGruppen = {};
    auswahl.forEach(function(m) {
      var ma = mitarbeiter.find(function(x){ return x.id === m.id; });
      var abt = (ma?.abteilung || ma?.rolle || '').trim();
      var key = abtMap[abt] || 'service';
      if (!abtGruppen[key]) abtGruppen[key] = [];
      abtGruppen[key].push(m);
    });
    var splits = [];
    Object.entries(abtGruppen).forEach(function([abtKey, mas]) {
      var pct = (regeln[abtKey] || 0) / 100;
      var abtBetrag = betrag * pct;
      var proPerson = mas.length > 0 ? abtBetrag / mas.length : 0;
      mas.forEach(function(m) { splits.push({ ...m, betrag: Math.round(proPerson*100)/100 }); });
    });
    return splits;
  }
  const totalStd = auswahl.reduce((s,m)=>s+m.stunden,0);
  return auswahl.map(m => ({ ...m, betrag: totalStd > 0 ? Math.round(betrag*(m.stunden/totalStd)*100)/100 : 0 }));
}

function tgSpeichern() {
  const betrag  = parseFloat(document.getElementById('tg-betrag')?.value||0)||0;
  const modus   = document.getElementById('tg-modus')?.value || 'gleich';
  const auswahl = tgGetAuswahl();
  if (!betrag || betrag <= 0) { _showToast('Betrag eingeben', 'error'); return; }
  if (!auswahl.length) { _showToast('Mindestens einen Mitarbeiter wählen', 'error'); return; }
  const splits  = tgBerechnen(betrag, modus, auswahl);
  let history = [];
  try { history = JSON.parse(localStorage.getItem('psc_trinkgeld') || '[]'); } catch(e) {}
  history.push({ datum: new Date().toISOString().slice(0,10), betrag, modus, splits, notiz: (document.getElementById('tg-notiz')?.value||'').trim(), id: Date.now() });
  localStorage.setItem('psc_trinkgeld', JSON.stringify(history));
  _showToast('Trinkgeld gespeichert ✓', 'success');
  renderTrinkgeldTab();
}

// ═══════════════════════════════════════════════════════════════
// MHD-TRACKER — Mindesthaltbarkeit
// ═══════════════════════════════════════════════════════════════
function renderMhdTab() {
  const panel = document.getElementById('panel-mhd');
  if (!panel) return;
  let produkte = [];
  try { produkte = JSON.parse(localStorage.getItem('psc_mhd') || '[]'); } catch(e) {}

  const heute = new Date(); heute.setHours(0,0,0,0);
  const diffTage = d => { const dt = new Date(d); dt.setHours(0,0,0,0); return Math.round((dt - heute) / 86400000); };
  const ampel = d => {
    const t = diffTage(d);
    if (t < 0)  return { bg:'#ffebee', clr:'#c62828', bc:'#ef9a9a', icon:'🔴', label:'Abgelaufen' };
    if (t === 0) return { bg:'#fff3e0', clr:'#e65100', bc:'#ffcc80', icon:'🟠', label:'Heute ablaufend!' };
    if (t <= 3) return { bg:'#fff8e1', clr:'#f57f17', bc:'#ffe082', icon:'🟡', label:`Noch ${t} Tag${t===1?'':'e'}` };
    return { bg:'#e8f5e9', clr:'#2e7d32', bc:'#a5d6a7', icon:'🟢', label:`Noch ${t} Tage` };
  };

  const sorted = [...produkte].sort((a,b) => new Date(a.mhd) - new Date(b.mhd));
  const abgelaufen = sorted.filter(p => diffTage(p.mhd) < 0).length;
  const bald = sorted.filter(p => { const t = diffTage(p.mhd); return t >= 0 && t <= 3; }).length;

  const rows = sorted.length ? sorted.map((p, i) => {
    const st = ampel(p.mhd);
    const idx = produkte.indexOf(p);
    return `<div style="background:${st.bg};border:1.5px solid ${st.bc};border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
      <div style="font-size:28px">${st.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:15px;color:#261816">${_esc(p.name)}</div>
        <div style="font-size:12px;color:#5a403c;margin-top:2px">${_esc(p.kategorie||'')} ${p.ort ? '· '+_esc(p.ort) : ''}</div>
        <div style="font-size:13px;font-weight:700;color:${st.clr};margin-top:3px">MHD: ${p.mhd} — ${st.label}</div>
        ${p.menge ? `<div style="font-size:12px;color:#6b6b6b;margin-top:2px">Menge: ${_esc(p.menge)}</div>` : ''}
      </div>
      <button onclick="mhdLoeschen(${p.id !== undefined ? p.id : idx})" style="padding:6px 12px;border-radius:8px;border:1px solid #e3beb8;background:#fff;color:#8B0000;font-size:12px;cursor:pointer;flex-shrink:0">Löschen</button>
    </div>`;
  }).join('') : `<div style="text-align:center;padding:40px;color:#6b6b6b;font-size:14px">Noch keine Produkte eingetragen</div>`;

  panel.innerHTML = `
  <div style="max-width:680px;margin:0 auto;padding:16px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div style="font-size:22px;font-weight:800;color:#261816">📅 MHD-Tracker</div>
      <div style="display:flex;gap:8px;margin-left:auto">
        ${abgelaufen > 0 ? `<span style="background:#ffebee;color:#c62828;border:1px solid #ef9a9a;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">🔴 ${abgelaufen} abgelaufen</span>` : ''}
        ${bald > 0 ? `<span style="background:#fff8e1;color:#f57f17;border:1px solid #ffe082;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">🟡 ${bald} bald fällig</span>` : ''}
      </div>
    </div>

    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:16px;margin-bottom:18px">
      <div style="font-weight:700;color:#261816;margin-bottom:12px;font-size:15px">Neues Produkt eintragen</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <div style="font-size:12px;color:#5a403c;margin-bottom:4px;font-weight:600">Produktname *</div>
          <input id="mhd-name" type="text" placeholder="z.B. Mozzarella" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;margin-bottom:4px;font-weight:600">MHD-Datum *</div>
          <input id="mhd-datum" type="date" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;margin-bottom:4px;font-weight:600">Kategorie</div>
          <select id="mhd-kat" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
            <option value="">— wählen —</option>
            <option>Fleisch/Fisch</option><option>Milchprodukte</option><option>Gemüse/Obst</option>
            <option>Tiefkühl</option><option>Trockenwaren</option><option>Saucen/Dips</option><option>Sonstiges</option>
          </select>
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;margin-bottom:4px;font-weight:600">Lagerort</div>
          <select id="mhd-ort" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px">
            <option value="">— wählen —</option>
            <option>Kühlschrank 1</option><option>Kühlschrank 2</option><option>Tiefkühler</option>
            <option>Lager trocken</option><option>Theke</option>
          </select>
        </div>
      </div>
      <input id="mhd-menge" type="text" placeholder="Menge / Einheit (z.B. 2 kg)" style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px;margin-bottom:10px">
      <button onclick="mhdSpeichern()" style="background:#8B0000;color:#fff;border:none;border-radius:10px;padding:11px 28px;font-size:15px;font-weight:700;cursor:pointer;width:100%">+ Produkt speichern</button>
    </div>

    <div id="mhd-liste">${rows}</div>
  </div>`;
}

function mhdSpeichern() {
  const name  = (document.getElementById('mhd-name')?.value || '').trim();
  const datum = document.getElementById('mhd-datum')?.value || '';
  if (!name || !datum) { _showToast('Name und Datum sind Pflicht', 'error'); return; }
  let produkte = [];
  try { produkte = JSON.parse(localStorage.getItem('psc_mhd') || '[]'); } catch(e) {}
  produkte.push({
    name, mhd: datum,
    kategorie: document.getElementById('mhd-kat')?.value || '',
    ort:       document.getElementById('mhd-ort')?.value || '',
    menge:     (document.getElementById('mhd-menge')?.value || '').trim(),
    id: Date.now()
  });
  localStorage.setItem('psc_mhd', JSON.stringify(produkte));
  _showToast('Produkt gespeichert', 'success');
  renderMhdTab();
}

function mhdLoeschen(idOrIdx) {
  let produkte = [];
  try { produkte = JSON.parse(localStorage.getItem('psc_mhd') || '[]'); } catch(e) {}
  // Zuerst nach eindeutiger ID löschen (neu), Fallback auf Index (alt)
  const numeric = typeof idOrIdx === 'number' || /^\d+$/.test(String(idOrIdx));
  const byId = numeric ? produkte.filter(p => String(p.id) !== String(idOrIdx)) : null;
  if (byId && byId.length < produkte.length) {
    produkte = byId; // ID-basiertes Löschen erfolgreich
  } else {
    // Fallback: Index-basiertes Löschen (abwärtskompatibel)
    const idx = parseInt(idOrIdx);
    if (!isNaN(idx) && idx >= 0 && idx < produkte.length) produkte.splice(idx, 1);
  }
  localStorage.setItem('psc_mhd', JSON.stringify(produkte));
  renderMhdTab();
}

// ═══════════════════════════════════════════════════════════════
// KASSENSCHNITT — täglicher Soll/Ist Vergleich
// ═══════════════════════════════════════════════════════════════
function renderKassenschnittTab() {
  const panel = document.getElementById('panel-kassenschnitt');
  if (!panel) return;
  let eintraege = [];
  try { eintraege = JSON.parse(localStorage.getItem('psc_kassenschnitt') || '[]'); } catch(e) {}

  const heuteStr = new Date().toISOString().slice(0,10);
  const heuteEintrag = eintraege.find(e => e.datum === heuteStr);

  const histRows = [...eintraege].reverse().slice(0, 30).map(e => {
    const diff = (e.ist - e.soll);
    const diffFmt = (diff >= 0 ? '+' : '') + diff.toFixed(2).replace('.',',') + ' €';
    const diffClr = diff > 0.5 ? '#2e7d32' : diff < -0.5 ? '#c62828' : '#1b5e20';
    const diffBg  = diff > 0.5 ? '#e8f5e9' : diff < -0.5 ? '#ffebee' : '#e8f5e9';
    return `<tr>
      <td style="padding:8px 10px;color:#261816;font-weight:600">${e.datum}</td>
      <td style="padding:8px 10px;text-align:right;color:#261816">${e.soll.toFixed(2).replace('.',',')} €</td>
      <td style="padding:8px 10px;text-align:right;color:#261816">${e.ist.toFixed(2).replace('.',',')} €</td>
      <td style="padding:8px 10px;text-align:right"><span style="background:${diffBg};color:${diffClr};border-radius:6px;padding:2px 8px;font-weight:700;font-size:13px">${diffFmt}</span></td>
      <td style="padding:8px 10px;color:#6b6b6b;font-size:12px">${_esc(e.notiz||'')}</td>
      <td style="padding:8px 10px"><button onclick="kassenschnittLoeschen('${e.datum}')" style="padding:3px 8px;border-radius:6px;border:1px solid #e3beb8;background:#fff;color:#8B0000;font-size:11px;cursor:pointer">✕</button></td>
    </tr>`;
  }).join('');

  const diff30 = eintraege.slice(-30).reduce((s,e) => s + (e.ist - e.soll), 0);
  const diff30Fmt = (diff30 >= 0 ? '+' : '') + diff30.toFixed(2).replace('.',',') + ' €';
  const diff30Clr = diff30 >= 0 ? '#2e7d32' : '#c62828';

  panel.innerHTML = `
  <div style="max-width:700px;margin:0 auto;padding:16px">
    <div style="font-size:22px;font-weight:800;color:#261816;margin-bottom:16px">💵 Kassenschnitt</div>

    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:18px;margin-bottom:18px">
      <div style="font-weight:700;color:#261816;margin-bottom:14px;font-size:15px">
        Heute eintragen — ${heuteStr}
        ${heuteEintrag ? '<span style="margin-left:8px;background:#e8f5e9;color:#2e7d32;border-radius:20px;padding:2px 10px;font-size:12px">✓ bereits eingetragen</span>' : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <div style="font-size:12px;color:#5a403c;margin-bottom:4px;font-weight:600">Soll-Betrag (Umsatz) €</div>
          <input id="kasse-soll" type="number" step="0.01" placeholder="0,00" value="${heuteEintrag ? heuteEintrag.soll : ''}"
            style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:10px;font-size:16px;font-weight:700">
        </div>
        <div>
          <div style="font-size:12px;color:#5a403c;margin-bottom:4px;font-weight:600">Ist-Betrag (gezählt) €</div>
          <input id="kasse-ist" type="number" step="0.01" placeholder="0,00" value="${heuteEintrag ? heuteEintrag.ist : ''}"
            oninput="kassenschnittVorschau()"
            style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:10px;font-size:16px;font-weight:700">
        </div>
      </div>
      <div id="kasse-diff-preview" style="text-align:center;font-size:20px;font-weight:800;margin-bottom:12px;padding:10px;border-radius:10px;background:#f8f8f8">
        ${heuteEintrag ? (() => { const d = heuteEintrag.ist - heuteEintrag.soll; const c = d>=0?'#2e7d32':'#c62828'; return `<span style="color:${c}">${d>=0?'+':''}${d.toFixed(2).replace('.',',')} €</span>`; })() : 'Differenz: —'}
      </div>
      <input id="kasse-notiz" type="text" placeholder="Notiz (z.B. Kartenzahlung separat, Wechselgeld)"
        value="${heuteEintrag ? _esc(heuteEintrag.notiz||'') : ''}"
        style="width:100%;box-sizing:border-box;border:1.5px solid #e3beb8;border-radius:8px;padding:8px 10px;font-size:14px;margin-bottom:12px">
      <button onclick="kassenschnittSpeichern()" style="background:#8B0000;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:15px;font-weight:700;cursor:pointer;width:100%">
        ${heuteEintrag ? 'Heute aktualisieren' : 'Kassenschnitt speichern'}
      </button>
    </div>

    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:16px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-weight:700;color:#261816;font-size:15px">Letzte 30 Einträge</div>
        <div style="font-size:13px">Gesamt-Differenz: <b style="color:${diff30Clr}">${diff30Fmt}</b></div>
      </div>
      ${eintraege.length ? `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#f8f4f4">
          <th style="padding:8px 10px;text-align:left;color:#5a403c">Datum</th>
          <th style="padding:8px 10px;text-align:right;color:#5a403c">Soll</th>
          <th style="padding:8px 10px;text-align:right;color:#5a403c">Ist</th>
          <th style="padding:8px 10px;text-align:right;color:#5a403c">Differenz</th>
          <th style="padding:8px 10px;text-align:left;color:#5a403c">Notiz</th>
          <th style="padding:8px 10px"></th>
        </tr></thead>
        <tbody>${histRows}</tbody>
      </table></div>` : '<div style="text-align:center;padding:30px;color:#6b6b6b;font-size:14px">Noch keine Einträge</div>'}
    </div>
  </div>`;
}

function kassenschnittVorschau() {
  const soll = parseFloat(document.getElementById('kasse-soll')?.value || 0) || 0;
  const ist  = parseFloat(document.getElementById('kasse-ist')?.value  || 0) || 0;
  const prev = document.getElementById('kasse-diff-preview');
  if (!prev) return;
  const diff = ist - soll;
  const clr  = diff > 0.5 ? '#2e7d32' : diff < -0.5 ? '#c62828' : '#1b5e20';
  const bg   = diff > 0.5 ? '#e8f5e9' : diff < -0.5 ? '#ffebee' : '#e8f5e9';
  prev.style.background = bg;
  prev.innerHTML = `<span style="color:${clr}">Differenz: ${diff>=0?'+':''}${diff.toFixed(2).replace('.',',')} €</span>`;
}

function kassenschnittSpeichern() {
  const soll  = parseFloat(document.getElementById('kasse-soll')?.value || '') ;
  const ist   = parseFloat(document.getElementById('kasse-ist')?.value  || '') ;
  if (isNaN(soll) || isNaN(ist)) { _showToast('Soll und Ist-Betrag eingeben', 'error'); return; }
  const notiz = (document.getElementById('kasse-notiz')?.value || '').trim();
  const datum = new Date().toISOString().slice(0,10);
  let eintraege = [];
  try { eintraege = JSON.parse(localStorage.getItem('psc_kassenschnitt') || '[]'); } catch(e) {}
  const idx = eintraege.findIndex(e => e.datum === datum);
  const eintrag = { datum, soll, ist, notiz, ts: Date.now() };
  if (idx >= 0) eintraege[idx] = eintrag;
  else eintraege.push(eintrag);
  localStorage.setItem('psc_kassenschnitt', JSON.stringify(eintraege));
  const _ksDiff = ist - soll;
  const _ksAbsDiff = Math.abs(_ksDiff);
  if (_ksAbsDiff > 20) {
    // Rote Warnung + Notification bei Differenz über €20
    _showToast('⚠️ Große Differenz: ' + (_ksDiff >= 0 ? '+' : '') + _ksDiff.toFixed(2).replace('.',',') + ' €', 'warning');
    if (typeof notifAdd === 'function') {
      notifAdd('kassenschnitt_diff_' + datum,
        '⚠️ Kassenschnitt Differenz ' + datum,
        'Soll: €' + soll.toFixed(2).replace('.',',') + ' — Ist: €' + ist.toFixed(2).replace('.',',') + ' — Differenz: ' + (_ksDiff >= 0 ? '+' : '') + _ksDiff.toFixed(2).replace('.',',') + ' €',
        'warning', 'kassenschnitt');
    }
  } else {
    _showToast('Kassenschnitt gespeichert ✓', 'success');
  }
  renderKassenschnittTab();
}

function kassenschnittLoeschen(datum) {
  let eintraege = [];
  try { eintraege = JSON.parse(localStorage.getItem('psc_kassenschnitt') || '[]'); } catch(e) {}
  eintraege = eintraege.filter(e => e.datum !== datum);
  localStorage.setItem('psc_kassenschnitt', JSON.stringify(eintraege));
  renderKassenschnittTab();
}

function _showToast(msg, type) {
  document.querySelectorAll('._toast-popup').forEach(el => el.remove());
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = '_toast-popup toast-' + (type || 'info');
  t.innerHTML = '<span style="font-size:15px;flex-shrink:0">' + (icons[type] || icons.info) + '</span><span>' + _esc(String(msg)) + '</span>';
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.add('toast-fade-out');
    setTimeout(() => t.remove(), 200);
  }, 2500);
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              _showToast('App-Update verfügbar — Seite neu laden', 'info');
            }
          });
        });
      })
      .catch(err => console.warn('[SW] Registrierung fehlgeschlagen:', err));
  });
}
// SW-Nachrichten empfangen (z.B. Notification-Klick)
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'navigate') {
      switchTab(event.data.tab);
    }
  });
}
