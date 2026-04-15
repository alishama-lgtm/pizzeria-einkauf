# Agenten-Setup — Pizzeria San Carino

Einmalig einrichten auf jedem Laptop. Danach laufen alle Agenten automatisch.

---

## 1. App-Server (muss laufen für alle Agenten)

```bash
cd "C:\Users\...\aktuell"
node server.js
```
→ http://localhost:8080 — **muss immer laufen**

---

## 2. Claude Code Hooks (automatisch aktiv)

In `.claude/settings.local.json` bereits konfiguriert:

| Hook | Wann | Was |
|------|------|-----|
| **Syntax-Check** | Nach jeder index.html Änderung | Prüft JS automatisch |

**Kein Setup nötig** — läuft automatisch wenn Claude Code aktiv ist.

---

## 3. N8N — Business-Agenten

### Installation (einmalig)

```bash
npm install -g n8n
n8n start
```
→ http://localhost:5678

### Workflow 1 — Fehlmaterial → WhatsApp (HÖCHSTE PRIORITÄT)

**Trigger:** App sendet POST an `http://localhost:5678/webhook/fehlmaterial-alert`

**In n8n einrichten:**
1. Neuer Workflow → "Fehlmaterial Alert"
2. Knoten: **Webhook** → Method: POST, Path: `fehlmaterial-alert`
3. Knoten: **IF** → `{{$json.dringlichkeit}}` = `hoch`
4. Knoten (true): **WhatsApp** → Nachricht: `⚠️ FEHLMATERIAL: {{$json.artikel}} ({{$json.menge}} {{$json.einheit}}) — gemeldet von {{$json.person}}`
5. Knoten (false): **Notion** (optional) → Zeile anhängen
6. Workflow aktivieren ✅

**WhatsApp API:** Meta Business → https://developers.facebook.com/apps

---

### Workflow 2 — Tages-Report (täglich 22:00)

**In n8n einrichten:**
1. Neuer Workflow → "Tages-Report"
2. Knoten: **Schedule Trigger** → Cron: `0 22 * * *`
3. Knoten: **HTTP Request** → GET `http://localhost:8080/api/umsatz/heute`
4. Knoten: **Email** → An: `ashama092@gmail.com`
   - Betreff: `📊 Pizzeria-Report {{$now.format('dd.MM.yyyy')}}`
   - Body: `Einkäufe heute: {{$json.gesamt}}€ — {{$json.shops.length}} Shops`
5. Workflow aktivieren ✅

---

### Workflow 3 — Preisalarm (täglich 09:00)

**In n8n einrichten:**
1. Knoten: **Schedule Trigger** → Cron: `0 9 * * *`
2. Knoten: **HTTP Request** → GET `http://localhost:8080/api/preisverlauf/stats`
3. Knoten: **Function** → Filtere Produkte mit >15% Preissteigerung
4. Knoten: **IF** → Anzahl > 0
5. Knoten (true): **WhatsApp/Email** → Alert mit Produktname + Preisunterschied
6. Workflow aktivieren ✅

---

### Workflow 5 — Buchhaltungs-Export (1. jeden Monats)

**In n8n einrichten:**
1. Knoten: **Schedule Trigger** → Cron: `0 8 1 * *`
2. Knoten: **Read Binary Files** → Pfad: `rechnungen/`
3. Knoten: **Compress** → ZIP erstellen
4. Knoten: **Email** → An: Steuerberater
   - Betreff: `Pizzeria San Carino — Belege {{$now.format('MM/yyyy')}}`
   - Anhang: ZIP
5. Workflow aktivieren ✅

---

## 4. Claude Code Scheduled Agent (manuell starten)

Jeden Morgen `/pizzeria` eingeben → Claude liest WEITERMACHEN.md und gibt Briefing.

Für automatischen Start — in Claude Code Terminal:
```
/pizzeria
```

---

## 5. Checkliste neues Laptop

```
[ ] git clone https://github.com/alishama-lgtm/pizzeria-einkauf
[ ] Node.js 22+ installiert
[ ] node server.js → läuft auf :8080
[ ] npm install -g n8n → läuft auf :5678
[ ] N8N Workflows importieren (aus n8n Export)
[ ] Claude Code: Arbeitsverzeichnis auf aktuell/ setzen
[ ] /pizzeria → Briefing lesen
```

---

## 6. N8N Workflows exportieren/importieren

**Exportieren (auf altem Laptop):**
n8n → Settings → Export → JSON

**Importieren (auf neuem Laptop):**
n8n → Import → JSON hochladen

**Backup-Pfad:** `C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell\n8n-workflows\`
(Ordner wird beim ersten Export erstellt)
