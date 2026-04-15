# Pizzeria San Carino — Weitermachen ab 2026-04-15 (Session 3)

## Arbeitsverzeichnis

```
C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\
```

```bash
npm install        # better-sqlite3 (neu!) — einmalig
node server.js     # → http://localhost:8080
```

---

## Was bisher erledigt wurde ✅

### Session 1 (früher)
- Saubere Ordnerstruktur: `aktuell/` + `alt/`
- GitHub `main` Branch neu aufgesetzt
- CLAUDE.md + ANLEITUNG/ Dokumentation

### Session 2 (2026-04-14)
- **Angebote KW16/KW17** — alle Prospekte auf aktuelles Datum, KW17-Vorschau
- **ANLEITUNG/server.md** — vollständige Server-Dokumentation
- **Charts Demo-Daten** — "Demo laden" Button wenn Kassa leer
- **Inbox-Ordnersystem** — `inbox/rechnungen|preise|lieferanten|lager/`
  - File-Watcher in `server/watcher.js`
  - Alle Formate: PDF, JPG, PNG, WEBP, XLSX, XLS, CSV, JSON
  - App zeigt Badge + Inbox-Sektion im Heute-Tab
  - XLSX braucht `npm install` (xlsx Paket hinzugefügt)

### Session 3 (2026-04-15)
- **Aufgabe 5: N8N Agenten-Hooks** eingebaut
  - `n8nHook()` Helper global verfügbar
  - Settings-Modal: Toggle + URL-Feld für N8N-Server
  - Hooks: `fehlmaterial-alert`, `bestellung-done`, `lager-low`
- **Gemini als zweiter AI-Agent** eingebaut
  - Settings: Claude/Gemini Toggle + Gemini API Key Feld
  - Gemini läuft in: Upload-Scan, Handliste, Suche-Tab, Angebote-Tab
  - Gemini nutzt `gemini-2.0-flash` + Google Search Grounding
- **Aufgabe 6: Preishistorie SQLite DB**
  - `better-sqlite3` zu `package.json` hinzugefügt
  - Tabelle `preishistorie` in `pizzeria.db` (auto-erstellt beim Server-Start)
  - API: `GET /api/preisverlauf`, `GET /api/preisverlauf/stats`, `POST /api/preisverlauf`
  - Auto-Speichern beim Rechnung-Scannen (addReceiptItemToInventory)
  - Statistik-Tab: neue Sektion "Einkaufspreise Verlauf" (Min/Avg/Max + letzte 20)

---

## Offene Aufgaben (nächste Schritte)

### Priorität Hoch
| # | Aufgabe | Details |
|---|---|---|
| 7 | **Statistik-Tab** | `renderStatistikTab()` mit echten Daten aus localStorage befüllen (Umsatz-Verlauf, Top-Pizzen) — Zeile ~13689 |
| 8 | **Tagesangebote-Tab** | `renderTagesangeboteTab()` — Heute-Angebote mit Countdown + Marge — Zeile ~13862 |

### Priorität Mittel
| # | Aufgabe |
|---|---|
| 9 | Inbox: Lieferanten-Import fertigstellen (nur Anzeige, kein Import-Button noch) |
| 10 | N8N Workflow 2 (Tages-Report) — `/api/umsatz/heute` Endpunkt in server.js |

---

## Wichtige Dateien

| Datei | Was |
|---|---|
| `index.html` | Haupt-App (~15.000+ Zeilen, Vanilla JS SPA) |
| `js/tabs.js` | Tab-Logik + renderHeuteTab() + renderBewertungenTab() + searchViaGeminiAPI() |
| `js/business.js` | Business-Charts + Lohnabrechnung PDF + Demo-Daten |
| `js/angebote.js` | Angebots-System (KW16/KW17 aktuell) + Gemini Support |
| `js/config.js` | ANTHROPIC_API_KEY + GEMINI_API_KEY + PRODUCTS/SHOPS/PRICE_MAP |
| `server.js` | Express + Preissuche + WebSocket + Inbox-API + SQLite Preishistorie |
| `server/watcher.js` | File-Watcher für inbox/ Ordner |
| `N8N-AGENTEN-WORKFLOWS.md` | Alle 8 geplanten N8N Workflows dokumentiert |
| `ANLEITUNG/` | Vollständige Dokumentation |

---

## Neue localStorage Keys (Session 3)
| Key | Was |
|---|---|
| `pizzeria_n8n_enabled` | N8N aktiv (1/0) |
| `pizzeria_n8n_url` | N8N Server URL |
| `pizzeria_ai_provider` | `claude` oder `gemini` |
| `pizzeria_gemini_key` | Google Gemini API Key |

## SQLite Tabellen (pizzeria.db)
| Tabelle | Felder |
|---|---|
| `preishistorie` | id, produkt_id, produkt, preis, normalpreis, shop, shop_id, datum, quelle |

---

## Panel-IDs (alle 31)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`
