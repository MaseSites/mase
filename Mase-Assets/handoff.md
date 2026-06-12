# MASE Design System — Handoff Dokument
**Stand: 22. Mai 2026**
**Projekt:** MASESites Website + Admin Dashboard
**Repo:** https://github.com/MaseSites/mase.git
**Live:** https://masesites.ch
**Admin:** https://masesites.ch/admin
**Backend (Railway):** https://mase-production.up.railway.app

---

## 1. HEADER — Glassmorphism entfernt, solid background

**Problem:** Header hatte `backdrop-filter` / Glassmorphism-Effekt, dunkler Modus zeigte ein "komisches Viereck" um die Desktop-Navigation.

**Root Cause:** `.dark .site-nav` (CSS-Spezifität 0-2-0) überschrieb `@media (min-width:1180px) .site-nav` (Spezifität 0-1-0).

**Fixes in `styles.css`:**
- `--header-bg`: `#ffffff` (light) / `#0d1117` (dark) — solid, kein rgba
- `.site-header`: `backdrop-filter` entfernt, `background: var(--bg)`, `border-bottom: 1px solid var(--border)`
- `.site-header--scrolled`: nur `box-shadow` (kein Blur)
- Desktop-Media-Query: `.dark .site-nav { background: transparent; border: none; box-shadow: none; }` — behebt Spezifitäts-Bug
- Nav inactive Links dark: `rgba(255,255,255,0.6)`
- Nav active dark: `color: #ffffff; background: rgba(255,255,255,0.1)`
- CTA Button: `.dark .site-nav a:not(.button)` (mit `:not(.button)`) — verhindert dass `.dark .site-nav a` den Button-Text halbtransparent macht
- `.site-nav .button-primary, .dark .site-nav .button-primary { color: #ffffff !important; }`

---

## 2. SCHRIFTEN — Alle Headings vereinheitlicht

**Problem:** `h1` nutzte Playfair Display (Serif), Rest DM Sans → inkonsistent.

**Fix in `styles.css`:**
```css
h1, h2, h3 {
  font-family: "DM Sans", system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
```
- Playfair Display komplett entfernt aus h1-Regel

---

## 3. HINTERGRUND-GLOWS — Professionelles Flair-System

**Änderungen in `flair.css`:**
- `.mase-spray`: global `display:none !important`, nur im Dark Mode aktiv (`display:block !important`)
- Blob-Farben auf professionelles Blau/Teal/Cyan beschränkt (kein Lila, kein Gelb):
  - s1: `rgba(13,148,136,0.50)` — Teal
  - s2: `rgba(37,99,235,0.40)` — Blau
  - s3: `rgba(6,182,212,0.38)` — Cyan
  - s4: `rgba(14,116,144,0.35)` — Dark Cyan
  - s5: `rgba(20,184,166,0.32)` — Teal Light
  - s6: `rgba(56,189,248,0.36)` — Sky
- `mix-blend-mode: screen` auf Blobs im Dark Mode
- Section-Background Opacity: 88% → 72% (Glows scheinen durch)
- Hero-Glow: `filter: blur(20px)` (seriöser, weniger aufdringlich)
- Card-Shimmer: `rgba(255,255,255,0.28)`

---

## 4. "AG" ENTFERNT — Überall auf der Website

**Grund:** MASESites ist keine Aktiengesellschaft.

**Geänderte Dateien:**

### HTML-Dateien (alle):
- `index.html`, `kontakt.html`, `preise.html`, `leistungen.html`, `ki-assistent.html`, `ueber-uns.html`, `impressum.html`, `datenschutz.html`, `danke.html`, `404.html`, `404_styled.html`
- `<title>`: "MASESites AG" → "MASESites"
- Alle `og:title`, `og:site_name`, `twitter:title` Meta-Tags
- Schema JSON-LD `"name"` Felder
- Footer Copyright
- Cache-Versionen auf `?v=20260522j` gebumpt

