// ============================================
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
  const cta = document.getElementById('sticky-cta');
  if (!btn && !cta) return;

  function scrollToTopSafe() {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener('scroll', () => {
    const past = window.scrollY > 500;
    if (btn) btn.classList.toggle('visible', past);
    if (cta) cta.classList.toggle('visible', past);
  }, { passive: true });
  if (btn) btn.addEventListener('click', scrollToTopSafe);
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

  function getCurrentLang() {
    var lang = localStorage.getItem('lang');
    if (lang !== 'de' && lang !== 'en' && lang !== 'fr') return 'de';
    return lang;
  }

  var pricingText = {
    de: {
      packageFallback: 'Paket',
      hostingFallback: 'Hosting',
      monthlyShort: ' /Mt.',
      yearShort: ' /Jahr',
      aiLabel: 'KI-Assistent',
      oneTime: ' einmalig',
      summaryHint: 'Wähle ein Paket um den Preis zu sehen',
      monthlyNote: ' / Monat (laufend)'
    },
    en: {
      packageFallback: 'Package',
      hostingFallback: 'Hosting',
      monthlyShort: ' /mo.',
      yearShort: ' /year',
      aiLabel: 'AI Assistant',
      oneTime: ' one-time',
      summaryHint: 'Choose a package to see the price',
      monthlyNote: ' / month (recurring)'
    },
    fr: {
      packageFallback: 'Forfait',
      hostingFallback: 'Hébergement',
      monthlyShort: ' /mois',
      yearShort: ' /an',
      aiLabel: 'Assistant IA',
      oneTime: ' unique',
      summaryHint: 'Choisissez un forfait pour voir le prix',
      monthlyNote: ' / mois (récurrent)'
    }
  };

  // Package names for display
  var packageNames = {
    de: {
      'revision-starter': 'Überarbeitung Starter',
      'revision-plus':    'Überarbeitung Plus',
      'revision-pro':     'Überarbeitung Pro',
      'new-starter':      'Website Starter',
      'new-business':     'Website Business',
      'new-premium':      'Website Premium',
      'domain-only':      'Domain',
      'hosting-monthly':  'Hosting (Monat)',
      'bundle':           'Domain & Hosting Bundle'
    },
    en: {
      'revision-starter': 'Revision Starter',
      'revision-plus':    'Revision Plus',
      'revision-pro':     'Revision Pro',
      'new-starter':      'Website Starter',
      'new-business':     'Website Business',
      'new-premium':      'Website Premium',
      'domain-only':      'Domain',
      'hosting-monthly':  'Hosting (Monthly)',
      'bundle':           'Domain & Hosting Bundle'
    },
    fr: {
      'revision-starter': 'Refonte Starter',
      'revision-plus':    'Refonte Plus',
      'revision-pro':     'Refonte Pro',
      'new-starter':      'Site Starter',
      'new-business':     'Site Business',
      'new-premium':      'Site Premium',
      'domain-only':      'Domaine',
      'hosting-monthly':  'Hébergement (Mensuel)',
      'bundle':           'Pack Domaine & Hébergement'
    }
  };

  // Monthly add-ons (hosting = monthly)
  var monthlyItems = {
    'hosting-monthly': true
  };

  function buildPricingSelection() {
    var lang = getCurrentLang();
    var labels = pricingText[lang] || pricingText.de;
    var names = packageNames[lang] || packageNames.de;
    var oneTime = 0;
    var monthly = 0;
    var lines = [];
    var selectedPackageName = '';

    if (selectedPackage) {
      var pPrice = parseInt(selectedPackage.getAttribute('data-price'), 10);
      var pVal = selectedPackage.querySelector('input[type="radio"]');
      selectedPackageName = pVal ? (names[pVal.value] || labels.packageFallback) : labels.packageFallback;
      oneTime += pPrice;
      lines.push(selectedPackageName + ': ' + formatCHF(pPrice));
    }

    if (selectedHosting) {
      var hPrice = parseInt(selectedHosting.getAttribute('data-price'), 10);
      var hVal = selectedHosting.querySelector('input[type="radio"]');
      var hType = selectedHosting.getAttribute('data-type');
      var hName = hVal ? (names[hVal.value] || labels.hostingFallback) : labels.hostingFallback;

      if (hType === 'hosting') {
        monthly += hPrice;
        lines.push(hName + ': ' + formatCHFFixed(hPrice) + labels.monthlyShort);
      } else {
        oneTime += hPrice;
        lines.push(hName + ': ' + formatCHF(hPrice) + labels.yearShort);
      }
    }

    if (aiSelected) {
      oneTime += 200;
      monthly += 40;
      lines.push(labels.aiLabel + ': ' + formatCHFFixed(200) + labels.oneTime + ' + ' + formatCHFFixed(40) + labels.monthlyShort);
    }

    var total = formatCHF(oneTime) + (monthly > 0 ? ' + ' + formatCHFFixed(monthly) + labels.monthlyShort : '');

    return {
      packageName: selectedPackageName,
      lines: lines,
      total: total,
      timestamp: new Date().toISOString()
    };
  }

  function formatCHF(n) {
    return 'etwa CHF ' + n.toLocaleString('de-CH');
  }

  function formatCHFFixed(n) {
    return 'CHF ' + n.toLocaleString('de-CH');
  }

  function recalc() {
    var lang = getCurrentLang();
    var labels = pricingText[lang] || pricingText.de;
    var names = packageNames[lang] || packageNames.de;
    var oneTime  = 0;
    var monthly  = 0;
    var lines    = [];

    if (selectedPackage) {
      var pPrice = parseInt(selectedPackage.getAttribute('data-price'), 10);
      var pVal   = selectedPackage.querySelector('input[type="radio"]');
      var pName  = pVal ? (names[pVal.value] || labels.packageFallback) : labels.packageFallback;
      oneTime += pPrice;
      lines.push('<span>' + pName + '</span><span>' + formatCHF(pPrice) + '</span>');
    }

    if (selectedHosting) {
      var hPrice = parseInt(selectedHosting.getAttribute('data-price'), 10);
      var hVal   = selectedHosting.querySelector('input[type="radio"]');
      var hType  = selectedHosting.getAttribute('data-type');
      var hName  = hVal ? (names[hVal.value] || labels.hostingFallback) : labels.hostingFallback;
      if (hType === 'hosting') {
        monthly += hPrice;
        lines.push('<span>' + hName + '</span><span>' + formatCHFFixed(hPrice) + labels.monthlyShort + '</span>');
      } else {
        oneTime += hPrice;
        lines.push('<span>' + hName + '</span><span>' + formatCHF(hPrice) + labels.yearShort + '</span>');
      }
    }

    if (aiSelected) {
      oneTime += 200;
      monthly += 40;
      lines.push('<span>' + labels.aiLabel + '</span><span>' + formatCHFFixed(200) + labels.oneTime + ' + ' + formatCHFFixed(40) + labels.monthlyShort + '</span>');
    }

    // Render breakdown
    if (lines.length === 0) {
      breakdownEl.innerHTML = '<p class="pricing-summary-hint">' + labels.summaryHint + '</p>';
    } else {
      var html = '<div class="pricing-breakdown-lines">';
      lines.forEach(function (l) { html += '<div class="pricing-breakdown-line">' + l + '</div>'; });
      html += '</div>';
      breakdownEl.innerHTML = html;
    }

    // Total
    totalEl.textContent = formatCHF(oneTime);
    if (monthly > 0) {
      totalEl.textContent += ' + ' + formatCHFFixed(monthly) + labels.monthlyShort;
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
    function syncAiSelection() {
      aiSelected = !!aiCheckbox.checked;
      if (aiLabel) aiLabel.classList.toggle('checked', aiSelected);
      recalc();
    }

    // Initialize state in case browser keeps checkbox value on back/forward cache.
    syncAiSelection();

    if (aiLabel) {
      aiLabel.addEventListener('click', function (e) {
        // Prevent native label toggle because we toggle manually.
        if (e.target !== aiCheckbox) {
          e.preventDefault();
          aiCheckbox.checked = !aiCheckbox.checked;
          syncAiSelection();
        }
      });
    }
    aiCheckbox.addEventListener('change', function () {
      syncAiSelection();
    });
  }

  // CTA button – link to contact page
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      var selection = buildPricingSelection();
      try {
        if (selection && selection.packageName) {
          localStorage.setItem('mase_pricing_selection', JSON.stringify(selection));
        } else {
          localStorage.removeItem('mase_pricing_selection');
        }
      } catch (_) {
        // no-op if storage is unavailable
      }
      window.location.href = 'kontakt.html?from=pricing';
    });
  }

  recalc();
})();

