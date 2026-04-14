# Datenspeicherung — Wo was gespeichert wird

Die App speichert alles im **localStorage** des Browsers.  
Das bedeutet: Daten bleiben auch nach dem Schließen des Browsers erhalten — aber NUR auf diesem Gerät.

---

## Alle localStorage Keys

### Einkauf & Produkte
| Key | Tab | Was drin steht |
|---|---|---|
| `pizzeria_history` | Verlauf | Alle Einkäufe (Datum, Shop, Produkte, Preise) |
| `pizzeria_einkaufsliste` | Einkaufsliste | Aktuelle Einkaufsliste (Artikel, Mengen, Shops) |
| `pizzeria_lager` | Lagerbestand | Lagerbestand aller Artikel (Menge, Mindestmenge) |
| `pizzeria_bestellung` | Bestellliste | Offene Bestellungen (dringend, Kategorie) |
| `pizzeria_wareneinsatz` | Wareneinsatz | Wareneinsatz pro Gericht (Zutaten, Marge) |
| `pizzeria_lieferanten` | Lieferanten | Lieferanten-Stammdaten (Name, Kontakt, Bewertung) |
| `sc_standardmaterial` | Standardmaterial | Stammliste fixer Materialien (5 Kategorien) |

### Team & Betrieb
| Key | Tab | Was drin steht |
|---|---|---|
| `pizzeria_mitarbeiter` | Mitarbeiter | Mitarbeiter (Name, Rolle, Lohn, Stunden/Woche) |
| `pizzeria_dienstplan` | Dienstplan | Wochenplan (pro Woche, pro Mitarbeiter, pro Tag) |
| `pizzeria_aufgaben` | Aufgaben | Aufgaben (Status, Priorität, Zuweisung, Fälligkeit) |
| `pizzeria_schichtcheck` | Schicht-Check | Tägliche Übergabe-Checkliste (setzt sich täglich zurück) |
| `pizzeria_checkliste_*` | Checkliste | Öffnungs- & Schließungs-Checkliste (täglich) |

### Analyse & Speisekarte
| Key | Tab | Was drin steht |
|---|---|---|
| `pizzeria_speisekarte` | Speisekarte | Gerichte mit Zutaten und Kalkulation |
| `sc_konkurrenz` | Konkurrenz | Konkurrenten + Preisvergleiche |
| `sc_bewertungen` | Bewertungen | Google/Lieferando Bewertungen + Antworten |

### Business (passwortgeschützt)
| Key | Tab | Was drin steht |
|---|---|---|
| `biz_kassa` | Business | Kassabuch (Datum, Bar, Karte, Gesamt) |
| `biz_fixkosten` | Business | Fixkosten (Miete, Strom, Versicherung, etc.) |
| `biz_personal` | Business | Mitarbeiter für Lohnabrechnung (Name, Rolle, Stunden, Lohn) |
| `biz_pizzacalc` | Business | Pizza-Kalkulation (Name, Preis, Kosten) |
| `biz_settings` | Business | Einstellungen (Speise-Anteil, UID) |
| `biz_pw_hash` | Business | Passwort-Hash (nie im Klartext) |
| `biz_auth_session` | Business | Login-Session (bleibt bis Browser geschlossen) |

---

## IndexedDB (für große Dateien)

| Datenbank | Was drin steht |
|---|---|
| `BuchhaltungDB` | PDF-Dateien für den Steuerberater (bis 50MB pro Datei) |

IndexedDB wird für PDFs verwendet weil localStorage nur ~5MB fasst.

---

## Daten exportieren / sichern

Im **Business-Tab** gibt es einen "Daten exportieren" Button.  
Er exportiert alle `biz_*` Daten als JSON-Datei.

**Manuelle Sicherung:** Browser-Konsole öffnen (F12) und eingeben:
```javascript
JSON.stringify(localStorage)
```
Das gibt alle Daten als Text aus — kann in eine Datei kopiert werden.

---

## Daten auf neuem Gerät laden

Da alles im localStorage ist, gibt es **keine automatische Sync**.  
Auf einem neuen Gerät ist die App leer — du musst Daten manuell übertragen oder neu eingeben.

> **Geplant:** Sync-Funktion über den Server (noch nicht implementiert)
