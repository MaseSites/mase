/* MaseSites Admin — Einstiegspunkt des Hauptprozesses.

   Ablauf: Lizenz → Anmeldung → Bereichsauswahl → Admin-Bereich.
   Die ersten drei Bildschirme sind lokale Seiten dieser App, der vierte ist
   dein /admin, eingebettet in einer abgeschotteten Ansicht.

   Grundregeln für die Sicherheit — sie gelten für JEDEN Renderer:
   - kein Node, contextIsolation an, Sandbox an
   - alles ausser der eigenen Website wird nicht in der App geöffnet
   - keine Web-Berechtigungen, keine neuen Fenster
   - Zertifikatsfehler führen zum Abbruch (Electron-Standard, hier nur
     protokolliert, damit man ihn im Log sieht) */

'use strict';

const { app, BrowserWindow, Menu, nativeTheme, session, shell } = require('electron');
const path = require('node:path');

const api = require('./api');
const dashboard = require('./dashboard');
const fensterZustand = require('./fenster-zustand');
const ipc = require('./ipc');
const konfiguration = require('./konfiguration');
const system = require('./system');

const OBERFLAECHE = path.join(__dirname, '..', 'renderer', 'index.html');
const VORLADER = path.join(__dirname, '..', 'preload', 'preload.js');
const ENTWICKLUNG = process.env.MASE_DEV === '1';

let hauptfenster = null;

function fensterHolen() {
  return hauptfenster;
}

/* ---------- Fenster ---------- */

function erstelleFenster() {
  const gemerkt = fensterZustand.lade();

  hauptfenster = new BrowserWindow({
    width: gemerkt.breite,
    height: gemerkt.hoehe,
    x: gemerkt.x === null ? undefined : gemerkt.x,
    y: gemerkt.y === null ? undefined : gemerkt.y,
    minWidth: 980,
    minHeight: 660,
    show: false,
    frame: false,                 /* eigene Titelzeile, siehe Renderer */
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#15110D' : '#F6F1E7',
    title: 'MaseSites Admin',
    webPreferences: {
      preload: VORLADER,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false,
      devTools: ENTWICKLUNG,
    },
  });

  hauptfenster.loadFile(OBERFLAECHE);

  hauptfenster.once('ready-to-show', () => {
    if (gemerkt.maximiert) {
      hauptfenster.maximize();
    }
    if (!process.argv.includes('--versteckt-starten')) {
      hauptfenster.show();
    }
  });

  for (const ereignis of ['resize', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) {
    hauptfenster.on(ereignis, () => {
      dashboard.lageAnpassen(hauptfenster);
      melde('fenster:zustand', {
        maximiert: hauptfenster.isMaximized(),
        vollbild: hauptfenster.isFullScreen(),
      });
    });
  }

  hauptfenster.on('closed', () => {
    hauptfenster = null;
  });

  fensterZustand.beobachte(hauptfenster);
}

function melde(kanal, nutzlast) {
  if (hauptfenster && !hauptfenster.isDestroyed()) {
    hauptfenster.webContents.send(kanal, nutzlast);
  }
}

/* ---------- Absicherung ---------- */

function sichereRendererAb() {
  app.on('web-contents-created', (ereignis, inhalte) => {
    inhalte.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
    inhalte.on('will-navigate', (navigation, url) => {
      const eigeneSeite = url.startsWith('file://');
      if (!eigeneSeite && !konfiguration.istEigenerUrsprung(url)) {
        navigation.preventDefault();
        if (/^https?:\/\//i.test(url)) {
          shell.openExternal(url);
        }
      }
    });
    inhalte.on('will-attach-webview', (navigation) => navigation.preventDefault());
  });

  /* Weder die App noch der eingebettete Admin-Bereich brauchen Kamera,
     Mikrofon, Ort oder Mitteilungen. */
  const verweigere = (anfrage, erlaube) => erlaube(false);
  session.defaultSession.setPermissionRequestHandler(verweigere);
  api.sitzungHolen().setPermissionRequestHandler(verweigere);
  session.defaultSession.setPermissionCheckHandler(() => false);
  api.sitzungHolen().setPermissionCheckHandler(() => false);

  app.on('certificate-error', (ereignis, inhalte, url, fehler) => {
    /* Kein preventDefault: Electron lehnt ab. Nur sichtbar machen. */
    console.error('masesites: Zertifikatsfehler bei ' + url + ': ' + fehler);
  });
}

/* ---------- Start ---------- */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (hauptfenster) {
      if (hauptfenster.isMinimized()) {
        hauptfenster.restore();
      }
      hauptfenster.show();
      hauptfenster.focus();
    }
  });

  app.whenReady().then(() => {
    const konfig = konfiguration.lade();
    nativeTheme.themeSource = konfig.erscheinung === 'hell' ? 'light'
      : konfig.erscheinung === 'dunkel' ? 'dark' : 'system';
    if (system.autostartAktiv() !== konfig.autostart) {
      system.setzeAutostart(konfig.autostart);
    }

    Menu.setApplicationMenu(null);
    sichereRendererAb();
    ipc.registriere(fensterHolen);
    erstelleFenster();

    nativeTheme.on('updated', () => {
      melde('system:erscheinung', { dunkel: nativeTheme.shouldUseDarkColors });
      if (konfiguration.lade().erscheinung === 'system') {
        dashboard.setzeThema(nativeTheme.shouldUseDarkColors);
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        erstelleFenster();
      }
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
