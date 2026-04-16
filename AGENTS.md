# Agenten-Kollaboration: Claude Code + Codex

Permanentes Zusammenarbeits-Protokoll für das Pizzeria-Einkaufssystem.

---

## Projekt-Kontext

- **Hauptdatei:** `index.html` — Single-File App (~15.400 Zeilen, Vanilla JS SPA)
- **Datenbank:** `pizzeria.db` — SQLite Preishistorie (via node:sqlite)
- **Server:** `server.js` — Node.js Express + WebSocket
- **Shops:** Metro, Billa, Lidl, Spar, Etsan, UM Trade (Österreich)
- **GitHub:** https://github.com/alishama-lgtm/pizzeria-einkauf (Branch: `main`)
- **Business-Passwort:** ali2024
- **API Key:** Sicher via localStorage (`pizzeria_anthropic_key`)

---

## Rollen

### Claude Code — Architekt & Qualitätsprüfer
- Analysiert das Projekt und plant die Umsetzung
- Schreibt den ersten Code-Entwurf
- Prüft nach Codex' Optimierungen die Qualität
- Macht Syntax-Check und Commit

### Codex — Optimierer & Tester
- Übernimmt Claude Codes Entwurf
- Führt ihn aus, prüft Randfälle und Fehler
- Optimiert Performance und Lesbarkeit
- Kommentiert jede Änderung mit Begründung

---

## Arbeitsreihenfolge (immer gleich)

```
1. Claude Code — Analyse & Entwurf
   ↓
2. Codex — Optimierung & Test
   ↓
3. Claude Code — Finalisierung & Commit
   ↓
4. Gemeinsames Ergebnis
```

### 1. Claude Code — Analyse & Entwurf
- Liest relevante Code-Bereiche in index.html
- Plant die Änderung (welche Funktionen, welche Zeilen)
- Schreibt ersten Code-Entwurf mit Kommentaren
- Gibt aus unter: **„Claude Code — Analyse & Entwurf:"**

### 2. Codex — Optimierung
- Übernimmt den Entwurf von Claude Code
- Prüft: Fehler, Randfälle, Performance, Lesbarkeit
- Macht Verbesserungen und erklärt jeden Schritt
- Gibt aus unter: **„Codex — Optimierung:"**

### 3. Claude Code — Finalisierung
- Prüft Codex' Ergebnis gegen die Projekt-Regeln
- Führt Syntax-Check aus: `node -e "new Function(script)"`
- Fügt finalen Code in index.html ein
- Commitet: `git add index.html && git commit -m "YYYY-MM-DD: [beschreibung]" && git push`
- Gibt aus unter: **„Claude Code — Finalisierung:"**

---

## Pizzeria-spezifische Regeln (BEIDE Agenten)

### JavaScript
- `let`/`const` NIE vor ihrer Deklaration verwenden (TDZ-Bug!)
- Charts: immer alte Instanz zerstören: `if(window._chart) window._chart.destroy()`
- Alle Panel-IDs müssen erhalten bleiben (31 Panels — siehe CLAUDE.md)

### Git & Commit
- Commit-Nachricht auf Deutsch, max. 72 Zeichen
- Format: `YYYY-MM-DD: [kurze Beschreibung]`
- Immer pushen — kein lokaler Commit ohne Push

### Sicherheit
- API Keys NIE im Quellcode — immer über localStorage
- Business-Passwort bleibt: ali2024

### Syntax-Check (nach jeder Änderung)
```bash
node -e "const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const scripts=html.match(/<script>([\s\S]*?)<\/script>/g)||[];const script=scripts.map(s=>s.replace(/<\/?script>/g,'')).join('\n');try{new Function(script);console.log('OK');}catch(e){console.error(e.message);process.exit(1);}"
```

---

## Übergabe-Format: Claude Code → Codex

```
## Übergabe an Codex

**Aufgabe:** [Was soll gemacht werden]
**Betroffene Funktion/Zeilen:** [z.B. renderKombisTab(), Zeile 6680-6826]
**Aktueller Code:**
[code block]

**Entwurf:**
[neuer code block]

**Offene Fragen:** [Was Codex prüfen soll]
```

## Übergabe-Format: Codex → Claude Code

```
## Übergabe an Claude Code

**Optimierter Code:**
[code block]

**Änderungen:**
- [Änderung 1]: [Begründung]

**Getestet:** [Was getestet wurde]
**Randfälle berücksichtigt:** [Liste]
```

---

## Aktueller Stand: Phase 3 — Verbesserungen pro Panel

- [ ] 3.1 Kombis-Panel — Empfehlungsalgorithmus verbessern
- [ ] 3.2 Produkte-Panel — Bessere Bestandsanzeige
- [ ] 3.3 Upload-Panel — iPhone/Safari Kompatibilität
- [ ] 3.4 Business-Panel — Monatsbericht PDF verbessern
- [ ] 3.5 Suche-Panel — Echte Angebotssuche
- [ ] 3.6 Verlauf-Panel — Erweiterte Statistiken & Charts
- [ ] 3.7 Fehlmaterial-Panel — Benachrichtigungen
- [ ] 3.8 Checkliste-Panel — Erinnerungen / Notifications
