# Notion Setup — Pizzeria San Carino

## 1. Notion Integration erstellen

1. Gehe zu: **https://www.notion.so/my-integrations**
2. Klicke "New integration"
3. Name: `Pizzeria San Carino`
4. Workspace: Dein Workspace auswählen
5. Capabilities: **Read content**, **Insert content**, **Update content**
6. API-Key kopieren → in `.env` speichern als `NOTION_API_KEY`

## 2. Fehlmaterial-Datenbank erstellen

Erstelle eine neue Notion-Datenbank mit folgenden Feldern:

| Feldname | Typ | Optionen |
|----------|-----|----------|
| Artikel | Title | — |
| Menge | Rich Text | z.B. "10 kg" |
| Kategorie | Select | Lebensmittel, Getränke, Verpackung, Reinigung, Sonstiges |
| Dringlichkeit | Select | hoch (🔴), mittel (🟡), niedrig (🟢) |
| Datum | Date | ISO Format |
| Eingetragen von | Rich Text | Name des Mitarbeiters |
| Bemerkung | Rich Text | Optional |
| Status | Select | Offen, Bestellt, Erledigt |
| Quelle | Rich Text | "Pizzeria San Carino App" |

## 3. Integration mit Datenbank verbinden

1. Öffne die Fehlmaterial-Datenbank in Notion
2. Klicke auf `...` (oben rechts) → "Connections"
3. Suche "Pizzeria San Carino" → Bestätigen
4. Datenbank-ID aus URL kopieren:
   ```
   https://www.notion.so/<workspace>/<DATENBANK-ID>?v=...
                                     ^^^^^^^^^^^^^^^^
   ```
5. In `.env` speichern als `NOTION_FEHLMATERIAL_DB`

## 4. Verbindung testen

```bash
# API-Key testen (Datenbank abrufen)
curl -X GET "https://api.notion.com/v1/databases/<DB-ID>" \
  -H "Authorization: Bearer <API-KEY>" \
  -H "Notion-Version: 2022-06-28"
```

Erwartete Antwort: JSON mit Datenbank-Titel und Feldern.

## 5. Claude Code MCP-Anbindung

```bash
# Notion MCP-Server hinzufügen
claude mcp add notion npx @notionhq/mcp-server
```

Damit kann Claude Code direkt Notion-Seiten lesen und erstellen.

## 6. Ansichten (Views) einrichten

Erstelle folgende Ansichten in der Notion-Datenbank:

**Ansicht: Offene Artikel**
- Filter: Status = "Offen"
- Sortierung: Dringlichkeit (hoch → niedrig), dann Datum (neueste zuerst)

**Ansicht: Heute**
- Filter: Datum = Heute
- Gruppierung: Kategorie

**Ansicht: Wochenübersicht**
- Filter: Datum = letzte 7 Tage
- Gruppierung: Status
- Sortierung: Datum (neueste zuerst)