// ============================================
// LIVE PREVIEW SLIDER (LP Slider)
// ============================================
(function () {
  var slider = document.getElementById('lp-slider');
  var slides = slider ? Array.from(slider.querySelectorAll('.lp-slide')) : [];
  var dots = Array.from(document.querySelectorAll('.lp-dot-btn'));
  var thumbs = Array.from(document.querySelectorAll('[data-lp-thumb]'));
  var prevBtn = document.getElementById('lp-prev');
  var nextBtn = document.getElementById('lp-next');

  if (!slider || slides.length !== 4) return;

  var current = 0;
  var total = slides.length;
  var timer = null;
  var INTERVAL = 5000;

  function goTo(index) {
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;

    slides.forEach(function (s, i) {
      s.classList.toggle('lp-slide--hidden', i !== index);
      s.setAttribute('aria-hidden', String(i !== index));
    });

    dots.forEach(function (d, i) {
      d.classList.toggle('lp-dot-btn--active', i === index);
      d.setAttribute('aria-selected', String(i === index));
    });

    thumbs.forEach(function (t, i) {
      t.classList.toggle('lp-thumb--active', i === index);
      t.setAttribute('aria-current', i === index ? 'true' : 'false');
    });

    current = index;
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); startTimer(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); startTimer(); });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-lp-index'), 10);
      if (!Number.isNaN(idx)) {
        goTo(idx);
        startTimer();
      }
    });
  });

  thumbs.forEach(function (thumb) {
    function activateThumb() {
      var idx = parseInt(thumb.getAttribute('data-lp-thumb'), 10);
      if (!Number.isNaN(idx)) {
        goTo(idx);
        startTimer();
      }
    }
    thumb.addEventListener('click', activateThumb);
    thumb.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateThumb();
      }
    });
  });

  slider.addEventListener('mouseenter', stopTimer);
  slider.addEventListener('mouseleave', startTimer);

  var touchStartX = 0;
  slider.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
    stopTimer();
  }, { passive: true });
  slider.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    startTimer();
  }, { passive: true });

  goTo(0);
  startTimer();
})();

