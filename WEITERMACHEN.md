# Pizzeria San Carino — Weitermachen ab 2026-04-18 (Session 6)

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

---

## Offene Aufgaben

### Priorität Hoch
*(keine aktuell)*

### Priorität Mittel
| # | Aufgabe |
|---|---|
| 13 | POST `/api/umsatz/heute` — Umsatz-Einnahmen auch in DB speichern (momentan nur localStorage) |
| 14 | Preisverlauf-Chart in Statistik: Shop-Vergleich über Zeit (mehrere Datasets) |

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
