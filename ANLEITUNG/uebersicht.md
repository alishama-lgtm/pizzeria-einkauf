# App-Übersicht — Was alles funktioniert

**Stand:** 2026-04-14  
**App:** Pizzeria San Carino — Einkauf & Betrieb  
**Technologie:** Vanilla JS, Tailwind CSS, localStorage, SQLite (Server)

---

## Alle 31 Tabs — Was sie machen

### Gruppe: Betrieb (täglich für alle Mitarbeiter)

| Tab | Was es macht | Wer sieht es |
|---|---|---|
| **Heute** | Tagesübersicht: Meine Schicht, offene Aufgaben, Checklisten-Stand | Alle |
| **Checkliste** | Tages-Checkliste: Öffnung & Schließung abhaken | Alle |
| **Schicht-Check** | Übergabe-Protokoll zwischen Schichten | Alle |
| **Fehlmaterial** | Fehlendes Material melden (z.B. Mehl, Öl) | Alle |
| **Bestellliste** | Dringende Bestellungen erfassen und abhaken | Alle |

### Gruppe: Einkauf

| Tab | Was es macht | Wer sieht es |
|---|---|---|
| **Kombis** | Bester Einkauf berechnen: welcher Shop ist am günstigsten | Admin, Manager |
| **Angebote** | Aktuelle Angebote von Metro, Billa, Lidl, Spar | Admin, Manager |
| **Einkaufsliste** | Einkaufsliste erstellen, abhaken, als PDF exportieren | Admin, Manager |
| **Suche** | Produkte über alle Shops suchen (mit KI-Unterstützung) | Admin, Manager |
| **Verlauf** | Alle vergangenen Einkäufe ansehen | Admin, Manager |
| **Upload** | Rechnungen fotografieren oder als PDF hochladen | Admin, Manager |
| **Preisalarm** | Alarm wenn Preis eines Produkts steigt | Admin, Manager |

### Gruppe: Lager & Waren

| Tab | Was es macht | Wer sieht es |
|---|---|---|
| **Lagerbestand** | Wie viel von was noch da ist (Ampel: grün/gelb/rot) | Admin, Manager, Küche |
| **Wareneinsatz** | Was kostet jedes Gericht an Zutaten | Admin, Manager |
| **Standardmaterial** | Stammliste aller fixen Materialien (5 Kategorien) | Admin, Manager |
| **Lieferanten** | Alle Lieferanten mit Kontakt und Bewertung | Admin, Manager |
| **Produkte** | Produkt-Datenbank mit Preishistorie | Admin, Manager |
| **Geschäfte** | Metro, Billa, Lidl, Spar — Preisübersicht | Admin, Manager |

### Gruppe: Team

| Tab | Was es macht | Wer sieht es |
|---|---|---|
| **Aufgaben** | Aufgaben zuweisen: Wer macht was bis wann | Alle (jeder sieht seine eigenen) |
| **Dienstplan** | Wochenplan: Wer arbeitet wann (Mo–So, 3 Schichten) | Admin, Manager |
| **Mitarbeiter** | Mitarbeiter-Liste mit Rollen, Lohn, Stunden | Admin |
| **Speisekarte** | Komplette Speisekarte + Kalkulation pro Gericht | Admin, Manager |

### Gruppe: Analyse

| Tab | Was es macht | Wer sieht es |
|---|---|---|
| **Dashboard** | Start-Übersicht: Alerts, Umsatz, Schnellzugriff | Admin, Manager |
| **Statistik** | Umsatz-Statistiken: Top 10, Wochenvergleich | Admin, Manager |
| **Tagesangebote** | Heutige Angebote mit Countdown und Marge | Admin, Manager |
| **Umsatz** | Umsatz-Dashboard: Kasse, Lieferdienst, Monatsziel | Admin, Manager |
| **Gewinn** | Tages P&L, Break-Even, was kostet am meisten | Admin, Manager |
| **Buchhaltung** | PDFs für Steuerberater hochladen (IndexedDB) | Admin, Manager |
| **Konkurrenz** | Konkurrenz-Monitor: Preisvergleich, Stärken/Schwächen | Admin, Manager |
| **Bewertungen** | Google & Lieferando Bewertungen + Schnell-Antworten | Admin, Manager |

### Gruppe: Business (passwortgeschützt)

| Tab | Was es macht | Wer sieht es |
|---|---|---|
| **Business** | Kassabuch, Fixkosten, Personal, Charts, Lohnabrechnung PDF | Nur Admin (Passwort: ali2024) |

---

## Was die App NICHT macht (bewusst)

- Kein Echtzeit-Sync zwischen Geräten (alles lokal im Browser)
- Kein HTTPS / kein Zugriff von außen (nur im lokalen Netzwerk)
- Kein automatisches Backup der localStorage-Daten
- Keine Cloud-Anbindung

---

## Wo die App läuft

- **Lokal:** `http://localhost:3000` (nach `node server.js`)
- **Als Datei:** `index.html` direkt im Browser öffnen (eingeschränkt — kein Server, kein WebSocket)
