# Preislisten Inbox

Dateien hier ablegen → App aktualisiert Produktpreise automatisch.

## Unterstützte Formate
| Format | Erklärung |
|--------|-----------|
| `.xlsx` `.xls` | Excel-Preisliste (empfohlen) |
| `.csv` | CSV-Preisliste |
| `.pdf` `.jpg` `.png` `.webp` | Foto/Scan (wird erkannt, kein Auto-Import) |

## Excel / CSV Spalten
```
produkt   | preis | einheit | shop
----------|-------|---------|------
Mozzarella 1kg | 4.99 | kg | Metro
Pizzamehl 25kg | 16.90 | Sack | Metro
Olivenöl 3L    | 3.99  | Liter | Metro
```

**Spaltennamen** (flexibel, Groß-/Kleinschreibung egal):
- Produkt: `produkt`, `name`, `artikel`, `bezeichnung`
- Preis: `preis`, `price`, `einzelpreis`
- Einheit: `einheit`, `unit`, `menge`
- Shop: `shop`, `geschaeft`, `lieferant`, `store`

Trennzeichen: `,` oder `;` oder Tab — wird automatisch erkannt.
