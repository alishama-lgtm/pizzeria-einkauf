# Pizzeria San Carino — Projekt-Kontext & Master-Plan

Du arbeitest für **Ali**, Geschäftsführer der Pizzeria San Carino in Österreich.

---

## Wer ist Ali?

- Restaurantbesitzer, kein Entwickler — erkläre Dinge einfach und praxisnah
- Braucht Lösungen die **sofort funktionieren** und den Alltag erleichtern
- Denkt in: Kosten sparen, Umsatz steigern, Mitarbeiter im Griff, weniger Stress
- Kommuniziert auf Deutsch, manchmal mit Tippfehlern — verstehe den Sinn, frag nicht nach

---

## Projekt-Übersicht

**App:** Pizzeria San Carino Management System
**Hauptdatei:** `C:\Users\shama\Claude\Pizzaria\.claude\.claude\worktrees\Pizzaria-vs-3\index.html`
**Datenbank:** `pizzeria.db` (SQLite, better-sqlite3)
**GitHub:** https://github.com/alishama-lgtm/pizzeria-einkauf
**Git-Branch:** `claude/youthful-elbakyan`
**Rollen:** admin, manager, kueche, pizza, fahrer, reinigung, service

---

## Master-Plan — 5 Phasen

### ✅ PHASE 1 — Sicherheit & Stabilität
- [x] Passwörter aus Code extrahiert → `users.js` (in .gitignore)
- [x] Starke Passwörter gesetzt (7 Rollen)
- [x] Tägliches DB-Backup Script (`backup.bat`) erstellt
- [ ] HTTPS / externer Zugriff absichern (bewusst aufgeschoben — nach App-Fertigstellung)
- [ ] QuickLogin-Buttons entfernen (bewusst aufgeschoben — nach App-Fertigstellung)

### ✅ PHASE 2 — Mitarbeiter & Betrieb
- [x] Dienstplan digital (Mo-So, 3 Schichten, 5 Mitarbeiter)
- [x] Aufgaben pro Mitarbeiter (Priorität, Datum, Filter)
- [x] Schicht-Checkliste Öffnung & Schließung (je 8 Punkte)
- [x] Bestellliste / Fehlmaterial (Kategorie, dringend, Filter)

### ✅ PHASE 3 — Ressourcen & Kosten
- [x] Lagerbestand tracken (Ampel, Auto-Bestellung)
- [x] Wareneinsatz pro Gericht berechnen (Marge %, Ampel)
- [x] Preisalarm bei Lieferanten (Historie, Alarm-Banner)
- [ ] Google Drive: Rechnungen auto-archivieren (später)
- [ ] Google Sheets: Wochenbericht Buchhaltung (später)

### ✅ NAVIGATION — Responsive Redesign
- [x] NAV_GROUPS Konstante als einzige Datenquelle (6 Gruppen)
- [x] Desktop: Top-Nav mit Gruppen + Hover-Dropdowns
- [x] Tablet: Sidebar eingeklappt (Icons) → aufklappbar mit Labels
- [x] Mobile: Bottom-Tab-Balken + Bottom-Sheet mit Sektionen
- [x] _syncNavActiveStates() synchronisiert alle 3 Layouts
- [x] Rollen-Filterung + Badges aktiv

### ✅ PHASE 4 — Umsatz steigern
- [x] Statistik-Tab (Heute/Woche/Monat, Top 10 Gerichte CSS-Diagramm, Wochenvergleich)
- [x] Tagesangebote-Tab (Countdown, Rabatt%, Marge-Warnung, Archiv)
- [x] Umsatz-Dashboard (Kasse+Lieferdienst, Ausgaben, Monatsziel+Fortschrittsbalken, Gewinn/Verlust)
- [ ] WhatsApp/Email Wochenangebote (aufgeschoben auf Phase 5)

### ✅ VERBESSERUNGEN — Schritt für Schritt
- [x] Schritt 1: Start-Dashboard (Alerts, Checkliste, Aufgaben, Umsatz, Schnellzugriff)
- [x] Schritt 2: Aufgaben-Tab aufwerten (Status, Priorität, Kategorien, Filter, Rollen)
- [x] Schritt 3: Sammel-Fix (abgeschlossen — commit c44b123)
  - [x] Rollen-Sicherheit: leere Nav-Gruppen für eingeschränkte Rollen ausgeblendet
  - [x] Mobile Nav: Checkliste statt Schichtcheck als direkter Bottom-Button
  - [x] Dashboard Alert: Aufgaben-Alert aufklappbar mit Prioritäts-Anzeige
  - [x] Lagerbestand Formular: Select-Felder korrekt gestylt (appearance:none, SVG-Arrow)
  - [x] Desktop Nav Dropdown: Gap entfernt (top:100%), schließt sich korrekt
  - [x] Preisvergleich: günstigster Preis grün hinterlegt + Differenz in Rot
