# Pizzeria San Carino — CLAUDE.md
# Persistenter Projektkontext für jede Claude Code Session

## WICHTIGSTE REGEL
Lies diese Datei vollständig, bevor du irgendetwas tust.
Dann lies `index.html` und `server.js` im aktuellen Verzeichnis.
Erst danach Code schreiben.

---

## Projekt-Identität

- **App:** Single-file HTML Management-App, Pizzeria San Carino (Ali Shama KG), Wien
- **Hauptdatei:** `index.html` (~16.000 Zeilen, Vanilla JS SPA)
- **GitHub:** `alishama-lgtm/pizzeria-einkauf` → Branch: `main`
- **Betrieb:** Windows-PC (Pizzeria) + neuer Laptop (aktuell)
- **Arbeitsverzeichnis:** `C:\Users\Aliishamaa0992\pizzeria-einkauf\` (echtes Verzeichnis — Desktop-Kopie ist veraltet)
- **Philosophie:** Interne Tool-App — kein React, kein Vite, kein MongoDB. Alles bleibt in einer einzigen HTML-Datei. Diese Entscheidung ist final.

---

## Tech Stack (unveränderlich)

| Komponente       | Technologie                                            |
|------------------|--------------------------------------------------------|
| Frontend         | Single-file HTML + Vanilla JS + Tailwind CDN           |
| JS-Module        | `js/tabs.js`, `js/business.js`, `js/einkaufsliste.js`, `js/angebote.js`, `js/upload.js`, `js/fehlmaterial.js`, `js/utils.js`, `js/config.js` |
| CSS              | `css/style.css`                                        |
| Backend          | Express.js + `node:sqlite` (eingebaut, mind. Node 22)  |
| Datenbank        | `pizzeria.db` — SQLite lokal (gitignored)              |
| API-Proxy        | Express.js lokal, Port 8080                            |
| Auth             | Externe `users.js` (Passwörter nie inline)             |
| Anthropic API    | Nur via Proxy — NIE direkt aus dem Browser             |
| Farben           | Warm Red: `#c0392b` / `#e74c3c`                        |
| Sprache/Locale   | Deutsch, Österreich (EUR, Komma als Dezimal)           |
| MwSt             | 10 % Speisen / 20 % Getränke & Sonstiges (AT)          |
| Shops            | Metro, Billa, Lidl, Spar, Etsan, UM Trade              |

---

## Auto-Commit nach jeder Änderung

```bash
git add .
git commit -m "YYYY-MM-DD: [kurze Beschreibung auf Deutsch]"
git push
```

- Datum immer im Format `YYYY-MM-DD`
- Max. 72 Zeichen pro Commit-Nachricht
- Immer pushen — kein lokaler Commit ohne Push
- Syntax prüfen vor jedem Commit:
  ```bash
  node -e "const fs=require('fs'); new Function(fs.readFileSync('index.html','utf8'))"
  ```

---

## Panel-IDs (alle 31 — müssen alle existieren)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute, haccp, mhd, kassenschnitt`

**Gesamt: 34 Panels** (Stand 2026-04-20)

---

## Architektur-Regeln

### Neue Tabs — 8 Pflicht-Änderungen in index.html
(Details: `ANLEITUNG/tabs.md`)
1. `<div id="panel-xxx">` im HTML
2. `NAV_GROUPS` → tabs-Array
3. `ROLE_TABS` → alle Rollen eintragen
4. `switchTab()` → Panel-Toggle-Array
5. `switchTab()` → `if (tab === 'xxx') renderXxxTab();`
6. Desktop Nav → `dd-item` Button
7. Tablet Sidebar → `ts-sub-item` Button
8. Mobile Drawer → `data-drawer-nav` Button

### Kritische Bugs vermeiden
- **TDZ-Bug:** `let`/`const` NIE vor ihrer Deklaration aufrufen
- **Charts (Chart.js):** Immer alte Instanz zerstören: `if(window._chart) window._chart.destroy()`
- **PDF (jsPDF):** Verfügbar als `window.jspdf.jsPDF`
- **localStorage Keys:** Prefix `psc_` (Pizzeria San Carino), Details: `ANLEITUNG/datenspeicherung.md`