### JavaScript:
- `theme.js`: Alle 3 Sprachen (DE/EN/FR) — `hero_eyebrow`, `about_page_story_p1_html`, Impressum-Blöcke, `ktx_placeholder_company: 'Firma'`
- `ai-assistant.js`: System-Prompt und Response-Templates
- `server.js`: E-Mail `from`-Feld und Subject-Line

### Sonstige:
- `manifest.json`: `"name": "MASESites"`
- `package.json`: description und author

### Google Search Cache:
- Code ist korrekt — Google zeigt noch den alten Cache
- **Lösung:** IndexNow Submission durchgeführt (HTTP 202 ✅)
- Sitemap `lastmod` auf 2026-05-22 aktualisiert
- Google Search Console noch nicht verifiziert (manuell einrichten unter search.google.com/search-console)

---

## 5. LOGO & FAVICON

**Quelle:** `C:\Users\sever\OneDrive\Desktop\°\Mase\Logo.png` (MS-Monogramm, blau/gold)

**Geänderte Dateien:**
- `logo.png` — Header-Logo (40×40px)
- `favicon.png` — Browser-Tab Icon
- `apple-touch-icon.png` — iOS Home Screen

**CSS in `styles.css`:**
```css
.logo-img {
  display: block;
  height: 40px;
  width: 40px;
  object-fit: contain;
  border-radius: 8px;
}
```

**HTML in allen Seiten:**
```html
<a class="logo" href="index.html">
  <img src="/logo.png" alt="MASE" class="logo-img">
</a>
```
- `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` entfernt (ersetzt durch PNG)

---

## 6. INDEXNOW — Schnellere Google/Bing Indexierung

**Key-Datei:** `d8f3a2c1e4b5967f0d1e2c3b4a5f6e7d.txt` (im Root)
**Submission:** HTTP 202 Accepted von `api.indexnow.org`
**Eingereichte URLs:**
- https://www.masesites.ch/
- https://www.masesites.ch/leistungen
- https://www.masesites.ch/preise
- https://www.masesites.ch/ki-assistent
- https://www.masesites.ch/ueber-uns
- https://www.masesites.ch/kontakt
- https://www.masesites.ch/impressum
- https://www.masesites.ch/datenschutz

**Hinweis:** IndexNow verteilt an Bing, Yandex etc. — nicht direkt an Google. Für Google: Google Search Console manuell einrichten.

---

## 7. RAILWAY BACKEND DEPLOYMENT

**Grund:** Hosttime.ch (Hosting-Provider) nutzt nginx als statischen File-Server — `server.js` (Node.js/Express) lief nicht auf Production. Admin Dashboard `/api/admin/auth` gab 404 zurück.

### Was deployed wurde:
- **URL:** https://mase-production.up.railway.app
- **Repo:** MaseSites/mase (auto-deploy bei Push auf `main`)
- **Start-Command:** `node server.js`

### Erstellte/geänderte Dateien:

**`railway.json`** (neu):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**`server.js`** Änderungen:
- `trust proxy`: `false` → dynamisch (`process.env.RAILWAY_ENVIRONMENT ? 1 : false`)
- CORS `methods`: `['GET', 'POST', 'OPTIONS']` → `['GET', 'POST', 'PATCH', 'OPTIONS']`
- CORS `allowedHeaders`: `Authorization` hinzugefügt

**`admin/index.html`** Änderung:
```javascript
var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? ''
  : 'https://mase-production.up.railway.app';
```
- Alle `/api/admin/auth`, `/api/admin/data/...` Calls nutzen jetzt `API_BASE + '/api/...'`

