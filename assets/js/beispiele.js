/* masesites Beispiele: Live-Demos kommen aus dem Admin-Bereich (/api/inhalte)
   und öffnen sich per Klick im Vollbild statt in einem neuen Tab. */

(function () {
  "use strict";

  var grid = document.getElementById("demo-grid");
  if (!grid) return;

  /* ---------- Vollbild-Ansicht ---------- */

  var viewer = null;

  function schliesseVollbild() {
    if (!viewer) return;
    viewer.remove();
    viewer = null;
    document.body.classList.remove("demo-offen");
    document.removeEventListener("keydown", aufEscape);
  }
  function aufEscape(e) {
    if (e.key === "Escape") schliesseVollbild();
  }

  function oeffneVollbild(demo) {
    schliesseVollbild();
    viewer = document.createElement("div");
    viewer.className = "demo-vollbild";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-label", demo.name + " im Vollbild");

    var kopf = document.createElement("div");
    kopf.className = "demo-vollbild-kopf";

    var name = document.createElement("b");
    name.textContent = demo.name;
    kopf.appendChild(name);

    if (demo.branche) {
      var tag = document.createElement("span");
      tag.className = "pill arbeit";
      tag.textContent = demo.branche;
      kopf.appendChild(tag);
    }

    var neuTab = document.createElement("a");
    neuTab.className = "neu-tab";
    neuTab.href = demo.url;
    neuTab.target = "_blank";
    neuTab.rel = "noopener";
    neuTab.textContent = "In neuem Tab öffnen ↗";
    kopf.appendChild(neuTab);

    var zu = document.createElement("button");
    zu.className = "schliessen";
    zu.type = "button";
    zu.setAttribute("aria-label", "Vollbild schließen");
    zu.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    zu.addEventListener("click", schliesseVollbild);
    kopf.appendChild(zu);

    var frame = document.createElement("iframe");
    frame.src = demo.url;
    frame.title = demo.name + " (Live-Demo)";
    frame.setAttribute("loading", "eager");

    viewer.appendChild(kopf);
    viewer.appendChild(frame);
    document.body.appendChild(viewer);
    document.body.classList.add("demo-offen");
    document.addEventListener("keydown", aufEscape);
    zu.focus();
  }

  /* ---------- Karten aus den Admin-Inhalten ---------- */

  function karte(demo) {
    var card = document.createElement("article");
    card.className = "work-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", demo.name + " im Vollbild ansehen");

    var thumb = document.createElement("div");
    thumb.className = "work-thumb shot";
    var badge = document.createElement("span");
    badge.className = "work-badge real";
    badge.textContent = "Live-Demo";
    thumb.appendChild(badge);
    if (demo.bild) {
      var img = document.createElement("img");
      img.src = demo.bild;
      img.alt = "Website " + demo.name + ", echtes Live-Demo von masesites";
      img.loading = "lazy";
      img.onerror = function () { img.remove(); };
      thumb.appendChild(img);
    }
    card.appendChild(thumb);

    var meta = document.createElement("div");
    meta.className = "work-meta";
    var h3 = document.createElement("h3");
    h3.textContent = demo.name;
    meta.appendChild(h3);
    var p = document.createElement("p");
    if (demo.branche) {
      var b = document.createElement("strong");
      b.textContent = demo.branche;
      p.appendChild(b);
      if (demo.beschreibung) p.appendChild(document.createTextNode(" · " + demo.beschreibung));
    } else {
      p.textContent = demo.beschreibung || "";
    }
    meta.appendChild(p);
    var link = document.createElement("span");
    link.className = "work-link";
    link.textContent = "Im Vollbild ansehen →";
    meta.appendChild(link);
    card.appendChild(meta);

    function auf() { oeffneVollbild(demo); }
    card.addEventListener("click", auf);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); auf(); }
    });
    return card;
  }

  fetch("/api/inhalte", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (daten) {
      if (!daten || !Array.isArray(daten.beispiele)) return; /* Server nicht erreichbar: eingebaute Karten behalten */
      grid.innerHTML = "";
      if (!daten.beispiele.length) {
        var sektion = document.getElementById("demo-sektion");
        if (sektion) sektion.classList.add("hidden");
        return;
      }
      daten.beispiele.forEach(function (demo) { grid.appendChild(karte(demo)); });
    })
    .catch(function () {});
})();
