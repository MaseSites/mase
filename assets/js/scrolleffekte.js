/* masesites - Scroll-Effekte
   ---------------------------------------------------------------
   Bewusst zurueckhaltend: die Seite soll ruhig und seriös wirken,
   nicht animiert. Drei Bausteine:

     1. Lesefortschritt   - duenne Linie am oberen Rand
     2. Parallaxe         - das Foto im Startbereich laeuft langsamer
                            als die Seite, der Text hebt leicht ab
     3. Bild-Enthuellung  - Fotos ziehen sich beim Erscheinen aus
                            ihrem Rahmen auf statt einzublenden

   Alles laeuft in EINER requestAnimationFrame-Schleife am passiven
   scroll-Ereignis. Bewusst kein IntersectionObserver fuer die Bilder:
   der Zuschnitt (clip-path) verhindert in Chrome, dass der Observer
   ueberhaupt ausloest - die Bilder blieben dann dauerhaft unsichtbar.
   Die Schleife hier prueft die Position selbst und ist damit sicher.

   Bei "prefers-reduced-motion: reduce" passiert gar nichts.
*/
(function () {
  "use strict";

  var d = document;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ---------- 1. Lesefortschritt ---------- */

  var balken = d.createElement("div");
  balken.className = "scroll-fortschritt";
  balken.setAttribute("aria-hidden", "true");
  d.body.appendChild(balken);

  /* ---------- 2. Parallaxe im Startbereich ---------- */

  var hero = d.querySelector(".hero-start");
  var foto = d.querySelector(".hero-foto");
  var mitte = d.querySelector(".hero-mitte");

  /* ---------- 3. Bilder vorbereiten ---------- */

  var bilder = [].slice.call(
    d.querySelectorAll(
      ".orts-bild, .orts-einzelbild, .gruender-foto, .lw-naturbild, .kontakt-bild, .buero-bild"
    )
  );

  bilder.forEach(function (el, i) {
    el.classList.add("bild-huelle");
    // Nachbarn in einer Reihe leicht versetzt, sonst springt alles gleichzeitig
    el.style.setProperty("--bild-verzug", (i % 3) * 110 + "ms");
  });

  /* ---------- Gemeinsame Schleife ---------- */

  var offen = false;

  function messen() {
    offen = false;

    var fensterHoehe = window.innerHeight;
    var y = window.scrollY;

    // Lesefortschritt
    var hoehe = d.documentElement.scrollHeight - fensterHoehe;
    balken.style.transform = "scaleX(" + (hoehe > 0 ? Math.min(y / hoehe, 1) : 0) + ")";

    // Bilder freigeben, sobald sie zu einem Fuenftel im Fenster stehen
    for (var i = bilder.length - 1; i >= 0; i--) {
      var el = bilder[i];
      var r = el.getBoundingClientRect();
      var schwelle = Math.min(r.height * 0.2, 120);
      if (r.top < fensterHoehe - schwelle && r.bottom > 0) {
        el.classList.add("bild-frei");
        bilder.splice(i, 1); // einmal frei, nie wieder pruefen
      }
    }

    if (!hero) return;
    var h = hero.offsetHeight;
    // 0 = Startbereich fuellt das Fenster, 1 = er ist ganz durchgescrollt
    var f = h > 0 ? Math.min(Math.max(y / h, 0), 1) : 0;
    if (f >= 1) return; // ausserhalb: nichts mehr rechnen

    // Das Foto bleibt zurueck (klassische Parallaxe, max. 60 px)
    if (foto) foto.style.transform = "translate3d(0," + (f * 60).toFixed(2) + "px,0)";

    // Der Text zieht leicht nach oben weg und wird transparenter.
    // Erst ab 25 % Scrollweg, damit beim Lesen nichts passiert.
    if (mitte) {
      var g = Math.max((f - 0.25) / 0.75, 0);
      mitte.style.transform = "translate3d(0,-" + (g * 42).toFixed(2) + "px,0)";
      mitte.style.opacity = (1 - g * 0.85).toFixed(3);
    }
  }

  function anfordern() {
    if (offen) return;
    offen = true;
    window.requestAnimationFrame(messen);
  }

  window.addEventListener("scroll", anfordern, { passive: true });
  window.addEventListener("resize", anfordern, { passive: true });
  window.addEventListener("load", anfordern);
  messen();
})();
