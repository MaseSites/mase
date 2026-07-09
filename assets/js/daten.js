/* masesites Datenschicht: gemeinsame Funktionen für das Kundendashboard,
   den Admin-Bereich (/admin) und das Mitarbeiter-Portal (/mcs).
   Alle Daten liegen verschlüsselt in der Datenbank auf dem Server; diese
   Schicht lädt sie beim Start über die API in den Speicher und schickt
   Änderungen im Hintergrund zurück. Angemeldet wird über ein HttpOnly-
   Sitzungscookie, das der Server setzt — hier liegt kein Passwort und
   keine Sitzung mehr im localStorage. */

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

  /* ---------- API-Aufrufe ---------- */

  function api(pfad, methode, daten) {
    var optionen = {
      method: methode || "GET",
      credentials: "same-origin",
      headers: { "X-Requested-With": "fetch" }
    };
    if (daten !== undefined) {
      optionen.headers["Content-Type"] = "application/json";
      optionen.body = JSON.stringify(daten);
    }
    return fetch(pfad, optionen).then(function (antwort) {
      return antwort.json().catch(function () { return {}; }).then(function (json) {
        if (!antwort.ok) {
          var fehler = new Error(json.fehler || "Der Server hat mit Fehler " + antwort.status + " geantwortet.");
          fehler.status = antwort.status;
          throw fehler;
        }
        return json;
      });
    });
  }

  /* Schreibzugriffe der Reihe nach abschicken, damit nichts überholt wird.
     Schlägt einer fehl, erscheint einmalig ein Hinweis-Banner. */
  var sendekette = Promise.resolve();
  var bannerSichtbar = false;

  function zeigeSyncFehler(fehler) {
    if (fehler && fehler.status === 401) {
      /* Sitzung abgelaufen: neu laden, die Seite leitet dann zum Login */
      window.location.reload();
      return;
    }
    console.error("masesites: Speichern fehlgeschlagen:", fehler);
    if (bannerSichtbar || !document.body) return;
    bannerSichtbar = true;
    var banner = document.createElement("div");
    banner.setAttribute("role", "alert");
    banner.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);" +
      "background:#b3261e;color:#fff;padding:10px 18px;border-radius:10px;z-index:9999;" +
      "font:500 14px/1.4 inherit;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw;";
    banner.textContent = "Änderung konnte nicht gespeichert werden. Prüfe die Verbindung und lade die Seite neu.";
    document.body.appendChild(banner);
    setTimeout(function () {
      banner.remove();
      bannerSichtbar = false;
    }, 8000);
  }

  function sende(pfad, methode, daten) {
    sendekette = sendekette
      .then(function () { return api(pfad, methode, daten); })
      .catch(zeigeSyncFehler);
    return sendekette;
  }

  /* ---------- Zustand: beim Start vom Server geladen ---------- */

  var zustand = {
    rolle: null,          /* kunde | admin | mcs */
    angemeldet: false,
    kunden: [],
    mitarbeiter: [],
    ma: null,             /* eigenes Mitarbeiterkonto im /mcs-Portal */
    log: [],
    botlogs: [],
    adminPwGeaendert: false
  };

  /* Lädt den Zustand passend zur Rolle. Nicht angemeldet ist kein Fehler:
     dann kommt { angemeldet: false } zurück und die Seite zeigt den Login. */
  function bereit(rolle) {
    zustand.rolle = rolle;
    var pfad = rolle === "admin" ? "/api/admin/daten"
      : rolle === "mcs" ? "/api/mcs/daten"
      : "/api/ich";
    return api(pfad).then(function (json) {
      zustand.angemeldet = true;
      if (rolle === "admin") {
        zustand.kunden = (json.kunden || []).map(normalisiereKonto);
        zustand.mitarbeiter = (json.mitarbeiter || []).map(normalisiereMitarbeiter);
        zustand.log = json.log || [];
        zustand.botlogs = json.botlogs || [];
        zustand.adminPwGeaendert = !!json.adminPwGeaendert;
      } else if (rolle === "mcs") {
        zustand.ma = normalisiereMitarbeiter(json.ma || {});
        zustand.mitarbeiter = [zustand.ma];
        zustand.kunden = (json.kunden || []).map(normalisiereKonto);
      } else {
        zustand.kunden = json.konto ? [normalisiereKonto(json.konto)] : [];
      }
      return zustand;
    }).catch(function (fehler) {
      zustand.angemeldet = false;
      zustand.kunden = [];
      zustand.mitarbeiter = [];
      zustand.ma = null;
      if (fehler.status !== 401) console.error("masesites: Laden fehlgeschlagen:", fehler);
      return zustand;
    });
  }
  function aktualisiere() { return bereit(zustand.rolle); }
  function angemeldet() { return zustand.angemeldet; }

  /* ---------- An- und Abmelden ---------- */

  function registrieren(daten) {
    return api("/api/registrieren", "POST", daten);
  }
  function anmelden(email, passwort) {
    return api("/api/anmelden", "POST", { email: email, passwort: passwort });
  }
  function googleAnmeldung(credential) {
    return api("/api/google", "POST", { credential: credential });
  }
  function demoAnmeldung() {
    return api("/api/demo", "POST", {});
  }
  function abmelden() {
    /* Nur die eigene Rolle abmelden — Admin-, Mitarbeiter- und Kunden-
       Sitzung haben eigene Cookies und stören sich nicht gegenseitig */
    var typ = zustand.rolle === "admin" ? "admin"
      : zustand.rolle === "mcs" ? "mitarbeiter"
      : "kunde";
    return api("/api/abmelden", "POST", { typ: typ }).catch(function () {});
  }
  function adminAnmelden(passwort) {
    return api("/api/admin/anmelden", "POST", { passwort: passwort });
  }
  function adminPasswortAendern(alt, neu) {
    return api("/api/admin/passwort", "POST", { alt: alt, neu: neu }).then(function () {
      zustand.adminPwGeaendert = true;
    });
  }
  function mcsAnmelden(email, passwort) {
    return api("/api/mcs/anmelden", "POST", { email: email, passwort: passwort });
  }

  /* ---------- Kundenkonten ---------- */

  function konten() { return zustand.kunden; }

  function findeKonto(email) {
    email = (email || "").trim().toLowerCase();
    var treffer = null;
    zustand.kunden.forEach(function (k) { if (k.email === email) treffer = k; });
    return treffer ? normalisiereKonto(treffer) : null;
  }

  /* Änderungen an einem Konto zum Server schicken — der Pfad hängt davon ab,
     wer angemeldet ist. Der Server prüft die Berechtigung nochmal. */
  function syncKonto(email) {
    var konto = findeKonto(email);
    if (!konto) return;
    if (zustand.rolle === "admin") {
      sende("/api/admin/kunden/" + encodeURIComponent(konto.email), "PUT", { konto: konto });
    } else if (zustand.rolle === "mcs") {
      sende("/api/mcs/kunden/" + encodeURIComponent(konto.email), "PUT", { konto: konto });
    } else {
      sende("/api/ich", "PUT", { konto: konto });
    }
  }

  function aktualisiereKonto(konto) {
    var ersetzt = false;
    for (var i = 0; i < zustand.kunden.length; i++) {
      if (zustand.kunden[i].email === konto.email) { zustand.kunden[i] = konto; ersetzt = true; break; }
    }
    if (!ersetzt) zustand.kunden.push(konto);
    syncKonto(konto.email);
  }

  /* Ein Konto gezielt ändern: fn anwenden, dann zum Server schicken. */
  function aendereKonto(email, fn) {
    zustand.kunden.forEach(function (k) {
      if (k.email === email) fn(normalisiereKonto(k));
    });
    syncKonto(email);
  }

  function loescheKonto(email) {
    zustand.kunden = zustand.kunden.filter(function (k) { return k.email !== email; });
    /* Zuweisungen bei Mitarbeitern aufräumen (macht der Server auch selbst) */
    zustand.mitarbeiter.forEach(function (m) {
      normalisiereMitarbeiter(m);
      m.kunden = m.kunden.filter(function (e) { return e !== email; });
    });
    sende("/api/admin/kunden/" + encodeURIComponent(email), "DELETE");
  }

  /* Fehlende Felder ergänzen, damit die Oberfläche nie auf undefined läuft */
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
    k.projekte = k.projekte || [];
    k.projekte.forEach(function (p) {
      p.aktivitaet = p.aktivitaet || [];
      p.paket = p.paket || "";
      p.vorschau = p.vorschau || "";
      p.schritt = p.schritt || 0;
      p.aktivitaet.forEach(function (a) { if (!a.zeit) a.zeit = zeitAusDatum(a.datum); });
    });
    return k;
  }

  /* Neues Ticket: die Nummer vergibt der Server, damit sie eindeutig ist */
  function neuesTicket(daten) {
    return api("/api/ich/tickets", "POST", daten).then(function (json) {
      var konto = zustand.kunden[0];
      if (konto) {
        konto.tickets = konto.tickets || [];
        konto.tickets.unshift(json.ticket);
      }
      return json.ticket;
    });
  }

  /* Neues Projekt (nur Admin): ID kommt vom Server */
  function neuesProjekt(email, daten) {
    return api("/api/admin/kunden/" + encodeURIComponent(email) + "/projekte", "POST", daten)
      .then(function (json) {
        var konto = findeKonto(email);
        if (konto) konto.projekte.push(json.projekt);
        return json.projekt;
      });
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

  function mitarbeiter() { return zustand.mitarbeiter; }

  function normalisiereMitarbeiter(m) {
    m.kunden = m.kunden || [];
    m.rolle = m.rolle || "";
    m.aktiv = m.aktiv !== false;
    return m;
  }
  function findeMitarbeiter(email) {
    email = (email || "").trim().toLowerCase();
    var treffer = null;
    zustand.mitarbeiter.forEach(function (m) { if (m.email === email) treffer = m; });
    return treffer ? normalisiereMitarbeiter(treffer) : null;
  }
  function findeMitarbeiterNachId(id) {
    var treffer = null;
    zustand.mitarbeiter.forEach(function (m) { if (m.id === id) treffer = m; });
    return treffer ? normalisiereMitarbeiter(treffer) : null;
  }
  function erstelleMitarbeiter(daten) {
    return api("/api/admin/mitarbeiter", "POST", daten).then(function (json) {
      zustand.mitarbeiter.push(normalisiereMitarbeiter(json.mitarbeiter));
      return json.mitarbeiter;
    });
  }
  function aendereMitarbeiter(id, fn) {
    var m = findeMitarbeiterNachId(id);
    if (!m) return;
    fn(m);
    sende("/api/admin/mitarbeiter/" + encodeURIComponent(id), "PUT", {
      name: m.name, rolle: m.rolle, aktiv: m.aktiv, kunden: m.kunden
    });
  }
  function setzeMitarbeiterPasswort(id, passwort) {
    return api("/api/admin/mitarbeiter/" + encodeURIComponent(id) + "/passwort", "POST", { passwort: passwort });
  }
  function loescheMitarbeiter(id) {
    zustand.mitarbeiter = zustand.mitarbeiter.filter(function (m) { return m.id !== id; });
    sende("/api/admin/mitarbeiter/" + encodeURIComponent(id), "DELETE");
  }
  /* Mitarbeiter, denen dieser Kunde zugewiesen ist */
  function mitarbeiterFuerKunde(email) {
    return zustand.mitarbeiter.filter(function (m) {
      return normalisiereMitarbeiter(m).kunden.indexOf(email) !== -1;
    });
  }

  /* ---------- Protokoll und KI-Chats ---------- */

  function ladeLog() { return zustand.log; }
  function botLogs() { return zustand.botlogs; }

  function protokolliere(kontoLabel, seite, aktion, detail) {
    var eintrag = {
      zeit: Date.now(),
      konto: kontoLabel || "Gast",
      ip: "–",
      seite: seite,
      aktion: String(aktion || "").slice(0, 60),
      detail: String(detail || "").slice(0, 180)
    };
    /* Sofort in der Ansicht zeigen; der Server speichert mit echter IP */
    zustand.log.push(eintrag);
    try {
      fetch("/api/log", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
        body: JSON.stringify({ seite: eintrag.seite, aktion: eintrag.aktion, detail: eintrag.detail })
      }).catch(function () {});
    } catch (e) {}
  }

  function logLeeren() {
    return api("/api/admin/log", "DELETE").then(function () {
      zustand.log = [];
    });
  }
  function adminPwGeaendert() { return zustand.adminPwGeaendert; }

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
    bereit: bereit,
    aktualisiere: aktualisiere,
    angemeldet: angemeldet,
    registrieren: registrieren,
    anmelden: anmelden,
    googleAnmeldung: googleAnmeldung,
    demoAnmeldung: demoAnmeldung,
    abmelden: abmelden,
    adminAnmelden: adminAnmelden,
    adminPasswortAendern: adminPasswortAendern,
    adminPwGeaendert: adminPwGeaendert,
    mcsAnmelden: mcsAnmelden,
    konten: konten,
    findeKonto: findeKonto,
    aktualisiereKonto: aktualisiereKonto,
    aendereKonto: aendereKonto,
    loescheKonto: loescheKonto,
    normalisiereKonto: normalisiereKonto,
    neuesTicket: neuesTicket,
    neuesProjekt: neuesProjekt,
    alleAktivitaeten: alleAktivitaeten,
    fortschritt: fortschritt,
    mitarbeiter: mitarbeiter,
    normalisiereMitarbeiter: normalisiereMitarbeiter,
    findeMitarbeiter: findeMitarbeiter,
    findeMitarbeiterNachId: findeMitarbeiterNachId,
    erstelleMitarbeiter: erstelleMitarbeiter,
    aendereMitarbeiter: aendereMitarbeiter,
    setzeMitarbeiterPasswort: setzeMitarbeiterPasswort,
    loescheMitarbeiter: loescheMitarbeiter,
    mitarbeiterFuerKunde: mitarbeiterFuerKunde,
    ladeLog: ladeLog,
    protokolliere: protokolliere,
    logLeeren: logLeeren,
    botLogs: botLogs,
    pillKlasse: pillKlasse,
    anzeigeName: anzeigeName
  };
})();
