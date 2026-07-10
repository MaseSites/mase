/* Frühstart für die Startseite: den sanften Hero-Auftritt vorbereiten, bevor
   gezeichnet wird. Eigene Datei, damit die Seite ohne Inline-Scripts auskommt
   (die Content-Security-Policy des Servers erlaubt nur eigene Script-Dateien). */
(function () {
  var d = document;
  /* Nur beim ersten Laden der Sitzung sanft einblenden, danach sofort sichtbar. */
  try {
    if (!d.hidden && !sessionStorage.getItem('ms_intro_seen')) {
      d.documentElement.classList.add('js');
      sessionStorage.setItem('ms_intro_seen', '1');
    }
  } catch (e) {}
  /* Hero-Inhalt einblenden, sobald das Dokument steht — mit Sicherheits-Fallback,
     damit der Hero nie unsichtbar hängen bleibt. */
  function auftritt() { if (d.body) d.body.classList.add('hero-in'); }
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(auftritt); });
  } else {
    requestAnimationFrame(auftritt);
  }
  setTimeout(auftritt, 1200);
})();
