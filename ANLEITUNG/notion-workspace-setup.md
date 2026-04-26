# Notion-Workspace Script (2-Phasen Workflow)

Dieses Script organisiert deinen bestehenden Notion-Workspace nach dem gewünschten Prinzip:

1. **Phase 1: Analyse + Bericht (Dry-Run)**
2. **Phase 1: Verschieben (nur mit `--apply`)**

Dabei gilt:
- Kein Löschen
- Bestehende Seiten/DBs werden wiederverwendet
- Dubletten werden vermieden
- Unklare Seiten bleiben standardmäßig unberührt

## Voraussetzungen

- Node.js 18+
- Notion Integration Token
- Root-Seite, unter der deine Hauptstruktur liegt
- Deine Integration muss Zugriff auf die betroffenen Seiten haben

## Integration in Notion erstellen

1. In Notion: **Settings → Connections → Develop or manage integrations**
2. Neue Integration anlegen
3. Token kopieren
4. Root-Seite in Notion öffnen und per **Share → Invite** die Integration hinzufügen

## Script ausführen

### 1) Analysebericht (empfohlen zuerst)

```bash
node scripts/notion-workspace-setup.mjs \
  --token "$NOTION_TOKEN" \
  --root-page-id "<ROOT_PAGE_ID>"
```

Das Script zeigt dann für jede Seite:
- Seitenname
- Zielbereich
- Aktion (keep/move/skip)
- Begründung

### 2) Verschiebungen ausführen

```bash
node scripts/notion-workspace-setup.mjs \
  --token "$NOTION_TOKEN" \
  --root-page-id "<ROOT_PAGE_ID>" \
  --apply
```

### Optional: Unklare Seiten direkt ins Archiv

Standardmäßig bleiben `unklar`-Seiten stehen. Wenn du sie automatisch archivieren willst:

```bash
node scripts/notion-workspace-setup.mjs \
  --token "$NOTION_TOKEN" \
  --root-page-id "<ROOT_PAGE_ID>" \
  --apply \
  --move-unclear-to-archive
```

## Zielbereiche (müssen als Top-Level-Seiten existieren)

- Ali Shama Dashboard
- Pizzeria
- Arbeit und Karriere
- Privat und Familie
- Dokumente und Vorlagen
- Archiv
- Inbox

Wenn einer fehlt, wird das im Bericht angezeigt und es werden keine riskanten Moves erzwungen.

## Zuordnungslogik (Titel-basiert)

- Einkauf, Fehlmaterial, Kalkulation, Personal → **Pizzeria**
- Monatsberichte, Verträge, Texte, Vorlagen → **Dokumente und Vorlagen**
- Demo/Test/Alt/Backup → **Archiv**
- Nicht eindeutig → **unklar**

## Sicherheitshinweise

- Token niemals in Git einchecken
- Script zuerst immer ohne `--apply` starten
- Bei unklaren Seiten manuell prüfen
