# DESIGN_ANALYSE.md — Pizzeria San Carino App
# Erstellt: 2026-04-20 | Grundlage für Claude Design

---

## 1. ALLE 31 TABS (nach Nav-Gruppen)

| Nav-Gruppe | Tab-ID | Beschreibung |
|---|---|---|
| **Kombis** | `kombis` | Einkaufskombi-Rechner |
| **Einkauf** | `angebote` | Aktuelle Angebote (KW-basiert) |
| | `einkaufsliste` | Einkaufsliste erstellen |
| | `suche` | Live-Preissuche |
| | `upload` | OCR Rechnungs-Upload |
| | `verlauf` | Einkaufshistorie |
| **Lager & Waren** | `lager` | Lagerbestand (Ampel-System) |
| | `wareneinsatz` | Wareneinsatz-Rechner |
| | `preisalarm` | Preisalarm setzen |
| | `standardmaterial` | Standard-Materialliste |
| **Betrieb** | `heute` | Dashboard des Tages |
| | `fehlmaterial` | Fehlmaterial-Liste |
| | `checkliste` | Öffnungs-/Schließroutinen |
| | `bestellung` | Bestellungen verwalten |
| | `schichtcheck` | Schicht-Checkliste |
| **Team** | `dienstplan` | Wochendienstplan |
| | `aufgaben` | Aufgaben-Verwaltung |
| | `mitarbeiter` | Mitarbeiterliste |
| **Analyse** | `dashboard` | Haupt-Dashboard (KPIs) |
| | `speisekarte` | Speisekarte verwalten |
| | `lieferanten` | Lieferanten-Kontakte |
| | `geschaefte` | Preisliste pro Shop |
| | `statistik` | Charts & CSV-Export |
| | `tagesangebote` | Tagesangebote + Marge |
| | `umsatz` | Umsatz & Einnahmen |
| | `gewinn` | Gewinnrechner |
| | `buchhaltung` | Buchhaltung / Kassabuch |
| | `konkurrenz` | Konkurrenz-Analyse |
| | `bewertungen` | Bewertungen |
| **Direkt** | `produkte` | Produktdatenbank |

---

## 2. AKTUELLE FARBEN (CSS Variablen)

### Classic Theme (Standard)
| Variable | Wert | Verwendung |
|---|---|---|
| `--red` | `#8B0000` | Primärfarbe, Buttons, Icons |
| `--red-dark` | `#6a0000` | Hover-Zustand |
| `--red-soft` | `#fff0ee` | Hintergründe, aktive States |
| `--red-border` | `#f0d0cb` | Borders, Trennlinien |
| `--bg` | `#fff8f6` | Body-Hintergrund |
| `--surface` | `#ffffff` | Karten, Header |
| `--text` | `#1a1210` | Haupttext |
| `--text-2` | `#5c4a46` | Sekundärtext |
| `--text-3` | `#7a6460` | Tertiärtext, Labels |
| `--border` | `#e8e8ed` | Karten-Borders |
| `--border-2` | `#f5eeec` | Subtile Trennlinien |

### Dark Navy Theme
| Variable | Wert |
|---|---|
| `--red` | `#e05555` |
| `--bg` | `#0f0f1a` |
| `--surface` | `#1a1a2e` |
| `--text` | `#e8e8ff` |
| `--border` | `#2d2d4a` |

### Dark Red Theme
| Variable | Wert |
|---|---|
| `--red` | `#ff4444` |
| `--bg` | `#110808` |
| `--surface` | `#1e0c0c` |
| `--text` | `#ffe8e8` |
| `--border` | `#3a1818` |

### Glass Theme (Stitch)
| Variable | Wert |
|---|---|
| `--red` | `#e05555` |
| `--bg` | `#0a0b0d` |
| `--surface` | `rgba(255,255,255,0.04)` |
| `--text` | `#e5e7eb` |
| `--border` | `rgba(255,255,255,0.08)` |

### Weitere verwendete Farben (inline, hartcodiert)
| Farbe | Verwendung |
|---|---|
| `#ffdad6` | Fehler-Hintergründe, Error-Badges |
| `#ffebee` | Kritisch-Status (Lager) |
| `#fff3e0` | Käse-Kategorie |
| `#e8f5e9` | OK-Status, Belag-Kategorie |
| `#f3e5f5` | Getränke-Kategorie |
| `#e3f2fd` | Bar-Kategorie |
| `#c62828` | Kritisch-Rot |
| `#f57f17` | Niedrig-Orange |
| `#2e7d32` | OK-Grün |
| `#D4AF37` | Business-Gold |
| `#1a1a2e` | Business-Dark |