### Themes (4 Stück)
| Theme       | Key        | Aussehen                  |
|-------------|------------|---------------------------|
| ☀️ Classic  | `classic`  | Rot & Creme (hell)        |
| 🌙 Dark Navy | `dark`    | Dunkel & Blau             |
| 🔥 Dark Red | `dark-red` | Dunkel & Rot              |
| 💎 Glass    | `glass`    | Stitch / Glassmorphism    |

---

## Datenbank-Ordner Import-System (Session 9 — 2026-04-20)

Dateien in `datenbank/<ordner>/` ablegen → erscheint **automatisch** in der App (via fs.watch + WebSocket).

| Ordner | Aktion |
|--------|--------|
| `datenbank/rechnungen/` | PDF/Bild ablegen → erscheint in Rechnungen-Tab |
| `datenbank/mitarbeiter/` | JSON ablegen → erscheint in Mitarbeiter-Tab |
| `datenbank/lager/` | JSON ablegen → erscheint in Lager-Tab |
| `datenbank/aufgaben/` | JSON ablegen → erscheint in Aufgaben-Tab |
| `datenbank/dienstplan/` | JSON ablegen → erscheint im Dienstplan |
| `datenbank/fehlmaterial/` | JSON ablegen → erscheint in Fehlmaterial |

**Startup-Scan:** Beim Server-Start werden alle JSONs in `datenbank/mitarbeiter/` automatisch eingelesen (auch wenn vor dem Start erstellt).

**JSON-Format:**
- Einzelnes Objekt `{}` → wird zur bestehenden Liste hinzugefügt
- Array `[{}, {}]` → ersetzt die gesamte Liste

**Echte DB:** `C:\Users\Aliishamaa0992\pizzeria-einkauf\pizzeria.db` — NICHT die Desktop-Kopie!

---

## Rechnungs-Automatisierung

| Ali sagt                          | Ordner                  |
|-----------------------------------|-------------------------|
| "neue Rechnung von UM Trade"      | `rechnungen\um-trade\`  |
| "neue Rechnung von Metro"         | `rechnungen\metro\`     |
| "neue Rechnung von Etsan"         | `rechnungen\etsan\`     |
| "neue Rechnung" (ohne Lieferant)  | → nachfragen            |

Neueste Datei = alphabetisch letzter Dateiname im Ordner.
Details: `rechnungen\RECHNUNGEN.md`

---

## Inbox-Ordner & Import-Funktionen

| Ordner       | Button        | Funktion                    |
|--------------|---------------|-----------------------------|
| `rechnungen` | + Verlauf     | `_inboxAddRechnung()`       |
| `preise`     | Importieren   | `_inboxImportPreise()`      |
| `lager`      | Importieren   | `_inboxImportLager()`       |
| `lieferanten`| Importieren ✅ | `_inboxImportLieferanten()` |

---

## MCP — Was du wissen musst

```
MCP = Model Context Protocol
Zweck: Konnektivität zu externen Tools/APIs/Datenbanken
Format: Server/Client-Protokoll (stdio lokal oder HTTP remote)
Antwort auf: "WAS kann der Agent tun?"

Agent Skills = prozedurales Wissen
Zweck: Wiederkehrende Workflows, Tonalität, Konventionen
Format: Ordner mit SKILL.md
Antwort auf: "WIE macht er es richtig?"

