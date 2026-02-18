// ============================================
// KI-SALES ASSISTANT für StudioName
// ============================================

// OpenAI API Configuration
const OPENAI_API_KEY = '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'; // <-- Hier deinen Key einfügen
const OPENAI_MODEL = 'gpt-4';

class StudioNameAssistant {
  constructor() {
    this.conversationHistory = [];
    this.leadData = {
      branche: null,
      ziel: null,
      umfang: null,
      deadline: null,
      budget: null,
      kiAssistant: null,
      kontakt: null
    };
    this.stage = 'greeting'; // greeting, qualifying, recommending, closing
    this.init();
  }

  init() {
    this.createChatWidget();
    this.loadConversationFromStorage();
  }

  createChatWidget() {
    // Chat Widget HTML - Optimiert
    const chatHTML = `
      <div class="ai-chat-widget" id="ai-chat-widget">
        <button class="ai-chat-toggle" id="ai-chat-toggle" aria-label="KI-Assistent öffnen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="ai-chat-toggle-text">KI-Assistent testen</span>
        </button>
        
        <div class="ai-chat-tooltip">
          Frag mich etwas über unsere Leistungen
        </div>

        <div class="ai-welcome-bubble" id="ai-welcome-bubble">
          <button class="ai-welcome-bubble-close" id="ai-welcome-bubble-close" aria-label="Schließen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <p>Teste unseren KI-Assistenten live.</p>
        </div>
        
        <div class="ai-chat-container" id="ai-chat-container">
          <div class="ai-chat-header">
            <div class="ai-chat-header-top">
              <div class="ai-chat-header-info">
                <div class="ai-chat-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="ai-chat-title">StudioName KI-Assistent</h3>
                  <div class="ai-chat-status">Online</div>
                </div>
              </div>
              <button class="ai-chat-close" id="ai-chat-close" aria-label="Chat schließen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p class="ai-chat-subtitle">Stell mir Fragen zu Websites, Preisen oder Projekten.</p>
          </div>
          
          <div class="ai-chat-messages" id="ai-chat-messages">
            <!-- Messages will be added here -->
          </div>
          
          <div class="ai-chat-quick-replies" id="ai-chat-quick-replies">
            <!-- Quick reply buttons will be added here -->
          </div>
          
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
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
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
    const toggle = document.getElementById('ai-chat-toggle');
    const close = document.getElementById('ai-chat-close');
    const container = document.getElementById('ai-chat-container');
    const input = document.getElementById('ai-chat-input');
    const send = document.getElementById('ai-chat-send');
    const welcomeBubbleClose = document.getElementById('ai-welcome-bubble-close');

    toggle.addEventListener('click', () => this.toggleChat());
    close.addEventListener('click', () => this.closeChat());
    send.addEventListener('click', () => this.sendMessage());

    if (welcomeBubbleClose) {
      welcomeBubbleClose.addEventListener('click', () => this.hideWelcomeBubble());
    }

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  showWelcomeBubble() {
    // Zeige Welcome Bubble nach 5 Sekunden
    setTimeout(() => {
      const bubble = document.getElementById('ai-welcome-bubble');
      const hasSeenBubble = localStorage.getItem('studioname_seen_welcome_bubble');

      if (!hasSeenBubble && bubble) {
        bubble.classList.add('show');

        // Auto-hide nach 10 Sekunden
        setTimeout(() => {
          this.hideWelcomeBubble();
        }, 10000);
      }
    }, 5000);
  }

  hideWelcomeBubble() {
    const bubble = document.getElementById('ai-welcome-bubble');
    if (bubble) {
      bubble.classList.remove('show');
      localStorage.setItem('studioname_seen_welcome_bubble', 'true');
    }
  }

  toggleChat() {
    const container = document.getElementById('ai-chat-container');
    const isOpen = container.classList.toggle('open');

    if (isOpen) {
      // Hide welcome bubble wenn Chat geöffnet wird
      this.hideWelcomeBubble();

      if (this.conversationHistory.length === 0) {
        // Zeige KI-Nutzen Info-Box
        this.showAIBenefitsBox();

        // Auto-Demo nach 1 Sekunde
        setTimeout(() => {
          this.showLiveDemo();
        }, 1000);
      }
      document.getElementById('ai-chat-input').focus();
    }
  }

  showAIBenefitsBox() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const infoBoxHTML = `
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
    `;
    messagesContainer.insertAdjacentHTML('beforeend', infoBoxHTML);
  }

  showLiveDemo() {
    // Automatischer Demo-Dialog
    this.sendBotMessage(`Hallo! Ich bin dein StudioName KI-Assistent.<br><br>Ich zeige dir kurz, wie ich arbeite...`);

    setTimeout(() => {
      this.addUserMessage('Was bringt mir ein KI-Assistent?');
    }, 1500);

    setTimeout(() => {
      this.showTypingIndicator();
    }, 1600);

    setTimeout(() => {
      this.hideTypingIndicator();
      this.sendBotMessage(`<strong>Ein KI-Assistent für deine Website:</strong><br><br>✓ Beantwortet Kundenfragen 24/7<br>✓ Sammelt Leads automatisch<br>✓ Steigert deine Abschlussrate<br>✓ Entlastet deinen Support<br><br>Das ist nicht nur ein Chat.<br>Das ist ein <strong>Verkaufs-Tool</strong>.`);

      setTimeout(() => {
        this.showQuickReplies([
          { text: 'Was kostet eine Website?', action: () => this.handlePriceInquiry() },
          { text: 'Was bringt mir ein KI-Assistent?', action: () => this.handleAIInquiry() },
          { text: 'Wie läuft ein Projekt ab?', action: () => this.handleProcessInquiry() }
        ]);
      }, 500);
    }, 3200);
  }

  closeChat() {
    document.getElementById('ai-chat-container').classList.remove('open');
  }

  async sendMessage() {
    const input = document.getElementById('ai-chat-input');
    const message = input.value.trim();

    if (!message) return;

    this.addUserMessage(message);
    input.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // ECHTE OpenAI API Anfrage
      const botResponse = await this.getOpenAIResponse(message);
      this.hideTypingIndicator();
      this.sendBotMessage(botResponse);

    } catch (error) {
      console.error('Chat Error:', error);
      this.hideTypingIndicator();
      this.sendBotMessage('Entschuldigung, technisches Problem. Schreib uns direkt: hello@studioname.ch');
    }
  }

  addUserMessage(message) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const messageHTML = `
      <div class="ai-message ai-message-user">
        <div class="ai-message-content">${this.escapeHtml(message)}</div>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    this.scrollToBottom();

    this.conversationHistory.push({ role: 'user', message });
    this.saveConversationToStorage();
  }

