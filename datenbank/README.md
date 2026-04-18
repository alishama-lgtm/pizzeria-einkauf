# Datenbank — Pizzeria San Carino

Server starten: `node server.js` → http://localhost:8080

## Ordner-Übersicht

| Ordner | Was wird gespeichert | Status |
|---|---|---|
| 📄 rechnungen/ | PDF & Foto-Rechnungen | ✅ Aktiv |
| 👥 mitarbeiter/ | Mitarbeiter-Liste | ✅ Aktiv |
| 💰 kassabuch/ | Tägliche Einnahmen | ✅ Aktiv |
| 📊 umsatz/ | Umsatz-Daten | ✅ Aktiv |
| 🛒 einkaufsliste/ | Einkaufslisten | 🔜 Geplant |
| 📦 lager/ | Lagerbestand | 🔜 Geplant |
| 🚚 lieferanten/ | Lieferanten-Daten | 🔜 Geplant |
| 💲 preise/ | Preishistorie (Metro/Billa/Lidl/Spar) | 🔜 Geplant |
| 📋 bestellungen/ | Bestellungen | 🔜 Geplant |
| 📅 dienstplan/ | Wochenpläne | 🔜 Geplant |
| ✅ aufgaben/ | Aufgaben & Checklisten | 🔜 Geplant |
| ⚠️ fehlmaterial/ | Fehlende Materialien | 🔜 Geplant |

## Wie es funktioniert

- **Rechnungen:** PDF in `rechnungen/` legen → erscheint in App + JSON wird erstellt
- **Mitarbeiter:** In App hinzufügen → JSON in `mitarbeiter/` wird erstellt
- **Kassabuch:** In App speichern → DB + Datei wird aktualisiert

## API-Endpoints

| Methode | URL | Was |
|---|---|---|
| GET | /api/mitarbeiter | Alle Mitarbeiter |
| POST | /api/mitarbeiter | Mitarbeiter speichern |
| DELETE | /api/mitarbeiter/:id | Mitarbeiter löschen |
| GET | /api/umsatz/alle | Alle Kassabuch-Einträge |
| GET | /api/umsatz/heute | Heutiger Umsatz |
| POST | /api/umsatz/heute | Kassenbuch speichern |
| GET | /api/rechnungen | Alle Rechnungen |
