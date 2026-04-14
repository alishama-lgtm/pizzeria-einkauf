# n8n Agenten-Workflows — Pizzeria San Carino

Phase 6 — Dokumentation aller geplanten n8n-Workflows für die Pizzeria.
Stand: 2026-04-10

> **Voraussetzung:** n8n läuft auf `http://localhost:5678` (Setup: `pizzeria-bis-3/mcp/n8n-setup.md`)
> **Webhook-Basis:** alle Webhooks unter `http://localhost:5678/webhook/<name>`

---

## Übersicht

| # | Workflow | Trigger | Ziel | Priorität |
|---|----------|---------|------|-----------|
| 1 | **Fehlmaterial → WhatsApp** | App-Webhook | Sofort-Benachrichtigung an Manager | hoch |
| 2 | **Tages-Umsatz-Report** | Cron 22:00 | Tagesbericht per Mail | hoch |
| 3 | **Preisalarm** | Cron 09:00 | Preissprünge melden | mittel |
| 4 | **Bewertungs-Sync** | Cron 06:00 | Google Reviews abrufen | mittel |
| 5 | **Buchhaltungs-Export** | Cron monatlich | PDF-Sammlung an Steuerberater | hoch |
| 6 | **Schicht-Erinnerung** | Cron früh + spät | Mitarbeiter erinnern | niedrig |
| 7 | **Lager-Mindestbestand** | App-Webhook | Bestellvorschlag generieren | mittel |
| 8 | **Konkurrenz-Monitor** | Cron wöchentlich | Preisvergleich-Alerts | niedrig |

---

## Workflow 1 — Fehlmaterial → WhatsApp

**Zweck:** Wenn ein Mitarbeiter Fehlmaterial meldet, soll der Chef sofort eine WhatsApp bekommen.

**Trigger:** Webhook POST `/webhook/fehlmaterial-alert`

**Knoten-Kette:**
```
[Webhook] → [IF dringlichkeit=hoch] → [WhatsApp Cloud API: send] → [Respond OK]
                       ↓ false
                   [Notion: append row]
```

**Webhook-Payload (von der App gesendet):**
```json
{
  "artikel": "Mozzarella",
  "menge": 5,
  "einheit": "kg",
  "dringlichkeit": "hoch",
  "person": "Mehmet",
  "datum": "2026-04-10",
  "kategorie": "Lebensmittel"
}
```

**App-Integration (in `index.html` einzubauen):**
```javascript
async function fmNotifyN8n(item) {
  if (item.dringlichkeit !== 'hoch') return;
  try {
    await fetch('http://localhost:5678/webhook/fehlmaterial-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  } catch(_) {}
}
// Aufruf in fmSubmitForm() nach erfolgreichem Speichern
```

---

## Workflow 2 — Tages-Umsatz-Report

**Zweck:** Jeden Abend um 22:00 ein PDF-Report mit Tagesumsatz, Anzahl Bestellungen und Top-3-Pizzen per Mail an den Chef.

**Trigger:** Cron `0 22 * * *` (täglich 22:00)

**Knoten-Kette:**
```
[Cron] → [HTTP GET /api/umsatz/heute] → [Function: format] → [HTML-PDF] → [Email: send]
```

**API-Endpoint (in `server.js` einzubauen):**
```javascript
app.get('/api/umsatz/heute', (req, res) => {
  const heute = new Date().toISOString().slice(0,10);
  // LocalStorage-Daten via separater DB (z.B. SQLite)
  res.json({
    datum: heute,
    umsatz_kasse: 0,
    umsatz_lieferdienst: 0,
    bestellungen: 0,
    top3: []
  });
});
```

**Email-Template:**
- Betreff: `📊 Pizzeria-Tagesreport ${datum}`
- Body: Umsatz-Zahlen + Vergleich zum Vortag

---

## Workflow 3 — Preisalarm

**Zweck:** Wenn ein Produkt im Verlauf >15% teurer wird, Alert.

**Trigger:** Cron `0 9 * * *` (täglich 09:00)

**Knoten-Kette:**
```
[Cron] → [HTTP GET /api/preisverlauf] → [Function: calculate %] → [Filter >15%] → [Slack/WhatsApp]
```

**Logik:**
- Lade alle Produkte mit min. 3 Preispunkten in den letzten 30 Tagen
- Vergleiche aktuellen Preis mit Median der letzten 30 Tage
- Wenn Differenz > 15% → Alert mit Produktname, alter/neuer Preis, Shop

---

## Workflow 4 — Bewertungs-Sync (Google)

**Zweck:** Neue Google-Bewertungen automatisch in den Bewertungs-Manager (`sc_bewertungen`) übernehmen.

**Trigger:** Cron `0 6 * * *` (täglich 06:00)

**Knoten-Kette:**
```
[Cron] → [Google My Business API] → [Function: filter neue] → [HTTP POST /api/bewertungen]
```

**API-Endpoint (in `server.js`):**
```javascript
app.post('/api/bewertungen', (req, res) => {
  // Speichert in pizzeria.db oder lokaler JSON-Datei
  // Wird beim nächsten App-Start ins LocalStorage geladen
  res.json({ ok: true });
});
```

