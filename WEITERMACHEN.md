# Pizzeria San Carino — MASTER PLAN & SESSION LOG
# Letztes Update: 2026-04-25 | Session 19

---

## 🗄️ DATENBANK — Dual-DB System

| DB | Typ | Status | Inhalt |
|----|-----|--------|--------|
| `pizzeria.db` | SQLite lokal | ✅ Aktiv | Haupt-DB, immer verfügbar |
| Turso Cloud | libSQL remote | ✅ Aktiv | Online-Backup + Sync |

**Turso-Tabellen:** `app_data`, `kassenbuch`, `mitarbeiter`, `dokumente`, `dokumente_data`
**Config:** `TURSO_URL` + `TURSO_TOKEN` in `.env`
**Sync:** Automatisch bei jedem SQLite-Write (Dual-Write Middleware in server.js)

---

## 📊 ALLE 36 PANELS — Status

| Panel | Name | Fertig |
|-------|------|--------|
| produkte | Produkte/Preisliste | ✅ |
| geschaefte | Geschäfte | ✅ |
| kombis | Kombinations-Kalkulation | ✅ |
| angebote | Angebote | ✅ |
| einkaufsliste | Einkaufsliste | ✅ |
| suche | Suche | ✅ |
| upload | Upload (OCR) | ✅ |
| verlauf | Verlauf | ✅ |
| mitarbeiter | Mitarbeiter | ✅ |
| fehlmaterial | Fehlmaterial | ✅ |
| checkliste | Checkliste | ✅ |
| business | Business (geschützt) | ✅ |
| dashboard | Dashboard | ✅ |
| speisekarte | Speisekarte | ✅ |
| lieferanten | Lieferanten | ✅ |
| dienstplan | Dienstplan | ✅ |
| aufgaben | Aufgaben | ✅ |
| schichtcheck | Schichtcheck | ✅ |
| bestellung | Bestellung | ✅ |
| lager | Lager | ✅ |
| wareneinsatz | Wareneinsatz | ✅ |
| preisalarm | Preisalarm | ✅ |
| standardmaterial | Standardmaterial | ✅ |
| statistik | Statistik | ✅ |
| tagesangebote | Tagesangebote | ✅ |
| umsatz | Umsatz | ✅ |
| gewinn | Gewinn | ✅ |
| buchhaltung | Buchhaltung | ✅ |
| konkurrenz | Konkurrenz | ✅ |
| bewertungen | Bewertungen | ✅ |
| heute | Heute | ✅ |
| haccp | HACCP | ✅ |
| mhd | MHD | ✅ |
| kassenschnitt | Kassenschnitt | ✅ |
| urlaub | Urlaub | ✅ |
| trinkgeld | Trinkgeld | ✅ |

**Alle 36 Panels vorhanden und verdrahtet ✅**

---

## 🔧 FEATURES 1–10 — Alle fertig ✅

| # | Feature | Session | Status |
|---|---------|---------|--------|
| 1 | Grundstruktur (36 Panels, Navigation, Login) | 1–5 | ✅ |
| 2 | Kassenbuch + MwSt AT (10%/20%/0%) | 6–8 | ✅ |
| 3 | Fixkosten in Einstellungen | 16 | ✅ |
| 4 | Lieferanten Schnellwahl (Anrufen/WhatsApp) | 16 | ✅ |
| 5 | Passwort ändern | 16 | ✅ |
| 6 | Auto-Backup (täglich, letzte 10) | 16 | ✅ |
| 7 | Personalkosten-Alarm % | 16 | ✅ |
| 8 | Pizza-Größen S/M/L/XL mit Preisen | 16 | ✅ |
| 9 | Mindestbestand-Defaults pro Kategorie | 16 | ✅ |
| 10 | Bondrucker (IP+Port, ESC/POS) | 16 | ✅ |

---

## 🚧 FEATURES 11–15 — Noch offen

| # | Feature | Was genau | Status |
|---|---------|-----------|--------|
| 11 | **Feiertage Österreich** | AT-Feiertage 2025–2028, Schließtage konfigurierbar | ✅ |
| 12 | **Trinkgeld-Regeln** | % pro Abteilung, Trinkgeld-Tab verteilt automatisch | ✅ |
| 13 | **Benachrichtigungs-Filter** | Filter aktiv in notifAdd() — stumme Alarme werden blockiert | ✅ |
| 14 | **App-PIN für Mitarbeiter** | 2-Schritt Login mit PIN-Numpad vollständig vorhanden | ✅ |
| 15 | **Bewertungs-Ziel** | Ziel-Ø + Fortschrittsbalken im Bewertungen-Tab vorhanden | ✅ |

