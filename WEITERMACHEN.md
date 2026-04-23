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

### Feature 11: AT-Feiertage im Dienstplan (vollständig)

- `AT_FEIERTAGE` auf 2028–2030 erweitert (Ostermontag, Christi Himmelfahrt, Pfingstmontag, Fronleichnam korrekt berechnet)
- Dienstplan-Zellen: gelber Hintergrund (#fffde7) + oranges Label "🎉 Feiertag" wenn Feiertag
- Spalten-Header Feiertage: "Alle Frei" Button → markiert alle Mitarbeiter auf einmal als Frei
- Neue Funktion: `dienstplanAlleFreiSetzen(weekKey, day)`

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
| 11 | **Feiertage Österreich** — AT-Feiertage im Dienstplan automatisch | ✅ 2026–2030, Zellen gelb, "Alle Frei" Button |
| 12 | **Trinkgeld-Regeln** — feste Aufteilung % pro Abteilung | ⬜ |
| 13 | **Benachrichtigungs-Filter** — welche Alarme aktiv/stumm | ⬜ |
| 14 | **App-PIN für Mitarbeiter** — 4-stellige PIN statt Passwort | ⬜ (users.js hat schon PIN-Feld) |
| 15 | **Bewertungs-Ziel** — Ziel-Ø setzen, Fortschritt anzeigen | ⬜ |

---

## Turso Cloud-DB (Option B) — noch offen

Für synchronisierten Stand zwischen Arbeits-PC und Laptop:

```bash
winget install tur.so
turso auth signup
turso db create pizzeria-san-carino
turso db show pizzeria-san-carino   # → URL + Token
```

Dann in `.env`:
```
TURSO_URL=libsql://...turso.io
TURSO_TOKEN=...
```

Und `server.js` von `node:sqlite` auf `@libsql/client` umstellen.

---

## Git

```bash
git add .
git commit -m "YYYY-MM-DD: ..."
git push
```

Repo: `alishama-lgtm/pizzeria-einkauf` → Branch `main`
