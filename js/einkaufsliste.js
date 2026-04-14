// js/einkaufsliste.js — Einkaufsliste
// ═══════════════════════════════════════════════════════════════

const EL_KEY = 'pizzeria_einkaufsliste';

// ═══ STORAGE ═════════════════════════════════════════════════════

function getEinkaufsliste() {
  try { return JSON.parse(localStorage.getItem(EL_KEY) || '[]'); } catch(_) { return []; }
}

function saveEinkaufsliste(list) {
  try { localStorage.setItem(EL_KEY, JSON.stringify(list)); } catch(_) {}
}

// ═══ ACTIONS ═════════════════════════════════════════════════════

function elAddItem(item) {
  const list = getEinkaufsliste();
  // Prevent duplicates by name + shop
  const exists = list.find(i => !i.done && i.name.toLowerCase() === (item.name||'').toLowerCase() && i.shopId === (item.shopId||''));
  if (exists) {
    exists.menge = (parseFloat(exists.menge)||0) + (parseFloat(item.menge)||1);
    saveEinkaufsliste(list);
    return exists.id;
  }
  const newItem = {
    id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    name:      item.name      || '',
    menge:     item.menge     || 1,
    einheit:   item.einheit   || 'Stk',
    preis:     item.preis     || null,
    shop:      item.shop      || '',
    shopId:    item.shopId    || '',
    shopColor: item.shopColor || '#8d6562',
    done:      false,
    source:    item.source    || 'manuell',
    addedAt:   new Date().toISOString().slice(0,10),
  };
  list.push(newItem);
  saveEinkaufsliste(list);
  return newItem.id;
}

function elToggleDone(id) {
  const list = getEinkaufsliste();
  const item = list.find(i => i.id === id);
  if (item) item.done = !item.done;
  saveEinkaufsliste(list);
  renderEinkaufslisteTab();
}

function elDeleteItem(id) {
  saveEinkaufsliste(getEinkaufsliste().filter(i => i.id !== id));
  renderEinkaufslisteTab();
}

function elClearDone() {
  saveEinkaufsliste(getEinkaufsliste().filter(i => !i.done));
  renderEinkaufslisteTab();
}

function elClearAll() {
  if (!confirm('Einkaufsliste komplett leeren?')) return;
  saveEinkaufsliste([]);
  renderEinkaufslisteTab();
}

function elQuickAdd() {
  const nameEl   = document.getElementById('el-name');
  const mengeEl  = document.getElementById('el-menge');
  const einEl    = document.getElementById('el-einheit');
  const preisEl  = document.getElementById('el-preis');
  const shopEl   = document.getElementById('el-shop');

  const name  = nameEl?.value.trim();
  const menge = parseFloat(mengeEl?.value) || 1;
  const einheit = einEl?.value || 'Stk';
  const preis   = parseFloat(preisEl?.value) || null;
  const shopId  = shopEl?.value || '';

  if (!name) { nameEl?.focus(); return; }

  const shopObj = SHOPS.find(s => s.id === shopId);
  elAddItem({
    name, menge, einheit, preis,
    shop:      shopObj ? shopObj.name : '',
    shopId:    shopObj ? shopObj.id   : '',
    shopColor: shopObj ? shopObj.color : '#8d6562',
    source: 'manuell',
  });

  // Reset form
  if (nameEl)  { nameEl.value = '';  nameEl.focus(); }
  if (mengeEl) mengeEl.value = '1';
  if (preisEl) preisEl.value = '';

  renderEinkaufslisteTab();
}

// Called from Fehlmaterial tab
function elVonFehlmaterial(name, menge, einheit) {
  elAddItem({ name, menge, einheit, source: 'fehlmaterial' });
  const el = event && event.target ? event.target.closest('button') : null;
  if (el) {
    el.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Hinzugefügt';
    el.style.background = '#f0fdf4';
    el.style.color = '#2e7d32';
    el.style.borderColor = '#bbf7d0';
    el.disabled = true;
  }
}

// ═══ RENDER ══════════════════════════════════════════════════════

