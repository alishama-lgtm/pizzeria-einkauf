# Pizzeria San Carino — Testplan (Session 8, 2026-04-20)

## Regeln
- Jeden Tab einzeln öffnen und alle Punkte prüfen
- ✅ = alles OK | ❌ = Bug gefunden (Beschreibung daneben)
- Nach jedem Tab: `git commit + push`
- Immer sagen: "Wir sind bei Tab X, als nächstes kommt Y"
- Server muss laufen: `bun server.js` → http://localhost:8080

## Pflicht bei JEDEM Tab — 4 Prüfpunkte
1. Tab öffnet ohne JS-Fehler
2. Daten laden / speichern funktioniert
3. F5-Test: Daten bleiben erhalten
4. **Lesbarkeit in allen 4 Themes** — Classic / Dark Navy / Dark Red / Glass (Schrift + Farbe gut sichtbar)

---

## Fortschritt

| # | Tab-ID | Status | Anmerkung |
|---|--------|--------|-----------|
| 1 | `heute` | ⬜ | |
| 2 | `dashboard` | ⬜ | |
| 3 | `umsatz` | ⬜ | |
| 4 | `business` | ⬜ | |
| 5 | `kassabuch → buchhaltung` | ⬜ | |
| 6 | `gewinn` | ⬜ | |
| 7 | `statistik` | ⬜ | |
| 8 | `produkte` | ⬜ | |
| 9 | `geschaefte` | ⬜ | |
| 10 | `angebote` | ⬜ | |
| 11 | `tagesangebote` | ⬜ | |
| 12 | `preisalarm` | ⬜ | |
| 13 | `kombis` | ⬜ | |
| 14 | `suche` | ⬜ | |
| 15 | `einkaufsliste` | ⬜ | |
| 16 | `standardmaterial` | ⬜ | |
| 17 | `lager` | ⬜ | |
| 18 | `wareneinsatz` | ⬜ | |
| 19 | `bestellung` | ⬜ | |
| 20 | `fehlmaterial` | ⬜ | |
| 21 | `upload` | ⬜ | |
| 22 | `verlauf` | ⬜ | |
| 23 | `lieferanten` | ⬜ | |
| 24 | `mitarbeiter` | ⬜ | |
| 25 | `dienstplan` | ⬜ | |
| 26 | `schichtcheck` | ⬜ | |
| 27 | `aufgaben` | ⬜ | |
| 28 | `checkliste` | ⬜ | |
| 29 | `speisekarte` | ⬜ | |
| 30 | `konkurrenz` | ⬜ | |
| 31 | `bewertungen` | ⬜ | |

---

## Gruppe 1 — Heute & Überblick

### Tab 1: `heute`
1. Tab öffnet ohne JS-Fehler, Inbox-Badge wird angezeigt
2. Inbox-Sektionen (Rechnungen, Preise, Lager, Lieferanten) sind sichtbar
3. Import-Buttons reagieren (Lieferanten-Import lädt Daten)

### Tab 2: `dashboard`
1. Tab öffnet, alle Kennzahlen-Karten werden gerendert
2. Heutiger Einkaufsstand wird aus DB geladen (API `/api/umsatz/heute`)
3. Kein weißer Block / kein Layout-Bruch in allen 4 Themes

### Tab 3: `umsatz`
1. DB-Banner erscheint und lädt `/api/umsatz/heute` korrekt
2. Einnahme eintragen → Wert wird gespeichert (localStorage + DB)
3. Nach F5: Einnahmen bleiben erhalten

---

## Gruppe 2 — Business / Finanzen

### Tab 4: `business`
1. Passwort-Abfrage erscheint (`ali2024` entsperrt den Tab)
2. "Gewinn pro Pizza" Tabelle ist lesbar in allen Themes (Kontrast OK)
3. MwSt-Auswertung (10%/20%) zeigt korrekte Werte

