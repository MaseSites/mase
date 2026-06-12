/* =============================================================
   Scroll-Pack (Clean) — minimal JS für dezente Effekte:
   • Sanfter Parallax auf den Hero-Blobs
   • Counter-Rollups (nur explizite Opt-Ins: data-mase-counter)
   • Velocity-Marquee (sanft)
   Process-Line, Partikel, Konfetti, Cursor-Glow, Magnetic
   entfernt für ein professionelles, ruhiges Erscheinungsbild.
   ============================================================= */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  // -----------------------------------------------------------
  // 1. SANFTER PARALLAX auf Hero-Blobs
  // -----------------------------------------------------------
  function initParallax() {
    if (prefersReduced) return;
    function onScroll() {
      var y = window.scrollY;
      var blobs = document.querySelectorAll('.hero-mesh .blob');
      blobs.forEach(function (b, i) {
        var speed = [0.08, -0.06, 0.12][i] || 0.08;
        b.style.transform = 'translate3d(0,' + (y * speed) + 'px,0)';
      });
    }
    var throttled = rafThrottle(onScroll);
    window.addEventListener('scroll', throttled, { passive: true });
    onScroll();
  }

  // -----------------------------------------------------------
  // 2. COUNTER-ROLLUPS — NUR explizite Opt-Ins (data-mase-counter)
  //    React-managed Elemente werden NICHT angefasst.
  // -----------------------------------------------------------
  function initCounters() {
    if (!('IntersectionObserver' in window)) return;
    var els = document.querySelectorAll('[data-mase-counter]');
    els.forEach(function (el) {
      if (el.dataset.maseCountered || el.children.length > 0) return;
      var match = String(el.textContent).match(/^(\D*)(\d[\d'.,\u00a0]*)(\D*)$/);
      if (!match) return;
      var raw = match[2].replace(/['\u00a0,]/g, '');
      var num = parseFloat(raw);
      if (isNaN(num) || num < 50) return;
      el.dataset.maseCountered = '1';
      el.dataset.maseCountTo = String(num);
      el.dataset.maseCountPrefix = match[1];
      el.dataset.maseCountSuffix = match[3];
      el.dataset.maseCountDecimals = (raw.indexOf('.') >= 0)
        ? String(raw.split('.')[1].length) : '0';
      el.textContent = match[1] + '0' + match[3];
      io.observe(el);
    });
  }
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      countUp(e.target);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.5 }) : null;

  function countUp(el) {
    var to = parseFloat(el.dataset.maseCountTo);
    var dec = parseInt(el.dataset.maseCountDecimals, 10);
    var prefix = el.dataset.maseCountPrefix || '';
    var suffix = el.dataset.maseCountSuffix || '';
    var duration = 900;
    var start;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = to * eased;
      var formatted = dec > 0
        ? v.toFixed(dec)
        : Math.round(v).toLocaleString(document.documentElement.lang || 'de-CH');
      el.textContent = prefix + formatted + suffix;
      if (t < 1) requestAnimationFrame(step);
      else {
        el.classList.remove('mase-counter-pop');
        void el.offsetWidth;
        el.classList.add('mase-counter-pop');
      }
    }
    requestAnimationFrame(step);
  }

  // -----------------------------------------------------------
  // 3. VELOCITY-MARQUEE wurde entfernt — Marquee läuft mit konstanter
  //    Geschwindigkeit (siehe scroll-pack.css). User wollte: niemals stoppen,
  //    keine Reaktion auf Scrollen, immer langsam nach links.
  // -----------------------------------------------------------
  function initVelocityMarquee() {
    /* no-op */
  }

  function boot() {
    initParallax();
    initCounters();
    initVelocityMarquee();
  }

  function tryBoot() {
    if (!document.querySelector('.hero')) {
      return setTimeout(tryBoot, 100);
    }
    setTimeout(function () {
      boot();
      var observer = new MutationObserver(rafThrottle(function () {
        initCounters();
      }));
      observer.observe(document.body, { childList: true, subtree: true });
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryBoot);
  } else {
    tryBoot();
  }
})();
