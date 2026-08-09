/* Brücke zwischen Oberfläche und Hauptprozess.

   Der Renderer kann nichts von sich aus — er darf nur diese Aufrufe stellen,
   und jeder prüft seine Eingaben selbst. */

'use strict';

const { app, ipcMain, nativeTheme } = require('electron');
const dashboard = require('./dashboard');
const geraete = require('./geraete');
const konfiguration = require('./konfiguration');
const lizenz = require('./lizenz');
const sitzung = require('./sitzung');
const system = require('./system');
const tresor = require('./tresor');

/* Bereich 'kunden' ist vorbereitet, aber es gibt noch kein Kundendashboard. */
const BEREICHE = Object.freeze([
  {
    schluessel: 'masesites',
    titel: 'masesites',
    text: 'Kunden, Projekte, Tickets, Mitarbeiter, KI-Chats und Protokoll.',
    zeichen: 'marke',        /* die Bildmarke selbst */
    aktiv: true,
  },
  {
    schluessel: 'kunden',
    titel: 'Kunden',
    text: 'Eigener Bereich pro Kunde. Kommt, sobald das Kundendashboard steht.',
    zeichen: 'personen',
    aktiv: false,
  },
]);

/* Reiter innerhalb von masesites. Mehr als diese Bereiche gibt es in der App
   nicht — die übrige Website (Startseite, Impressum) gehört in den Browser,
   siehe ERLAUBTE_PFADE in dashboard.js. Das Akquise-Tool ist vorbereitet und
   wird eingehängt, sobald es vorliegt. */
const TABS = Object.freeze([
  { schluessel: 'admin', titel: 'Admin Dashboard', pfad: '/admin', aktiv: true },
  { schluessel: 'mcs', titel: 'Mitarbeiter-Portal', pfad: '/mcs', aktiv: true },
  { schluessel: 'akquise', titel: 'Akquise-Tool', pfad: null, aktiv: false },
]);

