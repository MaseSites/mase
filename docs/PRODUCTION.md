# ABJ Shop – Production Deployment

> Vollständig server-ready für masesites.ch

## 🚀 Quick Start

### Option 1: Manual Deployment (Recommended)
```bash
chmod +x deploy.sh
./deploy.sh
```

Dann .env bearbeiten und Admin erstellen:
```bash
nano /var/www/abj-shop/.env
cd /var/www/abj-shop
npm run create-admin
```

### Option 2: Docker Deployment
```bash
# .env file mit secrets erstellen
cp .env.production .env
# Geheimnisse eintragen!
nano .env

# Docker-Compose starten
docker-compose up -d

# Admin erstellen
docker-compose exec abj-shop npm run create-admin
```

### Option 3: Kubernetes (Advanced)
Siehe `docs/kubernetes.yaml` für Production-Setup mit HA.

---

## 📋 Checkliste

- ✅ Node.js 18+ installiert
- ✅ PM2 oder Docker konfiguriert
- ✅ .env mit Production-Secrets
- ✅ NGINX + SSL aktiv
- ✅ Datenbank initialisiert
- ✅ Admin-Konto erstellt
- ✅ Logs konfiguriert
- ✅ Backups aktiv

---

## 📖 Vollständige Dokumentation

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für:
- Schritt-für-Schritt Server-Setup
- NGINX-Konfiguration
- SSL/TLS mit Let's Encrypt
- PM2 Cluster-Mode
- Monitoring & Logging
- Fehlerbehebung
- Sicherheit Best-Practices

---

## 🔍 Monitoring

```bash
# PM2 Status
pm2 list
pm2 monit
pm2 logs abj-shop

# Docker Status
docker-compose ps
docker-compose logs -f abj-shop
```

---

## 📊 Performance

- **Instances**: 2 (Cluster-Mode)
- **Memory-Limit**: 1GB pro Prozess
- **Auto-Restart**: ✅
- **Session-Storage**: SQLite in-memory
- **Caching**: Browser-Cache (7-30d)
- **Gzip**: ✅ (Nginx)

---

## 🔐 Security

- HTTPS/SSL ✅
- CSRF-Protection ✅
- Rate-Limiting ✅
- Security Headers ✅
- Input-Sanitization ✅
- Session-Encryption ✅

---

## 📞 Support

Bei Fragen: siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#fehlerbehebung)
