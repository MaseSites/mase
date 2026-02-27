﻿// ============================================
// NAVIGATION TOGGLE
// ============================================
(function() {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  if (!navToggle || !siteNav) return;

  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!siteNav.contains(e.target) && !navToggle.contains(e.target)) {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// ============================================
// YEAR UPDATE (FOOTER)
// ============================================
document.querySelectorAll('#year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================
(function() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          o.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    elements.forEach(el => obs.observe(el));
  } else {
    elements.forEach(el => el.classList.add('is-visible'));
  }
})();

// ============================================
// COOKIE BANNER
// ============================================
(function() {
  const banner = document.getElementById('cookie-banner');
  const accept = document.getElementById('cookie-accept');
  const reject = document.getElementById('cookie-reject');
  if (!banner) return;

  function getCookie(name) {
    const v = `; ${document.cookie}`;
    const p = v.split(`; ${name}=`);
    if (p.length === 2) return p.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  if (!getCookie('cookie-consent')) {
    setTimeout(() => banner.classList.add('show'), 1200);
  }

  if (accept) {
    accept.addEventListener('click', () => {
      setCookie('cookie-consent', 'accepted', 365);
      banner.classList.remove('show');
    });
  }
  if (reject) {
    reject.addEventListener('click', () => {
      setCookie('cookie-consent', 'rejected', 365);
      banner.classList.remove('show');
    });
  }
})();

// ============================================
// BACK TO TOP
// ============================================
(function() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ============================================
// PRICING CALCULATOR (preise.html)
// ============================================
(function () {
  var packageCards  = document.querySelectorAll('.pricing-option-card[data-type="revision"], .pricing-option-card[data-type="new"]');
  var hostingCards  = document.querySelectorAll('.pricing-option-card[data-type="domain"], .pricing-option-card[data-type="hosting"], .pricing-option-card[data-type="bundle"]');
  var aiCheckbox    = document.getElementById('ai-addon');
  var totalEl       = document.getElementById('total-price');
  var breakdownEl   = document.getElementById('pricing-breakdown');
  var ctaBtn        = document.getElementById('pricing-cta');
  var summaryEl     = document.getElementById('pricing-summary');

  if (!totalEl) return; // not on pricing page

  var selectedPackage = null;
  var selectedHosting = null;
  var aiSelected      = false;

  // Package names for display
  var packageNames = {
    'revision-starter': 'Überarbeitung Starter',
    'revision-plus':    'Überarbeitung Plus',
    'revision-pro':     'Überarbeitung Pro',
    'new-starter':      'Website Starter',
    'new-business':     'Website Business',
    'new-premium':      'Website Premium',
    'domain-only':      'Domain',
    'hosting-monthly':  'Hosting (Monat)',
    'bundle':           'Domain & Hosting Bundle'
  };

  // Monthly add-ons (hosting = monthly)
  var monthlyItems = {
    'hosting-monthly': true
  };

  function formatCHF(n) {
    return 'CHF ' + n.toLocaleString('de-CH');
  }

  function recalc() {
    var oneTime  = 0;
    var monthly  = 0;
    var lines    = [];

    if (selectedPackage) {
      var pPrice = parseInt(selectedPackage.getAttribute('data-price'), 10);
      var pVal   = selectedPackage.querySelector('input[type="radio"]');
      var pName  = pVal ? (packageNames[pVal.value] || 'Paket') : 'Paket';
      oneTime += pPrice;
      lines.push('<span>' + pName + '</span><span>' + formatCHF(pPrice) + '</span>');
    }

    if (selectedHosting) {
      var hPrice = parseInt(selectedHosting.getAttribute('data-price'), 10);
      var hVal   = selectedHosting.querySelector('input[type="radio"]');
      var hType  = selectedHosting.getAttribute('data-type');
      var hName  = hVal ? (packageNames[hVal.value] || 'Hosting') : 'Hosting';
      if (hType === 'hosting') {
        monthly += hPrice;
        lines.push('<span>' + hName + '</span><span>' + formatCHF(hPrice) + ' /Mt.</span>');
      } else {
        oneTime += hPrice;
        lines.push('<span>' + hName + '</span><span>' + formatCHF(hPrice) + ' /Jahr</span>');
      }
    }

    if (aiSelected) {
      oneTime += 200;
      monthly += 40;
      lines.push('<span>KI-Assistent</span><span>' + formatCHF(200) + ' einmalig + ' + formatCHF(40) + ' /Mt.</span>');
    }

    // Render breakdown
    if (lines.length === 0) {
      breakdownEl.innerHTML = '<p class="pricing-summary-hint">Wähle ein Paket um den Preis zu sehen</p>';
    } else {
      var html = '<div class="pricing-breakdown-lines">';
      lines.forEach(function (l) { html += '<div class="pricing-breakdown-line">' + l + '</div>'; });
      html += '</div>';
      if (monthly > 0) {
        html += '<p class="pricing-monthly-note">+ ' + formatCHF(monthly) + ' / Monat (laufend)</p>';
      }
      breakdownEl.innerHTML = html;
    }

    // Total
    totalEl.textContent = formatCHF(oneTime);
    if (monthly > 0) {
      totalEl.textContent += ' + ' + formatCHF(monthly) + ' /Mt.';
    }

    // Enable CTA only if a package is selected
    var hasSelection = selectedPackage !== null;
    if (ctaBtn) {
      ctaBtn.disabled = !hasSelection;
    }

    // Animate summary
    if (summaryEl && hasSelection) {
      summaryEl.classList.add('pricing-summary--active');
    }
  }

  // Package cards (radio)
  packageCards.forEach(function (card) {
    card.addEventListener('click', function () {
      packageCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      selectedPackage = card;
      recalc();
    });
    // Also handle radio change inside card
    var radio = card.querySelector('input[type="radio"]');
    if (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          packageCards.forEach(function (c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          selectedPackage = card;
          recalc();
        }
      });
    }
  });

  // Hosting cards (radio)
  hostingCards.forEach(function (card) {
    card.addEventListener('click', function () {
      hostingCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      selectedHosting = card;
      recalc();
    });
    var radio = card.querySelector('input[type="radio"]');
    if (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          hostingCards.forEach(function (c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          selectedHosting = card;
          recalc();
        }
      });
    }
  });

  // AI checkbox – entire label is clickable
  if (aiCheckbox) {
    var aiLabel = document.getElementById('ai-addon-label');
    if (aiLabel) {
      aiLabel.addEventListener('click', function (e) {
        // Don't double-fire if clicking the checkbox itself
        if (e.target !== aiCheckbox) {
          aiCheckbox.checked = !aiCheckbox.checked;
        }
        aiSelected = aiCheckbox.checked;
        aiLabel.classList.toggle('checked', aiSelected);
        recalc();
      });
    }
    aiCheckbox.addEventListener('change', function () {
      aiSelected = aiCheckbox.checked;
      if (aiLabel) aiLabel.classList.toggle('checked', aiSelected);
      recalc();
    });
  }

  // CTA button – link to contact page
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      window.location.href = 'kontakt.html';
    });
  }

  recalc();
})();

