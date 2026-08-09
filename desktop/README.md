# MaseSites Admin — Desktop-App

Dein Adminbereich von masesites.ch als eigenes Windows-Programm, abgesichert
durch eine gerätegebundene Lizenz.

**Ablauf:** Lizenzcode (einmalig) → Anmeldung → Bereichsauswahl → Dashboard.

---

## Schnellstart

Doppelklick auf **`App-starten.cmd`**. Beim ersten Mal werden die Bausteine
geladen (einige Minuten), danach startet die App sofort.

Installer bauen: Doppelklick auf **`App-bauen.cmd`**. Die Setup-Datei landet
in `dist/`.

---

## Wie es zusammenhängt

Die App ersetzt den Browser, nicht den Server. Alle Daten bleiben in deiner
verschlüsselten SQLite-Datenbank; die App spricht dieselbe API wie die
Website.

- **Netzwerk läuft im Hauptprozess** (`src/main/api.js`) über dieselbe
  Sitzungs-Partition wie der eingebettete Adminbereich. Das Anmelde-Cookie
  landet damit genau dort, wo `/admin` es später braucht — die eingebettete
  Seite ist beim Öffnen bereits angemeldet.
- **Kein Origin-Problem:** Der Hauptprozess schickt keinen `Origin`-Header,
  also greift die Origin-Prüfung in `api.php` gar nicht erst. Der eingebettete
  Adminbereich läuft unter der echten Adresse und passt ohnehin. An deinem
  CSRF-Schutz musste nichts geändert werden.
- **Passwort** wird durchgereicht und nirgends gespeichert. Die 12-Stunden-
  Gültigkeit deiner Admin-Sitzung bleibt unverändert.

### Wichtig zur Anmeldung

Der Adminbereich kennt **keinen Benutzernamen**. `/api/admin/anmelden`
erwartet nur `{ passwort }`. Bildschirm 2 hat deshalb genau ein Feld.

### Passwort nur einmal — und das Schloss

Nach der ersten erfolgreichen Passwort-Anmeldung gibt der Server dem Gerät
einen **Geräte-Token**. Der liegt verschlüsselt im Tresor und meldet die App
bei jedem Start still an — kein Passwort mehr.

Oben rechts sitzt ein **Schloss**. Ein Klick (oder `Strg + L`) wirft dich
hinaus: Sitzung weg, Token weg, Sperrbildschirm. Danach geht es nur mit dem
Passwort weiter, und dabei entsteht ein neuer Token.

Der Token ist an den Geräte-Fingerabdruck gebunden — kopiert man die Datei auf
einen anderen Rechner, ist sie wertlos. Und er entsteht **nur** nach einer
Passwort-Anmeldung: Der Lizenzcode allein führt nie in den Adminbereich.

> Das braucht den Servermodus. Im simulierten Modus gibt es keinen Token,
> also fragt die App dort bei jedem Start nach dem Passwort.

### Zwei Geräte, nicht mehr

An einer Lizenz dürfen **zwei Geräte gleichzeitig** hängen. Meldet sich ein
drittes an, landet es auf der Warteliste und sieht den Warteschirm. Auf einem
freigeschalteten Gerät erscheint dann die Frage *„Neues Gerät möchte
zugreifen"* — mit **Erlauben** oder **Ablehnen**. Die App schaut alle 20
Sekunden nach solchen Anfragen; das wartende Gerät fragt alle 5 Sekunden, ob
es durch ist, und geht dann von selbst weiter.

Erlauben geht nur, wenn ein Platz frei ist. Unter *Einstellungen → Lizenz*
siehst du alle Geräte und kannst eines entfernen.

Kommst du gerade an kein freigeschaltetes Gerät, hilft der Notausgang aus dem
Adminbereich: `POST /api/admin/geraete/:id` mit `{"erlauben":true}` bzw.
`{"erlauben":false}` zum Entfernen.

---

## Lizenz

| Modus | Bedeutung |
|---|---|
| `simuliert` | Die Prüfung passiert im Programm. Zum Durchklicken. **Kein echter Schutz.** |
| `server` | Deine API entscheidet. Erst so schützt die Lizenz wirklich. |

Umschalten in **Einstellungen → Lizenz → Prüfmodus**.

- Der Code hat die Form `MASE-XXXX-XXXX-XXXX`.
- Er wird beim ersten Erfolg an den Rechner gebunden (SHA-256 der Windows-
  MachineGuid; an den Server geht nur der Hash, nie die Rohkennung).
- Gespeichert wird verschlüsselt über `safeStorage` (unter Windows DPAPI, am
  Windows-Anmeldekonto). Eine kopierte Datei ist auf einem anderen Rechner
  wertlos. Steht keine Verschlüsselung bereit, wird bewusst **nichts**
  gespeichert und der Code bei jedem Start neu verlangt.