---

## 💰 KASSENBUCH — Befüllung

### Ausgaben (PDF-Import) — Stand 2026-04-25
| Lieferant | Rechnungen | Gesamt | Status |
|-----------|-----------|--------|--------|
| UM Trade (Lebensmittel, 10% MwSt) | 43 PDFs | ~€21.256 | ✅ importiert |
| Edenred (Essensgutscheine, 20% MwSt) | 14 PDFs | ??? | ✅ importiert |
| A1 (Telefon & Internet, 20% MwSt) | 5 PDFs | ??? | ✅ importiert |
| SVS (Sozialversicherung, 0% MwSt) | 1 PDF | ??? | ✅ importiert |
| UM Trade Jänner 2026 | 8 Rechnungen | ~€4.100 | ✅ alle importiert |

### Einnahmen (Z-Bon Import) — Stand 2026-04-25
| Monat | Status |
|-------|--------|
| Juli 2025 | ✅ 1 Z-Bon importiert |
| August 2025 | ⬜ Z-Bon hochladen |
| September 2025 | ⬜ Z-Bon hochladen |
| Oktober 2025 | ⬜ Z-Bon hochladen |
| November 2025 | ⬜ Z-Bon hochladen |
| Dezember 2025 | ⬜ Z-Bon hochladen |
| Jänner 2026 | ⬜ Z-Bon hochladen |
| Februar 2026 | ⬜ Z-Bon hochladen |
| März 2026 | ⬜ Z-Bon hochladen |
| April 2026 | ⬜ Z-Bon hochladen |

**→ Multi-Upload Button vorhanden: Buchhaltung → Z-Bon Import → mehrere PDFs gleichzeitig wählen**

### Fixkosten
| Schritt | Status |
|---------|--------|
| Miete eingeben (Einstellungen) | ⬜ |
| Strom/Gas eingeben | ⬜ |
| Versicherung eingeben | ⬜ |
| Buchhaltung eingeben | ⬜ |
| "Für alle Monate generieren" klicken | ⬜ |

### Lohnkosten
| Schritt | Status |
|---------|--------|
| Lohnzettel PDFs importiert | ✅ (aus E-Mail) |
| März 2026 Kassenbuch-Eintrag | ⬜ manuell nachbuchen |

---

## 🔐 SICHERHEITS-AUDIT

### 🔴 HOCH — sofort beheben

| Problem | Status |
|---------|--------|
| Auth-Middleware: Alle `/api/*` ohne Login erreichbar | ✅ IP-Whitelist localhost/LAN |
| `/db-viewer` öffentlich (zeigt alle Daten) | ✅ Route abgesichert |
| WebSocket ohne Auth | ⬜ Token-Prüfung |
| SQL String-Interpolation in `/api/admin/table/:name` | ✅ Whitelist vorhanden |
| CORS `origin: '*'` | ✅ nur localhost + LAN |

### 🟡 MITTEL

| Problem | Status |
|---------|--------|
| Fehler-Stack-Traces an Client | ✅ Generische Meldung + globaler Handler |
| PDF-Upload ohne MIME-Prüfung | ✅ Magic-Bytes PDF/JPG/PNG geprüft |
| Kein Rate-Limiting | ✅ express-rate-limit (200/15min) |
| 50+ leere `.catch(() => {})` | ✅ Alle loggen jetzt console.error |

### 🟢 NIEDRIG

| Problem | Status |
|---------|--------|
| Kassenbuch: keine Zahlvalidierung | ⬜ |
| Kein Input-Format für Datum | ⬜ YYYY-MM-DD erzwingen |
| HTTPS-Cert-Pfad hardcoded | ⬜ |

---

## 🏗️ ARCHITEKTUR-AUDIT

