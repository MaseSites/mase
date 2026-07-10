<?php
/* masesites API (PHP-Fassung für Plesk & klassisches Webhosting ohne Node).
   Beantwortet alle /api/...-Aufrufe des Frontends (assets/js/daten.js).
   Die statischen Seiten liefert der Webserver selbst aus; die .htaccess
   im Projektordner leitet nur /api/... an diese Datei weiter.

   Sicherheit – identisch zur früheren Node-Fassung:
   - Passwörter werden nie gespeichert, nur als bcrypt-Hash (password_hash).
   - Alle personenbezogenen Daten (Konten inkl. E-Mail, Nachrichten, Tickets,
     Protokoll, Bot-Chats) liegen AES-256-GCM-verschlüsselt in einer SQLite-
     Datenbank. Gesucht wird über einen HMAC-Index, E-Mails stehen nie im
     Klartext in der DB.
   - Sitzungen laufen über HttpOnly-Cookies; in der DB liegt nur der
     SHA-256-Hash des Tokens.
   - Login-Endpunkte sind pro IP ratenbegrenzt, schreibende Aufrufe verlangen
     einen eigenen Header (CSRF-Schutz).

   Schlüssel: daten/geheim.key (wird beim ersten Aufruf erzeugt) oder aus der
   Umgebungsvariable MS_SCHLUESSEL (64 Hex-Zeichen).
   WICHTIG: Schlüssel sichern! Ohne ihn sind die Daten nicht mehr lesbar. */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');   /* nie PHP-Fehler an den Browser geben */
date_default_timezone_set('Europe/Zurich');
header_remove('X-Powered-By');

/* ---------- Konfiguration ---------- */

const SITZUNG_DAUER = [            /* in Sekunden */
    'kunde' => 30 * 24 * 3600,    /* 30 Tage  */
    'mitarbeiter' => 12 * 3600,   /* 12 Stunden */
    'admin' => 12 * 3600,
];
const COOKIE_NAMEN = [
    'kunde' => 'ms_sitzung',
    'mitarbeiter' => 'ms_sitzung_ma',
    'admin' => 'ms_sitzung_admin',
];
const LOG_LIMIT = 5000;
const BOTLOG_LIMIT = 2000;
const KOERPER_LIMIT = 256 * 1024;
const SCHRITTE_ANZAHL = 5;
const EMAIL_MUSTER = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';
const FALSCHE_ANMELDUNG = 'Keine Übereinstimmung gefunden. Prüfe E-Mail und Passwort.';

/* Konfiguration aus der Umgebung ODER aus der .htaccess (SetEnv NAME wert),
   damit sie auf Plesk & Co. ohne Shell-Zugang gesetzt werden kann. */
function cfg(string $name): ?string
{
    if (isset($_SERVER[$name]) && $_SERVER[$name] !== '') {
        return (string)$_SERVER[$name];
    }
    $wert = getenv($name);
    return ($wert === false || $wert === '') ? null : $wert;
}

$DATEN_ORDNER = cfg('MS_DATEN') ? rtrim(cfg('MS_DATEN'), '/\\') : __DIR__ . '/daten';
$HINTER_PROXY = cfg('MS_HINTER_PROXY') === '1';
$GOOGLE_CLIENT_ID = cfg('MS_GOOGLE_CLIENT_ID')
    ?: '117777636536-nd77bnlv9co4l7g8cbn6de0q8uhj3njt.apps.googleusercontent.com';

/* ---------- Früher Diagnose-Endpunkt ----------
   Läuft VOR Schlüssel und Datenbank, damit /api/status auch dann antwortet,
   wenn der eigentliche Start scheitert – und zeigt gleich, woran es liegt. */
