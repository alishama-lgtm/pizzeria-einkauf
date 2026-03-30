# Setup — Neue Maschine / Zweiter Account

Anleitung um auf einer neuen Maschine mit beiden Claude Code Accounts gleich arbeiten zu können.

---

## 1. Repository klonen

```bash
git clone https://github.com/alishama-lgtm/pizzeria-einkauf.git
cd pizzeria-einkauf
```

---

## 2. Node.js Abhängigkeiten installieren

```bash
# Preisserver
cd server
npm install
cd ..

# Optional: Vite/React Dev-Setup
npm install
```

---

## 3. Claude Code CLI installieren (falls noch nicht)

```bash
npm install -g @anthropic-ai/claude-code
```

---

## 4. GitHub MCP für Claude Code einrichten

Claude Code braucht das GitHub MCP um direkt mit GitHub zu interagieren.

**In Claude Code Projekt-Einstellungen (`.claude/settings.json`) eintragen:**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "DEIN_GITHUB_TOKEN_HIER"
      }
    }
  }
}
```

**GitHub Token erstellen:**
1. github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Scopes: `repo`, `read:org`
3. Token eintragen (oben)

---

## 5. Claude.ai Account-Verbindungen einrichten

Diese Integrationen müssen **manuell** in jedem Claude.ai Account eingestellt werden:

### Checkliste (auf beiden Accounts abhaken):

- [ ] **GitHub**
  - claude.ai → Settings → Integrations → GitHub verbinden
  - Repo `alishama-lgtm/pizzeria-einkauf` freigeben

- [ ] **Google Drive / NotebookLM**
  - claude.ai → Settings → Integrations → Google verbinden
  - NotebookLM-Notebooks werden dann zugänglich

- [ ] **Stitch (Google)**
  - stitch.withgoogle.com mit Google-Account anmelden
  - Selben Google-Account wie NotebookLM verwenden
  - In Claude.ai via Google-Integration zugänglich

---

## 6. Preisserver starten

```bash
# Windows:
start-preisserver.bat

# Linux/Mac:
cd server && node server.js
```

Server läuft auf Port **3001**.

---

## 7. App öffnen

`index.html` direkt im Browser öffnen **oder** mit einem lokalen Server:

```bash
npx serve . -p 8080
# dann: http://localhost:8080
```

---

## 8. Zwei-Account-Workflow

Vor jeder Arbeitssession:
```bash
git pull origin main
```

Nach Änderungen:
```bash
git add index.html js/ css/ pizzeria.db
git commit -m "2026-MM-DD: Beschreibung der Änderung"
git push
```

**Status und offene Aufgaben:** siehe `STATUS.md`

---

## Stabile Version wiederherstellen (Notfall)

```bash
git checkout v1.0-stable
```

→ Bringt das Projekt auf den Stand vom 2026-03-30 zurück.
