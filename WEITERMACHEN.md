# Pizzeria San Carino — Weitermachen ab 2026-04-20 (Session 9)

## Arbeitsverzeichnis

```
C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\
```

## Setup auf neuem Laptop

```bash
git clone https://github.com/alishama-lgtm/pizzeria-einkauf
cd pizzeria-einkauf
node server.js        # → http://localhost:8080
```

**Node.js Version: mind. Node 22** erforderlich (`node:sqlite` eingebaut).

---

## Was bisher erledigt wurde ✅

### Session 1
- Saubere Ordnerstruktur: `aktuell/` + `alt/`
- GitHub `main` Branch neu aufgesetzt
- CLAUDE.md + ANLEITUNG/ Dokumentation

### Session 2 (2026-04-14)
- Angebote KW16/KW17 aktualisiert
- Inbox-Ordnersystem mit File-Watcher (`inbox/rechnungen|preise|lieferanten|lager/`)
- App zeigt Badge + Inbox-Sektion im Heute-Tab

### Session 3 (2026-04-15 vormittag)
- N8N Agenten-Hooks, Gemini AI-Agent
- Preishistorie SQLite DB
- Statistik-Tab: Chart + CSV Export ✅
- Tagesangebote-Tab: Marge + Stunden-Countdown ✅
- Geschäfte-Tab: Netto/Brutto Toggle + Mengen-Rechner

### Session 4 (2026-04-15 nachmittag)
- Einkauf loggen Modal (Header-Button)
- server.js Migration: `better-sqlite3` → `node:sqlite`
- Bug fix: `panel-bewertungen` doppelt

### Session 5 (2026-04-17)
- Git-Config: `user.email = alishama@gmx.at`, `user.name = Ali Shama`
- Lesbarkeit komplett gefixt — alle Modi (Normal, Dark, Dark-Red, Business)
- **Aufgabe #9 ✅**: Inbox Lieferanten-Import Button + `_inboxImportLieferanten()`
- **💎 Glass Theme** (Stitch-Design) als 4. Modus eingebaut

### Session 6 (2026-04-18)
- Analyse: alle 31 Panel-IDs OK (je genau 1x), keine doppelten Funktionen, Chart.js destroy OK, jsPDF korrekt
- **Aufgabe #10 ✅**: DB-Banner im Umsatz-Tab — lädt `/api/umsatz/heute` und zeigt heutigen Einkaufsstand
- **Aufgabe #11 ✅**: Server-offline-Banner im Geschäfte-Tab wenn `loadPricesFromDB()` fehlschlägt
- **Aufgabe #12 ✅**: Einkaufsausgaben-Chart (letzte 30 Tage) aus `pizzeria_history` in Statistik-Tab; Fallback Demo-Daten
- **Aufgabe #13 ✅**: Kontrast-Fix alle Themes — Business-Tab "Gewinn pro Pizza" Tabelle + alle 31 Panels
- **Aufgabe #15 ✅**: Preisverlauf-Chart (Shop-Vergleich über Zeit) in Statistik-Tab — Dropdown für Produkt, eine Linie pro Shop (Metro/Billa/Lidl/Spar), async, relative URLs, Chart.js destroy korrekt

---

## Session 8 (2026-04-20) — Was gebaut wurde

- **HACCP-Protokoll Tab** (32. Tab) — Pflichtdokumentation AT
  - Kühlstellentemperaturen (4 Stellen) mit Ampel-System (grün/gelb/rot)
  - Hygiene-Checkliste (6 Punkte)
  - Tages-Verlauf + 7-Tage-Tabelle
  - Speichern in `psc_haccp` (localStorage)
- **Glass-Theme Komplett-Fix** — universeller CSS-Override mit `*` statt `div`
  - Alle Hintergründe (weiß, rosa, grün, blau usw.) → glass surface
  - Alle dunklen Textfarben → hell
  - Akzentfarben (grün/gelb/rot/gold) aufgehellt aber sichtbar
  - Inputs/Selects/Textareas in allen Panels → dark mode

## Session 9 (2026-04-20) — Was gebaut wurde

- **MHD-Tracker Tab** (33. Tab) ✅ — Mindesthaltbarkeit-Kontrolle AT
  - Produkte mit Name, MHD-Datum, Kategorie, Lagerort, Menge eintragen
  - Ampel-System: 🔴 abgelaufen, 🟠 heute, 🟡 ≤3 Tage, 🟢 OK
  - Badge-Anzeige mit Anzahl abgelaufen/bald fällig
  - Speichern in `psc_mhd` (localStorage)
  - Zugriff: admin + manager + employee + kitchen
