# Pizzeria San Carino — Weitermachen ab 2026-04-08

## Branch & Datei
- **Branch:** `claude/youthful-elbakyan`
- **Hauptdatei:** `index.html` (~13.900 Zeilen, 29 Tabs)
- **Letzter Commit:** `37abed8` — Phase 4 Konkurrenz-Monitor

---

## Erledigte Arbeiten

### 2026-04-07
- ✅ Schritt 4: Toast-Farben & Bestätigungs-Dialog
- ✅ Phase 1: Gewinn-Dashboard
- ✅ Phase 2: Buchhaltung Tab (PDF-Upload, IndexedDB)
- ✅ Phase 3: Speisekarten-Optimierer (Kalkulation, Ampel, Zutaten)
- ✅ Neuer Tab: Standardmaterial (Stammliste, 5 Kategorien)
- ✅ Sonstige Fixes (PDF-Upload, Gewinn-Nav, Panel-Toggle)

### 2026-04-08
- ✅ Lager-Tab Redesign (kompakte Tabelle, Suche, Bearbeiten, Fortschrittsbalken)
- ✅ Phase 4: Konkurrenz-Monitor (Preisvergleich, Stärken/Schwächen, CRUD)

---

## Was als Nächstes kommt

### Phase 5: Bewertungs-Manager (Erweiterung Dashboard)
### Phase 6: n8n Agenten-Workflows (Dokumentation)
### Verbesserungen Schritt 5: Design-Konsistenz
### Verbesserungen Schritt 6: Code-Qualität

---

## Komplette App-Analyse (Stand 2026-04-08)

### 29 Tabs — Vollständige Funktionsliste

| # | Tab | Gruppe | Funktion |
|---|-----|--------|----------|
| 1 | **Dashboard** | Analyse | Start-Übersicht: Alerts, Checkliste, Aufgaben, Umsatz, Schnellzugriff |
| 2 | **Kombis** | Kombis | Warenkorb-System: Produkte + Shops kombinieren, Preise berechnen |
| 3 | **Angebote** | Einkauf | Aktuelle Angebote der Shops verwalten |
| 4 | **Einkaufsliste** | Einkauf | Einkaufsliste erstellen und abhaken |
| 5 | **Suche** | Einkauf | Produkte über alle Shops suchen |
| 6 | **Upload** | Lager | Fotos/PDFs hochladen (Handliste, Rechnungen) |
| 7 | **Verlauf** | Einkauf | Bestellverlauf und Preishistorie |
| 8 | **Mitarbeiter** | Team | Mitarbeiter-Verwaltung mit Rollen und Kontakt |
| 9 | **Fehlmaterial** | Betrieb | Fehlmaterial melden und tracken |
| 10 | **Checkliste** | Betrieb | Schicht-Checkliste Öffnung & Schließung |
| 11 | **Produkte** | Lager | Produkt-Datenbank mit Preishistorie |
| 12 | **Geschäfte** | Lager | Shop-Verwaltung (Metro, Billa, Lidl, Spar) |
| 13 | **Lieferanten** | Lager | Lieferanten-Datenbank mit Kontakt & Bewertung |
| 14 | **Speisekarte** | Analyse | Komplette Speisekarte + Kalkulation pro Gericht |
| 15 | **Business** | Business | Geschäftsdaten: Kassa, Fixkosten, Personal, Pizzakalkulation |
| 16 | **Dienstplan** | Team | Wochenplan Mo–So, 3 Schichten, 5 Mitarbeiter |
| 17 | **Aufgaben** | Team | Aufgaben pro Mitarbeiter (Priorität, Status, Kategorien) |
| 18 | **Schichtcheck** | Betrieb | Schicht-Übergabe Checkliste |
| 19 | **Bestellung** | Betrieb | Bestellliste (dringend, Kategorie, erledigt) |
| 20 | **Lager** | Lager | Lagerbestand mit Ampel, Suche, Kategorien, Fortschrittsbalken |
| 21 | **Wareneinsatz** | Lager | Wareneinsatz pro Gericht (Zutaten, Marge) |
| 22 | **Preisalarm** | Lager | Preishistorie & Alarm bei Preisänderungen |
| 23 | **Standardmaterial** | Lager | Stammliste aller fixen Materialien (5 Kategorien) |
| 24 | **Statistik** | Analyse | Umsatz-Statistiken: Top 10, Wochenvergleich |
| 25 | **Tagesangebote** | Analyse | Tagesangebote mit Countdown, Rabatt, Marge-Warnung |
| 26 | **Umsatz** | Analyse | Umsatz-Dashboard: Kasse, Lieferdienst, Monatsziel |
| 27 | **Gewinn** | Analyse | Tages-P&L, Break-Even, Margen-Killer |
| 28 | **Buchhaltung** | Analyse | PDF-Upload für Steuerberater (IndexedDB) |
| 29 | **Konkurrenz** | Analyse | Konkurrenz-Monitor: Preisvergleich, Stärken/Schwächen |

