/* Der Lizenzcode wird in drei Blöcken eingegeben (MASE ist fest).

   Verhalten wie bei einem Bestätigungscode: automatisch weiterspringen,
   Rücktaste geht zurück, ein eingefügter kompletter Code verteilt sich von
   selbst auf die Felder — auch wenn er mit "MASE-" beginnt. */

window.MaseLizenzfeld = (function () {
  'use strict';

  function nurErlaubt(text) {
    return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function baue(felder, beiVoll) {
    function code() {
      return 'MASE-' + felder.map(function (f) { return f.value; }).join('-');
    }
    function komplett() {
      return felder.every(function (f) { return f.value.length === 4; });
    }
    function melde() {
      if (komplett() && typeof beiVoll === 'function') {
        beiVoll(code());
      }
    }

    /* Verteilt eine Zeichenkette ab einem Feld über alle folgenden. */
    function verteile(startIndex, zeichen) {
      var rest = zeichen;
      if (rest.slice(0, 4) === 'MASE' && rest.length > 4) {
        rest = rest.slice(4);
        startIndex = 0;
      }
      for (var i = startIndex; i < felder.length && rest.length; i++) {
        felder[i].value = rest.slice(0, 4);
        rest = rest.slice(4);
      }
      var letztes = Math.min(felder.length - 1, startIndex + Math.ceil(zeichen.length / 4) - 1);
      var ziel = felder[Math.max(0, letztes)];
      ziel.focus();
      ziel.setSelectionRange(ziel.value.length, ziel.value.length);
      melde();
    }

    felder.forEach(function (feld, index) {
      feld.setAttribute('placeholder', '····');

      feld.addEventListener('input', function () {
        var zeichen = nurErlaubt(feld.value);
        if (zeichen.length > 4) {
          verteile(index, zeichen);
          return;
        }
        feld.value = zeichen;
        if (zeichen.length === 4 && index < felder.length - 1) {
          felder[index + 1].focus();
          felder[index + 1].select();
        }
        melde();
      });

      feld.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && feld.value === '' && index > 0) {
          e.preventDefault();
          felder[index - 1].focus();
          felder[index - 1].setSelectionRange(4, 4);
        }
        if (e.key === 'ArrowLeft' && feld.selectionStart === 0 && index > 0) {
          e.preventDefault();
          felder[index - 1].focus();
        }
        if (e.key === 'ArrowRight' && feld.selectionStart === feld.value.length && index < felder.length - 1) {
          e.preventDefault();
          felder[index + 1].focus();
        }
      });

      feld.addEventListener('paste', function (e) {
        e.preventDefault();
        verteile(index, nurErlaubt((e.clipboardData || window.clipboardData).getData('text')));
      });

      feld.addEventListener('focus', function () {
        feld.select();
      });
    });

    return {
      code: code,
      komplett: komplett,
      leeren: function () {
        felder.forEach(function (f) { f.value = ''; });
        felder[0].focus();
      },
      fokus: function () { felder[0].focus(); },
      fuellen: function (ganzerCode) {
        verteile(0, nurErlaubt(ganzerCode));
      },
    };
  }

  return { baue: baue };
})();
