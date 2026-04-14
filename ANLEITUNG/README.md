# Pizzeria San Carino — App Dokumentation

Hier findest du alles was du über die App wissen musst.
Diese Dokumentation wird laufend erweitert.

---

## Dateien in diesem Ordner

| Datei | Inhalt |
|---|---|
| `uebersicht.md` | Was die App kann — alle 31 Tabs erklärt |
| `tabs.md` | Wie man neue Tabs hinzufügt (8-Schritte-Anleitung) |
| `datenspeicherung.md` | Wo welche Daten gespeichert werden (localStorage Keys) |
| `rollen.md` | Wer was sehen und tun darf (Rollen-System) |
| `server.md` | Wie man den Server startet und was er macht |
| `git.md` | Täglicher Git-Ablauf — commit, push, pull |
| `pdf-export.md` | Wie PDF-Export funktioniert (Einkaufsliste + Lohnabrechnung) |
| `charts.md` | Wie die Charts im Business-Tab funktionieren |

---

## Schnellstart

```bash
# 1. Code holen (erstes Mal oder nach Pause)
git clone https://github.com/alishama-lgtm/pizzeria-einkauf.git
# ODER wenn schon vorhanden:
git pull

# 2. Server starten
node server.js

# 3. Browser öffnen
http://localhost:3000
```

---

## Wichtigste Regel

Nach jeder Änderung:
```bash
git add .
git commit -m "2026-04-14: Was du geändert hast"
git push
```
