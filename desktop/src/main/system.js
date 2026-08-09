/* Kleine Systemdienste für die Einstellungen: Servertest, Autostart,
   Ordner öffnen, Eckdaten für den Info-Bereich. */

'use strict';

const { app, shell } = require('electron');
const os = require('node:os');
const api = require('./api');
const geraet = require('./geraet');
const konfiguration = require('./konfiguration');

/* /api/status antwortet auch dann, wenn Datenbank oder Schlüssel fehlen —
   ideal als Erreichbarkeitstest. */
async function serverTest() {
  const start = Date.now();
  try {
    const antwort = await api.anfrage('/api/status', 'GET');
    const dauer = Date.now() - start;
    if (antwort.status === 200) {
      return {
        ok: true,
        dauer,
        adresse: konfiguration.serverUrsprung(),
        details: kurzeDetails(antwort.json),
      };
    }
    return {
      ok: false,
      dauer,
      adresse: konfiguration.serverUrsprung(),
      meldung: 'Der Server hat mit Code ' + antwort.status + ' geantwortet.',
    };
  } catch (fehler) {
    return {
      ok: false,
      dauer: Date.now() - start,
      adresse: konfiguration.serverUrsprung(),
      meldung: 'Keine Verbindung: ' + fehler.message,
    };
  }
}

/* Nur ein paar unkritische Felder weiterreichen, nicht die ganze Diagnose. */
function kurzeDetails(json) {
  if (!json || typeof json !== 'object') {
    return null;
  }
  const erlaubt = ['ok', 'php', 'version', 'db', 'schluessel', 'zeit'];
  const gefiltert = {};
  for (const schluessel of erlaubt) {
    if (json[schluessel] !== undefined && typeof json[schluessel] !== 'object') {
      gefiltert[schluessel] = String(json[schluessel]).slice(0, 80);
    }
  }
  return Object.keys(gefiltert).length ? gefiltert : null;
}

function setzeAutostart(an) {
  const gewuenscht = an === true;
  try {
    app.setLoginItemSettings({
      openAtLogin: gewuenscht,
      args: ['--versteckt-starten'],
    });
    return { ok: true, an: app.getLoginItemSettings().openAtLogin };
  } catch (fehler) {
    return { ok: false, an: false, meldung: fehler.message };
  }
}

function autostartAktiv() {
  try {
    return app.getLoginItemSettings().openAtLogin === true;
  } catch {
    return false;
  }
}

function oeffneDatenordner() {
  shell.openPath(app.getPath('userData'));
}

function infos() {
  return {
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    plattform: os.platform() + ' ' + os.release(),
    geraet: geraet.kurzform(),
    geraetName: geraet.name(),
    datenordner: app.getPath('userData'),
    server: konfiguration.serverUrsprung(),
  };
}

module.exports = { serverTest, setzeAutostart, autostartAktiv, oeffneDatenordner, infos };
