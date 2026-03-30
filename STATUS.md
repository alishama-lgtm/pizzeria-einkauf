# Projektstatus — Pizzeria San Carino

## Letzte Änderung: 2026-03-30

## Aktive Datei: index.html (+ /js/ + /css/)

> ⚠️ `pizzaria.html` = archiviert — NICHT mehr bearbeiten!

---

## Features fertig ✅

- Header + Navigation (Desktop + Mobile)
- Mehr-Dropdown (overflow fix, stopPropagation fix)
- **Produkte-Tab** — Produktverwaltung + Lagerbestand
- **Geschäfte-Tab** — Metro, Billa, Lidl, Spar
- **Kombis-Tab** — Einzel- & Dual-Shop Optimierung
- **Angebote-Tab** — Wochenansicht, Empfehlungen, Deal-Formular
- **Einkaufsliste-Tab** — Einkaufslistengenerierung
- **Suche-Tab** — KI-Suche mit gespeichertem Cache-Verlauf
- **Upload-Tab** — Rechnungs-Upload + PDF-Scanner (UM Trade, Metro, Etsan)
- **Verlauf-Tab** — Import-Log und Preishistorie
- **Mitarbeiter-Tab** — Wochenplan (Tabelle), Stundenlohn/Wochenlohn/Monatslohn
- **Fehlmaterial-Tab** — Fehlende Materialien mit Badge
- **Checkliste-Tab** — Inventur-Checkliste mit Badge
- **Business-Tab** — Admin-Analyse (Passwort: ali2024)
- Live-Preisserver (`server/server.js`, Port 3001) — Metro, Billa, Lidl, Spar
- Login-System mit Rollen (Admin, Mitarbeiter)
- Benachrichtigungs-Badge im Header für Niedrigbestand

---

## Offen / kann verbessert werden 📋

- [ ] Angebote-Tab: wöchentliche Ansicht weiter verfeinern
- [ ] Business-Tab: Charts/Diagramme für Statistiken hinzufügen
- [ ] Einkaufsliste: PDF-Export Funktion
- [ ] Mobile Navigation: aktiver Tab-Highlight verbessern
- [ ] pizzeria.db: mehr Preisverlauf-Daten manuell befüllen
- [ ] Preisserver: automatisches Scraping stabiler machen
- [ ] Mitarbeiter: Monatsabrechnung als PDF exportieren

---

## Zwei-Account-Workflow

| | Account 1 | Account 2 |
|--|-----------|-----------|
| **Branch** | `claude/sync-accounts-work-UXv1h` | `main` direkt oder eigener Branch |
| **Vor jeder Session** | `git pull origin main` | `git pull origin main` |
| **Nach Änderungen** | `git push origin claude/sync-accounts-work-UXv1h` | `git push origin main` |

**Features zusammenführen:**
```bash
git checkout main
git merge claude/sync-accounts-work-UXv1h
git push origin main
```

---

## Stabile Version

- **Tag:** `v1.0-stable`
- **SHA:** `0f94327`
- **Datum:** 2026-03-30
- **Stand:** Fix Mehr-Dropdown overflow + UI-Redesign v1.0

---

## Datei-Struktur

```
pizzeria-einkauf/
├── index.html          ← AKTIVE App-Datei
├── pizzaria.html       ← ARCHIV (nicht bearbeiten)
├── pizzeria.db         ← SQLite Preishistorie
├── CLAUDE.md           ← Regeln für Claude Code
├── STATUS.md           ← Dieser Stand (Handoff)
├── SETUP.md            ← Einrichtung neue Maschine
├── css/
│   └── style.css
├── js/
│   ├── tabs.js         ← Haupt-Tab-Logik (127 KB)
│   ├── angebote.js     ← Angebote (79 KB)
│   ├── business.js     ← Business-Analyse (64 KB)
│   ├── fehlmaterial.js ← Fehlmaterial (58 KB)
│   ├── upload.js       ← Upload + PDF-Scanner (85 KB)
│   ├── einkaufsliste.js← Einkaufsliste (23 KB)
│   ├── utils.js        ← Hilfsfunktionen (13 KB)
│   └── config.js       ← Konfiguration (6.6 KB)
└── server/
    └── server.js       ← Preisserver (Port 3001)
```
