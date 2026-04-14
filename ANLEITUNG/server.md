# Server — Dokumentation

**Stand:** 2026-04-14  
**Datei:** `server.js`  
**Port:** `8080`

---

## Starten

```bash
cd "C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell"
node server.js
```

Nach dem Start erscheint:
```
Dieses Gerät:  http://localhost:8080
WLAN (Handy):  http://192.168.x.x:8080
```

→ Im Browser `http://localhost:8080` öffnen — das lädt `index.html` automatisch.

---

## Was der Server macht

Der Server hat **3 Aufgaben:**

| Aufgabe | Was |
|---|---|
| **Statische Dateien** | Liefert `index.html`, `js/`, `css/`, `sw.js` aus |
| **Preissuche API** | Sucht live nach Preisen bei Spar + Heisse-Preise.io |
| **WebSocket Sync** | Synchronisiert `localStorage` zwischen mehreren Geräten (z.B. PC + Handy) |

---

## API-Endpunkte

### `GET /api/health`
Prüft ob Server läuft.  
**Antwort:** `{ ok: true, heissePreise: true/false }`

### `GET /api/search?q=mozzarella`
Sucht nach einem Produkt bei allen Shops.  
**Parameter:** `q` = Suchbegriff  
**Antwort:** Array mit Produkten `[{ name, shop, price, originalPrice, unit, ... }]`

**Datenquellen:**
- **Spar** → direkt über die Spar FactFinder API (spar-ics.com)
- **Billa, Hofer, Lidl, Etsan, Penny** → über heisse-preise.io Datenbank

### `GET /api/status`
Zeigt ob Heisse-Preise Daten geladen sind.  
**Antwort:** `{ ready: true/false, loading: true/false, count: 12345, error: null }`

### `GET /api/sync`
Gibt alle gespeicherten Sync-Keys zurück (für Geräte-Sync).

### `GET /api/sync/:key`
Gibt den Wert eines bestimmten Sync-Keys zurück.

---

## Heisse-Preise Cache

Der Server lädt beim ersten Start die Preisdatenbank von `heisse-preise.io` (~200 MB).  
Das dauert **1–2 Minuten**.

- Cache-Datei: `hp-cache.json` (liegt im Projektordner)
- Cache-Gültigkeit: **24 Stunden**
- Wenn Cache vorhanden → sofort geladen (kein Download nötig)
- Spar funktioniert **sofort**, auch während Heisse-Preise noch lädt

```
✅ Spar     → sofort (eigene API)
⏳ Billa    → nach 1–2 Min. (nach HP-Download)
⏳ Hofer    → nach 1–2 Min.
⏳ Lidl     → nach 1–2 Min.
⏳ Etsan    → nach 1–2 Min.
⏳ Penny    → nach 1–2 Min.
```

---

## WebSocket Sync

Der Server ermöglicht Echtzeit-Sync zwischen **mehreren Geräten im selben WLAN**.

- PC öffnet `http://localhost:8080`
- Handy öffnet `http://192.168.x.x:8080` (IP steht in der Konsole beim Start)
- Wenn auf dem PC z.B. eine Einkaufsliste geändert wird → Handy bekommt die Änderung automatisch

**Wie es funktioniert:**
1. Browser verbindet sich beim Laden per WebSocket mit dem Server
2. Änderungen an `localStorage` werden über WebSocket gepusht
3. Server verteilt an alle anderen verbundenen Geräte

---

## Fehler & Lösungen

| Problem | Ursache | Lösung |
|---|---|---|
| `EADDRINUSE: address already in use` | Port 8080 ist belegt | Anderen Prozess beenden: `netstat -ano \| findstr :8080` → `taskkill /PID xxx /F` |
| Heisse-Preise lädt nicht | Keine Internetverbindung | Prüfen ob Internet aktiv ist; alter Cache wird verwendet falls vorhanden |
| WebSocket verbindet nicht | Firewall blockiert Port 8080 | Windows Firewall → Port 8080 freigeben |
| `Cannot find module` | Node-Module fehlen | `npm install` ausführen |
| Spar Suche schlägt fehl | Spar API geändert | `server.js` → Funktion `searchSpar()` prüfen |

---

## Voraussetzungen

```bash
# Node.js prüfen (mind. v18)
node --version

# Pakete installieren (nur einmalig nötig)
npm install

# Benötigte Pakete (aus package.json)
# express, axios, cors, ws
```

---

## Schnell-Referenz

```bash
# Server starten
node server.js

# Server stoppen
Ctrl + C

# Pakete neu installieren
npm install

# Cache löschen (erzwingt neuen Download)
del hp-cache.json
```
