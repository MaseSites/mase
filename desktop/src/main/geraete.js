/* Geräte einer Lizenz: anzeigen, bestätigen, entfernen.

   Es dürfen nur zwei Geräte gleichzeitig freigeschaltet sein. Klopft ein
   drittes an, landet es auf der Warteliste — und eines der beiden
   freigeschalteten muss es durchwinken. Diese Datei hält dafür Ausschau und
   meldet es der Oberfläche. */

'use strict';

const api = require('./api');
const geraet = require('./geraet');
const konfiguration = require('./konfiguration');
const tresor = require('./tresor');

const WACHINTERVALL_MS = 20000;

let wache = null;
let gemeldet = new Set();

function ausweis() {
  if (konfiguration.lade().lizenzModus !== 'server') {
    return null;
  }
  const gespeichert = tresor.lese();
  if (!gespeichert || !gespeichert.token) {
    return null;
  }
  return { token: gespeichert.token, geraet: geraet.fingerabdruck() };
}

async function liste() {
  const wer = ausweis();
  if (!wer) {
    return { ok: false, grund: 'kein-token', geraete: [] };
  }
  try {
    const antwort = await api.anfrage('/api/geraet/liste', 'POST', wer);
    if (antwort.status === 200 && antwort.json && antwort.json.ok) {
      return {
        ok: true,
        eigenes: antwort.json.eigenes,
        max: antwort.json.max,
        geraete: Array.isArray(antwort.json.geraete) ? antwort.json.geraete : [],
      };
    }
    return { ok: false, grund: 'abgelehnt', geraete: [] };
  } catch {
    return { ok: false, grund: 'netz', geraete: [] };
  }
}

async function entscheiden(id, erlauben) {
  const wer = ausweis();
  if (!wer) {
    return { ok: false, meldung: 'Dieses Gerät darf gerade nicht entscheiden.' };
  }
  try {
    const antwort = await api.anfrage('/api/geraet/entscheiden', 'POST', {
      ...wer,
      id: String(id || ''),
      erlauben: erlauben === true,
    });
    if (antwort.status === 200 && antwort.json && antwort.json.ok) {
      /* Nach einer Entscheidung darf dasselbe Gerät wieder gemeldet werden,
         falls es später erneut anklopft. */
      gemeldet.delete(String(id || ''));
      return { ok: true };
    }
    return { ok: false, meldung: api.meldung(antwort, 'Das hat nicht geklappt.') };
  } catch {
    return { ok: false, meldung: 'Der Server ist nicht erreichbar.' };
  }
}

/* ---------- Wache ---------- */

async function schauNach(melde) {
  const ergebnis = await liste();
  if (!ergebnis.ok) {
    return;
  }
  const wartende = ergebnis.geraete.filter((g) => g.status === 'wartet' && !gemeldet.has(g.id));
  for (const wartend of wartende) {
    gemeldet.add(wartend.id);
    melde(wartend);
  }
}

function starteWache(melde) {
  stoppeWache();
  if (!ausweis()) {
    return;
  }
  schauNach(melde);
  wache = setInterval(() => schauNach(melde), WACHINTERVALL_MS);
}

function stoppeWache() {
  if (wache) {
    clearInterval(wache);
    wache = null;
  }
}

/* Nach dem Sperren soll ein wartendes Gerät beim nächsten Anmelden wieder
   auffallen. */
function vergissMeldungen() {
  gemeldet = new Set();
}

module.exports = { liste, entscheiden, starteWache, stoppeWache, vergissMeldungen };
