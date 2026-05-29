// ============================================
// MASE AI Assistant
// ============================================

// OpenAI API Configuration (set via .env — never hardcode)
const OPENAI_API_KEY = '';
const OPENAI_MODEL   = 'gpt-4o';
const USE_OPENAI     = false;

// ---- Supabase logging helper ----
function maseLog(table, payload) {
  var cfg = window.MASE_SUPABASE;
  if (!cfg || !cfg.url || cfg.url.indexOf('PASTE_') === 0) return;
  fetch(cfg.url + '/rest/v1/' + table, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        cfg.anonKey,
      'Authorization': 'Bearer ' + cfg.anonKey,
      'Prefer':        'return=minimal'
    },
    body:      JSON.stringify(payload),
    keepalive: true
  }).catch(function () {});
}

function maseSessionId() {
  if (window.MASE_TRACK) return window.MASE_TRACK.sessionId;
  var key = 'mase_sid';
  var sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

class MASEAssistant {
  constructor() {
    this.conversationHistory = [];
    this.leadData = {
      branche:    null,
      ziel:       null,
      umfang:     null,
      deadline:   null,
      budget:     null,
      kiAssistant:null,
      kontakt:    null
    };
    this.stage            = 'greeting';
    this.appointmentStage = null; // active step of appointment flow, null = not in flow
    this.appointmentData  = {};   // collected field values
    this.init();
  }

  init() {
    this.createChatWidget();
    this.loadConversationFromStorage();
  }

  createChatWidget() {
    if (document.getElementById('ai-chat-widget')) return;

    const chatHTML = `
      <div class="ai-chat-widget" id="ai-chat-widget">
        <button class="ai-chat-toggle" id="ai-chat-toggle" aria-label="Mase-AI öffnen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="ai-chat-toggle-text">Mase-AI</span>
        </button>

        <div class="ai-chat-tooltip">
          Frag mich zu Websites, Preisen oder KI
        </div>

        <div class="ai-welcome-bubble" id="ai-welcome-bubble">
          <button class="ai-welcome-bubble-close" id="ai-welcome-bubble-close" aria-label="Schliessen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <p>Teste unseren KI-Assistenten live.</p>
        </div>

        <div class="ai-chat-container" id="ai-chat-container">
          <div class="ai-chat-header">
            <div class="ai-chat-header-top">
              <div class="ai-chat-header-info">
                <div class="ai-chat-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                    <circle cx="12" cy="10" r="2.5"/>
                    <path d="M7 10h1M16 10h1"/>
                  </svg>
                </div>
                <div>
                  <h3 class="ai-chat-title">Mase-AI</h3>
                  <div class="ai-chat-status">Online</div>
                </div>
              </div>
              <button class="ai-chat-close" id="ai-chat-close" aria-label="Chat schliessen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p class="ai-chat-subtitle">Fragen zu Websites, Preisen oder Projekten.</p>
          </div>

          <div class="ai-chat-messages" id="ai-chat-messages"></div>

          <div class="ai-chat-quick-replies" id="ai-chat-quick-replies"></div>

          <div class="ai-chat-input-container">
            <input
              type="text"
              class="ai-chat-input"
              id="ai-chat-input"
              placeholder="Deine Nachricht..."
              autocomplete="off"
            >
            <button class="ai-chat-send" id="ai-chat-send" aria-label="Senden">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);
    this.attachEventListeners();
    this.showWelcomeBubble();
  }

  attachEventListeners() {
    const toggle           = document.getElementById('ai-chat-toggle');
    const close            = document.getElementById('ai-chat-close');
    const input            = document.getElementById('ai-chat-input');
    const send             = document.getElementById('ai-chat-send');
    const welcomeBubbleClose = document.getElementById('ai-welcome-bubble-close');

    toggle.addEventListener('click', () => this.toggleChat());
    close.addEventListener('click',  () => this.closeChat());
    send.addEventListener('click',   () => this.sendMessage());

    if (welcomeBubbleClose) {
      welcomeBubbleClose.addEventListener('click', () => this.hideWelcomeBubble());
    }

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  // ---- Welcome Bubble ----

  showWelcomeBubble() {
    setTimeout(() => {
      const bubble        = document.getElementById('ai-welcome-bubble');
      const hasSeenBubble = localStorage.getItem('mase_seen_welcome_bubble');
      if (!hasSeenBubble && bubble) {
        bubble.classList.add('show');
        setTimeout(() => this.hideWelcomeBubble(), 10000);
      }
    }, 5000);
  }

  hideWelcomeBubble() {
    const bubble = document.getElementById('ai-welcome-bubble');
    if (bubble) {
      bubble.classList.remove('show');
      localStorage.setItem('mase_seen_welcome_bubble', 'true');
    }
  }

  // ---- Open / Close ----

  toggleChat() {
    const container = document.getElementById('ai-chat-container');
    const isOpen    = container.classList.toggle('open');
    if (isOpen) {
      this.hideWelcomeBubble();
      if (this.conversationHistory.length === 0) {
        this.showAIBenefitsBox();
        setTimeout(() => this.showLiveDemo(), 800);
      }
      document.getElementById('ai-chat-input').focus();
    }
  }

  closeChat() {
    document.getElementById('ai-chat-container').classList.remove('open');
  }

  // ---- Intro ----

  showAIBenefitsBox() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    messagesContainer.insertAdjacentHTML('beforeend', `
      <div class="ai-info-box">
        <h4>Was dieser KI-Assistent kann:</h4>
        <ul>
          <li>Kundenfragen automatisch beantworten</li>
          <li>Leads vorqualifizieren</li>
          <li>Termine vorbereiten</li>
          <li>Produkte oder Services erklären</li>
        </ul>
        <div class="ai-info-box-footer">Individuell mit deinen Inhalten trainierbar.</div>
      </div>
    `);
  }

  showLiveDemo() {
    this.sendBotMessage('Hallo — ich bin Mase-AI, dein digitaler Assistent.<br><br>Ich zeige dir kurz, wie ich arbeite...');

    setTimeout(() => this.addUserMessage('Was bringt mir ein KI-Assistent?'), 1400);
    setTimeout(() => this.showTypingIndicator(), 1500);

    setTimeout(() => {
      this.hideTypingIndicator();
      this.sendBotMessage(
        '<strong>Ein KI-Assistent für deine Website:</strong><br><br>' +
        '&#10003; Beantwortet Kundenfragen rund um die Uhr<br>' +
        '&#10003; Sammelt Leads automatisch<br>' +
        '&#10003; Steigert deine Abschlussrate<br>' +
        '&#10003; Entlastet deinen Support<br><br>' +
        'Das ist nicht nur ein Chat — das ist ein <strong>Verkaufs-Tool</strong>.'
      );
      setTimeout(() => {
        this.showQuickReplies([
          { text: 'Was kostet eine Website?',       action: () => this.handlePriceInquiry()   },
          { text: 'Was bringt ein KI-Assistent?',   action: () => this.handleAIInquiry()      },
          { text: 'Wie läuft ein Projekt ab?',      action: () => this.handleProcessInquiry() }
        ]);
      }, 400);
    }, 3000);
  }

  // ---- Send / Receive ----

  async sendMessage() {
    const input   = document.getElementById('ai-chat-input');
    const message = input.value.trim();
    if (!message) return;

    this.addUserMessage(message);
    input.value = '';
    this.showTypingIndicator();

    // Clear quick replies when user types
    document.getElementById('ai-chat-quick-replies').innerHTML = '';

    try {
      let botResponse;
      if (this.appointmentStage) {
        // Appointment collection flow — always takes priority
        await new Promise(r => setTimeout(r, 450));
        botResponse = await this._handleAppointmentStep(message);
      } else if (USE_OPENAI && OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
        botResponse = await this.getOpenAIResponse(message);
      } else {
        // Simulate a short processing delay for realism
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        botResponse = this.getIntelligentResponse(message);
      }
      this.hideTypingIndicator();
      this.sendBotMessage(botResponse);
    } catch (err) {
      console.error('Chat error:', err);
      this.hideTypingIndicator();
      this.sendBotMessage(this.getIntelligentResponse(message));
    }
  }

  // ---- Rule-based responses ----

  getIntelligentResponse(userMessage) {
    const m = userMessage.toLowerCase();

    if (/preis|kosten|chf|budget|wie viel/.test(m))
      return this._fmtPrice();

    if (/ki.assistent|chatbot|bot|automatisch|ki$/.test(m))
      return this._fmtAI();

    if (/termin|call|gespräch|meeting|besprechung|buchen|anfragen/.test(m))
      return this._startAppointmentFlow();

    if (/kontakt|anfrage|schreib|email|melden|erreichen/.test(m))
      return this._fmtContact();

    if (/prozess|ablauf|wie läuft|dauer|zeitrahmen|zeitplan/.test(m))
      return this._fmtProcess();

    if (/leistung|service|was macht|angebot/.test(m))
      return this._fmtServices();

    if (/hallo|hi|guten tag|hey|guten morgen|guten abend/.test(m))
      return this._fmtGreeting();

    if (/über|wer seid|team|gegründet|masesites/.test(m))
      return this._fmtAbout();

    if (/referenz|beispiel|portfolio|arbeit/.test(m))
      return this._fmtPortfolio();

    if (/webdesign|website|webseite|landing/.test(m))
      return this._fmtWebsite();

    if (/seo|google|ranking|sichtbar/.test(m))
      return this._fmtSEO();

    return this._fmtDefault();
  }

  _fmtPrice() {
    return `<strong>Preisübersicht MASESites:</strong><br><br>
<strong>Website-Überarbeitung</strong><br>
Starter: CHF 250 — Plus: CHF 300 — Pro: CHF 1'000<br><br>
<strong>Neue Website</strong><br>
Starter: CHF 750 — Business: CHF 1'300 — Premium: CHF 2'500<br><br>
<strong>KI-Assistent</strong><br>
+CHF 200 einmalig + CHF 40/Mt.<br><br>
Finale Preise nach kurzem Erstgespräch.<br>
<a href="preise.html">Preisübersicht ansehen</a> &nbsp;·&nbsp; <a href="kontakt.html">Anfragen</a>`;
  }

  _fmtAI() {
    return `<strong>KI-Assistent für deine Website:</strong><br><br>
<strong>Funktionen:</strong><br>
— Beantwortet FAQ rund um die Uhr<br>
— Qualifiziert Leads automatisch<br>
— Sammelt Kontaktdaten<br>
— Terminvereinbarung<br><br>
<strong>Preis:</strong> CHF 200 einmalig + CHF 40/Mt.<br><br>
<strong>Nutzen:</strong> Mehr Leads, weniger Support-Aufwand, höhere Conversion<br><br>
<a href="ki-assistent.html">Mehr zum KI-Assistenten</a>`;
  }

  _fmtMeeting() {
    return `Gerne vereinbaren wir einen Termin:<br><br>
<strong>Email:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a><br>
<strong>Telefon:</strong> <a href="tel:+41782158922">078 215 89 22</a><br><br>
Oder direkt über unser <a href="kontakt.html">Kontaktformular</a>.<br><br>
Wir melden uns innerhalb von 24 Stunden.`;
  }

  _fmtContact() {
    return `So erreichst du uns:<br><br>
<strong>Email:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a><br>
<strong>Telefon:</strong> <a href="tel:+41782158922">078 215 89 22</a><br>
<strong>Formular:</strong> <a href="kontakt.html">Kontaktformular</a><br><br>
Wir antworten innerhalb von 24 Stunden.`;
  }

  _fmtProcess() {
    return `<strong>Unser Prozess:</strong><br><br>
<strong>01 — Analyse</strong> (1–2 Tage)<br>
Wir verstehen dein Business und definieren klare Ziele.<br><br>
<strong>02 — Design &amp; Entwicklung</strong> (2–6 Wochen)<br>
Du siehst früh das Layout und gibst Feedback.<br><br>
<strong>03 — Launch &amp; Optimierung</strong> (1 Woche)<br>
Testing, Live-Gang und Monitoring.<br><br>
<a href="kontakt.html">Projekt starten</a>`;
  }

  _fmtServices() {
    return `<strong>MASESites Leistungen:</strong><br><br>
— <strong>Webdesign</strong> — Modern &amp; conversion-optimiert<br>
— <strong>Webentwicklung</strong> — Sauber &amp; performant<br>
— <strong>SEO &amp; Performance</strong> — Schnell &amp; sichtbar<br>
— <strong>KI-Assistent</strong> — 24/7 Kundenberatung<br><br>
<a href="leistungen.html">Alle Leistungen ansehen</a>`;
  }

  _fmtGreeting() {
    return `Hallo — ich bin dein MASESites-Assistent.<br><br>
Ich helfe dir bei Fragen zu:<br>
— Website-Projekten<br>
— Preisen<br>
— KI-Integration<br>
— Projektablauf<br><br>
Was möchtest du wissen?`;
  }

  _fmtAbout() {
    return `<strong>MASESites</strong><br><br>
Gegründet von Matteo &amp; Severin<br><br>
<strong>Mission:</strong> Moderne, klare und leistungsstarke Websites<br><br>
<strong>Werte:</strong> Ehrlichkeit — Qualität — Klare Kommunikation<br><br>
<a href="ueber-uns.html">Mehr über uns</a>`;
  }

  _fmtPortfolio() {
    return `Wir zeigen auf unserer Website nur <strong>echte Projekte</strong> — keine Mock-ups.<br><br>
<strong>Typische Branchen:</strong><br>
— B2B-Dienstleister<br>
— Beratung &amp; Coaching<br>
— E-Commerce<br>
— Startups<br><br>
Jedes Projekt ist individuell. <a href="kontakt.html">Lass uns über deins sprechen</a>`;
  }

  _fmtWebsite() {
    return `<strong>Website-Projekte mit MASESites:</strong><br><br>
— Neue Website von Grund auf<br>
— Redesign bestehender Seiten<br>
— Landing Pages<br>
— E-Commerce-Lösungen<br><br>
<strong>Neue Website ab CHF 750 — Redesign ab CHF 250</strong><br><br>
<a href="preise.html">Preise ansehen</a> &nbsp;·&nbsp; <a href="kontakt.html">Anfragen</a>`;
  }

  _fmtSEO() {
    return `<strong>SEO &amp; Performance:</strong><br><br>
— Technisches SEO &amp; strukturierte Daten<br>
— Core Web Vitals Optimierung<br>
— Google Search Console Setup<br>
— Ladezeit-Optimierung<br><br>
Inklusive bei Business &amp; Premium Paketen.<br><br>
<a href="leistungen.html">Leistungen ansehen</a>`;
  }

  _fmtDefault() {
    return `Ich helfe dir gerne weiter.<br><br>
Häufige Themen:<br>
— <a href="preise.html"><strong>Preise</strong></a> für Website-Projekte<br>
— <a href="ki-assistent.html"><strong>KI-Assistent</strong></a> Integration<br>
— <strong>Projektablauf</strong> &amp; Zeitrahmen<br>
— Direkte <a href="kontakt.html"><strong>Kontaktaufnahme</strong></a><br><br>
Schreib uns auch direkt: <a href="mailto:info@masesites.ch">info@masesites.ch</a>`;
  }

  // ---- OpenAI fallback ----

  async getOpenAIResponse(userMessage) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model:    OPENAI_MODEL,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          ...this.conversationHistory.map(m => ({
            role:    m.role === 'user' ? 'user' : 'assistant',
            content: m.message
          })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens:  500
      })
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  getSystemPrompt() {
    return `ROLLE
Du bist der Website- & KI-Sales Assistant von MASESites (Matteo & Severin).
Du schreibst auf Deutsch (Schweiz), kurz, klar, aktiv.
Verwende KEINE Emojis.

MISSION
- Verwandle Anfragen in qualifizierte Projektanfragen
- Verkaufe MASESites überzeugend aber ehrlich
- Keine erfundenen Referenzen

PREISE
- Überarbeitung: CHF 250-1'000
- Neue Website: CHF 750-2'500
- KI-Assistent: +CHF 200 einmalig + CHF 40/Mt.

ANTWORTEN
- Kurz und klar (max 100 Wörter)
- Mit HTML: <br> für Umbrüche, <strong> für Fettdruck
- Immer CTA: Link zu kontakt.html oder Email
- Bei Preisfragen: Spannen nennen + "nach kurzem Call"`;
  }

  // ---- Message rendering ----

  addUserMessage(message) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    messagesContainer.insertAdjacentHTML('beforeend', `
      <div class="ai-message ai-message-user">
        <div class="ai-message-content">${this.escapeHtml(message)}</div>
      </div>
    `);
    this.scrollToBottom();

    this.conversationHistory.push({ role: 'user', message });
    this.saveConversationToStorage();

    maseLog('mase_chat_messages', {
      session_id: maseSessionId(),
      role:       'user',
      message:    message,
      page_url:   location.pathname.replace(/^\//, '') || 'index.html',
      page_title: document.title,
      language:   localStorage.getItem('lang') || 'de'
    });

    this._detectLeadIntent(message);
  }

  sendBotMessage(message, delay = 0) {
    setTimeout(() => {
      const messagesContainer = document.getElementById('ai-chat-messages');
      const plain = message.replace(/<[^>]+>/g, '').trim();

      messagesContainer.insertAdjacentHTML('beforeend', `
        <div class="ai-message ai-message-bot">
          <div class="ai-message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <circle cx="12" cy="10" r="2"/>
              <path d="M8 10h.5M15.5 10h.5"/>
            </svg>
          </div>
          <div class="ai-message-content">${message}</div>
        </div>
      `);
      this.scrollToBottom();

      this.conversationHistory.push({ role: 'bot', message: plain });
      this.saveConversationToStorage();

      maseLog('mase_chat_messages', {
        session_id: maseSessionId(),
        role:       'bot',
        message:    plain.slice(0, 1000),
        page_url:   location.pathname.replace(/^\//, '') || 'index.html',
        page_title: document.title,
        language:   localStorage.getItem('lang') || 'de'
      });
    }, delay);
  }

  // ---- Lead intent detection ----

  _detectLeadIntent(message) {
    const lower    = message.toLowerCase();
    let interest   = null;
    let category   = 'question';

    if (/preis|kosten|chf|budget|wie viel/.test(lower)) {
      interest = 'Preise';        category = 'question';
    } else if (/termin|call|gespräch|meeting|besprechung/.test(lower)) {
      interest = 'Termin';        category = 'meeting_request';
    } else if (/webdesign|neue website|webseite|landing/.test(lower)) {
      interest = 'Webdesign';     category = 'website_request';
    } else if (/ki|assistent|chatbot|bot/.test(lower)) {
      interest = 'KI-Assistent';  category = 'website_request';
    } else if (/leistung|service|was macht|angebot/.test(lower)) {
      interest = 'Leistungen';    category = 'question';
    } else if (/kontakt|anfrage|schreib|email|melden/.test(lower)) {
      interest = 'Kontakt';       category = 'new_lead';
    } else if (/hilfe|problem|support|funktioniert/.test(lower)) {
      interest = 'Support';       category = 'support';
    }

    if (interest) {
      this.leadData.ziel = interest;
      maseLog('mase_leads', {
        session_id:       maseSessionId(),
        service_interest: interest,
        category:         category,
        message:          message.slice(0, 500),
        source:           'chatbot',
        status:           'new'
      });
    }
  }

  // ---- Typing indicator ----

  showTypingIndicator() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    messagesContainer.insertAdjacentHTML('beforeend', `
      <div class="ai-message ai-message-bot ai-typing" id="ai-typing">
        <div class="ai-message-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <circle cx="12" cy="10" r="2"/>
          </svg>
        </div>
        <div class="ai-message-content">
          <span></span><span></span><span></span>
        </div>
      </div>
    `);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const el = document.getElementById('ai-typing');
    if (el) el.remove();
  }

  // ---- Quick Replies ----

  showQuickReplies(replies) {
    const container = document.getElementById('ai-chat-quick-replies');
    container.innerHTML = '<div class="ai-quick-replies-title">Vorschläge:</div>';
    replies.forEach(reply => {
      const btn = document.createElement('button');
      btn.className   = 'ai-quick-reply';
      btn.textContent = reply.text;
      btn.addEventListener('click', () => {
        this.addUserMessage(reply.text);
        container.innerHTML = '';
        this.showTypingIndicator();
        setTimeout(() => {
          this.hideTypingIndicator();
          if (reply.action) reply.action();
        }, 700);
      });
      container.appendChild(btn);
    });
  }

  // ---- Quick-reply handlers ----

  handlePriceInquiry()   { this.sendBotMessage(this._fmtPrice()); }
  handleAIInquiry()      { this.sendBotMessage(this._fmtAI()); }
  handleProcessInquiry() { this.sendBotMessage(this._fmtProcess()); }

  // ---- Helpers ----

  scrollToBottom() {
    const el = document.getElementById('ai-chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  saveConversationToStorage() {
    try {
      localStorage.setItem('mase_chat_history', JSON.stringify(this.conversationHistory));
      localStorage.setItem('mase_lead_data',    JSON.stringify(this.leadData));
      localStorage.setItem('mase_apt_stage',    this.appointmentStage || '');
      localStorage.setItem('mase_apt_data',     JSON.stringify(this.appointmentData));
    } catch (e) { /* storage full */ }
  }

  loadConversationFromStorage() {
    try {
      const h = localStorage.getItem('mase_chat_history');
      const l = localStorage.getItem('mase_lead_data');
      const s = localStorage.getItem('mase_apt_stage');
      const d = localStorage.getItem('mase_apt_data');
      if (h) this.conversationHistory = JSON.parse(h);
      if (l) this.leadData            = JSON.parse(l);
      if (s) this.appointmentStage    = s || null;
      if (d) this.appointmentData     = JSON.parse(d);
    } catch (e) { /* corrupt data — ignore */ }
  }

  // ============================================================
  // APPOINTMENT BOOKING FLOW
  // Collects fields step-by-step, saves via POST /api/appointments
  // ============================================================

  _startAppointmentFlow() {
    this.appointmentStage = 'first_name';
    this.appointmentData  = {};
    return 'Gerne buche ich dir ein Erstgespräch! &#128197;<br><br>Wie ist dein <strong>Vorname</strong>?';
  }

  async _handleAppointmentStep(input) {
    const val = input.trim();

    switch (this.appointmentStage) {

      case 'first_name':
        if (!val) return 'Bitte gib deinen Vornamen ein.';
        this.appointmentData.first_name = val;
        this.appointmentStage = 'last_name';
        this.saveConversationToStorage();
        return 'Und dein <strong>Nachname</strong>?';

      case 'last_name':
        if (!val) return 'Bitte gib deinen Nachnamen ein.';
        this.appointmentData.last_name = val;
        this.appointmentStage = 'email';
        this.saveConversationToStorage();
        return 'Deine <strong>E-Mail-Adresse</strong>?';

      case 'email': {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return 'Bitte gib eine gültige E-Mail-Adresse ein (z.B. max@beispiel.ch).';
        }
        this.appointmentData.email = val.toLowerCase();
        this.appointmentStage = 'phone';
        this.saveConversationToStorage();
        return 'Deine <strong>Telefonnummer</strong>?';
      }

      case 'phone':
        if (!val || val.replace(/\D/g, '').length < 6) {
          return 'Bitte gib eine gültige Telefonnummer ein.';
        }
        this.appointmentData.phone = val;
        this.appointmentStage = 'date';
        this.saveConversationToStorage();
        return 'Welches <strong>Datum</strong> wünschst du dir?<br><small style="opacity:.65">z.B. 15.06.2026</small>';

      case 'date':
        if (!val) return 'Bitte gib ein Datum ein.';
        this.appointmentData.appointment_date = val;
        this.appointmentStage = 'time';
        this.saveConversationToStorage();
        return 'Zu welcher <strong>Uhrzeit</strong>?<br><small style="opacity:.65">z.B. 14:00 Uhr</small>';

      case 'time':
        if (!val) return 'Bitte gib eine Uhrzeit ein.';
        this.appointmentData.appointment_time = val;
        this.appointmentStage = 'message';
        this.saveConversationToStorage();
        return 'Hast du eine kurze <strong>Nachricht</strong> oder Grund für den Termin?<br><small style="opacity:.65">Optional — schreib "nein" zum Überspringen</small>';

      case 'message': {
        const isSkip = /^(nein|skip|keine|–|-|\.|\s*)$/i.test(val);
        this.appointmentData.message = isSkip ? '' : val;
        return await this._saveAppointment();
      }

      default:
        this.appointmentStage = null;
        this.saveConversationToStorage();
        return this._fmtDefault();
    }
  }

  async _saveAppointment() {
    const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '' : 'https://mase-production.up.railway.app';

    try {
      const res  = await fetch(apiBase + '/api/appointments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(this.appointmentData)
      });
      const data = await res.json();

      // Reset flow regardless of outcome
      this.appointmentStage = null;
      this.appointmentData  = {};
      this.saveConversationToStorage();

      if (!res.ok || !data.success) {
        console.error('[Termin] Fehler:', data);
        return 'Leider gab es einen Fehler. Bitte kontaktiere uns direkt:<br>' +
               '<a href="mailto:info@masesites.ch">info@masesites.ch</a> &nbsp;·&nbsp; ' +
               '<a href="tel:+41782158922">078 215 89 22</a>';
      }

      return 'Danke, dein Termin wurde eingetragen. Wir melden uns zur Bestätigung.';

    } catch (err) {
      console.error('[Termin] Netzwerkfehler:', err);
      this.appointmentStage = null;
      this.appointmentData  = {};
      this.saveConversationToStorage();
      return 'Verbindungsfehler. Bitte kontaktiere uns direkt:<br>' +
             '<a href="mailto:info@masesites.ch">info@masesites.ch</a>';
    }
  }

}

// ---- Initialise ----
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { window.maseAssistant = new MASEAssistant(); });
} else {
  window.maseAssistant = new MASEAssistant();
}