- **Kulanzfrist:** ohne Internet läuft die App 7 Tage mit der zuletzt
  bestätigten Lizenz weiter.
- Im simulierten Modus wird `MASE-0000-0000-0000` immer abgelehnt — damit sich
  der Fehlerfall testen lässt.

### Codes ausstellen (Servermodus)

Über die API, angemeldet als Admin:

```bash
curl -b kekse.txt -X POST https://masesites.ch/api/admin/lizenzen \
  -H "X-Requested-With: fetch" -H "Content-Type: application/json" \
  -d '{"notiz":"Arbeitsplatz Matteo","ablauf":"2027-12-31"}'
```

Die Antwort enthält den Code **genau einmal** — in der Datenbank liegt nur sein
SHA-256-Hash, wie beim Sitzungstoken. Verlorene Codes werden neu ausgestellt,
nicht nachgeschlagen.

Weitere Endpunkte: `GET /api/admin/lizenzen` (Liste),
`PUT /api/admin/lizenzen/:kennung` (`{"status":"gesperrt"}` oder
`{"geraetLoesen":true}`), `DELETE /api/admin/lizenzen/:kennung`.

### Scharf schalten

**Einstellungen → Lizenz → „Nur noch über diese App"**. Ab dann verlangen
**alle** Admin-Endpunkte zusätzlich zur Sitzung einen gültigen Lizenznachweis
— der Adminbereich ist im Browser gesperrt.

Standard ist **aus**. Der Schalter sitzt bewusst in der App und nicht im
Browser: Der Server nimmt das Anschalten nur aus einer Sitzung an, die selbst
über die App entstanden ist. Sonst wäre der Klick die eigene Aussperrung.

Und er kippt erst, wenn der Server zugestimmt hat — nie vorher, sonst stünde
dort „an", während der Adminbereich weiter offen ist.

Der Weg zurück ist derselbe Schalter. Wer sich trotzdem aussperrt (App
verloren, alle Geräte weg), kommt über die Datenbank wieder rein:
`DELETE FROM einstellungen WHERE schluessel = 'lizenzpflicht'`.

---

## Sicherheit der App

- Renderer ohne Node, `contextIsolation` an, Sandbox an, keine DevTools im
  fertigen Programm.
- Der eingebettete Adminbereich läuft in einer eigenen Sitzungs-Partition.
- Navigation ausserhalb der eingestellten Adresse wird blockiert und im
  Systembrowser geöffnet; neue Fenster gibt es nicht.
- Alle Web-Berechtigungen (Kamera, Ort, Mitteilungen) werden abgelehnt.
- Zertifikatsfehler führen zum Abbruch (Electron-Standard, nicht übergangen).
- Der Renderer kennt nur die Aufrufe aus `src/preload/preload.js` — kein
  Dateisystem, kein eigener Netzwerkzugriff.

---

## Einstellungen

**Verbindung** — Serveradresse samt Verbindungstest und Schnellwahl für die
lokalen Testserver (`:8091` PHP, `:8080` Node). Ein Serverwechsel schliesst
den Adminbereich und wirft die Sitzung weg.

**Lizenz** — aktiver Code, gebundenes Gerät, Prüfmodus, die Liste der
freigeschalteten Geräte (bestätigen, entfernen), Lizenz lösen.

**Darstellung** — hell/dunkel/System, Zoom im Adminbereich, Bewegung,
Startsequenz.

**System** — Autostart mit Windows, Datenordner öffnen, Tastenkürzel.

**Info** — Versionen, Gerätekennung, Pfade.

Tastenkürzel: `Strg + ,` Einstellungen · `Strg + L` sperren · `Strg + R` neu
laden · `F11` Vollbild · `Esc` zurück · `Strg + Q` beenden.

---

## Reiter im Bereich

Nach dem Klick auf *masesites* stehen oben zwei Reiter:

| Reiter | Stand |
|---|---|
| **Admin Dashboard** | dein `/admin`, eingebettet |
| **Mitarbeiter-Portal** | dein `/mcs` — eigene Anmeldung, wie auf der Website |
| **Akquise-Tool** | Platzhalter — wird eingehängt, sobald das Programm vorliegt |

Zum Einhängen des Akquise-Tools: in [src/main/ipc.js](src/main/ipc.js) beim
Eintrag `akquise` in `TABS` `aktiv: true` setzen und `pfad` hinterlegen.

### Die App ist kein Browser

Im Fenster laufen **nur** diese Arbeitsbereiche. Startseite, Impressum und die
übrige Website öffnen im Systembrowser statt im Programm — sonst navigiert man
sich versehentlich aus der App heraus und findet nicht zurück.

Zwei Vorkehrungen greifen dafür:

