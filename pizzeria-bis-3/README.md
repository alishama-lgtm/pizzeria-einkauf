# Pizzeria San Carino — Skills & Automationen

Dieses Verzeichnis enthält die Claude Code Skills und n8n/MCP-Konfigurationen
für die Pizzeria San Carino Management App.

## Ordnerstruktur

```
pizzeria-bis-3/
├── README.md              ← Du bist hier
├── skills/
│   ├── einkauf-skill/     Preisvergleich & Einkaufslisten
│   ├── kalkulation-skill/ Gewinn-pro-Pizza Berechnung
│   └── fehlmaterial-skill/Fehlmaterial erfassen & an Notion senden
└── mcp/
    ├── n8n-setup.md       n8n Installation & Workflow-Konfiguration
    └── notion-setup.md    Notion-Datenbank Anbindung
```

## Skills

| Skill | Zweck |
|-------|-------|
| **Einkauf** | Preisvergleich zwischen 10 Lieferanten, günstigsten finden, Einkaufsliste generieren |
| **Kalkulation** | Zutatenkosten → Personalkosten → Fixkosten → Verkaufspreis → Marge pro Gericht |
| **Fehlmaterial** | Fehlende Artikel erfassen, via n8n Webhook an Notion exportieren |

## Automationen (n8n)

| Workflow | Trigger | Aktion |
|----------|---------|--------|
| Fehlmaterial → Notion | Webhook (POST) | Neuen Eintrag in Notion-Datenbank erstellen |
| Tages-Report → Email | Cron (täglich 20:00) | Zusammenfassung per Email senden |
| Rechnungs-OCR → Preise | Webhook (Upload) | PDF lesen, Preise in Datenbank aktualisieren |

## Voraussetzungen

- Node.js 18+
- n8n (`npm install -g n8n`)
- Claude Code mit MCP-Server (`claude mcp add n8n npx @n8n/mcp-server`)
- Notion API Key (in `.env`, nie committen!)
