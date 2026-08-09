/* Einstellungen der Desktop-App: Serveradresse und Lizenz-Modus.
   Liegt als kleine JSON-Datei im Benutzerprofil (nicht im Programmordner),
   damit ein Update der App die Einstellungen nicht überschreibt.
   Hier stehen bewusst KEINE Geheimnisse — die Lizenz liegt verschlüsselt
   im Tresor (tresor.js), das Passwort wird nie gespeichert. */

'use strict';

const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DATEINAME = 'konfiguration.json';
const LIZENZ_MODI = ['simuliert', 'server'];
const ERSCHEINUNGEN = ['system', 'hell', 'dunkel'];
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 1.4;

const STANDARD = Object.freeze({
  /* Adresse deiner Website. Für lokale Tests z. B. http://127.0.0.1:8091 */
  serverAdresse: 'https://masesites.ch',
  /* 'simuliert' = Phase 2 (Server kennt noch keine Lizenzen),
     'server'    = Phase 1 ist scharf geschaltet. */
  lizenzModus: 'simuliert',
  erscheinung: 'system',
  zoom: 1,
  autostart: false,
  bewegung: true,          /* Animationen; aus für ruhigere Darstellung */
  startAnimation: true,
});

let zwischenspeicher = null;

function datei() {
  return path.join(app.getPath('userData'), DATEINAME);
}

/* Nie ungeprüft übernehmen, was in der Datei steht. */
function saeubere(roh) {
  const sauber = {};
  if (typeof roh.serverAdresse === 'string' && istBrauchbareAdresse(roh.serverAdresse)) {
    sauber.serverAdresse = normalisiereAdresse(roh.serverAdresse);
  }
  if (LIZENZ_MODI.includes(roh.lizenzModus)) {
    sauber.lizenzModus = roh.lizenzModus;
  }
  if (ERSCHEINUNGEN.includes(roh.erscheinung)) {
    sauber.erscheinung = roh.erscheinung;
  }
  if (Number.isFinite(roh.zoom)) {
    sauber.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(roh.zoom)));
  }
  for (const schalter of ['autostart', 'bewegung', 'startAnimation']) {
    if (typeof roh[schalter] === 'boolean') {
      sauber[schalter] = roh[schalter];
    }
  }
  return sauber;
}

function istBrauchbareAdresse(text) {
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalisiereAdresse(text) {
  return new URL(text).origin;
}

function lade() {
  if (zwischenspeicher) {
    return zwischenspeicher;
  }
  let roh = {};
  try {
    roh = JSON.parse(fs.readFileSync(datei(), 'utf8'));
  } catch {
    roh = {};   /* erste Nutzung oder beschädigte Datei: Standard nehmen */
  }
  zwischenspeicher = Object.freeze({ ...STANDARD, ...saeubere(roh || {}) });
  return zwischenspeicher;
}

/* Gibt die NEUE Konfiguration zurück, statt die alte zu verändern. */
function setze(teil) {
  const neu = Object.freeze({ ...lade(), ...saeubere(teil || {}) });
  try {
    fs.writeFileSync(datei(), JSON.stringify(neu, null, 2), 'utf8');
  } catch (fehler) {
    console.error('masesites: Einstellungen konnten nicht gespeichert werden:', fehler.message);
  }
  zwischenspeicher = neu;
  return neu;
}

function serverUrsprung() {
  return lade().serverAdresse;
}

/* Alles ausserhalb der eigenen Website gilt als fremd und wird im
   Systembrowser geöffnet statt in der App. */
function istEigenerUrsprung(adresse) {
  try {
    return new URL(adresse).origin === serverUrsprung();
  } catch {
    return false;
  }
}

module.exports = {
  STANDARD,
  LIZENZ_MODI,
  ERSCHEINUNGEN,
  ZOOM_MIN,
  ZOOM_MAX,
  lade,
  setze,
  serverUrsprung,
  istEigenerUrsprung,
  istBrauchbareAdresse,
};
