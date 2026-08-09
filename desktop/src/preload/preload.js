/* Die einzige Verbindung zwischen Oberfläche und Hauptprozess.

   Der Renderer bekommt genau diese Funktionen und sonst nichts: kein require,
   kein Dateisystem, kein Netzwerkzugriff auf eigene Faust. */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const EREIGNISSE = [
  'bereich:abgewiesen',
  'bereich:fehler',
  'bereich:geladen',
  'fenster:zustand',
  'geraete:wartet',
  'system:erscheinung',
];

function abonniere(kanal, rueckruf) {
  if (!EREIGNISSE.includes(kanal) || typeof rueckruf !== 'function') {
    return () => {};
  }
  const hoerer = (ereignis, nutzlast) => rueckruf(nutzlast);
  ipcRenderer.on(kanal, hoerer);
  return () => ipcRenderer.removeListener(kanal, hoerer);
}

contextBridge.exposeInMainWorld('mase', {
  start: () => ipcRenderer.invoke('app:start'),

  lizenz: {
    registrieren: (code) => ipcRenderer.invoke('lizenz:registrieren', String(code || '')),
    pruefen: () => ipcRenderer.invoke('lizenz:pruefen'),
    loesen: () => ipcRenderer.invoke('lizenz:loesen'),
    pflicht: () => ipcRenderer.invoke('lizenz:pflicht'),
    pflichtSetzen: (an) => ipcRenderer.invoke('lizenz:pflichtSetzen', an === true),
  },

  konto: {
    anmelden: (passwort) => ipcRenderer.invoke('konto:anmelden', String(passwort || '')),
    status: () => ipcRenderer.invoke('konto:status'),
    sperren: () => ipcRenderer.invoke('konto:sperren'),
    abmelden: () => ipcRenderer.invoke('konto:abmelden'),
  },

  geraete: {
    liste: () => ipcRenderer.invoke('geraete:liste'),
    entscheiden: (id, erlauben) => ipcRenderer.invoke('geraete:entscheiden', String(id || ''), erlauben === true),
  },

  bereich: {
    oeffnen: (schluessel) => ipcRenderer.invoke('bereich:oeffnen', String(schluessel || '')),
    tab: (schluessel) => ipcRenderer.invoke('bereich:tab', String(schluessel || '')),
    schliessen: () => ipcRenderer.invoke('bereich:schliessen'),
    neuladen: () => ipcRenderer.invoke('bereich:neuladen'),
    sichtbar: (an) => ipcRenderer.invoke('bereich:sichtbar', an !== false),
  },

  konfig: {
    lesen: () => ipcRenderer.invoke('konfig:lesen'),
    setzen: (teil) => ipcRenderer.invoke('konfig:setzen', teil || {}),
  },

  system: {
    servertest: () => ipcRenderer.invoke('system:servertest'),
    infos: () => ipcRenderer.invoke('system:infos'),
    datenordner: () => ipcRenderer.invoke('system:datenordner'),
  },

  fenster: {
    minimieren: () => ipcRenderer.invoke('fenster:befehl', 'minimieren'),
    umschalten: () => ipcRenderer.invoke('fenster:befehl', 'umschalten'),
    schliessen: () => ipcRenderer.invoke('fenster:befehl', 'schliessen'),
    vollbild: () => ipcRenderer.invoke('fenster:befehl', 'vollbild'),
    beenden: () => ipcRenderer.invoke('app:beenden'),
  },

  auf: abonniere,
});
