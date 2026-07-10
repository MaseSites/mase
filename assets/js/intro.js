/* Frühstart für die Startseite: Intro-Zustand setzen, bevor gezeichnet wird.
   Das Intro ist eine Kamerafahrt: die Beispielseite steckt zuerst klein in
   einem Monitor-Rahmen, dann zoomt die Seite hinein (Regie in hero.js).
   Eigene Datei, damit die Seite ohne Inline-Scripts auskommt
   (die Content-Security-Policy des Servers erlaubt nur eigene Script-Dateien). */
(function () {
  var d = document, gesehen = false, wenigBewegung = false;
  try { wenigBewegung = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try {
    gesehen = !!sessionStorage.getItem("ms_intro_seen");
    if (!gesehen) sessionStorage.setItem("ms_intro_seen", "1");
  } catch (e) {}
  if (!d.hidden && !gesehen && !wenigBewegung) {
    d.documentElement.classList.add("intro-zoom");
    /* Sicherheitsnetz: falls hero.js nicht lädt, darf die Seite nie im
       Monitor-Zustand hängen bleiben. */
    setTimeout(function () {
      d.documentElement.classList.remove("intro-zoom", "intro-fahrt");
    }, 4500);
  }
})();
