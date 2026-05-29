/* =============================================================
   MASE — Scroll Animations (Vanilla JS, drop-in v2)
   Lädt nach mase-animations.js. Erweitert die Seite um:
   1. Parallax auf Hero-Mesh + opt-in Elemente
   2. Schwebende Partikel hinter .hero, .ai, .pricing-teaser
   3. Process-Linie die sich beim Scroll zeichnet
   4. Counter-Pop für Preise / Zahlen
   5. Velocity-Marquee
   6. Konfetti beim Klick auf primary CTA
   7. Idle-Bob auf Badges (per CSS bereits aktiv)
   ============================================================= */
(function () {
  'use strict';
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- Hilfsfunktionen -----
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  // -----------------------------------------------------------
  // 1. PARALLAX
  // -----------------------------------------------------------
  function initParallax() {
    // Hero-Mesh-Blobs bekommen Auto-Parallax
    var blobs = document.querySelectorAll('.mase-hero-mesh .mase-blob');
    var generic = document.querySelectorAll('[data-parallax]');
    if (!blobs.length && !generic.length) return;

    function onScroll() {
      var y = window.scrollY;
      blobs.forEach(function (b, i) {
        // unterschiedliche Geschwindigkeiten für Tiefe
        var speed = [0.15, -0.1, 0.22][i] || 0.15;
        b.style.transform = 'translate3d(0,' + (y * speed) + 'px,0)';
      });
      generic.forEach(function (el) {
        var s = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = 'translate3d(0,' + (center * -s) + 'px,0)';
        el.classList.add('mase-parallax');
      });
    }
    var throttled = rafThrottle(onScroll);
    window.addEventListener('scroll', throttled, { passive: true });
    onScroll();
  }

  // -----------------------------------------------------------
  // 2. SCHWEBENDE PARTIKEL
  // -----------------------------------------------------------
  function initParticles() {
    var sections = [
      { sel: '.hero',            count: 14, classes: ['c1', 'c2', 'c3'] },
      { sel: '.ai',              count: 12, classes: ['c1', 'c3'] },
      { sel: '.pricing-teaser',  count: 10, classes: ['c1', 'c2'] }
    ];
    sections.forEach(function (cfg) {
      var sec = document.querySelector(cfg.sel);
      if (!sec || sec.querySelector(':scope > .mase-particles')) return;
      var host = document.createElement('div');
      host.className = 'mase-particles';
      host.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < cfg.count; i++) {
        var d = document.createElement('span');
        d.className = 'mase-particles__dot ' + cfg.classes[i % cfg.classes.length];
        if (i % 5 === 0) d.classList.add('big');
        else if (i % 7 === 0) d.classList.add('small');
        d.style.left = Math.random() * 100 + '%';
        d.style.setProperty('--dur', (10 + Math.random() * 14) + 's');
        d.style.setProperty('--delay', (-Math.random() * 20) + 's');
        host.appendChild(d);
      }
      sec.insertBefore(host, sec.firstChild);
    });
  }

  // -----------------------------------------------------------
  // 3. PROCESS-LINE — SVG die sich beim Scroll zeichnet
  // -----------------------------------------------------------
  function initProcessLine() {
    var grid = document.querySelector('.process-grid');
    if (!grid) return;
    if (grid.querySelector(':scope > .mase-process-line-wrap')) return;

    var wrap = document.createElement('div');
    wrap.className = 'mase-process-line-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '' +
      '<svg viewBox="0 0 1000 4" preserveAspectRatio="none">' +
        '<defs><linearGradient id="mase-line-grad" x1="0" x2="1" y1="0" y2="0">' +
          '<stop offset="0%"  stop-color="#0f766e"/>' +
          '<stop offset="50%" stop-color="#0b5f58"/>' +
          '<stop offset="100%" stop-color="#0066cc"/>' +
        '</linearGradient></defs>' +
        '<path class="mase-process-line" d="M0 2 L1000 2"/>' +
      '</svg>';
    grid.style.position = grid.style.position || 'relative';
    grid.appendChild(wrap);

    var path = wrap.querySelector('.mase-process-line');
    var len = 1000;
    path.style.strokeDasharray = len + ' ' + len;
    path.style.strokeDashoffset = len;

    function update() {
      var rect = grid.getBoundingClientRect();
      var vh = window.innerHeight;
      var start = vh * 0.85;
      var end = vh * 0.2;
      var raw = (start - rect.top) / (start - end + rect.height);
      var p = Math.min(1, Math.max(0, raw));
      path.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
    }
    var throttled = rafThrottle(update);
    window.addEventListener('scroll', throttled, { passive: true });
    update();
  }

  // -----------------------------------------------------------
  // 4. COUNTER-ROLLUPS — Zahlen rollen hoch, wenn sie im Viewport landen
  // -----------------------------------------------------------
  function initCounters() {
    if (!('IntersectionObserver' in window)) return;

    // Selektoren wo wir nach Zahlen suchen
    // Ihr habt z.B. "Speed 95", "Ladezeit 1.2s", "SEO 98" auf der Preview
    // sowie Preise wie "CHF 750", "ab CHF 250" etc.
    var candidates = document.querySelectorAll(
      '.metric-value, .demo-price-value, .hero-benefit-price, ' +
      '.pricing-total, [data-mase-counter], h3, p'
    );
    var targets = [];
    candidates.forEach(function (el) {
      // findet "750", "CHF 750", "98", "1.2", "24/7"...
      var match = el.textContent.match(/^(\D*)(\d[\d'.,\u00a0]*)(\D*)$/);
      if (!match) return;
      var rawNum = match[2].replace(/['\u00a0,]/g, '');
      var num = parseFloat(rawNum);
      if (isNaN(num) || num < 5) return; // 24/7 ignorieren, kleine zahlen auch
      // Nicht doppelt
      if (el.dataset.maseCountered) return;
      el.dataset.maseCountered = '1';
      el.dataset.maseCountFrom = '0';
      el.dataset.maseCountTo = String(num);
      el.dataset.maseCountPrefix = match[1];
      el.dataset.maseCountSuffix = match[3];
      el.dataset.maseCountDecimals = (rawNum.indexOf('.') >= 0) ? String(rawNum.split('.')[1].length) : '0';
      targets.push(el);
    });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    targets.forEach(function (t) { io.observe(t); });
  }

  function countUp(el) {
    var to = parseFloat(el.dataset.maseCountTo);
    var from = parseFloat(el.dataset.maseCountFrom);
    var dec = parseInt(el.dataset.maseCountDecimals, 10);
    var prefix = el.dataset.maseCountPrefix || '';
    var suffix = el.dataset.maseCountSuffix || '';
    var duration = 900;
    var start;

    function step(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = from + (to - from) * eased;
      var formatted = dec > 0
        ? v.toFixed(dec)
        : Math.round(v).toLocaleString('de-CH');
      el.textContent = prefix + formatted + suffix;
      if (t < 1) { requestAnimationFrame(step); }
      else {
        el.classList.remove('mase-counter-pop');
        void el.offsetWidth;
        el.classList.add('mase-counter-pop');
      }
    }
    requestAnimationFrame(step);
  }

  // -----------------------------------------------------------
  // 5. VELOCITY-MARQUEE — beschleunigt bei schnellem Scroll
  // -----------------------------------------------------------
  function initVelocityMarquee() {
    var marquees = document.querySelectorAll('.mase-marquee');
    if (!marquees.length) return;

    // Fixed slow speed — no scroll-based acceleration
    var speed = 50;

    marquees.forEach(function (m) {
      m.style.setProperty('--mase-marquee-speed', speed + 's');
    });
  }

  // -----------------------------------------------------------
  // 6. KONFETTI — beim Klick auf .button-primary innerhalb hero/CTA-Sektionen
  // -----------------------------------------------------------
  function initConfetti() {
    if (prefersReduced) return;

    var host = document.createElement('div');
    host.className = 'mase-confetti-host';
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);

    // Buttons die Konfetti auslösen sollen (nicht ALLE primary, nur Haupt-CTAs)
    var triggers = document.querySelectorAll(
      '.hero .button-primary, .sticky-cta, .pricing-teaser .button-primary, ' +
      '.hero-benefit-cta, [data-mase-confetti]'
    );
    triggers.forEach(function (t) {
      t.addEventListener('click', function (e) {
        var r = t.getBoundingClientRect();
        burst(host, r.left + r.width / 2, r.top + r.height / 2);
      });
    });
  }

  function burst(host, x, y) {
    var colors = ['c-teal', 'c-blue', 'c-mint', 'c-white'];
    var N = 36;
    for (var i = 0; i < N; i++) {
      var piece = document.createElement('span');
      piece.className = 'mase-confetti ' + colors[i % colors.length];
      var angle = (Math.PI * 2) * (i / N) + Math.random() * 0.4;
      var velocity = 240 + Math.random() * 280;
      var vx = Math.cos(angle) * velocity;
      var vy = Math.sin(angle) * velocity - 180; // nach oben gewichtet
      var rotate = (Math.random() - 0.5) * 720;
      var dur = 900 + Math.random() * 700;
      piece.style.left = x + 'px';
      piece.style.top = y + 'px';
      piece.style.transform = 'translate(-50%,-50%) rotate(' + (Math.random() * 360) + 'deg)';
      host.appendChild(piece);
      animatePiece(piece, vx, vy, rotate, dur);
    }
  }
  function animatePiece(el, vx, vy, rot, dur) {
    var start = performance.now();
    var gravity = 1100; // px/s^2

    function step(now) {
      var t = (now - start) / 1000;
      if (t * 1000 > dur) { el.remove(); return; }
      var x = vx * t;
      var y = vy * t + 0.5 * gravity * t * t;
      var alpha = 1 - (t * 1000) / dur;
      el.style.transform = 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px)) rotate(' + (rot * t) + 'deg)';
      el.style.opacity = alpha.toFixed(2);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // -----------------------------------------------------------
  // 7. AUTO-WAVE-DIVIDER — vor jeder farbig wechselnden Sektion
  // -----------------------------------------------------------
  function initWaveDividers() {
    // Optional: nur wenn data-mase-auto-waves auf <html> oder <body>
    if (!document.documentElement.hasAttribute('data-mase-auto-waves')) return;

    var sections = document.querySelectorAll('main > section');
    sections.forEach(function (sec, i) {
      if (i === 0) return; // erste Section ohne Welle
      var bg = window.getComputedStyle(sec.previousElementSibling || sec).backgroundColor;
      var wave = document.createElement('div');
      wave.setAttribute('data-mase-wave', '');
      wave.innerHTML = '<svg viewBox="0 0 1440 60" preserveAspectRatio="none">' +
        '<path d="M0 30 C 240 60 480 0 720 30 C 960 60 1200 0 1440 30 L 1440 60 L 0 60 Z" fill="' + bg + '"/>' +
      '</svg>';
      sec.parentNode.insertBefore(wave, sec);
    });
  }

  // -----------------------------------------------------------
  // HEADER SCROLL-SHRINK
  // -----------------------------------------------------------
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() {
      header.classList.toggle('site-header--scrolled', window.scrollY > 50);
    }
    window.addEventListener('scroll', rafThrottle(onScroll), { passive: true });
    onScroll();
  }

  // -----------------------------------------------------------
  // BOOT
  // -----------------------------------------------------------
  ready(function () {
    initHeaderScroll();    // always on — no reduced-motion gating needed
    if (!prefersReduced) {
      initParallax();
      initParticles();
      initProcessLine();
      initVelocityMarquee();
      initWaveDividers();
    }
    initCounters();        // läuft auch mit reduced motion (instant text)
    initConfetti();        // entscheidet selber
  });
})();
