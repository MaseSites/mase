/* masesites Datenschicht: gemeinsame Funktionen für das Kundendashboard,
   den Admin-Bereich (/admin) und das Mitarbeiter-Portal (/mcs).
   Prototyp ohne Server: alle Daten liegen im localStorage dieses Browsers.
   ms_konten      = Kundenkonten mit Projekten, Aufträgen, Tickets, Nachrichten
   ms_mitarbeiter = Mitarbeiterkonten mit zugewiesenen Kunden
   ms_log         = Seiten-Protokoll, ms_bot_logs = KI-Chat-Verläufe */

window.MSDaten = (function () {
  "use strict";

  var SCHRITTE = ["Besprechung", "Design", "Entwicklung", "Feedback", "Online"];
  var AUFTRAG_STATUS = ["Offen", "In Arbeit", "Abgeschlossen"];
  var TICKET_STATUS = ["Offen", "Beantwortet", "Geschlossen"];

  /* ---------- Datum und Zeit ---------- */

  function z(n) { return ("0" + n).slice(-2); }
  function datumText(d) { return z(d.getDate()) + "." + z(d.getMonth() + 1) + "." + d.getFullYear(); }
  function heute() { return datumText(new Date()); }
  function gestern() { return datumText(new Date(Date.now() - 86400000)); }
  function uhrzeit(ms) { var d = new Date(ms); return z(d.getHours()) + ":" + z(d.getMinutes()); }
  function zeitText(ms) {
    var d = new Date(ms);
    return datumText(d) + " " + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds());
  }
  function tagLabel(datum) {
    if (datum === heute()) return "Heute";
    if (datum === gestern()) return "Gestern";
    return datum;
  }
  /* Kurzform für Listen: heute die Uhrzeit, gestern "Gestern", sonst Tag.Monat. */
  function kurzeZeit(ms) {
    if (!ms) return "";
    var d = new Date(ms);
    var datum = datumText(d);
    if (datum === heute()) return uhrzeit(ms);
    if (datum === gestern()) return "Gestern";
    return z(d.getDate()) + "." + z(d.getMonth() + 1) + ".";
  }
  function zeitAusDatum(datum) {
    var t = String(datum || "").split(".");
    if (t.length === 3) return new Date(+t[2], +t[1] - 1, +t[0], 12, 0).getTime();
    return Date.now();
  }
  function langesDatum(d) {
    var tage = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    var monate = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    return tage[d.getDay()] + ", " + d.getDate() + ". " + monate[d.getMonth()] + " " + d.getFullYear();
  }

  /* ---------- Passwort-Hash (SHA-256 mit Salt, nie Klartext speichern) ---------- */

  function hashText(text) {
    var daten = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", daten).then(function (buf) {
      var hex = "";
      new Uint8Array(buf).forEach(function (b) { hex += ("0" + b.toString(16)).slice(-2); });
      return hex;
    });
  }
  function zufallsSalt() {
    var a = new Uint8Array(16);
    crypto.getRandomValues(a);
    var hex = "";
    a.forEach(function (b) { hex += ("0" + b.toString(16)).slice(-2); });
    return hex;
  }

  /* ---------- Laufende Nummern (Tickets, Projekte, Mitarbeiter) ---------- */

  function naechsteNummer(schluessel, start, sammler) {
    var n = Math.max(parseInt(localStorage.getItem(schluessel) || "0", 10) || 0, start);
    /* Bestehende Nummern immer mitzählen, damit nie eine doppelt vergeben wird */
    try { sammler(function (wert) { if (wert > n) n = wert; }); } catch (e) {}
    n += 1;
    localStorage.setItem(schluessel, String(n));
    return n;
  }
  function neueTicketNr() {
    return "T-" + naechsteNummer("ms_ticket_zaehler", 1000, function (melde) {
      konten().forEach(function (k) {
        (k.tickets || []).forEach(function (t) {
          var m = /^T-(\d+)$/.exec(t.nr || "");
          if (m) melde(+m[1]);
        });
      });
    });
  }
  function neueProjektId() {
    return "P-" + naechsteNummer("ms_projekt_zaehler", 1000, function (melde) {
      konten().forEach(function (k) {
        (k.projekte || []).forEach(function (p) {
          var m = /^P-(\d+)$/.exec(p.id || "");
          if (m) melde(+m[1]);
        });
      });
    });
  }
  function neueMitarbeiterId() {
    return "M-" + naechsteNummer("ms_mitarbeiter_zaehler", 100, function (melde) {
      mitarbeiter().forEach(function (m) {
        var t = /^M-(\d+)$/.exec(m.id || "");
        if (t) melde(+t[1]);
      });
    });
  }

  /* ---------- Kundenkonten ---------- */

  function konten() {
    try { return JSON.parse(localStorage.getItem("ms_konten") || "[]"); }
    catch (e) { return []; }
  }
  function speichereKonten(liste) {
    localStorage.setItem("ms_konten", JSON.stringify(liste));
  }
  function findeKonto(email) {
    email = (email || "").trim().toLowerCase();
    var treffer = null;
    konten().forEach(function (k) { if (k.email === email) treffer = k; });
    return treffer ? normalisiereKonto(treffer) : null;
  }
  function aktualisiereKonto(konto) {
    var liste = konten();
    var ersetzt = false;
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].email === konto.email) { liste[i] = konto; ersetzt = true; break; }
    }
    if (!ersetzt) liste.push(konto);
    speichereKonten(liste);
  }
  /* Ein Konto gezielt ändern: lädt frisch, wendet fn an, speichert. */
  function aendereKonto(email, fn) {
    var liste = konten();
    liste.forEach(function (k) {
      if (k.email === email) fn(normalisiereKonto(k));
    });
    speichereKonten(liste);
  }
  function loescheKonto(email) {
    speichereKonten(konten().filter(function (k) { return k.email !== email; }));
    /* Zuweisungen bei Mitarbeitern aufräumen */
    var ma = mitarbeiter();
    ma.forEach(function (m) {
      normalisiereMitarbeiter(m);
      m.kunden = m.kunden.filter(function (e) { return e !== email; });
    });
    speichereMitarbeiter(ma);
  }

  /* Ältere Konten auf das aktuelle Modell heben, damit nichts bricht.
     Wichtigste Migration: das einzelne k.projekt wird zur Liste k.projekte. */
  function normalisiereKonto(k) {
    k.firma = k.firma || "";
    k.telefon = k.telefon || "";
    k.auftraege = k.auftraege || [];
    k.tickets = k.tickets || [];
    k.tickets.forEach(function (t) {
      t.antworten = t.antworten || [];
      t.prio = t.prio || "Normal";
      if (!t.zeit) t.zeit = zeitAusDatum(t.datum);
      t.antworten.forEach(function (a) { if (!a.zeit) a.zeit = zeitAusDatum(a.datum); });
    });
    k.nachrichten = k.nachrichten || [];
    k.nachrichten.forEach(function (n) {
      if (!n.zeit) n.zeit = zeitAusDatum(n.datum);
      if (typeof n.gelesen !== "boolean") n.gelesen = true;
    });
    if (!k.projekte) {
      k.projekte = [];
      if (k.projekt) {
        k.projekte.push({
          id: neueProjektId(),
          titel: k.projekt.paket || "Website-Projekt",
          paket: k.projekt.paket || "",
          schritt: k.projekt.schritt || 0,
          vorschau: k.projekt.vorschau || "",
          erstellt: k.erstellt || heute(),
          aktivitaet: k.aktivitaet || []
        });
      }
      delete k.projekt;
      delete k.aktivitaet;
    }
    k.projekte.forEach(function (p) {
      p.aktivitaet = p.aktivitaet || [];
      p.paket = p.paket || "";
      p.vorschau = p.vorschau || "";
      p.schritt = p.schritt || 0;
      p.aktivitaet.forEach(function (a) { if (!a.zeit) a.zeit = zeitAusDatum(a.datum); });
    });
    return k;
  }

  /* Alle Änderungen eines Kontos über alle Projekte, neuste zuerst */
  function alleAktivitaeten(konto) {
    var liste = [];
    (konto.projekte || []).forEach(function (p) {
      p.aktivitaet.forEach(function (a) {
        liste.push({ text: a.text, datum: a.datum, zeit: a.zeit, projekt: p.titel, projektId: p.id });
      });
    });
    liste.sort(function (a, b) { return (b.zeit || 0) - (a.zeit || 0); });
    return liste;
  }

  function fortschritt(projekt) {
    return Math.round((projekt.schritt || 0) / (SCHRITTE.length - 1) * 100);
  }

  /* ---------- Mitarbeiter ---------- */

  function mitarbeiter() {
    try { return JSON.parse(localStorage.getItem("ms_mitarbeiter") || "[]"); }
    catch (e) { return []; }
  }
  function speichereMitarbeiter(liste) {
    localStorage.setItem("ms_mitarbeiter", JSON.stringify(liste));
  }
  function normalisiereMitarbeiter(m) {
    m.kunden = m.kunden || [];
    m.rolle = m.rolle || "";
    m.aktiv = m.aktiv !== false;
    return m;
  }
  function findeMitarbeiter(email) {
    email = (email || "").trim().toLowerCase();
    var treffer = null;
    mitarbeiter().forEach(function (m) { if (m.email === email) treffer = m; });
    return treffer ? normalisiereMitarbeiter(treffer) : null;
  }
  function findeMitarbeiterNachId(id) {
    var treffer = null;
    mitarbeiter().forEach(function (m) { if (m.id === id) treffer = m; });
    return treffer ? normalisiereMitarbeiter(treffer) : null;
  }
  function aendereMitarbeiter(id, fn) {
    var liste = mitarbeiter();
    liste.forEach(function (m) { if (m.id === id) fn(normalisiereMitarbeiter(m)); });
    speichereMitarbeiter(liste);
  }
  function loescheMitarbeiter(id) {
    speichereMitarbeiter(mitarbeiter().filter(function (m) { return m.id !== id; }));
  }
  /* Mitarbeiter, denen dieser Kunde zugewiesen ist */
  function mitarbeiterFuerKunde(email) {
    return mitarbeiter().filter(function (m) {
      return normalisiereMitarbeiter(m).kunden.indexOf(email) !== -1;
    });
  }

  /* ---------- Protokoll und KI-Chats ---------- */

  function ladeLog() {
    try { return JSON.parse(localStorage.getItem("ms_log") || "[]"); }
    catch (e) { return []; }
  }
  function speichereLog(l) { localStorage.setItem("ms_log", JSON.stringify(l)); }
  function protokolliere(kontoLabel, seite, aktion, detail) {
    var ip = "unbekannt";
    try { ip = sessionStorage.getItem("ms_ip") || "unbekannt"; } catch (e) {}
    var l = ladeLog();
    l.push({
      zeit: Date.now(),
      konto: kontoLabel,
      ip: ip,
      seite: seite,
      aktion: String(aktion || "").slice(0, 60),
      detail: String(detail || "").slice(0, 180)
    });
    if (l.length > 3000) l = l.slice(l.length - 3000);
    speichereLog(l);
  }
  function botLogs() {
    try { return JSON.parse(localStorage.getItem("ms_bot_logs") || "[]"); }
    catch (e) { return []; }
  }

  /* ---------- Anzeige-Hilfen ---------- */

  function pillKlasse(status) {
    if (status === "Offen") return "pill offen";
    if (status === "Abgeschlossen" || status === "Geschlossen" || status === "Online" || status === "Aktiv") return "pill fertig";
    if (status === "Deaktiviert") return "pill";
    return "pill arbeit";
  }
  function anzeigeName(k) { return k.firma || k.name || k.email; }

  return {
    SCHRITTE: SCHRITTE,
    AUFTRAG_STATUS: AUFTRAG_STATUS,
    TICKET_STATUS: TICKET_STATUS,
    datumText: datumText,
    heute: heute,
    gestern: gestern,
    uhrzeit: uhrzeit,
    zeitText: zeitText,
    tagLabel: tagLabel,
    kurzeZeit: kurzeZeit,
    zeitAusDatum: zeitAusDatum,
    langesDatum: langesDatum,
    hashText: hashText,
    zufallsSalt: zufallsSalt,
    neueTicketNr: neueTicketNr,
    neueProjektId: neueProjektId,
    neueMitarbeiterId: neueMitarbeiterId,
    konten: konten,
    speichereKonten: speichereKonten,
    findeKonto: findeKonto,
    aktualisiereKonto: aktualisiereKonto,
    aendereKonto: aendereKonto,
    loescheKonto: loescheKonto,
    normalisiereKonto: normalisiereKonto,
    alleAktivitaeten: alleAktivitaeten,
    fortschritt: fortschritt,
    mitarbeiter: mitarbeiter,
    speichereMitarbeiter: speichereMitarbeiter,
    normalisiereMitarbeiter: normalisiereMitarbeiter,
    findeMitarbeiter: findeMitarbeiter,
    findeMitarbeiterNachId: findeMitarbeiterNachId,
    aendereMitarbeiter: aendereMitarbeiter,
    loescheMitarbeiter: loescheMitarbeiter,
    mitarbeiterFuerKunde: mitarbeiterFuerKunde,
    ladeLog: ladeLog,
    speichereLog: speichereLog,
    protokolliere: protokolliere,
    botLogs: botLogs,
    pillKlasse: pillKlasse,
    anzeigeName: anzeigeName
  };
})();
