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

## Session 11 (2026-04-20) — Was gebaut wurde

- **Kassenbuch Tab (Buchhaltung neu)** ✅ — Einnahmen/Ausgaben mit MwSt AT
  - 5 Stat-Kacheln: Heute Einnahmen/Ausgaben/Saldo + Monat Einnahmen/Ausgaben
  - Formular mit Typ, Kategorie, Betrag, MwSt (10%/20%), Datum, Notiz, Live-MwSt-Berechnung
  - Chart.js Balkendiagramm (letzte 30 Tage, Einnahmen grün / Ausgaben rot)
  - Tabelle letzte 50 Einträge mit Löschen-Button
  - CSV Export + PDF Export (jsPDF)
  - localStorage Key: `pizzeria_kassenbuch`
  - Zugriff: admin + manager
  - Alte Buchhaltung (Dokumenten-Upload) bleibt unverändert erhalten
- **Speisekarte PDF Export** ✅ — `generateSpeisekartePdf()`
  - Deckblatt mit Pizzeria-Name, Datum (dunkelrot)
  - Alle aktiven Gerichte, nach Kategorie gruppiert
  - Kategorie-Balken in Altrosa, Preise rechts in Dunkelrot
  - Beschreibungen in grauer Schrift
  - Fußzeile mit MwSt-Hinweis (AT)
  - Dateiname: `Speisekarte_SanCarino_YYYY-MM-DD.pdf`
  - Branch: `feature/session-2026-04-20` (noch nicht in main gemergt)

## Offene Aufgaben

### Priorität Hoch
- **PR mergen** — `feature/session-2026-04-20` → `main` (Kassenbuch + Speisekarte PDF)
- **Server online** — Cloudflare Tunnel (Ali richtet zuhause ein)
- **36-Tab Testplan** — alle Tabs auf DB-Sync + Themes prüfen

### Priorität Mittel
- **n8n Workflows** installieren und aktivieren

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
