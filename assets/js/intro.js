/* Frühstart für die Startseite: Intro-Klasse setzen, bevor gezeichnet wird.
   Liegt als eigene Datei vor, damit die Seite ohne Inline-Scripts auskommt
   (Content-Security-Policy des Servers erlaubt nur eigene Script-Dateien). */
(function () {
  var d = document, s;
  try { s = sessionStorage.getItem('ms_intro_seen'); } catch (e) {}
  if (!d.hidden && !s) { d.documentElement.classList.add('js'); }
  setTimeout(function () { d.body && d.body.classList.add('hero-in'); }, 2000);
})();
