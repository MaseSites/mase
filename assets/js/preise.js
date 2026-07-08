/* masesites Preise: Paket-Konfigurator.
   Jede Karte mit [data-select] ist anklickbar; die Leiste unten zählt live zusammen.
   Preis-Attribute: data-once (einmalig), data-month (pro Monat), data-year (pro Jahr), data-ab (Ab-Preis).
   data-group: nur eine Auswahl pro Gruppe. data-excludes: schliesst andere data-id-Karten aus. */

(function () {
  "use strict";

  var items = Array.prototype.slice.call(document.querySelectorAll("[data-select]"));
  if (!items.length) return;

  var bar = document.getElementById("builder-bar");
  var sumEl = document.getElementById("builder-sum");
  var resetBtn = document.getElementById("builder-reset");
  var cta = document.getElementById("builder-cta");

  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'"); }

  function setSelected(el, on) {
    el.classList.toggle("selected", on);
    var btn = el.querySelector(".select-btn");
    if (btn) btn.textContent = on ? "Ausgewählt" : "Auswählen";
  }

  function selection() {
    return items.filter(function (el) { return el.classList.contains("selected"); });
  }

  function priceParts(el, kurz) {
    var p = [];
    var once = Number(el.getAttribute("data-once") || 0);
    var month = Number(el.getAttribute("data-month") || 0);
    var year = Number(el.getAttribute("data-year") || 0);
    var ab = el.hasAttribute("data-ab") ? "ab " : "";
    if (once) p.push(ab + "CHF " + fmt(once) + (kurz ? ".–" : ".– einmalig"));
    if (month) p.push("CHF " + fmt(month) + ".–/Monat");
    if (year) p.push("CHF " + fmt(year) + ".–/Jahr");
    return p;
  }

  function update() {
    var sel = selection();
    var once = 0, month = 0, year = 0, ab = false;
    sel.forEach(function (el) {
      once += Number(el.getAttribute("data-once") || 0);
      month += Number(el.getAttribute("data-month") || 0);
      year += Number(el.getAttribute("data-year") || 0);
      if (el.hasAttribute("data-ab")) ab = true;
    });
    var parts = [];
    if (once) parts.push((ab ? "ab " : "") + "CHF " + fmt(once) + ".– einmalig");
    if (month) parts.push("CHF " + fmt(month) + ".– pro Monat");
    if (year) parts.push("CHF " + fmt(year) + ".– pro Jahr");
    if (sumEl) sumEl.textContent = parts.join(" · ");
    var show = sel.length > 0;
    if (bar) bar.classList.toggle("show", show);
    document.body.classList.toggle("builder-active", show);
  }

  function toggle(el) {
    var willSelect = !el.classList.contains("selected");
    if (willSelect) {
      var group = el.getAttribute("data-group");
      if (group) {
        items.forEach(function (o) {
          if (o !== el && o.getAttribute("data-group") === group) setSelected(o, false);
        });
      }
      (el.getAttribute("data-excludes") || "").split(",").forEach(function (id) {
        id = id.trim();
        if (!id) return;
        items.forEach(function (o) {
          if (o.getAttribute("data-id") === id) setSelected(o, false);
        });
      });
      /* Umgekehrt: wer eine ausgeschlossene Karte wählt, wirft den Ausschliesser raus */
      var myId = el.getAttribute("data-id");
      if (myId) {
        items.forEach(function (o) {
          var ex = (o.getAttribute("data-excludes") || "").split(",").map(function (s) { return s.trim(); });
          if (o !== el && ex.indexOf(myId) > -1) setSelected(o, false);
        });
      }
    }
    setSelected(el, willSelect);
    update();
  }

  items.forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (e.target.closest("a")) return; /* Links in der Karte normal folgen lassen */
      toggle(el);
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      items.forEach(function (el) { setSelected(el, false); });
      update();
    });
  }

  /* Auswahl mitnehmen: landet als vorformulierte Nachricht im Kontaktformular */
  if (cta) {
    cta.addEventListener("click", function () {
      var sel = selection();
      if (!sel.length) return;
      var lines = sel.map(function (el) {
        return "- " + el.getAttribute("data-name") + " (" + priceParts(el, true).join(", ") + ")";
      });
      var total = sumEl ? sumEl.textContent : "";
      sessionStorage.setItem(
        "ms_paket",
        "Mein Wunschpaket:\n" + lines.join("\n") + "\n\nTotal: " + total + "\n\nWorum es geht: "
      );
    });
  }
})();
