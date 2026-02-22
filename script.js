﻿// ============================================
// NAVIGATION TOGGLE
// ============================================
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const navLinks = siteNav ? Array.from(siteNav.querySelectorAll('a')) : [];

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============================================
// YEAR UPDATE (FOOTER)
// ============================================
const yearTarget = document.getElementById('year');
if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================
const revealElements = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && revealElements.length) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

// ============================================
// COOKIE BANNER (DSGVO)
// ============================================
const cookieBanner = document.getElementById('cookie-banner');
const cookieAccept = document.getElementById('cookie-accept');
const cookieReject = document.getElementById('cookie-reject');

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function enableAnalytics() {
  // Analytics aktivieren (Google Analytics bereits im Head)
  if (window.gtag) {
    gtag('consent', 'update', {
      'analytics_storage': 'granted'
    });
  }
}

function disableAnalytics() {
  // Analytics deaktivieren
  if (window.gtag) {
    gtag('consent', 'update', {
      'analytics_storage': 'denied'
    });
  }
}

if (cookieBanner && cookieAccept && cookieReject) {
  const consent = getCookie('cookie-consent');

  if (!consent) {
    setTimeout(() => {
      cookieBanner.classList.add('show');
    }, 1000);
  } else if (consent === 'accepted') {
    enableAnalytics();
  }

  cookieAccept.addEventListener('click', () => {
    setCookie('cookie-consent', 'accepted', 365);
    cookieBanner.classList.remove('show');
    enableAnalytics();
  });

  cookieReject.addEventListener('click', () => {
    setCookie('cookie-consent', 'rejected', 365);
    cookieBanner.classList.remove('show');
    disableAnalytics();
  });
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
const backToTopBtn = document.getElementById('back-to-top');

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ============================================
// CONTACT FORM VALIDATION & SUBMISSION WITH BACKEND
// ============================================
const contactForm = document.getElementById('contact-form');

if (contactForm) {
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');
  const privacyInput = document.getElementById('contact-privacy');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');
  const privacyError = document.getElementById('privacy-error');

  const formSuccess = document.getElementById('form-success');
  const formError = document.getElementById('form-error');

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('visible');
  }

  function clearError(input, errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
  }

  function validateForm() {
    let isValid = true;

    // Name Validierung
    if (!nameInput.value.trim()) {
      showError(nameInput, nameError, 'Bitte gib deinen Namen ein.');
      isValid = false;
    } else {
      clearError(nameInput, nameError);
    }

    // E-Mail Validierung
    if (!emailInput.value.trim()) {
      showError(emailInput, emailError, 'Bitte gib deine E-Mail ein.');
      isValid = false;
    } else if (!validateEmail(emailInput.value.trim())) {
      showError(emailInput, emailError, 'Bitte gib eine gültige E-Mail ein.');
      isValid = false;
    } else {
      clearError(emailInput, emailError);
    }

    // Nachricht Validierung
    if (!messageInput.value.trim()) {
      showError(messageInput, messageError, 'Bitte schreibe uns eine Nachricht.');
      isValid = false;
    } else if (messageInput.value.trim().length < 10) {
      showError(messageInput, messageError, 'Die Nachricht sollte mindestens 10 Zeichen lang sein.');
      isValid = false;
    } else {
      clearError(messageInput, messageError);
    }

    // Datenschutz Validierung
    if (!privacyInput.checked) {
      showError(privacyInput, privacyError, 'Bitte akzeptiere die Datenschutzerklärung.');
      isValid = false;
    } else {
      clearError(privacyInput, privacyError);
    }

    return isValid;
  }

  contactForm.addEventListener('submit', function(e) {
    // Nur Validierung – kein fetch, kein CORS, kein iframe
    // Formular submitted nativ zu formsubmit.co → Redirect zu danke.html
    if (!validateForm()) {
      e.preventDefault();
      return;
    }
    // Alles valid → Button deaktivieren und Submit durchlassen
    const submitButton = document.getElementById('submit-btn');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Wird gesendet...';
    }
    // Form submitted normal – funktioniert in Chrome, Edge, Opera GX, Safari ✅
  });
}

