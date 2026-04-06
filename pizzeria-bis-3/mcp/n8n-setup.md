# n8n Setup — Pizzeria San Carino

## 1. Installation

```bash
# n8n global installieren
npm install -g n8n

# Prüfen ob Installation erfolgreich
n8n --version
```

## 2. n8n starten

```bash
# Standard-Start (Port 5678)
n8n start

# Mit eigenem Port
N8N_PORT=5678 n8n start

# Im Hintergrund starten (Windows)
start /B n8n start
```

Danach erreichbar unter: **http://localhost:5678**

## 3. MCP-Server in Claude Code einbinden

```bash
# n8n MCP-Server hinzufügen
claude mcp add n8n npx @n8n/mcp-server
```

Damit kann Claude Code direkt n8n-Workflows erstellen, bearbeiten und auslösen.

## 4. Workflows

### Workflow A: Fehlmaterial → Notion

**Trigger:** Webhook (POST)
**URL:** `http://localhost:5678/webhook/fehlmaterial`

```
[Webhook] → [Set Fields] → [Notion: Create Page] → [Respond to Webhook]
```

**Schritte:**
1. **Webhook-Node:** Empfängt JSON mit Artikel, Menge, Dringlichkeit etc.
2. **Set-Node:** Felder für Notion-API mappen
3. **Notion-Node:** Neue Seite in Fehlmaterial-Datenbank erstellen
4. **Respond-Node:** `{ "success": true, "notion_id": "..." }` zurückgeben

**Notion-Konfiguration:**
- API-Key in n8n Credentials speichern (nicht im Code!)
- Datenbank-ID aus Notion-URL kopieren
- Felder mappen: Artikel → Title, Menge → Rich Text, etc.

---

### Workflow B: Tages-Report → Email

**Trigger:** Cron (Schedule)
**Zeit:** Täglich um 20:00 Uhr

```
[Schedule] → [HTTP Request: App-Daten] → [Function: Report bauen] → [Email: Senden]
```

**Schritte:**
1. **Schedule-Node:** Cron `0 20 * * *` (jeden Tag 20:00)
2. **HTTP-Request:** Tages-Statistik aus der App holen (oder direkt aus DB)
3. **Function-Node:** HTML-Email mit Umsatz, Top-Gerichte, Fehlmaterial zusammenbauen
4. **Email-Node:** An Ali senden (Gmail oder SMTP)

**Report enthält:**
- Tagesumsatz (Kasse + Lieferdienst)
- Top 5 Gerichte des Tages
- Offene Fehlmaterial-Einträge
- Mitarbeiter-Checklisten-Status

---

### Workflow C: Rechnungs-OCR → Preisdatenbank

**Trigger:** Webhook (POST mit PDF-Upload)
**URL:** `http://localhost:5678/webhook/rechnung-upload`

```
[Webhook] → [OCR: PDF lesen] → [Function: Preise extrahieren] → [HTTP: Preise updaten]
```

**Schritte:**
1. **Webhook-Node:** PDF als Binary empfangen
2. **OCR-Node:** Text aus PDF extrahieren (z.B. via Tesseract oder Google Vision)
3. **Function-Node:** Regex/Parsing um Artikelname + Preis + Menge zu finden
4. **HTTP-Request:** Preise in der App-Datenbank aktualisieren

**Unterstützte Rechnungsformate:**
- Metro Rechnung (PDF)
- UM Trade Rechnung (PDF)
- Etsan Rechnung (PDF)
- Generische Rechnungen (Best-Effort OCR)

---

## 5. Umgebungsvariablen

Erstelle eine `.env` Datei (nie committen!):

```env
# n8n
N8N_PORT=5678
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<sicheres-passwort>

# Notion
NOTION_API_KEY=<dein-notion-api-key>
NOTION_FEHLMATERIAL_DB=<datenbank-id>

# Email (für Tages-Report)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<app-passwort>
```

## 6. Troubleshooting

| Problem | Lösung |
|---------|--------|
| Port 5678 belegt | `N8N_PORT=5679 n8n start` |
| Webhook nicht erreichbar | n8n muss laufen + Workflow aktiv |
| Notion 401 Error | API-Key prüfen, Integration mit DB teilen |
| OCR ungenau | Rechnungs-Templates pro Lieferant anlegen |