  sendBotMessage(message, delay = 0) {
    setTimeout(() => {
      const messagesContainer = document.getElementById('ai-chat-messages');
      const messageHTML = `
        <div class="ai-message ai-message-bot">
          <div class="ai-message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            </svg>
          </div>
          <div class="ai-message-content">${message}</div>
        </div>
      `;
      messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
      this.scrollToBottom();

      this.conversationHistory.push({ role: 'bot', message });
      this.saveConversationToStorage();
    }, delay);
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const typingHTML = `
      <div class="ai-message ai-message-bot ai-typing" id="ai-typing">
        <div class="ai-message-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          </svg>
        </div>
        <div class="ai-message-content">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typing = document.getElementById('ai-typing');
    if (typing) typing.remove();
  }

  showQuickReplies(replies) {
    const container = document.getElementById('ai-chat-quick-replies');
    container.innerHTML = '<div class="ai-quick-replies-title">Schnelle Antworten:</div>';

    replies.forEach(reply => {
      const button = document.createElement('button');
      button.className = 'ai-quick-reply';
      button.textContent = reply.text;
      button.addEventListener('click', () => {
        this.addUserMessage(reply.text);
        container.innerHTML = '';

        setTimeout(() => {
          this.hideTypingIndicator();
          if (reply.response) {
            this.sendBotMessage(reply.response);
          }
          if (reply.action) {
            reply.action();
          }
        }, 800);

        this.showTypingIndicator();
      });
      container.appendChild(button);
    });
  }

  processUserMessage(message) {
    const lowerMessage = message.toLowerCase();

    // Preis-Anfrage
    if (lowerMessage.includes('preis') || lowerMessage.includes('kosten') || lowerMessage.includes('chf')) {
      this.handlePriceInquiry();
      return;
    }

    // Kontakt / Meeting
    if (lowerMessage.includes('termin') || lowerMessage.includes('call') || lowerMessage.includes('gespräch')) {
      this.handleMeetingRequest();
      return;
    }

    // KI-Assistent
    if (lowerMessage.includes('ki') || lowerMessage.includes('assistant') || lowerMessage.includes('chatbot')) {
      this.handleAIInquiry();
      return;
    }

    // Portfolio / Referenzen
    if (lowerMessage.includes('referenz') || lowerMessage.includes('beispiel') || lowerMessage.includes('portfolio')) {
      this.handlePortfolioInquiry();
      return;
    }

    // Branche / Ziel erfassen
    if (this.stage === 'qualifying') {
      this.handleQualifyingResponse(message);
      return;
    }

    // Default: Lead qualifizieren
    this.startQualification();
  }

  // ============================================
  // OpenAI API Integration
  // ============================================
  async getOpenAIResponse(userMessage) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            ...this.conversationHistory.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.message
            })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('OpenAI API Fehler:', error);

      // Fallback zu rule-based responses
      return this.getFallbackResponse(userMessage);
    }
  }

  getSystemPrompt() {
    return `ROLLE
Du bist der Website- & KI-Sales Assistant von „StudioName" (Vorname1 + Vorname2).
Du schreibst auf Deutsch (Schweiz), kurz, klar, aktiv, ohne Emojis.

MISSION
- Verwandle jede Anfrage in eine qualifizierte Projektanfrage.
- Verkaufe StudioName überzeugend, aber immer wahrheitsgemäss.
- Keine erfundenen Referenzen, Zahlen, Kundenlogos, Awards oder Garantien.
- Wenn dir Infos fehlen: frage kurz nach oder formuliere als Option („typisch", „je nach Bedarf").

BRAND / TONALITÄT
- Clean, professionell, modern.
- Fokus auf Nutzen: mehr Anfragen, mehr Vertrauen, bessere Conversion, schnelle Ladezeit, sauberes Design.
- Keine Floskeln. Keine langen Romane.

KERNANGEBOT (immer im Hinterkopf)
StudioName baut:
1) Professionelle Websites (Design + Development)
2) Performance + SEO Basics (Technik + Struktur)
3) Optional: KI-Assistent in die Website (Lead-Qualifizierung, FAQ, Termin/Anfrage, Produkt-/Service-Erklärung)