$FRUEH_PFAD = rawurldecode((string)(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/'));
/* Tieftest: spielt genau das durch, was ein echter Aufruf beim ersten Mal tut
   (Schlüssel anlegen/lesen, DB öffnen, WAL, schreiben, AES-256-GCM), und meldet
   die ECHTE Fehlermeldung samt Schritt. Wird über /api/status?deep=1 ausgelöst. */
function tiefTest(string $ordner): array
{
    $schritt = 'start';
    try {
        $schritt = 'schluessel-datei';
        $keyDatei = $ordner . '/geheim.key';
        if (!is_file($keyDatei) && !getenv('MS_SCHLUESSEL')) {
            $fp = @fopen($keyDatei, 'x');
            if ($fp !== false) {
                fwrite($fp, bin2hex(random_bytes(32)) . "\n");
                fclose($fp);
                @chmod($keyDatei, 0600);
            } elseif (!is_file($keyDatei)) {
                throw new RuntimeException('geheim.key kann nicht angelegt werden (Schreibrechte im Ordner daten/?).');
            }
        }
        $schritt = 'db-oeffnen';
        $t = new PDO('sqlite:' . $ordner . '/masesites.db');
        $t->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $sqlite = (string)$t->query('SELECT sqlite_version()')->fetchColumn();
        $schritt = 'db-wal';
        $walOk = true;
        try { $t->exec('PRAGMA journal_mode = WAL'); } catch (Throwable $e) { $walOk = false; }
        $schritt = 'db-schreiben';
        $t->exec('CREATE TABLE IF NOT EXISTS selftest (id INTEGER PRIMARY KEY AUTOINCREMENT, t TEXT)');
        $t->prepare('INSERT INTO selftest (t) VALUES (?)')->execute(['ok']);
        $t->exec('DELETE FROM selftest');
        $schritt = 'krypto';
        $k = random_bytes(32); $iv = random_bytes(12); $tag = '';
        $ct = openssl_encrypt('probe', 'aes-256-gcm', $k, OPENSSL_RAW_DATA, $iv, $tag);
        $pt = ($ct === false) ? false : openssl_decrypt($ct, 'aes-256-gcm', $k, OPENSSL_RAW_DATA, $iv, $tag);
        if ($pt !== 'probe') {
            throw new RuntimeException('AES-256-GCM-Roundtrip fehlgeschlagen (openssl?).');
        }
        return ['ok' => true, 'wal' => $walOk, 'sqlite' => $sqlite];
    } catch (Throwable $e) {
        return ['ok' => false, 'fehler_bei' => $schritt, 'meldung' => $e->getMessage()];
    }
}

if ($FRUEH_PFAD === '/api/status') {
    if (!is_dir($DATEN_ORDNER)) {
        @mkdir($DATEN_ORDNER, 0700, true);
    }
    $beschreibbar = is_dir($DATEN_ORDNER) && is_writable($DATEN_ORDNER);
    $alles = extension_loaded('openssl') && extension_loaded('pdo_sqlite')
        && function_exists('hash_hkdf') && $beschreibbar;
    $pruefung = [
        'openssl' => extension_loaded('openssl'),
        'pdo_sqlite' => extension_loaded('pdo_sqlite'),
        'curl' => extension_loaded('curl'),
        'hash_hkdf' => function_exists('hash_hkdf'),
        'daten_ordner' => $DATEN_ORDNER,
        'daten_existiert' => is_dir($DATEN_ORDNER),
        'daten_beschreibbar' => $beschreibbar,
    ];
    $ausgabe = ['ok' => $alles, 'dienst' => 'masesites', 'backend' => 'php', 'php' => PHP_VERSION, 'pruefung' => $pruefung];
    /* Tieftest nur auf Wunsch – testet echt DB-Schreibzugriff und Verschlüsselung */
    if (isset($_GET['deep']) || isset($_GET['tief'])) {
        $tief = tiefTest($DATEN_ORDNER);
        $ausgabe['tieftest'] = $tief;
        $ausgabe['ok'] = $alles && !empty($tief['ok']);
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($ausgabe, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ---------- Schlüssel und Verschlüsselung ---------- */

if (!is_dir($DATEN_ORDNER)) {
    @mkdir($DATEN_ORDNER, 0700, true);
}
if (!is_dir($DATEN_ORDNER) || !is_writable($DATEN_ORDNER)) {
    fehlerAbbruch('Der Datenordner ist nicht beschreibbar. Öffne /api/status für Details.');
}
if (!extension_loaded('pdo_sqlite')) {
    fehlerAbbruch('Die PHP-Erweiterung pdo_sqlite fehlt. Öffne /api/status für Details.');
}

function ladeHauptschluessel(string $ordner): string
{
    $ausUmgebung = cfg('MS_SCHLUESSEL');
    if ($ausUmgebung) {
        $buf = @hex2bin(trim($ausUmgebung));
        if ($buf === false || strlen($buf) !== 32) {
            fehlerAbbruch('MS_SCHLUESSEL muss 64 Hex-Zeichen sein.');
        }
        return $buf;
    }
    $datei = $ordner . '/geheim.key';
    if (is_file($datei)) {
        $buf = @hex2bin(trim((string)file_get_contents($datei)));
        if ($buf === false || strlen($buf) !== 32) {
            fehlerAbbruch('geheim.key ist beschädigt (erwartet 64 Hex-Zeichen).');
        }
        return $buf;
    }
    $neu = random_bytes(32);
    /* Exklusiv anlegen, damit parallele erste Aufrufe sich nicht überschreiben */
    $fp = @fopen($datei, 'x');
    if ($fp !== false) {
        fwrite($fp, bin2hex($neu) . "\n");
        fclose($fp);
        @chmod($datei, 0600);
        return $neu;
    }
    /* Anderer Prozess war schneller: dessen Schlüssel lesen */
    $buf = @hex2bin(trim((string)file_get_contents($datei)));
    if ($buf === false || strlen($buf) !== 32) {
        fehlerAbbruch('Schlüssel konnte nicht angelegt werden.');
    }
    return $buf;
}

$HAUPTSCHLUESSEL = ladeHauptschluessel($DATEN_ORDNER);
/* Getrennte Schlüssel ableiten: einer fürs Verschlüsseln, einer für den Index */
$K_VERSCHLUESSELUNG = hash_hkdf('sha256', $HAUPTSCHLUESSEL, 32, 'ms-verschluesselung');
$K_INDEX = hash_hkdf('sha256', $HAUPTSCHLUESSEL, 32, 'ms-suchindex');

function verschluessele($objekt): string
{
    global $K_VERSCHLUESSELUNG;
    $iv = random_bytes(12);
    $tag = '';
    $klar = json_encode($objekt, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $ct = openssl_encrypt($klar, 'aes-256-gcm', $K_VERSCHLUESSELUNG, OPENSSL_RAW_DATA, $iv, $tag);
    if ($ct === false) {
        throw new RuntimeException('Verschlüsselung fehlgeschlagen.');
    }
    return base64_encode($iv . $tag . $ct);
}
function entschluessele(string $text)
{
    global $K_VERSCHLUESSELUNG;
    $b = base64_decode($text, true);
    if ($b === false || strlen($b) < 28) {
        throw new RuntimeException('Datensatz beschädigt.');
    }
    $iv = substr($b, 0, 12);
    $tag = substr($b, 12, 16);
    $ct = substr($b, 28);
    $klar = openssl_decrypt($ct, 'aes-256-gcm', $K_VERSCHLUESSELUNG, OPENSSL_RAW_DATA, $iv, $tag);
    if ($klar === false) {
        throw new RuntimeException('Entschlüsselung fehlgeschlagen (falscher Schlüssel?).');
    }
    return json_decode($klar, true);
}
/* Deterministischer Index, damit Konten per E-Mail auffindbar bleiben,
   ohne die E-Mail im Klartext zu speichern */
function emailIndex(string $email): string
{
    global $K_INDEX;
    return hash_hmac('sha256', mb_strtolower(trim($email)), $K_INDEX);
}

/* ---------- Passwort-Hash (bcrypt über password_hash) ---------- */

function hashePasswort(string $pw): string
{
    return password_hash($pw, PASSWORD_DEFAULT);
}
function pruefePasswort(string $pw, ?string $gespeichert): bool
{
    if (!$gespeichert) {
        return false;
    }
    return password_verify($pw, $gespeichert);
}

/* ---------- Datenbank ---------- */

try {
    $db = new PDO('sqlite:' . $DATEN_ORDNER . '/masesites.db');
} catch (Throwable $e) {
    error_log('masesites DB-Init: ' . $e->getMessage());
    fehlerAbbruch('Datenbank konnte nicht geöffnet werden. Öffne /api/status für Details.');
}
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
/* WAL ist ein Tempo-Vorteil, aber auf manchen Hostings nicht möglich – dann
   lieber ohne WAL weiterlaufen als mit leerem 500 abbrechen. */
try { $db->exec('PRAGMA journal_mode = WAL'); } catch (Throwable $e) { error_log('masesites WAL aus: ' . $e->getMessage()); }
try { $db->exec('PRAGMA busy_timeout = 5000'); } catch (Throwable $e) {}
try { $db->exec('PRAGMA foreign_keys = ON'); } catch (Throwable $e) {}
try {
    $db->exec('
  CREATE TABLE IF NOT EXISTS kunden (
    email_idx TEXT PRIMARY KEY,
    pw        TEXT,
    provider  TEXT NOT NULL,
    daten     TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mitarbeiter (
    id        TEXT PRIMARY KEY,
    email_idx TEXT UNIQUE NOT NULL,
    pw        TEXT NOT NULL,
    aktiv     INTEGER NOT NULL DEFAULT 1,
    daten     TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sitzungen (
    token_hash TEXT PRIMARY KEY,
    typ        TEXT NOT NULL,
    wer        TEXT NOT NULL,
    ablauf     INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS einstellungen (
    schluessel TEXT PRIMARY KEY,
    wert       TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS log (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    zeit  INTEGER NOT NULL,
    daten TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS botlog (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    zeit  INTEGER NOT NULL,
    daten TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS raten (
    schluessel TEXT PRIMARY KEY,
    n          INTEGER NOT NULL,
    bis        INTEGER NOT NULL
  );
    ');
} catch (Throwable $e) {
    error_log('masesites DB-Tabellen: ' . $e->getMessage());
    fehlerAbbruch('Datenbank-Schreibzugriff fehlgeschlagen: ' . $e->getMessage()
        . ' (meist fehlende Schreibrechte in daten/ oder eine alte Datei dort). Test: /api/status?deep=1');
}

function einstellung(string $schluessel): ?string
{
    global $db;
    $s = $db->prepare('SELECT wert FROM einstellungen WHERE schluessel = ?');
    $s->execute([$schluessel]);
    $wert = $s->fetchColumn();
    return $wert === false ? null : (string)$wert;
}
function setzeEinstellung(string $schluessel, string $wert): void
{
    global $db;
    /* INSERT OR REPLACE statt "ON CONFLICT DO UPDATE" (UPSERT), damit es auch
       auf älterem SQLite < 3.24 läuft (z. B. system-libsqlite auf CentOS/RHEL). */
    $db->prepare('INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES (?, ?)')
        ->execute([$schluessel, $wert]);
}
/* Laufende Nummern zentral vergeben, damit nie eine doppelt vorkommt */
function naechsteNummer(string $name, int $start): int
{
    $n = max((int)(einstellung('zaehler_' . $name) ?? '0'), $start) + 1;
    setzeEinstellung('zaehler_' . $name, (string)$n);
    return $n;
}

/* ---------- Datum (Format wie im Frontend: TT.MM.JJJJ) ---------- */

function heute(): string
{
    return date('d.m.Y');
}
function jetztMs(): int
{
    return (int)round(microtime(true) * 1000);
}

/* ---------- Kunden ---------- */

function normalisiereKonto(array $k): array
{
    $k['name'] = isset($k['name']) && is_string($k['name']) ? $k['name'] : '';
    $k['firma'] = isset($k['firma']) && is_string($k['firma']) ? $k['firma'] : '';
    $k['telefon'] = isset($k['telefon']) && is_string($k['telefon']) ? $k['telefon'] : '';
    $k['projekte'] = isset($k['projekte']) && is_array($k['projekte']) ? array_values($k['projekte']) : [];
    $k['auftraege'] = isset($k['auftraege']) && is_array($k['auftraege']) ? array_values($k['auftraege']) : [];
    $k['tickets'] = isset($k['tickets']) && is_array($k['tickets']) ? array_values($k['tickets']) : [];
    $k['nachrichten'] = isset($k['nachrichten']) && is_array($k['nachrichten']) ? array_values($k['nachrichten']) : [];
    return $k;
}
function ladeKunde(string $email): ?array
{
    return ladeKundeNachIndex(emailIndex($email));
}
function ladeKundeNachIndex(string $idx): ?array
{
    global $db;
    $s = $db->prepare('SELECT daten FROM kunden WHERE email_idx = ?');
    $s->execute([$idx]);
    $zeile = $s->fetch();
    return $zeile ? normalisiereKonto(entschluessele($zeile['daten'])) : null;
}
function alleKunden(): array
{
    global $db;
    $liste = [];
    foreach ($db->query('SELECT daten FROM kunden') as $zeile) {
        $liste[] = normalisiereKonto(entschluessele($zeile['daten']));
    }
    return $liste;
}
function speichereKunde(array $konto, ?string $pwHash = null, ?string $provider = null): void
{
    global $db;
    $idx = emailIndex($konto['email']);
    $s = $db->prepare('SELECT email_idx FROM kunden WHERE email_idx = ?');
    $s->execute([$idx]);
    if ($s->fetch()) {
        $db->prepare('UPDATE kunden SET daten = ? WHERE email_idx = ?')
            ->execute([verschluessele($konto), $idx]);
    } else {
        $db->prepare('INSERT INTO kunden (email_idx, pw, provider, daten) VALUES (?, ?, ?, ?)')
            ->execute([$idx, $pwHash, $provider ?: 'email', verschluessele($konto)]);
    }
}
function loescheKunde(string $email): void
{
    global $db;
    $idx = emailIndex($email);
    $db->prepare('DELETE FROM kunden WHERE email_idx = ?')->execute([$idx]);
    $db->prepare("DELETE FROM sitzungen WHERE typ = 'kunde' AND wer = ?")->execute([$idx]);
    foreach (alleMitarbeiter() as $m) {
        if (in_array($email, $m['kunden'], true)) {
            $m['kunden'] = array_values(array_filter($m['kunden'], fn($e) => $e !== $email));
            aktualisiereMitarbeiterDaten($m);
        }
    }
}

/* ---------- Mitarbeiter ---------- */

function mitarbeiterAusZeile(array $zeile): array
{
    $m = entschluessele($zeile['daten']);
    $m['id'] = $zeile['id'];
    $m['aktiv'] = (int)$zeile['aktiv'] === 1;
    $m['kunden'] = isset($m['kunden']) && is_array($m['kunden']) ? array_values($m['kunden']) : [];
    return $m;
}
function alleMitarbeiter(): array
{
    global $db;
    $liste = [];
    foreach ($db->query('SELECT id, aktiv, daten FROM mitarbeiter') as $zeile) {
        $liste[] = mitarbeiterAusZeile($zeile);
    }
    return $liste;
}
function ladeMitarbeiter(string $id): ?array
{
    global $db;
    $s = $db->prepare('SELECT id, aktiv, daten FROM mitarbeiter WHERE id = ?');
    $s->execute([$id]);
    $zeile = $s->fetch();
    return $zeile ? mitarbeiterAusZeile($zeile) : null;
}
function ladeMitarbeiterNachEmail(string $email): ?array
{
    global $db;
    $s = $db->prepare('SELECT id, aktiv, daten FROM mitarbeiter WHERE email_idx = ?');
    $s->execute([emailIndex($email)]);
    $zeile = $s->fetch();
    return $zeile ? mitarbeiterAusZeile($zeile) : null;
}
function aktualisiereMitarbeiterDaten(array $m): void
{
    global $db;
    $db->prepare('UPDATE mitarbeiter SET aktiv = ?, daten = ? WHERE id = ?')->execute([
        $m['aktiv'] ? 1 : 0,
        verschluessele([
            'name' => $m['name'], 'rolle' => $m['rolle'] ?? '', 'email' => $m['email'],
            'erstellt' => $m['erstellt'] ?? '', 'kunden' => $m['kunden'],
        ]),
        $m['id'],
    ]);
}

/* ---------- Protokoll und Bot-Chats ---------- */

function schreibeLog(string $konto, string $ip, string $seite, string $aktion, string $detail): void
{
    global $db;
    $db->prepare('INSERT INTO log (zeit, daten) VALUES (?, ?)')->execute([
        jetztMs(),
        verschluessele([
            'konto' => kuerze($konto, 120), 'ip' => kuerze($ip, 60), 'seite' => kuerze($seite, 60),
            'aktion' => kuerze($aktion, 60), 'detail' => kuerze($detail, 180),
        ]),
    ]);
    $db->prepare('DELETE FROM log WHERE id NOT IN (SELECT id FROM log ORDER BY id DESC LIMIT ?)')
        ->execute([LOG_LIMIT]);
}
function ladeLog(): array
{
    global $db;
    $liste = [];
    foreach ($db->query('SELECT zeit, daten FROM log ORDER BY id') as $zeile) {
        $e = entschluessele($zeile['daten']);
        $e['zeit'] = (int)$zeile['zeit'];
        $liste[] = $e;
    }
    return $liste;
}
function schreibeBotlog(string $konto, string $seite, string $von, string $text): void
{
    global $db;
    $db->prepare('INSERT INTO botlog (zeit, daten) VALUES (?, ?)')->execute([
        jetztMs(),
        verschluessele([
            'konto' => kuerze($konto, 120), 'seite' => kuerze($seite, 60),
            'von' => kuerze($von, 20), 'text' => kuerze($text, 400),
        ]),
    ]);
    $db->prepare('DELETE FROM botlog WHERE id NOT IN (SELECT id FROM botlog ORDER BY id DESC LIMIT ?)')
        ->execute([BOTLOG_LIMIT]);
}
function ladeBotlog(): array
{
    global $db;
    $liste = [];
    foreach ($db->query('SELECT zeit, daten FROM botlog ORDER BY id') as $zeile) {
        $e = entschluessele($zeile['daten']);
        $e['zeit'] = (int)$zeile['zeit'];
        $liste[] = $e;
    }
    return $liste;
}

/* ---------- Admin-Startpasswort ---------- */

function stelleAdminPasswortSicher(string $ordner): void
{
    if (einstellung('admin_pw')) {
        return;
    }
    $zeichen = 'abcdefghjkmnpqrstuvwxyz23456789';
    $pw = '';
    for ($i = 0; $i < 12; $i++) {
        if ($i === 4 || $i === 8) {
            $pw .= '-';
        }
        $pw .= $zeichen[random_int(0, strlen($zeichen) - 1)];
    }
    setzeEinstellung('admin_pw', hashePasswort($pw));
    setzeEinstellung('admin_pw_geaendert', '0');
    /* PHP hat keine Konsole: Passwort in eine geschützte Datei schreiben */
    @file_put_contents(
        $ordner . '/admin-startpasswort.txt',
        "masesites Admin-Startpasswort: $pw\n" .
        "Anmeldung unter /admin. Nach dem ersten Login unter Einstellungen ändern.\n" .
        "Diese Datei wird beim Ändern automatisch gelöscht.\n"
    );
    @chmod($ordner . '/admin-startpasswort.txt', 0600);
}

/* ---------- Sitzungen ---------- */

function tokenHash(string $token): string
{
    return hash('sha256', $token);
}
function erstelleSitzung(string $typ, string $wer): string
{
    global $db;
    $token = bin2hex(random_bytes(32));
    $db->prepare('INSERT INTO sitzungen (token_hash, typ, wer, ablauf) VALUES (?, ?, ?, ?)')
        ->execute([tokenHash($token), $typ, $wer, time() + SITZUNG_DAUER[$typ]]);
    return $token;
}
function findeSitzung(string $typ): ?array
{
    global $db;
    $token = $_COOKIE[COOKIE_NAMEN[$typ]] ?? '';
    if (!$token) {
        return null;
    }
    $s = $db->prepare('SELECT token_hash, typ, wer, ablauf FROM sitzungen WHERE token_hash = ?');
    $s->execute([tokenHash($token)]);
    $zeile = $s->fetch();
    if (!$zeile || $zeile['typ'] !== $typ) {
        return null;
    }
    if ((int)$zeile['ablauf'] < time()) {
        $db->prepare('DELETE FROM sitzungen WHERE token_hash = ?')->execute([$zeile['token_hash']]);
        return null;
    }
    $dauer = SITZUNG_DAUER[$typ];
    if ((int)$zeile['ablauf'] - time() < $dauer / 2) {
        $db->prepare('UPDATE sitzungen SET ablauf = ? WHERE token_hash = ?')
            ->execute([time() + $dauer, $zeile['token_hash']]);
    }
    return $zeile;
}
function irgendeineSitzung(): ?array
{
    return findeSitzung('admin') ?? findeSitzung('mitarbeiter') ?? findeSitzung('kunde');
}
function loescheSitzung(string $typ): void
{
    global $db;
    $token = $_COOKIE[COOKIE_NAMEN[$typ]] ?? '';
    if ($token) {
        $db->prepare('DELETE FROM sitzungen WHERE token_hash = ?')->execute([tokenHash($token)]);
    }
}
function setzeSitzungscookie(string $token, string $typ): void
{
    $optionen = [
        'expires' => $typ === 'kunde' ? time() + SITZUNG_DAUER['kunde'] : 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => istHttps(),
    ];
    setcookie(COOKIE_NAMEN[$typ], $token, $optionen);
}
function loescheSitzungscookie(array $typen): void
{
    foreach ($typen as $typ) {
        setcookie(COOKIE_NAMEN[$typ], '', [
            'expires' => time() - 3600, 'path' => '/',
            'httponly' => true, 'samesite' => 'Lax', 'secure' => istHttps(),
        ]);
    }
}
function raeumeSitzungenAuf(): void
{
    global $db;
    if (random_int(1, 50) !== 1) {
        return;   /* nur gelegentlich, spart Arbeit */
    }
    $db->prepare('DELETE FROM sitzungen WHERE ablauf < ?')->execute([time()]);
    $db->prepare('DELETE FROM raten WHERE bis < ?')->execute([jetztMs()]);
}

/* ---------- HTTP-Helfer ---------- */

function istHttps(): bool
{
    global $HINTER_PROXY;
    if ($HINTER_PROXY && ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
        return true;
    }
    if (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    return ($_SERVER['SERVER_PORT'] ?? '') === '443';
}
function clientIp(): string
{
    global $HINTER_PROXY;
    if ($HINTER_PROXY && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $teile = explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($teile[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unbekannt';
}
function kuerze($text, int $laenge): string
{
    return mb_substr((string)($text ?? ''), 0, $laenge);
}
function antwortJson(int $code, array $objekt): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($objekt, JSON_UNESCAPED_UNICODE);
    exit;
}
function fehler(int $code, string $text): void
{
    antwortJson($code, ['fehler' => $text]);
}
function fehlerAbbruch(string $text): void
{
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['fehler' => 'Serverfehler: ' . $text], JSON_UNESCAPED_UNICODE);
    exit;
}
function leseKoerper(): array
{
    $roh = file_get_contents('php://input', false, null, 0, KOERPER_LIMIT + 1);
    if ($roh === false || $roh === '') {
        return [];
    }
    if (strlen($roh) > KOERPER_LIMIT) {
        fehler(400, 'Anfrage ist zu gross.');
    }
    $daten = json_decode($roh, true);
    if (!is_array($daten)) {
        return [];
    }
    return $daten;
}

/* ---------- Ratenbegrenzung (in der DB, da PHP je Aufruf frisch startet) ---------- */

function ratenbegrenzung(string $topf, string $ip, int $max, int $fensterMs): bool
{
    global $db;
    $schluessel = $topf . ':' . $ip;
    $jetzt = jetztMs();
    $s = $db->prepare('SELECT n, bis FROM raten WHERE schluessel = ?');
    $s->execute([$schluessel]);
    $eintrag = $s->fetch();
    if (!$eintrag || (int)$eintrag['bis'] < $jetzt) {
        /* INSERT OR REPLACE statt UPSERT – siehe setzeEinstellung (SQLite < 3.24). */
        $db->prepare('INSERT OR REPLACE INTO raten (schluessel, n, bis) VALUES (?, 1, ?)')
            ->execute([$schluessel, $jetzt + $fensterMs]);
        return true;
    }
    $db->prepare('UPDATE raten SET n = n + 1 WHERE schluessel = ?')->execute([$schluessel]);
    return (int)$eintrag['n'] + 1 <= $max;
}

/* ---------- Eingaben säubern ---------- */

function s($wert, int $max): string
{
    return trim(kuerze(is_string($wert) ? $wert : '', $max));
}
function nr($wert): int
{
    return is_numeric($wert) ? (int)$wert : 0;
}
function saeubereAntworten($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    return array_map(fn($a) => [
        'von' => s($a['von'] ?? '', 20) ?: 'ich',
        'text' => s($a['text'] ?? '', 4000),
        'datum' => s($a['datum'] ?? '', 10),
        'zeit' => nr($a['zeit'] ?? 0),
    ], array_slice(array_values($liste), 0, 300));
}
function saeubereTickets($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    return array_map(fn($t) => [
        'nr' => s($t['nr'] ?? '', 16),
        'betreff' => s($t['betreff'] ?? '', 160),
        'text' => s($t['text'] ?? '', 4000),
        'prio' => s($t['prio'] ?? '', 20) ?: 'Normal',
        'status' => in_array($t['status'] ?? '', ['Offen', 'Beantwortet', 'Geschlossen'], true) ? $t['status'] : 'Offen',
        'datum' => s($t['datum'] ?? '', 10),
        'zeit' => nr($t['zeit'] ?? 0),
        'antworten' => saeubereAntworten($t['antworten'] ?? []),
    ], array_slice(array_values($liste), 0, 300));
}
function saeubereNachrichten($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    return array_map(fn($n) => [
        'von' => s($n['von'] ?? '', 20) ?: 'ich',
        'text' => s($n['text'] ?? '', 4000),
        'datum' => s($n['datum'] ?? '', 10),
        'zeit' => nr($n['zeit'] ?? 0),
        'gelesen' => !empty($n['gelesen']),
    ], array_slice(array_values($liste), 0, 1500));
}
function saeubereProjekte($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    return array_map(function ($p) {
        $akt = is_array($p['aktivitaet'] ?? null) ? $p['aktivitaet'] : [];
        return [
            'id' => s($p['id'] ?? '', 16),
            'titel' => s($p['titel'] ?? '', 160),
            'paket' => s($p['paket'] ?? '', 160),
            'schritt' => max(0, min(SCHRITTE_ANZAHL - 1, nr($p['schritt'] ?? 0))),
            'vorschau' => s($p['vorschau'] ?? '', 400),
            'erstellt' => s($p['erstellt'] ?? '', 10),
            'aktivitaet' => array_map(fn($a) => [
                'text' => s($a['text'] ?? '', 500),
                'datum' => s($a['datum'] ?? '', 10),
                'zeit' => nr($a['zeit'] ?? 0),
            ], array_slice(array_values($akt), 0, 500)),
            'todos' => saeubereTodos($p['todos'] ?? []),
        ];
    }, array_slice(array_values($liste), 0, 100));
}
/* Wunschliste (ToDos) eines Projekts – die pflegt der Kunde selbst. */
function saeubereTodos($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    return array_map(fn($t) => [
        'text' => s($t['text'] ?? '', 400),
        'erledigt' => !empty($t['erledigt']),
        'zeit' => nr($t['zeit'] ?? 0),
    ], array_slice(array_values($liste), 0, 200));
}
function saeubereAuftraege($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    return array_map(fn($a) => [
        'titel' => s($a['titel'] ?? '', 160),
        'betrag' => s($a['betrag'] ?? '', 60),
        'status' => in_array($a['status'] ?? '', ['Offen', 'In Arbeit', 'Abgeschlossen'], true) ? $a['status'] : 'Offen',
        'datum' => s($a['datum'] ?? '', 10),
    ], array_slice(array_values($liste), 0, 200));
}

/* ---------- Website-Inhalte: Beispiele (Live-Demos) und Referenz-Projekte ----------
   Öffentliche Inhalte, die der Admin im Dashboard pflegt. Liegen als JSON in
   den Einstellungen (kein Personenbezug, darum unverschlüsselt). */

function saeubereBeispiele($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    $ergebnis = [];
    foreach (array_slice(array_values($liste), 0, 60) as $b) {
        if (!is_array($b)) {
            continue;
        }
        $name = s($b['name'] ?? '', 120);
        $url = s($b['url'] ?? '', 400);
        if ($name === '' || !preg_match('#^https?://#i', $url)) {
            continue;
        }
        $ergebnis[] = [
            'id' => s($b['id'] ?? '', 24) ?: ('B-' . bin2hex(random_bytes(4))),
            'name' => $name,
            'branche' => s($b['branche'] ?? '', 60),
            'beschreibung' => s($b['beschreibung'] ?? '', 300),
            'url' => $url,
            'bild' => s($b['bild'] ?? '', 400),
        ];
    }
    return $ergebnis;
}
function saeubereReferenzProjekte($liste): array
{
    if (!is_array($liste)) {
        return [];
    }
    $ergebnis = [];
    foreach (array_slice(array_values($liste), 0, 60) as $p) {
        if (!is_array($p)) {
            continue;
        }
        $firma = s($p['firma'] ?? '', 120);
        if ($firma === '') {
            continue;
        }
        $url = s($p['url'] ?? '', 400);
        $ergebnis[] = [
            'id' => s($p['id'] ?? '', 24) ?: ('R-' . bin2hex(random_bytes(4))),
            'firma' => $firma,
            'branche' => s($p['branche'] ?? '', 60),
            'beschreibung' => s($p['beschreibung'] ?? '', 1200),
            'url' => preg_match('#^https?://#i', $url) ? $url : '',
            'bild' => s($p['bild'] ?? '', 400),
        ];
    }
    return $ergebnis;
}
function ladeInhalte(): array
{
    $b = json_decode((string)(einstellung('inhalte_beispiele') ?? 'null'), true);
    $p = json_decode((string)(einstellung('inhalte_projekte') ?? 'null'), true);
    return [
        'beispiele' => saeubereBeispiele($b),
        'projekte' => saeubereReferenzProjekte($p),
    ];
}
/* Beim ersten Lauf mit den vier bestehenden Live-Demos befüllen,
   damit die Beispiele-Seite ohne Pflege genauso aussieht wie bisher. */
function stelleInhalteSicher(): void
{
    if (einstellung('inhalte_beispiele') !== null) {
        return;
    }
    setzeEinstellung('inhalte_beispiele', json_encode([
        ['id' => 'B-kebab', 'name' => 'Kebab Palace', 'branche' => 'Gastronomie', 'beschreibung' => 'Speisekarte, Bestellung und Standort im Fokus.', 'url' => 'https://masesites.ch/demo/doener-site/index.html', 'bild' => 'assets/img/demos/kebab.jpg'],
        ['id' => 'B-nails', 'name' => 'Nails & Co.', 'branche' => 'Beauty', 'beschreibung' => 'Elegantes Einseiten-Design mit Galerie und Terminbuchung.', 'url' => 'https://masesites.ch/demo/nagelstudio-site/index.html', 'bild' => 'assets/img/demos/nagelstudio.jpg'],
        ['id' => 'B-praxis', 'name' => 'Praxis Dr. Müller', 'branche' => 'Gesundheit', 'beschreibung' => 'Seriöser Auftritt mit ruhiger Typografie und Terminbuchung.', 'url' => 'https://masesites.ch/demo/praxis-site/index.html', 'bild' => 'assets/img/demos/praxis.jpg'],
        ['id' => 'B-bowling', 'name' => 'Strike Zone Bowling', 'branche' => 'Freizeit', 'beschreibung' => 'Klares Layout mit Fokus auf Bahnreservierung und Events.', 'url' => 'https://masesites.ch/demo/bowling-site/index.html', 'bild' => 'assets/img/demos/bowling.jpg'],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    if (einstellung('inhalte_projekte') === null) {
        setzeEinstellung('inhalte_projekte', '[]');
    }
}

/* Nachrichten/Antworten zusammenführen statt überschreiben, damit sich
   Kunde und Team nicht gegenseitig Einträge wegspeichern. */
function vereineNachrichten($alt, $neu): array
{
    $karte = [];
    $reihenfolge = [];
    $schluessel = fn($n) => ($n['zeit'] ?? 0) . '|' . ($n['von'] ?? '') . '|' . ($n['text'] ?? '');
    foreach (array_merge(is_array($alt) ? $alt : [], is_array($neu) ? $neu : []) as $n) {
        $k = $schluessel($n);
        if (isset($karte[$k])) {
            $karte[$k]['gelesen'] = ($karte[$k]['gelesen'] ?? false) || !empty($n['gelesen']);
        } else {
            $karte[$k] = $n;
            $reihenfolge[] = $k;
        }
    }
    $ergebnis = array_map(fn($k) => $karte[$k], $reihenfolge);
    usort($ergebnis, fn($a, $b) => ($a['zeit'] ?? 0) <=> ($b['zeit'] ?? 0));
    return $ergebnis;
}
function vereineTickets($alt, $neu): array
{
    $alt = is_array($alt) ? $alt : [];
    $neu = is_array($neu) ? $neu : [];
    $ergebnis = [];
    $gesehen = [];
    foreach ($neu as $t) {
        foreach ($alt as $altes) {
            if (($altes['nr'] ?? null) === ($t['nr'] ?? null)) {
                $t['antworten'] = vereineNachrichten($altes['antworten'] ?? [], $t['antworten'] ?? []);
                break;
            }
        }
        $gesehen[$t['nr'] ?? ''] = true;
        $ergebnis[] = $t;
    }
    foreach ($alt as $t) {
        if (empty($gesehen[$t['nr'] ?? ''])) {
            $ergebnis[] = $t;
        }
    }
    return $ergebnis;
}

/* ---------- Log-Beschriftung aus der Sitzung ---------- */

function logLabel(?array $sitzung): string
{
    if (!$sitzung) {
        return 'Gast';
    }
    if ($sitzung['typ'] === 'admin') {
        return 'Admin';
    }
    if ($sitzung['typ'] === 'kunde') {
        $k = ladeKundeNachIndex($sitzung['wer']);
        return $k ? $k['email'] : 'Kunde';
    }
    if ($sitzung['typ'] === 'mitarbeiter') {
        $m = ladeMitarbeiter($sitzung['wer']);
        return $m ? 'MA ' . $m['name'] : 'Mitarbeiter';
    }
    return 'Gast';
}

/* ---------- Konto ohne Geheimnisse an den Client ---------- */

function kontoFuerClient(array $konto): array
{
    unset($konto['pw'], $konto['pwHash'], $konto['salt'], $konto['pwLegacy']);
    return $konto;
}

/* ---------- Demo-Konto ---------- */

function demoKonto(): array
{
    $ts = fn($tag, $monat, $stunde, $minute) => mktime($stunde, $minute, 0, $monat, $tag, 2026) * 1000;
    return [
        'name' => 'Deniz Yilmaz', 'firma' => 'Kebab Palace', 'telefon' => '+41 79 123 45 67',
        'email' => 'demo@masesites.ch', 'provider' => 'demo', 'erstellt' => '20.06.2026',
        'projekte' => [
            [
                'id' => 'P-1001', 'titel' => 'Website Kebab Palace', 'paket' => 'Neue Website: Business',
                'schritt' => 2, 'vorschau' => 'https://masesites.ch/demo/doener-site/index.html',
                'erstellt' => '28.06.2026',
                'aktivitaet' => [
                    ['text' => 'Galerie-Bereich eingebaut, Bilder folgen', 'datum' => '05.07.2026', 'zeit' => $ts(5, 7, 9, 40)],
                    ['text' => 'Farben nach deinem Feedback angepasst', 'datum' => '03.07.2026', 'zeit' => $ts(3, 7, 15, 10)],
                    ['text' => 'Design-Entwurf in die Vorschau gestellt', 'datum' => '01.07.2026', 'zeit' => $ts(1, 7, 14, 0)],
                    ['text' => 'Konzept-Besprechung abgeschlossen, Projekt gestartet', 'datum' => '28.06.2026', 'zeit' => $ts(28, 6, 11, 30)],
                ],
            ],
            [
                'id' => 'P-1002', 'titel' => 'KI-Bot für die Website', 'paket' => 'KI-Bot: Einrichtung und Training',
                'schritt' => 1, 'vorschau' => '', 'erstellt' => '02.07.2026',
                'aktivitaet' => [
                    ['text' => 'Fragen und Antworten für das Training gesammelt', 'datum' => '04.07.2026', 'zeit' => $ts(4, 7, 16, 20)],
                    ['text' => 'Auftrag bestätigt, Einrichtung geplant', 'datum' => '02.07.2026', 'zeit' => $ts(2, 7, 10, 5)],
                ],
            ],
        ],
        'nachrichten' => [
            ['von' => 'masesites', 'text' => 'Hallo Deniz! Der erste Design-Entwurf ist online. Schau ihn dir unter Projekte in der Vorschau an und sag uns, was du denkst.', 'datum' => '01.07.2026', 'zeit' => $ts(1, 7, 14, 20), 'gelesen' => true],
            ['von' => 'ich', 'text' => 'Sieht stark aus! Könnt ihr das Rot etwas dunkler machen?', 'datum' => '02.07.2026', 'zeit' => $ts(2, 7, 9, 41), 'gelesen' => true],
            ['von' => 'masesites', 'text' => 'Erledigt, das Rot ist jetzt dunkler. Als Nächstes bauen wir die Galerie ein.', 'datum' => '03.07.2026', 'zeit' => $ts(3, 7, 11, 5), 'gelesen' => true],
            ['von' => 'masesites', 'text' => 'Die Galerie ist eingebaut. Sobald du die finalen Bilder hast, schick sie uns per Ticket oder Mail.', 'datum' => '05.07.2026', 'zeit' => $ts(5, 7, 10, 12), 'gelesen' => false],
        ],
        'auftraege' => [
            ['titel' => 'Neue Website: Business', 'betrag' => "ab CHF 1'300.–", 'status' => 'In Arbeit', 'datum' => '28.06.2026'],
            ['titel' => 'KI-Bot: Einrichtung', 'betrag' => 'CHF 200.–', 'status' => 'In Arbeit', 'datum' => '02.07.2026'],
            ['titel' => 'Online-Terminbuchung', 'betrag' => 'ab CHF 400.–', 'status' => 'Offen', 'datum' => '02.07.2026'],
            ['titel' => 'Logo-Feinschliff', 'betrag' => 'CHF 150.–', 'status' => 'Abgeschlossen', 'datum' => '21.06.2026'],
        ],
        'tickets' => [
            [
                'nr' => 'T-1025', 'betreff' => 'Neues Foto für die Galerie',
                'text' => 'Ich habe ein neues Bild vom Lokal, wohin darf ich es schicken?',
                'prio' => 'Normal', 'status' => 'Offen', 'datum' => '04.07.2026', 'zeit' => $ts(4, 7, 18, 2), 'antworten' => [],
            ],
            [
                'nr' => 'T-1024', 'betreff' => 'Öffnungszeiten ändern',
                'text' => 'Bitte neu Montag bis Samstag, 10 bis 22 Uhr.',
                'prio' => 'Normal', 'status' => 'Beantwortet', 'datum' => '01.07.2026', 'zeit' => $ts(1, 7, 9, 15),
                'antworten' => [
                    ['von' => 'masesites', 'text' => 'Erledigt, die neuen Öffnungszeiten sind online. Schau kurz drüber, ob alles stimmt.', 'datum' => '02.07.2026', 'zeit' => $ts(2, 7, 8, 50)],
                ],
            ],
            [
                'nr' => 'T-1019', 'betreff' => 'Logo etwas grösser',
                'text' => 'Könnt ihr das Logo im Kopfbereich etwas grösser machen?',
                'prio' => 'Normal', 'status' => 'Geschlossen', 'datum' => '24.06.2026', 'zeit' => $ts(24, 6, 13, 40),
                'antworten' => [
                    ['von' => 'masesites', 'text' => 'Ist angepasst, das Logo ist jetzt besser sichtbar.', 'datum' => '25.06.2026', 'zeit' => $ts(25, 6, 10, 25)],
                ],
            ],
        ],
    ];
}

/* ---------- Routen ---------- */

$ROUTEN = [];
function route(string $methode, string $muster, ?string $schutz, callable $handler): void
{
    global $ROUTEN;
    $namen = [];
    $regex = '#^' . preg_replace_callback('#:([^/]+)#', function ($m) use (&$namen) {
        $namen[] = $m[1];
        return '([^/]+)';
    }, $muster) . '$#';
    $ROUTEN[] = ['methode' => $methode, 'regex' => $regex, 'namen' => $namen, 'schutz' => $schutz, 'handler' => $handler];
}

/* (Der Diagnose-Endpunkt /api/status wird schon oben früh beantwortet,
   damit er auch bei fehlender DB/Schlüssel funktioniert.) */

/* --- Kunde: Registrierung und Anmeldung --- */

route('POST', '/api/registrieren', null, function ($p, $body) {
    if (!ratenbegrenzung('registrieren', clientIp(), 10, 3600 * 1000)) {
        fehler(429, 'Zu viele Versuche. Probiere es später nochmal.');
    }
    $email = mb_strtolower(s($body['email'] ?? '', 200));
    $name = s($body['name'] ?? '', 80);
    $pw = (string)($body['passwort'] ?? '');
    if (!$name) {
        fehler(400, 'Sag uns kurz, wie du heisst.');
    }
    if (!preg_match(EMAIL_MUSTER, $email)) {
        fehler(400, 'Diese E-Mail-Adresse sieht nicht gültig aus.');
    }
    if (strlen($pw) < 8) {
        fehler(400, 'Das Passwort braucht mindestens 8 Zeichen.');
    }
    if (ladeKunde($email)) {
        fehler(409, 'Diese E-Mail ist schon registriert. Wechsle oben zu Anmelden.');
    }
    $konto = normalisiereKonto([
        'name' => $name, 'firma' => s($body['firma'] ?? '', 120), 'telefon' => s($body['telefon'] ?? '', 40),
        'email' => $email, 'provider' => 'email', 'erstellt' => heute(),
    ]);
    speichereKunde($konto, hashePasswort($pw), 'email');
    setzeSitzungscookie(erstelleSitzung('kunde', emailIndex($email)), 'kunde');
    schreibeLog($email, clientIp(), 'login.html', 'Konto erstellt', '');
    antwortJson(200, ['ok' => true, 'konto' => kontoFuerClient($konto)]);
});

/* Einmalige Migration alter localStorage-Konten aus der Prototyp-Zeit.
   Offen (Kunden sind noch nicht angemeldet), aber bewusst harmlos:
   legt NUR nicht vorhandene Konten an, überschreibt nie ein bestehendes,
   und ist ratenbegrenzt. Das alte Passwort (SHA-256+Salt) wird mitgenommen
   und beim ersten Login auf bcrypt umgestellt. */
route('POST', '/api/import', null, function ($p, $body) {
    if (!ratenbegrenzung('import', clientIp(), 40, 3600 * 1000)) {
        fehler(429, 'Zu viele Importe. Bitte später erneut.');
    }
    $konten = is_array($body['konten'] ?? null) ? $body['konten'] : [];
    $angelegt = 0;
    $uebersprungen = 0;
    foreach (array_slice(array_values($konten), 0, 500) as $alt) {
        if (!is_array($alt)) { $uebersprungen++; continue; }
        $email = mb_strtolower(s($alt['email'] ?? '', 200));
        $provider = in_array($alt['provider'] ?? '', ['email', 'google'], true) ? $alt['provider'] : 'email';
        if (!preg_match(EMAIL_MUSTER, $email)) { $uebersprungen++; continue; }
        if (ladeKunde($email)) { $uebersprungen++; continue; }   /* nie überschreiben */

        $pwLegacy = null;
        if ($provider === 'email') {
            $salt = s($alt['salt'] ?? '', 64);
            $ph = mb_strtolower(s($alt['pwHash'] ?? '', 128));
            if ($salt !== '' && $ph !== '' && ctype_xdigit($salt) && ctype_xdigit($ph)) {
                $pwLegacy = ['salt' => $salt, 'hash' => $ph];
            } else {
                /* E-Mail-Konto ohne brauchbares Passwort: nicht importierbar,
                   die Person registriert sich einfach neu. */
                $uebersprungen++;
                continue;
            }
        }
        $konto = normalisiereKonto([
            'name' => s($alt['name'] ?? '', 80),
            'firma' => s($alt['firma'] ?? '', 120),
            'telefon' => s($alt['telefon'] ?? '', 40),
            'email' => $email,
            'provider' => $provider,
            'erstellt' => s($alt['erstellt'] ?? '', 10) ?: heute(),
            'projekte' => saeubereProjekte($alt['projekte'] ?? []),
            'auftraege' => saeubereAuftraege($alt['auftraege'] ?? []),
            'tickets' => saeubereTickets($alt['tickets'] ?? []),
            'nachrichten' => saeubereNachrichten($alt['nachrichten'] ?? []),
        ]);
        if ($pwLegacy) { $konto['pwLegacy'] = $pwLegacy; }
        speichereKunde($konto, null, $provider);
        schreibeLog($email, clientIp(), 'migration', 'Konto migriert', $provider);
        $angelegt++;
    }
    antwortJson(200, ['ok' => true, 'angelegt' => $angelegt, 'uebersprungen' => $uebersprungen]);
});

route('POST', '/api/anmelden', null, function ($p, $body) {
    if (!ratenbegrenzung('anmelden', clientIp(), 20, 10 * 60000)) {
        fehler(429, 'Zu viele Versuche. Warte ein paar Minuten.');
    }
    global $db;
    $email = mb_strtolower(s($body['email'] ?? '', 200));
    $s = $db->prepare('SELECT pw, provider, daten FROM kunden WHERE email_idx = ?');
    $s->execute([emailIndex($email)]);
    $zeile = $s->fetch();
    if (!$zeile) {
        /* Gleiche Rechenzeit wie bei echtem Konto (Timing nicht verraten) */
        password_verify((string)($body['passwort'] ?? ''), '$2y$10$usesomesillystringforsaltingthepasswordxxxxxxxxxxxxxxxxxxx');
        fehler(401, FALSCHE_ANMELDUNG);
    }
    if ($zeile['provider'] === 'google') {
        fehler(400, 'Dieses Konto nutzt die Google-Anmeldung. Nimm den Google-Knopf unten.');
    }
    if ($zeile['provider'] === 'demo') {
        fehler(400, 'Das Demo-Konto öffnest du über den Link unten.');
    }
    $eingabe = (string)($body['passwort'] ?? '');
    $konto = normalisiereKonto(entschluessele($zeile['daten']));
    $okLogin = false;
    if ($zeile['pw']) {
        $okLogin = pruefePasswort($eingabe, $zeile['pw']);
    } elseif (isset($konto['pwLegacy']['salt'], $konto['pwLegacy']['hash'])) {
        /* Übergang aus der Prototyp-Zeit: altes Passwort war SHA-256(salt + passwort).
           Stimmt es, sofort auf bcrypt umstellen – danach ein ganz normales Konto. */
        $berechnet = hash('sha256', (string)$konto['pwLegacy']['salt'] . $eingabe);
        if (hash_equals((string)$konto['pwLegacy']['hash'], $berechnet)) {
            $okLogin = true;
            unset($konto['pwLegacy']);
            $db->prepare('UPDATE kunden SET pw = ?, provider = ?, daten = ? WHERE email_idx = ?')
                ->execute([hashePasswort($eingabe), 'email', verschluessele($konto), emailIndex($email)]);
        }
    }
    if (!$okLogin) {
        schreibeLog($email, clientIp(), 'login.html', 'Anmeldung fehlgeschlagen', '');
        fehler(401, FALSCHE_ANMELDUNG);
    }
    setzeSitzungscookie(erstelleSitzung('kunde', emailIndex($email)), 'kunde');
    schreibeLog($email, clientIp(), 'login.html', 'Angemeldet', '');
    antwortJson(200, ['ok' => true, 'konto' => kontoFuerClient($konto)]);
});

route('POST', '/api/google', null, function ($p, $body) {
    global $GOOGLE_CLIENT_ID;
    if (!ratenbegrenzung('anmelden', clientIp(), 20, 10 * 60000)) {
        fehler(429, 'Zu viele Versuche. Warte ein paar Minuten.');
    }
    $credential = (string)($body['credential'] ?? '');
    if (!$credential || strlen($credential) > 4096) {
        fehler(400, 'Ungültige Google-Antwort.');
    }
    /* Das ID-Token bei Google prüfen lassen (Signatur, Ablauf) */
    $ch = curl_init('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $antwort = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($antwort === false || $status !== 200) {
        fehler(502, 'Google ist gerade nicht erreichbar. Probiere es gleich nochmal.');
    }
    $profil = json_decode((string)$antwort, true);
    if (!is_array($profil)) {
        fehler(502, 'Google hat unerwartet geantwortet.');
    }
    if (($profil['aud'] ?? '') !== $GOOGLE_CLIENT_ID) {
        fehler(401, 'Google-Anmeldung gehört nicht zu dieser Website.');
    }
    $verifiziert = $profil['email_verified'] ?? '';
    if ($verifiziert !== 'true' && $verifiziert !== true) {
        fehler(401, 'Diese Google-E-Mail ist nicht bestätigt.');
    }
    $email = mb_strtolower(s($profil['email'] ?? '', 200));
    if (!preg_match(EMAIL_MUSTER, $email)) {
        fehler(400, 'Ungültige Google-Antwort.');
    }
    $konto = ladeKunde($email);
    if (!$konto) {
        $konto = normalisiereKonto([
            'name' => s($profil['name'] ?? '', 80) ?: explode('@', $email)[0],
            'email' => $email, 'provider' => 'google', 'erstellt' => heute(),
        ]);
        speichereKunde($konto, null, 'google');
        schreibeLog($email, clientIp(), 'login.html', 'Konto erstellt (Google)', '');
    }
    setzeSitzungscookie(erstelleSitzung('kunde', emailIndex($email)), 'kunde');
    schreibeLog($email, clientIp(), 'login.html', 'Angemeldet (Google)', '');
    antwortJson(200, ['ok' => true, 'konto' => kontoFuerClient($konto)]);
});

route('POST', '/api/demo', null, function () {
    global $db;
    if (!ratenbegrenzung('anmelden', clientIp(), 20, 10 * 60000)) {
        fehler(429, 'Zu viele Versuche. Warte ein paar Minuten.');
    }
    $konto = demoKonto();
    speichereKunde($konto, null, 'demo');
    $db->prepare("UPDATE kunden SET provider = 'demo' WHERE email_idx = ?")->execute([emailIndex($konto['email'])]);
    setzeSitzungscookie(erstelleSitzung('kunde', emailIndex($konto['email'])), 'kunde');
    antwortJson(200, ['ok' => true, 'konto' => kontoFuerClient($konto)]);
});

route('POST', '/api/abmelden', null, function ($p, $body) {
    $typen = isset(COOKIE_NAMEN[$body['typ'] ?? '']) ? [$body['typ']] : ['kunde', 'mitarbeiter', 'admin'];
    foreach ($typen as $typ) {
        loescheSitzung($typ);
    }
    loescheSitzungscookie($typen);
    antwortJson(200, ['ok' => true]);
});

/* --- Kunde: eigene Daten --- */

route('GET', '/api/ich', 'kunde', function ($p, $body, $sitzung) {
    $konto = ladeKundeNachIndex($sitzung['wer']);
    if (!$konto) {
        loescheSitzungscookie(['kunde']);
        fehler(401, 'Nicht angemeldet.');
    }
    antwortJson(200, ['konto' => kontoFuerClient($konto)]);
});

route('PUT', '/api/ich', 'kunde', function ($p, $body, $sitzung) {
    $konto = ladeKundeNachIndex($sitzung['wer']);
    if (!$konto) {
        fehler(401, 'Nicht angemeldet.');
    }
    $neu = is_array($body['konto'] ?? null) ? $body['konto'] : [];
    /* Der Kunde darf nur Profil, Tickets und Nachrichten ändern. */
    $konto['name'] = s($neu['name'] ?? '', 80) ?: $konto['name'];
    $konto['firma'] = s($neu['firma'] ?? '', 120);
    $konto['telefon'] = s($neu['telefon'] ?? '', 40);
    $konto['tickets'] = vereineTickets($konto['tickets'], saeubereTickets($neu['tickets'] ?? []));
    $konto['nachrichten'] = vereineNachrichten($konto['nachrichten'], saeubereNachrichten($neu['nachrichten'] ?? []));
    /* Wünsche/ToDos darf der Kunde selbst pflegen – aber nur diese, keine anderen
       Projektfelder (Titel, Schritt, Vorschau bleiben Sache des Teams). */
    $eingehend = [];
    foreach (is_array($neu['projekte'] ?? null) ? $neu['projekte'] : [] as $pr) {
        if (is_array($pr) && !empty($pr['id'])) {
            $eingehend[s($pr['id'], 16)] = saeubereTodos($pr['todos'] ?? []);
        }
    }
    $konto['projekte'] = array_map(function ($pr) use ($eingehend) {
        if (is_array($pr) && isset($pr['id']) && array_key_exists($pr['id'], $eingehend)) {
            $pr['todos'] = $eingehend[$pr['id']];
        }
        return $pr;
    }, is_array($konto['projekte'] ?? null) ? $konto['projekte'] : []);
    speichereKunde($konto);
    antwortJson(200, ['ok' => true]);
});

route('POST', '/api/ich/tickets', 'kunde', function ($p, $body, $sitzung) {
    $konto = ladeKundeNachIndex($sitzung['wer']);
    if (!$konto) {
        fehler(401, 'Nicht angemeldet.');
    }
    $betreff = s($body['betreff'] ?? '', 160);
    $text = s($body['text'] ?? '', 4000);
    if (!$betreff || !$text) {
        fehler(400, 'Betreff und Beschreibung dürfen nicht leer sein.');
    }
    $ticket = [
        'nr' => 'T-' . naechsteNummer('ticket', 1000),
        'betreff' => $betreff, 'text' => $text,
        'prio' => s($body['prio'] ?? '', 20) ?: 'Normal',
        'status' => 'Offen', 'datum' => heute(), 'zeit' => jetztMs(), 'antworten' => [],
    ];
    array_unshift($konto['tickets'], $ticket);
    speichereKunde($konto);
    schreibeLog($konto['email'], clientIp(), 'dashboard.html', 'Ticket eröffnet', $ticket['nr'] . ': ' . $betreff);
    antwortJson(200, ['ticket' => $ticket]);
});

/* --- Admin --- */

route('POST', '/api/admin/anmelden', null, function ($p, $body) {
    if (!ratenbegrenzung('anmelden', clientIp(), 20, 10 * 60000)) {
        fehler(429, 'Zu viele Versuche. Warte ein paar Minuten.');
    }
    if (!pruefePasswort((string)($body['passwort'] ?? ''), einstellung('admin_pw'))) {
        schreibeLog('Gast', clientIp(), 'admin', 'Admin-Anmeldung fehlgeschlagen', '');
        fehler(401, 'Falsches Passwort.');
    }
    setzeSitzungscookie(erstelleSitzung('admin', 'admin'), 'admin');
    schreibeLog('Admin', clientIp(), 'admin', 'Admin angemeldet', '');
    antwortJson(200, ['ok' => true]);
});

route('GET', '/api/admin/daten', 'admin', function () {
    antwortJson(200, [
        'kunden' => array_map('kontoFuerClient', alleKunden()),
        'mitarbeiter' => alleMitarbeiter(),
        'log' => ladeLog(),
        'botlogs' => ladeBotlog(),
        'adminPwGeaendert' => einstellung('admin_pw_geaendert') === '1',
    ]);
});

route('PUT', '/api/admin/kunden/:email', 'admin', function ($p, $body) {
    $konto = ladeKunde($p['email']);
    if (!$konto) {
        fehler(404, 'Konto nicht gefunden.');
    }
    $neu = is_array($body['konto'] ?? null) ? $body['konto'] : [];
    $konto['name'] = s($neu['name'] ?? '', 80) ?: $konto['name'];
    $konto['firma'] = s($neu['firma'] ?? '', 120);
    $konto['telefon'] = s($neu['telefon'] ?? '', 40);
    $konto['projekte'] = saeubereProjekte($neu['projekte'] ?? []);
    $konto['auftraege'] = saeubereAuftraege($neu['auftraege'] ?? []);
    $konto['tickets'] = saeubereTickets($neu['tickets'] ?? []);
    $konto['nachrichten'] = vereineNachrichten($konto['nachrichten'], saeubereNachrichten($neu['nachrichten'] ?? []));
    speichereKunde($konto);
    antwortJson(200, ['ok' => true]);
});

route('DELETE', '/api/admin/kunden/:email', 'admin', function ($p) {
    loescheKunde(mb_strtolower(s($p['email'], 200)));
    antwortJson(200, ['ok' => true]);
});

route('POST', '/api/admin/kunden/:email/projekte', 'admin', function ($p, $body) {
    $konto = ladeKunde($p['email']);
    if (!$konto) {
        fehler(404, 'Konto nicht gefunden.');
    }
    $titel = s($body['titel'] ?? '', 160);
    if (!$titel) {
        fehler(400, 'Gib dem Projekt einen Titel.');
    }
    $projekt = [
        'id' => 'P-' . naechsteNummer('projekt', 1000),
        'titel' => $titel, 'paket' => s($body['paket'] ?? '', 160),
        'schritt' => 0, 'vorschau' => '', 'erstellt' => heute(),
        'aktivitaet' => [['text' => 'Projekt angelegt', 'datum' => heute(), 'zeit' => jetztMs()]],
    ];
    $konto['projekte'][] = $projekt;
    speichereKunde($konto);
    antwortJson(200, ['projekt' => $projekt]);
});

route('POST', '/api/admin/mitarbeiter', 'admin', function ($p, $body) {
    global $db;
    $name = s($body['name'] ?? '', 80);
    $email = mb_strtolower(s($body['email'] ?? '', 200));
    $pw = (string)($body['passwort'] ?? '');
    if (!$name) {
        fehler(400, 'Gib einen Namen an.');
    }
    if (!preg_match(EMAIL_MUSTER, $email)) {
        fehler(400, 'Diese E-Mail-Adresse sieht nicht gültig aus.');
    }
    if (strlen($pw) < 8) {
        fehler(400, 'Das Passwort braucht mindestens 8 Zeichen.');
    }
    if (ladeMitarbeiterNachEmail($email)) {
        fehler(409, 'Für diese E-Mail gibt es schon ein Mitarbeiterkonto.');
    }
    $m = [
        'id' => 'M-' . naechsteNummer('mitarbeiter', 100),
        'name' => $name, 'rolle' => s($body['rolle'] ?? '', 80), 'email' => $email,
        'erstellt' => heute(), 'aktiv' => true, 'kunden' => [],
    ];
    $db->prepare('INSERT INTO mitarbeiter (id, email_idx, pw, aktiv, daten) VALUES (?, ?, ?, 1, ?)')
        ->execute([$m['id'], emailIndex($email), hashePasswort($pw), verschluessele([
            'name' => $m['name'], 'rolle' => $m['rolle'], 'email' => $email,
            'erstellt' => $m['erstellt'], 'kunden' => [],
        ])]);
    antwortJson(200, ['mitarbeiter' => $m]);
});

route('PUT', '/api/admin/mitarbeiter/:id', 'admin', function ($p, $body) {
    global $db;
    $m = ladeMitarbeiter($p['id']);
    if (!$m) {
        fehler(404, 'Mitarbeiter nicht gefunden.');
    }
    if (isset($body['name']) && is_string($body['name']) && s($body['name'], 80)) {
        $m['name'] = s($body['name'], 80);
    }
    if (isset($body['rolle']) && is_string($body['rolle'])) {
        $m['rolle'] = s($body['rolle'], 80);
    }
    if (isset($body['aktiv']) && is_bool($body['aktiv'])) {
        $m['aktiv'] = $body['aktiv'];
    }
    if (isset($body['kunden']) && is_array($body['kunden'])) {
        $m['kunden'] = array_map(fn($e) => mb_strtolower(s($e, 200)), array_slice($body['kunden'], 0, 500));
    }
    aktualisiereMitarbeiterDaten($m);
    if (!$m['aktiv']) {
        $db->prepare("DELETE FROM sitzungen WHERE typ = 'mitarbeiter' AND wer = ?")->execute([$m['id']]);
    }
    antwortJson(200, ['ok' => true]);
});

route('POST', '/api/admin/mitarbeiter/:id/passwort', 'admin', function ($p, $body) {
    global $db;
    $m = ladeMitarbeiter($p['id']);
    if (!$m) {
        fehler(404, 'Mitarbeiter nicht gefunden.');
    }
    $pw = (string)($body['passwort'] ?? '');
    if (strlen($pw) < 8) {
        fehler(400, 'Das Passwort braucht mindestens 8 Zeichen.');
    }
    $db->prepare('UPDATE mitarbeiter SET pw = ? WHERE id = ?')->execute([hashePasswort($pw), $m['id']]);
    $db->prepare("DELETE FROM sitzungen WHERE typ = 'mitarbeiter' AND wer = ?")->execute([$m['id']]);
    antwortJson(200, ['ok' => true]);
});

route('DELETE', '/api/admin/mitarbeiter/:id', 'admin', function ($p) {
    global $db;
    $db->prepare('DELETE FROM mitarbeiter WHERE id = ?')->execute([$p['id']]);
    $db->prepare("DELETE FROM sitzungen WHERE typ = 'mitarbeiter' AND wer = ?")->execute([$p['id']]);
    antwortJson(200, ['ok' => true]);
});

route('POST', '/api/admin/passwort', 'admin', function ($p, $body) {
    global $db, $DATEN_ORDNER;
    if (!pruefePasswort((string)($body['alt'] ?? ''), einstellung('admin_pw'))) {
        fehler(401, 'Das aktuelle Passwort stimmt nicht.');
    }
    $neu = (string)($body['neu'] ?? '');
    if (strlen($neu) < 8) {
        fehler(400, 'Das neue Passwort braucht mindestens 8 Zeichen.');
    }
    setzeEinstellung('admin_pw', hashePasswort($neu));
    setzeEinstellung('admin_pw_geaendert', '1');
    /* Andere Admin-Sitzungen beenden, die eigene bleibt gültig */
    $eigenes = tokenHash($_COOKIE[COOKIE_NAMEN['admin']] ?? '');
    $db->prepare("DELETE FROM sitzungen WHERE typ = 'admin' AND token_hash != ?")->execute([$eigenes]);
    @unlink($DATEN_ORDNER . '/admin-startpasswort.txt');
    schreibeLog('Admin', clientIp(), 'admin', 'Admin-Passwort geändert', '');
    antwortJson(200, ['ok' => true]);
});

route('DELETE', '/api/admin/log', 'admin', function () {
    global $db;
    $db->exec('DELETE FROM log');
    schreibeLog('Admin', clientIp(), 'admin', 'Protokoll geleert', '');
    antwortJson(200, ['ok' => true]);
});

/* --- Mitarbeiter-Portal --- */

route('POST', '/api/mcs/anmelden', null, function ($p, $body) {
    global $db;
    if (!ratenbegrenzung('anmelden', clientIp(), 20, 10 * 60000)) {
        fehler(429, 'Zu viele Versuche. Warte ein paar Minuten.');
    }
    $email = mb_strtolower(s($body['email'] ?? '', 200));
    $s = $db->prepare('SELECT id, pw, aktiv FROM mitarbeiter WHERE email_idx = ?');
    $s->execute([emailIndex($email)]);
    $zeile = $s->fetch();
    if (!$zeile) {
        password_verify((string)($body['passwort'] ?? ''), '$2y$10$usesomesillystringforsaltingthepasswordxxxxxxxxxxxxxxxxxxx');
        fehler(401, FALSCHE_ANMELDUNG);
    }
    if (!pruefePasswort((string)($body['passwort'] ?? ''), $zeile['pw'])) {
        schreibeLog($email, clientIp(), 'mcs', 'Anmeldung fehlgeschlagen', '');
        fehler(401, FALSCHE_ANMELDUNG);
    }
    if ((int)$zeile['aktiv'] !== 1) {
        fehler(403, 'Dieses Konto ist deaktiviert. Melde dich bei der Verwaltung.');
    }
    setzeSitzungscookie(erstelleSitzung('mitarbeiter', $zeile['id']), 'mitarbeiter');
    $m = ladeMitarbeiter($zeile['id']);
    schreibeLog('MA ' . $m['name'], clientIp(), 'mcs', 'Mitarbeiter angemeldet', $email);
    antwortJson(200, ['ok' => true]);
});

route('GET', '/api/mcs/daten', 'mitarbeiter', function ($p, $body, $sitzung) {
    $m = ladeMitarbeiter($sitzung['wer']);
    if (!$m || !$m['aktiv']) {
        loescheSitzungscookie(['mitarbeiter']);
        fehler(401, 'Nicht angemeldet.');
    }
    $zugewiesene = array_values(array_filter(alleKunden(), fn($k) => in_array($k['email'], $m['kunden'], true)));
    antwortJson(200, ['ma' => $m, 'kunden' => array_map('kontoFuerClient', $zugewiesene)]);
});

route('PUT', '/api/mcs/kunden/:email', 'mitarbeiter', function ($p, $body, $sitzung) {
    $m = ladeMitarbeiter($sitzung['wer']);
    if (!$m || !$m['aktiv']) {
        fehler(401, 'Nicht angemeldet.');
    }
    $email = mb_strtolower(s($p['email'], 200));
    if (!in_array($email, $m['kunden'], true)) {
        fehler(403, 'Dieser Kunde ist dir nicht zugewiesen.');
    }
    $konto = ladeKunde($email);
    if (!$konto) {
        fehler(404, 'Konto nicht gefunden.');
    }
    $neu = is_array($body['konto'] ?? null) ? $body['konto'] : [];
    /* Mitarbeiter pflegen Projekte, Tickets und Nachrichten */
    $konto['projekte'] = saeubereProjekte($neu['projekte'] ?? []);
    $konto['tickets'] = saeubereTickets($neu['tickets'] ?? []);
    $konto['nachrichten'] = vereineNachrichten($konto['nachrichten'], saeubereNachrichten($neu['nachrichten'] ?? []));
    speichereKunde($konto);
    antwortJson(200, ['ok' => true]);
});

/* --- Protokoll und KI-Chats --- */

/* --- Website-Inhalte: öffentlich lesen, als Admin pflegen --- */

route('GET', '/api/inhalte', null, function () {
    antwortJson(200, ladeInhalte());
});

route('PUT', '/api/admin/inhalte', 'admin', function ($p, $body) {
    /* Schutz vor kaputten Anfragen: fehlt der Rumpf (z. B. ungültiges JSON),
       niemals stillschweigend leere Listen speichern. */
    if (!is_array($body['beispiele'] ?? null) || !is_array($body['projekte'] ?? null)) {
        fehler(400, 'Ungültige Daten: beispiele und projekte müssen Listen sein.');
    }
    $inhalte = [
        'beispiele' => saeubereBeispiele($body['beispiele']),
        'projekte' => saeubereReferenzProjekte($body['projekte']),
    ];
    setzeEinstellung('inhalte_beispiele', json_encode($inhalte['beispiele'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    setzeEinstellung('inhalte_projekte', json_encode($inhalte['projekte'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    schreibeLog('Admin', clientIp(), 'admin', 'Website-Inhalte gespeichert',
        count($inhalte['beispiele']) . ' Beispiele, ' . count($inhalte['projekte']) . ' Projekte');
    antwortJson(200, $inhalte);
});

route('POST', '/api/log', null, function ($p, $body, $sitzung) {
    if (!ratenbegrenzung('log', clientIp(), 120, 60000)) {
        antwortJson(200, ['ok' => true]);
    }
    schreibeLog(logLabel($sitzung), clientIp(), s($body['seite'] ?? '', 60), s($body['aktion'] ?? '', 60), s($body['detail'] ?? '', 180));
    antwortJson(200, ['ok' => true]);
});

route('POST', '/api/bot-log', null, function ($p, $body, $sitzung) {
    if (!ratenbegrenzung('botlog', clientIp(), 30, 60000)) {
        antwortJson(200, ['ok' => true]);
    }
    $von = ($body['von'] ?? '') === 'bot' ? 'bot' : 'besucher';
    $text = s($body['text'] ?? '', 400);
    if (!$text) {
        fehler(400, 'Leer.');
    }
    schreibeBotlog(logLabel($sitzung), s($body['seite'] ?? '', 60), $von, $text);
    antwortJson(200, ['ok' => true]);
});

/* ---------- Anfrage verteilen ---------- */

/* Start-Routinen mit DB-Schreibzugriff: Fehler als lesbare Meldung ausgeben,
   nicht als leeren 500. */
try {
    stelleAdminPasswortSicher($DATEN_ORDNER);
    stelleInhalteSicher();
    raeumeSitzungenAuf();
} catch (Throwable $e) {
    error_log('masesites Start: ' . $e->getMessage());
    fehlerAbbruch('Start fehlgeschlagen: ' . $e->getMessage() . ' Test: /api/status?deep=1');
}

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pfad = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/');

/* CSRF-Schutz: schreibende Aufrufe brauchen den eigenen Header, und wenn ein
   Origin mitkommt, muss er zur eigenen Website gehören. */
if ($methode !== 'GET' && $methode !== 'HEAD') {
    if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'fetch') {
        fehler(403, 'Ungültige Anfrage.');
    }
    if (!empty($_SERVER['HTTP_ORIGIN'])) {
        $originHost = parse_url((string)$_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
        $eigenerHost = $_SERVER['HTTP_HOST'] ?? '';
        /* Host der eigenen Seite kann Port enthalten – nur Hostnamen vergleichen */
        $eigenerHostName = explode(':', $eigenerHost)[0];
        if ($originHost !== null && $originHost !== $eigenerHostName) {
            fehler(403, 'Ungültige Herkunft.');
        }
    }
}

$body = ($methode === 'GET' || $methode === 'HEAD') ? [] : leseKoerper();

foreach ($ROUTEN as $r) {
    if ($r['methode'] !== $methode) {
        continue;
    }
    if (!preg_match($r['regex'], $pfad, $treffer)) {
        continue;
    }
    $params = [];
    foreach ($r['namen'] as $i => $name) {
        $params[$name] = $treffer[$i + 1];
    }
    $sitzung = $r['schutz'] ? findeSitzung($r['schutz']) : irgendeineSitzung();
    if ($r['schutz'] && !$sitzung) {
        fehler(401, 'Nicht angemeldet.');
    }
    try {
        $r['handler']($params, $body, $sitzung);
    } catch (Throwable $e) {
        error_log('masesites API-Fehler: ' . $e->getMessage());
        fehler(500, 'Interner Fehler.');
    }
    exit;
}

fehler(404, 'Unbekannter API-Pfad.');
