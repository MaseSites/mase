/* masesites Admin-Bereich: Kunden, Projekte, Tickets, Nachrichten,
   KI-Chats, Mitarbeiter und Seiten-Protokoll. Baut auf daten.js auf.
   Alle Daten liegen verschlüsselt in der Datenbank auf dem Server; die
   Anmeldung läuft über eine Server-Sitzung. Das Startpasswort erzeugt der
   Server beim ersten Start (server/daten/admin-startpasswort.txt), danach
   unter Einstellungen änderbar. */

(function () {
  "use strict";

  var D = window.MSDaten;

  function zeigeFehler(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("show", !!text);
  }
  function adminLog(aktion, detail) {
    D.protokolliere("Admin", "admin", aktion, detail);
  }

  /* ---------- Anmeldung ---------- */

  var gate = document.getElementById("admin-gate");
  var app = document.getElementById("admin-app");
  if (!gate || !app) return;

  var istAngemeldet = false;

  function angemeldet() { return istAngemeldet; }
  function zeigeApp() {
    gate.classList.add("hidden");
    app.classList.remove("hidden");
    var kopfKnopf = document.getElementById("admin-abmelden");
    if (kopfKnopf) kopfKnopf.classList.remove("hidden");
    renderAlles();
    ladeWebsiteInhalte();
    route();
  }
  function abmelden() {
    adminLog("Admin abgemeldet", "");
    D.abmelden().then(function () {
      window.location.hash = "";
      window.location.reload();
    });
  }

  var loginForm = document.getElementById("admin-login-form");
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    zeigeFehler("admin-fehler", "");
    var pw = loginForm.querySelector('[name="passwort"]').value;
    /* Der Server prüft das Passwort und setzt das Sitzungscookie */
    D.adminAnmelden(pw).then(function () {
      return D.bereit("admin");
    }).then(function (zustand) {
      if (!zustand.angemeldet) {
        zeigeFehler("admin-fehler", "Anmeldung fehlgeschlagen. Probiere es nochmal.");
        return;
      }
      istAngemeldet = true;
      loginForm.reset();
      zeigeApp();
    }).catch(function (fehler) {
      zeigeFehler("admin-fehler", fehler.message);
    });
  });

  document.querySelectorAll("[data-admin-logout], #admin-abmelden").forEach(function (btn) {
    btn.addEventListener("click", abmelden);
  });

  /* ---------- Routing über den Hash ---------- */

  var HAUPTROUTEN = ["uebersicht", "kunden", "projekte", "tickets", "nachrichten", "ki", "inhalte", "mitarbeiter", "protokoll", "einstellungen"];
  var neuProjektVorwahl = "";

  function navigiere(pfad) {
    if (location.hash === "#" + pfad) route();
    else location.hash = "#" + pfad;
  }

  function route() {
    if (!angemeldet()) return;
    var h = location.hash.replace(/^#\/?/, "");
    var teile = h.split("/").map(function (t) { return decodeURIComponent(t); });
    var name = teile[0] || "uebersicht";
    if (HAUPTROUTEN.indexOf(name) === -1) { name = "uebersicht"; teile = [name]; }

    var panelName = name;
    if (name === "kunden" && teile[1]) {
      panelName = "kunde-detail";
      renderKundeDetail(teile[1]);
    } else if (name === "projekte" && teile[1] === "neu") {
      panelName = "projekt-neu";
      fuelleProjektNeu();
    } else if (name === "projekte" && teile[1] && teile[2]) {
      panelName = "projekt-detail";
      renderProjektDetail(teile[1], teile[2]);
    } else if (name === "tickets" && teile[1] && teile[2]) {
      panelName = "ticket-detail";
      renderTicketDetail(teile[1], teile[2]);
    } else if (name === "mitarbeiter" && teile[1] === "neu") {
      panelName = "mitarbeiter-neu";
    } else if (name === "mitarbeiter" && teile[1]) {
      panelName = "mitarbeiter-detail";
      renderMitarbeiterDetail(teile[1]);
    } else if (name === "nachrichten" && teile[1]) {
      waehleThread(teile[1]);
    }

    document.querySelectorAll(".dash-panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "panel-" + panelName);
    });
    document.querySelectorAll(".side-item[data-route]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-route") === name);
    });
    window.scrollTo(0, 0);
  }

  document.querySelectorAll("[data-route]").forEach(function (b) {
    b.addEventListener("click", function () { navigiere(b.getAttribute("data-route")); });
  });
  window.addEventListener("hashchange", route);

  /* ---------- Bausteine ---------- */

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function pill(text, klasse) {
    return el("span", klasse || D.pillKlasse(text), text);
  }
  function schrittPill(p) {
    var name = D.SCHRITTE[p.schritt] || D.SCHRITTE[0];
    var klasse = p.schritt >= D.SCHRITTE.length - 1 ? "pill fertig" : (p.schritt === 0 ? "pill offen" : "pill arbeit");
    return pill(name, klasse);
  }
  function zeile(titel, sub, rechts, klick) {
    var li = el("li", "zeile" + (klick ? "" : " statisch"));
    var haupt = el("span", "z-haupt");
    haupt.appendChild(el("b", "", titel));
    haupt.appendChild(el("small", "", sub));
    var meta = el("span", "z-meta");
    (rechts || []).forEach(function (r) { meta.appendChild(r); });
    if (klick) {
      meta.appendChild(el("span", "z-pfeil", "›"));
      li.addEventListener("click", klick);
    }
    li.appendChild(haupt);
    li.appendChild(meta);
    return li;
  }
  function leerZeile(text) { return el("li", "leer", text); }
  function leerTabelle(tbody, spalten, text) {
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.colSpan = spalten;
    td.className = "klein";
    td.textContent = text;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  function feld(labelText, eingabe) {
    var wrap = el("div", "form-field");
    wrap.appendChild(el("label", "", labelText));
    wrap.appendChild(eingabe);
    return wrap;
  }
  function kurz(text, laenge) {
    text = String(text || "");
    return text.length > laenge ? text.slice(0, laenge) + "…" : text;
  }

  /* ---------- Daten-Sichten ---------- */

  function alleKonten() {
    return D.konten().map(D.normalisiereKonto);
  }
  function alleTickets() {
    var liste = [];
    alleKonten().forEach(function (k) {
      k.tickets.forEach(function (t) { liste.push({ konto: k, ticket: t }); });
    });
    liste.sort(function (a, b) { return ticketZeit(b.ticket) - ticketZeit(a.ticket); });
    return liste;
  }
  function ticketZeit(t) {
    var zeit = t.zeit || 0;
    t.antworten.forEach(function (a) { if ((a.zeit || 0) > zeit) zeit = a.zeit; });
    return zeit;
  }
  function alleProjekte() {
    var liste = [];
    alleKonten().forEach(function (k) {
      k.projekte.forEach(function (p) { liste.push({ konto: k, projekt: p }); });
    });
    return liste;
  }
  function ungeleseneVonKunde(k) {
    return k.nachrichten.filter(function (n) { return n.von === "ich" && !n.gelesen; }).length;
  }
  function wartendeKonten() {
    return alleKonten().filter(function (k) {
      if (!k.nachrichten.length) return false;
      return k.nachrichten[k.nachrichten.length - 1].von === "ich";
    });
  }
  function kiGruppen() {
    var gruppen = {};
    var reihenfolge = [];
    D.botLogs().forEach(function (e) {
      if (!gruppen[e.konto]) { gruppen[e.konto] = []; reihenfolge.push(e.konto); }
      gruppen[e.konto].push(e);
    });
    return reihenfolge.map(function (name) { return { name: name, eintraege: gruppen[name] }; })
      .sort(function (a, b) {
        return b.eintraege[b.eintraege.length - 1].zeit - a.eintraege[a.eintraege.length - 1].zeit;
      });
  }

  /* ---------- Kennzahlen und Badges ---------- */

  function renderBadges() {
    var werte = {
      kunden: alleKonten().length,
      projekte: alleProjekte().filter(function (e) { return e.projekt.schritt < D.SCHRITTE.length - 1; }).length,
      tickets: alleTickets().filter(function (e) { return e.ticket.status === "Offen"; }).length,
      nachrichten: alleKonten().filter(function (k) { return ungeleseneVonKunde(k) > 0; }).length,
      ki: kiGruppen().length,
      mitarbeiter: D.mitarbeiter().length
    };
    Object.keys(werte).forEach(function (name) {
      document.querySelectorAll('[data-badge="' + name + '"]').forEach(function (b) {
        b.textContent = werte[name] > 0 ? String(werte[name]) : "";
      });
      document.querySelectorAll('[data-kz="' + name + '"]').forEach(function (b) {
        b.textContent = String(werte[name]);
      });
    });
  }

  /* ---------- Übersicht ---------- */

  function renderUebersicht() {
    document.getElementById("uebersicht-datum").textContent = D.langesDatum(new Date());

    var wartend = document.getElementById("uebersicht-wartend");
    wartend.innerHTML = "";
    var liste = wartendeKonten();
    if (!liste.length) {
      wartend.appendChild(leerZeile("Alles beantwortet. Keine Kundennachricht wartet."));
    } else {
      liste.slice(0, 5).forEach(function (k) {
        var letzte = k.nachrichten[k.nachrichten.length - 1];
        wartend.appendChild(zeile(
          D.anzeigeName(k),
          kurz(letzte.text, 70),
          [el("span", "", D.kurzeZeit(letzte.zeit))],
          function () { navigiere("nachrichten/" + encodeURIComponent(k.email)); }
        ));
      });
    }

    var tl = document.getElementById("uebersicht-tickets");
    tl.innerHTML = "";
    var offene = alleTickets().filter(function (e) { return e.ticket.status === "Offen"; });
    if (!offene.length) {
      tl.appendChild(leerZeile("Keine offenen Tickets."));
    } else {
      offene.slice(0, 5).forEach(function (e) {
        tl.appendChild(zeile(
          e.ticket.betreff,
          e.ticket.nr + " · " + D.anzeigeName(e.konto),
          [pill(e.ticket.status)],
          function () { navigiere("tickets/" + encodeURIComponent(e.konto.email) + "/" + e.ticket.nr); }
        ));
      });
    }

    var logListe = document.getElementById("uebersicht-log");
    logListe.innerHTML = "";
    var eintraege = D.ladeLog();
    if (!eintraege.length) {
      logListe.appendChild(el("li", "leer", "Noch keine Einträge. Sobald jemand die Website nutzt, erscheint hier jede Aktion."));
    } else {
      eintraege.slice(-6).reverse().forEach(function (e) {
        var li = el("li", "akt-item");
        li.appendChild(el("span", "akt-punkt"));
        var inhalt = el("span");
        inhalt.appendChild(el("b", "", e.aktion + (e.detail ? ": " + kurz(e.detail, 80) : "")));
        inhalt.appendChild(el("small", "", D.zeitText(e.zeit) + " · " + e.konto + " · " + e.ip));
        li.appendChild(inhalt);
        logListe.appendChild(li);
      });
    }
  }

  /* ---------- Kunden ---------- */

  function renderKunden() {
    var tbody = document.getElementById("kunden-tabelle");
    var filter = document.getElementById("kunden-filter").value.trim().toLowerCase();
    tbody.innerHTML = "";
    var liste = alleKonten();
    if (filter) {
      liste = liste.filter(function (k) {
        return (k.name + " " + k.firma + " " + k.email).toLowerCase().indexOf(filter) !== -1;
      });
    }
    if (!liste.length) {
      leerTabelle(tbody, 7, filter ? "Nichts gefunden." : "Noch keine Kunden registriert.");
      return;
    }
    liste.forEach(function (k) {
      var tr = document.createElement("tr");
      tr.className = "klickbar";

      var wer = document.createElement("td");
      wer.appendChild(el("b", "", D.anzeigeName(k)));
      if (k.firma && k.name) {
        wer.appendChild(document.createElement("br"));
        var s = el("small", "", k.name);
        s.style.color = "var(--ink-faint)";
        wer.appendChild(s);
      }
      tr.appendChild(wer);

      [k.email, k.telefon || "–"].forEach(function (wert) {
        var td = el("td", "klein", wert);
        tr.appendChild(td);
      });
      tr.appendChild(el("td", "klein", String(k.projekte.length)));
      tr.appendChild(el("td", "klein", String(k.tickets.filter(function (t) { return t.status !== "Geschlossen"; }).length)));
      tr.appendChild(el("td", "klein", k.erstellt || "–"));
      tr.appendChild(el("td", "z-pfeil", "›"));

      tr.addEventListener("click", function () { navigiere("kunden/" + encodeURIComponent(k.email)); });
      tbody.appendChild(tr);
    });
  }
  document.getElementById("kunden-filter").addEventListener("input", renderKunden);

  function renderKundeDetail(email) {
    var halter = document.getElementById("kunde-detail");
    halter.innerHTML = "";
    var k = D.findeKonto(email);
    if (!k) { navigiere("kunden"); return; }

    var kopf = el("div", "panel-kopf");
    var kt = el("div");
    kt.appendChild(el("h1", "", D.anzeigeName(k)));
    kt.appendChild(el("p", "detail-meta", k.email + " · Kunde seit " + (k.erstellt || "–")));
    var aktionen = el("div", "panel-aktionen");

    var nachricht = el("button", "btn btn-ghost klein", "Nachricht schreiben");
    nachricht.type = "button";
    nachricht.addEventListener("click", function () { navigiere("nachrichten/" + encodeURIComponent(k.email)); });

    var proto = el("button", "mini-knopf", "Protokoll");
    proto.type = "button";
    proto.addEventListener("click", function () {
      document.getElementById("log-filter").value = k.email;
      renderProtokoll();
      navigiere("protokoll");
    });

    var loeschen = el("button", "mini-knopf gefahr", "Konto löschen");
    loeschen.type = "button";
    loeschen.addEventListener("click", function () {
      if (!window.confirm("Konto " + k.email + " endgültig löschen? Projekte, Tickets und Nachrichten dieses Kontos gehen verloren.")) return;
      D.loescheKonto(k.email);
      adminLog("Konto gelöscht", k.email);
      renderAlles();
      navigiere("kunden");
    });

    aktionen.appendChild(nachricht);
    aktionen.appendChild(proto);
    aktionen.appendChild(loeschen);
    kopf.appendChild(kt);
    kopf.appendChild(aktionen);
    halter.appendChild(kopf);

    /* Stammdaten und zuständige Mitarbeiter */
    var grid = el("div", "panel-grid");
    var stamm = el("div", "dash-card");
    stamm.appendChild(el("h3", "", "Stammdaten"));
    var meta = el("ul", "konto-meta");
    [
      ["Name", k.name || "–"],
      ["Firma", k.firma || "–"],
      ["E-Mail", k.email],
      ["Telefon", k.telefon || "–"],
      ["Anmeldung", k.provider === "google" ? "Google" : k.provider === "demo" ? "Demo-Konto" : "E-Mail und Passwort"]
    ].forEach(function (paar) {
      var li = document.createElement("li");
      li.appendChild(el("span", "", paar[0]));
      li.appendChild(el("b", "", paar[1]));
      meta.appendChild(li);
    });
    stamm.appendChild(meta);
    grid.appendChild(stamm);

    var zustaendig = el("div", "dash-card");
    zustaendig.appendChild(el("h3", "", "Zuständige Mitarbeiter"));
    var ma = D.mitarbeiterFuerKunde(k.email);
    if (!ma.length) {
      zustaendig.appendChild(el("p", "leer", "Noch niemandem zugewiesen. Die Zuweisung machst du im Bereich Mitarbeiter."));
    } else {
      var ul = el("ul", "konto-meta");
      ma.forEach(function (m) {
        var li = document.createElement("li");
        li.appendChild(el("span", "", m.name));
        li.appendChild(el("b", "", m.rolle || "Mitarbeiter"));
        li.style.cursor = "pointer";
        li.addEventListener("click", function () { navigiere("mitarbeiter/" + m.id); });
        ul.appendChild(li);
      });
      zustaendig.appendChild(ul);
    }
    grid.appendChild(zustaendig);
    halter.appendChild(grid);

    /* Projekte */
    var pkarte = el("div", "dash-card schlank");
    var pkopf = el("div", "card-head");
    pkopf.appendChild(el("h3", "", "Projekte"));
    var pneu = el("button", "mini-knopf", "Projekt anlegen");
    pneu.type = "button";
    pneu.addEventListener("click", function () {
      neuProjektVorwahl = k.email;
      navigiere("projekte/neu");
    });
    pkopf.appendChild(pneu);
    pkarte.appendChild(pkopf);
    var pliste = el("ul", "zeilen-liste");
    if (!k.projekte.length) {
      pliste.appendChild(leerZeile("Noch kein Projekt."));
    } else {
      k.projekte.forEach(function (p) {
        pliste.appendChild(zeile(
          p.titel,
          (p.paket ? p.paket + " · " : "") + p.id + " · gestartet am " + p.erstellt,
          [schrittPill(p)],
          function () { navigiere("projekte/" + encodeURIComponent(k.email) + "/" + p.id); }
        ));
      });
    }
    pkarte.appendChild(pliste);
    halter.appendChild(pkarte);

    /* Tickets */
    var tkarte = el("div", "dash-card schlank");
    var tkopf = el("div", "card-head");
    tkopf.appendChild(el("h3", "", "Tickets"));
    tkarte.appendChild(tkopf);
    var tliste = el("ul", "zeilen-liste");
    if (!k.tickets.length) {
      tliste.appendChild(leerZeile("Keine Tickets."));
    } else {
      k.tickets.forEach(function (t) {
        tliste.appendChild(zeile(
          t.betreff,
          t.nr + " · " + D.tagLabel(t.datum),
          [pill(t.status)],
          function () { navigiere("tickets/" + encodeURIComponent(k.email) + "/" + t.nr); }
        ));
      });
    }
    tkarte.appendChild(tliste);
    halter.appendChild(tkarte);
  }

  /* ---------- Projekte ---------- */

  function renderProjekteTabelle() {
    var tbody = document.getElementById("projekte-tabelle");
    var filter = document.getElementById("projekt-filter").value;
    tbody.innerHTML = "";
    var liste = alleProjekte();
    if (filter === "laufend") {
      liste = liste.filter(function (e) { return e.projekt.schritt < D.SCHRITTE.length - 1; });
    }
    if (!liste.length) {
      leerTabelle(tbody, 7, filter === "laufend" ? "Keine laufenden Projekte." : "Noch keine Projekte. Lege oben eines an.");
      return;
    }
    liste.forEach(function (e) {
      var p = e.projekt;
      var tr = document.createElement("tr");
      tr.className = "klickbar";

      var titel = document.createElement("td");
      titel.appendChild(el("b", "", p.titel));
      titel.appendChild(document.createElement("br"));
      var sub = el("small", "", p.id);
      sub.style.color = "var(--ink-faint)";
      titel.appendChild(sub);
      tr.appendChild(titel);

      tr.appendChild(el("td", "klein", D.anzeigeName(e.konto)));

      var schritt = document.createElement("td");
      schritt.appendChild(schrittPill(p));
      tr.appendChild(schritt);

      var fort = document.createElement("td");
      var fwrap = el("span", "tab-fortschritt");
      var bar = el("span", "fortschritt-bar");
      var fuellung = document.createElement("span");
      fuellung.style.width = D.fortschritt(p) + "%";
      bar.appendChild(fuellung);
      fwrap.appendChild(bar);
      fwrap.appendChild(el("b", "", D.fortschritt(p) + " %"));
      fort.appendChild(fwrap);
      tr.appendChild(fort);

      tr.appendChild(el("td", "klein", p.vorschau ? "Ja" : "–"));
      tr.appendChild(el("td", "klein", p.erstellt || "–"));
      tr.appendChild(el("td", "z-pfeil", "›"));

      tr.addEventListener("click", function () {
        navigiere("projekte/" + encodeURIComponent(e.konto.email) + "/" + p.id);
      });
      tbody.appendChild(tr);
    });
  }
  document.getElementById("projekt-filter").addEventListener("change", renderProjekteTabelle);

  function fuelleProjektNeu() {
    var select = document.getElementById("pn-kunde");
    select.innerHTML = "";
    var liste = alleKonten();
    if (!liste.length) {
      var opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Keine Kunden vorhanden";
      select.appendChild(opt);
      return;
    }
    liste.forEach(function (k) {
      var o = document.createElement("option");
      o.value = k.email;
      o.textContent = D.anzeigeName(k) + " (" + k.email + ")";
      select.appendChild(o);
    });
    if (neuProjektVorwahl) {
      select.value = neuProjektVorwahl;
      neuProjektVorwahl = "";
    }
  }

  document.getElementById("projekt-neu-form").addEventListener("submit", function (e) {
    e.preventDefault();
    zeigeFehler("projekt-neu-fehler", "");
    var form = e.target;
    var email = form.querySelector('[name="kunde"]').value;
    var titel = form.querySelector('[name="titel"]').value.trim();
    var paket = form.querySelector('[name="paket"]').value.trim();
    if (!email) { zeigeFehler("projekt-neu-fehler", "Lege zuerst ein Kundenkonto an."); return; }
    if (!titel) { zeigeFehler("projekt-neu-fehler", "Gib dem Projekt einen Titel."); return; }
    /* Die Projekt-ID vergibt der Server, damit sie eindeutig bleibt */
    D.neuesProjekt(email, { titel: titel, paket: paket }).then(function (projekt) {
      adminLog("Projekt angelegt", email + ": " + titel);
      form.reset();
      renderAlles();
      navigiere("projekte/" + encodeURIComponent(email) + "/" + projekt.id);
    }).catch(function (fehler) {
      zeigeFehler("projekt-neu-fehler", fehler.message);
    });
  });

  function renderProjektDetail(email, id) {
    var halter = document.getElementById("projekt-detail");
    halter.innerHTML = "";
    var k = D.findeKonto(email);
    var p = null;
    if (k) k.projekte.forEach(function (x) { if (x.id === id) p = x; });
    if (!k || !p) { navigiere("projekte"); return; }

    var kopf = el("div", "panel-kopf");
    var kt = el("div");
    kt.appendChild(el("h1", "", p.titel));
    var meta = el("p", "detail-meta");
    var kundeLink = el("button", "card-link", D.anzeigeName(k));
    kundeLink.type = "button";
    kundeLink.addEventListener("click", function () { navigiere("kunden/" + encodeURIComponent(k.email)); });
    meta.appendChild(kundeLink);
    meta.appendChild(document.createTextNode(" · " + p.id + " · gestartet am " + p.erstellt));
    kt.appendChild(meta);
    var aktionen = el("div", "panel-aktionen");
    aktionen.appendChild(schrittPill(p));
    kopf.appendChild(kt);
    kopf.appendChild(aktionen);
    halter.appendChild(kopf);

    /* Editor */
    var karte = el("div", "dash-card projekt-editor");
    karte.appendChild(el("h3", "", "Projekt bearbeiten"));

    var titelInput = document.createElement("input");
    titelInput.type = "text";
    titelInput.value = p.titel;

    var paketInput = document.createElement("input");
    paketInput.type = "text";
    paketInput.value = p.paket || "";
    paketInput.placeholder = "Zum Beispiel: Neue Website: Business";

    var schrittSelect = document.createElement("select");
    D.SCHRITTE.forEach(function (name, i) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = (i + 1) + ". " + name;
      if (i === (p.schritt || 0)) opt.selected = true;
      schrittSelect.appendChild(opt);
    });

    var reihe = el("div", "auth-row");
    reihe.appendChild(feld("Titel", titelInput));
    reihe.appendChild(feld("Paket", paketInput));
    karte.appendChild(reihe);

    var vorschauInput = document.createElement("input");
    vorschauInput.type = "url";
    vorschauInput.placeholder = "https://…";
    vorschauInput.value = p.vorschau || "";

    var reihe2 = el("div", "auth-row");
    reihe2.style.marginTop = "12px";
    reihe2.appendChild(feld("Aktueller Schritt", schrittSelect));
    reihe2.appendChild(feld("Vorschau-Adresse (neuste hochgeladene Website)", vorschauInput));
    karte.appendChild(reihe2);

    var aktionenZeile = el("div", "preview-actions");
    var speichern = el("button", "btn btn-primary projekt-speichern", "Speichern");
    speichern.type = "button";
    speichern.addEventListener("click", function () {
      D.aendereKonto(email, function (x) {
        x.projekte.forEach(function (pr) {
          if (pr.id === id) {
            pr.titel = titelInput.value.trim() || pr.titel;
            pr.paket = paketInput.value.trim();
            pr.schritt = parseInt(schrittSelect.value, 10) || 0;
            pr.vorschau = vorschauInput.value.trim();
          }
        });
      });
      adminLog("Projekt aktualisiert", email + ": " + p.id + " zu Schritt " + D.SCHRITTE[parseInt(schrittSelect.value, 10) || 0]);
      speichern.textContent = "Gespeichert";
      setTimeout(function () { speichern.textContent = "Speichern"; }, 1800);
      renderBadges();
      renderProjekteTabelle();
      renderUebersicht();
    });
    var entfernen = el("button", "mini-knopf gefahr", "Projekt entfernen");
    entfernen.type = "button";
    entfernen.addEventListener("click", function () {
      if (!window.confirm("Projekt " + p.titel + " von " + D.anzeigeName(k) + " entfernen?")) return;
      D.aendereKonto(email, function (x) {
        x.projekte = x.projekte.filter(function (pr) { return pr.id !== id; });
      });
      adminLog("Projekt entfernt", email + ": " + p.id);
      renderAlles();
      navigiere("projekte");
    });
    aktionenZeile.appendChild(speichern);
    aktionenZeile.appendChild(entfernen);
    karte.appendChild(aktionenZeile);
    halter.appendChild(karte);

    /* Update für den Kunden */
    var ukarte = el("div", "dash-card projekt-editor");
    ukarte.appendChild(el("h3", "", "Update für den Kunden veröffentlichen"));
    var updateInput = document.createElement("input");
    updateInput.type = "text";
    updateInput.placeholder = "Was ist neu? Zum Beispiel: Galerie eingebaut, Bilder folgen";
    ukarte.appendChild(feld("Neuer Eintrag", updateInput));
    var updateKnopf = el("button", "mini-knopf", "Update veröffentlichen");
    updateKnopf.type = "button";
    updateKnopf.style.marginTop = "10px";
    updateKnopf.addEventListener("click", function () {
      var text = updateInput.value.trim();
      if (!text) return;
      D.aendereKonto(email, function (x) {
        x.projekte.forEach(function (pr) {
          if (pr.id === id) pr.aktivitaet.unshift({ text: text, datum: D.heute(), zeit: Date.now() });
        });
      });
      adminLog("Update veröffentlicht", email + ": " + kurz(text, 80));
      updateInput.value = "";
      updateKnopf.textContent = "Veröffentlicht";
      setTimeout(function () { updateKnopf.textContent = "Update veröffentlichen"; }, 1800);
      renderProjektDetail(email, id);
    });
    ukarte.appendChild(updateKnopf);

    if (p.aktivitaet.length) {
      ukarte.appendChild(el("p", "dash-hinweis", "Bisherige Updates:"));
      var ul = el("ul", "akt-liste");
      p.aktivitaet.slice(0, 5).forEach(function (a) {
        var li = el("li", "akt-item");
        li.appendChild(el("span", "akt-punkt"));
        var inhalt = el("span");
        inhalt.appendChild(el("b", "", a.text));
        inhalt.appendChild(el("small", "", D.tagLabel(a.datum)));
        li.appendChild(inhalt);
        ul.appendChild(li);
      });
      ukarte.appendChild(ul);
    }
    halter.appendChild(ukarte);

    /* Wünsche des Kunden (Wunschliste aus dem Kundenportal) */
    p.todos = p.todos || [];
    var wkarte = el("div", "dash-card wunsch-karte");
    wkarte.appendChild(el("h3", "", "Wünsche des Kunden"));
    var wliste = el("ul", "wunsch-liste");
    function zeichneAdminWuensche() {
      wliste.innerHTML = "";
      if (!p.todos.length) {
        wliste.appendChild(leerZeile("Der Kunde hat noch keine Wünsche eingetragen."));
        return;
      }
      p.todos.forEach(function (t, i) {
        var li = el("li", "wunsch-item" + (t.erledigt ? " erledigt" : ""));
        var check = el("button", "wunsch-check");
        check.type = "button";
        check.setAttribute("aria-label", t.erledigt ? "Als offen markieren" : "Als erledigt markieren");
        if (t.erledigt) check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
        check.addEventListener("click", function () {
          D.aendereKonto(email, function (x) {
            x.projekte.forEach(function (pr) {
              if (pr.id === id) { pr.todos = pr.todos || []; if (pr.todos[i]) pr.todos[i].erledigt = !pr.todos[i].erledigt; }
            });
          });
          adminLog("Kundenwunsch abgehakt", email + ": " + kurz(t.text, 60));
          zeichneAdminWuensche();
        });
        li.appendChild(check);
        li.appendChild(el("span", "wunsch-text", t.text));
        wliste.appendChild(li);
      });
    }
    zeichneAdminWuensche();
    wkarte.appendChild(wliste);
    halter.appendChild(wkarte);
  }

  /* ---------- Tickets ---------- */

  function renderTickets() {
    var tbody = document.getElementById("tickets-tabelle");
    var filter = document.getElementById("ticket-filter").value;
    tbody.innerHTML = "";
    var liste = alleTickets();
    if (filter === "offen") {
      liste = liste.filter(function (e) { return e.ticket.status !== "Geschlossen"; });
    }
    if (!liste.length) {
      leerTabelle(tbody, 7, filter === "offen" ? "Keine offenen Tickets." : "Noch keine Tickets.");
      return;
    }
    liste.forEach(function (e) {
      var t = e.ticket;
      var tr = document.createElement("tr");
      tr.className = "klickbar";

      var statusTd = document.createElement("td");
      statusTd.appendChild(pill(t.status));
      tr.appendChild(statusTd);

      tr.appendChild(el("td", "klein nowrap", t.nr || "–"));

      var betreffTd = document.createElement("td");
      betreffTd.appendChild(el("b", "", t.betreff));
      tr.appendChild(betreffTd);

      tr.appendChild(el("td", "klein", D.anzeigeName(e.konto)));

      var letzter = t.antworten.length ? t.antworten[t.antworten.length - 1] : null;
      tr.appendChild(el("td", "klein", kurz(letzter ? (letzter.von === "ich" ? "Kunde: " : "Du: ") + letzter.text : t.text, 60)));
      tr.appendChild(el("td", "klein nowrap", D.kurzeZeit(ticketZeit(t)) || t.datum));
      tr.appendChild(el("td", "z-pfeil", "›"));

      tr.addEventListener("click", function () {
        navigiere("tickets/" + encodeURIComponent(e.konto.email) + "/" + t.nr);
      });
      tbody.appendChild(tr);
    });
  }
  document.getElementById("ticket-filter").addEventListener("change", renderTickets);

  function ticketBlock(vonText, zeitpunkt, text, vonUns) {
    var block = el("div", "ticket-block" + (vonUns ? " von-uns" : ""));
    block.appendChild(el("div", "tb-meta", vonText + " · " + zeitpunkt));
    block.appendChild(el("p", "", text));
    return block;
  }

  function renderTicketDetail(email, nr) {
    var halter = document.getElementById("ticket-detail");
    halter.innerHTML = "";
    var k = D.findeKonto(email);
    var t = null;
    if (k) k.tickets.forEach(function (x) { if (x.nr === nr) t = x; });
    if (!k || !t) { navigiere("tickets"); return; }

    var kopf = el("div", "panel-kopf");
    var kt = el("div");
    kt.appendChild(el("h1", "", t.betreff));
    var meta = el("p", "detail-meta");
    var kundeLink = el("button", "card-link", D.anzeigeName(k));
    kundeLink.type = "button";
    kundeLink.addEventListener("click", function () { navigiere("kunden/" + encodeURIComponent(k.email)); });
    meta.appendChild(document.createTextNode(t.nr + " · "));
    meta.appendChild(kundeLink);
    meta.appendChild(document.createTextNode(" · eröffnet am " + t.datum + " · Priorität " + (t.prio || "Normal")));
    kt.appendChild(meta);

    var aktionen = el("div", "panel-aktionen");
    var statusSelect = document.createElement("select");
    statusSelect.className = "mini-select";
    D.TICKET_STATUS.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      if (s === t.status) opt.selected = true;
      statusSelect.appendChild(opt);
    });
    statusSelect.addEventListener("change", function () {
      D.aendereKonto(email, function (x) {
        x.tickets.forEach(function (tk) { if (tk.nr === nr) tk.status = statusSelect.value; });
      });
      adminLog("Ticket-Status geändert", email + ": " + nr + " zu " + statusSelect.value);
      renderBadges();
      renderTickets();
      renderUebersicht();
      renderTicketDetail(email, nr);
    });
    aktionen.appendChild(statusSelect);
    kopf.appendChild(kt);
    kopf.appendChild(aktionen);
    halter.appendChild(kopf);

    var karte = el("div", "dash-card");
    var verlauf = el("div", "ticket-verlauf");
    verlauf.appendChild(ticketBlock(D.anzeigeName(k), D.tagLabel(t.datum), t.text, false));
    t.antworten.forEach(function (a) {
      verlauf.appendChild(ticketBlock(a.von === "ich" ? D.anzeigeName(k) : "masesites", D.tagLabel(a.datum), a.text, a.von !== "ich"));
    });
    karte.appendChild(verlauf);

    var form = document.createElement("form");
    form.className = "chat-eingabe ticket-antwort";
    var input = document.createElement("input");
    input.type = "text";
    input.name = "text";
    input.required = true;
    input.placeholder = "Als masesites antworten";
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
      D.aendereKonto(email, function (x) {
        x.tickets.forEach(function (tk) {
          if (tk.nr === nr) {
            tk.antworten.push({ von: "masesites", text: text, datum: D.heute(), zeit: Date.now() });
            if (tk.status === "Offen") tk.status = "Beantwortet";
          }
        });
      });
      adminLog("Ticket beantwortet", email + ": " + nr);
      renderBadges();
      renderTickets();
      renderUebersicht();
      renderTicketDetail(email, nr);
    });
    karte.appendChild(form);
    halter.appendChild(karte);
  }

  /* ---------- Nachrichten: Posteingang ---------- */

  var aktiveEmail = "";

  function hakenSvg(doppelt) {
    var eins = '<path d="M1.5 6.5 5 10 11.5 2.5"/>';
    var zwei = '<path d="M1 6.5 4.5 10 11 2.5"/><path d="M8 6.8 10.5 10 17 3"/>';
    return '<svg viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (doppelt ? zwei : eins) + '</svg>';
  }

  function renderInbox() {
    var halter = document.getElementById("inbox-eintraege");
    var filter = document.getElementById("inbox-suche").value.trim().toLowerCase();
    halter.innerHTML = "";
    var liste = alleKonten();
    if (filter) {
      liste = liste.filter(function (k) {
        return (k.name + " " + k.firma + " " + k.email).toLowerCase().indexOf(filter) !== -1;
      });
    }
    liste.sort(function (a, b) {
      var za = a.nachrichten.length ? a.nachrichten[a.nachrichten.length - 1].zeit : 0;
      var zb = b.nachrichten.length ? b.nachrichten[b.nachrichten.length - 1].zeit : 0;
      return zb - za;
    });
    if (!liste.length) {
      halter.appendChild(el("p", "inbox-leer", filter ? "Nichts gefunden." : "Noch keine Kunden."));
      return;
    }
    liste.forEach(function (k) {
      var item = document.createElement("button");
      item.type = "button";
      var ungelesen = ungeleseneVonKunde(k);
      item.className = "inbox-item" + (k.email === aktiveEmail ? " aktiv" : "") + (ungelesen ? " ungelesen" : "");

      var avatar = el("span", "side-avatar", (k.firma || k.name || k.email).trim().charAt(0).toUpperCase());
      avatar.setAttribute("aria-hidden", "true");
      item.appendChild(avatar);

      var mitte = el("span", "ib-mitte");
      mitte.appendChild(el("b", "", D.anzeigeName(k)));
      var letzte = k.nachrichten.length ? k.nachrichten[k.nachrichten.length - 1] : null;
      mitte.appendChild(el("small", "", letzte ? (letzte.von === "ich" ? "" : "Du: ") + letzte.text : "Noch keine Nachrichten"));
      item.appendChild(mitte);

      var rechts = el("span", "ib-rechts");
      if (letzte) rechts.appendChild(el("span", "ib-zeit", D.kurzeZeit(letzte.zeit)));
      if (ungelesen) rechts.appendChild(el("span", "ib-anzahl", String(ungelesen)));
      item.appendChild(rechts);

      item.addEventListener("click", function () {
        navigiere("nachrichten/" + encodeURIComponent(k.email));
      });
      halter.appendChild(item);
    });
  }
  document.getElementById("inbox-suche").addEventListener("input", renderInbox);

  function waehleThread(email) {
    aktiveEmail = email;
    /* Kundennachrichten als gelesen markieren, der Kunde sieht den Haken */
    var k = D.findeKonto(email);
    if (k && ungeleseneVonKunde(k) > 0) {
      D.aendereKonto(email, function (x) {
        x.nachrichten.forEach(function (n) { if (n.von === "ich") n.gelesen = true; });
      });
      renderBadges();
      renderUebersicht();
    }
    renderInbox();
    renderThread();
  }

  function renderThread() {
    var halter = document.getElementById("inbox-thread");
    halter.innerHTML = "";
    var k = aktiveEmail ? D.findeKonto(aktiveEmail) : null;
    if (!k) {
      halter.appendChild(el("p", "inbox-leer", "Wähle links einen Kunden, um den Verlauf zu sehen."));
      return;
    }

    var kopf = el("div", "chat-kopf");
    var avatar = el("span", "chat-avatar", (k.firma || k.name || k.email).trim().charAt(0).toUpperCase());
    avatar.setAttribute("aria-hidden", "true");
    kopf.appendChild(avatar);
    var wer = el("span", "chat-wer");
    wer.appendChild(el("b", "", D.anzeigeName(k)));
    wer.appendChild(el("small", "", k.email));
    kopf.appendChild(wer);
    var kundeKnopf = el("button", "mini-knopf", "Kundenseite");
    kundeKnopf.type = "button";
    kundeKnopf.style.marginLeft = "auto";
    kundeKnopf.addEventListener("click", function () { navigiere("kunden/" + encodeURIComponent(k.email)); });
    kopf.appendChild(kundeKnopf);
    halter.appendChild(kopf);

    var verlauf = el("div", "chat-verlauf");
    verlauf.setAttribute("aria-live", "polite");
    var liste = k.nachrichten.slice().sort(function (a, b) { return (a.zeit || 0) - (b.zeit || 0); });
    if (!liste.length) {
      verlauf.appendChild(el("p", "chat-leer", "Noch keine Nachrichten mit diesem Kunden. Schreib die erste."));
    } else {
      var letzterTag = null;
      var vorherige = null;
      liste.forEach(function (n) {
        if (n.datum && n.datum !== letzterTag) {
          verlauf.appendChild(el("div", "chat-tag", D.tagLabel(n.datum)));
          letzterTag = n.datum;
          vorherige = null;
        }
        /* Aus Admin-Sicht: eigene Nachrichten (masesites) rechts, Kunde links */
        var vonUns = n.von !== "ich";
        var folge = !!vorherige && vorherige.von === n.von && (n.zeit - vorherige.zeit) < 5 * 60000;
        var zeileEl = el("div", "chat-zeile " + (vonUns ? "von-ich" : "von-masesites") + (folge ? " folge" : ""));
        if (!vonUns) {
          var mini = el("span", "chat-mini-avatar" + (folge ? " unsichtbar" : ""), (k.firma || k.name || k.email).trim().charAt(0).toUpperCase());
          mini.setAttribute("aria-hidden", "true");
          zeileEl.appendChild(mini);
        }
        var bubble = el("div", "chat-bubble");
        bubble.appendChild(document.createTextNode(n.text));
        bubble.appendChild(el("span", "msg-zeit", D.uhrzeit(n.zeit)));
        if (vonUns) {
          var haken = el("span", "msg-haken" + (n.gelesen ? " gelesen" : ""));
          haken.title = n.gelesen ? "Vom Kunden gelesen" : "Zugestellt";
          haken.innerHTML = hakenSvg(n.gelesen);
          bubble.appendChild(haken);
        }
        zeileEl.appendChild(bubble);
        verlauf.appendChild(zeileEl);
        vorherige = n;
      });
    }
    halter.appendChild(verlauf);

    var form = document.createElement("form");
    form.className = "chat-eingabe";
    var input = document.createElement("input");
    input.type = "text";
    input.name = "text";
    input.required = true;
    input.placeholder = "Als masesites antworten";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("aria-label", "Antwort");
    var knopf = document.createElement("button");
    knopf.className = "chat-senden";
    knopf.type = "submit";
    knopf.setAttribute("aria-label", "Senden");
    knopf.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    form.appendChild(input);
    form.appendChild(knopf);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      D.aendereKonto(k.email, function (x) {
        x.nachrichten.push({ von: "masesites", text: text, datum: D.heute(), zeit: Date.now(), gelesen: false });
      });
      adminLog("Nachricht beantwortet", k.email);
      renderInbox();
      renderThread();
      renderUebersicht();
      var neuesFeld = document.getElementById("inbox-thread").querySelector('input[name="text"]');
      if (neuesFeld) neuesFeld.focus();
    });
    halter.appendChild(form);
    verlauf.scrollTop = verlauf.scrollHeight;
  }

  /* ---------- KI-Chats ---------- */

  function renderKi() {
    var halter = document.getElementById("ki-liste");
    halter.innerHTML = "";
    var gruppen = kiGruppen();
    if (!gruppen.length) {
      var card = el("div", "dash-card");
      card.appendChild(el("p", "leer", "Noch keine Bot-Gespräche aufgezeichnet. Sobald jemand mit dem KI-Bot auf der Website chattet, erscheint der Verlauf hier."));
      halter.appendChild(card);
      return;
    }
    gruppen.forEach(function (g) {
      var card = el("div", "dash-card");
      card.appendChild(el("h3", "", g.name === "Gast" ? "Gast (nicht angemeldet)" : g.name));
      card.appendChild(el("p", "dash-sub", g.eintraege.length + " Nachrichten · zuletzt " + D.zeitText(g.eintraege[g.eintraege.length - 1].zeit)));

      var thread = el("div", "chat-verlauf klein");
      g.eintraege.forEach(function (n) {
        var vomBot = n.von === "bot";
        var zeileEl = el("div", "chat-zeile " + (vomBot ? "von-ich" : "von-masesites"));
        var bubble = el("div", "chat-bubble");
        bubble.appendChild(document.createTextNode(n.text));
        bubble.appendChild(el("span", "msg-zeit", (vomBot ? "Bot" : "Besucher") + " · " + D.uhrzeit(n.zeit)));
        zeileEl.appendChild(bubble);
        thread.appendChild(zeileEl);
      });
      card.appendChild(thread);
      halter.appendChild(card);
      thread.scrollTop = thread.scrollHeight;
    });
  }

  /* ---------- Mitarbeiter ---------- */

  function renderMitarbeiterTabelle() {
    var tbody = document.getElementById("mitarbeiter-tabelle");
    tbody.innerHTML = "";
    var liste = D.mitarbeiter().map(D.normalisiereMitarbeiter);
    if (!liste.length) {
      leerTabelle(tbody, 7, "Noch keine Mitarbeiter. Lege oben das erste Konto an.");
      return;
    }
    liste.forEach(function (m) {
      var tr = document.createElement("tr");
      tr.className = "klickbar";
      var nameTd = document.createElement("td");
      nameTd.appendChild(el("b", "", m.name));
      tr.appendChild(nameTd);
      tr.appendChild(el("td", "klein", m.email));
      tr.appendChild(el("td", "klein", m.rolle || "–"));
      tr.appendChild(el("td", "klein", String(m.kunden.length)));
      var statusTd = document.createElement("td");
      statusTd.appendChild(pill(m.aktiv ? "Aktiv" : "Deaktiviert"));
      tr.appendChild(statusTd);
      tr.appendChild(el("td", "klein", m.erstellt || "–"));
      tr.appendChild(el("td", "z-pfeil", "›"));
      tr.addEventListener("click", function () { navigiere("mitarbeiter/" + m.id); });
      tbody.appendChild(tr);
    });
  }

  document.getElementById("mitarbeiter-neu-form").addEventListener("submit", function (e) {
    e.preventDefault();
    zeigeFehler("mitarbeiter-neu-fehler", "");
    var form = e.target;
    var name = form.querySelector('[name="name"]').value.trim();
    var rolle = form.querySelector('[name="rolle"]').value.trim();
    var email = form.querySelector('[name="email"]').value.trim().toLowerCase();
    var pw = form.querySelector('[name="passwort"]').value;
    if (!name) { zeigeFehler("mitarbeiter-neu-fehler", "Gib einen Namen an."); return; }
    if (pw.length < 8) { zeigeFehler("mitarbeiter-neu-fehler", "Das Passwort braucht mindestens 8 Zeichen."); return; }
    if (D.findeMitarbeiter(email)) { zeigeFehler("mitarbeiter-neu-fehler", "Für diese E-Mail gibt es schon ein Mitarbeiterkonto."); return; }
    /* Das Passwort geht nur zum Server und wird dort gehasht gespeichert */
    D.erstelleMitarbeiter({ name: name, rolle: rolle, email: email, passwort: pw }).then(function (m) {
      adminLog("Mitarbeiter angelegt", name + " (" + email + ")");
      form.reset();
      renderAlles();
      navigiere("mitarbeiter/" + m.id);
    }).catch(function (fehler) {
      zeigeFehler("mitarbeiter-neu-fehler", fehler.message);
    });
  });

  function renderMitarbeiterDetail(id) {
    var halter = document.getElementById("mitarbeiter-detail");
    halter.innerHTML = "";
    var m = D.findeMitarbeiterNachId(id);
    if (!m) { navigiere("mitarbeiter"); return; }

    var kopf = el("div", "panel-kopf");
    var kt = el("div");
    kt.appendChild(el("h1", "", m.name));
    kt.appendChild(el("p", "detail-meta", m.email + (m.rolle ? " · " + m.rolle : "") + " · dabei seit " + (m.erstellt || "–")));
    var aktionen = el("div", "panel-aktionen");
    aktionen.appendChild(pill(m.aktiv ? "Aktiv" : "Deaktiviert"));

    var toggle = el("button", "mini-knopf", m.aktiv ? "Deaktivieren" : "Aktivieren");
    toggle.type = "button";
    toggle.addEventListener("click", function () {
      D.aendereMitarbeiter(id, function (x) { x.aktiv = !x.aktiv; });
      adminLog(m.aktiv ? "Mitarbeiter deaktiviert" : "Mitarbeiter aktiviert", m.email);
      renderMitarbeiterTabelle();
      renderMitarbeiterDetail(id);
    });

    var loeschen = el("button", "mini-knopf gefahr", "Löschen");
    loeschen.type = "button";
    loeschen.addEventListener("click", function () {
      if (!window.confirm("Mitarbeiterkonto " + m.email + " endgültig löschen?")) return;
      D.loescheMitarbeiter(id);
      adminLog("Mitarbeiter gelöscht", m.email);
      renderAlles();
      navigiere("mitarbeiter");
    });

    aktionen.appendChild(toggle);
    aktionen.appendChild(loeschen);
    kopf.appendChild(kt);
    kopf.appendChild(aktionen);
    halter.appendChild(kopf);

    var grid = el("div", "panel-grid");

    /* Stammdaten */
    var stamm = el("div", "dash-card");
    stamm.appendChild(el("h3", "", "Stammdaten"));
    var stammForm = document.createElement("form");
    stammForm.className = "auth-form";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.required = true;
    nameInput.value = m.name;
    var rolleInput = document.createElement("input");
    rolleInput.type = "text";
    rolleInput.value = m.rolle || "";
    rolleInput.placeholder = "Zum Beispiel: Webentwicklung";
    stammForm.appendChild(feld("Name", nameInput));
    stammForm.appendChild(feld("Rolle", rolleInput));
    var stammKnopf = el("button", "btn btn-primary", "Speichern");
    stammKnopf.type = "submit";
    stammForm.appendChild(stammKnopf);
    stammForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      if (!name) return;
      D.aendereMitarbeiter(id, function (x) {
        x.name = name;
        x.rolle = rolleInput.value.trim();
      });
      adminLog("Mitarbeiter aktualisiert", m.email);
      stammKnopf.textContent = "Gespeichert";
      setTimeout(function () { stammKnopf.textContent = "Speichern"; }, 1800);
      renderMitarbeiterTabelle();
    });
    stamm.appendChild(stammForm);
    grid.appendChild(stamm);

    /* Zugang */
    var zugang = el("div", "dash-card");
    zugang.appendChild(el("h3", "", "Zugang"));
    var zmeta = el("ul", "konto-meta");
    var zli = document.createElement("li");
    zli.appendChild(el("span", "", "Anmeldung"));
    zli.appendChild(el("b", "", m.email));
    zmeta.appendChild(zli);
    zugang.appendChild(zmeta);

    var pwForm = document.createElement("form");
    pwForm.className = "auth-form";
    pwForm.style.marginTop = "16px";
    var pwInput = document.createElement("input");
    pwInput.type = "password";
    pwInput.required = true;
    pwInput.minLength = 8;
    pwInput.placeholder = "Mindestens 8 Zeichen";
    pwInput.setAttribute("autocomplete", "new-password");
    pwForm.appendChild(feld("Neues Passwort setzen", pwInput));
    var pwKnopf = el("button", "btn btn-primary", "Passwort speichern");
    pwKnopf.type = "submit";
    pwForm.appendChild(pwKnopf);
    pwForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var pw = pwInput.value;
      if (pw.length < 8) return;
      D.setzeMitarbeiterPasswort(id, pw).then(function () {
        adminLog("Mitarbeiter-Passwort gesetzt", m.email);
        pwForm.reset();
        pwKnopf.textContent = "Gespeichert";
        setTimeout(function () { pwKnopf.textContent = "Passwort speichern"; }, 1800);
      }).catch(function () {
        pwKnopf.textContent = "Fehler beim Speichern";
        setTimeout(function () { pwKnopf.textContent = "Passwort speichern"; }, 1800);
      });
    });
    zugang.appendChild(pwForm);
    zugang.appendChild(el("p", "dash-hinweis", "Anmeldung im Mitarbeiter-Portal unter /mcs mit E-Mail und Passwort."));
    grid.appendChild(zugang);
    halter.appendChild(grid);

    /* Kunden zuweisen */
    var zkarte = el("div", "dash-card");
    zkarte.appendChild(el("h3", "", "Zugewiesene Kunden"));
    var kliste = alleKonten();
    if (!kliste.length) {
      zkarte.appendChild(el("p", "leer", "Noch keine Kundenkonten vorhanden."));
    } else {
      var wahl = el("div", "zuweis-liste");
      var boxen = [];
      kliste.forEach(function (k) {
        var label = document.createElement("label");
        label.className = "zuweis-item" + (m.kunden.indexOf(k.email) !== -1 ? " gewaehlt" : "");
        var box = document.createElement("input");
        box.type = "checkbox";
        box.value = k.email;
        box.checked = m.kunden.indexOf(k.email) !== -1;
        box.addEventListener("change", function () {
          label.classList.toggle("gewaehlt", box.checked);
        });
        boxen.push(box);
        var text = el("span", "zw-text");
        text.appendChild(el("b", "", D.anzeigeName(k)));
        text.appendChild(el("small", "", k.email + " · " + k.projekte.length + " Projekte"));
        label.appendChild(box);
        label.appendChild(text);
        wahl.appendChild(label);
      });
      zkarte.appendChild(wahl);
      var zknopf = el("button", "btn btn-primary", "Zuweisung speichern");
      zknopf.type = "button";
      zknopf.style.marginTop = "16px";
      zknopf.addEventListener("click", function () {
        var gewaehlt = boxen.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        D.aendereMitarbeiter(id, function (x) { x.kunden = gewaehlt; });
        adminLog("Kunden zugewiesen", m.email + ": " + gewaehlt.length + " Kunden");
        zknopf.textContent = "Gespeichert";
        setTimeout(function () { zknopf.textContent = "Zuweisung speichern"; }, 1800);
        renderMitarbeiterTabelle();
      });
      zkarte.appendChild(zknopf);
      zkarte.appendChild(el("p", "dash-hinweis", "Der Mitarbeiter sieht im Portal nur die Projekte, Tickets und Nachrichten dieser Kunden."));
    }
    halter.appendChild(zkarte);
  }

  /* ---------- Protokoll ---------- */

  function renderProtokoll() {
    var tbody = document.getElementById("log-tabelle");
    var hinweis = document.getElementById("log-hinweis");
    var filter = document.getElementById("log-filter").value.trim().toLowerCase();
    tbody.innerHTML = "";
    var eintraege = D.ladeLog().slice().reverse();
    if (filter) {
      eintraege = eintraege.filter(function (e) {
        return (e.konto + " " + e.ip + " " + e.seite + " " + e.aktion + " " + e.detail).toLowerCase().indexOf(filter) !== -1;
      });
    }
    var gesamt = eintraege.length;
    var gezeigt = eintraege.slice(0, 300);
    if (!gezeigt.length) {
      leerTabelle(tbody, 6, filter ? "Nichts gefunden. Passe den Filter an." : "Noch keine Einträge.");
    } else {
      gezeigt.forEach(function (e) {
        var tr = document.createElement("tr");
        [D.zeitText(e.zeit), e.konto, e.ip, e.seite, e.aktion, e.detail || ""].forEach(function (wert, i) {
          var td = document.createElement("td");
          if (i !== 4) td.className = "klein";
          if (i === 0 || i === 2) td.classList.add("nowrap");
          td.textContent = wert;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    hinweis.textContent = gesamt > gezeigt.length
      ? "Zeige die neusten " + gezeigt.length + " von " + gesamt + " Einträgen. Grenze die Suche mit dem Filter ein."
      : gesamt + " Einträge.";
  }
  document.getElementById("log-filter").addEventListener("input", renderProtokoll);
  document.getElementById("log-neu").addEventListener("click", function () {
    /* Frische Daten vom Server holen, dann alles neu zeichnen */
    D.aktualisiere().then(function () {
      renderAlles();
    });
  });
  document.getElementById("log-leeren").addEventListener("click", function () {
    if (!window.confirm("Ganzes Protokoll löschen?")) return;
    D.logLeeren().then(function () {
      renderProtokoll();
      renderUebersicht();
    });
  });

  /* ---------- Einstellungen ---------- */

  function renderDatenInfo() {
    var ul = document.getElementById("daten-info");
    ul.innerHTML = "";
    [
      ["Kunden", String(alleKonten().length)],
      ["Mitarbeiter", String(D.mitarbeiter().length)],
      ["Protokoll-Einträge", String(D.ladeLog().length)],
      ["Bot-Nachrichten", String(D.botLogs().length)],
      ["Admin-Passwort", D.adminPwGeaendert() ? "Eigenes gesetzt" : "Startpasswort (siehe Server)"]
    ].forEach(function (paar) {
      var li = document.createElement("li");
      li.appendChild(el("span", "", paar[0]));
      li.appendChild(el("b", "", paar[1]));
      ul.appendChild(li);
    });
  }

  document.getElementById("pw-form").addEventListener("submit", function (e) {
    e.preventDefault();
    zeigeFehler("pw-fehler", "");
    var alt = e.target.querySelector('[name="alt"]').value;
    var neu = e.target.querySelector('[name="neu"]').value;
    if (neu.length < 8) { zeigeFehler("pw-fehler", "Das neue Passwort braucht mindestens 8 Zeichen."); return; }
    var form = e.target;
    /* Prüfung und Wechsel macht der Server; andere Admin-Sitzungen enden */
    D.adminPasswortAendern(alt, neu).then(function () {
      form.reset();
      var ok = document.getElementById("pw-ok");
      ok.classList.add("show");
      setTimeout(function () { ok.classList.remove("show"); }, 3000);
      renderDatenInfo();
    }).catch(function (fehler) {
      zeigeFehler("pw-fehler", fehler.message);
    });
  });

  /* ---------- Website-Inhalte: Live-Demos (Beispiele) und Referenz-Projekte ----------
     Öffentliche Inhalte der Website; liegen auf dem Server (/api/inhalte)
     und werden hier gepflegt. Speichern schickt immer beide Listen. */

  var INHALTE = { beispiele: [], projekte: [] };
  var INHALT_ARTEN = {
    beispiel: { key: "beispiele", titelFeld: "name", liste: "inhalt-beispiele", form: "beispiel-form", fehler: "beispiel-fehler", neu: "beispiel-neu", abbrechen: "beispiel-abbrechen", leer: "Noch keine Live-Demos eingetragen.", wort: "Beispiel" },
    referenz: { key: "projekte", titelFeld: "firma", liste: "inhalt-projekte", form: "referenz-form", fehler: "referenz-fehler", neu: "referenz-neu", abbrechen: "referenz-abbrechen", leer: "Noch keine Projekte eingetragen.", wort: "Projekt" }
  };

  function ladeWebsiteInhalte() {
    fetch("/api/inhalte", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (daten) {
        if (!daten) return;
        INHALTE.beispiele = Array.isArray(daten.beispiele) ? daten.beispiele : [];
        INHALTE.projekte = Array.isArray(daten.projekte) ? daten.projekte : [];
        renderWebsiteInhalte();
      })
      .catch(function () {});
  }

  function speichereWebsiteInhalte() {
    return fetch("/api/admin/inhalte", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
      body: JSON.stringify(INHALTE)
    }).then(function (r) {
      if (!r.ok) throw new Error("Speichern fehlgeschlagen (" + r.status + "). Lade die Seite neu und probiere es nochmal.");
      return r.json();
    }).then(function (daten) {
      INHALTE.beispiele = daten.beispiele || [];
      INHALTE.projekte = daten.projekte || [];
      renderWebsiteInhalte();
    });
  }

  function renderWebsiteInhalte() {
    Object.keys(INHALT_ARTEN).forEach(function (art) {
      var def = INHALT_ARTEN[art];
      var liste = document.getElementById(def.liste);
      if (!liste) return;
      liste.innerHTML = "";
      var eintraege = INHALTE[def.key];
      if (!eintraege.length) {
        liste.appendChild(leerZeile(def.leer));
        return;
      }
      eintraege.forEach(function (eintrag) {
        var bearbeiten = el("button", "btn btn-ghost klein", "Bearbeiten");
        bearbeiten.type = "button";
        bearbeiten.addEventListener("click", function () { oeffneInhaltForm(art, eintrag); });
        var loeschen = el("button", "btn btn-ghost klein", "Löschen");
        loeschen.type = "button";
        loeschen.addEventListener("click", function () {
          if (!confirm('"' + eintrag[def.titelFeld] + '" wirklich von der Website löschen?')) return;
          INHALTE[def.key] = INHALTE[def.key].filter(function (e) { return e.id !== eintrag.id; });
          speichereWebsiteInhalte().catch(function (f) { alert(f.message); ladeWebsiteInhalte(); });
        });
        liste.appendChild(zeile(
          eintrag[def.titelFeld],
          (eintrag.branche ? eintrag.branche + " · " : "") + kurz(eintrag.beschreibung || eintrag.url || "", 60),
          [bearbeiten, loeschen]
        ));
      });
    });
  }

  function oeffneInhaltForm(art, eintrag) {
    var def = INHALT_ARTEN[art];
    var form = document.getElementById(def.form);
    if (!form) return;
    form.reset();
    zeigeFehler(def.fehler, "");
    form.querySelector('[name="id"]').value = eintrag ? eintrag.id : "";
    if (eintrag) {
      form.querySelectorAll("[name]").forEach(function (feldEl) {
        if (feldEl.name !== "id" && eintrag[feldEl.name] !== undefined) feldEl.value = eintrag[feldEl.name];
      });
    }
    /* Beispiel-Formular: Datei-Feld leeren, Status zur bestehenden Demo zeigen */
    var status = document.getElementById("bf-datei-status");
    if (status) {
      var url = eintrag && eintrag.url ? eintrag.url : "";
      status.textContent = (url.indexOf("/beispiel-demos/") === 0)
        ? "Aktuell: hochgeladene HTML-Datei. Neue Datei wählen, um sie zu ersetzen."
        : "";
    }
    form.classList.remove("hidden");
    var erstes = form.querySelector("input:not([type=hidden])");
    if (erstes) erstes.focus();
  }

  /* HTML-Datei zum Server schicken; gibt die öffentliche Demo-URL zurück. */
  function ladeDemoDateiHoch(datei) {
    var fd = new FormData();
    fd.append("datei", datei);
    return fetch("/api/admin/beispiel-upload", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Requested-With": "fetch" }, /* KEIN Content-Type: Browser setzt multipart */
      body: fd
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || !j.url) throw new Error(j.fehler || "Upload fehlgeschlagen (" + r.status + ").");
        return j.url;
      });
    });
  }

  Object.keys(INHALT_ARTEN).forEach(function (art) {
    var def = INHALT_ARTEN[art];
    var form = document.getElementById(def.form);
    var neuKnopf = document.getElementById(def.neu);
    var abbrechen = document.getElementById(def.abbrechen);
    if (!form || !neuKnopf) return;
    neuKnopf.addEventListener("click", function () { oeffneInhaltForm(art, null); });
    abbrechen.addEventListener("click", function () { form.classList.add("hidden"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      zeigeFehler(def.fehler, "");
      var absenden = form.querySelector('[type="submit"]');
      if (absenden && absenden.disabled) return;

      var eintrag = {};
      form.querySelectorAll("[name]").forEach(function (feldEl) { eintrag[feldEl.name] = feldEl.value.trim(); });

      /* Beispiel: optional eine HTML-Datei hochladen und als url verwenden */
      var dateiInput = (art === "beispiel") ? form.querySelector('input[type="file"]') : null;
      var datei = dateiInput && dateiInput.files && dateiInput.files[0];

      if (absenden) absenden.disabled = true;
      var vorher = datei ? ladeDemoDateiHoch(datei).then(function (url) { eintrag.url = url; }) : Promise.resolve();

      vorher.then(function () {
        if (art === "beispiel" && !eintrag.url) {
          throw new Error("Gib einen Link an oder lade eine HTML-Datei hoch.");
        }
        var listeArr = INHALTE[def.key];
        var index = -1;
        listeArr.forEach(function (v, i) { if (eintrag.id && v.id === eintrag.id) index = i; });
        if (index >= 0) listeArr[index] = eintrag;
        else listeArr.push(eintrag);
        return speichereWebsiteInhalte();
      }).then(function () {
        form.classList.add("hidden");
        adminLog("Website-Inhalt gespeichert", def.wort + ": " + (eintrag[def.titelFeld] || ""));
      }).catch(function (f) {
        zeigeFehler(def.fehler, f.message);
        ladeWebsiteInhalte();
      }).then(function () {
        if (absenden) absenden.disabled = false;
      });
    });
  });

  /* ---------- Alles zeichnen ---------- */

  function renderAlles() {
    renderBadges();
    renderUebersicht();
    renderKunden();
    renderProjekteTabelle();
    renderTickets();
    renderInbox();
    renderThread();
    renderKi();
    renderMitarbeiterTabelle();
    renderProtokoll();
    renderDatenInfo();
    renderWebsiteInhalte();
  }

  /* Jahr im Fussbereich */
  document.querySelectorAll("[data-year]").forEach(function (el2) {
    el2.textContent = new Date().getFullYear();
  });

  /* Laufende Sitzung fortsetzen: Zustand vom Server laden */
  D.bereit("admin").then(function (zustand) {
    if (zustand.angemeldet) {
      istAngemeldet = true;
      zeigeApp();
    }
  });
})();
