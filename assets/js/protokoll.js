/* masesites Protokoll: zeichnet Seitenaufrufe, Klicks und Formular-Absendungen
   auf und schickt sie an den Server (/api/log). Zeitpunkt, IP-Adresse und
   angemeldetes Konto ergänzt der Server selbst aus der Sitzung — im Browser
   wird nichts mehr gespeichert und kein externer IP-Dienst mehr befragt.
   Einsehbar im Admin-Bereich unter /admin. */

(function () {
  "use strict";

  function seite() {
    var name = location.pathname.split("/").pop();
    if (!name) {
      if (location.pathname.indexOf("/admin") !== -1) name = "admin";
      else if (location.pathname.indexOf("/mcs") !== -1) name = "mcs";
      else name = "index.html";
    }
    return name;
  }

  window.msProtokoll = function (aktion, detail) {
    try {
      fetch("/api/log", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
        body: JSON.stringify({
          seite: seite(),
          aktion: String(aktion || "").slice(0, 60),
          detail: String(detail || "").slice(0, 180)
        })
      }).catch(function () {});
    } catch (e) {}
  };

  /* ---------- Automatisch protokollieren ---------- */

  /* Seitenaufruf */
  msProtokoll("Seite geöffnet", document.title);

  /* Jeder Klick: bei Links und Knöpfen mit Beschriftung und Ziel */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("a, button") : null;
    var detail;
    if (el) {
      detail = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
      if (el.tagName === "A" && el.getAttribute("href")) detail += " (" + el.getAttribute("href") + ")";
    } else {
      var t = e.target;
      detail = t.tagName ? t.tagName.toLowerCase() : "Element";
      var text = (t.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
      if (text) detail += ": " + text;
    }
    msProtokoll("Klick", detail);
  }, true);

  /* Formular-Absendungen (ohne Inhalte, nur welches Formular) */
  document.addEventListener("submit", function (e) {
    var f = e.target;
    msProtokoll("Formular gesendet", f.id || f.getAttribute("name") || "Formular");
  }, true);
})();
