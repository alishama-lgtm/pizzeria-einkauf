# Cloudflare Tunnel — Externes Zugriff-Setup

## Was ist ein Cloudflare Tunnel?

Ein Cloudflare Tunnel macht deine lokale App (http://localhost:8080) über das Internet erreichbar — ohne Router-Konfiguration, ohne feste IP-Adresse. Du bekommst eine sichere HTTPS-URL wie `https://pizzeria-ali.trycloudflare.com`.

## Voraussetzungen

- Windows PC läuft, `node server.js` ist gestartet
- Cloudflare-Konto (kostenlos unter cloudflare.com)
- Internetzugang

---

## Setup-Schritte

### Schritt 1 — cloudflared installieren

```powershell
winget install Cloudflare.cloudflared
```

Alternativ: [Download von cloudflare.com/products/tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

### Schritt 2 — Login

```bash
cloudflared tunnel login
```

→ Browser öffnet sich → Cloudflare-Konto autorisieren

### Schritt 3 — Tunnel erstellen

```bash
cloudflared tunnel create pizzeria-san-carino
```

Notiere die **Tunnel-ID** (UUID) die angezeigt wird.

### Schritt 4 — config.yml erstellen

Datei erstellen: `C:\Users\%USERNAME%\.cloudflared\config.yml`

```yaml
tunnel: DEINE-TUNNEL-ID
credentials-file: C:\Users\DEIN-USERNAME\.cloudflared\DEINE-TUNNEL-ID.json

ingress:
  - hostname: pizzeria.deinedomain.com
    service: http://localhost:8080
  - service: http_status:404
```

**Ohne eigene Domain** (Test-Modus, sofort nutzbar):
```bash
cloudflared tunnel --url http://localhost:8080
```
→ Gibt sofort eine temporäre URL aus (z.B. `https://abc-def.trycloudflare.com`)

### Schritt 5 — DNS-Eintrag setzen (nur mit eigener Domain)

```bash
cloudflared tunnel route dns pizzeria-san-carino pizzeria.deinedomain.com
```

### Schritt 6 — Tunnel starten

```bash
cloudflared tunnel run pizzeria-san-carino
```

### Schritt 7 — Als Windows-Dienst einrichten (Autostart)

```bash
cloudflared service install
```

→ Tunnel startet automatisch beim Windows-Start.

---

## Zugriff-URL

Nach dem Start siehst du im Terminal:
```
https://pizzeria-san-carino.deinedomain.com  ← Deine URL
```

Diese URL kannst du auf dem Handy im Browser öffnen oder als PWA installieren.

---

## Sicherheitshinweis

⚠️ **Wichtig:** Der Tunnel macht deine App öffentlich erreichbar. Stelle sicher dass:
- Das Business-Passwort (`ali2024`) geändert wird wenn fremde Personen Zugriff haben könnten
- Der Tunnel nur läuft wenn du ihn brauchst (`cloudflared service stop` zum Stoppen)
- Keine sensiblen Daten (API Keys, Passwörter) im localStorage öffentlich sichtbar sind

---

## Schnell-Test (ohne Konto)

```bash
cloudflared tunnel --url http://localhost:8080
```

→ Gibt sofort eine temporäre HTTPS-URL aus. Kein Login nötig. URL ist 24h gültig.

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `cloudflared: command not found` | Neu-Installation: `winget install Cloudflare.cloudflared` |
| Tunnel startet nicht | Server prüfen: `node server.js` läuft? Port 8080 frei? |
| SSL-Fehler | `cloudflared tunnel --no-tls-verify ...` |
| Zugriff verweigert | Cloudflare-Login wiederholen: `cloudflared tunnel login` |
