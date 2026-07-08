/* masesites Protokoll: zeichnet Seitenaufrufe, Klicks und Formular-Absendungen
   auf, jeweils mit Zeitpunkt, IP-Adresse und angemeldetem Konto (sonst "Gast").
   Prototyp ohne Server: Die Einträge liegen im localStorage dieses Browsers
   (ms_log) und werden im Admin-Bereich unter /admin angezeigt.
   Die IP-Adresse kommt von api.ipify.org und wird pro Sitzung zwischengespeichert. */

(function () {
  "use strict";

  var LIMIT = 3000;

  function lies() {
    try { return JSON.parse(localStorage.getItem("ms_log") || "[]"); }
    catch (e) { return []; }
  }
  function schreibe(eintraege) {
    try { localStorage.setItem("ms_log", JSON.stringify(eintraege)); } catch (e) {}
  }

  /* ---------- IP-Adresse: einmal pro Sitzung holen, Einträge solange puffern ---------- */

  var ip = null;
  var warteschlange = [];

  function flush() {
    if (!warteschlange.length) return;
    var eintraege = lies();
    warteschlange.forEach(function (e) { e.ip = ip; eintraege.push(e); });
    warteschlange = [];
    if (eintraege.length > LIMIT) eintraege = eintraege.slice(eintraege.length - LIMIT);
    schreibe(eintraege);
  }

  function setzeIp(wert) {
    if (ip) return;
    ip = wert || "unbekannt";
    try { sessionStorage.setItem("ms_ip", ip); } catch (e) {}
    flush();
  }

  (function holeIp() {
    var gespeichert = null;
    try { gespeichert = sessionStorage.getItem("ms_ip"); } catch (e) {}
    if (gespeichert) { setzeIp(gespeichert); return; }
    /* Fallback, falls die Abfrage hängt oder blockiert ist */
    setTimeout(function () { setzeIp("unbekannt"); }, 4000);
    fetch("https://api.ipify.org?format=json")
      .then(function (r) { return r.json(); })
      .then(function (d) { setzeIp(d && d.ip ? d.ip : "unbekannt"); })
      .catch(function () { setzeIp("unbekannt"); });
  })();

  /* ---------- Eintrag erfassen ---------- */

  function seite() {
    var name = location.pathname.split("/").pop();
    if (!name) name = location.pathname.indexOf("/admin") !== -1 ? "admin" : "index.html";
    return name;
  }

  window.msProtokoll = function (aktion, detail) {
    var eintrag = {
      zeit: Date.now(),
      konto: localStorage.getItem("ms_session") || "Gast",
      ip: ip || "unbekannt",
      seite: seite(),
      aktion: String(aktion || "").slice(0, 60),
      detail: String(detail || "").slice(0, 180)
    };
    if (ip) {
      var eintraege = lies();
      eintraege.push(eintrag);
      if (eintraege.length > LIMIT) eintraege = eintraege.slice(eintraege.length - LIMIT);
      schreibe(eintraege);
    } else {
      warteschlange.push(eintrag);
    }
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
