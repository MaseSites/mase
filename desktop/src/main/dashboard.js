/* Bildschirm 4: der Admin-Bereich von masesites.ch, gekapselt in einer
   eigenen Ansicht unterhalb der schmalen App-Leiste.

   Absicherung der eingebetteten Seite:
   - kein Node im Renderer, contextIsolation an, Sandbox an
   - eigene Sitzungs-Partition (dieselbe wie api.js — das Anmelde-Cookie
     liegt schon darin, /admin ist deshalb sofort angemeldet)
   - Navigation ausserhalb der eigenen Website wird geblockt und im
     Systembrowser geöffnet
   - keine neuen Fenster, keine Berechtigungen (Kamera, Ort, Mitteilungen) */

'use strict';

const { WebContentsView, nativeTheme, shell } = require('electron');
const adminThema = require('./admin-thema');
const api = require('./api');
const konfiguration = require('./konfiguration');

/* Höhe der eigenen Fensterleiste (Titelzeile + Bereichsleiste). Muss zur
   Angabe in der Oberfläche passen — dort steht dieselbe Zahl als
   CSS-Variable --chrom-hoehe. */
const TITELZEILE = 40;
const BEREICHSLEISTE = 48;
const LEISTE_HOEHE = TITELZEILE + BEREICHSLEISTE;
const PFAD = '/admin';

/* In der App gibt es nur die Arbeitsbereiche. Startseite, Impressum und die
   übrige Website gehören nicht hinein — sonst navigiert man sich versehentlich
   aus dem Programm heraus. Solche Verweise öffnet der Systembrowser. */
const ERLAUBTE_PFADE = ['/admin', '/mcs'];

let ansicht = null;
let zoomStufe = 1;
let themaSchluessel = null;
let dunkelJetzt = false;

function offen() {
  return ansicht !== null;
}

function externOeffnen(adresse) {
  if (/^https?:\/\//i.test(adresse)) {
    shell.openExternal(adresse);
  }
}

/* Nur die Arbeitsbereiche dürfen im Fenster laden. */
function pfadErlaubt(adresse) {
  if (!konfiguration.istEigenerUrsprung(adresse)) {
    return false;
  }
  try {
    const pfad = new URL(adresse).pathname.replace(/\/+$/, '') || '/';
    return ERLAUBTE_PFADE.some((erlaubt) => pfad === erlaubt || pfad.startsWith(erlaubt + '/'));
  } catch {
    return false;
  }
}

function sichereAb(inhalte, fenster) {
  inhalte.setWindowOpenHandler(({ url }) => {
    externOeffnen(url);
    return { action: 'deny' };
  });
  inhalte.on('will-navigate', (ereignis, url) => {
    if (pfadErlaubt(url)) {
      return;
    }
    ereignis.preventDefault();
    externOeffnen(url);
    if (fenster && !fenster.isDestroyed()) {
      fenster.webContents.send('bereich:abgewiesen', { adresse: url });
    }
  });
}

function oeffne(fenster) {
  if (ansicht) {
    return ansicht;
  }
  ansicht = new WebContentsView({
    webPreferences: {
      partition: api.PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false,
    },
  });

  const inhalte = ansicht.webContents;
  sichereAb(inhalte, fenster);

  inhalte.on('dom-ready', () => {
    themaSchluessel = null;   /* nach dem Laden ist das alte Blatt weg */
    setzeThema(dunkelJetzt);
    inhalte.setZoomFactor(zoomStufe);
  });
  inhalte.on('did-finish-load', () => {
    fenster.webContents.send('bereich:geladen', { adresse: inhalte.getURL() });
  });
  inhalte.on('did-fail-load', (ereignis, code, beschreibung, url, hauptrahmen) => {
    if (!hauptrahmen || code === -3) {
      return;   /* -3 = abgebrochen, passiert bei jedem Weiterklicken */
    }
    fenster.webContents.send('bereich:fehler', {
      meldung: 'Der Admin-Bereich konnte nicht geladen werden (' + beschreibung + ').',
    });
  });

  dunkelJetzt = themaAusEinstellung();
  fenster.contentView.addChildView(ansicht);
  lageAnpassen(fenster);
  inhalte.loadURL(konfiguration.serverUrsprung() + PFAD);
  return ansicht;
}