// Pre-fill form from URL parameters (from pricing page)
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const packageParam = urlParams.get('package');
  const priceParam = urlParams.get('price');
  const aiParam = urlParams.get('ai');
  const totalParam = urlParams.get('total');

  if (packageParam && priceParam) {
    const messageField = document.getElementById('contact-message');
    if (messageField && !messageField.value) {
      let message = `Ich interessiere mich für: ${decodeURIComponent(packageParam)}`;

      if (aiParam === '1') {
        message += ' + KI-Assistent';
      }

      message += '\n\n[Bitte ergänze hier deine spezifischen Anforderungen...]';

      messageField.value = message;
    }
  }

  // Email-Vorlage Button
  const emailTemplateBtn = document.getElementById('email-template-btn');
  if (emailTemplateBtn) {
    emailTemplateBtn.addEventListener('click', () => {
      // Heutiges Datum
      const today = new Date();
      const dateStr = today.toLocaleDateString('de-CH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Email-Vorlage
      const subject = 'Anfrage Website-Projekt - ' + dateStr;
      const body = `Guten Tag,

ich interessiere mich für eine Website-Lösung.

PROJEKTDETAILS:
- Projektart: [Neue Website / Überarbeitung / KI-Assistent]
- Gewünschter Umfang: [1 Seite / 3-5 Seiten / 6-10 Seiten]
- Branche: [z.B. Dienstleistung, E-Commerce, etc.]
- Ziel: [z.B. Lead-Generierung, Online-Shop, etc.]

ZEITRAHMEN:
- Gewünschter Start: [Datum]
- Deadline: [falls vorhanden]

BUDGET:
- Budget-Rahmen: CHF [ungefähre Vorstellung]

ZUSÄTZLICHE ANFORDERUNGEN:
- [Hier weitere Wünsche eintragen]

Beste Grüsse
[Dein Name]

---
Datum: ${dateStr}`;

      // Öffne Email-Client mit vorausgefüllter Vorlage
      const mailtoLink = `mailto:info@masesites.ch?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    });
  }
});

// ============================================
// PERFORMANCE MONITORING
// ============================================
if ('PerformanceObserver' in window) {
  // Core Web Vitals messen
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Analytics Event fÃ¼r Performance senden
        if (window.gtag && entry.name) {
          gtag('event', 'web_vitals', {
            'event_category': 'Performance',
            'event_label': entry.name,
            'value': Math.round(entry.value),
            'non_interaction': true
          });
        }
        console.log(`${entry.name}: ${entry.value}`);
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  } catch (e) {
    // Browser unterstÃ¼tzt Performance Observer nicht vollstÃ¤ndig
  }
}

// ============================================
// LAZY LOADING IMAGES (falls benÃ¶tigt)
// ============================================
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[data-src]');
  images.forEach(img => {
    img.src = img.dataset.src;
  });
} else {
  // Fallback fÃ¼r Ã¤ltere Browser
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
  document.body.appendChild(script);
}

// ============================================
// DYNAMIC PRICING CALCULATOR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const pricingOptions = document.querySelectorAll('.pricing-option-card input[type="radio"][name="package-type"]');
  const hostingOptions = document.querySelectorAll('.pricing-option-card input[type="radio"][name="hosting-type"]');
  const aiAddon = document.getElementById('ai-addon');
  const pricingBreakdown = document.getElementById('pricing-breakdown');
  const totalPriceDisplay = document.getElementById('total-price');
  const pricingCTA = document.getElementById('pricing-cta');

  if (!pricingOptions.length && !aiAddon) return;

  let selectedPackage = null;
  let selectedPackagePrice = 0;
  let selectedPackageName = '';
  let aiAddonPrice = 0;
  let selectedHostingPrice = 0;
  let selectedHostingName = '';

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  }

  function updatePricingSummary() {
    let total = selectedPackagePrice + aiAddonPrice + selectedHostingPrice;

    if (selectedPackage && pricingBreakdown) {
      let breakdownHTML = '';
      breakdownHTML += `<p class="pricing-summary-item"><span>${selectedPackageName}</span><span>CHF ${formatPrice(selectedPackagePrice)}</span></p>`;

      if (aiAddon && aiAddon.checked) {
        breakdownHTML += `<p class="pricing-summary-item"><span>KI-Assistent (einmalig)</span><span>CHF ${formatPrice(aiAddonPrice)}</span></p>`;
        breakdownHTML += `<p class="pricing-summary-item" style="font-size:0.85em;color:var(--muted)"><span>KI-Assistent (monatlich)</span><span>CHF 40 / Mt.</span></p>`;
      }

      if (selectedHostingName) {
        breakdownHTML += `<p class="pricing-summary-item"><span>${selectedHostingName}</span><span>CHF ${formatPrice(selectedHostingPrice)}</span></p>`;
      }

      pricingBreakdown.innerHTML = breakdownHTML;
    } else if (pricingBreakdown) {
      pricingBreakdown.innerHTML = '<p class="pricing-summary-hint">Wähle ein Paket um den Preis zu sehen</p>';
    }

    if (totalPriceDisplay) {
      if (aiAddon && aiAddon.checked) {
        totalPriceDisplay.innerHTML = `CHF ${formatPrice(total)} <small style="font-size:0.55em;font-weight:500;color:var(--muted);display:block">+ CHF 40 / Mt. (KI-Assistent)</small>`;
      } else {
        totalPriceDisplay.textContent = `CHF ${formatPrice(total)}`;
      }
    }

    if (pricingCTA) {
      pricingCTA.disabled = !selectedPackage;
    }
  }

  // Event Listener für Package Selection
  pricingOptions.forEach(option => {
    option.addEventListener('change', function() {
      if (this.checked) {
        selectedPackage = this.value;
        const card = this.closest('.pricing-option-card');
        selectedPackagePrice = parseInt(card.getAttribute('data-price'));

        const packageType = card.getAttribute('data-type');
        const packageName = card.querySelector('h4').textContent;

        if (packageType === 'revision') {
          selectedPackageName = `Überarbeitung ${packageName}`;
        } else {
          selectedPackageName = `Neue Website ${packageName}`;
        }

        updatePricingSummary();
      }
    });
  });

  // Event Listener für Hosting Selection
  hostingOptions.forEach(option => {
    option.addEventListener('change', function() {
      if (this.checked) {
        const card = this.closest('.pricing-option-card');
        selectedHostingPrice = parseInt(card.getAttribute('data-price'));
        const hostingType = card.getAttribute('data-type');
        const hostingName = card.querySelector('h4').textContent;
        if (hostingType === 'domain') selectedHostingName = `Domain (${hostingName})`;
        else if (hostingType === 'hosting') selectedHostingName = `Hosting (${hostingName}) /Mt.`;
        else selectedHostingName = `Domain + Hosting Bundle`;
        updatePricingSummary();
      }
    });
  });

  // Event Listener für Mase-AI Addon
  if (aiAddon) {
    aiAddon.addEventListener('change', function() {
      aiAddonPrice = this.checked ? parseInt(this.value) : 0;
      updatePricingSummary();
    });
  }

  // CTA Button Click Handler
  if (pricingCTA) {
    pricingCTA.addEventListener('click', function() {
      if (!this.disabled && selectedPackage) {
        const params = new URLSearchParams({
          package: selectedPackageName,
          price: selectedPackagePrice,
          ai: aiAddon && aiAddon.checked ? '1' : '0',
          total: selectedPackagePrice + aiAddonPrice + selectedHostingPrice
        });
        window.location.href = `kontakt.html?${params.toString()}`;
      }
    });
  }

  // Initial Summary
  updatePricingSummary();
});

// ============================================
// INTERACTIVE PREVIEW
// ============================================
const previewToggles = document.querySelectorAll('.preview-toggle');
const previewContents = document.querySelectorAll('.preview-content');

if (previewToggles.length > 0) {
  previewToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const mode = this.getAttribute('data-mode');
      previewToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      previewContents.forEach(content => content.classList.add('hidden'));
      const targetContent = document.querySelector(`[data-content="${mode}"]`);
      if (targetContent) {
        targetContent.classList.remove('hidden');
      }
    });
  });
}

// ============================================
// PROJECT SLIDER (Vanilla JS)
// ============================================
(function initSlider() {
  const track = document.getElementById('slider-track');
  const dots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');

  if (!track) return;

  let current = 0;
  const slides = track.children;
  const total = slides.length;
  let autoTimer = null;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', function() {
      goTo(parseInt(this.getAttribute('data-index')));
      resetAuto();
    });
  });

  // Touch/swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? current + 1 : current - 1);
      resetAuto();
    }
  }, { passive: true });

  startAuto();
})();

