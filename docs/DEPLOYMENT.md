# 🚀 Deployment Guide für ABJ Shop auf masesites.ch

## Übersicht

Diese Anleitung beschreibt den Deployment des ABJ Shops unter:
- **URL**: https://masesites.ch/testserver/client/0192481/site/abj
- **App-Port**: 3008 (intern)
- **Branch**: ABJ
- **Node.js**: ≥18.0.0
- **PM2**: Process Manager für Cluster-Mode

---

## 1. Server-Vorbereitung

### Anforderungen
- Ubuntu/Debian Server mit SSH-Zugriff
- Node.js 18+ installiert
- Nginx als Reverse Proxy
- Let's Encrypt Zertifikat für masesites.ch
- Sudo-Rechte für Deployment

### System-Update
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential python3-dev
```

### Node.js Installation (falls nicht vorhanden)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### PM2 Installation
```bash
sudo npm install -g pm2 pm2-logrotate
pm2 startup
pm2 save
```

---

## 2. Repository klonen & Deployment

### Automatic Deployment mit Script
```bash
# Clone repository
cd /tmp
git clone -b ABJ https://github.com/MaseSites/mase.git abj-deployment
cd abj-deployment

# Deployment script ausführbar machen
chmod +x deploy.sh

# Deployment durchführen
./deploy.sh
```

### Manual Deployment
```bash
# 1. Verzeichnis erstellen
sudo mkdir -p /var/www/abj-shop
sudo chown -R $(whoami):$(whoami) /var/www/abj-shop

# 2. Repository klonen
cd /var/www/abj-shop
git clone -b ABJ https://github.com/MaseSites/mase.git .
git checkout ABJ

# 3. Dependencies installieren
npm ci --omit=dev

