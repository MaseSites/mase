/* masesites – Preisliste.
   Jede Zeile lässt sich einzeln anfragen. Beim Wechsel aufs
   Kontaktformular wird nur die Leistung übergeben (ms_interesse),
   nicht Paketname oder Preis: dort werden damit die passenden
   Interessen angehakt, die Nachricht bleibt leer.
   Bewusst kein Rechner: die Liste soll lesbar bleiben, die
   verbindliche Zahl kommt mit der Offerte. */

(function () {
  "use strict";

  var zeilen = Array.prototype.slice.call(document.querySelectorAll(".pl-zeile[data-anfrage], .pl-stufe[data-anfrage]"));
  if (!zeilen.length) return;

  var gewaehlt = [];

  function aktualisiereLeiste() {
    var leiste = document.getElementById("pl-leiste");
    if (!gewaehlt.length) {
      if (leiste) leiste.remove();
      return;
    }
    if (!leiste) {
      leiste = document.createElement("div");
      leiste.id = "pl-leiste";
      leiste.className = "pl-leiste";
      leiste.innerHTML =
        '<span class="pl-leiste-text"></span>' +
        '<a class="btn btn-primary" href="/kontakt">Anfrage senden <span class="arrow">→</span></a>';
      document.body.appendChild(leiste);
      requestAnimationFrame(function () { leiste.classList.add("da"); });
    }
    leiste.querySelector(".pl-leiste-text").textContent =
      gewaehlt.length === 1
        ? "1 Position ausgewählt"
        : gewaehlt.length + " Positionen ausgewählt";
    merke();
  }

  /* Auswahl für das Kontaktformular hinterlegen.
     Bewusst NUR die Leistung, ohne Paketname und ohne Preis: Im
     Kontaktformular werden damit die passenden Interessen angehakt.
     Die Nachricht bleibt leer, damit dort niemand gegen eine bereits
     ausgefüllte Preisliste anschreiben muss. */
  function merke() {
    var interessen = [];
    gewaehlt.forEach(function (g) {
      if (g.interesse && interessen.indexOf(g.interesse) === -1) interessen.push(g.interesse);
    });
    try {
      if (interessen.length) sessionStorage.setItem("ms_interesse", interessen.join("|"));
      else sessionStorage.removeItem("ms_interesse");
    } catch (e) { /* Speichern gesperrt: dann eben ohne Vorbelegung */ }
  }

  zeilen.forEach(function (zeile) {
    var knopf = zeile.querySelector(".pl-anfragen");
    if (!knopf) return;
    var titel = zeile.getAttribute("data-anfrage");
    var interesse = zeile.getAttribute("data-interesse") || "";
    knopf.addEventListener("click", function () {
      var i = -1;
      gewaehlt.forEach(function (g, n) { if (g.titel === titel) i = n; });
      if (i > -1) {
        gewaehlt.splice(i, 1);
        knopf.classList.remove("gewaehlt");
        knopf.textContent = "Anfragen";
      } else {
        gewaehlt.push({ titel: titel, interesse: interesse });
        knopf.classList.add("gewaehlt");
        knopf.textContent = "Ausgewählt ✓";
      }
      aktualisiereLeiste();
    });
  });

  /* Der Lotse öffnet den Chat-Assistenten unten rechts. Der Knopf wird
     von site.js erst nachträglich eingehängt – deshalb suchen wir ihn
     beim Klick, nicht beim Laden. */
  var lotse = document.getElementById("pl-bot-oeffnen");
  if (lotse) {
    lotse.addEventListener("click", function () {
      var starter = document.querySelector(".widget-launcher");
      if (!starter) return;
      var panel = document.querySelector(".widget-panel");
      if (!panel || !panel.classList.contains("open")) starter.click();
      /* Kurz warten, bis das Fenster offen ist, dann dorthin scrollen */
      setTimeout(function () {
        var p = document.querySelector(".widget-panel");
        if (p) p.scrollIntoView({ block: "nearest", behavior: "smooth" });
        var feld = document.querySelector(".widget-panel input, .widget-panel textarea");
        if (feld) feld.focus();
      }, 320);
    });
  }
})();

/* ---------- Paket-Finder ----------
   Eine Frage, vier Antworten, danach direkt zum passenden Preisblock.
   Die frueheren Erklaer-Karten standen fuer alle Besucher oben auf der
   Seite; ihre Inhalte stecken jetzt kompakt im Ergebnis - man liest nur
   noch, was zur eigenen Auswahl gehoert. */
(function () {
  "use strict";

  var pf = document.querySelector(".pf");
  if (!pf) return;

  var ANTWORTEN = {
    website: {
      titel: "Neue Website",
      text: "Von Grund auf neu gebaut, auf deine Branche zugeschnitten und für Mobilgeräte optimiert. Besucher können etwas nachlesen und dich unkompliziert kontaktieren.",
      ab: "ab CHF 750.–",
      ziel: "#website"
    },
    ueberarbeitung: {
      titel: "Überarbeitung",
      text: "Auch Redesign genannt: Deine Inhalte bleiben, erneuert werden Aussehen, Handy-Ansicht und Technik. Deutlich günstiger als ein Neubau.",
      ab: "ab CHF 250.–",
      ziel: "#ueberarbeitung"
    },
    webapp: {
      titel: "Webapp",
      text: "Login, Datenbank und Dashboard: eine Anwendung im Browser für deine Abläufe. Faustregel: Machst du sie morgens auf, um darin zu arbeiten? Dann Webapp.",
      ab: "ab CHF 3'500.–",
      ziel: "#webapp"
    },
    ki: {
      titel: "KI-Assistent",
      text: "Ein Chat, der rund um die Uhr Fragen beantwortet und Anfragen aufnimmt. Lässt sich auch nachträglich in eine bestehende Website einbauen.",
      ab: "CHF 200.– Einrichtung + CHF 40.–/Monat",
      ziel: "#ki"
    }
  };

  var frageBox = pf.querySelector(".pf-frage");
  var ergebnisBox = pf.querySelector(".pf-ergebnis");
  var titel = pf.querySelector(".pf-titel");
  var text = pf.querySelector(".pf-text");
  var ab = pf.querySelector(".pf-ab");
  var hin = pf.querySelector(".pf-hin");

  function zeigeErgebnis(schluessel) {
    var a = ANTWORTEN[schluessel];
    if (!a) return;
    titel.textContent = a.titel;
    text.textContent = a.text;
    ab.textContent = a.ab;
    hin.setAttribute("href", a.ziel);
    frageBox.hidden = true;
    ergebnisBox.hidden = false;
    pf.setAttribute("data-schritt", "ergebnis");
    /* Nicht automatisch wegspringen: Wer die Empfehlung noch liest,
       soll nicht mitten im Satz weggescrollt werden. */
  }

  pf.querySelectorAll(".pf-opt").forEach(function (knopf) {
    knopf.addEventListener("click", function () {
      zeigeErgebnis(knopf.getAttribute("data-ziel"));
    });
  });

  pf.querySelector(".pf-zurueck").addEventListener("click", function () {
    ergebnisBox.hidden = true;
    frageBox.hidden = false;
    pf.setAttribute("data-schritt", "frage");
  });

  /* Der Knopf im Fliesstext oeffnet den Chat-Assistenten */
  var botKnopf = document.getElementById("pf-bot");
  if (botKnopf) {
    botKnopf.addEventListener("click", function () {
      var launcher = document.querySelector(".widget-launcher");
      if (launcher) launcher.click();
    });
  }
})();