---

## 3. TYPOGRAPHY

| Verwendung | Font | Gewicht |
|---|---|---|
| Headlines / Titel | `Plus Jakarta Sans` | 400–800 |
| Body / Interface | `Inter` | 400–700 |
| Basis-Schriftgröße | 15px | — |
| Zeilenhöhe | 1.6 | — |

---

## 4. WICHTIGE CSS-KLASSEN

### Karten
| Klasse | Beschreibung |
|---|---|
| `.ws-card` | Standard-Karte (border-radius:16px, shadow) |
| `.ws-card-sm` | Kleine Karte (padding:18px) |
| `.stat-card` | KPI-Karte mit Icon links |
| `.stat-icon` | Icon-Container (54×54px, border-radius:14px) |
| `.stat-num` | Große Zahl in KPI-Karte |
| `.stat-label` | Label unter KPI-Zahl |
| `.bento-hero` | Großes Bento-Element |
| `.bento-small` | Kleines Bento-Element |
| `.stitch-card` | Glass/Stitch Design Karte |

### Buttons
| Klasse | Beschreibung |
|---|---|
| `.ws-btn` | Basis-Button |
| `.ws-btn-primary` | Rot gefüllt (Hauptaktion) |
| `.ws-btn-secondary` | Weißer Umriss-Button |
| `.ws-btn-ghost` | Transparenter Button |
| `.ws-btn-sm` | Kleiner Button |
| `.btn-checkout` | Kauf-Abschluss Button (gradient) |

### Navigation
| Klasse | Beschreibung |
|---|---|
| `#app-header` | Sticky Header (70px) |
| `#staff-tab-bar` | Sticky Tab-Nav unter Header |
| `.tab-btn` | Einzel-Tab Button |
| `.tab-btn.tab-active` | Aktiver Tab (roter Unterstrich) |
| `.nav-grp-dd` | Dropdown-Menü |
| `.dd-item` | Dropdown-Eintrag |
| `#mobile-bottom-nav` | Mobile Bottom-Navigation |
| `.mob-nav-btn` | Mobile Nav-Button |
| `#mehr-drawer` | Mobile Drawer (mehr Tabs) |

### Formular
| Klasse | Beschreibung |
|---|---|
| `.ws-input` | Text-Input (border-radius:10px) |
| `.ws-label` | Input-Label (uppercase, 12px) |
| `.ws-section-title` | Abschnitts-Titel (20px, bold) |
| `.ws-section-header` | Header-Row mit Titel + Button |
| `.filter-chip` | Filter-Pill (border-radius:20px) |
| `.ws-badge` | Status-Badge |
| `.ws-table` | Datentabelle |

---

## 5. LAYOUT

| Bereich | Wert |
|---|---|
| Max-Breite | 1400px |
| Header-Höhe | 70px (60px mobile) |
| Tab-Bar-Höhe | 56px |
| Padding Desktop | 40px links/rechts |
| Padding Tablet | 24px links/rechts |
| Padding Mobile | 16px links/rechts |
| Border-Radius Karten | 16–20px |
| Border-Radius Buttons | 10–13px |
| Bottom-Nav (Mobile) | 72px fix unten |

---

## 6. PROBLEME DIE BEIM REDESIGN GELÖST WERDEN MÜSSEN

1. **Glass-Theme:** Hartcodierte helle Inline-Farben überschreiben das Dark-Design
2. **Kategorie-Karten (Lager):** Benutzen `linear-gradient(#ffebee,#fff)` — nicht theme-aware
3. **Inputs in JS-Render:** `background:#fff` hartcodiert — wird in Glass nicht überschrieben
4. **Kontrast:** In Glass-Mode sind manche Texte kaum lesbar
5. **Einheitlichkeit:** Manche Tabs verwenden eigene Inline-Styles statt CSS-Klassen

---

## 7. WAS GUT FUNKTIONIERT (behalten)

- Farbpalette Rot (#8B0000) ist stark und erkennbar
- Karten-Design mit Schatten und border-radius sieht professionell aus
- Business-Mode (Gold auf Dunkel) ist sehr gut
- Mobile Bottom-Navigation ist gut strukturiert
- Blur/Backdrop-Filter im Glass-Theme ist optisch schön
