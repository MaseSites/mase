/* masesites Server: liefert die statische Website aus und stellt die API für
   Kundenkonten, Mitarbeiter, Admin, Protokoll und KI-Chats bereit.

   Sicherheit:
   - Passwörter werden nie gespeichert, nur scrypt-Hashes mit eigenem Salt.
   - Alle personenbezogenen Daten (Konten, Mitarbeiter, Protokoll, Bot-Chats)
     liegen AES-256-GCM-verschlüsselt in der SQLite-Datenbank. Auch E-Mails
     stehen nicht im Klartext in der DB; gesucht wird über einen HMAC-Index.
   - Sitzungen laufen über HttpOnly-Cookies; in der DB liegt nur der
     SHA-256-Hash des Tokens.
   - Login-Endpunkte sind pro IP ratenbegrenzt, schreibende API-Aufrufe
     verlangen einen eigenen Header (CSRF-Schutz).

   Es werden keine npm-Pakete gebraucht (Node 22.5 oder neuer).
   Start: node server/server.js  (Port über MS_PORT, Standard 8080)

   Der Schlüssel liegt in server/daten/geheim.key (wird beim ersten Start
   erzeugt) oder kommt aus der Umgebungsvariable MS_SCHLUESSEL (64 Hex-Zeichen).
   WICHTIG: Schlüssel sichern! Ohne ihn sind die Daten nicht mehr lesbar. */

"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { DatabaseSync } = require("node:sqlite");

const scrypt = promisify(crypto.scrypt);

/* ---------- Konfiguration ---------- */

/* Port: eigene Variable MS_PORT, sonst PORT (setzt z. B. Plesk/Passenger —
   kann auch ein Socket-Pfad statt einer Zahl sein), sonst 8080 */
const PORT_ROH = process.env.MS_PORT || process.env.PORT || "8080";
const PORT = /^\d+$/.test(String(PORT_ROH)) ? parseInt(PORT_ROH, 10) : PORT_ROH;
const WURZEL = path.join(__dirname, "..");            /* Website-Dateien */
/* DB + Schlüssel. Auf Plesk & Co. am besten per MS_DATEN auf einen Ordner
   AUSSERHALB des Web-Roots legen, damit die Dateien nie abrufbar sind. */
const DATEN_ORDNER = process.env.MS_DATEN
  ? path.resolve(process.env.MS_DATEN)
  : path.join(__dirname, "daten");
const HINTER_PROXY = process.env.MS_HINTER_PROXY === "1"; /* X-Forwarded-* vertrauen */

/* Muss zur Client-ID in assets/js/konto.js passen (Google-Anmeldung) */
const GOOGLE_CLIENT_ID = process.env.MS_GOOGLE_CLIENT_ID
  || "117777636536-nd77bnlv9co4l7g8cbn6de0q8uhj3njt.apps.googleusercontent.com";

/* Sitzungsdauer in Millisekunden (gleitend: wird bei Nutzung verlängert) */
const SITZUNG_DAUER = {
  kunde: 30 * 24 * 3600 * 1000,   /* 30 Tage  */
  mitarbeiter: 12 * 3600 * 1000,  /* 12 Stunden */
  admin: 12 * 3600 * 1000
};

const LOG_LIMIT = 5000;      /* Protokoll: nur die neusten Einträge behalten */
const BOTLOG_LIMIT = 2000;
const KOERPER_LIMIT = 256 * 1024; /* max. Grösse eines JSON-Bodys */

const SCHRITTE_ANZAHL = 5;   /* Besprechung, Design, Entwicklung, Feedback, Online */

/* ---------- Schlüssel und Verschlüsselung ---------- */

fs.mkdirSync(DATEN_ORDNER, { recursive: true });

function ladeHauptschluessel() {
  const ausUmgebung = process.env.MS_SCHLUESSEL;
  if (ausUmgebung) {
    const buf = Buffer.from(ausUmgebung.trim(), "hex");
    if (buf.length !== 32) {
      console.error("MS_SCHLUESSEL muss 64 Hex-Zeichen sein (32 Bytes).");
      process.exit(1);
    }
    return buf;
  }
  const datei = path.join(DATEN_ORDNER, "geheim.key");
  if (fs.existsSync(datei)) {
    const buf = Buffer.from(fs.readFileSync(datei, "utf8").trim(), "hex");
    if (buf.length !== 32) {
      console.error("geheim.key ist beschädigt (erwartet 64 Hex-Zeichen).");
      process.exit(1);
    }
    return buf;
  }
  const neu = crypto.randomBytes(32);
  fs.writeFileSync(datei, neu.toString("hex") + "\n", { mode: 0o600 });
  console.log("Neuer Verschlüsselungs-Schlüssel erzeugt: server/daten/geheim.key");
  console.log("WICHTIG: Diese Datei sichern. Ohne sie sind die Daten verloren.");
  return neu;
}

const HAUPTSCHLUESSEL = ladeHauptschluessel();
/* Aus dem Hauptschlüssel getrennte Schlüssel ableiten:
   einer für die Verschlüsselung, einer für den E-Mail-Suchindex */
const K_VERSCHLUESSELUNG = Buffer.from(
  crypto.hkdfSync("sha256", HAUPTSCHLUESSEL, Buffer.alloc(0), "ms-verschluesselung", 32));
const K_INDEX = Buffer.from(
  crypto.hkdfSync("sha256", HAUPTSCHLUESSEL, Buffer.alloc(0), "ms-suchindex", 32));

