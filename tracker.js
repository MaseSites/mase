// ============================================================
// MASE Analytics Tracker v1.0
// Tracks: page views, time on page, scroll depth, button clicks
// Requires: supabase-config.js loaded first
// ============================================================
(function () {
  'use strict';

  var cfg = window.MASE_SUPABASE;
  if (!cfg || !cfg.url || cfg.url.indexOf('PASTE_') === 0) return; // not configured yet

  // ---- Session ID (persisted per browser session) ----
  function getSessionId() {
    var key = 'mase_sid';
    var sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(key, sid);
    }
    return sid;
  }

  var SESSION_ID  = getSessionId();
  var PAGE_URL    = location.pathname.replace(/^\//, '') || 'index.html';
  var PAGE_TITLE  = document.title;
  var PAGE_START  = Date.now();
  var MAX_SCROLL  = 0;
  var LANG        = localStorage.getItem('lang') || 'de';
  var DEVICE      = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile'
                  : /Tablet|iPad/i.test(navigator.userAgent) ? 'tablet' : 'desktop';

  // ---- Supabase REST insert helper ----
  function insert(table, payload) {
    fetch(cfg.url + '/rest/v1/' + table, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        cfg.anonKey,
        'Authorization': 'Bearer ' + cfg.anonKey,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {}); // silent fail — never break the page
  }

  // ---- Track scroll depth ----
  function onScroll() {
    var pct = Math.round(
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
    );
    if (pct > MAX_SCROLL) MAX_SCROLL = pct;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Track button & CTA clicks ----
  document.addEventListener('click', function (e) {
    var el = e.target;
    // Walk up max 3 levels to find button/link
    for (var i = 0; i < 3; i++) {
      if (!el) break;
      if (el.tagName === 'BUTTON' || el.tagName === 'A' ||
          el.classList.contains('button') || el.classList.contains('button-primary')) {
        var label = (el.textContent || '').trim().slice(0, 100);
        var evType = el.tagName === 'A' ? 'link_click' : 'button_click';

        // Only track meaningful elements (skip tiny icons with no text)
        if (label.length > 0) {
          insert('mase_events', {
            session_id:   SESSION_ID,
            event_type:   evType,
            event_label:  label,
            page_url:     PAGE_URL,
            element_id:   el.id || null,
            element_text: label
          });
        }
        break;
      }
      el = el.parentElement;
    }
  }, { passive: true });

  // ---- Track quick-reply buttons in the chatbot ----
  document.addEventListener('click', function (e) {
    var el = e.target.closest('.ai-quick-reply, .ki-chat-suggestion');
    if (el) {
      insert('mase_events', {
        session_id:   SESSION_ID,
        event_type:   'quick_reply_click',
        event_label:  (el.textContent || '').trim().slice(0, 100),
        page_url:     PAGE_URL,
        element_id:   null,
        element_text: (el.textContent || '').trim().slice(0, 100)
      });
    }
  }, { passive: true });

  // ---- Record page view on load ----
  function recordPageView(timeOnPage) {
    insert('mase_page_views', {
      session_id:   SESSION_ID,
      page_url:     PAGE_URL,
      page_title:   PAGE_TITLE,
      referrer:     document.referrer ? new URL(document.referrer).pathname : null,
      time_on_page: timeOnPage || 0,
      scroll_depth: MAX_SCROLL,
      device_type:  DEVICE,
      language:     LANG
    });
  }

  // ---- On page leave: send full view with time + scroll ----
  function onLeave() {
    var seconds = Math.round((Date.now() - PAGE_START) / 1000);
    recordPageView(seconds);
  }
  window.addEventListener('beforeunload', onLeave);
  // Also record on visibility change (tab switch / phone lock)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') onLeave();
  });

  // ---- Initial page view (with 0 time — will be updated on leave) ----
  function init() {
    recordPageView(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Expose helper so chatbot can call trackEvent() ----
  window.MASE_TRACK = {
    sessionId: SESSION_ID,
    event: function (type, label) {
      insert('mase_events', {
        session_id:   SESSION_ID,
        event_type:   type,
        event_label:  label,
        page_url:     PAGE_URL,
        element_id:   null,
        element_text: label
      });
    },
    insert: insert
  };

})();
