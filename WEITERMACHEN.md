# Pizzeria San Carino — Weitermachen

## Arbeitsverzeichnis

```
C:\Users\Aliishamaa0992\pizzeria-einkauf\   ← echter PC
C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\   ← Laptop
```

## App starten

```bash
git pull
node server.js   # → http://localhost:3000
```

**Node.js Version: mind. Node 22** erforderlich.

---

## Session 17 (2026-04-23) — Was gebaut wurde ✅

### PDFs → nur Turso Cloud (kein lokaler Speicher)

- `POST /api/pdf/upload` schreibt **kein** lokales File mehr — nur Turso Cloud
- Neue Turso-Tabellen: `dokumente` (Metadaten) + `dokumente_data` (base64 PDF-Inhalt)
- Download/View-Endpunkte lesen aus Turso; lokale Files als Fallback
- Beim Server-Start: alle 56 vorhandenen lokalen PDFs automatisch zu Turso migriert
- `email-sync.js` läuft weiter — neue E-Mail-PDFs gehen direkt in Turso Cloud
- JSON-Extraktion (`/api/pdf/:id/zu-json`) liest ebenfalls aus Turso
- **Ergebnis:** 56 Rechnungen/Abrechnungen sicher in Turso Cloud, von überall abrufbar

### E-Mail-Sync aktiv (Gmail IMAP)
- Konto: `sancarino50@gmail.com` (App-Passwort aktiv)
- Prüft alle 10 Minuten auf neue PDFs von: UM Trade, A1, Edenred, Lamböck, OGK, BMF, WKO, SVS
- Bereits verarbeitet: Rechnungen Juli–Oktober 2025, Lohnabrechnungen, Dienstverträge

---

## Session 16 (2026-04-22) — Was gebaut wurde ✅

### Einstellungen — Features 3–10 alle fertig

| # | Feature | Details |
|---|---------|---------|
| 3 | **Fixkosten** | Miete/Strom/Versicherung/Buchhaltung/Sonstiges in Einstellungen → Dashboard zeigt Fixkosten-Abzug vom Tagesgewinn |
| 4 | **Lieferanten Schnellwahl** | Mobil-Feld neu, große Anrufen+WhatsApp-Buttons auf jeder Karte, `lfWaUrl()` für AT-Nummern |
| 5 | **Passwort ändern** | In Einstellungen-Modal (⚙️) — `settingsChangePw()` — aktuelles + neues + bestätigen |
| 6 | **Auto-Backup** | Toggle täglich, "Jetzt sichern" → POST /api/backup → backups/ Ordner (letzte 10), "Herunterladen" als JSON |
| 7 | **Personalkosten-Alarm** | Alarm-Grenze % in Einstellungen → rote Warnung im Dashboard wenn überschritten |
| 8 | **Pizza-Größen S/M/L/XL** | VK + Teigkosten pro Größe → Speisekarte-Formular Größen-Dropdown → Preis auto-fill |
| 9 | **Mindestbestand-Defaults** | Standardwerte pro Kategorie → "Auf alle anwenden" setzt bestehende Lagerartikel |
| 10 | **Bondrucker** | IP + Port 9100, Testdruck ESC/POS via server.js TCP, `druckerTest()` + `druckerSendBon()` |

---

## Als nächstes: Features 11–15

| # | Feature | Status |
|---|---------|--------|
| 11 | **Feiertage Österreich** — AT-Feiertage im Dienstplan automatisch | ⬜ (AT_FEIERTAGE Konstante schon vorhanden) |
| 12 | **Trinkgeld-Regeln** — feste Aufteilung % pro Abteilung | ⬜ |
| 13 | **Benachrichtigungs-Filter** — welche Alarme aktiv/stumm | ⬜ |
| 14 | **App-PIN für Mitarbeiter** — 4-stellige PIN statt Passwort | ⬜ (users.js hat schon PIN-Feld) |
| 15 | **Bewertungs-Ziel** — Ziel-Ø setzen, Fortschritt anzeigen | ⬜ |

---

## Turso Cloud-DB ✅ Aktiv

Turso läuft bereits. In `.env` eingetragen: `TURSO_URL` + `TURSO_TOKEN`
Tabellen: `app_data`, `kassenbuch`, `mitarbeiter`, `dokumente`, `dokumente_data`

---

## Git

```bash
git add .
git commit -m "YYYY-MM-DD: ..."
git push
```

Repo: `alishama-lgtm/pizzeria-einkauf` → Branch `main`
