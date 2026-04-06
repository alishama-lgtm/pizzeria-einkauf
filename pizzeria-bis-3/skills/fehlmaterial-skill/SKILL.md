# Fehlmaterial-Skill — Erfassung & Notion-Export

## Zweck

Fehlende Artikel in der Pizzeria erfassen und automatisch an eine
Notion-Datenbank exportieren via n8n Webhook.

## Workflow

```
1. Mitarbeiter öffnet Fehlmaterial-Tab in der App
   ↓
2. Artikel eintragen:
   - Produktname (Freitext oder Autocomplete aus Bestand)
   - Menge + Einheit (kg, Stück, Liter, Packung)
   - Kategorie (Lebensmittel, Getränke, Verpackung, Reinigung, Sonstiges)
   - Dringlichkeit (hoch / mittel / niedrig)
   - Eingetragen von (Name)
   - Bemerkung (optional)
   ↓
3. Speicherung in localStorage ('pizzeria_fehlmaterial')
   ↓
4. Button "An n8n senden" klicken
   ↓
5. POST Request an n8n Webhook:
   http://localhost:5678/webhook/fehlmaterial
   ↓
6. n8n Workflow:
   → Daten empfangen
   → Notion-Seite erstellen
   → Bestätigung zurücksenden
   ↓
7. Toast-Meldung in der App: "Erfolgreich an Notion gesendet"
```

## Datenformat (JSON)

```json
{
  "artikel": "Mozzarella",
  "menge": "10 kg",
  "kategorie": "Lebensmittel",
  "dringlichkeit": "hoch",
  "datum": "2026-04-06T14:30:00.000Z",
  "eingetragen_von": "Marco",
  "bemerkung": "Für morgen Mittag dringend benötigt",
  "gesendet_von": "Pizzeria San Carino App"
}
```

## Notion-Datenbank Felder

| Feld | Typ | Werte |
|------|-----|-------|
| Artikel | Title | Freitext |
| Menge | Rich Text | z.B. "10 kg" |
| Kategorie | Select | Lebensmittel, Getränke, Verpackung, Reinigung, Sonstiges |
| Dringlichkeit | Select | hoch (🔴), mittel (🟡), niedrig (🟢) |
| Datum | Date | ISO 8601 |
| Eingetragen von | Rich Text | Name |
| Bemerkung | Rich Text | Optional |
| Status | Select | Offen, Bestellt, Erledigt |

## Regeln

- Pflichtfelder: Artikel, Menge, Einheit, Dringlichkeit, Eingetragen von
- Bei Dringlichkeit "hoch": sofort senden (kein manueller Klick nötig)
- Duplikat-Prüfung: gleicher Artikel am selben Tag → Menge addieren
- Offline-Fähig: Daten werden lokal gespeichert, Sync bei nächster Verbindung
- Fehler beim Senden: Toast-Warnung + Retry-Queue in localStorage
