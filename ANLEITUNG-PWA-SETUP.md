# PWA Setup — Pizzeria San Carino
# Diese Anleitung auf dem Restaurant-Laptop abarbeiten!
# Datum: 2026-04-08

---

## SCHRITT 1: Code auf den Laptop holen

Terminal (CMD oder PowerShell) oeffnen und eintippen:

```
git clone https://github.com/alishama-lgtm/pizzeria-einkauf.git
cd pizzeria-einkauf
git checkout claude/youthful-elbakyan
npm install
```

---

## SCHRITT 2: mkcert installieren (als Admin!)

Rechtsklick auf Terminal → "Als Administrator ausfuehren", dann:

```
winget install FiloSottile.mkcert
mkcert -install
```

Wenn "winget" nicht geht, alternativ:
```
choco install mkcert
mkcert -install
```

---

## SCHRITT 3: Deine LAN-IP herausfinden

```
ipconfig
```

Suche nach "IPv4-Adresse" → z.B. 192.168.1.50
DIESE IP MERKEN! (unten immer statt DEINE-IP einsetzen)

---

## SCHRITT 4: Zertifikat erstellen

Im pizzeria-einkauf Ordner:

```
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 DEINE-IP
```

Beispiel mit IP 192.168.1.50:
```
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 192.168.1.50
```

Danach muessen 2 Dateien im Ordner sein: key.pem und cert.pem

---

## SCHRITT 5: Zertifikat auf iPhone installieren

### 5a) rootCA.pem finden:
```
mkcert -CAROOT
```
→ Zeigt einen Ordner, z.B.: C:\Users\Ali\AppData\Local\mkcert
→ Dort liegt die Datei: rootCA.pem

### 5b) rootCA.pem an dein iPhone schicken:
- Per AirDrop, oder
- Per Email an dich selbst, oder
- In iCloud Drive hochladen

### 5c) Auf dem iPhone installieren:
1. Datei oeffnen → "Profil installieren" antippen → Installieren
2. Einstellungen → Allgemein → VPN & Geraeteverwaltung → Profil bestaetigen
3. Einstellungen → Allgemein → Info → Zertifikatsvertrauenseinstellungen
   → Schalter bei "mkcert" auf EIN stellen

---

## SCHRITT 6: Server starten

Im pizzeria-einkauf Ordner:

```
node server.js
```

Du solltest sehen:
  Server laeuft: http://0.0.0.0:8080
  HTTPS Server: https://0.0.0.0:8443
  PWA installieren: https://DEINE-IP:8443

---

## SCHRITT 7: App auf iPhone installieren

1. Safari oeffnen auf dem iPhone
2. Adresse eintippen: https://DEINE-IP:8443
   (z.B. https://192.168.1.50:8443)
3. Seite laedt → Einloggen mit ali2024
4. Teilen-Button antippen (das Quadrat mit dem Pfeil nach oben)
5. "Zum Home-Bildschirm" antippen
6. FERTIG! App ist jetzt auf deinem iPhone installiert

---

## WICHTIG:
- iPhone und Laptop muessen im GLEICHEN WLAN sein!
- Server (node server.js) muss laufen, sonst zeigt die App die Offline-Seite
- Wenn sich die LAN-IP aendert → Schritt 4 nochmal machen

---

## PROBLEME?

### "Seite kann nicht geoeffnet werden"
→ Pruefen: Laptop und iPhone im gleichen WLAN?
→ Pruefen: node server.js laeuft?
→ Pruefen: richtige IP? (ipconfig nochmal checken)

### "Verbindung ist nicht sicher" (Safari)
→ Schritt 5c nochmal pruefen (Zertifikat vertrauen)

### Server startet nicht
→ npm install nochmal ausfuehren
→ Pruefen: Node.js installiert? (node --version)
