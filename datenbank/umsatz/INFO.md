# Umsatz — Datenbank

## Tabelle: umsatz_einnahmen

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | INTEGER | Auto-ID |
| datum | TEXT | Datum (YYYY-MM-DD) |
| kasse | REAL | Bar-Einnahmen in € |
| lieferdienst | REAL | Karten-Einnahmen in € |
| notiz | TEXT | Optionale Notiz |
| created_at | TEXT | Erstellt am |

## Verhalten
- Pro Tag nur 1 Eintrag (beim Speichern wird der alte überschrieben)
- Kassenbuch "Heute speichern" → automatisch in DB
- GET /api/umsatz/heute gibt auch den Einkaufsstand aus preishistorie zurück
