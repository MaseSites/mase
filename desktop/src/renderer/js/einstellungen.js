/* Das Einstellungsblatt: Verbindung, Lizenz, Darstellung, System, Info.

   Alle Änderungen gehen sofort an den Hauptprozess — es gibt kein
   "Speichern"-Knopf, ausser bei der Serveradresse, wo ein Vertipper sonst
   sofort die Verbindung kappen würde. */

window.MaseEinstellungen = (function () {
  'use strict';

  var A = window.MaseAnim;
  var U = window.MaseUi;

  var wurzel, blatt, schatten, offen = false;
  var kontext = null;   /* { konfig, lizenz, infos, beiKonfig, beiLizenzLoesen } */

  function el(id) { return document.getElementById(id); }

  /* ---------- Reiter ---------- */

  function baueReiter() {
    var leiste = el('blatt-reiter');
    var laeufer = el('reiter-laeufer');
    var knoepfe = Array.prototype.slice.call(leiste.querySelectorAll('.reiter'));

    function waehle(name) {
      knoepfe.forEach(function (k) { k.classList.toggle('aktiv', k.dataset.reiter === name); });
      if (name === 'lizenz') {
        ladeGeraete();
        if (pflicht) {
          pflicht.laden();
        }
      }
      wurzel.querySelectorAll('.tafel').forEach(function (tafel) {
        var an = tafel.dataset.tafel === name;
        tafel.classList.toggle('aktiv', an);
        if (an) {
          A.spiele(tafel, [
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'none' },
          ], { duration: A.d(360) });
        }
      });
      U.reiterLaeufer(laeufer, leiste.querySelector('.reiter.aktiv'), leiste);
    }

    knoepfe.forEach(function (k) {
      k.addEventListener('click', function () { waehle(k.dataset.reiter); });
    });
    return waehle;
  }

  /* ---------- Verbindung ---------- */

  function baueVerbindung() {
    var feld = el('ein-server');

    async function speichern(adresse) {
      var antwort = await window.mase.konfig.setzen({ serverAdresse: adresse });
      if (!antwort.ok) {
        U.meldung(antwort.meldung, 'schlecht');
        return;
      }
      kontext.konfig = antwort.konfig;
      feld.value = antwort.konfig.serverAdresse;
      U.meldung('Serveradresse übernommen: ' + antwort.konfig.serverAdresse, 'gut');
      if (antwort.serverGewechselt && typeof kontext.beiServerwechsel === 'function') {
        kontext.beiServerwechsel();
      }
      testen();
    }

    async function testen() {
      var punkt = el('ein-server-punkt');
      var text = el('ein-server-text');
      punkt.className = 'statuspunkt laedt';
      text.textContent = 'Verbindung wird geprüft …';
      var ergebnis = await window.mase.system.servertest();
      punkt.className = 'statuspunkt ' + (ergebnis.ok ? 'gut' : 'schlecht');
      text.textContent = ergebnis.ok
        ? 'Erreichbar in ' + ergebnis.dauer + ' ms'
        : (ergebnis.meldung || 'Nicht erreichbar');
    }

    el('ein-server-speichern').addEventListener('click', function () {
      speichern(feld.value.trim());
    });
    feld.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { speichern(feld.value.trim()); }
    });
    el('ein-server-test').addEventListener('click', testen);
    el('schnellwahl').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) { speichern(chip.dataset.adresse); }
    });

    return { testen: testen };
  }

  /* ---------- Lizenz ---------- */

  var STATUS_TEXT = {
    gueltig: ['Aktiv', 'gut'],
    kulanz: ['Kulanz', 'warn'],
    kulanzEnde: ['Abgelaufen', 'warn'],
    abgelaufen: ['Abgelaufen', 'warn'],
    ungueltig: ['Ungültig', 'warn'],
    fremd: ['Anderes Gerät', 'warn'],
    fehlt: ['Keine', ''],
  };

  function zeigeLizenz(lizenz) {
    var beschreibung = STATUS_TEXT[lizenz.status] || ['Unbekannt', ''];
    var plakette = el('ein-lizenz-status');
    plakette.textContent = beschreibung[0];
    plakette.className = 'plakette ' + beschreibung[1];
    el('ein-lizenz-code').textContent = lizenz.code || 'Kein Code hinterlegt';
    el('ein-lizenz-geraet').textContent = lizenz.geraet
      ? 'Kennung ' + lizenz.geraet + ' · an dieses Windows-Konto gebunden'
      : '—';
  }

  /* ---------- Geräte an dieser Lizenz ---------- */

  async function ladeGeraete() {
    var behaelter = el('ein-geraete');
    var zahl = el('ein-geraete-zahl');
    behaelter.innerHTML = '';

    var ergebnis = await window.mase.geraete.liste();
    if (!ergebnis.ok) {
      zahl.textContent = ergebnis.grund === 'kein-token'
        ? 'Erst im Servermodus und nach einer Anmeldung sichtbar.'
        : 'Geräte konnten nicht geladen werden.';
      return;
    }

    var aktive = ergebnis.geraete.filter(function (g) { return g.status === 'aktiv'; }).length;
    zahl.textContent = aktive + ' von ' + ergebnis.max + ' Plätzen belegt.';

    if (!ergebnis.geraete.length) {
      var leer = document.createElement('span');
      leer.className = 'geraet-leer';
      leer.textContent = 'Noch keine Geräte.';
      behaelter.appendChild(leer);
      return;
    }

    ergebnis.geraete.forEach(function (g) {
      var zeile = document.createElement('div');
      zeile.className = 'geraet-zeile';

      var text = document.createElement('div');
      text.className = 'posten-text';
      var name = document.createElement('span');
      name.className = 'geraet-name';
      name.textContent = g.name + (g.id === ergebnis.eigenes ? ' · dieses Gerät' : '');
      var unter = document.createElement('span');
      unter.className = 'geraet-unter';
      unter.textContent = g.kennung;
      text.appendChild(name);
      text.appendChild(unter);

      var plakette = document.createElement('span');
      plakette.className = 'plakette ' + (g.status === 'aktiv' ? 'gut' : 'warn');
      plakette.textContent = g.status === 'aktiv' ? 'Aktiv' : 'Wartet';

      zeile.appendChild(text);
      zeile.appendChild(plakette);

      if (g.status === 'wartet') {
        var ja = document.createElement('button');
        ja.className = 'knopf knopf-klein';
        ja.type = 'button';
        ja.textContent = 'Erlauben';
        ja.addEventListener('click', async function () {
          var antwort = await window.mase.geraete.entscheiden(g.id, true);
          U.meldung(antwort.ok ? 'Gerät bestätigt.' : antwort.meldung, antwort.ok ? 'gut' : 'schlecht');
          ladeGeraete();
        });
        zeile.appendChild(ja);
      }

      var weg = document.createElement('button');
      weg.className = 'geraet-weg';
      weg.type = 'button';
      weg.title = g.id === ergebnis.eigenes ? 'Dieses Gerät entfernen' : 'Gerät entfernen';
      weg.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      weg.addEventListener('click', async function () {
        await window.mase.geraete.entscheiden(g.id, false);
        U.meldung('Gerät entfernt.');
        ladeGeraete();
      });
      zeile.appendChild(weg);

      behaelter.appendChild(zeile);
    });
  }

  /* ---------- Lizenzpflicht ---------- */

  /* Der Schalter kippt erst, wenn der Server zugestimmt hat — sonst stünde
     dort „an", während der Adminbereich weiter offen ist. */
  function baueLizenzpflicht() {
    var schalter = el('ein-pflicht');
    var unter = el('ein-pflicht-unter');
    var laeuft = false;

    function zeige(an) {
      schalter.setAttribute('aria-checked', an ? 'true' : 'false');
    }

    schalter.addEventListener('click', async function () {
      if (laeuft) {
        return;
      }
      laeuft = true;
      var neu = schalter.getAttribute('aria-checked') !== 'true';
      var antwort = await window.mase.lizenz.pflichtSetzen(neu);
      laeuft = false;

      if (!antwort.ok) {
        unter.textContent = antwort.meldung;
        U.meldung(antwort.meldung, 'schlecht', 6000);
        return;
      }
      zeige(antwort.an);
      unter.textContent = antwort.an
        ? 'Scharf. Der Adminbereich ist im Browser gesperrt.'
        : 'Aus. Der Adminbereich ist auch im Browser erreichbar.';
      U.meldung(antwort.an
        ? 'Scharf geschaltet — der Adminbereich läuft nur noch über die App.'
        : 'Lizenzpflicht ausgeschaltet.', 'gut', 5000);
    });

    return {
      laden: async function () {
        var stand = await window.mase.lizenz.pflicht();
        if (!stand.ok) {
          schalter.disabled = true;
          unter.textContent = stand.grund === 'alt'
            ? 'Der Server kennt die Lizenzverwaltung noch nicht — api.php ist dort nicht aktuell.'
            : 'Erst nach der Anmeldung sichtbar.';
          return;
        }
        schalter.disabled = false;
        zeige(stand.an);
        unter.textContent = stand.an
          ? 'Scharf. Der Adminbereich ist im Browser gesperrt.'
          : 'Sperrt den Adminbereich im Browser aus. Geht erst, wenn dieses Gerät über die App angemeldet ist.';
      },
    };
  }

  function baueLizenz() {
    var modus = U.segment(el('ein-modus'), kontext.konfig.lizenzModus, async function (wert) {
      var antwort = await window.mase.konfig.setzen({ lizenzModus: wert });
      if (antwort.ok) {
        kontext.konfig = antwort.konfig;
        U.meldung(wert === 'server'
          ? 'Lizenzprüfung läuft jetzt über deinen Server.'
          : 'Lizenzprüfung läuft im Programm (Testbetrieb).', 'gut');
      }
    });

    el('ein-lizenz-loesen').addEventListener('click', async function () {
      var lizenz = await window.mase.lizenz.loesen();
      zeigeLizenz(lizenz);
      U.meldung('Lizenz gelöst. Beim nächsten Schritt fragt die App wieder nach dem Code.');
      schliesse();
      if (typeof kontext.beiLizenzLoesen === 'function') {
        kontext.beiLizenzLoesen(lizenz);
      }
    });

    return modus;
  }

  /* ---------- Darstellung und System ---------- */

  function baueDarstellung() {
    var erscheinung = U.segment(el('ein-erscheinung'), kontext.konfig.erscheinung, async function (wert) {
      await window.mase.konfig.setzen({ erscheinung: wert });
      kontext.konfig = Object.assign({}, kontext.konfig, { erscheinung: wert });
      if (typeof kontext.beiErscheinung === 'function') {
        kontext.beiErscheinung(wert);
      }
    });

    var zoom = el('ein-zoom');
    var zoomWert = el('ein-zoom-wert');
    zoom.value = String(Math.round(kontext.konfig.zoom * 100));
    zoomWert.textContent = zoom.value + ' %';
    zoom.addEventListener('input', function () {
      zoomWert.textContent = zoom.value + ' %';
    });
    zoom.addEventListener('change', function () {
      window.mase.konfig.setzen({ zoom: Number(zoom.value) / 100 });
    });

    U.schalter(el('ein-bewegung'), kontext.konfig.bewegung, function (an) {
      A.setzeBewegung(an);
      window.mase.konfig.setzen({ bewegung: an });
    });
    U.schalter(el('ein-start'), kontext.konfig.startAnimation, function (an) {
      window.mase.konfig.setzen({ startAnimation: an });
    });
    U.schalter(el('ein-autostart'), kontext.konfig.autostart, function (an) {
      window.mase.konfig.setzen({ autostart: an });
      U.meldung(an ? 'Startet künftig mit Windows.' : 'Startet nicht mehr mit Windows.');
    });

    el('ein-ordner-oeffnen').addEventListener('click', function () {
      window.mase.system.datenordner();
    });

    return erscheinung;
  }

  function zeigeInfos(infos) {
    var paare = [
      ['Version', infos.version],
      ['Server', infos.server],
      ['Gerät', infos.geraet],
      ['Electron', infos.electron],
      ['Chromium', infos.chrome],
      ['Node', infos.node],
      ['System', infos.plattform],
      ['Datenordner', infos.datenordner],
    ];
    var block = el('ein-infos');
    block.innerHTML = '';
    var liste = document.createElement('dl');
    liste.className = 'infoblock';
    paare.forEach(function (paar) {
      var dt = document.createElement('dt');
      dt.textContent = paar[0];
      var dd = document.createElement('dd');
      dd.textContent = paar[1] || '—';
      liste.appendChild(dt);
      liste.appendChild(dd);
    });
    block.replaceWith(liste);
    liste.id = 'ein-infos';
    el('ein-ordner').textContent = infos.datenordner;
  }

  /* ---------- Öffnen und Schliessen ---------- */

  var reiterWaehlen, verbindung, modusSegment, erscheinungSegment, pflicht;

  /* Das Standbild ersetzt die eingeblendete Ansicht, solange das Blatt
     offen ist — sonst klafft dort eine leere Fläche. */
  function zeigeStandbild(bild) {
    var el = document.getElementById('ue-standbild');
    if (bild) {
      el.style.backgroundImage = 'url("' + bild + '")';
      el.classList.add('zeigt');
    } else {
      el.style.removeProperty('background-image');
      el.classList.remove('zeigt');
    }
  }

  function oeffne(reiter) {
    if (offen) {
      return;
    }
    offen = true;
    wurzel.hidden = false;
    window.mase.bereich.sichtbar(false).then(function (antwort) {
      if (offen) {
        zeigeStandbild(antwort && antwort.bild);
      }
    });

    el('ein-server').value = kontext.konfig.serverAdresse;
    modusSegment.waehle(kontext.konfig.lizenzModus);
    erscheinungSegment.waehle(kontext.konfig.erscheinung);
    zeigeLizenz(kontext.lizenz);
    zeigeInfos(kontext.infos);
    reiterWaehlen(reiter || 'verbindung');

    A.spiele(schatten, [{ opacity: 0 }, { opacity: 1 }], { duration: A.d(320) });
    A.spiele(blatt, [
      { transform: 'translateX(100%)' },
      { transform: 'translateX(0)' },
    ], { duration: A.d(520), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  }

  function schliesse() {
    if (!offen) {
      return;
    }
    offen = false;
    Promise.all([
      A.spiele(schatten, [{ opacity: 1 }, { opacity: 0 }], { duration: A.d(280) }),
      A.spiele(blatt, [
        { transform: 'translateX(0)' },
        { transform: 'translateX(100%)' },
      ], { duration: A.d(360), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }),
    ]).then(function () {
      wurzel.hidden = true;
      window.mase.bereich.sichtbar(true);
    });
  }

  function baue(neuerKontext) {
    kontext = neuerKontext;
    wurzel = el('einstellungen');
    blatt = wurzel.querySelector('.blatt');
    schatten = el('ue-schatten');

    reiterWaehlen = baueReiter();
    verbindung = baueVerbindung();
    modusSegment = baueLizenz();
    pflicht = baueLizenzpflicht();
    erscheinungSegment = baueDarstellung();

    schatten.addEventListener('click', schliesse);
    el('einstellungen-zu').addEventListener('click', schliesse);
    U.wellenFuerAlle(wurzel);

    return {
      oeffne: oeffne,
      schliesse: schliesse,
      offen: function () { return offen; },
      zeigeLizenz: zeigeLizenz,
      ladeGeraete: ladeGeraete,
      servertest: verbindung.testen,
      setzeKontext: function (teil) { Object.assign(kontext, teil); },
    };
  }

  return { baue: baue };
})();
