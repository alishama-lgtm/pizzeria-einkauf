# Charts — Business-Tab Diagramme

---

## Die 3 Charts im Business-Tab

### Chart 1 — Umsatz letzte 7 Tage (Balkendiagramm)
- **Canvas-ID:** `bizChartUmsatz`
- **Daten aus:** `biz_kassa` (localStorage) → `{date, bar, karte, gesamt}`
- **X-Achse:** Wochentage (Mo, Di, Mi...)
- **Y-Achse:** EUR
- **Farbe:** Dunkelrot (#8B0000)

### Chart 2 — Kostenaufschlüsselung (Kreisdiagramm)
- **Canvas-ID:** `bizChartKosten`
- **Daten aus:** `biz_fixkosten` → {miete, strom, versicherung, buchhaltung, sonstige}
- **Labels:** Miete, Strom, Versicherung, Buchhaltung, Sonstiges
- **Farben:** je Segment eine eigene Farbe

### Chart 3 — Mitarbeiter Stunden/Woche (Horizontales Balkendiagramm)
- **Canvas-ID:** `bizChartPersonal`
- **Daten aus:** `biz_personal` → `{name, rolle, stunden, lohn}`
- **Y-Achse:** Mitarbeiter-Namen
- **X-Achse:** Stunden pro Woche

---

## Wie Charts gerendert werden

**Datei:** `js/business.js` → Funktion `_bizInitCharts()`

```javascript
// Alte Instanz zerstören (wichtig!)
if (window._bizChart_Umsatz) window._bizChart_Umsatz.destroy();

// Neuen Chart erstellen
window._bizChart_Umsatz = new Chart(
  document.getElementById('bizChartUmsatz'),
  { type: 'bar', data: {...}, options: {...} }
);
```

**Wichtig:** Charts werden mit `setTimeout(() => _bizInitCharts(), 80)` verzögert gerendert — damit das DOM bereit ist bevor Chart.js versucht den Canvas zu finden.

---

## Charts werden aufgerufen wenn

1. Business-Tab geöffnet wird → `renderBizCockpit()`
2. Business-Sektion "Cockpit" angeklickt wird → `showBizSection('biz-cockpit')`

---

## Chart.js CDN (bereits in index.html)

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

**Verwendung:**
```javascript
const chart = new Chart(canvasElement, {
  type: 'bar',           // 'bar', 'line', 'doughnut', 'pie', 'radar'
  data: {
    labels: ['Mo', 'Di', 'Mi'],
    datasets: [{ label: 'Umsatz', data: [100, 200, 150], backgroundColor: '#8B0000' }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: true } }
  }
});
```

---

## Neuen Chart hinzufügen

1. Canvas-Element in der render-Funktion einfügen: `<canvas id="meinChart" height="200"></canvas>`
2. In `_bizInitCharts()` eine neue Chart-Instanz hinzufügen
3. Globale Variable: `window._meinChart`
4. Vor Erstellung prüfen: `if (window._meinChart) window._meinChart.destroy()`
