/* Fenstergrösse, Position und Maximierung über Neustarts hinweg merken.
   Kleine Datei im Benutzerprofil, absichtlich getrennt von den echten
   Einstellungen — das hier ist Bequemlichkeit, keine Konfiguration. */

'use strict';

const { app, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DATEINAME = 'fenster.json';

const STANDARD = Object.freeze({
  breite: 1280,
  hoehe: 860,
  x: null,
  y: null,
  maximiert: false,
});

function datei() {
  return path.join(app.getPath('userData'), DATEINAME);
}

function zahlOderNull(wert) {
  return Number.isFinite(wert) ? Math.round(wert) : null;
}

/* Ein Fenster, dessen gemerkte Position auf einem inzwischen abgesteckten
   Bildschirm liegt, wäre unsichtbar. Deshalb prüfen wir die Lage. */
function istSichtbar(zustand) {
  if (zustand.x === null || zustand.y === null) {
    return false;
  }
  return screen.getAllDisplays().some((anzeige) => {
    const f = anzeige.workArea;
    return zustand.x >= f.x - 60
      && zustand.y >= f.y - 20
      && zustand.x + 200 <= f.x + f.width + 60
      && zustand.y + 100 <= f.y + f.height + 60;
  });
}

function lade() {
  let roh = {};
  try {
    roh = JSON.parse(fs.readFileSync(datei(), 'utf8'));
  } catch {
    roh = {};
  }
  const zustand = {
    breite: Math.max(980, zahlOderNull(roh.breite) || STANDARD.breite),
    hoehe: Math.max(660, zahlOderNull(roh.hoehe) || STANDARD.hoehe),
    x: zahlOderNull(roh.x),
    y: zahlOderNull(roh.y),
    maximiert: roh.maximiert === true,
  };
  if (!istSichtbar(zustand)) {
    zustand.x = null;
    zustand.y = null;
  }
  return Object.freeze(zustand);
}

function speichere(fenster) {
  if (!fenster || fenster.isDestroyed()) {
    return;
  }
  const maximiert = fenster.isMaximized();
  const lage = maximiert ? fenster.getNormalBounds() : fenster.getBounds();
  const zustand = {
    breite: lage.width,
    hoehe: lage.height,
    x: lage.x,
    y: lage.y,
    maximiert,
  };
  try {
    fs.writeFileSync(datei(), JSON.stringify(zustand, null, 2), 'utf8');
  } catch (fehler) {
    console.error('masesites: Fensterzustand nicht speicherbar:', fehler.message);
  }
}

/* Häufige Resize-Ereignisse zu einem Schreibvorgang bündeln. */
function beobachte(fenster) {
  let uhr = null;
  const merken = () => {
    clearTimeout(uhr);
    uhr = setTimeout(() => speichere(fenster), 500);
  };
  for (const ereignis of ['resize', 'move', 'maximize', 'unmaximize']) {
    fenster.on(ereignis, merken);
  }
  fenster.on('close', () => {
    clearTimeout(uhr);
    speichere(fenster);
  });
}

module.exports = { STANDARD, lade, speichere, beobachte };
