/* Lizenzlogik: Code prüfen, ans Gerät binden, beim Start still nachprüfen.

   Zwei Betriebsarten (siehe konfiguration.js):
   - 'simuliert' — Phase 2. Der Server kennt noch keine Lizenzen, die Prüfung
     passiert hier im Programm. Damit lassen sich alle Bildschirme sofort
     durchklicken. KEIN echter Schutz.
   - 'server'    — Phase 1 ist scharf. Der Server entscheidet, das Programm
     glaubt ihm nur. Erst dann schützt die Lizenz wirklich.

   Kulanzfrist: Ist der Server nicht erreichbar, läuft die App mit der zuletzt
   bestätigten Lizenz weiter — aber nur für eine begrenzte Zeit. */

'use strict';

const api = require('./api');
const geraet = require('./geraet');
const konfiguration = require('./konfiguration');
const tresor = require('./tresor');

const MUSTER = /^MASE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const KULANZ_TAGE = 7;
const KULANZ_MS = KULANZ_TAGE * 24 * 3600 * 1000;
/* Nur in der simulierten Prüfung: dieser Code wird immer abgelehnt,
   damit sich der Fehlerfall im Bildschirm testen lässt. */
const SIMULIERT_UNGUELTIG = 'MASE-0000-0000-0000';

