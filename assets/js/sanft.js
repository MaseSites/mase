/* masesites: Sanftes Scrollen mit dem Mausrad.
   Harte Rad-Sprünge werden weich interpoliert, wie man es von hochwertigen
   Websites kennt. Bewusst zurückhaltend:
   - Trackpads scrollen weiter nativ (die glätten selbst; doppelt geglättet
     fühlt sich schwammig an). Erkannt an vielen kleinen Pixel-Deltas.
   - Innere Scrollbereiche (Chat-Verlauf, Tabellen, Menü-Karte, Listen)
     bleiben unangetastet und scrollen nativ.
   - Wer «Bewegung reduzieren» eingestellt hat, bekommt nichts davon.
   Keine Abhängigkeiten, läuft auf jeder Seite gleich. */

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer: fine)").matches) return; /* Touch bleibt nativ */

  var ziel = window.scrollY;
  var aktiv = false;
  var erwartet = null;     /* Position, die der letzte eigene Frame gesetzt hat */
  var GLAETTE = 0.16;      /* Anteil der Reststrecke pro Frame */
  var RAD_SCHWELLE = 40;   /* kleinere Deltas = Trackpad → nativ lassen */

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  /* Liegt unter dem Zeiger ein Bereich, der selbst in diese Richtung
     scrollen kann? Dann Finger weg und nativ scrollen lassen. */
  function innererScroller(el, deltaY) {
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.nodeType === 1) {
        var oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
          var kannHoch = el.scrollTop > 0;
          var kannRunter = el.scrollTop < el.scrollHeight - el.clientHeight - 1;
          if (deltaY < 0 ? kannHoch : kannRunter) return true;
        }
      }
      el = el.parentNode;
    }
    return false;
  }

  function tick() {
    if (!aktiv) return;
    var ist = window.scrollY;
    var rest = ziel - ist;
    if (Math.abs(rest) < 0.5) {
      window.scrollTo({ top: ziel, left: 0, behavior: "instant" });
      aktiv = false;
      erwartet = null;
      return;
    }
    erwartet = ist + rest * GLAETTE;
    window.scrollTo({ top: erwartet, left: 0, behavior: "instant" });
    requestAnimationFrame(tick);
  }

  window.addEventListener("wheel", function (e) {
    if (e.defaultPrevented) return;
    if (e.ctrlKey || e.metaKey) return;                       /* Zoom-Geste */
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;     /* horizontal */
    if (innererScroller(e.target, e.deltaY)) return;

    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 16;        /* Zeilen → Pixel (Firefox) */
    else if (e.deltaMode === 2) delta *= window.innerHeight;

    /* Trackpad-Erkennung: viele kleine Deltas → nativ. Läuft aber gerade
       eine Glättung, nehmen wir auch kleine Impulse mit, damit sich
       nichts beisst. */
    if (!aktiv && Math.abs(delta) < RAD_SCHWELLE) return;

    e.preventDefault();
    if (!aktiv) ziel = window.scrollY;
    ziel = Math.max(0, Math.min(maxScroll(), ziel + delta));
    if (!aktiv) { aktiv = true; requestAnimationFrame(tick); }
  }, { passive: false });

  /* Scrollt etwas anderes (Tastatur, Scrollbalken, Anker-Sprung), räumen
     wir sofort das Feld: laufende Glättung abbrechen und Ziel angleichen,
     statt dagegen anzukämpfen. Eigene Frames erkennt man daran, dass die
     Position genau der zuletzt selbst gesetzten entspricht. */
  window.addEventListener("scroll", function () {
    if (aktiv && erwartet !== null && Math.abs(window.scrollY - erwartet) > 2) {
      aktiv = false;
      erwartet = null;
    }
    if (!aktiv) ziel = window.scrollY;
  }, { passive: true });
})();
