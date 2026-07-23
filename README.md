# masesites

Statische Website mit Kundenportal, Admin-Bereich (`/admin`) und Mitarbeiter-
Portal (`/mcs`). Alle Konten und Nachrichten liegen **verschlüsselt** in einer
Datenbank auf dem Server, Passwörter nur als Hash.

Es gibt **zwei austauschbare Backends** mit identischer API – nimm das, was dein
Hosting kann:

| Backend | Datei | Wann |
| --- | --- | --- |
| **PHP** | `api.php` | Klassisches Webhosting / **Plesk** (kein Node nötig) |
| Node.js | `server/server.js` | Server mit Node ≥ 22.5 (siehe `server/README.md`) |

Das Frontend (`assets/js/…`, alle HTML-Seiten) ist für beide gleich und ruft
`/api/...` auf.

---

## Deployment auf Plesk (PHP)

1. **Dateien hochladen:** Den Projektinhalt in das Dokumenten-Wurzelverzeichnis
   der Domain legen (bei Plesk meist `httpdocs`) – am einfachsten per Git:
   in Plesk unter **Git** dieses Repository klonen und in `httpdocs`
   bereitstellen.
2. **PHP-Version:** In den PHP-Einstellungen der Domain **PHP 8.x** wählen
   (mindestens 7.3). Die Erweiterungen `openssl`, `pdo_sqlite` und `curl` müssen
   aktiv sein – bei Plesk Standard.
3. **Schreibrechte:** Der Ordner `daten/` muss für PHP beschreibbar sein (dort
   entstehen Schlüssel und Datenbank). Standardmäßig ist das der Fall, weil PHP
   als Abo-Benutzer läuft.
4. **Fertig.** Beim ersten Aufruf legt `api.php` automatisch Schlüssel,
   Datenbank und ein zufälliges Admin-Passwort an.

Die `.htaccess` im Projekt leitet `/api/...` an `api.php` und liefert die
Seiten sonst statisch aus. Läuft die Seite in einem **Unterordner**, in der
`.htaccess` die Zeile `RewriteBase /unterordner/` ergänzen.

### Läuft es? Schnelltest

Im Browser `https://DEINE-DOMAIN/api/status` öffnen. Was dort steht, sagt
genau, woran es liegt:

- **JSON mit `"ok":true`** und `"backend":"php"` → alles läuft. Fertig.
- **JSON mit `"ok":false`** → PHP läuft, aber es fehlt etwas. Das Feld
  `pruefung` zeigt was: fehlt `pdo_sqlite`/`openssl`, in den PHP-Einstellungen
  die Erweiterung aktivieren; ist `daten_beschreibbar:false`, dem Ordner
  `daten/` Schreibrechte geben.
- **Fehler 500 / leere Seite / „Application Error"** → siehe Fehlersuche unten,
  Punkt 1 (fast immer eine noch aktive Node.js-App).
- **Die normale 404-Seite oder HTML statt JSON** → die `.htaccess`-Weiterleitung
  greift nicht (mod_rewrite aktiv? richtiges Wurzelverzeichnis? bei Unterordner
  `RewriteBase` setzen).

### Fehlersuche: läuft nicht auf Plesk

Der PHP-Server braucht **kein Node.js**. Wenn die Seite trotzdem nicht geht,
liegt es fast immer an einem dieser Punkte – in dieser Reihenfolge prüfen:

1. **Node.js-App abschalten (häufigste Ursache).** War die Domain früher als
   Node-App eingerichtet, fängt Phusion Passenger weiter alle Anfragen ab und
   antwortet mit **500**, weil kein Node läuft. In Plesk unter
   **Websites & Domains → Node.js** die App für diese Domain **deaktivieren**
   (bzw. entfernen). Alternativ in der `.htaccess` oben den `PassengerEnabled
   off`-Block einkommentieren.
2. **Richtige PHP-Version wählen.** Unter **PHP-Einstellungen** der Domain
   **PHP 8.x** einstellen und als Verarbeitung **FPM** lassen. `/api/status`
   zeigt danach die aktive Version.
3. **Statische Auslieferung durch nginx.** Kommt bei `/api/status` HTML statt
   JSON, unter **Apache & nginx** die Option „Smart static files processing"
   testweise ausschalten, damit `/api/...` sicher an Apache/PHP geht.