// ============================================
// INTERACTIVE PREVIEW (Startseite)
// ============================================
(function() {
  const toggles = document.querySelectorAll('.preview-toggle');
  const contents = document.querySelectorAll('.preview-content');
  if (!toggles.length) return;

  toggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const mode = this.getAttribute('data-mode');
      toggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      contents.forEach(c => c.classList.add('hidden'));
      const target = document.querySelector(`[data-content="${mode}"]`);
      if (target) {
        target.classList.remove('hidden');
      }
    });
  });
})();

// ============================================
// LIVE PREVIEW SLIDER (LP Slider)
// ============================================
(function () {
  var slider   = document.getElementById('lp-slider');
  var slides   = slider ? Array.from(slider.querySelectorAll('.lp-slide')) : [];
  var dots     = Array.from(document.querySelectorAll('.lp-dot-btn'));
  var thumbs   = Array.from(document.querySelectorAll('[data-lp-thumb]'));
  var prevBtn  = document.getElementById('lp-prev');
  var nextBtn  = document.getElementById('lp-next');

  if (!slider || slides.length === 0) return;

  var current  = 0;
  var total    = slides.length;
  var timer    = null;
  var INTERVAL = 5000;

  /* Go to a specific slide */
  function goTo(index) {
    if (index < 0)      index = total - 1;
    if (index >= total) index = 0;

    // Show/hide slides
    slides.forEach(function (s, i) {
      s.classList.toggle('lp-slide--hidden', i !== index);
    });

    // Update dots
    dots.forEach(function (d, i) {
      d.classList.toggle('lp-dot-btn--active', i === index);
      d.setAttribute('aria-selected', String(i === index));
    });

    // Update thumbnails
    thumbs.forEach(function (t, i) {
      t.classList.toggle('lp-thumb--active', i === index);
    });

    current = index;
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }

  // Arrow buttons
  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); startTimer(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); startTimer(); });

  // Dot buttons
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      goTo(parseInt(this.getAttribute('data-lp-index'), 10));
      startTimer();
    });
  });

  // Thumbnail buttons
  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      goTo(parseInt(this.getAttribute('data-lp-thumb'), 10));
      startTimer();
    });
    // Keyboard support
    thumb.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goTo(parseInt(this.getAttribute('data-lp-thumb'), 10));
        startTimer();
      }
    });
  });

  // Pause on hover
  slider.addEventListener('mouseenter', function () { clearInterval(timer); });
  slider.addEventListener('mouseleave', function () { startTimer(); });

  // Touch / swipe
  var touchStartX = 0;
  slider.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
    clearInterval(timer);
  }, { passive: true });
  slider.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); }
    startTimer();
  }, { passive: true });

  // Init
  goTo(0);
  startTimer();
})();
