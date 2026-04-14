# Einkauf-Skill — Preisvergleich & Einkaufslisten

## Zweck

Preisvergleich zwischen allen Lieferanten der Pizzeria San Carino.
Findet den günstigsten Lieferanten pro Artikel und generiert optimierte Einkaufslisten.

## Lieferanten (10 Stück)

| Lieferant | Typ | Hauptsortiment |
|-----------|-----|----------------|
| Metro | Großhandel | Vollsortiment |
| Hofer | Discounter | Grundnahrungsmittel, Getränke |
| Billa | Supermarkt | Frischware, Molkerei |
| Spar | Supermarkt | Frischware, Molkerei |
| Lidl | Discounter | Grundnahrungsmittel |
| Etsan | Großhandel | Türkische/orientalische Produkte |
| UM Trade GmbH | Großhandel | Gastro-Bedarf, Verpackung |
| Essam Shehata KEG | Großhandel | Orientalische Lebensmittel |
| Devpack | Großhandel | Verpackungsmaterial |
| UM TRADE | Großhandel | Gastro-Zubehör |

## Workflow

```
1. Artikel eingeben (Name, Menge, Einheit)
   ↓
2. Preise aller Lieferanten abfragen (aus Preisdatenbank/localStorage)
   ↓
3. Günstigsten Lieferanten pro Artikel identifizieren
   ↓
4. Einkaufsliste generieren (gruppiert nach Lieferant)
   ↓
5. Gesamtkosten berechnen (Netto + MwSt)
```

## Preisregeln

- **Immer Nettopreis + MwSt getrennt ausweisen**
- Speisen: **10% MwSt** (österreichischer ermäßigter Satz)
- Getränke: **20% MwSt** (österreichischer Normalsatz)
- Verpackung/Reinigung: **20% MwSt**
- Preise pro Einheit vergleichen (kg, Stück, Liter, Packung)
- Bei gleichem Preis: kürzere Lieferzeit bevorzugen

## Datenquellen

- `localStorage: 'pizzeria_preise'` — aktuelle Preisdatenbank
- `localStorage: 'pizzeria_einkaufsliste'` — gespeicherte Einkaufslisten
- Rechnungs-PDFs in `rechnungen/` — historische Preise

## Ausgabeformat

```
Einkaufsliste — [Datum]
═══════════════════════════

📦 Metro (3 Artikel)
  Mozzarella 10kg    Netto: €45,00  MwSt 10%: €4,50  Brutto: €49,50
  Olivenöl 5L        Netto: €22,00  MwSt 10%: €2,20  Brutto: €24,20
  Servietten 1000St  Netto: €8,00   MwSt 20%: €1,60  Brutto: €9,60

📦 Etsan (2 Artikel)
  Fladenbrot 50St    Netto: €15,00  MwSt 10%: €1,50  Brutto: €16,50
  ...

═══════════════════════════
Gesamt Netto:  €90,00
Gesamt MwSt:   €9,80
Gesamt Brutto: €99,80
Ersparnis vs. teuerster Mix: €23,40 (19%)
```
