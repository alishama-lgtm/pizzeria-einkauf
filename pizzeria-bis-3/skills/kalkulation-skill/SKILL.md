# Kalkulation-Skill — Gewinn pro Gericht

## Zweck

Berechnet den tatsächlichen Gewinn pro Gericht (Pizza, Pasta, Salate etc.)
unter Berücksichtigung aller Kostenarten: Zutaten, Personal, Fixkosten.

## Workflow

```
1. Gericht auswählen (aus Speisekarte)
   ↓
2. Zutatenkosten berechnen
   → Preise aus Preisdatenbank (günstigster Lieferant)
   → Menge pro Portion × Preis pro Einheit
   ↓
3. Personalkosten anteilig
   → Zubereitungszeit × Stundenlohn
   → z.B. 5 Min Pizza = €1,25 (bei €15/h)
   ↓
4. Fixkosten anteilig
   → Miete, Strom, Gas, Versicherung
   → Monatliche Fixkosten ÷ geschätzte Gerichte pro Monat
   ↓
5. Verkaufspreis (aus Speisekarte)
   ↓
6. Marge berechnen
```

## Kostenstruktur

### Variable Kosten (pro Gericht)
| Kostenart | Berechnung |
|-----------|------------|
| Zutaten | Summe (Menge × Preis) aller Zutaten |
| Personal | Zubereitungszeit × Stundenlohn (Standard: €15/h) |
| Verpackung | Nur bei Lieferung (Box: ~€0,30-0,50) |

### Fixkosten (monatlich, anteilig)
| Kostenart | Geschätzter Betrag/Monat |
|-----------|--------------------------|
| Miete | wird vom Benutzer eingegeben |
| Strom/Gas | wird vom Benutzer eingegeben |
| Versicherung | wird vom Benutzer eingegeben |
| Sonstige | wird vom Benutzer eingegeben |

**Anteil pro Gericht** = Monatliche Fixkosten ÷ Gerichte pro Monat

## Preisregeln

- Verkaufspreise sind **Bruttopreise** (inkl. MwSt)
- MwSt Speisen: **10%** → Netto-Verkaufspreis = Brutto ÷ 1,10
- MwSt Getränke: **20%** → Netto-Verkaufspreis = Brutto ÷ 1,20
- Alle Berechnungen intern in Netto

## Kennzahlen

| Kennzahl | Formel | Ampel |
|----------|--------|-------|
| **Rohertrag** | Netto-Verkaufspreis − Zutatenkosten | |
| **Deckungsbeitrag** | Rohertrag − Personalkosten | |
| **Nettogewinn** | Deckungsbeitrag − Fixkostenanteil | |
| **Marge %** | Nettogewinn ÷ Netto-Verkaufspreis × 100 | 🟢 >40% 🟡 20-40% 🔴 <20% |
| **Wareneinsatz %** | Zutatenkosten ÷ Netto-Verkaufspreis × 100 | 🟢 <30% 🟡 30-40% 🔴 >40% |

## Ausgabeformat

```
Kalkulation: Pizza Margherita (VK: €9,90 brutto)
═══════════════════════════════════════════════════

Netto-Verkaufspreis:           €9,00 (÷1,10)

Zutatenkosten:
  Pizzateig (250g)             €0,35
  Tomatensauce (80ml)          €0,28
  Mozzarella (150g)            €0,68
  Basilikum (5g)               €0,05
  Olivenöl (10ml)              €0,08
  ─────────────────────────────
  Summe Zutaten:               €1,44

Personalkosten (5 Min):        €1,25
Fixkostenanteil:               €0,90

═══════════════════════════════════════════════════
Rohertrag:          €7,56  (84,0%)
Deckungsbeitrag:    €6,31  (70,1%)
Nettogewinn:        €5,41  (60,1%) 🟢

Wareneinsatz:       16,0%  🟢
```
