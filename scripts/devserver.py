#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
masesites – lokaler Entwicklungs-Server (NUR ZUM ANSCHAUEN, kein Backend!).

Warum: Live laeuft masesites auf PHP (api.php, Plesk) bzw. Node (server/server.js,
braucht Node >= 22.5). Beides ist auf diesem Rechner nicht startbar. Dieser Server
braucht nur Python (Standardbibliothek) und tut zwei Dinge:

  1. liefert die statischen Seiten mit "sauberen" URLs aus (/preise -> preise.html),
  2. beantwortet die /api/...-Aufrufe mit BEISPIELDATEN (Mock), damit man Startseite,
     Chat-Widget und Admin lokal durchklicken kann.

WICHTIG: Der Mock speichert nichts dauerhaft, verschluesselt nichts und ruft KEINE
echte KI. Fuer den echten KI-Bot + echte Termine zaehlt allein das PHP-/Node-Backend
auf dem Server. Niemals als Produktions-Server verwenden.

Start:  python scripts/devserver.py 8091
"""

import json
import os
import sys
import time
import posixpath
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MIME = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
    ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
    ".map": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8",
}

# ---- Mock-Zustand (nur im Speicher, pro Serverlauf) --------------------------

def _jetzt_minus(sekunden):
    return int((time.time() - sekunden) * 1000)

STAND = {
    "termine": [
        {"db_id": 3, "id": "T-1003", "zeit": _jetzt_minus(3600), "status": "offen",
         "name": "Anna Muster", "kontakt": "anna@example.ch", "wunsch": "naechsten Dienstag nachmittag",
         "thema": "Neue Website fuers Cafe", "anmerkung": "", "kontoLabel": "Gast ab12cd"},
        {"db_id": 2, "id": "T-1002", "zeit": _jetzt_minus(86400), "status": "offen",
         "name": "Beat Keller", "kontakt": "079 123 45 67", "wunsch": "diese Woche telefonisch",
         "thema": "KI-Bot fuer bestehende Seite", "anmerkung": "am liebsten morgens", "kontoLabel": "Gast 9f3a1b"},
        {"db_id": 1, "id": "T-1001", "zeit": _jetzt_minus(3 * 86400), "status": "bestaetigt",
         "name": "Clara Rossi", "kontakt": "clara@example.it", "wunsch": "20.07. 14 Uhr",
         "thema": "Webshop", "anmerkung": "", "kontoLabel": "clara@example.it"},
    ],
    "ki": {"provider": "groq", "modell": "", "standard": "openai/gpt-oss-120b",
           "an": True, "konfiguriert": True},
    "botlogs": [
        {"zeit": _jetzt_minus(3600), "konto": "Gast ab12cd", "seite": "index.html",
         "von": "besucher", "text": "Was kostet eine Website?"},
        {"zeit": _jetzt_minus(3599), "konto": "Gast ab12cd", "seite": "index.html",
         "von": "bot", "text": "Eine neue Website gibt es ab CHF 790. Auf /preise findest du alle Pakete im Vergleich."},
    ],
    "naechste_id": 4,
}

DEMO_BEISPIELE = [
    {"id": "B-95369c68", "name": "Restaurant", "branche": "Gastronomie",
     "beschreibung": "Warmes Gold-auf-Creme-Design mit Speisekarte in Kategorie-Tabs.",
     "url": "/beispiel-demos/restaurant/", "bild": "assets/img/demos/restaurant-portfolio.webp"},
    {"id": "B-5e3f34c6", "name": "Reinigung", "branche": "Reinigung",
     "beschreibung": "Frisches Orange mit Vorher/Nachher-Regler und Offerte.",
     "url": "/beispiel-demos/reinigung/", "bild": "assets/img/demos/reinigung-portfolio.webp"},
    {"id": "B-30c72769", "name": "Coiffeur", "branche": "Coiffeur",
     "beschreibung": "Eleganter Salon-Look mit Leistungen und Preisen.",
     "url": "/beispiel-demos/coiffeur/", "bild": "assets/img/demos/coiffeur-portfolio.webp"},
    {"id": "B-dde68005", "name": "Bauunternehmen", "branche": "Handwerk & Bau",
     "beschreibung": "Firmenauftritt mit Projektreferenzen und Leistungsübersicht.",
     "url": "/beispiel-demos/bauunternehmen/", "bild": "assets/img/demos/bauunternehmen-portfolio.webp"},
    {"id": "B-9edf0bce", "name": "Gartenbau", "branche": "Garten & Landschaft",
     "beschreibung": "Ruhiger Naturlook für Gartenbau, Unterhalt und Bepflanzung.",
     "url": "/beispiel-demos/gartenbau/", "bild": "assets/img/demos/gartenbau-portfolio.webp"},
    {"id": "B-0a6deea6", "name": "Maler & Gipser", "branche": "Handwerk",
     "beschreibung": "Handwerklicher Auftritt mit Referenzfotos und Leistungen.",
     "url": "/beispiel-demos/maler-gipser/", "bild": "assets/img/demos/maler-gipser-portfolio.webp"},
    {"id": "B-eceb26cd", "name": "Autogarage", "branche": "Auto & Garage",
     "beschreibung": "Garagen-Auftritt mit MFK, Reifenhotel und TWINT.",
     "url": "/beispiel-demos/autogarage/", "bild": "assets/img/demos/autogarage-portfolio.webp"},
    {"id": "B-tavolo", "name": "tavolo – Restaurant-Software", "branche": "Webapp",
     "beschreibung": "Reservierungen, Kalender, Menüs, Schichten und Preisrechner.",
     "url": "/beispiel-demos/tavolo.html", "bild": "assets/img/demos/tavolo-portfolio.webp"},
    {"id": "B-kosmetik", "name": "Hautnah Atelier", "branche": "Kosmetik & Beauty",
     "beschreibung": "Editorialer Look mit Behandlungsfilter und Terminanfrage.",
     "url": "/beispiel-demos/kosmetik/", "bild": "assets/img/demos/kosmetik-portfolio.webp"},
    {"id": "B-baeckerei", "name": "Brot & Butter", "branche": "Bäckerei",
     "beschreibung": "Plakative Backstuben-Optik mit Sortiment und Vorbestellung.",
     "url": "/beispiel-demos/baeckerei/", "bild": "assets/img/demos/baeckerei-portfolio.webp"},
    {"id": "B-fahrschule", "name": "Vorwärts", "branche": "Fahrschule",
     "beschreibung": "Dynamischer Auftritt mit Lernziel-Auswahl und Anfrage.",
     "url": "/beispiel-demos/fahrschule/", "bild": "assets/img/demos/fahrschule-portfolio.webp"},
    {"id": "B-optik", "name": "Klar Optik", "branche": "Optiker",
     "beschreibung": "Swiss-Minimal mit Fassungsfilter und Terminanfrage.",
     "url": "/beispiel-demos/optik/", "bild": "assets/img/demos/optik-portfolio.webp"},
    {"id": "B-metzgerei", "name": "Die Werkbank", "branche": "Metzgerei",
     "beschreibung": "Handwerklich-editorial mit Sortiment und Partyservice.",
     "url": "/beispiel-demos/metzgerei/", "bild": "assets/img/demos/metzgerei-portfolio.webp"},
    {"id": "B-arztpraxis", "name": "Praxis am Park", "branche": "Arztpraxis",
     "beschreibung": "Vertrauensvoller Auftritt mit Sprechzeiten und Terminanfrage.",
     "url": "/beispiel-demos/praxis/", "bild": "assets/img/demos/praxis-portfolio.webp"},
    {"id": "B-hotel", "name": "The Hotel", "branche": "Hotel & Hospitality",
     "beschreibung": "Cineastischer Auftritt mit Zimmern, Dining und Buchungsanfrage.",
     "url": "/beispiel-demos/hotel/", "bild": "assets/img/demos/hotel-portfolio.webp"},
    {"id": "B-fachgeschaeft", "name": "BOUTIQ", "branche": "Fachgeschäft & Retail",
     "beschreibung": "Editorialer Store-Look mit Video-Hero, Sortiment und Warenkorb.",
     "url": "/beispiel-demos/fachgeschaeft/", "bild": "assets/img/demos/fachgeschaeft-portfolio.webp"},
    {"id": "B-freizeit", "name": "AB Park", "branche": "Freizeit & Erlebnis",
     "beschreibung": "Erlebnispark mit Attraktionen, Parkplan und Ticket-Auswahl.",
     "url": "/beispiel-demos/freizeit/", "bild": "assets/img/demos/freizeit-portfolio.webp"},
]


def _bot_antwort(body):
    verlauf = body.get("konversation") or []
    letzte = ""
    for t in reversed(verlauf):
        if isinstance(t, dict) and t.get("von") == "user":
            letzte = str(t.get("text", "")).lower()
            break
    termin = False
    reply = ("Gern! Frag mich zu Websites, WebApps, KI-Loesungen, Automatisierung oder Preisen – oder wuensch dir einen Termin. "
             "Mehr auf /preise oder schreib an info@masesites.ch.")
    if "kost" in letzte or "preis" in letzte:
        reply = ("Websites starten bei CHF 790, WebApps bei CHF 2'990 und MASE AI kostet "
                 "CHF 490 einmalig plus CHF 39 pro Monat. Details stehen auf /preise.")
    elif "automat" in letzte or "prozess" in letzte or "ablauf" in letzte:
        reply = ("Automatisierungssysteme verbinden deine bestehenden Werkzeuge und erledigen "
                 "wiederkehrende Ablaeufe von selbst – Anfragen uebertragen, Freigaben einholen, "
                 "Daten abgleichen. Alles dazu auf /automatisierungssysteme.")
    elif "webapp" in letzte or "web-app" in letzte or "anwendung" in letzte:
        reply = ("Eine WebApp ist ein Werkzeug zum Arbeiten: anmelden, erfassen, verwalten. "
                 "Im Detail steht das auf /webapps.")
    elif "website" in letzte or "webseite" in letzte or "homepage" in letzte:
        reply = ("Eine Website erklaert dein Angebot und fuehrt Besucher zur Anfrage. "
                 "Im Detail steht das auf /websites.")
    elif "ki" in letzte or "bot" in letzte or "assistent" in letzte:
        reply = ("MASE AI beantwortet wiederkehrende Fragen aus deinem eigenen Wissen und nimmt "
                 "Anliegen auf. Im Detail steht das auf /ki-loesungen.")
    elif "termin" in letzte or "beratung" in letzte or "rueckruf" in letzte or "rückruf" in letzte:
        reply = "Sehr gern! Wie heisst du, wie erreiche ich dich (E-Mail oder Telefon), und wann wuerde dir passen?"
    elif "@" in letzte or any(z.isdigit() for z in letzte):
        reply = ("Perfekt, ich habe deinen Terminwunsch aufgenommen. Das masesites-Team meldet "
                 "sich zur Bestaetigung. Bis bald!")
        termin = True
        STAND["termine"].insert(0, {
            "db_id": STAND["naechste_id"], "id": "T-100%d" % STAND["naechste_id"],
            "zeit": int(time.time() * 1000), "status": "offen", "name": "Chat-Besucher",
            "kontakt": letzte.strip()[:120], "wunsch": "(im Chat genannt)", "thema": "Aus dem Chat",
            "anmerkung": "", "kontoLabel": "Gast " + str(body.get("chatId", "lokal"))[:6]})
        STAND["naechste_id"] += 1
    # Der Mock ist KEINE echte KI, sondern eine Stichwort-Antwort.
    # Wer lokal testet, soll das nicht mit dem echten Bot verwechseln.
    return {"reply": reply, "terminAngelegt": termin, "konfiguriert": True, "mock": True}


class Handler(BaseHTTPRequestHandler):
    server_version = "masesites-devmock/1.0"

    def log_message(self, *args):
        pass  # ruhig bleiben

    # ---- Hilfen ----
    def _json(self, code, obj, extra_headers=None):
        roh = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra_headers or {}).items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(roh)))
        self.end_headers()
        self.wfile.write(roh)

    def _body(self):
        laenge = int(self.headers.get("Content-Length", 0) or 0)
        if not laenge:
            return {}
        try:
            return json.loads(self.rfile.read(laenge).decode("utf-8") or "{}")
        except Exception:
            return {}

    def _hat_cookie(self, name):
        return (name + "=1") in (self.headers.get("Cookie") or "")

    # ---- Routing ----
    def do_GET(self):
        pfad = urlparse(self.path).path
        if pfad.startswith("/api/"):
            return self._api("GET", pfad, {})
        return self._statisch(pfad)

    def do_POST(self):
        pfad = urlparse(self.path).path
        return self._api("POST", pfad, self._body())

    def do_PUT(self):
        pfad = urlparse(self.path).path
        return self._api("PUT", pfad, self._body())

    def do_DELETE(self):
        pfad = urlparse(self.path).path
        return self._api("DELETE", pfad, self._body())

    # ---- /api-Mock ----
    def _api(self, methode, pfad, body):
        if pfad == "/api/status":
            return self._json(200, {"ok": True, "dienst": "masesites", "backend": "devserver-mock",
                                    "hinweis": "Nur lokaler Mock - kein echtes Backend."})
        if pfad == "/api/admin/anmelden" and methode == "POST":
            return self._json(200, {"ok": True}, {"Set-Cookie": "devadmin=1; Path=/"})
        if pfad == "/api/abmelden":
            return self._json(200, {"ok": True}, {"Set-Cookie": "devadmin=; Path=/; Max-Age=0"})
        if pfad == "/api/admin/daten":
            if not self._hat_cookie("devadmin"):
                return self._json(401, {"fehler": "Nicht angemeldet."})
            return self._json(200, {
                "kunden": [], "mitarbeiter": [],
                "log": [{"zeit": _jetzt_minus(1), "konto": "Gast ab12cd", "ip": "127.0.0.1",
                         "seite": "index.html", "aktion": "Seite geoeffnet", "detail": ""}],
                "botlogs": STAND["botlogs"], "termine": STAND["termine"], "ki": STAND["ki"],
                "adminPwGeaendert": True})
        if pfad == "/api/inhalte":
            return self._json(200, {"beispiele": DEMO_BEISPIELE, "projekte": []})
        if pfad == "/api/admin/ki" and methode == "PUT":
            STAND["ki"] = {"provider": body.get("provider", "groq"), "modell": body.get("modell", ""),
                           "standard": STAND["ki"]["standard"],
                           "an": bool(body.get("an")),
                           "konfiguriert": STAND["ki"]["konfiguriert"] or bool(body.get("key"))}
            return self._json(200, {"ok": True, "ki": STAND["ki"]})
        if pfad.startswith("/api/admin/termine/"):
            try:
                tid = int(pfad.rsplit("/", 1)[1])
            except ValueError:
                return self._json(404, {"fehler": "unbekannt"})
            if methode == "PUT":
                for t in STAND["termine"]:
                    if t["db_id"] == tid:
                        t["status"] = body.get("status", t["status"])
                        t["antwort"] = body.get("antwort", "")
                return self._json(200, {"ok": True})
            if methode == "DELETE":
                STAND["termine"] = [t for t in STAND["termine"] if t["db_id"] != tid]
                return self._json(200, {"ok": True})
        if pfad == "/api/admin/beispiele-massenupload" and methode == "POST":
            if not self._hat_cookie("devadmin"):
                return self._json(401, {"fehler": "Nicht angemeldet."})
            return self._json(200, {"ok": True, "aktualisiert": ["Restaurant", "Coiffeur"],
                                    "neu": ["Baeckerei"], "ohneHtml": []})
        if pfad == "/api/bot" and methode == "POST":
            return self._json(200, _bot_antwort(body))
        if pfad == "/api/kontakt" and methode == "POST":
            if body.get("firma_website"):
                return self._json(200, {"ok": True})
            name = str(body.get("name", "")).strip()[:120]
            email = str(body.get("email", "")).strip()[:200]
            nachricht = str(body.get("nachricht", "")).strip()[:4000]
            if not name or "@" not in email or len(nachricht) < 10:
                return self._json(400, {"fehler": "Bitte prüfe Name, E-Mail und Nachricht."})
            STAND["termine"].insert(0, {
                "db_id": STAND["naechste_id"], "id": "T-100%d" % STAND["naechste_id"],
                "zeit": int(time.time() * 1000), "status": "offen", "name": name,
                "kontakt": email, "wunsch": "Persönliche Rückmeldung zur Projektanfrage",
                "thema": " · ".join(body.get("interessen", [])[:8]) or "Website-Projekt",
                "anmerkung": nachricht, "kontoLabel": "Kontaktformular"})
            STAND["naechste_id"] += 1
            return self._json(200, {"ok": True})
        if pfad in ("/api/log", "/api/bot-log"):
            return self._json(200, {"ok": True})
        if pfad == "/api/ich":
            return self._json(401, {"fehler": "Nicht angemeldet."})
        # Unbekannt: harmlos quittieren, damit keine Seite haengt
        return self._json(200, {"ok": True, "mock": True})

    # ---- statische Dateien mit sauberen URLs ----
    def _statisch(self, pfad):
        rel = pfad
        if rel == "/":
            rel = "/index.html"
        if rel.endswith("/"):
            rel += "index.html"
        # Pfad sicher aufloesen (kein Ausbruch aus der Wurzel)
        sauber = posixpath.normpath(rel).lstrip("/")
        ziel = os.path.join(WURZEL, *sauber.split("/"))
        if not os.path.abspath(ziel).startswith(os.path.abspath(WURZEL)):
            return self._fehlt(pfad)
        if not os.path.isfile(ziel) and not os.path.splitext(ziel)[1]:
            if os.path.isfile(ziel + ".html"):
                ziel += ".html"
            elif os.path.isdir(ziel) and os.path.isfile(os.path.join(ziel, "index.html")):
                ziel = os.path.join(ziel, "index.html")
        if not os.path.isfile(ziel):
            return self._fehlt(pfad)
        typ = MIME.get(os.path.splitext(ziel)[1].lower(), "application/octet-stream")
        try:
            with open(ziel, "rb") as f:
                inhalt = f.read()
        except OSError:
            return self._fehlt(pfad)
        self.send_response(200)
        self.send_header("Content-Type", typ)
        self.send_header("Cache-Control", "no-store")
        if sauber.startswith("beispiel-demos/") and typ.startswith("text/html"):
            self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("Content-Length", str(len(inhalt)))
        self.end_headers()
        self.wfile.write(inhalt)

    def _fehlt(self, pfad):
        fehlerseite = os.path.join(WURZEL, "404.html")
        try:
            with open(fehlerseite, "rb") as f:
                text = f.read()
        except OSError:
            text = b"<!doctype html><meta charset='utf-8'><title>Nicht gefunden</title><h1>404</h1>"
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(text)))
        self.end_headers()
        self.wfile.write(text)


def main():
    # Port-Reihenfolge: 1) Umgebungsvariable PORT (setzt das Vorschau-Tool bei
    # autoPort), 2) Argument auf der Kommandozeile, 3) Standard 8091. So wird ein
    # frei zugewiesener Port genutzt, wenn 8091 schon belegt ist, und der manuelle
    # Aufruf "python scripts/devserver.py 8091" funktioniert weiterhin.
    port = 8091
    quellen = [os.environ.get("PORT"), sys.argv[1] if len(sys.argv) > 1 else None]
    for wert in quellen:
        if wert:
            try:
                port = int(wert)
                break
            except ValueError:
                pass
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("masesites Dev-Mock laeuft auf http://127.0.0.1:%d  (Ctrl+C zum Beenden)" % port)
    print("ACHTUNG: Nur Vorschau mit Beispieldaten - kein echtes Backend, keine echte KI.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nBeendet.")
        server.server_close()


if __name__ == "__main__":
    main()
