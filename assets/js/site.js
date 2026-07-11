/* masesites: globales Verhalten (Header, Menü, Reveals, FAQ, Chat-Bot, Formular) */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: schrumpft & bekommt Hintergrund beim Scrollen ---------- */

  var header = document.querySelector(".site-header");

  /* Header-Pille slidet nur beim ERSTEN Laden der Sitzung rein;
     bei jedem weiteren Seitenwechsel steht sie sofort da. */
  try {
    if (header && !sessionStorage.getItem("ms_header_gesehen")) {
      sessionStorage.setItem("ms_header_gesehen", "1");
      var kopfPille = header.querySelector(".header-inner");
      if (kopfPille) kopfPille.classList.add("slide-rein");
    }
  } catch (e) {}

  function onScroll() {
    var abGescrollt = window.scrollY > 24;
    if (header) header.classList.toggle("scrolled", abGescrollt);
    document.body.classList.toggle("gescrollt", abGescrollt);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile-Menü ---------- */

  var burger = document.querySelector(".burger");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        burger.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Scroll-Reveals (gestaffelt via data-delay) ---------- */

  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var delay = e.target.getAttribute("data-delay") || 0;
          e.target.style.transitionDelay = delay + "ms";
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Magnetischer Maus-Button entfernt (2026-07-07): kein mausgesteuertes
     Verschieben von Elementen, wirkt verspielt. Buttons haben nur den
     bewussten CSS-Hover (leichtes Anheben). */

  /* ---------- FAQ-Akkordeon ---------- */

  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0";
    });
  });

  /* ---------- Chat-Bot: skriptete Demo-Antworten ----------
     Ohne Backend: Stichwort-Matcher mit realistischen Antworten.
     Später durch echtes Bot-Backend ersetzbar (eine Stelle: botReply). */

  var BOT_RULES = [
    {
      match: /(preis|kost|chf|teuer|budget|offert)/i,
      reply: "Gute Frage! Eine neue Website gibt es ab CHF 750.–, die Überarbeitung einer bestehenden Seite ab CHF 250.–. Der KI-Bot kostet CHF 200.– Einrichtung plus CHF 40.– pro Monat. Auf der Preisseite kannst du dir dein Paket selbst zusammenklicken, und vor Projektstart bekommst du eine Offerte mit festem Preis.",
      link: { href: "/preise", label: "Zu den Preisen →" }
    },
    {
      match: /(einbau|integr|bestehend|nachträglich|wordpress|wix|shopify)/i,
      reply: "Der KI-Bot lässt sich in fast jede Website einbauen, auch nachträglich in bestehende Seiten. Bei einer neuen masesites-Website ist er auf Wunsch von Anfang an drin."
    },
    {
      match: /(termin|buch|reserv|anfrage annehmen)/i,
      reply: "Ja! Der Bot kann Terminwünsche, Reservierungen und Anfragen direkt im Chat entgegennehmen und leitet sie an dich weiter, rund um die Uhr."
    },
    {
      match: /(sprach|englisch|français|italien|mehrsprach)/i,
      reply: "Der Bot antwortet mehrsprachig: Er erkennt die Sprache deiner Besucher und antwortet passend, zum Beispiel auf Deutsch, Englisch oder Französisch."
    },
    {
      match: /(daten|dsgvo|datenschutz|privacy)/i,
      reply: "Datenschutz nehmen wir ernst: Der Bot sammelt nur, was für deine Anfrage nötig ist. Die Details klären wir transparent im Projekt, frag uns einfach direkt."
    },
    {
      match: /(roboter|künstlich|klingt|ton)/i,
      reply: "Keine Sorge, wir stellen Ton und Antworten auf deine Marke ein. Der Bot klingt nach dir, nicht nach Maschine. Und wenn er etwas nicht weiss, leitet er die Frage an dich weiter, statt zu raten."
    },
    {
      match: /(website|webseite|homepage|projekt|starten|angebot)/i,
      reply: "Wir bauen dir eine persönliche, professionelle Website, massgeschneidert für deine Branche, mobil optimiert und auf Wunsch mit KI-Bot. Erzähl uns kurz von deinem Projekt!",
      link: { href: "/kontakt", label: "Projekt starten →" }
    },
    {
      match: /(hallo|hi|hoi|hey|grüezi|guten tag|servus|moin)/i,
      reply: "Hallo! Schön, dass du da bist. Ich bin der masesites-Bot, genau so einer, wie du ihn für deine Website haben kannst. Frag mich etwas zu Websites, Preisen oder dem KI-Bot!"
    },
    {
      match: /(danke|merci|super|cool|toll)/i,
      reply: "Sehr gern! Wenn du mehr wissen willst: Das Team ist per E-Mail an info@masesites.ch erreichbar. Oder du startest direkt dein Projekt."
    }
  ];

  var BOT_FALLBACK = "Das weiss ich nicht auswendig, und ich rate lieber nicht. Schreib kurz an info@masesites.ch oder nutz das Kontaktformular, dann meldet sich ein Mensch bei dir.";

  function botReply(text) {
    for (var i = 0; i < BOT_RULES.length; i++) {
      if (BOT_RULES[i].match.test(text)) return BOT_RULES[i];
    }
    return { reply: BOT_FALLBACK, link: { href: "/kontakt", label: "Zum Kontaktformular →" } };
  }

  /* Bot-Chats für den Admin-Bereich aufzeichnen: gehen an den Server und
     liegen dort verschlüsselt in der Datenbank. Wer angemeldet ist,
     erkennt der Server selbst an der Sitzung. */
  function botLog(von, text) {
    try {
      fetch("/api/bot-log", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
        body: JSON.stringify({
          seite: location.pathname.split("/").pop() || "index.html",
          von: von,
          text: String(text).slice(0, 400)
        })
      }).catch(function () {});
    } catch (e) {}
  }

  var botIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var sendIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  function buildChatUI(root, opts) {
    opts = opts || {};
    root.innerHTML =
      '<div class="chat-head">' +
        '<div class="ps-avatar">' + botIconSvg + '<span class="online" aria-hidden="true"></span></div>' +
        '<div><div class="name">masesites-Bot</div><div class="status"><i></i>online</div></div>' +
        (opts.closable ? '<button class="widget-close" aria-label="Chat schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' : '') +
      '</div>' +
      '<div class="chat-body" aria-live="polite"></div>' +
      '<div class="chat-chips">' +
        '<button type="button">Was kostet das?</button>' +
        '<button type="button">Wie baut ihr das ein?</button>' +
        '<button type="button">Kann er Termine buchen?</button>' +
      '</div>' +
      '<form class="chat-input">' +
        '<input type="text" placeholder="Schreib mir etwas …" aria-label="Nachricht an den Bot">' +
        '<button type="submit" aria-label="Senden">' + sendIconSvg + '</button>' +
      '</form>' +
      '<div class="chat-note">Demo: So fühlt sich dein Bot an, trainiert auf deine Inhalte.</div>';

    var body = root.querySelector(".chat-body");
    var form = root.querySelector(".chat-input");
    var input = form.querySelector("input");
    var busy = false;
    /* Erst aufzeichnen, wenn der Besucher wirklich etwas schreibt. Die
       Standard-Begrüssung beim Laden landet sonst als Leerlauf im Admin. */
    var echterDialog = false;

    function addMsg(text, who, link) {
      if (who === "user") echterDialog = true;
      if (echterDialog) botLog(who, text);
      var div = document.createElement("div");
      div.className = "msg " + who;
      div.textContent = text;
      if (link) {
        div.appendChild(document.createElement("br"));
        var a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.label;
        div.appendChild(a);
      }
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    function respond(text) {
      if (busy) return;
      busy = true;
      addMsg(text, "user");
      var typing = document.createElement("div");
      typing.className = "msg bot typing";
      typing.innerHTML = "<i></i><i></i><i></i>";
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      setTimeout(function () {
        typing.remove();
        var r = botReply(text);
        addMsg(r.reply, "bot", r.link);
        busy = false;
      }, reducedMotion ? 60 : 750 + Math.random() * 450);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = "";
      respond(v);
    });

    root.querySelectorAll(".chat-chips button").forEach(function (b) {
      b.addEventListener("click", function () { respond(b.textContent); });
    });

    addMsg(opts.greeting || "Hallo! Ich bin der masesites-Bot. Frag mich etwas, zum Beispiel was eine Website kostet.", "bot");
    return { respond: respond };
  }

  /* Eingebettete Demos auf den Seiten */
  document.querySelectorAll("[data-chat]").forEach(function (el) {
    buildChatUI(el, { greeting: el.getAttribute("data-chat-greeting") || undefined });
  });

  /* ---------- Globales Chat-Widget unten rechts ---------- */

  if (!document.body.hasAttribute("data-no-widget")) {
    var launcher = document.createElement("button");
    launcher.className = "widget-launcher";
    launcher.setAttribute("aria-label", "Chat mit dem masesites-Bot öffnen");
    launcher.innerHTML = botIconSvg + '<span class="online" aria-hidden="true"></span>';

    var panel = document.createElement("div");
    panel.className = "widget-panel chat-demo";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "masesites-Bot Chat");

    document.body.appendChild(panel);
    document.body.appendChild(launcher);

    var built = false;
    launcher.addEventListener("click", function () {
      if (!built) {
        buildChatUI(panel, {
          closable: true,
          greeting: "Hallo! Ich bin der masesites-Bot. Womit kann ich helfen?"
        });
        panel.querySelector(".widget-close").addEventListener("click", function () {
          panel.classList.remove("open");
        });
        built = true;
      }
      panel.classList.toggle("open");
      if (panel.classList.contains("open")) {
        var inp = panel.querySelector(".chat-input input");
        if (inp && window.matchMedia("(pointer: fine)").matches) inp.focus();
      }
    });
  }

  /* ---------- Kontaktformular: mailto-Versand + Honeypot ---------- */

  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    /* Wunschpaket aus dem Preis-Rechner in die Nachricht übernehmen */
    var paket = sessionStorage.getItem("ms_paket");
    if (paket) {
      var nachrichtFeld = contactForm.querySelector('[name="nachricht"]');
      if (nachrichtFeld && !nachrichtFeld.value) nachrichtFeld.value = paket;
      sessionStorage.removeItem("ms_paket");
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      /* Honeypot: Bots füllen das unsichtbare Feld, dann still "ok" melden */
      var hp = contactForm.querySelector('[name="firma_website"]');
      var success = document.getElementById("form-success");
      if (hp && hp.value) {
        if (success) success.classList.add("show");
        contactForm.reset();
        return;
      }

      var get = function (name) {
        var el = contactForm.querySelector('[name="' + name + '"]');
        return el ? el.value.trim() : "";
      };
      var interessen = [];
      contactForm.querySelectorAll('[name="interesse"]:checked').forEach(function (c) {
        interessen.push(c.value);
      });

      var body =
        "Name: " + get("name") + "\n" +
        "E-Mail: " + get("email") + "\n" +
        (get("telefon") ? "Telefon: " + get("telefon") + "\n" : "") +
        "Branche: " + get("branche") + "\n" +
        "Interesse: " + (interessen.join(", ") || "keine Angabe") + "\n\n" +
        get("nachricht");

      var mailto = "mailto:info@masesites.ch" +
        "?subject=" + encodeURIComponent("Projektanfrage von " + get("name")) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailto;
      if (success) {
        success.classList.add("show");
        success.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
      }
    });
  }

  /* ---------- Jahr im Footer ---------- */

  /* Nur im Footer: Preis-Karten nutzen data-year als Preis-Attribut */
  document.querySelectorAll(".site-footer [data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Listen-Kaskade: Einträge listen sich schnell nacheinander auf ----------
     Bekannte Listen-Container bekommen automatisch die schnelle Kaskade:
     jedes Kind erscheint 55 ms nach dem vorherigen (CSS: .stagger-los).
     Einzel-Reveals auf den Kindern werden entfernt, sonst blendet es doppelt. */

  var LISTEN_SELEKTOR = [
    "[data-stagger]",
    ".offer-list",
    ".bot-benefits",
    ".price-features",
    ".faq",
    ".footer-grid",
    ".chat-chips",
    "#demo-grid",
    "#projekte-grid"
  ].join(", ");

  var listen = document.querySelectorAll(LISTEN_SELEKTOR);
  if (listen.length && "IntersectionObserver" in window && !reducedMotion) {
    var listenIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("stagger-los");
        e.target.classList.remove("stagger-warten");
        listenIO.unobserve(e.target);
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -30px 0px" });

    listen.forEach(function (liste) {
      Array.prototype.forEach.call(liste.children, function (kind, i) {
        kind.classList.remove("reveal", "in");
        kind.style.setProperty("--sx", i);
      });
      liste.classList.add("stagger-warten");
      listenIO.observe(liste);
    });
  }
})();