function registriere(fensterHolen) {
  /* Ein wartendes Gerät melden, solange die App läuft. */
  const wacheStarten = () => {
    geraete.starteWache((wartend) => {
      const fenster = fensterHolen();
      if (fenster && !fenster.isDestroyed()) {
        fenster.webContents.send('geraete:wartet', wartend);
      }
    });
  };

  /* ---------- Start ---------- */

  ipcMain.handle('app:start', async () => {
    const zustandLizenz = await lizenz.pruefeStill();

    let anmeldung = { erreichbar: false, angemeldet: false };
    if (lizenz.darfWeiter(zustandLizenz.status)) {
      anmeldung = await sitzung.istAngemeldet();
      /* Noch keine Sitzung? Dann still mit dem Geräte-Token versuchen —
         das ist der Grund, warum man das Passwort nur einmal braucht. */
      if (!anmeldung.angemeldet && sitzung.hatToken()) {
        const still = await sitzung.stilleAnmeldung();
        if (still.ok) {
          anmeldung = { erreichbar: true, angemeldet: true, still: true };
        }
      }
    }
    if (anmeldung.angemeldet) {
      wacheStarten();
    }

    return {
      konfig: konfiguration.lade(),
      bereiche: BEREICHE,
      tabs: TABS,
      tresorBereit: tresor.verfuegbar(),
      tokenVorhanden: sitzung.hatToken(),
      dunkelSystem: nativeTheme.shouldUseDarkColors,
      chrom: { titelzeile: dashboard.TITELZEILE, leiste: dashboard.BEREICHSLEISTE },
      infos: system.infos(),
      lizenz: zustandLizenz,
      anmeldung,
    };
  });

  /* ---------- Lizenz ---------- */

  ipcMain.handle('lizenz:registrieren', (ereignis, code) => {
    return lizenz.registriere(typeof code === 'string' ? code : '');
  });
  ipcMain.handle('lizenz:pruefen', () => lizenz.pruefeStill());
  ipcMain.handle('lizenz:pflicht', () => lizenz.pflichtStand());
  ipcMain.handle('lizenz:pflichtSetzen', (ereignis, an) => lizenz.pflichtSetzen(an === true));
  ipcMain.handle('lizenz:loesen', () => {
    dashboard.schliesse(fensterHolen());
    return lizenz.loese();
  });

  /* ---------- Anmeldung ---------- */

  ipcMain.handle('konto:anmelden', async (ereignis, passwort) => {
    const ergebnis = await sitzung.anmelden(typeof passwort === 'string' ? passwort : '');
    if (ergebnis.ok) {
      geraete.vergissMeldungen();
      wacheStarten();
    }
    return { ...ergebnis, tokenVorhanden: sitzung.hatToken() };
  });
  ipcMain.handle('konto:status', () => sitzung.istAngemeldet());

  /* Schloss und Abmelden sind dasselbe: Sitzung und Geräte-Token weg. */
  ipcMain.handle('konto:sperren', async () => {
    geraete.stoppeWache();
    geraete.vergissMeldungen();
    dashboard.schliesse(fensterHolen());
    return sitzung.sperren();
  });
  ipcMain.handle('konto:abmelden', async () => {
    geraete.stoppeWache();
    geraete.vergissMeldungen();
    dashboard.schliesse(fensterHolen());
    return sitzung.abmelden();
  });

  /* ---------- Geräte ---------- */

  ipcMain.handle('geraete:liste', () => geraete.liste());
  ipcMain.handle('geraete:entscheiden', (ereignis, id, erlauben) => {
    return geraete.entscheiden(String(id || ''), erlauben === true);
  });

  /* ---------- Bereiche ---------- */

  ipcMain.handle('bereich:oeffnen', async (ereignis, schluessel) => {
    const bereich = BEREICHE.find((b) => b.schluessel === schluessel);
    if (!bereich || !bereich.aktiv) {
      return { ok: false, meldung: 'Dieser Bereich ist noch nicht verfügbar.' };
    }
    const zustandLizenz = await lizenz.pruefeStill();
    if (!lizenz.darfWeiter(zustandLizenz.status)) {
      return { ok: false, meldung: zustandLizenz.meldung || 'Die Lizenz ist nicht gültig.', lizenz: zustandLizenz };
    }
    dashboard.oeffne(fensterHolen());
    dashboard.setzeZoom(konfiguration.lade().zoom);
    return { ok: true, bereich: bereich.schluessel, tabs: TABS };
  });

  /* Reiter innerhalb von masesites. Was es noch nicht gibt, blendet die
     eingebettete Ansicht aus und zeigt den Platzhalter der Oberfläche. */
  ipcMain.handle('bereich:tab', async (ereignis, schluessel) => {
    const tab = TABS.find((t) => t.schluessel === schluessel);
    if (!tab) {
      return { ok: false, meldung: 'Unbekannter Reiter.' };
    }
    if (!tab.aktiv || !tab.pfad) {
      await dashboard.setzeSichtbar(false);
      return { ok: true, tab: tab.schluessel, platzhalter: true, titel: tab.titel };
    }
    dashboard.oeffne(fensterHolen());
    dashboard.zeigePfad(tab.pfad);
    await dashboard.setzeSichtbar(true);
    return { ok: true, tab: tab.schluessel, platzhalter: false, titel: tab.titel };
  });

  ipcMain.handle('bereich:schliessen', () => {
    dashboard.schliesse(fensterHolen());
    return { ok: true };
  });
  ipcMain.handle('bereich:neuladen', () => {
    dashboard.neuLaden();
    return { ok: true };
  });
  ipcMain.handle('bereich:sichtbar', async (ereignis, sichtbar) => {
    const bild = await dashboard.setzeSichtbar(sichtbar !== false);
    return { ok: true, bild };
  });

  /* ---------- Einstellungen ---------- */

  ipcMain.handle('konfig:lesen', () => konfiguration.lade());

  ipcMain.handle('konfig:setzen', async (ereignis, teil) => {
    const eingabe = teil && typeof teil === 'object' ? teil : {};
    if (eingabe.serverAdresse !== undefined && !konfiguration.istBrauchbareAdresse(String(eingabe.serverAdresse))) {
      return { ok: false, meldung: 'Diese Adresse ist nicht gültig. Beispiel: https://masesites.ch' };
    }
    const vorher = konfiguration.lade();
    const nachher = konfiguration.setze(eingabe);

    if (nachher.serverAdresse !== vorher.serverAdresse) {
      dashboard.schliesse(fensterHolen());
      await sitzung.leereCookies();
    }
    if (nachher.zoom !== vorher.zoom) {
      dashboard.setzeZoom(nachher.zoom);
    }
    if (nachher.autostart !== vorher.autostart) {
      system.setzeAutostart(nachher.autostart);
    }
    if (nachher.erscheinung !== vorher.erscheinung) {
      nativeTheme.themeSource = nachher.erscheinung === 'hell' ? 'light'
        : nachher.erscheinung === 'dunkel' ? 'dark' : 'system';
      /* Der eingebettete Adminbereich zieht mit. */
      dashboard.setzeThema(dashboard.themaAusEinstellung());
    }
    return {
      ok: true,
      konfig: nachher,
      serverGewechselt: nachher.serverAdresse !== vorher.serverAdresse,
    };
  });

  /* ---------- System ---------- */

  ipcMain.handle('system:servertest', () => system.serverTest());
  ipcMain.handle('system:infos', () => system.infos());
  ipcMain.handle('system:datenordner', () => {
    system.oeffneDatenordner();
    return { ok: true };
  });

  /* ---------- Fenster ---------- */

  ipcMain.handle('fenster:befehl', (ereignis, befehl) => {
    const fenster = fensterHolen();
    if (!fenster || fenster.isDestroyed()) {
      return { ok: false };
    }
    if (befehl === 'minimieren') {
      fenster.minimize();
    } else if (befehl === 'umschalten') {
      if (fenster.isMaximized()) {
        fenster.unmaximize();
      } else {
        fenster.maximize();
      }
    } else if (befehl === 'schliessen') {
      fenster.close();
    } else if (befehl === 'vollbild') {
      fenster.setFullScreen(!fenster.isFullScreen());
    } else {
      return { ok: false };
    }
    return { ok: true, maximiert: fenster.isMaximized() };
  });

  ipcMain.handle('app:beenden', () => {
    app.quit();
    return { ok: true };
  });
}

module.exports = { BEREICHE, registriere };
