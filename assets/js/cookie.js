/* masesites – Cookie-Hinweis.
   Bewusst eine eigene Datei: site.js wird parallel bearbeitet, so gibt
   es keine Konflikte.

   WICHTIG zum Verstaendnis: Diese Website setzt ausschliesslich
   technisch notwendige Cookies (ms_sitzung, ms_sitzung_ma,
   ms_sitzung_admin) - reine Anmelde-Cookies, httpOnly und SameSite=Lax.
   Es gibt kein Analytics, kein Tracking, keine Werbe-Skripte und keine
   Drittanbieter.

   Darum zeigen die Einstellungen die notwendigen Cookies als "immer
   aktiv" und die uebrigen Kategorien als "nicht vorhanden", statt
   Schalter anzubieten, die nichts bewirken. Ein Schalter, der nichts
   tut, waere irrefuehrend - die ehrliche Auskunft "wir setzen so etwas
   gar nicht" ist fuer Besucher mehr wert als ein Schein-Regler.

   Kommt spaeter Analytics dazu, wird aus der Statistik-Zeile ein echter
   Schalter, und die Skripte duerfen erst nach Zustimmung laden. Die
   Struktur ist darauf vorbereitet: gespeichert wird eine Fassung
   (STAND), damit der Hinweis bei einer Aenderung erneut erscheint. */

(function () {
  "use strict";

  var SCHLUESSEL = "ms_cookie_hinweis";
  var STAND = "4";                 /* hochzaehlen, wenn sich der Text aendert */

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

    box.innerHTML =
      '<div class="ms-cookie-inner">' +
        '<div class="ms-cookie-zeile">' +
          '<span class="ms-cookie-keks" aria-hidden="true">' +
            // Schloss statt Keks-Emoji: sachliches Datenschutz-Symbol,
            // das auf jedem System gleich aussieht (Emoji tun das nicht).
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '+
              'stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="4" y="10.5" width="16" height="10.5" rx="2.4"/>' +
              '<path d="M8 10.5V7.2a4 4 0 0 1 8 0v3.3"/>' +
              '<circle cx="12" cy="15.6" r="1.5" fill="currentColor" stroke="none"/>' +
            '</svg>' +
          '</span>' +
          '<p class="ms-cookie-text">' +
            '<b>Nur das N&ouml;tigste.</b> Wir setzen ein Cookie, damit die Anmeldung ' +
            'funktioniert &ndash; kein Tracking und keine Werbung. ' +
            '<a href="/datenschutz">Datenschutz</a>' +
          '</p>' +
          '<div class="ms-cookie-knoepfe">' +
            '<button type="button" class="btn btn-ghost ms-cookie-mehr" aria-expanded="false">Infos</button>' +
            '<button type="button" class="btn btn-primary ms-cookie-ok">Verstanden</button>' +
          '</div>' +
        '</div>' +
        '<div class="ms-cookie-details" hidden>' +
          '<div class="ms-cookie-gruppe">' +
            '<div class="ms-cookie-kopf">' +
              '<span class="ms-cookie-titel">Notwendig</span>' +
              '<span class="ms-cookie-stand ms-aktiv">Immer aktiv</span>' +
            '</div>' +
            '<p>Halten deine Anmeldung &uuml;ber einen Seitenwechsel hinweg. Ohne sie ' +
            'k&ouml;nntest du dich nicht einloggen. Sie enthalten nur eine zuf&auml;llige ' +
            'Kennung, keine pers&ouml;nlichen Daten.</p>' +
            '<ul>' +
              '<li><b>ms_sitzung</b> &ndash; Kundenbereich, bis zur Abmeldung (max. 30 Tage)</li>' +
              '<li><b>ms_sitzung_ma</b> &ndash; Mitarbeitende, bis der Browser schliesst</li>' +
              '<li><b>ms_sitzung_admin</b> &ndash; Verwaltung, bis der Browser schliesst</li>' +
            '</ul>' +
          '</div>' +
          '<div class="ms-cookie-gruppe">' +
            '<div class="ms-cookie-kopf">' +
              '<span class="ms-cookie-titel">Statistik &amp; Marketing</span>' +
              '<span class="ms-cookie-stand">Nicht vorhanden</span>' +
            '</div>' +
            '<p>Wir messen dein Verhalten nicht und binden keine Werbe- oder ' +
            'Analysedienste ein. Darum gibt es hier nichts ein- oder auszuschalten. ' +
            'Auf der Anmeldeseite l&auml;dt ein Skript von Google f&uuml;r &laquo;Mit Google ' +
            'anmelden&raquo; &ndash; Details dazu in der Datenschutzerkl&auml;rung.</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    d.body.appendChild(box);

    var mehr = box.querySelector(".ms-cookie-mehr");
    var details = box.querySelector(".ms-cookie-details");
    var ok = box.querySelector(".ms-cookie-ok");

    /* Das Banner liegt unten ueber die volle Breite - der Chat-Knopf
       sitzt dort ebenfalls. Statt die Hoehe zu raten wird sie gemessen
       und als --ms-cookie-h gesetzt, damit der Knopf sauber ausweicht,
       egal wie lang der Text umbricht oder ob die Details offen sind. */
    function hoeheMelden() {
      d.documentElement.style.setProperty("--ms-cookie-h", box.offsetHeight + "px");
    }
    hoeheMelden();
    d.body.classList.add("ms-cookie-offen");
    window.addEventListener("resize", hoeheMelden);

    void box.offsetHeight;         /* Reflow, damit die Einblendung laeuft */
    box.classList.add("ms-an");

    mehr.addEventListener("click", function () {
      var offen = !details.hidden;
      details.hidden = offen;
      mehr.setAttribute("aria-expanded", String(!offen));
      mehr.textContent = offen ? "Infos" : "Infos ausblenden";
      hoeheMelden();
    });

    function schliessen() {
      merken();
      box.classList.remove("ms-an");
      d.body.classList.remove("ms-cookie-offen");
      window.removeEventListener("resize", hoeheMelden);
      setTimeout(function () {
        if (box.parentNode) box.parentNode.removeChild(box);
      }, 400);
    }

    ok.addEventListener("click", schliessen);
    /* Wer auf "Datenschutz" geht, hat den Hinweis auch gesehen. */
    box.querySelector(".ms-cookie-text a").addEventListener("click", merken);
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
