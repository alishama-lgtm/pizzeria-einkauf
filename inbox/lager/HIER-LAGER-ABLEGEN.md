# Lagerbestand Inbox

CSV-Dateien hier ablegen → App aktualisiert Lagerbestand automatisch.

**CSV-Format (Spalten):**
```
artikel,menge,einheit,mindestmenge,kategorie
Mozzarella,8,kg,5,Käse
Pizzamehl,25,kg,10,Grundzutaten
Olivenöl,6,Liter,3,Öl
```

Erste Zeile = Kopfzeile (wird übersprungen).
Ampel wird automatisch berechnet: grün ≥ mindestmenge, gelb = knapp, rot = leer.
