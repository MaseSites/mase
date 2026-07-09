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

Im Browser `https://DEINE-DOMAIN/api/status` öffnen:

- **JSON** mit `"ok":true` und `"backend":"php"` → alles läuft.
- Eine **404-/Fehlerseite** → die `.htaccess`-Weiterleitung greift nicht
  (mod_rewrite aktiv? richtiges Wurzelverzeichnis?).

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