function verschluessele(objekt) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", K_VERSCHLUESSELUNG, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(objekt), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}
function entschluessele(text) {
  const b = Buffer.from(text, "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", K_VERSCHLUESSELUNG, b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"));
}
/* Deterministischer Index, damit wir Konten per E-Mail finden können,
   ohne die E-Mail im Klartext zu speichern */
function emailIndex(email) {
  return crypto.createHmac("sha256", K_INDEX)
    .update(String(email).trim().toLowerCase()).digest("hex");
}

/* ---------- Passwort-Hash (scrypt mit Salt) ---------- */

const SCRYPT = { N: 16384, r: 8, p: 1 };

async function hashePasswort(pw) {
  const salz = crypto.randomBytes(16);
  const h = await scrypt(String(pw), salz, 32, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p,
    salz.toString("base64"), h.toString("base64")].join("$");
}
async function pruefePasswort(pw, gespeichert) {
  try {
    const t = String(gespeichert || "").split("$");
    if (t[0] !== "scrypt" || t.length !== 6) return false;
    const salz = Buffer.from(t[4], "base64");
    const soll = Buffer.from(t[5], "base64");
    const ist = await scrypt(String(pw), salz, soll.length,
      { N: +t[1], r: +t[2], p: +t[3] });
    return crypto.timingSafeEqual(ist, soll);
  } catch (e) { return false; }
}

/* ---------- Datenbank ---------- */

const db = new DatabaseSync(path.join(DATEN_ORDNER, "masesites.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS kunden (
    email_idx TEXT PRIMARY KEY,   -- HMAC der E-Mail (Suchindex)
    pw        TEXT,               -- scrypt-Hash oder NULL (Google/Demo)
    provider  TEXT NOT NULL,
    daten     TEXT NOT NULL       -- verschlüsseltes JSON (inkl. E-Mail)
  );
  CREATE TABLE IF NOT EXISTS mitarbeiter (
    id        TEXT PRIMARY KEY,
    email_idx TEXT UNIQUE NOT NULL,
    pw        TEXT NOT NULL,
    aktiv     INTEGER NOT NULL DEFAULT 1,
    daten     TEXT NOT NULL       -- verschlüsseltes JSON
  );
  CREATE TABLE IF NOT EXISTS sitzungen (
    token_hash TEXT PRIMARY KEY,  -- SHA-256 des Cookie-Tokens
    typ        TEXT NOT NULL,     -- kunde | mitarbeiter | admin
    wer        TEXT NOT NULL,     -- email_idx bzw. Mitarbeiter-ID bzw. 'admin'
    ablauf     INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS einstellungen (
    schluessel TEXT PRIMARY KEY,
    wert       TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS log (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    zeit  INTEGER NOT NULL,
    daten TEXT NOT NULL           -- verschlüsselt: konto, ip, seite, aktion, detail
  );
  CREATE TABLE IF NOT EXISTS botlog (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    zeit  INTEGER NOT NULL,
    daten TEXT NOT NULL           -- verschlüsselt: konto, seite, von, text
  );
`);

function einstellung(schluessel) {
  const zeile = db.prepare("SELECT wert FROM einstellungen WHERE schluessel = ?").get(schluessel);
  return zeile ? zeile.wert : null;
}
function setzeEinstellung(schluessel, wert) {
  db.prepare(`INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
              ON CONFLICT(schluessel) DO UPDATE SET wert = excluded.wert`).run(schluessel, wert);
}

/* Laufende Nummern für Tickets, Projekte, Mitarbeiter — zentral, damit
   nie eine doppelt vergeben wird */
function naechsteNummer(name, start) {
  const n = Math.max(parseInt(einstellung("zaehler_" + name) || "0", 10) || 0, start) + 1;
  setzeEinstellung("zaehler_" + name, String(n));
  return n;
}

/* ---------- Datum (Format wie im Frontend: TT.MM.JJJJ) ---------- */

function z2(n) { return ("0" + n).slice(-2); }
function heute() {
  const d = new Date();
  return z2(d.getDate()) + "." + z2(d.getMonth() + 1) + "." + d.getFullYear();
}

/* ---------- Kunden lesen/schreiben ---------- */

function normalisiereKonto(k) {
  k.name = typeof k.name === "string" ? k.name : "";
  k.firma = typeof k.firma === "string" ? k.firma : "";
  k.telefon = typeof k.telefon === "string" ? k.telefon : "";
  k.projekte = Array.isArray(k.projekte) ? k.projekte : [];
  k.auftraege = Array.isArray(k.auftraege) ? k.auftraege : [];
  k.tickets = Array.isArray(k.tickets) ? k.tickets : [];
  k.nachrichten = Array.isArray(k.nachrichten) ? k.nachrichten : [];
  return k;
}

function ladeKunde(email) {
  const zeile = db.prepare("SELECT daten FROM kunden WHERE email_idx = ?").get(emailIndex(email));
  return zeile ? normalisiereKonto(entschluessele(zeile.daten)) : null;
}
function ladeKundeNachIndex(idx) {
  const zeile = db.prepare("SELECT daten FROM kunden WHERE email_idx = ?").get(idx);
  return zeile ? normalisiereKonto(entschluessele(zeile.daten)) : null;
}
function alleKunden() {
  return db.prepare("SELECT daten FROM kunden").all()
    .map((zeile) => normalisiereKonto(entschluessele(zeile.daten)));
}
function speichereKunde(konto, pwHash, provider) {
  const idx = emailIndex(konto.email);
  const vorhanden = db.prepare("SELECT email_idx FROM kunden WHERE email_idx = ?").get(idx);
  if (vorhanden) {
    db.prepare("UPDATE kunden SET daten = ? WHERE email_idx = ?").run(verschluessele(konto), idx);
  } else {
    db.prepare("INSERT INTO kunden (email_idx, pw, provider, daten) VALUES (?, ?, ?, ?)")
      .run(idx, pwHash || null, provider || "email", verschluessele(konto));
  }
}
function loescheKunde(email) {
  const idx = emailIndex(email);
  db.prepare("DELETE FROM kunden WHERE email_idx = ?").run(idx);
  db.prepare("DELETE FROM sitzungen WHERE typ = 'kunde' AND wer = ?").run(idx);
  /* Zuweisungen bei Mitarbeitern aufräumen */
  for (const m of alleMitarbeiter()) {
    if (m.kunden.includes(email)) {
      m.kunden = m.kunden.filter((e) => e !== email);
      aktualisiereMitarbeiterDaten(m);
    }
  }
}

/* ---------- Mitarbeiter lesen/schreiben ---------- */

function mitarbeiterAusZeile(zeile) {
  const m = entschluessele(zeile.daten);
  m.id = zeile.id;
  m.aktiv = zeile.aktiv === 1;
  m.kunden = Array.isArray(m.kunden) ? m.kunden : [];
  return m;
}
function alleMitarbeiter() {
  return db.prepare("SELECT id, aktiv, daten FROM mitarbeiter").all().map(mitarbeiterAusZeile);
}
function ladeMitarbeiter(id) {
  const zeile = db.prepare("SELECT id, aktiv, daten FROM mitarbeiter WHERE id = ?").get(id);
  return zeile ? mitarbeiterAusZeile(zeile) : null;
}
function ladeMitarbeiterNachEmail(email) {
  const zeile = db.prepare("SELECT id, aktiv, daten FROM mitarbeiter WHERE email_idx = ?")
    .get(emailIndex(email));
  return zeile ? mitarbeiterAusZeile(zeile) : null;
}
function aktualisiereMitarbeiterDaten(m) {
  db.prepare("UPDATE mitarbeiter SET aktiv = ?, daten = ? WHERE id = ?")
    .run(m.aktiv ? 1 : 0, verschluessele({
      name: m.name, rolle: m.rolle, email: m.email,
      erstellt: m.erstellt, kunden: m.kunden
    }), m.id);
}

/* ---------- Protokoll und Bot-Chats ---------- */

function schreibeLog(konto, ip, seite, aktion, detail) {
  db.prepare("INSERT INTO log (zeit, daten) VALUES (?, ?)").run(
    Date.now(),
    verschluessele({
      konto: kuerze(konto, 120), ip: kuerze(ip, 60), seite: kuerze(seite, 60),
      aktion: kuerze(aktion, 60), detail: kuerze(detail, 180)
    }));
  db.prepare(`DELETE FROM log WHERE id NOT IN
              (SELECT id FROM log ORDER BY id DESC LIMIT ?)`).run(LOG_LIMIT);
}
function ladeLog() {
  return db.prepare("SELECT zeit, daten FROM log ORDER BY id").all().map((zeile) => {
    const e = entschluessele(zeile.daten);
    e.zeit = zeile.zeit;
    return e;
  });
}
function schreibeBotlog(konto, seite, von, text) {
  db.prepare("INSERT INTO botlog (zeit, daten) VALUES (?, ?)").run(
    Date.now(),
    verschluessele({ konto: kuerze(konto, 120), seite: kuerze(seite, 60), von: kuerze(von, 20), text: kuerze(text, 400) }));
  db.prepare(`DELETE FROM botlog WHERE id NOT IN
              (SELECT id FROM botlog ORDER BY id DESC LIMIT ?)`).run(BOTLOG_LIMIT);
}
function ladeBotlog() {
  return db.prepare("SELECT zeit, daten FROM botlog ORDER BY id").all().map((zeile) => {
    const e = entschluessele(zeile.daten);
    e.zeit = zeile.zeit;
    return e;
  });
}

/* ---------- Admin-Startpasswort ---------- */

async function stelleAdminPasswortSicher() {
  if (einstellung("admin_pw")) return;
  const zeichen = "abcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 14; i++) {
    if (i === 4 || i === 9) pw += "-";
    else pw += zeichen[crypto.randomInt(zeichen.length)];
  }
  setzeEinstellung("admin_pw", await hashePasswort(pw));
  setzeEinstellung("admin_pw_geaendert", "0");
  const datei = path.join(DATEN_ORDNER, "admin-startpasswort.txt");
  fs.writeFileSync(datei,
    "masesites Admin-Startpasswort: " + pw + "\n" +
    "Nach dem ersten Login unter /admin -> Einstellungen ändern.\n" +
    "Diese Datei wird beim Ändern automatisch gelöscht.\n", { mode: 0o600 });
  console.log("Admin-Startpasswort: " + pw);
  console.log("(auch gespeichert in server/daten/admin-startpasswort.txt)");
}

/* ---------- Sitzungen ---------- */

/* Jede Rolle hat ihr eigenes Cookie, damit z. B. Admin-Bereich und
   Kundensicht im selben Browser nebeneinander angemeldet sein können */
const COOKIE_NAMEN = {
  kunde: "ms_sitzung",
  mitarbeiter: "ms_sitzung_ma",
  admin: "ms_sitzung_admin"
};

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function erstelleSitzung(typ, wer) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sitzungen (token_hash, typ, wer, ablauf) VALUES (?, ?, ?, ?)")
    .run(tokenHash(token), typ, wer, Date.now() + SITZUNG_DAUER[typ]);
  return token;
}
function findeSitzung(req, typ) {
  const token = lesecookie(req, COOKIE_NAMEN[typ]);
  if (!token) return null;
  const zeile = db.prepare("SELECT token_hash, typ, wer, ablauf FROM sitzungen WHERE token_hash = ?")
    .get(tokenHash(token));
  if (!zeile || zeile.typ !== typ) return null;
  if (zeile.ablauf < Date.now()) {
    db.prepare("DELETE FROM sitzungen WHERE token_hash = ?").run(zeile.token_hash);
    return null;
  }
  /* Gleitende Verlängerung, sobald die halbe Laufzeit vorbei ist */
  const dauer = SITZUNG_DAUER[zeile.typ];
  if (zeile.ablauf - Date.now() < dauer / 2) {
    db.prepare("UPDATE sitzungen SET ablauf = ? WHERE token_hash = ?")
      .run(Date.now() + dauer, zeile.token_hash);
  }
  return zeile;
}
/* Für Protokoll-Einträge: wer auch immer gerade angemeldet ist */
function irgendeineSitzung(req) {
  return findeSitzung(req, "admin") || findeSitzung(req, "mitarbeiter") || findeSitzung(req, "kunde");
}
function loescheSitzung(req, typ) {
  const token = lesecookie(req, COOKIE_NAMEN[typ]);
  if (token) db.prepare("DELETE FROM sitzungen WHERE token_hash = ?").run(tokenHash(token));
}
let letzteAufraeumzeit = 0;
function raeumeSitzungenAuf() {
  if (Date.now() - letzteAufraeumzeit < 5 * 60000) return;
  letzteAufraeumzeit = Date.now();
  db.prepare("DELETE FROM sitzungen WHERE ablauf < ?").run(Date.now());
}

function setzeSitzungscookie(res, req, token, typ) {
  /* Kunden bleiben angemeldet (Max-Age), Admin/Mitarbeiter nur bis zum
     Schliessen des Browsers (Session-Cookie) — wie vorher mit sessionStorage */
  let cookie = COOKIE_NAMEN[typ] + "=" + token + "; Path=/; HttpOnly; SameSite=Lax";
  if (typ === "kunde") cookie += "; Max-Age=" + Math.floor(SITZUNG_DAUER.kunde / 1000);
  if (istHttps(req)) cookie += "; Secure";
  res.setHeader("Set-Cookie", cookie);
}
function loescheSitzungscookie(res, typen) {
  res.setHeader("Set-Cookie", typen.map((typ) =>
    COOKIE_NAMEN[typ] + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"));
}

/* ---------- Kleine HTTP-Helfer ---------- */

function lesecookie(req, name) {
  const kopf = req.headers.cookie || "";
  for (const teil of kopf.split(";")) {
    const p = teil.indexOf("=");
    if (p !== -1 && teil.slice(0, p).trim() === name) return teil.slice(p + 1).trim();
  }
  return null;
}
function istHttps(req) {
  if (HINTER_PROXY && req.headers["x-forwarded-proto"] === "https") return true;
  return !!(req.socket && req.socket.encrypted);
}
function clientIp(req) {
  if (HINTER_PROXY && req.headers["x-forwarded-for"]) {
    return String(req.headers["x-forwarded-for"]).split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unbekannt";
}
function kuerze(text, laenge) {
  return String(text == null ? "" : text).slice(0, laenge);
}
function antwortJson(res, code, objekt) {
  const body = JSON.stringify(objekt);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}
function fehler(res, code, text) {
  antwortJson(res, code, { fehler: text });
}
function leseKoerper(req) {
  return new Promise((resolve, reject) => {
    let groesse = 0;
    const teile = [];
    req.on("data", (teil) => {
      groesse += teil.length;
      if (groesse > KOERPER_LIMIT) {
        reject(new Error("zu gross"));
        req.destroy();
        return;
      }
      teile.push(teil);
    });
    req.on("end", () => {
      if (!teile.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(teile).toString("utf8"))); }
      catch (e) { reject(new Error("kein JSON")); }
    });
    req.on("error", reject);
  });
}

/* ---------- Ratenbegrenzung (pro IP, im Speicher) ---------- */

const raten = new Map();
function ratenbegrenzung(topf, ip, max, fensterMs) {
  if (raten.size > 5000) {
    for (const [k, v] of raten) if (v.bis < Date.now()) raten.delete(k);
  }
  const schluessel = topf + ":" + ip;
  const eintrag = raten.get(schluessel);
  if (!eintrag || eintrag.bis < Date.now()) {
    raten.set(schluessel, { n: 1, bis: Date.now() + fensterMs });
    return true;
  }
  eintrag.n += 1;
  return eintrag.n <= max;
}

/* ---------- Eingaben säubern ---------- */

function s(wert, max) { return kuerze(typeof wert === "string" ? wert : "", max).trim(); }
function nr(wert) { const n = Number(wert); return Number.isFinite(n) ? n : 0; }

function saeubereAntworten(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 300).map((a) => ({
    von: s(a && a.von, 20) || "ich",
    text: s(a && a.text, 4000),
    datum: s(a && a.datum, 10),
    zeit: nr(a && a.zeit)
  }));
}
function saeubereTickets(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 300).map((t) => ({
    nr: s(t && t.nr, 16),
    betreff: s(t && t.betreff, 160),
    text: s(t && t.text, 4000),
    prio: s(t && t.prio, 20) || "Normal",
    status: ["Offen", "Beantwortet", "Geschlossen"].includes(t && t.status) ? t.status : "Offen",
    datum: s(t && t.datum, 10),
    zeit: nr(t && t.zeit),
    antworten: saeubereAntworten(t && t.antworten)
  }));
}
function saeubereNachrichten(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 1500).map((n) => ({
    von: s(n && n.von, 20) || "ich",
    text: s(n && n.text, 4000),
    datum: s(n && n.datum, 10),
    zeit: nr(n && n.zeit),
    gelesen: !!(n && n.gelesen)
  }));
}
function saeubereProjekte(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 100).map((p) => ({
    id: s(p && p.id, 16),
    titel: s(p && p.titel, 160),
    paket: s(p && p.paket, 160),
    schritt: Math.max(0, Math.min(SCHRITTE_ANZAHL - 1, Math.round(nr(p && p.schritt)))),
    vorschau: s(p && p.vorschau, 400),
    erstellt: s(p && p.erstellt, 10),
    aktivitaet: (Array.isArray(p && p.aktivitaet) ? p.aktivitaet : []).slice(0, 500).map((a) => ({
      text: s(a && a.text, 500), datum: s(a && a.datum, 10), zeit: nr(a && a.zeit)
    })),
    todos: saeubereTodos(p && p.todos)
  }));
}
/* Wunschliste (ToDos) eines Projekts – die pflegt der Kunde selbst. */
function saeubereTodos(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 200).map((t) => ({
    text: s(t && t.text, 400),
    erledigt: !!(t && t.erledigt),
    zeit: nr(t && t.zeit)
  }));
}
function saeubereAuftraege(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 200).map((a) => ({
    titel: s(a && a.titel, 160),
    betrag: s(a && a.betrag, 60),
    status: ["Offen", "In Arbeit", "Abgeschlossen"].includes(a && a.status) ? a.status : "Offen",
    datum: s(a && a.datum, 10)
  }));
}

/* Nachrichten/Antworten zusammenführen statt überschreiben, damit sich
   Kunde und Team nicht gegenseitig neue Einträge wegspeichern.
   "gelesen" bleibt wahr, sobald es einmal wahr war. */
function vereineNachrichten(alt, neu) {
  const karte = new Map();
  const reihenfolge = [];
  function schluessel(n) { return (n.zeit || 0) + "|" + (n.von || "") + "|" + (n.text || ""); }
  for (const n of [...(alt || []), ...(neu || [])]) {
    const k = schluessel(n);
    const vorhanden = karte.get(k);
    if (vorhanden) vorhanden.gelesen = vorhanden.gelesen || !!n.gelesen;
    else { karte.set(k, Object.assign({}, n)); reihenfolge.push(k); }
  }
  return reihenfolge.map((k) => karte.get(k))
    .sort((a, b) => (a.zeit || 0) - (b.zeit || 0));
}
function vereineTickets(alt, neu) {
  const ergebnis = [];
  const gesehen = new Set();
  for (const t of neu || []) {
    const altes = (alt || []).find((x) => x.nr === t.nr);
    if (altes) t.antworten = vereineNachrichten(altes.antworten, t.antworten);
    gesehen.add(t.nr);
    ergebnis.push(t);
  }
  for (const t of alt || []) if (!gesehen.has(t.nr)) ergebnis.push(t);
  return ergebnis;
}

/* ---------- Log-Beschriftung aus der Sitzung ---------- */

function logLabel(sitzung) {
  if (!sitzung) return "Gast";
  if (sitzung.typ === "admin") return "Admin";
  if (sitzung.typ === "kunde") {
    const k = ladeKundeNachIndex(sitzung.wer);
    return k ? k.email : "Kunde";
  }
  if (sitzung.typ === "mitarbeiter") {
    const m = ladeMitarbeiter(sitzung.wer);
    return m ? "MA " + m.name : "Mitarbeiter";
  }
  return "Gast";
}

/* ---------- Demo-Konto ---------- */

function demoKonto() {
  function ts(tag, monat, stunde, minute) {
    return new Date(2026, monat - 1, tag, stunde, minute).getTime();
  }
  return {
    name: "Deniz Yilmaz", firma: "Kebab Palace", telefon: "+41 79 123 45 67",
    email: "demo@masesites.ch", provider: "demo", erstellt: "20.06.2026",
    projekte: [
      {
        id: "P-1001", titel: "Website Kebab Palace", paket: "Neue Website: Business",
        schritt: 2, vorschau: "https://masesites.ch/demo/doener-site/index.html",
        erstellt: "28.06.2026",
        aktivitaet: [
          { text: "Galerie-Bereich eingebaut, Bilder folgen", datum: "05.07.2026", zeit: ts(5, 7, 9, 40) },
          { text: "Farben nach deinem Feedback angepasst", datum: "03.07.2026", zeit: ts(3, 7, 15, 10) },
          { text: "Design-Entwurf in die Vorschau gestellt", datum: "01.07.2026", zeit: ts(1, 7, 14, 0) },
          { text: "Konzept-Besprechung abgeschlossen, Projekt gestartet", datum: "28.06.2026", zeit: ts(28, 6, 11, 30) }
        ]
      },
      {
        id: "P-1002", titel: "KI-Bot für die Website", paket: "KI-Bot: Einrichtung und Training",
        schritt: 1, vorschau: "", erstellt: "02.07.2026",
        aktivitaet: [
          { text: "Fragen und Antworten für das Training gesammelt", datum: "04.07.2026", zeit: ts(4, 7, 16, 20) },
          { text: "Auftrag bestätigt, Einrichtung geplant", datum: "02.07.2026", zeit: ts(2, 7, 10, 5) }
        ]
      }
    ],
    nachrichten: [
      { von: "masesites", text: "Hallo Deniz! Der erste Design-Entwurf ist online. Schau ihn dir unter Projekte in der Vorschau an und sag uns, was du denkst.", datum: "01.07.2026", zeit: ts(1, 7, 14, 20), gelesen: true },
      { von: "ich", text: "Sieht stark aus! Könnt ihr das Rot etwas dunkler machen?", datum: "02.07.2026", zeit: ts(2, 7, 9, 41), gelesen: true },
      { von: "masesites", text: "Erledigt, das Rot ist jetzt dunkler. Als Nächstes bauen wir die Galerie ein.", datum: "03.07.2026", zeit: ts(3, 7, 11, 5), gelesen: true },
      { von: "masesites", text: "Die Galerie ist eingebaut. Sobald du die finalen Bilder hast, schick sie uns per Ticket oder Mail.", datum: "05.07.2026", zeit: ts(5, 7, 10, 12), gelesen: false }
    ],
    auftraege: [
      { titel: "Neue Website: Business", betrag: "ab CHF 1'300.–", status: "In Arbeit", datum: "28.06.2026" },
      { titel: "KI-Bot: Einrichtung", betrag: "CHF 200.–", status: "In Arbeit", datum: "02.07.2026" },
      { titel: "Online-Terminbuchung", betrag: "ab CHF 400.–", status: "Offen", datum: "02.07.2026" },
      { titel: "Logo-Feinschliff", betrag: "CHF 150.–", status: "Abgeschlossen", datum: "21.06.2026" }
    ],
    tickets: [
      {
        nr: "T-1025", betreff: "Neues Foto für die Galerie",
        text: "Ich habe ein neues Bild vom Lokal, wohin darf ich es schicken?",
        prio: "Normal", status: "Offen", datum: "04.07.2026", zeit: ts(4, 7, 18, 2), antworten: []
      },
      {
        nr: "T-1024", betreff: "Öffnungszeiten ändern",
        text: "Bitte neu Montag bis Samstag, 10 bis 22 Uhr.",
        prio: "Normal", status: "Beantwortet", datum: "01.07.2026", zeit: ts(1, 7, 9, 15),
        antworten: [
          { von: "masesites", text: "Erledigt, die neuen Öffnungszeiten sind online. Schau kurz drüber, ob alles stimmt.", datum: "02.07.2026", zeit: ts(2, 7, 8, 50) }
        ]
      },
      {
        nr: "T-1019", betreff: "Logo etwas grösser",
        text: "Könnt ihr das Logo im Kopfbereich etwas grösser machen?",
        prio: "Normal", status: "Geschlossen", datum: "24.06.2026", zeit: ts(24, 6, 13, 40),
        antworten: [
          { von: "masesites", text: "Ist angepasst, das Logo ist jetzt besser sichtbar.", datum: "25.06.2026", zeit: ts(25, 6, 10, 25) }
        ]
      }
    ]
  };
}

/* ---------- Konto ohne Geheimnisse an den Client geben ---------- */

function kontoFuerClient(konto) {
  const kopie = Object.assign({}, konto);
  delete kopie.pw;
  delete kopie.pwHash;
  delete kopie.salt;
  return kopie;
}

/* ---------- API-Routen ---------- */

const routen = [];
function route(methode, muster, schutz, handler) {
  const namen = [];
  const regex = new RegExp("^" + muster.replace(/:[^/]+/g, (m) => {
    namen.push(m.slice(1));
    return "([^/]+)";
  }) + "$");
  routen.push({ methode, regex, namen, schutz, handler });
}

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALSCHE_ANMELDUNG = "Keine Übereinstimmung gefunden. Prüfe E-Mail und Passwort.";

/* --- Status: offener Diagnose-Endpunkt, verrät keine Geheimnisse.
   Im Browser https://DEINE-DOMAIN/api/status öffnen:
   JSON mit "ok":true  -> die Node-App läuft.
   Eine 404-Seite des Webservers -> die Node-App läuft (noch) nicht. --- */

route("GET", "/api/status", null, (req, res) => {
  antwortJson(res, 200, {
    ok: true,
    dienst: "masesites",
    zeit: new Date().toISOString(),
    node: process.version,
    https: istHttps(req)
  });
});

/* --- Kunde: Registrierung und Anmeldung --- */

route("POST", "/api/registrieren", null, async (req, res, p, body) => {
  if (!ratenbegrenzung("registrieren", clientIp(req), 10, 3600 * 1000)) {
    return fehler(res, 429, "Zu viele Versuche. Probiere es später nochmal.");
  }
  const email = s(body.email, 200).toLowerCase();
  const name = s(body.name, 80);
  const pw = String(body.passwort || "");
  if (!name) return fehler(res, 400, "Sag uns kurz, wie du heisst.");
  if (!EMAIL_MUSTER.test(email)) return fehler(res, 400, "Diese E-Mail-Adresse sieht nicht gültig aus.");
  if (pw.length < 8) return fehler(res, 400, "Das Passwort braucht mindestens 8 Zeichen.");
  if (ladeKunde(email)) return fehler(res, 409, "Diese E-Mail ist schon registriert. Wechsle oben zu Anmelden.");
  const konto = normalisiereKonto({
    name, firma: s(body.firma, 120), telefon: s(body.telefon, 40),
    email, provider: "email", erstellt: heute()
  });
  speichereKunde(konto, await hashePasswort(pw), "email");
  const token = erstelleSitzung("kunde", emailIndex(email));
  setzeSitzungscookie(res, req, token, "kunde");
  schreibeLog(email, clientIp(req), "login.html", "Konto erstellt", "");
  antwortJson(res, 200, { ok: true, konto: kontoFuerClient(konto) });
});

route("POST", "/api/anmelden", null, async (req, res, p, body) => {
  if (!ratenbegrenzung("anmelden", clientIp(req), 20, 10 * 60000)) {
    return fehler(res, 429, "Zu viele Versuche. Warte ein paar Minuten.");
  }
  const email = s(body.email, 200).toLowerCase();
  const zeile = db.prepare("SELECT pw, provider, daten FROM kunden WHERE email_idx = ?")
    .get(emailIndex(email));
  if (!zeile) {
    /* Gleiche Rechenzeit wie bei echtem Konto, gleiche Fehlermeldung */
    await pruefePasswort(body.passwort, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    return fehler(res, 401, FALSCHE_ANMELDUNG);
  }
  if (zeile.provider === "google") return fehler(res, 400, "Dieses Konto nutzt die Google-Anmeldung. Nimm den Google-Knopf unten.");
  if (zeile.provider === "demo") return fehler(res, 400, "Das Demo-Konto öffnest du über den Link unten.");
  if (!(await pruefePasswort(String(body.passwort || ""), zeile.pw))) {
    schreibeLog(email, clientIp(req), "login.html", "Anmeldung fehlgeschlagen", "");
    return fehler(res, 401, FALSCHE_ANMELDUNG);
  }
  const konto = normalisiereKonto(entschluessele(zeile.daten));
  const token = erstelleSitzung("kunde", emailIndex(email));
  setzeSitzungscookie(res, req, token, "kunde");
  schreibeLog(email, clientIp(req), "login.html", "Angemeldet", "");
  antwortJson(res, 200, { ok: true, konto: kontoFuerClient(konto) });
});

route("POST", "/api/google", null, async (req, res, p, body) => {
  if (!ratenbegrenzung("anmelden", clientIp(req), 20, 10 * 60000)) {
    return fehler(res, 429, "Zu viele Versuche. Warte ein paar Minuten.");
  }
  const credential = String(body.credential || "");
  if (!credential || credential.length > 4096) return fehler(res, 400, "Ungültige Google-Antwort.");
  /* Das ID-Token bei Google prüfen lassen (Signatur, Ablauf) */
  let profil;
  try {
    const antwort = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential),
      { signal: AbortSignal.timeout(8000) });
    if (!antwort.ok) return fehler(res, 401, "Google hat die Anmeldung nicht bestätigt.");
    profil = await antwort.json();
  } catch (e) {
    return fehler(res, 502, "Google ist gerade nicht erreichbar. Probiere es gleich nochmal.");
  }
  if (profil.aud !== GOOGLE_CLIENT_ID) return fehler(res, 401, "Google-Anmeldung gehört nicht zu dieser Website.");
  if (profil.email_verified !== "true" && profil.email_verified !== true) {
    return fehler(res, 401, "Diese Google-E-Mail ist nicht bestätigt.");
  }
  const email = s(profil.email, 200).toLowerCase();
  if (!EMAIL_MUSTER.test(email)) return fehler(res, 400, "Ungültige Google-Antwort.");
  let konto = ladeKunde(email);
  if (!konto) {
    konto = normalisiereKonto({
      name: s(profil.name, 80) || email.split("@")[0],
      email, provider: "google", erstellt: heute()
    });
    speichereKunde(konto, null, "google");
    schreibeLog(email, clientIp(req), "login.html", "Konto erstellt (Google)", "");
  }
  const token = erstelleSitzung("kunde", emailIndex(email));
  setzeSitzungscookie(res, req, token, "kunde");
  schreibeLog(email, clientIp(req), "login.html", "Angemeldet (Google)", "");
  antwortJson(res, 200, { ok: true, konto: kontoFuerClient(konto) });
});

route("POST", "/api/demo", null, (req, res) => {
  if (!ratenbegrenzung("anmelden", clientIp(req), 20, 10 * 60000)) {
    return fehler(res, 429, "Zu viele Versuche. Warte ein paar Minuten.");
  }
  /* Demo-Zugang: frisch aufgesetzt, damit immer aufgeräumt */
  const konto = demoKonto();
  speichereKunde(konto, null, "demo");
  db.prepare("UPDATE kunden SET provider = 'demo' WHERE email_idx = ?").run(emailIndex(konto.email));
  const token = erstelleSitzung("kunde", emailIndex(konto.email));
  setzeSitzungscookie(res, req, token, "kunde");
  antwortJson(res, 200, { ok: true, konto: kontoFuerClient(konto) });
});

route("POST", "/api/abmelden", null, (req, res, p, body) => {
  const typen = COOKIE_NAMEN[body.typ] ? [body.typ] : ["kunde", "mitarbeiter", "admin"];
  typen.forEach((typ) => loescheSitzung(req, typ));
  loescheSitzungscookie(res, typen);
  antwortJson(res, 200, { ok: true });
});

/* --- Kunde: eigene Daten --- */

route("GET", "/api/ich", "kunde", (req, res, p, body, sitzung) => {
  const konto = ladeKundeNachIndex(sitzung.wer);
  if (!konto) { loescheSitzungscookie(res, ["kunde"]); return fehler(res, 401, "Nicht angemeldet."); }
  antwortJson(res, 200, { konto: kontoFuerClient(konto) });
});

route("PUT", "/api/ich", "kunde", (req, res, p, body, sitzung) => {
  const konto = ladeKundeNachIndex(sitzung.wer);
  if (!konto) return fehler(res, 401, "Nicht angemeldet.");
  const neu = body.konto || {};
  /* Der Kunde darf nur Profil, Tickets und Nachrichten ändern.
     Projekte und Aufträge pflegt das Team. */
  konto.name = s(neu.name, 80) || konto.name;
  konto.firma = s(neu.firma, 120);
  konto.telefon = s(neu.telefon, 40);
  konto.tickets = vereineTickets(konto.tickets, saeubereTickets(neu.tickets));
  konto.nachrichten = vereineNachrichten(konto.nachrichten, saeubereNachrichten(neu.nachrichten));
  /* Wünsche/ToDos darf der Kunde selbst pflegen – aber nur diese, keine anderen
     Projektfelder (Titel, Schritt, Vorschau bleiben Sache des Teams). */
  if (Array.isArray(neu.projekte)) {
    const eingehend = {};
    neu.projekte.forEach((pr) => {
      if (pr && pr.id) eingehend[s(pr.id, 16)] = saeubereTodos(pr.todos);
    });
    (konto.projekte || []).forEach((pr) => {
      if (Object.prototype.hasOwnProperty.call(eingehend, pr.id)) pr.todos = eingehend[pr.id];
    });
  }
  speichereKunde(konto);
  antwortJson(res, 200, { ok: true });
});

route("POST", "/api/ich/tickets", "kunde", (req, res, p, body, sitzung) => {
  const konto = ladeKundeNachIndex(sitzung.wer);
  if (!konto) return fehler(res, 401, "Nicht angemeldet.");
  const betreff = s(body.betreff, 160);
  const text = s(body.text, 4000);
  if (!betreff || !text) return fehler(res, 400, "Betreff und Beschreibung dürfen nicht leer sein.");
  const ticket = {
    nr: "T-" + naechsteNummer("ticket", 1000),
    betreff, text,
    prio: s(body.prio, 20) || "Normal",
    status: "Offen", datum: heute(), zeit: Date.now(), antworten: []
  };
  konto.tickets.unshift(ticket);
  speichereKunde(konto);
  schreibeLog(konto.email, clientIp(req), "dashboard.html", "Ticket eröffnet", ticket.nr + ": " + betreff);
  antwortJson(res, 200, { ticket });
});

/* --- Admin --- */

route("POST", "/api/admin/anmelden", null, async (req, res, p, body) => {
  if (!ratenbegrenzung("anmelden", clientIp(req), 20, 10 * 60000)) {
    return fehler(res, 429, "Zu viele Versuche. Warte ein paar Minuten.");
  }
  if (!(await pruefePasswort(String(body.passwort || ""), einstellung("admin_pw")))) {
    schreibeLog("Gast", clientIp(req), "admin", "Admin-Anmeldung fehlgeschlagen", "");
    return fehler(res, 401, "Falsches Passwort.");
  }
  const token = erstelleSitzung("admin", "admin");
  setzeSitzungscookie(res, req, token, "admin");
  schreibeLog("Admin", clientIp(req), "admin", "Admin angemeldet", "");
  antwortJson(res, 200, { ok: true });
});

route("GET", "/api/admin/daten", "admin", (req, res) => {
  antwortJson(res, 200, {
    kunden: alleKunden().map(kontoFuerClient),
    mitarbeiter: alleMitarbeiter(),
    log: ladeLog(),
    botlogs: ladeBotlog(),
    adminPwGeaendert: einstellung("admin_pw_geaendert") === "1"
  });
});

route("PUT", "/api/admin/kunden/:email", "admin", (req, res, p, body) => {
  const konto = ladeKunde(p.email);
  if (!konto) return fehler(res, 404, "Konto nicht gefunden.");
  const neu = body.konto || {};
  konto.name = s(neu.name, 80) || konto.name;
  konto.firma = s(neu.firma, 120);
  konto.telefon = s(neu.telefon, 40);
  konto.projekte = saeubereProjekte(neu.projekte);
  konto.auftraege = saeubereAuftraege(neu.auftraege);
  konto.tickets = saeubereTickets(neu.tickets);
  konto.nachrichten = vereineNachrichten(konto.nachrichten, saeubereNachrichten(neu.nachrichten));
  speichereKunde(konto);
  antwortJson(res, 200, { ok: true });
});

route("DELETE", "/api/admin/kunden/:email", "admin", (req, res, p) => {
  loescheKunde(s(p.email, 200).toLowerCase());
  antwortJson(res, 200, { ok: true });
});

route("POST", "/api/admin/kunden/:email/projekte", "admin", (req, res, p, body) => {
  const konto = ladeKunde(p.email);
  if (!konto) return fehler(res, 404, "Konto nicht gefunden.");
  const titel = s(body.titel, 160);
  if (!titel) return fehler(res, 400, "Gib dem Projekt einen Titel.");
  const projekt = {
    id: "P-" + naechsteNummer("projekt", 1000),
    titel, paket: s(body.paket, 160),
    schritt: 0, vorschau: "", erstellt: heute(),
    aktivitaet: [{ text: "Projekt angelegt", datum: heute(), zeit: Date.now() }]
  };
  konto.projekte.push(projekt);
  speichereKunde(konto);
  antwortJson(res, 200, { projekt });
});

route("POST", "/api/admin/mitarbeiter", "admin", async (req, res, p, body) => {
  const name = s(body.name, 80);
  const email = s(body.email, 200).toLowerCase();
  const pw = String(body.passwort || "");
  if (!name) return fehler(res, 400, "Gib einen Namen an.");
  if (!EMAIL_MUSTER.test(email)) return fehler(res, 400, "Diese E-Mail-Adresse sieht nicht gültig aus.");
  if (pw.length < 8) return fehler(res, 400, "Das Passwort braucht mindestens 8 Zeichen.");
  if (ladeMitarbeiterNachEmail(email)) return fehler(res, 409, "Für diese E-Mail gibt es schon ein Mitarbeiterkonto.");
  const mitarbeiter = {
    id: "M-" + naechsteNummer("mitarbeiter", 100),
    name, rolle: s(body.rolle, 80), email,
    erstellt: heute(), aktiv: true, kunden: []
  };
  db.prepare("INSERT INTO mitarbeiter (id, email_idx, pw, aktiv, daten) VALUES (?, ?, ?, 1, ?)")
    .run(mitarbeiter.id, emailIndex(email), await hashePasswort(pw), verschluessele({
      name: mitarbeiter.name, rolle: mitarbeiter.rolle, email,
      erstellt: mitarbeiter.erstellt, kunden: []
    }));
  antwortJson(res, 200, { mitarbeiter });
});

route("PUT", "/api/admin/mitarbeiter/:id", "admin", (req, res, p, body) => {
  const m = ladeMitarbeiter(p.id);
  if (!m) return fehler(res, 404, "Mitarbeiter nicht gefunden.");
  if (typeof body.name === "string" && s(body.name, 80)) m.name = s(body.name, 80);
  if (typeof body.rolle === "string") m.rolle = s(body.rolle, 80);
  if (typeof body.aktiv === "boolean") m.aktiv = body.aktiv;
  if (Array.isArray(body.kunden)) {
    m.kunden = body.kunden.slice(0, 500).map((e) => s(e, 200).toLowerCase());
  }
  aktualisiereMitarbeiterDaten(m);
  if (!m.aktiv) db.prepare("DELETE FROM sitzungen WHERE typ = 'mitarbeiter' AND wer = ?").run(m.id);
  antwortJson(res, 200, { ok: true });
});

route("POST", "/api/admin/mitarbeiter/:id/passwort", "admin", async (req, res, p, body) => {
  const m = ladeMitarbeiter(p.id);
  if (!m) return fehler(res, 404, "Mitarbeiter nicht gefunden.");
  const pw = String(body.passwort || "");
  if (pw.length < 8) return fehler(res, 400, "Das Passwort braucht mindestens 8 Zeichen.");
  db.prepare("UPDATE mitarbeiter SET pw = ? WHERE id = ?").run(await hashePasswort(pw), m.id);
  db.prepare("DELETE FROM sitzungen WHERE typ = 'mitarbeiter' AND wer = ?").run(m.id);
  antwortJson(res, 200, { ok: true });
});

route("DELETE", "/api/admin/mitarbeiter/:id", "admin", (req, res, p) => {
  db.prepare("DELETE FROM mitarbeiter WHERE id = ?").run(p.id);
  db.prepare("DELETE FROM sitzungen WHERE typ = 'mitarbeiter' AND wer = ?").run(p.id);
  antwortJson(res, 200, { ok: true });
});

route("POST", "/api/admin/passwort", "admin", async (req, res, p, body) => {
  if (!(await pruefePasswort(String(body.alt || ""), einstellung("admin_pw")))) {
    return fehler(res, 401, "Das aktuelle Passwort stimmt nicht.");
  }
  const neu = String(body.neu || "");
  if (neu.length < 8) return fehler(res, 400, "Das neue Passwort braucht mindestens 8 Zeichen.");
  setzeEinstellung("admin_pw", await hashePasswort(neu));
  setzeEinstellung("admin_pw_geaendert", "1");
  /* Andere Admin-Sitzungen beenden, die eigene bleibt gültig */
  const eigenes = tokenHash(lesecookie(req, COOKIE_NAMEN.admin) || "");
  db.prepare("DELETE FROM sitzungen WHERE typ = 'admin' AND token_hash != ?").run(eigenes);
  try { fs.unlinkSync(path.join(DATEN_ORDNER, "admin-startpasswort.txt")); } catch (e) {}
  schreibeLog("Admin", clientIp(req), "admin", "Admin-Passwort geändert", "");
  antwortJson(res, 200, { ok: true });
});

route("DELETE", "/api/admin/log", "admin", (req, res) => {
  db.exec("DELETE FROM log");
  schreibeLog("Admin", clientIp(req), "admin", "Protokoll geleert", "");
  antwortJson(res, 200, { ok: true });
});

/* --- Mitarbeiter-Portal --- */

route("POST", "/api/mcs/anmelden", null, async (req, res, p, body) => {
  if (!ratenbegrenzung("anmelden", clientIp(req), 20, 10 * 60000)) {
    return fehler(res, 429, "Zu viele Versuche. Warte ein paar Minuten.");
  }
  const email = s(body.email, 200).toLowerCase();
  const zeile = db.prepare("SELECT id, pw, aktiv FROM mitarbeiter WHERE email_idx = ?")
    .get(emailIndex(email));
  if (!zeile) {
    await pruefePasswort(body.passwort, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    return fehler(res, 401, FALSCHE_ANMELDUNG);
  }
  if (!(await pruefePasswort(String(body.passwort || ""), zeile.pw))) {
    schreibeLog(email, clientIp(req), "mcs", "Anmeldung fehlgeschlagen", "");
    return fehler(res, 401, FALSCHE_ANMELDUNG);
  }
  if (zeile.aktiv !== 1) return fehler(res, 403, "Dieses Konto ist deaktiviert. Melde dich bei der Verwaltung.");
  const token = erstelleSitzung("mitarbeiter", zeile.id);
  setzeSitzungscookie(res, req, token, "mitarbeiter");
  const m = ladeMitarbeiter(zeile.id);
  schreibeLog("MA " + m.name, clientIp(req), "mcs", "Mitarbeiter angemeldet", email);
  antwortJson(res, 200, { ok: true });
});

route("GET", "/api/mcs/daten", "mitarbeiter", (req, res, p, body, sitzung) => {
  const m = ladeMitarbeiter(sitzung.wer);
  if (!m || !m.aktiv) { loescheSitzungscookie(res, ["mitarbeiter"]); return fehler(res, 401, "Nicht angemeldet."); }
  const zugewiesene = alleKunden().filter((k) => m.kunden.includes(k.email));
  antwortJson(res, 200, { ma: m, kunden: zugewiesene.map(kontoFuerClient) });
});

route("PUT", "/api/mcs/kunden/:email", "mitarbeiter", (req, res, p, body, sitzung) => {
  const m = ladeMitarbeiter(sitzung.wer);
  if (!m || !m.aktiv) return fehler(res, 401, "Nicht angemeldet.");
  const email = s(p.email, 200).toLowerCase();
  if (!m.kunden.includes(email)) return fehler(res, 403, "Dieser Kunde ist dir nicht zugewiesen.");
  const konto = ladeKunde(email);
  if (!konto) return fehler(res, 404, "Konto nicht gefunden.");
  const neu = body.konto || {};
  /* Mitarbeiter pflegen Projekte, Tickets und Nachrichten —
     Stammdaten und Aufträge bleiben unangetastet */
  konto.projekte = saeubereProjekte(neu.projekte);
  konto.tickets = saeubereTickets(neu.tickets);
  konto.nachrichten = vereineNachrichten(konto.nachrichten, saeubereNachrichten(neu.nachrichten));
  speichereKunde(konto);
  antwortJson(res, 200, { ok: true });
});

/* --- Protokoll und KI-Chats --- */

route("POST", "/api/log", null, (req, res, p, body, sitzung) => {
  if (!ratenbegrenzung("log", clientIp(req), 120, 60000)) {
    return antwortJson(res, 200, { ok: true }); /* Überschuss still verwerfen */
  }
  schreibeLog(logLabel(sitzung), clientIp(req), s(body.seite, 60), s(body.aktion, 60), s(body.detail, 180));
  antwortJson(res, 200, { ok: true });
});

route("POST", "/api/bot-log", null, (req, res, p, body, sitzung) => {
  if (!ratenbegrenzung("botlog", clientIp(req), 30, 60000)) {
    return antwortJson(res, 200, { ok: true });
  }
  const von = body.von === "bot" ? "bot" : "besucher";
  const text = s(body.text, 400);
  if (!text) return fehler(res, 400, "Leer.");
  schreibeBotlog(logLabel(sitzung), s(body.seite, 60), von, text);
  antwortJson(res, 200, { ok: true });
});

/* ---------- Statische Dateien ---------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff", ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json"
};

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "frame-src https:",
  "connect-src 'self' https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'"
].join("; ");

function sicherheitsKoepfe(res, req, istHtml) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (istHtml) {
    res.setHeader("Content-Security-Policy", CSP);
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
  }
  if (istHttps(req)) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
}

function liefereDatei(req, res, pfadname) {
  let rel;
  try { rel = decodeURIComponent(pfadname); } catch (e) { res.writeHead(400); return res.end("Ungültige Adresse"); }
  rel = rel.replace(/\\/g, "/");

  /* Server-Code, Datenbank und versteckte Dateien nie ausliefern */
  const segmente = rel.split("/").filter(Boolean);
  if (segmente.some((t) => t.startsWith(".")) ||
      segmente[0] === "server" || segmente[0] === "node_modules") {
    res.writeHead(404); return res.end("Nicht gefunden");
  }

  let voll = path.normalize(path.join(WURZEL, rel));
  if (!voll.startsWith(WURZEL)) { res.writeHead(404); return res.end("Nicht gefunden"); }

  let stat = null;
  try { stat = fs.statSync(voll); } catch (e) {}
  if (stat && stat.isDirectory()) {
    voll = path.join(voll, "index.html");
    try { stat = fs.statSync(voll); } catch (e) { stat = null; }
  }
  /* Saubere Adressen wie auf dem Live-Server (.htaccess): /preise → preise.html */
  if (!stat && !path.extname(voll)) {
    try {
      const mitHtml = fs.statSync(voll + ".html");
      if (mitHtml.isFile()) { voll = voll + ".html"; stat = mitHtml; }
    } catch (e) {}
  }
  if (!stat || !stat.isFile()) {
    sicherheitsKoepfe(res, req, true);
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end("<!doctype html><meta charset=\"utf-8\"><title>Nicht gefunden</title><p>Seite nicht gefunden. <a href=\"/\">Zur Startseite</a></p>");
  }

  const endung = path.extname(voll).toLowerCase();
  const typ = MIME[endung] || "application/octet-stream";
  const istHtml = endung === ".html";
  sicherheitsKoepfe(res, req, istHtml);
  res.writeHead(200, {
    "Content-Type": typ,
    "Content-Length": stat.size,
    "Cache-Control": istHtml ? "no-cache" : "public, max-age=3600"
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(voll).pipe(res);
}

/* ---------- Anfragen verteilen ---------- */

async function behandle(req, res) {
  raeumeSitzungenAuf();
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const pfad = url.pathname;

  if (!pfad.startsWith("/api/")) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405); return res.end("Nicht erlaubt");
    }
    return liefereDatei(req, res, pfad === "/" ? "/index.html" : pfad);
  }

  /* CSRF-Schutz: schreibende Aufrufe brauchen den eigenen Header, und wenn
     ein Origin mitkommt, muss er zur eigenen Website gehören */
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.headers["x-requested-with"] !== "fetch") {
      return fehler(res, 403, "Ungültige Anfrage.");
    }
    const origin = req.headers.origin;
    if (origin) {
      let originHost = null;
      try { originHost = new URL(origin).host; } catch (e) {}
      if (originHost !== req.headers.host) return fehler(res, 403, "Ungültige Herkunft.");
    }
  }

  for (const r of routen) {
    if (r.methode !== req.method) continue;
    const treffer = r.regex.exec(pfad);
    if (!treffer) continue;

    const params = {};
    r.namen.forEach((name, i) => {
      try { params[name] = decodeURIComponent(treffer[i + 1]); }
      catch (e) { params[name] = treffer[i + 1]; }
    });

    /* Geschützte Routen lesen das Cookie ihrer Rolle; offene Routen
       (Protokoll, Abmelden) nehmen die erste vorhandene Sitzung */
    const sitzung = r.schutz ? findeSitzung(req, r.schutz) : irgendeineSitzung(req);
    if (r.schutz && !sitzung) {
      return fehler(res, 401, "Nicht angemeldet.");
    }

    let body = {};
    if (req.method !== "GET" && req.method !== "HEAD") {
      try { body = await leseKoerper(req); }
      catch (e) { return fehler(res, 400, "Anfrage konnte nicht gelesen werden."); }
      if (typeof body !== "object" || body === null || Array.isArray(body)) body = {};
    }

    try {
      return await r.handler(req, res, params, body, sitzung);
    } catch (e) {
      console.error("Fehler in " + req.method + " " + pfad + ":", e);
      if (!res.headersSent) return fehler(res, 500, "Interner Fehler.");
      return;
    }
  }
  fehler(res, 404, "Unbekannter API-Pfad.");
}

/* ---------- Start ---------- */

stelleAdminPasswortSicher().then(() => {
  const server = http.createServer((req, res) => {
    behandle(req, res).catch((e) => {
      console.error("Unerwarteter Fehler:", e);
      if (!res.headersSent) { res.writeHead(500); res.end("Interner Fehler"); }
    });
  });
  server.listen(PORT, () => {
    console.log(typeof PORT === "number"
      ? "masesites läuft auf http://localhost:" + PORT
      : "masesites läuft (Socket " + PORT + ", z. B. hinter Passenger/Plesk)");
    console.log("Website-Wurzel: " + WURZEL);
    console.log("Daten und Schlüssel: " + DATEN_ORDNER);
  });
});
