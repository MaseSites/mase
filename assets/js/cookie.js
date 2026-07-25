/* masesites – Cookie-Hinweis.
   Bewusst eine eigene Datei: site.js wird gerade parallel bearbeitet,
   so gibt es keine Konflikte.

   WICHTIG zum Verstaendnis: Diese Website setzt ausschliesslich
   technisch notwendige Cookies (ms_sitzung, ms_sitzung_ma,
   ms_sitzung_admin) - reine Anmelde-Cookies, httpOnly und SameSite=Lax.
   Es gibt kein Analytics, kein Tracking, keine Werbe-Skripte und keine
   Drittanbieter. Darum ist dies ein Hinweis-Banner mit Bestaetigung und
   kein Zustimmungs-Dialog mit Ablehnen-Knopf: Es gaebe schlicht nichts
   abzulehnen, und ein Ablehnen-Knopf, der nichts tut, waere irrefuehrend.

   Kommt spaeter Analytics dazu, muss daraus ein echtes Zustimmungs-
   Banner werden (Ablehnen gleichwertig, Skripte erst nach Zustimmung
   laden). Die Struktur hier ist darauf vorbereitet: gespeichert wird
   nicht nur "gesehen", sondern eine Fassung (STAND), damit man den
   Hinweis bei einer Aenderung erneut zeigen kann. */

(function () {
  "use strict";

  var SCHLUESSEL = "ms_cookie_hinweis";
  var STAND = "1";                 /* hochzaehlen, wenn sich der Text aendert */

  function gespeichert() {
    try {
      return localStorage.getItem(SCHLUESSEL);
    } catch (e) {
      /* Speicher gesperrt (privater Modus): Banner nicht endlos zeigen,
         aber auch nicht abstuerzen - wir tun so, als sei es bestaetigt. */
      return STAND;
    }
  }

  function merken() {
    try {
      localStorage.setItem(SCHLUESSEL, STAND);
    } catch (e) { /* nicht schlimm */ }
  }

  if (gespeichert() === STAND) return;

  var d = document;

  function bauen() {
    if (d.getElementById("ms-cookie")) return;

    var box = d.createElement("div");
    box.id = "ms-cookie";
    box.className = "ms-cookie";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Hinweis zu Cookies");

    var text = d.createElement("p");
    text.className = "ms-cookie-text";
    text.innerHTML =
      "<b>Cookies</b> – wir setzen nur, was technisch nötig ist: ein Cookie, " +
      "damit die Anmeldung funktioniert. Kein Tracking, keine Werbung, " +
      "keine Weitergabe an Dritte. ";

    var mehr = d.createElement("a");
    mehr.href = "/datenschutz";
    mehr.textContent = "Datenschutz";
    text.appendChild(mehr);

    var knopf = d.createElement("button");
    knopf.type = "button";
    knopf.className = "btn btn-primary ms-cookie-ok";
    knopf.textContent = "Verstanden";

    box.appendChild(text);
    box.appendChild(knopf);
    d.body.appendChild(box);

    /* Der Chat-Knopf sitzt unten rechts - solange das Banner steht,
       rutscht er hoch, damit sich beide nicht verdecken. Die noetige
       Hoehe wird gemessen statt geraten: auf dem Handy steht der Knopf
       auf einer eigenen Zeile, das Banner ist dort deutlich hoeher, und
       laengerer Text kann es weiter wachsen lassen. */
    function hoeheMelden() {
      d.documentElement.style.setProperty("--ms-cookie-h", box.offsetHeight + "px");
    }
    hoeheMelden();
    d.body.classList.add("ms-cookie-offen");
    window.addEventListener("resize", hoeheMelden);

    void box.offsetHeight;         /* Reflow, damit die Einblendung laeuft */
    box.classList.add("ms-an");

    function schliessen() {
      merken();
      box.classList.remove("ms-an");
      d.body.classList.remove("ms-cookie-offen");
      window.removeEventListener("resize", hoeheMelden);
      setTimeout(function () {
        if (box.parentNode) box.parentNode.removeChild(box);
      }, 400);
    }

    knopf.addEventListener("click", schliessen);
    /* Wer auf "Datenschutz" geht, hat den Hinweis auch gesehen. */
    mehr.addEventListener("click", merken);
  }

  /* Erst nach dem Laden zeigen, damit das Banner nicht in eine
     laufende Startanimation (z. B. Ueber uns) hineinplatzt. */
  function start() {
    setTimeout(bauen, 900);
  }

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
