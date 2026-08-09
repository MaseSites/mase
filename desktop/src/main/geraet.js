/* Geräte-Fingerabdruck für die Lizenzbindung.

   Grundlage ist die MachineGuid von Windows — sie überlebt Umbenennungen
   des Rechners und Netzwerkwechsel, ändert sich aber bei einer Neuinstallation
   von Windows. Falls sie nicht lesbar ist, legen wir einmalig eine Zufalls-
   kennung im Benutzerprofil ab.

   An den Server geht NIE die Rohkennung, sondern nur ihr SHA-256-Hash. */

'use strict';

const { app } = require('electron');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SALZ = 'masesites-geraet-v1';
const ERSATZ_DATEI = 'geraet.json';

let zwischenspeicher = null;

function maschinenGuid() {
  const argumente = [
    ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid', '/reg:64'],
    ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
  ];
  for (const argv of argumente) {
    try {
      const ausgabe = execFileSync('reg', argv, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000,
      });
      const treffer = ausgabe.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]{10,})/);
      if (treffer) {
        return treffer[1].toLowerCase();
      }
    } catch {
      /* nächste Variante probieren */
    }
  }
  return null;
}

/* Nur wenn die Registry nichts hergibt (anderes Betriebssystem, gesperrte
   Registry): einmalig erzeugte Zufallskennung, danach stabil. */
function ersatzKennung() {
  const datei = path.join(app.getPath('userData'), ERSATZ_DATEI);
  try {
    const gelesen = JSON.parse(fs.readFileSync(datei, 'utf8'));
    if (typeof gelesen.kennung === 'string' && gelesen.kennung.length >= 32) {
      return gelesen.kennung;
    }
  } catch {
    /* noch nicht vorhanden */
  }
  const kennung = crypto.randomUUID() + crypto.randomBytes(8).toString('hex');
  try {
    fs.writeFileSync(datei, JSON.stringify({ kennung }, null, 2), 'utf8');
  } catch (fehler) {
    console.error('masesites: Gerätekennung nicht speicherbar:', fehler.message);
  }
  return kennung;
}

function fingerabdruck() {
  if (zwischenspeicher) {
    return zwischenspeicher;
  }
  const roh = (process.platform === 'win32' ? maschinenGuid() : null) || ersatzKennung();
  zwischenspeicher = crypto.createHash('sha256').update(SALZ + '|' + roh).digest('hex');
  return zwischenspeicher;
}

/* Kurzform für die Anzeige — der Nutzer soll sein Gerät wiedererkennen,
   ohne dass die volle Kennung auf dem Bildschirm steht. */
function kurzform() {
  return fingerabdruck().slice(0, 8).toUpperCase();
}

/* Rechnername, damit man auf dem anderen Gerät erkennt, wer da anklopft. */
function name() {
  try {
    return String(os.hostname() || '').slice(0, 60) || 'Windows-Rechner';
  } catch {
    return 'Windows-Rechner';
  }
}

module.exports = { fingerabdruck, kurzform, name };
