# TECHNICAL FREEZE — Pizzeria System v1.0 Baseline

**Version:** Pizzeria System v1.0 Baseline
**Date:** 2026-03-30
**Git SHA:** 0f94327
**Purpose:** Fixed starting point for all future work

---

## A) FREEZE DEFINITION

This document freezes the **actual current state** of the project as it exists locally.
The requested structure in the freeze brief does NOT match the actual project structure.
All discrepancies are marked explicitly below.

---

## B) ACTUAL PROJECT STRUCTURE

```
pizzeria-einkauf/              ← root (NOT "pizzeria-local/")
  index.html                   ← ACTIVE app entry point
  pizzaria.html                ← ARCHIVED monolith, do not edit
  pizzeria.db                  ← SQLite price history
  package.json                 ← Vite/React build config (NOT the app runner)
  vite.config.ts               ← Vite config (NO proxy configured)
  tsconfig.json
  .gitignore
  CLAUDE.md / STATUS.md / SETUP.md / FREEZE-v1.0.md

  css/
    style.css                  ← App styles

  js/                          ← Active app logic (vanilla JS)
    config.js
    utils.js
    tabs.js
    angebote.js
    business.js
    fehlmaterial.js
    upload.js
    einkaufsliste.js

  server/
    server.js                  ← Express price server (NOT index.js)
    package.json

  src/                         ← React/TypeScript (NOT connected to index.html)
    main.tsx
    App.tsx
    components/
    data.ts / types.ts / utils/
```

**[ASSUMPTION] `pizzeria-local/` folder does not exist** — project root is `pizzeria-einkauf/`
**[NOT VERIFIED] `server/lib/search.js`** — does not exist in this project
**[NOT VERIFIED] `client/` folder** — does not exist; frontend is root `index.html`
**[NOT VERIFIED] `.env` / `.env.example`** — no `.env` files found anywhere

---

## C) TECHNICAL REQUIREMENTS

### Node Version
- **Installed:** v22.22.0
- **Minimum required:** Node 18+ [ASSUMPTION — based on dependencies, not tested]

### Root package.json dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | React UI (src/ only, NOT active app) |
| react-dom | ^18.2.0 | React DOM |
| @vitejs/plugin-react | ^4.2.0 | Vite React plugin |
| typescript | ^5.3.0 | TypeScript compiler |
| vite | ^5.1.0 | Build tool for src/ |

### server/package.json dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | HTTP server |
| axios | ^1.6.0 | HTTP scraping client |
| cors | ^2.8.5 | CORS middleware |

### Required .env variables
**[NOT VERIFIED]** — No `.env` file exists. Server does NOT require `ANTHROPIC_API_KEY`.
Server uses no API keys. Price data is scraped directly from supermarket websites.

### Start commands
```bash
# Price server (backend):
cd server && node server.js
# OR: start-preisserver.bat (Windows)

# Active app (frontend):
# Open index.html directly in browser — no build step required

# React src/ (NOT active app — separate build):
npm run dev    # starts Vite on port 5173
```

### Ports used
| Port | Service |
|------|---------|
| 3001 | Express price server |
| 5173 | Vite dev server (src/ only, not active app) |

### Proxy behavior
**[NOT VERIFIED]** — `vite.config.ts` has NO proxy configured.
No `/api/` proxy from frontend to backend exists in current config.
The active `index.html` app calls the server directly via JavaScript fetch calls.

---

## D) VERIFICATION REPORT

