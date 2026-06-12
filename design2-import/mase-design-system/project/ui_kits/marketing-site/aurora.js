/* =============================================================
   AURORA — interaktive Effekte (Cursor-Glow, Magnetic-Buttons,
   Tilt-Mouse-Folger) für das futuristische Theme.
   Aktiv wenn <html data-theme="aurora">.
   ============================================================= */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarse = window.matchMedia &&
    window.matchMedia('(pointer: coarse)').matches;

  // ----- Cursor-Glow-Follower -----
  function initCursor() {
    if (isCoarse || prefersReduced) return;
    if (document.querySelector('.aurora-cursor')) return;
    var glow = document.createElement('div');
    glow.className = 'aurora-cursor';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
    var x = targetX, y = targetY;

    window.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
    });

    (function loop() {
      x += (targetX - x) * 0.15;
      y += (targetY - y) * 0.15;
      glow.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)';
      requestAnimationFrame(loop);
    })();
  }

  // ----- Magnetic-Buttons -----
  function initMagnetic() {
    if (isCoarse || prefersReduced) return;
    function attach() {
      var btns = document.querySelectorAll('.btn-primary, .benefit-cta, .sticky-cta');
      btns.forEach(function (btn) {
        if (btn.dataset.magnetic) return;
        btn.dataset.magnetic = '1';
        var strength = btn.classList.contains('sticky-cta') ? 0.3 : 0.18;
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * strength;
          var dy = (e.clientY - (r.top + r.height / 2)) * strength;
          btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
          btn.style.transform = '';
        });
      });
    }
    attach();
    var observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ----- Page-Transition: pulse .page-transition class on main on route change -----
  function initPageTransitions() {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'childList' && m.target.tagName === 'MAIN') {
          var first = m.target.firstElementChild;
          if (!first) return;
          first.classList.remove('page-transition');
          void first.offsetWidth;
          first.classList.add('page-transition');
        }
      });
    });
    var main = document.querySelector('main');
    if (main) observer.observe(main, { childList: true });
    // Beim ersten Boot auch animieren
    setTimeout(function () {
      if (main && main.firstElementChild) main.firstElementChild.classList.add('page-transition');
    }, 100);
  }

  // ----- Boot — nur wenn aurora theme aktiv -----
  function maybeBoot() {
    if (document.documentElement.dataset.theme !== 'aurora') return;
    initCursor();
    initMagnetic();
    initPageTransitions();
  }

  function tryBoot() {
    if (!document.body) return setTimeout(tryBoot, 60);
    maybeBoot();
    // Auch reagieren wenn das Theme später eingeschaltet wird
    var attr = new MutationObserver(maybeBoot);
    attr.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryBoot);
  } else {
    tryBoot();
  }
})();
