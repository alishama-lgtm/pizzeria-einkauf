# Rechnungs-System — Pizzeria San Carino

## Ordnerstruktur

```
rechnungen\
├── um-trade\     → PDFs von UM Trade Lieferanten
├── metro\        → PDFs von Metro Cash & Carry
├── etsan\        → PDFs von Etsan / türkischer Großhandel
└── sonstiges\    → Alle anderen Lieferanten
```

## Wie es funktioniert

1. **PDF speichern:** Neue Rechnung als PDF im richtigen Unterordner speichern.
   - Namensformat empfohlen: `YYYY-MM-DD_Betrag.pdf`
   - Beispiel: `2026-03-26_um-trade_245.50.pdf`

2. **In pizzaria.html öffnen:** Im Upload-Tab auf **📂 Rechnung scannen** klicken.

3. **Ordner auswählen:** Den gewünschten Lieferanten-Unterordner auswählen
   (z.B. `rechnungen\um-trade\`).

4. **PDF auswählen:** Alle PDFs in dem Ordner werden angezeigt.
   Auf eine PDF klicken → wird automatisch ausgelesen.

5. **KI liest aus:** Claude erkennt automatisch:
   - Alle gekauften Produkte
   - Einzelpreise und Gesamtbetrag
   - Datum der Rechnung
   - Geschäft / Lieferant

## Claude-Befehle

| Was Ali sagt                      | Was Claude macht                                      |
|-----------------------------------|-------------------------------------------------------|
| "neue Rechnung von UM Trade"      | Schaut in `rechnungen\um-trade\` nach neuester PDF    |
| "neue Rechnung von Metro"         | Schaut in `rechnungen\metro\` nach neuester PDF       |
| "neue Rechnung von Etsan"         | Schaut in `rechnungen\etsan\` nach neuester PDF       |
| "neue Rechnung von [Lieferant]"   | Schaut in `rechnungen\sonstiges\` nach neuester PDF   |

## Tipps

- PDFs direkt von E-Mail oder Scanner in den richtigen Ordner ziehen
- Ältere Rechnungen können archiviert werden (Unterordner `archiv\` anlegen)
- Das System funktioniert komplett offline — keine Cloud nötig
