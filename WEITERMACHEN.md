# Pizzeria San Carino — Weitermachen ab 2026-04-17 (Session 5)

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
- ANLEITUNG/server.md vollständige Dokumentation
- Charts: "Demo laden" Button wenn Kassa leer
- Inbox-Ordnersystem mit File-Watcher (`inbox/rechnungen|preise|lieferanten|lager/`)
- App zeigt Badge + Inbox-Sektion im Heute-Tab

### Session 3 (2026-04-15 vormittag)
- N8N Agenten-Hooks (`n8nHook()`, Settings-Modal, Toggle + URL)
- Gemini als zweiter AI-Agent (Upload-Scan, Handliste, Suche, Angebote)
- Preishistorie SQLite DB — API: GET/POST `/api/preisverlauf`, `/api/preisverlauf/stats`
- Statistik-Tab: Chart + CSV Export (Aufgabe 7) ✅
- Tagesangebote-Tab: Marge + Stunden-Countdown (Aufgabe 8) ✅
- Geschäfte-Tab: Netto/Brutto Toggle + Mengen-Rechner (1–20 kg)
- Demo-Preise geleert — PRICE_MAP wird live aus SQLite DB geladen

### Session 4 (2026-04-15 nachmittag)
- **Einkauf loggen Modal** — Header-Button + Shop-Auswahl + Artikel-Zeilen + Gesamtsumme + Speichern
- **server.js Migration**: `better-sqlite3` → `node:sqlite` (kein Python/npm nötig)
- **DB-Schema Migration**: automatisch auf neues Schema
- **Bug fix**: `panel-bewertungen` war doppelt im HTML

### Session 5 (2026-04-17)
- Einkauf-Button immer sichtbar (`display:flex`)
- Git-Config: `user.email = alishama@gmx.at`, `user.name = Ali Shama`
- **Lesbarkeit komplett gefixt** — alle Modi:
  - Normal: `#9ca3af` → `#5a6472`, `#9e9e9e` → `#6b6b6b`, `#aaa` → `#777`
  - Dark + Dark-Red: Overrides für alle neuen Farben + `background:#e9ecef/#e5e7eb/#f9fafb`
  - Business Mode: Overrides auf ALLE Panels erweitert (nicht nur `#panel-business`)
  - Schichtcheck "⚪ Noch nicht": `#374151` auf `#e9ecef` (gut lesbar)
- **Aufgabe #9 ✅**: Inbox Lieferanten-Import Button + `_inboxImportLieferanten()` Funktion

---

## Offene Aufgaben

### Priorität Hoch
| # | Aufgabe | Datei |
|---|---|---|
| 10 | N8N Workflow 2 — `/api/umsatz/heute` Endpunkt testen + N8N-seitig einrichten | server.js |

### Priorität Mittel
| # | Aufgabe |
|---|---|
| 11 | Geschäfte-Tab leer wenn kein Server läuft — Hinweis einbauen |
| 12 | Statistik-Tab: echte Verlaufsdaten aus `pizzeria_history` statt Demo-Daten |

---

## Wichtige Dateien

| Datei | Was |
|---|---|
| `index.html` | Haupt-App (~15.500 Zeilen, Vanilla JS SPA) |
| `js/config.js` | API Keys + PRODUCTS/SHOPS/PRICE_MAP + HISTORY |
| `js/tabs.js` | renderHeuteTab, renderBewertungenTab, renderSucheTab etc. |
| `js/business.js` | Business-Charts + Lohnabrechnung PDF |
| `js/angebote.js` | Angebots-System KW16/KW17 + Gemini |
| `server.js` | Express + node:sqlite + WebSocket + Inbox-API |
| `server/watcher.js` | File-Watcher für inbox/ Ordner |
| `ANLEITUNG/` | Vollständige Dokumentation |

---

## Technischer Stack

| Bereich | Technologie |
|---|---|
| Frontend | Vanilla JS SPA, Tailwind CDN, Chart.js, jsPDF |
| Backend | Node.js (Express), `node:sqlite` (eingebaut), WebSocket |
| DB | `pizzeria.db` — SQLite lokal (gitignored) |
| AI | Claude API (Anthropic) + Google Gemini (optional) |
| Shops | Metro, Billa, Lidl, Spar (Österreich) |
| Business-Passwort | ali2024 |

---

## Panel-IDs (alle 31)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`

---

## localStorage Keys

| Key | Was |
|---|---|
| `pizzeria_history` | Einkaufs-Verlauf (HISTORY[]) |
| `pizzeria_lieferanten` | Lieferanten-Liste |
| `pizzeria_lager` | Lagerbestand |
| `pizzeria_n8n_enabled` | N8N aktiv (1/0) |
| `pizzeria_n8n_url` | N8N Server URL |
| `pizzeria_ai_provider` | `claude` oder `gemini` |
| `pizzeria_gemini_key` | Google Gemini API Key |

## SQLite Tabellen (pizzeria.db)

| Tabelle | Felder |
|---|---|
| `preishistorie` | id, produkt_id, produkt, preis, normalpreis, shop, shop_id, datum, quelle |

---

## Inbox-Ordner & Import-Funktionen

| Ordner | Button | Funktion |
|---|---|---|
| `rechnungen` | + Verlauf | `_inboxAddRechnung()` |
| `preise` | Importieren | `_inboxImportPreise()` |
| `lager` | Importieren | `_inboxImportLager()` |
| `lieferanten` | Importieren ✅ NEU | `_inboxImportLieferanten()` |