4. **Schreibrechte für `daten/`.** `ok:false` mit `daten_beschreibbar:false`
   → im Dateimanager dem Ordner `daten/` Schreibrechte für den Abo-Benutzer
   geben.
5. **HTTPS.** In Plesk per Let's Encrypt aktivieren und den 301-Redirect auf
   HTTPS einschalten; dann zusätzlich `SetEnv MS_HINTER_PROXY 1` in der
   `.htaccess` (siehe Härtung unten), damit die Cookies als `Secure` gesetzt
   werden.

### Erstes Admin-Passwort

Nach dem ersten Aufruf steht es in **`daten/admin-startpasswort.txt`**
(über den Plesk-Dateimanager lesbar). Damit unter `/admin` anmelden und sofort
unter **Einstellungen → Admin-Passwort ändern** ein eigenes setzen – die Datei
wird dann automatisch gelöscht.

### Empfohlene Härtung

In der `.htaccess` (oben) diese Zeilen ergänzen:

```apache
# Hinter dem Plesk-HTTPS-Proxy: Cookies als "Secure" markieren
SetEnv MS_HINTER_PROXY 1

# Datenordner außerhalb des Web-Roots (Schlüssel/DB nie erreichbar).
# Pfad an deine Domain anpassen; Ordner muss für PHP beschreibbar sein.
# SetEnv MS_DATEN /var/www/vhosts/DEINE-DOMAIN/private/masesites-daten
```

Auch ohne `MS_DATEN` ist `daten/` durch eine eigene `.htaccess` gegen
direkten Zugriff gesperrt; außerhalb des Web-Roots ist es aber am sichersten.

---

## Sicherheit – wie die Daten gespeichert werden

- **Passwörter** (Kunden, Mitarbeiter, Admin): nur als **bcrypt-Hash**
  (`password_hash`), nie im Klartext. Die Google-Anmeldung wird serverseitig
  bei Google geprüft.
- **Alle personenbezogenen Daten** (Konten inkl. E-Mail, Nachrichten, Tickets,
  Protokoll, Bot-Chats): **AES-256-GCM-verschlüsselt** in SQLite. Gesucht wird
  über einen HMAC-Index – auch E-Mails stehen nicht im Klartext in der DB.
- **Sitzungen**: HttpOnly-Cookies; in der DB liegt nur der SHA-256-Hash des
  Tokens. Kunden bleiben 30 Tage angemeldet, Admin/Mitarbeiter 12 Stunden bzw.
  bis der Browser geschlossen wird.
- **Schutz**: Ratenbegrenzung auf Login/Registrierung, CSRF-Schutz (eigener
  Header + Origin-Prüfung), Content-Security-Policy und weitere Header,
  Größenlimits für Eingaben, serverseitige Rechteprüfung (Kunde nur eigenes
  Profil/Tickets/Nachrichten, Mitarbeiter nur zugewiesene Kunden).

### Wichtig für Backups

`daten/geheim.key` ist der Schlüssel zu allen Daten. **Ohne ihn ist die
Datenbank nicht mehr lesbar.** Für Backups Datenbank **und** Schlüssel sichern
(getrennt aufbewahren). Der Schlüssel ist bewusst **nicht** im Git.

### HTTPS

