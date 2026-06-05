#!/bin/bash
# Deployment script für masesites.ch
# Verwendung: ./deploy.sh

set -e

echo "🚀 ABJ Shop Deployment für masesites.ch"

# Pfade
DEPLOY_DIR="/var/www/abj-shop"
REPO_URL="https://github.com/MaseSites/mase.git"
BRANCH="ABJ"
DATA_DIR="$DEPLOY_DIR/data"
LOG_DIR="/var/log/abj-shop"
NODE_VERSION="18.0.0"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# 1. Check Node.js Version
log "Prüfe Node.js Version..."
if ! command -v node &> /dev/null; then
  error "Node.js nicht installiert. Bitte installiere Node.js >= $NODE_VERSION"
fi
NODE_INSTALLED=$(node -v | sed 's/v//g')
log "Node.js Version: $NODE_INSTALLED"

# 2. Check/Create Directories
log "Erstelle notwendige Verzeichnisse..."
sudo mkdir -p "$DEPLOY_DIR" "$DATA_DIR" "$LOG_DIR"
sudo chown -R $(whoami):$(whoami) "$DEPLOY_DIR" "$LOG_DIR"

# 3. Clone oder Update Repository
if [ -d "$DEPLOY_DIR/.git" ]; then
  log "Aktualisiere existierendes Repository..."
  cd "$DEPLOY_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  log "Klone Repository..."
  cd "$DEPLOY_DIR" || mkdir -p "$DEPLOY_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" .
fi

# 4. Installiere Dependencies
log "Installiere Abhängigkeiten..."
npm ci --omit=dev

# 5. Create .env from template if not exists
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  log "Erstelle .env Datei..."
  cp "$DEPLOY_DIR/.env.production" "$DEPLOY_DIR/.env"
  warn "WICHTIG: Bitte .env-Datei bearbeiten und geheime Werte eintragen!"
  warn "SESSION_SECRET, CSRF_SECRET, GATE_PASSWORD müssen geändert werden"
fi

# 6. Database Initialization
if [ ! -f "$DATA_DIR/shop.db" ]; then
  log "Initialisiere Datenbank..."
  NODE_ENV=production npm run seed
else
  log "Datenbank existiert bereits, überspringe Seed"
fi

# 7. Check PM2
log "Prüfe PM2..."
if ! command -v pm2 &> /dev/null; then
  log "Installiere PM2 global..."
  sudo npm install -g pm2
fi

# 8. Start/Restart mit PM2
log "Starte Anwendung mit PM2..."
pm2 stop abj-shop 2>/dev/null || true
pm2 delete abj-shop 2>/dev/null || true
pm2 start "$DEPLOY_DIR/src/server.js" \
  --name "abj-shop" \
  --env production \
  --log "$LOG_DIR/app.log" \
  --error "$LOG_DIR/error.log" \
  --merge-logs \
  --instances 2 \
  --exec-mode cluster

pm2 save
pm2 startup

# 9. Nginx Configuration (optional)
log "Für Nginx-Setup: Siehe docs/nginx.conf"

log "${GREEN}✅ Deployment erfolgreich!${NC}"
log "App läuft unter: http://localhost:3008"
log "Logs: $LOG_DIR"
echo ""
echo "Nächste Schritte:"
echo "  1. .env bearbeiten: nano $DEPLOY_DIR/.env"
echo "  2. Admin erstellen: cd $DEPLOY_DIR && npm run create-admin"
echo "  3. NGINX konfigurieren: siehe docs/nginx.conf"
echo "  4. SSL mit Let's Encrypt: sudo certbot certonly -d masesites.ch"
