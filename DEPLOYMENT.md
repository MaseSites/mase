# Deployment Guide - StudioName Website

## 🚀 Quick Start (Lokal)

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npm start

# Option 3: Live-Reload (für Entwicklung)
npm run dev
```

Dann öffne: http://localhost:8000

## 📦 Produktion - Checkliste

### 1️⃣ Konfiguration anpassen

**index.html** (Zeile 69):
```html
<!-- Deine Google Analytics ID eintragen -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-DEINE-ID"></script>
```

**sitemap.xml**:
- Alle `https://www.studioname.ch/` durch deine Domain ersetzen

**script.js** (Zeile 240):
```javascript
// Backend-Endpoint für Formular eintragen
const response = await fetch('https://deine-domain.ch/api/contact', {
  method: 'POST',
  // ...
});
```

**impressum.html**:
- Firmenadresse eintragen
- Handelsregisternummer
- MWST-Nummer

### 2️⃣ Assets erstellen

Erstelle folgende Bilder:
```bash
# Favicons
favicon.svg       # 32x32px, SVG
favicon.png       # 192x192px, PNG
apple-touch-icon.png  # 512x512px, PNG

# Social Media
og-image.jpg      # 1200x630px, JPG
```

**Empfohlene Tools:**
- Favicon: https://realfavicongenerator.net/
- OG-Image: Canva, Figma

### 3️⃣ Optimierung

```bash
# CSS minifizieren
npm run minify:css

# JavaScript minifizieren
npm run minify:js

# HTML validieren
npm run validate
```

Dann in `index.html` die minimizierten Versionen einbinden:
```html
<link rel="stylesheet" href="styles.min.css">
<script defer src="script.min.js"></script>
```

### 4️⃣ Hosting-Optionen

#### Option A: Netlify (Empfohlen für Anfänger)

1. GitHub Repository erstellen
2. Bei Netlify einloggen
3. "New site from Git" → Repository auswählen
4. Deploy!

**Netlify-Features:**
- Kostenloses SSL
- CDN inklusive
- Forms-Backend (für Kontaktformular)
- Automatische Deployments

**netlify.toml** hinzufügen:
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/404_styled.html"
  status = 404
```

#### Option B: Vercel

1. Bei Vercel einloggen
2. "Import Project"
3. Repository verbinden
4. Deploy!

#### Option C: Shared Hosting (cPanel/Plesk)

1. FTP-Zugang besorgen
2. Alle Dateien hochladen
3. SSL-Zertifikat aktivieren (Let's Encrypt)
4. .htaccess prüfen

**FTP-Upload:**
```
/public_html/
  ├── index.html
  ├── styles.css
  ├── script.js
  ├── robots.txt
  ├── sitemap.xml
  ├── .htaccess
  └── ... alle anderen Dateien
```

#### Option D: GitHub Pages

1. Repository auf GitHub
2. Settings → Pages
3. Source: main branch
4. Domain konfigurieren

**Hinweis:** Kein Backend für Formular möglich.

### 5️⃣ Backend für Kontaktformular

#### Option A: Formspree (Kostenlos)

```javascript
// In script.js (Zeile 240)
const response = await fetch('https://formspree.io/f/DEIN-FORM-ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

#### Option B: Netlify Forms

In `index.html` Formular erweitern:
```html
<form ... netlify>
```

#### Option C: Eigenes PHP-Backend

**contact.php:**
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  $to = 'hello@studioname.ch';
  $subject = 'Kontaktanfrage von ' . $data['name'];
  $message = "Name: " . $data['name'] . "\n";
  $message .= "Email: " . $data['email'] . "\n\n";
  $message .= $data['message'];
  
  $headers = 'From: ' . $data['email'];
  
  if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['success' => true]);
  } else {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Senden']);
  }
}
?>
```

### 6️⃣ SSL-Zertifikat aktivieren

**Bei Hosting-Provider:**
1. cPanel → SSL/TLS
2. Let's Encrypt aktivieren
3. Auto-Renewal aktivieren

**In .htaccess** (Zeilen 58-62 auskommentieren):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### 7️⃣ DNS konfigurieren

Bei deinem Domain-Provider:
```
A-Record: @ → Server-IP
A-Record: www → Server-IP
```

Oder für Netlify/Vercel:
```
CNAME: www → your-site.netlify.app
```

### 8️⃣ Testing

**Performance:**
- https://pagespeed.web.dev/
- https://gtmetrix.com/
- https://tools.pingdom.com/

**SEO:**
- https://search.google.com/test/mobile-friendly
- https://validator.w3.org/

**Accessibility:**
- https://wave.webaim.org/
- Chrome DevTools → Lighthouse

**Checkliste:**
- [ ] SSL aktiviert (HTTPS)
- [ ] Mobile-Friendly
- [ ] Ladezeit < 3s
- [ ] Lighthouse Score > 90
- [ ] Alle Links funktionieren
- [ ] Formular testet (empfangen?)
- [ ] 404-Seite funktioniert
- [ ] Cookie-Banner funktioniert
- [ ] Analytics trackt

### 9️⃣ Google Search Console

1. https://search.google.com/search-console
2. Domain/Property hinzufügen
3. Sitemap einreichen: `https://deine-domain.ch/sitemap.xml`
4. Indexierung beantragen

### 🔟 Monitoring

**Uptime-Monitoring:**
- https://uptimerobot.com/ (kostenlos)
- https://www.freshping.io/ (kostenlos)

**Analytics:**
- Google Analytics (bereits eingebaut)
- Alternative: Plausible, Fathom (DSGVO-freundlicher)

## 🔄 Wartung

**Regelmäßig:**
- [ ] SSL-Zertifikat erneuern (Auto)
- [ ] Backups prüfen
- [ ] Analytics checken
- [ ] Inhalte aktualisieren
- [ ] Performance testen

**Monatlich:**
- [ ] Google Search Console checken
- [ ] Lighthouse Audit
- [ ] Broken Links prüfen

**Bei Problemen:**
1. Browser-Cache leeren
2. .htaccess prüfen
3. Error-Log checken
4. Support kontaktieren

## 📞 Support

Bei Fragen:
- E-Mail: hello@studioname.ch
- Telefon: +41 00 000 00 00

---

**Viel Erfolg mit deiner Website! 🚀**

