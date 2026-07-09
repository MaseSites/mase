/* masesites Kundenkonto: Registrierung, Login (E-Mail + Google) und das
   Kundenportal auf dashboard.html. Baut auf der Datenschicht (daten.js) auf.
   Konten liegen verschlüsselt in der Datenbank auf dem Server; angemeldet
   wird über ein HttpOnly-Sitzungscookie, das der Server setzt.
   Google-Anmeldung: unten die Client-ID aus der Google Cloud Console eintragen,
   dann erscheint auf login.html automatisch der offizielle Google-Knopf. */

var MS_GOOGLE_CLIENT_ID = "117777636536-nd77bnlv9co4l7g8cbn6de0q8uhj3njt.apps.googleusercontent.com";

(function () {
  "use strict";

  var D = window.MSDaten;

  function zeigeFehler(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("show", !!text);
  }

  /* ---------- Google-Anmeldung (Google Identity Services) ---------- */

  var googleGerendert = false;

  /* Das Google-Script erst hier laden (statt im HTML), damit die Seite
     ohne Inline-Handler auskommt */
  function ladeGoogleScript() {
    if (!MS_GOOGLE_CLIENT_ID || document.getElementById("gsi-script")) return;
    var s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = googleInit;
    document.head.appendChild(s);
  }

  function googleInit() {
    var slot = document.getElementById("google-slot");
    var fallback = document.getElementById("google-fallback");
    if (!slot || googleGerendert) return;
    if (MS_GOOGLE_CLIENT_ID && window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({ client_id: MS_GOOGLE_CLIENT_ID, callback: googleCallback });
      google.accounts.id.renderButton(slot, { theme: "outline", size: "large", text: "continue_with", shape: "pill", logo_alignment: "center", locale: "de", width: 320 });
      googleGerendert = true;
      if (fallback) fallback.style.display = "none";
    }
  }
  window.msGoogleReady = googleInit;

  function googleCallback(antwort) {
    /* Das ID-Token prüft der Server direkt bei Google und legt danach
       die Sitzung an — hier wird nichts mehr selbst entschlüsselt */
    zeigeFehler("google-hinweis", "");
    D.googleAnmeldung(antwort.credential).then(function () {
      window.location.href = "dashboard.html";
    }).catch(function (fehler) {
      zeigeFehler("google-hinweis", fehler.message);
    });
  }

  /* ---------- Login-Seite ---------- */

  function initLogin() {
    var loginForm = document.getElementById("login-form");
    var registerForm = document.getElementById("register-form");
    if (!loginForm && !registerForm) return;

    /* Schon angemeldet? Direkt weiter. */
    if (D.angemeldet()) {
      window.location.replace("dashboard.html");
      return;
    }

    /* Umschalten zwischen Anmelden und Konto erstellen */
    var tabs = document.querySelectorAll(".auth-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
        var ziel = tab.getAttribute("data-ziel");
        document.querySelectorAll(".auth-form").forEach(function (f) {
          f.classList.toggle("hidden", f.id !== ziel);
        });
      });
    });

    /* Konto erstellen */
    if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        zeigeFehler("register-fehler", "");
        var name = registerForm.querySelector('[name="name"]').value.trim();
        var firma = registerForm.querySelector('[name="firma"]').value.trim();
        var telefon = registerForm.querySelector('[name="telefon"]').value.trim();
        var email = registerForm.querySelector('[name="email"]').value.trim().toLowerCase();
        var pw = registerForm.querySelector('[name="passwort"]').value;
        if (!name) { zeigeFehler("register-fehler", "Sag uns kurz, wie du heisst."); return; }
        if (pw.length < 8) { zeigeFehler("register-fehler", "Das Passwort braucht mindestens 8 Zeichen."); return; }
        /* Das Passwort geht nur zum Server; dort wird es gehasht gespeichert */
        D.registrieren({ name: name, firma: firma, telefon: telefon, email: email, passwort: pw })
          .then(function () { window.location.href = "dashboard.html"; })
          .catch(function (fehler) { zeigeFehler("register-fehler", fehler.message); });
      });
    }

    /* Anmelden */
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        zeigeFehler("login-fehler", "");
        var email = loginForm.querySelector('[name="email"]').value.trim().toLowerCase();
        var pw = loginForm.querySelector('[name="passwort"]').value;
        D.anmelden(email, pw)
          .then(function () { window.location.href = "dashboard.html"; })
          .catch(function (fehler) { zeigeFehler("login-fehler", fehler.message); });
      });
    }

    /* Demo-Zugang: frisch aufgesetzt, damit immer aufgeräumt */
    var demoLink = document.getElementById("demo-login");
    if (demoLink) {
      demoLink.addEventListener("click", function (e) {
        e.preventDefault();
        D.demoAnmeldung().then(function () {
          window.location.href = "dashboard.html";
        }).catch(function (fehler) { zeigeFehler("login-fehler", fehler.message); });
      });
    }

    /* Google-Knopf ohne Client-ID: ehrlicher Hinweis statt toter Knopf */
    var fallback = document.getElementById("google-fallback");
    if (fallback) {
      fallback.addEventListener("click", function () {
        zeigeFehler("google-hinweis", "Die Google-Anmeldung schalten wir gerade frei. Erstelle solange ein Konto mit E-Mail und Passwort.");
      });
    }
    ladeGoogleScript();
    googleInit();
  }

  /* ---------- Kundenportal ---------- */

  function initDashboard() {
    var wurzel = document.getElementById("dashboard");
    if (!wurzel) return;

    var konto = D.angemeldet() ? D.konten()[0] : null;
    if (!konto) {
      window.location.replace("login.html");
      return;
    }

    function speichern() { D.aktualisiereKonto(konto); }

    /* ----- Kopf und Seitenleiste ----- */

    function fuelleKopf() {
      var vorname = konto.name.split(" ")[0];
      var initiale = (konto.firma || konto.name).trim().charAt(0).toUpperCase();
      document.querySelectorAll("[data-konto-name]").forEach(function (el) { el.textContent = vorname; });
      document.querySelectorAll("[data-konto-firma]").forEach(function (el) { el.textContent = konto.firma || konto.name; });
      document.querySelectorAll("[data-konto-avatar]").forEach(function (el) { el.textContent = initiale; });
      document.querySelectorAll("[data-konto-email]").forEach(function (el) { el.textContent = konto.email; });
      document.querySelectorAll("[data-konto-seit]").forEach(function (el) { el.textContent = konto.erstellt; });
    }
    fuelleKopf();

    document.querySelectorAll("[data-logout]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        D.abmelden().then(function () {
          window.location.href = "login.html";
        });
      });
    });

    /* ----- Zähler ----- */

    function laufendeProjekte() {
      return konto.projekte.filter(function (p) { return p.schritt < D.SCHRITTE.length - 1; }).length;
    }
    function offeneTickets() {
      return konto.tickets.filter(function (t) { return t.status !== "Geschlossen"; }).length;
    }
    function offeneAuftraege() {
      return konto.auftraege.filter(function (a) { return a.status === "Offen" || a.status === "In Arbeit"; }).length;
    }
    function ungeleseneNachrichten() {
      return konto.nachrichten.filter(function (n) { return n.von !== "ich" && !n.gelesen; }).length;
    }
    function setzeBadges() {
      var werte = {
        projekte: laufendeProjekte(),
        tickets: offeneTickets(),
        auftraege: offeneAuftraege(),
        nachrichten: ungeleseneNachrichten()
      };
      Object.keys(werte).forEach(function (name) {
        document.querySelectorAll('[data-badge="' + name + '"]').forEach(function (el) {
          el.textContent = werte[name] > 0 ? String(werte[name]) : "";
        });
        document.querySelectorAll('[data-kz="' + name + '"]').forEach(function (el) {
          el.textContent = String(werte[name]);
        });
      });
    }

    /* ----- Routing über den Hash, damit Zurück im Browser funktioniert ----- */

    var HAUPTROUTEN = ["uebersicht", "projekte", "auftraege", "tickets", "nachrichten", "konto"];

    function navigiere(pfad) {
      if (location.hash === "#" + pfad) route();
      else location.hash = "#" + pfad;
    }

    function route() {
      var h = location.hash.replace(/^#\/?/, "");
      var teile = h.split("/");
      var name = teile[0] || "uebersicht";
      var arg = teile.slice(1).join("/");
      if (HAUPTROUTEN.indexOf(name) === -1) { name = "uebersicht"; arg = ""; }

      var panelName = name;
      if (name === "projekte" && arg) { panelName = "projekt-detail"; renderProjektDetail(arg); }
      if (name === "tickets" && arg === "neu") panelName = "ticket-neu";
      else if (name === "tickets" && arg) { panelName = "ticket-detail"; renderTicketDetail(arg); }

      document.querySelectorAll(".dash-panel").forEach(function (p) {
        p.classList.toggle("active", p.id === "panel-" + panelName);
      });
      document.querySelectorAll(".side-item[data-route]").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-route") === name);
      });
      if (name === "nachrichten") {
        renderChat();
        markiereGelesen();
      }
      window.scrollTo(0, 0);
    }

    document.querySelectorAll("[data-route]").forEach(function (b) {
      b.addEventListener("click", function () { navigiere(b.getAttribute("data-route")); });
    });
    window.addEventListener("hashchange", route);

    /* ----- Bausteine ----- */

    function zeile(titel, sub, rechts, klick) {
      var li = document.createElement("li");
      li.className = "zeile" + (klick ? "" : " statisch");
      var haupt = document.createElement("span");
      haupt.className = "z-haupt";
      var b = document.createElement("b");
      b.textContent = titel;
      var s = document.createElement("small");
      s.textContent = sub;
      haupt.appendChild(b);
      haupt.appendChild(s);
      var meta = document.createElement("span");
      meta.className = "z-meta";
      (rechts || []).forEach(function (el) { meta.appendChild(el); });
      if (klick) {
        var pf = document.createElement("span");
        pf.className = "z-pfeil";
        pf.textContent = "›";
        meta.appendChild(pf);
        li.addEventListener("click", klick);
      }
      li.appendChild(haupt);
      li.appendChild(meta);
      return li;
    }
    function pill(text, klasse) {
      var p = document.createElement("span");
      p.className = klasse || D.pillKlasse(text);
      p.textContent = text;
      return p;
    }
    function leerZeile(text) {
      var li = document.createElement("li");
      li.className = "leer";
      li.textContent = text;
      return li;
    }
    function schrittPill(p) {
      var name = D.SCHRITTE[p.schritt] || D.SCHRITTE[0];
      var klasse = p.schritt >= D.SCHRITTE.length - 1 ? "pill fertig" : (p.schritt === 0 ? "pill offen" : "pill arbeit");
      return pill(name, klasse);
    }
    function fortschrittMini(p) {
      var wrap = document.createElement("span");
      wrap.className = "z-fortschritt";
      var bar = document.createElement("span");
      bar.className = "fortschritt-bar";
      var fuellung = document.createElement("span");
      fuellung.style.width = D.fortschritt(p) + "%";
      bar.appendChild(fuellung);
      var wert = document.createElement("b");
      wert.textContent = D.fortschritt(p) + " %";
      wrap.appendChild(bar);
      wrap.appendChild(wert);
      return wrap;
    }
    function aktEintrag(a, mitProjekt) {
      var li = document.createElement("li");
      li.className = "akt-item";
      var punkt = document.createElement("span");
      punkt.className = "akt-punkt";
      var inhalt = document.createElement("span");
      var b = document.createElement("b");
      b.textContent = a.text;
      var datum = document.createElement("small");
      datum.textContent = (mitProjekt && a.projekt ? a.projekt + " · " : "") + D.tagLabel(a.datum);
      inhalt.appendChild(b);
      inhalt.appendChild(datum);
      li.appendChild(punkt);
      li.appendChild(inhalt);
      return li;
    }

    /* ----- Übersicht ----- */

    function renderUebersicht() {
      document.getElementById("uebersicht-datum").textContent = D.langesDatum(new Date());

      /* Projekte */
      var pl = document.getElementById("uebersicht-projekte");
      pl.innerHTML = "";
      if (!konto.projekte.length) {
        pl.appendChild(leerZeile("Noch kein Projekt. Stell dir auf der Preisseite dein Paket zusammen."));
      } else {
        konto.projekte.forEach(function (p) {
          pl.appendChild(zeile(
            p.titel,
            (p.paket ? p.paket + " · " : "") + "Aktueller Schritt: " + D.SCHRITTE[p.schritt],
            [fortschrittMini(p), schrittPill(p)],
            function () { navigiere("projekte/" + p.id); }
          ));
        });
      }

      /* Offene Tickets */
      var tl = document.getElementById("uebersicht-tickets");
      tl.innerHTML = "";
      var offene = konto.tickets.filter(function (t) { return t.status !== "Geschlossen"; });
      if (!offene.length) {
        tl.appendChild(leerZeile("Keine offenen Tickets."));
      } else {
        offene.slice(0, 4).forEach(function (t) {
          tl.appendChild(zeile(
            t.betreff,
            t.nr + " · " + D.tagLabel(t.datum),
            [pill(t.status)],
            function () { navigiere("tickets/" + t.nr); }
          ));
        });
      }

      /* Letzte Änderungen über alle Projekte */
      var al = document.getElementById("uebersicht-aktivitaet");
      al.innerHTML = "";
      var akt = D.alleAktivitaeten(konto);
      if (!akt.length) {
        var l = document.createElement("li");
        l.className = "leer";
        l.textContent = "Sobald wir an deinem Projekt arbeiten, siehst du hier jede Änderung.";
        al.appendChild(l);
      } else {
        akt.slice(0, 4).forEach(function (a) { al.appendChild(aktEintrag(a, true)); });
      }

      /* Letzte Nachricht */
      var box = document.getElementById("uebersicht-nachricht");
      box.innerHTML = "";
      if (!konto.nachrichten.length) {
        box.innerHTML = '<p class="leer">Noch keine Nachrichten. Schreib uns über den Chat.</p>';
      } else {
        var letzte = konto.nachrichten[konto.nachrichten.length - 1];
        box.appendChild(nachrichtZeile(letzte, null));
        var meta = document.createElement("p");
        meta.className = "dash-hinweis";
        meta.textContent = (letzte.von === "ich" ? "Du" : "masesites") + " · " + D.tagLabel(letzte.datum) + ", " + D.uhrzeit(letzte.zeit);
        box.appendChild(meta);
      }
    }

    /* ----- Projekte ----- */

    function renderProjekteListe() {
      var liste = document.getElementById("projekte-liste");
      liste.innerHTML = "";
      if (!konto.projekte.length) {
        liste.appendChild(leerZeile("Noch kein Projekt. Stell dir auf der Preisseite dein Paket zusammen, danach begleitest du hier jeden Schritt bis zum Livegang."));
        return;
      }
      konto.projekte.forEach(function (p) {
        liste.appendChild(zeile(
          p.titel,
          (p.paket ? p.paket + " · " : "") + p.id + " · gestartet am " + p.erstellt,
          [fortschrittMini(p), schrittPill(p)],
          function () { navigiere("projekte/" + p.id); }
        ));
      });
    }

    function findeProjekt(id) {
      var treffer = null;
      konto.projekte.forEach(function (p) { if (p.id === id) treffer = p; });
      return treffer;
    }

    function renderProjektDetail(id) {
      var halter = document.getElementById("projekt-detail");
      halter.innerHTML = "";
      var p = findeProjekt(id);
      if (!p) { navigiere("projekte"); return; }

      var kopf = document.createElement("div");
      kopf.className = "panel-kopf";
      var kt = document.createElement("div");
      var h1 = document.createElement("h1");
      h1.textContent = p.titel;
      var meta = document.createElement("p");
      meta.className = "detail-meta";
      meta.textContent = (p.paket ? p.paket + " · " : "") + p.id + " · gestartet am " + p.erstellt;
      kt.appendChild(h1);
      kt.appendChild(meta);
      var aktionen = document.createElement("div");
      aktionen.className = "panel-aktionen";
      aktionen.appendChild(schrittPill(p));
      kopf.appendChild(kt);
      kopf.appendChild(aktionen);
      halter.appendChild(kopf);

      /* Fortschritt */
      var fkarte = document.createElement("div");
      fkarte.className = "dash-card";
      fkarte.innerHTML =
        '<div class="fortschritt-kopf"><span>Fortschritt</span><b>' + D.fortschritt(p) + ' %</b></div>' +
        '<div class="fortschritt-bar"><span style="width:' + D.fortschritt(p) + '%"></span></div>';
      var schritte = document.createElement("ul");
      schritte.className = "dash-steps";
      D.SCHRITTE.forEach(function (name, i) {
        var li = document.createElement("li");
        li.className = "dash-step" + (i < p.schritt ? " done" : i === p.schritt ? " current" : "");
        var dot = document.createElement("span");
        dot.className = "dot";
        dot.textContent = i < p.schritt ? "✓" : "";
        li.appendChild(dot);
        li.appendChild(document.createTextNode(name + (i === p.schritt ? " (aktuell)" : "")));
        schritte.appendChild(li);
      });
      fkarte.appendChild(schritte);
      halter.appendChild(fkarte);

      /* Vorschau */
      var vkarte = document.createElement("div");
      vkarte.className = "dash-card";
      var vtitel = document.createElement("h3");
      vtitel.textContent = "Vorschau";
      vkarte.appendChild(vtitel);
      if (p.vorschau) {
        var box = document.createElement("div");
        box.className = "preview-box";
        var frame = document.createElement("iframe");
        frame.title = "Vorschau: " + p.titel;
        frame.loading = "lazy";
        frame.src = p.vorschau;
        box.appendChild(frame);
        vkarte.appendChild(box);
        var vaktionen = document.createElement("div");
        vaktionen.className = "preview-actions";
        var tab = document.createElement("a");
        tab.className = "btn btn-ghost";
        tab.href = p.vorschau;
        tab.target = "_blank";
        tab.rel = "noopener";
        tab.textContent = "Im neuen Tab öffnen";
        var neu = document.createElement("button");
        neu.className = "btn btn-ghost";
        neu.type = "button";
        neu.textContent = "Neu laden";
        neu.addEventListener("click", function () { frame.src = p.vorschau; });
        vaktionen.appendChild(tab);
        vaktionen.appendChild(neu);
        vkarte.appendChild(vaktionen);
      } else {
        var leer = document.createElement("p");
        leer.className = "leer";
        leer.textContent = "Noch keine Vorschau online. Sobald der erste Entwurf steht, siehst du ihn hier direkt im Portal.";
        vkarte.appendChild(leer);
      }
      halter.appendChild(vkarte);

      /* Änderungen dieses Projekts */
      var akarte = document.createElement("div");
      akarte.className = "dash-card schlank";
      var akopf = document.createElement("div");
      akopf.className = "card-head";
      var ah = document.createElement("h3");
      ah.textContent = "Änderungen";
      akopf.appendChild(ah);
      akarte.appendChild(akopf);
      var aliste = document.createElement("ul");
      aliste.className = "akt-liste";
      if (!p.aktivitaet.length) {
        var al = document.createElement("li");
        al.className = "leer";
        al.textContent = "Noch keine Einträge zu diesem Projekt.";
        aliste.appendChild(al);
      } else {
        p.aktivitaet.forEach(function (a) { aliste.appendChild(aktEintrag(a, false)); });
      }
      akarte.appendChild(aliste);
      halter.appendChild(akarte);

      var hinweis = document.createElement("p");
      hinweis.className = "dash-hinweis";
      var link = document.createElement("button");
      link.className = "card-link";
      link.type = "button";
      link.textContent = "Schreib uns eine Nachricht";
      link.addEventListener("click", function () { navigiere("nachrichten"); });
      hinweis.appendChild(document.createTextNode("Fragen zum Stand? "));
      hinweis.appendChild(link);
      hinweis.appendChild(document.createTextNode("."));
      halter.appendChild(hinweis);
    }

    /* ----- Aufträge ----- */

    function renderAuftraege() {
      var liste = document.getElementById("auftraege-liste");
      liste.innerHTML = "";
      if (!konto.auftraege.length) {
        liste.appendChild(leerZeile("Noch keine Aufträge. Stell dir auf der Preisseite dein Paket zusammen."));
        return;
      }
      konto.auftraege.forEach(function (a) {
        var betrag = document.createElement("span");
        betrag.textContent = a.betrag || "";
        liste.appendChild(zeile(a.titel, "Bestellt am " + (a.datum || "–"), [betrag, pill(a.status)], null));
      });
    }

    /* ----- Tickets ----- */

    function renderTicketListe() {
      var liste = document.getElementById("ticket-liste");
      liste.innerHTML = "";
      if (!konto.tickets.length) {
        liste.appendChild(leerZeile("Keine Tickets. Wenn etwas ansteht, eröffne oben ein neues."));
        return;
      }
      konto.tickets.forEach(function (t) {
        var letzter = t.antworten.length ? t.antworten[t.antworten.length - 1].text : t.text;
        liste.appendChild(zeile(
          t.betreff,
          t.nr + " · " + D.tagLabel(t.datum) + " · " + letzter,
          [pill(t.status)],
          function () { navigiere("tickets/" + t.nr); }
        ));
      });
    }

    function findeTicket(nr) {
      var treffer = null;
      konto.tickets.forEach(function (t) { if (t.nr === nr) treffer = t; });
      return treffer;
    }

    function ticketBlock(vonText, zeitpunkt, text, vonUns) {
      var block = document.createElement("div");
      block.className = "ticket-block" + (vonUns ? " von-uns" : "");
      var meta = document.createElement("div");
      meta.className = "tb-meta";
      meta.textContent = vonText + " · " + zeitpunkt;
      var p = document.createElement("p");
      p.textContent = text;
      block.appendChild(meta);
      block.appendChild(p);
      return block;
    }

    function renderTicketDetail(nr) {
      var halter = document.getElementById("ticket-detail");
      halter.innerHTML = "";
      var t = findeTicket(nr);
      if (!t) { navigiere("tickets"); return; }

      var kopf = document.createElement("div");
      kopf.className = "panel-kopf";
      var kt = document.createElement("div");
      var h1 = document.createElement("h1");
      h1.textContent = t.betreff;
      var meta = document.createElement("p");
      meta.className = "detail-meta";
      meta.textContent = t.nr + " · Priorität " + (t.prio || "Normal") + " · eröffnet am " + t.datum;
      kt.appendChild(h1);
      kt.appendChild(meta);
      var aktionen = document.createElement("div");
      aktionen.className = "panel-aktionen";
      aktionen.appendChild(pill(t.status));
      kopf.appendChild(kt);
      kopf.appendChild(aktionen);
      halter.appendChild(kopf);

      var karte = document.createElement("div");
      karte.className = "dash-card";
      var verlauf = document.createElement("div");
      verlauf.className = "ticket-verlauf";
      verlauf.appendChild(ticketBlock("Du", D.tagLabel(t.datum), t.text, false));
      t.antworten.forEach(function (a) {
        verlauf.appendChild(ticketBlock(a.von === "ich" ? "Du" : "masesites", D.tagLabel(a.datum), a.text, a.von !== "ich"));
      });
      karte.appendChild(verlauf);

      if (t.status === "Geschlossen") {
        var hin = document.createElement("p");
        hin.className = "dash-hinweis";
        hin.textContent = "Dieses Ticket ist geschlossen. Wenn noch etwas ansteht, eröffne ein neues Ticket.";
        karte.appendChild(hin);
      } else {
        var form = document.createElement("form");
        form.className = "chat-eingabe ticket-antwort";
        var input = document.createElement("input");
        input.type = "text";
        input.name = "text";
        input.required = true;
        input.placeholder = "Antwort schreiben";
        input.setAttribute("autocomplete", "off");
        var knopf = document.createElement("button");
        knopf.className = "chat-senden";
        knopf.type = "submit";
        knopf.setAttribute("aria-label", "Antwort senden");
        knopf.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        form.appendChild(input);
        form.appendChild(knopf);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var text = input.value.trim();
          if (!text) return;
          t.antworten.push({ von: "ich", text: text, datum: D.heute(), zeit: Date.now() });
          t.status = "Offen";
          speichern();
          renderTicketDetail(nr);
          renderTicketListe();
          renderUebersicht();
          setzeBadges();
        });
        karte.appendChild(form);
      }
      halter.appendChild(karte);
    }

    var ticketForm = document.getElementById("ticket-form");
    ticketForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var betreff = ticketForm.querySelector('[name="betreff"]').value.trim();
      var text = ticketForm.querySelector('[name="text"]').value.trim();
      var prio = ticketForm.querySelector('[name="prio"]').value;
      if (!betreff || !text) return;
      /* Die Ticketnummer vergibt der Server, damit sie eindeutig bleibt */
      D.neuesTicket({ betreff: betreff, text: text, prio: prio }).then(function (ticket) {
        ticketForm.reset();
        renderTicketListe();
        renderUebersicht();
        setzeBadges();
        navigiere("tickets/" + ticket.nr);
      }).catch(function (fehler) {
        zeigeFehler("ticket-fehler", fehler.message);
      });
    });

    /* ----- Nachrichten: Messenger ----- */

    function hakenSvg(doppelt) {
      var eins = '<path d="M1.5 6.5 5 10 11.5 2.5"/>';
      var zwei = '<path d="M1 6.5 4.5 10 11 2.5"/><path d="M8 6.8 10.5 10 17 3"/>';
      return '<svg viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (doppelt ? zwei : eins) + '</svg>';
    }

    function nachrichtZeile(n, vorherige) {
      var folge = !!vorherige && vorherige.von === n.von && n.datum === vorherige.datum && (n.zeit - vorherige.zeit) < 5 * 60000;
      var zeileEl = document.createElement("div");
      zeileEl.className = "chat-zeile " + (n.von === "ich" ? "von-ich" : "von-masesites") + (folge ? " folge" : "");
      if (n.von !== "ich") {
        var av = document.createElement("span");
        av.className = "chat-mini-avatar" + (folge ? " unsichtbar" : "");
        av.setAttribute("aria-hidden", "true");
        av.textContent = "m";
        zeileEl.appendChild(av);
      }
      var bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      bubble.appendChild(document.createTextNode(n.text));
      var uz = document.createElement("span");
      uz.className = "msg-zeit";
      uz.textContent = D.uhrzeit(n.zeit);
      bubble.appendChild(uz);
      if (n.von === "ich") {
        var haken = document.createElement("span");
        haken.className = "msg-haken" + (n.gelesen ? " gelesen" : "");
        haken.title = n.gelesen ? "Gelesen" : "Zugestellt";
        haken.innerHTML = hakenSvg(n.gelesen);
        bubble.appendChild(haken);
      }
      zeileEl.appendChild(bubble);
      return zeileEl;
    }

    function renderChat() {
      var verlauf = document.getElementById("nachrichten-liste");
      verlauf.innerHTML = "";
      var liste = konto.nachrichten.slice().sort(function (a, b) { return (a.zeit || 0) - (b.zeit || 0); });
      if (!liste.length) {
        var leer = document.createElement("p");
        leer.className = "chat-leer";
        leer.textContent = "Noch keine Nachrichten. Schreib uns, wir antworten innert 24 Stunden.";
        verlauf.appendChild(leer);
        return;
      }
      var ersteUngelesene = null;
      liste.forEach(function (n, i) {
        if (ersteUngelesene === null && n.von !== "ich" && !n.gelesen) ersteUngelesene = i;
      });
      var letzterTag = null;
      var vorherige = null;
      liste.forEach(function (n, i) {
        if (n.datum && n.datum !== letzterTag) {
          var tag = document.createElement("div");
          tag.className = "chat-tag";
          tag.textContent = D.tagLabel(n.datum);
          verlauf.appendChild(tag);
          letzterTag = n.datum;
          vorherige = null;
        }
        if (ersteUngelesene === i) {
          var trenner = document.createElement("div");
          trenner.className = "chat-neu-trenner";
          trenner.textContent = "Neue Nachrichten";
          verlauf.appendChild(trenner);
          vorherige = null;
        }
        verlauf.appendChild(nachrichtZeile(n, vorherige));
        vorherige = n;
      });
      verlauf.scrollTop = verlauf.scrollHeight;
    }

    /* Eingehende Nachrichten nach kurzem Moment als gelesen markieren,
       damit das Team im Admin-Bereich den Gelesen-Haken sieht. */
    function markiereGelesen() {
      var offen = konto.nachrichten.filter(function (n) { return n.von !== "ich" && !n.gelesen; });
      if (!offen.length) return;
      setTimeout(function () {
        offen.forEach(function (n) { n.gelesen = true; });
        speichern();
        setzeBadges();
      }, 1200);
    }

    var nachrichtForm = document.getElementById("nachricht-form");
    nachrichtForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var feld = nachrichtForm.querySelector('[name="text"]');
      var text = feld.value.trim();
      if (!text) return;
      konto.nachrichten.push({ von: "ich", text: text, datum: D.heute(), zeit: Date.now(), gelesen: false });
      speichern();
      feld.value = "";
      renderChat();
      renderUebersicht();
      setzeBadges();
      feld.focus();
    });

    /* ----- Konto ----- */

    var kontoForm = document.getElementById("konto-form");
    kontoForm.querySelector('[name="name"]').value = konto.name;
    kontoForm.querySelector('[name="firma"]').value = konto.firma;
    kontoForm.querySelector('[name="telefon"]').value = konto.telefon;
    kontoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = kontoForm.querySelector('[name="name"]').value.trim();
      if (!name) return;
      konto.name = name;
      konto.firma = kontoForm.querySelector('[name="firma"]').value.trim();
      konto.telefon = kontoForm.querySelector('[name="telefon"]').value.trim();
      speichern();
      fuelleKopf();
      var ok = document.getElementById("konto-ok");
      ok.classList.add("show");
      setTimeout(function () { ok.classList.remove("show"); }, 3000);
    });

    /* ----- Start ----- */

    renderUebersicht();
    renderProjekteListe();
    renderAuftraege();
    renderTicketListe();
    renderChat();
    setzeBadges();
    route();
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* Jahr im Fussbereich */
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
    var hatLogin = document.getElementById("login-form") || document.getElementById("register-form");
    var hatDashboard = document.getElementById("dashboard");
    if (!hatLogin && !hatDashboard) return;
    /* Erst den Zustand vom Server laden, dann die Seite aufbauen */
    D.bereit("kunde").then(function () {
      initLogin();
      initDashboard();
    });
  });
})();