PREISE (Schweiz, CHF - immer als Orientierung)
- Landingpage (1 Seite): CHF 1'800 – 2'900
- Business Website (3-5 Seiten): CHF 3'200 – 5'400
- Premium Website (6-10 Seiten): CHF 5'900 – 7'900
- KI-Assistent (Add-on): + CHF 900 – 1'900 (je nach Komplexität)
Final nach kurzem Call (15 Min).

STANDARD-ARGUMENTE (nur wenn passend)
- Mobile-first, schnell, sauberer Code, klarer Aufbau.
- Starkes UI/UX: klare CTA, bessere Nutzerführung.
- KI-Assistent: beantwortet Fragen 24/7, sammelt Leads, entlastet Support, steigert Abschlussquote.
- Umsetzung strukturiert: kurze Feedback-Loops, transparent, sauberer Launch.

REGELN FÜR ANTWORTEN
1) Erst klären, was der User will (max. 3 Fragen).
2) Dann sofort eine Empfehlung geben (konkret: Seitenstruktur + Features).
3) Immer mit einem CTA enden: „Soll ich dir ein Angebot erstellen?" oder „Willst du einen 15-min Call?"
4) Wenn der User nur „Preis?" fragt: Gib Preisspannen als Orientierung und sag klar: final nach kurzem Call.
5) Wenn der User uns mit anderen vergleicht: Hebe Prozess, Qualität, Speed, KI-Integration hervor. Keine Beleidigungen anderer.
6) Wenn der User nach Dingen fragt, die wir nicht anbieten: Sag es ehrlich. Biete Alternative oder Partnerlösung an.

