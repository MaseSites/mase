/* =============================================================
   FLAIR JS — click-ripple für Primary-Buttons
   Hängt sich global an Klicks auf .btn-primary / .button-primary
   / .benefit-cta und injiziert ein .mase-ripple Element.
   ============================================================= */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function attachRipple(e) {
    if (prefersReduced) return;
    var btn = e.target.closest('.btn-primary, .button-primary, .benefit-cta, .pricing-summary-cta');
    if (!btn) return;

    // Make sure button is overflow-hidden + relative — already set in CSS but be safe
    var cs = window.getComputedStyle(btn);
    if (cs.position === 'static') btn.style.position = 'relative';
    btn.style.overflow = btn.style.overflow || 'hidden';

    var r = btn.getBoundingClientRect();
    var x = e.clientX - r.left;
    var y = e.clientY - r.top;
    var maxDim = Math.max(r.width, r.height);

    var ripple = document.createElement('span');
    ripple.className = 'mase-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = maxDim + 'px';
    ripple.style.height = maxDim + 'px';

    btn.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 700);
  }

  function boot() {
    document.addEventListener('click', attachRipple, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
