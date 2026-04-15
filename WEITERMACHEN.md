# Pizzeria San Carino — Weitermachen ab 2026-04-15 (Session 4)

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

**Kein `npm install` nötig** — server.js nutzt jetzt `node:sqlite` (eingebaut in Node 22+).
Node.js Version: mind. **Node 22** erforderlich.

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
  - Speichert in `HISTORY[]` (localStorage `pizzeria_history`)
  - Speichert Preise in SQLite via `/api/preisverlauf`
  - Toast-Bestätigung
- **server.js Migration**: `better-sqlite3` → `node:sqlite` (kein Python/npm nötig)
- **DB-Schema Migration**: alte `geschaeft`-Tabelle wird automatisch auf neues Schema migriert
- **Bug fix**: `panel-bewertungen` war doppelt im HTML — entfernt

---

## Offene Aufgaben

### Priorität Hoch
| # | Aufgabe | Zeile ca. |
|---|---|---|
| 9 | Inbox: Lieferanten-Import — Import-Button fehlt noch | ~11884 |
| 10 | N8N Workflow 2 — `/api/umsatz/heute` Endpunkt testen + N8N-seitig einrichten | server.js |

### Priorität Mittel
| # | Aufgabe |
|---|---|
| 11 | Geschäfte-Tab leer wenn kein Server läuft — Hinweis einbauen "Server starten für Preise" |
| 12 | Statistik-Tab: echte Verlaufsdaten aus `pizzeria_history` statt Demo-Daten |

---

## Wichtige Dateien

| Datei | Was |
|---|---|
| `index.html` | Haupt-App (~15.400 Zeilen, Vanilla JS SPA) |
| `js/config.js` | ANTHROPIC_API_KEY + GEMINI_API_KEY + PRODUCTS/SHOPS/PRICE_MAP + HISTORY |
| `js/tabs.js` | renderHeuteTab, renderBewertungenTab, renderSucheTab, renderShopsTab etc. |
| `js/business.js` | Business-Charts + Lohnabrechnung PDF + Demo-Daten |
| `js/angebote.js` | Angebots-System KW16/KW17 + Gemini Support |
| `server.js` | Express + node:sqlite + WebSocket + Inbox-API + Preishistorie |
| `server/watcher.js` | File-Watcher für inbox/ Ordner |
| `ANLEITUNG/` | Vollständige Dokumentation |

---

## Technischer Stack

- **Frontend:** Vanilla JS SPA, Tailwind CDN, Chart.js, jsPDF
- **Backend:** Node.js (Express), `node:sqlite` (eingebaut), WebSocket
- **DB:** `pizzeria.db` — SQLite lokal (gitignored)
- **AI:** Claude API (Anthropic) + Google Gemini (optional)
- **Shops:** Metro, Billa, Lidl, Spar (Österreich)
- **Business-Passwort:** ali2024

---

## Panel-IDs (alle 31)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`

---

## localStorage Keys

| Key | Was |
|---|---|
| `pizzeria_history` | Einkaufs-Verlauf (HISTORY[]) |
| `pizzeria_n8n_enabled` | N8N aktiv (1/0) |
| `pizzeria_n8n_url` | N8N Server URL |
| `pizzeria_ai_provider` | `claude` oder `gemini` |
| `pizzeria_gemini_key` | Google Gemini API Key |

## SQLite Tabellen (pizzeria.db)

| Tabelle | Felder |
|---|---|
| `preishistorie` | id, produkt_id, produkt, preis, normalpreis, shop, shop_id, datum, quelle |