### Railway Environment Variables (eingetragen):
```
ADMIN_PASSWORD=<sicheres PW — per E-Mail gesendet>
ADMIN_TOKEN=<sicherer Token — per E-Mail gesendet>
SUPABASE_URL=https://kxeorjgabvtplmdygbph.supabase.co
SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_KEY_REDACTED
SMTP_HOST=mail.masesites.ch
SMTP_PORT=587
SMTP_USER=info@masesites.ch
SMTP_PASSWORD=<aus .env>
EMAIL_TO=info@masesites.ch
SMTP_TLS_SERVERNAME=masesites.ch
NODE_ENV=production
CORS_ORIGINS=https://masesites.ch,https://www.masesites.ch
```

---

## 8. ADMIN DASHBOARD PASSWORT

- Neues sicheres Passwort generiert (20 Zeichen, mixed case + Zahlen + Symbole)
- Neuer Admin Token generiert (64 hex chars)
- **Beides per E-Mail gesendet an:** severin.buerki9@gmail.com
- **In Railway eintragen:** Variables → `ADMIN_PASSWORD` und `ADMIN_TOKEN` überschreiben
- **Lokal:** `.env` Datei anpassen (`C:\Users\sever\OneDrive\Desktop\MASE Design System\.env`)

---

## 9. DEPLOYMENT WORKFLOW

```
Lokale Änderung → git add → git commit → git push origin main
                                                    ↓
                                        GitHub (MaseSites/mase)
                                                    ↓
                              Railway: auto-deploy server.js (API)
                              Hosttime: manueller Pull / auto-sync (Static Files)
```

**Wichtig:** Hosttime.ch zieht statische Dateien nicht automatisch von GitHub. Nach jedem Push müssen die Dateien manuell auf den Hosttime-Server hochgeladen werden (FTP/Plesk) ODER ein Auto-Deploy-Webhook eingerichtet werden.

---

## 10. OFFENE PUNKTE

| Aufgabe | Status | Priorität |
|---------|--------|-----------|
| Google Search Console verifizieren (masesites.ch) | ❌ offen | Mittel |
| Hosttime Auto-Deploy von GitHub einrichten | ❌ offen | Hoch |
| Railway neues Passwort in Variables eintragen | ❌ offen | Hoch |
| Lokale `.env` mit neuem Passwort aktualisieren | ❌ offen | Mittel |
| Admin Dashboard testen (masesites.ch/admin) | ❌ offen | Hoch |

---

## 11. WICHTIGE DATEIPFADE

```
MASE Design System/
├── index.html              # Startseite
├── server.js               # Node.js Backend (lokal + Railway)
├── styles.css              # Haupt-Stylesheet
├── flair.css               # Background-Glow System (Dark Mode)
├── theme.js                # i18n DE/EN/FR Übersetzungen
├── ai-assistant.js         # KI-Assistent Logik
├── supabase-config.js      # Supabase Public Keys (Frontend)
├── sitemap.xml             # SEO Sitemap (lastmod: 2026-05-22)
├── manifest.json           # PWA Manifest
├── railway.json            # Railway Deployment Config
├── .env                    # Lokale Credentials (NICHT committen!)
├── logo.png                # Header Logo + Favicon Source
├── favicon.png             # Browser Tab Icon
├── apple-touch-icon.png    # iOS Icon
├── d8f3a2c1e4b5967f0d1e2c3b4a5f6e7d.txt  # IndexNow Key
└── admin/
    └── index.html          # Admin Dashboard (Login + Daten)
```

---

## 12. GIT COMMIT HISTORY (letzte Änderungen)

```
bacd4e4  Set Railway API URL for production admin dashboard
7220403  Add Railway deploy config, fix CORS PATCH+Auth header, add API_BASE
1ae4b53  Update sitemap lastmod to 2026-05-22, add IndexNow key
7287bbc  Remove 'AG' from 404.html
e00eaef  Remove remaining 'AG' from manifest, package.json and form placeholder
929a344  Add real logo image to header and browser tab (favicon)
34d1ddf  Remove 'AG' from all pages and JS files
6591875  UI: Header, Schriften, Hintergrund-Glows & Preisseite verbessert
```
