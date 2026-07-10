/* Projekt-Filter über die Branchen-Chips (Seite projekte.html).
   Eigene Datei statt Inline-Script wegen der Content-Security-Policy. */
(function () {
  var chips = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("#work-grid .work-card");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      cards.forEach(function (card) {
        var show = f === "alle" || card.getAttribute("data-cat") === f;
        card.style.display = show ? "" : "none";
      });
    });
  });
})();
