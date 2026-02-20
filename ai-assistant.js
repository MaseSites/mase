// ============================================
// KI-SALES ASSISTANT für MASESites AG
// ============================================

// OpenAI API Configuration
const OPENAI_API_KEY = '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';
const OPENAI_MODEL = 'gpt-4';
const USE_OPENAI = false; // Setze auf true wenn API Key gültig ist

class MASEAssistant {
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
    this.stage = 'greeting';
    this.init();
  }

  init() {
    this.createChatWidget();
    this.loadConversationFromStorage();
  }

  createChatWidget() {
    const chatHTML = `
      <div class="ai-chat-widget" id="ai-chat-widget">
        <button class="ai-chat-toggle" id="ai-chat-toggle" aria-label="Mase-AI öffnen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="ai-chat-toggle-text">Mase-AI</span>
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
                <h3 class="ai-chat-title">Mase-AI</h3>
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
    setTimeout(() => {
      const bubble = document.getElementById('ai-welcome-bubble');
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

  toggleChat() {
    const container = document.getElementById('ai-chat-container');
    const isOpen = container.classList.toggle('open');

    if (isOpen) {
      this.hideWelcomeBubble();

      if (this.conversationHistory.length === 0) {
        this.showAIBenefitsBox();
        setTimeout(() => this.showLiveDemo(), 1000);
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
    this.sendBotMessage(`Hallo! Ich bin Mase-AI, dein digitaler Assistent.<br><br>Ich zeige dir kurz, wie ich arbeite...`);

    setTimeout(() => this.addUserMessage('Was bringt mir ein KI-Assistent?'), 1500);
    setTimeout(() => this.showTypingIndicator(), 1600);

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
    this.showTypingIndicator();

    try {
      let botResponse;

      if (USE_OPENAI && OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
        botResponse = await this.getOpenAIResponse(message);
      } else {
        botResponse = this.getIntelligentResponse(message);
      }

      this.hideTypingIndicator();
      this.sendBotMessage(botResponse);

    } catch (error) {
      console.error('Chat Error:', error);
      this.hideTypingIndicator();
      const response = this.getIntelligentResponse(message);
      this.sendBotMessage(response);
    }
  }

  getIntelligentResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Preis-Anfragen
    if (lowerMessage.includes('preis') || lowerMessage.includes('kosten') || lowerMessage.includes('chf')) {
      return `<strong>Preisübersicht MASESites:</strong><br><br>

📄 <strong>Überarbeitung:</strong><br>
Starter: CHF 250 | Plus: CHF 300 | Pro: CHF 1'000<br><br>

🌐 <strong>Neue Website:</strong><br>
Starter: CHF 750 | Business: CHF 1'300 | Premium: CHF 2'500<br><br>

🤖 <strong>KI-Assistent:</strong> +CHF 200 einmalig + CHF 40/Mt.<br><br>

Finale Preise nach kurzem Call. <a href="kontakt.html">Jetzt anfragen</a>`;
    }

    // KI-Assistent Anfragen
    if (lowerMessage.includes('ki') || lowerMessage.includes('assistent') || lowerMessage.includes('chatbot')) {
      return `<strong>KI-Assistent für deine Website:</strong><br><br>

🤖 <strong>Funktionen:</strong><br>
• Beantwortet FAQ 24/7<br>
• Qualifiziert Leads automatisch<br>
• Sammelt Kontaktdaten<br>
• Terminvereinbarung<br><br>

💰 <strong>Preis:</strong> CHF 200 einmalig + CHF 40/Mt.<br><br>

⚡ <strong>Nutzen:</strong> Mehr Leads, weniger Aufwand, höhere Conversion<br><br>

<a href="kontakt.html">Jetzt integrieren</a>`;
    }

    // Kontakt / Meeting
    if (lowerMessage.includes('termin') || lowerMessage.includes('call') || lowerMessage.includes('gespräch') || lowerMessage.includes('kontakt')) {
      return `Perfekt! Schreib uns direkt:<br><br>

📧 <strong>Email:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a><br>
📱 <strong>Telefon:</strong> <a href="tel:+41782158922">078 215 89 22</a><br><br>

Oder nutze unser <a href="kontakt.html">Kontaktformular</a><br><br>

Wir melden uns innerhalb von 24 Stunden!`;
    }

    // Prozess / Ablauf
    if (lowerMessage.includes('prozess') || lowerMessage.includes('ablauf') || lowerMessage.includes('wie läuft') || lowerMessage.includes('dauer')) {
      return `<strong>Unser Prozess:</strong><br><br>

<strong>01 | Analyse</strong> (1-2 Tage)<br>
Wir verstehen dein Business und definieren Ziele<br><br>

<strong>02 | Design & Entwicklung</strong> (2-6 Wochen)<br>
Du siehst früh Layout, gibst Feedback<br><br>

<strong>03 | Launch & Optimierung</strong> (1 Woche)<br>
Testing, Launch, Monitoring<br><br>

<a href="kontakt.html">Projekt starten</a>`;
    }

    // Leistungen
    if (lowerMessage.includes('leistung') || lowerMessage.includes('service') || lowerMessage.includes('was macht')) {
      return `<strong>MASESites Leistungen:</strong><br><br>

✅ <strong>Webdesign</strong> - Modern & conversion-optimiert<br>
✅ <strong>Webentwicklung</strong> - Sauber & performant<br>
✅ <strong>SEO & Performance</strong> - Schnell & sichtbar<br>
✅ <strong>KI-Assistent</strong> - 24/7 Kundenberatung<br><br>

<a href="leistungen.html">Mehr erfahren</a>`;
    }

    // Begrüßungen
    if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('guten tag') || lowerMessage.includes('hey')) {
      return `Hallo! 👋<br><br>Ich bin dein MASESites Assistant.<br><br>Ich helfe dir bei Fragen zu:<br>
• Website-Projekten<br>
• Preisen<br>
• KI-Integration<br>
• Projektablauf<br><br>

Was möchtest du wissen?`;
    }

    // Über uns
    if (lowerMessage.includes('über') || lowerMessage.includes('wer seid') || lowerMessage.includes('team')) {
      return `<strong>MASESites AG</strong><br><br>

Gegründet von Matteo & Severin<br><br>

🎯 <strong>Mission:</strong><br>
Moderne, klare und leistungsstarke Websites<br><br>

💡 <strong>Werte:</strong><br>
Ehrlichkeit • Qualität • Klare Kommunikation<br><br>

<a href="ueber-uns.html">Mehr über uns</a>`;
    }

    // Referenzen / Portfolio
    if (lowerMessage.includes('referenz') || lowerMessage.includes('beispiel') || lowerMessage.includes('portfolio') || lowerMessage.includes('projekt')) {
      return `Wir zeigen auf unserer Website nur <strong>echte Projekte</strong> - keine Mock-ups.<br><br>

<strong>Typische Branchen:</strong><br>
• B2B-Dienstleister<br>
• Beratung & Coaching<br>
• E-Commerce<br>
• Startups<br><br>

Jedes Projekt ist individuell. <a href="kontakt.html">Lass uns über deins sprechen</a>`;
    }

    // Default / Catch-all
    return `Interessante Frage! 💡<br><br>

Ich kann dir helfen bei:<br>
• <strong>Preisen</strong> für Website-Projekte<br>
• <strong>KI-Assistent</strong> Integration<br>
• <strong>Projektablauf</strong> & Zeitrahmen<br>
• Direkter <strong>Kontaktaufnahme</strong><br><br>

Was interessiert dich am meisten?<br><br>

Oder schreib uns direkt: <a href="mailto:info@masesites.ch">info@masesites.ch</a>`;
  }

  async getOpenAIResponse(userMessage) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
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
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  getSystemPrompt() {
    return `ROLLE
Du bist der Website- & KI-Sales Assistant von MASESites AG (Matteo & Severin).
Du schreibst auf Deutsch (Schweiz), kurz, klar, aktiv.

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
        this.showTypingIndicator();

        setTimeout(() => {
          this.hideTypingIndicator();
          if (reply.action) reply.action();
        }, 800);
      });
      container.appendChild(button);
    });
  }

  handlePriceInquiry() {
    const priceInfo = `<strong>Preisübersicht MASESites:</strong><br><br>

📄 <strong>Website Überarbeitung:</strong><br>
Starter: CHF 250<br>
Plus: CHF 300<br>
Pro: CHF 1'000<br><br>

🌐 <strong>Neue Website erstellen:</strong><br>
Starter: CHF 750 (1 Seite)<br>
Business: CHF 1'300 (3-5 Seiten)<br>
Premium: CHF 2'500 (6+ Seiten)<br><br>

🤖 <strong>KI-Assistent:</strong> +CHF 200 einmalig + CHF 40/Mt.<br><br>

Finale Preise nach kurzem Erstgespräch.<br><br>

<a href="kontakt.html" style="color: #6aa9ff; font-weight: 600;">Jetzt Projekt anfragen →</a>`;

    this.sendBotMessage(priceInfo);
  }

  handleAIInquiry() {
    this.sendBotMessage(`<strong>KI-Assistent für deine Website:</strong><br><br>

🤖 <strong>Was er kann:</strong><br>
• Beantwortet FAQ 24/7<br>
• Qualifiziert Leads automatisch<br>
• Sammelt Kontaktdaten<br>
• Produktberatung<br>
• Terminvereinbarung<br><br>

💰 <strong>Preis:</strong> CHF 200 einmalig + CHF 40/Mt.<br><br>

⚡ <strong>Nutzen:</strong><br>
Mehr Leads, weniger Support-Aufwand, höhere Conversion<br><br>

<a href="ki-assistent.html" style="color: #6aa9ff; font-weight: 600;">Mehr zum KI-Assistenten →</a>`);
  }

  handleProcessInquiry() {
    this.sendBotMessage(`<strong>Unser Prozess - Klar und effizient:</strong><br><br>

<strong>01 | Analyse</strong><br>
Wir verstehen dein Business und definieren klare Ziele.<br><br>

<strong>02 | Design & Entwicklung</strong><br>
Du siehst früh Layout und gibst Feedback.<br><br>

<strong>03 | Launch & Optimierung</strong><br>
Live gehen, messen, optimieren.<br><br>

<strong>Dauer:</strong> Landingpage 2-4 Wochen, größere Projekte 4-8 Wochen.<br><br>

<a href="kontakt.html" style="color: #6aa9ff; font-weight: 600;">Projekt starten →</a>`);
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
    try {
      localStorage.setItem('mase_chat_history', JSON.stringify(this.conversationHistory));
      localStorage.setItem('mase_lead_data', JSON.stringify(this.leadData));
    } catch (e) {
      console.log('Storage save failed:', e);
    }
  }

  loadConversationFromStorage() {
    try {
      const history = localStorage.getItem('mase_chat_history');
      const leadData = localStorage.getItem('mase_lead_data');

      if (history) this.conversationHistory = JSON.parse(history);
      if (leadData) this.leadData = JSON.parse(leadData);
    } catch (e) {
      console.log('Storage load failed:', e);
    }
  }
}

// Initialize AI Assistant when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.maseAssistant = new MASEAssistant();
  });
} else {
  window.maseAssistant = new MASEAssistant();
}