### Tab 5: `buchhaltung`
1. Tab öffnet ohne Fehler, Monatsübersicht wird gerendert
2. Neuen Eintrag (Einnahme oder Ausgabe) anlegen → wird gespeichert
3. Summen (Einnahmen / Ausgaben / Saldo) stimmen rechnerisch

### Tab 6: `gewinn`
1. Tab lädt, Gewinnrechner-Formular ist sichtbar
2. Werte eingeben → Berechnung wird korrekt angezeigt (EUR mit Komma)
3. Kein Fehler im Dark/Glass Theme

### Tab 7: `statistik`
1. Einkaufsausgaben-Chart (letzte 30 Tage) wird gerendert, Chart.js destroy OK
2. Preisverlauf-Chart: Dropdown für Produkt wählbar, Linien pro Shop erscheinen
3. CSV-Export Button funktioniert, Datei wird heruntergeladen

---

## Gruppe 3 — Preise & Einkauf

### Tab 8: `produkte`
1. Produktliste wird geladen und angezeigt
2. Neues Produkt anlegen → erscheint in der Liste
3. Produkt löschen → verschwindet, kein JS-Fehler

### Tab 9: `geschaefte`
1. Preisliste für alle Shops (Metro, Billa, Lidl, Spar) wird angezeigt
2. Netto/Brutto Toggle wechselt korrekt (Preise rechnen um)
3. Server-offline-Banner erscheint wenn DB nicht erreichbar (Mengen-Rechner bleibt nutzbar)

### Tab 10: `angebote`
1. Aktuelle KW-Angebote werden angezeigt (KW16/KW17)
2. Angebot hinzufügen / bearbeiten funktioniert
3. Ablaufdatum / KW-Wechsel wird korrekt dargestellt

### Tab 11: `tagesangebote`
1. Tab öffnet, Tagesangebote-Liste wird gerendert
2. Marge wird berechnet und angezeigt (%)
3. Stunden-Countdown läuft / zeigt korrekten Wert

### Tab 12: `preisalarm`
1. Tab öffnet ohne Fehler
2. Preisalarm für ein Produkt setzen → wird gespeichert
3. Alarm-Liste zeigt alle gesetzten Alarme

### Tab 13: `kombis`
1. Einkaufskombi-Rechner öffnet
2. Produkte auswählen → beste Händlerkombination wird berechnet
3. Ergebnis zeigt Gesamtpreis und Einsparung korrekt

### Tab 14: `suche`
1. Suchfeld ist aktiv, Eingabe möglich
2. Suche nach Produkt liefert Ergebnisse aus Preisdatenbank
3. Ergebnisse zeigen Shop + Preis korrekt formatiert (EUR, Komma)

### Tab 15: `einkaufsliste`
1. Einkaufsliste wird aus localStorage geladen
2. Artikel hinzufügen → erscheint in Liste
3. Artikel abhaken / löschen → Status wird gespeichert, nach F5 erhalten

---

## Gruppe 4 — Lager & Material

### Tab 16: `standardmaterial`
1. Tab öffnet, statische Masterliste nach Kategorie wird angezeigt
2. Kategorien sind filterbar oder sortierbar
3. Kein weißer Block / kein Darstellungsfehler

### Tab 17: `lager`
1. Lagerbestand wird geladen (localStorage `pizzeria_lager`)
2. Bestand ändern → wird gespeichert, DB-Sync funktioniert
3. Schwellenwerte: Artikel unter Minimum wird rot markiert

### Tab 18: `wareneinsatz`
1. Tab öffnet, Wareneinsatz-Rechner ist sichtbar
2. Rezept / Mengen eingeben → Wareneinsatz wird berechnet (%)
3. Ergebnis in EUR korrekt mit Komma formatiert

### Tab 19: `bestellung`
1. Tab öffnet ohne Fehler
2. Neue Bestellung anlegen (Lieferant + Artikel)
3. Bestellung wird gespeichert und in Liste angezeigt

### Tab 20: `fehlmaterial`
1. Fehlmaterial-Liste wird geladen, Filter (Prio / Status / Kategorie) funktionieren
2. Neues Fehlmaterial eintragen → erscheint sofort in der Liste
3. Status ändern (offen → erledigt) → wird gespeichert

