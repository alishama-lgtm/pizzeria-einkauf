# Pizzeria San Carino — Weitermachen ab 2026-04-14 (Session 2)

## Arbeitsverzeichnis

```
C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\
```

```bash
npm install        # xlsx Paket (neu!) — einmalig
node server.js     # → http://localhost:8080
```

---

## Was heute erledigt wurde ✅

### Session 1 (früher)
- Saubere Ordnerstruktur: `aktuell/` + `alt/`
- GitHub `main` Branch neu aufgesetzt
- CLAUDE.md + ANLEITUNG/ Dokumentation

### Session 2 (heute)
- **Angebote KW16/KW17** — alle Prospekte auf aktuelles Datum, KW17-Vorschau
- **ANLEITUNG/server.md** — vollständige Server-Dokumentation
- **Charts Demo-Daten** — "Demo laden" Button wenn Kassa leer
- **Inbox-Ordnersystem** — `inbox/rechnungen|preise|lieferanten|lager/`
  - File-Watcher in `server/watcher.js`
  - Alle Formate: PDF, JPG, PNG, WEBP, XLSX, XLS, CSV, JSON
  - App zeigt Badge + Inbox-Sektion im Heute-Tab
  - XLSX braucht `npm install` (xlsx Paket hinzugefügt)

---

## Offene Aufgaben (nächste Schritte)

### Priorität Hoch
| # | Aufgabe | Details |
|---|---|---|
| 5 | **N8N Agenten einbauen** | `n8nHook()` Helper global in index.html + Settings-Toggle + Hooks in: `fmSubmitForm`, `bestellungToggle`, `lagerSpeichern`. Doku: `N8N-AGENTEN-WORKFLOWS.md` |
| 6 | **Preishistorie DB** | SQLite `pizzeria.db` erweitern: Tabelle `preishistorie` (produkt_id, preis, datum, shop). API-Endpunkt `/api/preisverlauf` in `server.js` |
| 7 | **Statistik-Tab** | `renderStatistikTab()` mit echten Daten aus localStorage befüllen (Umsatz-Verlauf, Top-Pizzen) |
| 8 | **Tagesangebote-Tab** | `renderTagesangeboteTab()` — Heute-Angebote mit Countdown + Marge |

### Priorität Mittel
| # | Aufgabe |
|---|---|
| 9 | Inbox: Lieferanten-Import fertigstellen (nur Anzeige, kein Import-Button noch) |
| 10 | N8N Workflow 2 (Tages-Report) — `/api/umsatz/heute` Endpunkt in server.js |

---

## Wichtige Dateien

| Datei | Was |
|---|---|
| `index.html` | Haupt-App (~14.500+ Zeilen, Vanilla JS SPA) |
| `js/tabs.js` | Tab-Logik + renderHeuteTab() + renderBewertungenTab() |
| `js/business.js` | Business-Charts + Lohnabrechnung PDF + Demo-Daten |
| `js/angebote.js` | Angebots-System (KW16/KW17 aktuell) |
| `server.js` | Express + Preissuche + WebSocket + Inbox-API |
| `server/watcher.js` | File-Watcher für inbox/ Ordner |
| `N8N-AGENTEN-WORKFLOWS.md` | Alle 8 geplanten N8N Workflows dokumentiert |
| `ANLEITUNG/` | Vollständige Dokumentation |

---

## N8N Aufgabe 5 — Wo einbauen

### 1. `n8nHook()` Helper — global in index.html (vor `_showToast`)
```javascript
async function n8nHook(name, data) {
  if (localStorage.getItem('pizzeria_n8n_enabled') !== '1') return;
  const url = localStorage.getItem('pizzeria_n8n_url') || 'http://localhost:5678';
  try {
    await fetch(url + '/webhook/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    });
  } catch(_) {}
}
```

### 2. Settings-Modal — N8N-Sektion hinzufügen
In `openSettings()` → nach dem API-Key Block:
- Toggle "N8N-Workflows aktiv" → `pizzeria_n8n_enabled`
- URL-Feld → `pizzeria_n8n_url` (default: `http://localhost:5678`)

### 3. Hooks einfügen
| Funktion (Zeile) | Hook-Name | Payload |
|---|---|---|
| `fmSubmitForm()` (Zeile ~2816) | `fehlmaterial-alert` | `{artikel, menge, einheit, prioritaet, person, datum}` |
| `bestellungToggle()` (Zeile ~12643) | `bestellung-done` | `{id, artikel, erledigt}` |
| `lagerSpeichern()` (Zeile ~12892) | `lager-low` | `{artikel, menge, mindestmenge}` (nur wenn unter Min.) |

---

## Panel-IDs (alle 31)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`
