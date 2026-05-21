/* =============================================================
   MASE — Animations (Vanilla JS, drop-in)
   Bindet sich an eure existierenden Klassen: #hero-title, .hero,
   .hero-badges, .trust-grid, .process-grid, .sticky-cta, .chat-*,
   #dark-toggle.
   ============================================================= */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------------------------------------
  // 1. Scroll-Progress-Bar
  // -----------------------------------------------------------
  function initScrollProgress() {
    var wrap = document.createElement('div');
    wrap.className = 'mase-scroll-progress';
    wrap.setAttribute('aria-hidden', 'true');
    var bar = document.createElement('div');
    bar.className = 'mase-scroll-progress__bar';
    wrap.appendChild(bar);
    document.body.appendChild(wrap);

    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = p + '%';
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // -----------------------------------------------------------
  // 2. Hero — Gradient-Mesh + Word-Reveal + Tilt + Badges
  // -----------------------------------------------------------
  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    // Mesh-Hintergrund injizieren
    if (!hero.querySelector('.mase-hero-mesh')) {
      var mesh = document.createElement('div');
      mesh.className = 'mase-hero-mesh';
      mesh.setAttribute('aria-hidden', 'true');
      mesh.innerHTML = '<span class="mase-blob b1"></span><span class="mase-blob b2"></span><span class="mase-blob b3"></span>';
      hero.insertBefore(mesh, hero.firstChild);
    }

    // Word-Reveal auf #hero-title
    var h1 = document.getElementById('hero-title');
    if (h1 && !h1.dataset.maseWordRevealed) {
      var text = h1.textContent.trim();
      h1.dataset.maseWordRevealed = '1';
      h1.innerHTML = '';
      var span = document.createElement('span');
      span.className = 'mase-word-reveal';
      var words = text.split(/\s+/);
      words.forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'mase-word';
        s.textContent = w;
        s.style.animationDelay = (120 + i * 90) + 'ms';
        span.appendChild(s);
      });
      h1.appendChild(span);
    }

    // Hero-Badges sichtbar markieren (für die Stagger-Animation aus CSS)
    var badges = hero.querySelector('.hero-badges');
    if (badges) badges.classList.add('is-visible');

    // 3D-Tilt für die Hero-Benefit-Card
    var card = hero.querySelector('.hero-benefit-card');
    if (card) {
      var wrap = document.createElement('div');
      wrap.className = 'mase-tilt-wrap';
      card.parentNode.insertBefore(wrap, card);
      wrap.appendChild(card);
      card.classList.add('mase-tilt');
      card.style.position = card.style.position || 'relative';
      var shine = document.createElement('span');
      shine.className = 'mase-tilt-shine';
      card.appendChild(shine);

      var MAX = 9;
      wrap.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * MAX * 2;
        var ry = (px - 0.5) * MAX * 2;
        card.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      wrap.addEventListener('mouseleave', function () {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    }
  }

  // -----------------------------------------------------------
  // 3. Stagger-Reveal für trust-grid + process-grid
  // -----------------------------------------------------------
  function initStagger() {
    var grids = document.querySelectorAll('.trust-grid, .process-grid');
    if (!grids.length) return;

    grids.forEach(function (g) { g.classList.add('mase-stagger'); });

    if (!('IntersectionObserver' in window)) {
      grids.forEach(function (g) { g.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
    grids.forEach(function (g) { io.observe(g); });
  }

  // -----------------------------------------------------------
  // 4. Section-Title-Underlines
  // -----------------------------------------------------------
  function initUnderlines() {
    var titles = document.querySelectorAll('section h2');
    titles.forEach(function (h) { h.classList.add('mase-underline'); });

    if (!('IntersectionObserver' in window)) {
      titles.forEach(function (h) { h.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    titles.forEach(function (h) { io.observe(h); });
  }

  // -----------------------------------------------------------
  // 5. Sticky-CTA — Entrance + Pulse-Ring
  // -----------------------------------------------------------
  function initStickyCta() {
    var cta = document.getElementById('sticky-cta') || document.querySelector('.sticky-cta');
    if (!cta) return;

    function onScroll() {
      cta.classList.toggle('is-visible', window.scrollY > 320);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // -----------------------------------------------------------
  // 6. Smoke-Transition — Light <-> Dark Mode
  // -----------------------------------------------------------
  function initSmokeDarkToggle() {
    var btn = document.getElementById('dark-toggle');
    if (!btn) return;

    // Bestehende #dark-wave-Overlay verstecken (via CSS schon getan, hier nur safe)
    var oldWave = document.getElementById('dark-wave');
    if (oldWave) oldWave.style.display = 'none';

    // Canvas einmal anlegen
    var canvas = document.createElement('canvas');
    canvas.className = 'mase-smoke-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    // Click in Capture-Phase abfangen — wir machen Theme-Flip selbst
    btn.addEventListener('click', function (e) {
      if (prefersReduced) return; // dann normaler Toggle (theme.js)
      e.preventDefault();
      e.stopImmediatePropagation();
      var goingDark = !document.documentElement.classList.contains('dark');
      runSmoke(canvas, goingDark, function () {
        // Theme-Flip auf Smoke-Peak
        document.documentElement.classList.add('mase-theme-switching');
        if (goingDark) {
          document.documentElement.classList.add('dark');
          try { localStorage.setItem('theme', 'dark'); } catch (err) {}
        } else {
          document.documentElement.classList.remove('dark');
          try { localStorage.setItem('theme', 'light'); } catch (err) {}
        }
        // Icon updaten falls vorhanden
        var icon = document.getElementById('dark-toggle-icon');
        if (icon) icon.textContent = goingDark ? '☀️' : '🌙';
        // ARIA-pressed updaten
        btn.setAttribute('aria-pressed', goingDark ? 'true' : 'false');
        setTimeout(function () {
          document.documentElement.classList.remove('mase-theme-switching');
        }, 600);
      });
    }, true);
  }

  function runSmoke(canvas, toDark, onMidpoint) {
    canvas.classList.add('is-active');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth + 80;
    var h = window.innerHeight + 80;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var palette = toDark
      ? [[13,17,23],[10,14,39],[15,118,110],[11,95,88]]
      : [[255,255,255],[246,249,255],[102,182,255],[167,243,208]];

    var puffs = [], N = 60;
    for (var i = 0; i < N; i++) {
      var edge = Math.random(), x, y, vx, vy;
      if (edge < 0.55) {
        x = Math.random() * w;
        y = h + 60 + Math.random() * 140;
        vx = (Math.random() - 0.5) * 0.4;
        vy = -(0.9 + Math.random() * 1.3);
      } else if (edge < 0.78) {
        x = -80 - Math.random() * 100;
        y = h * 0.2 + Math.random() * h * 0.8;
        vx = 1 + Math.random() * 1.2;
        vy = -(0.4 + Math.random() * 0.8);
      } else {
        x = w + 80 + Math.random() * 100;
        y = h * 0.2 + Math.random() * h * 0.8;
        vx = -(1 + Math.random() * 1.2);
        vy = -(0.4 + Math.random() * 0.8);
      }
      puffs.push({
        x0: x, y0: y, vx: vx, vy: vy,
        r0: 90 + Math.random() * 160,
        delay: Math.random() * 380,
        seed: Math.random() * 1000,
        color: palette[Math.floor(Math.random() * palette.length)],
        peakAlpha: 0.55 + Math.random() * 0.35
      });
    }

    var start = performance.now();
    var duration = 1600;
    var midFired = false;

    function draw(now) {
      var elapsed = now - start;
      var progress = elapsed / duration;

      if (!midFired && progress >= 0.5) {
        midFired = true;
        try { onMidpoint && onMidpoint(); } catch (err) {}
      }

      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < puffs.length; i++) {
        var p = puffs[i];
        var tMs = elapsed - p.delay;
        if (tMs < 0) continue;
        var t = tMs / 1200;
        if (t > 1.3) continue;

        var bell = Math.exp(-Math.pow((t - 0.48) / 0.42, 2));
        var a = bell * p.peakAlpha;
        if (a < 0.01) continue;

        var drift = tMs * 0.06;
        var sway = Math.sin((elapsed + p.seed) * 0.0018) * 22;
        var x = p.x0 + p.vx * drift + sway;
        var y = p.y0 + p.vy * drift;
        var r = p.r0 * (0.7 + Math.min(1, t * 1.3) * 0.7);

        var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        var c = p.color;
        grad.addColorStop(0,    'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')');
        grad.addColorStop(0.55, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a * 0.4) + ')');
        grad.addColorStop(1,    'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress < 1.0) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
        canvas.classList.remove('is-active');
      }
    }
    requestAnimationFrame(draw);
  }

  // -----------------------------------------------------------
  // 7. Marquee — optional, nur wenn ein Anker-Element vorhanden ist
  //    (im Markup: <div data-mase-marquee></div> reicht)
  // -----------------------------------------------------------
  function initMarquee() {
    var anchors = document.querySelectorAll('[data-mase-marquee]');
    if (!anchors.length) return;

    var items = [
      'Webdesign Schweiz', 'SEO-optimiert', 'Mobile-first',
      'ab CHF 750', 'KI-Assistent', 'Sauberer Code',
      'Schnelle Ladezeit', 'DSGVO-konform', '24/7 verfügbar'
    ];

    // Build one copy of all items
    var copy = items.map(function (it) {
      return '<span class="mase-marquee__item">' + it + '</span>';
    }).join('');

    // Exactly two identical copies — animation translates -50% for seamless loop
    anchors.forEach(function (el) {
      el.classList.add('mase-marquee');
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('role', 'presentation');
      el.innerHTML =
        '<div class="mase-marquee__track" aria-hidden="true">' +
          copy + copy +
        '</div>';
    });
  }

  // -----------------------------------------------------------
  // Boot
  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // Hero — Animated Flowing Path Background
  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // Hero — Elegant floating pill shapes (own implementation)
  // Visually identical to the HeroGeometric / ElegantShape pattern:
  //   5 semi-transparent colour-gradient pills enter from above and
  //   float gently on a near-black dark background.
  // -----------------------------------------------------------
  function initElegantShapes() {
    var hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.mase-flow-bg')) return;

    var bg = document.createElement('div');
    bg.className = 'mase-flow-bg';
    bg.setAttribute('aria-hidden', 'true');

    // Very subtle ambient colour cloud behind the shapes
    var ambient = document.createElement('div');
    ambient.className = 'mase-shape-ambient';
    bg.appendChild(ambient);

    // 5 shapes — sizes, positions, rotations and colours match the reference 1:1.
    // Positions are mid-point averages of mobile/desktop breakpoints in the original.
    var shapes = [
      { w: 600, h: 140, rot:  12, rgb: '99,102,241',  delay: 0.3, css: 'left:-8%;top:18%'  },
      { w: 500, h: 120, rot: -15, rgb: '244,63,94',   delay: 0.5, css: 'right:-3%;top:72%' },
      { w: 300, h: 80,  rot:  -8, rgb: '139,92,246',  delay: 0.4, css: 'left:8%;bottom:8%' },
      { w: 200, h: 60,  rot:  20, rgb: '245,158,11',  delay: 0.6, css: 'right:18%;top:13%' },
      { w: 150, h: 40,  rot: -25, rgb: '6,182,212',   delay: 0.7, css: 'left:23%;top:8%'   }
    ];

    shapes.forEach(function (s) {
      // Outer wrapper: absolute position + entrance animation
      // --rot custom property drives rotation in the CSS keyframe
      var outer = document.createElement('div');
      outer.className = 'mase-shape-outer';
      outer.style.cssText = s.css + ';--rot:' + s.rot + 'deg;animation-delay:' + s.delay + 's';

      // Inner wrapper: sets physical size + perpetual float animation
      // Float starts after the 2.4s entry finishes + its own delay
      var inner = document.createElement('div');
      inner.className = 'mase-shape-inner';
      inner.style.cssText = 'width:' + s.w + 'px;height:' + s.h + 'px' +
        ';animation-delay:' + (s.delay + 2.5) + 's';

      // Shape body: gradient pill with glass border and inner highlight
      var body = document.createElement('div');
      body.className = 'mase-shape-body';
      body.style.background = 'linear-gradient(to right,rgba(' + s.rgb + ',0.15),transparent)';

      inner.appendChild(body);
      outer.appendChild(inner);
      bg.appendChild(outer);
    });

    // Top-edge and bottom-edge dark fade overlays
    var fadeT = document.createElement('div'); fadeT.className = 'mase-fade-t';
    var fadeB = document.createElement('div'); fadeB.className = 'mase-fade-b';
    bg.appendChild(fadeT);
    bg.appendChild(fadeB);

    hero.insertBefore(bg, hero.firstChild);
    hero.classList.add('has-flow-bg');
  }

  function boot() {
    initScrollProgress();
    initHero();
    initElegantShapes();
    initStagger();
    initUnderlines();
    initStickyCta();
    initSmokeDarkToggle();
    initMarquee();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
