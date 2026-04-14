# Git-Anleitung — Täglicher Ablauf

---

## Erstes Mal auf neuem Laptop

```bash
# 1. Code herunterladen
git clone https://github.com/alishama-lgtm/pizzeria-einkauf.git

# 2. In den Ordner wechseln
cd pizzeria-einkauf

# 3. Server starten
node server.js

# 4. Browser öffnen
# http://localhost:3000
```

---

## Täglich: Code holen (falls von woanders gearbeitet)

```bash
git pull
```

---

## Täglich: Änderungen speichern und hochladen

```bash
# 1. Alle Änderungen vorbereiten
git add .

# 2. Änderungen speichern (mit Beschreibung)
git commit -m "2026-04-14: Was du geändert hast"

# 3. Auf GitHub hochladen
git push
```

---

## Was ist der aktuelle Stand?

```bash
git status        # Zeigt was geändert wurde
git log --oneline -10   # Letzte 10 Commits
```

---

## Ordner-Struktur auf deinem PC

```
pizzeria-einkauf/          ← Projektordner (nach git clone)
├── index.html             ← Haupt-App (öffne das im Browser)
├── js/
│   ├── tabs.js            ← Tab-Navigation & neue Tabs
│   ├── business.js        ← Business-Tab, Charts, Lohnabrechnung
│   ├── einkaufsliste.js   ← Einkaufsliste + PDF-Export
│   ├── angebote.js        ← Angebote & Deals
│   ├── upload.js          ← Rechnungs-Upload & PDF-Scanner
│   ├── fehlmaterial.js    ← Fehlmaterial-Tab
│   ├── utils.js           ← Hilfsfunktionen
│   └── config.js          ← Konfiguration (Produkte, Shops, Preise)
├── css/
│   └── style.css          ← Alle Styles
├── server.js              ← Backend (Node.js + Express)
├── users.js               ← Benutzer & PINs (NICHT auf GitHub!)
├── users.example.js       ← Beispiel-Benutzer (ohne echte PINs)
├── CLAUDE.md              ← Regeln für Claude Code
├── ANLEITUNG/             ← Diese Dokumentation
└── rechnungen/            ← PDF-Rechnungen (gitignored)
```

---

## Häufige Fehler

**"nothing to commit"** → Keine Änderungen gemacht, alles aktuell. Normal.

**"rejected — non-fast-forward"** → Jemand anderes hat gepusht. Zuerst:
```bash
git pull
git push
```

**"merge conflict"** → Dieselbe Stelle wurde von zwei Geräten geändert.  
→ Sag Claude: "Ich habe einen merge conflict" — wird gelöst.
