# Datenbank — Pizzeria San Carino

Alle Daten die in SQLite (pizzeria.db) gespeichert werden.
Server muss laufen: `node server.js`

## Tabellen

| Ordner | Tabelle | Beschreibung |
|---|---|---|
| mitarbeiter/ | mitarbeiter | Mitarbeiter-Liste |
| umsatz/ | umsatz_einnahmen | Tägliche Kassenbuch-Einträge |

## API-Übersicht

| Methode | URL | Was |
|---|---|---|
| GET | /api/mitarbeiter | Alle Mitarbeiter laden |
| POST | /api/mitarbeiter | Neuen Mitarbeiter speichern |
| DELETE | /api/mitarbeiter/:id | Mitarbeiter löschen |
| GET | /api/umsatz/heute | Heutiger Umsatz + Einkauf |
| POST | /api/umsatz/heute | Kassenbuch in DB speichern |
