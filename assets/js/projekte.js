/* masesites Projekte: Referenz-Projekte kommen aus dem Admin-Bereich
   (/api/inhalte). Klick auf ein Projekt öffnet die Detailansicht mit
   Firma, Beschreibung und Website-Vorschau (Routing über den Hash). */

(function () {
  "use strict";

  var grid = document.getElementById("projekte-grid");
  if (!grid) return;

  var leer = document.getElementById("projekte-leer");
  var uebersicht = document.getElementById("projekte-uebersicht");
  var detail = document.getElementById("projekt-detail");
  var hero = document.getElementById("projekte-hero");
  var PROJEKTE = [];

  function karte(p) {
    var card = document.createElement("article");
    card.className = "work-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Projekt " + p.firma + " ansehen");

    var thumb = document.createElement("div");
    thumb.className = "work-thumb shot";
    var badge = document.createElement("span");
    badge.className = "work-badge real";
    badge.textContent = "Kundenprojekt";
    thumb.appendChild(badge);
    if (p.bild) {
      var img = document.createElement("img");
      img.src = p.bild;
      img.alt = "Website von " + p.firma;
      img.loading = "lazy";
      img.onerror = function () { img.remove(); };
      thumb.appendChild(img);
    }
    card.appendChild(thumb);

    var meta = document.createElement("div");
    meta.className = "work-meta";
    var h3 = document.createElement("h3");
    h3.textContent = p.firma;
    meta.appendChild(h3);
    var text = document.createElement("p");
    if (p.branche) {
      var b = document.createElement("strong");
      b.textContent = p.branche;
      text.appendChild(b);
      if (p.beschreibung) text.appendChild(document.createTextNode(" · " + kurz(p.beschreibung, 90)));
    } else {
      text.textContent = kurz(p.beschreibung, 110);
    }
    meta.appendChild(text);
    var link = document.createElement("span");
    link.className = "work-link";
    link.textContent = "Projekt ansehen →";
    meta.appendChild(link);
    card.appendChild(meta);

    function auf() { location.hash = p.id; }
    card.addEventListener("click", auf);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); auf(); }
    });
    return card;
  }

  function kurz(text, laenge) {
    text = String(text || "");
    return text.length > laenge ? text.slice(0, laenge) + "…" : text;
  }

  function zeigeListe() {
    detail.classList.add("hidden");
    uebersicht.classList.remove("hidden");
    hero.classList.remove("hidden");
    grid.classList.toggle("hidden", PROJEKTE.length === 0);
    leer.classList.toggle("hidden", PROJEKTE.length > 0);
  }

  function zeigeDetail(p) {
    hero.classList.add("hidden");
    uebersicht.classList.add("hidden");
    detail.classList.remove("hidden");

    document.getElementById("pd-firma").textContent = p.firma;
    document.title = p.firma + " | Projekte | masesites";

    var meta = document.getElementById("pd-meta");
    meta.textContent = "";
    if (p.branche) {
      var tag = document.createElement("span");
      tag.className = "pill arbeit";
      tag.textContent = p.branche;
      meta.appendChild(tag);
    }

    document.getElementById("pd-beschreibung").textContent = p.beschreibung || "";

    var aktionen = document.getElementById("pd-aktionen");
    aktionen.textContent = "";
    if (p.url) {
      var besuch = document.createElement("a");
      besuch.className = "btn btn-primary";
      besuch.href = p.url;
      besuch.target = "_blank";
      besuch.rel = "noopener";
      besuch.innerHTML = 'Website besuchen <span class="arrow">→</span>';
      aktionen.appendChild(besuch);
    }

    /* Vorschau: eigenes Bild, sonst die Website eingebettet */
    var rahmen = document.getElementById("pd-vorschau");
    var medien = document.getElementById("pd-medien");
    var urlZeile = document.getElementById("pd-url");
    medien.textContent = "";
    if (p.bild || p.url) {
      rahmen.classList.remove("hidden");
      urlZeile.textContent = p.url || "";
      if (p.bild) {
        var img = document.createElement("img");
        img.src = p.bild;
        img.alt = "Website von " + p.firma;
        medien.appendChild(img);
      } else {
        var frame = document.createElement("iframe");
        frame.src = p.url;
        frame.title = "Website von " + p.firma;
        frame.setAttribute("loading", "lazy");
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
        medien.appendChild(frame);
      }
    } else {
      rahmen.classList.add("hidden");
    }
    window.scrollTo(0, 0);
  }

  function route() {
    var id = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    var treffer = null;
    PROJEKTE.forEach(function (p) { if (p.id === id) treffer = p; });
    if (treffer) zeigeDetail(treffer);
    else { document.title = "Projekte | masesites"; zeigeListe(); }
  }

  document.getElementById("projekt-zurueck").addEventListener("click", function () {
    if (location.hash) location.hash = "";
    else zeigeListe();
  });
  window.addEventListener("hashchange", route);

  fetch("/api/inhalte", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (daten) {
      PROJEKTE = (daten && Array.isArray(daten.projekte)) ? daten.projekte : [];
      grid.innerHTML = "";
      PROJEKTE.forEach(function (p, i) {
        var c = karte(p);
        c.style.setProperty("--sx", i); /* Listen-Kaskade auch für nachgeladene Karten */
        grid.appendChild(c);
      });
      route();
    })
    .catch(function () { route(); });
})();