function normalisiere(eingabe) {
  const zeichen = String(eingabe || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (zeichen.length !== 16) {
    return zeichen;   /* unvollständig — die Prüfung unten lehnt ab */
  }
  return [zeichen.slice(0, 4), zeichen.slice(4, 8), zeichen.slice(8, 12), zeichen.slice(12, 16)].join('-');
}

function istGueltigesFormat(code) {
  return MUSTER.test(code);
}

function jetzt() {
  return Date.now();
}

/* ---------- Prüfung beim Server ---------- */

async function frageServer(code) {
  const antwort = await api.anfrage('/api/lizenz/pruefen', 'POST', {
    code,
    geraet: geraet.fingerabdruck(),
    geraetName: geraet.name(),
  });
  if (antwort.status === 200 && antwort.json) {
    const json = antwort.json;
    /* Der Server nimmt die Lizenz an, aber das Gerät steht auf der
       Warteliste: es gibt schon genug freigeschaltete Geräte. */
    if (json.status === 'wartet') {
      return {
        ok: false,
        wartet: true,
        geraeteMax: json.geraeteMax || 2,
        meldung: 'Dieses Gerät muss auf einem bereits freigeschalteten Gerät bestätigt werden.',
      };
    }
    if (json.ok) {
      return {
        ok: true,
        ablauf: typeof json.ablauf === 'string' ? json.ablauf : null,
      };
    }
  }
  if (antwort.status === 404) {
    return { ok: false, meldung: 'Der Server kennt die Lizenzprüfung noch nicht. Phase 1 ist dort noch nicht eingebaut.' };
  }
  return { ok: false, meldung: api.meldung(antwort, 'Dieser Lizenzcode wurde nicht anerkannt.') };
}

function frageSimuliert(code) {
  if (code === SIMULIERT_UNGUELTIG) {
    return { ok: false, meldung: 'Dieser Lizenzcode ist ungültig oder gesperrt.' };
  }
  return { ok: true, ablauf: null };
}

async function pruefeCode(code) {
  if (konfiguration.lade().lizenzModus === 'server') {
    return frageServer(code);
  }
  return frageSimuliert(code);
}

/* ---------- Registrieren (Bildschirm 1) ---------- */

async function registriere(eingabe) {
  const code = normalisiere(eingabe);
  if (!istGueltigesFormat(code)) {
    return { ok: false, meldung: 'Der Code sieht nicht vollständig aus. Erwartet wird MASE-XXXX-XXXX-XXXX.' };
  }

  let ergebnis;
  try {
    ergebnis = await pruefeCode(code);
  } catch (fehler) {
    return {
      ok: false,
      meldung: 'Der Server ist nicht erreichbar. Für die erste Freischaltung braucht die App eine Internetverbindung.',
      netz: true,
      detail: fehler.message,
    };
  }
  /* Wartet das Gerät auf Bestätigung, merken wir den Code trotzdem —
     sonst müsste er nach der Freigabe erneut eingetippt werden. */
  if (ergebnis.wartet) {
    const wartend = {
      code,
      geraet: geraet.fingerabdruck(),
      geprueftAm: jetzt(),
      ablauf: null,
    };
    tresor.schreibe(wartend);
    return { ok: false, wartet: true, meldung: ergebnis.meldung, status: zustandAus(wartend, 'wartet') };
  }
  if (!ergebnis.ok) {
    return { ok: false, meldung: ergebnis.meldung };
  }

  const gespeichert = {
    code,
    geraet: geraet.fingerabdruck(),
    geprueftAm: jetzt(),
    ablauf: ergebnis.ablauf || null,
  };
  const abgelegt = tresor.schreibe(gespeichert);
  return {
    ok: true,
    dauerhaft: abgelegt,
    status: zustandAus(gespeichert, 'gueltig'),
  };
}

/* ---------- Stille Prüfung beim Start ---------- */

function abgelaufen(gespeichert) {
  if (!gespeichert.ablauf) {
    return false;
  }
  const ende = Date.parse(gespeichert.ablauf);
  return Number.isFinite(ende) && ende < jetzt();
}

function zustandAus(gespeichert, status, zusatz) {
  return {
    status,
    code: gespeichert ? gespeichert.code : null,
    geraet: geraet.kurzform(),
    ablauf: gespeichert ? gespeichert.ablauf : null,
    geprueftAm: gespeichert ? gespeichert.geprueftAm : null,
    modus: konfiguration.lade().lizenzModus,
    ...(zusatz || {}),
  };
}

async function pruefeStill() {
  const gespeichert = tresor.lese();
  if (!gespeichert || !istGueltigesFormat(String(gespeichert.code || ''))) {
    return zustandAus(null, 'fehlt');
  }
  if (gespeichert.geraet !== geraet.fingerabdruck()) {
    return zustandAus(gespeichert, 'fremd', {
      meldung: 'Diese Lizenz ist an ein anderes Gerät gebunden.',
    });
  }
  if (abgelaufen(gespeichert)) {
    return zustandAus(gespeichert, 'abgelaufen', {
      meldung: 'Die Lizenz ist abgelaufen.',
    });
  }

  let ergebnis;
  try {
    ergebnis = await pruefeCode(gespeichert.code);
  } catch {
    /* Kein Netz: Kulanzfrist ab der letzten bestätigten Prüfung. */
    const alter = jetzt() - Number(gespeichert.geprueftAm || 0);
    if (alter < KULANZ_MS) {
      const resttage = Math.max(1, Math.ceil((KULANZ_MS - alter) / (24 * 3600 * 1000)));
      return zustandAus(gespeichert, 'kulanz', {
        resttage,
        meldung: 'Kein Internet — die App läuft noch ' + resttage + ' Tag(e) weiter.',
      });
    }
    return zustandAus(gespeichert, 'kulanzEnde', {
      meldung: 'Die Lizenz konnte seit ' + KULANZ_TAGE + ' Tagen nicht geprüft werden. Bitte einmal mit Internet starten.',
    });
  }

  /* Noch nicht bestätigt: Code behalten, die App zeigt den Warteschirm. */
  if (ergebnis.wartet) {
    return zustandAus(gespeichert, 'wartet', { meldung: ergebnis.meldung });
  }
  if (!ergebnis.ok) {
    tresor.loesche();
    return zustandAus(null, 'ungueltig', { meldung: ergebnis.meldung });
  }

  const aktualisiert = { ...gespeichert, geprueftAm: jetzt(), ablauf: ergebnis.ablauf || null };
  tresor.schreibe(aktualisiert);
  return zustandAus(aktualisiert, 'gueltig');
}

/* ---------- Lizenzpflicht (scharf schalten) ---------- */

/* Ist der Adminbereich schon auf die App beschränkt? Die Auskunft kommt aus
   derselben Antwort wie die Lizenzliste. */
async function pflichtStand() {
  try {
    const antwort = await api.anfrage('/api/admin/lizenzen', 'GET');
    if (antwort.status === 200 && antwort.json) {
      return { ok: true, an: antwort.json.lizenzpflicht === true };
    }
    if (antwort.status === 404) {
      return { ok: false, grund: 'alt', meldung: 'Der Server kennt die Lizenzverwaltung noch nicht.' };
    }
    return { ok: false, grund: 'nicht-angemeldet' };
  } catch {
    return { ok: false, grund: 'netz' };
  }
}

/* Der Server lässt das Anschalten nur aus einer Sitzung zu, die selbst über
   die App entstanden ist — sonst sperrt man sich aus. Genau deshalb sitzt
   dieser Schalter hier und nicht im Browser. */
async function pflichtSetzen(an) {
  let antwort;
  try {
    antwort = await api.anfrage('/api/admin/lizenzpflicht', 'POST', { an: an === true });
  } catch {
    return { ok: false, meldung: 'Der Server ist nicht erreichbar.' };
  }
  if (antwort.status === 200 && antwort.json && antwort.json.ok) {
    return { ok: true, an: antwort.json.lizenzpflicht === true };
  }
  if (antwort.status === 409) {
    return {
      ok: false,
      meldung: api.meldung(antwort, 'Erst über die App anmelden — sonst sperrst du dich aus.'),
    };
  }
  if (antwort.status === 404) {
    return { ok: false, meldung: 'Der Server kennt die Lizenzpflicht noch nicht. api.php ist dort nicht aktuell.' };
  }
  return { ok: false, meldung: api.meldung(antwort, 'Das hat nicht geklappt.') };
}

/* Lizenz vom Gerät lösen — für Support und zum Testen. */
function loese() {
  tresor.loesche();
  return zustandAus(null, 'fehlt');
}

/* Nur diese Zustände dürfen weiter zum Login. */
function darfWeiter(status) {
  return status === 'gueltig' || status === 'kulanz';
}

module.exports = {
  MUSTER,
  KULANZ_TAGE,
  SIMULIERT_UNGUELTIG,
  normalisiere,
  istGueltigesFormat,
  registriere,
  pruefeStill,
  loese,
  darfWeiter,
  pflichtStand,
  pflichtSetzen,
};