LEAD-QUALIFIZIERUNG (kurz, effektiv)
Stelle je nach Kontext 2–3 Fragen:
- Branche + Ziel (Leads, Bewerbungen, Shop, Branding)?
- Umfang (1 Landingpage oder mehrere Seiten)?
- Deadline und Budget-Rahmen?
- KI-Assistent ja/nein? Welche Aufgaben soll er übernehmen?

OUTPUT-FORMAT (meistens)
- 3–6 Bulletpoints Nutzen/Plan
- 1 kurzer Vorschlag für nächste Schritte
- 1 klare Abschlussfrage (CTA)

BEISPIEL-CTA
- „Willst du, dass wir dir eine 1-Seiten-Struktur + grobe Offerte in CHF machen?"
- „Soll der KI-Assistent eher FAQ lösen oder Leads vorqualifizieren?"

WICHTIG
- Nutze HTML-Formatting: <br> für Zeilenumbrüche, <strong> für Fettdruck
- Halte Antworten unter 150 Wörtern
- Sei direkt und handlungsorientiert`;
  }

  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Fallback zu rule-based responses wenn API fehlschlägt
    if (lowerMessage.includes('preis') || lowerMessage.includes('kosten')) {
      return 'Preise: Landingpage CHF 1\'800-2\'900, Business Website CHF 3\'200-5\'400, Premium CHF 5\'900-7\'900. KI-Assistent +CHF 900-1\'900. Final nach kurzem Call. Willst du ein Angebot?';
    }

    if (lowerMessage.includes('hallo') || lowerMessage.includes('hi')) {
      return 'Hallo! Wie kann ich dir helfen? Brauchst du eine neue Website oder einen KI-Assistenten?';
    }

    return 'Interessant! Lass uns das besprechen. Brauchst du eine Website (1 Seite oder mehrere) oder einen KI-Assistenten? Oder willst du direkt Preise sehen?';
  }

  getGreetingMessage() {
    return `Hallo! Ich bin dein StudioName Assistant.<br><br>Ich helfe dir, die passende Website-Lösung zu finden – inkl. Struktur, Features und grobe Preiseinschätzung.<br><br>Was möchtest du wissen?`;
  }

  getGreetingQuickReplies() {
    return [
      {
        text: 'Website erstellen lassen',
        action: () => this.startQualification()
      },
      {
        text: 'Was kostet eine Website?',
        action: () => this.handlePriceInquiry()
      },
      {
        text: 'KI-Assistent integrieren',
        action: () => this.handleAIInquiry()
      }
    ];
  }

  startQualification() {
    this.stage = 'qualifying';
    this.sendBotMessage(`Perfekt! Damit ich dir die beste Lösung empfehlen kann, brauche ich kurz 3 Infos:`);

    setTimeout(() => {
      this.sendBotMessage(`1️⃣ <strong>Branche & Ziel:</strong><br>Wofür brauchst du die Website? (z.B. Leads generieren, Produkte verkaufen, Bewerbungen sammeln, Branding)`);
      this.showQuickReplies([
        { text: 'Leads generieren', action: () => this.setLeadData('ziel', 'Leads') },
        { text: 'Online-Shop', action: () => this.setLeadData('ziel', 'Shop') },
        { text: 'Bewerbungen', action: () => this.setLeadData('ziel', 'Recruiting') },
        { text: 'Branding / Präsenz', action: () => this.setLeadData('ziel', 'Branding') }
      ]);
    }, 1000);
  }

  setLeadData(key, value) {
    this.leadData[key] = value;

    if (key === 'ziel') {
      setTimeout(() => {
        this.sendBotMessage(`2️⃣ <strong>Umfang:</strong><br>Wie viele Seiten brauchst du ca.?`);
        this.showQuickReplies([
          { text: '1 Landingpage', action: () => this.setLeadData('umfang', '1 Seite') },
          { text: '3-5 Seiten', action: () => this.setLeadData('umfang', '3-5 Seiten') },
          { text: '6-10 Seiten', action: () => this.setLeadData('umfang', '6-10 Seiten') },
          { text: 'Mehr als 10', action: () => this.setLeadData('umfang', '10+ Seiten') }
        ]);
      }, 1000);
    }

    if (key === 'umfang') {
      setTimeout(() => {
        this.sendBotMessage(`3️⃣ <strong>KI-Assistent:</strong><br>Soll ein KI-Assistent integriert werden?`);
        this.showQuickReplies([
          { text: 'Ja, für FAQ & Leads', action: () => this.setLeadData('kiAssistant', 'Ja (FAQ + Leads)') },
          { text: 'Ja, nur für FAQ', action: () => this.setLeadData('kiAssistant', 'Ja (nur FAQ)') },
          { text: 'Nein, nicht nötig', action: () => this.setLeadData('kiAssistant', 'Nein') }
        ]);
      }, 1000);
    }

    if (key === 'kiAssistant') {
      setTimeout(() => {
        this.makeRecommendation();
      }, 1000);
    }
  }

  makeRecommendation() {
    this.stage = 'recommending';

    let recommendation = `<strong>Perfekt! Hier ist meine Empfehlung:</strong><br><br>`;

    // Basierend auf Umfang
    if (this.leadData.umfang === '1 Seite') {
      recommendation += `📄 <strong>Landingpage (1 Seite)</strong><br>`;
      recommendation += `• Klare Struktur: Hero, Leistungen, Social Proof, CTA<br>`;
      recommendation += `• Mobile-first, schnelle Ladezeit<br>`;
      recommendation += `• Kontaktformular mit Validierung<br>`;
      if (this.leadData.kiAssistant !== 'Nein') {
        recommendation += `• KI-Assistent für FAQ + Lead-Qualifizierung<br>`;
      }
      recommendation += `<br><strong>Preis:</strong> ca. CHF 1'800 – 2'900`;
    } else if (this.leadData.umfang === '3-5 Seiten') {
      recommendation += `📱 <strong>Business Website (3-5 Seiten)</strong><br>`;
      recommendation += `• Home, Über uns, Leistungen, Referenzen, Kontakt<br>`;
      recommendation += `• Professionelles Design + UX<br>`;
      recommendation += `• SEO-Grundlagen + Performance<br>`;
      if (this.leadData.kiAssistant !== 'Nein') {
        recommendation += `• KI-Assistent 24/7 verfügbar<br>`;
      }
      recommendation += `<br><strong>Preis:</strong> ca. CHF 3'200 – 5'400`;
    } else {
      recommendation += `🚀 <strong>Umfangreiche Website (${this.leadData.umfang})</strong><br>`;
      recommendation += `• Individuelle Struktur nach Bedarf<br>`;
      recommendation += `• Content-Management-System (CMS)<br>`;
      recommendation += `• Erweiterte Funktionen möglich<br>`;
      if (this.leadData.kiAssistant !== 'Nein') {
        recommendation += `• KI-Assistent mit Custom Training<br>`;
      }
      recommendation += `<br><strong>Preis:</strong> ca. CHF 5'900 – 7'900+`;
    }

    recommendation += `<br><br><strong>Nächster Schritt:</strong><br>`;
    recommendation += `Willst du ein detailliertes Angebot + 15-min Call?`;

    this.sendBotMessage(recommendation);

    setTimeout(() => {
      this.showQuickReplies([
        { text: 'Ja, Angebot erstellen', action: () => this.requestContact() },
        { text: 'Erst mehr Infos zu KI', action: () => this.handleAIInquiry() },
        { text: 'Preise anpassen', action: () => this.handlePriceInquiry() }
      ]);
    }, 1500);
  }

  requestContact() {
    this.stage = 'closing';
    this.sendBotMessage(`Super! Gib mir bitte kurz deine E-Mail, dann melden sich Vorname1 oder Vorname2 innerhalb von 24h mit einem konkreten Angebot.`);

    // Track Analytics Event
    if (window.gtag) {
      gtag('event', 'ai_assistant_lead', {
        'event_category': 'AI Assistant',
        'event_label': 'Contact Request',
        'value': 1
      });
    }
  }

  handlePriceInquiry() {
    const priceInfo = `<strong>Preisübersicht StudioName:</strong><br><br>

