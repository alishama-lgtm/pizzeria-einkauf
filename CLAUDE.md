# Pizzeria Einkaufssystem — Claude Code Regeln

## Auto-Commit nach Änderungen

Nach **jeder erfolgreichen Änderung** an `index.html`, den `/js/`-Dateien oder `pizzeria.db`:

```bash
git add index.html js/ css/ pizzeria.db
git commit -m "YYYY-MM-DD: [kurze Beschreibung der Änderung]"
git push
```

- Datum immer im Format `YYYY-MM-DD` (heute: automatisch mit `date`)
- Commit-Nachricht auf Deutsch, max. 72 Zeichen
- Immer pushen — kein lokaler Commit ohne Push

## Projekt-Kontext

- **Datei:** `index.html` — Aktive App-Datei (modular, nutzt /js/ + /css/)
- **ARCHIV:** `pizzaria.html` — alte monolithische Version, NICHT mehr bearbeiten!
- **DB:** `pizzeria.db` — SQLite Preishistorie (via better-sqlite3)
- **Shops:** Metro, Billa, Lidl, Spar (österreichische Geschäfte)
- **Business-Passwort:** ali2024
- **GitHub:** https://github.com/alishama-lgtm/pizzeria-einkauf

## Rechnungs-Automatisierung

Wenn Ali sagt **"neue Rechnung von UM Trade"** → schaue automatisch in `rechnungen\um-trade\`
nach der neuesten PDF Datei (alphabetisch letzter Dateiname = neueste).

Wenn Ali sagt **"neue Rechnung von Metro"** → schaue automatisch in `rechnungen\metro\`
nach der neuesten PDF Datei.

Wenn Ali sagt **"neue Rechnung von Etsan"** → schaue automatisch in `rechnungen\etsan\`
nach der neuesten PDF Datei.

Wenn Ali sagt **"neue Rechnung"** ohne Lieferant → frage welcher Lieferant, dann schaue
im passenden Unterordner nach.

Vollständige Ordnerstruktur: `C:\Users\shama\Claude\Pizzaria\rechnungen\`
Details siehe: `rechnungen\RECHNUNGEN.md`

## Wichtige Regeln

- JavaScript-Variablen mit `let`/`const` NIE inline vor ihrer Deklaration aufrufen (TDZ-Bug!)
- `renderKombisTab()` nur in `DOMContentLoaded` aufrufen, nicht inline
- Alle Panel-IDs müssen existieren: produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business
- Nach Änderungen immer Syntax prüfen: `node -e "new Function(script)"`

## Zwei-Account-Workflow

- **Account 1 (Maschine 1):** Branch `claude/sync-accounts-work-UXv1h`
- **Account 2 (Maschine 2):** `git pull origin main` vor jeder Session
- Stabile Version: Tag `v1.0-stable` → SHA `0f94327`
- Siehe `STATUS.md` für aktuellen Stand und offene Aufgaben
