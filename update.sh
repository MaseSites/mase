#!/bin/sh
# masesites – neue Version vom Repo holen und ausrollen.
#
#   ./update.sh
#
# Holt den neusten Stand, baut die Website neu (dabei wird auch das
# Wissen des Chat-Assistenten aus den Seiten neu erzeugt) und startet
# die Dienste ohne Unterbruch des Modells.

set -e
cd "$(dirname "$0")"

git pull --ff-only
docker compose up -d --build web
docker image prune -f >/dev/null

echo "Aktualisiert. Stand:"
git log --oneline -1