📄 <strong>Landingpage (1 Seite)</strong><br>
CHF 1'800 – 2'900<br>
<small>Inkl. Design, Development, Hosting-Setup</small><br><br>

📱 <strong>Business Website (3-5 Seiten)</strong><br>
CHF 3'200 – 5'400<br>
<small>Inkl. CMS, SEO-Basics, Performance</small><br><br>

🚀 <strong>Premium Website (6-10 Seiten)</strong><br>
CHF 5'900 – 7'900<br>
<small>Inkl. Custom Features, erweiterte Funktionen</small><br><br>

🤖 <strong>KI-Assistent (Add-on)</strong><br>
+ CHF 900 – 1'900<br>
<small>Je nach Komplexität & Training</small><br><br>

Finale Preise nach kurzem Call (15 Min). Willst du ein Angebot?`;

    this.sendBotMessage(priceInfo);

    setTimeout(() => {
      this.showQuickReplies([
        { text: 'Ja, Angebot anfordern', action: () => this.requestContact() },
        { text: 'Was ist im Preis enthalten?', action: () => this.explainPriceIncludes() }
      ]);
    }, 1500);
  }

  explainPriceIncludes() {
    this.sendBotMessage(`<strong>Im Preis enthalten:</strong><br><br>
✅ Professionelles Design (Mobile-first)<br>
✅ Sauberer Code (HTML/CSS/JS)<br>
✅ Performance-Optimierung<br>
✅ SEO-Grundlagen<br>
✅ Kontaktformular<br>
✅ DSGVO-konform (Cookie-Banner)<br>
✅ Hosting-Setup Unterstützung<br>
✅ 2-3 Feedback-Runden<br><br>