| Problem | Risiko | Status |
|---------|--------|--------|
| Heisse-Preise lädt synchron (1-2 Min) | App hängt beim Start | ✅ Async im Hintergrund |
| 50+ stille Fehler (leere catch-Blöcke) | Bugs unsichtbar | ✅ Alle loggen jetzt |
| Alle PDFs auf einmal verarbeiten | Server-Crash | ✅ Max 3 parallel + Lock |
| Turso-Sync bei jedem Start | Langsamer Start | ⬜ Nur bei Änderungen |
| Chart.js Memory Leak möglich | Browser langsam | ✅ Alle destroy() vorhanden |
| index.html ~21k Zeilen | Langsames Laden | ⬜ JS-Module auslagern |

---

## 🔌 MCP — Aktive Verbindungen (alle 4 bereit)

| Service | Verbunden | App nutzt es |
|---------|-----------|-------------|
| **Notion** | ✅ aktiv | ⬜ Tagesbericht, Fehlmaterial |
| **Gmail** | ✅ aktiv | ✅ E-Mail-Sync (email-sync.js) |
| **Google Calendar** | ✅ aktiv | ⬜ Dienstplan → Calendar sync |
| **Google Drive** | ✅ aktiv | ⬜ PDF-Backup → Drive |

---

## 📋 SESSION LOG

| Session | Datum | Was gebaut |
|---------|-------|-----------|
| 1–5 | 2026-04 | Grundstruktur, alle Panels, Navigation, Login |
| 6–8 | 2026-04 | Kassenbuch, MwSt AT, E-Mail-Sync |
| 9 | 2026-04-20 | Datenbank-Ordner Import-System (fs.watch) |
| 10–15 | 2026-04 | Mitarbeiter, Dienstplan, HACCP, Lager, Checkliste |
| 16 | 2026-04-22 | Features 3–10 (Fixkosten bis Bondrucker) |
| 17 | 2026-04-23 | PDFs → nur Turso Cloud, 56 PDFs migriert |
| 17b | 2026-04-23 | Buchhaltung PDF-Verwaltung, Monate-Korrektur |
| 17c | 2026-04-23 | Lieferanten-Einkaufsübersicht, UM Trade Analyse |
| 18 | 2026-04-24 | Datum-Extraktion, Kategorien-Header, Sortierung |
| 19 | 2026-04-25 | Port-Fix (restart.ps1), Buchhaltung komplett, Sicherheits-Patches, MwSt-Korrekturen (A1=Telefon, Edenred=Bankomat) |

---

## 🎯 PRIORISIERTE REIHENFOLGE

### 🔴 Sofort
1. ⬜ Z-Bon PDFs hochladen (Aug 2025 – Apr 2026) — du hast sie!
2. ⬜ Fixkosten in Einstellungen eintragen + generieren
3. ✅ Feature #11 — AT-Feiertage (fertig)
4. ✅ Features #12–15 — alle fertig

### 🟡 Nächste Sessions
5. ⬜ Features #12–15
6. ⬜ Sicherheits-Patches (Auth-Middleware, CORS, db-viewer)
7. ⬜ UM Trade Jänner 2026 — E-Mail Backfill
8. ⬜ Stille Fehler beheben (catch-Blöcke)

### 🟢 Stabilisierung
9. ⬜ HANDBUCH.md Sektionen 4–8
10. ⬜ Heisse-Preise async laden
11. ⬜ Rate-Limiting
12. ⬜ Mobile PWA (HTTPS, Service Worker)
13. ⬜ Notion-Sync (Tagesbericht, Fehlmaterial)
14. ⬜ Google Calendar → Dienstplan Sync

### 🔵 Verkaufsvorbereitung (Phase 3)
15. ⬜ Setup-Wizard (Restaurantname, Logo, Adresse)
16. ⬜ White-Label (anpassbare Farben, Logo)
17. ⬜ Installer PowerShell (ein Klick)
18. ⬜ Lizenz-System (Offline-Key, 1 Jahr)
19. ⬜ PDF-Handbuch für Kunden (Deutsch)
20. ⬜ **Mehrsprachigkeit** — Deutsch / Englisch / Niederländisch / Arabisch (i18n System)

---

## App starten

```powershell
.\restart.ps1   # Tötet alte node.exe, startet neu
# → http://localhost:3000
```

## Git

```bash
git add .
git commit -m "YYYY-MM-DD: ..."
git push
```

Repo: `alishama-lgtm/pizzeria-einkauf` → Branch `main`

---

*Dieser Plan wird nach jeder Session aktualisiert. Fertige Punkte: ✅ | Offen: ⬜*
