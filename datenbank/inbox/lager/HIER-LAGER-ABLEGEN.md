# Lagerbestand Inbox

Dateien hier ablegen → App aktualisiert Lagerbestand automatisch.

## Unterstützte Formate
| Format | Erklärung |
|--------|-----------|
| `.xlsx` `.xls` | Excel-Inventurliste (empfohlen) |
| `.csv` | CSV-Inventur |
| `.json` | JSON-Export |
| `.pdf` `.jpg` `.png` `.webp` | Foto/Scan (wird erkannt, kein Auto-Import) |

## Excel / CSV Spalten
```
artikel       | menge | einheit | mindestmenge | kategorie
--------------|-------|---------|--------------|----------
Mozzarella    | 8     | kg      | 5            | Käse
Pizzamehl     | 25    | kg      | 10           | Grundzutaten
Olivenöl      | 6     | Liter   | 3            | Öl
Salami Milano | 3     | kg      | 2            | Belag
```

**Spaltennamen** (flexibel):
- Artikel: `artikel`, `name`, `produkt`, `bezeichnung`
- Menge: `menge`, `quantity`, `bestand`, `anzahl`
- Einheit: `einheit`, `unit`
- Mindestmenge: `mindestmenge`, `min`, `minimum`, `mindest`
- Kategorie: `kategorie`, `category`, `gruppe`

Ampel wird automatisch berechnet:
- 🟢 grün = menge ≥ mindestmenge
- 🟡 gelb = menge < mindestmenge
- 🔴 rot = menge = 0
