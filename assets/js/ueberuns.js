/* Über uns: die Seite startet leer, nur der Coder sitzt am Schreibtisch und
   tippt. Die Überschrift schreibt sich Zeichen für Zeichen, danach bauen sich
   die Sektionen nacheinander nach unten auf, als würde er sie gerade coden.
   Liegt wie intro.js früh im Body, damit der Bau-Zustand vor dem ersten
   Zeichnen gesetzt ist (die Content-Security-Policy erlaubt nur eigene
   Script-Dateien, darum keine Inline-Scripts).
   Klick, Taste oder Scrollen überspringt das Intro sofort. */

(function () {
  var d = document, wurzel = d.documentElement;
  var wenigBewegung = false;
  try { wenigBewegung = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (wenigBewegung || d.hidden) return;

  wurzel.classList.add("uu-bau");

  var timer = [], fertig = false, vorhang = null, szene = null;
  function nach(ms, fn) { timer.push(setTimeout(fn, ms)); }

  var SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];
  function skipHoerer(an) {
    SKIP_EVENTS.forEach(function (ev) {
      (an ? addEventListener : removeEventListener)(ev, abschliessen, true);
    });
  }

  /* Sofort zum Endzustand: alles sichtbar, Coder weg, keine offenen Timer */
  function abschliessen() {
    if (fertig) return;
    fertig = true;
    timer.forEach(clearTimeout);
    skipHoerer(false);
    var h1 = d.getElementById("uu-titel");
    if (h1) {
      h1.textContent = h1.getAttribute("data-uu-text") || h1.textContent;
      h1.removeAttribute("aria-label");
      h1.classList.add("uu-tippt");
    }
    var lead = d.querySelector(".uu-hero .lead");
    if (lead) lead.classList.add("uu-an");
    d.querySelectorAll(".uu-teil").forEach(function (t) { t.classList.add("uu-fertig"); });
    if (vorhang && vorhang.parentNode) vorhang.parentNode.removeChild(vorhang);
    vorhang = null;
    wurzel.classList.remove("uu-bau"); /* Coder-Szene verschwindet ueber CSS */
  }

  addEventListener("DOMContentLoaded", function () {
    if (fertig) return;
    var h1 = d.getElementById("uu-titel");
    if (!h1) { abschliessen(); return; }
    szene = d.querySelector(".uu-szene");
    skipHoerer(true);

    var text = h1.textContent;
    h1.setAttribute("data-uu-text", text);
    h1.setAttribute("aria-label", text); /* Vorleser bekommen den ganzen Satz */
    h1.textContent = "";
    var caret = d.createElement("span");
    caret.className = "uu-caret";
    caret.setAttribute("aria-hidden", "true");
    h1.appendChild(caret);
    h1.classList.add("uu-tippt");

    var teile = Array.prototype.slice.call(d.querySelectorAll(".uu-teil"));
    var lead = d.querySelector(".uu-hero .lead");
    var i = 0;

    nach(550, function schreibe() {
      if (fertig) return;
      i++;
      h1.textContent = text.slice(0, i);
      h1.appendChild(caret);
      if (i < text.length) { nach(26, schreibe); return; }

      /* Überschrift steht: Caret kurz blinken lassen, dann weiterbauen */
      h1.removeAttribute("aria-label");
      nach(450, function () { caret.remove(); });
      nach(200, function () { if (lead) lead.classList.add("uu-an"); });

      teile.forEach(function (teil, k) {
        nach(520 + k * 380, function () {
          teil.classList.add("uu-baut");
          teil.addEventListener("animationend", function () {
            teil.classList.add("uu-fertig");
          }, { once: true });
        });
      });

      /* ---------- Finale ----------
         1) der Coder steht auf, 2) er duckt sich und zieht die fertige Seite
         wie ein Tuch von unten ueber sich hoch, 3) darunter ist er verschwunden
         und die Website steht sauber wieder ganz oben. */
      var bauEnde = 520 + teile.length * 380 + 480;

      nach(bauEnde, function () {                 /* 1) aufstehen */
        if (szene) szene.classList.add("uu-steht");
      });

      nach(bauEnde + 620, function () {           /* 2) ducken + Seite hochziehen */
        if (fertig) return;
        if (szene) szene.classList.add("uu-zieht");
        vorhang = d.createElement("div");
        vorhang.className = "uu-vorhang";
        vorhang.setAttribute("aria-hidden", "true");
        d.body.appendChild(vorhang);
        void vorhang.offsetHeight;                /* Reflow, damit die Fahrt animiert */
        vorhang.classList.add("hoch");
      });

      nach(bauEnde + 620 + 940, function () {      /* 3) verdeckt: aufraeumen + aufdecken */
        if (fertig) return;
        window.scrollTo(0, 0);
        wurzel.classList.remove("uu-bau");         /* Coder verschwindet, Seite final */
        if (vorhang) { void vorhang.offsetHeight; vorhang.classList.add("weg"); }
        nach(560, function () {
          if (vorhang && vorhang.parentNode) vorhang.parentNode.removeChild(vorhang);
          vorhang = null;
          fertig = true;
          skipHoerer(false);
        });
      });
    });
  });

  /* Sicherheitsnetz: die Seite darf nie leer oder verdeckt hängen bleiben */
  setTimeout(abschliessen, 12000);
})();
