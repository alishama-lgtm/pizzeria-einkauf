# APP-ANALYSE AKTIONSPLAN — Schritt für Schritt
# Erstellt: 2026-04-26 | Zuletzt bearbeitet: 2026-04-26
# REGEL: Ein Punkt nach dem anderen — nichts überspringen, nichts vergessen.

---

## ✅ ERLEDIGT (vor diesem Plan)
- [x] index.html aufgeteilt (22.986 → 574 Zeilen)
- [x] CSS → css/style.css
- [x] JS → js/panels-a/b/c/d.js
- [x] Rollen-Berechtigungen konfigurierbar im Business-Tab
- [x] Lieferando, Wolt, Mjam im Umsatz-Tab

---

## 🔴 SCHRITT 1 — Bug: Dashboard Umsatz falsch (nach Plattform-Update)

**Problem:** Dashboard zeigt `kasse + lieferdienst` — ignoriert Lieferando/Wolt/Mjam
**Datei:** `js/panels-c.js` ~Zeile 453
**Fix:**
```js
// ALT (falsch):
const sum = (e.kasse||0) + (e.lieferdienst||0);
// NEU (richtig — Plattform-aware):
const plattform = (e.lieferando||e.wolt||e.mjam)
  ? (e.lieferando||0)+(e.wolt||0)+(e.mjam||0)
  : (e.lieferdienst||0);
const sum = (e.kasse||0) + plattform;
```
- [ ] **Erledigt?**

---

## 🔴 SCHRITT 2 — Bug: Lager — kein +1 Quick-Button

**Problem:** Es gibt `−1` Button (`lagerAnpassen(id,-1)`) aber KEIN `+1` Button
**Datei:** `js/panels-c.js` ~Zeile 4320–4324
**Fix:** `+1` Button neben dem `−1` Button einfügen:
```js
// vor dem − Button:
html += '<button onclick="lagerAnpassen(' + a.id + ',+1)" ...>+</button>';
```
- [ ] **Erledigt?**

---

## 🟡 SCHRITT 3 — Fix: `psc_role_perms` in SYNC_KEYS eintragen

**Problem:** Rollen-Berechtigungen werden nicht zwischen Geräten synchronisiert
**Datei:** `js/panels-a.js` ~Zeile 259–276 (SYNC_KEYS Array)
**Fix:** `'psc_role_perms'` in das SYNC_KEYS Array eintragen
- [ ] **Erledigt?**

---

## 🟡 SCHRITT 4 — Fix: `pizzeria_theme` → `psc_theme` (Naming-Convention)

**Problem:** Theme-Key heißt `pizzeria_theme` — verletzt `psc_` Naming-Konvention
**Datei:** `js/panels-c.js` Zeilen 2233, 2243, 2387, 2393, 2399, 2405
**Fix:** Alle Vorkommen umbenennen + Migration beim Start:
```js
// Migration: alten Key lesen, in neuen speichern, alten löschen
const oldTheme = localStorage.getItem('pizzeria_theme');
if (oldTheme) {
  localStorage.setItem('psc_theme', oldTheme);
  localStorage.removeItem('pizzeria_theme');
}
```
- [ ] **Erledigt?**

---

## 🟡 SCHRITT 5 — Heute-Tab: MHD-Warnungen einbauen

**Problem:** Abgelaufene/bald fällige Produkte sind im Heute-Tab nicht sichtbar
**Datei:** `js/panels-b.js` — `renderHeuteTab()` Funktion
**Fix:** Am Anfang des Heute-Tabs eine MHD-Warnung-Karte einfügen wenn:
- Produkte mit `diffTage < 0` → "Abgelaufen" 🔴
- Produkte mit `diffTage <= 3` → "Bald fällig" 🟡
**Daten:** aus `localStorage.getItem('psc_mhd')`
- [ ] **Erledigt?**

---

## 🟡 SCHRITT 6 — Mobile: Produkte-Tab Tabelle mit overflow-x:auto

**Problem:** Auf iPhone wird die Produkte-Tabelle abgeschnitten
**Datei:** `js/panels-a.js` oder `js/panels-b.js` — `renderProductsTab()` Funktion
**Fix:** Tabellen-Container mit `overflow-x:auto` wrappen
- [ ] **Erledigt?**

---

## 🟡 SCHRITT 7 — Produkte-Tab: Inline-Edit statt prompt()

**Problem:** `editStock()` benutzt `prompt()` — altmodisch, schlechte UX auf Mobile
**Datei:** `js/panels-a.js` — `editStock()` Funktion (~Zeile 897)
**Fix:** Statt prompt → kleine Inline-Edit-Zeile direkt in der Tabelle (wie beim Lager-Tab)
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 8 — Navigation: Analyse-Gruppe aufteilen (11 Tabs → 2 Gruppen)

