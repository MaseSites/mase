/* masesites Startseite: rotierende Headline, Intro-Kamerafahrt und das
   Beispiel-Fenster mit echten Live-Demos (aus dem Admin, /api/inhalte). */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Rotierende Headline ---------- */

  var WORTE = ["dein Restaurant", "dein Event", "deinen Salon", "deinen Shop", "deine App"];
  var rotorWord = document.getElementById("rotor-word");
  var wortIndex = 0;

  function swapWord(wort) {
    if (!rotorWord) return;
    if (reducedMotion) { rotorWord.textContent = wort; return; }
    rotorWord.classList.add("out");
    setTimeout(function () {
      rotorWord.textContent = wort;
      rotorWord.classList.remove("out");
    }, 320);
  }

  /* Rotor auf die Breite des längsten Wortes fixieren: so bleibt die
     Headline stabil bei genau zwei Zeilen, egal welches Wort gerade steht. */
  function fixiereRotorBreite() {
    if (!rotorWord) return;
    var rotor = rotorWord.parentElement;
    var cs = getComputedStyle(rotorWord);
    var probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px";
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontSize = cs.fontSize;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.letterSpacing = cs.letterSpacing;
    document.body.appendChild(probe);
    var max = 0;
    WORTE.forEach(function (w) { probe.textContent = w; max = Math.max(max, probe.getBoundingClientRect().width); });
    probe.remove();
    rotor.style.minWidth = Math.ceil(max + 1) + "px";
  }

  if (rotorWord) {
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fixiereRotorBreite); } else { fixiereRotorBreite(); }
    var rb;
    window.addEventListener("resize", function () { clearTimeout(rb); rb = setTimeout(fixiereRotorBreite, 150); });
    if (!reducedMotion) {
      setInterval(function () {
        wortIndex = (wortIndex + 1) % WORTE.length;
        swapWord(WORTE[wortIndex]);
      }, 4200);
    }
  }

  /* ---------- Intro: Kamerafahrt durch den Bildschirm ----------
     intro.js hat den Monitor-Zustand (html.intro-zoom) vor dem ersten
     Zeichnen gesetzt; hier läuft die Regie: kurz stehen lassen, dann
     wächst der Monitor nahtlos zur echten Startseite. */

  var wurzel = document.documentElement;
  if (wurzel.classList.contains("intro-zoom") && !reducedMotion) {
    setTimeout(function () {
      wurzel.classList.add("intro-fahrt");
      setTimeout(function () {
        wurzel.classList.remove("intro-zoom");
        wurzel.classList.remove("intro-fahrt");
      }, 1750);
    }, 650);
  } else {
    wurzel.classList.remove("intro-zoom");
    wurzel.classList.remove("intro-fahrt");
  }

  /* ---------- Beispiel-Fenster: echte Live-Demos mit Taskbar ----------
     Zeigt die Startansicht der echten Demo-Websites (aus dem Admin) in
     einem Browser-Fenster. Die Taskbar unten schaltet um; fürs Erkunden
     in voller Grösse geht es auf die Beispiele-Seite. */

  var fenster = document.getElementById("demo-fenster");
  var frame = document.getElementById("demo-frame");
  var taskbar = document.getElementById("demo-taskbar");
  var frameUrl = document.getElementById("frame-url");
  var sektion = document.getElementById("beispiel");
  if (!fenster || !frame || !taskbar) return;

  var demoListe = [];        /* { demo, knopf } in Reihenfolge */
  var demoIndex = 0;
  var demoTimer = null;
  var demoManuell = false;   /* hat jemand geklickt, bleibt die Automatik aus */
  var DEMO_WECHSEL_MS = 8000;

  /* Beim Wechsel weich einblenden: iframe startet unsichtbar und wird
     sichtbar, sobald die neue Seite geladen ist */
  frame.addEventListener("load", function () { frame.style.opacity = "1"; });

  function zeigeDemo(index) {
    var eintrag = demoListe[index];
    if (!eintrag) return;
    demoIndex = index;
    frame.style.opacity = "0";
    frame.src = eintrag.demo.url;
    if (frameUrl) {
      frameUrl.textContent = /^https?:\/\//i.test(eintrag.demo.url)
        ? eintrag.demo.url.replace(/^https?:\/\//i, "")
        : location.host + eintrag.demo.url;
    }
    taskbar.querySelectorAll(".chip").forEach(function (c) {
      var an = c === eintrag.knopf;
      c.classList.toggle("active", an);
      c.setAttribute("aria-pressed", an ? "true" : "false");
    });
  }

  /* Automatik: alle paar Sekunden zur nächsten Demo, aber nur solange das
     Fenster sichtbar ist und niemand von Hand gewählt hat */
  function starteDemoAuto() {
    if (demoTimer || demoManuell || reducedMotion || demoListe.length < 2) return;
    demoTimer = setInterval(function () {
      zeigeDemo((demoIndex + 1) % demoListe.length);
    }, DEMO_WECHSEL_MS);
  }
  function stoppeDemoAuto() {
    if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
  }

  fetch("/api/inhalte", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (daten) {
      var demos = (daten && Array.isArray(daten.beispiele)) ? daten.beispiele : [];
      if (!demos.length) {
        if (sektion) sektion.hidden = true;
        return;
      }
      demos.forEach(function (demo, i) {
        var knopf = document.createElement("button");
        knopf.className = "chip";
        knopf.type = "button";
        knopf.textContent = demo.name;
        knopf.setAttribute("aria-pressed", "false");
        knopf.addEventListener("click", function () {
          demoManuell = true;
          stoppeDemoAuto();
          zeigeDemo(i);
        });
        taskbar.appendChild(knopf);
        demoListe.push({ demo: demo, knopf: knopf });
      });
      zeigeDemo(0);
      var alle = document.createElement("a");
      alle.className = "taskbar-link";
      alle.href = "/beispiele";
      alle.textContent = "Alle Demos →";
      taskbar.appendChild(alle);
      fenster.hidden = false;

      /* Nur rotieren, wenn das Fenster wirklich im Bild ist */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (eintraege) {
          eintraege.forEach(function (e) {
            if (e.isIntersecting) starteDemoAuto();
            else stoppeDemoAuto();
          });
        }, { threshold: 0.35 }).observe(fenster);
      } else {
        starteDemoAuto();
      }
      window.addEventListener("beforeunload", stoppeDemoAuto);
    })
    .catch(function () { if (sektion) sektion.hidden = true; });
})();
