/* masesites Startseite: Intro-Sequenz + Live-Morph-Preview + rotierende Headline */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Branchen-Daten für das Morph-Preview ---------- */

  var BRANDS = [
    {
      id: "restaurant",
      chip: "Restaurant",
      word: "deinem Restaurant",
      url: "zur-goldenen-rebe.ch",
      logo: "Zur Goldenen Rebe",
      links: ["Menü", "Reservieren", "Über uns"],
      navBtn: "Tisch buchen",
      img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=70",
      heroTitle: "Ein Abend, der bleibt.",
      heroSub: "Saisonale Küche · regionale Weine",
      heroCta: "Tisch reservieren",
      cards: [
        { t: "Menü", s: "Saisonal & regional, wöchentlich neu", tag: "Ansehen" },
        { t: "Weinkarte", s: "Ausgewählte Winzer aus der Region", tag: "Entdecken" },
        { t: "Events", s: "Private Feiern bis 40 Gäste", tag: "Anfragen" }
      ],
      bubble: "Hallo! Möchtest du einen Tisch reservieren?"
    },
    {
      id: "event",
      chip: "Eventplattform",
      word: "deinem Event",
      url: "groupify.app",
      logo: "groupify",
      links: ["Events", "Tickets", "Community"],
      navBtn: "Ticket sichern",
      img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=70",
      heroTitle: "Finde dein nächstes Event.",
      heroSub: "Konzerte · Festivals · Meetups",
      heroCta: "Events entdecken",
      cards: [
        { t: "Sa, 12.09.", s: "Open-Air im Stadtpark", tag: "Tickets" },
        { t: "Fr, 25.09.", s: "Indie-Nacht im Kulturhaus", tag: "Tickets" },
        { t: "So, 04.10.", s: "Foodmarket am Fluss", tag: "Gratis" }
      ],
      bubble: "Fragen zu Tickets oder zum Ablauf? Ich helfe dir!"
    },
    {
      id: "friseur",
      chip: "Friseur",
      word: "deinem Salon",
      url: "studio-schnittwerk.ch",
      logo: "Schnittwerk",
      links: ["Team", "Preise", "Galerie"],
      navBtn: "Termin buchen",
      img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=70",
      heroTitle: "Dein Look. Dein Tag.",
      heroSub: "Schnitt · Farbe · Styling",
      heroCta: "Termin buchen",
      cards: [
        { t: "Schnitt", s: "Beratung inklusive, ab 30 Min.", tag: "ab CHF 45" },
        { t: "Farbe", s: "Balayage, Strähnen, Glossing", tag: "ab CHF 90" },
        { t: "Styling", s: "Für Feste & besondere Tage", tag: "ab CHF 60" }
      ],
      bubble: "Hallo! Möchtest du einen Termin buchen?"
    },
    {
      id: "shop",
      chip: "Onlineshop",
      word: "deinem Shop",
      url: "nordlicht-store.ch",
      logo: "NORDLICHT",
      links: ["Neu", "Kollektion", "Sale"],
      navBtn: "Warenkorb",
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=70",
      heroTitle: "Bewusst produziert. Fair verschickt.",
      heroSub: "Neue Kollektion, jetzt online",
      heroCta: "Jetzt shoppen",
      cards: [
        { t: "Rucksack Fjell", s: "Recyceltes Canvas, 22 l", tag: "CHF 129" },
        { t: "Beanie Nord", s: "Merinowolle, 4 Farben", tag: "CHF 39" },
        { t: "Flasche Vika", s: "Isoliert, 0,75 l", tag: "CHF 34" }
      ],
      bubble: "Ich berate dich gern. Suchst du etwas Bestimmtes?"
    },
    {
      id: "app",
      chip: "Apps",
      word: "deiner App",
      url: "tapo.app",
      logo: "tapo",
      links: ["Features", "Pricing", "Blog"],
      navBtn: "App laden",
      img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=70",
      heroTitle: "Deine Finanzen. Ein Tap.",
      heroSub: "Budget, Sparziele & Insights",
      heroCta: "Kostenlos starten",
      cards: [
        { t: "Budgets", s: "Automatisch kategorisiert", tag: "Smart" },
        { t: "Sparziele", s: "Gemeinsam oder allein", tag: "Neu" },
        { t: "Insights", s: "Wohin dein Geld fließt", tag: "Live" }
      ],
      bubble: "Brauchst du Hilfe beim Einstieg? Ich bin da!"
    }
  ];

  var site = document.getElementById("morph-site");
  if (!site) return;

  var rotorWord = document.getElementById("rotor-word");
  var frameUrl = document.getElementById("frame-url");
  var chips = document.querySelectorAll(".chips .chip[data-brand]");
  var current = 0;
  var timer = null;
  var ROTATE_MS = 4200;

  function render(brand) {
    site.setAttribute("data-brand", brand.id);
    if (frameUrl) frameUrl.textContent = "https://" + brand.url;

    site.querySelector(".ps-logo b").textContent = brand.logo;
    var links = site.querySelectorAll(".ps-links span");
    brand.links.forEach(function (l, i) { if (links[i]) links[i].textContent = l; });
    site.querySelector(".ps-btn").textContent = brand.navBtn;

    var img = site.querySelector(".ps-hero img");
    img.src = brand.img;
    img.alt = "Beispielbild " + brand.chip;

    site.querySelector(".ps-hero-text strong").textContent = brand.heroTitle;
    site.querySelector(".ps-hero-text span").textContent = brand.heroSub;
    site.querySelector(".ps-hero-cta").textContent = brand.heroCta;

    var cards = site.querySelectorAll(".ps-card");
    brand.cards.forEach(function (c, i) {
      if (!cards[i]) return;
      cards[i].querySelector("b").textContent = c.t;
      cards[i].querySelector("span").textContent = c.s;
      cards[i].querySelector(".ps-tag").textContent = c.tag;
    });

    site.querySelector(".ps-bubble").textContent = brand.bubble;
  }

  function setActiveChip(id) {
    chips.forEach(function (c) {
      var on = c.getAttribute("data-brand") === id;
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function swapWord(word) {
    if (!rotorWord) return;
    if (reducedMotion) { rotorWord.textContent = word; return; }
    rotorWord.classList.add("out");
    setTimeout(function () {
      rotorWord.textContent = word;
      rotorWord.classList.remove("out");
    }, 320);
  }

  function goTo(index, viaClick) {
    current = (index + BRANDS.length) % BRANDS.length;
    var brand = BRANDS[current];
    setActiveChip(brand.id);
    swapWord(brand.word);

    var bubble = site.querySelector(".ps-bubble");
    if (reducedMotion) {
      render(brand);
    } else {
      site.classList.add("morphing");
      bubble.classList.add("out");
      setTimeout(function () {
        render(brand);
        site.classList.remove("morphing");
        setTimeout(function () { bubble.classList.remove("out"); }, 200);
      }, 320);
    }

    if (viaClick) stopAuto();
  }

  function startAuto() {
    if (reducedMotion) return;
    timer = setInterval(function () { goTo(current + 1); }, ROTATE_MS);
  }
  function stopAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var id = chip.getAttribute("data-brand");
      var idx = BRANDS.findIndex(function (b) { return b.id === id; });
      if (idx >= 0) goTo(idx, true);
    });
  });

  /* Bilder der nächsten Branchen vorladen, damit der Morph nicht ruckelt */
  function preload() {
    BRANDS.forEach(function (b) { var i = new Image(); i.src = b.img; });
  }

  /* Rotor auf die Breite des längsten Wortes fixieren: so springt „passt." nicht
     und die Headline bleibt stabil bei genau zwei Zeilen. */
  function fixiereRotorBreite() {
    if (!rotorWord) return;
    var rotor = rotorWord.parentElement;
    var cs = getComputedStyle(rotorWord);
    var probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px";
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontSize = cs.fontSize;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.letterSpacing = cs.letterSpacing;
    document.body.appendChild(probe);
    var max = 0;
    BRANDS.forEach(function (b) { probe.textContent = b.word; max = Math.max(max, probe.getBoundingClientRect().width); });
    probe.remove();
    rotor.style.minWidth = Math.ceil(max + 1) + "px";
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fixiereRotorBreite); } else { fixiereRotorBreite(); }
  var rb;
  window.addEventListener("resize", function () { clearTimeout(rb); rb = setTimeout(fixiereRotorBreite, 150); });

  render(BRANDS[0]);
  setActiveChip(BRANDS[0].id);
  if ("requestIdleCallback" in window) requestIdleCallback(preload); else setTimeout(preload, 1200);

  /* ---------- Hero-Auftritt: bewusst gestaffelt, nur beim Laden (nicht mausgesteuert) ---------- */

  function revealHero() { document.body.classList.add("hero-in"); }

  /* ---------- Intro-Sequenz (< 2 s, nur 1× pro Session) ---------- */

  var INTRO_KEY = "ms_intro_seen";
  var canIntro = !reducedMotion && !sessionStorage.getItem(INTRO_KEY);

  if (canIntro) {
    sessionStorage.setItem(INTRO_KEY, "1");
    var overlay = document.createElement("div");
    overlay.className = "intro-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="intro-stage">' +
        '<div class="intro-word">mase<i>sites</i></div>' +
        '<div class="intro-monitor">' +
          '<div class="intro-screen">' +
            '<div class="intro-frame">' +
              '<div class="intro-block b1"></div>' +
              '<div class="intro-block b2"></div>' +
              '<div class="intro-block b3"></div>' +
              '<div class="intro-block b4"></div>' +
            '</div>' +
          '</div>' +
          '<div class="intro-stand"></div>' +
          '<div class="intro-base"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    /* Monitor + Bausteine montiert, dann löst sich das Overlay schnell in den Hero auf,
       und der Hero-Inhalt steigt bewusst gestaffelt nach */
    setTimeout(function () {
      overlay.classList.add("done");
      document.body.style.overflow = "";
      revealHero();
      setTimeout(function () { overlay.remove(); }, 420);
    }, 1100);
  } else {
    revealHero();
  }

  window.addEventListener("beforeunload", stopAuto);
  startAuto();
})();
