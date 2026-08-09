/* Ablaufsteuerung der Oberfläche.

   Stationen: Lizenz → (Warten auf Bestätigung) → Anmeldung → Bereichsauswahl
   → Bereich mit Reitern. Diese Datei entscheidet, welche gerade dran ist, und
   verbindet die Bildschirme mit dem Hauptprozess. Netzwerk und Dateien liegen
   dort — hier läuft nur Darstellung. */

(function () {
  'use strict';

  var A = window.MaseAnim;
  var U = window.MaseUi;

  var zustand = {
    station: null,
    konfig: null,
    lizenz: null,
    bereiche: [],
    tabs: [],
    tab: 'admin',
    infos: null,
    angemeldetSeit: null,
    tokenVorhanden: false,
  };
  var einstellungen = null;
  var codefeld = null;
  var uhrLauf = null;
  var warteLauf = null;
  var offeneFrage = null;

  function el(id) { return document.getElementById(id); }

  /* ---------- Stationen ---------- */

  var BILDSCHIRME = {
    lizenz: 'bs-lizenz',
    warten: 'bs-warten',
    login: 'bs-login',
    auswahl: 'bs-auswahl',
  };
  var REIHENFOLGE = ['lizenz', 'warten', 'login', 'auswahl', 'bereich'];
  /* Der Warteschirm gehört zur Lizenz, hat also keinen eigenen Punkt. */
  var SPUR = { lizenz: 'lizenz', warten: 'lizenz', login: 'login', auswahl: 'auswahl', bereich: 'bereich' };
  var SPUR_FOLGE = ['lizenz', 'login', 'auswahl', 'bereich'];

  function spurAktualisieren(station) {
    var index = SPUR_FOLGE.indexOf(SPUR[station] || station);
    document.querySelectorAll('.spur-punkt').forEach(function (punkt) {
      var eigener = SPUR_FOLGE.indexOf(punkt.dataset.spur);
      punkt.classList.toggle('jetzt', eigener === index);
      punkt.classList.toggle('erledigt', eigener < index);
    });
    document.body.classList.add('spur-an');
  }

  async function zeige(station) {
    if (zustand.station === station) {
      return;
    }
    var vorher = zustand.station;
    var richtung = REIHENFOLGE.indexOf(station) < REIHENFOLGE.indexOf(vorher) ? 'rueck' : 'vor';
    zustand.station = station;
    spurAktualisieren(station);
    stoppeWarten();

    var angemeldet = station === 'auswahl' || station === 'bereich';
    el('knopf-schloss').hidden = !angemeldet;

    if (vorher && BILDSCHIRME[vorher]) {
      await A.bildschirmAus(el(BILDSCHIRME[vorher]), richtung);
    }

    if (station === 'bereich') {
      document.body.classList.add('mit-leiste');
      el('buehne').hidden = true;
      el('bereichsleiste').hidden = false;
      A.spiele(el('bereichsleiste'), [
        { opacity: 0, transform: 'translateY(-12px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: A.d(460) });
      starteUhr();
      return;
    }

    document.body.classList.remove('mit-leiste');
    el('bereichsleiste').hidden = true;
    el('platzhalter').hidden = true;
    el('buehne').hidden = false;
    stoppeUhr();
    await A.bildschirmEin(el(BILDSCHIRME[station]));
    vorbereiten(station);
  }

  function vorbereiten(station) {
    if (station === 'lizenz') {
      codefeld.fokus();
    } else if (station === 'warten') {
      starteWarten();
    } else if (station === 'login') {
      el('lg-pw').focus();
      pruefeServer();
    } else if (station === 'auswahl') {
      zeigeSitzungstext();
    }
  }

  /* ---------- Startsequenz ---------- */

  var SCHRITTE = [
    { text: 'Gerät wird erkannt', bis: 22 },
    { text: 'Lizenz wird gelesen', bis: 52 },
    { text: 'Verbindung zum Server', bis: 84 },
    { text: 'Bereit', bis: 100 },
  ];

  async function startsequenz() {
    var zeile = el('start-zeile');
    var balken = el('start-fortschritt');

    for (var i = 0; i < SCHRITTE.length; i++) {
      zeile.textContent = SCHRITTE[i].text;
      balken.style.width = SCHRITTE[i].bis + '%';
      await A.warte(i === 0 ? 620 : 340);
    }
    await A.warte(220);

    await A.spiele(el('start').querySelector('.start-mitte'), [
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      { opacity: 0, transform: 'scale(1.08)', filter: 'blur(10px)' },
    ], { duration: A.d(420) });

    await A.spiele(el('start'), [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-100%)' },
    ], { duration: A.d(720), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });

    el('start').hidden = true;
    document.body.classList.remove('laedt');
  }

  /* ---------- Lizenz ---------- */

  function lizenzAnzeigen(lizenz) {
    zustand.lizenz = lizenz;
    el('lizenz-geraet').textContent = lizenz.geraet || '—';
    el('lizenz-modus').textContent = lizenz.modus === 'server' ? 'über Server' : 'simuliert';
    el('warten-kennung').textContent = 'Kennung ' + (lizenz.geraet || '—');
    if (einstellungen) {
      einstellungen.setzeKontext({ lizenz: lizenz });
      einstellungen.zeigeLizenz(lizenz);
    }
  }

  function baueLizenzbildschirm() {
    codefeld = window.MaseLizenzfeld.baue([el('lz-1'), el('lz-2'), el('lz-3')]);

    el('lizenz-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var knopf = el('lizenz-senden');
      U.fehler('lizenz-fehler', '');
      knopf.classList.add('laedt');

      var antwort = await window.mase.lizenz.registrieren(codefeld.code());
      knopf.classList.remove('laedt');

      if (antwort.wartet) {
        lizenzAnzeigen(antwort.status);
        await zeige('warten');
        return;
      }
      if (!antwort.ok) {
        U.fehler('lizenz-fehler', antwort.meldung);
        el('codefeld').classList.add('wackelt');
        setTimeout(function () { el('codefeld').classList.remove('wackelt'); }, 500);
        return;
      }
      lizenzAnzeigen(antwort.status);
      if (!antwort.dauerhaft) {
        U.meldung('Freigeschaltet — aber ohne verschlüsselten Speicher. Der Code wird beim nächsten Start erneut gebraucht.', 'schlecht', 6000);
      } else {
        U.meldung('Gerät freigeschaltet.', 'gut');
      }
      await weiterNachLizenz();
    });

    el('lizenz-hilfe').addEventListener('click', function () {
      U.meldung('Der Lizenzcode hat die Form MASE-XXXX-XXXX-XXXX und kommt von masesites.', '', 5200);
    });

    el('warten-zurueck').addEventListener('click', async function () {
      await window.mase.lizenz.loesen();
      codefeld.leeren();
      await zeige('lizenz');
    });

    el('lizenz-tresor').textContent = zustand.tresorBereit === false ? 'nicht möglich' : 'verschlüsselt';
    el('warten-name').textContent = (zustand.infos && zustand.infos.geraetName) || 'Dieses Gerät';
  }

  async function weiterNachLizenz() {
    var anmeldung = await window.mase.konto.status();
    await zeige(anmeldung.angemeldet ? 'auswahl' : 'login');
  }

  /* Solange das Gerät wartet, alle paar Sekunden nachfragen. */
  function starteWarten() {
    stoppeWarten();
    warteLauf = setInterval(async function () {
      var stand = await window.mase.lizenz.pruefen();
      lizenzAnzeigen(stand);
      if (stand.status === 'gueltig' || stand.status === 'kulanz') {
        stoppeWarten();
        U.meldung('Gerät bestätigt.', 'gut');
        await weiterNachLizenz();
      } else if (stand.status === 'fehlt' || stand.status === 'ungueltig') {
        stoppeWarten();
        await zeige('lizenz');
      }
    }, 5000);
  }
  function stoppeWarten() {
    if (warteLauf) {
      clearInterval(warteLauf);
      warteLauf = null;
    }
  }

  /* ---------- Anmeldung und Sperre ---------- */

  function setzeLoginModus(gesperrt) {
    el('login-titel').textContent = gesperrt ? 'Gesperrt' : 'Anmelden';
    el('login-unter').textContent = gesperrt
      ? 'Die App ist gesperrt. Gib dein Admin-Passwort ein, um weiterzuarbeiten.'
      : 'Dein Admin-Passwort von masesites.ch. Danach fragt die App auf diesem Gerät nicht mehr danach.';
  }

  function baueLoginbildschirm() {
    var feld = el('lg-pw');

    el('lg-zeigen').addEventListener('click', function () {
      var sichtbar = feld.type === 'text';
      feld.type = sichtbar ? 'password' : 'text';
      el('lg-zeigen').setAttribute('aria-label', sichtbar ? 'Passwort anzeigen' : 'Passwort verbergen');
      feld.focus();
    });

    el('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var knopf = el('login-senden');
      U.fehler('login-fehler', '');
      knopf.classList.add('laedt');

      var antwort = await window.mase.konto.anmelden(feld.value);
      knopf.classList.remove('laedt');

      if (!antwort.ok) {
        U.fehler('login-fehler', antwort.meldung);
        A.spiele(el('login-form'), [
          { transform: 'translateX(0)' }, { transform: 'translateX(-8px)' },
          { transform: 'translateX(8px)' }, { transform: 'translateX(0)' },
        ], { duration: A.d(340) });
        return;
      }
      feld.value = '';
      zustand.angemeldetSeit = Date.now();
      zustand.tokenVorhanden = !!antwort.tokenVorhanden;
      setzeLoginModus(false);
      U.meldung(antwort.gemerkt
        ? 'Angemeldet. Dieses Gerät ist jetzt gemerkt.'
        : 'Angemeldet.', 'gut');
      await zeige('auswahl');
    });

    el('login-zurueck').addEventListener('click', function () {
      zeige('lizenz');
    });
  }

  async function sperren() {
    await window.mase.konto.sperren();
    zustand.angemeldetSeit = null;
    zustand.tokenVorhanden = false;
    setzeLoginModus(true);
    await zeige('login');
    U.meldung('Gesperrt.');
  }

  async function pruefeServer() {
    var punkt = el('server-punkt');
    var text = el('server-text');
    punkt.className = 'statuspunkt laedt';
    text.textContent = 'Server wird geprüft …';
    var ergebnis = await window.mase.system.servertest();
    punkt.className = 'statuspunkt ' + (ergebnis.ok ? 'gut' : 'schlecht');
    text.textContent = ergebnis.ok
      ? ergebnis.adresse.replace(/^https?:\/\//, '') + ' · ' + ergebnis.dauer + ' ms'
      : 'Nicht erreichbar';
  }

  /* ---------- Bereichsauswahl ---------- */

  var NS = 'http://www.w3.org/2000/svg';

  /* Die Bildmarke als Kachelzeichen — kein Kürzel, sondern das Logo. */
  function markeSvg() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 32 32');
    svg.setAttribute('class', 'kachel-marke');
    [[5, 5, false], [17, 5, false], [5, 17, true], [17, 17, false]].forEach(function (lage) {
      var teil = document.createElementNS(NS, 'rect');
      teil.setAttribute('x', lage[0]);
      teil.setAttribute('y', lage[1]);
      teil.setAttribute('width', '10');
      teil.setAttribute('height', '10');
      teil.setAttribute('rx', '3');
      if (lage[2]) {
        teil.setAttribute('class', 'kachel-marke-leise');
      }
      svg.appendChild(teil);
    });
    return svg;
  }

  function personenSvg() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'kachel-strich');
    [
      'M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20',
      'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
      'M22 20v-1.5a4 4 0 0 0-3-3.9M16 3.6a4 4 0 0 1 0 7.750',
    ].forEach(function (d) {
      var pfad = document.createElementNS(NS, 'path');
      pfad.setAttribute('d', d);
      svg.appendChild(pfad);
    });
    return svg;
  }

  function baueKacheln() {
    var behaelter = el('kacheln');
    behaelter.innerHTML = '';

    zustand.bereiche.forEach(function (bereich) {
      var kachel = document.createElement('button');
      kachel.type = 'button';
      kachel.className = 'kachel ' + (bereich.aktiv ? 'aktiv' : 'gesperrt');
      kachel.dataset.bereich = bereich.schluessel;

      var kuerzel = document.createElement('span');
      kuerzel.className = 'kachel-kuerzel';
      kuerzel.appendChild(bereich.zeichen === 'marke' ? markeSvg() : personenSvg());

      var titel = document.createElement('span');
      titel.className = 'kachel-titel';
      titel.textContent = bereich.titel;

      var text = document.createElement('span');
      text.className = 'kachel-text';
      text.textContent = bereich.text;

      var fuss = document.createElement('span');
      fuss.className = 'kachel-fuss';
      fuss.textContent = bereich.aktiv ? 'Öffnen' : 'Noch nicht verfügbar';
      if (bereich.aktiv) {
        var pfeil = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        pfeil.setAttribute('viewBox', '0 0 24 24');
        var pfad = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pfad.setAttribute('d', 'M5 12h13M13 6l6 6-6 6');
        pfeil.appendChild(pfad);
        fuss.appendChild(pfeil);
      }

      [kuerzel, titel, text, fuss].forEach(function (teil) { kachel.appendChild(teil); });
      U.zeigerlicht(kachel);
      kachel.addEventListener('click', function () { oeffneBereich(bereich); });
      behaelter.appendChild(kachel);
    });
  }

  async function oeffneBereich(bereich) {
    if (!bereich.aktiv) {
      U.meldung('Das Kundendashboard gibt es noch nicht — der Platz ist schon reserviert.', '', 4200);
      return;
    }
    var antwort = await window.mase.bereich.oeffnen(bereich.schluessel);
    if (!antwort.ok) {
      U.meldung(antwort.meldung, 'schlecht');
      if (antwort.lizenz) {
        lizenzAnzeigen(antwort.lizenz);
        await zeige('lizenz');
      }
      return;
    }
    waehleTab('admin', false);
    await zeige('bereich');
  }

  function zeigeSitzungstext() {
    var text = el('sitzung-text');
    if (!zustand.angemeldetSeit) {
      text.textContent = zustand.tokenVorhanden ? 'Angemeldet · Gerät gemerkt' : 'Sitzung aktiv';
      return;
    }
    var rest = 12 * 3600 * 1000 - (Date.now() - zustand.angemeldetSeit);
    var stunden = Math.max(0, Math.floor(rest / 3600000));
    var minuten = Math.max(0, Math.floor((rest % 3600000) / 60000));
    text.textContent = 'Sitzung aktiv · noch ' + stunden + ' h ' + minuten + ' min';
  }

  /* ---------- Reiter im Bereich ---------- */

  function baueTabs() {
    var leiste = el('bl-tabs');
    var laeufer = el('bl-tab-laeufer');

    zustand.tabs.forEach(function (tab) {
      var knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'bl-tab' + (tab.aktiv ? '' : ' gesperrt');
      knopf.dataset.tab = tab.schluessel;
      knopf.textContent = tab.titel;
      knopf.addEventListener('click', function () { waehleTab(tab.schluessel, true); });
      leiste.insertBefore(knopf, laeufer);
    });
  }

  /* Nur die Anzeige umstellen — ohne etwas zu laden. Wird auch gebraucht,
     wenn die eingebettete Seite von sich aus den Bereich wechselt (etwa über
     den Knopf „Mitarbeiter-Portal" in ihrer Seitenleiste). */
  function markiereTab(schluessel) {
    zustand.tab = schluessel;
    el('bl-tabs').querySelectorAll('.bl-tab').forEach(function (knopf) {
      knopf.classList.toggle('aktiv', knopf.dataset.tab === schluessel);
    });
    U.laeuferSetzen(el('bl-tab-laeufer'), el('bl-tabs').querySelector('.bl-tab.aktiv'), el('bl-tabs'));
  }

  function tabZuPfad(pfad) {
    var treffer = zustand.tabs.find(function (tab) {
      return tab.pfad && (pfad === tab.pfad || pfad.indexOf(tab.pfad + '/') === 0);
    });
    return treffer ? treffer.schluessel : null;
  }

  async function waehleTab(schluessel, melden) {
    var antwort = await window.mase.bereich.tab(schluessel);
    if (!antwort.ok) {
      return;
    }
    markiereTab(schluessel);

    var platzhalter = el('platzhalter');
    if (antwort.platzhalter) {
      el('platzhalter-titel').textContent = antwort.titel;
      platzhalter.hidden = false;
      A.spiele(platzhalter, [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: A.d(380) });
      if (melden) {
        U.meldung('Das ' + antwort.titel + ' ist noch nicht eingebunden.', '', 4200);
      }
    } else {
      platzhalter.hidden = true;
    }
  }

  /* ---------- Bereichsleiste ---------- */

  function starteUhr() {
    stoppeUhr();
    var setzen = function () {
      var jetzt = new Date();
      el('bl-uhr').textContent = ('0' + jetzt.getHours()).slice(-2) + ':' + ('0' + jetzt.getMinutes()).slice(-2);
    };
    setzen();
    uhrLauf = setInterval(setzen, 20000);
  }
  function stoppeUhr() {
    if (uhrLauf) {
      clearInterval(uhrLauf);
      uhrLauf = null;
    }
  }

  function baueLeiste() {
    el('bl-zurueck').addEventListener('click', async function () {
      await window.mase.bereich.schliessen();
      await zeige('auswahl');
    });
    el('bl-neuladen').addEventListener('click', function () {
      var knopf = el('bl-neuladen');
      knopf.classList.add('dreht');
      setTimeout(function () { knopf.classList.remove('dreht'); }, 700);
      window.mase.bereich.neuladen();
    });
    el('bl-einstellungen').addEventListener('click', function () { einstellungen.oeffne(); });
    el('auswahl-abmelden').addEventListener('click', sperren);
    el('knopf-schloss').addEventListener('click', sperren);
  }

  /* ---------- Ein anderes Gerät klopft an ---------- */

  function zeigeGeraetFrage(wartend) {
    if (offeneFrage) {
      return;   /* eine nach der anderen */
    }
    offeneFrage = wartend;
    var huelle = el('geraet-frage');
    el('frage-name').textContent = wartend.name || 'Unbekanntes Gerät';
    el('frage-kennung').textContent = wartend.kennung || '—';
    el('frage-warnung').hidden = true;
    huelle.hidden = false;
    window.mase.bereich.sichtbar(false);

    A.spiele(el('frage-schatten'), [{ opacity: 0 }, { opacity: 1 }], { duration: A.d(300) });
    A.spiele(huelle.querySelector('.frage'), [
      { opacity: 0, transform: 'translate(-50%, -46%) scale(0.94)' },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
    ], { duration: A.d(460), easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
  }

  function schliesseGeraetFrage() {
    var huelle = el('geraet-frage');
    offeneFrage = null;
    Promise.all([
      A.spiele(el('frage-schatten'), [{ opacity: 1 }, { opacity: 0 }], { duration: A.d(260) }),
      A.spiele(huelle.querySelector('.frage'), [
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: 'translate(-50%, -48%) scale(0.96)' },
      ], { duration: A.d(260) }),
    ]).then(function () {
      huelle.hidden = true;
      window.mase.bereich.sichtbar(true);
    });
  }

  function baueGeraetFrage() {
    el('frage-ja').addEventListener('click', async function () {
      var ziel = offeneFrage;
      if (!ziel) {
        return;
      }
      var antwort = await window.mase.geraete.entscheiden(ziel.id, true);
      if (!antwort.ok) {
        el('frage-warnung').textContent = antwort.meldung;
        el('frage-warnung').hidden = false;
        return;
      }
      schliesseGeraetFrage();
      U.meldung('Gerät bestätigt: ' + (ziel.name || 'Unbekannt'), 'gut');
      if (einstellungen) {
        einstellungen.ladeGeraete();
      }
    });

    el('frage-nein').addEventListener('click', async function () {
      var ziel = offeneFrage;
      if (!ziel) {
        return;
      }
      await window.mase.geraete.entscheiden(ziel.id, false);
      schliesseGeraetFrage();
      U.meldung('Gerät abgelehnt.');
      if (einstellungen) {
        einstellungen.ladeGeraete();
      }
    });
  }

  /* ---------- Fenster und Tasten ---------- */

  function baueFensterknoepfe() {
    document.querySelectorAll('[data-fenster]').forEach(function (knopf) {
      knopf.addEventListener('click', function () {
        var befehl = knopf.dataset.fenster;
        if (befehl === 'minimieren') { window.mase.fenster.minimieren(); }
        else if (befehl === 'umschalten') { window.mase.fenster.umschalten(); }
        else if (befehl === 'schliessen') { window.mase.fenster.schliessen(); }
      });
    });
    el('knopf-einstellungen').addEventListener('click', function () { einstellungen.oeffne(); });
  }

  function baueTasten() {
    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        einstellungen.offen() ? einstellungen.schliesse() : einstellungen.oeffne();
      } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (!el('knopf-schloss').hidden) {
          sperren();
        }
      } else if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (zustand.station === 'bereich' && zustand.tab === 'admin') {
          window.mase.bereich.neuladen();
        }
      } else if (e.key === 'F11') {
        e.preventDefault();
        window.mase.fenster.vollbild();
      } else if (e.key === 'Escape') {
        if (einstellungen.offen()) {
          einstellungen.schliesse();
        }
      } else if (e.ctrlKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        window.mase.fenster.beenden();
      }
    });
  }

  function baueEreignisse() {
    window.mase.auf('bereich:fehler', function (nutzlast) {
      U.meldung(nutzlast.meldung, 'schlecht', 6000);
    });
    window.mase.auf('bereich:geladen', function (nutzlast) {
      try {
        var pfad = new URL(nutzlast.adresse).pathname;
        el('bl-pfad').textContent = pfad;
        var schluessel = tabZuPfad(pfad);
        if (schluessel && schluessel !== zustand.tab) {
          markiereTab(schluessel);
          el('platzhalter').hidden = true;
        }
      } catch { /* egal */ }
    });
    window.mase.auf('bereich:abgewiesen', function () {
      U.meldung('Im Programm gibt es nur Adminbereich und Mitarbeiter-Portal — die Seite öffnet im Browser.', '', 5000);
    });
    window.mase.auf('geraete:wartet', function (wartend) {
      zeigeGeraetFrage(wartend);
    });
    window.mase.auf('system:erscheinung', function (nutzlast) {
      if (zustand.konfig.erscheinung === 'system') {
        setzeErscheinung(nutzlast.dunkel ? 'dunkel' : 'hell');
      }
    });
    window.addEventListener('resize', function () {
      if (einstellungen && einstellungen.offen()) {
        einstellungen.schliesse();
      }
    });
  }

  function setzeErscheinung(wert) {
    document.documentElement.dataset.erscheinung = wert;
  }

  /* ---------- Start ---------- */

  async function los() {
    var daten = await window.mase.start();
    zustand.konfig = daten.konfig;
    zustand.bereiche = daten.bereiche;
    zustand.tabs = daten.tabs || [];
    zustand.infos = daten.infos;
    zustand.tresorBereit = daten.tresorBereit;
    zustand.tokenVorhanden = !!daten.tokenVorhanden;

    setzeErscheinung(daten.konfig.erscheinung === 'system'
      ? (daten.dunkelSystem ? 'dunkel' : 'hell')
      : daten.konfig.erscheinung);
    A.setzeBewegung(daten.konfig.bewegung);
    document.documentElement.style.setProperty('--titelzeile', daten.chrom.titelzeile + 'px');
    document.documentElement.style.setProperty('--bereichsleiste', daten.chrom.leiste + 'px');
    document.documentElement.style.setProperty('--chrom-hoehe',
      (daten.chrom.titelzeile + daten.chrom.leiste) + 'px');

    baueLizenzbildschirm();
    baueLoginbildschirm();
    baueKacheln();
    baueTabs();
    baueLeiste();
    baueGeraetFrage();
    baueFensterknoepfe();
    baueTasten();
    setzeLoginModus(false);
    U.wellenFuerAlle(document);

    einstellungen = window.MaseEinstellungen.baue({
      konfig: daten.konfig,
      lizenz: daten.lizenz,
      infos: daten.infos,
      beiErscheinung: function (wert) {
        setzeErscheinung(wert === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dunkel' : 'hell') : wert);
      },
      beiLizenzLoesen: function (lizenz) {
        lizenzAnzeigen(lizenz);
        zeige('lizenz');
      },
      beiServerwechsel: function () {
        zustand.angemeldetSeit = null;
        zeige('login');
      },
    });
    baueEreignisse();
    lizenzAnzeigen(daten.lizenz);

    var startAn = daten.konfig.startAnimation && A.aktiv();
    var ziel = naechsteStation(daten);

    if (!startAn) {
      el('start').hidden = true;
      document.body.classList.remove('laedt');
      await zeige(ziel);
    } else {
      var sequenz = startsequenz();
      await A.warte(900);
      await sequenz;
      await zeige(ziel);
    }
    if (daten.anmeldung && daten.anmeldung.still) {
      U.meldung('Angemeldet — dieses Gerät ist gemerkt.', 'gut');
    }
    warneBeiLizenz(daten.lizenz);
  }

  function naechsteStation(daten) {
    var status = daten.lizenz.status;
    if (status === 'wartet') {
      return 'warten';
    }
    if (status !== 'gueltig' && status !== 'kulanz') {
      return 'lizenz';
    }
    return daten.anmeldung.angemeldet ? 'auswahl' : 'login';
  }

  function warneBeiLizenz(lizenz) {
    if (lizenz.status === 'kulanz') {
      U.meldung(lizenz.meldung, '', 6000);
    } else if (lizenz.meldung && lizenz.status !== 'gueltig' && lizenz.status !== 'fehlt' && lizenz.status !== 'wartet') {
      U.meldung(lizenz.meldung, 'schlecht', 6000);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    los().catch(function (fehler) {
      el('start').hidden = true;
      document.body.classList.remove('laedt');
      U.meldung('Start fehlgeschlagen: ' + fehler.message, 'schlecht', 9000);
    });
  });
})();