Der Betrieb muss über **HTTPS** laufen (bei Plesk per Let's Encrypt ein Klick),
sonst gehen Passwörter unverschlüsselt durchs Netz. Mit `MS_HINTER_PROXY=1`
werden die Sitzungs-Cookies korrekt als `Secure` gesetzt.

---

## Lokale Entwicklung

```
php -S 127.0.0.1:8091 _devserver.php
```

`_devserver.php` bildet lokal die `.htaccess`-Weiterleitung nach (PHPs
eingebauter Server liest keine `.htaccess`). Dann `http://127.0.0.1:8091`
öffnen.

## KI-Chat-Assistent

Der Chat unten rechts wird von einem **lokalen Sprachmodell** beantwortet
(Ollama, Modell `qwen2.5:3b`, Fallback `llama3.2:3b`). Kein API-Key, keine
Cloud, keine externen Dienste. Der frühere Stichwort-Bot ist vollständig
entfernt.

### Server einrichten (ein Befehl)

Auf einem frischen Linux-Server (VPS mit mindestens 6, besser 8 GB RAM):

```bash
git clone https://github.com/MaseSites/mase.git
cd mase
sudo ./setup.sh
```

Das Skript installiert Docker (falls nötig), startet Website + Modell,
wartet auf den Modell-Download und zeigt am Ende, wie man das
Admin-Startpasswort ausliest. Alles startet nach einem Server-Neustart
von selbst wieder.

**Aktualisieren** nach neuen Commits: `./update.sh` (holt den Stand,
baut die Website neu, erzeugt das Chat-Wissen frisch).

**HTTPS mit eigener Domain** (Zertifikat automatisch via Let's Encrypt),
sobald die Domain per DNS auf den Server zeigt:

```bash
DOMAIN=masesites.ch docker compose --profile https up -d
```

Von Hand statt per Skript geht es auch:

```bash
docker compose up -d
```

Danach läuft die Website auf <http://localhost:8080>, der Chat funktioniert
sofort. Beim **ersten** Start lädt das Modell rund 2 GB herunter – das dauert
je nach Leitung einige Minuten. Danach liegt es im Docker-Volume und der
Start geht sofort.

Ohne Docker (Modell muss dann selbst laufen):

```bash
node scripts/wissen.js     # Website-Wissen erzeugen
node server/server.js      # Website + Backend
```

### Wie der Assistent zu seinem Wissen kommt

`scripts/wissen.js` liest die neun öffentlichen HTML-Seiten, entfernt das
Markup und schreibt den reinen Text nach `data/website.txt` (rund 22'000
Zeichen). Diese Datei wandert bei **jeder** Frage vollständig in den Prompt.

Bewusst **kein RAG, keine Vektordatenbank, keine Embeddings**: Die Website
ist klein genug, dass der gesamte Text in den Kontext passt. Das spart eine
Datenbank, einen Indexlauf und viel Code.

Im Docker-Container läuft `wissen.js` bei jedem Start automatisch – nach
einer Inhaltsänderung genügt also ein Neustart.

### Konfiguration

| Variable | Standard | Bedeutung |
|---|---|---|
| `KI_URL` | `http://ollama:11434` | Adresse des Ollama-Servers |
| `KI_MODELL` | `qwen2.5:3b` | bevorzugtes Modell |
| `KI_MODELL_FALLBACK` | `llama3.2:3b` | Rückfallebene, wenn das erste fehlt |
| `PORT` | `8080` | Port der Website |

### Projektanfragen

Erkennt das Modell, dass jemand ein Projekt starten will, fragt es nach Name,
Kontakt, Ziel, Budget und Anforderungen. Sobald Name, Kontakt und Ziel
vorliegen, hängt es einen JSON-Block an die Antwort. Das Backend schneidet
diesen Block ab (er erreicht den Besucher **nie**), speichert ihn nach
`daten/ki-anfragen.json` und schreibt einen Eintrag ins Protokoll. Im Chat
erscheint stattdessen eine Bestätigung.

### Annahmen und Grenzen

Diese Punkte waren nicht vorgegeben und wurden bewusst so entschieden:

- **Plesk/Shared Hosting kann kein Ollama.** Das Docker-Setup gehört auf
  einen eigenen Server oder VPS. Die PHP-Fassung (`api.php`, für den
  bestehenden Plesk-Betrieb) spricht deshalb einen KI-Server an, dessen
  Adresse in der Einstellung `ki_url` oder der Umgebungsvariable `KI_URL`
  steht. Ist nichts gesetzt, antwortet sie mit 503 und das Widget zeigt
  einen ehrlichen Hinweis samt Kontakt-Link – **niemals erfundene
  Antworten**.
- **Speicherbedarf:** Ein 3B-Modell braucht rund 4 bis 6 GB RAM. Auf reiner
  CPU dauert eine Antwort erfahrungsgemäss einige Sekunden; die Antwort wird
  deshalb gestreamt und erscheint Wort für Wort.
- **Wissensgrenze:** `MAX_ZEICHEN` in `scripts/wissen.js` begrenzt das Wissen
  auf 28'000 Zeichen, damit der Prompt nicht ausufert.
- **Kein GitHub-Actions-Deployment** angelegt: Das Repo wird über Plesk per
  Git-Pull ausgerollt, ein zusätzlicher Workflow hätte hier keinen Nutzen.
- Die Node-Fassung streamt die Antwort, die PHP-Fassung liefert sie am Stück
  (Apache puffert ohnehin meist) – das Widget kommt mit beidem zurecht.