### Technologie & Stabilität

| Aspekt | Status |
|--------|--------|
| **Architektur** | Single-File App (index.html, ~13.900 Zeilen) |
| **Framework** | Vanilla JS — keine Abhängigkeiten |
| **Speicherung** | LocalStorage (Hauptdaten) + IndexedDB (PDFs) |
| **Datenbank** | pizzeria.db (SQLite via better-sqlite3 für Preishistorie) |
| **Navigation** | 3 responsive Layouts (Desktop/Tablet/Mobile) |
| **Rollen** | 7 Rollen (admin, manager, kueche, pizza, fahrer, reinigung, service) |
| **Sicherheit** | Passwörter in users.js (gitignored), PIN-Login |
| **Syntax** | Alle 6 Script-Blöcke: ✅ fehlerfrei |
| **Browser** | Getestet in Chrome, sollte in allen modernen Browsern laufen |

### LocalStorage Keys (Datenpersistenz)

| Key | Tab | Inhalt |
|-----|-----|--------|
| `pizzeria_speisekarte` | Speisekarte | Komplette Speisekarte + Kalkulation |
| `pizzeria_lager` | Lager | Lagerbestand aller Artikel |
| `pizzeria_bestellung` | Bestellung | Offene Bestellungen |
| `pizzeria_wareneinsatz` | Wareneinsatz | Wareneinsatz pro Gericht |
| `pizzeria_lieferanten` | Lieferanten | Lieferanten-Stammdaten |
| `sc_standardmaterial` | Standardmaterial | Stammliste Materialien |
| `sc_konkurrenz` | Konkurrenz | Konkurrenten + Preise |
| `pizzeria_checkliste_*` | Checkliste | Tages-Checklisten |
| `pizzeria_aufgaben` | Aufgaben | Mitarbeiter-Aufgaben |
| `pizzeria_dienstplan` | Dienstplan | Wochenplan |
| `biz_*` | Business | Kassa, Fixkosten, Personal etc. |

### Bekannte Einschränkungen

- Keine Echtzeit-Sync (alles lokal im Browser)
- Kein HTTPS / externer Zugriff (bewusst aufgeschoben)
- Kein automatisches Backup der LocalStorage-Daten
- QuickLogin-Buttons noch aktiv (Komfort für Entwicklung)
- Große Datei (~13.900 Zeilen) — könnte in Zukunft aufgeteilt werden

---

## Wichtige Regeln (Checkliste für neuen Tab)
Bei jedem neuen Tab **alle 8 Stellen** ändern:
1. `<div id="panel-xxx">` im HTML
2. `NAV_GROUPS` → tabs-Array
3. `ROLE_TABS` → admin + manager
4. `switchTab()` → Panel-Toggle-Array (forEach-Liste!)
5. `switchTab()` → `if (tab === 'xxx') renderXxxTab();`
6. Desktop Nav → Dropdown `dd-item`
7. Tablet Sidebar → `ts-sub-item`
8. Mobile Drawer → `data-drawer-nav`

## Starten
```bash
cd "C:/Users/shama/Claude/Pizzaria/.claude/San Carino/worktrees/Pizzaria-vs-3"
git pull
# Dann /pizzeria eingeben und sagen: "Lies WEITERMACHEN.md und mach Phase 5"
```
