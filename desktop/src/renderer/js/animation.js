/* Bewegung an einer Stelle gebündelt.

   Alles läuft über die Web-Animations-API statt über CSS-Übergänge: so
   bekommen wir echte Promises und die Abläufe können sauber nacheinander
   gespielt werden, ohne auf transitionend zu lauern.

   Ist Bewegung abgeschaltet (Einstellung oder Windows-Systemwunsch), bleiben
   dieselben Abläufe bestehen — nur mit einer Dauer von 1 ms. */

window.MaseAnim = (function () {
  'use strict';

  var bewegung = true;
  var systemRuhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function aktiv() {
    return bewegung && !systemRuhig;
  }
  function d(ms) {
    return aktiv() ? ms : 1;
  }
  function setzeBewegung(an) {
    bewegung = an !== false;
    document.documentElement.classList.toggle('ruhig', !aktiv());
  }

  function warte(ms) {
    return new Promise(function (fertig) { setTimeout(fertig, d(ms)); });
  }

  /* Abgebrochene Animationen sind kein Fehler — sie passieren bei schnellen
     Klicks ständig. */
  function spiele(el, bilder, optionen) {
    if (!el) {
      return Promise.resolve();
    }
    var lauf = el.animate(bilder, Object.assign({
      duration: d(400),
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'both',
    }, optionen || {}));
    return lauf.finished.catch(function () {}).then(function () {
      return lauf;
    });
  }

  /* Kinder mit data-stufe nacheinander hereinholen. */
  function stufenEin(wurzel, verzoegerung) {
    var teile = Array.prototype.slice.call(wurzel.querySelectorAll('[data-stufe]'));
    teile.sort(function (a, b) {
      return Number(a.dataset.stufe) - Number(b.dataset.stufe);
    });
    return Promise.all(teile.map(function (teil, i) {
      return spiele(teil, [
        { opacity: 0, transform: 'translateY(18px)', filter: 'blur(5px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ], {
        duration: d(620),
        delay: d((verzoegerung || 0) + i * 65),
      });
    }));
  }

  function bildschirmEin(el) {
    el.hidden = false;
    return Promise.all([
      spiele(el, [
        { opacity: 0, transform: 'scale(0.985) translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: d(520) }),
      stufenEin(el, 60),
    ]).then(function () {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
    });
  }

  function bildschirmAus(el, richtung) {
    var hoch = richtung !== 'rueck';
    return spiele(el, [
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      {
        opacity: 0,
        transform: hoch ? 'scale(0.97) translateY(-22px)' : 'scale(1.02) translateY(16px)',
        filter: 'blur(8px)',
      },
    ], { duration: d(360), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }).then(function () {
      el.hidden = true;
      el.getAnimations().forEach(function (a) { a.cancel(); });
    });
  }

  /* Zahl weichzeichnend hochzählen — für Ladeanzeigen. */
  function zaehle(el, von, bis, dauer, formatiere) {
    var start = performance.now();
    var spanne = d(dauer);
    return new Promise(function (fertig) {
      function schritt(jetzt) {
        var t = Math.min(1, (jetzt - start) / spanne);
        var weich = 1 - Math.pow(1 - t, 3);
        el.textContent = formatiere(Math.round(von + (bis - von) * weich));
        if (t < 1) {
          requestAnimationFrame(schritt);
        } else {
          fertig();
        }
      }
      requestAnimationFrame(schritt);
    });
  }

  return {
    aktiv: aktiv,
    d: d,
    setzeBewegung: setzeBewegung,
    warte: warte,
    spiele: spiele,
    stufenEin: stufenEin,
    bildschirmEin: bildschirmEin,
    bildschirmAus: bildschirmAus,
    zaehle: zaehle,
  };
})();
