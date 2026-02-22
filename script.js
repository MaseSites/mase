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
      if
