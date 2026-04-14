# Neuen Tab hinzufügen — 8-Schritte-Anleitung

Jedes Mal wenn ein neuer Tab hinzugefügt wird, müssen EXAKT diese 8 Stellen geändert werden.

---

## Beispiel: Tab "muster" hinzufügen

### Schritt 1 — Panel-Div in index.html

Suche die Stelle mit allen `panel-*` Divs (ca. Zeile 1384) und füge hinzu:
```html
<div id="panel-muster" style="display:none"></div>
```

### Schritt 2 — NAV_GROUPS in index.html

Suche `const NAV_GROUPS` (ca. Zeile 6986) und füge den Tab zur passenden Gruppe hinzu:
```javascript
{ id:'betrieb', ..., tabs:['heute','fehlmaterial','checkliste','bestellung','schichtcheck','muster'], ... },
```

### Schritt 3 — ROLE_TABS in index.html

Suche `const ROLE_TABS` (ca. Zeile 10646) und füge 'muster' zu den gewünschten Rollen hinzu:
```javascript
admin:    [..., 'muster'],
manager:  [..., 'muster'],
employee: [..., 'muster'],  // nur wenn Mitarbeiter es sehen sollen
```

### Schritt 4 — switchTab() Panel-Liste in index.html

Suche `switchTab` und die forEach-Liste (ca. Zeile 7057):
```javascript
['produkte','geschaefte',...,'muster'].forEach(t => {
```

### Schritt 5 — switchTab() Render-Call in index.html

Im selben `switchTab()`, nach den anderen render-Calls:
```javascript
if (tab === 'muster') renderMusterTab();
```

### Schritt 6 — Desktop Nav in index.html

Suche den passenden `nav-group` Block und füge einen `dd-item` Button hinzu:
```html
<button data-nav-tab="muster" onclick="switchTab('muster')" class="dd-item">
  <span style="font-size:14px">🔧</span>Muster
</button>
```

### Schritt 7 — Tablet Sidebar in index.html

Suche die passende `ts-group` und füge einen `ts-sub-item` Button hinzu:
```html
<button class="ts-sub-item" data-nav-tab="muster" onclick="switchTab('muster')">
  <span class="ts-sub-icon">🔧</span>Muster
</button>
```

### Schritt 8 — Mobile Drawer in index.html

Suche den passenden `bs-section` Block im `mehr-drawer` und füge hinzu:
```html
<button data-drawer-nav="muster" onclick="switchTab('muster');closeMehrDrawer()" class="bs-btn">
  <span class="bs-icon">🔧</span>Muster
</button>
```

---

## Render-Funktion erstellen

In der passenden JS-Datei (z.B. `js/tabs.js`) am Ende hinzufügen:

```javascript
// ============================================================
// MUSTER-TAB
// ============================================================
function renderMusterTab() {
  const panel = document.getElementById('panel-muster');
  if (!panel) return;

  // Daten aus localStorage laden
  const daten = JSON.parse(localStorage.getItem('pizzeria_muster') || '[]');

  panel.innerHTML = `
    <div style="padding:16px;max-width:900px;margin:0 auto">
      <h2 style="font-size:22px;font-weight:700;color:#8B0000;margin-bottom:16px">
        Muster Tab
      </h2>
      ${daten.length === 0 ? `
        <div style="text-align:center;padding:40px;color:#999">
          Noch keine Daten vorhanden.
          <br><br>
          <button onclick="musterAdd()" style="background:#8B0000;color:white;padding:12px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer">
            Ersten Eintrag erstellen
          </button>
        </div>
      ` : `
        <!-- Daten anzeigen -->
      `}
    </div>
  `;
}
```

---

## Checkliste zum Abhaken

```
□ Schritt 1: <div id="panel-muster"> hinzugefügt
□ Schritt 2: NAV_GROUPS aktualisiert
□ Schritt 3: ROLE_TABS aktualisiert (alle gewünschten Rollen)
□ Schritt 4: switchTab() Panel-Liste erweitert
□ Schritt 5: switchTab() Render-Call hinzugefügt
□ Schritt 6: Desktop Nav Button hinzugefügt
□ Schritt 7: Tablet Sidebar Button hinzugefügt
□ Schritt 8: Mobile Drawer Button hinzugefügt
□ Render-Funktion implementiert
□ Syntax geprüft: node -e "..."
□ git commit + push
```