Beides zusammen: MCP liefert Daten, Skills definieren den Prozess.
```

### Aktive MCP-Verbindungen
- Notion MCP → `mcp.notion.com/mcp`
- Gmail MCP → `gmailmcp.googleapis.com/mcp/v1`
- Google Calendar MCP → `calendarmcp.googleapis.com/mcp/v1`
- Google Drive MCP → `drivemcp.googleapis.com/mcp/v1`

### Geplante lokale MCP-Server (Claude Code)
```json
{
  "mcpServers": {
    "pizzeria-preise": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "./data/preise.db"]
    }
  }
}
```

### Geplante Integrationen
- **n8n:** Workflow-Automation — Tagesberichte, OCR-zu-Preisdatenbank, Notion-Webhooks.
  WICHTIG: n8n ist KEIN MCP-Server. n8n empfängt Webhooks und führt Workflows aus.

---

## Agent Skills — Kontext

Skills liegen unter `.claude/skills/<name>/SKILL.md`

### Geplante Skills
| Skill-Name                | Trigger / Zweck                                    |
|---------------------------|----------------------------------------------------|
| `processing-receipts`     | OCR-Rechnung → strukturierte Preisdaten            |
| `managing-fehlmaterial`   | Fehlmaterial erfassen + Notion exportieren         |
| `calculating-einkauf`     | Händlervergleich, beste Kombination berechnen      |
| `generating-daily-report` | Tagesbericht für n8n/Notion generieren             |
| `managing-kassenbuch`     | Einnahmen/Ausgaben validieren, MwSt-Splitting AT   |

### SKILL.md Mindest-Struktur
```markdown
---
name: skill-name
description: Dritte Person, WAS + WANN nutzen. Max 1024 Zeichen.
---
# Skill Name
## Workflow
Schritt-für-Schritt
## Regeln
Grenzen, Pflichtfelder, Fehlerbehandlung
```

---

## Subagents (Claude Code)

Subagent-Dateien liegen unter `.claude/agents/<name>.md`

### Beispiel: preisdatenbank-reviewer
```yaml
---
name: preisdatenbank-reviewer
description: MUST BE USED bei Änderungen an der Preisdatenbank-Logik oder
  Händler-Einträgen. Prüft Konsistenz, Dezimalformat, Währung.
tools: Read, Grep, Glob
model: haiku
---
Du bist Experte für österreichische Lebensmittelpreise.
Prüfe bei jeder Preisänderung:
- EUR-Format mit Komma (nicht Punkt)
- Händler-Name exakt aus der definierten Liste
- Kein negativer Preis
- Datum im Format DD.MM.YYYY
```

---

## Hooks (für spätere Implementierung)

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "echo 'Datei geändert: '$CLAUDE_TOOL_INPUT_FILE_PATH"
      }]
    }],
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "echo \"$CLAUDE_TOOL_INPUT\" | grep -qE 'rm -rf|DROP|DELETE FROM' && exit 2 || exit 0"
      }]
    }]
  }
}
```

---

## Code-Konventionen (zwingend einhalten)

- **Kein neues File** ohne explizite Anfrage — alles in der bestehenden HTML
- **Kein Framework** — Vanilla JS, kein npm, kein Build-Step
- **Kommentare auf Deutsch** in der HTML-Datei
- **EUR-Beträge** immer als `parseFloat().toFixed(2)` mit Komma in der Anzeige
- **LocalStorage-Keys** immer mit Prefix `psc_`
- **Tab-IDs** aus der bestehenden Datei ableiten, nie raten
- **Passwörter** nur via `users.js` — nie hardcoded, nie in LocalStorage
- **API-Calls** nur via `http://localhost:8080` (Proxy) — nie direkt zu Anthropic

---

## Prompt Engineering — Interne Regeln

- Vor Code immer: kurze Analyse was bereits existiert
- Bei Unklarheit: nachfragen, nicht raten
- Große Features: erst Plan in Schritten, dann implementieren
- Bei 2 fehlgeschlagenen Korrekturen: `/clear` + neuer Ansatz

---

## Sicherheitsregeln (nicht verhandelbar)

1. `users.js` niemals lesen oder ausgeben
2. `.env` Dateien niemals lesen oder ausgeben
3. Keine `rm -rf` Befehle
4. Keine direkten Datenbankoperationen ohne Bestätigung
5. Anthropic API Key niemals im Frontend-Code

---

## Modell-Empfehlungen

| Aufgabe                       | Modell                                   |
|-------------------------------|------------------------------------------|
| Feature-Entwicklung (komplex) | `claude-sonnet-4-6`                      |
| Einfache Code-Fixes           | `claude-haiku-4-5`                       |
| Architektur-Entscheidungen    | `claude-opus-4-7`                        |
| Batch-Tasks / CI              | `claude-sonnet-4-6` + Batch API (−50 %) |

---

## Business-Passwort

`ali2024`

---

## Dokumentation

Alle Anleitungen: `ANLEITUNG/` Ordner (README.md, tabs.md, datenspeicherung.md, server.md, charts.md, pdf-export.md, rollen.md, git.md, uebersicht.md)