- **Kassenschnitt Tab** (34. Tab) ✅ — täglicher Soll/Ist Vergleich
- **Server-Offline-Modus** ✅ — App funktioniert komplett ohne Server
  - Mitarbeiter hinzufügen/löschen → immer localStorage, Server ist optional
  - Kein Fehler-Toast mehr wenn Server offline
  - **Server-Status-Badge** im Header: grün = Online, orange = Offline
  - Badge wird beim Start + alle 30 Sek. automatisch aktualisiert
  - Soll-Betrag (Umsatz) vs. Ist-Betrag (gezählte Kasse)
  - Live-Vorschau der Differenz (grün/rot)
  - Notiz-Feld (z.B. Kartenzahlung separat)
  - Historie letzte 30 Tage mit Gesamt-Differenz
  - Heute-Eintrag überschreibbar
  - Speichern in `psc_kassenschnitt` (localStorage)
  - Zugriff: admin + manager

- **Urlaubskalender Tab** (35. Tab) ✅ — Urlaub/Krankenstand/Zeitausgleich pro Mitarbeiter
  - Ampel-System: läuft gerade / bald / geplant / abgeschlossen
  - Archiv der vergangenen Einträge
  - Speichern in `psc_urlaub` (localStorage)
- **Trinkgeld-Split Tab** (36. Tab) ✅ — Tägliche Trinkgeld-Aufteilung
  - Gleich aufteilen ODER nach Stunden gewichtet
  - Live-Vorschau der Beträge pro Mitarbeiter
  - Historie letzte 30 Einträge
  - Speichern in `psc_trinkgeld` (localStorage)

## Session 10 (2026-04-20) — Was gebaut wurde

- **UI/UX Komplett-Überarbeitung** ✅ — WCAG 2.1 AA Kontrast, Zugänglichkeit, alle 4 Themes
  - `:focus-visible` Ringe für alle interaktiven Elemente (theme-spezifisch)
  - Globale CSS-Transitions auf Button/Input/Select/Textarea/a
  - Min-Height 36px auf allen Buttons
  - Scrollbar-Styling pro Theme (classic/dark/dark-red/glass)
  - `::selection` Farbe pro Theme
  - Vollständige Dark/Dark-Red Theme-Overrides für alle Komponenten:
    - Header, Nav, Tab-Bar, Mobile-Nav, Footer
    - Cards, Tables, Inputs, Buttons, Badges, Panels
    - Inline-Style-Overrides für Panel-Texte und Hintergründe
  - Print-Styles (Navigation wird ausgeblendet)
