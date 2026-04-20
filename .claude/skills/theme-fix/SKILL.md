---
name: theme-fix
description: Wird verwendet wenn ein Darstellungsproblem in einem der 4 Themes (classic, dark, dark-red, glass) gemeldet wird. Prüft und repariert ALLE 4 Themes gleichzeitig — nie nur eines.
---

# Theme-Fix Skill

## Wann anwenden
- Benutzer meldet unleserlichen Text, falschen Hintergrund oder schlechten Kontrast in einem Theme
- Nach dem Hinzufügen von neuem Panel-Inhalt mit Inline-Styles
- Nach dem Erstellen eines neuen Tabs

## Workflow

### Schritt 1 — Problem lokalisieren
1. Welcher Tab / welches Panel ist betroffen?
2. Welche Farben/Hintergründe werden inline verwendet? (`grep` nach `style=".*color:#` im betroffenen Render-Code)

### Schritt 2 — ALLE 4 Themes prüfen
Für jede gefundene Inline-Farbe prüfen ob sie in **allen 4** Theme-Overrides abgedeckt ist:

| Theme | Wo in index.html |
|-------|-----------------|
| classic | Keine Overrides nötig (helles Theme = Standardfarben) |
| dark | Ca. Zeile 560–730 (`html[data-theme="dark"]`) |
| dark-red | Ca. Zeile 440–560 (`html[data-theme="dark-red"]`) |
| glass | Ca. Zeile 200–340 (`html[data-theme="glass"]`) |

### Schritt 3 — Farbmapping
| Original (hell) | Dark/Dark-Red | Glass |
|---|---|---|
| `#fff`, `#fafafa`, `#f8f8f8` | `var(--surface)` | `rgba(255,255,255,0.08)` |
| `#fff0ee`, `#fff8f6` | `var(--surface)` | `rgba(255,255,255,0.06)` |
| `#f0fdf4` (grün-hell) | `rgba(46,125,50,0.15)` | `rgba(34,197,94,0.15)` |
| `#fef9c3` (gelb-hell) | `var(--surface)` | `rgba(255,255,255,0.07)` |
| `#261816`, `#1e1e2e` | `var(--text)` | `#e5e7eb` |
| `#5a403c`, `#5c4a46` | `var(--text-2)` | `#d1d5db` |
| `#5a6472`, `#6b7280` | `var(--text-3)` | `#9ca3af` |
| `#8B0000`, `#610000` | `#ff8a80` | `#e05555` |
| `#2e7d32`, `#16a34a` | `#4ade80` | `#86efac` |
| `#f57f17`, `#f57c00` | `#fbbf24` | `#fbbf24` |
| `#1565c0`, `#0d47a1` | `#93c5fd` | `#93c5fd` |
| `border: 1px solid #e3beb8` | `var(--border)` | `rgba(255,255,255,0.12)` |

### Schritt 4 — Fix in index.html eintragen
- **NICHT** in `css/style.css` — die wird von index.html nicht eingebunden!
- Alles direkt in den `<style>` Block von `index.html`
- Fehlende Selektoren dem bestehenden Block hinzufügen

### Schritt 5 — Commit + Push
```bash
git add index.html
git commit -m "YYYY-MM-DD: Fix Theme-Lesbarkeit [Tab-Name] alle Themes"
git push origin main
```

## Regeln
- Niemals nur ein Theme fixen — immer alle 4 gleichzeitig prüfen
- `css/style.css` existiert, wird aber von index.html NICHT geladen (kein `<link>` Tag)
- Alle Theme-Overrides müssen in den `<style>` Block von `index.html`
- CSS Attribute-Selektor `[style*="color:#xxx"]` greift auf Inline-Styles zu
- `!important` ist bei allen Theme-Overrides Pflicht
