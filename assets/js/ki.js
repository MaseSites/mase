/* masesites KI-Seite: die Überschrift dekodiert sich wie eine KI-Ausgabe,
   und im Hero-Hintergrund arbeitet ein lebendes neuronales Netz mit lila
   Signalen (Lila ist auf der Website den KI-Begriffen vorbehalten).
   Reine Dekoration: ohne JS oder mit reduzierter Bewegung bleibt alles ruhig. */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = document.querySelector(".hero");
  if (!hero) return;

  /* ---------- 1) Überschrift dekodiert sich Zeichen für Zeichen ---------- */

  var h1 = hero.querySelector("h1");
  if (h1 && !reducedMotion) {
    var GLYPHEN = "abcdefghikmnorstuvwx<>/{}[]#+*=01";
    var DAUER = 1250;
    var WECHSEL = 45; /* ms zwischen zwei Zufalls-Bildern: ruhigeres Flackern */

    /* Textknoten einsammeln (der lila KI-Begriff ist ein eigenes Span) */
    var knoten = [];
    (function sammle(el) {
      Array.prototype.forEach.call(el.childNodes, function (n) {
        if (n.nodeType === 3) knoten.push({ node: n, text: n.nodeValue });
        else if (n.nodeType === 1) sammle(n);
      });
    })(h1);
    var gesamt = 0;
    knoten.forEach(function (k) { gesamt += k.text.length; });

    /* Vorlesern das fertige Ergebnis geben, nicht den Zeichensalat */
    h1.setAttribute("aria-label", h1.textContent);

    var start = null, zuletzt = 0;
    function zufall() { return GLYPHEN[(Math.random() * GLYPHEN.length) | 0]; }

    function frame(t) {
      if (start === null) { start = t; zuletzt = t; }
      var p = Math.min((t - start) / DAUER, 1);
      if (t - zuletzt >= WECHSEL || p === 1) {
        zuletzt = t;
        var fest = Math.floor(p * gesamt);
        var offset = 0;
        knoten.forEach(function (k) {
          var ziel = k.text, aus = "";
          for (var i = 0; i < ziel.length; i++) {
            var c = ziel[i];
            aus += (offset + i < fest || c === " ") ? c : zufall();
          }
          k.node.nodeValue = aus;
          offset += ziel.length;
        });
      }
      if (p < 1) { requestAnimationFrame(frame); return; }
      knoten.forEach(function (k) { k.node.nodeValue = k.text; });
      h1.removeAttribute("aria-label");
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 2) Neuronales Netz im Hero-Hintergrund ---------- */

  var bg = hero.querySelector(".hero-bg");
  if (!bg) return;

  var canvas = document.createElement("canvas");
  canvas.className = "ki-netz";
  canvas.setAttribute("aria-hidden", "true");
  bg.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var REICHWEITE = 150;
  var INK = "44, 33, 24";    /* var(--ink) */
  var LILA = "124, 58, 237"; /* var(--ki)  */

  var breite = 0, hoehe = 0;
  var punkte = [], pulse = [], ringe = [];
  var laeuft = false, imBild = true;

  function messen() {
    var r = bg.getBoundingClientRect();
    breite = Math.max(r.width, 1);
    hoehe = Math.max(r.height, 1);
    canvas.width = Math.round(breite * DPR);
    canvas.height = Math.round(hoehe * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function baueNetz() {
    var n = breite < 720 ? 20 : 36;
    punkte = []; pulse = []; ringe = [];
    for (var i = 0; i < n; i++) {
      punkte.push({
        x: Math.random() * breite,
        y: Math.random() * hoehe,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 1.4 + Math.random() * 1.4,
        hub: Math.random() < 0.15
      });
    }
  }

  function neuerPuls() {
    if (!punkte.length) return;
    var a = (Math.random() * punkte.length) | 0;
    var kandidaten = [];
    for (var j = 0; j < punkte.length; j++) {
      if (j === a) continue;
      var dx = punkte[j].x - punkte[a].x, dy = punkte[j].y - punkte[a].y;
      if (dx * dx + dy * dy < REICHWEITE * REICHWEITE) kandidaten.push(j);
    }
    if (!kandidaten.length) return;
    pulse.push({
      a: a,
      b: kandidaten[(Math.random() * kandidaten.length) | 0],
      t: 0,
      tempo: 0.018 + Math.random() * 0.02
    });
  }

  function malen() {
    ctx.clearRect(0, 0, breite, hoehe);

    /* Linien zwischen nahen Punkten */
    for (var i = 0; i < punkte.length; i++) {
      for (var j = i + 1; j < punkte.length; j++) {
        var dx = punkte[i].x - punkte[j].x, dy = punkte[i].y - punkte[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d >= REICHWEITE) continue;
        ctx.strokeStyle = "rgba(" + INK + "," + (0.11 * (1 - d / REICHWEITE)).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(punkte[i].x, punkte[i].y);
        ctx.lineTo(punkte[j].x, punkte[j].y);
        ctx.stroke();
      }
    }

    /* Lila Signale, die an den Linien entlangwandern */
    pulse = pulse.filter(function (p) {
      p.t += p.tempo;
      var A = punkte[p.a], B = punkte[p.b];
      if (!A || !B) return false;
      if (p.t >= 1) {
        ringe.push({ x: B.x, y: B.y, r: 3, alpha: 0.4 });
        return false;
      }
      var x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
      var xs = A.x + (B.x - A.x) * Math.max(p.t - 0.07, 0);
      var ys = A.y + (B.y - A.y) * Math.max(p.t - 0.07, 0);
      ctx.strokeStyle = "rgba(" + LILA + ",0.35)";
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xs, ys); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = "rgba(" + LILA + ",0.75)";
      ctx.beginPath(); ctx.arc(x, y, 2.1, 0, 6.2832); ctx.fill();
      return true;
    });

    /* Ankunfts-Ringe klingen aus */
    ringe = ringe.filter(function (r) {
      r.r += 0.85; r.alpha -= 0.022;
      if (r.alpha <= 0) return false;
      ctx.strokeStyle = "rgba(" + LILA + "," + r.alpha.toFixed(3) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.2832); ctx.stroke();
      return true;
    });

    /* Punkte: Knoten in Tinte, ein paar Verteiler in Lila */
    punkte.forEach(function (p) {
      ctx.fillStyle = p.hub ? "rgba(" + LILA + ",0.55)" : "rgba(" + INK + ",0.3)";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.hub ? p.r + 1.2 : p.r, 0, 6.2832); ctx.fill();
    });
  }

  function schritt() {
    if (!laeuft) return;
    punkte.forEach(function (p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > breite) p.vx *= -1;
      if (p.y < 0 || p.y > hoehe) p.vy *= -1;
    });
    malen();
    requestAnimationFrame(schritt);
  }

  var pulsTimer = null;
  function starteLauf() {
    if (laeuft || reducedMotion) return;
    laeuft = true;
    pulsTimer = setInterval(neuerPuls, 850);
    requestAnimationFrame(schritt);
  }
  function stoppeLauf() {
    laeuft = false;
    if (pulsTimer) { clearInterval(pulsTimer); pulsTimer = null; }
  }

  messen();
  baueNetz();

  if (reducedMotion) {
    /* Ruhige Variante: ein einziges, stehendes Bild */
    malen();
  } else {
    /* Nur rechnen, wenn der Hero sichtbar ist und der Tab aktiv */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        imBild = entries[0].isIntersecting;
        if (imBild && !document.hidden) starteLauf(); else stoppeLauf();
      }, { threshold: 0.05 }).observe(hero);
    } else {
      starteLauf();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stoppeLauf();
      else if (imBild) starteLauf();
    });
    var rz;
    window.addEventListener("resize", function () {
      clearTimeout(rz);
      rz = setTimeout(function () { messen(); baueNetz(); if (!laeuft) malen(); }, 180);
    });
  }
})();
