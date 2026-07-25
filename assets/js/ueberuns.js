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

  var timer = [], fertig = false, szene = null;
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
         Wenn der letzte Abschnitt gebaut ist, steht die Seite bereits
         fertig da - es gibt nichts mehr aufzudecken. Frueher fuhr hier
         noch ein Vorhang ueber die ganze Seite und blendete alles ein
         zweites Mal ein; das wirkte wie ein Fehler, weil fertiger
         Inhalt grundlos wieder verschwand und neu erschien.
         Jetzt blendet nur noch der Coder aus - ein Schritt, keine
         zweite Uebergangsschicht. */
      var bauEnde = 520 + teile.length * 380 + 480;

      nach(bauEnde + 420, function () {
        if (fertig) return;
        if (!szene) return;
        /* Echte Hoehe messen, damit die Szene genau um ihre eigene
           Hoehe nach oben faehrt und der Inhalt darunter passgenau
           nachrueckt - ein fester Wert wuerde je nach Bildschirm
           entweder eine Luecke oder einen Sprung erzeugen. */
        szene.style.setProperty("--uu-hoehe", szene.offsetHeight + "px");
        void szene.offsetHeight;
        szene.classList.add("uu-zieht");   /* Text schiebt den Coder hinaus */
      });

      nach(bauEnde + 420 + 700, function () {
        if (fertig) return;
        wurzel.classList.remove("uu-bau");             /* Szene weg, Seite normal */
        fertig = true;
        skipHoerer(false);
      });
    });
  });

  /* Sicherheitsnetz: die Seite darf nie leer oder verdeckt hängen bleiben */
  setTimeout(abschliessen, 12000);
})();