**Problem:** Analyse-Gruppe hat 11 Tabs — zu viele, unübersichtlich
**Datei:** `js/panels-b.js` — `NAV_GROUPS` Zeile 1558 ff.
**Jetzt:**
```
Analyse → [Dashboard, Speisekarte, Lieferanten, Geschäfte, Statistik,
           Tagesangebote, Umsatz, Gewinn, Buchhaltung, Konkurrenz, Bewertungen]
```
**Fix — Aufteilen in 2 Gruppen:**
```
Analyse  → [Dashboard, Statistik, Umsatz, Gewinn, Buchhaltung]
Karte    → [Speisekarte, Tagesangebote, Lieferanten, Geschäfte, Konkurrenz, Bewertungen]
```
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 9 — Einkaufsliste: Kategorie-Gruppierung

**Problem:** Alle Artikel flach in einer Liste — bei 30+ Artikel schwer nutzbar
**Datei:** `js/panels-c.js` oder `js/panels-b.js` — `renderEinkaufslisteTab()`
**Fix:** Artikel nach Kategorie gruppieren mit Abschnitt-Überschriften (wie im Lager-Tab)
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 10 — Umsatz: Platform-Vergleich Chart

**Problem:** Kein visueller Vergleich zwischen Kasse, Lieferando, Wolt, Mjam
**Datei:** `js/panels-d.js` — `renderUmsatzTab()`
**Fix:** Chart.js Balkendiagramm mit 4 Balken (Kasse, Lieferando, Wolt, Mjam) für den aktuellen Monat
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 11 — Kassenbuch: Lieferando/Wolt/Mjam Provisionskategorien

**Problem:** Ausgaben-Kategorien haben keine Plattform-Provisionen
**Datei:** `js/panels-d.js` oder `js/panels-a.js` — Kassenbuch Kategorie-Liste
**Fix:** Neue Kategorien hinzufügen:
- "Lieferando Provision"
- "Wolt Provision"
- "Mjam Provision"
Und optional: Auto-Berechnung (30% vom Plattform-Umsatz)
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 12 — Dienstplan: Wochenkopie-Funktion

**Problem:** Jede Woche muss der Dienstplan neu eingegeben werden
**Datei:** `js/panels-c.js` — `renderDienstplanTab()`
**Fix:** Button "Vorwoche kopieren" → kopiert alle Schichten der letzten Woche in die aktuelle Woche
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 13 — Urlaub: Jahres-Kalender-Ansicht

**Problem:** Urlaub wird als Liste angezeigt — kein Überblick über das Jahr
**Datei:** `js/panels-d.js` — `renderUrlaubTab()`
**Fix:** 12-Monats-Kalender-Raster (wie GitHub Contribution Graph) oder Monatsansicht
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 14 — Heute-Tab: Kassenbuch Schnell-Eintrag

**Problem:** Man muss in den Buchhaltung-Tab wechseln um einen Kassenbuch-Eintrag zu machen
**Fix:** Schnell-Eintrag Button direkt im Heute-Tab (Betrag + Typ → sofort in KB)
- [ ] **Erledigt?**

---

## 🔵 SCHRITT 15 — MHD: Lösch-Funktion robuster machen

**Problem:** `mhdLoeschen(idx)` löscht anhand des Array-Index aus dem sortierten Array — könnte falsches Item löschen
**Datei:** `js/panels-d.js` ~Zeile 4257
**Fix:** Löschen nach eindeutiger ID statt Index
- [ ] **Erledigt?**

---

## 📊 FORTSCHRITT

| Schritt | Beschreibung | Status |
|---------|-------------|--------|
| 1 | Dashboard Umsatz-Bug | ✅ |
| 2 | Lager +1 Button | ✅ |
| 3 | psc_role_perms in SYNC_KEYS | ✅ |
| 4 | pizzeria_theme → psc_theme | ✅ |
| 5 | Heute-Tab MHD-Warnungen | ✅ |
| 6 | Mobile overflow-x:auto | ✅ |
| 7 | Produkte Inline-Edit | ✅ |
| 8 | Navigation aufteilen | ✅ |
| 9 | Einkaufsliste Kategorien | ✅ |
| 10 | Umsatz Platform-Chart | ✅ |
| 11 | Kassenbuch Plattform-Kategorien | ✅ |
| 12 | Dienstplan Wochenkopie | ✅ |
| 13 | Urlaub Jahres-Kalender | ✅ |
| 14 | Heute-Tab Kassenbuch Schnell-Eintrag | ✅ |
| 15 | MHD Lösch-Fix | ✅ |

---

## App starten

```powershell
cd "C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell"
.\restart.ps1
# → http://localhost:3000
```

*Dieser Plan wird nach jedem Schritt aktualisiert — ✅ wenn erledigt, ⬜ wenn offen.*