---

## Gruppe 5 — Upload & Verlauf

### Tab 21: `upload`
1. Upload-Tab öffnet, Datei-Upload Bereich ist sichtbar
2. Bild hochladen → OCR-Verarbeitung startet (oder Fehlermeldung wenn offline)
3. Handliste-Modus: manuelle Eingabe von Preisen möglich

### Tab 22: `verlauf`
1. Einkaufshistorie wird aus `pizzeria_history` geladen
2. Einträge werden korrekt mit Datum und Betrag angezeigt
3. Neue Einträge aus "Einkauf loggen" erscheinen hier

---

## Gruppe 6 — Lieferanten & Personal

### Tab 23: `lieferanten`
1. Lieferanten-Liste wird geladen (`pizzeria_lieferanten`)
2. Neuen Lieferanten anlegen → wird gespeichert
3. Inbox-Import Button (`_inboxImportLieferanten()`) lädt Daten aus `inbox/lieferanten/`

### Tab 24: `mitarbeiter`
1. Mitarbeiterliste wird geladen, DB-Sync funktioniert
2. Neuen Mitarbeiter anlegen → wird gespeichert (localStorage + DB)
3. Mitarbeiter bearbeiten / löschen funktioniert

### Tab 25: `dienstplan`
1. Wochenplan wird gerendert (Tage + Schichten)
2. Schicht eintragen / Mitarbeiter zuweisen → wird gespeichert
3. Nach F5: Dienstplan bleibt erhalten

### Tab 26: `schichtcheck`
1. Tab öffnet, Schichtcheck-Formular ist sichtbar
2. Checkliste für aktuelle Schicht wird angezeigt
3. Punkte abhaken → Status wird gespeichert

### Tab 27: `aufgaben`
1. Aufgaben-Liste wird aus localStorage (`pizzeria_aufgaben`) geladen
2. Neue Aufgabe anlegen mit Fälligkeitsdatum → wird gespeichert
3. Aufgabe erledigen → Status ändert sich, bleibt nach F5

---

## Gruppe 7 — Checklisten & Speisekarte

### Tab 28: `checkliste`
1. Öffnungs- und Schließ-Checklisten werden angezeigt
2. Punkt abhaken → wird gespeichert, Fortschrittsanzeige aktualisiert
3. Tages-Reset: Checkliste für neuen Tag kann zurückgesetzt werden

### Tab 29: `speisekarte`
1. Speisekarte wird geladen und angezeigt
2. Gericht hinzufügen / bearbeiten → wird gespeichert
3. Preise werden korrekt in EUR mit Komma dargestellt

---

## Gruppe 8 — Analyse

### Tab 30: `konkurrenz`
1. Tab öffnet ohne Fehler
2. Konkurrenz-Einträge anlegen (Name, Preise) → werden gespeichert
3. Vergleich eigener Preise mit Konkurrenz wird dargestellt

### Tab 31: `bewertungen`
1. Tab öffnet, Bewertungs-Übersicht wird gerendert
2. Neue Bewertung eintragen (Sterne + Kommentar) → wird gespeichert
3. Durchschnittsbewertung wird korrekt berechnet und angezeigt

---

## Tab 32: `haccp` ✅ (Session 8 gebaut)
1. Tab öffnet in Betrieb-Gruppe
2. Temperaturen eintragen → Ampel grün/gelb/rot
3. Hygiene-Checkliste abhaken → gespeichert
4. F5-Test: Einträge bleiben (psc_haccp in localStorage)

---

## Nach dem Test: Checkliste

- [ ] Alle 32 Tabs mit ✅ markiert
- [ ] Keine offenen ❌ ohne Fix
- [ ] Glass-Theme in allen Tabs OK
- [ ] Finaler Commit: `2026-04-20: Testplan alle 32 Tabs abgeschlossen`
- [ ] GitHub push erfolgt