function lageAnpassen(fenster) {
  if (!ansicht || !fenster || fenster.isDestroyed()) {
    return;
  }
  const [breite, hoehe] = fenster.getContentSize();
  ansicht.setBounds({
    x: 0,
    y: LEISTE_HOEHE,
    width: breite,
    height: Math.max(0, hoehe - LEISTE_HOEHE),
  });
}

function schliesse(fenster) {
  if (!ansicht) {
    return;
  }
  const alt = ansicht;
  ansicht = null;
  try {
    if (fenster && !fenster.isDestroyed()) {
      fenster.contentView.removeChildView(alt);
    }
    alt.webContents.close();
  } catch (fehler) {
    console.error('masesites: Ansicht nicht schliessbar:', fehler.message);
  }
}

function neuLaden() {
  if (ansicht) {
    ansicht.webContents.reload();
  }
}

/* Wechsel zwischen den Arbeitsbereichen (Adminbereich, Mitarbeiter-Portal). */
function zeigePfad(pfad) {
  if (!ansicht || typeof pfad !== 'string') {
    return false;
  }
  const ziel = konfiguration.serverUrsprung() + pfad;
  if (!pfadErlaubt(ziel)) {
    return false;
  }
  if (ansicht.webContents.getURL().split('#')[0] === ziel) {
    return true;   /* schon dort */
  }
  ansicht.webContents.loadURL(ziel);
  return true;
}

/* Welcher Arbeitsbereich ist gerade geladen? */
function aktuellerPfad() {
  if (!ansicht) {
    return null;
  }
  try {
    return new URL(ansicht.webContents.getURL()).pathname;
  } catch {
    return null;
  }
}

/* Farbwelt der eingebetteten Seite an die App angleichen. Wird beim Laden
   und bei jedem Wechsel der Erscheinung neu gesetzt. */
async function setzeThema(dunkel) {
  dunkelJetzt = dunkel === true;
  if (!ansicht) {
    return;
  }
  const inhalte = ansicht.webContents;
  try {
    if (themaSchluessel) {
      await inhalte.removeInsertedCSS(themaSchluessel);
      themaSchluessel = null;
    }
    themaSchluessel = await inhalte.insertCSS(adminThema.css(dunkelJetzt));
  } catch (fehler) {
    console.error('masesites: Thema nicht setzbar:', fehler.message);
  }
}

function themaAusEinstellung() {
  const erscheinung = konfiguration.lade().erscheinung;
  if (erscheinung === 'dunkel') {
    return true;
  }
  if (erscheinung === 'hell') {
    return false;
  }
  return nativeTheme.shouldUseDarkColors;
}

function setzeZoom(stufe) {
  zoomStufe = Math.min(1.4, Math.max(0.8, Number(stufe) || 1));
  if (ansicht) {
    ansicht.webContents.setZoomFactor(zoomStufe);
  }
  return zoomStufe;
}

/* Beim Öffnen von Überlagerungen (Einstellungen) darf die eingebettete
   Seite nicht darüber liegen — sie ist eine echte Ansicht, kein DOM und
   liegt immer über der Oberfläche. Damit die Fläche dahinter nicht leer
   wirkt, geben wir vor dem Ausblenden ein Standbild zurück. */
async function setzeSichtbar(sichtbar) {
  if (!ansicht) {
    return null;
  }
  if (sichtbar !== false) {
    ansicht.setVisible(true);
    return null;
  }
  let bild = null;
  try {
    const aufnahme = await ansicht.webContents.capturePage();
    if (!aufnahme.isEmpty()) {
      bild = aufnahme.toDataURL();
    }
  } catch (fehler) {
    console.error('masesites: Standbild fehlgeschlagen:', fehler.message);
  }
  ansicht.setVisible(false);
  return bild;
}

module.exports = {
  TITELZEILE,
  BEREICHSLEISTE,
  LEISTE_HOEHE,
  offen,
  oeffne,
  schliesse,
  lageAnpassen,
  neuLaden,
  setzeZoom,
  setzeSichtbar,
  setzeThema,
  themaAusEinstellung,
  zeigePfad,
  aktuellerPfad,
  pfadErlaubt,
  ERLAUBTE_PFADE,
};
