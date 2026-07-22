/* masesites – Leistungsseite: Weltenwechsel mit Lichtwechsel,
   Vorher/Nachher-Schieber, zählende Kennzahlen und Chat-Schleife. */

(function () {
  "use strict";

  var lw = document.getElementById("lw");
  if (!lw) return;

  var wipe = document.getElementById("lw-wipe");
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".lw-tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".lw-welt"));
  var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wechselt = false;

  var WELT_FARBEN = {
    website: "#F6F1E7",
    ueberarbeitung: "#F2EDE2",
    webapp: "#EDF1F5",
    ki: "#06060B"
  };

  function zeigeWelt(name) {
    lw.setAttribute("data-welt", name);
    tabs.forEach(function (t) {
      var an = t.dataset.welt === name;
      t.classList.toggle("active", an);
      t.setAttribute("aria-selected", an ? "true" : "false");
    });
    panels.forEach(function (p) {
      var an = p.dataset.panel === name;
      p.hidden = !an;
      p.classList.remove("an");
      if (an) {
        /* Reflow, damit die Einflug-Animation neu startet */
        void p.offsetWidth;
        p.classList.add("an");
      }
    });
    if (name === "webapp") starteZaehler();
    if (name === "ki") starteChat();
    if (history.replaceState) history.replaceState(null, "", "#" + name);
  }

  function wechsleZu(name, knopf) {
    if (wechselt || lw.getAttribute("data-welt") === name) return;

    if (ruhig || !wipe) { zeigeWelt(name); return; }

    wechselt = true;
    var r = knopf.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    /* Radius, der von diesem Punkt aus sicher den ganzen Schirm deckt */
    var radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    wipe.style.setProperty("--wipe-farbe", WELT_FARBEN[name] || "#000");
    wipe.classList.remove("weg");
    wipe.style.clipPath = "circle(0px at " + x + "px " + y + "px)";
    void wipe.offsetWidth;
    wipe.classList.add("laueft");
    wipe.style.clipPath = "circle(" + Math.ceil(radius) + "px at " + x + "px " + y + "px)";

    setTimeout(function () {
      zeigeWelt(name);
      wipe.classList.add("weg");
      setTimeout(function () {
        wipe.classList.remove("laueft", "weg");
        wipe.style.clipPath = "circle(0px at 50% 50%)";
        wechselt = false;
      }, 380);
    }, 500);
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { wechsleZu(t.dataset.welt, t); });
  });

  /* ---------- Vorher/Nachher-Schieber ---------- */

  var vergleich = document.getElementById("dio-vergleich");
  var griff = document.getElementById("vg-griff");
  if (vergleich && griff) {
    function setzePos(clientX) {
      var r = vergleich.getBoundingClientRect();
      var p = Math.max(6, Math.min(94, ((clientX - r.left) / r.width) * 100));
      vergleich.style.setProperty("--pos", p + "%");
      griff.setAttribute("aria-valuenow", Math.round(p));
    }
    vergleich.addEventListener("pointerdown", function (e) {
      vergleich.setPointerCapture(e.pointerId);
      setzePos(e.clientX);
    });
    vergleich.addEventListener("pointermove", function (e) {
      if (e.buttons) setzePos(e.clientX);
    });
    griff.addEventListener("keydown", function (e) {
      var jetzt = parseFloat(griff.getAttribute("aria-valuenow")) || 55;
      if (e.key === "ArrowLeft") { e.preventDefault(); jetzt -= 5; }
      else if (e.key === "ArrowRight") { e.preventDefault(); jetzt += 5; }
      else return;
      jetzt = Math.max(6, Math.min(94, jetzt));
      vergleich.style.setProperty("--pos", jetzt + "%");
      griff.setAttribute("aria-valuenow", Math.round(jetzt));
    });
  }

  /* ---------- Zählende Kennzahlen (Welt Webapp) ---------- */

  function starteZaehler() {
    document.querySelectorAll(".da-kpi b[data-zahl]").forEach(function (el) {
      var ziel = parseInt(el.dataset.zahl, 10);
      var suffix = el.dataset.suffix || "";
      if (ruhig) { el.textContent = ziel + suffix; return; }
      var start = performance.now();
      var dauer = 900;
      (function schritt(t) {
        var f = Math.min(1, (t - start) / dauer);
        f = 1 - Math.pow(1 - f, 3);
        el.textContent = Math.round(ziel * f) + suffix;
        if (f < 1) requestAnimationFrame(schritt);
      })(start);
    });
  }

  /* ---------- Chat-Schleife (Welt KI) ---------- */

  var chatTimer = null;
  function starteChat() {
    var chat = document.getElementById("ki-chat");
    if (!chat) return;
    clearTimeout(chatTimer);
    chat.classList.remove("fertig");
    if (ruhig) { chat.classList.add("fertig"); return; }
    chatTimer = setTimeout(function () { chat.classList.add("fertig"); }, 2200);
  }

  /* ---------- Start: Welt aus der Adresse oder Standard ---------- */

  var startWelt = (location.hash || "").replace("#", "");
  if (!WELT_FARBEN[startWelt]) startWelt = "website";
  zeigeWelt(startWelt);

  /* Springt jemand per Link oder Zurück-Taste auf einen anderen Anker
     (z. B. /leistungen#webapp aus dem Footer), wechselt die Welt mit. */
  window.addEventListener("hashchange", function () {
    var welt = (location.hash || "").replace("#", "");
    if (WELT_FARBEN[welt] && lw.getAttribute("data-welt") !== welt) zeigeWelt(welt);
  });
})();
