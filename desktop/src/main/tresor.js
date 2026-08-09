/* Tresor für den Lizenznachweis.

   Verschlüsselt über Electrons safeStorage. Unter Windows ist das die DPAPI:
   Der Schlüssel hängt am Windows-Anmeldekonto — eine kopierte Datei ist auf
   einem anderen Rechner oder unter einem anderen Benutzer wertlos.

   Steht keine Verschlüsselung zur Verfügung, wird bewusst NICHTS gespeichert.
   Dann fragt die App bei jedem Start nach dem Lizenzcode, statt ihn im
   Klartext abzulegen. */

'use strict';

const { app, safeStorage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DATEINAME = 'lizenz.dat';

function datei() {
  return path.join(app.getPath('userData'), DATEINAME);
}

function verfuegbar() {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function lese() {
  if (!verfuegbar()) {
    return null;
  }
  try {
    const roh = fs.readFileSync(datei());
    const text = safeStorage.decryptString(roh);
    const objekt = JSON.parse(text);
    return objekt && typeof objekt === 'object' ? objekt : null;
  } catch {
    /* nicht vorhanden, beschädigt oder von einem anderen Windows-Konto */
    return null;
  }
}

function schreibe(objekt) {
  if (!verfuegbar()) {
    return false;
  }
  try {
    const roh = safeStorage.encryptString(JSON.stringify(objekt));
    fs.writeFileSync(datei(), roh, { mode: 0o600 });
    return true;
  } catch (fehler) {
    console.error('masesites: Lizenz nicht speicherbar:', fehler.message);
    return false;
  }
}

function loesche() {
  try {
    fs.rmSync(datei(), { force: true });
  } catch (fehler) {
    console.error('masesites: Lizenz nicht löschbar:', fehler.message);
  }
}

module.exports = { verfuegbar, lese, schreibe, loesche };
