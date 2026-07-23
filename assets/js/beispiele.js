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
    /* Abgedunkelter Hintergrund mit Rand: man sieht, dass die Demo IN
       masesites geöffnet ist und jederzeit zurück kann */
    viewer = document.createElement("div");
    viewer.className = "demo-vollbild";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-label", demo.name + " als Live-Demo");
    viewer.addEventListener("click", function (e) {
      if (e.target === viewer) schliesseVollbild();
    });

    var rahmen = document.createElement("div");
    rahmen.className = "demo-vollbild-rahmen";

    var kopf = document.createElement("div");
    kopf.className = "demo-vollbild-kopf";

    var marke = document.createElement("span");
    marke.className = "dv-marke";
    marke.textContent = "masesites";
    kopf.appendChild(marke);

    var pill = document.createElement("span");
    pill.className = "pill arbeit";
    pill.textContent = "Live-Demo";
    kopf.appendChild(pill);

    var name = document.createElement("b");
    name.textContent = demo.name;
    kopf.appendChild(name);

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
    zu.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Schliessen</span>';
    zu.addEventListener("click", schliesseVollbild);
    kopf.appendChild(zu);

    var frame = document.createElement("iframe");
    /* Interne Demos immer frisch laden (alte Browser-Kopien umgehen) */
    frame.src = demo.url.indexOf("/beispiel-demos/") === 0
      ? demo.url + (demo.url.indexOf("?") > -1 ? "&" : "?") + "nc=" + Date.now()
      : demo.url;
    frame.title = demo.name + " (Live-Demo)";
    frame.setAttribute("loading", "eager");
    /* Sandbox: Demo kann die Hauptseite nicht umleiten; Speicher und fetch
       funktionieren, damit Demos in allen Browsern vollstaendig laufen */
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");

    rahmen.appendChild(kopf);
    rahmen.appendChild(frame);
    viewer.appendChild(rahmen);
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
      img.decoding = "async";
      /* Masse angeben, damit die Karte nicht springt, waehrend das Bild laedt */
      img.width = 1100; img.height = 733;
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

  function zeigeLadefehler() {
    grid.innerHTML = "";
    var p = document.createElement("p");
    p.className = "inbox-leer";
    p.style.cssText = "grid-column:1/-1;text-align:center;padding:40px 0;";
    p.textContent = "Die Demos konnten gerade nicht geladen werden. Lade die Seite neu.";
    grid.appendChild(p);
  }

  fetch("/api/inhalte", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (daten) {
      if (!daten || !Array.isArray(daten.beispiele)) { zeigeLadefehler(); return; }
      grid.innerHTML = "";
      if (!daten.beispiele.length) {
        var sektion = document.getElementById("demo-sektion");
        if (sektion) sektion.classList.add("hidden");
        return;
      }
      daten.beispiele.forEach(function (demo, i) {
        var c = karte(demo);
        c.style.setProperty("--sx", i); /* Listen-Kaskade auch für nachgeladene Karten */
        grid.appendChild(c);
      });
    })
    .catch(zeigeLadefehler);
})();
