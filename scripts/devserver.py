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
         "von": "bot", "text": "Eine neue Website gibt es ab CHF 750. Auf /preise stellst du dein Paket zusammen."},
    ],
    "naechste_id": 4,
}

DEMO_BEISPIELE = [
    {"id": "B-tavolo", "name": "tavolo - Restaurant-Software", "branche": "Webapp",
     "beschreibung": "Reservierungen, Kalender, Menues, Schichten.", "url": "/beispiel-demos/tavolo",
     "bild": "assets/img/demos/tavolo.jpg"},
    {"id": "B-kebab", "name": "Kebab Palace", "branche": "Gastronomie",
     "beschreibung": "Speisekarte, Bestellung und Standort.", "url": "#",
     "bild": "assets/img/demos/kebab.jpg"},
]


def _bot_antwort(body):
    verlauf = body.get("konversation") or []
    letzte = ""
    for t in reversed(verlauf):
        if isinstance(t, dict) and t.get("von") == "user":
            letzte = str(t.get("text", "")).lower()
            break
    termin = False
    reply = ("Gern! Frag mich zu Websites, Preisen oder wuensch dir einen Termin. "
             "Mehr auf /preise oder schreib an info@masesites.ch.")
    if "kost" in letzte or "preis" in letzte:
        reply = "Eine neue Website gibt es ab CHF 750. Auf /preise stellst du dein Paket zusammen."
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
    return {"reply": reply, "terminAngelegt": termin, "konfiguriert": True}


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
        if pfad == "/api/bot" and methode == "POST":
            return self._json(200, _bot_antwort(body))
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
        self.send_header("Content-Length", str(len(inhalt)))
        self.end_headers()
        self.wfile.write(inhalt)

    def _fehlt(self, pfad):
        text = ("<h1>404</h1><p>Nicht gefunden: %s</p>"
                "<p>Lokaler masesites-Dev-Mock.</p>" % pfad).encode("utf-8")
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(text)))
        self.end_headers()
        self.wfile.write(text)


def main():
    port = 8091
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
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
