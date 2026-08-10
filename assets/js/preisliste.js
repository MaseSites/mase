/* masesites – Preisliste.
   Jede Zeile lässt sich einzeln anfragen. Beim Wechsel aufs
   Kontaktformular wird nur die Leistung übergeben (ms_interesse),
   nicht Paketname oder Preis: dort werden damit die passenden
   Interessen angehakt, die Nachricht bleibt leer.
   Bewusst kein Rechner: die Liste soll lesbar bleiben, die
   verbindliche Zahl kommt mit der Offerte. */

(function () {
  "use strict";

  var zeilen = Array.prototype.slice.call(document.querySelectorAll(".pl-stufe[data-anfrage]"));
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
    var standardText = knopf.textContent;
    knopf.addEventListener("click", function () {
      var i = -1;
      gewaehlt.forEach(function (g, n) { if (g.titel === titel) i = n; });
      if (i > -1) {
        gewaehlt.splice(i, 1);
        knopf.classList.remove("gewaehlt");
        knopf.textContent = standardText;
      } else {
        gewaehlt.push({ titel: titel, interesse: interesse });
        knopf.classList.add("gewaehlt");
        knopf.textContent = "Ausgewählt ✓";
      }
      aktualisiereLeiste();
    });
  });
})();
