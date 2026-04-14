# Pizzeria San Carino — Claude Code Regeln

## Projektpfad (aktuell)

```
C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\
```

**GitHub:** https://github.com/alishama-lgtm/pizzeria-einkauf (Branch: `main`)

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
- Syntax prüfen vor jedem Commit: `node -e "const fs=require('fs'); new Function(fs.readFileSync('index.html','utf8'))"`

---

## Projekt-Kontext

- **Hauptdatei:** `index.html` (~14.000 Zeilen, Vanilla JS SPA)
- **JS-Dateien:** `js/tabs.js`, `js/business.js`, `js/einkaufsliste.js`, `js/angebote.js`, `js/upload.js`, `js/fehlmaterial.js`, `js/utils.js`, `js/config.js`
- **CSS:** `css/style.css`
- **DB:** `pizzeria.db` — SQLite (gitignored, nur lokal)
- **Shops:** Metro, Billa, Lidl, Spar (Österreich)
- **Business-Passwort:** ali2024
- **Kein React, kein Build-System** — reines Vanilla JS + Tailwind CDN

---

## Architektur-Regeln

- Neue Tabs brauchen **8 Änderungen** in index.html (siehe ANLEITUNG/tabs.md):
  1. `<div id="panel-xxx">` im HTML
  2. `NAV_GROUPS` → tabs-Array
  3. `ROLE_TABS` → alle Rollen eintragen
  4. `switchTab()` → Panel-Toggle-Array
  5. `switchTab()` → `if (tab === 'xxx') renderXxxTab();`
  6. Desktop Nav → `dd-item` Button
  7. Tablet Sidebar → `ts-sub-item` Button
  8. Mobile Drawer → `data-drawer-nav` Button

- **TDZ-Bug vermeiden:** `let`/`const` NIE vor ihrer Deklaration aufrufen
- **Charts (Chart.js):** Immer alte Instanz zerstören: `if(window._chart) window._chart.destroy()`
- **PDF (jsPDF):** Verfügbar als `window.jspdf.jsPDF`
- **localStorage Keys:** Siehe `ANLEITUNG/datenspeicherung.md`

---

## Rechnungs-Automatisierung

| Ali sagt | Ordner |
|---|---|
| "neue Rechnung von UM Trade" | `rechnungen\um-trade\` |
| "neue Rechnung von Metro" | `rechnungen\metro\` |
| "neue Rechnung von Etsan" | `rechnungen\etsan\` |
| "neue Rechnung" (ohne Lieferant) | → fragen welcher Lieferant |

Neueste Datei = alphabetisch letzter Dateiname im Ordner.
Details: `rechnungen\RECHNUNGEN.md`

---

## Panel-IDs (alle müssen existieren)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`

---

## Dokumentation

Alle Anleitungen: `ANLEITUNG/` Ordner  
→ Wird laufend erweitert