// Kontaktformular: robustes API-Handling ohne False-Error bei Erfolg
(function () {
  var form = document.getElementById('contact-form') || document.querySelector('form[data-contact-form], .contact-form');
  if (!form || form.dataset.apiBound === 'true') return;
  form.dataset.apiBound = 'true';

  var submitBtn = form.querySelector('button[type="submit"], .button[type="submit"]');
  var successBox = document.getElementById('form-success') || form.querySelector('.form-success');
  var errorBox = document.getElementById('form-error') || form.querySelector('.form-error');
  var errorText = document.getElementById('error-text');
  var messageField = form.querySelector('textarea[name="message"]');
  var projectTypeField = form.querySelector('select[name="projectType"]');
  var pricingHiddenField = document.getElementById('contact-pricing-selection');
  var isSubmitting = false;
  var submitBtnDefaultText = submitBtn ? submitBtn.textContent : '';

  function getCurrentLang() {
    var q = null;
    try { q = new URLSearchParams(window.location.search).get('lang'); } catch (_) {}
    if (q === 'de' || q === 'en') return q;
    var s = localStorage.getItem('lang');
    if (s === 'de' || s === 'en') return s;
    return 'de';
  }

  function getFormMessage(type) {
    var lang = getCurrentLang();
    var messages = {
      de: {
        required: 'Bitte fuelle alle Pflichtfelder aus.',
        invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
        messageTooShort: 'Bitte gib eine aussagekraeftige Nachricht mit mindestens 10 Zeichen ein.',
        rateLimited: 'Zu viele Anfragen. Bitte versuche es in einigen Minuten erneut.',
        sending: 'Wird gesendet...',
        success: 'Danke! Deine Anfrage wurde erfolgreich gesendet.',
        connection: 'Verbindungsfehler. Bitte schreibe direkt an info@masesites.ch'
      },
      en: {
        required: 'Please fill in all required fields.',
        invalidEmail: 'Please enter a valid email address.',
        messageTooShort: 'Please enter a meaningful message with at least 10 characters.',
        rateLimited: 'Too many requests. Please try again in a few minutes.',
        sending: 'Sending...',
        success: 'Thanks! Your request was sent successfully.',
        connection: 'Connection error. Please contact us directly at info@masesites.ch'
      },
      fr: {
        required: 'Veuillez remplir tous les champs obligatoires.',
        invalidEmail: 'Veuillez saisir une adresse email valide.',
        messageTooShort: 'Veuillez saisir un message pertinent avec au moins 10 caracteres.',
        rateLimited: 'Trop de requetes. Merci de reessayer dans quelques minutes.',
        sending: 'Envoi en cours...',
        success: 'Merci ! Votre demande a ete envoyee avec succes.',
        connection: 'Erreur de connexion. Merci d\'ecrire directement a info@masesites.ch'
      }
    };
    return (messages[lang] && messages[lang][type]) || messages.de[type];
  }

  function setMessage(el, text, type) {
    if (!el) return;
    if (type === 'error' && errorText) {
      errorText.textContent = text;
      el.classList.add('visible');
      return;
    }
    el.textContent = text;
    el.classList.add('visible');
  }

  function clearMessages() {
    if (successBox) successBox.classList.remove('visible');
    if (errorBox) errorBox.classList.remove('visible');
    if (errorText) errorText.textContent = getFormMessage('required');
  }

  function setSubmittingState(submitting) {
    if (!submitBtn) return;
    submitBtn.disabled = submitting;
    submitBtn.classList.toggle('loading', submitting);
    submitBtn.textContent = submitting ? getFormMessage('sending') : submitBtnDefaultText;
  }

  function readPricingSelection() {
    try {
      var raw = localStorage.getItem('mase_pricing_selection');
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.packageName !== 'string') return null;
      if (!parsed.packageName.trim()) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function buildPricingSummaryText(selection) {
    if (!selection || !selection.packageName) return '';
    return 'Ausgewaehltes Paket: ' + selection.packageName;
  }

  function prefillPricingSelection() {
    var selection = readPricingSelection();
    if (!selection) return;

    if (projectTypeField && selection.packageName && !projectTypeField.value) {
      projectTypeField.value = selection.packageName;
    }

    var summary = buildPricingSummaryText(selection);
    if (messageField && summary && !messageField.value) {
      messageField.value = summary + '\n\n';
    }
    if (pricingHiddenField && summary) {
      pricingHiddenField.value = summary;
    }
  }

  prefillPricingSelection();

  function normalizeText(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
  }

  function resolveContactEndpoint() {
    var action = form.getAttribute('action') || '/api/contact';
    if (/^https?:\/\//i.test(action)) return action;

    var isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    var currentPort = window.location.port || '';
    var normalizedAction = action.charAt(0) === '/' ? action : ('/' + action);

    // Local dev: always target backend on localhost:3000 for consistency.
    if (isLocalHost && currentPort && currentPort !== '3000') {
      return window.location.protocol + '//localhost:3000' + normalizedAction;
    }

    // Production/same-origin fallback.
    return normalizedAction;
  }

  function validatePayload(data) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.name || !data.email || !data.message || !data.privacy) {
      return getFormMessage('required');
    }
    if (!emailRegex.test(data.email)) {
      return getFormMessage('invalidEmail');
    }
    if (data.message.length < 10) {
      return getFormMessage('messageTooShort');
    }
    return '';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    clearMessages();
    setSubmittingState(true);

    try {
      var fd = new FormData(form);
      var pricingSelection = readPricingSelection();
      var pricingSummaryText = buildPricingSummaryText(pricingSelection);
      var data = {
        name: normalizeText(fd.get('name'), 120),
        email: normalizeText(fd.get('email'), 254).toLowerCase(),
        company: normalizeText(fd.get('company'), 120),
        projectType: normalizeText(fd.get('projectType'), 100),
        message: normalizeText(fd.get('message'), 4000),
        privacy: !!fd.get('privacy'),
        honeypot: normalizeText(fd.get('honeypot'), 200),
        pricingSelection: normalizeText(pricingSummaryText, 2000)
      };

      if (data.pricingSelection && data.message.indexOf(data.pricingSelection) === -1) {
        data.message = (data.message ? (data.message + '\n\n') : '') + data.pricingSelection;
      }

      var validationError = validatePayload(data);
      if (validationError) {
        setMessage(errorBox, validationError, 'error');
        return;
      }

      var endpoint = resolveContactEndpoint();
      var isLocalDebug = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
      if (isLocalDebug) {
        console.info('[Kontaktformular] Sende Request an:', endpoint);
        console.info('[Kontaktformular] Payload:', {
          name: data.name,
          email: data.email,
          company: data.company,
          projectType: data.projectType,
          messageLength: data.message.length,
          privacy: data.privacy,
          hasPricingSelection: !!data.pricingSelection
        });
      }

      var response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      var payload = {};
      var contentType = response.headers.get('content-type') || '';
      if (contentType.indexOf('application/json') !== -1) {
        try { payload = await response.json(); } catch (_) { payload = {}; }
      }

      if (isLocalDebug) {
        console.info('[Kontaktformular] API Antwort:', {
          status: response.status,
          ok: response.ok,
          payload: payload
        });
      }

      if (response.ok && payload.success) {
        setMessage(successBox, payload.message || getFormMessage('success'), 'success');
        form.reset();
        try { localStorage.removeItem('mase_pricing_selection'); } catch (_) {}
      } else if (response.status === 429) {
        setMessage(errorBox, (payload && payload.message) || getFormMessage('rateLimited'), 'error');
      } else {
        setMessage(errorBox, (payload && payload.message) || getFormMessage('connection'), 'error');
      }
    } catch (err) {
      if (/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
        console.error('[Kontaktformular] Netzwerk-/Fetch-Fehler:', err);
      }
      setMessage(errorBox, getFormMessage('connection'), 'error');
    } finally {
      isSubmitting = false;
      setSubmittingState(false);
    }
  });
})();
