# Rollen-System — Wer was sehen darf

Die App hat 4 Rollen. Beim Login bestimmt die Rolle was sichtbar ist.

---

## Die 4 Rollen

### Admin
- **Sieht alles** — alle 31 Tabs
- Einziger der den **Business-Tab** öffnen kann (Passwort: ali2024)
- Kann Mitarbeiter verwalten, Löhne sehen, alles exportieren

### Manager
- Sieht fast alles — außer: Mitarbeiter-Stammdaten, Business-Tab (mit Passwort)
- Kann Dienstplan, Aufgaben, Einkauf, Analyse alles sehen und bearbeiten

### Employee (Mitarbeiter)
- Sieht nur: **Heute**, Dashboard, Fehlmaterial, Checkliste, Aufgaben, Schicht-Check, Bestellliste, Speisekarte
- Sieht bei Aufgaben nur **seine eigenen**

### Kitchen (Küche)
- Sieht: **Heute**, Fehlmaterial, Checkliste, Speisekarte, Schicht-Check, Bestellliste, Lager
- Fokus auf Küchen-relevante Tabs

---

## Wo Rollen definiert sind

In `index.html` → `ROLE_TABS` Objekt (ca. Zeile 10646):

```javascript
const ROLE_TABS = {
  admin:    ['heute', 'dashboard', 'kombis', ...alle Tabs...],
  manager:  ['heute', 'dashboard', 'kombis', ...ohne business...],
  employee: ['heute', 'dashboard', 'fehlmaterial', 'checkliste', 'aufgaben', 'schichtcheck', 'bestellung'],
  kitchen:  ['heute', 'fehlmaterial', 'checkliste', 'speisekarte', 'schichtcheck', 'bestellung', 'lager'],
};
```

---

## Benutzer anlegen / verwalten

Benutzer sind in `users.js` gespeichert (diese Datei ist gitignored — nie auf GitHub!).

Format:
```javascript
const USERS = [
  { name: 'Ali', pin: '1234', role: 'admin', label: 'Admin' },
  { name: 'Max', pin: '5678', role: 'employee', label: 'Mitarbeiter' },
  { name: 'Küche', pin: '0000', role: 'kitchen', label: 'Küche' },
];
```

**Wichtig:** `users.js` nie auf GitHub pushen — steht in `.gitignore`.  
Kopie liegt in `users.example.js` (ohne echte PINs).

---

## Login-Ablauf

1. App öffnen → Login-Screen erscheint
2. Name auswählen → PIN eingeben
3. App öffnet sich mit den erlaubten Tabs für diese Rolle
4. Session bleibt bis Browser geschlossen (sessionStorage)
5. "Merken" Button → bleibt auch nach Browser-Neustart (localStorage)
