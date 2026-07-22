# masesites – Website samt Node-Backend.
# Bewusst schlank: keine Abhängigkeiten ausser Node selbst.

FROM node:22-alpine

WORKDIR /app
COPY . .

# Datenordner für Datenbank, Logs und Projektanfragen
RUN mkdir -p /daten
ENV MS_DATEN=/daten
ENV PORT=8080
EXPOSE 8080

# Beim Start wird das Website-Wissen frisch aus den HTML-Seiten erzeugt,
# damit der Assistent nach jeder Inhaltsänderung aktuell ist.
CMD ["sh", "-c", "node scripts/wissen.js && node server/server.js"]
