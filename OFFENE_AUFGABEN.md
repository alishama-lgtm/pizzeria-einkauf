# OFFENE AUFGABEN — Pizzeria San Carino App
# Erstellt: 2026-04-26 | Letztes Update: 2026-04-26
# REGEL: Priorität von oben nach unten — zuerst 🔴 dann 🟡 dann 🔵

---

## 🔴 DRINGEND — Du musst das selbst machen

| # | Aufgabe | Was genau | Status |
|---|---------|-----------|--------|
| 1 | **Anthropic Credits aufladen** | console.anthropic.com/settings/plans → Credits kaufen → Live-Prospekte funktionieren wieder | ⬜ |
| 2 | **Z-Bons hochladen** | Buchhaltung → Z-Bon Import → PDFs von Aug 2025 bis Apr 2026 hochladen | ⬜ |
| 3 | **Fixkosten eintragen** | Einstellungen ⚙️ → Fixkosten → Miete, Strom, Gas, Versicherung, Buchhaltung eintragen → "Für alle Monate generieren" klicken | ⬜ |
| 4 | **Lohnzettel März 2026 nachbuchen** | Buchhaltung → manuell als Ausgabe "Personal" eintragen | ⬜ |
| 5 | **App täglich nutzen** | Jede Schicht: Heute-Tab öffnen, Kassenbuch-Schnelleintrag, Dienstplan prüfen | ⬜ |

---

## 🟡 NÄCHSTE SESSION — Claude macht das

### Bugs & Korrekturen

| # | Aufgabe | Datei / Wo | Status |
|---|---------|-----------|--------|
| 6 | **WebSocket Token-Auth fertigstellen** | server.js — WS-Verbindung prüft noch keinen Token | ⬜ |
| 7 | **Datum-Validierung im Kassenbuch** | Eingabe erzwingt YYYY-MM-DD Format | ⬜ |
| 8 | **HTTPS mkcert einrichten** | Für iPhone PWA nötig — `mkcert localhost` + HTTPS in server.js | ⬜ |
| 9 | **Turso-Sync optimieren** | Nur bei echten Änderungen syncen, nicht beim jedem Start | ⬜ |
| 10 | **Gewinn-Tab: Plattform-Aufschlüsselung** | Lieferando/Wolt/Mjam Provision automatisch abziehen im Gewinn-Tab | ⬜ |
| 11 | **Kassenbuch: Betrag-Validierung im Frontend** | 0–999.999 € erzwingen, keine negativen Werte | ⬜ |

### Features

| # | Aufgabe | Was genau | Status |
|---|---------|-----------|--------|
| 12 | **Notion API Key Verbindung testen** | Einstellungen → Notion Key eintragen → Fehlmaterial-Sync testen | ⬜ |
| 13 | **Google Calendar Sync** | Dienstplan → Schichten automatisch in Google Calendar exportieren | ⬜ |
| 14 | **Google Drive PDF-Backup** | Alle PDFs automatisch in Drive sichern (Buchhaltung → Drive) | ⬜ |
| 15 | **Statistik-Tab: Monat-Vergleich Chart** | Letzter Monat vs. diesen Monat als Balkendiagramm | ⬜ |
| 16 | **Kassenschnitt: Differenz-Alarm** | Wenn Soll/Ist-Differenz > €20 → rote Warnung + Notification | ⬜ |
| 17 | **Mitarbeiter-Tab: Geburtstag-Erinnerung** | Im Heute-Tab anzeigen wenn Mitarbeiter heute Geburtstag hat | ⬜ |
| 18 | **Bestellung-Tab: Auto-Bestellliste** | Wenn Lager unter Minimum → automatisch in Bestellliste eintragen | ⬜ |
| 19 | **Einkaufsliste: QR-Code Teilen** | Liste als QR-Code anzeigen → mit Handy scannen und mitnehmen | ⬜ |
| 20 | **Tagesangebote: Ablauf-Reminder** | Notification wenn Angebot in 1 Tag abläuft | ⬜ |

---

## 🔵 PHASE 2 — Verkaufsvorbereitung (NACH erfolgreicher Testphase)

> **Erst starten wenn App 4 Wochen stabil läuft!**

