# 🚀 MASESITES - SCHNELLSTART

## Website starten (SOFORT funktionfähig!)

### Option 1: Python Server (EMPFOHLEN - funktioniert sofort!)

```bash
python server-with-email.py
```

Dann öffne: **http://localhost:8000**

✅ Kontaktformular funktioniert SOFORT
✅ Emails werden an **info@masesites.ch** gesendet (Test-Modus)
✅ Keine Installation nötig

---

### Option 2: Node.js Server (für Produktion)

```bash
# 1. Node.js installieren (falls noch nicht vorhanden)
#    Download: https://nodejs.org

# 2. Dependencies installieren
npm install

# 3. .env Datei konfigurieren (siehe unten)

# 4. Server starten
node server.js
```

---

## 📧 EMAIL-KONFIGURATION (Optional für echten Versand)

### Für Gmail (Einfach & Schnell):

1. **Erstelle ein App-Passwort:**
   - https://myaccount.google.com/security
   - Aktiviere 2-Faktor-Authentifizierung
   - Erstelle App-Passwort für "Mail"
   
2. **Erstelle `.env` Datei:**
   ```
   EMAIL_USER=info@masesites.ch
   EMAIL_PASSWORD=dein-app-passwort-hier
   PORT=8000
   ```

3. **Server neu starten**

---

## 🧪 TEST DAS KONTAKTFORMULAR

1. Öffne: http://localhost:8000/kontakt
2. Fülle das Formular aus
3. Klicke "Anfrage senden"
4. ✅ Du siehst Erfolgsmeldung
5. 📧 Email geht an info@masesites.ch

---

## ❓ PROBLEME?

**Port 8000 bereits belegt?**
→ Ändere in `server-with-email.py` Zeile 13: `PORT = 8001`

**Email wird nicht gesendet?**
→ Im Test-Modus normal! Für echten Versand siehe EMAIL-SETUP.md

**"node" nicht gefunden?**
→ Nutze Python Server: `python server-with-email.py`

---

## 📁 WICHTIGE DATEIEN

- `server-with-email.py` ← Nutze diesen für Schnellstart!
- `server.js` ← Node.js Version (braucht npm install)
- `.env` ← Email-Konfiguration (erstellen falls gewünscht)
- `EMAIL-SETUP.md` ← Ausführliche Anleitung

---

## 🎯 NÄCHSTE SCHRITTE

1. ✅ Server starten
2. ✅ Website testen
3. ✅ Kontaktformular testen
4. 📧 Email konfigurieren (optional)
5. 🚀 Website live schalten

**Viel Erfolg mit MASESites! 🎉**

Bei Fragen: info@masesites.ch | 078 215 89 22