- [ ] Schritt 4: Toast-Farben & Validierung (Rot/Grün, Inline-Feedback)
- [ ] Schritt 5: Design-Konsistenz (Tabellen mobile, Empty States, Business-Tab)
- [ ] Schritt 6: Code-Qualität (Fehlerbehandlung, XSS-Schutz)

### 🔄 PHASE 5 — Mobile & Außenzugriff (nach Verbesserungen)
- [ ] PWA (auf Handy installierbar)
- [ ] Push-Benachrichtigungen
- [ ] Notion-Sync
- [ ] Echtzeit-Dashboard
- [ ] Google Drive: Rechnungen auto-archivieren
- [ ] Google Sheets: Wochenbericht Buchhaltung
- [ ] WhatsApp/Email Wochenangebote

---

## Aktuelle Prioritäten

1. ✅ Phase 1 — Sicherheit (abgeschlossen)
2. ✅ Phase 2 — Mitarbeiter & Betrieb (abgeschlossen)
3. ✅ Phase 3 — Ressourcen & Kosten (abgeschlossen)
4. ✅ Navigation — Responsive Mobile/Tablet/Desktop (abgeschlossen)
5. ✅ Phase 4 — Umsatz steigern (abgeschlossen)
6. 🔄 Verbesserungen Schritt 4–6 (als nächstes)
7. ⏳ Phase 5 — Mobile & Außenzugriff (danach)

---

## Bekannte Probleme / Regeln

- JavaScript-Variablen mit `let`/`const` NIE inline vor ihrer Deklaration (TDZ-Bug!)
- `renderKombisTab()` nur in `DOMContentLoaded`
- Nach Änderungen Syntax prüfen: `node -e "new Function(script)"`
- `users.js` NIEMALS committen
- Alle Panel-IDs müssen in switchTab() Liste + als HTML div existieren
- `_showToast(msg)` ist bereits vorhanden — nicht nochmal definieren!

---

## Arbeitsregeln

- Arbeitsverzeichnis: `C:\Users\shama\Claude\Pizzaria\.claude\.claude\worktrees\Pizzaria-vs-3\`
- Nach jeder Änderung: git commit + push
- Kein Schritt ohne Bestätigung von Ali bei riskanten Aktionen
- Immer auf Deutsch kommunizieren
- Denke wie: App-Entwickler + Restaurantgeschäftsführer kombiniert
- Schritt-für-Schritt vorgehen, Ali nach jedem Schritt bestätigen lassen

---

## Agenten-Setup — PFLICHT bei jeder Aufgabe

**IMMER Agenten verwenden und richtig koordinieren — nie direkt drauflosschreiben!**

### Reihenfolge ist fix:

**1. Plan-Agent (zuerst — immer)**
- Liest den bestehenden Code an den relevanten Stellen
- Findet alle betroffenen Funktionen, IDs, localStorage-Keys
- Erstellt einen konkreten Implementierungsplan
- Identifiziert Risiken (TDZ-Bugs, fehlende Panel-IDs, bestehende Daten)
- Gibt grünes Licht BEVOR Code geschrieben wird

**2. Code-Agent (nur nach Plan-Agent)**
- Implementiert exakt den Plan aus Schritt 1
- Keine eigenen Entscheidungen ohne Plan
- Prüft Syntax nach jeder größeren Änderung

**3. Test-Agent (immer am Ende)**
- Syntax-Check: `node -e "new Function(script)"`
- Prüft ob bestehende Features noch funktionieren
- Prüft ob localStorage-Daten erhalten bleiben
- Prüft ob Dashboard-Verbindung funktioniert
- Gibt Freigabe für git commit + push

**4. Integration-Agent (nur bei externen Diensten)**
- Google Drive, Google Sheets, Notion, WhatsApp
- Nur wenn externe APIs eingebunden werden

### Koordinationsregeln:
- Agenten laufen **sequenziell** (nicht parallel) bei Code-Änderungen
- Jeder Agent berichtet seinen Status bevor der nächste startet
- Bei Fehler im Test-Agent → zurück zum Code-Agent, nicht einfach pushen
- `users.js` NIEMALS committen — Test-Agent prüft das immer

| Agent | Aufgabe |
|-------|---------|
| **Plan-Agent** | Analysiert Code, erstellt Implementierungsplan |
| **Code-Agent** | Implementiert den Plan in index.html |
| **Test-Agent** | Syntax, Funktions-Tests, git commit + push |
| **Integration-Agent** | Externe Dienste (Google, Notion, WhatsApp) |

---

## Starte so

Wenn Ali `/pizzeria` eingibt:
1. Zeige aktuellen Phase-Status
2. Schlage nächsten konkreten Schritt vor
3. Frage: "Soll ich loslegen?"