- **Cloudflare Tunnel** — Anleitung gegeben, Ali richtet zuhause ein
- **Tägliche Routine** ✅ — Claude Code Remote Agent bei claude.ai/code/routines
- **Theme-Vollständigkeits-Fix** ✅ — Alle 4 Themes systematisch geprüft und repariert
  - Glass: fehlende Hintergründe (#fafafa, #f8f8f8, #fef9c3, #f8dcd8, etc.)
  - Glass: fehlende Textfarben (#1565c0→blau, #f57c00→gelb, #3d1c11→hell, etc.)
  - Glass + Dark: Border-Farben (#e3beb8 etc.) überschrieben
  - Dark/Dark-Red: gleiche Farblücken geschlossen
  - Methode: Bei jedem Theme-Fix → alle 4 Themes gleichzeitig prüfen
- **WCAG 2.1 AA Audit + Fix** ✅ — Top-20 Kontrast-Probleme behoben
  - Glass `--text-3` #6b7280 → #8a95a3 (war 4.3:1, jetzt ≥5:1)
  - ws-table thead th classic: #6b7280 → #4a3c3a (~7:1)
  - Focus-Ringe auf allen interaktiven Elementen
  - Disabled-States (opacity 0.45 + cursor:not-allowed)
  - Placeholder-Farben alle 4 Themes
  - backdrop-filter Fallback für ältere Browser
  - Tabellen-Striping verbessert
  - Branch: `fix/ui-a11y-2026-04-20` → in `main` gemergt

## Session 11 (2026-04-21) — Was gebaut wurde

- **Feature 4: Preisalarm Vollversion** ✅ (nach Prompt B Spec)
  - **Neues Schema:** `pizzeria_preisalarm_rules` + `pizzeria_preisalarm_log`
  - Formular: Produkt + Shop (Alle/Metro/Billa/Lidl/Spar) + Typ (unter/ueber/aend) + Schwelle
  - `preisalarmAdd()` — Regel anlegen mit `{id,produkt,shop,typ,schwelle,aktiv,erstellt}`
  - `preisalarmToggle(id)` — AN/AUS-Toggle pro Regel
  - `preisalarmDelete(id)` — Löschen mit confirm()
  - `checkPreisalarme()` — async: fetch `/api/preisverlauf?limit=200`, Fallback `pizzeria_history`; prüft jede aktive Regel, zeigt Toast + notifAdd() + Log-Eintrag
  - Auto-Check: `setInterval(checkPreisalarme, 30*60*1000)` + Initial-Check beim Tab-Öffnen (nur wenn >5 min seit letztem Check)
  - Tabelle: Produkt | Shop | Typ | Schwelle | Letzter Preis | Diff | Ampel (🟢🟡🔴) | Ein/Aus | 🗑️
  - 🔴-Zeilen: `animation: pulse 1.5s infinite` (Hintergrund rgba(239,68,68,0.12))
  - Verlauf: aufklappbares `<details>` — letzte 20 ausgelöste Alarme
  - `@keyframes pulse` CSS + `.pa-pulse-row` Klasse hinzugefügt
  - Dashboard-Referenz auf neues Schema geupdated

## Session 12 (2026-04-21) — Features 5, 6, 7

- **Feature 5: Lieferantenbestellung** ✅
  - Bestellungs-Sektion am Ende von `renderLieferantenTab()`
  - Lieferant-Select (aus `pizzeria_lieferanten`), Lager-Vorschlag (Artikel ≤ Mindestbestand)
  - Manuelle Positionen: Produkt + Menge + Einheit
  - `bestellAddPos()` / `bestellRemovePos(idx)` / `bestellLagerVorschlag()` / `bestellRenderPos()`
  - `sendBestellungEmail()`: versucht `/api/gmail/draft` → Fallback: `mailto:` mit Bestelltext
  - `renderBestellVerlauf()`: letzte 10 Bestellungen aus `pizzeria_bestellungen`
  - localStorage-Key: `pizzeria_bestellungen` `[{id,datum,lieferant_name,lieferant_email,positionen,status}]`

- **Feature 6: Notion-Sync** ✅
  - `syncAufgabenNotion()`: Aufgaben als to_do-Blöcke → `/api/notion/aufgaben` (upsert: search→update/create)
  - `syncTagesberichtNotion()`: Kassenbuch-Saldo + Fehlmaterial + Aufgaben → `/api/notion/tagesbericht`
  - server.js: `POST /api/notion/aufgaben` — Notion-API direkt via axios (upsert-Logik)
  - server.js: `POST /api/gmail/draft` — 503-Stub (für Gmail-OAuth-Setup)
  - Buttons: "🔄 Nach Notion" in Aufgaben-Tab-Header, "📋 Tagesbericht → Notion" im Heute-Tab

- **Feature 7: OCR-Rechnung** ✅
  - server.js: `POST /api/claude-vision` — Anthropic API via axios, kein neues npm-Package
  - Upload-Tab: Drag & Drop + File-Input (JPG/PNG/WebP, max 10 MB)
  - `ocrRechnung(file)`: FileReader → base64 → `/api/claude-vision` → Vorschau-Tabelle (editierbar, Checkboxen)
  - `importOcrPreise(count)`: POST `/api/preisverlauf` + localStorage `pizzeria_history`
  - Fehlerbehandlung: Datei zu groß / Server offline / API-Key fehlt / JSON-Parse-Fehler

## Neue localStorage-Keys (Session 11-12)
- `pizzeria_preisalarm_rules` — Preisalarm-Regeln `[{id,produkt,shop,typ,schwelle,aktiv,erstellt}]`
- `pizzeria_preisalarm_log` — Alarm-Log `[{id,datum,produkt,shop,typ,schwelle,ist_preis,diff_pct,regel_id}]`
- `pizzeria_bestellungen` — Bestellungen `[{id,datum,lieferant_name,lieferant_email,positionen,status}]`

## Session 13 (2026-04-21) — Was gebaut wurde ✅

- **Phase 1: Setup** ✅
  - `.env` Datei erstellt (`CLAUDE_API_KEY`, `NOTION_API_KEY`, `NOTION_PARENT_PAGE_ID`, `PORT`)
  - `dotenv` installiert, `import 'dotenv/config'` in server.js
  - Notion-Einstellungen: `notion-page-input` Feld + `saveApiKey()` speichert `pizzeria_notion_parent_id`
  - Branch: `feature/session-13-2026-04-21`

- **B1: Kassenbuch** ✅ — in `renderBuchhaltungTab()` (panel: `buchhaltung`)
  - 5 Kacheln: Einnahmen/Ausgaben/Saldo heute + Einnahmen/Ausgaben Monat
  - Formular: Typ, Beschreibung, Netto, MwSt (10%/20%/0%), Auto-Brutto
  - Tabelle: letzte 30 Einträge, Delete-Button
  - CSV Export + PDF Export (jsPDF + autoTable)
  - `kassenbuchAdd()`, `kassenbuchLoeschen()`, `kassenbuchCsvExport()`, `kassenbuchPdfExport()`, `kbMwstUpdate()`
  - localStorage-Key: `pizzeria_kassenbuch [{id,datum,typ,beschreibung,netto,mwst_satz,mwst_betrag,brutto}]`

- **B2: Dashboard-KPIs** ✅
  - Kassenbuch-KPI-Kacheln: Einnahmen/Ausgaben/Saldo heute + Monat-Einnahmen (nur admin/manager)
  - Zeigt sich nur wenn Kassenbuch-Daten vorhanden

- **B3: Dienstplan PDF** ✅
  - `dienstplanPdfExport()`: Querformat, Wochentabelle, alle Mitarbeiter+Schichten
  - "PDF" + "Drucken" Button im Dienstplan-Header

- **Kassenbuch 14-Tage Chart** ✅ — Chart.js Balkendiagramm (Einnahmen/Ausgaben) im Buchhaltung-Tab
- **Quick-Kassenbuch im Heute-Tab** ✅ — Schnell-Eintrag (Typ, Beschreibung, Brutto) + Live-Saldo direkt auf Hauptseite
- **Speisekarte PDF** ✅ — `speisekartePdfExport()` erzeugt druckfertige Speisekarte mit Kategorien, Preisen, Beschreibungen

## Session 14 (2026-04-21) — Was gebaut wurde ✅

- **S14-1: Monatsabschluss PDF** ✅ — `monatsabschlussPdf()` im Buchhaltung-Tab
  - Monatseingabe `<input type='month'>` (Default: aktueller Monat)
  - 5-seitiges PDF: Deckblatt (dunkelrot), Übersicht-Boxen, Einnahmen-Tabelle, Ausgaben-Tabelle, Steuerberater-Hinweis + Unterschriftsfelder
  - MwSt-Aufschlüsselung: 10% Speisen + 20% Sonstiges AT
  - Dateiname: `monatsabschluss_YYYY-MM.pdf`
  - Fehlerfall: Keine Buchungen → Toast-Warnung

- **S14-2: PWA** ✅ — bereits vollständig vorhanden (aus früherer Session)
  - `manifest.json`: name, icons, shortcuts, display standalone
  - `sw.js`: Cache-First (Shell) + Network-First (API)
  - Icons: `icons/icon-72..512.png` + `apple-touch-icon.png`
  - Apple Meta-Tags, theme-color, SW-Registrierung alle in index.html

## Phase 4 Verifikation ✅ (2026-04-21)
- JS Syntax: OK
- Panel-IDs: 36 × einmalig, 0 Duplikate
- Doppelte Funktionen: 0
- .env: vorhanden, nicht committed, .gitignore schützt
- dotenv: `import 'dotenv/config'` in server.js
- Alle neuen Funktionen: je 1× definiert, mehrfach referenziert
- Server-Endpoints: 26 Routes (health, search, preisverlauf, notion, gmail, claude-vision, umsatz, ...)
- Letzter Push: `main` → GitHub aktuell

## Noch offen / Nächste Session
### 🔴 Sofort nötig (Ali manuell)
| # | Aufgabe | Was genau |
|---|---------|-----------|
| A1 | **.env befüllen** | `CLAUDE_API_KEY=sk-ant-...` → OCR aktiv; `NOTION_API_KEY=secret_...` → Notion-Sync aktiv |
| A2 | **Notion Key in App** | Einstellungen ⚙️ → Notion Key + Parent-Page-ID eingeben → Speichern |
| A3 | **Features live testen** | Features 4–7 + Kassenbuch + Quick-KB + Dienstplan-PDF testen |

### 🔴 Session 14 — Neue Features (Prompt A)
| # | Feature | Priorität | Details |
|---|---------|-----------|---------|
| S14-1 | **Monatsabschluss-PDF** | Hoch | 1 Knopf → Steuerberater-Bericht: Kassenbuch + Umsatz + Fixkosten + Gewinn |
| S14-2 | **PWA (Handy-Icon)** | Hoch | manifest.json + Service Worker → App auf Homescreen speichern |

### ✅ Session 14 — Prompt B abgeschlossen
| # | Feature | Status |
|---|---------|--------|
| S14-3 | **WhatsApp-Bestellung** | ✅ Button + wa.me Link in Lieferanten-Tab |
| S14-4 | **Personal-Abrechnung PDF** | ✅ Stunden+Lohn PDF aus Dienstplan |
| S14-5 | **Tagesabschluss-Automation** | ✅ 1 Klick → Modal + PDF + Notion + Verlauf |

### 🟢 Session 14 — Neue Features (Prompt C)
| # | Feature | Priorität | Details |
|---|---------|-----------|---------|
| S14-6 | **Lager CSV-Import** | Nice-to-have | Excel/CSV → Lagerbestand importieren |
| S14-7 | **Rezept-Manager** | Nice-to-have | Rezepte + Zutaten → verknüpft mit Lager |
| S14-9 | **Cloudflare Tunnel** | Nice-to-have | App von überall erreichbar |

### 🟢 Niedrig (zukünftige Sessions)
- **n8n Workflows** installieren und aktivieren
- **Gmail OAuth** für echte Gmail-Drafts (statt mailto: Fallback)
- **Google-Bewertungen** automatisch im Bewertungen-Tab

---

## Themes (4 Stück)

| Theme | Key | Aussehen |
|---|---|---|
| ☀️ Classic | `classic` | Rot & Creme (hell) |
| 🌙 Dark Navy | `dark` | Dunkel & Blau |
| 🔥 Dark Red | `dark-red` | Dunkel & Rot |
| 💎 Glass | `glass` | Stitch / Glassmorphism |

Umschalten: ⚙️ Einstellungen → Design-Stil

---

## Wichtige Dateien

| Datei | Was |
|---|---|
| `index.html` | Haupt-App (~16.000 Zeilen, Vanilla JS SPA) |
| `server.js` | Express + node:sqlite + WebSocket + Inbox-API |
| `server/watcher.js` | File-Watcher für inbox/ Ordner |
| `js/` | config.js, tabs.js, business.js, angebote.js etc. |
| `ANLEITUNG/` | Vollständige Dokumentation |

---

## Technischer Stack

| Bereich | Technologie |
|---|---|
| Frontend | Vanilla JS SPA, Tailwind CDN, Chart.js, jsPDF |
| Backend | Node.js (Express), `node:sqlite` (eingebaut), WebSocket |
| DB | `pizzeria.db` — SQLite lokal (gitignored) |
| AI | Claude API (Anthropic) + Google Gemini (optional) |
| Business-Passwort | ali2024 |

---

## Panel-IDs (alle 31)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`

---

## Inbox-Ordner & Import-Funktionen

| Ordner | Button | Funktion |
|---|---|---|
| `rechnungen` | + Verlauf | `_inboxAddRechnung()` |
| `preise` | Importieren | `_inboxImportPreise()` |
| `lager` | Importieren | `_inboxImportLager()` |
| `lieferanten` | Importieren ✅ | `_inboxImportLieferanten()` |

---

## localStorage Keys

| Key | Was |
|---|---|
| `pizzeria_theme` | Aktives Theme (`classic`/`dark`/`dark-red`/`glass`) |
| `pizzeria_history` | Einkaufs-Verlauf |
| `pizzeria_lieferanten` | Lieferanten-Liste |
| `pizzeria_lager` | Lagerbestand |
| `pizzeria_n8n_enabled` | N8N aktiv (1/0) |
| `pizzeria_n8n_url` | N8N Server URL |
| `pizzeria_ai_provider` | `claude` oder `gemini` |
