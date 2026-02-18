// ============================================
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

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    submitButton.disabled = true;

    // Hide previous messages
    if (formSuccess) formSuccess.classList.remove('visible');
    if (formError) formError.classList.remove('visible');

    // Formular-Daten sammeln
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    try {
      // Send to backend
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success
        if (formSuccess) {
          formSuccess.textContent = '✓ ' + result.message;
          formSuccess.classList.add('visible');
        }

        // Reset form
        contactForm.reset();

        // Scroll to success message
        formSuccess?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      } else {
        // Error from server
        if (formError) {
          document.getElementById('error-text').textContent = result.message || 'Ein Fehler ist aufgetreten.';
          formError.classList.add('visible');
        }
      }

    } catch (error) {
      console.error('Form submission error:', error);

      // Network error
      if (formError) {
        document.getElementById('error-text').textContent = 'Verbindungsfehler. Bitte schreibe direkt an masesitesinfo@gmail.com';
        formError.classList.add('visible');
      }
    } finally {
      // Reset button state
      submitButton.classList.remove('loading');
      submitButton.disabled = false;
    }
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
      let message = `Ich interessiere mich für: ${decodeURIComponent(packageParam)} (CHF ${priceParam})`;

      if (aiParam === '1') {
        message += ' + KI-Assistent (CHF 300)';
      }

      if (totalParam) {
        message += `\n\nGesamtpreis: CHF ${totalParam}`;
      }

      message += '\n\n[Bitte ergänze hier deine spezifischen Anforderungen...]';

      messageField.value = message;
    }
  }
});

      // Erfolg anzeigen
      formSuccess.classList.add('visible');
      contactForm.reset();

      // Analytics Event tracken
      if (window.gtag) {
        gtag('event', 'form_submission', {
          'event_category': 'Contact',
          'event_label': 'Contact Form'
        });
      }

      // Erfolg-Nachricht nach 5 Sekunden ausblenden
      setTimeout(() => {
        formSuccess.classList.remove('visible');
      }, 5000);

    } catch (error) {
      console.error('Fehler beim Senden:', error);
      alert('Es gab einen Fehler beim Senden. Bitte versuche es erneut oder kontaktiere uns per E-Mail.');
    } finally {
      submitButton.classList.remove('loading');
      submitButton.disabled = false;
    }
  });

  // Live-Validierung bei Input
  [nameInput, emailInput, messageInput].forEach(input => {
    input.addEventListener('blur', validateForm);
  });

  privacyInput.addEventListener('change', validateForm);
}

// ============================================
// PERFORMANCE MONITORING
// ============================================
if ('PerformanceObserver' in window) {
  // Core Web Vitals messen
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Analytics Event für Performance senden
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
    // Browser unterstützt Performance Observer nicht vollständig
  }
}

// ============================================
// LAZY LOADING IMAGES (falls benötigt)
// ============================================
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[data-src]');
  images.forEach(img => {
    img.src = img.dataset.src;
  });
} else {
  // Fallback für ältere Browser
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
  document.body.appendChild(script);
}

// ============================================
// DYNAMIC PRICING CALCULATOR
// ============================================
const pricingOptions = document.querySelectorAll('.pricing-option-card input[type="radio"]');
const aiAddon = document.getElementById('ai-addon');
const pricingBreakdown = document.getElementById('pricing-breakdown');
const totalPriceDisplay = document.getElementById('total-price');
const pricingCTA = document.getElementById('pricing-cta');

let selectedPackage = null;
let selectedPackagePrice = 0;
let selectedPackageName = '';
let aiAddonPrice = 0;

function updatePricingSummary() {
  let total = selectedPackagePrice + aiAddonPrice;

  // Breakdown anzeigen
  if (selectedPackage) {
    let breakdownHTML = '';

    breakdownHTML += `<p class="pricing-summary-item"><span>${selectedPackageName}</span><span>CHF ${selectedPackagePrice.toLocaleString('de-CH')}</span></p>`;

    if (aiAddon && aiAddon.checked) {
      breakdownHTML += `<p class="pricing-summary-item"><span>KI-Assistent</span><span>CHF ${aiAddonPrice.toLocaleString('de-CH')}</span></p>`;
    }

    pricingBreakdown.innerHTML = breakdownHTML;
  } else {
    pricingBreakdown.innerHTML = '<p class="pricing-summary-hint">Wähle ein Paket um den Preis zu sehen</p>';
  }

  // Gesamtpreis aktualisieren
  totalPriceDisplay.textContent = `CHF ${total.toLocaleString('de-CH')}`;

  // CTA Button aktivieren/deaktivieren
  if (selectedPackage) {
    pricingCTA.disabled = false;
    pricingCTA.textContent = 'Projekt starten';
  } else {
    pricingCTA.disabled = true;
    pricingCTA.textContent = 'Projekt starten';
  }
}

// Event Listener für Package Selection
if (pricingOptions.length > 0) {
  pricingOptions.forEach(option => {
    option.addEventListener('change', function() {
      if (this.checked) {
        selectedPackage = this.value;
        const card = this.closest('.pricing-option-card');
        selectedPackagePrice = parseInt(card.getAttribute('data-price'));

        // Name bestimmen
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
}

// Event Listener für KI-Addon
if (aiAddon) {
  aiAddon.addEventListener('change', function() {
    if (this.checked) {
      aiAddonPrice = parseInt(this.value);
    } else {
      aiAddonPrice = 0;
    }
    updatePricingSummary();
  });
}

// CTA Button Click Handler
if (pricingCTA) {
  pricingCTA.addEventListener('click', function() {
    if (!this.disabled && selectedPackage) {
      // Build query parameters
      const params = new URLSearchParams({
        package: selectedPackageName,
        price: selectedPackagePrice,
        ai: aiAddon && aiAddon.checked ? '1' : '0',
        total: selectedPackagePrice + aiAddonPrice
      });

      // Navigate to contact page with parameters
      window.location.href = `kontakt.html?${params.toString()}`;
    }
  });
}

// Initial Summary erstellen
updatePricingSummary();

// ============================================
// INTERACTIVE PREVIEW
// ============================================
const previewToggles = document.querySelectorAll('.preview-toggle');
const previewContents = document.querySelectorAll('.preview-content');

if (previewToggles.length > 0) {
  previewToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const mode = this.getAttribute('data-mode');

      // Remove active from all toggles
      previewToggles.forEach(t => t.classList.remove('active'));

      // Add active to clicked toggle
      this.classList.add('active');

      // Hide all content
      previewContents.forEach(content => content.classList.add('hidden'));

      // Show selected content
      const targetContent = document.querySelector(`[data-content="${mode}"]`);
      if (targetContent) {
        targetContent.classList.remove('hidden');
      }
    });
  });
}

