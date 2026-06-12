/* ChatWidget.jsx — i18n, autoplay-Script */

const { useState: useChatState, useRef: useChatRef, useEffect: useChatEffect } = React;

function ChatWidget({ autoplay }) {
  if (autoplay === undefined) {
    autoplay = typeof window !== "undefined" && window.__maseChatAutoplay !== false;
  }
  const { t, lang } = useT();

  const script = React.useMemo(() => [
    { role: "bot",  textKey: "chat_script_1", wait: 600  },
    { role: "user", textKey: "chat_script_2", wait: 1400 },
    { role: "bot",  textKey: "chat_script_3", wait: 1800 },
    { role: "user", textKey: "chat_script_4", wait: 1400 },
    { role: "bot",  textKey: "chat_script_5", wait: 1800 },
  ], []);

  const seedKeys = ["chat_seed_1", "chat_seed_2", "chat_seed_3", "chat_seed_4", "chat_seed_5"];

  const [messages, setMessages] = useChatState([]);
  const [typing, setTyping] = useChatState(false);
  const [draft, setDraft] = useChatState("");
  const bodyRef = useChatRef(null);
  const interactedRef = useChatRef(false);

  useChatEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  // Re-run autoplay when language changes so chat speaks the user's language.
  useChatEffect(() => {
    if (!autoplay) return;
    let cancelled = false;
    interactedRef.current = false;
    const run = async () => {
      setMessages([]);
      for (let i = 0; i < script.length; i++) {
        if (cancelled || interactedRef.current) return;
        const step = script[i];
        if (step.role === "bot") {
          setTyping(true);
          await wait(900);
          if (cancelled || interactedRef.current) return;
          setTyping(false);
          setMessages((m) => [...m, { role: step.role, textKey: step.textKey }]);
        } else {
          await wait(step.wait);
          if (cancelled || interactedRef.current) return;
          setMessages((m) => [...m, { role: step.role, textKey: step.textKey }]);
        }
        await wait(step.wait);
      }
      if (cancelled || interactedRef.current) return;
      await wait(2400);
      if (!cancelled && !interactedRef.current) run();
    };
    run();
    return () => { cancelled = true; };
  }, [autoplay, lang, script]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    interactedRef.current = true;
    setMessages((m) => [...m, { role: "user", text }]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const key = seedKeys[Math.floor(Math.random() * seedKeys.length)];
      setMessages((m) => [...m, { role: "bot", textKey: key }]);
    }, 900);
  };

  return (
    <div className="chat-widget" role="region" aria-label={t("chat_header")}>
      <div className="chat-header">
        <span className="chat-dot" />
        <p>{t("chat_header")}</p>
        <span className="chat-status">{t("chat_status")}</span>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            {m.textKey ? t(m.textKey) : m.text}
          </div>
        ))}
        {typing && (
          <div className="chat-message bot typing" aria-label={t("chat_typing_label")}>
            <span /><span /><span />
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          type="text"
          placeholder={t("chat_placeholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="send">{t("chat_send")}</button>
      </form>
    </div>
  );
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

window.ChatWidget = ChatWidget;
