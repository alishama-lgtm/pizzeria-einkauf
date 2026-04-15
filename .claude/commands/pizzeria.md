# Pizzeria San Carino — Projekt-Kontext & Master-Plan

Du arbeitest für **Ali**, Geschäftsführer der Pizzeria San Carino in Österreich.

---

## Wer ist Ali?

- Restaurantbesitzer, kein Entwickler — erkläre Dinge einfach und praxisnah
- Braucht Lösungen die **sofort funktionieren** und den Alltag erleichtern
- Denkt in: Kosten sparen, Umsatz steigern, Mitarbeiter im Griff, weniger Stress
- Kommuniziert auf Deutsch, manchmal mit Tippfehlern — verstehe den Sinn, frag nicht nach
- **Keine Code-Diffs im Chat** — nur Beschreibung + Ergebnis
- **Immer committen + pushen** nach jeder Änderung

---

## Arbeitsverzeichnis (aktuell)

```
C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\
```

**GitHub:** https://github.com/alishama-lgtm/pizzeria-einkauf (Branch: `main`)

**Server starten:**
```bash
node server.js   # → http://localhost:8080
```
Kein `npm install` nötig — nutzt `node:sqlite` (eingebaut, Node 22+).

**Business-Passwort:** ali2024

---

## Bei jeder neuen Session — PFLICHT

1. `WEITERMACHEN.md` lesen — aktueller Stand + offene Aufgaben
2. `git pull` — neuesten Stand holen
3. Erst dann arbeiten

---

## Agenten-Workflow — IMMER so vorgehen

**Reihenfolge ist fix — nie überspringen:**

| Schritt | Agent | Aufgabe |
|---------|-------|---------|
| 1 | **Plan-Agent** | Code lesen, Implementierungsplan erstellen, Risiken identifizieren |
| 2 | **Code-Agent** | Plan umsetzen, keine eigenen Entscheidungen |
| 3 | **Test-Agent** | Syntax-Check + git commit + push |
| 4 | **Integration-Agent** | Nur bei externen APIs (Google, N8N, WhatsApp) |

**Syntax-Check immer so:**
```bash
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const b=h.match(/<script>([\s\S]*?)<\/script>/g)||[];let e=0;b.forEach((s,i)=>{try{new Function(s.replace(/<\/?script>/g,''))}catch(x){console.error('Block '+i+': '+x.message);e++}});console.log(e===0?'OK':e+' Fehler')"
```

---

## Technischer Stack

- **Frontend:** Vanilla JS SPA, `index.html` (~15.400 Zeilen), Tailwind CDN, Chart.js, jsPDF
- **Backend:** Node.js (Express) + `node:sqlite` + WebSocket
- **DB:** `pizzeria.db` (SQLite lokal, gitignored)
- **AI:** Claude API + optional Google Gemini
- **Shops:** Metro, Billa, Lidl, Spar (Österreich)

---

## Architektur-Regeln

- Neue Tabs: **8 Stellen** in index.html anpassen (siehe `ANLEITUNG/tabs.md`)
- **TDZ-Bug vermeiden:** `let`/`const` NIE vor ihrer Deklaration
- **Charts:** Alte Instanz immer zerstören: `if(window._chart) window._chart.destroy()`
- **`users.js` NIEMALS committen** (gitignored, Passwörter drin)
- `_showToast()` ist bereits definiert — nicht nochmal definieren

---

## Panel-IDs (alle 31 müssen existieren)

`produkte, geschaefte, kombis, angebote, einkaufsliste, suche, upload, verlauf, mitarbeiter, fehlmaterial, checkliste, business, dashboard, speisekarte, lieferanten, dienstplan, aufgaben, schichtcheck, bestellung, lager, wareneinsatz, preisalarm, standardmaterial, statistik, tagesangebote, umsatz, gewinn, buchhaltung, konkurrenz, bewertungen, heute`

---

## N8N Agenten (lokal, http://localhost:5678)

| # | Workflow | Trigger | Status |
|---|----------|---------|--------|
| 1 | Fehlmaterial → WhatsApp | App-Webhook | 🔄 einrichten |
| 2 | Tages-Umsatz-Report | Cron 22:00 | 🔄 einrichten |
| 3 | Preisalarm >15% | Cron 09:00 | 🔄 einrichten |
| 5 | Buchhaltungs-Export | Cron 1. des Monats | 🔄 einrichten |

Details: `N8N-AGENTEN-WORKFLOWS.md`
Setup: `AGENTEN-SETUP.md`

---

## Phase-Status

| Phase | Status |
|-------|--------|
| Phase 1 — Sicherheit | ✅ |
| Phase 2 — Mitarbeiter & Betrieb | ✅ |
| Phase 3 — Ressourcen & Kosten | ✅ |
| Navigation Responsive | ✅ |
| Phase 4 — Umsatz | ✅ |
| Einkauf loggen Modal | ✅ |
| N8N Agenten einrichten | 🔄 |
| Phase 5 — PWA / Außenzugriff | ⏳ |

---

## Wenn Ali `/pizzeria` eingibt:

1. `WEITERMACHEN.md` lesen
2. Aktuellen Stand + offene Aufgaben zeigen
3. Nächsten Schritt vorschlagen
4. Fragen: "Soll ich loslegen?"