Optional: KI-Assistent, CMS, Shop-Funktion, Analytics`);
  }

  handleAIInquiry() {
    this.sendBotMessage(`<strong>KI-Assistent für deine Website:</strong><br><br>

🤖 <strong>Was er kann:</strong><br>
• Beantwortet FAQ 24/7<br>
• Qualifiziert Leads automatisch<br>
• Sammelt Kontaktdaten<br>
• Produktberatung / Service-Erklärung<br>
• Terminvereinbarung<br><br>

💰 <strong>Preis:</strong> CHF 900 – 1'900<br>
<small>(Je nach Umfang & Custom Training)</small><br><br>

⚡ <strong>Nutzen:</strong><br>
Mehr Leads, weniger Support-Aufwand, höhere Conversion<br><br>

Willst du den KI-Assistenten in deine Website integrieren?`);

    setTimeout(() => {
      this.showQuickReplies([
        { text: 'Ja, mit FAQ + Leads', action: () => this.setLeadData('kiAssistant', 'Ja (FAQ + Leads)') },
        { text: 'Nur FAQ', action: () => this.setLeadData('kiAssistant', 'Ja (nur FAQ)') },
        { text: 'Noch unsicher', action: () => this.sendBotMessage('Kein Problem! Wir können den KI-Assistenten auch später noch hinzufügen. Soll ich dir erst ein Website-Angebot machen?') }
      ]);
    }, 1500);
  }

  handlePortfolioInquiry() {
    this.sendBotMessage(`Auf unserer Website findest du unter "Arbeiten" aktuelle Projekte.<br><br>

