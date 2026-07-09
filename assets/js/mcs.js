/* masesites Mitarbeiter-Portal (/mcs): Anmeldung mit Mitarbeiterkonto,
   danach Zugriff auf die zugewiesenen Kunden mit ihren Projekten, Tickets
   und Nachrichten. Konten legt die Verwaltung im Admin-Bereich an.
   Baut auf daten.js auf; angemeldet wird über eine Server-Sitzung, der
   Server liefert nur die zugewiesenen Kunden aus. */

(function () {
  "use strict";

  var D = window.MSDaten;

  function zeigeFehler(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("show", !!text);
  }

  var gate = document.getElementById("mcs-gate");
  var app = document.getElementById("mcs-app");
  if (!gate || !app) return;

  var ma = null;

  function maLog(aktion, detail) {
    D.protokolliere("MA " + (ma ? ma.name : "unbekannt"), "mcs", aktion, detail);
  }

  /* ---------- Anmeldung ---------- */

  function zeigeApp() {
    gate.classList.add("hidden");
    app.classList.remove("hidden");
    document.querySelectorAll("[data-ma-sichtbar]").forEach(function (el) { el.classList.remove("hidden"); });
    var vorname = ma.name.split(" ")[0];
    var initiale = ma.name.trim().charAt(0).toUpperCase();
    document.querySelectorAll("[data-ma-name]").forEach(function (el) { el.textContent = ma.name; });
    document.querySelectorAll("[data-ma-vorname]").forEach(function (el) { el.textContent = vorname; });
    document.querySelectorAll("[data-ma-avatar]").forEach(function (el) { el.textContent = initiale; });
    document.querySelectorAll("[data-ma-rolle]").forEach(function (el) { el.textContent = ma.rolle || "Mitarbeiter"; });
    renderAlles();
    route();
  }

  function abmelden() {
    maLog("Mitarbeiter abgemeldet", "");
    D.abmelden().then(function () {
      window.location.hash = "";
      window.location.reload();
    });
  }
  document.querySelectorAll("[data-ma-logout]").forEach(function (btn) {
    btn.addEventListener("click", abmelden);
  });

  var loginForm = document.getElementById("mcs-login-form");
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    zeigeFehler("mcs-fehler", "");
    var email = loginForm.querySelector('[name="email"]').value.trim().toLowerCase();
    var pw = loginForm.querySelector('[name="passwort"]').value;
    /* Passwort prüft der Server, danach den Zustand laden */
    D.mcsAnmelden(email, pw).then(function () {
      return D.bereit("mcs");
    }).then(function (zustand) {
      if (!zustand.angemeldet || !zustand.ma) {
        zeigeFehler("mcs-fehler", "Anmeldung fehlgeschlagen. Probiere es nochmal.");
        return;
      }
      ma = zustand.ma;
      loginForm.reset();
      zeigeApp();
    }).catch(function (fehler) {
      zeigeFehler("mcs-fehler", fehler.message);
    });
  });

  /* ---------- Datensicht: nur zugewiesene Kunden ---------- */

  function meineKonten() {
    if (!ma) return [];
    var aktuelle = D.findeMitarbeiter(ma.email);
    if (aktuelle) ma = aktuelle;
    return D.konten().map(D.normalisiereKonto).filter(function (k) {
      return ma.kunden.indexOf(k.email) !== -1;
    });
  }
  function istMeinKunde(email) {
    return meineKonten().some(function (k) { return k.email === email; });
  }
  function meineTickets() {
    var liste = [];
    meineKonten().forEach(function (k) {
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
  function meineProjekte() {
    var liste = [];
    meineKonten().forEach(function (k) {
      k.projekte.forEach(function (p) { liste.push({ konto: k, projekt: p }); });
    });
    return liste;
  }
  function ungeleseneVonKunde(k) {
    return k.nachrichten.filter(function (n) { return n.von === "ich" && !n.gelesen; }).length;
  }
  function wartendeKonten() {
    return meineKonten().filter(function (k) {
      if (!k.nachrichten.length) return false;
      return k.nachrichten[k.nachrichten.length - 1].von === "ich";
    });
  }

  /* ---------- Routing ---------- */

  var HAUPTROUTEN = ["uebersicht", "kunden", "projekte", "tickets", "nachrichten"];

  function navigiere(pfad) {
    if (location.hash === "#" + pfad) route();
    else location.hash = "#" + pfad;
  }

  function route() {
    if (!ma) return;
    var h = location.hash.replace(/^#\/?/, "");
    var teile = h.split("/").map(function (t) { return decodeURIComponent(t); });
    var name = teile[0] || "uebersicht";
    if (HAUPTROUTEN.indexOf(name) === -1) { name = "uebersicht"; teile = [name]; }

    var panelName = name;
    if (name === "kunden" && teile[1]) {
      panelName = "kunde-detail";
      renderKundeDetail(teile[1]);
    } else if (name === "projekte" && teile[1] && teile[2]) {
      panelName = "projekt-detail";
      renderProjektDetail(teile[1], teile[2]);
    } else if (name === "tickets" && teile[1] && teile[2]) {
      panelName = "ticket-detail";
      renderTicketDetail(teile[1], teile[2]);
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
  function hakenSvg(doppelt) {
    var eins = '<path d="M1.5 6.5 5 10 11.5 2.5"/>';
    var zwei = '<path d="M1 6.5 4.5 10 11 2.5"/><path d="M8 6.8 10.5 10 17 3"/>';
    return '<svg viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (doppelt ? zwei : eins) + '</svg>';
  }

  /* ---------- Kennzahlen und Badges ---------- */

  function renderBadges() {
    var werte = {
      kunden: meineKonten().length,
      projekte: meineProjekte().filter(function (e) { return e.projekt.schritt < D.SCHRITTE.length - 1; }).length,
      tickets: meineTickets().filter(function (e) { return e.ticket.status === "Offen"; }).length,
      nachrichten: meineKonten().filter(function (k) { return ungeleseneVonKunde(k) > 0; }).length
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
    var offene = meineTickets().filter(function (e) { return e.ticket.status === "Offen"; });
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
  }

  /* ---------- Kunden ---------- */

  function renderKunden() {
    var tbody = document.getElementById("kunden-tabelle");
    tbody.innerHTML = "";
    var liste = meineKonten();
    if (!liste.length) {
      leerTabelle(tbody, 6, "Dir sind noch keine Kunden zugewiesen. Die Zuweisung macht die Verwaltung.");
      return;
    }
    liste.forEach(function (k) {
      var tr = document.createElement("tr");
      tr.className = "klickbar";
      var wer = document.createElement("td");
      wer.appendChild(el("b", "", D.anzeigeName(k)));
      tr.appendChild(wer);
      tr.appendChild(el("td", "klein", k.email));
      tr.appendChild(el("td", "klein", k.telefon || "–"));
      tr.appendChild(el("td", "klein", String(k.projekte.length)));
      tr.appendChild(el("td", "klein", String(k.tickets.filter(function (t) { return t.status !== "Geschlossen"; }).length)));
      tr.appendChild(el("td", "z-pfeil", "›"));
      tr.addEventListener("click", function () { navigiere("kunden/" + encodeURIComponent(k.email)); });
      tbody.appendChild(tr);
    });
  }

  function renderKundeDetail(email) {
    var halter = document.getElementById("kunde-detail");
    halter.innerHTML = "";
    if (!istMeinKunde(email)) { navigiere("kunden"); return; }
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
    aktionen.appendChild(nachricht);
    kopf.appendChild(kt);
    kopf.appendChild(aktionen);
    halter.appendChild(kopf);

    var grid = el("div", "panel-grid");
    var stamm = el("div", "dash-card");
    stamm.appendChild(el("h3", "", "Stammdaten"));
    var meta = el("ul", "konto-meta");
    [
      ["Name", k.name || "–"],
      ["Firma", k.firma || "–"],
      ["E-Mail", k.email],
      ["Telefon", k.telefon || "–"]
    ].forEach(function (paar) {
      var li = document.createElement("li");
      li.appendChild(el("span", "", paar[0]));
      li.appendChild(el("b", "", paar[1]));
      meta.appendChild(li);
    });
    stamm.appendChild(meta);
    grid.appendChild(stamm);

    var tkarte = el("div", "dash-card");
    tkarte.appendChild(el("h3", "", "Tickets"));
    var tliste = el("ul", "zeilen-liste");
    if (!k.tickets.length) {
      tliste.appendChild(leerZeile("Keine Tickets."));
    } else {
      k.tickets.slice(0, 5).forEach(function (t) {
        tliste.appendChild(zeile(
          t.betreff,
          t.nr + " · " + D.tagLabel(t.datum),
          [pill(t.status)],
          function () { navigiere("tickets/" + encodeURIComponent(k.email) + "/" + t.nr); }
        ));
      });
    }
    tkarte.appendChild(tliste);
    grid.appendChild(tkarte);
    halter.appendChild(grid);

    var pkarte = el("div", "dash-card schlank");
    var pkopf = el("div", "card-head");
    pkopf.appendChild(el("h3", "", "Projekte"));
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
  }

  /* ---------- Projekte ---------- */

  function renderProjekteTabelle() {
    var tbody = document.getElementById("projekte-tabelle");
    tbody.innerHTML = "";
    var liste = meineProjekte();
    if (!liste.length) {
      leerTabelle(tbody, 6, "Keine Projekte. Sobald deinen Kunden Projekte zugeordnet sind, erscheinen sie hier.");
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
      tr.appendChild(el("td", "z-pfeil", "›"));

      tr.addEventListener("click", function () {
        navigiere("projekte/" + encodeURIComponent(e.konto.email) + "/" + p.id);
      });
      tbody.appendChild(tr);
    });
  }

  function renderProjektDetail(email, id) {
    var halter = document.getElementById("projekt-detail");
    halter.innerHTML = "";
    if (!istMeinKunde(email)) { navigiere("projekte"); return; }
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
    meta.appendChild(document.createTextNode(" · " + p.id + (p.paket ? " · " + p.paket : "")));
    kt.appendChild(meta);
    var aktionen = el("div", "panel-aktionen");
    aktionen.appendChild(schrittPill(p));
    kopf.appendChild(kt);
    kopf.appendChild(aktionen);
    halter.appendChild(kopf);

    /* Stand pflegen */
    var karte = el("div", "dash-card projekt-editor");
    karte.appendChild(el("h3", "", "Stand pflegen"));

    var schrittSelect = document.createElement("select");
    D.SCHRITTE.forEach(function (name, i) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = (i + 1) + ". " + name;
      if (i === (p.schritt || 0)) opt.selected = true;
      schrittSelect.appendChild(opt);
    });
    var vorschauInput = document.createElement("input");
    vorschauInput.type = "url";
    vorschauInput.placeholder = "https://…";
    vorschauInput.value = p.vorschau || "";

    var reihe = el("div", "auth-row");
    reihe.appendChild(feld("Aktueller Schritt", schrittSelect));
    reihe.appendChild(feld("Vorschau-Adresse", vorschauInput));
    karte.appendChild(reihe);

    var aktionenZeile = el("div", "preview-actions");
    var speichern = el("button", "btn btn-primary projekt-speichern", "Speichern");
    speichern.type = "button";
    speichern.addEventListener("click", function () {
      D.aendereKonto(email, function (x) {
        x.projekte.forEach(function (pr) {
          if (pr.id === id) {
            pr.schritt = parseInt(schrittSelect.value, 10) || 0;
            pr.vorschau = vorschauInput.value.trim();
          }
        });
      });
      maLog("Projekt aktualisiert", email + ": " + p.id + " zu Schritt " + D.SCHRITTE[parseInt(schrittSelect.value, 10) || 0]);
      speichern.textContent = "Gespeichert";
      setTimeout(function () { speichern.textContent = "Speichern"; }, 1800);
      renderBadges();
      renderProjekteTabelle();
    });
    aktionenZeile.appendChild(speichern);
    karte.appendChild(aktionenZeile);
    halter.appendChild(karte);

    /* Update veröffentlichen */
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
      maLog("Update veröffentlicht", email + ": " + kurz(text, 80));
      updateInput.value = "";
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
  }

  /* ---------- Tickets ---------- */

  function renderTickets() {
    var tbody = document.getElementById("tickets-tabelle");
    var filter = document.getElementById("ticket-filter").value;
    tbody.innerHTML = "";
    var liste = meineTickets();
    if (filter === "offen") {
      liste = liste.filter(function (e) { return e.ticket.status !== "Geschlossen"; });
    }
    if (!liste.length) {
      leerTabelle(tbody, 7, filter === "offen" ? "Keine offenen Tickets." : "Keine Tickets.");
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
    if (!istMeinKunde(email)) { navigiere("tickets"); return; }
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
      maLog("Ticket-Status geändert", email + ": " + nr + " zu " + statusSelect.value);
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
      maLog("Ticket beantwortet", email + ": " + nr);
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

  function renderInbox() {
    var halter = document.getElementById("inbox-eintraege");
    var filter = document.getElementById("inbox-suche").value.trim().toLowerCase();
    halter.innerHTML = "";
    var liste = meineKonten();
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
      halter.appendChild(el("p", "inbox-leer", filter ? "Nichts gefunden." : "Noch keine zugewiesenen Kunden."));
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
    if (!istMeinKunde(email)) { navigiere("nachrichten"); return; }
    aktiveEmail = email;
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
      maLog("Nachricht beantwortet", k.email);
      renderInbox();
      renderThread();
      renderUebersicht();
      var neuesFeld = document.getElementById("inbox-thread").querySelector('input[name="text"]');
      if (neuesFeld) neuesFeld.focus();
    });
    halter.appendChild(form);
    verlauf.scrollTop = verlauf.scrollHeight;
  }

  /* ---------- Alles zeichnen ---------- */

  function renderAlles() {
    renderBadges();
    renderUebersicht();
    renderKunden();
    renderProjekteTabelle();
    renderTickets();
    renderInbox();
    renderThread();
  }

  /* Jahr im Fussbereich */
  document.querySelectorAll("[data-year]").forEach(function (el2) {
    el2.textContent = new Date().getFullYear();
  });

  /* Laufende Sitzung fortsetzen: Zustand vom Server laden */
  D.bereit("mcs").then(function (zustand) {
    if (zustand.angemeldet && zustand.ma) {
      ma = zustand.ma;
      zeigeApp();
    }
  });
})();