- `ERLAUBTE_PFADE` in [src/main/dashboard.js](src/main/dashboard.js) lässt nur
  `/admin` und `/mcs` samt Unterpfaden zu. Alles andere wird abgefangen —
  auch bei gleicher Adresse.
- Die Fusszeile der Seiten (Startseite, Impressum) blendet
  [src/main/admin-thema.js](src/main/admin-thema.js) aus, damit solche
  Verweise gar nicht erst zum Klicken einladen.

Wechselt die eingebettete Seite selbst den Bereich — etwa über ihren Knopf
*Mitarbeiter-Portal* —, zieht die Reiterleiste automatisch mit.

---

## Einheitliche Gestaltung

Der eingebettete Adminbereich übernimmt die Farbwelt der App. Möglich ist das,
weil `assets/css/style.css` durchgehend mit CSS-Variablen arbeitet — die
überschreibt [src/main/admin-thema.js](src/main/admin-thema.js). Damit gibt es
den Adminbereich auch **dunkel**, was die Website selbst nicht kann.

Zwei Fallen stecken darin:

1. **Kaskade.** Eingefügte Regeln landen *vor* denen der Seite. Ohne
   `!important` gewinnt die Seite — auch bei CSS-Variablen.
2. **Hartes Weiss.** Wo die Seite `color: #fff` auf `background: var(--ink)`
   setzt, verschwindet die Schrift, sobald `--ink` hell wird. Diese Stellen
   fängt eine kurze Liste ab. Kommt in style.css neues hartes Weiss dazu,
   gehört es dort ergänzt.

Zusätzlich zur Farbe bringt die Datei **Hierarchie** mit, die der Website als
flächigem Layout fehlt: Kennzahlen als einzelne Karten mit Akzentkante statt
als ein Band, Karten mit sichtbarem Rand und Schatten, abgesetzte Kartenköpfe,
und ein warmer Goldton als Akzent für Aktives und Verweise — statt Weiss, das
im Dunkeln alles überstrahlt. Der Ton stammt aus den Verläufen der Website
selbst, ist also nichts Neues in der Marke.

---

## Aufbau

```
src/main/       Hauptprozess: Fenster, Netzwerk, Lizenz, Tresor, Einstellungen
src/preload/    die einzige Brücke zum Renderer
src/renderer/   Oberfläche: 4 Bildschirme, Einstellungsblatt, Animationen
src/renderer/schrift/   Outfit als Datei (siehe LIESMICH.md dort)
```

Gestaltung: dieselbe Bildmarke (die vier Kacheln), dieselbe Wortmarke und
dieselbe Schrift wie die Website. Outfit liegt als Datei bei, damit die App
auch ohne Internet stimmt — die Inhaltsrichtlinie verbietet externe Quellen.

Einstellungen und Lizenz liegen im Benutzerprofil
(`%APPDATA%\MaseSites Admin`), nicht im Programmordner — ein Update
überschreibt sie nicht.

---

## Installieren und weiterentwickeln

`App-bauen.cmd` legt den Installer unter `dist/` ab
(`MaseSites-Admin-Setup-<version>.exe`, rund 95 MB). Doppelklick installiert
ins Benutzerprofil — keine Administratorrechte nötig — und legt Verknüpfungen
auf Desktop und im Startmenü an.

**Änderungen später:** Der installierte Stand ist eine Momentaufnahme. Der
Quelltext bleibt hier liegen; nach einer Änderung einmal `App-bauen.cmd` und
den neuen Installer ausführen, er ersetzt die alte Fassung.

Einstellungen, Lizenz und Geräte-Token überleben das, weil sie im
Benutzerprofil liegen (`%APPDATA%\MaseSites Admin`) und nicht im
Programmordner.

Zum schnellen Ausprobieren einer Änderung braucht es gar keinen Installer:
`App-starten.cmd` startet direkt aus dem Quelltext.

Vor jedem neuen Installer die `version` in `package.json` erhöhen — sonst
tragen zwei verschiedene Stände dieselbe Nummer, und man weiss später nicht
mehr, welcher installiert ist.

**Signatur:** Ohne Code-Signatur zeigt Windows beim ersten Start eine
SmartScreen-Warnung („Weitere Informationen" → „Trotzdem ausführen"). Intern
verschmerzbar; für die Weitergabe an Kunden braucht es ein
Signaturzertifikat.

Das Programmsymbol liegt als `build/icon.ico` bei (die Bildmarke in sechs
Grössen von 16 bis 256 Pixel).

---

## Noch offen

- Kunden-Kachel freischalten, sobald das Kundendashboard existiert. Das
  Gerüst steht (`BEREICHE` in `src/main/ipc.js`).
- Auto-Update für neue Versionen.
- Lizenzverwaltung als Oberfläche im Adminbereich statt über die API.