| # | Aufgabe | Was genau | Status |
|---|---------|-----------|--------|
| 21 | **Installer PowerShell** | `install.ps1` — prüft Node.js, installiert App, erstellt users.js, startet Server, Desktop-Verknüpfung | ⬜ |
| 22 | **Lizenz-System** | Code-Format `REST-2026-XXXX` — beim ersten Start eingeben, lokal gehasht speichern, 30 Tage Demo ohne Code | ⬜ |
| 23 | **PDF-Handbuch DE** | 10–15 Seiten: Installation, Login, alle Tabs, Backup — als druckbares PDF | ⬜ |
| 24 | **Verkaufsstrategie** | Preis festlegen (€500–800 einmalig), Zielgruppe (AT/DE kleine Restaurants), WhatsApp-Support | ⬜ |
| 25 | **Demo-Modus** | App mit Testdaten vorinstalliert — zeigen ohne echte Daten | ⬜ |
| 26 | **Update-System** | `git pull` + `npm install` als Ein-Klick-Button im Business-Tab | ⬜ |

---

## 📊 DATEN — Noch einzutragen (du)

| Was | Wo | Status |
|-----|----|--------|
| Z-Bon August 2025 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon September 2025 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon Oktober 2025 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon November 2025 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon Dezember 2025 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon Jänner 2026 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon Februar 2026 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon März 2026 | Buchhaltung → Z-Bon Import | ⬜ |
| Z-Bon April 2026 | Buchhaltung → Z-Bon Import | ⬜ |
| Miete (monatlich) | Einstellungen → Fixkosten | ⬜ |
| Strom/Gas | Einstellungen → Fixkosten | ⬜ |
| Versicherung | Einstellungen → Fixkosten | ⬜ |
| Buchhaltungskosten | Einstellungen → Fixkosten | ⬜ |
| Lohnzettel März 2026 | Buchhaltung → manuell Ausgabe | ⬜ |

---

## 🔐 SICHERHEIT — Noch offen

| Problem | Risiko | Status |
|---------|--------|--------|
| WebSocket ohne Auth | Mittel | ⬜ |
| Kein Input-Datum-Format erzwungen | Niedrig | ⬜ |
| HTTPS-Cert-Pfad hardcoded | Niedrig | ⬜ |

---

## ✅ BEREITS ERLEDIGT (zur Referenz)

### Session 21 — ANALYSE_PLAN alle 15 Schritte
- ✅ Dashboard Umsatz-Bug (Lieferando/Wolt/Mjam)
- ✅ Lager +1 Button
- ✅ psc_role_perms in SYNC_KEYS
- ✅ pizzeria_theme → psc_theme Migration
- ✅ Heute-Tab MHD-Warnungen
- ✅ Mobile overflow-x:auto
- ✅ Produkte Inline-Edit (Bottom-Sheet statt prompt)
- ✅ Navigation aufgeteilt: Analyse + Karte
- ✅ Einkaufsliste Kategorie-Gruppierung
- ✅ Umsatz Platform-Chart (Chart.js)
- ✅ Kassenbuch Plattform-Provisionen
- ✅ Dienstplan Wochenkopie-Funktion
- ✅ Urlaub Jahres-Kalender
- ✅ Heute-Tab Kassenbuch Schnell-Eintrag
- ✅ MHD Lösch-Fix (ID statt Index)

### Frühere Sessions (Auswahl)
- ✅ 36 Panels vollständig
- ✅ Kassenbuch + MwSt AT (10/20/0%)
- ✅ Dual-DB (SQLite + Turso Cloud)
- ✅ Sicherheits-Patches komplett
- ✅ Rollen-Berechtigungen konfigurierbar
- ✅ Lieferando/Wolt/Mjam im Umsatz-Tab
- ✅ i18n DE/EN/NL/AR
- ✅ Setup-Wizard + White-Label
- ✅ Rate-Limiting, PDF MIME-Check
- ✅ ICS-Export Dienstplan
- ✅ Live-Prospekte (Anthropic API)
- ✅ Feiertage Österreich 2025–2028

---

## App starten

```powershell
cd "C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell"
.\restart.ps1
# → http://localhost:3000
```

---

*Fertige Punkte: ✅ | Offen: ⬜ | Diese Datei nach jeder Session aktualisieren*
