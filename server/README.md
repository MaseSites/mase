# masesites Server

Liefert die Website aus und speichert Kundenkonten, Mitarbeiter, Protokoll und
KI-Chats **verschlüsselt** in einer SQLite-Datenbank. Keine npm-Pakete nötig.

## Voraussetzungen

- Node.js **22.5 oder neuer** (nutzt das eingebaute `node:sqlite`)

## Starten

```
node server/server.js
```

oder `npm start`. Standard-Port ist **8080** (`MS_PORT` ändert ihn).
Danach läuft alles unter einer Adresse: Website, `/login.html`, `/dashboard.html`,
`/admin`, `/mcs` und die API unter `/api/...`.

## Erster Admin-Login

Beim ersten Start erzeugt der Server ein zufälliges Admin-Startpasswort und
zeigt es in der Konsole. Es steht zusätzlich in
`server/daten/admin-startpasswort.txt`. Nach dem Ändern unter
**/admin → Einstellungen** wird die Datei automatisch gelöscht.

## Sicherheit — so werden die Daten gespeichert

- **Passwörter** (Kunden, Mitarbeiter, Admin): nur als **scrypt-Hash mit Salt**,
  nie im Klartext. Die Google-Anmeldung wird serverseitig bei Google geprüft.
- **Alle personenbezogenen Daten** (Konten inkl. E-Mail, Nachrichten, Tickets,
  Protokoll, Bot-Chats): **AES-256-GCM-verschlüsselt** in der Datenbank.
  Gesucht wird über einen HMAC-Index, damit auch E-Mails nicht im Klartext liegen.
- **Sitzungen**: HttpOnly-Cookies; in der Datenbank liegt nur der SHA-256-Hash
  des Tokens. Kunden bleiben 30 Tage angemeldet, Admin/Mitarbeiter 12 Stunden
  bzw. bis der Browser geschlossen wird.
- **Schutzmassnahmen**: Ratenbegrenzung auf Login/Registrierung, CSRF-Schutz
  (eigener Header + Origin-Prüfung), Content-Security-Policy und weitere
  Security-Header, Grössenlimits für alle Eingaben.

## Wichtige Dateien (in `server/daten/`, nicht im Git)

| Datei | Zweck |
| --- | --- |
| `masesites.db` | SQLite-Datenbank (Inhalte verschlüsselt) |
| `geheim.key` | Verschlüsselungs-Schlüssel — **unbedingt sichern!** |
| `admin-startpasswort.txt` | Startpasswort, verschwindet nach dem Ändern |

**Ohne `geheim.key` sind die Daten nicht wiederherstellbar.** Für Backups also
immer Datenbank **und** Schlüssel sichern (getrennt aufbewahren). Alternativ
kann der Schlüssel als Umgebungsvariable `MS_SCHLUESSEL` (64 Hex-Zeichen)
gesetzt werden, dann liegt er nicht auf der Platte.

## Betrieb hinter HTTPS

Im echten Betrieb den Server hinter einen Reverse-Proxy mit HTTPS legen
(z. B. Caddy oder nginx) und `MS_HINTER_PROXY=1` setzen — dann vertraut der
Server den `X-Forwarded-*`-Headern, markiert Cookies als `Secure` und sendet
HSTS. Ohne HTTPS gehen Passwörter unverschlüsselt durchs Netz!

Beispiel (Caddy):

```
masesites.ch {
    reverse_proxy 127.0.0.1:8080
}
```

## Umgebungsvariablen

| Variable | Bedeutung | Standard |
| --- | --- | --- |
| `MS_PORT` | Port des Servers | `8080` |
| `MS_SCHLUESSEL` | Verschlüsselungs-Schlüssel (64 Hex-Zeichen) | Datei `geheim.key` |
| `MS_GOOGLE_CLIENT_ID` | Client-ID für die Google-Anmeldung | Wert aus `assets/js/konto.js` |
| `MS_HINTER_PROXY` | `1`, wenn ein Reverse-Proxy davor läuft | aus |

## Hinweise

- Die alten Prototyp-Daten aus dem localStorage einzelner Browser werden
  nicht übernommen — Konten bitte neu anlegen.
- Gleichzeitiges Bearbeiten desselben Kunden (z. B. Admin und Mitarbeiter
  exakt zeitgleich) folgt dem Prinzip „letzter gewinnt“; Nachrichten und
  Ticket-Antworten werden aber serverseitig zusammengeführt und gehen nicht
  verloren.