Wir zeigen dort bewusst nur echte Cases – keine Mock-ups.<br><br>

<strong>Typische Branchen:</strong><br>
• B2B-Dienstleister<br>
• Beratung & Coaching<br>
• E-Commerce (klein/mittel)<br>
• Startups<br><br>

Willst du ein individuelles Angebot für dein Projekt?`);

    setTimeout(() => {
      this.showQuickReplies([
        { text: 'Ja, Angebot erstellen', action: () => this.requestContact() },
        { text: 'Erst Preise sehen', action: () => this.handlePriceInquiry() }
      ]);
    }, 1500);
  }

  handleMeetingRequest() {
    this.sendBotMessage(`Perfekt! Ein kurzer Call (15 Min) hilft, um:<br><br>

✅ Dein Projekt genau zu verstehen<br>
✅ Die beste Lösung zu finden<br>
✅ Ein konkretes Angebot zu machen<br><br>

Gib mir deine E-Mail und Vorname1/Vorname2 melden sich in 24h mit Terminvorschlägen.`);

    this.stage = 'closing';
  }

  handleProcessInquiry() {
    this.sendBotMessage(`<strong>Unser Prozess - Klar und effizient:</strong><br><br>

<strong>01 | Call + Ziele</strong><br>
Wir verstehen dein Business und definieren klare Ziele.<br><br>

<strong>02 | Design + Feedback</strong><br>
Du siehst früh ein klares Layout und gibst Feedback.<br><br>

<strong>03 | Umsetzung + Testing</strong><br>
Sauber gebaut, schnell geladen, auf allen Devices getestet.<br><br>

<strong>04 | Launch + Support</strong><br>
Live gehen, messen, optimieren.<br><br>

<strong>Dauer:</strong> Landingpage 2-4 Wochen, größere Projekte 4-8 Wochen.<br><br>

Willst du ein Angebot für dein Projekt?`);

    setTimeout(() => {
      this.showQuickReplies([
        { text: 'Ja, Angebot anfordern', action: () => this.requestContact() },
        { text: 'Erst Preise sehen', action: () => this.handlePriceInquiry() }
      ]);
    }, 1500);
  }

  handleQualifyingResponse(message) {
    // Speichere Antwort und fahre fort
    this.sendBotMessage(`Danke! Ich verarbeite deine Antwort...`);

    setTimeout(() => {
      this.makeRecommendation();
    }, 1000);
  }

  scrollToBottom() {
    const messages = document.getElementById('ai-chat-messages');
    messages.scrollTop = messages.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  saveConversationToStorage() {
    localStorage.setItem('studioname_chat_history', JSON.stringify(this.conversationHistory));
    localStorage.setItem('studioname_lead_data', JSON.stringify(this.leadData));
  }

  loadConversationFromStorage() {
    const history = localStorage.getItem('studioname_chat_history');
    const leadData = localStorage.getItem('studioname_lead_data');

    if (history) {
      this.conversationHistory = JSON.parse(history);
    }
    if (leadData) {
      this.leadData = JSON.parse(leadData);
    }
  }
}

// Initialize AI Assistant when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.studioNameAssistant = new StudioNameAssistant();
  });
} else {
  window.studioNameAssistant = new StudioNameAssistant();
}

