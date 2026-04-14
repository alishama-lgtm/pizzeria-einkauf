# PDF-Export — Wie es funktioniert

---

## 1. Einkaufsliste als PDF

**Wo:** Einkaufsliste-Tab → Button "PDF exportieren"  
**Datei:** `js/einkaufsliste.js` → Funktion `exportEinkaufslistePDF()`

**Was das PDF zeigt:**
- Header: "PIZZERIA SAN CARINO — Einkaufsliste — Datum"
- Artikel gruppiert nach Shop (Metro, Billa, Lidl, Spar, Sonstige)
- Erledigte Artikel: grau mit ✓
- Offene Artikel: schwarz mit □
- Summe pro Shop
- Gesamtsumme unten
- Dateiname: `einkaufsliste_DD-MM-YYYY.pdf`

**Technologie:** jsPDF (CDN) — kein Server nötig, läuft direkt im Browser

---

## 2. Lohnabrechnung als PDF

**Wo:** Business-Tab → Mitarbeiter-Liste → Button "PDF" bei jedem Mitarbeiter  
**Datei:** `js/business.js` → Funktion `exportLohnPDF(ma)`

**Was das PDF zeigt:**
- Header: "Lohnabrechnung — Pizzeria San Carino"
- Aktueller Monat (z.B. "April 2026")
- Mitarbeiter: Name, Rolle
- Tabelle: Stunden/Woche, Stundenlohn, Wochen im Monat (4.33), Bruttogehalt
- Footer: Erstellungsdatum
- Dateiname: `lohnabrechnung_[name]_[monat_jahr].pdf`

**Berechnung:**
```
Bruttogehalt = Stunden/Woche × 4.33 × Stundenlohn
```

---

## CDN Libraries (bereits in index.html eingebunden)

```html
<!-- jsPDF -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<!-- html2canvas (für Screenshots als PDF) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

**Verwendung in Code:**
```javascript
const { jsPDF } = window.jspdf;
const doc = new jsPDF();
doc.setFontSize(16);
doc.text("Text", 20, 30);  // x, y in mm
doc.save("dateiname.pdf");
```

---

## Neues PDF hinzufügen

1. Neue Funktion in der passenden JS-Datei erstellen
2. `const { jsPDF } = window.jspdf;` am Anfang
3. `try/catch` um die ganze Funktion
4. Wenn jsPDF fehlt: `alert('PDF-Export lädt, bitte erneut versuchen')`
5. Button in der render-Funktion einbauen
