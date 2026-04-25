# Pizzeria San Carino — App-Handbuch
# Jede Funktion erklärt: Was, Woher, Wie, Sync

> Dieses Handbuch wird bei jeder Session erweitert.  
> Letzte Aktualisierung: 2026-04-25

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
4. [📦 Lager & Waren](#4--lager--waren)
   - [Lager](#41-lager)
   - [Wareneinsatz](#42-wareneinsatz)
   - [Standardmaterial](#43-standardmaterial)
   - [MHD](#44-mhd-mindesthaltbarkeit)
   - [Preisalarm](#45-preisalarm)
5. [✅ Betrieb](#5--betrieb)
   - [Heute](#51-heute)
   - [Checkliste](#52-checkliste)
   - [HACCP](#53-haccp)
   - [Kassenschnitt](#54-kassenschnitt)
   - [Bestellung](#55-bestellung)
   - [Aufgaben](#56-aufgaben)
6. [👥 Team](#6--team)
   - [Mitarbeiter](#61-mitarbeiter)
   - [Dienstplan](#62-dienstplan)
   - [Schichtcheck](#63-schichtcheck)
   - [Urlaub](#64-urlaub)
   - [Trinkgeld](#65-trinkgeld)
   - [Fehlmaterial](#66-fehlmaterial)
7. [📊 Analyse](#7--analyse)
   - [Dashboard](#71-dashboard)
   - [Umsatz](#72-umsatz)
   - [Gewinn](#73-gewinn)
   - [Statistik](#74-statistik)
   - [Konkurrenz](#75-konkurrenz)
   - [Bewertungen](#76-bewertungen)
8. [💼 Business](#8--business)
   - [Kassabuch](#81-kassabuch)
   - [Kosten](#82-kosten)
   - [Personal](#83-personal)
   - [Cockpit](#84-cockpit)
   - [Bericht](#85-bericht)
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

## 4. 📦 Lager & Waren

Alle Lager-Tabs befinden sich unter **Lager & Waren** in der Navigation.

---

### 4.1 Lager

**Was ist das:**  
Bestandsverwaltung aller Zutaten und Waren mit Mindestbestand-Alarm.

**Woher kommen die Daten:**
- Manuell eingetragen
- Import aus `datenbank/lager/` Ordner (JSON-Datei ablegen → automatisch eingelesen)
- Aus UM Trade Rechnungen (Auto-Analyse via Claude API)

**Wie benutzen:**
- Artikel hinzufügen → Name, Menge, Einheit, Mindestbestand, Kategorie
- Bestand anpassen → bei Lieferung oder Verbrauch
- **Rot markiert** = unter Mindestbestand → Alarm ausgelöst
- Filter nach Kategorie (Grundzutaten, Käse, Belag, Fleisch, Getränke, ...)

**Buttons:**
- `+ Artikel` → neuen Lagerartikel anlegen
- `Bestand anpassen` → Menge erhöhen oder verringern
- `Export` → als JSON herunterladen

**Sync:**
- Key: `pizzeria_lager`
- Turso Cloud

---

### 4.2 Wareneinsatz

**Was ist das:**  
Berechnet den **Wareneinsatz** (wie viel % des Umsatzes für Zutaten ausgegeben wird).

**Wie benutzen:**
- Monat auswählen
- Einkaufskosten vs. Umsatz wird gegenübergestellt
- Zielwert: Wareneinsatz sollte unter 30% liegen

**Sync:**
- Key: `pizzeria_wareneinsatz`

---

### 4.3 Standardmaterial

**Was ist das:**  
Vorlage für wöchentlichen Standardeinkauf — immer gleiche Mengen die jede Woche gebraucht werden.

**Wie benutzen:**
- Artikel + Mengen eintragen (z.B. Mozzarella 10kg, Mehl 25kg)
- "Zur Einkaufsliste" → fügt alle Artikel auf einmal zur Einkaufsliste hinzu

**Sync:**
- Key: `pizzeria_standardmaterial`

---

### 4.4 MHD (Mindesthaltbarkeitsdatum)

**Was ist das:**  
Überwacht Ablaufdaten aller Lebensmittel. Warnung 3 Tage vor Ablauf.

**Wie benutzen:**
- Artikel + MHD-Datum eintragen
- **Rot** = abgelaufen, **Orange** = läuft in 3 Tagen ab, **Grün** = ok
- Alarm erscheint automatisch im Benachrichtigungs-Center

**Sync:**
- Key: `psc_mhd`

---

### 4.5 Preisalarm

**Was ist das:**  
Setzt automatische Alarme wenn ein Artikel günstiger wird als der gesetzte Grenzwert.

**Wie benutzen:**
- Artikel auswählen → Alarm-Grenze eintragen (z.B. Mozzarella unter €8,00)
- Wenn Heisse-Preise.at oder neue UM Trade Rechnung günstigeren Preis zeigt → Alarm

**Sync:**
- Key: `pizzeria_preisalarm_rules`

---

## 5. ✅ Betrieb

Alle Betriebs-Tabs befinden sich unter **Betrieb** in der Navigation.

---

### 5.1 Heute

**Was ist das:**  
Übersicht für den aktuellen Tag — Checklisten, Team, Schicht, offene Aufgaben.

**Woher kommen die Daten:**
- Automatisch aus Dienstplan (wer arbeitet heute?)
- Aus Checkliste (was ist heute zu erledigen?)
- Aus Aufgaben (offene To-Dos)

**Wie benutzen:**
- Morgens öffnen → alles Wichtige auf einen Blick
- Schicht-Übersicht: wer ist eingeteilt
- Offene Aufgaben direkt abhaken

---

### 5.2 Checkliste

**Was ist das:**  
Tägliche Aufgabenlisten für Morgen, Mittag und Abend (Öffnen/Schließen der Pizzeria).

**Woher kommen die Daten:**
- Fix definierte Aufgaben (immer gleich)
- Ergänzbar mit eigenen Punkten

**Wie benutzen:**
- Checkliste auswählen (Morgen / Mittag / Abend)
- Aufgaben abhaken → werden mit Zeitstempel gespeichert
- **Erinnerung** erscheint wenn Morgen-Checkliste nach 10:00 Uhr noch offen ist

**Sync:**
- Key: `pizzeria_cl_history`

---

### 5.3 HACCP

**Was ist das:**  
Lebensmittelhygiene-Kontrollen (gesetzlich vorgeschrieben). Tägliche Temperaturmessungen der Kühlgeräte.

**Wie benutzen:**
- Kühlgeräte anlegen (Name + Zieltemperatur)
- Täglich: Temperatur messen → eintragen
- **Rot** = Temperatur außerhalb Grenzwert → sofort handeln
- Protokoll für Lebensmittelkontrolle exportierbar

**Kühlgeräte verwalten:**
- Einstellungen → HACCP → Gerät hinzufügen / löschen

**Sync:**
- Key: `psc_haccp`, `psc_haccp_geraete`

---

### 5.4 Kassenschnitt

**Was ist das:**  
Täglicher Kassenabschluss — Soll vs. Ist Vergleich, Differenz, Bericht.

**Wie benutzen:**
1. Tagesumsatz eintragen (aus Kassasystem)
2. Barzählung eintragen
3. App berechnet Differenz automatisch
4. Eintrag wird im Kassenbuch gespeichert

**Sync:**
- Key: `pizzeria_kassenschnitt`

---

### 5.5 Bestellung

**Was ist das:**  
Bestellliste für Lieferanten — was muss diese Woche bestellt werden.

**Wie benutzen:**
- Artikel + Menge + Lieferant eintragen
- "WhatsApp senden" → direkt an Lieferant schicken (AT-Nummern-Format)
- Status: Offen / Bestellt / Geliefert

**Sync:**
- Key: `pizzeria_bestellung`

---

### 5.6 Aufgaben

**Was ist das:**  
To-Do-Liste für das gesamte Team. Aufgaben mit Priorität, Fälligkeit und Zuständigkeit.

**Wie benutzen:**
- Neue Aufgabe → Titel, Priorität (Dringend/Normal/Niedrig), Fällig bis, zuständige Person
- Aufgaben abhaken → werden als erledigt markiert
- Export zu Notion möglich (wenn Notion API Key eingetragen)

**Sync:**
- Key: `pizzeria_aufgaben`
- Optional: Notion-Sync

---

## 6. 👥 Team

Alle Team-Tabs befinden sich unter **Team** in der Navigation.

---

### 6.1 Mitarbeiter

**Was ist das:**  
Stammdaten aller Mitarbeiter — Name, Abteilung, Stundenlohn, Kontakt, Notizen.

**Woher kommen die Daten:**
- Manuell eingetragen
- Import aus `datenbank/mitarbeiter/` Ordner
- Beim Server-Start automatisch eingelesen

**Wie benutzen:**
- Mitarbeiter anlegen → Name, Abteilung, Stundenlohn, Telefon
- Farbe wählen → wird im Dienstplan angezeigt
- Lohnzettel PDF exportieren (pro Mitarbeiter)
- Mitarbeiter löschen

**Abteilungen:** Küche, Lieferung, Service, Pizza, Reinigung

**Sync:**
- Key: `pizzeria_mitarbeiter`
- Turso Cloud: `mitarbeiter` Tabelle

---

### 6.2 Dienstplan

**Was ist das:**  
Wochenplan — wer arbeitet welchen Tag. Ansicht nach Abteilung gruppiert.

**Wie benutzen:**
- Woche wählen (← Vorwoche / Nächste Woche →)
- Pro Mitarbeiter pro Tag klicken: `— —` → `✅ Arbeitet` → `❌ Frei` → `— —`
- **Feiertage** (AT 2025–2028) werden automatisch goldgelb markiert
- **Schließtage** (24.12, 31.12 + konfigurierbar) werden grau gesperrt
- PDF exportieren → alle Abteilungen oder einzeln

**Feiertage konfigurieren:**
- Einstellungen ⚙️ → Schließtage → Datum hinzufügen (Format TT.MM)

**Schichtzeiten:**
- Einstellungen ⚙️ → Öffnungszeiten pro Wochentag

**Sync:**
- Key: `pizzeria_dienstplan`

---

### 6.3 Schichtcheck

**Was ist das:**  
Zeigt wer **heute** arbeitet und welche Schicht — schnelle Übersicht für den Chef.

**Woher kommen die Daten:**
- Aus Dienstplan (heutiger Tag)
- Aus Schichtzeiten-Einstellungen

---

### 6.4 Urlaub

**Was ist das:**  
Urlaubsverwaltung — Antrag, Genehmigung, Übersicht pro Mitarbeiter.

**Wie benutzen:**
- Urlaubsantrag eintragen → Von / Bis / Mitarbeiter
- Status: Beantragt / Genehmigt / Abgelehnt
- Übersicht: wer ist wann im Urlaub

**Sync:**
- Key: `pizzeria_urlaub`

---

### 6.5 Trinkgeld

**Was ist das:**  
Automatische Trinkgeld-Aufteilung nach Abteilung mit konfigurierbaren Prozentsätzen.

**Wie benutzen:**
1. Tagesbetrag eingeben (z.B. €85 Trinkgeld)
2. Modus wählen: Gleich verteilen / Nach Abteilung / Nach Stunden
3. App berechnet Anteil pro Mitarbeiter automatisch

**Regeln konfigurieren:**
- Einstellungen ⚙️ → Trinkgeld-Regeln → % pro Abteilung (Küche/Service/Lieferung)
- Standard: Küche 30%, Service 40%, Lieferung 30%

**Sync:**
- Key: `pizzeria_trinkgeld`

---

### 6.6 Fehlmaterial

**Was ist das:**  
Schnelle Meldung wenn etwas in der Küche fehlt — direkt zur Einkaufsliste und Bestellung.

**Wie benutzen:**
- Mitarbeiter meldet: Artikel + Menge + Priorität (Normal/Dringend)
- Erscheint sofort in Einkaufsliste
- Alarm im Benachrichtigungs-Center
- Export zu Notion möglich

**Sync:**
- Key: `pizzeria_fehlmaterial`

---

## 7. 📊 Analyse

Alle Analyse-Tabs befinden sich unter **Analyse** in der Navigation.

---

### 7.1 Dashboard

**Was ist das:**  
Übersicht der wichtigsten Kennzahlen auf einen Blick.

**Inhalt:**
- Tagesumsatz (Kasse + Lieferdienst)
- Offene Aufgaben Anzahl
- Lagerstand (wieviel unter Mindestbestand)
- Fehlmaterial-Anzahl
- Personalkosten-Alarm (rot wenn > X% vom Umsatz)
- Fixkosten-Abzug vom Tagesgewinn
- Tages- und Monatsziel Fortschrittsbalken

---

### 7.2 Umsatz

**Was ist das:**  
Umsatz-Entwicklung pro Monat — Kasse und Lieferdienst getrennt.

**Woher kommen die Daten:**
- Manuell eingetragen (Kassenschnitt-Tab)
- Z-Bon PDFs (Import im Kassenbuch-Tab)

**Wie benutzen:**
- Monat auswählen
- Balkendiagramm: Kasse vs. Lieferdienst
- Vergleich mit Vormonat

---

### 7.3 Gewinn

**Was ist das:**  
Gewinnberechnung: Umsatz minus alle Kosten (Waren, Lohn, Fixkosten).

**Wie benutzen:**
- Monat auswählen
- Alle Ausgaben werden automatisch aus Kassenbuch gezogen
- Ergebnis: Rohertrag / Nettogewinn / Gewinnmarge %

---

### 7.4 Statistik

**Was ist das:**  
Erweiterte Auswertungen — Bestseller, Einkaufsverhalten, Lieferanten-Analyse.

**Inhalt:**
- Meistgekaufte Artikel
- Ausgaben pro Lieferant
- Preisentwicklung über Zeit
- Wochentag-Vergleich (welcher Tag hat höchsten Umsatz)

---

### 7.5 Konkurrenz

**Was ist das:**  
Beobachtung der Mitbewerber — Preise, Angebote, Bewertungen verfolgen.

**Wie benutzen:**
- Konkurrenten anlegen (Name, Adresse, Website)
- Notizen eintragen (neue Aktionen, Preisänderungen)
- Eigene Bewertung vs. Konkurrenz vergleichen

---

### 7.6 Bewertungen

**Was ist das:**  
Google-Bewertungen der Pizzeria verfolgen — Schnitt, Ziel, Entwicklung.

**Wie benutzen:**
- Google Place ID in Einstellungen eintragen
- App lädt automatisch aktuelle Bewertungen
- **Bewertungs-Ziel** setzen (z.B. 4.5★)
- Fortschrittsbalken: wie weit zum Ziel
- Farbcode: Grün = Ziel erreicht, Orange = nah dran, Rot = weit entfernt

**Einstellungen:**
- Einstellungen ⚙️ → Bewertungs-Ziel → Wunsch-Durchschnitt eingeben

---

## 8. 💼 Business

Der Business-Tab ist **passwortgeschützt** (Standard: `ali2024`).  
Enthält alle finanziellen und verwaltungstechnischen Funktionen.

---

### 8.1 Kassabuch (Buchhaltung)

**Was ist das:**  
Alle Einnahmen und Ausgaben mit MwSt-Splitting (AT: 10% Speisen / 20% Getränke).

**Woher kommen die Daten:**
- **Automatisch** aus PDF-Import (UM Trade, Edenred, A1, SVS Rechnungen)
- **Automatisch** aus Z-Bon PDFs (Kassensystem-Tagesabschluss)
- **Automatisch** aus Fixkosten-Generator
- Manuell eingetragen

**Import-Buttons:**
| Button | Was wird importiert |
|--------|-------------------|
| Z-Bon Import | Kassensystem-PDFs → Einnahmen (Speisen 10% + Getränke 20%) |
| Betriebsausgaben | Lieferantenrechnungen aus Turso Cloud |
| Lohn-PDFs | Lohnzettel und ÖGK-Abrechnungen |
| Fixkosten generieren | Miete/Strom/etc. für alle Monate auf einmal |

**MwSt-Auswertung:**
- Tabelle pro Monat: USt (aus Einnahmen) vs. Vorsteuer (aus Ausgaben) = Zahllast
- Für Steuerberater / Finanzamt

**Sync:**
- SQLite: `kassenbuch` Tabelle
- Turso Cloud: `kassenbuch` Tabelle

---

### 8.2 Kosten (Fixkosten)

**Was ist das:**  
Monatliche Fixkosten-Übersicht — Miete, Strom, Versicherung, Buchhaltung.

**Wie benutzen:**
- Einstellungen ⚙️ → Fixkosten → Beträge eintragen → Speichern
- "Für alle Monate generieren" → erstellt Kassenbuch-Einträge für alle Monate
- Im Dashboard: Fixkosten werden vom Tagesgewinn abgezogen

---

### 8.3 Personal

**Was ist das:**  
Personalkosten-Übersicht — Lohnkosten pro Monat, Mitarbeiter, Abrechnungen.

**Woher kommen die Daten:**
- Aus Lohnzettel-PDFs (automatisch via E-Mail importiert)
- Manuell eingetragen

**Buttons:**
- `Mitarbeiter hinzufügen` → Name + Lohn in Business-DB
- `Lohn-PDF exportieren` → Lohnzettel als PDF für Mitarbeiter
- `Mitarbeiter löschen`

---

### 8.4 Cockpit (Kalkulation)

**Was ist das:**  
Pizza-Preiskalkulation — berechnet Rohertrag und empfohlenen Verkaufspreis.

**Wie benutzen:**
- Zutaten + Mengen + Kosten eintragen
- VK-Preis eingeben
- App berechnet: Materialkosten / Rohertrag / Marge %
- Pizza-Größen S/M/L/XL mit eigenen Preisen

---

### 8.5 Bericht

**Was ist das:**  
Automatisch generierter Monatsbericht — alle wichtigen Zahlen auf einer Seite.

**Inhalt:**
- Umsatz, Kosten, Gewinn
- MwSt-Zusammenfassung
- Top-Ausgaben nach Lieferant
- Personalkosten-Quote

**Buttons:**
- `Drucken / PDF` → Browser-Druck-Dialog
- `Als Text kopieren` → für E-Mail oder WhatsApp
- `Daten exportieren` → JSON mit allen Zahlen

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
