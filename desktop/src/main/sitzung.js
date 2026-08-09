/* Anmeldung gegen die bestehende API.

   Hinweis zum Bauplan: Der Admin-Bereich kennt KEINEN Benutzernamen.
   /api/admin/anmelden erwartet nur { passwort } und setzt danach das
   HttpOnly-Cookie ms_sitzung_admin.

   Das Passwort wird nur weitergereicht und nirgends abgelegt. Nach der ersten
   erfolgreichen Anmeldung gibt der Server dem Gerät stattdessen einen Token.
   Der liegt verschlüsselt im Tresor und ersetzt das Passwort beim nächsten
   Start — bis man in der App auf das Schloss drückt: dann wird er gelöscht
   und das Passwort ist wieder fällig. */

'use strict';

const api = require('./api');
const geraet = require('./geraet');
const konfiguration = require('./konfiguration');
const tresor = require('./tresor');

const PFAD_ANMELDEN = '/api/admin/anmelden';
const PFAD_ABMELDEN = '/api/abmelden';
const PFAD_GERAET_ANMELDEN = '/api/geraet/anmelden';
const PFAD_SPERREN = '/api/geraet/sperren';
/* Zugleich der Sitzungstest: 200 = angemeldet, 401 = nicht angemeldet. */
const PFAD_DATEN = '/api/admin/daten';

function imServermodus() {
  return konfiguration.lade().lizenzModus === 'server';
}

function gespeicherteLizenz() {
  return imServermodus() ? tresor.lese() : null;
}

function merkeToken(token) {
  const vorher = tresor.lese();
  if (!vorher) {
    return false;
  }
  return tresor.schreibe({ ...vorher, token: token || null });
}

/* ---------- Anmeldung mit Passwort ---------- */

async function anmelden(passwort) {
  if (typeof passwort !== 'string' || passwort === '') {
    return { ok: false, meldung: 'Bitte das Admin-Passwort eingeben.' };
  }

  const gespeichert = gespeicherteLizenz();
  const anfrage = { passwort };
  if (gespeichert && gespeichert.code) {
    anfrage.lizenz = gespeichert.code;
    anfrage.geraet = geraet.fingerabdruck();
    anfrage.geraetName = geraet.name();
  }

  let antwort;
  try {
    antwort = await api.anfrage(PFAD_ANMELDEN, 'POST', anfrage);
  } catch (fehler) {
    return { ok: false, netz: true, meldung: 'Der Server ist nicht erreichbar.', detail: fehler.message };
  }

  if (antwort.status === 200 && antwort.json && antwort.json.ok) {
    if (antwort.json.geraetToken) {
      merkeToken(antwort.json.geraetToken);
    }
    return { ok: true, gemerkt: !!antwort.json.geraetToken };
  }
  if (antwort.status === 429) {
    return { ok: false, meldung: api.meldung(antwort, 'Zu viele Versuche. Warte ein paar Minuten.') };
  }
  if (antwort.status === 403) {
    return { ok: false, meldung: api.meldung(antwort, 'Dieses Gerät ist nicht freigeschaltet.') };
  }
  if (antwort.status === 404) {
    return { ok: false, meldung: 'Unter dieser Adresse antwortet keine masesites-API. Serveradresse prüfen.' };
  }
  return { ok: false, meldung: api.meldung(antwort, 'Falsches Passwort.') };
}

/* ---------- Stille Anmeldung mit dem Geräte-Token ---------- */

/* Läuft beim Start. Ohne Token (simulierter Modus, gesperrt, erstes Mal)
   passiert hier nichts und die App fragt nach dem Passwort. */
async function stilleAnmeldung() {
  const gespeichert = gespeicherteLizenz();
  if (!gespeichert || !gespeichert.token) {
    return { ok: false, grund: 'kein-token' };
  }
  let antwort;
  try {
    antwort = await api.anfrage(PFAD_GERAET_ANMELDEN, 'POST', {
      token: gespeichert.token,
      geraet: geraet.fingerabdruck(),
    });
  } catch {
    return { ok: false, grund: 'netz' };
  }
  if (antwort.status === 200 && antwort.json && antwort.json.ok) {
    return { ok: true };
  }
  /* Der Server kennt das Gerät nicht mehr (entfernt oder gesperrt):
     Token wegwerfen, damit es beim nächsten Mal gar nicht erst probiert. */
  if (antwort.status === 401) {
    merkeToken(null);
  }
  return { ok: false, grund: 'abgelehnt' };
}

async function istAngemeldet() {
  try {
    const antwort = await api.anfrage(PFAD_DATEN, 'GET');
    return { erreichbar: true, angemeldet: antwort.status === 200 };
  } catch {
    return { erreichbar: false, angemeldet: false };
  }
}

/* ---------- Sperren und Abmelden ---------- */

/* Das Schloss: Sitzung weg, Token weg. Danach kommt man nur mit dem
   Passwort wieder hinein — genau das ist der Sinn. */
async function sperren() {
  const gespeichert = gespeicherteLizenz();
  if (gespeichert && gespeichert.token) {
    try {
      await api.anfrage(PFAD_SPERREN, 'POST', {
        token: gespeichert.token,
        geraet: geraet.fingerabdruck(),
      });
    } catch {
      /* Auch ohne Netz lokal sperren. */
    }
    merkeToken(null);
  }
  try {
    await api.anfrage(PFAD_ABMELDEN, 'POST', { typ: 'admin' });
  } catch {
    /* egal */
  }
  await leereCookies();
  return { ok: true };
}

/* Abmelden ist dasselbe wie Sperren — sonst würde die stille Anmeldung
   sofort wieder greifen und der Klick bliebe wirkungslos. */
async function abmelden() {
  return sperren();
}

/* Restlos: das eingebettete /admin holt sich das Cookie sonst wieder. */
async function leereCookies() {
  const sitzung = api.sitzungHolen();
  try {
    const kekse = await sitzung.cookies.get({});
    await Promise.all(kekse.map((keks) => {
      const schema = keks.secure ? 'https' : 'http';
      const wirt = keks.domain && keks.domain.startsWith('.') ? keks.domain.slice(1) : keks.domain;
      return sitzung.cookies.remove(schema + '://' + wirt + keks.path, keks.name).catch(() => {});
    }));
  } catch (fehler) {
    console.error('masesites: Cookies nicht löschbar:', fehler.message);
  }
}

/* Kann die App ohne Passwort starten? Nur dann ist das Schloss sinnvoll. */
function hatToken() {
  const gespeichert = gespeicherteLizenz();
  return !!(gespeichert && gespeichert.token);
}

module.exports = {
  anmelden,
  stilleAnmeldung,
  istAngemeldet,
  sperren,
  abmelden,
  leereCookies,
  hatToken,
};