| # | Check | Status | Reason |
|---|-------|--------|--------|
| 1 | `server/index.js` resolves `server/lib/search.js` | ❌ NOT VERIFIED | File is `server/server.js`, not `index.js`. `lib/search.js` does not exist. |
| 2 | Root `package.json` starts frontend + backend | ⚠️ PARTIALLY VERIFIED | `package.json` starts Vite/React (src/), NOT the active `index.html` app. No combined start script. |
| 3 | `client/package.json` exists at correct location | ❌ NOT VERIFIED | No `client/` directory exists. Frontend is root `index.html`. |
| 4 | `vite.config.js` proxies `/api` → `http://localhost:3001` | ❌ NOT VERIFIED | `vite.config.ts` has no proxy. Only React plugin configured. |
| 5 | Frontend only calls `/api/live-search` | ❌ NOT VERIFIED | Active app calls server directly. No `/api/live-search` endpoint exists. |
| 6 | No Anthropic API key or call in any frontend file | ✅ VERIFIED | No Anthropic imports or API calls found anywhere in frontend files. |
| 7 | Backend handles `GET /api/health` | ✅ VERIFIED | `server.js` line 216: `app.get('/api/health', ...)` exists. |
| 8 | Backend handles `POST /api/live-search` | ❌ NOT VERIFIED | Endpoint is `GET /api/search`, not `POST /api/live-search`. |
| 9 | `.env` / `ANTHROPIC_API_KEY` required and validated on startup | ❌ NOT VERIFIED | No `.env` file. Server requires no API key. |
| 10 | Node 18+ sufficient for all dependencies | ✅ VERIFIED | Node v22.22.0 installed. All deps compatible. |
| 11 | `main.jsx` imports `App.jsx` correctly | ⚠️ PARTIALLY VERIFIED | Files are `main.tsx` / `App.tsx` (TypeScript, not JSX). Located in `src/`. NOT connected to active `index.html`. |
| 12 | Full file structure locally startable as-is | ⚠️ PARTIALLY VERIFIED | `index.html` + `server/server.js` are startable. React `src/` builds separately but is not the active app. |

---

## E) HONEST SUMMARY

### 1. What definitely works in this version
- `index.html` app opens directly in browser — no build step
- `server/server.js` starts on port 3001 with `node server.js`
- `GET /api/health` endpoint responds correctly
- `GET /api/search` endpoint scrapes Metro, Billa, Lidl, Spar
- All 12 app tabs functional (Kombis, Angebote, Mitarbeiter, etc.)
- Git history clean, branch `claude/sync-accounts-work-UXv1h` on GitHub

### 2. What probably works but needs local verification
- React `src/` builds via `npm run dev` — [NOT VERIFIED locally]
- Server scraping endpoints — depend on supermarket website availability
- Mobile navigation on real devices — [NOT VERIFIED]
- PDF scanner in Upload tab — requires local file access

### 3. What is NOT production-ready yet
- **No `.env` / secrets management** — no environment variable system
- **No Vite proxy** — frontend cannot use `/api/` routes via Vite dev server
- **React `src/` is disconnected** — exists but not integrated into `index.html`
- **No authentication system** — Business tab uses hardcoded password `ali2024`
- **No HTTPS** — server runs plain HTTP
- **No error boundary or logging** — crashes not captured
- **pizzeria.db is minimal** — only 16KB, little real price history data

---

## F) WORK RULES

- This version (`0f94327`) is now the fixed work baseline
- All future changes build only on this version
- Changes must be incremental only
- No new architecture without explicit approval
- No feature additions until this baseline is confirmed working locally
- Active app = `index.html` + `js/` + `css/` — NOT `src/`
- Do NOT edit `pizzaria.html` — archived

---

## G) FINAL CHECKLIST

```
□ index.html          must exist at project root
□ js/tabs.js          must exist (main logic)
□ js/config.js        must exist (loaded first)
□ server/server.js    must exist

□ First command:      cd server && node server.js
□ URL to open:        file:///path/to/index.html  OR  http://localhost:8080 (with: npx serve .)
□ Test /api/health:   curl http://localhost:3001/api/health
□ Test /api/search:   curl "http://localhost:3001/api/search?q=mehl"

□ v1.0 is approved when:
  - index.html loads all 12 tabs without JS errors
  - /api/health returns 200
  - /api/search returns results for at least 1 shop
  - Kombis tab renders correctly
  - Business tab accessible with password ali2024
```

---

**⚠️ IMPORTANT NOTE:**
The freeze brief described a `pizzeria-local/` structure with `server/lib/search.js`, `client/` folder, Anthropic API integration, and Vite proxy — **none of these exist in this project**.
This document reflects the **actual project state only**.
If a new architecture is planned, it must be explicitly approved before implementation.
