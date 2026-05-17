/* ChatWidget.jsx — KI-Assistent embeddable chat with auto-replay + typing */

const { useState: useChatState, useRef: useChatRef, useEffect: useChatEffect } = React;

const SEED_REPLIES = [
  "Hallo! Wie kann ich dir helfen?",
  "Klar. Hinterlasse kurz deine Kontaktdaten, ich melde mich.",
  "Starter ab CHF 750. Finale Offerte nach kurzem Call.",
  "Der KI-Assistent kostet CHF 200 Setup + CHF 40 / Monat.",
  "Wir bauen alles mobile-first und SEO-optimiert.",
];

const SCRIPT = [
  { role: "bot",  text: "Hallo! Wie kann ich dir helfen?",                       wait: 600  },
  { role: "user", text: "Was kostet eine Website?",                               wait: 1400 },
  { role: "bot",  text: "Starter ab CHF 750. Finale Offerte nach kurzem Call.",   wait: 1800 },
  { role: "user", text: "Könnt ihr einen Termin einrichten?",                     wait: 1400 },
  { role: "bot",  text: "Klar. Hinterlasse kurz deine Kontaktdaten, ich melde mich.", wait: 1800 },
];

function ChatWidget({ autoplay }) {
  // Default ON, but allow runtime override via window flag (set by Tweaks).
  if (autoplay === undefined) {
    autoplay = typeof window !== "undefined" && window.__maseChatAutoplay !== false;
  }
  const [messages, setMessages] = useChatState([]);
  const [typing, setTyping] = useChatState(false);
  const [draft, setDraft] = useChatState("");
  const bodyRef = useChatRef(null);
  const timerRef = useChatRef(null);
  const interactedRef = useChatRef(false);

  // Auto-scroll on new content
  useChatEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  // Scripted autoplay loop
  useChatEffect(() => {
    if (!autoplay) return;
    let cancelled = false;
    const run = async () => {
      // start fresh each cycle
      setMessages([]);
      for (let i = 0; i < SCRIPT.length; i++) {
        if (cancelled || interactedRef.current) return;
        const step = SCRIPT[i];
        if (step.role === "bot") {
          setTyping(true);
          await wait(900);
          if (cancelled || interactedRef.current) return;
          setTyping(false);
          setMessages((m) => [...m, { role: step.role, text: step.text }]);
        } else {
          await wait(step.wait);
          if (cancelled || interactedRef.current) return;
          setMessages((m) => [...m, { role: step.role, text: step.text }]);
        }
        await wait(step.wait);
      }
      if (cancelled || interactedRef.current) return;
      await wait(2400);
      if (!cancelled && !interactedRef.current) run();
    };
    timerRef.current = run();
    return () => { cancelled = true; };
  }, [autoplay]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    interactedRef.current = true;
    setMessages((m) => [...m, { role: "user", text }]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply = SEED_REPLIES[Math.floor(Math.random() * SEED_REPLIES.length)];
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    }, 900);
  };

  return (
    <div className="chat-widget" role="region" aria-label="KI-Assistent">
      <div className="chat-header">
        <span className="chat-dot" />
        <p>MASESites KI-Assistent</p>
        <span className="chat-status">Online</span>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>{m.text}</div>
        ))}
        {typing && (
          <div className="chat-message bot typing" aria-label="Tippt">
            <span /><span /><span />
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          type="text"
          placeholder="Nachricht schreiben..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="send">Senden</button>
      </form>
    </div>
  );
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

window.ChatWidget = ChatWidget;