**Voraussetzung:** Google My Business API-Zugang einrichten (OAuth).

---

## Workflow 5 — Buchhaltungs-Export

**Zweck:** Am 1. jedes Monats alle Rechnungen + Buchhaltungs-PDFs zu einem ZIP zusammenfassen und per Mail an den Steuerberater schicken.

**Trigger:** Cron `0 8 1 * *` (jeden 1. um 08:00)

**Knoten-Kette:**
```
[Cron] → [Read Folder rechnungen/] → [ZIP] → [Email an Steuerberater]
                                        ↓
                                  [HTTP POST /api/buchhaltung/export]
```

**Email:**
- An: `steuerberater@example.at`
- Betreff: `Pizzeria San Carino — Belege ${monat} ${jahr}`
- Anhang: ZIP mit allen PDFs des Vormonats

---

## Workflow 6 — Schicht-Erinnerung

**Zweck:** 1h vor Schichtbeginn WhatsApp an die zugewiesenen Mitarbeiter.

**Trigger:** Cron `0 10,16 * * *` (10:00 für Mittag, 16:00 für Abend)

**Knoten-Kette:**
```
[Cron] → [HTTP GET /api/dienstplan/heute] → [Function: filter aktuelle Schicht] → [WhatsApp loop]
```

**API-Endpoint:**
```javascript
app.get('/api/dienstplan/heute', (req, res) => {
  // Liest aus pizzeria_dienstplan
  res.json({ datum: '2026-04-10', schichten: [] });
});
```

---

## Workflow 7 — Lager-Mindestbestand → Bestellvorschlag

**Zweck:** Wenn ein Artikel im Lager unter den Mindestbestand fällt, automatisch einen Bestellvorschlag in den Tab `bestellung` schreiben.

**Trigger:** App-Webhook (wird beim Lager-Update aufgerufen)

**Knoten-Kette:**
```
[Webhook] → [IF menge < min] → [HTTP POST /api/bestellung/vorschlag] → [Notion: append]
```

**App-Integration:** In `lagerSpeichern()` nach jedem Update Webhook auslösen.

---

## Workflow 8 — Konkurrenz-Monitor

**Zweck:** Einmal pro Woche die Online-Speisekarten der Konkurrenz scrapen und Preisänderungen melden.

**Trigger:** Cron `0 9 * * 1` (Montag 09:00)

**Knoten-Kette:**
```
[Cron] → [HTTP GET each Konkurrent-URL] → [HTML Extract] → [Function: diff] → [Notification]
```

**Voraussetzung:** Konkurrenz-Tab muss URL pro Mitbewerber speichern (aktuell nicht vorhanden — erweitern).

---

## Generelle App-Hooks

Damit n8n überall ansetzen kann, sollten folgende Hooks in `index.html` ergänzt werden:

| Event | Funktion | Webhook |
|-------|----------|---------|
| Fehlmaterial gespeichert | `fmSubmitForm` | `/webhook/fehlmaterial-alert` |
| Bestellung erledigt | `bestellungToggle` | `/webhook/bestellung-done` |
| Lager unter Min. | `lagerSpeichern` | `/webhook/lager-low` |
| Bewertung erfasst | `bwSpeichern` | `/webhook/bewertung-neu` |
| Schicht beendet | `schichtCheckOk` | `/webhook/schicht-ende` |

**Helper-Funktion (einmal global):**
```javascript
async function n8nHook(name, data) {
  const enabled = localStorage.getItem('pizzeria_n8n_enabled') === '1';
  if (!enabled) return;
  try {
    await fetch('http://localhost:5678/webhook/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    });
  } catch(_) { /* still alive */ }
}
```

In Settings einen Schalter "n8n-Workflows aktiv" einbauen, der `pizzeria_n8n_enabled` toggelt.

---

## Reihenfolge der Implementierung

1. **n8n installieren** (siehe `pizzeria-bis-3/mcp/n8n-setup.md`)
2. **`n8nHook()` Helper in `index.html`** einbauen
3. **Workflow 1 (Fehlmaterial → WhatsApp)** zuerst — höchster Tagesnutzen
4. **Workflow 2 (Tages-Report)** — Chef-Wert
5. **Workflow 5 (Buchhaltungs-Export)** — Steuerberater-Pflicht
6. **Workflow 3 + 4** — Stretch
7. **Workflow 6 + 7 + 8** — Optional

---

## Sicherheit

- n8n läuft **lokal** (kein Cloud) → keine Webhooks ins Internet exposen
- WhatsApp-API-Token in `.env` (gitignored)
- Email-SMTP-Credentials nur in n8n-Credentials-Manager, nicht hardcoded
- Webhook-URLs nicht ins Repo committen

---

## Verwandte Dateien

- `pizzeria-bis-3/mcp/n8n-setup.md` — n8n-Installation & MCP-Server-Setup
- `WEITERMACHEN.md` — Phase-Übersicht
- `server.js` — wo die `/api/*`-Endpoints landen
- `index.html` — wo die `n8nHook()`-Aufrufe landen
