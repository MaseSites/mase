/* Alle Server-Aufrufe der App laufen über diese Stelle.

   Wichtig: Die Anfragen gehen vom Hauptprozess über Electrons net-Modul und
   benutzen dieselbe Sitzungs-Partition wie der eingebettete Admin-Bereich.
   Dadurch landet das HttpOnly-Sitzungscookie aus /api/admin/anmelden genau
   dort, wo /admin es später braucht — und der Renderer bekommt es nie zu
   sehen.

   Der CSRF-Schutz deiner API verlangt bei schreibenden Aufrufen den Header
   X-Requested-With: fetch. Einen Origin-Header schickt der Hauptprozess
   nicht, deshalb greift die Origin-Prüfung hier gar nicht erst. */

'use strict';

const { net, session } = require('electron');
const konfiguration = require('./konfiguration');

const PARTITION = 'persist:masesites';
const ZEITLIMIT_MS = 15000;

function sitzungHolen() {
  return session.fromPartition(PARTITION);
}

class NetzFehler extends Error {
  constructor(text) {
    super(text);
    this.name = 'NetzFehler';
    this.netz = true;
  }
}

/* Antwortet immer mit { status, json } — HTTP-Fehlercodes sind kein Wurf.
   Geworfen wird nur, wenn der Server gar nicht erreichbar ist. */
function anfrage(pfad, methode = 'GET', koerper) {
  return new Promise((erfuellen, ablehnen) => {
    let erledigt = false;
    const fertig = (fn, wert) => {
      if (erledigt) return;
      erledigt = true;
      clearTimeout(uhr);
      fn(wert);
    };

    let request;
    try {
      request = net.request({
        method: methode,
        url: konfiguration.serverUrsprung() + pfad,
        session: sitzungHolen(),
        credentials: 'include',
      });
    } catch (fehler) {
      return ablehnen(new NetzFehler(fehler.message));
    }

    const uhr = setTimeout(() => {
      try { request.abort(); } catch { /* egal */ }
      fertig(ablehnen, new NetzFehler('Zeitüberschreitung: Der Server hat nicht geantwortet.'));
    }, ZEITLIMIT_MS);

    request.setHeader('X-Requested-With', 'fetch');
    request.setHeader('Accept', 'application/json');
    if (koerper !== undefined) {
      request.setHeader('Content-Type', 'application/json');
    }

    request.on('response', (antwort) => {
      const teile = [];
      antwort.on('data', (stueck) => teile.push(stueck));
      antwort.on('end', () => {
        let json = {};
        try {
          json = JSON.parse(Buffer.concat(teile).toString('utf8'));
        } catch {
          json = {};   /* z. B. eine HTML-Fehlerseite vom Webserver */
        }
        fertig(erfuellen, { status: antwort.statusCode, json });
      });
      antwort.on('error', (fehler) => fertig(ablehnen, new NetzFehler(fehler.message)));
    });

    request.on('error', (fehler) => fertig(ablehnen, new NetzFehler(fehler.message)));

    if (koerper !== undefined) {
      request.write(JSON.stringify(koerper));
    }
    request.end();
  });
}

/* Meldung aus der Antwort holen, ohne dem Server blind zu vertrauen. */
function meldung(antwort, ersatz) {
  const text = antwort && antwort.json && antwort.json.fehler;
  return typeof text === 'string' && text.trim() ? text.slice(0, 300) : ersatz;
}

module.exports = { PARTITION, sitzungHolen, anfrage, meldung, NetzFehler };
