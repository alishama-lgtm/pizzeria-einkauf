# Pizzeria San Carino — Weitermachen ab 2026-04-14

## Arbeitsverzeichnis

```
C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\
```

```bash
git clone https://github.com/alishama-lgtm/pizzeria-einkauf.git
cd pizzeria-einkauf
node server.js
# → http://localhost:3000
```

---

## Was heute erledigt wurde ✅

### Git & Struktur
- Saubere Ordnerstruktur: `aktuell/` + `alt/`
- GitHub `main` Branch neu aufgesetzt (sauber, 1 Branch)
- CLAUDE.md komplett aktualisiert
- ANLEITUNG/ Dokumentationsordner erstellt (7 Dateien)

### Neue Features
- **Heute-Tab** — Tagesübersicht mit 3 Kacheln (Schicht, Aufgaben, Checkliste)
- **Bewertungs-Manager** — Google/Lieferando Bewertungen + 5 Schnell-Antwort-Vorlagen
- **Business Charts** — Chart.js: Umsatz/Woche, Kostenaufschlüsselung, Mitarbeiter-Stunden
- **Einkaufsliste PDF** — jsPDF, nach Shop gruppiert, Summen
- **Lohnabrechnung PDF** — Button bei jedem Mitarbeiter im Business-Tab
- **Mobile Tab-Highlighting** — mob-nav-btn Klasse fix, Highlighting funktioniert jetzt

### Bugs behoben
- ServiceWorker Fehler bei `file://` Protokoll
- WebSocket Fehler bei `file://` Protokoll
- Mobile Bottom Nav Highlighting (inline-style Override entfernt)

---

## Offene Aufgaben (nächste Schritte)

### Priorität: Testen nach git clone
```
□ node server.js starten
□ http://localhost:3000 öffnen
□ Heute-Tab: Schicht-Kachel, Aufgaben-Kachel, Checkliste-Kachel prüfen
□ Business-Tab: Charts sichtbar? (Umsatz, Kosten, Personal)
□ Einkaufsliste: PDF-Export Button sichtbar und funktioniert?
□ Mobile: Heute-Button in Bottom Nav → wird rot wenn aktiv?
□ Bewertungen-Tab: erreichbar über Analyse-Gruppe
```

### Priorität Mittel
| # | Aufgabe |
|---|---|
| 1 | Angebots-Ansicht verfeinern |
| 2 | ANLEITUNG/server.md erstellen (Server-Dokumentation fehlt noch) |
| 3 | Charts mit echten Test-Daten befüllen und prüfen |

### Priorität Niedrig
| # | Aufgabe |
|---|---|
| 4 | Preishistorie in DB erweitern |
| 5 | Web-Scraping Preisserver stabilisieren |
| 6 | Statistik-Tab mit echten Daten befüllen |
| 7 | Tagesangebote-Tab vervollständigen |

---

## Wichtige Dateien

| Datei | Was |
|---|---|
| `index.html` | Haupt-App (~14.100 Zeilen) |
| `js/tabs.js` | Tab-Logik + renderHeuteTab() + renderBewertungenTab() |
| `js/business.js` | Business-Charts + Lohnabrechnung PDF |
| `js/einkaufsliste.js` | Einkaufsliste + PDF-Export |
| `ANLEITUNG/` | Vollständige Dokumentation |
| `users.js` | Benutzer & PINs (NICHT auf GitHub!) |

---

## Panel-IDs (alle 31)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`

---

## Neuen Tab hinzufügen → ANLEITUNG/tabs.md (8 Schritte)