function renderEinkaufslisteTab() {
  const panel = document.getElementById('panel-einkaufsliste');
  if (!panel) return;
  try {
    panel.innerHTML = _buildEinkaufslisteHTML();
  } catch(err) {
    console.error('Einkaufsliste Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a">' + err.message + '</div>';
  }
}

function _buildEinkaufslisteHTML() {
  const list      = getEinkaufsliste();
  const doneCount = list.filter(i => i.done).length;
  const total     = list.length;
  const undone    = list.filter(i => !i.done);
  const totalCost = undone.reduce(function(s,i){ return s + (i.preis && i.menge ? i.preis * i.menge : 0); }, 0);
  const pct       = total > 0 ? Math.round(doneCount / total * 100) : 0;

  var html = '';

  // ── Header ──
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">';
  html += '<div>';
  html += '<h1 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:24px;font-weight:800;color:#261816;margin:0 0 4px">🛒 Einkaufsliste</h1>';
  if (total > 0) {
    html += '<p style="font-size:13px;color:#5a403c;margin:0">' + doneCount + ' von ' + total + ' erledigt';
    if (totalCost > 0.01) html += ' &nbsp;·&nbsp; geschätzt <strong style="color:#610000">' + eur(totalCost) + '</strong>';
    html += '</p>';
  } else {
    html += '<p style="font-size:13px;color:#8d6562;margin:0">Noch keine Artikel</p>';
  }
  html += '</div>';

  // Action-Buttons
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
  if (doneCount > 0) {
    html += '<button onclick="elClearDone()" style="display:flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:#5a403c;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600">';
    html += '<span class="material-symbols-outlined" style="font-size:16px">playlist_remove</span>Erledigte löschen</button>';
  }
  if (total > 0) {
    html += '<button onclick="printEinkaufsliste()" style="display:flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:#5a403c;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600">';
    html += '<span class="material-symbols-outlined" style="font-size:16px">print</span>Drucken</button>';
    html += '<button onclick="elClearAll()" style="display:flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:#93000a;border:1.5px solid #ffdad6;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600">';
    html += '<span class="material-symbols-outlined" style="font-size:16px">delete_sweep</span>Leeren</button>';
  }
  html += '</div>';
  html += '</div>';

  // ── Progress Bar ──
  if (total > 0) {
    var barColor = pct === 100 ? 'linear-gradient(90deg,#2e7d32,#43a047)' : 'linear-gradient(90deg,#610000,#8b0000)';
    html += '<div style="height:8px;background:#f0e8e6;border-radius:8px;margin-bottom:24px;overflow:hidden">';
    html += '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:8px;transition:width .4s ease"></div>';
    html += '</div>';
  }

  // ── Quick-Add Form ──
  html += '<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.05)">';
  html += '<h3 style="font-size:14px;font-weight:800;color:#261816;margin:0 0 14px;display:flex;align-items:center;gap:7px">';
  html += '<span class="material-symbols-outlined" style="font-size:18px;color:#610000">add_shopping_cart</span>Artikel hinzufügen</h3>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:stretch">';

  // Name
  html += '<input id="el-name" type="text" placeholder="Produktname …" autocomplete="off"';
  html += ' onkeydown="if(event.key===\'Enter\')elQuickAdd()"';
  html += ' style="flex:2;min-width:150px;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'">';

  // Menge
  html += '<input id="el-menge" type="number" value="1" min="0.1" step="0.1" placeholder="Menge"';
  html += ' style="width:80px;padding:11px 10px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'">';

  // Einheit
  html += '<select id="el-einheit" style="width:80px;padding:11px 8px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += '<option>Stk</option><option>kg</option><option>Liter</option><option>Dose</option><option>Bund</option><option>Päck.</option><option>Pack</option><option>Sack</option></select>';

  // Preis
  html += '<input id="el-preis" type="number" min="0" step="0.01" placeholder="€ Preis"';
  html += ' style="width:100px;padding:11px 10px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'">';

  // Shop
  html += '<select id="el-shop" style="flex:1;min-width:110px;padding:11px 10px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += '<option value="">Kein Geschäft</option>';
  html += SHOPS.map(function(s){ return '<option value="' + s.id + '">' + s.name + '</option>'; }).join('');
  html += '<option value="hofer">Hofer</option>';
  html += '<option value="penny">Penny</option>';
  html += '</select>';

  // Button
  html += '<button onclick="elQuickAdd()" style="padding:11px 20px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:10px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;white-space:nowrap">';
  html += '<span class="material-symbols-outlined" style="font-size:18px">add</span>Hinzufügen</button>';

  html += '</div>';
  html += '</div>';

  // ── Empty State ──
  if (total === 0) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px dashed #e3beb8">';
    html += '<div style="font-size:72px;line-height:1;margin-bottom:16px">🛒</div>';
    html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:18px;font-weight:700;color:#8d6562;margin:0 0 8px">Liste ist leer</h2>';
    html += '<p style="font-size:14px;color:#8d6562;margin:0 0 24px">Artikel oben hinzufügen oder Angebote merken</p>';
    html += '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">';
    html += '<button onclick="switchTab(\'angebote\')" style="padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:7px">';
    html += '<span class="material-symbols-outlined" style="font-size:18px">local_offer</span>Angebote ansehen</button>';
    html += '<button onclick="switchTab(\'fehlmaterial\')" style="padding:11px 22px;background:#fff;color:#261816;border:1.5px solid #e3beb8;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:7px">';
    html += '<span class="material-symbols-outlined" style="font-size:18px">assignment_late</span>Fehlmaterial</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ── Alle erledigt Banner ──
  if (doneCount === total && total > 0) {
    html += '<div style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:16px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;gap:16px">';
    html += '<span style="font-size:40px">🎉</span>';
    html += '<div><p style="font-size:18px;font-weight:800;color:#fff;margin:0">Alles erledigt!</p>';
    html += '<p style="font-size:13px;color:rgba(255,255,255,.8);margin:4px 0 0">Einkauf abgeschlossen</p></div>';
    html += '</div>';
  }

  // ── Gruppierung nach Geschäft ──
  var groups = {};
  var groupOrder = [];
  for (var gi = 0; gi < list.length; gi++) {
    var it = list[gi];
    var gkey = it.shopId || '__none__';
    if (!groups[gkey]) {
      groups[gkey] = { name: it.shop || '', color: it.shopColor || '#8d6562', items: [] };
      groupOrder.push(gkey);
    }
    groups[gkey].items.push(it);
  }

  for (var oi = 0; oi < groupOrder.length; oi++) {
    var gk    = groupOrder[oi];
    var group = groups[gk];
    var undoneInGroup = group.items.filter(function(i){ return !i.done; }).length;
    var doneInGroup   = group.items.filter(function(i){ return i.done;  }).length;
    var groupCost     = group.items.filter(function(i){ return !i.done; })
                              .reduce(function(s,i){ return s + (i.preis&&i.menge ? i.preis*i.menge : 0); }, 0);
    var allDone       = undoneInGroup === 0 && doneInGroup > 0;

    html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:14px;overflow:hidden">';

    // Group Header
    html += '<div style="padding:14px 20px;background:' + (allDone ? '#f0fdf4' : '#fafafa') + ';border-bottom:1px solid #e8e8ed;display:flex;align-items:center;justify-content:space-between">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    if (group.name) {
      html += '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + group.color + ';flex-shrink:0"></span>';
      html += '<span style="font-size:15px;font-weight:800;color:' + (allDone ? '#2e7d32' : '#261816') + ';font-family:\'Plus Jakarta Sans\',sans-serif">' + escHtml(group.name) + '</span>';
    } else {
      html += '<span class="material-symbols-outlined" style="font-size:16px;color:#8d6562">shopping_bag</span>';
      html += '<span style="font-size:15px;font-weight:800;color:#261816;font-family:\'Plus Jakarta Sans\',sans-serif">Kein Geschäft</span>';
    }
    if (allDone) {
      html += '<span style="font-size:12px;font-weight:700;color:#2e7d32;background:#dcfce7;padding:2px 10px;border-radius:20px">✓ Fertig</span>';
    } else if (undoneInGroup > 0) {
      html += '<span style="font-size:12px;color:#8d6562;font-weight:600">' + undoneInGroup + ' verbleibend</span>';
    }
    html += '</div>';
    if (groupCost > 0.01) {
      html += '<span style="font-size:14px;font-weight:800;color:#610000">ca. ' + eur(groupCost) + '</span>';
    }
    html += '</div>';

    // Items
    html += '<div>';
    for (var ii = 0; ii < group.items.length; ii++) {
      var item    = group.items[ii];
      var safeId  = item.id.replace(/['"\\]/g,'');
      var isDone  = item.done;
      var itemCost = (item.preis && item.menge) ? item.preis * item.menge : 0;
      var isLast  = ii === group.items.length - 1;

      html += '<div style="display:flex;align-items:center;gap:12px;padding:13px 20px;' + (isLast ? '' : 'border-bottom:1px solid #f5f5f5;') + (isDone ? 'opacity:.55;' : '') + '">';

      // Checkbox
      html += '<button onclick="elToggleDone(\'' + safeId + '\')" ';
      html += 'style="width:26px;height:26px;border-radius:8px;border:2px solid ' + (isDone ? '#2e7d32' : '#d0c8c6') + ';';
      html += 'background:' + (isDone ? '#2e7d32' : '#fff') + ';cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s">';
      if (isDone) html += '<span class="material-symbols-outlined" style="font-size:15px;color:#fff">check</span>';
      html += '</button>';

      // Info
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:14px;font-weight:' + (isDone ? '500' : '700') + ';color:#261816;' + (isDone ? 'text-decoration:line-through;' : '') + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(item.name) + '</div>';
      html += '<div style="font-size:12px;color:#8d6562;margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">';
      html += '<span>' + item.menge + ' ' + escHtml(item.einheit) + '</span>';
      if (item.preis) html += '<span>·</span><span>' + eur(item.preis) + '/' + escHtml(item.einheit) + '</span>';
      if (item.source === 'angebot') {
        html += '<span style="background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px">Angebot</span>';
      } else if (item.source === 'fehlmaterial') {
        html += '<span style="background:#fff3e0;color:#e65100;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px">Fehlmaterial</span>';
      }
      html += '</div>';
      html += '</div>';

      // Preis gesamt
      if (itemCost > 0.01 && !isDone) {
        html += '<div style="font-size:14px;font-weight:800;color:#610000;flex-shrink:0">' + eur(itemCost) + '</div>';
      }

      // Delete
      html += '<button onclick="elDeleteItem(\'' + safeId + '\')" ';
      html += 'style="background:none;border:none;cursor:pointer;padding:5px;color:#d0b8b4;flex-shrink:0;line-height:0;border-radius:6px;transition:all .1s" ';
      html += 'onmouseenter="this.style.color=\'#93000a\';this.style.background=\'#fff0ee\'" ';
      html += 'onmouseleave="this.style.color=\'#d0b8b4\';this.style.background=\'none\'">';
      html += '<span class="material-symbols-outlined" style="font-size:18px">delete</span></button>';

      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
  }

  // ── Kosten-Zusammenfassung ──
  if (totalCost > 0.01) {
    html += '<div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:16px;padding:18px 24px;margin-top:8px;display:flex;align-items:center;justify-content:space-between">';
    html += '<div>';
    html += '<div style="font-size:12px;color:rgba(255,255,255,.8);font-weight:600;margin-bottom:4px">Geschätzte Gesamtkosten (' + undone.length + ' Artikel)</div>';
    html += '<div style="font-size:32px;font-weight:900;color:#fff;line-height:1">' + eur(totalCost) + '</div>';
    html += '</div>';
    html += '<span class="material-symbols-outlined" style="font-size:56px;color:rgba(255,255,255,.12)">shopping_cart</span>';
    html += '</div>';
  }

  return html;
}

// ═══ PRINT ═══════════════════════════════════════════════════════

function printEinkaufsliste() {
  var list   = getEinkaufsliste().filter(function(i){ return !i.done; });
  var total  = list.reduce(function(s,i){ return s + (i.preis&&i.menge ? i.preis*i.menge : 0); }, 0);
  var date   = new Date().toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric' });

  // Group by shop
  var groups = {}, order = [];
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    var k  = it.shop || 'Sonstiges';
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(it);
  }

  var html = '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Einkaufsliste</title>';
  html += '<style>';
  html += '*{box-sizing:border-box;margin:0;padding:0}';
  html += 'body{font-family:Arial,sans-serif;padding:24px;max-width:640px;margin:0 auto;color:#1e1e2e}';
  html += 'header{border-bottom:3px solid #610000;padding-bottom:12px;margin-bottom:20px}';
  html += 'h1{font-size:22px;font-weight:bold;color:#610000}';
  html += '.date{font-size:12px;color:#666;margin-top:4px}';
  html += '.shop-header{font-size:14px;font-weight:bold;background:#f0f0f0;padding:8px 12px;border-radius:6px;margin:18px 0 8px;display:flex;align-items:center;gap:8px}';
  html += '.item{display:flex;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid #eee}';
  html += '.cb{width:20px;height:20px;border:2px solid #aaa;border-radius:5px;flex-shrink:0}';
  html += '.item-name{flex:1;font-size:14px}';
  html += '.item-qty{font-size:13px;color:#555;white-space:nowrap}';
  html += '.item-price{font-size:14px;font-weight:bold;color:#610000;white-space:nowrap}';
  html += '.total-box{margin-top:24px;padding:14px 16px;background:#fff0ee;border-radius:8px;border-left:4px solid #610000;display:flex;justify-content:space-between;align-items:center}';
  html += '.total-label{font-size:13px;color:#5a403c}';
  html += '.total-amt{font-size:20px;font-weight:bold;color:#610000}';
  html += 'footer{margin-top:28px;font-size:11px;color:#aaa;text-align:center}';
  html += '@media print{body{padding:12px}button{display:none}}';
  html += '</style></head><body>';

  html += '<header>';
  html += '<h1>🍕 Einkaufsliste</h1>';
  html += '<div class="date">Pizzeria Ali Shama KG &nbsp;·&nbsp; Erstellt am ' + date + '</div>';
  html += '</header>';

  for (var oi = 0; oi < order.length; oi++) {
    var shopName  = order[oi];
    var shopItems = groups[shopName];
    html += '<div class="shop-header">📍 ' + shopName + ' <span style="font-weight:normal;color:#666;font-size:12px">(' + shopItems.length + ' Artikel)</span></div>';
    for (var si = 0; si < shopItems.length; si++) {
      var it2 = shopItems[si];
      html += '<div class="item">';
      html += '<div class="cb"></div>';
      html += '<div class="item-name">' + (it2.name||'') + '</div>';
      html += '<div class="item-qty">' + it2.menge + ' ' + (it2.einheit||'Stk') + '</div>';
      if (it2.preis) html += '<div class="item-price">' + eur(it2.preis) + '</div>';
      html += '</div>';
    }
  }

  if (total > 0.01) {
    html += '<div class="total-box"><div class="total-label">Geschätzte Gesamtkosten (' + list.length + ' Artikel)</div><div class="total-amt">' + eur(total) + '</div></div>';
  }

  html += '<footer>Gedruckt: ' + date + ' &nbsp;·&nbsp; Pizzeria Ali Shama KG &nbsp;·&nbsp; Internes Einkaufssystem</footer>';
  html += '</body></html>';

  var win = window.open('', '_blank', 'width=700,height=900');
  win.document.write(html);
  win.document.close();
  setTimeout(function(){ win.print(); }, 400);
}

// ═══ BADGE ═══════════════════════════════════════════════════════

function elUpdateBadge() {
  var count = getEinkaufsliste().filter(function(i){ return !i.done; }).length;
  var badges = ['el-tab-badge', 'el-mob-badge'];
  for (var i = 0; i < badges.length; i++) {
    var el = document.getElementById(badges[i]);
    if (!el) continue;
    if (count > 0) {
      el.textContent = count;
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  }
}