# 4. Environment-Datei erstellen
cp .env.production .env
# WICHTIG: .env mit Production-Secrets bearbeiten!
nano .env
```

### Geheimnisse generieren
```bash
# SESSION_SECRET und CSRF_SECRET generieren
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('CSRF_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Datenbank & Admin

### Datenbank initialisieren
```bash
cd /var/www/abj-shop

# Seed mit Test-Daten
NODE_ENV=production npm run seed

# Admin-Konto erstellen
npm run create-admin
# Folge den Prompts: E-Mail und Passwort eingeben
```

### Bestandsdaten importieren (optional)
```bash
npm run populate-inventory
```

---

## 4. PM2 Setup

### App starten
```bash
# Mit ecosystem.config.js
pm2 start ecosystem.config.js --env production

# Oder manuell
pm2 start src/server.js \
  --name "abj-shop" \
  --env production \
  --instances 2 \
  --exec-mode cluster
```

### PM2 Befehle
```bash
pm2 list                    # Zeige laufende Prozesse
pm2 logs abj-shop          # Echtzeitlogs
pm2 logs abj-shop --err    # Nur Error-Logs
pm2 monit                  # Monitor (CPU, Memory)
pm2 reload abj-shop        # Sanftes Reload (0 Downtime)
pm2 restart abj-shop       # Neustart
pm2 stop abj-shop          # Stoppen
pm2 delete abj-shop        # Löschen
```

### Auto-Restart bei Server-Reboot
```bash
pm2 save
pm2 startup
```

---

## 5. Nginx Konfiguration

### NGINX installieren
```bash
sudo apt install -y nginx
```

### Config aufsetzen
```bash
# Nginx-Config kopieren
sudo cp docs/nginx.conf /etc/nginx/sites-available/abj-shop

# Aktivieren
sudo ln -s /etc/nginx/sites-available/abj-shop /etc/nginx/sites-enabled/

# Alte Default-Config deaktivieren (optional)
sudo rm /etc/nginx/sites-enabled/default

# Syntax prüfen
sudo nginx -t

# Neu laden
sudo systemctl restart nginx
```

### SSL mit Let's Encrypt
```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# Zertifikat beantragen
sudo certbot certonly --standalone -d masesites.ch -d www.masesites.ch

# Auto-Renewal aktivieren
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Nginx neu laden
```bash
sudo systemctl restart nginx
```

---

## 6. Logs & Monitoring

### Log-Verzeichnisse
```bash
# App-Logs
/var/log/abj-shop/app.log
/var/log/abj-shop/error.log

# Nginx-Logs
/var/log/nginx/abj-shop-access.log
/var/log/nginx/abj-shop-error.log
```

### Real-time Logs
```bash
# PM2 Logs
pm2 logs abj-shop

# Nginx Access
sudo tail -f /var/log/nginx/abj-shop-access.log

# System-Logs
sudo journalctl -u nginx -f
```

### PM2 Monitoring
```bash
pm2 monit
```

---

## 7. Backups & Wartung

### Datenbank-Backup
```bash
# Manuelles Backup
cp /var/www/abj-shop/data/shop.db /backup/shop.db.$(date +%Y%m%d_%H%M%S)

# Cronjob für tägliches Backup
sudo crontab -e
# Hinzufügen:
0 3 * * * cp /var/www/abj-shop/data/shop.db /backup/shop.db.$(date +\%Y\%m\%d)
```

### Log-Rotation
```bash
# PM2 Log-Rotation
pm2 install pm2-logrotate

# Nginx Log-Rotation (default aktiv)
sudo logrotate /etc/logrotate.d/nginx
```

---

## 8. Updates & Deployment

### Updates einspielen
```bash
cd /var/www/abj-shop

# Latest Code holen
git fetch origin
git pull origin ABJ

# Dependencies aktualisieren (falls benötigt)
npm ci --omit=dev

# Zero-Downtime Reload
pm2 reload abj-shop
```

### Datenbank-Migrationen (falls nötig)
```bash
npm run seed  # Oder spezifisches Migrations-Script
pm2 reload abj-shop
```

---

## 9. Fehlerbehebung

### App startet nicht
```bash
# Logs prüfen
pm2 logs abj-shop --err

# PORT 3008 in Verwendung?
lsof -i :3008
kill -9 <PID>

# .env korrekt?
cat /var/www/abj-shop/.env | grep NODE_ENV
```

### Nginx zeigt 502 Bad Gateway
```bash
# Ist Node.js am Laufen?
pm2 list

# Port 3008 offen?
netstat -tlnp | grep 3008

# Nginx-Logs prüfen
sudo tail -20 /var/log/nginx/abj-shop-error.log
```

### Hohe CPU/Memory-Nutzung
```bash
# PM2 Monit
pm2 monit

# Top-Prozesse
top

# Memory-Limit setzen (ecosystem.config.js)
max_memory_restart: '1G'
```

### SSL-Zertifikat abgelaufen
```bash
# Certbot erneuern (läuft automatisch via cron)
sudo certbot renew

# Manuell testen
sudo certbot renew --dry-run
```

---

## 10. Sicherheit

### Firewall konfigurieren
```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

### Secrets in .env
```
SESSION_SECRET=<sehr-lange-zufallszeichenkette>
CSRF_SECRET=<andere-lange-zufallszeichenkette>
GATE_PASSWORD=<sicheres-passwort>
COOKIE_SECURE=true        # Nur über HTTPS
```

### Fail2Ban (optional, gegen Brute-Force)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Checkliste für Live-Deployment

- [ ] Node.js 18+ installiert
- [ ] PM2 installiert & startup konfiguriert
- [ ] Repository geklont (ABJ Branch)
- [ ] .env mit Production-Secrets erstellt
- [ ] npm ci --omit=dev durchgeführt
- [ ] Datenbank initialisiert (npm run seed)
- [ ] Admin-Konto erstellt (npm run create-admin)
- [ ] PM2 startet App erfolgreich
- [ ] Nginx konfiguriert & SSL aktiv
- [ ] URL erreichbar: https://masesites.ch/testserver/client/0192481/site/abj
- [ ] Admin-Dashboard funktioniert
- [ ] Logs werden geschrieben
- [ ] Backups konfiguriert
- [ ] Monitoring aktiv (PM2 monit)

---

## Support

Bei Problemen:
1. Logs prüfen: `pm2 logs abj-shop`
2. Server-Zustand: `pm2 monit`
3. Error-Logs: `sudo tail -50 /var/log/nginx/abj-shop-error.log`
4. Node-Version: `node --version` (sollte >= 18.0.0 sein)
