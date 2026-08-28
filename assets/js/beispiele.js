/* masesites Beispiele: Live-Demos kommen aus dem Admin-Bereich (/api/inhalte)
   und öffnen sich per Klick im Vollbild statt in einem neuen Tab. */

(function () {
  "use strict";

  var grid = document.getElementById("demo-grid");
  if (!grid) return;
  var webappGrid = document.getElementById("webapp-grid");
  var demoSektion = document.getElementById("demo-sektion");
  var webappSektion = document.getElementById("webapp-sektion");

  /* Webapps (bedienbare Software) werden getrennt von den Websites gezeigt,
     damit klar ist, dass es sich nicht um eine einfache Website handelt. */
  function istWebapp(demo) {
    return (demo.branche || "").trim().toLowerCase() === "webapp";
  }

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

    /* Interne Demos immer frisch laden (alte Browser-Kopien umgehen) */
    var url = demo.url.indexOf("/beispiel-demos/") === 0
      ? demo.url + (demo.url.indexOf("?") > -1 ? "&" : "?") + "nc=" + Date.now()
      : demo.url;

    function baueRahmen(titel, breite, hoehe) {
      var f = document.createElement("iframe");
      f.src = url;
      f.title = titel;
      f.setAttribute("loading", "eager");
      /* Sandbox: Demo kann die Hauptseite nicht umleiten; Speicher und fetch
         funktionieren, damit Demos in allen Browsern vollstaendig laufen */
      f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
      f.style.width = breite + "px";
      f.style.height = hoehe + "px";
      return f;
    }

    /* Zwei Geraete nebeneinander: die Demo laeuft einmal in Desktopbreite
       und einmal in Handybreite. Wer in einem der beiden scrollt, scrollt
       im anderen gleich weit mit (siehe koppleScrollen). */
    var buehne = document.createElement("div");
    buehne.className = "dv-buehne";

    var laptop = document.createElement("div");
    laptop.className = "dv-geraet dv-laptop";
    var laptopSchirm = document.createElement("div");
    laptopSchirm.className = "dv-schirm";
    var laptopFrame = baueRahmen(demo.name + " als Live-Demo am Desktop", 1440, 900);
    laptopSchirm.appendChild(laptopFrame);
    var laptopFuss = document.createElement("span");
    laptopFuss.className = "dv-laptop-fuss";
    laptopFuss.setAttribute("aria-hidden", "true");
    laptop.appendChild(laptopSchirm);
    laptop.appendChild(laptopFuss);

    var handy = document.createElement("div");
    handy.className = "dv-geraet dv-handy";
    var handySchirm = document.createElement("div");
    handySchirm.className = "dv-schirm";
    var handyFrame = baueRahmen(demo.name + " als Live-Demo am Handy", 390, 844);
    handySchirm.appendChild(handyFrame);
    var kerbe = document.createElement("span");
    kerbe.className = "dv-kerbe";
    kerbe.setAttribute("aria-hidden", "true");
    handy.appendChild(handySchirm);
    handy.appendChild(kerbe);

    buehne.appendChild(laptop);
    buehne.appendChild(handy);

    rahmen.appendChild(kopf);
    rahmen.appendChild(buehne);
    viewer.appendChild(rahmen);
    document.body.appendChild(viewer);
    document.body.classList.add("demo-offen");
    document.addEventListener("keydown", aufEscape);
    zu.focus();

    passeGroesseAn(laptop, laptopSchirm, 1440, 900);
    passeGroesseAn(handy, handySchirm, 390, 844);
    koppleScrollen(laptopFrame, handyFrame);
  }

  /* ---------- Geraete massstabsgetreu einpassen ----------
     Die Demo rendert intern in echter Desktop- bzw. Handybreite und wird
     danach heruntergerechnet. Nur so sieht man das echte Layout - eine
     schmal gequetschte Desktopseite waere kein ehrliches Bild. */
  function passeGroesseAn(geraet, schirm, breite, hoehe) {
    function rechne() {
      var b = schirm.clientWidth;
      if (!b) return;
      var f = b / breite;
      var frame = schirm.firstChild;
      frame.style.transformOrigin = "0 0";
      frame.style.transform = "scale(" + f + ")";
      schirm.style.height = Math.round(hoehe * f) + "px";
    }
    rechne();
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(rechne);
      ro.observe(schirm);
      geraet.__ro = ro;
    } else {
      window.addEventListener("resize", rechne);
    }
  }

  /* ---------- Scrollen koppeln ----------
     Wer im Laptop scrollt, scrollt im Handy gleich weit mit und umgekehrt.
     Uebertragen wird der Anteil (0..1), nicht die Pixelzahl: die beiden
     Layouts sind unterschiedlich hoch, sonst liefen sie auseinander.
     Klappt nur bei eigenen Demos - fremde Seiten lassen sich aus
     Sicherheitsgruenden nicht auslesen, dann scrollt jedes fuer sich. */
  function koppleScrollen(a, b) {
    var sperre = false;

    function teil(f) {
      try {
        var d = f.contentDocument;
        if (!d || !d.documentElement) return null;
        return { win: f.contentWindow, el: d.scrollingElement || d.documentElement, doc: d };
      } catch (e) {
        return null; // fremde Domain: nicht auslesbar
      }
    }

    function anteil(s) {
      var weg = s.el.scrollHeight - s.el.clientHeight;
      return weg > 0 ? s.el.scrollTop / weg : 0;
    }

    /* WICHTIG: die Demos setzen selbst "scroll-behavior: smooth". Ein
       schlichtes scrollTop = x wuerde darum animiert nachlaufen und die
       beiden Geraete schaukeln sich gegenseitig auf. scrollTo mit
       behavior "instant" ueberschreibt das und springt exakt. */
    function setze(s, p) {
      var weg = s.el.scrollHeight - s.el.clientHeight;
      if (weg <= 0) return;
      s.win.scrollTo({ top: p * weg, behavior: "instant" });
    }

    function verbinde(von, nach) {
      if (!von || !nach) return false;
      von.doc.addEventListener(
        "scroll",
        function () {
          if (sperre) return;
          sperre = true;
          setze(nach, anteil(von));
          window.requestAnimationFrame(function () { sperre = false; });
        },
        { passive: true }
      );
      return true;
    }

    var offen = 2;
    function beiLaden() {
      if (--offen > 0) return;
      var sa = teil(a), sb = teil(b);
      // Beide Richtungen, damit man in jedem Geraet scrollen kann
      verbinde(sa, sb);
      verbinde(sb, sa);
    }
    a.addEventListener("load", beiLaden);
    b.addEventListener("load", beiLaden);
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
    badge.className = "work-badge demo";
    badge.textContent = "Konzept-Demo";
    thumb.appendChild(badge);
    if (demo.bild) {
      var img = document.createElement("img");
      img.src = demo.bild;
      img.alt = demo.name + " – Live-Demo von masesites";
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

  /* Eine Gruppe (Websites bzw. Webapps) in ihr Grid rendern und die Sektion
     ein- oder ausblenden, je nachdem ob es Einträge gibt. */
  function fuelleGrid(container, sektion, liste) {
    if (!container) return;
    container.innerHTML = "";
    if (!liste.length) {
      if (sektion) sektion.classList.add("hidden");
      return;
    }
    if (sektion) sektion.classList.remove("hidden");
    liste.forEach(function (demo, i) {
      var c = karte(demo);
      c.style.setProperty("--sx", i); /* Listen-Kaskade auch für nachgeladene Karten */
      container.appendChild(c);
    });
  }

  fetch("/api/inhalte", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (daten) {
      if (!daten || !Array.isArray(daten.beispiele)) { zeigeLadefehler(); return; }
      var webapps = daten.beispiele.filter(istWebapp);
      var websites = daten.beispiele.filter(function (d) { return !istWebapp(d); });
      fuelleGrid(grid, demoSektion, websites);
      fuelleGrid(webappGrid, webappSektion, webapps);
    })
    .catch(zeigeLadefehler);
})();
