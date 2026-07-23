#!/bin/sh
# masesites – Server-Einrichtung mit einem Befehl.
#
#   sudo ./setup.sh
#
# Installiert Docker (falls es fehlt), startet Website + Ollama und
# wartet, bis das Sprachmodell geladen ist. Danach läuft alles –
# auch nach einem Neustart des Servers (restart: unless-stopped).
#
# Voraussetzungen: Linux-Server mit Root-Zugang und mindestens
# 6 GB RAM (empfohlen 8 GB). Ein normaler Webhosting-Speicherplatz
# reicht NICHT – das Sprachmodell ist ein eigenes Programm.

set -e
cd "$(dirname "$0")"

if [ "$(id -u)" != "0" ]; then
  echo "Bitte als root ausführen:  sudo ./setup.sh"
  exit 1
fi

# --- RAM prüfen (Warnung, kein Abbruch) --------------------------------
RAM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)
if [ "$RAM_KB" -gt 0 ] && [ "$RAM_KB" -lt 6000000 ]; then
  echo "WARNUNG: Nur $((RAM_KB / 1024)) MB RAM gefunden. Das 3B-Modell"
  echo "braucht rund 4–6 GB. Es kann eng werden oder abstürzen."
  echo "Weiter in 5 Sekunden … (Strg+C zum Abbrechen)"
  sleep 5
fi

# --- Docker installieren, falls es fehlt -------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker fehlt – wird installiert (offizielles Skript von get.docker.com) …"
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "FEHLER: 'docker compose' ist nicht verfügbar."
  echo "Bitte das Compose-Plugin installieren (Paket docker-compose-plugin)."
  exit 1
fi

# --- Stack starten -----------------------------------------------------
echo "Starte Website und Sprachmodell …"
docker compose up -d --build

# --- Warten, bis das Modell bereit ist ---------------------------------
# Beim ersten Start werden rund 2 GB heruntergeladen – das kann je nach
# Leitung 5 bis 20 Minuten dauern. Die Website läuft schon vorher; der
# Chat-Knopf erscheint automatisch, sobald das Modell antwortet.
echo "Warte auf das Modell (erster Start: Download von ~2 GB) …"
i=0
while [ $i -lt 240 ]; do
  if curl -s http://localhost:8080/api/ki/status 2>/dev/null | grep -q '"bereit":true'; then
    echo
    echo "==========================================="
    echo "Fertig! Website läuft auf Port 8080."
    echo "Der Chat-Assistent ist bereit."
    echo
    echo "Admin-Startpasswort anzeigen:"
    echo "  docker compose exec web cat /daten/admin-startpasswort.txt"
    echo
    echo "HTTPS mit eigener Domain (Zertifikat automatisch):"
    echo "  DOMAIN=deine-domain.ch docker compose --profile https up -d"
    echo "==========================================="
    exit 0
  fi
  i=$((i + 1))
  sleep 5
done

echo
echo "Das Modell ist nach 20 Minuten noch nicht bereit."
echo "Fortschritt ansehen:  docker compose logs -f modell"
echo "Die Website selbst läuft bereits auf Port 8080; der Chat-Knopf"
echo "erscheint von selbst, sobald das Modell fertig geladen ist."
exit 1
