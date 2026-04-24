# Pizzeria San Carino — App-Handbuch
# Jede Funktion erklärt: Was, Woher, Wie, Sync

> Dieses Handbuch wird bei jeder Session erweitert.  
> Letzte Aktualisierung: 2026-04-24

---

## Inhaltsverzeichnis

1. [App starten](#1-app-starten)
2. [Login & Rollen](#2-login--rollen)
3. [🛒 Einkauf](#3--einkauf)
   - [Produkte](#31-produkte)
   - [Geschäfte](#32-geschäfte)
   - [Angebote](#33-angebote)
   - [Einkaufsliste](#34-einkaufsliste)
   - [Kombis](#35-kombis)
   - [Upload (OCR)](#36-upload-ocr)
   - [Verlauf](#37-verlauf)
   - [Suche](#38-suche)
4. [📦 Lager & Waren](#4--lager--waren) ← noch zu dokumentieren
5. [✅ Betrieb](#5--betrieb) ← noch zu dokumentieren
6. [👥 Team](#6--team) ← noch zu dokumentieren
7. [📊 Analyse](#7--analyse) ← noch zu dokumentieren
8. [💼 Business](#8--business) ← noch zu dokumentieren
9. [📂 Buchhaltung](#9--buchhaltung)
10. [⚙️ Einstellungen](#10-️-einstellungen)
11. [Datenbank & Sync](#11-datenbank--sync)

---

## 1. App starten

```
cd C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell
node server.js
→ http://localhost:3000
```

**Was passiert beim Start:**
- SQLite lokale DB (`pizzeria.db`) wird geöffnet
- Turso Cloud wird verbunden und Daten werden heruntergeladen (Pull)
- `syncStore` lädt alle gespeicherten Keys in den Arbeitsspeicher
- WebSocket-Server startet (für Echtzeit-Updates zwischen Browser-Tabs)
- Alle 56 PDFs werden auf Turso geprüft
- Heisse-Preise Cache wird geladen (275.000 Produkte)

**Node.js: mind. Version 22**

---

## 2. Login & Rollen

### Wie einloggen
1. App öffnen → Login-Bildschirm
2. Rolle auswählen (Admin, Manager, etc.) ODER
3. PIN direkt eingeben (4-stellig) ODER Passwort

### Rollen und Zugriffsrechte

| Rolle | PIN | Zugang |
|-------|-----|--------|
| 👑 Admin | 1234 | Alles |
| 🏢 Manager | 2222 | Einkauf, Business, Reports |
| 👤 Mitarbeiter | 3333 | Einkaufsliste, Produkte |
| 👨‍🍳 Küche | 4444 | Speisekarte, Fehlmaterial |
| 🚗 Fahrer | 5555 | Dienstplan, Aufgaben |
| 🍽️ Service | 6666 | Dienstplan, Aufgaben |
| 🧹 Reinigung | 7777 | Dienstplan, Checkliste |

### Daten
- Benutzer: `users.js` (gitignored, niemals in DB gespeichert)
- Session: `sessionStorage` (geht beim Tab-Schließen verloren)

### Business-Tab Passwort
Standard: `ali2024`  
Zurücksetzen: `localStorage.removeItem('biz_pw_hash')` in Browser-Konsole

---

## 3. 🛒 Einkauf

Alle Einkauf-Tabs befinden sich unter dem **Einkauf-Dropdown** in der Navigation.

---

### 3.1 Produkte

**Was ist das:**  
Die zentrale Preisdatenbank der Pizzeria. Jeder Artikel mit Name, Preis, Geschäft, Datum.

**Woher kommen die Daten:**
- Manuell eingetragen (Button "Neu")
- Foto-Upload → OCR (Claude API liest handgeschriebene Listen)
- Heisse-Preise.at → 275.000 österreichische Supermarkt-Produkte (Auto-Import)
- UM Trade Rechnungen → Auto-Analyse (wenn neue E-Mail von umgroup.at kommt)

**Wie benutzen:**
- Artikel suchen → Preis vergleichen nach Geschäft
- Artikel bearbeiten: auf Stift-Icon klicken
- Artikel löschen: auf Papierkorb klicken
- Preis-Alarm setzen: bei jedem Artikel eine Alarm-Grenze eintragen

**Sync:**
- Key: `pizzeria_preise`
- Gespeichert in: localStorage → Server (SQLite `app_data`) → Turso Cloud
- Update: sofort bei jeder Änderung (über `_safeLocalSet` → WebSocket → Server)

---

### 3.2 Geschäfte

**Was ist das:**  
Liste der aktiven Einkaufsgeschäfte mit Kontaktdaten, Öffnungszeiten und Notizen.

**Standard-Geschäfte:**  
Metro, Billa, Lidl, Spar, Etsan, UM Trade (Mustafa)

**Woher kommen die Daten:**
- Fix im Code definiert
- Eigene Einträge ergänzbar

**Sync:**
- Key: `pizzeria_lieferanten`
- Turso Cloud

---

### 3.3 Angebote

**Was ist das:**  
Aktuelle Sonderangebote und günstige Preise pro Geschäft.

**Woher kommen die Daten:**
- Manuell eingetragen
- Heisse-Preise.at (automatisch nach Stichwort suchen)
- Aus Einkaufshistorie erkannt

**Wie benutzen:**
- "Neues Angebot" → Artikel, Preis, Geschäft, Gültig bis
- Abgelaufene Angebote werden automatisch ausgegraut

**Sync:**
- Key: `pizzeria_custom_deals`
- Turso Cloud

---

### 3.4 Einkaufsliste

**Was ist das:**  
Die aktuelle Einkaufsliste für den nächsten Einkauf.

**Woher kommen die Daten:**
- Automatisch aus **Fehlmaterial** (was fehlt in der Küche)
- Automatisch aus **Lager** (Artikel unter Mindestbestand)
- Manuell hinzugefügt
- Aus handgeschriebener Liste (Foto → OCR Upload)

**Wie benutzen:**
1. Liste prüfen → Mengen anpassen
2. Beim Einkaufen: Artikel abhaken
3. "Einkauf abschließen" → wird in Verlauf gespeichert + Kassenbuch-Eintrag

**Buttons:**
- `+ Artikel` → manuell hinzufügen
- `Leeren` → Liste zurücksetzen
- `Einkauf abschließen` → speichert Kosten, leert Liste

**Sync:**
- Lokal im Browser (kein Turso — Einkaufsliste ist kurzlebig)

---

### 3.5 Kombis

**Was ist das:**  
Berechnet die **günstigste Kombination aus mehreren Geschäften** für deinen Wocheneinkauf.

**Beispiel:**  
Käse kaufe bei Metro (€8,90) + Tomaten bei Billa (€1,20) + Öl bei Lidl (€3,50) = Gesamt €13,60 statt €18,00 überall beim gleichen Laden.

**Woher kommen die Daten:**
- Direkt aus der Produkte-Datenbank
- Preise müssen für mehrere Geschäfte eingetragen sein

**Wie benutzen:**
1. Artikel zur Einkaufsliste hinzufügen
2. Tab "Kombis" öffnen → beste Kombination wird berechnet
3. Optional: Geschäfte ausschließen (z.B. "kein Lidl diese Woche")

**Sync:** Wird live berechnet, kein eigener Sync nötig

---

### 3.6 Upload (OCR)

**Was ist das:**  
Foto einer handgeschriebenen Einkaufsliste aufnehmen → Claude KI liest es → wird zur digitalen Einkaufsliste.

**Wie benutzen:**
1. Tab "Upload" öffnen
2. Kamera-Button → Foto machen oder Bild auswählen
3. Claude API liest das Bild
4. Erkannte Artikel erscheinen als Einkaufsliste

**Voraussetzung:** Claude API Key in Einstellungen (⚙️) eingetragen

**Sync:** Ergebnis landet in Einkaufsliste → von dort normal synchronisiert

---

### 3.7 Verlauf

**Was ist das:**  
Alle abgeschlossenen Einkäufe mit Datum, Geschäft, Betrag und Artikeln.

**Woher kommen die Daten:**
- Automatisch wenn "Einkauf abschließen" gedrückt wird
- Manuell eintragen möglich

**Wie benutzen:**
- Einkäufe filtern nach Geschäft oder Monat
- Ausgaben-Chart: wie viel pro Monat wo eingekauft
- Einzelnen Einkauf öffnen → alle Artikel anzeigen

**Sync:**
- Key: `pizzeria_verlauf`
- Turso Cloud

---

### 3.8 Suche

**Was ist das:**  
Produktsuche über alle Geschäfte gleichzeitig — zeigt Preisvergleich.

**Wie benutzen:**
1. Produktname eingeben (z.B. "Mozzarella")
2. Ergebnis: alle Einträge aus Preisdatenbank + Heisse-Preise.at
3. Günstigsten Preis direkt in Einkaufsliste übernehmen

**Quellen:**
- Eigene Preisdatenbank (`pizzeria_preise`)
- Heisse-Preise.at Echtzeitsuche (275.000 Produkte AT)

---

## 9. 📂 Buchhaltung

**Was ist das:**  
Alle PDFs der Pizzeria (Rechnungen, Lohnabrechnungen, ÖGK, Finanzamt) in einer Übersicht.

**Woher kommen die Daten:**
- E-Mail-Sync (Gmail IMAP, alle 10 Minuten) von:
  - UM Trade (mustafa@umgroup.at) → Einkaufsrechnungen
  - Edenred → Essensgutschein-Abrechnungen
  - A1 → Telefonrechnungen
  - ÖGK → Sozialversicherung
  - Lamböck → Steuerberater
  - BMF → Finanzamt
  - WKO, SVS
- Manuell hochgeladen (Drag & Drop)

**Buttons:**
- `Monate korrigieren` → liest Dateinamen und setzt korrekten Monat automatisch
- `Smart Scan` → liest PDF-Inhalt und erkennt Monat + Typ
- `✏️` (Edit) → Monat und Kategorie manuell ändern
- `→ JSON` → Claude API liest PDF → strukturierte Daten (Produktliste, Beträge)
- `📄 Öffnen` → PDF im Browser öffnen

**Einkaufsübersicht pro Lieferant:**
- Buttons: UM Trade / Edenred / A1 / SVS
- Zeigt: Datum | Dateiname | Betrag | Öffnen
- Gruppiert nach Kategorie (Rechnung / Lohnzettel / ÖGK / Finanzamt)
- Betrag wird aus PDF-Text extrahiert

**Sync:**
- PDFs: Turso Cloud (`dokumente` + `dokumente_data` Tabellen)
- Metadaten: Turso Cloud
- Kein lokaler Speicher mehr für PDFs

---

## 10. ⚙️ Einstellungen

Öffnen über das ⚙️ Symbol in der Navigation.

| Feld | Was es tut |
|------|-----------|
| Claude API Key | Für OCR, PDF-Analyse, KI-Assistent |
| Notion API Key | Für Export zu Notion |
| Google Place ID | Für automatische Google-Bewertungen |
| Schichtzeiten | Start/Ende pro Wochentag, Ruhetage |
| Umsatz-Ziel | Tages- und Monatsziel für Dashboard |
| Fixkosten | Miete, Strom, Versicherung usw. → Gewinnberechnung |
| Lieferanten Schnellwahl | Telefon + WhatsApp Buttons |
| Passwort ändern | Business-Tab Passwort |
| Auto-Backup | Tägliches Backup → JSON-Datei |
| Personalkosten-Alarm | Warnung wenn Lohn > X% vom Umsatz |
| Pizza-Größen S/M/L/XL | VK-Preis + Teigkosten pro Größe |
| Mindestbestand-Defaults | Standardwerte für Lager-Kategorien |
| Bondrucker | IP + Port für ESC/POS Drucker |
| Benachrichtigungs-Filter | Welche Alarme aktiv/stumm |
| Trinkgeld-Regeln | % pro Abteilung (Küche/Service/Lieferung) |

---

## 11. Datenbank & Sync

### Wo werden Daten gespeichert?

| Datenspeicher | Was | Zugriff |
|---------------|-----|---------|
| **localStorage** | Alle App-Daten (temporär im Browser) | Nur dieser Browser |
| **SQLite** (`pizzeria.db`) | Kassenbuch, Mitarbeiter, App-Daten | Lokal am Server-PC |
| **Turso Cloud** | Spiegelung aller SQLite-Daten | Von überall |

### Welche Keys werden synchronisiert?

Folgende Daten werden automatisch zwischen Browser ↔ Server ↔ Turso synchronisiert:

| Bereich | Key |
|---------|-----|
| Lager | `pizzeria_lager` |
| Bestellung | `pizzeria_bestellung` |
| Fehlmaterial | `pizzeria_fehlmaterial` |
| Aufgaben | `pizzeria_aufgaben` |
| Mitarbeiter | `pizzeria_mitarbeiter` |
| Dienstplan | `pizzeria_dienstplan`, `pizzeria_wochenplan` |
| Schichtcheck | `pizzeria_schichtcheck` |
| Kassenbuch | `pizzeria_kassenbuch`, `pizzeria_kassenschnitt` |
| Umsatz | `pizzeria_umsatz_einnahmen`, `pizzeria_umsatz_ausgaben` |
| Statistik | `pizzeria_statistik`, `pizzeria_wareneinsatz` |
| Produkte | `pizzeria_produkte`, `pizzeria_preise` |
| Lieferanten | `pizzeria_lieferanten` |
| Angebote | `pizzeria_custom_deals` |
| Verlauf | `pizzeria_verlauf` |
| Einstellungen | `psc_schichtzeiten`, `psc_monatsziel`, `biz_fixkosten` u.v.m. |

### Wie läuft der Sync ab?

```
Browser ändert Daten
    ↓
localStorage sofort
    ↓
WebSocket → Server
    ↓
SQLite (lokal) + Turso (Cloud) gleichzeitig
    ↓
Andere Browser-Tabs bekommen Update via WebSocket
```

### PDFs (Buchhaltung)

```
E-Mail kommt an (Gmail IMAP)
    ↓
email-sync.js (läuft alle 10 Min.)
    ↓
POST /api/pdf/upload
    ↓
Turso Cloud (dokumente + dokumente_data)
    ↓
Sichtbar in Buchhaltung-Tab auf allen Geräten
```

---

*Dieses Handbuch wird laufend erweitert. Nächste Abschnitte: Lager & Waren, Betrieb, Team, Analyse, Business.*
