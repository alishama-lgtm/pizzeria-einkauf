# Pizzeria San Carino — Vollständiger Test & Review Plan
**Erstellt: 2026-04-19 | Start: 2026-04-20**

## Ziel
Jeden Tab, jede Funktion und jede DB-Verbindung systematisch prüfen und reparieren.
Nach jedem Tab: Commit + Push auf GitHub.

## Arbeitsregel
- ✅ = Getestet & funktioniert
- ❌ = Fehler gefunden & behoben  
- 🔄 = In Bearbeitung
- ⏳ = Noch nicht begonnen

---

## TAB-LISTE (31 Tabs)

### GRUPPE 1: Einkauf & Preise
| Tab | Status | DB-Verbindung | Notizen |
|---|---|---|---|
| Produkte | ⏳ | preishistorie | |
| Geschäfte | ⏳ | preishistorie | Server-Offline-Banner |
| Kombis | ⏳ | - | |
| Angebote | ⏳ | - | Countdown |
| Tagesangebote | ⏳ | - | Marge + Countdown |
| Suche | ⏳ | preishistorie | |
| Preisalarm | ⏳ | app_data | |

### GRUPPE 2: Einkauf-Verwaltung
| Tab | Status | DB-Verbindung | Notizen |
|---|---|---|---|
| Einkaufsliste | ⏳ | app_data | |
| Bestellung | ⏳ | app_data | |
| Upload | ⏳ | - | Datei-Import |
| Verlauf | ⏳ | app_data | |

### GRUPPE 3: Lager & Material
| Tab | Status | DB-Verbindung | Notizen |
|---|---|---|---|
| Lager | ⏳ | app_data | |
| Standardmaterial | ⏳ | app_data | |
| Fehlmaterial | ⏳ | app_data | |
| Wareneinsatz | ⏳ | app_data | |

### GRUPPE 4: Personal
| Tab | Status | DB-Verbindung | Notizen |
|---|---|---|---|
| Mitarbeiter | ✅ | mitarbeiter | DB-Sync funktioniert |
| Dienstplan | ⏳ | app_data | Wochenplan |
| Schichtcheck | ⏳ | app_data | |
| Aufgaben | ⏳ | app_data | |
| Checkliste | ⏳ | app_data | |

### GRUPPE 5: Lieferanten & Rechnungen
| Tab | Status | DB-Verbindung | Notizen |
|---|---|---|---|
| Lieferanten | ⏳ | app_data | |
| Verlauf | ⏳ | app_data | |
| Rechnungen (datenbank/) | ✅ | rechnungen | File-Watcher aktiv |

### GRUPPE 6: Business & Finanzen
| Tab | Status | DB-Verbindung | Notizen |
|---|---|---|---|
| Business/Kassabuch | ✅ | umsatz_einnahmen | DB-Sync aktiv |
| Umsatz | ✅ | umsatz_einnahmen | Banner + Chart |
| Gewinn | ⏳ | app_data | |
| Buchhaltung | ⏳ | app_data | |
| Statistik | ⏳ | preishistorie | Charts |

### GRUPPE 7: Info & Marketing
| Tab | Status | DB-Verbindung | Notizen |
|---|---|---|---|
| Dashboard | ⏳ | mehrere | Übersicht |
| Heute | ⏳ | mehrere | Start-Tab |
| Speisekarte | ⏳ | app_data | |
| Konkurrenz | ⏳ | app_data | |
| Bewertungen | ⏳ | app_data | |

---

## Test-Protokoll pro Tab

Für jeden Tab prüfen:
1. **Öffnet** der Tab ohne Fehler (kein JS-Error in Console)?
2. **Daten laden** — werden vorhandene Daten angezeigt?
3. **Hinzufügen** — kann man neue Daten eingeben und speichern?
4. **DB-Sync** — erscheint der neue Eintrag in der DB?
5. **Nach F5** — sind die Daten noch da?
6. **Löschen** — funktioniert Löschen und wird auch aus DB entfernt?

---

## Reihenfolge (Priorität)

**Morgen zuerst:**
1. Dashboard + Heute (Start-Tab — muss perfekt sein)
2. Kassabuch / Business (täglich verwendet)
3. Mitarbeiter / Dienstplan (täglich verwendet)
4. Lager / Fehlmaterial (täglich verwendet)
5. Lieferanten (wöchentlich)
6. Alle restlichen Tabs

---

## Technische Checks (parallel)

- [ ] Alle 31 Panel-IDs vorhanden (keine doppelten)
- [ ] Chart.js destroy() korrekt (kein Memory Leak)
- [ ] Server-Offline-Banner in allen relevanten Tabs
- [ ] nodemon läuft stabil
- [ ] GitHub aktuell
- [ ] datenbank/ Ordner spiegelt DB korrekt
