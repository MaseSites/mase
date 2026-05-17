# 📧 EMAIL-SETUP FÜR MASESITES KONTAKTFORMULAR

## SCHNELLSTART

Das Kontaktformular sendet automatisch Emails an **info@masesites.ch**.

### Option 1: Gmail verwenden (EMPFOHLEN für Start)

1. **Gmail App-Passwort erstellen:**
   - Gehe zu https://myaccount.google.com/security
   - Aktiviere "2-Faktor-Authentifizierung" (falls noch nicht aktiv)
   - Gehe zu "App-Passwörter"
   - Wähle "Mail" und "Sonstiges Gerät"
   - Kopiere das generierte Passwort (16 Zeichen)
   

2. **.env Datei bearbeiten:**
   ```
   EMAIL_USER=info@masesites.ch
   EMAIL_PASSWORD=dein-app-passwort-hier
   PORT=3000
   ```

3. **Server starten:**
   ```bash
   node server.js
   ```

### Option 2: Hosting-Provider SMTP (Infomaniak, Cyon, Hostpoint)

Wenn info@masesites.ch bei einem Hosting-Provider liegt:

1. **.env Datei:**
   ```
   SMTP_HOST=mail.masesites.ch
   SMTP_PORT=587
   SMTP_USER=info@masesites.ch
   SMTP_PASSWORD=dein-email-passwort
   PORT=3000
   ```

2. **server.js anpassen** (siehe unten)

### Option 3: SendGrid (KOSTENLOS bis 100 Emails/Tag)

1. Account erstellen: https://signup.sendgrid.com/
2. API Key erstellen
3. **.env:**
   ```
   SENDGRID_API_KEY=dein-api-key
   EMAIL_USER=info@masesites.ch
   PORT=3000
   ```

---

## TESTEN

1. Server starten: `node server.js`
2. Öffne: http://localhost:3000/kontakt
3. Formular ausfüllen und absenden
4. Prüfe Konsole für Logs
5. Prüfe Email-Posteingang

---

## TROUBLESHOOTING

**"Error sending email"**
- Prüfe .env Datei
- Prüfe App-Passwort (keine Leerzeichen)
- Prüfe 2FA ist aktiviert (bei Gmail)

**"Connection refused"**
- Firewall blockiert Port 587/465
- SMTP-Server Adresse falsch

**Email kommt nicht an**
- Prüfe Spam-Ordner
- Prüfe Server-Logs (node server.js)

---

## PRODUKTIV-DEPLOYMENT

Für Live-Website (masesites.ch):

1. **Umgebungsvariablen** auf Server setzen (nicht .env hochladen!)
2. **HTTPS verwenden** (Let's Encrypt)
3. **Rate Limiting** ist bereits aktiviert (5 Anfragen/15 Min)
4. **Spam-Schutz** Honeypot ist aktiv

### Empfohlene Hosting-Optionen:
- **Vercel/Netlify** + Serverless Function
- **Railway/Render** (automatisches Deployment)
- **Infomaniak/Cyon** (Schweizer Hosting)

---

## WEITERE INFOS

- Server läuft auf Port 3000
- API Endpoint: `/api/contact`
- Formular: `/kontakt.html`
- Emails gehen an: `info@masesites.ch`
- Bestätigungs-Email an User automatisch

