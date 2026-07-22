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
    if (name === "ki") { starteChat(); starteNetz(); } else { stoppeNetz(); }
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

    if (name === "ki") zuendeBlitz();
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

  /* ---------- Neon-Blitz: zwei Klingen fegen beim KI-Wechsel durchs Bild ---------- */

  var blitz = null;
  function zuendeBlitz() {
    if (ruhig) return;
    if (!blitz) {
      blitz = document.createElement("div");
      blitz.className = "lw-blitz";
      blitz.setAttribute("aria-hidden", "true");
      blitz.innerHTML = "<i></i><i></i>";
      document.body.appendChild(blitz);
    }
    blitz.classList.remove("zuendet");
    void blitz.offsetWidth;
    blitz.classList.add("zuendet");
    setTimeout(function () { blitz.classList.remove("zuendet"); }, 1100);
  }

  /* ---------- Partikelnetz: schwebende Punkte, die sich verbinden ---------- */

  var netz = document.getElementById("ki-netz");
  var netzLauf = null;
  var punkte = [];

  function baueNetz() {
    var panel = netz.closest(".lw-welt");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var b = panel.clientWidth, h = panel.clientHeight;
    netz.width = b * dpr; netz.height = h * dpr;
    netz.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    var anzahl = b < 720 ? 28 : 55;
    punkte = [];
    for (var i = 0; i < anzahl; i++) {
      punkte.push({
        x: Math.random() * b, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 1.8
      });
    }
    return { b: b, h: h };
  }

  function starteNetz() {
    if (ruhig || !netz || netzLauf) return;
    var mass = baueNetz();
    var ctx = netz.getContext("2d");
    var NAH = 130;
    function frame() {
      ctx.clearRect(0, 0, mass.b, mass.h);
      for (var i = 0; i < punkte.length; i++) {
        var p = punkte[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > mass.b) p.vx *= -1;
        if (p.y < 0 || p.y > mass.h) p.vy *= -1;
      }
      for (var a = 0; a < punkte.length; a++) {
        for (var z = a + 1; z < punkte.length; z++) {
          var dx = punkte[a].x - punkte[z].x;
          var dy = punkte[a].y - punkte[z].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < NAH) {
            var kraft = 1 - d / NAH;
            ctx.strokeStyle = "rgba(139, 92, 246, " + (0.28 * kraft).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(punkte[a].x, punkte[a].y);
            ctx.lineTo(punkte[z].x, punkte[z].y);
            ctx.stroke();
          }
        }
      }
      for (var j = 0; j < punkte.length; j++) {
        var q = punkte[j];
        ctx.fillStyle = j % 4 === 0 ? "rgba(56, 225, 255, 0.8)" : "rgba(168, 139, 250, 0.8)";
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        ctx.fill();
      }
      netzLauf = requestAnimationFrame(frame);
    }
    netzLauf = requestAnimationFrame(frame);
  }

  function stoppeNetz() {
    if (netzLauf) { cancelAnimationFrame(netzLauf); netzLauf = null; }
  }

  /* Bei Grössenänderung neu vermessen; im Hintergrund pausieren */
  window.addEventListener("resize", function () {
    if (netzLauf) { stoppeNetz(); starteNetz(); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stoppeNetz();
    else if (lw.getAttribute("data-welt") === "ki") starteNetz();
  });

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
