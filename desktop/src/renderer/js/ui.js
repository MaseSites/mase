/* Kleine Oberflächenhelfer: Meldungen, Klickwelle, Zeigerlicht auf Kacheln,
   Läufer für Reiter und Segmentschalter. */

window.MaseUi = (function () {
  'use strict';

  var A = window.MaseAnim;

  /* ---------- Meldungen ---------- */

  function meldung(text, art, dauerMs) {
    var behaelter = document.getElementById('toasts');
    if (!behaelter) {
      return;
    }
    var el = document.createElement('div');
    el.className = 'toast' + (art ? ' ' + art : '');
    var punkt = document.createElement('span');
    punkt.className = 'punkt';
    el.appendChild(punkt);
    el.appendChild(document.createTextNode(text));
    behaelter.appendChild(el);

    A.spiele(el, [
      { opacity: 0, transform: 'translateY(16px) scale(0.94)' },
      { opacity: 1, transform: 'none' },
    ], { duration: A.d(420), easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });

    setTimeout(function () {
      A.spiele(el, [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(-10px) scale(0.96)' },
      ], { duration: A.d(300) }).then(function () {
        el.remove();
      });
    }, dauerMs || 3400);
  }

  /* ---------- Klickwelle ---------- */

  function welleAn(el) {
    el.addEventListener('pointerdown', function (e) {
      if (!A.aktiv()) {
        return;
      }
      var kasten = el.getBoundingClientRect();
      var groesse = Math.max(kasten.width, kasten.height);
      var welle = document.createElement('span');
      welle.className = 'welle';
      welle.style.width = welle.style.height = groesse + 'px';
      welle.style.left = (e.clientX - kasten.left - groesse / 2) + 'px';
      welle.style.top = (e.clientY - kasten.top - groesse / 2) + 'px';
      el.appendChild(welle);
      setTimeout(function () { welle.remove(); }, 640);
    });
  }

  function wellenFuerAlle(wurzel) {
    (wurzel || document).querySelectorAll('.knopf').forEach(welleAn);
  }

  /* ---------- Zeigerlicht ---------- */

  function zeigerlicht(el) {
    el.addEventListener('pointermove', function (e) {
      var kasten = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - kasten.left) / kasten.width * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - kasten.top) / kasten.height * 100) + '%');
    });
  }

  /* ---------- Läufer ---------- */

  /* Schiebt den Hintergrundbalken unter den aktiven Knopf. */
  function laeuferSetzen(laeufer, ziel, bezug) {
    if (!laeufer || !ziel) {
      return;
    }
    var a = ziel.getBoundingClientRect();
    var b = (bezug || laeufer.parentElement).getBoundingClientRect();
    laeufer.style.width = a.width + 'px';
    laeufer.style.transform = 'translateX(' + (a.left - b.left - 3) + 'px)';
  }

  function reiterLaeufer(laeufer, ziel, leiste) {
    if (!laeufer || !ziel) {
      return;
    }
    var a = ziel.getBoundingClientRect();
    var b = leiste.getBoundingClientRect();
    laeufer.style.width = a.width + 'px';
    laeufer.style.transform = 'translateX(' + (a.left - b.left - 18) + 'px)';
  }

  /* ---------- Segmentschalter ---------- */

  function segment(el, wert, beiWahl) {
    var knoepfe = Array.prototype.slice.call(el.querySelectorAll('button'));
    var laeufer = el.querySelector('.segment-laeufer');

    function waehle(neuerWert, melden) {
      knoepfe.forEach(function (k) {
        k.classList.toggle('aktiv', k.dataset.wert === neuerWert);
      });
      var aktiv = el.querySelector('button.aktiv');
      laeuferSetzen(laeufer, aktiv, el);
      if (melden && typeof beiWahl === 'function') {
        beiWahl(neuerWert);
      }
    }

    knoepfe.forEach(function (k) {
      k.addEventListener('click', function () {
        if (!k.classList.contains('aktiv')) {
          waehle(k.dataset.wert, true);
        }
      });
    });

    waehle(wert, false);
    return { waehle: function (w) { waehle(w, false); } };
  }

  /* ---------- Schalter ---------- */

  function schalter(el, an, beiWechsel) {
    el.setAttribute('aria-checked', an ? 'true' : 'false');
    el.addEventListener('click', function () {
      var neu = el.getAttribute('aria-checked') !== 'true';
      el.setAttribute('aria-checked', neu ? 'true' : 'false');
      if (typeof beiWechsel === 'function') {
        beiWechsel(neu);
      }
    });
    return {
      setze: function (wert) { el.setAttribute('aria-checked', wert ? 'true' : 'false'); },
      wert: function () { return el.getAttribute('aria-checked') === 'true'; },
    };
  }

  /* ---------- Fehlerzeile ---------- */

  function fehler(id, text) {
    var el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.textContent = text || '';
    el.classList.toggle('zeigt', !!text);
  }

  return {
    meldung: meldung,
    welleAn: welleAn,
    wellenFuerAlle: wellenFuerAlle,
    zeigerlicht: zeigerlicht,
    laeuferSetzen: laeuferSetzen,
    reiterLaeufer: reiterLaeufer,
    segment: segment,
    schalter: schalter,
    fehler: fehler,
  };
})();
