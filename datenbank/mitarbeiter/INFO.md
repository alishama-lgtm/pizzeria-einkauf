# Mitarbeiter — Datenbank

## Tabelle: mitarbeiter

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | TEXT | Eindeutige ID (ma_timestamp) |
| name | TEXT | Name des Mitarbeiters |
| rolle | TEXT | Küche / Service / Fahrer etc. |
| stunden | REAL | Soll-Stunden pro Woche |
| lohn | REAL | Stundenlohn in € |
| farbe | TEXT | Farbe im Dienstplan |
| created_at | TEXT | Erstellt am |

## Verhalten
- Mitarbeiter werden beim Hinzufügen in DB + localStorage gespeichert
- Beim Tab-Öffnen wird immer zuerst aus DB geladen (aktuellster Stand)
- Löschen entfernt aus DB + localStorage
