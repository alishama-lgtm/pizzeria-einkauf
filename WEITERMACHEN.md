# Pizzeria San Carino — Weitermachen ab 2026-04-07

## Branch & Datei
- **Branch:** `claude/youthful-elbakyan`
- **Hauptdatei:** `index.html` (~13.500 Zeilen)
- **Letzter Commit:** `7de6f65` — Neuer Tab Standardmaterial

## Was heute erledigt wurde (2026-04-07)

### Schritt 4: Toast-Farben & Bestätigungs-Dialog ✅
- Toasts in Rot/Grün/Orange/Blau mit CSS-Klassen + Animation
- `_markField()` auf CSS-Klasse `.field-error` umgestellt
- Eigener Bestätigungs-Dialog ersetzt alle nativen `confirm()`

### Phase 1: Gewinn-Dashboard ✅ (Tab "Gewinn" unter Analyse)
- Tages-P&L: Einnahmen vs. anteilige Kosten (Fixkosten + Personal + Einkauf)
- Vergleich: gestern, Vorwoche gleicher Tag, Monatsdurchschnitt
- 7-Tage Balkendiagramm (grün = Einnahmen, rot = Kosten)
- Break-Even Fortschrittsbalken
- Top 5 Margen-Killer mit Ampel + Preisvorschlag
- Daten kommen aus Business-Tab (bizGetKassa, bizGetFixkosten, bizGetPersonal, bizGetPizzaCalc)

### Phase 2: Buchhaltung Tab ✅ (Tab "Buchhaltung" unter Analyse)
- PDF-Upload mit Drag & Drop + Kategorie (Lohnzettel/Lohnsteuer/SVA/UVA/Sonstige) + Monat
- IndexedDB für PDF-Speicherung (erstmals in der App)
- Monats-Ordner: Vollständigkeits-Check pro Monat
- Filter nach Typ, Status, Monat
- Status-Workflow: offen → geprüft → gesendet
- Download + Löschen pro Dokument

### Phase 3: Speisekarten-Optimierer ✅ (Erweiterung Speisekarte-Tab)
- Kalkulation pro Gericht: VK-Preis − Wareneinsatz − Personal − Verpackung = Marge
- Ampel-System: 🟢 >65% | 🟡 45–65% | 🔴 <45%
- Live-Vorschau beim Bearbeiten (Marge wird sofort berechnet)
- Zutatenliste pro Gericht (Name, Menge, Kosten)
- Optimierungs-Vorschlag: "Preis um €X erhöhen → 65% Marge"
- Zusammenfassungs-Box: Ø-Marge, kalkulierte Gerichte, Ampel-Verteilung
- Migration: bestehende Gerichte erhalten automatisch leeres `kalk`-Feld

### Neuer Tab: Standardmaterial ✅ (unter Lager & Waren)
- Stammliste aller fixen Materialien (Verpackung, Rohstoffe, Reinigung, Büro, Küche)
- 5 Kategorien mit Farb-Coding und gruppierten Sektionen
- Suche + Kategorie-Filter (Echtzeit)
- CRUD: Neu / Bearbeiten / Löschen mit Bestätigungs-Dialog
- Felder: Name, Kategorie, Einheit, Mindestbestand
- JSON-Export (Download)
- 15 Beispiel-Stammdaten beim ersten Start
- LocalStorage: `sc_standardmaterial`
- Alle 8 Nav-Stellen korrekt eingetragen (Desktop/Tablet/Mobile)

### Sonstige Fixes
- Handliste akzeptiert jetzt auch PDFs
- Gewinn-Tab in alle 3 Nav-Systeme (Desktop/Tablet/Mobile) eingetragen
- Panel-Toggle-Liste in switchTab() gefixt

---

## Was als Nächstes kommt

### Phase 4: Konkurrenz-Monitor (neuer Tab panel-konkurrenz)
### Phase 5: Bewertungs-Manager (Erweiterung Dashboard)
### Phase 6: n8n Agenten-Workflows (Dokumentation)

---

## Wichtige Regeln (Checkliste für neuen Tab)
Bei jedem neuen Tab **alle 8 Stellen** ändern:
1. `<div id="panel-xxx">` im HTML
2. `NAV_GROUPS` → tabs-Array
3. `ROLE_TABS` → admin + manager
4. `switchTab()` → Panel-Toggle-Array (forEach-Liste!)
5. `switchTab()` → `if (tab === 'xxx') renderXxxTab();`
6. Desktop Nav → Analyse-Dropdown `dd-item`
7. Tablet Sidebar → `ts-sub-item`
8. Mobile Drawer → `data-drawer-nav`

## Starten
```bash
cd "C:/Users/shama/Claude/Pizzaria/.claude/San Carino/worktrees/Pizzaria-vs-3"
git pull
# Dann /pizzeria eingeben und sagen: "Lies WEITERMACHEN.md und mach Phase 4"
```
